import { logger } from '../utils/logger';

interface ContextualFactor {
  id: string;
  name: string;
  category: 'scenario' | 'environment' | 'user' | 'resource' | 'temporal';
  description: string;
  measurementType: 'discrete' | 'continuous' | 'categorical';
  scale: {
    min: number;
    max: number;
    unit?: string;
  };
  impactWeight: number; // 0-1, how much this factor affects comparison fairness
  adjustmentAlgorithm: 'linear' | 'logarithmic' | 'exponential' | 'threshold' | 'custom';
}

interface ContextualData {
  scenarioContext: {
    difficulty: number;
    complexity: number;
    novelty: number;
    timePressure: number;
    resourceConstraints: number;
    domainSpecialization: number;
    prerequisiteKnowledge: number;
    ambiguity: number;
  };
  environmentalContext: {
    toolAvailability: number;
    documentationQuality: number;
    supportAvailability: number;
    systemStability: number;
    networkConditions: number;
    workspaceSetup: number;
  };
  userContext: {
    experienceLevel: number;
    domainFamiliarity: number;
    currentWorkload: number;
    energyLevel: number;
    learningCurvePosition: number;
    confidenceLevel: number;
  };
  temporalContext: {
    timeOfDay: number;
    dayOfWeek: number;
    seasonality: number;
    deadlinePressure: number;
    interruptionFrequency: number;
  };
}

interface ComparisonAdjustment {
  originalScore: number;
  adjustedScore: number;
  adjustmentFactors: Array<{
    factorId: string;
    factorName: string;
    rawValue: number;
    normalizedValue: number;
    adjustmentAmount: number;
    justification: string;
  }>;
  contextualRank: number;
  fairnessScore: number; // 0-1, how fair this comparison is given context
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
  comparisonValidity: 'high' | 'medium' | 'low' | 'insufficient';
}

interface ContextualBenchmark {
  benchmarkId: string;
  name: string;
  description: string;
  baselineContext: ContextualData;
  performanceDistribution: {
    mean: number;
    standardDeviation: number;
    percentiles: Record<number, number>;
    sampleSize: number;
  };
  contextualVariations: Array<{
    contextModifier: Partial<ContextualData>;
    performanceAdjustment: number;
    prevalence: number; // How common this context is
    reliability: number; // How reliable the adjustment is
  }>;
  validityConditions: Array<{
    condition: string;
    threshold: number;
    action: 'adjust' | 'flag' | 'exclude';
  }>;
}

interface FairComparisonResult {
  originalComparison: {
    userScore: number;
    benchmarkScore: number;
    rawPercentile: number;
  };
  contextualComparison: {
    adjustedUserScore: number;
    adjustedBenchmarkScore: number;
    contextualPercentile: number;
    fairnessAdjustment: number;
  };
  contextAnalysis: {
    advantageousFactors: string[];
    disadvantageousFactors: string[];
    neutralFactors: string[];
    overallContextBias: 'favorable' | 'neutral' | 'challenging' | 'very_challenging';
  };
  recommendedActions: Array<{
    type: 'context_improvement' | 'skill_development' | 'preparation' | 'accommodation';
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: number;
  }>;
  comparisonReliability: {
    score: number;
    factors: string[];
    limitations: string[];
    recommendations: string[];
  };
}

interface ContextualInsight {
  insightType: 'performance_pattern' | 'context_impact' | 'improvement_opportunity' | 'bias_detection';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  actionability: 'immediate' | 'short_term' | 'long_term' | 'strategic';
  impactPotential: 'low' | 'medium' | 'high' | 'transformative';
}

class ContextualComparator {
  private contextualFactors: Map<string, ContextualFactor> = new Map();
  private contextualBenchmarks: Map<string, ContextualBenchmark> = new Map();
  private performanceHistory: Map<string, Array<{
    score: number;
    context: ContextualData;
    timestamp: Date;
  }>> = new Map();

  constructor() {
    this.initializeContextualFactors();
    this.initializeContextualBenchmarks();
  }

