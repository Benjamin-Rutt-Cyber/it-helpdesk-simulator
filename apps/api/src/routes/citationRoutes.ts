import { Router } from 'express';
import { CitationManagerService, ReferenceFilter } from '../services/citationManagerService';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();
const citationManager = new CitationManagerService();

/**
 * Save a new reference
 * POST /api/v1/citations/references
 */
router.post('/references', async (req, res) => {
  try {
    const {
      resultId,
      ticketId,
      sessionId,
      title,
      url,
      snippet,
      source,
      sourceType,
      credibilityLevel,
      notes,
      tags,
      citationFormat,
      citationStyle,
      userId,
      isPublic,
      category,
      relevanceScore
    } = req.body;

    // Validate required fields
    if (!resultId || !title || !url || !source) {
      throw new ValidationError('Missing required fields: resultId, title, url, source');
    }

    const reference = await citationManager.saveReference({
      resultId,
      ticketId,
      sessionId,
      title,
      url,
      snippet: snippet || '',
      source,
      sourceType: sourceType || 'documentation',
      credibilityLevel: credibilityLevel || 'medium',
      notes: notes || '',
      tags: tags || [],
      citationFormat: citationFormat || '',
      citationStyle: citationStyle || 'apa',
      userId,
      isPublic: isPublic || false,
      category,
      relevanceScore
    });

    res.status(201).json({
      success: true,
      reference
    });

  } catch (error) {
    logger.error('Error saving reference:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save reference'
    });
  }
});

/**
 * Get references with optional filtering
 * GET /api/v1/citations/references
 */
router.get('/references', async (req, res) => {
  try {
    const filter: ReferenceFilter = {};

    // Extract filter parameters from query
    if (req.query.ticketId) filter.ticketId = req.query.ticketId as string;
    if (req.query.sessionId) filter.sessionId = req.query.sessionId as string;
    if (req.query.userId) filter.userId = req.query.userId as string;
    if (req.query.credibilityLevel) filter.credibilityLevel = req.query.credibilityLevel as 'high' | 'medium' | 'low';
    if (req.query.sourceType) filter.sourceType = req.query.sourceType as string;
    if (req.query.category) filter.category = req.query.category as string;
    if (req.query.isPublic !== undefined) filter.isPublic = req.query.isPublic === 'true';

    // Handle tags (comma-separated)
    if (req.query.tags) {
      filter.tags = (req.query.tags as string).split(',').map(tag => tag.trim());
    }

    // Handle date range
    if (req.query.startDate && req.query.endDate) {
      filter.dateRange = {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string)
      };
    }

    const references = await citationManager.getReferences(filter);

    res.json({
      success: true,
      references,
      count: references.length
    });

  } catch (error) {
    logger.error('Error getting references:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get references'
    });
  }
});

/**
 * Get a specific reference by ID
 * GET /api/v1/citations/references/:id
 */
router.get('/references/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reference = await citationManager.getReference(id);

    if (!reference) {
      return res.status(404).json({
        success: false,
        error: 'Reference not found'
      });
    }

    res.json({
      success: true,
      reference
    });

  } catch (error) {
    logger.error('Error getting reference:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get reference'
    });
  }
});

/**
 * Update an existing reference
 * PUT /api/v1/citations/references/:id
 */
router.put('/references/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating certain immutable fields
    delete updates.id;
    delete updates.savedAt;

    const reference = await citationManager.updateReference(id, updates);

    if (!reference) {
      return res.status(404).json({
        success: false,
        error: 'Reference not found'
      });
    }

    res.json({
      success: true,
      reference
    });

  } catch (error) {
    logger.error('Error updating reference:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reference'
    });
  }
});

/**
 * Delete a reference
 * DELETE /api/v1/citations/references/:id
 */
router.delete('/references/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await citationManager.deleteReference(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Reference not found'
      });
    }

    res.json({
      success: true,
      message: 'Reference deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting reference:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete reference'
    });
  }
});

/**
 * Generate citation for a reference
 * POST /api/v1/citations/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { referenceId, formatId } = req.body;

    if (!referenceId) {
      throw new ValidationError('Reference ID is required');
    }

    const citation = await citationManager.generateCitation(referenceId, formatId);

    res.json({
      success: true,
      citation,
      formatId: formatId || 'apa'
    });

  } catch (error) {
    logger.error('Error generating citation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate citation'
    });
  }
});

/**
 * Get available citation formats
 * GET /api/v1/citations/formats
 */
router.get('/formats', async (req, res) => {
  try {
    const formats = await citationManager.getCitationFormats();

    res.json({
      success: true,
      formats
    });

  } catch (error) {
    logger.error('Error getting citation formats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get citation formats'
    });
  }
});

