import { EvidenceManager, SkillEvidence, EvidenceArtifact, ValidationData } from '../evidenceManager';

describe('EvidenceManager', () => {
  let evidenceManager: EvidenceManager;
  
  const mockUserId = 'user123';
  const mockEvidence: SkillEvidence = {
    id: 'evidence1',
    userId: mockUserId,
    competency: 'Problem Solving',
    skillLevel: 'advanced',
    evidence: {
      scenario: 'Customer billing issue resolution',
      description: 'Successfully resolved complex billing dispute',
      actions: [
        'Analyzed customer account history',
        'Identified root cause of billing error',
        'Coordinated with billing team',
        'Implemented solution'
      ],
      outcome: 'Customer satisfied, billing corrected, process improved',
      metrics: {
        overall: 95,
        dimensions: {
          technicalCompetency: 90,
          customerService: 100,
          communicationSkills: 95,
          problemSolving: 95,
          processCompliance: 90
        }
      },
      artifacts: [],
      validation: {
        verifiedBy: 'supervisor123',
        verifiedAt: new Date(),
        verificationMethod: 'supervisor',
        confidence: 0.95,
        evidence: ['Customer feedback', 'Process documentation'],
        dataQuality: 'high'
      }
    },
    documentation: {
      title: 'Complex Billing Dispute Resolution',
      summary: 'Demonstrated advanced problem-solving skills in resolving customer billing dispute',
      learningObjectives: [
        'Apply systematic problem-solving approach',
        'Demonstrate customer service excellence',
        'Show effective communication skills'
      ],
      competenciesDemonstrated: ['Problem Solving', 'Customer Service', 'Communication'],
      reflectiveAnalysis: 'This scenario highlighted my ability to handle complex customer issues systematically and empathetically.'
    },
    verification: {
      status: 'verified',
      verifiedBy: 'supervisor123',
      verifiedAt: new Date(),
      verifierComments: 'Excellent demonstration of problem-solving skills',
      verificationMethod: 'supervisor'
    },
    timestamps: {
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
      verifiedAt: new Date()
    },
    metadata: {
      tags: ['problem-solving', 'customer-service', 'billing'],
      category: 'technical',
      difficulty: 'advanced',
      industryStandards: ['ITIL', 'Customer Service Excellence'],
      certificationRelevance: ['Customer Service Certification', 'Problem Solving Certificate']
    }
  };

  beforeEach(() => {
    evidenceManager = new EvidenceManager();
  });

  describe('createEvidence', () => {
    it('should create new evidence successfully', async () => {
      const evidenceData = {
        competency: 'Problem Solving',
        skillLevel: 'advanced' as const,
        evidence: mockEvidence.evidence,
        documentation: mockEvidence.documentation,
        metadata: mockEvidence.metadata
      };

      const result = await evidenceManager.createSkillEvidence(mockUserId, evidenceData);

      expect(result).toEqual(expect.objectContaining({
        userId: mockUserId,
        competency: 'Problem Solving',
        skillLevel: 'advanced',
        verification: expect.objectContaining({
          status: 'draft'
        })
      }));
      expect(result.id).toBeDefined();
      expect(result.timestamps.createdAt).toBeInstanceOf(Date);
    });

    it('should handle missing optional fields', async () => {
      const minimalData = {
        competency: 'Communication',
        skillLevel: 'intermediate' as const,
        evidence: {
          scenario: 'Team meeting facilitation',
          description: 'Led team meeting effectively',
          actions: ['Prepared agenda', 'Facilitated discussion'],
          outcome: 'Team alignment achieved',
          metrics: {},
          artifacts: [],
          validation: {}
        }
      };

      const result = await evidenceManager.createSkillEvidence(mockUserId, minimalData);

      expect(result).toEqual(expect.objectContaining({
        competency: 'Communication',
        documentation: expect.objectContaining({
          title: expect.any(String),
          summary: expect.any(String)
        })
      }));
    });
  });

  describe('updateEvidence', () => {
    beforeEach(async () => {
      await evidenceManager.createSkillEvidence(mockUserId, {
        competency: mockEvidence.competency,
        skillLevel: mockEvidence.skillLevel,
        evidence: mockEvidence.evidence,
        documentation: mockEvidence.documentation,
        metadata: mockEvidence.metadata
      });
    });

    it('should update existing evidence', async () => {
      const evidenceList = await evidenceManager.getSkillEvidence(mockUserId);
      const evidenceId = evidenceList[0].id;

      const updates = {
        documentation: {
          ...mockEvidence.documentation,
          title: 'Updated Title',
          summary: 'Updated summary'
        }
      };

      const result = await evidenceManager.updateSkillEvidence(mockUserId, evidenceId, updates);

      expect(result.documentation.title).toBe('Updated Title');
      expect(result.documentation.summary).toBe('Updated summary');
      expect(result.timestamps.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle non-existent evidence', async () => {
      await expect(evidenceManager.updateEvidence('nonexistent', {}))
        .rejects.toThrow('Evidence not found');
    });

    it('should prevent updates to verified evidence', async () => {
      const evidenceList = await evidenceManager.getSkillEvidence(mockUserId);
      const evidenceId = evidenceList[0].id;

      // First verify the evidence
      await evidenceManager.submitEvidenceForVerification(mockUserId, evidenceId);
      await evidenceManager.verifyEvidence(evidenceId, {
        method: 'supervisor',
        validationCriteria: [{
          criterion: 'Problem Solving',
          weight: 1.0,
          score: 85,
          comments: 'Excellent problem solving demonstrated',
          evidence: ['Documentation', 'Supervisor review']
        }],
        score: 85,
        feedback: 'Approved',
        recommendations: ['Continue developing advanced skills'],
        validatedAt: new Date()
      }, 'verifier123');

      // Try to update verified evidence
      await expect(evidenceManager.updateSkillEvidence(mockUserId, evidenceId, {
        documentation: { title: 'New Title' }
      })).rejects.toThrow('Cannot update verified evidence');
    });
  });

  describe('submitForVerification', () => {
    let evidenceId: string;

    beforeEach(async () => {
      const evidence = await evidenceManager.createSkillEvidence(mockUserId, {
        competency: mockEvidence.competency,
        skillLevel: mockEvidence.skillLevel,
        evidence: mockEvidence.evidence,
        documentation: mockEvidence.documentation,
        metadata: mockEvidence.metadata
      });
      evidenceId = evidence.id;
    });

    it('should submit evidence for verification', async () => {
      const result = await evidenceManager.submitEvidenceForVerification(mockUserId, evidenceId);

      expect(result.verification.status).toBe('submitted');
      expect(result.timestamps.submittedAt).toBeInstanceOf(Date);
    });

    it('should handle already submitted evidence', async () => {
      await evidenceManager.submitEvidenceForVerification(mockUserId, evidenceId);
      
      await expect(evidenceManager.submitForVerification(evidenceId))
        .rejects.toThrow('Evidence already submitted or verified');
    });

    it('should validate evidence before submission', async () => {
      // Create incomplete evidence
      const incompleteEvidence = await evidenceManager.createSkillEvidence(mockUserId, {
        competency: 'Test',
        skillLevel: 'beginner',
        evidence: {
          scenario: '',
          description: '',
          actions: [],
          outcome: '',
          metrics: {},
          artifacts: [],
          validation: {}
        }
      });

      await expect(evidenceManager.submitForVerification(incompleteEvidence.id))
        .rejects.toThrow('Evidence validation failed');
    });
  });

  describe('verifyEvidence', () => {
    let evidenceId: string;

    beforeEach(async () => {
      const evidence = await evidenceManager.createSkillEvidence(mockUserId, {
        competency: mockEvidence.competency,
        skillLevel: mockEvidence.skillLevel,
        evidence: mockEvidence.evidence,
        documentation: mockEvidence.documentation,
        metadata: mockEvidence.metadata
      });
      evidenceId = evidence.id;
      await evidenceManager.submitEvidenceForVerification(mockUserId, evidenceId);
    });

    it('should verify evidence successfully', async () => {
      const verificationData = {
        status: 'verified' as const,
        comments: 'Excellent work demonstrating problem-solving skills',
        competencyLevels: {
          'Problem Solving': 'advanced' as const
        }
      };

      const result = await evidenceManager.verifyEvidence(evidenceId, 'verifier123', verificationData);

      expect(result.verification.status).toBe('verified');
      expect(result.verification.verifiedBy).toBe('verifier123');
      expect(result.verification.verifierComments).toBe(verificationData.comments);
      expect(result.timestamps.verifiedAt).toBeInstanceOf(Date);
    });

    it('should reject evidence with feedback', async () => {
      const verificationData = {
        status: 'rejected' as const,
        comments: 'Insufficient evidence provided',
        competencyLevels: {}
      };

      const result = await evidenceManager.verifyEvidence(evidenceId, 'verifier123', verificationData);

      expect(result.verification.status).toBe('rejected');
      expect(result.verification.verifierComments).toBe(verificationData.comments);
    });

    it('should handle non-submitted evidence', async () => {
      const newEvidence = await evidenceManager.createSkillEvidence(mockUserId, {
        competency: 'Test',
        skillLevel: 'beginner',
        evidence: mockEvidence.evidence
      });

      await expect(evidenceManager.verifyEvidence(newEvidence.id, 'verifier123', {
        status: 'verified',
        comments: 'Good',
        competencyLevels: {}
      })).rejects.toThrow('Evidence not submitted for verification');
    });
  });

  describe('getUserEvidence', () => {
    beforeEach(async () => {
      // Create multiple evidence entries
      await evidenceManager.createSkillEvidence(mockUserId, {
        competency: 'Problem Solving',
        skillLevel: 'advanced',
        evidence: mockEvidence.evidence
      });

      await evidenceManager.createSkillEvidence(mockUserId, {
        competency: 'Communication',
        skillLevel: 'intermediate',
        evidence: mockEvidence.evidence
      });

      await evidenceManager.createSkillEvidence('otherUser', {
        competency: 'Technical Skills',
        skillLevel: 'expert',
        evidence: mockEvidence.evidence
      });
    });

    it('should return user-specific evidence', async () => {
      const evidence = await evidenceManager.getSkillEvidence(mockUserId);

      expect(evidence).toHaveLength(2);
      expect(evidence.every(e => e.userId === mockUserId)).toBe(true);
    });

    it('should filter by competency', async () => {
      const evidence = await evidenceManager.getSkillEvidence(mockUserId, {
        competency: 'Problem Solving'
      });

      expect(evidence).toHaveLength(1);
      expect(evidence[0].competency).toBe('Problem Solving');
    });

    it('should filter by verification status', async () => {
      const evidenceList = await evidenceManager.getSkillEvidence(mockUserId);
      await evidenceManager.submitEvidenceForVerification(mockUserId, evidenceList[0].id);

      const submittedEvidence = await evidenceManager.getUserEvidence(mockUserId, {
        verificationStatus: 'submitted'
      });

      expect(submittedEvidence).toHaveLength(1);
      expect(submittedEvidence[0].verification.status).toBe('submitted');
    });

    it('should sort by creation date', async () => {
      const evidence = await evidenceManager.getSkillEvidence(mockUserId);

      // Should be sorted by creation date descending
      expect(evidence[0].timestamps.createdAt.getTime())
        .toBeGreaterThanOrEqual(evidence[1].timestamps.createdAt.getTime());
    });
  });

  describe('getEvidencePortfolio', () => {
    beforeEach(async () => {
      // Create verified evidence
      const evidence1 = await evidenceManager.createSkillEvidence(mockUserId, {
        competency: 'Problem Solving',
        skillLevel: 'advanced',
        evidence: mockEvidence.evidence
      });

      const evidence2 = await evidenceManager.createSkillEvidence(mockUserId, {
        competency: 'Communication',
        skillLevel: 'intermediate',
        evidence: mockEvidence.evidence
      });

      await evidenceManager.submitEvidenceForVerification(mockUserId, evidence1.id);
      await evidenceManager.verifyEvidence(evidence1.id, 'verifier123', {
        status: 'verified',
        comments: 'Excellent',
        competencyLevels: { 'Problem Solving': 'advanced' }
      });

      await evidenceManager.submitEvidenceForVerification(mockUserId, evidence2.id);
      await evidenceManager.verifyEvidence(evidence2.id, 'verifier123', {
        status: 'verified',
        comments: 'Good',
        competencyLevels: { 'Communication': 'intermediate' }
      });
    });

    it('should generate evidence portfolio', async () => {
      const portfolio = await evidenceManager.getEvidencePortfolio(mockUserId);

      expect(portfolio.userId).toBe(mockUserId);
      expect(portfolio.competencyFramework).toBeDefined();
      expect(portfolio.evidenceByCompetency).toHaveProperty('Problem Solving');
      expect(portfolio.evidenceByCompetency).toHaveProperty('Communication');
      expect(portfolio.summary.totalEvidence).toBe(2);
      expect(portfolio.summary.verifiedEvidence).toBe(2);
    });

    it('should include professional presentation format', async () => {
      const portfolio = await evidenceManager.getEvidencePortfolio(mockUserId, {
        format: 'professional'
      });

      expect(portfolio.professionalSummary).toBeDefined();
      expect(portfolio.competencyMatrix).toBeDefined();
      expect(portfolio.certificationReadiness).toBeDefined();
    });
  });

  describe('searchEvidence', () => {
    beforeEach(async () => {
      await evidenceManager.createSkillEvidence(mockUserId, {
        competency: 'Problem Solving',
        skillLevel: 'advanced',
        evidence: {
          ...mockEvidence.evidence,
          scenario: 'Customer billing issue'
        },
        metadata: {
          tags: ['billing', 'customer-service'],
          category: 'technical',
          difficulty: 'advanced',
          industryStandards: [],
          certificationRelevance: []
        }
      });

      await evidenceManager.createSkillEvidence(mockUserId, {
        competency: 'Communication',
        skillLevel: 'intermediate',
        evidence: {
          ...mockEvidence.evidence,
          scenario: 'Team presentation'
        },
        metadata: {
          tags: ['presentation', 'teamwork'],
          category: 'soft-skills',
          difficulty: 'intermediate',
          industryStandards: [],
          certificationRelevance: []
        }
      });
    });

    it('should search by keyword', async () => {
      const results = await evidenceManager.searchEvidence(mockUserId, {
        keyword: 'billing',
        limit: 10
      });

      expect(results).toHaveLength(1);
      expect(results[0].evidence.scenario).toContain('billing');
    });

    it('should search by tags', async () => {
      const results = await evidenceManager.searchEvidence(mockUserId, {
        tags: ['teamwork'],
        limit: 10
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata.tags).toContain('teamwork');
    });

    it('should apply multiple filters', async () => {
      const results = await evidenceManager.searchEvidence(mockUserId, {
        competencies: ['Problem Solving'],
        skillLevels: ['advanced'],
        limit: 10
      });

      expect(results).toHaveLength(1);
      expect(results[0].competency).toBe('Problem Solving');
      expect(results[0].skillLevel).toBe('advanced');
    });
  });

  describe('deleteEvidence', () => {
    let evidenceId: string;

    beforeEach(async () => {
      const evidence = await evidenceManager.createSkillEvidence(mockUserId, {
        competency: mockEvidence.competency,
        skillLevel: mockEvidence.skillLevel,
        evidence: mockEvidence.evidence
      });
      evidenceId = evidence.id;
    });

    it('should delete draft evidence', async () => {
      await evidenceManager.deleteEvidence(evidenceId);

      const evidence = await evidenceManager.getSkillEvidence(mockUserId);
      expect(evidence.find(e => e.id === evidenceId)).toBeUndefined();
    });

    it('should prevent deletion of verified evidence', async () => {
      await evidenceManager.submitEvidenceForVerification(mockUserId, evidenceId);
      await evidenceManager.verifyEvidence(evidenceId, 'verifier123', {
        status: 'verified',
        comments: 'Good',
        competencyLevels: {}
      });

      await expect(evidenceManager.deleteEvidence(evidenceId))
        .rejects.toThrow('Cannot delete verified evidence');
    });
  });

  describe('addArtifact', () => {
    let evidenceId: string;

    beforeEach(async () => {
      const evidence = await evidenceManager.createSkillEvidence(mockUserId, {
        competency: mockEvidence.competency,
        skillLevel: mockEvidence.skillLevel,
        evidence: mockEvidence.evidence
      });
      evidenceId = evidence.id;
    });

    it('should add artifact to evidence', async () => {
      const artifact: EvidenceArtifact = {
        id: 'artifact1',
        type: 'screenshot',
        fileName: 'resolution_screenshot.png',
        filePath: '/uploads/artifacts/resolution_screenshot.png',
        fileSize: 1024000,
        uploadedAt: new Date(),
        description: 'Screenshot of resolved issue',
        metadata: {
          dimensions: { width: 1920, height: 1080 },
          format: 'PNG'
        }
      };

      const result = await evidenceManager.addArtifact(evidenceId, artifact);

      expect(result.evidence.artifacts).toContain(artifact);
    });

    it('should validate artifact type', async () => {
      const invalidArtifact = {
        id: 'artifact1',
        type: 'invalid' as any,
        fileName: 'test.txt',
        filePath: '/test.txt',
        fileSize: 100,
        uploadedAt: new Date()
      };

      await expect(evidenceManager.addArtifact(evidenceId, invalidArtifact))
        .rejects.toThrow('Invalid artifact type');
    });
  });

  describe('generateCompetencyReport', () => {
    beforeEach(async () => {
      // Create multiple evidence entries for comprehensive reporting
      const competencies = ['Problem Solving', 'Communication', 'Technical Skills'];
      const levels = ['intermediate', 'advanced', 'expert'];

      for (let i = 0; i < competencies.length; i++) {
        const evidence = await evidenceManager.createSkillEvidence(mockUserId, {
          competency: competencies[i],
          skillLevel: levels[i] as any,
          evidence: mockEvidence.evidence
        });

        await evidenceManager.submitEvidenceForVerification(mockUserId, evidence.id);
        await evidenceManager.verifyEvidence(evidence.id, 'verifier123', {
          status: 'verified',
          comments: 'Good work',
          competencyLevels: { [competencies[i]]: levels[i] as any }
        });
      }
    });

    it('should generate comprehensive competency report', async () => {
      const report = await evidenceManager.generateCompetencyReport(mockUserId);

      expect(report.userId).toBe(mockUserId);
      expect(report.competencies).toHaveLength(3);
      expect(report.overallAssessment).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.skillGaps).toBeDefined();
    });

    it('should identify skill progression', async () => {
      const report = await evidenceManager.generateCompetencyReport(mockUserId);

      const problemSolvingComp = report.competencies.find(c => c.name === 'Problem Solving');
      expect(problemSolvingComp?.currentLevel).toBe('advanced');
      expect(problemSolvingComp?.evidenceCount).toBe(1);
    });
  });
});