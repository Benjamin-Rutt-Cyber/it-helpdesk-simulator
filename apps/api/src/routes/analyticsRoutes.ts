import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const analyticsController = new AnalyticsController();

// Validation schemas
const sessionAnalyticsSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
  }),
  query: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
});

const userAnalyticsSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
});

const comparisonSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  query: z.object({
    scenarioId: z.string().optional(),
  }),
});

const reportGenerationSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    reportType: z.enum(['summary', 'detailed', 'portfolio', 'interview_prep']),
    timeframe: z.object({
      startDate: z.string().transform(str => new Date(str)),
      endDate: z.string().transform(str => new Date(str)),
    }),
    exportFormat: z.enum(['pdf', 'json', 'csv']).optional().default('json'),
  }),
});

const improvementGoalSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    skillArea: z.string().min(1, 'Skill area is required'),
    currentLevel: z.number().min(0).max(100),
    targetLevel: z.number().min(0).max(100),
    targetDate: z.string().transform(str => new Date(str)),
    strategies: z.array(z.string()).optional().default([]),
    milestones: z.array(z.object({
      description: z.string(),
      targetDate: z.string().transform(str => new Date(str)),
      completed: z.boolean().optional().default(false),
    })).optional().default([]),
  }),
});

const overviewSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  query: z.object({
    timeframe: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  }),
});

const exportSchema = z.object({
  query: z.object({
    userId: z.string().min(1, 'User ID is required'),
    format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
    timeframe: z.object({
      startDate: z.string().transform(str => new Date(str)),
      endDate: z.string().transform(str => new Date(str)),
    }).optional(),
  }),
});

// Routes

/**
 * GET /api/analytics/health
 * Health check for analytics service
 */
router.get('/health', analyticsController.healthCheck);

/**
 * GET /api/analytics/session/:sessionId/performance
 * Get performance metrics for a specific session
 */
router.get(
  '/session/:sessionId/performance',
  authenticateToken,
  validateRequest(sessionAnalyticsSchema),
  analyticsController.getSessionPerformance
);

/**
 * GET /api/analytics/session/:sessionId/skills
 * Get skill assessment for a specific session
 */
router.get(
  '/session/:sessionId/skills',
  authenticateToken,
  validateRequest(sessionAnalyticsSchema),
  analyticsController.getSessionSkills
);

/**
 * GET /api/analytics/session/:sessionId/feedback
 * Get detailed feedback for a specific session
 */
router.get(
  '/session/:sessionId/feedback',
  authenticateToken,
  validateRequest(sessionAnalyticsSchema),
  analyticsController.getSessionFeedback
);

/**
 * GET /api/analytics/user/:userId/overview
 * Get performance overview for a user
 */
router.get(
  '/user/:userId/overview',
  authenticateToken,
  validateRequest(overviewSchema),
  analyticsController.getUserOverview
);

/**
 * GET /api/analytics/user/:userId/comparison
 * Get comparison data for a user (historical and peer)
 */
router.get(
  '/user/:userId/comparison',
  authenticateToken,
  validateRequest(comparisonSchema),
  analyticsController.getUserComparison
);

/**
 * GET /api/analytics/user/:userId/dashboard
 * Get comprehensive dashboard data for a user
 */
router.get(
  '/user/:userId/dashboard',
  authenticateToken,
  validateRequest(overviewSchema),
  analyticsController.getDashboardData
);

/**
 * POST /api/analytics/user/:userId/report
 * Generate performance report for a user
 */
router.post(
  '/user/:userId/report',
  authenticateToken,
  validateRequest(reportGenerationSchema),
  analyticsController.generateReport
);

/**
 * POST /api/analytics/user/:userId/goals
 * Set improvement goal for a user
 */
router.post(
  '/user/:userId/goals',
  authenticateToken,
  validateRequest(improvementGoalSchema),
  analyticsController.setImprovementGoal
);

/**
 * GET /api/analytics/summary
 * Get aggregated analytics summary (admin only)
 * Note: In a real implementation, this would include admin authorization
 */
router.get(
  '/summary',
  authenticateToken,
  analyticsController.getAnalyticsSummary
);

/**
 * GET /api/analytics/export
 * Export analytics data in various formats
 */
router.get(
  '/export',
  authenticateToken,
  validateRequest(exportSchema),
  analyticsController.exportAnalyticsData
);

export { router as analyticsRoutes };