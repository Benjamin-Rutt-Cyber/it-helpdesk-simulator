import { LevelService } from './levelService';
import { AchievementService, UserAchievement } from './achievementService';
import { AchievementTracker } from './achievementTracker';

export interface DashboardData {
  overview: DashboardOverview;
  progress: ProgressData;
  achievements: AchievementData;
  insights: InsightData;
  goals: GoalData;
  historical: HistoricalData;
}

export interface DashboardOverview {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  progressPercentage: number;
  recentAchievements: number;
  activeGoals: number;
  professionalValue: number;
  lastUpdateTime: Date;
}

export interface ProgressData {
  xpProgress: XPProgress;
  levelProgress: LevelProgress;
  skillProgress: SkillProgress[];
  goalProgress: GoalProgress[];
  weeklyProgress: WeeklyProgress;
}

export interface XPProgress {
  current: number;
  target: number;
  percentage: number;
  dailyAverage: number;
  weeklyTrend: number;
  projection: number;
}

export interface LevelProgress {
  currentLevel: number;
  currentLevelName: string;
  nextLevel: number;
  nextLevelName: string;
  progressToNext: number;
  estimatedTimeToNext: string;
  levelBenefits: string[];
}

export interface SkillProgress {
  skillName: string;
  category: string;
  currentLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  progressScore: number;
  recentActivity: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  nextMilestone: string;
}

export interface GoalProgress {
  goalId: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  percentage: number;
  dueDate: Date;
  status: 'on_track' | 'at_risk' | 'overdue' | 'completed';
  estimatedCompletion: Date;
}

export interface WeeklyProgress {
  xpEarned: number;
  achievementsUnlocked: number;
  goalsCompleted: number;
  skillImprovements: number;
  comparisonToPrevious: {
    xpChange: number;
    achievementChange: number;
    improvementRate: number;
  };
}

export interface AchievementData {
  totalAchievements: number;
  recentAchievements: UserAchievement[];
  progressingAchievements: AchievementProgress[];
  recommendations: AchievementRecommendations;
  categoryBreakdown: CategoryBreakdown[];
  rareAchievements: UserAchievement[];
}

export interface AchievementProgress {
  achievementId: string;
  name: string;
  category: string;
  currentProgress: number;
  targetProgress: number;
  percentage: number;
  estimatedCompletion: string;
  nextMilestone: string;
}

export interface AchievementRecommendations {
  nearCompletion: AchievementProgress[];
  recommended: AchievementProgress[];
  beginner: AchievementProgress[];
}

export interface CategoryBreakdown {
  category: string;
  totalAchievements: number;
  completedAchievements: number;
  averageTier: string;
  professionalValue: number;
}

export interface InsightData {
  strengths: StrengthInsight[];
  improvements: ImprovementInsight[];
  recommendations: RecommendationInsight[];
  performanceTrend: PerformanceTrend;
  comparison: ComparisonData;
}

export interface StrengthInsight {
  area: string;
  score: number;
  description: string;
  evidence: string[];
  professionalImpact: string;
}

export interface ImprovementInsight {
  area: string;
  currentScore: number;
  targetScore: number;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
  estimatedTimeframe: string;
}

export interface RecommendationInsight {
  type: 'skill' | 'goal' | 'achievement' | 'learning';
  title: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  actionUrl?: string;
}

export interface PerformanceTrend {
  direction: 'improving' | 'stable' | 'declining';
  magnitude: number;
  timeframe: string;
  keyFactors: string[];
  prediction: string;
}

