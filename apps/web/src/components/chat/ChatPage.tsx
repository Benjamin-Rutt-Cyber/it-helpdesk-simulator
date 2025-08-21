'use client';

import React, { useEffect, useState } from 'react';
import { useSocket, ChatMessage } from '@/hooks/useSocket';
import { useChatStore } from '@/stores/chatStore';
import { ChatInterface } from './ChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ChatPageProps {
  sessionId: string;
  userToken: string;
  className?: string;
}

export function ChatPage({ sessionId, userToken, className }: ChatPageProps) {
  const [hasJoinedSession, setHasJoinedSession] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const {
    addMessage,
    setMessages,
    setConnectionStatus,
    updateTypingStatus,
    setCurrentSession,
    setError,
    reset,
  } = useChatStore();

  const handleMessage = (message: ChatMessage) => {
    addMessage(message);
  };

  const handleTyping = (data: { socketId: string; isTyping: boolean }) => {
    updateTypingStatus(data.socketId, data.isTyping);
  };

  const handleError = (error: string) => {
    setError(error);
    setConnectionError(error);
  };

  const {
    socket,
    isConnected,
    isReconnecting,
    joinSession,
    sendMessage,
    startTyping,
    stopTyping,
    disconnect,
  } = useSocket(userToken, handleMessage, handleTyping, handleError);

  // Set up connection status and session when socket connects
  useEffect(() => {
    setConnectionStatus(isConnected, isReconnecting);
    
    if (isConnected && !hasJoinedSession) {
      joinSession(sessionId);
      setHasJoinedSession(true);
      setCurrentSession(sessionId);
      setConnectionError(null);
    }
  }, [isConnected, isReconnecting, hasJoinedSession, sessionId, joinSession, setConnectionStatus, setCurrentSession]);

  // Handle reconnection
  useEffect(() => {
    if (isConnected && hasJoinedSession) {
      // Re-join session after reconnection
      joinSession(sessionId);
    }
  }, [isConnected, hasJoinedSession, sessionId, joinSession]);

  // Handle session change
  useEffect(() => {
    if (sessionId) {
      setCurrentSession(sessionId);
      setHasJoinedSession(false);
      setMessages([]); // Clear messages when switching sessions
    }
  }, [sessionId, setCurrentSession, setMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      reset();
    };
  }, [disconnect, reset]);

  const handleSendMessage = (content: string) => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    sendMessage({
      sessionId,
      senderType: 'user',
      content,
    });
  };

  const handleStartTyping = () => {
    if (isConnected) {
      startTyping(sessionId);
    }
  };

  const handleStopTyping = () => {
    if (isConnected) {
      stopTyping(sessionId);
    }
  };

  // Show connection error if exists
  if (connectionError && !isConnected) {
    return (
      <Card className={`max-w-2xl mx-auto ${className}`}>
        <CardHeader>
          <CardTitle className="text-red-600">Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{connectionError}</p>
          <Button
            onClick={() => {
              setConnectionError(null);
              setHasJoinedSession(false);
            }}
            variant="primary"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <ChatInterface
        sessionId={sessionId}
        title="IT Support Chat Session"
        className="h-[600px]"
        onSendMessage={handleSendMessage}
        onStartTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
      />
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div>Session ID: {sessionId}</div>
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Reconnecting: {isReconnecting ? 'Yes' : 'No'}</div>
              <div>Socket ID: {socket?.id || 'N/A'}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}