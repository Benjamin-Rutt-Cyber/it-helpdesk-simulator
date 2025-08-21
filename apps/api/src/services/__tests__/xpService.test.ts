/**
 * XP Service Tests
 * Test suite for main XP orchestration and management service
 */

import xpService, { XPTransaction, XPRecord } from '../xpService';
import xpCalculatorService from '../xpCalculator';
import { PerformanceMetrics, ActivityData } from '../xpCalculator';

// Mock the calculator service
jest.mock('../xpCalculator');
const mockXpCalculatorService = xpCalculatorService as jest.Mocked<typeof xpCalculatorService>;

describe('XPService', () => {
  beforeEach(() => {
    // Clear service state between tests
    (xpService as any).xpRecords = new Map();
    (xpService as any).userTotals = new Map();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  const createMockPerformanceMetrics = (): PerformanceMetrics => ({
    technicalAccuracy: 80,
    communicationQuality: 75,
    verificationSuccess: true,
    customerSatisfaction: 85,
    processCompliance: 70,
    resolutionTime: 25,
    firstTimeResolution: true,
    knowledgeSharing: false
  });

  const createMockActivityData = (): ActivityData => ({
    type: 'ticket_completion',
    scenarioDifficulty: 'intermediate',
    performanceMetrics: createMockPerformanceMetrics()
  });

  const createMockTransaction = (overrides: Partial<XPTransaction> = {}): XPTransaction => ({
    userId: 'user123',
    activityData: createMockActivityData(),
    activityId: 'activity456',
    context: {},
    ...overrides
  });

  describe('awardXP', () => {
    beforeEach(() => {
      mockXpCalculatorService.validateActivityData.mockResolvedValue({
        valid: true,
        errors: []
      });

      mockXpCalculatorService.calculateXP.mockResolvedValue({
        totalXP: 45,
        baseXP: 20,
        difficultyMultiplier: 1.5,
        performanceMultiplier: 1.25,
        bonusXP: 8,
        breakdown: {
          activity: { type: 'TICKET COMPLETION', basePoints: 20 },
          difficulty: { level: 'INTERMEDIATE', multiplier: 1.5, adjustedPoints: 30 },
          performance: { overall: 78, multiplier: 1.25, adjustedPoints: 37 },
          bonuses: [
            {
              type: 'First-Try Resolution',
              points: 8,
              reason: 'Resolved issue on first attempt',
              criteria: 'Issue resolved without requiring additional attempts'
            }
          ],
          final: { totalXP: 45, reasoning: 'Base (20) × Difficulty (1.5x) × Performance (1.25x) + Bonuses (8) = 45 XP' }
        },
        explanations: ['You earned 20 base XP for completing a ticket completion activity.']
      });
    });

    it('should award XP successfully', async () => {
      const transaction = createMockTransaction();
      const result = await xpService.awardXP(transaction);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId', 'user123');
      expect(result).toHaveProperty('activityId', 'activity456');
      expect(result).toHaveProperty('xpAwarded', 45);
      expect(result).toHaveProperty('validated', true);
      expect(result.timestamp).toBeInstanceOf(Date);

      expect(mockXpCalculatorService.validateActivityData).toHaveBeenCalledWith(transaction.activityData);
      expect(mockXpCalculatorService.calculateXP).toHaveBeenCalledWith(transaction.activityData);
    });

    it('should update user totals correctly', async () => {
      const transaction = createMockTransaction();
      await xpService.awardXP(transaction);

      const userXP = await xpService.getCurrentXP('user123');
      expect(userXP).toBe(45);
    });

    it('should accumulate XP across multiple activities', async () => {
      const transaction1 = createMockTransaction({ activityId: 'activity1' });
      const transaction2 = createMockTransaction({ activityId: 'activity2' });

      await xpService.awardXP(transaction1);
      await xpService.awardXP(transaction2);

      const userXP = await xpService.getCurrentXP('user123');
      expect(userXP).toBe(90); // 45 + 45
    });

    it('should throw error for invalid activity data', async () => {
      mockXpCalculatorService.validateActivityData.mockResolvedValue({
        valid: false,
        errors: ['Invalid activity type']
      });

      const transaction = createMockTransaction();

      await expect(xpService.awardXP(transaction)).rejects.toThrow('Invalid activity data: Invalid activity type');
    });

    it('should generate unique XP record IDs', async () => {
      const transaction1 = createMockTransaction({ activityId: 'activity1' });
      const transaction2 = createMockTransaction({ activityId: 'activity2' });

      const result1 = await xpService.awardXP(transaction1);
      const result2 = await xpService.awardXP(transaction2);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toMatch(/^xp_\d+_[a-z0-9]+$/);
      expect(result2.id).toMatch(/^xp_\d+_[a-z0-9]+$/);
    });
  });

  describe('getCurrentXP', () => {
    it('should return 0 for users with no XP', async () => {
      const userXP = await xpService.getCurrentXP('nonexistent');
      expect(userXP).toBe(0);
    });

    it('should return correct XP for users with records', async () => {
      const transaction = createMockTransaction();
      await xpService.awardXP(transaction);

      const userXP = await xpService.getCurrentXP('user123');
      expect(userXP).toBe(45);
    });
  });

  describe('getUserXPSummary', () => {
    beforeEach(async () => {
      // Award some XP to test with
      const transaction = createMockTransaction();
      await xpService.awardXP(transaction);
    });

    it('should return comprehensive user summary', async () => {
      const summary = await xpService.getUserXPSummary('user123');

      expect(summary).toHaveProperty('userId', 'user123');
      expect(summary).toHaveProperty('totalXP', 45);
      expect(summary).toHaveProperty('lifetimeXP', 45);
      expect(summary).toHaveProperty('currentLevel', 0); // 45 XP = level 0
      expect(summary).toHaveProperty('xpToNextLevel', 955); // 1000 - 45
      expect(summary).toHaveProperty('recentXP');
      expect(summary).toHaveProperty('topActivities');
      expect(summary).toHaveProperty('performanceTrends');
      expect(summary).toHaveProperty('achievements');

      expect(Array.isArray(summary.recentXP)).toBe(true);
      expect(Array.isArray(summary.topActivities)).toBe(true);
      expect(Array.isArray(summary.performanceTrends)).toBe(true);
      expect(Array.isArray(summary.achievements)).toBe(true);
    });

    it('should calculate levels correctly', async () => {
      // Mock user with 1500 XP (level 1)
      (xpService as any).userTotals.set('user456', 1500);

      const summary = await xpService.getUserXPSummary('user456');

      expect(summary.currentLevel).toBe(1);
      expect(summary.xpToNextLevel).toBe(500); // 2000 - 1500
    });

    it('should limit recent XP to 10 records', async () => {
      // Award multiple XP records
      for (let i = 0; i < 15; i++) {
        const transaction = createMockTransaction({ 
          activityId: `activity${i}`,
          userId: 'user789'
        });
        await xpService.awardXP(transaction);
      }

      const summary = await xpService.getUserXPSummary('user789');
      expect(summary.recentXP).toHaveLength(10);
    });
  });

  describe('getXPBreakdown', () => {
    it('should return breakdown for existing record', async () => {
      const transaction = createMockTransaction();
      const record = await xpService.awardXP(transaction);

      const breakdown = await xpService.getXPBreakdown(record.id);

      expect(breakdown).toBeDefined();
      expect(breakdown).toHaveProperty('activity');
      expect(breakdown).toHaveProperty('difficulty');
      expect(breakdown).toHaveProperty('performance');
      expect(breakdown).toHaveProperty('bonuses');
      expect(breakdown).toHaveProperty('final');
    });

    it('should return null for non-existent record', async () => {
      const breakdown = await xpService.getXPBreakdown('nonexistent');
      expect(breakdown).toBeNull();
    });
  });

  describe('getXPHistory', () => {
    beforeEach(async () => {
      // Create multiple XP records with different timestamps
      for (let i = 0; i < 5; i++) {
        const transaction = createMockTransaction({ 
          activityId: `activity${i}`
        });
        await xpService.awardXP(transaction);
        
        // Add small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    it('should return history in reverse chronological order', async () => {
      const history = await xpService.getXPHistory('user123');

      expect(history).toHaveLength(5);
      
      // Should be sorted by timestamp descending
      for (let i = 1; i < history.length; i++) {
        expect(history[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          history[i].timestamp.getTime()
        );
      }
    });

    it('should respect limit parameter', async () => {
      const history = await xpService.getXPHistory('user123', 3);
      expect(history).toHaveLength(3);
    });

    it('should respect offset parameter', async () => {
      const fullHistory = await xpService.getXPHistory('user123');
      const offsetHistory = await xpService.getXPHistory('user123', 2, 2);

      expect(offsetHistory).toHaveLength(2);
      expect(offsetHistory[0].id).toBe(fullHistory[2].id);
      expect(offsetHistory[1].id).toBe(fullHistory[3].id);
    });

    it('should return empty array for users with no history', async () => {
      const history = await xpService.getXPHistory('nonexistent');
      expect(history).toHaveLength(0);
    });
  });

  describe('calculatePotentialXP', () => {
    it('should delegate to calculator service', async () => {
      const activityData = createMockActivityData();
      
      await xpService.calculatePotentialXP(activityData);

      expect(mockXpCalculatorService.calculateXP).toHaveBeenCalledWith(activityData);
    });
  });

  describe('getLeaderboard', () => {
    beforeEach(async () => {
      // Create users with different XP amounts
      const users = [
        { userId: 'user1', xp: 1500 },
        { userId: 'user2', xp: 2500 },
        { userId: 'user3', xp: 800 },
        { userId: 'user4', xp: 3200 },
        { userId: 'user5', xp: 1200 }
      ];

      for (const user of users) {
        (xpService as any).userTotals.set(user.userId, user.xp);
      }
    });

    it('should return leaderboard sorted by XP descending', async () => {
      const leaderboard = await xpService.getLeaderboard();

      expect(leaderboard).toHaveLength(5);
      expect(leaderboard[0]).toEqual({ userId: 'user4', totalXP: 3200, level: 3 });
      expect(leaderboard[1]).toEqual({ userId: 'user2', totalXP: 2500, level: 2 });
      expect(leaderboard[2]).toEqual({ userId: 'user1', totalXP: 1500, level: 1 });
      expect(leaderboard[3]).toEqual({ userId: 'user5', totalXP: 1200, level: 1 });
      expect(leaderboard[4]).toEqual({ userId: 'user3', totalXP: 800, level: 0 });
    });

    it('should respect limit parameter', async () => {
      const leaderboard = await xpService.getLeaderboard(3);
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].userId).toBe('user4');
      expect(leaderboard[1].userId).toBe('user2');
      expect(leaderboard[2].userId).toBe('user1');
    });

    it('should return empty array when no users', async () => {
      (xpService as any).userTotals.clear();
      const leaderboard = await xpService.getLeaderboard();
      expect(leaderboard).toHaveLength(0);
    });
  });

  describe('getXPStatistics', () => {
    beforeEach(async () => {
      // Create diverse activity records
      const activities = [
        { userId: 'user1', type: 'ticket_completion' },
        { userId: 'user1', type: 'verification' },
        { userId: 'user2', type: 'ticket_completion' },
        { userId: 'user2', type: 'ticket_completion' },
        { userId: 'user3', type: 'documentation' }
      ];

      for (let i = 0; i < activities.length; i++) {
        const transaction = createMockTransaction({
          userId: activities[i].userId,
          activityId: `activity${i}`,
          activityData: {
            ...createMockActivityData(),
            type: activities[i].type as any
          }
        });
        await xpService.awardXP(transaction);
      }
    });

    it('should return comprehensive statistics', async () => {
      const stats = await xpService.getXPStatistics();

      expect(stats).toHaveProperty('totalUsersWithXP', 3);
      expect(stats).toHaveProperty('totalXPAwarded', 225); // 5 activities × 45 XP
      expect(stats).toHaveProperty('averageXPPerUser', 75); // 225 / 3
      expect(stats).toHaveProperty('topActivity', 'ticket_completion'); // 3 occurrences
      expect(stats).toHaveProperty('totalActivities', 5);
    });

    it('should handle empty data', async () => {
      (xpService as any).xpRecords.clear();
      (xpService as any).userTotals.clear();

      const stats = await xpService.getXPStatistics();

      expect(stats.totalUsersWithXP).toBe(0);
      expect(stats.totalXPAwarded).toBe(0);
      expect(stats.averageXPPerUser).toBe(0);
      expect(stats.topActivity).toBe('none');
      expect(stats.totalActivities).toBe(0);
    });
  });

  describe('validateXPTransaction', () => {
    it('should validate correct transaction', async () => {
      const transaction = createMockTransaction();
      const result = await xpService.validateXPTransaction(transaction);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate activity', async () => {
      const transaction = createMockTransaction();
      
      // Award XP first time
      await xpService.awardXP(transaction);
      
      // Try to award again with same activity ID
      const result = await xpService.validateXPTransaction(transaction);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('XP already awarded for activity: activity456');
    });

    it('should detect suspicious gaming patterns', async () => {
      const userId = 'gamer123';
      
      // Create multiple recent transactions
      for (let i = 0; i < 6; i++) {
        const transaction = createMockTransaction({
          userId,
          activityId: `activity${i}`
        });
        await xpService.awardXP(transaction);
      }

      // Try to add another within the same minute
      const suspiciousTransaction = createMockTransaction({
        userId,
        activityId: 'suspicious_activity'
      });

      const result = await xpService.validateXPTransaction(suspiciousTransaction);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Too many XP transactions in short period - possible gaming attempt');
    });

    it('should validate activity data', async () => {
      mockXpCalculatorService.validateActivityData.mockResolvedValue({
        valid: false,
        errors: ['Invalid activity type']
      });

      const transaction = createMockTransaction();
      const result = await xpService.validateXPTransaction(transaction);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid activity type');
    });
  });

  describe('recalculateUserXP', () => {
    beforeEach(async () => {
      // Award some XP first
      const transaction1 = createMockTransaction({ activityId: 'activity1' });
      const transaction2 = createMockTransaction({ activityId: 'activity2' });

      await xpService.awardXP(transaction1);
      await xpService.awardXP(transaction2);
    });

    it('should recalculate user XP correctly', async () => {
      // Mock different calculation result for recalculation
      mockXpCalculatorService.calculateXP.mockResolvedValue({
        totalXP: 60, // Different from original 45
        baseXP: 20,
        difficultyMultiplier: 1.5,
        performanceMultiplier: 1.5,
        bonusXP: 15,
        breakdown: {} as any,
        explanations: []
      });

      const result = await xpService.recalculateUserXP('user123');

      expect(result.totalXP).toBe(120); // 2 activities × 60 XP each
    });

    it('should handle users with no XP records', async () => {
      const result = await xpService.recalculateUserXP('nonexistent');

      expect(result.totalXP).toBe(0);
      expect(result.recentXP).toHaveLength(0);
    });
  });

  describe('getUserActivityInsights', () => {
    it('should provide insights for new users', async () => {
      const insights = await xpService.getUserActivityInsights('newuser');

      expect(insights.strengthAreas).toHaveLength(0);
      expect(insights.improvementAreas).toHaveLength(0);
      expect(insights.recommendations).toContain('Complete your first activity to start earning XP!');
      expect(insights.nextMilestones).toContain('Earn your first 100 XP');
    });

    it('should analyze performance patterns for experienced users', async () => {
      // Create user with multiple activities
      for (let i = 0; i < 12; i++) {
        const transaction = createMockTransaction({
          userId: 'experienced',
          activityId: `activity${i}`,
          activityData: {
            ...createMockActivityData(),
            performanceMetrics: {
              ...createMockPerformanceMetrics(),
              technicalAccuracy: 90, // High technical accuracy
              communicationQuality: 60 // Low communication
            }
          }
        });
        await xpService.awardXP(transaction);
      }

      const insights = await xpService.getUserActivityI

nsights('experienced');

      expect(insights.strengthAreas).toContain('Technical Accuracy');
      expect(insights.improvementAreas).toContain('Communication Quality');
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide appropriate milestones based on XP', async () => {
      // Set user to have 150 XP
      (xpService as any).userTotals.set('milestone_user', 150);

      const insights = await xpService.getUserActivityInsights('milestone_user');

      expect(insights.nextMilestones).toContain('Reach 500 XP milestone');
    });
  });

  describe('activity summaries calculation', () => {
    beforeEach(async () => {
      // Create diverse activity mix
      const activities = [
        { type: 'ticket_completion', count: 3 },
        { type: 'verification', count: 2 },
        { type: 'documentation', count: 1 }
      ];

      for (const activityGroup of activities) {
        for (let i = 0; i < activityGroup.count; i++) {
          const transaction = createMockTransaction({
            activityId: `${activityGroup.type}_${i}`,
            activityData: {
              ...createMockActivityData(),
              type: activityGroup.type as any
            }
          });
          await xpService.awardXP(transaction);
        }
      }
    });

    it('should calculate activity summaries correctly', async () => {
      const summary = await xpService.getUserXPSummary('user123');

      expect(summary.topActivities).toHaveLength(3);
      
      // Should be sorted by total XP (ticket_completion should be first with 3 activities)
      expect(summary.topActivities[0].activityType).toBe('ticket_completion');
      expect(summary.topActivities[0].count).toBe(3);
      expect(summary.topActivities[0].totalXP).toBe(135); // 3 × 45

      expect(summary.topActivities[1].activityType).toBe('verification');
      expect(summary.topActivities[1].count).toBe(2);
      expect(summary.topActivities[1].totalXP).toBe(90); // 2 × 45
    });

    it('should calculate trends correctly', async () => {
      const summary = await xpService.getUserXPSummary('user123');

      expect(summary.topActivities[0]).toHaveProperty('trend');
      expect(['increasing', 'decreasing', 'stable']).toContain(summary.topActivities[0].trend);
    });
  });
});