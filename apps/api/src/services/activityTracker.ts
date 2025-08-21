/**
 * Activity Tracker Service
 * Comprehensive tracking of all XP-earning activities with detailed analytics
 */

import { PerformanceMetrics, ActivityData } from './xpCalculator';

export interface TrackedActivity {
  id: string;
  userId: string;
  sessionId: string;
  activityType: ActivityData['type'];
  scenarioDifficulty: ActivityData['scenarioDifficulty'];
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  performanceMetrics: PerformanceMetrics;
  xpAwarded: number;
  xpBreakdown: XPBreakdownSummary;
  context: ActivityContext;
  status: 'started' | 'completed' | 'abandoned' | 'failed';
  tags: string[];
  metadata: Record<string, any>;
}

export interface XPBreakdownSummary {
  baseXP: number;
  difficultyMultiplier: number;
  performanceMultiplier: number;
  bonusXP: number;
  totalXP: number;
  bonusesEarned: string[];
}

export interface ActivityContext {
  scenarioId?: string;
  ticketId?: string;
  customerPersona?: string;
  technicalCategory?: string;
  businessImpact?: string;
  mentorPresent?: boolean;
  assistanceUsed?: string[];
  knowledgeBaseUsed?: boolean;
}

export interface ActivitySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  activitiesCompleted: number;
  totalXPEarned: number;
  averagePerformance: number;
  sessionType: 'practice' | 'assessment' | 'guided' | 'free_play';
  activities: TrackedActivity[];
  sessionGoals?: string[];
  goalsAchieved?: string[];
}

export interface ActivityAnalytics {
  userId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  totalActivities: number;
  totalXP: number;
  averageXPPerActivity: number;
  averagePerformance: number;
  timeSpent: number; // total milliseconds
  averageActivityDuration: number;
  activityBreakdown: ActivityTypeBreakdown[];
  performanceTrends: PerformanceTrend[];
  xpTrends: XPTrend[];
  streakAnalysis: StreakAnalysis;
  insights: ActivityInsight[];
}

export interface ActivityTypeBreakdown {
  activityType: string;
  count: number;
  totalXP: number;
  averageXP: number;
  averagePerformance: number;
  averageDuration: number;
  improvementTrend: number; // percentage change
}

export interface PerformanceTrend {
  metric: string;
  values: { date: Date; value: number }[];
  trend: 'improving' | 'declining' | 'stable';
  changeRate: number; // percentage per day
}

export interface XPTrend {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  values: { date: Date; xp: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  projectedNext: number;
}

export interface StreakAnalysis {
  currentStreaks: {
    completion: number;
    quality: number;
    perfect: number;
  };
  longestStreaks: {
    completion: number;
    quality: number;
    perfect: number;
  };
  streakHistory: StreakHistoryEntry[];
}

export interface StreakHistoryEntry {
  date: Date;
  streakType: 'completion' | 'quality' | 'perfect';
  streakLength: number;
  broken: boolean;
}

export interface ActivityInsight {
  type: 'strength' | 'improvement' | 'opportunity' | 'warning';
  title: string;
  description: string;
  data: Record<string, any>;
  actionable: boolean;
  recommendation?: string;
}

export interface ActivityComparison {
  userId: string;
  compareToAverage: boolean;
  metrics: {
    xpPerHour: { user: number; average: number; percentile: number };
    averagePerformance: { user: number; average: number; percentile: number };
    activitiesPerSession: { user: number; average: number; percentile: number };
    streakLength: { user: number; average: number; percentile: number };
  };
  ranking: {
    overall: number;
    thisWeek: number;
    thisMonth: number;
  };
}

class ActivityTrackerService {
  private activities: Map<string, TrackedActivity[]> = new Map(); // userId -> activities
  private sessions: Map<string, ActivitySession[]> = new Map(); // userId -> sessions
  private currentSessions: Map<string, ActivitySession> = new Map(); // userId -> current session

