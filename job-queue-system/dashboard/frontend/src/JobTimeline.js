import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function JobTimeline({ jobId, onClose }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;
    axios.get(`/api/jobs/${jobId}`)
      .then(r => setJob(r.data))
      .catch(() => setError('Failed to load job details'));
  }, [jobId]);

  if (!jobId) return null;
  if (error) return <div style={{color:'red'}}>{error}</div>;
  if (!job) return <div>Loading...</div>;

  const timeline = [
    { label: 'Created', ts: job.createdAt },
    { label: 'Queued', ts: job.queuedAt },
    { label: 'Started', ts: job.startedAt },
    { label: job.completedAt ? 'Completed' : (job.failedAt ? 'Failed' : ''), ts: job.completedAt || job.failedAt, error: job.error }
  ].filter(e => e.ts);

  const latency = job.completedAt && job.createdAt ? (job.completedAt - job.createdAt) : null;

  return (
    <div style={{position:'fixed',top:0,right:0,width:400,height:'100%',background:'#fff',boxShadow:'-2px 0 8px #0002',zIndex:1000,padding:24,overflowY:'auto'}}>
      <button onClick={onClose} style={{position:'absolute',top:16,right:16,fontSize:18}}>×</button>
      <h2>Job Timeline</h2>
      <div><b>ID:</b> {job.id}</div>
      <div><b>Type:</b> {job.type}</div>
      <div><b>Queue:</b> {job.queue}</div>
      <div><b>Priority:</b> {job.priority}</div>
      <div><b>Attempts:</b> {job.attempts}</div>
      <div><b>Latency:</b> {latency !== null ? `${latency} ms` : 'N/A'}</div>
      <div style={{margin:'24px 0'}}>
        {timeline.map((e,i) => (
          <div key={i} style={{marginBottom:16,paddingLeft:16,borderLeft:'4px solid #1976d2'}}>
            <div style={{fontWeight:600}}>{e.label}</div>
            <div style={{fontSize:13,color:'#555'}}>{e.ts && new Date(Number(e.ts)).toLocaleString()}</div>
            {e.error && <div style={{color:'#d32f2f',fontSize:13}}>{e.error}</div>}
          </div>
        ))}
      </div>
      <div>
        <b>Payload:</b>
        <pre style={{background:'#f6f6f6',borderRadius:4,padding:8}}>{JSON.stringify(job.payload, null, 2)}</pre>
      </div>
    </div>
  );
}
