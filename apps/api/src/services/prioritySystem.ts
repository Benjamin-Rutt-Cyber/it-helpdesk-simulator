import { EventEmitter } from 'events';
import { 
  TicketPriority,
  TicketStatus,
  Ticket,
  DEFAULT_SLA_CONFIG,
  SLAConfiguration,
} from '../models/Ticket';
import { ticketService } from './ticketService';
import { ticketLifecycle } from './ticketLifecycle';
import { logger } from '../utils/logger';

export interface PrioritySystemEvents {
  priority_changed: {
    ticket: Ticket;
    previousPriority: TicketPriority;
    newPriority: TicketPriority;
    changedBy: string;
    reason: string;
  };
  priority_escalation: {
    ticket: Ticket;
    escalatedToPriority: TicketPriority;
    escalationReason: string;
    triggeredBy: 'system' | 'manual';
  };
  priority_alert: {
    ticket: Ticket;
    alertType: 'high_priority_aging' | 'priority_mismatch' | 'sla_risk';
    details: any;
  };
}

export interface PriorityAssessment {
  suggestedPriority: TicketPriority;
  confidence: number; // 0-1
  factors: {
    businessImpact: number;
    customerType: string;
    affectedUsers: number;
    systemCriticality: number;
    timeConstraints: number;
  };
  reasoning: string[];
}

export interface PriorityHandlingProcedure {
  priority: TicketPriority;
  maxResponseTime: number; // minutes
  maxResolutionTime: number; // hours
  escalationThreshold: number; // hours
  requiredSkills: string[];
  notificationChannels: string[];
  approvalRequired: boolean;
  businessHoursOnly: boolean;
}

