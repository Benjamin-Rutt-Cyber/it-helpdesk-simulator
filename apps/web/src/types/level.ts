// Level system type definitions

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

export interface PerformanceMetrics {
  averageTicketRating: number;
  completionRate: number;
  professionalismScore: number;
  skillDemonstrations: number;
}

export interface LevelValidation {
  canAdvance: boolean;
  requirements: string[];
}

// Level structure constants
export const LEVEL_STRUCTURE = {
  'Support Trainee': { min: 1, max: 2, xpRange: [0, 199] },
  'Support Technician': { min: 3, max: 5, xpRange: [200, 499] },
  'Support Specialist': { min: 6, max: 8, xpRange: [500, 799] },
  'Support Expert': { min: 9, max: 12, xpRange: [800, 1199] },
  'Senior Support Specialist': { min: 13, max: 15, xpRange: [1200, 1499] },
  'Support Professional': { min: 16, max: 20, xpRange: [1500, 1999] },
  'Support Consultant': { min: 21, max: 25, xpRange: [2000, 2499] },
  'Support Master': { min: 26, max: 30, xpRange: [2500, 2999] }
} as const;

export const XP_PER_LEVEL = 100;
export const MILESTONE_LEVELS = [5, 10, 15, 20, 25, 30];
export const XP_MILESTONES = [500, 1000, 1500, 2000, 2500, 3000];