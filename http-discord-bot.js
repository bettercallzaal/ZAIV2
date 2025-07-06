/**
 * http-discord-bot.js
 * 
 * A Discord bot implementation that uses only HTTP polling (no WebSockets)
 * Uses only Node.js built-in modules (https, http)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Configuration
const TOKEN = process.env.DISCORD_API_TOKEN;
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const PORT = process.env.PORT || 8080;

// Discord API endpoints
const DISCORD_API = {
  BASE_URL: 'https://discord.com/api/v10',
  ME: '/users/@me',
  GUILDS: '/users/@me/guilds',
  CHANNELS: '/channels',
  GUILD_CHANNELS: '/guilds/{guild_id}/channels',
  APPLICATIONS: '/applications',
  INTERACTIONS: '/interactions',
  GATEWAY: '/gateway',
  APPLICATION_COMMANDS: '/applications/{application_id}/commands',
  GUILD_APPLICATION_COMMANDS: '/applications/{application_id}/guilds/{guild_id}/commands',
};

// Runtime info
const START_TIME = new Date();
const VERSION = '1.0.0';

// Bot custom configuration
const BOT_CONFIG = {
  name: 'ZAO AI',
  description: 'The official guide for The ZAO (ZTalent Artist Organization) ecosystem.',
  commands: [
    {
      name: 'onboard',
      description: 'Start the artist onboarding journey'
    },
    {
      name: 'events',
      description: 'Get information about upcoming ZAO community events'
    },
    {
      name: 'respect',
      description: 'Learn about the $ZAO Respect token system'
    },
    {
      name: 'help',
      description: 'Show help information and available commands'
    },
    {
      name: 'about',
      description: 'Learn about The ZAO'
    },
    {
      name: 'fractal',
      description: 'Learn about ZAO Fractals'
    },
    {
      name: 'governance',
      description: 'Learn about ZAO governance'
    },
    {
      name: 'nexus',
      description: 'Information about ZAO NEXUS'
    },
    {
      name: 'resources',
      description: 'Get links to important ZAO resources'
    }
  ],
  welcomeNewMembers: true,
  welcomeMessage: "Welcome to The ZAO community! I'm ZAO AI, your guide to our decentralized artist ecosystem. Use !help to see how I can assist you with onboarding and learning about our community."
};

// Basic logging
function log(level, message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${level.toUpperCase()}: ${message}`);
}

// Check if a channel is accessible
async function isChannelAccessible(channelId) {
  try {
    // Try to get channel info
    await discordRequest(`${DISCORD_API.CHANNELS}/${channelId}`);
    return true;
  } catch (error) {
    if (error.message.includes('Missing Access') || error.message.includes('code: 50001')) {
      return false;
    }
    // For other errors, assume it might be accessible
    log('warn', `Error checking channel accessibility: ${error.message}`);
    return true;
  }
}

/**
 * Start HTTP server for health checks and Discord interactions
 */
function startServer() {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // Health check endpoint
    if (path === '/health') {
      // Return uptime and other health metrics
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        version: VERSION,
        uptime: Math.floor((new Date() - START_TIME) / 1000),
        startTime: START_TIME.toISOString(),
        name: BOT_CONFIG.name
      }));
      return;
    }
    
    // Interaction endpoint for slash commands and other Discord interactions
    if (path === '/interactions' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const interaction = JSON.parse(body);
          
          // Verify the interaction is coming from Discord
          // Note: In production, you should verify the signature
          
          // Handle different interaction types
          switch (interaction.type) {
            case 1: // PING
              // Respond to Discord PING with PONG
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ type: 1 })); // Type 1 is PONG
              break;
              
            case 2: // APPLICATION_COMMAND
              // Respond to interaction immediately to meet Discord's deadline
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                type: 5 // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
              }));
              
              // Process the command asynchronously
              handleSlashCommand(interaction);
              break;
              
            case 3: // MESSAGE_COMPONENT
              // Handle message component interactions (buttons, etc)
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                type: 6 // DEFERRED_UPDATE_MESSAGE
              }));
              // Process component interaction (future enhancement)
              break;
              
            default:
              // Unknown interaction type
              res.writeHead(400);
              res.end();
          }
        } catch (error) {
          log('error', `Error handling interaction: ${error.message}`);
          res.writeHead(500);
          res.end();
        }
      });
      return;
    }
    
    // Default response for unknown endpoints
    res.writeHead(404);
    res.end();
  });
  
  server.listen(PORT, () => {
    log('info', `Server started on port ${PORT}`);
  });
  
  return server;
}

