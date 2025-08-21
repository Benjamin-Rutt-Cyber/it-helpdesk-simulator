// Imported for type definitions
// import { CustomerPersona } from '../config/personas';

export interface PersonaMemory {
  personaId: string;
  userId: string;
  sessionHistory: SessionMemory[];
  relationshipData: RelationshipData;
  preferenceData: PreferenceData;
  knowledgeState: KnowledgeState;
  interactionPatterns: InteractionPatterns;
  continuityMarkers: ContinuityMarkers;
  lastUpdated: Date;
  totalInteractions: number;
  memoryVersion: string;
}

export interface SessionMemory {
  sessionId: string;
  timestamp: Date;
  duration: number; // minutes
  issueType: string;
  issueResolved: boolean;
  satisfactionLevel: number;
  keyMoments: KeyMoment[];
  learningAchievements: string[];
  personalDetails: PersonalDetail[];
  technicalConcepts: TechnicalConcept[];
  resolutionMethod: string;
  followUpNeeded: boolean;
  notes: string;
}

export interface KeyMoment {
  timestamp: Date;
  type: 'positive' | 'negative' | 'learning' | 'breakthrough' | 'frustration' | 'appreciation';
  description: string;
  impact: 'low' | 'medium' | 'high';
  context: string;
  userAction?: string;
  systemResponse?: string;
  emotionalState: string;
}

export interface PersonalDetail {
  category: 'name' | 'role' | 'department' | 'location' | 'preference' | 'context';
  detail: string;
  confidence: number; // 0-1 scale
  firstMentioned: Date;
  lastReferenced: Date;
  frequency: number;
  relevance: 'high' | 'medium' | 'low';
}

export interface TechnicalConcept {
  concept: string;
  understanding_level: 'none' | 'basic' | 'intermediate' | 'advanced';
  confidence: number;
  confusion_points: string[];
  successful_explanations: string[];
  learning_progress: number; // 0-100%
  last_discussed: Date;
  needs_reinforcement: boolean;
}

export interface RelationshipData {
  trustLevel: number; // 0-10
  comfortLevel: number; // 0-10
  communicationStyle: 'formal' | 'casual' | 'professional' | 'friendly';
  preferredPace: 'slow' | 'moderate' | 'fast';
  responseToHumor: 'positive' | 'neutral' | 'negative';
  appreciationStyle: 'verbal' | 'practical' | 'detailed' | 'brief';
  escalationTendency: number; // 0-10
  learningMotivation: number; // 0-10
  relationshipBuilding: boolean;
  remembersNames: boolean;
  sharesPersonalInfo: boolean;
}

export interface PreferenceData {
  communicationChannels: string[];
  explanationStyle: 'detailed' | 'brief' | 'visual' | 'hands_on';
  documentationUsage: 'always' | 'sometimes' | 'rarely' | 'never';
  followUpPreference: 'immediate' | 'scheduled' | 'none';
  problemSolvingApproach: 'independent' | 'guided' | 'collaborative';
  feedbackStyle: 'direct' | 'gentle' | 'detailed' | 'summary';
  timePreferences: TimePreferences;
  technicalDepth: 'high_level' | 'moderate' | 'detailed';
}

export interface TimePreferences {
  preferredHours: string[];
  timezone: string;
  urgencyTolerance: 'high' | 'medium' | 'low';
  sessionLength: 'short' | 'medium' | 'long';
  breakFrequency: 'frequent' | 'occasional' | 'minimal';
}

export interface KnowledgeState {
  technicalAreas: TechnicalArea[];
  learningGoals: LearningGoal[];
  competencyMap: Record<string, number>; // area -> competency (0-100)
  confusionAreas: string[];
  masteredConcepts: string[];
  currentLearningFocus: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  retentionRate: number; // 0-100%
  adaptabilityScore: number; // 0-100%
}

export interface TechnicalArea {
  area: string;
  competency: number; // 0-100
  interest: number; // 0-100
  recentProgress: number; // -100 to +100
  confusion_points: string[];
  successful_interactions: number;
  failed_interactions: number;
  last_interaction: Date;
}

