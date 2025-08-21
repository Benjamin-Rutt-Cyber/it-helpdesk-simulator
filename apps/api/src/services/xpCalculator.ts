/**
 * XP Calculator Service
 * Dynamic XP calculation algorithms with performance-based weighting
 */

export interface PerformanceMetrics {
  technicalAccuracy: number; // 0-100
  communicationQuality: number; // 0-100
  verificationSuccess: boolean;
  customerSatisfaction: number; // 0-100
  processCompliance: number; // 0-100
  resolutionTime: number; // minutes
  firstTimeResolution: boolean;
  knowledgeSharing: boolean;
}

export interface ActivityData {
  type: 'ticket_completion' | 'verification' | 'documentation' | 'customer_communication' | 'learning_progress' | 'knowledge_search';
  scenarioDifficulty: 'starter' | 'intermediate' | 'advanced';
  performanceMetrics: PerformanceMetrics;
  additionalContext?: Record<string, any>;
}

export interface XPCalculationResult {
  totalXP: number;
  baseXP: number;
  difficultyMultiplier: number;
  performanceMultiplier: number;
  bonusXP: number;
  breakdown: XPBreakdown;
  explanations: string[];
}

export interface XPBreakdown {
  activity: {
    type: string;
    basePoints: number;
  };
  difficulty: {
    level: string;
    multiplier: number;
    adjustedPoints: number;
  };
  performance: {
    overall: number;
    multiplier: number;
    adjustedPoints: number;
  };
  bonuses: BonusDetail[];
  final: {
    totalXP: number;
    reasoning: string;
  };
}

export interface BonusDetail {
  type: string;
  points: number;
  reason: string;
  criteria: string;
}

class XPCalculatorService {
  // Base XP values for different activities
  private readonly BASE_XP_VALUES = {
    ticket_completion: 20,
    verification: 8,
    documentation: 5,
    customer_communication: 3,
    learning_progress: 10,
    knowledge_search: 2
  };

  // Difficulty multipliers
  private readonly DIFFICULTY_MULTIPLIERS = {
    starter: 1.0,
    intermediate: 1.5,
    advanced: 2.0
  };

  // Performance thresholds and multipliers
  private readonly PERFORMANCE_THRESHOLDS = {
    poor: { max: 40, multiplier: 0.5 },
    acceptable: { max: 70, multiplier: 1.0 },
    good: { max: 85, multiplier: 1.25 },
    excellent: { max: 100, multiplier: 1.5 }
  };

  // Bonus XP values
  private readonly BONUS_VALUES = {
    perfect_verification: 10,
    outstanding_customer_service: 15,
    technical_excellence: 12,
    first_try_resolution: 8,
    knowledge_sharing: 5,
    speed_bonus: 5,
    innovation_bonus: 8,
    consistency_bonus: 3
  };

  /**
   * Calculate XP for a given activity
   */
  async calculateXP(activityData: ActivityData): Promise<XPCalculationResult> {
    const baseXP = this.getBaseXP(activityData.type);
    const difficultyMultiplier = this.getDifficultyMultiplier(activityData.scenarioDifficulty);
    const performanceMultiplier = this.calculatePerformanceMultiplier(activityData.performanceMetrics);
    const bonusXP = this.calculateBonusXP(activityData);

    const totalXP = Math.round(
      (baseXP * difficultyMultiplier * performanceMultiplier) + bonusXP
    );

    const breakdown = this.createBreakdown(
      activityData,
      baseXP,
      difficultyMultiplier,
      performanceMultiplier,
      bonusXP,
      totalXP
    );

    const explanations = this.generateExplanations(breakdown);

    return {
      totalXP,
      baseXP,
      difficultyMultiplier,
      performanceMultiplier,
      bonusXP,
      breakdown,
      explanations
    };
  }

  /**
   * Get base XP for activity type
   */
  private getBaseXP(activityType: ActivityData['type']): number {
    return this.BASE_XP_VALUES[activityType] || 0;
  }

