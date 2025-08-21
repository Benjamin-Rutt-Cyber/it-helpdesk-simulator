import { logger } from '../utils/logger';

interface ContextualFactors {
  scenarioComplexity: number;
  customerBehavior: number;
  timeConstraints: number;
  resourceLimitations: number;
  technicalDifficulty: number;
  environmentalChallenges: number;
}

interface ScenarioContext {
  type: 'basic' | 'intermediate' | 'advanced' | 'expert';
  domain: string;
  complexity: number;
  expectedDuration: number;
  requiredSkills: string[];
  commonChallenges: string[];
  successFactors: string[];
}

interface ContextualFeedback {
  originalFeedback: string;
  contextualAdjustment: string;
  situationalConsiderations: string[];
  adaptedRecommendations: string[];
  contextualStrengths: string[];
  environmentalFactors: string[];
}

interface AdaptiveFeedback {
  baseAssessment: string;
  contextualModifier: string;
  situationalRelevance: string;
  adaptedGuidance: string;
  complexityAcknowledgment: string;
  environmentalConsiderations: string[];
}

class ContextualGuidanceEngine {
  private scenarioComplexityFactors = {
    basic: {
      multiplier: 1.0,
      description: 'Straightforward scenario with standard procedures',
      adjustmentTypes: ['routine_optimization', 'basic_skill_reinforcement']
    },
    intermediate: {
      multiplier: 1.1,
      description: 'Moderate complexity requiring problem-solving skills',
      adjustmentTypes: ['analytical_thinking', 'procedure_adaptation']
    },
    advanced: {
      multiplier: 1.25,
      description: 'Complex scenario requiring advanced skills and judgment',
      adjustmentTypes: ['creative_problem_solving', 'stakeholder_management']
    },
    expert: {
      multiplier: 1.4,
      description: 'Highly complex scenario requiring expertise and innovation',
      adjustmentTypes: ['strategic_thinking', 'crisis_management', 'innovation']
    }
  };

  private customerBehaviorPatterns = {
    cooperative: {
      description: 'Customer is helpful and responsive',
      feedbackAdjustment: 'standard communication approach',
      successFactors: ['clear_explanation', 'technical_accuracy']
    },
    frustrated: {
      description: 'Customer is upset or impatient',
      feedbackAdjustment: 'emphasize empathy and de-escalation skills',
      successFactors: ['emotional_intelligence', 'patience', 'reassurance']
    },
    technical: {
      description: 'Customer has technical knowledge',
      feedbackAdjustment: 'adjust communication for technical audience',
      successFactors: ['technical_depth', 'precision', 'efficiency']
    },
    confused: {
      description: 'Customer has limited technical understanding',
      feedbackAdjustment: 'focus on clarity and education',
      successFactors: ['simplification', 'patience', 'educational_approach']
    },
    demanding: {
      description: 'Customer has high expectations or specific requirements',
      feedbackAdjustment: 'emphasize professionalism and thoroughness',
      successFactors: ['attention_to_detail', 'professional_demeanor', 'comprehensive_solutions']
    }
  };

  private environmentalChallenges = {
    time_pressure: {
      impact: 'Limited time for thorough analysis',
      guidance: 'Prioritize critical steps and communicate time constraints',
      skillsRequired: ['prioritization', 'efficiency', 'quick_decision_making']
    },
    resource_limitations: {
      impact: 'Limited tools or information available',
      guidance: 'Adapt solutions to available resources and communicate limitations',
      skillsRequired: ['resourcefulness', 'adaptability', 'creative_problem_solving']
    },
    high_stakes: {
      impact: 'Critical system or high-impact customer',
      guidance: 'Emphasize accuracy and thorough verification',
      skillsRequired: ['attention_to_detail', 'risk_management', 'verification_protocols']
    },
    multiple_stakeholders: {
      impact: 'Multiple people involved with different needs',
      guidance: 'Balance stakeholder needs and maintain clear communication',
      skillsRequired: ['stakeholder_management', 'diplomacy', 'clear_communication']
    },
    system_instability: {
      impact: 'Working with unstable or failing systems',
      guidance: 'Proceed cautiously and document all changes',
      skillsRequired: ['risk_assessment', 'documentation', 'systematic_approach']
    }
  };

