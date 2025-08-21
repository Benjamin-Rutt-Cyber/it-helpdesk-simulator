/**
 * XP Updates Provider - Real-time XP updates context and provider
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface XPUpdateEvent {
  userId: string;
  xpRecord: any;
  userSummary: any;
  levelUp?: any;
  milestone?: any;
  celebration?: any;
}

interface XPNotification {
  id: string;
  userId: string;
  type: 'xp_earned' | 'level_up' | 'milestone' | 'streak' | 'bonus';
  title: string;
  message: string;
  xpAmount?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  persistent: boolean;
  timestamp: Date;
  read: boolean;
  actions?: any[];
}

interface LiveXPDisplay {
  userId: string;
  currentXP: number;
  levelProgress: {
    currentLevel: number;
    progressPercent: number;
    xpToNext: number;
  };
  recentEarnings: any[];
  streaks: any[];
  nextRewards: string[];
}

interface XPUpdatesContextType {
  isConnected: boolean;
  liveDisplay: LiveXPDisplay | null;
  notifications: XPNotification[];
  celebrationQueue: any[];
  connectToXPUpdates: (userId: string) => void;
  disconnect: () => void;
  markNotificationRead: (notificationId: string) => void;
  triggerCelebration: () => void;
  clearNotifications: () => void;
}

const XPUpdatesContext = createContext<XPUpdatesContextType | null>(null);

interface XPUpdatesProviderProps {
  children: ReactNode;
  apiUrl?: string;
}

export const XPUpdatesProvider: React.FC<XPUpdatesProviderProps> = ({ 
  children, 
  apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001' 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveDisplay, setLiveDisplay] = useState<LiveXPDisplay | null>(null);
  const [notifications, setNotifications] = useState<XPNotification[]>([]);
  const [celebrationQueue, setCelebrationQueue] = useState<any[]>([]);

  const connectToXPUpdates = useCallback((userId: string) => {
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(apiUrl, {
      query: { userId },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to XP updates service');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from XP updates service');
      setIsConnected(false);
    });

    // XP Update events
    newSocket.on('xp_update', (event: XPUpdateEvent) => {
      console.log('XP Update received:', event);
      
      // Update live display
      if (event.userSummary) {
        setLiveDisplay(prev => ({
          userId: event.userId,
          currentXP: event.userSummary.totalXP,
          levelProgress: {
            currentLevel: event.userSummary.currentLevel,
            progressPercent: ((event.userSummary.totalXP % 1000) / 1000) * 100,
            xpToNext: event.userSummary.xpToNextLevel
          },
          recentEarnings: prev ? [...prev.recentEarnings.slice(0, 4), {
            timestamp: new Date(),
            amount: event.xpRecord.xpAwarded,
            activity: event.xpRecord.activityType.replace('_', ' ').toUpperCase(),
            highlight: event.xpRecord.xpAwarded >= 50,
            fadeOut: false
          }] : [],
          streaks: prev?.streaks || [],
          nextRewards: prev?.nextRewards || []
        }));
      }

      // Add celebration to queue
      if (event.celebration) {
        setCelebrationQueue(prev => [...prev, event.celebration]);
      }
    });

    // Notification events
    newSocket.on('notification', (notification: XPNotification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
    });

    newSocket.on('notification_read', ({ notificationId }: { notificationId: string }) => {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    });

    // Celebration events
    newSocket.on('celebration', (celebration: any) => {
      console.log('Celebration event:', celebration);
      // Trigger celebration animation
      setCelebrationQueue(prev => prev.filter(c => c !== celebration));
    });

    // Current state on connection
    newSocket.on('current_state', ({ liveDisplay: currentDisplay, unreadNotifications, pendingCelebrations }: any) => {
      if (currentDisplay) setLiveDisplay(currentDisplay);
      if (unreadNotifications) setNotifications(unreadNotifications);
      if (pendingCelebrations) setCelebrationQueue(pendingCelebrations);
    });

    // Progress updates
    newSocket.on('progress_update', (progress: any) => {
      console.log('Progress update:', progress);
      // Handle real-time progress updates
    });

    // Performance feedback
    newSocket.on('performance_feedback', (feedback: any) => {
      console.log('Performance feedback:', feedback);
      // Handle real-time performance feedback
    });

    // XP animations
    newSocket.on('xp_animation', (animation: any) => {
      console.log('XP Animation:', animation);
      // Trigger XP earning animation
    });

    setSocket(newSocket);
  }, [apiUrl]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const markNotificationRead = useCallback((notificationId: string) => {
    if (socket) {
      socket.emit('mark_notification_read', { notificationId });
    }
  }, [socket]);

  const triggerCelebration = useCallback(() => {
    if (celebrationQueue.length > 0 && socket) {
      socket.emit('process_next_celebration');
    }
  }, [celebrationQueue, socket]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const contextValue: XPUpdatesContextType = {
    isConnected,
    liveDisplay,
    notifications,
    celebrationQueue,
    connectToXPUpdates,
    disconnect,
    markNotificationRead,
    triggerCelebration,
    clearNotifications
  };

  return (
    <XPUpdatesContext.Provider value={contextValue}>
      {children}
    </XPUpdatesContext.Provider>
  );
};

export const useXPUpdates = (): XPUpdatesContextType => {
  const context = useContext(XPUpdatesContext);
  if (!context) {
    throw new Error('useXPUpdates must be used within an XPUpdatesProvider');
  }
  return context;
};