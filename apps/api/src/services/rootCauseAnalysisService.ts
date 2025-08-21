import { logger } from '../utils/logger';

export interface RootCauseData {
  id?: string;
  ticketId: string;
  primaryCause: string;
  contributingFactors: string[];
  rootCauseCategory: 'technical' | 'process' | 'human' | 'environmental' | 'vendor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impactArea: string[];
  preventionMeasures: string[];
  recommendations: string[];
  analysisMethod: 'five-whys' | 'fishbone' | 'timeline' | 'rca-tree' | 'other';
  analysisDate: Date;
  analyst: string;
  reviewStatus: 'draft' | 'reviewed' | 'approved';
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnalysisFramework {
  id: string;
  name: string;
  description: string;
  steps: string[];
  questions: string[];
  category: string[];
  timeEstimate: number; // in minutes
}

export interface RootCauseValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number;
  qualityScore: number;
}

export interface AnalysisInsights {
  ticketId: string;
  frequentCauses: Array<{
    cause: string;
    frequency: number;
    category: string;
  }>;
  categoryDistribution: Record<string, number>;
  severityTrends: Record<string, number>;
  preventionEffectiveness: Array<{
    measure: string;
    successRate: number;
  }>;
  recommendationTracking: Array<{
    recommendation: string;
    implemented: boolean;
    outcome: string;
  }>;
}

export class RootCauseAnalysisService {
  private static instance: RootCauseAnalysisService;
  private analyses: Map<string, RootCauseData> = new Map();
  private frameworks: Map<string, AnalysisFramework> = new Map();

  public static getInstance(): RootCauseAnalysisService {
    if (!RootCauseAnalysisService.instance) {
      RootCauseAnalysisService.instance = new RootCauseAnalysisService();
    }
    return RootCauseAnalysisService.instance;
  }

  constructor() {
    this.initializeFrameworks();
  }

  private initializeFrameworks(): void {
    const defaultFrameworks: AnalysisFramework[] = [
      {
        id: 'five-whys',
        name: '5 Whys Analysis',
        description: 'Ask "why" five times to drill down to the root cause',
        steps: [
          'Clearly define the problem statement',
          'Ask why the problem occurred',
          'For each answer, ask why again',
          'Continue until you reach the root cause (usually 5 whys)',
          'Develop preventive measures for the root cause'
        ],
        questions: [
          'Why did this problem occur?',
          'Why did that condition exist?',
          'Why was that process inadequate?',
          'Why was that control missing?',
          'Why was that system design insufficient?'
        ],
        category: ['technical', 'process', 'human'],
        timeEstimate: 15
      },
      {
        id: 'fishbone',
        name: 'Fishbone Diagram (Ishikawa)',
        description: 'Categorize potential causes into major groups for systematic analysis',
        steps: [
          'Clearly state the problem at the head of the fish',
          'Identify major cause categories (bones)',
          'Brainstorm potential causes in each category',
          'Analyze each cause for validity',
          'Identify the most likely root causes'
        ],
        questions: [
          'What people factors contributed to this issue?',
          'What process failures were involved?',
          'What equipment or technology problems occurred?',
          'What environmental factors played a role?',
          'What material or resource issues contributed?',
          'What method or procedure issues existed?'
        ],
        category: ['technical', 'process', 'human', 'environmental'],
        timeEstimate: 30
      },
      {
        id: 'timeline',
        name: 'Timeline Analysis',
        description: 'Analyze the chronological sequence of events leading to the problem',
        steps: [
          'Create a detailed timeline of all relevant events',
          'Identify critical decision points and actions',
          'Analyze each event for contributing factors',
          'Look for patterns, trends, or warning signs',
          'Identify the root cause event or condition'
        ],
        questions: [
          'What was the first indication of the problem?',
          'What events preceded the issue?',
          'What decisions were made at each critical point?',
          'What warning signs were missed or ignored?',
          'What could have been done differently at each stage?'
        ],
        category: ['technical', 'process', 'human'],
        timeEstimate: 25
      },
      {
        id: 'rca-tree',
        name: 'Root Cause Analysis Tree',
        description: 'Create a hierarchical tree structure showing causal relationships',
        steps: [
          'Place the problem at the top of the tree',
          'Identify and document immediate causes',
          'For each immediate cause, find its underlying causes',
          'Continue branching until root causes are identified',
          'Validate all causal relationships'
        ],
        questions: [
          'What directly caused this symptom?',
          'What caused that condition to exist?',
          'Are there multiple contributing causes?',
          'What is the most fundamental reason?',
          'Can we trace this cause further back?'
        ],
        category: ['technical', 'process', 'human', 'environmental'],
        timeEstimate: 35
      }
    ];

    defaultFrameworks.forEach(framework => {
      this.frameworks.set(framework.id, framework);
    });

    logger.info('Initialized root cause analysis frameworks', {
      frameworkCount: defaultFrameworks.length
    });
  }

