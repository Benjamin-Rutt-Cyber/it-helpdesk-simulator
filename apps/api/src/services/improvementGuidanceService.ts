import { logger } from '../utils/logger';
import { ResearchTracker, BehavioralPattern, CommonMistake, EffectiveStrategy, ResearchSession } from './researchTracker';

export interface PersonalizedFeedback {
  id: string;
  userId: string;
  sessionId?: string;
  timestamp: Date;
  feedbackType: 'strengths' | 'improvements' | 'specific_guidance' | 'strategic_advice';
  category: 'search_strategy' | 'source_evaluation' | 'time_management' | 'critical_thinking' | 'overall_performance';
  message: string;
  actionableSteps: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedImpact: {
    timeReduction: number; // milliseconds
    qualityImprovement: number; // 0-100
    efficiencyGain: number; // 0-100
  };
  personalizedElements: {
    userName: string;
    currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    specificWeaknesses: string[];
    specificStrengths: string[];
  };
}

export interface SkillDevelopmentSuggestion {
  id: string;
  skillArea: 'search_refinement' | 'credibility_assessment' | 'information_synthesis' | 'time_efficiency' | 'strategic_thinking';
  currentLevel: number; // 0-100
  targetLevel: number; // 0-100
  difficulty: 'easy' | 'moderate' | 'challenging' | 'advanced';
  timeToComplete: number; // milliseconds
  practiceActivities: PracticeActivity[];
  progressMilestones: ProgressMilestone[];
  prerequisites: string[];
  benefits: string[];
  relevantScenarios: string[];
}

export interface PracticeActivity {
  id: string;
  name: string;
  description: string;
  type: 'guided_practice' | 'scenario_based' | 'skill_drill' | 'reflection_exercise' | 'peer_comparison';
  estimatedTime: number; // milliseconds
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  instructions: string[];
  successCriteria: string[];
  feedback: {
    immediate: string[];
    delayed: string[];
    comparative: string[];
  };
}

export interface ProgressMilestone {
  id: string;
  name: string;
  description: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  achieved: boolean;
  achievedDate?: Date;
  reward: string;
  nextMilestone?: string;
}

export interface ResearchStrategyCoaching {
  userId: string;
  sessionId?: string;
  timestamp: Date;
  coachingType: 'real_time' | 'post_session' | 'proactive' | 'on_demand';
  strategy: EffectiveStrategy;
  currentApplication: {
    correctUsage: boolean;
    efficiencyScore: number;
    commonMistakes: string[];
    improvementOpportunities: string[];
  };
  guidance: {
    whatToDo: string[];
    howToDo: string[];
    whenToDo: string[];
    whyImportant: string[];
    commonPitfalls: string[];
  };
  practiceRecommendations: string[];
  followUpActions: string[];
}

export interface ProgressiveSkillBuilding {
  userId: string;
  skillTrack: 'research_mastery' | 'efficiency_optimization' | 'critical_evaluation' | 'strategic_thinking';
  currentStage: number;
  totalStages: number;
  stages: SkillStage[];
  overallProgress: number; // 0-100
  estimatedCompletionTime: number; // milliseconds
  adaptiveAdjustments: AdaptiveAdjustment[];
}

export interface SkillStage {
  stageNumber: number;
  name: string;
  description: string;
  objectives: string[];
  activities: PracticeActivity[];
  assessmentCriteria: string[];
  minimumScore: number;
  completed: boolean;
  completedDate?: Date;
  timeSpent: number; // milliseconds
  attempts: number;
  bestScore: number;
}

export interface AdaptiveAdjustment {
  timestamp: Date;
  reason: string;
  adjustment: 'skip_stage' | 'repeat_stage' | 'adjust_difficulty' | 'change_approach' | 'add_support';
  impact: string;
  rationale: string;
}

export class ImprovementGuidanceService {
  private researchTracker: ResearchTracker;
  private personalizedFeedback: Map<string, PersonalizedFeedback[]> = new Map(); // userId -> feedback
  private skillDevelopmentSuggestions: Map<string, SkillDevelopmentSuggestion[]> = new Map();
  private progressiveSkillBuilding: Map<string, ProgressiveSkillBuilding> = new Map();
  private researchStrategyCoaching: Map<string, ResearchStrategyCoaching[]> = new Map();

