const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379
});

// Promisify Redis commands for convenience
const { promisify } = require('util');
const lremAsync = promisify(client.lrem).bind(client);
const lpushAsync = promisify(client.lpush).bind(client);
const hgetallAsync = promisify(client.hgetall).bind(client);
const hsetAsync = promisify(client.hset).bind(client);
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const rpushAsync = promisify(client.rpush).bind(client);
const lpopAsync = promisify(client.lpop).bind(client);
const rpopAsync = promisify(client.rpop).bind(client);
const lrangeAsync = promisify(client.lrange).bind(client);
const delAsync = promisify(client.del).bind(client);
const zaddAsync = promisify(client.zadd).bind(client);
const zrangeAsync = promisify(client.zrange).bind(client);
const zremAsync = promisify(client.zrem).bind(client);
const zcardAsync = promisify(client.zcard).bind(client);
const llenAsync = promisify(client.llen).bind(client);

// Dead letter queue constants
const DEAD_LETTER_QUEUE = 'dead_letter_jobs';

// Worker heartbeat constants
const HEARTBEAT_KEY_PREFIX = 'worker:heartbeat:';
const WORKER_STATUS_KEY = 'worker:status';
const HEARTBEAT_INTERVAL = 5000; // ms
const HEARTBEAT_TIMEOUT = 15000; // ms

async function retryFailedJob(jobId) {
  // Get job data from failed jobs hash
  const job = await hgetallAsync(`failed:${jobId}`);
  if (!job) throw new Error('Job not found');
  // Remove from failed list
  await lremAsync('failed_jobs', 0, jobId);
  // Reset attempts and error
  job.attempts = 0;
  job.error = '';
  // Move job back to waiting queue
  await lpushAsync(`queue:${job.queue}`, jobId);
  await hsetAsync(`job:${jobId}`, 'state', 'waiting', 'attempts', 0, 'error', '');
  // Remove from failed hash
  await client.del(`failed:${jobId}`);
  return true;
}

async function moveToDeadLetter(jobId, job) {
  // Add jobId to dead letter queue
  await rpushAsync(DEAD_LETTER_QUEUE, jobId);
  // Store job data in a hash for dead jobs
  await hsetAsync(`dead:${jobId}`, ...Object.entries(job).flat());
  // Remove from failed_jobs list if present
  await lremAsync('failed_jobs', 0, jobId);
  // Remove from original job hash if needed
  await delAsync(`job:${jobId}`);
}

async function getFailedJobs() {
  const ids = await lrangeAsync('failed_jobs', 0, -1);
  const jobs = await Promise.all(ids.map(async id => {
    const job = await hgetallAsync(`job:${id}`);
    return { id, ...job };
  }));
  return jobs;
}

async function getDeadLetterJobs() {
  const ids = await lrangeAsync(DEAD_LETTER_QUEUE, 0, -1);
  const jobs = await Promise.all(ids.map(async id => {
    const job = await hgetallAsync(`dead:${id}`);
    return { id, ...job };
  }));
  return jobs;
}

async function requeueDeadJob(jobId) {
  const job = await hgetallAsync(`dead:${jobId}`);
  if (!job) throw new Error('Dead job not found');
  // Remove from dead letter queue
  await lremAsync(DEAD_LETTER_QUEUE, 0, jobId);
  // Remove from dead hash
  await delAsync(`dead:${jobId}`);
  // Reset attempts and error
  job.attempts = 0;
  job.error = '';
  // Move job back to waiting queue
  await lpushAsync(`queue:${job.queue}`, jobId);
  await hsetAsync(`job:${jobId}`, 'state', 'waiting', 'attempts', 0, 'error', '');
  return true;
}

// Track worker concurrency and active jobs in heartbeat
async function setWorkerHeartbeat(workerId, concurrency = 1, activeJobs = 0) {
  const now = Date.now();
  await setAsync(HEARTBEAT_KEY_PREFIX + workerId, now);
  await hsetAsync(WORKER_STATUS_KEY, workerId, JSON.stringify({ lastHeartbeat: now, status: 'alive', concurrency, activeJobs }));
}

async function getWorkerStatuses() {
  const statuses = await hgetallAsync(WORKER_STATUS_KEY) || {};
  const now = Date.now();
  return Object.entries(statuses).map(([id, val]) => {
    const data = JSON.parse(val);
    const alive = now - data.lastHeartbeat < HEARTBEAT_TIMEOUT;
    return {
      id,
      heartbeat: alive,
      lastActivity: new Date(data.lastHeartbeat).toLocaleString(),
      status: alive ? 'alive' : 'dead',
      ...data
    };
  });
}

