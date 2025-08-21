/**
 * Point Values Service
 * Defines and manages the point economy system
 */

export interface PointValue {
  id: string;
  activityType: string;
  basePoints: number;
  description: string;
  category: 'core' | 'bonus' | 'skill' | 'engagement';
  minimumRequirements?: string[];
  scalingFactors?: ScalingFactor[];
  lastUpdated: Date;
}

export interface ScalingFactor {
  factor: string;
  description: string;
  multiplier: number;
  condition: string;
}

export interface PointEconomy {
  version: string;
  pointValues: PointValue[];
  difficultyMultipliers: Record<string, number>;
  performanceMultipliers: Record<string, number>;
  bonusValues: Record<string, number>;
  balanceMetrics: EconomyBalance;
  lastReview: Date;
}

export interface EconomyBalance {
  averageXPPerHour: number;
  timeToLevel1: number; // hours
  timeToLevel5: number; // hours
  timeToLevel10: number; // hours
  inflationRate: number;
  engagementOptimal: boolean;
}

export interface ActivityPointStructure {
  ticketCompletion: {
    base: number;
    difficulty: Record<string, number>;
    performance: Record<string, number>;
    maxPossible: number;
  };
  skillDemonstration: {
    base: number;
    categories: Record<string, number>;
    mastery: Record<string, number>;
  };
  engagement: {
    daily: number;
    weekly: number;
    streak: Record<string, number>;
  };
}

class PointValuesService {
  private currentEconomy: PointEconomy;

  constructor() {
    this.currentEconomy = this.initializePointEconomy();
  }

  /**
   * Get current point values system
   */
  async getPointValues(): Promise<PointValue[]> {
    return this.currentEconomy.pointValues;
  }

  /**
   * Get point value for specific activity
   */
  async getActivityPointValue(activityType: string): Promise<PointValue | null> {
    return this.currentEconomy.pointValues.find(pv => pv.activityType === activityType) || null;
  }

  /**
   * Get complete point economy configuration
   */
  async getPointEconomy(): Promise<PointEconomy> {
    return this.currentEconomy;
  }

  /**
   * Get activity point structure
   */
  async getActivityPointStructure(): Promise<ActivityPointStructure> {
    return {
      ticketCompletion: {
        base: 20,
        difficulty: {
          starter: 20,
          intermediate: 30,
          advanced: 40
        },
        performance: {
          poor: 10,
          acceptable: 20,
          good: 25,
          excellent: 30
        },
        maxPossible: 85 // Base + difficulty + performance + bonuses
      },
      skillDemonstration: {
        base: 10,
        categories: {
          technical: 12,
          communication: 8,
          process: 6,
          customer_service: 10,
          problem_solving: 14
        },
        mastery: {
          novice: 5,
          competent: 10,
          proficient: 15,
          expert: 20,
          master: 25
        }
      },
      engagement: {
        daily: 2,
        weekly: 10,
        streak: {
          '3_days': 5,
          '7_days': 15,
          '14_days': 30,
          '30_days': 50
        }
      }
    };
  }

  /**
   * Calculate balanced point distribution
   */
  async calculateBalancedDistribution(
    targetLevelTime: number, // hours to reach level 1
    averageSessionTime: number, // minutes per session
    sessionFrequency: number // sessions per week
  ): Promise<{
    recommendedBasePoints: Record<string, number>;
    multiplierAdjustments: Record<string, number>;
    balancePrediction: EconomyBalance;
  }> {
    const targetXPPerLevel = 1000;
    const targetXPPerHour = targetXPPerLevel / targetLevelTime;
    
    // Calculate points needed per session
    const sessionsPerHour = 60 / averageSessionTime;
    const xpPerSession = targetXPPerHour / sessionsPerHour;
    
    // Assume average 2-3 activities per session
    const activitiesPerSession = 2.5;
    const xpPerActivity = xpPerSession / activitiesPerSession;

    // Distribute across activity types based on frequency
    const activityFrequencies = {
      ticket_completion: 0.6, // 60% of activities
      verification: 0.15,     // 15% of activities
      documentation: 0.1,     // 10% of activities
      customer_communication: 0.1, // 10% of activities
      learning_progress: 0.05  // 5% of activities
    };

    const recommendedBasePoints: Record<string, number> = {};
    for (const [activity, frequency] of Object.entries(activityFrequencies)) {
      recommendedBasePoints[activity] = Math.round(xpPerActivity * frequency * 10);
    }

    // Calculate multiplier adjustments
    const multiplierAdjustments = {
      difficulty: 1.5, // Advanced scenarios worth 50% more
      performance: 1.25, // Excellent performance worth 25% more
      bonus: 0.3 // Bonuses add 30% to base on average
    };

    const balancePrediction: EconomyBalance = {
      averageXPPerHour: targetXPPerHour,
      timeToLevel1: targetLevelTime,
      timeToLevel5: targetLevelTime * 7, // Exponential scaling
      timeToLevel10: targetLevelTime * 20,
      inflationRate: 0, // Stable economy
      engagementOptimal: true
    };

    return {
      recommendedBasePoints,
      multiplierAdjustments,
      balancePrediction
    };
  }

