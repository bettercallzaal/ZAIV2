// Minimal test script for ElizaOS with Discord
import { Character } from '@elizaos/core';
import { DiscordPlugin } from '@elizaos/plugin-discord';

console.log('=== MINIMAL ELIZAOS TEST ===');
console.log('Node version:', process.version);
console.log('Environment variables:');
console.log('- DISCORD_API_TOKEN exists:', !!process.env.DISCORD_API_TOKEN);
console.log('- DISCORD_APPLICATION_ID exists:', !!process.env.DISCORD_APPLICATION_ID);
console.log('- DAEMON_PROCESS:', process.env.DAEMON_PROCESS);

try {
  console.log('\nCreating minimal character with Discord plugin...');
  
  // Create a minimal character with just Discord
  const character = new Character({
    name: 'Test Bot',
    description: 'A test bot for Railway deployment',
    plugins: [
      new DiscordPlugin({
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
