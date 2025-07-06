# Project Starter

This is the starter template for ElizaOS projects.

## Features

- Pre-configured project structure for ElizaOS development
- Comprehensive testing setup with component and e2e tests
- Default character configuration with plugin integration
- Example service, action, and provider implementations
- TypeScript configuration for optimal developer experience
- Built-in documentation and examples

## Getting Started

```bash
# Create a new project
elizaos create -t project my-project
# Dependencies are automatically installed and built

# Navigate to the project directory
cd my-project

# Start development immediately
elizaos dev
```

## Development

```bash
# Start development with hot-reloading (recommended)
elizaos dev

# OR start without hot-reloading
elizaos start
# Note: When using 'start', you need to rebuild after changes:
# bun run build

# Test the project
elizaos test
```

## Testing

ElizaOS provides a comprehensive testing structure for projects:

### Test Structure

- **Component Tests** (`__tests__/` directory):

  - **Unit Tests**: Test individual functions and components in isolation
  - **Integration Tests**: Test how components work together
  - Run with: `elizaos test component`

- **End-to-End Tests** (`e2e/` directory):

  - Test the project within a full ElizaOS runtime
  - Run with: `elizaos test e2e`

- **Running All Tests**:
  - `elizaos test` runs both component and e2e tests

### Writing Tests

Component tests use Vitest:

```typescript
// Unit test example (__tests__/config.test.ts)
describe('Configuration', () => {
  it('should load configuration correctly', () => {
    expect(config.debug).toBeDefined();
  });
});

// Integration test example (__tests__/integration.test.ts)
describe('Integration: Plugin with Character', () => {
  it('should initialize character with plugins', async () => {
    // Test interactions between components
  });
});
```

E2E tests use ElizaOS test interface:

```typescript
// E2E test example (e2e/project.test.ts)
export class ProjectTestSuite implements TestSuite {
  name = 'project_test_suite';
  tests = [
    {
      name: 'project_initialization',
      fn: async (runtime) => {
        // Test project in a real runtime
      },
    },
  ];
}

export default new ProjectTestSuite();
```

The test utilities in `__tests__/utils/` provide helper functions to simplify writing tests.

## Configuration

Customize your project by modifying:

- `src/index.ts` - Main entry point
- `src/character.ts` - Character definition


# ZAO AI Discord Bot

## Overview

The ZAO AI Discord bot is an AI-powered assistant designed to help new users understand The ZAO ecosystem, earn $ZAO Respect tokens, and participate in the community's decentralized governance and activities. It provides a comprehensive onboarding experience for new community members while embodying the values of The ZAO (ZTalent Artist Organization) - a decentralized impact network for creators.

### Implementation Notes

This project includes two bot implementations:

1. **HTTP-based Discord Bot** (`http-discord-bot.js`): A lightweight bot implementation using only Node.js built-in modules, designed for maximum compatibility and minimal dependencies. This is the currently active implementation.

2. **ElizaOS-based Bot** (in `src/` directory): A more feature-rich implementation built on ElizaOS with LLM integration capabilities (not currently active).

The HTTP-based bot provides all core functionality with high reliability and minimal external dependencies, making it easy to deploy on services like Render.com.

## Key Features

- **Onboarding Assistance**: Personalized introductions and guided user journeys
- **Educational Support**: Artist-friendly explanations of Web3 concepts
- **Community Integration**: Guidance on joining fractal groups and Hivemind discussions
- **Governance & Token Education**: Information about the Respect Game and earning $ZAO tokens
- **Event Information**: Details about community events and competitions
- **New Member Welcome**: Automatic welcome messages for new server members
- **Slash Commands**: Rich interactive Discord slash commands

## Bot Commands

The ZAO AI Discord bot supports both text commands (prefixed with `!`) and slash commands. For a complete list of available commands and their descriptions, see the [Commands Documentation](COMMANDS.md).

### Quick Command Reference

```
# Basic Commands
,help         - Show available commands
,ping         - Check if bot is online
,start        - Begin onboarding process

# ZAO Information
,about        - Learn about The ZAO
,respect      - Information about tokens
,events       - Upcoming community events
,governance   - ZAO governance system

# Slash Commands
/help, /about, /respect, /events, etc.
```

The bot also responds to direct mentions and questions.

## Installation Requirements

Before setting up the ZaoGuide Discord bot, ensure you have the following installed:

### System Requirements

