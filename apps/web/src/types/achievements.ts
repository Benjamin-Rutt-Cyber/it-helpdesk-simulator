// Achievement system type definitions

export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  criteria: AchievementCriteria;
  rarity: AchievementRarity;
  professionalValue: ProfessionalValue;
  portfolioDescription: string;
  resumeBulletPoint: string;
}

export interface UserAchievement {
  achievementId: string;
  userId: string;
  earnedAt: Date;
  tier: AchievementTier;
  progress: AchievementProgress;
  evidence: AchievementEvidence[];
  celebrationShown: boolean;
}

export enum AchievementCategory {
  TECHNICAL_SKILLS = 'technical_skills',
  CUSTOMER_SERVICE = 'customer_service',
  PROFESSIONAL_BEHAVIOR = 'professional_behavior',
  LEADERSHIP = 'leadership',
  LEARNING = 'learning'
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface AchievementCriteria {
  type: 'count' | 'percentage' | 'streak' | 'quality' | 'speed' | 'composite';
  requirements: {
    bronze: CriteriaRequirement;
    silver: CriteriaRequirement;
    gold: CriteriaRequirement;
    platinum?: CriteriaRequirement;
  };
}

export interface CriteriaRequirement {
  threshold: number;
  timeframe?: string; // e.g., '30d', '7d', 'lifetime'
  conditions?: Record<string, any>;
  sustainedPeriod?: string; // For streak-based achievements
}

export interface AchievementProgress {
  currentValue: number;
  targetValue: number;
  percentage: number;
  streakCount?: number;
  bestValue?: number;
  recentActivity: ProgressActivity[];
}

export interface ProgressActivity {
  date: Date;
  value: number;
  context: string;
  ticketId?: string;
}

export interface AchievementEvidence {
  type: 'ticket' | 'performance_metric' | 'customer_feedback' | 'peer_review';
  reference: string;
  value: number;
  date: Date;
  description: string;
}

export interface ProfessionalValue {
  skillsDisplayed: string[];
  competencyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  careerRelevance: 'entry' | 'mid' | 'senior' | 'leadership';
  industryValue: number; // 1-10 scale
  certificationsSupported: string[];
}

export interface AchievementTracking {
  userId: string;
  achievementId: string;
  currentProgress: AchievementProgress;
  tierProgression: TierProgression;
  recentActivity: ProgressActivity[];
  nextMilestone: NextMilestone;
  eligibilityStatus: EligibilityStatus;
}

export interface TierProgression {
  currentTier?: AchievementTier;
  nextTier?: AchievementTier;
  progressToNext: number;
  requirementsForNext: string[];
  completedTiers: AchievementTier[];
}

export interface NextMilestone {
  tier: AchievementTier;
  description: string;
  progressNeeded: number;
  estimatedCompletion?: Date;
  recommendedActions: string[];
}

export interface EligibilityStatus {
  eligible: boolean;
  tier?: AchievementTier;
  blockers: string[];
  requirements: string[];
  progress: number;
}

export interface AchievementMetrics {
  totalAchievements: number;
  achievementsByTier: Record<AchievementTier, number>;
  achievementsByCategory: Record<string, number>;
  professionalValue: number;
  portfolioStrength: number;
  recentEarnings: UserAchievement[];
}

export interface AchievementCelebration {
  title: string;
  message: string;
  rarity: string;
  professionalImpact: string;
  shareableContent: ShareableAchievementContent;
  rewards: AchievementReward[];
}

export interface ShareableAchievementContent {
  linkedIn: string;
  twitter: string;
  resumeLine: string;
  certificate?: string;
}

export interface AchievementReward {
  type: 'badge' | 'certificate' | 'feature_unlock' | 'recognition';
  title: string;
  description: string;
  value: any;
}

// Constants
export const ACHIEVEMENT_TIERS = [
  AchievementTier.BRONZE,
  AchievementTier.SILVER,
  AchievementTier.GOLD,
  AchievementTier.PLATINUM
];

export const ACHIEVEMENT_CATEGORIES = [
  AchievementCategory.TECHNICAL_SKILLS,
  AchievementCategory.CUSTOMER_SERVICE,
  AchievementCategory.PROFESSIONAL_BEHAVIOR,
  AchievementCategory.LEADERSHIP,
  AchievementCategory.LEARNING
];

export const ACHIEVEMENT_RARITIES = [
  AchievementRarity.COMMON,
  AchievementRarity.UNCOMMON,
  AchievementRarity.RARE,
  AchievementRarity.EPIC,
  AchievementRarity.LEGENDARY
];