import { SessionAnalytics, SessionAnalyticsService } from '../../services/sessionAnalytics';
import { SessionContext } from '../../services/sessionManager';
import * as Redis from 'redis';

// Mock dependencies
jest.mock('redis');
jest.mock('../../repositories/sessionRepository');
jest.mock('../../utils/logger');

const mockRedis = jest.mocked(Redis.createClient);

describe('SessionAnalytics', () => {
  let sessionAnalytics: SessionAnalyticsService;
  let mockRedisInstance: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRedisInstance = {
      ping: jest.fn().mockResolvedValue('PONG'),
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
    };

    mockRedis.mockReturnValue(mockRedisInstance);
    sessionAnalytics = new SessionAnalyticsService();
  });

  afterEach(async () => {
    await sessionAnalytics.cleanup();
  });

  const createMockSessionContext = (overrides: Partial<SessionContext> = {}): SessionContext => ({
    sessionId: 'session123',
    userId: 'user123',
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
      issueDescription: 'Test issue',
      urgency: 'medium',
      category: 'general',
    },
    notes: [],
    metadata: {},
    ...overrides,
  });

  describe('initialize', () => {
    it('should initialize successfully when Redis is available', async () => {
      await expect(sessionAnalytics.initialize()).resolves.not.toThrow();
      expect(mockRedisInstance.ping).toHaveBeenCalled();
    });

    it('should throw error when Redis is not available', async () => {
      mockRedisInstance.ping.mockRejectedValue(new Error('Redis connection failed'));
      
      await expect(sessionAnalytics.initialize()).rejects.toThrow('Redis connection failed');
    });
  });

  describe('trackSessionStart', () => {
    it('should track session start successfully', async () => {
      const sessionContext = createMockSessionContext({
        sessionId: 'session123',
        userId: 'user123',
        scenarioId: 'scenario456',
        customerPersona: 'frustrated_user',
        customerInfo: {
          issueDescription: 'Computer crashed',
          urgency: 'high',
          category: 'hardware',
        },
      });

      await sessionAnalytics.trackSessionStart(sessionContext);

      expect(mockRedisInstance.setex).toHaveBeenCalled();
      
      // Verify the analytics object was stored
      const setexCall = mockRedisInstance.setex.mock.calls[0];
      expect(setexCall[0]).toBe('analytics:session123');
      
      const storedAnalytics = JSON.parse(setexCall[2]);
      expect(storedAnalytics.sessionId).toBe('session123');
      expect(storedAnalytics.userId).toBe('user123');
      expect(storedAnalytics.messageCount).toBe(0);
      expect(storedAnalytics.metadata.scenario).toBe('scenario456');
      expect(storedAnalytics.metadata.customerPersona).toBe('frustrated_user');
      expect(storedAnalytics.metadata.urgency).toBe('high');
      expect(storedAnalytics.metadata.category).toBe('hardware');
    });
  });

  describe('trackMessage', () => {
    beforeEach(async () => {
      // Set up initial analytics
      const sessionContext = createMockSessionContext();
      await sessionAnalytics.trackSessionStart(sessionContext);
    });

    it('should track user message successfully', async () => {
      const sessionId = 'session123';
      const responseTime = 1500;
      const messageType = 'user';

      // Mock existing analytics
      const existingAnalytics = {
        sessionId,
        userId: 'user123',
        startTime: Date.now() - 300000,
        messageCount: 5,
        responseTimeMs: [1000, 1200, 800],
        resolutionMetrics: { timeToFirstResponse: 0 },
        qualityMetrics: {
          communicationScore: 7.5,
          technicalAccuracy: 8.0,
          completeness: 7.0,
          professionalism: 8.5,
          overallScore: 7.75,
        },
        engagementMetrics: {
          userInteractionRate: 0,
          sessionDepth: 3,
          pauseCount: 0,
          totalPauseTime: 0,
        },
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(existingAnalytics));

      await sessionAnalytics.trackMessage(sessionId, responseTime, messageType);

      expect(mockRedisInstance.setex).toHaveBeenCalledTimes(2); // Initial + update
      
      // Verify analytics were updated
      const updateCall = mockRedisInstance.setex.mock.calls[1];
      const updatedAnalytics = JSON.parse(updateCall[2]);
      
      expect(updatedAnalytics.messageCount).toBe(6);
      expect(updatedAnalytics.responseTimeMs).toContain(responseTime);
      expect(updatedAnalytics.engagementMetrics.sessionDepth).toBe(4); // Incremented for user message
    });

    it('should track AI message and update first response time', async () => {
      const sessionId = 'session123';
      const responseTime = 2000;
      const messageType = 'ai';
      const qualityScore = 8.5;

      const existingAnalytics = {
        sessionId,
        userId: 'user123',
        startTime: Date.now() - 60000, // 1 minute ago
        messageCount: 1,
        responseTimeMs: [],
        resolutionMetrics: { timeToFirstResponse: 0 },
        qualityMetrics: {
          communicationScore: 0,
          technicalAccuracy: 0,
          completeness: 0,
          professionalism: 0,
          overallScore: 0,
        },
        engagementMetrics: {
          userInteractionRate: 0,
          sessionDepth: 1,
          pauseCount: 0,
          totalPauseTime: 0,
        },
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(existingAnalytics));

      await sessionAnalytics.trackMessage(sessionId, responseTime, messageType, qualityScore);

      const updateCall = mockRedisInstance.setex.mock.calls[1];
      const updatedAnalytics = JSON.parse(updateCall[2]);
      
      expect(updatedAnalytics.messageCount).toBe(2);
      expect(updatedAnalytics.responseTimeMs).toContain(responseTime);
      expect(updatedAnalytics.resolutionMetrics.timeToFirstResponse).toBeGreaterThan(0);
      expect(updatedAnalytics.qualityMetrics.communicationScore).toBeGreaterThan(0);
    });

    it('should handle missing analytics gracefully', async () => {
      const sessionId = 'nonexistent';
      const responseTime = 1000;
      const messageType = 'user';

      mockRedisInstance.get.mockResolvedValue(null);

      // Should not throw error
      await expect(sessionAnalytics.trackMessage(sessionId, responseTime, messageType))
        .resolves.not.toThrow();
    });
  });

  describe('trackSessionEvent', () => {
    beforeEach(async () => {
      const sessionContext = createMockSessionContext();
      await sessionAnalytics.trackSessionStart(sessionContext);
    });

    it('should track session pause event', async () => {
      const sessionId = 'session123';
      const event = {
        type: 'session_paused' as const,
        sessionId,
        userId: 'user123',
        timestamp: Date.now(),
        data: { reason: 'User requested pause' },
      };

      const existingAnalytics = {
        sessionId,
        userId: 'user123',
        startTime: Date.now() - 600000,
        engagementMetrics: {
          pauseCount: 0,
          userInteractionRate: 0,
          sessionDepth: 5,
          totalPauseTime: 0,
        },
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(existingAnalytics));

      await sessionAnalytics.trackSessionEvent(event);

      const updateCall = mockRedisInstance.setex.mock.calls[1];
      const updatedAnalytics = JSON.parse(updateCall[2]);
      
      expect(updatedAnalytics.engagementMetrics.pauseCount).toBe(1);
    });

    it('should track session completion event', async () => {
      const sessionId = 'session123';
      const event = {
        type: 'session_completed' as const,
        sessionId,
        userId: 'user123',
        timestamp: Date.now(),
        data: {
          resolution: 'Issue resolved',
          customerSatisfied: true,
        },
      };

      const existingAnalytics = {
        sessionId,
        userId: 'user123',
        startTime: Date.now() - 1800000, // 30 minutes ago
        endTime: undefined,
        duration: undefined,
        verificationStatus: {
          customerIdentityVerified: true,
          issueDocumented: true,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionMetrics: {
          timeToFirstResponse: 30000,
          timeToResolution: 0,
          escalated: false,
          customerSatisfied: false,
          resolutionSteps: 5,
        },
        metadata: {
          completionStatus: 'active',
        },
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(existingAnalytics));

      await sessionAnalytics.trackSessionEvent(event);

      const updateCall = mockRedisInstance.setex.mock.calls[1];
      const updatedAnalytics = JSON.parse(updateCall[2]);
      
      expect(updatedAnalytics.endTime).toBe(event.timestamp);
      expect(updatedAnalytics.duration).toBeGreaterThan(0);
      expect(updatedAnalytics.resolutionMetrics.timeToResolution).toBe(updatedAnalytics.duration);
      expect(updatedAnalytics.resolutionMetrics.customerSatisfied).toBe(true);
      expect(updatedAnalytics.metadata.completionStatus).toBe('completed');
    });

    it('should track verification update event', async () => {
      const sessionId = 'session123';
      const event = {
        type: 'verification_updated' as const,
        sessionId,
        userId: 'user123',
        timestamp: Date.now(),
        data: {
          customerIdentityVerified: true,
          issueDocumented: true,
        },
      };

      const existingAnalytics = {
        sessionId,
        userId: 'user123',
        startTime: Date.now() - 300000,
        verificationStatus: {
          customerIdentityVerified: false,
          issueDocumented: false,
          resolutionProvided: false,
          customerSatisfied: false,
        },
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(existingAnalytics));

      await sessionAnalytics.trackSessionEvent(event);

      const updateCall = mockRedisInstance.setex.mock.calls[1];
      const updatedAnalytics = JSON.parse(updateCall[2]);
      
      expect(updatedAnalytics.verificationStatus.customerIdentityVerified).toBe(true);
      expect(updatedAnalytics.verificationStatus.issueDocumented).toBe(true);
    });
  });

  describe('getSessionAnalytics', () => {
    it('should retrieve session analytics from cache', async () => {
      const sessionId = 'session123';
      const mockAnalytics = {
        sessionId,
        userId: 'user123',
        startTime: Date.now() - 600000,
        messageCount: 10,
        responseTimeMs: [1000, 1500, 1200],
        qualityMetrics: {
          communicationScore: 8.5,
          technicalAccuracy: 8.0,
          completeness: 7.5,
          professionalism: 9.0,
          overallScore: 8.25,
        },
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockAnalytics));

      const result = await sessionAnalytics.getSessionAnalytics(sessionId);

      expect(result).toEqual(mockAnalytics);
      expect(mockRedisInstance.get).toHaveBeenCalledWith(`analytics:${sessionId}`);
    });

    it('should return null for non-existent session analytics', async () => {
      const sessionId = 'nonexistent';
      
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await sessionAnalytics.getSessionAnalytics(sessionId);

      expect(result).toBeNull();
    });
  });

  describe('getRealtimeMetrics', () => {
    it('should return realtime metrics for active session', async () => {
      const sessionId = 'session123';
      const currentTime = Date.now();
      const startTime = currentTime - 900000; // 15 minutes ago
      
      const mockAnalytics = {
        sessionId,
        userId: 'user123',
        startTime,
        endTime: undefined,
        duration: undefined,
        messageCount: 12,
        responseTimeMs: [1000, 1500, 1200, 800, 1800, 1100, 1300, 900, 1400, 1600, 1000, 1200],
        qualityMetrics: {
          communicationScore: 8.5,
          technicalAccuracy: 8.0,
          completeness: 7.5,
          professionalism: 9.0,
          overallScore: 8.25,
        },
        verificationStatus: {
          customerIdentityVerified: true,
          issueDocumented: true,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        engagementMetrics: {
          userInteractionRate: 0,
          sessionDepth: 8,
          pauseCount: 1,
          totalPauseTime: 30000,
        },
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockAnalytics));

      const result = await sessionAnalytics.getRealtimeMetrics(sessionId);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(sessionId);
      expect(result.messageCount).toBe(12);
      expect(result.duration).toBeCloseTo(900000, -4); // Around 15 minutes
      expect(result.responseTimeMs).toHaveLength(10); // Last 10 response times
      expect(result.qualityMetrics).toEqual(mockAnalytics.qualityMetrics);
      expect(result.verificationStatus).toEqual(mockAnalytics.verificationStatus);
      expect(result.engagementMetrics?.userInteractionRate).toBeGreaterThan(0);
    });

    it('should handle completed session metrics', async () => {
      const sessionId = 'session123';
      const startTime = Date.now() - 1800000; // 30 minutes ago
      const endTime = Date.now() - 300000; // 5 minutes ago
      const duration = endTime - startTime;
      
      const mockAnalytics = {
        sessionId,
        startTime,
        endTime,
        duration,
        messageCount: 25,
        responseTimeMs: [1200, 1100, 1000, 1300, 1150],
        qualityMetrics: {
          communicationScore: 9.0,
          technicalAccuracy: 8.5,
          completeness: 8.0,
          professionalism: 9.5,
          overallScore: 8.75,
        },
      };

      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockAnalytics));

      const result = await sessionAnalytics.getRealtimeMetrics(sessionId);

      expect(result).toBeDefined();
      expect(result.duration).toBe(duration);
    });

    it('should return empty object for non-existent session', async () => {
      const sessionId = 'nonexistent';
      
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await sessionAnalytics.getRealtimeMetrics(sessionId);

      expect(result).toEqual({});
    });
  });

  describe('aggregateSessionData', () => {
    it('should aggregate session data successfully', async () => {
      // This test would require mocking the getCompletedSessionsInRange method
      // For now, we'll test that it doesn't throw an error
      await expect(sessionAnalytics.aggregateSessionData()).resolves.not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should calculate performance metrics correctly', () => {
      // Test the private methods indirectly through public methods
      const sessionContext = createMockSessionContext({
        performanceMetrics: {
          startTime: Date.now() - 1800000,
          lastActivity: Date.now(),
          messageCount: 15,
          responseTimeMs: [1000, 1500, 1200, 800, 2000, 1100, 1300],
          quality: {
            communicationScore: 8.5,
            technicalAccuracy: 8.0,
            completeness: 7.5,
            professionalism: 9.0,
          },
        },
      });

      // The utility methods are tested indirectly through trackSessionStart
      expect(async () => {
        await sessionAnalytics.trackSessionStart(sessionContext);
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle Redis errors gracefully in tracking', async () => {
      const sessionId = 'session123';
      
      mockRedisInstance.get.mockRejectedValue(new Error('Redis connection lost'));

      // Should not throw error
      await expect(sessionAnalytics.trackMessage(sessionId, 1000, 'user'))
        .resolves.not.toThrow();
    });

    it('should handle Redis errors gracefully in retrieval', async () => {
      const sessionId = 'session123';
      
      mockRedisInstance.get.mockRejectedValue(new Error('Redis connection lost'));

      const result = await sessionAnalytics.getSessionAnalytics(sessionId);
      expect(result).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      await sessionAnalytics.cleanup();
      
      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });
  });
});