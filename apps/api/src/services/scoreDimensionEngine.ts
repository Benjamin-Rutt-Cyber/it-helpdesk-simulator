import { logger } from '../utils/logger';

interface TechnicalScores {
  accuracy: number;
  efficiency: number;
  knowledge: number;
  innovation: number;
}

interface CommunicationScores {
  clarity: number;
  empathy: number;
  responsiveness: number;
  documentation: number;
}

interface ProceduralScores {
  compliance: number;
  security: number;
  escalation: number;
  documentation: number;
}

interface CustomerServiceScores {
  satisfaction: number;
  relationship: number;
  professionalism: number;
  followUp: number;
}

interface ProblemSolvingScores {
  approach: number;
  creativity: number;
  thoroughness: number;
  adaptability: number;
}

class ScoreDimensionEngine {
  /**
   * Calculate technical dimension scores
   */
  async calculateTechnicalScores(userActions: any[], resolutionData: any, scenarioData: any): Promise<TechnicalScores> {
    try {
      logger.debug('Calculating technical dimension scores');

      const accuracy = this.calculateTechnicalAccuracy(userActions, resolutionData, scenarioData);
      const efficiency = this.calculateTechnicalEfficiency(userActions, resolutionData, scenarioData);
      const knowledge = this.calculateKnowledgeApplication(userActions, scenarioData);
      const innovation = this.calculateInnovationScore(userActions, resolutionData);

      return { accuracy, efficiency, knowledge, innovation };
    } catch (error) {
      logger.error('Error calculating technical scores:', error);
      throw new Error('Failed to calculate technical scores');
    }
  }

  /**
   * Calculate communication dimension scores
   */
  async calculateCommunicationScores(customerInteractions: any[], resolutionData: any): Promise<CommunicationScores> {
    try {
      logger.debug('Calculating communication dimension scores');

      const clarity = this.calculateCommunicationClarity(customerInteractions);
      const empathy = this.calculateEmpathyScore(customerInteractions);
      const responsiveness = this.calculateResponsivenessScore(customerInteractions);
      const documentation = this.calculateDocumentationQuality(resolutionData);

      return { clarity, empathy, responsiveness, documentation };
    } catch (error) {
      logger.error('Error calculating communication scores:', error);
      throw new Error('Failed to calculate communication scores');
    }
  }

  /**
   * Calculate procedural dimension scores
   */
  async calculateProceduralScores(userActions: any[], scenarioData: any, resolutionData: any): Promise<ProceduralScores> {
    try {
      logger.debug('Calculating procedural dimension scores');

      const compliance = this.calculateProcessCompliance(userActions, scenarioData);
      const security = this.calculateSecurityCompliance(userActions, scenarioData);
      const escalation = this.calculateEscalationProperness(userActions, resolutionData);
      const documentation = this.calculateProceduralDocumentation(resolutionData);

      return { compliance, security, escalation, documentation };
    } catch (error) {
      logger.error('Error calculating procedural scores:', error);
      throw new Error('Failed to calculate procedural scores');
    }
  }

  /**
   * Calculate customer service dimension scores
   */
  async calculateCustomerServiceScores(customerInteractions: any[], resolutionData: any): Promise<CustomerServiceScores> {
    try {
      logger.debug('Calculating customer service dimension scores');

      const satisfaction = this.calculateCustomerSatisfaction(customerInteractions, resolutionData);
      const relationship = this.calculateRelationshipBuilding(customerInteractions);
      const professionalism = this.calculateProfessionalismScore(customerInteractions);
      const followUp = this.calculateFollowUpQuality(resolutionData);

      return { satisfaction, relationship, professionalism, followUp };
    } catch (error) {
      logger.error('Error calculating customer service scores:', error);
      throw new Error('Failed to calculate customer service scores');
    }
  }

  /**
   * Calculate problem-solving dimension scores
   */
  async calculateProblemSolvingScores(userActions: any[], resolutionData: any, scenarioData: any): Promise<ProblemSolvingScores> {
    try {
      logger.debug('Calculating problem-solving dimension scores');

      const approach = this.calculateProblemSolvingApproach(userActions, scenarioData);
      const creativity = this.calculateCreativityScore(userActions, resolutionData);
      const thoroughness = this.calculateThoroughnessScore(userActions, resolutionData);
      const adaptability = this.calculateAdaptabilityScore(userActions, resolutionData);

      return { approach, creativity, thoroughness, adaptability };
    } catch (error) {
      logger.error('Error calculating problem-solving scores:', error);
      throw new Error('Failed to calculate problem-solving scores');
    }
  }