  constructor(researchTracker: ResearchTracker) {
    this.researchTracker = researchTracker;
  }

  // Task 6: Improvement Guidance System Implementation
  async generatePersonalizedFeedback(userId: string, sessionId?: string): Promise<PersonalizedFeedback[]> {
    try {
      logger.info(`Generating personalized feedback for user ${userId}`);

      const behavioralAnalysis = await this.researchTracker.analyzeBehavioralPatterns(userId);
      const efficiencyMetrics = await this.researchTracker.getResearchEfficiencyMetrics(userId);
      const benchmarkComparison = await this.researchTracker.compareWithBenchmarks(userId);

      const feedback: PersonalizedFeedback[] = [];

      // Generate strength-based feedback
      if (benchmarkComparison.strengths.length > 0) {
        feedback.push({
          id: `strength-feedback-${Date.now()}`,
          userId,
          sessionId,
          timestamp: new Date(),
          feedbackType: 'strengths',
          category: 'overall_performance',
          message: `Great job! You're excelling in: ${benchmarkComparison.strengths.join(', ')}. Keep up the excellent work!`,
          actionableSteps: [
            'Continue using your current effective approaches',
            'Consider sharing your strategies with peers',
            'Apply these strengths to more challenging scenarios'
          ],
          priority: 'medium',
          expectedImpact: {
            timeReduction: 30000,
            qualityImprovement: 10,
            efficiencyGain: 15
          },
          personalizedElements: {
            userName: 'User', // Would be populated from user profile
            currentLevel: this.determineUserLevel(efficiencyMetrics),
            learningStyle: 'visual', // Would be determined from user behavior
            specificWeaknesses: benchmarkComparison.weaknesses,
            specificStrengths: benchmarkComparison.strengths
          }
        });
      }

      // Generate improvement feedback for weaknesses
      benchmarkComparison.weaknesses.forEach((weakness, index) => {
        feedback.push({
          id: `improvement-feedback-${Date.now()}-${index}`,
          userId,
          sessionId,
          timestamp: new Date(),
          feedbackType: 'improvements',
          category: this.categorizeFeedback(weakness),
          message: `Focus area: ${weakness}. Here's how to improve:`,
          actionableSteps: this.generateActionableSteps(weakness),
          priority: this.determinePriority(weakness),
          expectedImpact: {
            timeReduction: this.estimateTimeReduction(weakness),
            qualityImprovement: this.estimateQualityImprovement(weakness),
            efficiencyGain: this.estimateEfficiencyGain(weakness)
          },
          personalizedElements: {
            userName: 'User',
            currentLevel: this.determineUserLevel(efficiencyMetrics),
            learningStyle: 'visual',
            specificWeaknesses: benchmarkComparison.weaknesses,
            specificStrengths: benchmarkComparison.strengths
          }
        });
      });

      // Generate specific guidance based on behavioral patterns
      behavioralAnalysis.patterns
        .filter(p => p.type === 'common_mistake')
        .slice(0, 2)
        .forEach((pattern, index) => {
          feedback.push({
            id: `specific-guidance-${Date.now()}-${index}`,
            userId,
            sessionId,
            timestamp: new Date(),
            feedbackType: 'specific_guidance',
            category: 'search_strategy',
            message: `Pattern detected: ${pattern.pattern}. Let's address this specifically:`,
            actionableSteps: pattern.recommendations,
            priority: 'high',
            expectedImpact: {
              timeReduction: 60000,
              qualityImprovement: 20,
              efficiencyGain: 25
            },
            personalizedElements: {
              userName: 'User',
              currentLevel: this.determineUserLevel(efficiencyMetrics),
              learningStyle: 'visual',
              specificWeaknesses: benchmarkComparison.weaknesses,
              specificStrengths: benchmarkComparison.strengths
            }
          });
        });

      // Store feedback
      if (!this.personalizedFeedback.has(userId)) {
        this.personalizedFeedback.set(userId, []);
      }
      this.personalizedFeedback.get(userId)!.push(...feedback);

      return feedback;
    } catch (error) {
      logger.error('Error generating personalized feedback:', error);
      throw error;
    }
  }

