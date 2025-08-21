import { PersonaTraits } from '../utils/aiPrompts';
import { logger } from '../utils/logger';
import { createClient, RedisClientType } from 'redis';

export interface PersonaMemory {
  conversationId: string;
  personaId: string;
  traits: PersonaTraits;
  behaviorHistory: BehaviorEvent[];
  consistencyScore: number;
  lastUpdated: Date;
}

export interface BehaviorEvent {
  timestamp: Date;
  action: string;
  context: string;
  emotionalState: string;
  responsePattern: string;
}

export interface ConsistencyViolation {
  type: 'trait_mismatch' | 'behavior_inconsistency' | 'emotional_shift' | 'communication_style';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedCorrection: string;
}

class PersonaManager {
  private redis: RedisClientType;
  private readonly MEMORY_TTL = 86400 * 7; // 7 days
  private readonly MIN_CONSISTENCY_SCORE = 75;

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.redis.on('error', (err) => {
      logger.error('PersonaManager Redis connection error:', err);
    });

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      await this.redis.connect();
      logger.info('PersonaManager Redis client connected');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async getPersonaMemory(conversationId: string): Promise<PersonaMemory | null> {
    try {
      const memoryKey = this.getMemoryKey(conversationId);
      const memoryData = await this.redis.get(memoryKey);
      
      if (!memoryData) {
        return null;
      }

      const memory = JSON.parse(memoryData) as PersonaMemory;
      
      // Convert timestamp strings back to Date objects
      memory.lastUpdated = new Date(memory.lastUpdated);
      memory.behaviorHistory.forEach(event => {
        event.timestamp = new Date(event.timestamp);
      });

      return memory;
    } catch (error) {
      logger.error(`Failed to get persona memory for conversation ${conversationId}:`, error);
      return null;
    }
  }

  async initializePersona(
    conversationId: string,
    persona: PersonaTraits
  ): Promise<PersonaMemory> {
    const memory: PersonaMemory = {
      conversationId,
      personaId: persona.name,
      traits: persona,
      behaviorHistory: [],
      consistencyScore: 100,
      lastUpdated: new Date()
    };

    // Record initial persona establishment
    memory.behaviorHistory.push({
      timestamp: new Date(),
      action: 'persona_initialized',
      context: 'conversation_start',
      emotionalState: persona.emotionalState,
      responsePattern: persona.communicationStyle
    });

    await this.savePersonaMemory(memory);
    logger.info(`Initialized persona ${persona.name} for conversation ${conversationId}`);
    
    return memory;
  }

  async validateResponseConsistency(
    conversationId: string,
    response: string,
    context: string
  ): Promise<{
    isConsistent: boolean;
    violations: ConsistencyViolation[];
    updatedScore: number;
  }> {
    const memory = await this.getPersonaMemory(conversationId);
    
    if (!memory) {
      logger.warn(`No persona memory found for conversation ${conversationId}`);
      return {
        isConsistent: true,
        violations: [],
        updatedScore: 100
      };
    }

    const violations = this.detectConsistencyViolations(response, memory, context);
    const scoreImpact = this.calculateScoreImpact(violations);
    const updatedScore = Math.max(0, memory.consistencyScore - scoreImpact);

    // Record behavior event
    memory.behaviorHistory.push({
      timestamp: new Date(),
      action: 'response_generated',
      context,
      emotionalState: this.detectEmotionalState(response),
      responsePattern: this.detectResponsePattern(response)
    });

    memory.consistencyScore = updatedScore;
    memory.lastUpdated = new Date();

    await this.savePersonaMemory(memory);

    const isConsistent = violations.every(v => v.severity !== 'high') && 
                        updatedScore >= this.MIN_CONSISTENCY_SCORE;

    logger.info(`Consistency validation for conversation ${conversationId}`, {
      isConsistent,
      violationCount: violations.length,
      updatedScore
    });

    return {
      isConsistent,
      violations,
      updatedScore
    };
  }

  private detectConsistencyViolations(
    response: string,
    memory: PersonaMemory,
    _context: string
  ): ConsistencyViolation[] {
    const violations: ConsistencyViolation[] = [];
    const responseLower = response.toLowerCase();
    const traits = memory.traits;

    // Check technical level consistency
    violations.push(...this.checkTechnicalLevelConsistency(responseLower, traits));

    // Check communication style consistency
    violations.push(...this.checkCommunicationStyleConsistency(responseLower, traits));

    // Check emotional state consistency
    violations.push(...this.checkEmotionalStateConsistency(responseLower, traits, memory));

    // Check behavioral pattern consistency
    violations.push(...this.checkBehavioralPatterns(responseLower, memory));

    return violations;
  }

