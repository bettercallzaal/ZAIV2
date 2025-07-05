FROM node:20

WORKDIR /app

# Copy package.json and all source files
COPY package*.json /app/
COPY src/ /app/src/
COPY dist/ /app/dist/
COPY tsconfig.json /app/
COPY debug-elizaos.js /app/

# Install all dependencies (including devDependencies)
RUN npm install

# Create a dedicated healthcheck server (separate from the bot) with .cjs extension for CommonJS
RUN echo 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("ZAO AI Bot Healthcheck");\n});\n\nserver.listen(process.env.PORT || 8080);\nconsole.log("Healthcheck server running on port " + (process.env.PORT || 8080));' > /app/healthcheck.cjs

# Create a simple startup script
RUN echo '#!/bin/bash\n\
echo "Starting healthcheck server..."\n\
node /app/healthcheck.cjs &\n\
echo "Healthcheck server started"\n\
echo "Healthcheck server PID: $!"\n\
\n\
echo "Waiting 3 seconds before starting ElizaOS bot..."\n\
sleep 3\n\
\n\
echo "Starting ElizaOS bot..."\n\
# Set required environment variables for Railway\n\
export DAEMON_PROCESS=true\n\
\n\
# Run the bot as an ES module with debug logging\n\
echo "DEBUG: Node.js version: $(node --version)"\n\
echo "DEBUG: Listing dist directory:"\n\
ls -la dist/\n\
echo "DEBUG: Checking for index.js:"\n\
cat dist/index.js | head -n 20\n\
echo "DEBUG: Setting NODE_DEBUG=*"\n\
export NODE_DEBUG=*\n\
echo "DEBUG: Running ElizaOS debug script first..."\n\
node --trace-warnings --no-warnings --experimental-modules --es-module-specifier-resolution=node debug-elizaos.js || echo "Debug script exited with error: $?"\n\
\n\
echo "DEBUG: Starting main bot with verbose logging"\n\
node --trace-warnings --no-warnings --experimental-modules --es-module-specifier-resolution=node dist/index.js || echo "Bot exited with error: $?"\n\
\n\
echo "Bot process ended, keeping container alive for healthcheck"\n\
# Keep container alive\n\
tail -f /dev/null' > /app/start.sh

# Make script executable
RUN chmod +x /app/start.sh

# Expose port for healthcheck
EXPOSE 8080

# Set environment variable to indicate we're in a Railway deployment
ENV RAILWAY_DEPLOYMENT=true
ENV DAEMON_PROCESS=true

# Run the start script
CMD ["/app/start.sh"]
