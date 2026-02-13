import React, { useState } from 'react';

const states = ['waiting', 'active', 'completed', 'failed', 'dead'];

function badge(state) {
  const colors = {
    waiting: '#ffa000',
    active: '#0288d1',
    completed: '#388e3c',
    failed: '#d32f2f',
    dead: '#616161'
  };
  return <span style={{background: colors[state], color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12}}>{state}</span>;
}

export default function JobList({ jobs, queue }) {
  const [tab, setTab] = useState('waiting');
  const filtered = jobs.filter(j => j.state === tab);
  return (
    <div style={{background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 16, marginBottom: 24}}>
      <h2>Jobs in {queue}</h2>
      <div style={{marginBottom: 12}}>
        {states.map(s => (
          <button key={s} onClick={() => setTab(s)} style={{marginRight: 8, background: tab===s?'#1976d2':'#eee', color: tab===s?'#fff':'#333', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer'}}>{s}</button>
        ))}
      </div>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{background: '#f0f0f0'}}>
            <th>ID</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Attempts</th>
            <th>Timestamps</th>
            <th>Duration (ms)</th>
            <th>Payload</th>
            <th>State</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(j => (
            <tr key={j.id}>
              <td>{j.id}</td>
              <td>{j.type}</td>
              <td>{j.priority}</td>
              <td>{j.attempts}</td>
              <td>{j.timestamps && Object.entries(j.timestamps).map(([k,v]) => <div key={k}>{k}: {v}</div>)}</td>
              <td>{j.duration}</td>
              <td><pre style={{fontSize: 11, background: '#f6f6f6', borderRadius: 4, padding: 4, maxWidth: 200, overflow: 'auto'}}>{JSON.stringify(j.payloadPreview)}</pre></td>
              <td>{badge(j.state)}</td>
              <td>
                {j.state==='failed' && <button style={{background:'#d32f2f',color:'#fff',border:'none',borderRadius:4,padding:'4px 8px',cursor:'pointer'}}>Retry</button>}
                {j.state==='dead' && <button style={{background:'#616161',color:'#fff',border:'none',borderRadius:4,padding:'4px 8px',cursor:'pointer'}}>Requeue</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
