import { Socket, Server } from 'socket.io';
import { authService } from '../services/authService';
import { chatService } from '../services/chatService';
import { logger } from '../utils/logger';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TypingStatus {
  sessionId: string;
  userId: string;
  isTyping: boolean;
}

export const setupChatHandlers = (io: Server) => {
  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      // Verify JWT token using authService
      const decoded = await authService.validateToken(token);
      socket.data.authenticated = true;
      socket.data.userId = decoded.userId;
      socket.data.token = token;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Chat client connected: ${socket.id}`);

    // Join session room
    socket.on('join_session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        if (!sessionId) {
          socket.emit('error', { message: 'Session ID is required' });
          return;
        }

        // Join the session room
        await socket.join(`session:${sessionId}`);
        socket.data.sessionId = sessionId;
        
        logger.info(`Socket ${socket.id} joined session ${sessionId}`);
        
        // Load and send message history
        try {
          const messageHistory = await chatService.getRecentMessages(sessionId, 50);
          socket.emit('message_history', messageHistory);
        } catch (error) {
          logger.error('Error loading message history:', error);
          // Continue without history if there's an error
        }
        
        // Confirm join
        socket.emit('session_joined', { sessionId });
        
        // Notify others in the room
        socket.to(`session:${sessionId}`).emit('user_joined', {
          socketId: socket.id,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Handle message sending
    socket.on('send_message', async (data: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      try {
        const { sessionId, senderType, content, metadata } = data;
        
        if (!sessionId || !content) {
          socket.emit('error', { message: 'Session ID and content are required' });
          return;
        }

        // Get user ID from socket data
        const userId = socket.data.userId;
        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Save message to database
        const savedMessage = await chatService.saveMessage({
          sessionId,
          userId,
          senderType,
          messageContent: content,
          metadata,
        });

        // Broadcast to all clients in the session
        io.to(`session:${sessionId}`).emit('message_received', savedMessage);
        
        // Send confirmation to sender
        socket.emit('message_sent', {
          id: savedMessage.id,
          timestamp: savedMessage.timestamp,
        });

        logger.info(`Message sent in session ${sessionId}: ${content.substring(0, 50)}...`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
      try {
        const { sessionId, isTyping } = data;
        
        if (!sessionId) {
          socket.emit('error', { message: 'Session ID is required' });
          return;
        }

        // Broadcast typing status to others in the session
        socket.to(`session:${sessionId}`).emit('typing_status', {
          socketId: socket.id,
          isTyping,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error handling typing:', error);
        socket.emit('error', { message: 'Failed to update typing status' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Chat client disconnected: ${socket.id}, reason: ${reason}`);
      
      // Notify session about disconnection
      if (socket.data.sessionId) {
        socket.to(`session:${socket.data.sessionId}`).emit('user_disconnected', {
          socketId: socket.id,
          timestamp: new Date(),
        });
      }
    });

    // Handle loading more message history
    socket.on('load_message_history', async (data: { sessionId: string; beforeTimestamp?: string; limit?: number }) => {
      try {
        const { sessionId, beforeTimestamp, limit = 50 } = data;
        
        if (!sessionId) {
          socket.emit('error', { message: 'Session ID is required' });
          return;
        }

        const timestamp = beforeTimestamp ? new Date(beforeTimestamp) : undefined;
        const messages = await chatService.loadMessageHistory(sessionId, timestamp, limit);
        
        socket.emit('message_history_loaded', {
          sessionId,
          messages,
          hasMore: messages.length === limit,
        });
      } catch (error) {
        logger.error('Error loading message history:', error);
        socket.emit('error', { message: 'Failed to load message history' });
      }
    });

    // Handle message search
    socket.on('search_messages', async (data: { sessionId: string; query: string; limit?: number }) => {
      try {
        const { sessionId, query, limit = 50 } = data;
        
        if (!sessionId || !query) {
          socket.emit('error', { message: 'Session ID and query are required' });
          return;
        }

        const messages = await chatService.searchMessages(sessionId, { query, limit });
        
        socket.emit('message_search_results', {
          sessionId,
          query,
          messages,
        });
      } catch (error) {
        logger.error('Error searching messages:', error);
        socket.emit('error', { message: 'Failed to search messages' });
      }
    });

    // Handle message delivery confirmation
    socket.on('mark_message_delivered', async (data: { messageId: string }) => {
      try {
        const { messageId } = data;
        
        if (!messageId) {
          socket.emit('error', { message: 'Message ID is required' });
          return;
        }

        const success = await chatService.markMessageAsDelivered(messageId);
        
        if (success) {
          socket.emit('message_delivery_confirmed', { messageId });
        }
      } catch (error) {
        logger.error('Error marking message as delivered:', error);
        socket.emit('error', { message: 'Failed to mark message as delivered' });
      }
    });

    // Handle message read confirmation
    socket.on('mark_message_read', async (data: { messageId: string }) => {
      try {
        const { messageId } = data;
        
        if (!messageId) {
          socket.emit('error', { message: 'Message ID is required' });
          return;
        }

        const success = await chatService.markMessageAsRead(messageId);
        
        if (success) {
          socket.emit('message_read_confirmed', { messageId });
        }
      } catch (error) {
        logger.error('Error marking message as read:', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });
};

// Helper function to generate message IDs
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};