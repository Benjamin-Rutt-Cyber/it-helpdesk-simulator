/**
 * Bonus Engine Service
 * Manages bonus XP calculation and distribution
 */

import { PerformanceMetrics, ActivityData } from './xpCalculator';

export interface BonusRule {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'streak' | 'milestone' | 'special';
  bonusPoints: number;
  conditions: BonusCondition[];
  priority: number;
  active: boolean;
  validFrom: Date;
  validUntil?: Date;
}

export interface BonusCondition {
  type: 'performance_threshold' | 'boolean_flag' | 'time_constraint' | 'streak_count' | 'milestone_reached';
  field: string;
  operator: 'gte' | 'lte' | 'eq' | 'ne' | 'contains';
  value: any;
  description: string;
}

export interface BonusApplication {
  ruleId: string;
  bonusPoints: number;
  reason: string;
  appliedAt: Date;
  conditions: string[];
}

export interface StreakData {
  userId: string;
  type: 'completion' | 'quality' | 'perfect' | 'learning';
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
  streakHistory: StreakEntry[];
}

export interface StreakEntry {
  date: Date;
  maintained: boolean;
  activity: string;
  performance?: number;
}

export interface BonusCalculationContext {
  activityData: ActivityData;
  userHistory: ActivityHistory;
  streakData: StreakData[];
  userMilestones: UserMilestone[];
  specialEvents: SpecialEvent[];
}

export interface ActivityHistory {
  userId: string;
  totalActivities: number;
  recentActivities: RecentActivity[];
  averagePerformance: number;
  consecutiveCompletions: number;
}

export interface RecentActivity {
  activityId: string;
  type: string;
  performanceScore: number;
  timestamp: Date;
  bonusesEarned: string[];
}

export interface UserMilestone {
  id: string;
  name: string;
  achieved: boolean;
  achievedAt?: Date;
  progress: number;
  target: number;
}

export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  bonusMultiplier: number;
  startDate: Date;
  endDate: Date;
  conditions?: string[];
}

class BonusEngineService {
  private bonusRules: BonusRule[] = [];
  private streakData: Map<string, StreakData[]> = new Map();

  constructor() {
    this.initializeBonusRules();
  }

  /**
   * Calculate bonus XP for activity
   */
  async calculateBonusXP(context: BonusCalculationContext): Promise<{
    totalBonus: number;
    appliedBonuses: BonusApplication[];
    explanations: string[];
  }> {
    const appliedBonuses: BonusApplication[] = [];
    const explanations: string[] = [];
    let totalBonus = 0;

    // Sort rules by priority (higher priority first)
    const activeRules = this.bonusRules
      .filter(rule => rule.active && this.isRuleValid(rule))
      .sort((a, b) => b.priority - a.priority);

    for (const rule of activeRules) {
      const bonusApplication = await this.evaluateBonusRule(rule, context);
      if (bonusApplication) {
        appliedBonuses.push(bonusApplication);
        totalBonus += bonusApplication.bonusPoints;
        explanations.push(bonusApplication.reason);
      }
    }

    // Apply special event multipliers
    const eventMultiplier = this.calculateEventMultiplier(context.specialEvents);
    if (eventMultiplier > 1.0) {
      const eventBonus = Math.round(totalBonus * (eventMultiplier - 1.0));
      totalBonus += eventBonus;
      explanations.push(`Special event bonus: +${eventBonus} XP (${eventMultiplier}x multiplier)`);
    }

    return {
      totalBonus,
      appliedBonuses,
      explanations
    };
  }

