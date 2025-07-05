// Main entry point for ZAO AI Bot
import { startBot } from './bot.js';

console.log('=== ZAO AI Bot ===');
console.log('Node version:', process.version);
console.log('Starting in', process.env.NODE_ENV || 'development', 'mode');

// Check if running in daemon mode
if (process.env.DAEMON_PROCESS === 'true') {
  console.log('Running in daemon mode (non-interactive)');
}

// Start the bot
try {
  console.log('Initializing bot...');
  startBot()
    .then(() => {
      console.log('Bot started successfully');
    })
    .catch((error) => {
      console.error('Failed to start bot:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Error during initialization:', error);
  process.exit(1);
}

// Keep the process alive
if (process.env.DAEMON_PROCESS === 'true') {
  console.log('Process will be kept alive');
  
  // Prevent the Node.js process from exiting
  setInterval(() => {
    console.log('Bot is still running:', new Date().toISOString());
  }, 60 * 60 * 1000); // Log once per hour
}
