import { logger } from '../utils/logger';

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  title: string;
  summary: string;
  experienceLevel: 'entry' | 'intermediate' | 'advanced' | 'expert';
  currentRole: string;
  department?: string;
  company?: string;
  location?: string;
  joinDate: Date;
  careerGoals: string[];
  certifications: Certification[];
  contactInfo: ContactInfo;
}

interface ContactInfo {
  email: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  address?: {
    city: string;
    state: string;
    country: string;
  };
}

interface Certification {
  id: string;
  name: string;
  provider: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  verificationUrl?: string;
  status: 'active' | 'expired' | 'pending';
}

interface PerformanceMetrics {
  overall: number;
  dimensions: {
    technicalCompetency: number;
    customerService: number;
    communicationSkills: number;
    problemSolving: number;
    processCompliance: number;
    learningAgility: number;
  };
  subMetrics?: Record<string, number>;
}

interface FeedbackSummary {
  overallFeedback: string;
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
  rating: number;
  feedbackType: 'automated' | 'peer' | 'supervisor' | 'self';
  timestamp: Date;
}

interface Achievement {
  id: string;
  type: 'milestone' | 'certification' | 'performance' | 'skill_mastery' | 'recognition' | 'innovation';
  title: string;
  description: string;
  category: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  earnedDate: Date;
  evidence: string[];
  verificationStatus: 'verified' | 'pending' | 'unverified';
  points: number;
  badgeUrl?: string;
  shareableLink?: string;
}

interface ScenarioHistory {
  scenarioId: string;
  scenarioTitle: string;
  type: 'basic' | 'intermediate' | 'advanced' | 'expert' | 'custom';
  category: 'technical' | 'customer_service' | 'communication' | 'problem_solving' | 'process';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  tags: string[];
  completedAt: Date;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  attempts: number;
  performance: PerformanceMetrics;
  feedback: FeedbackSummary;
  achievements: Achievement[];
  skillsDemonstrated: string[];
  competenciesEvidence: CompetencyEvidence[];
  context: {
    environment: string;
    timeConstraints: boolean;
    interruptions: number;
    toolsUsed: string[];
    supportAccessed: boolean;
  };
  outcome: {
    success: boolean;
    completionRate: number;
    quality: number;
    efficiency: number;
    customerSatisfaction?: number;
  };
}

interface CompetencyEvidence {
  competencyId: string;
  competencyName: string;
  evidence: {
    scenario: string;
    description: string;
    actions: string[];
    outcome: string;
    metrics: PerformanceMetrics;
    validation: {
      method: 'automated' | 'peer_review' | 'supervisor' | 'self_assessment';
      validator?: string;
      timestamp: Date;
      confidence: number;
    };
  };
  timestamp: Date;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  relatedAchievements: string[];
}

interface SkillProgression {
  skillId: string;
  skillName: string;
  category: string;
  initialScore: number;
  currentScore: number;
  targetScore: number;
  progressHistory: Array<{
    date: Date;
    score: number;
    milestone?: string;
    evidence?: string;
  }>;
  developmentPlan: {
    goals: string[];
    timeline: string;
    resources: string[];
    mentors: string[];
  };
  certificationPath?: string[];
}

interface PerformanceTimeline {
  date: Date;
  eventType: 'scenario_completion' | 'achievement_earned' | 'skill_milestone' | 'certification' | 'performance_review';
  eventId: string;
  title: string;
  description: string;
  impact: 'positive' | 'neutral' | 'negative';
  metrics?: PerformanceMetrics;
  visibility: 'public' | 'private' | 'employer' | 'peer';
}

interface CareerProgression {
  currentLevel: string;
  nextLevel: string;
  progressToNext: number; // 0-100
  timeline: Array<{
    date: Date;
    level: string;
    role: string;
    achievements: string[];
    keySkills: string[];
  }>;
  goals: Array<{
    goal: string;
    targetDate: Date;
    progress: number;
    milestones: string[];
    status: 'not_started' | 'in_progress' | 'completed' | 'deferred';
  }>;
  recommendations: string[];
}

