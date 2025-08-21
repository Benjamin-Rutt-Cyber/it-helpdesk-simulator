'use client';

import { TypingUser } from '@/stores/chatStore';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return 'IT Support Agent is typing...';
    } else {
      return `${typingUsers.length} users are typing...`;
    }
  };

  return (
    <div className={cn('flex items-start', className)}>
      <div className="max-w-[80%] px-4 py-2 rounded-lg rounded-bl-sm bg-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{getTypingText()}</span>
          <div className="flex space-x-1">
            {/* Animated dots */}
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}