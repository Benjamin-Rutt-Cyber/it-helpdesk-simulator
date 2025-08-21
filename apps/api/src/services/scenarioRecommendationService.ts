import { ScenarioRepository } from '../repositories/scenarioRepository';
import { ScenarioProgressService, UserScenarioProgress } from './scenarioProgressService';
import { SessionRepository } from '../repositories/sessionRepository';
import { logger } from '../utils/logger';

export interface ScenarioRecommendation {
  scenarioId: string;
  scenario: any; // Full scenario object
  relevanceScore: number;
  difficultyScore: number;
  engagementScore: number;
  learningScore: number;
  compositeScore: number;
  reasoning: string[];
  estimatedCompletionTime: number;
  expectedDifficulty: 'easy' | 'appropriate' | 'challenging';
  learningObjectives: string[];
  prerequisites: {
    met: boolean;
    missing: string[];
  };
}

export interface RecommendationRequest {
  userId: string;
  maxRecommendations?: number;
  difficultyPreference?: 'easier' | 'similar' | 'harder';
  categoryPreference?: string[];
  timeAvailable?: number; // in minutes
  focusAreas?: string[]; // skill areas to focus on
  excludeCompleted?: boolean;
}

export interface RecommendationWeights {
  relevance: number;
  difficulty: number;
  engagement: number;
  learning: number;
}

export class ScenarioRecommendationService {
  private scenarioRepository: ScenarioRepository;
  private progressService: ScenarioProgressService;
  private sessionRepository: SessionRepository;

  // Default recommendation weights
  private defaultWeights: RecommendationWeights = {
    relevance: 0.3,
    difficulty: 0.25,
    engagement: 0.25,
    learning: 0.2,
  };

  constructor() {
    this.scenarioRepository = new ScenarioRepository();
    this.progressService = new ScenarioProgressService();
    this.sessionRepository = new SessionRepository();
  }

