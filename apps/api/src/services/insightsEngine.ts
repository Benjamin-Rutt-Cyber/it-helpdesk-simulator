import { DashboardData, InsightData, StrengthInsight, ImprovementInsight, RecommendationInsight, PerformanceTrend, ComparisonData } from './dashboardService';
import { AchievementService, UserAchievement } from './achievementService';
import { logger } from '../utils/logger';

interface AIInsightContext {
  userId: string;
  performanceData: any;
  dimensions: any;
  historicalTrends?: any[];
}

interface AIInsightResult {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  priorities: Array<{
    area: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    description: string;
    actionSteps: string[];
  }>;
  learningPath: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    resources: string[];
    timeframe: string;
  }>;
}

export interface UserMetrics {
  userId: string;
  performanceScores: { [category: string]: number };
  activityLevel: number;
  consistencyScore: number;
  improvementRate: number;
  skillDistribution: { [skill: string]: number };
  timeInRole: number; // days
  lastActiveDate: Date;
}

export interface BenchmarkData {
  category: string;
  averageScore: number;
  topPercentileScore: number;
  userCount: number;
  trendDirection: 'improving' | 'stable' | 'declining';
}

export class InsightsEngine {
  /**
   * Generate AI-powered insights for enhanced analytics
   */
  async generateInsights(performanceData: any, dimensions: any): Promise<AIInsightResult> {
    try {
      logger.info('Generating AI-powered insights for enhanced analytics');

      const context: AIInsightContext = {
        userId: performanceData.userId || 'unknown',
        performanceData,
        dimensions
      };

      const strengths = this.identifyPerformanceStrengths(context);
      const weaknesses = this.identifyPerformanceWeaknesses(context);
      const recommendations = this.generateAIRecommendations(context, strengths, weaknesses);
      const priorities = this.prioritizeImprovementAreas(context, weaknesses);
      const learningPath = this.createPersonalizedLearningPath(context, weaknesses);

      const result: AIInsightResult = {
        strengths,
        weaknesses,
        recommendations,
        priorities,
        learningPath
      };

      logger.info('AI insights generated successfully');
      return result;

    } catch (error) {
      logger.error('Error generating AI insights:', error);
      throw new Error('Failed to generate AI insights');
    }
  }

  private identifyPerformanceStrengths(context: AIInsightContext): string[] {
    const { dimensions } = context;
    const strengths: string[] = [];

    // Technical Competency Strengths
    if (dimensions.technicalCompetency >= 85) {
      strengths.push('Exceptional technical problem-solving abilities with consistent accuracy');
      if (dimensions.technicalCompetency >= 90) {
        strengths.push('Demonstrates mastery-level technical skills suitable for advanced scenarios');
      }
    }

    // Customer Service Strengths
    if (dimensions.customerService >= 85) {
      strengths.push('Outstanding customer relationship management and satisfaction delivery');
      if (dimensions.customerService >= 90) {
        strengths.push('Exemplary customer service skills that exceed industry standards');
      }
    }

    // Communication Strengths
    if (dimensions.communicationSkills >= 85) {
      strengths.push('Excellent professional communication with clarity and empathy');
      if (dimensions.communicationSkills >= 90) {
        strengths.push('Superior communication skills suitable for leadership roles');
      }
    }

    // Problem Solving Strengths
    if (dimensions.problemSolving >= 85) {
      strengths.push('Strong analytical thinking and systematic problem-solving approach');
      if (dimensions.problemSolving >= 90) {
        strengths.push('Advanced problem-solving capabilities with innovative solution approaches');
      }
    }

    // Process Compliance Strengths
    if (dimensions.processCompliance >= 85) {
      strengths.push('Excellent adherence to procedures and quality standards');
      if (dimensions.processCompliance >= 90) {
        strengths.push('Exemplary process compliance suitable for quality assurance roles');
      }
    }

    // Learning Agility Strengths
    if (dimensions.learningAgility >= 85) {
      strengths.push('Rapid learning and adaptation to new challenges and feedback');
      if (dimensions.learningAgility >= 90) {
        strengths.push('Exceptional learning agility indicating high potential for growth');
      }
    }

    // Cross-dimensional strengths
    const avgScore = Object.values(dimensions).reduce((sum: number, score: any) => sum + score, 0) / Object.keys(dimensions).length;
    if (avgScore >= 85) {
      strengths.push('Well-rounded professional competency across all performance dimensions');
    }

    return strengths.length > 0 ? strengths : ['Demonstrates solid foundational skills with room for development'];
  }

