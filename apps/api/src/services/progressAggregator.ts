import { DashboardData } from './dashboardService';

export interface ProgressUpdate {
  userId: string;
  updateType: 'xp' | 'level' | 'achievement' | 'goal' | 'skill';
  data: any;
  timestamp: Date;
}

export interface RealTimeConnection {
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastPing: Date;
}

export class ProgressAggregator {
  private static connections: Map<string, RealTimeConnection[]> = new Map();
  private static updateQueue: ProgressUpdate[] = [];

  /**
   * Register a real-time connection for a user
   */
  static registerConnection(userId: string, socketId: string): void {
    const connections = this.connections.get(userId) || [];
    const newConnection: RealTimeConnection = {
      userId,
      socketId,
      connectedAt: new Date(),
      lastPing: new Date()
    };
    
    connections.push(newConnection);
    this.connections.set(userId, connections);
    
    console.log(`Real-time connection registered for user ${userId}, socket ${socketId}`);
  }

  /**
   * Unregister a real-time connection
   */
  static unregisterConnection(userId: string, socketId: string): void {
    const connections = this.connections.get(userId) || [];
    const filteredConnections = connections.filter(conn => conn.socketId !== socketId);
    
    if (filteredConnections.length > 0) {
      this.connections.set(userId, filteredConnections);
    } else {
      this.connections.delete(userId);
    }
    
    console.log(`Real-time connection unregistered for user ${userId}, socket ${socketId}`);
  }

  /**
   * Process progress update and broadcast to connected clients
   */
  static async processProgressUpdate(update: ProgressUpdate): Promise<void> {
    // Add to update queue
    this.updateQueue.push(update);
    
    // Get user connections
    const userConnections = this.connections.get(update.userId) || [];
    
    if (userConnections.length === 0) {
      console.log(`No active connections for user ${update.userId}, update queued`);
      return;
    }

    // Process the update based on type
    const processedUpdate = await this.processUpdateByType(update);
    
    // Broadcast to all user connections
    for (const connection of userConnections) {
      await this.broadcastUpdate(connection.socketId, processedUpdate);
    }

    console.log(`Progress update broadcasted to ${userConnections.length} connections for user ${update.userId}`);
  }

  /**
   * Process update based on its type
   */
  private static async processUpdateByType(update: ProgressUpdate): Promise<any> {
    switch (update.updateType) {
      case 'xp':
        return await this.processXPUpdate(update);
      case 'level':
        return await this.processLevelUpdate(update);
      case 'achievement':
        return await this.processAchievementUpdate(update);
      case 'goal':
        return await this.processGoalUpdate(update);
      case 'skill':
        return await this.processSkillUpdate(update);
      default:
        return update;
    }
  }

  /**
   * Process XP update
   */
  private static async processXPUpdate(update: ProgressUpdate): Promise<any> {
    const { userId, data } = update;
    
    // Calculate new XP totals and progress
    const currentXP = data.currentXP || 0;
    const xpGained = data.xpGained || 0;
    const newXP = currentXP + xpGained;
    
    // Check for level progression
    const currentLevel = this.getLevelFromXP(currentXP);
    const newLevel = this.getLevelFromXP(newXP);
    const leveledUp = newLevel > currentLevel;
    
    return {
      type: 'xp_update',
      userId,
      data: {
        previousXP: currentXP,
        newXP,
        xpGained,
        leveledUp,
        currentLevel: newLevel,
        progressToNext: this.getProgressToNextLevel(newXP),
        timestamp: update.timestamp
      },
      animations: {
        xpGain: true,
        levelUp: leveledUp
      }
    };
  }

  /**
   * Process level update
   */
  private static async processLevelUpdate(update: ProgressUpdate): Promise<any> {
    const { userId, data } = update;
    
    return {
      type: 'level_update',
      userId,
      data: {
        previousLevel: data.previousLevel,
        newLevel: data.newLevel,
        levelName: data.levelName,
        newBenefits: data.newBenefits || [],
        timestamp: update.timestamp
      },
      animations: {
        levelUp: true,
        celebration: true
      }
    };
  }

  /**
   * Process achievement update
   */
  private static async processAchievementUpdate(update: ProgressUpdate): Promise<any> {
    const { userId, data } = update;
    
    return {
      type: 'achievement_update',
      userId,
      data: {
        achievementId: data.achievementId,
        achievementName: data.achievementName,
        tier: data.tier,
        category: data.category,
        professionalValue: data.professionalValue,
        isNewAchievement: data.isNewAchievement || false,
        progressUpdate: data.progressUpdate || null,
        timestamp: update.timestamp
      },
      animations: {
        achievement: data.isNewAchievement,
        progress: !data.isNewAchievement
      }
    };
  }

  /**
   * Process goal update
   */
  private static async processGoalUpdate(update: ProgressUpdate): Promise<any> {
    const { userId, data } = update;
    
    return {
      type: 'goal_update',
      userId,
      data: {
        goalId: data.goalId,
        goalTitle: data.goalTitle,
        previousProgress: data.previousProgress,
        newProgress: data.newProgress,
        completed: data.completed || false,
        milestoneReached: data.milestoneReached || false,
        timestamp: update.timestamp
      },
      animations: {
        progress: true,
        completion: data.completed,
        milestone: data.milestoneReached
      }
    };
  }

