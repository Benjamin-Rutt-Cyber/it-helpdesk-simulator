import { logger } from '../utils/logger';

export interface VerificationMetrics {
  id: string;
  ticketId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number; // in milliseconds
  verificationAttempts: number;
  successfulVerifications: number;
  failedVerifications: number;
  verificationMethods: string[];
  customerCooperationLevel: 'high' | 'medium' | 'low';
  verificationQuality: 'excellent' | 'good' | 'adequate' | 'poor';
  securityCompliance: boolean;
  completionStatus: 'completed' | 'partial' | 'failed' | 'bypassed';
  bypassReason?: string;
  escalationRequired: boolean;
  learningObjectivesAchieved: string[];
}

export interface VerificationPerformance {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalVerifications: number;
  averageVerificationTime: number;
  successRate: number;
  complianceRate: number;
  improvementAreas: string[];
  strengths: string[];
  recommendedTraining: string[];
}

export interface VerificationAnalytics {
  totalVerifications: number;
  averageCompletionTime: number;
  successRate: number;
  commonFailureReasons: Array<{ reason: string; count: number }>;
  verificationMethodEffectiveness: Array<{ method: string; successRate: number }>;
  customerCooperationTrends: Array<{ level: string; percentage: number }>;
  complianceScore: number;
  performanceTrends: Array<{ date: string; metrics: any }>;
}

class VerificationTrackerService {
  private verificationSessions: Map<string, VerificationMetrics> = new Map();
  private performanceCache: Map<string, VerificationPerformance> = new Map();

