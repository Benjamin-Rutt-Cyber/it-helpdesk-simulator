import { LevelService, LevelInfo, MilestoneInfo } from './levelService';
import { User } from '../types/User';

export interface AdvancementEvent {
  userId: string;
  previousLevel: number;
  newLevel: number;
  previousXP: number;
  newXP: number;
  timestamp: Date;
  milestones: MilestoneInfo[];
  benefits: string[];
  celebration: AdvancementCelebration;
}

export interface AdvancementCelebration {
  type: 'standard' | 'milestone' | 'major_milestone';
  title: string;
  message: string;
  animation: string;
  rewards: AdvancementReward[];
  shareableContent: ShareableContent;
}

export interface AdvancementReward {
  type: 'badge' | 'certificate' | 'feature_unlock' | 'privilege' | 'recognition';
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ShareableContent {
  title: string;
  description: string;
  imageUrl?: string;
  linkedInPost: string;
  twitterPost: string;
  resumeBulletPoint: string;
}

export class AdvancementManager {
  /**
   * Process level advancement and generate celebration
   */
  static async processAdvancement(
    userId: string,
    previousXP: number,
    newXP: number,
    performanceMetrics: {
      averageTicketRating: number;
      completionRate: number;
      professionalismScore: number;
      skillDemonstrations: number;
    }
  ): Promise<AdvancementEvent | null> {
    const previousLevelInfo = LevelService.calculateLevelInfo(previousXP);
    const newLevelInfo = LevelService.calculateLevelInfo(newXP);

    // No level change
    if (previousLevelInfo.currentLevel === newLevelInfo.currentLevel) {
      return null;
    }

    // Validate advancement requirements
    const validation = LevelService.validateAdvancementRequirements(
      previousLevelInfo.currentLevel,
      newLevelInfo.currentLevel,
      performanceMetrics
    );

    if (!validation.canAdvance) {
      throw new Error(`Level advancement blocked: ${validation.requirements.join(', ')}`);
    }

    // Check for milestones
    const milestones = LevelService.checkForMilestones(newLevelInfo.currentLevel, newXP);

    // Generate benefits list
    const benefits = this.generateBenefitsList(previousLevelInfo.currentLevel, newLevelInfo.currentLevel);

    // Create celebration
    const celebration = this.createCelebration(newLevelInfo, milestones);

    const advancementEvent: AdvancementEvent = {
      userId,
      previousLevel: previousLevelInfo.currentLevel,
      newLevel: newLevelInfo.currentLevel,
      previousXP,
      newXP,
      timestamp: new Date(),
      milestones,
      benefits,
      celebration
    };

    // Log advancement event
    console.log(`User ${userId} advanced from Level ${previousLevelInfo.currentLevel} to Level ${newLevelInfo.currentLevel}`);

    return advancementEvent;
  }

  /**
   * Generate list of new benefits unlocked
   */
  private static generateBenefitsList(previousLevel: number, newLevel: number): string[] {
    const previousBenefits = LevelService.getLevelBenefits(previousLevel);
    const newBenefits = LevelService.getLevelBenefits(newLevel);
    
    const benefits: string[] = [];

    // Find new feature unlocks
    const newFeatures = newBenefits.featureUnlocks.filter(
      feature => !previousBenefits.featureUnlocks.includes(feature)
    );
    benefits.push(...newFeatures.map(feature => `Feature Unlocked: ${feature}`));

    // Find new privileges
    const newPrivileges = newBenefits.privileges.filter(
      privilege => !previousBenefits.privileges.includes(privilege)
    );
    benefits.push(...newPrivileges.map(privilege => `Privilege Granted: ${privilege}`));

    // Find new recognition
    const newRecognition = newBenefits.recognition.filter(
      recognition => !previousBenefits.recognition.includes(recognition)
    );
    benefits.push(...newRecognition.map(recognition => `Recognition Earned: ${recognition}`));

    return benefits;
  }

