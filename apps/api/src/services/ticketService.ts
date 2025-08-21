import { EventEmitter } from 'events';
import { 
  Ticket, 
  TicketStatus, 
  TicketPriority, 
  TicketCategory,
  TicketFilters,
  TicketSortOptions,
  TicketUtils,
  TicketHistory,
} from '../models/Ticket';
import { TicketRepository, CreateTicketData, UpdateTicketData } from '../repositories/ticketRepository';
import { sessionManager } from './sessionManager';
import { logger } from '../utils/logger';

export interface TicketServiceEvents {
  ticket_created: { ticket: Ticket; createdBy: string };
  ticket_updated: { ticket: Ticket; updatedBy: string; changes: Partial<UpdateTicketData> };
  ticket_status_changed: { ticket: Ticket; previousStatus: TicketStatus; newStatus: TicketStatus; changedBy: string };
  ticket_assigned: { ticket: Ticket; assignedTo: string; assignedBy: string };
  ticket_escalated: { ticket: Ticket; escalatedBy: string; reason: string };
  ticket_resolved: { ticket: Ticket; resolvedBy: string; resolution: any };
  ticket_closed: { ticket: Ticket; closedBy: string };
  sla_breach_warning: { ticket: Ticket; timeRemaining: number };
  sla_breached: { ticket: Ticket; breachType: 'response' | 'resolution' };
}

export class TicketService extends EventEmitter {
  private ticketRepository: TicketRepository;
  private slaMonitoringTimer?: NodeJS.Timeout;

  constructor() {
    super();
    this.ticketRepository = new TicketRepository();
    this.setupSLAMonitoring();
  }

  async createTicket(ticketData: CreateTicketData, createdBy: string): Promise<Ticket> {
    try {
      logger.info('Creating new ticket', { 
        title: ticketData.title, 
        category: ticketData.category, 
        priority: ticketData.priority,
        createdBy 
      });

      // Validate ticket data
      const validationErrors = this.validateCreateTicketData(ticketData);
      if (validationErrors.length > 0) {
        throw new Error(`Ticket validation failed: ${validationErrors.join(', ')}`);
      }

      // Create the ticket
      const ticket = await this.ticketRepository.create(ticketData, createdBy);

      // Create a session for this ticket if it doesn't exist
      if (ticketData.scenarioId) {
        try {
          await sessionManager.createSession(
            createdBy,
            ticketData.scenarioId,
            ticket.id,
            'office_worker' // Default persona, could be determined from customer profile
          );
        } catch (sessionError) {
          logger.warn('Failed to create session for ticket', { 
            ticketId: ticket.id, 
            scenarioId: ticketData.scenarioId, 
            error: sessionError 
          });
        }
      }

      // Emit ticket created event
      this.emit('ticket_created', { ticket, createdBy });

      logger.info('Ticket created successfully', { ticketId: ticket.id, ticketNumber: ticket.ticketNumber });
      return ticket;
    } catch (error) {
      logger.error('Failed to create ticket', { ticketData, createdBy, error });
      throw error;
    }
  }

  async getTicketById(id: string): Promise<Ticket | null> {
    try {
      return await this.ticketRepository.findById(id);
    } catch (error) {
      logger.error('Failed to get ticket by ID', { id, error });
      throw error;
    }
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
    try {
      return await this.ticketRepository.findByTicketNumber(ticketNumber);
    } catch (error) {
      logger.error('Failed to get ticket by number', { ticketNumber, error });
      throw error;
    }
  }

