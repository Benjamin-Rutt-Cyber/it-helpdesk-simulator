import { logger } from '../utils/logger';

interface IndustryStandard {
  id: string;
  name: string;
  category: 'technical' | 'communication' | 'customer_service' | 'professional' | 'compliance';
  level: 'entry' | 'intermediate' | 'advanced' | 'expert';
  threshold: number;
  description: string;
  requirements: {
    competencies: string[];
    minimumScores: Record<string, number>;
  };
  industrySource: string;
  lastUpdated: Date;
  applicability: {
    roles: string[];
    experienceLevels: string[];
    industries: string[];
  };
}

interface BenchmarkData {
  standard: string;
  dimension: string;
  entryLevel: {min: number; average: number; excellent: number};
  intermediate: {min: number; average: number; excellent: number};
  advanced: {min: number; average: number; excellent: number};
  expert: {min: number; average: number; excellent: number};
  percentiles: number[];
  sampleSize: number;
  confidenceInterval: number;
}

interface StandardsAssessment {
  standardId: string;
  standardName: string;
  userQualifies: boolean;
  currentLevel: 'entry' | 'intermediate' | 'advanced' | 'expert' | 'below_entry';
  nextLevel?: 'entry' | 'intermediate' | 'advanced' | 'expert';
  competencyGaps: Array<{
    competency: string;
    currentScore: number;
    requiredScore: number;
    gap: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
  timeToAchieve?: string;
}

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  requirements: Array<{
    id: string;
    description: string;
    competencyArea: string;
    minimumScore: number;
    weight: number;
  }>;
  certificationBody: string;
  validityPeriod: number;
  renewalRequirements: string[];
}

class IndustryStandardsService {
  private standards: Map<string, IndustryStandard> = new Map();
  private benchmarkData: Map<string, BenchmarkData> = new Map();
  private complianceFrameworks: Map<string, ComplianceFramework> = new Map();

  constructor() {
    this.initializeStandards();
    this.initializeBenchmarkData();
    this.initializeComplianceFrameworks();
  }

  /**
   * Get industry standards for a specific role and experience level
   */
  async getApplicableStandards(
    role: string, 
    experienceLevel: string, 
    industry: string = 'general'
  ): Promise<IndustryStandard[]> {
    try {
      logger.info(`Getting applicable standards for ${role} (${experienceLevel}) in ${industry}`);

      const applicable = Array.from(this.standards.values()).filter(standard => 
        standard.applicability.roles.includes(role) &&
        standard.applicability.experienceLevels.includes(experienceLevel) &&
        (standard.applicability.industries.includes(industry) || 
         standard.applicability.industries.includes('all'))
      );

      return applicable.sort((a, b) => a.threshold - b.threshold);
    } catch (error) {
      logger.error('Error getting applicable standards:', error);
      throw new Error('Failed to retrieve applicable standards');
    }
  }

  /**
   * Assess user performance against industry standards
   */
  async assessAgainstStandards(
    userScores: Record<string, number>,
    role: string,
    experienceLevel: string
  ): Promise<StandardsAssessment[]> {
    try {
      logger.info(`Assessing user against standards for ${role} (${experienceLevel})`);

      const applicableStandards = await this.getApplicableStandards(role, experienceLevel);
      const assessments: StandardsAssessment[] = [];

      for (const standard of applicableStandards) {
        const assessment = await this.assessSingleStandard(standard, userScores);
        assessments.push(assessment);
      }

      return assessments.sort((a, b) => b.userQualifies ? 1 : -1);
    } catch (error) {
      logger.error('Error assessing against standards:', error);
      throw new Error('Failed to assess against industry standards');
    }
  }

