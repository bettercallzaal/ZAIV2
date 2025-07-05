FROM node:20

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY src/ ./src/

# Create dist directory if it doesn't exist
RUN mkdir -p dist

# Copy src to dist as we're using ES modules directly
RUN cp -r src/* dist/

# Set environment variable to disable interactive features
ENV DAEMON_PROCESS=true
ENV NODE_ENV=production

# Create a simple startup script
RUN echo '#!/bin/bash\n\
echo "Starting ZAO AI Bot on Render..."\n\
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
node --no-warnings --experimental-modules --es-module-specifier-resolution=node dist/index.js\n\
' > /app/start.sh

# Make script executable
RUN chmod +x /app/start.sh

# Command to run
CMD ["/app/start.sh"]
