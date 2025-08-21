import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TicketBrief, TicketBriefSkeleton } from './TicketBrief';
import { CustomerProfile } from './CustomerProfile';
import { TechnicalEnvironment } from './TechnicalEnvironment';
import { ResourceLibrary } from './ResourceLibrary';
import { LearningObjectives } from './LearningObjectives';
import { cn } from '@/lib/utils';

interface ComprehensiveContext {
  ticket: any;
  customer: any;
  technical: any;
  history: any;
  resources: any;
  objectives: any;
  sessionInfo: {
    sessionId: string;
    startTime: Date;
    estimatedDuration: number;
    difficulty: 'starter' | 'intermediate' | 'advanced';
    scenarioVersion: string;
  };
}

interface ScenarioContextProps {
  sessionId?: string;
  scenarioId?: string;
  userId: string;
  className?: string;
  onStartWork?: () => void;
  onResourceView?: (resourceId: string) => void;
  onToolAccess?: (toolName: string) => void;
}

export function ScenarioContext({
  sessionId,
  scenarioId,
  userId,
  className,
  onStartWork,
  onResourceView,
  onToolAccess
}: ScenarioContextProps) {
  const [context, setContext] = useState<ComprehensiveContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ticket');
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');

  useEffect(() => {
    loadContext();
  }, [sessionId, scenarioId, userId]);

  const loadContext = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (sessionId) {
        // Load context for active session
        response = await fetch(`/api/context/session/${sessionId}?userId=${userId}`);
      } else if (scenarioId) {
        // Load context for scenario preview
        response = await fetch(`/api/context/scenario/${scenarioId}`);
      } else {
        throw new Error('Either sessionId or scenarioId must be provided');
      }

      if (!response.ok) {
        throw new Error('Failed to load context');
      }

      const contextData = await response.json();
      setContext(contextData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = () => {
    if (onStartWork) {
      onStartWork();
    }
  };

  const handleResourceView = (resourceId: string) => {
    if (onResourceView) {
      onResourceView(resourceId);
    }
  };

  const handleToolAccess = (toolName: string) => {
    if (onToolAccess) {
      onToolAccess(toolName);
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <TicketBriefSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </Card>
          <Card className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </Card>
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
          <h3 className="text-lg font-semibold">Failed to Load Context</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadContext} variant="outline">
          Try Again
        </Button>
      </Card>
    );
  }

  if (!context) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with View Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scenario Context</h2>
          <p className="text-gray-600">
            {sessionId ? 'Active Session' : 'Preview Mode'} • 
            Difficulty: <span className="capitalize">{context.sessionInfo.difficulty}</span> • 
            Est. {Math.floor(context.sessionInfo.estimatedDuration / 60)}h {context.sessionInfo.estimatedDuration % 60}m
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === 'compact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('compact')}
          >
            Compact View
          </Button>
          <Button
            variant={viewMode === 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('full')}
          >
            Full View
          </Button>
        </div>
      </div>

      {/* Compact View */}
      {viewMode === 'compact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <CustomerProfile 
            customerContext={context.customer} 
            compact={true}
          />
          <TechnicalEnvironment 
            technicalEnvironment={context.technical} 
            compact={true}
          />
          <LearningObjectives 
            learningObjectives={context.objectives} 
            compact={true}
          />
        </div>
      )}

      {/* Full View */}
      {viewMode === 'full' && (
        <>
          {/* Main Ticket Brief */}
          <TicketBrief 
            ticketContext={context.ticket}
            onStartWork={handleStartWork}
            showActions={!!sessionId}
          />

          {/* Context Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <span>👤</span>
                Customer
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-2">
                <span>💻</span>
                Technical
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <span>📚</span>
                Resources
              </TabsTrigger>
              <TabsTrigger value="objectives" className="flex items-center gap-2">
                <span>🎯</span>
                Objectives
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customer" className="mt-6">
              <CustomerProfile customerContext={context.customer} />
            </TabsContent>

            <TabsContent value="technical" className="mt-6">
              <TechnicalEnvironment technicalEnvironment={context.technical} />
            </TabsContent>

            <TabsContent value="resources" className="mt-6">
              <ResourceLibrary 
                resourceLibrary={context.resources}
                onResourceView={handleResourceView}
                onToolAccess={handleToolAccess}
              />
            </TabsContent>

            <TabsContent value="objectives" className="mt-6">
              <LearningObjectives learningObjectives={context.objectives} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Session Info Footer */}
      {sessionId && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Session ID:</span>
                <span className="text-blue-800 ml-1 font-mono">{context.sessionInfo.sessionId}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Started:</span>
                <span className="text-blue-800 ml-1">
                  {new Date(context.sessionInfo.startTime).toLocaleTimeString()}
                </span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Version:</span>
                <span className="text-blue-800 ml-1">{context.sessionInfo.scenarioVersion}</span>
              </div>
            </div>

            {onStartWork && (
              <Button size="sm" onClick={handleStartWork}>
                Continue Working
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// Skeleton component for loading states
export function ScenarioContextSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>

      {/* Main content skeleton */}
      <TicketBriefSkeleton />
      
      {/* Tabs skeleton */}
      <div>
        <div className="flex border-b">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-t w-24 mr-2"></div>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}