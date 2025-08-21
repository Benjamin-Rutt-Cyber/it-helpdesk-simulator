import { Server as SocketIOServer, Socket } from 'socket.io';
import { typingService, TypingEvent } from '../services/typingService';
import { MessageChunker, MessageChunk } from '../services/messageChunker';
import { logger } from '../utils/logger';

export interface TypingSocketEvents {
  // Client to server events
  'start_typing': (_data: { sessionId: string }) => void;
  'stop_typing': (_data: { sessionId: string }) => void;
  'user_message': (_data: { sessionId: string; message: string }) => void;
  'typing_settings_update': (_data: { sessionId: string; settings: any }) => void;
  
  // Server to client events
  'typing_indicator_start': (_data: { sessionId: string; personaId: string }) => void;
  'typing_indicator_stop': (_data: { sessionId: string }) => void;
  'typing_indicator_pause': (_data: { sessionId: string; reason?: string }) => void;
  'typing_indicator_resume': (_data: { sessionId: string }) => void;
  'message_chunk': (_data: { sessionId: string; chunk: MessageChunk; totalChunks: number }) => void;
  'typing_interrupted': (_data: { sessionId: string }) => void;
  'typing_error': (_data: { sessionId: string; error: string }) => void;
}

export class TypingHandler {
  private io: SocketIOServer;
  private activeConnections: Map<string, Socket> = new Map();
  private sessionToSocket: Map<string, string> = new Map(); // sessionId -> socketId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupTypingServiceListeners();
  }

  handleConnection(socket: Socket): void {
    logger.info('Client connected for typing', { socketId: socket.id });
    
    this.activeConnections.set(socket.id, socket);

    // Handle session joining
    socket.on('join_session', (data: { sessionId: string }) => {
      this.handleJoinSession(socket, data.sessionId);
    });

    // Handle user typing events
    socket.on('user_typing_start', (data: { sessionId: string }) => {
      this.handleUserTypingStart(socket, data.sessionId);
    });

    socket.on('user_typing_stop', (data: { sessionId: string }) => {
      this.handleUserTypingStop(socket, data.sessionId);
    });

    // Handle user messages during AI typing
    socket.on('user_message_during_typing', (data: { sessionId: string; message: string }) => {
      this.handleUserMessageDuringTyping(socket, data.sessionId, data.message);
    });

    // Handle typing settings updates
    socket.on('update_typing_settings', (data: { sessionId: string; settings: any }) => {
      this.handleTypingSettingsUpdate(socket, data.sessionId, data.settings);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private handleJoinSession(socket: Socket, sessionId: string): void {
    logger.info('Client joining typing session', { socketId: socket.id, sessionId });
    
    // Leave previous session if any
    const previousSessionId = this.findSessionBySocket(socket.id);
    if (previousSessionId) {
      socket.leave(`typing_${previousSessionId}`);
      this.sessionToSocket.delete(previousSessionId);
    }

    // Join new session
    socket.join(`typing_${sessionId}`);
    this.sessionToSocket.set(sessionId, socket.id);

    // Send current typing state if any
    const typingState = typingService.getTypingState(sessionId);
    if (typingState && typingState.isTyping) {
      socket.emit('typing_indicator_start', {
        sessionId,
        personaId: 'unknown' // Would need to get from session context
      });
    }
  }

  private async handleUserTypingStart(socket: Socket, sessionId: string): Promise<void> {
    // Interrupt AI typing if it's active
    const wasInterrupted = await typingService.interruptTypingSimulation(sessionId);
    
    if (wasInterrupted) {
      socket.to(`typing_${sessionId}`).emit('typing_interrupted', { sessionId });
      logger.info('AI typing interrupted by user', { sessionId });
    }

    // Broadcast user typing to other participants (if any)
    socket.to(`typing_${sessionId}`).emit('user_typing_start', { sessionId });
  }

  private handleUserTypingStop(socket: Socket, sessionId: string): void {
    socket.to(`typing_${sessionId}`).emit('user_typing_stop', { sessionId });
  }

  private async handleUserMessageDuringTyping(socket: Socket, sessionId: string, message: string): Promise<void> {
    logger.info('User message received during AI typing', { sessionId, messageLength: message.length });
    
    // Interrupt current typing simulation
    const wasInterrupted = await typingService.interruptTypingSimulation(sessionId);
    
    if (wasInterrupted) {
      this.io.to(`typing_${sessionId}`).emit('typing_interrupted', { 
        sessionId,
        reason: 'user_message'
      });
    }

    // The message will be processed by the main message handler
    socket.emit('message_received', { sessionId, message });
  }

  private handleTypingSettingsUpdate(socket: Socket, sessionId: string, settings: any): void {
    const success = typingService.updateSettings(sessionId, settings);
    
    socket.emit('typing_settings_updated', {
      sessionId,
      success,
      settings
    });

    logger.info('Typing settings updated', { sessionId, settings, success });
  }

  private handleDisconnection(socket: Socket): void {
    logger.info('Client disconnected from typing', { socketId: socket.id });
    
    const sessionId = this.findSessionBySocket(socket.id);
    if (sessionId) {
      // Stop any active typing simulation for this session
      typingService.stopTypingSimulation(sessionId);
      this.sessionToSocket.delete(sessionId);
    }

    this.activeConnections.delete(socket.id);
  }

  private setupTypingServiceListeners(): void {
    typingService.on('typing_event', (event: TypingEvent) => {
      this.handleTypingEvent(event);
    });
  }

  private handleTypingEvent(event: TypingEvent): void {
    const room = `typing_${event.sessionId}`;
    
    switch (event.type) {
      case 'typing_start':
        this.io.to(room).emit('typing_indicator_start', {
          sessionId: event.sessionId,
          personaId: event.data?.personaId || 'unknown'
        });
        break;

      case 'typing_stop':
        this.io.to(room).emit('typing_indicator_stop', {
          sessionId: event.sessionId
        });
        break;

      case 'typing_pause':
        this.io.to(room).emit('typing_indicator_pause', {
          sessionId: event.sessionId,
          reason: event.data?.reason
        });
        break;

      case 'typing_resume':
        this.io.to(room).emit('typing_indicator_resume', {
          sessionId: event.sessionId
        });
        break;

      case 'chunk_delivered':
        this.io.to(room).emit('message_chunk', {
          sessionId: event.sessionId,
          chunk: event.data.chunk,
          totalChunks: event.data.totalChunks,
          isLast: event.data.isLast
        });
        break;

      case 'typing_interrupted':
        this.io.to(room).emit('typing_interrupted', {
          sessionId: event.sessionId,
          reason: event.data?.reason || 'unknown'
        });
        break;

      default:
        logger.warn('Unknown typing event type', { event });
    }
  }

  // Public methods for triggering typing simulations
  async startAITyping(
    sessionId: string,
    message: string,
    personaState: any,
    settings?: any
  ): Promise<boolean> {
    try {
      logger.info('Starting AI typing simulation', { sessionId, messageLength: message.length });
      
      // Start typing simulation
      await typingService.startTypingSimulation(
        sessionId,
        message,
        personaState,
        settings
      );

      // If chunking is enabled, set up chunk delivery
      if (settings?.chunkingEnabled !== false && message.length > 100) {
        await this.setupChunkedDelivery(sessionId, message, personaState.personaId);
      }

      return true;
    } catch (error) {
      logger.error('Failed to start AI typing', { sessionId, error });
      
      this.io.to(`typing_${sessionId}`).emit('typing_error', {
        sessionId,
        error: 'Failed to start typing simulation'
      });
      
      return false;
    }
  }

  async stopAITyping(sessionId: string): Promise<boolean> {
    try {
      await typingService.stopTypingSimulation(sessionId);
      return true;
    } catch (error) {
      logger.error('Failed to stop AI typing', { sessionId, error });
      return false;
    }
  }

  private async setupChunkedDelivery(sessionId: string, message: string, personaId: string): Promise<void> {
    // Get chunking strategy for persona
    const chunkingResult = MessageChunker.chunkMessage(message, personaId);
    
    if (chunkingResult.chunks.length <= 1) {
      return; // No chunking needed
    }

    logger.info('Setting up chunked message delivery', {
      sessionId,
      chunks: chunkingResult.chunks.length,
      totalDelay: chunkingResult.totalDelay
    });

    // Schedule chunk deliveries
    let cumulativeDelay = 0;
    
    chunkingResult.chunks.forEach((chunk, index) => {
      cumulativeDelay += chunk.delay;
      
      setTimeout(() => {
        const room = `typing_${sessionId}`;
        this.io.to(room).emit('message_chunk', {
          sessionId,
          chunk: {
            ...chunk,
            order: index
          },
          totalChunks: chunkingResult.chunks.length
        });
        
        logger.debug('Chunk delivered', { sessionId, chunkIndex: index, text: chunk.text });
      }, cumulativeDelay);
    });
  }

  private findSessionBySocket(socketId: string): string | undefined {
    for (const [sessionId, socketIdValue] of this.sessionToSocket.entries()) {
      if (socketIdValue === socketId) {
        return sessionId;
      }
    }
    return undefined;
  }

  // Health check method
  getActiveConnections(): { total: number; sessions: number } {
    return {
      total: this.activeConnections.size,
      sessions: this.sessionToSocket.size
    };
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    logger.info('Cleaning up typing handler');
    
    // Stop all active typing simulations
    const sessionIds = Array.from(this.sessionToSocket.keys());
    for (const sessionId of sessionIds) {
      await typingService.stopTypingSimulation(sessionId);
    }

    this.activeConnections.clear();
    this.sessionToSocket.clear();
  }
}

export default TypingHandler;