  /**
   * Get benchmark data for specific competency areas
   */
  async getBenchmarkData(
    competencies: string[],
    level: 'entry' | 'intermediate' | 'advanced' | 'expert'
  ): Promise<Record<string, BenchmarkData>> {
    try {
      logger.info(`Getting benchmark data for competencies: ${competencies.join(', ')} at ${level} level`);

      const benchmarks: Record<string, BenchmarkData> = {};

      for (const competency of competencies) {
        const benchmark = this.benchmarkData.get(competency);
        if (benchmark) {
          benchmarks[competency] = benchmark;
        }
      }

      return benchmarks;
    } catch (error) {
      logger.error('Error getting benchmark data:', error);
      throw new Error('Failed to retrieve benchmark data');
    }
  }

  /**
   * Get compliance framework requirements
   */
  async getComplianceRequirements(frameworkId: string): Promise<ComplianceFramework | null> {
    try {
      logger.info(`Getting compliance requirements for framework: ${frameworkId}`);
      return this.complianceFrameworks.get(frameworkId) || null;
    } catch (error) {
      logger.error('Error getting compliance requirements:', error);
      throw new Error('Failed to retrieve compliance requirements');
    }
  }

  /**
   * Calculate industry percentile ranking
   */
  async calculateIndustryPercentile(
    competency: string,
    score: number,
    level: 'entry' | 'intermediate' | 'advanced' | 'expert'
  ): Promise<{percentile: number; ranking: string; comparison: string}> {
    try {
      const benchmark = this.benchmarkData.get(competency);
      if (!benchmark) {
        throw new Error(`Benchmark data not found for competency: ${competency}`);
      }

      const levelData = benchmark[level];
      const percentile = this.calculatePercentile(score, levelData.average, 15);
      const ranking = this.getPerformanceRanking(percentile);
      const comparison = this.generateComparisonText(score, levelData);

      return { percentile, ranking, comparison };
    } catch (error) {
      logger.error('Error calculating industry percentile:', error);
      throw new Error('Failed to calculate industry percentile');
    }
  }

  /**
   * Update industry standards with new data
   */
  async updateStandards(updates: Partial<IndustryStandard>[]): Promise<void> {
    try {
      logger.info(`Updating ${updates.length} industry standards`);

      for (const update of updates) {
        if (update.id) {
          const existing = this.standards.get(update.id);
          if (existing) {
            const updated = { ...existing, ...update, lastUpdated: new Date() };
            this.standards.set(update.id, updated);
          }
        }
      }

      logger.info('Industry standards updated successfully');
    } catch (error) {
      logger.error('Error updating standards:', error);
      throw new Error('Failed to update industry standards');
    }
  }

  // Private helper methods

