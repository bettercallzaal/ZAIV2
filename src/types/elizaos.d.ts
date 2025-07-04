import '@elizaos/core';

// Extend the ElizaOS Character type definition to include additional fields
declare module '@elizaos/core' {
  interface Character {
    lore?: string[];
    postExamples?: string[];
  }
}
