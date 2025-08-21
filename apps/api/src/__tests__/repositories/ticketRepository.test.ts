import { TicketRepository, CreateTicketData, UpdateTicketData, TicketSearchOptions } from '../../repositories/ticketRepository';
import { TicketCategory, TicketPriority, TicketStatus } from '../../models/Ticket';

// Mock Prisma Client
const mockPrisma = {
  ticket: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  ticketHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  ticketAsset: {
    create: jest.fn(),
  },
  ticketTemplate: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  ticketUpdate: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('TicketRepository', () => {
  let ticketRepository: TicketRepository;

  beforeEach(() => {
    ticketRepository = new TicketRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockTicketData: CreateTicketData = {
      title: 'Test Ticket',
      description: 'Test Description',
      category: TicketCategory.SOFTWARE,
      priority: TicketPriority.MEDIUM,
      customerId: 'customer-1',
      assetIds: ['asset-1'],
      scenarioId: 'scenario-1',
      templateId: 'template-1',
    };

    const mockDbTicket = {
      id: 'ticket-1',
      ticketNumber: 'TK-202407-0001',
      title: 'Test Ticket',
      description: 'Test Description',
      category: 'software',
      priority: 'medium',
      status: 'open',
      customerId: 'customer-1',
      assignedTo: null,
      createdBy: 'user-1',
      scenarioId: 'scenario-1',
      templateId: 'template-1',
      slaResponseTimeMinutes: 60,
      slaResolutionTimeHours: 24,
      slaEscalationTimeHours: 8,
      actualResponseTime: null,
      actualResolutionTime: null,
      slaBreached: false,
      breachReason: null,
      escalationLevel: 0,
      metadata: '{}',
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      closedAt: null,
      customer: {
        id: 'customer-1',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john.doe@company.com',
        phone: '+1-555-0123',
        department: 'engineering',
        jobTitle: 'Software Engineer',
        officeLocation: 'Building A',
        employeeId: 'EMP001',
        manager: 'Jane Smith',
        technicalSkillLevel: 'advanced',
        preferredContactMethod: 'email',
        timezone: 'UTC',
        workingHours: '{"start":"09:00","end":"17:00","daysOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"]}',
      },
      assets: [{
        asset: {
          assetTag: 'LAP-001',
          assetType: 'laptop',
          manufacturer: 'Dell',
          model: 'Latitude 7420',
          serialNumber: 'DL7420-12345',
          operatingSystem: 'Windows 11',
          osVersion: '22H2',
          purchaseDate: new Date('2023-01-01'),
          warrantyExpiration: new Date('2026-01-01'),
          assignedUser: 'user-1',
          location: 'Office A',
          specifications: '{"cpu":"Intel i7","ram":"16GB","storage":"512GB SSD"}',
          installedSoftware: '[{"name":"Office 365","version":"16.0"}]',
          lastMaintenanceDate: null,
          maintenanceSchedule: null,
        },
      }],
      assignedUser: null,
      creator: {
        id: 'user-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@company.com',
      },
      history: [],
      updates: [],
      escalations: [],
    };

    it('should create a ticket successfully', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          ticket: {
            create: jest.fn().mockResolvedValue(mockDbTicket),
          },
          ticketHistory: {
            create: jest.fn().mockResolvedValue({}),
          },
          ticketAsset: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await ticketRepository.create(mockTicketData, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('ticket-1');
      expect(result.title).toBe('Test Ticket');
      expect(result.category).toBe(TicketCategory.SOFTWARE);
      expect(result.priority).toBe(TicketPriority.MEDIUM);
      expect(result.status).toBe(TicketStatus.OPEN);
    });

    it('should generate unique ticket numbers', async () => {
      mockPrisma.ticket.count.mockResolvedValue(5);
      
      const ticketNumber = await (ticketRepository as any).generateTicketNumber();
      
      expect(ticketNumber).toMatch(/^TK-\d{6}-\d{4}$/);
    });

    it('should associate assets when provided', async () => {
      const mockTransaction = {
        ticket: { create: jest.fn().mockResolvedValue(mockDbTicket) },
        ticketHistory: { create: jest.fn().mockResolvedValue({}) },
        ticketAsset: { create: jest.fn().mockResolvedValue({}) },
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      await ticketRepository.create(mockTicketData, 'user-1');

      expect(mockTransaction.ticketAsset.create).toHaveBeenCalledWith({
        data: {
          ticketId: 'ticket-1',
          assetId: 'asset-1',
        },
      });
    });

    it('should handle creation errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(
        ticketRepository.create(mockTicketData, 'user-1')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should retrieve ticket by ID', async () => {
      const mockDbTicket = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test Description',
        category: 'software',
        priority: 'medium',
        status: 'open',
        customer: {
          id: 'customer-1',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          email: 'john.doe@company.com',
          workingHours: '{}',
        },
        assets: [],
        assignedUser: null,
        creator: {
          id: 'user-1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@company.com',
        },
        scenario: null,
        template: null,
        history: [],
        updates: [],
        escalations: [],
        slaResponseTimeMinutes: 60,
        slaResolutionTimeHours: 24,
        slaEscalationTimeHours: 8,
        actualResponseTime: null,
        actualResolutionTime: null,
        slaBreached: false,
        breachReason: null,
        escalationLevel: 0,
        resolution: null,
        metadata: '{}',
        scenarioId: null,
        templateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        closedAt: null,
      };

      mockPrisma.ticket.findUnique.mockResolvedValue(mockDbTicket);

      const result = await ticketRepository.getById('ticket-1');

      expect(result).toBeDefined();
      expect(result!.id).toBe('ticket-1');
      expect(result!.title).toBe('Test Ticket');
    });

    it('should return null for non-existent ticket', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(null);

      const result = await ticketRepository.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateData: UpdateTicketData = {
      title: 'Updated Ticket',
      status: TicketStatus.IN_PROGRESS,
      assignedTo: 'user-2',
    };

    it('should update ticket successfully', async () => {
      const currentTicket = {
        id: 'ticket-1',
        title: 'Original Title',
        status: 'open',
        assignedTo: null,
      };

      const updatedTicket = {
        ...currentTicket,
        title: 'Updated Ticket',
        status: 'in_progress',
        assignedTo: 'user-2',
        customer: { workingHours: '{}' },
        assets: [],
        assignedUser: null,
        creator: { id: 'user-1', firstName: 'Admin', lastName: 'User', email: 'admin@company.com' },
        history: [],
        updates: [],
        slaResponseTimeMinutes: 60,
        slaResolutionTimeHours: 24,
        slaEscalationTimeHours: 8,
        actualResponseTime: null,
        actualResolutionTime: null,
        slaBreached: false,
        breachReason: null,
        escalationLevel: 0,
        resolution: null,
        metadata: '{}',
        scenarioId: null,
        templateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        closedAt: null,
      };

      const mockTransaction = {
        ticket: {
          findUnique: jest.fn().mockResolvedValue(currentTicket),
          update: jest.fn().mockResolvedValue(updatedTicket),
        },
        ticketHistory: { create: jest.fn().mockResolvedValue({}) },
        ticketUpdate: { create: jest.fn().mockResolvedValue({}) },
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      const result = await ticketRepository.update('ticket-1', updateData, 'user-1');

      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Ticket');
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should throw error for non-existent ticket', async () => {
      const mockTransaction = {
        ticket: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      await expect(
        ticketRepository.update('non-existent', updateData, 'user-1')
      ).rejects.toThrow('Ticket with ID non-existent not found');
    });
  });

  describe('search', () => {
    const searchOptions: TicketSearchOptions = {
      query: 'test',
      category: TicketCategory.SOFTWARE,
      status: TicketStatus.OPEN,
      page: 1,
      limit: 10,
    };

    it('should search tickets with filters', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          title: 'Test Ticket 1',
          customer: { workingHours: '{}' },
          assets: [],
          assignedUser: null,
          creator: { id: 'user-1', firstName: 'Admin', lastName: 'User', email: 'admin@company.com' },
          _count: { history: 1, updates: 0, escalations: 0 },
          slaResponseTimeMinutes: 60,
          slaResolutionTimeHours: 24,
          slaEscalationTimeHours: 8,
          actualResponseTime: null,
          actualResolutionTime: null,
          slaBreached: false,
          breachReason: null,
          escalationLevel: 0,
          resolution: null,
          metadata: '{}',
          scenarioId: null,
          templateId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          resolvedAt: null,
          closedAt: null,
          category: 'software',
          priority: 'medium',
          status: 'open',
          description: 'Test description',
        },
      ];

      mockPrisma.ticket.count.mockResolvedValue(1);
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await ticketRepository.search(searchOptions);

      expect(result.tickets).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should handle empty search results', async () => {
      mockPrisma.ticket.count.mockResolvedValue(0);
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      const result = await ticketRepository.search(searchOptions);

      expect(result.tickets).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getHistory', () => {
    it('should retrieve ticket history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          ticketId: 'ticket-1',
          action: 'created',
          oldValue: null,
          newValue: '{"status":"open"}',
          comment: 'Ticket created',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@company.com',
          },
        },
      ];

      mockPrisma.ticketHistory.findMany.mockResolvedValue(mockHistory);

      const result = await ticketRepository.getHistory('ticket-1');

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('created');
      expect(result[0].performedBy).toBe('user-1');
    });
  });

  describe('getStatistics', () => {
    it('should calculate ticket statistics', async () => {
      // Mock all the count queries
      mockPrisma.ticket.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(30)  // open
        .mockResolvedValueOnce(25)  // in progress
        .mockResolvedValueOnce(35)  // resolved
        .mockResolvedValueOnce(5)   // escalated
        .mockResolvedValueOnce(5)   // closed
        .mockResolvedValueOnce(20)  // high priority
        .mockResolvedValueOnce(10); // sla breached

      // Mock resolved tickets for average calculation
      mockPrisma.ticket.findMany.mockResolvedValue([
        {
          createdAt: new Date('2024-01-01T09:00:00Z'),
          resolvedAt: new Date('2024-01-01T11:00:00Z'), // 2 hours
        },
        {
          createdAt: new Date('2024-01-01T10:00:00Z'),
          resolvedAt: new Date('2024-01-01T14:00:00Z'), // 4 hours
        },
      ]);

      const result = await ticketRepository.getStatistics();

      expect(result.totalTickets).toBe(100);
      expect(result.statusDistribution.open).toBe(30);
      expect(result.statusDistribution.inProgress).toBe(25);
      expect(result.statusDistribution.resolved).toBe(35);
      expect(result.slaMetrics.breachedTickets).toBe(10);
      expect(result.slaMetrics.breachRate).toBe(10);
      expect(result.performance.averageResolutionTimeHours).toBe(3); // (2+4)/2
    });
  });

  describe('Template Management', () => {
    const mockTemplateData = {
      name: 'Test Template',
      category: TicketCategory.SOFTWARE,
      priority: TicketPriority.MEDIUM,
      difficultyLevel: 'intermediate' as 'intermediate',
      titleTemplates: ['Test Title'],
      descriptionTemplates: ['Test Description'],
      customerProfiles: [],
      assetTemplates: [],
      technicalContextTemplates: [],
      learningObjectives: ['Learn something'],
      expectedResolutionSteps: ['Step 1', 'Step 2'],
      skillsRequired: ['Skill 1'],
      knowledgeBaseArticles: ['KB-001'],
      estimatedResolutionTime: 30,
      complexity: 'medium' as 'medium',
      businessImpact: 'medium' as 'medium',
      variationRules: { 
        allowTitleVariation: true,
        allowDescriptionVariation: true,
        allowCustomerVariation: true,
        allowAssetVariation: true,
        allowTechnicalVariation: true,
        maxVariations: 3,
      },
      usageCount: 0,
      successRate: 0,
      averageResolutionTime: 0,
      tags: ['test'],
      isActive: true,
      createdBy: 'user-1',
    };

    describe('createTemplate', () => {
      it('should create a template successfully', async () => {
        const mockDbTemplate = {
          id: 'template-1',
          ...mockTemplateData,
          titleTemplates: JSON.stringify(mockTemplateData.titleTemplates),
          descriptionTemplates: JSON.stringify(mockTemplateData.descriptionTemplates),
          customerProfiles: JSON.stringify(mockTemplateData.customerProfiles),
          assetTemplates: JSON.stringify(mockTemplateData.assetTemplates),
          technicalContextTemplates: JSON.stringify(mockTemplateData.technicalContextTemplates),
          learningObjectives: JSON.stringify(mockTemplateData.learningObjectives),
          expectedResolutionSteps: JSON.stringify(mockTemplateData.expectedResolutionSteps),
          skillsRequired: JSON.stringify(mockTemplateData.skillsRequired),
          knowledgeBaseArticles: JSON.stringify(mockTemplateData.knowledgeBaseArticles),
          variationRules: JSON.stringify(mockTemplateData.variationRules),
          tags: JSON.stringify(mockTemplateData.tags),
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 'user-1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@company.com',
          },
        };

        mockPrisma.ticketTemplate.create.mockResolvedValue(mockDbTemplate);

        const result = await ticketRepository.createTemplate(mockTemplateData, 'user-1');

        expect(result).toBeDefined();
        expect(result.id).toBe('template-1');
        expect(result.name).toBe('Test Template');
        expect(result.category).toBe(TicketCategory.SOFTWARE);
      });
    });

    describe('getTemplateById', () => {
      it('should retrieve template by ID', async () => {
        const mockDbTemplate = {
          id: 'template-1',
          name: 'Test Template',
          category: 'software',
          titleTemplates: '["Test Title"]',
          descriptionTemplates: '["Test Description"]',
          customerProfiles: '[]',
          assetTemplates: '[]',
          technicalContextTemplates: '[]',
          learningObjectives: '["Learn something"]',
          expectedResolutionSteps: '["Step 1", "Step 2"]',
          skillsRequired: '["Skill 1"]',
          knowledgeBaseArticles: '["KB-001"]',
          variationRules: '{"allowTitleVariation":true}',
          tags: '["test"]',
          creator: {
            id: 'user-1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@company.com',
          },
          priority: 'medium',
          difficultyLevel: 'intermediate',
          estimatedResolutionTime: 30,
          complexity: 'medium',
          businessImpact: 'medium',
          usageCount: 0,
          successRate: 0,
          averageResolutionTime: 0,
          isActive: true,
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.ticketTemplate.findUnique.mockResolvedValue(mockDbTemplate);

        const result = await ticketRepository.getTemplateById('template-1');

        expect(result).toBeDefined();
        expect(result!.id).toBe('template-1');
        expect(result!.name).toBe('Test Template');
        expect(result!.titleTemplates).toEqual(['Test Title']);
      });

      it('should return null for non-existent template', async () => {
        mockPrisma.ticketTemplate.findUnique.mockResolvedValue(null);

        const result = await ticketRepository.getTemplateById('non-existent');

        expect(result).toBeNull();
      });
    });
  });

  describe('SLA Configuration', () => {
    it('should return correct SLA for HIGH priority', () => {
      const sla = (ticketRepository as any).getSLAConfiguration(TicketPriority.HIGH);
      
      expect(sla.responseTimeMinutes).toBe(15);
      expect(sla.resolutionTimeHours).toBe(4);
      expect(sla.escalationTimeHours).toBe(2);
    });

    it('should return correct SLA for MEDIUM priority', () => {
      const sla = (ticketRepository as any).getSLAConfiguration(TicketPriority.MEDIUM);
      
      expect(sla.responseTimeMinutes).toBe(60);
      expect(sla.resolutionTimeHours).toBe(24);
      expect(sla.escalationTimeHours).toBe(8);
    });

    it('should return correct SLA for LOW priority', () => {
      const sla = (ticketRepository as any).getSLAConfiguration(TicketPriority.LOW);
      
      expect(sla.responseTimeMinutes).toBe(240);
      expect(sla.resolutionTimeHours).toBe(72);
      expect(sla.escalationTimeHours).toBe(24);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.ticket.findUnique.mockRejectedValue(new Error('Connection failed'));

      await expect(
        ticketRepository.getById('ticket-1')
      ).rejects.toThrow('Connection failed');
    });

    it('should handle invalid data errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Invalid data'));

      const invalidTicketData = {
        ...{
          title: 'Test',
          description: 'Test',
          category: TicketCategory.SOFTWARE,
          priority: TicketPriority.MEDIUM,
          customerId: 'customer-1',
        },
        customerId: null, // Invalid
      } as any;

      await expect(
        ticketRepository.create(invalidTicketData, 'user-1')
      ).rejects.toThrow('Invalid data');
    });
  });
});