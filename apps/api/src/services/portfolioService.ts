import { PortfolioBuilder, ProfessionalPortfolio } from './portfolioBuilder';
import { HistoryManager, PerformanceHistory } from './historyManager';
import { ExportEngine, ExportConfiguration } from './exportEngine';
import { PrivacyController, PrivacySettings } from './privacyController';
import { EmployerIntegration, CandidateApplication } from './employerIntegration';
import { EvidenceManager, SkillEvidence } from './evidenceManager';
import { logger } from '../utils/logger';

export interface PortfolioServiceConfiguration {
  userId: string;
  enableAnalytics: boolean;
  enableRealtimeUpdates: boolean;
  dataRetentionDays: number;
  maxPortfolioVersions: number;
}

export interface PortfolioGenerationOptions {
  template: 'professional' | 'academic' | 'creative' | 'technical' | 'executive';
  targetAudience: 'employer' | 'certification' | 'academic' | 'networking';
  includePrivateData: boolean;
  customSections?: string[];
  branding?: {
    usePersonalBranding: boolean;
    colors?: Record<string, string>;
    logo?: string;
  };
}

export interface PortfolioAnalytics {
  views: number;
  downloads: number;
  shares: number;
  employerInteractions: number;
  topSkillsViewed: string[];
  conversionRate: number;
  lastUpdated: Date;
  performanceTrends: {
    period: string;
    score: number;
    improvement: number;
  }[];
}

export interface PortfolioVersion {
  id: string;
  version: number;
  createdAt: Date;
  purpose: string;
  configuration: PortfolioGenerationOptions;
  portfolio: ProfessionalPortfolio;
  analytics: PortfolioAnalytics;
  status: 'draft' | 'active' | 'archived';
}

export interface PortfolioSummary {
  totalPortfolios: number;
  activePortfolios: number;
  totalViews: number;
  totalDownloads: number;
  skillsDocumented: number;
  achievementsEarned: number;
  verificationStatus: {
    verified: number;
    pending: number;
    total: number;
  };
  lastActivity: Date;
}

export class PortfolioService {
  private portfolioBuilder: PortfolioBuilder;
  private historyManager: HistoryManager;
  private exportEngine: ExportEngine;
  private privacyController: PrivacyController;
  private employerIntegration: EmployerIntegration;
  private evidenceManager: EvidenceManager;
  private portfolioVersions: Map<string, PortfolioVersion[]> = new Map();
  private portfolioAnalytics: Map<string, PortfolioAnalytics> = new Map();

  constructor() {
    this.portfolioBuilder = new PortfolioBuilder();
    this.historyManager = new HistoryManager();
    this.exportEngine = new ExportEngine();
    this.privacyController = new PrivacyController();
    this.employerIntegration = new EmployerIntegration();
    this.evidenceManager = new EvidenceManager();
  }

  async initializeUserPortfolio(config: PortfolioServiceConfiguration): Promise<void> {
    try {
      logger.info(`Initializing portfolio for user ${config.userId}`);
      
      // Initialize user's portfolio storage
      this.portfolioVersions.set(config.userId, []);
      
      // Set up default privacy settings
      await this.privacyController.initializeUserPrivacy(config.userId, {
        profileVisibility: 'private',
        performanceSharing: {
          scores: false,
          rankings: false,
          comparisons: false,
          history: false
        },
        contactInformation: {
          email: false,
          phone: false,
          address: false
        },
        employerAccess: {
          fullProfile: false,
          performanceData: false,
          skillEvidence: false,
          recommendations: false
        },
        dataRetention: {
          automaticDeletion: false,
          retentionPeriod: config.dataRetentionDays,
          archiveAfter: 365
        },
        consentManagement: {
          explicitConsent: true,
          granularConsent: true,
          consentHistory: []
        }
      });

      // Initialize analytics
      this.portfolioAnalytics.set(config.userId, {
        views: 0,
        downloads: 0,
        shares: 0,
        employerInteractions: 0,
        topSkillsViewed: [],
        conversionRate: 0,
        lastUpdated: new Date(),
        performanceTrends: []
      });

      logger.info(`Portfolio initialized successfully for user ${config.userId}`);
    } catch (error) {
      logger.error(`Failed to initialize portfolio for user ${config.userId}:`, error);
      throw error;
    }
  }

  async generatePortfolio(
    userId: string, 
    options: PortfolioGenerationOptions
  ): Promise<ProfessionalPortfolio> {
    try {
      logger.info(`Generating portfolio for user ${userId} with template ${options.template}`);

      // Get user's performance history
      const performanceHistory = await this.historyManager.getCompleteHistory(userId);
      
      // Get user's skill evidence
      const skillEvidence = await this.evidenceManager.getUserEvidence(userId);
      
      // Check privacy settings for included data
      const privacySettings = await this.privacyController.getUserPrivacySettings(userId);
      const filteredData = await this.filterDataByPrivacy(
        performanceHistory, 
        skillEvidence, 
        privacySettings, 
        options
      );

      // Generate the portfolio
      const portfolio = await this.portfolioBuilder.generatePortfolio(
        userId,
        filteredData.history,
        filteredData.evidence,
        options
      );

      // Save portfolio version
      await this.savePortfolioVersion(userId, portfolio, options);

      // Update analytics
      await this.updateAnalytics(userId, 'generation');

      logger.info(`Portfolio generated successfully for user ${userId}`);
      return portfolio;
    } catch (error) {
      logger.error(`Failed to generate portfolio for user ${userId}:`, error);
      throw error;
    }
  }