// Make a request to Discord API
function discordRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${DISCORD_API.BASE_URL}${endpoint}`);
    
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

// ZAO knowledge base for bot responses based on the character definition
const ZAO_KNOWLEDGE = {
  about: "The ZAO (ZTalent Artist Organization) is a decentralized impact network challenging centralized systems in the creator economy. It empowers musicians, artists, and creative entrepreneurs to reclaim control of their art, data, and revenue through community-driven governance via the Hats Protocol and Respect Game, educational initiatives like the Student Loanz Initiative, and events such as ZAO-PALOOZA.",
  respect: "$ZAO Respect tokens are non-transferable tokens earned through community participation, content creation, and positive contributions. These tokens represent your reputation and influence within the ZAO ecosystem and can be used for governance voting through the Respect Game. They're earned by participating in community initiatives, helping other members, creating valuable content, and being active in governance discussions.",
  fractal: "The ZAO community has a fractal governance structure organized in nested groups with autonomy at each level. At the top level is the Hivemind where the entire community discusses major decisions through weekly calls. Below that are Fractal Groups focused on specific domains like Music, Visual Arts, Education, and Technology. Each Fractal Group can form Working Groups for specific projects. Join a fractal that aligns with your interests to connect with like-minded community members.",
  events: "The ZAO hosts regular events including weekly Hivemind meetings, Fractal meetings (typically biweekly), Respect Game sessions, Music Roulette, ZAO-PALOOZA festival, and various Twitter/X Spaces discussions. Our next community call is our weekly ZAO Hivemind meeting where we discuss ongoing projects and welcome new members. Check the #announcements channel for upcoming events.",
  governance: "The ZAO uses decentralized governance through the Respect Game and Hats Protocol, where community members with $ZAO tokens can propose and vote on initiatives. The Hats Protocol assigns roles and permissions across the community structure, allowing people to hold multiple roles in different groups. This ensures the community has direct input on the organization's direction while small groups can make decisions autonomously.",
  nexus: "ZAO NEXUS is the central hub that brings together all ZAO projects, platforms, and community channels. Visit https://www.thezao.com/nexus to explore all the resources available.",
  onboard: "Welcome to The ZAO! To get started: 1) Introduce yourself in the #introductions channel, 2) Check out the #start-here channel to learn about our community structure, 3) Join our next community call to meet other members, 4) Consider exploring the Student Loanz Initiative to learn about Web3, and 5) Explore different fractal groups based on your interests.",
  resources: "Essential ZAO resources: Website: https://www.thezao.com, NEXUS Hub: https://www.thezao.com/nexus, Daily Posts: https://paragraph.xyz/@thezao, Twitter/X: https://twitter.com/thezao",
  web3: "For artists, Web3 differs from Web2 in several ways: In Web3, artists maintain ownership and control of their work through blockchain technology, have direct artist-to-fan relationships without middlemen, access new revenue models like NFTs and social tokens, participate in community governance and co-ownership opportunities, and have greater data ownership and portability between platforms. The ZAO is building tools and communities to help artists transition to Web3 for more control over their creative work.",
  values: "The ZAO embodies core values of transparency and radical openness, community ownership and decentralized governance, artist empowerment and economic agency, and educational access and knowledge sharing."
};

/**
 * Check if a message mentions the bot
 * @param {object} message - Discord message object
 * @returns {boolean} True if bot is mentioned
 */
function isBotMentioned(message) {
  // Check for direct mentions in mentions array
  if (message.mentions && Array.isArray(message.mentions)) {
    if (message.mentions.some(mention => mention.id === me.id)) {
      return true;
    }
  }
  
  // Also check content for mention format <@BOT_ID>
  if (message.content && me && me.id) {
    const mentionFormat = `<@${me.id}>`;
    const nickMentionFormat = `<@!${me.id}>`;
    return message.content.includes(mentionFormat) || message.content.includes(nickMentionFormat);
  }
  
  return false;
}

/**
 * Extract question from a message that mentions the bot
 * @param {object} message - Discord message object
 * @returns {string} The extracted question
 */
function extractQuestion(message) {
  if (!message.content) return '';
  
  // Remove the mention part
  let question = message.content;
  if (me && me.id) {
    const mentionFormat = `<@${me.id}>`;
    const nickMentionFormat = `<@!${me.id}>`;
    question = question.replace(mentionFormat, '').replace(nickMentionFormat, '');
  }
  
  // Clean up any leading/trailing spaces or punctuation
  return question.trim();
}

/**
 * Handle a user question with semi-intelligent responses based on content
 * @param {string} channelId - Discord channel ID
 * @param {string} question - User's question
 * @param {string} username - Username of the person asking
 */
async function handleQuestion(channelId, question, username) {
  const lowerQuestion = question.toLowerCase();
  
  // Empty question or just a greeting
  if (!question || /^(hi|hello|hey|sup|yo|what's up|greetings)$/i.test(question)) {
    await sendMessage(channelId, `Hi ${username}! I'm ZAO AI, the official guide for The ZAO ecosystem. How can I help you today? Try asking about our community, the Respect token system, or type !help to see all available commands.`);
    return;
  }
  
  // Keywords to topic mapping
  const topics = [
    { keywords: ['about', 'zao', 'what is'], response: 'about' },
    { keywords: ['respect', 'token', 'earn', '$zao'], response: 'respect' },
    { keywords: ['fractal', 'group', 'community structure'], response: 'fractal' },
    { keywords: ['event', 'meeting', 'call', 'when', 'next'], response: 'events' },
    { keywords: ['governance', 'decision', 'vote', 'proposal'], response: 'governance' },
    { keywords: ['nexus', 'hub', 'platform'], response: 'nexus' },
    { keywords: ['start', 'begin', 'onboard', 'new', 'join'], response: 'onboard' },
    { keywords: ['resource', 'link', 'website', 'url'], response: 'resources' },
    { keywords: ['web3', 'web 3', 'blockchain', 'crypto'], response: 'web3' },
    { keywords: ['value', 'mission', 'vision'], response: 'values' }
  ];
  
  // Find matching topic based on keywords
  for (const topic of topics) {
    if (topic.keywords.some(keyword => lowerQuestion.includes(keyword))) {
      const knowledgeKey = topic.response;
      if (ZAO_KNOWLEDGE[knowledgeKey]) {
        await sendMessage(channelId, `${ZAO_KNOWLEDGE[knowledgeKey]}`);
        return;
      }
    }
  }
  
  // Default response for unknown questions
  await sendMessage(channelId, `Thanks for your question, ${username}! To best help you, could you try rephrasing or using one of our commands? Type !help to see all available commands, or ask specifically about topics like "respect tokens", "governance", "fractals", or "onboarding".`);
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
      const lowerContent = message.content.toLowerCase();
      
      // Check for command prefix
      if (lowerContent.startsWith('!')) {
        const command = lowerContent.split(' ')[0].substring(1); // Remove the ! and get the command
        
        switch (command) {
          case 'ping':
            log('info', 'Responding to !ping command');
            await sendMessage(channelId, 'Pong! The ZAO AI Bot is online and ready to help! 🌊');
            break;
            
          case 'help':
            log('info', 'Responding to !help command');
            await sendMessage(channelId, 'Welcome to ZAO AI! Here are the available commands:\n\n' +
              '**Basic Commands:**\n' +
              '`!ping` - Check if the bot is responsive\n' +
              '`!help` - Show this help message\n\n' +
              '**ZAO Information:**\n' +
              '`!about` - Learn about The ZAO\n' +
              '`!respect` - Information about $ZAO Respect tokens\n' +
              '`!fractal` - Learn about ZAO Fractals\n' +
              '`!events` - Information about upcoming events\n' +
              '`!governance` - Learn about ZAO governance\n' +
              '`!nexus` - Information about ZAO NEXUS\n' +
              '`!web3` - How Web3 differs from Web2 for artists\n' +
              '`!values` - Core values of The ZAO\n\n' +
              '**Onboarding:**\n' +
              '`!onboard` - Begin your ZAO onboarding journey\n' +
              '`!resources` - Get links to important ZAO resources\n\n' +
              'You can also mention me with any questions!');
            break;
            
          case 'about':
            await sendMessage(channelId, `**About The ZAO:**\n\n${ZAO_KNOWLEDGE.about}`);
            break;
            
          case 'respect':
            await sendMessage(channelId, `**About $ZAO Respect Tokens:**\n\n${ZAO_KNOWLEDGE.respect}`);
            break;
            
          case 'fractal':
            await sendMessage(channelId, `**About ZAO Fractals:**\n\n${ZAO_KNOWLEDGE.fractal}`);
            break;
            
          case 'events':
            await sendMessage(channelId, `**About ZAO Events:**\n\n${ZAO_KNOWLEDGE.events}`);
            break;
            
          case 'governance':
            await sendMessage(channelId, `**About ZAO Governance:**\n\n${ZAO_KNOWLEDGE.governance}`);
            break;
            
          case 'nexus':
            await sendMessage(channelId, `**About ZAO NEXUS:**\n\n${ZAO_KNOWLEDGE.nexus}`);
            break;
            
          case 'onboard':
          case 'start':
            await sendMessage(channelId, `**Welcome to The ZAO!** 🌊\n\n${ZAO_KNOWLEDGE.onboard}`);
            break;
            
          case 'resources':
            await sendMessage(channelId, `**Essential ZAO Resources:**\n\n${ZAO_KNOWLEDGE.resources}`);
            break;
            
          case 'web3':
            await sendMessage(channelId, `**Web3 vs Web2 for Artists:**\n\n${ZAO_KNOWLEDGE.web3}`);
            break;
            
          case 'values':
            await sendMessage(channelId, `**Core Values of The ZAO:**\n\n${ZAO_KNOWLEDGE.values}`);
            break;
            
          default:
            // Unknown command, do nothing
            break;
        }
      }
      // Check for mentions of the bot
      else if (isBotMentioned(message)) {
        log('info', `Bot was mentioned by ${message.author.username}`);
        const question = extractQuestion(message);
        await handleQuestion(channelId, question, message.author.username);
      }
      
      // Update last message ID
      lastMessageId = message.id;
    }
    
    return lastMessageId;
  } catch (error) {
    // Check if it's a permission error
    if (error.message.includes('Missing Access') || error.message.includes('code: 50001')) {
      // Don't log every permission error, just return null to mark channel as inaccessible
      return null;
    } else {
      log('error', `Error processing messages: ${error.message}`);
      return lastMessageId;
    }
  }
}

