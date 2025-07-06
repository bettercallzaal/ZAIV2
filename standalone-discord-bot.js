/**
 * standalone-discord-bot.js
 * 
 * A standalone Discord bot implementation that doesn't rely on ElizaOS
 * Uses discord.js directly instead
 */

import { Client, GatewayIntentBits, Events } from 'discord.js';
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
logger.info('=== STANDALONE DISCORD BOT ===');
logger.info(`Node version: ${process.version}`);
logger.info('Environment variables:');
logger.info(`- DISCORD_API_TOKEN exists: ${!!process.env.DISCORD_API_TOKEN}`);
logger.info(`- DISCORD_APPLICATION_ID exists: ${!!process.env.DISCORD_APPLICATION_ID}`);

// Check required environment variables
if (!process.env.DISCORD_API_TOKEN) {
  logger.error('DISCORD_API_TOKEN environment variable is required');
  process.exit(1);
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Log when client is ready
client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Discord bot logged in as ${readyClient.user.tag}`);
  logger.info(`Bot is in ${readyClient.guilds.cache.size} guilds`);
  
  // List all guilds
  readyClient.guilds.cache.forEach(guild => {
    logger.info(`- Guild: ${guild.name} (${guild.id})`);
  });
});

// Handle messages
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;
  
  logger.info(`Message received from ${message.author.tag}: ${message.content}`);
  
  // Respond to !ping command
  if (message.content.toLowerCase() === '!ping') {
    logger.info('Responding to !ping command');
    await message.reply('Pong!');
  }
});

// Handle errors
client.on(Events.Error, (error) => {
  logger.error(`Discord client error: ${error.message}`);
  logger.error(`Stack trace: ${error.stack}`);
});

// Login to Discord
logger.info('Logging in to Discord...');
client.login(process.env.DISCORD_API_TOKEN)
  .then(() => {
    logger.info('Discord login successful');
  })
  .catch((error) => {
    logger.error(`Discord login failed: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    process.exit(1);
  });

// Setup health check logging
setInterval(() => {
  logger.info(`Discord bot is running: ${new Date().toISOString()}`);
}, 60000);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down...');
  await client.destroy();
  process.exit(0);
});
