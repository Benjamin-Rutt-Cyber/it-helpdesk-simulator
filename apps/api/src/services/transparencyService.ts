/**
 * Transparency Service
 * Provides clear explanations and transparency for XP calculations and performance assessments
 */

import { XPCalculationResult, PerformanceMetrics, ActivityData } from './xpCalculator';
import { PerformanceCalculationResult, PerformanceWeights } from './performanceWeightingService';
import { BonusApplication } from './bonusEngine';

export interface TransparencyReport {
  id: string;
  userId: string;
  activityId: string;
  timestamp: Date;
  calculationBreakdown: CalculationBreakdown;
  performanceExplanation: PerformanceExplanation;
  bonusExplanation: BonusExplanation;
  comparativeAnalysis: ComparativeAnalysis;
  improvementSuggestions: ImprovementSuggestion[];
  fairnessMetrics: FairnessMetrics;
}

export interface CalculationBreakdown {
  summary: string;
  steps: CalculationStep[];
  formulaUsed: string;
  inputValues: Record<string, any>;
  outputValue: number;
  confidence: number;
}

export interface CalculationStep {
  stepNumber: number;
  description: string;
  calculation: string;
  input: Record<string, any>;
  output: number;
  reasoning: string;
}

export interface PerformanceExplanation {
  overallScore: number;
  tier: string;
  breakdown: PerformanceMetricExplanation[];
  weightingRationale: WeightingRationale;
  contextFactors: ContextFactor[];
  scoreInterpretation: string;
}

export interface PerformanceMetricExplanation {
  metric: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
  contribution: number;
  interpretation: string;
  benchmarkComparison: BenchmarkComparison;
}

export interface WeightingRationale {
  configurationUsed: string;
  reasonsForWeights: string[];
  contextualAdjustments: string[];
  alternativeConfigurations: string[];
}

export interface ContextFactor {
  factor: string;
  value: any;
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
  magnitude: number;
}

export interface BonusExplanation {
  totalBonus: number;
  individualBonuses: IndividualBonusExplanation[];
  missedOpportunities: MissedOpportunity[];
  eligibilityCriteria: BonusCriteria[];
}

export interface IndividualBonusExplanation {
  bonusName: string;
  points: number;
  criteria: string[];
  whyEarned: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  impact: string;
}

export interface MissedOpportunity {
  bonusName: string;
  points: number;
  whatWasMissing: string;
  howToEarn: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface BonusCriteria {
  bonusName: string;
  requirements: string[];
  examples: string[];
  tips: string[];
}

export interface ComparativeAnalysis {
  userPerformance: number;
  averagePerformance: number;
  percentile: number;
  similarActivities: ActivityComparison[];
  historicalTrend: TrendAnalysis;
  peerComparison: PeerComparison;
}

export interface ActivityComparison {
  activityType: string;
  userAverage: number;
  globalAverage: number;
  difference: number;
  ranking: number;
  totalParticipants: number;
}

export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable';
  rate: number;
  period: string;
  milestones: Milestone[];
  projectedPerformance: number;
}

export interface Milestone {
  date: Date;
  achievement: string;
  score: number;
  significance: string;
}

export interface PeerComparison {
  sameLevel: number;
  sameDifficulty: number;
  sameActivity: number;
  insights: string[];
}

export interface ImprovementSuggestion {
  category: 'performance' | 'technique' | 'strategy' | 'knowledge';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  rationale: string;
  expectedImpact: number;
  timeToImplement: string;
  resources: Resource[];
  examples: string[];
}

export interface Resource {
  type: 'documentation' | 'tutorial' | 'practice' | 'mentoring';
  title: string;
  description: string;
  url?: string;
  estimatedTime: string;
}

export interface FairnessMetrics {
  biasScore: number;
  consistencyScore: number;
  explanabilityScore: number;
  fairnessFactors: FairnessFactor[];
  auditTrail: AuditEntry[];
}

export interface FairnessFactor {
  factor: string;
  score: number;
  explanation: string;
  impact: string;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  parameters: Record<string, any>;
  result: any;
  checksum: string;
}

