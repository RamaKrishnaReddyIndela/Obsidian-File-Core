const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');
const { client: redisClient, helpers: redisHelpers } = require('../configs/redisClient');
const { log, logError } = require('../utils/logger');

// Check if RedisStore is properly imported
if (!RedisStore || typeof RedisStore !== 'function') {
  console.warn('⚠️ rate-limit-redis not available, using in-memory rate limiting only');
}

// Custom Redis store with fallback to memory
class SafeRedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.windowMs = options.windowMs || 15 * 60 * 1000;
    this.fallbackStore = new Map();
    this.useFallback = !redisHelpers.isAvailable();
    this.redisStore = null;
    
    // Try to create Redis store if available
    if (RedisStore && typeof RedisStore === 'function' && redisHelpers.isAvailable()) {
      try {
        this.redisStore = new RedisStore({
          storeClient: redisClient,
          prefix: this.prefix,
          sendCommand: (...args) => redisClient.sendCommand(args)
        });
      } catch (err) {
        logError(`Failed to create Redis store: ${err.message}`);
        this.useFallback = true;
      }
    }
  }

  async increment(key) {
    try {
      if (!this.useFallback && this.redisStore && redisHelpers.isAvailable()) {
        return await this.redisStore.increment(key);
      }
      
      // Fallback to in-memory store
      const now = Date.now();
      const current = this.fallbackStore.get(key) || { 
        totalHits: 0, 
        resetTime: now + this.windowMs 
      };
      
      // Reset if window has expired
      if (now > current.resetTime) {
        current.totalHits = 0;
        current.resetTime = now + this.windowMs;
      }
      
      current.totalHits++;
      this.fallbackStore.set(key, current);
      
      return {
        totalHits: current.totalHits,
        resetTime: new Date(current.resetTime)
      };
    } catch (err) {
      logError(`Rate limiter error: ${err.message}`);
      this.useFallback = true;
      
      // Emergency fallback
      const current = this.fallbackStore.get(key) || { totalHits: 0, resetTime: Date.now() + this.windowMs };
      current.totalHits++;
      this.fallbackStore.set(key, current);
      return { totalHits: current.totalHits, resetTime: new Date(current.resetTime) };
    }
  }

  async decrement(key) {
    try {
      if (!this.useFallback && this.redisStore && redisHelpers.isAvailable()) {
        return await this.redisStore.decrement(key);
      }
      
      // Fallback to in-memory store
      const current = this.fallbackStore.get(key);
      if (current && current.totalHits > 0) {
        current.totalHits--;
        this.fallbackStore.set(key, current);
      }
    } catch (err) {
      logError(`Rate limiter decrement error: ${err.message}`);
    }
  }

  async resetKey(key) {
    try {
      if (!this.useFallback && this.redisStore && redisHelpers.isAvailable()) {
        return await this.redisStore.resetKey(key);
      }
      
      // Fallback to in-memory store
      this.fallbackStore.delete(key);
    } catch (err) {
      logError(`Rate limiter reset error: ${err.message}`);
      this.fallbackStore.delete(key);
    }
  }
}

// Create Redis store with fallback
const createRedisStore = (prefix = 'rl', windowMs = 15 * 60 * 1000) => {
  return new SafeRedisStore({
    prefix: `forticrypt:${prefix}:`,
    windowMs: windowMs
  });
};

// Different rate limit configurations
const rateLimitConfigs = {
  // General API rate limiting
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: {
      success: false,
      message: 'Too many requests. Please try again in 15 minutes.',
      retryAfter: 15 * 60,
      type: 'RATE_LIMIT_GENERAL'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('general', 15 * 60 * 1000)
  },

  // Strict rate limiting for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: 15 * 60,
      type: 'RATE_LIMIT_AUTH'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    store: createRedisStore('auth', 15 * 60 * 1000)
  },

  // File upload rate limiting
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: {
      success: false,
      message: 'Upload limit exceeded. Please try again in 1 hour.',
      retryAfter: 60 * 60,
      type: 'RATE_LIMIT_UPLOAD'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('upload', 60 * 60 * 1000)
  },

  // API key generation rate limiting
  apiKey: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // 5 API key operations per day
    message: {
      success: false,
      message: 'API key operation limit exceeded. Please try again tomorrow.',
      retryAfter: 24 * 60 * 60,
      type: 'RATE_LIMIT_API_KEY'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('apikey', 24 * 60 * 60 * 1000)
  },

  // Password reset rate limiting
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: {
      success: false,
      message: 'Too many password reset attempts. Please try again in 1 hour.',
      retryAfter: 60 * 60,
      type: 'RATE_LIMIT_PASSWORD_RESET'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('pwreset', 60 * 60 * 1000)
  },

  // AI/ML processing rate limiting
  aiProcessing: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 AI processing requests per hour
    message: {
      success: false,
      message: 'AI processing limit exceeded. Please try again in 1 hour.',
      retryAfter: 60 * 60,
      type: 'RATE_LIMIT_AI_PROCESSING'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('ai', 60 * 60 * 1000)
  },

  // Blockchain operations rate limiting
  blockchain: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 blockchain operations per 5 minutes
    message: {
      success: false,
      message: 'Blockchain operation limit exceeded. Please try again in 5 minutes.',
      retryAfter: 5 * 60,
      type: 'RATE_LIMIT_BLOCKCHAIN'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('blockchain', 5 * 60 * 1000)
  },

  // OTP/Email rate limiting
  otp: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 OTP requests per 5 minutes
    message: {
      success: false,
      message: 'Too many OTP requests. Please try again in 5 minutes.',
      retryAfter: 5 * 60,
      type: 'RATE_LIMIT_OTP'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('otp', 5 * 60 * 1000)
  }
};

