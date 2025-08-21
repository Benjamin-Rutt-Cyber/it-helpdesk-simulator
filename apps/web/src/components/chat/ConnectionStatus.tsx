'use client';

import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, isReconnecting, className }: ConnectionStatusProps) {
  const getStatus = () => {
    if (isReconnecting) {
      return {
        text: 'Reconnecting...',
        color: 'text-yellow-600',
        dot: 'bg-yellow-500 animate-pulse',
      };
    }
    
    if (isConnected) {
      return {
        text: 'Connected',
        color: 'text-green-600',
        dot: 'bg-green-500',
      };
    }
    
    return {
      text: 'Disconnected',
      color: 'text-red-600',
      dot: 'bg-red-500',
    };
  };

  const status = getStatus();

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <div className={cn('w-2 h-2 rounded-full', status.dot)}></div>
      <span className={cn('font-medium', status.color)}>
        {status.text}
      </span>
    </div>
  );
}