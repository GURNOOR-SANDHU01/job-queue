// Entry point for API server
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const routes = require('./routes');
const queueManager = require('../queue/queueManager');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Start worker process when API server starts
const startWorker = () => {
  const worker = spawn('node', ['../../worker/worker.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  worker.on('close', (code) => {
    console.log(`Worker process exited with code ${code}`);
  });
};

// Only start worker if not running in Docker Compose (API and worker are separate services)
if (process.env.COMPOSE_PROJECT_NAME === undefined) {
  startWorker();
}

const DEFAULT_QUEUES = ['default', 'email', 'image', 'report'];

// WebSocket: emit real-time updates
io.on('connection', (socket) => {
  console.log('Dashboard client connected');

  // Send initial data immediately
  emitMetrics(socket);

  socket.on('disconnect', () => {
    console.log('Dashboard client disconnected');
  });
});

async function emitMetrics(socket = io) {
  try {
    // 1. Queue Summaries
    const queues = await Promise.all(DEFAULT_QUEUES.map(q => queueManager.getQueueSummary(q)));
    socket.emit('queues', queues);

    // 2. System Metrics (aggregate)
    const totals = { waiting: 0, active: 0, completed: 0, failed: 0 };
    for (const q of queues) {
      totals.waiting += Number(q.waiting) || 0;
      totals.active += Number(q.active) || 0;
      totals.completed += Number(q.completed) || 0;
      totals.failed += Number(q.failed) || 0;
    }
    const totalJobs = totals.waiting + totals.active + totals.completed + totals.failed;

    // Get latency from default queue for now
    const defaultMetrics = await queueManager.getQueueMetrics('default');

    socket.emit('metrics', {
      ...totals,
      totalJobs,
      successRate: totalJobs > 0 ? (totals.completed / totalJobs) * 100 : 0,
      failureRate: totalJobs > 0 ? (totals.failed / totalJobs) * 100 : 0,
      avgLatency: defaultMetrics.avgLatency || 0,
      p95Latency: defaultMetrics.p95Latency || 0
    });

    // 3. Workers
    const workers = await queueManager.getWorkerStatuses();
    socket.emit('workers', workers);

    // 4. Failed Jobs
    const failedJobs = await queueManager.getFailedJobs();
    socket.emit('failedJobs', failedJobs);

    // 5. Time Series (mocked)
    const now = Date.now();
    const points = [];
    for (let i = 19; i >= 0; i--) {
      const time = now - (i * 5000);
      points.push({
        timestamp: new Date(time).toISOString(),
        queueSize: Math.floor(Math.random() * 20),
        throughput: Math.floor(Math.random() * 10),
        failureRate: Math.random() * 5,
        latency: Math.floor(Math.random() * 500 + 100)
      });
    }
    const timeseriesData = {
      queueSize: points.map(p => ({ timestamp: p.timestamp, value: p.queueSize })),
      throughput: points.map(p => ({ timestamp: p.timestamp, value: p.throughput })),
      failureRate: points.map(p => ({ timestamp: p.timestamp, value: p.failureRate })),
      latency: points.map(p => ({ timestamp: p.timestamp, value: p.latency }))
    };
    socket.emit('timeseries', timeseriesData);

  } catch (err) {
    console.error('Error emitting metrics:', err);
  }
}

// Poll every 2 seconds
setInterval(() => emitMetrics(io), 2000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
