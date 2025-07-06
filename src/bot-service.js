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
    this.serviceClass = null;
    this.serviceDefinition = null;
    this.isRunning = false;
    this.runtime = null;
    this.keepAliveInterval = null;
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
      // IMPORTANT: Define service as a CLASS with static start and stop methods
      // This is the format ElizaOS expects
      function ZAOBotServiceClass() {
        this.name = 'ZAO AI Bot';
        this.description = this.config ? this.config.description : 'An AI guide bot powered by ElizaOS';
        this.version = '1.0.0';
        this.serviceType = 'zao_bot';
      }
      
      // CRITICAL: Define static start and stop methods
      ZAOBotServiceClass.start = async function(runtime) {
        logger.info('Static service start method called with runtime:', runtime ? 'provided' : 'undefined');
        // Initialize Discord plugin if available
        if (this.discordPlugin && typeof this.discordPlugin.init === 'function') {
          try {
            await this.discordPlugin.init();
            logger.info('Discord plugin initialized from service start method');
          } catch (err) {
            logger.error('Failed to initialize Discord plugin from start method:', err);
          }
        }
        return this;
      };
      
      ZAOBotServiceClass.stop = async function() {
        logger.info('Static service stop method called');
        // Cleanup logic
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
        }
        return true;
      };
      
      // Store the service definition
      const serviceDefinition = ZAOBotServiceClass;
      
      // Store the service definition for later use
      this.serviceDefinition = serviceDefinition;
      
      // Use the service class directly instead of using defineService
      // This ensures the start and stop methods are properly defined
      this.serviceClass = ZAOBotServiceClass;
      logger.info('Service class created directly:', this.serviceClass ? 'success' : 'failed');
      logger.info('Service methods:', Object.getOwnPropertyNames(this.serviceClass));
      
      // Double check that start and stop are defined
      if (typeof this.serviceClass.start !== 'function') {
        logger.error('Start method is not defined on service class!');
      } else {
        logger.info('Start method is properly defined on service class');
      }
      
      if (typeof this.serviceClass.stop !== 'function') {
        logger.error('Stop method is not defined on service class!');
      } else {
        logger.info('Stop method is properly defined on service class');
      }
      
      // CRITICAL: Register the service with ElizaCore immediately after creation
      // Try all possible registration methods to ensure it works
      if (this.serviceClass) {
        // Method 1: Use registerService if available
        if (typeof ElizaCore.registerService === 'function') {
          logger.info('Registering service with ElizaCore.registerService');
          ElizaCore.registerService(this.serviceClass);
        }
        
        // Method 2: Use addService if available (try this anyway as a backup)
        if (typeof ElizaCore.addService === 'function') {
          logger.info('Registering service with ElizaCore.addService');
          ElizaCore.addService(this.serviceClass);
        }
        
        // Method 3: Add directly to services array (try this anyway as a backup)
        if (Array.isArray(ElizaCore.services)) {
          logger.info('Adding service directly to ElizaCore.services array');
          ElizaCore.services.push(this.serviceClass);
        } else {
          // Create services array if it doesn't exist
          ElizaCore.services = [this.serviceClass];
          logger.info('Created ElizaCore.services array with service');
        }
        
        // Method 4: Add service as a direct property on ElizaCore
        ElizaCore.ZAOBotService = this.serviceClass;
        logger.info('Added service as direct property on ElizaCore');
      } else {
        logger.error('Service class is not defined, cannot register!');
      }
      
      // Store the service class for later use
      this.service = this.serviceClass || ElizaCore;
      
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
      
      // Configure Discord plugin
      const discordConfig = {
        token: process.env.DISCORD_API_TOKEN,
        applicationId: process.env.DISCORD_APPLICATION_ID
      };
      
      logger.info('Discord plugin type:', typeof DiscordPlugin);
      
      // Initialize Discord plugin based on its type
      if (typeof DiscordPlugin === 'function') {
        // DiscordPlugin is a constructor
        logger.info('Creating Discord plugin instance with constructor');
        this.discordPlugin = new DiscordPlugin(discordConfig);
      } else if (typeof DiscordPlugin === 'object') {
        // DiscordPlugin is already an instance
        logger.info('Using Discord plugin as object instance');
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
      
      // Check if the Discord plugin has services
      if (this.discordPlugin.services) {
        logger.info('Discord plugin services:', Array.isArray(this.discordPlugin.services) ? 
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
          const characterConfig = {
            name: this.config.name,
            description: this.config.description
          };
          
          this.character = await ElizaCore.decryptedCharacter(characterConfig);
          logger.info('Character created with decryptedCharacter');
        } catch (err) {
          logger.error('Error creating character with decryptedCharacter:', err);
        }
      } else if (typeof ElizaCore.encryptedCharacter === 'function') {
        logger.info('Creating character with encryptedCharacter');
        try {
          const characterConfig = {
            name: this.config.name,
            description: this.config.description
          };
          
          this.character = await ElizaCore.encryptedCharacter(characterConfig);
          logger.info('Character created with encryptedCharacter');
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
            description: this.config.description
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
              description: this.config.description
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
      
      // IMPORTANT: Make sure service is registered before initialization
      if (this.serviceClass) {
        // Double-check service registration
        if (typeof ElizaCore.registerService === 'function') {
          logger.info('Re-registering service with ElizaCore to ensure it\'s properly registered');
          ElizaCore.registerService(this.serviceClass);
        } else if (typeof ElizaCore.addService === 'function') {
          logger.info('Re-registering service with ElizaCore.addService');
          ElizaCore.addService(this.serviceClass);
        }
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
          }
        } else {
          logger.warn('serviceClass.start() is not a function');
          
          // Last resort: Try to find any start method on ElizaCore
          const elizaCoreMethods = Object.getOwnPropertyNames(ElizaCore);
          const startMethods = elizaCoreMethods.filter(method => 
            method.toLowerCase().includes('start') && typeof ElizaCore[method] === 'function'
          );
          
          if (startMethods.length > 0) {
            logger.info(`Found potential start methods on ElizaCore: ${startMethods.join(', ')}`);
            for (const startMethod of startMethods) {
              try {
                logger.info(`Trying ElizaCore.${startMethod}()...`);
                await ElizaCore[startMethod]();
                logger.info(`ElizaCore.${startMethod}() called successfully`);
                break;
              } catch (err) {
                logger.error(`Error calling ElizaCore.${startMethod}():`, err);
              }
            }
          } else {
            logger.warn('No start methods found on ElizaCore');
          }
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