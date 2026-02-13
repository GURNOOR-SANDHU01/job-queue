import React from 'react';

export default function FailedJobsPanel({ failedJobs }) {
  return (
    <div style={{background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 16, marginBottom: 24}}>
      <h2>Failed Jobs</h2>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{background: '#f0f0f0'}}>
            <th>ID</th>
            <th>Error</th>
            <th>Retry History</th>
          </tr>
        </thead>
        <tbody>
          {failedJobs.map(j => (
            <tr key={j.id}>
              <td>{j.id}</td>
              <td><pre style={{fontSize: 11, background: '#f6f6f6', borderRadius: 4, padding: 4}}>{j.error}</pre></td>
              <td>{j.retryHistory && j.retryHistory.map((r,i) => <div key={i}>{r}</div>)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
