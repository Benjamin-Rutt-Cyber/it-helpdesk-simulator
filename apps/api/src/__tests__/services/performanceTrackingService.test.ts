import { PerformanceTrackingService } from '../../services/performanceTrackingService';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, Department } from '../../types/ticket';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('PerformanceTrackingService', () => {
  let performanceService: PerformanceTrackingService;
  let mockTickets: Ticket[];

  beforeEach(() => {
    performanceService = new PerformanceTrackingService();
    
    // Create mock tickets for testing
    mockTickets = [
      {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Password reset request',
        description: 'User needs password reset',
        category: TicketCategory.PASSWORD,
        priority: TicketPriority.HIGH,
        status: TicketStatus.RESOLVED,
        customer: {
          id: 'customer-1',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          department: Department.IT,
          jobTitle: 'Developer',
          officeLocation: 'Building A',
          employeeId: 'EMP001',
          manager: 'Jane Smith',
          technicalSkillLevel: 'advanced',
          preferredContactMethod: 'email',
          timezone: 'EST',
          workingHours: {
            start: '09:00',
            end: '17:00',
            daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        },
        assignedTo: 'tech-001',
        createdBy: 'system',
        slaTracking: {
          responseTimeMinutes: 15,
          resolutionTimeHours: 4,
          escalationTimeHours: 2,
          actualResponseTime: 10,
          actualResolutionTime: 2,
          slaBreached: false,
          breachReason: undefined,
          escalationLevel: 0,
          escalationHistory: []
        },
        metadata: {
          scenarioId: 'password-scenario',
          templateId: 'password-template',
          difficultyLevel: 'beginner',
          learningObjectives: [],
          expectedResolutionSteps: [],
          skillsRequired: [],
          knowledgeBaseArticles: [],
          estimatedResolutionTime: 15,
          complexity: 'low',
          businessImpact: 'medium',
          tags: [],
          customFields: {}
        },
        resolution: {
          summary: 'Password reset completed',
          rootCause: 'User forgot password',
          actionsTaken: ['Verified identity', 'Reset password'],
          preventionMeasures: 'User education',
          followUpRequired: false,
          customerSatisfaction: 5,
          resolutionNotes: 'Customer satisfied'
        },
        createdAt: new Date('2024-07-20T09:00:00Z'),
        updatedAt: new Date('2024-07-20T11:00:00Z'),
        resolvedAt: new Date('2024-07-20T11:00:00Z')
      },
      {
        id: 'ticket-2',
        ticketNumber: 'TK-202407-0002',
        title: 'Software installation issue',
        description: 'Cannot install required software',
        category: TicketCategory.SOFTWARE,
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.RESOLVED,
        customer: {
          id: 'customer-2',
          firstName: 'Jane',
          lastName: 'Smith',
          fullName: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1-555-0124',
          department: Department.SALES,
          jobTitle: 'Sales Manager',
          officeLocation: 'Building B',
          employeeId: 'EMP002',
          manager: 'Bob Johnson',
          technicalSkillLevel: 'intermediate',
          preferredContactMethod: 'phone',
          timezone: 'PST',
          workingHours: {
            start: '08:00',
            end: '17:00',
            daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        },
        assignedTo: 'tech-002',
        createdBy: 'system',
        slaTracking: {
          responseTimeMinutes: 60,
          resolutionTimeHours: 24,
          escalationTimeHours: 8,
          actualResponseTime: 45,
          actualResolutionTime: 6,
          slaBreached: false,
          breachReason: undefined,
          escalationLevel: 0,
          escalationHistory: []
        },
        metadata: {
          scenarioId: 'software-scenario',
          templateId: 'software-template',
          difficultyLevel: 'intermediate',
          learningObjectives: [],
          expectedResolutionSteps: [],
          skillsRequired: [],
          knowledgeBaseArticles: [],
          estimatedResolutionTime: 60,
          complexity: 'medium',
          businessImpact: 'medium',
          tags: [],
          customFields: {}
        },
        resolution: {
          summary: 'Software installed successfully',
          rootCause: 'Admin rights required',
          actionsTaken: ['Elevated privileges', 'Installed software'],
          preventionMeasures: 'User training on software requests',
          followUpRequired: true,
          customerSatisfaction: 4,
          resolutionNotes: 'Customer needs follow-up training'
        },
        createdAt: new Date('2024-07-20T10:00:00Z'),
        updatedAt: new Date('2024-07-20T16:00:00Z'),
        resolvedAt: new Date('2024-07-20T16:00:00Z')
      },
      {
        id: 'ticket-3',
        ticketNumber: 'TK-202407-0003',
        title: 'Network connectivity problem',
        description: 'Cannot connect to network resources',
        category: TicketCategory.NETWORK,
        priority: TicketPriority.HIGH,
        status: TicketStatus.ESCALATED,
        customer: {
          id: 'customer-3',
          firstName: 'Bob',
          lastName: 'Wilson',
          fullName: 'Bob Wilson',
          email: 'bob.wilson@example.com',
          phone: '+1-555-0125',
          department: Department.ENGINEERING,
          jobTitle: 'Engineer',
          officeLocation: 'Building C',
          employeeId: 'EMP003',
          manager: 'Alice Brown',
          technicalSkillLevel: 'advanced',
          preferredContactMethod: 'email',
          timezone: 'EST',
          workingHours: {
            start: '09:00',
            end: '18:00',
            daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        },
        assignedTo: 'tech-003',
        createdBy: 'system',
        slaTracking: {
          responseTimeMinutes: 15,
          resolutionTimeHours: 4,
          escalationTimeHours: 2,
          actualResponseTime: 5,
          actualResolutionTime: undefined,
          slaBreached: true,
          breachReason: 'Resolution time exceeded',
          escalationLevel: 1,
          escalationHistory: [{
            level: 1,
            timestamp: new Date('2024-07-20T13:00:00Z'),
            reason: 'Complex network issue',
            escalatedBy: 'tech-003',
            escalatedTo: 'senior-tech-001'
          }]
        },
        metadata: {
          scenarioId: 'network-scenario',
          templateId: 'network-template',
          difficultyLevel: 'advanced',
          learningObjectives: [],
          expectedResolutionSteps: [],
          skillsRequired: [],
          knowledgeBaseArticles: [],
          estimatedResolutionTime: 120,
          complexity: 'high',
          businessImpact: 'high',
          tags: [],
          customFields: {}
        },
        createdAt: new Date('2024-07-20T11:00:00Z'),
        updatedAt: new Date('2024-07-20T13:00:00Z')
      }
    ];
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate comprehensive performance metrics', () => {
      const startDate = new Date('2024-07-20T00:00:00Z');
      const endDate = new Date('2024-07-20T23:59:59Z');

      const metrics = performanceService.calculatePerformanceMetrics(
        mockTickets,
        startDate,
        endDate,
        'day'
      );

      expect(metrics.timeframe.start).toEqual(startDate);
      expect(metrics.timeframe.end).toEqual(endDate);
      expect(metrics.timeframe.granularity).toBe('day');

      // Volume metrics
      expect(metrics.volume.totalTickets).toBe(3);
      expect(metrics.volume.resolvedTickets).toBe(2);
      expect(metrics.volume.escalatedTickets).toBe(1);

      // Response times
      expect(metrics.responseTimes.average).toBeCloseTo((10 + 45 + 5) / 3, 1);

      // Resolution times (converted from hours to minutes)
      expect(metrics.resolutionTimes.average).toBeCloseTo((2 * 60 + 6 * 60) / 2, 1);

      // SLA performance
      expect(metrics.slaPerformance.responseTimeSLA).toBeGreaterThan(0);
      expect(metrics.slaPerformance.resolutionTimeSLA).toBeGreaterThan(0);

      // Workload distribution
      expect(metrics.workload.byTechnician).toHaveLength(3);
      expect(metrics.workload.byPriority[TicketPriority.HIGH]).toBe(2);
      expect(metrics.workload.byPriority[TicketPriority.MEDIUM]).toBe(1);

      // Quality metrics
      expect(metrics.quality.customerSatisfaction.average).toBeCloseTo(4.5, 1);
      expect(metrics.quality.escalationRate).toBeCloseTo(33.33, 1);
    });

    it('should handle empty ticket array', () => {
      const startDate = new Date('2024-07-20T00:00:00Z');
      const endDate = new Date('2024-07-20T23:59:59Z');

      const metrics = performanceService.calculatePerformanceMetrics(
        [],
        startDate,
        endDate
      );

      expect(metrics.volume.totalTickets).toBe(0);
      expect(metrics.responseTimes.average).toBe(0);
      expect(metrics.resolutionTimes.average).toBe(0);
      expect(metrics.slaPerformance.responseTimeSLA).toBe(0);
      expect(metrics.quality.customerSatisfaction.average).toBe(0);
    });

    it('should filter tickets by date range', () => {
      const startDate = new Date('2024-07-20T09:30:00Z');
      const endDate = new Date('2024-07-20T15:00:00Z');

      const metrics = performanceService.calculatePerformanceMetrics(
        mockTickets,
        startDate,
        endDate
      );

      // Should only include tickets created within the date range
      expect(metrics.volume.totalTickets).toBe(2); // ticket-2 and ticket-3
    });
  });

  describe('calculateTechnicianPerformance', () => {
    it('should calculate individual technician performance correctly', () => {
      const startDate = new Date('2024-07-20T00:00:00Z');
      const endDate = new Date('2024-07-20T23:59:59Z');

      const techPerformance = performanceService.calculateTechnicianPerformance(
        'tech-001',
        mockTickets,
        startDate,
        endDate
      );

      expect(techPerformance.techId).toBe('tech-001');
      expect(techPerformance.period.start).toEqual(startDate);
      expect(techPerformance.period.end).toEqual(endDate);

      // Productivity metrics
      expect(techPerformance.productivity.ticketsHandled).toBe(1);
      expect(techPerformance.productivity.ticketsResolved).toBe(1);
      expect(techPerformance.productivity.averageResolutionTime).toBe(2);
      expect(techPerformance.productivity.productivityScore).toBe(100);

      // Quality metrics
      expect(techPerformance.quality.customerSatisfactionAvg).toBe(5);
      expect(techPerformance.quality.reopenRate).toBe(0);
      expect(techPerformance.quality.escalationRate).toBe(0);
      expect(techPerformance.quality.firstContactResolution).toBe(100);

      // SLA compliance
      expect(techPerformance.slaCompliance.responseTimeSLA).toBeGreaterThan(0);
      expect(techPerformance.slaCompliance.resolutionTimeSLA).toBeGreaterThan(0);
      expect(techPerformance.slaCompliance.breachCount).toBe(0);

      // Workload
      expect(techPerformance.workload.activeTickets).toBe(0);
      expect(techPerformance.workload.overdueTasks).toBe(0);
    });

    it('should handle technician with no tickets', () => {
      const startDate = new Date('2024-07-20T00:00:00Z');
      const endDate = new Date('2024-07-20T23:59:59Z');

      const techPerformance = performanceService.calculateTechnicianPerformance(
        'tech-999',
        mockTickets,
        startDate,
        endDate
      );

      expect(techPerformance.productivity.ticketsHandled).toBe(0);
      expect(techPerformance.productivity.ticketsResolved).toBe(0);
      expect(techPerformance.productivity.productivityScore).toBe(0);
      expect(techPerformance.quality.customerSatisfactionAvg).toBe(0);
      expect(techPerformance.workload.activeTickets).toBe(0);
    });

    it('should calculate workload balance correctly', () => {
      // Add more tickets for tech-002 to test workload balance
      const additionalTickets: Ticket[] = [];
      for (let i = 0; i < 15; i++) {
        additionalTickets.push({
          ...mockTickets[1],
          id: `ticket-extra-${i}`,
          ticketNumber: `TK-202407-${String(i + 100).padStart(4, '0')}`,
          assignedTo: 'tech-002',
          status: TicketStatus.IN_PROGRESS
        });
      }

      const allTickets = [...mockTickets, ...additionalTickets];
      const startDate = new Date('2024-07-20T00:00:00Z');
      const endDate = new Date('2024-07-20T23:59:59Z');

      const techPerformance = performanceService.calculateTechnicianPerformance(
        'tech-002',
        allTickets,
        startDate,
        endDate
      );

      expect(techPerformance.workload.activeTickets).toBeGreaterThan(10);
      expect(techPerformance.workload.workloadBalance).toBe('OVERLOADED');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate SLA compliance recommendations', () => {
      const mockMetrics = {
        timeframe: { start: new Date(), end: new Date(), granularity: 'day' as const },
        volume: { totalTickets: 100, newTickets: 20, resolvedTickets: 15, reopenedTickets: 2, escalatedTickets: 8 },
        responseTimes: { average: 25, median: 20, p95: 45, p99: 60, distribution: [] },
        resolutionTimes: { average: 300, median: 240, p95: 480, p99: 600, distribution: [] },
        slaPerformance: {
          responseTimeSLA: 85, // Below 90% threshold
          resolutionTimeSLA: 88,
          overallSLA: 86.5,
          breaches: { total: 15, byType: { response: 5, resolution: 8, escalation: 2 }, byPriority: { HIGH: 8, MEDIUM: 5, LOW: 2 } }
        },
        workload: { byTechnician: [], byPriority: { HIGH: 0, MEDIUM: 0, LOW: 0 }, byCategory: {}, byStatus: { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, ESCALATED: 0, CLOSED: 0 } },
        trends: { volumeTrend: [], responseTimeTrend: [], resolutionTimeTrend: [], slaComplianceTrend: [] },
        quality: {
          customerSatisfaction: { average: 3.8, distribution: [], feedbackCount: 50 },
          firstContactResolution: 75,
          reopenRate: 8,
          escalationRate: 18
        }
      };

      const recommendations = performanceService.generateRecommendations(mockMetrics);

      expect(recommendations).toHaveLength(4);
      
      const slaRecommendation = recommendations.find(r => r.category === 'PROCESS');
      expect(slaRecommendation).toBeDefined();
      expect(slaRecommendation?.priority).toBe('HIGH');
      expect(slaRecommendation?.description).toContain('SLA compliance');

      const satisfactionRecommendation = recommendations.find(r => r.category === 'TRAINING' && r.description.includes('satisfaction'));
      expect(satisfactionRecommendation).toBeDefined();
      expect(satisfactionRecommendation?.priority).toBe('MEDIUM');

      const escalationRecommendation = recommendations.find(r => r.description.includes('escalation'));
      expect(escalationRecommendation).toBeDefined();
      expect(escalationRecommendation?.priority).toBe('MEDIUM');
    });

    it('should generate volume spike recommendations', () => {
      const mockMetrics = {
        timeframe: { start: new Date(), end: new Date(), granularity: 'day' as const },
        volume: { totalTickets: 150, newTickets: 150, resolvedTickets: 80, reopenedTickets: 5, escalatedTickets: 10 },
        responseTimes: { average: 20, median: 18, p95: 35, p99: 45, distribution: [] },
        resolutionTimes: { average: 240, median: 180, p95: 360, p99: 480, distribution: [] },
        slaPerformance: {
          responseTimeSLA: 92,
          resolutionTimeSLA: 94,
          overallSLA: 93,
          breaches: { total: 8, byType: { response: 2, resolution: 5, escalation: 1 }, byPriority: { HIGH: 3, MEDIUM: 3, LOW: 2 } }
        },
        workload: { byTechnician: [], byPriority: { HIGH: 0, MEDIUM: 0, LOW: 0 }, byCategory: {}, byStatus: { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, ESCALATED: 0, CLOSED: 0 } },
        trends: { volumeTrend: [], responseTimeTrend: [], resolutionTimeTrend: [], slaComplianceTrend: [] },
        quality: {
          customerSatisfaction: { average: 4.2, distribution: [], feedbackCount: 80 },
          firstContactResolution: 85,
          reopenRate: 5,
          escalationRate: 12
        }
      };

      const recommendations = performanceService.generateRecommendations(mockMetrics);

      const volumeRecommendation = recommendations.find(r => r.category === 'STAFFING');
      expect(volumeRecommendation).toBeDefined();
      expect(volumeRecommendation?.priority).toBe('HIGH');
      expect(volumeRecommendation?.description).toContain('volume');
    });

    it('should not generate recommendations when metrics are good', () => {
      const mockMetrics = {
        timeframe: { start: new Date(), end: new Date(), granularity: 'day' as const },
        volume: { totalTickets: 50, newTickets: 50, resolvedTickets: 48, reopenedTickets: 1, escalatedTickets: 2 },
        responseTimes: { average: 15, median: 12, p95: 25, p99: 30, distribution: [] },
        resolutionTimes: { average: 180, median: 150, p95: 240, p99: 300, distribution: [] },
        slaPerformance: {
          responseTimeSLA: 96,
          resolutionTimeSLA: 98,
          overallSLA: 97,
          breaches: { total: 2, byType: { response: 1, resolution: 1, escalation: 0 }, byPriority: { HIGH: 1, MEDIUM: 1, LOW: 0 } }
        },
        workload: { byTechnician: [], byPriority: { HIGH: 0, MEDIUM: 0, LOW: 0 }, byCategory: {}, byStatus: { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, ESCALATED: 0, CLOSED: 0 } },
        trends: { volumeTrend: [], responseTimeTrend: [], resolutionTimeTrend: [], slaComplianceTrend: [] },
        quality: {
          customerSatisfaction: { average: 4.6, distribution: [], feedbackCount: 45 },
          firstContactResolution: 92,
          reopenRate: 2,
          escalationRate: 4
        }
      };

      const recommendations = performanceService.generateRecommendations(mockMetrics);

      // Should generate fewer or no recommendations when performance is good
      expect(recommendations.length).toBeLessThan(3);
    });
  });

  describe('time calculations', () => {
    it('should calculate time metrics correctly for different periods', () => {
      const tickets = mockTickets.map(ticket => ({
        ...ticket,
        slaTracking: {
          ...ticket.slaTracking,
          actualResponseTime: 15,
          actualResolutionTime: 3
        }
      }));

      const metrics = performanceService.calculatePerformanceMetrics(
        tickets,
        new Date('2024-07-20T00:00:00Z'),
        new Date('2024-07-20T23:59:59Z')
      );

      expect(metrics.responseTimes.average).toBe(15);
      expect(metrics.resolutionTimes.average).toBe(180); // 3 hours * 60 minutes
    });

    it('should handle tickets without time data', () => {
      const ticketsWithoutTimes = mockTickets.map(ticket => ({
        ...ticket,
        slaTracking: {
          ...ticket.slaTracking,
          actualResponseTime: undefined,
          actualResolutionTime: undefined
        }
      }));

      const metrics = performanceService.calculatePerformanceMetrics(
        ticketsWithoutTimes,
        new Date('2024-07-20T00:00:00Z'),
        new Date('2024-07-20T23:59:59Z')
      );

      expect(metrics.responseTimes.average).toBe(0);
      expect(metrics.resolutionTimes.average).toBe(0);
    });
  });

  describe('workload distribution', () => {
    it('should calculate technician workload correctly', () => {
      const metrics = performanceService.calculatePerformanceMetrics(
        mockTickets,
        new Date('2024-07-20T00:00:00Z'),
        new Date('2024-07-20T23:59:59Z')
      );

      const tech001 = metrics.workload.byTechnician.find(t => t.techId === 'tech-001');
      const tech002 = metrics.workload.byTechnician.find(t => t.techId === 'tech-002');
      const tech003 = metrics.workload.byTechnician.find(t => t.techId === 'tech-003');

      expect(tech001?.tickets).toBe(1);
      expect(tech001?.avgResolutionTime).toBe(2);

      expect(tech002?.tickets).toBe(1);
      expect(tech002?.avgResolutionTime).toBe(6);

      expect(tech003?.tickets).toBe(1);
      expect(tech003?.avgResolutionTime).toBe(0); // No resolution time for escalated ticket
    });

    it('should calculate category distribution correctly', () => {
      const metrics = performanceService.calculatePerformanceMetrics(
        mockTickets,
        new Date('2024-07-20T00:00:00Z'),
        new Date('2024-07-20T23:59:59Z')
      );

      expect(metrics.workload.byCategory[TicketCategory.PASSWORD]).toBe(1);
      expect(metrics.workload.byCategory[TicketCategory.SOFTWARE]).toBe(1);
      expect(metrics.workload.byCategory[TicketCategory.NETWORK]).toBe(1);
    });

    it('should calculate status distribution correctly', () => {
      const metrics = performanceService.calculatePerformanceMetrics(
        mockTickets,
        new Date('2024-07-20T00:00:00Z'),
        new Date('2024-07-20T23:59:59Z')
      );

      expect(metrics.workload.byStatus[TicketStatus.RESOLVED]).toBe(2);
      expect(metrics.workload.byStatus[TicketStatus.ESCALATED]).toBe(1);
      expect(metrics.workload.byStatus[TicketStatus.OPEN]).toBe(0);
    });
  });
});