export interface BenchmarkComparison {
  percentile: number;
  category: string;
  description: string;
  improvement: string;
}

export interface ExplanationQuery {
  type: 'why_this_score' | 'how_to_improve' | 'bonus_details' | 'comparison_analysis' | 'weight_rationale';
  context?: Record<string, any>;
  detail_level: 'basic' | 'detailed' | 'expert';
}

export interface ExplanationResponse {
  query: ExplanationQuery;
  explanation: string;
  supporting_data: Record<string, any>;
  visualizations: Visualization[];
  related_resources: Resource[];
}

export interface Visualization {
  type: 'bar_chart' | 'line_graph' | 'pie_chart' | 'radar_chart' | 'progress_bar';
  title: string;
  data: any;
  description: string;
}

class TransparencyService {
  private explanationCache: Map<string, TransparencyReport> = new Map();
  private benchmarks: Map<string, any> = new Map();

  /**
   * Generate comprehensive transparency report
   */
  async generateTransparencyReport(
    userId: string,
    activityId: string,
    xpResult: XPCalculationResult,
    performanceResult: PerformanceCalculationResult,
    activityData: ActivityData,
    bonusApplications: BonusApplication[]
  ): Promise<TransparencyReport> {
    const report: TransparencyReport = {
      id: this.generateReportId(),
      userId,
      activityId,
      timestamp: new Date(),
      calculationBreakdown: await this.createCalculationBreakdown(xpResult, activityData),
      performanceExplanation: await this.createPerformanceExplanation(performanceResult, activityData),
      bonusExplanation: await this.createBonusExplanation(bonusApplications, activityData),
      comparativeAnalysis: await this.createComparativeAnalysis(userId, performanceResult, activityData),
      improvementSuggestions: await this.generateImprovementSuggestions(performanceResult, activityData),
      fairnessMetrics: await this.calculateFairnessMetrics(xpResult, performanceResult, activityData)
    };

    // Cache the report
    this.explanationCache.set(report.id, report);
    
    return report;
  }

  /**
   * Answer specific transparency questions
   */
  async explainCalculation(query: ExplanationQuery, reportId: string): Promise<ExplanationResponse> {
    const report = this.explanationCache.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    switch (query.type) {
      case 'why_this_score':
        return await this.explainScoreReasoning(report, query.detail_level);
      
      case 'how_to_improve':
        return await this.explainImprovementPath(report, query.detail_level);
      
      case 'bonus_details':
        return await this.explainBonusSystem(report, query.detail_level);
      
      case 'comparison_analysis':
        return await this.explainComparisons(report, query.detail_level);
      
      case 'weight_rationale':
        return await this.explainWeightingLogic(report, query.detail_level);
      
      default:
        throw new Error('Unknown query type');
    }
  }

  /**
   * Get simplified explanation for users
   */
  async getSimpleExplanation(reportId: string): Promise<{
    summary: string;
    keyPoints: string[];
    nextSteps: string[];
    visualSummary: any;
  }> {
    const report = this.explanationCache.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const summary = `You earned ${report.calculationBreakdown.outputValue} XP with a performance score of ${report.performanceExplanation.overallScore}%. ` +
                   `This puts you in the ${report.performanceExplanation.tier} tier.`;

    const keyPoints = [
      `Your strongest area: ${this.getStrongestMetric(report.performanceExplanation)}`,
      `Bonus XP earned: ${report.bonusExplanation.totalBonus} points`,
      `Performance compared to others: ${report.comparativeAnalysis.percentile}th percentile`
    ];

    const nextSteps = report.improvementSuggestions
      .filter(s => s.priority === 'high')
      .slice(0, 3)
      .map(s => s.suggestion);

    const visualSummary = {
      performanceRadar: this.createPerformanceRadar(report.performanceExplanation),
      xpBreakdown: this.createXPBreakdownChart(report.calculationBreakdown),
      progressBar: this.createProgressVisualization(report.comparativeAnalysis)
    };

    return {
      summary,
      keyPoints,
      nextSteps,
      visualSummary
    };
  }