  /**
   * Generate scenario-aware feedback
   */
  async generateScenarioAwareFeedback(
    performanceData: any,
    scenarioContext: ScenarioContext,
    contextualFactors: ContextualFactors
  ): Promise<ContextualFeedback[]> {
    try {
      logger.info('Generating scenario-aware feedback');

      const contextualFeedbacks: ContextualFeedback[] = [];

      // Process each dimension with contextual awareness
      Object.entries(performanceData.dimensions || {}).forEach(([dimension, dimensionData]: [string, any]) => {
        const contextualFeedback = this.adaptFeedbackToContext(
          dimension,
          dimensionData,
          scenarioContext,
          contextualFactors
        );
        contextualFeedbacks.push(contextualFeedback);
      });

      return contextualFeedbacks;
    } catch (error) {
      logger.error('Error generating scenario-aware feedback:', error);
      throw new Error('Failed to generate scenario-aware feedback');
    }
  }

  /**
   * Adapt feedback based on situational factors
   */
  async adaptFeedbackToSituation(
    baseFeedback: string,
    situationalFactors: any,
    context: ScenarioContext
  ): Promise<AdaptiveFeedback> {
    try {
      const contextualModifier = this.generateContextualModifier(situationalFactors, context);
      const situationalRelevance = this.assessSituationalRelevance(baseFeedback, situationalFactors);
      const adaptedGuidance = this.adaptGuidanceToSituation(baseFeedback, situationalFactors);
      const complexityAcknowledgment = this.generateComplexityAcknowledgment(context);
      const environmentalConsiderations = this.identifyEnvironmentalConsiderations(situationalFactors);

      return {
        baseAssessment: baseFeedback,
        contextualModifier,
        situationalRelevance,
        adaptedGuidance,
        complexityAcknowledgment,
        environmentalConsiderations
      };
    } catch (error) {
      logger.error('Error adapting feedback to situation:', error);
      throw new Error('Failed to adapt feedback to situation');
    }
  }

  /**
   * Generate context-sensitive recommendations
   */
  async generateContextSensitiveRecommendations(
    performanceGaps: any[],
    contextualFactors: ContextualFactors,
    scenarioContext: ScenarioContext
  ): Promise<any[]> {
    try {
      const recommendations = [];

      for (const gap of performanceGaps) {
        const contextualRecommendation = await this.createContextualRecommendation(
          gap,
          contextualFactors,
          scenarioContext
        );
        recommendations.push(contextualRecommendation);
      }

      return recommendations;
    } catch (error) {
      logger.error('Error generating context-sensitive recommendations:', error);
      throw new Error('Failed to generate context-sensitive recommendations');
    }
  }

  /**
   * Consider environmental factors in feedback
   */
  async considerEnvironmentalFactors(
    feedback: any,
    environmentalContext: any
  ): Promise<any> {
    try {
      const adjustedFeedback = { ...feedback };

      // Adjust for time constraints
      if (environmentalContext.timeConstraints > 80) {
        adjustedFeedback.timeAdjustment = {
          acknowledgment: 'Recognizing the significant time pressure in this scenario',
          guidance: 'Focus on the most critical steps first and communicate time constraints to stakeholders',
          skillsEmphasis: ['prioritization', 'efficient_communication', 'quick_decision_making']
        };
      }

      // Adjust for resource limitations
      if (environmentalContext.resourceLimitations > 75) {
        adjustedFeedback.resourceAdjustment = {
          acknowledgment: 'Working with limited resources requires creative problem-solving',
          guidance: 'Adapt solutions to available tools and clearly communicate any limitations',
          skillsEmphasis: ['resourcefulness', 'adaptability', 'clear_expectation_setting']
        };
      }

      // Adjust for technical complexity
      if (environmentalContext.technicalDifficulty > 85) {
        adjustedFeedback.complexityAdjustment = {
          acknowledgment: 'This scenario presented exceptional technical complexity',
          guidance: 'Break down complex problems into manageable components and verify each step',
          skillsEmphasis: ['systematic_analysis', 'verification_protocols', 'documentation']
        };
      }

      // Adjust for customer behavior
      if (environmentalContext.customerBehavior > 80) {
        adjustedFeedback.customerAdjustment = {
          acknowledgment: 'Challenging customer interactions require advanced interpersonal skills',
          guidance: 'Focus on empathy, active listening, and professional de-escalation techniques',
          skillsEmphasis: ['emotional_intelligence', 'conflict_resolution', 'professional_demeanor']
        };
      }

      return adjustedFeedback;
    } catch (error) {
      logger.error('Error considering environmental factors:', error);
      throw new Error('Failed to consider environmental factors');
    }
  }

