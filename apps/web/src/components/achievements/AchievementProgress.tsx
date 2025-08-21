import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Star,
  Lightbulb
} from 'lucide-react';
import { AchievementTracking, NextMilestone } from '../../types/achievements';

interface AchievementProgressProps {
  tracking: AchievementTracking;
  onViewDetails?: (achievementId: string) => void;
  onViewRecommendations?: (achievementId: string) => void;
  showRecommendations?: boolean;
}

export const AchievementProgress: React.FC<AchievementProgressProps> = ({
  tracking,
  onViewDetails,
  onViewRecommendations,
  showRecommendations = true
}) => {
  const { currentProgress, tierProgression, nextMilestone, eligibilityStatus } = tracking;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'gold':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'silver':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'bronze':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const formatEstimatedCompletion = (date?: Date) => {
    if (!date) return 'No estimate';
    
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Ready now!';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Achievement Progress</CardTitle>
              <p className="text-sm text-gray-600">Track your journey toward earning achievements</p>
            </div>
          </div>
          {eligibilityStatus.eligible && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">Ready to Earn!</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Progress</h3>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {currentProgress.percentage}%
            </Badge>
          </div>

          <div className="space-y-2">
            <Progress 
              value={currentProgress.percentage} 
              className="h-4"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{currentProgress.currentValue}</span>
              <span className="font-medium">
                {currentProgress.targetValue - currentProgress.currentValue} remaining
              </span>
              <span>{currentProgress.targetValue}</span>
            </div>
          </div>

          {currentProgress.streakCount && (
            <div className="flex items-center space-x-2 text-orange-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                {currentProgress.streakCount} day streak
              </span>
            </div>
          )}
        </div>

        {/* Tier Progression */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tier Progression</h3>
          
          <div className="grid grid-cols-4 gap-2">
            {['bronze', 'silver', 'gold', 'platinum'].map((tier) => {
              const isCompleted = tierProgression.completedTiers.includes(tier as any);
              const isCurrent = tierProgression.currentTier === tier;
              const isNext = tierProgression.nextTier === tier;
              
              return (
                <div
                  key={tier}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    isCompleted 
                      ? `${getTierColor(tier)} border-opacity-100`
                      : isCurrent
                      ? 'border-blue-500 bg-blue-50'
                      : isNext
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {isCompleted ? (
                      <Trophy className="h-5 w-5" />
                    ) : isCurrent ? (
                      <Target className="h-5 w-5 text-blue-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="text-xs font-semibold capitalize">{tier}</div>
                  {isNext && (
                    <div className="text-xs text-gray-600 mt-1">
                      {tierProgression.progressToNext}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Milestone */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Next Milestone</h3>
          
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Badge className={getTierColor(nextMilestone.tier)}>
                  {nextMilestone.tier.toUpperCase()}
                </Badge>
                <h4 className="font-semibold text-gray-900">{nextMilestone.description}</h4>
              </div>
              {nextMilestone.estimatedCompletion && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatEstimatedCompletion(nextMilestone.estimatedCompletion)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress needed</span>
                <span className="font-semibold">{nextMilestone.progressNeeded}%</span>
              </div>
              <Progress 
                value={100 - nextMilestone.progressNeeded} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        {showRecommendations && nextMilestone.recommendedActions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
              Recommended Actions
            </h3>
            
            <div className="space-y-2">
              {nextMilestone.recommendedActions.slice(0, 3).map((action, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-700">{action}</span>
                </div>
              ))}
            </div>

            {nextMilestone.recommendedActions.length > 3 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewRecommendations?.(tracking.achievementId)}
                className="w-full"
              >
                View All Recommendations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {currentProgress.recentActivity.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {currentProgress.recentActivity.slice(0, 5).map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">{activity.context}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <span>+{activity.value}</span>
                    <span>{activity.date.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eligibility Status */}
        {eligibilityStatus.blockers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-600">Requirements</h3>
            
            <div className="space-y-2">
              {eligibilityStatus.blockers.map((blocker, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">{blocker}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-100">
          <Button 
            onClick={() => onViewDetails?.(tracking.achievementId)}
            className="flex-1"
          >
            View Details
          </Button>
          {eligibilityStatus.eligible && (
            <Button 
              variant="outline" 
              className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Claim Achievement
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementProgress;