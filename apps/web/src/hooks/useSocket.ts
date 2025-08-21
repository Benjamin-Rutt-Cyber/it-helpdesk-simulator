import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  joinSession: (sessionId: string) => void;
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  startTyping: (sessionId: string) => void;
  stopTyping: (sessionId: string) => void;
  disconnect: () => void;
}

export const useSocket = (
  token?: string,
  onMessage?: (message: ChatMessage) => void,
  onTyping?: (data: { socketId: string; isTyping: boolean }) => void,
  onError?: (error: string) => void
): SocketHookReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
      
      // Handle reconnection
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        setIsReconnecting(true);
        reconnectTimeoutRef.current = setTimeout(() => {
          socket.connect();
        }, 1000);
      }
    });

    socket.on('reconnect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      console.log('Socket reconnected');
    });

    socket.on('reconnect_attempt', () => {
      setIsReconnecting(true);
      console.log('Attempting to reconnect...');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      setIsReconnecting(false);
      onError?.('Failed to reconnect to server');
    });

    socket.on('reconnect_failed', () => {
      setIsReconnecting(false);
      onError?.('Failed to reconnect to server after multiple attempts');
    });

    // Chat event handlers
    socket.on('message_received', (message: ChatMessage) => {
      onMessage?.(message);
    });

    socket.on('message_history', (messages: ChatMessage[]) => {
      // Handle initial message history load
      messages.forEach(message => onMessage?.(message));
    });

    socket.on('message_history_loaded', (data: { sessionId: string; messages: ChatMessage[]; hasMore: boolean }) => {
      // Handle paginated message history
      data.messages.forEach(message => onMessage?.(message));
    });

    socket.on('typing_status', (data: { socketId: string; isTyping: boolean }) => {
      onTyping?.(data);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      onError?.(error.message);
    });

    // Session event handlers
    socket.on('session_joined', (data: { sessionId: string }) => {
      console.log('Joined session:', data.sessionId);
    });

    socket.on('session_status_updated', (data: { sessionId: string; status: string }) => {
      console.log('Session status updated:', data);
    });

    socket.on('user_joined', (data: { socketId: string }) => {
      console.log('User joined session:', data.socketId);
    });

    socket.on('user_disconnected', (data: { socketId: string }) => {
      console.log('User disconnected from session:', data.socketId);
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, onMessage, onTyping, onError]);

  const joinSession = (sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_session', { sessionId });
    }
  };

  const sendMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', message);
    }
  };

  const startTyping = (sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { sessionId, isTyping: true });
    }
  };

  const stopTyping = (sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { sessionId, isTyping: false });
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    joinSession,
    sendMessage,
    startTyping,
    stopTyping,
    disconnect,
  };
};