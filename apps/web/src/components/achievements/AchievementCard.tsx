import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Trophy, 
  Star, 
  Award, 
  Shield, 
  Target,
  Users,
  BookOpen,
  Lightbulb,
  Lock,
  TrendingUp
} from 'lucide-react';
import { Achievement, UserAchievement, AchievementTier, AchievementCategory } from '../../types/achievements';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: {
    percentage: number;
    currentValue: number;
    targetValue: number;
    nextTier?: AchievementTier;
  };
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'earned' | 'in_progress' | 'locked';
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  userAchievement,
  progress,
  showProgress = true,
  size = 'medium',
  variant = userAchievement ? 'earned' : progress ? 'in_progress' : 'locked'
}) => {
  const getCategoryIcon = (category: AchievementCategory) => {
    const iconClass = "h-6 w-6";
    switch (category) {
      case AchievementCategory.TECHNICAL_SKILLS:
        return <Shield className={iconClass} />;
      case AchievementCategory.CUSTOMER_SERVICE:
        return <Users className={iconClass} />;
      case AchievementCategory.PROFESSIONAL_BEHAVIOR:
        return <Award className={iconClass} />;
      case AchievementCategory.LEADERSHIP:
        return <Star className={iconClass} />;
      case AchievementCategory.LEARNING:
        return <BookOpen className={iconClass} />;
      default:
        return <Target className={iconClass} />;
    }
  };

  const getTierColor = (tier: AchievementTier) => {
    switch (tier) {
      case AchievementTier.PLATINUM:
        return 'from-cyan-400 to-blue-500';
      case AchievementTier.GOLD:
        return 'from-yellow-400 to-orange-500';
      case AchievementTier.SILVER:
        return 'from-gray-300 to-gray-500';
      case AchievementTier.BRONZE:
        return 'from-orange-400 to-red-500';
      default:
        return 'from-gray-200 to-gray-400';
    }
  };

  const getTierBadgeColor = (tier: AchievementTier) => {
    switch (tier) {
      case AchievementTier.PLATINUM:
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case AchievementTier.GOLD:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case AchievementTier.SILVER:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case AchievementTier.BRONZE:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getRarityIndicator = (rarity: string) => {
    const indicators = {
      common: { color: 'bg-gray-400', glow: '' },
      uncommon: { color: 'bg-green-400', glow: 'shadow-green-200' },
      rare: { color: 'bg-blue-400', glow: 'shadow-blue-200' },
      epic: { color: 'bg-purple-400', glow: 'shadow-purple-200' },
      legendary: { color: 'bg-yellow-400', glow: 'shadow-yellow-200 animate-pulse' }
    };
    return indicators[rarity] || indicators.common;
  };

  const cardSize = {
    small: 'w-64 h-40',
    medium: 'w-80 h-56',
    large: 'w-96 h-72'
  };

  const earnedTier = userAchievement?.tier || AchievementTier.BRONZE;
  const targetTier = progress?.nextTier || AchievementTier.BRONZE;
  const displayTier = variant === 'earned' ? earnedTier : targetTier;

  const rarityStyle = getRarityIndicator(achievement.rarity);

  const cardVariantStyles = {
    earned: `border-2 ${rarityStyle.glow} shadow-lg`,
    in_progress: 'border border-blue-200 shadow-md',
    locked: 'border border-gray-200 opacity-75'
  };

  return (
    <Card className={`${cardSize[size]} ${cardVariantStyles[variant]} transition-all duration-300 hover:scale-105 relative overflow-hidden`}>
      {/* Rarity indicator */}
      <div className={`absolute top-0 right-0 w-4 h-4 ${rarityStyle.color} rounded-bl-lg`} />
      
      {/* Earned indicator */}
      {variant === 'earned' && (
        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Locked indicator */}
      {variant === 'locked' && (
        <div className="absolute top-2 right-2 bg-gray-400 rounded-full p-1">
          <Lock className="h-4 w-4 text-white" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-gradient-to-r ${getTierColor(displayTier)}`}>
              {getCategoryIcon(achievement.category)}
            </div>
            <div className="flex-1">
              <CardTitle className={`text-lg font-bold ${variant === 'locked' ? 'text-gray-500' : 'text-gray-900'}`}>
                {achievement.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getTierBadgeColor(displayTier)}`}>
                  {displayTier.toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {achievement.category.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className={`text-sm ${variant === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
          {achievement.description}
        </p>

        {/* Professional Value Indicators */}
        <div className="flex flex-wrap gap-1">
          {achievement.professionalValue.skillsDisplayed.slice(0, 3).map((skill, index) => (
            <Badge 
              key={index}
              variant="secondary" 
              className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700"
            >
              {skill}
            </Badge>
          ))}
          {achievement.professionalValue.skillsDisplayed.length > 3 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600">
              +{achievement.professionalValue.skillsDisplayed.length - 3}
            </Badge>
          )}
        </div>

        {/* Progress Section */}
        {showProgress && variant !== 'locked' && (
          <div className="space-y-2">
            {variant === 'earned' && userAchievement ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Earned</span>
                <span className="text-xs text-gray-500">
                  {userAchievement.earnedAt.toLocaleDateString()}
                </span>
              </div>
            ) : progress ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {progress.percentage}%
                  </span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{progress.currentValue}</span>
                  <span>{progress.targetValue}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-2">
                <span className="text-sm text-gray-500">No progress data</span>
              </div>
            )}
          </div>
        )}

        {/* Professional Value */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-600">Professional Value</span>
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(achievement.professionalValue.industryValue / 2)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Earned Date for completed achievements */}
        {variant === 'earned' && userAchievement && size === 'large' && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Earned {userAchievement.earnedAt.toLocaleDateString()}
            </div>
            {userAchievement.evidence.length > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                {userAchievement.evidence.length} evidence item{userAchievement.evidence.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementCard;