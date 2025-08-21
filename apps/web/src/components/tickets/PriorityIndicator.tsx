import { TicketPriority } from '@/types/ticket';
import { cn } from '@/lib/utils';

interface PriorityIndicatorProps {
  priority: TicketPriority;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function PriorityIndicator({ 
  priority, 
  size = 'md', 
  showLabel = true,
  className 
}: PriorityIndicatorProps) {
  const priorityConfig = {
    [TicketPriority.LOW]: {
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Low Priority',
      icon: '🟢'
    },
    [TicketPriority.MEDIUM]: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Medium Priority',
      icon: '🟡'
    },
    [TicketPriority.HIGH]: {
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'High Priority',
      icon: '🔴'
    },
  };

  const sizeConfig = {
    sm: {
      dot: 'w-2 h-2',
      text: 'text-xs',
      padding: 'px-2 py-1',
      gap: 'gap-1'
    },
    md: {
      dot: 'w-3 h-3',
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      gap: 'gap-2'
    },
    lg: {
      dot: 'w-4 h-4',
      text: 'text-base',
      padding: 'px-4 py-2',
      gap: 'gap-2'
    }
  };

  const config = priorityConfig[priority];
  const sizeStyles = sizeConfig[size];

  if (!showLabel) {
    return (
      <div 
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          config.color,
          sizeStyles.dot,
          className
        )}
        title={config.label}
      />
    );
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full border',
        config.bgColor,
        config.borderColor,
        sizeStyles.padding,
        sizeStyles.gap,
        className
      )}
    >
      <div 
        className={cn(
          'rounded-full',
          config.color,
          sizeStyles.dot
        )}
      />
      <span className={cn(
        'font-medium',
        config.textColor,
        sizeStyles.text
      )}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    </div>
  );
}

// Alternative badge-style priority indicator
export function PriorityBadge({ 
  priority, 
  size = 'md',
  className 
}: Omit<PriorityIndicatorProps, 'showLabel'>) {
  const priorityConfig = {
    [TicketPriority.LOW]: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    },
    [TicketPriority.MEDIUM]: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    },
    [TicketPriority.HIGH]: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200'
    },
  };

  const sizeConfig = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  const config = priorityConfig[priority];

  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bg,
        config.text,
        config.border,
        sizeConfig[size],
        className
      )}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}