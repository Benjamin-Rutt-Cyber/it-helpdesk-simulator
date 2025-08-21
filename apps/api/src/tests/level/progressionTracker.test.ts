import { ProgressionTracker } from '../../services/progressionTracker';

describe('ProgressionTracker', () => {
  const mockHistoricalData = [
    {
      date: new Date('2024-01-01'),
      level: 1,
      totalXP: 20,
      xpGained: 20,
      activities: {
        ticketResolution: 15,
        skillDemonstration: 3,
        qualityBonus: 2,
        milestoneBonus: 0,
        otherActivities: 0
      }
    },
    {
      date: new Date('2024-01-02'),
      level: 1,
      totalXP: 45,
      xpGained: 25,
      activities: {
        ticketResolution: 20,
        skillDemonstration: 3,
        qualityBonus: 2,
        milestoneBonus: 0,
        otherActivities: 0
      }
    },
    {
      date: new Date('2024-01-03'),
      level: 1,
      totalXP: 70,
      xpGained: 25,
      activities: {
        ticketResolution: 18,
        skillDemonstration: 4,
        qualityBonus: 3,
        milestoneBonus: 0,
        otherActivities: 0
      }
    }
  ];

  describe('calculateProgressionMetrics', () => {
    it('should calculate basic progression metrics', async () => {
      const metrics = await ProgressionTracker.calculateProgressionMetrics(
        'user123',
        250,
        mockHistoricalData
      );

      expect(metrics.totalXP).toBe(250);
      expect(metrics.levelInfo.currentLevel).toBe(3);
      expect(metrics.levelInfo.levelCategory).toBe('Support Technician');
      expect(metrics.progressionRate).toBeDefined();
    });

    it('should calculate recent XP gains correctly', async () => {
      const recentData = [
        {
          date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          level: 3,
          totalXP: 280,
          xpGained: 30,
          activities: {
            ticketResolution: 25,
            skillDemonstration: 3,
            qualityBonus: 2,
            milestoneBonus: 0,
            otherActivities: 0
          }
        }
      ];

      const metrics = await ProgressionTracker.calculateProgressionMetrics(
        'user123',
        310,
        recentData
      );

      expect(metrics.xpGainedToday).toBe(30);
    });

    it('should project next level date correctly', async () => {
      const consistentData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        level: 3,
        totalXP: 250 + i * 10,
        xpGained: 10,
        activities: {
          ticketResolution: 8,
          skillDemonstration: 1,
          qualityBonus: 1,
          milestoneBonus: 0,
          otherActivities: 0
        }
      }));

      const metrics = await ProgressionTracker.calculateProgressionMetrics(
        'user123',
        310,
        consistentData
      );

      expect(metrics.projectedNextLevelDate).toBeDefined();
      expect(metrics.averageXPPerDay).toBeGreaterThan(0);
    });

    it('should categorize progression rates correctly', async () => {
      // Test exceptional rate
      const fastData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        level: 3,
        totalXP: 250 + i * 60,
        xpGained: 60,
        activities: {
          ticketResolution: 50,
          skillDemonstration: 5,
          qualityBonus: 5,
          milestoneBonus: 0,
          otherActivities: 0
        }
      }));

      const fastMetrics = await ProgressionTracker.calculateProgressionMetrics(
        'user123',
        670,
        fastData
      );

      expect(fastMetrics.progressionRate).toBe('exceptional');
    });
  });

  describe('generateProgressionAnalytics', () => {
    it('should generate comprehensive analytics', async () => {
      const analytics = await ProgressionTracker.generateProgressionAnalytics(
        'user123',
        250,
        mockHistoricalData
      );

      expect(analytics.userId).toBe('user123');
      expect(analytics.currentMetrics).toBeDefined();
      expect(analytics.trends).toBeDefined();
      expect(analytics.recommendations).toBeDefined();
      expect(analytics.sustainability).toBeDefined();
    });

    it('should analyze trends correctly', async () => {
      const trendData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        level: Math.floor(i / 10) + 1,
        totalXP: i * 10,
        xpGained: 10,
        activities: {
          ticketResolution: 8,
          skillDemonstration: 1,
          qualityBonus: 1,
          milestoneBonus: 0,
          otherActivities: 0
        }
      }));

      const analytics = await ProgressionTracker.generateProgressionAnalytics(
        'user123',
        300,
        trendData
      );

      expect(analytics.trends.xpGrowthRate).toBe(10);
      expect(analytics.trends.activityConsistency).toBeGreaterThan(0.5);
      expect(analytics.trends.engagementLevel).toBeDefined();
    });

    it('should generate appropriate recommendations', async () => {
      const lowActivityData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        level: 1,
        totalXP: i * 2, // Very low XP gain
        xpGained: i % 5 === 0 ? 2 : 0, // Sporadic activity
        activities: {
          ticketResolution: i % 5 === 0 ? 2 : 0,
          skillDemonstration: 0,
          qualityBonus: 0,
          milestoneBonus: 0,
          otherActivities: 0
        }
      }));

      const analytics = await ProgressionTracker.generateProgressionAnalytics(
        'user123',
        60,
        lowActivityData
      );

      expect(analytics.recommendations.length).toBeGreaterThan(0);
      const activityRec = analytics.recommendations.find(r => r.type === 'activity');
      expect(activityRec).toBeDefined();
      expect(activityRec!.priority).toBe('high');
    });
  });

  describe('sustainability assessment', () => {
    it('should assess low burnout risk for balanced activity', async () => {
      const balancedData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        level: Math.floor(i / 10) + 1,
        totalXP: i * 15,
        xpGained: i % 2 === 0 ? 15 : 0, // Every other day
        activities: {
          ticketResolution: i % 2 === 0 ? 12 : 0,
          skillDemonstration: i % 2 === 0 ? 2 : 0,
          qualityBonus: i % 2 === 0 ? 1 : 0,
          milestoneBonus: 0,
          otherActivities: 0
        }
      }));

      const analytics = await ProgressionTracker.generateProgressionAnalytics(
        'user123',
        450,
        balancedData
      );

      expect(analytics.sustainability.burnoutRisk).toBe('low');
      expect(analytics.sustainability.balanceScore).toBeGreaterThan(50);
    });

    it('should assess high burnout risk for excessive activity', async () => {
      const intensiveData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        level: 5,
        totalXP: 500 + i * 80,
        xpGained: 80, // Very high daily XP
        activities: {
          ticketResolution: 70,
          skillDemonstration: 5,
          qualityBonus: 5,
          milestoneBonus: 0,
          otherActivities: 0
        }
      }));

      const analytics = await ProgressionTracker.generateProgressionAnalytics(
        'user123',
        1060,
        intensiveData
      );

      expect(analytics.sustainability.burnoutRisk).toBe('high');
      expect(analytics.sustainability.paceRecommendation).toBe('decrease');
    });

    it('should identify sustainability factors correctly', async () => {
      const sustainableData = Array.from({ length: 21 }, (_, i) => ({
        date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
        level: Math.floor(i / 7) + 1,
        totalXP: i * 12,
        xpGained: 12,
        activities: {
          ticketResolution: 8,
          skillDemonstration: 2,
          qualityBonus: 2,
          milestoneBonus: 0,
          otherActivities: 0
        }
      }));

      const analytics = await ProgressionTracker.generateProgressionAnalytics(
        'user123',
        252,
        sustainableData
      );

      const factors = analytics.sustainability.sustainabilityFactors;
      expect(factors.consistentActivity).toBe(true);
      expect(factors.qualityMaintenance).toBe(true);
      expect(factors.reasonablePace).toBe(true);
      expect(factors.skillDevelopment).toBe(true);
    });
  });

  describe('trend analysis', () => {
    it('should detect improving quality trends', async () => {
      const improvingData = [
        // Earlier data with lower quality
        ...Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000),
          level: 1,
          totalXP: i * 10,
          xpGained: 10,
          activities: {
            ticketResolution: 9,
            skillDemonstration: 1,
            qualityBonus: 0, // No quality bonus
            milestoneBonus: 0,
            otherActivities: 0
          }
        })),
        // Recent data with higher quality
        ...Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
          level: 1,
          totalXP: 70 + i * 12,
          xpGained: 12,
          activities: {
            ticketResolution: 8,
            skillDemonstration: 1,
            qualityBonus: 3, // Consistent quality bonus
            milestoneBonus: 0,
            otherActivities: 0
          }
        }))
      ];

      const analytics = await ProgressionTracker.generateProgressionAnalytics(
        'user123',
        154,
        improvingData
      );

      expect(analytics.trends.qualityTrend).toBe('improving');
    });

    it('should detect declining quality trends', async () => {
      const decliningData = [
        // Earlier data with higher quality
        ...Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000),
          level: 1,
          totalXP: i * 12,
          xpGained: 12,
          activities: {
            ticketResolution: 8,
            skillDemonstration: 1,
            qualityBonus: 3, // Good quality bonus
            milestoneBonus: 0,
            otherActivities: 0
          }
        })),
        // Recent data with lower quality
        ...Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
          level: 1,
          totalXP: 84 + i * 10,
          xpGained: 10,
          activities: {
            ticketResolution: 9,
            skillDemonstration: 1,
            qualityBonus: 0, // No quality bonus
            milestoneBonus: 0,
            otherActivities: 0
          }
        }))
      ];

      const analytics = await ProgressionTracker.generateProgressionAnalytics(
        'user123',
        154,
        decliningData
      );

      expect(analytics.trends.qualityTrend).toBe('declining');
    });
  });
});