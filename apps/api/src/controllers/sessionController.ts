import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { SessionService } from '../services/sessionService';
import { sessionManager } from '../services/sessionManager';
import { sessionAnalytics } from '../services/sessionAnalytics';
import SessionRecovery from '../services/sessionRecovery';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Initialize services
const sessionRecovery = new SessionRecovery(sessionManager);

export class SessionController {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  async getSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const session = await this.sessionService.getSessionById(id, userId);

      if (!session) {
        throw new NotFoundError(`Session with ID ${id} not found`);
      }

      logger.info('Retrieved session by ID', {
        sessionId: id,
        userId,
      });

      res.json({
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { message, type } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const messageData = await this.sessionService.sendMessage(id, {
        message,
        type,
        userId,
      });

      logger.info('Sent message in session', {
        sessionId: id,
        messageType: type,
        userId,
      });

      res.status(201).json({
        success: true,
        data: messageData,
        message: 'Message sent successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { resolution, escalated } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const session = await this.sessionService.resolveSession(id, {
        resolution,
        escalated: escalated || false,
        userId,
      });

      logger.info('Resolved session', {
        sessionId: id,
        escalated: escalated || false,
        userId,
      });

      res.json({
        success: true,
        data: session,
        message: 'Session resolved successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const messages = await this.sessionService.getSessionMessages(id, userId);

      logger.info('Retrieved session messages', {
        sessionId: id,
        messageCount: messages.length,
        userId,
      });

      res.json({
        success: true,
        data: messages,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserActiveSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const sessions = await this.sessionService.getUserActiveSessions(userId);

      logger.info('Retrieved user active sessions', {
        userId,
        sessionCount: sessions.length,
      });

      res.json({
        success: true,
        data: sessions,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserCompletedSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const sessions = await this.sessionService.getUserCompletedSessions(userId);

      logger.info('Retrieved user completed sessions', {
        userId,
        sessionCount: sessions.length,
      });

      res.json({
        success: true,
        data: sessions,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Enhanced session management endpoints

  static createSessionValidation = [
    body('scenarioId').isString().notEmpty().withMessage('Scenario ID is required'),
    body('ticketId').optional().isString(),
    body('customerPersona').optional().isString().isIn(['office_worker', 'frustrated_user', 'patient_retiree', 'new_employee', 'executive']),
  ];

  static async createSession(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const { scenarioId, ticketId, customerPersona } = req.body;

      // Create session using enhanced session manager
      const sessionContext = await sessionManager.createSession(
        userId,
        scenarioId,
        ticketId,
        customerPersona
      );

      // Start analytics tracking
      await sessionAnalytics.trackSessionStart(sessionContext);

      res.status(201).json({
        success: true,
        message: 'Session created successfully',
        data: {
          sessionId: sessionContext.sessionId,
          userId: sessionContext.userId,
          scenarioId: sessionContext.scenarioId,
          status: 'created',
          ticketId: sessionContext.ticketId,
          customerPersona: sessionContext.customerPersona,
          createdAt: new Date(sessionContext.performanceMetrics.startTime).toISOString(),
        },
      });

      logger.info('Session created via API', { 
        sessionId: sessionContext.sessionId, 
        userId, 
        scenarioId 
      });
    } catch (error) {
      logger.error('Failed to create session', { error, body: req.body });
      res.status(500).json({
        success: false,
        message: 'Failed to create session',
        error: error.message,
      });
    }
  }

  static startSessionValidation = [
    param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  ];

  static async startSession(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const userId = (req as any).user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      // Start session using enhanced session manager
      const sessionContext = await sessionManager.startSession(sessionId, userId);

      res.json({
        success: true,
        message: 'Session started successfully',
        data: {
          sessionId: sessionContext.sessionId,
          status: 'active',
          startTime: new Date(sessionContext.performanceMetrics.startTime).toISOString(),
          resolutionProgress: sessionContext.resolutionProgress,
        },
      });

      logger.info('Session started via API', { sessionId, userId });
    } catch (error) {
      logger.error('Failed to start session', { error, sessionId: req.params.sessionId });
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      } else if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to start session',
          error: error.message,
        });
      }
    }
  }

  static completeSessionValidation = [
    param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
    body('resolution').isString().notEmpty().withMessage('Resolution is required'),
    body('customerSatisfied').isBoolean().withMessage('Customer satisfaction status is required'),
    body('escalated').optional().isBoolean(),
    body('notes').optional().isArray(),
  ];

  static async completeSession(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const userId = (req as any).user?.id;
      const { sessionId } = req.params;
      const { resolution, customerSatisfied, escalated, notes } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      // Complete session using enhanced session manager
      const sessionContext = await sessionManager.completeSession(sessionId, userId, {
        resolution,
        customerSatisfied,
        escalated,
        notes,
      });

      res.json({
        success: true,
        message: 'Session completed successfully',
        data: {
          sessionId: sessionContext.sessionId,
          status: escalated ? 'escalated' : 'completed',
          completionTime: new Date().toISOString(),
          resolution,
          customerSatisfied,
          performanceMetrics: sessionContext.performanceMetrics,
        },
      });

      logger.info('Session completed via API', { sessionId, userId, escalated });
    } catch (error) {
      logger.error('Failed to complete session', { error, sessionId: req.params.sessionId });
      res.status(500).json({
        success: false,
        message: 'Failed to complete session',
        error: error.message,
      });
    }
  }

  // Session recovery endpoints

  static async getRecoveryStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const recoveryStatus = await sessionRecovery.getRecoveryStatus(sessionId);

      res.json({
        success: true,
        data: recoveryStatus,
      });
    } catch (error) {
      logger.error('Failed to get recovery status', { error, sessionId: req.params.sessionId });
      res.status(500).json({
        success: false,
        message: 'Failed to get recovery status',
        error: error.message,
      });
    }
  }

  static recoverSessionValidation = [
    param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
    body('includeMessages').optional().isBoolean(),
    body('maxMessageHistory').optional().isInt({ min: 1, max: 1000 }),
    body('autoResume').optional().isBoolean(),
  ];

  static async recoverSession(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const userId = (req as any).user?.id;
      const { sessionId } = req.params;
      const options = {
        includeMessages: req.body.includeMessages,
        maxMessageHistory: req.body.maxMessageHistory,
        autoResume: req.body.autoResume,
      };

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const result = await sessionRecovery.recoverSession(sessionId, userId, options);

      if (result.success) {
        res.json({
          success: true,
          message: 'Session recovered successfully',
          data: result,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Session recovery failed',
          data: result,
        });
      }

      logger.info('Session recovery attempted via API', { 
        sessionId, 
        userId, 
        success: result.success,
        recoveryType: result.recoveryType 
      });
    } catch (error) {
      logger.error('Failed to recover session', { error, sessionId: req.params.sessionId });
      res.status(500).json({
        success: false,
        message: 'Failed to recover session',
        error: error.message,
      });
    }
  }

  static async getSessionAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const analytics = await sessionAnalytics.getSessionAnalytics(sessionId);
      
      if (!analytics) {
        res.status(404).json({
          success: false,
          message: 'Session analytics not found',
        });
        return;
      }

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Failed to get session analytics', { error, sessionId: req.params.sessionId });
      res.status(500).json({
        success: false,
        message: 'Failed to get session analytics',
        error: error.message,
      });
    }
  }

  static async sessionHeartbeat(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      await sessionManager.heartbeat(sessionId, userId);
      await sessionRecovery.updateHeartbeat(sessionId);

      res.json({
        success: true,
        message: 'Heartbeat updated',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update heartbeat', { error, sessionId: req.params.sessionId });
      res.status(500).json({
        success: false,
        message: 'Failed to update heartbeat',
        error: error.message,
      });
    }
  }
}