  /**
   * Create advancement celebration based on level and milestones
   */
  private static createCelebration(levelInfo: LevelInfo, milestones: MilestoneInfo[]): AdvancementCelebration {
    const isMajorMilestone = milestones.some(m => m.type === 'level' && [5, 10, 15, 20, 25, 30].includes(m.level));
    const isMilestone = milestones.length > 0;

    let celebrationType: 'standard' | 'milestone' | 'major_milestone' = 'standard';
    if (isMajorMilestone) {
      celebrationType = 'major_milestone';
    } else if (isMilestone) {
      celebrationType = 'milestone';
    }

    const celebration: AdvancementCelebration = {
      type: celebrationType,
      title: this.getCelebrationTitle(levelInfo, celebrationType),
      message: this.getCelebrationMessage(levelInfo, celebrationType),
      animation: this.getCelebrationAnimation(celebrationType),
      rewards: this.generateRewards(levelInfo, milestones),
      shareableContent: this.generateShareableContent(levelInfo, celebrationType)
    };

    return celebration;
  }

  /**
   * Generate celebration title
   */
  private static getCelebrationTitle(levelInfo: LevelInfo, type: 'standard' | 'milestone' | 'major_milestone'): string {
    switch (type) {
      case 'major_milestone':
        return `🎉 Major Milestone Achieved! 🎉`;
      case 'milestone':
        return `✨ Milestone Reached! ✨`;
      default:
        return `🚀 Level Up! 🚀`;
    }
  }

  /**
   * Generate celebration message
   */
  private static getCelebrationMessage(levelInfo: LevelInfo, type: 'standard' | 'milestone' | 'major_milestone'): string {
    const { levelName, levelCategory } = levelInfo;

    switch (type) {
      case 'major_milestone':
        return `Congratulations! You've reached ${levelName}, a significant milestone in your IT support career. This achievement represents exceptional dedication and professional growth. Your expertise is now recognized at the ${levelCategory} level!`;
      
      case 'milestone':
        return `Outstanding achievement! You've advanced to ${levelName}, reaching an important milestone. Your continued professional development and skill demonstration have earned you recognition as a ${levelCategory}!`;
      
      default:
        return `Excellent progress! You've advanced to ${levelName}. Your dedication to learning and professional development is paying off. Keep up the great work as a ${levelCategory}!`;
    }
  }

  /**
   * Get celebration animation type
   */
  private static getCelebrationAnimation(type: 'standard' | 'milestone' | 'major_milestone'): string {
    switch (type) {
      case 'major_milestone':
        return 'confetti-explosion';
      case 'milestone':
        return 'golden-stars';
      default:
        return 'level-up-pulse';
    }
  }

  /**
   * Generate advancement rewards
   */
  private static generateRewards(levelInfo: LevelInfo, milestones: MilestoneInfo[]): AdvancementReward[] {
    const rewards: AdvancementReward[] = [];

    // Level advancement badge
    rewards.push({
      type: 'badge',
      title: `${levelInfo.levelName} Badge`,
      description: `Achievement badge for reaching ${levelInfo.levelName}`,
      icon: 'level-badge',
      rarity: this.getBadgeRarity(levelInfo.currentLevel)
    });

    // Professional certificate
    if (levelInfo.currentLevel >= 3) {
      rewards.push({
        type: 'certificate',
        title: `${levelInfo.levelCategory} Certificate`,
        description: `Professional certificate demonstrating competency at ${levelInfo.levelCategory} level`,
        icon: 'certificate',
        rarity: this.getCertificateRarity(levelInfo.currentLevel)
      });
    }

    // Milestone rewards
    milestones.forEach(milestone => {
      if (milestone.type === 'level') {
        rewards.push({
          type: 'recognition',
          title: `Level ${milestone.level} Milestone`,
          description: `Special recognition for achieving Level ${milestone.level} milestone`,
          icon: 'milestone-trophy',
          rarity: 'epic'
        });
      }
    });

    // Feature unlock notifications
    const benefits = LevelService.getLevelBenefits(levelInfo.currentLevel);
    if (benefits.featureUnlocks.length > 0) {
      rewards.push({
        type: 'feature_unlock',
        title: 'New Features Unlocked',
        description: `Access granted to ${benefits.featureUnlocks.length} new features`,
        icon: 'feature-unlock',
        rarity: 'rare'
      });
    }

    return rewards;
  }

