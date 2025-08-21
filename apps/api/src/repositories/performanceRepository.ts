import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PerformanceMetric {
  id: string;
  userId: string;
  sessionId: string;
  scenarioId: string;
  verificationScore: number;
  communicationScore: number;
  technicalScore: number;
  documentationScore: number;
  responseTimeScore: number;
  overallScore: number;
  xpEarned: number;
  completionTime: number;
  createdAt: Date;
}

export interface CreatePerformanceData {
  userId: string;
  sessionId: string;
  scenarioId: string;
  verificationScore: number;
  communicationScore: number;
  technicalScore: number;
  documentationScore: number;
  responseTimeScore: number;
  overallScore: number;
  xpEarned: number;
  completionTime: number;
}

export interface PerformanceAnalytics {
  totalSessions: number;
  averageScore: number;
  averageCompletionTime: number;
  totalXpEarned: number;
  scoresByCategory: {
    verification: number;
    communication: number;
    technical: number;
    documentation: number;
    responseTime: number;
  };
  difficultyBreakdown: {
    difficulty: string;
    count: number;
    averageScore: number;
  }[];
  recentPerformance: PerformanceMetric[];
}

export class PerformanceRepository {
  async create(performanceData: CreatePerformanceData): Promise<PerformanceMetric> {
    const performance = await prisma.performanceMetric.create({
      data: {
        userId: performanceData.userId,
        sessionId: performanceData.sessionId,
        scenarioId: performanceData.scenarioId,
        verificationScore: performanceData.verificationScore,
        communicationScore: performanceData.communicationScore,
        technicalScore: performanceData.technicalScore,
        documentationScore: performanceData.documentationScore,
        responseTimeScore: performanceData.responseTimeScore,
        overallScore: performanceData.overallScore,
        xpEarned: performanceData.xpEarned,
        completionTime: performanceData.completionTime,
      },
    });
    
    return this.mapPrismaPerformanceToPerformance(performance);
  }

  async findById(id: string): Promise<PerformanceMetric | null> {
    const performance = await prisma.performanceMetric.findUnique({
      where: { id },
      include: {
        user: true,
        session: true,
        scenario: true,
      },
    });
    
    return performance ? this.mapPrismaPerformanceToPerformance(performance) : null;
  }