  async updateTicket(id: string, updateData: UpdateTicketData, updatedBy: string): Promise<Ticket> {
    try {
      logger.info('Updating ticket', { ticketId: id, updates: Object.keys(updateData), updatedBy });

      // Get current ticket for comparison
      const currentTicket = await this.ticketRepository.findById(id);
      if (!currentTicket) {
        throw new Error(`Ticket with ID ${id} not found`);
      }

      // Validate status transition if status is being changed
      if (updateData.status && updateData.status !== currentTicket.status) {
        if (!TicketUtils.canTransitionStatus(currentTicket.status, updateData.status)) {
          throw new Error(`Invalid status transition from ${currentTicket.status} to ${updateData.status}`);
        }
      }

      // Update the ticket
      const updatedTicket = await this.ticketRepository.update(id, updateData, updatedBy);

      // Emit appropriate events
      this.emit('ticket_updated', { ticket: updatedTicket, updatedBy, changes: updateData });

      if (updateData.status && updateData.status !== currentTicket.status) {
        this.emit('ticket_status_changed', {
          ticket: updatedTicket,
          previousStatus: currentTicket.status,
          newStatus: updateData.status,
          changedBy: updatedBy,
        });

        // Handle specific status changes
        await this.handleStatusChange(updatedTicket, currentTicket.status, updateData.status, updatedBy);
      }

      if (updateData.assignedTo && updateData.assignedTo !== currentTicket.assignedTo) {
        this.emit('ticket_assigned', {
          ticket: updatedTicket,
          assignedTo: updateData.assignedTo,
          assignedBy: updatedBy,
        });
      }

      logger.info('Ticket updated successfully', { ticketId: id, updatedBy });
      return updatedTicket;
    } catch (error) {
      logger.error('Failed to update ticket', { id, updateData, updatedBy, error });
      throw error;
    }
  }

  async assignTicket(id: string, assignedTo: string, assignedBy: string): Promise<Ticket> {
    try {
      return await this.updateTicket(id, { 
        assignedTo, 
        status: TicketStatus.IN_PROGRESS 
      }, assignedBy);
    } catch (error) {
      logger.error('Failed to assign ticket', { id, assignedTo, assignedBy, error });
      throw error;
    }
  }

  async escalateTicket(id: string, escalatedBy: string, reason: string, escalatedTo?: string): Promise<Ticket> {
    try {
      logger.info('Escalating ticket', { ticketId: id, escalatedBy, reason, escalatedTo });

      const ticket = await this.ticketRepository.escalate(id, escalatedBy, reason, escalatedTo);

      // Emit escalation event
      this.emit('ticket_escalated', { ticket, escalatedBy, reason });

      logger.info('Ticket escalated successfully', { ticketId: id, escalatedBy });
      return ticket;
    } catch (error) {
      logger.error('Failed to escalate ticket', { id, escalatedBy, reason, error });
      throw error;
    }
  }

  async resolveTicket(
    id: string, 
    resolution: {
      summary: string;
      rootCause: string;
      actionsTaken: string[];
      preventionMeasures?: string;
      followUpRequired: boolean;
      followUpDate?: Date;
      resolutionNotes?: string;
    }, 
    resolvedBy: string
  ): Promise<Ticket> {
    try {
      logger.info('Resolving ticket', { ticketId: id, resolvedBy });

      const updateData: UpdateTicketData = {
        status: TicketStatus.RESOLVED,
        resolution,
      };

      const ticket = await this.updateTicket(id, updateData, resolvedBy);

      // Emit resolution event
      this.emit('ticket_resolved', { ticket, resolvedBy, resolution });

      // Complete the associated session if it exists
      try {
        const sessionContext = await sessionManager.getSessionContext(id);
        if (sessionContext) {
          await sessionManager.completeSession(id, resolvedBy, {
            resolution: resolution.summary,
            customerSatisfied: true, // Could be determined from customer feedback
            escalated: false,
            notes: resolution.resolutionNotes ? [resolution.resolutionNotes] : [],
          });
        }
      } catch (sessionError) {
        logger.warn('Failed to complete session for resolved ticket', { ticketId: id, error: sessionError });
      }

      logger.info('Ticket resolved successfully', { ticketId: id, resolvedBy });
      return ticket;
    } catch (error) {
      logger.error('Failed to resolve ticket', { id, resolution, resolvedBy, error });
      throw error;
    }
  }

  async closeTicket(id: string, closedBy: string, customerSatisfaction?: number): Promise<Ticket> {
    try {
      logger.info('Closing ticket', { ticketId: id, closedBy, customerSatisfaction });

      const currentTicket = await this.ticketRepository.findById(id);
      if (!currentTicket) {
        throw new Error(`Ticket with ID ${id} not found`);
      }

      // Can only close resolved tickets
      if (currentTicket.status !== TicketStatus.RESOLVED) {
        throw new Error(`Cannot close ticket with status ${currentTicket.status}. Ticket must be resolved first.`);
      }

      const updateData: UpdateTicketData = {
        status: TicketStatus.CLOSED,
      };

      // Add customer satisfaction if provided
      if (customerSatisfaction !== undefined && currentTicket.resolution) {
        updateData.resolution = {
          ...currentTicket.resolution,
          customerSatisfaction,
        };
      }

      const ticket = await this.updateTicket(id, updateData, closedBy);

      // Emit closed event
      this.emit('ticket_closed', { ticket, closedBy });

      logger.info('Ticket closed successfully', { ticketId: id, closedBy });
      return ticket;
    } catch (error) {
      logger.error('Failed to close ticket', { id, closedBy, error });
      throw error;
    }
  }

