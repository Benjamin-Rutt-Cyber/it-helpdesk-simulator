import { CustomerPersona, getPersonaById, getAllPersonas, getPersonaWeights } from '../config/personas';
import { logger } from '../utils/logger';

export interface SelectionContext {
  ticketType: string;
  ticketPriority: 'low' | 'medium' | 'high' | 'critical';
  ticketCategory: string;
  scenarioType?: string;
  learningObjectives?: string[];
  userLevel?: number;
  sessionCount?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek?: 'weekday' | 'weekend';
  businessHours?: boolean;
  complexityLevel?: 'simple' | 'moderate' | 'complex';
  expectedDuration?: number;
  trainingFocus?: string[];
  previousPersonas?: string[];
  overridePersona?: string;
}

export interface PersonaScore {
  personaId: string;
  score: number;
  reasoning: string[];
  matchFactors: MatchFactor[];
  confidence: number;
}

export interface MatchFactor {
  factor: string;
  weight: number;
  value: number;
  contribution: number;
  explanation: string;
}

export interface SelectionResult {
  selectedPersona: CustomerPersona;
  score: number;
  reasoning: string[];
  alternatives: PersonaScore[];
  selectionConfidence: number;
  contextFactors: string[];
}

export class PersonaSelector {
  private readonly weights = {
    ticketType: 0.25,
    complexity: 0.20,
    learningObjectives: 0.15,
    userExperience: 0.15,
    contextual: 0.10,
    diversity: 0.10,
    priority: 0.05
  };

  async selectPersona(context: SelectionContext): Promise<SelectionResult> {
    logger.info('Selecting persona for context', {
      ticketType: context.ticketType,
      priority: context.ticketPriority,
      category: context.ticketCategory
    });

    // Handle override if specified
    if (context.overridePersona) {
      const overridePersona = getPersonaById(context.overridePersona);
      if (overridePersona) {
        return {
          selectedPersona: overridePersona,
          score: 100,
          reasoning: ['Manual override specified'],
          alternatives: [],
          selectionConfidence: 100,
          contextFactors: ['manual_override']
        };
      }
    }

    // Score all personas
    const personaScores = await this.scoreAllPersonas(context);
    
    // Sort by score
    personaScores.sort((a, b) => b.score - a.score);

    // Apply diversity factors if needed
    const diversityAdjustedScores = this.applyDiversityFactors(personaScores, context);

    const selectedScore = diversityAdjustedScores[0];
    const selectedPersona = getPersonaById(selectedScore.personaId)!;

    const result: SelectionResult = {
      selectedPersona,
      score: selectedScore.score,
      reasoning: selectedScore.reasoning,
      alternatives: diversityAdjustedScores.slice(1, 4), // Top 3 alternatives
      selectionConfidence: this.calculateSelectionConfidence(diversityAdjustedScores),
      contextFactors: this.extractContextFactors(context)
    };

    logger.info('Persona selected', {
      selectedPersona: selectedPersona.id,
      score: selectedScore.score,
      confidence: result.selectionConfidence
    });

    return result;
  }

  private async scoreAllPersonas(context: SelectionContext): Promise<PersonaScore[]> {
    const allPersonas = getAllPersonas();
    const scores: PersonaScore[] = [];

    for (const persona of allPersonas) {
      const score = await this.scorePersona(persona, context);
      scores.push(score);
    }

    return scores;
  }

