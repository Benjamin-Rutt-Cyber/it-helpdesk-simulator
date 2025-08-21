import { feedbackGenerator } from '../feedbackGenerator';
import { positiveReinforcementEngine } from '../positiveReinforcementEngine';
import { professionalLanguageEngine } from '../professionalLanguageEngine';
import { contextualGuidanceEngine } from '../contextualGuidanceEngine';
import { skillDevelopmentEngine } from '../skillDevelopmentEngine';
import { multiModalFeedbackEngine } from '../multiModalFeedbackEngine';
import { personalizationEngine } from '../personalizationEngine';

describe('Feedback Generation System', () => {
  const mockPerformanceData = {
    overall: 75,
    dimensions: {
      technical: {
        accuracy: 80,
        efficiency: 70,
        knowledge: 75,
        innovation: 65
      },
      communication: {
        clarity: 85,
        empathy: 90,
        responsiveness: 80,
        documentation: 75
      },
      procedural: {
        compliance: 95,
        security: 90,
        escalation: 85,
        documentation: 80
      },
      customerService: {
        satisfaction: 88,
        relationship: 85,
        professionalism: 90,
        followUp: 82
      }
    }
  };

  const mockSessionData = {
    actions: [
      { id: '1', type: 'initial_assessment', quality: 75, timestamp: new Date() },
      { id: '2', type: 'research', quality: 80, timestamp: new Date() },
      { id: '3', type: 'diagnosis', quality: 85, timestamp: new Date() },
      { id: '4', type: 'solution', quality: 78, timestamp: new Date() },
      { id: '5', type: 'customer_communication', quality: 90, timestamp: new Date() },
      { id: '6', type: 'verification', quality: 82, timestamp: new Date() }
    ]
  };

  const mockContext = {
    scenarioId: 'test-scenario-1',
    difficulty: 75,
    customerType: 'frustrated',
    timeConstraints: 60
  };

  describe('FeedbackGenerator Core Functionality', () => {
    it('should generate comprehensive feedback with all required components', async () => {
      const feedback = await feedbackGenerator.generateComprehensiveFeedback(
        mockSessionData,
        mockPerformanceData,
        mockContext
      );

      expect(feedback).toHaveProperty('overall');
      expect(feedback).toHaveProperty('technical');
      expect(feedback).toHaveProperty('communication');
      expect(feedback).toHaveProperty('professional');

      expect(feedback.overall).toHaveProperty('summary');
      expect(feedback.overall).toHaveProperty('keyStrengths');
      expect(feedback.overall).toHaveProperty('improvementAreas');
      expect(feedback.overall).toHaveProperty('nextSteps');

      expect(Array.isArray(feedback.overall.keyStrengths)).toBe(true);
      expect(Array.isArray(feedback.overall.improvementAreas)).toBe(true);
      expect(Array.isArray(feedback.overall.nextSteps)).toBe(true);
    });

    it('should generate action-specific feedback for each action', async () => {
      const actionFeedbacks = await feedbackGenerator.generateActionFeedbacks(mockSessionData.actions);

      expect(actionFeedbacks).toHaveLength(mockSessionData.actions.length);
      
      actionFeedbacks.forEach(feedback => {
        expect(feedback).toHaveProperty('actionId');
        expect(feedback).toHaveProperty('actionType');
        expect(feedback).toHaveProperty('feedback');
        expect(feedback.feedback).toHaveProperty('whatYouDid');
        expect(feedback.feedback).toHaveProperty('whyItMattered');
        expect(feedback.feedback).toHaveProperty('howItPerformed');
        expect(feedback.feedback).toHaveProperty('whatCouldImprove');
        expect(feedback.feedback).toHaveProperty('learningConnection');
      });
    });

    it('should generate actionable recommendations', async () => {
      const recommendations = await feedbackGenerator.generateActionableRecommendations(
        mockPerformanceData,
        mockContext
      );

      expect(Array.isArray(recommendations)).toBe(true);
      
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('actionSteps');
        expect(rec).toHaveProperty('resources');
        expect(rec).toHaveProperty('timeline');
        expect(rec).toHaveProperty('impact');
        expect(rec).toHaveProperty('successMeasures');
        
        expect(['high', 'medium', 'low']).toContain(rec.priority);
        expect(Array.isArray(rec.actionSteps)).toBe(true);
        expect(Array.isArray(rec.resources)).toBe(true);
        expect(Array.isArray(rec.successMeasures)).toBe(true);
      });
    });

    it('should generate improvement suggestions with proper timeframes', async () => {
      const suggestions = await feedbackGenerator.generateImprovementSuggestions(
        mockPerformanceData,
        mockContext
      );

      expect(suggestions).toHaveProperty('immediate');
      expect(suggestions).toHaveProperty('shortTerm');
      expect(suggestions).toHaveProperty('longTerm');
      expect(suggestions).toHaveProperty('resources');

      expect(Array.isArray(suggestions.immediate)).toBe(true);
      expect(Array.isArray(suggestions.shortTerm)).toBe(true);
      expect(Array.isArray(suggestions.longTerm)).toBe(true);
      expect(Array.isArray(suggestions.resources)).toBe(true);
    });
  });

  describe('Positive Reinforcement Engine', () => {
    const mockAchievements = [];
    const mockSessionHistory = [
      { overall: 70, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { overall: 72, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
      { overall: 75, timestamp: new Date() }
    ];

    it('should generate positive reinforcement with achievements', async () => {
      const reinforcement = await positiveReinforcementEngine.generatePositiveReinforcement(
        mockPerformanceData,
        mockSessionHistory,
        mockContext
      );

      expect(reinforcement).toHaveProperty('achievements');
      expect(reinforcement).toHaveProperty('strengthHighlights');
      expect(reinforcement).toHaveProperty('successCelebrations');
      expect(reinforcement).toHaveProperty('competencyValidations');
      expect(reinforcement).toHaveProperty('overallEncouragement');

      expect(Array.isArray(reinforcement.achievements)).toBe(true);
      expect(Array.isArray(reinforcement.strengthHighlights)).toBe(true);
      expect(Array.isArray(reinforcement.successCelebrations)).toBe(true);
      expect(Array.isArray(reinforcement.competencyValidations)).toBe(true);
    });

    it('should recognize achievements with proper metadata', async () => {
      const achievements = await positiveReinforcementEngine.recognizeAchievements(
        mockPerformanceData,
        mockSessionHistory
      );

      achievements.forEach(achievement => {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('type');
        expect(achievement).toHaveProperty('title');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('earnedAt');
        expect(achievement).toHaveProperty('evidence');
        expect(achievement).toHaveProperty('impact');
        expect(achievement).toHaveProperty('level');

        expect(['milestone', 'skill_mastery', 'consistency', 'improvement', 'excellence', 'innovation']).toContain(achievement.type);
        expect(['bronze', 'silver', 'gold', 'platinum']).toContain(achievement.level);
        expect(Array.isArray(achievement.evidence)).toBe(true);
      });
    });

    it('should highlight strengths with professional context', async () => {
      const highlights = await positiveReinforcementEngine.highlightStrengths(mockPerformanceData);

      highlights.forEach(highlight => {
        expect(highlight).toHaveProperty('dimension');
        expect(highlight).toHaveProperty('competency');
        expect(highlight).toHaveProperty('score');
        expect(highlight).toHaveProperty('evidence');
        expect(highlight).toHaveProperty('professionalValue');
        expect(highlight).toHaveProperty('buildingRecommendations');
        expect(highlight).toHaveProperty('careerRelevance');

        expect(highlight.score).toBeGreaterThanOrEqual(75);
        expect(Array.isArray(highlight.evidence)).toBe(true);
        expect(Array.isArray(highlight.buildingRecommendations)).toBe(true);
      });
    });
  });

  describe('Professional Language Engine', () => {
    const mockCareerGoals = ['technical specialist', 'team leadership'];
    const mockAchievements = [
      { id: '1', title: 'Technical Excellence Bronze', level: 'bronze', description: 'Strong technical performance' }
    ];

    it('should convert feedback to professional language', async () => {
      const professionalFeedback = await professionalLanguageEngine.convertToProfessionalLanguage(
        { dimensions: mockPerformanceData.dimensions },
        mockContext
      );

      expect(Array.isArray(professionalFeedback)).toBe(true);
      
      professionalFeedback.forEach(feedback => {
        expect(feedback).toHaveProperty('observation');
        expect(feedback).toHaveProperty('assessment');
        expect(feedback).toHaveProperty('recommendation');
        expect(feedback).toHaveProperty('industryContext');
        expect(feedback).toHaveProperty('careerImplication');

        expect(typeof feedback.observation).toBe('string');
        expect(typeof feedback.assessment).toBe('string');
        expect(typeof feedback.recommendation).toBe('string');
        expect(typeof feedback.industryContext).toBe('string');
        expect(typeof feedback.careerImplication).toBe('string');
      });
    });

    it('should generate career development language', async () => {
      const careerLanguage = await professionalLanguageEngine.generateCareerDevelopmentLanguage(
        mockPerformanceData
      );

      expect(Array.isArray(careerLanguage)).toBe(true);
      
      careerLanguage.forEach(lang => {
        expect(lang).toHaveProperty('skillLevel');
        expect(lang).toHaveProperty('competencyArea');
        expect(lang).toHaveProperty('professionalDescription');
        expect(lang).toHaveProperty('industryStandards');
        expect(lang).toHaveProperty('marketValue');
        expect(lang).toHaveProperty('advancementPath');

        expect(['entry', 'intermediate', 'advanced', 'expert']).toContain(lang.skillLevel);
        expect(Array.isArray(lang.industryStandards)).toBe(true);
      });
    });

    it('should create employer-suitable presentation', async () => {
      const presentation = await professionalLanguageEngine.createEmployerSuitablePresentation(
        mockPerformanceData,
        mockAchievements,
        mockContext
      );

      expect(presentation).toHaveProperty('executiveSummary');
      expect(presentation).toHaveProperty('coreCompetencies');
      expect(presentation).toHaveProperty('professionalAchievements');
      expect(presentation).toHaveProperty('industryAlignment');
      expect(presentation).toHaveProperty('readinessAssessment');
      expect(presentation).toHaveProperty('recommendedPositions');

      expect(Array.isArray(presentation.coreCompetencies)).toBe(true);
      expect(Array.isArray(presentation.professionalAchievements)).toBe(true);
      expect(Array.isArray(presentation.recommendedPositions)).toBe(true);
    });
  });

  describe('Contextual Guidance Engine', () => {
    const mockScenarioContext = {
      type: 'advanced' as const,
      domain: 'technical_support',
      complexity: 85,
      expectedDuration: 45,
      requiredSkills: ['advanced_troubleshooting', 'customer_management'],
      commonChallenges: ['time_pressure', 'complex_technical_issue'],
      successFactors: ['systematic_approach', 'clear_communication']
    };

    const mockContextualFactors = {
      scenarioComplexity: 85,
      customerBehavior: 80,
      timeConstraints: 90,
      resourceLimitations: 60,
      technicalDifficulty: 88,
      environmentalChallenges: 70
    };

    it('should generate scenario-aware feedback', async () => {
      const contextualFeedback = await contextualGuidanceEngine.generateScenarioAwareFeedback(
        mockPerformanceData,
        mockScenarioContext,
        mockContextualFactors
      );

      expect(Array.isArray(contextualFeedback)).toBe(true);
      
      contextualFeedback.forEach(feedback => {
        expect(feedback).toHaveProperty('originalFeedback');
        expect(feedback).toHaveProperty('contextualAdjustment');
        expect(feedback).toHaveProperty('situationalConsiderations');
        expect(feedback).toHaveProperty('adaptedRecommendations');
        expect(feedback).toHaveProperty('contextualStrengths');
        expect(feedback).toHaveProperty('environmentalFactors');

        expect(Array.isArray(feedback.situationalConsiderations)).toBe(true);
        expect(Array.isArray(feedback.adaptedRecommendations)).toBe(true);
        expect(Array.isArray(feedback.contextualStrengths)).toBe(true);
        expect(Array.isArray(feedback.environmentalFactors)).toBe(true);
      });
    });

    it('should adapt feedback to situational factors', async () => {
      const adaptedFeedback = await contextualGuidanceEngine.adaptFeedbackToSituation(
        'Your technical performance was good',
        mockContextualFactors,
        mockScenarioContext
      );

      expect(adaptedFeedback).toHaveProperty('baseAssessment');
      expect(adaptedFeedback).toHaveProperty('contextualModifier');
      expect(adaptedFeedback).toHaveProperty('situationalRelevance');
      expect(adaptedFeedback).toHaveProperty('adaptedGuidance');
      expect(adaptedFeedback).toHaveProperty('complexityAcknowledgment');
      expect(adaptedFeedback).toHaveProperty('environmentalConsiderations');

      expect(Array.isArray(adaptedFeedback.environmentalConsiderations)).toBe(true);
    });

    it('should generate complexity-adjusted feedback', async () => {
      const complexityFeedback = await contextualGuidanceEngine.generateComplexityAdjustedFeedback(
        75,
        85,
        'technical'
      );

      expect(complexityFeedback).toHaveProperty('originalScore');
      expect(complexityFeedback).toHaveProperty('complexityAdjustedScore');
      expect(complexityFeedback).toHaveProperty('complexityLevel');
      expect(complexityFeedback).toHaveProperty('complexityDescription');
      expect(complexityFeedback).toHaveProperty('contextualRecognition');
      expect(complexityFeedback).toHaveProperty('adaptedExpectations');
      expect(complexityFeedback).toHaveProperty('situationalGuidance');

      expect(['basic', 'intermediate', 'advanced', 'expert']).toContain(complexityFeedback.complexityLevel);
      expect(complexityFeedback.complexityAdjustedScore).toBeGreaterThanOrEqual(complexityFeedback.originalScore);
    });
  });

  describe('Skill Development Engine', () => {
    const mockLearningHistory = [
      { overall: 65, timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      { overall: 70, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { overall: 75, timestamp: new Date() }
    ];

    it('should generate learning-oriented feedback', async () => {
      const learningFeedback = await skillDevelopmentEngine.generateLearningOrientedFeedback(
        mockPerformanceData,
        mockLearningHistory,
        mockContext
      );

      expect(learningFeedback).toHaveProperty('skillGapAnalysis');
      expect(learningFeedback).toHaveProperty('learningOpportunities');
      expect(learningFeedback).toHaveProperty('competencyDevelopmentPlans');
      expect(learningFeedback).toHaveProperty('practiceRecommendations');
      expect(learningFeedback).toHaveProperty('learningPathGuidance');
      expect(learningFeedback).toHaveProperty('growthMindsetReinforcement');

      expect(Array.isArray(learningFeedback.skillGapAnalysis)).toBe(true);
      expect(Array.isArray(learningFeedback.learningOpportunities)).toBe(true);
      expect(Array.isArray(learningFeedback.competencyDevelopmentPlans)).toBe(true);
      expect(Array.isArray(learningFeedback.practiceRecommendations)).toBe(true);
    });

    it('should create skill progression guidance', async () => {
      const progressionMaps = await skillDevelopmentEngine.createSkillProgressionGuidance(
        mockPerformanceData
      );

      expect(Array.isArray(progressionMaps)).toBe(true);
      
      progressionMaps.forEach(map => {
        expect(map).toHaveProperty('competency');
        expect(map).toHaveProperty('currentScore');
        expect(map).toHaveProperty('targetScore');
        expect(map).toHaveProperty('growthPotential');
        expect(map).toHaveProperty('developmentPhases');
        expect(map).toHaveProperty('milestones');
        expect(map).toHaveProperty('accelerators');
        expect(map).toHaveProperty('barriers');

        expect(Array.isArray(map.developmentPhases)).toBe(true);
        expect(Array.isArray(map.milestones)).toBe(true);
        expect(Array.isArray(map.accelerators)).toBe(true);
        expect(Array.isArray(map.barriers)).toBe(true);
      });
    });

    it('should generate competency development recommendations', async () => {
      const mockLearningPreferences = {
        learningStyle: 'visual',
        pace: 'moderate'
      };

      const developmentPlans = await skillDevelopmentEngine.generateCompetencyDevelopmentRecommendations(
        mockPerformanceData,
        mockLearningPreferences
      );

      expect(Array.isArray(developmentPlans)).toBe(true);
      
      developmentPlans.forEach(plan => {
        expect(plan).toHaveProperty('competencyArea');
        expect(plan).toHaveProperty('currentAssessment');
        expect(plan).toHaveProperty('developmentGoals');
        expect(plan).toHaveProperty('learningObjectives');
        expect(plan).toHaveProperty('skillProgression');
        expect(plan).toHaveProperty('practiceRecommendations');
        expect(plan).toHaveProperty('mentorshipGuidance');
        expect(plan).toHaveProperty('continuousLearningStrategy');

        expect(Array.isArray(plan.developmentGoals)).toBe(true);
        expect(Array.isArray(plan.learningObjectives)).toBe(true);
        expect(Array.isArray(plan.practiceRecommendations)).toBe(true);
        expect(Array.isArray(plan.mentorshipGuidance)).toBe(true);
      });
    });
  });

  describe('Multi-Modal Feedback Engine', () => {
    const mockUserPreferences = {
      formats: ['text', 'visual'],
      learningStyle: 'visual',
      interactivity: 'moderate'
    };

    it('should create text-based feedback in multiple formats', async () => {
      const textFormats = await multiModalFeedbackEngine.createTextBasedFeedback(
        mockPerformanceData,
        mockUserPreferences
      );

      expect(Array.isArray(textFormats)).toBe(true);
      expect(textFormats.length).toBeGreaterThan(0);
      
      textFormats.forEach(format => {
        expect(format).toHaveProperty('type');
        expect(format).toHaveProperty('content');
        expect(format).toHaveProperty('readingLevel');
        expect(format).toHaveProperty('tone');
        expect(format).toHaveProperty('wordCount');
        expect(format).toHaveProperty('estimatedReadTime');

        expect(['summary', 'detailed', 'bullet_points', 'narrative', 'conversational']).toContain(format.type);
        expect(['basic', 'intermediate', 'advanced']).toContain(format.readingLevel);
        expect(['formal', 'friendly', 'motivational', 'instructional']).toContain(format.tone);
        expect(format.wordCount).toBeGreaterThan(0);
      });
    });

    it('should build visual feedback presentations', async () => {
      const visualFormats = await multiModalFeedbackEngine.buildVisualFeedbackPresentations(
        mockPerformanceData,
        mockContext
      );

      expect(Array.isArray(visualFormats)).toBe(true);
      expect(visualFormats.length).toBeGreaterThan(0);
      
      visualFormats.forEach(format => {
        expect(format).toHaveProperty('type');
        expect(format).toHaveProperty('title');
        expect(format).toHaveProperty('description');
        expect(format).toHaveProperty('dataVisualization');
        expect(format).toHaveProperty('accessibility');
        expect(format).toHaveProperty('interactivity');

        expect(['chart', 'infographic', 'diagram', 'progress_bar', 'scorecard', 'timeline']).toContain(format.type);
        
        expect(format.accessibility).toHaveProperty('altText');
        expect(format.accessibility).toHaveProperty('colorBlindFriendly');
        expect(format.accessibility).toHaveProperty('screenReaderCompatible');
        expect(format.accessibility).toHaveProperty('highContrast');
        expect(format.accessibility).toHaveProperty('scalableText');
      });
    });

    it('should create interactive feedback elements', async () => {
      const interactiveFormats = await multiModalFeedbackEngine.addInteractiveFeedbackElements(
        mockPerformanceData,
        mockUserPreferences
      );

      expect(Array.isArray(interactiveFormats)).toBe(true);
      expect(interactiveFormats.length).toBeGreaterThan(0);
      
      interactiveFormats.forEach(format => {
        expect(format).toHaveProperty('type');
        expect(format).toHaveProperty('title');
        expect(format).toHaveProperty('description');
        expect(format).toHaveProperty('interactionElements');
        expect(format).toHaveProperty('progressTracking');
        expect(format).toHaveProperty('adaptiveContent');

        expect(['quiz', 'checklist', 'action_plan', 'drill_down', 'comparison', 'goal_setting']).toContain(format.type);
        expect(Array.isArray(format.interactionElements)).toBe(true);
        expect(typeof format.progressTracking).toBe('boolean');
        expect(typeof format.adaptiveContent).toBe('boolean');
      });
    });

    it('should create accessible feedback formats', async () => {
      const accessibleFormats = await multiModalFeedbackEngine.createAccessibleFeedbackFormats(
        mockPerformanceData
      );

      expect(Array.isArray(accessibleFormats)).toBe(true);
      expect(accessibleFormats.length).toBeGreaterThan(0);
      
      accessibleFormats.forEach(format => {
        expect(format).toHaveProperty('type');
        expect(format).toHaveProperty('content');
        expect(format).toHaveProperty('description');
        expect(format).toHaveProperty('compatibility');

        expect(['screen_reader', 'large_print', 'high_contrast', 'audio_only', 'simplified']).toContain(format.type);
        expect(Array.isArray(format.compatibility)).toBe(true);
        expect(format.content.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Personalization Engine', () => {
    const mockUserHistory = [
      { overall: 65, dimensions: { technical: 60, communication: 70 } },
      { overall: 70, dimensions: { technical: 68, communication: 72 } },
      { overall: 75, dimensions: { technical: 73, communication: 77 } }
    ];

    const mockIndividualProfile = {
      userId: 'test-user-1',
      learningStyle: 'visual' as const,
      personalityType: 'analytical' as const,
      motivationFactors: ['achievement', 'recognition'],
      careerGoals: ['technical specialist'],
      experienceLevel: 'intermediate' as const,
      strengthAreas: ['communication'],
      challengeAreas: ['technical'],
      culturalConsiderations: ['low_context'],
      accessibilityNeeds: []
    };

    it('should create learning pattern analysis', async () => {
      const learningPattern = await personalizationEngine.createLearningPatternAnalysis(
        mockUserHistory,
        mockPerformanceData,
        mockUserPreferences
      );

      expect(learningPattern).toHaveProperty('preferredPace');
      expect(learningPattern).toHaveProperty('informationProcessing');
      expect(learningPattern).toHaveProperty('feedbackStyle');
      expect(learningPattern).toHaveProperty('challengePreference');
      expect(learningPattern).toHaveProperty('retentionMethod');

      expect(['slow', 'moderate', 'fast', 'variable']).toContain(learningPattern.preferredPace);
      expect(['sequential', 'random', 'global', 'detail']).toContain(learningPattern.informationProcessing);
      expect(['direct', 'supportive', 'analytical', 'motivational']).toContain(learningPattern.feedbackStyle);
      expect(['gradual', 'steep', 'varied', 'breakthrough']).toContain(learningPattern.challengePreference);
      expect(['repetition', 'application', 'visualization', 'conceptual']).toContain(learningPattern.retentionMethod);
    });

    it('should generate personalized feedback content', async () => {
      const mockLearningPattern = {
        preferredPace: 'moderate' as const,
        informationProcessing: 'sequential' as const,
        feedbackStyle: 'analytical' as const,
        challengePreference: 'gradual' as const,
        retentionMethod: 'visualization' as const
      };

      const originalFeedback = {
        summary: 'Your performance shows strong competency',
        technical: 'Technical skills are developing well',
        communication: 'Communication excellence demonstrated'
      };

      const personalizedContent = await personalizationEngine.generatePersonalizedFeedback(
        originalFeedback,
        mockIndividualProfile,
        mockLearningPattern
      );

      expect(Array.isArray(personalizedContent)).toBe(true);
      expect(personalizedContent.length).toBeGreaterThan(0);
      
      personalizedContent.forEach(content => {
        expect(content).toHaveProperty('contentType');
        expect(content).toHaveProperty('originalContent');
        expect(content).toHaveProperty('personalizedContent');
        expect(content).toHaveProperty('adaptationReasons');
        expect(content).toHaveProperty('confidenceScore');
        expect(content).toHaveProperty('culturalSensitivity');
        expect(content).toHaveProperty('accessibilityCompliant');

        expect(Array.isArray(content.adaptationReasons)).toBe(true);
        expect(content.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(content.confidenceScore).toBeLessThanOrEqual(100);
        expect(typeof content.culturalSensitivity).toBe('boolean');
        expect(typeof content.accessibilityCompliant).toBe('boolean');
      });
    });

    it('should adapt content to learning style', async () => {
      const originalContent = 'Your technical performance demonstrates competency';
      
      const visualAdapted = await personalizationEngine.adaptToLearningStyle(
        originalContent,
        'visual',
        'feedback'
      );
      
      const auditoryAdapted = await personalizationEngine.adaptToLearningStyle(
        originalContent,
        'auditory',
        'feedback'
      );
      
      const kinestheticAdapted = await personalizationEngine.adaptToLearningStyle(
        originalContent,
        'kinesthetic',
        'feedback'
      );

      expect(visualAdapted).not.toBe(originalContent);
      expect(auditoryAdapted).not.toBe(originalContent);
      expect(kinestheticAdapted).not.toBe(originalContent);
      
      expect(visualAdapted).toContain('📊'); // Visual elements
      expect(auditoryAdapted).toContain('Let me tell you'); // Conversational elements
      expect(kinestheticAdapted).toContain('actively'); // Action-oriented language
    });

    it('should create career goal alignment', async () => {
      const careerAlignment = await personalizationEngine.createCareerGoalAlignment(
        mockPerformanceData,
        ['technical specialist', 'team lead'],
        'intermediate'
      );

      expect(careerAlignment).toHaveProperty('careerStage');
      expect(careerAlignment).toHaveProperty('industryContext');
      expect(careerAlignment).toHaveProperty('roleRelevance');
      expect(careerAlignment).toHaveProperty('competencyAlignment');
      expect(careerAlignment).toHaveProperty('careerProgression');
      expect(careerAlignment).toHaveProperty('marketDemand');
      expect(careerAlignment).toHaveProperty('skillGapAnalysis');

      expect(['entry_level', 'career_change', 'advancement', 'specialization', 'leadership']).toContain(careerAlignment.careerStage);
      expect(Array.isArray(careerAlignment.competencyAlignment)).toBe(true);
      expect(Array.isArray(careerAlignment.skillGapAnalysis)).toBe(true);
      expect(careerAlignment.roleRelevance).toBeGreaterThanOrEqual(0);
      expect(careerAlignment.roleRelevance).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration Tests', () => {
    it('should integrate all feedback engines for complete feedback generation', async () => {
      // Test full feedback generation pipeline
      const comprehensiveFeedback = await feedbackGenerator.generateComprehensiveFeedback(
        mockSessionData,
        mockPerformanceData,
        mockContext
      );

      const positiveReinforcement = await positiveReinforcementEngine.generatePositiveReinforcement(
        mockPerformanceData,
        [mockPerformanceData],
        mockContext
      );

      const professionalLanguage = await professionalLanguageEngine.convertToProfessionalLanguage(
        comprehensiveFeedback,
        mockContext
      );

      const multiModalPresentation = await multiModalFeedbackEngine.generateComprehensiveMultiModalFeedback(
        comprehensiveFeedback,
        { formats: ['text', 'visual'], learningStyle: 'visual' },
        { needs: [] }
      );

      // Verify integration
      expect(comprehensiveFeedback).toBeDefined();
      expect(positiveReinforcement).toBeDefined();
      expect(professionalLanguage).toBeDefined();
      expect(multiModalPresentation).toBeDefined();

      // Verify data flow
      expect(professionalLanguage.length).toBeGreaterThan(0);
      expect(multiModalPresentation.textFormats.length).toBeGreaterThan(0);
      expect(multiModalPresentation.visualFormats.length).toBeGreaterThan(0);
      expect(positiveReinforcement.achievements.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle edge cases and invalid inputs gracefully', async () => {
      // Test with minimal/invalid data
      const emptyPerformanceData = { overall: 0, dimensions: {} };
      const emptySessionData = { actions: [] };

      await expect(feedbackGenerator.generateComprehensiveFeedback(
        emptySessionData,
        emptyPerformanceData,
        {}
      )).resolves.toBeDefined();

      await expect(positiveReinforcementEngine.generatePositiveReinforcement(
        emptyPerformanceData,
        [],
        {}
      )).resolves.toBeDefined();

      await expect(professionalLanguageEngine.convertToProfessionalLanguage(
        { dimensions: {} },
        {}
      )).resolves.toBeDefined();
    });

    it('should maintain consistency across different feedback formats', async () => {
      const baseFeedback = await feedbackGenerator.generateComprehensiveFeedback(
        mockSessionData,
        mockPerformanceData,
        mockContext
      );

      const textFormats = await multiModalFeedbackEngine.createTextBasedFeedback(
        baseFeedback,
        { formats: ['text'] }
      );

      const visualFormats = await multiModalFeedbackEngine.buildVisualFeedbackPresentations(
        mockPerformanceData,
        mockContext
      );

      // Verify consistency in key metrics
      const overallScore = mockPerformanceData.overall;
      
      textFormats.forEach(format => {
        expect(format.content).toContain(overallScore.toString());
      });

      // Visual formats should reflect the same performance data
      visualFormats.forEach(format => {
        expect(format.dataVisualization.data).toBeDefined();
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should generate feedback within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await feedbackGenerator.generateComprehensiveFeedback(
        mockSessionData,
        mockPerformanceData,
        mockContext
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(executionTime).toBeLessThan(5000);
    });

    it('should handle large datasets efficiently', async () => {
      // Create large mock dataset
      const largeSessionData = {
        actions: Array.from({ length: 100 }, (_, i) => ({
          id: `action-${i}`,
          type: 'research',
          quality: Math.floor(Math.random() * 40) + 60,
          timestamp: new Date()
        }))
      };

      const startTime = Date.now();
      
      const feedback = await feedbackGenerator.generateActionFeedbacks(largeSessionData.actions);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(feedback).toHaveLength(100);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});

describe('Error Handling and Resilience', () => {
  it('should handle malformed performance data', async () => {
    const malformedData = {
      overall: 'not-a-number',
      dimensions: {
        technical: null,
        communication: undefined,
        procedural: 'invalid'
      }
    };

    await expect(feedbackGenerator.generateComprehensiveFeedback(
      { actions: [] },
      malformedData,
      {}
    )).resolves.toBeDefined();
  });

  it('should provide meaningful error messages', async () => {
    try {
      await feedbackGenerator.generateComprehensiveFeedback(null as any, null as any, null as any);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Failed to generate comprehensive feedback');
    }
  });

  it('should handle missing optional parameters', async () => {
    const minimalData = { overall: 75, dimensions: { technical: 80 } };
    const minimalSession = { actions: [{ id: '1', type: 'research', quality: 75, timestamp: new Date() }] };

    const feedback = await feedbackGenerator.generateComprehensiveFeedback(
      minimalSession,
      minimalData,
      {}
    );

    expect(feedback).toBeDefined();
    expect(feedback.overall).toBeDefined();
  });
});