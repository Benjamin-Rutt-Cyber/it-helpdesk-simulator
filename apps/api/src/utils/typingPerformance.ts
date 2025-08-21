import { logger } from './logger';

export interface PerformanceMetrics {
  activeSimulations: number;
  averageSimulationDuration: number;
  memoryUsage: any;
  timerCount: number;
  lastCleanup: Date;
}

export interface TimerManager {
  id: string;
  sessionId: string;
  type: 'typing' | 'chunk' | 'pause';
  timer: any;
  createdAt: Date;
  scheduledFor: Date;
}

export class TypingPerformanceOptimizer {
  private static activeTimers: Map<string, TimerManager> = new Map();
  private static performanceMetrics: PerformanceMetrics = {
    activeSimulations: 0,
    averageSimulationDuration: 0,
    memoryUsage: process.memoryUsage(),
    timerCount: 0,
    lastCleanup: new Date()
  };
  
  private static readonly MAX_TIMERS = 1000;
  private static readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private static readonly MEMORY_THRESHOLD = 500 * 1024 * 1024; // 500MB
  
  private static cleanupTimer: any | null = null;

  static initialize(): void {
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);

    logger.info('Typing performance optimizer initialized');
  }

  static createTimer(
    sessionId: string,
    type: TimerManager['type'],
    callback: () => void,
    delay: number
  ): string {
    const timerId = `${sessionId}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledFor = new Date(Date.now() + delay);
    
    // Check if we're approaching limits
    if (this.activeTimers.size >= this.MAX_TIMERS) {
      logger.warn('Timer limit approaching, forcing cleanup', {
        activeTimers: this.activeTimers.size,
        maxTimers: this.MAX_TIMERS
      });
      this.performCleanup();
    }

    const timer = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        logger.error('Timer callback error', { timerId, error });
      } finally {
        this.activeTimers.delete(timerId);
        this.updateMetrics();
      }
    }, delay);

    const timerManager: TimerManager = {
      id: timerId,
      sessionId,
      type,
      timer,
      createdAt: new Date(),
      scheduledFor
    };

    this.activeTimers.set(timerId, timerManager);
    this.updateMetrics();

    return timerId;
  }

  static clearTimer(timerId: string): boolean {
    const timerManager = this.activeTimers.get(timerId);
    if (!timerManager) return false;

    clearTimeout(timerManager.timer);
    this.activeTimers.delete(timerId);
    this.updateMetrics();

    return true;
  }

  static clearSessionTimers(sessionId: string): number {
    let clearedCount = 0;
    
    for (const [timerId, timerManager] of this.activeTimers.entries()) {
      if (timerManager.sessionId === sessionId) {
        clearTimeout(timerManager.timer);
        this.activeTimers.delete(timerId);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      this.updateMetrics();
      logger.debug('Cleared session timers', { sessionId, count: clearedCount });
    }

    return clearedCount;
  }

  static createOptimizedDelay(baseDelay: number, priority: 'high' | 'medium' | 'low' = 'medium'): number {
    const currentLoad = this.activeTimers.size;
    const loadFactor = Math.min(currentLoad / 100, 2.0); // Cap at 2x delay
    
    const priorityMultipliers = {
      high: 1.0,    // No additional delay for high priority
      medium: 1.2,  // 20% additional delay
      low: 1.5      // 50% additional delay
    };

    let optimizedDelay = baseDelay * priorityMultipliers[priority];
    
    // Apply load-based adjustment
    if (loadFactor > 1.0) {
      optimizedDelay *= loadFactor;
      logger.debug('Applied load-based delay adjustment', { 
        originalDelay: baseDelay, 
        optimizedDelay, 
        loadFactor,
        currentLoad 
      });
    }

    return Math.round(optimizedDelay);
  }

  static batch(operations: Array<{ callback: () => void; delay: number; priority?: 'high' | 'medium' | 'low' }>): string[] {
    const timerIds: string[] = [];
    
    // Sort by delay to optimize execution order
    const sortedOps = operations.sort((a, b) => a.delay - b.delay);
    
    let cumulativeDelay = 0;
    
    for (const op of sortedOps) {
      const optimizedDelay = this.createOptimizedDelay(cumulativeDelay + op.delay, op.priority);
      
      const timerId = this.createTimer(
        'batch_operation',
        'typing',
        op.callback,
        optimizedDelay
      );
      
      timerIds.push(timerId);
      cumulativeDelay = optimizedDelay;
    }

    logger.debug('Batched timer operations', { count: operations.length, timerIds });
    return timerIds;
  }

  static throttle<T extends (..._args: any[]) => void>(
    func: T,
    limit: number
  ): (..._args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (..._args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, _args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static debounce<T extends (..._args: any[]) => void>(
    func: T,
    delay: number
  ): (..._args: Parameters<T>) => void {
    let timeoutId: any;
    
    return (..._args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, _args), delay);
    };
  }

  private static performCleanup(): void {
    const now = new Date();
    let cleanedCount = 0;
    
    // Clean up expired timers
    for (const [timerId, timerManager] of this.activeTimers.entries()) {
      if (now > timerManager.scheduledFor) {
        clearTimeout(timerManager.timer);
        this.activeTimers.delete(timerId);
        cleanedCount++;
      }
    }

    // Force garbage collection if memory usage is high
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed > this.MEMORY_THRESHOLD && global.gc) {
      global.gc();
      logger.debug('Forced garbage collection due to high memory usage', {
        heapUsed: memoryUsage.heapUsed,
        threshold: this.MEMORY_THRESHOLD
      });
    }

    this.updateMetrics();
    this.performanceMetrics.lastCleanup = now;

    if (cleanedCount > 0) {
      logger.debug('Performance cleanup completed', {
        cleanedTimers: cleanedCount,
        activeTimers: this.activeTimers.size,
        memoryUsage: memoryUsage.heapUsed
      });
    }
  }

  private static updateMetrics(): void {
    this.performanceMetrics.timerCount = this.activeTimers.size;
    this.performanceMetrics.memoryUsage = process.memoryUsage();
    
    // Update active simulations count (rough estimate based on timer types)
    const typingTimers = Array.from(this.activeTimers.values())
      .filter(t => t.type === 'typing');
    const uniqueSessions = new Set(typingTimers.map(t => t.sessionId));
    this.performanceMetrics.activeSimulations = uniqueSessions.size;
  }

  static getMetrics(): PerformanceMetrics {
    this.updateMetrics();
    return { ...this.performanceMetrics };
  }

  static getTimersBySession(sessionId: string): TimerManager[] {
    return Array.from(this.activeTimers.values())
      .filter(t => t.sessionId === sessionId);
  }

  static getHealthStatus(): { status: 'healthy' | 'warning' | 'critical'; details: any } {
    const metrics = this.getMetrics();
    const memoryUsageMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const issues: string[] = [];

    if (metrics.timerCount > this.MAX_TIMERS * 0.8) {
      status = 'warning';
      issues.push(`High timer count: ${metrics.timerCount}`);
    }

    if (metrics.timerCount > this.MAX_TIMERS) {
      status = 'critical';
      issues.push(`Timer limit exceeded: ${metrics.timerCount}`);
    }

    if (memoryUsageMB > 400) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`High memory usage: ${memoryUsageMB.toFixed(2)}MB`);
    }

    if (memoryUsageMB > 500) {
      status = 'critical';
      issues.push(`Critical memory usage: ${memoryUsageMB.toFixed(2)}MB`);
    }

    return {
      status,
      details: {
        metrics,
        issues,
        recommendations: this.getRecommendations(status, issues)
      }
    };
  }

  private static getRecommendations(status: string, issues: string[]): string[] {
    const recommendations: string[] = [];

    if (status === 'warning' || status === 'critical') {
      recommendations.push('Consider reducing typing simulation complexity');
      recommendations.push('Implement timer pooling for better resource management');
    }

    if (issues.some(i => i.includes('memory'))) {
      recommendations.push('Enable garbage collection');
      recommendations.push('Reduce concurrent typing simulations');
    }

    if (issues.some(i => i.includes('timer'))) {
      recommendations.push('Implement timer batching');
      recommendations.push('Reduce typing simulation frequency');
    }

    return recommendations;
  }

  static shutdown(): void {
    logger.info('Shutting down typing performance optimizer');
    
    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Clear all active timers
    for (const [, timerManager] of this.activeTimers.entries()) {
      clearTimeout(timerManager.timer);
    }
    
    this.activeTimers.clear();
    this.updateMetrics();
    
    logger.info('Typing performance optimizer shutdown complete');
  }
}

// Export singleton instance
export const typingPerformance = TypingPerformanceOptimizer;

export default TypingPerformanceOptimizer;