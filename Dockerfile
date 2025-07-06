FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install only the required dependencies
RUN npm install --omit=dev discord.js winston

# Copy all source files
COPY . .

# Create diagnostic log directory
RUN mkdir -p /app/logs

# Create .render-no-web-service file to prevent port scanning
RUN touch /app/.render-no-web-service

# Create healthcheck server file
RUN echo 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("Discord Bot Healthcheck");\n});\n\nserver.listen(process.env.PORT || 8080);\nconsole.log("Healthcheck server running on port " + (process.env.PORT || 8080));' > /app/healthcheck.cjs

# Set environment variables
ENV NODE_ENV=production
ENV RENDER_SERVICE_TYPE=worker

# Create startup script
RUN echo '#!/bin/bash\n\
echo "[STARTUP] $(date): Starting Standalone Discord Bot" > /app/logs/startup.log\n\
\n\
# Start healthcheck server\n\
node /app/healthcheck.cjs &\n\
HEALTHCHECK_PID=$!\n\
\n\
# Print environment info\n\
echo "Node.js version: $(node --version)" | tee -a /app/logs/startup.log\n\
echo "NPM version: $(npm --version)" | tee -a /app/logs/startup.log\n\
echo "Directory contents:" | tee -a /app/logs/startup.log\n\
ls -la | tee -a /app/logs/startup.log\n\
\n\
# Run the standalone discord bot\n\
echo "Starting Discord Bot..." | tee -a /app/logs/startup.log\n\
node --experimental-modules standalone-discord-bot.js 2>&1 | tee -a /app/logs/bot.log\n\
\n\
# If the bot exits, keep the container alive for logs\n\
if [ $? -ne 0 ]; then\n\
  echo "Bot exited with error code: $?" | tee -a /app/logs/startup.log\n\
  echo "Keeping container alive for log inspection" | tee -a /app/logs/startup.log\n\
  # Keep the healthcheck server running\n\
  wait $HEALTHCHECK_PID\n\
fi' > /app/start.sh

# Make script executable
RUN chmod +x /app/start.sh

# Expose port for healthcheck
EXPOSE 8080

# Command to run
CMD ["/app/start.sh"]