interface PerformanceHistory {
  user: UserProfile;
  summary: {
    totalScenarios: number;
    totalHours: number;
    averageScore: number;
    bestPerformance: number;
    improvementRate: number;
    consistencyScore: number;
    skillProgression: SkillProgression[];
    keyAchievements: Achievement[];
    competencyEvidence: CompetencyEvidence[];
    participationPeriod: {
      startDate: Date;
      endDate: Date;
      activeDays: number;
    };
  };
  scenarios: ScenarioHistory[];
  timeline: PerformanceTimeline[];
  progression: CareerProgression;
  certifications: Certification[];
  statistics: {
    performanceTrends: Array<{
      period: string;
      averageScore: number;
      improvement: number;
      scenarios: number;
    }>;
    competencyBreakdown: Record<string, {
      current: number;
      trend: 'improving' | 'stable' | 'declining';
      rank: number;
    }>;
    achievementStats: {
      total: number;
      byCategory: Record<string, number>;
      byLevel: Record<string, number>;
      recentCount: number;
    };
  };
  metadata: {
    lastUpdated: Date;
    version: string;
    dataCompleteness: number;
    verificationLevel: 'basic' | 'standard' | 'premium' | 'verified';
  };
}

interface HistoryQueryOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  scenarios?: {
    types?: string[];
    categories?: string[];
    difficulties?: string[];
    minScore?: number;
  };
  achievements?: {
    types?: string[];
    levels?: string[];
    verified?: boolean;
  };
  skills?: {
    categories?: string[];
    minProgress?: number;
  };
  includeEvidence?: boolean;
  includeFeedback?: boolean;
  sortBy?: 'date' | 'score' | 'difficulty' | 'duration';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface PerformanceAnalytics {
  trends: {
    overall: {
      direction: 'improving' | 'stable' | 'declining';
      rate: number;
      confidence: number;
      projection: Array<{date: Date; projected: number}>;
    };
    byCompetency: Record<string, {
      direction: 'improving' | 'stable' | 'declining';
      rate: number;
      currentScore: number;
      projectedScore: number;
    }>;
  };
  patterns: {
    bestPerformanceTimes: string[];
    preferredScenarioTypes: string[];
    learningVelocity: number;
    consistencyFactors: string[];
  };
  insights: {
    strengths: string[];
    growthAreas: string[];
    recommendations: string[];
    nextMilestones: string[];
  };
}

class HistoryManager {
  private userHistories: Map<string, PerformanceHistory> = new Map();
  private scenarioCache: Map<string, ScenarioHistory[]> = new Map();

  constructor() {
    this.initializeHistorySystem();
  }

  /**
   * Get complete performance history for a user
   */
  async getCompleteHistory(
    userId: string, 
    options?: HistoryQueryOptions
  ): Promise<PerformanceHistory> {
    try {
      logger.info(`Retrieving complete performance history for user ${userId}`);

      let history = this.userHistories.get(userId);
      if (!history) {
        history = await this.initializeUserHistory(userId);
      }

      // Apply filtering if options provided
      if (options) {
        history = this.applyHistoryFilters(history, options);
      }

      // Update metadata
      history.metadata.lastUpdated = new Date();
      history.metadata.dataCompleteness = this.calculateDataCompleteness(history);

      return history;
    } catch (error) {
      logger.error('Error retrieving complete history:', error);
      throw new Error('Failed to retrieve performance history');
    }
  }

