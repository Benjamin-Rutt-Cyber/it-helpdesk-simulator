import { Ticket, TicketStatus, TicketPriority } from '../types/ticket';
import { logger } from '../utils/logger';

export interface SLAConfiguration {
  priority: TicketPriority;
  responseTimeMinutes: number;
  resolutionTimeHours: number;
  escalationTimeHours: number;
  businessHoursOnly: boolean;
  escalationLevels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  timeThresholdHours: number;
  escalateTo: string[];
  notificationChannels: string[];
  autoEscalate: boolean;
}

export interface SLAMetrics {
  totalTickets: number;
  withinSLA: number;
  breachedSLA: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  escalationRate: number;
  customerSatisfactionScore?: number;
}

export interface SLAAlert {
  id: string;
  ticketId: string;
  type: 'RESPONSE_DUE' | 'RESOLUTION_DUE' | 'SLA_BREACH' | 'ESCALATION_REQUIRED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  targetUsers: string[];
  channels: string[];
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export class SLAService {
  private defaultConfigurations: SLAConfiguration[] = [
    {
      priority: TicketPriority.HIGH,
      responseTimeMinutes: 15,
      resolutionTimeHours: 4,
      escalationTimeHours: 2,
      businessHoursOnly: false,
      escalationLevels: [
        {
          level: 1,
          timeThresholdHours: 2,
          escalateTo: ['senior-tech', 'team-lead'],
          notificationChannels: ['email', 'sms'],
          autoEscalate: true
        },
        {
          level: 2,
          timeThresholdHours: 4,
          escalateTo: ['manager', 'director'],
          notificationChannels: ['email', 'sms', 'phone'],
          autoEscalate: true
        }
      ]
    },
    {
      priority: TicketPriority.MEDIUM,
      responseTimeMinutes: 60,
      resolutionTimeHours: 24,
      escalationTimeHours: 8,
      businessHoursOnly: true,
      escalationLevels: [
        {
          level: 1,
          timeThresholdHours: 8,
          escalateTo: ['senior-tech'],
          notificationChannels: ['email'],
          autoEscalate: true
        },
        {
          level: 2,
          timeThresholdHours: 24,
          escalateTo: ['team-lead'],
          notificationChannels: ['email', 'sms'],
          autoEscalate: false
        }
      ]
    },
    {
      priority: TicketPriority.LOW,
      responseTimeMinutes: 240,
      resolutionTimeHours: 72,
      escalationTimeHours: 24,
      businessHoursOnly: true,
      escalationLevels: [
        {
          level: 1,
          timeThresholdHours: 24,
          escalateTo: ['senior-tech'],
          notificationChannels: ['email'],
          autoEscalate: false
        }
      ]
    }
  ];

  /**
   * Get SLA configuration for a ticket priority
   */
  getSLAConfiguration(priority: TicketPriority): SLAConfiguration {
    const config = this.defaultConfigurations.find(c => c.priority === priority);
    if (!config) {
      logger.warn(`No SLA configuration found for priority ${priority}, using default`);
      return this.defaultConfigurations[1]; // Default to medium priority
    }
    return config;
  }

  /**
   * Calculate business hours between two dates
   */
  calculateBusinessHours(start: Date, end: Date): number {
    const businessStart = 9; // 9 AM
    const businessEnd = 17; // 5 PM
    const businessDays = [1, 2, 3, 4, 5]; // Monday to Friday

    let totalHours = 0;
    const current = new Date(start);

    while (current < end) {
      const day = current.getDay();
      const hour = current.getHours();

      if (businessDays.includes(day) && hour >= businessStart && hour < businessEnd) {
        totalHours += 1;
      }

      current.setHours(current.getHours() + 1);
    }

    return totalHours;
  }

  /**
   * Calculate actual time elapsed considering business hours
   */
  calculateElapsedTime(ticket: Ticket, businessHoursOnly: boolean = false): {
    totalHours: number;
    businessHours: number;
  } {
    const now = new Date();
    const startTime = ticket.createdAt;
    
    const totalHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const businessHours = this.calculateBusinessHours(startTime, now);

    return {
      totalHours,
      businessHours: businessHoursOnly ? businessHours : totalHours
    };
  }

  /**
   * Check if SLA is breached for a ticket
   */
  checkSLABreach(ticket: Ticket): {
    isBreached: boolean;
    breachType: 'RESPONSE' | 'RESOLUTION' | 'ESCALATION' | null;
    timeOverdue: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } {
    const config = this.getSLAConfiguration(ticket.priority);
    const elapsed = this.calculateElapsedTime(ticket, config.businessHoursOnly);

    // Check response time breach
    if (ticket.status === TicketStatus.OPEN && !ticket.slaTracking.actualResponseTime) {
      const responseTimeHours = config.responseTimeMinutes / 60;
      if (elapsed.businessHours > responseTimeHours) {
        const overdue = elapsed.businessHours - responseTimeHours;
        return {
          isBreached: true,
          breachType: 'RESPONSE',
          timeOverdue: overdue,
          severity: overdue > responseTimeHours ? 'CRITICAL' : 'HIGH'
        };
      }
    }

    // Check resolution time breach
    if ([TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED].includes(ticket.status)) {
      if (elapsed.businessHours > config.resolutionTimeHours) {
        const overdue = elapsed.businessHours - config.resolutionTimeHours;
        return {
          isBreached: true,
          breachType: 'RESOLUTION',
          timeOverdue: overdue,
          severity: overdue > config.resolutionTimeHours / 2 ? 'CRITICAL' : 'HIGH'
        };
      }
    }

    // Check escalation time breach
    if (ticket.status !== TicketStatus.ESCALATED && elapsed.businessHours > config.escalationTimeHours) {
      const overdue = elapsed.businessHours - config.escalationTimeHours;
      return {
        isBreached: true,
        breachType: 'ESCALATION',
        timeOverdue: overdue,
        severity: 'MEDIUM'
      };
    }

    return {
      isBreached: false,
      breachType: null,
      timeOverdue: 0,
      severity: 'LOW'
    };
  }

  /**
   * Generate SLA alerts for a ticket
   */
  generateSLAAlerts(ticket: Ticket): SLAAlert[] {
    const config = this.getSLAConfiguration(ticket.priority);
    const elapsed = this.calculateElapsedTime(ticket, config.businessHoursOnly);
    const breach = this.checkSLABreach(ticket);
    const alerts: SLAAlert[] = [];

    // Response time alerts
    if (ticket.status === TicketStatus.OPEN && !ticket.slaTracking.actualResponseTime) {
      const responseTimeHours = config.responseTimeMinutes / 60;
      const timeUntilDue = responseTimeHours - elapsed.businessHours;

      if (timeUntilDue <= 0) {
        alerts.push({
          id: `sla-alert-${ticket.id}-response-overdue`,
          ticketId: ticket.id,
          type: 'SLA_BREACH',
          severity: 'CRITICAL',
          message: `Response SLA breached for ticket ${ticket.ticketNumber}. Overdue by ${Math.abs(timeUntilDue).toFixed(1)} hours.`,
          targetUsers: ['assigned-tech', 'team-lead'],
          channels: ['email', 'sms'],
          createdAt: new Date(),
          acknowledged: false
        });
      } else if (timeUntilDue <= 0.25) { // 15 minutes
        alerts.push({
          id: `sla-alert-${ticket.id}-response-due`,
          ticketId: ticket.id,
          type: 'RESPONSE_DUE',
          severity: 'HIGH',
          message: `Response due in ${(timeUntilDue * 60).toFixed(0)} minutes for ticket ${ticket.ticketNumber}.`,
          targetUsers: ['assigned-tech'],
          channels: ['email'],
          createdAt: new Date(),
          acknowledged: false
        });
      }
    }

    // Resolution time alerts
    if ([TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED].includes(ticket.status)) {
      const timeUntilDue = config.resolutionTimeHours - elapsed.businessHours;

      if (timeUntilDue <= 0) {
        alerts.push({
          id: `sla-alert-${ticket.id}-resolution-overdue`,
          ticketId: ticket.id,
          type: 'SLA_BREACH',
          severity: 'CRITICAL',
          message: `Resolution SLA breached for ticket ${ticket.ticketNumber}. Overdue by ${Math.abs(timeUntilDue).toFixed(1)} hours.`,
          targetUsers: ['assigned-tech', 'team-lead', 'manager'],
          channels: ['email', 'sms'],
          createdAt: new Date(),
          acknowledged: false
        });
      } else if (timeUntilDue <= 2) {
        alerts.push({
          id: `sla-alert-${ticket.id}-resolution-due`,
          ticketId: ticket.id,
          type: 'RESOLUTION_DUE',
          severity: 'HIGH',
          message: `Resolution due in ${timeUntilDue.toFixed(1)} hours for ticket ${ticket.ticketNumber}.`,
          targetUsers: ['assigned-tech'],
          channels: ['email'],
          createdAt: new Date(),
          acknowledged: false
        });
      }
    }

    // Escalation alerts
    if (ticket.status !== TicketStatus.ESCALATED) {
      const timeUntilEscalation = config.escalationTimeHours - elapsed.businessHours;

      if (timeUntilEscalation <= 0) {
        alerts.push({
          id: `sla-alert-${ticket.id}-escalation-required`,
          ticketId: ticket.id,
          type: 'ESCALATION_REQUIRED',
          severity: 'HIGH',
          message: `Ticket ${ticket.ticketNumber} requires escalation. Escalation time threshold exceeded.`,
          targetUsers: ['assigned-tech', 'team-lead'],
          channels: ['email'],
          createdAt: new Date(),
          acknowledged: false
        });
      }
    }

    return alerts;
  }

  /**
   * Calculate SLA metrics for a set of tickets
   */
  calculateSLAMetrics(tickets: Ticket[]): SLAMetrics {
    const totalTickets = tickets.length;
    let withinSLA = 0;
    let breachedSLA = 0;
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let escalatedTickets = 0;
    let responseTimeCount = 0;
    let resolutionTimeCount = 0;

    for (const ticket of tickets) {
      const breach = this.checkSLABreach(ticket);
      
      if (breach.isBreached) {
        breachedSLA++;
      } else {
        withinSLA++;
      }

      if (ticket.slaTracking.actualResponseTime) {
        totalResponseTime += ticket.slaTracking.actualResponseTime;
        responseTimeCount++;
      }

      if (ticket.slaTracking.actualResolutionTime) {
        totalResolutionTime += ticket.slaTracking.actualResolutionTime;
        resolutionTimeCount++;
      }

      if (ticket.status === TicketStatus.ESCALATED || ticket.slaTracking.escalationLevel > 0) {
        escalatedTickets++;
      }
    }

    return {
      totalTickets,
      withinSLA,
      breachedSLA,
      averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
      averageResolutionTime: resolutionTimeCount > 0 ? totalResolutionTime / resolutionTimeCount : 0,
      escalationRate: totalTickets > 0 ? (escalatedTickets / totalTickets) * 100 : 0
    };
  }

  /**
   * Auto-escalate ticket based on SLA configuration
   */
  shouldAutoEscalate(ticket: Ticket): {
    shouldEscalate: boolean;
    escalationLevel: number;
    escalateTo: string[];
    reason: string;
  } {
    const config = this.getSLAConfiguration(ticket.priority);
    const elapsed = this.calculateElapsedTime(ticket, config.businessHoursOnly);

    for (const escalationLevel of config.escalationLevels) {
      if (escalationLevel.autoEscalate && 
          elapsed.businessHours >= escalationLevel.timeThresholdHours &&
          ticket.slaTracking.escalationLevel < escalationLevel.level) {
        
        return {
          shouldEscalate: true,
          escalationLevel: escalationLevel.level,
          escalateTo: escalationLevel.escalateTo,
          reason: `Auto-escalation triggered: ${escalationLevel.timeThresholdHours} hour threshold exceeded`
        };
      }
    }

    return {
      shouldEscalate: false,
      escalationLevel: ticket.slaTracking.escalationLevel,
      escalateTo: [],
      reason: ''
    };
  }

  /**
   * Update ticket SLA tracking with actual times
   */
  updateSLATracking(ticket: Ticket, status: TicketStatus, userId?: string): Partial<typeof ticket.slaTracking> {
    const now = new Date();
    const elapsed = this.calculateElapsedTime(ticket);
    const updates: Partial<typeof ticket.slaTracking> = {};

    // Update response time when first assigned or moved to IN_PROGRESS
    if (ticket.status === TicketStatus.OPEN && 
        (status === TicketStatus.IN_PROGRESS || ticket.assignedTo) && 
        !ticket.slaTracking.actualResponseTime) {
      updates.actualResponseTime = elapsed.totalHours * 60; // Convert to minutes
    }

    // Update resolution time when resolved
    if (status === TicketStatus.RESOLVED && !ticket.slaTracking.actualResolutionTime) {
      updates.actualResolutionTime = elapsed.totalHours;
    }

    // Check for breaches
    const breach = this.checkSLABreach({ ...ticket, status });
    if (breach.isBreached && !ticket.slaTracking.slaBreached) {
      updates.slaBreached = true;
      updates.breachReason = `${breach.breachType} SLA breached by ${breach.timeOverdue.toFixed(1)} hours`;
    }

    return updates;
  }

  /**
   * Generate performance report for a time period
   */
  generatePerformanceReport(tickets: Ticket[], startDate: Date, endDate: Date): {
    period: { start: Date; end: Date };
    overview: SLAMetrics;
    byPriority: Record<TicketPriority, SLAMetrics>;
    trends: {
      responseTimeTrend: number[];
      resolutionTimeTrend: number[];
      volumeTrend: number[];
    };
    topIssues: {
      category: string;
      count: number;
      averageResolutionTime: number;
    }[];
  } {
    const filteredTickets = tickets.filter(
      ticket => ticket.createdAt >= startDate && ticket.createdAt <= endDate
    );

    const overview = this.calculateSLAMetrics(filteredTickets);
    
    const byPriority: Record<TicketPriority, SLAMetrics> = {
      [TicketPriority.HIGH]: this.calculateSLAMetrics(
        filteredTickets.filter(t => t.priority === TicketPriority.HIGH)
      ),
      [TicketPriority.MEDIUM]: this.calculateSLAMetrics(
        filteredTickets.filter(t => t.priority === TicketPriority.MEDIUM)
      ),
      [TicketPriority.LOW]: this.calculateSLAMetrics(
        filteredTickets.filter(t => t.priority === TicketPriority.LOW)
      )
    };

    // Calculate trends (simplified - would need time-based grouping in real implementation)
    const trends = {
      responseTimeTrend: [overview.averageResponseTime],
      resolutionTimeTrend: [overview.averageResolutionTime],
      volumeTrend: [overview.totalTickets]
    };

    // Top issues by category
    const categoryStats = new Map<string, { count: number; totalResolutionTime: number }>();
    filteredTickets.forEach(ticket => {
      const category = ticket.category;
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { count: 0, totalResolutionTime: 0 });
      }
      const stats = categoryStats.get(category)!;
      stats.count++;
      if (ticket.slaTracking.actualResolutionTime) {
        stats.totalResolutionTime += ticket.slaTracking.actualResolutionTime;
      }
    });

    const topIssues = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        averageResolutionTime: stats.count > 0 ? stats.totalResolutionTime / stats.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      period: { start: startDate, end: endDate },
      overview,
      byPriority,
      trends,
      topIssues
    };
  }
}

export const slaService = new SLAService();