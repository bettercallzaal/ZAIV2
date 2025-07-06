/**
 * minimal-bot.js
 * 
 * A completely standalone Discord bot implementation with no external dependencies
 * Uses only Node.js built-in modules
 */

const https = require('https');
const http = require('http');

// Configuration
const TOKEN = process.env.DISCORD_API_TOKEN;
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

// Basic logging
function log(level, message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${level.toUpperCase()}: ${message}`);
}

// Discord API endpoints
const DISCORD_API = {
  BASE: 'https://discord.com/api/v10',
  GATEWAY: '/gateway/bot',
  ME: '/users/@me',
  GUILDS: '/users/@me/guilds'
};

// Healthcheck server
function startHealthcheckServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Discord Bot Healthcheck OK');
  });
  
  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    log('info', `Healthcheck server running on port ${port}`);
  });
  
  return server;
}

// Make a request to Discord API
function discordRequest(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'discord.com',
      path: `/api/v10${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bot ${TOKEN}`,
        'User-Agent': 'ZAO AI Bot (https://github.com/bettercallzaal/ZAIV2, v1.0.0)',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`Discord API returned status code ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Main function
async function main() {
  try {
    // Start healthcheck server
    startHealthcheckServer();
    
    log('info', '=== MINIMAL DISCORD BOT ===');
    log('info', `Node version: ${process.version}`);
    
    // Check environment variables
    log('info', 'Environment variables:');
    log('info', `- DISCORD_API_TOKEN exists: ${!!TOKEN}`);
    log('info', `- DISCORD_APPLICATION_ID exists: ${!!APPLICATION_ID}`);
    
    if (!TOKEN) {
      log('error', 'DISCORD_API_TOKEN environment variable is required');
      process.exit(1);
    }
    
    // Test Discord API connection
    log('info', 'Testing Discord API connection...');
    const me = await discordRequest(DISCORD_API.ME);
    log('info', `Connected to Discord as ${me.username}#${me.discriminator} (${me.id})`);
    
    // Get guilds
    log('info', 'Fetching guilds...');
    const guilds = await discordRequest(DISCORD_API.GUILDS);
    log('info', `Bot is in ${guilds.length} guilds:`);
    
    guilds.forEach(guild => {
      log('info', `- Guild: ${guild.name} (${guild.id})`);
    });
    
    // Keep alive with periodic logging
    setInterval(() => {
      log('info', `Bot is still running: ${new Date().toISOString()}`);
    }, 60000);
    
    log('info', 'Bot startup complete and running');
  } catch (error) {
    log('error', `Error in main function: ${error.message}`);
    log('error', `Stack trace: ${error.stack}`);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Received SIGTERM, shutting down...');
  process.exit(0);
});

// Start the bot
main().catch(error => {
  log('error', `Unhandled error: ${error.message}`);
  log('error', `Stack trace: ${error.stack}`);
});