  /**
   * Add scenario completion to history
   */
  async addScenarioCompletion(
    userId: string,
    scenarioData: Omit<ScenarioHistory, 'competenciesEvidence'>
  ): Promise<void> {
    try {
      logger.info(`Adding scenario completion for user ${userId}: ${scenarioData.scenarioId}`);

      const history = await this.getCompleteHistory(userId);
      
      // Add competency evidence based on performance
      const competenciesEvidence = await this.generateCompetencyEvidence(scenarioData);
      const completeScenarioData: ScenarioHistory = {
        ...scenarioData,
        competenciesEvidence
      };

      // Add to scenarios
      history.scenarios.push(completeScenarioData);

      // Update timeline
      const timelineEvent: PerformanceTimeline = {
        date: scenarioData.completedAt,
        eventType: 'scenario_completion',
        eventId: scenarioData.scenarioId,
        title: `Completed: ${scenarioData.scenarioTitle}`,
        description: `${scenarioData.type} scenario completed with ${scenarioData.performance.overall}% performance`,
        impact: scenarioData.performance.overall >= 80 ? 'positive' : 'neutral',
        metrics: scenarioData.performance,
        visibility: 'private'
      };
      history.timeline.push(timelineEvent);

      // Update summary statistics
      await this.updateSummaryStatistics(history);

      // Update skill progression
      await this.updateSkillProgression(history, completeScenarioData);

      // Store updated history
      this.userHistories.set(userId, history);

      logger.info(`Scenario completion added successfully for user ${userId}`);
    } catch (error) {
      logger.error('Error adding scenario completion:', error);
      throw new Error('Failed to add scenario completion to history');
    }
  }

  /**
   * Add achievement to history
   */
  async addAchievement(userId: string, achievement: Achievement): Promise<void> {
    try {
      logger.info(`Adding achievement for user ${userId}: ${achievement.title}`);

      const history = await this.getCompleteHistory(userId);
      
      // Add to achievements
      history.summary.keyAchievements.push(achievement);

      // Update timeline
      const timelineEvent: PerformanceTimeline = {
        date: achievement.earnedDate,
        eventType: 'achievement_earned',
        eventId: achievement.id,
        title: `Achievement Earned: ${achievement.title}`,
        description: achievement.description,
        impact: 'positive',
        visibility: 'public'
      };
      history.timeline.push(timelineEvent);

      // Update achievement statistics
      history.statistics.achievementStats.total++;
      history.statistics.achievementStats.byCategory[achievement.category] = 
        (history.statistics.achievementStats.byCategory[achievement.category] || 0) + 1;
      history.statistics.achievementStats.byLevel[achievement.level] = 
        (history.statistics.achievementStats.byLevel[achievement.level] || 0) + 1;

      // Store updated history
      this.userHistories.set(userId, history);

      logger.info(`Achievement added successfully for user ${userId}`);
    } catch (error) {
      logger.error('Error adding achievement:', error);
      throw new Error('Failed to add achievement to history');
    }
  }