  /**
   * Get difficulty multiplier
   */
  private getDifficultyMultiplier(difficulty: ActivityData['scenarioDifficulty']): number {
    return this.DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
  }

  /**
   * Calculate performance multiplier based on metrics
   */
  private calculatePerformanceMultiplier(metrics: PerformanceMetrics): number {
    // Calculate overall performance score
    const weights = {
      technicalAccuracy: 0.3,
      communicationQuality: 0.25,
      customerSatisfaction: 0.25,
      processCompliance: 0.2
    };

    const overallScore = (
      metrics.technicalAccuracy * weights.technicalAccuracy +
      metrics.communicationQuality * weights.communicationQuality +
      metrics.customerSatisfaction * weights.customerSatisfaction +
      metrics.processCompliance * weights.processCompliance
    );

    // Determine performance tier and multiplier
    for (const [tier, config] of Object.entries(this.PERFORMANCE_THRESHOLDS)) {
      if (overallScore <= config.max) {
        return config.multiplier;
      }
    }

    return this.PERFORMANCE_THRESHOLDS.excellent.multiplier;
  }

  /**
   * Calculate bonus XP
   */
  private calculateBonusXP(activityData: ActivityData): number {
    let bonusXP = 0;
    const metrics = activityData.performanceMetrics;

    // Perfect verification bonus
    if (metrics.verificationSuccess && metrics.technicalAccuracy >= 95) {
      bonusXP += this.BONUS_VALUES.perfect_verification;
    }

    // Outstanding customer service bonus
    if (metrics.customerSatisfaction >= 90 && metrics.communicationQuality >= 85) {
      bonusXP += this.BONUS_VALUES.outstanding_customer_service;
    }

    // Technical excellence bonus
    if (metrics.technicalAccuracy >= 90 && metrics.processCompliance >= 85) {
      bonusXP += this.BONUS_VALUES.technical_excellence;
    }

    // First-try resolution bonus
    if (metrics.firstTimeResolution) {
      bonusXP += this.BONUS_VALUES.first_try_resolution;
    }

    // Knowledge sharing bonus
    if (metrics.knowledgeSharing) {
      bonusXP += this.BONUS_VALUES.knowledge_sharing;
    }

    // Speed bonus (if resolved efficiently)
    if (activityData.type === 'ticket_completion' && metrics.resolutionTime <= 30) {
      bonusXP += this.BONUS_VALUES.speed_bonus;
    }

    // Innovation bonus (high performance with creative approach)
    if (metrics.technicalAccuracy >= 85 && metrics.customerSatisfaction >= 85 && 
        activityData.additionalContext?.innovativeApproach) {
      bonusXP += this.BONUS_VALUES.innovation_bonus;
    }

    return bonusXP;
  }

  /**
   * Create detailed XP breakdown
   */
  private createBreakdown(
    activityData: ActivityData,
    baseXP: number,
    difficultyMultiplier: number,
    performanceMultiplier: number,
    bonusXP: number,
    totalXP: number
  ): XPBreakdown {
    const adjustedForDifficulty = Math.round(baseXP * difficultyMultiplier);
    const adjustedForPerformance = Math.round(adjustedForDifficulty * performanceMultiplier);
    
    const bonuses = this.getBonusDetails(activityData);

    return {
      activity: {
        type: activityData.type.replace('_', ' ').toUpperCase(),
        basePoints: baseXP
      },
      difficulty: {
        level: activityData.scenarioDifficulty.toUpperCase(),
        multiplier: difficultyMultiplier,
        adjustedPoints: adjustedForDifficulty
      },
      performance: {
        overall: this.calculateOverallPerformanceScore(activityData.performanceMetrics),
        multiplier: performanceMultiplier,
        adjustedPoints: adjustedForPerformance
      },
      bonuses,
      final: {
        totalXP,
        reasoning: `Base (${baseXP}) × Difficulty (${difficultyMultiplier}x) × Performance (${performanceMultiplier}x) + Bonuses (${bonusXP}) = ${totalXP} XP`
      }
    };
  }