  /**
   * Generate complexity-adjusted feedback
   */
  async generateComplexityAdjustedFeedback(
    performanceScore: number,
    scenarioComplexity: number,
    dimension: string
  ): Promise<any> {
    try {
      const complexityLevel = this.determineComplexityLevel(scenarioComplexity);
      const complexityFactor = this.scenarioComplexityFactors[complexityLevel];

      let adjustedFeedback = {
        originalScore: performanceScore,
        complexityAdjustedScore: this.calculateComplexityAdjustedScore(performanceScore, complexityLevel),
        complexityLevel,
        complexityDescription: complexityFactor.description,
        contextualRecognition: this.generateComplexityRecognition(performanceScore, complexityLevel),
        adaptedExpectations: this.generateAdaptedExpectations(performanceScore, complexityLevel, dimension),
        situationalGuidance: this.generateSituationalGuidance(complexityLevel, dimension)
      };

      return adjustedFeedback;
    } catch (error) {
      logger.error('Error generating complexity-adjusted feedback:', error);
      throw new Error('Failed to generate complexity-adjusted feedback');
    }
  }

  // Private helper methods

  private adaptFeedbackToContext(
    dimension: string,
    dimensionData: any,
    scenarioContext: ScenarioContext,
    contextualFactors: ContextualFactors
  ): ContextualFeedback {
    const score = typeof dimensionData === 'number' ? dimensionData : this.calculateDimensionScore(dimensionData);
    const originalFeedback = this.generateBaseFeedback(dimension, score);

    // Generate contextual adjustments
    const contextualAdjustment = this.generateContextualAdjustment(
      dimension,
      score,
      scenarioContext,
      contextualFactors
    );

    const situationalConsiderations = this.identifySituationalConsiderations(
      dimension,
      contextualFactors
    );

    const adaptedRecommendations = this.adaptRecommendationsToContext(
      dimension,
      score,
      contextualFactors
    );

    const contextualStrengths = this.identifyContextualStrengths(
      dimension,
      score,
      contextualFactors
    );

    const environmentalFactors = this.identifyRelevantEnvironmentalFactors(contextualFactors);

    return {
      originalFeedback,
      contextualAdjustment,
      situationalConsiderations,
      adaptedRecommendations,
      contextualStrengths,
      environmentalFactors
    };
  }

  private generateContextualAdjustment(
    dimension: string,
    score: number,
    scenarioContext: ScenarioContext,
    contextualFactors: ContextualFactors
  ): string {
    let adjustment = '';

    // Adjust for scenario complexity
    if (scenarioContext.complexity > 80) {
      adjustment += `Considering the high complexity of this ${scenarioContext.type} scenario, `;
      if (score >= 70) {
        adjustment += 'your performance demonstrates strong capability under challenging conditions. ';
      } else {
        adjustment += 'the challenging conditions help explain performance difficulties. ';
      }
    }

    // Adjust for customer behavior
    if (contextualFactors.customerBehavior > 75) {
      adjustment += 'Given the challenging customer interaction dynamics, ';
      if (dimension === 'communication' || dimension === 'customerService') {
        adjustment += score >= 70 ? 
          'your ability to maintain professionalism is commendable. ' :
          'focus on advanced customer management techniques. ';
      }
    }

    // Adjust for time constraints
    if (contextualFactors.timeConstraints > 80) {
      adjustment += 'Working under significant time pressure, ';
      adjustment += score >= 70 ?
        'your ability to maintain quality is impressive. ' :
        'prioritization and efficiency become critical skills. ';
    }

    // Adjust for resource limitations
    if (contextualFactors.resourceLimitations > 75) {
      adjustment += 'With limited resources available, ';
      if (dimension === 'technical' || dimension === 'problemSolving') {
        adjustment += score >= 70 ?
          'your resourcefulness and adaptability shine through. ' :
          'creative problem-solving becomes essential. ';
      }
    }

    return adjustment || 'Standard scenario conditions allowed for typical performance assessment. ';
  }

