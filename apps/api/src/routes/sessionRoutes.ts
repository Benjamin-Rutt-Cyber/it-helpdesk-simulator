import { Router } from 'express';
import { SessionManagerService } from '../services/sessionManagerService';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();
const sessionManager = new SessionManagerService();

/**
 * Create a new search session
 * POST /api/v1/sessions/search
 */
router.post('/search', async (req, res) => {
  try {
    const { userId, ticketId, name, description, persistent, autoSave, expirationTime } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const session = await sessionManager.createSession(userId, ticketId, {
      name,
      description,
      persistent,
      autoSave,
      expirationTime
    });

    res.status(201).json({
      success: true,
      session
    });

  } catch (error) {
    logger.error('Error creating search session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create search session'
    });
  }
});

/**
 * Get a search session
 * GET /api/v1/sessions/search/:sessionId
 */
router.get('/search/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionManager.getSession(sessionId);

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
 * Update a search session
 * PUT /api/v1/sessions/search/:sessionId
 */
router.put('/search/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;

    // Prevent updating certain immutable fields
    delete updates.id;
    delete updates.createdAt;
    delete updates.userId;

    const session = await sessionManager.updateSession(sessionId, updates);

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
    logger.error('Error updating search session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update search session'
    });
  }
});

/**
 * Delete a search session
 * DELETE /api/v1/sessions/search/:sessionId
 */
router.delete('/search/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const deleted = await sessionManager.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Search session not found'
      });
    }

    res.json({
      success: true,
      message: 'Search session deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting search session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete search session'
    });
  }
});

/**
 * Get user's search sessions
 * GET /api/v1/sessions/search/user/:userId
 */
router.get('/search/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await sessionManager.getUserSessions(userId);

    res.json({
      success: true,
      sessions,
      count: sessions.length
    });

  } catch (error) {
    logger.error('Error getting user sessions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user sessions'
    });
  }
});

/**
 * Add tab to session
 * POST /api/v1/sessions/search/:sessionId/tabs
 */
router.post('/search/:sessionId/tabs', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, query, filters, results, scrollPosition, isActive, isPinned } = req.body;

    if (!name) {
      throw new ValidationError('Tab name is required');
    }

    const tabId = await sessionManager.addTab(sessionId, {
      name,
      query: query || '',
      filters: filters || {},
      results: results || [],
      scrollPosition: scrollPosition || 0,
      isActive: isActive || false,
      isPinned: isPinned || false
    });

    res.status(201).json({
      success: true,
      tabId
    });

  } catch (error) {
    logger.error('Error adding tab to session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add tab to session'
    });
  }
});

/**
 * Update session tab
 * PUT /api/v1/sessions/search/:sessionId/tabs/:tabId
 */
router.put('/search/:sessionId/tabs/:tabId', async (req, res) => {
  try {
    const { sessionId, tabId } = req.params;
    const updates = req.body;

    // Prevent updating certain immutable fields
    delete updates.id;
    delete updates.createdAt;

    await sessionManager.updateTab(sessionId, tabId, updates);

    res.json({
      success: true,
      message: 'Tab updated successfully'
    });

  } catch (error) {
    logger.error('Error updating session tab:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update session tab'
    });
  }
});

/**
 * Remove tab from session
 * DELETE /api/v1/sessions/search/:sessionId/tabs/:tabId
 */
router.delete('/search/:sessionId/tabs/:tabId', async (req, res) => {
  try {
    const { sessionId, tabId } = req.params;

    await sessionManager.removeTab(sessionId, tabId);

    res.json({
      success: true,
      message: 'Tab removed successfully'
    });

  } catch (error) {
    logger.error('Error removing session tab:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove session tab'
    });
  }
});

/**
 * Create session backup
 * POST /api/v1/sessions/search/:sessionId/backup
 */
router.post('/search/:sessionId/backup', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { backupType } = req.body;

    const backupId = await sessionManager.createBackup(
      sessionId, 
      backupType || 'manual'
    );

    res.status(201).json({
      success: true,
      backupId
    });

  } catch (error) {
    logger.error('Error creating session backup:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session backup'
    });
  }
});

/**
 * Get session recovery info
 * GET /api/v1/sessions/search/:sessionId/recovery-info
 */
router.get('/search/:sessionId/recovery-info', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const recoveryInfo = await sessionManager.getRecoveryInfo(sessionId);

    if (!recoveryInfo) {
      return res.status(404).json({
        success: false,
        error: 'Recovery info not found'
      });
    }

    res.json({
      success: true,
      recoveryInfo
    });

  } catch (error) {
    logger.error('Error getting recovery info:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recovery info'
    });
  }
});

/**
 * Recover session from backup
 * POST /api/v1/sessions/search/:sessionId/recover
 */
router.post('/search/:sessionId/recover', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { backupId } = req.body;

    const session = await sessionManager.recoverSession(sessionId, backupId);

    res.json({
      success: true,
      session,
      message: 'Session recovered successfully'
    });

  } catch (error) {
    logger.error('Error recovering session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to recover session'
    });
  }
});

/**
 * Export session
 * GET /api/v1/sessions/search/:sessionId/export
 */
router.get('/search/:sessionId/export', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const exportData = await sessionManager.exportSession(sessionId);

    const filename = `session-${sessionId}-${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.json(exportData);

  } catch (error) {
    logger.error('Error exporting session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export session'
    });
  }
});

/**
 * Import session
 * POST /api/v1/sessions/search/import
 */
router.post('/search/import', async (req, res) => {
  try {
    const importData = req.body;

    if (!importData || !importData.session) {
      throw new ValidationError('Invalid import data format');
    }

    const sessionId = await sessionManager.importSession(importData);

    res.status(201).json({
      success: true,
      sessionId,
      message: 'Session imported successfully'
    });

  } catch (error) {
    logger.error('Error importing session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import session'
    });
  }
});

/**
 * Get session manager service status
 * GET /api/v1/sessions/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await sessionManager.getServiceStatus();

    res.json({
      success: true,
      service: 'Session Manager',
      timestamp: new Date().toISOString(),
      ...status
    });

  } catch (error) {
    logger.error('Error getting session manager status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get service status'
    });
  }
});

export default router;