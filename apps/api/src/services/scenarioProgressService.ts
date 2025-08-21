import { ScenarioRepository } from '../repositories/scenarioRepository';
import { SessionRepository } from '../repositories/sessionRepository';
import { UserRepository } from '../repositories/userRepository';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface UserScenarioProgress {
  userId: string;
  scenarioId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  completionDate?: Date;
  score?: number;
  attempts: number;
  timeSpent: number; // in minutes
  lastAttemptDate?: Date;
  prerequisitesMet: boolean;
  unlockedDate?: Date;
}

export interface ScenarioProgressSummary {
  userId: string;
  totalScenarios: number;
  completedScenarios: number;
  inProgressScenarios: number;
  availableScenarios: number;
  lockedScenarios: number;
  completionRate: number;
  averageScore: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  categoryProgress: Record<string, {
    total: number;
    completed: number;
    averageScore: number;
  }>;
  difficultyProgress: Record<'starter' | 'intermediate' | 'advanced', {
    total: number;
    completed: number;
    averageScore: number;
  }>;
}

export interface PrerequisiteCheck {
  scenarioId: string;
  isMet: boolean;
  missingPrerequisites: string[];
  completedPrerequisites: string[];
  alternativePathsAvailable: boolean;
}

export class ScenarioProgressService {
  private scenarioRepository: ScenarioRepository;
  private sessionRepository: SessionRepository;
  private userRepository: UserRepository;

