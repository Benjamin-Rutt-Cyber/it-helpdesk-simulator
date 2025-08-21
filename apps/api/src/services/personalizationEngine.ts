import { logger } from '../utils/logger';

interface LearningPattern {
  preferredPace: 'slow' | 'moderate' | 'fast' | 'variable';
  informationProcessing: 'sequential' | 'random' | 'global' | 'detail';
  feedbackStyle: 'direct' | 'supportive' | 'analytical' | 'motivational';
  challengePreference: 'gradual' | 'steep' | 'varied' | 'breakthrough';
  retentionMethod: 'repetition' | 'application' | 'visualization' | 'conceptual';
}

interface IndividualProfile {
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'multimodal';
  personalityType: 'analytical' | 'driver' | 'expressive' | 'amiable' | 'balanced';
  motivationFactors: string[];
  careerGoals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  strengthAreas: string[];
  challengeAreas: string[];
  culturalConsiderations: string[];
  accessibilityNeeds: string[];
}

interface PersonalizedContent {
  contentType: 'feedback' | 'recommendation' | 'motivation' | 'instruction' | 'assessment';
  originalContent: string;
  personalizedContent: string;
  adaptationReasons: string[];
  confidenceScore: number;
  culturalSensitivity: boolean;
  accessibilityCompliant: boolean;
}

interface AdaptiveFeedbackPreferences {
  communicationStyle: 'formal' | 'casual' | 'encouraging' | 'direct' | 'analytical';
  detailLevel: 'summary' | 'moderate' | 'comprehensive' | 'granular';
  examplePreference: 'concrete' | 'abstract' | 'personal' | 'professional' | 'technical';
  progressEmphasis: 'achievement' | 'improvement' | 'potential' | 'comparison' | 'journey';
  goalOrientation: 'short_term' | 'long_term' | 'milestone_based' | 'process_focused';
}

interface PersonalizedRecommendation {
  recommendationType: 'learning' | 'practice' | 'resource' | 'goal' | 'strategy';
  baseRecommendation: string;
  personalizedRecommendation: string;
  relevanceScore: number;
  adaptationFactors: string[];
  implementationGuidance: string;
  successPredictors: string[];
}

interface CareerAlignedFeedback {
  careerStage: 'entry_level' | 'career_change' | 'advancement' | 'specialization' | 'leadership';
  industryContext: string;
  roleRelevance: number;
  competencyAlignment: string[];
  careerProgression: string;
  marketDemand: string;
  skillGapAnalysis: string[];
}

class PersonalizationEngine {
  private learningStyleAdaptations = {
    visual: {
      contentFormat: ['charts', 'diagrams', 'infographics', 'color_coding', 'visual_hierarchy'],
      feedbackStyle: 'Use visual metaphors and spatial language',
      recommendedPractice: 'Visual mind mapping, diagram creation, flowchart analysis',
      motivationalApproach: 'Show progress visually with charts and achievement badges'
    },
    auditory: {
      contentFormat: ['verbal_explanations', 'audio_content', 'discussions', 'verbal_repetition'],
      feedbackStyle: 'Use conversational tone with verbal emphasis',
      recommendedPractice: 'Verbal practice sessions, audio recordings, discussion groups',
      motivationalApproach: 'Use encouraging verbal affirmations and success stories'
    },
    kinesthetic: {
      contentFormat: ['hands_on_practice', 'simulations', 'interactive_exercises', 'real_scenarios'],
      feedbackStyle: 'Focus on action-oriented language and practical applications',
      recommendedPractice: 'Hands-on practice, role-playing, simulation exercises',
      motivationalApproach: 'Emphasize practical achievements and skill demonstrations'
    },
    reading: {
      contentFormat: ['detailed_text', 'written_instructions', 'documentation', 'research_materials'],
      feedbackStyle: 'Provide comprehensive written explanations with examples',
      recommendedPractice: 'Reading assignments, written reflections, research projects',
      motivationalApproach: 'Highlight knowledge acquisition and intellectual growth'
    },
    multimodal: {
      contentFormat: ['varied_formats', 'integrated_media', 'multiple_channels', 'adaptive_presentation'],
      feedbackStyle: 'Combine multiple presentation styles for comprehensive understanding',
      recommendedPractice: 'Varied practice methods adapted to content and context',
      motivationalApproach: 'Use diverse motivational strategies based on specific achievements'
    }
  };