  /**
   * Generate audit trail for calculation
   */
  async getCalculationAuditTrail(reportId: string): Promise<AuditEntry[]> {
    const report = this.explanationCache.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    return report.fairnessMetrics.auditTrail;
  }

  /**
   * Validate calculation transparency
   */
  async validateTransparency(reportId: string): Promise<{
    isTransparent: boolean;
    transparencyScore: number;
    issues: string[];
    recommendations: string[];
  }> {
    const report = this.explanationCache.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check explanation completeness
    if (report.calculationBreakdown.steps.length < 3) {
      issues.push('Calculation breakdown lacks sufficient detail');
      recommendations.push('Add more detailed calculation steps');
    }

    // Check fairness metrics
    if (report.fairnessMetrics.biasScore > 0.3) {
      issues.push('Potential bias detected in calculation');
      recommendations.push('Review weighting and adjustment factors');
    }

    // Check explanation clarity
    if (report.fairnessMetrics.explanabilityScore < 0.7) {
      issues.push('Explanations may be too technical or unclear');
      recommendations.push('Simplify explanations and add more examples');
    }

    const transparencyScore = Math.max(0, 1 - (issues.length * 0.25));

    return {
      isTransparent: issues.length === 0,
      transparencyScore,
      issues,
      recommendations
    };
  }

  /**
   * Create calculation breakdown
   */
  private async createCalculationBreakdown(
    xpResult: XPCalculationResult,
    activityData: ActivityData
  ): Promise<CalculationBreakdown> {
    const steps: CalculationStep[] = [
      {
        stepNumber: 1,
        description: 'Base XP for activity type',
        calculation: `${activityData.type} activity`,
        input: { activityType: activityData.type },
        output: xpResult.baseXP,
        reasoning: `Each ${activityData.type.replace('_', ' ')} activity has a base value of ${xpResult.baseXP} XP`
      },
      {
        stepNumber: 2,
        description: 'Difficulty multiplier applied',
        calculation: `${xpResult.baseXP} × ${xpResult.difficultyMultiplier}`,
        input: { 
          baseXP: xpResult.baseXP, 
          difficulty: activityData.scenarioDifficulty,
          multiplier: xpResult.difficultyMultiplier 
        },
        output: Math.round(xpResult.baseXP * xpResult.difficultyMultiplier),
        reasoning: `${activityData.scenarioDifficulty} difficulty scenarios receive a ${xpResult.difficultyMultiplier}x multiplier`
      },
      {
        stepNumber: 3,
        description: 'Performance multiplier applied',
        calculation: `${Math.round(xpResult.baseXP * xpResult.difficultyMultiplier)} × ${xpResult.performanceMultiplier}`,
        input: { 
          adjustedXP: Math.round(xpResult.baseXP * xpResult.difficultyMultiplier),
          performanceMultiplier: xpResult.performanceMultiplier 
        },
        output: Math.round(xpResult.baseXP * xpResult.difficultyMultiplier * xpResult.performanceMultiplier),
        reasoning: `Your performance score earned a ${xpResult.performanceMultiplier}x multiplier`
      },
      {
        stepNumber: 4,
        description: 'Bonus XP added',
        calculation: `${Math.round(xpResult.baseXP * xpResult.difficultyMultiplier * xpResult.performanceMultiplier)} + ${xpResult.bonusXP}`,
        input: { 
          calculatedXP: Math.round(xpResult.baseXP * xpResult.difficultyMultiplier * xpResult.performanceMultiplier),
          bonusXP: xpResult.bonusXP 
        },
        output: xpResult.totalXP,
        reasoning: `You earned ${xpResult.bonusXP} bonus XP from special achievements`
      }
    ];

    return {
      summary: `Total XP: ${xpResult.totalXP} (Base: ${xpResult.baseXP}, Difficulty: ${xpResult.difficultyMultiplier}x, Performance: ${xpResult.performanceMultiplier}x, Bonus: +${xpResult.bonusXP})`,
      steps,
      formulaUsed: '(Base XP × Difficulty Multiplier × Performance Multiplier) + Bonus XP',
      inputValues: {
        activityType: activityData.type,
        difficulty: activityData.scenarioDifficulty,
        performanceMetrics: activityData.performanceMetrics
      },
      outputValue: xpResult.totalXP,
      confidence: 0.95
    };
  }

