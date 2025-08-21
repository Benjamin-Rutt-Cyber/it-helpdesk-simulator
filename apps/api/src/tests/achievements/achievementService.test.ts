import { AchievementService, AchievementCategory, AchievementTier } from '../../services/achievementService';

describe('AchievementService', () => {
  describe('getAllAchievements', () => {
    it('should return all predefined achievements', () => {
      const achievements = AchievementService.getAllAchievements();
      
      expect(achievements).toBeDefined();
      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements.every(a => a.id && a.name && a.description)).toBe(true);
    });

    it('should include achievements from all categories', () => {
      const achievements = AchievementService.getAllAchievements();
      const categories = new Set(achievements.map(a => a.category));
      
      expect(categories.has(AchievementCategory.TECHNICAL_SKILLS)).toBe(true);
      expect(categories.has(AchievementCategory.CUSTOMER_SERVICE)).toBe(true);
      expect(categories.has(AchievementCategory.PROFESSIONAL_BEHAVIOR)).toBe(true);
      expect(categories.has(AchievementCategory.LEADERSHIP)).toBe(true);
      expect(categories.has(AchievementCategory.LEARNING)).toBe(true);
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should return achievements for technical skills category', () => {
      const techAchievements = AchievementService.getAchievementsByCategory(
        AchievementCategory.TECHNICAL_SKILLS
      );
      
      expect(techAchievements.length).toBeGreaterThan(0);
      expect(techAchievements.every(a => a.category === AchievementCategory.TECHNICAL_SKILLS)).toBe(true);
    });

    it('should return achievements for customer service category', () => {
      const serviceAchievements = AchievementService.getAchievementsByCategory(
        AchievementCategory.CUSTOMER_SERVICE
      );
      
      expect(serviceAchievements.length).toBeGreaterThan(0);
      expect(serviceAchievements.every(a => a.category === AchievementCategory.CUSTOMER_SERVICE)).toBe(true);
    });
  });

  describe('getAchievementById', () => {
    it('should return specific achievement by ID', () => {
      const achievement = AchievementService.getAchievementById('troubleshooting_master');
      
      expect(achievement).toBeDefined();
      expect(achievement!.id).toBe('troubleshooting_master');
      expect(achievement!.name).toBe('Troubleshooting Master');
      expect(achievement!.category).toBe(AchievementCategory.TECHNICAL_SKILLS);
    });

    it('should return undefined for non-existent achievement', () => {
      const achievement = AchievementService.getAchievementById('non_existent');
      expect(achievement).toBeUndefined();
    });
  });

  describe('checkAchievementEligibility', () => {
    const mockMetrics = {
      percentage: 90,
      count: 25,
      rating: 4.5,
      timeframe: '30d'
    };

    it('should check bronze tier eligibility correctly', () => {
      const result = AchievementService.checkAchievementEligibility(
        'troubleshooting_master',
        { percentage: 85, timeframe: '30d' },
        AchievementTier.BRONZE
      );

      expect(result.eligible).toBe(true);
      expect(result.progress).toBe(100);
      expect(result.missing).toHaveLength(0);
    });

    it('should identify missing requirements', () => {
      const result = AchievementService.checkAchievementEligibility(
        'troubleshooting_master',
        { percentage: 70, timeframe: '30d' },
        AchievementTier.BRONZE
      );

      expect(result.eligible).toBe(false);
      expect(result.progress).toBeLessThan(100);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it('should handle silver tier requirements', () => {
      const result = AchievementService.checkAchievementEligibility(
        'troubleshooting_master',
        { percentage: 92, timeframe: '60d' },
        AchievementTier.SILVER
      );

      expect(result.eligible).toBe(true);
      expect(result.progress).toBe(100);
    });

    it('should handle count-based achievements', () => {
      const result = AchievementService.checkAchievementEligibility(
        'network_specialist',
        { count: 30, category: 'network', timeframe: '60d' },
        AchievementTier.BRONZE
      );

      expect(result.eligible).toBe(true);
      expect(result.progress).toBe(100);
    });

    it('should handle composite achievements', () => {
      const result = AchievementService.checkAchievementEligibility(
        'security_guardian',
        { securityIssues: 15, securityEducation: 8 },
        AchievementTier.BRONZE
      );

      expect(result.eligible).toBe(true);
      expect(result.progress).toBeGreaterThan(0);
    });
  });

  describe('getPortfolioAchievements', () => {
    const mockUserAchievements = [
      {
        achievementId: 'troubleshooting_master',
        userId: 'user1',
        earnedAt: new Date(),
        tier: AchievementTier.GOLD,
        progress: { currentValue: 100, targetValue: 100, percentage: 100, recentActivity: [] },
        evidence: [],
        celebrationShown: true
      },
      {
        achievementId: 'customer_champion',
        userId: 'user1',
        earnedAt: new Date(),
        tier: AchievementTier.SILVER,
        progress: { currentValue: 100, targetValue: 100, percentage: 100, recentActivity: [] },
        evidence: [],
        celebrationShown: true
      }
    ];

    it('should return portfolio achievements sorted by weight', () => {
      const portfolioAchievements = AchievementService.getPortfolioAchievements(mockUserAchievements);
      
      expect(portfolioAchievements.length).toBe(2);
      expect(portfolioAchievements.every(pa => pa.portfolioWeight > 0)).toBe(true);
      
      // Should be sorted by weight (descending)
      for (let i = 1; i < portfolioAchievements.length; i++) {
        expect(portfolioAchievements[i].portfolioWeight).toBeLessThanOrEqual(
          portfolioAchievements[i-1].portfolioWeight
        );
      }
    });

    it('should calculate portfolio weights correctly', () => {
      const portfolioAchievements = AchievementService.getPortfolioAchievements(mockUserAchievements);
      
      // Gold tier should have higher weight than Silver
      const goldAchievement = portfolioAchievements.find(
        pa => pa.userAchievement.tier === AchievementTier.GOLD
      );
      const silverAchievement = portfolioAchievements.find(
        pa => pa.userAchievement.tier === AchievementTier.SILVER
      );
      
      expect(goldAchievement!.portfolioWeight).toBeGreaterThan(silverAchievement!.portfolioWeight);
    });
  });

  describe('generateResumeSummary', () => {
    const mockUserAchievements = [
      {
        achievementId: 'troubleshooting_master',
        userId: 'user1',
        earnedAt: new Date(),
        tier: AchievementTier.GOLD,
        progress: { currentValue: 100, targetValue: 100, percentage: 100, recentActivity: [] },
        evidence: [],
        celebrationShown: true
      }
    ];

    it('should generate resume bullet points', () => {
      const resumeSummary = AchievementService.generateResumeSummary(mockUserAchievements);
      
      expect(resumeSummary.length).toBeGreaterThan(0);
      expect(resumeSummary.every(bullet => bullet.startsWith('•'))).toBe(true);
      expect(resumeSummary.every(bullet => bullet.length > 20)).toBe(true);
    });

    it('should limit to top 5 achievements', () => {
      const manyAchievements = Array.from({ length: 10 }, (_, i) => ({
        achievementId: `achievement_${i}`,
        userId: 'user1',
        earnedAt: new Date(),
        tier: AchievementTier.BRONZE,
        progress: { currentValue: 100, targetValue: 100, percentage: 100, recentActivity: [] },
        evidence: [],
        celebrationShown: true
      }));

      const resumeSummary = AchievementService.generateResumeSummary(manyAchievements);
      expect(resumeSummary.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getAchievementCategoriesSummary', () => {
    it('should return summary for all categories', () => {
      const categorySummary = AchievementService.getAchievementCategoriesSummary();
      
      expect(categorySummary.length).toBe(5);
      expect(categorySummary.every(cat => cat.name && cat.description)).toBe(true);
      expect(categorySummary.every(cat => cat.achievementCount > 0)).toBe(true);
    });

    it('should include professional relevance for each category', () => {
      const categorySummary = AchievementService.getAchievementCategoriesSummary();
      
      expect(categorySummary.every(cat => cat.professionalRelevance.length > 0)).toBe(true);
    });
  });

  describe('achievement validation', () => {
    it('should have valid professional values for all achievements', () => {
      const achievements = AchievementService.getAllAchievements();
      
      achievements.forEach(achievement => {
        expect(achievement.professionalValue.industryValue).toBeGreaterThanOrEqual(1);
        expect(achievement.professionalValue.industryValue).toBeLessThanOrEqual(10);
        expect(achievement.professionalValue.skillsDisplayed.length).toBeGreaterThan(0);
        expect(achievement.professionalValue.competencyLevel).toMatch(
          /^(basic|intermediate|advanced|expert)$/
        );
        expect(achievement.professionalValue.careerRelevance).toMatch(
          /^(entry|mid|senior|leadership)$/
        );
      });
    });

    it('should have valid criteria for all achievements', () => {
      const achievements = AchievementService.getAllAchievements();
      
      achievements.forEach(achievement => {
        expect(achievement.criteria.requirements.bronze).toBeDefined();
        expect(achievement.criteria.requirements.silver).toBeDefined();
        expect(achievement.criteria.requirements.gold).toBeDefined();
        
        expect(achievement.criteria.requirements.bronze.threshold).toBeGreaterThan(0);
        expect(achievement.criteria.requirements.silver.threshold).toBeGreaterThan(
          achievement.criteria.requirements.bronze.threshold
        );
        expect(achievement.criteria.requirements.gold.threshold).toBeGreaterThan(
          achievement.criteria.requirements.silver.threshold
        );
      });
    });

    it('should have proper resume bullet points', () => {
      const achievements = AchievementService.getAllAchievements();
      
      achievements.forEach(achievement => {
        expect(achievement.resumeBulletPoint).toMatch(/^•/);
        expect(achievement.resumeBulletPoint.length).toBeGreaterThan(20);
        expect(achievement.portfolioDescription.length).toBeGreaterThan(10);
      });
    });
  });
});