  /**
   * Update skill progression
   */
  async updateSkillScore(
    userId: string,
    skillId: string,
    newScore: number,
    evidence?: string
  ): Promise<void> {
    try {
      logger.info(`Updating skill score for user ${userId}: ${skillId} -> ${newScore}`);

      const history = await this.getCompleteHistory(userId);
      
      let skillProgression = history.summary.skillProgression.find(s => s.skillId === skillId);
      
      if (!skillProgression) {
        // Create new skill progression
        skillProgression = {
          skillId,
          skillName: skillId.replace(/([A-Z])/g, ' $1').trim(),
          category: this.categorizeSkill(skillId),
          initialScore: newScore,
          currentScore: newScore,
          targetScore: newScore + 20,
          progressHistory: [],
          developmentPlan: {
            goals: [`Improve ${skillId} competency`],
            timeline: '3-6 months',
            resources: ['Training materials', 'Practice exercises'],
            mentors: []
          }
        };
        history.summary.skillProgression.push(skillProgression);
      }

      // Update current score and add to history
      const previousScore = skillProgression.currentScore;
      skillProgression.currentScore = newScore;
      skillProgression.progressHistory.push({
        date: new Date(),
        score: newScore,
        evidence
      });

      // Check for milestones
      if (newScore >= skillProgression.targetScore) {
        skillProgression.progressHistory[skillProgression.progressHistory.length - 1].milestone = 
          `Target score of ${skillProgression.targetScore} achieved`;
        
        // Set new target
        skillProgression.targetScore = Math.min(100, newScore + 15);
      }

      // Add timeline event for significant improvements
      if (newScore - previousScore >= 10) {
        const timelineEvent: PerformanceTimeline = {
          date: new Date(),
          eventType: 'skill_milestone',
          eventId: `${skillId}_improvement`,
          title: `Skill Improvement: ${skillProgression.skillName}`,
          description: `Improved from ${previousScore} to ${newScore} (+${newScore - previousScore} points)`,
          impact: 'positive',
          visibility: 'private'
        };
        history.timeline.push(timelineEvent);
      }

      // Store updated history
      this.userHistories.set(userId, history);

      logger.info(`Skill score updated successfully for user ${userId}`);
    } catch (error) {
      logger.error('Error updating skill score:', error);
      throw new Error('Failed to update skill score');
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
  ): Promise<PerformanceAnalytics> {
    try {
      logger.info(`Generating performance analytics for user ${userId} (${timeframe})`);

      const history = await this.getCompleteHistory(userId);
      const timeframeData = this.filterByTimeframe(history, timeframe);

      const analytics: PerformanceAnalytics = {
        trends: await this.calculateTrends(timeframeData),
        patterns: await this.identifyPatterns(timeframeData),
        insights: await this.generateInsights(timeframeData)
      };

      return analytics;
    } catch (error) {
      logger.error('Error generating performance analytics:', error);
      throw new Error('Failed to generate performance analytics');
    }
  }

  /**
   * Export history data
   */
  async exportHistoryData(
    userId: string,
    format: 'json' | 'csv' | 'summary',
    options?: HistoryQueryOptions
  ): Promise<string | object> {
    try {
      logger.info(`Exporting history data for user ${userId} in ${format} format`);

      const history = await this.getCompleteHistory(userId, options);

      switch (format) {
        case 'json':
          return JSON.stringify(history, null, 2);
        
        case 'csv':
          return this.convertToCSV(history);
        
        case 'summary':
          return this.generateSummaryReport(history);
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Error exporting history data:', error);
      throw new Error('Failed to export history data');
    }
  }

  /**
   * Get competency evidence for specific skill
   */
  async getCompetencyEvidence(
    userId: string,
    competencyId: string
  ): Promise<CompetencyEvidence[]> {
    try {
      logger.info(`Retrieving competency evidence for user ${userId}: ${competencyId}`);

      const history = await this.getCompleteHistory(userId);
      
      return history.summary.competencyEvidence.filter(
        evidence => evidence.competencyId === competencyId
      );
    } catch (error) {
      logger.error('Error retrieving competency evidence:', error);
      throw new Error('Failed to retrieve competency evidence');
    }
  }

  /**
   * Get achievement history
   */
  async getAchievementHistory(
    userId: string,
    category?: string,
    level?: string
  ): Promise<Achievement[]> {
    try {
      logger.info(`Retrieving achievement history for user ${userId}`);

      const history = await this.getCompleteHistory(userId);
      let achievements = history.summary.keyAchievements;

      if (category) {
        achievements = achievements.filter(a => a.category === category);
      }

      if (level) {
        achievements = achievements.filter(a => a.level === level);
      }

      return achievements.sort((a, b) => b.earnedDate.getTime() - a.earnedDate.getTime());
    } catch (error) {
      logger.error('Error retrieving achievement history:', error);
      throw new Error('Failed to retrieve achievement history');
    }
  }

  // Private helper methods

  private initializeHistorySystem(): void {
    logger.info('Initializing History Manager system');
    
    // Initialize system components
    this.userHistories.clear();
    this.scenarioCache.clear();
    
    logger.info('History Manager system initialized successfully');
  }

  private async initializeUserHistory(userId: string): Promise<PerformanceHistory> {
    // Create default history structure for new user
    const defaultHistory: PerformanceHistory = {
      user: {
        userId,
        name: 'User Name',
        email: 'user@example.com',
        title: 'IT Professional',
        summary: 'Developing IT professional focused on continuous learning and growth',
        experienceLevel: 'intermediate',
        currentRole: 'Support Specialist',
        joinDate: new Date(),
        careerGoals: ['Technical Excellence', 'Professional Growth'],
        certifications: [],
        contactInfo: {
          email: 'user@example.com'
        }
      },
      summary: {
        totalScenarios: 0,
        totalHours: 0,
        averageScore: 0,
        bestPerformance: 0,
        improvementRate: 0,
        consistencyScore: 0,
        skillProgression: [],
        keyAchievements: [],
        competencyEvidence: [],
        participationPeriod: {
          startDate: new Date(),
          endDate: new Date(),
          activeDays: 0
        }
      },
      scenarios: [],
      timeline: [],
      progression: {
        currentLevel: 'Developing Professional',
        nextLevel: 'Competent Professional',
        progressToNext: 0,
        timeline: [],
        goals: [],
        recommendations: []
      },
      certifications: [],
      statistics: {
        performanceTrends: [],
        competencyBreakdown: {},
        achievementStats: {
          total: 0,
          byCategory: {},
          byLevel: {},
          recentCount: 0
        }
      },
      metadata: {
        lastUpdated: new Date(),
        version: '1.0',
        dataCompleteness: 0,
        verificationLevel: 'basic'
      }
    };

    this.userHistories.set(userId, defaultHistory);
    return defaultHistory;
  }

  private applyHistoryFilters(history: PerformanceHistory, options: HistoryQueryOptions): PerformanceHistory {
    const filteredHistory = { ...history };

    // Filter scenarios
    if (options.dateRange || options.scenarios) {
      filteredHistory.scenarios = history.scenarios.filter(scenario => {
        // Date range filter
        if (options.dateRange) {
          if (scenario.completedAt < options.dateRange.start || 
              scenario.completedAt > options.dateRange.end) {
            return false;
          }
        }

        // Scenario filters
        if (options.scenarios) {
          if (options.scenarios.types && !options.scenarios.types.includes(scenario.type)) {
            return false;
          }
          if (options.scenarios.categories && !options.scenarios.categories.includes(scenario.category)) {
            return false;
          }
          if (options.scenarios.difficulties && !options.scenarios.difficulties.includes(scenario.difficulty)) {
            return false;
          }
          if (options.scenarios.minScore && scenario.performance.overall < options.scenarios.minScore) {
            return false;
          }
        }

        return true;
      });
    }

    // Apply sorting
    if (options.sortBy) {
      filteredHistory.scenarios.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (options.sortBy) {
          case 'date':
            aVal = a.completedAt.getTime();
            bVal = b.completedAt.getTime();
            break;
          case 'score':
            aVal = a.performance.overall;
            bVal = b.performance.overall;
            break;
          case 'difficulty':
            const difficultyOrder = { easy: 1, medium: 2, hard: 3, expert: 4 };
            aVal = difficultyOrder[a.difficulty];
            bVal = difficultyOrder[b.difficulty];
            break;
          case 'duration':
            aVal = a.duration;
            bVal = b.duration;
            break;
          default:
            aVal = a.completedAt.getTime();
            bVal = b.completedAt.getTime();
        }

        return options.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    // Apply pagination
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit ? offset + options.limit : undefined;
      filteredHistory.scenarios = filteredHistory.scenarios.slice(offset, limit);
    }

    return filteredHistory;
  }

  private calculateDataCompleteness(history: PerformanceHistory): number {
    let completeness = 0;
    let maxPoints = 100;

    // Basic profile data (20 points)
    if (history.user.name && history.user.name !== 'User Name') completeness += 5;
    if (history.user.title && history.user.title !== 'IT Professional') completeness += 5;
    if (history.user.summary && history.user.summary.length > 50) completeness += 5;
    if (history.user.careerGoals.length > 0) completeness += 5;

    // Performance data (40 points)
    if (history.summary.totalScenarios > 0) completeness += 10;
    if (history.summary.totalScenarios >= 10) completeness += 10;
    if (history.summary.skillProgression.length > 0) completeness += 10;
    if (history.summary.keyAchievements.length > 0) completeness += 10;

    // Evidence and validation (25 points)
    if (history.summary.competencyEvidence.length > 0) completeness += 10;
    if (history.certifications.length > 0) completeness += 10;
    if (history.summary.competencyEvidence.some(e => e.verificationStatus === 'verified')) completeness += 5;

    // Timeline and progression (15 points)
    if (history.timeline.length > 0) completeness += 5;
    if (history.progression.goals.length > 0) completeness += 5;
    if (history.statistics.performanceTrends.length > 0) completeness += 5;

    return Math.round((completeness / maxPoints) * 100);
  }

  private async generateCompetencyEvidence(scenarioData: Omit<ScenarioHistory, 'competenciesEvidence'>): Promise<CompetencyEvidence[]> {
    const evidence: CompetencyEvidence[] = [];

    // Generate evidence based on skills demonstrated
    for (const skill of scenarioData.skillsDemonstrated) {
      evidence.push({
        competencyId: skill,
        competencyName: skill.replace(/([A-Z])/g, ' $1').trim(),
        evidence: {
          scenario: scenarioData.scenarioTitle,
          description: `Demonstrated ${skill} competency through successful scenario completion`,
          actions: [
            'Analyzed problem requirements',
            'Applied relevant skills and knowledge',
            'Achieved successful outcome'
          ],
          outcome: `Scenario completed with ${scenarioData.performance.overall}% performance score`,
          metrics: scenarioData.performance,
          validation: {
            method: 'automated',
            timestamp: new Date(),
            confidence: scenarioData.performance.overall / 100
          }
        },
        timestamp: scenarioData.completedAt,
        verificationStatus: 'verified',
        relatedAchievements: scenarioData.achievements.map(a => a.id)
      });
    }

    return evidence;
  }

  private async updateSummaryStatistics(history: PerformanceHistory): Promise<void> {
    // Update basic statistics
    history.summary.totalScenarios = history.scenarios.length;
    history.summary.totalHours = history.scenarios.reduce((sum, s) => sum + (s.duration / 60), 0);
    
    if (history.scenarios.length > 0) {
      const scores = history.scenarios.map(s => s.performance.overall);
      history.summary.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      history.summary.bestPerformance = Math.max(...scores);
      
      // Calculate improvement rate
      if (history.scenarios.length >= 2) {
        const firstScore = history.scenarios[0].performance.overall;
        const lastScore = history.scenarios[history.scenarios.length - 1].performance.overall;
        history.summary.improvementRate = ((lastScore - firstScore) / firstScore) * 100;
      }
      
      // Calculate consistency score (lower standard deviation = higher consistency)
      const avgScore = history.summary.averageScore;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
      const standardDeviation = Math.sqrt(variance);
      history.summary.consistencyScore = Math.max(0, 100 - (standardDeviation * 2));
    }

    // Update participation period
    if (history.scenarios.length > 0) {
      const dates = history.scenarios.map(s => s.completedAt);
      history.summary.participationPeriod.startDate = new Date(Math.min(...dates.map(d => d.getTime())));
      history.summary.participationPeriod.endDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      // Calculate active days (unique dates)
      const uniqueDates = new Set(dates.map(d => d.toDateString()));
      history.summary.participationPeriod.activeDays = uniqueDates.size;
    }
  }

  private async updateSkillProgression(history: PerformanceHistory, scenarioData: ScenarioHistory): Promise<void> {
    // Update skill progression based on scenario performance
    for (const skill of scenarioData.skillsDemonstrated) {
      const skillScore = scenarioData.performance.dimensions[skill as keyof typeof scenarioData.performance.dimensions] || 
                       scenarioData.performance.overall;
      
      await this.updateSkillScore(history.user.userId, skill, skillScore, 
        `Performance in ${scenarioData.scenarioTitle}`);
    }
  }

  private categorizeSkill(skillId: string): string {
    const categories: Record<string, string> = {
      technicalCompetency: 'Technical',
      problemSolving: 'Technical',
      customerService: 'Service',
      communicationSkills: 'Communication',
      processCompliance: 'Process',
      learningAgility: 'Development'
    };
    
    return categories[skillId] || 'General';
  }

  private filterByTimeframe(history: PerformanceHistory, timeframe: string): PerformanceHistory {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeframe) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return history; // 'all' - return everything
    }

    return this.applyHistoryFilters(history, {
      dateRange: { start: cutoffDate, end: now }
    });
  }

