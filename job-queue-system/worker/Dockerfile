FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files to root
COPY worker/package*.json ./
RUN npm install

# Copy source code
COPY worker ./worker
COPY queue ./queue

# Start command
WORKDIR /usr/src/app/worker
CMD ["node", "worker.js"]
