import { logger } from '../utils/logger';

interface ScoreBreakdown {
  overall: {
    score: number;
    rating: string;
    description: string;
    factors: string[];
  };
  dimensions: Array<{
    name: string;
    score: number;
    rating: string;
    components: Array<{
      name: string;
      score: number;
      weight: number;
      description: string;
    }>;
    strengths: string[];
    improvements: string[];
  }>;
  contextualFactors: {
    scenarioDifficulty: number;
    adjustmentApplied: number;
    explanation: string;
  };
}

interface ScoreExplanation {
  methodology: {
    overview: string;
    dimensionWeights: Record<string, number>;
    calculationSteps: string[];
  };
  dimensionExplanations: Record<string, {
    purpose: string;
    measurement: string;
    importance: string;
    improvementTips: string[];
  }>;
  industryContext: {
    benchmarkComparison: string;
    professionalRelevance: string;
    careerImplications: string;
  };
}

class ScorePresentation {
  /**
   * Generate comprehensive score breakdown
   */
  async generateBreakdown(score: any, context: any): Promise<ScoreBreakdown> {
    try {
      logger.debug('Generating score breakdown');

      const breakdown: ScoreBreakdown = {
        overall: this.generateOverallBreakdown(score),
        dimensions: this.generateDimensionBreakdowns(score.dimensions),
        contextualFactors: this.generateContextualFactors(context)
      };

      return breakdown;
    } catch (error) {
      logger.error('Error generating score breakdown:', error);
      throw new Error('Failed to generate score breakdown');
    }
  }

  /**
   * Generate detailed scoring explanations
   */
  async generateExplanations(score: any, context: any): Promise<ScoreExplanation> {
    try {
      logger.debug('Generating score explanations');

      const explanations: ScoreExplanation = {
        methodology: this.generateMethodologyExplanation(),
        dimensionExplanations: this.generateDimensionExplanations(),
        industryContext: this.generateIndustryContextExplanation(score)
      };

      return explanations;
    } catch (error) {
      logger.error('Error generating score explanations:', error);
      throw new Error('Failed to generate score explanations');
    }
  }

  /**
   * Format score for display
   */
  formatScoreDisplay(score: number, includeGrade: boolean = true): string {
    const grade = this.getScoreGrade(score);
    const display = `${score}/100`;
    
    return includeGrade ? `${display} (${grade})` : display;
  }

  /**
   * Get score color coding for UI
   */
  getScoreColorCoding(score: number): { color: string; background: string; textColor: string } {
    if (score >= 90) {
      return { color: 'success', background: '#d4edda', textColor: '#155724' };
    } else if (score >= 80) {
      return { color: 'good', background: '#d1ecf1', textColor: '#0c5460' };
    } else if (score >= 70) {
      return { color: 'acceptable', background: '#fff3cd', textColor: '#856404' };
    } else if (score >= 60) {
      return { color: 'concern', background: '#f8d7da', textColor: '#721c24' };
    } else {
      return { color: 'critical', background: '#f5c6cb', textColor: '#721c24' };
    }
  }

  /**
   * Generate score interpretation guidance
   */
  generateScoreInterpretation(score: number): { interpretation: string; nextSteps: string[] } {
    const grade = this.getScoreGrade(score);
    let interpretation: string;
    let nextSteps: string[];

    switch (grade) {
      case 'A':
        interpretation = 'Exceptional performance demonstrating mastery-level competency. You consistently exceed professional standards and show readiness for advanced roles.';
        nextSteps = [
          'Consider pursuing specialized certifications',
          'Explore leadership or mentoring opportunities',
          'Share your expertise through training or documentation'
        ];
        break;
      case 'B':
        interpretation = 'Strong performance meeting professional standards with room for optimization. You demonstrate solid competency with potential for excellence.';
        nextSteps = [
          'Focus on refining skills in lower-scoring dimensions',
          'Seek feedback from experienced professionals',
          'Consider advanced training in specialized areas'
        ];
        break;
      case 'C':
        interpretation = 'Acceptable performance meeting basic professional requirements. Continued development will strengthen your professional competency.';
        nextSteps = [
          'Identify 2-3 key areas for focused improvement',
          'Practice scenarios targeting weak dimensions',
          'Seek mentoring or additional training opportunities'
        ];
        break;
      case 'D':
        interpretation = 'Performance below professional standards requiring focused improvement. With dedicated effort, you can achieve competency levels.';
        nextSteps = [
          'Develop improvement plan for critical areas',
          'Increase practice frequency and intensity',
          'Consider additional training or certification programs'
        ];
        break;
      default:
        interpretation = 'Performance significantly below professional standards requiring comprehensive development. Focus on fundamental skill building.';
        nextSteps = [
          'Enroll in foundational training programs',
          'Practice basic scenarios repeatedly',
          'Work closely with mentors or instructors'
        ];
    }

    return { interpretation, nextSteps };
  }

