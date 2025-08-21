'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { WelcomeDashboard } from '@/components/dashboard/WelcomeDashboard';
import { ProgressOverview } from '@/components/dashboard/ProgressOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { userProgress, initializeDashboard } = useDashboardStore();

  useEffect(() => {
    if (user) {
      initializeDashboard();
    }
  }, [user, initializeDashboard]);

  const isNewUser = userProgress?.completedScenarios === 0;

  return (
    <div className="space-y-6">
      {isNewUser ? (
        <WelcomeDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProgressOverview />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />
            <div className="space-y-6">
              {/* Placeholder for future widgets */}
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                <p>More features coming soon...</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}