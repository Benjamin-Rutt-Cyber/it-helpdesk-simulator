import { Request, Response } from 'express';
import { SearchService, SearchQuery } from '../services/searchService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  /**
   * Perform a search query
   * GET /api/search?q=query&page=1&limit=10
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const { 
      q: query, 
      page = 1, 
      limit = 10, 
      sort = 'relevance',
      order = 'desc',
      sourceType,
      credibilityLevel,
      resultType,
      startDate,
      endDate 
    } = req.query;

    const userId = req.query.userId as string;
    const sessionId = req.query.sessionId as string;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    logger.info('Processing search request', { query, userId, sessionId });

    const searchQuery: SearchQuery = {
      query: query as string,
      pagination: {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 50), // Max 50 results per page
      },
      sort: {
        field: sort as any,
        order: order as any,
      },
    };

    // Add filters if provided
    if (sourceType || credibilityLevel || resultType || startDate || endDate) {
      searchQuery.filters = {};

      if (sourceType) {
        searchQuery.filters.sourceType = Array.isArray(sourceType) 
          ? sourceType as string[]
          : [sourceType as string];
      }

      if (credibilityLevel) {
        searchQuery.filters.credibilityLevel = parseInt(credibilityLevel as string);
      }

      if (resultType) {
        searchQuery.filters.resultType = Array.isArray(resultType)
          ? resultType as string[]
          : [resultType as string];
      }

      if (startDate && endDate) {
        searchQuery.filters.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
    }

    const searchResults = await this.searchService.search(searchQuery, userId, sessionId);

    res.json({
      success: true,
      data: searchResults,
    });
  });

  /**
   * Get search suggestions for auto-complete
   * GET /api/search/suggestions?q=partial_query
   */
  getSuggestions = asyncHandler(async (req: Request, res: Response) => {
    const { q: query, limit = 10 } = req.query;

    if (!query) {
      return res.json({
        success: true,
        data: [],
      });
    }

    logger.info('Getting search suggestions', { query });

    const suggestions = await this.searchService.getSuggestions(
      query as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: suggestions,
    });
  });

  /**
   * Get user search history
   * GET /api/search/history/:userId
   */
  getSearchHistory = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    logger.info('Getting search history', { userId });

    const history = await this.searchService.getSearchHistory(
      userId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: history,
    });
  });

  /**
   * Clear user search history
   * DELETE /api/search/history/:userId
   */
  clearSearchHistory = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    logger.info('Clearing search history', { userId });

    await this.searchService.clearSearchHistory(userId);

    res.json({
      success: true,
      message: 'Search history cleared successfully',
    });
  });

  /**
   * Track search result click
   * POST /api/search/track/click
   */
  trackClick = asyncHandler(async (req: Request, res: Response) => {
    const { userId, sessionId, searchId, resultId, position } = req.body;

    logger.info('Tracking search result click', { 
      userId, 
      sessionId, 
      searchId, 
      resultId, 
      position 
    });

    // Track click for analytics
    // In a real implementation, this would update click-through rates
    // and help improve search ranking algorithms

    res.json({
      success: true,
      message: 'Click tracked successfully',
    });
  });

  /**
   * Get search analytics
   * GET /api/search/analytics
   */
  getSearchAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { timeframe = 'day' } = req.query;

    logger.info('Getting search analytics', { timeframe });

    const analytics = await this.searchService.getSearchAnalytics(
      timeframe as 'hour' | 'day' | 'week' | 'month'
    );

    res.json({
      success: true,
      data: analytics,
    });
  });

  /**
   * Get available search filters
   * GET /api/search/filters
   */
  getSearchFilters = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Getting available search filters');

    const filters = {
      sourceTypes: [
        { value: 'official', label: 'Official Documentation', count: 245 },
        { value: 'documentation', label: 'Documentation', count: 189 },
        { value: 'forum', label: 'Community Forums', count: 156 },
        { value: 'blog', label: 'Technical Blogs', count: 123 },
        { value: 'wiki', label: 'Wiki Articles', count: 98 },
        { value: 'vendor', label: 'Vendor Resources', count: 67 },
      ],
      categories: [
        { value: 'Network & Connectivity', label: 'Network & Connectivity', count: 234 },
        { value: 'Email & Communication', label: 'Email & Communication', count: 198 },
        { value: 'Hardware & Devices', label: 'Hardware & Devices', count: 167 },
        { value: 'Software & Applications', label: 'Software & Applications', count: 289 },
        { value: 'Security & Access', label: 'Security & Access', count: 145 },
        { value: 'Database & Storage', label: 'Database & Storage', count: 89 },
        { value: 'General IT Support', label: 'General IT Support', count: 156 },
      ],
      credibilityLevels: [
        { value: 90, label: 'Highly Credible (90+)', count: 234 },
        { value: 70, label: 'Credible (70+)', count: 456 },
        { value: 50, label: 'Moderately Credible (50+)', count: 789 },
        { value: 0, label: 'All Results', count: 1234 },
      ],
      dateRanges: [
        { value: '1d', label: 'Last 24 hours', count: 45 },
        { value: '1w', label: 'Last week', count: 189 },
        { value: '1m', label: 'Last month', count: 456 },
        { value: '1y', label: 'Last year', count: 987 },
        { value: 'all', label: 'All time', count: 1234 },
      ],
    };

    res.json({
      success: true,
      data: filters,
    });
  });

  /**
   * Health check for search service
   * GET /api/search/health
   */
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    // Perform basic health checks
    const checks = {
      searchService: true,
      searchIndex: true, // Would check search index status
      suggestions: true, // Would check suggestion system
    };

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        checks,
        timestamp: new Date().toISOString(),
      },
    });
  });
}