  async addTicketUpdate(
    ticketId: string, 
    content: string, 
    updateType: string, 
    isPublic: boolean, 
    author: string
  ): Promise<void> {
    try {
      await this.ticketRepository.addUpdate(ticketId, content, updateType, isPublic, author);
      logger.info('Ticket update added', { ticketId, author, updateType });
    } catch (error) {
      logger.error('Failed to add ticket update', { ticketId, author, error });
      throw error;
    }
  }

  async queryTickets(
    filters: TicketFilters = {},
    sortOptions: TicketSortOptions = { field: 'createdAt', direction: 'desc' },
    page: number = 1,
    pageSize: number = 20
  ) {
    try {
      return await this.ticketRepository.queryTickets(filters, sortOptions, page, pageSize);
    } catch (error) {
      logger.error('Failed to query tickets', { filters, sortOptions, page, pageSize, error });
      throw error;
    }
  }

  async getTicketHistory(ticketId: string): Promise<TicketHistory[]> {
    try {
      return await this.ticketRepository.getTicketHistory(ticketId);
    } catch (error) {
      logger.error('Failed to get ticket history', { ticketId, error });
      throw error;
    }
  }

  async getTicketsByUser(userId: string, includeResolved: boolean = false): Promise<Ticket[]> {
    try {
      return await this.ticketRepository.getTicketsByUser(userId, includeResolved);
    } catch (error) {
      logger.error('Failed to get tickets by user', { userId, error });
      throw error;
    }
  }

  async getTicketMetrics(dateRange?: { start: Date; end: Date }) {
    try {
      return await this.ticketRepository.getTicketMetrics(dateRange);
    } catch (error) {
      logger.error('Failed to get ticket metrics', { dateRange, error });
      throw error;
    }
  }

  async checkSLAStatus(ticketId: string): Promise<{
    slaBreached: boolean;
    timeToSLABreach: number;
    responseTimeSLA: boolean;
    resolutionTimeSLA: boolean;
  }> {
    try {
      const ticket = await this.ticketRepository.findById(ticketId);
      if (!ticket) {
        throw new Error(`Ticket with ID ${ticketId} not found`);
      }

      const slaBreached = TicketUtils.isSLABreached(ticket);
      const timeToSLABreach = TicketUtils.getTimeToSLABreach(ticket);

      // Check specific SLA types
      const now = new Date();
      const responseTimeMs = ticket.firstResponseAt 
        ? ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()
        : now.getTime() - ticket.createdAt.getTime();
      const responseTimeSLA = responseTimeMs <= (ticket.slaTracking.responseTimeMinutes * 60 * 1000);

      const resolutionTimeMs = ticket.resolvedAt 
        ? ticket.resolvedAt.getTime() - ticket.createdAt.getTime()
        : now.getTime() - ticket.createdAt.getTime();
      const resolutionTimeSLA = resolutionTimeMs <= (ticket.slaTracking.resolutionTimeHours * 60 * 60 * 1000);

      return {
        slaBreached,
        timeToSLABreach,
        responseTimeSLA,
        resolutionTimeSLA,
      };
    } catch (error) {
      logger.error('Failed to check SLA status', { ticketId, error });
      throw error;
    }
  }