export interface LearningGoal {
  goal: string;
  priority: 'high' | 'medium' | 'low';
  progress: number; // 0-100%
  timeframe: string;
  milestones: string[];
  achieved_milestones: string[];
  blocked_by: string[];
  motivation: number; // 0-100%
}

export interface InteractionPatterns {
  averageSessionLength: number; // minutes
  preferredInteractionTimes: string[];
  communicationPatterns: CommunicationPatterns;
  problemReportingStyle: string;
  solutionAcceptanceRate: number; // 0-100%
  escalationTriggers: string[];
  satisfactionTriggers: string[];
  learningTriggers: string[];
  frustrationTriggers: string[];
}

export interface CommunicationPatterns {
  averageResponseLength: number; // characters
  questionFrequency: number; // questions per interaction
  interruptionTendency: 'never' | 'rarely' | 'occasionally' | 'frequently';
  clarificationRequests: number; // per session average
  acknowledgmentStyle: string[];
  gratitudeExpressions: string[];
  frustrationExpressions: string[];
}

export interface ContinuityMarkers {
  lastGreeting: string;
  ongoingIssues: OngoingIssue[];
  pendingFollowUps: FollowUp[];
  relationshipMilestones: RelationshipMilestone[];
  contextCarryovers: string[];
  futureScheduled: ScheduledItem[];
  learningContinuation: string[];
}

export interface OngoingIssue {
  issueId: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastUpdate: Date;
  nextSteps: string[];
  blockers: string[];
  progressNotes: string[];
}

export interface FollowUp {
  type: 'check_resolution' | 'training_session' | 'system_update' | 'feedback';
  scheduled: Date;
  description: string;
  completed: boolean;
  notes: string;
}

export interface RelationshipMilestone {
  type: 'first_contact' | 'trust_built' | 'learning_breakthrough' | 'issue_resolved' | 'frustration_overcome';
  date: Date;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  context: string;
}

export interface ScheduledItem {
  type: 'follow_up' | 'training' | 'check_in' | 'system_maintenance';
  scheduledTime: Date;
  description: string;
  reminder: boolean;
  priority: 'low' | 'medium' | 'high';
}

export class PersonaMemoryManager {
  static createInitialMemory(personaId: string, userId: string): PersonaMemory {
    return {
      personaId,
      userId,
      sessionHistory: [],
      relationshipData: this.createInitialRelationshipData(),
      preferenceData: this.createInitialPreferences(),
      knowledgeState: this.createInitialKnowledgeState(),
      interactionPatterns: this.createInitialInteractionPatterns(),
      continuityMarkers: this.createInitialContinuityMarkers(),
      lastUpdated: new Date(),
      totalInteractions: 0,
      memoryVersion: '1.0'
    };
  }

  static addSessionMemory(memory: PersonaMemory, session: SessionMemory): PersonaMemory {
    const updatedMemory = {
      ...memory,
      sessionHistory: [...memory.sessionHistory, session],
      totalInteractions: memory.totalInteractions + 1,
      lastUpdated: new Date()
    };

    // Update derived data based on session
    this.updateRelationshipData(updatedMemory, session);
    this.updatePreferenceData(updatedMemory, session);
    this.updateKnowledgeState(updatedMemory, session);
    this.updateInteractionPatterns(updatedMemory, session);

    return updatedMemory;
  }

  static addPersonalDetail(
    memory: PersonaMemory, 
    category: PersonalDetail['category'], 
    detail: string,
    confidence: number = 0.8
  ): PersonaMemory {
    const existingDetail = memory.sessionHistory
      .flatMap(s => s.personalDetails)
      .find(d => d.detail === detail);

    if (existingDetail) {
      existingDetail.frequency += 1;
      existingDetail.lastReferenced = new Date();
      existingDetail.confidence = Math.min(1, existingDetail.confidence + 0.1);
    } else {
      const newDetail: PersonalDetail = {
        category,
        detail,
        confidence,
        firstMentioned: new Date(),
        lastReferenced: new Date(),
        frequency: 1,
        relevance: this.determineRelevance(category, detail)
      };

      // Add to the latest session or create a placeholder
      if (memory.sessionHistory.length > 0) {
        const latestSession = memory.sessionHistory[memory.sessionHistory.length - 1];
        latestSession.personalDetails.push(newDetail);
      }
    }

    return {
      ...memory,
      lastUpdated: new Date()
    };
  }

