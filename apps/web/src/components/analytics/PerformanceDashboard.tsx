import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { SkillBreakdown } from './SkillBreakdown';
import { ProgressChart } from './ProgressChart';
import { ComparisonView } from './ComparisonView';
import { FeedbackPanel } from './FeedbackPanel';
import { cn } from '@/lib/utils';

interface PerformanceOverview {
  timeframe: string;
  period: { startDate: Date; endDate: Date };
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  totalTimeSpent: number;
  improvementTrend: number;
  skillProgress: {
    technical: { current: number; previous: number; improvement: number };
    communication: { current: number; previous: number; improvement: number };
    procedural: { current: number; previous: number; improvement: number };
  };
  recentAchievements: Array<{
    title: string;
    description: string;
    date: Date;
  }>;
  upcomingGoals: Array<{
    title: string;
    target: number;
    current: number;
    deadline: Date;
  }>;
}

interface DashboardData {
  overview: PerformanceOverview;
  recentSessions: Array<{
    sessionId: string;
    scenarioTitle: string;
    score: number;
    completedAt: Date;
  }>;
  skillTrends: {
    technical: number[];
    communication: number[];
    procedural: number[];
  };
  performanceChart: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  };
}

interface PerformanceDashboardProps {
  userId: string;
  className?: string;
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  onTimeframeChange?: (timeframe: string) => void;
}

export function PerformanceDashboard({
  userId,
  className,
  timeframe = 'month',
  onTimeframeChange
}: PerformanceDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [userId, timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/user/${userId}/dashboard?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatScoreChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: number): string => {
    if (trend > 0) return '📈';
    if (trend < 0) return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold">Failed to Load Dashboard</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadDashboardData} variant="outline">
          Try Again
        </Button>
      </Card>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">
            {dashboardData.overview.timeframe.charAt(0).toUpperCase() + dashboardData.overview.timeframe.slice(1)} overview • 
            {dashboardData.overview.completedSessions} sessions completed
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['week', 'month', 'quarter', 'year'].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeframeChange?.(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Score</p>
              <p className={cn('text-2xl font-bold', getScoreColor(dashboardData.overview.averageScore))}>
                {dashboardData.overview.averageScore}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span>{getTrendIcon(dashboardData.overview.improvementTrend)}</span>
                {formatScoreChange(dashboardData.overview.improvementTrend)} from last period
              </p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sessions Completed</p>
              <p className="text-2xl font-bold text-blue-600">
                {dashboardData.overview.completedSessions}
              </p>
              <p className="text-xs text-gray-500">
                {Math.round((dashboardData.overview.completedSessions / dashboardData.overview.totalSessions) * 100)}% completion rate
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Time Invested</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatDuration(dashboardData.overview.totalTimeSpent)}
              </p>
              <p className="text-xs text-gray-500">
                Avg: {formatDuration(Math.round(dashboardData.overview.totalTimeSpent / dashboardData.overview.completedSessions))} per session
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Skill</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.max(...Object.values(dashboardData.overview.skillProgress).map(s => s.current))}
              </p>
              <p className="text-xs text-gray-500">
                {Object.entries(dashboardData.overview.skillProgress)
                  .reduce((a, b) => a[1].current > b[1].current ? a : b)[0]
                  .charAt(0).toUpperCase() + 
                 Object.entries(dashboardData.overview.skillProgress)
                  .reduce((a, b) => a[1].current > b[1].current ? a : b)[0].slice(1)}
              </p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
              <ProgressChart 
                data={dashboardData.performanceChart}
                type="line"
                height={300}
              />
            </Card>

            {/* Recent Sessions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
              <div className="space-y-3">
                {dashboardData.recentSessions.map((session) => (
                  <div key={session.sessionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{session.scenarioTitle}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={cn('text-lg font-bold', getScoreColor(session.score))}>
                      {session.score}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Achievements */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                {dashboardData.overview.recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="text-yellow-600 text-xl">🏆</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-yellow-900">{achievement.title}</p>
                      <p className="text-xs text-yellow-800">{achievement.description}</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Upcoming Goals */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Current Goals</h3>
              <div className="space-y-3">
                {dashboardData.overview.upcomingGoals.map((goal, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{goal.title}</p>
                      <span className="text-xs text-gray-500">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(goal.current / goal.target) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {goal.current}/{goal.target}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillBreakdown 
            userId={userId} 
            skillTrends={dashboardData.skillTrends}
          />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <ProgressChart 
            data={dashboardData.performanceChart}
            skillTrends={dashboardData.skillTrends}
            type="combined"
            height={400}
          />
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <ComparisonView userId={userId} />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <FeedbackPanel userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}