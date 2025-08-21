import { SessionRepository } from '../repositories/sessionRepository';
import { UserRepository } from '../repositories/userRepository';
import { ScenarioRepository } from '../repositories/scenarioRepository';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { insightsEngine } from './insightsEngine';
import { trendAnalyzer } from './trendAnalyzer';
import { benchmarkEngine } from './benchmarkEngine';
import { reportGenerator } from './reportGenerator';

export interface PerformanceMetrics {
  completionTime: number; // minutes
  technicalAccuracy: number; // 0-100
  customerSatisfaction: number; // 0-100
  communicationEffectiveness: number; // 0-100
  procedureCompliance: number; // 0-100
  overallScore: number; // 0-100
  difficultyAdjustedScore: number; // 0-100
}

export interface SkillAssessment {
  technicalSkills: {
    troubleshooting: number;
    systemKnowledge: number;
    toolProficiency: number;
    documentation: number;
    securityAwareness: number;
  };
  communicationSkills: {
    customerEmpathy: number;
    clarity: number;
    professionalism: number;
    activeListening: number;
    conflictResolution: number;
  };
  proceduralSkills: {
    workflowAdherence: number;
    timeManagement: number;
    escalationJudgment: number;
    qualityAssurance: number;
    continuousLearning: number;
  };
}

export interface ComparisonData {
  historicalComparison: {
    previousAttempts: PerformanceMetrics[];
    improvementTrend: number; // percentage improvement
    bestScore: PerformanceMetrics;
    averageScore: PerformanceMetrics;
  };
  peerComparison: {
    percentile: number; // 0-100
    averagePeerScore: PerformanceMetrics;
    topPerformerScore: PerformanceMetrics;
    skillRanking: {
      [skillName: string]: number; // percentile
    };
  };
}

export interface DetailedFeedback {
  strengths: Array<{
    area: string;
    score: number;
    description: string;
    examples: string[];
  }>;
  improvementAreas: Array<{
    area: string;
    score: number;
    description: string;
    recommendations: string[];
    resources: Array<{
      title: string;
      type: string;
      url?: string;
    }>;
  }>;
  actionableSteps: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    timeframe: string;
  }>;
  nextScenarios: Array<{
    scenarioId: string;
    title: string;
    reason: string;
    expectedBenefit: string;
  }>;
}

export interface PerformanceReport {
  userId: string;
  reportType: 'summary' | 'detailed' | 'portfolio' | 'interview_prep';
  generatedAt: Date;
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalScenarios: number;
    averageScore: number;
    improvementRate: number;
    strongestSkills: string[];
    developmentAreas: string[];
  };
  achievements: Array<{
    title: string;
    description: string;
    dateEarned: Date;
    category: string;
  }>;
  skillCertifications: Array<{
    skill: string;
    level: 'basic' | 'intermediate' | 'advanced';
    dateAchieved: Date;
    scenarios: string[];
  }>;
  exportFormat: 'pdf' | 'json' | 'csv';
}

export interface ImprovementGoal {
  id: string;
  userId: string;
  skillArea: string;
  currentLevel: number;
  targetLevel: number;
  targetDate: Date;
  strategies: string[];
  progress: number; // 0-100
  milestones: Array<{
    description: string;
    targetDate: Date;
    completed: boolean;
    completedDate?: Date;
  }>;
}

interface PerformanceDimensions {
  technicalCompetency: number;
  customerService: number;
  communicationSkills: number;
  problemSolving: number;
  processCompliance: number;
  learningAgility: number;
}

interface AnalyticsResult {
  userId: string;
  dimensions: PerformanceDimensions;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  trends: any;
  benchmarks: any;
  lastUpdated: Date;
}

interface AnalyticsRequest {
  userId: string;
  timeRange?: {
    startDate: Date;
    endDate: Date;
  };
  dimensions?: string[];
  includeForecasting?: boolean;
  includeBenchmarks?: boolean;
}

export class AnalyticsService {
  private sessionRepository: SessionRepository;
  private userRepository: UserRepository;
  private scenarioRepository: ScenarioRepository;
  private prisma: PrismaClient;