/**
 * Search references
 * GET /api/v1/citations/search
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query is required');
    }

    // Build filter from query parameters
    const filter: ReferenceFilter = {};
    if (req.query.ticketId) filter.ticketId = req.query.ticketId as string;
    if (req.query.userId) filter.userId = req.query.userId as string;
    if (req.query.credibilityLevel) filter.credibilityLevel = req.query.credibilityLevel as 'high' | 'medium' | 'low';
    if (req.query.sourceType) filter.sourceType = req.query.sourceType as string;

    const results = await citationManager.searchReferences(query, filter);

    res.json({
      success: true,
      results,
      query,
      count: results.length
    });

  } catch (error) {
    logger.error('Error searching references:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search references'
    });
  }
});

/**
 * Export references
 * GET /api/v1/citations/export
 */
router.get('/export', async (req, res) => {
  try {
    const format = (req.query.format as string) || 'json';
    
    if (!['json', 'csv', 'txt', 'markdown'].includes(format)) {
      throw new ValidationError('Invalid export format. Supported: json, csv, txt, markdown');
    }

    // Build filter from query parameters
    const filter: ReferenceFilter = {};
    if (req.query.ticketId) filter.ticketId = req.query.ticketId as string;
    if (req.query.userId) filter.userId = req.query.userId as string;
    if (req.query.credibilityLevel) filter.credibilityLevel = req.query.credibilityLevel as 'high' | 'medium' | 'low';

    const exportData = await citationManager.exportReferences(filter, format as any);

    // Set appropriate content type and filename
    const filename = `references-export-${new Date().toISOString().split('T')[0]}.${format}`;
    
    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        break;
      case 'txt':
        res.setHeader('Content-Type', 'text/plain');
        break;
      case 'markdown':
        res.setHeader('Content-Type', 'text/markdown');
        break;
      default:
        res.setHeader('Content-Type', 'application/json');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.json(exportData);

  } catch (error) {
    logger.error('Error exporting references:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export references'
    });
  }
});

/**
 * Import references
 * POST /api/v1/citations/import
 */
router.post('/import', async (req, res) => {
  try {
    const importData = req.body;

    if (!importData.references || !Array.isArray(importData.references)) {
      throw new ValidationError('Invalid import data format');
    }

    const result = await citationManager.importReferences(importData);

    res.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      total: importData.references.length
    });

  } catch (error) {
    logger.error('Error importing references:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import references'
    });
  }
});

/**
 * Get citation statistics
 * GET /api/v1/citations/stats
 */
router.get('/stats', async (req, res) => {
  try {
    // Build filter from query parameters
    const filter: ReferenceFilter = {};
    if (req.query.ticketId) filter.ticketId = req.query.ticketId as string;
    if (req.query.userId) filter.userId = req.query.userId as string;
    if (req.query.credibilityLevel) filter.credibilityLevel = req.query.credibilityLevel as 'high' | 'medium' | 'low';

    const stats = await citationManager.getCitationStats(filter);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Error getting citation stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get citation stats'
    });
  }
});

/**
 * Create a reference collection
 * POST /api/v1/citations/collections
 */
router.post('/collections', async (req, res) => {
  try {
    const { userId, name, referenceIds } = req.body;

    if (!userId || !name || !Array.isArray(referenceIds)) {
      throw new ValidationError('User ID, collection name, and reference IDs are required');
    }

    const collectionId = await citationManager.createCollection(userId, name, referenceIds);

    res.status(201).json({
      success: true,
      collectionId,
      name,
      referenceCount: referenceIds.length
    });

  } catch (error) {
    logger.error('Error creating collection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create collection'
    });
  }
});

/**
 * Get a reference collection
 * GET /api/v1/citations/collections/:userId/:collectionId
 */
router.get('/collections/:userId/:collectionId', async (req, res) => {
  try {
    const { userId, collectionId } = req.params;
    const references = await citationManager.getCollection(userId, collectionId);

    res.json({
      success: true,
      collection: {
        id: collectionId,
        userId,
        references,
        count: references.length
      }
    });

  } catch (error) {
    logger.error('Error getting collection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get collection'
    });
  }
});

/**
 * Clean up expired references
 * POST /api/v1/citations/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { retentionDays } = req.body;
    const days = retentionDays || 365;

    const deletedCount = await citationManager.cleanupExpiredReferences(days);

    res.json({
      success: true,
      deletedCount,
      retentionDays: days
    });

  } catch (error) {
    logger.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cleanup references'
    });
  }
});

/**
 * Get service health status
 * GET /api/v1/citations/health
 */
router.get('/health', async (req, res) => {
  try {
    const status = await citationManager.getServiceStatus();

    res.json({
      success: true,
      service: 'Citation Manager',
      timestamp: new Date().toISOString(),
      ...status
    });

  } catch (error) {
    logger.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get service status'
    });
  }
});

export default router;