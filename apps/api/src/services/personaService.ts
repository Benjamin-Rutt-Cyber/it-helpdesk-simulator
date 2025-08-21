import { getPersonaById, EmotionalState } from '../config/personas';
import { PersonaState, PersonaStateManager, PersonaInsights } from '../models/PersonaState';
import { PersonaMemory, PersonaMemoryManager } from '../models/PersonaMemory';
import { personaSelector, SelectionContext, SelectionResult } from './personaSelector';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export interface PersonaSession {
  sessionId: string;
  personaId: string;
  userId: string;
  state: PersonaState;
  memory: PersonaMemory;
  conversationContext: ConversationContext;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface ConversationContext {
  ticketId?: string;
  ticketType: string;
  ticketCategory: string;
  scenarioId?: string;
  learningObjectives: string[];
  expectedDuration: number;
  complexity: 'simple' | 'moderate' | 'complex';
  businessContext: BusinessContext;
}

export interface BusinessContext {
  department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  affectedUsers: number;
  deadlineConstraints: boolean;
  escalationPath: string[];
}

export interface PersonaInteraction {
  sessionId: string;
  timestamp: Date;
  userMessage: string;
  personaResponse: string;
  interactionType: 'greeting' | 'problem_statement' | 'troubleshooting' | 'resolution' | 'escalation';
  moodChange?: {
    from: string;
    to: string;
    trigger: string;
  };
  learningMoments: LearningMoment[];
  responseMetrics: ResponseMetrics;
}

export interface LearningMoment {
  type: 'concept_learned' | 'skill_demonstrated' | 'mistake_corrected' | 'breakthrough_achieved';
  description: string;
  impact: 'low' | 'medium' | 'high';
  area: string;
}

export interface ResponseMetrics {
  responseTime: number;
  appropriateness: number; // 0-100
  consistency: number; // 0-100
  naturalness: number; // 0-100
  learningValue: number; // 0-100
}

export interface PersonaAnalytics {
  sessionId: string;
  personaId: string;
  overallPerformance: number;
  learningEffectiveness: number;
  engagementLevel: number;
  satisfactionTrend: number;
  skillDevelopment: SkillDevelopment[];
  behaviorPatterns: BehaviorPattern[];
  recommendations: string[];
}

export interface SkillDevelopment {
  skill: string;
  initialLevel: number;
  currentLevel: number;
  progress: number;
  practiceTime: number;
  successRate: number;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  effectiveness: number;
  context: string[];
  improvement_suggestions: string[];
}

class PersonaService {
  private redis: RedisClientType;
  private activeSessions: Map<string, PersonaSession> = new Map();
  private readonly SESSION_TTL = 3600; // 1 hour

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.redis.on('error', (err) => {
      logger.error('PersonaService Redis connection error:', err);
    });

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      await this.redis.connect();
      logger.info('PersonaService Redis client connected');
    } catch (error) {
      logger.error('Failed to connect to Redis for persona service:', error);
      throw error;
    }
  }

  async startPersonaSession(
    sessionId: string,
    userId: string,
    context: ConversationContext,
    selectionContext?: SelectionContext
  ): Promise<PersonaSession> {
    logger.info(`Starting persona session ${sessionId} for user ${userId}`);

    // Select appropriate persona
    const selection = await this.selectPersonaForSession(context, selectionContext);
    const persona = selection.selectedPersona;

    // Load or create persona memory
    const memory = await this.loadOrCreatePersonaMemory(persona.id, userId);

    // Create initial persona state
    const state = PersonaStateManager.createInitialState(sessionId, persona);

    // Apply contextual modifications to state
    this.applyContextualModifications(state, context, memory);

    // Create persona session
    const session: PersonaSession = {
      sessionId,
      personaId: persona.id,
      userId,
      state,
      memory,
      conversationContext: context,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    // Store session
    await this.savePersonaSession(session);
    this.activeSessions.set(sessionId, session);

    logger.info(`Persona session started with ${persona.name} (${persona.id})`);
    return session;
  }

  async processInteraction(
    sessionId: string,
    userMessage: string,
    userAction?: string
  ): Promise<{
    response: string;
    stateUpdate: PersonaState;
    insights: PersonaInsights;
    learningMoments: LearningMoment[];
  }> {
    const session = await this.getPersonaSession(sessionId);
    if (!session) {
      throw new Error(`Persona session ${sessionId} not found`);
    }

    logger.info(`Processing interaction for session ${sessionId}`);

    // Analyze user message for mood triggers and learning opportunities
    const analysis = this.analyzeUserMessage(userMessage, session);

    // Update persona state based on interaction
    const stateUpdate = this.updatePersonaState(session, userMessage, analysis, userAction);

    // Generate persona-appropriate response
    const response = await this.generatePersonaResponse(session, userMessage, stateUpdate);

    // Update memory with interaction
    this.updatePersonaMemory(session, userMessage, response, analysis.learningMoments);

    // Record interaction
    const interaction: PersonaInteraction = {
      sessionId,
      timestamp: new Date(),
      userMessage,
      personaResponse: response,
      interactionType: this.determineInteractionType(userMessage, session),
      moodChange: analysis.moodChange,
      learningMoments: analysis.learningMoments,
      responseMetrics: this.calculateResponseMetrics(response, session)
    };

    await this.recordInteraction(interaction);

    // Update session
    session.state = stateUpdate;
    session.lastActivity = new Date();
    await this.savePersonaSession(session);

    // Generate insights
    const insights = PersonaStateManager.getPersonaInsights(stateUpdate);

    return {
      response,
      stateUpdate,
      insights,
      learningMoments: analysis.learningMoments
    };
  }

  async endPersonaSession(sessionId: string, resolved: boolean = false): Promise<PersonaAnalytics> {
    logger.info(`Ending persona session ${sessionId}`);

    const session = await this.getPersonaSession(sessionId);
    if (!session) {
      throw new Error(`Persona session ${sessionId} not found`);
    }

    // Mark issue as resolved/unresolved
    const finalState = PersonaStateManager.resolveIssue(session.state, resolved);
    session.state = finalState;
    session.isActive = false;

    // Generate session analytics
    const analytics = await this.generateSessionAnalytics(session);

    // Update persona memory with session completion
    await this.finalizePersonaMemory(session, analytics);

    // Save final state
    await this.savePersonaSession(session);

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    logger.info(`Persona session ${sessionId} ended with resolution: ${resolved}`);
    return analytics;
  }

  async getPersonaSession(sessionId: string): Promise<PersonaSession | null> {
    // Try active sessions first
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId)!;
    }

    // Load from Redis
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const sessionData = await this.redis.get(sessionKey);
      
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData) as PersonaSession;
      
      // Convert date strings back to Date objects
      session.startTime = new Date(session.startTime);
      session.lastActivity = new Date(session.lastActivity);
      session.state.lastUpdated = new Date(session.state.lastUpdated);
      session.memory.lastUpdated = new Date(session.memory.lastUpdated);

      return session;
    } catch (error) {
      logger.error(`Failed to load persona session ${sessionId}:`, error);
      return null;
    }
  }

  async getPersonaMemory(personaId: string, userId: string): Promise<PersonaMemory | null> {
    try {
      const memoryKey = this.getMemoryKey(personaId, userId);
      const memoryData = await this.redis.get(memoryKey);
      
      if (!memoryData) {
        return null;
      }

      return JSON.parse(memoryData) as PersonaMemory;
    } catch (error) {
      logger.error(`Failed to load persona memory for ${personaId}-${userId}:`, error);
      return null;
    }
  }

  async getPersonaAnalytics(sessionId: string): Promise<PersonaAnalytics | null> {
    const session = await this.getPersonaSession(sessionId);
    if (!session) {
      return null;
    }

    return this.generateSessionAnalytics(session);
  }

  // Private helper methods
  private async selectPersonaForSession(
    context: ConversationContext,
    selectionContext?: SelectionContext
  ): Promise<SelectionResult> {
    const fullContext: SelectionContext = {
      ticketType: context.ticketType,
      ticketCategory: context.ticketCategory,
      ticketPriority: context.businessContext.priority,
      complexityLevel: context.complexity,
      learningObjectives: context.learningObjectives,
      expectedDuration: context.expectedDuration,
      scenarioType: context.scenarioId,
      ...selectionContext
    };

    return personaSelector.selectPersona(fullContext);
  }

  private async loadOrCreatePersonaMemory(personaId: string, userId: string): Promise<PersonaMemory> {
    const existing = await this.getPersonaMemory(personaId, userId);
    
    if (existing) {
      return existing;
    }

    const newMemory = PersonaMemoryManager.createInitialMemory(personaId, userId);
    await this.savePersonaMemory(newMemory);
    return newMemory;
  }

  private applyContextualModifications(
    state: PersonaState,
    context: ConversationContext,
    memory: PersonaMemory
  ): void {
    // Apply urgency modifications
    if (context.businessContext.priority === 'critical') {
      state.frustrationLevel = Math.min(10, state.frustrationLevel + 2);
      state.contextualFactors.urgency = 'critical';
      state.contextualFactors.businessImpact = context.businessContext.businessImpact;
    }

    // Apply memory-based modifications
    if (memory.totalInteractions > 5) {
      state.trustLevel = Math.min(10, state.trustLevel + 1);
      state.behavioralModifiers.hasReceivedGoodService = true;
    }

    // Apply time-based modifications
    const hour = new Date().getHours();
    if (hour < 9 || hour > 17) {
      state.contextualFactors.timeOfDay = hour < 9 ? 'morning' : 'evening';
      if (state.personaId === 'executive') {
        state.frustrationLevel = Math.min(10, state.frustrationLevel + 1);
      }
    }
  }

  private analyzeUserMessage(userMessage: string, session: PersonaSession): {
    moodChange?: { from: string; to: string; trigger: string };
    learningMoments: LearningMoment[];
    triggers: string[];
  } {
    const analysis = {
      learningMoments: [] as LearningMoment[],
      triggers: [] as string[]
    };

    const message = userMessage.toLowerCase();
    const persona = getPersonaById(session.personaId)!;

    // Check for positive triggers
    persona.personality.emotionalRange.positive_triggers.forEach(trigger => {
      if (message.includes(trigger.toLowerCase())) {
        analysis.triggers.push(`positive:${trigger}`);
      }
    });

    // Check for negative triggers
    persona.personality.emotionalRange.negative_triggers.forEach(trigger => {
      if (message.includes(trigger.toLowerCase())) {
        analysis.triggers.push(`negative:${trigger}`);
      }
    });

    // Detect learning moments
    if (message.includes('understand') || message.includes('got it') || message.includes('i see')) {
      analysis.learningMoments.push({
        type: 'concept_learned',
        description: 'Customer demonstrated understanding',
        impact: 'medium',
        area: session.conversationContext.ticketType
      });
    }

    if (message.includes('thank') || message.includes('helpful') || message.includes('great')) {
      analysis.learningMoments.push({
        type: 'skill_demonstrated',
        description: 'Effective customer service delivery',
        impact: 'high',
        area: 'customer_satisfaction'
      });
    }

    return analysis;
  }

  private updatePersonaState(
    session: PersonaSession,
    userMessage: string,
    analysis: { moodChange?: any; learningMoments: LearningMoment[]; triggers: string[] },
    userAction?: string
  ): PersonaState {
    let state = { ...session.state };

    // Increment interaction count
    state = PersonaStateManager.incrementInteraction(state);

    // Apply mood changes based on triggers
    analysis.triggers.forEach((trigger: string) => {
      const [type, content] = trigger.split(':');
      
      if (type === 'positive') {
        const newMood = this.calculateNewMood(state.currentMood, 'positive');
        state = PersonaStateManager.updateMood(
          state,
          newMood,
          content,
          'positive',
          userMessage,
          userAction
        );
      } else if (type === 'negative') {
        const newMood = this.calculateNewMood(state.currentMood, 'negative');
        state = PersonaStateManager.updateMood(
          state,
          newMood,
          content,
          'negative',
          userMessage,
          userAction
        );
      }
    });

    return state;
  }

  private calculateNewMood(currentMood: string, direction: 'positive' | 'negative'): EmotionalState {
    const moodScale = ['angry', 'frustrated', 'impatient', 'concerned', 'neutral', 'calm', 'pleased', 'grateful'];
    const currentIndex = moodScale.indexOf(currentMood);
    
    if (direction === 'positive') {
      return moodScale[Math.min(moodScale.length - 1, currentIndex + 1)] as EmotionalState;
    } else {
      return moodScale[Math.max(0, currentIndex - 1)] as EmotionalState;
    }
  }

  private async generatePersonaResponse(
    session: PersonaSession,
    userMessage: string,
    state: PersonaState
  ): Promise<string> {
    // This would integrate with the AI service to generate persona-appropriate responses
    // For now, returning a placeholder that demonstrates persona characteristics
    
    const greeting = PersonaMemoryManager.getPersonalizedGreeting(session.memory);
    
    // This is a simplified response - in production, this would use the AI service
    // with persona-specific prompts and the current state
    
    return `${greeting} I'm experiencing ${session.conversationContext.ticketType} and feeling ${state.currentMood}.`;
  }

  private updatePersonaMemory(
    session: PersonaSession,
    userMessage: string,
    response: string,
    learningMoments: LearningMoment[]
  ): void {
    // Add learning achievements to memory
    learningMoments.forEach(moment => {
      if (moment.type === 'concept_learned') {
        PersonaMemoryManager.updateTechnicalUnderstanding(
          session.memory,
          moment.area,
          'basic',
          true
        );
      }
    });

    // Record key moments
    if (learningMoments.length > 0) {
      PersonaMemoryManager.recordKeyMoment(
        session.memory,
        'learning',
        `Learning progress in ${learningMoments[0].area}`,
        'medium',
        userMessage
      );
    }
  }

  private determineInteractionType(message: string, session: PersonaSession): PersonaInteraction['interactionType'] {
    const msg = message.toLowerCase();
    
    if (session.state.interactionCount === 1) return 'greeting';
    if (msg.includes('problem') || msg.includes('issue') || msg.includes('not working')) return 'problem_statement';
    if (msg.includes('try') || msg.includes('check') || msg.includes('test')) return 'troubleshooting';
    if (msg.includes('escalate') || msg.includes('manager') || msg.includes('supervisor')) return 'escalation';
    if (msg.includes('fixed') || msg.includes('working') || msg.includes('resolved')) return 'resolution';
    
    return 'troubleshooting';
  }

  private calculateResponseMetrics(_response: string, _session: PersonaSession): ResponseMetrics {
    // Simplified metrics calculation
    return {
      responseTime: 1200, // Would be actual response time
      appropriateness: 85,
      consistency: 90,
      naturalness: 88,
      learningValue: 80
    };
  }

  private async recordInteraction(interaction: PersonaInteraction): Promise<void> {
    try {
      const interactionKey = `interaction:${interaction.sessionId}:${interaction.timestamp.getTime()}`;
      await this.redis.setEx(interactionKey, this.SESSION_TTL, JSON.stringify(interaction));
    } catch (error) {
      logger.error('Failed to record interaction:', error);
    }
  }

  private async generateSessionAnalytics(session: PersonaSession): Promise<PersonaAnalytics> {
    const memoryInsights = PersonaMemoryManager.getMemoryInsights(session.memory);
    const stateInsights = PersonaStateManager.getPersonaInsights(session.state);

    return {
      sessionId: session.sessionId,
      personaId: session.personaId,
      overallPerformance: (stateInsights.overallSatisfaction + memoryInsights.satisfactionTrend) / 2,
      learningEffectiveness: memoryInsights.learningProgress,
      engagementLevel: stateInsights.engagementQuality,
      satisfactionTrend: memoryInsights.satisfactionTrend,
      skillDevelopment: this.calculateSkillDevelopment(session),
      behaviorPatterns: this.analyzeBehaviorPatterns(session),
      recommendations: [...stateInsights.recommendedActions, ...memoryInsights.recommendedApproaches]
    };
  }

  private calculateSkillDevelopment(session: PersonaSession): SkillDevelopment[] {
    // Simplified skill development calculation
    return [
      {
        skill: 'empathy',
        initialLevel: 60,
        currentLevel: session.state.satisfactionLevel * 10,
        progress: session.state.satisfactionLevel - 6,
        practiceTime: session.state.timeInSession,
        successRate: session.state.satisfactionLevel > 6 ? 85 : 65
      }
    ];
  }

  private analyzeBehaviorPatterns(session: PersonaSession): BehaviorPattern[] {
    // Simplified behavior pattern analysis
    return [
      {
        pattern: 'active_listening',
        frequency: session.state.interactionCount,
        effectiveness: session.state.engagementLevel * 10,
        context: [session.conversationContext.ticketType],
        improvement_suggestions: session.state.satisfactionLevel < 7 ? ['Show more empathy', 'Ask clarifying questions'] : []
      }
    ];
  }

  private async finalizePersonaMemory(session: PersonaSession, analytics: PersonaAnalytics): Promise<void> {
    // Add session to memory history
    const sessionMemory = {
      sessionId: session.sessionId,
      timestamp: session.startTime,
      duration: Math.round((session.lastActivity.getTime() - session.startTime.getTime()) / 60000), // minutes
      issueType: session.conversationContext.ticketType,
      issueResolved: session.state.issueResolved,
      satisfactionLevel: session.state.satisfactionLevel,
      keyMoments: [], // Would be populated from interaction history
      learningAchievements: [], // Would be populated from analytics
      personalDetails: [],
      technicalConcepts: [],
      resolutionMethod: session.state.issueResolved ? 'resolved' : 'unresolved',
      followUpNeeded: !session.state.issueResolved,
      notes: `Session completed with ${analytics.overallPerformance}% performance`
    };

    PersonaMemoryManager.addSessionMemory(session.memory, sessionMemory);
    await this.savePersonaMemory(session.memory);
  }

  private async savePersonaSession(session: PersonaSession): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(session.sessionId);
      await this.redis.setEx(sessionKey, this.SESSION_TTL, JSON.stringify(session));
    } catch (error) {
      logger.error(`Failed to save persona session ${session.sessionId}:`, error);
    }
  }

  private async savePersonaMemory(memory: PersonaMemory): Promise<void> {
    try {
      const memoryKey = this.getMemoryKey(memory.personaId, memory.userId);
      await this.redis.setEx(memoryKey, this.SESSION_TTL * 24, JSON.stringify(memory)); // 24-hour TTL for memory
    } catch (error) {
      logger.error(`Failed to save persona memory for ${memory.personaId}-${memory.userId}:`, error);
    }
  }

  private getSessionKey(sessionId: string): string {
    return `persona_session:${sessionId}`;
  }

  private getMemoryKey(personaId: string, userId: string): string {
    return `persona_memory:${personaId}:${userId}`;
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('PersonaService Redis connection closed');
    } catch (error) {
      logger.error('Error closing PersonaService Redis connection:', error);
    }
  }
}

// Export class for testing flexibility
export { PersonaService };

// Create singleton instance
let _personaServiceInstance: PersonaService | null = null;

export const getPersonaService = (): PersonaService => {
  if (!_personaServiceInstance) {
    _personaServiceInstance = new PersonaService();
  }
  return _personaServiceInstance;
};

// For non-test usage, use getPersonaService() to get the singleton
export default getPersonaService;