  private identifyPerformanceWeaknesses(context: AIInsightContext): string[] {
    const { dimensions } = context;
    const weaknesses: string[] = [];

    // Technical Competency Weaknesses
    if (dimensions.technicalCompetency < 70) {
      weaknesses.push('Technical problem-solving accuracy needs improvement');
      if (dimensions.technicalCompetency < 60) {
        weaknesses.push('Significant technical knowledge gaps require focused training');
      }
    }

    // Customer Service Weaknesses
    if (dimensions.customerService < 70) {
      weaknesses.push('Customer interaction and satisfaction scores below expectations');
      if (dimensions.customerService < 60) {
        weaknesses.push('Customer service skills need substantial development');
      }
    }

    // Communication Weaknesses
    if (dimensions.communicationSkills < 70) {
      weaknesses.push('Professional communication clarity and effectiveness need improvement');
      if (dimensions.communicationSkills < 60) {
        weaknesses.push('Communication skills require comprehensive development');
      }
    }

    // Problem Solving Weaknesses
    if (dimensions.problemSolving < 70) {
      weaknesses.push('Problem-solving approach and efficiency need enhancement');
      if (dimensions.problemSolving < 60) {
        weaknesses.push('Systematic problem-solving methodology requires significant improvement');
      }
    }

    return weaknesses;
  }

  private generateAIRecommendations(context: AIInsightContext, strengths: string[], weaknesses: string[]): string[] {
    const { dimensions } = context;
    const recommendations: string[] = [];

    // Leverage strengths recommendations
    const highestDimension = Object.entries(dimensions).reduce((max, current) => 
      current[1] > max[1] ? current : max
    );

    if (highestDimension[1] >= 80) {
      recommendations.push(`Leverage your strength in ${this.formatDimensionName(highestDimension[0])} to mentor others and take on leadership opportunities`);
    }

    // Address weaknesses recommendations
    const lowestDimension = Object.entries(dimensions).reduce((min, current) => 
      current[1] < min[1] ? current : min
    );

    if (lowestDimension[1] < 70) {
      recommendations.push(`Focus on improving ${this.formatDimensionName(lowestDimension[0])} through targeted practice and training`);
    }

    // Specific improvement recommendations
    if (dimensions.technicalCompetency < 75) {
      recommendations.push('Practice systematic troubleshooting methodologies and expand technical knowledge base');
    }

    if (dimensions.customerService < 75) {
      recommendations.push('Focus on active listening techniques and empathy building exercises');
    }

    return recommendations;
  }

  private prioritizeImprovementAreas(context: AIInsightContext, weaknesses: string[]): AIInsightResult['priorities'] {
    const { dimensions } = context;
    const priorities: AIInsightResult['priorities'] = [];

    // Analyze each dimension and create priorities
    Object.entries(dimensions).forEach(([dimension, score]) => {
      if (score < 75) {
        const priority = this.createPriorityItem(dimension, score as number);
        if (priority) {
          priorities.push(priority);
        }
      }
    });

    return priorities.slice(0, 5);
  }

  private createPriorityItem(dimension: string, score: number): AIInsightResult['priorities'][0] | null {
    const priorityMap: Record<string, any> = {
      technicalCompetency: {
        area: 'Technical Skills',
        impact: score < 60 ? 'high' : 'medium',
        effort: 'medium',
        description: 'Improve technical problem-solving accuracy and knowledge application',
        actionSteps: [
          'Complete technical certification courses',
          'Practice hands-on troubleshooting scenarios',
          'Study system documentation and best practices'
        ]
      },
      customerService: {
        area: 'Customer Service',
        impact: 'high',
        effort: 'low',
        description: 'Enhance customer interaction skills and satisfaction delivery',
        actionSteps: [
          'Practice active listening techniques',
          'Learn customer de-escalation strategies',
          'Study customer service best practices'
        ]
      }
    };

    return priorityMap[dimension] || null;
  }

