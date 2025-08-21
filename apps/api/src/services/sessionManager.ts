import { EventEmitter } from 'events';
import { SessionRepository, CreateSessionData } from '../repositories/sessionRepository';
import { logger } from '../utils/logger';
import { createClient, RedisClientType } from 'redis';

export interface SessionContext {
  sessionId: string;
  userId: string;
  scenarioId: string;
  ticketId?: string;
  customerPersona: string;
  verificationStatus: {
    customerIdentityVerified: boolean;
    issueDocumented: boolean;
    resolutionProvided: boolean;
    customerSatisfied: boolean;
  };
  resolutionProgress: {
    currentStep: string;
    completedSteps: string[];
    nextSteps: string[];
    estimatedTimeRemaining: number;
  };
  performanceMetrics: {
    startTime: number;
    lastActivity: number;
    messageCount: number;
    responseTimeMs: number[];
    quality: {
      communicationScore: number;
      technicalAccuracy: number;
      completeness: number;
      professionalism: number;
    };
  };
  customerInfo: {
    name?: string;
    department?: string;
    contactInfo?: string;
    issueDescription: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    category: string;
  };
  notes: string[];
  metadata: Record<string, any>;
}

export type SessionStatus = 'created' | 'active' | 'paused' | 'completed' | 'abandoned' | 'escalated';

export interface SessionStateTransition {
  fromStatus: SessionStatus;
  toStatus: SessionStatus;
  timestamp: number;
  reason?: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface SessionLifecycleEvent {
  type: 'session_created' | 'session_started' | 'session_paused' | 'session_resumed' | 
        'session_completed' | 'session_abandoned' | 'session_escalated' | 'verification_updated' |
        'progress_updated' | 'note_added' | 'customer_info_updated';
  sessionId: string;
  userId: string;
  timestamp: number;
  data?: any;
}

export class SessionManager extends EventEmitter {
  private sessionRepository: SessionRepository;
  private redisClient: RedisClientType;
  private activeSessionContexts: Map<string, SessionContext> = new Map();
  private sessionTimeouts: Map<string, any> = new Map();

  // Session configuration
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super();
    this.sessionRepository = new SessionRepository();
    this.redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
    
    this.setupCleanupTask();
    this.setMaxListeners(100);
  }

  async initialize(): Promise<void> {
    try {
      await this.redisClient.ping();
      logger.info('Session manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize session manager', { error });
      throw error;
    }
  }

