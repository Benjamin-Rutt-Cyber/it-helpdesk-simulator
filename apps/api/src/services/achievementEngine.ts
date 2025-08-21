import { 
  Achievement, 
  UserAchievement, 
  AchievementTier, 
  AchievementEvidence,
  AchievementService 
} from './achievementService';

export interface AchievementCheck {
  achievementId: string;
  userId: string;
  metrics: PerformanceMetrics;
  context: AchievementContext;
}

export interface PerformanceMetrics {
  // Technical metrics
  firstContactResolution: number;
  averageResolutionTime: number;
  technicalAccuracy: number;
  systemKnowledge: number;

  // Customer service metrics
  customerSatisfaction: number;
  communicationRating: number;
  empathyScore: number;
  professionalismRating: number;

  // Professional behavior metrics
  processAdherence: number;
  qualityScore: number;
  reliabilityRating: number;
  improvementRate: number;

  // Leadership metrics
  mentoringCount: number;
  knowledgeSharingCount: number;
  teamCollaborationScore: number;
  leadershipInitiatives: number;

  // Learning metrics
  skillDemonstrationsCount: number;
  innovationCount: number;
  learningHours: number;
  certificationProgress: number;

  // Contextual metrics
  timeframe: string;
  ticketCount: number;
  categorySpecific: Record<string, number>;
}

export interface AchievementContext {
  timeframe: string;
  department: string;
  role: string;
  experience: string;
  recentActivity: ActivityRecord[];
}

export interface ActivityRecord {
  date: Date;
  type: string;
  value: number;
  quality: number;
  context: Record<string, any>;
}

export interface EarningResult {
  earned: boolean;
  tier: AchievementTier;
  evidence: AchievementEvidence[];
  progress: number;
  nextTierRequirements?: string[];
  celebration: CelebrationData;
}

export interface CelebrationData {
  title: string;
  message: string;
  rarity: string;
  professionalImpact: string;
  shareableContent: {
    linkedIn: string;
    twitter: string;
    resumeLine: string;
  };
}

export class AchievementEngine {
  /**
   * Check if user has earned any new achievements
   */
  static async checkAchievementEarning(
    userId: string,
    metrics: PerformanceMetrics,
    context: AchievementContext
  ): Promise<EarningResult[]> {
    const results: EarningResult[] = [];
    const allAchievements = AchievementService.getAllAchievements();
    const userAchievements = await AchievementService.getUserAchievements(userId);
    
    // Create map of earned achievements
    const earnedMap = new Map<string, AchievementTier>();
    userAchievements.forEach(ua => {
      const current = earnedMap.get(ua.achievementId);
      if (!current || this.getTierValue(ua.tier) > this.getTierValue(current)) {
        earnedMap.set(ua.achievementId, ua.tier);
      }
    });

    // Check each achievement
    for (const achievement of allAchievements) {
      const currentTier = earnedMap.get(achievement.id);
      const earningResult = await this.checkSingleAchievement(
        achievement,
        metrics,
        context,
        currentTier
      );

      if (earningResult.earned) {
        results.push(earningResult);
      }
    }

    return results;
  }

  /**
   * Check earning for a single achievement
   */
  private static async checkSingleAchievement(
    achievement: Achievement,
    metrics: PerformanceMetrics,
    context: AchievementContext,
    currentTier?: AchievementTier
  ): Promise<EarningResult> {
    // Determine next tier to check
    const nextTier = this.getNextTier(currentTier);
    if (!nextTier) {
      return this.createNoEarningResult();
    }

    // Get achievement-specific metrics
    const achievementMetrics = this.extractAchievementMetrics(achievement, metrics);
    
    // Check eligibility
    const eligibility = AchievementService.checkAchievementEligibility(
      achievement.id,
      achievementMetrics,
      nextTier
    );

    if (!eligibility.eligible) {
      return {
        earned: false,
        tier: nextTier,
        evidence: [],
        progress: eligibility.progress,
        nextTierRequirements: eligibility.missing,
        celebration: this.createEmptyCelebration()
      };
    }

    // Generate evidence
    const evidence = this.generateEvidence(achievement, metrics, context);

    // Create celebration
    const celebration = this.createCelebration(achievement, nextTier);

    return {
      earned: true,
      tier: nextTier,
      evidence,
      progress: 100,
      celebration
    };
  }

