import { SessionManager, SessionContext } from '../../services/sessionManager';
import { SessionRepository } from '../../repositories/sessionRepository';
import * as Redis from 'redis';

// Mock dependencies
jest.mock('../../repositories/sessionRepository');
jest.mock('redis');
jest.mock('../../utils/logger');

const mockSessionRepository = jest.mocked(SessionRepository);
const mockRedis = jest.mocked(Redis.createClient);

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockRedisInstance: jest.Mocked<any>;
  let mockSessionRepo: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Redis instance
    mockRedisInstance = {
      ping: jest.fn().mockResolvedValue('PONG'),
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      lpush: jest.fn().mockResolvedValue(1),
      ltrim: jest.fn().mockResolvedValue('OK'),
      lrange: jest.fn().mockResolvedValue([]),
      keys: jest.fn().mockResolvedValue([]),
      quit: jest.fn().mockResolvedValue('OK'),
    };

    mockRedis.mockReturnValue(mockRedisInstance);

    // Mock SessionRepository instance
    mockSessionRepo = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findActiveSessionByUserAndScenario: jest.fn(),
    } as any;

    mockSessionRepository.mockImplementation(() => mockSessionRepo);

    sessionManager = new SessionManager();
  });

  afterEach(async () => {
    await sessionManager.cleanup();
  });

  describe('initialize', () => {
    it('should initialize successfully when Redis is available', async () => {
      await expect(sessionManager.initialize()).resolves.not.toThrow();
      expect(mockRedisInstance.ping).toHaveBeenCalled();
    });

    it('should throw error when Redis is not available', async () => {
      mockRedisInstance.ping.mockRejectedValue(new Error('Redis connection failed'));
      
      await expect(sessionManager.initialize()).rejects.toThrow('Redis connection failed');
    });
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const userId = 'user123';
      const scenarioId = 'scenario456';
      const ticketId = 'ticket789';
      
      const mockDbSession = {
        id: 'session123',
        userId,
        scenarioId,
        status: 'created',
        startedAt: new Date(),
        chatHistory: '[]',
        performanceData: '{}',
        verificationStatus: '{}',
        resolutionData: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepo.findActiveSessionByUserAndScenario.mockResolvedValue(null);
      mockSessionRepo.create.mockResolvedValue(mockDbSession);

      const result = await sessionManager.createSession(userId, scenarioId, ticketId);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('session123');
      expect(result.userId).toBe(userId);
      expect(result.scenarioId).toBe(scenarioId);
      expect(result.ticketId).toBe(ticketId);
      expect(result.verificationStatus.customerIdentityVerified).toBe(false);
      
      expect(mockSessionRepo.create).toHaveBeenCalledWith({
        userId,
        scenarioId,
      });
      expect(mockRedisInstance.setex).toHaveBeenCalled();
    });

    it('should throw error if user already has active session for scenario', async () => {
      const userId = 'user123';
      const scenarioId = 'scenario456';
      
      const existingSession = { id: 'existing123' };
      mockSessionRepo.findActiveSessionByUserAndScenario.mockResolvedValue(existingSession as any);

      await expect(sessionManager.createSession(userId, scenarioId))
        .rejects.toThrow('User already has an active session for this scenario');
    });
  });

  describe('startSession', () => {
    it('should start an existing session successfully', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      
      const mockContext: SessionContext = {
        sessionId,
        userId,
        scenarioId: 'scenario456',
        customerPersona: 'office_worker',
        verificationStatus: {
          customerIdentityVerified: false,
          issueDocumented: false,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionProgress: {
          currentStep: 'initial_contact',
          completedSteps: [],
          nextSteps: ['gather_information'],
          estimatedTimeRemaining: 1800000,
        },
        performanceMetrics: {
          startTime: Date.now(),
          lastActivity: Date.now(),
          messageCount: 0,
          responseTimeMs: [],
          quality: {
            communicationScore: 0,
            technicalAccuracy: 0,
            completeness: 0,
            professionalism: 0,
          },
        },
        customerInfo: {
          issueDescription: '',
          urgency: 'medium',
          category: 'general',
        },
        notes: [],
        metadata: {},
      };

      // Mock Redis get to return stored context
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockContext));
      mockSessionRepo.update.mockResolvedValue({} as any);

      const result = await sessionManager.startSession(sessionId, userId);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(sessionId);
      expect(result.resolutionProgress.currentStep).toBe('active_support');
      expect(mockSessionRepo.update).toHaveBeenCalledWith(sessionId, { status: 'active' });
    });

    it('should throw error if session not found', async () => {
      const sessionId = 'nonexistent';
      const userId = 'user123';

      mockRedisInstance.get.mockResolvedValue(null);

      await expect(sessionManager.startSession(sessionId, userId))
        .rejects.toThrow('Session nonexistent not found');
    });

    it('should throw error if user unauthorized', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const wrongUserId = 'user456';
      
      const mockContext: SessionContext = {
        sessionId,
        userId,
        scenarioId: 'scenario456',
        customerPersona: 'office_worker',
        verificationStatus: {
          customerIdentityVerified: false,
          issueDocumented: false,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionProgress: {
          currentStep: 'initial_contact',
          completedSteps: [],
          nextSteps: [],
          estimatedTimeRemaining: 1800000,
        },
        performanceMetrics: {
          startTime: Date.now(),
          lastActivity: Date.now(),
          messageCount: 0,
          responseTimeMs: [],
          quality: {
            communicationScore: 0,
            technicalAccuracy: 0,
            completeness: 0,
            professionalism: 0,
          },
        },
        customerInfo: {
          issueDescription: '',
          urgency: 'medium',
          category: 'general',
        },
        notes: [],
        metadata: {},
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockContext));

      await expect(sessionManager.startSession(sessionId, wrongUserId))
        .rejects.toThrow('Unauthorized access to session');
    });
  });

  describe('pauseSession', () => {
    it('should pause an active session successfully', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const reason = 'User requested pause';
      
      const mockContext: SessionContext = {
        sessionId,
        userId,
        scenarioId: 'scenario456',
        customerPersona: 'office_worker',
        verificationStatus: {
          customerIdentityVerified: false,
          issueDocumented: false,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionProgress: {
          currentStep: 'active_support',
          completedSteps: [],
          nextSteps: [],
          estimatedTimeRemaining: 1800000,
        },
        performanceMetrics: {
          startTime: Date.now() - 10000,
          lastActivity: Date.now() - 5000,
          messageCount: 5,
          responseTimeMs: [1000, 2000, 1500],
          quality: {
            communicationScore: 0,
            technicalAccuracy: 0,
            completeness: 0,
            professionalism: 0,
          },
        },
        customerInfo: {
          issueDescription: 'Test issue',
          urgency: 'medium',
          category: 'general',
        },
        notes: [],
        metadata: {},
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockContext));
      mockSessionRepo.update.mockResolvedValue({} as any);

      const result = await sessionManager.pauseSession(sessionId, userId, reason);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(sessionId);
      expect(mockSessionRepo.update).toHaveBeenCalledWith(sessionId, { status: 'paused' });
    });
  });

  describe('completeSession', () => {
    it('should complete a session successfully', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const resolutionData = {
        resolution: 'Issue resolved successfully',
        customerSatisfied: true,
        escalated: false,
        notes: ['Follow-up needed'],
      };
      
      const mockContext: SessionContext = {
        sessionId,
        userId,
        scenarioId: 'scenario456',
        customerPersona: 'office_worker',
        verificationStatus: {
          customerIdentityVerified: true,
          issueDocumented: true,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionProgress: {
          currentStep: 'providing_resolution',
          completedSteps: ['initial_contact', 'information_gathering'],
          nextSteps: ['customer_confirmation'],
          estimatedTimeRemaining: 300000,
        },
        performanceMetrics: {
          startTime: Date.now() - 1800000, // 30 minutes ago
          lastActivity: Date.now(),
          messageCount: 15,
          responseTimeMs: [1000, 2000, 1500, 800, 1200],
          quality: {
            communicationScore: 8.5,
            technicalAccuracy: 9.0,
            completeness: 8.0,
            professionalism: 9.5,
          },
        },
        customerInfo: {
          issueDescription: 'Computer won\'t start',
          urgency: 'high',
          category: 'hardware',
        },
        notes: ['Customer reported power issue'],
        metadata: {},
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockContext));
      mockSessionRepo.update.mockResolvedValue({} as any);

      const result = await sessionManager.completeSession(sessionId, userId, resolutionData);

      expect(result).toBeDefined();
      expect(result.verificationStatus.resolutionProvided).toBe(true);
      expect(result.verificationStatus.customerSatisfied).toBe(true);
      expect(result.resolutionProgress.currentStep).toBe('completed');
      expect(result.notes).toContain('Follow-up needed');
      
      expect(mockSessionRepo.update).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Date),
          resolutionData: expect.objectContaining({
            resolution: resolutionData.resolution,
            customerSatisfied: resolutionData.customerSatisfied,
            escalated: false,
          }),
        })
      );
    });

    it('should handle escalated session completion', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const resolutionData = {
        resolution: 'Issue requires specialist attention',
        customerSatisfied: false,
        escalated: true,
      };
      
      const mockContext: SessionContext = {
        sessionId,
        userId,
        scenarioId: 'scenario456',
        customerPersona: 'frustrated_user',
        verificationStatus: {
          customerIdentityVerified: true,
          issueDocumented: true,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionProgress: {
          currentStep: 'escalation_needed',
          completedSteps: ['initial_contact', 'information_gathering', 'attempted_resolution'],
          nextSteps: [],
          estimatedTimeRemaining: 0,
        },
        performanceMetrics: {
          startTime: Date.now() - 3600000, // 1 hour ago
          lastActivity: Date.now(),
          messageCount: 25,
          responseTimeMs: [2000, 3000, 2500, 1800, 2200],
          quality: {
            communicationScore: 7.0,
            technicalAccuracy: 8.0,
            completeness: 6.5,
            professionalism: 8.5,
          },
        },
        customerInfo: {
          issueDescription: 'Complex network connectivity issue',
          urgency: 'critical',
          category: 'network',
        },
        notes: ['Multiple troubleshooting attempts failed', 'Customer becoming frustrated'],
        metadata: {},
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockContext));
      mockSessionRepo.update.mockResolvedValue({} as any);

      const result = await sessionManager.completeSession(sessionId, userId, resolutionData);

      expect(result).toBeDefined();
      expect(mockSessionRepo.update).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          status: 'escalated',
          resolutionData: expect.objectContaining({
            escalated: true,
          }),
        })
      );
    });
  });

  describe('updateVerificationStatus', () => {
    it('should update verification status successfully', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const updates = {
        customerIdentityVerified: true,
        issueDocumented: true,
      };
      
      const mockContext: SessionContext = {
        sessionId,
        userId,
        scenarioId: 'scenario456',
        customerPersona: 'office_worker',
        verificationStatus: {
          customerIdentityVerified: false,
          issueDocumented: false,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionProgress: {
          currentStep: 'information_gathering',
          completedSteps: ['initial_contact'],
          nextSteps: ['identify_issue'],
          estimatedTimeRemaining: 1500000,
        },
        performanceMetrics: {
          startTime: Date.now() - 300000, // 5 minutes ago
          lastActivity: Date.now() - 60000, // 1 minute ago
          messageCount: 8,
          responseTimeMs: [1200, 1500, 1000],
          quality: {
            communicationScore: 8.0,
            technicalAccuracy: 7.5,
            completeness: 7.0,
            professionalism: 9.0,
          },
        },
        customerInfo: {
          issueDescription: 'Email not working',
          urgency: 'medium',
          category: 'email',
        },
        notes: [],
        metadata: {},
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockContext));

      const result = await sessionManager.updateVerificationStatus(sessionId, userId, updates);

      expect(result).toBeDefined();
      expect(result.verificationStatus.customerIdentityVerified).toBe(true);
      expect(result.verificationStatus.issueDocumented).toBe(true);
      expect(result.verificationStatus.resolutionProvided).toBe(false);
      expect(result.verificationStatus.customerSatisfied).toBe(false);
    });
  });

  describe('addNote', () => {
    it('should add a note to the session successfully', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const note = 'Customer mentioned this happened before';
      
      const mockContext: SessionContext = {
        sessionId,
        userId,
        scenarioId: 'scenario456',
        customerPersona: 'patient_retiree',
        verificationStatus: {
          customerIdentityVerified: true,
          issueDocumented: false,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionProgress: {
          currentStep: 'information_gathering',
          completedSteps: ['initial_contact'],
          nextSteps: ['document_issue'],
          estimatedTimeRemaining: 1600000,
        },
        performanceMetrics: {
          startTime: Date.now() - 200000, // 3+ minutes ago
          lastActivity: Date.now() - 30000, // 30 seconds ago
          messageCount: 6,
          responseTimeMs: [1800, 2200, 1600],
          quality: {
            communicationScore: 9.0,
            technicalAccuracy: 7.0,
            completeness: 7.5,
            professionalism: 9.5,
          },
        },
        customerInfo: {
          name: 'Mrs. Johnson',
          issueDescription: 'Printer not connecting to computer',
          urgency: 'low',
          category: 'printer',
        },
        notes: ['Customer is very patient and polite'],
        metadata: {},
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockContext));

      const result = await sessionManager.addNote(sessionId, userId, note);

      expect(result).toBeDefined();
      expect(result.notes).toHaveLength(2);
      expect(result.notes[1]).toContain(note);
      expect(result.notes[1]).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]/); // Timestamp format
    });
  });

  describe('heartbeat', () => {
    it('should update session heartbeat successfully', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      
      const mockContext: SessionContext = {
        sessionId,
        userId,
        scenarioId: 'scenario456',
        customerPersona: 'office_worker',
        verificationStatus: {
          customerIdentityVerified: false,
          issueDocumented: false,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionProgress: {
          currentStep: 'active_support',
          completedSteps: [],
          nextSteps: [],
          estimatedTimeRemaining: 1800000,
        },
        performanceMetrics: {
          startTime: Date.now() - 600000, // 10 minutes ago
          lastActivity: Date.now() - 60000, // 1 minute ago
          messageCount: 10,
          responseTimeMs: [1000, 1200, 900],
          quality: {
            communicationScore: 8.0,
            technicalAccuracy: 8.5,
            completeness: 7.5,
            professionalism: 9.0,
          },
        },
        customerInfo: {
          issueDescription: 'Software installation help needed',
          urgency: 'medium',
          category: 'software',
        },
        notes: [],
        metadata: {},
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockContext));

      await sessionManager.heartbeat(sessionId, userId);

      // Verify that setex was called to update the context in Redis
      expect(mockRedisInstance.setex).toHaveBeenCalled();
    });

    it('should handle heartbeat for non-existent session gracefully', async () => {
      const sessionId = 'nonexistent';
      const userId = 'user123';

      mockRedisInstance.get.mockResolvedValue(null);

      // Should not throw error
      await expect(sessionManager.heartbeat(sessionId, userId)).resolves.not.toThrow();
    });
  });

  describe('getActiveSessionCount', () => {
    it('should return correct count of active sessions', () => {
      // Initially should be 0
      expect(sessionManager.getActiveSessionCount()).toBe(0);
    });
  });

  describe('getActiveSessionsByUser', () => {
    it('should return sessions for specific user', () => {
      const userId = 'user123';
      const sessions = sessionManager.getActiveSessionsByUser(userId);
      
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions).toHaveLength(0); // Initially empty
    });
  });

  describe('error handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      
      mockRedisInstance.get.mockRejectedValue(new Error('Redis connection lost'));

      const result = await sessionManager.getSessionContext(sessionId);
      expect(result).toBeNull();
    });

    it('should handle database errors in session creation', async () => {
      const userId = 'user123';
      const scenarioId = 'scenario456';
      
      mockSessionRepo.findActiveSessionByUserAndScenario.mockResolvedValue(null);
      mockSessionRepo.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(sessionManager.createSession(userId, scenarioId))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      await sessionManager.cleanup();
      
      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });
  });
});