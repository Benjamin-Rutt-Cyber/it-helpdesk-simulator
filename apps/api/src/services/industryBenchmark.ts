import { logger } from '../utils/logger';

interface BenchmarkData {
  category: string;
  industry: {
    average: number;
    topPercentile: number;
    standardDeviation: number;
    sampleSize: number;
  };
  dimensions: {
    technical: { average: number; topPercentile: number };
    communication: { average: number; topPercentile: number };
    procedural: { average: number; topPercentile: number };
    customerService: { average: number; topPercentile: number };
    problemSolving: { average: number; topPercentile: number };
  };
  lastUpdated: Date;
}

interface PercentileRanking {
  overall: number;
  dimensions: {
    technical: number;
    communication: number;
    procedural: number;
    customerService: number;
    problemSolving: number;
  };
}

class IndustryBenchmark {
  private benchmarkData: Map<string, BenchmarkData> = new Map();

  constructor() {
    this.initializeBenchmarkData();
  }

  /**
   * Get benchmark data for category
   */
  async getBenchmarks(category: string = 'general'): Promise<BenchmarkData> {
    try {
      const benchmarks = this.benchmarkData.get(category) || this.benchmarkData.get('general')!;
      logger.debug(`Retrieved benchmarks for category: ${category}`);
      return benchmarks;
    } catch (error) {
      logger.error('Error getting benchmarks:', error);
      throw new Error('Failed to get benchmarks');
    }
  }

  /**
   * Assess performance alignment with industry standards
   */
  async assessAlignment(scores: any, benchmarks: BenchmarkData): Promise<any> {
    try {
      const alignment = {
        overall: this.calculateAlignmentScore(scores.overall || 0, benchmarks.industry.average),
        dimensions: {} as any,
        meetsProfessionalStandards: false,
        industryReadiness: 'developing' as 'developing' | 'ready' | 'advanced',
        recommendations: [] as string[]
      };

      // Assess dimension alignment
      Object.keys(benchmarks.dimensions).forEach(dimension => {
        const userScore = scores[dimension]?.weighted || scores[dimension] || 0;
        const industryAverage = benchmarks.dimensions[dimension as keyof typeof benchmarks.dimensions].average;
        
        alignment.dimensions[dimension] = {
          score: userScore,
          industryAverage,
          alignment: this.calculateAlignmentScore(userScore, industryAverage),
          status: this.getAlignmentStatus(userScore, industryAverage)
        };
      });

      // Determine overall industry readiness
      const overallScore = scores.overall || this.calculateOverallFromDimensions(scores);
      alignment.industryReadiness = this.determineIndustryReadiness(overallScore, benchmarks);
      alignment.meetsProfessionalStandards = overallScore >= benchmarks.industry.average * 0.9;

      // Generate alignment recommendations
      alignment.recommendations = this.generateAlignmentRecommendations(alignment);

      return alignment;
    } catch (error) {
      logger.error('Error assessing alignment:', error);
      throw new Error('Failed to assess alignment');
    }
  }

  /**
   * Calculate percentile rankings
   */
  async calculatePercentileRankings(performance: any, benchmarks: BenchmarkData): Promise<PercentileRanking> {
    try {
      const rankings: PercentileRanking = {
        overall: this.calculatePercentile(performance.overall, benchmarks.industry),
        dimensions: {
          technical: this.calculatePercentile(performance.dimensions?.technical?.weighted || 0, benchmarks.dimensions.technical),
          communication: this.calculatePercentile(performance.dimensions?.communication?.weighted || 0, benchmarks.dimensions.communication),
          procedural: this.calculatePercentile(performance.dimensions?.procedural?.weighted || 0, benchmarks.dimensions.procedural),
          customerService: this.calculatePercentile(performance.dimensions?.customerService?.weighted || 0, benchmarks.dimensions.customerService),
          problemSolving: this.calculatePercentile(performance.dimensions?.problemSolving?.weighted || 0, benchmarks.dimensions.problemSolving)
        }
      };

      logger.debug('Calculated percentile rankings', rankings);
      return rankings;
    } catch (error) {
      logger.error('Error calculating percentile rankings:', error);
      throw new Error('Failed to calculate percentile rankings');
    }
  }