  async createSkillDevelopmentSuggestions(userId: string): Promise<SkillDevelopmentSuggestion[]> {
    try {
      logger.info(`Creating skill development suggestions for user ${userId}`);

      const efficiencyMetrics = await this.researchTracker.getResearchEfficiencyMetrics(userId);
      const benchmarkComparison = await this.researchTracker.compareWithBenchmarks(userId);

      const suggestions: SkillDevelopmentSuggestion[] = [];

      // Analyze current skill levels and create suggestions
      const skillAreas: (keyof typeof this.skillAssessments)[] = [
        'search_refinement',
        'credibility_assessment', 
        'information_synthesis',
        'time_efficiency',
        'strategic_thinking'
      ];

      for (const skillArea of skillAreas) {
        const currentLevel = this.assessSkillLevel(skillArea, efficiencyMetrics, benchmarkComparison);
        const targetLevel = Math.min(100, currentLevel + 20); // Aim for 20 point improvement

        if (currentLevel < 80) { // Only suggest improvement if not already excellent
          suggestions.push({
            id: `skill-dev-${skillArea}-${Date.now()}`,
            skillArea,
            currentLevel,
            targetLevel,
            difficulty: this.determineDifficulty(currentLevel, targetLevel),
            timeToComplete: this.estimateTimeToComplete(skillArea, currentLevel, targetLevel),
            practiceActivities: this.createPracticeActivities(skillArea, currentLevel),
            progressMilestones: this.createProgressMilestones(skillArea, currentLevel, targetLevel),
            prerequisites: this.getSkillPrerequisites(skillArea),
            benefits: this.getSkillBenefits(skillArea),
            relevantScenarios: this.getRelevantScenarios(skillArea)
          });
        }
      }

      // Store suggestions
      this.skillDevelopmentSuggestions.set(userId, suggestions);

      return suggestions;
    } catch (error) {
      logger.error('Error creating skill development suggestions:', error);
      throw error;
    }
  }

  async provideResearchStrategyCoaching(
    userId: string,
    coachingType: 'real_time' | 'post_session' | 'proactive' | 'on_demand' = 'on_demand',
    sessionId?: string
  ): Promise<ResearchStrategyCoaching[]> {
    try {
      logger.info(`Providing research strategy coaching for user ${userId}, type: ${coachingType}`);

      const behavioralAnalysis = await this.researchTracker.analyzeBehavioralPatterns(userId);
      const effectiveStrategies = behavioralAnalysis.patterns
        .filter(p => p.type === 'effective_behavior')
        .slice(0, 3); // Focus on top 3 strategies

      const coaching: ResearchStrategyCoaching[] = [];

      for (const strategyPattern of effectiveStrategies) {
        // Create coaching based on effective strategies
        coaching.push({
          userId,
          sessionId,
          timestamp: new Date(),
          coachingType,
          strategy: this.convertPatternToStrategy(strategyPattern),
          currentApplication: {
            correctUsage: strategyPattern.effectiveness > 70,
            efficiencyScore: strategyPattern.effectiveness,
            commonMistakes: this.identifyStrategyMistakes(strategyPattern),
            improvementOpportunities: this.identifyImprovementOpportunities(strategyPattern)
          },
          guidance: {
            whatToDo: strategyPattern.recommendations.slice(0, 3),
            howToDo: this.generateHowToInstructions(strategyPattern),
            whenToDo: this.generateWhenToInstructions(strategyPattern),
            whyImportant: this.generateWhyImportantExplanations(strategyPattern),
            commonPitfalls: this.generateCommonPitfalls(strategyPattern)
          },
          practiceRecommendations: this.generatePracticeRecommendations(strategyPattern),
          followUpActions: this.generateFollowUpActions(strategyPattern)
        });
      }

      // Store coaching
      if (!this.researchStrategyCoaching.has(userId)) {
        this.researchStrategyCoaching.set(userId, []);
      }
      this.researchStrategyCoaching.get(userId)!.push(...coaching);

      return coaching;
    } catch (error) {
      logger.error('Error providing research strategy coaching:', error);
      throw error;
    }
  }