  /**
   * Validate point economy balance
   */
  async validateEconomyBalance(): Promise<{
    balanced: boolean;
    issues: string[];
    recommendations: string[];
    metrics: EconomyBalance;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if point values are too high/low
    const ticketPoints = this.currentEconomy.pointValues.find(pv => pv.activityType === 'ticket_completion');
    if (ticketPoints && ticketPoints.basePoints < 15) {
      issues.push('Ticket completion points too low - may not provide sufficient motivation');
      recommendations.push('Increase base ticket completion points to 15-25 range');
    }
    if (ticketPoints && ticketPoints.basePoints > 30) {
      issues.push('Ticket completion points too high - may cause rapid progression');
      recommendations.push('Reduce base ticket completion points to 15-25 range');
    }

    // Check difficulty scaling
    const difficultyRange = Math.max(...Object.values(this.currentEconomy.difficultyMultipliers)) - 
                           Math.min(...Object.values(this.currentEconomy.difficultyMultipliers));
    if (difficultyRange < 0.8) {
      issues.push('Difficulty multipliers too narrow - insufficient incentive for harder scenarios');
      recommendations.push('Increase difficulty multiplier range (e.g., 1.0x to 2.0x)');
    }

    // Check bonus balance
    const totalBonusValue = Object.values(this.currentEconomy.bonusValues).reduce((sum, bonus) => sum + bonus, 0);
    const averageBaseValue = this.currentEconomy.pointValues.reduce((sum, pv) => sum + pv.basePoints, 0) / 
                            this.currentEconomy.pointValues.length;
    
    if (totalBonusValue > averageBaseValue * 2) {
      issues.push('Bonus values too high relative to base points');
      recommendations.push('Reduce bonus values to maintain base activity focus');
    }

    const balanced = issues.length === 0;
    const metrics = await this.calculateCurrentBalance();

    return {
      balanced,
      issues,
      recommendations,
      metrics
    };
  }

  /**
   * Update point values (admin function)
   */
  async updatePointValues(updates: Partial<PointValue>[]): Promise<PointEconomy> {
    for (const update of updates) {
      const existingIndex = this.currentEconomy.pointValues.findIndex(pv => pv.id === update.id);
      if (existingIndex !== -1) {
        this.currentEconomy.pointValues[existingIndex] = {
          ...this.currentEconomy.pointValues[existingIndex],
          ...update,
          lastUpdated: new Date()
        };
      }
    }

    this.currentEconomy.lastReview = new Date();
    this.currentEconomy.balanceMetrics = await this.calculateCurrentBalance();
    
    return this.currentEconomy;
  }

  /**
   * Get point value history and trends
   */
  async getPointValueTrends(): Promise<{
    activityType: string;
    currentValue: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    recommendation: string;
  }[]> {
    // In a real implementation, this would analyze historical data
    // For now, return static analysis based on current values
    
    return this.currentEconomy.pointValues.map(pv => ({
      activityType: pv.activityType,
      currentValue: pv.basePoints,
      trend: 'stable' as const,
      changePercent: 0,
      recommendation: `Current ${pv.basePoints} points appears balanced for ${pv.activityType}`
    }));
  }

