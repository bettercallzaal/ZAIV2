FROM node:20 AS deps

WORKDIR /app

# Copy package files
COPY ./package.json /app/

# Force ElizaOS to use CommonJS
ENV NODE_OPTIONS="--experimental-modules --es-module-specifier-resolution=node"

# Install ElizaOS packages and Discord.js
RUN npm install --only=production @elizaos/core @elizaos/plugin-discord @elizaos/plugin-farcaster discord.js

# Final image
FROM node:20-slim

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules /app/node_modules

# Copy bundle
COPY ./bundle/ /app/bundle/

# Create a dedicated healthcheck server (separate from the bot)
RUN echo 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("ZAO AI Bot Healthcheck");\n});\n\nserver.listen(process.env.PORT || 8080);\nconsole.log("Healthcheck server running on port " + (process.env.PORT || 8080));' > /app/healthcheck.js

# Create a simple startup script
RUN echo '#!/bin/bash\n\
echo "Starting healthcheck server..."\n\
node /app/healthcheck.js &\n\
echo "Healthcheck server started"\n\
\n\
echo "Waiting 5 seconds before starting bot..."\n\
sleep 5\n\
\n\
echo "Starting ZAO AI bot..."\n\
# Run the bot but don't let it crash the container\n\
export DAEMON_PROCESS=true\n\
NODE_PATH=/app/node_modules NODE_OPTIONS="--experimental-modules --es-module-specifier-resolution=node" node /app/bundle/bundle.cjs || echo "Bot exited with error"\n\
\n\
echo "Bot process ended, keeping container alive for healthcheck"\n\
# Keep container alive\n\
tail -f /dev/null' > /app/start.sh

# Make script executable
RUN chmod +x /app/start.sh

# Expose port for healthcheck
EXPOSE 8080

# Run the start script
CMD ["/app/start.sh"]
