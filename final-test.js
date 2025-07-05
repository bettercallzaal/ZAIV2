// Final test script for ElizaOS with Discord
import * as ElizaCore from '@elizaos/core';
import DiscordPlugin from '@elizaos/plugin-discord';

console.log('=== ELIZAOS FINAL TEST ===');
console.log('Node version:', process.version);

// Log environment variables
console.log('\nEnvironment variables:');
console.log('- DISCORD_API_TOKEN exists:', !!process.env.DISCORD_API_TOKEN);
console.log('- DISCORD_APPLICATION_ID exists:', !!process.env.DISCORD_APPLICATION_ID);
console.log('- DAEMON_PROCESS:', process.env.DAEMON_PROCESS);

try {
  console.log('\n1. Creating a service using defineService...');
  const botService = ElizaCore.defineService({
    name: 'ZAO Bot Service',
    description: 'A bot service for Railway deployment'
  });
  
  console.log('Service created:', botService.constructor.name);
  console.log('Service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(botService)));
  
  console.log('\n2. Creating a character using decryptedCharacter...');
  const character = ElizaCore.decryptedCharacter({
    name: 'ZAO Bot',
    description: 'A bot for Railway deployment'
  });
  
  console.log('Character created:', character);
  
  console.log('\n3. Examining Discord plugin...');
  console.log('Discord plugin type:', typeof DiscordPlugin);
  
  if (typeof DiscordPlugin === 'function') {
    console.log('Discord plugin is a constructor function');
    console.log('Creating Discord plugin instance...');
    
    const discordPlugin = new DiscordPlugin({
      token: process.env.DISCORD_API_TOKEN || 'dummy-token',
      applicationId: process.env.DISCORD_APPLICATION_ID || 'dummy-id',
      intents: ['Guilds', 'GuildMessages', 'MessageContent', 'DirectMessages'],
    });
    
    console.log('Discord plugin created:', discordPlugin);
    console.log('Discord plugin methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(discordPlugin)));
  } else if (typeof DiscordPlugin === 'object') {
    console.log('Discord plugin is an object');
    console.log('Discord plugin keys:', Object.keys(DiscordPlugin));
  }
  
  console.log('\n4. Looking for start methods in ElizaCore...');
  for (const key of Object.keys(ElizaCore)) {
    const value = ElizaCore[key];
    if (typeof value === 'function' && key.toLowerCase().includes('start')) {
      console.log(`Found potential start function: ${key}`);
    }
  }
  
  console.log('\n5. Checking if service has start method...');
  if (botService && typeof botService.start === 'function') {
    console.log('Service has start method, attempting to start...');
    try {
      // Try to start the service
      await botService.start();
      console.log('Service started successfully');
    } catch (error) {
      console.error('Error starting service:', error.message);
    }
  } else {
    console.log('Service does NOT have start method');
  }
  
} catch (error) {
  console.error('ERROR:', error);
}

console.log('\nFinal test completed');
