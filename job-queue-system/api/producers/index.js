// Job producers
const { enqueueJob } = require('../../queue/queueManager');
const { v4: uuidv4 } = require('uuid');

// Example: Enqueue a job with priority
async function produceJob(queue, type, payload, priority = 0) {
  const jobId = uuidv4();
  const jobData = {
    id: jobId,
    type,
    queue,
    payload,
    state: 'waiting',
    priority,
    attempts: 0,
    createdAt: Date.now(),
  };
  await enqueueJob(queue, jobId, jobData, priority);
  return jobId;
}

module.exports = {
  produceJob,
};
