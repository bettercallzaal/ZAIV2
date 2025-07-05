FROM node:20

WORKDIR /app

# Copy all necessary files
COPY package.json package-lock.json ./
COPY src/ ./src/
COPY dist/ ./dist/

# Install dependencies
RUN npm install

# Set environment variable to disable interactive features
ENV DAEMON_PROCESS=true

# Create a simple startup script
RUN echo '#!/bin/bash\n\
echo "Starting ZAO AI Bot on Render..."\n\
echo "Node.js version: $(node --version)"\n\
echo "NPM version: $(npm --version)"\n\
\n\
# Run the bot as an ES module\n\
node --no-warnings --experimental-modules --es-module-specifier-resolution=node dist/index.js\n\
' > /app/start.sh

# Make script executable
RUN chmod +x /app/start.sh

# Command to run
CMD ["/app/start.sh"]