  async exportPortfolio(
    userId: string,
    portfolioId: string,
    exportConfig: ExportConfiguration
  ): Promise<Buffer> {
    try {
      logger.info(`Exporting portfolio ${portfolioId} for user ${userId} in format ${exportConfig.format}`);

      // Get the portfolio version
      const portfolio = await this.getPortfolioById(userId, portfolioId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Check privacy permissions for export
      const hasPermission = await this.privacyController.checkExportPermissions(
        userId,
        exportConfig.recipient
      );
      
      if (!hasPermission) {
        throw new Error('Export not permitted by privacy settings');
      }

      // Export the portfolio
      const exportedData = await this.exportEngine.exportPortfolio(
        portfolio.portfolio,
        exportConfig
      );

      // Update analytics
      await this.updateAnalytics(userId, 'export');

      // Log export activity
      await this.privacyController.logDataAccess(userId, {
        action: 'export',
        format: exportConfig.format,
        recipient: exportConfig.recipient,
        timestamp: new Date()
      });

      logger.info(`Portfolio exported successfully for user ${userId}`);
      return exportedData;
    } catch (error) {
      logger.error(`Failed to export portfolio for user ${userId}:`, error);
      throw error;
    }
  }

  async sharePortfolioWithEmployer(
    userId: string,
    portfolioId: string,
    employerId: string,
    applicationData: {
      position: string;
      coverLetter?: string;
      customMessage?: string;
    }
  ): Promise<CandidateApplication> {
    try {
      logger.info(`Sharing portfolio ${portfolioId} with employer ${employerId} for user ${userId}`);

      // Get the portfolio
      const portfolio = await this.getPortfolioById(userId, portfolioId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Check privacy permissions for employer sharing
      const hasPermission = await this.privacyController.checkEmployerSharingPermissions(
        userId,
        employerId
      );
      
      if (!hasPermission) {
        throw new Error('Employer sharing not permitted by privacy settings');
      }

      // Get selected evidence
      const selectedEvidence = await this.evidenceManager.getSelectedEvidence(
        userId,
        applicationData.position
      );

      // Submit application through employer integration
      const application = await this.employerIntegration.submitApplication(
        userId,
        employerId,
        {
          position: {
            title: applicationData.position,
            department: '',
            level: 'mid',
            requirements: []
          },
          portfolio: portfolio.portfolio,
          coverLetter: applicationData.coverLetter,
          customMessage: applicationData.customMessage,
          selectedEvidence: selectedEvidence.map(e => e.id)
        }
      );

      // Update analytics
      await this.updateAnalytics(userId, 'employer_share');

      // Log sharing activity
      await this.privacyController.logDataAccess(userId, {
        action: 'share_employer',
        recipient: employerId,
        timestamp: new Date()
      });

      logger.info(`Portfolio shared successfully with employer for user ${userId}`);
      return application;
    } catch (error) {
      logger.error(`Failed to share portfolio with employer for user ${userId}:`, error);
      throw error;
    }
  }

  async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    try {
      logger.info(`Updating privacy settings for user ${userId}`);

      const updatedSettings = await this.privacyController.updatePrivacySettings(userId, settings);

      // Re-evaluate existing portfolio visibility
      await this.updatePortfolioVisibility(userId, updatedSettings);

      logger.info(`Privacy settings updated successfully for user ${userId}`);
      return updatedSettings;
    } catch (error) {
      logger.error(`Failed to update privacy settings for user ${userId}:`, error);
      throw error;
    }
  }

  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    try {
      const versions = this.portfolioVersions.get(userId) || [];
      const analytics = this.portfolioAnalytics.get(userId);
      const skillEvidence = await this.evidenceManager.getUserEvidence(userId);
      const history = await this.historyManager.getCompleteHistory(userId);

      const verificationStatus = {
        verified: skillEvidence.filter(e => e.verification.status === 'verified').length,
        pending: skillEvidence.filter(e => e.verification.status === 'submitted').length,
        total: skillEvidence.length
      };

      return {
        totalPortfolios: versions.length,
        activePortfolios: versions.filter(v => v.status === 'active').length,
        totalViews: analytics?.views || 0,
        totalDownloads: analytics?.downloads || 0,
        skillsDocumented: skillEvidence.length,
        achievementsEarned: history.summary?.keyAchievements.length || 0,
        verificationStatus,
        lastActivity: analytics?.lastUpdated || new Date()
      };
    } catch (error) {
      logger.error(`Failed to get portfolio summary for user ${userId}:`, error);
      throw error;
    }
  }

