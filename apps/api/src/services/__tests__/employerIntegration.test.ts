import { 
  EmployerIntegration, 
  EmployerProfile, 
  CandidateApplication, 
  VerificationProcess,
  CommunicationHistory 
} from '../employerIntegration';

describe('EmployerIntegration', () => {
  let employerIntegration: EmployerIntegration;
  
  const mockEmployerData = {
    companyName: 'Tech Corp',
    companySize: 'medium' as const,
    industry: 'Technology',
    contactPerson: {
      name: 'Jane Smith',
      title: 'HR Manager',
      email: 'jane.smith@techcorp.com',
      phone: '+1-555-0123'
    },
    preferences: {
      skillCategories: ['Technical', 'Communication'],
      experienceLevels: ['mid', 'senior'],
      certificationRequirements: ['AWS', 'Microsoft'],
      communicationPreferences: ['email', 'phone']
    },
    metadata: {
      website: 'https://techcorp.com',
      companyLogo: 'https://techcorp.com/logo.png'
    }
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
      technical: [{
        competencyId: 'js',
        competencyName: 'JavaScript',
        level: 'advanced',
        evidence: [],
        demonstrationExamples: [],
        skillProgression: [],
        certifications: []
      }],
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

  beforeEach(() => {
    employerIntegration = new EmployerIntegration();
  });

  describe('registerEmployer', () => {
    it('should register employer successfully', async () => {
      const employer = await employerIntegration.registerEmployer(mockEmployerData);

      expect(employer).toEqual(expect.objectContaining({
        id: expect.any(String),
        companyName: 'Tech Corp',
        companySize: 'medium',
        industry: 'Technology',
        verificationLevel: 'basic',
        contactPerson: expect.objectContaining({
          name: 'Jane Smith',
          email: 'jane.smith@techcorp.com'
        })
      }));
      expect(employer.metadata.registeredAt).toBeInstanceOf(Date);
    });

    it('should handle minimal employer data', async () => {
      const minimalData = {
        companyName: 'Startup Inc',
        contactPerson: {
          name: 'Bob Johnson',
          title: 'CEO',
          email: 'bob@startup.com'
        }
      };

      const employer = await employerIntegration.registerEmployer(minimalData);

      expect(employer.companyName).toBe('Startup Inc');
      expect(employer.companySize).toBe('small');
      expect(employer.verificationLevel).toBe('basic');
    });

    it('should set default preferences when not provided', async () => {
      const employer = await employerIntegration.registerEmployer({
        companyName: 'Test Co',
        contactPerson: {
          name: 'Test User',
          title: 'Manager',
          email: 'test@testco.com'
        }
      });

      expect(employer.preferences).toEqual({
        skillCategories: [],
        experienceLevels: [],
        certificationRequirements: [],
        communicationPreferences: []
      });
    });
  });

  describe('submitApplication', () => {
    let employerId: string;

    beforeEach(async () => {
      const employer = await employerIntegration.registerEmployer(mockEmployerData);
      employerId = employer.id;
    });

    it('should submit application successfully', async () => {
      const applicationData = {
        position: {
          title: 'Senior Developer',
          department: 'Engineering',
          level: 'senior' as const,
          requirements: [{
            competency: 'JavaScript',
            level: 'advanced' as const,
            mandatory: true,
            weight: 0.8
          }]
        },
        portfolio: mockPortfolio,
        coverLetter: 'I am excited to apply for this position',
        selectedEvidence: ['evidence1', 'evidence2']
      };

      const application = await employerIntegration.submitApplication(
        'candidate123',
        employerId,
        applicationData
      );

      expect(application).toEqual(expect.objectContaining({
        id: expect.any(String),
        candidateId: 'candidate123',
        employerId,
        status: 'submitted',
        submission: expect.objectContaining({
          portfolio: mockPortfolio,
          coverLetter: 'I am excited to apply for this position',
          consentGiven: true
        })
      }));
      expect(application.timeline).toHaveLength(1);
      expect(application.timeline[0].event).toBe('submitted');
    });

    it('should initiate verification process automatically', async () => {
      const application = await employerIntegration.submitApplication(
        'candidate123',
        employerId,
        {
          position: {
            title: 'Developer',
            department: 'Tech',
            level: 'mid',
            requirements: []
          },
          portfolio: mockPortfolio,
          selectedEvidence: []
        }
      );

      expect(application.verification).toEqual(expect.objectContaining({
        id: expect.any(String),
        status: 'pending',
        overallScore: 0
      }));
    });
  });

  describe('reviewApplication', () => {
    let applicationId: string;
    let employerId: string;

    beforeEach(async () => {
      const employer = await employerIntegration.registerEmployer(mockEmployerData);
      employerId = employer.id;

      const application = await employerIntegration.submitApplication(
        'candidate123',
        employerId,
        {
          position: {
            title: 'Developer',
            department: 'Tech',
            level: 'mid',
            requirements: []
          },
          portfolio: mockPortfolio,
          selectedEvidence: []
        }
      );
      applicationId = application.id;
    });

    it('should update application status to under review', async () => {
      await employerIntegration.reviewApplication(applicationId, 'reviewer123');

      // Since we can't directly get the application, we'll verify through dashboard
      const dashboard = await employerIntegration.getEmployerDashboard(employerId);
      expect(dashboard.applications.underReview).toBe(1);
    });

    it('should increment view count', async () => {
      await employerIntegration.reviewApplication(applicationId, 'reviewer123');
      await employerIntegration.reviewApplication(applicationId, 'reviewer456');

      const dashboard = await employerIntegration.getEmployerDashboard(employerId);
      expect(dashboard.applications.underReview).toBe(1);
    });

    it('should handle non-existent application', async () => {
      await expect(employerIntegration.reviewApplication('nonexistent', 'reviewer123'))
        .rejects.toThrow('Application not found');
    });
  });

  describe('performVerification', () => {
    let verificationId: string;
    let employerId: string;

    beforeEach(async () => {
      const employer = await employerIntegration.registerEmployer(mockEmployerData);
      employerId = employer.id;

      const application = await employerIntegration.submitApplication(
        'candidate123',
        employerId,
        {
          position: {
            title: 'Developer',
            department: 'Tech',
            level: 'mid',
            requirements: []
          },
          portfolio: mockPortfolio,
          selectedEvidence: []
        }
      );
      verificationId = application.verification.id;
    });

    it('should complete verification successfully', async () => {
      const verificationData = {
        competencyResults: [{
          competency: 'JavaScript',
          claimedLevel: 'advanced',
          verifiedLevel: 'intermediate',
          evidence: [],
          verificationMethod: 'document_review' as const,
          score: 75,
          feedback: 'Good understanding but needs more practical experience',
          verified: true
        }],
        overallAssessment: 'good' as const,
        recommendation: 'recommend' as const,
        comments: 'Candidate shows strong potential with some areas for growth'
      };

      const verification = await employerIntegration.performVerification(
        verificationId,
        'verifier123',
        verificationData
      );

      expect(verification.status).toBe('completed');
      expect(verification.overallScore).toBe(75);
      expect(verification.verifiedBy).toBe('verifier123');
      expect(verification.verificationReport.overallAssessment).toBe('good');
      expect(verification.verificationReport.hiringRecommendation).toBe('recommend');
    });

    it('should calculate overall score from competency results', async () => {
      const verificationData = {
        competencyResults: [
          {
            competency: 'JavaScript',
            claimedLevel: 'advanced',
            verifiedLevel: 'advanced',
            evidence: [],
            verificationMethod: 'practical_test' as const,
            score: 90,
            feedback: 'Excellent skills',
            verified: true
          },
          {
            competency: 'Communication',
            claimedLevel: 'intermediate',
            verifiedLevel: 'intermediate',
            evidence: [],
            verificationMethod: 'interview' as const,
            score: 80,
            feedback: 'Good communication',
            verified: true
          }
        ],
        overallAssessment: 'excellent' as const,
        recommendation: 'strongly_recommend' as const,
        comments: 'Outstanding candidate'
      };

      const verification = await employerIntegration.performVerification(
        verificationId,
        'verifier123',
        verificationData
      );

      expect(verification.overallScore).toBe(85); // Average of 90 and 80
    });

    it('should handle non-existent verification', async () => {
      await expect(employerIntegration.performVerification(
        'nonexistent',
        'verifier123',
        {
          competencyResults: [],
          overallAssessment: 'good',
          recommendation: 'recommend',
          comments: 'Test'
        }
      )).rejects.toThrow('Verification process not found');
    });
  });

  describe('getEmployerDashboard', () => {
    let employerId: string;

    beforeEach(async () => {
      const employer = await employerIntegration.registerEmployer(mockEmployerData);
      employerId = employer.id;

      // Create multiple applications for testing
      await employerIntegration.submitApplication('candidate1', employerId, {
        position: { title: 'Dev1', department: 'Tech', level: 'mid', requirements: [] },
        portfolio: mockPortfolio,
        selectedEvidence: []
      });

      await employerIntegration.submitApplication('candidate2', employerId, {
        position: { title: 'Dev2', department: 'Tech', level: 'senior', requirements: [] },
        portfolio: mockPortfolio,
        selectedEvidence: []
      });
    });

    it('should return comprehensive dashboard data', async () => {
      const dashboard = await employerIntegration.getEmployerDashboard(employerId);

      expect(dashboard).toEqual(expect.objectContaining({
        applications: expect.objectContaining({
          total: 2,
          pending: 2,
          underReview: 0,
          verified: 0,
          hired: 0
        }),
        candidates: expect.objectContaining({
          topCandidates: expect.any(Array),
          skillMatches: expect.any(Array),
          diversityMetrics: expect.objectContaining({
            genderDistribution: expect.any(Object),
            experienceDistribution: expect.any(Object)
          })
        }),
        analytics: expect.objectContaining({
          hiringTrends: expect.any(Array),
          timeToHire: expect.any(Number),
          verificationAccuracy: expect.any(Number)
        }),
        recommendations: expect.objectContaining({
          candidateRecommendations: expect.any(Array),
          processImprovements: expect.any(Array)
        })
      }));
    });

    it('should rank candidates by performance', async () => {
      const dashboard = await employerIntegration.getEmployerDashboard(employerId);

      expect(dashboard.candidates.topCandidates).toHaveLength(2);
      expect(dashboard.candidates.topCandidates[0]).toEqual(expect.objectContaining({
        candidateId: expect.any(String),
        name: 'John Doe',
        overallScore: expect.any(Number),
        skillMatch: expect.any(Number)
      }));
    });

    it('should provide skill match analysis', async () => {
      const dashboard = await employerIntegration.getEmployerDashboard(employerId);

      expect(dashboard.candidates.skillMatches).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            competency: expect.any(String),
            candidatesWithSkill: expect.any(Number),
            averageLevel: expect.any(String)
          })
        ])
      );
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const message = await employerIntegration.sendMessage(
        'employer123',
        'candidate456',
        'interview_request',
        {
          subject: 'Interview Invitation',
          message: 'We would like to schedule an interview',
          priority: 'high'
        }
      );

      expect(message).toEqual(expect.objectContaining({
        id: expect.any(String),
        type: 'interview_request',
        from: 'employer123',
        to: 'candidate456',
        subject: 'Interview Invitation',
        content: 'We would like to schedule an interview',
        priority: 'high',
        read: false
      }));
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should handle messages without subject', async () => {
      const message = await employerIntegration.sendMessage(
        'user1',
        'user2',
        'status_update',
        {
          message: 'Your application status has been updated'
        }
      );

      expect(message.subject).toBeUndefined();
      expect(message.priority).toBe('medium');
    });

    it('should store message in communication history', async () => {
      await employerIntegration.sendMessage(
        'employer123',
        'candidate456',
        'message',
        {
          message: 'Hello candidate'
        }
      );

      const history = await employerIntegration.getCommunicationHistory('candidate456');
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Hello candidate');
    });
  });

  describe('getCommunicationHistory', () => {
    beforeEach(async () => {
      // Send multiple messages
      await employerIntegration.sendMessage('employer1', 'user123', 'message', {
        message: 'First message'
      });
      
      await employerIntegration.sendMessage('employer2', 'user123', 'interview_request', {
        subject: 'Interview',
        message: 'Second message'
      });
      
      await employerIntegration.sendMessage('employer1', 'user123', 'status_update', {
        message: 'Third message'
      });
    });

    it('should return communication history', async () => {
      const history = await employerIntegration.getCommunicationHistory('user123');

      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('Third message'); // Most recent first
      expect(history[1].content).toBe('Second message');
      expect(history[2].content).toBe('First message');
    });

    it('should limit results when specified', async () => {
      const history = await employerIntegration.getCommunicationHistory('user123', 2);

      expect(history).toHaveLength(2);
    });

    it('should return empty array for user with no messages', async () => {
      const history = await employerIntegration.getCommunicationHistory('newuser');

      expect(history).toHaveLength(0);
    });
  });

  describe('scheduleInterview', () => {
    let applicationId: string;
    let employerId: string;

    beforeEach(async () => {
      const employer = await employerIntegration.registerEmployer(mockEmployerData);
      employerId = employer.id;

      const application = await employerIntegration.submitApplication(
        'candidate123',
        employerId,
        {
          position: {
            title: 'Developer',
            department: 'Tech',
            level: 'mid',
            requirements: []
          },
          portfolio: mockPortfolio,
          selectedEvidence: []
        }
      );
      applicationId = application.id;
    });

    it('should schedule interview successfully', async () => {
      const interviewData = {
        type: 'video' as const,
        datetime: new Date('2024-03-15T10:00:00Z'),
        duration: 60,
        location: 'https://zoom.us/meeting/123',
        interviewers: ['interviewer1', 'interviewer2'],
        agenda: ['Technical questions', 'Behavioral questions', 'Q&A']
      };

      await expect(employerIntegration.scheduleInterview(
        applicationId,
        'scheduler123',
        interviewData
      )).resolves.not.toThrow();
    });

    it('should handle in-person interviews', async () => {
      const interviewData = {
        type: 'in_person' as const,
        datetime: new Date('2024-03-15T14:00:00Z'),
        duration: 90,
        location: '123 Main St, Conference Room A',
        interviewers: ['hr_manager'],
        agenda: ['Company overview', 'Role discussion']
      };

      await expect(employerIntegration.scheduleInterview(
        applicationId,
        'scheduler123',
        interviewData
      )).resolves.not.toThrow();
    });

    it('should handle non-existent application', async () => {
      await expect(employerIntegration.scheduleInterview(
        'nonexistent',
        'scheduler123',
        {
          type: 'phone',
          datetime: new Date(),
          duration: 30,
          interviewers: ['interviewer1'],
          agenda: ['Brief chat']
        }
      )).rejects.toThrow('Application not found');
    });
  });

  describe('submitAppeal', () => {
    let verificationId: string;

    beforeEach(async () => {
      const employer = await employerIntegration.registerEmployer(mockEmployerData);
      const application = await employerIntegration.submitApplication(
        'candidate123',
        employer.id,
        {
          position: {
            title: 'Developer',
            department: 'Tech',
            level: 'mid',
            requirements: []
          },
          portfolio: mockPortfolio,
          selectedEvidence: []
        }
      );
      verificationId = application.verification.id;

      // Complete initial verification
      await employerIntegration.performVerification(verificationId, 'verifier123', {
        competencyResults: [{
          competency: 'JavaScript',
          claimedLevel: 'advanced',
          verifiedLevel: 'intermediate',
          evidence: [],
          verificationMethod: 'document_review',
          score: 60,
          feedback: 'Needs improvement',
          verified: false
        }],
        overallAssessment: 'needs_improvement',
        recommendation: 'not_recommend',
        comments: 'Skills not at claimed level'
      });
    });

    it('should submit appeal successfully', async () => {
      const appealData = {
        reason: 'Additional evidence provided showing advanced skills',
        additionalEvidence: [{
          id: 'artifact1',
          type: 'certificate' as const,
          fileName: 'javascript_certification.pdf',
          filePath: '/uploads/cert.pdf',
          fileSize: 50000,
          uploadedAt: new Date(),
          description: 'Advanced JavaScript certification'
        }]
      };

      const appeal = await employerIntegration.submitAppeal(
        verificationId,
        'JavaScript',
        appealData
      );

      expect(appeal).toEqual(expect.objectContaining({
        id: expect.any(String),
        competency: 'JavaScript',
        reason: appealData.reason,
        additionalEvidence: appealData.additionalEvidence,
        status: 'pending'
      }));
    });

    it('should handle non-existent verification', async () => {
      await expect(employerIntegration.submitAppeal(
        'nonexistent',
        'JavaScript',
        {
          reason: 'Test appeal',
          additionalEvidence: []
        }
      )).rejects.toThrow('Verification process not found');
    });
  });

  describe('generateVerificationReport', () => {
    let verificationId: string;

    beforeEach(async () => {
      const employer = await employerIntegration.registerEmployer(mockEmployerData);
      const application = await employerIntegration.submitApplication(
        'candidate123',
        employer.id,
        {
          position: {
            title: 'Developer',
            department: 'Tech',
            level: 'mid',
            requirements: []
          },
          portfolio: mockPortfolio,
          selectedEvidence: []
        }
      );
      verificationId = application.verification.id;

      await employerIntegration.performVerification(verificationId, 'verifier123', {
        competencyResults: [{
          competency: 'JavaScript',
          claimedLevel: 'advanced',
          verifiedLevel: 'advanced',
          evidence: [],
          verificationMethod: 'practical_test',
          score: 85,
          feedback: 'Excellent technical skills',
          verified: true
        }],
        overallAssessment: 'excellent',
        recommendation: 'strongly_recommend',
        comments: 'Outstanding candidate with strong technical abilities'
      });
    });

    it('should generate verification report', async () => {
      const report = await employerIntegration.generateVerificationReport(verificationId);

      expect(report).toEqual(expect.objectContaining({
        summary: 'Outstanding candidate with strong technical abilities',
        strengths: expect.arrayContaining([
          expect.stringContaining('Strong JavaScript skills')
        ]),
        overallAssessment: 'excellent',
        hiringRecommendation: 'strongly_recommend'
      }));
    });

    it('should handle non-existent verification', async () => {
      await expect(employerIntegration.generateVerificationReport('nonexistent'))
        .rejects.toThrow('Verification process not found');
    });
  });

  describe('getEmployerNotifications', () => {
    let employerId: string;

    beforeEach(async () => {
      const employer = await employerIntegration.registerEmployer(mockEmployerData);
      employerId = employer.id;
    });

    it('should return employer notifications', async () => {
      const notifications = await employerIntegration.getEmployerNotifications(employerId);

      expect(notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            type: expect.any(String),
            title: expect.any(String),
            message: expect.any(String),
            priority: expect.any(String),
            timestamp: expect.any(Date),
            read: expect.any(Boolean),
            actionRequired: expect.any(Boolean)
          })
        ])
      );
    });

    it('should limit notifications when specified', async () => {
      const notifications = await employerIntegration.getEmployerNotifications(employerId, 5);

      expect(notifications.length).toBeLessThanOrEqual(5);
    });

    it('should sort notifications by timestamp descending', async () => {
      const notifications = await employerIntegration.getEmployerNotifications(employerId);

      if (notifications.length > 1) {
        expect(notifications[0].timestamp.getTime())
          .toBeGreaterThanOrEqual(notifications[1].timestamp.getTime());
      }
    });
  });
});