  async createAnalysis(analysisData: Omit<RootCauseData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const analysisId = `rca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const analysis: RootCauseData = {
        ...analysisData,
        id: analysisId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.analyses.set(analysisId, analysis);

      logger.info('Created root cause analysis', {
        analysisId,
        ticketId: analysis.ticketId,
        method: analysis.analysisMethod,
        category: analysis.rootCauseCategory,
        severity: analysis.severity,
        userId: analysis.userId
      });

      return analysisId;
    } catch (error) {
      logger.error('Failed to create root cause analysis', { error, ticketId: analysisData.ticketId });
      throw error;
    }
  }

  async updateAnalysis(analysisId: string, updates: Partial<RootCauseData>): Promise<void> {
    try {
      const existingAnalysis = this.analyses.get(analysisId);
      if (!existingAnalysis) {
        throw new Error(`Root cause analysis not found: ${analysisId}`);
      }

      const updatedAnalysis: RootCauseData = {
        ...existingAnalysis,
        ...updates,
        updatedAt: new Date()
      };

      this.analyses.set(analysisId, updatedAnalysis);

      logger.info('Updated root cause analysis', {
        analysisId,
        updatedFields: Object.keys(updates),
        ticketId: updatedAnalysis.ticketId
      });
    } catch (error) {
      logger.error('Failed to update root cause analysis', { error, analysisId });
      throw error;
    }
  }

  async getAnalysis(analysisId: string): Promise<RootCauseData | null> {
    try {
      const analysis = this.analyses.get(analysisId);
      return analysis || null;
    } catch (error) {
      logger.error('Failed to get root cause analysis', { error, analysisId });
      throw error;
    }
  }

  async getAnalysisByTicket(ticketId: string): Promise<RootCauseData | null> {
    try {
      for (const analysis of this.analyses.values()) {
        if (analysis.ticketId === ticketId) {
          return analysis;
        }
      }
      return null;
    } catch (error) {
      logger.error('Failed to get root cause analysis by ticket', { error, ticketId });
      throw error;
    }
  }

  async validateAnalysis(analysisId: string): Promise<RootCauseValidation> {
    try {
      const analysis = this.analyses.get(analysisId);
      if (!analysis) {
        throw new Error(`Root cause analysis not found: ${analysisId}`);
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Required field validation
      if (!analysis.primaryCause?.trim()) {
        errors.push('Primary cause is required');
      }
      if (!analysis.analyst?.trim()) {
        errors.push('Analyst name is required');
      }

      // Quality checks (warnings)
      if (analysis.primaryCause && analysis.primaryCause.length < 20) {
        warnings.push('Primary cause description is very brief - consider adding more detail');
      }
      if (analysis.contributingFactors.length === 0) {
        warnings.push('No contributing factors identified - consider if any secondary causes exist');
      }
      if (analysis.preventionMeasures.length === 0) {
        warnings.push('No prevention measures specified - consider what could prevent recurrence');
      }
      if (analysis.recommendations.length === 0) {
        warnings.push('No recommendations provided - consider actionable next steps');
      }
      if (analysis.impactArea.length === 0) {
        warnings.push('No impact areas identified - consider what aspects of the business were affected');
      }

      // Framework-specific validation
      const framework = this.frameworks.get(analysis.analysisMethod);
      if (framework) {
        if (analysis.analysisMethod === 'five-whys' && analysis.contributingFactors.length < 3) {
          warnings.push('5 Whys analysis typically reveals at least 3 levels of causation');
        }
        if (analysis.analysisMethod === 'fishbone' && analysis.contributingFactors.length < 4) {
          warnings.push('Fishbone analysis should explore multiple cause categories');
        }
      }

      // Review status validation
      if (analysis.reviewStatus === 'approved' && errors.length > 0) {
        errors.push('Analysis cannot be approved with validation errors');
      }

      // Calculate completeness score
      let totalFields = 8; // Primary required fields
      let completedFields = 0;
      
      if (analysis.primaryCause?.trim()) completedFields++;
      if (analysis.analyst?.trim()) completedFields++;
      if (analysis.contributingFactors.length > 0) completedFields++;
      if (analysis.preventionMeasures.length > 0) completedFields++;
      if (analysis.recommendations.length > 0) completedFields++;
      if (analysis.impactArea.length > 0) completedFields++;
      if (analysis.rootCauseCategory) completedFields++;
      if (analysis.severity) completedFields++;

      const completeness = (completedFields / totalFields) * 100;

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(analysis);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        completeness,
        qualityScore
      };
    } catch (error) {
      logger.error('Failed to validate root cause analysis', { error, analysisId });
      throw error;
    }
  }

  private calculateQualityScore(analysis: RootCauseData): number {
    let score = 0;
    const maxScore = 100;

    // Primary cause quality (25 points)
    if (analysis.primaryCause?.trim()) {
      score += 15;
      if (analysis.primaryCause.length >= 50) score += 10; // Detailed description
    }

    // Contributing factors (20 points)
    if (analysis.contributingFactors.length > 0) {
      score += 10;
      if (analysis.contributingFactors.length >= 3) score += 5; // Multiple factors
      if (analysis.contributingFactors.every(f => f.length >= 10)) score += 5; // Detailed factors
    }

    // Prevention measures (20 points)
    if (analysis.preventionMeasures.length > 0) {
      score += 10;
      if (analysis.preventionMeasures.length >= 2) score += 5; // Multiple measures
      if (analysis.preventionMeasures.every(m => m.length >= 15)) score += 5; // Detailed measures
    }

    // Recommendations (15 points)
    if (analysis.recommendations.length > 0) {
      score += 10;
      if (analysis.recommendations.length >= 2) score += 5; // Multiple recommendations
    }

    // Impact analysis (10 points)
    if (analysis.impactArea.length > 0) {
      score += 5;
      if (analysis.impactArea.length >= 3) score += 5; // Multiple impact areas
    }

    // Analysis methodology (10 points)
    const framework = this.frameworks.get(analysis.analysisMethod);
    if (framework) {
      score += 5;
      // Bonus for using comprehensive methods
      if (['fishbone', 'rca-tree'].includes(analysis.analysisMethod)) score += 5;
    }

    return Math.round((score / maxScore) * 100);
  }

  async getFrameworks(): Promise<AnalysisFramework[]> {
    try {
      return Array.from(this.frameworks.values());
    } catch (error) {
      logger.error('Failed to get analysis frameworks', { error });
      throw error;
    }
  }

  async getFramework(frameworkId: string): Promise<AnalysisFramework | null> {
    try {
      return this.frameworks.get(frameworkId) || null;
    } catch (error) {
      logger.error('Failed to get analysis framework', { error, frameworkId });
      throw error;
    }
  }

  async getRecommendedFramework(
    category: string,
    complexity: 'simple' | 'moderate' | 'complex',
    timeAvailable: number
  ): Promise<AnalysisFramework> {
    try {
      const frameworks = Array.from(this.frameworks.values())
        .filter(f => f.category.includes(category) && f.timeEstimate <= timeAvailable)
        .sort((a, b) => {
          if (complexity === 'simple') return a.timeEstimate - b.timeEstimate;
          if (complexity === 'complex') return b.timeEstimate - a.timeEstimate;
          return Math.abs(a.timeEstimate - 20) - Math.abs(b.timeEstimate - 20); // Moderate prefers ~20 min
        });

      if (frameworks.length === 0) {
        // Fallback to five-whys if no match
        return this.frameworks.get('five-whys')!;
      }

      return frameworks[0];
    } catch (error) {
      logger.error('Failed to get recommended framework', { error, category, complexity });
      throw error;
    }
  }

  async generateAnalysisInsights(ticketIds?: string[]): Promise<AnalysisInsights> {
    try {
      const analysesToConsider = ticketIds
        ? Array.from(this.analyses.values()).filter(a => ticketIds.includes(a.ticketId))
        : Array.from(this.analyses.values());

      // Frequent causes analysis
      const causeFrequency = new Map<string, { count: number; category: string }>();
      analysesToConsider.forEach(analysis => {
        const key = analysis.primaryCause.toLowerCase().trim();
        if (key) {
          const existing = causeFrequency.get(key) || { count: 0, category: analysis.rootCauseCategory };
          causeFrequency.set(key, { count: existing.count + 1, category: analysis.rootCauseCategory });
        }
      });

      const frequentCauses = Array.from(causeFrequency.entries())
        .map(([cause, data]) => ({
          cause,
          frequency: data.count,
          category: data.category
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      // Category distribution
      const categoryDistribution: Record<string, number> = {};
      analysesToConsider.forEach(analysis => {
        categoryDistribution[analysis.rootCauseCategory] = 
          (categoryDistribution[analysis.rootCauseCategory] || 0) + 1;
      });

      // Severity trends
      const severityTrends: Record<string, number> = {};
      analysesToConsider.forEach(analysis => {
        severityTrends[analysis.severity] = (severityTrends[analysis.severity] || 0) + 1;
      });

      // Prevention effectiveness (mock data for now)
      const preventionEffectiveness = [
        { measure: 'Regular monitoring', successRate: 85 },
        { measure: 'Automated alerts', successRate: 92 },
        { measure: 'Process documentation', successRate: 78 },
        { measure: 'Training programs', successRate: 71 },
        { measure: 'Code reviews', successRate: 88 }
      ];

      // Recommendation tracking (mock data for now)
      const recommendationTracking = [
        { recommendation: 'Implement monitoring', implemented: true, outcome: 'Reduced incidents by 40%' },
        { recommendation: 'Update documentation', implemented: true, outcome: 'Improved response time' },
        { recommendation: 'Additional training', implemented: false, outcome: 'Pending approval' }
      ];

      const ticketId = ticketIds?.[0] || 'all';

      return {
        ticketId,
        frequentCauses,
        categoryDistribution,
        severityTrends,
        preventionEffectiveness,
        recommendationTracking
      };
    } catch (error) {
      logger.error('Failed to generate analysis insights', { error, ticketIds });
      throw error;
    }
  }

  async exportAnalysis(analysisId: string, format: 'json' | 'pdf' | 'markdown'): Promise<string> {
    try {
      const analysis = this.analyses.get(analysisId);
      if (!analysis) {
        throw new Error(`Root cause analysis not found: ${analysisId}`);
      }

      switch (format) {
        case 'json':
          return JSON.stringify(analysis, null, 2);
        case 'markdown':
          return this.exportToMarkdown(analysis);
        case 'pdf':
          // In a real implementation, this would generate a PDF
          return this.exportToMarkdown(analysis);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Failed to export root cause analysis', { error, analysisId, format });
      throw error;
    }
  }

  private exportToMarkdown(analysis: RootCauseData): string {
    const framework = this.frameworks.get(analysis.analysisMethod);
    
    return `# Root Cause Analysis Report

## Analysis Information
- **Ticket ID:** ${analysis.ticketId}
- **Analysis ID:** ${analysis.id}
- **Date:** ${analysis.analysisDate.toLocaleDateString()}
- **Analyst:** ${analysis.analyst}
- **Method:** ${framework?.name || analysis.analysisMethod}
- **Status:** ${analysis.reviewStatus.toUpperCase()}

## Problem Classification
- **Category:** ${analysis.rootCauseCategory.charAt(0).toUpperCase() + analysis.rootCauseCategory.slice(1)}
- **Severity:** ${analysis.severity.toUpperCase()}
- **Impact Areas:** ${analysis.impactArea.join(', ')}

## Root Cause Analysis

### Primary Cause
${analysis.primaryCause}

### Contributing Factors
${analysis.contributingFactors.length > 0 
  ? analysis.contributingFactors.map((factor, index) => `${index + 1}. ${factor}`).join('\n')
  : 'None identified'
}

## Prevention and Recommendations

### Prevention Measures
${analysis.preventionMeasures.length > 0
  ? analysis.preventionMeasures.map((measure, index) => `${index + 1}. ${measure}`).join('\n')
  : 'None specified'
}

### Recommendations
${analysis.recommendations.length > 0
  ? analysis.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')
  : 'None provided'
}

---
*Generated on ${new Date().toISOString()}*
*Analysis Framework: ${framework?.description || 'Custom method'}*`;
  }

  async deleteAnalysis(analysisId: string): Promise<void> {
    try {
      const analysis = this.analyses.get(analysisId);
      if (!analysis) {
        throw new Error(`Root cause analysis not found: ${analysisId}`);
      }

      this.analyses.delete(analysisId);

      logger.info('Deleted root cause analysis', {
        analysisId,
        ticketId: analysis.ticketId
      });
    } catch (error) {
      logger.error('Failed to delete root cause analysis', { error, analysisId });
      throw error;
    }
  }

  async getAnalysesByUser(userId: string): Promise<RootCauseData[]> {
    try {
      return Array.from(this.analyses.values())
        .filter(analysis => analysis.userId === userId)
        .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
    } catch (error) {
      logger.error('Failed to get analyses by user', { error, userId });
      throw error;
    }
  }

  async getAnalysesForReview(): Promise<RootCauseData[]> {
    try {
      return Array.from(this.analyses.values())
        .filter(analysis => analysis.reviewStatus === 'draft')
        .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    } catch (error) {
      logger.error('Failed to get analyses for review', { error });
      throw error;
    }
  }
}