/**
 * Register slash commands with Discord
 * This only needs to be run when commands change
 */
async function registerSlashCommands() {
  try {
    log('info', 'Registering slash commands with Discord...');
    
    if (!APPLICATION_ID) {
      log('warn', 'Cannot register slash commands: DISCORD_APPLICATION_ID not set');
      return;
    }
    
    const commands = [
      {
        name: 'about',
        description: 'Learn about The ZAO ecosystem',
        type: 1, // CHAT_INPUT
      },
      {
        name: 'respect',
        description: 'Information about $ZAO Respect tokens',
        type: 1,
      },
      {
        name: 'fractal',
        description: 'Learn about ZAO Fractals and community structure',
        type: 1,
      },
      {
        name: 'events',
        description: 'Information about upcoming ZAO events',
        type: 1,
      },
      {
        name: 'governance',
        description: 'Learn about ZAO governance model',
        type: 1,
      },
      {
        name: 'resources',
        description: 'Get links to important ZAO resources',
        type: 1,
      },
      {
        name: 'onboard',
        description: 'Begin your ZAO onboarding journey',
        type: 1,
      },
      {
        name: 'web3',
        description: 'Learn how Web3 differs from Web2 for artists',
        type: 1,
      }
    ];
    
    const endpoint = DISCORD_API.APPLICATION_COMMANDS.replace('{application_id}', APPLICATION_ID);
    
    const response = await discordRequest(endpoint, 'PUT', commands);
    log('info', `Registered ${response.length} slash commands`);
    return response;
  } catch (error) {
    log('error', `Failed to register slash commands: ${error.message}`);
  }
}

