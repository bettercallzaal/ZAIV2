FROM node:20

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev @elizaos/core @elizaos/plugin-discord

# Copy source files
COPY src/ ./src/

# Create dist directory if it doesn't exist
RUN mkdir -p dist

# Copy src to dist as we're using ES modules directly
RUN cp -r src/* dist/

# Create a simple healthcheck server
RUN echo 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("ZAO AI Bot Healthcheck");\n});\n\nserver.listen(process.env.PORT || 8080);\nconsole.log("Healthcheck server running on port " + (process.env.PORT || 8080));' > /app/healthcheck.cjs

# Set environment variables
ENV DAEMON_PROCESS=true
ENV NODE_ENV=production

# Create a startup script
RUN echo '#!/bin/bash\n\
echo "Starting ZAO AI Bot on Render..."\n\
\n\
# Start healthcheck server\n\
echo "Starting healthcheck server..."\n\
node /app/healthcheck.cjs &\n\
echo "Healthcheck server started with PID: $!"\n\
\n\
# Print environment info\n\
echo "Node.js version: $(node --version)"\n\
echo "NPM version: $(npm --version)"\n\
echo "Directory contents:"\n\
ls -la\n\
echo "Source files:"\n\
ls -la src/\n\
echo "Dist files:"\n\
ls -la dist/\n\
\n\
# Run the bot as an ES module\n\
echo "Starting ZAO AI Bot..."\n\
node --no-warnings --experimental-modules --es-module-specifier-resolution=node dist/index.js\n\
' > /app/start.sh

# Make script executable
RUN chmod +x /app/start.sh

# Expose port for healthcheck
EXPOSE 8080

# Command to run
CMD ["/app/start.sh"]
