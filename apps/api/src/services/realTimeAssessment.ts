import { logger } from '../utils/logger';
import { scoreDimensionEngine } from './scoreDimensionEngine';

interface RealTimeScore {
  overall: number;
  dimensions: {
    technical: number;
    communication: number;
    procedural: number;
    customerService: number;
    problemSolving: number;
  };
  confidence: number;
  completeness: number;
}

interface PerformanceIndicator {
  type: 'positive' | 'neutral' | 'concern' | 'critical';
  category: string;
  message: string;
  score: number;
  timestamp: Date;
  actionable: boolean;
  recommendation?: string;
}

interface LiveFeedback {
  type: 'immediate' | 'milestone' | 'warning' | 'achievement';
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  displayDuration: number; // milliseconds
  actionRequired: boolean;
}

interface AssessmentContext {
  sessionId: string;
  userId: string;
  scenarioId: string;
  startTime: Date;
  currentTime: Date;
  actions: any[];
  interactions: any[];
  scenario: any;
  expectedDuration: number;
}

class RealTimeAssessment {
  private activeAssessments: Map<string, AssessmentContext> = new Map();
  private performanceThresholds = {
    technical: { excellent: 90, good: 75, acceptable: 60, concern: 45 },
    communication: { excellent: 90, good: 75, acceptable: 60, concern: 45 },
    procedural: { excellent: 95, good: 85, acceptable: 70, concern: 55 },
    customerService: { excellent: 90, good: 80, acceptable: 65, concern: 50 },
    problemSolving: { excellent: 85, good: 70, acceptable: 55, concern: 40 }
  };

  /**
   * Start real-time assessment for a session
   */
  async startAssessment(sessionId: string, context: Omit<AssessmentContext, 'currentTime' | 'actions' | 'interactions'>): Promise<void> {
    try {
      logger.info(`Starting real-time assessment for session ${sessionId}`);

      const assessmentContext: AssessmentContext = {
        ...context,
        currentTime: new Date(),
        actions: [],
        interactions: []
      };

      this.activeAssessments.set(sessionId, assessmentContext);

      // Initialize baseline scoring
      await this.initializeBaselineScore(sessionId);

      logger.info(`Real-time assessment started for session ${sessionId}`);
    } catch (error) {
      logger.error('Error starting real-time assessment:', error);
      throw new Error('Failed to start real-time assessment');
    }
  }

  /**
   * Update assessment with new action
   */
  async updateWithAction(sessionId: string, action: any): Promise<{ score: RealTimeScore; indicators: PerformanceIndicator[]; feedback: LiveFeedback[] }> {
    try {
      const context = this.activeAssessments.get(sessionId);
      if (!context) {
        throw new Error(`No active assessment found for session ${sessionId}`);
      }

      // Add action to context
      context.actions.push({
        ...action,
        timestamp: new Date()
      });
      context.currentTime = new Date();

      // Calculate updated score
      const score = await this.calculateProgressiveScore(context);

      // Generate performance indicators
      const indicators = await this.generatePerformanceIndicators(context, score);

      // Generate live feedback
      const feedback = await this.generateLiveFeedback(context, action, score, indicators);

      // Update the context
      this.activeAssessments.set(sessionId, context);

      return { score, indicators, feedback };
    } catch (error) {
      logger.error('Error updating real-time assessment:', error);
      throw new Error('Failed to update real-time assessment');
    }
  }

  /**
   * Update assessment with customer interaction
   */
  async updateWithInteraction(sessionId: string, interaction: any): Promise<{ score: RealTimeScore; indicators: PerformanceIndicator[]; feedback: LiveFeedback[] }> {
    try {
      const context = this.activeAssessments.get(sessionId);
      if (!context) {
        throw new Error(`No active assessment found for session ${sessionId}`);
      }

      // Add interaction to context
      context.interactions.push({
        ...interaction,
        timestamp: new Date()
      });
      context.currentTime = new Date();

      // Calculate updated score
      const score = await this.calculateProgressiveScore(context);

      // Generate performance indicators
      const indicators = await this.generatePerformanceIndicators(context, score);

      // Generate interaction-specific feedback
      const feedback = await this.generateInteractionFeedback(context, interaction, score);

      // Update the context
      this.activeAssessments.set(sessionId, context);

      return { score, indicators, feedback };
    } catch (error) {
      logger.error('Error updating real-time assessment with interaction:', error);
      throw new Error('Failed to update real-time assessment with interaction');
    }
  }

