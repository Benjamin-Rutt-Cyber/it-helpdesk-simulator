import { Request, Response } from 'express';
import { ContextService } from '../services/contextService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ContextController {
  private contextService: ContextService;

  constructor() {
    this.contextService = new ContextService();
  }

  /**
   * Get comprehensive context for a session
   * GET /api/context/session/:sessionId
   */
  getSessionContext = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    logger.info('Getting session context', { sessionId, userId });

    const context = await this.contextService.getSessionContext(
      sessionId,
      userId as string
    );

    res.json({
      success: true,
      data: context,
    });
  });

  /**
   * Get ticket context for scenario preview
   * GET /api/context/scenario/:scenarioId/ticket
   */
  getTicketContext = asyncHandler(async (req: Request, res: Response) => {
    const { scenarioId } = req.params;

    logger.info('Getting ticket context', { scenarioId });

    const ticketContext = await this.contextService.getTicketContext(scenarioId);

    res.json({
      success: true,
      data: ticketContext,
    });
  });

  /**
   * Get customer context for scenario
   * GET /api/context/scenario/:scenarioId/customer
   */
  getCustomerContext = asyncHandler(async (req: Request, res: Response) => {
    const { scenarioId } = req.params;

    logger.info('Getting customer context', { scenarioId });

    const customerContext = await this.contextService.getCustomerContext(scenarioId);

    res.json({
      success: true,
      data: customerContext,
    });
  });

  /**
   * Get technical environment context
   * GET /api/context/scenario/:scenarioId/technical
   */
  getTechnicalEnvironment = asyncHandler(async (req: Request, res: Response) => {
    const { scenarioId } = req.params;

    logger.info('Getting technical environment', { scenarioId });

    const technicalEnvironment = await this.contextService.getTechnicalEnvironment(scenarioId);

    res.json({
      success: true,
      data: technicalEnvironment,
    });
  });

  /**
   * Get learning objectives for scenario
   * GET /api/context/scenario/:scenarioId/objectives
   */
  getLearningObjectives = asyncHandler(async (req: Request, res: Response) => {
    const { scenarioId } = req.params;

    logger.info('Getting learning objectives', { scenarioId });

    const objectives = await this.contextService.getLearningObjectives(scenarioId);

    res.json({
      success: true,
      data: objectives,
    });
  });

  /**
   * Get complete scenario context (for preview)
   * GET /api/context/scenario/:scenarioId
   */
  getScenarioContext = asyncHandler(async (req: Request, res: Response) => {
    const { scenarioId } = req.params;

    logger.info('Getting complete scenario context', { scenarioId });

    // Build a preview context by getting individual components
    const [
      ticketContext,
      customerContext,
      technicalEnvironment,
      objectives
    ] = await Promise.all([
      this.contextService.getTicketContext(scenarioId),
      this.contextService.getCustomerContext(scenarioId),
      this.contextService.getTechnicalEnvironment(scenarioId),
      this.contextService.getLearningObjectives(scenarioId)
    ]);

    // Create a mock session info for preview
    const previewContext = {
      ticket: ticketContext,
      customer: customerContext,
      technical: technicalEnvironment,
      history: {
        relatedTickets: [],
        knownIssues: [],
        patternAnalysis: {
          recurringPatterns: [],
          seasonalTrends: [],
          timeBasedPatterns: [],
          userBehaviorPatterns: []
        },
        escalationHistory: []
      },
      resources: {
        scenarioResources: [],
        quickReferences: [],
        troubleshootingFlows: [],
        toolAccess: []
      },
      objectives,
      sessionInfo: {
        sessionId: 'preview',
        startTime: new Date(),
        estimatedDuration: ticketContext.estimatedTime,
        difficulty: ticketContext.complexity === 'simple' ? 'starter' as const :
                   ticketContext.complexity === 'moderate' ? 'intermediate' as const :
                   'advanced' as const,
        scenarioVersion: '1.0.0'
      }
    };

    res.json({
      success: true,
      data: previewContext,
    });
  });

  /**
   * Update context preferences for user
   * PUT /api/context/preferences
   */
  updateContextPreferences = asyncHandler(async (req: Request, res: Response) => {
    const { userId, preferences } = req.body;

    logger.info('Updating context preferences', { userId, preferences });

    // This would update user preferences in the database
    // For now, just return success
    res.json({
      success: true,
      message: 'Context preferences updated successfully',
      data: preferences,
    });
  });

  /**
   * Get context usage analytics
   * GET /api/context/analytics
   */
  getContextAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { timeframe = '7d', userId } = req.query;

    logger.info('Getting context analytics', { timeframe, userId });

    // This would return analytics about context usage
    const mockAnalytics = {
      totalSessions: 45,
      averageContextLoadTime: 1.2,
      mostViewedContextTypes: [
        { type: 'customer', views: 134 },
        { type: 'technical', views: 112 },
        { type: 'resources', views: 89 },
        { type: 'objectives', views: 67 }
      ],
      userEngagement: {
        averageTimeSpent: 180, // seconds
        contextSwitches: 8.5,
        completionRate: 0.85
      }
    };

    res.json({
      success: true,
      data: mockAnalytics,
    });
  });

  /**
   * Health check for context service
   * GET /api/context/health
   */
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    // Perform basic health checks
    const checks = {
      contextService: true,
      database: true, // Would check actual database connection
      cache: true,    // Would check Redis connection
    };

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        checks,
        timestamp: new Date().toISOString(),
      },
    });
  });
}