  static updateTechnicalUnderstanding(
    memory: PersonaMemory,
    concept: string,
    newLevel: TechnicalConcept['understanding_level'],
    success: boolean
  ): PersonaMemory {
    const existing = memory.knowledgeState.technicalAreas.find(area => 
      area.area.toLowerCase().includes(concept.toLowerCase())
    );

    if (existing) {
      if (success) {
        existing.successful_interactions += 1;
        existing.competency = Math.min(100, existing.competency + 5);
      } else {
        existing.failed_interactions += 1;
        existing.confusion_points.push(`Difficulty with ${concept} on ${new Date().toISOString()}`);
      }
      existing.last_interaction = new Date();
    } else {
      // Create new technical area
      const newArea: TechnicalArea = {
        area: concept,
        competency: success ? 20 : 5,
        interest: 50,
        recentProgress: success ? 20 : -10,
        confusion_points: success ? [] : [`Initial difficulty with ${concept}`],
        successful_interactions: success ? 1 : 0,
        failed_interactions: success ? 0 : 1,
        last_interaction: new Date()
      };

      memory.knowledgeState.technicalAreas.push(newArea);
    }

    return {
      ...memory,
      lastUpdated: new Date()
    };
  }

  static recordKeyMoment(
    memory: PersonaMemory,
    type: KeyMoment['type'],
    description: string,
    impact: KeyMoment['impact'],
    context: string
  ): PersonaMemory {
    const keyMoment: KeyMoment = {
      timestamp: new Date(),
      type,
      description,
      impact,
      context,
      emotionalState: this.inferEmotionalState(type)
    };

    // Add to latest session
    if (memory.sessionHistory.length > 0) {
      const latestSession = memory.sessionHistory[memory.sessionHistory.length - 1];
      latestSession.keyMoments.push(keyMoment);
    }

    // Update relationship milestones if significant
    if (impact === 'high') {
      this.addRelationshipMilestone(memory, type, description, context);
    }

    return {
      ...memory,
      lastUpdated: new Date()
    };
  }

  static getMemoryInsights(memory: PersonaMemory): MemoryInsights {
    return {
      relationshipStrength: this.calculateRelationshipStrength(memory),
      learningProgress: this.calculateLearningProgress(memory),
      satisfactionTrend: this.calculateSatisfactionTrend(memory),
      engagementLevel: this.calculateEngagementLevel(memory),
      knowledgeGrowth: this.calculateKnowledgeGrowth(memory),
      continuityFactors: this.analyzeContinuityFactors(memory),
      recommendedApproaches: this.getRecommendedApproaches(memory)
    };
  }

  static getPersonalizedGreeting(memory: PersonaMemory): string {
    const recentSession = memory.sessionHistory[memory.sessionHistory.length - 1];
    const personalDetails = memory.sessionHistory.flatMap(s => s.personalDetails);
    const nameDetail = personalDetails.find(d => d.category === 'name');
    
    if (memory.totalInteractions === 0) {
      return "Hello! I'm here to help you with your technical question today.";
    }

    const name = nameDetail ? nameDetail.detail : '';
    const greeting = memory.relationshipData.comfortLevel > 7 ? 'Hi' : 'Hello';
    const nameReference = name && memory.relationshipData.remembersNames ? ` ${name}` : '';
    
    if (recentSession && !recentSession.issueResolved) {
      return `${greeting}${nameReference}! I see we were working on ${recentSession.issueType} last time. How is that going?`;
    }
    
    if (memory.continuityMarkers.ongoingIssues.length > 0) {
      const issue = memory.continuityMarkers.ongoingIssues[0];
      return `${greeting}${nameReference}! I wanted to follow up on the ${issue.description} we discussed. How has that been working?`;
    }

    return `${greeting}${nameReference}! Good to hear from you again. What can I help you with today?`;
  }