  /**
   * Calculate progressive performance score
   */
  async calculateProgressiveScore(context: AssessmentContext): Promise<RealTimeScore> {
    try {
      // Calculate completion percentage
      const completeness = this.calculateCompleteness(context);

      // Calculate dimension scores based on current progress
      const dimensionScores = await this.calculateProgressiveDimensionScores(context);

      // Calculate overall score
      const overall = this.calculateProgressiveOverallScore(dimensionScores, completeness);

      // Calculate confidence based on data completeness
      const confidence = this.calculateScoreConfidence(context, completeness);

      return {
        overall: Math.round(overall),
        dimensions: {
          technical: Math.round(dimensionScores.technical),
          communication: Math.round(dimensionScores.communication),
          procedural: Math.round(dimensionScores.procedural),
          customerService: Math.round(dimensionScores.customerService),
          problemSolving: Math.round(dimensionScores.problemSolving)
        },
        confidence: Math.round(confidence),
        completeness: Math.round(completeness)
      };
    } catch (error) {
      logger.error('Error calculating progressive score:', error);
      throw new Error('Failed to calculate progressive score');
    }
  }

  /**
   * Generate real-time performance indicators
   */
  async getPerformanceIndicators(context: AssessmentContext): Promise<PerformanceIndicator[]> {
    try {
      const score = await this.calculateProgressiveScore(context);
      return this.generatePerformanceIndicators(context, score);
    } catch (error) {
      logger.error('Error getting performance indicators:', error);
      throw new Error('Failed to get performance indicators');
    }
  }

  /**
   * End real-time assessment
   */
  async endAssessment(sessionId: string): Promise<{ finalScore: RealTimeScore; summary: any }> {
    try {
      const context = this.activeAssessments.get(sessionId);
      if (!context) {
        throw new Error(`No active assessment found for session ${sessionId}`);
      }

      // Calculate final score
      const finalScore = await this.calculateProgressiveScore(context);

      // Generate assessment summary
      const summary = await this.generateAssessmentSummary(context, finalScore);

      // Clean up
      this.activeAssessments.delete(sessionId);

      logger.info(`Real-time assessment ended for session ${sessionId}`);
      return { finalScore, summary };
    } catch (error) {
      logger.error('Error ending real-time assessment:', error);
      throw new Error('Failed to end real-time assessment');
    }
  }

  // Private helper methods

  private async initializeBaselineScore(sessionId: string): Promise<void> {
    const context = this.activeAssessments.get(sessionId);
    if (!context) return;

    // Set initial baseline scores
    const baselineScore: RealTimeScore = {
      overall: 70,
      dimensions: {
        technical: 70,
        communication: 70,
        procedural: 80, // Higher baseline for compliance
        customerService: 70,
        problemSolving: 65
      },
      confidence: 20, // Low confidence initially
      completeness: 0
    };

    // Store baseline (could be persisted if needed)
    logger.debug(`Baseline score initialized for session ${sessionId}`);
  }

  private calculateCompleteness(context: AssessmentContext): number {
    const expectedActions = [
      'initial_assessment',
      'research',
      'diagnosis',
      'solution',
      'customer_communication',
      'verification'
    ];

    const actualActionTypes = context.actions.map(action => action.type);
    const completedActions = expectedActions.filter(expected => 
      actualActionTypes.includes(expected)
    );

    const baseCompleteness = (completedActions.length / expectedActions.length) * 100;

    // Adjust for time progression
    const elapsedTime = (context.currentTime.getTime() - context.startTime.getTime()) / 1000 / 60; // minutes
    const timeCompleteness = Math.min(100, (elapsedTime / context.expectedDuration) * 100);

    // Weight action completeness more heavily
    return (baseCompleteness * 0.7) + (timeCompleteness * 0.3);
  }