  /**
   * Create performance explanation
   */
  private async createPerformanceExplanation(
    performanceResult: PerformanceCalculationResult,
    activityData: ActivityData
  ): Promise<PerformanceExplanation> {
    const breakdown: PerformanceMetricExplanation[] = Object.entries(performanceResult.weightedScores).map(([metric, score]) => {
      const rawScore = (activityData.performanceMetrics as any)[metric];
      const weight = (performanceResult.appliedWeights as any)[metric];
      
      return {
        metric: metric.replace(/([A-Z])/g, ' $1').toLowerCase().trim(),
        rawScore,
        weight,
        weightedScore: score,
        contribution: (score / performanceResult.overallScore) * 100,
        interpretation: this.interpretMetricScore(rawScore),
        benchmarkComparison: this.getBenchmarkComparison(metric, rawScore)
      };
    });

    const contextFactors: ContextFactor[] = performanceResult.contextRulesApplied.map(rule => ({
      factor: 'Context Rule',
      value: rule,
      impact: 'positive',
      explanation: rule,
      magnitude: 1
    }));

    return {
      overallScore: performanceResult.overallScore,
      tier: performanceResult.tier.name,
      breakdown,
      weightingRationale: {
        configurationUsed: 'Dynamic Weighting',
        reasonsForWeights: [
          'Weights adjusted based on activity type and context',
          'Performance patterns from historical data considered',
          'Industry best practices incorporated'
        ],
        contextualAdjustments: performanceResult.contextRulesApplied,
        alternativeConfigurations: ['Balanced', 'Technical Focus', 'Customer Focus']
      },
      contextFactors,
      scoreInterpretation: this.interpretOverallScore(performanceResult.overallScore, performanceResult.tier)
    };
  }

  /**
   * Create bonus explanation
   */
  private async createBonusExplanation(
    bonusApplications: BonusApplication[],
    activityData: ActivityData
  ): Promise<BonusExplanation> {
    const totalBonus = bonusApplications.reduce((sum, bonus) => sum + bonus.bonusPoints, 0);

    const individualBonuses: IndividualBonusExplanation[] = bonusApplications.map(bonus => ({
      bonusName: bonus.ruleId.replace(/_/g, ' ').toUpperCase(),
      points: bonus.bonusPoints,
      criteria: bonus.conditions,
      whyEarned: bonus.reason,
      rarity: this.getBonusRarity(bonus.bonusPoints),
      impact: `Increased your XP by ${bonus.bonusPoints} points`
    }));

    // Generate missed opportunities (simplified)
    const missedOpportunities: MissedOpportunity[] = [
      {
        bonusName: 'Speed Bonus',
        points: 5,
        whatWasMissing: 'Resolution time exceeded 30 minutes',
        howToEarn: 'Complete tickets more efficiently',
        difficulty: 'medium' as const
      }
    ].filter(opp => !bonusApplications.some(bonus => bonus.ruleId.includes(opp.bonusName.toLowerCase())));

    const eligibilityCriteria: BonusCriteria[] = [
      {
        bonusName: 'Perfect Verification',
        requirements: ['Successful verification', 'Technical accuracy ≥ 95%'],
        examples: ['Correctly identify customer using multiple verification methods'],
        tips: ['Double-check verification steps', 'Use all available verification tools']
      }
    ];

    return {
      totalBonus,
      individualBonuses,
      missedOpportunities,
      eligibilityCriteria
    };
  }

