import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/components/tickets/PriorityIndicator';
import { cn } from '@/lib/utils';

interface TicketContext {
  ticketId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: string;
  expectedResolution: string;
  contextTimeline: {
    issueStarted: Date;
    firstReported: Date;
    escalationHistory: Array<{
      timestamp: Date;
      fromLevel: string;
      toLevel: string;
      reason: string;
    }>;
    previousAttempts: Array<{
      timestamp: Date;
      action: string;
      result: string;
      technician: string;
    }>;
  };
  estimatedTime: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
}

interface TicketBriefProps {
  ticketContext: TicketContext;
  className?: string;
  onStartWork?: () => void;
  showActions?: boolean;
}

export function TicketBrief({ 
  ticketContext, 
  className, 
  onStartWork,
  showActions = true 
}: TicketBriefProps) {
  const getUrgencyColor = () => {
    switch (ticketContext.urgencyLevel) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getComplexityIcon = () => {
    switch (ticketContext.complexity) {
      case 'simple': return '🟢';
      case 'moderate': return '🟡';
      case 'complex': return '🟠';
      case 'expert': return '🔴';
      default: return '🟡';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b bg-gray-50 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                {ticketContext.title}
              </h2>
              <span className="text-sm text-gray-500 font-mono">
                #{ticketContext.ticketId}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <PriorityBadge priority={ticketContext.priority} size="sm" />
              
              <div className={cn(
                'px-2 py-1 rounded-md border text-xs font-medium',
                getUrgencyColor()
              )}>
                {ticketContext.urgencyLevel.toUpperCase()} URGENCY
              </div>
              
              <span className="text-gray-600">
                Category: <span className="font-medium">{ticketContext.category}</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <span>{getComplexityIcon()}</span>
              <span className="capitalize">{ticketContext.complexity} Complexity</span>
            </div>
            <div className="text-sm text-gray-500">
              Est. {formatDuration(ticketContext.estimatedTime)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Problem Description */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>📋</span>
            Problem Description
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {ticketContext.description}
          </p>
        </div>

        {/* Business Impact & Resolution Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span>💼</span>
              Business Impact
            </h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {ticketContext.businessImpact}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span>🎯</span>
              Expected Resolution
            </h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {ticketContext.expectedResolution}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>⏰</span>
            Issue Timeline
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Issue first occurred:</span>
              <span className="font-medium">
                {formatTimeAgo(ticketContext.contextTimeline.issueStarted)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">First reported:</span>
              <span className="font-medium">
                {formatTimeAgo(ticketContext.contextTimeline.firstReported)}
              </span>
            </div>
          </div>
        </div>

        {/* Previous Attempts */}
        {ticketContext.contextTimeline.previousAttempts.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>🔄</span>
              Previous Resolution Attempts
            </h4>
            <div className="space-y-3">
              {ticketContext.contextTimeline.previousAttempts.map((attempt, index) => (
                <Card key={index} className="p-3 bg-amber-50 border-amber-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-sm">{attempt.action}</span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(attempt.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Result:</span> {attempt.result}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    By: {attempt.technician}
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Note:</span> Consider these previous attempts 
                when developing your solution approach. Building on prior work can be more 
                efficient than starting from scratch.
              </p>
            </div>
          </div>
        )}

        {/* Escalation History */}
        {ticketContext.contextTimeline.escalationHistory.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>📈</span>
              Escalation History
            </h4>
            <div className="space-y-2">
              {ticketContext.contextTimeline.escalationHistory.map((escalation, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-red-50 p-2 rounded">
                  <span>
                    Escalated from {escalation.fromLevel} to {escalation.toLevel}
                  </span>
                  <span className="text-gray-500">
                    {formatTimeAgo(escalation.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Ready to begin troubleshooting this issue?
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Review Context
                </Button>
                <Button onClick={onStartWork} size="sm">
                  Start Working
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Skeleton component for loading states
export function TicketBriefSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden animate-pulse', className)}>
      <div className="border-b bg-gray-50 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="flex items-center gap-4">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-36 mb-2"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div>
          <div className="h-5 bg-gray-200 rounded w-28 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </Card>
  );
}