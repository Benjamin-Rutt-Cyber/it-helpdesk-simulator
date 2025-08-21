import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Target, 
  Zap,
  Trophy,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Clock
} from 'lucide-react';
import { ProgressData, HistoricalData } from '../../types/dashboard';

interface ProgressWidgetsProps {
  progressData: ProgressData;
  historicalData: HistoricalData;
}

export const ProgressWidgets: React.FC<ProgressWidgetsProps> = ({ 
  progressData, 
  historicalData 
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const getTrendIcon = (direction: 'improving' | 'stable' | 'declining') => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'expert':
        return 'text-purple-600 bg-purple-100';
      case 'advanced':
        return 'text-blue-600 bg-blue-100';
      case 'intermediate':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'text-green-600 bg-green-100';
      case 'at_risk':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe === '7d' ? '7 Days' : 
               timeframe === '30d' ? '30 Days' : 
               timeframe === '90d' ? '90 Days' : '1 Year'}
            </Button>
          ))}
        </div>
      </div>

      {/* XP Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600" />
              Experience Points Progress
            </span>
            <Badge variant="secondary">
              +{progressData.xpProgress.dailyAverage} daily avg
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Main Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Current Progress</span>
                <span className="font-medium">
                  {progressData.xpProgress.current.toLocaleString()} / {progressData.xpProgress.target.toLocaleString()} XP
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progressData.xpProgress.percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {progressData.xpProgress.percentage}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Level {progressData.levelProgress.currentLevel}</span>
                <span>Level {progressData.levelProgress.nextLevel}</span>
              </div>
            </div>

            {/* XP Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-lg font-bold text-yellow-600">
                  {progressData.xpProgress.dailyAverage}
                </p>
                <p className="text-xs text-gray-600">Daily Average</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <p className="text-lg font-bold text-green-600">
                    +{progressData.xpProgress.weeklyTrend}%
                  </p>
                </div>
                <p className="text-xs text-gray-600">Weekly Trend</p>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">
                  {progressData.xpProgress.projection.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">30-Day Projection</p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">
                  {progressData.levelProgress.estimatedTimeToNext}
                </p>
                <p className="text-xs text-gray-600">To Next Level</p>
              </div>
            </div>

            {/* XP History Chart Placeholder */}
            <div className="h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <LineChart className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">XP Progress Chart</p>
                <p className="text-xs">Historical XP tracking visualization</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-blue-600" />
            Level Advancement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Level Display */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Level {progressData.levelProgress.currentLevel}
                </h3>
                <p className="text-sm text-gray-600">
                  {progressData.levelProgress.currentLevelName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Next Level</p>
                <p className="font-semibold">
                  {progressData.levelProgress.nextLevelName}
                </p>
                <Badge variant="outline" className="mt-1">
                  {progressData.levelProgress.estimatedTimeToNext}
                </Badge>
              </div>
            </div>

            {/* Level Benefits */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Current Level Benefits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {progressData.levelProgress.levelBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress to Next Level */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progress to Next Level</span>
                <span className="font-medium">{progressData.levelProgress.progressToNext}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressData.levelProgress.progressToNext}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Skill Development
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressData.skillProgress.map((skill, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{skill.skillName}</h3>
                    <p className="text-sm text-gray-500">{skill.category}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSkillLevelColor(skill.currentLevel)}>
                      {skill.currentLevel}
                    </Badge>
                    {getTrendIcon(skill.trendDirection)}
                  </div>
                </div>

                {/* Skill Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Proficiency</span>
                    <span className="font-medium">{skill.progressScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${skill.progressScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Recent activity: {skill.recentActivity} actions</span>
                    <span className="capitalize">{skill.trendDirection}</span>
                  </div>
                </div>

                {/* Next Milestone */}
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium text-gray-700">Next milestone: </span>
                  <span className="text-gray-600">{skill.nextMilestone}</span>
                </div>
              </div>
            ))}

            {/* Skills Radar Chart Placeholder */}
            <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <PieChart className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Skills Radar Chart</p>
                <p className="text-xs">Multi-dimensional skill assessment visualization</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Goal Progress Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressData.goalProgress.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No active goals</p>
                <Button variant="outline" size="sm">
                  Set Your First Goal
                </Button>
              </div>
            ) : (
              progressData.goalProgress.map((goal, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-500">{goal.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getGoalStatusColor(goal.status)}>
                        {goal.status.replace('_', ' ')}
                      </Badge>
                      <div className="text-right text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {goal.dueDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Goal Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {goal.currentValue} / {goal.targetValue} ({goal.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          goal.status === 'on_track' ? 'bg-green-500' :
                          goal.status === 'at_risk' ? 'bg-yellow-500' :
                          goal.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Category: {goal.category}</span>
                      <span>Est. completion: {goal.estimatedCompletion.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-indigo-600" />
            Weekly Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* XP Earned */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progressData.weeklyProgress.xpEarned}
              </p>
              <p className="text-sm text-gray-600 mb-1">XP Earned</p>
              <div className="flex items-center justify-center text-xs">
                {progressData.weeklyProgress.comparisonToPrevious.xpChange > 0 ? (
                  <>
                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600">
                      +{progressData.weeklyProgress.comparisonToPrevious.xpChange}
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600">
                      {progressData.weeklyProgress.comparisonToPrevious.xpChange}
                    </span>
                  </>
                )}
                <span className="text-gray-500 ml-1">vs last week</span>
              </div>
            </div>

            {/* Achievements */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progressData.weeklyProgress.achievementsUnlocked}
              </p>
              <p className="text-sm text-gray-600 mb-1">Achievements</p>
              <div className="flex items-center justify-center text-xs">
                {progressData.weeklyProgress.comparisonToPrevious.achievementChange > 0 ? (
                  <>
                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600">
                      +{progressData.weeklyProgress.comparisonToPrevious.achievementChange}
                    </span>
                  </>
                ) : progressData.weeklyProgress.comparisonToPrevious.achievementChange < 0 ? (
                  <>
                    <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600">
                      {progressData.weeklyProgress.comparisonToPrevious.achievementChange}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Same as last week</span>
                )}
              </div>
            </div>

            {/* Goals Completed */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progressData.weeklyProgress.goalsCompleted}
              </p>
              <p className="text-sm text-gray-600 mb-1">Goals Completed</p>
              <p className="text-xs text-gray-500">This week</p>
            </div>

            {/* Skill Improvements */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progressData.weeklyProgress.skillImprovements}
              </p>
              <p className="text-sm text-gray-600 mb-1">Skill Improvements</p>
              <div className="flex items-center justify-center text-xs">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600">
                  +{progressData.weeklyProgress.comparisonToPrevious.improvementRate}%
                </span>
                <span className="text-gray-500 ml-1">improvement rate</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressWidgets;