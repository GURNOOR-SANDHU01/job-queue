import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ChartCard({ title, data, dataKey, color }) {
  return (
    <div style={{background:'#fff',borderRadius:8,boxShadow:'0 2px 8px #0001',padding:16,marginRight:24,marginBottom:24,width:400}}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TimeSeriesCharts({ data }) {
  return (
    <div style={{display:'flex',flexWrap:'wrap'}}>
      <ChartCard title="Queue Size" data={data.queueSize||[]} dataKey="value" color="#1976d2" />
      <ChartCard title="Throughput" data={data.throughput||[]} dataKey="value" color="#388e3c" />
      <ChartCard title="Failure Rate" data={data.failureRate||[]} dataKey="value" color="#d32f2f" />
      <ChartCard title="Latency" data={data.latency||[]} dataKey="value" color="#ffa000" />
    </div>
  );
}
