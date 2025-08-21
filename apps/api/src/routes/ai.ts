import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import aiController from '../controllers/aiController';
import aiErrorHandler from '../middleware/aiErrorHandler';
import aiMetricsTracker from '../middleware/aiMetrics';

const router = Router();

// Apply authentication to all AI routes
router.use(authenticateToken);

// Apply AI metrics tracking middleware
router.use(aiMetricsTracker.middleware());

// Apply AI error handling middleware
router.use(aiErrorHandler.middleware());

/**
 * @swagger
 * /api/ai/generate-response:
 *   post:
 *     summary: Generate AI customer response
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - userMessage
 *             properties:
 *               conversationId:
 *                 type: string
 *               userMessage:
 *                 type: string
 *               persona:
 *                 type: object
 *               ticket:
 *                 type: object
 *               scenario:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/generate-response', [
  body('conversationId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('conversationId is required'),
  body('userMessage')
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('userMessage is required and must be less than 2000 characters'),
  body('persona')
    .optional()
    .isObject()
    .withMessage('persona must be an object'),
  body('ticket')
    .optional()
    .isObject()
    .withMessage('ticket must be an object'),
  body('scenario')
    .optional()
    .isObject()
    .withMessage('scenario must be an object'),
  body('options')
    .optional()
    .isObject()
    .withMessage('options must be an object'),
  body('options.temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('temperature must be between 0 and 2'),
  body('options.maxTokens')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('maxTokens must be between 1 and 4000'),
  validateRequest
], aiController.generateResponse);

/**
 * @swagger
 * /api/ai/conversation/{conversationId}/context:
 *   get:
 *     summary: Get conversation context
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation context retrieved
 *       404:
 *         description: Conversation not found
 */
router.get('/conversation/:conversationId/context', [
  param('conversationId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('conversationId is required'),
  validateRequest
], aiController.getConversationContext);

/**
 * @swagger
 * /api/ai/conversation/{conversationId}/context:
 *   post:
 *     summary: Update conversation context
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scenarioId:
 *                 type: string
 *               personaId:
 *                 type: string
 *               contextData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Context updated successfully
 */
router.post('/conversation/:conversationId/context', [
  param('conversationId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('conversationId is required'),
  body('scenarioId')
    .optional()
    .isString(),
  body('personaId')
    .optional()
    .isString(),
  body('contextData')
    .optional()
    .isObject(),
  validateRequest
], aiController.updateConversationContext);

/**
 * @swagger
 * /api/ai/metrics:
 *   get:
 *     summary: Get aggregated AI metrics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 */
router.get('/metrics', [
  query('timeframe')
    .optional()
    .isIn(['1h', '24h', '7d', '30d'])
    .withMessage('timeframe must be 1h, 24h, 7d, or 30d'),
  validateRequest
], aiController.getMetrics);

/**
 * @swagger
 * /api/ai/metrics/{conversationId}:
 *   get:
 *     summary: Get conversation-specific metrics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation metrics retrieved
 *       404:
 *         description: Metrics not found
 */
router.get('/metrics/:conversationId', [
  param('conversationId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('conversationId is required'),
  validateRequest
], aiController.getMetrics);

/**
 * @swagger
 * /api/ai/persona/{conversationId}/analytics:
 *   get:
 *     summary: Get persona consistency analytics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Persona analytics retrieved
 */
router.get('/persona/:conversationId/analytics', [
  param('conversationId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('conversationId is required'),
  validateRequest
], aiController.getPersonaAnalytics);

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     summary: AI service health check
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Service healthy
 *       503:
 *         description: Service unhealthy
 */
router.get('/health', aiController.healthCheck);

/**
 * @swagger
 * /api/ai/generate-variations:
 *   post:
 *     summary: Generate multiple response variations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - userMessage
 *               - persona
 *             properties:
 *               conversationId:
 *                 type: string
 *               userMessage:
 *                 type: string
 *               persona:
 *                 type: object
 *               variations:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 3
 *     responses:
 *       200:
 *         description: Response variations generated
 */
router.post('/generate-variations', [
  body('conversationId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('conversationId is required'),
  body('userMessage')
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('userMessage is required and must be less than 2000 characters'),
  body('persona')
    .isObject()
    .withMessage('persona is required and must be an object'),
  body('variations')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('variations must be between 1 and 5'),
  validateRequest
], aiController.generateVariations);

/**
 * @swagger
 * /api/ai/cost-analysis/{conversationId}:
 *   get:
 *     summary: Get cost analysis and optimization recommendations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cost analysis retrieved
 */
router.get('/cost-analysis/:conversationId', [
  param('conversationId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('conversationId is required'),
  validateRequest
], aiController.getCostAnalysis);

/**
 * @swagger
 * /api/ai/conversation/{conversationId}:
 *   delete:
 *     summary: Delete conversation and all associated data
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 */
router.delete('/conversation/:conversationId', [
  param('conversationId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('conversationId is required'),
  validateRequest
], aiController.deleteConversation);

/**
 * @swagger
 * /api/ai/presets:
 *   get:
 *     summary: Get preset personas and scenario templates
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Presets retrieved successfully
 */
router.get('/presets', aiController.getPresetPersonas);

export default router;