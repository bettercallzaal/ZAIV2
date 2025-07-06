/**
 * http-discord-bot.js
 * 
 * A Discord bot implementation that uses only HTTP polling (no WebSockets)
 * Uses only Node.js built-in modules (https, http)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const TOKEN = process.env.DISCORD_API_TOKEN;
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

// Discord API endpoints
const DISCORD_API = {
  BASE: 'https://discord.com/api/v10',
  ME: '/users/@me',
  GUILDS: '/users/@me/guilds',
  CHANNELS: '/channels'
};

// Basic logging
function log(level, message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${level.toUpperCase()}: ${message}`);
}

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
function discordRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${DISCORD_API.BASE}${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bot ${TOKEN}`,
        'User-Agent': 'ZAO AI Bot (https://github.com/bettercallzaal/ZAIV2, v1.0.0)',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

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
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Send a message to a Discord channel
async function sendMessage(channelId, content) {
  try {
    const endpoint = `${DISCORD_API.CHANNELS}/${channelId}/messages`;
    const body = { content };
    
    const response = await discordRequest(endpoint, 'POST', body);
    log('info', `Message sent to channel ${channelId}`);
    return response;
  } catch (error) {
    log('error', `Failed to send message: ${error.message}`);
    return null;
  }
}

// Get messages from a Discord channel
async function getMessages(channelId, limit = 10) {
  try {
    const endpoint = `${DISCORD_API.CHANNELS}/${channelId}/messages?limit=${limit}`;
    const messages = await discordRequest(endpoint);
    return messages;
  } catch (error) {
    log('error', `Failed to get messages: ${error.message}`);
    return [];
  }
}

// Process messages from a channel
async function processMessages(channelId, lastMessageId) {
  try {
    // Get messages after the last processed message
    let endpoint = `${DISCORD_API.CHANNELS}/${channelId}/messages?limit=10`;
    if (lastMessageId) {
      endpoint += `&after=${lastMessageId}`;
    }
    
    const messages = await discordRequest(endpoint);
    
    // Process messages in reverse order (oldest first)
    for (const message of messages.reverse()) {
      // Skip messages from bots
      if (message.author.bot) continue;
      
      log('info', `Processing message from ${message.author.username}: ${message.content}`);
      
      // Process commands
      if (message.content.toLowerCase() === '!ping') {
        log('info', 'Responding to !ping command');
        await sendMessage(channelId, 'Pong!');
      } else if (message.content.toLowerCase() === '!help') {
        log('info', 'Responding to !help command');
        await sendMessage(channelId, 'Available commands:\n!ping - Check if the bot is responsive\n!help - Show this help message');
      }
      
      // Update last message ID
      lastMessageId = message.id;
    }
    
    return lastMessageId;
  } catch (error) {
    log('error', `Error processing messages: ${error.message}`);
    return lastMessageId;
  }
}

// Main function
async function main() {
  try {
    // Start healthcheck server
    startHealthcheckServer();
    
    log('info', '=== HTTP DISCORD BOT ===');
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
    
    // Store channel IDs and last message IDs
    const channels = {};
    
    // Get channels for each guild
    for (const guild of guilds) {
      log('info', `- Guild: ${guild.name} (${guild.id})`);
      
      try {
        // Get channels in the guild
        const guildChannels = await discordRequest(`/guilds/${guild.id}/channels`);
        
        // Filter for text channels
        const textChannels = guildChannels.filter(channel => channel.type === 0);
        
        log('info', `  Found ${textChannels.length} text channels`);
        
        // Store channel IDs
        for (const channel of textChannels) {
          log('info', `  - Channel: ${channel.name} (${channel.id})`);
          channels[channel.id] = null; // null last message ID means start from latest
        }
      } catch (error) {
        log('error', `Failed to get channels for guild ${guild.id}: ${error.message}`);
      }
    }
    
    log('info', 'Bot startup complete and running');
    
    // Poll for new messages every 5 seconds
    setInterval(async () => {
      for (const channelId in channels) {
        try {
          // Process messages and update last message ID
          channels[channelId] = await processMessages(channelId, channels[channelId]);
        } catch (error) {
          log('error', `Error polling channel ${channelId}: ${error.message}`);
        }
      }
    }, 5000);
    
    // Keep alive with periodic logging
    setInterval(() => {
      log('info', `Bot is still running: ${new Date().toISOString()}`);
    }, 60000);
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
