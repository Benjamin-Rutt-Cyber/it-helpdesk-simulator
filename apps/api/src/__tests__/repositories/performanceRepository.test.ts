// Mock the entire module and create a mock prisma instance
const mockPrisma = {
  performanceMetric: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    groupBy: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

import { PrismaClient } from '@prisma/client';
import { PerformanceRepository } from '../../repositories/performanceRepository';

describe('PerformanceRepository', () => {
  let performanceRepository: PerformanceRepository;

  beforeEach(() => {
    performanceRepository = new PerformanceRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new performance metric successfully', async () => {
      const mockPerformanceData = {
        userId: 'user-123',
        sessionId: 'session-456',
        scenarioId: 'scenario-789',
        verificationScore: 85.5,
        communicationScore: 90.0,
        technicalScore: 88.5,
        documentationScore: 92.0,
        responseTimeScore: 87.0,
        overallScore: 88.6,
        xpEarned: 150,
        completionTime: 1800, // 30 minutes in seconds
      };

      const mockCreatedPerformance = {
        id: 'performance-101',
        ...mockPerformanceData,
        createdAt: new Date(),
      };

      mockPrisma.performanceMetric.create.mockResolvedValue(mockCreatedPerformance);

      const result = await performanceRepository.create(mockPerformanceData);

      expect(mockPrisma.performanceMetric.create).toHaveBeenCalledWith({
        data: mockPerformanceData,
      });

      expect(result).toEqual({
        id: 'performance-101',
        userId: 'user-123',
        sessionId: 'session-456',
        scenarioId: 'scenario-789',
        verificationScore: 85.5,
        communicationScore: 90.0,
        technicalScore: 88.5,
        documentationScore: 92.0,
        responseTimeScore: 87.0,
        overallScore: 88.6,
        xpEarned: 150,
        completionTime: 1800,
        createdAt: mockCreatedPerformance.createdAt,
      });
    });

    it('should handle database errors during creation', async () => {
      const mockPerformanceData = {
        userId: 'user-123',
        sessionId: 'session-456',
        scenarioId: 'scenario-789',
        verificationScore: 85.5,
        communicationScore: 90.0,
        technicalScore: 88.5,
        documentationScore: 92.0,
        responseTimeScore: 87.0,
        overallScore: 88.6,
        xpEarned: 150,
        completionTime: 1800,
      };

      mockPrisma.performanceMetric.create.mockRejectedValue(new Error('Database error'));

      await expect(performanceRepository.create(mockPerformanceData)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find a performance metric by ID successfully', async () => {
      const performanceId = 'performance-123';
      const mockPerformance = {
        id: performanceId,
        userId: 'user-123',
        sessionId: 'session-456',
        scenarioId: 'scenario-789',
        verificationScore: 85.5,
        communicationScore: 90.0,
        technicalScore: 88.5,
        documentationScore: 92.0,
        responseTimeScore: 87.0,
        overallScore: 88.6,
        xpEarned: 150,
        completionTime: 1800,
        createdAt: new Date(),
      };

      mockPrisma.performanceMetric.findUnique.mockResolvedValue(mockPerformance);

      const result = await performanceRepository.findById(performanceId);

      expect(mockPrisma.performanceMetric.findUnique).toHaveBeenCalledWith({
        where: { id: performanceId },
        include: {
          user: true,
          session: true,
          scenario: true,
        },
      });

      expect(result).toEqual({
        id: performanceId,
        userId: 'user-123',
        sessionId: 'session-456',
        scenarioId: 'scenario-789',
        verificationScore: 85.5,
        communicationScore: 90.0,
        technicalScore: 88.5,
        documentationScore: 92.0,
        responseTimeScore: 87.0,
        overallScore: 88.6,
        xpEarned: 150,
        completionTime: 1800,
        createdAt: mockPerformance.createdAt,
      });
    });

    it('should return null when performance metric not found', async () => {
      const performanceId = 'nonexistent-performance';

      mockPrisma.performanceMetric.findUnique.mockResolvedValue(null);

      const result = await performanceRepository.findById(performanceId);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find performance metrics by user ID', async () => {
      const userId = 'user-123';
      const mockPerformances = [
        {
          id: 'performance-1',
          userId: userId,
          sessionId: 'session-1',
          scenarioId: 'scenario-1',
          verificationScore: 85.5,
          communicationScore: 90.0,
          technicalScore: 88.5,
          documentationScore: 92.0,
          responseTimeScore: 87.0,
          overallScore: 88.6,
          xpEarned: 150,
          completionTime: 1800,
          createdAt: new Date(),
        },
        {
          id: 'performance-2',
          userId: userId,
          sessionId: 'session-2',
          scenarioId: 'scenario-2',
          verificationScore: 78.0,
          communicationScore: 85.0,
          technicalScore: 82.5,
          documentationScore: 88.0,
          responseTimeScore: 80.0,
          overallScore: 82.7,
          xpEarned: 120,
          completionTime: 2100,
          createdAt: new Date(),
        },
      ];

      mockPrisma.performanceMetric.findMany.mockResolvedValue(mockPerformances);

      const result = await performanceRepository.findByUserId(userId);

      expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          scenario: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('performance-1');
      expect(result[1].id).toBe('performance-2');
    });

    it('should return empty array when no performance metrics found', async () => {
      const userId = 'user-with-no-performance';

      mockPrisma.performanceMetric.findMany.mockResolvedValue([]);

      const result = await performanceRepository.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findBySessionId', () => {
    it('should find performance metric by session ID', async () => {
      const sessionId = 'session-123';
      const mockPerformance = {
        id: 'performance-1',
        userId: 'user-123',
        sessionId: sessionId,
        scenarioId: 'scenario-1',
        verificationScore: 85.5,
        communicationScore: 90.0,
        technicalScore: 88.5,
        documentationScore: 92.0,
        responseTimeScore: 87.0,
        overallScore: 88.6,
        xpEarned: 150,
        completionTime: 1800,
        createdAt: new Date(),
      };

      mockPrisma.performanceMetric.findFirst.mockResolvedValue(mockPerformance);

      const result = await performanceRepository.findBySessionId(sessionId);

      expect(mockPrisma.performanceMetric.findFirst).toHaveBeenCalledWith({
        where: { sessionId },
        include: {
          scenario: true,
        },
      });

      expect(result).toEqual({
        id: 'performance-1',
        userId: 'user-123',
        sessionId: sessionId,
        scenarioId: 'scenario-1',
        verificationScore: 85.5,
        communicationScore: 90.0,
        technicalScore: 88.5,
        documentationScore: 92.0,
        responseTimeScore: 87.0,
        overallScore: 88.6,
        xpEarned: 150,
        completionTime: 1800,
        createdAt: mockPerformance.createdAt,
      });
    });

    it('should return null when no performance metric found for session', async () => {
      const sessionId = 'session-with-no-performance';

      mockPrisma.performanceMetric.findFirst.mockResolvedValue(null);

      const result = await performanceRepository.findBySessionId(sessionId);

      expect(result).toBeNull();
    });
  });

  describe('findByScenarioId', () => {
    it('should find performance metrics by scenario ID', async () => {
      const scenarioId = 'scenario-123';
      const mockPerformances = [
        {
          id: 'performance-1',
          userId: 'user-1',
          sessionId: 'session-1',
          scenarioId: scenarioId,
          verificationScore: 85.5,
          communicationScore: 90.0,
          technicalScore: 88.5,
          documentationScore: 92.0,
          responseTimeScore: 87.0,
          overallScore: 88.6,
          xpEarned: 150,
          completionTime: 1800,
          createdAt: new Date(),
        },
        {
          id: 'performance-2',
          userId: 'user-2',
          sessionId: 'session-2',
          scenarioId: scenarioId,
          verificationScore: 78.0,
          communicationScore: 85.0,
          technicalScore: 82.5,
          documentationScore: 88.0,
          responseTimeScore: 80.0,
          overallScore: 82.7,
          xpEarned: 120,
          completionTime: 2100,
          createdAt: new Date(),
        },
      ];

      mockPrisma.performanceMetric.findMany.mockResolvedValue(mockPerformances);

      const result = await performanceRepository.findByScenarioId(scenarioId);

      expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith({
        where: { scenarioId },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].scenarioId).toBe(scenarioId);
      expect(result[1].scenarioId).toBe(scenarioId);
    });
  });

  describe('getAnalytics', () => {
    it('should return comprehensive analytics for a user', async () => {
      const userId = 'user-123';
      const mockPerformances = [
        {
          id: 'performance-1',
          userId: userId,
          sessionId: 'session-1',
          scenarioId: 'scenario-1',
          verificationScore: 85.5,
          communicationScore: 90.0,
          technicalScore: 88.5,
          documentationScore: 92.0,
          responseTimeScore: 87.0,
          overallScore: 88.6,
          xpEarned: 150,
          completionTime: 1800,
          createdAt: new Date(),
          scenario: { difficulty: 'intermediate' },
        },
        {
          id: 'performance-2',
          userId: userId,
          sessionId: 'session-2',
          scenarioId: 'scenario-2',
          verificationScore: 78.0,
          communicationScore: 85.0,
          technicalScore: 82.5,
          documentationScore: 88.0,
          responseTimeScore: 80.0,
          overallScore: 82.7,
          xpEarned: 120,
          completionTime: 2100,
          createdAt: new Date(),
          scenario: { difficulty: 'starter' },
        },
      ];

      mockPrisma.performanceMetric.findMany.mockResolvedValue(mockPerformances);

      const result = await performanceRepository.getAnalytics(userId);

      expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          scenario: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        totalSessions: 2,
        averageScore: 85.65, // (88.6 + 82.7) / 2
        averageCompletionTime: 1950, // (1800 + 2100) / 2
        totalXpEarned: 270, // 150 + 120
        scoresByCategory: {
          verification: 81.75, // (85.5 + 78.0) / 2
          communication: 87.5, // (90.0 + 85.0) / 2
          technical: 85.5, // (88.5 + 82.5) / 2
          documentation: 90.0, // (92.0 + 88.0) / 2
          responseTime: 83.5, // (87.0 + 80.0) / 2
        },
        difficultyBreakdown: [
          {
            difficulty: 'intermediate',
            count: 1,
            averageScore: 88.6,
          },
          {
            difficulty: 'starter',
            count: 1,
            averageScore: 82.7,
          },
        ],
        recentPerformance: expect.any(Array),
      });

      expect(result.recentPerformance).toHaveLength(2);
    });

    it('should handle empty performance data', async () => {
      const userId = 'user-with-no-performance';

      mockPrisma.performanceMetric.findMany.mockResolvedValue([]);

      const result = await performanceRepository.getAnalytics(userId);

      expect(result).toEqual({
        totalSessions: 0,
        averageScore: 0,
        averageCompletionTime: 0,
        totalXpEarned: 0,
        scoresByCategory: {
          verification: 0,
          communication: 0,
          technical: 0,
          documentation: 0,
          responseTime: 0,
        },
        difficultyBreakdown: [],
        recentPerformance: [],
      });
    });
  });

  describe('getTopPerformers', () => {
    it('should return top performers with aggregated data', async () => {
      const mockTopPerformers = [
        {
          userId: 'user-1',
          _avg: {
            overallScore: 92.5,
          },
          _count: {
            id: 5,
          },
          _sum: {
            xpEarned: 750,
          },
        },
        {
          userId: 'user-2',
          _avg: {
            overallScore: 88.3,
          },
          _count: {
            id: 3,
          },
          _sum: {
            xpEarned: 450,
          },
        },
      ];

      mockPrisma.performanceMetric.groupBy.mockResolvedValue(mockTopPerformers);

      const result = await performanceRepository.getTopPerformers(10);

      expect(mockPrisma.performanceMetric.groupBy).toHaveBeenCalledWith({
        by: ['userId'],
        _avg: {
          overallScore: true,
        },
        _count: {
          id: true,
        },
        _sum: {
          xpEarned: true,
        },
        orderBy: {
          _avg: {
            overallScore: 'desc',
          },
        },
        take: 10,
      });

      expect(result).toEqual([
        {
          userId: 'user-1',
          averageScore: 92.5,
          totalSessions: 5,
          totalXpEarned: 750,
        },
        {
          userId: 'user-2',
          averageScore: 88.3,
          totalSessions: 3,
          totalXpEarned: 450,
        },
      ]);
    });
  });

  describe('getScenarioAnalytics', () => {
    it('should return scenario analytics with score distribution', async () => {
      const scenarioId = 'scenario-123';
      const mockPerformances = [
        {
          id: 'performance-1',
          userId: 'user-1',
          sessionId: 'session-1',
          scenarioId: scenarioId,
          verificationScore: 85.5,
          communicationScore: 90.0,
          technicalScore: 88.5,
          documentationScore: 92.0,
          responseTimeScore: 87.0,
          overallScore: 95.0, // excellent
          xpEarned: 150,
          completionTime: 1800,
          createdAt: new Date(),
        },
        {
          id: 'performance-2',
          userId: 'user-2',
          sessionId: 'session-2',
          scenarioId: scenarioId,
          verificationScore: 78.0,
          communicationScore: 85.0,
          technicalScore: 82.5,
          documentationScore: 88.0,
          responseTimeScore: 80.0,
          overallScore: 85.0, // good
          xpEarned: 120,
          completionTime: 2100,
          createdAt: new Date(),
        },
        {
          id: 'performance-3',
          userId: 'user-3',
          sessionId: 'session-3',
          scenarioId: scenarioId,
          verificationScore: 68.0,
          communicationScore: 75.0,
          technicalScore: 72.5,
          documentationScore: 78.0,
          responseTimeScore: 70.0,
          overallScore: 75.0, // average
          xpEarned: 90,
          completionTime: 2400,
          createdAt: new Date(),
        },
        {
          id: 'performance-4',
          userId: 'user-4',
          sessionId: 'session-4',
          scenarioId: scenarioId,
          verificationScore: 58.0,
          communicationScore: 65.0,
          technicalScore: 62.5,
          documentationScore: 68.0,
          responseTimeScore: 60.0,
          overallScore: 65.0, // poor
          xpEarned: 60,
          completionTime: 2700,
          createdAt: new Date(),
        },
      ];

      mockPrisma.performanceMetric.findMany.mockResolvedValue(mockPerformances);

      const result = await performanceRepository.getScenarioAnalytics(scenarioId);

      expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith({
        where: { scenarioId },
        include: {
          user: true,
        },
      });

      expect(result).toEqual({
        scenarioId: scenarioId,
        totalAttempts: 4,
        averageScore: 80.0, // (95 + 85 + 75 + 65) / 4
        averageCompletionTime: 2250, // (1800 + 2100 + 2400 + 2700) / 4
        scoreDistribution: {
          excellent: 1, // >= 90
          good: 1, // >= 80 and < 90
          average: 1, // >= 70 and < 80
          poor: 1, // < 70
        },
      });
    });

    it('should handle empty scenario performance data', async () => {
      const scenarioId = 'scenario-with-no-performance';

      mockPrisma.performanceMetric.findMany.mockResolvedValue([]);

      const result = await performanceRepository.getScenarioAnalytics(scenarioId);

      expect(result).toEqual({
        scenarioId: scenarioId,
        totalAttempts: 0,
        averageScore: 0,
        averageCompletionTime: 0,
        scoreDistribution: {
          excellent: 0,
          good: 0,
          average: 0,
          poor: 0,
        },
      });
    });
  });
});