const express = require('express');
const router = express.Router();
const queueManager = require('../../queue/queueManager');
const producers = require('../producers');

const DEFAULT_QUEUES = ['default', 'email', 'image', 'report'];

/* =========================
   SYSTEM METRICS
========================= */
router.get('/metrics', async (req, res) => {
  try {
    const totals = { waiting: 0, active: 0, completed: 0, failed: 0 };

    for (const q of DEFAULT_QUEUES) {
      const summary = await queueManager.getQueueSummary(q);
      totals.waiting += Number(summary.waiting) || 0;
      totals.active += Number(summary.active) || 0;
      totals.completed += Number(summary.completed) || 0;
      totals.failed += Number(summary.failed) || 0;
    }

    // Calculate derived metrics
    const totalJobs = totals.waiting + totals.active + totals.completed + totals.failed;
    const successRate = totalJobs > 0 ? (totals.completed / totalJobs) * 100 : 0;
    const failureRate = totalJobs > 0 ? (totals.failed / totalJobs) * 100 : 0;

    // Get latency from default queue for now, or aggregate if possible
    const defaultMetrics = await queueManager.getQueueMetrics('default');

    res.json({
      ...totals,
      totalJobs,
      successRate: successRate,
      failureRate: failureRate,
      avgLatency: defaultMetrics.avgLatency || 0,
      p95Latency: defaultMetrics.p95Latency || 0
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   PROMETHEUS METRICS
========================= */
router.get('/metrics/prometheus', async (req, res) => {
  try {
    const metrics = await queueManager.getQueueMetrics('default');

    let output = '';
    output += `job_queue_avg_latency ${metrics.avgLatency || 0}\n`;
    output += `job_queue_p95_latency ${metrics.p95Latency || 0}\n`;
    output += `job_queue_success_rate ${metrics.successRate || 0}\n`;
    output += `job_queue_failure_rate ${metrics.failureRate || 0}\n`;

    res.set('Content-Type', 'text/plain');
    res.send(output);
  } catch (e) {
    res.status(500).send(`# error: ${e.message}`);
  }
});

/* =========================
   QUEUE SUMMARY (FIXED)
========================= */
router.get('/queues', async (req, res) => {
  try {
    const summaries = [];

    for (const name of DEFAULT_QUEUES) {
      const metrics = await queueManager.getQueueMetrics(name);

      summaries.push({
        name,
        waiting: metrics.waiting || 0,
        active: metrics.active || 0,
        completed: metrics.completed || 0,
        failed: metrics.failed || 0,
        delayed: metrics.delayed || 0,
        status: metrics.paused ? 'paused' : 'active'
      });
    }

    res.json(summaries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   ENQUEUE JOB
========================= */
router.post('/queues/:queueName/jobs', async (req, res) => {
  const { type, payload, priority } = req.body;

  try {
    const jobId = await producers.produceJob(
      req.params.queueName,
      type,
      payload,
      priority || 0
    );

    res.json({ success: true, jobId });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* =========================
   PAUSE / RESUME QUEUE
========================= */
router.post('/queues/:queueName/pause', async (req, res) => {
  try {
    await queueManager.setQueuePaused(req.params.queueName, true);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/queues/:queueName/resume', async (req, res) => {
  try {
    await queueManager.setQueuePaused(req.params.queueName, false);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/queues/:queueName/paused', async (req, res) => {
  try {
    const paused = await queueManager.isQueuePaused(req.params.queueName);
    res.json({ paused });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   JOB ACTIONS
========================= */
router.post('/jobs/:jobId/retry', async (req, res) => {
  try {
    await queueManager.retryFailedJob(req.params.jobId);
    res.json({ success: true });
  } catch (e) {
    res.status(404).json({ success: false, error: e.message });
  }
});

router.post('/jobs/:jobId/requeue', async (req, res) => {
  try {
    await queueManager.requeueDeadJob(req.params.jobId);
    res.json({ success: true });
  } catch (e) {
    res.status(404).json({ success: false, error: e.message });
  }
});

/* =========================
   GET JOB BY ID (TIMELINE)
========================= */
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await queueManager.getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   FAILED JOBS
========================= */
router.get('/failed-jobs', async (req, res) => {
  try {
    const jobs = await queueManager.getFailedJobs?.() || [];
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   DEAD LETTER JOBS
========================= */
router.get('/dead-jobs', async (req, res) => {
  try {
    const jobs = await queueManager.getDeadLetterJobs();
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   WORKER STATUS
========================= */
router.get('/workers', async (req, res) => {
  try {
    const workers = await queueManager.getWorkerStatuses();
    res.json(workers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   TIME SERIES METRICS
========================= */
router.get('/metrics/timeseries', (req, res) => {
  // Generate mock rolling data (last 20 points)
  const now = Date.now();
  const points = [];
  for (let i = 19; i >= 0; i--) {
    const time = now - (i * 5000); // 5 seconds apart
    points.push({
      timestamp: new Date(time).toISOString(),
      queueSize: Math.floor(Math.random() * 20),
      throughput: Math.floor(Math.random() * 10),
      failureRate: Math.random() * 5,
      latency: Math.floor(Math.random() * 500 + 100)
    });
  }

  // Return as object expected by frontend or array?
  // Frontend App.js expects setTimeseries to set state. 
  // Let's check App.js... it passes 'timeseries' to TimeSeriesCharts.
  // TimeSeriesCharts usually expects array or object with arrays.
  // Previous code returned object with arrays. Let's stick to that structure but populate it.

  const data = {
    queueSize: points.map(p => ({ timestamp: p.timestamp, value: p.queueSize })),
    throughput: points.map(p => ({ timestamp: p.timestamp, value: p.throughput })),
    failureRate: points.map(p => ({ timestamp: p.timestamp, value: p.failureRate })),
    latency: points.map(p => ({ timestamp: p.timestamp, value: p.latency }))
  };

  res.json(data);
});

module.exports = router;