- **Node.js** (v23+): JavaScript runtime environment
- **Bun** (v1.0+): Fast JavaScript runtime and package manager
- **Git**: Version control system

### API Keys Required

- **Discord Developer Account**: For bot creation and API access
- **OpenAI API Key** or **Anthropic API Key**: For LLM capabilities

## Project Setup Guide

### HTTP-based Bot Setup (Active Implementation)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/zao-guide-bot.git
   cd zao-guide-bot
   ```

2. Create a `.env` file with the following variables:
   ```
   # Required environment variables
   DISCORD_API_TOKEN=your_bot_token
   DISCORD_APPLICATION_ID=your_application_id
   PORT=8080  # Optional, defaults to 8080
   ```

3. Run the bot directly with Node.js:
   ```bash
   node http-discord-bot.js
   ```

4. For deployment to services like Render.com, use the provided Dockerfile and start.sh script

### ElizaOS-based Bot Setup (Alternative Implementation)

### Step 1: Environment Setup

1. Install Bun package manager:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   # Reload shell after installation
   exec /bin/zsh  # or your shell of choice
   ```

2. Verify Bun installation:
   ```bash
   bun --version  # Should return the installed version
   ```

3. Install ElizaOS CLI:
   ```bash
   bun install -g @elizaos/cli
   ```

4. Verify ElizaOS installation:
   ```bash
   elizaos --version  # Should return the installed version
   ```

### Step 2: Project Initialization

1. Create a new ElizaOS project:
   ```bash
   elizaos create zao-guide-bot --type project
   cd zao-guide-bot
   ```

2. Initialize Git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

### Step 3: Discord Bot Setup

1. Create a new application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Add a Bot user to your application
3. Enable required Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent
   - Presence Intent
4. Copy the bot token (keep it secure!)
5. Generate an invite URL with appropriate scopes and permissions
6. Add the bot to your test server

### Step 4: Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file to add your Discord and LLM provider credentials:
   ```
   # Discord configuration
   DISCORD_APPLICATION_ID=your_application_id
   DISCORD_API_TOKEN=your_bot_token
   
   # OpenAI configuration (choose one provider)
   OPENAI_API_KEY=your_openai_api_key
   # OR
   # Anthropic configuration
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

### Step 5: Character Configuration

1. Create the ZaoGuide character configuration:
   ```bash
   elizaos create --type agent zao-guide
   ```

2. Edit the `characters/zao-guide.json` file to customize the bot's personality, knowledge, and behavior according to The Zao's values

## Project Structure

```
zao-guide-bot/
├── .env                 # Environment variables (API keys)
├── .gitignore           # Git ignore file
├── package.json         # Project dependencies
├── src/
│   ├── index.ts         # Main entry point
│   ├── character.ts     # Character definition for ZAO AI
│   ├── plugins/         # Custom plugins
│   └── knowledge/       # Knowledge base content
│       ├── index.md     # Knowledge base overview
│       ├── zao-ecosystem.md    # ZAO ecosystem information
│       ├── zao-token-system.md # $ZAO token details
│       ├── zao-events.md       # Community events information
│       └── onboarding-guide.md # New member onboarding process
├── tests/               # Test suite
└── README.md            # This documentation
```

## Implementation Roadmap

### Phase 1: Foundation Setup
- ✅ Research The Zao ecosystem and ElizaOS capabilities
- ✅ Install required development tools (Bun, ElizaOS CLI)
- ✅ Create comprehensive knowledge base for The ZAO ecosystem
- ⬜ Create Discord application and obtain API credentials
- ⬜ Set up basic ElizaOS project with Discord client

### Phase 2: Bot Personality Development
- ✅ Create core personality design in character.ts file
- ⬜ Design conversation flows for onboarding and common queries
- ⬜ Enhance character with additional message examples

### Phase 3: Bot Implementation
- ⬜ Implement Discord client integration
- ⬜ Create command handlers for key information queries
- ⬜ Develop guided flows for onboarding and education

### Phase 4: Testing & Refinement
- ⬜ Test all bot commands in isolated environment
- ⬜ Verify personality consistency across different queries
- ⬜ Collect feedback and make improvements

### Phase 5: Deployment & Launch
- ⬜ Deploy bot to production environment
- ⬜ Announce to The Zao community
- ⬜ Monitor initial interactions

## Running the Bot

1. Start the ElizaOS agent:
   ```bash
   elizaos start
   ```

2. For development with live reloading:
   ```bash
   elizaos start --watch
   ```

## Character Configuration

The ZaoGuide bot's personality is defined in the `zao-guide.json` file with the following structure:

```json
{
  "name": "ZaoGuide",
  "plugins": [
    "@elizaos/plugin-openai",
    "@elizaos/client-discord"
  ],
  "system": "You are ZaoGuide, the official guide for The ZAO (ZTalent Artist Organization)...",
  "bio": [
    "Decentralization Advocate",
    "Community Builder", 
    "Educational Guide"
  ],
  "messageExamples": [
    // Example conversations to establish the bot's tone and knowledge
  ]
}
```

## Testing

- Run the bot in development mode to test locally
- Use a dedicated test Discord server
- Create test scenarios for common user journeys
- Verify response accuracy and personality alignment

## Deployment

- Configure environment variables for production
- Set up monitoring and logging
- Implement restart procedures
- Document maintenance protocols

## Resources

- [The Zao Website](https://www.thezao.com)
- [ElizaOS Documentation](https://eliza.how/docs)
- [Discord Developer Portal](https://discord.com/developers/applications)

## ElizaOS Commands & Best Practices

### Installation
```bash
# Install ElizaOS globally
npm install -g @elizaos/cli

