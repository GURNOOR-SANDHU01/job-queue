import React from 'react';

export default function WorkerMonitor({ workers }) {
  return (
    <div style={{background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 16, marginBottom: 24}}>
      <h2>Workers</h2>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{background: '#f0f0f0'}}>
            <th>ID</th>
            <th>Heartbeat</th>
            <th>Current Job</th>
            <th>Jobs Processed</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {workers.map(w => (
            <tr key={w.id}>
              <td>{w.id}</td>
              <td>{w.heartbeat ? <span style={{color:'#388e3c'}}>Alive</span> : <span style={{color:'#d32f2f'}}>Dead</span>}</td>
              <td>{w.currentJob || '-'}</td>
              <td>{w.jobsProcessed}</td>
              <td>{w.lastActivity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