/**
 * Handle slash command interactions
 * @param {object} interaction - The interaction data
 */
async function handleSlashCommand(interaction) {
  try {
    const { name } = interaction.data;
    const userId = interaction.member.user.id;
    const username = interaction.member.user.username;
    
    log('info', `Handling slash command: ${name} from ${username}`);
    
    let responseContent = '';
    
    switch (name) {
      case 'about':
        responseContent = `**About The ZAO:**\n\n${ZAO_KNOWLEDGE.about}`;
        break;
      case 'respect':
        responseContent = `**About $ZAO Respect Tokens:**\n\n${ZAO_KNOWLEDGE.respect}`;
        break;
      case 'fractal':
        responseContent = `**About ZAO Fractals:**\n\n${ZAO_KNOWLEDGE.fractal}`;
        break;
      case 'events':
        responseContent = `**About ZAO Events:**\n\n${ZAO_KNOWLEDGE.events}`;
        break;
      case 'governance':
        responseContent = `**About ZAO Governance:**\n\n${ZAO_KNOWLEDGE.governance}`;
        break;
      case 'resources':
        responseContent = `**Essential ZAO Resources:**\n\n${ZAO_KNOWLEDGE.resources}`;
        break;
      case 'onboard':
        responseContent = `**Welcome to The ZAO!** 🌊\n\n${ZAO_KNOWLEDGE.onboard}`;
        break;
      case 'web3':
        responseContent = `**Web3 vs Web2 for Artists:**\n\n${ZAO_KNOWLEDGE.web3}`;
        break;
      default:
        responseContent = `I'm not sure how to help with that command. Try /help for a list of available commands.`;
    }
    
    // Respond to the interaction
    await respondToInteraction(interaction.id, interaction.token, {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: responseContent
      }
    });
    
  } catch (error) {
    log('error', `Error handling slash command: ${error.message}`);
  }
}