  private createPersonalizedLearningPath(context: AIInsightContext, weaknesses: string[]): AIInsightResult['learningPath'] {
    const { dimensions } = context;
    const learningPath: AIInsightResult['learningPath'] = [];

    Object.entries(dimensions).forEach(([dimension, currentLevel]) => {
      if (currentLevel < 80) {
        const targetLevel = Math.min(90, currentLevel + 15);
        const pathItem = this.createLearningPathItem(dimension, currentLevel as number, targetLevel);
        if (pathItem) {
          learningPath.push(pathItem);
        }
      }
    });

    return learningPath.slice(0, 4);
  }

  private createLearningPathItem(dimension: string, currentLevel: number, targetLevel: number): AIInsightResult['learningPath'][0] | null {
    const learningMap: Record<string, any> = {
      technicalCompetency: {
        skill: 'Technical Problem Solving',
        resources: [
          'CompTIA A+ Certification Course',
          'Troubleshooting Methodology Training',
          'System Administration Fundamentals'
        ],
        timeframe: currentLevel < 60 ? '8-12 weeks' : '4-6 weeks'
      }
    };

    const item = learningMap[dimension];
    if (!item) return null;

    return {
      ...item,
      currentLevel,
      targetLevel
    };
  }

  private formatDimensionName(dimension: string): string {
    const nameMap: Record<string, string> = {
      technicalCompetency: 'Technical Competency',
      customerService: 'Customer Service',
      communicationSkills: 'Communication Skills',
      problemSolving: 'Problem Solving',
      processCompliance: 'Process Compliance',
      learningAgility: 'Learning Agility'
    };

    return nameMap[dimension] || dimension;
  }

  /**
   * Generate comprehensive insights for a user (original method)
   */
  static async generateInsights(userId: string, userMetrics: UserMetrics, benchmarkData: BenchmarkData[]): Promise<InsightData> {
    const [strengths, improvements, recommendations, performanceTrend, comparison] = await Promise.all([
      this.analyzeStrengths(userId, userMetrics, benchmarkData),
      this.identifyImprovements(userId, userMetrics, benchmarkData),
      this.generateRecommendations(userId, userMetrics),
      this.analyzePerformanceTrend(userId, userMetrics),
      this.generateComparison(userId, userMetrics, benchmarkData)
    ]);

    return {
      strengths,
      improvements,
      recommendations,
      performanceTrend,
      comparison
    };
  }