  async findByUserId(userId: string): Promise<PerformanceMetric[]> {
    const performances = await prisma.performanceMetric.findMany({
      where: { userId },
      include: {
        scenario: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return performances.map(this.mapPrismaPerformanceToPerformance);
  }

  async findBySessionId(sessionId: string): Promise<PerformanceMetric | null> {
    const performance = await prisma.performanceMetric.findFirst({
      where: { sessionId },
      include: {
        scenario: true,
      },
    });
    
    return performance ? this.mapPrismaPerformanceToPerformance(performance) : null;
  }

  async findByScenarioId(scenarioId: string): Promise<PerformanceMetric[]> {
    const performances = await prisma.performanceMetric.findMany({
      where: { scenarioId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return performances.map(this.mapPrismaPerformanceToPerformance);
  }

  async getAnalytics(userId: string): Promise<PerformanceAnalytics> {
    const performances = await prisma.performanceMetric.findMany({
      where: { userId },
      include: {
        scenario: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSessions = performances.length;
    const averageScore = totalSessions > 0 
      ? performances.reduce((sum, p) => sum + Number(p.overallScore), 0) / totalSessions 
      : 0;
    
    const averageCompletionTime = totalSessions > 0
      ? performances.reduce((sum, p) => sum + p.completionTime, 0) / totalSessions
      : 0;
    
    const totalXpEarned = performances.reduce((sum, p) => sum + p.xpEarned, 0);

    const scoresByCategory = {
      verification: totalSessions > 0 
        ? performances.reduce((sum, p) => sum + Number(p.verificationScore), 0) / totalSessions 
        : 0,
      communication: totalSessions > 0 
        ? performances.reduce((sum, p) => sum + Number(p.communicationScore), 0) / totalSessions 
        : 0,
      technical: totalSessions > 0 
        ? performances.reduce((sum, p) => sum + Number(p.technicalScore), 0) / totalSessions 
        : 0,
      documentation: totalSessions > 0 
        ? performances.reduce((sum, p) => sum + Number(p.documentationScore), 0) / totalSessions 
        : 0,
      responseTime: totalSessions > 0 
        ? performances.reduce((sum, p) => sum + Number(p.responseTimeScore), 0) / totalSessions 
        : 0,
    };

    const difficultyMap = performances.reduce((acc, p) => {
      const difficulty = p.scenario.difficulty;
      if (!acc[difficulty]) {
        acc[difficulty] = { count: 0, totalScore: 0 };
      }
      acc[difficulty].count += 1;
      acc[difficulty].totalScore += Number(p.overallScore);
      return acc;
    }, {} as any);

    const difficultyBreakdown = Object.entries(difficultyMap).map(([difficulty, data]: [string, any]) => ({
      difficulty,
      count: data.count,
      averageScore: data.count > 0 ? data.totalScore / data.count : 0,
    }));

    const recentPerformance = performances
      .slice(0, 10)
      .map(this.mapPrismaPerformanceToPerformance);

    return {
      totalSessions,
      averageScore,
      averageCompletionTime,
      totalXpEarned,
      scoresByCategory,
      difficultyBreakdown,
      recentPerformance,
    };
  }

  async getTopPerformers(limit: number = 10): Promise<any[]> {
    const topPerformers = await prisma.performanceMetric.groupBy({
      by: ['userId'],
      _avg: {
        overallScore: true,
      },
      _count: {
        id: true,
      },
      _sum: {
        xpEarned: true,
      },
      orderBy: {
        _avg: {
          overallScore: 'desc',
        },
      },
      take: limit,
    });

    return topPerformers.map(performer => ({
      userId: performer.userId,
      averageScore: performer._avg.overallScore,
      totalSessions: performer._count.id,
      totalXpEarned: performer._sum.xpEarned,
    }));
  }

  async getScenarioAnalytics(scenarioId: string): Promise<any> {
    const performances = await prisma.performanceMetric.findMany({
      where: { scenarioId },
      include: {
        user: true,
      },
    });

    const totalAttempts = performances.length;
    const averageScore = totalAttempts > 0
      ? performances.reduce((sum, p) => sum + Number(p.overallScore), 0) / totalAttempts
      : 0;
    
    const averageCompletionTime = totalAttempts > 0
      ? performances.reduce((sum, p) => sum + p.completionTime, 0) / totalAttempts
      : 0;

    const scoreDistribution = {
      excellent: performances.filter(p => Number(p.overallScore) >= 90).length,
      good: performances.filter(p => Number(p.overallScore) >= 80 && Number(p.overallScore) < 90).length,
      average: performances.filter(p => Number(p.overallScore) >= 70 && Number(p.overallScore) < 80).length,
      poor: performances.filter(p => Number(p.overallScore) < 70).length,
    };

    return {
      scenarioId,
      totalAttempts,
      averageScore,
      averageCompletionTime,
      scoreDistribution,
    };
  }

  private mapPrismaPerformanceToPerformance(prismaPerformance: any): PerformanceMetric {
    return {
      id: prismaPerformance.id,
      userId: prismaPerformance.userId,
      sessionId: prismaPerformance.sessionId,
      scenarioId: prismaPerformance.scenarioId,
      verificationScore: Number(prismaPerformance.verificationScore),
      communicationScore: Number(prismaPerformance.communicationScore),
      technicalScore: Number(prismaPerformance.technicalScore),
      documentationScore: Number(prismaPerformance.documentationScore),
      responseTimeScore: Number(prismaPerformance.responseTimeScore),
      overallScore: Number(prismaPerformance.overallScore),
      xpEarned: prismaPerformance.xpEarned,
      completionTime: prismaPerformance.completionTime,
      createdAt: prismaPerformance.createdAt,
    };
  }
}

export const performanceRepository = new PerformanceRepository();