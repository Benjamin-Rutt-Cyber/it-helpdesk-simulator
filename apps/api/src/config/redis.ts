import { createClient } from 'redis';
import { env } from './environment';
import { logger } from '../utils/logger';

const redisClient = createClient({
  url: env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
  },
  database: env.NODE_ENV === 'test' ? 1 : 0,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', { error: err });
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

redisClient.on('end', () => {
  logger.info('Redis Client Disconnected');
});

export const initializeRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    // Don't throw error - allow app to start without Redis
    // Rate limiting will fall back to memory store
  }
};

export const closeRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection', { error });
  }
};

export const checkRedisHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: number;
}> => {
  try {
    const start = Date.now();
    await redisClient.ping();
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      message: 'Redis is connected and responding',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Redis is not responding',
    };
  }
};

export { redisClient };