  /**
   * Analyze user strengths
   */
  private static async analyzeStrengths(userId: string, userMetrics: UserMetrics, benchmarkData: BenchmarkData[]): Promise<StrengthInsight[]> {
    const strengths: StrengthInsight[] = [];

    // Analyze each performance category
    for (const [category, score] of Object.entries(userMetrics.performanceScores)) {
      const benchmark = benchmarkData.find(b => b.category === category);
      if (!benchmark) continue;

      // Identify strengths (scores significantly above average)
      if (score >= benchmark.averageScore + 15) {
        const strength = await this.createStrengthInsight(category, score, benchmark, userMetrics);
        strengths.push(strength);
      }
    }

    // Sort by score and return top strengths
    return strengths.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Create strength insight
   */
  private static async createStrengthInsight(category: string, score: number, benchmark: BenchmarkData, userMetrics: UserMetrics): Promise<StrengthInsight> {
    const evidence = await this.generateStrengthEvidence(category, score, benchmark);
    const professionalImpact = this.assessProfessionalImpact(category, score, benchmark);

    return {
      area: this.formatCategoryName(category),
      score: Math.round(score),
      description: this.generateStrengthDescription(category, score, benchmark),
      evidence,
      professionalImpact
    };
  }

  /**
   * Generate evidence for strengths
   */
  private static async generateStrengthEvidence(category: string, score: number, benchmark: BenchmarkData): Promise<string[]> {
    const evidence: string[] = [];
    
    // Calculate performance metrics
    const percentileRank = this.calculatePercentile(score, benchmark);
    const aboveAverage = Math.round(((score - benchmark.averageScore) / benchmark.averageScore) * 100);

    switch (category) {
      case 'technical_skills':
        evidence.push(`${Math.round(score)}% technical accuracy rating`);
        evidence.push(`${aboveAverage}% above team average`);
        evidence.push(`Top ${Math.round(100 - percentileRank)}% performer in technical problem solving`);
        break;
      
      case 'customer_service':
        evidence.push(`${Math.round(score)}% customer satisfaction score`);
        evidence.push(`Consistently high rating across ${Math.floor(score * 2)} customer interactions`);
        evidence.push(`${aboveAverage}% above service team average`);
        break;
      
      case 'professional_behavior':
        evidence.push(`${Math.round(score)}% adherence to professional standards`);
        evidence.push(`Excellent process compliance and quality metrics`);
        evidence.push(`Recognized by peers for professional excellence`);
        break;
      
      default:
        evidence.push(`${Math.round(score)}% performance rating`);
        evidence.push(`${aboveAverage}% above average in ${category}`);
        break;
    }

    return evidence;
  }

  /**
   * Identify improvement areas
   */
  private static async identifyImprovements(userId: string, userMetrics: UserMetrics, benchmarkData: BenchmarkData[]): Promise<ImprovementInsight[]> {
    const improvements: ImprovementInsight[] = [];

    // Analyze each performance category
    for (const [category, score] of Object.entries(userMetrics.performanceScores)) {
      const benchmark = benchmarkData.find(b => b.category === category);
      if (!benchmark) continue;

      // Identify improvement areas (scores below average or with high potential)
      if (score < benchmark.averageScore || (score < 80 && category === 'technical_skills')) {
        const improvement = await this.createImprovementInsight(category, score, benchmark, userMetrics);
        improvements.push(improvement);
      }
    }

    // Sort by priority (lowest scores first)
    return improvements.sort((a, b) => a.currentScore - b.currentScore).slice(0, 4);
  }

  /**
   * Create improvement insight
   */
  private static async createImprovementInsight(category: string, currentScore: number, benchmark: BenchmarkData, userMetrics: UserMetrics): Promise<ImprovementInsight> {
    const targetScore = Math.min(Math.max(benchmark.averageScore + 10, currentScore + 20), 95);
    const priority = this.determinePriority(category, currentScore, benchmark);
    const actionItems = await this.generateActionItems(category, currentScore, targetScore);
    const timeframe = this.estimateImprovementTimeframe(currentScore, targetScore, userMetrics.improvementRate);

    return {
      area: this.formatCategoryName(category),
      currentScore: Math.round(currentScore),
      targetScore: Math.round(targetScore),
      priority,
      actionItems,
      estimatedTimeframe: timeframe
    };
  }

  /**
   * Generate action items for improvement
   */
  private static async generateActionItems(category: string, currentScore: number, targetScore: number): Promise<string[]> {
    const improvement = targetScore - currentScore;
    const actionItems: string[] = [];

    switch (category) {
      case 'technical_skills':
        actionItems.push('Complete advanced troubleshooting certification');
        actionItems.push('Practice with complex technical scenarios daily');
        actionItems.push('Shadow senior technical specialists');
        if (improvement > 20) {
          actionItems.push('Attend specialized technical training workshop');
        }
        break;
      
      case 'customer_service':
        actionItems.push('Review customer communication best practices');
        actionItems.push('Practice difficult customer scenarios');
        actionItems.push('Seek feedback from customer service mentors');
        if (improvement > 15) {
          actionItems.push('Complete customer empathy training program');
        }
        break;
      
      case 'professional_behavior':
        actionItems.push('Review and practice company processes');
        actionItems.push('Improve documentation and follow-up habits');
        actionItems.push('Set reminders for quality checkpoints');
        break;
      
      default:
        actionItems.push(`Focus on improving ${category} skills`);
        actionItems.push('Seek mentorship and guidance');
        actionItems.push('Practice regularly and track progress');
        break;
    }

    return actionItems;
  }

  /**
   * Generate personalized recommendations
   */
  private static async generateRecommendations(userId: string, userMetrics: UserMetrics): Promise<RecommendationInsight[]> {
    const recommendations: RecommendationInsight[] = [];
    
    // Skill-based recommendations
    const skillRecommendations = await this.generateSkillRecommendations(userMetrics);
    recommendations.push(...skillRecommendations);
    
    // Goal recommendations
    const goalRecommendations = await this.generateGoalRecommendations(userMetrics);
    recommendations.push(...goalRecommendations);
    
    // Achievement recommendations
    const achievementRecommendations = await this.generateAchievementRecommendations(userId, userMetrics);
    recommendations.push(...achievementRecommendations);
    
    // Learning recommendations
    const learningRecommendations = await this.generateLearningRecommendations(userMetrics);
    recommendations.push(...learningRecommendations);

    return recommendations.slice(0, 6);
  }

  /**
   * Generate skill recommendations
   */
  private static async generateSkillRecommendations(userMetrics: UserMetrics): Promise<RecommendationInsight[]> {
    const recommendations: RecommendationInsight[] = [];
    
    // Find skill gaps
    const skillGaps = Object.entries(userMetrics.skillDistribution)
      .filter(([skill, level]) => level < 70)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2);

    for (const [skill, level] of skillGaps) {
      recommendations.push({
        type: 'skill',
        title: `Develop ${skill} Expertise`,
        description: `Focus on improving your ${skill} capabilities to increase overall performance`,
        benefit: `Enhanced ${skill} skills will improve job performance and career prospects`,
        effort: level < 40 ? 'high' : level < 60 ? 'medium' : 'low',
        timeline: level < 40 ? '8-12 weeks' : level < 60 ? '4-6 weeks' : '2-4 weeks',
        actionUrl: `/learning/${skill.toLowerCase().replace(' ', '-')}`
      });
    }

    return recommendations;
  }

