/**
 * Real-time XP Service
 * Handles immediate XP notifications, updates, and live feedback
 */

import { EventEmitter } from 'events';
import { XPRecord, UserXPSummary } from './xpService';
import { ActivityData, XPCalculationResult } from './xpCalculator';

export interface XPUpdateEvent {
  userId: string;
  xpRecord: XPRecord;
  userSummary: UserXPSummary;
  levelUp?: LevelUpEvent;
  milestone?: MilestoneEvent;
  celebration?: CelebrationEvent;
}

export interface LevelUpEvent {
  userId: string;
  previousLevel: number;
  newLevel: number;
  xpRequired: number;
  xpToNext: number;
  rewards: string[];
  timestamp: Date;
}

export interface MilestoneEvent {
  userId: string;
  milestoneType: 'xp' | 'activities' | 'streak' | 'performance';
  milestoneName: string;
  value: number;
  reward: number;
  description: string;
  timestamp: Date;
}

export interface CelebrationEvent {
  userId: string;
  celebrationType: 'level_up' | 'milestone' | 'perfect_streak' | 'first_achievement' | 'bonus_earned';
  intensity: 'minimal' | 'standard' | 'epic';
  animation: string;
  message: string;
  duration: number; // milliseconds
  sound?: string;
  effects: CelebrationEffect[];
}

export interface CelebrationEffect {
  type: 'confetti' | 'sparkles' | 'badge_shine' | 'xp_counter' | 'progress_bar';
  duration: number;
  delay: number;
  properties: Record<string, any>;
}

export interface XPNotification {
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

export interface NotificationAction {
  id: string;
  label: string;
  action: 'view_breakdown' | 'share' | 'dismiss' | 'view_progress';
  data?: Record<string, any>;
}

export interface LiveXPDisplay {
  userId: string;
  currentXP: number;
  levelProgress: {
    currentLevel: number;
    progressPercent: number;
    xpToNext: number;
  };
  recentEarnings: XPEarning[];
  streaks: {
    current: number;
    type: string;
    nextMilestone: number;
  }[];
  nextRewards: string[];
}

export interface XPEarning {
  timestamp: Date;
  amount: number;
  activity: string;
  highlight: boolean;
  fadeOut: boolean;
}

class RealTimeXPService extends EventEmitter {
  private activeConnections: Map<string, Set<string>> = new Map(); // userId -> connectionIds
  private notifications: Map<string, XPNotification[]> = new Map(); // userId -> notifications
  private liveDisplays: Map<string, LiveXPDisplay> = new Map(); // userId -> live display
  private celebrationQueue: Map<string, CelebrationEvent[]> = new Map(); // userId -> celebrations

  /**
   * Register user connection for real-time updates
   */
  async connectUser(userId: string, connectionId: string): Promise<void> {
    const connections = this.activeConnections.get(userId) || new Set();
    connections.add(connectionId);
    this.activeConnections.set(userId, connections);

    // Send current state to newly connected user
    await this.sendCurrentState(userId, connectionId);
  }

  /**
   * Unregister user connection
   */
  async disconnectUser(userId: string, connectionId: string): Promise<void> {
    const connections = this.activeConnections.get(userId);
    if (connections) {
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.activeConnections.delete(userId);
      }
    }
  }

  /**
   * Process XP update and trigger real-time notifications
   */
  async processXPUpdate(
    userId: string,
    xpRecord: XPRecord,
    userSummary: UserXPSummary,
    previousXP: number
  ): Promise<void> {
    // Check for level up
    const levelUp = this.checkLevelUp(previousXP, userSummary.totalXP);
    
    // Check for milestones
    const milestone = await this.checkMilestones(userId, userSummary, xpRecord);
    
    // Generate celebration event
    const celebration = await this.generateCelebration(xpRecord, levelUp, milestone);

    // Create update event
    const updateEvent: XPUpdateEvent = {
      userId,
      xpRecord,
      userSummary,
      levelUp,
      milestone,
      celebration
    };

    // Update live display
    await this.updateLiveDisplay(userId, xpRecord, userSummary);

    // Create notifications
    await this.createNotifications(updateEvent);

    // Emit real-time event
    this.emit('xp_update', updateEvent);

    // Send to connected clients
    await this.broadcastToUser(userId, 'xp_update', updateEvent);

    // Process celebrations
    if (celebration) {
      await this.processCelebration(userId, celebration);
    }
  }

