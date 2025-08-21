import { PortfolioService } from '../portfolioService';
import { PortfolioBuilder } from '../portfolioBuilder';
import { HistoryManager } from '../historyManager';
import { ExportEngine } from '../exportEngine';
import { PrivacyController } from '../privacyController';
import { EmployerIntegration } from '../employerIntegration';
import { EvidenceManager } from '../evidenceManager';

describe('Portfolio System Integration', () => {
  let portfolioService: PortfolioService;
  let portfolioBuilder: PortfolioBuilder;
  let historyManager: HistoryManager;
  let exportEngine: ExportEngine;
  let privacyController: PrivacyController;
  let employerIntegration: EmployerIntegration;
  let evidenceManager: EvidenceManager;

  const mockUserId = 'integration_test_user';
  const mockEmployerId = 'integration_test_employer';

  beforeEach(async () => {
    // Initialize all services
    portfolioService = new PortfolioService();
    portfolioBuilder = new PortfolioBuilder();
    historyManager = new HistoryManager();
    exportEngine = new ExportEngine();
    privacyController = new PrivacyController();
    employerIntegration = new EmployerIntegration();
    evidenceManager = new EvidenceManager();

    // Initialize portfolio for test user
    await portfolioService.initializeUserPortfolio({
      userId: mockUserId,
      enableAnalytics: true,
      enableRealtimeUpdates: true,
      dataRetentionDays: 365,
      maxPortfolioVersions: 10
    });
  });

  describe('End-to-End Portfolio Creation and Export', () => {
    it('should create complete portfolio workflow from evidence to export', async () => {
      // Step 1: Create skill evidence
      const evidence1 = await evidenceManager.createEvidence(mockUserId, {
        competency: 'Problem Solving',
        skillLevel: 'advanced',
        evidence: {
          scenario: 'Complex customer billing issue resolution',
          description: 'Successfully resolved multi-layered billing dispute involving system integration issues',
          actions: [
            'Analyzed customer account history across multiple systems',
            'Identified data synchronization issues between billing and CRM',
            'Coordinated with technical team to implement fix',
            'Provided detailed explanation to customer',
            'Created documentation to prevent future occurrences'
          ],
          outcome: 'Customer issue resolved, system process improved, customer satisfaction score: 9.8/10',
          metrics: {
            overall: 94,
            dimensions: {
              technicalCompetency: 92,
              customerService: 96,
              communicationSkills: 95,
              problemSolving: 94,
              processCompliance: 93
            }
          },
          artifacts: [],
          validation: {
            verifiedBy: 'supervisor123',
            verifiedAt: new Date(),
            verificationMethod: 'supervisor',
            confidence: 0.95,
            evidence: ['Customer feedback', 'System logs', 'Process documentation'],
            dataQuality: 'high'
          }
        },
        documentation: {
          title: 'Advanced Problem Solving in Complex Billing Scenario',
          summary: 'Demonstrated systematic approach to complex technical problem resolution',
          learningObjectives: [
            'Apply root cause analysis techniques',
            'Demonstrate cross-functional coordination',
            'Show customer-centric problem solving'
          ],
          competenciesDemonstrated: ['Problem Solving', 'Technical Analysis', 'Customer Service'],
          reflectiveAnalysis: 'This scenario highlighted the importance of systematic analysis and clear communication in complex technical problem resolution.'
        },
        metadata: {
          tags: ['problem-solving', 'billing', 'customer-service', 'technical'],
          category: 'technical',
          difficulty: 'advanced',
          industryStandards: ['ITIL Service Management', 'Customer Service Excellence'],
          certificationRelevance: ['Problem Solving Certification', 'Customer Service Excellence']
        }
      });

      const evidence2 = await evidenceManager.createEvidence(mockUserId, {
        competency: 'Communication',
        skillLevel: 'expert',
        evidence: {
          scenario: 'Technical presentation to stakeholders',
          description: 'Delivered comprehensive technical presentation on system architecture to mixed technical and business audience',
          actions: [
            'Prepared presentation materials tailored to audience',
            'Used visual aids and analogies for complex concepts',
            'Facilitated Q&A session with detailed responses',
            'Provided follow-up documentation'
          ],
          outcome: 'Stakeholder approval for architecture proposal, positive feedback on clarity and thoroughness',
          metrics: {
            overall: 96,
            dimensions: {
              technicalCompetency: 94,
              customerService: 85,
              communicationSkills: 98,
              problemSolving: 90,
              processCompliance: 95
            }
          },
          artifacts: [],
          validation: {
            verifiedBy: 'manager456',
            verifiedAt: new Date(),
            verificationMethod: 'supervisor',
            confidence: 0.98,
            evidence: ['Presentation recording', 'Stakeholder feedback', 'Meeting minutes'],
            dataQuality: 'high'
          }
        },
        documentation: {
          title: 'Expert Technical Communication to Stakeholders',
          summary: 'Demonstrated ability to communicate complex technical concepts effectively to diverse audiences',
          learningObjectives: [
            'Adapt communication style to audience',
            'Present complex information clearly',
            'Facilitate productive technical discussions'
          ],
          competenciesDemonstrated: ['Communication', 'Technical Presentation', 'Stakeholder Management'],
          reflectiveAnalysis: 'The success of this presentation reinforced the importance of audience analysis and clear visual communication in technical settings.'
        },
        metadata: {
          tags: ['communication', 'presentation', 'stakeholder-management'],
          category: 'soft-skills',
          difficulty: 'expert',
          industryStandards: ['Professional Communication Standards'],
          certificationRelevance: ['Communication Excellence Certification']
        }
      });

      // Step 2: Submit evidence for verification
      await evidenceManager.submitForVerification(evidence1.id);
      await evidenceManager.submitForVerification(evidence2.id);

      // Step 3: Verify evidence
      await evidenceManager.verifyEvidence(evidence1.id, 'verifier123', {
        status: 'verified',
        comments: 'Excellent demonstration of systematic problem-solving approach with clear customer focus',
        competencyLevels: { 'Problem Solving': 'advanced' }
      });

      await evidenceManager.verifyEvidence(evidence2.id, 'verifier456', {
        status: 'verified',
        comments: 'Outstanding communication skills demonstrated with clear adaptation to audience needs',
        competencyLevels: { 'Communication': 'expert' }
      });

      // Step 4: Generate portfolio
      const portfolio = await portfolioService.generatePortfolio(mockUserId, {
        template: 'professional',
        targetAudience: 'employer',
        includePrivateData: false,
        customSections: ['achievements', 'competencies', 'evidence'],
        branding: {
          usePersonalBranding: true,
          colors: {
            primary: '#2563eb',
            secondary: '#64748b',
            accent: '#f59e0b'
          }
        }
      });

      // Verify portfolio contains evidence
      expect(portfolio.header.name).toBeDefined();
      expect(portfolio.competencies.technical.length + portfolio.competencies.communication.length).toBeGreaterThan(0);
      expect(portfolio.professionalEvidence.length).toBe(2);

      // Step 5: Export portfolio in multiple formats
      const portfolioVersions = await portfolioService.getPortfolioVersions(mockUserId);
      const portfolioId = portfolioVersions[0].id;

      // Export as PDF
      const pdfExport = await portfolioService.exportPortfolio(mockUserId, portfolioId, {
        format: 'pdf',
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
            colors: { primary: '#2563eb', secondary: '#64748b', accent: '#f59e0b' },
            fonts: { header: 'Inter', body: 'Inter' },
            personalBranding: {
              tagline: 'Professional Excellence in Action'
            }
          },
          layout: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 20, bottom: 20, left: 20, right: 20 },
            sections: { header: true, footer: true }
          },
          privacy: {}
        },
        recipient: 'employer'
      });

      // Export as JSON
      const jsonExport = await portfolioService.exportPortfolio(mockUserId, portfolioId, {
        format: 'json',
        template: 'structured',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: {
            colors: { primary: '#2563eb', secondary: '#64748b', accent: '#f59e0b' },
            fonts: { header: 'Inter', body: 'Inter' },
            personalBranding: {}
          },
          layout: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 20, bottom: 20, left: 20, right: 20 },
            sections: { header: true, footer: true }
          },
          privacy: {}
        },
        recipient: 'personal'
      });

      // Verify exports
      expect(pdfExport).toBeInstanceOf(Buffer);
      expect(pdfExport.length).toBeGreaterThan(0);
      expect(jsonExport).toBeInstanceOf(Buffer);
      
      const jsonData = JSON.parse(jsonExport.toString('utf-8'));
      expect(jsonData).toHaveProperty('header');
      expect(jsonData).toHaveProperty('competencies');
      expect(jsonData.professionalEvidence).toHaveLength(2);

      // Step 6: Verify analytics tracking
      const analytics = await portfolioService.getPortfolioAnalytics(mockUserId);
      expect(analytics?.downloads).toBe(2); // PDF and JSON exports
    });
  });

  describe('Employer Integration Workflow', () => {
    it('should handle complete employer application workflow', async () => {
      // Step 1: Register employer
      const employer = await employerIntegration.registerEmployer({
        companyName: 'Tech Innovations Inc',
        companySize: 'large',
        industry: 'Technology',
        contactPerson: {
          name: 'Sarah Johnson',
          title: 'Senior Technical Recruiter',
          email: 'sarah.johnson@techinnovations.com',
          phone: '+1-555-0199'
        },
        preferences: {
          skillCategories: ['Technical', 'Communication', 'Problem Solving'],
          experienceLevels: ['intermediate', 'advanced', 'expert'],
          certificationRequirements: ['AWS', 'Azure', 'Professional Certifications'],
          communicationPreferences: ['email', 'video_call']
        },
        metadata: {
          website: 'https://techinnovations.com',
          companyLogo: 'https://techinnovations.com/logo.png'
        }
      });

      // Step 2: Create evidence and portfolio for candidate
      const evidence = await evidenceManager.createEvidence(mockUserId, {
        competency: 'Full Stack Development',
        skillLevel: 'expert',
        evidence: {
          scenario: 'Enterprise application development',
          description: 'Led development of enterprise-scale web application with microservices architecture',
          actions: [
            'Designed scalable microservices architecture',
            'Implemented React frontend with TypeScript',
            'Developed Node.js backend services',
            'Set up CI/CD pipeline with automated testing',
            'Coordinated with DevOps team for deployment'
          ],
          outcome: 'Successful deployment serving 100,000+ users with 99.9% uptime',
          metrics: {
            overall: 97,
            dimensions: {
              technicalCompetency: 98,
              customerService: 85,
              communicationSkills: 95,
              problemSolving: 96,
              processCompliance: 97
            }
          },
          artifacts: [],
          validation: {
            verifiedBy: 'tech_lead_789',
            verifiedAt: new Date(),
            verificationMethod: 'supervisor',
            confidence: 0.97,
            evidence: ['Code reviews', 'Performance metrics', 'User feedback'],
            dataQuality: 'high'
          }
        },
        documentation: {
          title: 'Expert Full Stack Development Leadership',
          summary: 'Demonstrated expert-level full stack development skills with architectural leadership',
          learningObjectives: [
            'Design scalable system architecture',
            'Lead technical implementation',
            'Coordinate cross-functional teams'
          ],
          competenciesDemonstrated: ['Full Stack Development', 'Technical Leadership', 'System Architecture'],
          reflectiveAnalysis: 'This project showcased my ability to lead complex technical projects from conception to deployment.'
        },
        metadata: {
          tags: ['full-stack', 'leadership', 'architecture', 'react', 'nodejs'],
          category: 'technical',
          difficulty: 'expert',
          industryStandards: ['Software Engineering Best Practices', 'Agile Development'],
          certificationRelevance: ['AWS Solutions Architect', 'React Developer Certification']
        }
      });

      await evidenceManager.submitForVerification(evidence.id);
      await evidenceManager.verifyEvidence(evidence.id, 'senior_architect_999', {
        status: 'verified',
        comments: 'Exceptional technical leadership and full stack development capabilities demonstrated',
        competencyLevels: { 'Full Stack Development': 'expert' }
      });

      // Step 3: Update privacy settings to allow employer sharing
      await portfolioService.updatePrivacySettings(mockUserId, {
        employerAccess: {
          fullProfile: true,
          performanceData: true,
          skillEvidence: true,
          recommendations: true
        },
        profileVisibility: 'limited'
      });

      // Step 4: Generate and share portfolio with employer
      const portfolio = await portfolioService.generatePortfolio(mockUserId, {
        template: 'professional',
        targetAudience: 'employer',
        includePrivateData: false
      });

      const portfolioVersions = await portfolioService.getPortfolioVersions(mockUserId);
      const portfolioId = portfolioVersions[0].id;

      const application = await portfolioService.sharePortfolioWithEmployer(
        mockUserId,
        portfolioId,
        employer.id,
        {
          position: 'Senior Full Stack Developer',
          coverLetter: 'I am excited to contribute my full stack development expertise to your innovative team.',
          customMessage: 'I am particularly interested in your work on scalable enterprise applications.'
        }
      );

      // Step 5: Employer reviews application
      await employerIntegration.reviewApplication(application.id, 'reviewer_sarah');

      // Step 6: Perform verification
      const verification = await employerIntegration.performVerification(
        application.verification.id,
        'tech_verifier_001',
        {
          competencyResults: [{
            competency: 'Full Stack Development',
            claimedLevel: 'expert',
            verifiedLevel: 'expert',
            evidence: [],
            verificationMethod: 'document_review',
            score: 95,
            feedback: 'Exceptional full stack development skills with strong architectural understanding',
            verified: true
          }, {
            competency: 'Technical Leadership',
            claimedLevel: 'advanced',
            verifiedLevel: 'advanced',
            evidence: [],
            verificationMethod: 'reference_check',
            score: 92,
            feedback: 'Strong leadership capabilities demonstrated through project management',
            verified: true
          }],
          overallAssessment: 'excellent',
          recommendation: 'strongly_recommend',
          comments: 'Outstanding candidate with proven expertise in full stack development and technical leadership. Highly recommended for senior-level positions.'
        }
      );

      // Step 7: Schedule interview
      await employerIntegration.scheduleInterview(application.id, 'scheduler_sarah', {
        type: 'video',
        datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        duration: 90,
        location: 'https://techinnovations.zoom.us/meeting/123',
        interviewers: ['sarah.johnson@techinnovations.com', 'tech.lead@techinnovations.com'],
        agenda: [
          'Technical deep dive on recent projects',
          'System design discussion',
          'Team fit and culture assessment',
          'Career goals and company vision alignment'
        ]
      });

      // Step 8: Get employer dashboard
      const dashboard = await employerIntegration.getEmployerDashboard(employer.id);

      // Verify complete workflow
      expect(application.candidateId).toBe(mockUserId);
      expect(application.employerId).toBe(employer.id);
      expect(application.status).toBe('under_review');
      expect(verification.status).toBe('completed');
      expect(verification.overallScore).toBe(93.5); // Average of 95 and 92
      expect(verification.verificationReport.hiringRecommendation).toBe('strongly_recommend');
      expect(dashboard.applications.total).toBe(1);
      expect(dashboard.applications.underReview).toBe(1);
      expect(dashboard.candidates.topCandidates.length).toBe(1);
      expect(dashboard.candidates.topCandidates[0].overallScore).toBe(93.5);
    });
  });

  describe('Privacy and Consent Workflow', () => {
    it('should handle privacy controls throughout portfolio lifecycle', async () => {
      // Step 1: Create evidence with privacy considerations
      const sensitiveEvidence = await evidenceManager.createEvidence(mockUserId, {
        competency: 'Data Security',
        skillLevel: 'advanced',
        evidence: {
          scenario: 'Security incident response',
          description: 'Led response to security incident involving customer data',
          actions: [
            'Immediately isolated affected systems',
            'Coordinated with security team',
            'Implemented containment measures',
            'Conducted forensic analysis',
            'Prepared incident report'
          ],
          outcome: 'Incident contained with minimal impact, security processes improved',
          metrics: {
            overall: 88,
            dimensions: {
              technicalCompetency: 90,
              customerService: 80,
              communicationSkills: 85,
              problemSolving: 95,
              processCompliance: 95
            }
          },
          artifacts: [],
          validation: {
            verifiedBy: 'security_manager_555',
            verifiedAt: new Date(),
            verificationMethod: 'supervisor',
            confidence: 0.92,
            evidence: ['Incident reports', 'Security logs', 'Process documentation'],
            dataQuality: 'high'
          }
        },
        metadata: {
          tags: ['security', 'incident-response', 'data-protection'],
          category: 'security',
          difficulty: 'advanced',
          industryStandards: ['ISO 27001', 'NIST Cybersecurity Framework'],
          certificationRelevance: ['CISSP', 'Security+ Certification']
        }
      });

      // Step 2: Set restrictive privacy settings initially
      await portfolioService.updatePrivacySettings(mockUserId, {
        profileVisibility: 'private',
        performanceSharing: {
          scores: false,
          rankings: false,
          comparisons: false,
          history: false
        },
        employerAccess: {
          fullProfile: false,
          performanceData: false,
          skillEvidence: false,
          recommendations: false
        }
      });

      // Step 3: Attempt to export (should be restricted)
      const portfolio = await portfolioService.generatePortfolio(mockUserId, {
        template: 'professional',
        targetAudience: 'employer',
        includePrivateData: false
      });

      const portfolioVersions = await portfolioService.getPortfolioVersions(mockUserId);
      const portfolioId = portfolioVersions[0].id;

      // This should work for personal export
      await expect(portfolioService.exportPortfolio(mockUserId, portfolioId, {
        format: 'json',
        template: 'complete',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: {
            colors: { primary: '#000000', secondary: '#666666', accent: '#cccccc' },
            fonts: { header: 'Arial', body: 'Arial' },
            personalBranding: {}
          },
          layout: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 20, bottom: 20, left: 20, right: 20 },
            sections: { header: true, footer: true }
          },
          privacy: {}
        },
        recipient: 'personal'
      })).resolves.toBeInstanceOf(Buffer);

      // This should fail for employer export
      await expect(portfolioService.exportPortfolio(mockUserId, portfolioId, {
        format: 'pdf',
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
            colors: { primary: '#000000', secondary: '#666666', accent: '#cccccc' },
            fonts: { header: 'Arial', body: 'Arial' },
            personalBranding: {}
          },
          layout: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 20, bottom: 20, left: 20, right: 20 },
            sections: { header: true, footer: true }
          },
          privacy: {}
        },
        recipient: 'employer'
      })).rejects.toThrow('Export not permitted by privacy settings');

      // Step 4: Grant specific employer access
      const employer = await employerIntegration.registerEmployer({
        companyName: 'Trusted Security Corp',
        companySize: 'medium',
        industry: 'Cybersecurity',
        contactPerson: {
          name: 'Alex Chen',
          title: 'CISO',
          email: 'alex.chen@trustedsecurity.com'
        }
      });

      await privacyController.grantEmployerAccess(mockUserId, employer.id, {
        fullProfile: false,
        performanceData: true,
        skillEvidence: true,
        recommendations: false
      });

      // Step 5: Now sharing with this specific employer should work
      await expect(portfolioService.sharePortfolioWithEmployer(
        mockUserId,
        portfolioId,
        employer.id,
        {
          position: 'Security Engineer',
          coverLetter: 'I am interested in contributing to your cybersecurity initiatives.'
        }
      )).resolves.toEqual(expect.objectContaining({
        candidateId: mockUserId,
        employerId: employer.id
      }));

      // Step 6: Verify privacy audit trail
      const privacySettings = await privacyController.getUserPrivacySettings(mockUserId);
      const consentHistory = privacySettings.consentManagement.consentHistory;
      
      expect(consentHistory.length).toBeGreaterThan(1);
      expect(consentHistory.some(record => 
        record.type === 'employer_access' && 
        record.recipient === employer.id && 
        record.granted === true
      )).toBe(true);

      const dataAccessLog = await privacyController.getDataAccessLog(mockUserId);
      expect(dataAccessLog.length).toBeGreaterThan(0);
      expect(dataAccessLog.some(entry => 
        entry.action === 'share_employer' && 
        entry.recipient === employer.id
      )).toBe(true);
    });
  });

  describe('Performance Analytics and Insights', () => {
    it('should provide comprehensive analytics across the portfolio system', async () => {
      // Step 1: Create multiple evidence entries over time
      const evidenceEntries = [];
      const competencies = ['JavaScript', 'React', 'Node.js', 'Problem Solving', 'Communication'];
      
      for (let i = 0; i < competencies.length; i++) {
        const evidence = await evidenceManager.createEvidence(mockUserId, {
          competency: competencies[i],
          skillLevel: i < 2 ? 'intermediate' : 'advanced',
          evidence: {
            scenario: `Scenario for ${competencies[i]}`,
            description: `Demonstrated ${competencies[i]} skills`,
            actions: [`Applied ${competencies[i]} knowledge`, 'Achieved positive outcomes'],
            outcome: 'Successful completion with high performance',
            metrics: {
              overall: 85 + i * 2,
              dimensions: {
                technicalCompetency: 80 + i * 3,
                customerService: 85 + i,
                communicationSkills: 85 + i * 2,
                problemSolving: 90 + i,
                processCompliance: 85 + i
              }
            },
            artifacts: [],
            validation: {
              verifiedBy: `verifier_${i}`,
              verifiedAt: new Date(),
              verificationMethod: 'supervisor',
              confidence: 0.9 + i * 0.01,
              evidence: ['Performance data', 'Supervisor feedback'],
              dataQuality: 'high'
            }
          }
        });
        
        await evidenceManager.submitForVerification(evidence.id);
        await evidenceManager.verifyEvidence(evidence.id, `verifier_${i}`, {
          status: 'verified',
          comments: `Excellent ${competencies[i]} skills`,
          competencyLevels: { [competencies[i]]: i < 2 ? 'intermediate' : 'advanced' }
        });
        
        evidenceEntries.push(evidence);
      }

      // Step 2: Generate multiple portfolio versions
      const portfolioOptions = [
        { template: 'professional', targetAudience: 'employer' },
        { template: 'academic', targetAudience: 'certification' },
        { template: 'technical', targetAudience: 'employer' }
      ];

      for (const options of portfolioOptions) {
        await portfolioService.generatePortfolio(mockUserId, {
          template: options.template as any,
          targetAudience: options.targetAudience as any,
          includePrivateData: false
        });
      }

      // Step 3: Simulate portfolio views and interactions
      const portfolioVersions = await portfolioService.getPortfolioVersions(mockUserId);
      
      for (let i = 0; i < 10; i++) {
        await portfolioService.trackPortfolioView(
          mockUserId, 
          portfolioVersions[0].id, 
          i % 3 === 0 ? 'employer' : 'user'
        );
      }

      // Step 4: Export portfolios in different formats
      await portfolioService.exportPortfolio(mockUserId, portfolioVersions[0].id, {
        format: 'pdf',
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
            colors: { primary: '#2563eb', secondary: '#64748b', accent: '#f59e0b' },
            fonts: { header: 'Inter', body: 'Inter' },
            personalBranding: {}
          },
          layout: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 20, bottom: 20, left: 20, right: 20 },
            sections: { header: true, footer: true }
          },
          privacy: {}
        },
        recipient: 'personal'
      });

      await portfolioService.exportPortfolio(mockUserId, portfolioVersions[1].id, {
        format: 'json',
        template: 'structured',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: {
            colors: { primary: '#2563eb', secondary: '#64748b', accent: '#f59e0b' },
            fonts: { header: 'Inter', body: 'Inter' },
            personalBranding: {}
          },
          layout: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 20, bottom: 20, left: 20, right: 20 },
            sections: { header: true, footer: true }
          },
          privacy: {}
        },
        recipient: 'personal'
      });

      // Step 5: Get comprehensive analytics
      const portfolioSummary = await portfolioService.getPortfolioSummary(mockUserId);
      const portfolioAnalytics = await portfolioService.getPortfolioAnalytics(mockUserId);
      const evidencePortfolio = await evidenceManager.getEvidencePortfolio(mockUserId);
      const competencyReport = await evidenceManager.generateCompetencyReport(mockUserId);

      // Verify analytics data
      expect(portfolioSummary).toEqual(expect.objectContaining({
        totalPortfolios: 3,
        activePortfolios: 1, // Only latest is active
        totalViews: 10,
        totalDownloads: 2,
        skillsDocumented: 5,
        verificationStatus: {
          verified: 5,
          pending: 0,
          total: 5
        }
      }));

      expect(portfolioAnalytics).toEqual(expect.objectContaining({
        views: 10,
        downloads: 2,
        employerInteractions: 3, // 3 out of 10 views were from employers
        lastUpdated: expect.any(Date)
      }));

      expect(evidencePortfolio.summary).toEqual(expect.objectContaining({
        totalEvidence: 5,
        verifiedEvidence: 5,
        averageScore: expect.any(Number)
      }));

      expect(competencyReport.competencies).toHaveLength(5);
      expect(competencyReport.overallAssessment).toBeDefined();
      expect(competencyReport.recommendations).toBeDefined();

      // Verify skill progression tracking
      const jsCompetency = competencyReport.competencies.find(c => c.name === 'JavaScript');
      expect(jsCompetency?.currentLevel).toBe('intermediate');
      expect(jsCompetency?.evidenceCount).toBe(1);

      const problemSolvingComp = competencyReport.competencies.find(c => c.name === 'Problem Solving');
      expect(problemSolvingComp?.currentLevel).toBe('advanced');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle various error conditions gracefully', async () => {
      // Test non-existent user
      await expect(portfolioService.generatePortfolio('nonexistent_user', {
        template: 'professional',
        targetAudience: 'employer',
        includePrivateData: false
      })).rejects.toThrow();

      // Test invalid portfolio ID
      await expect(portfolioService.exportPortfolio(mockUserId, 'invalid_portfolio_id', {
        format: 'pdf',
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
            colors: { primary: '#000000', secondary: '#666666', accent: '#cccccc' },
            fonts: { header: 'Arial', body: 'Arial' },
            personalBranding: {}
          },
          layout: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 20, bottom: 20, left: 20, right: 20 },
            sections: { header: true, footer: true }
          },
          privacy: {}
        },
        recipient: 'personal'
      })).rejects.toThrow('Portfolio not found');

      // Test privacy violations
      await portfolioService.updatePrivacySettings(mockUserId, {
        employerAccess: {
          fullProfile: false,
          performanceData: false,
          skillEvidence: false,
          recommendations: false
        }
      });

      const portfolio = await portfolioService.generatePortfolio(mockUserId, {
        template: 'professional',
        targetAudience: 'employer',
        includePrivateData: false
      });

      const portfolioVersions = await portfolioService.getPortfolioVersions(mockUserId);
      
      await expect(portfolioService.sharePortfolioWithEmployer(
        mockUserId,
        portfolioVersions[0].id,
        'unauthorized_employer',
        { position: 'Developer' }
      )).rejects.toThrow('Employer sharing not permitted by privacy settings');

      // Test invalid evidence submission
      await expect(evidenceManager.createEvidence(mockUserId, {
        competency: '', // Invalid empty competency
        skillLevel: 'advanced',
        evidence: {
          scenario: '',
          description: '',
          actions: [],
          outcome: '',
          metrics: {},
          artifacts: [],
          validation: {}
        }
      })).rejects.toThrow();
    });
  });
});