  /**
   * Perform contextually fair comparison
   */
  async performFairComparison(
    userId: string,
    userScore: number,
    benchmarkId: string,
    currentContext: ContextualData,
    comparisonContext?: ContextualData
  ): Promise<FairComparisonResult> {
    try {
      logger.info(`Performing fair comparison for user ${userId} with benchmark ${benchmarkId}`);

      const benchmark = this.contextualBenchmarks.get(benchmarkId);
      if (!benchmark) {
        throw new Error(`Contextual benchmark ${benchmarkId} not found`);
      }

      // Calculate context adjustments
      const userAdjustment = await this.calculateContextualAdjustment(userScore, currentContext, benchmark.baselineContext);
      const benchmarkAdjustment = comparisonContext 
        ? await this.calculateContextualAdjustment(benchmark.performanceDistribution.mean, comparisonContext, benchmark.baselineContext)
        : { adjustedScore: benchmark.performanceDistribution.mean, adjustmentFactors: [] };

      // Calculate original and contextual comparisons
      const originalComparison = {
        userScore,
        benchmarkScore: benchmark.performanceDistribution.mean,
        rawPercentile: this.calculatePercentile(userScore, benchmark.performanceDistribution)
      };

      const contextualComparison = {
        adjustedUserScore: userAdjustment.adjustedScore,
        adjustedBenchmarkScore: benchmarkAdjustment.adjustedScore,
        contextualPercentile: this.calculateAdjustedPercentile(userAdjustment.adjustedScore, benchmark.performanceDistribution),
        fairnessAdjustment: userAdjustment.adjustedScore - userScore
      };

      // Analyze context impact
      const contextAnalysis = this.analyzeContextImpact(currentContext, benchmark.baselineContext);

      // Generate recommendations
      const recommendedActions = this.generateContextualRecommendations(
        userAdjustment,
        contextAnalysis,
        currentContext
      );

      // Assess comparison reliability
      const comparisonReliability = this.assessComparisonReliability(
        userAdjustment,
        currentContext,
        benchmark
      );

      return {
        originalComparison,
        contextualComparison,
        contextAnalysis,
        recommendedActions,
        comparisonReliability
      };
    } catch (error) {
      logger.error('Error performing fair comparison:', error);
      throw new Error('Failed to perform fair comparison');
    }
  }

  /**
   * Analyze contextual performance patterns
   */
  async analyzeContextualPatterns(
    userId: string,
    performanceHistory: Array<{
      score: number;
      context: ContextualData;
      timestamp: Date;
    }>
  ): Promise<{
    patterns: ContextualInsight[];
    optimalContexts: Array<{
      contextDescription: string;
      averagePerformance: number;
      frequency: number;
      reproducibility: number;
    }>;
    challengingContexts: Array<{
      contextDescription: string;
      averagePerformance: number;
      frequency: number;
      mitigationStrategies: string[];
    }>;
    contextualRecommendations: string[];
  }> {
    try {
      logger.info(`Analyzing contextual patterns for user ${userId}`);

      // Store performance history
      this.performanceHistory.set(userId, performanceHistory);

      // Identify patterns
      const patterns = await this.identifyPerformancePatterns(performanceHistory);
      const optimalContexts = this.identifyOptimalContexts(performanceHistory);
      const challengingContexts = this.identifyChallengingContexts(performanceHistory);
      const contextualRecommendations = this.generateContextualGuidance(patterns, optimalContexts, challengingContexts);

      return {
        patterns,
        optimalContexts,
        challengingContexts,
        contextualRecommendations
      };
    } catch (error) {
      logger.error('Error analyzing contextual patterns:', error);
      throw new Error('Failed to analyze contextual patterns');
    }
  }

  /**
   * Calculate difficulty-adjusted performance scores
   */
  async calculateDifficultyAdjustedScore(
    rawScore: number,
    scenarioDifficulty: number,
    userExperienceLevel: number,
    contextFactors: Partial<ContextualData>
  ): Promise<{
    adjustedScore: number;
    difficultyMultiplier: number;
    experienceBonus: number;
    contextualModifiers: Array<{
      factor: string;
      impact: number;
      justification: string;
    }>;
    normalizedScore: number;
  }> {
    try {
      logger.info('Calculating difficulty-adjusted performance score');

      // Calculate base difficulty adjustment
      const difficultyMultiplier = this.calculateDifficultyMultiplier(scenarioDifficulty);
      
      // Calculate experience adjustment
      const experienceBonus = this.calculateExperienceAdjustment(userExperienceLevel, scenarioDifficulty);
      
      // Calculate contextual modifiers
      const contextualModifiers = await this.calculateContextualModifiers(contextFactors);
      
      // Apply all adjustments
      let adjustedScore = rawScore * difficultyMultiplier + experienceBonus;
      
      contextualModifiers.forEach(modifier => {
        adjustedScore += modifier.impact;
      });

      // Normalize to 0-100 range
      const normalizedScore = Math.max(0, Math.min(100, adjustedScore));

      return {
        adjustedScore: normalizedScore,
        difficultyMultiplier,
        experienceBonus,
        contextualModifiers,
        normalizedScore
      };
    } catch (error) {
      logger.error('Error calculating difficulty-adjusted score:', error);
      throw new Error('Failed to calculate difficulty-adjusted score');
    }
  }