  private personalityAdaptations = {
    analytical: {
      feedbackStyle: 'Data-driven, logical, detailed analysis with supporting evidence',
      motivationFactors: ['accuracy', 'precision', 'logical_consistency', 'evidence_based_conclusions'],
      communicationPreferences: 'Formal, structured, comprehensive explanations',
      goalStructure: 'Detailed plans with metrics and measurable outcomes'
    },
    driver: {
      feedbackStyle: 'Direct, results-focused, action-oriented with clear next steps',
      motivationFactors: ['achievement', 'efficiency', 'results', 'competitive_progress'],
      communicationPreferences: 'Concise, goal-oriented, time-efficient delivery',
      goalStructure: 'Clear targets with timelines and milestone markers'
    },
    expressive: {
      feedbackStyle: 'Enthusiastic, engaging, story-based with personal connection',
      motivationFactors: ['recognition', 'social_connection', 'creative_expression', 'positive_reinforcement'],
      communicationPreferences: 'Warm, interactive, encouraging with personal anecdotes',
      goalStructure: 'Inspiring visions with celebration milestones and peer interaction'
    },
    amiable: {
      feedbackStyle: 'Supportive, gentle, collaborative with team-oriented perspective',
      motivationFactors: ['security', 'stability', 'team_harmony', 'gradual_progress'],
      communicationPreferences: 'Patient, understanding, non-threatening with supportive tone',
      goalStructure: 'Comfortable pace with security and support system integration'
    },
    balanced: {
      feedbackStyle: 'Flexible approach adapting to situation and content requirements',
      motivationFactors: ['varied_stimulation', 'balanced_growth', 'adaptive_challenges', 'holistic_development'],
      communicationPreferences: 'Context-appropriate style with multiple communication modes',
      goalStructure: 'Flexible goals with multiple pathways and adaptation opportunities'
    }
  };

  private culturalConsiderations = {
    communication_directness: {
      high_context: 'Use indirect communication, implied meanings, relationship-focused approach',
      low_context: 'Use direct communication, explicit instructions, task-focused approach'
    },
    hierarchy_orientation: {
      high_hierarchy: 'Emphasize formal structure, respect for authority, systematic progression',
      low_hierarchy: 'Encourage informal interaction, peer learning, collaborative approach'
    },
    individualism_collectivism: {
      individualistic: 'Focus on personal achievement, individual goals, self-directed learning',
      collectivistic: 'Emphasize team contribution, group harmony, collaborative learning'
    },
    uncertainty_avoidance: {
      high_avoidance: 'Provide detailed structure, clear expectations, predictable progression',
      low_avoidance: 'Encourage exploration, flexibility, adaptive learning approaches'
    }
  };

  /**
   * Create individual learning pattern analysis
   */
  async createLearningPatternAnalysis(userHistory: any[], performanceData: any, preferences: any): Promise<LearningPattern> {
    try {
      logger.info('Creating learning pattern analysis');

      const learningPattern: LearningPattern = {
        preferredPace: this.analyzeLearningPace(userHistory),
        informationProcessing: this.analyzeInformationProcessing(performanceData, preferences),
        feedbackStyle: this.analyzeFeedbackStylePreference(userHistory, preferences),
        challengePreference: this.analyzeChallengePreference(userHistory, performanceData),
        retentionMethod: this.analyzeRetentionMethod(userHistory, preferences)
      };

      return learningPattern;
    } catch (error) {
      logger.error('Error creating learning pattern analysis:', error);
      throw new Error('Failed to create learning pattern analysis');
    }
  }

  /**
   * Generate personalized feedback content
   */
  async generatePersonalizedFeedback(
    originalFeedback: any,
    individualProfile: IndividualProfile,
    learningPattern: LearningPattern
  ): Promise<PersonalizedContent[]> {
    try {
      logger.info('Generating personalized feedback content');

      const personalizedContent: PersonalizedContent[] = [];

      // Personalize main feedback content
      for (const [contentType, content] of Object.entries(originalFeedback)) {
        if (typeof content === 'string') {
          const personalized = await this.personalizeContent(
            contentType as any,
            content,
            individualProfile,
            learningPattern
          );
          personalizedContent.push(personalized);
        }
      }

      return personalizedContent;
    } catch (error) {
      logger.error('Error generating personalized feedback:', error);
      throw new Error('Failed to generate personalized feedback');
    }
  }