  private initializeStandards(): void {
    const standards: IndustryStandard[] = [
      {
        id: 'itil-foundation',
        name: 'ITIL Foundation Level',
        category: 'technical',
        level: 'entry',
        threshold: 70,
        description: 'Basic IT service management competency aligned with ITIL framework',
        requirements: {
          competencies: ['technicalCompetency', 'processCompliance'],
          minimumScores: {
            technicalCompetency: 65,
            processCompliance: 75
          }
        },
        industrySource: 'AXELOS ITIL Framework',
        lastUpdated: new Date(),
        applicability: {
          roles: ['support', 'technician', 'analyst'],
          experienceLevels: ['entry', 'intermediate'],
          industries: ['all']
        }
      },
      {
        id: 'customer-service-excellence',
        name: 'Customer Service Excellence',
        category: 'customer_service',
        level: 'intermediate',
        threshold: 80,
        description: 'Professional customer service competency for IT support roles',
        requirements: {
          competencies: ['customerService', 'communicationSkills'],
          minimumScores: {
            customerService: 80,
            communicationSkills: 75
          }
        },
        industrySource: 'Customer Service Institute',
        lastUpdated: new Date(),
        applicability: {
          roles: ['support', 'help_desk', 'customer_success'],
          experienceLevels: ['intermediate', 'advanced'],
          industries: ['all']
        }
      },
      {
        id: 'technical-specialist',
        name: 'Technical Specialist Competency',
        category: 'technical',
        level: 'advanced',
        threshold: 85,
        description: 'Advanced technical problem-solving and troubleshooting competency',
        requirements: {
          competencies: ['technicalCompetency', 'problemSolving', 'learningAgility'],
          minimumScores: {
            technicalCompetency: 85,
            problemSolving: 80,
            learningAgility: 75
          }
        },
        industrySource: 'CompTIA Professional Standards',
        lastUpdated: new Date(),
        applicability: {
          roles: ['specialist', 'senior_support', 'technical_lead'],
          experienceLevels: ['advanced', 'expert'],
          industries: ['technology', 'all']
        }
      },
      {
        id: 'professional-communication',
        name: 'Professional Communication Standard',
        category: 'communication',
        level: 'intermediate',
        threshold: 75,
        description: 'Professional communication skills for workplace effectiveness',
        requirements: {
          competencies: ['communicationSkills', 'customerService'],
          minimumScores: {
            communicationSkills: 75,
            customerService: 70
          }
        },
        industrySource: 'International Communication Association',
        lastUpdated: new Date(),
        applicability: {
          roles: ['all'],
          experienceLevels: ['intermediate', 'advanced', 'expert'],
          industries: ['all']
        }
      },
      {
        id: 'compliance-and-security',
        name: 'IT Compliance and Security Standard',
        category: 'compliance',
        level: 'intermediate',
        threshold: 85,
        description: 'Information security and compliance competency for IT professionals',
        requirements: {
          competencies: ['processCompliance', 'technicalCompetency'],
          minimumScores: {
            processCompliance: 85,
            technicalCompetency: 75
          }
        },
        industrySource: 'ISO 27001 / NIST Framework',
        lastUpdated: new Date(),
        applicability: {
          roles: ['support', 'analyst', 'administrator'],
          experienceLevels: ['intermediate', 'advanced', 'expert'],
          industries: ['finance', 'healthcare', 'government', 'all']
        }
      }
    ];

    standards.forEach(standard => {
      this.standards.set(standard.id, standard);
    });
  }

  private initializeBenchmarkData(): void {
    const benchmarks: BenchmarkData[] = [
      {
        standard: 'industry-average',
        dimension: 'technicalCompetency',
        entryLevel: {min: 50, average: 65, excellent: 80},
        intermediate: {min: 65, average: 75, excellent: 88},
        advanced: {min: 75, average: 85, excellent: 95},
        expert: {min: 85, average: 92, excellent: 98},
        percentiles: [50, 65, 75, 85, 92],
        sampleSize: 2500,
        confidenceInterval: 95
      },
      {
        standard: 'industry-average',
        dimension: 'customerService',
        entryLevel: {min: 55, average: 70, excellent: 85},
        intermediate: {min: 70, average: 80, excellent: 92},
        advanced: {min: 80, average: 88, excellent: 96},
        expert: {min: 88, average: 94, excellent: 99},
        percentiles: [55, 70, 80, 88, 94],
        sampleSize: 3000,
        confidenceInterval: 95
      },
      {
        standard: 'industry-average',
        dimension: 'communicationSkills',
        entryLevel: {min: 50, average: 68, excellent: 82},
        intermediate: {min: 65, average: 78, excellent: 90},
        advanced: {min: 75, average: 86, excellent: 95},
        expert: {min: 85, average: 92, excellent: 98},
        percentiles: [50, 68, 78, 86, 92],
        sampleSize: 2800,
        confidenceInterval: 95
      },
      {
        standard: 'industry-average',
        dimension: 'problemSolving',
        entryLevel: {min: 45, average: 62, excellent: 78},
        intermediate: {min: 60, average: 74, excellent: 87},
        advanced: {min: 70, average: 82, excellent: 93},
        expert: {min: 80, average: 90, excellent: 97},
        percentiles: [45, 62, 74, 82, 90],
        sampleSize: 2200,
        confidenceInterval: 95
      },
      {
        standard: 'industry-average',
        dimension: 'processCompliance',
        entryLevel: {min: 60, average: 75, excellent: 88},
        intermediate: {min: 75, average: 85, excellent: 95},
        advanced: {min: 85, average: 92, excellent: 98},
        expert: {min: 90, average: 96, excellent: 99},
        percentiles: [60, 75, 85, 92, 96],
        sampleSize: 2600,
        confidenceInterval: 95
      },
      {
        standard: 'industry-average',
        dimension: 'learningAgility',
        entryLevel: {min: 50, average: 68, excellent: 83},
        intermediate: {min: 65, average: 78, excellent: 90},
        advanced: {min: 75, average: 86, excellent: 95},
        expert: {min: 83, average: 91, excellent: 97},
        percentiles: [50, 68, 78, 86, 91],
        sampleSize: 1800,
        confidenceInterval: 95
      }
    ];

    benchmarks.forEach(benchmark => {
      this.benchmarkData.set(benchmark.dimension, benchmark);
    });
  }

