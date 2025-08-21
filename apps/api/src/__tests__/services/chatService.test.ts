import { chatService, ChatService } from '../../services/chatService';
import { chatRepository } from '../../repositories/chatRepository';
import { ChatMessage } from '../../sockets/chatHandler';

// Mock the repository
jest.mock('../../repositories/chatRepository');

const mockedChatRepository = chatRepository as jest.Mocked<typeof chatRepository>;

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMessage', () => {
    it('should save message successfully', async () => {
      const mockEntity = {
        id: 'msg1',
        sessionId: 'session1',
        userId: 'user1',
        senderType: 'user' as const,
        messageContent: 'Hello!',
        messageType: 'text',
        metadata: '{}',
        timestamp: new Date()
      };

      const mockMessage: ChatMessage = {
        id: 'msg1',
        sessionId: 'session1',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      };

      mockedChatRepository.createMessage.mockResolvedValue(mockEntity);
      mockedChatRepository.toChatMessage.mockReturnValue(mockMessage);

      const result = await chatService.saveMessage({
        sessionId: 'session1',
        userId: 'user1',
        senderType: 'user',
        messageContent: 'Hello!'
      });

      expect(result).toEqual(mockMessage);
      expect(mockedChatRepository.createMessage).toHaveBeenCalledWith({
        sessionId: 'session1',
        userId: 'user1',
        senderType: 'user',
        messageContent: 'Hello!'
      });
    });

    it('should handle save errors', async () => {
      mockedChatRepository.createMessage.mockRejectedValue(new Error('Database error'));

      await expect(chatService.saveMessage({
        sessionId: 'session1',
        userId: 'user1',
        senderType: 'user',
        messageContent: 'Hello!'
      })).rejects.toThrow('Failed to save message');
    });
  });

  describe('getSessionMessages', () => {
    it('should retrieve session messages', async () => {
      const mockEntities = [
        {
          id: 'msg1',
          sessionId: 'session1',
          userId: 'user1',
          senderType: 'user' as const,
          messageContent: 'Hello!',
          messageType: 'text',
          metadata: '{}',
          timestamp: new Date()
        }
      ];

      const mockMessages: ChatMessage[] = [
        {
          id: 'msg1',
          sessionId: 'session1',
          senderType: 'user',
          content: 'Hello!',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      mockedChatRepository.getMessagesBySession.mockResolvedValue(mockEntities);
      mockedChatRepository.toChatMessage.mockReturnValue(mockMessages[0]);

      const result = await chatService.getSessionMessages('session1');

      expect(result).toEqual(mockMessages);
      expect(mockedChatRepository.getMessagesBySession).toHaveBeenCalledWith('session1', undefined, undefined);
    });

    it('should handle pagination options', async () => {
      mockedChatRepository.getMessagesBySession.mockResolvedValue([]);

      await chatService.getSessionMessages('session1', { limit: 10, offset: 5 });

      expect(mockedChatRepository.getMessagesBySession).toHaveBeenCalledWith('session1', 10, 5);
    });

    it('should handle retrieval errors', async () => {
      mockedChatRepository.getMessagesBySession.mockRejectedValue(new Error('Database error'));

      await expect(chatService.getSessionMessages('session1')).rejects.toThrow('Failed to fetch session messages');
    });
  });

  describe('getMessageById', () => {
    it('should retrieve message by ID', async () => {
      const mockEntity = {
        id: 'msg1',
        sessionId: 'session1',
        userId: 'user1',
        senderType: 'user' as const,
        messageContent: 'Hello!',
        messageType: 'text',
        metadata: '{}',
        timestamp: new Date()
      };

      const mockMessage: ChatMessage = {
        id: 'msg1',
        sessionId: 'session1',
        senderType: 'user',
        content: 'Hello!',
        timestamp: new Date(),
        metadata: {}
      };

      mockedChatRepository.getMessageById.mockResolvedValue(mockEntity);
      mockedChatRepository.toChatMessage.mockReturnValue(mockMessage);

      const result = await chatService.getMessageById('msg1');

      expect(result).toEqual(mockMessage);
      expect(mockedChatRepository.getMessageById).toHaveBeenCalledWith('msg1');
    });

    it('should return null for non-existent message', async () => {
      mockedChatRepository.getMessageById.mockResolvedValue(null);

      const result = await chatService.getMessageById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle retrieval errors', async () => {
      mockedChatRepository.getMessageById.mockRejectedValue(new Error('Database error'));

      await expect(chatService.getMessageById('msg1')).rejects.toThrow('Failed to fetch message');
    });
  });

  describe('updateMessage', () => {
    it('should update message successfully', async () => {
      const mockEntity = {
        id: 'msg1',
        sessionId: 'session1',
        userId: 'user1',
        senderType: 'user' as const,
        messageContent: 'Updated content',
        messageType: 'text',
        metadata: '{}',
        timestamp: new Date()
      };

      const mockMessage: ChatMessage = {
        id: 'msg1',
        sessionId: 'session1',
        senderType: 'user',
        content: 'Updated content',
        timestamp: new Date(),
        metadata: {}
      };

      mockedChatRepository.updateMessage.mockResolvedValue(mockEntity);
      mockedChatRepository.toChatMessage.mockReturnValue(mockMessage);

      const result = await chatService.updateMessage('msg1', {
        messageContent: 'Updated content'
      });

      expect(result).toEqual(mockMessage);
      expect(mockedChatRepository.updateMessage).toHaveBeenCalledWith('msg1', {
        messageContent: 'Updated content'
      });
    });

    it('should return null for non-existent message', async () => {
      mockedChatRepository.updateMessage.mockResolvedValue(null);

      const result = await chatService.updateMessage('non-existent', {
        messageContent: 'Updated content'
      });

      expect(result).toBeNull();
    });

    it('should handle update errors', async () => {
      mockedChatRepository.updateMessage.mockRejectedValue(new Error('Database error'));

      await expect(chatService.updateMessage('msg1', {
        messageContent: 'Updated content'
      })).rejects.toThrow('Failed to update message');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      mockedChatRepository.deleteMessage.mockResolvedValue(true);

      const result = await chatService.deleteMessage('msg1');

      expect(result).toBe(true);
      expect(mockedChatRepository.deleteMessage).toHaveBeenCalledWith('msg1');
    });

    it('should return false for non-existent message', async () => {
      mockedChatRepository.deleteMessage.mockResolvedValue(false);

      const result = await chatService.deleteMessage('non-existent');

      expect(result).toBe(false);
    });

    it('should handle deletion errors', async () => {
      mockedChatRepository.deleteMessage.mockRejectedValue(new Error('Database error'));

      await expect(chatService.deleteMessage('msg1')).rejects.toThrow('Failed to delete message');
    });
  });

  describe('searchMessages', () => {
    it('should search messages by query', async () => {
      const mockEntities = [
        {
          id: 'msg1',
          sessionId: 'session1',
          userId: 'user1',
          senderType: 'user' as const,
          messageContent: 'Hello world!',
          messageType: 'text',
          metadata: '{}',
          timestamp: new Date()
        }
      ];

      const mockMessages: ChatMessage[] = [
        {
          id: 'msg1',
          sessionId: 'session1',
          senderType: 'user',
          content: 'Hello world!',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      mockedChatRepository.searchMessages.mockResolvedValue(mockEntities);
      mockedChatRepository.toChatMessage.mockReturnValue(mockMessages[0]);

      const result = await chatService.searchMessages('session1', { query: 'hello' });

      expect(result).toEqual(mockMessages);
      expect(mockedChatRepository.searchMessages).toHaveBeenCalledWith('session1', 'hello', undefined);
    });

    it('should search messages after timestamp', async () => {
      const afterTimestamp = new Date();
      mockedChatRepository.getMessagesAfterTimestamp.mockResolvedValue([]);

      await chatService.searchMessages('session1', { afterTimestamp });

      expect(mockedChatRepository.getMessagesAfterTimestamp).toHaveBeenCalledWith('session1', afterTimestamp);
    });

    it('should handle search errors', async () => {
      mockedChatRepository.searchMessages.mockRejectedValue(new Error('Database error'));

      await expect(chatService.searchMessages('session1', { query: 'hello' })).rejects.toThrow('Failed to search messages');
    });
  });

  describe('markMessageAsDelivered', () => {
    it('should mark message as delivered', async () => {
      const mockEntity = {
        id: 'msg1',
        sessionId: 'session1',
        userId: 'user1',
        senderType: 'user' as const,
        messageContent: 'Hello!',
        messageType: 'text',
        metadata: '{}',
        timestamp: new Date()
      };

      mockedChatRepository.getMessageById.mockResolvedValue(mockEntity);
      mockedChatRepository.updateMessage.mockResolvedValue(mockEntity);

      const result = await chatService.markMessageAsDelivered('msg1');

      expect(result).toBe(true);
      expect(mockedChatRepository.updateMessage).toHaveBeenCalledWith('msg1', {
        metadata: expect.objectContaining({
          delivered: true,
          deliveredAt: expect.any(Date)
        })
      });
    });

    it('should return false for non-existent message', async () => {
      mockedChatRepository.getMessageById.mockResolvedValue(null);

      const result = await chatService.markMessageAsDelivered('non-existent');

      expect(result).toBe(false);
    });

    it('should handle marking errors', async () => {
      const mockEntity = {
        id: 'msg1',
        sessionId: 'session1',
        userId: 'user1',
        senderType: 'user' as const,
        messageContent: 'Hello!',
        messageType: 'text',
        metadata: '{}',
        timestamp: new Date()
      };

      mockedChatRepository.getMessageById.mockResolvedValue(mockEntity);
      mockedChatRepository.updateMessage.mockRejectedValue(new Error('Database error'));

      const result = await chatService.markMessageAsDelivered('msg1');

      expect(result).toBe(false);
    });
  });

  describe('getSessionStats', () => {
    it('should calculate session statistics', async () => {
      const mockEntities = [
        {
          id: 'msg1',
          sessionId: 'session1',
          userId: 'user1',
          senderType: 'user' as const,
          messageContent: 'Hello!',
          messageType: 'text',
          metadata: '{}',
          timestamp: new Date('2023-01-01T10:00:00Z')
        },
        {
          id: 'msg2',
          sessionId: 'session1',
          userId: 'user1',
          senderType: 'ai' as const,
          messageContent: 'Hi there!',
          messageType: 'text',
          metadata: '{}',
          timestamp: new Date('2023-01-01T10:00:30Z') // 30 seconds later
        }
      ];

      mockedChatRepository.getMessagesBySession.mockResolvedValue(mockEntities);

      const result = await chatService.getSessionStats('session1');

      expect(result).toEqual({
        totalMessages: 2,
        userMessages: 1,
        aiMessages: 1,
        averageResponseTime: 30000 // 30 seconds in milliseconds
      });
    });

    it('should handle empty session', async () => {
      mockedChatRepository.getMessagesBySession.mockResolvedValue([]);

      const result = await chatService.getSessionStats('session1');

      expect(result).toEqual({
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        averageResponseTime: 0
      });
    });

    it('should handle stats calculation errors', async () => {
      mockedChatRepository.getMessagesBySession.mockRejectedValue(new Error('Database error'));

      await expect(chatService.getSessionStats('session1')).rejects.toThrow('Failed to get session stats');
    });
  });
});