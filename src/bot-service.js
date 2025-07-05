// ElizaOS Bot Service Implementation
import * as ElizaCore from '@elizaos/core';
import DiscordPlugin from '@elizaos/plugin-discord';

// Configure logging
const logger = ElizaCore.elizaLogger ? 
  ElizaCore.elizaLogger.child({ module: 'ZAOBotService' }) : 
  console;

/**
 * ZAO Bot Service using ElizaOS
 */
export class ZAOBotService {
  constructor(config = {}) {
    this.config = {
      name: 'ZAO AI Bot',
      description: 'An AI guide bot powered by ElizaOS',
      ...config
    };
    
    this.service = null;
    this.character = null;
    this.discordPlugin = null;
    this.isRunning = false;
  }
  
  /**
   * Initialize the bot service
   */
  async initialize() {
    try {
      logger.info('Initializing ZAO Bot Service...');
      
      // Check required environment variables
      this._validateEnvironment();
      
      // Initialize service
      await this._initializeService();
      
      // Initialize Discord plugin
      await this._initializeDiscordPlugin();
      
      // Create character
      await this._initializeCharacter();
      
      // Register plugins and character
      await this._registerComponents();
      
      logger.info('ZAO Bot Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize ZAO Bot Service:', error);
      throw error;
    }
  }
  
  /**
   * Initialize the ElizaOS service
   * @private
   */
  async _initializeService() {
    try {
      logger.info('Initializing ElizaOS service...');
      
      // Check if defineService is available
      const defineService = ElizaCore.defineService;
      if (typeof defineService !== 'function') {
        throw new Error('defineService is not a function');
      }
      
      // Create service
      const serviceConfig = {
        name: this.config.name || 'ZAO Bot Service',
        description: this.config.description || 'An AI guide bot powered by ElizaOS',
      };
      
      logger.info('Creating service with config:', JSON.stringify(serviceConfig));
      this.service = defineService(serviceConfig);
      
      if (!this.service) {
        throw new Error('Failed to create service');
      }
      
      // Log service properties to help with debugging
      logger.info('Service type:', typeof this.service);
      
      // Based on logs, the service might be a function with static methods
      if (typeof this.service === 'function') {
        logger.info('Service is a function, checking for static methods');
        const staticMethods = Object.getOwnPropertyNames(this.service);
        logger.info('Static methods:', staticMethods);
      } else {
        const serviceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.service));
        logger.info('Service instance methods:', serviceMethods);
      }
      
