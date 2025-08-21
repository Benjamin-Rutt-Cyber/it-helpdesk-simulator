import { User } from '../types/User';

export interface LevelInfo {
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXPForCurrentLevel: number;
  totalXPForNextLevel: number;
  levelName: string;
  levelCategory: string;
  progressPercentage: number;
}

export interface LevelBenefits {
  featureUnlocks: string[];
  privileges: string[];
  recognition: string[];
  professionalCredits: string[];
}

export interface MilestoneInfo {
  level: number;
  xp: number;
  type: 'level' | 'xp' | 'skill' | 'professional' | 'engagement';
  achieved: boolean;
  achievedDate?: Date;
  title: string;
  description: string;
  rewards: string[];
}

export class LevelService {
  private static readonly XP_PER_LEVEL = 100;
  
  private static readonly LEVEL_STRUCTURE = {
    'Support Trainee': { min: 1, max: 2, xpRange: [0, 199] },
    'Support Technician': { min: 3, max: 5, xpRange: [200, 499] },
    'Support Specialist': { min: 6, max: 8, xpRange: [500, 799] },
    'Support Expert': { min: 9, max: 12, xpRange: [800, 1199] },
    'Senior Support Specialist': { min: 13, max: 15, xpRange: [1200, 1499] },
    'Support Professional': { min: 16, max: 20, xpRange: [1500, 1999] },
    'Support Consultant': { min: 21, max: 25, xpRange: [2000, 2499] },
    'Support Master': { min: 26, max: 30, xpRange: [2500, 2999] }
  };

  private static readonly MILESTONE_LEVELS = [5, 10, 15, 20, 25, 30];
  private static readonly XP_MILESTONES = [500, 1000, 1500, 2000, 2500, 3000];

  /**
   * Calculate current level information from XP
   */
  static calculateLevelInfo(totalXP: number): LevelInfo {
    const currentLevel = Math.floor(totalXP / this.XP_PER_LEVEL) + 1;
    const xpInCurrentLevel = totalXP % this.XP_PER_LEVEL;
    const xpToNextLevel = this.XP_PER_LEVEL - xpInCurrentLevel;
    const totalXPForCurrentLevel = (currentLevel - 1) * this.XP_PER_LEVEL;
    const totalXPForNextLevel = currentLevel * this.XP_PER_LEVEL;
    const progressPercentage = (xpInCurrentLevel / this.XP_PER_LEVEL) * 100;

    const { levelName, levelCategory } = this.getLevelNameAndCategory(currentLevel);

    return {
      currentLevel,
      currentXP: totalXP,
      xpToNextLevel,
      totalXPForCurrentLevel,
      totalXPForNextLevel,
      levelName,
      levelCategory,
      progressPercentage
    };
  }

  /**
   * Get professional level name and category for a given level
   */
  static getLevelNameAndCategory(level: number): { levelName: string; levelCategory: string } {
    for (const [category, info] of Object.entries(this.LEVEL_STRUCTURE)) {
      if (level >= info.min && level <= info.max) {
        return {
          levelName: `${category} - Level ${level}`,
          levelCategory: category
        };
      }
    }
    
    // For levels beyond our structure
    if (level > 30) {
      return {
        levelName: `Support Master - Level ${level}`,
        levelCategory: 'Support Master'
      };
    }
    
    return {
      levelName: `Support Trainee - Level ${level}`,
      levelCategory: 'Support Trainee'
    };
  }

  /**
   * Get level benefits for a specific level
   */
  static getLevelBenefits(level: number): LevelBenefits {
    const benefits: LevelBenefits = {
      featureUnlocks: [],
      privileges: [],
      recognition: [],
      professionalCredits: []
    };

    // Feature unlocks based on level ranges
    if (level >= 3) {
      benefits.featureUnlocks.push('Advanced Scenario Access');
    }
    if (level >= 6) {
      benefits.featureUnlocks.push('Escalation Training Scenarios');
    }
    if (level >= 9) {
      benefits.featureUnlocks.push('Complex Multi-System Issues');
    }
    if (level >= 13) {
      benefits.featureUnlocks.push('Mentorship Opportunities');
    }
    if (level >= 16) {
      benefits.featureUnlocks.push('Beta Feature Access');
    }
    if (level >= 21) {
      benefits.featureUnlocks.push('Community Leadership Tools');
    }
    if (level >= 26) {
      benefits.featureUnlocks.push('Master-Level Scenarios');
    }

    // Privileges based on level
    if (level >= 5) {
      benefits.privileges.push('Priority Support Queue');
    }
    if (level >= 10) {
      benefits.privileges.push('Advanced Analytics Access');
    }
    if (level >= 15) {
      benefits.privileges.push('Performance Coaching Access');
    }
    if (level >= 20) {
      benefits.privileges.push('Professional Mentoring Program');
    }
    if (level >= 25) {
      benefits.privileges.push('Industry Expert Recognition');
    }

    // Recognition features
    if (level >= 3) {
      benefits.recognition.push('Verified Support Technician');
    }
    if (level >= 6) {
      benefits.recognition.push('Certified Support Specialist');
    }
    if (level >= 9) {
      benefits.recognition.push('Expert-Level Practitioner');
    }
    if (level >= 16) {
      benefits.recognition.push('Professional Certification Eligible');
    }
    if (level >= 21) {
      benefits.recognition.push('Industry Consultant Level');
    }

    // Professional credits
    const { levelCategory } = this.getLevelNameAndCategory(level);
    benefits.professionalCredits.push(`${levelCategory} Certification`);
    
    if (level >= 10) {
      benefits.professionalCredits.push('Professional Development Credits');
    }
    if (level >= 20) {
      benefits.professionalCredits.push('Industry Recognized Expertise');
    }

    return benefits;
  }

