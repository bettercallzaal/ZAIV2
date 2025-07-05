// This is an ES module script to examine ElizaOS package structure
import fs from 'fs';
import path from 'path';

// Function to examine a package.json
function examinePackage(packagePath) {
  try {
    const content = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(content);
    
    console.log(`\n----- Package: ${packagePath} -----`);
    console.log('Type:', packageJson.type || 'Not specified (CommonJS by default)');
    console.log('Main:', packageJson.main || 'Not specified');
    console.log('Module:', packageJson.module || 'Not specified');
    console.log('Exports:', packageJson.exports ? JSON.stringify(packageJson.exports, null, 2) : 'Not specified');
    
    return packageJson;
  } catch (err) {
    console.error(`Error examining ${packagePath}:`, err);
    return null;
  }
}

// Examine node_modules structure
const nodeModulesPath = path.resolve('./node_modules');
const elizaCorePackagePath = path.resolve(nodeModulesPath, '@elizaos/core/package.json');
const elizaDiscordPackagePath = path.resolve(nodeModulesPath, '@elizaos/plugin-discord/package.json');
const elizaFarcasterPackagePath = path.resolve(nodeModulesPath, '@elizaos/plugin-farcaster/package.json');

console.log('EXAMINING ELIZAOS PACKAGE STRUCTURE');
console.log('===================================');

examinePackage(elizaCorePackagePath);
examinePackage(elizaDiscordPackagePath);
examinePackage(elizaFarcasterPackagePath);

console.log('\nFILE STRUCTURE');
console.log('==============');

try {
  const coreFiles = fs.readdirSync(path.dirname(elizaCorePackagePath));
  console.log('\n@elizaos/core files:', coreFiles);
} catch (err) {
  console.error('Error listing core files:', err);
}

// Try to resolve main file
console.log('\nTRY TO RESOLVE MANUALLY');
console.log('======================');

try {
  const corePackage = examinePackage(elizaCorePackagePath);
  if (corePackage && corePackage.main) {
    const mainFilePath = path.resolve(path.dirname(elizaCorePackagePath), corePackage.main);
    console.log(`\nResolving main file: ${mainFilePath}`);
    if (fs.existsSync(mainFilePath)) {
      console.log('File exists!');
      const content = fs.readFileSync(mainFilePath, 'utf8');
      console.log('First 100 characters:', content.substring(0, 100) + '...');
    } else {
      console.log('File does not exist');
    }
  }
} catch (err) {
  console.error('Error resolving main file:', err);
}
