// Simple debug script to test ElizaOS loading
import { Character } from '@elizaos/core';

console.log('ElizaOS debug script starting...');
console.log('Successfully imported Character from @elizaos/core');

// Check environment variables
console.log('\nEnvironment variables:');
console.log('- DISCORD_API_TOKEN exists:', !!process.env.DISCORD_API_TOKEN);
console.log('- DISCORD_APPLICATION_ID exists:', !!process.env.DISCORD_APPLICATION_ID);
console.log('- FARCASTER_NEYNAR_API_KEY exists:', !!process.env.FARCASTER_NEYNAR_API_KEY);
console.log('- DAEMON_PROCESS:', process.env.DAEMON_PROCESS);

// Try to create a minimal character
try {
  console.log('\nAttempting to create a minimal Character...');
  const minimalCharacter = new Character({
    name: 'Debug Character',
    description: 'A debug character for testing ElizaOS',
    plugins: []
  });
  console.log('Character created successfully:', minimalCharacter.name);
} catch (error) {
  console.error('Error creating Character:', error);
}

console.log('\nElizaOS debug script completed');