  /**
   * Calculate optimal point values for target progression
   */
  async calculateOptimalValues(
    targetProgression: {
      hoursToLevel1: number;
      averageSessionDuration: number;
      sessionsPerWeek: number;
      retentionGoal: number; // percentage
    }
  ): Promise<{
    optimizedValues: Record<string, number>;
    projectedOutcomes: {
      levelProgression: number[];
      engagementScore: number;
      retentionPrediction: number;
    };
  }> {
    const xpPerLevel = 1000;
    const targetXPPerHour = xpPerLevel / targetProgression.hoursToLevel1;
    
    // Calculate session-based metrics
    const minutesPerSession = targetProgression.averageSessionDuration;
    const hoursPerSession = minutesPerSession / 60;
    const sessionsPerHour = 1 / hoursPerSession;
    const xpPerSession = targetXPPerHour / sessionsPerHour;

    // Optimize based on activity distribution
    const activityDistribution = {
      ticket_completion: 0.5,
      verification: 0.2,
      documentation: 0.15,
      customer_communication: 0.1,
      learning_progress: 0.05
    };

    const optimizedValues: Record<string, number> = {};
    for (const [activity, distribution] of Object.entries(activityDistribution)) {
      optimizedValues[activity] = Math.round(xpPerSession * distribution);
    }

    // Project outcomes
    const levelProgression = [];
    for (let level = 1; level <= 10; level++) {
      const hoursNeeded = (level * xpPerLevel) / targetXPPerHour;
      levelProgression.push(hoursNeeded);
    }

    const engagementScore = this.calculateEngagementScore(optimizedValues);
    const retentionPrediction = Math.min(95, engagementScore * 1.2);

    return {
      optimizedValues,
      projectedOutcomes: {
        levelProgression,
        engagementScore,
        retentionPrediction
      }
    };
  }

  /**
   * Initialize point economy system
   */
  private initializePointEconomy(): PointEconomy {
    const pointValues: PointValue[] = [
      {
        id: 'ticket_completion',
        activityType: 'ticket_completion',
        basePoints: 20,
        description: 'Successfully completing a support ticket from start to finish',
        category: 'core',
        minimumRequirements: ['Customer verification', 'Problem resolution', 'Documentation'],
        scalingFactors: [
          {
            factor: 'difficulty',
            description: 'Scenario complexity multiplier',
            multiplier: 1.5,
            condition: 'Advanced scenarios'
          },
          {
            factor: 'performance',
            description: 'Quality of execution multiplier',
            multiplier: 1.25,
            condition: 'Excellent performance rating'
          }
        ],
        lastUpdated: new Date()
      },
      {
        id: 'verification_success',
        activityType: 'verification',
        basePoints: 8,
        description: 'Successfully verifying customer identity and authorization',
        category: 'core',
        minimumRequirements: ['Identity confirmation', 'Authorization check'],
        lastUpdated: new Date()
      },
      {
        id: 'documentation',
        activityType: 'documentation',
        basePoints: 5,
        description: 'Creating quality documentation for knowledge sharing',
        category: 'skill',
        minimumRequirements: ['Complete information', 'Clear structure'],
        lastUpdated: new Date()
      },
      {
        id: 'customer_communication',
        activityType: 'customer_communication',
        basePoints: 3,
        description: 'Professional and effective customer communication',
        category: 'skill',
        minimumRequirements: ['Professional tone', 'Clear explanation'],
        lastUpdated: new Date()
      },
      {
        id: 'learning_progress',
        activityType: 'learning_progress',
        basePoints: 10,
        description: 'Demonstrating skill development and knowledge acquisition',
        category: 'skill',
        minimumRequirements: ['Skill improvement', 'Knowledge application'],
        lastUpdated: new Date()
      },
      {
        id: 'knowledge_search',
        activityType: 'knowledge_search',
        basePoints: 2,
        description: 'Effective use of knowledge base and research skills',
        category: 'engagement',
        minimumRequirements: ['Relevant search', 'Applied knowledge'],
        lastUpdated: new Date()
      }
    ];

    const difficultyMultipliers = {
      starter: 1.0,
      intermediate: 1.5,
      advanced: 2.0
    };

    const performanceMultipliers = {
      poor: 0.5,
      acceptable: 1.0,
      good: 1.25,
      excellent: 1.5
    };

    const bonusValues = {
      perfect_verification: 10,
      outstanding_customer_service: 15,
      technical_excellence: 12,
      first_try_resolution: 8,
      knowledge_sharing: 5,
      speed_bonus: 5,
      innovation_bonus: 8,
      consistency_bonus: 3
    };

    const balanceMetrics: EconomyBalance = {
      averageXPPerHour: 75,
      timeToLevel1: 13.3, // hours
      timeToLevel5: 93, // hours
      timeToLevel10: 267, // hours
      inflationRate: 0,
      engagementOptimal: true
    };

    return {
      version: '1.0',
      pointValues,
      difficultyMultipliers,
      performanceMultipliers,
      bonusValues,
      balanceMetrics,
      lastReview: new Date()
    };
  }