  async startVerificationSession(ticketId: string, userId: string): Promise<string> {
    const sessionId = `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: VerificationMetrics = {
      id: sessionId,
      ticketId,
      userId,
      startTime: new Date(),
      verificationAttempts: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      verificationMethods: [],
      customerCooperationLevel: 'medium',
      verificationQuality: 'adequate',
      securityCompliance: true,
      completionStatus: 'partial',
      escalationRequired: false,
      learningObjectivesAchieved: [],
    };

    this.verificationSessions.set(sessionId, session);
    
    logger.info('Verification session started', {
      sessionId,
      ticketId,
      userId,
      timestamp: session.startTime,
    });

    return sessionId;
  }

  async updateVerificationProgress(
    sessionId: string,
    updates: Partial<VerificationMetrics>
  ): Promise<void> {
    const session = this.verificationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Verification session not found: ${sessionId}`);
    }

    // Update session with new data
    Object.assign(session, updates);

    // Recalculate metrics
    if (updates.endTime) {
      session.totalDuration = updates.endTime.getTime() - session.startTime.getTime();
    }

    this.verificationSessions.set(sessionId, session);

    logger.info('Verification progress updated', {
      sessionId,
      updates,
      currentStatus: session.completionStatus,
    });
  }

  async recordVerificationAttempt(
    sessionId: string,
    method: string,
    success: boolean,
    fieldType?: string,
    _details?: any
  ): Promise<void> {
    const session = this.verificationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Verification session not found: ${sessionId}`);
    }

    session.verificationAttempts++;
    
    if (success) {
      session.successfulVerifications++;
      if (!session.verificationMethods.includes(method)) {
        session.verificationMethods.push(method);
      }
      session.learningObjectivesAchieved.push(`Successfully verified ${fieldType || 'customer information'} using ${method}`);
    } else {
      session.failedVerifications++;
    }

    // Update verification quality based on performance
    const successRate = session.successfulVerifications / session.verificationAttempts;
    if (successRate >= 0.9) {
      session.verificationQuality = 'excellent';
    } else if (successRate >= 0.7) {
      session.verificationQuality = 'good';
    } else if (successRate >= 0.5) {
      session.verificationQuality = 'adequate';
    } else {
      session.verificationQuality = 'poor';
    }

    this.verificationSessions.set(sessionId, session);

    logger.info('Verification attempt recorded', {
      sessionId,
      method,
      success,
      fieldType,
      totalAttempts: session.verificationAttempts,
      successRate,
    });
  }

  async updateCustomerCooperation(
    sessionId: string,
    cooperationLevel: 'high' | 'medium' | 'low',
    evidence?: string
  ): Promise<void> {
    const session = this.verificationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Verification session not found: ${sessionId}`);
    }

    session.customerCooperationLevel = cooperationLevel;
    
    // Add learning objective based on cooperation level
    if (cooperationLevel === 'low') {
      session.learningObjectivesAchieved.push('Successfully handled uncooperative customer during verification');
    } else if (cooperationLevel === 'high') {
      session.learningObjectivesAchieved.push('Effectively leveraged cooperative customer for efficient verification');
    }

    this.verificationSessions.set(sessionId, session);

    logger.info('Customer cooperation updated', {
      sessionId,
      cooperationLevel,
      evidence,
    });
  }

  async completeVerificationSession(
    sessionId: string,
    status: 'completed' | 'partial' | 'failed' | 'bypassed',
    bypassReason?: string
  ): Promise<VerificationMetrics> {
    const session = this.verificationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Verification session not found: ${sessionId}`);
    }

    session.endTime = new Date();
    session.totalDuration = session.endTime.getTime() - session.startTime.getTime();
    session.completionStatus = status;
    session.bypassReason = bypassReason;

    // Determine security compliance
    if (status === 'bypassed' && !bypassReason) {
      session.securityCompliance = false;
    } else if (status === 'failed') {
      session.securityCompliance = false;
    } else if (status === 'partial' && session.successfulVerifications < 2) {
      session.securityCompliance = false;
    }

    // Add completion learning objectives
    if (status === 'completed') {
      session.learningObjectivesAchieved.push('Successfully completed full customer verification process');
    } else if (status === 'partial') {
      session.learningObjectivesAchieved.push('Recognized need for additional verification measures');
    }

    this.verificationSessions.set(sessionId, session);

    logger.info('Verification session completed', {
      sessionId,
      status,
      duration: session.totalDuration,
      attempts: session.verificationAttempts,
      successRate: session.successfulVerifications / session.verificationAttempts,
      securityCompliance: session.securityCompliance,
    });

    // Update user performance cache
    await this.updateUserPerformance(session.userId, session);

    return session;
  }

  async getVerificationSession(sessionId: string): Promise<VerificationMetrics | undefined> {
    return this.verificationSessions.get(sessionId);
  }

  async getUserPerformance(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<VerificationPerformance | null> {
    const cached = this.performanceCache.get(`${userId}_${period}`);
    if (cached) {
      return cached;
    }

    // Calculate performance from completed sessions
    const userSessions = Array.from(this.verificationSessions.values())
      .filter(session => session.userId === userId && session.completionStatus !== 'partial');

    if (userSessions.length === 0) {
      return null;
    }

    const totalTime = userSessions.reduce((sum, session) => sum + (session.totalDuration || 0), 0);
    const completedSessions = userSessions.filter(s => s.completionStatus === 'completed');
    const compliantSessions = userSessions.filter(s => s.securityCompliance);

    const performance: VerificationPerformance = {
      userId,
      period,
      totalVerifications: userSessions.length,
      averageVerificationTime: totalTime / userSessions.length,
      successRate: completedSessions.length / userSessions.length,
      complianceRate: compliantSessions.length / userSessions.length,
      improvementAreas: [],
      strengths: [],
      recommendedTraining: [],
    };

    // Analyze performance and provide recommendations
    if (performance.averageVerificationTime > 300000) { // > 5 minutes
      performance.improvementAreas.push('Verification efficiency');
      performance.recommendedTraining.push('Speed verification techniques');
    }

    if (performance.successRate < 0.8) {
      performance.improvementAreas.push('Verification success rate');
      performance.recommendedTraining.push('Customer communication skills');
    }

    if (performance.complianceRate < 0.95) {
      performance.improvementAreas.push('Security compliance');
      performance.recommendedTraining.push('Security policy review');
    }

    if (performance.successRate >= 0.9) {
      performance.strengths.push('High verification success rate');
    }

    if (performance.averageVerificationTime < 180000) { // < 3 minutes
      performance.strengths.push('Efficient verification process');
    }

    this.performanceCache.set(`${userId}_${period}`, performance);
    return performance;
  }

  async getVerificationAnalytics(timeRange?: { start: Date; end: Date }): Promise<VerificationAnalytics> {
    let sessions = Array.from(this.verificationSessions.values());
    
    if (timeRange) {
      sessions = sessions.filter(session => 
        session.startTime >= timeRange.start && session.startTime <= timeRange.end
      );
    }

    const completedSessions = sessions.filter(s => s.endTime);
    const totalTime = completedSessions.reduce((sum, session) => sum + (session.totalDuration || 0), 0);
    const successfulSessions = sessions.filter(s => s.completionStatus === 'completed');
    const compliantSessions = sessions.filter(s => s.securityCompliance);

    // Calculate failure reasons
    const failureReasons: { [key: string]: number } = {};
    sessions.filter(s => s.completionStatus === 'failed').forEach(session => {
      const reason = session.verificationQuality === 'poor' ? 'Poor verification quality' :
                    session.customerCooperationLevel === 'low' ? 'Uncooperative customer' :
                    'Verification process incomplete';
      failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    });

    // Calculate method effectiveness
    const methodStats: { [key: string]: { attempts: number; successes: number } } = {};
    sessions.forEach(session => {
      session.verificationMethods.forEach(method => {
        if (!methodStats[method]) {
          methodStats[method] = { attempts: 0, successes: 0 };
        }
        methodStats[method].attempts++;
        if (session.completionStatus === 'completed') {
          methodStats[method].successes++;
        }
      });
    });

    const methodEffectiveness = Object.entries(methodStats).map(([method, stats]) => ({
      method,
      successRate: stats.successes / stats.attempts,
    }));

    // Calculate cooperation trends
    const cooperationCounts = sessions.reduce((acc, session) => {
      acc[session.customerCooperationLevel] = (acc[session.customerCooperationLevel] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const cooperationTrends = Object.entries(cooperationCounts).map(([level, count]) => ({
      level,
      percentage: (count / sessions.length) * 100,
    }));

    const analytics: VerificationAnalytics = {
      totalVerifications: sessions.length,
      averageCompletionTime: completedSessions.length > 0 ? totalTime / completedSessions.length : 0,
      successRate: sessions.length > 0 ? successfulSessions.length / sessions.length : 0,
      commonFailureReasons: Object.entries(failureReasons).map(([reason, count]) => ({ reason, count })),
      verificationMethodEffectiveness: methodEffectiveness,
      customerCooperationTrends: cooperationTrends,
      complianceScore: sessions.length > 0 ? (compliantSessions.length / sessions.length) * 100 : 0,
      performanceTrends: [], // Would be populated from historical data
    };

    logger.info('Verification analytics calculated', {
      timeRange,
      totalSessions: sessions.length,
      analytics,
    });

    return analytics;
  }

  private async updateUserPerformance(userId: string, _session: VerificationMetrics): Promise<void> {
    // This would typically update a persistent performance record
    // For now, we'll just invalidate the cache to force recalculation
    this.performanceCache.delete(`${userId}_daily`);
    this.performanceCache.delete(`${userId}_weekly`);
    this.performanceCache.delete(`${userId}_monthly`);
  }

  async getVerificationInsights(userId: string): Promise<{
    recentPerformance: any;
    improvementSuggestions: string[];
    learningProgress: string[];
  }> {
    const performance = await this.getUserPerformance(userId);
    const recentSessions = Array.from(this.verificationSessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10);

    const allLearningObjectives = recentSessions
      .flatMap(s => s.learningObjectivesAchieved)
      .filter((obj, index, arr) => arr.indexOf(obj) === index);

    const improvementSuggestions: string[] = [];
    
    if (performance) {
      if (performance.averageVerificationTime > 300000) {
        improvementSuggestions.push('Focus on asking verification questions more efficiently');
      }
      if (performance.successRate < 0.8) {
        improvementSuggestions.push('Practice different customer communication approaches');
      }
      if (performance.complianceRate < 0.95) {
        improvementSuggestions.push('Review security policy requirements more carefully');
      }
    }

    return {
      recentPerformance: performance,
      improvementSuggestions,
      learningProgress: allLearningObjectives,
    };
  }
}

export const verificationTracker = new VerificationTrackerService();
export default verificationTracker;