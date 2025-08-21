/**
 * XP Service - Main XP calculation and management
 * Orchestrates XP calculation, tracking, and distribution
 */

import xpCalculatorService, { ActivityData, XPCalculationResult, PerformanceMetrics } from './xpCalculator';

export interface XPRecord {
  id: string;
  userId: string;
  activityId: string;
  activityType: ActivityData['type'];
  scenarioDifficulty: ActivityData['scenarioDifficulty'];
  xpAwarded: number;
  breakdown: XPCalculationResult;
  timestamp: Date;
  performanceMetrics: PerformanceMetrics;
  validated: boolean;
}

export interface UserXPSummary {
  userId: string;
  totalXP: number;
  lifetimeXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  recentXP: XPRecord[];
  topActivities: ActivityXPSummary[];
  performanceTrends: PerformanceTrend[];
  achievements: string[];
}

export interface ActivityXPSummary {
  activityType: string;
  totalXP: number;
  averageXP: number;
  count: number;
  bestPerformance: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PerformanceTrend {
  metric: string;
  current: number;
  trend: number; // percentage change
  period: string;
}

export interface XPTransaction {
  userId: string;
  activityData: ActivityData;
  activityId: string;
  context?: Record<string, any>;
}

class XPService {
  private xpRecords: Map<string, XPRecord[]> = new Map(); // userId -> XPRecord[]
  private userTotals: Map<string, number> = new Map(); // userId -> totalXP

  /**
   * Award XP for completed activity
   */
  async awardXP(transaction: XPTransaction): Promise<XPRecord> {
    // Validate activity data
    const validation = await xpCalculatorService.validateActivityData(transaction.activityData);
    if (!validation.valid) {
      throw new Error(`Invalid activity data: ${validation.errors.join(', ')}`);
    }

    // Calculate XP
    const calculation = await xpCalculatorService.calculateXP(transaction.activityData);

    // Create XP record
    const xpRecord: XPRecord = {
      id: this.generateXPRecordId(),
      userId: transaction.userId,
      activityId: transaction.activityId,
      activityType: transaction.activityData.type,
      scenarioDifficulty: transaction.activityData.scenarioDifficulty,
      xpAwarded: calculation.totalXP,
      breakdown: calculation,
      timestamp: new Date(),
      performanceMetrics: transaction.activityData.performanceMetrics,
      validated: true
    };

    // Store XP record
    await this.storeXPRecord(xpRecord);

    // Update user totals
    await this.updateUserTotals(transaction.userId, calculation.totalXP);

    // Trigger real-time updates
    await this.triggerXPUpdate(xpRecord);

    return xpRecord;
  }

  /**
   * Get current XP total for user
   */
  async getCurrentXP(userId: string): Promise<number> {
    return this.userTotals.get(userId) || 0;
  }

  /**
   * Get comprehensive XP summary for user
   */
  async getUserXPSummary(userId: string): Promise<UserXPSummary> {
    const userRecords = this.xpRecords.get(userId) || [];
    const totalXP = this.userTotals.get(userId) || 0;

    // Calculate level (every 1000 XP = 1 level)
    const currentLevel = Math.floor(totalXP / 1000);
    const xpToNextLevel = 1000 - (totalXP % 1000);

    // Get recent XP (last 10 records)
    const recentXP = userRecords
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    // Calculate activity summaries
    const topActivities = await this.calculateActivitySummaries(userRecords);

    // Calculate performance trends
    const performanceTrends = await this.calculatePerformanceTrends(userRecords);

    // Get achievements (placeholder for now)
    const achievements: string[] = [];

    return {
      userId,
      totalXP,
      lifetimeXP: totalXP, // For now, same as total
      currentLevel,
      xpToNextLevel,
      recentXP,
      topActivities,
      performanceTrends,
      achievements
    };
  }

  /**
   * Get XP breakdown for specific activity
   */
  async getXPBreakdown(xpRecordId: string): Promise<XPCalculationResult | null> {
    // Find XP record across all users
    for (const userRecords of this.xpRecords.values()) {
      const record = userRecords.find(r => r.id === xpRecordId);
      if (record) {
        return record.breakdown;
      }
    }
    return null;
  }

