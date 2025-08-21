import { logger } from '../utils/logger';

interface PeerProfile {
  userId: string;
  anonymizedId: string;
  experienceLevel: 'entry' | 'intermediate' | 'advanced' | 'expert';
  role: string;
  industry: string;
  region: string;
  timeInRole: number; // months
  performanceData: Record<string, number>;
  lastActive: Date;
  consentToComparison: boolean;
}

interface PeerGroup {
  id: string;
  name: string;
  criteria: {
    experienceLevel?: string;
    role?: string;
    industry?: string;
    region?: string;
    performanceRange?: {min: number; max: number};
  };
  members: PeerProfile[];
  statistics: {
    memberCount: number;
    averagePerformance: Record<string, number>;
    medianPerformance: Record<string, number>;
    percentile25: Record<string, number>;
    percentile75: Record<string, number>;
    topPerformers: Record<string, number>;
    lastUpdated: Date;
  };
}

interface PeerComparison {
  userPerformance: Record<string, number>;
  peerGroup: {
    id: string;
    name: string;
    memberCount: number;
    criteria: PeerGroup['criteria'];
  };
  rankings: {
    overall: {
      percentile: number;
      rank: number;
      totalPeers: number;
    };
    byDimension: Record<string, {
      percentile: number;
      rank: number;
      score: number;
      peerAverage: number;
      peerMedian: number;
      topPerformer: number;
    }>;
  };
  insights: {
    strengths: string[];
    opportunities: string[];
    peerTrends: string[];
    positionSummary: string;
  };
  anonymousHighlights: Array<{
    dimension: string;
    topPerformerScore: number;
    approaches: string[];
    learningOpportunities: string[];
  }>;
}

interface TrendAnalysis {
  dimension: string;
  userTrend: {
    direction: 'improving' | 'declining' | 'stable';
    rate: number; // points per month
    confidence: number;
  };
  peerTrend: {
    direction: 'improving' | 'declining' | 'stable';
    rate: number;
    confidence: number;
  };
  relativePosition: {
    current: number;
    projected3Months: number;
    projected6Months: number;
  };
}

class PeerComparator {
  private peerProfiles: Map<string, PeerProfile> = new Map();
  private peerGroups: Map<string, PeerGroup> = new Map();
  private comparisonHistory: Map<string, PeerComparison[]> = new Map();

  constructor() {
    this.initializeMockPeerData();
  }

  /**
   * Compare user performance against relevant peer groups
   */
  async compareToRelevantPeers(
    userId: string,
    userPerformance: Record<string, number>,
    userProfile: {
      experienceLevel: string;
      role: string;
      industry?: string;
      region?: string;
      timeInRole?: number;
    }
  ): Promise<PeerComparison[]> {
    try {
      logger.info(`Comparing user ${userId} to relevant peers`);

      const relevantGroups = this.findRelevantPeerGroups(userProfile);
      const comparisons: PeerComparison[] = [];

      for (const group of relevantGroups) {
        const comparison = await this.compareToSpecificGroup(
          userId,
          userPerformance,
          group,
          userProfile
        );
        comparisons.push(comparison);
      }

      // Store comparison history
      const history = this.comparisonHistory.get(userId) || [];
      history.push(...comparisons);
      this.comparisonHistory.set(userId, history.slice(-10)); // Keep last 10 comparisons

      logger.info(`Generated ${comparisons.length} peer comparisons for user ${userId}`);
      return comparisons;
    } catch (error) {
      logger.error('Error comparing to peers:', error);
      throw new Error('Failed to compare to peer groups');
    }
  }