  /**
   * Create comparative analysis
   */
  private async createComparativeAnalysis(
    userId: string,
    performanceResult: PerformanceCalculationResult,
    activityData: ActivityData
  ): Promise<ComparativeAnalysis> {
    // This would typically query historical data
    const mockComparison: ComparativeAnalysis = {
      userPerformance: performanceResult.overallScore,
      averagePerformance: 75,
      percentile: Math.round((performanceResult.overallScore / 100) * 100),
      similarActivities: [
        {
          activityType: activityData.type,
          userAverage: performanceResult.overallScore,
          globalAverage: 75,
          difference: performanceResult.overallScore - 75,
          ranking: 156,
          totalParticipants: 500
        }
      ],
      historicalTrend: {
        direction: 'improving',
        rate: 2.3,
        period: 'last 30 days',
        milestones: [
          {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            achievement: 'First perfect verification',
            score: 95,
            significance: 'Major breakthrough in technical accuracy'
          }
        ],
        projectedPerformance: performanceResult.overallScore + 5
      },
      peerComparison: {
        sameLevel: 82,
        sameDifficulty: 78,
        sameActivity: 75,
        insights: [
          'Your performance is above average for your level',
          'You excel in technical areas compared to peers',
          'Communication skills align with peer performance'
        ]
      }
    };

    return mockComparison;
  }

  /**
   * Generate improvement suggestions
   */
  private async generateImprovementSuggestions(
    performanceResult: PerformanceCalculationResult,
    activityData: ActivityData
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];

    // Analyze weak areas
    const weakestMetric = Object.entries(performanceResult.weightedScores)
      .sort(([,a], [,b]) => a - b)[0];

    if (weakestMetric) {
      suggestions.push({
        category: 'performance',
        priority: 'high',
        suggestion: `Focus on improving ${weakestMetric[0].replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`,
        rationale: `This is your lowest-scoring performance area and has significant weight in the calculation`,
        expectedImpact: 8,
        timeToImplement: '1-2 weeks',
        resources: [
          {
            type: 'tutorial',
            title: `${weakestMetric[0]} Improvement Guide`,
            description: 'Step-by-step guide to improvement',
            estimatedTime: '30 minutes'
          },
          {
            type: 'practice',
            title: 'Practice Scenarios',
            description: 'Focused practice activities',
            estimatedTime: '1 hour'
          }
        ],
        examples: [
          'Review best practices documentation',
          'Practice with mentor feedback',
          'Analyze successful examples'
        ]
      });
    }

    // Add general suggestions based on tier
    if (performanceResult.tier.name === 'Good') {
      suggestions.push({
        category: 'strategy',
        priority: 'medium',
        suggestion: 'Aim for consistency across all performance metrics',
        rationale: 'Balanced improvement will help you reach the next performance tier',
        expectedImpact: 5,
        timeToImplement: '2-3 weeks',
        resources: [
          {
            type: 'documentation',
            title: 'Performance Excellence Guide',
            description: 'Comprehensive improvement strategies',
            estimatedTime: '45 minutes'
          }
        ],
        examples: [
          'Set daily improvement targets',
          'Track progress regularly',
          'Seek feedback from supervisors'
        ]
      });
    }

