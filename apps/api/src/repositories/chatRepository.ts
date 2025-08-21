import { PrismaClient } from '@prisma/client';
import { ChatMessage } from '../sockets/chatHandler';

const prisma = new PrismaClient();

export interface ChatMessageEntity {
  id: string;
  sessionId: string;
  userId: string;
  senderType: 'user' | 'ai';
  messageContent: string;
  messageType: string;
  metadata: string;
  timestamp: Date;
}

export interface CreateChatMessageData {
  sessionId: string;
  userId: string;
  senderType: 'user' | 'ai';
  messageContent: string;
  messageType?: string;
  metadata?: Record<string, any>;
}

export class ChatRepository {
  async createMessage(data: CreateChatMessageData): Promise<ChatMessageEntity> {
    const message = await prisma.chatMessage.create({
      data: {
        sessionId: data.sessionId,
        userId: data.userId,
        senderType: data.senderType,
        messageContent: data.messageContent,
        messageType: data.messageType || 'text',
        metadata: JSON.stringify(data.metadata || {}),
      },
    });

    return this.mapPrismaMessageToEntity(message);
  }

  async getMessagesBySession(sessionId: string, limit?: number, offset?: number): Promise<ChatMessageEntity[]> {
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: limit,
      skip: offset,
    });

    return messages.map(this.mapPrismaMessageToEntity);
  }

  async getMessageById(messageId: string): Promise<ChatMessageEntity | null> {
    const message = await prisma.chatMessage.findUnique({
      where: {
        id: messageId,
      },
    });

    return message ? this.mapPrismaMessageToEntity(message) : null;
  }

  async updateMessage(messageId: string, updates: Partial<CreateChatMessageData>): Promise<ChatMessageEntity | null> {
    const updateData: any = {};
    
    if (updates.messageContent !== undefined) {
      updateData.messageContent = updates.messageContent;
    }
    if (updates.messageType !== undefined) {
      updateData.messageType = updates.messageType;
    }
    if (updates.metadata !== undefined) {
      updateData.metadata = JSON.stringify(updates.metadata);
    }

    const message = await prisma.chatMessage.update({
      where: {
        id: messageId,
      },
      data: updateData,
    });

    return this.mapPrismaMessageToEntity(message);
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await prisma.chatMessage.delete({
        where: {
          id: messageId,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getMessageCount(sessionId: string): Promise<number> {
    return await prisma.chatMessage.count({
      where: {
        sessionId,
      },
    });
  }

  async searchMessages(sessionId: string, query: string, limit = 50): Promise<ChatMessageEntity[]> {
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
        messageContent: {
          contains: query,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return messages.map(this.mapPrismaMessageToEntity);
  }

  async getMessagesAfterTimestamp(sessionId: string, timestamp: Date): Promise<ChatMessageEntity[]> {
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
        timestamp: {
          gt: timestamp,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return messages.map(this.mapPrismaMessageToEntity);
  }

  async getMessagesByUser(userId: string, limit?: number, offset?: number): Promise<ChatMessageEntity[]> {
    const messages = await prisma.chatMessage.findMany({
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return messages.map(this.mapPrismaMessageToEntity);
  }

  private mapPrismaMessageToEntity(message: any): ChatMessageEntity {
    return {
      id: message.id,
      sessionId: message.sessionId,
      userId: message.userId,
      senderType: message.senderType as 'user' | 'ai',
      messageContent: message.messageContent,
      messageType: message.messageType,
      metadata: message.metadata,
      timestamp: message.timestamp,
    };
  }

  // Convert ChatMessageEntity to ChatMessage for socket events
  toChatMessage(entity: ChatMessageEntity): ChatMessage {
    return {
      id: entity.id,
      sessionId: entity.sessionId,
      senderType: entity.senderType,
      content: entity.messageContent,
      timestamp: entity.timestamp,
      metadata: JSON.parse(entity.metadata || '{}'),
    };
  }
}

export const chatRepository = new ChatRepository();