  private async scorePersona(persona: CustomerPersona, context: SelectionContext): Promise<PersonaScore> {
    const matchFactors: MatchFactor[] = [];
    
    // Ticket type matching
    const ticketTypeScore = this.scoreTicketTypeMatch(persona, context);
    matchFactors.push({
      factor: 'ticket_type_match',
      weight: this.weights.ticketType,
      value: ticketTypeScore.value,
      contribution: ticketTypeScore.value * this.weights.ticketType,
      explanation: ticketTypeScore.explanation
    });

    // Complexity matching
    const complexityScore = this.scoreComplexityMatch(persona, context);
    matchFactors.push({
      factor: 'complexity_match',
      weight: this.weights.complexity,
      value: complexityScore.value,
      contribution: complexityScore.value * this.weights.complexity,
      explanation: complexityScore.explanation
    });

    // Learning objectives alignment
    const learningScore = this.scoreLearningAlignment(persona, context);
    matchFactors.push({
      factor: 'learning_alignment',
      weight: this.weights.learningObjectives,
      value: learningScore.value,
      contribution: learningScore.value * this.weights.learningObjectives,
      explanation: learningScore.explanation
    });

    // User experience level
    const experienceScore = this.scoreUserExperienceMatch(persona, context);
    matchFactors.push({
      factor: 'user_experience_match',
      weight: this.weights.userExperience,
      value: experienceScore.value,
      contribution: experienceScore.value * this.weights.userExperience,
      explanation: experienceScore.explanation
    });

    // Contextual factors
    const contextualScore = this.scoreContextualFactors(persona, context);
    matchFactors.push({
      factor: 'contextual_factors',
      weight: this.weights.contextual,
      value: contextualScore.value,
      contribution: contextualScore.value * this.weights.contextual,
      explanation: contextualScore.explanation
    });

    // Priority alignment
    const priorityScore = this.scorePriorityAlignment(persona, context);
    matchFactors.push({
      factor: 'priority_alignment',
      weight: this.weights.priority,
      value: priorityScore.value,
      contribution: priorityScore.value * this.weights.priority,
      explanation: priorityScore.explanation
    });

    // Calculate total score
    const totalScore = matchFactors.reduce((sum, factor) => sum + factor.contribution, 0);
    
    // Apply base persona weights
    const personaWeights = getPersonaWeights();
    const weightedScore = totalScore * (personaWeights[persona.id] || 0.2);

    // Generate reasoning
    const reasoning = this.generateReasoning(persona, matchFactors, context);

    return {
      personaId: persona.id,
      score: Math.round(weightedScore * 100), // Convert to 0-100 scale
      reasoning,
      matchFactors,
      confidence: this.calculatePersonaConfidence(matchFactors)
    };
  }

  private scoreTicketTypeMatch(persona: CustomerPersona, context: SelectionContext): { value: number; explanation: string } {
    const issueMatch = persona.typical_issues.some(issue => 
      issue.toLowerCase().includes(context.ticketType.toLowerCase()) ||
      context.ticketType.toLowerCase().includes(issue.toLowerCase())
    );

    if (issueMatch) {
      return {
        value: 1.0,
        explanation: `${persona.name} commonly experiences ${context.ticketType} issues`
      };
    }

    // Check category alignment
    const categoryAlignments: Record<string, string[]> = {
      'office_worker': ['email', 'productivity', 'software', 'network'],
      'frustrated_user': ['crash', 'error', 'not_working', 'broken'],
      'patient_retiree': ['security', 'basic_usage', 'learning'],
      'new_employee': ['access', 'setup', 'permissions', 'training'],
      'executive': ['mobile', 'performance', 'business_critical']
    };

    const alignments = categoryAlignments[persona.id] || [];
    const categoryMatch = alignments.some(cat => 
      context.ticketCategory.toLowerCase().includes(cat) ||
      context.ticketType.toLowerCase().includes(cat)
    );

    if (categoryMatch) {
      return {
        value: 0.7,
        explanation: `${persona.name} role aligns with ${context.ticketCategory} category`
      };
    }

    return {
      value: 0.3,
      explanation: `Generic fit for ${context.ticketType} issues`
    };
  }

  private scoreComplexityMatch(persona: CustomerPersona, context: SelectionContext): { value: number; explanation: string } {
    if (!context.complexityLevel) {
      return { value: 0.5, explanation: 'No complexity specified' };
    }

    const personaTechLevel = persona.personality.technicalLevel.level;
    const complexityMap: Record<string, Record<string, number>> = {
      'simple': { 'novice': 1.0, 'intermediate': 0.7, 'advanced': 0.4 },
      'moderate': { 'novice': 0.6, 'intermediate': 1.0, 'advanced': 0.8 },
      'complex': { 'novice': 0.3, 'intermediate': 0.7, 'advanced': 1.0 }
    };

    const score = complexityMap[context.complexityLevel][personaTechLevel] || 0.5;
    
    return {
      value: score,
      explanation: `${personaTechLevel} technical level ${score > 0.7 ? 'well suited' : 'moderately suited'} for ${context.complexityLevel} issues`
    };
  }

  private scoreLearningAlignment(persona: CustomerPersona, context: SelectionContext): { value: number; explanation: string } {
    if (!context.learningObjectives || context.learningObjectives.length === 0) {
      return { value: 0.5, explanation: 'No learning objectives specified' };
    }

    const learningFocus: Record<string, string[]> = {
      'office_worker': ['productivity', 'efficiency', 'professional_communication'],
      'frustrated_user': ['patience', 'empathy', 'de_escalation', 'calming_techniques'],
      'patient_retiree': ['patience', 'detailed_explanation', 'step_by_step_guidance'],
      'new_employee': ['mentoring', 'knowledge_transfer', 'system_training'],
      'executive': ['business_impact', 'escalation', 'priority_management', 'efficiency']
    };

    const personaLearning = learningFocus[persona.id] || [];
    const alignmentCount = context.learningObjectives.filter(obj =>
      personaLearning.some(learning => 
        obj.toLowerCase().includes(learning.toLowerCase()) ||
        learning.toLowerCase().includes(obj.toLowerCase())
      )
    ).length;

    const alignmentRatio = alignmentCount / context.learningObjectives.length;

    return {
      value: alignmentRatio,
      explanation: `${alignmentCount}/${context.learningObjectives.length} learning objectives align with ${persona.name} interactions`
    };
  }

