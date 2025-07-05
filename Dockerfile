FROM node:20-slim

WORKDIR /app

# Copy only the bundle directory and the start script
COPY ./bundle/ /app/bundle/
COPY ./start.sh /app/start.sh

# Make the start script executable
RUN chmod +x /app/start.sh

# Create healthcheck file
RUN echo 'const http = require("http"); \n\
const server = http.createServer((req, res) => { \n\
  res.writeHead(200, { "Content-Type": "text/plain" }); \n\
  res.end("ZAO AI Bot is running"); \n\
}); \n\
\n\
server.listen(process.env.PORT || 3000); \n\
console.log("Healthcheck server running on port " + (process.env.PORT || 3000));' > /app/healthcheck.js

# Create a startup script
RUN echo '#!/bin/bash\n\
echo "Starting ZAO AI Bot..."\n\
node /app/bundle/bundle.cjs > /proc/1/fd/1 2>/proc/1/fd/2 &\n\
BOT_PID=$!\n\
echo "Bot started with PID: $BOT_PID"\n\
\n\
echo "Starting healthcheck server..."\n\
node /app/healthcheck.js > /proc/1/fd/1 2>/proc/1/fd/2 &\n\
HEALTH_PID=$!\n\
echo "Healthcheck server started with PID: $HEALTH_PID"\n\
\n\
wait $BOT_PID\n\
wait $HEALTH_PID' > /app/start-services.sh

# Make it executable
RUN chmod +x /app/start-services.sh

# Expose port for healthcheck
EXPOSE 3000

# Set the entrypoint command
CMD ["/app/start-services.sh"]
