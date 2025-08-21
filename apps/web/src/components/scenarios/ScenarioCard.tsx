import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/components/tickets/PriorityIndicator';
import { cn } from '@/lib/utils';

export interface ScenarioCardData {
  id: string;
  title: string;
  description: string;
  difficulty: 'starter' | 'intermediate' | 'advanced';
  estimatedTime: number;
  xpReward: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  category: string;
  tags: string[];
  completionDate?: Date;
  score?: number;
  attempts?: number;
  prerequisitesMet: boolean;
  missingPrerequisites?: string[];
}

interface ScenarioCardProps {
  scenario: ScenarioCardData;
  onSelect: (scenarioId: string) => void;
  onPreview: (scenarioId: string) => void;
  className?: string;
  showProgress?: boolean;
}

export function ScenarioCard({ 
  scenario, 
  onSelect, 
  onPreview, 
  className,
  showProgress = true 
}: ScenarioCardProps) {
  const isLocked = scenario.status === 'locked';
  const isCompleted = scenario.status === 'completed';
  const isInProgress = scenario.status === 'in_progress';
  const isAvailable = scenario.status === 'available';

  const getDifficultyColor = () => {
    switch (scenario.difficulty) {
      case 'starter':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'intermediate':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'advanced':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (scenario.status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'available':
        return '🎯';
      case 'locked':
        return '🔒';
      default:
        return '❓';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        {
          'opacity-60 cursor-not-allowed': isLocked,
          'border-blue-200 bg-blue-50': isInProgress,
          'border-green-200 bg-green-50': isCompleted,
          'hover:border-blue-300': isAvailable && !isLocked,
        },
        className
      )}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg" role="img" aria-label={`Status: ${scenario.status}`}>
              {getStatusIcon()}
            </span>
            <h3 className={cn(
              'text-lg font-semibold',
              { 'text-gray-500': isLocked }
            )}>
              {scenario.title}
            </h3>
          </div>
          <div className={cn(
            'px-2 py-1 rounded-full text-xs font-medium border',
            getDifficultyColor()
          )}>
            {scenario.difficulty}
          </div>
        </div>

        {/* Description */}
        <p className={cn(
          'text-sm text-gray-600 mb-4 line-clamp-2',
          { 'text-gray-400': isLocked }
        )}>
          {scenario.description}
        </p>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Category:</span>
            <span className={cn('font-medium', { 'text-gray-400': isLocked })}>
              {scenario.category}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Estimated Time:</span>
            <span className={cn('font-medium', { 'text-gray-400': isLocked })}>
              {formatTime(scenario.estimatedTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">XP Reward:</span>
            <span className={cn(
              'font-medium text-yellow-600',
              { 'text-gray-400': isLocked }
            )}>
              {scenario.xpReward} XP
            </span>
          </div>
        </div>

        {/* Progress Information */}
        {showProgress && (isCompleted || isInProgress) && (
          <div className="border-t pt-3 mb-4">
            {isCompleted && scenario.score !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Best Score:</span>
                <span className="font-semibold text-green-600">
                  {scenario.score}%
                </span>
              </div>
            )}
            
            {scenario.attempts !== undefined && scenario.attempts > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Attempts:</span>
                <span className="font-medium">{scenario.attempts}</span>
              </div>
            )}
            
            {isCompleted && scenario.completionDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Completed:</span>
                <span className="font-medium">
                  {scenario.completionDate.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {scenario.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {scenario.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600',
                    { 'bg-gray-50 text-gray-400': isLocked }
                  )}
                >
                  {tag}
                </span>
              ))}
              {scenario.tags.length > 3 && (
                <span className={cn(
                  'px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600',
                  { 'bg-gray-50 text-gray-400': isLocked }
                )}>
                  +{scenario.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Prerequisites Warning */}
        {isLocked && scenario.missingPrerequisites && scenario.missingPrerequisites.length > 0 && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              <span className="font-medium">Prerequisites needed:</span> Complete{' '}
              {scenario.missingPrerequisites.length} more scenario(s) to unlock
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(scenario.id)}
            className="flex-1"
            disabled={false} // Preview should always be available
          >
            Preview
          </Button>
          
          <Button
            onClick={() => onSelect(scenario.id)}
            size="sm"
            className="flex-1"
            disabled={isLocked}
            variant={isInProgress ? "default" : isCompleted ? "outline" : "default"}
          >
            {isLocked && '🔒 '}
            {isInProgress ? 'Continue' : isCompleted ? 'Retry' : 'Start'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Skeleton component for loading states
export function ScenarioCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-18"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    </Card>
  );
}