  /**
   * Get XP history for user
   */
  async getXPHistory(userId: string, limit: number = 50, offset: number = 0): Promise<XPRecord[]> {
    const userRecords = this.xpRecords.get(userId) || [];
    return userRecords
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Calculate potential XP for activity (preview)
   */
  async calculatePotentialXP(activityData: ActivityData): Promise<XPCalculationResult> {
    return await xpCalculatorService.calculateXP(activityData);
  }

  /**
   * Get XP leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<Array<{ userId: string; totalXP: number; level: number }>> {
    const leaderboard = Array.from(this.userTotals.entries())
      .map(([userId, totalXP]) => ({
        userId,
        totalXP,
        level: Math.floor(totalXP / 1000)
      }))
      .sort((a, b) => b.totalXP - a.totalXP)
      .slice(0, limit);

    return leaderboard;
  }

  /**
   * Get XP statistics
   */
  async getXPStatistics(): Promise<{
    totalUsersWithXP: number;
    totalXPAwarded: number;
    averageXPPerUser: number;
    topActivity: string;
    totalActivities: number;
  }> {
    const totalUsers = this.userTotals.size;
    const totalXPAwarded = Array.from(this.userTotals.values()).reduce((sum, xp) => sum + xp, 0);
    const averageXPPerUser = totalUsers > 0 ? Math.round(totalXPAwarded / totalUsers) : 0;

    // Calculate activity statistics
    const activityCounts: Record<string, number> = {};
    let totalActivities = 0;

    for (const userRecords of this.xpRecords.values()) {
      for (const record of userRecords) {
        activityCounts[record.activityType] = (activityCounts[record.activityType] || 0) + 1;
        totalActivities++;
      }
    }

    const topActivity = Object.entries(activityCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    return {
      totalUsersWithXP: totalUsers,
      totalXPAwarded,
      averageXPPerUser,
      topActivity,
      totalActivities
    };
  }

  /**
   * Validate XP transaction before processing
   */
  async validateXPTransaction(transaction: XPTransaction): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for duplicate activity
    const userRecords = this.xpRecords.get(transaction.userId) || [];
    const existingRecord = userRecords.find(r => r.activityId === transaction.activityId);
    if (existingRecord) {
      errors.push(`XP already awarded for activity: ${transaction.activityId}`);
    }

    // Validate activity data
    const activityValidation = await xpCalculatorService.validateActivityData(transaction.activityData);
    if (!activityValidation.valid) {
      errors.push(...activityValidation.errors);
    }

    // Check for suspicious patterns (anti-gaming measures)
    const recentRecords = userRecords
      .filter(r => Date.now() - r.timestamp.getTime() < 60000) // Last minute
      .length;

    if (recentRecords > 5) {
      errors.push('Too many XP transactions in short period - possible gaming attempt');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Recalculate XP for user (admin function)
   */
  async recalculateUserXP(userId: string): Promise<UserXPSummary> {
    const userRecords = this.xpRecords.get(userId) || [];
    let totalXP = 0;

    // Recalculate each record
    for (const record of userRecords) {
      const activityData: ActivityData = {
        type: record.activityType,
        scenarioDifficulty: record.scenarioDifficulty,
        performanceMetrics: record.performanceMetrics
      };

      const calculation = await xpCalculatorService.calculateXP(activityData);
      record.xpAwarded = calculation.totalXP;
      record.breakdown = calculation;
      totalXP += calculation.totalXP;
    }

    // Update user total
    this.userTotals.set(userId, totalXP);

    return await this.getUserXPSummary(userId);
  }

  /**
   * Store XP record
   */
  private async storeXPRecord(record: XPRecord): Promise<void> {
    const userRecords = this.xpRecords.get(record.userId) || [];
    userRecords.push(record);
    this.xpRecords.set(record.userId, userRecords);
  }

  /**
   * Update user XP totals
   */
  private async updateUserTotals(userId: string, xpAmount: number): Promise<void> {
    const currentTotal = this.userTotals.get(userId) || 0;
    this.userTotals.set(userId, currentTotal + xpAmount);
  }

  /**
   * Trigger real-time XP updates
   */
  private async triggerXPUpdate(record: XPRecord): Promise<void> {
    // In a real implementation, this would use WebSocket/Socket.IO
    // to send real-time updates to the user's connected clients
    console.log(`XP Update for ${record.userId}: +${record.xpAwarded} XP`);
  }

  /**
   * Generate unique XP record ID
   */
  private generateXPRecordId(): string {
    return `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate activity summaries
   */
  private async calculateActivitySummaries(records: XPRecord[]): Promise<ActivityXPSummary[]> {
    const activityMap: Record<string, { totalXP: number; count: number; xpValues: number[] }> = {};

    // Group by activity type
    for (const record of records) {
      if (!activityMap[record.activityType]) {
        activityMap[record.activityType] = {
          totalXP: 0,
          count: 0,
          xpValues: []
        };
      }

      activityMap[record.activityType].totalXP += record.xpAwarded;
      activityMap[record.activityType].count += 1;
      activityMap[record.activityType].xpValues.push(record.xpAwarded);
    }

    // Calculate summaries
    const summaries: ActivityXPSummary[] = [];
    for (const [activityType, data] of Object.entries(activityMap)) {
      const averageXP = Math.round(data.totalXP / data.count);
      const bestPerformance = Math.max(...data.xpValues);
      
      // Calculate trend (simple: compare first half vs second half)
      const halfPoint = Math.floor(data.xpValues.length / 2);
      const firstHalf = data.xpValues.slice(0, halfPoint);
      const secondHalf = data.xpValues.slice(halfPoint);
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstAvg = firstHalf.reduce((sum, xp) => sum + xp, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, xp) => sum + xp, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg * 1.1) trend = 'increasing';
        else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';
      }

      summaries.push({
        activityType,
        totalXP: data.totalXP,
        averageXP,
        count: data.count,
        bestPerformance,
        trend
      });
    }

    return summaries.sort((a, b) => b.totalXP - a.totalXP);
  }

  /**
   * Calculate performance trends
   */
  private async calculatePerformanceTrends(records: XPRecord[]): Promise<PerformanceTrend[]> {
    if (records.length < 10) return []; // Need sufficient data

    const recentRecords = records.slice(-10); // Last 10 records
    const olderRecords = records.slice(-20, -10); // Previous 10 records

    const trends: PerformanceTrend[] = [];

    // Calculate trends for each metric
    const metrics = ['technicalAccuracy', 'communicationQuality', 'customerSatisfaction', 'processCompliance'] as const;

    for (const metric of metrics) {
      const recentAvg = recentRecords.reduce((sum, r) => sum + r.performanceMetrics[metric], 0) / recentRecords.length;
      const olderAvg = olderRecords.length > 0 
        ? olderRecords.reduce((sum, r) => sum + r.performanceMetrics[metric], 0) / olderRecords.length
        : recentAvg;

      const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

      trends.push({
        metric: metric.replace(/([A-Z])/g, ' $1').toLowerCase().trim(),
        current: Math.round(recentAvg),
        trend: Math.round(trendPercentage * 10) / 10,
        period: 'last 10 activities'
      });
    }

    return trends;
  }

  /**
   * Get user activity insights
   */
  async getUserActivityInsights(userId: string): Promise<{
    strengthAreas: string[];
    improvementAreas: string[];
    recommendations: string[];
    nextMilestones: string[];
  }> {
    const userRecords = this.xpRecords.get(userId) || [];
    if (userRecords.length === 0) {
      return {
        strengthAreas: [],
        improvementAreas: [],
        recommendations: ['Complete your first activity to start earning XP!'],
        nextMilestones: ['Earn your first 100 XP', 'Complete 5 activities', 'Achieve 80% average performance']
      };
    }

    const recentRecords = userRecords.slice(-10);
    const avgMetrics = this.calculateAverageMetrics(recentRecords);

    const strengthAreas: string[] = [];
    const improvementAreas: string[] = [];
    const recommendations: string[] = [];

    // Analyze performance metrics
    if (avgMetrics.technicalAccuracy >= 85) strengthAreas.push('Technical Accuracy');
    else if (avgMetrics.technicalAccuracy < 70) improvementAreas.push('Technical Accuracy');

    if (avgMetrics.communicationQuality >= 85) strengthAreas.push('Communication Quality');
    else if (avgMetrics.communicationQuality < 70) improvementAreas.push('Communication Quality');

    if (avgMetrics.customerSatisfaction >= 85) strengthAreas.push('Customer Satisfaction');
    else if (avgMetrics.customerSatisfaction < 70) improvementAreas.push('Customer Satisfaction');

    if (avgMetrics.processCompliance >= 85) strengthAreas.push('Process Compliance');
    else if (avgMetrics.processCompliance < 70) improvementAreas.push('Process Compliance');

    // Generate recommendations
    if (improvementAreas.includes('Technical Accuracy')) {
      recommendations.push('Focus on double-checking technical solutions before implementation');
    }
    if (improvementAreas.includes('Communication Quality')) {
      recommendations.push('Practice clear, professional communication with customers');
    }
    if (improvementAreas.includes('Customer Satisfaction')) {
      recommendations.push('Pay attention to customer needs and provide thorough explanations');
    }

    // Calculate next milestones
    const totalXP = this.userTotals.get(userId) || 0;
    const nextMilestones: string[] = [];
    
    if (totalXP < 100) nextMilestones.push('Earn your first 100 XP');
    else if (totalXP < 500) nextMilestones.push('Reach 500 XP milestone');
    else if (totalXP < 1000) nextMilestones.push('Achieve Level 1 (1000 XP)');
    else nextMilestones.push(`Reach Level ${Math.floor(totalXP / 1000) + 1} (${(Math.floor(totalXP / 1000) + 1) * 1000} XP)`);

    if (userRecords.length < 5) nextMilestones.push('Complete 5 activities');
    else if (userRecords.length < 25) nextMilestones.push('Complete 25 activities');

    return {
      strengthAreas,
      improvementAreas,
      recommendations,
      nextMilestones
    };
  }

  /**
   * Calculate average metrics from records
   */
  private calculateAverageMetrics(records: XPRecord[]): PerformanceMetrics {
    if (records.length === 0) {
      return {
        technicalAccuracy: 0,
        communicationQuality: 0,
        verificationSuccess: false,
        customerSatisfaction: 0,
        processCompliance: 0,
        resolutionTime: 0,
        firstTimeResolution: false,
        knowledgeSharing: false
      };
    }

    const totals = records.reduce((acc, record) => {
      const metrics = record.performanceMetrics;
      return {
        technicalAccuracy: acc.technicalAccuracy + metrics.technicalAccuracy,
        communicationQuality: acc.communicationQuality + metrics.communicationQuality,
        customerSatisfaction: acc.customerSatisfaction + metrics.customerSatisfaction,
        processCompliance: acc.processCompliance + metrics.processCompliance,
        resolutionTime: acc.resolutionTime + metrics.resolutionTime,
        verificationSuccessCount: acc.verificationSuccessCount + (metrics.verificationSuccess ? 1 : 0),
        firstTimeResolutionCount: acc.firstTimeResolutionCount + (metrics.firstTimeResolution ? 1 : 0),
        knowledgeSharingCount: acc.knowledgeSharingCount + (metrics.knowledgeSharing ? 1 : 0)
      };
    }, {
      technicalAccuracy: 0,
      communicationQuality: 0,
      customerSatisfaction: 0,
      processCompliance: 0,
      resolutionTime: 0,
      verificationSuccessCount: 0,
      firstTimeResolutionCount: 0,
      knowledgeSharingCount: 0
    });

    return {
      technicalAccuracy: Math.round(totals.technicalAccuracy / records.length),
      communicationQuality: Math.round(totals.communicationQuality / records.length),
      verificationSuccess: totals.verificationSuccessCount > records.length / 2,
      customerSatisfaction: Math.round(totals.customerSatisfaction / records.length),
      processCompliance: Math.round(totals.processCompliance / records.length),
      resolutionTime: Math.round(totals.resolutionTime / records.length),
      firstTimeResolution: totals.firstTimeResolutionCount > records.length / 2,
      knowledgeSharing: totals.knowledgeSharingCount > records.length / 2
    };
  }
}

export const xpService = new XPService();
export default xpService;