  static getContextualReferences(memory: PersonaMemory): string[] {
    const references: string[] = [];
    const recentSessions = memory.sessionHistory.slice(-3);
    
    recentSessions.forEach(session => {
      if (session.learningAchievements.length > 0) {
        references.push(`Remember when we learned about ${session.learningAchievements[0]}?`);
      }
      
      if (session.issueResolved && session.resolutionMethod) {
        references.push(`Like last time when we ${session.resolutionMethod}`);
      }
    });

    return references.slice(0, 2); // Limit to most relevant
  }

  // Helper methods
  private static createInitialRelationshipData(): RelationshipData {
    return {
      trustLevel: 5,
      comfortLevel: 5,
      communicationStyle: 'professional',
      preferredPace: 'moderate',
      responseToHumor: 'neutral',
      appreciationStyle: 'verbal',
      escalationTendency: 3,
      learningMotivation: 6,
      relationshipBuilding: false,
      remembersNames: false,
      sharesPersonalInfo: false
    };
  }

  private static createInitialPreferences(): PreferenceData {
    return {
      communicationChannels: ['chat'],
      explanationStyle: 'detailed',
      documentationUsage: 'sometimes',
      followUpPreference: 'none',
      problemSolvingApproach: 'guided',
      feedbackStyle: 'direct',
      timePreferences: {
        preferredHours: ['09:00-17:00'],
        timezone: 'UTC',
        urgencyTolerance: 'medium',
        sessionLength: 'medium',
        breakFrequency: 'occasional'
      },
      technicalDepth: 'moderate'
    };
  }

  private static createInitialKnowledgeState(): KnowledgeState {
    return {
      technicalAreas: [],
      learningGoals: [],
      competencyMap: {},
      confusionAreas: [],
      masteredConcepts: [],
      currentLearningFocus: [],
      learningStyle: 'reading',
      retentionRate: 70,
      adaptabilityScore: 60
    };
  }

  private static createInitialInteractionPatterns(): InteractionPatterns {
    return {
      averageSessionLength: 15,
      preferredInteractionTimes: ['09:00-12:00', '14:00-17:00'],
      communicationPatterns: {
        averageResponseLength: 200,
        questionFrequency: 2,
        interruptionTendency: 'rarely',
        clarificationRequests: 1,
        acknowledgmentStyle: ['ok', 'got it', 'understood'],
        gratitudeExpressions: ['thank you', 'thanks'],
        frustrationExpressions: ['this is not working', 'I don\'t understand']
      },
      problemReportingStyle: 'detailed',
      solutionAcceptanceRate: 80,
      escalationTriggers: ['long wait times', 'complex procedures'],
      satisfactionTriggers: ['quick resolution', 'clear explanation'],
      learningTriggers: ['step-by-step guidance'],
      frustrationTriggers: ['technical jargon', 'assumptions']
    };
  }

  private static createInitialContinuityMarkers(): ContinuityMarkers {
    return {
      lastGreeting: '',
      ongoingIssues: [],
      pendingFollowUps: [],
      relationshipMilestones: [],
      contextCarryovers: [],
      futureScheduled: [],
      learningContinuation: []
    };
  }

  private static updateRelationshipData(memory: PersonaMemory, session: SessionMemory): void {
    // Update trust based on session outcome
    if (session.issueResolved) {
      memory.relationshipData.trustLevel = Math.min(10, memory.relationshipData.trustLevel + 0.5);
    }

    // Update comfort level based on interaction frequency
    if (memory.totalInteractions > 3) {
      memory.relationshipData.comfortLevel = Math.min(10, memory.relationshipData.comfortLevel + 0.2);
    }
  }

  private static updatePreferenceData(memory: PersonaMemory, session: SessionMemory): void {
    // Update preferences based on session patterns
    if (session.duration < 10) {
      memory.preferenceData.timePreferences.sessionLength = 'short';
    } else if (session.duration > 30) {
      memory.preferenceData.timePreferences.sessionLength = 'long';
    }
  }

  private static updateKnowledgeState(memory: PersonaMemory, session: SessionMemory): void {
    // Update competency based on learning achievements
    session.learningAchievements.forEach(achievement => {
      memory.knowledgeState.masteredConcepts.push(achievement);
    });
  }

