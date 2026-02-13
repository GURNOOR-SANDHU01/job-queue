import React from 'react';

export default function QueueSummary({ queues, onQueueClick }) {
  return (
    <div style={{background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 16, marginBottom: 24}}>
      <h2>Queues</h2>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{background: '#f0f0f0'}}>
            <th>Queue</th>
            <th>Waiting</th>
            <th>Active</th>
            <th>Completed</th>
            <th>Failed</th>
            <th>Delayed</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
