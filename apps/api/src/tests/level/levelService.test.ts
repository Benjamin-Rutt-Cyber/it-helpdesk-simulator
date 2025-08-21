import { LevelService } from '../../services/levelService';

describe('LevelService', () => {
  describe('calculateLevelInfo', () => {
    it('should calculate correct level info for level 1', () => {
      const result = LevelService.calculateLevelInfo(50);
      
      expect(result).toEqual({
        currentLevel: 1,
        currentXP: 50,
        xpToNextLevel: 50,
        totalXPForCurrentLevel: 0,
        totalXPForNextLevel: 100,
        levelName: 'Support Trainee - Level 1',
        levelCategory: 'Support Trainee',
        progressPercentage: 50
      });
    });

    it('should calculate correct level info for level 5', () => {
      const result = LevelService.calculateLevelInfo(450);
      
      expect(result).toEqual({
        currentLevel: 5,
        currentXP: 450,
        xpToNextLevel: 50,
        totalXPForCurrentLevel: 400,
        totalXPForNextLevel: 500,
        levelName: 'Support Technician - Level 5',
        levelCategory: 'Support Technician',
        progressPercentage: 50
      });
    });

    it('should calculate correct level info for level 10', () => {
      const result = LevelService.calculateLevelInfo(950);
      
      expect(result).toEqual({
        currentLevel: 10,
        currentXP: 950,
        xpToNextLevel: 50,
        totalXPForCurrentLevel: 900,
        totalXPForNextLevel: 1000,
        levelName: 'Support Expert - Level 10',
        levelCategory: 'Support Expert',
        progressPercentage: 50
      });
    });

    it('should handle exact level boundaries', () => {
      const result = LevelService.calculateLevelInfo(500);
      
      expect(result).toEqual({
        currentLevel: 6,
        currentXP: 500,
        xpToNextLevel: 100,
        totalXPForCurrentLevel: 500,
        totalXPForNextLevel: 600,
        levelName: 'Support Specialist - Level 6',
        levelCategory: 'Support Specialist',
        progressPercentage: 0
      });
    });
  });

  describe('getLevelNameAndCategory', () => {
    it('should return correct names for different level ranges', () => {
      expect(LevelService.getLevelNameAndCategory(1)).toEqual({
        levelName: 'Support Trainee - Level 1',
        levelCategory: 'Support Trainee'
      });

      expect(LevelService.getLevelNameAndCategory(5)).toEqual({
        levelName: 'Support Technician - Level 5',
        levelCategory: 'Support Technician'
      });

      expect(LevelService.getLevelNameAndCategory(10)).toEqual({
        levelName: 'Support Expert - Level 10',
        levelCategory: 'Support Expert'
      });

      expect(LevelService.getLevelNameAndCategory(25)).toEqual({
        levelName: 'Support Consultant - Level 25',
        levelCategory: 'Support Consultant'
      });

      expect(LevelService.getLevelNameAndCategory(35)).toEqual({
        levelName: 'Support Master - Level 35',
        levelCategory: 'Support Master'
      });
    });
  });

  describe('getLevelBenefits', () => {
    it('should return appropriate benefits for different levels', () => {
      const level1Benefits = LevelService.getLevelBenefits(1);
      expect(level1Benefits.featureUnlocks).toHaveLength(0);
      expect(level1Benefits.privileges).toHaveLength(0);
      expect(level1Benefits.recognition).toHaveLength(0);

      const level5Benefits = LevelService.getLevelBenefits(5);
      expect(level5Benefits.featureUnlocks).toContain('Advanced Scenario Access');
      expect(level5Benefits.privileges).toContain('Priority Support Queue');
      expect(level5Benefits.recognition).toContain('Verified Support Technician');

      const level20Benefits = LevelService.getLevelBenefits(20);
      expect(level20Benefits.featureUnlocks).toContain('Beta Feature Access');
      expect(level20Benefits.privileges).toContain('Professional Mentoring Program');
      expect(level20Benefits.recognition).toContain('Professional Certification Eligible');
    });
  });

  describe('checkForMilestones', () => {
    it('should identify level milestones', () => {
      const milestones = LevelService.checkForMilestones(5, 400);
      
      expect(milestones).toHaveLength(1);
      expect(milestones[0]).toMatchObject({
        level: 5,
        type: 'level',
        achieved: true,
        title: 'Level 5 Milestone'
      });
    });

    it('should identify XP milestones', () => {
      const milestones = LevelService.checkForMilestones(6, 500);
      
      expect(milestones).toHaveLength(1);
      expect(milestones[0]).toMatchObject({
        xp: 500,
        type: 'xp',
        achieved: true,
        title: '500 XP Milestone'
      });
    });

    it('should identify multiple milestones', () => {
      const milestones = LevelService.checkForMilestones(10, 1000);
      
      expect(milestones).toHaveLength(2);
      expect(milestones.some(m => m.type === 'level' && m.level === 10)).toBe(true);
      expect(milestones.some(m => m.type === 'xp' && m.xp === 1000)).toBe(true);
    });

    it('should return empty array when no milestones reached', () => {
      const milestones = LevelService.checkForMilestones(3, 250);
      expect(milestones).toHaveLength(0);
    });
  });

  describe('validateAdvancementRequirements', () => {
    const goodMetrics = {
      averageTicketRating: 4.5,
      completionRate: 0.9,
      professionalismScore: 4.2,
      skillDemonstrations: 15
    };

    const poorMetrics = {
      averageTicketRating: 3.5,
      completionRate: 0.7,
      professionalismScore: 3.8,
      skillDemonstrations: 2
    };

    it('should allow advancement with good metrics', () => {
      const result = LevelService.validateAdvancementRequirements(5, 6, goodMetrics);
      
      expect(result.canAdvance).toBe(true);
      expect(result.requirements).toHaveLength(0);
    });

    it('should block advancement with poor metrics', () => {
      const result = LevelService.validateAdvancementRequirements(5, 6, poorMetrics);
      
      expect(result.canAdvance).toBe(false);
      expect(result.requirements.length).toBeGreaterThan(0);
      expect(result.requirements).toContain('Minimum 4.0 average ticket rating required');
      expect(result.requirements).toContain('Minimum 80% ticket completion rate required');
    });

    it('should require more skill demonstrations for higher levels', () => {
      const insufficientSkillsForExpert = {
        ...goodMetrics,
        skillDemonstrations: 3
      };

      const result = LevelService.validateAdvancementRequirements(8, 9, insufficientSkillsForExpert);
      
      expect(result.canAdvance).toBe(false);
      expect(result.requirements).toContain('Minimum 10 skill demonstrations required for Expert level');
    });
  });

  describe('generateProfessionalDescription', () => {
    it('should generate appropriate professional description', () => {
      const description = LevelService.generateProfessionalDescription(10);
      
      expect(description).toContain('Support Expert - Level 10');
      expect(description).toContain('Professional Level: Support Expert');
      expect(description).toContain('Experience Points: 900+ XP');
      expect(description).toContain('Competencies Demonstrated:');
      expect(description).toContain('Professional Capabilities:');
      expect(description).toContain('demonstrated competency in IT support');
    });
  });

  describe('getUpcomingMilestones', () => {
    it('should return upcoming milestones sorted by XP', () => {
      const milestones = LevelService.getUpcomingMilestones(3, 250);
      
      expect(milestones.length).toBeGreaterThan(0);
      expect(milestones[0].achieved).toBe(false);
      
      // Should be sorted by XP (closest first)
      for (let i = 1; i < milestones.length; i++) {
        expect(milestones[i].xp).toBeGreaterThanOrEqual(milestones[i-1].xp);
      }
    });

    it('should not include already achieved milestones', () => {
      const milestones = LevelService.getUpcomingMilestones(10, 1000);
      
      // Should not include level 5 or 500 XP milestones
      expect(milestones.every(m => !(m.type === 'level' && m.level <= 10))).toBe(true);
      expect(milestones.every(m => !(m.type === 'xp' && m.xp <= 1000))).toBe(true);
    });
  });
});