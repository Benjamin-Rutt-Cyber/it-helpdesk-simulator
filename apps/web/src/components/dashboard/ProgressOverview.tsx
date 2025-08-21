'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuthStore } from '@/stores/authStore';
import { formatProgress } from '@/lib/utils';

export function ProgressOverview() {
  const { userProgress, isLoadingProgress } = useDashboardStore();
  const { user } = useAuthStore();

  // Mock progress data for new users
  const mockProgress = {
    level: user?.level || 1,
    xp: user?.xp || 0,
    completedScenarios: 0,
    totalScenarios: 15,
    streakDays: 0,
    lastLoginAt: user?.lastLoginAt || null,
  };

  const progress = userProgress || mockProgress;
  const nextLevelXp = progress.level * 100; // Simple XP calculation
  const xpProgress = Math.min((progress.xp % 100) / 100, 1) * 100;

  if (isLoadingProgress) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Level Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Current Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">Level {progress.level}</div>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{progress.xp} XP</span>
              <span>{nextLevelXp} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios Completed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Scenarios Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {progress.completedScenarios} / {progress.totalScenarios}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{formatProgress(progress.completedScenarios, progress.totalScenarios)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(progress.completedScenarios / progress.totalScenarios) * 100}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Learning Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {progress.streakDays} {progress.streakDays === 1 ? 'Day' : 'Days'}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {progress.streakDays === 0 
              ? 'Start your first scenario!' 
              : progress.streakDays === 1 
                ? 'Great start! Keep going!'
                : 'Keep up the momentum!'
            }
          </p>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {progress.completedScenarios === 0 ? 'Get Started' : 'Continue Learning'}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {progress.completedScenarios === 0 
              ? 'Begin with your first scenario' 
              : `${progress.totalScenarios - progress.completedScenarios} scenarios remaining`
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}