  /**
   * Get live XP display for user
   */
  async getLiveDisplay(userId: string): Promise<LiveXPDisplay | null> {
    return this.liveDisplays.get(userId) || null;
  }

  /**
   * Get user notifications
   */
  async getNotifications(userId: string, unreadOnly: boolean = false): Promise<XPNotification[]> {
    const userNotifications = this.notifications.get(userId) || [];
    
    if (unreadOnly) {
      return userNotifications.filter(n => !n.read);
    }
    
    return userNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const notifications = this.notifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      await this.broadcastToUser(userId, 'notification_read', { notificationId });
    }
  }

  /**
   * Trigger manual XP animation (for testing or special events)
   */
  async triggerXPAnimation(
    userId: string,
    xpAmount: number,
    activityType: string,
    animationType: 'standard' | 'bonus' | 'milestone' = 'standard'
  ): Promise<void> {
    const animation = {
      type: 'xp_earned',
      xpAmount,
      activityType,
      animationType,
      timestamp: new Date()
    };

    await this.broadcastToUser(userId, 'xp_animation', animation);
  }

  /**
   * Get celebration queue for user
   */
  async getCelebrationQueue(userId: string): Promise<CelebrationEvent[]> {
    return this.celebrationQueue.get(userId) || [];
  }

  /**
   * Process next celebration in queue
   */
  async processNextCelebration(userId: string): Promise<CelebrationEvent | null> {
    const queue = this.celebrationQueue.get(userId) || [];
    const nextCelebration = queue.shift();
    
    if (nextCelebration) {
      this.celebrationQueue.set(userId, queue);
      await this.broadcastToUser(userId, 'celebration', nextCelebration);
      return nextCelebration;
    }
    
    return null;
  }

  /**
   * Send real-time progress updates
   */
  async sendProgressUpdate(userId: string, progress: {
    activity: string;
    completion: number;
    estimatedXP: number;
    bonusOpportunities: string[];
  }): Promise<void> {
    await this.broadcastToUser(userId, 'progress_update', progress);
  }

  /**
   * Send performance feedback in real-time
   */
  async sendPerformanceFeedback(userId: string, feedback: {
    metric: string;
    currentValue: number;
    target: number;
    trend: 'improving' | 'declining' | 'stable';
    suggestion: string;
  }): Promise<void> {
    await this.broadcastToUser(userId, 'performance_feedback', feedback);
  }

  /**
   * Check for level up
   */
  private checkLevelUp(previousXP: number, currentXP: number): LevelUpEvent | undefined {
    const previousLevel = Math.floor(previousXP / 1000);
    const currentLevel = Math.floor(currentXP / 1000);
    
    if (currentLevel > previousLevel) {
      return {
        userId: '',
        previousLevel,
        newLevel: currentLevel,
        xpRequired: currentLevel * 1000,
        xpToNext: ((currentLevel + 1) * 1000) - currentXP,
        rewards: this.getLevelRewards(currentLevel),
        timestamp: new Date()
      };
    }
    
    return undefined;
  }

  /**
   * Check for milestone achievements
   */
  private async checkMilestones(
    userId: string,
    userSummary: UserXPSummary,
    xpRecord: XPRecord
  ): Promise<MilestoneEvent | undefined> {
    // XP milestones
    const xpMilestones = [100, 250, 500, 1000, 2500, 5000, 10000];
    for (const milestone of xpMilestones) {
      if (userSummary.totalXP >= milestone && userSummary.totalXP - xpRecord.xpAwarded < milestone) {
        return {
          userId,
          milestoneType: 'xp',
          milestoneName: `${milestone} XP Milestone`,
          value: milestone,
          reward: Math.round(milestone * 0.1),
          description: `Congratulations on reaching ${milestone} total XP!`,
          timestamp: new Date()
        };
      }
    }

    // Activity count milestones
    const activityCount = userSummary.recentXP.length;
    const activityMilestones = [5, 10, 25, 50, 100, 250, 500];
    for (const milestone of activityMilestones) {
      if (activityCount >= milestone && activityCount - 1 < milestone) {
        return {
          userId,
          milestoneType: 'activities',
          milestoneName: `${milestone} Activities Completed`,
          value: milestone,
          reward: milestone * 2,
          description: `You've completed ${milestone} activities! Keep up the great work!`,
          timestamp: new Date()
        };
      }
    }

    return undefined;
  }

  /**
   * Generate celebration event
   */
  private async generateCelebration(
    xpRecord: XPRecord,
    levelUp?: LevelUpEvent,
    milestone?: MilestoneEvent
  ): Promise<CelebrationEvent | undefined> {
    if (levelUp) {
      return {
        userId: xpRecord.userId,
        celebrationType: 'level_up',
        intensity: levelUp.newLevel <= 3 ? 'epic' : 'standard',
        animation: 'level_up_burst',
        message: `Level Up! You've reached Level ${levelUp.newLevel}!`,
        duration: 3000,
        sound: 'level_up.mp3',
        effects: [
          {
            type: 'confetti',
            duration: 2000,
            delay: 0,
            properties: { colors: ['gold', 'silver', 'blue'] }
          },
          {
            type: 'badge_shine',
            duration: 1500,
            delay: 500,
            properties: { level: levelUp.newLevel }
          }
        ]
      };
    }

    if (milestone) {
      return {
        userId: xpRecord.userId,
        celebrationType: 'milestone',
        intensity: milestone.value >= 1000 ? 'epic' : 'standard',
        animation: 'milestone_achieved',
        message: milestone.description,
        duration: 2500,
        sound: 'milestone.mp3',
        effects: [
          {
            type: 'sparkles',
            duration: 2000,
            delay: 0,
            properties: { intensity: milestone.value >= 1000 ? 'high' : 'medium' }
          }
        ]
      };
    }

    // Check for perfect performance celebration
    const overallPerformance = this.calculateOverallPerformance(xpRecord.performanceMetrics);
    if (overallPerformance >= 95 && xpRecord.breakdown.bonuses.length > 0) {
      return {
        userId: xpRecord.userId,
        celebrationType: 'perfect_streak',
        intensity: 'standard',
        animation: 'perfect_performance',
        message: 'Perfect Performance! Outstanding work!',
        duration: 2000,
        sound: 'perfect.mp3',
        effects: [
          {
            type: 'sparkles',
            duration: 1500,
            delay: 0,
            properties: { color: 'gold', pattern: 'star' }
          }
        ]
      };
    }

    return undefined;
  }

  /**
   * Update live display data
   */
  private async updateLiveDisplay(
    userId: string,
    xpRecord: XPRecord,
    userSummary: UserXPSummary
  ): Promise<void> {
    const currentDisplay = this.liveDisplays.get(userId);
    
    // Add new earning to recent list
    const newEarning: XPEarning = {
      timestamp: new Date(),
      amount: xpRecord.xpAwarded,
      activity: xpRecord.activityType.replace('_', ' ').toUpperCase(),
      highlight: xpRecord.xpAwarded >= 50,
      fadeOut: false
    };

    const recentEarnings = currentDisplay ? [...currentDisplay.recentEarnings] : [];
    recentEarnings.unshift(newEarning);
    
    // Keep only last 5 earnings
    recentEarnings.splice(5);

    const liveDisplay: LiveXPDisplay = {
      userId,
      currentXP: userSummary.totalXP,
      levelProgress: {
        currentLevel: userSummary.currentLevel,
        progressPercent: ((userSummary.totalXP % 1000) / 1000) * 100,
        xpToNext: userSummary.xpToNextLevel
      },
      recentEarnings,
      streaks: [
        {
          current: 0, // Would be populated from streak service
          type: 'completion',
          nextMilestone: 5
        }
      ],
      nextRewards: this.getNextRewards(userSummary)
    };

    this.liveDisplays.set(userId, liveDisplay);
  }

  /**
   * Create notifications for XP events
   */
  private async createNotifications(updateEvent: XPUpdateEvent): Promise<void> {
    const notifications: XPNotification[] = [];

    // XP earned notification
    notifications.push({
      id: this.generateNotificationId(),
      userId: updateEvent.userId,
      type: 'xp_earned',
      title: 'XP Earned!',
      message: `You earned ${updateEvent.xpRecord.xpAwarded} XP for completing ${updateEvent.xpRecord.activityType.replace('_', ' ')}`,
      xpAmount: updateEvent.xpRecord.xpAwarded,
      priority: updateEvent.xpRecord.xpAwarded >= 50 ? 'high' : 'medium',
      persistent: false,
      timestamp: new Date(),
      read: false,
      actions: [
        {
          id: 'view_breakdown',
          label: 'View Breakdown',
          action: 'view_breakdown',
          data: { recordId: updateEvent.xpRecord.id }
        }
      ]
    });

    // Level up notification
    if (updateEvent.levelUp) {
      notifications.push({
        id: this.generateNotificationId(),
        userId: updateEvent.userId,
        type: 'level_up',
        title: 'Level Up!',
        message: `Congratulations! You've reached Level ${updateEvent.levelUp.newLevel}!`,
        priority: 'urgent',
        persistent: true,
        timestamp: new Date(),
        read: false,
        actions: [
          {
            id: 'view_progress',
            label: 'View Progress',
            action: 'view_progress'
          },
          {
            id: 'share',
            label: 'Share Achievement',
            action: 'share',
            data: { level: updateEvent.levelUp.newLevel }
          }
        ]
      });
    }

    // Milestone notification
    if (updateEvent.milestone) {
      notifications.push({
        id: this.generateNotificationId(),
        userId: updateEvent.userId,
        type: 'milestone',
        title: 'Milestone Achieved!',
        message: updateEvent.milestone.description,
        priority: 'high',
        persistent: true,
        timestamp: new Date(),
        read: false
      });
    }

    // Store notifications
    const userNotifications = this.notifications.get(updateEvent.userId) || [];
    userNotifications.push(...notifications);
    
    // Keep only last 50 notifications
    userNotifications.splice(50);
    this.notifications.set(updateEvent.userId, userNotifications);
  }

  /**
   * Process celebration event
   */
  private async processCelebration(userId: string, celebration: CelebrationEvent): Promise<void> {
    const queue = this.celebrationQueue.get(userId) || [];
    queue.push(celebration);
    this.celebrationQueue.set(userId, queue);

    // Auto-trigger celebration if no others are queued
    if (queue.length === 1) {
      setTimeout(() => {
        this.processNextCelebration(userId);
      }, 100);
    }
  }

  /**
   * Send current state to newly connected user
   */
  private async sendCurrentState(userId: string, connectionId: string): Promise<void> {
    const liveDisplay = this.liveDisplays.get(userId);
    const notifications = await this.getNotifications(userId, true);
    const celebrations = this.celebrationQueue.get(userId) || [];

    const currentState = {
      liveDisplay,
      unreadNotifications: notifications,
      pendingCelebrations: celebrations
    };

    // In a real implementation, this would send to specific connection
    await this.broadcastToUser(userId, 'current_state', currentState);
  }

  /**
   * Broadcast message to all user connections
   */
  private async broadcastToUser(userId: string, eventType: string, data: any): Promise<void> {
    const connections = this.activeConnections.get(userId);
    if (!connections || connections.size === 0) return;

    // In a real implementation, this would use WebSocket/Socket.IO
    console.log(`Broadcasting to user ${userId}: ${eventType}`, data);
    
    // Emit event for testing/debugging
    this.emit('broadcast', { userId, eventType, data, connectionCount: connections.size });
  }

  /**
   * Helper methods
   */
  private calculateOverallPerformance(metrics: any): number {
    const weights = {
      technicalAccuracy: 0.3,
      communicationQuality: 0.25,
      customerSatisfaction: 0.25,
      processCompliance: 0.2
    };

    return Math.round(
      metrics.technicalAccuracy * weights.technicalAccuracy +
      metrics.communicationQuality * weights.communicationQuality +
      metrics.customerSatisfaction * weights.customerSatisfaction +
      metrics.processCompliance * weights.processCompliance
    );
  }

  private getLevelRewards(level: number): string[] {
    const rewards = [
      'New badge unlocked',
      'Increased XP multiplier',
      'Access to advanced scenarios'
    ];
    
    if (level >= 5) rewards.push('Mentor status available');
    if (level >= 10) rewards.push('Expert consultation opportunities');
    
    return rewards;
  }

  private getNextRewards(userSummary: UserXPSummary): string[] {
    const rewards = [];
    const nextLevel = userSummary.currentLevel + 1;
    
    rewards.push(`Level ${nextLevel} badge (${userSummary.xpToNextLevel} XP to go)`);
    
    if (userSummary.totalXP < 500) {
      rewards.push('500 XP milestone bonus (20 XP)');
    }
    
    return rewards;
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const realTimeXPService = new RealTimeXPService();
export default realTimeXPService;