  private initializeComplianceFrameworks(): void {
    const frameworks: ComplianceFramework[] = [
      {
        id: 'itil-v4',
        name: 'ITIL v4 Framework',
        description: 'IT Infrastructure Library version 4 service management framework',
        requirements: [
          {
            id: 'service-management',
            description: 'Service management principles and practices',
            competencyArea: 'processCompliance',
            minimumScore: 80,
            weight: 0.3
          },
          {
            id: 'technical-skills',
            description: 'Technical competency in IT systems',
            competencyArea: 'technicalCompetency',
            minimumScore: 75,
            weight: 0.25
          },
          {
            id: 'customer-focus',
            description: 'Customer service and relationship management',
            competencyArea: 'customerService',
            minimumScore: 78,
            weight: 0.25
          },
          {
            id: 'continuous-improvement',
            description: 'Learning agility and improvement mindset',
            competencyArea: 'learningAgility',
            minimumScore: 73,
            weight: 0.2
          }
        ],
        certificationBody: 'AXELOS',
        validityPeriod: 36, // months
        renewalRequirements: ['Continuing professional development', 'Re-certification exam']
      },
      {
        id: 'iso-20000',
        name: 'ISO/IEC 20000 Service Management',
        description: 'International standard for IT service management',
        requirements: [
          {
            id: 'process-adherence',
            description: 'Strict adherence to documented processes',
            competencyArea: 'processCompliance',
            minimumScore: 85,
            weight: 0.4
          },
          {
            id: 'quality-management',
            description: 'Quality management principles',
            competencyArea: 'technicalCompetency',
            minimumScore: 80,
            weight: 0.3
          },
          {
            id: 'service-delivery',
            description: 'Effective service delivery practices',
            competencyArea: 'customerService',
            minimumScore: 82,
            weight: 0.3
          }
        ],
        certificationBody: 'ISO',
        validityPeriod: 36,
        renewalRequirements: ['Annual surveillance audit', 'Continuous improvement evidence']
      }
    ];

    frameworks.forEach(framework => {
      this.complianceFrameworks.set(framework.id, framework);
    });
  }

  private async assessSingleStandard(
    standard: IndustryStandard,
    userScores: Record<string, number>
  ): Promise<StandardsAssessment> {
    const competencyGaps: StandardsAssessment['competencyGaps'] = [];
    let overallQualifies = true;

    // Check each required competency
    for (const [competency, requiredScore] of Object.entries(standard.requirements.minimumScores)) {
      const userScore = userScores[competency] || 0;
      const gap = requiredScore - userScore;

      if (gap > 0) {
        overallQualifies = false;
        competencyGaps.push({
          competency,
          currentScore: userScore,
          requiredScore,
          gap,
          priority: gap > 15 ? 'high' : gap > 8 ? 'medium' : 'low'
        });
      }
    }

    // Determine current level and next level
    const avgUserScore = Object.values(userScores).reduce((a, b) => a + b, 0) / Object.values(userScores).length;
    const currentLevel = this.determineCurrentLevel(avgUserScore);
    const nextLevel = this.getNextLevel(currentLevel);

    // Generate recommendations
    const recommendations = this.generateStandardRecommendations(standard, competencyGaps, currentLevel);

    // Estimate time to achieve
    const timeToAchieve = this.estimateTimeToAchieve(competencyGaps);

    return {
      standardId: standard.id,
      standardName: standard.name,
      userQualifies: overallQualifies,
      currentLevel,
      nextLevel,
      competencyGaps,
      recommendations,
      timeToAchieve
    };
  }

