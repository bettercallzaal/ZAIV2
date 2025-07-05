// Try using star import to see all exports
import * as ElizaCore from '@elizaos/core';
import * as ElizaDiscord from '@elizaos/plugin-discord';

console.log('=== ELIZAOS STAR IMPORT TEST ===');
console.log('Node version:', process.version);

console.log('\n@elizaos/core exports:');
console.log(Object.keys(ElizaCore));

console.log('\n@elizaos/plugin-discord exports:');
console.log(Object.keys(ElizaDiscord));

// Try to find the character class or similar
console.log('\nSearching for Character-like exports in @elizaos/core:');
for (const key of Object.keys(ElizaCore)) {
  const value = ElizaCore[key];
  console.log(`- ${key}: ${typeof value}`);
  
  if (typeof value === 'function') {
    console.log(`  Constructor name: ${value.name || 'unnamed'}`);
    if (value.prototype) {
      console.log(`  Has prototype: true`);
      console.log(`  Prototype methods:`, Object.getOwnPropertyNames(value.prototype));
    }
  }
}

// Try to find the Discord plugin
console.log('\nSearching for Discord plugin in @elizaos/plugin-discord:');
for (const key of Object.keys(ElizaDiscord)) {
  const value = ElizaDiscord[key];
  console.log(`- ${key}: ${typeof value}`);
  
  if (typeof value === 'function') {
    console.log(`  Constructor name: ${value.name || 'unnamed'}`);
    if (value.prototype) {
      console.log(`  Has prototype: true`);
      console.log(`  Prototype methods:`, Object.getOwnPropertyNames(value.prototype));
    }
  }
}

console.log('\nStar import test completed');