  async implementProgressiveSkillBuilding(userId: string, skillTrack: 'research_mastery' | 'efficiency_optimization' | 'critical_evaluation' | 'strategic_thinking'): Promise<ProgressiveSkillBuilding> {
    try {
      logger.info(`Implementing progressive skill building for user ${userId}, track: ${skillTrack}`);

      const efficiencyMetrics = await this.researchTracker.getResearchEfficiencyMetrics(userId);
      const currentStage = this.determineCurrentStage(userId, skillTrack, efficiencyMetrics);

      const skillBuilding: ProgressiveSkillBuilding = {
        userId,
        skillTrack,
        currentStage,
        totalStages: this.getSkillTrackStages(skillTrack).length,
        stages: this.getSkillTrackStages(skillTrack),
        overallProgress: this.calculateOverallProgress(currentStage, this.getSkillTrackStages(skillTrack).length),
        estimatedCompletionTime: this.estimateSkillTrackCompletion(skillTrack, currentStage),
        adaptiveAdjustments: []
      };

      // Store skill building plan
      this.progressiveSkillBuilding.set(userId, skillBuilding);

      return skillBuilding;
    } catch (error) {
      logger.error('Error implementing progressive skill building:', error);
      throw error;
    }
  }

  // Helper methods
  private skillAssessments = {
    search_refinement: (metrics: any, comparison: any) => {
      return Math.min(100, (metrics.searchEfficiencyScore || 50) + (comparison.percentile * 0.3));
    },
    credibility_assessment: (metrics: any, comparison: any) => {
      return Math.min(100, (metrics.sourceQualityScore || 50) + (comparison.percentile * 0.4));
    },
    information_synthesis: (metrics: any, comparison: any) => {
      return Math.min(100, 60 + (comparison.percentile * 0.3)); // Base skill + experience
    },
    time_efficiency: (metrics: any, comparison: any) => {
      const timeScore = metrics.averageTimeToSolution < 300000 ? 80 : 50; // 5 min threshold
      return Math.min(100, timeScore + (comparison.percentile * 0.2));
    },
    strategic_thinking: (metrics: any, comparison: any) => {
      const strategicScore = metrics.averageSourcesConsulted > 0 && metrics.averageSourcesConsulted < 6 ? 70 : 50;
      return Math.min(100, strategicScore + (comparison.percentile * 0.3));
    }
  };

