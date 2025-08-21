import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createClient, RedisClientType } from 'redis';

export interface AIMetrics {
  conversationId: string;
  requestCount: number;
  totalTokensUsed: number;
  totalCost: number;
  averageResponseTime: number;
  modelUsage: Record<string, number>;
  errorCount: number;
  cacheHitRate: number;
  qualityScores: number[];
  lastUpdated: Date;
}

export interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
  cost: number;
}

class AIMetricsTracker {
  private redis: RedisClientType;
  private readonly METRICS_TTL = 86400 * 30; // 30 days
  private readonly COST_PER_TOKEN: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 }
  };

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.redis.on('error', (err) => {
      logger.error('AI Metrics Redis connection error:', err);
    });

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      await this.redis.connect();
      logger.info('AI Metrics Redis client connected');
    } catch (error) {
      logger.error('Failed to connect to Redis for metrics:', error);
      throw error;
    }
  }

  async trackAIRequest(
    conversationId: string,
    tokensUsed: number,
    responseTime: number,
    model: string,
    qualityScore?: number,
    error?: boolean
  ): Promise<void> {
    try {
      const metrics = await this.getMetrics(conversationId) || this.createEmptyMetrics(conversationId);
      
      // Update metrics
      metrics.requestCount++;
      metrics.totalTokensUsed += tokensUsed;
      metrics.totalCost += this.calculateCost(tokensUsed, 0, model); // Simplified cost calculation
      
      // Update average response time
      metrics.averageResponseTime = (
        (metrics.averageResponseTime * (metrics.requestCount - 1) + responseTime) / 
        metrics.requestCount
      );

      // Track model usage
      metrics.modelUsage[model] = (metrics.modelUsage[model] || 0) + 1;

      // Track errors
      if (error) {
        metrics.errorCount++;
      }

      // Track quality scores
      if (qualityScore !== undefined) {
        metrics.qualityScores.push(qualityScore);
        // Keep only last 20 scores to prevent unlimited growth
        if (metrics.qualityScores.length > 20) {
          metrics.qualityScores = metrics.qualityScores.slice(-20);
        }
      }

      metrics.lastUpdated = new Date();

      await this.saveMetrics(metrics);

      logger.info('AI request metrics tracked', {
        conversationId,
        tokensUsed,
        responseTime,
        model,
        totalCost: metrics.totalCost
      });

    } catch (error) {
      logger.error('Failed to track AI request metrics:', error);
    }
  }

  async trackCacheHit(conversationId: string, hit: boolean): Promise<void> {
    try {
      const metrics = await this.getMetrics(conversationId) || this.createEmptyMetrics(conversationId);
      
      // Simple cache hit rate calculation
      const currentHits = metrics.cacheHitRate * metrics.requestCount;
      const newHits = hit ? currentHits + 1 : currentHits;
      const newTotal = metrics.requestCount + 1;
      
      metrics.cacheHitRate = newHits / newTotal;
      metrics.lastUpdated = new Date();

      await this.saveMetrics(metrics);

    } catch (error) {
      logger.error('Failed to track cache hit metrics:', error);
    }
  }

  private createEmptyMetrics(conversationId: string): AIMetrics {
    return {
      conversationId,
      requestCount: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageResponseTime: 0,
      modelUsage: {},
      errorCount: 0,
      cacheHitRate: 0,
      qualityScores: [],
      lastUpdated: new Date()
    };
  }

  private async getMetrics(conversationId: string): Promise<AIMetrics | null> {
    try {
      const metricsKey = this.getMetricsKey(conversationId);
      const metricsData = await this.redis.get(metricsKey);
      
      if (!metricsData) {
        return null;
      }

      const metrics = JSON.parse(metricsData) as AIMetrics;
      metrics.lastUpdated = new Date(metrics.lastUpdated);
      
      return metrics;
    } catch (error) {
      logger.error(`Failed to get metrics for conversation ${conversationId}:`, error);
      return null;
    }
  }

  private async saveMetrics(metrics: AIMetrics): Promise<void> {
    try {
      const metricsKey = this.getMetricsKey(metrics.conversationId);
      await this.redis.setEx(
        metricsKey,
        this.METRICS_TTL,
        JSON.stringify(metrics)
      );
    } catch (error) {
      logger.error(`Failed to save metrics for conversation ${metrics.conversationId}:`, error);
    }
  }

  private getMetricsKey(conversationId: string): string {
    return `ai_metrics:${conversationId}`;
  }

  calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing = this.COST_PER_TOKEN[model] || this.COST_PER_TOKEN['gpt-3.5-turbo'];
    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }

  async getConversationMetrics(conversationId: string): Promise<AIMetrics | null> {
    return this.getMetrics(conversationId);
  }

  async getAggregatedMetrics(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<{
    totalRequests: number;
    totalTokensUsed: number;
    totalCost: number;
    averageResponseTime: number;
    errorRate: number;
    averageQualityScore: number;
    modelDistribution: Record<string, number>;
    costByModel: Record<string, number>;
  }> {
    try {
      // Get all conversation metrics
      const keys = await this.redis.keys('ai_metrics:*');
      const allMetrics: AIMetrics[] = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const metrics = JSON.parse(data) as AIMetrics;
          metrics.lastUpdated = new Date(metrics.lastUpdated);
          
          // Filter by timeframe
          if (this.isWithinTimeframe(metrics.lastUpdated, timeframe)) {
            allMetrics.push(metrics);
          }
        }
      }

      return this.aggregateMetrics(allMetrics);

    } catch (error) {
      logger.error('Failed to get aggregated metrics:', error);
      return this.getEmptyAggregatedMetrics();
    }
  }

  private isWithinTimeframe(date: Date, timeframe: string): boolean {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    switch (timeframe) {
      case '1h':
        return diffMs <= 3600000; // 1 hour
      case '24h':
        return diffMs <= 86400000; // 24 hours
      case '7d':
        return diffMs <= 604800000; // 7 days
      case '30d':
        return diffMs <= 2592000000; // 30 days
      default:
        return true;
    }
  }

  private aggregateMetrics(metricsArray: AIMetrics[]): {
    totalRequests: number;
    totalTokensUsed: number;
    totalCost: number;
    averageResponseTime: number;
    errorRate: number;
    averageQualityScore: number;
    modelDistribution: Record<string, number>;
    costByModel: Record<string, number>;
  } {
    const totalRequests = metricsArray.reduce((sum, m) => sum + m.requestCount, 0);
    const totalTokensUsed = metricsArray.reduce((sum, m) => sum + m.totalTokensUsed, 0);
    const totalCost = metricsArray.reduce((sum, m) => sum + m.totalCost, 0);
    const totalErrors = metricsArray.reduce((sum, m) => sum + m.errorCount, 0);

    // Calculate weighted average response time
    let totalWeightedResponseTime = 0;
    let totalWeight = 0;
    
    for (const metrics of metricsArray) {
      if (metrics.requestCount > 0) {
        totalWeightedResponseTime += metrics.averageResponseTime * metrics.requestCount;
        totalWeight += metrics.requestCount;
      }
    }
    
    const averageResponseTime = totalWeight > 0 ? totalWeightedResponseTime / totalWeight : 0;

    // Calculate average quality score
    const allQualityScores = metricsArray.flatMap(m => m.qualityScores);
    const averageQualityScore = allQualityScores.length > 0 
      ? allQualityScores.reduce((sum, score) => sum + score, 0) / allQualityScores.length 
      : 0;

    // Aggregate model usage
    const modelDistribution: Record<string, number> = {};
    const costByModel: Record<string, number> = {};
    
    for (const metrics of metricsArray) {
      for (const [model, count] of Object.entries(metrics.modelUsage)) {
        modelDistribution[model] = (modelDistribution[model] || 0) + count;
        // Estimate cost by model (simplified)
        costByModel[model] = (costByModel[model] || 0) + (metrics.totalCost * count / metrics.requestCount);
      }
    }

    return {
      totalRequests,
      totalTokensUsed,
      totalCost,
      averageResponseTime,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      averageQualityScore,
      modelDistribution,
      costByModel
    };
  }

  private getEmptyAggregatedMetrics() {
    return {
      totalRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageResponseTime: 0,
      errorRate: 0,
      averageQualityScore: 0,
      modelDistribution: {},
      costByModel: {}
    };
  }

  // Express middleware for automatic metrics tracking
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to capture response data
      res.json = function(body: any) {
        const responseTime = Date.now() - startTime;
        
        // Track metrics if this was an AI request
        if (req.path.includes('/ai/') && body.conversationId) {
          const conversationId = body.conversationId;
          const tokensUsed = body.tokensUsed || 0;
          const model = body.model || 'unknown';
          const qualityScore = body.qualityScore;
          const error = res.statusCode >= 400;

          // Track asynchronously to not block response
          aiMetricsTracker.trackAIRequest(
            conversationId,
            tokensUsed,
            responseTime,
            model,
            qualityScore,
            error
          ).catch(err => {
            logger.error('Failed to track AI metrics in middleware:', err);
          });
        }

        // Call original json method
        return originalJson.call(this, body);
      };

      next();
    };
  }

  // Cost monitoring and alerts
  async checkCostThresholds(conversationId: string): Promise<{
    exceeded: boolean;
    currentCost: number;
    threshold: number;
    recommendation: string;
  }> {
    const metrics = await this.getMetrics(conversationId);
    
    if (!metrics) {
      return {
        exceeded: false,
        currentCost: 0,
        threshold: 1.0,
        recommendation: 'No cost data available'
      };
    }

    const threshold = parseFloat(process.env.AI_COST_THRESHOLD || '1.0'); // $1 default
    const exceeded = metrics.totalCost > threshold;

    let recommendation = 'Cost within normal range';
    
    if (exceeded) {
      recommendation = 'Consider using GPT-3.5-turbo for cost efficiency or implementing response caching';
    } else if (metrics.totalCost > threshold * 0.8) {
      recommendation = 'Approaching cost threshold - monitor usage closely';
    }

    return {
      exceeded,
      currentCost: metrics.totalCost,
      threshold,
      recommendation
    };
  }

  // Performance optimization recommendations
  async getOptimizationRecommendations(conversationId: string): Promise<string[]> {
    const metrics = await this.getMetrics(conversationId);
    const recommendations: string[] = [];
    
    if (!metrics) {
      return recommendations;
    }

    // Check response time
    if (metrics.averageResponseTime > 5000) {
      recommendations.push('Consider reducing max_tokens or using faster model for better response times');
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < 0.3 && metrics.requestCount > 10) {
      recommendations.push('Low cache hit rate - consider implementing more aggressive caching strategies');
    }

    // Check error rate
    if (metrics.errorCount / metrics.requestCount > 0.1) {
      recommendations.push('High error rate detected - review error handling and retry logic');
    }

    // Check cost efficiency
    const costPerRequest = metrics.totalCost / metrics.requestCount;
    if (costPerRequest > 0.05) {
      recommendations.push('High cost per request - consider using GPT-3.5-turbo for less complex responses');
    }

    // Check quality scores
    const avgQuality = metrics.qualityScores.reduce((sum, score) => sum + score, 0) / metrics.qualityScores.length;
    if (avgQuality < 75) {
      recommendations.push('Quality scores below target - review prompt engineering and response validation');
    }

    return recommendations;
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('AI Metrics Redis connection closed');
    } catch (error) {
      logger.error('Error closing AI Metrics Redis connection:', error);
    }
  }
}

export const aiMetricsTracker = new AIMetricsTracker();
export default aiMetricsTracker;