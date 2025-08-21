import { logger } from '../utils/logger';

export interface SearchSession {
  id: string;
  userId: string;
  ticketId?: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  isPersistent: boolean;
  metadata: SessionMetadata;
  state: SessionState;
  tabs: SessionTab[];
}

export interface SessionMetadata {
  userAgent: string;
  ipAddress?: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  platform: string;
  version: string;
  source: 'manual' | 'auto-save' | 'recovery' | 'import';
  tags: string[];
}

export interface SessionState {
  activeTabId?: string;
  viewMode: 'normal' | 'maximized' | 'minimized';
  sidebarCollapsed: boolean;
  filters: SessionFilter;
  preferences: SessionPreferences;
  context: any;
}

export interface SessionTab {
  id: string;
  name: string;
  query: string;
  filters: any;
  results: any[];
  scrollPosition: number;
  isActive: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionFilter {
  credibility?: string;
  sourceType?: string;
  dateRange?: string;
  tags?: string[];
}

export interface SessionPreferences {
  autoSave: boolean;
  saveInterval: number; // in milliseconds
  maxTabs: number;
  theme: 'light' | 'dark' | 'system';
  language: string;
  accessibility: AccessibilitySettings;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
}

export interface SessionBackup {
  id: string;
  sessionId: string;
  backupType: 'automatic' | 'manual' | 'checkpoint';
  createdAt: Date;
  data: SearchSession;
  size: number;
  compression?: string;
}

export interface SessionRecoveryInfo {
  sessionId: string;
  lastSaved: Date;
  tabCount: number;
  hasUnsavedChanges: boolean;
  recoveryScore: number; // 0-1, how likely recovery will be successful
  conflicts: SessionConflict[];
}

export interface SessionConflict {
  type: 'version_mismatch' | 'data_corruption' | 'missing_dependencies' | 'schema_change';
  severity: 'low' | 'medium' | 'high';
  description: string;
  autoResolvable: boolean;
  resolution?: string;
}

export interface SessionSyncStatus {
  sessionId: string;
  isSyncing: boolean;
  lastSyncAt?: Date;
  syncErrors: string[];
  conflictCount: number;
  devicesSynced: string[];
}

export class SessionManagerService {
  private sessions: Map<string, SearchSession> = new Map();
  private backups: Map<string, SessionBackup[]> = new Map();
  private syncStatus: Map<string, SessionSyncStatus> = new Map();
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private maxSessions = 100;
  private maxBackupsPerSession = 10;
  private defaultExpiration = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    // Start cleanup timer
    setInterval(() => this.performCleanup(), 60 * 60 * 1000); // Every hour
  }

  // Session Creation and Management
  async createSession(
    userId: string,
    ticketId?: string,
    options: {
      name?: string;
      description?: string;
      persistent?: boolean;
      autoSave?: boolean;
      expirationTime?: number;
    } = {}
  ): Promise<SearchSession> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: SearchSession = {
        id: sessionId,
        userId,
        ticketId,
        name: options.name || `Search Session ${new Date().toLocaleString()}`,
        description: options.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
        expiresAt: options.expirationTime 
          ? new Date(Date.now() + options.expirationTime)
          : new Date(Date.now() + this.defaultExpiration),
        isActive: true,
        isPersistent: options.persistent || false,
        metadata: {
          userAgent: 'SearchApp/1.0',
          deviceType: 'desktop',
          platform: 'web',
          version: '1.0.0',
          source: 'manual',
          tags: []
        },
        state: {
          viewMode: 'normal',
          sidebarCollapsed: false,
          filters: {},
          preferences: {
            autoSave: options.autoSave || true,
            saveInterval: 30000, // 30 seconds
            maxTabs: 8,
            theme: 'system',
            language: 'en',
            accessibility: {
              highContrast: false,
              largeText: false,
              reducedMotion: false,
              screenReader: false
            }
          },
          context: { ticketId }
        },
        tabs: []
      };

