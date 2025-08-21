/**
 * XP Notification Toast - Individual notification display
 */

import React, { useEffect, useState } from 'react';

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
  actions?: NotificationAction[];
}

interface NotificationAction {
  id: string;
  label: string;
  action: 'view_breakdown' | 'share' | 'dismiss' | 'view_progress';
  data?: Record<string, any>;
}

interface XPNotificationToastProps {
  notification: XPNotification;
  onRead: () => void;
  onAction?: (action: NotificationAction) => void;
  autoHide?: boolean;
  duration?: number;
}

export const XPNotificationToast: React.FC<XPNotificationToastProps> = ({
  notification,
  onRead,
  onAction,
  autoHide = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (autoHide && !notification.persistent) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, notification.persistent, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onRead();
    }, 300);
  };

  const handleActionClick = (action: NotificationAction) => {
    if (onAction) {
      onAction(action);
    }
    handleClose();
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'xp_earned':
        return '⭐';
      case 'level_up':
        return '🎉';
      case 'milestone':
        return '🏆';
      case 'streak':
        return '🔥';
      case 'bonus':
        return '💎';
      default:
        return '📢';
    }
  };

  const getNotificationColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#2563eb';
      case 'low':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`notification-toast ${notification.type} priority-${notification.priority} ${isExiting ? 'exiting' : 'entering'}`}
      style={{ borderLeftColor: getNotificationColor() }}
    >
      <div className="notification-header">
        <div className="notification-icon">
          {getNotificationIcon()}
        </div>
        <div className="notification-content">
          <div className="notification-title">
            {notification.title}
            {notification.xpAmount && (
              <span className="xp-badge">+{notification.xpAmount} XP</span>
            )}
          </div>
          <div className="notification-message">
            {notification.message}
          </div>
          <div className="notification-timestamp">
            {formatTimestamp(notification.timestamp)}
          </div>
        </div>
        <button
          className="close-button"
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>

      {notification.actions && notification.actions.length > 0 && (
        <div className="notification-actions">
          {notification.actions.map((action) => (
            <button
              key={action.id}
              className={`action-button ${action.action}`}
              onClick={() => handleActionClick(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .notification-toast {
          background: white;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
          max-width: 400px;
          overflow: hidden;
          transform: translateX(100%);
          transition: all 0.3s ease-out;
        }

        .notification-toast.entering {
          transform: translateX(0);
        }

        .notification-toast.exiting {
          transform: translateX(100%);
          opacity: 0;
        }

        .notification-toast.level_up {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
        }

        .notification-toast.milestone {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .notification-toast.streak {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .notification-toast.bonus {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: white;
        }

        .notification-header {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          gap: 12px;
        }

        .notification-icon {
          font-size: 24px;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          backdrop-filter: blur(10px);
        }

        .notification-toast.xp_earned .notification-icon {
          background: rgba(34, 197, 94, 0.2);
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .xp-badge {
          background: rgba(34, 197, 94, 0.9);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .notification-toast.level_up .xp-badge,
        .notification-toast.milestone .xp-badge,
        .notification-toast.streak .xp-badge,
        .notification-toast.bonus .xp-badge {
          background: rgba(255, 255, 255, 0.3);
        }

        .notification-message {
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 6px;
          opacity: 0.9;
        }

        .notification-timestamp {
          font-size: 12px;
          opacity: 0.7;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: inherit;
          opacity: 0.7;
          transition: opacity 0.2s ease, background-color 0.2s ease;
          flex-shrink: 0;
        }

        .close-button:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.2);
        }

        .notification-actions {
          display: flex;
          gap: 8px;
          padding: 0 16px 16px 60px;
          flex-wrap: wrap;
        }

        .action-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: inherit;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .notification-toast.xp_earned .action-button {
          background: rgba(59, 130, 246, 0.9);
          border: 1px solid rgba(59, 130, 246, 1);
          color: white;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
        }

        .notification-toast.xp_earned .action-button:hover {
          background: rgba(59, 130, 246, 1);
        }

        .action-button.view_breakdown {
          background: rgba(16, 185, 129, 0.9);
          border-color: rgba(16, 185, 129, 1);
        }

        .action-button.share {
          background: rgba(139, 92, 246, 0.9);
          border-color: rgba(139, 92, 246, 1);
        }

        .action-button.view_progress {
          background: rgba(245, 158, 11, 0.9);
          border-color: rgba(245, 158, 11, 1);
        }

        /* Priority-based styling */
        .priority-urgent {
          border-left-color: #dc2626 !important;
          animation: urgentPulse 2s ease-in-out infinite;
        }

        .priority-high {
          border-left-color: #ea580c !important;
        }

        .priority-medium {
          border-left-color: #2563eb !important;
        }

        .priority-low {
          border-left-color: #059669 !important;
        }

        @keyframes urgentPulse {
          0%, 100% {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          50% {
            box-shadow: 0 10px 25px rgba(220, 38, 38, 0.2), 0 4px 6px rgba(220, 38, 38, 0.1);
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .notification-toast {
            max-width: calc(100vw - 32px);
            margin: 0 16px;
          }

          .notification-header {
            padding: 12px;
          }

          .notification-actions {
            padding: 0 12px 12px 44px;
          }

          .action-button {
            font-size: 11px;
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
};