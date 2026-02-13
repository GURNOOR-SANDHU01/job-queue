import React, { useState } from 'react';
import axios from 'axios';

export default function QueueSummary({ queues, onQueueClick }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: '', payload: '', priority: 0 });
  const [selectedQueue, setSelectedQueue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pausedQueues, setPausedQueues] = useState({});

  // Fetch paused status for all queues
  React.useEffect(() => {
    (async () => {
      const statuses = {};
      for (const q of queues) {
        try {
          const res = await axios.get(`/api/queues/${q.name}/paused`);
          statuses[q.name] = res.data.paused;
        } catch {}
      }
      setPausedQueues(statuses);
    })();
  }, [queues]);

  const handlePause = async (queue, paused) => {
    try {
      if (paused) {
        await axios.post(`/api/queues/${queue}/pause`);
      } else {
        await axios.post(`/api/queues/${queue}/resume`);
      }
      setPausedQueues(p => ({ ...p, [queue]: paused }));
    } catch {}
  };

  const handleEnqueue = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`/api/queues/${selectedQueue}/jobs`, {
        type: form.type,
        payload: form.payload,
        priority: Number(form.priority)
      });
      setSuccess('Job enqueued!');
      setForm({ type: '', payload: '', priority: 0 });
    } catch (e) {
      setError('Failed to enqueue job');
    }
    setLoading(false);
  };

  return (
    <div style={{background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 16, marginBottom: 24}}>
      <h2>Queues</h2>
      <button onClick={() => setShowForm(!showForm)} style={{marginBottom: 12, background:'#1976d2',color:'#fff',border:'none',borderRadius:4,padding:'6px 16px',cursor:'pointer'}}>Enqueue Job</button>
      {showForm && (
        <form onSubmit={handleEnqueue} style={{marginBottom: 16}}>
          <select required value={selectedQueue} onChange={e => setSelectedQueue(e.target.value)} style={{marginRight:8}}>
            <option value="">Select Queue</option>
            {queues.map(q => <option key={q.name} value={q.name}>{q.name}</option>)}
          </select>
          <input required placeholder="Type" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} style={{marginRight:8}} />
          <input required placeholder="Payload (JSON)" value={form.payload} onChange={e => setForm(f => ({...f, payload: e.target.value}))} style={{marginRight:8}} />
          <input type="number" placeholder="Priority (0=high)" value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} style={{width:80,marginRight:8}} />
          <button type="submit" disabled={loading} style={{background:'#388e3c',color:'#fff',border:'none',borderRadius:4,padding:'4px 12px',cursor:'pointer'}}>Enqueue</button>
          {error && <span style={{color:'red',marginLeft:8}}>{error}</span>}
          {success && <span style={{color:'green',marginLeft:8}}>{success}</span>}
        </form>
      )}
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{background: '#f0f0f0'}}>
            <th>Queue</th>
            <th>Waiting</th>
            <th>Active</th>
            <th>Completed</th>
            <th>Failed</th>
            <th>Delayed</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {queues.map(q => (
            <tr key={q.name} style={{cursor: 'pointer'}} onClick={() => onQueueClick(q.name)}>
              <td><b>{q.name}</b></td>
              <td>{q.waiting}</td>
              <td>{q.active}</td>
              <td>{q.completed}</td>
              <td>{q.failed}</td>
              <td>{q.delayed}</td>
              <td>
                <span style={{marginRight:8}}>
                  {pausedQueues[q.name] ? <span style={{color:'#ffa000'}}>Paused</span> : <span style={{color:'#388e3c'}}>Active</span>}
                </span>
                <button onClick={e => {e.stopPropagation(); handlePause(q.name, !pausedQueues[q.name]);}} style={{background:pausedQueues[q.name]?'#388e3c':'#ffa000',color:'#fff',border:'none',borderRadius:4,padding:'2px 8px',cursor:'pointer'}}>
                  {pausedQueues[q.name] ? 'Resume' : 'Pause'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
