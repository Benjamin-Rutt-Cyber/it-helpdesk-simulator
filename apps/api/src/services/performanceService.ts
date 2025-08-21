import { PerformanceRepository } from '../repositories/performanceRepository';
import { UserRepository } from '../repositories/userRepository';
import { SessionRepository } from '../repositories/sessionRepository';
import { NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class PerformanceService {
  private performanceRepository: PerformanceRepository;
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;

  constructor() {
    this.performanceRepository = new PerformanceRepository();
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
  }

  async getUserPerformance(userId: string) {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      const metrics = await this.performanceRepository.findByUserId(userId);

      return metrics;
    } catch (error) {
      logger.error('Error retrieving user performance', { userId, error });
      throw error;
    }
  }

  async getUserAnalytics(userId: string) {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      // Get performance metrics
      const metrics = await this.performanceRepository.findByUserId(userId);
      
      // Get session statistics
      const completedSessions = await this.sessionRepository.findCompletedSessionsByUser(userId);
      const activeSessions = await this.sessionRepository.findActiveSessionsByUser(userId);

      // Calculate analytics
      const analytics = {
        userId,
        totalSessions: completedSessions.length + activeSessions.length,
        completedSessions: completedSessions.length,
        activeSessions: activeSessions.length,
        averageResolutionTime: this.calculateAverageResolutionTime(completedSessions),
        successRate: this.calculateSuccessRate(completedSessions),
        performance: {
          latest: metrics.slice(0, 10), // Last 10 performance records
          averageScore: this.calculateAverageScore(metrics),
          improvement: this.calculateImprovement(metrics),
        },
        levelProgression: {
          currentLevel: user.level,
          currentXP: user.xp,
          nextLevelXP: this.calculateNextLevelXP(user.level),
        },
      };

      return analytics;
    } catch (error) {
      logger.error('Error retrieving user analytics', { userId, error });
      throw error;
    }
  }

  private calculateAverageResolutionTime(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const totalTime = sessions.reduce((sum, session) => {
      if (session.startedAt && session.resolvedAt) {
        const resolutionTime = new Date(session.resolvedAt).getTime() - new Date(session.startedAt).getTime();
        return sum + resolutionTime;
      }
      return sum;
    }, 0);

    return Math.round(totalTime / sessions.length / 1000 / 60); // Convert to minutes
  }

  private calculateSuccessRate(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const successfulSessions = sessions.filter(session => 
      session.status === 'COMPLETED' && !session.escalated
    ).length;

    return Math.round((successfulSessions / sessions.length) * 100);
  }

  private calculateAverageScore(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    const totalScore = metrics.reduce((sum, metric) => sum + (metric.score || 0), 0);
    return Math.round(totalScore / metrics.length);
  }

  private calculateImprovement(metrics: any[]): number {
    if (metrics.length < 2) return 0;

    // Sort by date (newest first)
    const sortedMetrics = metrics.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const recentAverage = sortedMetrics.slice(0, 5).reduce((sum, metric) => sum + (metric.score || 0), 0) / 5;
    const olderAverage = sortedMetrics.slice(-5).reduce((sum, metric) => sum + (metric.score || 0), 0) / 5;

    return Math.round(((recentAverage - olderAverage) / olderAverage) * 100);
  }

  private calculateNextLevelXP(currentLevel: number): number {
    // Simple XP progression: each level requires (level * 100) XP
    return (currentLevel + 1) * 100;
  }
}