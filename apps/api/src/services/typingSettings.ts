import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export interface UserTypingPreferences {
  userId: string;
  speedMultiplier: number; // 0.5 - 2.0
  pauseMultiplier: number; // 0.5 - 2.0
  chunkingEnabled: boolean;
  indicatorsEnabled: boolean;
  accessibilityMode: boolean;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  autoAdjustSpeed: boolean;
  maxSimultaneousTyping: number;
  customPersonaSettings: Record<string, PersonaTypingOverride>;
  lastUpdated: Date;
}

export interface PersonaTypingOverride {
  personaId: string;
  speedMultiplier: number;
  pauseMultiplier: number;
  enabled: boolean;
}

export interface AdminTypingSettings {
  globalSpeedMultiplier: number;
  maxConcurrentSimulations: number;
  enablePerformanceMode: boolean;
  defaultDifficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  enableCustomization: boolean;
  enableAccessibilityFeatures: boolean;
  performanceThresholds: {
    maxTimers: number;
    memoryLimitMB: number;
    cpuThreshold: number;
  };
  lastUpdated: Date;
}

export interface SessionTypingState {
  sessionId: string;
  userId: string;
  currentSettings: UserTypingPreferences;
  performanceAdjustments: {
    speedAdjustment: number;
    lastAdjustment: Date;
    adjustmentReason: string;
  };
  adaptiveHistory: AdaptiveTypingData[];
}

export interface AdaptiveTypingData {
  timestamp: Date;
  userResponseTime: number;
  simulationAccuracy: number;
  userSatisfaction: number;
  recommendedAdjustment: number;
}

export class TypingSettingsService {
  private redis: RedisClientType;
  private defaultUserPreferences: UserTypingPreferences = {
    userId: '',
    speedMultiplier: 1.0,
    pauseMultiplier: 1.0,
    chunkingEnabled: true,
    indicatorsEnabled: true,
    accessibilityMode: false,
    difficultyLevel: 'intermediate',
    autoAdjustSpeed: true,
    maxSimultaneousTyping: 3,
    customPersonaSettings: {},
    lastUpdated: new Date()
  };

  private defaultAdminSettings: AdminTypingSettings = {
    globalSpeedMultiplier: 1.0,
    maxConcurrentSimulations: 50,
    enablePerformanceMode: true,
    defaultDifficultyLevel: 'intermediate',
    enableCustomization: true,
    enableAccessibilityFeatures: true,
    performanceThresholds: {
      maxTimers: 1000,
      memoryLimitMB: 500,
      cpuThreshold: 80
    },
    lastUpdated: new Date()
  };

