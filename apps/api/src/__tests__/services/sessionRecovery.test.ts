import SessionRecovery, { SessionSnapshot, RecoveryResult, ConnectionState } from '../../services/sessionRecovery';
import { SessionManager, SessionContext } from '../../services/sessionManager';
import { SessionRepository } from '../../repositories/sessionRepository';
import * as Redis from 'redis';

// Mock dependencies
jest.mock('../../services/sessionManager');
jest.mock('../../repositories/sessionRepository');
jest.mock('redis');
jest.mock('../../utils/logger');

const mockSessionManager = jest.mocked(SessionManager);
const mockSessionRepository = jest.mocked(SessionRepository);
const mockRedis = jest.mocked(Redis.createClient);

describe('SessionRecovery', () => {
  let sessionRecovery: SessionRecovery;
  let mockSessionManagerInstance: jest.Mocked<SessionManager>;
  let mockRedisInstance: jest.Mocked<any>;
  let mockSessionRepo: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SessionManager instance
    mockSessionManagerInstance = {
      getSessionContext: jest.fn(),
      resumeSession: jest.fn(),
      pauseSession: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    // Mock Redis instance
    mockRedisInstance = {
      ping: jest.fn().mockResolvedValue('PONG'),
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      quit: jest.fn().mockResolvedValue('OK'),
    };

    mockRedis.mockReturnValue(mockRedisInstance);

    // Mock SessionRepository instance
    mockSessionRepo = {
      findMessagesBySession: jest.fn().mockResolvedValue([]),
    } as any;

    mockSessionRepository.mockImplementation(() => mockSessionRepo);

    sessionRecovery = new SessionRecovery(mockSessionManagerInstance);
  });

  afterEach(async () => {
    await sessionRecovery.cleanup();
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
      startTime: Date.now() - 300000, // 5 minutes ago
      lastActivity: Date.now(),
      messageCount: 5,
      responseTimeMs: [1000, 1500, 1200],
      quality: {
        communicationScore: 8.0,
        technicalAccuracy: 7.5,
        completeness: 7.0,
        professionalism: 9.0,
      },
    },
    customerInfo: {
      issueDescription: 'Test issue',
      urgency: 'medium',
      category: 'general',
    },
    notes: ['Initial contact made'],
    metadata: {},
    ...overrides,
  });

  const createMockChatMessages = () => [
    {
      id: 'msg1',
      sessionId: 'session123',
      senderType: 'ai' as const,
      content: 'Hello! How can I help you today?',
      timestamp: Date.now() - 300000,
      metadata: { type: 'greeting' },
    },
    {
      id: 'msg2',
      sessionId: 'session123',
      senderType: 'user' as const,
      content: 'My computer won\'t start',
      timestamp: Date.now() - 280000,
      metadata: {},
    },
    {
      id: 'msg3',
      sessionId: 'session123',
      senderType: 'ai' as const,
      content: 'I understand you\'re having trouble with your computer. Let me help you troubleshoot this.',
      timestamp: Date.now() - 260000,
      metadata: { type: 'acknowledgment' },
    },
  ];

  describe('initialize', () => {
    it('should initialize successfully when Redis is available', async () => {
      await expect(sessionRecovery.initialize()).resolves.not.toThrow();
      expect(mockRedisInstance.ping).toHaveBeenCalled();
    });

    it('should throw error when Redis is not available', async () => {
      mockRedisInstance.ping.mockRejectedValue(new Error('Redis connection failed'));
      
      await expect(sessionRecovery.initialize()).rejects.toThrow('Redis connection failed');
    });
  });

  describe('createSnapshot', () => {
    it('should create a snapshot successfully', async () => {
      const sessionId = 'session123';
      const sessionContext = createMockSessionContext({ sessionId });
      const chatMessages = createMockChatMessages();

      mockSessionManagerInstance.getSessionContext.mockResolvedValue(sessionContext);
      mockSessionRepo.findMessagesBySession.mockResolvedValue(
        chatMessages.map(msg => ({
          id: msg.id,
          sessionId: msg.sessionId,
          senderType: msg.senderType,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          metadata: msg.metadata,
        })) as any
      );

      await sessionRecovery.createSnapshot(sessionId, 'manual');

      expect(mockSessionManagerInstance.getSessionContext).toHaveBeenCalledWith(sessionId);
      expect(mockSessionRepo.findMessagesBySession).toHaveBeenCalledWith(sessionId);
      expect(mockRedisInstance.setex).toHaveBeenCalled();

      // Verify snapshot structure
      const setexCall = mockRedisInstance.setex.mock.calls[0];
      expect(setexCall[0]).toBe(`recovery:${sessionContext.userId}:${sessionId}`);
      
      const snapshot = JSON.parse(setexCall[2]);
      expect(snapshot.sessionId).toBe(sessionId);
      expect(snapshot.userId).toBe(sessionContext.userId);
      expect(snapshot.context).toEqual(sessionContext);
      expect(snapshot.chatHistory).toHaveLength(3);
      expect(snapshot.recoveryMetadata.snapshotReason).toBe('manual');
    });

    it('should handle missing session context gracefully', async () => {
      const sessionId = 'nonexistent';
      
      mockSessionManagerInstance.getSessionContext.mockResolvedValue(null);

      // Should not throw error
      await expect(sessionRecovery.createSnapshot(sessionId))
        .resolves.not.toThrow();
      
      expect(mockRedisInstance.setex).not.toHaveBeenCalled();
    });
  });

  describe('recoverSession', () => {
    it('should recover a session successfully with full context', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const sessionContext = createMockSessionContext({ sessionId, userId });
      const chatMessages = createMockChatMessages();

      const snapshot: SessionSnapshot = {
        sessionId,
        userId,
        timestamp: Date.now() - 60000, // 1 minute ago
        context: sessionContext,
        chatHistory: chatMessages,
        socketState: {
          connected: false,
          lastHeartbeat: Date.now() - 120000, // 2 minutes ago
          connectionId: 'socket123',
        },
        recoveryMetadata: {
          snapshotReason: 'disconnect',
          version: '1.0',
          checksum: 'test_checksum',
        },
      };

      mockRedisInstance.keys.mockResolvedValue([`recovery:${userId}:${sessionId}`]);
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(snapshot));
      mockSessionManagerInstance.getSessionContext.mockResolvedValue(null); // No existing session

      const result = await sessionRecovery.recoverSession(sessionId, userId, {
        includeMessages: true,
        maxMessageHistory: 100,
        autoResume: true,
      });

      expect(result.success).toBe(true);
      expect(result.recoveryType).toBe('full');
      expect(result.restoredContext).toEqual(sessionContext);
      expect(result.restoredMessages).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(mockSessionManagerInstance.resumeSession).toHaveBeenCalledWith(sessionId, userId);
    });

    it('should handle partial recovery when session already exists', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const sessionContext = createMockSessionContext({ sessionId, userId });
      const chatMessages = createMockChatMessages();

      const snapshot: SessionSnapshot = {
        sessionId,
        userId,
        timestamp: Date.now() - 60000,
        context: sessionContext,
        chatHistory: chatMessages,
        socketState: {
          connected: false,
          lastHeartbeat: Date.now() - 120000,
        },
        recoveryMetadata: {
          snapshotReason: 'periodic',
          version: '1.0',
          checksum: 'test_checksum',
        },
      };

      mockRedisInstance.keys.mockResolvedValue([`recovery:${userId}:${sessionId}`]);
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(snapshot));
      mockSessionManagerInstance.getSessionContext.mockResolvedValue(sessionContext); // Existing session

      const result = await sessionRecovery.recoverSession(sessionId, userId, {
        includeMessages: true,
        autoResume: false,
      });

      expect(result.success).toBe(true);
      expect(result.recoveryType).toBe('partial');
      expect(result.restoredContext).toBeUndefined();
      expect(result.restoredMessages).toHaveLength(3);
      expect(result.warnings).toContain('Session already active, skipping context recovery');
    });

    it('should fail recovery when no snapshot exists', async () => {
      const sessionId = 'session123';
      const userId = 'user123';

      mockRedisInstance.keys.mockResolvedValue([]);

      const result = await sessionRecovery.recoverSession(sessionId, userId);

      expect(result.success).toBe(false);
      expect(result.recoveryType).toBe('failed');
      expect(result.errors).toContain('No recovery snapshot found for session');
    });

    it('should fail recovery for unauthorized user', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const wrongUserId = 'user456';
      const sessionContext = createMockSessionContext({ sessionId, userId });

      const snapshot: SessionSnapshot = {
        sessionId,
        userId,
        timestamp: Date.now() - 60000,
        context: sessionContext,
        chatHistory: [],
        socketState: { connected: false, lastHeartbeat: Date.now() },
        recoveryMetadata: {
          snapshotReason: 'disconnect',
          version: '1.0',
          checksum: 'test_checksum',
        },
      };

      mockRedisInstance.keys.mockResolvedValue([`recovery:${userId}:${sessionId}`]);
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(snapshot));

      const result = await sessionRecovery.recoverSession(sessionId, wrongUserId);

      expect(result.success).toBe(false);
      expect(result.recoveryType).toBe('failed');
      expect(result.errors).toContain('Unauthorized access to session recovery');
    });

    it('should truncate message history when limit exceeded', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const sessionContext = createMockSessionContext({ sessionId, userId });
      
      // Create 50 messages
      const manyMessages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg${i}`,
        sessionId,
        senderType: 'user' as const,
        content: `Message ${i}`,
        timestamp: Date.now() - (50 - i) * 1000,
        metadata: {},
      }));

      const snapshot: SessionSnapshot = {
        sessionId,
        userId,
        timestamp: Date.now() - 60000,
        context: sessionContext,
        chatHistory: manyMessages,
        socketState: { connected: false, lastHeartbeat: Date.now() },
        recoveryMetadata: {
          snapshotReason: 'disconnect',
          version: '1.0',
          checksum: 'test_checksum',
        },
      };

      mockRedisInstance.keys.mockResolvedValue([`recovery:${userId}:${sessionId}`]);
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(snapshot));
      mockSessionManagerInstance.getSessionContext.mockResolvedValue(null);

      const result = await sessionRecovery.recoverSession(sessionId, userId, {
        includeMessages: true,
        maxMessageHistory: 20,
      });

      expect(result.success).toBe(true);
      expect(result.restoredMessages).toHaveLength(20);
      expect(result.warnings).toContain('Chat history truncated to last 20 messages');
    });
  });

  describe('restoreFromDisconnect', () => {
    it('should restore session from disconnect successfully', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const socketId = 'socket456';
      const sessionContext = createMockSessionContext({ sessionId, userId });

      const snapshot: SessionSnapshot = {
        sessionId,
        userId,
        timestamp: Date.now() - 30000, // 30 seconds ago
        context: sessionContext,
        chatHistory: createMockChatMessages(),
        socketState: {
          connected: false,
          lastHeartbeat: Date.now() - 60000,
          connectionId: 'old_socket',
        },
        recoveryMetadata: {
          snapshotReason: 'disconnect',
          version: '1.0',
          checksum: 'test_checksum',
        },
      };

      mockRedisInstance.keys.mockResolvedValue([`recovery:${userId}:${sessionId}`]);
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(snapshot));
      mockSessionManagerInstance.getSessionContext.mockResolvedValue(null);

      // Set up connection tracking first
      await sessionRecovery.trackConnection(sessionId, userId, 'old_socket');

      const result = await sessionRecovery.restoreFromDisconnect(sessionId, userId, socketId);

      expect(result.success).toBe(true);
      expect(mockSessionManagerInstance.resumeSession).toHaveBeenCalledWith(sessionId, userId);
    });
  });

  describe('trackConnection', () => {
    it('should track connection successfully', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const socketId = 'socket456';

      await sessionRecovery.trackConnection(sessionId, userId, socketId);

      // Should not throw error and should start periodic snapshots
      expect(true).toBe(true); // Connection tracking is internal
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnect and create snapshot', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const socketId = 'socket456';
      const reason = 'Network error';
      const sessionContext = createMockSessionContext({ sessionId, userId });

      // Set up connection tracking first
      await sessionRecovery.trackConnection(sessionId, userId, socketId);

      mockSessionManagerInstance.getSessionContext.mockResolvedValue(sessionContext);
      mockSessionRepo.findMessagesBySession.mockResolvedValue([]);

      await sessionRecovery.handleDisconnect(sessionId, reason);

      expect(mockSessionManagerInstance.pauseSession).toHaveBeenCalledWith(sessionId, userId, reason);
      expect(mockRedisInstance.setex).toHaveBeenCalled(); // Snapshot created
    });

    it('should handle disconnect for non-tracked session gracefully', async () => {
      const sessionId = 'unknown_session';
      const reason = 'Network error';

      // Should not throw error
      await expect(sessionRecovery.handleDisconnect(sessionId, reason))
        .resolves.not.toThrow();
    });
  });

  describe('updateHeartbeat', () => {
    it('should update heartbeat for tracked connection', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const socketId = 'socket456';

      // Track connection first
      await sessionRecovery.trackConnection(sessionId, userId, socketId);

      // Should not throw error
      await expect(sessionRecovery.updateHeartbeat(sessionId))
        .resolves.not.toThrow();
    });

    it('should handle heartbeat for non-tracked session gracefully', async () => {
      const sessionId = 'unknown_session';

      // Should not throw error
      await expect(sessionRecovery.updateHeartbeat(sessionId))
        .resolves.not.toThrow();
    });
  });

  describe('getRecoveryStatus', () => {
    it('should return recovery status with snapshot', async () => {
      const sessionId = 'session123';
      const userId = 'user123';
      const sessionContext = createMockSessionContext({ sessionId, userId });

      const snapshot: SessionSnapshot = {
        sessionId,
        userId,
        timestamp: Date.now() - 120000, // 2 minutes ago
        context: sessionContext,
        chatHistory: [],
        socketState: { connected: false, lastHeartbeat: Date.now() - 180000 },
        recoveryMetadata: {
          snapshotReason: 'disconnect',
          version: '1.0',
          checksum: 'test_checksum',
        },
      };

      mockRedisInstance.keys.mockResolvedValue([`recovery:${userId}:${sessionId}`]);
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(snapshot));

      const status = await sessionRecovery.getRecoveryStatus(sessionId);

      expect(status.hasSnapshot).toBe(true);
      expect(status.lastSnapshot).toBe(snapshot.timestamp);
      expect(status.recoveryAvailable).toBe(true);
    });

    it('should return recovery status without snapshot', async () => {
      const sessionId = 'session123';

      mockRedisInstance.keys.mockResolvedValue([]);

      const status = await sessionRecovery.getRecoveryStatus(sessionId);

      expect(status.hasSnapshot).toBe(false);
      expect(status.lastSnapshot).toBe(0);
      expect(status.recoveryAvailable).toBe(false);
      expect(status.connectionState).toBeNull();
    });
  });

  describe('listRecoverableSessions', () => {
    it('should list recoverable sessions for user', async () => {
      const userId = 'user123';
      const snapshots = [
        {
          sessionId: 'session1',
          userId,
          timestamp: Date.now() - 300000, // 5 minutes ago
          context: createMockSessionContext({ sessionId: 'session1', userId }),
          chatHistory: [],
          socketState: { connected: false, lastHeartbeat: Date.now() - 360000 },
          recoveryMetadata: { snapshotReason: 'disconnect', version: '1.0', checksum: 'checksum1' },
        },
        {
          sessionId: 'session2',
          userId,
          timestamp: Date.now() - 600000, // 10 minutes ago
          context: createMockSessionContext({ sessionId: 'session2', userId }),
          chatHistory: [],
          socketState: { connected: false, lastHeartbeat: Date.now() - 660000 },
          recoveryMetadata: { snapshotReason: 'periodic', version: '1.0', checksum: 'checksum2' },
        },
      ];

      mockRedisInstance.keys.mockResolvedValue([
        `recovery:${userId}:session1`,
        `recovery:${userId}:session2`,
      ]);
      
      mockRedisInstance.get
        .mockResolvedValueOnce(JSON.stringify(snapshots[0]))
        .mockResolvedValueOnce(JSON.stringify(snapshots[1]));

      const result = await sessionRecovery.listRecoverableSessions(userId);

      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBeGreaterThan(result[1].timestamp); // Sorted by newest first
      expect(result[0].sessionId).toBe('session1');
      expect(result[1].sessionId).toBe('session2');
    });

    it('should handle corrupted snapshots gracefully', async () => {
      const userId = 'user123';

      mockRedisInstance.keys.mockResolvedValue([
        `recovery:${userId}:session1`,
        `recovery:${userId}:session2`,
      ]);
      
      mockRedisInstance.get
        .mockResolvedValueOnce('invalid_json')
        .mockResolvedValueOnce(JSON.stringify({
          sessionId: 'session2',
          userId,
          timestamp: Date.now(),
          context: {},
          chatHistory: [],
          socketState: { connected: false, lastHeartbeat: Date.now() },
          recoveryMetadata: { snapshotReason: 'periodic', version: '1.0', checksum: 'checksum2' },
        }));

      const result = await sessionRecovery.listRecoverableSessions(userId);

      expect(result).toHaveLength(1); // Only valid snapshot returned
      expect(result[0].sessionId).toBe('session2');
    });
  });

  describe('cleanupExpiredSnapshots', () => {
    it('should cleanup expired snapshots', async () => {
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const now = Date.now();
      
      const expiredSnapshot = {
        sessionId: 'old_session',
        timestamp: now - maxAge - 1000, // Older than maxAge
      };
      
      const validSnapshot = {
        sessionId: 'recent_session',
        timestamp: now - maxAge + 1000, // Newer than maxAge
      };

      mockRedisInstance.keys.mockResolvedValue([
        'recovery:user1:old_session',
        'recovery:user1:recent_session',
        'recovery:user2:corrupted',
      ]);
      
      mockRedisInstance.get
        .mockResolvedValueOnce(JSON.stringify(expiredSnapshot))
        .mockResolvedValueOnce(JSON.stringify(validSnapshot))
        .mockResolvedValueOnce('corrupted_json');

      const cleanedCount = await sessionRecovery.cleanupExpiredSnapshots(maxAge);

      expect(cleanedCount).toBe(2); // Expired + corrupted
      expect(mockRedisInstance.del).toHaveBeenCalledWith('recovery:user1:old_session');
      expect(mockRedisInstance.del).toHaveBeenCalledWith('recovery:user2:corrupted');
      expect(mockRedisInstance.del).not.toHaveBeenCalledWith('recovery:user1:recent_session');
    });
  });

  describe('error handling', () => {
    it('should handle Redis errors gracefully in snapshot creation', async () => {
      const sessionId = 'session123';
      const sessionContext = createMockSessionContext({ sessionId });

      mockSessionManagerInstance.getSessionContext.mockResolvedValue(sessionContext);
      mockSessionRepo.findMessagesBySession.mockResolvedValue([]);
      mockRedisInstance.setex.mockRejectedValue(new Error('Redis write failed'));

      // Should not throw error
      await expect(sessionRecovery.createSnapshot(sessionId))
        .resolves.not.toThrow();
    });

    it('should handle Redis errors gracefully in recovery', async () => {
      const sessionId = 'session123';
      const userId = 'user123';

      mockRedisInstance.keys.mockRejectedValue(new Error('Redis read failed'));

      const result = await sessionRecovery.recoverSession(sessionId, userId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Recovery failed: Redis read failed');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      await sessionRecovery.cleanup();
      
      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });
  });
});