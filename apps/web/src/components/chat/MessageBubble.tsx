'use client';

import { format } from 'date-fns';
import { ChatMessage } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  isConsecutive?: boolean;
}

export function MessageBubble({ message, isConsecutive = false }: MessageBubbleProps) {
  const isUser = message.senderType === 'user';
  const isAI = message.senderType === 'ai';
  
  const formatTime = (timestamp: Date) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        isUser ? 'items-end' : 'items-start',
        isConsecutive ? 'mt-1' : 'mt-4'
      )}
    >
      {/* Sender label and timestamp */}
      {!isConsecutive && (
        <div className={cn(
          'flex items-center gap-2 text-xs text-gray-500',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <span className="font-medium">
            {isUser ? 'You' : 'IT Support Agent'}
          </span>
          <span>•</span>
          <span>{formatTime(message.timestamp)}</span>
        </div>
      )}
      
      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] px-4 py-2 rounded-lg text-sm break-words',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm',
          isConsecutive && isUser && 'rounded-br-lg',
          isConsecutive && isAI && 'rounded-bl-lg'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {/* Message metadata */}
        {message.metadata && (
          <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
            {message.metadata.delivered && (
              <span className="text-green-500">✓</span>
            )}
            {message.metadata.read && (
              <span className="text-green-500">✓✓</span>
            )}
            {message.metadata.error && (
              <span className="text-red-500" title={message.metadata.error}>
                ⚠️
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}