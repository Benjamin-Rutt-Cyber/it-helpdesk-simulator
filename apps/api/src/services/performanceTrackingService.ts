import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '../types/ticket';
import { SLAMetrics } from './slaService';
import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  timeframe: {
    start: Date;
    end: Date;
    granularity: 'hour' | 'day' | 'week' | 'month';
  };
  
  // Volume metrics
  volume: {
    totalTickets: number;
    newTickets: number;
    resolvedTickets: number;
    reopenedTickets: number;
    escalatedTickets: number;
  };

  // Time-based metrics
  responseTimes: {
    average: number;
    median: number;
    p95: number;
    p99: number;
    distribution: { range: string; count: number }[];
  };

  resolutionTimes: {
    average: number;
    median: number;
    p95: number;
    p99: number;
    distribution: { range: string; count: number }[];
  };

  // SLA performance
  slaPerformance: {
    responseTimeSLA: number; // percentage
    resolutionTimeSLA: number; // percentage
    overallSLA: number; // percentage
    breaches: {
      total: number;
      byType: Record<'response' | 'resolution' | 'escalation', number>;
      byPriority: Record<TicketPriority, number>;
    };
  };

  // Workload distribution
  workload: {
    byTechnician: { techId: string; name: string; tickets: number; avgResolutionTime: number }[];
    byPriority: Record<TicketPriority, number>;
    byCategory: Record<TicketCategory, number>;
    byStatus: Record<TicketStatus, number>;
  };

  // Trends
  trends: {
    volumeTrend: { period: string; count: number }[];
    responseTimeTrend: { period: string; avgTime: number }[];
    resolutionTimeTrend: { period: string; avgTime: number }[];
    slaComplianceTrend: { period: string; compliance: number }[];
  };

  // Quality metrics
  quality: {
    customerSatisfaction: {
      average: number;
      distribution: { rating: number; count: number }[];
      feedbackCount: number;
    };
    firstContactResolution: number; // percentage
    reopenRate: number; // percentage
    escalationRate: number; // percentage
  };
}

export interface TechnicianPerformance {
  techId: string;
  name: string;
  period: { start: Date; end: Date };
  
  productivity: {
    ticketsHandled: number;
    ticketsResolved: number;
    averageResolutionTime: number;
    productivityScore: number; // calculated metric
  };

  quality: {
    customerSatisfactionAvg: number;
    reopenRate: number;
    escalationRate: number;
    firstContactResolution: number;
    qualityScore: number; // calculated metric
  };

  slaCompliance: {
    responseTimeSLA: number;
    resolutionTimeSLA: number;
    overallSLA: number;
    breachCount: number;
  };

  workload: {
    activeTickets: number;
    overdueTasks: number;
    utilizationRate: number; // percentage of capacity
    workloadBalance: 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOADED';
  };

  skills: {
    categoryExpertise: { category: TicketCategory; proficiency: number; ticketCount: number }[];
    improvementAreas: string[];
    strengthAreas: string[];
  };
}

export interface TeamPerformance {
  teamId: string;
  name: string;
  period: { start: Date; end: Date };
  
  overall: PerformanceMetrics;
  technicians: TechnicianPerformance[];
  
  teamMetrics: {
    collaborationScore: number;
    knowledgeSharing: number;
    crossTrainingLevel: number;
    teamEfficiency: number;
  };

  capacity: {
    totalCapacity: number;
    currentUtilization: number;
    projectedDemand: number;
    capacityGap: number;
  };

  recommendations: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'STAFFING' | 'TRAINING' | 'PROCESS' | 'TOOLS';
    description: string;
    impact: string;
  }[];
}

export class PerformanceTrackingService {
  /**
   * Calculate comprehensive performance metrics for a given timeframe
   */
  calculatePerformanceMetrics(
    tickets: Ticket[],
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): PerformanceMetrics {
    const filteredTickets = tickets.filter(
      ticket => ticket.createdAt >= startDate && ticket.createdAt <= endDate
    );

    const volume = this.calculateVolumeMetrics(filteredTickets, startDate, endDate);
    const responseTimes = this.calculateTimeMetrics(filteredTickets, 'response');
    const resolutionTimes = this.calculateTimeMetrics(filteredTickets, 'resolution');
    const slaPerformance = this.calculateSLAPerformance(filteredTickets);
    const workload = this.calculateWorkloadDistribution(filteredTickets);
    const trends = this.calculateTrends(filteredTickets, startDate, endDate, granularity);
    const quality = this.calculateQualityMetrics(filteredTickets);

    return {
      timeframe: { start: startDate, end: endDate, granularity },
      volume,
      responseTimes,
      resolutionTimes,
      slaPerformance,
      workload,
      trends,
      quality
    };
  }

