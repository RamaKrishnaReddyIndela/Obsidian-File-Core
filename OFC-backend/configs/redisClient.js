const redis = require('redis');
const { log, logError } = require('../utils/logger');

// Redis Configuration
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    reconnectStrategy: (retries) => {
      // Exponential backoff with jitter
      const delay = Math.min(retries * 50, 500) + Math.random() * 100;
      console.log(`🔄 Redis reconnect attempt ${retries} in ${delay}ms`);
      return delay;
    },
    connectTimeout: 10000, // 10 seconds
    lazyConnect: true
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3
};

// Create Redis client
const client = redis.createClient(redisConfig);

let isConnected = false;
let reconnectCount = 0;

// Connection event handlers
client.on('connect', () => {
  if (!isConnected) {
    console.log('🔗 Redis connecting...');
    log('Redis connection initiated');
  }
});

client.on('ready', () => {
  if (!isConnected) {
    console.log('✅ Redis connected and ready');
    log('Redis connected successfully');
    isConnected = true;
    reconnectCount = 0;
  }
});

client.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
  logError(`Redis error: ${err.message}`);
  isConnected = false;
});

client.on('end', () => {
  console.log('🔌 Redis connection closed');
  log('Redis connection closed');
  isConnected = false;
});

client.on('reconnecting', () => {
  reconnectCount++;
  console.log(`🔄 Redis reconnecting... (attempt ${reconnectCount})`);
  log(`Redis reconnecting attempt ${reconnectCount}`);
});

// Graceful shutdown handler
let isShuttingDown = false;
process.on('SIGINT', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('📴 Shutting down Redis connection...');
  try {
    if (client.isOpen) {
      await client.quit();
      console.log('✅ Redis connection closed gracefully');
    }
  } catch (err) {
    console.error('❌ Error closing Redis connection:', err);
  }
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err.message);
    logError(`Failed to connect to Redis: ${err.message}`);
    
    // Don't crash the server if Redis is unavailable
    setTimeout(connectRedis, 5000); // Retry after 5 seconds
  }
};

// Helper functions for Redis operations
const redisHelpers = {
  // Check if Redis is available
  isAvailable: () => isConnected && client.isOpen,
  
  // Safe get operation
  safeGet: async (key) => {
    try {
      if (!redisHelpers.isAvailable()) return null;
      return await client.get(key);
    } catch (err) {
      logError(`Redis GET error for key ${key}: ${err.message}`);
      return null;
    }
  },
  
  // Safe set operation
  safeSet: async (key, value, options = {}) => {
    try {
      if (!redisHelpers.isAvailable()) return false;
      await client.set(key, value, options);
      return true;
    } catch (err) {
      logError(`Redis SET error for key ${key}: ${err.message}`);
      return false;
    }
  },
  
  // Safe delete operation
  safeDel: async (key) => {
    try {
      if (!redisHelpers.isAvailable()) return false;
      await client.del(key);
      return true;
    } catch (err) {
      logError(`Redis DEL error for key ${key}: ${err.message}`);
      return false;
    }
  },
  
  // Safe increment operation
  safeIncr: async (key) => {
    try {
      if (!redisHelpers.isAvailable()) return null;
      return await client.incr(key);
    } catch (err) {
      logError(`Redis INCR error for key ${key}: ${err.message}`);
      return null;
    }
  },
  
  // Safe expire operation
  safeExpire: async (key, seconds) => {
    try {
      if (!redisHelpers.isAvailable()) return false;
      await client.expire(key, seconds);
      return true;
    } catch (err) {
      logError(`Redis EXPIRE error for key ${key}: ${err.message}`);
      return false;
    }
  },
  
  // Get connection info
  getInfo: () => ({
    connected: isConnected,
    reconnectCount,
    host: redisConfig.socket.host,
    port: redisConfig.socket.port,
    database: redisConfig.database
  })
};

// Initialize connection
connectRedis();

module.exports = {
  client,
  helpers: redisHelpers,
  isConnected: () => isConnected
};
