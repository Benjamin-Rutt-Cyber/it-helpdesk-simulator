import { logger } from '../utils/logger';
import { scoreDimensionEngine } from './scoreDimensionEngine';
import { realTimeAssessment } from './realTimeAssessment';
import { industryBenchmark } from './industryBenchmark';
import { scorePresentation } from './scorePresentation';

interface PerformanceScore {
  overall: number;
  dimensions: {
    technical: {
      accuracy: number;
      efficiency: number;
      knowledge: number;
      innovation: number;
      weighted: number;
    };
    communication: {
      clarity: number;
      empathy: number;
      responsiveness: number;
      documentation: number;
      weighted: number;
    };
    procedural: {
      compliance: number;
      security: number;
      escalation: number;
      documentation: number;
      weighted: number;
    };
    customerService: {
      satisfaction: number;
      relationship: number;
      professionalism: number;
      followUp: number;
      weighted: number;
    };
    problemSolving: {
      approach: number;
      creativity: number;
      thoroughness: number;
      adaptability: number;
      weighted: number;
    };
  };
  metadata: {
    sessionId: string;
    scenarioId: string;
    userId: string;
    timestamp: Date;
    contextFactors: any;
    industryAlignment: any;
  };
}

interface ScoringContext {
  sessionId: string;
  scenarioId: string;
  userId: string;
  scenarioData: any;
  userActions: any[];
  customerInteractions: any[];
  resolutionData: any;
  contextFactors: {
    difficulty: number;
    timeConstraints: number;
    resourceAvailability: number;
    customerComplexity: number;
    technicalComplexity: number;
  };
}

interface ScoringWeights {
  dimensions: {
    technical: number;       // 25%
    communication: number;   // 25%
    procedural: number;      // 20%
    customerService: number; // 20%
    problemSolving: number;  // 10%
  };
  subDimensions: {
    technical: {
      accuracy: number;
      efficiency: number;
      knowledge: number;
      innovation: number;
    };
    communication: {
      clarity: number;
      empathy: number;
      responsiveness: number;
      documentation: number;
    };
    procedural: {
      compliance: number;
      security: number;
      escalation: number;
      documentation: number;
    };
    customerService: {
      satisfaction: number;
      relationship: number;
      professionalism: number;
      followUp: number;
    };
    problemSolving: {
      approach: number;
      creativity: number;
      thoroughness: number;
      adaptability: number;
    };
  };
}

class PerformanceScorer {
  private defaultWeights: ScoringWeights;

  constructor() {
    this.defaultWeights = this.initializeDefaultWeights();
  }

  /**
   * Calculate comprehensive performance score for a session
   */
  async calculatePerformanceScore(context: ScoringContext): Promise<PerformanceScore> {
    try {
      logger.info(`Calculating performance score for session ${context.sessionId}`);

      // Get industry benchmarks for context
      const benchmarks = await industryBenchmark.getBenchmarks(context.scenarioData.category);
      
      // Calculate dimension scores
      const dimensionScores = await this.calculateDimensionScores(context);
      
      // Apply contextual adjustments
      const adjustedScores = this.applyContextualAdjustments(dimensionScores, context);
      
      // Calculate weighted overall score
      const overallScore = this.calculateOverallScore(adjustedScores);
      
      // Get industry alignment assessment
      const industryAlignment = await industryBenchmark.assessAlignment(adjustedScores, benchmarks);

      const score: PerformanceScore = {
        overall: Math.round(overallScore),
        dimensions: adjustedScores,
        metadata: {
          sessionId: context.sessionId,
          scenarioId: context.scenarioId,
          userId: context.userId,
          timestamp: new Date(),
          contextFactors: context.contextFactors,
          industryAlignment
        }
      };

      logger.info(`Performance score calculated: ${score.overall} for session ${context.sessionId}`);
      return score;

    } catch (error) {
      logger.error('Error calculating performance score:', error);
      throw new Error('Failed to calculate performance score');
    }
  }

