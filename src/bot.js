// ZAO AI Bot implementation using ElizaOS
import * as ElizaCore from '@elizaos/core';
import DiscordPlugin from '@elizaos/plugin-discord';

// Configure logging
const logger = ElizaCore.elizaLogger.child({ module: 'ZAOBot' });

/**
 * Initialize and start the ZAO AI Bot
 */
export async function startBot() {
  try {
    logger.info('Initializing ZAO AI Bot...');
    
    // Check required environment variables
    const requiredEnvVars = ['DISCORD_API_TOKEN', 'DISCORD_APPLICATION_ID'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    logger.info('Creating bot service...');
    const botService = ElizaCore.defineService({
      name: 'ZAO AI Bot',
      description: 'An AI guide bot powered by ElizaOS'
    });
    
    // Initialize Discord plugin
    logger.info('Initializing Discord plugin...');
    const discordPlugin = new DiscordPlugin({
      token: process.env.DISCORD_API_TOKEN,
      applicationId: process.env.DISCORD_APPLICATION_ID,
      intents: ['Guilds', 'GuildMessages', 'MessageContent', 'DirectMessages'],
    });
    
    // Create character
    logger.info('Creating character...');
    const character = ElizaCore.decryptedCharacter({
      name: 'ZAO',
      description: 'An AI guide that helps users navigate the world of AI and technology.'
    });
    
    // Register plugins and character with the service
    if (typeof botService.registerPlugin === 'function') {
      logger.info('Registering Discord plugin...');
      botService.registerPlugin(discordPlugin);
    } else {
      logger.warn('Service does not have registerPlugin method, trying alternative approaches...');
      
      // Try to attach the plugin directly to the character if possible
      if (character && typeof character.addPlugin === 'function') {
        logger.info('Adding Discord plugin to character...');
        character.addPlugin(discordPlugin);
      }
    }
    
    // Register character with service if possible
    if (typeof botService.registerCharacter === 'function') {
      logger.info('Registering character with service...');
      botService.registerCharacter(character);
    }
    
    // Start the service
    logger.info('Starting bot service...');
    if (typeof botService.start === 'function') {
      await botService.start();
      logger.info('Bot service started successfully');
    } else {
      logger.error('Service does not have a start method');
      throw new Error('Cannot start bot service: no start method available');
    }
    
    // Keep the process alive
    logger.info('Bot is now running');
    
  } catch (error) {
    logger.error('Failed to start bot:', error);
    throw error;
  }
}

// Handle process signals
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection:', reason);
  process.exit(1);
});