  /**
   * Calculate volume-based metrics
   */
  private calculateVolumeMetrics(tickets: Ticket[], startDate: Date, endDate: Date) {
    const totalTickets = tickets.length;
    const newTickets = tickets.filter(t => t.createdAt >= startDate && t.createdAt <= endDate).length;
    const resolvedTickets = tickets.filter(t => 
      t.status === TicketStatus.RESOLVED && 
      t.resolvedAt && 
      t.resolvedAt >= startDate && 
      t.resolvedAt <= endDate
    ).length;
    const reopenedTickets = tickets.filter(t => 
      t.metadata.customFields?.reopenCount && 
      (t.metadata.customFields.reopenCount as number) > 0
    ).length;
    const escalatedTickets = tickets.filter(t => 
      t.status === TicketStatus.ESCALATED || t.slaTracking.escalationLevel > 0
    ).length;

    return {
      totalTickets,
      newTickets,
      resolvedTickets,
      reopenedTickets,
      escalatedTickets
    };
  }

  /**
   * Calculate time-based metrics (response or resolution times)
   */
  private calculateTimeMetrics(tickets: Ticket[], type: 'response' | 'resolution') {
    const times = tickets
      .map(ticket => {
        if (type === 'response' && ticket.slaTracking.actualResponseTime) {
          return ticket.slaTracking.actualResponseTime;
        }
        if (type === 'resolution' && ticket.slaTracking.actualResolutionTime) {
          return ticket.slaTracking.actualResolutionTime * 60; // Convert hours to minutes
        }
        return null;
      })
      .filter((time): time is number => time !== null)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      return {
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
        distribution: []
      };
    }

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const median = times[Math.floor(times.length / 2)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    // Create distribution buckets
    const maxTime = Math.max(...times);
    const bucketSize = maxTime / 10;
    const distribution = [];
    
    for (let i = 0; i < 10; i++) {
      const start = i * bucketSize;
      const end = (i + 1) * bucketSize;
      const count = times.filter(time => time >= start && time < end).length;
      distribution.push({
        range: `${Math.round(start)}-${Math.round(end)} min`,
        count
      });
    }

    return {
      average,
      median,
      p95,
      p99,
      distribution
    };
  }

  /**
   * Calculate SLA performance metrics
   */
  private calculateSLAPerformance(tickets: Ticket[]) {
    const totalTickets = tickets.length;
    if (totalTickets === 0) {
      return {
        responseTimeSLA: 0,
        resolutionTimeSLA: 0,
        overallSLA: 0,
        breaches: {
          total: 0,
          byType: { response: 0, resolution: 0, escalation: 0 },
          byPriority: { [TicketPriority.HIGH]: 0, [TicketPriority.MEDIUM]: 0, [TicketPriority.LOW]: 0 }
        }
      };
    }

    let responseTimeMet = 0;
    let resolutionTimeMet = 0;
    let totalBreaches = 0;
    const breachesByType = { response: 0, resolution: 0, escalation: 0 };
    const breachesByPriority = { 
      [TicketPriority.HIGH]: 0, 
      [TicketPriority.MEDIUM]: 0, 
      [TicketPriority.LOW]: 0 
    };

    tickets.forEach(ticket => {
      // Check response time SLA
      if (ticket.slaTracking.actualResponseTime) {
        if (ticket.slaTracking.actualResponseTime <= ticket.slaTracking.responseTimeMinutes) {
          responseTimeMet++;
        } else {
          breachesByType.response++;
          breachesByPriority[ticket.priority]++;
          totalBreaches++;
        }
      }

      // Check resolution time SLA
      if (ticket.slaTracking.actualResolutionTime) {
        if (ticket.slaTracking.actualResolutionTime <= ticket.slaTracking.resolutionTimeHours) {
          resolutionTimeMet++;
        } else {
          breachesByType.resolution++;
          breachesByPriority[ticket.priority]++;
          totalBreaches++;
        }
      }

      // Check if escalation was needed but didn't happen
      if (ticket.slaTracking.slaBreached) {
        totalBreaches++;
        breachesByPriority[ticket.priority]++;
      }
    });

    const responseTimeSLA = (responseTimeMet / totalTickets) * 100;
    const resolutionTimeSLA = (resolutionTimeMet / totalTickets) * 100;
    const overallSLA = ((responseTimeMet + resolutionTimeMet) / (totalTickets * 2)) * 100;

    return {
      responseTimeSLA,
      resolutionTimeSLA,
      overallSLA,
      breaches: {
        total: totalBreaches,
        byType: breachesByType,
        byPriority: breachesByPriority
      }
    };
  }

