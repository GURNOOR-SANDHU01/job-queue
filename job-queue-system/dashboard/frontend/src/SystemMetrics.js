import React from 'react';

function card(label, value, color) {
  return (
    <div style={{ background: color, color: '#fff', borderRadius: 8, padding: 16, minWidth: 120, marginRight: 16, boxShadow: '0 2px 8px #0001' }}>
      <div style={{ fontSize: 14, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function SystemMetrics({ metrics }) {
  return (
    <div style={{ display: 'flex', marginBottom: 24 }}>
      {card('Total Jobs', metrics.totalJobs, '#1976d2')}
      {card('Waiting', metrics.waiting, '#ffa000')}
      {card('Active', metrics.active, '#0288d1')}
      {card('Completed', metrics.completed, '#388e3c')}
      {card('Failed', metrics.failed, '#d32f2f')}
      {card('Delayed', metrics.delayed, '#7b1fa2')}
      {card('Throughput (jobs/sec)', metrics.throughput, '#455a64')}
      {card('Avg Latency (ms)', metrics.avgLatency, '#607d8b')}
      {card('p95 Latency (ms)', metrics.p95Latency, '#ffa000')}
      {card('Success Rate (%)', Number(metrics.successRate || 0).toFixed(2), '#388e3c')}
      {card('Failure Rate (%)', Number(metrics.failureRate || 0).toFixed(2), '#d32f2f')}
    </div>
  );
}
