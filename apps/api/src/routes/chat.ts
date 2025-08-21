import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { chatService } from '../services/chatService';
import { logger } from '../utils/logger';

const router = Router();

// Middleware to handle validation errors
const handleValidationErrors = (req: AuthenticatedRequest, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * @swagger
 * /api/v1/chat/sessions/{sessionId}/messages:
 *   get:
 *     summary: Get messages for a chat session
 *     description: Retrieve messages for a specific session with pagination
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get(
  '/sessions/:sessionId/messages',
  authMiddleware,
  param('sessionId').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  handleValidationErrors,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const messages = await chatService.getSessionMessages(sessionId, { limit, offset });
      const total = await chatService.getMessageCount(sessionId);

      res.json({
        success: true,
        messages,
        pagination: {
          limit,
          offset,
          total,
        },
      });
    } catch (error) {
      logger.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/chat/sessions/{sessionId}/messages:
 *   post:
 *     summary: Send a chat message
 *     description: Send a message in a chat session
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - senderType
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *               senderType:
 *                 type: string
 *                 enum: [user, ai]
 *                 description: Type of sender
 *               metadata:
 *                 type: object
 *                 description: Additional message metadata
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   $ref: '#/components/schemas/ChatMessage'
 */
router.post(
  '/sessions/:sessionId/messages',
  authMiddleware,
  param('sessionId').isString().notEmpty(),
  body('content').isString().notEmpty(),
  body('senderType').isIn(['user', 'ai']),
  body('metadata').optional().isObject(),
  handleValidationErrors,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId } = req.params;
      const { content, senderType, metadata } = req.body;
      const userId = req.user!.id;

      const message = await chatService.saveMessage({
        sessionId,
        userId,
        senderType,
        messageContent: content,
        metadata,
      });

      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/chat/sessions/{sessionId}/messages/search:
 *   get:
 *     summary: Search messages in a session
 *     description: Search for messages containing specific text
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to return
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 *                 query:
 *                   type: string
 */
router.get(
  '/sessions/:sessionId/messages/search',
  authMiddleware,
  param('sessionId').isString().notEmpty(),
  query('query').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId } = req.params;
      const searchQuery = req.query.query as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await chatService.searchMessages(sessionId, { query: searchQuery, limit });

      res.json({
        success: true,
        messages,
        query: searchQuery,
      });
    } catch (error) {
      logger.error('Error searching messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search messages',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/chat/sessions/{sessionId}/stats:
 *   get:
 *     summary: Get chat session statistics
 *     description: Get statistics for a chat session
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalMessages:
 *                       type: integer
 *                     userMessages:
 *                       type: integer
 *                     aiMessages:
 *                       type: integer
 *                     averageResponseTime:
 *                       type: number
 */
router.get(
  '/sessions/:sessionId/stats',
  authMiddleware,
  param('sessionId').isString().notEmpty(),
  handleValidationErrors,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId } = req.params;
      const stats = await chatService.getSessionStats(sessionId);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Error fetching session stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session stats',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/chat/messages/{messageId}:
 *   get:
 *     summary: Get a specific message
 *     description: Retrieve a specific message by ID
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   $ref: '#/components/schemas/ChatMessage'
 *       404:
 *         description: Message not found
 */
router.get(
  '/messages/:messageId',
  authMiddleware,
  param('messageId').isString().notEmpty(),
  handleValidationErrors,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { messageId } = req.params;
      const message = await chatService.getMessageById(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
        });
      }

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      logger.error('Error fetching message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch message',
      });
    }
  }
);

export default router;