  /**
   * Generate comparison insights
   */
  async generateComparisonInsights(performance: any, benchmarks: BenchmarkData): Promise<string[]> {
    try {
      const insights: string[] = [];
      const overallScore = performance.overall || 0;

      // Overall performance insights
      if (overallScore >= benchmarks.industry.topPercentile) {
        insights.push('Exceptional performance - among top performers in the industry');
      } else if (overallScore >= benchmarks.industry.average * 1.1) {
        insights.push('Above-average performance with strong professional competency');
      } else if (overallScore >= benchmarks.industry.average * 0.9) {
        insights.push('Performance aligns well with industry standards');
      } else {
        insights.push('Performance below industry average - focus needed on core competencies');
      }

      // Dimension-specific insights
      Object.entries(benchmarks.dimensions).forEach(([dimension, benchmark]) => {
        const userScore = performance.dimensions?.[dimension]?.weighted || 0;
        
        if (userScore >= benchmark.topPercentile) {
          insights.push(`Exceptional ${dimension} skills - top tier performance`);
        } else if (userScore < benchmark.average * 0.8) {
          insights.push(`${dimension} skills need development to meet industry standards`);
        }
      });

      return insights;
    } catch (error) {
      logger.error('Error generating comparison insights:', error);
      throw new Error('Failed to generate comparison insights');
    }
  }

  /**
   * Get comprehensive benchmarks
   */
  async getComprehensiveBenchmarks(): Promise<BenchmarkData> {
    try {
      return this.benchmarkData.get('comprehensive') || this.benchmarkData.get('general')!;
    } catch (error) {
      logger.error('Error getting comprehensive benchmarks:', error);
      throw new Error('Failed to get comprehensive benchmarks');
    }
  }

  /**
   * Get industry context for scoring
   */
  async getIndustryContext(score: any): Promise<any> {
    try {
      const benchmarks = await this.getComprehensiveBenchmarks();
      
      return {
        industryStandards: {
          entryLevel: {
            minimum: benchmarks.industry.average * 0.7,
            competitive: benchmarks.industry.average * 0.85,
            preferred: benchmarks.industry.average
          },
          experienced: {
            minimum: benchmarks.industry.average * 0.9,
            competitive: benchmarks.industry.average * 1.1,
            preferred: benchmarks.industry.topPercentile * 0.9
          },
          senior: {
            minimum: benchmarks.industry.average * 1.1,
            competitive: benchmarks.industry.topPercentile * 0.9,
            preferred: benchmarks.industry.topPercentile
          }
        },
        marketContext: {
          demandTrends: 'High demand for IT support professionals with strong communication skills',
          salaryImpact: this.calculateSalaryImpact(score.overall, benchmarks),
          careerProgression: this.assessCareerProgression(score, benchmarks)
        },
        certificationAlignment: {
          ready: score.overall >= benchmarks.industry.average * 0.9,
          recommendedCertifications: this.recommendCertifications(score, benchmarks)
        }
      };
    } catch (error) {
      logger.error('Error getting industry context:', error);
      throw new Error('Failed to get industry context');
    }
  }

  // Private helper methods

  private initializeBenchmarkData(): void {
    const generalBenchmarks: BenchmarkData = {
      category: 'general',
      industry: {
        average: 74,
        topPercentile: 92,
        standardDeviation: 12,
        sampleSize: 2500
      },
      dimensions: {
        technical: { average: 72, topPercentile: 90 },
        communication: { average: 76, topPercentile: 93 },
        procedural: { average: 78, topPercentile: 95 },
        customerService: { average: 75, topPercentile: 92 },
        problemSolving: { average: 70, topPercentile: 88 }
      },
      lastUpdated: new Date()
    };

    const technicalSupportBenchmarks: BenchmarkData = {
      category: 'technical_support',
      industry: {
        average: 76,
        topPercentile: 94,
        standardDeviation: 11,
        sampleSize: 1800
      },
      dimensions: {
        technical: { average: 78, topPercentile: 95 },
        communication: { average: 74, topPercentile: 91 },
        procedural: { average: 80, topPercentile: 97 },
        customerService: { average: 73, topPercentile: 90 },
        problemSolving: { average: 75, topPercentile: 92 }
      },
      lastUpdated: new Date()
    };

    const comprehensiveBenchmarks: BenchmarkData = {
      category: 'comprehensive',
      industry: {
        average: 75,
        topPercentile: 93,
        standardDeviation: 11.5,
        sampleSize: 4300
      },
      dimensions: {
        technical: { average: 75, topPercentile: 92 },
        communication: { average: 75, topPercentile: 92 },
        procedural: { average: 79, topPercentile: 96 },
        customerService: { average: 74, topPercentile: 91 },
        problemSolving: { average: 72, topPercentile: 90 }
      },
      lastUpdated: new Date()
    };

    this.benchmarkData.set('general', generalBenchmarks);
    this.benchmarkData.set('technical_support', technicalSupportBenchmarks);
    this.benchmarkData.set('comprehensive', comprehensiveBenchmarks);

    logger.info('Industry benchmark data initialized');
  }