      // Check session limit for user
      const userSessions = Array.from(this.sessions.values())
        .filter(s => s.userId === userId && s.isActive);
      
      if (userSessions.length >= this.maxSessions) {
        // Remove oldest session
        const oldest = userSessions.sort((a, b) => 
          a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime()
        )[0];
        await this.deleteSession(oldest.id);
      }

      this.sessions.set(sessionId, session);

      // Setup auto-save if enabled
      if (session.state.preferences.autoSave) {
        this.setupAutoSave(sessionId);
      }

      logger.info('Search session created', {
        sessionId,
        userId,
        ticketId,
        persistent: session.isPersistent
      });

      return session;

    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<SearchSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Update last accessed time
    session.lastAccessedAt = new Date();
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<SearchSession>): Promise<SearchSession | null> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Merge updates
      Object.assign(session, updates, {
        updatedAt: new Date(),
        lastAccessedAt: new Date()
      });

      // Create automatic backup if significant changes
      if (this.isSignificantChange(updates)) {
        await this.createBackup(sessionId, 'automatic');
      }

      logger.debug('Session updated', {
        sessionId,
        updateKeys: Object.keys(updates)
      });

      return session;

    } catch (error) {
      logger.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }

      // Create final backup if persistent
      if (session.isPersistent) {
        await this.createBackup(sessionId, 'manual');
      }

      // Clear auto-save timer
      const timer = this.autoSaveTimers.get(sessionId);
      if (timer) {
        clearInterval(timer);
        this.autoSaveTimers.delete(sessionId);
      }

      // Remove session and associated data
      this.sessions.delete(sessionId);
      this.backups.delete(sessionId);
      this.syncStatus.delete(sessionId);

      logger.info('Session deleted', { sessionId });
      return true;

    } catch (error) {
      logger.error('Error deleting session:', error);
      throw error;
    }
  }

  async getUserSessions(userId: string): Promise<SearchSession[]> {
    try {
      const userSessions = Array.from(this.sessions.values())
        .filter(session => session.userId === userId)
        .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());

      return userSessions;

    } catch (error) {
      logger.error('Error getting user sessions:', error);
      throw error;
    }
  }

  // Tab Management
  async addTab(sessionId: string, tab: Omit<SessionTab, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newTab: SessionTab = {
        id: tabId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...tab
      };

      // Check tab limit
      if (session.tabs.length >= session.state.preferences.maxTabs) {
        // Remove oldest non-pinned tab
        const oldestIndex = session.tabs.findIndex(t => !t.isPinned);
        if (oldestIndex !== -1) {
          session.tabs.splice(oldestIndex, 1);
        }
      }

      session.tabs.push(newTab);
      session.updatedAt = new Date();

      logger.debug('Tab added to session', {
        sessionId,
        tabId,
        tabCount: session.tabs.length
      });

      return tabId;

    } catch (error) {
      logger.error('Error adding tab to session:', error);
      throw error;
    }
  }

  async updateTab(sessionId: string, tabId: string, updates: Partial<SessionTab>): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const tab = session.tabs.find(t => t.id === tabId);
      if (!tab) {
        throw new Error(`Tab not found: ${tabId}`);
      }

      Object.assign(tab, updates, { updatedAt: new Date() });
      session.updatedAt = new Date();

      logger.debug('Tab updated', { sessionId, tabId, updateKeys: Object.keys(updates) });

    } catch (error) {
      logger.error('Error updating tab:', error);
      throw error;
    }
  }

  async removeTab(sessionId: string, tabId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const tabIndex = session.tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) {
        throw new Error(`Tab not found: ${tabId}`);
      }

      session.tabs.splice(tabIndex, 1);
      session.updatedAt = new Date();

      // Update active tab if necessary
      if (session.state.activeTabId === tabId) {
        session.state.activeTabId = session.tabs.length > 0 ? session.tabs[0].id : undefined;
      }

      logger.debug('Tab removed from session', {
        sessionId,
        tabId,
        remainingTabs: session.tabs.length
      });

    } catch (error) {
      logger.error('Error removing tab:', error);
      throw error;
    }
  }

  // Backup and Recovery
  async createBackup(sessionId: string, backupType: 'automatic' | 'manual' | 'checkpoint'): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const backup: SessionBackup = {
        id: backupId,
        sessionId,
        backupType,
        createdAt: new Date(),
        data: JSON.parse(JSON.stringify(session)), // Deep clone
        size: JSON.stringify(session).length,
        compression: 'none'
      };

      // Manage backup limits
      if (!this.backups.has(sessionId)) {
        this.backups.set(sessionId, []);
      }

      const sessionBackups = this.backups.get(sessionId)!;
      sessionBackups.push(backup);

      // Keep only latest backups
      if (sessionBackups.length > this.maxBackupsPerSession) {
        sessionBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        sessionBackups.splice(this.maxBackupsPerSession);
      }

      logger.debug('Session backup created', {
        sessionId,
        backupId,
        backupType,
        size: backup.size
      });

      return backupId;

    } catch (error) {
      logger.error('Error creating backup:', error);
      throw error;
    }
  }

  async getRecoveryInfo(sessionId: string): Promise<SessionRecoveryInfo | null> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return null;
      }

      const backups = this.backups.get(sessionId) || [];
      const latestBackup = backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      const recoveryInfo: SessionRecoveryInfo = {
        sessionId,
        lastSaved: latestBackup ? latestBackup.createdAt : session.updatedAt,
        tabCount: session.tabs.length,
        hasUnsavedChanges: this.hasUnsavedChanges(session),
        recoveryScore: this.calculateRecoveryScore(session, backups),
        conflicts: this.detectConflicts(session)
      };

      return recoveryInfo;

    } catch (error) {
      logger.error('Error getting recovery info:', error);
      throw error;
    }
  }

  async recoverSession(sessionId: string, backupId?: string): Promise<SearchSession> {
    try {
      const sessionBackups = this.backups.get(sessionId);
      if (!sessionBackups || sessionBackups.length === 0) {
        throw new Error(`No backups available for session: ${sessionId}`);
      }

      let backup: SessionBackup;
      if (backupId) {
        backup = sessionBackups.find(b => b.id === backupId)!;
        if (!backup) {
          throw new Error(`Backup not found: ${backupId}`);
        }
      } else {
        // Use latest backup
        backup = sessionBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      }

      // Restore session from backup
      const recoveredSession = { ...backup.data };
      recoveredSession.metadata.source = 'recovery';
      recoveredSession.updatedAt = new Date();
      recoveredSession.lastAccessedAt = new Date();

      this.sessions.set(sessionId, recoveredSession);

      // Setup auto-save if enabled
      if (recoveredSession.state.preferences.autoSave) {
        this.setupAutoSave(sessionId);
      }

      logger.info('Session recovered', {
        sessionId,
        backupId: backup.id,
        backupDate: backup.createdAt
      });

      return recoveredSession;

    } catch (error) {
      logger.error('Error recovering session:', error);
      throw error;
    }
  }

  // Session Persistence
  private setupAutoSave(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Clear existing timer
    const existingTimer = this.autoSaveTimers.get(sessionId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Setup new timer
    const timer = setInterval(async () => {
      try {
        await this.createBackup(sessionId, 'automatic');
      } catch (error) {
        logger.error('Auto-save failed for session:', { sessionId, error });
      }
    }, session.state.preferences.saveInterval);

    this.autoSaveTimers.set(sessionId, timer);
  }

  private isSignificantChange(updates: Partial<SearchSession>): boolean {
    // Define what constitutes a significant change worthy of backup
    const significantFields = ['tabs', 'state', 'name'];
    return significantFields.some(field => updates.hasOwnProperty(field));
  }

  private hasUnsavedChanges(session: SearchSession): boolean {
    // Check if session has changes since last backup
    const backups = this.backups.get(session.id) || [];
    if (backups.length === 0) return true;

    const latestBackup = backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return session.updatedAt > latestBackup.createdAt;
  }

  private calculateRecoveryScore(session: SearchSession, backups: SessionBackup[]): number {
    let score = 0.5; // Base score

    // Factor in backup availability
    if (backups.length > 0) {
      score += 0.3;
      
      // Recent backups are better
      const latestBackup = backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      const backupAge = Date.now() - latestBackup.createdAt.getTime();
      const hoursSinceBackup = backupAge / (60 * 60 * 1000);
      
      if (hoursSinceBackup < 1) score += 0.2;
      else if (hoursSinceBackup < 24) score += 0.1;
    }

    // Factor in data integrity
    if (session.tabs.length > 0) score += 0.1;
    if (session.state && session.state.context) score += 0.1;

    return Math.min(score, 1);
  }

  private detectConflicts(session: SearchSession): SessionConflict[] {
    const conflicts: SessionConflict[] = [];

    // Check for data integrity issues
    if (!session.state) {
      conflicts.push({
        type: 'data_corruption',
        severity: 'high',
        description: 'Session state is missing',
        autoResolvable: true,
        resolution: 'Initialize with default state'
      });
    }

    // Check for version compatibility
    if (session.metadata.version !== '1.0.0') {
      conflicts.push({
        type: 'version_mismatch',
        severity: 'medium',
        description: 'Session was created with different version',
        autoResolvable: true,
        resolution: 'Migrate to current version'
      });
    }

    return conflicts;
  }

  // Cleanup and Maintenance
  private async performCleanup(): Promise<void> {
    try {
      const now = Date.now();
      let cleanedSessions = 0;
      let cleanedBackups = 0;

      // Clean up expired sessions
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.expiresAt && session.expiresAt.getTime() < now) {
          await this.deleteSession(sessionId);
          cleanedSessions++;
        }
      }

      // Clean up old backups
      for (const [sessionId, backups] of this.backups.entries()) {
        const validBackups = backups.filter(backup => {
          const backupAge = now - backup.createdAt.getTime();
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          return backupAge < maxAge;
        });

        if (validBackups.length !== backups.length) {
          this.backups.set(sessionId, validBackups);
          cleanedBackups += backups.length - validBackups.length;
        }
      }

      if (cleanedSessions > 0 || cleanedBackups > 0) {
        logger.info('Session cleanup completed', {
          cleanedSessions,
          cleanedBackups
        });
      }

    } catch (error) {
      logger.error('Error during session cleanup:', error);
    }
  }

  // Service Status
  async getServiceStatus(): Promise<{
    activeSessions: number;
    totalSessions: number;
    totalBackups: number;
    autoSaveActive: number;
    isHealthy: boolean;
  }> {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive).length;
    const totalBackups = Array.from(this.backups.values()).reduce((sum, backups) => sum + backups.length, 0);

    return {
      activeSessions,
      totalSessions: this.sessions.size,
      totalBackups,
      autoSaveActive: this.autoSaveTimers.size,
      isHealthy: true
    };
  }

  // Export/Import
  async exportSession(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const backups = this.backups.get(sessionId) || [];

    return {
      session,
      backups,
      exportedAt: new Date(),
      version: '1.0.0'
    };
  }

  async importSession(importData: any): Promise<string> {
    if (!importData.session) {
      throw new Error('Invalid import data: missing session');
    }

    const session = importData.session;
    session.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    session.metadata.source = 'import';
    session.createdAt = new Date();
    session.updatedAt = new Date();
    session.lastAccessedAt = new Date();

    this.sessions.set(session.id, session);

    // Import backups if available
    if (importData.backups && Array.isArray(importData.backups)) {
      this.backups.set(session.id, importData.backups);
    }

    logger.info('Session imported', {
      sessionId: session.id,
      originalId: importData.session.id,
      backupCount: importData.backups?.length || 0
    });

    return session.id;
  }
}