  private determineCurrentLevel(avgScore: number): 'entry' | 'intermediate' | 'advanced' | 'expert' | 'below_entry' {
    if (avgScore >= 90) return 'expert';
    if (avgScore >= 80) return 'advanced';
    if (avgScore >= 70) return 'intermediate';
    if (avgScore >= 60) return 'entry';
    return 'below_entry';
  }

  private getNextLevel(currentLevel: 'entry' | 'intermediate' | 'advanced' | 'expert' | 'below_entry'): 'entry' | 'intermediate' | 'advanced' | 'expert' | undefined {
    const progression = {
      'below_entry': 'entry' as const,
      'entry': 'intermediate' as const,
      'intermediate': 'advanced' as const,
      'advanced': 'expert' as const,
      'expert': undefined
    };
    return progression[currentLevel];
  }

  private generateStandardRecommendations(
    standard: IndustryStandard,
    gaps: StandardsAssessment['competencyGaps'],
    currentLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (gaps.length === 0) {
      recommendations.push(`Congratulations! You meet the ${standard.name} requirements`);
      recommendations.push('Consider pursuing the next level of certification or specialization');
    } else {
      const highPriorityGaps = gaps.filter(g => g.priority === 'high');
      if (highPriorityGaps.length > 0) {
        const biggestGap = highPriorityGaps.reduce((max, gap) => gap.gap > max.gap ? gap : max);
        recommendations.push(`Priority focus: Improve ${biggestGap.competency} by ${biggestGap.gap} points to meet ${standard.name} requirements`);
      }

      const mediumGaps = gaps.filter(g => g.priority === 'medium');
      if (mediumGaps.length > 0) {
        recommendations.push(`Secondary focus: Address ${mediumGaps.map(g => g.competency).join(', ')} competencies`);
      }

      recommendations.push(`Target overall improvement to achieve ${standard.level} level competency in ${standard.category}`);
    }

    return recommendations;
  }

  private estimateTimeToAchieve(gaps: StandardsAssessment['competencyGaps']): string | undefined {
    if (gaps.length === 0) return undefined;

    const totalGap = gaps.reduce((sum, gap) => sum + gap.gap, 0);
    const avgGap = totalGap / gaps.length;

    // Estimate based on typical improvement rates
    if (avgGap <= 5) return '2-4 weeks with focused practice';
    if (avgGap <= 10) return '1-2 months with consistent effort';
    if (avgGap <= 15) return '2-4 months with structured learning';
    return '4-6 months with comprehensive development program';
  }

  private calculatePercentile(score: number, average: number, stdDev: number): number {
    const zScore = (score - average) / stdDev;
    return this.normalCDF(zScore) * 100;
  }

  private normalCDF(z: number): number {
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

  private generateComparisonText(score: number, levelData: {min: number; average: number; excellent: number}): string {
    if (score >= levelData.excellent) return `Excellent performance - ${(score - levelData.excellent).toFixed(1)} points above excellence threshold`;
    if (score >= levelData.average) return `Above average - ${(score - levelData.average).toFixed(1)} points above industry average`;
    if (score >= levelData.min) return `Meets minimum requirements - ${(levelData.average - score).toFixed(1)} points below average`;
    return `Below minimum - ${(levelData.min - score).toFixed(1)} points below entry threshold`;
  }
}

export const industryStandardsService = new IndustryStandardsService();