  /**
   * Calculate workload distribution metrics
   */
  private calculateWorkloadDistribution(tickets: Ticket[]) {
    const byTechnician = new Map<string, { tickets: number; totalResolutionTime: number }>();
    const byPriority = { [TicketPriority.HIGH]: 0, [TicketPriority.MEDIUM]: 0, [TicketPriority.LOW]: 0 };
    const byCategory = {} as Record<TicketCategory, number>;
    const byStatus = { 
      [TicketStatus.OPEN]: 0, 
      [TicketStatus.IN_PROGRESS]: 0, 
      [TicketStatus.RESOLVED]: 0, 
      [TicketStatus.ESCALATED]: 0, 
      [TicketStatus.CLOSED]: 0 
    };

    tickets.forEach(ticket => {
      // Technician workload
      if (ticket.assignedTo) {
        if (!byTechnician.has(ticket.assignedTo)) {
          byTechnician.set(ticket.assignedTo, { tickets: 0, totalResolutionTime: 0 });
        }
        const techData = byTechnician.get(ticket.assignedTo)!;
        techData.tickets++;
        if (ticket.slaTracking.actualResolutionTime) {
          techData.totalResolutionTime += ticket.slaTracking.actualResolutionTime;
        }
      }

      // Priority distribution
      byPriority[ticket.priority]++;

      // Category distribution
      if (!byCategory[ticket.category]) {
        byCategory[ticket.category] = 0;
      }
      byCategory[ticket.category]++;

      // Status distribution
      byStatus[ticket.status]++;
    });

    const technicianWorkload = Array.from(byTechnician.entries()).map(([techId, data]) => ({
      techId,
      name: `Technician ${techId}`, // In real app, would lookup actual name
      tickets: data.tickets,
      avgResolutionTime: data.tickets > 0 ? data.totalResolutionTime / data.tickets : 0
    }));

    return {
      byTechnician: technicianWorkload,
      byPriority,
      byCategory,
      byStatus
    };
  }

  /**
   * Calculate trend data over time
   */
  private calculateTrends(
    tickets: Ticket[], 
    startDate: Date, 
    endDate: Date, 
    granularity: 'hour' | 'day' | 'week' | 'month'
  ) {
    // This is a simplified implementation - real implementation would group by time periods
    const periods = this.generateTimePeriods(startDate, endDate, granularity);
    
    const volumeTrend = periods.map(period => ({
      period: period.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 20) + 5 // Placeholder data
    }));

    const responseTimeTrend = periods.map(period => ({
      period: period.toISOString().split('T')[0],
      avgTime: Math.floor(Math.random() * 30) + 15 // Placeholder data
    }));

    const resolutionTimeTrend = periods.map(period => ({
      period: period.toISOString().split('T')[0],
      avgTime: Math.floor(Math.random() * 8) + 2 // Placeholder data
    }));

    const slaComplianceTrend = periods.map(period => ({
      period: period.toISOString().split('T')[0],
      compliance: Math.random() * 20 + 80 // Placeholder data (80-100%)
    }));

