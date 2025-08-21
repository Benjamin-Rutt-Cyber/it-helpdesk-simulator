/**
 * Live XP Display - Real-time XP progress visualization
 */

import React, { useEffect, useState } from 'react';
import { useXPUpdates } from './XPUpdatesProvider';
import { XPNotificationToast } from './XPNotificationToast';
import { XPCelebration } from './XPCelebration';

interface LiveXPDisplayProps {
  userId: string;
  compact?: boolean;
  showNotifications?: boolean;
  showCelebrations?: boolean;
}

export const LiveXPDisplay: React.FC<LiveXPDisplayProps> = ({
  userId,
  compact = false,
  showNotifications = true,
  showCelebrations = true
}) => {
  const { 
    isConnected, 
    liveDisplay, 
    notifications, 
    celebrationQueue,
    connectToXPUpdates,
    markNotificationRead,
    triggerCelebration
  } = useXPUpdates();

  const [animatingEarnings, setAnimatingEarnings] = useState<Set<number>>(new Set());
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);

  useEffect(() => {
    if (userId && !isConnected) {
      connectToXPUpdates(userId);
    }
  }, [userId, isConnected, connectToXPUpdates]);

  useEffect(() => {
    // Auto-trigger celebrations
    if (celebrationQueue.length > 0 && showCelebrations) {
      const timer = setTimeout(() => {
        triggerCelebration();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [celebrationQueue, showCelebrations, triggerCelebration]);

  useEffect(() => {
    // Animate recent earnings
    if (liveDisplay?.recentEarnings) {
      liveDisplay.recentEarnings.forEach((earning, index) => {
        if (!earning.fadeOut && !animatingEarnings.has(index)) {
          setAnimatingEarnings(prev => new Set([...prev, index]));
          
          setTimeout(() => {
            setAnimatingEarnings(prev => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            });
          }, 2000);
        }
      });
    }
  }, [liveDisplay?.recentEarnings, animatingEarnings]);

  if (!liveDisplay) {
    return (
      <div className={`xp-display ${compact ? 'compact' : 'full'}`}>
        <div className="connection-status">
          {isConnected ? 'Loading XP data...' : 'Connecting to XP service...'}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="xp-display compact">
        <div className="xp-summary">
          <div className="current-xp">
            <span className="xp-amount">{liveDisplay.currentXP.toLocaleString()}</span>
            <span className="xp-label">XP</span>
          </div>
          <div className="level-info">
            <span className="level">Level {liveDisplay.levelProgress.currentLevel}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${liveDisplay.levelProgress.progressPercent}%` }}
              />
            </div>
            <span className="xp-to-next">{liveDisplay.levelProgress.xpToNext} to next</span>
          </div>
        </div>

        {/* Recent earnings popup */}
        {liveDisplay.recentEarnings.slice(0, 3).map((earning, index) => (
          <div
            key={`${earning.timestamp}-${index}`}
            className={`earning-popup ${animatingEarnings.has(index) ? 'animate' : ''} ${earning.highlight ? 'highlight' : ''}`}
            style={{
              animationDelay: `${index * 100}ms`,
              top: `${-30 - (index * 25)}px`
            }}
          >
            +{earning.amount} XP
          </div>
        ))}

        {/* Notifications */}
        {showNotifications && notifications.filter(n => !n.read).slice(0, 1).map(notification => (
          <XPNotificationToast
            key={notification.id}
            notification={notification}
            onRead={() => markNotificationRead(notification.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="xp-display full">
      {/* Connection status */}
      <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-dot" />
        {isConnected ? 'Live' : 'Offline'}
      </div>

      {/* Main XP display */}
      <div className="xp-main">
        <div className="current-xp-large">
          <div className="xp-number">
            {liveDisplay.currentXP.toLocaleString()}
          </div>
          <div className="xp-label">Experience Points</div>
        </div>

        <div className="level-section">
          <div className="level-header">
            <h3>Level {liveDisplay.levelProgress.currentLevel}</h3>
            <span className="xp-remaining">{liveDisplay.levelProgress.xpToNext} XP to Level {liveDisplay.levelProgress.currentLevel + 1}</span>
          </div>
          
          <div className="level-progress-bar">
            <div 
              className="progress-fill animated"
              style={{ width: `${liveDisplay.levelProgress.progressPercent}%` }}
            />
            <div className="progress-text">
              {Math.round(liveDisplay.levelProgress.progressPercent)}%
            </div>
          </div>
        </div>

        {/* Recent earnings */}
        <div className="recent-earnings">
          <h4>Recent Earnings</h4>
          <div className="earnings-list">
            {liveDisplay.recentEarnings.map((earning, index) => (
              <div
                key={`${earning.timestamp}-${index}`}
                className={`earning-item ${animatingEarnings.has(index) ? 'animate-in' : ''} ${earning.highlight ? 'highlight' : ''}`}
              >
                <div className="earning-info">
                  <span className="activity">{earning.activity}</span>
                  <span className="timestamp">
                    {new Date(earning.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`xp-amount ${earning.highlight ? 'bonus' : ''}`}>
                  +{earning.amount} XP
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streaks */}
        {liveDisplay.streaks.length > 0 && (
          <div className="streaks-section">
            <h4>Current Streaks</h4>
            <div className="streaks-list">
              {liveDisplay.streaks.map((streak, index) => (
                <div key={index} className="streak-item">
                  <div className="streak-info">
                    <span className="streak-type">{streak.type}</span>
                    <span className="streak-count">{streak.current}</span>
                  </div>
                  <div className="next-milestone">
                    Next: {streak.nextMilestone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next rewards */}
        {liveDisplay.nextRewards.length > 0 && (
          <div className="next-rewards">
            <h4>Upcoming Rewards</h4>
            <ul>
              {liveDisplay.nextRewards.map((reward, index) => (
                <li key={index}>{reward}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Notifications */}
      {showNotifications && (
        <div className="notifications-container">
          {notifications.filter(n => !n.read).slice(0, 3).map(notification => (
            <XPNotificationToast
              key={notification.id}
              notification={notification}
              onRead={() => markNotificationRead(notification.id)}
            />
          ))}
        </div>
      )}

      {/* Celebrations */}
      {showCelebrations && celebrationQueue.length > 0 && (
        <XPCelebration
          celebration={celebrationQueue[0]}
          onComplete={triggerCelebration}
        />
      )}

      <style jsx>{`
        .xp-display {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px;
          color: white;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .xp-display.compact {
          padding: 12px;
          min-height: 80px;
        }

        .connection-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          opacity: 0.8;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
        }

        .connection-indicator.disconnected .status-dot {
          background: #f87171;
        }

        .xp-summary {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .current-xp {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .xp-amount {
          font-size: 24px;
          font-weight: bold;
        }

        .xp-label {
          font-size: 12px;
          opacity: 0.8;
        }

        .level-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .level {
          font-weight: 600;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ade80, #22c55e);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-fill.animated {
          animation: progressPulse 2s ease-in-out infinite;
        }

        .xp-to-next {
          font-size: 11px;
          opacity: 0.7;
        }

        .xp-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .current-xp-large {
          text-align: center;
          padding: 20px 0;
        }

        .xp-number {
          font-size: 48px;
          font-weight: bold;
          background: linear-gradient(45deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .level-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
        }

        .level-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .level-header h3 {
          margin: 0;
          font-size: 20px;
        }

        .xp-remaining {
          font-size: 14px;
          opacity: 0.8;
        }

        .level-progress-bar {
          position: relative;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 10px;
          font-weight: bold;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .recent-earnings {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
        }

        .recent-earnings h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
        }

        .earnings-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .earning-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .earning-item.animate-in {
          animation: slideInRight 0.5s ease-out;
          background: rgba(34, 197, 94, 0.2);
        }

        .earning-item.highlight {
          background: rgba(251, 191, 36, 0.2);
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .earning-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .activity {
          font-weight: 500;
          font-size: 14px;
        }

        .timestamp {
          font-size: 12px;
          opacity: 0.7;
        }

        .xp-amount {
          font-weight: bold;
          color: #4ade80;
        }

        .xp-amount.bonus {
          color: #fbbf24;
        }

        .earning-popup {
          position: absolute;
          right: 20px;
          background: rgba(34, 197, 94, 0.9);
          padding: 6px 12px;
          border-radius: 16px;
          font-weight: bold;
          font-size: 14px;
          pointer-events: none;
          opacity: 0;
          transform: translateY(10px);
        }

        .earning-popup.animate {
          animation: popupSlide 2s ease-out forwards;
        }

        .earning-popup.highlight {
          background: rgba(251, 191, 36, 0.9);
        }

        .streaks-section, .next-rewards {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
        }

        .streaks-section h4, .next-rewards h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
        }

        .streaks-list {
          display: flex;
          gap: 12px;
        }

        .streak-item {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }

        .streak-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .streak-type {
          font-size: 12px;
          opacity: 0.8;
        }

        .streak-count {
          font-size: 20px;
          font-weight: bold;
          color: #4ade80;
        }

        .next-milestone {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 4px;
        }

        .next-rewards ul {
          margin: 0;
          padding-left: 20px;
        }

        .next-rewards li {
          margin-bottom: 4px;
          font-size: 14px;
        }

        .notifications-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes popupSlide {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          20% {
            opacity: 1;
            transform: translateY(-20px);
          }
          80% {
            opacity: 1;
            transform: translateY(-25px);
          }
          100% {
            opacity: 0;
            transform: translateY(-30px);
          }
        }
      `}</style>
    </div>
  );
};