  private checkTechnicalLevelConsistency(
    response: string,
    traits: PersonaTraits
  ): ConsistencyViolation[] {
    const violations: ConsistencyViolation[] = [];

    const technicalTerms = [
      'api', 'ssl', 'tcp/ip', 'dns', 'firewall', 'encryption', 'bandwidth',
      'latency', 'protocol', 'subnet', 'debugging', 'compiler', 'kernel'
    ];

    const basicTerms = [
      'login', 'password', 'click', 'button', 'screen', 'window', 'file',
      'folder', 'icon', 'menu', 'browser', 'email', 'internet'
    ];

    const technicalTermCount = technicalTerms.filter(term => response.includes(term)).length;
    const basicTermCount = basicTerms.filter(term => response.includes(term)).length;

    switch (traits.techLevel) {
      case 'beginner':
        if (technicalTermCount > 2) {
          violations.push({
            type: 'trait_mismatch',
            severity: 'high',
            description: `Beginner persona using too many technical terms (${technicalTermCount})`,
            suggestedCorrection: 'Use simpler language appropriate for beginner technical level'
          });
        }
        break;
      
      case 'intermediate':
        if (technicalTermCount > 5) {
          violations.push({
            type: 'trait_mismatch',
            severity: 'medium',
            description: `Intermediate persona using too many advanced technical terms`,
            suggestedCorrection: 'Balance technical and basic terminology for intermediate level'
          });
        }
        break;
      
      case 'advanced':
        if (basicTermCount > technicalTermCount && response.length > 100) {
          violations.push({
            type: 'trait_mismatch',
            severity: 'medium',
            description: 'Advanced persona not demonstrating sufficient technical knowledge',
            suggestedCorrection: 'Include more technical terminology and concepts'
          });
        }
        break;
    }

    return violations;
  }

  private checkCommunicationStyleConsistency(
    response: string,
    traits: PersonaTraits
  ): ConsistencyViolation[] {
    const violations: ConsistencyViolation[] = [];

    const formalIndicators = [
      'please', 'thank you', 'i would appreciate', 'could you please',
      'i understand', 'i apologize', 'i would like to'
    ];

    const casualIndicators = [
      'yeah', 'ok', 'gonna', 'wanna', 'kinda', 'sorta', 'hey', 'thanks'
    ];

    const technicalIndicators = [
      'specifically', 'precisely', 'configuration', 'implementation',
      'parameters', 'specifications', 'documentation'
    ];

    const formalCount = formalIndicators.filter(ind => response.includes(ind)).length;
    const casualCount = casualIndicators.filter(ind => response.includes(ind)).length;
    const technicalCount = technicalIndicators.filter(ind => response.includes(ind)).length;

    switch (traits.communicationStyle) {
      case 'formal':
        if (casualCount > formalCount) {
          violations.push({
            type: 'trait_mismatch',
            severity: 'medium',
            description: 'Formal persona using too much casual language',
            suggestedCorrection: 'Use more formal language patterns and polite expressions'
          });
        }
        break;
      
      case 'casual':
        if (formalCount > 2 && casualCount === 0) {
          violations.push({
            type: 'trait_mismatch',
            severity: 'medium',
            description: 'Casual persona using overly formal language',
            suggestedCorrection: 'Include more casual expressions and relaxed tone'
          });
        }
        break;
      
      case 'technical':
        if (technicalCount === 0 && response.length > 50) {
          violations.push({
            type: 'trait_mismatch',
            severity: 'medium',
            description: 'Technical persona not using precise technical language',
            suggestedCorrection: 'Include more specific technical terminology'
          });
        }
        break;
    }

    return violations;
  }

  private checkEmotionalStateConsistency(
    response: string,
    traits: PersonaTraits,
    _memory: PersonaMemory
  ): ConsistencyViolation[] {
    const violations: ConsistencyViolation[] = [];

    const currentEmotionalState = this.detectEmotionalState(response);
    const allowedTransitions = this.getAllowedEmotionalTransitions(traits.emotionalState);

    if (!allowedTransitions.includes(currentEmotionalState)) {
      violations.push({
        type: 'emotional_shift',
        severity: 'high',
        description: `Unexpected emotional transition from ${traits.emotionalState} to ${currentEmotionalState}`,
        suggestedCorrection: `Maintain emotional consistency with ${traits.emotionalState} state`
      });
    }

    return violations;
  }

  private checkBehavioralPatterns(
    response: string,
    memory: PersonaMemory
  ): ConsistencyViolation[] {
    const violations: ConsistencyViolation[] = [];

    if (memory.behaviorHistory.length > 3) {
      const recentPatterns = memory.behaviorHistory
        .slice(-3)
        .map(event => event.responsePattern);

      const currentPattern = this.detectResponsePattern(response);
      
      // Check for dramatic pattern changes
      const patternConsistency = recentPatterns.filter(p => p === currentPattern).length;
      
      if (patternConsistency === 0) {
        violations.push({
          type: 'behavior_inconsistency',
          severity: 'low',
          description: 'Response pattern differs significantly from recent behavior',
          suggestedCorrection: 'Maintain consistent behavioral patterns throughout conversation'
        });
      }
    }

    return violations;
  }

