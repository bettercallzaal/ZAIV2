// Test using the actual exports we found
import * as ElizaCore from '@elizaos/core';
import * as ElizaDiscord from '@elizaos/plugin-discord';

console.log('=== ELIZAOS ACTUAL EXPORTS TEST ===');
console.log('Node version:', process.version);

// Look for character-related functions
const characterFunctions = [
  'decryptedCharacter',
  'encryptedCharacter'
];

console.log('\nTrying character-related functions:');
for (const funcName of characterFunctions) {
  if (typeof ElizaCore[funcName] === 'function') {
    console.log(`Found ${funcName} function`);
    try {
      // Try creating a character with minimal config
      const character = ElizaCore[funcName]({
        name: 'Test Bot',
        description: 'A test bot for Railway deployment'
      });
      
      console.log(`Successfully created character using ${funcName}`);
      console.log('Character:', character);
      
      // Check if it has a start method
      if (character && typeof character.start === 'function') {
        console.log(`Character has start method`);
      } else {
        console.log(`Character does NOT have start method`);
      }
    } catch (error) {
      console.error(`Error creating character with ${funcName}:`, error.message);
    }
  }
}

// Look for Discord plugin
console.log('\nLooking for Discord plugin in exports:');
const discordKeys = Object.keys(ElizaDiscord);
console.log('Discord exports:', discordKeys);

// Try to find something that looks like a plugin
const pluginCandidates = discordKeys.filter(key => 
  key.toLowerCase().includes('plugin') || 
  key.toLowerCase().includes('discord')
);

console.log('Plugin candidates:', pluginCandidates);

// Try the defineService function
console.log('\nTrying defineService function:');
if (typeof ElizaCore.defineService === 'function') {
  try {
    const service = ElizaCore.defineService({
      name: 'TestService',
      description: 'A test service'
    });
    console.log('Successfully created service');
    console.log('Service:', service);
  } catch (error) {
    console.error('Error creating service:', error.message);
  }
}

console.log('\nActual exports test completed');
