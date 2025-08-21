import { 
  Achievement, 
  UserAchievement, 
  AchievementTier, 
  AchievementProgress, 
  AchievementEvidence,
  ProgressActivity,
  AchievementService 
} from './achievementService';

export interface AchievementTracking {
  userId: string;
  achievementId: string;
  currentProgress: AchievementProgress;
  tierProgression: TierProgression;
  recentActivity: ProgressActivity[];
  nextMilestone: NextMilestone;
  eligibilityStatus: EligibilityStatus;
}

export interface TierProgression {
  currentTier?: AchievementTier;
  nextTier?: AchievementTier;
  progressToNext: number;
  requirementsForNext: string[];
  completedTiers: AchievementTier[];
}

export interface NextMilestone {
  tier: AchievementTier;
  description: string;
  progressNeeded: number;
  estimatedCompletion?: Date;
  recommendedActions: string[];
}

export interface EligibilityStatus {
  eligible: boolean;
  tier?: AchievementTier;
  blockers: string[];
  requirements: string[];
  progress: number;
}

export interface AchievementMetrics {
  totalAchievements: number;
  achievementsByTier: Record<AchievementTier, number>;
  achievementsByCategory: Record<string, number>;
  professionalValue: number;
  portfolioStrength: number;
  recentEarnings: UserAchievement[];
}

export class AchievementTracker {
  /**
   * Track progress for a specific achievement
   */
  static async trackAchievementProgress(
    userId: string,
    achievementId: string,
    userMetrics: Record<string, any>
  ): Promise<AchievementTracking> {
    const achievement = AchievementService.getAchievementById(achievementId);
    if (!achievement) {
      throw new Error(`Achievement not found: ${achievementId}`);
    }

    // Check current progress for each tier
    const tierProgression = await this.calculateTierProgression(achievement, userMetrics);
    const currentProgress = await this.calculateCurrentProgress(achievement, userMetrics, tierProgression);
    const nextMilestone = this.calculateNextMilestone(achievement, tierProgression);
    const eligibilityStatus = this.checkEligibilityStatus(achievement, userMetrics, tierProgression);

    return {
      userId,
      achievementId,
      currentProgress,
      tierProgression,
      recentActivity: currentProgress.recentActivity,
      nextMilestone,
      eligibilityStatus
    };
  }

  /**
   * Calculate tier progression for achievement
   */
  private static async calculateTierProgression(
    achievement: Achievement,
    userMetrics: Record<string, any>
  ): Promise<TierProgression> {
    const tiers = [AchievementTier.BRONZE, AchievementTier.SILVER, AchievementTier.GOLD, AchievementTier.PLATINUM];
    const completedTiers: AchievementTier[] = [];
    let currentTier: AchievementTier | undefined;
    let nextTier: AchievementTier | undefined;

    // Check each tier in order
    for (const tier of tiers) {
      const eligibility = AchievementService.checkAchievementEligibility(
        achievement.id,
        userMetrics,
        tier
      );

      if (eligibility.eligible) {
        completedTiers.push(tier);
        currentTier = tier;
      } else {
        nextTier = tier;
        break;
      }
    }

    // Calculate progress to next tier
    let progressToNext = 0;
    let requirementsForNext: string[] = [];

    if (nextTier) {
      const nextTierEligibility = AchievementService.checkAchievementEligibility(
        achievement.id,
        userMetrics,
        nextTier
      );
      progressToNext = nextTierEligibility.progress;
      requirementsForNext = nextTierEligibility.missing;
    }

    return {
      currentTier,
      nextTier,
      progressToNext,
      requirementsForNext,
      completedTiers
    };
  }

  /**
   * Calculate current progress for achievement
   */
  private static async calculateCurrentProgress(
    achievement: Achievement,
    userMetrics: Record<string, any>,
    tierProgression: TierProgression
  ): Promise<AchievementProgress> {
    const targetTier = tierProgression.nextTier || tierProgression.currentTier || AchievementTier.BRONZE;
    const requirement = achievement.criteria.requirements[targetTier];

    if (!requirement) {
      return {
        currentValue: 0,
        targetValue: 0,
        percentage: 0,
        recentActivity: []
      };
    }

    let currentValue = 0;
    let targetValue = requirement.threshold;

    // Extract current value based on criteria type
    switch (achievement.criteria.type) {
      case 'count':
        currentValue = userMetrics.count || 0;
        break;
      case 'percentage':
        currentValue = userMetrics.percentage || 0;
        break;
      case 'quality':
        currentValue = userMetrics.rating || 0;
        break;
      case 'streak':
        currentValue = userMetrics.streak || 0;
        break;
      case 'composite':
        // For composite, use overall progress
        const conditions = requirement.conditions || {};
        const conditionValues = Object.keys(conditions).map(key => userMetrics[key] || 0);
        currentValue = conditionValues.reduce((sum, val) => sum + val, 0);
        targetValue = Object.values(conditions).reduce((sum: number, val: any) => sum + val, 0);
        break;
    }

    const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;

    // Generate recent activity (mock data for now)
    const recentActivity: ProgressActivity[] = this.generateRecentActivity(userMetrics);

    return {
      currentValue,
      targetValue,
      percentage: Math.round(percentage),
      streakCount: userMetrics.streak,
      bestValue: userMetrics.bestValue,
      recentActivity
    };
  }

