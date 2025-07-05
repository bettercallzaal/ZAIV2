#!/bin/bash

# This script prepares the bundled application for Railway deployment
# without requiring native module compilation

echo "Starting Railway setup process..."

# Skip full npm install, we just need the bundle
echo "Using pre-built bundle for deployment"

# Make bundle directory executable if it exists
if [ -d "./bundle" ]; then
  chmod -R 755 ./bundle
  echo "Bundle directory permissions updated"
else
  echo "WARNING: Bundle directory not found!"
fi

# Create a healthcheck endpoint file in the bundle directory
cat > bundle/healthcheck.js << 'EOL'
// Simple healthcheck endpoint for Railway
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ZAO AI Bot is running');
});

server.listen(process.env.PORT || 3000);
console.log('Healthcheck server running on port ' + (process.env.PORT || 3000));
EOL

echo "Setup completed successfully!"
