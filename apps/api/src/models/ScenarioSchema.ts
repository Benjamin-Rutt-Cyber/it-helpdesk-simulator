import { z } from 'zod';

// Scenario schema definition for validation
export const ScenarioSchema = z.object({
  scenario: z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().min(10).max(1000),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning (x.y.z)'),
    difficulty: z.enum(['starter', 'intermediate', 'advanced']),
    estimatedTime: z.number().min(5).max(180), // 5 minutes to 3 hours
    xpReward: z.number().min(10).max(1000),
    prerequisites: z.array(z.string().uuid()).default([]),
    tags: z.array(z.string()).default([]),
    
    ticketTemplate: z.object({
      priority: z.enum(['low', 'medium', 'high']),
      category: z.string().min(1),
      title: z.string().min(1).max(200),
      description: z.string().min(10),
      customerInfo: z.object({
        name: z.string().min(1),
        department: z.string().min(1),
        role: z.string().min(1),
        contactInfo: z.object({
          email: z.string().email(),
          phone: z.string().optional(),
          location: z.string().optional(),
        }),
        assetTag: z.string().min(1),
      }),
      technicalContext: z.object({
        systemSpecs: z.object({
          os: z.string(),
          hardware: z.string(),
          software: z.array(z.string()).default([]),
        }),
        errorMessages: z.array(z.string()).default([]),
        environment: z.object({
          network: z.string().optional(),
          domain: z.string().optional(),
          securityContext: z.string().optional(),
        }),
        symptoms: z.array(z.string()).default([]),
      }),
    }),
    
    customerPersona: z.object({
      name: z.string().min(1),
      personalityTraits: z.object({
        patience: z.number().min(1).max(10),
        technicalKnowledge: z.number().min(1).max(10),
        communicationStyle: z.enum(['formal', 'casual', 'technical', 'frustrated']),
        helpfulness: z.number().min(1).max(10),
      }),
      technicalLevel: z.enum(['novice', 'intermediate', 'advanced']),
      communicationStyle: z.object({
        responseLength: z.enum(['brief', 'detailed', 'verbose']),
        formality: z.enum(['casual', 'professional', 'very_formal']),
        emotionalState: z.enum(['calm', 'stressed', 'frustrated', 'urgent']),
      }),
      behaviorPatterns: z.object({
        followsInstructions: z.boolean(),
        providesDetails: z.boolean(),
        asksClarifyingQuestions: z.boolean(),
        becomesImpatient: z.boolean(),
      }),
    }),
    
    knowledgeBaseEntries: z.array(z.object({
      title: z.string().min(1),
      content: z.string().min(10),
      credibility: z.number().min(0).max(1), // 0-1 scale
      relevance: z.number().min(0).max(1),   // 0-1 scale
      category: z.string().min(1),
      tags: z.array(z.string()).default([]),
    })),
    
    assessmentCriteria: z.object({
      technical: z.object({
        diagnosticAccuracy: z.number().min(0).max(100),
        solutionEffectiveness: z.number().min(0).max(100),
        troubleshootingMethodology: z.number().min(0).max(100),
      }),
      communication: z.object({
        clarity: z.number().min(0).max(100),
        empathy: z.number().min(0).max(100),
        professionalism: z.number().min(0).max(100),
      }),
      procedure: z.object({
        followsProtocol: z.number().min(0).max(100),
        documentation: z.number().min(0).max(100),
        timeManagement: z.number().min(0).max(100),
      }),
      timeManagement: z.object({
        responseTime: z.number().min(0).max(100),
        resolutionTime: z.number().min(0).max(100),
        efficiency: z.number().min(0).max(100),
      }),
    }),
    
    successCriteria: z.array(z.object({
      description: z.string().min(1),
      weight: z.number().min(0).max(1), // Weight in overall score
      validation: z.enum(['automatic', 'manual', 'ai_assisted']),
      condition: z.string().min(1), // Condition for success
    })),
    
    // Metadata
    metadata: z.object({
      author: z.string().min(1),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      reviewStatus: z.enum(['draft', 'review', 'approved', 'deprecated']),
      reviewNotes: z.string().optional(),
      analytics: z.object({
        usageCount: z.number().default(0),
        averageCompletionTime: z.number().optional(),
        successRate: z.number().optional(),
        averageScore: z.number().optional(),
      }).optional(),
    }),
  }),
});

export type ScenarioDefinition = z.infer<typeof ScenarioSchema>;

// Scenario file metadata
export const ScenarioFileSchema = z.object({
  filePath: z.string(),
  fileName: z.string(),
  lastModified: z.string().datetime(),
  checksum: z.string(),
  format: z.enum(['json', 'yaml']),
  scenario: ScenarioSchema.shape.scenario,
});

export type ScenarioFile = z.infer<typeof ScenarioFileSchema>;

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  filePath?: string;
}

// Scenario import/export formats
export const ScenarioExportSchema = z.object({
  scenarios: z.array(ScenarioSchema.shape.scenario),
  exportedAt: z.string().datetime(),
  version: z.string(),
  metadata: z.object({
    totalCount: z.number(),
    difficulties: z.record(z.number()),
    averageEstimatedTime: z.number(),
  }),
});

export type ScenarioExport = z.infer<typeof ScenarioExportSchema>;