  /**
   * Start tracking an activity
   */
  async startActivity(
    userId: string,
    activityType: ActivityData['type'],
    context: ActivityContext = {}
  ): Promise<TrackedActivity> {
    const activity: TrackedActivity = {
      id: this.generateActivityId(),
      userId,
      sessionId: this.getOrCreateSession(userId).id,
      activityType,
      scenarioDifficulty: 'intermediate', // Default, can be updated
      startTime: new Date(),
      performanceMetrics: this.getDefaultMetrics(),
      xpAwarded: 0,
      xpBreakdown: this.getDefaultBreakdown(),
      context,
      status: 'started',
      tags: [],
      metadata: {}
    };

    // Add to user activities
    const userActivities = this.activities.get(userId) || [];
    userActivities.push(activity);
    this.activities.set(userId, userActivities);

    return activity;
  }

  /**
   * Complete an activity
   */
  async completeActivity(
    activityId: string,
    performanceMetrics: PerformanceMetrics,
    xpAwarded: number,
    xpBreakdown: XPBreakdownSummary,
    scenarioDifficulty?: ActivityData['scenarioDifficulty']
  ): Promise<TrackedActivity> {
    const activity = await this.findActivity(activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - activity.startTime.getTime();

    // Update activity
    activity.endTime = endTime;
    activity.duration = duration;
    activity.performanceMetrics = performanceMetrics;
    activity.xpAwarded = xpAwarded;
    activity.xpBreakdown = xpBreakdown;
    activity.status = 'completed';
    
    if (scenarioDifficulty) {
      activity.scenarioDifficulty = scenarioDifficulty;
    }

    // Update session
    await this.updateSessionProgress(activity.userId, activity);

    return activity;
  }

  /**
   * Get user activity analytics
   */
  async getActivityAnalytics(
    userId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ActivityAnalytics> {
    const userActivities = this.activities.get(userId) || [];
    
    // Filter by time range if provided
    const filteredActivities = timeRange 
      ? userActivities.filter(a => 
          a.startTime >= timeRange.start && 
          a.startTime <= timeRange.end
        )
      : userActivities;

    const completedActivities = filteredActivities.filter(a => a.status === 'completed');

    if (completedActivities.length === 0) {
      return this.getEmptyAnalytics(userId, timeRange);
    }

    // Calculate basic metrics
    const totalActivities = completedActivities.length;
    const totalXP = completedActivities.reduce((sum, a) => sum + a.xpAwarded, 0);
    const averageXPPerActivity = Math.round(totalXP / totalActivities);
    
    const totalPerformance = completedActivities.reduce((sum, a) => 
      sum + this.calculateOverallPerformance(a.performanceMetrics), 0
    );
    const averagePerformance = Math.round(totalPerformance / totalActivities);

    const totalDuration = completedActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const averageActivityDuration = Math.round(totalDuration / totalActivities);

    // Calculate breakdowns and trends
    const activityBreakdown = await this.calculateActivityBreakdown(completedActivities);
    const performanceTrends = await this.calculatePerformanceTrends(completedActivities);
    const xpTrends = await this.calculateXPTrends(completedActivities);
    const streakAnalysis = await this.calculateStreakAnalysis(userId);
    const insights = await this.generateInsights(completedActivities, userId);

    return {
      userId,
      timeRange: timeRange || {
        start: completedActivities[0].startTime,
        end: completedActivities[completedActivities.length - 1].startTime
      },
      totalActivities,
      totalXP,
      averageXPPerActivity,
      averagePerformance,
      timeSpent: totalDuration,
      averageActivityDuration,
      activityBreakdown,
      performanceTrends,
      xpTrends,
      streakAnalysis,
      insights
    };
  }

  /**
   * Get activity history
   */
  async getActivityHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    activityType?: ActivityData['type']
  ): Promise<TrackedActivity[]> {
    const userActivities = this.activities.get(userId) || [];
    
    let filteredActivities = userActivities;
    if (activityType) {
      filteredActivities = userActivities.filter(a => a.activityType === activityType);
    }

    return filteredActivities
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(userId: string): Promise<{
    totalSessions: number;
    averageSessionDuration: number;
    averageActivitiesPerSession: number;
    averageXPPerSession: number;
    recentSessions: ActivitySession[];
    sessionTrends: { date: Date; duration: number; xp: number; activities: number }[];
  }> {
    const userSessions = this.sessions.get(userId) || [];
    const completedSessions = userSessions.filter(s => s.endTime);

    if (completedSessions.length === 0) {
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        averageActivitiesPerSession: 0,
        averageXPPerSession: 0,
        recentSessions: [],
        sessionTrends: []
      };
    }

    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
    const totalActivities = completedSessions.reduce((sum, s) => sum + s.activitiesCompleted, 0);
    const totalXP = completedSessions.reduce((sum, s) => sum + s.totalXPEarned, 0);

    const sessionTrends = completedSessions.slice(-30).map(session => ({
      date: session.startTime,
      duration: session.totalDuration || 0,
      xp: session.totalXPEarned,
      activities: session.activitiesCompleted
    }));

    return {
      totalSessions: completedSessions.length,
      averageSessionDuration: Math.round(totalDuration / completedSessions.length),
      averageActivitiesPerSession: Math.round(totalActivities / completedSessions.length),
      averageXPPerSession: Math.round(totalXP / completedSessions.length),
      recentSessions: completedSessions.slice(-10),
      sessionTrends
    };
  }

  /**
   * Compare user performance to others
   */
  async compareUserPerformance(userId: string): Promise<ActivityComparison> {
    const userAnalytics = await this.getActivityAnalytics(userId);
    const allUserAnalytics = await this.getAllUserAnalytics();

    // Calculate user metrics
    const timeSpentHours = userAnalytics.timeSpent / (1000 * 60 * 60);
    const userXPPerHour = timeSpentHours > 0 ? userAnalytics.totalXP / timeSpentHours : 0;

    // Calculate averages
    const avgXPPerHour = this.calculateAverage(allUserAnalytics.map(a => {
      const hours = a.timeSpent / (1000 * 60 * 60);
      return hours > 0 ? a.totalXP / hours : 0;
    }));

    const avgPerformance = this.calculateAverage(allUserAnalytics.map(a => a.averagePerformance));

    // Calculate session metrics
    const userSessionAnalytics = await this.getSessionAnalytics(userId);
    const avgActivitiesPerSession = this.calculateAverage(
      Array.from(this.sessions.values())
        .flat()
        .filter(s => s.endTime)
        .map(s => s.activitiesCompleted)
    );

    // Calculate current streak
    const streakAnalysis = await this.calculateStreakAnalysis(userId);
    const userStreakLength = Math.max(
      streakAnalysis.currentStreaks.completion,
      streakAnalysis.currentStreaks.quality
    );

    const avgStreakLength = this.calculateAverage(
      await Promise.all(
        Array.from(this.activities.keys()).map(async uid => {
          const streak = await this.calculateStreakAnalysis(uid);
          return Math.max(streak.currentStreaks.completion, streak.currentStreaks.quality);
        })
      )
    );

    return {
      userId,
      compareToAverage: true,
      metrics: {
        xpPerHour: {
          user: Math.round(userXPPerHour),
          average: Math.round(avgXPPerHour),
          percentile: this.calculatePercentile(userXPPerHour, allUserAnalytics.map(a => {
            const hours = a.timeSpent / (1000 * 60 * 60);
            return hours > 0 ? a.totalXP / hours : 0;
          }))
        },
        averagePerformance: {
          user: userAnalytics.averagePerformance,
          average: Math.round(avgPerformance),
          percentile: this.calculatePercentile(userAnalytics.averagePerformance, allUserAnalytics.map(a => a.averagePerformance))
        },
        activitiesPerSession: {
          user: userSessionAnalytics.averageActivitiesPerSession,
          average: Math.round(avgActivitiesPerSession),
          percentile: this.calculatePercentile(userSessionAnalytics.averageActivitiesPerSession, 
            Array.from(this.sessions.values()).flat().filter(s => s.endTime).map(s => s.activitiesCompleted))
        },
        streakLength: {
          user: userStreakLength,
          average: Math.round(avgStreakLength),
          percentile: this.calculatePercentile(userStreakLength, 
            await Promise.all(Array.from(this.activities.keys()).map(async uid => {
              const streak = await this.calculateStreakAnalysis(uid);
              return Math.max(streak.currentStreaks.completion, streak.currentStreaks.quality);
            })))
        }
      },
      ranking: {
        overall: this.calculateRanking(userId, 'overall'),
        thisWeek: this.calculateRanking(userId, 'week'),
        thisMonth: this.calculateRanking(userId, 'month')
      }
    };
  }

  /**
   * Get or create current session for user
   */
  private getOrCreateSession(userId: string): ActivitySession {
    let currentSession = this.currentSessions.get(userId);
    
    if (!currentSession || this.isSessionExpired(currentSession)) {
      currentSession = {
        id: this.generateSessionId(),
        userId,
        startTime: new Date(),
        activitiesCompleted: 0,
        totalXPEarned: 0,
        averagePerformance: 0,
        sessionType: 'practice',
        activities: []
      };
      
      this.currentSessions.set(userId, currentSession);
    }

    return currentSession;
  }

  /**
   * Update session progress
   */
  private async updateSessionProgress(userId: string, activity: TrackedActivity): Promise<void> {
    const session = this.currentSessions.get(userId);
    if (!session) return;

    session.activitiesCompleted += 1;
    session.totalXPEarned += activity.xpAwarded;
    session.activities.push(activity);

    // Calculate average performance
    const totalPerformance = session.activities.reduce((sum, a) => 
      sum + this.calculateOverallPerformance(a.performanceMetrics), 0
    );
    session.averagePerformance = Math.round(totalPerformance / session.activities.length);

    // Check if session should be ended (after 30 minutes of inactivity)
    if (this.shouldEndSession(session)) {
      await this.endSession(userId);
    }
  }

  /**
   * End current session
   */
  private async endSession(userId: string): Promise<void> {
    const session = this.currentSessions.get(userId);
    if (!session) return;

    session.endTime = new Date();
    session.totalDuration = session.endTime.getTime() - session.startTime.getTime();

    // Store completed session
    const userSessions = this.sessions.get(userId) || [];
    userSessions.push(session);
    this.sessions.set(userId, userSessions);

    // Remove from current sessions
    this.currentSessions.delete(userId);
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: ActivitySession): boolean {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return session.startTime < thirtyMinutesAgo;
  }

  /**
   * Check if session should be ended
   */
  private shouldEndSession(session: ActivitySession): boolean {
    // End session after 2 hours or 20 activities
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return session.startTime < twoHoursAgo || session.activitiesCompleted >= 20;
  }

  /**
   * Find activity by ID
   */
  private async findActivity(activityId: string): Promise<TrackedActivity | null> {
    for (const userActivities of this.activities.values()) {
      const activity = userActivities.find(a => a.id === activityId);
      if (activity) return activity;
    }
    return null;
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallPerformance(metrics: PerformanceMetrics): number {
    const weights = {
      technicalAccuracy: 0.3,
      communicationQuality: 0.25,
      customerSatisfaction: 0.25,
      processCompliance: 0.2
    };

    return Math.round(
      metrics.technicalAccuracy * weights.technicalAccuracy +
      metrics.communicationQuality * weights.communicationQuality +
      metrics.customerSatisfaction * weights.customerSatisfaction +
      metrics.processCompliance * weights.processCompliance
    );
  }

  /**
   * Calculate activity type breakdown
   */
  private async calculateActivityBreakdown(activities: TrackedActivity[]): Promise<ActivityTypeBreakdown[]> {
    const breakdown: Record<string, {
      count: number;
      totalXP: number;
      totalPerformance: number;
      totalDuration: number;
      performances: number[];
    }> = {};

    // Group activities by type
    for (const activity of activities) {
      if (!breakdown[activity.activityType]) {
        breakdown[activity.activityType] = {
          count: 0,
          totalXP: 0,
          totalPerformance: 0,
          totalDuration: 0,
          performances: []
        };
      }

      const performance = this.calculateOverallPerformance(activity.performanceMetrics);
      breakdown[activity.activityType].count += 1;
      breakdown[activity.activityType].totalXP += activity.xpAwarded;
      breakdown[activity.activityType].totalPerformance += performance;
      breakdown[activity.activityType].totalDuration += activity.duration || 0;
      breakdown[activity.activityType].performances.push(performance);
    }

    // Convert to breakdown array
    return Object.entries(breakdown).map(([activityType, data]) => {
      // Calculate improvement trend (simple: compare first half vs second half)
      const halfPoint = Math.floor(data.performances.length / 2);
      const firstHalf = data.performances.slice(0, halfPoint);
      const secondHalf = data.performances.slice(halfPoint);
      
      let improvementTrend = 0;
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstAvg = firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length;
        improvementTrend = ((secondAvg - firstAvg) / firstAvg) * 100;
      }

      return {
        activityType,
        count: data.count,
        totalXP: data.totalXP,
        averageXP: Math.round(data.totalXP / data.count),
        averagePerformance: Math.round(data.totalPerformance / data.count),
        averageDuration: Math.round(data.totalDuration / data.count),
        improvementTrend: Math.round(improvementTrend * 10) / 10
      };
    }).sort((a, b) => b.totalXP - a.totalXP);
  }

  /**
   * Calculate performance trends
   */
  private async calculatePerformanceTrends(activities: TrackedActivity[]): Promise<PerformanceTrend[]> {
    if (activities.length < 5) return [];

    const metrics = ['technicalAccuracy', 'communicationQuality', 'customerSatisfaction', 'processCompliance'] as const;
    const trends: PerformanceTrend[] = [];

    for (const metric of metrics) {
      const values = activities.map(a => ({
        date: a.startTime,
        value: a.performanceMetrics[metric]
      }));

      const trend = this.calculateTrendDirection(values.map(v => v.value));
      const changeRate = this.calculateChangeRate(values);

      trends.push({
        metric: metric.replace(/([A-Z])/g, ' $1').toLowerCase().trim(),
        values,
        trend,
        changeRate
      });
    }

    return trends;
  }

  /**
   * Calculate XP trends
   */
  private async calculateXPTrends(activities: TrackedActivity[]): Promise<XPTrend[]> {
    const trends: XPTrend[] = [];
    
    // Daily XP trend
    const dailyXP = this.groupByPeriod(activities, 'day');
    if (dailyXP.length > 0) {
      trends.push({
        period: 'daily',
        values: dailyXP,
        trend: this.calculateTrendDirection(dailyXP.map(v => v.xp)),
        projectedNext: this.projectNextValue(dailyXP.map(v => v.xp))
      });
    }

    // Weekly XP trend
    const weeklyXP = this.groupByPeriod(activities, 'week');
    if (weeklyXP.length > 0) {
      trends.push({
        period: 'weekly',
        values: weeklyXP,
        trend: this.calculateTrendDirection(weeklyXP.map(v => v.xp)),
        projectedNext: this.projectNextValue(weeklyXP.map(v => v.xp))
      });
    }

    return trends;
  }

  /**
   * Calculate streak analysis
   */
  private async calculateStreakAnalysis(userId: string): Promise<StreakAnalysis> {
    const userActivities = this.activities.get(userId) || [];
    const completedActivities = userActivities
      .filter(a => a.status === 'completed')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    let completionStreak = 0;
    let qualityStreak = 0;
    let perfectStreak = 0;

    let longestCompletion = 0;
    let longestQuality = 0;
    let longestPerfect = 0;

    const streakHistory: StreakHistoryEntry[] = [];

    // Calculate current streaks (from most recent activities)
    for (let i = completedActivities.length - 1; i >= 0; i--) {
      const activity = completedActivities[i];
      const performance = this.calculateOverallPerformance(activity.performanceMetrics);

      // Check if streak continues
      completionStreak++;
      
      if (performance >= 80) {
        qualityStreak++;
      } else {
        break; // Quality streak broken
      }

      if (performance >= 95) {
        perfectStreak++;
      } else if (perfectStreak > 0) {
        // Perfect streak was broken earlier, but we continue counting other streaks
      }
    }

    // Calculate longest streaks (analyze all activities)
    let tempCompletion = 0;
    let tempQuality = 0;
    let tempPerfect = 0;

    for (const activity of completedActivities) {
      const performance = this.calculateOverallPerformance(activity.performanceMetrics);

      tempCompletion++;
      longestCompletion = Math.max(longestCompletion, tempCompletion);

      if (performance >= 80) {
        tempQuality++;
        longestQuality = Math.max(longestQuality, tempQuality);
      } else {
        if (tempQuality > 0) {
          streakHistory.push({
            date: activity.startTime,
            streakType: 'quality',
            streakLength: tempQuality,
            broken: true
          });
        }
        tempQuality = 0;
      }

      if (performance >= 95) {
        tempPerfect++;
        longestPerfect = Math.max(longestPerfect, tempPerfect);
      } else {
        if (tempPerfect > 0) {
          streakHistory.push({
            date: activity.startTime,
            streakType: 'perfect',
            streakLength: tempPerfect,
            broken: true
          });
        }
        tempPerfect = 0;
      }
    }

    return {
      currentStreaks: {
        completion: completionStreak,
        quality: qualityStreak,
        perfect: perfectStreak
      },
      longestStreaks: {
        completion: longestCompletion,
        quality: longestQuality,
        perfect: longestPerfect
      },
      streakHistory: streakHistory.slice(-20) // Keep last 20 entries
    };
  }

  /**
   * Generate activity insights
   */
  private async generateInsights(activities: TrackedActivity[], userId: string): Promise<ActivityInsight[]> {
    const insights: ActivityInsight[] = [];

    // Performance insights
    const avgPerformance = activities.reduce((sum, a) => 
      sum + this.calculateOverallPerformance(a.performanceMetrics), 0
    ) / activities.length;

    if (avgPerformance >= 90) {
      insights.push({
        type: 'strength',
        title: 'Excellent Performance',
        description: `Your average performance of ${Math.round(avgPerformance)}% is outstanding`,
        data: { averagePerformance: avgPerformance },
        actionable: false
      });
    } else if (avgPerformance < 70) {
      insights.push({
        type: 'improvement',
        title: 'Performance Opportunity',
        description: `Your average performance of ${Math.round(avgPerformance)}% has room for improvement`,
        data: { averagePerformance: avgPerformance },
        actionable: true,
        recommendation: 'Focus on technical accuracy and communication quality to boost your performance'
      });
    }

    // XP efficiency insights
    const avgXPPerHour = this.calculateXPPerHour(activities);
    if (avgXPPerHour > 100) {
      insights.push({
        type: 'strength',
        title: 'High XP Efficiency',
        description: `You're earning ${Math.round(avgXPPerHour)} XP per hour - excellent pace`,
        data: { xpPerHour: avgXPPerHour },
        actionable: false
      });
    }

    // Streak insights
    const streakAnalysis = await this.calculateStreakAnalysis(userId);
    if (streakAnalysis.currentStreaks.perfect >= 3) {
      insights.push({
        type: 'strength',
        title: 'Perfect Streak',
        description: `You have a ${streakAnalysis.currentStreaks.perfect}-activity perfect performance streak`,
        data: { perfectStreak: streakAnalysis.currentStreaks.perfect },
        actionable: false
      });
    }

    return insights;
  }

  /**
   * Get empty analytics structure
   */
  private getEmptyAnalytics(userId: string, timeRange?: { start: Date; end: Date }): ActivityAnalytics {
    return {
      userId,
      timeRange: timeRange || { start: new Date(), end: new Date() },
      totalActivities: 0,
      totalXP: 0,
      averageXPPerActivity: 0,
      averagePerformance: 0,
      timeSpent: 0,
      averageActivityDuration: 0,
      activityBreakdown: [],
      performanceTrends: [],
      xpTrends: [],
      streakAnalysis: {
        currentStreaks: { completion: 0, quality: 0, perfect: 0 },
        longestStreaks: { completion: 0, quality: 0, perfect: 0 },
        streakHistory: []
      },
      insights: []
    };
  }

  /**
   * Helper methods
   */
  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultMetrics(): PerformanceMetrics {
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

  private getDefaultBreakdown(): XPBreakdownSummary {
    return {
      baseXP: 0,
      difficultyMultiplier: 1,
      performanceMultiplier: 1,
      bonusXP: 0,
      totalXP: 0,
      bonusesEarned: []
    };
  }

  private calculateTrendDirection(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  private calculateChangeRate(values: { date: Date; value: number }[]): number {
    if (values.length < 2) return 0;
    
    const firstValue = values[0].value;
    const lastValue = values[values.length - 1].value;
    const timeDiff = values[values.length - 1].date.getTime() - values[0].date.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 0 || firstValue === 0) return 0;
    
    return ((lastValue - firstValue) / firstValue) * 100 / daysDiff;
  }

  private groupByPeriod(activities: TrackedActivity[], period: 'day' | 'week'): { date: Date; xp: number }[] {
    const groups: Record<string, { date: Date; xp: number }> = {};
    
    for (const activity of activities) {
      let key: string;
      let groupDate: Date;
      
      if (period === 'day') {
        groupDate = new Date(activity.startTime.getFullYear(), activity.startTime.getMonth(), activity.startTime.getDate());
        key = groupDate.toISOString().split('T')[0];
      } else { // week
        const weekStart = new Date(activity.startTime);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        groupDate = weekStart;
        key = groupDate.toISOString().split('T')[0];
      }
      
      if (!groups[key]) {
        groups[key] = { date: groupDate, xp: 0 };
      }
      
      groups[key].xp += activity.xpAwarded;
    }
    
    return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private projectNextValue(values: number[]): number {
    if (values.length < 3) return 0;
    
    // Simple linear projection
    const recentValues = values.slice(-3);
    const trend = (recentValues[2] - recentValues[0]) / 2;
    return Math.max(0, Math.round(recentValues[2] + trend));
  }

  private calculateXPPerHour(activities: TrackedActivity[]): number {
    const totalXP = activities.reduce((sum, a) => sum + a.xpAwarded, 0);
    const totalTime = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const totalHours = totalTime / (1000 * 60 * 60);
    
    return totalHours > 0 ? totalXP / totalHours : 0;
  }

  private async getAllUserAnalytics(): Promise<ActivityAnalytics[]> {
    const allAnalytics: ActivityAnalytics[] = [];
    
    for (const userId of this.activities.keys()) {
      const analytics = await this.getActivityAnalytics(userId);
      allAnalytics.push(analytics);
    }
    
    return allAnalytics;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculatePercentile(value: number, allValues: number[]): number {
    const sorted = allValues.sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return index === -1 ? 100 : Math.round((index / sorted.length) * 100);
  }

  private calculateRanking(userId: string, period: 'overall' | 'week' | 'month'): number {
    // Simplified ranking calculation
    // In a real implementation, this would use proper ranking algorithms
    const userActivities = this.activities.get(userId) || [];
    const userXP = userActivities.reduce((sum, a) => sum + a.xpAwarded, 0);
    
    let rank = 1;
    for (const [otherUserId, otherActivities] of this.activities.entries()) {
      if (otherUserId === userId) continue;
      
      const otherXP = otherActivities.reduce((sum, a) => sum + a.xpAwarded, 0);
      if (otherXP > userXP) rank++;
    }
    
    return rank;
  }
}

export const activityTrackerService = new ActivityTrackerService();
export default activityTrackerService;