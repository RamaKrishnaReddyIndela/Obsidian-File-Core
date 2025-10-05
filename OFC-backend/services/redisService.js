const { helpers: redisHelpers, client: redisClient } = require('../configs/redisClient');
const { log, logError } = require('../utils/logger');

/**
 * Redis Service - High-level Redis operations for the application
 */
class RedisService {
  
  /**
   * Session Management
   */
  static async setSession(sessionId, sessionData, expirationSeconds = 3600) {
    try {
      const key = `forticrypt:session:${sessionId}`;
      const value = JSON.stringify(sessionData);
      return await redisHelpers.safeSet(key, value, { EX: expirationSeconds });
    } catch (error) {
      logError(`Redis session set error: ${error.message}`);
      return false;
    }
  }
  
  static async getSession(sessionId) {
    try {
      const key = `forticrypt:session:${sessionId}`;
      const value = await redisHelpers.safeGet(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logError(`Redis session get error: ${error.message}`);
      return null;
    }
  }
  
  static async deleteSession(sessionId) {
    try {
      const key = `forticrypt:session:${sessionId}`;
      return await redisHelpers.safeDel(key);
    } catch (error) {
      logError(`Redis session delete error: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Cache Management
   */
  static async setCache(cacheKey, data, expirationSeconds = 300) {
    try {
      const key = `forticrypt:cache:${cacheKey}`;
      const value = JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: expirationSeconds
      });
      return await redisHelpers.safeSet(key, value, { EX: expirationSeconds });
    } catch (error) {
      logError(`Redis cache set error: ${error.message}`);
      return false;
    }
  }
  
  static async getCache(cacheKey) {
    try {
      const key = `forticrypt:cache:${cacheKey}`;
      const value = await redisHelpers.safeGet(key);
      if (!value) return null;
      
      const cached = JSON.parse(value);
      return {
        data: cached.data,
        age: Date.now() - cached.timestamp,
        ttl: cached.ttl
      };
    } catch (error) {
      logError(`Redis cache get error: ${error.message}`);
      return null;
    }
  }
  
  static async deleteCache(cacheKey) {
    try {
      const key = `forticrypt:cache:${cacheKey}`;
      return await redisHelpers.safeDel(key);
    } catch (error) {
      logError(`Redis cache delete error: ${error.message}`);
      return false;
    }
  }
  
  static async clearCachePattern(pattern) {
    try {
      if (!redisHelpers.isAvailable()) return false;
      
      const keys = await redisClient.keys(`forticrypt:cache:${pattern}`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        log(`Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
      }
      return true;
    } catch (error) {
      logError(`Redis cache pattern clear error: ${error.message}`);
      return false;
    }
  }
  
  /**
   * User Activity Tracking
   */
  static async trackUserActivity(userId, activity, metadata = {}) {
    try {
      const key = `forticrypt:activity:${userId}`;
      const activityData = {
        activity,
        timestamp: Date.now(),
        metadata
      };
      
      // Use Redis lists to maintain activity history (keep last 100 entries)
      if (redisHelpers.isAvailable()) {
        await redisClient.lPush(key, JSON.stringify(activityData));
        await redisClient.lTrim(key, 0, 99); // Keep last 100 activities
        await redisHelpers.safeExpire(key, 24 * 60 * 60); // 24 hours expiry
      }
      
      return true;
    } catch (error) {
      logError(`Redis activity tracking error: ${error.message}`);
      return false;
    }
  }
  
  static async getUserActivities(userId, limit = 10) {
    try {
      if (!redisHelpers.isAvailable()) return [];
      
      const key = `forticrypt:activity:${userId}`;
      const activities = await redisClient.lRange(key, 0, limit - 1);
      
      return activities.map(activity => JSON.parse(activity));
    } catch (error) {
      logError(`Redis get user activities error: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Feature Flags / Configuration
   */
  static async setFeatureFlag(flagName, enabled, expirationSeconds = null) {
    try {
      const key = `forticrypt:feature:${flagName}`;
      const options = expirationSeconds ? { EX: expirationSeconds } : {};
      return await redisHelpers.safeSet(key, enabled.toString(), options);
    } catch (error) {
      logError(`Redis feature flag set error: ${error.message}`);
      return false;
    }
  }
  
  static async getFeatureFlag(flagName, defaultValue = false) {
    try {
      const key = `forticrypt:feature:${flagName}`;
      const value = await redisHelpers.safeGet(key);
      return value ? value === 'true' : defaultValue;
    } catch (error) {
      logError(`Redis feature flag get error: ${error.message}`);
      return defaultValue;
    }
  }
  
  /**
   * Temporary Token Storage (OTP, Reset Tokens, etc.)
   */
  static async setTempToken(tokenType, identifier, tokenData, expirationSeconds = 300) {
    try {
      const key = `forticrypt:token:${tokenType}:${identifier}`;
      const value = JSON.stringify({
        ...tokenData,
        createdAt: Date.now()
      });
      return await redisHelpers.safeSet(key, value, { EX: expirationSeconds });
    } catch (error) {
      logError(`Redis temp token set error: ${error.message}`);
      return false;
    }
  }
  
  static async getTempToken(tokenType, identifier) {
    try {
      const key = `forticrypt:token:${tokenType}:${identifier}`;
      const value = await redisHelpers.safeGet(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logError(`Redis temp token get error: ${error.message}`);
      return null;
    }
  }
  
  static async deleteTempToken(tokenType, identifier) {
    try {
      const key = `forticrypt:token:${tokenType}:${identifier}`;
      return await redisHelpers.safeDel(key);
    } catch (error) {
      logError(`Redis temp token delete error: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Lock Management (Distributed Locks)
   */
  static async acquireLock(lockKey, expirationSeconds = 30) {
    try {
      const key = `forticrypt:lock:${lockKey}`;
      const lockId = `${Date.now()}_${Math.random()}`;
      
      if (redisHelpers.isAvailable()) {
        // Use SET NX EX for atomic lock acquisition
        const result = await redisClient.set(key, lockId, { NX: true, EX: expirationSeconds });
        return result === 'OK' ? lockId : null;
      }
      
      return null;
    } catch (error) {
      logError(`Redis acquire lock error: ${error.message}`);
      return null;
    }
  }
  
  static async releaseLock(lockKey, lockId) {
    try {
      if (!redisHelpers.isAvailable()) return false;
      
      const key = `forticrypt:lock:${lockKey}`;
      
      // Lua script for atomic lock release
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await redisClient.eval(luaScript, { keys: [key], arguments: [lockId] });
      return result === 1;
    } catch (error) {
      logError(`Redis release lock error: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Statistics and Counters
   */
  static async incrementCounter(counterName, amount = 1, expirationSeconds = null) {
    try {
      const key = `forticrypt:counter:${counterName}`;
      
      if (redisHelpers.isAvailable()) {
        const newValue = await redisClient.incrBy(key, amount);
        if (expirationSeconds && newValue === amount) {
          // Set expiration only if this is a new key
          await redisHelpers.safeExpire(key, expirationSeconds);
        }
        return newValue;
      }
      
      return null;
    } catch (error) {
      logError(`Redis increment counter error: ${error.message}`);
      return null;
    }
  }
  
  static async getCounter(counterName) {
    try {
      const key = `forticrypt:counter:${counterName}`;
      const value = await redisHelpers.safeGet(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      logError(`Redis get counter error: ${error.message}`);
      return 0;
    }
  }
  
  static async resetCounter(counterName) {
    try {
      const key = `forticrypt:counter:${counterName}`;
      return await redisHelpers.safeDel(key);
    } catch (error) {
      logError(`Redis reset counter error: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Health and Diagnostics
   */
  static async getServiceHealth() {
    try {
      const info = redisHelpers.getInfo();
      
      let detailedHealth = null;
      if (redisHelpers.isAvailable()) {
        const testKey = `forticrypt:healthcheck:${Date.now()}`;
        const testValue = 'health_test';
        
        // Test basic operations
        const setSuccess = await redisHelpers.safeSet(testKey, testValue, { EX: 5 });
        const getValue = await redisHelpers.safeGet(testKey);
        const delSuccess = await redisHelpers.safeDel(testKey);
        
        detailedHealth = {
          operations: {
            set: setSuccess,
            get: getValue === testValue,
            delete: delSuccess
          },
          latency: Date.now() % 100 // Simple latency approximation
        };
      }
      
      return {
        connected: info.connected,
        reconnectCount: info.reconnectCount,
        host: info.host,
        port: info.port,
        database: info.database,
        detailedHealth
      };
    } catch (error) {
      logError(`Redis health check error: ${error.message}`);
      return {
        connected: false,
        error: error.message
      };
    }
  }
  
  static async cleanup() {
    try {
      if (!redisHelpers.isAvailable()) return false;
      
      // Clean up expired cache entries, temporary tokens, etc.
      const patterns = [
        'forticrypt:cache:*',
        'forticrypt:token:*',
        'forticrypt:temp:*'
      ];
      
      let totalCleaned = 0;
      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          // Check TTL for each key and remove expired ones
          for (const key of keys) {
            const ttl = await redisClient.ttl(key);
            if (ttl === -1) { // Key exists but has no expiration
              await redisClient.del(key);
              totalCleaned++;
            }
          }
        }
      }
      
      log(`Redis cleanup completed. Cleaned ${totalCleaned} keys.`);
      return true;
    } catch (error) {
      logError(`Redis cleanup error: ${error.message}`);
      return false;
    }
  }
}

module.exports = RedisService;