export interface ComparisonData {
  percentile: number;
  averageComparison: string;
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface GoalData {
  activeGoals: Goal[];
  completedGoals: Goal[];
  recommendations: GoalRecommendation[];
  progress: GoalProgressSummary;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'xp' | 'level' | 'skill' | 'achievement' | 'professional';
  targetValue: number;
  currentValue: number;
  targetDate: Date;
  createdDate: Date;
  status: 'active' | 'completed' | 'paused' | 'expired';
  priority: 'high' | 'medium' | 'low';
  milestones: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedDate?: Date;
}

export interface GoalRecommendation {
  type: string;
  title: string;
  description: string;
  suggestedTargetValue: number;
  suggestedTimeframe: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  professionalImpact: string;
}

export interface GoalProgressSummary {
  totalActiveGoals: number;
  onTrackGoals: number;
  atRiskGoals: number;
  completedThisMonth: number;
  averageCompletionRate: number;
}

export interface HistoricalData {
  xpHistory: HistoricalPoint[];
  levelHistory: HistoricalPoint[];
  achievementHistory: HistoricalPoint[];
  skillHistory: SkillHistoricalData[];
  goalHistory: GoalHistoricalData[];
  performanceHistory: PerformanceHistoricalData[];
}

export interface HistoricalPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface SkillHistoricalData {
  skillName: string;
  category: string;
  history: HistoricalPoint[];
  improvementRate: number;
}

export interface GoalHistoricalData {
  month: string;
  goalsSet: number;
  goalsCompleted: number;
  completionRate: number;
}

export interface PerformanceHistoricalData {
  period: string;
  overallScore: number;
  categoryScores: { [category: string]: number };
  improvements: string[];
  challenges: string[];
}

export class DashboardService {
  /**
   * Get comprehensive dashboard data for user
   */
  static async getDashboardData(userId: string): Promise<DashboardData> {
    const [overview, progress, achievements, insights, goals, historical] = await Promise.all([
      this.getDashboardOverview(userId),
      this.getProgressData(userId),
      this.getAchievementData(userId),
      this.getInsightData(userId),
      this.getGoalData(userId),
      this.getHistoricalData(userId)
    ]);

    return {
      overview,
      progress,
      achievements,
      insights,
      goals,
      historical
    };
  }

  /**
   * Get dashboard overview
   */
  private static async getDashboardOverview(userId: string): Promise<DashboardOverview> {
    // Get current user level and XP
    const currentXP = 1250; // Mock data - would come from user service
    const currentLevel = LevelService.getLevelFromXP(currentXP);
    const levelInfo = LevelService.getLevelInfo(currentLevel);
    const nextLevelXP = LevelService.getXPForLevel(currentLevel + 1);
    const progressPercentage = Math.round(((currentXP - levelInfo.xpRequired) / (nextLevelXP - levelInfo.xpRequired)) * 100);

    // Get recent achievements count
    const userAchievements = await this.mockGetUserAchievements(userId);
    const recentAchievements = userAchievements.filter(
      a => (Date.now() - a.earnedAt.getTime()) < 30 * 24 * 60 * 60 * 1000
    ).length;

    // Get active goals count
    const goals = await this.mockGetUserGoals(userId);
    const activeGoals = goals.filter(g => g.status === 'active').length;

    // Calculate professional value
    const achievementMetrics = await AchievementTracker.getUserAchievementMetrics(userId);
    const professionalValue = achievementMetrics.professionalValue;

    return {
      currentLevel,
      currentXP,
      nextLevelXP,
      progressPercentage,
      recentAchievements,
      activeGoals,
      professionalValue,
      lastUpdateTime: new Date()
    };
  }

  /**
   * Get progress data
   */
  private static async getProgressData(userId: string): Promise<ProgressData> {
    const currentXP = 1250;
    const nextLevelXP = 1500;
    const currentLevel = LevelService.getLevelFromXP(currentXP);
    const levelInfo = LevelService.getLevelInfo(currentLevel);

    const xpProgress: XPProgress = {
      current: currentXP,
      target: nextLevelXP,
      percentage: Math.round(((currentXP - levelInfo.xpRequired) / (nextLevelXP - levelInfo.xpRequired)) * 100),
      dailyAverage: 25,
      weeklyTrend: 12,
      projection: nextLevelXP + 200
    };

    const levelProgress: LevelProgress = {
      currentLevel,
      currentLevelName: levelInfo.name,
      nextLevel: currentLevel + 1,
      nextLevelName: LevelService.getLevelInfo(currentLevel + 1).name,
      progressToNext: xpProgress.percentage,
      estimatedTimeToNext: '10 days',
      levelBenefits: levelInfo.benefits
    };

    const skillProgress: SkillProgress[] = [
      {
        skillName: 'Technical Problem Solving',
        category: 'Technical Skills',
        currentLevel: 'intermediate',
        progressScore: 75,
        recentActivity: 8,
        trendDirection: 'improving',
        nextMilestone: 'Advanced level at 85% proficiency'
      },
      {
        skillName: 'Customer Communication',
        category: 'Customer Service',
        currentLevel: 'advanced',
        progressScore: 88,
        recentActivity: 12,
        trendDirection: 'stable',
        nextMilestone: 'Expert level at 95% proficiency'
      },
      {
        skillName: 'System Administration',
        category: 'Technical Skills',
        currentLevel: 'basic',
        progressScore: 45,
        recentActivity: 3,
        trendDirection: 'improving',
        nextMilestone: 'Intermediate level at 60% proficiency'
      }
    ];

    const goals = await this.mockGetUserGoals(userId);
    const goalProgress: GoalProgress[] = goals.filter(g => g.status === 'active').map(goal => ({
      goalId: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      percentage: Math.round((goal.currentValue / goal.targetValue) * 100),
      dueDate: goal.targetDate,
      status: this.getGoalStatus(goal),
      estimatedCompletion: this.estimateGoalCompletion(goal)
    }));

    const weeklyProgress: WeeklyProgress = {
      xpEarned: 175,
      achievementsUnlocked: 2,
      goalsCompleted: 1,
      skillImprovements: 3,
      comparisonToPrevious: {
        xpChange: 15,
        achievementChange: 1,
        improvementRate: 8
      }
    };

    return {
      xpProgress,
      levelProgress,
      skillProgress,
      goalProgress,
      weeklyProgress
    };
  }

