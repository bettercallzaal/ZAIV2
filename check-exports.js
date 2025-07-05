// Script to check the actual exports of ElizaOS packages
import * as elizaCore from '@elizaos/core';
import * as elizaDiscord from '@elizaos/plugin-discord';

console.log('=== ELIZAOS EXPORTS CHECK ===');
console.log('Node version:', process.version);

console.log('\n@elizaos/core exports:');
console.log(Object.keys(elizaCore));

console.log('\n@elizaos/plugin-discord exports:');
console.log(Object.keys(elizaDiscord));

// Try to find the character class or similar
console.log('\nSearching for Character-like exports in @elizaos/core:');
for (const key of Object.keys(elizaCore)) {
  const value = elizaCore[key];
  console.log(`- ${key}: ${typeof value}`);
  
  if (typeof value === 'function' || typeof value === 'object') {
    console.log(`  Constructor name: ${value.name || 'unnamed'}`);
    if (value.prototype) {
      console.log(`  Has prototype: true`);
      console.log(`  Prototype methods:`, Object.getOwnPropertyNames(value.prototype));
    }
  }
}

// Check if there's a default export
console.log('\nChecking for default export:');
console.log('Default export from @elizaos/core:', elizaCore.default ? 'exists' : 'does not exist');
if (elizaCore.default) {
  console.log('Type:', typeof elizaCore.default);
  console.log('Name:', elizaCore.default.name || 'unnamed');
}

console.log('\nExport check completed');
