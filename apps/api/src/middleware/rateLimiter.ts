import rateLimit from 'express-rate-limit';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

// Redis store for rate limiting
class RedisStore {
  private prefix: string;
  private client: typeof redisClient;

  constructor(prefix = 'rate_limit:') {
    this.prefix = prefix;
    this.client = redisClient;
  }

  async incr(key: string, windowMs: number): Promise<{ totalHits: number; timeToExpire: number }> {
    const redisKey = this.prefix + key;
    
    try {
      // Check if Redis is available
      if (!this.client.isReady) {
        throw new Error('Redis not available');
      }

      const multi = this.client.multi();
      multi.incr(redisKey);
      multi.expire(redisKey, Math.ceil(windowMs / 1000));
      multi.ttl(redisKey);
      
      const results = await multi.exec();
      
      const totalHits = (results?.[0] as unknown as number) || 1;
      const timeToExpire = (((results?.[2] as unknown as number) || 0) * 1000); // Convert to milliseconds
      
      return {
        totalHits,
        timeToExpire: timeToExpire > 0 ? timeToExpire : windowMs,
      };
    } catch (error) {
      logger.warn('Redis rate limit store error, falling back to memory', { error });
      // Fall back to memory-based counting (not persistent across restarts)
      return this.memoryFallback(key, windowMs);
    }
  }

  private memoryStore = new Map<string, { count: number; resetTime: number }>();

  private memoryFallback(key: string, windowMs: number): { totalHits: number; timeToExpire: number } {
    const now = Date.now();
    const entry = this.memoryStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const resetTime = now + windowMs;
      this.memoryStore.set(key, { count: 1, resetTime });
      return { totalHits: 1, timeToExpire: windowMs };
    }
    
    // Increment count
    entry.count++;
    this.memoryStore.set(key, entry);
    
    return {
      totalHits: entry.count,
      timeToExpire: entry.resetTime - now,
    };
  }

  async resetKey(key: string): Promise<void> {
    try {
      if (this.client.isReady) {
        await this.client.del(this.prefix + key);
      }
    } catch (error) {
      logger.warn('Failed to reset rate limit key in Redis', { key, error });
    }
    
    // Also reset memory fallback
    this.memoryStore.delete(key);
  }
}

const redisStore = new RedisStore();

// Create rate limiter with Redis store
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: any;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  keyGenerator?: (req: any) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: options.legacyHeaders ?? false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || 'unknown'),
    store: {
      incr: async (key: string) => {
        const result = await redisStore.incr(key, options.windowMs);
        return result;
      },
      decrement: async (key: string) => {
        // Express-rate-limit expects this method but we don't implement decrement
        // This is fine for most use cases
      },
      resetKey: async (key: string) => {
        await redisStore.resetKey(key);
      },
    },
  });
};

// General API rate limiter
export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900, // 15 minutes in seconds
  },
});

// Authentication rate limiter (stricter)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900,
  },
});

// API endpoint rate limiter
export const apiRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: {
    error: 'Too many API requests, please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
  },
});

// Per-user rate limiter (when authenticated)
export const createUserRateLimiter = (windowMs: number, max: number) => {
  return createRateLimiter({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this user, please try again later.',
      code: 'USER_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    },
  });
};

export { RedisStore, redisStore };