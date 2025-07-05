// Force debug output for Railway deployment
console.log('===== DISCORD DEBUG RAILWAY =====');
console.log('Environment check:');
console.log('- DISCORD_API_TOKEN exists:', !!process.env.DISCORD_API_TOKEN);
console.log('- DISCORD_APPLICATION_ID exists:', !!process.env.DISCORD_APPLICATION_ID);

// Try to load Discord.js directly to check for any issues
try {
  console.log('Attempting to require Discord.js...');
  const discord = require('discord.js');
  console.log('Discord.js version:', discord.version);
  
  // Try to initialize a client
  console.log('Creating test client...');
  const client = new discord.Client({
    intents: [
      discord.GatewayIntentBits.Guilds,
      discord.GatewayIntentBits.GuildMessages,
      discord.GatewayIntentBits.MessageContent
    ]
  });
  
  console.log('Test client created successfully');
  
  // Add event listeners but don't actually login
  client.on('ready', () => {
    console.log('Would connect as:', client.user?.tag);
  });
  
  console.log('Discord.js checks passed');
} catch (error) {
  console.error('Discord.js error:', error);
}

// Export the module for integration into the bundle
module.exports = { debugRun: true };
