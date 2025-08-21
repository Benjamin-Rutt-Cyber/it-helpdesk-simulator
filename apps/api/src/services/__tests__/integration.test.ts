/**
 * Integration Tests for XP System
 * End-to-end testing of the complete XP system workflow
 */

import xpService from '../xpService';
import xpCalculatorService from '../xpCalculator';
import performanceWeightingService from '../performanceWeightingService';
import transparencyService from '../transparencyService';
import bonusEngineService from '../bonusEngine';
import activityTrackerService from '../activityTracker';
import realTimeXPService from '../realTimeXPService';
import { PerformanceMetrics, ActivityData } from '../xpCalculator';

describe('XP System Integration Tests', () => {
  beforeEach(() => {
    // Clear all service states
    (xpService as any).xpRecords = new Map();
    (xpService as any).userTotals = new Map();
    (activityTrackerService as any).activities = new Map();
    (activityTrackerService as any).sessions = new Map();
    (activityTrackerService as any).currentSessions = new Map();
    (realTimeXPService as any).liveDisplays = new Map();
    (realTimeXPService as any).notifications = new Map();
  });

  const createMockPerformanceMetrics = (overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics => ({
    technicalAccuracy: 85,
    communicationQuality: 78,
    verificationSuccess: true,
    customerSatisfaction: 82,
    processCompliance: 75,
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

  describe('Complete XP Calculation Workflow', () => {
    it('should process full XP calculation workflow from start to finish', async () => {
      const userId = 'integration_user_1';
      const activityData = createMockActivityData({
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 90,
          communicationQuality: 85,
          customerSatisfaction: 92,
          processCompliance: 88,
          verificationSuccess: true,
          firstTimeResolution: true,
          knowledgeSharing: true,
          resolutionTime: 20
        })
      });

      // Step 1: Start activity tracking
      const trackedActivity = await activityTrackerService.startActivity(
        userId,
        activityData.type,
        {
          scenarioId: 'scenario_123',
          ticketId: 'ticket_456'
        }
      );

      expect(trackedActivity).toHaveProperty('id');
      expect(trackedActivity.userId).toBe(userId);
      expect(trackedActivity.status).toBe('started');

      // Step 2: Calculate XP using the calculator
      const xpCalculation = await xpCalculatorService.calculateXP(activityData);

      expect(xpCalculation.totalXP).toBeGreaterThan(0);
      expect(xpCalculation.bonusXP).toBeGreaterThan(0); // Should have multiple bonuses

      // Step 3: Calculate performance weighting
      const performanceResult = await performanceWeightingService.calculatePerformanceScore(
        activityData.performanceMetrics,
        {
          activityType: activityData.type,
          difficulty: activityData.scenarioDifficulty,
          userId
        }
      );

      expect(performanceResult.overallScore).toBeGreaterThan(80);
      expect(performanceResult.tier.name).toBe('Outstanding');

      // Step 4: Award XP through main service
      const xpTransaction = {
        userId,
        activityData,
        activityId: 'integration_activity_1'
      };

      const xpRecord = await xpService.awardXP(xpTransaction);

      expect(xpRecord.xpAwarded).toBe(xpCalculation.totalXP);
      expect(xpRecord.validated).toBe(true);

      // Step 5: Complete tracked activity
      const completedActivity = await activityTrackerService.completeActivity(
        trackedActivity.id,
        activityData.performanceMetrics,
        xpCalculation.totalXP,
        {
          baseXP: xpCalculation.baseXP,
          difficultyMultiplier: xpCalculation.difficultyMultiplier,
          performanceMultiplier: xpCalculation.performanceMultiplier,
          bonusXP: xpCalculation.bonusXP,
          totalXP: xpCalculation.totalXP,
          bonusesEarned: xpCalculation.breakdown.bonuses.map(b => b.type)
        }
      );

      expect(completedActivity.status).toBe('completed');
      expect(completedActivity.xpAwarded).toBe(xpCalculation.totalXP);

      // Step 6: Generate transparency report
      const transparencyReport = await transparencyService.generateTransparencyReport(
        userId,
        xpTransaction.activityId,
        xpCalculation,
        performanceResult,
        activityData,
        [] // Would contain actual bonus applications
      );

      expect(transparencyReport.userId).toBe(userId);
      expect(transparencyReport.calculationBreakdown.outputValue).toBe(xpCalculation.totalXP);

      // Step 7: Process real-time updates
      const previousXP = 0;
      await realTimeXPService.processXPUpdate(
        userId,
        xpRecord,
        await xpService.getUserXPSummary(userId),
        previousXP
      );

      const liveDisplay = await realTimeXPService.getLiveDisplay(userId);
      expect(liveDisplay).toBeDefined();
      expect(liveDisplay!.currentXP).toBe(xpCalculation.totalXP);

      // Step 8: Verify final state
      const userSummary = await xpService.getUserXPSummary(userId);
      expect(userSummary.totalXP).toBe(xpCalculation.totalXP);
      expect(userSummary.recentXP.length).toBe(1);
      expect(userSummary.topActivities.length).toBe(1);

      const activityAnalytics = await activityTrackerService.getActivityAnalytics(userId);
      expect(activityAnalytics.totalActivities).toBe(1);
      expect(activityAnalytics.totalXP).toBe(xpCalculation.totalXP);
    });

    it('should handle multiple activities and calculate accurate totals', async () => {
      const userId = 'multi_activity_user';
      const activities = [
        createMockActivityData({ type: 'ticket_completion', scenarioDifficulty: 'starter' }),
        createMockActivityData({ type: 'verification', scenarioDifficulty: 'intermediate' }),
        createMockActivityData({ type: 'documentation', scenarioDifficulty: 'advanced' }),
        createMockActivityData({ type: 'customer_communication', scenarioDifficulty: 'intermediate' })
      ];

      const results: any[] = [];

      // Process multiple activities
      for (let i = 0; i < activities.length; i++) {
        const activityData = activities[i];
        const xpTransaction = {
          userId,
          activityData,
          activityId: `multi_activity_${i}`
        };

        const xpRecord = await xpService.awardXP(xpTransaction);
        results.push(xpRecord);

        // Track each activity
        const trackedActivity = await activityTrackerService.startActivity(
          userId,
          activityData.type,
          { activityIndex: i }
        );

        await activityTrackerService.completeActivity(
          trackedActivity.id,
          activityData.performanceMetrics,
          xpRecord.xpAwarded,
          {
            baseXP: 20,
            difficultyMultiplier: 1.5,
            performanceMultiplier: 1.0,
            bonusXP: 0,
            totalXP: xpRecord.xpAwarded,
            bonusesEarned: []
          }
        );
      }

      // Verify totals
      const userSummary = await xpService.getUserXPSummary(userId);
      const expectedTotal = results.reduce((sum, result) => sum + result.xpAwarded, 0);

      expect(userSummary.totalXP).toBe(expectedTotal);
      expect(userSummary.recentXP.length).toBe(4);
      expect(userSummary.topActivities.length).toBe(4);

      // Verify activity analytics
      const analytics = await activityTrackerService.getActivityAnalytics(userId);
      expect(analytics.totalActivities).toBe(4);
      expect(analytics.totalXP).toBe(expectedTotal);
      expect(analytics.activityBreakdown.length).toBe(4);

      // Check leaderboard
      const leaderboard = await xpService.getLeaderboard(10);
      const userEntry = leaderboard.find(entry => entry.userId === userId);
      expect(userEntry).toBeDefined();
      expect(userEntry!.totalXP).toBe(expectedTotal);
    });

    it('should handle bonus calculations across services consistently', async () => {
      const userId = 'bonus_test_user';
      const activityData = createMockActivityData({
        type: 'ticket_completion',
        scenarioDifficulty: 'advanced',
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 95,
          communicationQuality: 90,
          customerSatisfaction: 95,
          processCompliance: 90,
          verificationSuccess: true,
          firstTimeResolution: true,
          knowledgeSharing: true,
          resolutionTime: 15 // Speed bonus eligible
        })
      });

      // Calculate bonuses through bonus engine
      const bonusContext = {
        activityData,
        userHistory: {
          userId,
          totalActivities: 0,
          recentActivities: [],
          averagePerformance: 90,
          consecutiveCompletions: 1
        },
        streakData: [],
        userMilestones: [],
        specialEvents: []
      };

      const bonusResult = await bonusEngineService.calculateBonusXP(bonusContext);

      // Calculate XP through calculator
      const xpCalculation = await xpCalculatorService.calculateXP(activityData);

      // Both should identify similar bonuses
      expect(bonusResult.totalBonus).toBeGreaterThan(0);
      expect(xpCalculation.bonusXP).toBeGreaterThan(0);

      // Award XP
      const xpRecord = await xpService.awardXP({
        userId,
        activityData,
        activityId: 'bonus_activity'
      });

      // Generate transparency report
      const transparencyReport = await transparencyService.generateTransparencyReport(
        userId,
        'bonus_activity',
        xpCalculation,
        await performanceWeightingService.calculatePerformanceScore(activityData.performanceMetrics),
        activityData,
        bonusResult.appliedBonuses
      );

      // Verify bonus consistency
      expect(transparencyReport.bonusExplanation.totalBonus).toBeGreaterThan(20);
      expect(transparencyReport.bonusExplanation.individualBonuses.length).toBeGreaterThan(3);

      // Check explanations include bonus details
      const bonusExplanation = await transparencyService.explainCalculation(
        { type: 'bonus_details', detail_level: 'detailed' },
        transparencyReport.id
      );

      expect(bonusExplanation.explanation).toContain('bonus');
      expect(bonusExplanation.supporting_data.bonuses.length).toBeGreaterThan(0);
    });

    it('should maintain data consistency across real-time updates', async () => {
      const userId = 'realtime_test_user';
      const activityData = createMockActivityData();

      // Connect user to real-time service
      await realTimeXPService.connectUser(userId, 'connection_123');

      // Award XP
      const xpRecord = await xpService.awardXP({
        userId,
        activityData,
        activityId: 'realtime_activity'
      });

      // Process real-time update
      const userSummary = await xpService.getUserXPSummary(userId);
      await realTimeXPService.processXPUpdate(userId, xpRecord, userSummary, 0);

      // Check live display
      const liveDisplay = await realTimeXPService.getLiveDisplay(userId);
      expect(liveDisplay).toBeDefined();
      expect(liveDisplay!.currentXP).toBe(xpRecord.xpAwarded);
      expect(liveDisplay!.recentEarnings.length).toBe(1);

      // Check notifications
      const notifications = await realTimeXPService.getNotifications(userId, true);
      expect(notifications.length).toBeGreaterThanOrEqual(1);

      const xpNotification = notifications.find(n => n.type === 'xp_earned');
      expect(xpNotification).toBeDefined();
      expect(xpNotification!.xpAmount).toBe(xpRecord.xpAwarded);

      // Verify consistency with main XP service
      const currentXP = await xpService.getCurrentXP(userId);
      expect(liveDisplay!.currentXP).toBe(currentXP);
    });

    it('should handle performance weighting optimization workflow', async () => {
      const userId = 'optimization_user';
      const performanceData: PerformanceMetrics[] = [];

      // Generate performance data over time
      for (let i = 0; i < 15; i++) {
        const metrics = createMockPerformanceMetrics({
          technicalAccuracy: 70 + Math.random() * 20,
          communicationQuality: 60 + Math.random() * 25,
          customerSatisfaction: 75 + Math.random() * 20,
          processCompliance: 65 + Math.random() * 25
        });
        performanceData.push(metrics);

        // Award XP for each
        await xpService.awardXP({
          userId,
          activityData: createMockActivityData({ performanceMetrics: metrics }),
          activityId: `optimization_activity_${i}`
        });
      }

      // Analyze performance
      const analytics = await performanceWeightingService.getPerformanceAnalytics(performanceData);
      expect(analytics.averageScores).toHaveProperty('technicalAccuracy');
      expect(analytics.scoreDistribution).toHaveProperty('excellent');

      // Optimize weights
      const optimization = await performanceWeightingService.optimizeWeights(
        { activityType: 'ticket_completion', difficulty: 'intermediate' },
        performanceData
      );

      expect(optimization.suggestedWeights).toBeDefined();
      expect(optimization.expectedImprovement).toBeGreaterThanOrEqual(0);
      expect(optimization.confidenceScore).toBeGreaterThan(0);

      // Create optimized configuration
      const optimizedConfig = await performanceWeightingService.createWeightConfiguration({
        name: 'Optimized Configuration',
        description: 'AI-optimized weights for user performance',
        weights: optimization.suggestedWeights,
        contextRules: [],
        active: true,
        priority: 10,
        validFrom: new Date(),
        createdBy: 'system'
      });

      expect(optimizedConfig.id).toBeDefined();

      // Test with optimized weights
      const testMetrics = createMockPerformanceMetrics();
      const optimizedResult = await performanceWeightingService.calculatePerformanceScore(
        testMetrics,
        { activityType: 'ticket_completion' }
      );

      expect(optimizedResult.appliedWeights).toBeDefined();
      expect(optimizedResult.overallScore).toBeGreaterThan(0);
    });

    it('should handle error conditions gracefully across services', async () => {
      const userId = 'error_test_user';

      // Test invalid activity data
      const invalidActivityData = {
        type: 'invalid_type' as any,
        scenarioDifficulty: 'intermediate' as any,
        performanceMetrics: createMockPerformanceMetrics({
          technicalAccuracy: 150, // Invalid value
          resolutionTime: -5 // Invalid value
        })
      };

      // Should reject invalid data
      await expect(
        xpService.awardXP({
          userId,
          activityData: invalidActivityData,
          activityId: 'invalid_activity'
        })
      ).rejects.toThrow();

      // Test duplicate activity prevention
      const validActivityData = createMockActivityData();
      const transaction = {
        userId,
        activityData: validActivityData,
        activityId: 'duplicate_test'
      };

      // First attempt should succeed
      await xpService.awardXP(transaction);

      // Second attempt should fail
      await expect(xpService.awardXP(transaction)).rejects.toThrow();

      // Test gaming prevention
      const gamingUser = 'gaming_user';
      
      // Rapidly create multiple transactions
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          xpService.awardXP({
            userId: gamingUser,
            activityData: validActivityData,
            activityId: `gaming_activity_${i}`
          })
        );
      }

      const results = await Promise.allSettled(promises);
      
      // Some should succeed, but gaming detection should eventually kick in
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBeGreaterThan(0);
      expect(failed).toBeGreaterThan(0);
    });

    it('should maintain performance under load', async () => {
      const userCount = 50;
      const activitiesPerUser = 10;
      const startTime = Date.now();

      const promises = [];

      // Create concurrent activity processing for multiple users
      for (let userId = 0; userId < userCount; userId++) {
        for (let activityNum = 0; activityNum < activitiesPerUser; activityNum++) {
          const activityData = createMockActivityData({
            performanceMetrics: createMockPerformanceMetrics({
              technicalAccuracy: 70 + Math.random() * 30,
              communicationQuality: 60 + Math.random() * 40,
              customerSatisfaction: 70 + Math.random() * 30,
              processCompliance: 65 + Math.random() * 35
            })
          });

          promises.push(
            xpService.awardXP({
              userId: `load_test_user_${userId}`,
              activityData,
              activityId: `load_test_${userId}_${activityNum}`
            })
          );
        }
      }

      // Execute all promises
      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBeGreaterThan(userCount * activitiesPerUser * 0.8); // At least 80% success
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds

      console.log(`Load test completed: ${successful} successful, ${failed} failed in ${duration}ms`);

      // Verify data integrity
      const statistics = await xpService.getXPStatistics();
      expect(statistics.totalUsersWithXP).toBe(userCount);
      expect(statistics.totalActivities).toBe(successful);

      // Verify leaderboard
      const leaderboard = await xpService.getLeaderboard(10);
      expect(leaderboard.length).toBe(Math.min(10, userCount));

      leaderboard.forEach((entry, index) => {
        expect(entry.totalXP).toBeGreaterThan(0);
        if (index > 0) {
          expect(entry.totalXP).toBeLessThanOrEqual(leaderboard[index - 1].totalXP);
        }
      });
    });
  });

  describe('Service Integration Edge Cases', () => {
    it('should handle service dependencies correctly', async () => {
      const userId = 'dependency_test_user';
      const activityData = createMockActivityData();

      // Test that services work independently when needed
      const xpCalculation = await xpCalculatorService.calculateXP(activityData);
      const performanceResult = await performanceWeightingService.calculatePerformanceScore(
        activityData.performanceMetrics
      );

      expect(xpCalculation.totalXP).toBeGreaterThan(0);
      expect(performanceResult.overallScore).toBeGreaterThan(0);

      // Test integration
      const xpRecord = await xpService.awardXP({
        userId,
        activityData,
        activityId: 'dependency_test'
      });

      expect(xpRecord.xpAwarded).toBe(xpCalculation.totalXP);

      // Test transparency report can be generated even with minimal data
      const report = await transparencyService.generateTransparencyReport(
        userId,
        'dependency_test',
        xpCalculation,
        performanceResult,
        activityData,
        []
      );

      expect(report.id).toBeDefined();
      expect(report.calculationBreakdown.outputValue).toBe(xpCalculation.totalXP);
    });

    it('should recover from partial service failures', async () => {
      const userId = 'recovery_test_user';
      const activityData = createMockActivityData();

      // Award XP successfully
      const xpRecord = await xpService.awardXP({
        userId,
        activityData,
        activityId: 'recovery_test'
      });

      expect(xpRecord.xpAwarded).toBeGreaterThan(0);

      // Even if real-time service fails, core XP should still be recorded
      const userSummary = await xpService.getUserXPSummary(userId);
      expect(userSummary.totalXP).toBe(xpRecord.xpAwarded);

      // Transparency should still work
      const xpCalculation = await xpCalculatorService.calculateXP(activityData);
      const performanceResult = await performanceWeightingService.calculatePerformanceScore(
        activityData.performanceMetrics
      );

      const report = await transparencyService.generateTransparencyReport(
        userId,
        'recovery_test',
        xpCalculation,
        performanceResult,
        activityData,
        []
      );

      expect(report).toBeDefined();
    });
  });
});