export class PrioritySystem extends EventEmitter {
  private priorityHandlingProcedures: Map<TicketPriority, PriorityHandlingProcedure>;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializePriorityProcedures();
    this.setupPriorityMonitoring();
  }

  // Change ticket priority with validation and business rules
  async changePriority(
    ticketId: string,
    newPriority: TicketPriority,
    changedBy: string,
    reason: string,
    bypassValidation: boolean = false
  ): Promise<Ticket> {
    try {
      logger.info('Changing ticket priority', {
        ticketId,
        newPriority,
        changedBy,
        reason,
      });

      const ticket = await ticketService.getTicketById(ticketId);
      if (!ticket) {
        throw new Error(`Ticket with ID ${ticketId} not found`);
      }

      const previousPriority = ticket.priority;

      // Validate priority change if not bypassed
      if (!bypassValidation) {
        await this.validatePriorityChange(ticket, newPriority, changedBy);
      }

      // Update ticket priority
      const updatedTicket = await ticketService.updateTicket(
        ticketId,
        { priority: newPriority },
        changedBy
      );

      // Add priority change note
      await ticketService.addTicketUpdate(
        ticketId,
        `Priority changed from ${previousPriority} to ${newPriority}. Reason: ${reason}`,
        'priority_change',
        false, // Not public
        changedBy
      );

      // Handle priority-specific actions
      await this.handlePriorityChange(updatedTicket, previousPriority, newPriority, changedBy);

      // Emit priority change event
      this.emit('priority_changed', {
        ticket: updatedTicket,
        previousPriority,
        newPriority,
        changedBy,
        reason,
      });

      logger.info('Ticket priority changed successfully', {
        ticketId,
        previousPriority,
        newPriority,
        changedBy,
      });

      return updatedTicket;
    } catch (error) {
      logger.error('Failed to change ticket priority', {
        ticketId,
        newPriority,
        changedBy,
        reason,
        error,
      });
      throw error;
    }
  }

  // Assess appropriate priority based on ticket details
  assessPriority(ticket: Partial<Ticket>): PriorityAssessment {
    const factors = {
      businessImpact: this.assessBusinessImpact(ticket),
      customerType: this.assessCustomerType(ticket),
      affectedUsers: this.assessAffectedUsers(ticket),
      systemCriticality: this.assessSystemCriticality(ticket),
      timeConstraints: this.assessTimeConstraints(ticket),
    };

    // Calculate weighted priority score
    const weights = {
      businessImpact: 0.3,
      customerType: 0.15,
      affectedUsers: 0.25,
      systemCriticality: 0.2,
      timeConstraints: 0.1,
    };

    const totalScore = 
      factors.businessImpact * weights.businessImpact +
      this.getCustomerTypeScore(factors.customerType) * weights.customerType +
      factors.affectedUsers * weights.affectedUsers +
      factors.systemCriticality * weights.systemCriticality +
      factors.timeConstraints * weights.timeConstraints;

    // Determine priority based on score
    let suggestedPriority: TicketPriority;
    let confidence: number;

    if (totalScore >= 0.8) {
      suggestedPriority = TicketPriority.HIGH;
      confidence = Math.min(totalScore, 1.0);
    } else if (totalScore >= 0.5) {
      suggestedPriority = TicketPriority.MEDIUM;
      confidence = totalScore;
    } else {
      suggestedPriority = TicketPriority.LOW;
      confidence = 1.0 - totalScore;
    }

    const reasoning = this.generatePriorityReasoning(factors, totalScore);

    return {
      suggestedPriority,
      confidence,
      factors,
      reasoning,
    };
  }

  // Get priority handling procedures
  getPriorityProcedures(priority: TicketPriority): PriorityHandlingProcedure {
    const procedure = this.priorityHandlingProcedures.get(priority);
    if (!procedure) {
      throw new Error(`No handling procedure defined for priority: ${priority}`);
    }
    return procedure;
  }

  // Get all priority procedures
  getAllPriorityProcedures(): Map<TicketPriority, PriorityHandlingProcedure> {
    return new Map(this.priorityHandlingProcedures);
  }

  // Auto-escalate priority based on aging and business rules
  async autoEscalatePriority(ticket: Ticket): Promise<boolean> {
    try {
      const escalationRules = this.getEscalationRules(ticket);
      
      for (const rule of escalationRules) {
        if (await rule.condition(ticket)) {
          await this.escalatePriority(ticket, rule.targetPriority, rule.reason);
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Auto priority escalation failed', { ticketId: ticket.id, error });
      return false;
    }
  }

  // Escalate priority with business rules
  private async escalatePriority(
    ticket: Ticket,
    targetPriority: TicketPriority,
    reason: string
  ): Promise<void> {
    try {
      logger.info('Auto-escalating ticket priority', {
        ticketId: ticket.id,
        fromPriority: ticket.priority,
        toPriority: targetPriority,
        reason,
      });

      await this.changePriority(ticket.id, targetPriority, 'system', reason, true);

      this.emit('priority_escalation', {
        ticket,
        escalatedToPriority: targetPriority,
        escalationReason: reason,
        triggeredBy: 'system',
      });

      logger.info('Ticket priority auto-escalated', {
        ticketId: ticket.id,
        newPriority: targetPriority,
      });
    } catch (error) {
      logger.error('Priority escalation failed', {
        ticketId: ticket.id,
        targetPriority,
        reason,
        error,
      });
    }
  }

  // Get priority visualization data
  getPriorityVisualization(priority: TicketPriority) {
    const visualizations = {
      [TicketPriority.HIGH]: {
        color: '#dc2626', // red-600
        backgroundColor: '#fef2f2', // red-50
        borderColor: '#fecaca', // red-200
        icon: '🔴',
        label: 'High Priority',
        badgeStyle: 'error',
        urgencyText: 'Urgent',
        description: 'Critical business impact, immediate attention required',
      },
      [TicketPriority.MEDIUM]: {
        color: '#d97706', // amber-600
        backgroundColor: '#fffbeb', // amber-50
        borderColor: '#fed7aa', // amber-200
        icon: '🟡',
        label: 'Medium Priority',
        badgeStyle: 'warning',
        urgencyText: 'Standard',
        description: 'Moderate business impact, resolution within business hours',
      },
      [TicketPriority.LOW]: {
        color: '#059669', // emerald-600
        backgroundColor: '#ecfdf5', // emerald-50
        borderColor: '#a7f3d0', // emerald-200
        icon: '🟢',
        label: 'Low Priority',
        badgeStyle: 'success',
        urgencyText: 'Low',
        description: 'Minor impact, can be resolved during standard support hours',
      },
    };

    return visualizations[priority];
  }

  // Monitor priority-related issues
  async monitorPriorityIssues(): Promise<void> {
    try {
      // Check for high priority tickets aging
      await this.checkHighPriorityAging();
      
      // Check for priority mismatches
      await this.checkPriorityMismatches();
      
      // Check for SLA risks
      await this.checkSLARisks();
      
      // Auto-escalate priorities if needed
      await this.performAutoEscalation();
    } catch (error) {
      logger.error('Priority monitoring failed', { error });
    }
  }

  // Private methods

  private initializePriorityProcedures(): void {
    this.priorityHandlingProcedures = new Map([
      [TicketPriority.HIGH, {
        priority: TicketPriority.HIGH,
        maxResponseTime: 60, // 1 hour
        maxResolutionTime: 4, // 4 hours
        escalationThreshold: 2, // 2 hours
        requiredSkills: ['Senior Technician', 'System Administration'],
        notificationChannels: ['email', 'sms', 'slack', 'phone'],
        approvalRequired: false,
        businessHoursOnly: false,
      }],
      [TicketPriority.MEDIUM, {
        priority: TicketPriority.MEDIUM,
        maxResponseTime: 120, // 2 hours
        maxResolutionTime: 8, // 8 hours
        escalationThreshold: 6, // 6 hours
        requiredSkills: ['IT Technician', 'Desktop Support'],
        notificationChannels: ['email', 'slack'],
        approvalRequired: false,
        businessHoursOnly: true,
      }],
      [TicketPriority.LOW, {
        priority: TicketPriority.LOW,
        maxResponseTime: 240, // 4 hours
        maxResolutionTime: 24, // 24 hours
        escalationThreshold: 16, // 16 hours
        requiredSkills: ['Help Desk', 'Junior Technician'],
        notificationChannels: ['email'],
        approvalRequired: false,
        businessHoursOnly: true,
      }],
    ]);
  }

  private async validatePriorityChange(
    ticket: Ticket,
    newPriority: TicketPriority,
    changedBy: string
  ): Promise<void> {
    // Check if user has permission to change to this priority
    if (newPriority === TicketPriority.HIGH) {
      // High priority changes may require approval
      // Implementation depends on user role system
    }

    // Check if the change makes sense based on ticket content
    const assessment = this.assessPriority(ticket);
    
    if (Math.abs(this.getPriorityScore(newPriority) - this.getPriorityScore(assessment.suggestedPriority)) > 1) {
      logger.warn('Priority change differs significantly from assessment', {
        ticketId: ticket.id,
        suggestedPriority: assessment.suggestedPriority,
        requestedPriority: newPriority,
        confidence: assessment.confidence,
      });
    }
  }

  private async handlePriorityChange(
    ticket: Ticket,
    previousPriority: TicketPriority,
    newPriority: TicketPriority,
    changedBy: string
  ): Promise<void> {
    // Handle escalation to higher priority
    if (this.getPriorityScore(newPriority) > this.getPriorityScore(previousPriority)) {
      // May need immediate reassignment or notification
      const procedure = this.getPriorityProcedures(newPriority);
      
      // Check if ticket needs reassignment based on required skills
      if (ticket.assignedTo && procedure.requiredSkills.length > 0) {
        // Implementation would check if assigned user has required skills
        logger.info('Priority escalation may require reassignment', {
          ticketId: ticket.id,
          requiredSkills: procedure.requiredSkills,
        });
      }
    }
  }

  private assessBusinessImpact(ticket: Partial<Ticket>): number {
    // Assess based on metadata business impact
    if (ticket.metadata?.businessImpact) {
      switch (ticket.metadata.businessImpact) {
        case 'critical': return 1.0;
        case 'high': return 0.8;
        case 'medium': return 0.5;
        case 'low': return 0.2;
        default: return 0.4;
      }
    }

    // Assess based on category
    if (ticket.category) {
      const highImpactCategories = ['security', 'network', 'email'];
      if (highImpactCategories.includes(ticket.category.toLowerCase())) {
        return 0.8;
      }
    }

    return 0.4; // Default medium impact
  }

  private assessCustomerType(ticket: Partial<Ticket>): string {
    if (ticket.customer?.department) {
      const vipDepartments = ['executive', 'sales', 'customer_service'];
      if (vipDepartments.includes(ticket.customer.department.toLowerCase())) {
        return 'vip';
      }
    }

    if (ticket.customer?.jobTitle?.toLowerCase().includes('director') || 
        ticket.customer?.jobTitle?.toLowerCase().includes('manager')) {
      return 'management';
    }

    return 'standard';
  }

  private getCustomerTypeScore(customerType: string): number {
    switch (customerType) {
      case 'vip': return 1.0;
      case 'management': return 0.7;
      case 'standard': return 0.4;
      default: return 0.4;
    }
  }

  private assessAffectedUsers(ticket: Partial<Ticket>): number {
    // Check affected assets and estimate user impact
    const assetCount = ticket.affectedAssets?.length || 1;
    
    if (assetCount >= 10) return 1.0;
    if (assetCount >= 5) return 0.8;
    if (assetCount >= 2) return 0.6;
    return 0.3;
  }

  private assessSystemCriticality(ticket: Partial<Ticket>): number {
    // Assess based on affected systems
    const criticalKeywords = ['server', 'network', 'email', 'database', 'security'];
    const description = (ticket.description || '').toLowerCase();
    
    const criticalMatches = criticalKeywords.filter(keyword => 
      description.includes(keyword)
    ).length;
    
    return Math.min(criticalMatches / criticalKeywords.length * 2, 1.0);
  }

  private assessTimeConstraints(ticket: Partial<Ticket>): number {
    const urgentKeywords = ['urgent', 'immediate', 'asap', 'critical', 'emergency'];
    const description = (ticket.description || '').toLowerCase();
    
    const urgentMatches = urgentKeywords.filter(keyword => 
      description.includes(keyword)
    ).length;
    
    return Math.min(urgentMatches / urgentKeywords.length, 1.0);
  }

  private generatePriorityReasoning(factors: any, totalScore: number): string[] {
    const reasoning: string[] = [];
    
    if (factors.businessImpact >= 0.8) {
      reasoning.push('High business impact detected');
    }
    
    if (factors.customerType === 'vip') {
      reasoning.push('VIP customer identified');
    }
    
    if (factors.affectedUsers >= 0.8) {
      reasoning.push('Multiple users/systems affected');
    }
    
    if (factors.systemCriticality >= 0.7) {
      reasoning.push('Critical system components involved');
    }
    
    if (factors.timeConstraints >= 0.7) {
      reasoning.push('Urgent language or time constraints indicated');
    }
    
    if (reasoning.length === 0) {
      reasoning.push('Standard assessment based on available information');
    }
    
    return reasoning;
  }

  private getPriorityScore(priority: TicketPriority): number {
    switch (priority) {
      case TicketPriority.HIGH: return 3;
      case TicketPriority.MEDIUM: return 2;
      case TicketPriority.LOW: return 1;
      default: return 2;
    }
  }

  private getEscalationRules(ticket: Ticket) {
    return [
      {
        condition: async (t: Ticket) => {
          // Escalate low to medium after 12 hours without resolution
          const ageHours = (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60);
          return t.priority === TicketPriority.LOW && 
                 ageHours > 12 && 
                 t.status !== TicketStatus.RESOLVED;
        },
        targetPriority: TicketPriority.MEDIUM,
        reason: 'Ticket aging beyond normal resolution time',
      },
      {
        condition: async (t: Ticket) => {
          // Escalate medium to high after 6 hours without resolution
          const ageHours = (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60);
          return t.priority === TicketPriority.MEDIUM && 
                 ageHours > 6 && 
                 t.status !== TicketStatus.RESOLVED;
        },
        targetPriority: TicketPriority.HIGH,
        reason: 'Medium priority ticket exceeding standard resolution time',
      },
    ];
  }

  private async checkHighPriorityAging(): Promise<void> {
    const highPriorityTickets = await ticketService.queryTickets(
      { 
        priority: [TicketPriority.HIGH],
        status: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS]
      },
      { field: 'createdAt', direction: 'asc' }
    );

    const now = new Date();
    
    for (const ticket of highPriorityTickets.tickets) {
      const ageHours = (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (ageHours > 3) { // Alert for high priority tickets older than 3 hours
        this.emit('priority_alert', {
          ticket,
          alertType: 'high_priority_aging',
          details: { ageHours },
        });
      }
    }
  }

  private async checkPriorityMismatches(): Promise<void> {
    // Implementation would check tickets where assessed priority differs from actual priority
  }

  private async checkSLARisks(): Promise<void> {
    // Implementation would check for tickets at risk of SLA breach based on priority
  }

  private async performAutoEscalation(): Promise<void> {
    const activeTickets = await ticketService.queryTickets(
      { status: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
      { field: 'createdAt', direction: 'asc' },
      1,
      100 // Limit to prevent performance issues
    );

    for (const ticket of activeTickets.tickets) {
      await this.autoEscalatePriority(ticket);
    }
  }

  private setupPriorityMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitorPriorityIssues();
      } catch (error) {
        logger.error('Priority monitoring error', { error });
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    logger.info('Priority system monitoring started');
  }

  async cleanup(): Promise<void> {
    try {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = undefined;
      }

      this.removeAllListeners();

      logger.info('Priority system cleaned up');
    } catch (error) {
      logger.error('Priority system cleanup failed', { error });
    }
  }
}

export const prioritySystem = new PrioritySystem();
export default prioritySystem;