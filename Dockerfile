FROM node:20

WORKDIR /app

# Copy essential files
COPY package.json /app/
COPY minimal-test.js /app/
COPY check-exports.js /app/
COPY star-import.js /app/
COPY actual-exports-test.js /app/

# Create a simple package.json with only required dependencies
RUN echo '{"type":"module","dependencies":{"@elizaos/core":"^0.1.0","@elizaos/plugin-discord":"^0.1.0"}}' > /app/simple-package.json

# Install only the essential dependencies
RUN npm install --omit=dev --omit=optional @elizaos/core @elizaos/plugin-discord

# Create a dedicated healthcheck server
RUN echo 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("ZAO AI Bot Healthcheck");\n});\n\nserver.listen(process.env.PORT || 8080);\nconsole.log("Healthcheck server running on port " + (process.env.PORT || 8080));' > /app/healthcheck.cjs

# Create a simple startup script
RUN echo '#!/bin/bash\n\
echo "Starting healthcheck server..."\n\
node /app/healthcheck.cjs &\n\
echo "Healthcheck server started"\n\
echo "Healthcheck server PID: $!"\n\
\n\
echo "Waiting 3 seconds before starting minimal test..."\n\
sleep 3\n\
\n\
echo "Starting minimal ElizaOS test..."\n\
# Set required environment variables\n\
export DAEMON_PROCESS=true\n\
\n\
# Print environment info\n\
echo "Node.js version: $(node --version)"\n\
echo "NPM version: $(npm --version)"\n\
echo "Directory contents:"\n\
ls -la\n\
\n\
# Run the star import test first\n\
echo "Running star import test..."\n\
node --no-warnings --experimental-modules star-import.js || echo "Star import test exited with error code: $?"\n\
\n\
# Run the actual exports test\n\
echo "\nRunning actual exports test..."\n\
node --no-warnings --experimental-modules actual-exports-test.js || echo "Actual exports test exited with error code: $?"\n\
\n\
echo "Test script ended, keeping container alive for healthcheck"\n\
# Keep container alive\n\
tail -f /dev/null' > /app/start.sh

# Make script executable
RUN chmod +x /app/start.sh

# Expose port for healthcheck
EXPOSE 8080

# Set environment variables
ENV RAILWAY_DEPLOYMENT=true
ENV DAEMON_PROCESS=true

# Run the start script
CMD ["/app/start.sh"]
