import { EventEmitter } from 'events';
import { SessionRepository } from '../repositories/sessionRepository';
import { SessionContext, SessionLifecycleEvent } from './sessionManager';
import { logger } from '../utils/logger';
import { createClient, RedisClientType } from 'redis';

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    median: number;
    p95: number;
    p99: number;
    samples: number[];
  };
  sessionDuration: {
    average: number;
    median: number;
    total: number;
  };
  messageMetrics: {
    totalMessages: number;
    averagePerSession: number;
    userMessages: number;
    aiMessages: number;
  };
  verificationMetrics: {
    identityVerificationRate: number;
    issueDocumentationRate: number;
    resolutionRate: number;
    satisfactionRate: number;
  };
  qualityScores: {
    communication: number;
    technical: number;
    completeness: number;
    professionalism: number;
    overall: number;
  };
}

export interface SessionAnalytics {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  messageCount: number;
  responseTimeMs: number[];
  verificationStatus: {
    customerIdentityVerified: boolean;
    issueDocumented: boolean;
    resolutionProvided: boolean;
    customerSatisfied: boolean;
  };
  qualityMetrics: {
    communicationScore: number;
    technicalAccuracy: number;
    completeness: number;
    professionalism: number;
    overallScore: number;
  };
  resolutionMetrics: {
    timeToFirstResponse: number;
    timeToResolution: number;
    escalated: boolean;
    customerSatisfied: boolean;
    resolutionSteps: number;
  };
  engagementMetrics: {
    userInteractionRate: number;
    sessionDepth: number;
    pauseCount: number;
    totalPauseTime: number;
  };
  metadata: {
    scenario: string;
    customerPersona: string;
    urgency: string;
    category: string;
    completionStatus: string;
  };
}

export interface SessionComparison {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SessionTrend {
  period: string;
  data: {
    timestamp: number;
    value: number;
    sessions: number;
  }[];
  average: number;
  trend: 'improving' | 'declining' | 'stable';
  changePercent: number;
}

export class SessionAnalyticsService extends EventEmitter {
  private sessionRepository: SessionRepository;
  private redisClient: RedisClientType;
  private analyticsCache: Map<string, SessionAnalytics> = new Map();
  
  // Analytics configuration
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly BATCH_SIZE = 100;
  private readonly AGGREGATION_INTERVAL = 60000; // 1 minute

