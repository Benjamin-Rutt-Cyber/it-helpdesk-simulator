import { z } from 'zod';

export const CredibilityLevel = z.enum(['official', 'community', 'questionable', 'unknown']);
export type CredibilityLevel = z.infer<typeof CredibilityLevel>;

export const ContentCategory = z.enum([
  'hardware-support',
  'software-support', 
  'network-connectivity',
  'security-compliance',
  'general-troubleshooting'
]);
export type ContentCategory = z.infer<typeof ContentCategory>;

export const SourceType = z.enum([
  'official-documentation',
  'vendor-documentation',
  'knowledge-base',
  'community-forum',
  'technical-blog',
  'social-media',
  'personal-blog',
  'suspicious-website',
  'outdated-resource'
]);
export type SourceType = z.infer<typeof SourceType>;

export const ContentItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  snippet: z.string().max(300).optional(),
  url: z.string().url(),
  
  // Categorization
  category: ContentCategory,
  subcategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Source information
  source: z.object({
    name: z.string(),
    domain: z.string(),
    type: SourceType,
    baseUrl: z.string().url().optional(),
  }),
  
  // Credibility assessment
  credibility: z.object({
    level: CredibilityLevel,
    score: z.number().min(0).max(100),
    indicators: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
    lastAssessed: z.date().optional(),
  }),
  
  // Metadata
  metadata: z.object({
    author: z.string().optional(),
    publishDate: z.date().optional(),
    lastModified: z.date().optional(),
    language: z.string().default('en'),
    wordCount: z.number().min(0).optional(),
    readingTime: z.number().min(0).optional(), // in minutes
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  }),
  
  // Educational features
  educational: z.object({
    isRedHerring: z.boolean().default(false),
    redHerringType: z.enum(['outdated', 'incorrect', 'misleading', 'irrelevant', 'overly-complex']).optional(),
    learningObjectives: z.array(z.string()).default([]),
    prerequisiteKnowledge: z.array(z.string()).default([]),
    skillLevel: z.enum(['entry', 'intermediate', 'advanced']).default('intermediate'),
  }),
  
  // Scenario associations
  scenarios: z.object({
    relevantTo: z.array(z.string()).default([]), // scenario IDs
    priority: z.number().min(0).max(10).default(5), // relevance priority
    contextKeywords: z.array(z.string()).default([]),
    appearanceWeight: z.number().min(0).max(1).default(0.5), // probability of appearing in search
  }),
  
  // System fields
  system: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
    version: z.number().min(1).default(1),
    status: z.enum(['draft', 'review', 'approved', 'archived']).default('draft'),
    reviewNotes: z.string().optional(),
  }),
});

export type ContentItem = z.infer<typeof ContentItemSchema>;

// Content search filters
export const ContentFiltersSchema = z.object({
  category: ContentCategory.optional(),
  subcategory: z.string().optional(),
  credibilityLevel: CredibilityLevel.optional(),
  sourceType: SourceType.optional(),
  tags: z.array(z.string()).optional(),
  scenarioId: z.string().optional(),
  isRedHerring: z.boolean().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  language: z.string().optional(),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
});

export type ContentFilters = z.infer<typeof ContentFiltersSchema>;

// Content query for search
export const ContentQuerySchema = z.object({
  query: z.string().optional(),
  filters: ContentFiltersSchema.optional(),
  sortBy: z.enum(['relevance', 'date', 'credibility', 'title']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  includeRedHerrings: z.boolean().default(true),
  scenarioContext: z.string().optional(), // current scenario ID for contextual weighting
});

export type ContentQuery = z.infer<typeof ContentQuerySchema>;

// Credibility assessment result
export const CredibilityAssessmentSchema = z.object({
  contentId: z.string().uuid(),
  level: CredibilityLevel,
  score: z.number().min(0).max(100),
  indicators: z.array(z.object({
    type: z.enum(['positive', 'negative', 'neutral']),
    message: z.string(),
    weight: z.number().min(0).max(10),
  })),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  assessedAt: z.date(),
  assessedBy: z.string().optional(),
  methodology: z.string().optional(),
});

export type CredibilityAssessment = z.infer<typeof CredibilityAssessmentSchema>;

// Content analytics data
export const ContentAnalyticsSchema = z.object({
  contentId: z.string().uuid(),
  metrics: z.object({
    views: z.number().min(0).default(0),
    clicks: z.number().min(0).default(0),
    searches: z.number().min(0).default(0),
    bookmarks: z.number().min(0).default(0),
    shares: z.number().min(0).default(0),
    averageReadTime: z.number().min(0).optional(), // in seconds
    clickThroughRate: z.number().min(0).max(1).optional(),
    bounceRate: z.number().min(0).max(1).optional(),
  }),
  effectiveness: z.object({
    helpfulnessScore: z.number().min(0).max(5).optional(),
    accuracyScore: z.number().min(0).max(5).optional(),
    clarityScore: z.number().min(0).max(5).optional(),
    completenessScore: z.number().min(0).max(5).optional(),
    userFeedback: z.array(z.string()).default([]),
  }),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  lastUpdated: z.date(),
});

export type ContentAnalytics = z.infer<typeof ContentAnalyticsSchema>;

// Content validation result
export const ContentValidationSchema = z.object({
  contentId: z.string().uuid(),
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
  })).default([]),
  warnings: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  qualityScore: z.number().min(0).max(100).optional(),
  validatedAt: z.date(),
  validatedBy: z.string().optional(),
});

export type ContentValidation = z.infer<typeof ContentValidationSchema>;

// Default credibility indicators by source type
export const defaultCredibilityIndicators: Record<SourceType, { indicators: string[], warnings: string[], score: number }> = {
  'official-documentation': {
    indicators: ['Official vendor documentation', 'Regularly updated', 'Comprehensive coverage'],
    warnings: [],
    score: 95
  },
  'vendor-documentation': {
    indicators: ['Vendor-verified content', 'Product-specific information', 'Technical accuracy'],
    warnings: ['May contain vendor bias'],
    score: 85
  },
  'knowledge-base': {
    indicators: ['Curated content', 'Expert reviewed', 'Structured information'],
    warnings: [],
    score: 80
  },
  'community-forum': {
    indicators: ['Community-verified', 'Multiple perspectives', 'Practical experience'],
    warnings: ['User-generated content', 'May require verification'],
    score: 60
  },
  'technical-blog': {
    indicators: ['Expert insights', 'Detailed explanations', 'Real-world examples'],
    warnings: ['Individual perspective', 'May be outdated'],
    score: 55
  },
  'social-media': {
    indicators: ['Recent discussions', 'Community engagement'],
    warnings: ['Unverified information', 'Limited detail', 'Potential misinformation'],
    score: 30
  },
  'personal-blog': {
    indicators: ['Personal experience', 'Detailed examples'],
    warnings: ['Individual perspective', 'Limited verification', 'May be biased'],
    score: 40
  },
  'suspicious-website': {
    indicators: [],
    warnings: ['Questionable source', 'Potential misinformation', 'Limited credibility'],
    score: 15
  },
  'outdated-resource': {
    indicators: ['Historical reference'],
    warnings: ['Outdated information', 'May no longer be applicable', 'Check for updates'],
    score: 25
  }
};