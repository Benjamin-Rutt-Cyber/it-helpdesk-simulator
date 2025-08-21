import { LevelService, LevelInfo } from './levelService';
import { AdvancementManager, AdvancementEvent } from './advancementManager';
import { MilestoneManager } from './milestoneManager';

export interface ProgressionMetrics {
  totalXP: number;
  levelInfo: LevelInfo;
  xpGainedToday: number;
  xpGainedThisWeek: number;
  xpGainedThisMonth: number;
  averageXPPerDay: number;
  projectedNextLevelDate: Date | null;
  progressionRate: 'slow' | 'steady' | 'fast' | 'exceptional';
}

export interface ProgressionAnalytics {
  userId: string;
  currentMetrics: ProgressionMetrics;
  historicalData: ProgressionHistoryPoint[];
  trends: ProgressionTrends;
  recommendations: ProgressionRecommendation[];
  sustainability: ProgressionSustainability;
}

export interface ProgressionHistoryPoint {
  date: Date;
  level: number;
  totalXP: number;
  xpGained: number;
  activities: ActivityBreakdown;
}

export interface ActivityBreakdown {
  ticketResolution: number;
  skillDemonstration: number;
  qualityBonus: number;
  milestoneBonus: number;
  otherActivities: number;
}

export interface ProgressionTrends {
  xpGrowthRate: number; // XP per day over last 30 days
  levelAdvancementRate: number; // Levels per month
  activityConsistency: number; // 0-1 score
  qualityTrend: 'improving' | 'stable' | 'declining';
  engagementLevel: 'low' | 'moderate' | 'high' | 'exceptional';
}

export interface ProgressionRecommendation {
  type: 'activity' | 'quality' | 'consistency' | 'milestone';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
}

export interface ProgressionSustainability {
  burnoutRisk: 'low' | 'medium' | 'high';
  paceRecommendation: 'maintain' | 'increase' | 'decrease';
  balanceScore: number; // 0-100
  sustainabilityFactors: {
    consistentActivity: boolean;
    qualityMaintenance: boolean;
    reasonablePace: boolean;
    skillDevelopment: boolean;
  };
}

export class ProgressionTracker {
  /**
   * Calculate comprehensive progression metrics
   */
  static async calculateProgressionMetrics(
    userId: string,
    totalXP: number,
    recentActivity: ProgressionHistoryPoint[]
  ): Promise<ProgressionMetrics> {
    const levelInfo = LevelService.calculateLevelInfo(totalXP);
    
    // Calculate recent XP gains
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const xpGainedToday = this.calculateXPInPeriod(recentActivity, oneDayAgo, now);
    const xpGainedThisWeek = this.calculateXPInPeriod(recentActivity, oneWeekAgo, now);
    const xpGainedThisMonth = this.calculateXPInPeriod(recentActivity, oneMonthAgo, now);

    // Calculate average XP per day over last 30 days
    const activeDays = this.getActiveDaysInPeriod(recentActivity, oneMonthAgo, now);
    const averageXPPerDay = activeDays > 0 ? xpGainedThisMonth / activeDays : 0;

    // Project next level date
    const projectedNextLevelDate = this.projectNextLevelDate(
      levelInfo.xpToNextLevel,
      averageXPPerDay
    );

    // Determine progression rate
    const progressionRate = this.determineProgressionRate(averageXPPerDay);

    return {
      totalXP,
      levelInfo,
      xpGainedToday,
      xpGainedThisWeek,
      xpGainedThisMonth,
      averageXPPerDay,
      projectedNextLevelDate,
      progressionRate
    };
  }

  /**
   * Generate comprehensive progression analytics
   */
  static async generateProgressionAnalytics(
    userId: string,
    totalXP: number,
    historicalData: ProgressionHistoryPoint[]
  ): Promise<ProgressionAnalytics> {
    const currentMetrics = await this.calculateProgressionMetrics(userId, totalXP, historicalData);
    const trends = this.analyzeTrends(historicalData);
    const recommendations = this.generateRecommendations(currentMetrics, trends, historicalData);
    const sustainability = this.assessSustainability(historicalData, trends);

    return {
      userId,
      currentMetrics,
      historicalData,
      trends,
      recommendations,
      sustainability
    };
  }

  /**
   * Calculate XP gained in a specific period
   */
  private static calculateXPInPeriod(
    history: ProgressionHistoryPoint[],
    startDate: Date,
    endDate: Date
  ): number {
    return history
      .filter(point => point.date >= startDate && point.date <= endDate)
      .reduce((total, point) => total + point.xpGained, 0);
  }

  /**
   * Get number of active days in period
   */
  private static getActiveDaysInPeriod(
    history: ProgressionHistoryPoint[],
    startDate: Date,
    endDate: Date
  ): number {
    const activeDates = new Set(
      history
        .filter(point => point.date >= startDate && point.date <= endDate && point.xpGained > 0)
        .map(point => point.date.toDateString())
    );
    return activeDates.size;
  }

