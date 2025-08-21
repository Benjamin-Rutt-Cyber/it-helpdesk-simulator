import { Router } from 'express';
import { SearchIntegrationService } from '../services/searchIntegrationService';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();
const searchIntegrationService = new SearchIntegrationService();

/**
 * Perform integrated search with optional ticket context
 * POST /api/v1/search/integrated
 */
router.post('/integrated', async (req, res) => {
  try {
    const {
      query,
      filters,
      ticketContext,
      sessionId,
      enableContextualRanking
    } = req.body;

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required and must be a string');
    }

    const results = await searchIntegrationService.performIntegratedSearch(
      query.trim(),
      filters || {},
      ticketContext,
      sessionId
    );

    res.json({
      success: true,
      results,
      totalCount: results.length,
      searchTime: Date.now(), // Would calculate actual search time
      hasTicketContext: !!ticketContext
    });

  } catch (error) {
    logger.error('Error in integrated search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

/**
 * Perform contextual search with ticket context
 * POST /api/v1/search/contextual
 */
router.post('/contextual', async (req, res) => {
  try {
    const { query, ticketContext, config } = req.body;

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required and must be a string');
    }

    if (!ticketContext || !ticketContext.ticketId) {
      throw new ValidationError('Ticket context with ticketId is required for contextual search');
    }

    const results = await searchIntegrationService.performContextualSearch(
      query.trim(),
      ticketContext,
      config || {}
    );

    // Calculate context score based on results
    const contextScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.relevanceToTicket || 0), 0) / results.length * 100)
      : 0;

    res.json({
      success: true,
      results,
      totalCount: results.length,
      contextScore,
      ticketId: ticketContext.ticketId,
      searchTime: Date.now()
    });

  } catch (error) {
    logger.error('Error in contextual search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Contextual search failed'
    });
  }
});

/**
 * Extract context from ticket information
 * POST /api/v1/search/extract-context
 */
router.post('/extract-context', async (req, res) => {
  try {
    const { ticketContext } = req.body;

    if (!ticketContext || !ticketContext.ticketId) {
      throw new ValidationError('Ticket context with ticketId is required');
    }

    const contextExtraction = await searchIntegrationService.extractTicketContext(ticketContext);

    res.json({
      success: true,
      ...contextExtraction,
      ticketId: ticketContext.ticketId
    });

  } catch (error) {
    logger.error('Error extracting ticket context:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Context extraction failed'
    });
  }
});

/**
 * Prioritize search results based on ticket context
 * POST /api/v1/search/prioritize
 */
router.post('/prioritize', async (req, res) => {
  try {
    const { results, ticketContext, sessionId } = req.body;

    if (!Array.isArray(results)) {
      throw new ValidationError('Results array is required');
    }

    if (!ticketContext || !ticketContext.ticketId) {
      throw new ValidationError('Ticket context with ticketId is required');
    }

    const prioritizedResults = await searchIntegrationService.prioritizeResults(
      results,
      ticketContext
    );

    res.json({
      success: true,
      prioritizedResults,
      originalCount: results.length,
      prioritizedCount: prioritizedResults.length,
      ticketId: ticketContext.ticketId
    });

  } catch (error) {
    logger.error('Error prioritizing search results:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Result prioritization failed'
    });
  }
});

/**
 * Start a new search session
 * POST /api/v1/search/start-session
 */
router.post('/start-session', async (req, res) => {
  try {
    const { ticketId } = req.body;

    const session = await searchIntegrationService.startSearchSession(ticketId);

    res.status(201).json({
      success: true,
      session
    });

  } catch (error) {
    logger.error('Error starting search session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start search session'
    });
  }
});

/**
 * Get search session information
 * GET /api/v1/search/session/:sessionId
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await searchIntegrationService.getSearchSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Search session not found'
      });
    }

    res.json({
      success: true,
      session
    });

  } catch (error) {
    logger.error('Error getting search session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get search session'
    });
  }
});

/**
 * End a search session
 * POST /api/v1/search/end-session
 */
router.post('/end-session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const session = await searchIntegrationService.endSearchSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Search session not found'
      });
    }

    res.json({
      success: true,
      session,
      summary: {
        duration: session.endTime && session.startTime 
          ? session.endTime.getTime() - session.startTime.getTime()
          : 0,
        searchCount: session.searchHistory.length,
        ticketId: session.ticketId
      }
    });

  } catch (error) {
    logger.error('Error ending search session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to end search session'
    });
  }
});

/**
 * Save a search result reference
 * POST /api/v1/search/save-reference
 */
router.post('/save-reference', async (req, res) => {
  try {
    const {
      resultId,
      ticketId,
      sessionId,
      title,
      url,
      snippet,
      credibilityLevel,
      notes
    } = req.body;

    if (!resultId || !ticketId) {
      throw new ValidationError('Result ID and Ticket ID are required');
    }

    // For now, just return a success response
    // In a real implementation, this would save to a database
    const reference = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resultId,
      ticketId,
      sessionId,
      title,
      url,
      snippet,
      credibilityLevel,
      notes,
      savedAt: new Date()
    };

    logger.info(`Search result reference saved`, {
      referenceId: reference.id,
      resultId,
      ticketId,
      sessionId
    });

    res.status(201).json({
      success: true,
      reference
    });

  } catch (error) {
    logger.error('Error saving search result reference:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save reference'
    });
  }
});

/**
 * Get saved references for a ticket
 * GET /api/v1/search/references/:ticketId
 */
router.get('/references/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { sessionId } = req.query;

    // For now, return empty array
    // In a real implementation, this would query a database
    const references: any[] = [];

    logger.info(`Retrieved search references for ticket ${ticketId}`, {
      count: references.length,
      sessionId
    });

    res.json({
      success: true,
      references,
      ticketId,
      count: references.length
    });

  } catch (error) {
    logger.error('Error getting search references:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get references'
    });
  }
});

/**
 * Track search events for analytics
 * POST /api/v1/search/track-event
 */
router.post('/track-event', async (req, res) => {
  try {
    const { type, sessionId, ticketId, data } = req.body;

    if (!type) {
      throw new ValidationError('Event type is required');
    }

    // Log the search event
    logger.info(`Search event tracked: ${type}`, {
      sessionId,
      ticketId,
      data
    });

    // In a real implementation, this would be sent to an analytics service
    res.json({
      success: true,
      tracked: true,
      eventType: type,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error tracking search event:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track event'
    });
  }
});

/**
 * Get search metrics and performance data
 * GET /api/v1/search/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await searchIntegrationService.getSearchMetrics();

    res.json({
      success: true,
      metrics: {
        ...metrics,
        timestamp: new Date(),
        uptime: process.uptime()
      }
    });

  } catch (error) {
    logger.error('Error getting search metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics'
    });
  }
});

/**
 * Clear search cache (admin endpoint)
 * POST /api/v1/search/clear-cache
 */
router.post('/clear-cache', async (req, res) => {
  try {
    await searchIntegrationService.clearSearchCache();

    logger.info('Search cache cleared via API request');

    res.json({
      success: true,
      message: 'Search cache cleared successfully',
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Error clearing search cache:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache'
    });
  }
});

export default router;