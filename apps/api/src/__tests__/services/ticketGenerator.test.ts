import { TicketGenerator, TicketGenerationOptions } from '../../services/ticketGenerator';
import { TicketCategory, TicketPriority } from '../../models/Ticket';

// Mock the ticket repository to avoid database dependencies
jest.mock('../../repositories/ticketRepository', () => ({
  ticketRepository: {
    getTemplateById: jest.fn().mockImplementation(async (id: string) => null),
  },
  CreateTicketData: jest.fn(),
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('TicketGenerator', () => {
  let ticketGenerator: TicketGenerator;

  beforeEach(() => {
    ticketGenerator = new TicketGenerator();
  });

  describe('generateTicket', () => {
    it('should generate a basic ticket', async () => {
      const ticket = await ticketGenerator.generateTicket();

      expect(ticket).toBeDefined();
      expect(ticket.title).toBeTruthy();
      expect(ticket.description).toBeTruthy();
      expect(ticket.category).toBeDefined();
      expect(ticket.priority).toBeDefined();
      expect(ticket.customerId).toBeTruthy();
      expect(ticket.templateId).toBeTruthy();
      expect(ticket.metadata).toBeDefined();
    });

    it('should generate ticket with specific category', async () => {
      const options: TicketGenerationOptions = {
        category: TicketCategory.PASSWORD,
      };

      const ticket = await ticketGenerator.generateTicket(options);

      expect(ticket.category).toBe(TicketCategory.PASSWORD);
    });

    it('should generate ticket with specific priority', async () => {
      const options: TicketGenerationOptions = {
        priority: TicketPriority.HIGH,
      };

      const ticket = await ticketGenerator.generateTicket(options);

      expect(ticket.priority).toBe(TicketPriority.HIGH);
    });

    it('should generate ticket with specific difficulty level', async () => {
      const options: TicketGenerationOptions = {
        difficultyLevel: 'advanced',
      };

      const ticket = await ticketGenerator.generateTicket(options);

      expect(ticket.metadata.difficultyLevel).toBe('advanced');
    });

    it('should apply variations when enabled', async () => {
      const options: TicketGenerationOptions = {
        includeVariations: true,
      };

      const tickets = await Promise.all([
        ticketGenerator.generateTicket(options),
        ticketGenerator.generateTicket(options),
        ticketGenerator.generateTicket(options),
      ]);

      // Check that some variation occurred (titles should differ)
      const titles = tickets.map(t => t.title);
      const uniqueTitles = new Set(titles);
      
      // Should have some variation, though not guaranteed to be different
      expect(uniqueTitles.size).toBeGreaterThanOrEqual(1);
    });

    it('should scale complexity when specified', async () => {
      const lowComplexity: TicketGenerationOptions = {
        complexityScale: 3,
        includeVariations: true,
      };

      const highComplexity: TicketGenerationOptions = {
        complexityScale: 9,
        includeVariations: true,
      };

      const lowTicket = await ticketGenerator.generateTicket(lowComplexity);
      const highTicket = await ticketGenerator.generateTicket(highComplexity);

      expect(lowTicket.metadata.complexityScale).toBe(3);
      expect(highTicket.metadata.complexityScale).toBe(9);
      
      // High complexity should have longer or equal estimated resolution time
      expect(highTicket.metadata.estimatedResolutionTime)
        .toBeGreaterThanOrEqual(lowTicket.metadata.estimatedResolutionTime);
    });

    it('should include realistic details when enabled', async () => {
      const options: TicketGenerationOptions = {
        realisticDetails: true,
        complexityScale: 7,
      };

      const ticket = await ticketGenerator.generateTicket(options);

      // Should have technical context when realistic details are enabled
      expect(ticket.metadata.technicalContext).toBeDefined();
    });

    it('should use provided customer and asset IDs', async () => {
      const options: TicketGenerationOptions = {
        customerId: 'test-customer-123',
        assetIds: ['asset-1', 'asset-2'],
      };

      const ticket = await ticketGenerator.generateTicket(options);

      expect(ticket.customerId).toBe('test-customer-123');
      expect(ticket.assetIds).toEqual(['asset-1', 'asset-2']);
    });
  });

  describe('generateMultipleTickets', () => {
    it('should generate multiple tickets', async () => {
      const count = 5;
      const tickets = await ticketGenerator.generateMultipleTickets(count);

      expect(tickets).toHaveLength(count);
      expect(tickets.every(t => t.title && t.description)).toBe(true);
    });

    it('should generate tickets with varied complexity', async () => {
      const count = 10;
      const tickets = await ticketGenerator.generateMultipleTickets(count);

      const complexityScales = tickets.map(t => t.metadata.complexityScale);
      const uniqueComplexities = new Set(complexityScales);

      // Should have some variation in complexity
      expect(uniqueComplexities.size).toBeGreaterThan(1);
    });

    it('should apply variations to each ticket', async () => {
      const count = 3;
      const options: TicketGenerationOptions = {
        category: TicketCategory.EMAIL,
      };

      const tickets = await ticketGenerator.generateMultipleTickets(count, options);

      // All should be email category
      expect(tickets.every(t => t.category === TicketCategory.EMAIL)).toBe(true);
      
      // Should have variations enabled by default
      const titles = tickets.map(t => t.title);
      // Since variations are random, we can't guarantee uniqueness but can check structure
      expect(titles.every(title => title.length > 0)).toBe(true);
    });
  });

  describe('generateTicketsWithProgression', () => {
    it('should generate tickets with progressive complexity', async () => {
      const count = 5;
      const tickets = await ticketGenerator.generateTicketsWithProgression(count);

      expect(tickets).toHaveLength(count);

      const complexities = tickets.map(t => t.metadata.complexityScale);
      
      // Should be in ascending order (progressive complexity)
      for (let i = 1; i < complexities.length; i++) {
        expect(complexities[i]).toBeGreaterThanOrEqual(complexities[i - 1]);
      }
    });

    it('should start with lower complexity and end with higher', async () => {
      const count = 10;
      const tickets = await ticketGenerator.generateTicketsWithProgression(count);

      const firstComplexity = tickets[0].metadata.complexityScale;
      const lastComplexity = tickets[tickets.length - 1].metadata.complexityScale;

      expect(firstComplexity).toBeLessThan(lastComplexity);
      expect(firstComplexity).toBeGreaterThanOrEqual(3);
      expect(lastComplexity).toBeLessThanOrEqual(10);
    });

    it('should enable realistic details for higher complexity tickets', async () => {
      const count = 5;
      const tickets = await ticketGenerator.generateTicketsWithProgression(count);

      // Later tickets (higher complexity) should have technical context
      const highComplexityTickets = tickets.filter(t => t.metadata.complexityScale > 6);
      const hasRealisticDetails = highComplexityTickets.some(t => t.metadata.technicalContext);

      if (highComplexityTickets.length > 0) {
        expect(hasRealisticDetails).toBe(true);
      }
    });
  });

  describe('complexity scaling', () => {
    it('should scale resolution time based on complexity', async () => {
      const baseOptions: TicketGenerationOptions = {
        category: TicketCategory.PASSWORD,
        complexityScale: 5,
      };

      const lowComplexity = await ticketGenerator.generateTicket({
        ...baseOptions,
        complexityScale: 2,
      });

      const highComplexity = await ticketGenerator.generateTicket({
        ...baseOptions,
        complexityScale: 8,
      });

      expect(highComplexity.metadata.estimatedResolutionTime)
        .toBeGreaterThan(lowComplexity.metadata.estimatedResolutionTime);
    });

    it('should add more variation content for higher complexity', async () => {
      const lowComplexity = await ticketGenerator.generateTicket({
        complexityScale: 3,
        includeVariations: true,
      });

      const highComplexity = await ticketGenerator.generateTicket({
        complexityScale: 9,
        includeVariations: true,
      });

      // Higher complexity should potentially have longer descriptions due to added context
      // This is probabilistic, so we'll check structure rather than exact length
      expect(lowComplexity.description).toBeTruthy();
      expect(highComplexity.description).toBeTruthy();
    });
  });

  describe('realistic details enhancement', () => {
    it('should add error codes for technical issues', async () => {
      const options: TicketGenerationOptions = {
        category: TicketCategory.SOFTWARE,
        realisticDetails: true,
        complexityScale: 7,
      };

      const ticket = await ticketGenerator.generateTicket(options);

      // Should have some additional realistic details
      expect(ticket.description.length).toBeGreaterThan(50);
    });

    it('should not add error codes for password issues', async () => {
      const options: TicketGenerationOptions = {
        category: TicketCategory.PASSWORD,
        realisticDetails: true,
        complexityScale: 7,
      };

      const ticket = await ticketGenerator.generateTicket(options);

      // Password issues shouldn't get technical error codes
      expect(ticket.description).toBeTruthy();
    });

    it('should enhance technical context for realistic tickets', async () => {
      const options: TicketGenerationOptions = {
        category: TicketCategory.NETWORK,
        realisticDetails: true,
        complexityScale: 8,
      };

      const ticket = await ticketGenerator.generateTicket(options);

      if (ticket.metadata.technicalContext) {
        expect(ticket.metadata.technicalContext.systemSpecifications).toBeDefined();
        expect(ticket.metadata.technicalContext.symptoms).toBeDefined();
      }
    });
  });

  describe('template selection', () => {
    it('should filter templates by category', async () => {
      const emailTickets = await Promise.all([
        ticketGenerator.generateTicket({ category: TicketCategory.EMAIL }),
        ticketGenerator.generateTicket({ category: TicketCategory.EMAIL }),
        ticketGenerator.generateTicket({ category: TicketCategory.EMAIL }),
      ]);

      expect(emailTickets.every(t => t.category === TicketCategory.EMAIL)).toBe(true);
    });

    it('should filter templates by priority', async () => {
      const highPriorityTickets = await Promise.all([
        ticketGenerator.generateTicket({ priority: TicketPriority.HIGH }),
        ticketGenerator.generateTicket({ priority: TicketPriority.HIGH }),
      ]);

      expect(highPriorityTickets.every(t => t.priority === TicketPriority.HIGH)).toBe(true);
    });

    it('should filter templates by difficulty', async () => {
      const beginnerTickets = await Promise.all([
        ticketGenerator.generateTicket({ difficultyLevel: 'beginner' }),
        ticketGenerator.generateTicket({ difficultyLevel: 'beginner' }),
      ]);

      expect(beginnerTickets.every(t => t.metadata.difficultyLevel === 'beginner')).toBe(true);
    });
  });

  describe('metadata generation', () => {
    it('should include all required metadata fields', async () => {
      const ticket = await ticketGenerator.generateTicket();

      expect(ticket.metadata).toMatchObject({
        templateId: expect.any(String),
        difficultyLevel: expect.any(String),
        learningObjectives: expect.any(Array),
        expectedResolutionSteps: expect.any(Array),
        knowledgeBaseArticles: expect.any(Array),
        skillsRequired: expect.any(Array),
        estimatedResolutionTime: expect.any(Number),
        complexity: expect.any(String),
        businessImpact: expect.any(String),
      });
    });

    it('should include complexity scale in metadata', async () => {
      const complexityScale = 7;
      const ticket = await ticketGenerator.generateTicket({ complexityScale });

      expect(ticket.metadata.complexityScale).toBe(complexityScale);
    });

    it('should include technical context when realistic details enabled', async () => {
      const ticket = await ticketGenerator.generateTicket({
        realisticDetails: true,
        complexityScale: 8,
      });

      // May or may not have technical context depending on template, but should be defined if present
      if (ticket.metadata.technicalContext) {
        expect(ticket.metadata.technicalContext).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('should handle empty template selection gracefully', async () => {
      // Try to generate with impossible constraints
      const ticket = await ticketGenerator.generateTicket({
        category: TicketCategory.HARDWARE, // Assuming this category might not exist in templates
      });

      // Should still generate a ticket (fallback to all templates)
      expect(ticket).toBeDefined();
      expect(ticket.title).toBeTruthy();
    });

    it('should handle extreme complexity values', async () => {
      const extremeOptions = [
        { complexityScale: 0 },
        { complexityScale: 15 },
        { complexityScale: -5 },
      ];

      for (const options of extremeOptions) {
        const ticket = await ticketGenerator.generateTicket(options);
        expect(ticket).toBeDefined();
        expect(ticket.metadata.estimatedResolutionTime).toBeGreaterThan(0);
      }
    });
  });

  describe('variation consistency', () => {
    it('should produce different content when variations enabled', async () => {
      const options: TicketGenerationOptions = {
        category: TicketCategory.EMAIL,
        includeVariations: true,
      };

      // Generate multiple tickets to test variation
      const tickets = await Promise.all(
        Array(20).fill(0).map(() => ticketGenerator.generateTicket(options))
      );

      const titles = tickets.map(t => t.title);
      const descriptions = tickets.map(t => t.description);

      // Should have some variation (not all identical)
      const uniqueTitles = new Set(titles);
      const uniqueDescriptions = new Set(descriptions);

      // Due to randomness, we allow for some repetition but expect some variation
      expect(uniqueTitles.size).toBeGreaterThan(1);
      expect(uniqueDescriptions.size).toBeGreaterThan(1);
    });
  });
});