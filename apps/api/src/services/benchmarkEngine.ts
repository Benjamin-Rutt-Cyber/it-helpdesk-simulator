import { logger } from '../utils/logger';

interface BenchmarkContext {
  userId: string;
  dimensions: any;
  performanceData?: any;
  userProfile?: {
    experienceLevel: 'junior' | 'intermediate' | 'senior';
    role: string;
    timeInRole: number;
    region?: string;
  };
}

interface BenchmarkResult {
  overallPerformance: {
    percentile: number;
    ranking: string;
    comparisonText: string;
  };
  dimensionBenchmarks: Array<{
    dimension: string;
    userScore: number;
    industryAverage: number;
    topPerformer: number;
    percentile: number;
    gap: number;
    status: 'exceeds' | 'meets' | 'below' | 'significantly_below';
  }>;
  peerComparison: {
    sameRole: {
      percentile: number;
      averageScore: number;
      topPerformerScore: number;
    };
    sameExperience: {
      percentile: number;
      averageScore: number;
      topPerformerScore: number;
    };
    regional?: {
      percentile: number;
      averageScore: number;
      topPerformerScore: number;
    };
  };
  industryStandards: {
    certification: Array<{
      name: string;
      threshold: number;
      userMeetsRequirement: boolean;
      gap?: number;
    }>;
    competencyLevels: Array<{
      level: 'entry' | 'proficient' | 'expert' | 'master';
      requirements: any;
      userQualifies: boolean;
    }>;
  };
  recommendations: string[];
  insights: string[];
}

interface IndustryBenchmark {
  dimension: string;
  averageScore: number;
  topPercentileScore: number;
  standardDeviation: number;
  sampleSize: number;
  lastUpdated: Date;
}

interface PeerGroup {
  criteria: any;
  averagePerformance: any;
  topPerformance: any;
  memberCount: number;
}

class BenchmarkEngine {
  private industryBenchmarks: Map<string, IndustryBenchmark> = new Map();
  private peerGroups: Map<string, PeerGroup> = new Map();

  constructor() {
    this.initializeBenchmarks();
  }

  /**
   * Generate comprehensive benchmarking analysis
   */
  async generateBenchmarks(userId: string, dimensions: any, userProfile?: any): Promise<BenchmarkResult> {
    try {
      logger.info(`Generating benchmarks for user ${userId}`);

      const context: BenchmarkContext = {
        userId,
        dimensions,
        userProfile: userProfile || this.getDefaultUserProfile()
      };

      const overallPerformance = this.calculateOverallPerformance(context);
      const dimensionBenchmarks = this.calculateDimensionBenchmarks(context);
      const peerComparison = this.calculatePeerComparison(context);
      const industryStandards = this.assessIndustryStandards(context);
      const recommendations = this.generateBenchmarkRecommendations(context, dimensionBenchmarks);
      const insights = this.generateBenchmarkInsights(context, dimensionBenchmarks, peerComparison);

      const result: BenchmarkResult = {
        overallPerformance,
        dimensionBenchmarks,
        peerComparison,
        industryStandards,
        recommendations,
        insights
      };

      logger.info(`Benchmarks generated successfully for user ${userId}`);
      return result;

    } catch (error) {
      logger.error('Error generating benchmarks:', error);
      throw new Error('Failed to generate benchmarks');
    }
  }

  /**
   * Update industry benchmarks with new data
   */
  async updateIndustryBenchmarks(newData: any[]): Promise<void> {
    try {
      logger.info('Updating industry benchmarks');

      // Group data by dimension
      const dimensionData = this.groupByDimension(newData);

      for (const [dimension, data] of Object.entries(dimensionData)) {
        const stats = this.calculateStatistics(data as number[]);
        
        this.industryBenchmarks.set(dimension, {
          dimension,
          averageScore: stats.mean,
          topPercentileScore: stats.percentile95,
          standardDeviation: stats.standardDeviation,
          sampleSize: data.length,
          lastUpdated: new Date()
        });
      }

      logger.info('Industry benchmarks updated successfully');
    } catch (error) {
      logger.error('Error updating industry benchmarks:', error);
      throw new Error('Failed to update industry benchmarks');
    }
  }

