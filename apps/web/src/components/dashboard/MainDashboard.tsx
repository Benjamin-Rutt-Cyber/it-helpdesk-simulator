import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Award,
  Settings,
  Share2,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Star,
  Lightbulb,
  Users,
  Crown,
  Zap
} from 'lucide-react';
import { DashboardData } from '../../types/dashboard';
import { ProgressWidgets } from './ProgressWidgets';
import { CustomizationPanel } from './CustomizationPanel';
import { InsightsPanel } from './InsightsPanel';
import { GoalTracker } from './GoalTracker';

interface MainDashboardProps {
  userId: string;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'progress' | 'achievements' | 'insights' | 'goals'>('overview');
  const [showCustomization, setShowCustomization] = useState(false);
  const [customization, setCustomization] = useState({
    layout: 'standard',
    widgets: {
      overview: true,
      progress: true,
      achievements: true,
      insights: true,
      goals: true
    },
    theme: 'professional'
  });

  useEffect(() => {
    fetchDashboardData();
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/dashboard/data?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Mock dashboard data for development
        setDashboardData(getMockDashboardData());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use mock data on error
      setDashboardData(getMockDashboardData());
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchDashboardData();
  };

  const handleExport = async (format: 'pdf' | 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/dashboard/export?userId=${userId}&format=${format}`);
      const data = await response.text();
      
      // Create download
      const blob = new Blob([data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_${userId}_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getLevelIcon = (level: number) => {
    if (level >= 8) return <Crown className="h-6 w-6 text-purple-600" />;
    if (level >= 6) return <Trophy className="h-6 w-6 text-yellow-600" />;
    if (level >= 4) return <Award className="h-6 w-6 text-orange-600" />;
    return <Star className="h-6 w-6 text-blue-600" />;
  };

  const getPerformanceTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'stable':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'declining':
        return <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Development Dashboard</h1>
            <p className="text-gray-600">
              Track your progress, achievements, and professional growth
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomization(!showCustomization)}
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg border">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'insights', label: 'Insights', icon: Lightbulb },
            { id: 'goals', label: 'Goals', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeView === id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView(id as any)}
              className="flex items-center"
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customization Panel */}
        {showCustomization && (
          <div className="lg:col-span-3">
            <CustomizationPanel
              customization={customization}
              onCustomizationChange={setCustomization}
              onClose={() => setShowCustomization(false)}
            />
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className={`${showCustomization ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
          {activeView === 'overview' && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Current Level */}
                <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Current Level</p>
                        <p className="text-3xl font-bold">{dashboardData.overview.currentLevel}</p>
                        <p className="text-blue-100 text-sm">
                          {dashboardData.progress.levelProgress.currentLevelName}
                        </p>
                      </div>
                      {getLevelIcon(dashboardData.overview.currentLevel)}
                    </div>
                  </CardContent>
                </Card>

                {/* XP Progress */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Experience Points</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardData.overview.currentXP.toLocaleString()}
                        </p>
                      </div>
                      <Zap className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">To next level</span>
                        <span className="font-medium">
                          {(dashboardData.overview.nextLevelXP - dashboardData.overview.currentXP).toLocaleString()} XP
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${dashboardData.overview.progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {dashboardData.overview.progressPercentage}% complete
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Total Achievements</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardData.achievements.totalAchievements}
                        </p>
                      </div>
                      <Trophy className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Recent</span>
                        <Badge variant="secondary">
                          {dashboardData.overview.recentAchievements} this month
                        </Badge>
                      </div>
                      {dashboardData.achievements.recentAchievements.slice(0, 2).map((achievement, index) => (
                        <div key={index} className="text-xs text-gray-600">
                          • {AchievementService?.getAchievementById(achievement.achievementId)?.name || 'Achievement'}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Value */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Professional Value</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round(dashboardData.overview.professionalValue)}/100
                        </p>
                      </div>
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round(dashboardData.overview.professionalValue)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {dashboardData.insights.comparison.averageComparison}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Performance Trend */}
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-center mb-2">
                        {getPerformanceTrendIcon(dashboardData.insights.performanceTrend.direction)}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Performance Trend</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {dashboardData.insights.performanceTrend.direction} by {dashboardData.insights.performanceTrend.magnitude}%
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {dashboardData.insights.performanceTrend.timeframe}
                      </p>
                    </div>

                    {/* Top Strength */}
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-center mb-2">
                        <Star className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Top Strength</h3>
                      <p className="text-sm text-gray-600">
                        {dashboardData.insights.strengths[0]?.area}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {dashboardData.insights.strengths[0]?.score}/100 score
                      </p>
                    </div>

                    {/* Active Goals */}
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-center mb-2">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Active Goals</h3>
                      <p className="text-sm text-gray-600">
                        {dashboardData.goals.progress.onTrackGoals} of {dashboardData.goals.progress.totalActiveGoals} on track
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {dashboardData.goals.progress.averageCompletionRate}% completion rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    Weekly Progress Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {dashboardData.progress.weeklyProgress.xpEarned}
                      </p>
                      <p className="text-sm text-gray-600">XP Earned</p>
                      <p className="text-xs text-gray-500">
                        +{dashboardData.progress.weeklyProgress.comparisonToPrevious.xpChange} from last week
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {dashboardData.progress.weeklyProgress.achievementsUnlocked}
                      </p>
                      <p className="text-sm text-gray-600">Achievements</p>
                      <p className="text-xs text-gray-500">
                        +{dashboardData.progress.weeklyProgress.comparisonToPrevious.achievementChange} from last week
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {dashboardData.progress.weeklyProgress.goalsCompleted}
                      </p>
                      <p className="text-sm text-gray-600">Goals Completed</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {dashboardData.progress.weeklyProgress.skillImprovements}
                      </p>
                      <p className="text-sm text-gray-600">Skill Improvements</p>
                      <p className="text-xs text-gray-500">
                        +{dashboardData.progress.weeklyProgress.comparisonToPrevious.improvementRate}% improvement rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === 'progress' && (
            <ProgressWidgets 
              progressData={dashboardData.progress}
              historicalData={dashboardData.historical}
            />
          )}

          {activeView === 'achievements' && (
            <div className="space-y-6">
              {/* Achievement Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                    Achievement Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dashboardData.achievements.categoryBreakdown.map((category, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">{category.category}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Completed</span>
                            <span>{category.completedAchievements}/{category.totalAchievements}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-600 h-2 rounded-full"
                              style={{ 
                                width: `${(category.completedAchievements / category.totalAchievements) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Avg: {category.averageTier}</span>
                            <span>Value: {category.professionalValue}/10</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.achievements.recentAchievements.map((achievement, index) => (
                      <div key={index} className="flex items-center p-4 border rounded-lg">
                        <Trophy className="h-8 w-8 text-yellow-600 mr-4" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {AchievementService?.getAchievementById(achievement.achievementId)?.name || 'Achievement'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Earned {achievement.earnedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {achievement.tier}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === 'insights' && (
            <InsightsPanel insightData={dashboardData.insights} />
          )}

          {activeView === 'goals' && (
            <GoalTracker goalData={dashboardData.goals} />
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Last updated: {dashboardData.overview.lastUpdateTime.toLocaleString()}
      </div>
    </div>
  );
};

// Mock data for development
const getMockDashboardData = (): DashboardData => ({
  overview: {
    currentLevel: 5,
    currentXP: 1250,
    nextLevelXP: 1500,
    progressPercentage: 67,
    recentAchievements: 3,
    activeGoals: 4,
    professionalValue: 78,
    lastUpdateTime: new Date()
  },
  progress: {
    xpProgress: {
      current: 1250,
      target: 1500,
      percentage: 67,
      dailyAverage: 25,
      weeklyTrend: 12,
      projection: 1700
    },
    levelProgress: {
      currentLevel: 5,
      currentLevelName: 'Support Team Lead',
      nextLevel: 6,
      nextLevelName: 'Senior Support Engineer',
      progressToNext: 67,
      estimatedTimeToNext: '10 days',
      levelBenefits: ['Team coordination access', 'Advanced troubleshooting tools', 'Performance analytics']
    },
    skillProgress: [],
    goalProgress: [],
    weeklyProgress: {
      xpEarned: 175,
      achievementsUnlocked: 2,
      goalsCompleted: 1,
      skillImprovements: 3,
      comparisonToPrevious: {
        xpChange: 15,
        achievementChange: 1,
        improvementRate: 8
      }
    }
  },
  achievements: {
    totalAchievements: 12,
    recentAchievements: [],
    progressingAchievements: [],
    recommendations: {
      nearCompletion: [],
      recommended: [],
      beginner: []
    },
    categoryBreakdown: [
      {
        category: 'Technical Skills',
        totalAchievements: 12,
        completedAchievements: 7,
        averageTier: 'Silver',
        professionalValue: 8.2
      },
      {
        category: 'Customer Service',
        totalAchievements: 10,
        completedAchievements: 5,
        averageTier: 'Bronze',
        professionalValue: 7.8
      },
      {
        category: 'Professional Behavior',
        totalAchievements: 8,
        completedAchievements: 3,
        averageTier: 'Bronze',
        professionalValue: 7.5
      }
    ],
    rareAchievements: []
  },
  insights: {
    strengths: [
      {
        area: 'Technical Problem Solving',
        score: 88,
        description: 'Consistently demonstrates excellent troubleshooting abilities',
        evidence: ['95% first-contact resolution', '15% faster than average'],
        professionalImpact: 'Strong technical competency suitable for senior support roles'
      }
    ],
    improvements: [],
    recommendations: [],
    performanceTrend: {
      direction: 'improving',
      magnitude: 12,
      timeframe: 'last 30 days',
      keyFactors: ['Increased technical accuracy', 'Better customer communication'],
      prediction: 'Continued improvement expected'
    },
    comparison: {
      percentile: 78,
      averageComparison: '22% above team average',
      strengthAreas: ['Technical Skills', 'Customer Service'],
      improvementAreas: ['Documentation', 'System Administration']
    }
  },
  goals: {
    activeGoals: [],
    completedGoals: [],
    recommendations: [],
    progress: {
      totalActiveGoals: 4,
      onTrackGoals: 3,
      atRiskGoals: 1,
      completedThisMonth: 2,
      averageCompletionRate: 75
    }
  },
  historical: {
    xpHistory: [],
    levelHistory: [],
    achievementHistory: [],
    skillHistory: [],
    goalHistory: [],
    performanceHistory: []
  }
});

export default MainDashboard;