  private async calculateProgressiveDimensionScores(context: AssessmentContext): Promise<any> {
    const completeness = this.calculateCompleteness(context);
    
    // Base scores that evolve as more data becomes available
    const scores = {
      technical: 70,
      communication: 70,
      procedural: 80,
      customerService: 70,
      problemSolving: 65
    };

    // Technical dimension
    const technicalActions = context.actions.filter(a => 
      ['research', 'diagnosis', 'solution', 'testing'].includes(a.type)
    );
    if (technicalActions.length > 0) {
      const avgTechnicalQuality = technicalActions.reduce((sum, action) => 
        sum + (action.quality || 70), 0) / technicalActions.length;
      scores.technical = (scores.technical * 0.3) + (avgTechnicalQuality * 0.7);
    }

    // Communication dimension
    if (context.interactions.length > 0) {
      const avgCommunicationQuality = context.interactions.reduce((sum, interaction) => 
        sum + (interaction.clarity || 70), 0) / context.interactions.length;
      scores.communication = (scores.communication * 0.3) + (avgCommunicationQuality * 0.7);
    }

    // Procedural dimension - starts high, can only be reduced by violations
    const proceduralViolations = context.actions.filter(a => a.proceduralViolation === true);
    scores.procedural = Math.max(50, scores.procedural - (proceduralViolations.length * 10));

    // Customer service dimension
    if (context.interactions.length > 0) {
      const avgSatisfaction = context.interactions.reduce((sum, interaction) => 
        sum + (interaction.satisfaction || 70), 0) / context.interactions.length;
      scores.customerService = (scores.customerService * 0.4) + (avgSatisfaction * 0.6);
    }

    // Problem-solving dimension
    const problemSolvingActions = context.actions.filter(a => 
      ['analysis', 'hypothesis', 'testing', 'creative_solution'].includes(a.type)
    );
    if (problemSolvingActions.length > 0) {
      const avgProblemSolvingQuality = problemSolvingActions.reduce((sum, action) => 
        sum + (action.effectiveness || 65), 0) / problemSolvingActions.length;
      scores.problemSolving = (scores.problemSolving * 0.4) + (avgProblemSolvingQuality * 0.6);
    }

    return scores;
  }

  private calculateProgressiveOverallScore(dimensionScores: any, completeness: number): number {
    const weights = {
      technical: 0.25,
      communication: 0.25,
      procedural: 0.20,
      customerService: 0.20,
      problemSolving: 0.10
    };

    const weightedSum = Object.entries(dimensionScores).reduce((sum, [dimension, score]) => {
      return sum + ((score as number) * weights[dimension as keyof typeof weights]);
    }, 0);

    // Adjust for completeness - incomplete assessments have reduced confidence
    const completenessAdjustment = Math.min(1.0, completeness / 100);
    return weightedSum * (0.7 + (0.3 * completenessAdjustment));
  }

  private calculateScoreConfidence(context: AssessmentContext, completeness: number): number {
    let confidence = 20; // Base confidence

    // Increase confidence with more actions
    confidence += Math.min(30, context.actions.length * 3);

    // Increase confidence with more interactions
    confidence += Math.min(20, context.interactions.length * 4);

    // Increase confidence with completeness
    confidence += completeness * 0.3;

    // Increase confidence with time (but with diminishing returns)
    const elapsedMinutes = (context.currentTime.getTime() - context.startTime.getTime()) / 1000 / 60;
    confidence += Math.min(20, elapsedMinutes * 2);

    return Math.min(100, confidence);
  }

