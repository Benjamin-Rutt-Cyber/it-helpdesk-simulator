import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { PerformanceService } from '../services/performanceService';
import { ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class UserController {
  private userService: UserService;
  private performanceService: PerformanceService;

  constructor() {
    this.userService = new UserService();
    this.performanceService = new PerformanceService();
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.userService.getUserById(userId);

      logger.info('Retrieved current user', {
        userId,
      });

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { firstName, lastName, timezone, preferences } = req.body;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.userService.updateUserProfile(userId, {
        firstName,
        lastName,
        timezone,
        preferences,
      });

      logger.info('Updated user profile', {
        userId,
        updatedFields: Object.keys(req.body),
      });

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const performance = await this.performanceService.getUserPerformance(userId);

      logger.info('Retrieved user performance', {
        userId,
        metricsCount: performance.length,
      });

      res.json({
        success: true,
        data: performance,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const progress = await this.userService.getUserProgress(userId);

      logger.info('Retrieved user progress', {
        userId,
        level: progress.level,
        xp: progress.xp,
        completedScenarios: progress.completedScenarios,
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

  async getUserAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const analytics = await this.performanceService.getUserAnalytics(userId);

      logger.info('Retrieved user analytics', {
        userId,
        analyticsKeys: Object.keys(analytics),
      });

      res.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}