  async createSession(
    userId: string, 
    scenarioId: string, 
    ticketId?: string,
    customerPersona?: string
  ): Promise<SessionContext> {
    try {
      logger.info('Creating new session', { userId, scenarioId, ticketId });

      // Check for existing active session
      const existingActiveSession = await this.sessionRepository.findActiveSessionByUserAndScenario(userId, scenarioId);
      if (existingActiveSession) {
        throw new Error('User already has an active session for this scenario');
      }

      // Create session in database
      const sessionData: CreateSessionData = {
        userId,
        scenarioId,
      };
      
      const dbSession = await this.sessionRepository.create(sessionData);

      // Create session context
      const sessionContext: SessionContext = {
        sessionId: dbSession.id,
        userId,
        scenarioId,
        ticketId,
        customerPersona: customerPersona || 'office_worker',
        verificationStatus: {
          customerIdentityVerified: false,
          issueDocumented: false,
          resolutionProvided: false,
          customerSatisfied: false,
        },
        resolutionProgress: {
          currentStep: 'initial_contact',
          completedSteps: [],
          nextSteps: ['gather_information', 'identify_issue'],
          estimatedTimeRemaining: 1800000, // 30 minutes default
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
        metadata: {
          createdAt: Date.now(),
          source: 'session_manager',
        },
      };

      // Store in memory and Redis
      this.activeSessionContexts.set(dbSession.id, sessionContext);
      await this.persistSessionContext(sessionContext);

      // Set up session timeout
      this.setupSessionTimeout(dbSession.id);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: 'session_created',
        sessionId: dbSession.id,
        userId,
        timestamp: Date.now(),
        data: { ticketId, customerPersona },
      });

      logger.info('Session created successfully', { sessionId: dbSession.id, userId });
      return sessionContext;
    } catch (error) {
      logger.error('Failed to create session', { userId, scenarioId, error });
      throw error;
    }
  }

  async startSession(sessionId: string, userId: string): Promise<SessionContext> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (!context) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (context.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      // Update session status in database
      await this.sessionRepository.update(sessionId, { status: 'active' });

      // Update context
      context.performanceMetrics.startTime = Date.now();
      context.performanceMetrics.lastActivity = Date.now();
      context.resolutionProgress.currentStep = 'active_support';

      // Update memory and Redis
      this.activeSessionContexts.set(sessionId, context);
      await this.persistSessionContext(context);

      // Reset timeout
      this.setupSessionTimeout(sessionId);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: 'session_started',
        sessionId,
        userId,
        timestamp: Date.now(),
      });

      logger.info('Session started', { sessionId, userId });
      return context;
    } catch (error) {
      logger.error('Failed to start session', { sessionId, userId, error });
      throw error;
    }
  }

  async pauseSession(sessionId: string, userId: string, reason?: string): Promise<SessionContext> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (!context) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (context.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      // Update session status
      await this.sessionRepository.update(sessionId, { status: 'paused' });

      // Update context
      context.performanceMetrics.lastActivity = Date.now();

      // Update storage
      this.activeSessionContexts.set(sessionId, context);
      await this.persistSessionContext(context);

      // Clear timeout
      this.clearSessionTimeout(sessionId);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: 'session_paused',
        sessionId,
        userId,
        timestamp: Date.now(),
        data: { reason },
      });

      logger.info('Session paused', { sessionId, userId, reason });
      return context;
    } catch (error) {
      logger.error('Failed to pause session', { sessionId, userId, error });
      throw error;
    }
  }

  async resumeSession(sessionId: string, userId: string): Promise<SessionContext> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (!context) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (context.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      // Update session status
      await this.sessionRepository.update(sessionId, { status: 'active' });

      // Update context
      context.performanceMetrics.lastActivity = Date.now();

      // Update storage
      this.activeSessionContexts.set(sessionId, context);
      await this.persistSessionContext(context);

      // Reset timeout
      this.setupSessionTimeout(sessionId);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: 'session_resumed',
        sessionId,
        userId,
        timestamp: Date.now(),
      });

      logger.info('Session resumed', { sessionId, userId });
      return context;
    } catch (error) {
      logger.error('Failed to resume session', { sessionId, userId, error });
      throw error;
    }
  }

  async completeSession(
    sessionId: string, 
    userId: string, 
    resolutionData: {
      resolution: string;
      customerSatisfied: boolean;
      escalated?: boolean;
      notes?: string[];
    }
  ): Promise<SessionContext> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (!context) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (context.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      // Update verification status
      context.verificationStatus.resolutionProvided = true;
      context.verificationStatus.customerSatisfied = resolutionData.customerSatisfied;

      // Update resolution progress
      context.resolutionProgress.currentStep = 'completed';
      context.resolutionProgress.completedSteps.push('resolution_provided', 'customer_confirmation');

      // Add notes
      if (resolutionData.notes) {
        context.notes.push(...resolutionData.notes);
      }

      // Calculate completion time
      const completionTime = Date.now() - context.performanceMetrics.startTime;

      // Update session status in database
      const finalStatus = resolutionData.escalated ? 'escalated' : 'completed';
      await this.sessionRepository.update(sessionId, { 
        status: finalStatus,
        completedAt: new Date(),
        resolutionData: {
          resolution: resolutionData.resolution,
          customerSatisfied: resolutionData.customerSatisfied,
          escalated: resolutionData.escalated || false,
          completionTime,
          notes: context.notes,
        },
      });

      // Update context
      context.performanceMetrics.lastActivity = Date.now();
      context.metadata.completedAt = Date.now();
      context.metadata.completionTime = completionTime;

      // Update storage
      this.activeSessionContexts.set(sessionId, context);
      await this.persistSessionContext(context);

      // Clear timeout
      this.clearSessionTimeout(sessionId);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: resolutionData.escalated ? 'session_escalated' : 'session_completed',
        sessionId,
        userId,
        timestamp: Date.now(),
        data: resolutionData,
      });

      // Schedule cleanup after delay
      setTimeout(() => {
        this.cleanupSession(sessionId);
      }, 5 * 60 * 1000); // 5 minutes

      logger.info('Session completed', { sessionId, userId, status: finalStatus });
      return context;
    } catch (error) {
      logger.error('Failed to complete session', { sessionId, userId, error });
      throw error;
    }
  }

  async abandonSession(sessionId: string, userId: string, reason?: string): Promise<void> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (!context) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (context.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      // Update session status in database
      await this.sessionRepository.update(sessionId, { 
        status: 'abandoned',
        completedAt: new Date(),
        resolutionData: {
          reason: reason || 'User abandoned session',
          abandonedAt: Date.now(),
        },
      });

      // Clear timeout and cleanup
      this.clearSessionTimeout(sessionId);
      await this.cleanupSession(sessionId);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: 'session_abandoned',
        sessionId,
        userId,
        timestamp: Date.now(),
        data: { reason },
      });

      logger.info('Session abandoned', { sessionId, userId, reason });
    } catch (error) {
      logger.error('Failed to abandon session', { sessionId, userId, error });
      throw error;
    }
  }

  async updateVerificationStatus(
    sessionId: string, 
    userId: string, 
    updates: Partial<SessionContext['verificationStatus']>
  ): Promise<SessionContext> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (!context) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (context.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      // Update verification status
      Object.assign(context.verificationStatus, updates);
      context.performanceMetrics.lastActivity = Date.now();

      // Update storage
      this.activeSessionContexts.set(sessionId, context);
      await this.persistSessionContext(context);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: 'verification_updated',
        sessionId,
        userId,
        timestamp: Date.now(),
        data: updates,
      });

      logger.debug('Verification status updated', { sessionId, updates });
      return context;
    } catch (error) {
      logger.error('Failed to update verification status', { sessionId, userId, error });
      throw error;
    }
  }

  async updateResolutionProgress(
    sessionId: string, 
    userId: string, 
    updates: Partial<SessionContext['resolutionProgress']>
  ): Promise<SessionContext> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (!context) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (context.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      // Update resolution progress
      Object.assign(context.resolutionProgress, updates);
      context.performanceMetrics.lastActivity = Date.now();

      // Update storage
      this.activeSessionContexts.set(sessionId, context);
      await this.persistSessionContext(context);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: 'progress_updated',
        sessionId,
        userId,
        timestamp: Date.now(),
        data: updates,
      });

      logger.debug('Resolution progress updated', { sessionId, updates });
      return context;
    } catch (error) {
      logger.error('Failed to update resolution progress', { sessionId, userId, error });
      throw error;
    }
  }

  async addNote(sessionId: string, userId: string, note: string): Promise<SessionContext> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (!context) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (context.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      // Add note with timestamp
      const timestampedNote = `[${new Date().toISOString()}] ${note}`;
      context.notes.push(timestampedNote);
      context.performanceMetrics.lastActivity = Date.now();

      // Update storage
      this.activeSessionContexts.set(sessionId, context);
      await this.persistSessionContext(context);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: 'note_added',
        sessionId,
        userId,
        timestamp: Date.now(),
        data: { note: timestampedNote },
      });

      logger.debug('Note added to session', { sessionId, note });
      return context;
    } catch (error) {
      logger.error('Failed to add note', { sessionId, userId, error });
      throw error;
    }
  }

  async updateCustomerInfo(
    sessionId: string, 
    userId: string, 
    updates: Partial<SessionContext['customerInfo']>
  ): Promise<SessionContext> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (!context) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (context.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      // Update customer info
      Object.assign(context.customerInfo, updates);
      context.performanceMetrics.lastActivity = Date.now();

      // Update storage
      this.activeSessionContexts.set(sessionId, context);
      await this.persistSessionContext(context);

      // Emit lifecycle event
      await this.emitLifecycleEvent({
        type: 'customer_info_updated',
        sessionId,
        userId,
        timestamp: Date.now(),
        data: updates,
      });

      logger.debug('Customer info updated', { sessionId, updates });
      return context;
    } catch (error) {
      logger.error('Failed to update customer info', { sessionId, userId, error });
      throw error;
    }
  }

  async getSessionContext(sessionId: string): Promise<SessionContext | null> {
    try {
      // Try memory cache first
      let context = this.activeSessionContexts.get(sessionId);
      
      if (!context) {
        // Try Redis cache
        const redisData = await this.redisClient.get(`session:${sessionId}`);
        if (redisData) {
          context = JSON.parse(redisData);
          this.activeSessionContexts.set(sessionId, context);
        }
      }

      if (context) {
        // Update last activity for heartbeat
        context.performanceMetrics.lastActivity = Date.now();
        return context;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get session context', { sessionId, error });
      return null;
    }
  }

  async heartbeat(sessionId: string, userId: string): Promise<void> {
    try {
      const context = await this.getSessionContext(sessionId);
      if (context && context.userId === userId) {
        context.performanceMetrics.lastActivity = Date.now();
        this.activeSessionContexts.set(sessionId, context);
        await this.persistSessionContext(context);
        
        // Reset timeout
        this.setupSessionTimeout(sessionId);
      }
    } catch (error) {
      logger.error('Heartbeat failed', { sessionId, userId, error });
    }
  }

  private async persistSessionContext(context: SessionContext): Promise<void> {
    try {
      await this.redisClient.setex(
        `session:${context.sessionId}`,
        this.SESSION_TIMEOUT / 1000,
        JSON.stringify(context)
      );
    } catch (error) {
      logger.error('Failed to persist session context', { sessionId: context.sessionId, error });
    }
  }

  private setupSessionTimeout(sessionId: string): void {
    // Clear existing timeout
    this.clearSessionTimeout(sessionId);

    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        const context = await this.getSessionContext(sessionId);
        if (context) {
          await this.abandonSession(sessionId, context.userId, 'Session timeout');
        }
      } catch (error) {
        logger.error('Session timeout handler failed', { sessionId, error });
      }
    }, this.SESSION_TIMEOUT);

    this.sessionTimeouts.set(sessionId, timeout);
  }

  private clearSessionTimeout(sessionId: string): void {
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  private async cleanupSession(sessionId: string): Promise<void> {
    try {
      // Remove from memory
      this.activeSessionContexts.delete(sessionId);
      
      // Clear timeout
      this.clearSessionTimeout(sessionId);
      
      // Remove from Redis (let it expire naturally)
      logger.debug('Session cleaned up', { sessionId });
    } catch (error) {
      logger.error('Failed to cleanup session', { sessionId, error });
    }
  }

  private setupCleanupTask(): void {
    setInterval(async () => {
      try {
        const now = Date.now();
        const staleThreshold = now - this.SESSION_TIMEOUT;

        for (const [sessionId, context] of this.activeSessionContexts.entries()) {
          if (context.performanceMetrics.lastActivity < staleThreshold) {
            logger.info('Cleaning up stale session', { sessionId });
            await this.cleanupSession(sessionId);
          }
        }
      } catch (error) {
        logger.error('Cleanup task failed', { error });
      }
    }, this.CLEANUP_INTERVAL);
  }

  private async emitLifecycleEvent(event: SessionLifecycleEvent): Promise<void> {
    try {
      this.emit('lifecycle_event', event);
      
      // Also store in Redis for potential event replay
      await this.redisClient.lpush(
        `session:${event.sessionId}:events`,
        JSON.stringify(event)
      );
      
      // Keep only last 100 events
      await this.redisClient.ltrim(`session:${event.sessionId}:events`, 0, 99);
      
    } catch (error) {
      logger.error('Failed to emit lifecycle event', { event, error });
    }
  }

  async getSessionEvents(sessionId: string): Promise<SessionLifecycleEvent[]> {
    try {
      const events = await this.redisClient.lrange(`session:${sessionId}:events`, 0, -1);
      return events.map(event => JSON.parse(event)).reverse();
    } catch (error) {
      logger.error('Failed to get session events', { sessionId, error });
      return [];
    }
  }

  // Statistics and monitoring
  getActiveSessionCount(): number {
    return this.activeSessionContexts.size;
  }

  getActiveSessionsByUser(userId: string): SessionContext[] {
    const sessions: SessionContext[] = [];
    for (const context of this.activeSessionContexts.values()) {
      if (context.userId === userId) {
        sessions.push(context);
      }
    }
    return sessions;
  }

  async cleanup(): Promise<void> {
    try {
      // Clear all timeouts
      for (const timeout of this.sessionTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.sessionTimeouts.clear();

      // Clear memory cache
      this.activeSessionContexts.clear();

      // Close Redis connection
      await this.redisClient.quit();

      logger.info('Session manager cleaned up successfully');
    } catch (error) {
      logger.error('Failed to cleanup session manager', { error });
    }
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;