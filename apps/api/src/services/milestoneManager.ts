import { MilestoneInfo } from './levelService';

export interface MilestoneCategory {
  type: 'level' | 'xp' | 'skill' | 'professional' | 'engagement';
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface MilestoneReward {
  type: 'badge' | 'certificate' | 'feature_unlock' | 'recognition' | 'privilege';
  title: string;
  description: string;
  value: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface MilestoneCelebration {
  title: string;
  message: string;
  animation: 'standard' | 'golden' | 'epic' | 'legendary';
  duration: number;
  shareText: string;
  certificateTemplate: string;
}

export class MilestoneManager {
  private static readonly MILESTONE_CATEGORIES: Record<string, MilestoneCategory> = {
    level: {
      type: 'level',
      name: 'Level Milestones',
      description: 'Significant level achievements',
      icon: 'trophy',
      color: 'gold'
    },
    xp: {
      type: 'xp',
      name: 'Experience Milestones',
      description: 'Major experience point achievements',
      icon: 'star',
      color: 'blue'
    },
    skill: {
      type: 'skill',
      name: 'Skill Milestones',
      description: 'Skill competency achievements',
      icon: 'target',
      color: 'green'
    },
    professional: {
      type: 'professional',
      name: 'Professional Milestones',
      description: 'Professional development achievements',
      icon: 'award',
      color: 'purple'
    },
    engagement: {
      type: 'engagement',
      name: 'Engagement Milestones',
      description: 'Sustained engagement achievements',
      icon: 'flame',
      color: 'orange'
    }
  };

  /**
   * Define all milestone achievements
   */
  private static readonly MILESTONE_DEFINITIONS = [
    // Level Milestones
    { 
      level: 5, 
      xp: 400, 
      type: 'level' as const, 
      title: 'Support Technician Master', 
      description: 'Achieved Level 5 - Advanced to Support Technician mastery',
      rewards: ['Support Technician Master Badge', 'Professional Recognition Certificate', 'Advanced Scenario Access'],
      celebrationLevel: 'golden'
    },
    { 
      level: 10, 
      xp: 900, 
      type: 'level' as const, 
      title: 'Support Expert', 
      description: 'Achieved Level 10 - Advanced to Support Expert level',
      rewards: ['Support Expert Badge', 'Expert Recognition Certificate', 'Mentorship Opportunities', 'Advanced Analytics Access'],
      celebrationLevel: 'epic'
    },
    { 
      level: 15, 
      xp: 1400, 
      type: 'level' as const, 
      title: 'Senior Specialist', 
      description: 'Achieved Level 15 - Advanced to Senior Support Specialist',
      rewards: ['Senior Specialist Badge', 'Leadership Recognition', 'Performance Coaching Access', 'Beta Feature Access'],
      celebrationLevel: 'epic'
    },
    { 
      level: 20, 
      xp: 1900, 
      type: 'level' as const, 
      title: 'Support Professional', 
      description: 'Achieved Level 20 - Advanced to Support Professional level',
      rewards: ['Support Professional Badge', 'Professional Certification Eligible', 'Mentoring Program Access', 'Industry Recognition'],
      celebrationLevel: 'legendary'
    },
    { 
      level: 25, 
      xp: 2400, 
      type: 'level' as const, 
      title: 'Support Consultant', 
      description: 'Achieved Level 25 - Advanced to Support Consultant level',
      rewards: ['Support Consultant Badge', 'Industry Consultant Recognition', 'Expert Community Access', 'Advanced Leadership Tools'],
      celebrationLevel: 'legendary'
    },
    { 
      level: 30, 
      xp: 2900, 
      type: 'level' as const, 
      title: 'Support Master', 
      description: 'Achieved Level 30 - Advanced to Support Master level',
      rewards: ['Support Master Badge', 'Master-Level Recognition', 'Elite Community Access', 'Industry Expert Status'],
      celebrationLevel: 'legendary'
    },

    // XP Milestones
    { 
      level: 6, 
      xp: 500, 
      type: 'xp' as const, 
      title: '500 XP Achievement', 
      description: 'Accumulated 500 experience points through dedicated practice',
      rewards: ['Experience Warrior Badge', '500 XP Certificate'],
      celebrationLevel: 'standard'
    },
    { 
      level: 11, 
      xp: 1000, 
      type: 'xp' as const, 
      title: '1000 XP Achievement', 
      description: 'Accumulated 1000 experience points - significant dedication milestone',
      rewards: ['Experience Master Badge', '1000 XP Certificate', 'Dedication Recognition'],
      celebrationLevel: 'golden'
    },
    { 
      level: 16, 
      xp: 1500, 
      type: 'xp' as const, 
      title: '1500 XP Achievement', 
      description: 'Accumulated 1500 experience points - professional excellence milestone',
      rewards: ['Experience Expert Badge', '1500 XP Certificate', 'Professional Excellence Award'],
      celebrationLevel: 'epic'
    },
    { 
      level: 21, 
      xp: 2000, 
      type: 'xp' as const, 
      title: '2000 XP Achievement', 
      description: 'Accumulated 2000 experience points - elite performance milestone',
      rewards: ['Experience Elite Badge', '2000 XP Certificate', 'Elite Performance Recognition'],
      celebrationLevel: 'legendary'
    },
    { 
      level: 26, 
      xp: 2500, 
      type: 'xp' as const, 
      title: '2500 XP Achievement', 
      description: 'Accumulated 2500 experience points - mastery milestone',
      rewards: ['Experience Legend Badge', '2500 XP Certificate', 'Mastery Recognition'],
      celebrationLevel: 'legendary'
    }
  ];

  /**
   * Check for milestone achievements
   */
  static checkMilestoneAchievements(
    newLevel: number, 
    newXP: number, 
    previousLevel: number, 
    previousXP: number
  ): MilestoneInfo[] {
    const achievements: MilestoneInfo[] = [];

    // Check each milestone definition
    for (const milestone of this.MILESTONE_DEFINITIONS) {
      const wasAchieved = this.wasMilestoneAlreadyAchieved(milestone, previousLevel, previousXP);
      const isNowAchieved = this.isMilestoneAchieved(milestone, newLevel, newXP);

      if (!wasAchieved && isNowAchieved) {
        achievements.push({
          level: milestone.level,
          xp: milestone.xp,
          type: milestone.type,
          achieved: true,
          achievedDate: new Date(),
          title: milestone.title,
          description: milestone.description,
          rewards: milestone.rewards
        });
      }
    }

    return achievements;
  }

  /**
   * Check if milestone was already achieved
   */
  private static wasMilestoneAlreadyAchieved(
    milestone: any, 
    previousLevel: number, 
    previousXP: number
  ): boolean {
    if (milestone.type === 'level') {
      return previousLevel >= milestone.level;
    } else if (milestone.type === 'xp') {
      return previousXP >= milestone.xp;
    }
    return false;
  }

  /**
   * Check if milestone is now achieved
   */
  private static isMilestoneAchieved(
    milestone: any, 
    currentLevel: number, 
    currentXP: number
  ): boolean {
    if (milestone.type === 'level') {
      return currentLevel >= milestone.level;
    } else if (milestone.type === 'xp') {
      return currentXP >= milestone.xp;
    }
    return false;
  }

  /**
   * Get upcoming milestones for motivation
   */
  static getUpcomingMilestones(currentLevel: number, currentXP: number): MilestoneInfo[] {
    const upcoming: MilestoneInfo[] = [];

    for (const milestone of this.MILESTONE_DEFINITIONS) {
      const isAchieved = this.isMilestoneAchieved(milestone, currentLevel, currentXP);

      if (!isAchieved) {
        upcoming.push({
          level: milestone.level,
          xp: milestone.xp,
          type: milestone.type,
          achieved: false,
          title: milestone.title,
          description: milestone.description,
          rewards: milestone.rewards
        });
      }
    }

    // Sort by closest to achieve (by XP)
    return upcoming.sort((a, b) => a.xp - b.xp).slice(0, 5);
  }

  /**
   * Generate milestone celebration
   */
  static generateMilestoneCelebration(milestone: MilestoneInfo): MilestoneCelebration {
    const milestoneDefinition = this.MILESTONE_DEFINITIONS.find(
      m => m.level === milestone.level && m.xp === milestone.xp && m.type === milestone.type
    );

    const celebrationLevel = milestoneDefinition?.celebrationLevel || 'standard';

    return {
      title: this.getCelebrationTitle(milestone, celebrationLevel),
      message: this.getCelebrationMessage(milestone, celebrationLevel),
      animation: celebrationLevel,
      duration: this.getCelebrationDuration(celebrationLevel),
      shareText: this.generateShareText(milestone),
      certificateTemplate: this.generateCertificateTemplate(milestone)
    };
  }

  /**
   * Generate celebration title
   */
  private static getCelebrationTitle(milestone: MilestoneInfo, level: string): string {
    switch (level) {
      case 'legendary':
        return `🏆 LEGENDARY MILESTONE ACHIEVED! 🏆`;
      case 'epic':
        return `⭐ EPIC MILESTONE REACHED! ⭐`;
      case 'golden':
        return `🥇 GOLDEN MILESTONE UNLOCKED! 🥇`;
      default:
        return `🎯 Milestone Achieved! 🎯`;
    }
  }

  /**
   * Generate celebration message
   */
  private static getCelebrationMessage(milestone: MilestoneInfo, level: string): string {
    const baseMessage = `Congratulations on achieving the ${milestone.title}! ${milestone.description}`;

    switch (level) {
      case 'legendary':
        return `${baseMessage} This is a truly exceptional achievement that demonstrates your commitment to excellence and professional mastery. Your dedication has reached legendary status!`;
      case 'epic':
        return `${baseMessage} This epic achievement showcases your outstanding progress and dedication to professional development. You're setting an inspiring example!`;
      case 'golden':
        return `${baseMessage} This golden milestone represents significant progress in your professional journey. Your hard work and dedication are paying off beautifully!`;
      default:
        return `${baseMessage} This milestone marks an important step in your professional development journey. Keep up the excellent work!`;
    }
  }

  /**
   * Get celebration duration
   */
  private static getCelebrationDuration(level: string): number {
    switch (level) {
      case 'legendary':
        return 15000; // 15 seconds
      case 'epic':
        return 10000; // 10 seconds
      case 'golden':
        return 8000;  // 8 seconds
      default:
        return 5000;  // 5 seconds
    }
  }

  /**
   * Generate share text for social media
   */
  private static generateShareText(milestone: MilestoneInfo): string {
    return `🎉 Just achieved the ${milestone.title} milestone! ${milestone.description} Excited to continue growing my IT support expertise! #ITSupport #ProfessionalDevelopment #Milestone`;
  }

  /**
   * Generate certificate template
   */
  private static generateCertificateTemplate(milestone: MilestoneInfo): string {
    return `
    CERTIFICATE OF ACHIEVEMENT
    
    This certifies that the recipient has successfully achieved the
    
    ${milestone.title.toUpperCase()}
    
    ${milestone.description}
    
    Achievement Date: ${milestone.achievedDate?.toLocaleDateString()}
    Experience Points: ${milestone.xp}
    Level: ${milestone.level}
    
    This milestone represents demonstrated competency and dedication
    to professional development in IT Support.
    
    Rewards Earned:
    ${milestone.rewards.map(reward => `• ${reward}`).join('\n    ')}
    `;
  }

  /**
   * Get milestone category information
   */
  static getMilestoneCategory(type: string): MilestoneCategory | undefined {
    return this.MILESTONE_CATEGORIES[type];
  }

  /**
   * Get all milestone categories
   */
  static getAllMilestoneCategories(): MilestoneCategory[] {
    return Object.values(this.MILESTONE_CATEGORIES);
  }

  /**
   * Get milestone progress summary
   */
  static getMilestoneProgressSummary(currentLevel: number, currentXP: number): {
    totalMilestones: number;
    achievedMilestones: number;
    upcomingMilestones: number;
    nextMilestone?: MilestoneInfo;
  } {
    const totalMilestones = this.MILESTONE_DEFINITIONS.length;
    let achievedMilestones = 0;

    for (const milestone of this.MILESTONE_DEFINITIONS) {
      if (this.isMilestoneAchieved(milestone, currentLevel, currentXP)) {
        achievedMilestones++;
      }
    }

    const upcomingMilestones = totalMilestones - achievedMilestones;
    const nextMilestone = this.getUpcomingMilestones(currentLevel, currentXP)[0];

    return {
      totalMilestones,
      achievedMilestones,
      upcomingMilestones,
      nextMilestone
    };
  }
}