  /**
   * Update streak data for user
   */
  async updateStreakData(
    userId: string, 
    activityType: string, 
    performanceMetrics: PerformanceMetrics
  ): Promise<StreakData[]> {
    let userStreaks = this.streakData.get(userId) || [];

    // Update completion streak
    const completionStreak = this.updateStreak(
      userStreaks.find(s => s.type === 'completion'),
      'completion',
      userId,
      true, // Activity completed
      activityType
    );

    // Update quality streak (performance >= 80%)
    const overallPerformance = this.calculateOverallPerformance(performanceMetrics);
    const qualityStreak = this.updateStreak(
      userStreaks.find(s => s.type === 'quality'),
      'quality',
      userId,
      overallPerformance >= 80,
      activityType,
      overallPerformance
    );

    // Update perfect streak (performance >= 95%)
    const perfectStreak = this.updateStreak(
      userStreaks.find(s => s.type === 'perfect'),
      'perfect',
      userId,
      overallPerformance >= 95,
      activityType,
      overallPerformance
    );

    // Update learning streak (knowledge sharing or skill improvement)
    const learningStreak = this.updateStreak(
      userStreaks.find(s => s.type === 'learning'),
      'learning',
      userId,
      performanceMetrics.knowledgeSharing || this.hasSkillImprovement(performanceMetrics),
      activityType
    );

    // Update the user's streak data
    userStreaks = [completionStreak, qualityStreak, perfectStreak, learningStreak];
    this.streakData.set(userId, userStreaks);

    return userStreaks;
  }

  /**
   * Get user streak information
   */
  async getUserStreaks(userId: string): Promise<StreakData[]> {
    return this.streakData.get(userId) || [];
  }

  /**
   * Get available bonus opportunities
   */
  async getBonusOpportunities(): Promise<{
    performance: BonusRule[];
    streaks: BonusRule[];
    milestones: BonusRule[];
    special: BonusRule[];
  }> {
    const activeRules = this.bonusRules.filter(rule => rule.active && this.isRuleValid(rule));

    return {
      performance: activeRules.filter(rule => rule.category === 'performance'),
      streaks: activeRules.filter(rule => rule.category === 'streak'),
      milestones: activeRules.filter(rule => rule.category === 'milestone'),
      special: activeRules.filter(rule => rule.category === 'special')
    };
  }