  private identifySituationalConsiderations(
    dimension: string,
    contextualFactors: ContextualFactors
  ): string[] {
    const considerations: string[] = [];

    if (contextualFactors.scenarioComplexity > 80) {
      considerations.push('High scenario complexity required advanced problem-solving approaches');
    }

    if (contextualFactors.customerBehavior > 75) {
      considerations.push('Challenging customer behavior demanded strong interpersonal skills');
    }

    if (contextualFactors.timeConstraints > 80) {
      considerations.push('Significant time pressure required efficient prioritization');
    }

    if (contextualFactors.resourceLimitations > 75) {
      considerations.push('Limited resources necessitated creative and adaptive solutions');
    }

    if (contextualFactors.technicalDifficulty > 85) {
      considerations.push('High technical complexity demanded advanced technical expertise');
    }

    if (contextualFactors.environmentalChallenges > 70) {
      considerations.push('Environmental challenges required resilience and adaptability');
    }

    return considerations;
  }

  private adaptRecommendationsToContext(
    dimension: string,
    score: number,
    contextualFactors: ContextualFactors
  ): string[] {
    const recommendations: string[] = [];

    // Base recommendations
    if (score < 70) {
      recommendations.push(`Focus on building fundamental ${dimension} competencies`);
    } else if (score < 85) {
      recommendations.push(`Continue developing advanced ${dimension} techniques`);
    }

    // Context-specific recommendations
    if (contextualFactors.timeConstraints > 80) {
      recommendations.push('Develop time management and prioritization skills for high-pressure situations');
    }

    if (contextualFactors.customerBehavior > 75) {
      recommendations.push('Practice advanced customer management and de-escalation techniques');
    }

    if (contextualFactors.resourceLimitations > 75) {
      recommendations.push('Build resourcefulness and creative problem-solving capabilities');
    }

    if (contextualFactors.technicalDifficulty > 85) {
      recommendations.push('Strengthen technical expertise through advanced training and practice');
    }

    if (contextualFactors.scenarioComplexity > 80) {
      recommendations.push('Develop systematic approaches for handling complex scenarios');
    }

    return recommendations;
  }

  private identifyContextualStrengths(
    dimension: string,
    score: number,
    contextualFactors: ContextualFactors
  ): string[] {
    const strengths: string[] = [];

    if (score >= 75) {
      // General strengths
      strengths.push(`Strong ${dimension} performance maintained despite challenging conditions`);

      // Context-specific strengths
      if (contextualFactors.timeConstraints > 80 && score >= 75) {
        strengths.push('Excellent performance under time pressure');
      }

      if (contextualFactors.customerBehavior > 75 && score >= 75) {
        strengths.push('Professional composure with challenging customers');
      }

      if (contextualFactors.resourceLimitations > 75 && score >= 75) {
        strengths.push('Resourcefulness and adaptability with limited tools');
      }

      if (contextualFactors.technicalDifficulty > 85 && score >= 75) {
        strengths.push('Technical competency in complex scenarios');
      }
    }

    return strengths;
  }

  private identifyRelevantEnvironmentalFactors(contextualFactors: ContextualFactors): string[] {
    const factors: string[] = [];

    Object.entries(contextualFactors).forEach(([factor, value]) => {
      if (value > 70) {
        const factorDescriptions = {
          scenarioComplexity: 'High scenario complexity',
          customerBehavior: 'Challenging customer interactions',
          timeConstraints: 'Significant time pressure',
          resourceLimitations: 'Limited available resources',
          technicalDifficulty: 'High technical complexity',
          environmentalChallenges: 'Adverse environmental conditions'
        };

        factors.push(factorDescriptions[factor as keyof typeof factorDescriptions] || factor);
      }
    });

    return factors;
  }