  /**
   * Generate contextual comparison insights
   */
  async generateContextualInsights(
    comparisonResults: FairComparisonResult[],
    userId: string
  ): Promise<ContextualInsight[]> {
    try {
      logger.info(`Generating contextual insights for user ${userId}`);

      const insights: ContextualInsight[] = [];

      // Performance pattern insights
      insights.push(...this.identifyPerformancePatternInsights(comparisonResults));
      
      // Context impact insights
      insights.push(...this.identifyContextImpactInsights(comparisonResults));
      
      // Improvement opportunity insights
      insights.push(...this.identifyImprovementOpportunityInsights(comparisonResults));
      
      // Bias detection insights
      insights.push(...this.identifyBiasDetectionInsights(comparisonResults));

      return insights.sort((a, b) => {
        // Sort by confidence and impact potential
        const aScore = a.confidence * this.getImpactScore(a.impactPotential);
        const bScore = b.confidence * this.getImpactScore(b.impactPotential);
        return bScore - aScore;
      });
    } catch (error) {
      logger.error('Error generating contextual insights:', error);
      throw new Error('Failed to generate contextual insights');
    }
  }

  // Private helper methods

  private initializeContextualFactors(): void {
    const factors: ContextualFactor[] = [
      {
        id: 'scenario_difficulty',
        name: 'Scenario Difficulty',
        category: 'scenario',
        description: 'Overall complexity and challenge level of the scenario',
        measurementType: 'continuous',
        scale: { min: 0, max: 100, unit: 'difficulty_points' },
        impactWeight: 0.25,
        adjustmentAlgorithm: 'logarithmic'
      },
      {
        id: 'time_pressure',
        name: 'Time Pressure',
        category: 'scenario',
        description: 'Level of time constraint and urgency',
        measurementType: 'continuous',
        scale: { min: 0, max: 100, unit: 'pressure_level' },
        impactWeight: 0.15,
        adjustmentAlgorithm: 'exponential'
      },
      {
        id: 'resource_availability',
        name: 'Resource Availability',
        category: 'environment',
        description: 'Availability of tools, documentation, and support',
        measurementType: 'continuous',
        scale: { min: 0, max: 100, unit: 'availability_score' },
        impactWeight: 0.2,
        adjustmentAlgorithm: 'linear'
      },
      {
        id: 'user_experience',
        name: 'User Experience Level',
        category: 'user',
        description: 'User\'s relevant experience and expertise',
        measurementType: 'continuous',
        scale: { min: 0, max: 100, unit: 'experience_score' },
        impactWeight: 0.2,
        adjustmentAlgorithm: 'threshold'
      },
      {
        id: 'system_stability',
        name: 'System Stability',
        category: 'environment',
        description: 'Reliability and performance of supporting systems',
        measurementType: 'continuous',
        scale: { min: 0, max: 100, unit: 'stability_score' },
        impactWeight: 0.1,
        adjustmentAlgorithm: 'linear'
      },
      {
        id: 'interruption_frequency',
        name: 'Interruption Frequency',
        category: 'temporal',
        description: 'Frequency of interruptions and distractions',
        measurementType: 'continuous',
        scale: { min: 0, max: 100, unit: 'interruption_rate' },
        impactWeight: 0.1,
        adjustmentAlgorithm: 'exponential'
      }
    ];

    factors.forEach(factor => {
      this.contextualFactors.set(factor.id, factor);
    });
  }

