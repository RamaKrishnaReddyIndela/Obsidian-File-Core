# Redis and Rate Limiting Documentation

## Overview

The FortiCrypt backend now features a comprehensive Redis integration with advanced rate limiting capabilities. The system provides both Redis-backed storage and automatic fallback to in-memory operations when Redis is unavailable.

## Redis Configuration

### Enhanced Redis Client (`configs/redisClient.js`)

The Redis client now includes:

- **Connection Pooling**: Optimized connection management
- **Automatic Reconnection**: Exponential backoff with jitter
- **Graceful Degradation**: Fallback to local operations when Redis is unavailable
- **Health Monitoring**: Connection status tracking and diagnostics
- **Error Handling**: Comprehensive error logging and recovery

#### Configuration Options (`.env`)

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
REDIS_RETRY_DELAY=100
REDIS_MAX_RETRIES=3
```

#### Helper Functions

The Redis client provides safe operation helpers:

- `safeGet(key)` - Safe GET operation with error handling
- `safeSet(key, value, options)` - Safe SET operation with expiration
- `safeDel(key)` - Safe DELETE operation
- `safeIncr(key)` - Safe INCREMENT operation
- `safeExpire(key, seconds)` - Safe EXPIRE operation
- `getInfo()` - Connection status information

## Rate Limiting System

### Multi-Tier Rate Limiting (`middlewares/rateLimiter.js`)

The application now implements sophisticated rate limiting with different limits for different types of operations:

#### Rate Limit Tiers

| Endpoint Type | Window | Limit | Description |
|---------------|--------|-------|-------------|
| **General API** | 15 minutes | 1000 requests | General API usage |
| **Authentication** | 15 minutes | 10 attempts | Login/signup attempts |
| **File Upload** | 1 hour | 50 uploads | File upload operations |
| **Password Reset** | 1 hour | 3 attempts | Password reset requests |
| **OTP Requests** | 5 minutes | 5 requests | OTP generation/verification |
| **AI Processing** | 1 hour | 100 requests | AI/ML analysis operations |
| **Blockchain** | 5 minutes | 20 operations | Blockchain interactions |
| **API Keys** | 24 hours | 5 operations | API key management |

#### Dynamic Rate Limiting

The system supports role-based rate limiting:

- **Admin Users**: 10x the standard limit
- **Premium Users**: 3x the standard limit  
- **Regular Users**: Standard limits
- **Anonymous Users**: Most restrictive limits

#### Fallback Mechanism

When Redis is unavailable, the rate limiter automatically falls back to in-memory storage, ensuring the application continues to function with basic rate limiting protection.

## Redis Service Utility (`services/redisService.js`)

A high-level service class providing application-specific Redis operations:

### Session Management
- `setSession(sessionId, sessionData, expiration)`
- `getSession(sessionId)`
- `deleteSession(sessionId)`

### Cache Management
- `setCache(key, data, expiration)`
- `getCache(key)`
- `deleteCache(key)`
- `clearCachePattern(pattern)`

### User Activity Tracking
- `trackUserActivity(userId, activity, metadata)`
- `getUserActivities(userId, limit)`

### Temporary Token Storage
- `setTempToken(type, identifier, data, expiration)`
- `getTempToken(type, identifier)`
- `deleteTempToken(type, identifier)`

### Distributed Locks
- `acquireLock(lockKey, expiration)`
- `releaseLock(lockKey, lockId)`

### Counters and Statistics
- `incrementCounter(name, amount, expiration)`
- `getCounter(name)`
- `resetCounter(name)`

### Feature Flags
- `setFeatureFlag(flagName, enabled, expiration)`
- `getFeatureFlag(flagName, defaultValue)`

## Admin Monitoring (`routes/adminRoutes.js`)

Administrative endpoints for monitoring and managing Redis and rate limiting:

### System Status
- `GET /api/admin/system-status` - Complete system health including Redis and rate limiting status
- `GET /api/admin/redis-info` - Detailed Redis connection and performance information  
- `GET /api/admin/rate-limit-stats` - Rate limiting statistics and analytics

### Rate Limit Management
- `DELETE /api/admin/rate-limits/user/:userId` - Clear rate limits for specific user
- `DELETE /api/admin/rate-limits/ip/:ip` - Clear rate limits for specific IP address

### Health Checks
- `GET /api/admin/health` - Public health check endpoint
- `POST /api/admin/redis/test` - Redis connection and operations test

## Implementation Details

### Redis Key Naming Convention

All Redis keys follow the pattern: `forticrypt:{category}:{identifier}`

Examples:
- `forticrypt:session:abc123` - User session data
- `forticrypt:cache:user_profile_456` - Cached user profile
- `forticrypt:general:192.168.1.1` - General rate limiting for IP
- `forticrypt:auth:user_789` - Authentication rate limiting for user
- `forticrypt:token:otp:user@example.com` - OTP token storage

### Error Handling

The system includes comprehensive error handling:

1. **Redis Unavailable**: Automatic fallback to in-memory operations
2. **Connection Drops**: Automatic reconnection with exponential backoff
3. **Operation Failures**: Graceful degradation with logging
4. **Memory Fallback**: In-memory stores for rate limiting and caching

### Performance Optimizations

- **Connection Pooling**: Efficient Redis connection management
- **Lazy Loading**: Connections established only when needed
- **Batch Operations**: Grouped Redis commands where possible
- **TTL Management**: Automatic expiration for temporary data
- **Memory Cleanup**: Periodic cleanup of expired entries

## Monitoring and Analytics

### Health Monitoring

The system continuously monitors:
- Redis connection status
- Rate limiting backend status (Redis vs Memory)
- Error rates and patterns
- Performance metrics

### Rate Limiting Analytics

Detailed analytics available for:
- Active rate limit keys per category
- Request patterns and trends
- Blocked requests by endpoint
- User-specific rate limiting statistics

### Logging

Comprehensive logging includes:
- Redis connection events
- Rate limiting violations
- Fallback operations
- Performance metrics
- Error conditions

## Usage Examples

### Basic Redis Operations

```javascript
const RedisService = require('../services/redisService');