  /**
   * Calculate streak bonus eligibility
   */
  async calculateStreakBonuses(userId: string): Promise<{
    eligibleBonuses: BonusRule[];
    currentStreaks: StreakData[];
    recommendations: string[];
  }> {
    const userStreaks = await this.getUserStreaks(userId);
    const streakRules = this.bonusRules.filter(rule => 
      rule.active && rule.category === 'streak' && this.isRuleValid(rule)
    );

    const eligibleBonuses: BonusRule[] = [];
    const recommendations: string[] = [];

    for (const rule of streakRules) {
      const eligible = this.evaluateStreakEligibility(rule, userStreaks);
      if (eligible) {
        eligibleBonuses.push(rule);
      } else {
        const recommendation = this.generateStreakRecommendation(rule, userStreaks);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    }

    return {
      eligibleBonuses,
      currentStreaks: userStreaks,
      recommendations
    };
  }

  /**
   * Add custom bonus rule
   */
  async addBonusRule(rule: Omit<BonusRule, 'id'>): Promise<BonusRule> {
    const newRule: BonusRule = {
      ...rule,
      id: this.generateRuleId(),
    };

    this.bonusRules.push(newRule);
    return newRule;
  }

  /**
   * Update bonus rule
   */
  async updateBonusRule(ruleId: string, updates: Partial<BonusRule>): Promise<BonusRule | null> {
    const ruleIndex = this.bonusRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return null;

    this.bonusRules[ruleIndex] = {
      ...this.bonusRules[ruleIndex],
      ...updates
    };

    return this.bonusRules[ruleIndex];
  }

  /**
   * Get bonus rule statistics
   */
  async getBonusRuleStats(): Promise<{
    totalRules: number;
    activeRules: number;
    rulesByCategory: Record<string, number>;
    averageBonusValue: number;
    mostValuableBonus: BonusRule;
  }> {
    const activeRules = this.bonusRules.filter(rule => rule.active);
    const rulesByCategory: Record<string, number> = {};

    for (const rule of this.bonusRules) {
      rulesByCategory[rule.category] = (rulesByCategory[rule.category] || 0) + 1;
    }

    const averageBonusValue = activeRules.length > 0 
      ? Math.round(activeRules.reduce((sum, rule) => sum + rule.bonusPoints, 0) / activeRules.length)
      : 0;

    const mostValuableBonus = activeRules.reduce((max, rule) => 
      rule.bonusPoints > max.bonusPoints ? rule : max
    , activeRules[0]);

    return {
      totalRules: this.bonusRules.length,
      activeRules: activeRules.length,
      rulesByCategory,
      averageBonusValue,
      mostValuableBonus
    };
  }

  /**
   * Initialize default bonus rules
   */
  private initializeBonusRules(): void {
    this.bonusRules = [
      // Performance Bonuses
      {
        id: 'perfect_verification',
        name: 'Perfect Verification',
        description: 'Successfully verify customer identity with 100% accuracy',
        category: 'performance',
        bonusPoints: 10,
        conditions: [
          {
            type: 'boolean_flag',
            field: 'verificationSuccess',
            operator: 'eq',
            value: true,
            description: 'Verification must be successful'
          },
          {
            type: 'performance_threshold',
            field: 'technicalAccuracy',
            operator: 'gte',
            value: 95,
            description: 'Technical accuracy must be 95% or higher'
          }
        ],
        priority: 8,
        active: true,
        validFrom: new Date()
      },
      {
        id: 'outstanding_customer_service',
        name: 'Outstanding Customer Service',
        description: 'Deliver exceptional customer service experience',
        category: 'performance',
        bonusPoints: 15,
        conditions: [
          {
            type: 'performance_threshold',
            field: 'customerSatisfaction',
            operator: 'gte',
            value: 90,
            description: 'Customer satisfaction must be 90% or higher'
          },
          {
            type: 'performance_threshold',
            field: 'communicationQuality',
            operator: 'gte',
            value: 85,
            description: 'Communication quality must be 85% or higher'
          }
        ],
        priority: 9,
        active: true,
        validFrom: new Date()
      },
      {
        id: 'technical_excellence',
        name: 'Technical Excellence',
        description: 'Demonstrate outstanding technical competency',
        category: 'performance',
        bonusPoints: 12,
        conditions: [
          {
            type: 'performance_threshold',
            field: 'technicalAccuracy',
            operator: 'gte',
            value: 90,
            description: 'Technical accuracy must be 90% or higher'
          },
          {
            type: 'performance_threshold',
            field: 'processCompliance',
            operator: 'gte',
            value: 85,
            description: 'Process compliance must be 85% or higher'
          }
        ],
        priority: 7,
        active: true,
        validFrom: new Date()
      },
      {
        id: 'first_try_resolution',
        name: 'First-Try Resolution',
        description: 'Resolve issue on first attempt without escalation',
        category: 'performance',
        bonusPoints: 8,
        conditions: [
          {
            type: 'boolean_flag',
            field: 'firstTimeResolution',
            operator: 'eq',
            value: true,
            description: 'Issue must be resolved on first attempt'
          }
        ],
        priority: 6,
        active: true,
        validFrom: new Date()
      },
      {
        id: 'knowledge_sharing',
        name: 'Knowledge Sharing',
        description: 'Share knowledge or help others learn',
        category: 'performance',
        bonusPoints: 5,
        conditions: [
          {
            type: 'boolean_flag',
            field: 'knowledgeSharing',
            operator: 'eq',
            value: true,
            description: 'Must demonstrate knowledge sharing behavior'
          }
        ],
        priority: 5,
        active: true,
        validFrom: new Date()
      },
      {
        id: 'speed_bonus',
        name: 'Speed Bonus',
        description: 'Complete ticket efficiently within time expectations',
        category: 'performance',
        bonusPoints: 5,
        conditions: [
          {
            type: 'time_constraint',
            field: 'resolutionTime',
            operator: 'lte',
            value: 30,
            description: 'Resolution time must be 30 minutes or less'
          }
        ],
        priority: 4,
        active: true,
        validFrom: new Date()
      },

      // Streak Bonuses
      {
        id: 'consistency_streak_3',
        name: '3-Day Consistency',
        description: 'Maintain activity for 3 consecutive days',
        category: 'streak',
        bonusPoints: 5,
        conditions: [
          {
            type: 'streak_count',
            field: 'completion',
            operator: 'gte',
            value: 3,
            description: 'Complete activities for 3 consecutive days'
          }
        ],
        priority: 3,
        active: true,
        validFrom: new Date()
      },
      {
        id: 'quality_streak_5',
        name: '5-Activity Quality Streak',
        description: 'Maintain high performance for 5 consecutive activities',
        category: 'streak',
        bonusPoints: 8,
        conditions: [
          {
            type: 'streak_count',
            field: 'quality',
            operator: 'gte',
            value: 5,
            description: 'Achieve 80%+ performance for 5 consecutive activities'
          }
        ],
        priority: 6,
        active: true,
        validFrom: new Date()
      },
      {
        id: 'perfect_streak_3',
        name: '3-Activity Perfect Streak',
        description: 'Achieve perfect scores for 3 consecutive activities',
        category: 'streak',
        bonusPoints: 12,
        conditions: [
          {
            type: 'streak_count',
            field: 'perfect',
            operator: 'gte',
            value: 3,
            description: 'Achieve 95%+ performance for 3 consecutive activities'
          }
        ],
        priority: 8,
        active: true,
        validFrom: new Date()
      },

      // Milestone Bonuses
      {
        id: 'first_100_xp',
        name: 'First 100 XP',
        description: 'Milestone bonus for reaching first 100 XP',
        category: 'milestone',
        bonusPoints: 20,
        conditions: [
          {
            type: 'milestone_reached',
            field: 'totalXP',
            operator: 'gte',
            value: 100,
            description: 'Reach 100 total XP'
          }
        ],
        priority: 10,
        active: true,
        validFrom: new Date()
      },
      {
        id: 'level_1_achievement',
        name: 'Level 1 Achievement',
        description: 'Major milestone for reaching Level 1',
        category: 'milestone',
        bonusPoints: 100,
        conditions: [
          {
            type: 'milestone_reached',
            field: 'level',
            operator: 'gte',
            value: 1,
            description: 'Reach Level 1 (1000 XP)'
          }
        ],
        priority: 10,
        active: true,
        validFrom: new Date()
      },

      // Special Bonuses
      {
        id: 'innovation_bonus',
        name: 'Innovation Bonus',
        description: 'Creative problem-solving approach',
        category: 'special',
        bonusPoints: 8,
        conditions: [
          {
            type: 'performance_threshold',
            field: 'technicalAccuracy',
            operator: 'gte',
            value: 85,
            description: 'High technical performance required'
          },
          {
            type: 'performance_threshold',
            field: 'customerSatisfaction',
            operator: 'gte',
            value: 85,
            description: 'High customer satisfaction required'
          }
        ],
        priority: 5,
        active: true,
        validFrom: new Date()
      }
    ];
  }

  /**
   * Evaluate if bonus rule applies
   */
  private async evaluateBonusRule(
    rule: BonusRule, 
    context: BonusCalculationContext
  ): Promise<BonusApplication | null> {
    const conditionsMet: string[] = [];
    
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return null; // All conditions must be met
      }
      conditionsMet.push(condition.description);
    }

