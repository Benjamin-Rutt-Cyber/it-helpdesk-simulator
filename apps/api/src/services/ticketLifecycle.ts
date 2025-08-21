import { EventEmitter } from 'events';
import { 
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketUtils,
  DEFAULT_SLA_CONFIG,
} from '../models/Ticket';
import { ticketService } from './ticketService';
import { logger } from '../utils/logger';

export interface LifecycleEvents {
  status_transition: {
    ticket: Ticket;
    previousStatus: TicketStatus;
    newStatus: TicketStatus;
    transitionedBy: string;
    timestamp: Date;
  };
  sla_warning: {
    ticket: Ticket;
    slaType: 'response' | 'resolution';
    timeRemaining: number;
    warningLevel: 'early' | 'urgent';
  };
  sla_breach: {
    ticket: Ticket;
    slaType: 'response' | 'resolution';
    breachTime: Date;
    breachDuration: number;
  };
  escalation_triggered: {
    ticket: Ticket;
    escalationLevel: number;
    reason: string;
    triggeredBy: 'system' | 'manual';
  };
  ticket_aging: {
    ticket: Ticket;
    ageInHours: number;
    priority: TicketPriority;
  };
}

export class TicketLifecycle extends EventEmitter {
  private monitoringInterval?: NodeJS.Timeout;
  private readonly MONITORING_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

  constructor() {
    super();
    this.setupLifecycleMonitoring();
  }

  // Status transition management
  async transitionStatus(
    ticketId: string,
    newStatus: TicketStatus,
    transitionedBy: string,
    reason?: string
  ): Promise<Ticket> {
    try {
      logger.info('Attempting status transition', { 
        ticketId, 
        newStatus, 
        transitionedBy, 
        reason 
      });

      const ticket = await ticketService.getTicketById(ticketId);
      if (!ticket) {
        throw new Error(`Ticket with ID ${ticketId} not found`);
      }

      const previousStatus = ticket.status;

      // Validate transition
      if (!this.canTransitionStatus(previousStatus, newStatus)) {
        throw new Error(`Invalid status transition from ${previousStatus} to ${newStatus}`);
      }

      // Perform pre-transition validations
      await this.validateTransition(ticket, newStatus, transitionedBy);

      // Execute the transition
      const updatedTicket = await ticketService.updateTicket(
        ticketId,
        { status: newStatus },
        transitionedBy
      );

      // Handle post-transition actions
      await this.handlePostTransition(updatedTicket, previousStatus, newStatus, transitionedBy);

      // Emit lifecycle event
      this.emit('status_transition', {
        ticket: updatedTicket,
        previousStatus,
        newStatus,
        transitionedBy,
        timestamp: new Date(),
      });

      logger.info('Status transition completed', {
        ticketId,
        previousStatus,
        newStatus,
        transitionedBy,
      });

      return updatedTicket;
    } catch (error) {
      logger.error('Status transition failed', {
        ticketId,
        newStatus,
        transitionedBy,
        error,
      });
      throw error;
    }
  }

  // Check if status transition is valid
  canTransitionStatus(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
    return TicketUtils.canTransitionStatus(currentStatus, newStatus);
  }

