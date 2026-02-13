import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import SystemMetrics from './SystemMetrics';
import QueueSummary from './QueueSummary';
import JobList from './JobList';
import FailedJobsPanel from './FailedJobsPanel';
import WorkerMonitor from './WorkerMonitor';
import TimeSeriesCharts from './TimeSeriesCharts';
import DeadLetterPanel from './DeadLetterPanel';

const API_BASE = 'http://localhost:5001/api';
const SOCKET_URL = 'http://localhost:5001';

function App() {
  const [metrics, setMetrics] = useState({});
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [failedJobs, setFailedJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [timeseries, setTimeseries] = useState({});

  useEffect(() => {
    // Initial fetch
    axios.get(`${API_BASE}/metrics`).then(r => setMetrics(r.data));
    axios.get(`${API_BASE}/queues`).then(r => setQueues(r.data));
    axios.get(`${API_BASE}/failed-jobs`).then(r => setFailedJobs(r.data));
    axios.get(`${API_BASE}/workers`).then(r => setWorkers(r.data));
    axios.get(`${API_BASE}/metrics/timeseries`).then(r => setTimeseries(r.data));
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('metrics', setMetrics);
    socket.on('queues', setQueues);
    socket.on('failedJobs', setFailedJobs);
    socket.on('workers', setWorkers);
    socket.on('timeseries', setTimeseries);
    return () => socket.disconnect();
  }, []);

  const handleQueueClick = (queueName) => {
    setSelectedQueue(queueName);
    axios.get(`${API_BASE}/queues/${queueName}/jobs`).then(r => setJobs(r.data));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f4f6fa', minHeight: '100vh', padding: 24 }}>
      <h1>Job Queue System Dashboard</h1>
      <SystemMetrics metrics={metrics} />
      <QueueSummary queues={queues} onQueueClick={handleQueueClick} />
      {selectedQueue && <JobList jobs={jobs} queue={selectedQueue} />}
      <FailedJobsPanel failedJobs={failedJobs} />
      <DeadLetterPanel />
      <WorkerMonitor workers={workers} />
      <TimeSeriesCharts data={timeseries} />
    </div>
  );
}

export default App;
