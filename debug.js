// Simple debug script to test the bundle directly
try {
  console.log('Starting debug script...');
  console.log('Node.js version:', process.version);
  console.log('Current directory:', process.cwd());
  console.log('Environment variables:', Object.keys(process.env));
  
  console.log('\nAttempting to load bundled bot...');
  // This will load our bundled app
  require('./bundle/bundle.cjs');
  
  console.log('Bundle loaded successfully!');
} catch (error) {
  console.error('ERROR LOADING BUNDLE:', error);
  console.error(error.stack);
}