  // Technical Dimension Calculations

  private calculateTechnicalAccuracy(userActions: any[], resolutionData: any, scenarioData: any): number {
    let accuracyScore = 85; // Base score

    // Check solution correctness
    if (resolutionData.resolved) {
      accuracyScore += 10;
    }

    // Check if solution addresses root cause
    const diagnosticActions = userActions.filter(action => action.type === 'diagnosis' || action.type === 'research');
    if (diagnosticActions.length >= 2) {
      accuracyScore += 5; // Bonus for thorough diagnosis
    }

    // Check for technical errors
    const errorActions = userActions.filter(action => action.quality && action.quality < 60);
    accuracyScore -= errorActions.length * 3;

    // Check solution alignment with scenario requirements
    if (scenarioData.complexity === 'advanced' && resolutionData.solutionComplexity === 'advanced') {
      accuracyScore += 5;
    }

    return Math.max(0, Math.min(100, accuracyScore));
  }

  private calculateTechnicalEfficiency(userActions: any[], resolutionData: any, scenarioData: any): number {
    let efficiencyScore = 75; // Base score

    // Time efficiency
    const actualTime = resolutionData.timeToResolution || 30;
    const expectedTime = scenarioData.estimatedTime || 30;
    const timeRatio = actualTime / expectedTime;

    if (timeRatio <= 0.8) {
      efficiencyScore += 20; // Excellent time management
    } else if (timeRatio <= 1.0) {
      efficiencyScore += 10; // Good time management
    } else if (timeRatio <= 1.2) {
      efficiencyScore += 0; // Acceptable
    } else {
      efficiencyScore -= 10; // Over time
    }

    // Action efficiency (fewer unnecessary actions)
    const necessaryActions = ['research', 'diagnosis', 'solution', 'verification'];
    const unnecessaryActions = userActions.filter(action => 
      !necessaryActions.includes(action.type) && action.type !== 'communication'
    );
    efficiencyScore -= unnecessaryActions.length * 2;

    // Resource utilization efficiency
    const researchActions = userActions.filter(action => action.type === 'research');
    if (researchActions.length > 0) {
      const avgResearchQuality = researchActions.reduce((sum, action) => sum + (action.quality || 70), 0) / researchActions.length;
      if (avgResearchQuality >= 85) {
        efficiencyScore += 5; // Efficient research
      }
    }

    return Math.max(0, Math.min(100, efficiencyScore));
  }

  private calculateKnowledgeApplication(userActions: any[], scenarioData: any): number {
    let knowledgeScore = 70; // Base score

    // Knowledge base usage
    const researchActions = userActions.filter(action => action.type === 'research');
    if (researchActions.length > 0) {
      knowledgeScore += 15; // Used knowledge resources
      
      // Quality of knowledge application
      const avgQuality = researchActions.reduce((sum, action) => sum + (action.quality || 70), 0) / researchActions.length;
      if (avgQuality >= 85) {
        knowledgeScore += 10; // High-quality knowledge application
      }
    }

    // Appropriate tool/method selection
    const solutionActions = userActions.filter(action => action.type === 'solution');
    if (solutionActions.length > 0) {
      const appropriateSolutions = solutionActions.filter(action => 
        action.appropriateness && action.appropriateness >= 80
      );
      knowledgeScore += appropriateSolutions.length * 5;
    }

    // Domain expertise demonstration
    if (scenarioData.complexity === 'advanced') {
      const expertActions = userActions.filter(action => action.expertiseLevel && action.expertiseLevel >= 4);
      knowledgeScore += expertActions.length * 3;
    }

    return Math.max(0, Math.min(100, knowledgeScore));
  }

  private calculateInnovationScore(userActions: any[], resolutionData: any): number {
    let innovationScore = 60; // Base score

    // Creative problem-solving approaches
    const creativeActions = userActions.filter(action => 
      action.creativity && action.creativity >= 70
    );
    innovationScore += creativeActions.length * 10;

    // Alternative solution exploration
    const alternativeSolutions = userActions.filter(action => 
      action.type === 'alternative_solution' || action.type === 'solution_variation'
    );
    innovationScore += alternativeSolutions.length * 8;

    // Innovation in customer communication
    if (resolutionData.communicationInnovation && resolutionData.communicationInnovation >= 70) {
      innovationScore += 10;
    }

    // Process improvement suggestions
    if (resolutionData.processImprovements && resolutionData.processImprovements.length > 0) {
      innovationScore += 15;
    }

    return Math.max(0, Math.min(100, innovationScore));
  }