  /**
   * Process skill update
   */
  private static async processSkillUpdate(update: ProgressUpdate): Promise<any> {
    const { userId, data } = update;
    
    return {
      type: 'skill_update',
      userId,
      data: {
        skillName: data.skillName,
        category: data.category,
        previousLevel: data.previousLevel,
        newLevel: data.newLevel,
        previousScore: data.previousScore,
        newScore: data.newScore,
        improvement: data.newScore - data.previousScore,
        timestamp: update.timestamp
      },
      animations: {
        skillProgress: true,
        levelUp: data.newLevel !== data.previousLevel
      }
    };
  }

  /**
   * Broadcast update to specific socket
   */
  private static async broadcastUpdate(socketId: string, update: any): Promise<void> {
    // Mock WebSocket broadcast - in real implementation, this would use Socket.IO
    console.log(`Broadcasting update to socket ${socketId}:`, update);
    
    // In a real implementation:
    // io.to(socketId).emit('dashboard_update', update);
  }

  /**
   * Get user's queued updates
   */
  static getQueuedUpdates(userId: string): ProgressUpdate[] {
    return this.updateQueue.filter(update => update.userId === userId);
  }

  /**
   * Clear queued updates for user
   */
  static clearQueuedUpdates(userId: string): void {
    this.updateQueue = this.updateQueue.filter(update => update.userId !== userId);
  }

  /**
   * Batch process multiple updates
   */
  static async batchProcessUpdates(updates: ProgressUpdate[]): Promise<void> {
    // Group updates by user
    const updatesByUser = updates.reduce((acc, update) => {
      if (!acc[update.userId]) {
        acc[update.userId] = [];
      }
      acc[update.userId].push(update);
      return acc;
    }, {} as Record<string, ProgressUpdate[]>);

    // Process each user's updates
    for (const [userId, userUpdates] of Object.entries(updatesByUser)) {
      await this.processBatchedUserUpdates(userId, userUpdates);
    }
  }

  /**
   * Process batched updates for a single user
   */
  private static async processBatchedUserUpdates(userId: string, updates: ProgressUpdate[]): Promise<void> {
    // Sort updates by timestamp
    const sortedUpdates = updates.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Combine related updates (e.g., multiple XP gains)
    const combinedUpdates = this.combineRelatedUpdates(sortedUpdates);
    
    // Process combined updates
    for (const update of combinedUpdates) {
      await this.processProgressUpdate(update);
    }
  }

  /**
   * Combine related updates to reduce noise
   */
  private static combineRelatedUpdates(updates: ProgressUpdate[]): ProgressUpdate[] {
    const combined: ProgressUpdate[] = [];
    const xpUpdates: ProgressUpdate[] = [];
    
    for (const update of updates) {
      if (update.updateType === 'xp') {
        xpUpdates.push(update);
      } else {
        combined.push(update);
      }
    }
    
    // Combine XP updates
    if (xpUpdates.length > 0) {
      const totalXPGained = xpUpdates.reduce((total, update) => total + (update.data.xpGained || 0), 0);
      const lastUpdate = xpUpdates[xpUpdates.length - 1];
      
      combined.push({
        userId: lastUpdate.userId,
        updateType: 'xp',
        data: {
          ...lastUpdate.data,
          xpGained: totalXPGained
        },
        timestamp: lastUpdate.timestamp
      });
    }
    
    return combined;
  }

  /**
   * Health check for connections
   */
  static performHealthCheck(): void {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [userId, connections] of this.connections.entries()) {
      const activeConnections = connections.filter(conn => 
        (now.getTime() - conn.lastPing.getTime()) < timeout
      );
      
      if (activeConnections.length !== connections.length) {
        if (activeConnections.length > 0) {
          this.connections.set(userId, activeConnections);
        } else {
          this.connections.delete(userId);
        }
        
        console.log(`Cleaned up stale connections for user ${userId}`);
      }
    }
  }

  /**
   * Update connection ping
   */
  static updateConnectionPing(userId: string, socketId: string): void {
    const connections = this.connections.get(userId) || [];
    const connection = connections.find(conn => conn.socketId === socketId);
    
    if (connection) {
      connection.lastPing = new Date();
    }
  }

  /**
   * Get active connections count
   */
  static getActiveConnectionsCount(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.length;
    }
    return total;
  }

  /**
   * Helper methods
   */
  private static getLevelFromXP(xp: number): number {
    // Mock level calculation - replace with actual LevelService
    return Math.floor(xp / 250) + 1;
  }

  private static getProgressToNextLevel(xp: number): number {
    const currentLevel = this.getLevelFromXP(xp);
    const xpForCurrentLevel = (currentLevel - 1) * 250;
    const xpForNextLevel = currentLevel * 250;
    const progressXP = xp - xpForCurrentLevel;
    const requiredXP = xpForNextLevel - xpForCurrentLevel;
    
    return Math.round((progressXP / requiredXP) * 100);
  }

  /**
   * Create mock updates for testing
   */
  static createMockUpdate(userId: string, type: ProgressUpdate['updateType'], data: any): ProgressUpdate {
    return {
      userId,
      updateType: type,
      data,
      timestamp: new Date()
    };
  }
}