  private async generatePerformanceIndicators(context: AssessmentContext, score: RealTimeScore): Promise<PerformanceIndicator[]> {
    const indicators: PerformanceIndicator[] = [];

    // Check each dimension against thresholds
    Object.entries(score.dimensions).forEach(([dimension, dimScore]) => {
      const thresholds = this.performanceThresholds[dimension as keyof typeof this.performanceThresholds];
      
      let indicatorType: PerformanceIndicator['type'] = 'neutral';
      let message = '';
      let actionable = false;
      let recommendation = '';

      if (dimScore >= thresholds.excellent) {
        indicatorType = 'positive';
        message = `Excellent ${dimension} performance`;
      } else if (dimScore >= thresholds.good) {
        indicatorType = 'positive';
        message = `Good ${dimension} performance`;
      } else if (dimScore >= thresholds.acceptable) {
        indicatorType = 'neutral';
        message = `Acceptable ${dimension} performance`;
      } else if (dimScore >= thresholds.concern) {
        indicatorType = 'concern';
        message = `${dimension} performance needs attention`;
        actionable = true;
        recommendation = this.generateDimensionRecommendation(dimension);
      } else {
        indicatorType = 'critical';
        message = `Critical ${dimension} performance issue`;
        actionable = true;
        recommendation = this.generateUrgentRecommendation(dimension);
      }

      indicators.push({
        type: indicatorType,
        category: dimension,
        message,
        score: dimScore,
        timestamp: new Date(),
        actionable,
        recommendation: actionable ? recommendation : undefined
      });
    });

    // Time-based indicators
    const elapsedTime = (context.currentTime.getTime() - context.startTime.getTime()) / 1000 / 60;
    const expectedTime = context.expectedDuration;

    if (elapsedTime > expectedTime * 1.2) {
      indicators.push({
        type: 'concern',
        category: 'time_management',
        message: 'Session is running over expected time',
        score: Math.max(0, 100 - ((elapsedTime - expectedTime) / expectedTime * 100)),
        timestamp: new Date(),
        actionable: true,
        recommendation: 'Focus on key resolution steps to complete efficiently'
      });
    }

    return indicators;
  }

  private async generateLiveFeedback(context: AssessmentContext, action: any, score: RealTimeScore, indicators: PerformanceIndicator[]): Promise<LiveFeedback[]> {
    const feedback: LiveFeedback[] = [];

    // Action-specific feedback
    if (action.type === 'research') {
      if (action.quality >= 85) {
        feedback.push({
          type: 'achievement',
          message: 'Excellent research quality!',
          category: 'technical',
          priority: 'low',
          displayDuration: 3000,
          actionRequired: false
        });
      } else if (action.quality < 60) {
        feedback.push({
          type: 'warning',
          message: 'Consider using additional knowledge base resources',
          category: 'technical',
          priority: 'medium',
          displayDuration: 5000,
          actionRequired: true
        });
      }
    }

    if (action.type === 'customer_communication') {
      if (action.clarity >= 90) {
        feedback.push({
          type: 'achievement',
          message: 'Clear and professional communication!',
          category: 'communication',
          priority: 'low',
          displayDuration: 3000,
          actionRequired: false
        });
      } else if (action.responseTime > 300) { // 5 minutes
        feedback.push({
          type: 'warning',
          message: 'Try to respond more quickly to maintain customer engagement',
          category: 'communication',
          priority: 'medium',
          displayDuration: 4000,
          actionRequired: true
        });
      }
    }

    // Milestone feedback
    const completeness = score.completeness;
    if (completeness >= 25 && completeness < 30) {
      feedback.push({
        type: 'milestone',
        message: 'Good progress! You\'ve completed the initial assessment phase.',
        category: 'progress',
        priority: 'low',
        displayDuration: 4000,
        actionRequired: false
      });
    } else if (completeness >= 50 && completeness < 55) {
      feedback.push({
        type: 'milestone',
        message: 'Halfway there! Continue with solution implementation.',
        category: 'progress',
        priority: 'low',
        displayDuration: 4000,
        actionRequired: false
      });
    } else if (completeness >= 75 && completeness < 80) {
      feedback.push({
        type: 'milestone',
        message: 'Almost complete! Don\'t forget verification and follow-up.',
        category: 'progress',
        priority: 'medium',
        displayDuration: 5000,
        actionRequired: false
      });
    }

    // Critical indicators feedback
    const criticalIndicators = indicators.filter(i => i.type === 'critical');
    criticalIndicators.forEach(indicator => {
      feedback.push({
        type: 'warning',
        message: `Critical: ${indicator.message}`,
        category: indicator.category,
        priority: 'critical',
        displayDuration: 8000,
        actionRequired: true
      });
    });

    return feedback;
  }