  /**
   * Calculate real-time performance score during session
   */
  async calculateRealTimeScore(sessionId: string, currentActions: any[]): Promise<any> {
    try {
      logger.info(`Calculating real-time score for session ${sessionId}`);

      // Get current session context
      const context = await this.buildSessionContext(sessionId, currentActions);
      
      // Calculate progressive score
      const progressiveScore = await realTimeAssessment.calculateProgressiveScore(context);
      
      // Get performance indicators
      const indicators = await realTimeAssessment.getPerformanceIndicators(context);
      
      // Generate immediate feedback
      const feedback = await this.generateImmediateFeedback(progressiveScore, indicators);

      return {
        sessionId,
        currentScore: Math.round(progressiveScore.overall),
        dimensionProgress: progressiveScore.dimensions,
        indicators,
        feedback,
        timestamp: new Date(),
        completionPercentage: this.calculateCompletionPercentage(context)
      };

    } catch (error) {
      logger.error('Error calculating real-time score:', error);
      throw new Error('Failed to calculate real-time score');
    }
  }

  /**
   * Get detailed score breakdown with explanations
   */
  async getScoreBreakdown(sessionId: string): Promise<any> {
    try {
      logger.info(`Getting score breakdown for session ${sessionId}`);

      const context = await this.buildSessionContext(sessionId);
      const score = await this.calculatePerformanceScore(context);
      
      // Generate detailed breakdown
      const breakdown = await scorePresentation.generateBreakdown(score, context);
      
      // Add improvement recommendations
      const recommendations = await this.generateImprovementRecommendations(score, context);
      
      // Get industry context
      const industryContext = await industryBenchmark.getIndustryContext(score);

      return {
        score,
        breakdown,
        recommendations,
        industryContext,
        explanations: await scorePresentation.generateExplanations(score, context),
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Error getting score breakdown:', error);
      throw new Error('Failed to get score breakdown');
    }
  }

  /**
   * Compare performance against industry benchmarks
   */
  async benchmarkPerformance(userId: string, timeframe?: any): Promise<any> {
    try {
      logger.info(`Benchmarking performance for user ${userId}`);

      // Get user's recent performance scores
      const recentScores = await this.getUserRecentScores(userId, timeframe);
      
      // Calculate average performance
      const averagePerformance = this.calculateAveragePerformance(recentScores);
      
      // Get industry benchmarks
      const benchmarks = await industryBenchmark.getComprehensiveBenchmarks();
      
      // Calculate percentile rankings
      const rankings = await industryBenchmark.calculatePercentileRankings(averagePerformance, benchmarks);
      
      // Generate comparison insights
      const insights = await industryBenchmark.generateComparisonInsights(averagePerformance, benchmarks);

      return {
        userId,
        timeframe,
        averagePerformance,
        industryRankings: rankings,
        insights,
        recommendations: await this.generateBenchmarkRecommendations(averagePerformance, benchmarks),
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Error benchmarking performance:', error);
      throw new Error('Failed to benchmark performance');
    }
  }

  // Private helper methods

  private initializeDefaultWeights(): ScoringWeights {
    return {
      dimensions: {
        technical: 0.25,
        communication: 0.25,
        procedural: 0.20,
        customerService: 0.20,
        problemSolving: 0.10
      },
      subDimensions: {
        technical: {
          accuracy: 0.40,
          efficiency: 0.25,
          knowledge: 0.25,
          innovation: 0.10
        },
        communication: {
          clarity: 0.30,
          empathy: 0.25,
          responsiveness: 0.25,
          documentation: 0.20
        },
        procedural: {
          compliance: 0.35,
          security: 0.30,
          escalation: 0.20,
          documentation: 0.15
        },
        customerService: {
          satisfaction: 0.35,
          relationship: 0.25,
          professionalism: 0.25,
          followUp: 0.15
        },
        problemSolving: {
          approach: 0.35,
          creativity: 0.25,
          thoroughness: 0.25,
          adaptability: 0.15
        }
      }
    };
  }

  private async calculateDimensionScores(context: ScoringContext): Promise<PerformanceScore['dimensions']> {
    // Calculate technical dimension scores
    const technicalScores = await scoreDimensionEngine.calculateTechnicalScores(
      context.userActions,
      context.resolutionData,
      context.scenarioData
    );

    // Calculate communication dimension scores
    const communicationScores = await scoreDimensionEngine.calculateCommunicationScores(
      context.customerInteractions,
      context.resolutionData
    );

    // Calculate procedural dimension scores
    const proceduralScores = await scoreDimensionEngine.calculateProceduralScores(
      context.userActions,
      context.scenarioData,
      context.resolutionData
    );

    // Calculate customer service dimension scores
    const customerServiceScores = await scoreDimensionEngine.calculateCustomerServiceScores(
      context.customerInteractions,
      context.resolutionData
    );

    // Calculate problem-solving dimension scores
    const problemSolvingScores = await scoreDimensionEngine.calculateProblemSolvingScores(
      context.userActions,
      context.resolutionData,
      context.scenarioData
    );

    // Apply sub-dimension weights
    return {
      technical: {
        ...technicalScores,
        weighted: this.calculateWeightedScore(technicalScores, this.defaultWeights.subDimensions.technical)
      },
      communication: {
        ...communicationScores,
        weighted: this.calculateWeightedScore(communicationScores, this.defaultWeights.subDimensions.communication)
      },
      procedural: {
        ...proceduralScores,
        weighted: this.calculateWeightedScore(proceduralScores, this.defaultWeights.subDimensions.procedural)
      },
      customerService: {
        ...customerServiceScores,
        weighted: this.calculateWeightedScore(customerServiceScores, this.defaultWeights.subDimensions.customerService)
      },
      problemSolving: {
        ...problemSolvingScores,
        weighted: this.calculateWeightedScore(problemSolvingScores, this.defaultWeights.subDimensions.problemSolving)
      }
    };
  }

  private calculateWeightedScore(scores: any, weights: any): number {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      if (scores[key] !== undefined) {
        weightedSum += scores[key] * (weight as number);
        totalWeight += weight as number;
      }
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  private applyContextualAdjustments(scores: PerformanceScore['dimensions'], context: ScoringContext): PerformanceScore['dimensions'] {
    const adjustmentFactors = this.calculateAdjustmentFactors(context.contextFactors);

    // Apply difficulty-based adjustments
    const adjustedScores = { ...scores };

    Object.keys(adjustedScores).forEach(dimension => {
      const dimScores = adjustedScores[dimension as keyof typeof adjustedScores];
      if (dimScores && typeof dimScores.weighted === 'number') {
        // Apply context adjustments while maintaining score bounds (0-100)
        const adjustedScore = dimScores.weighted * adjustmentFactors.overall;
        dimScores.weighted = Math.max(0, Math.min(100, Math.round(adjustedScore)));
      }
    });

    return adjustedScores;
  }

  private calculateAdjustmentFactors(contextFactors: ScoringContext['contextFactors']): any {
    // Base adjustment factor starts at 1.0 (no adjustment)
    let adjustmentFactor = 1.0;

    // Difficulty adjustment (easier scenarios get slight penalty, harder get bonus)
    if (contextFactors.difficulty > 80) {
      adjustmentFactor += 0.05; // 5% bonus for very difficult scenarios
    } else if (contextFactors.difficulty < 40) {
      adjustmentFactor -= 0.03; // 3% penalty for very easy scenarios
    }

    // Time constraint adjustment
    if (contextFactors.timeConstraints > 80) {
      adjustmentFactor += 0.03; // Bonus for high time pressure
    }

    // Customer complexity adjustment
    if (contextFactors.customerComplexity > 75) {
      adjustmentFactor += 0.04; // Bonus for difficult customers
    }

    // Technical complexity adjustment
    if (contextFactors.technicalComplexity > 85) {
      adjustmentFactor += 0.05; // Bonus for complex technical issues
    }

    // Resource availability adjustment
    if (contextFactors.resourceAvailability < 50) {
      adjustmentFactor += 0.02; // Bonus for limited resources
    }

    // Ensure adjustment factor stays within reasonable bounds
    return {
      overall: Math.max(0.9, Math.min(1.15, adjustmentFactor)),
      breakdown: {
        difficulty: contextFactors.difficulty / 100,
        timeConstraints: contextFactors.timeConstraints / 100,
        customerComplexity: contextFactors.customerComplexity / 100,
        technicalComplexity: contextFactors.technicalComplexity / 100,
        resourceAvailability: contextFactors.resourceAvailability / 100
      }
    };
  }

  private calculateOverallScore(dimensionScores: PerformanceScore['dimensions']): number {
    const weights = this.defaultWeights.dimensions;

    const weightedSum = (
      dimensionScores.technical.weighted * weights.technical +
      dimensionScores.communication.weighted * weights.communication +
      dimensionScores.procedural.weighted * weights.procedural +
      dimensionScores.customerService.weighted * weights.customerService +
      dimensionScores.problemSolving.weighted * weights.problemSolving
    );

    return Math.round(weightedSum);
  }

  private async buildSessionContext(sessionId: string, currentActions: any[] = []): Promise<ScoringContext> {
    // Mock implementation - would fetch from database
    const mockContext: ScoringContext = {
      sessionId,
      scenarioId: 'scenario_001',
      userId: 'user_001',
      scenarioData: {
        category: 'technical_support',
        difficulty: 75,
        estimatedTime: 30,
        complexity: 'intermediate'
      },
      userActions: currentActions.length > 0 ? currentActions : [
        { type: 'research', timestamp: new Date(), quality: 85 },
        { type: 'communication', timestamp: new Date(), clarity: 80, empathy: 75 },
        { type: 'solution', timestamp: new Date(), accuracy: 90, efficiency: 85 }
      ],
      customerInteractions: [
        { type: 'inquiry', satisfaction: 85, clarity: 80 },
        { type: 'follow_up', satisfaction: 90, professionalism: 95 }
      ],
      resolutionData: {
        resolved: true,
        customerSatisfaction: 88,
        timeToResolution: 25,
        followUpRequired: false,
        escalated: false
      },
      contextFactors: {
        difficulty: 75,
        timeConstraints: 60,
        resourceAvailability: 85,
        customerComplexity: 70,
        technicalComplexity: 80
      }
    };

    return mockContext;
  }

  private async generateImmediateFeedback(progressiveScore: any, indicators: any): Promise<any> {
    const feedback = {
      positive: [] as string[],
      constructive: [] as string[],
      actionable: [] as string[]
    };

    // Generate positive feedback for high-performing areas
    Object.entries(progressiveScore.dimensions).forEach(([dimension, scores]: [string, any]) => {
      if (scores.weighted >= 85) {
        feedback.positive.push(`Excellent ${dimension} performance - keep up the great work!`);
      }
    });

    // Generate constructive feedback for improvement areas
    Object.entries(progressiveScore.dimensions).forEach(([dimension, scores]: [string, any]) => {
      if (scores.weighted < 70) {
        feedback.constructive.push(`${dimension} could be improved - focus on clarity and thoroughness`);
      }
    });

    // Generate actionable feedback based on indicators
    if (indicators.responseTime > 300) { // 5 minutes
      feedback.actionable.push('Try to respond more quickly to maintain customer engagement');
    }

    if (indicators.researchQuality < 75) {
      feedback.actionable.push('Consider using additional knowledge base resources for more comprehensive solutions');
    }

    return feedback;
  }

  private calculateCompletionPercentage(context: ScoringContext): number {
    const expectedActions = ['initial_response', 'problem_diagnosis', 'solution_implementation', 'customer_confirmation'];
    const completedActions = context.userActions.map(action => action.type);
    
    const completedCount = expectedActions.filter(expected => 
      completedActions.includes(expected)
    ).length;

    return Math.round((completedCount / expectedActions.length) * 100);
  }

  private async generateImprovementRecommendations(score: PerformanceScore, context: ScoringContext): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze weak areas and generate specific recommendations
    if (score.dimensions.technical.weighted < 75) {
      recommendations.push('Focus on improving technical accuracy through additional knowledge base research and systematic troubleshooting approaches');
    }

    if (score.dimensions.communication.weighted < 75) {
      recommendations.push('Enhance communication effectiveness by using clearer language and demonstrating more empathy in customer interactions');
    }

    if (score.dimensions.procedural.weighted < 75) {
      recommendations.push('Improve procedural compliance by carefully following established protocols and documentation requirements');
    }

    if (score.dimensions.customerService.weighted < 75) {
      recommendations.push('Strengthen customer service skills through active listening and professional follow-up practices');
    }

    if (score.dimensions.problemSolving.weighted < 75) {
      recommendations.push('Develop problem-solving approach by using more systematic diagnostic methods and creative solution exploration');
    }

    return recommendations;
  }

  private async getUserRecentScores(userId: string, timeframe?: any): Promise<PerformanceScore[]> {
    // Mock implementation - would fetch from database
    const mockScores: PerformanceScore[] = [
      {
        overall: 82,
        dimensions: {
          technical: { accuracy: 85, efficiency: 80, knowledge: 82, innovation: 75, weighted: 81 },
          communication: { clarity: 78, empathy: 80, responsiveness: 85, documentation: 75, weighted: 79 },
          procedural: { compliance: 90, security: 88, escalation: 85, documentation: 80, weighted: 87 },
          customerService: { satisfaction: 85, relationship: 80, professionalism: 90, followUp: 75, weighted: 83 },
          problemSolving: { approach: 75, creativity: 70, thoroughness: 80, adaptability: 75, weighted: 75 }
        },
        metadata: {
          sessionId: 'session_001',
          scenarioId: 'scenario_001',
          userId,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          contextFactors: {},
          industryAlignment: {}
        }
      }
    ];

    return mockScores;
  }

  private calculateAveragePerformance(scores: PerformanceScore[]): any {
    if (scores.length === 0) return null;

    const totalScores = scores.reduce((acc, score) => {
      acc.overall += score.overall;
      Object.keys(score.dimensions).forEach(dimension => {
        if (!acc.dimensions[dimension]) acc.dimensions[dimension] = { weighted: 0 };
        acc.dimensions[dimension].weighted += score.dimensions[dimension as keyof typeof score.dimensions].weighted;
      });
      return acc;
    }, { overall: 0, dimensions: {} as any });

    const averagePerformance = {
      overall: Math.round(totalScores.overall / scores.length),
      dimensions: {} as any
    };

    Object.keys(totalScores.dimensions).forEach(dimension => {
      averagePerformance.dimensions[dimension] = {
        weighted: Math.round(totalScores.dimensions[dimension].weighted / scores.length)
      };
    });

    return averagePerformance;
  }

  private async generateBenchmarkRecommendations(performance: any, benchmarks: any): Promise<string[]> {
    const recommendations: string[] = [];

    if (performance.overall < benchmarks.industry.average) {
      recommendations.push('Focus on overall performance improvement to meet industry standards');
    }

    // Generate dimension-specific recommendations
    Object.entries(performance.dimensions).forEach(([dimension, scores]: [string, any]) => {
      const benchmark = benchmarks.dimensions[dimension];
      if (benchmark && scores.weighted < benchmark.average) {
        recommendations.push(`Improve ${dimension} performance to reach industry average of ${benchmark.average}`);
      }
    });

    return recommendations;
  }

  /**
   * Get performance scoring methodology explanation
   */
  async getScoringMethodology(): Promise<any> {
    try {
      return {
        overview: {
          purpose: 'Comprehensive multi-dimensional performance assessment for IT support professionals',
          approach: 'Industry-aligned scoring methodology with contextual adjustments',
          credibility: 'Designed to meet professional standards and employer expectations'
        },
        dimensions: {
          technical: {
            weight: '25%',
            description: 'Technical accuracy, efficiency, knowledge application, and innovation',
            subDimensions: this.defaultWeights.subDimensions.technical
          },
          communication: {
            weight: '25%',
            description: 'Communication clarity, empathy, responsiveness, and documentation quality',
            subDimensions: this.defaultWeights.subDimensions.communication
          },
          procedural: {
            weight: '20%',
            description: 'Process compliance, security adherence, escalation procedures, and documentation',
            subDimensions: this.defaultWeights.subDimensions.procedural
          },
          customerService: {
            weight: '20%',
            description: 'Customer satisfaction, relationship building, professionalism, and follow-up',
            subDimensions: this.defaultWeights.subDimensions.customerService
          },
          problemSolving: {
            weight: '10%',
            description: 'Problem-solving approach, creativity, thoroughness, and adaptability',
            subDimensions: this.defaultWeights.subDimensions.problemSolving
          }
        },
        contextualAdjustments: {
          description: 'Scores are adjusted based on scenario complexity and situational factors',
          factors: [
            'Scenario difficulty level',
            'Time constraints and pressure',
            'Customer complexity and behavior',
            'Technical problem complexity',
            'Available resources and tools'
          ],
          adjustmentRange: '±15% based on context factors'
        },
        industryAlignment: {
          description: 'Scoring methodology aligned with professional IT support standards',
          standards: [
            'ITIL Service Management Framework',
            'Customer Service Excellence Standards',
            'Technical Competency Benchmarks',
            'Professional Behavior Standards',
            'Quality Management Systems'
          ]
        },
        transparency: {
          scoreRange: '0-100 for all dimensions and overall score',
          calculation: 'Weighted average of dimension scores with contextual adjustments',
          feedback: 'Detailed breakdown with specific improvement recommendations',
          benchmarking: 'Comparison against industry averages and peer performance'
        }
      };
    } catch (error) {
      logger.error('Error getting scoring methodology:', error);
      throw new Error('Failed to get scoring methodology');
    }
  }
}

export const performanceScorer = new PerformanceScorer();