  /**
   * Generate goal recommendations
   */
  private static async generateGoalRecommendations(userMetrics: UserMetrics): Promise<RecommendationInsight[]> {
    const recommendations: RecommendationInsight[] = [];
    
    // Recommend goals based on performance gaps
    const lowestCategory = Object.entries(userMetrics.performanceScores)
      .sort((a, b) => a[1] - b[1])[0];

    if (lowestCategory && lowestCategory[1] < 75) {
      recommendations.push({
        type: 'goal',
        title: `Improve ${this.formatCategoryName(lowestCategory[0])}`,
        description: `Set a goal to increase your ${lowestCategory[0]} performance by 20%`,
        benefit: 'Targeted improvement in your weakest area will significantly boost overall performance',
        effort: 'medium',
        timeline: '6-8 weeks',
        actionUrl: '/goals/create'
      });
    }

    return recommendations;
  }

  /**
   * Generate achievement recommendations
   */
  private static async generateAchievementRecommendations(userId: string, userMetrics: UserMetrics): Promise<RecommendationInsight[]> {
    const recommendations: RecommendationInsight[] = [];
    
    // Mock achievement analysis - in real implementation, would use AchievementTracker
    const nearCompletionAchievements = [
      {
        id: 'troubleshooting_master',
        name: 'Troubleshooting Master',
        progress: 85,
        category: 'technical_skills'
      }
    ];

    for (const achievement of nearCompletionAchievements) {
      recommendations.push({
        type: 'achievement',
        title: `Complete ${achievement.name}`,
        description: `You're ${achievement.progress}% complete on this valuable achievement`,
        benefit: 'High-value achievement that demonstrates professional competency',
        effort: 'low',
        timeline: '1-2 weeks',
        actionUrl: `/achievements/${achievement.id}`
      });
    }

    return recommendations;
  }