      logger.info('ElizaOS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ElizaOS service:', error);
      throw error;
    }
  }
  
  /**
   * Start the bot service
   */
  async start() {
    try {
      if (this.isRunning) {
        logger.warn('ZAO Bot Service is already running');
        return;
      }
      
      if (!this.service) {
        await this.initialize();
      }
      
      logger.info('Starting ZAO Bot Service...');
      
      // Based on logs, we need to initialize the Discord plugin first
      if (this.discordPlugin && typeof this.discordPlugin.init === 'function') {
        logger.info('Initializing Discord plugin...');
        await this.discordPlugin.init();
        logger.info('Discord plugin initialized');
      }
      
      // Try different approaches to start the service
      if (typeof this.service.start === 'function') {
        logger.info('Using service.start() method');
        // The error suggests we need to call start() directly on the service class/constructor
        // not on the service instance
        if (typeof this.service.constructor.start === 'function') {
          logger.info('Using service.constructor.start() method');
          await this.service.constructor.start(this.service);
        } else {
          // Try the instance method
          await this.service.start();
        }
      } else if (this.discordPlugin && typeof this.discordPlugin.start === 'function') {
        logger.info('Using discordPlugin.start() method');
        await this.discordPlugin.start();
      } else {
        logger.warn('No start method found on service or plugins');
        // Try to find any start-like method on the service
        const serviceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.service));
        const startMethod = serviceMethods.find(method => 
          method.toLowerCase().includes('start') || 
          method.toLowerCase().includes('run') || 
          method.toLowerCase().includes('launch')
        );
        
        if (startMethod) {
          logger.info(`Found potential start method: ${startMethod}`);
          await this.service[startMethod]();
        } else {
          logger.warn('No suitable start method found, service may not be fully operational');
        }
      }
      
      this.isRunning = true;
      logger.info('ZAO Bot Service started successfully');
      
      // Keep alive
      this._setupKeepAlive();
      
      return true;
    } catch (error) {
      logger.error('Failed to start ZAO Bot Service:', error);
      throw error;
    }
  }
  
  /**
   * Stop the bot service
   */
  async stop() {
    try {
      if (!this.isRunning) {
        logger.warn('ZAO Bot Service is not running');
        return;
      }
      
      logger.info('Stopping ZAO Bot Service...');
      
      // Try different approaches to stop the service
      if (typeof this.service.stop === 'function') {
        await this.service.stop();
      } else if (this.discordPlugin && typeof this.discordPlugin.stop === 'function') {
        await this.discordPlugin.stop();
      }
      
      this.isRunning = false;
      logger.info('ZAO Bot Service stopped successfully');
      
      return true;
    } catch (error) {
      logger.error('Failed to stop ZAO Bot Service:', error);
      throw error;
    }
  }
  
  /**
   * Validate required environment variables
   * @private
   */
  _validateEnvironment() {
    const requiredEnvVars = ['DISCORD_API_TOKEN', 'DISCORD_APPLICATION_ID'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    logger.info('Environment validation passed');
  }
  
  /**
   * Initialize Discord plugin
   * @private
   */
  async _initializeDiscordPlugin() {
    try {
      logger.info('Initializing Discord plugin...');
      
      // From the logs, we can see DiscordPlugin is an object with init method
      if (typeof DiscordPlugin === 'object') {
        logger.info('Using DiscordPlugin as object');
        this.discordPlugin = DiscordPlugin;
        
        // Configure the plugin
        if (!this.discordPlugin.config) {
          this.discordPlugin.config = {};
        }
        
        this.discordPlugin.config.token = process.env.DISCORD_API_TOKEN;
        this.discordPlugin.config.applicationId = process.env.DISCORD_APPLICATION_ID;
        this.discordPlugin.config.intents = ['Guilds', 'GuildMessages', 'MessageContent', 'DirectMessages'];
        
        logger.info('Discord plugin configuration set');
      } else if (typeof DiscordPlugin === 'function') {
        // Try as constructor
        logger.info('Using DiscordPlugin as constructor');
        this.discordPlugin = new DiscordPlugin({
          token: process.env.DISCORD_API_TOKEN,
          applicationId: process.env.DISCORD_APPLICATION_ID,
          intents: ['Guilds', 'GuildMessages', 'MessageContent', 'DirectMessages'],
        });
      } else if (typeof DiscordPlugin.default === 'function') {
        // Try default export as constructor
        logger.info('Using DiscordPlugin.default as constructor');
        this.discordPlugin = new DiscordPlugin.default({
          token: process.env.DISCORD_API_TOKEN,
          applicationId: process.env.DISCORD_APPLICATION_ID,
          intents: ['Guilds', 'GuildMessages', 'MessageContent', 'DirectMessages'],
        });
      } else {
        throw new Error('Unable to initialize Discord plugin: invalid plugin type');
      }
      
      if (!this.discordPlugin) {
        throw new Error('Failed to create Discord plugin instance');
      }
      
      logger.info('Discord plugin initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Discord plugin:', error);
      throw error;
    }
  }
  
  /**
   * Initialize character
   * @private
   */
  async _initializeCharacter() {
    try {
      logger.info('Creating character...');
      
      // Try decryptedCharacter first
      if (typeof ElizaCore.decryptedCharacter === 'function') {
        this.character = ElizaCore.decryptedCharacter({
          name: this.config.name,
          description: this.config.description,
        });
        logger.info('Character created using decryptedCharacter');
      } 
      // Fallback to encryptedCharacter
      else if (typeof ElizaCore.encryptedCharacter === 'function') {
        this.character = ElizaCore.encryptedCharacter({
          name: this.config.name,
          description: this.config.description,
        });
        logger.info('Character created using encryptedCharacter');
      }
      // Last resort - try to find any character creation function
      else {
        const characterFunctions = Object.keys(ElizaCore).filter(key => 
          typeof ElizaCore[key] === 'function' && 
          key.toLowerCase().includes('character')
        );
        
        if (characterFunctions.length > 0) {
          const characterFunction = characterFunctions[0];
          logger.info(`Trying character creation with ${characterFunction}`);
          this.character = ElizaCore[characterFunction]({
            name: this.config.name,
            description: this.config.description,
          });
        } else {
          logger.warn('No character creation function found');
        }
      }
      
      if (!this.character) {
        logger.warn('Failed to create character, continuing without character');
      }
    } catch (error) {
      logger.error('Failed to initialize character:', error);
      // Continue without character
      logger.warn('Continuing without character');
    }
  }
  
  /**
   * Register components with the service
   * @private
   */
  async _registerComponents() {
    try {
      // From the logs, we can see the Discord plugin has services property
      // which suggests it might need to be registered differently
      if (this.discordPlugin) {
        // If the plugin has a services property, it might be a collection of services
        if (this.discordPlugin.services && Array.isArray(this.discordPlugin.services)) {
          logger.info('Discord plugin has services array, registering each service...');
          for (const service of this.discordPlugin.services) {
            if (typeof this.service.registerService === 'function') {
              logger.info(`Registering Discord service: ${service.name || 'unnamed'}`);
              this.service.registerService(service);
            }
          }
        }
        
        // Try standard plugin registration methods
        if (typeof this.service.registerPlugin === 'function') {
          logger.info('Registering Discord plugin with service...');
          this.service.registerPlugin(this.discordPlugin);
        } else if (typeof this.service.addPlugin === 'function') {
          logger.info('Adding Discord plugin to service...');
          this.service.addPlugin(this.discordPlugin);
        } else {
          logger.warn('No method to register plugin with service');
          
          // Try to register with character instead
          if (this.character && typeof this.character.addPlugin === 'function') {
            logger.info('Adding Discord plugin to character...');
            this.character.addPlugin(this.discordPlugin);
          }
        }
      }
      
      // Register character with service
      if (this.character) {
        if (typeof this.service.registerCharacter === 'function') {
          logger.info('Registering character with service...');
          this.service.registerCharacter(this.character);
        } else if (typeof this.service.addCharacter === 'function') {
          logger.info('Adding character to service...');
          this.service.addCharacter(this.character);
        } else {
          logger.warn('No method to register character with service');
        }
      }
    } catch (error) {
      logger.error('Failed to register components:', error);
      throw error;
    }
  }
  
  /**
   * Set up keep-alive mechanism
   * @private
   */
  _setupKeepAlive() {
    if (process.env.DAEMON_PROCESS === 'true') {
      logger.info('Setting up keep-alive for daemon mode');
      
      // Log status periodically
      this.keepAliveInterval = setInterval(() => {
        logger.info(`ZAO Bot Service is running: ${new Date().toISOString()}`);
      }, 60 * 60 * 1000); // Every hour
      
      // Handle process signals
      process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down...');
        await this.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down...');
        await this.stop();
        process.exit(0);
      });
    }
  }
}

export default ZAOBotService;
