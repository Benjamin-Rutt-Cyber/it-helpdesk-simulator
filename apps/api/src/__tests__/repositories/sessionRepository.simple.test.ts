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

      expect(result.id).toBe('session-789');
      expect(result.chatHistory).toEqual([]);
      expect(result.performanceData).toEqual({});
    });
  });
});