  private determineUserLevel(metrics: any): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const overallScore = (metrics.searchEfficiencyScore + metrics.sourceQualityScore) / 2;
    if (overallScore >= 85) return 'expert';
    if (overallScore >= 70) return 'advanced';
    if (overallScore >= 55) return 'intermediate';
    return 'beginner';
  }

  private categorizeFeedback(weakness: string): 'search_strategy' | 'source_evaluation' | 'time_management' | 'critical_thinking' | 'overall_performance' {
    if (weakness.toLowerCase().includes('source') || weakness.toLowerCase().includes('quality')) {
      return 'source_evaluation';
    }
    if (weakness.toLowerCase().includes('time') || weakness.toLowerCase().includes('efficiency')) {
      return 'time_management';
    }
    if (weakness.toLowerCase().includes('search') || weakness.toLowerCase().includes('strategy')) {
      return 'search_strategy';
    }
    if (weakness.toLowerCase().includes('critical') || weakness.toLowerCase().includes('evaluation')) {
      return 'critical_thinking';
    }
    return 'overall_performance';
  }

  private generateActionableSteps(weakness: string): string[] {
    const steps: Record<string, string[]> = {
      'source_quality': [
        'Always check credibility indicators before clicking',
        'Prioritize official documentation and verified sources',
        'Cross-reference information from multiple credible sources'
      ],
      'time_efficiency': [
        'Start with more specific search terms',
        'Set a time limit for each research session',
        'Use advanced search operators to narrow results'
      ],
      'search_strategy': [
        'Plan your search strategy before starting',
        'Try different keyword combinations',
        'Use boolean operators for complex searches'
      ]
    };

    for (const [key, stepList] of Object.entries(steps)) {
      if (weakness.toLowerCase().includes(key.replace('_', ' '))) {
        return stepList;
      }
    }

    return ['Focus on systematic improvement', 'Practice regularly', 'Seek feedback'];
  }

  private determinePriority(weakness: string): 'low' | 'medium' | 'high' | 'critical' {
    if (weakness.toLowerCase().includes('critical') || weakness.toLowerCase().includes('source quality')) {
      return 'high';
    }
    if (weakness.toLowerCase().includes('efficiency') || weakness.toLowerCase().includes('time')) {
      return 'medium';
    }
    return 'low';
  }

  private estimateTimeReduction(weakness: string): number {
    if (weakness.toLowerCase().includes('efficiency') || weakness.toLowerCase().includes('time')) {
      return 120000; // 2 minutes
    }
    if (weakness.toLowerCase().includes('source')) {
      return 60000; // 1 minute
    }
    return 30000; // 30 seconds
  }

  private estimateQualityImprovement(weakness: string): number {
    if (weakness.toLowerCase().includes('source') || weakness.toLowerCase().includes('quality')) {
      return 25;
    }
    if (weakness.toLowerCase().includes('strategy')) {
      return 20;
    }
    return 15;
  }

  private estimateEfficiencyGain(weakness: string): number {
    if (weakness.toLowerCase().includes('efficiency') || weakness.toLowerCase().includes('time')) {
      return 30;
    }
    if (weakness.toLowerCase().includes('search') || weakness.toLowerCase().includes('strategy')) {
      return 25;
    }
    return 15;
  }

  private assessSkillLevel(skillArea: keyof typeof this.skillAssessments, metrics: any, comparison: any): number {
    return this.skillAssessments[skillArea](metrics, comparison);
  }

  private determineDifficulty(currentLevel: number, targetLevel: number): 'easy' | 'moderate' | 'challenging' | 'advanced' {
    const improvement = targetLevel - currentLevel;
    if (improvement <= 10) return 'easy';
    if (improvement <= 20) return 'moderate';
    if (improvement <= 30) return 'challenging';
    return 'advanced';
  }

  private estimateTimeToComplete(skillArea: string, currentLevel: number, targetLevel: number): number {
    const improvement = targetLevel - currentLevel;
    const baseTime = 1800000; // 30 minutes base
    return baseTime * (improvement / 20); // Scale by improvement needed
  }

  private createPracticeActivities(skillArea: string, currentLevel: number): PracticeActivity[] {
    const activities: Record<string, PracticeActivity[]> = {
      search_refinement: [
        {
          id: 'search-practice-1',
          name: 'Query Refinement Practice',
          description: 'Practice improving search queries step by step',
          type: 'guided_practice',
          estimatedTime: 900000, // 15 minutes
          difficultyLevel: currentLevel < 50 ? 'beginner' : 'intermediate',
          learningObjectives: ['Improve query specificity', 'Learn effective keywords'],
          instructions: ['Start with a broad query', 'Refine based on results', 'Track improvements'],
          successCriteria: ['Find relevant results in fewer searches', 'Use specific terminology'],
          feedback: {
            immediate: ['Good keyword selection!', 'Try more specific terms'],
            delayed: ['Your search efficiency improved by 25%'],
            comparative: ['You performed better than 60% of users']
          }
        }
      ],
      credibility_assessment: [
        {
          id: 'credibility-practice-1',
          name: 'Source Evaluation Exercise',
          description: 'Learn to quickly assess source credibility',
          type: 'skill_drill',
          estimatedTime: 600000, // 10 minutes
          difficultyLevel: currentLevel < 50 ? 'beginner' : 'intermediate',
          learningObjectives: ['Identify credible sources', 'Avoid unreliable information'],
          instructions: ['Review source indicators', 'Compare sources', 'Make quality judgments'],
          successCriteria: ['Correctly identify 80% of credible sources', 'Avoid low-quality sources'],
          feedback: {
            immediate: ['Excellent source selection!', 'Check the credibility indicator'],
            delayed: ['Your source quality improved significantly'],
            comparative: ['Your credibility assessment matches experts 75% of the time']
          }
        }
      ]
    };

    return activities[skillArea] || [];
  }

  private createProgressMilestones(skillArea: string, currentLevel: number, targetLevel: number): ProgressMilestone[] {
    const milestones: ProgressMilestone[] = [];
    const steps = Math.ceil((targetLevel - currentLevel) / 10); // 10-point increments

    for (let i = 1; i <= steps; i++) {
      const milestoneLevel = currentLevel + (i * 10);
      milestones.push({
        id: `milestone-${skillArea}-${i}`,
        name: `${skillArea.replace('_', ' ')} Level ${milestoneLevel}`,
        description: `Achieve ${milestoneLevel}% proficiency in ${skillArea.replace('_', ' ')}`,
        targetMetric: `${skillArea}_score`,
        targetValue: milestoneLevel,
        currentValue: currentLevel,
        achieved: false,
        reward: `Unlock advanced ${skillArea.replace('_', ' ')} techniques`,
        nextMilestone: i < steps ? `milestone-${skillArea}-${i + 1}` : undefined
      });
    }

    return milestones;
  }

  private getSkillPrerequisites(skillArea: string): string[] {
    const prerequisites: Record<string, string[]> = {
      search_refinement: ['Basic search skills', 'Understanding of keywords'],
      credibility_assessment: ['Basic internet literacy', 'Understanding of source types'],
      information_synthesis: ['Search refinement skills', 'Credibility assessment skills'],
      time_efficiency: ['Basic research skills', 'Time management awareness'],
      strategic_thinking: ['All previous skills', 'Problem-solving experience']
    };

    return prerequisites[skillArea] || [];
  }

  private getSkillBenefits(skillArea: string): string[] {
    const benefits: Record<string, string[]> = {
      search_refinement: ['Find relevant information faster', 'Reduce research time', 'Improve solution quality'],
      credibility_assessment: ['Avoid unreliable information', 'Increase solution accuracy', 'Build confidence'],
      information_synthesis: ['Create comprehensive solutions', 'Identify patterns', 'Make better decisions'],
      time_efficiency: ['Complete tasks faster', 'Handle more cases', 'Reduce stress'],
      strategic_thinking: ['Approach problems systematically', 'Anticipate challenges', 'Develop expertise']
    };

    return benefits[skillArea] || [];
  }

  private getRelevantScenarios(skillArea: string): string[] {
    const scenarios: Record<string, string[]> = {
      search_refinement: ['Complex technical problems', 'Ambiguous error messages', 'Multi-step procedures'],
      credibility_assessment: ['Security-related issues', 'Critical system changes', 'Compliance requirements'],
      information_synthesis: ['Multi-vendor environments', 'Legacy system issues', 'Integration problems'],
      time_efficiency: ['High-priority incidents', 'Multiple simultaneous issues', 'Time-sensitive requests'],
      strategic_thinking: ['Enterprise-level problems', 'Policy development', 'System architecture decisions']
    };

    return scenarios[skillArea] || [];
  }

  private convertPatternToStrategy(pattern: BehavioralPattern): EffectiveStrategy {
    return {
      id: pattern.id,
      strategyType: 'search_refinement', // Default type
      name: pattern.pattern,
      description: `Effective pattern: ${pattern.pattern}`,
      effectiveness: pattern.effectiveness,
      applicability: pattern.context,
      requirements: {
        skillLevel: 'intermediate',
        timeInvestment: 60000,
        complexityLevel: 'medium'
      },
      metrics: {
        averageTimeToSolution: 180000,
        successRate: pattern.effectiveness / 100,
        qualityScore: 0.8,
        userSatisfaction: 0.85
      },
      implementation: {
        steps: pattern.evidence,
        tips: pattern.recommendations,
        commonPitfalls: ['Not applying consistently', 'Overcomplicating the approach']
      },
      usageFrequency: pattern.frequency,
      lastUsed: new Date()
    };
  }

  private identifyStrategyMistakes(pattern: BehavioralPattern): string[] {
    return [
      'Inconsistent application of the strategy',
      'Not adapting to different contexts',
      'Overreliance without considering alternatives'
    ];
  }

  private identifyImprovementOpportunities(pattern: BehavioralPattern): string[] {
    return [
      'Apply strategy more consistently',
      'Adapt strategy to new contexts',
      'Combine with other effective strategies'
    ];
  }

  private generateHowToInstructions(pattern: BehavioralPattern): string[] {
    return [
      `Follow these steps: ${pattern.evidence.join(', ')}`,
      'Practice the approach systematically',
      'Monitor your results and adjust as needed'
    ];
  }

  private generateWhenToInstructions(pattern: BehavioralPattern): string[] {
    return [
      `Best used in contexts: ${pattern.context.join(', ')}`,
      'Apply when facing similar challenges',
      'Use as primary approach for these scenarios'
    ];
  }

  private generateWhyImportantExplanations(pattern: BehavioralPattern): string[] {
    return [
      `This strategy is ${pattern.effectiveness}% effective`,
      'It helps you avoid common pitfalls',
      'Proven to improve research outcomes'
    ];
  }

  private generateCommonPitfalls(pattern: BehavioralPattern): string[] {
    return [
      'Not applying consistently across sessions',
      'Skipping steps when under pressure',
      'Not adapting to new situations'
    ];
  }

  private generatePracticeRecommendations(pattern: BehavioralPattern): string[] {
    return [
      'Practice this strategy in low-pressure situations',
      'Apply it to different types of problems',
      'Track your success rate with this approach'
    ];
  }

  private generateFollowUpActions(pattern: BehavioralPattern): string[] {
    return [
      'Review your application of this strategy weekly',
      'Share your experience with peers',
      'Look for opportunities to teach this approach'
    ];
  }

  private determineCurrentStage(userId: string, skillTrack: string, metrics: any): number {
    // Simplified stage determination based on overall performance
    const overallScore = (metrics.searchEfficiencyScore + metrics.sourceQualityScore) / 2;
    if (overallScore >= 80) return 4;
    if (overallScore >= 60) return 3;
    if (overallScore >= 40) return 2;
    return 1;
  }

  private getSkillTrackStages(skillTrack: string): SkillStage[] {
    const commonStages: SkillStage[] = [
      {
        stageNumber: 1,
        name: 'Foundation',
        description: 'Build basic skills and understanding',
        objectives: ['Understand core concepts', 'Practice basic techniques'],
        activities: [],
        assessmentCriteria: ['Complete basic exercises', 'Demonstrate understanding'],
        minimumScore: 70,
        completed: false,
        timeSpent: 0,
        attempts: 0,
        bestScore: 0
      },
      {
        stageNumber: 2,
        name: 'Development',
        description: 'Develop intermediate skills and consistency',
        objectives: ['Apply techniques consistently', 'Handle moderate complexity'],
        activities: [],
        assessmentCriteria: ['Consistent application', 'Good success rate'],
        minimumScore: 75,
        completed: false,
        timeSpent: 0,
        attempts: 0,
        bestScore: 0
      },
      {
        stageNumber: 3,
        name: 'Proficiency',
        description: 'Achieve proficient level performance',
        objectives: ['Handle complex scenarios', 'Optimize performance'],
        activities: [],
        assessmentCriteria: ['Complex problem solving', 'Efficiency optimization'],
        minimumScore: 80,
        completed: false,
        timeSpent: 0,
        attempts: 0,
        bestScore: 0
      },
      {
        stageNumber: 4,
        name: 'Mastery',
        description: 'Master advanced techniques and mentor others',
        objectives: ['Expert-level performance', 'Knowledge sharing'],
        activities: [],
        assessmentCriteria: ['Expert performance', 'Teaching ability'],
        minimumScore: 90,
        completed: false,
        timeSpent: 0,
        attempts: 0,
        bestScore: 0
      }
    ];

    return commonStages;
  }

  private calculateOverallProgress(currentStage: number, totalStages: number): number {
    return Math.round((currentStage / totalStages) * 100);
  }

  private estimateSkillTrackCompletion(skillTrack: string, currentStage: number): number {
    const baseTimePerStage = 7200000; // 2 hours per stage
    const remainingStages = 4 - currentStage; // Assuming 4 stages total
    return remainingStages * baseTimePerStage;
  }

  // Public API methods for accessing stored data
  getFeedbackHistory(userId: string): PersonalizedFeedback[] {
    return this.personalizedFeedback.get(userId) || [];
  }

  getSkillDevelopmentPlan(userId: string): SkillDevelopmentSuggestion[] {
    return this.skillDevelopmentSuggestions.get(userId) || [];
  }

  getCoachingHistory(userId: string): ResearchStrategyCoaching[] {
    return this.researchStrategyCoaching.get(userId) || [];
  }

  getSkillBuildingPlan(userId: string): ProgressiveSkillBuilding | null {
    return this.progressiveSkillBuilding.get(userId) || null;
  }
}