  /**
   * Calculate overall performance score for display
   */
  private calculateOverallPerformanceScore(metrics: PerformanceMetrics): number {
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
   * Get detailed bonus information
   */
  private getBonusDetails(activityData: ActivityData): BonusDetail[] {
    const bonuses: BonusDetail[] = [];
    const metrics = activityData.performanceMetrics;

    if (metrics.verificationSuccess && metrics.technicalAccuracy >= 95) {
      bonuses.push({
        type: 'Perfect Verification',
        points: this.BONUS_VALUES.perfect_verification,
        reason: 'Achieved perfect customer verification with high technical accuracy',
        criteria: 'Verification success + Technical accuracy ≥ 95%'
      });
    }

    if (metrics.customerSatisfaction >= 90 && metrics.communicationQuality >= 85) {
      bonuses.push({
        type: 'Outstanding Customer Service',
        points: this.BONUS_VALUES.outstanding_customer_service,
        reason: 'Delivered exceptional customer service experience',
        criteria: 'Customer satisfaction ≥ 90% + Communication quality ≥ 85%'
      });
    }

    if (metrics.technicalAccuracy >= 90 && metrics.processCompliance >= 85) {
      bonuses.push({
        type: 'Technical Excellence',
        points: this.BONUS_VALUES.technical_excellence,
        reason: 'Demonstrated outstanding technical competency',
        criteria: 'Technical accuracy ≥ 90% + Process compliance ≥ 85%'
      });
    }

    if (metrics.firstTimeResolution) {
      bonuses.push({
        type: 'First-Try Resolution',
        points: this.BONUS_VALUES.first_try_resolution,
        reason: 'Resolved issue on first attempt without escalation',
        criteria: 'Issue resolved without requiring additional attempts'
      });
    }

    if (metrics.knowledgeSharing) {
      bonuses.push({
        type: 'Knowledge Sharing',
        points: this.BONUS_VALUES.knowledge_sharing,
        reason: 'Contributed knowledge or helped others learn',
        criteria: 'Demonstrated knowledge sharing behavior'
      });
    }

    if (activityData.type === 'ticket_completion' && metrics.resolutionTime <= 30) {
      bonuses.push({
        type: 'Speed Bonus',
        points: this.BONUS_VALUES.speed_bonus,
        reason: 'Completed ticket efficiently within time expectations',
        criteria: 'Resolution time ≤ 30 minutes'
      });
    }

    if (metrics.technicalAccuracy >= 85 && metrics.customerSatisfaction >= 85 && 
        activityData.additionalContext?.innovativeApproach) {
      bonuses.push({
        type: 'Innovation Bonus',
        points: this.BONUS_VALUES.innovation_bonus,
        reason: 'Used creative problem-solving approach',
        criteria: 'High performance + innovative solution approach'
      });
    }

    return bonuses;
  }

  /**
   * Generate human-readable explanations
   */
  private generateExplanations(breakdown: XPBreakdown): string[] {
    const explanations: string[] = [];

    // Activity explanation
    explanations.push(
      `You earned ${breakdown.activity.basePoints} base XP for completing a ${breakdown.activity.type.toLowerCase()} activity.`
    );

    // Difficulty explanation
    if (breakdown.difficulty.multiplier !== 1.0) {
      explanations.push(
        `Your XP was ${breakdown.difficulty.multiplier > 1.0 ? 'increased' : 'decreased'} by ${breakdown.difficulty.multiplier}x due to ${breakdown.difficulty.level.toLowerCase()} difficulty level.`
      );
    }

    // Performance explanation
    if (breakdown.performance.multiplier !== 1.0) {
      const performanceLevel = breakdown.performance.multiplier >= 1.25 ? 'excellent' : 
                              breakdown.performance.multiplier >= 1.0 ? 'good' : 'needs improvement';
      explanations.push(
        `Your performance score of ${breakdown.performance.overall}% resulted in a ${breakdown.performance.multiplier}x multiplier for ${performanceLevel} performance.`
      );
    }

    // Bonus explanations
    if (breakdown.bonuses.length > 0) {
      explanations.push(
        `You earned ${breakdown.bonuses.reduce((sum, bonus) => sum + bonus.points, 0)} bonus XP for: ${breakdown.bonuses.map(b => b.type).join(', ')}.`
      );
    }

    // Final explanation
    explanations.push(breakdown.final.reasoning);

    return explanations;
  }

  /**
   * Validate XP calculation inputs
   */
  async validateActivityData(activityData: ActivityData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate activity type
    if (!Object.keys(this.BASE_XP_VALUES).includes(activityData.type)) {
      errors.push(`Invalid activity type: ${activityData.type}`);
    }

    // Validate difficulty
    if (!Object.keys(this.DIFFICULTY_MULTIPLIERS).includes(activityData.scenarioDifficulty)) {
      errors.push(`Invalid scenario difficulty: ${activityData.scenarioDifficulty}`);
    }

    // Validate performance metrics
    const metrics = activityData.performanceMetrics;
    if (metrics.technicalAccuracy < 0 || metrics.technicalAccuracy > 100) {
      errors.push('Technical accuracy must be between 0 and 100');
    }
    if (metrics.communicationQuality < 0 || metrics.communicationQuality > 100) {
      errors.push('Communication quality must be between 0 and 100');
    }
    if (metrics.customerSatisfaction < 0 || metrics.customerSatisfaction > 100) {
      errors.push('Customer satisfaction must be between 0 and 100');
    }
    if (metrics.processCompliance < 0 || metrics.processCompliance > 100) {
      errors.push('Process compliance must be between 0 and 100');
    }
    if (metrics.resolutionTime < 0) {
      errors.push('Resolution time cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get XP ranges for activity types
   */
  async getXPRanges(): Promise<Record<string, { min: number; max: number; typical: number }>> {
    const ranges: Record<string, { min: number; max: number; typical: number }> = {};

    for (const [activityType, baseXP] of Object.entries(this.BASE_XP_VALUES)) {
      const minXP = Math.round(baseXP * this.DIFFICULTY_MULTIPLIERS.starter * this.PERFORMANCE_THRESHOLDS.poor.multiplier);
      const maxXP = Math.round(
        baseXP * 
        this.DIFFICULTY_MULTIPLIERS.advanced * 
        this.PERFORMANCE_THRESHOLDS.excellent.multiplier + 
        Object.values(this.BONUS_VALUES).reduce((sum, bonus) => sum + bonus, 0)
      );
      const typicalXP = Math.round(baseXP * this.DIFFICULTY_MULTIPLIERS.intermediate * this.PERFORMANCE_THRESHOLDS.acceptable.multiplier);

      ranges[activityType] = {
        min: minXP,
        max: maxXP,
        typical: typicalXP
      };
    }

    return ranges;
  }

  /**
   * Calculate theoretical maximum XP for perfect performance
   */
  async calculateMaxPossibleXP(activityType: ActivityData['type'], difficulty: ActivityData['scenarioDifficulty']): Promise<number> {
    const baseXP = this.getBaseXP(activityType);
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const maxPerformanceMultiplier = this.PERFORMANCE_THRESHOLDS.excellent.multiplier;
    const maxBonusXP = Object.values(this.BONUS_VALUES).reduce((sum, bonus) => sum + bonus, 0);

    return Math.round((baseXP * difficultyMultiplier * maxPerformanceMultiplier) + maxBonusXP);
  }

  /**
   * Get performance tier from score
   */
  getPerformanceTier(score: number): string {
    for (const [tier, config] of Object.entries(this.PERFORMANCE_THRESHOLDS)) {
      if (score <= config.max) {
        return tier;
      }
    }
    return 'excellent';
  }
}

export const xpCalculatorService = new XPCalculatorService();
export default xpCalculatorService;