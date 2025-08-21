import { EmotionalState, CustomerPersona } from '../config/personas';

export interface PersonaState {
  sessionId: string;
  personaId: string;
  currentMood: EmotionalState;
  moodHistory: MoodEvent[];
  conversationPhase: ConversationPhase;
  satisfactionLevel: number; // 0-10 scale
  frustrationLevel: number; // 0-10 scale
  trustLevel: number; // 0-10 scale
  engagementLevel: number; // 0-10 scale
  technicalConfidence: number; // 0-10 scale
  timeInSession: number; // seconds
  interactionCount: number;
  issueResolved: boolean;
  escalationRequested: boolean;
  lastUpdated: Date;
  contextualFactors: ContextualFactors;
  behavioralModifiers: BehavioralModifiers;
}

export interface MoodEvent {
  timestamp: Date;
  previousMood: EmotionalState;
  newMood: EmotionalState;
  trigger: string;
  triggerType: 'positive' | 'negative' | 'neutral';
  intensity: number; // 1-5 scale
  context: string;
  userAction?: string;
  systemResponse?: string;
}

export type ConversationPhase = 
  | 'greeting' 
  | 'problem_description' 
  | 'troubleshooting' 
  | 'solution_implementation' 
  | 'verification' 
  | 'resolution' 
  | 'follow_up' 
  | 'escalation';

export interface ContextualFactors {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'weekday' | 'weekend';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  previousSessionToday: boolean;
  multipleIssues: boolean;
  externalPressure: boolean;
  hasDeadline: boolean;
  workingFromHome: boolean;
  deviceType: 'desktop' | 'laptop' | 'mobile' | 'tablet';
}

export interface BehavioralModifiers {
  hasBeenWaiting: boolean;
  waitingTime: number; // minutes
  hasBeenTransferred: boolean;
  transferCount: number;
  hasRepeatedIssue: boolean;
  previousNegativeExperience: boolean;
  hasReceivedGoodService: boolean;
  isLearningMode: boolean;
  needsExtraPatience: boolean;
  prefersDetailedExplanations: boolean;
  wantsQuickFix: boolean;
  isMultitasking: boolean;
}

export class PersonaStateManager {
  static createInitialState(sessionId: string, persona: CustomerPersona): PersonaState {
    const now = new Date();
    
    return {
      sessionId,
      personaId: persona.id,
      currentMood: persona.personality.emotionalRange.baseline,
      moodHistory: [],
      conversationPhase: 'greeting',
      satisfactionLevel: 5, // Start neutral
      frustrationLevel: this.getInitialFrustrationLevel(persona),
      trustLevel: 5, // Start neutral
      engagementLevel: 6, // Slightly positive as they're seeking help
      technicalConfidence: this.getInitialTechnicalConfidence(persona),
      timeInSession: 0,
      interactionCount: 0,
      issueResolved: false,
      escalationRequested: false,
      lastUpdated: now,
      contextualFactors: this.generateContextualFactors(now),
      behavioralModifiers: this.getInitialBehavioralModifiers(persona)
    };
  }

  static updateMood(
    state: PersonaState, 
    newMood: EmotionalState, 
    trigger: string, 
    triggerType: 'positive' | 'negative' | 'neutral',
    context: string,
    userAction?: string,
    systemResponse?: string
  ): PersonaState {
    const moodEvent: MoodEvent = {
      timestamp: new Date(),
      previousMood: state.currentMood,
      newMood,
      trigger,
      triggerType,
      intensity: this.calculateMoodIntensity(state.currentMood, newMood),
      context,
      userAction,
      systemResponse
    };

    // Update related metrics based on mood change
    const satisfactionChange = this.calculateSatisfactionChange(triggerType, moodEvent.intensity);
    const frustrationChange = this.calculateFrustrationChange(triggerType, moodEvent.intensity);
    const trustChange = this.calculateTrustChange(triggerType, moodEvent.intensity);

    return {
      ...state,
      currentMood: newMood,
      moodHistory: [...state.moodHistory, moodEvent],
      satisfactionLevel: Math.max(0, Math.min(10, state.satisfactionLevel + satisfactionChange)),
      frustrationLevel: Math.max(0, Math.min(10, state.frustrationLevel + frustrationChange)),
      trustLevel: Math.max(0, Math.min(10, state.trustLevel + trustChange)),
      lastUpdated: new Date()
    };
  }