  constructor() {
    this.sessionRepository = new SessionRepository();
    this.userRepository = new UserRepository();
    this.scenarioRepository = new ScenarioRepository();
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate comprehensive performance metrics for a session
   */
  async calculatePerformanceMetrics(sessionId: string, userId: string): Promise<PerformanceMetrics> {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      if (!session || session.userId !== userId) {
        throw new NotFoundError(`Session not found or unauthorized`);
      }

      const scenario = await this.scenarioRepository.findById(session.scenarioId);
      if (!scenario) {
        throw new NotFoundError(`Scenario not found`);
      }

      // Calculate individual metrics
      const completionTime = this.calculateCompletionTime(session);
      const technicalAccuracy = await this.calculateTechnicalAccuracy(session, scenario);
      const customerSatisfaction = await this.calculateCustomerSatisfaction(session);
      const communicationEffectiveness = await this.calculateCommunicationEffectiveness(session);
      const procedureCompliance = await this.calculateProcedureCompliance(session, scenario);

      // Calculate overall score
      const overallScore = this.calculateOverallScore({
        completionTime: this.scoreCompletionTime(completionTime, scenario.estimatedTime),
        technicalAccuracy,
        customerSatisfaction,
        communicationEffectiveness,
        procedureCompliance,
      });

      // Adjust for difficulty
      const difficultyAdjustedScore = this.adjustForDifficulty(overallScore, scenario.difficulty);

      const metrics: PerformanceMetrics = {
        completionTime,
        technicalAccuracy,
        customerSatisfaction,
        communicationEffectiveness,
        procedureCompliance,
        overallScore,
        difficultyAdjustedScore,
      };

      logger.info('Calculated performance metrics', { sessionId, userId, metrics });
      return metrics;
    } catch (error) {
      logger.error('Error calculating performance metrics', { sessionId, userId, error });
      throw error;
    }
  }