// Cache user data
await RedisService.setCache('user_123', userData, 300); // 5 minutes

// Retrieve cached data
const cached = await RedisService.getCache('user_123');
if (cached) {
  console.log('Cache age:', cached.age, 'ms');
  return cached.data;
}
```

### Rate Limiting in Routes

```javascript
const { auth, upload } = require('../middlewares/rateLimiter');

// Apply authentication rate limiting
router.post('/login', auth, loginController);

// Apply upload rate limiting  
router.post('/upload', upload, uploadController);
```

### Admin Monitoring

```javascript
// Check system health
const response = await fetch('/api/admin/system-status');
const status = await response.json();

console.log('Redis connected:', status.redis.connected);
console.log('Rate limit backend:', status.rateLimiting.backend);
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify connection parameters in `.env`
   - Check network connectivity
   - Review logs for detailed error messages

2. **Rate Limiting Not Working**
   - Verify Redis connection status
   - Check rate limiter configuration
   - Review admin endpoints for statistics
   - Confirm middleware is properly applied

3. **Performance Issues**
   - Monitor Redis memory usage
   - Check connection pool settings
   - Review rate limiting statistics
   - Consider Redis optimization

### Debug Commands

```bash
# Check Redis connectivity
redis-cli ping

# Monitor Redis operations
redis-cli monitor

# Check Redis memory usage
redis-cli info memory

# List FortiCrypt keys
redis-cli keys "forticrypt:*"
```

## Security Considerations

1. **Redis Security**
   - Use strong passwords in production
   - Enable Redis AUTH
   - Configure firewall rules
   - Use TLS for connections in production

2. **Rate Limiting Security**
   - Monitor for abuse patterns
   - Implement IP-based blocking for severe violations
   - Use different limits for authenticated vs anonymous users
   - Regular cleanup of rate limiting data

3. **Data Protection**
   - Encrypt sensitive data before storing in Redis
   - Use appropriate TTL values for temporary data
   - Regular security audits of stored data
   - Implement proper access controls

## Configuration Recommendations

### Production Settings

```env
# Redis Production Configuration
REDIS_HOST=your-redis-server
REDIS_PORT=6379
REDIS_PASSWORD=strong-password
REDIS_DB=0
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
REDIS_RETRY_DELAY=100
REDIS_MAX_RETRIES=3
```

### Development Settings

The current `.env` configuration is suitable for development with a local Redis instance.

---

This comprehensive Redis and rate limiting system provides robust protection against abuse while maintaining high performance and reliability. The fallback mechanisms ensure your application continues to function even when Redis is unavailable, and the monitoring tools provide complete visibility into system performance.