  /**
   * Adapt feedback to individual learning style
   */
  async adaptToLearningStyle(
    content: string,
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'multimodal',
    contentType: string
  ): Promise<string> {
    try {
      const adaptation = this.learningStyleAdaptations[learningStyle];
      let adaptedContent = content;

      switch (learningStyle) {
        case 'visual':
          adaptedContent = this.addVisualElements(content);
          break;
        case 'auditory':
          adaptedContent = this.addAuditoryElements(content);
          break;
        case 'kinesthetic':
          adaptedContent = this.addKinestheticElements(content);
          break;
        case 'reading':
          adaptedContent = this.enhanceTextualContent(content);
          break;
        case 'multimodal':
          adaptedContent = this.createMultiModalContent(content);
          break;
      }

      return adaptedContent;
    } catch (error) {
      logger.error('Error adapting to learning style:', error);
      throw new Error('Failed to adapt to learning style');
    }
  }

  /**
   * Create career goal alignment
   */
  async createCareerGoalAlignment(
    feedbackContent: any,
    careerGoals: string[],
    experienceLevel: string
  ): Promise<CareerAlignedFeedback> {
    try {
      logger.info('Creating career goal alignment');

      const primaryGoal = careerGoals[0] || 'professional_development';
      const careerStage = this.determineCareerStage(experienceLevel, careerGoals);

      const alignment: CareerAlignedFeedback = {
        careerStage,
        industryContext: this.generateIndustryContext(primaryGoal),
        roleRelevance: this.calculateRoleRelevance(feedbackContent, primaryGoal),
        competencyAlignment: this.alignCompetenciesToCareer(feedbackContent, primaryGoal),
        careerProgression: this.generateCareerProgression(feedbackContent, careerGoals, experienceLevel),
        marketDemand: this.assessMarketDemand(primaryGoal, feedbackContent),
        skillGapAnalysis: this.analyzeSkillGaps(feedbackContent, primaryGoal, experienceLevel)
      };

      return alignment;
    } catch (error) {
      logger.error('Error creating career goal alignment:', error);
      throw new Error('Failed to create career goal alignment');
    }
  }

  /**
   * Generate adaptive feedback preferences
   */
  async generateAdaptiveFeedbackPreferences(
    individualProfile: IndividualProfile,
    learningPattern: LearningPattern,
    performanceHistory: any[]
  ): Promise<AdaptiveFeedbackPreferences> {
    try {
      const preferences: AdaptiveFeedbackPreferences = {
        communicationStyle: this.determineCommunicationStyle(individualProfile, learningPattern),
        detailLevel: this.determineDetailLevel(learningPattern, performanceHistory),
        examplePreference: this.determineExamplePreference(individualProfile, learningPattern),
        progressEmphasis: this.determineProgressEmphasis(individualProfile, performanceHistory),
        goalOrientation: this.determineGoalOrientation(individualProfile, learningPattern)
      };

      return preferences;
    } catch (error) {
      logger.error('Error generating adaptive feedback preferences:', error);
      throw new Error('Failed to generate adaptive feedback preferences');
    }
  }

