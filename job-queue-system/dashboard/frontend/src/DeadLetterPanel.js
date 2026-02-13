import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function DeadLetterPanel() {
  const [deadJobs, setDeadJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDeadJobs();
  }, []);

  const fetchDeadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/dead-jobs');
      setDeadJobs(res.data);
    } catch (e) {
      setError('Failed to load dead letter jobs');
    }
    setLoading(false);
  };

  const handleRequeue = async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`/api/jobs/${jobId}/requeue`);
      fetchDeadJobs();
    } catch (e) {
      setError('Requeue failed');
    }
    setLoading(false);
  };

  return (
    <div style={{background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 16, marginBottom: 24}}>
      <h2>Dead Letter Queue</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{background: '#f0f0f0'}}>
            <th>ID</th>
            <th>Type</th>
            <th>Queue</th>
            <th>Error</th>
            <th>Attempts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {deadJobs.map(j => (
            <tr key={j.id}>
              <td>{j.id}</td>
              <td>{j.type}</td>
              <td>{j.queue}</td>
              <td><pre style={{fontSize: 11, background: '#f6f6f6', borderRadius: 4, padding: 4}}>{j.error}</pre></td>
              <td>{j.attempts}</td>
              <td><button onClick={() => handleRequeue(j.id)} disabled={loading} style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:4,padding:'4px 8px',cursor:'pointer'}}>Requeue</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
