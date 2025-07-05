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

# Expose port for healthcheck
EXPOSE 3000

# Set the entrypoint command - run both the bot and healthcheck
CMD ["sh", "-c", "node /app/bundle/bundle.cjs & node /app/healthcheck.js"]
