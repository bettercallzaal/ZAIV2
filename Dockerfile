FROM node:20-slim

WORKDIR /app

# Copy package.json and bundle files
COPY ./package.json /app/
COPY ./bundle/ /app/bundle/

# Install only the discord.js and other required dependencies
RUN npm install discord.js @discordjs/rest

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
NODE_PATH=/app/node_modules node /app/bundle/bundle.cjs || echo "Bot exited with error"\n\
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
