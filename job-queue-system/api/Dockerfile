FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files to root to resolve dependencies for shared modules
COPY api/package*.json ./
RUN npm install

# Copy source code
COPY api ./api
COPY queue ./queue

# Expose port
EXPOSE 5000

# Start command
WORKDIR /usr/src/app/api
CMD ["node", "server.js"]
