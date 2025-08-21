import { create } from 'zustand';
import { ChatMessage } from '../hooks/useSocket';

export interface TypingUser {
  socketId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ChatState {
  // Messages
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Connection
  isConnected: boolean;
  isReconnecting: boolean;
  
  // Session
  currentSessionId: string | null;
  
  // Typing indicators
  typingUsers: TypingUser[];
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (connected: boolean, reconnecting?: boolean) => void;
  setCurrentSession: (sessionId: string | null) => void;
  updateTypingStatus: (socketId: string, isTyping: boolean) => void;
  clearTypingStatus: () => void;
  
  // Message operations
  markMessageAsDelivered: (messageId: string) => void;
  markMessageAsRead: (messageId: string) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  
  // Utility
  getMessagesBySession: (sessionId: string) => ChatMessage[];
  getTypingUsers: () => TypingUser[];
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isLoading: false,
  error: null,
  isConnected: false,
  isReconnecting: false,
  currentSessionId: null,
  typingUsers: [],

  // Message actions
  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
      error: null,
    }));
  },

  setMessages: (messages: ChatMessage[]) => {
    set({ messages, error: null });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Connection actions
  setConnectionStatus: (connected: boolean, reconnecting = false) => {
    set({
      isConnected: connected,
      isReconnecting: reconnecting,
    });
  },

  // Session actions
  setCurrentSession: (sessionId: string | null) => {
    set({ currentSessionId: sessionId });
  },

  // Typing actions
  updateTypingStatus: (socketId: string, isTyping: boolean) => {
    set((state) => {
      const filteredUsers = state.typingUsers.filter(user => user.socketId !== socketId);
      
      if (isTyping) {
        return {
          typingUsers: [
            ...filteredUsers,
            { socketId, isTyping, timestamp: new Date() },
          ],
        };
      } else {
        return {
          typingUsers: filteredUsers,
        };
      }
    });
  },

  clearTypingStatus: () => {
    set({ typingUsers: [] });
  },

  // Message operations
  markMessageAsDelivered: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId
          ? { ...msg, metadata: { ...msg.metadata, delivered: true } }
          : msg
      ),
    }));
  },

  markMessageAsRead: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId
          ? { ...msg, metadata: { ...msg.metadata, read: true } }
          : msg
      ),
    }));
  },

  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => {
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    }));
  },

  // Utility functions
  getMessagesBySession: (sessionId: string) => {
    const state = get();
    return state.messages.filter(msg => msg.sessionId === sessionId);
  },

  getTypingUsers: () => {
    const state = get();
    // Filter out typing users that are older than 5 seconds
    const now = new Date();
    return state.typingUsers.filter(user => {
      const timeDiff = now.getTime() - user.timestamp.getTime();
      return timeDiff < 5000; // 5 seconds
    });
  },

  reset: () => {
    set({
      messages: [],
      isLoading: false,
      error: null,
      isConnected: false,
      isReconnecting: false,
      currentSessionId: null,
      typingUsers: [],
    });
  },
}));