  constructor() {
    this.scenarioRepository = new ScenarioRepository();
    this.sessionRepository = new SessionRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Get comprehensive progress summary for a user
   */
  async getUserProgressSummary(userId: string): Promise<ScenarioProgressSummary> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      const allScenarios = await this.scenarioRepository.findAll();
      const userSessions = await this.sessionRepository.findAllSessionsByUser(userId);
      
      // Calculate completion statistics
      const completedSessions = userSessions.filter(s => s.status === 'completed');
      const inProgressSessions = userSessions.filter(s => s.status === 'active');
      
      // Get scenario progress for each scenario
      const scenarioProgress = await Promise.all(
        allScenarios.map(scenario => this.getScenarioProgress(userId, scenario.id))
      );

      const completedScenarios = scenarioProgress.filter(p => p.status === 'completed').length;
      const inProgressScenarios = scenarioProgress.filter(p => p.status === 'in_progress').length;
      const availableScenarios = scenarioProgress.filter(p => p.status === 'available').length;
      const lockedScenarios = scenarioProgress.filter(p => p.status === 'locked').length;

      // Calculate averages and totals
      const totalTimeSpent = scenarioProgress.reduce((sum, p) => sum + p.timeSpent, 0);
      const completedProgress = scenarioProgress.filter(p => p.status === 'completed');
      const averageScore = completedProgress.length > 0 
        ? completedProgress.reduce((sum, p) => sum + (p.score || 0), 0) / completedProgress.length
        : 0;

      // Calculate streaks
      const { currentStreak, longestStreak } = this.calculateCompletionStreaks(completedProgress);

      // Calculate category and difficulty progress
      const categoryProgress = this.calculateCategoryProgress(allScenarios, scenarioProgress);
      const difficultyProgress = this.calculateDifficultyProgress(allScenarios, scenarioProgress);

      return {
        userId,
        totalScenarios: allScenarios.length,
        completedScenarios,
        inProgressScenarios,
        availableScenarios,
        lockedScenarios,
        completionRate: allScenarios.length > 0 ? (completedScenarios / allScenarios.length) * 100 : 0,
        averageScore,
        totalTimeSpent,
        currentStreak,
        longestStreak,
        categoryProgress,
        difficultyProgress,
      };
    } catch (error) {
      logger.error('Error getting user progress summary', { userId, error });
      throw error;
    }
  }

  /**
   * Get progress for a specific scenario
   */
  async getScenarioProgress(userId: string, scenarioId: string): Promise<UserScenarioProgress> {
    try {
      const scenario = await this.scenarioRepository.findById(scenarioId);
      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${scenarioId} not found`);
      }

      // Check if user has sessions for this scenario
      const userSessions = await this.sessionRepository.findSessionsByUserAndScenario(userId, scenarioId);
      
      const completedSessions = userSessions.filter(s => s.status === 'completed');
      const activeSessions = userSessions.filter(s => s.status === 'active');
      
      // Check prerequisites
      const prerequisiteCheck = await this.checkPrerequisites(userId, scenarioId);
      
      let status: UserScenarioProgress['status'] = 'locked';
      let completionDate: Date | undefined;
      let score: number | undefined;
      let lastAttemptDate: Date | undefined;
      let unlockedDate: Date | undefined;

      if (prerequisiteCheck.isMet) {
        if (completedSessions.length > 0) {
          status = 'completed';
          const bestSession = completedSessions.reduce((best, current) => 
            (current.finalScore || 0) > (best.finalScore || 0) ? current : best
          );
          completionDate = bestSession.endTime;
          score = bestSession.finalScore;
          unlockedDate = this.findUnlockDate(userId, scenarioId);
        } else if (activeSessions.length > 0) {
          status = 'in_progress';
          unlockedDate = this.findUnlockDate(userId, scenarioId);
        } else {
          status = 'available';
          unlockedDate = this.findUnlockDate(userId, scenarioId);
        }
      }

      if (userSessions.length > 0) {
        lastAttemptDate = userSessions.reduce((latest, current) => 
          current.startTime > latest.startTime ? current : latest
        ).startTime;
      }

      // Calculate total time spent
      const timeSpent = userSessions.reduce((total, session) => {
        if (session.endTime) {
          const duration = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
          return total + duration;
        }
        return total;
      }, 0);

      return {
        userId,
        scenarioId,
        status,
        completionDate,
        score,
        attempts: userSessions.length,
        timeSpent,
        lastAttemptDate,
        prerequisitesMet: prerequisiteCheck.isMet,
        unlockedDate,
      };
    } catch (error) {
      logger.error('Error getting scenario progress', { userId, scenarioId, error });
      throw error;
    }
  }

  /**
   * Check if prerequisites are met for a scenario
   */
  async checkPrerequisites(userId: string, scenarioId: string): Promise<PrerequisiteCheck> {
    try {
      const scenario = await this.scenarioRepository.findById(scenarioId);
      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${scenarioId} not found`);
      }

      // Parse prerequisites from JSON string
      const prerequisites: string[] = JSON.parse(scenario.prerequisites || '[]');
      
      if (prerequisites.length === 0) {
        return {
          scenarioId,
          isMet: true,
          missingPrerequisites: [],
          completedPrerequisites: [],
          alternativePathsAvailable: false,
        };
      }

      // Check completion status of each prerequisite
      const prerequisiteStatuses = await Promise.all(
        prerequisites.map(async (prereqId) => {
          const prereqProgress = await this.getScenarioProgress(userId, prereqId);
          return {
            scenarioId: prereqId,
            isCompleted: prereqProgress.status === 'completed',
          };
        })
      );

      const completedPrerequisites = prerequisiteStatuses
        .filter(p => p.isCompleted)
        .map(p => p.scenarioId);
      
      const missingPrerequisites = prerequisiteStatuses
        .filter(p => !p.isCompleted)
        .map(p => p.scenarioId);

      const isMet = missingPrerequisites.length === 0;

      // Check for alternative paths (scenarios with similar learning objectives)
      const alternativePathsAvailable = await this.hasAlternativePaths(userId, scenarioId, missingPrerequisites);

      return {
        scenarioId,
        isMet,
        missingPrerequisites,
        completedPrerequisites,
        alternativePathsAvailable,
      };
    } catch (error) {
      logger.error('Error checking prerequisites', { userId, scenarioId, error });
      throw error;
    }
  }

  /**
   * Get available scenarios for a user (unlocked and not completed)
   */
  async getAvailableScenarios(userId: string): Promise<UserScenarioProgress[]> {
    try {
      const allScenarios = await this.scenarioRepository.findAll();
      const scenarioProgress = await Promise.all(
        allScenarios.map(scenario => this.getScenarioProgress(userId, scenario.id))
      );

      return scenarioProgress.filter(p => p.status === 'available' || p.status === 'in_progress');
    } catch (error) {
      logger.error('Error getting available scenarios', { userId, error });
      throw error;
    }
  }

  /**
   * Update scenario progress when user completes a scenario
   */
  async updateScenarioCompletion(
    userId: string, 
    scenarioId: string, 
    score: number, 
    timeSpent: number
  ): Promise<void> {
    try {
      // This will trigger unlocking of dependent scenarios
      await this.unlockDependentScenarios(userId, scenarioId);
      
      logger.info('Scenario completion updated', {
        userId,
        scenarioId,
        score,
        timeSpent,
      });
    } catch (error) {
      logger.error('Error updating scenario completion', { userId, scenarioId, error });
      throw error;
    }
  }

  /**
   * Unlock scenarios that depend on the completed scenario
   */
  private async unlockDependentScenarios(userId: string, completedScenarioId: string): Promise<void> {
    try {
      const allScenarios = await this.scenarioRepository.findAll();
      
      // Find scenarios that have the completed scenario as a prerequisite
      const dependentScenarios = allScenarios.filter(scenario => {
        const prerequisites: string[] = JSON.parse(scenario.prerequisites || '[]');
        return prerequisites.includes(completedScenarioId);
      });

      // Check if each dependent scenario can now be unlocked
      for (const scenario of dependentScenarios) {
        const prerequisiteCheck = await this.checkPrerequisites(userId, scenario.id);
        if (prerequisiteCheck.isMet) {
          logger.info('Scenario unlocked for user', {
            userId,
            scenarioId: scenario.id,
            unlockedBy: completedScenarioId,
          });
        }
      }
    } catch (error) {
      logger.error('Error unlocking dependent scenarios', { userId, completedScenarioId, error });
      throw error;
    }
  }

  /**
   * Calculate completion streaks
   */
  private calculateCompletionStreaks(completedProgress: UserScenarioProgress[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (completedProgress.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort by completion date
    const sorted = completedProgress
      .filter(p => p.completionDate)
      .sort((a, b) => a.completionDate!.getTime() - b.completionDate!.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].completionDate!;
      const curr = sorted[i].completionDate!;
      const daysDiff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 7) { // Consider within a week as consecutive
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak from the most recent completion
    const now = new Date();
    const lastCompletion = sorted[sorted.length - 1].completionDate!;
    const daysSinceLastCompletion = Math.floor((now.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastCompletion <= 7) {
      currentStreak = tempStreak;
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Calculate progress by category
   */
  private calculateCategoryProgress(
    allScenarios: any[], 
    scenarioProgress: UserScenarioProgress[]
  ): Record<string, { total: number; completed: number; averageScore: number; }> {
    const categoryProgress: Record<string, { total: number; completed: number; averageScore: number; scores: number[]; }> = {};

    allScenarios.forEach(scenario => {
      const category = scenario.ticketTemplate?.category || 'Uncategorized';
      if (!categoryProgress[category]) {
        categoryProgress[category] = { total: 0, completed: 0, averageScore: 0, scores: [] };
      }
      categoryProgress[category].total++;

      const progress = scenarioProgress.find(p => p.scenarioId === scenario.id);
      if (progress?.status === 'completed' && progress.score !== undefined) {
        categoryProgress[category].completed++;
        categoryProgress[category].scores.push(progress.score);
      }
    });

    // Calculate average scores
    Object.keys(categoryProgress).forEach(category => {
      const scores = categoryProgress[category].scores;
      categoryProgress[category].averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
      delete (categoryProgress[category] as any).scores;
    });

    return categoryProgress;
  }

  /**
   * Calculate progress by difficulty
   */
  private calculateDifficultyProgress(
    allScenarios: any[], 
    scenarioProgress: UserScenarioProgress[]
  ): Record<'starter' | 'intermediate' | 'advanced', { total: number; completed: number; averageScore: number; }> {
    const difficultyProgress = {
      starter: { total: 0, completed: 0, averageScore: 0, scores: [] as number[] },
      intermediate: { total: 0, completed: 0, averageScore: 0, scores: [] as number[] },
      advanced: { total: 0, completed: 0, averageScore: 0, scores: [] as number[] },
    };

    allScenarios.forEach(scenario => {
      const difficulty = scenario.difficulty as 'starter' | 'intermediate' | 'advanced';
      if (difficultyProgress[difficulty]) {
        difficultyProgress[difficulty].total++;

        const progress = scenarioProgress.find(p => p.scenarioId === scenario.id);
        if (progress?.status === 'completed' && progress.score !== undefined) {
          difficultyProgress[difficulty].completed++;
          difficultyProgress[difficulty].scores.push(progress.score);
        }
      }
    });

    // Calculate average scores
    Object.keys(difficultyProgress).forEach(difficulty => {
      const diff = difficulty as 'starter' | 'intermediate' | 'advanced';
      const scores = difficultyProgress[diff].scores;
      difficultyProgress[diff].averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
      delete (difficultyProgress[diff] as any).scores;
    });

    return difficultyProgress;
  }

  /**
   * Find when a scenario was unlocked for a user
   */
  private findUnlockDate(userId: string, scenarioId: string): Date | undefined {
    // This would ideally be stored in a dedicated progress tracking table
    // For now, we'll return undefined as this would require additional database schema
    return undefined;
  }

  /**
   * Check if there are alternative learning paths available
   */
  private async hasAlternativePaths(
    userId: string, 
    scenarioId: string, 
    missingPrerequisites: string[]
  ): Promise<boolean> {
    // This would implement logic to find scenarios with similar learning objectives
    // that could serve as alternative prerequisites
    return false;
  }
}