import { createClient, RedisClientType } from 'redis';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

export interface MessageLatency {
  messageId: string;
  sessionId: string;
  sentAt: Date;
  receivedAt: Date;
  latency: number; // in milliseconds
  messageSize: number; // in bytes
}

export interface PerformanceMetrics {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  messageCount: number;
  totalBytes: number;
  messagesPerSecond: number;
}

export class PerformanceMonitoringService {
  private redis: RedisClientType;
  private metricsKey = 'chat:metrics';
  private latencyKey = 'chat:latency';
  private maxMetricsAge = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.redis = createClient({ url: env.REDIS_URL });
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      await this.redis.connect();
      logger.info('Performance monitoring Redis client connected');
    } catch (error) {
      logger.error('Failed to connect to Redis for performance monitoring:', error);
    }
  }

  async recordMessageLatency(
    messageId: string,
    sessionId: string,
    sentAt: Date,
    receivedAt: Date,
    messageSize: number
  ): Promise<void> {
    try {
      const latency = receivedAt.getTime() - sentAt.getTime();
      
      const latencyData: MessageLatency = {
        messageId,
        sessionId,
        sentAt,
        receivedAt,
        latency,
        messageSize,
      };

      // Store individual latency record
      await this.redis.zAdd(this.latencyKey, {
        score: receivedAt.getTime(),
        value: JSON.stringify(latencyData),
      });

      // Update session metrics
      await this.updateSessionMetrics(sessionId, latency, messageSize);

      // Clean up old metrics
      await this.cleanupOldMetrics();

      logger.debug(`Recorded message latency: ${latency}ms for message ${messageId}`);
    } catch (error) {
      logger.error('Error recording message latency:', error);
    }
  }

  private async updateSessionMetrics(
    sessionId: string,
    latency: number,
    messageSize: number
  ): Promise<void> {
    try {
      const sessionKey = `${this.metricsKey}:${sessionId}`;
      const now = Date.now();
      
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.multi();
      
      // Update counters
      pipeline.hIncrBy(sessionKey, 'messageCount', 1);
      pipeline.hIncrBy(sessionKey, 'totalLatency', latency);
      pipeline.hIncrBy(sessionKey, 'totalBytes', messageSize);
      pipeline.hSet(sessionKey, 'lastUpdated', now.toString());
      
      // Add to latency list for percentile calculations
      pipeline.lPush(`${sessionKey}:latencies`, latency.toString());
      pipeline.lTrim(`${sessionKey}:latencies`, 0, 999); // Keep last 1000 latencies
      
      // Set expiration
      pipeline.expire(sessionKey, 86400); // 24 hours
      pipeline.expire(`${sessionKey}:latencies`, 86400); // 24 hours
      
      await pipeline.exec();
    } catch (error) {
      logger.error('Error updating session metrics:', error);
    }
  }

  async getSessionMetrics(sessionId: string): Promise<PerformanceMetrics | null> {
    try {
      const sessionKey = `${this.metricsKey}:${sessionId}`;
      
      const metrics = await this.redis.hGetAll(sessionKey);
      if (!metrics.messageCount) {
        return null;
      }

      const messageCount = parseInt(metrics.messageCount);
      const totalLatency = parseInt(metrics.totalLatency);
      const totalBytes = parseInt(metrics.totalBytes);
      const lastUpdated = parseInt(metrics.lastUpdated);
      
      // Calculate time range for messages per second
      const timeRange = (Date.now() - lastUpdated) / 1000; // in seconds
      const messagesPerSecond = timeRange > 0 ? messageCount / timeRange : 0;
      
      // Get latency percentiles
      const latencies = await this.redis.lRange(`${sessionKey}:latencies`, 0, -1);
      const latencyNumbers = latencies.map(l => parseInt(l)).sort((a, b) => a - b);
      
      const p95Index = Math.floor(latencyNumbers.length * 0.95);
      const p99Index = Math.floor(latencyNumbers.length * 0.99);
      
      return {
        averageLatency: messageCount > 0 ? totalLatency / messageCount : 0,
        p95Latency: latencyNumbers[p95Index] || 0,
        p99Latency: latencyNumbers[p99Index] || 0,
        messageCount,
        totalBytes,
        messagesPerSecond,
      };
    } catch (error) {
      logger.error('Error getting session metrics:', error);
      return null;
    }
  }

  async getGlobalMetrics(): Promise<PerformanceMetrics> {
    try {
      const keys = await this.redis.keys(`${this.metricsKey}:*`);
      let totalMessageCount = 0;
      let totalLatency = 0;
      let totalBytes = 0;
      let allLatencies: number[] = [];

      for (const key of keys) {
        if (key.endsWith(':latencies')) continue;
        
        const metrics = await this.redis.hGetAll(key);
        if (metrics.messageCount) {
          totalMessageCount += parseInt(metrics.messageCount);
          totalLatency += parseInt(metrics.totalLatency);
          totalBytes += parseInt(metrics.totalBytes);
          
          // Get latencies for this session
          const latencyKey = `${key}:latencies`;
          const latencies = await this.redis.lRange(latencyKey, 0, -1);
          allLatencies.push(...latencies.map(l => parseInt(l)));
        }
      }

      // Calculate percentiles
      allLatencies.sort((a, b) => a - b);
      const p95Index = Math.floor(allLatencies.length * 0.95);
      const p99Index = Math.floor(allLatencies.length * 0.99);

      return {
        averageLatency: totalMessageCount > 0 ? totalLatency / totalMessageCount : 0,
        p95Latency: allLatencies[p95Index] || 0,
        p99Latency: allLatencies[p99Index] || 0,
        messageCount: totalMessageCount,
        totalBytes,
        messagesPerSecond: 0, // Global rate calculation would need time window
      };
    } catch (error) {
      logger.error('Error getting global metrics:', error);
      return {
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        messageCount: 0,
        totalBytes: 0,
        messagesPerSecond: 0,
      };
    }
  }

  async getLatencyHistory(
    sessionId?: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<MessageLatency[]> {
    try {
      const start = startTime ? startTime.getTime() : '-inf';
      const end = endTime ? endTime.getTime() : '+inf';
      
      const latencyRecords = await this.redis.zRangeByScore(
        this.latencyKey,
        start,
        end
      );

      const results: MessageLatency[] = [];
      for (const record of latencyRecords) {
        const latencyData: MessageLatency = JSON.parse(record);
        if (!sessionId || latencyData.sessionId === sessionId) {
          results.push(latencyData);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error getting latency history:', error);
      return [];
    }
  }

  async getSlowMessages(threshold: number = 1000): Promise<MessageLatency[]> {
    try {
      const allLatencies = await this.redis.zRange(this.latencyKey, 0, -1);
      const slowMessages: MessageLatency[] = [];
      
      for (const record of allLatencies) {
        const latencyData: MessageLatency = JSON.parse(record);
        if (latencyData.latency > threshold) {
          slowMessages.push(latencyData);
        }
      }
      
      return slowMessages.sort((a, b) => b.latency - a.latency);
    } catch (error) {
      logger.error('Error getting slow messages:', error);
      return [];
    }
  }

  async alertOnHighLatency(threshold: number = 500): Promise<void> {
    try {
      const recentLatencies = await this.redis.zRangeByScore(
        this.latencyKey,
        Date.now() - 60000, // Last minute
        Date.now()
      );

      const highLatencyMessages = recentLatencies.filter(record => {
        const latencyData: MessageLatency = JSON.parse(record);
        return latencyData.latency > threshold;
      });

      if (highLatencyMessages.length > 0) {
        logger.warn(`High latency detected: ${highLatencyMessages.length} messages over ${threshold}ms in the last minute`);
        
        // Here you could send alerts to monitoring systems
        // e.g., send to DataDog, PagerDuty, etc.
      }
    } catch (error) {
      logger.error('Error checking for high latency:', error);
    }
  }

  private async cleanupOldMetrics(): Promise<void> {
    try {
      const cutoffTime = Date.now() - this.maxMetricsAge;
      
      // Clean up old latency records
      const removedCount = await this.redis.zRemRangeByScore(
        this.latencyKey,
        0,
        cutoffTime
      );
      
      if (removedCount > 0) {
        logger.info(`Cleaned up ${removedCount} old latency records`);
      }
    } catch (error) {
      logger.error('Error cleaning up old metrics:', error);
    }
  }

  async startPerformanceMonitoring(): Promise<void> {
    // Check for high latency every minute
    setInterval(async () => {
      await this.alertOnHighLatency();
    }, 60000);

    // Clean up old metrics every hour
    setInterval(async () => {
      await this.cleanupOldMetrics();
    }, 3600000);

    logger.info('Performance monitoring started');
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('Performance monitoring Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting performance monitoring Redis client:', error);
    }
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();