  /**
   * Get achievement data
   */
  private static async getAchievementData(userId: string): Promise<AchievementData> {
    const userAchievements = await this.mockGetUserAchievements(userId);
    const totalAchievements = userAchievements.length;

    const recentAchievements = userAchievements
      .filter(a => (Date.now() - a.earnedAt.getTime()) < 30 * 24 * 60 * 60 * 1000)
      .slice(0, 5);

    // Mock progressing achievements
    const progressingAchievements: AchievementProgress[] = [
      {
        achievementId: 'troubleshooting_master',
        name: 'Troubleshooting Master',
        category: 'Technical Skills',
        currentProgress: 85,
        targetProgress: 100,
        percentage: 85,
        estimatedCompletion: '3 days',
        nextMilestone: 'Complete 3 more technical tickets'
      },
      {
        achievementId: 'customer_champion',
        name: 'Customer Champion',
        category: 'Customer Service',
        currentProgress: 60,
        targetProgress: 100,
        percentage: 60,
        estimatedCompletion: '1 week',
        nextMilestone: 'Achieve 95% satisfaction on next 8 tickets'
      }
    ];

    const recommendations: AchievementRecommendations = {
      nearCompletion: progressingAchievements.filter(a => a.percentage >= 80),
      recommended: progressingAchievements.filter(a => a.percentage >= 50 && a.percentage < 80),
      beginner: progressingAchievements.filter(a => a.percentage < 50)
    };

    const categoryBreakdown: CategoryBreakdown[] = [
      {
        category: 'Technical Skills',
        totalAchievements: 12,
        completedAchievements: 7,
        averageTier: 'Silver',
        professionalValue: 8.2
      },
      {
        category: 'Customer Service',
        totalAchievements: 10,
        completedAchievements: 5,
        averageTier: 'Bronze',
        professionalValue: 7.8
      },
      {
        category: 'Professional Behavior',
        totalAchievements: 8,
        completedAchievements: 3,
        averageTier: 'Bronze',
        professionalValue: 7.5
      }
    ];

    const rareAchievements = userAchievements.filter(a => {
      const achievement = AchievementService.getAchievementById(a.achievementId);
      return achievement?.rarity === 'rare' || achievement?.rarity === 'epic';
    });

    return {
      totalAchievements,
      recentAchievements,
      progressingAchievements,
      recommendations,
      categoryBreakdown,
      rareAchievements
    };
  }