  // Communication Dimension Calculations

  private calculateCommunicationClarity(customerInteractions: any[]): number {
    if (customerInteractions.length === 0) return 75;

    let clarityScore = 0;
    let totalInteractions = 0;

    customerInteractions.forEach(interaction => {
      if (interaction.clarity !== undefined) {
        clarityScore += interaction.clarity;
        totalInteractions++;
      }
    });

    if (totalInteractions === 0) return 75;

    const avgClarity = clarityScore / totalInteractions;

    // Bonus for consistent clarity
    const clarityValues = customerInteractions.map(i => i.clarity).filter(c => c !== undefined);
    const clarityVariance = this.calculateVariance(clarityValues);
    if (clarityVariance < 100) { // Low variance = consistent
      return Math.min(100, avgClarity + 5);
    }

    return Math.max(0, Math.min(100, avgClarity));
  }

  private calculateEmpathyScore(customerInteractions: any[]): number {
    if (customerInteractions.length === 0) return 75;

    let empathyScore = 0;
    let totalInteractions = 0;

    customerInteractions.forEach(interaction => {
      if (interaction.empathy !== undefined) {
        empathyScore += interaction.empathy;
        totalInteractions++;
      } else if (interaction.type === 'empathetic_response') {
        empathyScore += 85; // Default high score for empathetic responses
        totalInteractions++;
      }
    });

    if (totalInteractions === 0) return 75;

    const avgEmpathy = empathyScore / totalInteractions;

    // Bonus for emotional intelligence demonstrations
    const emotionalIntelligenceActions = customerInteractions.filter(i => 
      i.type === 'emotional_support' || i.emotionalIntelligence >= 80
    );
    const bonus = emotionalIntelligenceActions.length * 3;

    return Math.max(0, Math.min(100, avgEmpathy + bonus));
  }

  private calculateResponsivenessScore(customerInteractions: any[]): number {
    if (customerInteractions.length === 0) return 75;

    let responsivenessScore = 85; // Base score

    // Calculate average response time
    const responseTimes = customerInteractions
      .map(i => i.responseTime)
      .filter(time => time !== undefined);

    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      
      // Scoring based on response time (in seconds)
      if (avgResponseTime <= 30) {
        responsivenessScore += 15; // Excellent responsiveness
      } else if (avgResponseTime <= 60) {
        responsivenessScore += 10; // Good responsiveness
      } else if (avgResponseTime <= 120) {
        responsivenessScore += 5; // Acceptable
      } else if (avgResponseTime <= 300) {
        responsivenessScore -= 5; // Slow
      } else {
        responsivenessScore -= 15; // Very slow
      }
    }

    // Bonus for proactive communication
    const proactiveActions = customerInteractions.filter(i => 
      i.type === 'proactive_update' || i.proactive === true
    );
    responsivenessScore += proactiveActions.length * 5;