    return {
      ruleId: rule.id,
      bonusPoints: rule.bonusPoints,
      reason: `${rule.name}: ${rule.description}`,
      appliedAt: new Date(),
      conditions: conditionsMet
    };
  }

  /**
   * Evaluate individual condition
   */
  private evaluateCondition(condition: BonusCondition, context: BonusCalculationContext): boolean {
    const { activityData, userHistory, streakData } = context;

    switch (condition.type) {
      case 'performance_threshold':
        const performanceValue = activityData.performanceMetrics[condition.field as keyof PerformanceMetrics];
        return this.compareValues(performanceValue, condition.operator, condition.value);

      case 'boolean_flag':
        const boolValue = activityData.performanceMetrics[condition.field as keyof PerformanceMetrics];
        return this.compareValues(boolValue, condition.operator, condition.value);

      case 'time_constraint':
        const timeValue = activityData.performanceMetrics[condition.field as keyof PerformanceMetrics];
        return this.compareValues(timeValue, condition.operator, condition.value);

      case 'streak_count':
        const streak = streakData.find(s => s.type === condition.field);
        return streak ? this.compareValues(streak.currentStreak, condition.operator, condition.value) : false;

      case 'milestone_reached':
        // This would check user milestones in a real implementation
        return false; // Placeholder

      default:
        return false;
    }
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: any, operator: BonusCondition['operator'], expected: any): boolean {
    switch (operator) {
      case 'gte': return actual >= expected;
      case 'lte': return actual <= expected;
      case 'eq': return actual === expected;
      case 'ne': return actual !== expected;
      case 'contains': return Array.isArray(actual) ? actual.includes(expected) : String(actual).includes(expected);
      default: return false;
    }
  }

  /**
   * Check if rule is currently valid
   */
  private isRuleValid(rule: BonusRule): boolean {
    const now = new Date();
    return now >= rule.validFrom && (!rule.validUntil || now <= rule.validUntil);
  }

  /**
   * Update streak information
   */
  private updateStreak(
    existingStreak: StreakData | undefined,
    type: StreakData['type'],
    userId: string,
    maintained: boolean,
    activity: string,
    performance?: number
  ): StreakData {
    const now = new Date();
    
    if (!existingStreak) {
      return {
        userId,
        type,
        currentStreak: maintained ? 1 : 0,
        longestStreak: maintained ? 1 : 0,
        lastActivity: now,
        streakHistory: [{
          date: now,
          maintained,
          activity,
          performance
        }]
      };
    }

    const newCurrentStreak = maintained ? existingStreak.currentStreak + 1 : 0;
    const newLongestStreak = Math.max(existingStreak.longestStreak, newCurrentStreak);

    return {
      ...existingStreak,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivity: now,
      streakHistory: [
        ...existingStreak.streakHistory.slice(-29), // Keep last 30 entries
        {
          date: now,
          maintained,
          activity,
          performance
        }
      ]
    };
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
   * Check if activity shows skill improvement
   */
  private hasSkillImprovement(metrics: PerformanceMetrics): boolean {
    // In a real implementation, this would compare against historical performance
    // For now, return true if overall performance is good
    return this.calculateOverallPerformance(metrics) >= 85;
  }

  /**
   * Calculate special event multiplier
   */
  private calculateEventMultiplier(events: SpecialEvent[]): number {
    const now = new Date();
    const activeEvents = events.filter(event => 
      now >= event.startDate && now <= event.endDate
    );

    if (activeEvents.length === 0) return 1.0;

    // Use the highest multiplier if multiple events are active
    return Math.max(...activeEvents.map(event => event.bonusMultiplier));
  }

  /**
   * Evaluate streak eligibility
   */
  private evaluateStreakEligibility(rule: BonusRule, streaks: StreakData[]): boolean {
    for (const condition of rule.conditions) {
      if (condition.type === 'streak_count') {
        const streak = streaks.find(s => s.type === condition.field);
        if (!streak || !this.compareValues(streak.currentStreak, condition.operator, condition.value)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Generate streak recommendation
   */
  private generateStreakRecommendation(rule: BonusRule, streaks: StreakData[]): string | null {
    for (const condition of rule.conditions) {
      if (condition.type === 'streak_count') {
        const streak = streaks.find(s => s.type === condition.field);
        const target = condition.value;
        const current = streak ? streak.currentStreak : 0;
        
        if (current < target) {
          const needed = target - current;
          return `Complete ${needed} more ${condition.field} activities to earn ${rule.name} (${rule.bonusPoints} XP)`;
        }
      }
    }
    return null;
  }

  /**
   * Generate unique rule ID
   */
  private generateRuleId(): string {
    return `bonus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const bonusEngineService = new BonusEngineService();
export default bonusEngineService;