  private scoreUserExperienceMatch(persona: CustomerPersona, context: SelectionContext): { value: number; explanation: string } {
    if (!context.userLevel) {
      return { value: 0.5, explanation: 'No user experience level specified' };
    }

    // Match user experience level with appropriate persona challenge
    const experienceMapping: Record<number, string[]> = {
      1: ['frustrated_user', 'patient_retiree'], // Beginners need challenging but manageable
      2: ['office_worker', 'new_employee'],     // Intermediate need realistic scenarios
      3: ['executive', 'office_worker'],       // Advanced need complex scenarios
      4: ['executive'],                        // Expert need high-stakes scenarios
      5: ['executive']                         // Master level
    };

    const suitablePersonas = experienceMapping[Math.min(context.userLevel, 5)] || ['office_worker'];
    const isWellSuited = suitablePersonas.includes(persona.id);

    return {
      value: isWellSuited ? 1.0 : 0.4,
      explanation: isWellSuited 
        ? `${persona.name} provides appropriate challenge for user level ${context.userLevel}`
        : `${persona.name} may be too ${context.userLevel > 2 ? 'simple' : 'challenging'} for user level ${context.userLevel}`
    };
  }

  private scoreContextualFactors(persona: CustomerPersona, context: SelectionContext): { value: number; explanation: string } {
    let score = 0.5; // Base score
    const factors: string[] = [];

    // Time of day alignment
    if (context.timeOfDay && context.businessHours !== undefined) {
      if (persona.id === 'executive' && (context.timeOfDay === 'evening' || !context.businessHours)) {
        score += 0.2; // Executives often work after hours
        factors.push('after-hours executive availability');
      }
      
      if (persona.id === 'patient_retiree' && context.timeOfDay === 'morning' && context.businessHours) {
        score += 0.2; // Retirees often prefer morning interactions
        factors.push('morning interaction preference');
      }
    }

    // Priority context
    if (context.ticketPriority) {
      if (context.ticketPriority === 'critical' && persona.escalation_likelihood > 0.5) {
        score += 0.3; // High-escalation personas for critical issues
        factors.push('high escalation likelihood for critical issues');
      }
      
      if (context.ticketPriority === 'low' && persona.personality.patience === 'very_high') {
        score += 0.2; // Patient personas for low-priority learning
        factors.push('patient persona for low-priority learning');
      }
    }

    return {
      value: Math.min(1.0, score),
      explanation: factors.length > 0 ? factors.join(', ') : 'Standard contextual alignment'
    };
  }

  private scorePriorityAlignment(persona: CustomerPersona, context: SelectionContext): { value: number; explanation: string } {
    const priorityMap: Record<string, Record<string, number>> = {
      'critical': {
        'executive': 1.0,
        'frustrated_user': 0.8,
        'office_worker': 0.6,
        'new_employee': 0.4,
        'patient_retiree': 0.2
      },
      'high': {
        'executive': 0.8,
        'office_worker': 1.0,
        'frustrated_user': 0.7,
        'new_employee': 0.6,
        'patient_retiree': 0.3
      },
      'medium': {
        'office_worker': 1.0,
        'new_employee': 0.9,
        'patient_retiree': 0.8,
        'frustrated_user': 0.6,
        'executive': 0.4
      },
      'low': {
        'patient_retiree': 1.0,
        'new_employee': 0.8,
        'office_worker': 0.6,
        'frustrated_user': 0.3,
        'executive': 0.1
      }
    };

    const score = priorityMap[context.ticketPriority]?.[persona.id] || 0.5;

    return {
      value: score,
      explanation: `${persona.name} ${score > 0.7 ? 'well suited' : 'moderately suited'} for ${context.ticketPriority} priority issues`
    };
  }