  /**
   * Get insight data
   */
  private static async getInsightData(userId: string): Promise<InsightData> {
    const strengths: StrengthInsight[] = [
      {
        area: 'Technical Problem Solving',
        score: 88,
        description: 'Consistently demonstrates excellent troubleshooting abilities',
        evidence: ['95% first-contact resolution', '15% faster than average', 'Expert-level system knowledge'],
        professionalImpact: 'Strong technical competency suitable for senior support roles'
      },
      {
        area: 'Customer Communication',
        score: 85,
        description: 'Outstanding customer interaction and satisfaction delivery',
        evidence: ['98% customer satisfaction', '12 customer commendations', 'Effective difficult situation handling'],
        professionalImpact: 'Excellent customer service skills valuable for client-facing positions'
      }
    ];

    const improvements: ImprovementInsight[] = [
      {
        area: 'Documentation Skills',
        currentScore: 65,
        targetScore: 80,
        priority: 'medium',
        actionItems: [
          'Complete documentation training module',
          'Create 5 comprehensive technical guides',
          'Implement structured documentation templates'
        ],
        estimatedTimeframe: '4-6 weeks'
      },
      {
        area: 'System Administration',
        currentScore: 45,
        targetScore: 70,
        priority: 'high',
        actionItems: [
          'Complete system administration certification',
          'Practice advanced server management',
          'Shadow senior administrators'
        ],
        estimatedTimeframe: '8-12 weeks'
      }
    ];

    const recommendations: RecommendationInsight[] = [
      {
        type: 'skill',
        title: 'Advance Network Troubleshooting',
        description: 'Focus on network-specific problem solving to complement strong general troubleshooting',
        benefit: 'Specialized network expertise increases professional value',
        effort: 'medium',
        timeline: '6-8 weeks',
        actionUrl: '/learning/network-troubleshooting'
      },
      {
        type: 'achievement',
        title: 'Complete Security Guardian Achievement',
        description: 'You\'re 85% complete on this high-value security achievement',
        benefit: 'Security expertise is highly valued in current market',
        effort: 'low',
        timeline: '1-2 weeks'
      }
    ];

    const performanceTrend: PerformanceTrend = {
      direction: 'improving',
      magnitude: 12,
      timeframe: 'last 30 days',
      keyFactors: ['Increased technical accuracy', 'Better customer communication', 'Faster resolution times'],
      prediction: 'Continued improvement expected with current trajectory'
    };

    const comparison: ComparisonData = {
      percentile: 78,
      averageComparison: '22% above team average',
      strengthAreas: ['Technical Skills', 'Customer Service'],
      improvementAreas: ['Documentation', 'System Administration']
    };

    return {
      strengths,
      improvements,
      recommendations,
      performanceTrend,
      comparison
    };
  }

  /**
   * Get goal data
   */
  private static async getGoalData(userId: string): Promise<GoalData> {
    const goals = await this.mockGetUserGoals(userId);
    
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    const recommendations: GoalRecommendation[] = [
      {
        type: 'skill',
        title: 'Master Network Troubleshooting',
        description: 'Develop specialized network troubleshooting expertise',
        suggestedTargetValue: 50,
        suggestedTimeframe: '8 weeks',
        difficulty: 'moderate',
        professionalImpact: 'High - Network skills are in demand'
      },
      {
        type: 'achievement',
        title: 'Earn Security Guardian Gold',
        description: 'Advance your security achievement to Gold tier',
        suggestedTargetValue: 25,
        suggestedTimeframe: '6 weeks',
        difficulty: 'challenging',
        professionalImpact: 'Very High - Security expertise is premium skill'
      }
    ];

    const progress: GoalProgressSummary = {
      totalActiveGoals: activeGoals.length,
      onTrackGoals: activeGoals.filter(g => this.getGoalStatus(g) === 'on_track').length,
      atRiskGoals: activeGoals.filter(g => this.getGoalStatus(g) === 'at_risk').length,
      completedThisMonth: completedGoals.filter(g => 
        g.status === 'completed' && 
        (Date.now() - g.createdDate.getTime()) < 30 * 24 * 60 * 60 * 1000
      ).length,
      averageCompletionRate: 75
    };

    return {
      activeGoals,
      completedGoals,
      recommendations,
      progress
    };
  }

