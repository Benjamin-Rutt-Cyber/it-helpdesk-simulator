// Mock the entire module and create a mock prisma instance
const mockPrisma = {
  userSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  chatMessage: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

import { PrismaClient } from '@prisma/client';
import { SessionRepository } from '../../repositories/sessionRepository';

describe('SessionRepository', () => {
  let sessionRepository: SessionRepository;

  beforeEach(() => {
    sessionRepository = new SessionRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new session successfully', async () => {
      const mockSessionData = {
        userId: 'user-123',
        scenarioId: 'scenario-456',
      };

      const mockCreatedSession = {
        id: 'session-789',
        userId: 'user-123',
        scenarioId: 'scenario-456',
        status: 'active',
        startedAt: new Date(),
        completedAt: null,
        chatHistory: '[]',
        performanceData: '{}',
        verificationStatus: '{}',
        resolutionData: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.create.mockResolvedValue(mockCreatedSession);

      const result = await sessionRepository.create(mockSessionData);

      expect(mockPrisma.userSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          scenarioId: 'scenario-456',
          status: 'active',
          chatHistory: '[]',
          performanceData: '{}',
          verificationStatus: '{}',
          resolutionData: '{}',
        },
      });

      expect(result).toEqual({
        id: 'session-789',
        userId: 'user-123',
        scenarioId: 'scenario-456',
        status: 'active',
        startedAt: mockCreatedSession.startedAt,
        completedAt: null,
        chatHistory: [],
        performanceData: {},
        verificationStatus: {},
        resolutionData: {},
        createdAt: mockCreatedSession.createdAt,
        updatedAt: mockCreatedSession.updatedAt,
      });
    });

    it('should handle database errors during creation', async () => {
      const mockSessionData = {
        userId: 'user-123',
        scenarioId: 'scenario-456',
      };

      mockPrisma.userSession.create.mockRejectedValue(new Error('Database error'));

      await expect(sessionRepository.create(mockSessionData)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find a session by ID successfully', async () => {
      const sessionId = 'session-123';
      const mockSession = {
        id: sessionId,
        userId: 'user-123',
        scenarioId: 'scenario-456',
        status: 'active',
        startedAt: new Date(),
        completedAt: null,
        chatHistory: [],
        performanceData: {},
        verificationStatus: {},
        resolutionData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.findUnique.mockResolvedValue(mockSession);

      const result = await sessionRepository.findById(sessionId);

      expect(mockPrisma.userSession.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        include: {
          user: true,
          scenario: true,
          chatMessages: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      expect(result).toEqual(mockSession);
    });

    it('should return null when session not found', async () => {
      const sessionId = 'nonexistent-session';

      mockPrisma.userSession.findUnique.mockResolvedValue(null);

      const result = await sessionRepository.findById(sessionId);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find sessions by user ID', async () => {
      const userId = 'user-123';
      const mockSessions = [
        {
          id: 'session-1',
          userId: userId,
          scenarioId: 'scenario-456',
          status: 'active',
          startedAt: new Date(),
          completedAt: null,
          chatHistory: [],
          performanceData: {},
          verificationStatus: {},
          resolutionData: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'session-2',
          userId: userId,
          scenarioId: 'scenario-789',
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          chatHistory: [],
          performanceData: {},
          verificationStatus: {},
          resolutionData: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockSessions);

      const result = await sessionRepository.findByUserId(userId);

      expect(mockPrisma.userSession.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          scenario: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockSessions);
    });

    it('should return empty array when no sessions found', async () => {
      const userId = 'user-with-no-sessions';

      mockPrisma.userSession.findMany.mockResolvedValue([]);

      const result = await sessionRepository.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findActiveByUserId', () => {
    it('should find active sessions by user ID', async () => {
      const userId = 'user-123';
      const mockActiveSessions = [
        {
          id: 'session-1',
          userId: userId,
          scenarioId: 'scenario-456',
          status: 'active',
          startedAt: new Date(),
          completedAt: null,
          chatHistory: [],
          performanceData: {},
          verificationStatus: {},
          resolutionData: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockActiveSessions);

      const result = await sessionRepository.findActiveByUserId(userId);

      expect(mockPrisma.userSession.findMany).toHaveBeenCalledWith({
        where: { 
          userId,
          status: 'active'
        },
        include: {
          scenario: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockActiveSessions);
    });
  });

  describe('findCompletedSessionsByUser', () => {
    it('should find completed sessions by user ID', async () => {
      const userId = 'user-123';
      const mockCompletedSessions = [
        {
          id: 'session-1',
          userId: userId,
          scenarioId: 'scenario-456',
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          chatHistory: [],
          performanceData: {},
          verificationStatus: {},
          resolutionData: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockCompletedSessions);

      const result = await sessionRepository.findCompletedSessionsByUser(userId);

      expect(mockPrisma.userSession.findMany).toHaveBeenCalledWith({
        where: { 
          userId,
          status: 'completed'
        },
        include: {
          scenario: true,
        },
        orderBy: { completedAt: 'desc' },
      });

      expect(result).toEqual(mockCompletedSessions);
    });
  });

  describe('findActiveSessionsByUser', () => {
    it('should find active sessions by user ID', async () => {
      const userId = 'user-123';
      const mockActiveSessions = [
        {
          id: 'session-1',
          userId: userId,
          scenarioId: 'scenario-456',
          status: 'active',
          startedAt: new Date(),
          completedAt: null,
          chatHistory: [],
          performanceData: {},
          verificationStatus: {},
          resolutionData: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockActiveSessions);

      const result = await sessionRepository.findActiveSessionsByUser(userId);

      expect(mockPrisma.userSession.findMany).toHaveBeenCalledWith({
        where: { 
          userId,
          status: 'active'
        },
        include: {
          scenario: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockActiveSessions);
    });
  });

  describe('findActiveSessionByUserAndScenario', () => {
    it('should find active session by user and scenario', async () => {
      const userId = 'user-123';
      const scenarioId = 'scenario-456';
      const mockSession = {
        id: 'session-1',
        userId: userId,
        scenarioId: scenarioId,
        status: 'active',
        startedAt: new Date(),
        completedAt: null,
        chatHistory: [],
        performanceData: {},
        verificationStatus: {},
        resolutionData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.findFirst.mockResolvedValue(mockSession);

      const result = await sessionRepository.findActiveSessionByUserAndScenario(userId, scenarioId);

      expect(mockPrisma.userSession.findFirst).toHaveBeenCalledWith({
        where: { 
          userId,
          scenarioId,
          status: 'active'
        },
        include: {
          scenario: true,
        },
      });

      expect(result).toEqual(mockSession);
    });

    it('should return null when no active session found', async () => {
      const userId = 'user-123';
      const scenarioId = 'scenario-456';

      mockPrisma.userSession.findFirst.mockResolvedValue(null);

      const result = await sessionRepository.findActiveSessionByUserAndScenario(userId, scenarioId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a session successfully', async () => {
      const sessionId = 'session-123';
      const updateData = {
        status: 'completed' as const,
        completedAt: new Date(),
      };

      const mockUpdatedSession = {
        id: sessionId,
        userId: 'user-123',
        scenarioId: 'scenario-456',
        status: 'completed',
        startedAt: new Date(),
        completedAt: updateData.completedAt,
        chatHistory: [],
        performanceData: {},
        verificationStatus: {},
        resolutionData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.update.mockResolvedValue(mockUpdatedSession);

      const result = await sessionRepository.update(sessionId, updateData);

      expect(mockPrisma.userSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: updateData.completedAt,
        },
      });

      expect(result).toEqual(mockUpdatedSession);
    });
  });

  describe('createMessage', () => {
    it('should create a chat message successfully', async () => {
      const sessionId = 'session-123';
      const userId = 'user-123';
      const messageData = {
        content: 'Hello, I need help with my computer',
        type: 'text',
        senderType: 'user',
        metadata: {},
      };

      const mockCreatedMessage = {
        id: 'message-456',
        sessionId: sessionId,
        userId: userId,
        senderType: 'user',
        messageContent: 'Hello, I need help with my computer',
        messageType: 'text',
        metadata: {},
        timestamp: new Date(),
      };

      mockPrisma.chatMessage.create.mockResolvedValue(mockCreatedMessage);

      await sessionRepository.createMessage(sessionId, userId, messageData);

      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
        data: {
          sessionId: sessionId,
          userId: userId,
          senderType: 'user',
          messageContent: 'Hello, I need help with my computer',
          messageType: 'text',
          metadata: {},
        },
      });
    });
  });

  describe('findMessagesBySession', () => {
    it('should find messages by session ID', async () => {
      const sessionId = 'session-123';
      const mockMessages = [
        {
          id: 'message-1',
          sessionId: sessionId,
          userId: 'user-123',
          senderType: 'user',
          messageContent: 'Hello, I need help',
          messageType: 'text',
          metadata: {},
          timestamp: new Date(),
        },
        {
          id: 'message-2',
          sessionId: sessionId,
          userId: 'user-123',
          senderType: 'system',
          messageContent: 'How can I assist you?',
          messageType: 'text',
          metadata: {},
          timestamp: new Date(),
        },
      ];

      mockPrisma.chatMessage.findMany.mockResolvedValue(mockMessages);

      const result = await sessionRepository.findMessagesBySession(sessionId);

      expect(mockPrisma.chatMessage.findMany).toHaveBeenCalledWith({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'message-1',
        senderType: 'user',
        content: 'Hello, I need help',
        type: 'text',
        metadata: {},
        timestamp: mockMessages[0].timestamp,
      });
    });
  });

  describe('completeSession', () => {
    it('should complete a session successfully', async () => {
      const sessionId = 'session-123';
      const resolutionData = {
        resolved: true,
        solution: 'Restarted the computer',
        customerSatisfaction: 5,
      };

      const mockCompletedSession = {
        id: sessionId,
        userId: 'user-123',
        scenarioId: 'scenario-456',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        chatHistory: [],
        performanceData: {},
        verificationStatus: {},
        resolutionData: resolutionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.update.mockResolvedValue(mockCompletedSession);

      const result = await sessionRepository.completeSession(sessionId, resolutionData);

      expect(mockPrisma.userSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: expect.any(Date),
          resolutionData: JSON.stringify(resolutionData),
        },
      });

      expect(result).toEqual(mockCompletedSession);
    });
  });

  describe('abandonSession', () => {
    it('should abandon a session successfully', async () => {
      const sessionId = 'session-123';

      const mockAbandonedSession = {
        id: sessionId,
        userId: 'user-123',
        scenarioId: 'scenario-456',
        status: 'abandoned',
        startedAt: new Date(),
        completedAt: new Date(),
        chatHistory: [],
        performanceData: {},
        verificationStatus: {},
        resolutionData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.update.mockResolvedValue(mockAbandonedSession);

      const result = await sessionRepository.abandonSession(sessionId);

      expect(mockPrisma.userSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          status: 'abandoned',
          completedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockAbandonedSession);
    });
  });
});