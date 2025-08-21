/**
 * Transparency Service Tests
 * Test suite for XP calculation transparency and explanation system
 */

import transparencyService, {
  TransparencyReport,
  ExplanationQuery,
  ExplanationResponse
} from '../transparencyService';
import { XPCalculationResult, ActivityData, PerformanceMetrics } from '../xpCalculator';
import { PerformanceCalculationResult } from '../performanceWeightingService';
import { BonusApplication } from '../bonusEngine';

describe('TransparencyService', () => {
  const createMockPerformanceMetrics = (): PerformanceMetrics => ({
    technicalAccuracy: 85,
    communicationQuality: 78,
    verificationSuccess: true,
    customerSatisfaction: 82,
    processCompliance: 75,
    resolutionTime: 28,
    firstTimeResolution: true,
    knowledgeSharing: false
  });

  const createMockActivityData = (): ActivityData => ({
    type: 'ticket_completion',
    scenarioDifficulty: 'intermediate',
    performanceMetrics: createMockPerformanceMetrics()
  });

  const createMockXPResult = (): XPCalculationResult => ({
    totalXP: 58,
    baseXP: 20,
    difficultyMultiplier: 1.5,
    performanceMultiplier: 1.25,
    bonusXP: 13,
    breakdown: {
      activity: { type: 'TICKET COMPLETION', basePoints: 20 },
      difficulty: { level: 'INTERMEDIATE', multiplier: 1.5, adjustedPoints: 30 },
      performance: { overall: 80, multiplier: 1.25, adjustedPoints: 38 },
      bonuses: [
        {
          type: 'First-Try Resolution',
          points: 8,
          reason: 'Resolved issue on first attempt',
          criteria: 'Issue resolved without requiring additional attempts'
        },
        {
          type: 'Speed Bonus',
          points: 5,
          reason: 'Completed efficiently within time expectations',
          criteria: 'Resolution time ≤ 30 minutes'
        }
      ],
      final: { totalXP: 58, reasoning: 'Base (20) × Difficulty (1.5x) × Performance (1.25x) + Bonuses (13) = 58 XP' }
    },
    explanations: [
      'You earned 20 base XP for completing a ticket completion activity.',
      'Your XP was increased by 1.5x due to intermediate difficulty level.',
      'Your performance score of 80% resulted in a 1.25x multiplier for good performance.',
      'You earned 13 bonus XP for: First-Try Resolution, Speed Bonus.',
      'Base (20) × Difficulty (1.5x) × Performance (1.25x) + Bonuses (13) = 58 XP'
    ]
  });

  const createMockPerformanceResult = (): PerformanceCalculationResult => ({
    overallScore: 80,
    weightedScores: {
      technicalAccuracy: 21.25, // 85 * 0.25
      communicationQuality: 19.5, // 78 * 0.25
      customerSatisfaction: 20.5, // 82 * 0.25
      processCompliance: 18.75 // 75 * 0.25
    },
    appliedWeights: {
      technicalAccuracy: 0.25,
      communicationQuality: 0.25,
      customerSatisfaction: 0.25,
      processCompliance: 0.25
    },
    contextRulesApplied: ['Balanced weighting for general activities'],
    breakdown: {
      baseScores: { technicalAccuracy: 85, communicationQuality: 78, customerSatisfaction: 82, processCompliance: 75 },
      weightedContributions: { technicalAccuracy: 21.25, communicationQuality: 19.5, customerSatisfaction: 20.5, processCompliance: 18.75 },
      adjustments: [],
      finalCalculation: 'Weighted average: 80%'
    },
    tier: {
      name: 'Good',
      minScore: 70,
      maxScore: 79,
      multiplier: 1.0,
      color: '#f59e0b',
      badge: '✓',
      description: 'Solid performance meeting expectations'
    },
    recommendations: [
      'Focus on improving process compliance to reach excellent tier',
      'Maintain strong technical accuracy performance'
    ]
  });

  const createMockBonusApplications = (): BonusApplication[] => [
    {
      ruleId: 'first_try_resolution',
      bonusPoints: 8,
      reason: 'First-Try Resolution: Resolved issue on first attempt without escalation',
      appliedAt: new Date(),
      conditions: ['Issue resolved without requiring additional attempts']
    },
    {
      ruleId: 'speed_bonus',
      bonusPoints: 5,
      reason: 'Speed Bonus: Completed ticket efficiently within time expectations',
      appliedAt: new Date(),
      conditions: ['Resolution time ≤ 30 minutes']
    }
  ];

  describe('generateTransparencyReport', () => {
    it('should generate comprehensive transparency report', async () => {
      const userId = 'user123';
      const activityId = 'activity456';
      const xpResult = createMockXPResult();
      const performanceResult = createMockPerformanceResult();
      const activityData = createMockActivityData();
      const bonusApplications = createMockBonusApplications();

      const report = await transparencyService.generateTransparencyReport(
        userId,
        activityId,
        xpResult,
        performanceResult,
        activityData,
        bonusApplications
      );

      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('userId', userId);
      expect(report).toHaveProperty('activityId', activityId);
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('calculationBreakdown');
      expect(report).toHaveProperty('performanceExplanation');
      expect(report).toHaveProperty('bonusExplanation');
      expect(report).toHaveProperty('comparativeAnalysis');
      expect(report).toHaveProperty('improvementSuggestions');
      expect(report).toHaveProperty('fairnessMetrics');

      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.id).toMatch(/^report_\d+_[a-z0-9]+$/);
    });

    it('should create detailed calculation breakdown', async () => {
      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        createMockPerformanceResult(),
        createMockActivityData(),
        createMockBonusApplications()
      );

      const breakdown = report.calculationBreakdown;

      expect(breakdown).toHaveProperty('summary');
      expect(breakdown).toHaveProperty('steps');
      expect(breakdown).toHaveProperty('formulaUsed');
      expect(breakdown).toHaveProperty('inputValues');
      expect(breakdown).toHaveProperty('outputValue', 58);
      expect(breakdown).toHaveProperty('confidence');

      expect(Array.isArray(breakdown.steps)).toBe(true);
      expect(breakdown.steps.length).toBe(4); // Base, Difficulty, Performance, Bonus
      expect(breakdown.formulaUsed).toBe('(Base XP × Difficulty Multiplier × Performance Multiplier) + Bonus XP');
      expect(breakdown.confidence).toBeGreaterThan(0.9);

      // Check step details
      breakdown.steps.forEach((step, index) => {
        expect(step).toHaveProperty('stepNumber', index + 1);
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('calculation');
        expect(step).toHaveProperty('input');
        expect(step).toHaveProperty('output');
        expect(step).toHaveProperty('reasoning');
      });
    });

    it('should create performance explanation', async () => {
      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        createMockPerformanceResult(),
        createMockActivityData(),
        createMockBonusApplications()
      );

      const performance = report.performanceExplanation;

      expect(performance).toHaveProperty('overallScore', 80);
      expect(performance).toHaveProperty('tier', 'Good');
      expect(performance).toHaveProperty('breakdown');
      expect(performance).toHaveProperty('weightingRationale');
      expect(performance).toHaveProperty('contextFactors');
      expect(performance).toHaveProperty('scoreInterpretation');

      expect(Array.isArray(performance.breakdown)).toBe(true);
      expect(performance.breakdown.length).toBe(4); // Four performance metrics

      performance.breakdown.forEach(metric => {
        expect(metric).toHaveProperty('metric');
        expect(metric).toHaveProperty('rawScore');
        expect(metric).toHaveProperty('weight');
        expect(metric).toHaveProperty('weightedScore');
        expect(metric).toHaveProperty('contribution');
        expect(metric).toHaveProperty('interpretation');
        expect(metric).toHaveProperty('benchmarkComparison');
      });
    });

    it('should create bonus explanation', async () => {
      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        createMockPerformanceResult(),
        createMockActivityData(),
        createMockBonusApplications()
      );

      const bonus = report.bonusExplanation;

      expect(bonus).toHaveProperty('totalBonus', 13);
      expect(bonus).toHaveProperty('individualBonuses');
      expect(bonus).toHaveProperty('missedOpportunities');
      expect(bonus).toHaveProperty('eligibilityCriteria');

      expect(Array.isArray(bonus.individualBonuses)).toBe(true);
      expect(bonus.individualBonuses.length).toBe(2);

      bonus.individualBonuses.forEach(bonusItem => {
        expect(bonusItem).toHaveProperty('bonusName');
        expect(bonusItem).toHaveProperty('points');
        expect(bonusItem).toHaveProperty('criteria');
        expect(bonusItem).toHaveProperty('whyEarned');
        expect(bonusItem).toHaveProperty('rarity');
        expect(bonusItem).toHaveProperty('impact');
      });
    });

    it('should generate improvement suggestions', async () => {
      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        createMockPerformanceResult(),
        createMockActivityData(),
        createMockBonusApplications()
      );

      expect(Array.isArray(report.improvementSuggestions)).toBe(true);
      expect(report.improvementSuggestions.length).toBeGreaterThan(0);

      report.improvementSuggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('suggestion');
        expect(suggestion).toHaveProperty('rationale');
        expect(suggestion).toHaveProperty('expectedImpact');
        expect(suggestion).toHaveProperty('timeToImplement');
        expect(suggestion).toHaveProperty('resources');
        expect(suggestion).toHaveProperty('examples');

        expect(['performance', 'technique', 'strategy', 'knowledge']).toContain(suggestion.category);
        expect(['high', 'medium', 'low']).toContain(suggestion.priority);
        expect(Array.isArray(suggestion.resources)).toBe(true);
        expect(Array.isArray(suggestion.examples)).toBe(true);
      });
    });

    it('should calculate fairness metrics', async () => {
      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        createMockPerformanceResult(),
        createMockActivityData(),
        createMockBonusApplications()
      );

      const fairness = report.fairnessMetrics;

      expect(fairness).toHaveProperty('biasScore');
      expect(fairness).toHaveProperty('consistencyScore');
      expect(fairness).toHaveProperty('explanabilityScore');
      expect(fairness).toHaveProperty('fairnessFactors');
      expect(fairness).toHaveProperty('auditTrail');

      expect(fairness.biasScore).toBeGreaterThanOrEqual(0);
      expect(fairness.biasScore).toBeLessThanOrEqual(1);
      expect(fairness.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(fairness.consistencyScore).toBeLessThanOrEqual(1);
      expect(fairness.explanabilityScore).toBeGreaterThanOrEqual(0);
      expect(fairness.explanabilityScore).toBeLessThanOrEqual(1);

      expect(Array.isArray(fairness.fairnessFactors)).toBe(true);
      expect(Array.isArray(fairness.auditTrail)).toBe(true);
      expect(fairness.auditTrail.length).toBeGreaterThan(0);
    });
  });

  describe('explainCalculation', () => {
    let reportId: string;

    beforeEach(async () => {
      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        createMockPerformanceResult(),
        createMockActivityData(),
        createMockBonusApplications()
      );
      reportId = report.id;
    });

    it('should explain score reasoning', async () => {
      const query: ExplanationQuery = {
        type: 'why_this_score',
        detail_level: 'detailed'
      };

      const response = await transparencyService.explainCalculation(query, reportId);

      expect(response).toHaveProperty('query');
      expect(response).toHaveProperty('explanation');
      expect(response).toHaveProperty('supporting_data');
      expect(response).toHaveProperty('visualizations');
      expect(response).toHaveProperty('related_resources');

      expect(response.query).toEqual(query);
      expect(typeof response.explanation).toBe('string');
      expect(response.explanation.length).toBeGreaterThan(0);
      expect(Array.isArray(response.visualizations)).toBe(true);
      expect(Array.isArray(response.related_resources)).toBe(true);
    });

    it('should provide basic vs detailed explanations', async () => {
      const basicQuery: ExplanationQuery = {
        type: 'why_this_score',
        detail_level: 'basic'
      };

      const detailedQuery: ExplanationQuery = {
        type: 'why_this_score',
        detail_level: 'detailed'
      };

      const basicResponse = await transparencyService.explainCalculation(basicQuery, reportId);
      const detailedResponse = await transparencyService.explainCalculation(detailedQuery, reportId);

      expect(basicResponse.explanation.length).toBeLessThan(detailedResponse.explanation.length);
      expect(detailedResponse.explanation).toContain('Step');
    });

    it('should explain improvement paths', async () => {
      const query: ExplanationQuery = {
        type: 'how_to_improve',
        detail_level: 'detailed'
      };

      const response = await transparencyService.explainCalculation(query, reportId);

      expect(response.explanation).toContain('improve');
      expect(response.supporting_data).toHaveProperty('suggestions');
      expect(response.visualizations.length).toBeGreaterThan(0);
      expect(response.visualizations[0].type).toBe('radar_chart');
    });

    it('should explain bonus details', async () => {
      const query: ExplanationQuery = {
        type: 'bonus_details',
        detail_level: 'detailed'
      };

      const response = await transparencyService.explainCalculation(query, reportId);

      expect(response.explanation).toContain('bonus');
      expect(response.supporting_data).toHaveProperty('bonuses');
      expect(response.supporting_data).toHaveProperty('missedOpportunities');
      expect(response.visualizations[0].type).toBe('pie_chart');
    });

    it('should explain comparison analysis', async () => {
      const query: ExplanationQuery = {
        type: 'comparison_analysis',
        detail_level: 'detailed'
      };

      const response = await transparencyService.explainCalculation(query, reportId);

      expect(response.explanation).toContain('performance');
      expect(response.explanation).toContain('average');
      expect(response.supporting_data).toHaveProperty('comparative');
      expect(response.visualizations[0].type).toBe('line_graph');
    });

    it('should explain weighting rationale', async () => {
      const query: ExplanationQuery = {
        type: 'weight_rationale',
        detail_level: 'detailed'
      };

      const response = await transparencyService.explainCalculation(query, reportId);

      expect(response.explanation).toContain('weight');
      expect(response.supporting_data).toHaveProperty('weights');
      expect(response.supporting_data).toHaveProperty('rationale');
      expect(response.visualizations[0].type).toBe('bar_chart');
    });

    it('should throw error for non-existent report', async () => {
      const query: ExplanationQuery = {
        type: 'why_this_score',
        detail_level: 'basic'
      };

      await expect(
        transparencyService.explainCalculation(query, 'nonexistent')
      ).rejects.toThrow('Report not found');
    });

    it('should throw error for unknown query type', async () => {
      const query: ExplanationQuery = {
        type: 'unknown_type' as any,
        detail_level: 'basic'
      };

      await expect(
        transparencyService.explainCalculation(query, reportId)
      ).rejects.toThrow('Unknown query type');
    });
  });

  describe('getSimpleExplanation', () => {
    let reportId: string;

    beforeEach(async () => {
      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        createMockPerformanceResult(),
        createMockActivityData(),
        createMockBonusApplications()
      );
      reportId = report.id;
    });

    it('should provide simple user-friendly explanation', async () => {
      const simple = await transparencyService.getSimpleExplanation(reportId);

      expect(simple).toHaveProperty('summary');
      expect(simple).toHaveProperty('keyPoints');
      expect(simple).toHaveProperty('nextSteps');
      expect(simple).toHaveProperty('visualSummary');

      expect(typeof simple.summary).toBe('string');
      expect(simple.summary).toContain('58 XP');
      expect(simple.summary).toContain('80%');
      expect(simple.summary).toContain('Good');

      expect(Array.isArray(simple.keyPoints)).toBe(true);
      expect(simple.keyPoints.length).toBe(3);

      expect(Array.isArray(simple.nextSteps)).toBe(true);
      expect(simple.nextSteps.length).toBeGreaterThan(0);

      expect(simple.visualSummary).toHaveProperty('performanceRadar');
      expect(simple.visualSummary).toHaveProperty('xpBreakdown');
      expect(simple.visualSummary).toHaveProperty('progressBar');
    });

    it('should throw error for non-existent report', async () => {
      await expect(
        transparencyService.getSimpleExplanation('nonexistent')
      ).rejects.toThrow('Report not found');
    });
  });

  describe('validateTransparency', () => {
    let reportId: string;

    beforeEach(async () => {
      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        createMockPerformanceResult(),
        createMockActivityData(),
        createMockBonusApplications()
      );
      reportId = report.id;
    });

    it('should validate transparency metrics', async () => {
      const validation = await transparencyService.validateTransparency(reportId);

      expect(validation).toHaveProperty('isTransparent');
      expect(validation).toHaveProperty('transparencyScore');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('recommendations');

      expect(typeof validation.isTransparent).toBe('boolean');
      expect(validation.transparencyScore).toBeGreaterThanOrEqual(0);
      expect(validation.transparencyScore).toBeLessThanOrEqual(1);
      expect(Array.isArray(validation.issues)).toBe(true);
      expect(Array.isArray(validation.recommendations)).toBe(true);
    });

    it('should identify transparency issues', async () => {
      // Create a report with limited explanation steps to trigger transparency issues
      const mockXPResult = createMockXPResult();
      mockXPResult.breakdown.bonuses = []; // Remove detailed breakdown
      
      const limitedReport = await transparencyService.generateTransparencyReport(
        'user456',
        'activity789',
        mockXPResult,
        createMockPerformanceResult(),
        createMockActivityData(),
        []
      );

      const validation = await transparencyService.validateTransparency(limitedReport.id);

      // Should still be generally transparent, but may have recommendations
      expect(validation.transparencyScore).toBeGreaterThan(0.5);
    });
  });

  describe('getCalculationAuditTrail', () => {
    let reportId: string;

    beforeEach(async () => {
      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        createMockPerformanceResult(),
        createMockActivityData(),
        createMockBonusApplications()
      );
      reportId = report.id;
    });

    it('should return audit trail', async () => {
      const auditTrail = await transparencyService.getCalculationAuditTrail(reportId);

      expect(Array.isArray(auditTrail)).toBe(true);
      expect(auditTrail.length).toBeGreaterThan(0);

      auditTrail.forEach(entry => {
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('action');
        expect(entry).toHaveProperty('parameters');
        expect(entry).toHaveProperty('result');
        expect(entry).toHaveProperty('checksum');

        expect(entry.timestamp).toBeInstanceOf(Date);
        expect(typeof entry.action).toBe('string');
        expect(typeof entry.parameters).toBe('object');
        expect(typeof entry.checksum).toBe('string');
      });
    });

    it('should throw error for non-existent report', async () => {
      await expect(
        transparencyService.getCalculationAuditTrail('nonexistent')
      ).rejects.toThrow('Report not found');
    });
  });

  describe('edge cases', () => {
    it('should handle zero XP calculations', async () => {
      const zeroXPResult: XPCalculationResult = {
        totalXP: 0,
        baseXP: 0,
        difficultyMultiplier: 1.0,
        performanceMultiplier: 0.5,
        bonusXP: 0,
        breakdown: {
          activity: { type: 'TEST', basePoints: 0 },
          difficulty: { level: 'STARTER', multiplier: 1.0, adjustedPoints: 0 },
          performance: { overall: 30, multiplier: 0.5, adjustedPoints: 0 },
          bonuses: [],
          final: { totalXP: 0, reasoning: 'No XP earned due to poor performance' }
        },
        explanations: ['No XP earned']
      };

      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        zeroXPResult,
        createMockPerformanceResult(),
        createMockActivityData(),
        []
      );

      expect(report.calculationBreakdown.outputValue).toBe(0);
      expect(report.bonusExplanation.totalBonus).toBe(0);
    });

    it('should handle maximum XP calculations', async () => {
      const maxXPResult: XPCalculationResult = {
        totalXP: 200,
        baseXP: 50,
        difficultyMultiplier: 2.0,
        performanceMultiplier: 1.5,
        bonusXP: 50,
        breakdown: {
          activity: { type: 'ADVANCED_TICKET', basePoints: 50 },
          difficulty: { level: 'ADVANCED', multiplier: 2.0, adjustedPoints: 100 },
          performance: { overall: 100, multiplier: 1.5, adjustedPoints: 150 },
          bonuses: Array.from({ length: 10 }, (_, i) => ({
            type: `Bonus ${i + 1}`,
            points: 5,
            reason: `Bonus reason ${i + 1}`,
            criteria: `Criteria ${i + 1}`
          })),
          final: { totalXP: 200, reasoning: 'Maximum XP calculation' }
        },
        explanations: ['Maximum XP earned']
      };

      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        maxXPResult,
        createMockPerformanceResult(),
        createMockActivityData(),
        Array.from({ length: 10 }, (_, i) => ({
          ruleId: `bonus_${i}`,
          bonusPoints: 5,
          reason: `Bonus ${i + 1}`,
          appliedAt: new Date(),
          conditions: [`Condition ${i + 1}`]
        }))
      );

      expect(report.calculationBreakdown.outputValue).toBe(200);
      expect(report.bonusExplanation.totalBonus).toBe(50);
      expect(report.bonusExplanation.individualBonuses.length).toBe(10);
    });

    it('should handle missing performance data gracefully', async () => {
      const incompletePerformanceResult: PerformanceCalculationResult = {
        overallScore: 0,
        weightedScores: {},
        appliedWeights: {
          technicalAccuracy: 0.25,
          communicationQuality: 0.25,
          customerSatisfaction: 0.25,
          processCompliance: 0.25
        },
        contextRulesApplied: [],
        breakdown: {
          baseScores: {},
          weightedContributions: {},
          adjustments: [],
          finalCalculation: 'No data available'
        },
        tier: {
          name: 'Unknown',
          minScore: 0,
          maxScore: 0,
          multiplier: 1.0,
          color: '#gray',
          badge: '?',
          description: 'Insufficient data'
        },
        recommendations: []
      };

      const report = await transparencyService.generateTransparencyReport(
        'user123',
        'activity456',
        createMockXPResult(),
        incompletePerformanceResult,
        createMockActivityData(),
        []
      );

      expect(report.performanceExplanation.overallScore).toBe(0);
      expect(report.performanceExplanation.tier).toBe('Unknown');
      expect(report.improvementSuggestions.length).toBeGreaterThan(0); // Should still provide suggestions
    });
  });
});