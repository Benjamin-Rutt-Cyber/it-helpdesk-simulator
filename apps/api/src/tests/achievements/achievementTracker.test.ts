import { AchievementTracker } from '../../services/achievementTracker';
import { AchievementService, AchievementTier } from '../../services/achievementService';

// Mock AchievementService
jest.mock('../../services/achievementService');

describe('AchievementTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAchievement = {
    id: 'test_achievement',
    category: 'technical_skills' as any,
    name: 'Test Achievement',
    description: 'Test description',
    tier: AchievementTier.BRONZE,
    icon: 'test',
    criteria: {
      type: 'percentage' as const,
      requirements: {
        bronze: { threshold: 80 },
        silver: { threshold: 90 },
        gold: { threshold: 95 }
      }
    },
    rarity: 'common' as any,
    professionalValue: {
      skillsDisplayed: ['Test Skill'],
      competencyLevel: 'intermediate' as const,
      careerRelevance: 'mid' as const,
      industryValue: 7,
      certificationsSupported: []
    },
    portfolioDescription: 'Test portfolio description',
    resumeBulletPoint: '• Test resume bullet point'
  };

  const mockUserMetrics = {
    count: 25,
    percentage: 85,
    rating: 4.2,
    timeframe: '30d'
  };

  describe('trackAchievementProgress', () => {
    beforeEach(() => {
      (AchievementService.getAchievementById as jest.Mock).mockReturnValue(mockAchievement);
      (AchievementService.checkAchievementEligibility as jest.Mock).mockReturnValue({
        eligible: true,
        progress: 85,
        missing: []
      });
    });

    it('should track progress for valid achievement', async () => {
      const tracking = await AchievementTracker.trackAchievementProgress(
        'user123',
        'test_achievement',
        mockUserMetrics
      );

      expect(tracking).toBeDefined();
      expect(tracking.userId).toBe('user123');
      expect(tracking.achievementId).toBe('test_achievement');
      expect(tracking.currentProgress).toBeDefined();
      expect(tracking.tierProgression).toBeDefined();
      expect(tracking.nextMilestone).toBeDefined();
      expect(tracking.eligibilityStatus).toBeDefined();
    });

    it('should throw error for non-existent achievement', async () => {
      (AchievementService.getAchievementById as jest.Mock).mockReturnValue(undefined);

      await expect(
        AchievementTracker.trackAchievementProgress('user123', 'invalid_achievement', mockUserMetrics)
      ).rejects.toThrow('Achievement not found: invalid_achievement');
    });

    it('should calculate tier progression correctly', async () => {
      // Mock eligible for bronze but not silver
      (AchievementService.checkAchievementEligibility as jest.Mock)
        .mockReturnValueOnce({ eligible: true, progress: 100, missing: [] })  // bronze
        .mockReturnValueOnce({ eligible: false, progress: 60, missing: ['Need improvement'] }); // silver

      const tracking = await AchievementTracker.trackAchievementProgress(
        'user123',
        'test_achievement',
        mockUserMetrics
      );

      expect(tracking.tierProgression.currentTier).toBe(AchievementTier.BRONZE);
      expect(tracking.tierProgression.nextTier).toBe(AchievementTier.SILVER);
      expect(tracking.tierProgression.completedTiers).toContain(AchievementTier.BRONZE);
      expect(tracking.tierProgression.progressToNext).toBe(60);
    });

    it('should generate next milestone correctly', async () => {
      const tracking = await AchievementTracker.trackAchievementProgress(
        'user123',
        'test_achievement',
        mockUserMetrics
      );

      expect(tracking.nextMilestone).toBeDefined();
      expect(tracking.nextMilestone.description).toContain('Test Achievement');
      expect(tracking.nextMilestone.recommendedActions.length).toBeGreaterThan(0);
    });

    it('should determine eligibility status correctly', async () => {
      (AchievementService.checkAchievementEligibility as jest.Mock).mockReturnValue({
        eligible: false,
        progress: 75,
        missing: ['Need 5% improvement']
      });

      const tracking = await AchievementTracker.trackAchievementProgress(
        'user123',
        'test_achievement',
        mockUserMetrics
      );

      expect(tracking.eligibilityStatus.eligible).toBe(false);
      expect(tracking.eligibilityStatus.progress).toBe(75);
      expect(tracking.eligibilityStatus.blockers).toContain('Need 5% improvement');
    });
  });

  describe('getUserAchievementMetrics', () => {
    beforeEach(() => {
      (AchievementService.getUserAchievements as jest.Mock).mockResolvedValue([
        {
          achievementId: 'achievement1',
          tier: AchievementTier.GOLD,
          earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
        },
        {
          achievementId: 'achievement2',
          tier: AchievementTier.SILVER,
          earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        }
      ]);

      (AchievementService.getAchievementById as jest.Mock)
        .mockReturnValueOnce({ ...mockAchievement, category: 'technical_skills' })
        .mockReturnValueOnce({ ...mockAchievement, category: 'customer_service' });
    });

    it('should calculate achievement metrics correctly', async () => {
      const metrics = await AchievementTracker.getUserAchievementMetrics('user123');

      expect(metrics.totalAchievements).toBe(2);
      expect(metrics.achievementsByTier[AchievementTier.GOLD]).toBe(1);
      expect(metrics.achievementsByTier[AchievementTier.SILVER]).toBe(1);
      expect(metrics.achievementsByCategory).toHaveProperty('technical_skills', 1);
      expect(metrics.achievementsByCategory).toHaveProperty('customer_service', 1);
      expect(metrics.professionalValue).toBeGreaterThan(0);
      expect(metrics.portfolioStrength).toBeGreaterThan(0);
    });

    it('should identify recent earnings correctly', async () => {
      const metrics = await AchievementTracker.getUserAchievementMetrics('user123');

      expect(metrics.recentEarnings.length).toBe(1); // Only achievement earned in last 30 days
      expect(metrics.recentEarnings[0].achievementId).toBe('achievement2');
    });
  });

  describe('getAchievementRecommendations', () => {
    beforeEach(() => {
      (AchievementService.getAllAchievements as jest.Mock).mockReturnValue([
        { ...mockAchievement, id: 'achievement1' },
        { ...mockAchievement, id: 'achievement2' },
        { ...mockAchievement, id: 'achievement3' }
      ]);

      (AchievementService.getUserAchievements as jest.Mock).mockResolvedValue([]);
      
      (AchievementService.getAchievementById as jest.Mock).mockImplementation((id) => 
        ({ ...mockAchievement, id })
      );
    });

    it('should categorize recommendations correctly', async () => {
      // Mock different progress levels
      (AchievementService.checkAchievementEligibility as jest.Mock)
        .mockReturnValueOnce({ eligible: false, progress: 95, missing: [] }) // near completion
        .mockReturnValueOnce({ eligible: false, progress: 70, missing: [] }) // recommended
        .mockReturnValueOnce({ eligible: false, progress: 15, missing: [] }); // beginner

      const recommendations = await AchievementTracker.getAchievementRecommendations(
        'user123',
        mockUserMetrics
      );

      expect(recommendations.nearCompletion.length).toBe(1);
      expect(recommendations.recommended.length).toBe(1);
      expect(recommendations.beginner.length).toBe(1);
    });

    it('should exclude already earned achievements', async () => {
      (AchievementService.getUserAchievements as jest.Mock).mockResolvedValue([
        { achievementId: 'achievement1', tier: AchievementTier.BRONZE }
      ]);

      const recommendations = await AchievementTracker.getAchievementRecommendations(
        'user123',
        mockUserMetrics
      );

      const allRecommendations = [
        ...recommendations.nearCompletion,
        ...recommendations.recommended,
        ...recommendations.beginner
      ];

      expect(allRecommendations.every(r => r.achievementId !== 'achievement1')).toBe(true);
    });

    it('should limit recommendation counts', async () => {
      // Create many achievements
      const manyAchievements = Array.from({ length: 20 }, (_, i) => 
        ({ ...mockAchievement, id: `achievement${i}` })
      );
      
      (AchievementService.getAllAchievements as jest.Mock).mockReturnValue(manyAchievements);
      
      // Mock all as recommended level
      (AchievementService.checkAchievementEligibility as jest.Mock).mockReturnValue({
        eligible: false,
        progress: 60,
        missing: []
      });

      const recommendations = await AchievementTracker.getAchievementRecommendations(
        'user123',
        mockUserMetrics
      );

      expect(recommendations.recommended.length).toBeLessThanOrEqual(5);
      expect(recommendations.nearCompletion.length).toBeLessThanOrEqual(3);
      expect(recommendations.beginner.length).toBeLessThanOrEqual(5);
    });
  });

  describe('recordProgressActivity', () => {
    it('should record progress activity', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AchievementTracker.recordProgressActivity('user123', 'achievement1', {
        value: 10,
        context: 'Test activity',
        ticketId: 'TICKET-123'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Progress recorded for user user123 on achievement achievement1'),
        expect.objectContaining({
          value: 10,
          context: 'Test activity',
          ticketId: 'TICKET-123',
          date: expect.any(Date)
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('private method functionality', () => {
    it('should calculate professional value correctly', async () => {
      const mockUserAchievements = [
        {
          achievementId: 'achievement1',
          tier: AchievementTier.GOLD,
          earnedAt: new Date()
        },
        {
          achievementId: 'achievement2',
          tier: AchievementTier.SILVER,
          earnedAt: new Date()
        }
      ];

      (AchievementService.getUserAchievements as jest.Mock).mockResolvedValue(mockUserAchievements);
      (AchievementService.getAchievementById as jest.Mock).mockReturnValue({
        ...mockAchievement,
        professionalValue: { ...mockAchievement.professionalValue, industryValue: 8 }
      });

      const metrics = await AchievementTracker.getUserAchievementMetrics('user123');

      // Gold tier (1.5x) + Silver tier (1.2x) multipliers applied to industry value (8)
      expect(metrics.professionalValue).toBeGreaterThan(15); // Approximately (8*1.5 + 8*1.2)
    });

    it('should calculate portfolio strength correctly', async () => {
      const diverseAchievements = [
        { achievementId: 'tech1', tier: AchievementTier.GOLD, earnedAt: new Date() },
        { achievementId: 'customer1', tier: AchievementTier.SILVER, earnedAt: new Date() },
        { achievementId: 'leadership1', tier: AchievementTier.BRONZE, earnedAt: new Date() }
      ];

      (AchievementService.getUserAchievements as jest.Mock).mockResolvedValue(diverseAchievements);
      (AchievementService.getAchievementById as jest.Mock)
        .mockReturnValueOnce({ ...mockAchievement, category: 'technical_skills' })
        .mockReturnValueOnce({ ...mockAchievement, category: 'customer_service' })
        .mockReturnValueOnce({ ...mockAchievement, category: 'leadership' });

      (AchievementService.getPortfolioAchievements as jest.Mock).mockReturnValue([
        { portfolioWeight: 15 },
        { portfolioWeight: 12 },
        { portfolioWeight: 8 }
      ]);

      const metrics = await AchievementTracker.getUserAchievementMetrics('user123');

      expect(metrics.portfolioStrength).toBeGreaterThan(0);
      expect(metrics.portfolioStrength).toBeLessThanOrEqual(100);
    });
  });
});