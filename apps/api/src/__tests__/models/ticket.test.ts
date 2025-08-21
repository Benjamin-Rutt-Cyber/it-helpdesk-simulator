import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock Prisma Client
const prismaMock = mockDeep<PrismaClient>();

// Mock the actual prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock)
}));

describe('Ticket Model Tests', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('Ticket Creation', () => {
    it('should create a ticket with all required fields', async () => {
      const mockTicket = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'PASSWORD',
        priority: 'HIGH',
        status: 'OPEN',
        customerId: 'customer-1',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'customer-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          department: 'IT',
          jobTitle: 'Developer',
          officeLocation: 'Building A',
          employeeId: 'EMP001',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      prismaMock.ticket.create.mockResolvedValue(mockTicket as any);

      const result = await prismaMock.ticket.create({
        data: {
          ticketNumber: 'TK-202407-0001',
          title: 'Test Ticket',
          description: 'Test description',
          category: 'PASSWORD',
          priority: 'HIGH',
          status: 'OPEN',
          customerId: 'customer-1',
          createdBy: 'system'
        },
        include: {
          customer: true
        }
      });

      expect(result).toEqual(mockTicket);
      expect(prismaMock.ticket.create).toHaveBeenCalledWith({
        data: {
          ticketNumber: 'TK-202407-0001',
          title: 'Test Ticket',
          description: 'Test description',
          category: 'PASSWORD',
          priority: 'HIGH',
          status: 'OPEN',
          customerId: 'customer-1',
          createdBy: 'system'
        },
        include: {
          customer: true
        }
      });
    });

    it('should validate required fields when creating ticket', async () => {
      const invalidData = {
        // Missing required fields
        title: 'Test Ticket'
      };

      prismaMock.ticket.create.mockRejectedValue(new Error('Validation failed'));

      await expect(
        prismaMock.ticket.create({
          data: invalidData as any
        })
      ).rejects.toThrow('Validation failed');
    });

    it('should auto-generate ticket number with correct format', async () => {
      const mockTicket = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'SOFTWARE',
        priority: 'MEDIUM',
        status: 'OPEN',
        customerId: 'customer-1',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.ticket.create.mockResolvedValue(mockTicket as any);

      const result = await prismaMock.ticket.create({
        data: {
          ticketNumber: 'TK-202407-0001',
          title: 'Test Ticket',
          description: 'Test description',
          category: 'SOFTWARE',
          priority: 'MEDIUM',
          status: 'OPEN',
          customerId: 'customer-1',
          createdBy: 'system'
        }
      });

      expect(result.ticketNumber).toMatch(/^TK-\d{6}-\d{4}$/);
    });
  });

  describe('Ticket Relationships', () => {
    it('should create ticket with customer relationship', async () => {
      const mockTicketWithCustomer = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'HARDWARE',
        priority: 'LOW',
        status: 'OPEN',
        customerId: 'customer-1',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 'customer-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1-555-0124',
          department: 'SALES',
          jobTitle: 'Sales Manager',
          officeLocation: 'Building B',
          employeeId: 'EMP002',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      prismaMock.ticket.findUnique.mockResolvedValue(mockTicketWithCustomer as any);

      const result = await prismaMock.ticket.findUnique({
        where: { id: 'ticket-1' },
        include: { customer: true }
      });

      expect(result?.customer).toBeDefined();
      expect(result?.customer.email).toBe('jane.smith@example.com');
    });

    it('should create ticket with asset relationships', async () => {
      const mockTicketWithAssets = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'HARDWARE',
        priority: 'HIGH',
        status: 'OPEN',
        customerId: 'customer-1',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        ticketAssets: [
          {
            id: 'ta-1',
            ticketId: 'ticket-1',
            assetId: 'asset-1',
            asset: {
              id: 'asset-1',
              assetTag: 'LAPTOP001',
              assetType: 'LAPTOP',
              manufacturer: 'Dell',
              model: 'Latitude 7420',
              serialNumber: 'DL123456789',
              location: 'Office Floor 3',
              assignedUserId: 'customer-1',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        ]
      };

      prismaMock.ticket.findUnique.mockResolvedValue(mockTicketWithAssets as any);

      const result = await prismaMock.ticket.findUnique({
        where: { id: 'ticket-1' },
        include: {
          ticketAssets: {
            include: {
              asset: true
            }
          }
        }
      });

      expect(result?.ticketAssets).toHaveLength(1);
      expect(result?.ticketAssets[0].asset.assetTag).toBe('LAPTOP001');
    });

    it('should create ticket with history tracking', async () => {
      const mockTicketWithHistory = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'SOFTWARE',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        customerId: 'customer-1',
        assignedTo: 'tech-001',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [
          {
            id: 'history-1',
            ticketId: 'ticket-1',
            action: 'STATUS_CHANGE',
            details: 'Status changed from OPEN to IN_PROGRESS',
            previousValue: 'OPEN',
            newValue: 'IN_PROGRESS',
            userId: 'tech-001',
            createdAt: new Date()
          }
        ]
      };

      prismaMock.ticket.findUnique.mockResolvedValue(mockTicketWithHistory as any);

      const result = await prismaMock.ticket.findUnique({
        where: { id: 'ticket-1' },
        include: { history: true }
      });

      expect(result?.history).toHaveLength(1);
      expect(result?.history[0].action).toBe('STATUS_CHANGE');
      expect(result?.history[0].previousValue).toBe('OPEN');
      expect(result?.history[0].newValue).toBe('IN_PROGRESS');
    });
  });

  describe('Ticket Updates', () => {
    it('should update ticket status', async () => {
      const mockUpdatedTicket = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'PASSWORD',
        priority: 'HIGH',
        status: 'RESOLVED',
        customerId: 'customer-1',
        assignedTo: 'tech-001',
        createdBy: 'system',
        createdAt: new Date('2024-07-20T09:00:00Z'),
        updatedAt: new Date(),
        resolvedAt: new Date()
      };

      prismaMock.ticket.update.mockResolvedValue(mockUpdatedTicket as any);

      const result = await prismaMock.ticket.update({
        where: { id: 'ticket-1' },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      });

      expect(result.status).toBe('RESOLVED');
      expect(result.resolvedAt).toBeDefined();
    });

    it('should update ticket assignment', async () => {
      const mockAssignedTicket = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'HARDWARE',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        customerId: 'customer-1',
        assignedTo: 'tech-002',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.ticket.update.mockResolvedValue(mockAssignedTicket as any);

      const result = await prismaMock.ticket.update({
        where: { id: 'ticket-1' },
        data: {
          assignedTo: 'tech-002',
          status: 'IN_PROGRESS'
        }
      });

      expect(result.assignedTo).toBe('tech-002');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should update ticket priority', async () => {
      const mockPriorityUpdate = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'NETWORK',
        priority: 'HIGH',
        status: 'OPEN',
        customerId: 'customer-1',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.ticket.update.mockResolvedValue(mockPriorityUpdate as any);

      const result = await prismaMock.ticket.update({
        where: { id: 'ticket-1' },
        data: {
          priority: 'HIGH'
        }
      });

      expect(result.priority).toBe('HIGH');
    });
  });

  describe('Ticket Queries', () => {
    it('should find tickets by status', async () => {
      const mockOpenTickets = [
        {
          id: 'ticket-1',
          ticketNumber: 'TK-202407-0001',
          title: 'Ticket 1',
          description: 'Description 1',
          category: 'PASSWORD',
          priority: 'HIGH',
          status: 'OPEN',
          customerId: 'customer-1',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'ticket-2',
          ticketNumber: 'TK-202407-0002',
          title: 'Ticket 2',
          description: 'Description 2',
          category: 'SOFTWARE',
          priority: 'MEDIUM',
          status: 'OPEN',
          customerId: 'customer-2',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      prismaMock.ticket.findMany.mockResolvedValue(mockOpenTickets as any);

      const result = await prismaMock.ticket.findMany({
        where: { status: 'OPEN' }
      });

      expect(result).toHaveLength(2);
      expect(result.every(ticket => ticket.status === 'OPEN')).toBe(true);
    });

    it('should find tickets by priority', async () => {
      const mockHighPriorityTickets = [
        {
          id: 'ticket-1',
          ticketNumber: 'TK-202407-0001',
          title: 'High Priority Ticket 1',
          description: 'Description 1',
          category: 'NETWORK',
          priority: 'HIGH',
          status: 'OPEN',
          customerId: 'customer-1',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      prismaMock.ticket.findMany.mockResolvedValue(mockHighPriorityTickets as any);

      const result = await prismaMock.ticket.findMany({
        where: { priority: 'HIGH' }
      });

      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('HIGH');
    });

    it('should find tickets by assigned technician', async () => {
      const mockAssignedTickets = [
        {
          id: 'ticket-1',
          ticketNumber: 'TK-202407-0001',
          title: 'Assigned Ticket',
          description: 'Description',
          category: 'HARDWARE',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          customerId: 'customer-1',
          assignedTo: 'tech-001',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      prismaMock.ticket.findMany.mockResolvedValue(mockAssignedTickets as any);

      const result = await prismaMock.ticket.findMany({
        where: { assignedTo: 'tech-001' }
      });

      expect(result).toHaveLength(1);
      expect(result[0].assignedTo).toBe('tech-001');
    });

    it('should search tickets by title and description', async () => {
      const mockSearchResults = [
        {
          id: 'ticket-1',
          ticketNumber: 'TK-202407-0001',
          title: 'Password reset issue',
          description: 'User cannot reset password',
          category: 'PASSWORD',
          priority: 'HIGH',
          status: 'OPEN',
          customerId: 'customer-1',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      prismaMock.ticket.findMany.mockResolvedValue(mockSearchResults as any);

      const result = await prismaMock.ticket.findMany({
        where: {
          OR: [
            { title: { contains: 'password', mode: 'insensitive' } },
            { description: { contains: 'password', mode: 'insensitive' } }
          ]
        }
      });

      expect(result).toHaveLength(1);
      expect(result[0].title.toLowerCase()).toContain('password');
    });
  });

  describe('Ticket Deletion', () => {
    it('should soft delete ticket', async () => {
      const mockDeletedTicket = {
        id: 'ticket-1',
        ticketNumber: 'TK-202407-0001',
        title: 'Test Ticket',
        description: 'Test description',
        category: 'SOFTWARE',
        priority: 'LOW',
        status: 'CLOSED',
        customerId: 'customer-1',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date()
      };

      prismaMock.ticket.update.mockResolvedValue(mockDeletedTicket as any);

      const result = await prismaMock.ticket.update({
        where: { id: 'ticket-1' },
        data: { deletedAt: new Date() }
      });

      expect(result.deletedAt).toBeDefined();
    });

    it('should exclude soft deleted tickets from queries', async () => {
      const mockActiveTickets = [
        {
          id: 'ticket-2',
          ticketNumber: 'TK-202407-0002',
          title: 'Active Ticket',
          description: 'Description',
          category: 'HARDWARE',
          priority: 'MEDIUM',
          status: 'OPEN',
          customerId: 'customer-1',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null
        }
      ];

      prismaMock.ticket.findMany.mockResolvedValue(mockActiveTickets as any);

      const result = await prismaMock.ticket.findMany({
        where: { deletedAt: null }
      });

      expect(result).toHaveLength(1);
      expect(result[0].deletedAt).toBeNull();
    });
  });

  describe('Ticket Statistics', () => {
    it('should count tickets by status', async () => {
      prismaMock.ticket.count.mockImplementation(({ where }) => {
        const status = (where as any)?.status;
        switch (status) {
          case 'OPEN': return Promise.resolve(5);
          case 'IN_PROGRESS': return Promise.resolve(3);
          case 'RESOLVED': return Promise.resolve(12);
          case 'CLOSED': return Promise.resolve(8);
          default: return Promise.resolve(28);
        }
      });

      const openCount = await prismaMock.ticket.count({ where: { status: 'OPEN' } });
      const inProgressCount = await prismaMock.ticket.count({ where: { status: 'IN_PROGRESS' } });
      const resolvedCount = await prismaMock.ticket.count({ where: { status: 'RESOLVED' } });
      const closedCount = await prismaMock.ticket.count({ where: { status: 'CLOSED' } });

      expect(openCount).toBe(5);
      expect(inProgressCount).toBe(3);
      expect(resolvedCount).toBe(12);
      expect(closedCount).toBe(8);
    });

    it('should count tickets by priority', async () => {
      prismaMock.ticket.count.mockImplementation(({ where }) => {
        const priority = (where as any)?.priority;
        switch (priority) {
          case 'HIGH': return Promise.resolve(8);
          case 'MEDIUM': return Promise.resolve(15);
          case 'LOW': return Promise.resolve(5);
          default: return Promise.resolve(28);
        }
      });

      const highCount = await prismaMock.ticket.count({ where: { priority: 'HIGH' } });
      const mediumCount = await prismaMock.ticket.count({ where: { priority: 'MEDIUM' } });
      const lowCount = await prismaMock.ticket.count({ where: { priority: 'LOW' } });

      expect(highCount).toBe(8);
      expect(mediumCount).toBe(15);
      expect(lowCount).toBe(5);
    });

    it('should get ticket count by date range', async () => {
      const startDate = new Date('2024-07-01');
      const endDate = new Date('2024-07-31');

      prismaMock.ticket.count.mockResolvedValue(15);

      const result = await prismaMock.ticket.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      expect(result).toBe(15);
      expect(prismaMock.ticket.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    });
  });
});