  private readonly SETTINGS_TTL = 86400; // 24 hours

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.redis.on('error', (err) => {
      logger.error('TypingSettingsService Redis connection error:', err);
    });

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      await this.redis.connect();
      logger.info('TypingSettingsService Redis client connected');
    } catch (error) {
      logger.error('Failed to connect to Redis for typing settings service:', error);
      throw error;
    }
  }

  async getUserPreferences(userId: string): Promise<UserTypingPreferences> {
    try {
      const key = this.getUserPreferencesKey(userId);
      const data = await this.redis.get(key);
      
      if (data) {
        const preferences = JSON.parse(data) as UserTypingPreferences;
        preferences.lastUpdated = new Date(preferences.lastUpdated);
        return preferences;
      }
      
      // Return default preferences with user ID
      return { ...this.defaultUserPreferences, userId };
    } catch (error) {
      logger.error(`Failed to get user preferences for ${userId}:`, error);
      return { ...this.defaultUserPreferences, userId };
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserTypingPreferences>): Promise<boolean> {
    try {
      const currentPreferences = await this.getUserPreferences(userId);
      const updatedPreferences: UserTypingPreferences = {
        ...currentPreferences,
        ...preferences,
        userId,
        lastUpdated: new Date()
      };

      // Validate preferences
      const validatedPreferences = this.validateUserPreferences(updatedPreferences);
      
      const key = this.getUserPreferencesKey(userId);
      await this.redis.setEx(key, this.SETTINGS_TTL, JSON.stringify(validatedPreferences));
      
      logger.info('User typing preferences updated', { userId, preferences: validatedPreferences });
      return true;
    } catch (error) {
      logger.error(`Failed to update user preferences for ${userId}:`, error);
      return false;
    }
  }

  async getAdminSettings(): Promise<AdminTypingSettings> {
    try {
      const key = 'typing_admin_settings';
      const data = await this.redis.get(key);
      
      if (data) {
        const settings = JSON.parse(data) as AdminTypingSettings;
        settings.lastUpdated = new Date(settings.lastUpdated);
        return settings;
      }
      
      return this.defaultAdminSettings;
    } catch (error) {
      logger.error('Failed to get admin settings:', error);
      return this.defaultAdminSettings;
    }
  }

  async updateAdminSettings(settings: Partial<AdminTypingSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getAdminSettings();
      const updatedSettings: AdminTypingSettings = {
        ...currentSettings,
        ...settings,
        lastUpdated: new Date()
      };

      // Validate admin settings
      const validatedSettings = this.validateAdminSettings(updatedSettings);
      
      const key = 'typing_admin_settings';
      await this.redis.setEx(key, this.SETTINGS_TTL, JSON.stringify(validatedSettings));
      
      logger.info('Admin typing settings updated', { settings: validatedSettings });
      return true;
    } catch (error) {
      logger.error('Failed to update admin settings:', error);
      return false;
    }
  }

  async getSessionSettings(sessionId: string, userId: string): Promise<SessionTypingState> {
    try {
      const key = this.getSessionStateKey(sessionId);
      const data = await this.redis.get(key);
      
      if (data) {
        const sessionState = JSON.parse(data) as SessionTypingState;
        // Convert date strings back to Date objects
        sessionState.performanceAdjustments.lastAdjustment = new Date(sessionState.performanceAdjustments.lastAdjustment);
        sessionState.adaptiveHistory = sessionState.adaptiveHistory.map(h => ({
          ...h,
          timestamp: new Date(h.timestamp)
        }));
        return sessionState;
      }
      
      // Create new session state
      const userPreferences = await this.getUserPreferences(userId);
      const sessionState: SessionTypingState = {
        sessionId,
        userId,
        currentSettings: userPreferences,
        performanceAdjustments: {
          speedAdjustment: 1.0,
          lastAdjustment: new Date(),
          adjustmentReason: 'initial'
        },
        adaptiveHistory: []
      };
      
      await this.saveSessionState(sessionState);
      return sessionState;
    } catch (error) {
      logger.error(`Failed to get session settings for ${sessionId}:`, error);
      throw error;
    }
  }

  async updateSessionSettings(
    sessionId: string, 
    updates: Partial<SessionTypingState>
  ): Promise<boolean> {
    try {
      const currentState = await this.getSessionSettings(sessionId, updates.userId!);
      const updatedState: SessionTypingState = {
        ...currentState,
        ...updates
      };
      
      await this.saveSessionState(updatedState);
      return true;
    } catch (error) {
      logger.error(`Failed to update session settings for ${sessionId}:`, error);
      return false;
    }
  }

  async recordAdaptiveData(
    sessionId: string,
    userId: string,
    data: Omit<AdaptiveTypingData, 'timestamp'>
  ): Promise<void> {
    try {
      const sessionState = await this.getSessionSettings(sessionId, userId);
      
      const adaptiveData: AdaptiveTypingData = {
        ...data,
        timestamp: new Date()
      };
      
      sessionState.adaptiveHistory.push(adaptiveData);
      
      // Keep only last 20 entries
      if (sessionState.adaptiveHistory.length > 20) {
        sessionState.adaptiveHistory = sessionState.adaptiveHistory.slice(-20);
      }
      
      // Calculate adaptive adjustments
      const adjustment = this.calculateAdaptiveAdjustment(sessionState.adaptiveHistory);
      if (sessionState.currentSettings.autoAdjustSpeed && Math.abs(adjustment - 1.0) > 0.1) {
        sessionState.performanceAdjustments = {
          speedAdjustment: adjustment,
          lastAdjustment: new Date(),
          adjustmentReason: 'adaptive_learning'
        };
      }
      
      await this.saveSessionState(sessionState);
      
      logger.debug('Adaptive typing data recorded', { sessionId, adjustment });
    } catch (error) {
      logger.error(`Failed to record adaptive data for ${sessionId}:`, error);
    }
  }

  async getDifficultySettings(level: 'beginner' | 'intermediate' | 'advanced'): Promise<{
    speedMultiplier: number;
    complexityReduction: number;
    pauseMultiplier: number;
    chunkSizeAdjustment: number;
  }> {
    const difficultyMap = {
      beginner: {
        speedMultiplier: 0.7,
        complexityReduction: 0.5,
        pauseMultiplier: 1.5,
        chunkSizeAdjustment: 0.8
      },
      intermediate: {
        speedMultiplier: 1.0,
        complexityReduction: 1.0,
        pauseMultiplier: 1.0,
        chunkSizeAdjustment: 1.0
      },
      advanced: {
        speedMultiplier: 1.3,
        complexityReduction: 1.2,
        pauseMultiplier: 0.8,
        chunkSizeAdjustment: 1.2
      }
    };

    return difficultyMap[level];
  }

  async createPreset(
    name: string, 
    description: string, 
    settings: Partial<UserTypingPreferences>
  ): Promise<boolean> {
    try {
      const preset = {
        name,
        description,
        settings: this.validateUserPreferences({ ...this.defaultUserPreferences, ...settings }),
        createdAt: new Date()
      };
      
      const key = `typing_preset:${name}`;
      await this.redis.setEx(key, this.SETTINGS_TTL * 7, JSON.stringify(preset)); // 7 days TTL
      
      logger.info('Typing preset created', { name, description });
      return true;
    } catch (error) {
      logger.error(`Failed to create preset ${name}:`, error);
      return false;
    }
  }

  async getPreset(name: string): Promise<any | null> {
    try {
      const key = `typing_preset:${name}`;
      const data = await this.redis.get(key);
      
      if (data) {
        const preset = JSON.parse(data);
        preset.createdAt = new Date(preset.createdAt);
        return preset;
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to get preset ${name}:`, error);
      return null;
    }
  }

  async listPresets(): Promise<string[]> {
    try {
      const keys = await this.redis.keys('typing_preset:*');
      return keys.map(key => key.replace('typing_preset:', ''));
    } catch (error) {
      logger.error('Failed to list presets:', error);
      return [];
    }
  }

  // Private helper methods
  private validateUserPreferences(preferences: UserTypingPreferences): UserTypingPreferences {
    return {
      ...preferences,
      speedMultiplier: Math.max(0.5, Math.min(2.0, preferences.speedMultiplier)),
      pauseMultiplier: Math.max(0.5, Math.min(2.0, preferences.pauseMultiplier)),
      maxSimultaneousTyping: Math.max(1, Math.min(10, preferences.maxSimultaneousTyping))
    };
  }

  private validateAdminSettings(settings: AdminTypingSettings): AdminTypingSettings {
    return {
      ...settings,
      globalSpeedMultiplier: Math.max(0.1, Math.min(5.0, settings.globalSpeedMultiplier)),
      maxConcurrentSimulations: Math.max(1, Math.min(200, settings.maxConcurrentSimulations)),
      performanceThresholds: {
        maxTimers: Math.max(100, Math.min(5000, settings.performanceThresholds.maxTimers)),
        memoryLimitMB: Math.max(100, Math.min(2048, settings.performanceThresholds.memoryLimitMB)),
        cpuThreshold: Math.max(50, Math.min(95, settings.performanceThresholds.cpuThreshold))
      }
    };
  }

  private calculateAdaptiveAdjustment(history: AdaptiveTypingData[]): number {
    if (history.length < 3) return 1.0;
    
    const recent = history.slice(-5); // Last 5 interactions
    const avgResponseTime = recent.reduce((sum, h) => sum + h.userResponseTime, 0) / recent.length;
    const avgSatisfaction = recent.reduce((sum, h) => sum + h.userSatisfaction, 0) / recent.length;
    
    // If user is responding too quickly, speed up typing
    if (avgResponseTime < 2000 && avgSatisfaction > 7) {
      return 1.2;
    }
    
    // If user is struggling to keep up, slow down
    if (avgResponseTime > 8000 || avgSatisfaction < 5) {
      return 0.8;
    }
    
    return 1.0;
  }

  private async saveSessionState(sessionState: SessionTypingState): Promise<void> {
    const key = this.getSessionStateKey(sessionState.sessionId);
    await this.redis.setEx(key, 3600, JSON.stringify(sessionState)); // 1 hour TTL
  }

  private getUserPreferencesKey(userId: string): string {
    return `typing_preferences:${userId}`;
  }

  private getSessionStateKey(sessionId: string): string {
    return `typing_session:${sessionId}`;
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('TypingSettingsService Redis connection closed');
    } catch (error) {
      logger.error('Error closing TypingSettingsService Redis connection:', error);
    }
  }
}

export const typingSettings = new TypingSettingsService();
export default typingSettings;