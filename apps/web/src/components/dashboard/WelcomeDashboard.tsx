'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '@/stores/dashboardStore';

export function WelcomeDashboard() {
  const { user } = useAuthStore();
  const { userProgress } = useDashboardStore();
  const [showTutorial, setShowTutorial] = useState(false);

  const isNewUser = userProgress?.completedScenarios === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            {isNewUser
              ? "Ready to start your IT support journey? Let's get you up and running with your first scenario."
              : "Welcome back! Continue building your IT support skills with new scenarios."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              asChild 
              className="flex-1"
              size="lg"
            >
              <Link href="/dashboard/tickets">
                {isNewUser ? 'Start Your First Scenario' : 'Continue Learning'}
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowTutorial(true)}
              className="flex-1"
            >
              View Tutorial
            </Button>
          </div>
        </CardContent>
      </Card>

      {isNewUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Complete Your First Scenario</h3>
                  <p className="text-sm text-gray-600">
                    Start with our beginner-friendly scenarios to earn your first XP points.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Track Your Progress</h3>
                  <p className="text-sm text-gray-500">
                    Monitor your skill development and see how you&apos;re improving.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Build Your Resume</h3>
                  <p className="text-sm text-gray-500">
                    Showcase your growing expertise to potential employers.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Platform Tutorial
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTutorial(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">How It Works</h3>
                  <p className="text-sm text-gray-600">
                    Our platform provides realistic IT support scenarios where you can practice troubleshooting, 
                    customer service, and technical problem-solving skills.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Navigation</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Tickets:</strong> Access available scenarios and your progress</li>
                    <li>• <strong>Analytics:</strong> View detailed performance metrics</li>
                    <li>• <strong>Resume:</strong> Generate professional resume content</li>
                    <li>• <strong>Settings:</strong> Customize your profile and preferences</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Earning XP</h3>
                  <p className="text-sm text-gray-600">
                    Complete scenarios to earn experience points (XP) and level up. Higher levels unlock 
                    more challenging scenarios and advanced features.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowTutorial(false)}>
                  Got It!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}