  /**
   * Calculate current economy balance
   */
  private async calculateCurrentBalance(): Promise<EconomyBalance> {
    // Calculate based on current point values
    const avgTicketPoints = 20 * 1.5 * 1.25; // Base * avg difficulty * avg performance
    const avgSessionXP = avgTicketPoints * 2.5; // 2.5 activities per session
    const avgSessionTime = 30; // minutes
    const averageXPPerHour = avgSessionXP * (60 / avgSessionTime);

    return {
      averageXPPerHour,
      timeToLevel1: 1000 / averageXPPerHour,
      timeToLevel5: 5000 / averageXPPerHour,
      timeToLevel10: 10000 / averageXPPerHour,
      inflationRate: 0,
      engagementOptimal: averageXPPerHour >= 60 && averageXPPerHour <= 100
    };
  }

  /**
   * Calculate engagement score from point values
   */
  private calculateEngagementScore(pointValues: Record<string, number>): number {
    // Simple engagement scoring based on point balance
    const ticketPoints = pointValues.ticket_completion || 20;
    const bonusPoints = (pointValues.verification || 8) + (pointValues.documentation || 5);
    
    // Engagement is optimal when core activities provide good value but bonuses encourage quality
    const coreToBonus = ticketPoints / bonusPoints;
    const engagementScore = Math.min(100, Math.max(0, 
      100 - Math.abs(coreToBonus - 1.5) * 20 // Optimal ratio is 1.5:1
    ));

    return Math.round(engagementScore);
  }

  /**
   * Get point earning opportunities
   */
  async getPointEarningOpportunities(): Promise<{
    daily: { activity: string; points: number; description: string }[];
    weekly: { activity: string; points: number; description: string }[];
    milestone: { achievement: string; points: number; description: string }[];
  }> {
    return {
      daily: [
        {
          activity: 'Complete 3 tickets',
          points: 60,
          description: 'Complete three support tickets with good performance'
        },
        {
          activity: 'Perfect verification',
          points: 10,
          description: 'Successfully verify customer identity without errors'
        },
        {
          activity: 'Document solution',
          points: 5,
          description: 'Create quality documentation for a resolved issue'
        }
      ],
      weekly: [
        {
          activity: 'Maintain 85% performance',
          points: 50,
          description: 'Keep overall performance above 85% for the week'
        },
        {
          activity: 'Complete 15 tickets',
          points: 100,
          description: 'Successfully complete 15 support tickets in one week'
        },
        {
          activity: 'Share knowledge',
          points: 25,
          description: 'Help others or contribute to knowledge base'
        }
      ],
      milestone: [
        {
          achievement: 'First 100 XP',
          points: 20,
          description: 'Bonus for reaching first 100 XP milestone'
        },
        {
          achievement: 'Level 1 Achievement',
          points: 100,
          description: 'Bonus for reaching Level 1 (1000 XP)'
        },
        {
          achievement: 'Perfect Week',
          points: 150,
          description: 'Complete a week with all perfect scores'
        }
      ]
    };
  }
}

export const pointValuesService = new PointValuesService();
export default pointValuesService;