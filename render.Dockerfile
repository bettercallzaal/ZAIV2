FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev @elizaos/core @elizaos/plugin-discord

# Add Winston for advanced logging
RUN npm install --save winston

# Copy all source files
COPY . .

# Create diagnostic log directory
RUN mkdir -p /app/logs

# Create .render-no-web-service file to prevent port scanning
RUN touch /app/.render-no-web-service

# Create healthcheck server file
COPY <<EOF /app/healthcheck.cjs
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ZAO AI Bot Healthcheck");
});

server.listen(process.env.PORT || 8080);
console.log("Healthcheck server running on port " + (process.env.PORT || 8080));
EOF

# Set environment variables
ENV DAEMON_PROCESS=true
ENV NODE_ENV=production
ENV DEBUG=elizaos:*
ENV RENDER_SERVICE_TYPE=worker

# Create startup script
COPY <<EOF /app/start.sh
#!/bin/sh

# Create diagnostic files
echo "[STARTUP] $(date): Starting ZAO AI Bot worker service" > /app/logs/startup.log

# Start healthcheck server
node /app/healthcheck.cjs &
HEALTHCHECK_PID=$!

# Print environment info
echo "Node.js version: $(node --version)" | tee -a /app/logs/startup.log
echo "NPM version: $(npm --version)" | tee -a /app/logs/startup.log
echo "Directory contents:" | tee -a /app/logs/startup.log
ls -la | tee -a /app/logs/startup.log
echo "Source files:" | tee -a /app/logs/startup.log
ls -la src/ | tee -a /app/logs/startup.log

# Run the worker script with full error logging
echo "Starting ZAO AI Bot Worker..." | tee -a /app/logs/startup.log
node --experimental-modules --es-module-specifier-resolution=node render-worker.js 2>&1 | tee -a /app/logs/bot.log

# If the bot exits, keep the container alive for logs
if [ $? -ne 0 ]; then
  echo "Bot exited with error code: $?" | tee -a /app/logs/startup.log
  echo "Keeping container alive for log inspection" | tee -a /app/logs/startup.log
  # Keep the healthcheck server running
  wait $HEALTHCHECK_PID
fi
EOF

# Make script executable
RUN chmod +x /app/start.sh

# Expose port for healthcheck
EXPOSE 8080

# Command to run
CMD ["/app/start.sh"]