/**
 * Respond to a Discord interaction
 */
async function respondToInteraction(interactionId, interactionToken, response) {
  try {
    const endpoint = `${DISCORD_API.INTERACTIONS}/${interactionId}/${interactionToken}/callback`;
    await discordRequest(endpoint, 'POST', response);
  } catch (error) {
    log('error', `Failed to respond to interaction: ${error.message}`);
  }
}

/**
 * Handle new guild member joining
 * @param {object} member - New guild member data
 */
async function handleNewMember(guildId, member) {
  try {
    // Get the system channel or first accessible text channel
    const guildChannels = await discordRequest(`${DISCORD_API.GUILDS.replace('users/@me', `guilds/${guildId}`)}/channels`);
    let welcomeChannelId = null;
    
    // Try to find a welcome channel
    for (const channel of guildChannels) {
      if (channel.name.includes('welcome') || channel.name.includes('introduction') || 
          channel.name === 'general' || channel.name === 'lobby') {
        if (await isChannelAccessible(channel.id)) {
          welcomeChannelId = channel.id;
          break;
        }
      }
    }
    
    // If no welcome channel found, use any text channel
    if (!welcomeChannelId) {
      for (const channel of guildChannels) {
        if (channel.type === 0 && await isChannelAccessible(channel.id)) { // 0 is text channel
          welcomeChannelId = channel.id;
          break;
        }
      }
    }
    
    if (welcomeChannelId) {
      const welcomeMessage = `Welcome to **The ZAO**, <@${member.user.id}>! 🌊\n\n` +
        `I'm ${BOT_CONFIG.name}, your guide to this creative community. To help you get started:\n\n` +
        `1️⃣ Introduce yourself in <#${welcomeChannelId}>\n` +
        `2️⃣ Type \`!onboard\` for a quick start guide\n` +
        `3️⃣ Join our next community call (check \`!events\` for details)\n\n` +
        `The ZAO is a decentralized impact network for creators built on Web3 principles of ownership, community, and economic agency. ` +
        `We're excited to have you join us on this journey!\n\n` +
        `Type \`!help\` any time to see how I can assist you.`;
        
      await sendMessage(welcomeChannelId, welcomeMessage);
    }
  } catch (error) {
    log('error', `Failed to handle new member: ${error.message}`);
  }
}

