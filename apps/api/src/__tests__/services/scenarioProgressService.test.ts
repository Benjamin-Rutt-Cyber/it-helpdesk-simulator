import { ScenarioProgressService } from '../../services/scenarioProgressService';
import { ScenarioRepository } from '../../repositories/scenarioRepository';
import { SessionRepository } from '../../repositories/sessionRepository';
import { UserRepository } from '../../repositories/userRepository';
import { beforeEach, afterEach, describe, test, expect, jest } from '@jest/globals';

// Mock the dependencies
jest.mock('../../repositories/scenarioRepository');
jest.mock('../../repositories/sessionRepository');
jest.mock('../../repositories/userRepository');

const MockedScenarioRepository = ScenarioRepository as jest.MockedClass<typeof ScenarioRepository>;
const MockedSessionRepository = SessionRepository as jest.MockedClass<typeof SessionRepository>;
const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe('ScenarioProgressService', () => {
  let progressService: ScenarioProgressService;
  let mockScenarioRepository: jest.Mocked<ScenarioRepository>;
  let mockSessionRepository: jest.Mocked<SessionRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockScenarios = [
    {
      id: 'scenario-1',
      title: 'Basic Password Reset',
      description: 'Learn basic password reset procedures',
      difficulty: 'starter',
      estimatedTime: 30,
      xpReward: 50,
      prerequisites: '[]',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketTemplate: { category: 'Account Management' },
    },
    {
      id: 'scenario-2',
      title: 'Network Troubleshooting',
      description: 'Advanced network troubleshooting',
      difficulty: 'intermediate',
      estimatedTime: 60,
      xpReward: 150,
      prerequisites: '["scenario-1"]',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketTemplate: { category: 'Network' },
    },
    {
      id: 'scenario-3',
      title: 'Security Incident Response',
      description: 'Handle security incidents',
      difficulty: 'advanced',
      estimatedTime: 120,
      xpReward: 300,
      prerequisites: '["scenario-1", "scenario-2"]',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketTemplate: { category: 'Security' },
    },
  ];

  const mockSessions = [
    {
      id: 'session-1',
      userId: 'user-123',
      scenarioId: 'scenario-1',
      status: 'completed',
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T10:25:00Z'),
      finalScore: 85,
    },
  ];

  beforeEach(() => {
    progressService = new ScenarioProgressService();
    
    mockScenarioRepository = new MockedScenarioRepository() as jest.Mocked<ScenarioRepository>;
    mockSessionRepository = new MockedSessionRepository() as jest.Mocked<SessionRepository>;
    mockUserRepository = new MockedUserRepository() as jest.Mocked<UserRepository>;

    // Replace the repository instances
    (progressService as any).scenarioRepository = mockScenarioRepository;
    (progressService as any).sessionRepository = mockSessionRepository;
    (progressService as any).userRepository = mockUserRepository;

    jest.clearAllMocks();
  });

  describe('getUserProgressSummary', () => {
    test('should calculate comprehensive progress summary', async () => {
      // Setup mocks
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockScenarioRepository.findAll.mockResolvedValue(mockScenarios);
      mockSessionRepository.findAllSessionsByUser.mockResolvedValue(mockSessions);
      mockSessionRepository.findCompletedSessionsByUser.mockResolvedValue(mockSessions);
      mockScenarioRepository.count.mockResolvedValue(mockScenarios.length);

      // Mock the getScenarioProgress method
      jest.spyOn(progressService, 'getScenarioProgress')
        .mockResolvedValueOnce({
          userId: 'user-123',
          scenarioId: 'scenario-1',
          status: 'completed',
          score: 85,
          attempts: 1,
          timeSpent: 25,
          prerequisitesMet: true,
          completionDate: new Date('2025-01-01T10:25:00Z'),
        })
        .mockResolvedValueOnce({
          userId: 'user-123',
          scenarioId: 'scenario-2',
          status: 'available',
          attempts: 0,
          timeSpent: 0,
          prerequisitesMet: true,
        })
        .mockResolvedValueOnce({
          userId: 'user-123',
          scenarioId: 'scenario-3',
          status: 'locked',
          attempts: 0,
          timeSpent: 0,
          prerequisitesMet: false,
        });

      const result = await progressService.getUserProgressSummary('user-123');

      expect(result).toMatchObject({
        userId: 'user-123',
        totalScenarios: 3,
        completedScenarios: 1,
        inProgressScenarios: 0,
        availableScenarios: 1,
        lockedScenarios: 1,
        completionRate: expect.closeTo(33.33, 0.1),
        averageScore: 85,
        totalTimeSpent: 25,
      });

      expect(result.categoryProgress).toHaveProperty('Account Management');
      expect(result.difficultyProgress).toHaveProperty('starter');
      expect(result.difficultyProgress).toHaveProperty('intermediate');
      expect(result.difficultyProgress).toHaveProperty('advanced');
    });

    test('should handle user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(progressService.getUserProgressSummary('nonexistent'))
        .rejects.toThrow('User with ID nonexistent not found');
    });

    test('should handle no scenarios', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockScenarioRepository.findAll.mockResolvedValue([]);
      mockSessionRepository.findAllSessionsByUser.mockResolvedValue([]);

      const result = await progressService.getUserProgressSummary('user-123');

      expect(result.totalScenarios).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.averageScore).toBe(0);
    });
  });

  describe('getScenarioProgress', () => {
    test('should return completed scenario progress', async () => {
      const scenario = mockScenarios[0];
      const completedSession = {
        ...mockSessions[0],
        status: 'completed',
        finalScore: 90,
      };

      mockScenarioRepository.findById.mockResolvedValue(scenario);
      mockSessionRepository.findSessionsByUserAndScenario.mockResolvedValue([completedSession]);
      
      // Mock checkPrerequisites to return met
      jest.spyOn(progressService, 'checkPrerequisites').mockResolvedValue({
        scenarioId: 'scenario-1',
        isMet: true,
        missingPrerequisites: [],
        completedPrerequisites: [],
        alternativePathsAvailable: false,
      });

      const result = await progressService.getScenarioProgress('user-123', 'scenario-1');

      expect(result).toMatchObject({
        userId: 'user-123',
        scenarioId: 'scenario-1',
        status: 'completed',
        score: 90,
        attempts: 1,
        prerequisitesMet: true,
      });
    });

    test('should return locked scenario progress', async () => {
      const scenario = mockScenarios[2]; // Advanced scenario with prerequisites
      
      mockScenarioRepository.findById.mockResolvedValue(scenario);
      mockSessionRepository.findSessionsByUserAndScenario.mockResolvedValue([]);
      
      // Mock checkPrerequisites to return not met
      jest.spyOn(progressService, 'checkPrerequisites').mockResolvedValue({
        scenarioId: 'scenario-3',
        isMet: false,
        missingPrerequisites: ['scenario-1', 'scenario-2'],
        completedPrerequisites: [],
        alternativePathsAvailable: false,
      });

      const result = await progressService.getScenarioProgress('user-123', 'scenario-3');

      expect(result).toMatchObject({
        userId: 'user-123',
        scenarioId: 'scenario-3',
        status: 'locked',
        attempts: 0,
        prerequisitesMet: false,
      });
    });

    test('should handle scenario not found', async () => {
      mockScenarioRepository.findById.mockResolvedValue(null);

      await expect(progressService.getScenarioProgress('user-123', 'nonexistent'))
        .rejects.toThrow('Scenario with ID nonexistent not found');
    });
  });

  describe('checkPrerequisites', () => {
    test('should return met for scenario with no prerequisites', async () => {
      const scenario = mockScenarios[0]; // Has no prerequisites
      mockScenarioRepository.findById.mockResolvedValue(scenario);

      const result = await progressService.checkPrerequisites('user-123', 'scenario-1');

      expect(result).toMatchObject({
        scenarioId: 'scenario-1',
        isMet: true,
        missingPrerequisites: [],
        completedPrerequisites: [],
        alternativePathsAvailable: false,
      });
    });

    test('should return not met for scenario with unmet prerequisites', async () => {
      const scenario = mockScenarios[1]; // Requires scenario-1
      mockScenarioRepository.findById.mockResolvedValue(scenario);

      // Mock getScenarioProgress to return incomplete for prerequisite
      jest.spyOn(progressService, 'getScenarioProgress').mockResolvedValue({
        userId: 'user-123',
        scenarioId: 'scenario-1',
        status: 'available',
        attempts: 0,
        timeSpent: 0,
        prerequisitesMet: true,
      });

      const result = await progressService.checkPrerequisites('user-123', 'scenario-2');

      expect(result).toMatchObject({
        scenarioId: 'scenario-2',
        isMet: false,
        missingPrerequisites: ['scenario-1'],
        completedPrerequisites: [],
      });
    });

    test('should return met for scenario with completed prerequisites', async () => {
      const scenario = mockScenarios[1]; // Requires scenario-1
      mockScenarioRepository.findById.mockResolvedValue(scenario);

      // Mock getScenarioProgress to return completed for prerequisite
      jest.spyOn(progressService, 'getScenarioProgress').mockResolvedValue({
        userId: 'user-123',
        scenarioId: 'scenario-1',
        status: 'completed',
        score: 85,
        attempts: 1,
        timeSpent: 25,
        prerequisitesMet: true,
        completionDate: new Date(),
      });

      const result = await progressService.checkPrerequisites('user-123', 'scenario-2');

      expect(result).toMatchObject({
        scenarioId: 'scenario-2',
        isMet: true,
        missingPrerequisites: [],
        completedPrerequisites: ['scenario-1'],
      });
    });

    test('should handle scenario not found', async () => {
      mockScenarioRepository.findById.mockResolvedValue(null);

      await expect(progressService.checkPrerequisites('user-123', 'nonexistent'))
        .rejects.toThrow('Scenario with ID nonexistent not found');
    });
  });

  describe('getAvailableScenarios', () => {
    test('should return only available and in-progress scenarios', async () => {
      mockScenarioRepository.findAll.mockResolvedValue(mockScenarios);

      // Mock getScenarioProgress for each scenario
      jest.spyOn(progressService, 'getScenarioProgress')
        .mockResolvedValueOnce({
          userId: 'user-123',
          scenarioId: 'scenario-1',
          status: 'completed',
          score: 85,
          attempts: 1,
          timeSpent: 25,
          prerequisitesMet: true,
        })
        .mockResolvedValueOnce({
          userId: 'user-123',
          scenarioId: 'scenario-2',
          status: 'available',
          attempts: 0,
          timeSpent: 0,
          prerequisitesMet: true,
        })
        .mockResolvedValueOnce({
          userId: 'user-123',
          scenarioId: 'scenario-3',
          status: 'locked',
          attempts: 0,
          timeSpent: 0,
          prerequisitesMet: false,
        });

      const result = await progressService.getAvailableScenarios('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].scenarioId).toBe('scenario-2');
      expect(result[0].status).toBe('available');
    });

    test('should include in-progress scenarios', async () => {
      mockScenarioRepository.findAll.mockResolvedValue([mockScenarios[0]]);

      jest.spyOn(progressService, 'getScenarioProgress').mockResolvedValue({
        userId: 'user-123',
        scenarioId: 'scenario-1',
        status: 'in_progress',
        attempts: 1,
        timeSpent: 15,
        prerequisitesMet: true,
      });

      const result = await progressService.getAvailableScenarios('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('in_progress');
    });
  });

  describe('updateScenarioCompletion', () => {
    test('should call unlockDependentScenarios', async () => {
      const unlockSpy = jest.spyOn(progressService as any, 'unlockDependentScenarios')
        .mockResolvedValue(undefined);

      await progressService.updateScenarioCompletion('user-123', 'scenario-1', 85, 25);

      expect(unlockSpy).toHaveBeenCalledWith('user-123', 'scenario-1');
    });

    test('should handle errors gracefully', async () => {
      jest.spyOn(progressService as any, 'unlockDependentScenarios')
        .mockRejectedValue(new Error('Database error'));

      await expect(progressService.updateScenarioCompletion('user-123', 'scenario-1', 85, 25))
        .rejects.toThrow('Database error');
    });
  });
});