# Verify installation
elizaos --version
```

### Project Setup Commands
```bash
# Create a new project with the interactive wizard
elizaos create

# Initialize existing project
elizaos init

# Install dependencies
bun install
# or
npm install
```

### Development Commands
```bash
# Start in development mode (with hot reloading)
elizaos dev

# Build TypeScript files
bun run build
# or
tsc
```

### Production Commands
```bash
# Build and start the bot
elizaos start --build

# Start with specific character file
elizaos start --character ./dist/character.js

# Start on a custom port
elizaos start --port 8080

# Start with minimal logging
elizaos start --quiet

# Start as a background process
nohup elizaos start > elizaos.log 2>&1 &
```

### Environment Variables
ElizaOS automatically loads environment variables from a `.env` file in the project root:

```
# Required for Discord integration
DISCORD_APPLICATION_ID=your_discord_application_id
DISCORD_API_TOKEN=your_discord_bot_token

# Required for LLM integration (choose one)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional security (recommended for production)
ELIZA_SERVER_AUTH_TOKEN=your_server_auth_token
```

### Health Checks & Monitoring
```bash
# Verify the service is running
curl http://localhost:3000/health

# Check process status
ps aux | grep elizaos

# Monitor logs
tail -f elizaos.log
```

### Troubleshooting

- **Port Conflicts**: If port 3000 is in use, ElizaOS will automatically try the next available port
- **Character Loading Issues**: Ensure character files are properly compiled to JS if using TypeScript
- **Discord Connection**: Verify your bot token is correct and the bot has been added to your server
- **Missing LLM Responses**: Check that you've provided valid API keys for OpenAI or Anthropic

## Future Enhancements

Based on research of ElizaOS capabilities and The ZAO ecosystem, here are potential enhancements for future development:

### Advanced Conversation Flows
- **Artist Onboarding Journey**: A step-by-step guided conversation for new artists
- **Governance Participation**: Interactive explanations of how to participate in ZAO governance
- **Token Education**: Interactive tutorials on earning and understanding $ZAO tokens
- **Event Reminders**: Automated notifications about upcoming ZAO events

### Integration Opportunities
- **ZAO Leaderboard Connection**: Real-time $ZAO token tracking integration
- **ZAO NEXUS Integration**: Dynamic linking to relevant ZAO resources
- **Calendar Integration**: Automatic event notifications and reminders
- **Discord Role Management**: Automated role assignments based on participation

### Technical Enhancements
- **Advanced RAG Implementation**: Enhanced retrieval for more accurate information delivery
- **Multi-platform Support**: Expand beyond Discord to other platforms
- **Analytics Dashboard**: Track bot usage patterns to improve responses
- **Interactive Components**: Implement Discord buttons and menus for better navigation

### Community Features
- **Fractal Group Formation Assistant**: Help users find and join relevant groups
- **Contribution Tracking**: Monitor community participation for token allocation
- **Custom Welcome Messages**: Personalized greetings for new members
- **Community Polls**: Facilitate community voting on initiatives

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[MIT License](LICENSE)

## Contact

For questions or support, please contact The Zao team or project maintainers.