  /**
   * Create personalized recommendations
   */
  async createPersonalizedRecommendations(
    baseRecommendations: any[],
    individualProfile: IndividualProfile,
    learningPattern: LearningPattern
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const personalizedRecommendations: PersonalizedRecommendation[] = [];

      for (const recommendation of baseRecommendations) {
        const personalized = await this.personalizeRecommendation(
          recommendation,
          individualProfile,
          learningPattern
        );
        personalizedRecommendations.push(personalized);
      }

      // Sort by relevance score
      personalizedRecommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return personalizedRecommendations;
    } catch (error) {
      logger.error('Error creating personalized recommendations:', error);
      throw new Error('Failed to create personalized recommendations');
    }
  }

  // Private helper methods

  private analyzeLearningPace(userHistory: any[]): 'slow' | 'moderate' | 'fast' | 'variable' {
    if (userHistory.length < 3) return 'moderate';

    const progressRates = [];
    for (let i = 1; i < userHistory.length; i++) {
      const improvement = (userHistory[i].overall || 0) - (userHistory[i-1].overall || 0);
      const timeSpan = 1; // Assuming each session is roughly equal time
      progressRates.push(improvement / timeSpan);
    }

    const avgRate = progressRates.reduce((sum, rate) => sum + rate, 0) / progressRates.length;
    const variance = progressRates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / progressRates.length;

    if (variance > 10) return 'variable';
    if (avgRate > 5) return 'fast';
    if (avgRate > 2) return 'moderate';
    return 'slow';
  }

  private analyzeInformationProcessing(performanceData: any, preferences: any): 'sequential' | 'random' | 'global' | 'detail' {
    // Analyze based on performance patterns and stated preferences
    if (preferences.learningStyle === 'analytical') return 'sequential';
    if (preferences.learningStyle === 'creative') return 'random';
    
    const overallScore = performanceData.overall || 0;
    const dimensionVariance = this.calculateDimensionVariance(performanceData.dimensions || {});
    
    if (dimensionVariance < 5) return 'global'; // Consistent across dimensions
    if (overallScore > 80) return 'detail'; // High performers often prefer detail
    
    return 'sequential'; // Default for structured learning
  }

  private analyzeFeedbackStylePreference(userHistory: any[], preferences: any): 'direct' | 'supportive' | 'analytical' | 'motivational' {
    // Based on personality type and historical engagement
    if (preferences.personalityType === 'driver') return 'direct';
    if (preferences.personalityType === 'analytical') return 'analytical';
    if (preferences.personalityType === 'expressive') return 'motivational';
    if (preferences.personalityType === 'amiable') return 'supportive';
    
    return 'supportive'; // Default supportive approach
  }

  private analyzeChallengePreference(userHistory: any[], performanceData: any): 'gradual' | 'steep' | 'varied' | 'breakthrough' {
    const currentLevel = performanceData.overall || 0;
    const improvementRate = this.calculateImprovementRate(userHistory);
    
    if (improvementRate > 10 && currentLevel > 75) return 'breakthrough';
    if (improvementRate > 5) return 'steep';
    if (improvementRate < 2) return 'gradual';
    return 'varied';
  }

  private analyzeRetentionMethod(userHistory: any[], preferences: any): 'repetition' | 'application' | 'visualization' | 'conceptual' {
    // Based on learning style and retention patterns
    if (preferences.learningStyle === 'visual') return 'visualization';
    if (preferences.learningStyle === 'kinesthetic') return 'application';
    if (preferences.learningStyle === 'reading') return 'conceptual';
    
    return 'repetition'; // Default for most learners
  }

  private async personalizeContent(
    contentType: 'feedback' | 'recommendation' | 'motivation' | 'instruction' | 'assessment',
    originalContent: string,
    profile: IndividualProfile,
    pattern: LearningPattern
  ): Promise<PersonalizedContent> {
    let personalizedContent = originalContent;
    const adaptationReasons: string[] = [];

    // Adapt for learning style
    personalizedContent = await this.adaptToLearningStyle(personalizedContent, profile.learningStyle, contentType);
    adaptationReasons.push(`Adapted for ${profile.learningStyle} learning style`);

    // Adapt for personality type
    personalizedContent = this.adaptForPersonalityType(personalizedContent, profile.personalityType);
    adaptationReasons.push(`Adapted for ${profile.personalityType} personality type`);

    // Adapt for career goals
    personalizedContent = this.adaptForCareerGoals(personalizedContent, profile.careerGoals);
    adaptationReasons.push('Aligned with career goals');

    // Adapt for cultural considerations
    personalizedContent = this.adaptForCulturalConsiderations(personalizedContent, profile.culturalConsiderations);
    adaptationReasons.push('Culturally adapted');

    return {
      contentType,
      originalContent,
      personalizedContent,
      adaptationReasons,
      confidenceScore: this.calculateAdaptationConfidence(profile, pattern),
      culturalSensitivity: true,
      accessibilityCompliant: this.checkAccessibilityCompliance(personalizedContent, profile.accessibilityNeeds)
    };
  }

  private addVisualElements(content: string): string {
    let enhanced = content;
    
    // Add visual structure cues
    enhanced = enhanced.replace(/(\d+\.)/g, '📊 $1');
    enhanced = enhanced.replace(/(Key|Important|Note):/gi, '🔑 $1:');
    enhanced = enhanced.replace(/(Excellent|Outstanding|Great)/gi, '⭐ $1');
    enhanced = enhanced.replace(/(Improve|Development|Enhancement)/gi, '📈 $1');
    
    // Add visual separators and structure
    enhanced = enhanced.replace(/\n\n/g, '\n\n───────────────\n\n');
    
    return enhanced;
  }

  private addAuditoryElements(content: string): string {
    let enhanced = content;
    
    // Add conversational elements
    enhanced = enhanced.replace(/^([A-Z][^.!?]*[.!?])/, 'Let me tell you about this: $1');
    enhanced = enhanced.replace(/\. /g, '. Now, ');
    enhanced = enhanced.replace(/:/g, ', and here\'s what I mean:');
    
    // Add emphasis words
    enhanced = enhanced.replace(/(excellent|great|outstanding)/gi, 'truly $1');
    enhanced = enhanced.replace(/(important|key|critical)/gi, 'really $1');
    
    return enhanced;
  }

  private addKinestheticElements(content: string): string {
    let enhanced = content;
    
    // Add action-oriented language
    enhanced = enhanced.replace(/you (have|are|can)/gi, 'you actively $1');
    enhanced = enhanced.replace(/understand/gi, 'grasp and apply');
    enhanced = enhanced.replace(/learn/gi, 'practice and master');
    enhanced = enhanced.replace(/improve/gi, 'build up and strengthen');
    
    // Add hands-on suggestions
    enhanced += '\n\n🤝 Try this: Practice these skills in real scenarios to solidify your learning.';
    
    return enhanced;
  }

  private enhanceTextualContent(content: string): string {
    let enhanced = content;
    
    // Add detailed explanations and context
    enhanced = enhanced.replace(/(\w+) skills/gi, '$1 competencies (the specific abilities and knowledge areas)');
    enhanced = enhanced.replace(/performance/gi, 'demonstrated capability and achievement');
    enhanced = enhanced.replace(/development/gi, 'systematic skill building and professional growth');
    
    // Add references and further reading suggestions
    enhanced += '\n\n📚 For deeper understanding, consider researching the theoretical frameworks behind these competency areas.';
    
    return enhanced;
  }

  private createMultiModalContent(content: string): string {
    let enhanced = content;
    
    // Combine multiple approaches
    enhanced = this.addVisualElements(enhanced); // Visual structure
    enhanced = enhanced.replace(/Now, /g, ''); // Remove auditory additions that conflict
    enhanced = enhanced.replace(/you actively /gi, 'you '); // Simplify kinesthetic additions
    
    // Add multi-modal suggestions
    enhanced += '\n\n🎯 Multiple ways to engage with this feedback:\n';
    enhanced += '👁️ Visual: Review the charts and progress indicators\n';
    enhanced += '👂 Audio: Listen to the detailed explanation\n';
    enhanced += '✋ Hands-on: Practice the suggested exercises\n';
    enhanced += '📖 Reading: Explore the detailed written analysis';
    
    return enhanced;
  }

  private adaptForPersonalityType(content: string, personalityType: string): string {
    const adaptation = this.personalityAdaptations[personalityType as keyof typeof this.personalityAdaptations];
    if (!adaptation) return content;

    let adapted = content;

    switch (personalityType) {
      case 'analytical':
        adapted = `Based on detailed analysis of your performance data: ${adapted}`;
        adapted = adapted.replace(/good|great/gi, 'statistically significant');
        break;
      case 'driver':
        adapted = adapted.replace(/^.*?:/, 'Bottom line:');
        adapted = adapted.replace(/consider|might want to/gi, 'need to');
        break;
      case 'expressive':
        adapted = `I'm excited to share your results! ${adapted}`;
        adapted = adapted.replace(/improvement/gi, 'growth opportunity');
        break;
      case 'amiable':
        adapted = `I want you to know that ${adapted}`;
        adapted = adapted.replace(/need to improve/gi, 'have the opportunity to develop');
        break;
    }

    return adapted;
  }

  private adaptForCareerGoals(content: string, careerGoals: string[]): string {
    if (careerGoals.length === 0) return content;

    const primaryGoal = careerGoals[0];
    let adapted = content;

    // Add career-relevant context
    adapted += `\n\n🎯 Career Relevance: This feedback is particularly important for your ${primaryGoal} goals.`;
    
    // Add specific career connections
    if (primaryGoal.includes('management') || primaryGoal.includes('leadership')) {
      adapted = adapted.replace(/communication/gi, 'leadership communication');
      adapted = adapted.replace(/technical skills/gi, 'technical leadership abilities');
    }
    
    if (primaryGoal.includes('specialist') || primaryGoal.includes('expert')) {
      adapted = adapted.replace(/knowledge/gi, 'specialized expertise');
      adapted = adapted.replace(/skills/gi, 'advanced competencies');
    }

    return adapted;
  }

  private adaptForCulturalConsiderations(content: string, culturalFactors: string[]): string {
    let adapted = content;

    culturalFactors.forEach(factor => {
      switch (factor) {
        case 'high_context':
          adapted = adapted.replace(/You need to/gi, 'It might be beneficial to consider');
          adapted = adapted.replace(/must|should/gi, 'could');
          break;
        case 'collectivistic':
          adapted = adapted.replace(/your achievement/gi, 'your contribution to team success');
          adapted = adapted.replace(/individual/gi, 'collaborative');
          break;
        case 'high_hierarchy':
          adapted = adapted.replace(/feedback/gi, 'respectful guidance');
          adapted = adapted.replace(/improve/gi, 'develop with proper guidance');
          break;
        case 'high_uncertainty_avoidance':
          adapted = adapted.replace(/try different approaches/gi, 'follow these structured steps');
          adapted = adapted.replace(/explore/gi, 'systematically develop');
          break;
      }
    });

    return adapted;
  }

  private calculateAdaptationConfidence(profile: IndividualProfile, pattern: LearningPattern): number {
    let confidence = 70; // Base confidence

    // Increase confidence based on profile completeness
    if (profile.learningStyle && profile.learningStyle !== 'multimodal') confidence += 10;
    if (profile.personalityType && profile.personalityType !== 'balanced') confidence += 10;
    if (profile.careerGoals.length > 0) confidence += 5;
    if (profile.experienceLevel) confidence += 5;

    return Math.min(100, confidence);
  }

  private checkAccessibilityCompliance(content: string, accessibilityNeeds: string[]): boolean {
    // Check for basic accessibility compliance
    let compliant = true;

    accessibilityNeeds.forEach(need => {
      switch (need) {
        case 'screen_reader':
          // Check for proper structure (headings, lists, etc.)
          if (!content.includes('\n') && content.length > 200) {
            compliant = false; // Needs better structure
          }
          break;
        case 'simple_language':
          // Check for complex words
          const complexWords = content.match(/\b\w{10,}\b/g);
          if (complexWords && complexWords.length > content.split(' ').length * 0.1) {
            compliant = false; // Too many complex words
          }
          break;
      }
    });

    return compliant;
  }

  private calculateDimensionVariance(dimensions: any): number {
    const scores = Object.values(dimensions).map((dim: any) => 
      typeof dim === 'number' ? dim : dim.score || 0
    );
    
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.sqrt(variance);
  }

  private calculateImprovementRate(userHistory: any[]): number {
    if (userHistory.length < 2) return 0;
    
    const firstScore = userHistory[0].overall || 0;
    const lastScore = userHistory[userHistory.length - 1].overall || 0;
    const improvement = lastScore - firstScore;
    const timeSpan = userHistory.length - 1;
    
    return improvement / timeSpan;
  }

  private determineCareerStage(
    experienceLevel: string,
    careerGoals: string[]
  ): 'entry_level' | 'career_change' | 'advancement' | 'specialization' | 'leadership' {
    const goalText = careerGoals.join(' ').toLowerCase();
    
    if (goalText.includes('manager') || goalText.includes('lead') || goalText.includes('director')) {
      return 'leadership';
    }
    if (goalText.includes('specialist') || goalText.includes('expert') || goalText.includes('architect')) {
      return 'specialization';
    }
    if (goalText.includes('senior') || goalText.includes('advance') || goalText.includes('promotion')) {
      return 'advancement';
    }
    if (goalText.includes('change') || goalText.includes('transition') || goalText.includes('switch')) {
      return 'career_change';
    }
    
    return experienceLevel === 'beginner' ? 'entry_level' : 'advancement';
  }

  private generateIndustryContext(primaryGoal: string): string {
    const contextMap = {
      'technical_specialist': 'Technology sector with emphasis on specialized technical expertise',
      'team_lead': 'Professional services with focus on team management and coordination',
      'consultant': 'Consulting industry with emphasis on client interaction and problem-solving',
      'manager': 'Management track across various industries with leadership responsibilities',
      'analyst': 'Data and business analysis roles with analytical and communication requirements'
    };

    // Match goal keywords to contexts
    for (const [key, context] of Object.entries(contextMap)) {
      if (primaryGoal.toLowerCase().includes(key.replace('_', ' ')) || 
          primaryGoal.toLowerCase().includes(key.replace('_', ''))) {
        return context;
      }
    }

    return 'General IT support and professional services industry';
  }

  private calculateRoleRelevance(feedbackContent: any, primaryGoal: string): number {
    let relevance = 50; // Base relevance

    const goalLower = primaryGoal.toLowerCase();
    
    // Technical roles
    if (goalLower.includes('technical') || goalLower.includes('developer') || goalLower.includes('engineer')) {
      relevance += (feedbackContent.dimensions?.technical?.score || 0) * 0.5;
    }
    
    // Management roles
    if (goalLower.includes('manager') || goalLower.includes('lead') || goalLower.includes('supervisor')) {
      relevance += (feedbackContent.dimensions?.communication?.score || 0) * 0.3;
      relevance += (feedbackContent.dimensions?.customerService?.score || 0) * 0.2;
    }
    
    // Specialist roles
    if (goalLower.includes('specialist') || goalLower.includes('consultant') || goalLower.includes('expert')) {
      relevance += (feedbackContent.dimensions?.problemSolving?.score || 0) * 0.3;
      relevance += (feedbackContent.dimensions?.technical?.score || 0) * 0.2;
    }

    return Math.min(100, relevance);
  }

  private alignCompetenciesToCareer(feedbackContent: any, primaryGoal: string): string[] {
    const alignments = [];
    const goalLower = primaryGoal.toLowerCase();
    const dimensions = feedbackContent.dimensions || {};

    if (goalLower.includes('technical') && dimensions.technical) {
      alignments.push('Technical competency directly supports your technical career goals');
    }
    if (goalLower.includes('manager') && dimensions.communication) {
      alignments.push('Communication skills are essential for management roles');
    }
    if (goalLower.includes('customer') && dimensions.customerService) {
      alignments.push('Customer service excellence aligns with customer-facing career goals');
    }
    if (goalLower.includes('analyst') && dimensions.problemSolving) {
      alignments.push('Problem-solving capabilities are core to analytical roles');
    }

    return alignments.length > 0 ? alignments : ['All competencies contribute to professional development'];
  }

  private generateCareerProgression(feedbackContent: any, careerGoals: string[], experienceLevel: string): string {
    const overallScore = feedbackContent.overall || 0;
    const primaryGoal = careerGoals[0] || 'professional growth';

    if (overallScore >= 85) {
      return `Your strong performance positions you well for ${primaryGoal}. You're ready for advanced opportunities and leadership challenges.`;
    } else if (overallScore >= 75) {
      return `Your solid competency foundation supports progression toward ${primaryGoal}. Focus on specialized skill development for acceleration.`;
    } else {
      return `Continue building fundamental competencies to support your ${primaryGoal} aspirations. You're on the right development path.`;
    }
  }

  private assessMarketDemand(primaryGoal: string, feedbackContent: any): string {
    const demandMap = {
      'technical': 'High demand - Technical skills remain in strong demand across industries',
      'management': 'Consistent demand - Management skills are valued across all sectors',
      'customer service': 'Growing demand - Customer experience focus drives demand for service excellence',
      'analyst': 'High demand - Data analysis and problem-solving skills are increasingly valuable',
      'consultant': 'Moderate demand - Consulting skills provide flexibility across industries'
    };

    const goalLower = primaryGoal.toLowerCase();
    for (const [key, demand] of Object.entries(demandMap)) {
      if (goalLower.includes(key)) {
        return demand;
      }
    }

    return 'Stable demand - Professional IT support skills maintain consistent market value';
  }

  private analyzeSkillGaps(feedbackContent: any, primaryGoal: string, experienceLevel: string): string[] {
    const gaps = [];
    const dimensions = feedbackContent.dimensions || {};
    const goalLower = primaryGoal.toLowerCase();

    // Technical gaps
    if (goalLower.includes('technical') && (dimensions.technical?.score || 0) < 80) {
      gaps.push('Advanced technical skills development needed for technical specialization');
    }

    // Leadership gaps
    if (goalLower.includes('manager') || goalLower.includes('lead')) {
      if ((dimensions.communication?.score || 0) < 85) {
        gaps.push('Leadership communication skills need strengthening for management roles');
      }
      if ((dimensions.problemSolving?.score || 0) < 80) {
        gaps.push('Strategic problem-solving capabilities need development for leadership');
      }
    }

    // Customer-facing gaps
    if (goalLower.includes('customer') && (dimensions.customerService?.score || 0) < 85) {
      gaps.push('Customer relationship management skills need enhancement');
    }

    return gaps.length > 0 ? gaps : ['No significant skill gaps identified for your career goals'];
  }

  private determineCommunicationStyle(profile: IndividualProfile, pattern: LearningPattern): 'formal' | 'casual' | 'encouraging' | 'direct' | 'analytical' {
    if (profile.personalityType === 'analytical') return 'analytical';
    if (profile.personalityType === 'driver') return 'direct';
    if (profile.personalityType === 'expressive') return 'encouraging';
    if (profile.personalityType === 'amiable') return 'encouraging';
    
    return 'casual'; // Default friendly approach
  }

  private determineDetailLevel(pattern: LearningPattern, history: any[]): 'summary' | 'moderate' | 'comprehensive' | 'granular' {
    if (pattern.informationProcessing === 'detail') return 'granular';
    if (pattern.informationProcessing === 'global') return 'summary';
    if (pattern.preferredPace === 'fast') return 'moderate';
    if (pattern.preferredPace === 'slow') return 'comprehensive';
    
    return 'moderate';
  }

  private determineExamplePreference(profile: IndividualProfile, pattern: LearningPattern): 'concrete' | 'abstract' | 'personal' | 'professional' | 'technical' {
    if (profile.experienceLevel === 'beginner') return 'concrete';
    if (profile.careerGoals.some(goal => goal.toLowerCase().includes('technical'))) return 'technical';
    if (pattern.feedbackStyle === 'motivational') return 'personal';
    if (profile.personalityType === 'analytical') return 'abstract';
    
    return 'professional';
  }

  private determineProgressEmphasis(profile: IndividualProfile, history: any[]): 'achievement' | 'improvement' | 'potential' | 'comparison' | 'journey' {
    if (profile.personalityType === 'driver') return 'achievement';
    if (profile.personalityType === 'expressive') return 'achievement';
    if (profile.personalityType === 'analytical') return 'comparison';
    if (profile.personalityType === 'amiable') return 'journey';
    
    const improvementRate = this.calculateImprovementRate(history);
    if (improvementRate > 5) return 'improvement';
    if (improvementRate < 1) return 'potential';
    
    return 'journey';
  }

  private determineGoalOrientation(profile: IndividualProfile, pattern: LearningPattern): 'short_term' | 'long_term' | 'milestone_based' | 'process_focused' {
    if (profile.personalityType === 'driver') return 'milestone_based';
    if (profile.personalityType === 'analytical') return 'long_term';
    if (pattern.challengePreference === 'breakthrough') return 'short_term';
    if (pattern.challengePreference === 'gradual') return 'process_focused';
    
    return 'milestone_based';
  }

  private async personalizeRecommendation(
    baseRecommendation: any,
    profile: IndividualProfile,
    pattern: LearningPattern
  ): Promise<PersonalizedRecommendation> {
    let personalizedText = baseRecommendation.description || baseRecommendation.title || '';
    const adaptationFactors = [];
    let relevanceScore = 70; // Base relevance

    // Adapt for learning style
    if (profile.learningStyle === 'kinesthetic') {
      personalizedText = personalizedText.replace(/study|read/gi, 'practice hands-on');
      adaptationFactors.push('kinesthetic learning preference');
      relevanceScore += 10;
    } else if (profile.learningStyle === 'visual') {
      personalizedText = personalizedText.replace(/understand/gi, 'visualize and understand');
      adaptationFactors.push('visual learning preference');
      relevanceScore += 5;
    }

    // Adapt for career goals
    if (profile.careerGoals.length > 0) {
      const primaryGoal = profile.careerGoals[0];
      personalizedText += ` This will directly support your ${primaryGoal} goals.`;
      adaptationFactors.push('career goal alignment');
      relevanceScore += 15;
    }

    // Adapt for personality type
    if (profile.personalityType === 'driver') {
      personalizedText = personalizedText.replace(/consider/gi, 'immediately focus on');
      adaptationFactors.push('driver personality - action-oriented');
      relevanceScore += 10;
    }

    return {
      recommendationType: baseRecommendation.type || 'learning',
      baseRecommendation: baseRecommendation.description || baseRecommendation.title || '',
      personalizedRecommendation: personalizedText,
      relevanceScore,
      adaptationFactors,
      implementationGuidance: this.generateImplementationGuidance(baseRecommendation, profile, pattern),
      successPredictors: this.generateSuccessPredictors(baseRecommendation, profile)
    };
  }

  private generateImplementationGuidance(recommendation: any, profile: IndividualProfile, pattern: LearningPattern): string {
    let guidance = '';

    if (pattern.preferredPace === 'fast') {
      guidance = 'Implement rapidly with intensive practice sessions. ';
    } else if (pattern.preferredPace === 'slow') {
      guidance = 'Take a steady, methodical approach with regular review sessions. ';
    }

    if (profile.learningStyle === 'kinesthetic') {
      guidance += 'Focus on hands-on practice and real-world application. ';
    } else if (profile.learningStyle === 'visual') {
      guidance += 'Use visual aids, diagrams, and progress tracking charts. ';
    }

    guidance += 'Track your progress regularly and adjust your approach based on results.';

    return guidance;
  }

  private generateSuccessPredictors(recommendation: any, profile: IndividualProfile): string[] {
    const predictors = [];

    if (profile.motivationFactors.includes('achievement')) {
      predictors.push('High achievement motivation increases success likelihood');
    }

    if (profile.strengthAreas.length > 0) {
      predictors.push('Existing strengths provide foundation for building new competencies');
    }

    if (profile.experienceLevel !== 'beginner') {
      predictors.push('Professional experience supports faster skill acquisition');
    }

    predictors.push('Consistent practice and feedback integration are key success factors');

    return predictors;
  }
}

export const personalizationEngine = new PersonalizationEngine();