  private initializeContextualBenchmarks(): void {
    const benchmarks: ContextualBenchmark[] = [
      {
        benchmarkId: 'standard_support_scenario',
        name: 'Standard Support Scenario',
        description: 'Baseline performance expectations for typical support scenarios',
        baselineContext: {
          scenarioContext: {
            difficulty: 50,
            complexity: 50,
            novelty: 30,
            timePressure: 40,
            resourceConstraints: 20,
            domainSpecialization: 30,
            prerequisiteKnowledge: 40,
            ambiguity: 30
          },
          environmentalContext: {
            toolAvailability: 80,
            documentationQuality: 70,
            supportAvailability: 60,
            systemStability: 85,
            networkConditions: 90,
            workspaceSetup: 75
          },
          userContext: {
            experienceLevel: 50,
            domainFamiliarity: 50,
            currentWorkload: 50,
            energyLevel: 75,
            learningCurvePosition: 50,
            confidenceLevel: 60
          },
          temporalContext: {
            timeOfDay: 50,
            dayOfWeek: 50,
            seasonality: 50,
            deadlinePressure: 30,
            interruptionFrequency: 20
          }
        },
        performanceDistribution: {
          mean: 75,
          standardDeviation: 12,
          percentiles: {
            10: 58,
            25: 67,
            50: 75,
            75: 83,
            90: 92,
            95: 96
          },
          sampleSize: 1500
        },
        contextualVariations: [
          {
            contextModifier: {
              scenarioContext: { difficulty: 80, timePressure: 70 }
            },
            performanceAdjustment: -8,
            prevalence: 0.2,
            reliability: 0.85
          },
          {
            contextModifier: {
              environmentalContext: { toolAvailability: 40, supportAvailability: 30 }
            },
            performanceAdjustment: -12,
            prevalence: 0.15,
            reliability: 0.9
          }
        ],
        validityConditions: [
          {
            condition: 'minimum_experience',
            threshold: 20,
            action: 'adjust'
          },
          {
            condition: 'scenario_relevance',
            threshold: 0.3,
            action: 'flag'
          }
        ]
      }
    ];

    benchmarks.forEach(benchmark => {
      this.contextualBenchmarks.set(benchmark.benchmarkId, benchmark);
    });
  }

  private async calculateContextualAdjustment(
    baseScore: number,
    currentContext: ContextualData,
    baselineContext: ContextualData
  ): Promise<ComparisonAdjustment> {
    const adjustmentFactors: ComparisonAdjustment['adjustmentFactors'] = [];
    let totalAdjustment = 0;

    // Calculate adjustments for each context category
    const contextCategories = [
      { name: 'scenarioContext', data: currentContext.scenarioContext, baseline: baselineContext.scenarioContext },
      { name: 'environmentalContext', data: currentContext.environmentalContext, baseline: baselineContext.environmentalContext },
      { name: 'userContext', data: currentContext.userContext, baseline: baselineContext.userContext },
      { name: 'temporalContext', data: currentContext.temporalContext, baseline: baselineContext.temporalContext }
    ];

    for (const category of contextCategories) {
      for (const [factorKey, currentValue] of Object.entries(category.data)) {
        const baselineValue = category.baseline[factorKey] || 50;
        const difference = currentValue - baselineValue;
        
        const factorId = `${category.name}_${factorKey}`;
        const factor = this.contextualFactors.get(factorId);
        const adjustmentAmount = this.calculateFactorAdjustment(difference, factor?.impactWeight || 0.1);
        
        if (Math.abs(adjustmentAmount) > 0.5) {
          adjustmentFactors.push({
            factorId,
            factorName: factorKey,
            rawValue: currentValue,
            normalizedValue: difference,
            adjustmentAmount,
            justification: this.generateAdjustmentJustification(factorKey, difference, adjustmentAmount)
          });
          
          totalAdjustment += adjustmentAmount;
        }
      }
    }

    const adjustedScore = Math.max(0, Math.min(100, baseScore + totalAdjustment));
    const fairnessScore = this.calculateFairnessScore(adjustmentFactors);
    const confidenceInterval = this.calculateConfidenceInterval(adjustedScore, adjustmentFactors);

    return {
      originalScore: baseScore,
      adjustedScore,
      adjustmentFactors,
      contextualRank: 0, // Calculated elsewhere
      fairnessScore,
      confidenceInterval,
      comparisonValidity: this.determineComparisonValidity(fairnessScore, adjustmentFactors.length)
    };
  }

  private calculateFactorAdjustment(difference: number, impactWeight: number): number {
    // Simple linear adjustment - could be made more sophisticated
    return (difference / 100) * 20 * impactWeight;
  }

