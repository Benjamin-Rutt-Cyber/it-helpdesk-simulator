import { Router } from 'express';
import { escalationController } from '../controllers/escalationController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Validation schemas for escalation requests
const createEscalationSchema = {
  type: 'object',
  required: ['ticketId', 'category', 'justification', 'businessImpact', 'escalationTarget'],
  properties: {
    ticketId: { type: 'string', minLength: 1 },
    category: { 
      type: 'string', 
      enum: ['technical_complexity', 'permissions', 'hardware_failure', 'policy_exception', 'resource_intensive']
    },
    priority: { 
      type: 'string', 
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    justification: { type: 'string', minLength: 50, maxLength: 2000 },
    technicalDetails: { type: 'string', maxLength: 5000 },
    attemptedSolutions: {
      type: 'array',
      items: { type: 'string', minLength: 1, maxLength: 500 }
    },
    requiredPermissions: { type: 'string', maxLength: 1000 },
    businessImpact: { type: 'string', minLength: 10, maxLength: 1000 },
    deadline: { type: 'string', format: 'date-time' },
    escalationTarget: {
      type: 'string',
      enum: ['l2_support', 'system_admin', 'security_team', 'management', 'vendor_support']
    },
    customerNotified: { type: 'boolean', default: false },
    attachments: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  additionalProperties: false
};

const updateStatusSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: ['draft', 'submitted', 'approved', 'rejected', 'in_progress', 'resolved']
    },
    assignedTo: { type: 'string', maxLength: 100 }
  },
  additionalProperties: false
};

const addCommentSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string', minLength: 1, maxLength: 2000 },
    attachments: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  additionalProperties: false
};

// Create a new escalation
router.post('/', validate(createEscalationSchema), escalationController.createEscalation);

// Submit an escalation (change status from draft to submitted)
router.post('/:escalationId/submit', escalationController.submitEscalation);

// Update escalation status
router.patch('/:escalationId/status', validate(updateStatusSchema), escalationController.updateEscalationStatus);

// Add comment to escalation
router.post('/:escalationId/comments', validate(addCommentSchema), escalationController.addComment);

// Get a specific escalation
router.get('/:escalationId', escalationController.getEscalation);

// Update an escalation (only draft status)
router.put('/:escalationId', validate(createEscalationSchema), escalationController.updateEscalation);

// Get escalations by ticket ID
router.get('/ticket/:ticketId', escalationController.getEscalationsByTicket);

// Get escalations by status
router.get('/status/:status', escalationController.getEscalationsByStatus);

// Validate escalation data without creating
router.post('/validate', validate(createEscalationSchema), escalationController.validateEscalation);

// Get escalation targets (available escalation destinations)
router.get('/meta/targets', escalationController.getEscalationTargets);

// Get escalation guidelines and categories
router.get('/meta/guidelines', escalationController.getEscalationGuidelines);

// Get escalation metrics and analytics
router.get('/meta/metrics', escalationController.getEscalationMetrics);

export { router as escalationRoutes };