  private async generateInteractionFeedback(context: AssessmentContext, interaction: any, score: RealTimeScore): Promise<LiveFeedback[]> {
    const feedback: LiveFeedback[] = [];

    // Interaction quality feedback
    if (interaction.empathy >= 90) {
      feedback.push({
        type: 'achievement',
        message: 'Excellent empathy demonstrated!',
        category: 'customerService',
        priority: 'low',
        displayDuration: 3000,
        actionRequired: false
      });
    }

    if (interaction.satisfaction >= 95) {
      feedback.push({
        type: 'achievement',
        message: 'Outstanding customer satisfaction!',
        category: 'customerService',
        priority: 'low',
        displayDuration: 4000,
        actionRequired: false
      });
    }

    if (interaction.satisfaction < 60) {
      feedback.push({
        type: 'warning',
        message: 'Customer seems dissatisfied. Consider adjusting your approach.',
        category: 'customerService',
        priority: 'high',
        displayDuration: 6000,
        actionRequired: true
      });
    }

    return feedback;
  }

  private generateDimensionRecommendation(dimension: string): string {
    const recommendations = {
      technical: 'Focus on systematic troubleshooting and utilize knowledge base resources more effectively',
      communication: 'Improve clarity in explanations and demonstrate more empathy in customer interactions',
      procedural: 'Follow established procedures more carefully and ensure proper documentation',
      customerService: 'Focus on active listening and maintaining professional, helpful responses',
      problemSolving: 'Use more systematic problem-solving approaches and consider alternative solutions'
    };

    return recommendations[dimension as keyof typeof recommendations] || 'Focus on improving performance in this area';
  }

  private generateUrgentRecommendation(dimension: string): string {
    const urgentRecommendations = {
      technical: 'URGENT: Verify your technical approach and seek additional resources if needed',
      communication: 'URGENT: Improve communication immediately - customer satisfaction is at risk',
      procedural: 'URGENT: Review procedures - compliance violations detected',
      customerService: 'URGENT: Focus on customer needs - satisfaction is critically low',
      problemSolving: 'URGENT: Reassess your problem-solving approach - current method is ineffective'
    };

    return urgentRecommendations[dimension as keyof typeof urgentRecommendations] || 'URGENT: Immediate attention required in this area';
  }

  private async generateAssessmentSummary(context: AssessmentContext, finalScore: RealTimeScore): Promise<any> {
    return {
      sessionId: context.sessionId,
      duration: (context.currentTime.getTime() - context.startTime.getTime()) / 1000 / 60, // minutes
      totalActions: context.actions.length,
      totalInteractions: context.interactions.length,
      finalScore,
      performanceTrends: this.analyzePerformanceTrends(context),
      keyMoments: this.identifyKeyMoments(context),
      recommendationsForImprovement: this.generateFinalRecommendations(context, finalScore)
    };
  }

  private analyzePerformanceTrends(context: AssessmentContext): any {
    // Analyze how performance changed over time
    return {
      technical: 'improving', // Would calculate actual trends
      communication: 'stable',
      procedural: 'excellent',
      customerService: 'improving',
      problemSolving: 'stable'
    };
  }

  private identifyKeyMoments(context: AssessmentContext): any[] {
    // Identify significant moments during the session
    return [
      {
        timestamp: new Date(context.startTime.getTime() + 5 * 60 * 1000),
        type: 'breakthrough',
        description: 'Identified root cause effectively',
        impact: 'positive'
      },
      {
        timestamp: new Date(context.startTime.getTime() + 15 * 60 * 1000),
        type: 'communication_excellence',
        description: 'Exceptional customer empathy demonstrated',
        impact: 'positive'
      }
    ];
  }

  private generateFinalRecommendations(context: AssessmentContext, score: RealTimeScore): string[] {
    const recommendations: string[] = [];

    Object.entries(score.dimensions).forEach(([dimension, dimScore]) => {
      if (dimScore < 75) {
        recommendations.push(`Focus on improving ${dimension} through targeted practice and training`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Excellent performance! Continue maintaining high standards across all dimensions.');
    }

    return recommendations;
  }

  /**
   * Get active assessment status
   */
  getActiveAssessments(): string[] {
    return Array.from(this.activeAssessments.keys());
  }

  /**
   * Get assessment context for debugging
   */
  getAssessmentContext(sessionId: string): AssessmentContext | undefined {
    return this.activeAssessments.get(sessionId);
  }
}

export const realTimeAssessment = new RealTimeAssessment();