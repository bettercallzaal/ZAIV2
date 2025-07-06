/**
 * enhanced-discord-bot.js
 * 
 * A more robust Discord bot implementation with no external dependencies
 * Uses only Node.js built-in modules (https, http, ws)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const WebSocket = require('ws');

// Configuration
const TOKEN = process.env.DISCORD_API_TOKEN;
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

// Discord API Gateway version
const GATEWAY_VERSION = 10;

// Discord API endpoints
const DISCORD_API = {
  BASE: 'https://discord.com/api/v10',
  GATEWAY: '/gateway/bot',
  ME: '/users/@me',
  GUILDS: '/users/@me/guilds',
  CHANNELS: '/channels'
};

// Discord Gateway Opcodes
const OPCODES = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  PRESENCE_UPDATE: 3,
  VOICE_STATE_UPDATE: 4,
  RESUME: 6,
  RECONNECT: 7,
  REQUEST_GUILD_MEMBERS: 8,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11
};

// Discord Gateway Intents
const INTENTS = {
  GUILDS: 1 << 0,
  GUILD_MEMBERS: 1 << 1,
  GUILD_MESSAGES: 1 << 9,
  MESSAGE_CONTENT: 1 << 15,
  DIRECT_MESSAGES: 1 << 12
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

// Discord Gateway Client
class DiscordGateway extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.sessionId = null;
    this.sequence = null;
    this.heartbeatInterval = null;
    this.lastHeartbeatAck = true;
    this.resumeGatewayUrl = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      // Get gateway URL
      const gatewayInfo = await discordRequest(DISCORD_API.GATEWAY);
      const gatewayUrl = `${gatewayInfo.url}/?v=${GATEWAY_VERSION}&encoding=json`;
      
      log('info', `Connecting to Discord Gateway: ${gatewayUrl}`);
      
      this.ws = new WebSocket(gatewayUrl);
      
      this.ws.on('open', () => {
        log('info', 'Gateway connection established');
      });
      
      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data));
      });
      
      this.ws.on('error', (error) => {
        log('error', `WebSocket error: ${error.message}`);
        this.reconnect();
      });
      
      this.ws.on('close', (code, reason) => {
        log('info', `WebSocket closed with code ${code}: ${reason}`);
        this.stopHeartbeat();
        this.reconnect();
      });
    } catch (error) {
      log('error', `Failed to connect to gateway: ${error.message}`);
      this.reconnect();
    }
  }
  
  handleMessage(payload) {
    // Update sequence number if provided
    if (payload.s) {
      this.sequence = payload.s;
    }
    
    switch (payload.op) {
      case OPCODES.HELLO:
        this.handleHello(payload);
        break;
      case OPCODES.HEARTBEAT_ACK:
        this.lastHeartbeatAck = true;
        log('debug', 'Received heartbeat acknowledgement');
        break;
      case OPCODES.DISPATCH:
        this.handleDispatch(payload);
        break;
      case OPCODES.RECONNECT:
        log('info', 'Received reconnect request from Discord');
        this.reconnect();
        break;
      case OPCODES.INVALID_SESSION:
        log('info', `Invalid session, resumable: ${payload.d}`);
        if (payload.d) {
          setTimeout(() => this.resume(), 2000 + Math.random() * 3000);
        } else {
          setTimeout(() => this.identify(), 2000 + Math.random() * 3000);
        }
        break;
      default:
        log('debug', `Received unhandled opcode: ${payload.op}`);
    }
  }
  
  handleHello(payload) {
    const heartbeatInterval = payload.d.heartbeat_interval;
    log('info', `Received HELLO. Heartbeat interval: ${heartbeatInterval}ms`);
    
    this.startHeartbeat(heartbeatInterval);
    
    if (this.sessionId && this.resumeGatewayUrl) {
      this.resume();
    } else {
      this.identify();
    }
  }
  
  handleDispatch(payload) {
    const { t: eventName, d: eventData } = payload;
    
    switch (eventName) {
      case 'READY':
        this.sessionId = eventData.session_id;
        this.resumeGatewayUrl = eventData.resume_gateway_url;
        log('info', `Received READY. Session ID: ${this.sessionId}`);
        log('info', `Connected as ${eventData.user.username}#${eventData.user.discriminator}`);
        this.emit('ready', eventData);
        break;
      case 'MESSAGE_CREATE':
        this.emit('messageCreate', eventData);
        break;
      case 'GUILD_CREATE':
        log('info', `Joined guild: ${eventData.name} (${eventData.id})`);
        this.emit('guildCreate', eventData);
        break;
      default:
        log('debug', `Received dispatch event: ${eventName}`);
        this.emit(eventName, eventData);
    }
  }
  
  identify() {
    log('info', 'Identifying with Discord Gateway');
    
    const payload = {
      op: OPCODES.IDENTIFY,
      d: {
        token: TOKEN,
        intents: INTENTS.GUILDS | INTENTS.GUILD_MESSAGES | INTENTS.MESSAGE_CONTENT | INTENTS.DIRECT_MESSAGES,
        properties: {
          os: 'linux',
          browser: 'ZAO AI Bot',
          device: 'ZAO AI Bot'
        }
      }
    };
    
    this.send(payload);
  }
  
  resume() {
    if (!this.sessionId) {
      this.identify();
      return;
    }
    
    log('info', `Attempting to resume session ${this.sessionId}`);
    
    const payload = {
      op: OPCODES.RESUME,
      d: {
        token: TOKEN,
        session_id: this.sessionId,
        seq: this.sequence
      }
    };
    
    this.send(payload);
  }
  
  startHeartbeat(interval) {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (!this.lastHeartbeatAck) {
        log('warn', 'Did not receive heartbeat acknowledgement, reconnecting');
        this.reconnect();
        return;
      }
      
      this.lastHeartbeatAck = false;
      this.heartbeat();
    }, interval);
    
    // Send an initial heartbeat
    this.heartbeat();
  }
  
  heartbeat() {
    log('debug', `Sending heartbeat, sequence: ${this.sequence}`);
    
    const payload = {
      op: OPCODES.HEARTBEAT,
      d: this.sequence
    };
    
    this.send(payload);
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
  
  reconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      log('error', `Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`);
      process.exit(1);
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    log('info', `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => this.connect(), delay);
  }
  
  destroy() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
  }
}

// Main function
async function main() {
  try {
    // Start healthcheck server
    startHealthcheckServer();
    
    log('info', '=== ENHANCED DISCORD BOT ===');
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
    
    // Connect to Discord Gateway
    const gateway = new DiscordGateway();
    
    // Handle messages
    gateway.on('messageCreate', async (message) => {
      // Ignore messages from bots
      if (message.author.bot) return;
      
      log('info', `Message received from ${message.author.username}#${message.author.discriminator}: ${message.content}`);
      
      // Respond to !ping command
      if (message.content.toLowerCase() === '!ping') {
        log('info', 'Responding to !ping command');
        await sendMessage(message.channel_id, 'Pong!');
      }
      
      // Respond to !help command
      if (message.content.toLowerCase() === '!help') {
        log('info', 'Responding to !help command');
        await sendMessage(message.channel_id, 'Available commands:\n!ping - Check if the bot is responsive\n!help - Show this help message');
      }
    });
    
    // Connect to gateway
    gateway.connect();
    
    // Keep alive with periodic logging
    setInterval(() => {
      log('info', `Bot is still running: ${new Date().toISOString()}`);
    }, 60000);
    
    log('info', 'Bot startup complete and running');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      log('info', 'Received SIGINT, shutting down...');
      gateway.destroy();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      log('info', 'Received SIGTERM, shutting down...');
      gateway.destroy();
      process.exit(0);
    });
  } catch (error) {
    log('error', `Error in main function: ${error.message}`);
    log('error', `Stack trace: ${error.stack}`);
    process.exit(1);
  }
}

// Start the bot
main().catch(error => {
  log('error', `Unhandled error: ${error.message}`);
  log('error', `Stack trace: ${error.stack}`);
});