  /**
   * Generate recent activity data
   */
  private static generateRecentActivity(userMetrics: Record<string, any>): ProgressActivity[] {
    const activities: ProgressActivity[] = [];
    const now = new Date();

    // Generate last 7 days of activity (mock implementation)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const value = Math.floor(Math.random() * 10); // Mock daily progress
      
      if (value > 0) {
        activities.push({
          date,
          value,
          context: `Daily progress: ${value} points`,
          ticketId: `TICKET-${Math.floor(Math.random() * 1000)}`
        });
      }
    }

    return activities;
  }

  /**
   * Calculate next milestone
   */
  private static calculateNextMilestone(
    achievement: Achievement,
    tierProgression: TierProgression
  ): NextMilestone {
    const nextTier = tierProgression.nextTier || AchievementTier.BRONZE;
    const requirement = achievement.criteria.requirements[nextTier];
    
    const milestone: NextMilestone = {
      tier: nextTier,
      description: this.getTierDescription(nextTier, achievement.name),
      progressNeeded: 100 - tierProgression.progressToNext,
      recommendedActions: this.getRecommendedActions(achievement, nextTier)
    };

    // Estimate completion date based on recent progress
    if (tierProgression.progressToNext > 0) {
      const daysEstimate = Math.ceil(milestone.progressNeeded / 10); // Rough estimate
      milestone.estimatedCompletion = new Date(Date.now() + daysEstimate * 24 * 60 * 60 * 1000);
    }

    return milestone;
  }

  /**
   * Get tier description
   */
  private static getTierDescription(tier: AchievementTier, achievementName: string): string {
    const descriptions = {
      [AchievementTier.BRONZE]: `Earn ${achievementName} (Bronze) by demonstrating basic competency`,
      [AchievementTier.SILVER]: `Advance to ${achievementName} (Silver) through consistent performance`,
      [AchievementTier.GOLD]: `Achieve ${achievementName} (Gold) with exceptional performance`,
      [AchievementTier.PLATINUM]: `Master ${achievementName} (Platinum) with sustained excellence`
    };

    return descriptions[tier] || `Progress toward ${achievementName}`;
  }

  /**
   * Get recommended actions for tier
   */
  private static getRecommendedActions(achievement: Achievement, tier: AchievementTier): string[] {
    const baseActions = {
      [AchievementTier.BRONZE]: [
        'Focus on consistent daily practice',
        'Review best practices and guidelines',
        'Track your progress regularly'
      ],
      [AchievementTier.SILVER]: [
        'Maintain consistent high performance',
        'Seek feedback to improve quality',
        'Document your successful approaches'
      ],
      [AchievementTier.GOLD]: [
        'Aim for exceptional quality in every task',
        'Share knowledge with team members',
        'Continuously refine your techniques'
      ],
      [AchievementTier.PLATINUM]: [
        'Maintain excellence over extended periods',
        'Mentor others in your area of expertise',
        'Contribute to process improvements'
      ]
    };

    // Add achievement-specific actions
    const specificActions = this.getAchievementSpecificActions(achievement);
    
    return [...baseActions[tier], ...specificActions];
  }

  /**
   * Get achievement-specific recommended actions
   */
  private static getAchievementSpecificActions(achievement: Achievement): string[] {
    const categoryActions = {
      technical_skills: [
        'Practice troubleshooting techniques',
        'Study system documentation',
        'Test solutions thoroughly'
      ],
      customer_service: [
        'Focus on clear communication',
        'Practice active listening',
        'Follow up on customer satisfaction'
      ],
      professional_behavior: [
        'Follow established processes',
        'Document work thoroughly',
        'Seek continuous improvement opportunities'
      ],
      leadership: [
        'Mentor junior team members',
        'Share knowledge actively',
        'Lead by example'
      ],
      learning: [
        'Try new approaches',
        'Research innovative solutions',
        'Share learnings with the team'
      ]
    };

    return categoryActions[achievement.category] || [];
  }

  /**
   * Check eligibility status
   */
  private static checkEligibilityStatus(
    achievement: Achievement,
    userMetrics: Record<string, any>,
    tierProgression: TierProgression
  ): EligibilityStatus {
    // Check if eligible for next tier
    const nextTier = tierProgression.nextTier;
    if (!nextTier) {
      return {
        eligible: false,
        tier: tierProgression.currentTier,
        blockers: ['All tiers completed'],
        requirements: [],
        progress: 100
      };
    }

    const eligibility = AchievementService.checkAchievementEligibility(
      achievement.id,
      userMetrics,
      nextTier
    );

    return {
      eligible: eligibility.eligible,
      tier: nextTier,
      blockers: eligibility.missing,
      requirements: eligibility.missing,
      progress: eligibility.progress
    };
  }

  /**
   * Get user's achievement metrics
   */
  static async getUserAchievementMetrics(userId: string): Promise<AchievementMetrics> {
    const userAchievements = await AchievementService.getUserAchievements(userId);
    
    // Count achievements by tier
    const achievementsByTier = {
      [AchievementTier.BRONZE]: 0,
      [AchievementTier.SILVER]: 0,
      [AchievementTier.GOLD]: 0,
      [AchievementTier.PLATINUM]: 0
    };

    userAchievements.forEach(ua => {
      achievementsByTier[ua.tier]++;
    });

    // Count achievements by category
    const achievementsByCategory: Record<string, number> = {};
    userAchievements.forEach(ua => {
      const achievement = AchievementService.getAchievementById(ua.achievementId);
      if (achievement) {
        const category = achievement.category;
        achievementsByCategory[category] = (achievementsByCategory[category] || 0) + 1;
      }
    });

    // Calculate professional value
    const professionalValue = this.calculateProfessionalValue(userAchievements);
    const portfolioStrength = this.calculatePortfolioStrength(userAchievements);

    // Get recent achievements (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEarnings = userAchievements.filter(ua => ua.earnedAt >= thirtyDaysAgo);

    return {
      totalAchievements: userAchievements.length,
      achievementsByTier,
      achievementsByCategory,
      professionalValue,
      portfolioStrength,
      recentEarnings
    };
  }

  /**
   * Calculate professional value score
   */
  private static calculateProfessionalValue(userAchievements: UserAchievement[]): number {
    let totalValue = 0;

    userAchievements.forEach(ua => {
      const achievement = AchievementService.getAchievementById(ua.achievementId);
      if (!achievement) return;

      let value = achievement.professionalValue.industryValue;

      // Tier multiplier
      switch (ua.tier) {
        case AchievementTier.PLATINUM:
          value *= 2.0;
          break;
        case AchievementTier.GOLD:
          value *= 1.5;
          break;
        case AchievementTier.SILVER:
          value *= 1.2;
          break;
        default:
          value *= 1.0;
      }

      totalValue += value;
    });

    return Math.round(totalValue);
  }

  /**
   * Calculate portfolio strength score
   */
  private static calculatePortfolioStrength(userAchievements: UserAchievement[]): number {
    const portfolioAchievements = AchievementService.getPortfolioAchievements(userAchievements);
    
    // Calculate based on diversity and quality of achievements
    const categoryDiversity = new Set(
      portfolioAchievements.map(pa => pa.achievement.category)
    ).size;

    const averageWeight = portfolioAchievements.length > 0
      ? portfolioAchievements.reduce((sum, pa) => sum + pa.portfolioWeight, 0) / portfolioAchievements.length
      : 0;

    // Combine diversity and quality
    const diversityScore = (categoryDiversity / 5) * 50; // Max 5 categories
    const qualityScore = Math.min(averageWeight * 5, 50); // Normalize to 50

    return Math.round(diversityScore + qualityScore);
  }

  /**
   * Get achievement recommendations for user
   */
  static async getAchievementRecommendations(
    userId: string,
    userMetrics: Record<string, any>
  ): Promise<{
    recommended: AchievementTracking[];
    nearCompletion: AchievementTracking[];
    beginner: AchievementTracking[];
  }> {
    const allAchievements = AchievementService.getAllAchievements();
    const userAchievements = await AchievementService.getUserAchievements(userId);
    const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));

    const trackings: AchievementTracking[] = [];

    // Track progress for unearned achievements
    for (const achievement of allAchievements) {
      if (!earnedIds.has(achievement.id)) {
        try {
          const tracking = await this.trackAchievementProgress(
            userId,
            achievement.id,
            userMetrics
          );
          trackings.push(tracking);
        } catch (error) {
          // Skip if tracking fails
          continue;
        }
      }
    }

    // Categorize recommendations
    const recommended = trackings
      .filter(t => t.eligibilityStatus.progress >= 50 && t.eligibilityStatus.progress < 90)
      .sort((a, b) => b.eligibilityStatus.progress - a.eligibilityStatus.progress)
      .slice(0, 5);

    const nearCompletion = trackings
      .filter(t => t.eligibilityStatus.progress >= 90)
      .sort((a, b) => b.eligibilityStatus.progress - a.eligibilityStatus.progress)
      .slice(0, 3);

    const beginner = trackings
      .filter(t => t.eligibilityStatus.progress < 25)
      .sort((a, b) => {
        const aAchievement = AchievementService.getAchievementById(a.achievementId);
        const bAchievement = AchievementService.getAchievementById(b.achievementId);
        return (aAchievement?.professionalValue.industryValue || 0) - 
               (bAchievement?.professionalValue.industryValue || 0);
      })
      .slice(0, 5);

    return { recommended, nearCompletion, beginner };
  }

  /**
   * Record achievement progress activity
   */
  static async recordProgressActivity(
    userId: string,
    achievementId: string,
    activity: Omit<ProgressActivity, 'date'>
  ): Promise<void> {
    const fullActivity: ProgressActivity = {
      ...activity,
      date: new Date()
    };

    // In real implementation, this would be stored in database
    console.log(`Progress recorded for user ${userId} on achievement ${achievementId}:`, fullActivity);
  }
}