  // Private helper methods

  private generateOverallBreakdown(score: any): ScoreBreakdown['overall'] {
    const overallScore = score.overall || 0;
    const rating = this.getScoreRating(overallScore);
    
    return {
      score: overallScore,
      rating,
      description: this.getOverallDescription(overallScore, rating),
      factors: this.getOverallFactors(score)
    };
  }

  private generateDimensionBreakdowns(dimensions: any): ScoreBreakdown['dimensions'] {
    const dimensionBreakdowns: ScoreBreakdown['dimensions'] = [];

    const dimensionNames = {
      technical: 'Technical Competency',
      communication: 'Communication Skills',
      procedural: 'Procedural Compliance',
      customerService: 'Customer Service',
      problemSolving: 'Problem Solving'
    };

    Object.entries(dimensions).forEach(([key, value]: [string, any]) => {
      const dimensionData = value as any;
      const score = dimensionData.weighted || dimensionData || 0;
      
      dimensionBreakdowns.push({
        name: dimensionNames[key as keyof typeof dimensionNames] || key,
        score: Math.round(score),
        rating: this.getScoreRating(score),
        components: this.generateComponentBreakdown(key, dimensionData),
        strengths: this.identifyDimensionStrengths(key, score),
        improvements: this.identifyDimensionImprovements(key, score)
      });
    });

    return dimensionBreakdowns;
  }

  private generateComponentBreakdown(dimension: string, dimensionData: any): Array<{ name: string; score: number; weight: number; description: string }> {
    const componentWeights = {
      technical: {
        accuracy: { weight: 0.40, description: 'Technical solution correctness and problem diagnosis accuracy' },
        efficiency: { weight: 0.25, description: 'Time management and resource utilization effectiveness' },
        knowledge: { weight: 0.25, description: 'Knowledge base utilization and information application' },
        innovation: { weight: 0.10, description: 'Creative problem-solving and process improvement' }
      },
      communication: {
        clarity: { weight: 0.30, description: 'Clear, understandable communication with customers' },
        empathy: { weight: 0.25, description: 'Customer empathy and emotional intelligence' },
        responsiveness: { weight: 0.25, description: 'Timely responses and proactive communication' },
        documentation: { weight: 0.20, description: 'Quality of written documentation and records' }
      },
      procedural: {
        compliance: { weight: 0.35, description: 'Adherence to established procedures and protocols' },
        security: { weight: 0.30, description: 'Security protocol compliance and privacy protection' },
        escalation: { weight: 0.20, description: 'Appropriate escalation timing and justification' },
        documentation: { weight: 0.15, description: 'Proper procedural documentation and record-keeping' }
      },
      customerService: {
        satisfaction: { weight: 0.35, description: 'Direct customer satisfaction and feedback ratings' },
        relationship: { weight: 0.25, description: 'Rapport building and customer relationship management' },
        professionalism: { weight: 0.25, description: 'Professional behavior and service delivery' },
        followUp: { weight: 0.15, description: 'Follow-up quality and closure processes' }
      },
      problemSolving: {
        approach: { weight: 0.35, description: 'Systematic and logical problem-solving methodology' },
        creativity: { weight: 0.25, description: 'Creative and innovative solution development' },
        thoroughness: { weight: 0.25, description: 'Comprehensive investigation and analysis' },
        adaptability: { weight: 0.15, description: 'Flexibility and adaptation to changing requirements' }
      }
    };

    const weights = componentWeights[dimension as keyof typeof componentWeights] || {};
    const components: Array<{ name: string; score: number; weight: number; description: string }> = [];

    Object.entries(weights).forEach(([component, config]) => {
      const score = dimensionData[component] || 0;
      components.push({
        name: component.charAt(0).toUpperCase() + component.slice(1),
        score: Math.round(score),
        weight: config.weight,
        description: config.description
      });
    });

    return components;
  }

  private generateContextualFactors(context: any): ScoreBreakdown['contextualFactors'] {
    const difficulty = context.contextFactors?.difficulty || 50;
    const adjustmentApplied = this.calculateDisplayAdjustment(context.contextFactors);
    
    return {
      scenarioDifficulty: difficulty,
      adjustmentApplied,
      explanation: this.generateAdjustmentExplanation(context.contextFactors, adjustmentApplied)
    };
  }