  /**
   * Get performance ranking for a specific dimension
   */
  async getDimensionRanking(dimension: string, score: number): Promise<any> {
    try {
      const benchmark = this.industryBenchmarks.get(dimension);
      if (!benchmark) {
        throw new Error(`Benchmark not found for dimension: ${dimension}`);
      }

      const percentile = this.calculatePercentile(score, benchmark);
      const ranking = this.getPerformanceRanking(percentile);
      const gap = benchmark.averageScore - score;

      return {
        dimension,
        score,
        percentile,
        ranking,
        gap,
        benchmarkAverage: benchmark.averageScore,
        topPerformer: benchmark.topPercentileScore,
        sampleSize: benchmark.sampleSize
      };
    } catch (error) {
      logger.error('Error getting dimension ranking:', error);
      throw new Error('Failed to get dimension ranking');
    }
  }

  /**
   * Compare user against specific peer group
   */
  async compareToPeerGroup(userId: string, dimensions: any, peerCriteria: any): Promise<any> {
    try {
      const peerGroupKey = this.generatePeerGroupKey(peerCriteria);
      const peerGroup = this.peerGroups.get(peerGroupKey) || this.createMockPeerGroup(peerCriteria);

      const comparison = {};

      Object.entries(dimensions).forEach(([dimension, score]) => {
        const peerAverage = peerGroup.averagePerformance[dimension] || 75;
        const peerTop = peerGroup.topPerformance[dimension] || 95;
        
        comparison[dimension] = {
          userScore: score,
          peerAverage,
          peerTop,
          percentile: this.calculatePeerPercentile(score as number, peerAverage, peerTop),
          gap: peerAverage - (score as number),
          status: this.getPeerComparisonStatus(score as number, peerAverage)
        };
      });

      return {
        peerGroup: peerCriteria,
        memberCount: peerGroup.memberCount,
        comparison,
        overallRanking: this.calculateOverallPeerRanking(dimensions, peerGroup)
      };
    } catch (error) {
      logger.error('Error comparing to peer group:', error);
      throw new Error('Failed to compare to peer group');
    }
  }

  // Private helper methods

  private initializeBenchmarks(): void {
    // Initialize with default industry benchmarks
    const defaultBenchmarks = [
      {
        dimension: 'technicalCompetency',
        averageScore: 74,
        topPercentileScore: 92,
        standardDeviation: 12,
        sampleSize: 1500
      },
      {
        dimension: 'customerService',
        averageScore: 78,
        topPercentileScore: 94,
        standardDeviation: 10,
        sampleSize: 2000
      },
      {
        dimension: 'communicationSkills',
        averageScore: 76,
        topPercentileScore: 91,
        standardDeviation: 11,
        sampleSize: 1800
      },
      {
        dimension: 'problemSolving',
        averageScore: 72,
        topPercentileScore: 89,
        standardDeviation: 13,
        sampleSize: 1600
      },
      {
        dimension: 'processCompliance',
        averageScore: 80,
        topPercentileScore: 95,
        standardDeviation: 9,
        sampleSize: 1700
      },
      {
        dimension: 'learningAgility',
        averageScore: 73,
        topPercentileScore: 88,
        standardDeviation: 12,
        sampleSize: 1400
      }
    ];

    defaultBenchmarks.forEach(benchmark => {
      this.industryBenchmarks.set(benchmark.dimension, {
        ...benchmark,
        lastUpdated: new Date()
      });
    });

    // Initialize peer groups
    this.initializePeerGroups();
  }

