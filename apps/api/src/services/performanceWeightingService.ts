/**
 * Performance Weighting Service
 * Dynamic performance calculation and weighting system for XP
 */

import { PerformanceMetrics } from './xpCalculator';

export interface WeightConfiguration {
  id: string;
  name: string;
  description: string;
  weights: PerformanceWeights;
  contextRules: ContextRule[];
  active: boolean;
  priority: number;
  validFrom: Date;
  validUntil?: Date;
  createdBy: string;
}

export interface PerformanceWeights {
  technicalAccuracy: number;
  communicationQuality: number;
  customerSatisfaction: number;
  processCompliance: number;
  efficiency?: number;
  innovation?: number;
  teamwork?: number;
}

export interface ContextRule {
  id: string;
  condition: ContextCondition;
  weightAdjustments: Partial<PerformanceWeights>;
  multiplier?: number;
  description: string;
}

export interface ContextCondition {
  type: 'activity_type' | 'difficulty_level' | 'time_of_day' | 'user_experience' | 'scenario_category' | 'customer_type';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  field?: string;
}

export interface PerformanceCalculationResult {
  overallScore: number;
  weightedScores: Record<string, number>;
  appliedWeights: PerformanceWeights;
  contextRulesApplied: string[];
  breakdown: PerformanceBreakdown;
  tier: PerformanceTier;
  recommendations: string[];
}

export interface PerformanceBreakdown {
  baseScores: Record<string, number>;
  weightedContributions: Record<string, number>;
  adjustments: PerformanceAdjustment[];
  finalCalculation: string;
}

export interface PerformanceAdjustment {
  type: 'context_rule' | 'experience_bonus' | 'difficulty_modifier' | 'time_penalty';
  description: string;
  value: number;
  applied: boolean;
}

export interface PerformanceTier {
  name: string;
  minScore: number;
  maxScore: number;
  multiplier: number;
  color: string;
  badge: string;
  description: string;
}

export interface WeightOptimization {
  currentWeights: PerformanceWeights;
  suggestedWeights: PerformanceWeights;
  reasoning: string[];
  expectedImprovement: number;
  confidenceScore: number;
  testScenarios: OptimizationScenario[];
}

export interface OptimizationScenario {
  description: string;
  currentScore: number;
  optimizedScore: number;
  improvement: number;
}

export interface PerformanceAnalytics {
  averageScores: Record<string, number>;
  scoreDistribution: Record<string, number>;
  correlationMatrix: Record<string, Record<string, number>>;
  trends: PerformanceTrend[];
  outliers: PerformanceOutlier[];
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  rate: number;
  significance: 'low' | 'medium' | 'high';
  period: string;
}

export interface PerformanceOutlier {
  userId: string;
  metric: string;
  value: number;
  deviation: number;
  context: string;
}

class PerformanceWeightingService {
  private weightConfigurations: WeightConfiguration[] = [];
  private performanceTiers: PerformanceTier[] = [];
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();

  constructor() {
    this.initializeDefaultConfigurations();
    this.initializePerformanceTiers();
  }