// Priority queue helpers
async function addJobToQueue(queue, jobId, priority = 0) {
  // Use a sorted set for priority queue
  await zaddAsync(`queue:${queue}:priority`, priority, jobId);
}

async function getNextJobFromQueue(queue) {
  // Get job with highest priority (lowest score)
  const jobs = await zrangeAsync(`queue:${queue}:priority`, 0, 0);
  if (jobs.length === 0) return null;
  const jobId = jobs[0];
  await zremAsync(`queue:${queue}:priority`, jobId);
  return jobId;
}

async function getQueueSummary(queue) {
  // Count jobs by state and by priority
  const waiting = await zcardAsync(`queue:${queue}:priority`);
  const active = await llenAsync(`queue:${queue}:active`) || 0;
  const completed = await llenAsync(`queue:${queue}:completed`) || 0;
  const failed = await llenAsync(`queue:${queue}:failed`) || 0;
  return { name: queue, waiting, active, completed, failed };
}

// Add a function to enqueue jobs with priority
async function enqueueJob(queue, jobId, jobData, priority = 0) {
  // Store job data
  await hsetAsync(`job:${jobId}`, ...Object.entries(jobData).flat());
  // Add to priority queue
  await addJobToQueue(queue, jobId, priority);
}

// Update job state and timestamps
async function updateJobState(jobId, state, extra = {}) {
  const now = Date.now();
  const jobKey = `job:${jobId}`;
  const updates = { state };
  if (state === 'waiting') updates.queuedAt = now;
  if (state === 'active') updates.startedAt = now;
  if (state === 'completed') updates.completedAt = now;
  if (state === 'failed') updates.failedAt = now;
  Object.assign(updates, extra);
  await hsetAsync(jobKey, ...Object.entries(updates).flat());
}

async function moveToActive(queue, jobId) {
  await rpushAsync(`queue:${queue}:active`, jobId);
  await updateJobState(jobId, 'active');
  return true;
}

async function moveToCompleted(queue, jobId, result) {
  await lremAsync(`queue:${queue}:active`, 0, jobId);
  await rpushAsync(`queue:${queue}:completed`, jobId);
  await updateJobState(jobId, 'completed', { result: JSON.stringify(result) });
}

async function moveToFailed(queue, jobId, error) {
  await lremAsync(`queue:${queue}:active`, 0, jobId);
  await rpushAsync(`queue:${queue}:failed`, jobId);
  await rpushAsync('failed_jobs', jobId); // Add to global failed list
  await updateJobState(jobId, 'failed', { error: error.message || String(error) });
}

// Get full job metadata
async function getJobById(jobId) {
  return await hgetallAsync(`job:${jobId}`);
}

async function getQueueMetrics(queue) {
  // Get all jobs in the queue (waiting, active, completed, failed)
  // For demo, assume jobs are stored as job:<id> and job IDs are in sorted sets/lists
  const waitingIds = await zrangeAsync(`queue:${queue}:priority`, 0, -1);
  const completedIds = await lrangeAsync(`queue:${queue}:completed`, 0, -1);
  const failedIds = await lrangeAsync(`queue:${queue}:failed`, 0, -1);
  const allIds = [...waitingIds, ...completedIds, ...failedIds];
  const jobs = await Promise.all(allIds.map(id => hgetallAsync(`job:${id}`)));
  // Filter jobs with valid timestamps
  const completedJobs = jobs.filter(j => j && j.completedAt && j.createdAt);
  const latencies = completedJobs.map(j => Number(j.completedAt) - Number(j.createdAt));
  latencies.sort((a, b) => a - b);
  const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const p95Latency = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const total = jobs.length;
  const success = completedJobs.length;
  const failed = jobs.filter(j => j && j.state === 'failed').length;
  const successRate = total ? (success / total) * 100 : 0;
  const failureRate = total ? (failed / total) * 100 : 0;
  return { avgLatency, p95Latency, successRate, failureRate };
}

// Pause/resume queue
async function setQueuePaused(queue, paused) {
  await setAsync(`queue:${queue}:paused`, paused ? '1' : '0');
}
async function isQueuePaused(queue) {
  const val = await getAsync(`queue:${queue}:paused`);
  return val === '1';
}

module.exports = {
  client,
  retryFailedJob,
  moveToDeadLetter,
  getDeadLetterJobs,
  getFailedJobs,
  moveToActive,
  moveToCompleted,
  moveToFailed,
  requeueDeadJob,
  setWorkerHeartbeat,
  getWorkerStatuses,
  addJobToQueue,
  getNextJobFromQueue,
  getQueueSummary,
  enqueueJob,
  updateJobState,
  getJobById,
  getQueueMetrics,
  setQueuePaused,
  isQueuePaused,
};
