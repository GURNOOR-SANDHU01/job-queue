import React, { useEffect, useState } from "react";

const OverviewCards = () => {
  const [metrics, setMetrics] = useState({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    throughput: 0,
    avgLatency: 0,
  });

  const fetchMetrics = async () => {
    try {
      const res = await fetch("http://localhost:5000/metrics/overview");
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error("Metrics fetch failed", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const Card = ({ title, value }) => (
    <div style={styles.card}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );

  return (
    <div style={styles.grid}>
      <Card title="Waiting" value={metrics.waiting} />
      <Card title="Active" value={metrics.active} />
      <Card title="Completed" value={metrics.completed} />
      <Card title="Failed" value={metrics.failed} />
      <Card title="Delayed" value={metrics.delayed} />
      <Card title="Throughput (jobs/s)" value={metrics.throughput} />
      <Card title="Avg Latency (ms)" value={metrics.avgLatency} />
    </div>
  );
};

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginTop: "20px",
  },
  card: {
    padding: "16px",
    borderRadius: "12px",
    background: "#111",
    color: "#fff",
    textAlign: "center",
  },
};

export default OverviewCards;
