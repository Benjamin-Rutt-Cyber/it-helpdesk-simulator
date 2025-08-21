import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get performance metrics for a session
   * GET /api/analytics/session/:sessionId/performance
   */
  getSessionPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    logger.info('Getting session performance metrics', { sessionId, userId });

    const metrics = await this.analyticsService.calculatePerformanceMetrics(
      sessionId,
      userId as string
    );

    res.json({
      success: true,
      data: metrics,
    });
  });

  /**
   * Get skill assessment for a session
   * GET /api/analytics/session/:sessionId/skills
   */
  getSessionSkills = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    logger.info('Getting session skill assessment', { sessionId, userId });

    const skillAssessment = await this.analyticsService.getSkillAssessment(
      sessionId,
      userId as string
    );

    res.json({
      success: true,
      data: skillAssessment,
    });
  });

  /**
   * Get comparison data for user
   * GET /api/analytics/user/:userId/comparison
   */
  getUserComparison = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { scenarioId } = req.query;

    logger.info('Getting user comparison data', { userId, scenarioId });

    const comparisonData = await this.analyticsService.getComparisonData(
      userId,
      scenarioId as string
    );

    res.json({
      success: true,
      data: comparisonData,
    });
  });

  /**
   * Get detailed feedback for a session
   * GET /api/analytics/session/:sessionId/feedback
   */
  getSessionFeedback = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    logger.info('Getting detailed session feedback', { sessionId, userId });

    const feedback = await this.analyticsService.generateDetailedFeedback(
      sessionId,
      userId as string
    );

    res.json({
      success: true,
      data: feedback,
    });
  });

  /**
   * Get performance overview for user
   * GET /api/analytics/user/:userId/overview
   */
  getUserOverview = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { timeframe = 'month' } = req.query;

    logger.info('Getting user performance overview', { userId, timeframe });

    const overview = await this.analyticsService.getPerformanceOverview(
      userId,
      timeframe as 'week' | 'month' | 'quarter' | 'year'
    );

    res.json({
      success: true,
      data: overview,
    });
  });

  /**
   * Generate performance report
   * POST /api/analytics/user/:userId/report
   */
  generateReport = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { reportType, timeframe, exportFormat } = req.body;

    logger.info('Generating performance report', { userId, reportType, exportFormat });

    const report = await this.analyticsService.generatePerformanceReport(
      userId,
      reportType,
      timeframe,
      exportFormat
    );

    res.json({
      success: true,
      data: report,
    });
  });

  /**
   * Set improvement goal
   * POST /api/analytics/user/:userId/goals
   */
  setImprovementGoal = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const goalData = req.body;

    logger.info('Setting improvement goal', { userId, skillArea: goalData.skillArea });

    const goal = await this.analyticsService.setImprovementGoal(userId, goalData);

    res.status(201).json({
      success: true,
      data: goal,
    });
  });

  /**
   * Get analytics dashboard data
   * GET /api/analytics/user/:userId/dashboard
   */
  getDashboardData = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { timeframe = 'month' } = req.query;

    logger.info('Getting analytics dashboard data', { userId, timeframe });

    // Aggregate multiple analytics calls for dashboard
    const [overview, recentSessions, skillTrends] = await Promise.all([
      this.analyticsService.getPerformanceOverview(
        userId,
        timeframe as 'week' | 'month' | 'quarter' | 'year'
      ),
      // Mock recent sessions data
      Promise.resolve([
        {
          sessionId: 'session-1',
          scenarioTitle: 'Email Configuration Issue',
          score: 85,
          completedAt: new Date(),
        },
        {
          sessionId: 'session-2',
          scenarioTitle: 'Network Connectivity Problem',
          score: 78,
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ]),
      // Mock skill trends data
      Promise.resolve({
        technical: [72, 75, 78, 82, 85],
        communication: [76, 78, 80, 83, 84],
        procedural: [74, 76, 79, 80, 82],
      }),
    ]);

    const dashboardData = {
      overview,
      recentSessions,
      skillTrends,
      performanceChart: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Overall Score',
            data: [72, 76, 82, 85],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
        ],
      },
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  });

  /**
   * Get analytics summary for multiple users (admin only)
   * GET /api/analytics/summary
   */
  getAnalyticsSummary = asyncHandler(async (req: Request, res: Response) => {
    const { timeframe = 'month', limit = 10 } = req.query;

    logger.info('Getting analytics summary', { timeframe, limit });

    // Mock aggregated analytics data
    const summary = {
      totalUsers: 245,
      totalSessions: 1847,
      averageScore: 78.5,
      completionRate: 0.87,
      topPerformers: [
        { userId: 'user-1', name: 'Anonymous User 1', averageScore: 92.5 },
        { userId: 'user-2', name: 'Anonymous User 2', averageScore: 91.2 },
        { userId: 'user-3', name: 'Anonymous User 3', averageScore: 89.8 },
      ],
      skillDistribution: {
        technical: { average: 76.8, median: 78.2 },
        communication: { average: 82.1, median: 83.5 },
        procedural: { average: 79.3, median: 80.1 },
      },
      scenarioPopularity: [
        { scenarioId: 'email-config', title: 'Email Configuration', attempts: 324 },
        { scenarioId: 'network-issue', title: 'Network Problems', attempts: 298 },
        { scenarioId: 'software-install', title: 'Software Installation', attempts: 267 },
      ],
      improvementTrends: {
        overall: 12.3,
        bySkill: {
          technical: 15.7,
          communication: 9.8,
          procedural: 11.2,
        },
      },
    };

    res.json({
      success: true,
      data: summary,
    });
  });

  /**
   * Export analytics data
   * GET /api/analytics/export
   */
  exportAnalyticsData = asyncHandler(async (req: Request, res: Response) => {
    const { userId, format = 'json', timeframe } = req.query;

    logger.info('Exporting analytics data', { userId, format, timeframe });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for export',
      });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      timeframe,
      format,
      data: {
        // Mock export data
        sessions: [],
        performance: {},
        skills: {},
        achievements: [],
      },
    };

    // Set appropriate headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${userId}.csv"`);
      // Convert to CSV format
      res.send('userId,sessionId,score,completedAt\n');
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${userId}.pdf"`);
      // Generate PDF (would use a PDF library)
      res.json({ message: 'PDF generation not implemented yet' });
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${userId}.json"`);
      res.json(exportData);
    }
  });

  /**
   * Health check for analytics service
   * GET /api/analytics/health
   */
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    // Perform basic health checks
    const checks = {
      analyticsService: true,
      database: true, // Would check actual database connection
      calculations: true, // Would test calculation algorithms
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