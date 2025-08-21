import { PortfolioService, PortfolioServiceConfiguration, PortfolioGenerationOptions } from '../portfolioService';
import { PortfolioBuilder } from '../portfolioBuilder';
import { HistoryManager } from '../historyManager';
import { ExportEngine } from '../exportEngine';
import { PrivacyController } from '../privacyController';
import { EmployerIntegration } from '../employerIntegration';
import { EvidenceManager } from '../evidenceManager';

jest.mock('../portfolioBuilder');
jest.mock('../historyManager');
jest.mock('../exportEngine');
jest.mock('../privacyController');
jest.mock('../employerIntegration');
jest.mock('../evidenceManager');

describe('PortfolioService', () => {
  let portfolioService: PortfolioService;
  let mockPortfolioBuilder: jest.Mocked<PortfolioBuilder>;
  let mockHistoryManager: jest.Mocked<HistoryManager>;
  let mockExportEngine: jest.Mocked<ExportEngine>;
  let mockPrivacyController: jest.Mocked<PrivacyController>;
  let mockEmployerIntegration: jest.Mocked<EmployerIntegration>;
  let mockEvidenceManager: jest.Mocked<EvidenceManager>;

  const mockUserId = 'user123';
  const mockConfig: PortfolioServiceConfiguration = {
    userId: mockUserId,
    enableAnalytics: true,
    enableRealtimeUpdates: true,
    dataRetentionDays: 365,
    maxPortfolioVersions: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
    portfolioService = new PortfolioService();
    
    mockPortfolioBuilder = jest.mocked(PortfolioBuilder.prototype);
    mockHistoryManager = jest.mocked(HistoryManager.prototype);
    mockExportEngine = jest.mocked(ExportEngine.prototype);
    mockPrivacyController = jest.mocked(PrivacyController.prototype);
    mockEmployerIntegration = jest.mocked(EmployerIntegration.prototype);
    mockEvidenceManager = jest.mocked(EvidenceManager.prototype);
  });

  describe('initializeUserPortfolio', () => {
    it('should initialize user portfolio with default settings', async () => {
      mockPrivacyController.initializeUserPrivacy.mockResolvedValue(undefined);

      await portfolioService.initializeUserPortfolio(mockConfig);

      expect(mockPrivacyController.initializeUserPrivacy).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          profileVisibility: 'private',
          performanceSharing: expect.objectContaining({
            scores: false,
            rankings: false,
            comparisons: false,
            history: false
          })
        })
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockPrivacyController.initializeUserPrivacy.mockRejectedValue(new Error('Database error'));

      await expect(portfolioService.initializeUserPortfolio(mockConfig)).rejects.toThrow('Database error');
    });
  });

  describe('generatePortfolio', () => {
    const mockOptions: PortfolioGenerationOptions = {
      template: 'professional',
      targetAudience: 'employer',
      includePrivateData: false,
      customSections: ['achievements', 'skills']
    };

    const mockPortfolio = {
      header: {
        name: 'John Doe',
        title: 'Software Developer',
        summary: 'Experienced developer',
        contact: { email: 'john@example.com' },
        generatedDate: new Date(),
        portfolioId: 'portfolio123'
      },
      executiveSummary: {
        overview: 'Professional overview',
        keyStrengths: ['Problem solving', 'Communication'],
        achievements: ['Completed 50+ scenarios'],
        careerGoals: ['Senior developer'],
        experienceHighlights: ['Led team projects']
      },
      competencies: {
        technical: [],
        communication: [],
        customerService: [],
        professional: []
      },
      achievements: [],
      performanceMetrics: {},
      skillProgression: [],
      testimonials: [],
      certifications: [],
      projectHighlights: [],
      professionalEvidence: []
    };

    const mockHistory = {
      user: { userId: mockUserId, name: 'John Doe' },
      summary: {
        totalScenarios: 10,
        totalHours: 20,
        skillProgression: [],
        keyAchievements: [],
        competencyEvidence: []
      },
      scenarios: [],
      timeline: [],
      progression: {},
      certifications: []
    };

    const mockEvidence = [
      {
        id: 'evidence1',
        userId: mockUserId,
        competency: 'Problem Solving',
        skillLevel: 'advanced' as const,
        evidence: {
          scenario: 'Test scenario',
          description: 'Solved complex problem',
          actions: ['Analyzed issue', 'Implemented solution'],
          outcome: 'Issue resolved',
          metrics: {},
          artifacts: [],
          validation: {}
        },
        documentation: {
          title: 'Problem Solving Evidence',
          summary: 'Demonstrated problem solving',
          learningObjectives: [],
          competenciesDemonstrated: [],
          reflectiveAnalysis: ''
        },
        verification: {
          status: 'verified' as const,
          verifiedBy: 'supervisor',
          verifiedAt: new Date(),
          verifierComments: 'Excellent work',
          verificationMethod: 'supervisor' as const
        },
        timestamps: {
          createdAt: new Date(),
          updatedAt: new Date(),
          submittedAt: new Date(),
          verifiedAt: new Date()
        },
        metadata: {
          tags: ['problem-solving'],
          category: 'technical',
          difficulty: 'advanced' as const,
          industryStandards: [],
          certificationRelevance: []
        }
      }
    ];

    const mockPrivacySettings = {
      profileVisibility: 'private' as const,
      performanceSharing: {
        scores: true,
        rankings: true,
        comparisons: true,
        history: true
      },
      contactInformation: {
        email: true,
        phone: false,
        address: false
      },
      employerAccess: {
        fullProfile: false,
        performanceData: true,
        skillEvidence: true,
        recommendations: false
      },
      dataRetention: {
        automaticDeletion: false,
        retentionPeriod: 365,
        archiveAfter: 365
      },
      consentManagement: {
        explicitConsent: true,
        granularConsent: true,
        consentHistory: []
      }
    };

    beforeEach(async () => {
      await portfolioService.initializeUserPortfolio(mockConfig);
      
      mockHistoryManager.getCompleteHistory.mockResolvedValue(mockHistory);
      mockEvidenceManager.getUserEvidence.mockResolvedValue(mockEvidence);
      mockPrivacyController.getUserPrivacySettings.mockResolvedValue(mockPrivacySettings);
      mockPortfolioBuilder.generatePortfolio.mockResolvedValue(mockPortfolio);
    });

    it('should generate portfolio successfully', async () => {
      const result = await portfolioService.generatePortfolio(mockUserId, mockOptions);

      expect(mockHistoryManager.getCompleteHistory).toHaveBeenCalledWith(mockUserId);
      expect(mockEvidenceManager.getUserEvidence).toHaveBeenCalledWith(mockUserId);
      expect(mockPrivacyController.getUserPrivacySettings).toHaveBeenCalledWith(mockUserId);
      expect(mockPortfolioBuilder.generatePortfolio).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ user: expect.objectContaining({ userId: mockUserId }) }),
        expect.arrayContaining([expect.objectContaining({ id: 'evidence1' })]),
        mockOptions
      );
      expect(result).toEqual(mockPortfolio);
    });

    it('should filter data based on privacy settings', async () => {
      const restrictivePrivacySettings = {
        ...mockPrivacySettings,
        performanceSharing: {
          scores: false,
          rankings: false,
          comparisons: false,
          history: false
        }
      };
      mockPrivacyController.getUserPrivacySettings.mockResolvedValue(restrictivePrivacySettings);

      await portfolioService.generatePortfolio(mockUserId, mockOptions);

      expect(mockPortfolioBuilder.generatePortfolio).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          scenarios: []
        }),
        expect.any(Array),
        mockOptions
      );
    });

    it('should filter evidence when includePrivateData is false', async () => {
      const unverifiedEvidence = [
        {
          ...mockEvidence[0],
          id: 'evidence2',
          verification: {
            ...mockEvidence[0].verification,
            status: 'pending' as const
          }
        }
      ];
      mockEvidenceManager.getUserEvidence.mockResolvedValue([...mockEvidence, ...unverifiedEvidence]);

      await portfolioService.generatePortfolio(mockUserId, mockOptions);

      expect(mockPortfolioBuilder.generatePortfolio).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Object),
        expect.arrayContaining([expect.objectContaining({ id: 'evidence1' })]),
        mockOptions
      );
    });

    it('should handle generation errors', async () => {
      mockHistoryManager.getCompleteHistory.mockRejectedValue(new Error('History service error'));

      await expect(portfolioService.generatePortfolio(mockUserId, mockOptions)).rejects.toThrow('History service error');
    });
  });

  describe('exportPortfolio', () => {
    const mockExportConfig = {
      format: 'pdf' as const,
      template: 'professional',
      content: {
        summary: true,
        competencies: true,
        achievements: true,
        performance: true,
        history: false
      },
      customization: {
        branding: {
          logo: '',
          colors: { primary: '#000', secondary: '#fff', accent: '#ccc' },
          fonts: { header: 'Arial', body: 'Arial' },
          personalBranding: {}
        },
        layout: {
          pageSize: 'A4' as const,
          orientation: 'portrait' as const,
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          sections: { header: true, footer: true }
        },
        privacy: {}
      },
      recipient: 'employer' as const
    };

    const mockPortfolioId = 'portfolio123';
    const mockExportedData = Buffer.from('exported portfolio data');

    beforeEach(async () => {
      await portfolioService.initializeUserPortfolio(mockConfig);
      
      // Create a mock portfolio version
      await portfolioService.generatePortfolio(mockUserId, {
        template: 'professional',
        targetAudience: 'employer',
        includePrivateData: false
      });

      mockPrivacyController.checkExportPermissions.mockResolvedValue(true);
      mockExportEngine.exportPortfolio.mockResolvedValue(mockExportedData);
      mockPrivacyController.logDataAccess.mockResolvedValue(undefined);
    });

    it('should export portfolio successfully', async () => {
      const versions = await portfolioService.getPortfolioVersions(mockUserId);
      const portfolioId = versions[0].id;

      const result = await portfolioService.exportPortfolio(mockUserId, portfolioId, mockExportConfig);

      expect(mockPrivacyController.checkExportPermissions).toHaveBeenCalledWith(mockUserId, 'employer');
      expect(mockExportEngine.exportPortfolio).toHaveBeenCalled();
      expect(mockPrivacyController.logDataAccess).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          action: 'export',
          format: 'pdf',
          recipient: 'employer'
        })
      );
      expect(result).toEqual(mockExportedData);
    });

    it('should reject export when permissions are denied', async () => {
      mockPrivacyController.checkExportPermissions.mockResolvedValue(false);

      const versions = await portfolioService.getPortfolioVersions(mockUserId);
      const portfolioId = versions[0].id;

      await expect(portfolioService.exportPortfolio(mockUserId, portfolioId, mockExportConfig))
        .rejects.toThrow('Export not permitted by privacy settings');
    });

    it('should handle non-existent portfolio', async () => {
      await expect(portfolioService.exportPortfolio(mockUserId, 'nonexistent', mockExportConfig))
        .rejects.toThrow('Portfolio not found');
    });
  });

  describe('sharePortfolioWithEmployer', () => {
    const mockEmployerId = 'employer123';
    const mockApplicationData = {
      position: 'Software Developer',
      coverLetter: 'I am interested in this position',
      customMessage: 'Thank you for your consideration'
    };

    const mockApplication = {
      id: 'application123',
      candidateId: mockUserId,
      employerId: mockEmployerId,
      position: {
        title: 'Software Developer',
        department: 'Engineering',
        level: 'mid' as const,
        requirements: []
      },
      submission: {
        portfolio: {},
        coverLetter: mockApplicationData.coverLetter,
        customMessage: mockApplicationData.customMessage,
        selectedEvidence: [],
        consentGiven: true
      },
      status: 'submitted' as const,
      timeline: [],
      verification: {},
      communication: [],
      metadata: {
        submittedAt: new Date(),
        lastUpdated: new Date(),
        viewCount: 0
      }
    };

    beforeEach(async () => {
      await portfolioService.initializeUserPortfolio(mockConfig);
      
      // Generate a portfolio first
      await portfolioService.generatePortfolio(mockUserId, {
        template: 'professional',
        targetAudience: 'employer',
        includePrivateData: false
      });

      mockPrivacyController.checkEmployerSharingPermissions.mockResolvedValue(true);
      mockEvidenceManager.getSelectedEvidence.mockResolvedValue([]);
      mockEmployerIntegration.submitApplication.mockResolvedValue(mockApplication);
      mockPrivacyController.logDataAccess.mockResolvedValue(undefined);
    });

    it('should share portfolio with employer successfully', async () => {
      const versions = await portfolioService.getPortfolioVersions(mockUserId);
      const portfolioId = versions[0].id;

      const result = await portfolioService.sharePortfolioWithEmployer(
        mockUserId,
        portfolioId,
        mockEmployerId,
        mockApplicationData
      );

      expect(mockPrivacyController.checkEmployerSharingPermissions).toHaveBeenCalledWith(mockUserId, mockEmployerId);
      expect(mockEvidenceManager.getSelectedEvidence).toHaveBeenCalledWith(mockUserId, 'Software Developer');
      expect(mockEmployerIntegration.submitApplication).toHaveBeenCalled();
      expect(mockPrivacyController.logDataAccess).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          action: 'share_employer',
          recipient: mockEmployerId
        })
      );
      expect(result).toEqual(mockApplication);
    });

    it('should reject sharing when permissions are denied', async () => {
      mockPrivacyController.checkEmployerSharingPermissions.mockResolvedValue(false);

      const versions = await portfolioService.getPortfolioVersions(mockUserId);
      const portfolioId = versions[0].id;

      await expect(portfolioService.sharePortfolioWithEmployer(
        mockUserId,
        portfolioId,
        mockEmployerId,
        mockApplicationData
      )).rejects.toThrow('Employer sharing not permitted by privacy settings');
    });
  });

  describe('updatePrivacySettings', () => {
    const mockNewSettings = {
      profileVisibility: 'public' as const,
      performanceSharing: {
        scores: true,
        rankings: true,
        comparisons: false,
        history: true
      }
    };

    const mockUpdatedSettings = {
      ...mockNewSettings,
      contactInformation: {
        email: true,
        phone: false,
        address: false
      },
      employerAccess: {
        fullProfile: true,
        performanceData: true,
        skillEvidence: true,
        recommendations: true
      },
      dataRetention: {
        automaticDeletion: false,
        retentionPeriod: 365,
        archiveAfter: 365
      },
      consentManagement: {
        explicitConsent: true,
        granularConsent: true,
        consentHistory: []
      }
    };

    beforeEach(async () => {
      await portfolioService.initializeUserPortfolio(mockConfig);
      mockPrivacyController.updatePrivacySettings.mockResolvedValue(mockUpdatedSettings);
    });

    it('should update privacy settings successfully', async () => {
      const result = await portfolioService.updatePrivacySettings(mockUserId, mockNewSettings);

      expect(mockPrivacyController.updatePrivacySettings).toHaveBeenCalledWith(mockUserId, mockNewSettings);
      expect(result).toEqual(mockUpdatedSettings);
    });

    it('should handle privacy update errors', async () => {
      mockPrivacyController.updatePrivacySettings.mockRejectedValue(new Error('Privacy service error'));

      await expect(portfolioService.updatePrivacySettings(mockUserId, mockNewSettings))
        .rejects.toThrow('Privacy service error');
    });
  });

  describe('getPortfolioSummary', () => {
    beforeEach(async () => {
      await portfolioService.initializeUserPortfolio(mockConfig);
      
      const mockEvidence = [
        {
          id: 'evidence1',
          verification: { status: 'verified' as const }
        },
        {
          id: 'evidence2',
          verification: { status: 'submitted' as const }
        }
      ];

      const mockHistory = {
        summary: {
          keyAchievements: ['Achievement 1', 'Achievement 2']
        }
      };

      mockEvidenceManager.getUserEvidence.mockResolvedValue(mockEvidence as any);
      mockHistoryManager.getCompleteHistory.mockResolvedValue(mockHistory as any);
    });

    it('should return portfolio summary', async () => {
      const summary = await portfolioService.getPortfolioSummary(mockUserId);

      expect(summary).toEqual(expect.objectContaining({
        totalPortfolios: expect.any(Number),
        activePortfolios: expect.any(Number),
        totalViews: expect.any(Number),
        totalDownloads: expect.any(Number),
        skillsDocumented: 2,
        achievementsEarned: 2,
        verificationStatus: {
          verified: 1,
          pending: 1,
          total: 2
        },
        lastActivity: expect.any(Date)
      }));
    });
  });

  describe('trackPortfolioView', () => {
    beforeEach(async () => {
      await portfolioService.initializeUserPortfolio(mockConfig);
    });

    it('should track portfolio views', async () => {
      const initialAnalytics = await portfolioService.getPortfolioAnalytics(mockUserId);
      const initialViews = initialAnalytics?.views || 0;

      await portfolioService.trackPortfolioView(mockUserId, 'portfolio123', 'employer');

      const updatedAnalytics = await portfolioService.getPortfolioAnalytics(mockUserId);
      expect(updatedAnalytics?.views).toBe(initialViews + 1);
      expect(updatedAnalytics?.employerInteractions).toBe(1);
    });

    it('should handle different viewer types', async () => {
      await portfolioService.trackPortfolioView(mockUserId, 'portfolio123', 'user');
      await portfolioService.trackPortfolioView(mockUserId, 'portfolio123', 'public');

      const analytics = await portfolioService.getPortfolioAnalytics(mockUserId);
      expect(analytics?.views).toBe(2);
      expect(analytics?.employerInteractions).toBe(0);
    });
  });

  describe('portfolio version management', () => {
    beforeEach(async () => {
      await portfolioService.initializeUserPortfolio(mockConfig);
    });

    it('should manage portfolio versions correctly', async () => {
      // Generate first portfolio
      await portfolioService.generatePortfolio(mockUserId, {
        template: 'professional',
        targetAudience: 'employer',
        includePrivateData: false
      });

      // Generate second portfolio
      await portfolioService.generatePortfolio(mockUserId, {
        template: 'technical',
        targetAudience: 'certification',
        includePrivateData: true
      });

      const versions = await portfolioService.getPortfolioVersions(mockUserId);
      expect(versions).toHaveLength(2);
      expect(versions[0].status).toBe('archived');
      expect(versions[1].status).toBe('active');
    });

    it('should delete portfolio versions', async () => {
      await portfolioService.generatePortfolio(mockUserId, {
        template: 'professional',
        targetAudience: 'employer',
        includePrivateData: false
      });

      const versions = await portfolioService.getPortfolioVersions(mockUserId);
      const portfolioId = versions[0].id;

      await portfolioService.deletePortfolioVersion(mockUserId, portfolioId);

      const updatedVersions = await portfolioService.getPortfolioVersions(mockUserId);
      expect(updatedVersions).toHaveLength(0);
    });
  });
});