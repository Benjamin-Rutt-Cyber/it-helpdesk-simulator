import { Router } from 'express';
import { ContextController } from '../controllers/contextController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const contextController = new ContextController();

// Validation schemas
const sessionContextSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
  }),
  query: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
});

const scenarioContextSchema = z.object({
  params: z.object({
    scenarioId: z.string().min(1, 'Scenario ID is required'),
  }),
});

const contextPreferencesSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    preferences: z.object({
      defaultView: z.enum(['compact', 'full']).optional(),
      defaultTab: z.enum(['customer', 'technical', 'resources', 'objectives']).optional(),
      autoRefresh: z.boolean().optional(),
      notificationSettings: z.object({
        milestones: z.boolean().optional(),
        deadlines: z.boolean().optional(),
        updates: z.boolean().optional(),
      }).optional(),
    }),
  }),
});

// Routes

/**
 * GET /api/context/health
 * Health check for context service
 */
router.get('/health', contextController.healthCheck);

/**
 * GET /api/context/session/:sessionId
 * Get comprehensive context for an active session
 */
router.get(
  '/session/:sessionId',
  authenticateToken,
  validateRequest(sessionContextSchema),
  contextController.getSessionContext
);

/**
 * GET /api/context/scenario/:scenarioId
 * Get complete scenario context for preview
 */
router.get(
  '/scenario/:scenarioId',
  authenticateToken,
  validateRequest(scenarioContextSchema),
  contextController.getScenarioContext
);

/**
 * GET /api/context/scenario/:scenarioId/ticket
 * Get ticket context for scenario
 */
router.get(
  '/scenario/:scenarioId/ticket',
  authenticateToken,
  validateRequest(scenarioContextSchema),
  contextController.getTicketContext
);

/**
 * GET /api/context/scenario/:scenarioId/customer
 * Get customer context for scenario
 */
router.get(
  '/scenario/:scenarioId/customer',
  authenticateToken,
  validateRequest(scenarioContextSchema),
  contextController.getCustomerContext
);

/**
 * GET /api/context/scenario/:scenarioId/technical
 * Get technical environment context for scenario
 */
router.get(
  '/scenario/:scenarioId/technical',
  authenticateToken,
  validateRequest(scenarioContextSchema),
  contextController.getTechnicalEnvironment
);

/**
 * GET /api/context/scenario/:scenarioId/objectives
 * Get learning objectives for scenario
 */
router.get(
  '/scenario/:scenarioId/objectives',
  authenticateToken,
  validateRequest(scenarioContextSchema),
  contextController.getLearningObjectives
);

/**
 * PUT /api/context/preferences
 * Update user context preferences
 */
router.put(
  '/preferences',
  authenticateToken,
  validateRequest(contextPreferencesSchema),
  contextController.updateContextPreferences
);

/**
 * GET /api/context/analytics
 * Get context usage analytics
 */
router.get(
  '/analytics',
  authenticateToken,
  contextController.getContextAnalytics
);

export { router as contextRoutes };