  /**
   * Get personalized scenario recommendations for a user
   */
  async getRecommendations(request: RecommendationRequest): Promise<ScenarioRecommendation[]> {
    try {
      const {
        userId,
        maxRecommendations = 5,
        difficultyPreference = 'similar',
        categoryPreference = [],
        timeAvailable,
        focusAreas = [],
        excludeCompleted = true,
      } = request;

      // Get user's current progress and performance data
      const userProgress = await this.progressService.getUserProgressSummary(userId);
      const availableScenarios = await this.progressService.getAvailableScenarios(userId);
      const allScenarios = await this.scenarioRepository.findAll();
      const userSessions = await this.sessionRepository.findAllSessionsByUser(userId);

      // Filter scenarios based on availability and preferences
      let candidateScenarios = allScenarios.filter(scenario => {
        const progress = availableScenarios.find(p => p.scenarioId === scenario.id);
        
        // Exclude completed scenarios if requested
        if (excludeCompleted && progress?.status === 'completed') {
          return false;
        }

        // Only include available or in-progress scenarios
        if (!progress || progress.status === 'locked') {
          return false;
        }

        // Filter by category preference
        if (categoryPreference.length > 0) {
          const category = scenario.ticketTemplate?.category;
          if (!categoryPreference.includes(category)) {
            return false;
          }
        }

        // Filter by time availability
        if (timeAvailable && scenario.estimatedTime > timeAvailable) {
          return false;
        }

        return true;
      });

      // Calculate recommendation scores for each candidate
      const recommendations = await Promise.all(
        candidateScenarios.map(scenario => 
          this.calculateRecommendationScore(scenario, userId, userProgress, userSessions, request)
        )
      );

      // Sort by composite score and return top recommendations
      const sortedRecommendations = recommendations
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, maxRecommendations);

      logger.info('Generated scenario recommendations', {
        userId,
        candidateCount: candidateScenarios.length,
        recommendationCount: sortedRecommendations.length,
        topScore: sortedRecommendations[0]?.compositeScore || 0,
      });

      return sortedRecommendations;
    } catch (error) {
      logger.error('Error generating scenario recommendations', { userId: request.userId, error });
      throw error;
    }
  }

  /**
   * Get recommendations based on user's recent performance
   */
  async getPerformanceBasedRecommendations(userId: string): Promise<ScenarioRecommendation[]> {
    try {
      const userSessions = await this.sessionRepository.findCompletedSessionsByUser(userId);
      const recentSessions = userSessions.slice(-5); // Last 5 completed sessions

      if (recentSessions.length === 0) {
        // If no recent sessions, recommend starter scenarios
        return this.getRecommendations({
          userId,
          maxRecommendations: 3,
          difficultyPreference: 'easier',
        });
      }

      // Analyze recent performance
      const averageScore = recentSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / recentSessions.length;
      const averageTime = recentSessions.reduce((sum, session) => {
        const duration = session.endTime && session.startTime 
          ? (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
          : 0;
        return sum + duration;
      }, 0) / recentSessions.length;

      // Determine difficulty preference based on performance
      let difficultyPreference: 'easier' | 'similar' | 'harder' = 'similar';
      if (averageScore > 85) {
        difficultyPreference = 'harder';
      } else if (averageScore < 60) {
        difficultyPreference = 'easier';
      }

      // Get category preferences from recent completions
      const recentCategories = recentSessions.map(session => {
        // This would need to be enhanced to get category from session/scenario relationship
        return 'General'; // Placeholder
      });

      return this.getRecommendations({
        userId,
        maxRecommendations: 5,
        difficultyPreference,
        timeAvailable: Math.max(30, averageTime * 1.2), // Allow slightly more time than average
      });
    } catch (error) {
      logger.error('Error generating performance-based recommendations', { userId, error });
      throw error;
    }
  }

  /**
   * Get recommendations for skill improvement
   */
  async getSkillImprovementRecommendations(
    userId: string, 
    weakSkillAreas: string[]
  ): Promise<ScenarioRecommendation[]> {
    try {
      const allScenarios = await this.scenarioRepository.findAll();
      
      // Filter scenarios that target the weak skill areas
      const targetScenarios = allScenarios.filter(scenario => {
        const tags = scenario.tags || [];
        return weakSkillAreas.some(skill => 
          tags.includes(skill.toLowerCase()) || 
          scenario.title.toLowerCase().includes(skill.toLowerCase()) ||
          scenario.description.toLowerCase().includes(skill.toLowerCase())
        );
      });

      if (targetScenarios.length === 0) {
        // Fallback to general recommendations
        return this.getRecommendations({ userId, maxRecommendations: 3 });
      }

      return this.getRecommendations({
        userId,
        maxRecommendations: 5,
        focusAreas: weakSkillAreas,
        difficultyPreference: 'similar',
      });
    } catch (error) {
      logger.error('Error generating skill improvement recommendations', { userId, weakSkillAreas, error });
      throw error;
    }
  }

  /**
   * Calculate comprehensive recommendation score for a scenario
   */
  private async calculateRecommendationScore(
    scenario: any,
    userId: string,
    userProgress: any,
    userSessions: any[],
    request: RecommendationRequest
  ): Promise<ScenarioRecommendation> {
    const relevanceScore = this.calculateRelevanceScore(scenario, userProgress, request);
    const difficultyScore = this.calculateDifficultyScore(scenario, userProgress, request);
    const engagementScore = this.calculateEngagementScore(scenario, userSessions);
    const learningScore = this.calculateLearningScore(scenario, userProgress, request);

    const compositeScore = (
      relevanceScore * this.defaultWeights.relevance +
      difficultyScore * this.defaultWeights.difficulty +
      engagementScore * this.defaultWeights.engagement +
      learningScore * this.defaultWeights.learning
    );

    const reasoning = this.generateRecommendationReasoning(
      scenario,
      { relevanceScore, difficultyScore, engagementScore, learningScore }
    );

    const expectedDifficulty = this.determineExpectedDifficulty(difficultyScore);
    const learningObjectives = this.extractLearningObjectives(scenario);

    // Check prerequisites
    const prerequisiteCheck = await this.progressService.checkPrerequisites(userId, scenario.id);

    return {
      scenarioId: scenario.id,
      scenario,
      relevanceScore,
      difficultyScore,
      engagementScore,
      learningScore,
      compositeScore,
      reasoning,
      estimatedCompletionTime: scenario.estimatedTime,
      expectedDifficulty,
      learningObjectives,
      prerequisites: {
        met: prerequisiteCheck.isMet,
        missing: prerequisiteCheck.missingPrerequisites,
      },
    };
  }

  /**
   * Calculate how relevant the scenario is to the user's current needs
   */
  private calculateRelevanceScore(scenario: any, userProgress: any, request: RecommendationRequest): number {
    let score = 0.5; // Base score

    // Category relevance
    if (request.categoryPreference && request.categoryPreference.length > 0) {
      const category = scenario.ticketTemplate?.category;
      if (request.categoryPreference.includes(category)) {
        score += 0.3;
      }
    }

    // Focus area relevance
    if (request.focusAreas && request.focusAreas.length > 0) {
      const tags = scenario.tags || [];
      const hasRelevantTag = request.focusAreas.some(area => 
        tags.some((tag: string) => tag.toLowerCase().includes(area.toLowerCase()))
      );
      if (hasRelevantTag) {
        score += 0.2;
      }
    }

    // Progress context relevance
    const userCompletionRate = userProgress.completionRate / 100;
    if (scenario.difficulty === 'starter' && userCompletionRate < 0.3) {
      score += 0.2;
    } else if (scenario.difficulty === 'intermediate' && userCompletionRate >= 0.3 && userCompletionRate < 0.7) {
      score += 0.2;
    } else if (scenario.difficulty === 'advanced' && userCompletionRate >= 0.7) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate if the scenario difficulty is appropriate for the user
   */
  private calculateDifficultyScore(scenario: any, userProgress: any, request: RecommendationRequest): number {
    const userLevel = this.determineUserLevel(userProgress);
    const scenarioDifficulty = this.mapDifficultyToNumeric(scenario.difficulty);
    
    let score = 0.5; // Base score

    switch (request.difficultyPreference) {
      case 'easier':
        if (scenarioDifficulty <= userLevel) score += 0.3;
        if (scenarioDifficulty < userLevel) score += 0.2;
        break;
      case 'similar':
        if (Math.abs(scenarioDifficulty - userLevel) <= 0.5) score += 0.5;
        break;
      case 'harder':
        if (scenarioDifficulty >= userLevel) score += 0.3;
        if (scenarioDifficulty > userLevel) score += 0.2;
        break;
    }

    // Penalize scenarios that are too far from user level
    const levelDifference = Math.abs(scenarioDifficulty - userLevel);
    if (levelDifference > 1.5) {
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate engagement score based on similar scenarios the user has completed
   */
  private calculateEngagementScore(scenario: any, userSessions: any[]): number {
    let score = 0.5; // Base score

    // If user has no history, return neutral score
    if (userSessions.length === 0) {
      return score;
    }

    // Look for similar scenarios in user's history
    const similarSessions = userSessions.filter(session => {
      // This would need enhancement to properly match scenarios
      // For now, use a simple category match
      return true; // Placeholder
    });

    if (similarSessions.length > 0) {
      const averageScore = similarSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / similarSessions.length;
      const completionRate = similarSessions.filter(s => s.status === 'completed').length / similarSessions.length;

      if (averageScore > 75 && completionRate > 0.8) {
        score += 0.3; // User tends to perform well on similar scenarios
      }
    }

    return Math.min(1, score);
  }

  /**
   * Calculate learning score based on educational value and skill development
   */
  private calculateLearningScore(scenario: any, userProgress: any, request: RecommendationRequest): number {
    let score = 0.5; // Base score

    // XP reward indicates learning value
    const xpReward = scenario.xpReward || 0;
    if (xpReward > 100) score += 0.2;
    if (xpReward > 200) score += 0.1;

    // Knowledge base entries indicate comprehensive learning
    const kbEntries = scenario.knowledgeBaseEntries || [];
    if (kbEntries.length > 3) score += 0.2;

    // Assessment criteria coverage
    const assessmentCriteria = scenario.assessmentCriteria || {};
    const criteriaCount = Object.keys(assessmentCriteria).length;
    if (criteriaCount >= 4) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Generate human-readable reasoning for the recommendation
   */
  private generateRecommendationReasoning(
    scenario: any, 
    scores: { relevanceScore: number; difficultyScore: number; engagementScore: number; learningScore: number; }
  ): string[] {
    const reasoning: string[] = [];

    if (scores.relevanceScore > 0.7) {
      reasoning.push("Highly relevant to your current learning goals");
    }

    if (scores.difficultyScore > 0.7) {
      reasoning.push("Appropriate difficulty level for your current skills");
    } else if (scores.difficultyScore < 0.4) {
      reasoning.push("May be challenging but could accelerate your learning");
    }

    if (scores.engagementScore > 0.7) {
      reasoning.push("Similar to scenarios you've enjoyed previously");
    }

    if (scores.learningScore > 0.7) {
      reasoning.push("High educational value with comprehensive learning objectives");
    }

    if (scenario.estimatedTime <= 30) {
      reasoning.push("Short duration makes it perfect for quick learning sessions");
    }

    if (reasoning.length === 0) {
      reasoning.push("Good next step in your learning journey");
    }

    return reasoning;
  }

  /**
   * Determine expected difficulty level for the user
   */
  private determineExpectedDifficulty(difficultyScore: number): 'easy' | 'appropriate' | 'challenging' {
    if (difficultyScore > 0.7) return 'appropriate';
    if (difficultyScore > 0.4) return 'challenging';
    return 'easy';
  }

  /**
   * Extract learning objectives from scenario
   */
  private extractLearningObjectives(scenario: any): string[] {
    const objectives: string[] = [];

    // Extract from success criteria
    const successCriteria = scenario.successCriteria || [];
    successCriteria.forEach((criterion: any) => {
      if (criterion.description) {
        objectives.push(criterion.description);
      }
    });

    // Add category-based objective
    const category = scenario.ticketTemplate?.category;
    if (category) {
      objectives.unshift(`Master ${category.toLowerCase()} support scenarios`);
    }

    return objectives.slice(0, 5); // Limit to 5 objectives
  }

  /**
   * Determine user's current skill level
   */
  private determineUserLevel(userProgress: any): number {
    const completionRate = userProgress.completionRate / 100;
    const averageScore = userProgress.averageScore / 100;
    
    // Calculate level based on completion rate and performance
    const level = (completionRate * 0.6 + averageScore * 0.4) * 3; // Scale to 0-3
    
    return Math.max(0, Math.min(3, level));
  }

  /**
   * Map difficulty string to numeric value
   */
  private mapDifficultyToNumeric(difficulty: string): number {
    switch (difficulty) {
      case 'starter': return 1;
      case 'intermediate': return 2;
      case 'advanced': return 3;
      default: return 1;
    }
  }
}