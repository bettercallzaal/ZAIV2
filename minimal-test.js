// Minimal test script for ElizaOS with Discord
import ElizaCore from '@elizaos/core';
import ElizaDiscord from '@elizaos/plugin-discord';

// Log what we imported
console.log('ElizaCore type:', typeof ElizaCore);
console.log('ElizaDiscord type:', typeof ElizaDiscord);

console.log('=== MINIMAL ELIZAOS TEST ===');
console.log('Node version:', process.version);
console.log('Environment variables:');
console.log('- DISCORD_API_TOKEN exists:', !!process.env.DISCORD_API_TOKEN);
console.log('- DISCORD_APPLICATION_ID exists:', !!process.env.DISCORD_APPLICATION_ID);
console.log('- DAEMON_PROCESS:', process.env.DAEMON_PROCESS);

try {
  console.log('\nExamining ElizaCore object:');
  console.log('Keys:', Object.keys(ElizaCore));
  
  if (typeof ElizaCore === 'function') {
    console.log('ElizaCore is a constructor function');
    console.log('ElizaCore name:', ElizaCore.name);
  } else if (typeof ElizaCore === 'object') {
    console.log('ElizaCore is an object');
    if (ElizaCore.Character) {
      console.log('Found Character class in ElizaCore');
    }
  }
  
  console.log('\nExamining ElizaDiscord object:');
  console.log('Keys:', Object.keys(ElizaDiscord));
  
  if (typeof ElizaDiscord === 'function') {
    console.log('ElizaDiscord is a constructor function');
    console.log('ElizaDiscord name:', ElizaDiscord.name);
  } else if (typeof ElizaDiscord === 'object') {
    console.log('ElizaDiscord is an object');
    if (ElizaDiscord.DiscordPlugin) {
      console.log('Found DiscordPlugin class in ElizaDiscord');
    }
  }
  
  // Try to create a character based on what we find
  console.log('\nAttempting to create a character...');
  
  // Determine the correct way to create a character
  const CharacterClass = ElizaCore.Character || ElizaCore;
  const DiscordPluginClass = ElizaDiscord.DiscordPlugin || ElizaDiscord;
  
  console.log('Using CharacterClass:', CharacterClass.name || 'unnamed');
  console.log('Using DiscordPluginClass:', DiscordPluginClass.name || 'unnamed');
  
  // Create a minimal character with just Discord
  const character = new CharacterClass({
    name: 'Test Bot',
    description: 'A test bot for Railway deployment',
    plugins: [
      new DiscordPluginClass({
        token: process.env.DISCORD_API_TOKEN,
        applicationId: process.env.DISCORD_APPLICATION_ID,
        intents: ['Guilds', 'GuildMessages', 'MessageContent', 'DirectMessages'],
      }),
    ],
  });

  console.log('Character created successfully');
  console.log('Starting character...');
  
  // Start the character
  await character.start();
  
  console.log('Character started successfully');
  
  // Keep the process alive
  console.log('Keeping process alive...');
  setInterval(() => {
    console.log('Still alive at', new Date().toISOString());
  }, 60000);
  
} catch (error) {
  console.error('ERROR:', error);
}
