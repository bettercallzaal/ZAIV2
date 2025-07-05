// This is a simple boot script that loads our bundled app
// It doesn't require npm install to run

// Import the file system module
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

console.log('=== ZAO AI Bot Boot Script ===');
console.log('Checking for bundled application...');

// Path to the bundled app
const bundlePath = path.join(__dirname, 'bundle', 'bundle.cjs');

if (fs.existsSync(bundlePath)) {
  console.log(`Found bundled app at ${bundlePath}`);
  console.log('Starting bundled application...');
  
  // Execute the bundled app
  const bundleProcess = child_process.spawn('node', [bundlePath], {
    stdio: 'inherit', 
    env: process.env
  });
  
  bundleProcess.on('close', (code) => {
    console.log(`Bundled application exited with code ${code}`);
    process.exit(code);
  });
  
} else {
  console.error(`Error: Could not find bundled app at ${bundlePath}`);
  console.error('Please ensure the bundle directory contains bundle.cjs');
  process.exit(1);
}
