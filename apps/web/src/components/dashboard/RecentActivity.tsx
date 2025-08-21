'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatDate } from '@/lib/utils';

export function RecentActivity() {
  const { recentActivity, isLoadingActivity, fetchRecentActivity } = useDashboardStore();

  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  if (isLoadingActivity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500">No recent activity yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Complete your first scenario to see your progress here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  activity.type === 'completed' ? 'bg-green-500' : 
                  activity.type === 'started' ? 'bg-blue-500' : 
                  'bg-gray-500'
                }`}>
                  {activity.type === 'completed' ? '✓' : 
                   activity.type === 'started' ? '▶' : 
                   '○'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
                {activity.xpEarned && (
                  <div className="text-sm font-medium text-green-600">
                    +{activity.xpEarned} XP
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}