    return {
      volumeTrend,
      responseTimeTrend,
      resolutionTimeTrend,
      slaComplianceTrend
    };
  }

  /**
   * Generate time periods for trend analysis
   */
  private generateTimePeriods(startDate: Date, endDate: Date, granularity: string): Date[] {
    const periods: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      periods.push(new Date(current));
      
      switch (granularity) {
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return periods;
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(tickets: Ticket[]) {
    const resolvedTickets = tickets.filter(t => t.resolution);
    const totalTickets = tickets.length;

    let totalSatisfaction = 0;
    let satisfactionCount = 0;
    const satisfactionDistribution: { rating: number; count: number }[] = [];

    // Initialize satisfaction distribution
    for (let i = 1; i <= 5; i++) {
      satisfactionDistribution.push({ rating: i, count: 0 });
    }

    resolvedTickets.forEach(ticket => {
      if (ticket.resolution?.customerSatisfaction) {
        totalSatisfaction += ticket.resolution.customerSatisfaction;
        satisfactionCount++;
        
        const rating = ticket.resolution.customerSatisfaction;
        const distribution = satisfactionDistribution.find(d => d.rating === rating);
        if (distribution) {
          distribution.count++;
        }
      }
    });

    const averageSatisfaction = satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0;

    // Calculate other quality metrics
    const reopenedTickets = tickets.filter(t => 
      t.metadata.customFields?.reopenCount && (t.metadata.customFields.reopenCount as number) > 0
    ).length;
    const escalatedTickets = tickets.filter(t => 
      t.status === TicketStatus.ESCALATED || t.slaTracking.escalationLevel > 0
    ).length;
    const firstContactResolved = resolvedTickets.filter(t => 
      !t.metadata.customFields?.reopenCount || (t.metadata.customFields.reopenCount as number) === 0
    ).length;

    const reopenRate = totalTickets > 0 ? (reopenedTickets / totalTickets) * 100 : 0;
    const escalationRate = totalTickets > 0 ? (escalatedTickets / totalTickets) * 100 : 0;
    const firstContactResolution = resolvedTickets.length > 0 ? (firstContactResolved / resolvedTickets.length) * 100 : 0;

    return {
      customerSatisfaction: {
        average: averageSatisfaction,
        distribution: satisfactionDistribution,
        feedbackCount: satisfactionCount
      },
      firstContactResolution,
      reopenRate,
      escalationRate
    };
  }

  /**
   * Calculate individual technician performance
   */
  calculateTechnicianPerformance(
    techId: string,
    tickets: Ticket[],
    startDate: Date,
    endDate: Date
  ): TechnicianPerformance {
    const techTickets = tickets.filter(t => 
      t.assignedTo === techId && 
      t.createdAt >= startDate && 
      t.createdAt <= endDate
    );

    const productivity = this.calculateTechnicianProductivity(techTickets);
    const quality = this.calculateTechnicianQuality(techTickets);
    const slaCompliance = this.calculateTechnicianSLA(techTickets);
    const workload = this.calculateTechnicianWorkload(techTickets);
    const skills = this.calculateTechnicianSkills(techTickets);

    return {
      techId,
      name: `Technician ${techId}`, // In real app, would lookup actual name
      period: { start: startDate, end: endDate },
      productivity,
      quality,
      slaCompliance,
      workload,
      skills
    };
  }

  private calculateTechnicianProductivity(tickets: Ticket[]) {
    const ticketsHandled = tickets.length;
    const ticketsResolved = tickets.filter(t => t.status === TicketStatus.RESOLVED).length;
    const totalResolutionTime = tickets.reduce((sum, t) => 
      sum + (t.slaTracking.actualResolutionTime || 0), 0
    );
    const averageResolutionTime = ticketsResolved > 0 ? totalResolutionTime / ticketsResolved : 0;
    
    // Simple productivity score calculation
    const productivityScore = Math.min(100, (ticketsResolved / Math.max(1, ticketsHandled)) * 100);

    return {
      ticketsHandled,
      ticketsResolved,
      averageResolutionTime,
      productivityScore
    };
  }

  private calculateTechnicianQuality(tickets: Ticket[]) {
    const resolvedTickets = tickets.filter(t => t.resolution);
    const totalSatisfaction = resolvedTickets.reduce((sum, t) => 
      sum + (t.resolution?.customerSatisfaction || 0), 0
    );
    const customerSatisfactionAvg = resolvedTickets.length > 0 ? 
      totalSatisfaction / resolvedTickets.length : 0;

    const reopenedTickets = tickets.filter(t => 
      t.metadata.customFields?.reopenCount && (t.metadata.customFields.reopenCount as number) > 0
    ).length;
    const escalatedTickets = tickets.filter(t => t.slaTracking.escalationLevel > 0).length;
    const firstContactResolved = resolvedTickets.filter(t => 
      !t.metadata.customFields?.reopenCount || (t.metadata.customFields.reopenCount as number) === 0
    ).length;

    const reopenRate = tickets.length > 0 ? (reopenedTickets / tickets.length) * 100 : 0;
    const escalationRate = tickets.length > 0 ? (escalatedTickets / tickets.length) * 100 : 0;
    const firstContactResolution = resolvedTickets.length > 0 ? 
      (firstContactResolved / resolvedTickets.length) * 100 : 0;

    // Simple quality score calculation
    const qualityScore = Math.max(0, 100 - reopenRate - escalationRate + firstContactResolution);

    return {
      customerSatisfactionAvg,
      reopenRate,
      escalationRate,
      firstContactResolution,
      qualityScore
    };
  }

  private calculateTechnicianSLA(tickets: Ticket[]) {
    const slaPerformance = this.calculateSLAPerformance(tickets);
    return {
      responseTimeSLA: slaPerformance.responseTimeSLA,
      resolutionTimeSLA: slaPerformance.resolutionTimeSLA,
      overallSLA: slaPerformance.overallSLA,
      breachCount: slaPerformance.breaches.total
    };
  }

  private calculateTechnicianWorkload(tickets: Ticket[]) {
    const activeTickets = tickets.filter(t => 
      [TicketStatus.OPEN, TicketStatus.IN_PROGRESS].includes(t.status)
    ).length;
    
    const overdueTasks = tickets.filter(t => t.slaTracking.slaBreached).length;
    
    // Simple utilization rate calculation (would be more complex in real system)
    const utilizationRate = Math.min(100, (activeTickets / 10) * 100); // Assuming 10 tickets is 100% utilization
    
    let workloadBalance: 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOADED';
    if (utilizationRate < 30) workloadBalance = 'LOW';
    else if (utilizationRate < 70) workloadBalance = 'NORMAL';
    else if (utilizationRate < 90) workloadBalance = 'HIGH';
    else workloadBalance = 'OVERLOADED';

    return {
      activeTickets,
      overdueTasks,
      utilizationRate,
      workloadBalance
    };
  }

  private calculateTechnicianSkills(tickets: Ticket[]) {
    const categoryStats = new Map<TicketCategory, { count: number; totalTime: number }>();
    
    tickets.forEach(ticket => {
      if (!categoryStats.has(ticket.category)) {
        categoryStats.set(ticket.category, { count: 0, totalTime: 0 });
      }
      const stats = categoryStats.get(ticket.category)!;
      stats.count++;
      if (ticket.slaTracking.actualResolutionTime) {
        stats.totalTime += ticket.slaTracking.actualResolutionTime;
      }
    });

    const categoryExpertise = Array.from(categoryStats.entries()).map(([category, stats]) => {
      const avgTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
      // Simple proficiency calculation - lower average time = higher proficiency
      const proficiency = Math.max(0, 100 - (avgTime * 10));
      
      return {
        category,
        proficiency,
        ticketCount: stats.count
      };
    });

    // Simple improvement/strength area identification
    const sortedByProficiency = [...categoryExpertise].sort((a, b) => a.proficiency - b.proficiency);
    const improvementAreas = sortedByProficiency.slice(0, 2).map(c => c.category);
    const strengthAreas = sortedByProficiency.slice(-2).map(c => c.category);

    return {
      categoryExpertise,
      improvementAreas,
      strengthAreas
    };
  }

  /**
   * Generate automated performance recommendations
   */
  generateRecommendations(metrics: PerformanceMetrics): TeamPerformance['recommendations'] {
    const recommendations: TeamPerformance['recommendations'] = [];

    // SLA compliance recommendations
    if (metrics.slaPerformance.overallSLA < 90) {
      recommendations.push({
        priority: 'HIGH',
        category: 'PROCESS',
        description: 'SLA compliance is below target (90%). Review response processes and escalation procedures.',
        impact: 'Improved customer satisfaction and service quality'
      });
    }

    // Volume spike recommendations
    if (metrics.volume.totalTickets > metrics.volume.resolvedTickets * 1.5) {
      recommendations.push({
        priority: 'HIGH',
        category: 'STAFFING',
        description: 'Ticket volume is significantly higher than resolution capacity. Consider additional staffing.',
        impact: 'Reduced ticket backlog and improved response times'
      });
    }

    // Quality recommendations
    if (metrics.quality.customerSatisfaction.average < 4.0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'TRAINING',
        description: 'Customer satisfaction is below target. Implement additional customer service training.',
        impact: 'Improved customer experience and satisfaction scores'
      });
    }

    // Escalation rate recommendations
    if (metrics.quality.escalationRate > 15) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'TRAINING',
        description: 'High escalation rate indicates need for additional technical training or knowledge base improvements.',
        impact: 'Reduced escalations and improved first-contact resolution'
      });
    }

    return recommendations;
  }
}

export const performanceTrackingService = new PerformanceTrackingService();