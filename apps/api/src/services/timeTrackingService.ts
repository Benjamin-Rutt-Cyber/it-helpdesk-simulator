import { logger } from '../utils/logger';

export interface TimeEntry {
  id: string;
  ticketId: string;
  userId: string;
  phase: 'investigation' | 'analysis' | 'implementation' | 'testing' | 'documentation' | 'communication';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  description: string;
  category: 'manual' | 'automatic' | 'inferred';
  metadata?: {
    componentType?: string;
    actionType?: string;
    pauseReason?: string;
    interruptionCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSession {
  id: string;
  ticketId: string;
  userId: string;
  sessionStart: Date;
  sessionEnd?: Date;
  totalDuration: number; // in seconds
  entries: TimeEntry[];
  breaks: Array<{
    startTime: Date;
    endTime?: Date;
    duration?: number;
    reason?: string;
  }>;
  status: 'active' | 'paused' | 'completed';
  efficiency: number; // percentage of active work time
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolutionMetrics {
  ticketId: string;
  totalResolutionTime: number; // in seconds
  phaseBreakdown: Record<string, number>;
  efficiency: number;
  interruptions: number;
  pauseTime: number;
  activeWorkTime: number;
  averageSessionLength: number;
  timeToFirstAction: number;
  timeToResolution: number;
  comparisonMetrics: {
    avgForCategory: number;
    avgForUser: number;
    avgOverall: number;
    percentile: number;
  };
  recommendations: string[];
}

export interface TimeAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'quarter';
  startDate: Date;
  endDate: Date;
  totalTickets: number;
  averageResolutionTime: number;
  phaseDistribution: Record<string, number>;
  efficiencyTrend: Array<{
    date: Date;
    efficiency: number;
  }>;
  productivityScore: number;
  improvements: Array<{
    area: string;
    currentValue: number;
    targetValue: number;
    suggestion: string;
  }>;
}

export class TimeTrackingService {
  private static instance: TimeTrackingService;
  private sessions: Map<string, TimeSession> = new Map();
  private entries: Map<string, TimeEntry> = new Map();
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  public static getInstance(): TimeTrackingService {
    if (!TimeTrackingService.instance) {
      TimeTrackingService.instance = new TimeTrackingService();
    }
    return TimeTrackingService.instance;
  }

  async startSession(ticketId: string, userId: string): Promise<string> {
    try {
      // End any existing active session for this user
      await this.endActiveSessionsForUser(userId);

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: TimeSession = {
        id: sessionId,
        ticketId,
        userId,
        sessionStart: new Date(),
        totalDuration: 0,
        entries: [],
        breaks: [],
        status: 'active',
        efficiency: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.sessions.set(sessionId, session);

      // Start automatic tracking
      await this.startTimeEntry(
        sessionId,
        'investigation',
        'Session started - initial investigation phase'
      );

      logger.info('Started time tracking session', {
        sessionId,
        ticketId,
        userId
      });

      return sessionId;
    } catch (error) {
      logger.error('Failed to start time tracking session', { error, ticketId, userId });
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Time session not found: ${sessionId}`);
      }

      // End current time entry if active
      const activeEntry = session.entries.find(e => !e.endTime);
      if (activeEntry) {
        await this.endTimeEntry(activeEntry.id);
      }

      // End any active break
      const activeBreak = session.breaks.find(b => !b.endTime);
      if (activeBreak) {
        activeBreak.endTime = new Date();
        activeBreak.duration = Math.floor((activeBreak.endTime.getTime() - activeBreak.startTime.getTime()) / 1000);
      }

      // Calculate session totals
      session.sessionEnd = new Date();
      session.totalDuration = Math.floor((session.sessionEnd.getTime() - session.sessionStart.getTime()) / 1000);
      session.status = 'completed';
      session.updatedAt = new Date();

      // Calculate efficiency
      const breakTime = session.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
      const activeWorkTime = session.totalDuration - breakTime;
      session.efficiency = session.totalDuration > 0 ? (activeWorkTime / session.totalDuration) * 100 : 0;

      // Clear any active timers
      const timerId = this.activeTimers.get(sessionId);
      if (timerId) {
        clearInterval(timerId);
        this.activeTimers.delete(sessionId);
      }

      logger.info('Ended time tracking session', {
        sessionId,
        ticketId: session.ticketId,
        totalDuration: session.totalDuration,
        efficiency: session.efficiency
      });
    } catch (error) {
      logger.error('Failed to end time tracking session', { error, sessionId });
      throw error;
    }
  }

  async startTimeEntry(
    sessionId: string,
    phase: TimeEntry['phase'],
    description: string,
    category: TimeEntry['category'] = 'automatic'
  ): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Time session not found: ${sessionId}`);
      }

      // End current active entry if exists
      const activeEntry = session.entries.find(e => !e.endTime);
      if (activeEntry) {
        await this.endTimeEntry(activeEntry.id);
      }

      const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const entry: TimeEntry = {
        id: entryId,
        ticketId: session.ticketId,
        userId: session.userId,
        phase,
        startTime: new Date(),
        description,
        category,
        metadata: {
          interruptionCount: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.entries.set(entryId, entry);
      session.entries.push(entry);
      session.updatedAt = new Date();

      logger.info('Started time entry', {
        entryId,
        sessionId,
        phase,
        description
      });

      return entryId;
    } catch (error) {
      logger.error('Failed to start time entry', { error, sessionId, phase });
      throw error;
    }
  }

  async endTimeEntry(entryId: string): Promise<void> {
    try {
      const entry = this.entries.get(entryId);
      if (!entry) {
        throw new Error(`Time entry not found: ${entryId}`);
      }

      if (entry.endTime) {
        logger.warn('Time entry already ended', { entryId });
        return;
      }

      entry.endTime = new Date();
      entry.duration = Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000);
      entry.updatedAt = new Date();

      logger.info('Ended time entry', {
        entryId,
        phase: entry.phase,
        duration: entry.duration
      });
    } catch (error) {
      logger.error('Failed to end time entry', { error, entryId });
      throw error;
    }
  }

  async pauseSession(sessionId: string, reason?: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Time session not found: ${sessionId}`);
      }

      // End current time entry
      const activeEntry = session.entries.find(e => !e.endTime);
      if (activeEntry) {
        await this.endTimeEntry(activeEntry.id);
      }

      // Start break
      session.breaks.push({
        startTime: new Date(),
        reason
      });

      session.status = 'paused';
      session.updatedAt = new Date();

      logger.info('Paused time tracking session', {
        sessionId,
        reason
      });
    } catch (error) {
      logger.error('Failed to pause time tracking session', { error, sessionId });
      throw error;
    }
  }

  async resumeSession(sessionId: string, phase?: TimeEntry['phase']): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Time session not found: ${sessionId}`);
      }

      // End current break
      const activeBreak = session.breaks.find(b => !b.endTime);
      if (activeBreak) {
        activeBreak.endTime = new Date();
        activeBreak.duration = Math.floor((activeBreak.endTime.getTime() - activeBreak.startTime.getTime()) / 1000);
      }

      // Resume with specified phase or last phase
      const lastEntry = session.entries[session.entries.length - 1];
      const resumePhase = phase || lastEntry?.phase || 'investigation';
      
      await this.startTimeEntry(
        sessionId,
        resumePhase,
        `Resumed session - continuing ${resumePhase} phase`
      );

      session.status = 'active';
      session.updatedAt = new Date();

      logger.info('Resumed time tracking session', {
        sessionId,
        phase: resumePhase
      });
    } catch (error) {
      logger.error('Failed to resume time tracking session', { error, sessionId });
      throw error;
    }
  }

  async changePhase(sessionId: string, newPhase: TimeEntry['phase'], description?: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Time session not found: ${sessionId}`);
      }

      const phaseDescription = description || `Switched to ${newPhase} phase`;
      await this.startTimeEntry(sessionId, newPhase, phaseDescription, 'manual');

      logger.info('Changed tracking phase', {
        sessionId,
        newPhase,
        description: phaseDescription
      });
    } catch (error) {
      logger.error('Failed to change tracking phase', { error, sessionId, newPhase });
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<TimeSession | null> {
    try {
      return this.sessions.get(sessionId) || null;
    } catch (error) {
      logger.error('Failed to get time session', { error, sessionId });
      throw error;
    }
  }

  async getSessionByTicket(ticketId: string): Promise<TimeSession | null> {
    try {
      for (const session of this.sessions.values()) {
        if (session.ticketId === ticketId) {
          return session;
        }
      }
      return null;
    } catch (error) {
      logger.error('Failed to get session by ticket', { error, ticketId });
      throw error;
    }
  }

  async getResolutionMetrics(ticketId: string): Promise<ResolutionMetrics> {
    try {
      const session = await this.getSessionByTicket(ticketId);
      if (!session) {
        throw new Error(`No time session found for ticket: ${ticketId}`);
      }

      // Calculate phase breakdown
      const phaseBreakdown: Record<string, number> = {};
      session.entries.forEach(entry => {
        if (entry.duration) {
          phaseBreakdown[entry.phase] = (phaseBreakdown[entry.phase] || 0) + entry.duration;
        }
      });

      // Calculate metrics
      const totalBreakTime = session.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
      const activeWorkTime = session.totalDuration - totalBreakTime;
      const interruptions = session.entries.reduce((sum, e) => sum + (e.metadata?.interruptionCount || 0), 0);
      const averageSessionLength = session.entries.length > 0 ? session.totalDuration / session.entries.length : 0;

      // Mock comparison metrics (in real app, this would query historical data)
      const comparisonMetrics = {
        avgForCategory: session.totalDuration * 1.2,
        avgForUser: session.totalDuration * 0.9,
        avgOverall: session.totalDuration * 1.1,
        percentile: 75
      };

      // Generate recommendations
      const recommendations: string[] = [];
      if (session.efficiency < 70) {
        recommendations.push('Consider reducing break time or interruptions to improve efficiency');
      }
      if (phaseBreakdown.investigation > session.totalDuration * 0.4) {
        recommendations.push('Investigation phase took longer than typical - consider structured approach');
      }
      if (interruptions > 3) {
        recommendations.push('High number of interruptions detected - consider dedicated focus time');
      }
      if (!phaseBreakdown.documentation || phaseBreakdown.documentation < 300) {
        recommendations.push('Ensure adequate time is allocated for documentation');
      }

      return {
        ticketId,
        totalResolutionTime: session.totalDuration,
        phaseBreakdown,
        efficiency: session.efficiency,
        interruptions,
        pauseTime: totalBreakTime,
        activeWorkTime,
        averageSessionLength,
        timeToFirstAction: session.entries[0]?.duration || 0,
        timeToResolution: session.totalDuration,
        comparisonMetrics,
        recommendations
      };
    } catch (error) {
      logger.error('Failed to get resolution metrics', { error, ticketId });
      throw error;
    }
  }

  async getTimeAnalytics(
    userId: string,
    period: 'day' | 'week' | 'month' | 'quarter' = 'week'
  ): Promise<TimeAnalytics> {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
      }

      const userSessions = Array.from(this.sessions.values())
        .filter(s => s.userId === userId && s.createdAt >= startDate);

      const totalTickets = userSessions.length;
      const averageResolutionTime = totalTickets > 0 
        ? userSessions.reduce((sum, s) => sum + s.totalDuration, 0) / totalTickets 
        : 0;

      // Calculate phase distribution
      const phaseDistribution: Record<string, number> = {};
      userSessions.forEach(session => {
        session.entries.forEach(entry => {
          if (entry.duration) {
            phaseDistribution[entry.phase] = (phaseDistribution[entry.phase] || 0) + entry.duration;
          }
        });
      });

      // Mock efficiency trend
      const efficiencyTrend = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000),
        efficiency: 75 + Math.random() * 20
      }));

      // Calculate productivity score
      const avgEfficiency = userSessions.reduce((sum, s) => sum + s.efficiency, 0) / (totalTickets || 1);
      const completionRate = totalTickets > 0 ? userSessions.filter(s => s.status === 'completed').length / totalTickets : 0;
      const productivityScore = Math.round((avgEfficiency * 0.6 + completionRate * 100 * 0.4));

      // Generate improvement suggestions
      const improvements = [];
      if (avgEfficiency < 80) {
        improvements.push({
          area: 'Focus Time',
          currentValue: avgEfficiency,
          targetValue: 85,
          suggestion: 'Reduce interruptions and breaks during active work sessions'
        });
      }
      if (averageResolutionTime > 7200) { // 2 hours
        improvements.push({
          area: 'Resolution Speed',
          currentValue: averageResolutionTime / 3600,
          targetValue: 1.5,
          suggestion: 'Consider using templates and automation to speed up common tasks'
        });
      }

      return {
        userId,
        period,
        startDate,
        endDate: now,
        totalTickets,
        averageResolutionTime,
        phaseDistribution,
        efficiencyTrend,
        productivityScore,
        improvements
      };
    } catch (error) {
      logger.error('Failed to get time analytics', { error, userId, period });
      throw error;
    }
  }

  async recordInterruption(entryId: string, description?: string): Promise<void> {
    try {
      const entry = this.entries.get(entryId);
      if (!entry) {
        throw new Error(`Time entry not found: ${entryId}`);
      }

      entry.metadata = {
        ...entry.metadata,
        interruptionCount: (entry.metadata?.interruptionCount || 0) + 1
      };
      entry.updatedAt = new Date();

      logger.info('Recorded interruption', {
        entryId,
        interruptionCount: entry.metadata.interruptionCount,
        description
      });
    } catch (error) {
      logger.error('Failed to record interruption', { error, entryId });
      throw error;
    }
  }

  private async endActiveSessionsForUser(userId: string): Promise<void> {
    const activeSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.status === 'active');

    for (const session of activeSessions) {
      await this.endSession(session.id);
    }
  }

  async exportTimeData(sessionId: string, format: 'json' | 'csv' | 'summary'): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Time session not found: ${sessionId}`);
      }

      switch (format) {
        case 'json':
          return JSON.stringify(session, null, 2);
        case 'csv':
          return this.exportToCSV(session);
        case 'summary':
          return this.exportSummary(session);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Failed to export time data', { error, sessionId, format });
      throw error;
    }
  }

  private exportToCSV(session: TimeSession): string {
    const headers = ['Phase', 'Start Time', 'End Time', 'Duration (minutes)', 'Description', 'Category'];
    const rows = session.entries.map(entry => [
      entry.phase,
      entry.startTime.toISOString(),
      entry.endTime?.toISOString() || 'In Progress',
      entry.duration ? Math.round(entry.duration / 60) : 0,
      `"${entry.description.replace(/"/g, '""')}"`,
      entry.category
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private exportSummary(session: TimeSession): string {
    const phaseBreakdown: Record<string, number> = {};
    session.entries.forEach(entry => {
      if (entry.duration) {
        phaseBreakdown[entry.phase] = (phaseBreakdown[entry.phase] || 0) + entry.duration;
      }
    });

    const totalBreakTime = session.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    return `# Time Tracking Summary

**Ticket:** ${session.ticketId}
**Session:** ${session.sessionStart.toLocaleDateString()} - ${session.sessionEnd?.toLocaleDateString() || 'Ongoing'}
**Total Duration:** ${formatTime(session.totalDuration)}
**Efficiency:** ${session.efficiency.toFixed(1)}%

## Phase Breakdown
${Object.entries(phaseBreakdown)
  .map(([phase, duration]) => `- **${phase.charAt(0).toUpperCase() + phase.slice(1)}:** ${formatTime(duration)}`)
  .join('\n')}

## Break Summary
- **Total Break Time:** ${formatTime(totalBreakTime)}
- **Number of Breaks:** ${session.breaks.length}

## Timeline
${session.entries.map((entry, index) => 
  `${index + 1}. **${entry.phase}** (${formatTime(entry.duration || 0)}) - ${entry.description}`
).join('\n')}

*Generated on ${new Date().toISOString()}*`;
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Time session not found: ${sessionId}`);
      }

      // Clear active timer if exists
      const timerId = this.activeTimers.get(sessionId);
      if (timerId) {
        clearInterval(timerId);
        this.activeTimers.delete(sessionId);
      }

      // Remove all entries
      session.entries.forEach(entry => {
        this.entries.delete(entry.id);
      });

      this.sessions.delete(sessionId);

      logger.info('Deleted time tracking session', {
        sessionId,
        ticketId: session.ticketId
      });
    } catch (error) {
      logger.error('Failed to delete time tracking session', { error, sessionId });
      throw error;
    }
  }
}