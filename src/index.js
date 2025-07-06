// Main entry point for ZAO AI Bot
import * as ElizaCore from '@elizaos/core';
import ZAOBotService from './bot-service.js';

console.log('=== ZAO AI Bot ===');
console.log('Node version:', process.version);
console.log('Starting in', process.env.NODE_ENV || 'development', 'mode');

// Check if running in daemon mode
if (process.env.DAEMON_PROCESS === 'true') {
  console.log('Running in daemon mode (non-interactive)');
}

// Log available ElizaCore methods for debugging
const elizaCoreMethods = Object.getOwnPropertyNames(ElizaCore);
console.log('Available ElizaCore methods:', elizaCoreMethods);

// Create and start the bot service
try {
  console.log('Creating bot service...');
  const botService = new ZAOBotService({
    name: 'ZAO AI Bot',
    description: 'An AI guide bot powered by ElizaOS'
  });
  
  console.log('Initializing bot service...');
  botService.initialize()
    .then(async () => {
      console.log('Bot service initialized');
      
      // Get the service class from the bot service
      const serviceClass = botService.serviceClass;
      if (serviceClass && typeof serviceClass.start === 'function') {
        console.log('Starting service directly using serviceClass.start()...');
        try {
          // Create a minimal runtime object
          const runtime = {};
          // Start the service directly
          await serviceClass.start(runtime);
          console.log('Service started directly using serviceClass.start()');
        } catch (startError) {
          console.error('Error starting service directly:', startError);
        }
      }
      
      console.log('Starting bot service...');
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
