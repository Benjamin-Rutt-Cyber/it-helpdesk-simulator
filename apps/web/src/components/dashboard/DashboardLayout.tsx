'use client';

import { ReactNode, useEffect } from 'react';
import { NavigationSidebar } from './NavigationSidebar';
import { DashboardHeader } from './DashboardHeader';
import { useDashboardStore } from '@/stores/dashboardStore';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const { setSidebarCollapsed } = useDashboardStore.getState();
      setSidebarCollapsed(window.innerWidth < 1024);
    };

    // Set initial state
    handleResize();
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSidebar />
      
      <div className={cn(
        'transition-all duration-200 ease-in-out',
        'lg:ml-64' // Always show content with sidebar space on desktop
      )}>
        <DashboardHeader />
        
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}