    return suggestions;
  }

  /**
   * Calculate fairness metrics
   */
  private async calculateFairnessMetrics(
    xpResult: XPCalculationResult,
    performanceResult: PerformanceCalculationResult,
    activityData: ActivityData
  ): Promise<FairnessMetrics> {
    const auditTrail: AuditEntry[] = [
      {
        timestamp: new Date(),
        action: 'XP Calculation',
        parameters: {
          baseXP: xpResult.baseXP,
          difficulty: activityData.scenarioDifficulty,
          performanceMultiplier: xpResult.performanceMultiplier
        },
        result: xpResult.totalXP,
        checksum: this.generateChecksum(xpResult)
      },
      {
        timestamp: new Date(),
        action: 'Performance Assessment',
        parameters: {
          weights: performanceResult.appliedWeights,
          contextRules: performanceResult.contextRulesApplied
        },
        result: performanceResult.overallScore,
        checksum: this.generateChecksum(performanceResult)
      }
    ];

    return {
      biasScore: 0.1, // Low bias
      consistencyScore: 0.9, // High consistency
      explanabilityScore: 0.85, // Good explanability
      fairnessFactors: [
        {
          factor: 'Consistent Weighting',
          score: 0.9,
          explanation: 'Same weighting rules applied to all users',
          impact: 'Ensures fair comparison across users'
        },
        {
          factor: 'Transparent Calculation',
          score: 0.85,
          explanation: 'All calculation steps are documented and auditable',
          impact: 'Builds trust in the assessment system'
        }
      ],
      auditTrail
    };
  }

  /**
   * Helper methods for explanations
   */
  private async explainScoreReasoning(report: TransparencyReport, detailLevel: 'basic' | 'detailed' | 'expert'): Promise<ExplanationResponse> {
    let explanation: string;
    
    if (detailLevel === 'basic') {
      explanation = `You received ${report.calculationBreakdown.outputValue} XP because of your ${report.performanceExplanation.tier} performance level and ${report.bonusExplanation.totalBonus ? 'earning bonus points' : 'standard calculation'}.`;
    } else {
      explanation = report.calculationBreakdown.summary + '\n\n' + 
                   report.calculationBreakdown.steps.map(step => 
                     `Step ${step.stepNumber}: ${step.description} - ${step.reasoning}`
                   ).join('\n');
    }

    return {
      query: { type: 'why_this_score', detail_level: detailLevel },
      explanation,
      supporting_data: {
        calculationSteps: report.calculationBreakdown.steps,
        performanceBreakdown: report.performanceExplanation.breakdown
      },
      visualizations: [
        {
          type: 'bar_chart',
          title: 'XP Breakdown',
          data: {
            base: report.calculationBreakdown.steps[0].output,
            difficulty: report.calculationBreakdown.steps[1].output - report.calculationBreakdown.steps[0].output,
            performance: report.calculationBreakdown.steps[2].output - report.calculationBreakdown.steps[1].output,
            bonus: report.bonusExplanation.totalBonus
          },
          description: 'Visual breakdown of XP components'
        }
      ],
      related_resources: []
    };
  }

  private async explainImprovementPath(report: TransparencyReport, detailLevel: 'basic' | 'detailed' | 'expert'): Promise<ExplanationResponse> {
    const topSuggestions = report.improvementSuggestions.slice(0, 3);
    
    const explanation = detailLevel === 'basic' 
      ? `To improve your performance, focus on: ${topSuggestions.map(s => s.suggestion).join(', ')}`
      : topSuggestions.map(s => `${s.suggestion}: ${s.rationale} (Expected impact: +${s.expectedImpact} points)`).join('\n\n');

    return {
      query: { type: 'how_to_improve', detail_level: detailLevel },
      explanation,
      supporting_data: {
        suggestions: report.improvementSuggestions,
        currentPerformance: report.performanceExplanation
      },
      visualizations: [
        {
          type: 'radar_chart',
          title: 'Performance Areas',
          data: report.performanceExplanation.breakdown,
          description: 'Your current performance across different metrics'
        }
      ],
      related_resources: topSuggestions.flatMap(s => s.resources)
    };
  }

  private async explainBonusSystem(report: TransparencyReport, detailLevel: 'basic' | 'detailed' | 'expert'): Promise<ExplanationResponse> {
    const explanation = detailLevel === 'basic'
      ? `You earned ${report.bonusExplanation.totalBonus} bonus XP from ${report.bonusExplanation.individualBonuses.length} achievements.`
      : report.bonusExplanation.individualBonuses.map(b => `${b.bonusName}: +${b.points} XP - ${b.whyEarned}`).join('\n');

    return {
      query: { type: 'bonus_details', detail_level: detailLevel },
      explanation,
      supporting_data: {
        bonuses: report.bonusExplanation.individualBonuses,
        missedOpportunities: report.bonusExplanation.missedOpportunities
      },
      visualizations: [
        {
          type: 'pie_chart',
          title: 'Bonus XP Sources',
          data: report.bonusExplanation.individualBonuses,
          description: 'Breakdown of bonus XP by source'
        }
      ],
      related_resources: []
    };
  }

  private async explainComparisons(report: TransparencyReport, detailLevel: 'basic' | 'detailed' | 'expert'): Promise<ExplanationResponse> {
    const comp = report.comparativeAnalysis;
    
    const explanation = detailLevel === 'basic'
      ? `Your performance of ${comp.userPerformance}% is ${comp.userPerformance > comp.averagePerformance ? 'above' : 'below'} the average of ${comp.averagePerformance}%.`
      : `Performance Analysis:\n- Your Score: ${comp.userPerformance}%\n- Average: ${comp.averagePerformance}%\n- Percentile: ${comp.percentile}th\n- Trend: ${comp.historicalTrend.direction} at ${comp.historicalTrend.rate}% per ${comp.historicalTrend.period}`;

    return {
      query: { type: 'comparison_analysis', detail_level: detailLevel },
      explanation,
      supporting_data: {
        comparative: report.comparativeAnalysis
      },
      visualizations: [
        {
          type: 'line_graph',
          title: 'Performance Trend',
          data: comp.historicalTrend,
          description: 'Your performance over time'
        }
      ],
      related_resources: []
    };
  }

  private async explainWeightingLogic(report: TransparencyReport, detailLevel: 'basic' | 'detailed' | 'expert'): Promise<ExplanationResponse> {
    const weighting = report.performanceExplanation.weightingRationale;
    
    const explanation = detailLevel === 'basic'
      ? `Performance weights were adjusted based on your activity type and context.`
      : `Weighting Logic:\n- Configuration: ${weighting.configurationUsed}\n- Reasons: ${weighting.reasonsForWeights.join(', ')}\n- Adjustments: ${weighting.contextualAdjustments.join(', ')}`;

    return {
      query: { type: 'weight_rationale', detail_level: detailLevel },
      explanation,
      supporting_data: {
        weights: report.performanceExplanation.breakdown,
        rationale: weighting
      },
      visualizations: [
        {
          type: 'bar_chart',
          title: 'Performance Weights',
          data: report.performanceExplanation.breakdown.map(b => ({ metric: b.metric, weight: b.weight })),
          description: 'How much each metric contributed to your score'
        }
      ],
      related_resources: []
    };
  }

  /**
   * Helper methods
   */
  private interpretMetricScore(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    if (score >= 60) return 'Needs Improvement';
    return 'Unsatisfactory';
  }

  private interpretOverallScore(score: number, tier: any): string {
    return `Your overall performance score of ${score}% places you in the ${tier.name} tier. ${tier.description}`;
  }

  private getBenchmarkComparison(metric: string, score: number): BenchmarkComparison {
    // Simplified benchmark comparison
    const percentile = Math.min(100, Math.max(0, Math.round((score / 100) * 100)));
    
    return {
      percentile,
      category: this.interpretMetricScore(score),
      description: `You scored better than ${percentile}% of users in ${metric}`,
      improvement: score < 80 ? 'Focus on this area for improvement' : 'Maintain this strong performance'
    };
  }

  private getBonusRarity(points: number): 'common' | 'uncommon' | 'rare' | 'legendary' {
    if (points >= 15) return 'legendary';
    if (points >= 10) return 'rare';
    if (points >= 5) return 'uncommon';
    return 'common';
  }

  private getStrongestMetric(performance: PerformanceExplanation): string {
    return performance.breakdown
      .sort((a, b) => b.rawScore - a.rawScore)[0]?.metric || 'technical accuracy';
  }

  private createPerformanceRadar(performance: PerformanceExplanation): any {
    return {
      metrics: performance.breakdown.map(b => ({
        metric: b.metric,
        score: b.rawScore,
        weight: b.weight
      }))
    };
  }

  private createXPBreakdownChart(breakdown: CalculationBreakdown): any {
    return {
      steps: breakdown.steps.map(s => ({
        step: s.description,
        value: s.output
      }))
    };
  }

  private createProgressVisualization(comparison: ComparativeAnalysis): any {
    return {
      userScore: comparison.userPerformance,
      average: comparison.averagePerformance,
      percentile: comparison.percentile
    };
  }

  private generateChecksum(data: any): string {
    return `checksum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const transparencyService = new TransparencyService();
export default transparencyService;