  async getOverdueTickets(): Promise<Ticket[]> {
    try {
      const allTickets = await this.ticketRepository.queryTickets(
        { status: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
        { field: 'createdAt', direction: 'asc' },
        1,
        1000 // Large page size to get all overdue tickets
      );

      return allTickets.tickets.filter(ticket => TicketUtils.isSLABreached(ticket));
    } catch (error) {
      logger.error('Failed to get overdue tickets', { error });
      throw error;
    }
  }

  async getTicketsNearingSLA(warningTimeMinutes: number = 30): Promise<Ticket[]> {
    try {
      const allTickets = await this.ticketRepository.queryTickets(
        { status: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
        { field: 'createdAt', direction: 'asc' },
        1,
        1000
      );

      const warningTimeMs = warningTimeMinutes * 60 * 1000;

      return allTickets.tickets.filter(ticket => {
        const timeToSLABreach = TicketUtils.getTimeToSLABreach(ticket);
        return timeToSLABreach > 0 && timeToSLABreach <= warningTimeMs;
      });
    } catch (error) {
      logger.error('Failed to get tickets nearing SLA', { warningTimeMinutes, error });
      throw error;
    }
  }

  // Private methods

  private validateCreateTicketData(ticketData: CreateTicketData): string[] {
    const errors: string[] = [];

    if (!ticketData.title || ticketData.title.trim().length === 0) {
      errors.push('Ticket title is required');
    }

    if (!ticketData.description || ticketData.description.trim().length === 0) {
      errors.push('Ticket description is required');
    }

    if (!Object.values(TicketCategory).includes(ticketData.category)) {
      errors.push('Valid ticket category is required');
    }

    if (!Object.values(TicketPriority).includes(ticketData.priority)) {
      errors.push('Valid ticket priority is required');
    }

    if (!ticketData.customerId) {
      errors.push('Customer ID is required');
    }

    return errors;
  }

  private async handleStatusChange(
    ticket: Ticket, 
    previousStatus: TicketStatus, 
    newStatus: TicketStatus, 
    changedBy: string
  ): Promise<void> {
    try {
      switch (newStatus) {
        case TicketStatus.IN_PROGRESS:
          if (previousStatus === TicketStatus.OPEN) {
            // Record first response time
            logger.info('Ticket moved to in progress - first response recorded', { 
              ticketId: ticket.id, 
              responseTime: ticket.slaTracking.actualResponseTime 
            });
          }
          break;

        case TicketStatus.RESOLVED:
          logger.info('Ticket resolved', { 
            ticketId: ticket.id, 
            resolutionTime: ticket.slaTracking.actualResolutionTime 
          });
          break;

        case TicketStatus.ESCALATED:
          logger.info('Ticket escalated', { 
            ticketId: ticket.id, 
            escalationLevel: ticket.slaTracking.escalationLevel 
          });
          break;

        case TicketStatus.CLOSED:
          logger.info('Ticket closed', { 
            ticketId: ticket.id, 
            totalTime: ticket.closedAt ? ticket.closedAt.getTime() - ticket.createdAt.getTime() : 0 
          });
          break;
      }
    } catch (error) {
      logger.error('Error handling status change', { ticketId: ticket.id, previousStatus, newStatus, error });
    }
  }

  private setupSLAMonitoring(): void {
    // Check SLA status every 5 minutes
    this.slaMonitoringTimer = setInterval(async () => {
      try {
        await this.monitorSLAStatus();
      } catch (error) {
        logger.error('SLA monitoring error', { error });
      }
    }, 5 * 60 * 1000);

    logger.info('SLA monitoring setup completed');
  }

  private async monitorSLAStatus(): Promise<void> {
    try {
      // Get tickets nearing SLA breach (30 minutes warning)
      const nearingSLA = await this.getTicketsNearingSLA(30);
      
      for (const ticket of nearingSLA) {
        const timeRemaining = TicketUtils.getTimeToSLABreach(ticket);
        this.emit('sla_breach_warning', { ticket, timeRemaining });
      }

      // Get overdue tickets
      const overdueTickets = await this.getOverdueTickets();
      
      for (const ticket of overdueTickets) {
        if (!ticket.slaTracking.slaBreached) {
          // Mark as SLA breached in database
          await this.ticketRepository.update(ticket.id, {
            // This would update the SLA breach status
          }, 'system');

          // Determine breach type
          const breachType = !ticket.firstResponseAt ? 'response' : 'resolution';
          this.emit('sla_breached', { ticket, breachType });
        }
      }

      if (nearingSLA.length > 0 || overdueTickets.length > 0) {
        logger.info('SLA monitoring completed', { 
          nearingSLA: nearingSLA.length, 
          overdue: overdueTickets.length 
        });
      }
    } catch (error) {
      logger.error('Failed to monitor SLA status', { error });
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.slaMonitoringTimer) {
        clearInterval(this.slaMonitoringTimer);
        this.slaMonitoringTimer = undefined;
      }

      this.removeAllListeners();

      logger.info('Ticket service cleaned up successfully');
    } catch (error) {
      logger.error('Failed to cleanup ticket service', { error });
    }
  }
}

export const ticketService = new TicketService();
export default ticketService;