    return Math.max(0, Math.min(100, responsivenessScore));
  }

  private calculateDocumentationQuality(resolutionData: any): number {
    let documentationScore = 70; // Base score

    // Check if documentation exists
    if (resolutionData.documentation) {
      documentationScore += 20;

      // Quality assessment
      if (resolutionData.documentation.completeness >= 80) {
        documentationScore += 5;
      }
      if (resolutionData.documentation.clarity >= 80) {
        documentationScore += 5;
      }
    }

    // Step-by-step documentation
    if (resolutionData.steps && resolutionData.steps.length > 0) {
      documentationScore += Math.min(10, resolutionData.steps.length * 2);
    }

    return Math.max(0, Math.min(100, documentationScore));
  }

  // Procedural Dimension Calculations

  private calculateProcessCompliance(userActions: any[], scenarioData: any): number {
    let complianceScore = 80; // Base score

    // Check required process steps
    const requiredSteps = scenarioData.requiredSteps || ['initial_assessment', 'diagnosis', 'solution', 'verification'];
    const completedSteps = userActions.map(action => action.type);
    
    const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));
    complianceScore -= missingSteps.length * 10;

    // Check process order
    const expectedOrder = ['initial_assessment', 'diagnosis', 'solution', 'verification'];
    const actualOrder = userActions.map(action => action.type).filter(type => expectedOrder.includes(type));
    
    let orderScore = 100;
    for (let i = 1; i < actualOrder.length; i++) {
      const currentIndex = expectedOrder.indexOf(actualOrder[i]);
      const previousIndex = expectedOrder.indexOf(actualOrder[i-1]);
      if (currentIndex < previousIndex) {
        orderScore -= 5; // Penalty for out-of-order steps
      }
    }
    
    complianceScore = (complianceScore + orderScore) / 2;

    return Math.max(0, Math.min(100, complianceScore));
  }

  private calculateSecurityCompliance(userActions: any[], scenarioData: any): number {
    let securityScore = 90; // Base score (high default for security)

    // Check for security protocol violations
    const securityViolations = userActions.filter(action => 
      action.securityRisk === true || action.securityCompliance === false
    );
    securityScore -= securityViolations.length * 15;

    // Check for identity verification when required
    if (scenarioData.requiresIdentityVerification) {
      const verificationActions = userActions.filter(action => 
        action.type === 'identity_verification' || action.type === 'security_check'
      );
      if (verificationActions.length === 0) {
        securityScore -= 20;
      }
    }

    // Bonus for proactive security measures
    const proactiveSecurityActions = userActions.filter(action => 
      action.type === 'security_assessment' || action.proactiveSecurity === true
    );
    securityScore += proactiveSecurityActions.length * 5;

    return Math.max(0, Math.min(100, securityScore));
  }

  private calculateEscalationProperness(userActions: any[], resolutionData: any): number {
    let escalationScore = 90; // Base score (high default)

    const escalationActions = userActions.filter(action => action.type === 'escalation');
    
    if (escalationActions.length === 0) {
      // No escalation - check if it was needed
      if (resolutionData.shouldHaveEscalated === true) {
        escalationScore -= 25; // Penalty for not escalating when needed
      }
      return escalationScore;
    }

    // Escalation occurred - check appropriateness
    escalationActions.forEach(escalation => {
      if (escalation.appropriate === true) {
        escalationScore += 5; // Bonus for appropriate escalation
      } else if (escalation.appropriate === false) {
        escalationScore -= 15; // Penalty for inappropriate escalation
      }

      // Check escalation justification quality
      if (escalation.justificationQuality) {
        if (escalation.justificationQuality >= 80) {
          escalationScore += 5;
        } else if (escalation.justificationQuality < 60) {
          escalationScore -= 5;
        }
      }
    });

    return Math.max(0, Math.min(100, escalationScore));
  }

  private calculateProceduralDocumentation(resolutionData: any): number {
    let documentationScore = 75; // Base score

    // Check completeness of procedural documentation
    if (resolutionData.proceduralDocumentation) {
      documentationScore += 15;

      const doc = resolutionData.proceduralDocumentation;
      if (doc.stepsDocumented >= 80) documentationScore += 5;
      if (doc.reasoningDocumented >= 80) documentationScore += 5;
    }

    return Math.max(0, Math.min(100, documentationScore));
  }

  // Customer Service Dimension Calculations

  private calculateCustomerSatisfaction(customerInteractions: any[], resolutionData: any): number {
    // Primary source: explicit customer satisfaction rating
    if (resolutionData.customerSatisfaction !== undefined) {
      return Math.max(0, Math.min(100, resolutionData.customerSatisfaction));
    }

    // Fallback: infer from interactions
    if (customerInteractions.length === 0) return 75;

    let satisfactionSum = 0;
    let satisfactionCount = 0;

    customerInteractions.forEach(interaction => {
      if (interaction.satisfaction !== undefined) {
        satisfactionSum += interaction.satisfaction;
        satisfactionCount++;
      }
    });

    if (satisfactionCount > 0) {
      return Math.max(0, Math.min(100, satisfactionSum / satisfactionCount));
    }

    return 75; // Default neutral score
  }

  private calculateRelationshipBuilding(customerInteractions: any[]): number {
    if (customerInteractions.length === 0) return 75;

    let relationshipScore = 70; // Base score

    // Rapport building actions
    const rapportActions = customerInteractions.filter(i => 
      i.type === 'rapport_building' || i.rapport >= 70
    );
    relationshipScore += rapportActions.length * 8;

    // Personal connection indicators
    const personalConnectionActions = customerInteractions.filter(i => 
      i.personalConnection === true || i.type === 'personal_acknowledgment'
    );
    relationshipScore += personalConnectionActions.length * 5;

    // Trust building
    const trustIndicators = customerInteractions.filter(i => i.trustBuilding >= 70);
    relationshipScore += trustIndicators.length * 6;

    return Math.max(0, Math.min(100, relationshipScore));
  }

  private calculateProfessionalismScore(customerInteractions: any[]): number {
    if (customerInteractions.length === 0) return 85; // High default for professionalism

    let professionalismScore = 85; // Base score

    // Check for unprofessional behavior
    const unprofessionalActions = customerInteractions.filter(i => 
      i.unprofessional === true || i.professionalism < 60
    );
    professionalismScore -= unprofessionalActions.length * 10;

    // Bonus for exceptional professionalism
    const exceptionalActions = customerInteractions.filter(i => 
      i.professionalism >= 95 || i.type === 'exceptional_service'
    );
    professionalismScore += exceptionalActions.length * 3;

    // Consistent professional language
    const languageQuality = customerInteractions
      .map(i => i.languageQuality)
      .filter(q => q !== undefined);
    
    if (languageQuality.length > 0) {
      const avgLanguageQuality = languageQuality.reduce((a, b) => a + b, 0) / languageQuality.length;
      if (avgLanguageQuality >= 90) {
        professionalismScore += 5;
      }
    }

    return Math.max(0, Math.min(100, professionalismScore));
  }

  private calculateFollowUpQuality(resolutionData: any): number {
    let followUpScore = 70; // Base score

    // Check if follow-up was provided when needed
    if (resolutionData.followUpProvided === true) {
      followUpScore += 20;

      // Quality of follow-up
      if (resolutionData.followUpQuality >= 80) {
        followUpScore += 10;
      }
    } else if (resolutionData.followUpRequired === true) {
      followUpScore -= 20; // Penalty for missing required follow-up
    } else {
      followUpScore += 10; // Bonus for not needing follow-up (clean resolution)
    }

    return Math.max(0, Math.min(100, followUpScore));
  }

  // Problem-Solving Dimension Calculations

  private calculateProblemSolvingApproach(userActions: any[], scenarioData: any): number {
    let approachScore = 75; // Base score

    // Systematic approach indicators
    const systematicActions = ['initial_assessment', 'research', 'diagnosis', 'hypothesis', 'testing', 'solution'];
    const userActionTypes = userActions.map(action => action.type);
    
    const systematicSteps = systematicActions.filter(step => userActionTypes.includes(step));
    approachScore += systematicSteps.length * 3;

    // Root cause analysis
    const rootCauseActions = userActions.filter(action => 
      action.type === 'root_cause_analysis' || action.rootCauseAnalysis === true
    );
    approachScore += rootCauseActions.length * 10;

    // Logical progression
    if (this.hasLogicalProgression(userActions)) {
      approachScore += 10;
    }

    return Math.max(0, Math.min(100, approachScore));
  }

  private calculateCreativityScore(userActions: any[], resolutionData: any): number {
    let creativityScore = 60; // Base score

    // Creative solution indicators
    const creativeActions = userActions.filter(action => 
      action.creativity >= 70 || action.type === 'creative_solution'
    );
    creativityScore += creativeActions.length * 15;

    // Alternative approaches
    const alternativeApproaches = userActions.filter(action => 
      action.type === 'alternative_approach' || action.alternative === true
    );
    creativityScore += alternativeApproaches.length * 10;

    // Innovation in resolution
    if (resolutionData.innovative === true) {
      creativityScore += 20;
    }

    return Math.max(0, Math.min(100, creativityScore));
  }

  private calculateThoroughnessScore(userActions: any[], resolutionData: any): number {
    let thoroughnessScore = 70; // Base score

    // Number of investigative actions
    const investigativeActions = userActions.filter(action => 
      action.type === 'research' || action.type === 'investigation' || action.type === 'testing'
    );
    thoroughnessScore += Math.min(20, investigativeActions.length * 4);

    // Completeness of solution
    if (resolutionData.completeness >= 90) {
      thoroughnessScore += 15;
    } else if (resolutionData.completeness >= 80) {
      thoroughnessScore += 10;
    }

    // Verification steps
    const verificationActions = userActions.filter(action => 
      action.type === 'verification' || action.type === 'testing'
    );
    thoroughnessScore += verificationActions.length * 5;

    return Math.max(0, Math.min(100, thoroughnessScore));
  }

  private calculateAdaptabilityScore(userActions: any[], resolutionData: any): number {
    let adaptabilityScore = 75; // Base score

    // Strategy changes during resolution
    const strategyChanges = userActions.filter(action => 
      action.type === 'strategy_change' || action.strategyChange === true
    );
    adaptabilityScore += strategyChanges.length * 10;

    // Response to new information
    const adaptiveActions = userActions.filter(action => 
      action.adaptiveResponse === true || action.type === 'adaptive_response'
    );
    adaptabilityScore += adaptiveActions.length * 8;

    // Flexibility in approach
    if (resolutionData.approachFlexibility >= 80) {
      adaptabilityScore += 10;
    }

    return Math.max(0, Math.min(100, adaptabilityScore));
  }

  // Helper methods

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    
    return variance;
  }

  private hasLogicalProgression(userActions: any[]): boolean {
    const expectedFlow = ['initial_assessment', 'research', 'diagnosis', 'solution', 'verification'];
    const actionTypes = userActions.map(action => action.type);
    
    let lastExpectedIndex = -1;
    for (const actionType of actionTypes) {
      const currentIndex = expectedFlow.indexOf(actionType);
      if (currentIndex !== -1) {
        if (currentIndex <= lastExpectedIndex) {
          return false; // Out of order
        }
        lastExpectedIndex = currentIndex;
      }
    }
    
    return true; // Logical progression maintained
  }

  /**
   * Get dimension scoring methodology
   */
  async getDimensionMethodology(): Promise<any> {
    return {
      technical: {
        description: 'Evaluates technical solution accuracy, efficiency, knowledge application, and innovation',
        components: {
          accuracy: 'Correctness of technical solutions and troubleshooting approaches',
          efficiency: 'Time management and resource utilization during problem resolution',
          knowledge: 'Effective application of technical knowledge and research skills',
          innovation: 'Creative problem-solving and process improvement suggestions'
        },
        scoringFactors: [
          'Solution correctness and completeness',
          'Time-to-resolution vs. scenario complexity',
          'Quality of knowledge base research',
          'Technical methodology adherence',
          'Innovation in problem-solving approach'
        ]
      },
      communication: {
        description: 'Assesses communication clarity, empathy, responsiveness, and documentation quality',
        components: {
          clarity: 'Clear, understandable communication with customers',
          empathy: 'Demonstration of customer empathy and understanding',
          responsiveness: 'Timely and appropriate responses to customer needs',
          documentation: 'Quality of written documentation and follow-up'
        },
        scoringFactors: [
          'Communication clarity and professionalism',
          'Emotional intelligence and empathy demonstration',
          'Response time and proactive communication',
          'Documentation completeness and quality'
        ]
      },
      procedural: {
        description: 'Evaluates adherence to procedures, security protocols, and escalation processes',
        components: {
          compliance: 'Following established procedures and protocols',
          security: 'Adherence to security and privacy requirements',
          escalation: 'Appropriate escalation timing and justification',
          documentation: 'Proper procedural documentation and record-keeping'
        },
        scoringFactors: [
          'Process step completion and order',
          'Security protocol adherence',
          'Escalation appropriateness and justification',
          'Procedural documentation quality'
        ]
      },
      customerService: {
        description: 'Measures customer satisfaction, relationship building, and service quality',
        components: {
          satisfaction: 'Direct customer satisfaction ratings and feedback',
          relationship: 'Rapport building and customer relationship management',
          professionalism: 'Professional behavior and service delivery',
          followUp: 'Quality of follow-up and closure processes'
        },
        scoringFactors: [
          'Customer satisfaction ratings',
          'Rapport and relationship building effectiveness',
          'Professional behavior consistency',
          'Follow-up completeness and quality'
        ]
      },
      problemSolving: {
        description: 'Assesses problem-solving methodology, creativity, and adaptability',
        components: {
          approach: 'Systematic and logical problem-solving methodology',
          creativity: 'Creative and innovative solution development',
          thoroughness: 'Comprehensive problem investigation and resolution',
          adaptability: 'Flexibility and adaptation to changing requirements'
        },
        scoringFactors: [
          'Systematic problem-solving approach',
          'Creative solution development',
          'Investigation thoroughness and completeness',
          'Adaptability to new information and requirements'
        ]
      }
    };
  }
}

export const scoreDimensionEngine = new ScoreDimensionEngine();