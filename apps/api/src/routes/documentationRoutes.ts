import express from 'express';
import { DocumentationService, DocumentationData } from '../services/documentationService';
import { TemplateManager } from '../services/templateManager';
import { SolutionStepsService } from '../services/solutionStepsService';
import { RootCauseAnalysisService } from '../services/rootCauseAnalysisService';
import { TestingVerificationService } from '../services/testingVerificationService';
import { TimeTrackingService } from '../services/timeTrackingService';
import { auth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const documentationService = DocumentationService.getInstance();
const templateManager = TemplateManager.getInstance();
const solutionStepsService = SolutionStepsService.getInstance();
const rootCauseAnalysisService = RootCauseAnalysisService.getInstance();
const testingVerificationService = TestingVerificationService.getInstance();
const timeTrackingService = TimeTrackingService.getInstance();

// Apply authentication middleware to all routes
router.use(auth);

// Create new documentation
router.post('/', async (req, res) => {
  try {
    const { ticketId, ...documentationData } = req.body;
    
    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    const data: DocumentationData = {
      ...documentationData,
      ticketId,
      userId: req.user?.id || 'unknown'
    };

    const documentationId = await documentationService.createDocumentation(data);

    logger.info('Created documentation via API', {
      documentationId,
      ticketId,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      documentationId,
      message: 'Documentation created successfully'
    });
  } catch (error) {
    logger.error('Failed to create documentation via API', { error, body: req.body });
    res.status(500).json({
      error: 'Failed to create documentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get documentation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const documentation = await documentationService.getDocumentation(id);

    if (!documentation) {
      return res.status(404).json({ error: 'Documentation not found' });
    }

    res.json({
      success: true,
      documentation
    });
  } catch (error) {
    logger.error('Failed to get documentation via API', { error, documentationId: req.params.id });
    res.status(500).json({
      error: 'Failed to retrieve documentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update documentation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await documentationService.updateDocumentation(id, updates);

    logger.info('Updated documentation via API', {
      documentationId: id,
      userId: req.user?.id,
      updatedFields: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'Documentation updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update documentation via API', { error, documentationId: req.params.id });
    res.status(500).json({
      error: 'Failed to update documentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get documentation by ticket ID
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const documentation = await documentationService.getDocumentationByTicket(ticketId);

    res.json({
      success: true,
      documentation
    });
  } catch (error) {
    logger.error('Failed to get documentation by ticket via API', { error, ticketId: req.params.ticketId });
    res.status(500).json({
      error: 'Failed to retrieve documentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate documentation
router.post('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const documentation = await documentationService.getDocumentation(id);

    if (!documentation) {
      return res.status(404).json({ error: 'Documentation not found' });
    }

    const validation = await documentationService.validateDocumentation(documentation);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logger.error('Failed to validate documentation via API', { error, documentationId: req.params.id });
    res.status(500).json({
      error: 'Failed to validate documentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export documentation
router.get('/:id/export/:format', async (req, res) => {
  try {
    const { id, format } = req.params;
    
    if (!['markdown', 'html', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format. Supported formats: markdown, html, pdf' });
    }

    const exportedContent = await documentationService.exportDocumentation(id, format as 'markdown' | 'html' | 'pdf');

    // Set appropriate content type
    let contentType = 'text/plain';
    let fileExtension = 'txt';
    
    switch (format) {
      case 'markdown':
        contentType = 'text/markdown';
        fileExtension = 'md';
        break;
      case 'html':
        contentType = 'text/html';
        fileExtension = 'html';
        break;
      case 'pdf':
        contentType = 'text/html'; // For now, PDF returns HTML
        fileExtension = 'html';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="documentation_${id}.${fileExtension}"`);
    res.send(exportedContent);

    logger.info('Exported documentation via API', {
      documentationId: id,
      format,
      userId: req.user?.id
    });
  } catch (error) {
    logger.error('Failed to export documentation via API', { error, documentationId: req.params.id, format: req.params.format });
    res.status(500).json({
      error: 'Failed to export documentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Publish to knowledge base
router.post('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    await documentationService.publishToKnowledgeBase(id);

    logger.info('Published documentation to knowledge base via API', {
      documentationId: id,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Documentation published to knowledge base successfully'
    });
  } catch (error) {
    logger.error('Failed to publish documentation to knowledge base via API', { error, documentationId: req.params.id });
    res.status(500).json({
      error: 'Failed to publish documentation to knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Template Management Routes

// Get all templates
router.get('/templates/all', async (req, res) => {
  try {
    const templates = await templateManager.getAllTemplates();

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Failed to get all templates via API', { error });
    res.status(500).json({
      error: 'Failed to retrieve templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get template by ID
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateManager.getTemplate(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Failed to get template via API', { error, templateId: req.params.id });
    res.status(500).json({
      error: 'Failed to retrieve template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get templates by category
router.get('/templates/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const templates = await templateManager.getTemplatesByCategory(category);

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Failed to get templates by category via API', { error, category: req.params.category });
    res.status(500).json({
      error: 'Failed to retrieve templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get default template
router.get('/templates/default/get', async (req, res) => {
  try {
    const template = await templateManager.getDefaultTemplate();

    res.json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Failed to get default template via API', { error });
    res.status(500).json({
      error: 'Failed to retrieve default template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recommended template
router.get('/templates/recommend/:ticketType?', async (req, res) => {
  try {
    const { ticketType } = req.params;
    const template = await templateManager.getRecommendedTemplate(ticketType);

    res.json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Failed to get recommended template via API', { error, ticketType: req.params.ticketType });
    res.status(500).json({
      error: 'Failed to get recommended template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create custom template
router.post('/templates/custom', async (req, res) => {
  try {
    const { baseTemplateId, name, description, customizations } = req.body;

    if (!baseTemplateId || !name || !description) {
      return res.status(400).json({
        error: 'Base template ID, name, and description are required'
      });
    }

    const customTemplateId = await templateManager.createCustomTemplate(
      baseTemplateId,
      name,
      description,
      customizations || {}
    );

    logger.info('Created custom template via API', {
      customTemplateId,
      baseTemplateId,
      name,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      templateId: customTemplateId,
      message: 'Custom template created successfully'
    });
  } catch (error) {
    logger.error('Failed to create custom template via API', { error, body: req.body });
    res.status(500).json({
      error: 'Failed to create custom template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await templateManager.updateTemplate(id, updates);

    logger.info('Updated template via API', {
      templateId: id,
      userId: req.user?.id,
      updatedFields: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'Template updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update template via API', { error, templateId: req.params.id });
    res.status(500).json({
      error: 'Failed to update template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await templateManager.deleteTemplate(id);

    logger.info('Deleted template via API', {
      templateId: id,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete template via API', { error, templateId: req.params.id });
    res.status(500).json({
      error: 'Failed to delete template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get template usage statistics
router.get('/templates/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await templateManager.getTemplateUsageStats(id);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get template usage stats via API', { error, templateId: req.params.id });
    res.status(500).json({
      error: 'Failed to retrieve template usage statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export template
router.get('/templates/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const exportedTemplate = await templateManager.exportTemplate(id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="template_${id}.json"`);
    res.send(exportedTemplate);

    logger.info('Exported template via API', {
      templateId: id,
      userId: req.user?.id
    });
  } catch (error) {
    logger.error('Failed to export template via API', { error, templateId: req.params.id });
    res.status(500).json({
      error: 'Failed to export template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Import template
router.post('/templates/import', async (req, res) => {
  try {
    const { templateData } = req.body;

    if (!templateData) {
      return res.status(400).json({
        error: 'Template data is required'
      });
    }

    const templateId = await templateManager.importTemplate(templateData);

    logger.info('Imported template via API', {
      templateId,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      templateId,
      message: 'Template imported successfully'
    });
  } catch (error) {
    logger.error('Failed to import template via API', { error });
    res.status(500).json({
      error: 'Failed to import template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate template field
router.post('/templates/validate-field', async (req, res) => {
  try {
    const { field, value } = req.body;

    if (!field) {
      return res.status(400).json({
        error: 'Field definition is required'
      });
    }

    const validation = await templateManager.validateTemplateField(field, value);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logger.error('Failed to validate template field via API', { error, body: req.body });
    res.status(500).json({
      error: 'Failed to validate template field',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Solution Steps Management Routes

// Create step sequence for a ticket
router.post('/steps/sequence', async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    const sequenceId = await solutionStepsService.createStepSequence(ticketId, req.user?.id || 'unknown');

    logger.info('Created step sequence via API', {
      sequenceId,
      ticketId,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      sequenceId,
      message: 'Step sequence created successfully'
    });
  } catch (error) {
    logger.error('Failed to create step sequence via API', { error, body: req.body });
    res.status(500).json({
      error: 'Failed to create step sequence',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get step sequence by ID
router.get('/steps/sequence/:sequenceId', async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const sequence = await solutionStepsService.getStepSequence(sequenceId);

    if (!sequence) {
      return res.status(404).json({ error: 'Step sequence not found' });
    }

    res.json({
      success: true,
      sequence
    });
  } catch (error) {
    logger.error('Failed to get step sequence via API', { error, sequenceId: req.params.sequenceId });
    res.status(500).json({
      error: 'Failed to retrieve step sequence',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get step sequence by ticket ID
router.get('/steps/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const sequence = await solutionStepsService.getStepSequenceByTicket(ticketId);

    res.json({
      success: true,
      sequence
    });
  } catch (error) {
    logger.error('Failed to get step sequence by ticket via API', { error, ticketId: req.params.ticketId });
    res.status(500).json({
      error: 'Failed to retrieve step sequence',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add step to sequence
router.post('/steps/sequence/:sequenceId/step', async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const { description, action, expectedResult, verified = false, ticketId, createdBy } = req.body;

    if (!description || !action) {
      return res.status(400).json({
        error: 'Description and action are required for each step'
      });
    }

    const stepId = await solutionStepsService.addStep(sequenceId, {
      description,
      action,
      expectedResult: expectedResult || '',
      verified,
      ticketId: ticketId || '',
      createdBy: createdBy || req.user?.id || 'unknown'
    });

    logger.info('Added step to sequence via API', {
      sequenceId,
      stepId,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      stepId,
      message: 'Step added successfully'
    });
  } catch (error) {
    logger.error('Failed to add step via API', { error, sequenceId: req.params.sequenceId });
    res.status(500).json({
      error: 'Failed to add step',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update step
router.put('/steps/sequence/:sequenceId/step/:stepId', async (req, res) => {
  try {
    const { sequenceId, stepId } = req.params;
    const updates = req.body;

    await solutionStepsService.updateStep(sequenceId, stepId, updates);

    logger.info('Updated step via API', {
      sequenceId,
      stepId,
      updatedFields: Object.keys(updates),
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Step updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update step via API', { error, sequenceId: req.params.sequenceId, stepId: req.params.stepId });
    res.status(500).json({
      error: 'Failed to update step',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Remove step
router.delete('/steps/sequence/:sequenceId/step/:stepId', async (req, res) => {
  try {
    const { sequenceId, stepId } = req.params;

    await solutionStepsService.removeStep(sequenceId, stepId);

    logger.info('Removed step via API', {
      sequenceId,
      stepId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Step removed successfully'
    });
  } catch (error) {
    logger.error('Failed to remove step via API', { error, sequenceId: req.params.sequenceId, stepId: req.params.stepId });
    res.status(500).json({
      error: 'Failed to remove step',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reorder steps
router.put('/steps/sequence/:sequenceId/reorder', async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const { stepIds } = req.body;

    if (!Array.isArray(stepIds)) {
      return res.status(400).json({
        error: 'stepIds must be an array'
      });
    }

    await solutionStepsService.reorderSteps(sequenceId, stepIds);

    logger.info('Reordered steps via API', {
      sequenceId,
      newOrder: stepIds,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Steps reordered successfully'
    });
  } catch (error) {
    logger.error('Failed to reorder steps via API', { error, sequenceId: req.params.sequenceId });
    res.status(500).json({
      error: 'Failed to reorder steps',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Verify step
router.post('/steps/sequence/:sequenceId/step/:stepId/verify', async (req, res) => {
  try {
    const { sequenceId, stepId } = req.params;
    const { verified, actualResult } = req.body;

    await solutionStepsService.verifyStep(sequenceId, stepId, verified, actualResult);

    logger.info('Verified step via API', {
      sequenceId,
      stepId,
      verified,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: `Step ${verified ? 'verified' : 'unverified'} successfully`
    });
  } catch (error) {
    logger.error('Failed to verify step via API', { error, sequenceId: req.params.sequenceId, stepId: req.params.stepId });
    res.status(500).json({
      error: 'Failed to verify step',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start step timer
router.post('/steps/sequence/:sequenceId/step/:stepId/start-timer', async (req, res) => {
  try {
    const { sequenceId, stepId } = req.params;

    await solutionStepsService.startStepTimer(sequenceId, stepId);

    logger.info('Started step timer via API', {
      sequenceId,
      stepId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Step timer started successfully'
    });
  } catch (error) {
    logger.error('Failed to start step timer via API', { error, sequenceId: req.params.sequenceId, stepId: req.params.stepId });
    res.status(500).json({
      error: 'Failed to start step timer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stop step timer
router.post('/steps/sequence/:sequenceId/step/:stepId/stop-timer', async (req, res) => {
  try {
    const { sequenceId, stepId } = req.params;
    const { duration } = req.body;

    if (typeof duration !== 'number' || duration < 0) {
      return res.status(400).json({
        error: 'Valid duration in seconds is required'
      });
    }

    await solutionStepsService.stopStepTimer(sequenceId, stepId, duration);

    logger.info('Stopped step timer via API', {
      sequenceId,
      stepId,
      duration,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Step timer stopped successfully'
    });
  } catch (error) {
    logger.error('Failed to stop step timer via API', { error, sequenceId: req.params.sequenceId, stepId: req.params.stepId });
    res.status(500).json({
      error: 'Failed to stop step timer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate step sequence
router.get('/steps/sequence/:sequenceId/validate', async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const validation = await solutionStepsService.validateStepSequence(sequenceId);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logger.error('Failed to validate step sequence via API', { error, sequenceId: req.params.sequenceId });
    res.status(500).json({
      error: 'Failed to validate step sequence',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get step analytics
router.get('/steps/sequence/:sequenceId/analytics', async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const analytics = await solutionStepsService.getStepAnalytics(sequenceId);

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Failed to get step analytics via API', { error, sequenceId: req.params.sequenceId });
    res.status(500).json({
      error: 'Failed to retrieve step analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export step sequence
router.get('/steps/sequence/:sequenceId/export/:format', async (req, res) => {
  try {
    const { sequenceId, format } = req.params;

    if (!['json', 'csv', 'markdown'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid export format. Supported formats: json, csv, markdown'
      });
    }

    const exportedContent = await solutionStepsService.exportStepSequence(sequenceId, format as 'json' | 'csv' | 'markdown');

    // Set appropriate content type and filename
    let contentType = 'text/plain';
    let fileExtension = 'txt';
    
    switch (format) {
      case 'json':
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'csv':
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'markdown':
        contentType = 'text/markdown';
        fileExtension = 'md';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="solution_steps_${sequenceId}.${fileExtension}"`);
    res.send(exportedContent);

    logger.info('Exported step sequence via API', {
      sequenceId,
      format,
      userId: req.user?.id
    });
  } catch (error) {
    logger.error('Failed to export step sequence via API', { error, sequenceId: req.params.sequenceId, format: req.params.format });
    res.status(500).json({
      error: 'Failed to export step sequence',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root Cause Analysis Management Routes

// Create root cause analysis
router.post('/rca', async (req, res) => {
  try {
    const {
      ticketId,
      primaryCause,
      contributingFactors = [],
      rootCauseCategory,
      severity,
      impactArea = [],
      preventionMeasures = [],
      recommendations = [],
      analysisMethod,
      analyst,
      reviewStatus = 'draft'
    } = req.body;

    if (!ticketId || !primaryCause || !rootCauseCategory || !severity || !analysisMethod) {
      return res.status(400).json({
        error: 'ticketId, primaryCause, rootCauseCategory, severity, and analysisMethod are required'
      });
    }

    const analysisId = await rootCauseAnalysisService.createAnalysis({
      ticketId,
      primaryCause,
      contributingFactors,
      rootCauseCategory,
      severity,
      impactArea,
      preventionMeasures,
      recommendations,
      analysisMethod,
      analyst: analyst || req.user?.id || 'Unknown',
      reviewStatus,
      analysisDate: new Date(),
      userId: req.user?.id || 'unknown'
    });

    logger.info('Created root cause analysis via API', {
      analysisId,
      ticketId,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      analysisId,
      message: 'Root cause analysis created successfully'
    });
  } catch (error) {
    logger.error('Failed to create root cause analysis via API', { error, body: req.body });
    res.status(500).json({
      error: 'Failed to create root cause analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get root cause analysis by ID
router.get('/rca/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const analysis = await rootCauseAnalysisService.getAnalysis(analysisId);

    if (!analysis) {
      return res.status(404).json({ error: 'Root cause analysis not found' });
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('Failed to get root cause analysis via API', { error, analysisId: req.params.analysisId });
    res.status(500).json({
      error: 'Failed to retrieve root cause analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get root cause analysis by ticket ID
router.get('/rca/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const analysis = await rootCauseAnalysisService.getAnalysisByTicket(ticketId);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('Failed to get root cause analysis by ticket via API', { error, ticketId: req.params.ticketId });
    res.status(500).json({
      error: 'Failed to retrieve root cause analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update root cause analysis
router.put('/rca/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const updates = req.body;

    await rootCauseAnalysisService.updateAnalysis(analysisId, updates);

    logger.info('Updated root cause analysis via API', {
      analysisId,
      updatedFields: Object.keys(updates),
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Root cause analysis updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update root cause analysis via API', { error, analysisId: req.params.analysisId });
    res.status(500).json({
      error: 'Failed to update root cause analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete root cause analysis
router.delete('/rca/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;

    await rootCauseAnalysisService.deleteAnalysis(analysisId);

    logger.info('Deleted root cause analysis via API', {
      analysisId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Root cause analysis deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete root cause analysis via API', { error, analysisId: req.params.analysisId });
    res.status(500).json({
      error: 'Failed to delete root cause analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate root cause analysis
router.get('/rca/:analysisId/validate', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const validation = await rootCauseAnalysisService.validateAnalysis(analysisId);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logger.error('Failed to validate root cause analysis via API', { error, analysisId: req.params.analysisId });
    res.status(500).json({
      error: 'Failed to validate root cause analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export root cause analysis
router.get('/rca/:analysisId/export/:format', async (req, res) => {
  try {
    const { analysisId, format } = req.params;

    if (!['json', 'pdf', 'markdown'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid export format. Supported formats: json, pdf, markdown'
      });
    }

    const exportedContent = await rootCauseAnalysisService.exportAnalysis(
      analysisId, 
      format as 'json' | 'pdf' | 'markdown'
    );

    // Set appropriate content type and filename
    let contentType = 'text/plain';
    let fileExtension = 'txt';
    
    switch (format) {
      case 'json':
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'markdown':
        contentType = 'text/markdown';
        fileExtension = 'md';
        break;
      case 'pdf':
        contentType = 'text/markdown'; // For now, PDF returns Markdown
        fileExtension = 'md';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="root_cause_analysis_${analysisId}.${fileExtension}"`);
    res.send(exportedContent);

    logger.info('Exported root cause analysis via API', {
      analysisId,
      format,
      userId: req.user?.id
    });
  } catch (error) {
    logger.error('Failed to export root cause analysis via API', { 
      error, 
      analysisId: req.params.analysisId, 
      format: req.params.format 
    });
    res.status(500).json({
      error: 'Failed to export root cause analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get analysis frameworks
router.get('/rca/frameworks/all', async (req, res) => {
  try {
    const frameworks = await rootCauseAnalysisService.getFrameworks();

    res.json({
      success: true,
      frameworks
    });
  } catch (error) {
    logger.error('Failed to get analysis frameworks via API', { error });
    res.status(500).json({
      error: 'Failed to retrieve analysis frameworks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific framework
router.get('/rca/frameworks/:frameworkId', async (req, res) => {
  try {
    const { frameworkId } = req.params;
    const framework = await rootCauseAnalysisService.getFramework(frameworkId);

    if (!framework) {
      return res.status(404).json({ error: 'Analysis framework not found' });
    }

    res.json({
      success: true,
      framework
    });
  } catch (error) {
    logger.error('Failed to get analysis framework via API', { error, frameworkId: req.params.frameworkId });
    res.status(500).json({
      error: 'Failed to retrieve analysis framework',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recommended framework
router.get('/rca/frameworks/recommend/:category/:complexity/:timeAvailable', async (req, res) => {
  try {
    const { category, complexity, timeAvailable } = req.params;

    if (!['simple', 'moderate', 'complex'].includes(complexity)) {
      return res.status(400).json({
        error: 'Invalid complexity. Must be: simple, moderate, or complex'
      });
    }

    const timeLimit = parseInt(timeAvailable);
    if (isNaN(timeLimit) || timeLimit < 1) {
      return res.status(400).json({
        error: 'timeAvailable must be a positive number (minutes)'
      });
    }

    const framework = await rootCauseAnalysisService.getRecommendedFramework(
      category,
      complexity as 'simple' | 'moderate' | 'complex',
      timeLimit
    );

    res.json({
      success: true,
      framework
    });
  } catch (error) {
    logger.error('Failed to get recommended framework via API', { 
      error, 
      category: req.params.category,
      complexity: req.params.complexity,
      timeAvailable: req.params.timeAvailable
    });
    res.status(500).json({
      error: 'Failed to get recommended framework',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get analysis insights
router.get('/rca/insights/:ticketIds?', async (req, res) => {
  try {
    const { ticketIds } = req.params;
    const ticketIdArray = ticketIds ? ticketIds.split(',') : undefined;
    
    const insights = await rootCauseAnalysisService.generateAnalysisInsights(ticketIdArray);

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    logger.error('Failed to get analysis insights via API', { error, ticketIds: req.params.ticketIds });
    res.status(500).json({
      error: 'Failed to retrieve analysis insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get analyses by user
router.get('/rca/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const analyses = await rootCauseAnalysisService.getAnalysesByUser(userId);

    res.json({
      success: true,
      analyses
    });
  } catch (error) {
    logger.error('Failed to get analyses by user via API', { error, userId: req.params.userId });
    res.status(500).json({
      error: 'Failed to retrieve user analyses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get analyses for review
router.get('/rca/review/pending', async (req, res) => {
  try {
    const analyses = await rootCauseAnalysisService.getAnalysesForReview();

    res.json({
      success: true,
      analyses
    });
  } catch (error) {
    logger.error('Failed to get analyses for review via API', { error });
    res.status(500).json({
      error: 'Failed to retrieve analyses for review',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Testing Verification Management Routes

// Create test suite
router.post('/testing/suite', async (req, res) => {
  try {
    const { name, description, ticketId, createdBy } = req.body;

    if (!name || !ticketId) {
      return res.status(400).json({
        error: 'Name and ticketId are required'
      });
    }

    const suiteId = await testingVerificationService.createTestSuite(
      name,
      description || '',
      ticketId,
      createdBy || req.user?.id || 'Unknown',
      req.user?.id || 'unknown'
    );

    logger.info('Created test suite via API', {
      suiteId,
      name,
      ticketId,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      suiteId,
      message: 'Test suite created successfully'
    });
  } catch (error) {
    logger.error('Failed to create test suite via API', { error, body: req.body });
    res.status(500).json({
      error: 'Failed to create test suite',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get test suite by ID
router.get('/testing/suite/:suiteId', async (req, res) => {
  try {
    const { suiteId } = req.params;
    const testSuite = await testingVerificationService.getTestSuite(suiteId);

    if (!testSuite) {
      return res.status(404).json({ error: 'Test suite not found' });
    }

    res.json({
      success: true,
      testSuite
    });
  } catch (error) {
    logger.error('Failed to get test suite via API', { error, suiteId: req.params.suiteId });
    res.status(500).json({
      error: 'Failed to retrieve test suite',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get test suite by ticket ID
router.get('/testing/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const testSuite = await testingVerificationService.getTestSuiteByTicket(ticketId);

    res.json({
      success: true,
      testSuite
    });
  } catch (error) {
    logger.error('Failed to get test suite by ticket via API', { error, ticketId: req.params.ticketId });
    res.status(500).json({
      error: 'Failed to retrieve test suite',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add test case to suite
router.post('/testing/suite/:suiteId/testcase', async (req, res) => {
  try {
    const { suiteId } = req.params;
    const {
      description,
      testType,
      procedure = [],
      expectedResult,
      priority = 'medium',
      prerequisites = []
    } = req.body;

    if (!description || !testType || !expectedResult) {
      return res.status(400).json({
        error: 'Description, testType, and expectedResult are required'
      });
    }

    const testCaseId = await testingVerificationService.addTestCase(suiteId, {
      description,
      testType,
      procedure,
      expectedResult,
      status: 'pending',
      priority,
      prerequisites
    });

    logger.info('Added test case to suite via API', {
      suiteId,
      testCaseId,
      testType,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      testCaseId,
      message: 'Test case added successfully'
    });
  } catch (error) {
    logger.error('Failed to add test case via API', { error, suiteId: req.params.suiteId });
    res.status(500).json({
      error: 'Failed to add test case',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update test case
router.put('/testing/suite/:suiteId/testcase/:testCaseId', async (req, res) => {
  try {
    const { suiteId, testCaseId } = req.params;
    const updates = req.body;

    await testingVerificationService.updateTestCase(suiteId, testCaseId, updates);

    logger.info('Updated test case via API', {
      suiteId,
      testCaseId,
      updatedFields: Object.keys(updates),
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Test case updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update test case via API', { 
      error, 
      suiteId: req.params.suiteId, 
      testCaseId: req.params.testCaseId 
    });
    res.status(500).json({
      error: 'Failed to update test case',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Remove test case
router.delete('/testing/suite/:suiteId/testcase/:testCaseId', async (req, res) => {
  try {
    const { suiteId, testCaseId } = req.params;

    await testingVerificationService.removeTestCase(suiteId, testCaseId);

    logger.info('Removed test case via API', {
      suiteId,
      testCaseId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Test case removed successfully'
    });
  } catch (error) {
    logger.error('Failed to remove test case via API', { 
      error, 
      suiteId: req.params.suiteId, 
      testCaseId: req.params.testCaseId 
    });
    res.status(500).json({
      error: 'Failed to remove test case',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start test execution
router.post('/testing/suite/:suiteId/testcase/:testCaseId/start', async (req, res) => {
  try {
    const { suiteId, testCaseId } = req.params;
    const { executedBy, environment } = req.body;

    const executionId = await testingVerificationService.startTestExecution(
      suiteId,
      testCaseId,
      executedBy || req.user?.id || 'Unknown',
      environment
    );

    logger.info('Started test execution via API', {
      executionId,
      suiteId,
      testCaseId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      executionId,
      message: 'Test execution started successfully'
    });
  } catch (error) {
    logger.error('Failed to start test execution via API', { 
      error, 
      suiteId: req.params.suiteId, 
      testCaseId: req.params.testCaseId 
    });
    res.status(500).json({
      error: 'Failed to start test execution',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete test execution
router.post('/testing/execution/:executionId/complete', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { status, actualResult, evidence, notes } = req.body;

    if (!status || !['passed', 'failed', 'blocked'].includes(status)) {
      return res.status(400).json({
        error: 'Valid status is required (passed, failed, or blocked)'
      });
    }

    await testingVerificationService.completeTestExecution(
      executionId,
      status,
      actualResult,
      evidence,
      notes
    );

    logger.info('Completed test execution via API', {
      executionId,
      status,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Test execution completed successfully'
    });
  } catch (error) {
    logger.error('Failed to complete test execution via API', { 
      error, 
      executionId: req.params.executionId 
    });
    res.status(500).json({
      error: 'Failed to complete test execution',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get test metrics
router.get('/testing/suite/:suiteId/metrics', async (req, res) => {
  try {
    const { suiteId } = req.params;
    const metrics = await testingVerificationService.getTestMetrics(suiteId);

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error('Failed to get test metrics via API', { error, suiteId: req.params.suiteId });
    res.status(500).json({
      error: 'Failed to retrieve test metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get test templates
router.get('/testing/templates', async (req, res) => {
  try {
    const templates = await testingVerificationService.getTestTemplates();

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Failed to get test templates via API', { error });
    res.status(500).json({
      error: 'Failed to retrieve test templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific test template
router.get('/testing/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await testingVerificationService.getTestTemplate(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Test template not found' });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Failed to get test template via API', { error, templateId: req.params.templateId });
    res.status(500).json({
      error: 'Failed to retrieve test template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create test case from template
router.post('/testing/suite/:suiteId/testcase/from-template/:templateId', async (req, res) => {
  try {
    const { suiteId, templateId } = req.params;
    const customization = req.body;

    const testCaseId = await testingVerificationService.createTestCaseFromTemplate(
      suiteId,
      templateId,
      customization
    );

    logger.info('Created test case from template via API', {
      suiteId,
      templateId,
      testCaseId,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      testCaseId,
      message: 'Test case created from template successfully'
    });
  } catch (error) {
    logger.error('Failed to create test case from template via API', { 
      error, 
      suiteId: req.params.suiteId, 
      templateId: req.params.templateId 
    });
    res.status(500).json({
      error: 'Failed to create test case from template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export test suite
router.get('/testing/suite/:suiteId/export/:format', async (req, res) => {
  try {
    const { suiteId, format } = req.params;

    if (!['json', 'csv', 'html'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid export format. Supported formats: json, csv, html'
      });
    }

    const exportedContent = await testingVerificationService.exportTestSuite(
      suiteId,
      format as 'json' | 'csv' | 'html'
    );

    // Set appropriate content type and filename
    let contentType = 'text/plain';
    let fileExtension = 'txt';
    
    switch (format) {
      case 'json':
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'csv':
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'html':
        contentType = 'text/html';
        fileExtension = 'html';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="test_suite_${suiteId}.${fileExtension}"`);
    res.send(exportedContent);

    logger.info('Exported test suite via API', {
      suiteId,
      format,
      userId: req.user?.id
    });
  } catch (error) {
    logger.error('Failed to export test suite via API', { 
      error, 
      suiteId: req.params.suiteId, 
      format: req.params.format 
    });
    res.status(500).json({
      error: 'Failed to export test suite',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete test suite
router.delete('/testing/suite/:suiteId', async (req, res) => {
  try {
    const { suiteId } = req.params;

    await testingVerificationService.deleteTestSuite(suiteId);

    logger.info('Deleted test suite via API', {
      suiteId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Test suite deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete test suite via API', { error, suiteId: req.params.suiteId });
    res.status(500).json({
      error: 'Failed to delete test suite',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Time Tracking Management Routes

// Start time tracking session
router.post('/time/session/start', async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    const sessionId = await timeTrackingService.startSession(ticketId, req.user?.id || 'unknown');

    logger.info('Started time tracking session via API', {
      sessionId,
      ticketId,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      sessionId,
      message: 'Time tracking session started successfully'
    });
  } catch (error) {
    logger.error('Failed to start time tracking session via API', { error, body: req.body });
    res.status(500).json({
      error: 'Failed to start time tracking session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// End time tracking session
router.post('/time/session/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;

    await timeTrackingService.endSession(sessionId);

    logger.info('Ended time tracking session via API', {
      sessionId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Time tracking session ended successfully'
    });
  } catch (error) {
    logger.error('Failed to end time tracking session via API', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      error: 'Failed to end time tracking session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Pause time tracking session
router.post('/time/session/:sessionId/pause', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    await timeTrackingService.pauseSession(sessionId, reason);

    logger.info('Paused time tracking session via API', {
      sessionId,
      reason,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Time tracking session paused successfully'
    });
  } catch (error) {
    logger.error('Failed to pause time tracking session via API', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      error: 'Failed to pause time tracking session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Resume time tracking session
router.post('/time/session/:sessionId/resume', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { phase } = req.body;

    await timeTrackingService.resumeSession(sessionId, phase);

    logger.info('Resumed time tracking session via API', {
      sessionId,
      phase,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Time tracking session resumed successfully'
    });
  } catch (error) {
    logger.error('Failed to resume time tracking session via API', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      error: 'Failed to resume time tracking session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Change tracking phase
router.post('/time/session/:sessionId/change-phase', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { newPhase, description } = req.body;

    if (!newPhase) {
      return res.status(400).json({ error: 'New phase is required' });
    }

    if (!['investigation', 'analysis', 'implementation', 'testing', 'documentation', 'communication'].includes(newPhase)) {
      return res.status(400).json({
        error: 'Invalid phase. Must be: investigation, analysis, implementation, testing, documentation, or communication'
      });
    }

    await timeTrackingService.changePhase(sessionId, newPhase, description);

    logger.info('Changed tracking phase via API', {
      sessionId,
      newPhase,
      description,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Tracking phase changed successfully'
    });
  } catch (error) {
    logger.error('Failed to change tracking phase via API', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      error: 'Failed to change tracking phase',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get time tracking session
router.get('/time/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await timeTrackingService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Time tracking session not found' });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    logger.error('Failed to get time tracking session via API', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      error: 'Failed to retrieve time tracking session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get time tracking session by ticket
router.get('/time/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const session = await timeTrackingService.getSessionByTicket(ticketId);

    res.json({
      success: true,
      session
    });
  } catch (error) {
    logger.error('Failed to get time tracking session by ticket via API', { error, ticketId: req.params.ticketId });
    res.status(500).json({
      error: 'Failed to retrieve time tracking session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get resolution metrics
router.get('/time/ticket/:ticketId/metrics', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const metrics = await timeTrackingService.getResolutionMetrics(ticketId);

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error('Failed to get resolution metrics via API', { error, ticketId: req.params.ticketId });
    res.status(500).json({
      error: 'Failed to retrieve resolution metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get time analytics for user
router.get('/time/analytics/:userId/:period?', async (req, res) => {
  try {
    const { userId, period = 'week' } = req.params;

    if (!['day', 'week', 'month', 'quarter'].includes(period)) {
      return res.status(400).json({
        error: 'Invalid period. Must be: day, week, month, or quarter'
      });
    }

    const analytics = await timeTrackingService.getTimeAnalytics(
      userId,
      period as 'day' | 'week' | 'month' | 'quarter'
    );

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Failed to get time analytics via API', { error, userId: req.params.userId, period: req.params.period });
    res.status(500).json({
      error: 'Failed to retrieve time analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Record interruption
router.post('/time/entry/:entryId/interruption', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { description } = req.body;

    await timeTrackingService.recordInterruption(entryId, description);

    logger.info('Recorded interruption via API', {
      entryId,
      description,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Interruption recorded successfully'
    });
  } catch (error) {
    logger.error('Failed to record interruption via API', { error, entryId: req.params.entryId });
    res.status(500).json({
      error: 'Failed to record interruption',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export time data
router.get('/time/session/:sessionId/export/:format', async (req, res) => {
  try {
    const { sessionId, format } = req.params;

    if (!['json', 'csv', 'summary'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid export format. Supported formats: json, csv, summary'
      });
    }

    const exportedContent = await timeTrackingService.exportTimeData(
      sessionId,
      format as 'json' | 'csv' | 'summary'
    );

    // Set appropriate content type and filename
    let contentType = 'text/plain';
    let fileExtension = 'txt';
    
    switch (format) {
      case 'json':
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'csv':
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'summary':
        contentType = 'text/markdown';
        fileExtension = 'md';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="time_tracking_${sessionId}.${fileExtension}"`);
    res.send(exportedContent);

    logger.info('Exported time data via API', {
      sessionId,
      format,
      userId: req.user?.id
    });
  } catch (error) {
    logger.error('Failed to export time data via API', { 
      error, 
      sessionId: req.params.sessionId, 
      format: req.params.format 
    });
    res.status(500).json({
      error: 'Failed to export time data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete time tracking session
router.delete('/time/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    await timeTrackingService.deleteSession(sessionId);

    logger.info('Deleted time tracking session via API', {
      sessionId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Time tracking session deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete time tracking session via API', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      error: 'Failed to delete time tracking session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;