  private initializePeerGroups(): void {
    const peerGroups = [
      {
        criteria: { experienceLevel: 'junior', role: 'support' },
        averagePerformance: {
          technicalCompetency: 68,
          customerService: 75,
          communicationSkills: 72,
          problemSolving: 67,
          processCompliance: 78,
          learningAgility: 76
        },
        topPerformance: {
          technicalCompetency: 85,
          customerService: 90,
          communicationSkills: 87,
          problemSolving: 83,
          processCompliance: 92,
          learningAgility: 89
        },
        memberCount: 450
      },
      {
        criteria: { experienceLevel: 'intermediate', role: 'support' },
        averagePerformance: {
          technicalCompetency: 76,
          customerService: 80,
          communicationSkills: 78,
          problemSolving: 74,
          processCompliance: 82,
          learningAgility: 75
        },
        topPerformance: {
          technicalCompetency: 92,
          customerService: 95,
          communicationSkills: 92,
          problemSolving: 89,
          processCompliance: 96,
          learningAgility: 88
        },
        memberCount: 380
      },
      {
        criteria: { experienceLevel: 'senior', role: 'support' },
        averagePerformance: {
          technicalCompetency: 83,
          customerService: 85,
          communicationSkills: 84,
          problemSolving: 81,
          processCompliance: 86,
          learningAgility: 78
        },
        topPerformance: {
          technicalCompetency: 96,
          customerService: 98,
          communicationSkills: 95,
          problemSolving: 94,
          processCompliance: 98,
          learningAgility: 90
        },
        memberCount: 220
      }
    ];

    peerGroups.forEach(group => {
      const key = this.generatePeerGroupKey(group.criteria);
      this.peerGroups.set(key, group);
    });
  }

  private calculateOverallPerformance(context: BenchmarkContext): BenchmarkResult['overallPerformance'] {
    const { dimensions } = context;
    
    const overallScore = Object.values(dimensions).reduce((sum: number, score: any) => sum + score, 0) / Object.keys(dimensions).length;
    
    // Calculate percentile against industry average
    const industryOverallAverage = Array.from(this.industryBenchmarks.values())
      .reduce((sum, benchmark) => sum + benchmark.averageScore, 0) / this.industryBenchmarks.size;
    
    const percentile = this.calculateSimplePercentile(overallScore, industryOverallAverage, 15);
    const ranking = this.getPerformanceRanking(percentile);
    
    const difference = overallScore - industryOverallAverage;
    const comparisonText = `${Math.abs(difference).toFixed(1)} points ${difference >= 0 ? 'above' : 'below'} industry average`;

    return {
      percentile: Math.round(percentile),
      ranking,
      comparisonText
    };
  }

  private calculateDimensionBenchmarks(context: BenchmarkContext): BenchmarkResult['dimensionBenchmarks'] {
    const { dimensions } = context;
    const benchmarks: BenchmarkResult['dimensionBenchmarks'] = [];

    Object.entries(dimensions).forEach(([dimension, userScore]) => {
      const benchmark = this.industryBenchmarks.get(dimension);
      if (!benchmark) return;

      const percentile = this.calculatePercentile(userScore as number, benchmark);
      const gap = benchmark.averageScore - (userScore as number);
      const status = this.getBenchmarkStatus(userScore as number, benchmark);

      benchmarks.push({
        dimension: this.formatDimensionName(dimension),
        userScore: Math.round(userScore as number),
        industryAverage: Math.round(benchmark.averageScore),
        topPerformer: Math.round(benchmark.topPercentileScore),
        percentile: Math.round(percentile),
        gap: Math.round(gap),
        status
      });
    });

    return benchmarks.sort((a, b) => b.percentile - a.percentile); // Sort by best performance first
  }