  private generateAdjustmentJustification(factorName: string, difference: number, adjustment: number): string {
    const direction = difference > 0 ? 'higher' : 'lower';
    const impact = adjustment > 0 ? 'advantage' : 'disadvantage';
    
    return `${factorName} is ${Math.abs(difference).toFixed(1)} points ${direction} than baseline, providing ${Math.abs(adjustment).toFixed(1)} point ${impact}`;
  }

  private calculateFairnessScore(adjustmentFactors: ComparisonAdjustment['adjustmentFactors']): number {
    if (adjustmentFactors.length === 0) return 1.0;
    
    const totalAdjustment = adjustmentFactors.reduce((sum, factor) => sum + Math.abs(factor.adjustmentAmount), 0);
    const maxPossibleAdjustment = 20; // Assuming max 20 point adjustment
    
    return Math.max(0, 1 - (totalAdjustment / maxPossibleAdjustment));
  }

  private calculateConfidenceInterval(adjustedScore: number, adjustmentFactors: ComparisonAdjustment['adjustmentFactors']): ComparisonAdjustment['confidenceInterval'] {
    const uncertainty = adjustmentFactors.length * 2; // 2 points uncertainty per factor
    const confidence = Math.max(70, 95 - uncertainty);
    
    return {
      lower: Math.max(0, adjustedScore - uncertainty),
      upper: Math.min(100, adjustedScore + uncertainty),
      confidence
    };
  }

  private determineComparisonValidity(fairnessScore: number, adjustmentCount: number): 'high' | 'medium' | 'low' | 'insufficient' {
    if (fairnessScore >= 0.8 && adjustmentCount <= 3) return 'high';
    if (fairnessScore >= 0.6 && adjustmentCount <= 5) return 'medium';
    if (fairnessScore >= 0.4) return 'low';
    return 'insufficient';
  }

  private calculatePercentile(score: number, distribution: ContextualBenchmark['performanceDistribution']): number {
    // Approximate percentile calculation using normal distribution
    const zScore = (score - distribution.mean) / distribution.standardDeviation;
    return Math.round(this.normalCDF(zScore) * 100);
  }

  private calculateAdjustedPercentile(adjustedScore: number, distribution: ContextualBenchmark['performanceDistribution']): number {
    return this.calculatePercentile(adjustedScore, distribution);
  }

  private normalCDF(z: number): number {
    // Approximation of normal cumulative distribution function
    const t = 1 / (1 + 0.3275911 * Math.abs(z));
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
    return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
  }

  private analyzeContextImpact(currentContext: ContextualData, baselineContext: ContextualData): FairComparisonResult['contextAnalysis'] {
    const advantageousFactors: string[] = [];
    const disadvantageousFactors: string[] = [];
    const neutralFactors: string[] = [];

    // Analyze each context category
    const allContexts = [
      { name: 'Scenario', current: currentContext.scenarioContext, baseline: baselineContext.scenarioContext },
      { name: 'Environmental', current: currentContext.environmentalContext, baseline: baselineContext.environmentalContext },
      { name: 'User', current: currentContext.userContext, baseline: baselineContext.userContext },
      { name: 'Temporal', current: currentContext.temporalContext, baseline: baselineContext.temporalContext }
    ];

    allContexts.forEach(context => {
      Object.entries(context.current).forEach(([key, value]) => {
        const baselineValue = context.baseline[key] || 50;
        const difference = value - baselineValue;
        
        if (difference > 10) {
          advantageousFactors.push(`${context.name}: ${key} (+${difference.toFixed(1)})`);
        } else if (difference < -10) {
          disadvantageousFactors.push(`${context.name}: ${key} (${difference.toFixed(1)})`);
        } else {
          neutralFactors.push(`${context.name}: ${key}`);
        }
      });
    });

    // Determine overall context bias
    const advantageScore = advantageousFactors.length * 2;
    const disadvantageScore = disadvantageousFactors.length * 2;
    const netBias = advantageScore - disadvantageScore;

    let overallContextBias: 'favorable' | 'neutral' | 'challenging' | 'very_challenging';
    if (netBias >= 6) overallContextBias = 'favorable';
    else if (netBias >= -2) overallContextBias = 'neutral';
    else if (netBias >= -6) overallContextBias = 'challenging';
    else overallContextBias = 'very_challenging';

    return {
      advantageousFactors,
      disadvantageousFactors,
      neutralFactors,
      overallContextBias
    };
  }