  static updateConversationPhase(state: PersonaState, phase: ConversationPhase): PersonaState {
    return {
      ...state,
      conversationPhase: phase,
      lastUpdated: new Date()
    };
  }

  static incrementInteraction(state: PersonaState): PersonaState {
    return {
      ...state,
      interactionCount: state.interactionCount + 1,
      timeInSession: state.timeInSession + this.getEstimatedResponseTime(state),
      lastUpdated: new Date()
    };
  }

  static updateBehavioralModifiers(
    state: PersonaState, 
    modifiers: Partial<BehavioralModifiers>
  ): PersonaState {
    return {
      ...state,
      behavioralModifiers: {
        ...state.behavioralModifiers,
        ...modifiers
      },
      lastUpdated: new Date()
    };
  }

  static resolveIssue(state: PersonaState, resolved: boolean): PersonaState {
    const satisfactionBoost = resolved ? 2 : -1;
    const frustrationChange = resolved ? -3 : 1;
    
    return {
      ...state,
      issueResolved: resolved,
      satisfactionLevel: Math.max(0, Math.min(10, state.satisfactionLevel + satisfactionBoost)),
      frustrationLevel: Math.max(0, Math.min(10, state.frustrationLevel + frustrationChange)),
      conversationPhase: resolved ? 'resolution' : 'escalation',
      lastUpdated: new Date()
    };
  }

  static requestEscalation(state: PersonaState, _reason: string): PersonaState {
    return {
      ...state,
      escalationRequested: true,
      conversationPhase: 'escalation',
      frustrationLevel: Math.min(10, state.frustrationLevel + 1),
      trustLevel: Math.max(0, state.trustLevel - 1),
      lastUpdated: new Date()
    };
  }

  // Helper methods
  private static getInitialFrustrationLevel(persona: CustomerPersona): number {
    switch (persona.personality.emotionalRange.baseline) {
      case 'frustrated': return 6;
      case 'angry': return 8;
      case 'concerned': return 4;
      case 'impatient': return 5;
      default: return 2;
    }
  }

  private static getInitialTechnicalConfidence(persona: CustomerPersona): number {
    switch (persona.personality.technicalLevel.level) {
      case 'novice': return 2;
      case 'intermediate': return 5;
      case 'advanced': return 8;
      default: return 5;
    }
  }

  private static generateContextualFactors(timestamp: Date): ContextualFactors {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    return {
      timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night',
      dayOfWeek: dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday',
      urgency: 'medium', // Default, will be updated based on issue
      businessImpact: 'minimal', // Default, will be updated
      previousSessionToday: false,
      multipleIssues: false,
      externalPressure: false,
      hasDeadline: false,
      workingFromHome: Math.random() > 0.6, // 40% work from home
      deviceType: ['desktop', 'laptop', 'mobile', 'tablet'][Math.floor(Math.random() * 4)] as any
    };
  }

  private static getInitialBehavioralModifiers(persona: CustomerPersona): BehavioralModifiers {
    return {
      hasBeenWaiting: false,
      waitingTime: 0,
      hasBeenTransferred: false,
      transferCount: 0,
      hasRepeatedIssue: false,
      previousNegativeExperience: Math.random() < 0.1, // 10% chance
      hasReceivedGoodService: Math.random() < 0.2, // 20% chance
      isLearningMode: persona.personality.curiosity === 'high' || persona.personality.curiosity === 'very_high',
      needsExtraPatience: persona.personality.technicalLevel.level === 'novice',
      prefersDetailedExplanations: persona.personality.communication.verbosity === 'verbose',
      wantsQuickFix: persona.personality.patience === 'low' || persona.personality.patience === 'very_low',
      isMultitasking: persona.behavioral_patterns.multitasking_tendency
    };
  }

  private static calculateMoodIntensity(oldMood: EmotionalState, newMood: EmotionalState): number {
    const moodValues: Record<EmotionalState, number> = {
      angry: 1,
      frustrated: 2,
      impatient: 3,
      concerned: 4,
      neutral: 5,
      calm: 6,
      pleased: 7,
      grateful: 8,
      confused: 3 // Confusion is generally negative
    };

    const oldValue = moodValues[oldMood] || 5;
    const newValue = moodValues[newMood] || 5;
    
    return Math.abs(newValue - oldValue);
  }

