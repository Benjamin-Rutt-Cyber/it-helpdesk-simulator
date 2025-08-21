import { EventEmitter } from 'events';
import { SessionManager, SessionContext, SessionLifecycleEvent } from './sessionManager';
import { SessionRepository } from '../repositories/sessionRepository';
import { logger } from '../utils/logger';
import { createClient, RedisClientType } from 'redis';

export interface SessionSnapshot {
  sessionId: string;
  userId: string;
  timestamp: number;
  context: SessionContext;
  chatHistory: ChatMessage[];
  socketState: {
    connected: boolean;
    lastHeartbeat: number;
    connectionId?: string;
  };
  recoveryMetadata: {
    snapshotReason: 'periodic' | 'disconnect' | 'error' | 'manual';
    version: string;
    checksum: string;
  };
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface RecoveryOptions {
  includeMessages: boolean;
  maxMessageHistory: number;
  includeContext: boolean;
  validateIntegrity: boolean;
  autoResume: boolean;
}

export interface RecoveryResult {
  success: boolean;
  sessionId: string;
  recoveryType: 'full' | 'partial' | 'failed';
  restoredContext?: SessionContext;
  restoredMessages?: ChatMessage[];
  warnings: string[];
  errors: string[];
  recoveryTime: number;
}

export interface ConnectionState {
  sessionId: string;
  userId: string;
  socketId: string;
  connected: boolean;
  lastHeartbeat: number;
  reconnectAttempts: number;
  lastDisconnect?: number;
  recoveryPending: boolean;
}

export class SessionRecovery extends EventEmitter {
  private sessionManager: SessionManager;
  private sessionRepository: SessionRepository;
  private redisClient: RedisClientType;
  
  private activeConnections: Map<string, ConnectionState> = new Map();
  private recoveryQueue: Map<string, SessionSnapshot> = new Map();
  private snapshotTimers: Map<string, any> = new Map();

  // Configuration
  private readonly SNAPSHOT_INTERVAL = 30 * 1000; // 30 seconds
  private readonly RECOVERY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RECOVERY_ATTEMPTS = 3;
  private readonly HEARTBEAT_INTERVAL = 10 * 1000; // 10 seconds
  private readonly CONNECTION_TIMEOUT = 60 * 1000; // 1 minute

