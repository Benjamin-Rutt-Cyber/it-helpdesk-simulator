'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDashboardStore } from '@/stores/dashboardStore';

export function QuickActions() {
  const { userProgress, setWelcomeModalOpen } = useDashboardStore();
  const [isStarting, setIsStarting] = useState(false);

  const hasCompletedScenarios = userProgress?.completedScenarios || 0 > 0;

  const handleStartScenario = () => {
    setIsStarting(true);
    // Simulate navigation delay
    setTimeout(() => {
      setIsStarting(false);
      // In real implementation, this would navigate to scenario selection
      // TODO: Add navigation to scenario selection
    }, 1000);
  };

  const handleShowTutorial = () => {
    setWelcomeModalOpen(true);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Primary Action */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">
            {hasCompletedScenarios ? 'Continue Learning' : 'Get Started'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-blue-800">
              {hasCompletedScenarios
                ? 'Ready to tackle more challenging scenarios? Continue building your IT support skills.'
                : 'Welcome to the IT Helpdesk Simulator! Start your journey with our beginner-friendly scenarios.'
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleStartScenario}
                loading={isStarting}
                className="flex-1 sm:flex-none"
                variant="primary"
              >
                {hasCompletedScenarios ? 'Continue Practice' : 'Start First Scenario'}
              </Button>
              
              <Button
                onClick={handleShowTutorial}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                {hasCompletedScenarios ? 'Review Tutorial' : 'Take Tutorial'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Link href="/dashboard/analytics" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Performance Analytics
              </Button>
            </Link>
            
            <Link href="/dashboard/resume" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Build Professional Resume
              </Button>
            </Link>
            
            <Link href="/dashboard/settings" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Account Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}