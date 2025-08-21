import { chatRepository, CreateChatMessageData, ChatMessageEntity } from '../repositories/chatRepository';
import { ChatMessage } from '../sockets/chatHandler';
import { logger } from '../utils/logger';

export interface MessagePaginationOptions {
  limit?: number;
  offset?: number;
}

export interface MessageSearchOptions {
  query?: string;
  afterTimestamp?: Date;
  limit?: number;
}

export class ChatService {
  async saveMessage(data: CreateChatMessageData): Promise<ChatMessage> {
    try {
      const messageEntity = await chatRepository.createMessage(data);
      logger.info(`Message saved: ${messageEntity.id} in session ${messageEntity.sessionId}`);
      return chatRepository.toChatMessage(messageEntity);
    } catch (error) {
      logger.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }
  }

  async getSessionMessages(sessionId: string, options?: MessagePaginationOptions): Promise<ChatMessage[]> {
    try {
      const entities = await chatRepository.getMessagesBySession(
        sessionId,
        options?.limit,
        options?.offset
      );
      return entities.map(chatRepository.toChatMessage);
    } catch (error) {
      logger.error('Error fetching session messages:', error);
      throw new Error('Failed to fetch session messages');
    }
  }

  async getMessageById(messageId: string): Promise<ChatMessage | null> {
    try {
      const entity = await chatRepository.getMessageById(messageId);
      return entity ? chatRepository.toChatMessage(entity) : null;
    } catch (error) {
      logger.error('Error fetching message by ID:', error);
      throw new Error('Failed to fetch message');
    }
  }

  async updateMessage(messageId: string, updates: Partial<CreateChatMessageData>): Promise<ChatMessage | null> {
    try {
      const entity = await chatRepository.updateMessage(messageId, updates);
      if (!entity) {
        return null;
      }
      logger.info(`Message updated: ${messageId}`);
      return chatRepository.toChatMessage(entity);
    } catch (error) {
      logger.error('Error updating message:', error);
      throw new Error('Failed to update message');
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const success = await chatRepository.deleteMessage(messageId);
      if (success) {
        logger.info(`Message deleted: ${messageId}`);
      }
      return success;
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  async getMessageCount(sessionId: string): Promise<number> {
    try {
      return await chatRepository.getMessageCount(sessionId);
    } catch (error) {
      logger.error('Error getting message count:', error);
      throw new Error('Failed to get message count');
    }
  }

  async searchMessages(sessionId: string, options: MessageSearchOptions): Promise<ChatMessage[]> {
    try {
      let entities: ChatMessageEntity[] = [];

      if (options.query) {
        entities = await chatRepository.searchMessages(sessionId, options.query, options.limit);
      } else if (options.afterTimestamp) {
        entities = await chatRepository.getMessagesAfterTimestamp(sessionId, options.afterTimestamp);
      } else {
        entities = await chatRepository.getMessagesBySession(sessionId, options.limit);
      }

      return entities.map(chatRepository.toChatMessage);
    } catch (error) {
      logger.error('Error searching messages:', error);
      throw new Error('Failed to search messages');
    }
  }

  async getUserMessages(userId: string, options?: MessagePaginationOptions): Promise<ChatMessage[]> {
    try {
      const entities = await chatRepository.getMessagesByUser(
        userId,
        options?.limit,
        options?.offset
      );
      return entities.map(chatRepository.toChatMessage);
    } catch (error) {
      logger.error('Error fetching user messages:', error);
      throw new Error('Failed to fetch user messages');
    }
  }

  async getRecentMessages(sessionId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const entities = await chatRepository.getMessagesBySession(sessionId, limit);
      return entities.map(chatRepository.toChatMessage);
    } catch (error) {
      logger.error('Error fetching recent messages:', error);
      throw new Error('Failed to fetch recent messages');
    }
  }

  async loadMessageHistory(sessionId: string, beforeTimestamp?: Date, limit = 50): Promise<ChatMessage[]> {
    try {
      // If no beforeTimestamp provided, get latest messages
      if (!beforeTimestamp) {
        return await this.getRecentMessages(sessionId, limit);
      }

      // Get messages before the specified timestamp
      const entities = await chatRepository.getMessagesBySession(sessionId, limit);
      const filteredEntities = entities.filter(entity => 
        entity.timestamp.getTime() < beforeTimestamp.getTime()
      );

      return filteredEntities.map(chatRepository.toChatMessage);
    } catch (error) {
      logger.error('Error loading message history:', error);
      throw new Error('Failed to load message history');
    }
  }

  async markMessageAsDelivered(messageId: string): Promise<boolean> {
    try {
      const message = await chatRepository.getMessageById(messageId);
      if (!message) {
        return false;
      }

      const metadata = JSON.parse(message.metadata || '{}');
      metadata.delivered = true;
      metadata.deliveredAt = new Date();

      await chatRepository.updateMessage(messageId, { metadata });
      return true;
    } catch (error) {
      logger.error('Error marking message as delivered:', error);
      return false;
    }
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const message = await chatRepository.getMessageById(messageId);
      if (!message) {
        return false;
      }

      const metadata = JSON.parse(message.metadata || '{}');
      metadata.read = true;
      metadata.readAt = new Date();

      await chatRepository.updateMessage(messageId, { metadata });
      return true;
    } catch (error) {
      logger.error('Error marking message as read:', error);
      return false;
    }
  }

  async getSessionStats(sessionId: string): Promise<{
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    averageResponseTime: number;
  }> {
    try {
      const messages = await chatRepository.getMessagesBySession(sessionId);
      const totalMessages = messages.length;
      const userMessages = messages.filter(m => m.senderType === 'user').length;
      const aiMessages = messages.filter(m => m.senderType === 'ai').length;

      // Calculate average response time between user and AI messages
      let totalResponseTime = 0;
      let responseCount = 0;

      for (let i = 0; i < messages.length - 1; i++) {
        const currentMessage = messages[i];
        const nextMessage = messages[i + 1];

        if (currentMessage.senderType === 'user' && nextMessage.senderType === 'ai') {
          const responseTime = nextMessage.timestamp.getTime() - currentMessage.timestamp.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }

      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

      return {
        totalMessages,
        userMessages,
        aiMessages,
        averageResponseTime,
      };
    } catch (error) {
      logger.error('Error getting session stats:', error);
      throw new Error('Failed to get session stats');
    }
  }
}

export const chatService = new ChatService();