  /**
   * Get historical data
   */
  private static async getHistoricalData(userId: string): Promise<HistoricalData> {
    // Generate mock historical data
    const now = new Date();
    const days = 30;

    const xpHistory: HistoricalPoint[] = Array.from({ length: days }, (_, i) => ({
      date: new Date(now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000),
      value: 800 + i * 15 + Math.random() * 10
    }));

    const levelHistory: HistoricalPoint[] = [
      { date: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), value: 3, label: 'IT Support Specialist' },
      { date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), value: 4, label: 'Senior Support Specialist' },
      { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), value: 5, label: 'Support Team Lead' }
    ];

    const achievementHistory: HistoricalPoint[] = [
      { date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), value: 5 },
      { date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), value: 7 },
      { date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), value: 9 },
      { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), value: 12 }
    ];

    const skillHistory: SkillHistoricalData[] = [
      {
        skillName: 'Technical Problem Solving',
        category: 'Technical Skills',
        history: Array.from({ length: 10 }, (_, i) => ({
          date: new Date(now.getTime() - (10 - i) * 7 * 24 * 60 * 60 * 1000),
          value: 60 + i * 2.5
        })),
        improvementRate: 15
      }
    ];

    const goalHistory: GoalHistoricalData[] = [
      { month: 'January', goalsSet: 5, goalsCompleted: 4, completionRate: 80 },
      { month: 'February', goalsSet: 6, goalsCompleted: 5, completionRate: 83 },
      { month: 'March', goalsSet: 4, goalsCompleted: 3, completionRate: 75 }
    ];

    const performanceHistory: PerformanceHistoricalData[] = [
      {
        period: 'Q1 2024',
        overallScore: 82,
        categoryScores: {
          'Technical Skills': 85,
          'Customer Service': 88,
          'Professional Behavior': 75
        },
        improvements: ['Faster resolution times', 'Better documentation'],
        challenges: ['Complex network issues', 'Time management']
      }
    ];

    return {
      xpHistory,
      levelHistory,
      achievementHistory,
      skillHistory,
      goalHistory,
      performanceHistory
    };
  }

  /**
   * Helper methods
   */
  private static async mockGetUserAchievements(userId: string): Promise<UserAchievement[]> {
    // Mock user achievements - in real implementation, this would query the database
    return [
      {
        achievementId: 'troubleshooting_master',
        userId,
        earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        tier: 'gold' as any,
        progress: {
          currentValue: 100,
          targetValue: 100,
          percentage: 100,
          recentActivity: []
        },
        evidence: [],
        celebrationShown: true
      }
    ];
  }

  private static async mockGetUserGoals(userId: string): Promise<Goal[]> {
    // Mock user goals - in real implementation, this would query the database
    return [
      {
        id: 'goal_1',
        title: 'Reach Level 6',
        description: 'Advance to Senior Support Engineer level',
        category: 'level',
        targetValue: 6,
        currentValue: 5,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'active',
        priority: 'high',
        milestones: [
          {
            id: 'milestone_1',
            title: 'Earn 200 more XP',
            targetValue: 200,
            completed: false
          }
        ]
      }
    ];
  }

  private static getGoalStatus(goal: Goal): 'on_track' | 'at_risk' | 'overdue' | 'completed' {
    if (goal.status === 'completed') return 'completed';
    
    const progress = goal.currentValue / goal.targetValue;
    const timeRemaining = goal.targetDate.getTime() - Date.now();
    const totalTime = goal.targetDate.getTime() - goal.createdDate.getTime();
    const timeProgress = 1 - (timeRemaining / totalTime);

    if (timeRemaining < 0) return 'overdue';
    if (progress >= timeProgress) return 'on_track';
    return 'at_risk';
  }

  private static estimateGoalCompletion(goal: Goal): Date {
    const progress = goal.currentValue / goal.targetValue;
    const timeElapsed = Date.now() - goal.createdDate.getTime();
    const estimatedTotalTime = timeElapsed / progress;
    return new Date(goal.createdDate.getTime() + estimatedTotalTime);
  }

  /**
   * Save dashboard customization
   */
  static async saveDashboardCustomization(userId: string, customization: any): Promise<void> {
    // Mock implementation - would save to database
    console.log(`Saving dashboard customization for user ${userId}:`, customization);
  }

  /**
   * Export dashboard data
   */
  static async exportDashboard(userId: string, format: 'pdf' | 'json' | 'csv'): Promise<string> {
    const dashboardData = await this.getDashboardData(userId);
    
    switch (format) {
      case 'json':
        return JSON.stringify(dashboardData, null, 2);
      case 'csv':
        return this.convertToCSV(dashboardData);
      case 'pdf':
        return this.generatePDFExport(dashboardData);
      default:
        return JSON.stringify(dashboardData, null, 2);
    }
  }

  private static convertToCSV(data: DashboardData): string {
    // Simplified CSV export
    let csv = 'Metric,Value\n';
    csv += `Current Level,${data.overview.currentLevel}\n`;
    csv += `Current XP,${data.overview.currentXP}\n`;
    csv += `Total Achievements,${data.achievements.totalAchievements}\n`;
    csv += `Professional Value,${data.overview.professionalValue}\n`;
    return csv;
  }

  private static generatePDFExport(data: DashboardData): string {
    // Mock PDF generation - would use a PDF library
    return `PDF Export of Dashboard Data for ${data.overview.lastUpdateTime.toDateString()}`;
  }
}