  async getPortfolioVersions(userId: string): Promise<PortfolioVersion[]> {
    return this.portfolioVersions.get(userId) || [];
  }

  async getPortfolioById(userId: string, portfolioId: string): Promise<PortfolioVersion | null> {
    const versions = this.portfolioVersions.get(userId) || [];
    return versions.find(v => v.id === portfolioId) || null;
  }

  async deletePortfolioVersion(userId: string, portfolioId: string): Promise<void> {
    try {
      const versions = this.portfolioVersions.get(userId) || [];
      const filteredVersions = versions.filter(v => v.id !== portfolioId);
      this.portfolioVersions.set(userId, filteredVersions);

      // Log deletion for privacy compliance
      await this.privacyController.logDataAccess(userId, {
        action: 'delete_portfolio',
        portfolioId,
        timestamp: new Date()
      });

      logger.info(`Portfolio version ${portfolioId} deleted for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to delete portfolio version for user ${userId}:`, error);
      throw error;
    }
  }

  async getPortfolioAnalytics(userId: string): Promise<PortfolioAnalytics | null> {
    return this.portfolioAnalytics.get(userId) || null;
  }

  async trackPortfolioView(userId: string, portfolioId: string, viewerType: 'user' | 'employer' | 'public'): Promise<void> {
    try {
      const analytics = this.portfolioAnalytics.get(userId);
      if (analytics) {
        analytics.views++;
        if (viewerType === 'employer') {
          analytics.employerInteractions++;
        }
        analytics.lastUpdated = new Date();
        this.portfolioAnalytics.set(userId, analytics);
      }

      logger.info(`Portfolio view tracked for user ${userId} by ${viewerType}`);
    } catch (error) {
      logger.error(`Failed to track portfolio view for user ${userId}:`, error);
    }
  }

  private async filterDataByPrivacy(
    history: PerformanceHistory,
    evidence: SkillEvidence[],
    privacySettings: PrivacySettings,
    options: PortfolioGenerationOptions
  ): Promise<{ history: PerformanceHistory; evidence: SkillEvidence[] }> {
    let filteredHistory = history;
    let filteredEvidence = evidence;

    // Filter based on privacy settings
    if (!privacySettings.performanceSharing.history) {
      filteredHistory = { ...history, scenarios: [] };
    }

    if (!privacySettings.performanceSharing.scores) {
      filteredHistory.summary = {
        ...filteredHistory.summary,
        keyAchievements: []
      };
    }

    // Filter evidence based on verification status if required
    if (!options.includePrivateData) {
      filteredEvidence = evidence.filter(e => e.verification.status === 'verified');
    }

    return { history: filteredHistory, evidence: filteredEvidence };
  }

  private async savePortfolioVersion(
    userId: string,
    portfolio: ProfessionalPortfolio,
    options: PortfolioGenerationOptions
  ): Promise<void> {
    const versions = this.portfolioVersions.get(userId) || [];
    
    const newVersion: PortfolioVersion = {
      id: this.generateId(),
      version: versions.length + 1,
      createdAt: new Date(),
      purpose: `${options.template} portfolio for ${options.targetAudience}`,
      configuration: options,
      portfolio,
      analytics: {
        views: 0,
        downloads: 0,
        shares: 0,
        employerInteractions: 0,
        topSkillsViewed: [],
        conversionRate: 0,
        lastUpdated: new Date(),
        performanceTrends: []
      },
      status: 'active'
    };

    // Mark previous versions as archived if needed
    versions.forEach(v => {
      if (v.status === 'active') {
        v.status = 'archived';
      }
    });

    versions.push(newVersion);
    this.portfolioVersions.set(userId, versions);
  }

  private async updateAnalytics(userId: string, action: 'generation' | 'export' | 'employer_share'): Promise<void> {
    const analytics = this.portfolioAnalytics.get(userId);
    if (analytics) {
      switch (action) {
        case 'export':
          analytics.downloads++;
          break;
        case 'employer_share':
          analytics.shares++;
          analytics.employerInteractions++;
          break;
      }
      analytics.lastUpdated = new Date();
      this.portfolioAnalytics.set(userId, analytics);
    }
  }

  private async updatePortfolioVisibility(userId: string, settings: PrivacySettings): Promise<void> {
    const versions = this.portfolioVersions.get(userId) || [];
    
    // Update visibility of all portfolio versions based on new privacy settings
    versions.forEach(version => {
      if (settings.profileVisibility === 'private') {
        version.status = 'archived';
      } else if (settings.profileVisibility === 'public' && version.status === 'archived') {
        version.status = 'active';
      }
    });

    this.portfolioVersions.set(userId, versions);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export {
  PortfolioService,
  PortfolioServiceConfiguration,
  PortfolioGenerationOptions,
  PortfolioAnalytics,
  PortfolioVersion,
  PortfolioSummary
};