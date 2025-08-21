import { logger } from '../utils/logger';
import { performanceScorer } from './performanceScorer';
import { scorePresentation } from './scorePresentation';
import { industryBenchmark } from './industryBenchmark';

interface FeedbackDetail {
  observation: string;
  assessment: string;
  recommendation: string;
  resources: string[];
  impact: string;
}

interface FeedbackResponse {
  overall: {
    summary: string;
    keyStrengths: string[];
    improvementAreas: string[];
    nextSteps: string[];
  };
  technical: {
    accuracy: FeedbackDetail;
    efficiency: FeedbackDetail;
    knowledge: FeedbackDetail;
    innovation: FeedbackDetail;
  };
  communication: {
    clarity: FeedbackDetail;
    empathy: FeedbackDetail;
    responsiveness: FeedbackDetail;
    documentation: FeedbackDetail;
  };
  professional: {
    compliance: FeedbackDetail;
    customerService: FeedbackDetail;
    problemSolving: FeedbackDetail;
    continuousLearning: FeedbackDetail;
  };
}

interface ActionFeedback {
  actionId: string;
  actionType: string;
  timestamp: Date;
  feedback: {
    whatYouDid: string;
    whyItMattered: string;
    howItPerformed: string;
    whatCouldImprove: string;
    learningConnection: string;
  };
  score: number;
  category: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionSteps: string[];
  resources: Resource[];
  timeline: string;
  impact: string;
  successMeasures: string[];
}

interface Resource {
  type: 'training' | 'documentation' | 'practice' | 'certification' | 'tool';
  title: string;
  url?: string;
  description: string;
  timeRequired: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

class FeedbackGenerator {
  private actionFeedbackTemplates = {
    initial_assessment: {
      excellent: "Your systematic approach to initial assessment demonstrates strong analytical thinking",
      good: "Your initial assessment covered key areas with good thoroughness",
      needs_improvement: "Consider developing a more structured approach to initial problem assessment"
    },
    research: {
      excellent: "Outstanding research methodology - you utilized diverse sources and verified information effectively",
      good: "Good research approach with appropriate use of knowledge base resources",
      needs_improvement: "Expand your research scope and verify information from multiple sources"
    },
    diagnosis: {
      excellent: "Exceptional diagnostic skills - you identified the root cause through logical analysis",
      good: "Solid diagnostic approach with clear reasoning behind your conclusions",
      needs_improvement: "Focus on systematic diagnostic methodologies to improve accuracy"
    },
    solution: {
      excellent: "Your solution demonstrates innovation while maintaining technical accuracy and feasibility",
      good: "Effective solution that addresses the core problem with practical implementation",
      needs_improvement: "Consider alternative approaches and verify solution effectiveness before implementation"
    },
    customer_communication: {
      excellent: "Exceptional communication - clear, empathetic, and professionally delivered",
      good: "Professional communication with appropriate tone and clarity",
      needs_improvement: "Focus on improving clarity and demonstrating more empathy in customer interactions"
    },
    verification: {
      excellent: "Thorough verification process ensuring solution effectiveness and customer satisfaction",
      good: "Good verification approach confirming solution success",
      needs_improvement: "Implement more comprehensive verification procedures to ensure complete resolution"
    }
  };

  /**
   * Generate comprehensive feedback for a session
   */
  async generateComprehensiveFeedback(sessionData: any, performanceData: any, context: any): Promise<FeedbackResponse> {
    try {
      logger.info('Generating comprehensive feedback for session');

      // Generate action-specific feedback
      const actionFeedbacks = await this.generateActionFeedbacks(sessionData.actions || []);

      // Generate overall feedback components
      const overallFeedback = await this.generateOverallFeedback(performanceData, actionFeedbacks);
      const technicalFeedback = await this.generateTechnicalFeedback(performanceData, actionFeedbacks);
      const communicationFeedback = await this.generateCommunicationFeedback(performanceData, actionFeedbacks);
      const professionalFeedback = await this.generateProfessionalFeedback(performanceData, actionFeedbacks);

      const comprehensiveFeedback: FeedbackResponse = {
        overall: overallFeedback,
        technical: technicalFeedback,
        communication: communicationFeedback,
        professional: professionalFeedback
      };

      logger.info('Comprehensive feedback generated successfully');
      return comprehensiveFeedback;
    } catch (error) {
      logger.error('Error generating comprehensive feedback:', error);
      throw new Error('Failed to generate comprehensive feedback');
    }
  }

