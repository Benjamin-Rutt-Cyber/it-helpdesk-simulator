import { AdvancementManager } from '../../services/advancementManager';

describe('AdvancementManager', () => {
  const goodPerformanceMetrics = {
    averageTicketRating: 4.5,
    completionRate: 0.9,
    professionalismScore: 4.2,
    skillDemonstrations: 15
  };

  const poorPerformanceMetrics = {
    averageTicketRating: 3.5,
    completionRate: 0.7,
    professionalismScore: 3.8,
    skillDemonstrations: 2
  };

  describe('processAdvancement', () => {
    it('should return null when no level change occurs', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        50,  // previousXP
        80,  // newXP (same level)
        goodPerformanceMetrics
      );

      expect(result).toBeNull();
    });

    it('should process normal level advancement', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        90,   // previousXP (level 1)
        150,  // newXP (level 2)
        goodPerformanceMetrics
      );

      expect(result).toBeDefined();
      expect(result!.userId).toBe('user123');
      expect(result!.previousLevel).toBe(1);
      expect(result!.newLevel).toBe(2);
      expect(result!.previousXP).toBe(90);
      expect(result!.newXP).toBe(150);
      expect(result!.celebration.type).toBe('standard');
    });

    it('should process milestone advancement', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        490,  // previousXP (level 5)
        510,  // newXP (level 6) - milestone at level 5
        goodPerformanceMetrics
      );

      expect(result).toBeDefined();
      expect(result!.milestones.length).toBeGreaterThan(0);
      expect(result!.celebration.type).toBe('milestone');
    });

    it('should process major milestone advancement', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        980,  // previousXP (level 10)
        1020, // newXP (level 11) - major milestone at level 10
        goodPerformanceMetrics
      );

      expect(result).toBeDefined();
      expect(result!.milestones.length).toBeGreaterThan(0);
      expect(result!.celebration.type).toBe('major_milestone');
    });

    it('should throw error when advancement requirements not met', async () => {
      await expect(
        AdvancementManager.processAdvancement(
          'user123',
          90,   // previousXP (level 1)
          150,  // newXP (level 2)
          poorPerformanceMetrics
        )
      ).rejects.toThrow('Level advancement blocked');
    });

    it('should generate appropriate benefits list', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        290,  // previousXP (level 3)
        310,  // newXP (level 4)
        goodPerformanceMetrics
      );

      expect(result).toBeDefined();
      expect(result!.benefits).toBeDefined();
      expect(Array.isArray(result!.benefits)).toBe(true);
    });
  });

  describe('generateAdvancementNotification', () => {
    it('should generate appropriate notification for standard advancement', () => {
      const mockAdvancementEvent = {
        userId: 'user123',
        previousLevel: 1,
        newLevel: 2,
        previousXP: 90,
        newXP: 150,
        timestamp: new Date(),
        milestones: [],
        benefits: ['Feature Unlocked: Test Feature'],
        celebration: {
          type: 'standard' as const,
          title: '🚀 Level Up! 🚀',
          message: 'Congratulations on reaching Level 2!',
          animation: 'level-up-pulse',
          rewards: [],
          shareableContent: {
            title: 'Level 2 Achievement',
            description: 'Professional advancement',
            linkedInPost: 'Test LinkedIn post',
            twitterPost: 'Test Twitter post',
            resumeBulletPoint: 'Test resume point'
          }
        }
      };

      const notification = AdvancementManager.generateAdvancementNotification(mockAdvancementEvent);

      expect(notification.title).toBe('🚀 Level Up! 🚀');
      expect(notification.type).toBe('achievement');
      expect(notification.duration).toBe(5000);
      expect(notification.actions).toContainEqual({ label: 'View Benefits', action: 'view_benefits' });
      expect(notification.actions).toContainEqual({ label: 'Share Achievement', action: 'share_achievement' });
    });

    it('should generate appropriate notification for major milestone', () => {
      const mockAdvancementEvent = {
        userId: 'user123',
        previousLevel: 9,
        newLevel: 10,
        previousXP: 980,
        newXP: 1020,
        timestamp: new Date(),
        milestones: [{
          level: 10,
          xp: 1000,
          type: 'level' as const,
          achieved: true,
          achievedDate: new Date(),
          title: 'Level 10 Milestone',
          description: 'Major milestone achievement',
          rewards: ['Special Badge']
        }],
        benefits: [],
        celebration: {
          type: 'major_milestone' as const,
          title: '🎉 Major Milestone Achieved! 🎉',
          message: 'Congratulations on this major achievement!',
          animation: 'confetti-explosion',
          rewards: [],
          shareableContent: {
            title: 'Major Milestone',
            description: 'Professional advancement',
            linkedInPost: 'Test LinkedIn post',
            twitterPost: 'Test Twitter post',
            resumeBulletPoint: 'Test resume point'
          }
        }
      };

      const notification = AdvancementManager.generateAdvancementNotification(mockAdvancementEvent);

      expect(notification.title).toBe('🎉 Major Milestone Achieved! 🎉');
      expect(notification.type).toBe('milestone');
      expect(notification.duration).toBe(10000);
      expect(notification.actions).toContainEqual({ label: 'View Milestones', action: 'view_milestones' });
    });
  });

  describe('celebration generation', () => {
    it('should generate standard celebration for normal advancement', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        90,
        150,
        goodPerformanceMetrics
      );

      expect(result!.celebration.type).toBe('standard');
      expect(result!.celebration.title).toContain('Level Up');
      expect(result!.celebration.animation).toBe('level-up-pulse');
    });

    it('should generate milestone celebration for milestone levels', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        480,  // level 5
        520,  // level 6, crossing level 5 milestone
        goodPerformanceMetrics
      );

      expect(result!.celebration.type).toBe('milestone');
      expect(result!.celebration.title).toContain('Milestone');
    });
  });

  describe('reward generation', () => {
    it('should generate appropriate rewards for advancement', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        90,
        150,
        goodPerformanceMetrics
      );

      expect(result!.celebration.rewards.length).toBeGreaterThan(0);
      
      const badgeReward = result!.celebration.rewards.find(r => r.type === 'badge');
      expect(badgeReward).toBeDefined();
      expect(badgeReward!.title).toContain('Level 2');
    });

    it('should generate rarer rewards for higher levels', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        1980,  // level 20
        2020,  // level 21
        goodPerformanceMetrics
      );

      const badgeReward = result!.celebration.rewards.find(r => r.type === 'badge');
      expect(badgeReward).toBeDefined();
      expect(['epic', 'legendary']).toContain(badgeReward!.rarity);
    });
  });

  describe('shareable content generation', () => {
    it('should generate appropriate shareable content', async () => {
      const result = await AdvancementManager.processAdvancement(
        'user123',
        90,
        150,
        goodPerformanceMetrics
      );

      const shareableContent = result!.celebration.shareableContent;
      
      expect(shareableContent.title).toContain('Achievement');
      expect(shareableContent.linkedInPost).toContain('Level 2');
      expect(shareableContent.linkedInPost).toContain('#ITSupport');
      expect(shareableContent.twitterPost).toContain('Level 2');
      expect(shareableContent.resumeBulletPoint).toContain('certification');
    });
  });
});