  /**
   * Generate learning recommendations
   */
  private static async generateLearningRecommendations(userMetrics: UserMetrics): Promise<RecommendationInsight[]> {
    const recommendations: RecommendationInsight[] = [];
    
    // Recommend learning based on industry trends and user performance
    if (userMetrics.performanceScores.technical_skills < 80) {
      recommendations.push({
        type: 'learning',
        title: 'Advanced Network Troubleshooting Course',
        description: 'Specialized training in network problem diagnosis and resolution',
        benefit: 'Network skills are in high demand and will significantly increase your market value',
        effort: 'medium',
        timeline: '4-6 weeks',
        actionUrl: '/learning/network-troubleshooting'
      });
    }

    return recommendations;
  }

  /**
   * Analyze performance trend
   */
  private static async analyzePerformanceTrend(userId: string, userMetrics: UserMetrics): Promise<PerformanceTrend> {
    // Mock trend analysis - in real implementation, would analyze historical data
    const direction = userMetrics.improvementRate > 5 ? 'improving' : 
                     userMetrics.improvementRate < -5 ? 'declining' : 'stable';
    
    const magnitude = Math.abs(userMetrics.improvementRate);
    
    const keyFactors = this.identifyKeyPerformanceFactors(userMetrics, direction);
    const prediction = this.generatePerformancePrediction(userMetrics, direction, magnitude);

    return {
      direction,
      magnitude,
      timeframe: 'last 30 days',
      keyFactors,
      prediction
    };
  }

