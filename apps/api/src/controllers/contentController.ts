import { Request, Response } from 'express';
import { z } from 'zod';
import { ContentService } from '../services/contentService';
import { CredibilityService } from '../services/credibilityService';
import { ContentQuerySchema, ContentItemSchema } from '../models/ContentItem';
import { asyncHandler } from '../middleware/asyncHandler';

export class ContentController {
  private contentService: ContentService;
  private credibilityService: CredibilityService;

  constructor() {
    this.contentService = new ContentService();
    this.credibilityService = new CredibilityService();
  }

  /**
   * Search content based on query and filters
   * GET /api/v1/content/search
   */
  searchContent = asyncHandler(async (req: Request, res: Response) => {
    const query = ContentQuerySchema.parse({
      query: req.query.q as string,
      filters: {
        category: req.query.category as any,
        subcategory: req.query.subcategory as string,
        credibilityLevel: req.query.credibilityLevel as any,
        sourceType: req.query.sourceType as any,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        scenarioId: req.query.scenarioId as string,
        isRedHerring: req.query.isRedHerring ? req.query.isRedHerring === 'true' : undefined,
        difficulty: req.query.difficulty as any,
        language: req.query.language as string,
        dateRange: req.query.startDate || req.query.endDate ? {
          start: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          end: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        } : undefined,
      },
      sortBy: (req.query.sortBy as any) || 'relevance',
      sortOrder: (req.query.sortOrder as any) || 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      includeRedHerrings: req.query.includeRedHerrings !== 'false',
      scenarioContext: req.query.scenarioContext as string,
    });

    const results = await this.contentService.searchContent(query);

    res.json({
      success: true,
      data: {
        query: query.query || '',
        results: results.items,
        totalResults: results.totalCount,
        searchTime: results.searchTime,
        pagination: {
          currentPage: query.page,
          totalPages: Math.ceil(results.totalCount / query.limit),
          hasNext: query.page * query.limit < results.totalCount,
          hasPrevious: query.page > 1,
        },
        facets: results.facets,
        filters: {
          applied: query.filters,
          available: results.facets,
        },
      },
    });
  });