  /**
   * Check if level advancement should trigger milestone recognition
   */
  static checkForMilestones(newLevel: number, newXP: number): MilestoneInfo[] {
    const milestones: MilestoneInfo[] = [];

    // Level milestones
    if (this.MILESTONE_LEVELS.includes(newLevel)) {
      milestones.push({
        level: newLevel,
        xp: newXP,
        type: 'level',
        achieved: true,
        achievedDate: new Date(),
        title: `Level ${newLevel} Milestone`,
        description: `Achieved significant milestone by reaching Level ${newLevel}`,
        rewards: [
          'Special Achievement Badge',
          'Milestone Certificate',
          'Professional Recognition'
        ]
      });
    }

    // XP milestones
    for (const xpMilestone of this.XP_MILESTONES) {
      if (newXP >= xpMilestone && newXP - 100 < xpMilestone) { // Just crossed this milestone
        milestones.push({
          level: newLevel,
          xp: newXP,
          type: 'xp',
          achieved: true,
          achievedDate: new Date(),
          title: `${xpMilestone} XP Milestone`,
          description: `Accumulated ${xpMilestone} experience points`,
          rewards: [
            'XP Achievement Badge',
            'Experience Certificate',
            'Progress Recognition'
          ]
        });
      }
    }

    return milestones;
  }

  /**
   * Get upcoming milestones for motivation
   */
  static getUpcomingMilestones(currentLevel: number, currentXP: number): MilestoneInfo[] {
    const upcoming: MilestoneInfo[] = [];

    // Next level milestone
    const nextLevelMilestone = this.MILESTONE_LEVELS.find(level => level > currentLevel);
    if (nextLevelMilestone) {
      upcoming.push({
        level: nextLevelMilestone,
        xp: (nextLevelMilestone - 1) * this.XP_PER_LEVEL,
        type: 'level',
        achieved: false,
        title: `Level ${nextLevelMilestone} Milestone`,
        description: `Reach Level ${nextLevelMilestone} for special recognition`,
        rewards: [
          'Special Achievement Badge',
          'Milestone Certificate',
          'Professional Recognition'
        ]
      });
    }

    // Next XP milestone
    const nextXPMilestone = this.XP_MILESTONES.find(xp => xp > currentXP);
    if (nextXPMilestone) {
      upcoming.push({
        level: Math.floor(nextXPMilestone / this.XP_PER_LEVEL) + 1,
        xp: nextXPMilestone,
        type: 'xp',
        achieved: false,
        title: `${nextXPMilestone} XP Milestone`,
        description: `Accumulate ${nextXPMilestone} experience points`,
        rewards: [
          'XP Achievement Badge',
          'Experience Certificate',
          'Progress Recognition'
        ]
      });
    }

    return upcoming.sort((a, b) => {
      if (a.type === 'level' && b.type === 'xp') {
        return a.xp - b.xp;
      }
      if (a.type === 'xp' && b.type === 'level') {
        return a.xp - b.xp;
      }
      return a.xp - b.xp;
    });
  }

  /**
   * Validate level advancement requirements
   * This ensures professional credibility by requiring actual competency demonstration
   */
  static validateAdvancementRequirements(
    currentLevel: number, 
    newLevel: number, 
    performanceMetrics: {
      averageTicketRating: number;
      completionRate: number;
      professionalismScore: number;
      skillDemonstrations: number;
    }
  ): { canAdvance: boolean; requirements: string[] } {
    const requirements: string[] = [];
    let canAdvance = true;

    // Basic performance requirements
    if (performanceMetrics.averageTicketRating < 4.0) {
      requirements.push('Minimum 4.0 average ticket rating required');
      canAdvance = false;
    }

    if (performanceMetrics.completionRate < 0.8) {
      requirements.push('Minimum 80% ticket completion rate required');
      canAdvance = false;
    }

    if (performanceMetrics.professionalismScore < 4.0) {
      requirements.push('Minimum 4.0 professionalism score required');
      canAdvance = false;
    }

    // Level-specific requirements
    if (newLevel >= 6 && performanceMetrics.skillDemonstrations < 5) {
      requirements.push('Minimum 5 skill demonstrations required for Specialist level');
      canAdvance = false;
    }

    if (newLevel >= 9 && performanceMetrics.skillDemonstrations < 10) {
      requirements.push('Minimum 10 skill demonstrations required for Expert level');
      canAdvance = false;
    }

    if (newLevel >= 16 && performanceMetrics.skillDemonstrations < 20) {
      requirements.push('Minimum 20 skill demonstrations required for Professional level');
      canAdvance = false;
    }

    return { canAdvance, requirements };
  }

  /**
   * Generate professional level description for employers
   */
  static generateProfessionalDescription(level: number): string {
    const { levelName, levelCategory } = this.getLevelNameAndCategory(level);
    const benefits = this.getLevelBenefits(level);

    let description = `${levelName}\n\n`;
    
    description += `Professional Level: ${levelCategory}\n`;
    description += `Experience Points: ${(level - 1) * this.XP_PER_LEVEL}+ XP\n\n`;

    description += `Competencies Demonstrated:\n`;
    benefits.recognition.forEach(recognition => {
      description += `• ${recognition}\n`;
    });

    description += `\nProfessional Capabilities:\n`;
    benefits.featureUnlocks.forEach(feature => {
      description += `• ${feature}\n`;
    });

    description += `\nThis level represents demonstrated competency in IT support through practical application, `;
    description += `professional behavior, and successful completion of increasingly complex scenarios. `;
    description += `All advancement is based on actual performance metrics and skill demonstrations.`;

    return description;
  }
}