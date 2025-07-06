// ElizaOS Bot Service Implementation
import * as ElizaCore from '@elizaos/core';
import DiscordPlugin from '@elizaos/plugin-discord';

// Configure logging
const logger = ElizaCore.elizaLogger ? 
  ElizaCore.elizaLogger.child({ module: 'ZAOBotService' }) : 
  console;

// Import specific ElizaOS service creation methods
const { defineService, Service } = ElizaCore;

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
      
      // Log all available methods on ElizaCore for debugging
      const elizaCoreMethods = Object.getOwnPropertyNames(ElizaCore);
      logger.info('Available ElizaCore methods:', elizaCoreMethods);
      
      // Create service definition according to ElizaOS documentation
      const serviceDefinition = {
        serviceType: 'zao_bot',
        description: this.config.description || 'An AI guide bot powered by ElizaOS',
        start: async (runtime) => {
          logger.info('Service start method called with runtime');
          // Store runtime for later use
          this.runtime = runtime;
          return this;
        },
        stop: async () => {
          logger.info('Service stop method called');
          // Cleanup logic
          if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
          }
        }
      };
      
      // Create the service using defineService as per ElizaOS documentation
      if (typeof defineService === 'function') {
        logger.info('Creating service with defineService and config:', JSON.stringify(serviceDefinition));
        this.serviceClass = defineService(serviceDefinition);
        this.service = this;
        logger.info('Service class created successfully');
      } else {
        logger.warn('defineService is not a function, using alternative approach');
        
        // Create a traditional service class as fallback
        class ZAOBotServiceClass extends Service {
          static serviceType = 'zao_bot';
          capabilityDescription = this.config.description || 'An AI guide bot powered by ElizaOS';
          
          static async start(runtime) {
            logger.info('Static start method called with runtime');
            this.runtime = runtime;
            return this;
          }
          
          async stop() {
            logger.info('Instance stop method called');
            if (this.keepAliveInterval) {
              clearInterval(this.keepAliveInterval);
            }
          }
        }
        
        this.serviceClass = ZAOBotServiceClass;
        this.service = this;
      }
      
      // Log service properties to help with debugging
      logger.info('Service class type:', typeof this.serviceClass);
      logger.info('Service instance type:', typeof this.service);
      
      if (typeof this.service === 'object') {
        logger.info('Service is an object, checking for methods');
        const serviceMethods = Object.getOwnPropertyNames(this.service);
        logger.info('Service methods:', serviceMethods);
        
        // Check for instance methods
        const instanceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.service) || {});
        logger.info('Service instance methods:', instanceMethods);
      }
      
      // Check if the service has an init method
      if (this.service && typeof this.service.init === 'function') {
        logger.info('Service has init method, calling it');
        await this.service.init();
        logger.info('Service init called successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize ElizaOS service:', error);
      logger.warn('Continuing with ElizaCore as service');
      this.service = ElizaCore;
    }
  }
  
  /**
   * Initialize Discord plugin
   * @private
   */
  async _initializeDiscordPlugin() {
    try {
      logger.info('Initializing Discord plugin...');
      
      // Check if Discord API token is available
      if (!process.env.DISCORD_API_TOKEN || !process.env.DISCORD_APPLICATION_ID) {
        logger.warn('Discord API token or application ID not found, skipping Discord plugin initialization');
        return;
      }
      
      logger.info('Discord plugin import type:', typeof DiscordPlugin);
      
      // Create Discord plugin configuration
      const discordConfig = {
        token: process.env.DISCORD_API_TOKEN,
        applicationId: process.env.DISCORD_APPLICATION_ID,
        intents: ['Guilds', 'GuildMessages', 'MessageContent', 'DirectMessages'],
      };
      
      // Handle different export patterns based on ElizaOS plugin structure
      if (typeof DiscordPlugin === 'function') {
        logger.info('Discord plugin is a constructor function, creating instance');
        this.discordPlugin = new DiscordPlugin(discordConfig);
      } else if (typeof DiscordPlugin === 'object') {
        logger.info('Discord plugin is an object, configuring directly');
        this.discordPlugin = DiscordPlugin;
        
        // Configure the plugin - ElizaOS plugins expect a config property
        this.discordPlugin.config = discordConfig;
      } else {
        logger.warn(`Unexpected Discord plugin type: ${typeof DiscordPlugin}`);
        return;
      }
      
      // Log available methods on the Discord plugin
      const discordPluginMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.discordPlugin) || {});
      logger.info('Discord plugin methods:', discordPluginMethods);
      
      // Check if the plugin has services property (common in ElizaOS plugins)
      if (this.discordPlugin.services) {
        logger.info('Discord plugin has services:', Array.isArray(this.discordPlugin.services) ? 
          this.discordPlugin.services.length : typeof this.discordPlugin.services);
      }
      
      logger.info('Discord plugin initialized and ready for registration');
    } catch (error) {
      logger.error('Failed to initialize Discord plugin:', error);
      // Continue without Discord plugin
      logger.warn('Continuing without Discord plugin');
    }
  }
  
  /**
   * Initialize character
   * @private
   */
  async _initializeCharacter() {
    try {
      // Check if decryptedCharacter is available
      if (typeof ElizaCore.decryptedCharacter === 'function') {
        logger.info('Creating character with decryptedCharacter');
        try {
          this.character = ElizaCore.decryptedCharacter({
            name: this.config.name,
            description: this.config.description,
          });
          logger.info('Character created successfully with decryptedCharacter');
        } catch (err) {
          logger.error('Error creating character with decryptedCharacter:', err);
        }
      } 
      
      // Try encryptedCharacter if available
      if (!this.character && typeof ElizaCore.encryptedCharacter === 'function') {
        logger.info('Creating character with encryptedCharacter');
        try {
          this.character = ElizaCore.encryptedCharacter({
            name: this.config.name,
            description: this.config.description,
          });
          logger.info('Character created successfully with encryptedCharacter');
        } catch (err) {
          logger.error('Error creating character with encryptedCharacter:', err);
        }
      } 
      
      // Try Character constructor if available
      if (!this.character && typeof ElizaCore.Character === 'function') {
        logger.info('Creating character with Character constructor');
        try {
          this.character = new ElizaCore.Character({
            name: this.config.name,
            description: this.config.description,
          });
          logger.info('Character created successfully with Character constructor');
        } catch (err) {
          logger.error('Error creating character with Character constructor:', err);
        }
      } 
      
      // Look for any function that might create a character
      if (!this.character) {
        logger.warn('No standard character creation method found, searching for alternatives...');
        
        const characterFunctions = Object.keys(ElizaCore).filter(key => 
          typeof ElizaCore[key] === 'function' && 
          key.toLowerCase().includes('character')
        );
        
        logger.info('Found potential character functions:', characterFunctions);
        
        for (const characterFunction of characterFunctions) {
          try {
            logger.info(`Trying character creation with ${characterFunction}`);
            this.character = ElizaCore[characterFunction]({
              name: this.config.name,
              description: this.config.description,
            });
            
            if (this.character) {
              logger.info(`Character created successfully with ${characterFunction}`);
              break;
            }
          } catch (err) {
            logger.error(`Error creating character with ${characterFunction}:`, err);
          }
        }
      }
      
      if (!this.character) {
        logger.warn('Failed to create character, continuing without character');
      } else {
        logger.info('Character created:', this.character);
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
      // According to ElizaOS documentation, plugins need to be registered with ElizaCore
      if (this.discordPlugin) {
        // Register Discord plugin with ElizaCore directly
        if (typeof ElizaCore.registerPlugin === 'function') {
          logger.info('Registering Discord plugin with ElizaCore...');
          ElizaCore.registerPlugin(this.discordPlugin);
          logger.info('Discord plugin registered with ElizaCore');
        } 
        // If plugin has services, register each service individually
        else if (this.discordPlugin.services && Array.isArray(this.discordPlugin.services)) {
          logger.info('Discord plugin has services array, registering each service...');
          for (const service of this.discordPlugin.services) {
            if (typeof ElizaCore.registerService === 'function') {
              logger.info(`Registering Discord service: ${service.name || 'unnamed'}`);
              ElizaCore.registerService(service);
            }
          }
        }
        // Try alternative registration methods
        else if (typeof ElizaCore.addPlugin === 'function') {
          logger.info('Adding Discord plugin to ElizaCore...');
          ElizaCore.addPlugin(this.discordPlugin);
        } else {
          logger.warn('No method to register plugin with ElizaCore');
          
          // Try to register with character as fallback
          if (this.character && typeof this.character.addPlugin === 'function') {
            logger.info('Adding Discord plugin to character...');
            this.character.addPlugin(this.discordPlugin);
          }
        }
      }
      
      // Register character with ElizaCore
      if (this.character) {
        if (typeof ElizaCore.registerCharacter === 'function') {
          logger.info('Registering character with ElizaCore...');
          ElizaCore.registerCharacter(this.character);
          logger.info('Character registered with ElizaCore');
        } else if (typeof ElizaCore.addCharacter === 'function') {
          logger.info('Adding character to ElizaCore...');
          ElizaCore.addCharacter(this.character);
          logger.info('Character added to ElizaCore');
        } else {
          logger.warn('No method to register character with ElizaCore');
        }
      }
    } catch (error) {
      logger.error('Failed to register components:', error);
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
      
      // Initialize Discord plugin first (required before ElizaOS initialization)
      if (this.discordPlugin && typeof this.discordPlugin.init === 'function') {
        logger.info('Initializing Discord plugin...');
        await this.discordPlugin.init();
        logger.info('Discord plugin initialized');
      }
      
      // Use ElizaCore.init() as the primary initialization method
      // This is the correct approach based on ElizaOS documentation
      if (ElizaCore.init && typeof ElizaCore.init === 'function') {
        logger.info('Using ElizaCore.init() method');
        await ElizaCore.init();
        logger.info('ElizaCore.init() called successfully');
      } else {
        logger.warn('ElizaCore.init() not found, trying alternative initialization methods');
        
        // Try static start method on service class if available
        if (this.serviceClass && typeof this.serviceClass.start === 'function') {
          logger.info('Using serviceClass.start() method');
          const runtime = {}; // Create a minimal runtime object if needed
          const serviceInstance = await this.serviceClass.start(runtime);
          if (serviceInstance) {
            logger.info('Service instance created successfully via start()');
            // Store the instance if it's not this
            if (serviceInstance !== this) {
              this.serviceInstance = serviceInstance;
            }
          } else {
            logger.warn('No serviceClass.start() method available');
          }
        } else {
          logger.warn('No serviceClass.start() method available');
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
