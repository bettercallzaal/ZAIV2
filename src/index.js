// Main entry point for ZAO AI Bot
import ZAOBotService from './bot-service.js';

console.log('=== ZAO AI Bot ===');
console.log('Node version:', process.version);
console.log('Starting in', process.env.NODE_ENV || 'development', 'mode');

// Check if running in daemon mode
if (process.env.DAEMON_PROCESS === 'true') {
  console.log('Running in daemon mode (non-interactive)');
}

// Create and start the bot service
try {
  console.log('Creating bot service...');
  const botService = new ZAOBotService({
    name: 'ZAO AI Bot',
    description: 'An AI guide bot powered by ElizaOS'
  });
  
  console.log('Initializing bot service...');
  botService.initialize()
    .then(() => {
      console.log('Bot service initialized, starting...');
      return botService.start();
    })
    .then(() => {
      console.log('Bot service started successfully');
    })
    .catch((error) => {
      console.error('Failed to start bot service:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Error during initialization:', error);
  process.exit(1);
}

// Process is kept alive by the bot service in daemon mode