  /**
   * Get content by ID
   * GET /api/v1/content/:id
   */
  getContentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required',
      });
    }

    const content = await this.contentService.getContentById(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    res.json({
      success: true,
      data: content,
    });
  });

  /**
   * Get content by scenario
   * GET /api/v1/content/scenario/:scenarioId
   */
  getContentByScenario = asyncHandler(async (req: Request, res: Response) => {
    const { scenarioId } = req.params;
    const includeRedHerrings = req.query.includeRedHerrings !== 'false';

    if (!scenarioId) {
      return res.status(400).json({
        success: false,
        error: 'Scenario ID is required',
      });
    }

    const content = await this.contentService.getContentByScenario(scenarioId, includeRedHerrings);

    res.json({
      success: true,
      data: {
        scenarioId,
        contentCount: content.length,
        content,
        includeRedHerrings,
      },
    });
  });

  /**
   * Create new content
   * POST /api/v1/content
   */
  createContent = asyncHandler(async (req: Request, res: Response) => {
    const contentData = ContentItemSchema.parse(req.body);
    const newContent = await this.contentService.createContent(contentData);

    res.status(201).json({
      success: true,
      data: newContent,
      message: 'Content created successfully',
    });
  });

  /**
   * Update existing content
   * PUT /api/v1/content/:id
   */
  updateContent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required',
      });
    }

    const updatedContent = await this.contentService.updateContent(id, updates);

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    res.json({
      success: true,
      data: updatedContent,
      message: 'Content updated successfully',
    });
  });

  /**
   * Delete content
   * DELETE /api/v1/content/:id
   */
  deleteContent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required',
      });
    }

    const deleted = await this.contentService.deleteContent(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  });

  /**
   * Assess content credibility
   * POST /api/v1/content/:id/credibility
   */
  assessCredibility = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required',
      });
    }

    const content = await this.contentService.getContentById(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    const assessment = await this.credibilityService.assessCredibility(content);

    res.json({
      success: true,
      data: assessment,
    });
  });

  /**
   * Get credibility statistics
   * GET /api/v1/content/credibility/stats
   */
  getCredibilityStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.credibilityService.getCredibilityStats();

    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * Get credibility explanation
   * GET /api/v1/content/credibility/explain/:level
   */
  explainCredibilityLevel = asyncHandler(async (req: Request, res: Response) => {
    const { level } = req.params;

    const validLevels = ['official', 'community', 'questionable', 'unknown'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credibility level',
        validLevels,
      });
    }

    const explanation = await this.credibilityService.getCredibilityExplanation(level as any);

    res.json({
      success: true,
      data: {
        level,
        explanation,
      },
    });
  });

  /**
   * Get content categories
   * GET /api/v1/content/categories
   */
  getContentCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = [
      {
        value: 'hardware-support',
        label: 'Hardware Support',
        subcategories: [
          { value: 'desktop-issues', label: 'Desktop/Laptop Issues' },
          { value: 'peripheral-devices', label: 'Peripheral Devices' },
          { value: 'network-hardware', label: 'Network Hardware' },
          { value: 'server-hardware', label: 'Server Hardware' },
          { value: 'mobile-devices', label: 'Mobile Devices' },
        ],
      },
      {
        value: 'software-support',
        label: 'Software Support',
        subcategories: [
          { value: 'operating-systems', label: 'Operating Systems' },
          { value: 'applications', label: 'Applications' },
          { value: 'security-software', label: 'Security Software' },
          { value: 'productivity-tools', label: 'Productivity Tools' },
          { value: 'custom-applications', label: 'Custom Applications' },
        ],
      },
      {
        value: 'network-connectivity',
        label: 'Network & Connectivity',
        subcategories: [
          { value: 'internet-connectivity', label: 'Internet Connectivity' },
          { value: 'vpn-issues', label: 'VPN Issues' },
          { value: 'email-problems', label: 'Email Problems' },
          { value: 'file-sharing', label: 'File Sharing' },
          { value: 'wireless-issues', label: 'Wireless Issues' },
        ],
      },
      {
        value: 'security-compliance',
        label: 'Security & Compliance',
        subcategories: [
          { value: 'password-issues', label: 'Password Issues' },
          { value: 'security-incidents', label: 'Security Incidents' },
          { value: 'access-control', label: 'Access Control' },
          { value: 'compliance', label: 'Compliance' },
          { value: 'backup-recovery', label: 'Backup & Recovery' },
        ],
      },
      {
        value: 'general-troubleshooting',
        label: 'General Troubleshooting',
        subcategories: [
          { value: 'performance-issues', label: 'Performance Issues' },
          { value: 'error-messages', label: 'Error Messages' },
          { value: 'system-maintenance', label: 'System Maintenance' },
          { value: 'user-training', label: 'User Training' },
          { value: 'documentation', label: 'Documentation' },
        ],
      },
    ];

    res.json({
      success: true,
      data: categories,
    });
  });

  /**
   * Get content filters
   * GET /api/v1/content/filters
   */
  getContentFilters = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      categories: [
        { value: 'hardware-support', label: 'Hardware Support' },
        { value: 'software-support', label: 'Software Support' },
        { value: 'network-connectivity', label: 'Network & Connectivity' },
        { value: 'security-compliance', label: 'Security & Compliance' },
        { value: 'general-troubleshooting', label: 'General Troubleshooting' },
      ],
      credibilityLevels: [
        { value: 'official', label: 'Official Documentation' },
        { value: 'community', label: 'Community Sources' },
        { value: 'questionable', label: 'Questionable Sources' },
        { value: 'unknown', label: 'Unknown Sources' },
      ],
      sourceTypes: [
        { value: 'official-documentation', label: 'Official Documentation' },
        { value: 'vendor-documentation', label: 'Vendor Documentation' },
        { value: 'knowledge-base', label: 'Knowledge Base' },
        { value: 'community-forum', label: 'Community Forum' },
        { value: 'technical-blog', label: 'Technical Blog' },
        { value: 'social-media', label: 'Social Media' },
        { value: 'personal-blog', label: 'Personal Blog' },
        { value: 'suspicious-website', label: 'Suspicious Website' },
        { value: 'outdated-resource', label: 'Outdated Resource' },
      ],
      difficulties: [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ],
      languages: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'it', label: 'Italian' },
      ],
    };

    res.json({
      success: true,
      data: filters,
    });
  });

  /**
   * Get content analytics
   * GET /api/v1/content/analytics
   */
  getContentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    // Mock analytics data - would normally come from database
    const analytics = {
      totalContent: 1247,
      totalViews: 45678,
      totalClicks: 12345,
      averageCredibilityScore: 67.3,
      contentByCategory: [
        { category: 'network-connectivity', count: 423, percentage: 33.9 },
        { category: 'software-support', count: 356, percentage: 28.5 },
        { category: 'hardware-support', count: 289, percentage: 23.2 },
        { category: 'security-compliance', count: 123, percentage: 9.9 },
        { category: 'general-troubleshooting', count: 56, percentage: 4.5 },
      ],
      credibilityDistribution: [
        { level: 'official', count: 287, percentage: 23.0 },
        { level: 'community', count: 561, percentage: 45.0 },
        { level: 'questionable', count: 349, percentage: 28.0 },
        { level: 'unknown', count: 50, percentage: 4.0 },
      ],
      topSearchTerms: [
        { term: 'email not working', searches: 1234 },
        { term: 'printer setup', searches: 987 },
        { term: 'vpn connection', searches: 756 },
        { term: 'password reset', searches: 654 },
        { term: 'wifi troubleshooting', searches: 543 },
      ],
      redHerringStats: {
        totalRedHerrings: 89,
        detectionRate: 94.2, // percentage of users who identify red herrings
        averageTimeToDetect: 45, // seconds
        commonTypes: [
          { type: 'outdated', count: 34 },
          { type: 'incorrect', count: 23 },
          { type: 'misleading', count: 18 },
          { type: 'irrelevant', count: 9 },
          { type: 'overly-complex', count: 5 },
        ],
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  });
}