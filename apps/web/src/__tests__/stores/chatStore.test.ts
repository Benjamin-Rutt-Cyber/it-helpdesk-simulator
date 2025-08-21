import { act, renderHook } from '@testing-library/react';
import { useChatStore } from '../../stores/chatStore';
import { ChatMessage } from '../../hooks/useSocket';

describe('ChatStore', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useChatStore.getState().reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useChatStore());
      
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.currentSessionId).toBe(null);
      expect(result.current.typingUsers).toEqual([]);
    });
  });

  describe('Message Management', () => {
    it('should add a message', () => {
      const { result } = renderHook(() => useChatStore());
      
      const message: ChatMessage = {
        id: 'msg1',
        sessionId: 'session1',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      };

      act(() => {
        result.current.addMessage(message);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual(message);
      expect(result.current.error).toBe(null);
    });

    it('should set messages', () => {
      const { result } = renderHook(() => useChatStore());
      
      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          sessionId: 'session1',
          senderType: 'user',
          content: 'Hello!',
          timestamp: new Date(),
          metadata: {}
        },
        {
          id: 'msg2',
          sessionId: 'session1',
          senderType: 'ai',
          content: 'Hi there!',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      act(() => {
        result.current.setMessages(messages);
      });

      expect(result.current.messages).toEqual(messages);
      expect(result.current.error).toBe(null);
    });

    it('should clear messages', () => {
      const { result } = renderHook(() => useChatStore());
      
      const message: ChatMessage = {
        id: 'msg1',
        sessionId: 'session1',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      };

      act(() => {
        result.current.addMessage(message);
      });

      expect(result.current.messages).toHaveLength(1);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should update message', () => {
      const { result } = renderHook(() => useChatStore());
      
      const message: ChatMessage = {
        id: 'msg1',
        sessionId: 'session1',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      };

      act(() => {
        result.current.addMessage(message);
      });

      act(() => {
        result.current.updateMessage('msg1', { content: 'Updated message' });
      });

      expect(result.current.messages[0].content).toBe('Updated message');
    });

    it('should mark message as delivered', () => {
      const { result } = renderHook(() => useChatStore());
      
      const message: ChatMessage = {
        id: 'msg1',
        sessionId: 'session1',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      };

      act(() => {
        result.current.addMessage(message);
      });

      act(() => {
        result.current.markMessageAsDelivered('msg1');
      });

      expect(result.current.messages[0].metadata?.delivered).toBe(true);
    });

    it('should mark message as read', () => {
      const { result } = renderHook(() => useChatStore());
      
      const message: ChatMessage = {
        id: 'msg1',
        sessionId: 'session1',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      };

      act(() => {
        result.current.addMessage(message);
      });

      act(() => {
        result.current.markMessageAsRead('msg1');
      });

      expect(result.current.messages[0].metadata?.read).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });

    it('should set connection status', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setConnectionStatus(true, false);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isReconnecting).toBe(false);
    });

    it('should set current session', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setCurrentSession('session1');
      });

      expect(result.current.currentSessionId).toBe('session1');
    });
  });

  describe('Typing Management', () => {
    it('should update typing status', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.updateTypingStatus('socket1', true);
      });

      expect(result.current.typingUsers).toHaveLength(1);
      expect(result.current.typingUsers[0].socketId).toBe('socket1');
      expect(result.current.typingUsers[0].isTyping).toBe(true);
    });

    it('should remove typing status', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.updateTypingStatus('socket1', true);
      });

      expect(result.current.typingUsers).toHaveLength(1);

      act(() => {
        result.current.updateTypingStatus('socket1', false);
      });

      expect(result.current.typingUsers).toHaveLength(0);
    });

    it('should clear typing status', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.updateTypingStatus('socket1', true);
        result.current.updateTypingStatus('socket2', true);
      });

      expect(result.current.typingUsers).toHaveLength(2);

      act(() => {
        result.current.clearTypingStatus();
      });

      expect(result.current.typingUsers).toHaveLength(0);
    });

    it('should filter old typing users', () => {
      const { result } = renderHook(() => useChatStore());
      
      // Add a typing user with old timestamp
      const oldTimestamp = new Date(Date.now() - 10000); // 10 seconds ago
      
      act(() => {
        result.current.typingUsers.push({
          socketId: 'socket1',
          isTyping: true,
          timestamp: oldTimestamp
        });
      });

      const typingUsers = result.current.getTypingUsers();
      expect(typingUsers).toHaveLength(0); // Should be filtered out
    });
  });

  describe('Utility Functions', () => {
    it('should get messages by session', () => {
      const { result } = renderHook(() => useChatStore());
      
      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          sessionId: 'session1',
          senderType: 'user',
          content: 'Hello!',
          timestamp: new Date(),
          metadata: {}
        },
        {
          id: 'msg2',
          sessionId: 'session2',
          senderType: 'user',
          content: 'Hi!',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      act(() => {
        result.current.setMessages(messages);
      });

      const session1Messages = result.current.getMessagesBySession('session1');
      expect(session1Messages).toHaveLength(1);
      expect(session1Messages[0].id).toBe('msg1');
    });

    it('should reset store state', () => {
      const { result } = renderHook(() => useChatStore());
      
      // Set some state
      act(() => {
        result.current.addMessage({
          id: 'msg1',
          sessionId: 'session1',
          senderType: 'user',
          content: 'Hello!',
          timestamp: new Date(),
          metadata: {}
        });
        result.current.setLoading(true);
        result.current.setError('Test error');
        result.current.setConnectionStatus(true, false);
        result.current.setCurrentSession('session1');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.currentSessionId).toBe(null);
      expect(result.current.typingUsers).toEqual([]);
    });
  });
});