  /**
   * Extract metrics relevant to specific achievement
   */
  private static extractAchievementMetrics(
    achievement: Achievement,
    metrics: PerformanceMetrics
  ): Record<string, any> {
    const achievementMetrics: Record<string, any> = {};

    switch (achievement.id) {
      case 'troubleshooting_master':
        achievementMetrics.percentage = metrics.firstContactResolution;
        achievementMetrics.count = metrics.ticketCount;
        achievementMetrics.timeframe = metrics.timeframe;
        break;

      case 'network_specialist':
        achievementMetrics.count = metrics.categorySpecific.network || 0;
        achievementMetrics.rating = metrics.technicalAccuracy;
        achievementMetrics.timeframe = metrics.timeframe;
        break;

      case 'security_guardian':
        achievementMetrics.securityIssues = metrics.categorySpecific.security || 0;
        achievementMetrics.securityEducation = metrics.knowledgeSharingCount || 0;
        break;

      case 'customer_champion':
        achievementMetrics.percentage = metrics.customerSatisfaction;
        achievementMetrics.minTickets = metrics.ticketCount;
        achievementMetrics.timeframe = metrics.timeframe;
        break;

      case 'communication_expert':
        achievementMetrics.rating = metrics.communicationRating;
        achievementMetrics.timeframe = metrics.timeframe;
        break;

      case 'process_professional':
        achievementMetrics.percentage = metrics.processAdherence;
        achievementMetrics.timeframe = metrics.timeframe;
        break;

      case 'learning_leader':
        achievementMetrics.count = metrics.skillDemonstrationsCount;
        achievementMetrics.timeframe = metrics.timeframe;
        break;

      case 'mentor_master':
        achievementMetrics.mentoring = metrics.mentoringCount;
        achievementMetrics.knowledgeSharing = metrics.knowledgeSharingCount;
        break;

      case 'innovation_pioneer':
        achievementMetrics.count = metrics.innovationCount;
        achievementMetrics.impact = this.calculateInnovationImpact(metrics);
        break;

      default:
        // Generic mapping
        achievementMetrics.count = metrics.ticketCount;
        achievementMetrics.percentage = metrics.qualityScore;
        achievementMetrics.rating = metrics.professionalismRating;
    }

    return achievementMetrics;
  }

  /**
   * Calculate innovation impact level
   */
  private static calculateInnovationImpact(metrics: PerformanceMetrics): string {
    const innovationScore = metrics.innovationCount * (metrics.qualityScore / 100);
    
    if (innovationScore >= 10) return 'transformative';
    if (innovationScore >= 5) return 'significant';
    return 'positive';
  }

  /**
   * Generate evidence for achievement earning
   */
  private static generateEvidence(
    achievement: Achievement,
    metrics: PerformanceMetrics,
    context: AchievementContext
  ): AchievementEvidence[] {
    const evidence: AchievementEvidence[] = [];

    // Performance metric evidence
    evidence.push({
      type: 'performance_metric',
      reference: `${achievement.category}_performance`,
      value: metrics.qualityScore,
      date: new Date(),
      description: `Demonstrated ${achievement.category.replace('_', ' ')} performance with quality score of ${metrics.qualityScore}%`
    });

    // Activity-based evidence
    if (context.recentActivity.length > 0) {
      const relevantActivity = context.recentActivity
        .filter(activity => this.isActivityRelevant(activity, achievement))
        .slice(0, 3);

      relevantActivity.forEach((activity, index) => {
        evidence.push({
          type: 'ticket',
          reference: `activity_${index}`,
          value: activity.value,
          date: activity.date,
          description: `${activity.type} with quality score ${activity.quality}/5`
        });
      });
    }

    // Customer feedback evidence (for customer service achievements)
    if (achievement.category === 'customer_service' && metrics.customerSatisfaction >= 95) {
      evidence.push({
        type: 'customer_feedback',
        reference: 'customer_satisfaction',
        value: metrics.customerSatisfaction,
        date: new Date(),
        description: `Achieved ${metrics.customerSatisfaction}% customer satisfaction rating`
      });
    }

    return evidence;
  }

  /**
   * Check if activity is relevant to achievement
   */
  private static isActivityRelevant(activity: ActivityRecord, achievement: Achievement): boolean {
    const activityType = activity.type.toLowerCase();
    const category = achievement.category;

    const relevanceMap = {
      technical_skills: ['troubleshoot', 'diagnose', 'repair', 'configure', 'install'],
      customer_service: ['communicate', 'support', 'satisfy', 'resolve', 'assist'],
      professional_behavior: ['document', 'follow', 'process', 'quality', 'standard'],
      leadership: ['mentor', 'lead', 'guide', 'teach', 'share'],
      learning: ['learn', 'study', 'practice', 'improve', 'innovate']
    };

    const relevantKeywords = relevanceMap[category] || [];
    return relevantKeywords.some(keyword => activityType.includes(keyword));
  }

  /**
   * Create celebration data for earned achievement
   */
  private static createCelebration(achievement: Achievement, tier: AchievementTier): CelebrationData {
    const tierNames = {
      bronze: 'Bronze',
      silver: 'Silver', 
      gold: 'Gold',
      platinum: 'Platinum'
    };

    const professionalImpact = this.getProfessionalImpact(achievement, tier);

    return {
      title: `🏆 ${achievement.name} (${tierNames[tier]}) Earned!`,
      message: `Congratulations! You've demonstrated ${achievement.professionalValue.competencyLevel} competency in ${achievement.description.toLowerCase()}. This achievement showcases your ${achievement.professionalValue.skillsDisplayed.join(', ')} skills.`,
      rarity: achievement.rarity,
      professionalImpact,
      shareableContent: {
        linkedIn: `🎉 Proud to announce I've earned the ${achievement.name} (${tierNames[tier]}) achievement! This recognizes my ${achievement.professionalValue.skillsDisplayed.join(', ')} skills in IT support. ${achievement.portfolioDescription} #ITSupport #ProfessionalDevelopment #Achievement`,
        twitter: `🏆 Just earned ${achievement.name} (${tierNames[tier]}) achievement! Demonstrates ${achievement.professionalValue.skillsDisplayed[0]} expertise. #ITSupport #Achievement`,
        resumeLine: achievement.resumeBulletPoint
      }
    };
  }

