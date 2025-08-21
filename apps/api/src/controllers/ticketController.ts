import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ticketService } from '../services/ticketService';
import { ticketGenerator } from '../services/ticketGenerator';
import { 
  TicketStatus, 
  TicketPriority, 
  TicketCategory,
  TicketFilters,
  TicketSortOptions,
} from '../models/Ticket';
import { logger } from '../utils/logger';

export class TicketController {
  // Validation rules
  static createTicketValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn(Object.values(TicketCategory)).withMessage('Valid category is required'),
    body('priority').isIn(Object.values(TicketPriority)).withMessage('Valid priority is required'),
    body('customerId').notEmpty().withMessage('Customer ID is required'),
  ];

  static updateTicketValidation = [
    param('id').isUUID().withMessage('Valid ticket ID is required'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('category').optional().isIn(Object.values(TicketCategory)).withMessage('Valid category is required'),
    body('priority').optional().isIn(Object.values(TicketPriority)).withMessage('Valid priority is required'),
    body('status').optional().isIn(Object.values(TicketStatus)).withMessage('Valid status is required'),
  ];

  static getTicketValidation = [
    param('id').isUUID().withMessage('Valid ticket ID is required'),
  ];

  static queryTicketsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
    query('status').optional().isIn(Object.values(TicketStatus)).withMessage('Valid status is required'),
    query('priority').optional().isIn(Object.values(TicketPriority)).withMessage('Valid priority is required'),
    query('category').optional().isIn(Object.values(TicketCategory)).withMessage('Valid category is required'),
  ];

  // Create a new ticket
  static async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { title, description, category, priority, customerId, assetIds, scenarioId, assignedTo, metadata } = req.body;
      const createdBy = req.user?.id || 'system';

      const ticketData = {
        title,
        description,
        category,
        priority,
        customerId,
        assetIds,
        scenarioId,
        assignedTo,
        metadata,
      };

      const ticket = await ticketService.createTicket(ticketData, createdBy);

      logger.info('Ticket created via API', { 
        ticketId: ticket.id, 
        ticketNumber: ticket.ticketNumber,
        createdBy 
      });

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to create ticket via API', { body: req.body, error });
      res.status(500).json({
        success: false,
        message: 'Failed to create ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Generate a ticket from a template
  static async generateTicket(req: Request, res: Response): Promise<void> {
    try {
      const { templateId, category, priority, difficultyLevel, customerId, assetIds, includeVariations } = req.body;
      const createdBy = req.user?.id || 'system';

      const generationOptions = {
        templateId,
        category,
        priority,
        difficultyLevel,
        customerId,
        assetIds,
        includeVariations,
      };

      const ticketData = await ticketGenerator.generateTicket(generationOptions);
      const ticket = await ticketService.createTicket(ticketData, createdBy);

      logger.info('Ticket generated via API', { 
        ticketId: ticket.id, 
        ticketNumber: ticket.ticketNumber,
        templateId,
        createdBy 
      });

      res.status(201).json({
        success: true,
        message: 'Ticket generated successfully',
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to generate ticket via API', { body: req.body, error });
      res.status(500).json({
        success: false,
        message: 'Failed to generate ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get a ticket by ID
  static async getTicket(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const ticket = await ticketService.getTicketById(id);

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
        return;
      }

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to get ticket via API', { ticketId: req.params.id, error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get a ticket by ticket number
  static async getTicketByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { ticketNumber } = req.params;
      const ticket = await ticketService.getTicketByNumber(ticketNumber);

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
        return;
      }

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to get ticket by number via API', { ticketNumber: req.params.ticketNumber, error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update a ticket
  static async updateTicket(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = req.user?.id || 'system';

      const ticket = await ticketService.updateTicket(id, updateData, updatedBy);

      logger.info('Ticket updated via API', { ticketId: id, updatedBy });

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to update ticket via API', { ticketId: req.params.id, body: req.body, error });
      res.status(500).json({
        success: false,
        message: 'Failed to update ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Assign a ticket
  static async assignTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      const assignedBy = req.user?.id || 'system';

      if (!assignedTo) {
        res.status(400).json({
          success: false,
          message: 'assignedTo is required',
        });
        return;
      }

      const ticket = await ticketService.assignTicket(id, assignedTo, assignedBy);

      logger.info('Ticket assigned via API', { ticketId: id, assignedTo, assignedBy });

      res.json({
        success: true,
        message: 'Ticket assigned successfully',
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to assign ticket via API', { ticketId: req.params.id, body: req.body, error });
      res.status(500).json({
        success: false,
        message: 'Failed to assign ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Escalate a ticket
  static async escalateTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, escalatedTo } = req.body;
      const escalatedBy = req.user?.id || 'system';

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Escalation reason is required',
        });
        return;
      }

      const ticket = await ticketService.escalateTicket(id, escalatedBy, reason, escalatedTo);

      logger.info('Ticket escalated via API', { ticketId: id, escalatedBy, reason });

      res.json({
        success: true,
        message: 'Ticket escalated successfully',
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to escalate ticket via API', { ticketId: req.params.id, body: req.body, error });
      res.status(500).json({
        success: false,
        message: 'Failed to escalate ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Resolve a ticket
  static async resolveTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      const resolvedBy = req.user?.id || 'system';

      if (!resolution || !resolution.summary || !resolution.rootCause || !resolution.actionsTaken) {
        res.status(400).json({
          success: false,
          message: 'Resolution summary, root cause, and actions taken are required',
        });
        return;
      }

      const ticket = await ticketService.resolveTicket(id, resolution, resolvedBy);

      logger.info('Ticket resolved via API', { ticketId: id, resolvedBy });

      res.json({
        success: true,
        message: 'Ticket resolved successfully',
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to resolve ticket via API', { ticketId: req.params.id, body: req.body, error });
      res.status(500).json({
        success: false,
        message: 'Failed to resolve ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Close a ticket
  static async closeTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { customerSatisfaction } = req.body;
      const closedBy = req.user?.id || 'system';

      const ticket = await ticketService.closeTicket(id, closedBy, customerSatisfaction);

      logger.info('Ticket closed via API', { ticketId: id, closedBy });

      res.json({
        success: true,
        message: 'Ticket closed successfully',
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to close ticket via API', { ticketId: req.params.id, body: req.body, error });
      res.status(500).json({
        success: false,
        message: 'Failed to close ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Query tickets with filters
  static async queryTickets(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const {
        page = 1,
        pageSize = 20,
        status,
        priority,
        category,
        assignedTo,
        customer,
        searchText,
        slaBreached,
        dateRange,
      } = req.query;

      const filters: TicketFilters = {};
      
      if (status) filters.status = Array.isArray(status) ? status as TicketStatus[] : [status as TicketStatus];
      if (priority) filters.priority = Array.isArray(priority) ? priority as TicketPriority[] : [priority as TicketPriority];
      if (category) filters.category = Array.isArray(category) ? category as TicketCategory[] : [category as TicketCategory];
      if (assignedTo) filters.assignedTo = assignedTo as string;
      if (customer) filters.customer = customer as string;
      if (searchText) filters.searchText = searchText as string;
      if (slaBreached !== undefined) filters.slaBreached = slaBreached === 'true';
      
      if (dateRange) {
        try {
          const parsed = JSON.parse(dateRange as string);
          filters.dateRange = {
            start: new Date(parsed.start),
            end: new Date(parsed.end),
          };
        } catch (e) {
          // Invalid date range format, ignore
        }
      }

      const sortOptions: TicketSortOptions = {
        field: (req.query.sortField as any) || 'createdAt',
        direction: (req.query.sortDirection as 'asc' | 'desc') || 'desc',
      };

      const result = await ticketService.queryTickets(
        filters,
        sortOptions,
        parseInt(page as string),
        parseInt(pageSize as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to query tickets via API', { query: req.query, error });
      res.status(500).json({
        success: false,
        message: 'Failed to query tickets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get ticket history
  static async getTicketHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const history = await ticketService.getTicketHistory(id);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Failed to get ticket history via API', { ticketId: req.params.id, error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve ticket history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get tickets by user
  static async getTicketsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { includeResolved = 'false' } = req.query;

      const tickets = await ticketService.getTicketsByUser(
        userId,
        includeResolved === 'true'
      );

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      logger.error('Failed to get tickets by user via API', { userId: req.params.userId, error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user tickets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get ticket metrics
  static async getTicketMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange } = req.query;
      let parsedDateRange;

      if (dateRange) {
        try {
          const parsed = JSON.parse(dateRange as string);
          parsedDateRange = {
            start: new Date(parsed.start),
            end: new Date(parsed.end),
          };
        } catch (e) {
          res.status(400).json({
            success: false,
            message: 'Invalid date range format',
          });
          return;
        }
      }

      const metrics = await ticketService.getTicketMetrics(parsedDateRange);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Failed to get ticket metrics via API', { query: req.query, error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve ticket metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Check SLA status
  static async checkSLAStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const slaStatus = await ticketService.checkSLAStatus(id);

      res.json({
        success: true,
        data: slaStatus,
      });
    } catch (error) {
      logger.error('Failed to check SLA status via API', { ticketId: req.params.id, error });
      res.status(500).json({
        success: false,
        message: 'Failed to check SLA status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get overdue tickets
  static async getOverdueTickets(req: Request, res: Response): Promise<void> {
    try {
      const overdueTickets = await ticketService.getOverdueTickets();

      res.json({
        success: true,
        data: overdueTickets,
      });
    } catch (error) {
      logger.error('Failed to get overdue tickets via API', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve overdue tickets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Add ticket update
  static async addTicketUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { content, updateType, isPublic = true } = req.body;
      const author = req.user?.id || 'system';

      if (!content || !updateType) {
        res.status(400).json({
          success: false,
          message: 'Content and update type are required',
        });
        return;
      }

      await ticketService.addTicketUpdate(id, content, updateType, isPublic, author);

      logger.info('Ticket update added via API', { ticketId: id, author, updateType });

      res.json({
        success: true,
        message: 'Ticket update added successfully',
      });
    } catch (error) {
      logger.error('Failed to add ticket update via API', { ticketId: req.params.id, body: req.body, error });
      res.status(500).json({
        success: false,
        message: 'Failed to add ticket update',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default TicketController;