  private generateMethodologyExplanation(): ScoreExplanation['methodology'] {
    return {
      overview: 'Performance scoring uses a weighted multi-dimensional approach aligned with industry standards for IT support professionals. Each dimension is evaluated independently, then combined using professional competency weights to create an overall score.',
      dimensionWeights: {
        'Technical Competency': 25,
        'Communication Skills': 25,
        'Procedural Compliance': 20,
        'Customer Service': 20,
        'Problem Solving': 10
      },
      calculationSteps: [
        '1. Evaluate performance in each sub-component (0-100 scale)',
        '2. Calculate weighted dimension scores using sub-component weights',
        '3. Apply contextual adjustments based on scenario complexity',
        '4. Combine dimensions using professional competency weights',
        '5. Generate final score with industry benchmark comparison'
      ]
    };
  }

  private generateDimensionExplanations(): ScoreExplanation['dimensionExplanations'] {
    return {
      technical: {
        purpose: 'Measures technical problem-solving capability and accuracy',
        measurement: 'Based on solution correctness, efficiency, knowledge application, and innovation',
        importance: 'Core competency for IT support roles - directly impacts problem resolution quality',
        improvementTips: [
          'Practice systematic troubleshooting methodologies',
          'Expand technical knowledge through training and research',
          'Focus on solution accuracy and verification processes'
        ]
      },
      communication: {
        purpose: 'Evaluates professional communication effectiveness with customers',
        measurement: 'Based on clarity, empathy, responsiveness, and documentation quality',
        importance: 'Critical for customer satisfaction and professional credibility',
        improvementTips: [
          'Practice clear, jargon-free explanations',
          'Develop active listening and empathy skills',
          'Improve response timing and follow-up practices'
        ]
      },
      procedural: {
        purpose: 'Assesses adherence to professional procedures and compliance',
        measurement: 'Based on process compliance, security adherence, and documentation',
        importance: 'Essential for maintaining quality standards and regulatory compliance',
        improvementTips: [
          'Review and practice standard operating procedures',
          'Focus on security protocol compliance',
          'Improve documentation habits and record-keeping'
        ]
      },
      customerService: {
        purpose: 'Measures customer satisfaction and service quality delivery',
        measurement: 'Based on satisfaction ratings, relationship building, and professionalism',
        importance: 'Key driver of customer retention and business success',
        improvementTips: [
          'Focus on customer needs and expectations',
          'Build rapport and trust with customers',
          'Maintain consistent professional service delivery'
        ]
      },
      problemSolving: {
        purpose: 'Evaluates problem-solving methodology and adaptability',
        measurement: 'Based on systematic approach, creativity, thoroughness, and flexibility',
        importance: 'Fundamental skill for handling complex and varied IT issues',
        improvementTips: [
          'Use structured problem-solving frameworks',
          'Practice creative thinking and alternative solutions',
          'Develop adaptability to changing requirements'
        ]
      }
    };
  }

  private generateIndustryContextExplanation(score: any): ScoreExplanation['industryContext'] {
    const overallScore = score.overall || 0;
    
    return {
      benchmarkComparison: this.getBenchmarkComparisonText(overallScore),
      professionalRelevance: this.getProfessionalRelevanceText(overallScore),
      careerImplications: this.getCareerImplicationsText(overallScore)
    };
  }

  private getScoreGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private getScoreRating(score: number): string {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Acceptable';
    return 'Needs Improvement';
  }

  private getOverallDescription(score: number, rating: string): string {
    const descriptions = {
      'Exceptional': 'Outstanding professional performance exceeding industry standards. Demonstrates mastery-level competency across all dimensions.',
      'Excellent': 'Strong professional performance meeting high industry standards. Shows well-developed competency with minor optimization opportunities.',
      'Good': 'Solid professional performance meeting industry standards. Demonstrates competency with clear development pathways.',
      'Acceptable': 'Basic professional performance meeting minimum standards. Shows developing competency requiring continued improvement.',
      'Needs Improvement': 'Performance below professional standards requiring focused development. Shows potential with dedicated improvement effort.'
    };

    return descriptions[rating as keyof typeof descriptions] || 'Performance assessment based on professional competency standards.';
  }

  private getOverallFactors(score: any): string[] {
    const factors: string[] = [];
    const dimensions = score.dimensions || {};

    // Identify contributing factors
    const strongDimensions = Object.entries(dimensions)
      .filter(([_, value]: [string, any]) => (value.weighted || value) >= 85)
      .map(([key, _]) => key);

    const weakDimensions = Object.entries(dimensions)
      .filter(([_, value]: [string, any]) => (value.weighted || value) < 70)
      .map(([key, _]) => key);

    if (strongDimensions.length > 0) {
      factors.push(`Strong performance in ${strongDimensions.join(', ')}`);
    }

    if (weakDimensions.length > 0) {
      factors.push(`Development needed in ${weakDimensions.join(', ')}`);
    }

    if (score.metadata?.contextFactors?.difficulty > 80) {
      factors.push('Adjusted for high scenario difficulty');
    }

    return factors;
  }