// Create rate limiters
const rateLimiters = {
  general: rateLimit(rateLimitConfigs.general),
  auth: rateLimit(rateLimitConfigs.auth),
  upload: rateLimit(rateLimitConfigs.upload),
  apiKey: rateLimit(rateLimitConfigs.apiKey),
  passwordReset: rateLimit(rateLimitConfigs.passwordReset),
  aiProcessing: rateLimit(rateLimitConfigs.aiProcessing),
  blockchain: rateLimit(rateLimitConfigs.blockchain),
  otp: rateLimit(rateLimitConfigs.otp)
};

// Custom rate limiter with user-based limiting
const createUserRateLimit = (config) => {
  return rateLimit({
    ...config,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    }
  });
};

// Enhanced rate limiter with dynamic limits based on user role
const createDynamicRateLimit = (baseConfig) => {
  return rateLimit({
    ...baseConfig,
    max: (req) => {
      if (req.user?.role === 'admin') {
        return baseConfig.max * 10; // 10x limit for admins
      }
      if (req.user?.role === 'premium') {
        return baseConfig.max * 3; // 3x limit for premium users
      }
      return baseConfig.max; // Standard limit for regular users
    },
    keyGenerator: (req) => {
      const userId = req.user?.id || 'anonymous';
      const role = req.user?.role || 'guest';
      return `${userId}:${role}:${req.ip}`;
    }
  });
};

// Rate limit analytics
const rateLimitAnalytics = {
  async getStats() {
    try {
      const stats = {};
      const prefixes = ['general', 'auth', 'upload', 'apikey', 'pwreset', 'ai', 'blockchain', 'otp'];
      
      for (const prefix of prefixes) {
        const keys = await redisClient.keys(`forticrypt:${prefix}:*`);
        stats[prefix] = {
          activeKeys: keys.length,
          keysSample: keys.slice(0, 5) // First 5 keys as sample
        };
      }
      
      return stats;
    } catch (err) {
      logError(`Rate limit analytics error: ${err.message}`);
      return { error: 'Unable to fetch rate limit statistics' };
    }
  },

  async clearLimitsForUser(userId) {
    try {
      const patterns = [
        `forticrypt:*:${userId}`,
        `forticrypt:*:${userId}:*`
      ];
      
      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
      
      log(`Cleared rate limits for user: ${userId}`);
      return true;
    } catch (err) {
      logError(`Error clearing rate limits for user ${userId}: ${err.message}`);
      return false;
    }
  },

  async clearLimitsForIP(ip) {
    try {
      const keys = await redisClient.keys(`forticrypt:*:${ip}`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      
      log(`Cleared rate limits for IP: ${ip}`);
      return true;
    } catch (err) {
      logError(`Error clearing rate limits for IP ${ip}: ${err.message}`);
      return false;
    }
  }
};

// Middleware to add rate limit info to response headers
const addRateLimitHeaders = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Add custom rate limit info
    if (redisHelpers.isAvailable()) {
      res.set('X-RateLimit-Backend', 'Redis');
    } else {
      res.set('X-RateLimit-Backend', 'Memory-Fallback');
    }
    
    res.set('X-RateLimit-Policy', 'FortiCrypt-v1.0');
    
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  // Individual rate limiters
  general: rateLimiters.general,
  auth: rateLimiters.auth,
  upload: rateLimiters.upload,
  apiKey: rateLimiters.apiKey,
  passwordReset: rateLimiters.passwordReset,
  aiProcessing: rateLimiters.aiProcessing,
  blockchain: rateLimiters.blockchain,
  otp: rateLimiters.otp,
  
  // Custom rate limiter creators
  createUserRateLimit,
  createDynamicRateLimit,
  
  // Analytics and management
  analytics: rateLimitAnalytics,
  addRateLimitHeaders,
  
  // Default export for backward compatibility
  default: rateLimiters.general
};
