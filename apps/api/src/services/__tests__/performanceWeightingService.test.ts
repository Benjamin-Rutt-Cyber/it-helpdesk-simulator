/**
 * Performance Weighting Service Tests
 * Test suite for dynamic performance weighting system
 */

import performanceWeightingService, {
  PerformanceWeights,
  WeightConfiguration,
  PerformanceCalculationResult
} from '../performanceWeightingService';
import { PerformanceMetrics } from '../xpCalculator';

describe('PerformanceWeightingService', () => {
  const createMockPerformanceMetrics = (overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics => ({
    technicalAccuracy: 80,
    communicationQuality: 75,
    verificationSuccess: true,
    customerSatisfaction: 85,
    processCompliance: 70,
    resolutionTime: 25,
    firstTimeResolution: true,
    knowledgeSharing: false,
    ...overrides
  });

  describe('calculatePerformanceScore', () => {
    it('should calculate performance score with default weights', async () => {
      const metrics = createMockPerformanceMetrics();
      const result = await performanceWeightingService.calculatePerformanceScore(metrics);

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('weightedScores');
      expect(result).toHaveProperty('appliedWeights');
      expect(result).toHaveProperty('contextRulesApplied');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('recommendations');

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.contextRulesApplied)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should apply technical-focused weighting for advanced scenarios', async () => {
      const metrics = createMockPerformanceMetrics({
        technicalAccuracy: 90,
        processCompliance: 85
      });

      const result = await performanceWeightingService.calculatePerformanceScore(
        metrics,
        { activityType: 'ticket_completion', difficulty: 'advanced' }
      );

      // Should apply technical excellence focused weights
      expect(result.appliedWeights.technicalAccuracy).toBeGreaterThan(0.3);
      expect(result.tier.name).toBe('Outstanding');
    });

    it('should apply customer-focused weighting for communication activities', async () => {
      const metrics = createMockPerformanceMetrics({
        communicationQuality: 90,
        customerSatisfaction: 95
      });

      const result = await performanceWeightingService.calculatePerformanceScore(
        metrics,
        { activityType: 'customer_communication' }
      );

      // Should emphasize communication metrics
      expect(result.appliedWeights.communicationQuality).toBeGreaterThan(0.25);
      expect(result.appliedWeights.customerSatisfaction).toBeGreaterThan(0.25);
    });

    it('should normalize weights to sum to 1.0', async () => {
      const metrics = createMockPerformanceMetrics();
      const result = await performanceWeightingService.calculatePerformanceScore(metrics);

      const weightSum = Object.values(result.appliedWeights).reduce((sum, weight) => sum + weight, 0);
      expect(Math.abs(weightSum - 1.0)).toBeLessThan(0.01);
    });

    it('should assign correct performance tiers', async () => {
      const excellentMetrics = createMockPerformanceMetrics({
        technicalAccuracy: 95,
        communicationQuality: 92,
        customerSatisfaction: 95,
        processCompliance: 90
      });

      const poorMetrics = createMockPerformanceMetrics({
        technicalAccuracy: 40,
        communicationQuality: 35,
        customerSatisfaction: 45,
        processCompliance: 30
      });

      const excellentResult = await performanceWeightingService.calculatePerformanceScore(excellentMetrics);
      const poorResult = await performanceWeightingService.calculatePerformanceScore(poorMetrics);

      expect(excellentResult.tier.name).toBe('Outstanding');
      expect(excellentResult.tier.multiplier).toBe(1.5);
      expect(poorResult.tier.name).toBe('Unsatisfactory');
      expect(poorResult.tier.multiplier).toBe(0.5);
    });

    it('should apply performance adjustments based on context', async () => {
      const metrics = createMockPerformanceMetrics({
        technicalAccuracy: 90
      });

      const result = await performanceWeightingService.calculatePerformanceScore(
        metrics,
        { 
          difficulty: 'advanced',
          userExperience: 'expert',
          timeOfDay: new Date().getHours()
        }
      );

      expect(result.breakdown.adjustments.length).toBeGreaterThan(0);
      
      // Should include expert bonus if applicable
      const expertBonus = result.breakdown.adjustments.find(adj => adj.type === 'experience_bonus');
      if (expertBonus) {
        expect(expertBonus.applied).toBe(true);
        expect(expertBonus.value).toBeGreaterThan(0);
      }
    });

    it('should generate contextual recommendations', async () => {
      const weakCommMetrics = createMockPerformanceMetrics({
        technicalAccuracy: 85,
        communicationQuality: 60, // Weak area
        customerSatisfaction: 65,
        processCompliance: 80
      });

      const result = await performanceWeightingService.calculatePerformanceScore(weakCommMetrics);

      expect(result.recommendations.length).toBeGreaterThan(0);
      const hasCommRecommendation = result.recommendations.some(rec => 
        rec.toLowerCase().includes('communication')
      );
      expect(hasCommRecommendation).toBe(true);
    });
  });

  describe('optimizeWeights', () => {
    it('should suggest weight optimizations based on performance data', async () => {
      const performanceData = Array.from({ length: 10 }, () => 
        createMockPerformanceMetrics({
          technicalAccuracy: Math.random() * 40 + 60, // 60-100
          communicationQuality: Math.random() * 30 + 50, // 50-80
          customerSatisfaction: Math.random() * 25 + 75, // 75-100
          processCompliance: Math.random() * 20 + 70 // 70-90
        })
      );

      const optimization = await performanceWeightingService.optimizeWeights(
        { activityType: 'ticket_completion', difficulty: 'intermediate' },
        performanceData
      );

      expect(optimization).toHaveProperty('currentWeights');
      expect(optimization).toHaveProperty('suggestedWeights');
      expect(optimization).toHaveProperty('reasoning');
      expect(optimization).toHaveProperty('expectedImprovement');
      expect(optimization).toHaveProperty('confidenceScore');
      expect(optimization).toHaveProperty('testScenarios');

      expect(Array.isArray(optimization.reasoning)).toBe(true);
      expect(Array.isArray(optimization.testScenarios)).toBe(true);
      expect(optimization.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(optimization.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('should normalize suggested weights', async () => {
      const performanceData = [createMockPerformanceMetrics()];
      const optimization = await performanceWeightingService.optimizeWeights({}, performanceData);

      const weightSum = Object.values(optimization.suggestedWeights).reduce((sum, weight) => sum + weight, 0);
      expect(Math.abs(weightSum - 1.0)).toBeLessThan(0.01);
    });

    it('should provide test scenarios showing improvement', async () => {
      const performanceData = Array.from({ length: 5 }, () => createMockPerformanceMetrics());
      const optimization = await performanceWeightingService.optimizeWeights({}, performanceData);

      expect(optimization.testScenarios.length).toBeGreaterThan(0);
      optimization.testScenarios.forEach(scenario => {
        expect(scenario).toHaveProperty('description');
        expect(scenario).toHaveProperty('currentScore');
        expect(scenario).toHaveProperty('optimizedScore');
        expect(scenario).toHaveProperty('improvement');
      });
    });
  });

  describe('createWeightConfiguration', () => {
    it('should create valid weight configuration', async () => {
      const configData = {
        name: 'Test Configuration',
        description: 'Test configuration for unit tests',
        weights: {
          technicalAccuracy: 0.4,
          communicationQuality: 0.2,
          customerSatisfaction: 0.2,
          processCompliance: 0.2
        } as PerformanceWeights,
        contextRules: [],
        active: true,
        priority: 5,
        validFrom: new Date(),
        createdBy: 'test'
      };

      const config = await performanceWeightingService.createWeightConfiguration(configData);

      expect(config).toHaveProperty('id');
      expect(config.name).toBe('Test Configuration');
      expect(config.weights).toEqual(configData.weights);
      expect(config.active).toBe(true);
    });

    it('should validate weight configuration during creation', async () => {
      const invalidConfigData = {
        name: 'Invalid Configuration',
        description: 'Invalid configuration',
        weights: {
          technicalAccuracy: 0.6,
          communicationQuality: 0.3,
          customerSatisfaction: 0.2,
          processCompliance: 0.1
        } as PerformanceWeights, // Sum > 1.0
        contextRules: [],
        active: true,
        priority: 5,
        validFrom: new Date(),
        createdBy: 'test'
      };

      await expect(
        performanceWeightingService.createWeightConfiguration(invalidConfigData)
      ).rejects.toThrow('Weight configuration weights must sum to 1.0');
    });
  });

  describe('updateWeightConfiguration', () => {
    let testConfigId: string;

    beforeEach(async () => {
      const config = await performanceWeightingService.createWeightConfiguration({
        name: 'Test Config',
        description: 'Test',
        weights: {
          technicalAccuracy: 0.25,
          communicationQuality: 0.25,
          customerSatisfaction: 0.25,
          processCompliance: 0.25
        } as PerformanceWeights,
        contextRules: [],
        active: true,
        priority: 1,
        validFrom: new Date(),
        createdBy: 'test'
      });
      testConfigId = config.id;
    });

    it('should update weight configuration successfully', async () => {
      const updates = {
        name: 'Updated Test Config',
        weights: {
          technicalAccuracy: 0.3,
          communicationQuality: 0.3,
          customerSatisfaction: 0.2,
          processCompliance: 0.2
        } as PerformanceWeights
      };

      const updatedConfig = await performanceWeightingService.updateWeightConfiguration(testConfigId, updates);

      expect(updatedConfig).not.toBeNull();
      expect(updatedConfig!.name).toBe('Updated Test Config');
      expect(updatedConfig!.weights.technicalAccuracy).toBe(0.3);
    });

    it('should return null for non-existent configuration', async () => {
      const result = await performanceWeightingService.updateWeightConfiguration('nonexistent', { name: 'Test' });
      expect(result).toBeNull();
    });

    it('should validate updates', async () => {
      const invalidUpdates = {
        weights: {
          technicalAccuracy: 0.8,
          communicationQuality: 0.3,
          customerSatisfaction: 0.2,
          processCompliance: 0.2
        } as PerformanceWeights // Sum > 1.0
      };

      await expect(
        performanceWeightingService.updateWeightConfiguration(testConfigId, invalidUpdates)
      ).rejects.toThrow('Weight configuration weights must sum to 1.0');
    });
  });

  describe('getPerformanceAnalytics', () => {
    it('should analyze performance data patterns', async () => {
      const performanceData = Array.from({ length: 20 }, (_, i) => 
        createMockPerformanceMetrics({
          technicalAccuracy: 70 + (i * 2), // Increasing trend
          communicationQuality: 80 - (i * 1), // Decreasing trend
          customerSatisfaction: 75 + Math.random() * 10,
          processCompliance: 70 + Math.random() * 15
        })
      );

      const analytics = await performanceWeightingService.getPerformanceAnalytics(performanceData);

      expect(analytics).toHaveProperty('averageScores');
      expect(analytics).toHaveProperty('scoreDistribution');
      expect(analytics).toHaveProperty('correlationMatrix');
      expect(analytics).toHaveProperty('trends');
      expect(analytics).toHaveProperty('outliers');

      expect(analytics.averageScores).toHaveProperty('technicalAccuracy');
      expect(analytics.averageScores).toHaveProperty('communicationQuality');
      expect(analytics.averageScores).toHaveProperty('customerSatisfaction');
      expect(analytics.averageScores).toHaveProperty('processCompliance');

      expect(Array.isArray(analytics.trends)).toBe(true);
    });

    it('should handle empty performance data', async () => {
      const analytics = await performanceWeightingService.getPerformanceAnalytics([]);

      expect(analytics.averageScores).toEqual({});
      expect(analytics.scoreDistribution).toEqual({});
      expect(analytics.correlationMatrix).toEqual({});
      expect(analytics.trends).toEqual([]);
      expect(analytics.outliers).toEqual([]);
    });
  });

  describe('validatePerformanceMetrics', () => {
    it('should validate correct performance metrics', async () => {
      const metrics = createMockPerformanceMetrics();
      const weights: PerformanceWeights = {
        technicalAccuracy: 0.25,
        communicationQuality: 0.25,
        customerSatisfaction: 0.25,
        processCompliance: 0.25
      };

      const result = await performanceWeightingService.validatePerformanceMetrics(metrics, weights);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect out-of-range metric values', async () => {
      const invalidMetrics = createMockPerformanceMetrics({
        technicalAccuracy: 150, // > 100
        communicationQuality: -10 // < 0
      });

      const weights: PerformanceWeights = {
        technicalAccuracy: 0.25,
        communicationQuality: 0.25,
        customerSatisfaction: 0.25,
        processCompliance: 0.25
      };

      const result = await performanceWeightingService.validatePerformanceMetrics(invalidMetrics, weights);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('technicalAccuracy value 150 is outside valid range (0-100)');
      expect(result.warnings).toContain('communicationQuality value -10 is outside valid range (0-100)');
    });

    it('should detect unbalanced weights', async () => {
      const metrics = createMockPerformanceMetrics();
      const unbalancedWeights: PerformanceWeights = {
        technicalAccuracy: 0.6,
        communicationQuality: 0.3,
        customerSatisfaction: 0.2,
        processCompliance: 0.1
      }; // Sum = 1.2

      const result = await performanceWeightingService.validatePerformanceMetrics(metrics, unbalancedWeights);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('Weights sum to 1.200, should sum to 1.0');
    });
  });

  describe('getWeightConfigurations', () => {
    it('should return only active configurations', async () => {
      // Create active configuration
      await performanceWeightingService.createWeightConfiguration({
        name: 'Active Config',
        description: 'Active',
        weights: {
          technicalAccuracy: 0.25,
          communicationQuality: 0.25,
          customerSatisfaction: 0.25,
          processCompliance: 0.25
        } as PerformanceWeights,
        contextRules: [],
        active: true,
        priority: 1,
        validFrom: new Date(),
        createdBy: 'test'
      });

      // Create inactive configuration
      await performanceWeightingService.createWeightConfiguration({
        name: 'Inactive Config',
        description: 'Inactive',
        weights: {
          technicalAccuracy: 0.25,
          communicationQuality: 0.25,
          customerSatisfaction: 0.25,
          processCompliance: 0.25
        } as PerformanceWeights,
        contextRules: [],
        active: false,
        priority: 1,
        validFrom: new Date(),
        createdBy: 'test'
      });

      const configs = await performanceWeightingService.getWeightConfigurations();

      expect(configs.length).toBeGreaterThan(0);
      configs.forEach(config => {
        expect(config.active).toBe(true);
      });

      const hasActiveConfig = configs.some(config => config.name === 'Active Config');
      const hasInactiveConfig = configs.some(config => config.name === 'Inactive Config');
      
      expect(hasActiveConfig).toBe(true);
      expect(hasInactiveConfig).toBe(false);
    });
  });

  describe('performance tier system', () => {
    it('should assign correct tiers based on score ranges', async () => {
      const testCases = [
        { score: 95, expectedTier: 'Outstanding' },
        { score: 85, expectedTier: 'Excellent' },
        { score: 75, expectedTier: 'Good' },
        { score: 65, expectedTier: 'Needs Improvement' },
        { score: 45, expectedTier: 'Unsatisfactory' }
      ];

      for (const testCase of testCases) {
        const metrics = createMockPerformanceMetrics({
          technicalAccuracy: testCase.score,
          communicationQuality: testCase.score,
          customerSatisfaction: testCase.score,
          processCompliance: testCase.score
        });

        const result = await performanceWeightingService.calculatePerformanceScore(metrics);
        expect(result.tier.name).toBe(testCase.expectedTier);
      }
    });

    it('should provide appropriate multipliers for each tier', async () => {
      const outstandingMetrics = createMockPerformanceMetrics({
        technicalAccuracy: 95,
        communicationQuality: 95,
        customerSatisfaction: 95,
        processCompliance: 95
      });

      const result = await performanceWeightingService.calculatePerformanceScore(outstandingMetrics);

      expect(result.tier.name).toBe('Outstanding');
      expect(result.tier.multiplier).toBe(1.5);
      expect(result.tier.color).toBe('#10b981');
      expect(result.tier.badge).toBe('🌟');
    });
  });

  describe('context rule evaluation', () => {
    it('should apply context rules based on activity type', async () => {
      const metrics = createMockPerformanceMetrics();
      
      // Test customer communication context
      const result = await performanceWeightingService.calculatePerformanceScore(
        metrics,
        { activityType: 'customer_communication' }
      );

      // Should apply customer-focused weights
      expect(result.contextRulesApplied.length).toBeGreaterThan(0);
    });

    it('should apply difficulty-based adjustments', async () => {
      const metrics = createMockPerformanceMetrics({
        technicalAccuracy: 88,
        processCompliance: 85
      });

      const result = await performanceWeightingService.calculatePerformanceScore(
        metrics,
        { difficulty: 'advanced' }
      );

      // Should apply advanced scenario adjustments
      expect(result.breakdown.adjustments.some(adj => adj.type === 'difficulty_modifier')).toBe(true);
    });
  });
});