// Worker entry point
const {
  setWorkerHeartbeat,
  getNextJobFromQueue,
  moveToActive,
  moveToCompleted,
  moveToFailed,
  isQueuePaused,
  getJobById
} = require('../queue/queueManager');
const processors = require('./processors');
const os = require('os');

const workerId = os.hostname() + '-' + process.pid;
const QUEUES = ['default', 'email', 'image', 'report'];
const DEFAULT_CONCURRENCY = 2;

let activeJobs = 0;
let running = true;

function startHeartbeat() {
  setInterval(() => {
    setWorkerHeartbeat(workerId, DEFAULT_CONCURRENCY, activeJobs);
  }, 5000);
}

async function processJob(queue, jobId) {
  activeJobs++;
  try {
    // 1. Move to active
    await moveToActive(queue, jobId);

    // 2. Get job data
    const jobData = await getJobById(jobId);
    if (!jobData) {
      throw new Error(`Job ${jobId} data missing`);
    }

    // 3. Select processor
    const processor = processors[queue] || processors.default;

    // 4. Process
    console.log(`[${workerId}] Processing ${queue} job ${jobId}`);
    const result = await processor({ id: jobId, ...jobData });

    // 5. Complete
    await moveToCompleted(queue, jobId, result);
    console.log(`[${workerId}] Completed ${queue} job ${jobId}`);
  } catch (error) {
    console.error(`[${workerId}] Failed ${queue} job ${jobId}:`, error);
    await moveToFailed(queue, jobId, error);
  } finally {
    activeJobs--;
  }
}

async function workerLoop() {
  console.log(`Worker ${workerId} started listening on queues: ${QUEUES.join(', ')}`);

  while (running) {
    let worked = false;

    // Round-robin through queues
    for (const queue of QUEUES) {
      if (activeJobs >= DEFAULT_CONCURRENCY) break;

      try {
        if (await isQueuePaused(queue)) continue;

        const jobId = await getNextJobFromQueue(queue);
        if (jobId) {
          // Don't await calling processJob - simulation of concurrency
          // In real Node.js, this is still single-threaded event loop, 
          // but async I/O allows "parallel" waiting.
          processJob(queue, jobId);
          worked = true;
        }
      } catch (err) {
        console.error(`Error in queue loop ${queue}:`, err);
      }
    }

    if (!worked) {
      // If no jobs found in any queue, wait a bit to avoid CPU spin
      await new Promise(r => setTimeout(r, 1000));
    } else {
      // If we found work, small yield to let I/O happen
      await new Promise(r => setImmediate(r));
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Worker shutting down...');
  running = false;
  // Wait for active jobs? (implied by Node process exit behavior if we awaited)
});

startHeartbeat();
workerLoop();
