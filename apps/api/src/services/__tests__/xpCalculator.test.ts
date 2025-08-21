/**
 * XP Calculator Service Tests
 * Comprehensive test suite for XP calculation algorithms
 */

import xpCalculatorService, { 
  ActivityData, 
  PerformanceMetrics, 
  XPCalculationResult 
} from '../xpCalculator';

describe('XPCalculatorService', () => {
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

  const createMockActivityData = (overrides: Partial<ActivityData> = {}): ActivityData => ({
    type: 'ticket_completion',
    scenarioDifficulty: 'intermediate',
    performanceMetrics: createMockPerformanceMetrics(),
    ...overrides
  });

  describe('calculateXP', () => {
    it('should calculate XP correctly for basic ticket completion', async () => {
      const activityData = createMockActivityData();
      const result = await xpCalculatorService.calculateXP(activityData);

      expect(result).toHaveProperty('totalXP');
      expect(result).toHaveProperty('baseXP', 20); // ticket_completion base
      expect(result).toHaveProperty('difficultyMultiplier', 1.5); // intermediate
      expect(result).toHaveProperty('performanceMultiplier');
      expect(result).toHaveProperty('bonusXP');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('explanations');
    });

    it('should apply difficulty multipliers correctly', async () => {
      const starterData = createMockActivityData({ scenarioDifficulty: 'starter' });
      const intermediateData = createMockActivityData({ scenarioDifficulty: 'intermediate' });
      const advancedData = createMockActivityData({ scenarioDifficulty: 'advanced' });

      const starterResult = await xpCalculatorService.calculateXP(starterData);
      const intermediateResult = await xpCalculatorService.calculateXP(intermediateData);
      const advancedResult = await xpCalculatorService.calculateXP(advancedData);

      expect(starterResult.difficultyMultiplier).toBe(1.0);
      expect(intermediateResult.difficultyMultiplier).toBe(1.5);
      expect(advancedResult.difficultyMultiplier).toBe(2.0);

      // Advanced should give more XP than intermediate, which should give more than starter
      expect(advancedResult.totalXP).toBeGreaterThan(intermediateResult.totalXP);
      expect(intermediateResult.totalXP).toBeGreaterThan(starterResult.totalXP);
    });

    it('should calculate performance multipliers based on overall score', async () => {
      const poorPerformance = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 30,
          communicationQuality: 35,
          customerSatisfaction: 40,
          processCompliance: 25
        })
      });

      const excellentPerformance = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 95,
          communicationQuality: 90,
          customerSatisfaction: 98,
          processCompliance: 92
        })
      });

      const poorResult = await xpCalculatorService.calculateXP(poorPerformance);
      const excellentResult = await xpCalculatorService.calculateXP(excellentPerformance);

      expect(poorResult.performanceMultiplier).toBe(0.5); // poor performance
      expect(excellentResult.performanceMultiplier).toBe(1.5); // excellent performance
      expect(excellentResult.totalXP).toBeGreaterThan(poorResult.totalXP);
    });

    it('should award bonus XP for perfect verification', async () => {
      const perfectVerificationData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          verificationSuccess: true,
          technicalAccuracy: 95
        })
      });

      const result = await xpCalculatorService.calculateXP(perfectVerificationData);

      expect(result.bonusXP).toBeGreaterThanOrEqual(10); // perfect_verification bonus
      expect(result.breakdown.bonuses).toContainEqual(
        expect.objectContaining({
          type: 'Perfect Verification',
          points: 10
        })
      );
    });

    it('should award outstanding customer service bonus', async () => {
      const outstandingServiceData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          customerSatisfaction: 95,
          communicationQuality: 90
        })
      });

      const result = await xpCalculatorService.calculateXP(outstandingServiceData);

      expect(result.bonusXP).toBeGreaterThanOrEqual(15); // outstanding_customer_service bonus
      expect(result.breakdown.bonuses).toContainEqual(
        expect.objectContaining({
          type: 'Outstanding Customer Service',
          points: 15
        })
      );
    });

    it('should award technical excellence bonus', async () => {
      const technicalExcellenceData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 92,
          processCompliance: 88
        })
      });

      const result = await xpCalculatorService.calculateXP(technicalExcellenceData);

      expect(result.bonusXP).toBeGreaterThanOrEqual(12); // technical_excellence bonus
      expect(result.breakdown.bonuses).toContainEqual(
        expect.objectContaining({
          type: 'Technical Excellence',
          points: 12
        })
      );
    });

    it('should award first-try resolution bonus', async () => {
      const firstTryData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          firstTimeResolution: true
        })
      });

      const result = await xpCalculatorService.calculateXP(firstTryData);

      expect(result.bonusXP).toBeGreaterThanOrEqual(8); // first_try_resolution bonus
      expect(result.breakdown.bonuses).toContainEqual(
        expect.objectContaining({
          type: 'First-Try Resolution',
          points: 8
        })
      );
    });

    it('should award knowledge sharing bonus', async () => {
      const knowledgeSharingData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          knowledgeSharing: true
        })
      });

      const result = await xpCalculatorService.calculateXP(knowledgeSharingData);

      expect(result.bonusXP).toBeGreaterThanOrEqual(5); // knowledge_sharing bonus
      expect(result.breakdown.bonuses).toContainEqual(
        expect.objectContaining({
          type: 'Knowledge Sharing',
          points: 5
        })
      );
    });

    it('should award speed bonus for quick resolution', async () => {
      const quickResolutionData = createMockActivityData({
        type: 'ticket_completion',
        performanceMetrics: createMockPerformanceMetrics({
          resolutionTime: 20 // under 30 minutes
        })
      });

      const result = await xpCalculatorService.calculateXP(quickResolutionData);

      expect(result.bonusXP).toBeGreaterThanOrEqual(5); // speed bonus
      expect(result.breakdown.bonuses).toContainEqual(
        expect.objectContaining({
          type: 'Speed Bonus',
          points: 5
        })
      );
    });

    it('should award innovation bonus', async () => {
      const innovativeData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 88,
          customerSatisfaction: 90
        }),
        additionalContext: {
          innovativeApproach: true
        }
      });

      const result = await xpCalculatorService.calculateXP(innovativeData);

      expect(result.bonusXP).toBeGreaterThanOrEqual(8); // innovation bonus
      expect(result.breakdown.bonuses).toContainEqual(
        expect.objectContaining({
          type: 'Innovation Bonus',
          points: 8
        })
      );
    });

    it('should calculate correct total XP with multiple bonuses', async () => {
      const multipleBonus = createMockActivityData({
        type: 'ticket_completion',
        scenarioDifficulty: 'advanced',
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 95,
          communicationQuality: 92,
          customerSatisfaction: 95,
          processCompliance: 90,
          verificationSuccess: true,
          firstTimeResolution: true,
          knowledgeSharing: true,
          resolutionTime: 25
        })
      });

      const result = await xpCalculatorService.calculateXP(multipleBonus);

      // Base: 20, Difficulty: 2.0x, Performance: ~1.5x
      const expectedBaseCalculation = Math.round(20 * 2.0 * 1.5); // 60
      
      // Multiple bonuses: perfect_verification(10) + outstanding_customer_service(15) + 
      // technical_excellence(12) + first_try_resolution(8) + knowledge_sharing(5) + speed_bonus(5)
      const expectedMinimumBonus = 10 + 15 + 12 + 8 + 5 + 5; // 55

      expect(result.totalXP).toBeGreaterThanOrEqual(expectedBaseCalculation + expectedMinimumBonus);
      expect(result.bonusXP).toBeGreaterThanOrEqual(expectedMinimumBonus);
    });

    it('should generate detailed breakdown', async () => {
      const activityData = createMockActivityData();
      const result = await xpCalculatorService.calculateXP(activityData);

      expect(result.breakdown).toHaveProperty('activity');
      expect(result.breakdown).toHaveProperty('difficulty');
      expect(result.breakdown).toHaveProperty('performance');
      expect(result.breakdown).toHaveProperty('bonuses');
      expect(result.breakdown).toHaveProperty('final');

      expect(result.breakdown.activity).toHaveProperty('type');
      expect(result.breakdown.activity).toHaveProperty('basePoints');
      expect(result.breakdown.difficulty).toHaveProperty('level');
      expect(result.breakdown.difficulty).toHaveProperty('multiplier');
      expect(result.breakdown.performance).toHaveProperty('overall');
      expect(result.breakdown.performance).toHaveProperty('multiplier');
      expect(result.breakdown.final).toHaveProperty('totalXP');
      expect(result.breakdown.final).toHaveProperty('reasoning');
    });

    it('should generate explanations array', async () => {
      const activityData = createMockActivityData();
      const result = await xpCalculatorService.calculateXP(activityData);

      expect(Array.isArray(result.explanations)).toBe(true);
      expect(result.explanations.length).toBeGreaterThan(0);
      expect(result.explanations[0]).toContain('base XP');
    });
  });

  describe('validateActivityData', () => {
    it('should validate correct activity data', async () => {
      const validData = createMockActivityData();
      const result = await xpCalculatorService.validateActivityData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid activity type', async () => {
      const invalidData = createMockActivityData({
        type: 'invalid_type' as any
      });

      const result = await xpCalculatorService.validateActivityData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid activity type: invalid_type');
    });

    it('should reject invalid difficulty', async () => {
      const invalidData = createMockActivityData({
        scenarioDifficulty: 'invalid_difficulty' as any
      });

      const result = await xpCalculatorService.validateActivityData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid scenario difficulty: invalid_difficulty');
    });

    it('should reject invalid performance metrics', async () => {
      const invalidData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 150, // Invalid: > 100
          communicationQuality: -10, // Invalid: < 0
          resolutionTime: -5 // Invalid: negative
        })
      });

      const result = await xpCalculatorService.validateActivityData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Technical accuracy must be between 0 and 100');
      expect(result.errors).toContain('Communication quality must be between 0 and 100');
      expect(result.errors).toContain('Resolution time cannot be negative');
    });
  });

  describe('getXPRanges', () => {
    it('should return XP ranges for all activity types', async () => {
      const ranges = await xpCalculatorService.getXPRanges();

      expect(ranges).toHaveProperty('ticket_completion');
      expect(ranges).toHaveProperty('verification');
      expect(ranges).toHaveProperty('documentation');

      Object.values(ranges).forEach(range => {
        expect(range).toHaveProperty('min');
        expect(range).toHaveProperty('max');
        expect(range).toHaveProperty('typical');
        expect(range.max).toBeGreaterThan(range.min);
        expect(range.typical).toBeGreaterThanOrEqual(range.min);
        expect(range.typical).toBeLessThanOrEqual(range.max);
      });
    });
  });

  describe('calculateMaxPossibleXP', () => {
    it('should calculate maximum possible XP correctly', async () => {
      const maxXP = await xpCalculatorService.calculateMaxPossibleXP('ticket_completion', 'advanced');

      // Should be base (20) * difficulty (2.0) * performance (1.5) + all bonuses
      expect(maxXP).toBeGreaterThan(60); // Minimum calculation
      expect(maxXP).toBeGreaterThan(100); // With all bonuses
    });

    it('should vary by activity type and difficulty', async () => {
      const ticketAdvanced = await xpCalculatorService.calculateMaxPossibleXP('ticket_completion', 'advanced');
      const ticketStarter = await xpCalculatorService.calculateMaxPossibleXP('ticket_completion', 'starter');
      const verificationAdvanced = await xpCalculatorService.calculateMaxPossibleXP('verification', 'advanced');

      expect(ticketAdvanced).toBeGreaterThan(ticketStarter);
      expect(ticketAdvanced).toBeGreaterThan(verificationAdvanced);
    });
  });

  describe('getPerformanceTier', () => {
    it('should return correct performance tiers', () => {
      expect(xpCalculatorService.getPerformanceTier(95)).toBe('excellent');
      expect(xpCalculatorService.getPerformanceTier(75)).toBe('good');
      expect(xpCalculatorService.getPerformanceTier(65)).toBe('acceptable');
      expect(xpCalculatorService.getPerformanceTier(35)).toBe('poor');
    });
  });

  describe('different activity types', () => {
    it('should handle verification activities', async () => {
      const verificationData = createMockActivityData({
        type: 'verification'
      });

      const result = await xpCalculatorService.calculateXP(verificationData);

      expect(result.baseXP).toBe(8); // verification base XP
      expect(result.breakdown.activity.type).toBe('VERIFICATION');
    });

    it('should handle documentation activities', async () => {
      const documentationData = createMockActivityData({
        type: 'documentation'
      });

      const result = await xpCalculatorService.calculateXP(documentationData);

      expect(result.baseXP).toBe(5); // documentation base XP
      expect(result.breakdown.activity.type).toBe('DOCUMENTATION');
    });

    it('should handle customer communication activities', async () => {
      const communicationData = createMockActivityData({
        type: 'customer_communication'
      });

      const result = await xpCalculatorService.calculateXP(communicationData);

      expect(result.baseXP).toBe(3); // customer_communication base XP
      expect(result.breakdown.activity.type).toBe('CUSTOMER COMMUNICATION');
    });

    it('should handle learning progress activities', async () => {
      const learningData = createMockActivityData({
        type: 'learning_progress'
      });

      const result = await xpCalculatorService.calculateXP(learningData);

      expect(result.baseXP).toBe(10); // learning_progress base XP
      expect(result.breakdown.activity.type).toBe('LEARNING PROGRESS');
    });

    it('should handle knowledge search activities', async () => {
      const searchData = createMockActivityData({
        type: 'knowledge_search'
      });

      const result = await xpCalculatorService.calculateXP(searchData);

      expect(result.baseXP).toBe(2); // knowledge_search base XP
      expect(result.breakdown.activity.type).toBe('KNOWLEDGE SEARCH');
    });
  });

  describe('edge cases', () => {
    it('should handle minimum performance values', async () => {
      const minPerformanceData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 0,
          communicationQuality: 0,
          customerSatisfaction: 0,
          processCompliance: 0,
          verificationSuccess: false,
          firstTimeResolution: false,
          knowledgeSharing: false,
          resolutionTime: 0
        })
      });

      const result = await xpCalculatorService.calculateXP(minPerformanceData);

      expect(result.totalXP).toBeGreaterThan(0); // Should still get some XP
      expect(result.performanceMultiplier).toBe(0.5); // Poor performance
      expect(result.bonusXP).toBe(0); // No bonuses
    });

    it('should handle maximum performance values', async () => {
      const maxPerformanceData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 100,
          communicationQuality: 100,
          customerSatisfaction: 100,
          processCompliance: 100,
          verificationSuccess: true,
          firstTimeResolution: true,
          knowledgeSharing: true,
          resolutionTime: 10
        })
      });

      const result = await xpCalculatorService.calculateXP(maxPerformanceData);

      expect(result.performanceMultiplier).toBe(1.5); // Excellent performance
      expect(result.bonusXP).toBeGreaterThan(0); // Should have bonuses
    });

    it('should round XP values to integers', async () => {
      const activityData = createMockActivityData();
      const result = await xpCalculatorService.calculateXP(activityData);

      expect(result.totalXP % 1).toBe(0); // Should be integer
      expect(Number.isInteger(result.totalXP)).toBe(true);
    });
  });
});