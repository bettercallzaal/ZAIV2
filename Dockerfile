FROM node:20-slim

WORKDIR /app

# Copy our HTTP-based Discord bot script
COPY http-discord-bot.js /app/

# Create .render-no-web-service file to prevent port scanning
RUN touch /app/.render-no-web-service

# Set environment variables
ENV NODE_ENV=production
ENV RENDER_SERVICE_TYPE=worker

# Create startup script
RUN echo '#!/bin/bash\n\
echo "[STARTUP] $(date): Starting Minimal Discord Bot"\n\
\n\
# Print environment info\n\
echo "Node.js version: $(node --version)"\n\
echo "Directory contents:"\n\
ls -la\n\
\n\
# Run the HTTP-based discord bot
echo "Starting Discord Bot..." \n\
node http-discord-bot.js\n\
\n\
# If the bot exits, keep the container alive for logs\n\
if [ $? -ne 0 ]; then\n\
  echo "Bot exited with error code: $?"\n\
  echo "Keeping container alive for log inspection"\n\
  # Keep the container running\n\
  tail -f /dev/null\n\
fi' > /app/start.sh

# Make script executable
RUN chmod +x /app/start.sh

EXPOSE 8080

# Command to run
CMD ["/app/start.sh"]