  private identifyDimensionStrengths(dimension: string, score: number): string[] {
    const strengths: string[] = [];

    if (score >= 85) {
      const strengthDescriptions = {
        technical: ['High technical accuracy', 'Efficient problem resolution', 'Strong knowledge application'],
        communication: ['Clear customer communication', 'Professional interaction style', 'Effective documentation'],
        procedural: ['Excellent process compliance', 'Strong security awareness', 'Proper escalation practices'],
        customerService: ['High customer satisfaction', 'Strong relationship building', 'Professional service delivery'],
        problemSolving: ['Systematic problem-solving approach', 'Creative solution development', 'Thorough analysis']
      };

      strengths.push(...(strengthDescriptions[dimension as keyof typeof strengthDescriptions] || ['Strong performance']));
    }

    return strengths;
  }

  private identifyDimensionImprovements(dimension: string, score: number): string[] {
    const improvements: string[] = [];

    if (score < 75) {
      const improvementAreas = {
        technical: ['Improve solution accuracy', 'Enhance troubleshooting efficiency', 'Expand technical knowledge'],
        communication: ['Improve communication clarity', 'Enhance customer empathy', 'Strengthen documentation skills'],
        procedural: ['Follow procedures more consistently', 'Improve security compliance', 'Better escalation timing'],
        customerService: ['Focus on customer satisfaction', 'Build stronger relationships', 'Enhance service professionalism'],
        problemSolving: ['Use more systematic approaches', 'Develop creative solutions', 'Improve thoroughness']
      };

      improvements.push(...(improvementAreas[dimension as keyof typeof improvementAreas] || ['Focus on improvement']));
    }

    return improvements;
  }

  private calculateDisplayAdjustment(contextFactors: any): number {
    if (!contextFactors) return 0;

    let adjustment = 0;
    if (contextFactors.difficulty > 80) adjustment += 5;
    if (contextFactors.timeConstraints > 80) adjustment += 3;
    if (contextFactors.customerComplexity > 75) adjustment += 4;
    if (contextFactors.technicalComplexity > 85) adjustment += 5;

    return Math.min(15, adjustment); // Cap at 15% adjustment
  }

  private generateAdjustmentExplanation(contextFactors: any, adjustment: number): string {
    if (adjustment === 0) {
      return 'No contextual adjustments applied - standard scenario conditions.';
    }

    const factors: string[] = [];
    if (contextFactors?.difficulty > 80) factors.push('high scenario difficulty');
    if (contextFactors?.timeConstraints > 80) factors.push('time pressure');
    if (contextFactors?.customerComplexity > 75) factors.push('challenging customer interactions');
    if (contextFactors?.technicalComplexity > 85) factors.push('complex technical requirements');

    return `Score adjusted by +${adjustment}% to account for ${factors.join(', ')}.`;
  }

  private getBenchmarkComparisonText(score: number): string {
    if (score >= 90) {
      return 'Performance in top 10% of industry professionals - exceeds expectations significantly';
    } else if (score >= 80) {
      return 'Performance above industry average - meets high professional standards';
    } else if (score >= 70) {
      return 'Performance meets industry standards - demonstrates professional competency';
    } else {
      return 'Performance below industry average - improvement needed to meet professional standards';
    }
  }

  private getProfessionalRelevanceText(score: number): string {
    if (score >= 85) {
      return 'Score demonstrates advanced professional competency suitable for senior or specialized roles';
    } else if (score >= 75) {
      return 'Score indicates solid professional competency suitable for standard IT support roles';
    } else if (score >= 65) {
      return 'Score shows developing competency - suitable for entry-level roles with continued development';
    } else {
      return 'Score indicates need for fundamental skill development before professional role readiness';
    }
  }

  private getCareerImplicationsText(score: number): string {
    if (score >= 85) {
      return 'Strong potential for career advancement, leadership roles, and specialized positions';
    } else if (score >= 75) {
      return 'Good foundation for career growth with opportunities for skill specialization';
    } else if (score >= 65) {
      return 'Career development opportunities available with focused skill improvement';
    } else {
      return 'Focus on fundamental skill building recommended before pursuing career advancement';
    }
  }
}

export const scorePresentation = new ScorePresentation();