  /**
   * Get anonymous peer insights and best practices
   */
  async getAnonymousPeerInsights(
    dimension: string,
    userScore: number,
    peerGroupId: string
  ): Promise<{
    topPerformersProfile: {
      averageScore: number;
      scoreRange: {min: number; max: number};
      commonTraits: string[];
      successFactors: string[];
    };
    improvementExamples: Array<{
      beforeScore: number;
      afterScore: number;
      timeframe: string;
      methods: string[];
      keyFactors: string[];
    }>;
    benchmarkInsights: string[];
  }> {
    try {
      logger.info(`Getting anonymous peer insights for ${dimension} in group ${peerGroupId}`);

      const group = this.peerGroups.get(peerGroupId);
      if (!group) {
        throw new Error(`Peer group ${peerGroupId} not found`);
      }

      const topPerformers = this.getTopPerformersInDimension(group, dimension);
      const improvementExamples = this.generateImprovementExamples(dimension, userScore);
      const benchmarkInsights = this.generateBenchmarkInsights(dimension, userScore, group);

      const topPerformersProfile = {
        averageScore: topPerformers.reduce((sum, p) => sum + p.performanceData[dimension], 0) / topPerformers.length,
        scoreRange: {
          min: Math.min(...topPerformers.map(p => p.performanceData[dimension])),
          max: Math.max(...topPerformers.map(p => p.performanceData[dimension]))
        },
        commonTraits: this.identifyCommonTraits(topPerformers, dimension),
        successFactors: this.identifySuccessFactors(topPerformers, dimension)
      };

      return {
        topPerformersProfile,
        improvementExamples,
        benchmarkInsights
      };
    } catch (error) {
      logger.error('Error getting anonymous peer insights:', error);
      throw new Error('Failed to retrieve peer insights');
    }
  }

  /**
   * Analyze performance trends relative to peers
   */
  async analyzePeerTrends(
    userId: string,
    historicalData: Array<{
      date: Date;
      performance: Record<string, number>;
    }>,
    peerGroupId: string
  ): Promise<TrendAnalysis[]> {
    try {
      logger.info(`Analyzing peer trends for user ${userId} in group ${peerGroupId}`);

      if (historicalData.length < 3) {
        throw new Error('Insufficient historical data for trend analysis');
      }

      const group = this.peerGroups.get(peerGroupId);
      if (!group) {
        throw new Error(`Peer group ${peerGroupId} not found`);
      }

      const dimensions = Object.keys(historicalData[0].performance);
      const trends: TrendAnalysis[] = [];

      for (const dimension of dimensions) {
        const userTrend = this.calculateUserTrend(historicalData, dimension);
        const peerTrend = this.calculatePeerTrend(group, dimension);
        const relativePosition = this.calculateRelativePosition(userTrend, peerTrend, historicalData[historicalData.length - 1].performance[dimension]);

        trends.push({
          dimension,
          userTrend,
          peerTrend,
          relativePosition
        });
      }

      return trends;
    } catch (error) {
      logger.error('Error analyzing peer trends:', error);
      throw new Error('Failed to analyze peer trends');
    }
  }

  /**
   * Get peer group statistics
   */
  async getPeerGroupStatistics(peerGroupId: string): Promise<PeerGroup['statistics']> {
    try {
      const group = this.peerGroups.get(peerGroupId);
      if (!group) {
        throw new Error(`Peer group ${peerGroupId} not found`);
      }

      return group.statistics;
    } catch (error) {
      logger.error('Error getting peer group statistics:', error);
      throw new Error('Failed to retrieve peer group statistics');
    }
  }