  constructor() {
    super();
    this.sessionRepository = new SessionRepository();
    this.redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${parseInt(process.env.REDIS_PORT || '6379')}`,
    });

    this.setupAggregationTask();
  }

  async initialize(): Promise<void> {
    try {
      await this.redisClient.ping();
      logger.info('Session analytics initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize session analytics', { error });
      throw error;
    }
  }

  async trackSessionStart(sessionContext: SessionContext): Promise<void> {
    try {
      const analytics: SessionAnalytics = {
        sessionId: sessionContext.sessionId,
        userId: sessionContext.userId,
        startTime: sessionContext.performanceMetrics.startTime,
        messageCount: 0,
        responseTimeMs: [],
        verificationStatus: { ...sessionContext.verificationStatus },
        qualityMetrics: {
          communicationScore: 0,
          technicalAccuracy: 0,
          completeness: 0,
          professionalism: 0,
          overallScore: 0,
        },
        resolutionMetrics: {
          timeToFirstResponse: 0,
          timeToResolution: 0,
          escalated: false,
          customerSatisfied: false,
          resolutionSteps: 0,
        },
        engagementMetrics: {
          userInteractionRate: 0,
          sessionDepth: 0,
          pauseCount: 0,
          totalPauseTime: 0,
        },
        metadata: {
          scenario: sessionContext.scenarioId,
          customerPersona: sessionContext.customerPersona,
          urgency: sessionContext.customerInfo.urgency,
          category: sessionContext.customerInfo.category,
          completionStatus: 'active',
        },
      };

      // Store in cache and Redis
      this.analyticsCache.set(sessionContext.sessionId, analytics);
      await this.persistAnalytics(analytics);

      logger.debug('Session analytics tracking started', { sessionId: sessionContext.sessionId });
    } catch (error) {
      logger.error('Failed to track session start', { sessionId: sessionContext.sessionId, error });
    }
  }

  async trackMessage(
    sessionId: string, 
    responseTime: number, 
    messageType: 'user' | 'ai' | 'system',
    qualityScore?: number
  ): Promise<void> {
    try {
      const analytics = await this.getAnalytics(sessionId);
      if (!analytics) {
        logger.warn('Analytics not found for session', { sessionId });
        return;
      }

      // Update message metrics
      analytics.messageCount++;
      if (responseTime > 0) {
        analytics.responseTimeMs.push(responseTime);
      }

      // Track first response time
      if (analytics.resolutionMetrics.timeToFirstResponse === 0 && messageType === 'ai') {
        analytics.resolutionMetrics.timeToFirstResponse = Date.now() - analytics.startTime;
      }

      // Update quality metrics if provided
      if (qualityScore !== undefined && messageType === 'ai') {
        this.updateQualityScore(analytics, qualityScore);
      }

      // Update engagement metrics
      this.updateEngagementMetrics(analytics, messageType);

      // Update cache and Redis
      this.analyticsCache.set(sessionId, analytics);
      await this.persistAnalytics(analytics);

      logger.debug('Message tracked', { sessionId, messageType, responseTime });
    } catch (error) {
      logger.error('Failed to track message', { sessionId, error });
    }
  }

  async trackSessionEvent(event: SessionLifecycleEvent): Promise<void> {
    try {
      const analytics = await this.getAnalytics(event.sessionId);
      if (!analytics) {
        return;
      }

      switch (event.type) {
        case 'session_paused':
          analytics.engagementMetrics.pauseCount++;
          break;

        case 'session_completed':
        case 'session_escalated':
        case 'session_abandoned':
          await this.finalizeSessionAnalytics(analytics, event);
          break;

        case 'verification_updated':
          if (event.data) {
            Object.assign(analytics.verificationStatus, event.data);
          }
          break;

        case 'progress_updated':
          analytics.resolutionMetrics.resolutionSteps++;
          break;
      }

      // Update cache and Redis
      this.analyticsCache.set(event.sessionId, analytics);
      await this.persistAnalytics(analytics);

    } catch (error) {
      logger.error('Failed to track session event', { event, error });
    }
  }

  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
    try {
      return await this.getAnalytics(sessionId);
    } catch (error) {
      logger.error('Failed to get session analytics', { sessionId, error });
      return null;
    }
  }

  async getUserPerformanceMetrics(userId: string, timeRange?: { start: number; end: number }): Promise<PerformanceMetrics> {
    try {
      const sessions = await this.getUserSessions(userId, timeRange);
      return this.calculatePerformanceMetrics(sessions);
    } catch (error) {
      logger.error('Failed to get user performance metrics', { userId, error });
      throw error;
    }
  }

  async getSessionComparison(sessionId: string, comparisonSessionId: string): Promise<SessionComparison[]> {
    try {
      const [current, comparison] = await Promise.all([
        this.getAnalytics(sessionId),
        this.getAnalytics(comparisonSessionId),
      ]);

      if (!current || !comparison) {
        throw new Error('One or both sessions not found for comparison');
      }

      return this.calculateSessionComparison(current, comparison);
    } catch (error) {
      logger.error('Failed to get session comparison', { sessionId, comparisonSessionId, error });
      throw error;
    }
  }

  async getPerformanceTrends(
    userId: string, 
    metric: string, 
    period: 'hour' | 'day' | 'week' | 'month',
    duration: number = 30
  ): Promise<SessionTrend> {
    try {
      const sessions = await this.getUserSessionsForPeriod(userId, period, duration);
      return this.calculateTrend(sessions, metric, period);
    } catch (error) {
      logger.error('Failed to get performance trends', { userId, metric, period, error });
      throw error;
    }
  }

  async getRealtimeMetrics(sessionId: string): Promise<Partial<SessionAnalytics>> {
    try {
      const analytics = await this.getAnalytics(sessionId);
      if (!analytics) {
        return {};
      }

      const currentTime = Date.now();
      const duration = analytics.endTime ? analytics.duration! : (currentTime - analytics.startTime);

      return {
        sessionId,
        messageCount: analytics.messageCount,
        duration,
        responseTimeMs: analytics.responseTimeMs.slice(-10), // Last 10 response times
        qualityMetrics: analytics.qualityMetrics,
        verificationStatus: analytics.verificationStatus,
        engagementMetrics: {
          ...analytics.engagementMetrics,
          userInteractionRate: analytics.messageCount > 0 ? 
            (analytics.messageCount / (duration / 60000)) : 0, // messages per minute
        },
      };
    } catch (error) {
      logger.error('Failed to get realtime metrics', { sessionId, error });
      return {};
    }
  }

  async aggregateSessionData(): Promise<void> {
    try {
      // Get all completed sessions from last hour
      const endTime = Date.now();
      const startTime = endTime - (60 * 60 * 1000); // 1 hour ago

      const completedSessions = await this.getCompletedSessionsInRange(startTime, endTime);
      
      if (completedSessions.length === 0) {
        return;
      }

      // Calculate aggregated metrics
      const aggregatedMetrics = this.calculatePerformanceMetrics(completedSessions);

      // Store aggregated data
      await this.storeAggregatedMetrics(startTime, endTime, aggregatedMetrics);

      logger.info('Session data aggregated', { 
        sessionsProcessed: completedSessions.length,
        timeRange: { startTime, endTime } 
      });
    } catch (error) {
      logger.error('Failed to aggregate session data', { error });
    }
  }

  private async getAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
    // Try cache first
    let analytics = this.analyticsCache.get(sessionId);
    
    if (!analytics) {
      // Try Redis
      const redisData = await this.redisClient.get(`analytics:${sessionId}`);
      if (redisData) {
        analytics = JSON.parse(redisData);
        if (analytics) {
          this.analyticsCache.set(sessionId, analytics);
        }
      }
    }

    return analytics || null;
  }

  private async persistAnalytics(analytics: SessionAnalytics): Promise<void> {
    try {
      await this.redisClient.setEx(
        `analytics:${analytics.sessionId}`,
        this.CACHE_TTL,
        JSON.stringify(analytics)
      );
    } catch (error) {
      logger.error('Failed to persist analytics', { sessionId: analytics.sessionId, error });
    }
  }

  private updateQualityScore(analytics: SessionAnalytics, score: number): void {
    const metrics = analytics.qualityMetrics;
    
    // Update individual scores (simplified logic)
    metrics.communicationScore = (metrics.communicationScore + score) / 2;
    metrics.technicalAccuracy = (metrics.technicalAccuracy + score) / 2;
    metrics.completeness = (metrics.completeness + score) / 2;
    metrics.professionalism = (metrics.professionalism + score) / 2;
    
    // Calculate overall score
    metrics.overallScore = (
      metrics.communicationScore + 
      metrics.technicalAccuracy + 
      metrics.completeness + 
      metrics.professionalism
    ) / 4;
  }

  private updateEngagementMetrics(analytics: SessionAnalytics, messageType: string): void {
    const currentTime = Date.now();
    const duration = currentTime - analytics.startTime;
    
    // Update interaction rate (messages per minute)
    analytics.engagementMetrics.userInteractionRate = 
      analytics.messageCount / (duration / 60000);
    
    // Update session depth (complexity indicator)
    if (messageType === 'user') {
      analytics.engagementMetrics.sessionDepth++;
    }
  }

  private async finalizeSessionAnalytics(analytics: SessionAnalytics, event: SessionLifecycleEvent): Promise<void> {
    analytics.endTime = event.timestamp;
    analytics.duration = event.timestamp - analytics.startTime;
    analytics.metadata.completionStatus = event.type.replace('session_', '');

    // Update resolution metrics
    analytics.resolutionMetrics.timeToResolution = analytics.duration;
    analytics.resolutionMetrics.escalated = event.type === 'session_escalated';
    analytics.resolutionMetrics.customerSatisfied = analytics.verificationStatus.customerSatisfied;

    // Store final analytics in database for long-term storage
    await this.storeCompletedSessionAnalytics(analytics);
  }

  private calculatePerformanceMetrics(sessions: SessionAnalytics[]): PerformanceMetrics {
    const responseTimes = sessions.flatMap(s => s.responseTimeMs);
    const durations = sessions.filter(s => s.duration).map(s => s.duration!);
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);

    return {
      responseTime: {
        average: this.calculateAverage(responseTimes),
        median: this.calculateMedian(responseTimes),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99),
        samples: responseTimes,
      },
      sessionDuration: {
        average: this.calculateAverage(durations),
        median: this.calculateMedian(durations),
        total: durations.reduce((sum, d) => sum + d, 0),
      },
      messageMetrics: {
        totalMessages,
        averagePerSession: sessions.length > 0 ? totalMessages / sessions.length : 0,
        userMessages: totalMessages, // Simplified
        aiMessages: totalMessages, // Simplified
      },
      verificationMetrics: {
        identityVerificationRate: this.calculateRate(sessions, s => s.verificationStatus.customerIdentityVerified),
        issueDocumentationRate: this.calculateRate(sessions, s => s.verificationStatus.issueDocumented),
        resolutionRate: this.calculateRate(sessions, s => s.verificationStatus.resolutionProvided),
        satisfactionRate: this.calculateRate(sessions, s => s.verificationStatus.customerSatisfied),
      },
      qualityScores: {
        communication: this.calculateAverage(sessions.map(s => s.qualityMetrics.communicationScore)),
        technical: this.calculateAverage(sessions.map(s => s.qualityMetrics.technicalAccuracy)),
        completeness: this.calculateAverage(sessions.map(s => s.qualityMetrics.completeness)),
        professionalism: this.calculateAverage(sessions.map(s => s.qualityMetrics.professionalism)),
        overall: this.calculateAverage(sessions.map(s => s.qualityMetrics.overallScore)),
      },
    };
  }

  private calculateSessionComparison(current: SessionAnalytics, comparison: SessionAnalytics): SessionComparison[] {
    const metrics = [
      {
        metric: 'Response Time',
        currentValue: this.calculateAverage(current.responseTimeMs),
        previousValue: this.calculateAverage(comparison.responseTimeMs),
      },
      {
        metric: 'Message Count',
        currentValue: current.messageCount,
        previousValue: comparison.messageCount,
      },
      {
        metric: 'Session Duration',
        currentValue: current.duration || 0,
        previousValue: comparison.duration || 0,
      },
      {
        metric: 'Overall Quality',
        currentValue: current.qualityMetrics.overallScore,
        previousValue: comparison.qualityMetrics.overallScore,
      },
    ];

    return metrics.map(m => {
      const change = m.currentValue - m.previousValue;
      const changePercent = m.previousValue > 0 ? (change / m.previousValue) * 100 : 0;
      
      return {
        ...m,
        change,
        changePercent,
        trend: Math.abs(changePercent) < 5 ? 'stable' : (change > 0 ? 'up' : 'down'),
      };
    });
  }

  private calculateTrend(sessions: SessionAnalytics[], metric: string, period: string): SessionTrend {
    // Simplified trend calculation
    const values = sessions.map(s => {
      switch (metric) {
        case 'response_time':
          return this.calculateAverage(s.responseTimeMs);
        case 'quality':
          return s.qualityMetrics.overallScore;
        case 'duration':
          return s.duration || 0;
        default:
          return s.messageCount;
      }
    });

    const average = this.calculateAverage(values);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);
    const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    return {
      period,
      data: sessions.map(s => ({
        timestamp: s.startTime,
        value: values[sessions.indexOf(s)],
        sessions: 1,
      })),
      average,
      trend: Math.abs(changePercent) < 5 ? 'stable' : (changePercent > 0 ? 'improving' : 'declining'),
      changePercent,
    };
  }

  // Utility methods
  private calculateAverage(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateRate(sessions: SessionAnalytics[], predicate: (_s: SessionAnalytics) => boolean): number {
    if (sessions.length === 0) return 0;
    const count = sessions.filter(predicate).length;
    return (count / sessions.length) * 100;
  }

  private async getUserSessions(_userId: string, _timeRange?: { start: number; end: number }): Promise<SessionAnalytics[]> {
    // Implementation would query completed sessions from database
    // For now, return empty array
    return [];
  }

  private async getUserSessionsForPeriod(_userId: string, _period: string, _duration: number): Promise<SessionAnalytics[]> {
    // Implementation would query sessions for specific period
    return [];
  }

  private async getCompletedSessionsInRange(_startTime: number, _endTime: number): Promise<SessionAnalytics[]> {
    // Implementation would query completed sessions in time range
    return [];
  }

  private async storeCompletedSessionAnalytics(analytics: SessionAnalytics): Promise<void> {
    // Store in permanent database table for analytics
    logger.debug('Storing completed session analytics', { sessionId: analytics.sessionId });
  }

  private async storeAggregatedMetrics(startTime: number, endTime: number, metrics: PerformanceMetrics): Promise<void> {
    // Store aggregated metrics for reporting
    await this.redisClient.setEx(
      `aggregated:${startTime}:${endTime}`,
      7 * 24 * 3600, // 7 days
      JSON.stringify(metrics)
    );
  }

  private setupAggregationTask(): void {
    setInterval(() => {
      this.aggregateSessionData().catch(error => {
        logger.error('Aggregation task failed', { error });
      });
    }, this.AGGREGATION_INTERVAL);
  }

  async cleanup(): Promise<void> {
    try {
      this.analyticsCache.clear();
      await this.redisClient.quit();
      logger.info('Session analytics cleaned up successfully');
    } catch (error) {
      logger.error('Failed to cleanup session analytics', { error });
    }
  }
}

export const sessionAnalytics = new SessionAnalyticsService();
export default sessionAnalytics;