# Job Queue System with Real-Time Dashboard

A distributed job queue system designed to simulate large-scale backend processing. It uses Redis for queue management, a Node.js API for job ingestion and metrics, a background Worker service for job processing, and a React Dashboard for real-time monitoring and control.

## Overview

The system architecture consists of:
- **Dashboard**: A React frontend (served via Nginx) for visualizing queue metrics, managing jobs, and monitoring workers.
- **API**: A Node.js Express service that exposes endpoints for job creation, metrics retrieval, and queue management.
- **Worker**: A Node.js background worker that pulls jobs from Redis, processes them using simulated processors, and updates job status.
- **Redis**: The in-memory data store used for queues, job data, and worker coordination.

## Features

- **Multi-Queue Support**: Default queues include `default`, `email`, `image`, and `report`.
- **Job Lifecycle**: Jobs transition through `waiting` -> `active` -> `completed` or `failed` states.
- **Real-Time Monitoring**: WebSocket integration pushes live updates for queue sizes, job statuses, and worker health.
- **Simulated Processing**: Different job types have simulated processing times and failure rates.
- **Worker Telemetry**: Live tracking of worker instances, concurrency, and active tasks.
- **Advanced Job Control**: Pause/resume queues, retry failed jobs, and dead-letter queue management.

## Prerequisites

- **Docker** and **Docker Compose** installed on your machine.
- Node.js (optional, for local development outside Docker).

## Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd job-queue-system
    ```

2.  **Start the system using Docker Compose**:
    > **Note**: Ensure your Docker daemon is running. If you encounter socket connection issues, export the `DOCKER_HOST` environment variable before running the command.

    ```bash
    export DOCKER_HOST="unix:///var/run/docker.sock" # Adjust if needed
    docker-compose up -d --build
    ```

3.  **Access the Dashboard**:
    Open your browser to [http://localhost:3000](http://localhost:3000).

4.  **API Access**:
    The API is available at [http://localhost:5001](http://localhost:5001).

## Usage Guide

### Dashboard
The dashboard provides a visual interface to interact with the system:
- **System Metrics**: View overall throughput, success/failure rates, and latency.
- **Queue Summary**: Check the status of each queue (waiting, active, completed, failed).
- **Job Control**: Click on a queue to view jobs, retry failed jobs, or clear completed jobs.
- **Worker Monitor**: See active workers and their current load.

### API Endpoints

- **Add Job**: `POST /api/queues/:queueName/jobs`
    ```json
    {
      "type": "email",
      "payload": { "to": "user@example.com" },
      "priority": 1
    }
    ```
- **Get Metrics**: `GET /api/metrics`
- **Pause Queue**: `POST /api/queues/:queueName/pause`
- **Resume Queue**: `POST /api/queues/:queueName/resume`

## Project Structure

```
job-queue-system/
├── api/                # Express API service
│   ├── routes/         # API route handlers
│   ├── server.js       # Entry point
│   └── Dockerfile      # API Docker build
├── dashboard/          # React frontend
│   ├── frontend/       # Source code
│   │   ├── src/        # Components and logic
│   │   └── Dockerfile  # Dashboard Docker build
├── queue/              # Shared queue logic
│   └── queueManager.js # Redis client wrapper & logic
├── worker/             # Background worker service
│   ├── processors/     # Job processing logic
│   ├── worker.js       # Worker loop entry point
│   └── Dockerfile      # Worker Docker build
└── docker-compose.yml  # Container orchestration
```

## Troubleshooting

- **White Screen on Dashboard**: Ensure the API is running and returning valid JSON metrics. If necessary, rebuild the dashboard container.
- **Docker Connect Error**: If `docker-compose` fails with socket errors, check your `DOCKER_HOST` variable as mentioned in the Setup section.
- **No Data in Charts**: Wait for a few seconds. The API generates mock rolling time-series data which populates the graphs over time.
