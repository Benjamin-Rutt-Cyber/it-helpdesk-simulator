import { Router } from 'express';
import { SearchController } from '../controllers/searchController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const searchController = new SearchController();

// Validation schemas
const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 50) : 10),
    sort: z.enum(['relevance', 'date', 'credibility', 'popularity']).optional().default('relevance'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    sourceType: z.union([z.string(), z.array(z.string())]).optional(),
    credibilityLevel: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    resultType: z.union([z.string(), z.array(z.string())]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
  }),
});

const suggestionsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Query is required for suggestions').max(100, 'Query too long'),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  }),
});

const historySchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  query: z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  }),
});

const trackClickSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    sessionId: z.string().optional(),
    searchId: z.string().min(1, 'Search ID is required'),
    resultId: z.string().min(1, 'Result ID is required'),
    position: z.number().min(0, 'Position must be non-negative'),
    timestamp: z.string().optional().transform(str => str ? new Date(str) : new Date()),
  }),
});

const analyticsSchema = z.object({
  query: z.object({
    timeframe: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  }),
});

// Routes

/**
 * GET /api/search/health
 * Health check for search service
 */
router.get('/health', searchController.healthCheck);

/**
 * GET /api/search?q=query&page=1&limit=10
 * Perform a search query with optional filters and pagination
 */
router.get(
  '/',
  authenticateToken,
  validateRequest(searchQuerySchema),
  searchController.search
);

/**
 * GET /api/search/suggestions?q=partial_query&limit=10
 * Get search suggestions for auto-complete functionality
 */
router.get(
  '/suggestions',
  authenticateToken,
  validateRequest(suggestionsSchema),
  searchController.getSuggestions
);

/**
 * GET /api/search/history/:userId?limit=50
 * Get user search history
 */
router.get(
  '/history/:userId',
  authenticateToken,
  validateRequest(historySchema),
  searchController.getSearchHistory
);

/**
 * DELETE /api/search/history/:userId
 * Clear user search history
 */
router.delete(
  '/history/:userId',
  authenticateToken,
  validateRequest(z.object({
    params: z.object({
      userId: z.string().min(1, 'User ID is required'),
    }),
  })),
  searchController.clearSearchHistory
);

/**
 * POST /api/search/track/click
 * Track search result click for analytics
 */
router.post(
  '/track/click',
  authenticateToken,
  validateRequest(trackClickSchema),
  searchController.trackClick
);

/**
 * GET /api/search/analytics?timeframe=day
 * Get search analytics and metrics
 */
router.get(
  '/analytics',
  authenticateToken,
  validateRequest(analyticsSchema),
  searchController.getSearchAnalytics
);

/**
 * GET /api/search/filters
 * Get available search filters and their counts
 */
router.get(
  '/filters',
  authenticateToken,
  searchController.getSearchFilters
);

export { router as searchRoutes };