  private generateContextualRecommendations(
    adjustment: ComparisonAdjustment,
    contextAnalysis: FairComparisonResult['contextAnalysis'],
    currentContext: ContextualData
  ): FairComparisonResult['recommendedActions'] {
    const recommendations: FairComparisonResult['recommendedActions'] = [];

    // Address disadvantageous factors
    contextAnalysis.disadvantageousFactors.forEach(factor => {
      recommendations.push({
        type: 'context_improvement',
        priority: 'medium',
        description: `Improve conditions for ${factor}`,
        expectedImpact: 5
      });
    });

    // Leverage advantageous factors
    contextAnalysis.advantageousFactors.forEach(factor => {
      recommendations.push({
        type: 'preparation',
        priority: 'low',
        description: `Continue leveraging favorable ${factor}`,
        expectedImpact: 2
      });
    });

    // General skill development if context is neutral
    if (contextAnalysis.overallContextBias === 'neutral') {
      recommendations.push({
        type: 'skill_development',
        priority: 'high',
        description: 'Focus on core skill development as context is fair',
        expectedImpact: 10
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private assessComparisonReliability(
    adjustment: ComparisonAdjustment,
    context: ContextualData,
    benchmark: ContextualBenchmark
  ): FairComparisonResult['comparisonReliability'] {
    const factors: string[] = [];
    const limitations: string[] = [];
    const recommendations: string[] = [];

    // Assess reliability factors
    if (adjustment.fairnessScore >= 0.8) {
      factors.push('High contextual fairness');
    } else if (adjustment.fairnessScore >= 0.6) {
      factors.push('Moderate contextual fairness');
      limitations.push('Some contextual bias remains');
    } else {
      limitations.push('Significant contextual bias detected');
      recommendations.push('Consider retesting in more favorable conditions');
    }

    if (adjustment.adjustmentFactors.length <= 3) {
      factors.push('Few adjustment factors needed');
    } else {
      limitations.push('Many contextual adjustments required');
      recommendations.push('Focus on improving context consistency');
    }

    const score = Math.round(
      (adjustment.fairnessScore * 50) +
      (Math.max(0, 6 - adjustment.adjustmentFactors.length) * 8) +
      (adjustment.confidenceInterval.confidence * 0.5)
    );

    return {
      score: Math.min(100, score),
      factors,
      limitations,
      recommendations
    };
  }

  // Additional helper methods with simplified implementations

  private async identifyPerformancePatterns(
    performanceHistory: Array<{ score: number; context: ContextualData; timestamp: Date }>
  ): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];

    // Simple pattern: time of day performance
    const morningPerf = performanceHistory.filter(p => p.context.temporalContext.timeOfDay < 50).map(p => p.score);
    const eveningPerf = performanceHistory.filter(p => p.context.temporalContext.timeOfDay >= 50).map(p => p.score);

    if (morningPerf.length > 0 && eveningPerf.length > 0) {
      const morningAvg = morningPerf.reduce((a, b) => a + b, 0) / morningPerf.length;
      const eveningAvg = eveningPerf.reduce((a, b) => a + b, 0) / eveningPerf.length;
      const difference = Math.abs(morningAvg - eveningAvg);

      if (difference > 5) {
        insights.push({
          insightType: 'performance_pattern',
          title: 'Time of Day Performance Pattern',
          description: `Performance varies by ${difference.toFixed(1)} points between morning and evening`,
          evidence: [`Morning average: ${morningAvg.toFixed(1)}`, `Evening average: ${eveningAvg.toFixed(1)}`],
          confidence: 0.8,
          actionability: 'immediate',
          impactPotential: 'medium'
        });
      }
    }

    return insights;
  }

  private identifyOptimalContexts(
    performanceHistory: Array<{ score: number; context: ContextualData; timestamp: Date }>
  ): Array<{
    contextDescription: string;
    averagePerformance: number;
    frequency: number;
    reproducibility: number;
  }> {
    // Simplified optimal context identification
    const topPerformances = performanceHistory
      .filter(p => p.score >= 80)
      .slice(0, 5);

    return topPerformances.map(perf => ({
      contextDescription: 'High performance context',
      averagePerformance: perf.score,
      frequency: 0.2,
      reproducibility: 0.7
    }));
  }

  private identifyChallengingContexts(
    performanceHistory: Array<{ score: number; context: ContextualData; timestamp: Date }>
  ): Array<{
    contextDescription: string;
    averagePerformance: number;
    frequency: number;
    mitigationStrategies: string[];
  }> {
    // Simplified challenging context identification
    const lowPerformances = performanceHistory
      .filter(p => p.score < 60)
      .slice(0, 3);

    return lowPerformances.map(perf => ({
      contextDescription: 'Challenging performance context',
      averagePerformance: perf.score,
      frequency: 0.15,
      mitigationStrategies: ['Additional preparation', 'Context improvement', 'Skill development']
    }));
  }

  private generateContextualGuidance(
    patterns: ContextualInsight[],
    optimalContexts: any[],
    challengingContexts: any[]
  ): string[] {
    const guidance: string[] = [];

    if (patterns.length > 0) {
      guidance.push('Leverage identified performance patterns for optimal timing');
    }

    if (optimalContexts.length > 0) {
      guidance.push('Seek to replicate conditions from high-performance contexts');
    }

    if (challengingContexts.length > 0) {
      guidance.push('Develop strategies to mitigate challenging context factors');
    }

    guidance.push('Monitor context factors consistently for pattern recognition');
    
    return guidance;
  }

  private calculateDifficultyMultiplier(difficulty: number): number {
    // Higher difficulty scenarios get higher multipliers for same raw score
    return 1 + (difficulty / 100) * 0.5;
  }

  private calculateExperienceAdjustment(experienceLevel: number, difficulty: number): number {
    // More experienced users get smaller bonuses, especially on easier scenarios
    const experienceBonus = Math.max(0, (100 - experienceLevel) / 100 * 10);
    const difficultyFactor = difficulty / 100;
    return experienceBonus * (1 - difficultyFactor * 0.5);
  }

  private async calculateContextualModifiers(contextFactors: Partial<ContextualData>): Promise<Array<{
    factor: string;
    impact: number;
    justification: string;
  }>> {
    const modifiers: Array<{ factor: string; impact: number; justification: string }> = [];

    // Simple contextual modifiers
    if (contextFactors.environmentalContext?.toolAvailability) {
      const toolImpact = (contextFactors.environmentalContext.toolAvailability - 75) / 100 * 5;
      if (Math.abs(toolImpact) > 1) {
        modifiers.push({
          factor: 'Tool Availability',
          impact: toolImpact,
          justification: `Tool availability ${toolImpact > 0 ? 'advantage' : 'disadvantage'} of ${Math.abs(toolImpact).toFixed(1)} points`
        });
      }
    }

    return modifiers;
  }

  private identifyPerformancePatternInsights(comparisonResults: FairComparisonResult[]): ContextualInsight[] {
    return [{
      insightType: 'performance_pattern',
      title: 'Contextual Performance Analysis',
      description: 'Analysis of performance patterns across different contexts',
      evidence: ['Multiple comparison points analyzed'],
      confidence: 0.75,
      actionability: 'short_term',
      impactPotential: 'medium'
    }];
  }

  private identifyContextImpactInsights(comparisonResults: FairComparisonResult[]): ContextualInsight[] {
    return [{
      insightType: 'context_impact',
      title: 'Context Factor Impact',
      description: 'Key contextual factors affecting performance',
      evidence: ['Context analysis completed'],
      confidence: 0.8,
      actionability: 'immediate',
      impactPotential: 'high'
    }];
  }

  private identifyImprovementOpportunityInsights(comparisonResults: FairComparisonResult[]): ContextualInsight[] {
    return [{
      insightType: 'improvement_opportunity',
      title: 'Context Optimization Opportunities',
      description: 'Opportunities to improve performance through context optimization',
      evidence: ['Improvement areas identified'],
      confidence: 0.7,
      actionability: 'short_term',
      impactPotential: 'medium'
    }];
  }

  private identifyBiasDetectionInsights(comparisonResults: FairComparisonResult[]): ContextualInsight[] {
    return [{
      insightType: 'bias_detection',
      title: 'Comparison Bias Detection',
      description: 'Potential biases in performance comparisons identified',
      evidence: ['Bias analysis completed'],
      confidence: 0.6,
      actionability: 'strategic',
      impactPotential: 'transformative'
    }];
  }

  private getImpactScore(impact: string): number {
    const scores = { low: 1, medium: 2, high: 3, transformative: 4 };
    return scores[impact] || 1;
  }
}

export const contextualComparator = new ContextualComparator();