import { PrismaClient } from '@prisma/client';
import { ScenarioRepository } from '../../repositories/scenarioRepository';

// Mock the entire module and create a mock prisma instance
const mockPrisma = {
  scenario: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('ScenarioRepository', () => {
  let scenarioRepository: ScenarioRepository;

  beforeEach(() => {
    scenarioRepository = new ScenarioRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should find all active scenarios', async () => {
      const mockScenarios = [
        {
          id: 'scenario-1',
          title: 'Password Reset',
          description: 'Help user reset password',
          difficulty: 'starter',
          estimatedTime: 300,
          xpReward: 100,
          ticketTemplate: {},
          customerPersona: {},
          knowledgeBaseEntries: [],
          assessmentCriteria: {},
          prerequisites: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'scenario-2',
          title: 'Software Installation',
          description: 'Help user install software',
          difficulty: 'intermediate',
          estimatedTime: 600,
          xpReward: 200,
          ticketTemplate: {},
          customerPersona: {},
          knowledgeBaseEntries: [],
          assessmentCriteria: {},
          prerequisites: ['scenario-1'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.scenario.findMany.mockResolvedValue(mockScenarios);

      const result = await scenarioRepository.findAll();

      expect(mockPrisma.scenario.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      expect(result).toEqual(mockScenarios);
    });
  });

  describe('findByDifficulty', () => {
    it('should find scenarios by difficulty level', async () => {
      const difficulty = 'starter';
      const mockScenarios = [
        {
          id: 'scenario-1',
          title: 'Password Reset',
          description: 'Help user reset password',
          difficulty: 'starter',
          estimatedTime: 300,
          xpReward: 100,
          ticketTemplate: {},
          customerPersona: {},
          knowledgeBaseEntries: [],
          assessmentCriteria: {},
          prerequisites: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.scenario.findMany.mockResolvedValue(mockScenarios);

      const result = await scenarioRepository.findByDifficulty(difficulty as any);

      expect(mockPrisma.scenario.findMany).toHaveBeenCalledWith({
        where: { 
          difficulty,
          isActive: true 
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(result).toEqual(mockScenarios);
    });
  });

  describe('findById', () => {
    it('should find scenario by id', async () => {
      const scenarioId = 'scenario-1';
      const mockScenario = {
        id: scenarioId,
        title: 'Password Reset',
        description: 'Help user reset password',
        difficulty: 'starter',
        estimatedTime: 300,
        xpReward: 100,
        ticketTemplate: {},
        customerPersona: {},
        knowledgeBaseEntries: [],
        assessmentCriteria: {},
        prerequisites: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.scenario.findUnique.mockResolvedValue(mockScenario);

      const result = await scenarioRepository.findById(scenarioId);

      expect(mockPrisma.scenario.findUnique).toHaveBeenCalledWith({
        where: { id: scenarioId },
      });

      expect(result).toEqual(mockScenario);
    });

    it('should return null when scenario not found', async () => {
      const scenarioId = 'nonexistent-scenario';

      (mockPrisma.scenario.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await scenarioRepository.findById(scenarioId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new scenario', async () => {
      const scenarioData = {
        title: 'New Scenario',
        description: 'A new test scenario',
        difficulty: 'intermediate' as const,
        estimatedTime: 600,
        xpReward: 200,
        ticketTemplate: { subject: 'Test ticket' },
        customerPersona: { name: 'Test Customer' },
        knowledgeBaseEntries: [],
        assessmentCriteria: { technical: 0.5 },
        prerequisites: [],
        isActive: true,
      };

      const mockScenario = {
        id: 'scenario-new',
        ...scenarioData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.scenario.create.mockResolvedValue(mockScenario);

      const result = await scenarioRepository.create(scenarioData);

      expect(mockPrisma.scenario.create).toHaveBeenCalledWith({
        data: {
          title: scenarioData.title,
          description: scenarioData.description,
          difficulty: scenarioData.difficulty,
          estimatedTime: scenarioData.estimatedTime,
          xpReward: scenarioData.xpReward,
          ticketTemplate: scenarioData.ticketTemplate,
          customerPersona: scenarioData.customerPersona,
          knowledgeBaseEntries: scenarioData.knowledgeBaseEntries,
          assessmentCriteria: scenarioData.assessmentCriteria,
          prerequisites: scenarioData.prerequisites,
          isActive: scenarioData.isActive,
        },
      });

      expect(result).toEqual(mockScenario);
    });
  });

  describe('update', () => {
    it('should update scenario', async () => {
      const scenarioId = 'scenario-1';
      const updateData = {
        title: 'Updated Scenario',
        xpReward: 300,
      };

      const mockScenario = {
        id: scenarioId,
        title: updateData.title,
        description: 'Help user reset password',
        difficulty: 'starter',
        estimatedTime: 300,
        xpReward: updateData.xpReward,
        ticketTemplate: {},
        customerPersona: {},
        knowledgeBaseEntries: [],
        assessmentCriteria: {},
        prerequisites: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.scenario.update.mockResolvedValue(mockScenario);

      const result = await scenarioRepository.update(scenarioId, updateData);

      expect(mockPrisma.scenario.update).toHaveBeenCalledWith({
        where: { id: scenarioId },
        data: {
          title: updateData.title,
          xpReward: updateData.xpReward,
        },
      });

      expect(result).toEqual(mockScenario);
    });
  });

  describe('delete', () => {
    it('should soft delete scenario by setting isActive to false', async () => {
      const scenarioId = 'scenario-1';

      mockPrisma.scenario.update.mockResolvedValue({});

      await scenarioRepository.delete(scenarioId);

      expect(mockPrisma.scenario.update).toHaveBeenCalledWith({
        where: { id: scenarioId },
        data: { isActive: false },
      });
    });
  });
});