  private calculatePeerComparison(context: BenchmarkContext): BenchmarkResult['peerComparison'] {
    const { dimensions, userProfile } = context;
    
    if (!userProfile) {
      return this.getDefaultPeerComparison();
    }

    const sameRolePeers = this.getPeerGroup({ 
      role: userProfile.role, 
      experienceLevel: userProfile.experienceLevel 
    });
    
    const sameExperiencePeers = this.getPeerGroup({ 
      experienceLevel: userProfile.experienceLevel 
    });

    const overallScore = Object.values(dimensions).reduce((sum: number, score: any) => sum + score, 0) / Object.keys(dimensions).length;

    return {
      sameRole: {
        percentile: Math.round(this.calculatePeerPercentile(overallScore, sameRolePeers.averagePerformance.overall || 75, sameRolePeers.topPerformance.overall || 95)),
        averageScore: Math.round(sameRolePeers.averagePerformance.overall || 75),
        topPerformerScore: Math.round(sameRolePeers.topPerformance.overall || 95)
      },
      sameExperience: {
        percentile: Math.round(this.calculatePeerPercentile(overallScore, sameExperiencePeers.averagePerformance.overall || 73, sameExperiencePeers.topPerformance.overall || 93)),
        averageScore: Math.round(sameExperiencePeers.averagePerformance.overall || 73),
        topPerformerScore: Math.round(sameExperiencePeers.topPerformance.overall || 93)
      }
    };
  }

  private assessIndustryStandards(context: BenchmarkContext): BenchmarkResult['industryStandards'] {
    const { dimensions } = context;

    // Define industry certifications and their requirements
    const certifications = [
      {
        name: 'IT Support Professional Certification',
        threshold: 75,
        requiredDimensions: ['technicalCompetency', 'customerService', 'processCompliance']
      },
      {
        name: 'Customer Service Excellence Certification',
        threshold: 85,
        requiredDimensions: ['customerService', 'communicationSkills']
      },
      {
        name: 'Technical Specialist Certification',
        threshold: 80,
        requiredDimensions: ['technicalCompetency', 'problemSolving']
      }
    ];

    const certificationResults = certifications.map(cert => {
      const relevantScores = cert.requiredDimensions.map(dim => dimensions[dim] || 0);
      const averageScore = relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length;
      const userMeetsRequirement = averageScore >= cert.threshold;
      const gap = userMeetsRequirement ? 0 : cert.threshold - averageScore;

      return {
        name: cert.name,
        threshold: cert.threshold,
        userMeetsRequirement,
        gap: gap > 0 ? Math.round(gap) : undefined
      };
    });

    // Define competency levels
    const overallScore = Object.values(dimensions).reduce((sum: number, score: any) => sum + score, 0) / Object.keys(dimensions).length;
    
    const competencyLevels = [
      {
        level: 'entry' as const,
        requirements: { overallScore: 60, minTechnical: 55 },
        userQualifies: overallScore >= 60 && dimensions.technicalCompetency >= 55
      },
      {
        level: 'proficient' as const,
        requirements: { overallScore: 75, minTechnical: 70, minCustomerService: 70 },
        userQualifies: overallScore >= 75 && dimensions.technicalCompetency >= 70 && dimensions.customerService >= 70
      },
      {
        level: 'expert' as const,
        requirements: { overallScore: 85, minTechnical: 80, allDimensions: 75 },
        userQualifies: overallScore >= 85 && dimensions.technicalCompetency >= 80 && Object.values(dimensions).every((score: any) => score >= 75)
      },
      {
        level: 'master' as const,
        requirements: { overallScore: 90, allDimensions: 85 },
        userQualifies: overallScore >= 90 && Object.values(dimensions).every((score: any) => score >= 85)
      }
    ];

    return {
      certification: certificationResults,
      competencyLevels
    };
  }

  private generateBenchmarkRecommendations(context: BenchmarkContext, dimensionBenchmarks: BenchmarkResult['dimensionBenchmarks']): string[] {
    const recommendations: string[] = [];

    // Find dimensions that are significantly below benchmark
    const significantGaps = dimensionBenchmarks.filter(d => d.status === 'significantly_below' || d.status === 'below');
    
    if (significantGaps.length > 0) {
      const worstGap = significantGaps.reduce((worst, current) => 
        current.gap > worst.gap ? current : worst
      );
      
      recommendations.push(`Prioritize improvement in ${worstGap.dimension} - currently ${worstGap.gap} points below industry average`);
    }

    // Recommend leveraging strengths
    const strengths = dimensionBenchmarks.filter(d => d.status === 'exceeds');
    if (strengths.length > 0) {
      const topStrength = strengths[0]; // Already sorted by percentile
      recommendations.push(`Leverage your strength in ${topStrength.dimension} (${topStrength.percentile}th percentile) for mentoring and leadership opportunities`);
    }

    // Industry standard recommendations
    const overallScore = dimensionBenchmarks.reduce((sum, d) => sum + d.userScore, 0) / dimensionBenchmarks.length;
    
    if (overallScore < 75) {
      recommendations.push('Focus on achieving industry standard competency level (75+ overall score) for better career opportunities');
    } else if (overallScore >= 85) {
      recommendations.push('Consider pursuing expert-level certifications and advanced specializations given your strong performance');
    }

    return recommendations;
  }