  private applyDiversityFactors(scores: PersonaScore[], context: SelectionContext): PersonaScore[] {
    if (!context.previousPersonas || context.previousPersonas.length === 0) {
      return scores;
    }

    // Reduce scores for recently used personas
    const adjustedScores = scores.map(score => {
      const recentUse = context.previousPersonas!.indexOf(score.personaId);
      if (recentUse >= 0) {
        // Reduce score based on how recently used (more recent = bigger reduction)
        const reduction = (5 - recentUse) * 5; // Up to 25% reduction for most recent
        const adjustedScore = Math.max(0, score.score - reduction);
        
        if (adjustedScore !== score.score) {
          score.reasoning.push(`Reduced for diversity (recently used ${recentUse + 1} sessions ago)`);
        }
        
        return {
          ...score,
          score: adjustedScore
        };
      }
      return score;
    });

    return adjustedScores.sort((a, b) => b.score - a.score);
  }

  private calculateSelectionConfidence(scores: PersonaScore[]): number {
    if (scores.length < 2) return 100;

    const topScore = scores[0].score;
    const secondScore = scores[1].score;
    
    // Confidence based on score separation
    const scoreDifference = topScore - secondScore;
    const confidence = Math.min(100, 50 + scoreDifference); // Base 50% + difference

    return Math.round(confidence);
  }

  private calculatePersonaConfidence(matchFactors: MatchFactor[]): number {
    const avgContribution = matchFactors.reduce((sum, factor) => sum + factor.contribution, 0) / matchFactors.length;
    return Math.round(avgContribution * 100);
  }

  private generateReasoning(persona: CustomerPersona, matchFactors: MatchFactor[], context: SelectionContext): string[] {
    const reasoning: string[] = [];

    // Top contributing factors
    const topFactors = matchFactors
      .filter(f => f.contribution > 0.1)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);

    topFactors.forEach(factor => {
      if (factor.contribution > 0.15) {
        reasoning.push(factor.explanation);
      }
    });

    // Persona-specific reasoning
    if (persona.escalation_likelihood > 0.6 && context.ticketPriority !== 'low') {
      reasoning.push('High escalation likelihood provides challenging scenario');
    }

    if (persona.personality.curiosity === 'very_high' && context.learningObjectives) {
      reasoning.push('High curiosity level supports learning objectives');
    }

    return reasoning.length > 0 ? reasoning : ['Standard persona selection criteria applied'];
  }

  private extractContextFactors(context: SelectionContext): string[] {
    const factors: string[] = [];

    if (context.businessHours === false) factors.push('after_hours');
    if (context.ticketPriority === 'critical') factors.push('critical_priority');
    if (context.complexityLevel === 'complex') factors.push('high_complexity');
    if (context.userLevel && context.userLevel > 3) factors.push('experienced_user');
    if (context.sessionCount && context.sessionCount > 5) factors.push('frequent_user');

    return factors;
  }

  // Analytics and insights
  async getSelectionAnalytics(sessionIds: string[]): Promise<SelectionAnalytics> {
    // This would typically query actual session data
    // For now, providing structure for analytics
    
    return {
      personaDistribution: this.calculatePersonaDistribution(sessionIds),
      selectionAccuracy: this.calculateSelectionAccuracy(sessionIds),
      diversityScore: this.calculateDiversityScore(sessionIds),
      learningEffectiveness: this.calculateLearningEffectiveness(sessionIds),
      recommendations: this.generateSelectionRecommendations(sessionIds)
    };
  }

  private calculatePersonaDistribution(_sessionIds: string[]): Record<string, number> {
    // Placeholder implementation
    const distribution: Record<string, number> = {};
    getAllPersonas().forEach(persona => {
      distribution[persona.id] = 0.2; // Even distribution for now
    });
    return distribution;
  }

  private calculateSelectionAccuracy(_sessionIds: string[]): number {
    // Placeholder - would calculate based on actual outcomes
    return 85; // 85% accuracy
  }

  private calculateDiversityScore(_sessionIds: string[]): number {
    // Placeholder - would calculate persona variety
    return 78; // Good diversity
  }

  private calculateLearningEffectiveness(_sessionIds: string[]): number {
    // Placeholder - would calculate learning outcomes
    return 82; // Good learning effectiveness
  }

  private generateSelectionRecommendations(_sessionIds: string[]): string[] {
    return [
      'Consider increasing patient_retiree persona frequency for patience training',
      'Executive persona showing good learning outcomes for escalation scenarios',
      'Maintain current diversity balance for optimal training variety'
    ];
  }
}

export interface SelectionAnalytics {
  personaDistribution: Record<string, number>;
  selectionAccuracy: number;
  diversityScore: number;
  learningEffectiveness: number;
  recommendations: string[];
}

export const personaSelector = new PersonaSelector();
export default personaSelector;