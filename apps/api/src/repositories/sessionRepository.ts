import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserSession {
  id: string;
  userId: string;
  scenarioId: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  chatHistory: any[];
  performanceData: any;
  verificationStatus: any;
  resolutionData: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionData {
  userId: string;
  scenarioId: string;
}

export interface UpdateSessionData {
  status?: string;
  completedAt?: Date;
  chatHistory?: any[];
  performanceData?: any;
  verificationStatus?: any;
  resolutionData?: any;
}

export class SessionRepository {
  async create(sessionData: CreateSessionData): Promise<UserSession> {
    const session = await prisma.userSession.create({
      data: {
        userId: sessionData.userId,
        scenarioId: sessionData.scenarioId,
        status: 'active',
        chatHistory: '[]',
        performanceData: '{}',
        verificationStatus: '{}',
        resolutionData: '{}',
      },
    });
    
    return this.mapPrismaSessionToSession(session);
  }

  async findById(id: string): Promise<UserSession | null> {
    const session = await prisma.userSession.findUnique({
      where: { id },
      include: {
        user: true,
        scenario: true,
        chatMessages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
    
    return session ? this.mapPrismaSessionToSession(session) : null;
  }

  async findByUserId(userId: string): Promise<UserSession[]> {
    const sessions = await prisma.userSession.findMany({
      where: { userId },
      include: {
        scenario: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return sessions.map(this.mapPrismaSessionToSession);
  }

  async findActiveByUserId(userId: string): Promise<UserSession[]> {
    const sessions = await prisma.userSession.findMany({
      where: { 
        userId,
        status: 'active'
      },
      include: {
        scenario: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return sessions.map(this.mapPrismaSessionToSession);
  }

  async findByUserIdAndScenarioId(userId: string, scenarioId: string): Promise<UserSession[]> {
    const sessions = await prisma.userSession.findMany({
      where: { 
        userId,
        scenarioId
      },
      include: {
        scenario: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return sessions.map(this.mapPrismaSessionToSession);
  }

  async update(id: string, sessionData: UpdateSessionData): Promise<UserSession> {
    const updateData: any = {};
    
    if (sessionData.status !== undefined) {
      updateData.status = sessionData.status;
    }
    
    if (sessionData.completedAt !== undefined) {
      updateData.completedAt = sessionData.completedAt;
    }
    
    if (sessionData.chatHistory !== undefined) {
      updateData.chatHistory = typeof sessionData.chatHistory === 'string' 
        ? sessionData.chatHistory 
        : JSON.stringify(sessionData.chatHistory);
    }
    
    if (sessionData.performanceData !== undefined) {
      updateData.performanceData = typeof sessionData.performanceData === 'string' 
        ? sessionData.performanceData 
        : JSON.stringify(sessionData.performanceData);
    }
    
    if (sessionData.verificationStatus !== undefined) {
      updateData.verificationStatus = typeof sessionData.verificationStatus === 'string' 
        ? sessionData.verificationStatus 
        : JSON.stringify(sessionData.verificationStatus);
    }
    
    if (sessionData.resolutionData !== undefined) {
      updateData.resolutionData = typeof sessionData.resolutionData === 'string' 
        ? sessionData.resolutionData 
        : JSON.stringify(sessionData.resolutionData);
    }

    const session = await prisma.userSession.update({
      where: { id },
      data: updateData,
    });
    
    return this.mapPrismaSessionToSession(session);
  }

  async addChatMessage(sessionId: string, userId: string, message: any): Promise<void> {
    await prisma.chatMessage.create({
      data: {
        sessionId,
        userId,
        senderType: message.senderType || 'user',
        messageContent: message.content,
        messageType: message.type || 'text',
        metadata: message.metadata || {},
      },
    });
  }

  async getChatHistory(sessionId: string): Promise<any[]> {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    
    return messages.map(msg => ({
      id: msg.id,
      senderType: msg.senderType,
      content: msg.messageContent,
      type: msg.messageType,
      metadata: msg.metadata,
      timestamp: msg.timestamp,
    }));
  }

  async completeSession(id: string, resolutionData: any): Promise<UserSession> {
    const session = await prisma.userSession.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        resolutionData: typeof resolutionData === 'string' 
          ? resolutionData 
          : JSON.stringify(resolutionData),
      },
    });
    
    return this.mapPrismaSessionToSession(session);
  }

  async abandonSession(id: string): Promise<UserSession> {
    const session = await prisma.userSession.update({
      where: { id },
      data: {
        status: 'abandoned',
        completedAt: new Date(),
      },
    });
    
    return this.mapPrismaSessionToSession(session);
  }

  async findCompletedSessionsByUser(userId: string): Promise<UserSession[]> {
    const sessions = await prisma.userSession.findMany({
      where: { 
        userId,
        status: 'completed'
      },
      include: {
        scenario: true,
      },
      orderBy: { completedAt: 'desc' },
    });
    
    return sessions.map(this.mapPrismaSessionToSession);
  }

  async findActiveSessionsByUser(userId: string): Promise<UserSession[]> {
    const sessions = await prisma.userSession.findMany({
      where: { 
        userId,
        status: 'active'
      },
      include: {
        scenario: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return sessions.map(this.mapPrismaSessionToSession);
  }

  async findActiveSessionByUserAndScenario(userId: string, scenarioId: string): Promise<UserSession | null> {
    const session = await prisma.userSession.findFirst({
      where: { 
        userId,
        scenarioId,
        status: 'active'
      },
      include: {
        scenario: true,
      },
    });
    
    return session ? this.mapPrismaSessionToSession(session) : null;
  }

  async createMessage(sessionId: string, userId: string, messageData: any): Promise<void> {
    await prisma.chatMessage.create({
      data: {
        sessionId,
        userId,
        senderType: messageData.senderType || 'user',
        messageContent: messageData.content,
        messageType: messageData.type || 'text',
        metadata: messageData.metadata || {},
      },
    });
  }

  async findMessagesBySession(sessionId: string): Promise<any[]> {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    
    return messages.map(msg => ({
      id: msg.id,
      senderType: msg.senderType,
      content: msg.messageContent,
      type: msg.messageType,
      metadata: msg.metadata,
      timestamp: msg.timestamp,
    }));
  }

  private mapPrismaSessionToSession(prismaSession: any): UserSession {
    return {
      id: prismaSession.id,
      userId: prismaSession.userId,
      scenarioId: prismaSession.scenarioId,
      status: prismaSession.status,
      startedAt: prismaSession.startedAt,
      completedAt: prismaSession.completedAt,
      chatHistory: typeof prismaSession.chatHistory === 'string' 
        ? JSON.parse(prismaSession.chatHistory) 
        : prismaSession.chatHistory || [],
      performanceData: typeof prismaSession.performanceData === 'string' 
        ? JSON.parse(prismaSession.performanceData) 
        : prismaSession.performanceData || {},
      verificationStatus: typeof prismaSession.verificationStatus === 'string' 
        ? JSON.parse(prismaSession.verificationStatus) 
        : prismaSession.verificationStatus || {},
      resolutionData: typeof prismaSession.resolutionData === 'string' 
        ? JSON.parse(prismaSession.resolutionData) 
        : prismaSession.resolutionData || {},
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt,
    };
  }
}

export const sessionRepository = new SessionRepository();