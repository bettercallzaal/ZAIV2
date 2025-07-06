/**
 * render-worker.js
 * 
 * Special entry point for Render.com background worker deployment
 * This script handles proper worker initialization and advanced diagnostics
 * Simplified to directly initialize the Discord bot without ElizaOS service registration
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as ElizaCore from '@elizaos/core';
import DiscordPlugin from '@elizaos/plugin-discord';
import winston from 'winston';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a no-web-service file to prevent port scanning messages
fs.writeFileSync(path.join(__dirname, '.render-no-web-service'), '');
console.log('[SETUP] Created .render-no-web-service file');

// Set up advanced logging with Winston
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  process.env.NODE_ENV !== 'production' 
    ? winston.format.colorize() 
    : winston.format.uncolorize()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'zao-bot' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
        })
      )
    })
  ]
});

// Replace console.log with Winston logger
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

console.log = (...args) => {
  logger.info(args.join(' '));
  originalConsoleLog(...args);
};

console.error = (...args) => {
  logger.error(args.join(' '));
  originalConsoleError(...args);
};

console.warn = (...args) => {
  logger.warn(args.join(' '));
  originalConsoleWarn(...args);
};

console.info = (...args) => {
  logger.info(args.join(' '));
  originalConsoleInfo(...args);
};

// Log system information
logger.info('=== ZAO AI Bot Worker ===');
logger.info(`Node version: ${process.version}`);
logger.info(`Starting in ${process.env.NODE_ENV || 'development'} mode`);
logger.info(`Running as worker service type: ${process.env.RENDER_SERVICE_TYPE === 'worker'}`);

// Log available ElizaCore methods for diagnostics
const elizaCoreMethods = Object.getOwnPropertyNames(ElizaCore);
logger.info('Available ElizaCore methods:', elizaCoreMethods);

// Check required environment variables
const requiredEnvVars = ['DISCORD_API_TOKEN', 'DISCORD_APPLICATION_ID', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`[DIAGNOSTIC] Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Diagnostic check for Discord token
logger.info('[DIAGNOSTIC] Checking Discord token format...');
const discordToken = process.env.DISCORD_API_TOKEN;
if (!discordToken || !discordToken.startsWith('MTA') || discordToken.length < 50) {
  logger.error('[DIAGNOSTIC] Discord token appears invalid or malformed');
} else {
  logger.info('[DIAGNOSTIC] Discord token format appears valid');
}

// Process uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Keep the process running despite the error
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the process running despite the rejection
});

// Create and start the Discord bot directly without ElizaOS service registration
async function startBot() {
  try {
    logger.info('Starting Discord bot directly...');
    
    // Check required environment variables
    if (!process.env.DISCORD_API_TOKEN) {
      throw new Error('DISCORD_API_TOKEN environment variable is required');
    }
    
    if (!process.env.DISCORD_APPLICATION_ID) {
      throw new Error('DISCORD_APPLICATION_ID environment variable is required');
    }
    
    // Configure Discord plugin directly
    const discordConfig = {
      token: process.env.DISCORD_API_TOKEN,
      applicationId: process.env.DISCORD_APPLICATION_ID
    };
    
    logger.info('Creating Discord plugin instance...');
    let discordPlugin;
    
    // Initialize Discord plugin based on its type
    if (typeof DiscordPlugin === 'function') {
      // DiscordPlugin is a constructor
      logger.info('Creating Discord plugin with constructor');
      discordPlugin = new DiscordPlugin(discordConfig);
    } else if (typeof DiscordPlugin === 'object') {
      // DiscordPlugin is already an instance
      logger.info('Using Discord plugin as object instance');
      discordPlugin = DiscordPlugin;
      discordPlugin.config = discordConfig;
    } else {
      throw new Error(`Unexpected Discord plugin type: ${typeof DiscordPlugin}`);
    }
    
    // Log available methods on the Discord plugin
    const discordPluginMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(discordPlugin) || {});
    logger.info('Discord plugin methods:', discordPluginMethods);
    
    // Initialize the Discord plugin
    logger.info('Initializing Discord plugin...');
    if (typeof discordPlugin.init === 'function') {
      await discordPlugin.init();
      logger.info('Discord plugin initialized successfully');
    } else {
      throw new Error('Discord plugin does not have an init method');
    }
    
    // Create a character if needed by the Discord plugin
    if (typeof ElizaCore.decryptedCharacter === 'function') {
      logger.info('Creating character with decryptedCharacter');
      try {
        const characterConfig = {
          name: 'ZAO Bot',
          description: 'A bot for Render deployment'
        };
        
        const character = await ElizaCore.decryptedCharacter(characterConfig);
        logger.info('Character created successfully');
        
        // Register character with Discord plugin if needed
        if (discordPlugin.setCharacter && typeof discordPlugin.setCharacter === 'function') {
          discordPlugin.setCharacter(character);
          logger.info('Character registered with Discord plugin');
        }
      } catch (err) {
        logger.error('Error creating character:', err);
        logger.info('Continuing without character');
      }
    }
    
    // Setup health check logging
    setInterval(() => {
      logger.info('Discord bot is running: ' + new Date().toISOString());
    }, 60000); // Log every minute
    
    return discordPlugin;
  } catch (error) {
    logger.error('Failed to start bot service:', error);
    throw error;
  }
}

// Start the bot and handle errors
startBot()
  .then(() => {
    logger.info('Discord bot startup completed successfully');
    logger.info('Bot is now listening for Discord events');
  })
  .catch((error) => {
    logger.error('Error during Discord bot startup:', error);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  });

// Keep the process alive
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down...');
  process.exit(0);
});