  constructor(sessionManager: SessionManager) {
    super();
    this.sessionManager = sessionManager;
    this.sessionRepository = new SessionRepository();
    this.redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${parseInt(process.env.REDIS_PORT || '6379')}`,
    });

    this.setupEventListeners();
    this.setupConnectionMonitoring();
  }

  async initialize(): Promise<void> {
    try {
      await this.redisClient.ping();
      await this.restorePendingRecoveries();
      logger.info('Session recovery service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize session recovery service', { error });
      throw error;
    }
  }

  async createSnapshot(
    sessionId: string, 
    reason: SessionSnapshot['recoveryMetadata']['snapshotReason'] = 'periodic'
  ): Promise<void> {
    try {
      const context = await this.sessionManager.getSessionContext(sessionId);
      if (!context) {
        logger.warn('Cannot create snapshot - session context not found', { sessionId });
        return;
      }

      // Get chat history
      const chatHistory = await this.getChatHistory(sessionId);

      // Get connection state
      const connectionState = this.activeConnections.get(sessionId);

      // Create snapshot
      const snapshot: SessionSnapshot = {
        sessionId,
        userId: context.userId,
        timestamp: Date.now(),
        context: { ...context },
        chatHistory,
        socketState: {
          connected: connectionState?.connected || false,
          lastHeartbeat: connectionState?.lastHeartbeat || Date.now(),
          connectionId: connectionState?.socketId,
        },
        recoveryMetadata: {
          snapshotReason: reason,
          version: '1.0',
          checksum: this.calculateChecksum(context, chatHistory),
        },
      };

      // Store snapshot
      await this.storeSnapshot(snapshot);

      // Schedule next snapshot if periodic
      if (reason === 'periodic') {
        this.scheduleNextSnapshot(sessionId);
      }

      logger.debug('Session snapshot created', { sessionId, reason, messageCount: chatHistory.length });
    } catch (error) {
      logger.error('Failed to create session snapshot', { sessionId, reason, error });
    }
  }

  async recoverSession(
    sessionId: string, 
    userId: string, 
    options: Partial<RecoveryOptions> = {}
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const result: RecoveryResult = {
      success: false,
      sessionId,
      recoveryType: 'failed',
      warnings: [],
      errors: [],
      recoveryTime: 0,
    };

    try {
      logger.info('Starting session recovery', { sessionId, userId, options });

      // Get latest snapshot
      const snapshot = await this.getLatestSnapshot(sessionId);
      if (!snapshot) {
        result.errors.push('No recovery snapshot found for session');
        return result;
      }

      // Validate snapshot integrity
      if (options.validateIntegrity !== false && !this.validateSnapshot(snapshot)) {
        result.errors.push('Snapshot integrity validation failed');
        result.warnings.push('Attempting recovery with potentially corrupted data');
      }

      // Validate user access
      if (snapshot.userId !== userId) {
        result.errors.push('Unauthorized access to session recovery');
        return result;
      }

      // Check if session is already active
      const existingContext = await this.sessionManager.getSessionContext(sessionId);
      if (existingContext) {
        result.warnings.push('Session already active, skipping context recovery');
        result.recoveryType = 'partial';
      } else {
        // Restore session context
        await this.restoreSessionContext(snapshot.context);
        result.restoredContext = snapshot.context;
        result.recoveryType = 'full';
      }

      // Restore chat history if requested
      if (options.includeMessages !== false) {
        const maxMessages = options.maxMessageHistory || 100;
        const messages = snapshot.chatHistory.slice(-maxMessages);
        result.restoredMessages = messages;
        
        if (snapshot.chatHistory.length > maxMessages) {
          result.warnings.push(`Chat history truncated to last ${maxMessages} messages`);
        }
      }

      // Auto-resume session if requested
      if (options.autoResume && result.restoredContext) {
        await this.sessionManager.resumeSession(sessionId, userId);
        result.warnings.push('Session automatically resumed');
      }

      result.success = true;
      result.recoveryTime = Date.now() - startTime;

      // Emit recovery event
      this.emit('session_recovered', {
        sessionId,
        userId,
        recoveryType: result.recoveryType,
        recoveryTime: result.recoveryTime,
      });

      logger.info('Session recovery completed', { 
        sessionId, 
        userId, 
        recoveryType: result.recoveryType,
        recoveryTime: result.recoveryTime 
      });

    } catch (error) {
      result.errors.push(`Recovery failed: ${error instanceof Error ? error.message : String(error)}`);
      result.recoveryTime = Date.now() - startTime;
      logger.error('Session recovery failed', { sessionId, userId, error });
    }

    return result;
  }

  async restoreFromDisconnect(
    sessionId: string, 
    userId: string, 
    socketId: string
  ): Promise<RecoveryResult> {
    try {
      logger.info('Restoring session from disconnect', { sessionId, userId, socketId });

      // Mark connection as restored
      const connectionState = this.activeConnections.get(sessionId);
      if (connectionState) {
        connectionState.connected = true;
        connectionState.socketId = socketId;
        connectionState.lastHeartbeat = Date.now();
        connectionState.reconnectAttempts = 0;
        connectionState.recoveryPending = false;
      }

      // Attempt session recovery
      const result = await this.recoverSession(sessionId, userId, {
        includeMessages: true,
        maxMessageHistory: 50,
        autoResume: true,
        validateIntegrity: true,
      });

      if (result.success) {
        // Send recovery notification
        this.emit('connection_restored', {
          sessionId,
          userId,
          socketId,
          recoveryType: result.recoveryType,
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to restore from disconnect', { sessionId, userId, socketId, error });
      throw error;
    }
  }

  async trackConnection(sessionId: string, userId: string, socketId: string): Promise<void> {
    try {
      const connectionState: ConnectionState = {
        sessionId,
        userId,
        socketId,
        connected: true,
        lastHeartbeat: Date.now(),
        reconnectAttempts: 0,
        recoveryPending: false,
      };

      this.activeConnections.set(sessionId, connectionState);
      
      // Start periodic snapshots
      this.scheduleNextSnapshot(sessionId);

      logger.debug('Connection tracking started', { sessionId, userId, socketId });
    } catch (error) {
      logger.error('Failed to track connection', { sessionId, userId, socketId, error });
    }
  }

  async handleDisconnect(sessionId: string, reason?: string): Promise<void> {
    try {
      const connectionState = this.activeConnections.get(sessionId);
      if (!connectionState) {
        return;
      }

      connectionState.connected = false;
      connectionState.lastDisconnect = Date.now();
      connectionState.recoveryPending = true;

      // Create disconnect snapshot
      await this.createSnapshot(sessionId, 'disconnect');

      // Pause the session if it's active
      const context = await this.sessionManager.getSessionContext(sessionId);
      if (context) {
        await this.sessionManager.pauseSession(sessionId, context.userId, reason || 'Connection lost');
      }

      // Set recovery timeout
      setTimeout(async () => {
        const state = this.activeConnections.get(sessionId);
        if (state && !state.connected && state.recoveryPending) {
          await this.handleRecoveryTimeout(sessionId);
        }
      }, this.RECOVERY_TIMEOUT);

      logger.info('Connection disconnect handled', { sessionId, reason });
    } catch (error) {
      logger.error('Failed to handle disconnect', { sessionId, reason, error });
    }
  }

  async updateHeartbeat(sessionId: string): Promise<void> {
    try {
      const connectionState = this.activeConnections.get(sessionId);
      if (connectionState) {
        connectionState.lastHeartbeat = Date.now();
        
        // Reset recovery pending if connection is restored
        if (!connectionState.connected) {
          connectionState.connected = true;
          connectionState.recoveryPending = false;
          logger.info('Connection restored via heartbeat', { sessionId });
        }
      }
    } catch (error) {
      logger.error('Failed to update heartbeat', { sessionId, error });
    }
  }

  async getRecoveryStatus(sessionId: string): Promise<{
    hasSnapshot: boolean;
    lastSnapshot: number;
    connectionState: ConnectionState | null;
    recoveryAvailable: boolean;
  }> {
    try {
      const snapshot = await this.getLatestSnapshot(sessionId);
      const connectionState = this.activeConnections.get(sessionId) || null;

      return {
        hasSnapshot: !!snapshot,
        lastSnapshot: snapshot?.timestamp || 0,
        connectionState,
        recoveryAvailable: !!snapshot && (!connectionState || !connectionState.connected),
      };
    } catch (error) {
      logger.error('Failed to get recovery status', { sessionId, error });
      return {
        hasSnapshot: false,
        lastSnapshot: 0,
        connectionState: null,
        recoveryAvailable: false,
      };
    }
  }

  async listRecoverableSessions(userId: string): Promise<SessionSnapshot[]> {
    try {
      const snapshots: SessionSnapshot[] = [];
      const keys = await this.redisClient.keys(`recovery:${userId}:*`);
      
      for (const key of keys) {
        const data = await this.redisClient.get(key);
        if (data) {
          try {
            const snapshot = JSON.parse(data);
            snapshots.push(snapshot);
          } catch (parseError) {
            logger.warn('Failed to parse recovery snapshot', { key, parseError });
          }
        }
      }

      // Sort by timestamp (newest first)
      return snapshots.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Failed to list recoverable sessions', { userId, error });
      return [];
    }
  }

  async cleanupExpiredSnapshots(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const cutoffTime = Date.now() - maxAge;
      let cleanedCount = 0;
      
      const keys = await this.redisClient.keys('recovery:*');
      
      for (const key of keys) {
        const data = await this.redisClient.get(key);
        if (data) {
          try {
            const snapshot = JSON.parse(data);
            if (snapshot.timestamp < cutoffTime) {
              await this.redisClient.del(key);
              cleanedCount++;
            }
          } catch (parseError) {
            // Delete corrupted snapshots
            await this.redisClient.del(key);
            cleanedCount++;
          }
        }
      }

      logger.info('Expired snapshots cleaned up', { cleanedCount, maxAge });
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired snapshots', { maxAge, error });
      return 0;
    }
  }

  private async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const messages = await this.sessionRepository.findMessagesBySession(sessionId);
      return messages.map(msg => ({
        id: msg.id,
        sessionId: msg.sessionId || sessionId,
        senderType: msg.senderType as 'user' | 'ai' | 'system',
        content: msg.content,
        timestamp: msg.timestamp.getTime(),
        metadata: msg.metadata || {},
      }));
    } catch (error) {
      logger.error('Failed to get chat history for snapshot', { sessionId, error });
      return [];
    }
  }

  private calculateChecksum(context: SessionContext, messages: ChatMessage[]): string {
    const data = JSON.stringify({ context, messageCount: messages.length });
    // Simple checksum - in production, use a proper hash function
    return Buffer.from(data).toString('base64').slice(0, 16);
  }

  private validateSnapshot(snapshot: SessionSnapshot): boolean {
    try {
      const expectedChecksum = this.calculateChecksum(snapshot.context, snapshot.chatHistory);
      return expectedChecksum === snapshot.recoveryMetadata.checksum;
    } catch (error) {
      logger.error('Snapshot validation failed', { sessionId: snapshot.sessionId, error });
      return false;
    }
  }

  private async storeSnapshot(snapshot: SessionSnapshot): Promise<void> {
    const key = `recovery:${snapshot.userId}:${snapshot.sessionId}`;
    await this.redisClient.setEx(key, 24 * 3600, JSON.stringify(snapshot)); // 24 hours TTL
  }

  private async getLatestSnapshot(sessionId: string): Promise<SessionSnapshot | null> {
    try {
      const keys = await this.redisClient.keys(`recovery:*:${sessionId}`);
      if (keys.length === 0) {
        return null;
      }

      // Get the first (and likely only) snapshot
      const data = await this.redisClient.get(keys[0]);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get latest snapshot', { sessionId, error });
      return null;
    }
  }

  private async restoreSessionContext(context: SessionContext): Promise<void> {
    // This would integrate with the session manager to restore the context
    // For now, we'll use the existing session manager methods
    logger.debug('Restoring session context', { sessionId: context.sessionId });
    
    // The actual restoration would involve re-initializing the session state
    // This is a placeholder for the integration
  }

  private scheduleNextSnapshot(sessionId: string): void {
    // Clear existing timer
    const existingTimer = this.snapshotTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule next snapshot
    const timer = setTimeout(() => {
      this.createSnapshot(sessionId, 'periodic').catch(error => {
        logger.error('Scheduled snapshot failed', { sessionId, error });
      });
    }, this.SNAPSHOT_INTERVAL);

    this.snapshotTimers.set(sessionId, timer);
  }

  private async handleRecoveryTimeout(sessionId: string): Promise<void> {
    try {
      const connectionState = this.activeConnections.get(sessionId);
      if (!connectionState) {
        return;
      }

      logger.warn('Session recovery timeout reached', { sessionId });

      // Abandon the session if no recovery within timeout
      const context = await this.sessionManager.getSessionContext(sessionId);
      if (context) {
        await this.sessionManager.abandonSession(
          sessionId, 
          context.userId, 
          'Recovery timeout - no reconnection'
        );
      }

      // Cleanup connection tracking
      this.activeConnections.delete(sessionId);
      
      // Clear snapshot timer
      const timer = this.snapshotTimers.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        this.snapshotTimers.delete(sessionId);
      }

    } catch (error) {
      logger.error('Failed to handle recovery timeout', { sessionId, error });
    }
  }

  private async restorePendingRecoveries(): Promise<void> {
    try {
      // Get all recovery snapshots
      const keys = await this.redisClient.keys('recovery:*');
      let restoredCount = 0;

      for (const key of keys) {
        const data = await this.redisClient.get(key);
        if (data) {
          try {
            const snapshot = JSON.parse(data);
            
            // Check if session needs recovery (was connected recently but not active)
            if (snapshot.socketState.connected && 
                (Date.now() - snapshot.timestamp) < this.RECOVERY_TIMEOUT) {
              
              // Add to recovery queue for when user reconnects
              this.recoveryQueue.set(snapshot.sessionId, snapshot);
              restoredCount++;
            }
          } catch (parseError) {
            logger.warn('Failed to parse recovery snapshot during startup', { key, parseError });
          }
        }
      }

      logger.info('Pending recoveries restored', { restoredCount });
    } catch (error) {
      logger.error('Failed to restore pending recoveries', { error });
    }
  }

  private setupEventListeners(): void {
    // Listen to session manager events
    this.sessionManager.on('lifecycle_event', (event: SessionLifecycleEvent) => {
      this.handleSessionEvent(event).catch(error => {
        logger.error('Failed to handle session event in recovery service', { event, error });
      });
    });
  }

  private async handleSessionEvent(event: SessionLifecycleEvent): Promise<void> {
    switch (event.type) {
      case 'session_created':
      case 'session_started':
        // Session recovery will be handled when connection is tracked
        break;

      case 'session_completed':
      case 'session_abandoned':
      case 'session_escalated':
        // Cleanup recovery data for completed sessions
        await this.cleanupSessionRecovery(event.sessionId);
        break;

      case 'session_paused':
        // Create snapshot when session is paused
        await this.createSnapshot(event.sessionId, 'manual');
        break;
    }
  }

  private async cleanupSessionRecovery(sessionId: string): Promise<void> {
    try {
      // Remove from active connections
      this.activeConnections.delete(sessionId);
      
      // Clear snapshot timer
      const timer = this.snapshotTimers.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        this.snapshotTimers.delete(sessionId);
      }

      // Remove from recovery queue
      this.recoveryQueue.delete(sessionId);

      logger.debug('Session recovery data cleaned up', { sessionId });
    } catch (error) {
      logger.error('Failed to cleanup session recovery', { sessionId, error });
    }
  }

  private setupConnectionMonitoring(): void {
    // Monitor connection health
    setInterval(() => {
      const now = Date.now();
      
      for (const [sessionId, state] of this.activeConnections.entries()) {
        if (state.connected && (now - state.lastHeartbeat) > this.CONNECTION_TIMEOUT) {
          logger.warn('Connection timeout detected', { sessionId });
          this.handleDisconnect(sessionId, 'Heartbeat timeout').catch(error => {
            logger.error('Failed to handle connection timeout', { sessionId, error });
          });
        }
      }
    }, this.HEARTBEAT_INTERVAL);

    // Cleanup expired snapshots periodically
    setInterval(() => {
      this.cleanupExpiredSnapshots().catch(error => {
        logger.error('Periodic snapshot cleanup failed', { error });
      });
    }, 60 * 60 * 1000); // Every hour
  }

  async cleanup(): Promise<void> {
    try {
      // Clear all timers
      for (const timer of this.snapshotTimers.values()) {
        clearTimeout(timer);
      }
      this.snapshotTimers.clear();

      // Clear state
      this.activeConnections.clear();
      this.recoveryQueue.clear();

      // Close Redis connection
      await this.redisClient.quit();

      logger.info('Session recovery service cleaned up successfully');
    } catch (error) {
      logger.error('Failed to cleanup session recovery service', { error });
    }
  }
}

export default SessionRecovery;