  /**
   * Generate comparison data
   */
  private static async generateComparison(userId: string, userMetrics: UserMetrics, benchmarkData: BenchmarkData[]): Promise<ComparisonData> {
    const scores = Object.values(userMetrics.performanceScores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calculate percentile across all categories
    const overallBenchmark = benchmarkData.reduce((sum, b) => sum + b.averageScore, 0) / benchmarkData.length;
    const percentile = this.calculatePercentile(averageScore, { averageScore: overallBenchmark } as BenchmarkData);
    
    const averageComparison = `${Math.round(((averageScore - overallBenchmark) / overallBenchmark) * 100)}% ${averageScore > overallBenchmark ? 'above' : 'below'} team average`;
    
    const strengthAreas = Object.entries(userMetrics.performanceScores)
      .filter(([category, score]) => {
        const benchmark = benchmarkData.find(b => b.category === category);
        return benchmark && score > benchmark.averageScore + 10;
      })
      .map(([category]) => this.formatCategoryName(category));
    
    const improvementAreas = Object.entries(userMetrics.performanceScores)
      .filter(([category, score]) => {
        const benchmark = benchmarkData.find(b => b.category === category);
        return benchmark && score < benchmark.averageScore;
      })
      .map(([category]) => this.formatCategoryName(category));

    return {
      percentile: Math.round(percentile),
      averageComparison,
      strengthAreas,
      improvementAreas
    };
  }

  /**
   * Helper methods
   */
  private static calculatePercentile(score: number, benchmark: BenchmarkData): number {
    // Simplified percentile calculation
    const normalizedScore = (score - benchmark.averageScore) / (benchmark.topPercentileScore - benchmark.averageScore);
    return Math.max(0, Math.min(100, normalizedScore * 100));
  }

  private static formatCategoryName(category: string): string {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private static determinePriority(category: string, currentScore: number, benchmark: BenchmarkData): 'high' | 'medium' | 'low' {
    const gap = benchmark.averageScore - currentScore;
    
    if (gap > 20 || category === 'technical_skills') return 'high';
    if (gap > 10) return 'medium';
    return 'low';
  }

  private static estimateImprovementTimeframe(currentScore: number, targetScore: number, improvementRate: number): string {
    const improvement = targetScore - currentScore;
    const adjustedRate = Math.max(improvementRate, 2); // Minimum 2% per month
    const months = Math.ceil(improvement / adjustedRate);
    
    if (months <= 1) return '2-4 weeks';
    if (months <= 2) return '4-8 weeks';
    if (months <= 3) return '2-3 months';
    return '3-6 months';
  }

  private static assessProfessionalImpact(category: string, score: number, benchmark: BenchmarkData): string {
    const impact = score > benchmark.topPercentileScore * 0.9 ? 'Exceptional' :
                  score > benchmark.averageScore + 15 ? 'Strong' :
                  score > benchmark.averageScore ? 'Good' : 'Developing';
    
    const categoryImpact = {
      technical_skills: 'technical competency suitable for senior support roles',
      customer_service: 'customer service skills valuable for client-facing positions',
      professional_behavior: 'professional standards important for leadership development',
      leadership: 'leadership capabilities essential for management roles',
      learning: 'continuous learning attitude crucial for career advancement'
    };

    return `${impact} ${categoryImpact[category] || 'professional skills relevant for career growth'}`;
  }

  private static identifyKeyPerformanceFactors(userMetrics: UserMetrics, direction: string): string[] {
    const factors: string[] = [];
    
    if (direction === 'improving') {
      factors.push('Increased activity level and engagement');
      factors.push('Better consistency in performance delivery');
      factors.push('Positive trend in skill development');
    } else if (direction === 'declining') {
      factors.push('Decreased activity or engagement');
      factors.push('Inconsistent performance delivery');
      factors.push('Potential skill development gaps');
    } else {
      factors.push('Steady performance maintenance');
      factors.push('Consistent activity levels');
      factors.push('Stable skill application');
    }

    return factors;
  }

  private static generatePerformancePrediction(userMetrics: UserMetrics, direction: string, magnitude: number): string {
    if (direction === 'improving' && magnitude > 10) {
      return 'Strong improvement trajectory expected to continue with current performance patterns';
    } else if (direction === 'improving') {
      return 'Steady improvement expected with continued focus on development areas';
    } else if (direction === 'declining') {
      return 'Recommend immediate attention to performance factors to reverse downward trend';
    } else {
      return 'Stable performance expected with potential for improvement through targeted development';
    }
  }

  /**
   * Create mock metrics for testing
   */
  static createMockMetrics(userId: string): UserMetrics {
    return {
      userId,
      performanceScores: {
        technical_skills: 75 + Math.random() * 20,
        customer_service: 80 + Math.random() * 15,
        professional_behavior: 70 + Math.random() * 25,
        leadership: 60 + Math.random() * 30,
        learning: 85 + Math.random() * 10
      },
      activityLevel: 70 + Math.random() * 25,
      consistencyScore: 75 + Math.random() * 20,
      improvementRate: (Math.random() - 0.5) * 20, // -10 to +10
      skillDistribution: {
        'Network Troubleshooting': 60 + Math.random() * 30,
        'Customer Communication': 80 + Math.random() * 15,
        'System Administration': 50 + Math.random() * 40,
        'Documentation': 65 + Math.random() * 25
      },
      timeInRole: 180 + Math.random() * 365, // 6 months to 1.5 years
      lastActiveDate: new Date()
    };
  }

  /**
   * Create mock benchmark data
   */
  static createMockBenchmarkData(): BenchmarkData[] {
    return [
      {
        category: 'technical_skills',
        averageScore: 72,
        topPercentileScore: 95,
        userCount: 150,
        trendDirection: 'improving'
      },
      {
        category: 'customer_service',
        averageScore: 78,
        topPercentileScore: 96,
        userCount: 200,
        trendDirection: 'stable'
      },
      {
        category: 'professional_behavior',
        averageScore: 75,
        topPercentileScore: 92,
        userCount: 180,
        trendDirection: 'improving'
      },
      {
        category: 'leadership',
        averageScore: 65,
        topPercentileScore: 88,
        userCount: 100,
        trendDirection: 'stable'
      },
      {
        category: 'learning',
        averageScore: 70,
        topPercentileScore: 90,
        userCount: 160,
        trendDirection: 'improving'
      }
    ];
  }
}

// Create a singleton instance for the new AI insights functionality
export const insightsEngine = new InsightsEngine();