  /**
   * Project when user will reach next level
   */
  private static projectNextLevelDate(xpNeeded: number, averageXPPerDay: number): Date | null {
    if (averageXPPerDay <= 0) return null;
    
    const daysNeeded = Math.ceil(xpNeeded / averageXPPerDay);
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysNeeded);
    
    return projectedDate;
  }

  /**
   * Determine progression rate category
   */
  private static determineProgressionRate(averageXPPerDay: number): 'slow' | 'steady' | 'fast' | 'exceptional' {
    if (averageXPPerDay >= 50) return 'exceptional';
    if (averageXPPerDay >= 25) return 'fast';
    if (averageXPPerDay >= 10) return 'steady';
    return 'slow';
  }

  /**
   * Analyze progression trends
   */
  private static analyzeTrends(historicalData: ProgressionHistoryPoint[]): ProgressionTrends {
    if (historicalData.length < 7) {
      // Not enough data for meaningful trends
      return {
        xpGrowthRate: 0,
        levelAdvancementRate: 0,
        activityConsistency: 0,
        qualityTrend: 'stable',
        engagementLevel: 'low'
      };
    }

    // Calculate XP growth rate (last 30 days)
    const last30Days = historicalData.slice(-30);
    const xpGrowthRate = last30Days.reduce((sum, point) => sum + point.xpGained, 0) / 30;

    // Calculate level advancement rate
    const levelChanges = this.calculateLevelChanges(historicalData);
    const levelAdvancementRate = levelChanges / (historicalData.length / 30); // levels per month

    // Calculate activity consistency
    const activityConsistency = this.calculateActivityConsistency(historicalData);

    // Analyze quality trend
    const qualityTrend = this.analyzeQualityTrend(historicalData);

    // Determine engagement level
    const engagementLevel = this.determineEngagementLevel(xpGrowthRate, activityConsistency);

    return {
      xpGrowthRate,
      levelAdvancementRate,
      activityConsistency,
      qualityTrend,
      engagementLevel
    };
  }

  /**
   * Calculate how many level changes occurred
   */
  private static calculateLevelChanges(historicalData: ProgressionHistoryPoint[]): number {
    let levelChanges = 0;
    for (let i = 1; i < historicalData.length; i++) {
      if (historicalData[i].level > historicalData[i-1].level) {
        levelChanges++;
      }
    }
    return levelChanges;
  }

  /**
   * Calculate activity consistency score
   */
  private static calculateActivityConsistency(historicalData: ProgressionHistoryPoint[]): number {
    if (historicalData.length < 7) return 0;

    const last30Days = historicalData.slice(-30);
    const activeDays = last30Days.filter(point => point.xpGained > 0).length;
    
    return Math.min(activeDays / 21, 1); // Aim for at least 21 active days out of 30
  }

  /**
   * Analyze quality trend based on activity breakdown
   */
  private static analyzeQualityTrend(historicalData: ProgressionHistoryPoint[]): 'improving' | 'stable' | 'declining' {
    if (historicalData.length < 14) return 'stable';

    const recentData = historicalData.slice(-7);
    const previousData = historicalData.slice(-14, -7);

    const recentQualityRatio = this.calculateQualityRatio(recentData);
    const previousQualityRatio = this.calculateQualityRatio(previousData);

    const change = recentQualityRatio - previousQualityRatio;

    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Calculate ratio of quality bonus XP to total XP
   */
  private static calculateQualityRatio(data: ProgressionHistoryPoint[]): number {
    const totalXP = data.reduce((sum, point) => sum + point.xpGained, 0);
    const qualityXP = data.reduce((sum, point) => sum + point.activities.qualityBonus, 0);
    
    return totalXP > 0 ? qualityXP / totalXP : 0;
  }

  /**
   * Determine engagement level
   */
  private static determineEngagementLevel(
    xpGrowthRate: number, 
    activityConsistency: number
  ): 'low' | 'moderate' | 'high' | 'exceptional' {
    const engagementScore = (xpGrowthRate / 50) * 0.6 + activityConsistency * 0.4;

    if (engagementScore >= 0.8) return 'exceptional';
    if (engagementScore >= 0.6) return 'high';
    if (engagementScore >= 0.3) return 'moderate';
    return 'low';
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(
    metrics: ProgressionMetrics,
    trends: ProgressionTrends,
    historicalData: ProgressionHistoryPoint[]
  ): ProgressionRecommendation[] {
    const recommendations: ProgressionRecommendation[] = [];

    // Activity recommendations
    if (trends.engagementLevel === 'low') {
      recommendations.push({
        type: 'activity',
        priority: 'high',
        title: 'Increase Activity Frequency',
        description: 'Your current activity level could be improved for better progression.',
        actionItems: [
          'Aim to complete at least 2-3 tickets per day',
          'Set aside dedicated time for skill practice',
          'Establish a consistent daily routine'
        ],
        expectedImpact: 'Could increase XP gain by 40-60% and improve progression rate'
      });
    }

    // Quality recommendations
    if (trends.qualityTrend === 'declining') {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Focus on Quality Improvement',
        description: 'Your quality metrics show room for improvement.',
        actionItems: [
          'Review best practices before starting tickets',
          'Take time to thoroughly document solutions',
          'Ask for feedback on completed work'
        ],
        expectedImpact: 'Better quality work leads to bonus XP and faster progression'
      });
    }

    // Consistency recommendations
    if (trends.activityConsistency < 0.6) {
      recommendations.push({
        type: 'consistency',
        priority: 'medium',
        title: 'Improve Activity Consistency',
        description: 'More consistent activity leads to better skill retention and progression.',
        actionItems: [
          'Set up a regular practice schedule',
          'Use reminders to maintain daily activity',
          'Track your daily progress'
        ],
        expectedImpact: 'Consistent activity improves skill retention and long-term growth'
      });
    }

    // Milestone recommendations
    const upcomingMilestones = MilestoneManager.getUpcomingMilestones(
      metrics.levelInfo.currentLevel,
      metrics.totalXP
    );
    
    if (upcomingMilestones.length > 0) {
      const nextMilestone = upcomingMilestones[0];
      recommendations.push({
        type: 'milestone',
        priority: 'medium',
        title: `Work Toward ${nextMilestone.title}`,
        description: `You're ${nextMilestone.xp - metrics.totalXP} XP away from achieving ${nextMilestone.title}.`,
        actionItems: [
          `Complete ${Math.ceil((nextMilestone.xp - metrics.totalXP) / 20)} more high-quality tickets`,
          'Focus on activities that provide bonus XP',
          'Maintain consistent daily progress'
        ],
        expectedImpact: 'Milestone achievements provide significant recognition and rewards'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Assess progression sustainability
   */
  private static assessSustainability(
    historicalData: ProgressionHistoryPoint[],
    trends: ProgressionTrends
  ): ProgressionSustainability {
    // Calculate burnout risk
    const recentIntensity = this.calculateRecentIntensity(historicalData);
    const burnoutRisk = this.assessBurnoutRisk(recentIntensity, trends.activityConsistency);

    // Determine pace recommendation
    const paceRecommendation = this.determinePaceRecommendation(burnoutRisk, trends.xpGrowthRate);

    // Calculate balance score
    const balanceScore = this.calculateBalanceScore(trends, historicalData);

    // Assess sustainability factors
    const sustainabilityFactors = {
      consistentActivity: trends.activityConsistency > 0.6,
      qualityMaintenance: trends.qualityTrend !== 'declining',
      reasonablePace: recentIntensity < 0.8,
      skillDevelopment: trends.levelAdvancementRate > 0
    };

    return {
      burnoutRisk,
      paceRecommendation,
      balanceScore,
      sustainabilityFactors
    };
  }

  /**
   * Calculate recent activity intensity
   */
  private static calculateRecentIntensity(historicalData: ProgressionHistoryPoint[]): number {
    const last7Days = historicalData.slice(-7);
    const activeDays = last7Days.filter(point => point.xpGained > 0).length;
    const averageXPPerActiveDay = last7Days.length > 0 
      ? last7Days.reduce((sum, point) => sum + point.xpGained, 0) / activeDays
      : 0;

    // Normalize intensity (0-1 scale)
    return Math.min((activeDays / 7) * (averageXPPerActiveDay / 60), 1);
  }

  /**
   * Assess burnout risk
   */
  private static assessBurnoutRisk(
    intensity: number, 
    consistency: number
  ): 'low' | 'medium' | 'high' {
    if (intensity > 0.8 && consistency < 0.4) return 'high';
    if (intensity > 0.6 || consistency < 0.3) return 'medium';
    return 'low';
  }

  /**
   * Determine pace recommendation
   */
  private static determinePaceRecommendation(
    burnoutRisk: 'low' | 'medium' | 'high',
    xpGrowthRate: number
  ): 'maintain' | 'increase' | 'decrease' {
    if (burnoutRisk === 'high') return 'decrease';
    if (burnoutRisk === 'low' && xpGrowthRate < 15) return 'increase';
    return 'maintain';
  }

  /**
   * Calculate overall balance score
   */
  private static calculateBalanceScore(
    trends: ProgressionTrends,
    historicalData: ProgressionHistoryPoint[]
  ): number {
    let score = 0;

    // Activity consistency (25%)
    score += trends.activityConsistency * 25;

    // Quality maintenance (25%)
    score += (trends.qualityTrend === 'improving' ? 25 : trends.qualityTrend === 'stable' ? 20 : 10);

    // Sustainable pace (25%)
    const intensity = this.calculateRecentIntensity(historicalData);
    score += (intensity > 0.3 && intensity < 0.7) ? 25 : 15;

    // Engagement level (25%)
    const engagementScore = trends.engagementLevel === 'exceptional' ? 25 
      : trends.engagementLevel === 'high' ? 20
      : trends.engagementLevel === 'moderate' ? 15 : 5;
    score += engagementScore;

    return Math.round(score);
  }
}