  /**
   * Generate specific action feedback
   */
  async generateActionFeedbacks(actions: any[]): Promise<ActionFeedback[]> {
    try {
      const feedbacks: ActionFeedback[] = [];

      for (const action of actions) {
        const actionFeedback = await this.generateSpecificActionFeedback(action);
        feedbacks.push(actionFeedback);
      }

      return feedbacks;
    } catch (error) {
      logger.error('Error generating action feedbacks:', error);
      throw new Error('Failed to generate action feedbacks');
    }
  }

  /**
   * Generate actionable recommendations
   */
  async generateActionableRecommendations(performanceData: any, context: any): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];

      // Analyze performance gaps
      const performanceGaps = await this.identifyPerformanceGaps(performanceData);

      for (const gap of performanceGaps) {
        const recommendation = await this.createRecommendation(gap, context);
        recommendations.push(recommendation);
      }

      // Sort by priority
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      return recommendations;
    } catch (error) {
      logger.error('Error generating actionable recommendations:', error);
      throw new Error('Failed to generate actionable recommendations');
    }
  }

  /**
   * Generate decision-based feedback
   */
  async generateDecisionFeedback(decisions: any[]): Promise<any[]> {
    try {
      const decisionFeedbacks = [];

      for (const decision of decisions) {
        const feedback = {
          decisionId: decision.id,
          decisionPoint: decision.description,
          choiceMade: decision.choice,
          analysis: {
            rationale: this.analyzeDecisionRationale(decision),
            alternatives: this.identifyAlternatives(decision),
            outcome: this.assessDecisionOutcome(decision),
            learningPoints: this.extractLearningPoints(decision)
          },
          recommendations: this.generateDecisionRecommendations(decision)
        };

        decisionFeedbacks.push(feedback);
      }

      return decisionFeedbacks;
    } catch (error) {
      logger.error('Error generating decision feedback:', error);
      throw new Error('Failed to generate decision feedback');
    }
  }

  /**
   * Generate improvement suggestions
   */
  async generateImprovementSuggestions(performanceData: any, context: any): Promise<any> {
    try {
      const suggestions = {
        immediate: [] as string[],
        shortTerm: [] as string[],
        longTerm: [] as string[],
        resources: [] as Resource[]
      };

      // Immediate improvements (next session)
      if (performanceData.technical?.accuracy < 75) {
        suggestions.immediate.push('Practice systematic troubleshooting methodology before your next session');
        suggestions.immediate.push('Review common technical scenarios and their solutions');
      }

      if (performanceData.communication?.clarity < 70) {
        suggestions.immediate.push('Focus on explaining technical concepts in simple, customer-friendly language');
        suggestions.immediate.push('Practice active listening techniques during customer interactions');
      }

      // Short-term improvements (1-4 weeks)
      if (performanceData.overall < 75) {
        suggestions.shortTerm.push('Complete focused training modules in your lowest-scoring competency areas');
        suggestions.shortTerm.push('Practice with increasingly complex scenarios to build confidence');
      }

      // Long-term improvements (1-6 months)
      if (performanceData.overall < 85) {
        suggestions.longTerm.push('Consider pursuing relevant IT certifications to validate your skills');
        suggestions.longTerm.push('Build a portfolio of successfully resolved cases for career advancement');
      }

      // Learning resources
      suggestions.resources = await this.generateLearningResources(performanceData);

      return suggestions;
    } catch (error) {
      logger.error('Error generating improvement suggestions:', error);
      throw new Error('Failed to generate improvement suggestions');
    }
  }

  // Private helper methods

  private async generateSpecificActionFeedback(action: any): Promise<ActionFeedback> {
    const actionType = action.type;
    const quality = action.quality || 70;
    const category = this.categorizeAction(actionType);

    let performanceLevel = 'needs_improvement';
    if (quality >= 85) performanceLevel = 'excellent';
    else if (quality >= 70) performanceLevel = 'good';

    const template = this.actionFeedbackTemplates[actionType as keyof typeof this.actionFeedbackTemplates];
    const baseMessage = template ? template[performanceLevel as keyof typeof template] : 
      `Your ${actionType} action demonstrates ${performanceLevel.replace('_', ' ')} performance`;

    return {
      actionId: action.id,
      actionType,
      timestamp: action.timestamp || new Date(),
      feedback: {
        whatYouDid: this.generateWhatYouDidFeedback(action),
        whyItMattered: this.generateWhyItMatteredFeedback(action),
        howItPerformed: baseMessage,
        whatCouldImprove: this.generateImprovementFeedback(action, quality),
        learningConnection: this.generateLearningConnectionFeedback(action, category)
      },
      score: quality,
      category
    };
  }

  private generateWhatYouDidFeedback(action: any): string {
    const actionDescriptions = {
      initial_assessment: 'You began by systematically gathering information about the customer\'s issue',
      research: 'You researched the problem using available knowledge base resources',
      diagnosis: 'You analyzed the information to identify the root cause of the issue',
      solution: 'You developed and implemented a solution to address the problem',
      customer_communication: 'You communicated with the customer to explain your approach and findings',
      verification: 'You verified that your solution resolved the issue and confirmed customer satisfaction'
    };

    return actionDescriptions[action.type as keyof typeof actionDescriptions] || 
      `You performed a ${action.type} action during the resolution process`;
  }

  private generateWhyItMatteredFeedback(action: any): string {
    const impactDescriptions = {
      initial_assessment: 'This thorough initial assessment sets the foundation for effective problem resolution',
      research: 'This research ensures you have the necessary information to make informed decisions',
      diagnosis: 'Accurate diagnosis is critical for implementing the most effective solution',
      solution: 'A well-implemented solution directly impacts customer satisfaction and issue resolution',
      customer_communication: 'Clear communication builds trust and keeps customers informed throughout the process',
      verification: 'Verification ensures complete resolution and prevents issue recurrence'
    };

    return impactDescriptions[action.type as keyof typeof impactDescriptions] || 
      'This action contributes to overall problem resolution effectiveness';
  }

  private generateImprovementFeedback(action: any, quality: number): string {
    if (quality >= 85) {
      return 'Continue maintaining this high standard of performance';
    } else if (quality >= 70) {
      return 'Consider refining your approach to achieve even better results';
    } else {
      const improvementSuggestions = {
        initial_assessment: 'Develop a more systematic checklist for initial problem assessment',
        research: 'Expand your search scope and cross-reference multiple knowledge sources',
        diagnosis: 'Use structured diagnostic frameworks to improve accuracy',
        solution: 'Consider multiple solution options and evaluate their trade-offs',
        customer_communication: 'Focus on clarity, empathy, and timely responses',
        verification: 'Implement more thorough testing and customer confirmation processes'
      };

      return improvementSuggestions[action.type as keyof typeof improvementSuggestions] || 
        'Focus on developing stronger skills in this area through practice and training';
    }
  }

  private generateLearningConnectionFeedback(action: any, category: string): string {
    const learningConnections = {
      technical: 'This action develops your technical problem-solving competency, essential for IT support excellence',
      communication: 'This interaction strengthens your professional communication skills, critical for customer satisfaction',
      procedural: 'Following proper procedures builds professional habits and ensures consistent service quality',
      customerService: 'Customer-focused actions like this develop relationship management skills valued by employers',
      problemSolving: 'This problem-solving approach builds analytical thinking skills applicable across IT scenarios'
    };

    return learningConnections[category as keyof typeof learningConnections] || 
      'This action contributes to your overall professional competency development';
  }

  private categorizeAction(actionType: string): string {
    const categoryMap = {
      initial_assessment: 'problemSolving',
      research: 'technical',
      diagnosis: 'technical',
      solution: 'technical',
      customer_communication: 'communication',
      verification: 'procedural',
      documentation: 'procedural',
      escalation: 'procedural'
    };

    return categoryMap[actionType as keyof typeof categoryMap] || 'technical';
  }

  private async generateOverallFeedback(performanceData: any, actionFeedbacks: ActionFeedback[]): Promise<FeedbackResponse['overall']> {
    const overallScore = performanceData.overall || 0;
    
    // Identify key strengths
    const strengths: string[] = [];
    const dimensions = performanceData.dimensions || {};
    
    Object.entries(dimensions).forEach(([dimension, score]: [string, any]) => {
      const dimensionScore = score.weighted || score || 0;
      if (dimensionScore >= 80) {
        strengths.push(`Strong ${dimension} competency (${Math.round(dimensionScore)}/100)`);
      }
    });

    // Identify improvement areas
    const improvements: string[] = [];
    Object.entries(dimensions).forEach(([dimension, score]: [string, any]) => {
      const dimensionScore = score.weighted || score || 0;
      if (dimensionScore < 70) {
        improvements.push(`${dimension} development needed (${Math.round(dimensionScore)}/100)`);
      }
    });

    // Generate next steps
    const nextSteps = this.generateNextSteps(performanceData, actionFeedbacks);

    return {
      summary: this.generateOverallSummary(overallScore, strengths, improvements),
      keyStrengths: strengths,
      improvementAreas: improvements,
      nextSteps
    };
  }

  private generateOverallSummary(score: number, strengths: string[], improvements: string[]): string {
    let summary = '';

    if (score >= 85) {
      summary = 'Exceptional performance demonstrating strong professional competency across multiple dimensions. ';
    } else if (score >= 75) {
      summary = 'Solid professional performance with good competency demonstration. ';
    } else if (score >= 65) {
      summary = 'Developing professional competency with clear improvement pathways. ';
    } else {
      summary = 'Performance requires focused development to meet professional standards. ';
    }

    if (strengths.length > 0) {
      summary += `Your key strengths include ${strengths.slice(0, 2).join(' and ')}. `;
    }

    if (improvements.length > 0) {
      summary += `Focus areas for development include ${improvements.slice(0, 2).join(' and ')}.`;
    }

    return summary;
  }

  private generateNextSteps(performanceData: any, actionFeedbacks: ActionFeedback[]): string[] {
    const steps: string[] = [];
    const overallScore = performanceData.overall || 0;

    if (overallScore < 70) {
      steps.push('Focus on fundamental skill development through targeted practice');
      steps.push('Complete additional training modules in core competency areas');
    } else if (overallScore < 80) {
      steps.push('Practice with more complex scenarios to refine your skills');
      steps.push('Focus on improving performance in 2-3 specific competency areas');
    } else {
      steps.push('Continue maintaining high performance standards');
      steps.push('Consider pursuing advanced certifications or specializations');
    }

    // Add specific recommendations based on action feedback
    const lowPerformingActions = actionFeedbacks.filter(af => af.score < 70);
    if (lowPerformingActions.length > 0) {
      const commonCategory = this.findMostCommonCategory(lowPerformingActions);
      steps.push(`Focus specifically on improving ${commonCategory} skills through targeted practice`);
    }

    return steps;
  }

  private async generateTechnicalFeedback(performanceData: any, actionFeedbacks: ActionFeedback[]): Promise<FeedbackResponse['technical']> {
    const technical = performanceData.dimensions?.technical || {};
    
    return {
      accuracy: this.generateFeedbackDetail(
        technical.accuracy || 0,
        'technical solution accuracy',
        'Technical Problem Solving',
        ['CompTIA A+ Study Guide', 'IT Troubleshooting Methodologies', 'Knowledge Base Review']
      ),
      efficiency: this.generateFeedbackDetail(
        technical.efficiency || 0,
        'problem resolution efficiency',
        'Time Management',
        ['Time Management Techniques', 'Efficiency Optimization Training', 'Process Improvement Methods']
      ),
      knowledge: this.generateFeedbackDetail(
        technical.knowledge || 0,
        'knowledge base utilization',
        'Technical Knowledge',
        ['Technical Documentation Review', 'Continuous Learning Programs', 'Vendor Certification Training']
      ),
      innovation: this.generateFeedbackDetail(
        technical.innovation || 0,
        'creative problem-solving',
        'Innovation',
        ['Creative Thinking Workshops', 'Problem-Solving Frameworks', 'Innovation in IT Support']
      )
    };
  }

  private async generateCommunicationFeedback(performanceData: any, actionFeedbacks: ActionFeedback[]): Promise<FeedbackResponse['communication']> {
    const communication = performanceData.dimensions?.communication || {};
    
    return {
      clarity: this.generateFeedbackDetail(
        communication.clarity || 0,
        'communication clarity',
        'Professional Communication',
        ['Business Communication Skills', 'Technical Writing', 'Customer Communication Training']
      ),
      empathy: this.generateFeedbackDetail(
        communication.empathy || 0,
        'customer empathy',
        'Emotional Intelligence',
        ['Emotional Intelligence Training', 'Customer Service Excellence', 'Active Listening Skills']
      ),
      responsiveness: this.generateFeedbackDetail(
        communication.responsiveness || 0,
        'response timeliness',
        'Customer Engagement',
        ['Response Time Management', 'Customer Engagement Strategies', 'Priority Management']
      ),
      documentation: this.generateFeedbackDetail(
        communication.documentation || 0,
        'documentation quality',
        'Professional Documentation',
        ['Technical Documentation Standards', 'Record Keeping Best Practices', 'Communication Documentation']
      )
    };
  }

  private async generateProfessionalFeedback(performanceData: any, actionFeedbacks: ActionFeedback[]): Promise<FeedbackResponse['professional']> {
    const procedural = performanceData.dimensions?.procedural || {};
    const customerService = performanceData.dimensions?.customerService || {};
    const problemSolving = performanceData.dimensions?.problemSolving || {};
    
    return {
      compliance: this.generateFeedbackDetail(
        procedural.compliance || 0,
        'procedural compliance',
        'Professional Standards',
        ['ITIL Framework Training', 'Compliance Best Practices', 'Quality Management Systems']
      ),
      customerService: this.generateFeedbackDetail(
        customerService.satisfaction || 0,
        'customer service quality',
        'Customer Satisfaction',
        ['Customer Service Excellence', 'Relationship Management', 'Service Recovery Techniques']
      ),
      problemSolving: this.generateFeedbackDetail(
        problemSolving.approach || 0,
        'problem-solving methodology',
        'Analytical Thinking',
        ['Problem-Solving Frameworks', 'Root Cause Analysis', 'Systems Thinking']
      ),
      continuousLearning: this.generateFeedbackDetail(
        Math.max(procedural.compliance || 0, customerService.satisfaction || 0, problemSolving.approach || 0),
        'continuous improvement mindset',
        'Professional Development',
        ['Professional Development Planning', 'Continuous Learning Strategies', 'Career Advancement Planning']
      )
    };
  }

  private generateFeedbackDetail(score: number, competencyArea: string, category: string, resources: string[]): FeedbackDetail {
    let observation: string;
    let assessment: string;
    let recommendation: string;
    let impact: string;

    if (score >= 85) {
      observation = `Excellent performance observed in ${competencyArea}`;
      assessment = 'Performance exceeds professional standards and demonstrates mastery-level competency';
      recommendation = 'Continue maintaining this high standard while exploring advanced applications';
      impact = 'Your strong performance in this area significantly enhances overall professional effectiveness';
    } else if (score >= 75) {
      observation = `Good performance demonstrated in ${competencyArea}`;
      assessment = 'Performance meets professional standards with room for optimization';
      recommendation = 'Focus on refining techniques and achieving consistent excellence';
      impact = 'Continued improvement in this area will strengthen your professional competency profile';
    } else if (score >= 65) {
      observation = `Developing competency shown in ${competencyArea}`;
      assessment = 'Performance approaches professional standards but requires further development';
      recommendation = 'Implement focused practice and training to reach professional competency levels';
      impact = 'Improvement in this area is important for achieving overall professional readiness';
    } else {
      observation = `Limited proficiency currently demonstrated in ${competencyArea}`;
      assessment = 'Performance below professional standards requiring focused development';
      recommendation = 'Prioritize intensive training and practice in this critical competency area';
      impact = 'Significant improvement needed in this area to meet professional employment standards';
    }

    return {
      observation,
      assessment,
      recommendation,
      resources: resources.map(title => ({ 
        type: 'training' as const, 
        title, 
        description: `Training resource for ${competencyArea} development`,
        timeRequired: '2-4 hours',
        difficulty: 'intermediate' as const
      })),
      impact
    };
  }

  private async identifyPerformanceGaps(performanceData: any): Promise<any[]> {
    const gaps = [];
    const dimensions = performanceData.dimensions || {};

    Object.entries(dimensions).forEach(([dimension, score]: [string, any]) => {
      const dimensionScore = score.weighted || score || 0;
      if (dimensionScore < 75) {
        gaps.push({
          area: dimension,
          currentScore: dimensionScore,
          targetScore: 85,
          severity: dimensionScore < 60 ? 'high' : 'medium',
          category: this.mapDimensionToCategory(dimension)
        });
      }
    });

    return gaps;
  }

  private async createRecommendation(gap: any, context: any): Promise<Recommendation> {
    const recommendationTemplates = {
      technical: {
        title: 'Enhance Technical Problem-Solving Skills',
        description: 'Develop systematic approaches to technical troubleshooting and solution implementation',
        actionSteps: [
          'Practice structured troubleshooting methodologies',
          'Complete technical knowledge assessments',
          'Work through complex technical scenarios',
          'Seek feedback from technical mentors'
        ],
        timeline: '2-4 weeks',
        impact: 'Improved technical accuracy and efficiency in problem resolution'
      },
      communication: {
        title: 'Strengthen Professional Communication',
        description: 'Improve clarity, empathy, and effectiveness in customer interactions',
        actionSteps: [
          'Practice explaining technical concepts in simple terms',
          'Develop active listening skills',
          'Improve response timing and follow-up',
          'Enhance written communication quality'
        ],
        timeline: '3-6 weeks',
        impact: 'Higher customer satisfaction and professional credibility'
      },
      procedural: {
        title: 'Master Professional Procedures',
        description: 'Ensure consistent adherence to professional standards and protocols',
        actionSteps: [
          'Review and memorize standard operating procedures',
          'Practice compliance in simulated scenarios',
          'Develop habit-forming checklists',
          'Seek process improvement feedback'
        ],
        timeline: '2-3 weeks',
        impact: 'Consistent professional performance and reduced errors'
      }
    };

    const template = recommendationTemplates[gap.category as keyof typeof recommendationTemplates] || recommendationTemplates.technical;

    return {
      priority: gap.severity === 'high' ? 'high' : 'medium',
      category: gap.area,
      title: template.title,
      description: template.description,
      actionSteps: template.actionSteps,
      resources: await this.getRecommendationResources(gap.area),
      timeline: template.timeline,
      impact: template.impact,
      successMeasures: [
        `Achieve ${gap.targetScore}+ score in ${gap.area}`,
        'Demonstrate consistent performance improvement',
        'Receive positive feedback from customers and supervisors'
      ]
    };
  }

  private async getRecommendationResources(area: string): Promise<Resource[]> {
    const resourceMap = {
      technical: [
        {
          type: 'training' as const,
          title: 'CompTIA A+ Certification Training',
          url: 'https://comptia.org/certifications/a',
          description: 'Comprehensive technical skills certification program',
          timeRequired: '40-60 hours',
          difficulty: 'intermediate' as const
        },
        {
          type: 'practice' as const,
          title: 'Technical Troubleshooting Scenarios',
          description: 'Hands-on practice with real-world technical problems',
          timeRequired: '10-15 hours/week',
          difficulty: 'intermediate' as const
        }
      ],
      communication: [
        {
          type: 'training' as const,
          title: 'Professional Communication Skills',
          description: 'Customer service and business communication training',
          timeRequired: '20-30 hours',
          difficulty: 'beginner' as const
        },
        {
          type: 'practice' as const,
          title: 'Customer Interaction Simulations',
          description: 'Role-playing exercises for communication improvement',
          timeRequired: '5-10 hours/week',
          difficulty: 'intermediate' as const
        }
      ],
      procedural: [
        {
          type: 'certification' as const,
          title: 'ITIL Foundation Certification',
          url: 'https://itil.org/certifications',
          description: 'Industry standard IT service management framework',
          timeRequired: '30-40 hours',
          difficulty: 'intermediate' as const
        }
      ]
    };

    return resourceMap[area as keyof typeof resourceMap] || resourceMap.technical;
  }

  private mapDimensionToCategory(dimension: string): string {
    const categoryMap = {
      technical: 'technical',
      communication: 'communication',
      procedural: 'procedural',
      customerService: 'communication',
      problemSolving: 'technical'
    };

    return categoryMap[dimension as keyof typeof categoryMap] || 'technical';
  }

  private findMostCommonCategory(actionFeedbacks: ActionFeedback[]): string {
    const categoryCounts = actionFeedbacks.reduce((counts, af) => {
      counts[af.category] = (counts[af.category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'technical';
  }

  private analyzeDecisionRationale(decision: any): string {
    return `Your decision to ${decision.choice} was based on ${decision.reasoning || 'the available information and best practices'}. This demonstrates ${decision.quality >= 80 ? 'strong' : 'developing'} decision-making capability.`;
  }

  private identifyAlternatives(decision: any): string[] {
    return decision.alternatives || [
      'Consider alternative approaches that might have different trade-offs',
      'Evaluate options with different risk profiles',
      'Explore solutions that balance efficiency with thoroughness'
    ];
  }

  private assessDecisionOutcome(decision: any): string {
    const outcome = decision.outcome || 'pending';
    if (outcome === 'successful') {
      return 'Your decision led to successful problem resolution and customer satisfaction';
    } else if (outcome === 'partially_successful') {
      return 'Your decision achieved partial success but could be optimized for better results';
    } else {
      return 'The outcome of this decision provides valuable learning opportunities for future scenarios';
    }
  }

  private extractLearningPoints(decision: any): string[] {
    return [
      'Decision-making under uncertainty requires balancing available information with time constraints',
      'Consider the broader impact of decisions on customer experience and business outcomes',
      'Develop systematic approaches to evaluate decision alternatives quickly and effectively'
    ];
  }

  private generateDecisionRecommendations(decision: any): string[] {
    const recommendations = [];
    
    if (decision.quality < 70) {
      recommendations.push('Practice decision-making frameworks to improve consistency');
      recommendations.push('Take more time to evaluate alternatives when possible');
    }
    
    if (decision.speed < 70) {
      recommendations.push('Develop rapid assessment techniques for time-critical decisions');
    }
    
    return recommendations;
  }

  private async generateLearningResources(performanceData: any): Promise<Resource[]> {
    const resources: Resource[] = [];
    const dimensions = performanceData.dimensions || {};

    Object.entries(dimensions).forEach(([dimension, score]: [string, any]) => {
      const dimensionScore = score.weighted || score || 0;
      if (dimensionScore < 80) {
        resources.push(...this.getDimensionResources(dimension));
      }
    });

    return resources.slice(0, 6); // Limit to top 6 resources
  }

  private getDimensionResources(dimension: string): Resource[] {
    const resourceMap = {
      technical: [
        {
          type: 'training' as const,
          title: 'Advanced Troubleshooting Techniques',
          description: 'Systematic approaches to complex technical problems',
          timeRequired: '15-20 hours',
          difficulty: 'intermediate' as const
        }
      ],
      communication: [
        {
          type: 'training' as const,
          title: 'Customer Communication Excellence',
          description: 'Professional communication skills for IT support',
          timeRequired: '10-15 hours',
          difficulty: 'beginner' as const
        }
      ],
      procedural: [
        {
          type: 'documentation' as const,
          title: 'IT Service Management Best Practices',
          description: 'Industry standard procedures and compliance requirements',
          timeRequired: '8-12 hours',
          difficulty: 'intermediate' as const
        }
      ]
    };

    return resourceMap[dimension as keyof typeof resourceMap] || [];
  }
}

export const feedbackGenerator = new FeedbackGenerator();