  private detectEmotionalState(response: string): string {
    const responseLower = response.toLowerCase();

    if (responseLower.includes('frustrated') || responseLower.includes('annoying') || 
        responseLower.includes('not working') || responseLower.includes('broken')) {
      return 'frustrated';
    }

    if (responseLower.includes('angry') || responseLower.includes('terrible') ||
        responseLower.includes('ridiculous') || responseLower.includes('unacceptable')) {
      return 'angry';
    }

    if (responseLower.includes('confused') || responseLower.includes('don\'t understand') ||
        responseLower.includes('not sure') || responseLower.includes('unclear')) {
      return 'confused';
    }

    if (responseLower.includes('thank') || responseLower.includes('great') ||
        responseLower.includes('perfect') || responseLower.includes('excellent')) {
      return 'calm';
    }

    return 'neutral';
  }

  private detectResponsePattern(response: string): string {
    const responseLower = response.toLowerCase();

    if (responseLower.includes('?')) {
      return 'questioning';
    }

    if (responseLower.includes('i tried') || responseLower.includes('i already')) {
      return 'reporting_attempts';
    }

    if (responseLower.includes('let me') || responseLower.includes('i\'ll try')) {
      return 'cooperative';
    }

    if (responseLower.includes('but') || responseLower.includes('however')) {
      return 'resistant';
    }

    return 'informative';
  }

  private getAllowedEmotionalTransitions(currentState: string): string[] {
    const transitions: Record<string, string[]> = {
      'calm': ['calm', 'confused', 'frustrated'],
      'confused': ['confused', 'calm', 'frustrated'],
      'frustrated': ['frustrated', 'angry', 'calm'],
      'angry': ['angry', 'frustrated', 'calm']
    };

    return transitions[currentState] || ['neutral'];
  }

  private calculateScoreImpact(violations: ConsistencyViolation[]): number {
    let impact = 0;
    
    for (const violation of violations) {
      switch (violation.severity) {
        case 'high':
          impact += 15;
          break;
        case 'medium':
          impact += 8;
          break;
        case 'low':
          impact += 3;
          break;
      }
    }

    return impact;
  }

  private async savePersonaMemory(memory: PersonaMemory): Promise<void> {
    try {
      const memoryKey = this.getMemoryKey(memory.conversationId);
      await this.redis.setEx(
        memoryKey,
        this.MEMORY_TTL,
        JSON.stringify(memory)
      );
    } catch (error) {
      logger.error(`Failed to save persona memory for conversation ${memory.conversationId}:`, error);
    }
  }

  private getMemoryKey(conversationId: string): string {
    return `persona:${conversationId}:memory`;
  }

  async getPersonaAnalytics(conversationId: string): Promise<{
    averageConsistencyScore: number;
    violationFrequency: Record<string, number>;
    behaviorTrends: string[];
    recommendations: string[];
  }> {
    const memory = await this.getPersonaMemory(conversationId);
    
    if (!memory) {
      return {
        averageConsistencyScore: 0,
        violationFrequency: {},
        behaviorTrends: [],
        recommendations: []
      };
    }

    // Analyze behavior patterns
    const patterns = memory.behaviorHistory.map(event => event.responsePattern);
    const patternCounts = patterns.reduce((acc, pattern) => {
      acc[pattern] = (acc[pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recommendations = this.generatePersonaRecommendations(memory);

    return {
      averageConsistencyScore: memory.consistencyScore,
      violationFrequency: patternCounts,
      behaviorTrends: Object.keys(patternCounts).sort((a, b) => patternCounts[b] - patternCounts[a]),
      recommendations
    };
  }

  private generatePersonaRecommendations(memory: PersonaMemory): string[] {
    const recommendations: string[] = [];

    if (memory.consistencyScore < 80) {
      recommendations.push('Focus on maintaining character traits throughout conversation');
    }

    if (memory.behaviorHistory.length > 5) {
      const emotionalStates = memory.behaviorHistory.map(e => e.emotionalState);
      const uniqueStates = new Set(emotionalStates);
      
      if (uniqueStates.size > 3) {
        recommendations.push('Reduce emotional state variations for better consistency');
      }
    }

    const recentPatterns = memory.behaviorHistory.slice(-3).map(e => e.responsePattern);
    if (new Set(recentPatterns).size === recentPatterns.length) {
      recommendations.push('Maintain more consistent response patterns');
    }

    return recommendations;
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('PersonaManager Redis connection closed');
    } catch (error) {
      logger.error('Error closing PersonaManager Redis connection:', error);
    }
  }
}

export const personaManager = new PersonaManager();
export default personaManager;