  private calculateAlignmentScore(userScore: number, industryAverage: number): number {
    const ratio = userScore / industryAverage;
    return Math.min(100, ratio * 100);
  }

  private getAlignmentStatus(userScore: number, industryAverage: number): string {
    const ratio = userScore / industryAverage;
    
    if (ratio >= 1.2) return 'exceeds';
    if (ratio >= 1.0) return 'meets';
    if (ratio >= 0.8) return 'approaching';
    return 'below';
  }

  private calculateOverallFromDimensions(scores: any): number {
    const dimensionScores = scores.dimensions || {};
    const weights = { technical: 0.25, communication: 0.25, procedural: 0.20, customerService: 0.20, problemSolving: 0.10 };
    
    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([dimension, weight]) => {
      const score = dimensionScores[dimension]?.weighted || 0;
      if (score > 0) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private determineIndustryReadiness(overallScore: number, benchmarks: BenchmarkData): 'developing' | 'ready' | 'advanced' {
    if (overallScore >= benchmarks.industry.topPercentile * 0.9) {
      return 'advanced';
    } else if (overallScore >= benchmarks.industry.average * 0.9) {
      return 'ready';
    } else {
      return 'developing';
    }
  }

  private generateAlignmentRecommendations(alignment: any): string[] {
    const recommendations: string[] = [];

    if (!alignment.meetsProfessionalStandards) {
      recommendations.push('Focus on achieving industry-standard performance levels for better career opportunities');
    }

    Object.entries(alignment.dimensions).forEach(([dimension, data]: [string, any]) => {
      if (data.status === 'below') {
        recommendations.push(`Prioritize ${dimension} skill development to meet industry expectations`);
      }
    });

    if (alignment.industryReadiness === 'developing') {
      recommendations.push('Consider additional training or certification programs to accelerate professional development');
    } else if (alignment.industryReadiness === 'advanced') {
      recommendations.push('Excellent industry alignment - consider pursuing senior roles or specializations');
    }

    return recommendations;
  }

  private calculatePercentile(score: number, benchmark: { average: number; topPercentile?: number }): number {
    // Simplified percentile calculation using normal distribution approximation
    const mean = benchmark.average;
    const stdDev = 12; // Approximate standard deviation
    
    const zScore = (score - mean) / stdDev;
    const percentile = this.normalCDF(zScore) * 100;
    
    return Math.max(1, Math.min(99, Math.round(percentile)));
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

  private calculateSalaryImpact(overallScore: number, benchmarks: BenchmarkData): string {
    const ratio = overallScore / benchmarks.industry.average;
    
    if (ratio >= 1.3) return 'Top tier salary potential - 20-30% above market average';
    if (ratio >= 1.15) return 'Above average salary potential - 10-20% above market average';
    if (ratio >= 0.9) return 'Market rate salary potential';
    return 'Below market salary potential - focus on skill development for improvement';
  }

  private assessCareerProgression(score: any, benchmarks: BenchmarkData): string {
    const overallScore = score.overall || 0;
    
    if (overallScore >= benchmarks.industry.topPercentile * 0.9) {
      return 'Ready for senior or leadership roles';
    } else if (overallScore >= benchmarks.industry.average * 1.1) {
      return 'Ready for intermediate to advanced positions';
    } else if (overallScore >= benchmarks.industry.average * 0.9) {
      return 'Ready for entry to intermediate positions';
    } else {
      return 'Focus on fundamental skill development before career advancement';
    }
  }

  private recommendCertifications(score: any, benchmarks: BenchmarkData): string[] {
    const recommendations: string[] = [];
    const overallScore = score.overall || 0;

    if (overallScore >= benchmarks.industry.average * 0.8) {
      recommendations.push('CompTIA A+ Certification');
      recommendations.push('ITIL Foundation Certification');
    }

    if (overallScore >= benchmarks.industry.average) {
      recommendations.push('Customer Service Excellence Certification');
      recommendations.push('CompTIA Network+ Certification');
    }

    if (overallScore >= benchmarks.industry.topPercentile * 0.9) {
      recommendations.push('CompTIA Security+ Certification');
      recommendations.push('Microsoft Certified: Azure Fundamentals');
    }

    return recommendations;
  }
}

export const industryBenchmark = new IndustryBenchmark();