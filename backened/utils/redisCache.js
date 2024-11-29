const Redis = require('ioredis');

class RedisCache {
  constructor() {
    // Configure Redis connection with more comprehensive options
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      enableOfflineQueue: false,
      connectTimeout: 5000,  // 5 seconds connection timeout
      maxRetriesPerRequest: 3,  // Retry connection attempts
      retryStrategy: (times) => {
        // Exponential backoff strategy for reconnection
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    };

    this.initializeRedis();
  }

  initializeRedis() {
    try {
      this.redis = new Redis(this.redisConfig);

      this.redis.on('connect', () => {
        console.log('Redis connection established successfully');
      });

      this.redis.on('error', (err) => {
        console.error('Redis Connection Error:', err);
      });

      this.redis.on('close', () => {
        console.warn('Redis connection closed');
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
    }
  }

  async get(key) {
    try {
      if (!this.redis) {
        console.warn('Redis client not initialized');
        return null;
      }

      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis Get Error:', error);
      // Attempt to reinitialize Redis if connection is lost
      this.initializeRedis();
      return null;
    }
  }

  async set(key, value, expiration = 3600) {
    try {
      if (!this.redis) {
        console.warn('Redis client not initialized');
        return;
      }

      // Use setex for automatic expiration
      await this.redis.setex(key, expiration, JSON.stringify(value));
      
      console.log(`Cached key: ${key} with expiration: ${expiration} seconds`);
    } catch (error) {
      console.error('Redis Set Error:', error);
      // Attempt to reinitialize Redis if connection is lost
      this.initializeRedis();
    }
  }

  async invalidate(pattern) {
    try {
      if (!this.redis) {
        console.warn('Redis client not initialized');
        return;
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length) {
        await this.redis.del(...keys);
        console.log(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error('Redis Invalidation Error:', error);
      // Attempt to reinitialize Redis if connection is lost
      this.initializeRedis();
    }
  }

  // Optional: Add a method to check Redis connection status
  async isConnected() {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Redis connection check failed:', error);
      return false;
    }
  }
}

module.exports = new RedisCache();