  private static updateInteractionPatterns(memory: PersonaMemory, session: SessionMemory): void {
    // Update average session length
    const totalTime = memory.interactionPatterns.averageSessionLength * (memory.totalInteractions - 1) + session.duration;
    memory.interactionPatterns.averageSessionLength = totalTime / memory.totalInteractions;
  }

  private static determineRelevance(category: string, _detail: string): PersonalDetail['relevance'] {
    if (category === 'name' || category === 'role') return 'high';
    if (category === 'preference' || category === 'context') return 'medium';
    return 'low';
  }

  private static inferEmotionalState(type: KeyMoment['type']): string {
    const stateMap: Record<KeyMoment['type'], string> = {
      positive: 'pleased',
      negative: 'frustrated',
      learning: 'engaged',
      breakthrough: 'excited',
      frustration: 'frustrated',
      appreciation: 'grateful'
    };
    return stateMap[type] || 'neutral';
  }

  private static addRelationshipMilestone(
    memory: PersonaMemory,
    type: KeyMoment['type'],
    description: string,
    context: string
  ): void {
    const milestoneType: RelationshipMilestone['type'] = 
      type === 'positive' ? 'trust_built' :
      type === 'learning' || type === 'breakthrough' ? 'learning_breakthrough' :
      type === 'negative' || type === 'frustration' ? 'frustration_overcome' :
      'issue_resolved';

    const milestone: RelationshipMilestone = {
      type: milestoneType,
      date: new Date(),
      description,
      impact: type === 'positive' || type === 'breakthrough' ? 'positive' : 
              type === 'negative' || type === 'frustration' ? 'negative' : 'neutral',
      context
    };

    memory.continuityMarkers.relationshipMilestones.push(milestone);
  }

  // Analytics methods
  private static calculateRelationshipStrength(memory: PersonaMemory): number {
    return (memory.relationshipData.trustLevel + memory.relationshipData.comfortLevel) / 2;
  }

  private static calculateLearningProgress(memory: PersonaMemory): number {
    const totalConcepts = memory.knowledgeState.technicalAreas.length;
    if (totalConcepts === 0) return 0;
    
    const avgCompetency = memory.knowledgeState.technicalAreas
      .reduce((sum, area) => sum + area.competency, 0) / totalConcepts;
    
    return avgCompetency;
  }

  private static calculateSatisfactionTrend(memory: PersonaMemory): number {
    const recentSessions = memory.sessionHistory.slice(-5);
    if (recentSessions.length === 0) return 5;
    
    return recentSessions.reduce((sum, session) => sum + session.satisfactionLevel, 0) / recentSessions.length;
  }

  private static calculateEngagementLevel(memory: PersonaMemory): number {
    return memory.relationshipData.learningMotivation;
  }

  private static calculateKnowledgeGrowth(memory: PersonaMemory): number {
    const learningAchievements = memory.sessionHistory.flatMap(s => s.learningAchievements);
    return Math.min(100, learningAchievements.length * 10);
  }

  private static analyzeContinuityFactors(memory: PersonaMemory): string[] {
    const factors: string[] = [];
    
    if (memory.continuityMarkers.ongoingIssues.length > 0) {
      factors.push('has_ongoing_issues');
    }
    
    if (memory.relationshipData.relationshipBuilding) {
      factors.push('building_relationship');
    }
    
    if (memory.knowledgeState.currentLearningFocus.length > 0) {
      factors.push('active_learning');
    }
    
    return factors;
  }

  private static getRecommendedApproaches(memory: PersonaMemory): string[] {
    const approaches: string[] = [];
    
    if (memory.relationshipData.trustLevel < 5) {
      approaches.push('build_trust');
    }
    
    if (memory.knowledgeState.confusionAreas.length > 0) {
      approaches.push('address_confusion');
    }
    
    if (memory.relationshipData.learningMotivation > 7) {
      approaches.push('provide_advanced_learning');
    }
    
    return approaches;
  }
}

export interface MemoryInsights {
  relationshipStrength: number;
  learningProgress: number;
  satisfactionTrend: number;
  engagementLevel: number;
  knowledgeGrowth: number;
  continuityFactors: string[];
  recommendedApproaches: string[];
}

export default PersonaMemory;