  private generateContextualModifier(situationalFactors: any, context: ScenarioContext): string {
    let modifier = '';

    if (context.complexity > 80) {
      modifier += 'Given the exceptional complexity of this scenario, ';
    } else if (context.complexity > 60) {
      modifier += 'Considering the moderate complexity involved, ';
    }

    if (situationalFactors.timeConstraints > 80) {
      modifier += 'working under significant time constraints, ';
    }

    if (situationalFactors.customerBehavior > 75) {
      modifier += 'managing challenging customer dynamics, ';
    }

    return modifier || 'Under standard conditions, ';
  }

  private assessSituationalRelevance(baseFeedback: string, situationalFactors: any): string {
    const relevanceFactors = [];

    if (situationalFactors.scenarioComplexity > 80) {
      relevanceFactors.push('high complexity scenario');
    }

    if (situationalFactors.timeConstraints > 80) {
      relevanceFactors.push('time-critical environment');
    }

    if (situationalFactors.customerBehavior > 75) {
      relevanceFactors.push('challenging customer interaction');
    }

    if (relevanceFactors.length > 0) {
      return `This feedback is particularly relevant given the ${relevanceFactors.join(', ')} context`;
    }

    return 'This feedback applies under standard operational conditions';
  }

  private adaptGuidanceToSituation(baseFeedback: string, situationalFactors: any): string {
    let adaptedGuidance = baseFeedback;

    // Add situational context
    if (situationalFactors.timeConstraints > 80) {
      adaptedGuidance += ' In time-critical situations, prioritize essential steps and communicate constraints clearly.';
    }

    if (situationalFactors.resourceLimitations > 75) {
      adaptedGuidance += ' When resources are limited, focus on creative alternatives and set appropriate expectations.';
    }

    if (situationalFactors.customerBehavior > 75) {
      adaptedGuidance += ' With challenging customers, emphasize empathy, patience, and professional de-escalation.';
    }

    return adaptedGuidance;
  }

  private generateComplexityAcknowledgment(context: ScenarioContext): string {
    const complexityLevel = context.type;
    const acknowledgments = {
      basic: 'This scenario provided a good foundation for developing core competencies',
      intermediate: 'This scenario challenged your problem-solving and analytical thinking skills',
      advanced: 'This complex scenario required advanced professional skills and judgment',
      expert: 'This expert-level scenario demanded exceptional expertise and innovative thinking'
    };

    return acknowledgments[complexityLevel] || 'This scenario provided valuable learning opportunities';
  }

  private identifyEnvironmentalConsiderations(situationalFactors: any): string[] {
    const considerations: string[] = [];

    Object.entries(situationalFactors).forEach(([factor, value]: [string, any]) => {
      if (typeof value === 'number' && value > 70) {
        const considerationMap = {
          timeConstraints: 'Time pressure required rapid decision-making and prioritization',
          resourceLimitations: 'Limited resources demanded creative problem-solving approaches',
          customerBehavior: 'Customer dynamics influenced communication strategy and approach',
          technicalDifficulty: 'Technical complexity required advanced expertise and systematic analysis',
          scenarioComplexity: 'Overall complexity demanded comprehensive professional skills',
          environmentalChallenges: 'Environmental factors created additional challenges requiring adaptability'
        };

        const consideration = considerationMap[factor as keyof typeof considerationMap];
        if (consideration) {
          considerations.push(consideration);
        }
      }
    });

    return considerations;
  }

  private async createContextualRecommendation(
    gap: any,
    contextualFactors: ContextualFactors,
    scenarioContext: ScenarioContext
  ): Promise<any> {
    const baseRecommendation = {
      area: gap.area,
      priority: gap.severity === 'high' ? 'high' : 'medium',
      title: `Develop ${gap.area} skills for complex scenarios`,
      description: `Build ${gap.area} competency with focus on contextual adaptation`
    };

    // Add contextual adaptations
    const contextualAdaptations = [];

    if (contextualFactors.scenarioComplexity > 80) {
      contextualAdaptations.push('Practice with increasingly complex scenarios');
    }

    if (contextualFactors.timeConstraints > 80) {
      contextualAdaptations.push('Develop time management and prioritization skills');
    }

    if (contextualFactors.customerBehavior > 75) {
      contextualAdaptations.push('Build advanced customer management capabilities');
    }

    if (contextualFactors.resourceLimitations > 75) {
      contextualAdaptations.push('Enhance resourcefulness and creative problem-solving');
    }

    return {
      ...baseRecommendation,
      contextualAdaptations,
      scenarioSpecific: true,
      complexityLevel: scenarioContext.type,
      practiceRecommendations: this.generatePracticeRecommendations(gap.area, contextualFactors)
    };
  }

