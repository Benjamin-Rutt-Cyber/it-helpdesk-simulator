import React, { useEffect, useState } from 'react';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Sparkles, TrendingUp, Target } from 'lucide-react';
import { LevelInfo } from '../../types/level';

interface ProgressBarProps {
  levelInfo: LevelInfo;
  animated?: boolean;
  showXPGain?: boolean;
  recentXPGain?: number;
  showMilestones?: boolean;
  upcomingMilestones?: Array<{
    level: number;
    xp: number;
    title: string;
  }>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  levelInfo,
  animated = true,
  showXPGain = false,
  recentXPGain = 0,
  showMilestones = false,
  upcomingMilestones = []
}) => {
  const [displayProgress, setDisplayProgress] = useState(
    animated ? 0 : levelInfo.progressPercentage
  );
  const [displayXP, setDisplayXP] = useState(
    animated ? levelInfo.currentXP - recentXPGain : levelInfo.currentXP
  );

  useEffect(() => {
    if (animated) {
      // Animate progress bar
      const progressTimer = setTimeout(() => {
        setDisplayProgress(levelInfo.progressPercentage);
      }, 300);

      // Animate XP counter
      if (recentXPGain > 0) {
        const xpTimer = setTimeout(() => {
          setDisplayXP(levelInfo.currentXP);
        }, 500);
        return () => {
          clearTimeout(progressTimer);
          clearTimeout(xpTimer);
        };
      }

      return () => clearTimeout(progressTimer);
    }
  }, [levelInfo, animated, recentXPGain]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const nextMilestone = upcomingMilestones[0];

  return (
    <div className="w-full space-y-4">
      {/* Header with Level and XP */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-lg font-bold px-3 py-1">
            Level {levelInfo.currentLevel}
          </Badge>
          <span className="text-lg font-semibold text-gray-700">
            {levelInfo.levelCategory}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {showXPGain && recentXPGain > 0 && (
            <div className="flex items-center space-x-1 text-green-600 animate-pulse">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">+{recentXPGain} XP</span>
            </div>
          )}
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(displayXP)}
            </div>
            <div className="text-xs text-gray-500">Total XP</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">
            Progress to Level {levelInfo.currentLevel + 1}
          </span>
          <span className="text-sm font-semibold text-gray-800">
            {Math.round(displayProgress)}%
          </span>
        </div>
        
        <div className="relative">
          <Progress 
            value={displayProgress} 
            className={`h-6 transition-all duration-1000 ease-out ${
              animated ? 'animate-pulse' : ''
            }`}
          />
          
          {/* Animated sparkles on progress bar */}
          {animated && displayProgress > 0 && (
            <div 
              className="absolute top-0 h-6 flex items-center justify-end pr-2 transition-all duration-1000"
              style={{ width: `${displayProgress}%` }}
            >
              <Sparkles className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>Current: {Math.round(displayXP)} XP</span>
          <span>Next: {levelInfo.totalXPForNextLevel} XP</span>
        </div>
      </div>

      {/* XP Needed */}
      <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="text-3xl font-bold text-blue-600">
          {levelInfo.xpToNextLevel}
        </div>
        <div className="text-sm text-blue-800 font-medium">
          XP needed for next level
        </div>
      </div>

      {/* Upcoming Milestone */}
      {showMilestones && nextMilestone && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800">
              Next Milestone
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold text-purple-900">
                {nextMilestone.title}
              </div>
              <div className="text-sm text-purple-700">
                Level {nextMilestone.level}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-600">
                {nextMilestone.xp - levelInfo.currentXP}
              </div>
              <div className="text-xs text-purple-700">XP away</div>
            </div>
          </div>
          
          {/* Milestone progress */}
          <div className="mt-3">
            <div className="text-xs text-purple-700 mb-1">
              Milestone Progress
            </div>
            <Progress 
              value={(levelInfo.currentXP / nextMilestone.xp) * 100}
              className="h-2 bg-purple-100"
            />
          </div>
        </div>
      )}

      {/* Motivation Message */}
      <div className="text-center text-sm text-gray-600 italic">
        {displayProgress >= 75 
          ? "🔥 Almost there! Keep up the excellent work!"
          : displayProgress >= 50
          ? "🚀 Great progress! You're halfway to the next level!"
          : displayProgress >= 25
          ? "⭐ Good start! Keep building your experience!"
          : "🎯 Every ticket brings you closer to your next level!"
        }
      </div>
    </div>
  );
};

export default ProgressBar;