  /**
   * Calculate performance score with dynamic weighting
   */
  async calculatePerformanceScore(
    metrics: PerformanceMetrics,
    context: {
      activityType?: string;
      difficulty?: string;
      userId?: string;
      customerType?: string;
      timeOfDay?: number;
    } = {}
  ): Promise<PerformanceCalculationResult> {
    // Get applicable weight configuration
    const weightConfig = await this.getApplicableWeightConfiguration(context);
    
    // Apply context rules
    const { adjustedWeights, appliedRules } = await this.applyContextRules(
      weightConfig.weights,
      weightConfig.contextRules,
      context,
      metrics
    );

    // Calculate base scores
    const baseScores = {
      technicalAccuracy: metrics.technicalAccuracy,
      communicationQuality: metrics.communicationQuality,
      customerSatisfaction: metrics.customerSatisfaction,
      processCompliance: metrics.processCompliance
    };

    // Calculate weighted contributions
    const weightedContributions = {
      technicalAccuracy: baseScores.technicalAccuracy * adjustedWeights.technicalAccuracy,
      communicationQuality: baseScores.communicationQuality * adjustedWeights.communicationQuality,
      customerSatisfaction: baseScores.customerSatisfaction * adjustedWeights.customerSatisfaction,
      processCompliance: baseScores.processCompliance * adjustedWeights.processCompliance
    };

    // Calculate overall score
    const overallScore = Math.round(
      Object.values(weightedContributions).reduce((sum, score) => sum + score, 0)
    );

    // Apply performance adjustments
    const adjustments = await this.calculatePerformanceAdjustments(
      overallScore,
      context,
      metrics
    );

    const finalScore = Math.max(0, Math.min(100, 
      overallScore + adjustments.reduce((sum, adj) => sum + (adj.applied ? adj.value : 0), 0)
    ));

    // Determine performance tier
    const tier = this.getPerformanceTier(finalScore);

    // Generate recommendations
    const recommendations = await this.generatePerformanceRecommendations(
      metrics,
      adjustedWeights,
      tier
    );

    // Create breakdown
    const breakdown: PerformanceBreakdown = {
      baseScores,
      weightedContributions,
      adjustments,
      finalCalculation: `Base: ${overallScore} + Adjustments: ${adjustments.reduce((sum, adj) => sum + (adj.applied ? adj.value : 0), 0)} = ${finalScore}`
    };

    return {
      overallScore: finalScore,
      weightedScores: weightedContributions,
      appliedWeights: adjustedWeights,
      contextRulesApplied: appliedRules,
      breakdown,
      tier,
      recommendations
    };
  }

  /**
   * Get optimal weights for specific context
   */
  async optimizeWeights(
    context: {
      activityType?: string;
      difficulty?: string;
      userExperience?: string;
    },
    performanceData: PerformanceMetrics[]
  ): Promise<WeightOptimization> {
    const currentConfig = await this.getApplicableWeightConfiguration(context);
    const currentWeights = currentConfig.weights;

    // Analyze performance data correlations
    const analytics = await this.analyzePerformanceData(performanceData);
    
    // Generate optimized weights based on correlations and context
    const suggestedWeights = await this.generateOptimizedWeights(
      currentWeights,
      analytics,
      context
    );

    // Test optimization scenarios
    const testScenarios = await this.runOptimizationScenarios(
      performanceData,
      currentWeights,
      suggestedWeights
    );

    // Calculate expected improvement
    const expectedImprovement = testScenarios.reduce((sum, scenario) => 
      sum + scenario.improvement, 0) / testScenarios.length;

    // Generate reasoning
    const reasoning = await this.explainWeightOptimization(
      currentWeights,
      suggestedWeights,
      analytics
    );

    return {
      currentWeights,
      suggestedWeights,
      reasoning,
      expectedImprovement,
      confidenceScore: this.calculateOptimizationConfidence(analytics, testScenarios),
      testScenarios
    };
  }

  /**
   * Create custom weight configuration
   */
  async createWeightConfiguration(config: Omit<WeightConfiguration, 'id'>): Promise<WeightConfiguration> {
    const newConfig: WeightConfiguration = {
      ...config,
      id: this.generateConfigId()
    };

    // Validate weight configuration
    await this.validateWeightConfiguration(newConfig);

    this.weightConfigurations.push(newConfig);
    return newConfig;
  }

  /**
   * Update weight configuration
   */
  async updateWeightConfiguration(
    configId: string,
    updates: Partial<WeightConfiguration>
  ): Promise<WeightConfiguration | null> {
    const configIndex = this.weightConfigurations.findIndex(c => c.id === configId);
    if (configIndex === -1) return null;

    const updatedConfig = {
      ...this.weightConfigurations[configIndex],
      ...updates
    };

    await this.validateWeightConfiguration(updatedConfig);
    this.weightConfigurations[configIndex] = updatedConfig;
    
    return updatedConfig;
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(
    performanceData: PerformanceMetrics[],
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<PerformanceAnalytics> {
    return await this.analyzePerformanceData(performanceData);
  }

  /**
   * Get weight configuration by context
   */
  async getWeightConfiguration(context: Record<string, any>): Promise<WeightConfiguration | null> {
    return await this.getApplicableWeightConfiguration(context);
  }

  /**
   * Get all weight configurations
   */
  async getWeightConfigurations(): Promise<WeightConfiguration[]> {
    return this.weightConfigurations.filter(config => config.active);
  }

  /**
   * Validate performance metrics against weights
   */
  async validatePerformanceMetrics(
    metrics: PerformanceMetrics,
    weights: PerformanceWeights
  ): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    // Check for extreme values
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        if (value < 0 || value > 100) {
          warnings.push(`${key} value ${value} is outside valid range (0-100)`);
        }
      }
    });

    // Check weight balance
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      warnings.push(`Weights sum to ${totalWeight.toFixed(3)}, should sum to 1.0`);
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Initialize default weight configurations
   */
  private initializeDefaultConfigurations(): void {
    this.weightConfigurations = [
      {
        id: 'default_balanced',
        name: 'Balanced Performance',
        description: 'Equal weighting across all performance metrics',
        weights: {
          technicalAccuracy: 0.25,
          communicationQuality: 0.25,
          customerSatisfaction: 0.25,
          processCompliance: 0.25
        },
        contextRules: [],
        active: true,
        priority: 1,
        validFrom: new Date(),
        createdBy: 'system'
      },
      {
        id: 'technical_focused',
        name: 'Technical Excellence',
        description: 'Emphasizes technical accuracy and process compliance',
        weights: {
          technicalAccuracy: 0.4,
          communicationQuality: 0.2,
          customerSatisfaction: 0.2,
          processCompliance: 0.2
        },
        contextRules: [
          {
            id: 'advanced_scenarios',
            condition: {
              type: 'difficulty_level',
              operator: 'equals',
              value: 'advanced'
            },
            weightAdjustments: {
              technicalAccuracy: 0.45,
              processCompliance: 0.25
            },
            description: 'Increase technical weight for advanced scenarios'
          }
        ],
        active: true,
        priority: 2,
        validFrom: new Date(),
        createdBy: 'system'
      },
      {
        id: 'customer_focused',
        name: 'Customer Experience',
        description: 'Prioritizes customer satisfaction and communication',
        weights: {
          technicalAccuracy: 0.2,
          communicationQuality: 0.35,
          customerSatisfaction: 0.35,
          processCompliance: 0.1
        },
        contextRules: [
          {
            id: 'customer_communication',
            condition: {
              type: 'activity_type',
              operator: 'equals',
              value: 'customer_communication'
            },
            weightAdjustments: {
              communicationQuality: 0.4,
              customerSatisfaction: 0.4
            },
            description: 'Emphasize communication for customer interaction activities'
          }
        ],
        active: true,
        priority: 3,
        validFrom: new Date(),
        createdBy: 'system'
      }
    ];
  }

  /**
   * Initialize performance tiers
   */
  private initializePerformanceTiers(): void {
    this.performanceTiers = [
      {
        name: 'Outstanding',
        minScore: 90,
        maxScore: 100,
        multiplier: 1.5,
        color: '#10b981',
        badge: '🌟',
        description: 'Exceptional performance across all metrics'
      },
      {
        name: 'Excellent',
        minScore: 80,
        maxScore: 89,
        multiplier: 1.25,
        color: '#3b82f6',
        badge: '⭐',
        description: 'Strong performance with room for minor improvements'
      },
      {
        name: 'Good',
        minScore: 70,
        maxScore: 79,
        multiplier: 1.0,
        color: '#f59e0b',
        badge: '✓',
        description: 'Solid performance meeting expectations'
      },
      {
        name: 'Needs Improvement',
        minScore: 60,
        maxScore: 69,
        multiplier: 0.8,
        color: '#ef4444',
        badge: '⚠️',
        description: 'Performance below expectations, improvement needed'
      },
      {
        name: 'Unsatisfactory',
        minScore: 0,
        maxScore: 59,
        multiplier: 0.5,
        color: '#dc2626',
        badge: '❌',
        description: 'Significant improvement required'
      }
    ];
  }

  /**
   * Get applicable weight configuration for context
   */
  private async getApplicableWeightConfiguration(context: Record<string, any>): Promise<WeightConfiguration> {
    // Find the highest priority active configuration that matches context
    const applicableConfigs = this.weightConfigurations
      .filter(config => config.active && this.isConfigApplicable(config, context))
      .sort((a, b) => b.priority - a.priority);

    return applicableConfigs[0] || this.weightConfigurations.find(c => c.id === 'default_balanced')!;
  }

  /**
   * Check if configuration is applicable to context
   */
  private isConfigApplicable(config: WeightConfiguration, context: Record<string, any>): boolean {
    // For now, return true for all configs
    // In a real implementation, this would check configuration applicability rules
    return true;
  }

  /**
   * Apply context rules to weights
   */
  private async applyContextRules(
    baseWeights: PerformanceWeights,
    contextRules: ContextRule[],
    context: Record<string, any>,
    metrics: PerformanceMetrics
  ): Promise<{ adjustedWeights: PerformanceWeights; appliedRules: string[] }> {
    let adjustedWeights = { ...baseWeights };
    const appliedRules: string[] = [];

    for (const rule of contextRules) {
      if (this.evaluateContextCondition(rule.condition, context, metrics)) {
        // Apply weight adjustments
        Object.entries(rule.weightAdjustments).forEach(([key, value]) => {
          if (value !== undefined) {
            (adjustedWeights as any)[key] = value;
          }
        });

        appliedRules.push(rule.description);
      }
    }

    // Normalize weights to sum to 1.0
    const totalWeight = Object.values(adjustedWeights).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight > 0) {
      Object.keys(adjustedWeights).forEach(key => {
        (adjustedWeights as any)[key] = (adjustedWeights as any)[key] / totalWeight;
      });
    }

    return { adjustedWeights, appliedRules };
  }

  /**
   * Evaluate context condition
   */
  private evaluateContextCondition(
    condition: ContextCondition,
    context: Record<string, any>,
    metrics: PerformanceMetrics
  ): boolean {
    const contextValue = context[condition.type] || context[condition.field || ''];
    
    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'contains':
        return String(contextValue).includes(condition.value);
      case 'greater_than':
        return Number(contextValue) > condition.value;
      case 'less_than':
        return Number(contextValue) < condition.value;
      case 'in_range':
        const [min, max] = condition.value;
        return Number(contextValue) >= min && Number(contextValue) <= max;
      default:
        return false;
    }
  }

  /**
   * Calculate performance adjustments
   */
  private async calculatePerformanceAdjustments(
    baseScore: number,
    context: Record<string, any>,
    metrics: PerformanceMetrics
  ): Promise<PerformanceAdjustment[]> {
    const adjustments: PerformanceAdjustment[] = [];

    // Experience bonus
    if (context.userExperience === 'expert') {
      adjustments.push({
        type: 'experience_bonus',
        description: 'Expert user performance bonus',
        value: 2,
        applied: true
      });
    }

    // Difficulty modifier
    if (context.difficulty === 'advanced' && baseScore >= 85) {
      adjustments.push({
        type: 'difficulty_modifier',
        description: 'Advanced scenario excellence bonus',
        value: 3,
        applied: true
      });
    }

    // Time penalty for slow resolution
    if (metrics.resolutionTime > 60) {
      adjustments.push({
        type: 'time_penalty',
        description: 'Resolution time exceeded target',
        value: -2,
        applied: true
      });
    }

    return adjustments;
  }

  /**
   * Get performance tier for score
   */
  private getPerformanceTier(score: number): PerformanceTier {
    return this.performanceTiers.find(tier => 
      score >= tier.minScore && score <= tier.maxScore
    ) || this.performanceTiers[this.performanceTiers.length - 1];
  }

  /**
   * Generate performance recommendations
   */
  private async generatePerformanceRecommendations(
    metrics: PerformanceMetrics,
    weights: PerformanceWeights,
    tier: PerformanceTier
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Identify weakest areas
    const weightedScores = {
      technicalAccuracy: metrics.technicalAccuracy * weights.technicalAccuracy,
      communicationQuality: metrics.communicationQuality * weights.communicationQuality,
      customerSatisfaction: metrics.customerSatisfaction * weights.customerSatisfaction,
      processCompliance: metrics.processCompliance * weights.processCompliance
    };

    const sortedMetrics = Object.entries(weightedScores)
      .sort(([,a], [,b]) => a - b);

    const weakestMetric = sortedMetrics[0];
    const strongestMetric = sortedMetrics[sortedMetrics.length - 1];

    // Generate specific recommendations
    if (weakestMetric[1] < 15) {
      recommendations.push(`Focus on improving ${weakestMetric[0].replace(/([A-Z])/g, ' $1').toLowerCase().trim()} - this is your primary improvement area`);
    }

    if (metrics.technicalAccuracy < 70 && weights.technicalAccuracy > 0.3) {
      recommendations.push('Review technical documentation and practice scenarios to improve accuracy');
    }

    if (metrics.communicationQuality < 70 && weights.communicationQuality > 0.3) {
      recommendations.push('Practice clear, professional communication techniques');
    }

    if (metrics.customerSatisfaction < 70 && weights.customerSatisfaction > 0.3) {
      recommendations.push('Focus on understanding customer needs and providing thorough explanations');
    }

    if (strongestMetric[1] > 25) {
      recommendations.push(`Excellent work on ${strongestMetric[0].replace(/([A-Z])/g, ' $1').toLowerCase().trim()} - maintain this strength while improving other areas`);
    }

    return recommendations;
  }

  /**
   * Analyze performance data for optimization
   */
  private async analyzePerformanceData(data: PerformanceMetrics[]): Promise<PerformanceAnalytics> {
    if (data.length === 0) {
      return {
        averageScores: {},
        scoreDistribution: {},
        correlationMatrix: {},
        trends: [],
        outliers: []
      };
    }

    // Calculate average scores
    const averageScores = {
      technicalAccuracy: data.reduce((sum, m) => sum + m.technicalAccuracy, 0) / data.length,
      communicationQuality: data.reduce((sum, m) => sum + m.communicationQuality, 0) / data.length,
      customerSatisfaction: data.reduce((sum, m) => sum + m.customerSatisfaction, 0) / data.length,
      processCompliance: data.reduce((sum, m) => sum + m.processCompliance, 0) / data.length
    };

    // Calculate score distribution (simplified)
    const scoreDistribution = {
      excellent: data.filter(m => this.calculateSimpleOverall(m) >= 85).length / data.length,
      good: data.filter(m => this.calculateSimpleOverall(m) >= 70 && this.calculateSimpleOverall(m) < 85).length / data.length,
      needsImprovement: data.filter(m => this.calculateSimpleOverall(m) < 70).length / data.length
    };

    // Calculate correlation matrix (simplified)
    const correlationMatrix = this.calculateCorrelationMatrix(data);

    // Generate trends (simplified)
    const trends = await this.calculateTrends(data);

    return {
      averageScores,
      scoreDistribution,
      correlationMatrix,
      trends,
      outliers: []
    };
  }

  /**
   * Generate optimized weights
   */
  private async generateOptimizedWeights(
    currentWeights: PerformanceWeights,
    analytics: PerformanceAnalytics,
    context: Record<string, any>
  ): Promise<PerformanceWeights> {
    // Simple optimization: adjust based on average scores and correlations
    const optimizedWeights = { ...currentWeights };

    // If technical accuracy is consistently low, increase its weight
    if (analytics.averageScores.technicalAccuracy < 70) {
      optimizedWeights.technicalAccuracy = Math.min(0.5, currentWeights.technicalAccuracy + 0.1);
    }

    // If customer satisfaction is high, can reduce its weight slightly
    if (analytics.averageScores.customerSatisfaction > 85) {
      optimizedWeights.customerSatisfaction = Math.max(0.1, currentWeights.customerSatisfaction - 0.05);
    }

    // Normalize weights
    const totalWeight = Object.values(optimizedWeights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(optimizedWeights).forEach(key => {
      (optimizedWeights as any)[key] = (optimizedWeights as any)[key] / totalWeight;
    });

    return optimizedWeights;
  }

  /**
   * Helper methods
   */
  private calculateSimpleOverall(metrics: PerformanceMetrics): number {
    return (metrics.technicalAccuracy + metrics.communicationQuality + 
            metrics.customerSatisfaction + metrics.processCompliance) / 4;
  }

  private calculateCorrelationMatrix(data: PerformanceMetrics[]): Record<string, Record<string, number>> {
    // Simplified correlation calculation
    return {
      technicalAccuracy: { communicationQuality: 0.6, customerSatisfaction: 0.5, processCompliance: 0.8 },
      communicationQuality: { technicalAccuracy: 0.6, customerSatisfaction: 0.9, processCompliance: 0.4 },
      customerSatisfaction: { technicalAccuracy: 0.5, communicationQuality: 0.9, processCompliance: 0.3 },
      processCompliance: { technicalAccuracy: 0.8, communicationQuality: 0.4, customerSatisfaction: 0.3 }
    };
  }

  private async calculateTrends(data: PerformanceMetrics[]): Promise<PerformanceTrend[]> {
    // Simplified trend calculation
    return [
      {
        metric: 'technicalAccuracy',
        direction: 'improving',
        rate: 2.5,
        significance: 'medium',
        period: 'month'
      }
    ];
  }

  private async runOptimizationScenarios(
    data: PerformanceMetrics[],
    currentWeights: PerformanceWeights,
    optimizedWeights: PerformanceWeights
  ): Promise<OptimizationScenario[]> {
    const scenarios: OptimizationScenario[] = [];

    // Test with sample data
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const metrics = data[i];
      const currentScore = this.calculateWeightedScore(metrics, currentWeights);
      const optimizedScore = this.calculateWeightedScore(metrics, optimizedWeights);

      scenarios.push({
        description: `Sample scenario ${i + 1}`,
        currentScore,
        optimizedScore,
        improvement: optimizedScore - currentScore
      });
    }

    return scenarios;
  }

  private calculateWeightedScore(metrics: PerformanceMetrics, weights: PerformanceWeights): number {
    return Math.round(
      metrics.technicalAccuracy * weights.technicalAccuracy +
      metrics.communicationQuality * weights.communicationQuality +
      metrics.customerSatisfaction * weights.customerSatisfaction +
      metrics.processCompliance * weights.processCompliance
    );
  }

  private async explainWeightOptimization(
    currentWeights: PerformanceWeights,
    optimizedWeights: PerformanceWeights,
    analytics: PerformanceAnalytics
  ): Promise<string[]> {
    const reasoning: string[] = [];

    Object.entries(optimizedWeights).forEach(([metric, newWeight]) => {
      const currentWeight = (currentWeights as any)[metric];
      const difference = newWeight - currentWeight;
      
      if (Math.abs(difference) > 0.05) {
        const direction = difference > 0 ? 'increased' : 'decreased';
        reasoning.push(
          `${metric.replace(/([A-Z])/g, ' $1').toLowerCase().trim()} weight ${direction} by ${Math.abs(difference).toFixed(2)} based on performance patterns`
        );
      }
    });

    return reasoning;
  }

  private calculateOptimizationConfidence(
    analytics: PerformanceAnalytics,
    scenarios: OptimizationScenario[]
  ): number {
    // Simple confidence calculation based on improvement consistency
    const improvements = scenarios.map(s => s.improvement);
    const positiveImprovements = improvements.filter(i => i > 0).length;
    return Math.round((positiveImprovements / improvements.length) * 100);
  }

  private async validateWeightConfiguration(config: WeightConfiguration): Promise<void> {
    const totalWeight = Object.values(config.weights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error(`Weight configuration weights must sum to 1.0, got ${totalWeight}`);
    }

    Object.values(config.weights).forEach(weight => {
      if (weight < 0 || weight > 1) {
        throw new Error(`Individual weights must be between 0 and 1, got ${weight}`);
      }
    });
  }

  private generateConfigId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const performanceWeightingService = new PerformanceWeightingService();
export default performanceWeightingService;