  /**
   * Find peers for mentorship matching (anonymized)
   */
  async findMentorshipMatches(
    userId: string,
    userProfile: {
      experienceLevel: string;
      strengths: string[];
      growthAreas: string[];
    },
    preferences: {
      mentorExperienceLevel: string[];
      focusAreas: string[];
      matchingCriteria: string[];
    }
  ): Promise<Array<{
    anonymizedId: string;
    experienceLevel: string;
    strengths: string[];
    mentorshipAreas: string[];
    compatibilityScore: number;
    matchReasons: string[];
  }>> {
    try {
      logger.info(`Finding mentorship matches for user ${userId}`);

      const potentialMentors = Array.from(this.peerProfiles.values()).filter(peer => 
        peer.consentToComparison &&
        preferences.mentorExperienceLevel.includes(peer.experienceLevel) &&
        peer.userId !== userId
      );

      const matches = potentialMentors.map(mentor => {
        const compatibilityScore = this.calculateCompatibilityScore(userProfile, mentor, preferences);
        const matchReasons = this.generateMatchReasons(userProfile, mentor, preferences);

        return {
          anonymizedId: mentor.anonymizedId,
          experienceLevel: mentor.experienceLevel,
          strengths: this.identifyStrengths(mentor),
          mentorshipAreas: this.identifyMentorshipAreas(mentor, userProfile.growthAreas),
          compatibilityScore,
          matchReasons
        };
      });

      return matches
        .filter(match => match.compatibilityScore >= 0.6)
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 5);
    } catch (error) {
      logger.error('Error finding mentorship matches:', error);
      throw new Error('Failed to find mentorship matches');
    }
  }

  // Private helper methods

  private initializeMockPeerData(): void {
    // Generate mock peer profiles for different experience levels and roles
    const roles = ['support', 'analyst', 'specialist', 'senior_support'];
    const experienceLevels = ['entry', 'intermediate', 'advanced', 'expert'];
    const industries = ['technology', 'finance', 'healthcare', 'education'];
    const regions = ['north_america', 'europe', 'asia_pacific', 'global'];

    let userId = 1;
    for (let i = 0; i < 500; i++) {
      const profile: PeerProfile = {
        userId: `peer-${userId}`,
        anonymizedId: `anon-${Math.random().toString(36).substr(2, 9)}`,
        experienceLevel: experienceLevels[Math.floor(Math.random() * experienceLevels.length)] as any,
        role: roles[Math.floor(Math.random() * roles.length)],
        industry: industries[Math.floor(Math.random() * industries.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        timeInRole: Math.floor(Math.random() * 60) + 6, // 6-66 months
        performanceData: this.generateMockPerformanceData(),
        lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        consentToComparison: Math.random() > 0.1 // 90% consent rate
      };

      this.peerProfiles.set(profile.userId, profile);
      userId++;
    }

    this.createPeerGroups();
  }

  private generateMockPerformanceData(): Record<string, number> {
    const baseScore = 60 + Math.random() * 35; // 60-95 range
    const variation = 15;

    return {
      technicalCompetency: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variation)),
      customerService: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variation)),
      communicationSkills: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variation)),
      problemSolving: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variation)),
      processCompliance: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variation)),
      learningAgility: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variation))
    };
  }

  private createPeerGroups(): void {
    const groupConfigs = [
      {
        id: 'entry-support',
        name: 'Entry Level Support Professionals',
        criteria: { experienceLevel: 'entry', role: 'support' }
      },
      {
        id: 'intermediate-support',
        name: 'Intermediate Support Professionals',
        criteria: { experienceLevel: 'intermediate', role: 'support' }
      },
      {
        id: 'advanced-support',
        name: 'Advanced Support Professionals',
        criteria: { experienceLevel: 'advanced', role: 'support' }
      },
      {
        id: 'specialist-technical',
        name: 'Technical Specialists',
        criteria: { role: 'specialist' }
      },
      {
        id: 'high-performers',
        name: 'High Performing Professionals',
        criteria: { performanceRange: { min: 85, max: 100 } }
      }
    ];

    for (const config of groupConfigs) {
      const members = this.filterPeersByCriteria(config.criteria);
      const statistics = this.calculateGroupStatistics(members);

      const group: PeerGroup = {
        id: config.id,
        name: config.name,
        criteria: config.criteria,
        members,
        statistics
      };

      this.peerGroups.set(config.id, group);
    }
  }

  private filterPeersByCriteria(criteria: PeerGroup['criteria']): PeerProfile[] {
    return Array.from(this.peerProfiles.values()).filter(peer => {
      if (criteria.experienceLevel && peer.experienceLevel !== criteria.experienceLevel) return false;
      if (criteria.role && peer.role !== criteria.role) return false;
      if (criteria.industry && peer.industry !== criteria.industry) return false;
      if (criteria.region && peer.region !== criteria.region) return false;
      
      if (criteria.performanceRange) {
        const avgScore = Object.values(peer.performanceData).reduce((a, b) => a + b, 0) / Object.values(peer.performanceData).length;
        if (avgScore < criteria.performanceRange.min || avgScore > criteria.performanceRange.max) return false;
      }

      return peer.consentToComparison;
    });
  }

  private calculateGroupStatistics(members: PeerProfile[]): PeerGroup['statistics'] {
    if (members.length === 0) {
      return {
        memberCount: 0,
        averagePerformance: {},
        medianPerformance: {},
        percentile25: {},
        percentile75: {},
        topPerformers: {},
        lastUpdated: new Date()
      };
    }

    const dimensions = Object.keys(members[0].performanceData);
    const statistics: PeerGroup['statistics'] = {
      memberCount: members.length,
      averagePerformance: {},
      medianPerformance: {},
      percentile25: {},
      percentile75: {},
      topPerformers: {},
      lastUpdated: new Date()
    };

    for (const dimension of dimensions) {
      const scores = members.map(m => m.performanceData[dimension]).sort((a, b) => a - b);
      
      statistics.averagePerformance[dimension] = scores.reduce((a, b) => a + b, 0) / scores.length;
      statistics.medianPerformance[dimension] = scores[Math.floor(scores.length / 2)];
      statistics.percentile25[dimension] = scores[Math.floor(scores.length * 0.25)];
      statistics.percentile75[dimension] = scores[Math.floor(scores.length * 0.75)];
      statistics.topPerformers[dimension] = scores[Math.floor(scores.length * 0.9)]; // 90th percentile
    }

    return statistics;
  }

  private findRelevantPeerGroups(userProfile: {
    experienceLevel: string;
    role: string;
    industry?: string;
    region?: string;
  }): PeerGroup[] {
    const relevantGroups: PeerGroup[] = [];

    for (const group of this.peerGroups.values()) {
      let relevanceScore = 0;

      if (group.criteria.experienceLevel === userProfile.experienceLevel) relevanceScore += 3;
      if (group.criteria.role === userProfile.role) relevanceScore += 2;
      if (group.criteria.industry === userProfile.industry) relevanceScore += 1;
      if (group.criteria.region === userProfile.region) relevanceScore += 1;

      // Include groups with high relevance or general high-performer groups
      if (relevanceScore >= 2 || group.id === 'high-performers') {
        relevantGroups.push(group);
      }
    }

    return relevantGroups.sort((a, b) => {
      // Sort by member count (larger groups first) for more reliable statistics
      return b.statistics.memberCount - a.statistics.memberCount;
    }).slice(0, 3); // Return top 3 most relevant groups
  }

  private async compareToSpecificGroup(
    userId: string,
    userPerformance: Record<string, number>,
    group: PeerGroup,
    userProfile: any
  ): Promise<PeerComparison> {
    const dimensions = Object.keys(userPerformance);
    const byDimension: PeerComparison['rankings']['byDimension'] = {};

    // Calculate rankings for each dimension
    for (const dimension of dimensions) {
      const userScore = userPerformance[dimension];
      const peerScores = group.members.map(m => m.performanceData[dimension]).sort((a, b) => b - a);
      
      const rank = peerScores.filter(score => score > userScore).length + 1;
      const percentile = ((peerScores.length - rank + 1) / peerScores.length) * 100;

      byDimension[dimension] = {
        percentile: Math.round(percentile),
        rank,
        score: userScore,
        peerAverage: group.statistics.averagePerformance[dimension],
        peerMedian: group.statistics.medianPerformance[dimension],
        topPerformer: group.statistics.topPerformers[dimension]
      };
    }

    // Calculate overall ranking
    const userOverall = Object.values(userPerformance).reduce((a, b) => a + b, 0) / dimensions.length;
    const peerOveralls = group.members.map(m => {
      const scores = Object.values(m.performanceData);
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    }).sort((a, b) => b - a);

    const overallRank = peerOveralls.filter(score => score > userOverall).length + 1;
    const overallPercentile = ((peerOveralls.length - overallRank + 1) / peerOveralls.length) * 100;

    // Generate insights
    const insights = this.generateComparisonInsights(userPerformance, byDimension, group);

    // Generate anonymous highlights
    const anonymousHighlights = this.generateAnonymousHighlights(dimensions, group);

    return {
      userPerformance,
      peerGroup: {
        id: group.id,
        name: group.name,
        memberCount: group.statistics.memberCount,
        criteria: group.criteria
      },
      rankings: {
        overall: {
          percentile: Math.round(overallPercentile),
          rank: overallRank,
          totalPeers: group.statistics.memberCount
        },
        byDimension
      },
      insights,
      anonymousHighlights
    };
  }

  private generateComparisonInsights(
    userPerformance: Record<string, number>,
    byDimension: PeerComparison['rankings']['byDimension'],
    group: PeerGroup
  ): PeerComparison['insights'] {
    const strengths: string[] = [];
    const opportunities: string[] = [];
    const peerTrends: string[] = [];

    // Identify strengths (top 25% performance)
    Object.entries(byDimension).forEach(([dimension, ranking]) => {
      if (ranking.percentile >= 75) {
        strengths.push(`${dimension}: ${ranking.percentile}th percentile (${ranking.score} vs ${ranking.peerAverage.toFixed(1)} peer average)`);
      } else if (ranking.percentile <= 25) {
        opportunities.push(`${dimension}: ${ranking.percentile}th percentile (${(ranking.peerAverage - ranking.score).toFixed(1)} points below peer average)`);
      }
    });

    // Generate peer trends
    peerTrends.push(`Group average performance: ${Object.values(group.statistics.averagePerformance).reduce((a, b) => a + b, 0) / Object.values(group.statistics.averagePerformance).length}`);
    peerTrends.push(`Top performers in group score: ${Object.values(group.statistics.topPerformers).reduce((a, b) => a + b, 0) / Object.values(group.statistics.topPerformers).length}`);

    // Generate position summary
    const overallPercentile = Object.values(byDimension).reduce((sum, ranking) => sum + ranking.percentile, 0) / Object.values(byDimension).length;
    let positionSummary = '';
    
    if (overallPercentile >= 80) {
      positionSummary = `You're performing exceptionally well, ranking in the top 20% of ${group.name}`;
    } else if (overallPercentile >= 60) {
      positionSummary = `You're performing above average among ${group.name}`;
    } else if (overallPercentile >= 40) {
      positionSummary = `Your performance is competitive with ${group.name}`;
    } else {
      positionSummary = `There are opportunities to improve relative to ${group.name}`;
    }

    return {
      strengths,
      opportunities,
      peerTrends,
      positionSummary
    };
  }

  private generateAnonymousHighlights(dimensions: string[], group: PeerGroup): PeerComparison['anonymousHighlights'] {
    return dimensions.map(dimension => {
      const topPerformers = this.getTopPerformersInDimension(group, dimension);
      const topScore = group.statistics.topPerformers[dimension];

      return {
        dimension,
        topPerformerScore: topScore,
        approaches: this.generateApproaches(dimension),
        learningOpportunities: this.generateLearningOpportunities(dimension)
      };
    });
  }

  private getTopPerformersInDimension(group: PeerGroup, dimension: string): PeerProfile[] {
    const threshold = group.statistics.percentile75[dimension];
    return group.members.filter(member => member.performanceData[dimension] >= threshold);
  }

  private generateApproaches(dimension: string): string[] {
    const approaches: Record<string, string[]> = {
      technicalCompetency: [
        'Systematic troubleshooting methodology',
        'Continuous learning and certification pursuit',
        'Hands-on practice with new technologies'
      ],
      customerService: [
        'Active listening and empathy techniques',
        'Proactive communication and follow-up',
        'Solution-focused problem resolution'
      ],
      communicationSkills: [
        'Clear, jargon-free explanations',
        'Regular check-ins and status updates',
        'Effective documentation practices'
      ],
      problemSolving: [
        'Root cause analysis techniques',
        'Creative solution generation',
        'Systematic approach to complex issues'
      ],
      processCompliance: [
        'Strict adherence to procedures',
        'Regular process review and improvement',
        'Quality assurance mindset'
      ],
      learningAgility: [
        'Rapid skill acquisition techniques',
        'Knowledge sharing and mentoring',
        'Adaptability to new situations'
      ]
    };

    return approaches[dimension] || ['Consistent practice and improvement', 'Seeking feedback and guidance', 'Professional development focus'];
  }

  private generateLearningOpportunities(dimension: string): string[] {
    const opportunities: Record<string, string[]> = {
      technicalCompetency: [
        'Advanced troubleshooting workshops',
        'Technology certification programs',
        'Hands-on lab experiences'
      ],
      customerService: [
        'Customer service excellence training',
        'Conflict resolution workshops',
        'Communication skills development'
      ],
      communicationSkills: [
        'Technical writing courses',
        'Presentation skills training',
        'Cross-cultural communication'
      ],
      problemSolving: [
        'Analytical thinking workshops',
        'Case study analysis',
        'Problem-solving methodology training'
      ],
      processCompliance: [
        'Quality management training',
        'Compliance frameworks education',
        'Process improvement certification'
      ],
      learningAgility: [
        'Learning acceleration techniques',
        'Adaptability training',
        'Change management skills'
      ]
    };

    return opportunities[dimension] || ['Professional development programs', 'Mentorship opportunities', 'Peer learning groups'];
  }

  private calculateUserTrend(historicalData: Array<{date: Date; performance: Record<string, number>}>, dimension: string): TrendAnalysis['userTrend'] {
    const scores = historicalData.map(d => d.performance[dimension]);
    const timePoints = historicalData.map(d => d.date.getTime());
    
    // Simple linear regression for trend
    const n = scores.length;
    const sumX = timePoints.reduce((a, b) => a + b, 0);
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * scores[i], 0);
    const sumXX = timePoints.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const rate = slope * (30 * 24 * 60 * 60 * 1000); // Convert to points per month
    
    return {
      direction: rate > 0.5 ? 'improving' : rate < -0.5 ? 'declining' : 'stable',
      rate: Math.abs(rate),
      confidence: Math.min(95, Math.max(60, n * 15)) // More data points = higher confidence
    };
  }

  private calculatePeerTrend(group: PeerGroup, dimension: string): TrendAnalysis['peerTrend'] {
    // Mock peer trend - in real implementation, this would use historical peer data
    return {
      direction: 'improving',
      rate: 0.8,
      confidence: 80
    };
  }

  private calculateRelativePosition(
    userTrend: TrendAnalysis['userTrend'],
    peerTrend: TrendAnalysis['peerTrend'],
    currentScore: number
  ): TrendAnalysis['relativePosition'] {
    const userRate = userTrend.direction === 'improving' ? userTrend.rate : -userTrend.rate;
    const peerRate = peerTrend.direction === 'improving' ? peerTrend.rate : -peerTrend.rate;
    
    return {
      current: currentScore,
      projected3Months: currentScore + (userRate * 3),
      projected6Months: currentScore + (userRate * 6)
    };
  }

  private identifyCommonTraits(topPerformers: PeerProfile[], dimension: string): string[] {
    // Mock trait identification - in real implementation, this would analyze actual patterns
    const traitsByDimension: Record<string, string[]> = {
      technicalCompetency: ['Strong analytical thinking', 'Continuous learning mindset', 'Systematic approach'],
      customerService: ['High emotional intelligence', 'Patient communication style', 'Solution-oriented mindset'],
      communicationSkills: ['Clear articulation', 'Active listening', 'Empathetic responses'],
      problemSolving: ['Creative thinking', 'Persistence', 'Collaborative approach'],
      processCompliance: ['Detail-oriented', 'Quality-focused', 'Disciplined execution'],
      learningAgility: ['Growth mindset', 'Adaptability', 'Knowledge sharing']
    };

    return traitsByDimension[dimension] || ['High performance orientation', 'Professional dedication', 'Continuous improvement focus'];
  }

  private identifySuccessFactors(topPerformers: PeerProfile[], dimension: string): string[] {
    const factorsByDimension: Record<string, string[]> = {
      technicalCompetency: ['Regular skill updates', 'Hands-on practice', 'Knowledge documentation'],
      customerService: ['Empathy development', 'Communication training', 'Feedback incorporation'],
      communicationSkills: ['Active practice', 'Feedback seeking', 'Multi-modal communication'],
      problemSolving: ['Methodical approaches', 'Creative techniques', 'Collaborative problem solving'],
      processCompliance: ['Systematic adherence', 'Regular reviews', 'Quality checkpoints'],
      learningAgility: ['Rapid experimentation', 'Feedback loops', 'Knowledge transfer']
    };

    return factorsByDimension[dimension] || ['Consistent effort', 'Professional development', 'Performance monitoring'];
  }

  private generateImprovementExamples(dimension: string, userScore: number): Array<{
    beforeScore: number;
    afterScore: number;
    timeframe: string;
    methods: string[];
    keyFactors: string[];
  }> {
    // Generate realistic improvement examples
    return [
      {
        beforeScore: Math.max(50, userScore - 10),
        afterScore: Math.min(95, userScore + 15),
        timeframe: '3 months',
        methods: ['Structured learning plan', 'Regular practice sessions', 'Peer feedback'],
        keyFactors: ['Consistent effort', 'Targeted focus', 'Measurement tracking']
      },
      {
        beforeScore: Math.max(45, userScore - 15),
        afterScore: Math.min(90, userScore + 20),
        timeframe: '6 months',
        methods: ['Comprehensive training program', 'Mentorship', 'Real-world application'],
        keyFactors: ['Long-term commitment', 'Professional guidance', 'Practical application']
      }
    ];
  }

  private generateBenchmarkInsights(dimension: string, userScore: number, group: PeerGroup): string[] {
    const peerAverage = group.statistics.averagePerformance[dimension];
    const gap = peerAverage - userScore;

    const insights: string[] = [];

    if (gap > 10) {
      insights.push(`Significant opportunity to improve - ${gap.toFixed(1)} points below peer average`);
      insights.push('Focus on fundamental skill building in this area');
    } else if (gap > 5) {
      insights.push(`Moderate improvement opportunity - ${gap.toFixed(1)} points below peer average`);
      insights.push('Targeted development could quickly close this gap');
    } else if (gap < -5) {
      insights.push(`Strong performance - ${Math.abs(gap).toFixed(1)} points above peer average`);
      insights.push('Consider mentoring others in this competency area');
    } else {
      insights.push('Performance is well-aligned with peer group');
      insights.push('Maintain current level while focusing on other areas');
    }

    return insights;
  }

  private calculateCompatibilityScore(
    userProfile: any,
    mentor: PeerProfile,
    preferences: any
  ): number {
    let score = 0;
    let maxScore = 0;

    // Experience level compatibility
    const experienceLevels = ['entry', 'intermediate', 'advanced', 'expert'];
    const userLevelIndex = experienceLevels.indexOf(userProfile.experienceLevel);
    const mentorLevelIndex = experienceLevels.indexOf(mentor.experienceLevel);
    
    if (mentorLevelIndex > userLevelIndex) {
      score += 0.3;
    }
    maxScore += 0.3;

    // Strength-weakness match
    const mentorStrengths = this.identifyStrengths(mentor);
    const matchingAreas = userProfile.growthAreas.filter((area: string) => 
      mentorStrengths.some(strength => strength.toLowerCase().includes(area.toLowerCase()))
    );
    
    score += (matchingAreas.length / Math.max(1, userProfile.growthAreas.length)) * 0.4;
    maxScore += 0.4;

    // Focus area alignment
    const focusAlignment = preferences.focusAreas.filter((area: string) => 
      mentorStrengths.some(strength => strength.toLowerCase().includes(area.toLowerCase()))
    );
    
    score += (focusAlignment.length / Math.max(1, preferences.focusAreas.length)) * 0.3;
    maxScore += 0.3;

    return Math.min(1, score / maxScore);
  }

  private generateMatchReasons(userProfile: any, mentor: PeerProfile, preferences: any): string[] {
    const reasons: string[] = [];
    
    const mentorStrengths = this.identifyStrengths(mentor);
    const experienceDiff = ['entry', 'intermediate', 'advanced', 'expert'].indexOf(mentor.experienceLevel) - 
                          ['entry', 'intermediate', 'advanced', 'expert'].indexOf(userProfile.experienceLevel);
    
    if (experienceDiff > 0) {
      reasons.push(`${experienceDiff} level(s) more experienced`);
    }
    
    const matchingStrengths = mentorStrengths.filter(strength => 
      userProfile.growthAreas.some((area: string) => strength.toLowerCase().includes(area.toLowerCase()))
    );
    
    if (matchingStrengths.length > 0) {
      reasons.push(`Strong in your growth areas: ${matchingStrengths.join(', ')}`);
    }
    
    if (mentor.role === userProfile.role) {
      reasons.push('Same role - understands your challenges');
    }
    
    return reasons;
  }

  private identifyStrengths(peer: PeerProfile): string[] {
    const strengths: string[] = [];
    
    Object.entries(peer.performanceData).forEach(([dimension, score]) => {
      if (score >= 80) {
        strengths.push(dimension.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^\w/, c => c.toUpperCase()));
      }
    });
    
    return strengths;
  }

  private identifyMentorshipAreas(mentor: PeerProfile, userGrowthAreas: string[]): string[] {
    const mentorStrengths = this.identifyStrengths(mentor);
    
    return mentorStrengths.filter(strength => 
      userGrowthAreas.some(area => strength.toLowerCase().includes(area.toLowerCase()))
    );
  }
}

export const peerComparator = new PeerComparator();