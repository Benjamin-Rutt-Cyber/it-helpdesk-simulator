import { ExportEngine, ExportConfiguration, BrandingOptions, LayoutOptions } from '../exportEngine';
import { ProfessionalPortfolio } from '../portfolioBuilder';

describe('ExportEngine', () => {
  let exportEngine: ExportEngine;
  
  const mockPortfolio: ProfessionalPortfolio = {
    header: {
      name: 'John Doe',
      title: 'Senior Software Developer',
      summary: 'Experienced full-stack developer with expertise in modern web technologies',
      contact: {
        email: 'john.doe@email.com',
        phone: '+1-555-0123',
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
        address: {
          city: 'San Francisco',
          state: 'CA',
          country: 'USA'
        }
      },
      generatedDate: new Date('2024-01-15'),
      portfolioId: 'portfolio123'
    },
    executiveSummary: {
      overview: 'Results-driven software developer with 8+ years of experience building scalable web applications',
      keyStrengths: [
        'Full-stack development expertise',
        'Strong problem-solving abilities',
        'Excellent communication skills',
        'Team leadership experience'
      ],
      achievements: [
        'Led development of award-winning e-commerce platform',
        'Improved application performance by 40%',
        'Mentored 15+ junior developers'
      ],
      careerGoals: [
        'Technical leadership role',
        'Architecture and system design',
        'Team management and mentoring'
      ],
      experienceHighlights: [
        '8 years full-stack development',
        '3 years team lead experience',
        'Multiple successful product launches'
      ]
    },
    competencies: {
      technical: [{
        competencyId: 'js',
        competencyName: 'JavaScript/TypeScript',
        level: 'expert',
        evidence: [],
        demonstrationExamples: [
          'Built complex React applications',
          'Developed Node.js microservices',
          'Implemented TypeScript type systems'
        ],
        skillProgression: [],
        certifications: ['AWS Certified Developer']
      }],
      communication: [{
        competencyId: 'presentation',
        competencyName: 'Technical Presentation',
        level: 'advanced',
        evidence: [],
        demonstrationExamples: [
          'Presented at 5 technical conferences',
          'Led architecture review sessions',
          'Conducted client demos'
        ],
        skillProgression: [],
        certifications: []
      }],
      customerService: [],
      professional: []
    },
    achievements: [{
      id: 'achievement1',
      title: 'Performance Optimization Champion',
      description: 'Reduced application load time by 40% through systematic optimization',
      category: 'technical',
      level: 'significant',
      earnedDate: new Date('2023-06-15'),
      evidence: ['Performance metrics', 'Code review comments'],
      impact: 'Improved user experience for 10,000+ daily users'
    }],
    performanceMetrics: {
      overallScore: 92,
      categoryScores: {
        technical: 95,
        communication: 88,
        customerService: 85,
        problemSolving: 94,
        teamwork: 90
      },
      totalScenarios: 147,
      averageCompletionTime: 12.5,
      successRate: 0.94,
      improvementTrend: 'upward',
      lastUpdated: new Date('2024-01-15')
    },
    skillProgression: [{
      skill: 'JavaScript',
      progression: [
        { level: 'intermediate', achievedDate: new Date('2022-01-01'), evidence: [] },
        { level: 'advanced', achievedDate: new Date('2023-01-01'), evidence: [] },
        { level: 'expert', achievedDate: new Date('2024-01-01'), evidence: [] }
      ],
      currentLevel: 'expert',
      nextMilestone: 'Architectural expertise',
      timeToNextLevel: 6
    }],
    testimonials: [{
      id: 'testimonial1',
      author: 'Sarah Johnson',
      authorTitle: 'Engineering Manager',
      company: 'TechCorp',
      content: 'John consistently delivers high-quality solutions and demonstrates excellent technical leadership.',
      date: new Date('2023-12-01'),
      relationship: 'supervisor',
      verified: true
    }],
    certifications: [{
      id: 'cert1',
      name: 'AWS Certified Solutions Architect',
      provider: 'Amazon Web Services',
      issueDate: new Date('2023-05-15'),
      expiryDate: new Date('2026-05-15'),
      credentialId: 'AWS-CSA-12345',
      verificationUrl: 'https://aws.amazon.com/verification/12345',
      status: 'active'
    }],
    projectHighlights: [{
      id: 'project1',
      title: 'E-commerce Platform Modernization',
      description: 'Led full-stack modernization of legacy e-commerce system',
      role: 'Technical Lead',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
      duration: '6 months',
      impact: 'Increased conversion rate by 25%, reduced maintenance costs by 50%',
      achievements: ['Zero-downtime migration', 'Performance optimization', 'Team mentoring']
    }],
    professionalEvidence: [{
      id: 'evidence1',
      type: 'project_completion',
      title: 'Microservices Architecture Implementation',
      description: 'Successfully designed and implemented microservices architecture',
      competencies: ['System Design', 'Technical Leadership'],
      evidence: ['Architecture documentation', 'Performance metrics'],
      verificationStatus: 'verified',
      date: new Date('2023-08-30')
    }]
  };

  const baseBrandingOptions: BrandingOptions = {
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#f59e0b'
    },
    fonts: {
      header: 'Inter',
      body: 'Inter'
    },
    personalBranding: {
      tagline: 'Building the future, one line of code at a time',
      personalStatement: 'Passionate about creating innovative solutions that make a difference'
    }
  };

  const baseLayoutOptions: LayoutOptions = {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    },
    sections: {
      header: true,
      footer: true
    }
  };

  beforeEach(() => {
    exportEngine = new ExportEngine();
  });

  describe('exportPortfolio', () => {
    describe('PDF Export', () => {
      const pdfConfig: ExportConfiguration = {
        format: 'pdf',
        template: 'professional',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer'
      };

      it('should export portfolio as PDF successfully', async () => {
        const result = await exportEngine.exportPortfolio(mockPortfolio, pdfConfig);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle different PDF templates', async () => {
        const creativeConfig = {
          ...pdfConfig,
          template: 'creative'
        };

        const result = await exportEngine.exportPortfolio(mockPortfolio, creativeConfig);
        expect(result).toBeInstanceOf(Buffer);
      });

      it('should apply custom branding to PDF', async () => {
        const customBrandingConfig = {
          ...pdfConfig,
          customization: {
            ...pdfConfig.customization,
            branding: {
              ...baseBrandingOptions,
              logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
              colors: {
                primary: '#dc2626',
                secondary: '#374151',
                accent: '#059669'
              }
            }
          }
        };

        const result = await exportEngine.exportPortfolio(mockPortfolio, customBrandingConfig);
        expect(result).toBeInstanceOf(Buffer);
      });

      it('should handle different page orientations', async () => {
        const landscapeConfig = {
          ...pdfConfig,
          customization: {
            ...pdfConfig.customization,
            layout: {
              ...baseLayoutOptions,
              orientation: 'landscape' as const
            }
          }
        };

        const result = await exportEngine.exportPortfolio(mockPortfolio, landscapeConfig);
        expect(result).toBeInstanceOf(Buffer);
      });

      it('should filter content based on configuration', async () => {
        const limitedContentConfig = {
          ...pdfConfig,
          content: {
            summary: true,
            competencies: true,
            achievements: false,
            performance: false,
            history: false
          }
        };

        const result = await exportEngine.exportPortfolio(mockPortfolio, limitedContentConfig);
        expect(result).toBeInstanceOf(Buffer);
      });
    });

    describe('Word Export', () => {
      const wordConfig: ExportConfiguration = {
        format: 'word',
        template: 'professional',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: false
        },
        customization: {
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer'
      };

      it('should export portfolio as Word document', async () => {
        const result = await exportEngine.exportPortfolio(mockPortfolio, wordConfig);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle academic template for Word export', async () => {
        const academicConfig = {
          ...wordConfig,
          template: 'academic',
          recipient: 'academic' as const
        };

        const result = await exportEngine.exportPortfolio(mockPortfolio, academicConfig);
        expect(result).toBeInstanceOf(Buffer);
      });

      it('should apply custom styling to Word document', async () => {
        const styledConfig = {
          ...wordConfig,
          customization: {
            ...wordConfig.customization,
            branding: {
              ...baseBrandingOptions,
              fonts: {
                header: 'Calibri',
                body: 'Times New Roman'
              }
            }
          }
        };

        const result = await exportEngine.exportPortfolio(mockPortfolio, styledConfig);
        expect(result).toBeInstanceOf(Buffer);
      });
    });

    describe('JSON Export', () => {
      const jsonConfig: ExportConfiguration = {
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
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'personal'
      };

      it('should export portfolio as JSON', async () => {
        const result = await exportEngine.exportPortfolio(mockPortfolio, jsonConfig);

        expect(result).toBeInstanceOf(Buffer);
        
        const jsonString = result.toString('utf-8');
        const parsedData = JSON.parse(jsonString);
        
        expect(parsedData).toHaveProperty('header');
        expect(parsedData).toHaveProperty('executiveSummary');
        expect(parsedData).toHaveProperty('competencies');
        expect(parsedData.header.name).toBe('John Doe');
      });

      it('should include metadata in JSON export', async () => {
        const result = await exportEngine.exportPortfolio(mockPortfolio, jsonConfig);
        const jsonString = result.toString('utf-8');
        const parsedData = JSON.parse(jsonString);

        expect(parsedData).toHaveProperty('exportMetadata');
        expect(parsedData.exportMetadata).toEqual(expect.objectContaining({
          format: 'json',
          template: 'structured',
          exportDate: expect.any(String),
          recipient: 'personal'
        }));
      });

      it('should structure competencies properly in JSON', async () => {
        const result = await exportEngine.exportPortfolio(mockPortfolio, jsonConfig);
        const jsonString = result.toString('utf-8');
        const parsedData = JSON.parse(jsonString);

        expect(parsedData.competencies.technical).toHaveLength(1);
        expect(parsedData.competencies.technical[0]).toEqual(expect.objectContaining({
          competencyName: 'JavaScript/TypeScript',
          level: 'expert'
        }));
      });
    });

    describe('HTML Export', () => {
      const htmlConfig: ExportConfiguration = {
        format: 'html',
        template: 'modern',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: false
        },
        customization: {
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer'
      };

      it('should export portfolio as HTML', async () => {
        const result = await exportEngine.exportPortfolio(mockPortfolio, htmlConfig);

        expect(result).toBeInstanceOf(Buffer);
        
        const htmlString = result.toString('utf-8');
        expect(htmlString).toContain('<!DOCTYPE html>');
        expect(htmlString).toContain('<html');
        expect(htmlString).toContain('John Doe');
        expect(htmlString).toContain('Senior Software Developer');
      });

      it('should include CSS styling in HTML export', async () => {
        const result = await exportEngine.exportPortfolio(mockPortfolio, htmlConfig);
        const htmlString = result.toString('utf-8');

        expect(htmlString).toContain('<style>');
        expect(htmlString).toContain('css');
        expect(htmlString).toMatch(/#[0-9a-fA-F]{6}/); // Should contain hex colors
      });

      it('should be responsive HTML', async () => {
        const result = await exportEngine.exportPortfolio(mockPortfolio, htmlConfig);
        const htmlString = result.toString('utf-8');

        expect(htmlString).toContain('viewport');
        expect(htmlString).toContain('responsive');
      });

      it('should handle creative template for HTML', async () => {
        const creativeConfig = {
          ...htmlConfig,
          template: 'creative'
        };

        const result = await exportEngine.exportPortfolio(mockPortfolio, creativeConfig);
        const htmlString = result.toString('utf-8');
        
        expect(htmlString).toContain('<!DOCTYPE html>');
        expect(htmlString).toContain('John Doe');
      });
    });

    describe('PowerPoint Export', () => {
      const pptConfig: ExportConfiguration = {
        format: 'powerpoint',
        template: 'presentation',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: false
        },
        customization: {
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer'
      };

      it('should export portfolio as PowerPoint', async () => {
        const result = await exportEngine.exportPortfolio(mockPortfolio, pptConfig);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle executive template for PowerPoint', async () => {
        const executiveConfig = {
          ...pptConfig,
          template: 'executive'
        };

        const result = await exportEngine.exportPortfolio(mockPortfolio, executiveConfig);
        expect(result).toBeInstanceOf(Buffer);
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid export format', async () => {
      const invalidConfig = {
        format: 'invalid' as any,
        template: 'professional',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer' as const
      };

      await expect(exportEngine.exportPortfolio(mockPortfolio, invalidConfig))
        .rejects.toThrow('Unsupported export format');
    });

    it('should handle missing template', async () => {
      const configWithMissingTemplate = {
        format: 'pdf' as const,
        template: 'nonexistent',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer' as const
      };

      await expect(exportEngine.exportPortfolio(mockPortfolio, configWithMissingTemplate))
        .rejects.toThrow('Template not found');
    });

    it('should handle invalid color values in branding', async () => {
      const invalidBrandingConfig: ExportConfiguration = {
        format: 'pdf',
        template: 'professional',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: {
            ...baseBrandingOptions,
            colors: {
              primary: 'invalid-color',
              secondary: '#invalid',
              accent: 'rgb(300, 300, 300)' // Invalid RGB values
            }
          },
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer'
      };

      await expect(exportEngine.exportPortfolio(mockPortfolio, invalidBrandingConfig))
        .rejects.toThrow('Invalid color configuration');
    });
  });

  describe('privacy filtering', () => {
    it('should filter sensitive information based on recipient', async () => {
      const portfolioWithSensitiveData = {
        ...mockPortfolio,
        header: {
          ...mockPortfolio.header,
          contact: {
            ...mockPortfolio.header.contact,
            phone: '+1-555-PRIVATE',
            address: {
              city: 'San Francisco',
              state: 'CA',
              country: 'USA'
            }
          }
        }
      };

      const publicConfig: ExportConfiguration = {
        format: 'html',
        template: 'public',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: false,
          history: false
        },
        customization: {
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {
            hideContactInfo: true,
            hidePerformanceData: true,
            showOnlyVerifiedEvidence: true
          }
        },
        recipient: 'public'
      };

      const result = await exportEngine.exportPortfolio(portfolioWithSensitiveData, publicConfig);
      const htmlString = result.toString('utf-8');

      expect(htmlString).not.toContain('+1-555-PRIVATE');
    });

    it('should include all data for personal export', async () => {
      const personalConfig: ExportConfiguration = {
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
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {
            hideContactInfo: false,
            hidePerformanceData: false,
            showOnlyVerifiedEvidence: false
          }
        },
        recipient: 'personal'
      };

      const result = await exportEngine.exportPortfolio(mockPortfolio, personalConfig);
      const jsonString = result.toString('utf-8');
      const parsedData = JSON.parse(jsonString);

      expect(parsedData.header.contact.phone).toBe('+1-555-0123');
      expect(parsedData.performanceMetrics).toBeDefined();
    });
  });

  describe('template customization', () => {
    it('should apply different layouts for different recipients', async () => {
      const employerConfig: ExportConfiguration = {
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
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer'
      };

      const academicConfig: ExportConfiguration = {
        ...employerConfig,
        template: 'academic',
        recipient: 'academic'
      };

      const employerResult = await exportEngine.exportPortfolio(mockPortfolio, employerConfig);
      const academicResult = await exportEngine.exportPortfolio(mockPortfolio, academicConfig);

      expect(employerResult).toBeInstanceOf(Buffer);
      expect(academicResult).toBeInstanceOf(Buffer);
      expect(employerResult.length).not.toBe(academicResult.length);
    });

    it('should handle custom page sizes', async () => {
      const letterConfig: ExportConfiguration = {
        format: 'pdf',
        template: 'professional',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: baseBrandingOptions,
          layout: {
            ...baseLayoutOptions,
            pageSize: 'Letter'
          },
          privacy: {}
        },
        recipient: 'employer'
      };

      const result = await exportEngine.exportPortfolio(mockPortfolio, letterConfig);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('performance and optimization', () => {
    it('should handle large portfolios efficiently', async () => {
      const largePortfolio = {
        ...mockPortfolio,
        achievements: Array.from({ length: 100 }, (_, i) => ({
          ...mockPortfolio.achievements[0],
          id: `achievement${i}`,
          title: `Achievement ${i}`
        })),
        competencies: {
          ...mockPortfolio.competencies,
          technical: Array.from({ length: 50 }, (_, i) => ({
            ...mockPortfolio.competencies.technical[0],
            competencyId: `skill${i}`,
            competencyName: `Skill ${i}`
          }))
        }
      };

      const config: ExportConfiguration = {
        format: 'pdf',
        template: 'professional',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer'
      };

      const startTime = Date.now();
      const result = await exportEngine.exportPortfolio(largePortfolio, config);
      const endTime = Date.now();

      expect(result).toBeInstanceOf(Buffer);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent export requests', async () => {
      const config: ExportConfiguration = {
        format: 'pdf',
        template: 'professional',
        content: {
          summary: true,
          competencies: true,
          achievements: true,
          performance: true,
          history: true
        },
        customization: {
          branding: baseBrandingOptions,
          layout: baseLayoutOptions,
          privacy: {}
        },
        recipient: 'employer'
      };

      const promises = Array.from({ length: 5 }, () =>
        exportEngine.exportPortfolio(mockPortfolio, config)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});