  // Get next possible statuses
  getNextPossibleStatuses(currentStatus: TicketStatus): TicketStatus[] {
    const transitions = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED, TicketStatus.CLOSED],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.ESCALATED, TicketStatus.OPEN],
      [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
      [TicketStatus.ESCALATED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
      [TicketStatus.CLOSED]: [], // No transitions from closed
    };

    return transitions[currentStatus] || [];
  }

  // Auto-escalation logic
  async checkAutoEscalation(ticket: Ticket): Promise<boolean> {
    try {
      const slaConfig = DEFAULT_SLA_CONFIG[ticket.priority];
      const now = new Date();
      
      // Check if escalation time has passed
      const timeSinceCreation = now.getTime() - ticket.createdAt.getTime();
      const escalationTimeMs = slaConfig.escalationTimeHours * 60 * 60 * 1000;

      if (timeSinceCreation >= escalationTimeMs && 
          ticket.status !== TicketStatus.RESOLVED && 
          ticket.status !== TicketStatus.CLOSED &&
          ticket.slaTracking.escalationLevel === 0) {
        
        await this.autoEscalateTicket(ticket, 'SLA escalation time exceeded');
        return true;
      }

      // Check for SLA breach-based escalation
      if (TicketUtils.isSLABreached(ticket) && ticket.slaTracking.escalationLevel === 0) {
        await this.autoEscalateTicket(ticket, 'SLA breach detected');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Auto-escalation check failed', { ticketId: ticket.id, error });
      return false;
    }
  }

  // Automatic escalation
  private async autoEscalateTicket(ticket: Ticket, reason: string): Promise<void> {
    try {
      logger.info('Auto-escalating ticket', { ticketId: ticket.id, reason });

      await ticketService.escalateTicket(ticket.id, 'system', reason);

      this.emit('escalation_triggered', {
        ticket,
        escalationLevel: ticket.slaTracking.escalationLevel + 1,
        reason,
        triggeredBy: 'system',
      });

      logger.info('Ticket auto-escalated', { ticketId: ticket.id, reason });
    } catch (error) {
      logger.error('Auto-escalation failed', { ticketId: ticket.id, reason, error });
    }
  }

  // SLA monitoring and alerting
  async monitorSLAStatus(): Promise<void> {
    try {
      // Get tickets nearing SLA breach
      const nearingSLA = await ticketService.getTicketsNearingSLA(30); // 30 minutes warning
      
      for (const ticket of nearingSLA) {
        const timeToSLABreach = TicketUtils.getTimeToSLABreach(ticket);
        const warningLevel = timeToSLABreach <= 10 * 60 * 1000 ? 'urgent' : 'early'; // 10 minutes = urgent
        
        const slaType = !ticket.firstResponseAt ? 'response' : 'resolution';
        
        this.emit('sla_warning', {
          ticket,
          slaType,
          timeRemaining: timeToSLABreach,
          warningLevel,
        });
      }

      // Get overdue tickets (SLA breached)
      const overdueTickets = await ticketService.getOverdueTickets();
      
      for (const ticket of overdueTickets) {
        if (!ticket.slaTracking.slaBreached) {
          const slaType = !ticket.firstResponseAt ? 'response' : 'resolution';
          const breachTime = new Date();
          const breachDuration = breachTime.getTime() - ticket.createdAt.getTime();
          
          this.emit('sla_breach', {
            ticket,
            slaType,
            breachTime,
            breachDuration,
          });

          // Check for auto-escalation
          await this.checkAutoEscalation(ticket);
        }
      }

      // Monitor ticket aging
      await this.monitorTicketAging();

      if (nearingSLA.length > 0 || overdueTickets.length > 0) {
        logger.info('SLA monitoring completed', {
          nearingSLA: nearingSLA.length,
          overdue: overdueTickets.length,
        });
      }
    } catch (error) {
      logger.error('SLA monitoring failed', { error });
    }
  }

  // Monitor ticket aging for proactive management
  private async monitorTicketAging(): Promise<void> {
    try {
      const activeTickets = await ticketService.queryTickets(
        { status: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
        { field: 'createdAt', direction: 'asc' },
        1,
        1000
      );

      const now = new Date();
      
      for (const ticket of activeTickets.tickets) {
        const ageInMs = now.getTime() - ticket.createdAt.getTime();
        const ageInHours = ageInMs / (1000 * 60 * 60);
        
        // Emit aging alerts based on priority and age
        const shouldAlert = this.shouldAlertForAge(ticket.priority, ageInHours);
        
        if (shouldAlert) {
          this.emit('ticket_aging', {
            ticket,
            ageInHours,
            priority: ticket.priority,
          });
        }
      }
    } catch (error) {
      logger.error('Ticket aging monitoring failed', { error });
    }
  }

  // Determine if we should alert for ticket age
  private shouldAlertForAge(priority: TicketPriority, ageInHours: number): boolean {
    const agingThresholds = {
      [TicketPriority.HIGH]: 2, // Alert after 2 hours for high priority
      [TicketPriority.MEDIUM]: 8, // Alert after 8 hours for medium priority
      [TicketPriority.LOW]: 24, // Alert after 24 hours for low priority
    };

    return ageInHours >= agingThresholds[priority];
  }

  // Validate transition requirements
  private async validateTransition(
    ticket: Ticket,
    newStatus: TicketStatus,
    transitionedBy: string
  ): Promise<void> {
    switch (newStatus) {
      case TicketStatus.RESOLVED:
        // Ticket must have been worked on (have updates or be assigned)
        if (!ticket.assignedTo && ticket.updates.length === 0) {
          throw new Error('Ticket must be assigned or have updates before resolution');
        }
        break;

      case TicketStatus.CLOSED:
        // Ticket must be resolved first
        if (ticket.status !== TicketStatus.RESOLVED) {
          throw new Error('Ticket must be resolved before closing');
        }
        break;

      case TicketStatus.IN_PROGRESS:
        // Record first response time if transitioning from OPEN
        if (ticket.status === TicketStatus.OPEN && !ticket.firstResponseAt) {
          // This will be handled in the update
        }
        break;

      default:
        // No special validation required
        break;
    }
  }

  // Handle post-transition actions
  private async handlePostTransition(
    ticket: Ticket,
    previousStatus: TicketStatus,
    newStatus: TicketStatus,
    transitionedBy: string
  ): Promise<void> {
    try {
      switch (newStatus) {
        case TicketStatus.IN_PROGRESS:
          if (previousStatus === TicketStatus.OPEN) {
            logger.info('Ticket first response recorded', {
              ticketId: ticket.id,
              responseTime: ticket.firstResponseAt,
            });
          }
          break;

        case TicketStatus.RESOLVED:
          // Update resolution metrics
          logger.info('Ticket resolved', {
            ticketId: ticket.id,
            resolutionTime: ticket.resolvedAt,
          });
          break;

        case TicketStatus.ESCALATED:
          // Handle escalation notifications
          logger.info('Ticket escalated', {
            ticketId: ticket.id,
            escalationLevel: ticket.slaTracking.escalationLevel,
          });
          break;

        case TicketStatus.CLOSED:
          // Final cleanup and metrics
          logger.info('Ticket closed', {
            ticketId: ticket.id,
            totalTime: ticket.closedAt ? ticket.closedAt.getTime() - ticket.createdAt.getTime() : 0,
          });
          break;

        default:
          break;
      }
    } catch (error) {
      logger.error('Post-transition handling failed', {
        ticketId: ticket.id,
        previousStatus,
        newStatus,
        error,
      });
    }
  }

  // Setup lifecycle monitoring
  private setupLifecycleMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitorSLAStatus();
      } catch (error) {
        logger.error('Lifecycle monitoring error', { error });
      }
    }, this.MONITORING_INTERVAL_MS);

    logger.info('Ticket lifecycle monitoring started', {
      intervalMs: this.MONITORING_INTERVAL_MS,
    });
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = undefined;
      }

      this.removeAllListeners();

      logger.info('Ticket lifecycle service cleaned up');
    } catch (error) {
      logger.error('Lifecycle cleanup failed', { error });
    }
  }

  // Get lifecycle statistics
  async getLifecycleStats(dateRange?: { start: Date; end: Date }) {
    try {
      const metrics = await ticketService.getTicketMetrics(dateRange);
      
      return {
        statusDistribution: metrics.statusDistribution,
        averageResolutionTime: metrics.averageResolutionTimeHours,
        slaCompliance: metrics.slaPerformance.slaComplianceRate,
        totalTickets: metrics.totalTickets,
        escalationRate: (metrics.statusDistribution.escalated / metrics.totalTickets) * 100,
      };
    } catch (error) {
      logger.error('Failed to get lifecycle stats', { dateRange, error });
      throw error;
    }
  }

  // Force status transition (admin only)
  async forceTransition(
    ticketId: string,
    newStatus: TicketStatus,
    forcedBy: string,
    reason: string
  ): Promise<Ticket> {
    try {
      logger.warn('Forcing status transition', {
        ticketId,
        newStatus,
        forcedBy,
        reason,
      });

      const ticket = await ticketService.updateTicket(
        ticketId,
        { status: newStatus },
        forcedBy
      );

      // Add forced transition update
      await ticketService.addTicketUpdate(
        ticketId,
        `Status forcibly changed to ${newStatus}. Reason: ${reason}`,
        'status_change',
        false, // Not public
        forcedBy
      );

      logger.warn('Status transition forced', {
        ticketId,
        newStatus,
        forcedBy,
        reason,
      });

      return ticket;
    } catch (error) {
      logger.error('Force transition failed', {
        ticketId,
        newStatus,
        forcedBy,
        reason,
        error,
      });
      throw error;
    }
  }
}

export const ticketLifecycle = new TicketLifecycle();
export default ticketLifecycle;