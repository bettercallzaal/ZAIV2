/**
 * direct-discord-test.js
 * 
 * A minimal test script that directly initializes the Discord plugin
 * without any ElizaOS service registration
 */
import * as ElizaCore from '@elizaos/core';
import DiscordPlugin from '@elizaos/plugin-discord';
import winston from 'winston';

// Setup logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Log environment info
logger.info('=== DIRECT DISCORD TEST ===');
logger.info(`Node version: ${process.version}`);
logger.info('Environment variables:');
logger.info(`- DISCORD_API_TOKEN exists: ${!!process.env.DISCORD_API_TOKEN}`);
logger.info(`- DISCORD_APPLICATION_ID exists: ${!!process.env.DISCORD_APPLICATION_ID}`);

async function startDiscord() {
  try {
    logger.info('Starting Discord plugin directly...');
    
    // Configure Discord plugin
    const discordConfig = {
      token: process.env.DISCORD_API_TOKEN,
      applicationId: process.env.DISCORD_APPLICATION_ID
    };
    
    // Log Discord plugin type
    logger.info(`Discord plugin type: ${typeof DiscordPlugin}`);
    logger.info(`Discord plugin is a: ${DiscordPlugin.constructor ? DiscordPlugin.constructor.name : 'unknown'}`);
    
    // Initialize Discord plugin based on its type
    let discordPlugin;
    
    if (typeof DiscordPlugin === 'function') {
      logger.info('Creating Discord plugin with constructor');
      discordPlugin = new DiscordPlugin(discordConfig);
    } else if (typeof DiscordPlugin === 'object') {
      logger.info('Using Discord plugin as object instance');
      discordPlugin = DiscordPlugin;
      discordPlugin.config = discordConfig;
    } else {
      throw new Error(`Unexpected Discord plugin type: ${typeof DiscordPlugin}`);
    }
    
    // Log available methods on the Discord plugin
    const discordPluginMethods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(discordPlugin) || {}
    );
    logger.info(`Discord plugin methods: ${JSON.stringify(discordPluginMethods)}`);
    
    // Try direct initialization
    logger.info('Attempting to initialize Discord plugin directly...');
    if (typeof discordPlugin.init === 'function') {
      await discordPlugin.init();
      logger.info('Discord plugin initialized successfully');
    } else {
      logger.error('Discord plugin does not have an init method');
      
      // Try alternative initialization methods
      if (typeof discordPlugin.initialize === 'function') {
        await discordPlugin.initialize();
        logger.info('Discord plugin initialized via initialize() method');
      } else if (typeof discordPlugin.start === 'function') {
        await discordPlugin.start();
        logger.info('Discord plugin initialized via start() method');
      } else {
        throw new Error('No initialization method found on Discord plugin');
      }
    }
    
    logger.info('Discord plugin is now running');
    
    // Keep the process alive
    setInterval(() => {
      logger.info('Discord plugin is still running: ' + new Date().toISOString());
    }, 60000);
    
    return discordPlugin;
  } catch (error) {
    logger.error(`Error initializing Discord plugin: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    throw error;
  }
}

// Start the Discord plugin
startDiscord()
  .then(() => {
    logger.info('Discord plugin startup completed successfully');
  })
  .catch((error) => {
    logger.error(`Error during Discord plugin startup: ${error.message}`);
    process.exit(1);
  });

// Keep the process alive
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  process.exit(0);
});
