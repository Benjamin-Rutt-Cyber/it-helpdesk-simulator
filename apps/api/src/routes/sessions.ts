import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { createValidationChain, sanitizeInput } from '../middleware/validation';
import { SessionController } from '../controllers/sessionController';

const router = Router();
const sessionController = new SessionController();

// Get session by ID
router.get('/:id', 
  authMiddleware,
  createValidationChain([
    param('id')
      .isUUID()
      .withMessage('Session ID must be a valid UUID')
      .customSanitizer(sanitizeInput),
  ]),
  sessionController.getSessionById.bind(sessionController)
);

// Send message in session
router.post('/:id/messages', 
  authMiddleware,
  createValidationChain([
    param('id')
      .isUUID()
      .withMessage('Session ID must be a valid UUID')
      .customSanitizer(sanitizeInput),
    body('message')
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters')
      .customSanitizer(sanitizeInput),
    body('type')
      .isIn(['user', 'system', 'customer'])
      .withMessage('Message type must be user, system, or customer')
      .customSanitizer(sanitizeInput),
  ]),
  sessionController.sendMessage.bind(sessionController)
);

// Resolve session
router.post('/:id/resolve', 
  authMiddleware,
  createValidationChain([
    param('id')
      .isUUID()
      .withMessage('Session ID must be a valid UUID')
      .customSanitizer(sanitizeInput),
    body('resolution')
      .isString()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Resolution must be between 10 and 500 characters')
      .customSanitizer(sanitizeInput),
    body('escalated')
      .optional()
      .isBoolean()
      .withMessage('Escalated must be a boolean'),
  ]),
  sessionController.resolveSession.bind(sessionController)
);

// Get session messages
router.get('/:id/messages', 
  authMiddleware,
  createValidationChain([
    param('id')
      .isUUID()
      .withMessage('Session ID must be a valid UUID')
      .customSanitizer(sanitizeInput),
  ]),
  sessionController.getSessionMessages.bind(sessionController)
);

// Get user's active sessions
router.get('/active/me', 
  authMiddleware,
  sessionController.getUserActiveSessions.bind(sessionController)
);

// Get user's completed sessions
router.get('/completed/me', 
  authMiddleware,
  sessionController.getUserCompletedSessions.bind(sessionController)
);


export default router;