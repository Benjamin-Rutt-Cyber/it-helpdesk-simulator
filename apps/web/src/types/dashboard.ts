export interface DashboardData {
  overview: DashboardOverview;
  progress: ProgressData;
  achievements: AchievementData;
  insights: InsightData;
  goals: GoalData;
  historical: HistoricalData;
}

export interface DashboardOverview {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  progressPercentage: number;
  recentAchievements: number;
  activeGoals: number;
  professionalValue: number;
  lastUpdateTime: Date;
}

export interface ProgressData {
  xpProgress: XPProgress;
  levelProgress: LevelProgress;
  skillProgress: SkillProgress[];
  goalProgress: GoalProgress[];
  weeklyProgress: WeeklyProgress;
}

export interface XPProgress {
  current: number;
  target: number;
  percentage: number;
  dailyAverage: number;
  weeklyTrend: number;
  projection: number;
}

export interface LevelProgress {
  currentLevel: number;
  currentLevelName: string;
  nextLevel: number;
  nextLevelName: string;
  progressToNext: number;
  estimatedTimeToNext: string;
  levelBenefits: string[];
}

export interface SkillProgress {
  skillName: string;
  category: string;
  currentLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  progressScore: number;
  recentActivity: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  nextMilestone: string;
}

export interface GoalProgress {
  goalId: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  percentage: number;
  dueDate: Date;
  status: 'on_track' | 'at_risk' | 'overdue' | 'completed';
  estimatedCompletion: Date;
}

export interface WeeklyProgress {
  xpEarned: number;
  achievementsUnlocked: number;
  goalsCompleted: number;
  skillImprovements: number;
  comparisonToPrevious: {
    xpChange: number;
    achievementChange: number;
    improvementRate: number;
  };
}

export interface AchievementData {
  totalAchievements: number;
  recentAchievements: any[];
  progressingAchievements: AchievementProgress[];
  recommendations: AchievementRecommendations;
  categoryBreakdown: CategoryBreakdown[];
  rareAchievements: any[];
}

export interface AchievementProgress {
  achievementId: string;
  name: string;
  category: string;
  currentProgress: number;
  targetProgress: number;
  percentage: number;
  estimatedCompletion: string;
  nextMilestone: string;
}

export interface AchievementRecommendations {
  nearCompletion: AchievementProgress[];
  recommended: AchievementProgress[];
  beginner: AchievementProgress[];
}

export interface CategoryBreakdown {
  category: string;
  totalAchievements: number;
  completedAchievements: number;
  averageTier: string;
  professionalValue: number;
}

export interface InsightData {
  strengths: StrengthInsight[];
  improvements: ImprovementInsight[];
  recommendations: RecommendationInsight[];
  performanceTrend: PerformanceTrend;
  comparison: ComparisonData;
}

export interface StrengthInsight {
  area: string;
  score: number;
  description: string;
  evidence: string[];
  professionalImpact: string;
}

export interface ImprovementInsight {
  area: string;
  currentScore: number;
  targetScore: number;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
  estimatedTimeframe: string;
}

export interface RecommendationInsight {
  type: 'skill' | 'goal' | 'achievement' | 'learning';
  title: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  actionUrl?: string;
}

export interface PerformanceTrend {
  direction: 'improving' | 'stable' | 'declining';
  magnitude: number;
  timeframe: string;
  keyFactors: string[];
  prediction: string;
}

export interface ComparisonData {
  percentile: number;
  averageComparison: string;
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface GoalData {
  activeGoals: Goal[];
  completedGoals: Goal[];
  recommendations: GoalRecommendation[];
  progress: GoalProgressSummary;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'xp' | 'level' | 'skill' | 'achievement' | 'professional';
  targetValue: number;
  currentValue: number;
  targetDate: Date;
  createdDate: Date;
  status: 'active' | 'completed' | 'paused' | 'expired';
  priority: 'high' | 'medium' | 'low';
  milestones: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedDate?: Date;
}

export interface GoalRecommendation {
  type: string;
  title: string;
  description: string;
  suggestedTargetValue: number;
  suggestedTimeframe: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  professionalImpact: string;
}

export interface GoalProgressSummary {
  totalActiveGoals: number;
  onTrackGoals: number;
  atRiskGoals: number;
  completedThisMonth: number;
  averageCompletionRate: number;
}

export interface HistoricalData {
  xpHistory: HistoricalPoint[];
  levelHistory: HistoricalPoint[];
  achievementHistory: HistoricalPoint[];
  skillHistory: SkillHistoricalData[];
  goalHistory: GoalHistoricalData[];
  performanceHistory: PerformanceHistoricalData[];
}

export interface HistoricalPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface SkillHistoricalData {
  skillName: string;
  category: string;
  history: HistoricalPoint[];
  improvementRate: number;
}

export interface GoalHistoricalData {
  month: string;
  goalsSet: number;
  goalsCompleted: number;
  completionRate: number;
}

export interface PerformanceHistoricalData {
  period: string;
  overallScore: number;
  categoryScores: { [category: string]: number };
  improvements: string[];
  challenges: string[];
}

export interface DashboardCustomization {
  layout: 'standard' | 'compact' | 'detailed';
  widgets: {
    overview: boolean;
    progress: boolean;
    achievements: boolean;
    insights: boolean;
    goals: boolean;
  };
  theme: 'professional' | 'modern' | 'minimal';
  chartTypes: {
    progress: 'bar' | 'line' | 'circular';
    skills: 'radar' | 'bar' | 'horizontal';
    achievements: 'grid' | 'list' | 'timeline';
  };
}