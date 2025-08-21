import { Request, Response, NextFunction } from 'express';
import { ScenarioService } from '../services/scenarioService';
import { ScenarioProgressService } from '../services/scenarioProgressService';
import { ScenarioRecommendationService } from '../services/scenarioRecommendationService';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ScenarioController {
  private scenarioService: ScenarioService;
  private progressService: ScenarioProgressService;
  private recommendationService: ScenarioRecommendationService;

  constructor() {
    this.scenarioService = new ScenarioService();
    this.progressService = new ScenarioProgressService();
    this.recommendationService = new ScenarioRecommendationService();
  }

  async getAllScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scenarios = await this.scenarioService.getAllScenarios();
      
      logger.info('Retrieved all scenarios', {
        count: scenarios.length,
        userId: (req as any).user?.id,
      });

      res.json({
        success: true,
        data: scenarios,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getScenarioById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const scenario = await this.scenarioService.getScenarioById(id);

      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${id} not found`);
      }

      logger.info('Retrieved scenario by ID', {
        scenarioId: id,
        userId: (req as any).user?.id,
      });

      res.json({
        success: true,
        data: scenario,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async startScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const session = await this.scenarioService.startScenario(id, userId);

      logger.info('Started scenario', {
        scenarioId: id,
        sessionId: session.id,
        userId,
      });

      res.status(201).json({
        success: true,
        data: session,
        message: 'Scenario started successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getScenariosByDifficulty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { level } = req.params;
      const scenarios = await this.scenarioService.getScenariosByDifficulty(level as any);

      logger.info('Retrieved scenarios by difficulty', {
        difficulty: level,
        count: scenarios.length,
        userId: (req as any).user?.id,
      });

      res.json({
        success: true,
        data: scenarios,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserScenarioProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const progress = await this.scenarioService.getUserScenarioProgress(userId);

      logger.info('Retrieved user scenario progress', {
        userId,
        completedCount: progress.completedScenarios,
        totalCount: progress.totalScenarios,
      });

      res.json({
        success: true,
        data: progress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async validateScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filePath } = req.body;
      
      if (!filePath) {
        throw new ValidationError('File path is required');
      }

      const result = await this.scenarioService.validateScenarioFile(filePath);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async importScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scenarios, targetDirectory } = req.body;

      if (!scenarios || !Array.isArray(scenarios)) {
        throw new ValidationError('Scenarios array is required');
      }

      const result = await this.scenarioService.importScenarios(scenarios, targetDirectory);

      logger.info('Scenarios imported via API', {
        imported: result.imported,
        errors: result.errors.length,
        userId: (req as any).user?.id,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: `Imported ${result.imported} scenarios`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getVersionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const history = await this.scenarioService.getScenarioVersionHistory(id);

      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async rollbackScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { targetVersion, reason } = req.body;
      const author = (req as any).user?.name || 'Unknown';

      if (!targetVersion) {
        throw new ValidationError('Target version is required');
      }

      const result = await this.scenarioService.rollbackScenario(id, targetVersion, author, reason || 'Manual rollback');

      logger.info('Scenario rollback performed', {
        scenarioId: id,
        targetVersion,
        author,
        userId: (req as any).user?.id,
      });

      res.json({
        success: true,
        data: result,
        message: `Rolled back to version ${targetVersion}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async compareVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { version1, version2 } = req.query;

      if (!version1 || !version2) {
        throw new ValidationError('Both version1 and version2 query parameters are required');
      }

      const comparison = await this.scenarioService.compareScenarioVersions(
        id, 
        version1 as string, 
        version2 as string
      );

      res.json({
        success: true,
        data: comparison,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getScenarioStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const stats = await this.scenarioService.getScenarioStatistics(id);

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  // New endpoints for scenario selection and progression

  async getUserProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const progress = await this.progressService.getUserProgressSummary(userId);

      res.json({
        success: true,
        data: progress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const availableScenarios = await this.progressService.getAvailableScenarios(userId);

      logger.info('Retrieved available scenarios for user', {
        userId,
        count: availableScenarios.length,
      });

      res.json({
        success: true,
        data: availableScenarios,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const {
        maxRecommendations = 5,
        difficultyPreference = 'similar',
        categoryPreference,
        timeAvailable,
        focusAreas,
        excludeCompleted = true
      } = req.query;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const recommendations = await this.recommendationService.getRecommendations({
        userId,
        maxRecommendations: parseInt(maxRecommendations as string),
        difficultyPreference: difficultyPreference as any,
        categoryPreference: categoryPreference ? (categoryPreference as string).split(',') : undefined,
        timeAvailable: timeAvailable ? parseInt(timeAvailable as string) : undefined,
        focusAreas: focusAreas ? (focusAreas as string).split(',') : undefined,
        excludeCompleted: excludeCompleted === 'true',
      });

      logger.info('Generated scenario recommendations', {
        userId,
        recommendationCount: recommendations.length,
        maxRequested: maxRecommendations,
      });

      res.json({
        success: true,
        data: recommendations,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceBasedRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const recommendations = await this.recommendationService.getPerformanceBasedRecommendations(userId);

      res.json({
        success: true,
        data: recommendations,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getScenarioProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const progress = await this.progressService.getScenarioProgress(userId, id);

      res.json({
        success: true,
        data: progress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async checkPrerequisites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const prerequisiteCheck = await this.progressService.checkPrerequisites(userId, id);

      res.json({
        success: true,
        data: prerequisiteCheck,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getScenarioPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const scenario = await this.scenarioService.getScenarioById(id);
      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${id} not found`);
      }

      // Get prerequisite information if user is logged in
      let prerequisiteInfo = null;
      if (userId) {
        prerequisiteInfo = await this.progressService.checkPrerequisites(userId, id);
      }

      // Enhance scenario with preview-specific information
      const previewData = {
        ...scenario,
        learningObjectives: this.extractLearningObjectives(scenario),
        prerequisites: prerequisiteInfo || {
          met: true,
          missing: [],
          completed: [],
        },
      };

      logger.info('Retrieved scenario preview', {
        scenarioId: id,
        userId,
        hasPrerequisites: prerequisiteInfo !== null,
      });

      res.json({
        success: true,
        data: previewData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateScenarioCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { score, timeSpent } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      if (typeof score !== 'number' || typeof timeSpent !== 'number') {
        throw new ValidationError('Score and timeSpent must be numbers');
      }

      await this.progressService.updateScenarioCompletion(userId, id, score, timeSpent);

      logger.info('Updated scenario completion', {
        userId,
        scenarioId: id,
        score,
        timeSpent,
      });

      res.json({
        success: true,
        message: 'Scenario completion updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract learning objectives from scenario data
   */
  private extractLearningObjectives(scenario: any): string[] {
    const objectives: string[] = [];

    // Extract from success criteria
    if (scenario.successCriteria && Array.isArray(scenario.successCriteria)) {
      scenario.successCriteria.forEach((criterion: any) => {
        if (criterion.description) {
          objectives.push(criterion.description);
        }
      });
    }

    // Add category-based objective
    if (scenario.ticketTemplate?.category) {
      objectives.unshift(`Master ${scenario.ticketTemplate.category.toLowerCase()} support scenarios`);
    }

    return objectives.slice(0, 5); // Limit to 5 objectives
  }
}