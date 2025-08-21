import { Router } from 'express';
import { WorkflowOptimizerService } from '../services/workflowOptimizerService';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();
const workflowOptimizer = new WorkflowOptimizerService();

/**
 * Get recommended workflow pattern
 * POST /api/v1/workflow/recommend-pattern
 */
router.post('/recommend-pattern', async (req, res) => {
  try {
    const { ticketContext } = req.body;

    if (!ticketContext) {
      throw new ValidationError('Ticket context is required');
    }

    const pattern = await workflowOptimizer.getRecommendedPattern(ticketContext);

    res.json({
      success: true,
      pattern,
      hasRecommendation: !!pattern
    });

  } catch (error) {
    logger.error('Error getting recommended pattern:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommended pattern'
    });
  }
});

/**
 * Start workflow execution
 * POST /api/v1/workflow/start-execution
 */
router.post('/start-execution', async (req, res) => {
  try {
    const { patternId, ticketId, userId } = req.body;

    if (!patternId || !ticketId || !userId) {
      throw new ValidationError('Pattern ID, ticket ID, and user ID are required');
    }

    const execution = await workflowOptimizer.startWorkflowExecution(patternId, ticketId, userId);

    res.status(201).json({
      success: true,
      execution
    });

  } catch (error) {
    logger.error('Error starting workflow execution:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start workflow execution'
    });
  }
});

/**
 * Complete workflow step
 * POST /api/v1/workflow/complete-step
 */
router.post('/complete-step', async (req, res) => {
  try {
    const { executionId, stepId, duration, quality } = req.body;

    if (!executionId || !stepId || duration === undefined) {
      throw new ValidationError('Execution ID, step ID, and duration are required');
    }

    await workflowOptimizer.completeWorkflowStep(executionId, stepId, duration, quality);

    res.json({
      success: true,
      message: 'Workflow step completed successfully'
    });

  } catch (error) {
    logger.error('Error completing workflow step:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete workflow step'
    });
  }
});

/**
 * Skip workflow step
 * POST /api/v1/workflow/skip-step
 */
router.post('/skip-step', async (req, res) => {
  try {
    const { executionId, stepId, reason } = req.body;

    if (!executionId || !stepId) {
      throw new ValidationError('Execution ID and step ID are required');
    }

    await workflowOptimizer.skipWorkflowStep(executionId, stepId, reason || 'No reason provided');

    res.json({
      success: true,
      message: 'Workflow step skipped successfully'
    });

  } catch (error) {
    logger.error('Error skipping workflow step:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to skip workflow step'
    });
  }
});

/**
 * Get optimization suggestions
 * POST /api/v1/workflow/optimization-suggestions
 */
router.post('/optimization-suggestions', async (req, res) => {
  try {
    const { executionHistory, patternId } = req.body;

    if (!Array.isArray(executionHistory)) {
      throw new ValidationError('Execution history must be an array');
    }

    const suggestions = await workflowOptimizer.getOptimizationSuggestions(executionHistory, patternId);

    res.json({
      success: true,
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    logger.error('Error getting optimization suggestions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get optimization suggestions'
    });
  }
});

/**
 * Get workflow analytics
 * GET /api/v1/workflow/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    let dateRange;
    if (req.query.startDate && req.query.endDate) {
      dateRange = {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string)
      };
    }

    const analytics = await workflowOptimizer.getWorkflowAnalytics(dateRange);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    logger.error('Error getting workflow analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflow analytics'
    });
  }
});

/**
 * Get workflow service status
 * GET /api/v1/workflow/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await workflowOptimizer.getServiceStatus();

    res.json({
      success: true,
      service: 'Workflow Optimizer',
      timestamp: new Date().toISOString(),
      ...status
    });

  } catch (error) {
    logger.error('Error getting workflow service status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get service status'
    });
  }
});

/**
 * Trigger workflow cleanup
 * POST /api/v1/workflow/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    await workflowOptimizer.cleanup();

    res.json({
      success: true,
      message: 'Workflow cleanup completed successfully'
    });

  } catch (error) {
    logger.error('Error during workflow cleanup:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform cleanup'
    });
  }
});

export default router;