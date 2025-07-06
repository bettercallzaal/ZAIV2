/**
 * render-worker.js
 * 
 * Special entry point for Render.com background worker deployment
 * This script handles proper worker initialization and advanced diagnostics
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as ElizaCore from '@elizaos/core';
import ZAOBotService from './src/bot-service.js';
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

// Create and start the bot service directly
async function startBot() {
  try {
    logger.info('Creating bot service...');
    
    // Define service with explicit name and lifecycle methods
    const serviceDefinition = {
      name: 'ZAOBotService',
      description: 'ZAO AI Guide Bot powered by ElizaOS',
      start: async (runtime) => {
        logger.info('[SERVICE] ZAOBotService start method called with runtime:', runtime ? 'provided' : 'undefined');
        // Service-specific initialization logic
        return true;
      },
      stop: async () => {
        logger.info('[SERVICE] ZAOBotService stop method called');
        return true;
      }
    };
    
    // Create service instance with the definition
    const botService = new ZAOBotService({
      name: 'ZAO AI Bot',
      description: 'An AI guide bot powered by ElizaOS',
      serviceDefinition: serviceDefinition
    });
    
    // Explicitly register the service with ElizaCore
    logger.info('Registering service with ElizaCore...');
    
    // Try all available registration methods
    if (typeof ElizaCore.registerService === 'function') {
      logger.info('Using ElizaCore.registerService method');
      ElizaCore.registerService(serviceDefinition);
    } else if (typeof ElizaCore.addService === 'function') {
      logger.info('Using ElizaCore.addService method');
      ElizaCore.addService(serviceDefinition);
    } else if (Array.isArray(ElizaCore.services)) {
      logger.info('Pushing to ElizaCore.services array');
      ElizaCore.services.push(serviceDefinition);
    } else {
      logger.warn('No method available to register service with ElizaCore');
    }
    
    logger.info('Initializing bot service...');
    await botService.initialize();
    logger.info('Bot service initialized');
    
    // Direct initialization of Discord plugin
    if (botService.discordPlugin) {
      logger.info('[DIRECT] Initializing Discord plugin directly...');
      try {
        if (typeof botService.discordPlugin.init === 'function') {
          await botService.discordPlugin.init();
          logger.info('[DIRECT] Discord plugin initialized directly');
        } else if (typeof botService.discordPlugin === 'function') {
          // Handle case where plugin is a function
          await botService.discordPlugin();
          logger.info('[DIRECT] Discord plugin function called directly');
        } else {
          logger.error('[DIRECT] Discord plugin does not have an init method');
        }
      } catch (discordError) {
        logger.error('[DIRECT] Failed to initialize Discord plugin:', discordError);
      }
    }
    
    // Get the service class and start it directly
    const serviceClass = botService.serviceClass || serviceDefinition;
    if (serviceClass && typeof serviceClass.start === 'function') {
      logger.info('[DIRECT] Starting service directly using serviceClass.start()...');
      try {
        // Create a minimal runtime object with required properties
        const runtime = {
          config: {},
          plugins: {},
          services: {},
          logger: logger
        };
        
        // Start the service directly
        await serviceClass.start(runtime);
        logger.info('[DIRECT] Service started directly using serviceClass.start()');
      } catch (startError) {
        logger.error('[DIRECT] Error starting service directly:', startError);
        logger.info('[FALLBACK] Attempting to start service with botService.start()...');
        await botService.start();
      }
    } else {
      logger.warn('[DIRECT] No service class or start method available');
      logger.info('[FALLBACK] Attempting to start service with botService.start()...');
      await botService.start();
    }
    
    // Setup health check logging
    setInterval(() => {
      logger.info('ZAO Bot Service is running: ' + new Date().toISOString());
    }, 60000); // Log every minute
    
    return botService;
  } catch (error) {
    logger.error('Failed to start bot service:', error);
    throw error;
  }
}

// Start the bot and handle errors
startBot()
  .then(() => {
    logger.info('Bot startup completed successfully');
  })
  .catch((error) => {
    logger.error('Error during bot startup:', error);
    process.exit(1);
  });
