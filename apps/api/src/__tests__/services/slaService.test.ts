import { SLAService } from '../../services/slaService';
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

describe('SLAService', () => {
  let slaService: SLAService;
  let mockTicket: Ticket;

  beforeEach(() => {
    slaService = new SLAService();
    
    mockTicket = {
      id: 'test-ticket-1',
      ticketNumber: 'TK-202407-0001',
      title: 'Test Ticket',
      description: 'Test ticket description',
      category: TicketCategory.PASSWORD,
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      customer: {
        id: 'customer-1',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+1-555-0123',
        department: Department.IT,
        jobTitle: 'Test Role',
        officeLocation: 'Test Location',
        employeeId: 'EMP001',
        manager: 'Test Manager',
        technicalSkillLevel: 'intermediate',
        preferredContactMethod: 'email',
        timezone: 'EST',
        workingHours: {
          start: '09:00',
          end: '17:00',
          daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      createdBy: 'system',
      slaTracking: {
        responseTimeMinutes: 15,
        resolutionTimeHours: 4,
        escalationTimeHours: 2,
        actualResponseTime: undefined,
        actualResolutionTime: undefined,
        slaBreached: false,
        breachReason: undefined,
        escalationLevel: 0,
        escalationHistory: []
      },
      metadata: {
        scenarioId: 'test-scenario',
        templateId: 'test-template',
        difficultyLevel: 'beginner',
        learningObjectives: [],
        expectedResolutionSteps: [],
        skillsRequired: [],
        knowledgeBaseArticles: [],
        estimatedResolutionTime: 15,
        complexity: 'low',
        businessImpact: 'low',
        tags: [],
        customFields: {}
      },
      createdAt: new Date('2024-07-20T09:00:00Z'),
      updatedAt: new Date('2024-07-20T09:00:00Z')
    };
  });

  describe('getSLAConfiguration', () => {
    it('should return correct SLA configuration for high priority', () => {
      const config = slaService.getSLAConfiguration(TicketPriority.HIGH);
      
      expect(config.priority).toBe(TicketPriority.HIGH);
      expect(config.responseTimeMinutes).toBe(15);
      expect(config.resolutionTimeHours).toBe(4);
      expect(config.escalationTimeHours).toBe(2);
      expect(config.businessHoursOnly).toBe(false);
    });

    it('should return correct SLA configuration for medium priority', () => {
      const config = slaService.getSLAConfiguration(TicketPriority.MEDIUM);
      
      expect(config.priority).toBe(TicketPriority.MEDIUM);
      expect(config.responseTimeMinutes).toBe(60);
      expect(config.resolutionTimeHours).toBe(24);
      expect(config.escalationTimeHours).toBe(8);
      expect(config.businessHoursOnly).toBe(true);
    });

    it('should return correct SLA configuration for low priority', () => {
      const config = slaService.getSLAConfiguration(TicketPriority.LOW);
      
      expect(config.priority).toBe(TicketPriority.LOW);
      expect(config.responseTimeMinutes).toBe(240);
      expect(config.resolutionTimeHours).toBe(72);
      expect(config.escalationTimeHours).toBe(24);
      expect(config.businessHoursOnly).toBe(true);
    });
  });

  describe('calculateBusinessHours', () => {
    it('should calculate business hours correctly for same day', () => {
      const start = new Date('2024-07-22T10:00:00Z'); // Monday 10 AM
      const end = new Date('2024-07-22T14:00:00Z'); // Monday 2 PM
      
      const hours = slaService.calculateBusinessHours(start, end);
      expect(hours).toBe(4);
    });

    it('should exclude weekends', () => {
      const start = new Date('2024-07-20T10:00:00Z'); // Saturday 10 AM
      const end = new Date('2024-07-21T14:00:00Z'); // Sunday 2 PM
      
      const hours = slaService.calculateBusinessHours(start, end);
      expect(hours).toBe(0);
    });

    it('should exclude hours outside business time', () => {
      const start = new Date('2024-07-22T08:00:00Z'); // Monday 8 AM (before business hours)
      const end = new Date('2024-07-22T18:00:00Z'); // Monday 6 PM (after business hours)
      
      const hours = slaService.calculateBusinessHours(start, end);
      expect(hours).toBe(8); // 9 AM to 5 PM = 8 hours
    });
  });

  describe('calculateElapsedTime', () => {
    it('should calculate total elapsed time correctly', () => {
      const ticket = {
        ...mockTicket,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      };
      
      const elapsed = slaService.calculateElapsedTime(ticket, false);
      
      expect(elapsed.totalHours).toBeCloseTo(2, 1);
    });

    it('should calculate business hours when businessHoursOnly is true', () => {
      const ticket = {
        ...mockTicket,
        createdAt: new Date('2024-07-22T10:00:00Z') // Monday 10 AM
      };
      
      // Mock current time to Monday 2 PM
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-07-22T14:00:00Z').getTime());
      
      const elapsed = slaService.calculateElapsedTime(ticket, true);
      
      expect(elapsed.businessHours).toBe(4);
      
      jest.restoreAllMocks();
    });
  });

  describe('checkSLABreach', () => {
    it('should detect response time breach for open ticket', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.OPEN,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        slaTracking: {
          ...mockTicket.slaTracking,
          responseTimeMinutes: 15,
          actualResponseTime: undefined
        }
      };
      
      const breach = slaService.checkSLABreach(ticket);
      
      expect(breach.isBreached).toBe(true);
      expect(breach.breachType).toBe('RESPONSE');
      expect(breach.severity).toBe('HIGH');
    });

    it('should detect resolution time breach for in-progress ticket', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        slaTracking: {
          ...mockTicket.slaTracking,
          resolutionTimeHours: 4,
          actualResponseTime: 10
        }
      };
      
      const breach = slaService.checkSLABreach(ticket);
      
      expect(breach.isBreached).toBe(true);
      expect(breach.breachType).toBe('RESOLUTION');
      expect(breach.severity).toBe('HIGH');
    });

    it('should not report breach when within SLA', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.OPEN,
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        slaTracking: {
          ...mockTicket.slaTracking,
          responseTimeMinutes: 15
        }
      };
      
      const breach = slaService.checkSLABreach(ticket);
      
      expect(breach.isBreached).toBe(false);
      expect(breach.breachType).toBe(null);
    });

    it('should detect escalation time breach', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        slaTracking: {
          ...mockTicket.slaTracking,
          escalationTimeHours: 2,
          actualResponseTime: 10
        }
      };
      
      const breach = slaService.checkSLABreach(ticket);
      
      expect(breach.isBreached).toBe(true);
      expect(breach.breachType).toBe('ESCALATION');
      expect(breach.severity).toBe('MEDIUM');
    });
  });

  describe('generateSLAAlerts', () => {
    it('should generate response due alert', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.OPEN,
        createdAt: new Date(Date.now() - 14 * 60 * 1000), // 14 minutes ago (1 min before breach)
        slaTracking: {
          ...mockTicket.slaTracking,
          responseTimeMinutes: 15,
          actualResponseTime: undefined
        }
      };
      
      const alerts = slaService.generateSLAAlerts(ticket);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('RESPONSE_DUE');
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should generate SLA breach alert for overdue response', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.OPEN,
        createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago (5 min overdue)
        slaTracking: {
          ...mockTicket.slaTracking,
          responseTimeMinutes: 15,
          actualResponseTime: undefined
        }
      };
      
      const alerts = slaService.generateSLAAlerts(ticket);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('SLA_BREACH');
      expect(alerts[0].severity).toBe('CRITICAL');
    });

    it('should generate escalation required alert', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        slaTracking: {
          ...mockTicket.slaTracking,
          escalationTimeHours: 2,
          actualResponseTime: 10
        }
      };
      
      const alerts = slaService.generateSLAAlerts(ticket);
      
      expect(alerts.some(alert => alert.type === 'ESCALATION_REQUIRED')).toBe(true);
    });

    it('should not generate alerts when within SLA', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.OPEN,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        slaTracking: {
          ...mockTicket.slaTracking,
          responseTimeMinutes: 15,
          actualResponseTime: undefined
        }
      };
      
      const alerts = slaService.generateSLAAlerts(ticket);
      
      expect(alerts).toHaveLength(0);
    });
  });

  describe('calculateSLAMetrics', () => {
    it('should calculate metrics correctly for multiple tickets', () => {
      const tickets: Ticket[] = [
        {
          ...mockTicket,
          id: 'ticket-1',
          slaTracking: {
            ...mockTicket.slaTracking,
            actualResponseTime: 10,
            actualResolutionTime: 2,
            slaBreached: false
          }
        },
        {
          ...mockTicket,
          id: 'ticket-2',
          slaTracking: {
            ...mockTicket.slaTracking,
            actualResponseTime: 20,
            actualResolutionTime: 6,
            slaBreached: true
          }
        },
        {
          ...mockTicket,
          id: 'ticket-3',
          slaTracking: {
            ...mockTicket.slaTracking,
            actualResponseTime: 5,
            actualResolutionTime: 1,
            slaBreached: false
          }
        }
      ];
      
      const metrics = slaService.calculateSLAMetrics(tickets);
      
      expect(metrics.totalTickets).toBe(3);
      expect(metrics.withinSLA).toBe(2);
      expect(metrics.breachedSLA).toBe(1);
      expect(metrics.averageResponseTime).toBe((10 + 20 + 5) / 3);
      expect(metrics.averageResolutionTime).toBe((2 + 6 + 1) / 3);
    });

    it('should handle empty ticket array', () => {
      const metrics = slaService.calculateSLAMetrics([]);
      
      expect(metrics.totalTickets).toBe(0);
      expect(metrics.withinSLA).toBe(0);
      expect(metrics.breachedSLA).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.averageResolutionTime).toBe(0);
    });
  });

  describe('shouldAutoEscalate', () => {
    it('should recommend auto-escalation when threshold exceeded', () => {
      const ticket = {
        ...mockTicket,
        priority: TicketPriority.HIGH,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        slaTracking: {
          ...mockTicket.slaTracking,
          escalationLevel: 0
        }
      };
      
      const escalation = slaService.shouldAutoEscalate(ticket);
      
      expect(escalation.shouldEscalate).toBe(true);
      expect(escalation.escalationLevel).toBe(1);
      expect(escalation.escalateTo).toEqual(['senior-tech', 'team-lead']);
    });

    it('should not recommend escalation when within threshold', () => {
      const ticket = {
        ...mockTicket,
        priority: TicketPriority.HIGH,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        slaTracking: {
          ...mockTicket.slaTracking,
          escalationLevel: 0
        }
      };
      
      const escalation = slaService.shouldAutoEscalate(ticket);
      
      expect(escalation.shouldEscalate).toBe(false);
    });

    it('should not escalate if already at same level', () => {
      const ticket = {
        ...mockTicket,
        priority: TicketPriority.HIGH,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        slaTracking: {
          ...mockTicket.slaTracking,
          escalationLevel: 1 // Already escalated to level 1
        }
      };
      
      const escalation = slaService.shouldAutoEscalate(ticket);
      
      expect(escalation.shouldEscalate).toBe(false);
    });
  });

  describe('updateSLATracking', () => {
    it('should update response time when moving to IN_PROGRESS', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.OPEN,
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        slaTracking: {
          ...mockTicket.slaTracking,
          actualResponseTime: undefined
        }
      };
      
      const updates = slaService.updateSLATracking(ticket, TicketStatus.IN_PROGRESS, 'tech-001');
      
      expect(updates.actualResponseTime).toBeCloseTo(10, 0);
    });

    it('should update resolution time when resolving ticket', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        slaTracking: {
          ...mockTicket.slaTracking,
          actualResponseTime: 10,
          actualResolutionTime: undefined
        }
      };
      
      const updates = slaService.updateSLATracking(ticket, TicketStatus.RESOLVED, 'tech-001');
      
      expect(updates.actualResolutionTime).toBeCloseTo(2, 0);
    });

    it('should mark SLA as breached when threshold exceeded', () => {
      const ticket = {
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (exceeds 4-hour resolution SLA)
        slaTracking: {
          ...mockTicket.slaTracking,
          resolutionTimeHours: 4,
          slaBreached: false
        }
      };
      
      const updates = slaService.updateSLATracking(ticket, TicketStatus.RESOLVED, 'tech-001');
      
      expect(updates.slaBreached).toBe(true);
      expect(updates.breachReason).toContain('RESOLUTION SLA breached');
    });
  });
});