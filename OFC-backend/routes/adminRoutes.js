const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { helpers: redisHelpers, client: redisClient } = require('../configs/redisClient');
const { analytics: rateLimitAnalytics } = require('../middlewares/rateLimiter');
const { log, logError } = require('../utils/logger');
const activityGenerator = require('../services/activityGeneratorService');
const seedDatabase = require('../scripts/seedDatabase');

// Middleware to ensure admin access
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Get system status including Redis and rate limiting
router.get('/system-status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const redisInfo = redisHelpers.getInfo();
    const rateLimitStats = await rateLimitAnalytics.getStats();
    
    // Get Redis memory usage if available
    let redisStats = null;
    if (redisHelpers.isAvailable()) {
      try {
        redisStats = await redisClient.memory('usage');
      } catch (err) {
        logError(`Error fetching Redis stats: ${err.message}`);
      }
    }
    
    // System uptime
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    const systemStatus = {
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
      },
      redis: {
        connected: redisInfo.connected,
        connectionInfo: redisInfo,
        memoryUsage: redisStats,
        fallbackMode: !redisHelpers.isAvailable()
      },
      rateLimiting: {
        backend: redisHelpers.isAvailable() ? 'Redis' : 'Memory-Fallback',
        statistics: rateLimitStats
      }
    };
    
    res.json({
      success: true,
      status: systemStatus
    });
    
  } catch (error) {
    logError(`System status error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system status',
      error: error.message
    });
  }
});

// Get Redis configuration and connection info
router.get('/redis-info', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const info = redisHelpers.getInfo();
    
    let detailedInfo = null;
    if (redisHelpers.isAvailable()) {
      try {
        // Get Redis server info
        const serverInfo = await redisClient.info('server');
        const memoryInfo = await redisClient.info('memory');
        const clientsInfo = await redisClient.info('clients');
        
        detailedInfo = {
          server: serverInfo,
          memory: memoryInfo,
          clients: clientsInfo
        };
      } catch (err) {
        logError(`Detailed Redis info error: ${err.message}`);
      }
    }
    
    res.json({
      success: true,
      redis: {
        basicInfo: info,
        detailedInfo: detailedInfo,
        isHealthy: redisHelpers.isAvailable()
      }
    });
    
  } catch (error) {
    logError(`Redis info error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Redis information',
      error: error.message
    });
  }
});

// Get rate limiting statistics
router.get('/rate-limit-stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const stats = await rateLimitAnalytics.getStats();
    
    res.json({
      success: true,
      rateLimiting: {
        backend: redisHelpers.isAvailable() ? 'Redis' : 'Memory-Fallback',
        statistics: stats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logError(`Rate limit stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rate limiting statistics',
      error: error.message
    });
  }
});

// Clear rate limits for a specific user (admin only)
router.delete('/rate-limits/user/:userId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const success = await rateLimitAnalytics.clearLimitsForUser(userId);
    
    if (success) {
      log(`Admin ${req.user.email} cleared rate limits for user: ${userId}`);
      res.json({
        success: true,
        message: `Rate limits cleared for user: ${userId}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to clear rate limits'
      });
    }
    
  } catch (error) {
    logError(`Clear user rate limits error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to clear rate limits',
      error: error.message
    });
  }
});

// Clear rate limits for a specific IP (admin only)
router.delete('/rate-limits/ip/:ip', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { ip } = req.params;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }
    
    const success = await rateLimitAnalytics.clearLimitsForIP(ip);
    
    if (success) {
      log(`Admin ${req.user.email} cleared rate limits for IP: ${ip}`);
      res.json({
        success: true,
        message: `Rate limits cleared for IP: ${ip}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to clear rate limits'
      });
    }
    
  } catch (error) {
    logError(`Clear IP rate limits error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to clear rate limits',
      error: error.message
    });
  }
});

// Test Redis connection
router.post('/redis/test', authMiddleware, requireAdmin, async (req, res) => {
  try {
    if (!redisHelpers.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Redis is not available'
      });
    }
    
    // Test basic Redis operations
    const testKey = `forticrypt:test:${Date.now()}`;
    const testValue = 'Redis connection test';
    
    // Test SET
    const setResult = await redisHelpers.safeSet(testKey, testValue, { EX: 10 });
    if (!setResult) {
      throw new Error('Failed to set test value');
    }
    
    // Test GET
    const getValue = await redisHelpers.safeGet(testKey);
    if (getValue !== testValue) {
      throw new Error('Failed to get test value');
    }
    
    // Test DELETE
    const delResult = await redisHelpers.safeDel(testKey);
    if (!delResult) {
      throw new Error('Failed to delete test value');
    }
    
    res.json({
      success: true,
      message: 'Redis connection test passed',
      operations: {
        set: true,
        get: true,
        delete: true
      }
    });
    
  } catch (error) {
    logError(`Redis test error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Redis connection test failed',
      error: error.message
    });
  }
});