// Store bot user info globally
let me = null;

// Main function
async function main() {
  try {
    // Start server for healthchecks and interactions
    startServer();
    
    log('info', '=== ZAO AI DISCORD BOT ===');
    log('info', `Node version: ${process.version}`);
    log('info', `Bot started at: ${new Date().toISOString()}`);
    
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
    
    // Get bot user info
    const botUser = await discordRequest(DISCORD_API.ME);
    me = botUser; // Store bot user info globally
    log('info', `Logged in as ${botUser.username}#${botUser.discriminator || ''} (${botUser.id})`);
    log('info', `Bot avatar: ${botUser.avatar ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png` : 'None'}`);
    
    // Register slash commands if application ID is provided
    if (APPLICATION_ID) {
      try {
        await registerSlashCommands();
        log('info', 'Slash commands registered successfully');
      } catch (error) {
        log('error', `Failed to register slash commands: ${error.message}`);
      }
    }
    
    // Get guilds (servers) the bot is in
    const guilds = await discordRequest(DISCORD_API.GUILDS);
    log('info', `Bot is in ${guilds.length} guild(s)`);
    
    // Get channels from all guilds
    const channels = {};
    const lastMemberJoinChecks = {};
    
    for (const guild of guilds) {
      try {
        const guildChannels = await discordRequest(`${DISCORD_API.GUILD_CHANNELS.replace('{guild_id}', guild.id)}`);
        log('info', `Guild ${guild.name} (${guild.id}) has ${guildChannels.length} channels`);
        
        // Initialize last member check for this guild
        lastMemberJoinChecks[guild.id] = Date.now();
        
        // Add text channels to the polling list
        for (const channel of guildChannels) {
          if (channel.type === 0) { // 0 is text channel
            // Check if we can access this channel before adding it
            if (await isChannelAccessible(channel.id)) {
              log('info', `Adding channel #${channel.name} (${channel.id}) to polling list`);
              channels[channel.id] = null; // null means no messages processed yet
            } else {
              log('warn', `Skipping inaccessible channel #${channel.name} (${channel.id})`);
            }
          }
        }
      } catch (error) {
        log('error', `Failed to get channels for guild ${guild.id}: ${error.message}`);
      }
    }
    
    log('info', 'Bot startup complete and running');
    
    // Poll for new messages every 5 seconds
    setInterval(async () => {
      for (const channelId in channels) {
        // Skip channels that have been marked as inaccessible (null)
        if (channels[channelId] === null) continue;
        
        try {
          // Process messages and update last message ID
          const result = await processMessages(channelId, channels[channelId]);
          
          // If result is null, the channel is inaccessible
          if (result === null) {
            log('warn', `Channel ${channelId} is inaccessible due to permissions. Skipping future polls.`);
          }
          
          channels[channelId] = result;
        } catch (error) {
          log('error', `Error polling channel ${channelId}: ${error.message}`);
        }
      }
    }, 5000);
    
    // Check for new guild members every 60 seconds
    setInterval(async () => {
      try {
        for (const guild of await discordRequest(DISCORD_API.GUILDS)) {
          const guildId = guild.id;
          const lastCheckTime = lastMemberJoinChecks[guildId] || Date.now();
          
          try {
            // Get guild members who joined after the last check
            const endpoint = `/guilds/${guildId}/members?limit=10&after=${lastCheckTime}`;
            const newMembers = await discordRequest(endpoint);
            
            // Update last check time
            lastMemberJoinChecks[guildId] = Date.now();
            
            // Welcome each new member
            for (const member of newMembers) {
              if (member && member.user && !member.user.bot) {
                log('info', `New member joined ${guild.name}: ${member.user.username}`);
                await handleNewMember(guildId, member);
              }
            }
          } catch (error) {
            log('error', `Failed to check for new members in guild ${guildId}: ${error.message}`);
          }
        }
      } catch (error) {
        log('error', `Error in new member check: ${error.message}`);
      }
    }, 60000);
    
    // Keep alive with periodic logging
    setInterval(() => {
      log('info', `Bot is still running: ${new Date().toISOString()}`);
    }, 300000); // Log every 5 minutes
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
