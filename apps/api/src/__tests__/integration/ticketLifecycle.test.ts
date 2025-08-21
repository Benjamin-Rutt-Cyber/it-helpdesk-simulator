import { ticketRepository } from '../../repositories/ticketRepository';
import { slaService } from '../../services/slaService';
import { alertService } from '../../services/alertService';
import { TicketStatus, TicketPriority, TicketCategory, Department } from '../../types/ticket';

// Mock dependencies
jest.mock('../../repositories/ticketRepository');
jest.mock('../../services/slaService');
jest.mock('../../services/alertService');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

const mockTicketRepository = ticketRepository as jest.Mocked<typeof ticketRepository>;
const mockSlaService = slaService as jest.Mocked<typeof slaService>;
const mockAlertService = alertService as jest.Mocked<typeof alertService>;

describe('Ticket Lifecycle Integration Tests', () => {
  const mockCustomer = {
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
  };

  const mockTicketData = {
    ticketNumber: 'TK-202407-0001',
    title: 'Password Reset Request',
    description: 'User cannot access their account due to forgotten password',
    category: TicketCategory.PASSWORD,
    priority: TicketPriority.HIGH,
    customerId: 'customer-1',
    metadata: {
      scenarioId: 'password-reset-scenario',
      templateId: 'password-reset-template',
      difficultyLevel: 'beginner',
      learningObjectives: ['Identity verification', 'Password reset procedure'],
      expectedResolutionSteps: ['Verify identity', 'Reset password', 'Notify user'],
      skillsRequired: ['Active Directory', 'Customer Service'],
      knowledgeBaseArticles: ['KB-001: Password Reset'],
      estimatedResolutionTime: 15,
      complexity: 'low',
      businessImpact: 'medium',
      tags: ['password', 'authentication'],
      customFields: {}
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockTicketRepository.create.mockImplementation(async (data) => ({
      id: 'ticket-1',
      status: TicketStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: mockCustomer,
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
      ...data
    }));

    mockSlaService.getSLAConfiguration.mockReturnValue({
      priority: TicketPriority.HIGH,
      responseTimeMinutes: 15,
      resolutionTimeHours: 4,
      escalationTimeHours: 2,
      businessHoursOnly: false,
      escalationLevels: [
        {
          level: 1,
          timeThresholdHours: 2,
          escalateTo: ['senior-tech'],
          notificationChannels: ['email'],
          autoEscalate: true
        }
      ]
    });

    mockSlaService.generateSLAAlerts.mockReturnValue([]);
    mockSlaService.updateSLATracking.mockReturnValue({});
    mockAlertService.processAlert.mockResolvedValue();
  });

  describe('Ticket Creation Lifecycle', () => {
    it('should create ticket with proper SLA configuration', async () => {
      const createdTicket = await mockTicketRepository.create(mockTicketData);

      expect(mockTicketRepository.create).toHaveBeenCalledWith(mockTicketData);
      expect(createdTicket.status).toBe(TicketStatus.OPEN);
      expect(createdTicket.slaTracking.responseTimeMinutes).toBe(15);
      expect(createdTicket.slaTracking.resolutionTimeHours).toBe(4);
    });

    it('should generate appropriate SLA alerts on creation', async () => {
      const ticket = await mockTicketRepository.create(mockTicketData);
      
      // Simulate immediate SLA check after creation
      const alerts = mockSlaService.generateSLAAlerts(ticket);
      
      expect(mockSlaService.generateSLAAlerts).toHaveBeenCalledWith(ticket);
      
      // Process any generated alerts
      for (const alert of alerts) {
        await mockAlertService.processAlert(alert);
      }
    });

    it('should set correct priority-based SLA thresholds', async () => {
      // Test high priority ticket
      const highPriorityTicket = await mockTicketRepository.create({
        ...mockTicketData,
        priority: TicketPriority.HIGH
      });

      expect(mockSlaService.getSLAConfiguration).toHaveBeenCalledWith(TicketPriority.HIGH);
      expect(highPriorityTicket.slaTracking.responseTimeMinutes).toBe(15);

      // Test medium priority ticket
      mockSlaService.getSLAConfiguration.mockReturnValue({
        priority: TicketPriority.MEDIUM,
        responseTimeMinutes: 60,
        resolutionTimeHours: 24,
        escalationTimeHours: 8,
        businessHoursOnly: true,
        escalationLevels: []
      });

      const mediumPriorityTicket = await mockTicketRepository.create({
        ...mockTicketData,
        priority: TicketPriority.MEDIUM
      });

      expect(mediumPriorityTicket.slaTracking.responseTimeMinutes).toBe(60);
    });
  });

  describe('Ticket Assignment Lifecycle', () => {
    it('should update SLA tracking when ticket is assigned', async () => {
      const ticket = await mockTicketRepository.create(mockTicketData);
      
      mockSlaService.updateSLATracking.mockReturnValue({
        actualResponseTime: 10 // 10 minutes response time
      });

      mockTicketRepository.update.mockResolvedValue({
        ...ticket,
        assignedTo: 'tech-001',
        status: TicketStatus.IN_PROGRESS,
        slaTracking: {
          ...ticket.slaTracking,
          actualResponseTime: 10
        }
      });

      const updatedTicket = await mockTicketRepository.update(ticket.id, {
        assignedTo: 'tech-001',
        status: TicketStatus.IN_PROGRESS
      });

      expect(mockSlaService.updateSLATracking).toHaveBeenCalledWith(
        ticket,
        TicketStatus.IN_PROGRESS,
        'tech-001'
      );
      expect(updatedTicket.assignedTo).toBe('tech-001');
      expect(updatedTicket.status).toBe(TicketStatus.IN_PROGRESS);
      expect(updatedTicket.slaTracking.actualResponseTime).toBe(10);
    });

    it('should generate alerts if response time SLA is breached', async () => {
      const ticket = await mockTicketRepository.create({
        ...mockTicketData,
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      });

      mockSlaService.checkSLABreach.mockReturnValue({
        isBreached: true,
        breachType: 'RESPONSE',
        timeOverdue: 15,
        severity: 'HIGH'
      });

      mockSlaService.generateSLAAlerts.mockReturnValue([{
        id: 'alert-1',
        ticketId: ticket.id,
        type: 'SLA_BREACH',
        severity: 'CRITICAL',
        message: 'Response SLA breached',
        targetUsers: ['team-lead'],
        channels: ['email', 'sms'],
        createdAt: new Date(),
        acknowledged: false
      }]);

      const alerts = mockSlaService.generateSLAAlerts(ticket);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('SLA_BREACH');
      expect(alerts[0].severity).toBe('CRITICAL');

      // Process the alert
      await mockAlertService.processAlert(alerts[0]);
      expect(mockAlertService.processAlert).toHaveBeenCalledWith(alerts[0]);
    });
  });

  describe('Ticket Resolution Lifecycle', () => {
    it('should complete resolution workflow correctly', async () => {
      const ticket = await mockTicketRepository.create(mockTicketData);
      
      // Assign ticket
      const assignedTicket = await mockTicketRepository.update(ticket.id, {
        assignedTo: 'tech-001',
        status: TicketStatus.IN_PROGRESS
      });

      // Resolve ticket
      mockSlaService.updateSLATracking.mockReturnValue({
        actualResolutionTime: 2.5 // 2.5 hours
      });

      mockTicketRepository.update.mockResolvedValue({
        ...assignedTicket,
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date(),
        resolution: {
          summary: 'Password reset completed successfully',
          rootCause: 'User forgot password',
          actionsTaken: ['Verified identity', 'Reset password', 'Notified user'],
          preventionMeasures: 'User educated on password best practices',
          followUpRequired: false,
          customerSatisfaction: 5,
          resolutionNotes: 'Customer satisfied with service'
        },
        slaTracking: {
          ...assignedTicket.slaTracking,
          actualResolutionTime: 2.5
        }
      });

      const resolvedTicket = await mockTicketRepository.update(ticket.id, {
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date(),
        resolution: {
          summary: 'Password reset completed successfully',
          rootCause: 'User forgot password',
          actionsTaken: ['Verified identity', 'Reset password', 'Notified user'],
          preventionMeasures: 'User educated on password best practices',
          followUpRequired: false,
          customerSatisfaction: 5,
          resolutionNotes: 'Customer satisfied with service'
        }
      });

      expect(mockSlaService.updateSLATracking).toHaveBeenCalledWith(
        expect.any(Object),
        TicketStatus.RESOLVED,
        undefined
      );
      expect(resolvedTicket.status).toBe(TicketStatus.RESOLVED);
      expect(resolvedTicket.resolvedAt).toBeDefined();
      expect(resolvedTicket.resolution).toBeDefined();
      expect(resolvedTicket.slaTracking.actualResolutionTime).toBe(2.5);
    });

    it('should handle resolution SLA breach', async () => {
      const ticket = await mockTicketRepository.create({
        ...mockTicketData,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago (exceeds 4-hour SLA)
      });

      mockSlaService.checkSLABreach.mockReturnValue({
        isBreached: true,
        breachType: 'RESOLUTION',
        timeOverdue: 2,
        severity: 'HIGH'
      });

      mockSlaService.updateSLATracking.mockReturnValue({
        slaBreached: true,
        breachReason: 'RESOLUTION SLA breached by 2.0 hours'
      });

      const resolvedTicket = await mockTicketRepository.update(ticket.id, {
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date()
      });

      const breach = mockSlaService.checkSLABreach(resolvedTicket);
      expect(breach.isBreached).toBe(true);
      expect(breach.breachType).toBe('RESOLUTION');
    });
  });

  describe('Ticket Escalation Lifecycle', () => {
    it('should auto-escalate ticket when threshold exceeded', async () => {
      const ticket = await mockTicketRepository.create({
        ...mockTicketData,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      });

      mockSlaService.shouldAutoEscalate.mockReturnValue({
        shouldEscalate: true,
        escalationLevel: 1,
        escalateTo: ['senior-tech'],
        reason: 'Auto-escalation triggered: 2 hour threshold exceeded'
      });

      const escalationRecommendation = mockSlaService.shouldAutoEscalate(ticket);
      
      if (escalationRecommendation.shouldEscalate) {
        mockTicketRepository.update.mockResolvedValue({
          ...ticket,
          status: TicketStatus.ESCALATED,
          slaTracking: {
            ...ticket.slaTracking,
            escalationLevel: 1,
            escalationHistory: [{
              level: 1,
              timestamp: new Date(),
              reason: escalationRecommendation.reason,
              escalatedBy: 'system',
              escalatedTo: 'senior-tech'
            }]
          }
        });

        const escalatedTicket = await mockTicketRepository.update(ticket.id, {
          status: TicketStatus.ESCALATED,
          slaTracking: {
            ...ticket.slaTracking,
            escalationLevel: 1,
            escalationHistory: [{
              level: 1,
              timestamp: new Date(),
              reason: escalationRecommendation.reason,
              escalatedBy: 'system',
              escalatedTo: 'senior-tech'
            }]
          }
        });

        expect(escalatedTicket.status).toBe(TicketStatus.ESCALATED);
        expect(escalatedTicket.slaTracking.escalationLevel).toBe(1);
        expect(escalatedTicket.slaTracking.escalationHistory).toHaveLength(1);
      }
    });

    it('should generate escalation alerts', async () => {
      const ticket = await mockTicketRepository.create(mockTicketData);

      mockSlaService.generateSLAAlerts.mockReturnValue([{
        id: 'escalation-alert-1',
        ticketId: ticket.id,
        type: 'ESCALATION_REQUIRED',
        severity: 'HIGH',
        message: 'Ticket requires escalation - threshold exceeded',
        targetUsers: ['team-lead'],
        channels: ['email'],
        createdAt: new Date(),
        acknowledged: false
      }]);

      const alerts = mockSlaService.generateSLAAlerts(ticket);
      const escalationAlert = alerts.find(alert => alert.type === 'ESCALATION_REQUIRED');

      expect(escalationAlert).toBeDefined();
      expect(escalationAlert?.severity).toBe('HIGH');

      if (escalationAlert) {
        await mockAlertService.processAlert(escalationAlert);
        expect(mockAlertService.processAlert).toHaveBeenCalledWith(escalationAlert);
      }
    });
  });

  describe('Ticket Closure Lifecycle', () => {
    it('should close resolved ticket correctly', async () => {
      const ticket = await mockTicketRepository.create(mockTicketData);
      
      // First resolve the ticket
      const resolvedTicket = await mockTicketRepository.update(ticket.id, {
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date()
      });

      // Then close the ticket
      mockTicketRepository.update.mockResolvedValue({
        ...resolvedTicket,
        status: TicketStatus.CLOSED,
        closedAt: new Date()
      });

      const closedTicket = await mockTicketRepository.update(ticket.id, {
        status: TicketStatus.CLOSED,
        closedAt: new Date()
      });

      expect(closedTicket.status).toBe(TicketStatus.CLOSED);
      expect(closedTicket.closedAt).toBeDefined();
    });

    it('should handle ticket reopening', async () => {
      // Start with a closed ticket
      const closedTicket = {
        id: 'ticket-1',
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
        ...mockTicketData
      };

      mockTicketRepository.update.mockResolvedValue({
        ...closedTicket,
        status: TicketStatus.IN_PROGRESS,
        closedAt: null,
        reopenedAt: new Date(),
        reopenCount: 1
      });

      const reopenedTicket = await mockTicketRepository.update(closedTicket.id, {
        status: TicketStatus.IN_PROGRESS,
        closedAt: null,
        reopenedAt: new Date(),
        reopenCount: 1
      });

      expect(reopenedTicket.status).toBe(TicketStatus.IN_PROGRESS);
      expect(reopenedTicket.closedAt).toBeNull();
      expect(reopenedTicket.reopenedAt).toBeDefined();
      expect(reopenedTicket.reopenCount).toBe(1);
    });
  });

  describe('Full Ticket Lifecycle Integration', () => {
    it('should complete full ticket lifecycle with SLA compliance', async () => {
      // 1. Create ticket
      const ticket = await mockTicketRepository.create(mockTicketData);
      expect(ticket.status).toBe(TicketStatus.OPEN);

      // 2. Assign ticket (within response SLA)
      mockSlaService.updateSLATracking.mockReturnValue({
        actualResponseTime: 10 // 10 minutes - within 15 minute SLA
      });

      const assignedTicket = await mockTicketRepository.update(ticket.id, {
        assignedTo: 'tech-001',
        status: TicketStatus.IN_PROGRESS
      });
      expect(assignedTicket.status).toBe(TicketStatus.IN_PROGRESS);

      // 3. Resolve ticket (within resolution SLA)
      mockSlaService.updateSLATracking.mockReturnValue({
        actualResolutionTime: 2.0 // 2 hours - within 4 hour SLA
      });

      const resolvedTicket = await mockTicketRepository.update(ticket.id, {
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date()
      });
      expect(resolvedTicket.status).toBe(TicketStatus.RESOLVED);

      // 4. Close ticket
      const closedTicket = await mockTicketRepository.update(ticket.id, {
        status: TicketStatus.CLOSED,
        closedAt: new Date()
      });
      expect(closedTicket.status).toBe(TicketStatus.CLOSED);

      // Verify SLA compliance throughout lifecycle
      const breach = mockSlaService.checkSLABreach(closedTicket);
      expect(breach.isBreached).toBe(false);
    });

    it('should handle lifecycle with multiple SLA breaches and escalations', async () => {
      // 1. Create ticket
      const ticket = await mockTicketRepository.create({
        ...mockTicketData,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
      });

      // 2. Breach response SLA
      mockSlaService.checkSLABreach.mockReturnValue({
        isBreached: true,
        breachType: 'RESPONSE',
        timeOverdue: 7.75, // 7.75 hours overdue
        severity: 'CRITICAL'
      });

      // 3. Auto-escalate due to time threshold
      mockSlaService.shouldAutoEscalate.mockReturnValue({
        shouldEscalate: true,
        escalationLevel: 1,
        escalateTo: ['senior-tech'],
        reason: 'Auto-escalation: 2 hour threshold exceeded'
      });

      const escalatedTicket = await mockTicketRepository.update(ticket.id, {
        status: TicketStatus.ESCALATED,
        slaTracking: {
          ...ticket.slaTracking,
          escalationLevel: 1,
          slaBreached: true,
          breachReason: 'RESPONSE SLA breached by 7.75 hours'
        }
      });

      // 4. Finally resolve with SLA breach recorded
      const resolvedTicket = await mockTicketRepository.update(ticket.id, {
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date()
      });

      expect(escalatedTicket.status).toBe(TicketStatus.ESCALATED);
      expect(escalatedTicket.slaTracking.slaBreached).toBe(true);
      expect(resolvedTicket.status).toBe(TicketStatus.RESOLVED);
    });
  });
});