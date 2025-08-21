import { Socket, Server } from 'socket.io';
import { logger } from '../utils/logger';

export interface SessionData {
  sessionId: string;
  userId: string;
  status: 'active' | 'paused' | 'completed';
  connectedClients: string[];
  lastActivity: Date;
}

// In-memory session storage (will be replaced with Redis in Task 5)
const activeSessions = new Map<string, SessionData>();

export const setupSessionHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // Handle session creation/joining
    socket.on('create_session', async (data: { userId: string; sessionId: string }) => {
      try {
        const { userId, sessionId } = data;
        
        if (!userId || !sessionId) {
          socket.emit('error', { message: 'User ID and Session ID are required' });
          return;
        }

        // Create or update session
        const sessionData: SessionData = {
          sessionId,
          userId,
          status: 'active',
          connectedClients: [socket.id],
          lastActivity: new Date(),
        };

        activeSessions.set(sessionId, sessionData);
        
        // Join session room
        await socket.join(`session:${sessionId}`);
        socket.data.sessionId = sessionId;
        socket.data.userId = userId;
        
        logger.info(`Session created: ${sessionId} for user ${userId}`);
        
        // Confirm session creation
        socket.emit('session_created', {
          sessionId,
          status: 'active',
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error creating session:', error);
        socket.emit('error', { message: 'Failed to create session' });
      }
    });

    // Handle session status updates
    socket.on('update_session_status', async (data: { sessionId: string; status: 'active' | 'paused' | 'completed' }) => {
      try {
        const { sessionId, status } = data;
        
        const session = activeSessions.get(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Update session status
        session.status = status;
        session.lastActivity = new Date();
        activeSessions.set(sessionId, session);
        
        // Notify all clients in the session
        io.to(`session:${sessionId}`).emit('session_status_updated', {
          sessionId,
          status,
          timestamp: new Date(),
        });
        
        logger.info(`Session ${sessionId} status updated to ${status}`);
      } catch (error) {
        logger.error('Error updating session status:', error);
        socket.emit('error', { message: 'Failed to update session status' });
      }
    });

    // Handle session cleanup
    socket.on('cleanup_session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        
        const session = activeSessions.get(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Remove client from session
        session.connectedClients = session.connectedClients.filter(id => id !== socket.id);
        
        // If no clients left, mark session as completed
        if (session.connectedClients.length === 0) {
          session.status = 'completed';
          logger.info(`Session ${sessionId} completed - no connected clients`);
        }
        
        activeSessions.set(sessionId, session);
        
        // Leave the room
        await socket.leave(`session:${sessionId}`);
        
        socket.emit('session_cleaned', { sessionId });
      } catch (error) {
        logger.error('Error cleaning up session:', error);
        socket.emit('error', { message: 'Failed to cleanup session' });
      }
    });

    // Handle getting session info
    socket.on('get_session_info', (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        
        const session = activeSessions.get(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        socket.emit('session_info', {
          sessionId: session.sessionId,
          status: session.status,
          connectedClients: session.connectedClients.length,
          lastActivity: session.lastActivity,
        });
      } catch (error) {
        logger.error('Error getting session info:', error);
        socket.emit('error', { message: 'Failed to get session info' });
      }
    });

    // Handle disconnect - cleanup session
    socket.on('disconnect', () => {
      const sessionId = socket.data.sessionId;
      if (sessionId) {
        const session = activeSessions.get(sessionId);
        if (session) {
          // Remove client from session
          session.connectedClients = session.connectedClients.filter(id => id !== socket.id);
          
          // If no clients left, mark session as completed
          if (session.connectedClients.length === 0) {
            session.status = 'completed';
            logger.info(`Session ${sessionId} completed - client disconnected`);
          }
          
          activeSessions.set(sessionId, session);
        }
      }
    });
  });
};

export const getActiveSession = (sessionId: string): SessionData | undefined => {
  return activeSessions.get(sessionId);
};

export const getAllActiveSessions = (): SessionData[] => {
  return Array.from(activeSessions.values()).filter(session => session.status === 'active');
};