  /**
   * Get professional impact description
   */
  private static getProfessionalImpact(achievement: Achievement, tier: AchievementTier): string {
    const tierImpacts = {
      bronze: 'demonstrates basic competency',
      silver: 'shows consistent professional performance',
      gold: 'indicates exceptional expertise',
      platinum: 'represents mastery-level achievement'
    };

    const careerImpacts = {
      entry: 'valuable for entry-level positions',
      mid: 'strengthens mid-level career prospects',
      senior: 'supports senior role qualification',
      leadership: 'demonstrates leadership readiness'
    };

    return `This ${tierImpacts[tier]} and ${careerImpacts[achievement.professionalValue.careerRelevance]}. Industry value: ${achievement.professionalValue.industryValue}/10.`;
  }

  /**
   * Get tier numeric value for comparison
   */
  private static getTierValue(tier: AchievementTier): number {
    const values = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4
    };
    return values[tier] || 0;
  }

  /**
   * Get next tier to check
   */
  private static getNextTier(currentTier?: AchievementTier): AchievementTier | null {
    if (!currentTier) return AchievementTier.BRONZE;
    
    const progression = {
      bronze: AchievementTier.SILVER,
      silver: AchievementTier.GOLD,
      gold: AchievementTier.PLATINUM,
      platinum: null
    };

    return progression[currentTier] || null;
  }

  /**
   * Create empty earning result
   */
  private static createNoEarningResult(): EarningResult {
    return {
      earned: false,
      tier: AchievementTier.BRONZE,
      evidence: [],
      progress: 0,
      celebration: this.createEmptyCelebration()
    };
  }

  /**
   * Create empty celebration
   */
  private static createEmptyCelebration(): CelebrationData {
    return {
      title: '',
      message: '',
      rarity: 'common',
      professionalImpact: '',
      shareableContent: {
        linkedIn: '',
        twitter: '',
        resumeLine: ''
      }
    };
  }

  /**
   * Process bulk achievement check for user
   */
  static async processBulkAchievementCheck(
    userId: string,
    metrics: PerformanceMetrics,
    context: AchievementContext
  ): Promise<{
    newAchievements: EarningResult[];
    totalEarned: number;
    newTiers: number;
    celebrationSummary: string;
  }> {
    const newAchievements = await this.checkAchievementEarning(userId, metrics, context);
    
    const newTiers = newAchievements.filter(result => result.earned).length;
    const totalEarned = newAchievements.length;

    let celebrationSummary = '';
    if (newTiers > 0) {
      const tierCounts = newAchievements.reduce((acc, result) => {
        if (result.earned) {
          acc[result.tier] = (acc[result.tier] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const summaryParts = Object.entries(tierCounts).map(([tier, count]) => 
        `${count} ${tier.charAt(0).toUpperCase() + tier.slice(1)}`
      );

      celebrationSummary = `Earned ${summaryParts.join(', ')} achievement${newTiers > 1 ? 's' : ''}!`;
    }

    return {
      newAchievements,
      totalEarned,
      newTiers,
      celebrationSummary
    };
  }

  /**
   * Validate achievement criteria configuration
   */
  static validateAchievementCriteria(achievement: Achievement): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check that all tiers have requirements
    const requiredTiers = [AchievementTier.BRONZE, AchievementTier.SILVER, AchievementTier.GOLD];
    
    for (const tier of requiredTiers) {
      if (!achievement.criteria.requirements[tier]) {
        errors.push(`Missing requirements for ${tier} tier`);
      } else {
        const req = achievement.criteria.requirements[tier];
        if (req.threshold <= 0) {
          errors.push(`Invalid threshold for ${tier} tier: must be positive`);
        }
      }
    }

    // Check tier progression (each tier should be harder than the previous)
    const tiers = [AchievementTier.BRONZE, AchievementTier.SILVER, AchievementTier.GOLD, AchievementTier.PLATINUM];
    for (let i = 1; i < tiers.length; i++) {
      const currentReq = achievement.criteria.requirements[tiers[i]];
      const previousReq = achievement.criteria.requirements[tiers[i-1]];
      
      if (currentReq && previousReq && currentReq.threshold <= previousReq.threshold) {
        errors.push(`Tier progression error: ${tiers[i]} threshold should be higher than ${tiers[i-1]}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}