  private async calculateTrends(history: PerformanceHistory): Promise<PerformanceAnalytics['trends']> {
    const scenarios = history.scenarios.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
    
    if (scenarios.length < 2) {
      return {
        overall: { direction: 'stable', rate: 0, confidence: 0, projection: [] },
        byCompetency: {}
      };
    }

    // Calculate overall trend
    const firstScore = scenarios[0].performance.overall;
    const lastScore = scenarios[scenarios.length - 1].performance.overall;
    const overallRate = (lastScore - firstScore) / scenarios.length;
    
    const overallDirection: 'improving' | 'stable' | 'declining' = 
      overallRate > 1 ? 'improving' : overallRate < -1 ? 'declining' : 'stable';

    // Generate projection
    const projection = [];
    for (let i = 1; i <= 12; i++) {
      const projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + i);
      const projectedScore = Math.min(100, Math.max(0, lastScore + (overallRate * i)));
      projection.push({ date: projectedDate, projected: projectedScore });
    }

    const trends: PerformanceAnalytics['trends'] = {
      overall: {
        direction: overallDirection,
        rate: Math.abs(overallRate),
        confidence: Math.min(100, scenarios.length * 10) / 100,
        projection
      },
      byCompetency: {}
    };

    // Calculate competency-specific trends
    const competencies = ['technicalCompetency', 'customerService', 'communicationSkills', 'problemSolving', 'processCompliance', 'learningAgility'];
    