  /**
   * Get detailed skill assessment breakdown
   */
  async getSkillAssessment(sessionId: string, userId: string): Promise<SkillAssessment> {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      if (!session || session.userId !== userId) {
        throw new NotFoundError(`Session not found or unauthorized`);
      }

      const technicalSkills = await this.assessTechnicalSkills(session);
      const communicationSkills = await this.assessCommunicationSkills(session);
      const proceduralSkills = await this.assessProceduralSkills(session);

      return {
        technicalSkills,
        communicationSkills,
        proceduralSkills,
      };
    } catch (error) {
      logger.error('Error getting skill assessment', { sessionId, userId, error });
      throw error;
    }
  }

  /**
   * Get comparative analysis data
   */
  async getComparisonData(userId: string, scenarioId?: string): Promise<ComparisonData> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError(`User not found`);
      }

      const historicalComparison = await this.getHistoricalComparison(userId, scenarioId);
      const peerComparison = await this.getPeerComparison(userId, scenarioId);

      return {
        historicalComparison,
        peerComparison,
      };
    } catch (error) {
      logger.error('Error getting comparison data', { userId, scenarioId, error });
      throw error;
    }
  }

  /**
   * Generate detailed feedback for user performance
   */
  async generateDetailedFeedback(sessionId: string, userId: string): Promise<DetailedFeedback> {
    try {
      const metrics = await this.calculatePerformanceMetrics(sessionId, userId);
      const skillAssessment = await this.getSkillAssessment(sessionId, userId);
      const comparisonData = await this.getComparisonData(userId);

      const strengths = this.identifyStrengths(metrics, skillAssessment);
      const improvementAreas = this.identifyImprovementAreas(metrics, skillAssessment);
      const actionableSteps = this.generateActionableSteps(improvementAreas, comparisonData);
      const nextScenarios = await this.recommendNextScenarios(userId, skillAssessment);

      return {
        strengths,
        improvementAreas,
        actionableSteps,
        nextScenarios,
      };
    } catch (error) {
      logger.error('Error generating detailed feedback', { sessionId, userId, error });
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    userId: string,
    reportType: PerformanceReport['reportType'],
    timeframe: { startDate: Date; endDate: Date },
    exportFormat: 'pdf' | 'json' | 'csv' = 'json'
  ): Promise<PerformanceReport> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError(`User not found`);
      }

      const sessions = await this.sessionRepository.findByUserAndTimeframe(
        userId,
        timeframe.startDate,
        timeframe.endDate
      );

      const summary = await this.generateReportSummary(sessions);
      const achievements = await this.getAchievements(userId, timeframe);
      const skillCertifications = await this.getSkillCertifications(userId);

      const report: PerformanceReport = {
        userId,
        reportType,
        generatedAt: new Date(),
        timeframe,
        summary,
        achievements,
        skillCertifications,
        exportFormat,
      };

      logger.info('Generated performance report', { userId, reportType, exportFormat });
      return report;
    } catch (error) {
      logger.error('Error generating performance report', { userId, reportType, error });
      throw error;
    }
  }

  /**
   * Set improvement goal for user
   */
  async setImprovementGoal(userId: string, goalData: Omit<ImprovementGoal, 'id' | 'userId' | 'progress'>): Promise<ImprovementGoal> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError(`User not found`);
      }

      const goal: ImprovementGoal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        progress: 0,
        ...goalData,
      };

      // Store goal in database (implementation would go here)
      logger.info('Set improvement goal', { userId, goalId: goal.id });
      return goal;
    } catch (error) {
      logger.error('Error setting improvement goal', { userId, error });
      throw error;
    }
  }

  /**
   * Get user performance overview
   */
  async getPerformanceOverview(userId: string, timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError(`User not found`);
      }

      const { startDate, endDate } = this.getTimeframeRange(timeframe);
      const sessions = await this.sessionRepository.findByUserAndTimeframe(userId, startDate, endDate);

      const overview = {
        timeframe,
        period: { startDate, endDate },
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        averageScore: this.calculateAverageScore(sessions),
        totalTimeSpent: sessions.reduce((total, session) => total + (session.duration || 0), 0),
        improvementTrend: await this.calculateImprovementTrend(userId, timeframe),
        skillProgress: await this.getSkillProgressSummary(userId, timeframe),
        recentAchievements: await this.getRecentAchievements(userId, 5),
        upcomingGoals: await this.getUpcomingGoals(userId),
      };

      return overview;
    } catch (error) {
      logger.error('Error getting performance overview', { userId, timeframe, error });
      throw error;
    }
  }

  // Private helper methods
  private calculateCompletionTime(session: any): number {
    if (session.endTime && session.startTime) {
      return Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60));
    }
    return session.duration || 0;
  }

  private async calculateTechnicalAccuracy(session: any, scenario: any): Promise<number> {
    // Analyze chat messages, actions taken, and outcomes
    // This would be implemented based on specific scenario requirements
    return 75 + Math.random() * 20; // Mock implementation
  }

  private async calculateCustomerSatisfaction(session: any): Promise<number> {
    // Analyze communication style, response times, problem resolution
    const communicationScore = 80;
    const resolutionScore = 85;
    const timelinessScore = 90;
    
    return Math.round((communicationScore + resolutionScore + timelinessScore) / 3);
  }

  private async calculateCommunicationEffectiveness(session: any): Promise<number> {
    // Analyze message clarity, empathy, professionalism
    return 78 + Math.random() * 15;
  }

  private async calculateProcedureCompliance(session: any, scenario: any): Promise<number> {
    // Check adherence to defined procedures and best practices
    return 82 + Math.random() * 12;
  }

  private scoreCompletionTime(actualTime: number, estimatedTime: number): number {
    const ratio = actualTime / estimatedTime;
    if (ratio <= 0.8) return 100; // Completed early
    if (ratio <= 1.0) return 90;  // On time
    if (ratio <= 1.2) return 75;  // Slightly over
    if (ratio <= 1.5) return 60;  // Over time
    return 40; // Significantly over time
  }

  private calculateOverallScore(scores: Record<string, number>): number {
    const weights = {
      completionTime: 0.15,
      technicalAccuracy: 0.25,
      customerSatisfaction: 0.25,
      communicationEffectiveness: 0.20,
      procedureCompliance: 0.15,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(scores).forEach(([key, score]) => {
      if (weights[key as keyof typeof weights]) {
        weightedSum += score * weights[key as keyof typeof weights];
        totalWeight += weights[key as keyof typeof weights];
      }
    });

    return Math.round(weightedSum / totalWeight);
  }

  private adjustForDifficulty(score: number, difficulty: string): number {
    const adjustments = {
      starter: 0.95,
      intermediate: 1.0,
      advanced: 1.1,
    };

    const adjustment = adjustments[difficulty as keyof typeof adjustments] || 1.0;
    return Math.round(score * adjustment);
  }

  private async assessTechnicalSkills(session: any): Promise<SkillAssessment['technicalSkills']> {
    return {
      troubleshooting: 75 + Math.random() * 20,
      systemKnowledge: 80 + Math.random() * 15,
      toolProficiency: 70 + Math.random() * 25,
      documentation: 85 + Math.random() * 10,
      securityAwareness: 78 + Math.random() * 18,
    };
  }

  private async assessCommunicationSkills(session: any): Promise<SkillAssessment['communicationSkills']> {
    return {
      customerEmpathy: 82 + Math.random() * 15,
      clarity: 77 + Math.random() * 20,
      professionalism: 88 + Math.random() * 10,
      activeListening: 79 + Math.random() * 18,
      conflictResolution: 73 + Math.random() * 22,
    };
  }

  private async assessProceduralSkills(session: any): Promise<SkillAssessment['proceduralSkills']> {
    return {
      workflowAdherence: 85 + Math.random() * 12,
      timeManagement: 76 + Math.random() * 20,
      escalationJudgment: 81 + Math.random() * 15,
      qualityAssurance: 83 + Math.random() * 14,
      continuousLearning: 87 + Math.random() * 10,
    };
  }

  private async getHistoricalComparison(userId: string, scenarioId?: string): Promise<ComparisonData['historicalComparison']> {
    // Mock implementation - would query actual historical data
    const previousAttempts: PerformanceMetrics[] = [
      {
        completionTime: 45,
        technicalAccuracy: 72,
        customerSatisfaction: 78,
        communicationEffectiveness: 75,
        procedureCompliance: 80,
        overallScore: 76,
        difficultyAdjustedScore: 76,
      },
      {
        completionTime: 38,
        technicalAccuracy: 85,
        customerSatisfaction: 82,
        communicationEffectiveness: 80,
        procedureCompliance: 88,
        overallScore: 84,
        difficultyAdjustedScore: 84,
      },
    ];

    return {
      previousAttempts,
      improvementTrend: 15.5, // percentage improvement
      bestScore: previousAttempts[1],
      averageScore: {
        completionTime: 41.5,
        technicalAccuracy: 78.5,
        customerSatisfaction: 80,
        communicationEffectiveness: 77.5,
        procedureCompliance: 84,
        overallScore: 80,
        difficultyAdjustedScore: 80,
      },
    };
  }

  private async getPeerComparison(userId: string, scenarioId?: string): Promise<ComparisonData['peerComparison']> {
    // Mock implementation - would query peer data (anonymized)
    return {
      percentile: 75,
      averagePeerScore: {
        completionTime: 50,
        technicalAccuracy: 70,
        customerSatisfaction: 75,
        communicationEffectiveness: 72,
        procedureCompliance: 78,
        overallScore: 73,
        difficultyAdjustedScore: 73,
      },
      topPerformerScore: {
        completionTime: 25,
        technicalAccuracy: 95,
        customerSatisfaction: 92,
        communicationEffectiveness: 88,
        procedureCompliance: 94,
        overallScore: 91,
        difficultyAdjustedScore: 91,
      },
      skillRanking: {
        troubleshooting: 82,
        communication: 78,
        timeManagement: 65,
        procedureCompliance: 88,
      },
    };
  }

  private identifyStrengths(metrics: PerformanceMetrics, skills: SkillAssessment): DetailedFeedback['strengths'] {
    const strengths: DetailedFeedback['strengths'] = [];

    if (metrics.technicalAccuracy >= 85) {
      strengths.push({
        area: 'Technical Problem Solving',
        score: metrics.technicalAccuracy,
        description: 'Excellent technical accuracy in identifying and resolving issues',
        examples: ['Correctly diagnosed root cause', 'Applied appropriate solution'],
      });
    }

    if (metrics.customerSatisfaction >= 85) {
      strengths.push({
        area: 'Customer Service',
        score: metrics.customerSatisfaction,
        description: 'Outstanding customer interaction and satisfaction',
        examples: ['Professional communication', 'Empathetic responses'],
      });
    }

    return strengths;
  }

  private identifyImprovementAreas(metrics: PerformanceMetrics, skills: SkillAssessment): DetailedFeedback['improvementAreas'] {
    const areas: DetailedFeedback['improvementAreas'] = [];

    if (metrics.completionTime > 60) {
      areas.push({
        area: 'Time Management',
        score: this.scoreCompletionTime(metrics.completionTime, 45),
        description: 'Focus on improving efficiency and time management',
        recommendations: [
          'Practice systematic troubleshooting approaches',
          'Use time-boxing techniques',
          'Prioritize high-impact actions first',
        ],
        resources: [
          { title: 'Effective Time Management for IT Support', type: 'article' },
          { title: 'Troubleshooting Methodologies', type: 'course' },
        ],
      });
    }

    return areas;
  }

  private generateActionableSteps(improvementAreas: DetailedFeedback['improvementAreas'], comparison: ComparisonData): DetailedFeedback['actionableSteps'] {
    return [
      {
        priority: 'high' as const,
        action: 'Practice time-boxed troubleshooting scenarios',
        expectedImpact: 'Improve completion time by 15-20%',
        timeframe: '2 weeks',
      },
      {
        priority: 'medium' as const,
        action: 'Review communication best practices',
        expectedImpact: 'Enhance customer satisfaction scores',
        timeframe: '1 week',
      },
    ];
  }

  private async recommendNextScenarios(userId: string, skills: SkillAssessment): Promise<DetailedFeedback['nextScenarios']> {
    return [
      {
        scenarioId: 'scenario-time-critical',
        title: 'Time-Critical System Outage',
        reason: 'Practice time management under pressure',
        expectedBenefit: 'Improve efficiency and decision-making speed',
      },
      {
        scenarioId: 'scenario-difficult-customer',
        title: 'Challenging Customer Interaction',
        reason: 'Develop advanced communication skills',
        expectedBenefit: 'Enhance conflict resolution abilities',
      },
    ];
  }

  private async generateReportSummary(sessions: any[]): Promise<PerformanceReport['summary']> {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    
    return {
      totalScenarios: completedSessions.length,
      averageScore: this.calculateAverageScore(completedSessions),
      improvementRate: 12.5, // Mock calculation
      strongestSkills: ['Technical Accuracy', 'Procedure Compliance'],
      developmentAreas: ['Time Management', 'Communication'],
    };
  }

  private async getAchievements(userId: string, timeframe: { startDate: Date; endDate: Date }): Promise<PerformanceReport['achievements']> {
    return [
      {
        title: 'Fast Responder',
        description: 'Completed 5 scenarios under target time',
        dateEarned: new Date(),
        category: 'Efficiency',
      },
      {
        title: 'Customer Champion',
        description: 'Achieved 90%+ customer satisfaction in 10 scenarios',
        dateEarned: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        category: 'Service Excellence',
      },
    ];
  }

  private async getSkillCertifications(userId: string): Promise<PerformanceReport['skillCertifications']> {
    return [
      {
        skill: 'Technical Problem Solving',
        level: 'intermediate' as const,
        dateAchieved: new Date(),
        scenarios: ['basic-troubleshooting', 'network-issues', 'software-problems'],
      },
      {
        skill: 'Customer Communication',
        level: 'advanced' as const,
        dateAchieved: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        scenarios: ['difficult-customer', 'technical-explanation', 'conflict-resolution'],
      },
    ];
  }

  private calculateAverageScore(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, session) => sum + (session.score || 75), 0);
    return Math.round(total / sessions.length);
  }

  private getTimeframeRange(timeframe: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  private async calculateImprovementTrend(userId: string, timeframe: string): Promise<number> {
    // Mock implementation - would calculate actual trend
    return 15.2; // percentage improvement
  }

  private async getSkillProgressSummary(userId: string, timeframe: string): Promise<any> {
    return {
      technical: { current: 78, previous: 72, improvement: 8.3 },
      communication: { current: 84, previous: 79, improvement: 6.3 },
      procedural: { current: 82, previous: 80, improvement: 2.5 },
    };
  }

  private async getRecentAchievements(userId: string, limit: number): Promise<any[]> {
    return [
      { title: 'Speed Demon', description: 'Completed scenario in record time', date: new Date() },
      { title: 'Problem Solver', description: 'Resolved complex technical issue', date: new Date() },
    ].slice(0, limit);
  }

  private async getUpcomingGoals(userId: string): Promise<any[]> {
    return [
      { title: 'Improve Time Management', target: 85, current: 76, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { title: 'Master Communication', target: 90, current: 84, deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
    ];
  }

  /**
   * Generate comprehensive multi-dimensional performance analytics
   */
  async generateComprehensiveAnalytics(request: AnalyticsRequest): Promise<AnalyticsResult> {
    try {
      logger.info(`Generating comprehensive analytics for user ${request.userId}`);

      // Gather raw performance data
      const performanceData = await this.gatherPerformanceData(request);
      
      // Calculate multi-dimensional performance scores
      const dimensions = await this.calculatePerformanceDimensions(performanceData);
      
      // Generate overall performance score
      const overallScore = this.calculateOverallPerformanceScore(dimensions);
      
      // Generate AI-powered insights and recommendations
      const insights = await insightsEngine.generateInsights(performanceData, dimensions);
      
      // Generate trend analysis if requested
      const trends = request.includeForecasting ? 
        await trendAnalyzer.analyzeTrends(request.userId, performanceData) : null;
      
      // Generate benchmarks if requested
      const benchmarks = request.includeBenchmarks ? 
        await benchmarkEngine.generateBenchmarks(request.userId, dimensions) : null;

      const result: AnalyticsResult = {
        userId: request.userId,
        dimensions,
        overallScore,
        strengths: insights.strengths,
        weaknesses: insights.weaknesses,
        recommendations: insights.recommendations,
        trends,
        benchmarks,
        lastUpdated: new Date()
      };

      // Cache results for performance
      await this.cacheAnalytics(result);

      logger.info(`Comprehensive analytics generated successfully for user ${request.userId}`);
      return result;

    } catch (error) {
      logger.error('Error generating comprehensive analytics:', error);
      throw new Error('Failed to generate comprehensive analytics');
    }
  }

  private async gatherPerformanceData(request: AnalyticsRequest) {
    const { userId, timeRange } = request;
    
    const whereClause: any = { userId };
    if (timeRange) {
      whereClause.createdAt = {
        gte: timeRange.startDate,
        lte: timeRange.endDate
      };
    }

    // Gather comprehensive performance data from multiple sources
    const [tickets, sessions, achievements, xpHistory, researchBehavior] = await Promise.all([
      this.sessionRepository.findByUser(userId),
      this.sessionRepository.findByUserAndTimeframe(
        userId, 
        timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        timeRange?.endDate || new Date()
      ),
      // Mock data - would be replaced with actual database calls
      Promise.resolve([]),
      Promise.resolve([]),
      Promise.resolve([])
    ]);

    return {
      tickets,
      sessions,
      achievements,
      xpHistory,
      researchBehavior,
      timeRange: timeRange || {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      }
    };
  }

  private async calculatePerformanceDimensions(data: any): Promise<PerformanceDimensions> {
    const { sessions } = data;

    // Technical Competency Analysis
    const technicalCompetency = this.calculateTechnicalCompetencyScore(sessions);

    // Customer Service Analysis
    const customerService = this.calculateCustomerServiceScore(sessions);

    // Communication Skills Analysis
    const communicationSkills = this.calculateCommunicationSkillsScore(sessions);

    // Problem Solving Analysis
    const problemSolving = this.calculateProblemSolvingScore(sessions);

    // Process Compliance Analysis
    const processCompliance = this.calculateProcessComplianceScore(sessions);

    // Learning Agility Analysis
    const learningAgility = this.calculateLearningAgilityScore(sessions);

    return {
      technicalCompetency,
      customerService,
      communicationSkills,
      problemSolving,
      processCompliance,
      learningAgility
    };
  }

  private calculateTechnicalCompetencyScore(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const scores = sessions.map(session => {
      const baseScore = session.performance?.technicalAccuracy || 75;
      const completionTimeBonus = session.duration < 30 ? 10 : session.duration < 45 ? 5 : 0;
      const accuracyBonus = baseScore > 90 ? 10 : baseScore > 80 ? 5 : 0;
      
      return Math.min(100, baseScore + completionTimeBonus + accuracyBonus);
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateCustomerServiceScore(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const scores = sessions.map(session => {
      const satisfaction = session.performance?.customerSatisfaction || 75;
      const communication = session.performance?.communicationEffectiveness || 75;
      const empathy = session.performance?.empathyScore || 75;
      
      return Math.round((satisfaction * 0.4 + communication * 0.35 + empathy * 0.25));
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateCommunicationSkillsScore(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const scores = sessions.map(session => {
      const clarity = session.performance?.communicationEffectiveness || 75;
      const professionalism = session.performance?.professionalismScore || 80;
      const responseQuality = session.performance?.responseRelevanceScore || 75;
      
      return Math.round((clarity * 0.4 + professionalism * 0.35 + responseQuality * 0.25));
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateProblemSolvingScore(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const scores = sessions.map(session => {
      const efficiency = session.duration ? Math.max(0, 100 - (session.duration - 30) * 2) : 75;
      const accuracy = session.performance?.technicalAccuracy || 75;
      const creativity = session.performance?.innovationScore || 70;
      
      return Math.round((efficiency * 0.4 + accuracy * 0.4 + creativity * 0.2));
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateProcessComplianceScore(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const scores = sessions.map(session => {
      const compliance = session.performance?.procedureCompliance || 85;
      const documentation = session.performance?.documentationQuality || 80;
      const consistency = session.performance?.qualityConsistency || 82;
      
      return Math.round((compliance * 0.5 + documentation * 0.3 + consistency * 0.2));
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateLearningAgilityScore(sessions: any[]): number {
    if (sessions.length < 2) return 75;

    // Calculate improvement over time
    const sortedSessions = sessions.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
    const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum: number, session: any) => 
      sum + (session.performance?.overallScore || 75), 0) / firstHalf.length;
    
    const secondAvg = secondHalf.reduce((sum: number, session: any) => 
      sum + (session.performance?.overallScore || 75), 0) / secondHalf.length;
    
    const improvementRate = ((secondAvg - firstAvg) / firstAvg) * 100;
    const adaptationScore = sessions.reduce((sum, session) => 
      sum + (session.performance?.adaptationScore || 75), 0) / sessions.length;
    
    return Math.max(0, Math.min(100, Math.round(75 + improvementRate + (adaptationScore - 75) * 0.3)));
  }

  private calculateOverallPerformanceScore(dimensions: PerformanceDimensions): number {
    const weights = {
      technicalCompetency: 0.25,
      customerService: 0.20,
      communicationSkills: 0.15,
      problemSolving: 0.20,
      processCompliance: 0.10,
      learningAgility: 0.10
    };

    return Math.round(Object.entries(dimensions).reduce((total, [key, value]) => {
      return total + (value * weights[key as keyof typeof weights]);
    }, 0));
  }

  private async cacheAnalytics(result: AnalyticsResult): Promise<void> {
    try {
      // Cache analytics results for performance
      // This would normally use a caching mechanism like Redis
      logger.info(`Cached analytics for user ${result.userId}`);
    } catch (error) {
      logger.warn('Failed to cache analytics results:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Generate custom analytics for specific metrics
   */
  async generateCustomAnalytics(userId: string, customMetrics: string[]): Promise<any> {
    try {
      logger.info(`Generating custom analytics for user ${userId} with metrics: ${customMetrics.join(', ')}`);
      
      const performanceData = await this.gatherPerformanceData({ userId });
      const result: any = {
        userId,
        customMetrics: {},
        generatedAt: new Date()
      };

      for (const metric of customMetrics) {
        switch (metric) {
          case 'ticket_velocity':
            result.customMetrics.ticketVelocity = this.calculateTicketVelocity(performanceData.sessions);
            break;
          case 'research_efficiency':
            result.customMetrics.researchEfficiency = this.calculateResearchEfficiency(performanceData.sessions);
            break;
          case 'customer_satisfaction_trend':
            result.customMetrics.satisfactionTrend = this.calculateSatisfactionTrend(performanceData.sessions);
            break;
          case 'skill_diversity':
            result.customMetrics.skillDiversity = this.calculateSkillDiversity(performanceData.achievements);
            break;
          default:
            logger.warn(`Unknown custom metric: ${metric}`);
        }
      }

      return result;
    } catch (error) {
      logger.error('Error generating custom analytics:', error);
      throw new Error('Failed to generate custom analytics');
    }
  }

  // Custom Metrics Calculation Methods
  private calculateTicketVelocity(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalTime = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    
    return completedSessions.length / Math.max(1, totalTime / 60); // Sessions per hour
  }

  private calculateResearchEfficiency(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    
    const sessionsWithResearch = sessions.filter(s => s.performance?.researchQuality);
    if (sessionsWithResearch.length === 0) return 75;
    
    const avgResearchQuality = sessionsWithResearch.reduce((sum, s) => 
      sum + s.performance.researchQuality, 0) / sessionsWithResearch.length;
    
    return Math.round(avgResearchQuality);
  }

  private calculateSatisfactionTrend(sessions: any[]): any {
    if (sessions.length === 0) return { trend: 'stable', change: 0 };
    
    const sortedSessions = sessions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
    const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + (s.performance?.customerSatisfaction || 75), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + (s.performance?.customerSatisfaction || 75), 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const trend = change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable';
    
    return { trend, change: Math.round(change * 100) / 100 };
  }

  private calculateSkillDiversity(achievements: any[]): number {
    if (achievements.length === 0) return 0;
    
    const skillCategories = new Set(achievements.map(a => a.category));
    return skillCategories.size;
  }

  /**
   * Get analytics history for trend analysis
   */
  async getAnalyticsHistory(userId: string, days: number = 30): Promise<any[]> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      
      const sessions = await this.sessionRepository.findByUserAndTimeframe(userId, startDate, endDate);
      
      // Group sessions by day and calculate daily metrics
      const dailyMetrics: any[] = [];
      const dayMs = 24 * 60 * 60 * 1000;
      
      for (let day = 0; day < days; day++) {
        const dayStart = new Date(startDate.getTime() + day * dayMs);
        const dayEnd = new Date(dayStart.getTime() + dayMs);
        
        const daySessions = sessions.filter(session => {
          const sessionDate = new Date(session.createdAt);
          return sessionDate >= dayStart && sessionDate < dayEnd;
        });
        
        if (daySessions.length > 0) {
          const avgScore = daySessions.reduce((sum, s) => sum + (s.performance?.overallScore || 75), 0) / daySessions.length;
          const avgSatisfaction = daySessions.reduce((sum, s) => sum + (s.performance?.customerSatisfaction || 75), 0) / daySessions.length;
          
          dailyMetrics.push({
            date: dayStart.toISOString().split('T')[0],
            sessionsCount: daySessions.length,
            averageScore: Math.round(avgScore),
            averageSatisfaction: Math.round(avgSatisfaction),
            totalDuration: daySessions.reduce((sum, s) => sum + (s.duration || 0), 0)
          });
        }
      }
      
      return dailyMetrics;
    } catch (error) {
      logger.error('Error fetching analytics history:', error);
      throw new Error('Failed to fetch analytics history');
    }
  }

  /**
   * Customizable Metrics System
   */

  /**
   * Create custom metric definition
   */
  async createCustomMetric(userId: string, metricDefinition: any): Promise<any> {
    try {
      logger.info(`Creating custom metric for user ${userId}`);

      const customMetric = {
        id: this.generateMetricId(),
        userId,
        name: metricDefinition.name,
        description: metricDefinition.description,
        formula: metricDefinition.formula,
        category: metricDefinition.category || 'custom',
        dataSource: metricDefinition.dataSource,
        thresholds: metricDefinition.thresholds || {
          excellent: 90,
          good: 75,
          satisfactory: 60,
          needsImprovement: 0
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate custom metric
      await this.validateCustomMetric(customMetric);

      // Store in database (mock implementation)
      logger.info(`Custom metric created: ${customMetric.id}`);
      return customMetric;

    } catch (error) {
      logger.error('Error creating custom metric:', error);
      throw new Error('Failed to create custom metric');
    }
  }

  /**
   * Get personalized analytics view
   */
  async getPersonalizedAnalytics(userId: string, preferences: any): Promise<any> {
    try {
      logger.info(`Generating personalized analytics for user ${userId}`);

      const userPreferences = {
        focusAreas: preferences.focusAreas || ['performance', 'growth'],
        timeHorizon: preferences.timeHorizon || 'monthly',
        detailLevel: preferences.detailLevel || 'standard',
        includeForecasting: preferences.includeForecasting !== false,
        customMetrics: preferences.customMetrics || []
      };

      // Get base analytics
      const baseAnalytics = await this.generateComprehensiveAnalytics({ userId });
      
      // Apply personalization filters
      const personalizedAnalytics = {
        userId,
        generatedAt: new Date(),
        preferences: userPreferences,
        focusedInsights: this.generateFocusedInsights(baseAnalytics, userPreferences),
        customMetrics: await this.getPersonalizedCustomMetrics(userId, userPreferences),
        actionablePlans: this.generateActionablePlans(baseAnalytics, userPreferences),
        progressTracking: this.generateProgressTracking(baseAnalytics, userPreferences)
      };

      return personalizedAnalytics;

    } catch (error) {
      logger.error('Error generating personalized analytics:', error);
      throw new Error('Failed to generate personalized analytics');
    }
  }

  // Private helper methods for customizable metrics

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateCustomMetric(metric: any): Promise<void> {
    if (!metric.name || metric.name.length < 3) {
      throw new Error('Metric name must be at least 3 characters long');
    }

    if (!metric.formula) {
      throw new Error('Metric formula is required');
    }

    if (!metric.dataSource) {
      throw new Error('Data source specification is required');
    }

    // Validate formula syntax (simplified)
    if (!this.isValidFormula(metric.formula)) {
      throw new Error('Invalid formula syntax');
    }
  }

  private isValidFormula(formula: string): boolean {
    // Simplified formula validation
    const allowedOperators = ['+', '-', '*', '/', '(', ')', 'avg', 'sum', 'count', 'max', 'min'];
    const allowedFields = ['sessions', 'performance', 'duration', 'score', 'satisfaction'];
    
    // Basic syntax check (in production, would use proper parser)
    return formula.length > 0 && !formula.includes(';') && !formula.includes('--');
  }

  private generateFocusedInsights(analytics: any, preferences: any): any[] {
    const insights: any[] = [];

    if (preferences.focusAreas.includes('performance')) {
      insights.push({
        area: 'Performance',
        insight: `Overall performance: ${analytics.overallScore}/100`,
        priority: 'high',
        actionable: true
      });
    }

    if (preferences.focusAreas.includes('growth')) {
      insights.push({
        area: 'Growth',
        insight: 'Learning agility shows strong potential for advancement',
        priority: 'medium',
        actionable: true
      });
    }

    return insights;
  }

  private async getPersonalizedCustomMetrics(userId: string, preferences: any): Promise<any[]> {
    // Mock implementation - would fetch user's custom metrics
    const userMetrics = [
      {
        id: 'metric_efficiency',
        name: 'Resolution Efficiency',
        category: 'efficiency',
        value: 85,
        trend: 'improving'
      }
    ];
    
    return userMetrics.filter(metric => 
      preferences.customMetrics.length === 0 || 
      preferences.customMetrics.includes(metric.id)
    );
  }

  private generateActionablePlans(analytics: any, preferences: any): any[] {
    const plans: any[] = [];

    // Generate plans based on focus areas
    if (preferences.focusAreas.includes('performance')) {
      plans.push({
        title: 'Performance Enhancement Plan',
        timeframe: preferences.timeHorizon,
        actions: analytics.recommendations?.slice(0, 3) || ['Improve technical skills', 'Enhance customer service'],
        expectedOutcome: '15-20% performance improvement'
      });
    }

    return plans;
  }

  private generateProgressTracking(analytics: any, preferences: any): any {
    return {
      trackingPeriod: preferences.timeHorizon,
      milestones: [
        {
          name: 'Technical Competency Improvement',
          target: 85,
          current: analytics.dimensions?.technicalCompetency || 75,
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        }
      ],
      reviewSchedule: preferences.timeHorizon === 'weekly' ? 'Every Friday' : 'Monthly'
    };
  }
}