  private generatePracticeRecommendations(area: string, contextualFactors: ContextualFactors): string[] {
    const recommendations = [];

    if (contextualFactors.timeConstraints > 80) {
      recommendations.push(`Practice ${area} skills under time pressure`);
    }

    if (contextualFactors.customerBehavior > 75) {
      recommendations.push(`Develop ${area} capabilities for challenging customer scenarios`);
    }

    if (contextualFactors.resourceLimitations > 75) {
      recommendations.push(`Build ${area} competency with limited resources`);
    }

    if (contextualFactors.technicalDifficulty > 85) {
      recommendations.push(`Strengthen ${area} skills for complex technical situations`);
    }

    return recommendations;
  }

  private calculateDimensionScore(dimensionData: any): number {
    if (typeof dimensionData === 'number') {
      return dimensionData;
    }

    if (typeof dimensionData === 'object' && dimensionData !== null) {
      const scores = Object.values(dimensionData).filter(val => typeof val === 'number') as number[];
      return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    }

    return 0;
  }

  private generateBaseFeedback(dimension: string, score: number): string {
    if (score >= 85) {
      return `Excellent ${dimension} performance demonstrating strong professional competency`;
    } else if (score >= 75) {
      return `Good ${dimension} performance meeting professional standards`;
    } else if (score >= 65) {
      return `Developing ${dimension} competency with improvement potential`;
    } else {
      return `${dimension} skills require focused development`;
    }
  }

  private determineComplexityLevel(complexity: number): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    if (complexity >= 90) return 'expert';
    if (complexity >= 75) return 'advanced';
    if (complexity >= 60) return 'intermediate';
    return 'basic';
  }

  private calculateComplexityAdjustedScore(originalScore: number, complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert'): number {
    const multiplier = this.scenarioComplexityFactors[complexityLevel].multiplier;
    return Math.min(100, originalScore * multiplier);
  }

  private generateComplexityRecognition(score: number, complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert'): string {
    const complexityFactor = this.scenarioComplexityFactors[complexityLevel];
    
    if (score >= 75) {
      return `Strong performance in this ${complexityLevel} scenario demonstrates advanced capability`;
    } else {
      return `Performance in this ${complexityLevel} scenario (${complexityFactor.description}) shows development potential`;
    }
  }

  private generateAdaptedExpectations(score: number, complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert', dimension: string): string {
    if (complexityLevel === 'expert' || complexityLevel === 'advanced') {
      return `In ${complexityLevel} scenarios, ${dimension} performance expectations are adjusted to recognize the exceptional challenge level`;
    } else {
      return `Standard performance expectations apply for this ${complexityLevel} scenario complexity`;
    }
  }

  private generateSituationalGuidance(complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert', dimension: string): string[] {
    const guidanceMap = {
      basic: [
        'Focus on mastering fundamental techniques',
        'Build consistency in standard procedures',
        'Develop confidence through practice'
      ],
      intermediate: [
        'Apply analytical thinking to problem-solving',
        'Practice adapting procedures to different situations',
        'Build decision-making skills'
      ],
      advanced: [
        'Develop expertise in handling complex challenges',
        'Practice stakeholder management skills',
        'Build creative problem-solving capabilities'
      ],
      expert: [
        'Apply strategic thinking to complex problems',
        'Develop innovation and leadership skills',
        'Master crisis management techniques'
      ]
    };

    return guidanceMap[complexityLevel] || ['Continue developing professional skills'];
  }
}

export const contextualGuidanceEngine = new ContextualGuidanceEngine();