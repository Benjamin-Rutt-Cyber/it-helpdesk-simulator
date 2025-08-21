'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useChatStore } from '@/stores/chatStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';

interface ChatInterfaceProps {
  sessionId: string;
  title?: string;
  className?: string;
  onSendMessage?: (content: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
}

export function ChatInterface({ 
  sessionId, 
  title = 'IT Support Chat', 
  className,
  onSendMessage,
  onStartTyping,
  onStopTyping 
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const {
    isConnected,
    isReconnecting,
    getMessagesBySession,
    getTypingUsers,
  } = useChatStore();

  const sessionMessages = getMessagesBySession(sessionId);
  const currentTypingUsers = getTypingUsers();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessionMessages, isAtBottom]);

  // Check if user is at bottom of messages
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setIsAtBottom(isNearBottom);
  };

  return (
    <Card className={`flex flex-col h-full max-h-[600px] ${className}`}>
      <CardHeader className="flex-none border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {title}
          </CardTitle>
          <ConnectionStatus isConnected={isConnected} isReconnecting={isReconnecting} />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {/* Messages Container */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          onScroll={handleScroll}
        >
          {sessionMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">Start a conversation to begin your IT support session</p>
              </div>
            </div>
          ) : (
            <>
              {sessionMessages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isConsecutive={
                    index > 0 && 
                    sessionMessages[index - 1].senderType === message.senderType &&
                    new Date(message.timestamp).getTime() - new Date(sessionMessages[index - 1].timestamp).getTime() < 60000
                  }
                />
              ))}
              
              {currentTypingUsers.length > 0 && (
                <TypingIndicator typingUsers={currentTypingUsers} />
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Chat Input */}
        <div className="flex-none border-t border-gray-200">
          <ChatInput 
            sessionId={sessionId} 
            disabled={!isConnected}
            onSendMessage={onSendMessage}
            onTyping={onStartTyping}
          />
        </div>
      </CardContent>
    </Card>
  );
}