// Seed database with sample data (admin only)
router.post('/seed-database', authMiddleware, requireAdmin, async (req, res) => {
  try {
    log(`Admin ${req.user.email} initiated database seeding`);
    
    // Run seeder in background to avoid timeout
    seedDatabase().catch(err => {
      logError(`Database seeding failed: ${err.message}`);
    });
    
    res.json({
      success: true,
      message: 'Database seeding started in background. Check logs for progress.'
    });
    
  } catch (error) {
    logError(`Database seeding error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to start database seeding',
      error: error.message
    });
  }
});

// Activity generator control endpoints
router.post('/activity-generator/start', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { intervalMinutes = 2 } = req.body;
    
    await activityGenerator.initialize();
    activityGenerator.start(intervalMinutes);
    
    log(`Admin ${req.user.email} started activity generator with ${intervalMinutes} minute intervals`);
    
    res.json({
      success: true,
      message: `Activity generator started with ${intervalMinutes} minute intervals`,
      status: activityGenerator.getStatus()
    });
    
  } catch (error) {
    logError(`Activity generator start error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to start activity generator',
      error: error.message
    });
  }
});

router.post('/activity-generator/stop', authMiddleware, requireAdmin, async (req, res) => {
  try {
    activityGenerator.stop();
    
    log(`Admin ${req.user.email} stopped activity generator`);
    
    res.json({
      success: true,
      message: 'Activity generator stopped',
      status: activityGenerator.getStatus()
    });
    
  } catch (error) {
    logError(`Activity generator stop error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to stop activity generator',
      error: error.message
    });
  }
});

router.get('/activity-generator/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const status = activityGenerator.getStatus();
    
    res.json({
      success: true,
      status
    });
    
  } catch (error) {
    logError(`Activity generator status error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity generator status',
      error: error.message
    });
  }
});

router.post('/activity-generator/burst', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { count = 10 } = req.body;
    
    await activityGenerator.initialize();
    await activityGenerator.generateBurstActivity(count);
    
    log(`Admin ${req.user.email} generated ${count} burst activities`);
    
    res.json({
      success: true,
      message: `Generated ${count} activities successfully`
    });
    
  } catch (error) {
    logError(`Burst activity generation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate burst activities',
      error: error.message
    });
  }
});

// Database statistics endpoint
router.get('/database-stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const User = require('../models/User');
    const File = require('../models/File');
    const Activity = require('../models/Activity');
    const BlockchainRecord = require('../models/BlockchainRecord');
    const History = require('../models/History');
    const Otp = require('../models/Otp');
    const Secret = require('../models/Secret');
    
    const [userCount, fileCount, activityCount, blockchainCount, historyCount, otpCount, secretCount] = await Promise.all([
      User.countDocuments({}),
      File.countDocuments({}),
      Activity.countDocuments({}),
      BlockchainRecord.countDocuments({}),
      History.countDocuments({}),
      Otp.countDocuments({}),
      Secret.countDocuments({})
    ]);
    
    // Get recent activity
    const recentActivities = await Activity.find({}).sort({ timestamp: -1 }).limit(5);
    
    const stats = {
      collections: {
        users: userCount,
        files: fileCount,
        activities: activityCount,
        blockchainrecords: blockchainCount,
        histories: historyCount,
        otps: otpCount,
        secrets: secretCount
      },
      total: userCount + fileCount + activityCount + blockchainCount + historyCount + otpCount + secretCount,
      recentActivities: recentActivities.map(activity => ({
        type: activity.type,
        fileName: activity.fileName,
        status: activity.status,
        timestamp: activity.timestamp
      })),
      database: {
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      }
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    logError(`Database stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database statistics',
      error: error.message
    });
  }
});

// Health check endpoint (public)
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: {
        connected: redisHelpers.isAvailable(),
        status: redisHelpers.isAvailable() ? 'connected' : 'disconnected'
      },
      rateLimiting: {
        backend: redisHelpers.isAvailable() ? 'redis' : 'memory'
      },
      activityGenerator: activityGenerator.getStatus()
    };
    
    // Set appropriate status code
    const statusCode = redisHelpers.isAvailable() ? 200 : 206; // 206 = Partial Content
    
    res.status(statusCode).json({
      success: true,
      health
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;