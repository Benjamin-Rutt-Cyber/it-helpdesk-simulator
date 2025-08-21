import { Request, Response } from 'express';
import { escalationService, EscalationRequest } from '../services/escalationService';
import { logger } from '../utils/logger';

export class EscalationController {
  async createEscalation(req: Request, res: Response): Promise<void> {
    try {
      const escalationData = req.body;
      
      // Validate required fields
      if (!escalationData.ticketId) {
        res.status(400).json({
          success: false,
          error: 'Ticket ID is required'
        });
        return;
      }

      if (!escalationData.category) {
        res.status(400).json({
          success: false,
          error: 'Escalation category is required'
        });
        return;
      }

      if (!escalationData.justification || escalationData.justification.length < 50) {
        res.status(400).json({
          success: false,
          error: 'Justification must be at least 50 characters'
        });
        return;
      }

      const escalation = await escalationService.createEscalation(escalationData);
      
      res.status(201).json({
        success: true,
        data: escalation
      });

      logger.info('Escalation created via API', {
        escalationId: escalation.id,
        ticketId: escalation.ticketId,
        userId: req.user?.id
      });
    } catch (error) {
      logger.error('Error creating escalation via API', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create escalation'
      });
    }
  }

  async submitEscalation(req: Request, res: Response): Promise<void> {
    try {
      const { escalationId } = req.params;
      
      if (!escalationId) {
        res.status(400).json({
          success: false,
          error: 'Escalation ID is required'
        });
        return;
      }

      const escalation = await escalationService.submitEscalation(escalationId);
      
      res.json({
        success: true,
        data: escalation
      });

      logger.info('Escalation submitted via API', {
        escalationId,
        ticketId: escalation.ticketId,
        userId: req.user?.id
      });
    } catch (error) {
      logger.error('Error submitting escalation via API', { error, escalationId: req.params.escalationId });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit escalation'
      });
    }
  }

  async updateEscalationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { escalationId } = req.params;
      const { status, assignedTo } = req.body;
      
      if (!escalationId) {
        res.status(400).json({
          success: false,
          error: 'Escalation ID is required'
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required'
        });
        return;
      }

      const validStatuses = ['draft', 'submitted', 'approved', 'rejected', 'in_progress', 'resolved'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      const escalation = await escalationService.updateEscalationStatus(escalationId, status, assignedTo);
      
      res.json({
        success: true,
        data: escalation
      });

      logger.info('Escalation status updated via API', {
        escalationId,
        status,
        assignedTo,
        userId: req.user?.id
      });
    } catch (error) {
      logger.error('Error updating escalation status via API', { 
        error, 
        escalationId: req.params.escalationId,
        body: req.body 
      });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update escalation status'
      });
    }
  }

  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { escalationId } = req.params;
      const { message, attachments } = req.body;
      
      if (!escalationId) {
        res.status(400).json({
          success: false,
          error: 'Escalation ID is required'
        });
        return;
      }

      if (!message || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Comment message is required'
        });
        return;
      }

      // Get user info from request (assuming auth middleware sets this)
      const author = req.user?.name || 'Unknown User';
      const authorRole = req.user?.role || 'technician';

      const comment = await escalationService.addComment(escalationId, {
        author,
        authorRole,
        message: message.trim(),
        type: 'user',
        attachments: attachments || []
      });
      
      res.json({
        success: true,
        data: comment
      });

      logger.info('Comment added to escalation via API', {
        escalationId,
        commentId: comment.id,
        author,
        userId: req.user?.id
      });
    } catch (error) {
      logger.error('Error adding comment via API', { 
        error, 
        escalationId: req.params.escalationId,
        body: req.body 
      });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment'
      });
    }
  }

  async getEscalation(req: Request, res: Response): Promise<void> {
    try {
      const { escalationId } = req.params;
      
      if (!escalationId) {
        res.status(400).json({
          success: false,
          error: 'Escalation ID is required'
        });
        return;
      }

      const escalation = await escalationService.getEscalation(escalationId);
      
      if (!escalation) {
        res.status(404).json({
          success: false,
          error: 'Escalation not found'
        });
        return;
      }

      res.json({
        success: true,
        data: escalation
      });
    } catch (error) {
      logger.error('Error getting escalation via API', { 
        error, 
        escalationId: req.params.escalationId 
      });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escalation'
      });
    }
  }

  async getEscalationsByTicket(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      
      if (!ticketId) {
        res.status(400).json({
          success: false,
          error: 'Ticket ID is required'
        });
        return;
      }

      const escalations = await escalationService.getEscalationsByTicket(ticketId);
      
      res.json({
        success: true,
        data: escalations
      });
    } catch (error) {
      logger.error('Error getting escalations by ticket via API', { 
        error, 
        ticketId: req.params.ticketId 
      });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escalations'
      });
    }
  }

  async getEscalationsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      
      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required'
        });
        return;
      }

      const validStatuses = ['draft', 'submitted', 'approved', 'rejected', 'in_progress', 'resolved'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      const escalations = await escalationService.getEscalationsByStatus(status as EscalationRequest['status']);
      
      res.json({
        success: true,
        data: escalations
      });
    } catch (error) {
      logger.error('Error getting escalations by status via API', { 
        error, 
        status: req.params.status 
      });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escalations'
      });
    }
  }

  async validateEscalation(req: Request, res: Response): Promise<void> {
    try {
      const escalationData = req.body;
      
      // Create a temporary escalation object for validation
      const tempEscalation = {
        id: 'temp',
        createdAt: new Date(),
        comments: [],
        performanceMetrics: { timeToEscalate: 0 },
        status: 'draft' as const,
        ...escalationData
      };

      const validationResult = await escalationService.validateEscalation(tempEscalation);
      
      res.json({
        success: true,
        data: validationResult
      });
    } catch (error) {
      logger.error('Error validating escalation via API', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate escalation'
      });
    }
  }

  async getEscalationTargets(req: Request, res: Response): Promise<void> {
    try {
      const targets = escalationService.getEscalationTargets();
      
      res.json({
        success: true,
        data: targets
      });
    } catch (error) {
      logger.error('Error getting escalation targets via API', { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escalation targets'
      });
    }
  }

  async getEscalationGuidelines(req: Request, res: Response): Promise<void> {
    try {
      const guidelines = escalationService.getEscalationGuidelines();
      
      res.json({
        success: true,
        data: guidelines
      });
    } catch (error) {
      logger.error('Error getting escalation guidelines via API', { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escalation guidelines'
      });
    }
  }

  async getEscalationMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await escalationService.getEscalationMetrics();
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting escalation metrics via API', { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escalation metrics'
      });
    }
  }

  async updateEscalation(req: Request, res: Response): Promise<void> {
    try {
      const { escalationId } = req.params;
      const updateData = req.body;
      
      if (!escalationId) {
        res.status(400).json({
          success: false,
          error: 'Escalation ID is required'
        });
        return;
      }

      // Get existing escalation
      const existingEscalation = await escalationService.getEscalation(escalationId);
      if (!existingEscalation) {
        res.status(404).json({
          success: false,
          error: 'Escalation not found'
        });
        return;
      }

      // Only allow updates if escalation is in draft status
      if (existingEscalation.status !== 'draft') {
        res.status(400).json({
          success: false,
          error: 'Only draft escalations can be updated'
        });
        return;
      }

      // Update the escalation (this would need to be implemented in the service)
      // For now, we'll create a new escalation with updated data
      const updatedData = {
        ...existingEscalation,
        ...updateData,
        id: escalationId,
        updatedAt: new Date()
      };

      // Validate the updated escalation
      const validationResult = await escalationService.validateEscalation(updatedData);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.errors
        });
        return;
      }

      res.json({
        success: true,
        data: updatedData
      });

      logger.info('Escalation updated via API', {
        escalationId,
        userId: req.user?.id
      });
    } catch (error) {
      logger.error('Error updating escalation via API', { 
        error, 
        escalationId: req.params.escalationId,
        body: req.body 
      });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update escalation'
      });
    }
  }
}

export const escalationController = new EscalationController();