  private generateBenchmarkInsights(context: BenchmarkContext, dimensionBenchmarks: BenchmarkResult['dimensionBenchmarks'], peerComparison: BenchmarkResult['peerComparison']): string[] {
    const insights: string[] = [];

    // Overall performance insight
    if (peerComparison.sameRole.percentile >= 75) {
      insights.push(`You're performing in the top 25% among peers in similar roles`);
    } else if (peerComparison.sameRole.percentile >= 50) {
      insights.push(`Your performance is above average compared to peers in similar roles`);
    } else {
      insights.push(`There's opportunity to improve relative to peers in similar roles`);
    }

    // Dimension-specific insights
    const topDimension = dimensionBenchmarks[0];
    const bottomDimension = dimensionBenchmarks[dimensionBenchmarks.length - 1];

    if (topDimension.percentile >= 80) {
      insights.push(`Your ${topDimension.dimension} skills are exceptionally strong (${topDimension.percentile}th percentile)`);
    }

    if (bottomDimension.percentile < 30) {
      insights.push(`${bottomDimension.dimension} represents your biggest opportunity for improvement`);
    }

    // Consistency insight
    const scores = dimensionBenchmarks.map(d => d.percentile);
    const range = Math.max(...scores) - Math.min(...scores);
    if (range > 40) {
      insights.push('Your performance varies significantly across different skill areas - focus on balanced development');
    } else if (range < 20) {
      insights.push('You demonstrate consistent performance across all skill areas');
    }

    return insights;
  }

  // Utility methods

  private getDefaultUserProfile(): BenchmarkContext['userProfile'] {
    return {
      experienceLevel: 'intermediate',
      role: 'support',
      timeInRole: 365,
      region: 'global'
    };
  }

  private calculatePercentile(score: number, benchmark: IndustryBenchmark): number {
    // Using normal distribution approximation
    const zScore = (score - benchmark.averageScore) / benchmark.standardDeviation;
    return this.normalCDF(zScore) * 100;
  }

  private calculateSimplePercentile(score: number, average: number, stdDev: number): number {
    const zScore = (score - average) / stdDev;
    return this.normalCDF(zScore) * 100;
  }

  private normalCDF(z: number): number {
    // Approximation of normal cumulative distribution function
    const t = 1 / (1 + 0.3275911 * Math.abs(z));
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
    return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
  }

  private getPerformanceRanking(percentile: number): string {
    if (percentile >= 95) return 'Exceptional';
    if (percentile >= 85) return 'Excellent';
    if (percentile >= 75) return 'Above Average';
    if (percentile >= 50) return 'Average';
    if (percentile >= 25) return 'Below Average';
    return 'Needs Improvement';
  }

  private getBenchmarkStatus(score: number, benchmark: IndustryBenchmark): 'exceeds' | 'meets' | 'below' | 'significantly_below' {
    const gap = score - benchmark.averageScore;
    if (gap >= 10) return 'exceeds';
    if (gap >= -5) return 'meets';
    if (gap >= -15) return 'below';
    return 'significantly_below';
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

  private groupByDimension(data: any[]): Record<string, number[]> {
    const grouped: Record<string, number[]> = {};
    
    data.forEach(item => {
      Object.entries(item.dimensions || {}).forEach(([dimension, score]) => {
        if (!grouped[dimension]) grouped[dimension] = [];
        grouped[dimension].push(score as number);
      });
    });

    return grouped;
  }

  private calculateStatistics(data: number[]): any {
    const sorted = data.sort((a, b) => a - b);
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      mean,
      standardDeviation,
      percentile95: sorted[Math.floor(0.95 * sorted.length)],
      percentile75: sorted[Math.floor(0.75 * sorted.length)],
      percentile50: sorted[Math.floor(0.50 * sorted.length)],
      percentile25: sorted[Math.floor(0.25 * sorted.length)]
    };
  }