    for (const competency of competencies) {
      const competencyScores = scenarios.map(s => s.performance.dimensions[competency as keyof typeof s.performance.dimensions] || s.performance.overall);
      const firstCompScore = competencyScores[0];
      const lastCompScore = competencyScores[competencyScores.length - 1];
      const compRate = (lastCompScore - firstCompScore) / competencyScores.length;
      
      trends.byCompetency[competency] = {
        direction: compRate > 1 ? 'improving' : compRate < -1 ? 'declining' : 'stable',
        rate: Math.abs(compRate),
        currentScore: lastCompScore,
        projectedScore: Math.min(100, Math.max(0, lastCompScore + (compRate * 3)))
      };
    }

    return trends;
  }

  private async identifyPatterns(history: PerformanceHistory): Promise<PerformanceAnalytics['patterns']> {
    // Analyze patterns in performance data
    const scenarios = history.scenarios;
    
    // Best performance times
    const hourlyPerformance: Record<number, number[]> = {};
    scenarios.forEach(scenario => {
      const hour = scenario.completedAt.getHours();
      if (!hourlyPerformance[hour]) hourlyPerformance[hour] = [];
      hourlyPerformance[hour].push(scenario.performance.overall);
    });
    
    const bestHours = Object.entries(hourlyPerformance)
      .map(([hour, scores]) => ({
        hour: parseInt(hour),
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3)
      .map(h => `${h.hour}:00`);

    // Preferred scenario types
    const typePerformance: Record<string, number[]> = {};
    scenarios.forEach(scenario => {
      if (!typePerformance[scenario.type]) typePerformance[scenario.type] = [];
      typePerformance[scenario.type].push(scenario.performance.overall);
    });
    
    const preferredTypes = Object.entries(typePerformance)
      .map(([type, scores]) => ({
        type,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length
      }))
      .filter(t => t.count >= 2)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3)
      .map(t => t.type);

    // Learning velocity (improvement per scenario)
    let learningVelocity = 0;
    if (scenarios.length >= 5) {
      const recent = scenarios.slice(-5);
      const earlier = scenarios.slice(0, 5);
      const recentAvg = recent.reduce((sum, s) => sum + s.performance.overall, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, s) => sum + s.performance.overall, 0) / earlier.length;
      learningVelocity = (recentAvg - earlierAvg) / 5;
    }

    // Consistency factors
    const consistencyFactors = [];
    if (history.summary.consistencyScore > 80) {
      consistencyFactors.push('High performance consistency');
    }
    if (scenarios.filter(s => s.attempts === 1).length / scenarios.length > 0.8) {
      consistencyFactors.push('Strong first-attempt success rate');
    }
    if (scenarios.filter(s => s.duration <= 30).length / scenarios.length > 0.7) {
      consistencyFactors.push('Efficient task completion');
    }

    return {
      bestPerformanceTimes: bestHours,
      preferredScenarioTypes: preferredTypes,
      learningVelocity,
      consistencyFactors
    };
  }

  private async generateInsights(history: PerformanceHistory): Promise<PerformanceAnalytics['insights']> {
    const scenarios = history.scenarios;
    const summary = history.summary;
    
    const insights: PerformanceAnalytics['insights'] = {
      strengths: [],
      growthAreas: [],
      recommendations: [],
      nextMilestones: []
    };

    // Identify strengths
    if (summary.averageScore >= 85) {
      insights.strengths.push('Consistently high performance across scenarios');
    }
    if (summary.consistencyScore >= 80) {
      insights.strengths.push('Strong performance consistency');
    }
    if (summary.improvementRate > 10) {
      insights.strengths.push('Excellent learning and improvement trajectory');
    }

    // Identify growth areas
    if (summary.averageScore < 75) {
      insights.growthAreas.push('Overall performance consistency needs improvement');
    }
    if (summary.improvementRate < 0) {
      insights.growthAreas.push('Performance trend shows decline - needs attention');
    }
    if (scenarios.length > 0) {
      const avgDuration = scenarios.reduce((sum, s) => sum + s.duration, 0) / scenarios.length;
      if (avgDuration > 45) {
        insights.growthAreas.push('Task completion efficiency could be improved');
      }
    }

    // Generate recommendations
    if (summary.totalScenarios < 10) {
      insights.recommendations.push('Complete more scenarios to build comprehensive skill evidence');
    }
    if (summary.keyAchievements.length < 5) {
      insights.recommendations.push('Focus on earning achievements to demonstrate competency milestones');
    }
    if (summary.competencyEvidence.length < 10) {
      insights.recommendations.push('Build stronger competency evidence through diverse scenario completion');
    }

    // Next milestones
    if (summary.averageScore < 80) {
      insights.nextMilestones.push('Achieve 80+ average performance score');
    }
    if (summary.totalScenarios < 25) {
      insights.nextMilestones.push('Complete 25 total scenarios');
    }
    if (summary.keyAchievements.length < 10) {
      insights.nextMilestones.push('Earn 10 professional achievements');
    }

    return insights;
  }

  private convertToCSV(history: PerformanceHistory): string {
    const headers = [
      'Date', 'Scenario', 'Type', 'Difficulty', 'Duration', 'Overall Score',
      'Technical', 'Customer Service', 'Communication', 'Problem Solving',
      'Process Compliance', 'Learning Agility', 'Achievements'
    ];

    const rows = history.scenarios.map(scenario => [
      scenario.completedAt.toISOString().split('T')[0],
      scenario.scenarioTitle,
      scenario.type,
      scenario.difficulty,
      scenario.duration.toString(),
      scenario.performance.overall.toString(),
      scenario.performance.dimensions.technicalCompetency.toString(),
      scenario.performance.dimensions.customerService.toString(),
      scenario.performance.dimensions.communicationSkills.toString(),
      scenario.performance.dimensions.problemSolving.toString(),
      scenario.performance.dimensions.processCompliance.toString(),
      scenario.performance.dimensions.learningAgility.toString(),
      scenario.achievements.length.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateSummaryReport(history: PerformanceHistory): object {
    return {
      user: {
        name: history.user.name,
        title: history.user.title,
        experienceLevel: history.user.experienceLevel
      },
      summary: {
        totalScenarios: history.summary.totalScenarios,
        totalHours: Math.round(history.summary.totalHours * 10) / 10,
        averageScore: Math.round(history.summary.averageScore * 10) / 10,
        bestPerformance: history.summary.bestPerformance,
        improvementRate: Math.round(history.summary.improvementRate * 10) / 10,
        consistencyScore: Math.round(history.summary.consistencyScore * 10) / 10
      },
      achievements: {
        total: history.summary.keyAchievements.length,
        byLevel: history.statistics.achievementStats.byLevel
      },
      competencies: history.summary.skillProgression.map(skill => ({
        skill: skill.skillName,
        current: skill.currentScore,
        progress: skill.currentScore - skill.initialScore
      })),
      recentActivity: history.timeline.slice(-5).map(event => ({
        date: event.date.toISOString().split('T')[0],
        event: event.title,
        impact: event.impact
      }))
    };
  }
}

export const historyManager = new HistoryManager();