  private static calculateSatisfactionChange(triggerType: 'positive' | 'negative' | 'neutral', intensity: number): number {
    switch (triggerType) {
      case 'positive': return intensity * 0.5;
      case 'negative': return -(intensity * 0.7);
      case 'neutral': return 0;
    }
  }

  private static calculateFrustrationChange(triggerType: 'positive' | 'negative' | 'neutral', intensity: number): number {
    switch (triggerType) {
      case 'positive': return -(intensity * 0.8);
      case 'negative': return intensity * 0.6;
      case 'neutral': return 0;
    }
  }

  private static calculateTrustChange(triggerType: 'positive' | 'negative' | 'neutral', intensity: number): number {
    switch (triggerType) {
      case 'positive': return intensity * 0.3;
      case 'negative': return -(intensity * 0.4);
      case 'neutral': return 0;
    }
  }

  private static getEstimatedResponseTime(state: PersonaState): number {
    // Estimated time for user to respond based on personality and current state
    const baseTime = 30; // 30 seconds base
    const frustrationMultiplier = state.frustrationLevel > 5 ? 0.7 : 1.2; // Frustrated users respond faster
    const engagementMultiplier = state.engagementLevel / 10;
    
    return Math.round(baseTime * frustrationMultiplier * engagementMultiplier);
  }

  // Analytics and insights
  static getPersonaInsights(state: PersonaState): PersonaInsights {
    return {
      overallSatisfaction: this.calculateOverallSatisfaction(state),
      escalationRisk: this.calculateEscalationRisk(state),
      engagementQuality: this.calculateEngagementQuality(state),
      learningProgress: this.calculateLearningProgress(state),
      relationshipStrength: this.calculateRelationshipStrength(state),
      recommendedActions: this.getRecommendedActions(state)
    };
  }

  private static calculateOverallSatisfaction(state: PersonaState): number {
    const weights = {
      satisfaction: 0.4,
      frustration: 0.3, // Inverted
      trust: 0.2,
      engagement: 0.1
    };

    return (
      state.satisfactionLevel * weights.satisfaction +
      (10 - state.frustrationLevel) * weights.frustration +
      state.trustLevel * weights.trust +
      state.engagementLevel * weights.engagement
    );
  }

  private static calculateEscalationRisk(state: PersonaState): number {
    if (state.escalationRequested) return 10;
    
    const riskFactors = [
      state.frustrationLevel * 0.3,
      (10 - state.satisfactionLevel) * 0.2,
      (10 - state.trustLevel) * 0.2,
      state.behavioralModifiers.transferCount * 2,
      state.behavioralModifiers.waitingTime * 0.1,
      state.timeInSession > 600 ? 2 : 0 // 10+ minutes
    ];

    return Math.min(10, riskFactors.reduce((sum, factor) => sum + factor, 0));
  }

  private static calculateEngagementQuality(state: PersonaState): number {
    return (state.engagementLevel + state.trustLevel + (10 - state.frustrationLevel)) / 3;
  }

  private static calculateLearningProgress(state: PersonaState): number {
    if (!state.behavioralModifiers.isLearningMode) return 0;
    
    return Math.min(10, (state.technicalConfidence + state.interactionCount * 0.5));
  }

  private static calculateRelationshipStrength(state: PersonaState): number {
    return (state.trustLevel + state.satisfactionLevel + state.engagementLevel) / 3;
  }

  private static getRecommendedActions(state: PersonaState): string[] {
    const actions: string[] = [];

    if (state.frustrationLevel > 6) {
      actions.push('show_empathy');
      actions.push('provide_immediate_help');
    }

    if (state.trustLevel < 4) {
      actions.push('build_credibility');
      actions.push('demonstrate_expertise');
    }

    if (state.behavioralModifiers.needsExtraPatience) {
      actions.push('slow_down_explanations');
      actions.push('check_understanding');
    }

    if (state.engagementLevel < 4) {
      actions.push('re_engage_customer');
      actions.push('simplify_approach');
    }

    if (this.calculateEscalationRisk(state) > 7) {
      actions.push('consider_escalation');
      actions.push('involve_supervisor');
    }

    return actions;
  }
}

export interface PersonaInsights {
  overallSatisfaction: number;
  escalationRisk: number;
  engagementQuality: number;
  learningProgress: number;
  relationshipStrength: number;
  recommendedActions: string[];
}

export default PersonaState;