  private generatePeerGroupKey(criteria: any): string {
    return Object.entries(criteria)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }

  private createMockPeerGroup(criteria: any): PeerGroup {
    // Create a mock peer group with realistic performance distributions
    const basePerformance = 75;
    const experienceMultiplier = criteria.experienceLevel === 'senior' ? 1.1 : 
                               criteria.experienceLevel === 'junior' ? 0.9 : 1.0;

    return {
      criteria,
      averagePerformance: {
        technicalCompetency: Math.round(basePerformance * experienceMultiplier * 0.95),
        customerService: Math.round(basePerformance * experienceMultiplier * 1.05),
        communicationSkills: Math.round(basePerformance * experienceMultiplier),
        problemSolving: Math.round(basePerformance * experienceMultiplier * 0.90),
        processCompliance: Math.round(basePerformance * experienceMultiplier * 1.10),
        learningAgility: Math.round(basePerformance * experienceMultiplier * 1.02),
        overall: Math.round(basePerformance * experienceMultiplier)
      },
      topPerformance: {
        technicalCompetency: Math.round(basePerformance * experienceMultiplier * 1.20),
        customerService: Math.round(basePerformance * experienceMultiplier * 1.25),
        communicationSkills: Math.round(basePerformance * experienceMultiplier * 1.22),
        problemSolving: Math.round(basePerformance * experienceMultiplier * 1.18),
        processCompliance: Math.round(basePerformance * experienceMultiplier * 1.28),
        learningAgility: Math.round(basePerformance * experienceMultiplier * 1.20),
        overall: Math.round(basePerformance * experienceMultiplier * 1.23)
      },
      memberCount: Math.floor(Math.random() * 500 + 100)
    };
  }

  private getPeerGroup(criteria: any): PeerGroup {
    const key = this.generatePeerGroupKey(criteria);
    return this.peerGroups.get(key) || this.createMockPeerGroup(criteria);
  }

  private calculatePeerPercentile(score: number, average: number, top: number): number {
    if (score >= top) return 95;
    if (score >= average) {
      return 50 + ((score - average) / (top - average)) * 45;
    } else {
      const bottom = average * 0.6; // Assume bottom performers are 40% below average
      return Math.max(5, ((score - bottom) / (average - bottom)) * 45);
    }
  }

  private getPeerComparisonStatus(score: number, peerAverage: number): string {
    const gap = score - peerAverage;
    if (gap >= 10) return 'significantly_above';
    if (gap >= 5) return 'above';
    if (gap >= -5) return 'similar';
    if (gap >= -10) return 'below';
    return 'significantly_below';
  }

  private calculateOverallPeerRanking(dimensions: any, peerGroup: PeerGroup): number {
    const userOverall = Object.values(dimensions).reduce((sum: number, score: any) => sum + score, 0) / Object.keys(dimensions).length;
    const peerOverall = peerGroup.averagePerformance.overall || 75;
    const peerTop = peerGroup.topPerformance.overall || 95;
    
    return this.calculatePeerPercentile(userOverall, peerOverall, peerTop);
  }

  private getDefaultPeerComparison(): BenchmarkResult['peerComparison'] {
    return {
      sameRole: {
        percentile: 50,
        averageScore: 75,
        topPerformerScore: 95
      },
      sameExperience: {
        percentile: 50,
        averageScore: 73,
        topPerformerScore: 93
      }
    };
  }
}

export const benchmarkEngine = new BenchmarkEngine();