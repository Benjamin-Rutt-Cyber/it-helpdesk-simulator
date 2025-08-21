import { SessionRepository } from '../repositories/sessionRepository';
import { UserRepository } from '../repositories/userRepository';
import { chatService } from './chatService';
import { NotFoundError, ValidationError, AuthorizationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface MessageData {
  message: string;
  type: 'user' | 'system' | 'customer';
  userId: string;
}

export interface ResolveSessionData {
  resolution: string;
  escalated: boolean;
  userId: string;
}

export class SessionService {
  private sessionRepository: SessionRepository;
  private userRepository: UserRepository;

  constructor() {
    this.sessionRepository = new SessionRepository();
    this.userRepository = new UserRepository();
  }

  async getSessionById(id: string, userId: string) {
    try {
      const session = await this.sessionRepository.findById(id);
      
      if (!session) {
        throw new NotFoundError(`Session with ID ${id} not found`);
      }

      // Check if user has access to this session
      if (session.userId !== userId) {
        throw new AuthorizationError('Access denied to this session');
      }

      return session;
    } catch (error) {
      logger.error('Error retrieving session by ID', { id, userId, error });
      throw error;
    }
  }

  async sendMessage(sessionId: string, messageData: MessageData) {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      
      if (!session) {
        throw new NotFoundError(`Session with ID ${sessionId} not found`);
      }

      // Check if user has access to this session
      if (session.userId !== messageData.userId) {
        throw new AuthorizationError('Access denied to this session');
      }

      // Check if session is active
      if (session.status !== 'active') {
        throw new ValidationError('Cannot send message to inactive session');
      }

      // Create message
      await this.sessionRepository.createMessage(sessionId, messageData.userId, {
        content: messageData.message,
        type: messageData.type,
        senderType: 'user',
        metadata: {},
      });

      logger.info('Message sent in session', {
        sessionId,
        messageType: messageData.type,
        userId: messageData.userId,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error sending message', { sessionId, messageData, error });
      throw error;
    }
  }

  async resolveSession(sessionId: string, resolveData: ResolveSessionData) {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      
      if (!session) {
        throw new NotFoundError(`Session with ID ${sessionId} not found`);
      }

      // Check if user has access to this session
      if (session.userId !== resolveData.userId) {
        throw new AuthorizationError('Access denied to this session');
      }

      // Check if session is active
      if (session.status !== 'active') {
        throw new ValidationError('Cannot resolve inactive session');
      }

      // Update session status
      const updatedSession = await this.sessionRepository.update(sessionId, {
        status: resolveData.escalated ? 'abandoned' : 'completed',
      });

      logger.info('Session resolved', {
        sessionId,
        escalated: resolveData.escalated,
        userId: resolveData.userId,
      });

      return updatedSession;
    } catch (error) {
      logger.error('Error resolving session', { sessionId, resolveData, error });
      throw error;
    }
  }

  async getSessionMessages(sessionId: string, userId: string) {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      
      if (!session) {
        throw new NotFoundError(`Session with ID ${sessionId} not found`);
      }

      // Check if user has access to this session
      if (session.userId !== userId) {
        throw new AuthorizationError('Access denied to this session');
      }

      const messages = await this.sessionRepository.findMessagesBySession(sessionId);

      return messages;
    } catch (error) {
      logger.error('Error retrieving session messages', { sessionId, userId, error });
      throw error;
    }
  }

  async getUserActiveSessions(userId: string) {
    try {
      const sessions = await this.sessionRepository.findActiveSessionsByUser(userId);
      return sessions;
    } catch (error) {
      logger.error('Error retrieving user active sessions', { userId, error });
      throw error;
    }
  }

  async getUserCompletedSessions(userId: string) {
    try {
      const sessions = await this.sessionRepository.findCompletedSessionsByUser(userId);
      return sessions;
    } catch (error) {
      logger.error('Error retrieving user completed sessions', { userId, error });
      throw error;
    }
  }

  // Chat integration methods
  async getChatHistory(sessionId: string, userId: string) {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      
      if (!session) {
        throw new NotFoundError(`Session with ID ${sessionId} not found`);
      }

      // Check if user has access to this session
      if (session.userId !== userId) {
        throw new AuthorizationError('Access denied to this session');
      }

      // Get chat messages from the chat service
      const messages = await chatService.getSessionMessages(sessionId);
      
      return messages;
    } catch (error) {
      logger.error('Error retrieving chat history', { sessionId, userId, error });
      throw error;
    }
  }

  async initializeChatSession(sessionId: string, userId: string) {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      
      if (!session) {
        throw new NotFoundError(`Session with ID ${sessionId} not found`);
      }

      // Check if user has access to this session
      if (session.userId !== userId) {
        throw new AuthorizationError('Access denied to this session');
      }

      // Initialize chat session with welcome message
      const welcomeMessage = await chatService.saveMessage({
        sessionId,
        userId,
        senderType: 'ai',
        messageContent: 'Welcome to IT Support Chat! How can I help you today?',
        metadata: { type: 'welcome', automated: true },
      });

      // Update session with chat status
      await this.sessionRepository.update(sessionId, {
        status: 'active',
      });

      logger.info('Chat session initialized', { sessionId, userId });
      return welcomeMessage;
    } catch (error) {
      logger.error('Error initializing chat session', { sessionId, userId, error });
      throw error;
    }
  }

  async getChatStats(sessionId: string, userId: string) {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      
      if (!session) {
        throw new NotFoundError(`Session with ID ${sessionId} not found`);
      }

      // Check if user has access to this session
      if (session.userId !== userId) {
        throw new AuthorizationError('Access denied to this session');
      }

      // Get chat statistics
      const stats = await chatService.getSessionStats(sessionId);
      
      return stats;
    } catch (error) {
      logger.error('Error retrieving chat stats', { sessionId, userId, error });
      throw error;
    }
  }

  async completeChatSession(sessionId: string, userId: string) {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      
      if (!session) {
        throw new NotFoundError(`Session with ID ${sessionId} not found`);
      }

      // Check if user has access to this session
      if (session.userId !== userId) {
        throw new AuthorizationError('Access denied to this session');
      }

      // Add completion message
      const completionMessage = await chatService.saveMessage({
        sessionId,
        userId,
        senderType: 'ai',
        messageContent: 'Thank you for using IT Support Chat. Your session has been completed. If you need further assistance, please start a new session.',
        metadata: { type: 'completion', automated: true },
      });

      // Update session status
      await this.sessionRepository.update(sessionId, {
        status: 'completed',
        completedAt: new Date(),
      });

      logger.info('Chat session completed', { sessionId, userId });
      return completionMessage;
    } catch (error) {
      logger.error('Error completing chat session', { sessionId, userId, error });
      throw error;
    }
  }
}