  /**
   * Determine badge rarity based on level
   */
  private static getBadgeRarity(level: number): 'common' | 'rare' | 'epic' | 'legendary' {
    if (level >= 25) return 'legendary';
    if (level >= 15) return 'epic';
    if (level >= 6) return 'rare';
    return 'common';
  }

  /**
   * Determine certificate rarity based on level
   */
  private static getCertificateRarity(level: number): 'common' | 'rare' | 'epic' | 'legendary' {
    if (level >= 20) return 'legendary';
    if (level >= 10) return 'epic';
    if (level >= 5) return 'rare';
    return 'common';
  }

  /**
   * Generate shareable content for social media and professional use
   */
  private static generateShareableContent(levelInfo: LevelInfo, type: 'standard' | 'milestone' | 'major_milestone'): ShareableContent {
    const { levelName, levelCategory } = levelInfo;

    const shareableContent: ShareableContent = {
      title: `${levelName} Achievement`,
      description: `Professional advancement to ${levelCategory} level in IT Support`,
      linkedInPost: this.generateLinkedInPost(levelInfo, type),
      twitterPost: this.generateTwitterPost(levelInfo, type),
      resumeBulletPoint: this.generateResumeBulletPoint(levelInfo)
    };

    return shareableContent;
  }

  /**
   * Generate LinkedIn post content
   */
  private static generateLinkedInPost(levelInfo: LevelInfo, type: 'standard' | 'milestone' | 'major_milestone'): string {
    const { levelName, levelCategory } = levelInfo;
    
    let post = `🎉 Excited to share that I've advanced to ${levelName} in my IT Support professional development! `;
    
    if (type === 'major_milestone') {
      post += `This major milestone represents significant growth in my technical expertise and professional capabilities. `;
    }
    
    post += `This achievement demonstrates my commitment to continuous learning and excellence in IT support. `;
    post += `Grateful for the opportunity to grow and develop my skills in this dynamic field. `;
    post += `\n\n#ITSupport #ProfessionalDevelopment #TechCertification #CareerGrowth #ContinuousLearning`;

    return post;
  }

  /**
   * Generate Twitter post content
   */
  private static generateTwitterPost(levelInfo: LevelInfo, type: 'standard' | 'milestone' | 'major_milestone'): string {
    const { levelName } = levelInfo;
    
    let post = `🚀 Just reached ${levelName} in my IT Support journey! `;
    
    if (type === 'major_milestone') {
      post += `Major milestone unlocked! 🎉 `;
    }
    
    post += `Excited to continue growing my technical expertise. #ITSupport #TechGrowth #ProfessionalDevelopment`;

    return post;
  }

  /**
   * Generate resume bullet point
   */
  private static generateResumeBulletPoint(levelInfo: LevelInfo): string {
    const { levelName, levelCategory } = levelInfo;
    
    return `• Achieved ${levelName} certification, demonstrating advanced competency in ${levelCategory} through practical application and professional skill development`;
  }

  /**
   * Generate advancement notification for immediate display
   */
  static generateAdvancementNotification(advancementEvent: AdvancementEvent): {
    title: string;
    message: string;
    type: 'success' | 'achievement' | 'milestone';
    duration: number;
    actions: Array<{ label: string; action: string }>;
  } {
    const { celebration, newLevel, milestones } = advancementEvent;
    
    return {
      title: celebration.title,
      message: celebration.message,
      type: celebration.type === 'major_milestone' ? 'milestone' : 'achievement',
      duration: celebration.type === 'major_milestone' ? 10000 : 5000,
      actions: [
        { label: 'View Benefits', action: 'view_benefits' },
        { label: 'Share Achievement', action: 'share_achievement' },
        ...(milestones.length > 0 ? [{ label: 'View Milestones', action: 'view_milestones' }] : [])
      ]
    };
  }
}