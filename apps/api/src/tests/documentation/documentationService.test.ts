import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import documentationService, { DocumentationTemplate, DocumentationContent } from '../../services/documentationService';

describe('DocumentationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Template Management', () => {
    test('should create a new documentation template', async () => {
      const templateData: Partial<DocumentationTemplate> = {
        name: 'Test Template',
        description: 'A test template for documentation',
        type: 'ticket-resolution',
        sections: [
          {
            id: 'problem-summary',
            title: 'Problem Summary',
            description: 'Brief description of the issue',
            required: true,
            placeholder: 'Enter problem summary',
            validation: {
              minLength: 10,
              maxLength: 200
            }
          }
        ]
      };

      const result = await documentationService.createTemplate(templateData as DocumentationTemplate);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(templateData.name);
      expect(result.description).toBe(templateData.description);
      expect(result.type).toBe(templateData.type);
      expect(result.sections).toHaveLength(1);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test('should get template by ID', async () => {
      const templateData: Partial<DocumentationTemplate> = {
        name: 'Test Template',
        description: 'A test template',
        type: 'ticket-resolution',
        sections: []
      };

      const created = await documentationService.createTemplate(templateData as DocumentationTemplate);
      const retrieved = await documentationService.getTemplate(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(created.name);
    });

    test('should return null for non-existent template', async () => {
      const result = await documentationService.getTemplate('non-existent-id');
      expect(result).toBeNull();
    });

    test('should update existing template', async () => {
      const templateData: Partial<DocumentationTemplate> = {
        name: 'Original Template',
        description: 'Original description',
        type: 'ticket-resolution',
        sections: []
      };

      const created = await documentationService.createTemplate(templateData as DocumentationTemplate);
      
      const updates = {
        name: 'Updated Template',
        description: 'Updated description'
      };

      const updated = await documentationService.updateTemplate(created.id, updates);

      expect(updated).toBeDefined();
      expect(updated.name).toBe(updates.name);
      expect(updated.description).toBe(updates.description);
      expect(updated.updatedAt).toBeInstanceOf(Date);
    });

    test('should delete template', async () => {
      const templateData: Partial<DocumentationTemplate> = {
        name: 'Template to Delete',
        description: 'Will be deleted',
        type: 'ticket-resolution',
        sections: []
      };

      const created = await documentationService.createTemplate(templateData as DocumentationTemplate);
      const deleted = await documentationService.deleteTemplate(created.id);

      expect(deleted).toBe(true);

      const retrieved = await documentationService.getTemplate(created.id);
      expect(retrieved).toBeNull();
    });

    test('should list all templates', async () => {
      // Create multiple templates
      const template1 = await documentationService.createTemplate({
        name: 'Template 1',
        description: 'First template',
        type: 'ticket-resolution',
        sections: []
      } as DocumentationTemplate);

      const template2 = await documentationService.createTemplate({
        name: 'Template 2', 
        description: 'Second template',
        type: 'escalation',
        sections: []
      } as DocumentationTemplate);

      const templates = await documentationService.listTemplates();

      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThanOrEqual(2);
      
      const templateIds = templates.map(t => t.id);
      expect(templateIds).toContain(template1.id);
      expect(templateIds).toContain(template2.id);
    });
  });

  describe('Documentation Content Management', () => {
    let templateId: string;

    beforeEach(async () => {
      const template = await documentationService.createTemplate({
        name: 'Test Template',
        description: 'Template for testing',
        type: 'ticket-resolution',
        sections: [
          {
            id: 'problem-summary',
            title: 'Problem Summary',
            description: 'Brief description',
            required: true,
            placeholder: 'Enter summary',
            validation: { minLength: 10, maxLength: 200 }
          },
          {
            id: 'solution-steps',
            title: 'Solution Steps',
            description: 'Implementation steps',
            required: true,
            placeholder: 'Enter steps',
            validation: { minLength: 20 }
          }
        ]
      } as DocumentationTemplate);
      templateId = template.id;
    });

    test('should create documentation content', async () => {
      const contentData: Partial<DocumentationContent> = {
        templateId,
        ticketId: 'TICKET-001',
        title: 'Test Documentation',
        content: {
          'problem-summary': 'User cannot access network drive',
          'solution-steps': '1. Checked network connectivity\n2. Verified permissions\n3. Restarted service'
        }
      };

      const result = await documentationService.createDocumentation(contentData as DocumentationContent);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.templateId).toBe(templateId);
      expect(result.ticketId).toBe('TICKET-001');
      expect(result.title).toBe('Test Documentation');
      expect(result.content['problem-summary']).toBe('User cannot access network drive');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test('should validate required fields', async () => {
      const contentData: Partial<DocumentationContent> = {
        templateId,
        ticketId: 'TICKET-002',
        title: 'Incomplete Documentation',
        content: {
          'problem-summary': 'Short' // Too short based on validation
        }
        // Missing required 'solution-steps'
      };

      const validation = await documentationService.validateDocumentation(contentData as DocumentationContent);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(2);
      
      const errorMessages = validation.errors.map(e => e.message);
      expect(errorMessages).toContain('problem-summary: Minimum length is 10 characters');
      expect(errorMessages).toContain('solution-steps: This field is required');
    });

    test('should update documentation content', async () => {
      const contentData: Partial<DocumentationContent> = {
        templateId,
        ticketId: 'TICKET-003',
        title: 'Original Documentation',
        content: {
          'problem-summary': 'Original problem description that meets minimum length',
          'solution-steps': 'Original solution steps that are detailed enough'
        }
      };

      const created = await documentationService.createDocumentation(contentData as DocumentationContent);
      
      const updates = {
        title: 'Updated Documentation',
        content: {
          'problem-summary': 'Updated problem description that meets minimum length requirements',
          'solution-steps': 'Updated solution steps with more comprehensive details'
        }
      };

      const updated = await documentationService.updateDocumentation(created.id, updates);

      expect(updated).toBeDefined();
      expect(updated.title).toBe(updates.title);
      expect(updated.content['problem-summary']).toBe(updates.content['problem-summary']);
      expect(updated.updatedAt).toBeInstanceOf(Date);
    });

    test('should get documentation by ID', async () => {
      const contentData: Partial<DocumentationContent> = {
        templateId,
        ticketId: 'TICKET-004',
        title: 'Test Documentation',
        content: {
          'problem-summary': 'Problem description meeting minimum length',
          'solution-steps': 'Detailed solution steps for testing'
        }
      };

      const created = await documentationService.createDocumentation(contentData as DocumentationContent);
      const retrieved = await documentationService.getDocumentation(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe(created.title);
    });

    test('should search documentation by ticket ID', async () => {
      const ticketId = 'TICKET-SEARCH-001';
      
      const contentData: Partial<DocumentationContent> = {
        templateId,
        ticketId,
        title: 'Searchable Documentation',
        content: {
          'problem-summary': 'Problem description for search testing purposes',
          'solution-steps': 'Solution steps for the searchable documentation'
        }
      };

      await documentationService.createDocumentation(contentData as DocumentationContent);
      
      const results = await documentationService.searchDocumentation({ ticketId });

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].ticketId).toBe(ticketId);
    });

    test('should export documentation to different formats', async () => {
      const contentData: Partial<DocumentationContent> = {
        templateId,
        ticketId: 'TICKET-EXPORT-001',
        title: 'Export Test Documentation',
        content: {
          'problem-summary': 'Problem description for export testing functionality',
          'solution-steps': 'Solution steps that will be exported to various formats'
        }
      };

      const created = await documentationService.createDocumentation(contentData as DocumentationContent);

      // Test Markdown export
      const markdownExport = await documentationService.exportDocumentation(created.id, 'markdown');
      expect(markdownExport).toContain('# Export Test Documentation');
      expect(markdownExport).toContain('## Problem Summary');
      expect(markdownExport).toContain('Problem description for export testing');

      // Test HTML export
      const htmlExport = await documentationService.exportDocumentation(created.id, 'html');
      expect(htmlExport).toContain('<h1>Export Test Documentation</h1>');
      expect(htmlExport).toContain('<h2>Problem Summary</h2>');

      // Test JSON export
      const jsonExport = await documentationService.exportDocumentation(created.id, 'json');
      const parsedJson = JSON.parse(jsonExport);
      expect(parsedJson.title).toBe('Export Test Documentation');
      expect(parsedJson.content['problem-summary']).toContain('Problem description');
    });
  });

  describe('Analytics and Reporting', () => {
    test('should generate documentation analytics', async () => {
      // Create test data
      const template = await documentationService.createTemplate({
        name: 'Analytics Template',
        description: 'Template for analytics testing',
        type: 'ticket-resolution',
        sections: []
      } as DocumentationTemplate);

      await documentationService.createDocumentation({
        templateId: template.id,
        ticketId: 'ANALYTICS-001',
        title: 'Analytics Test 1',
        content: {}
      } as DocumentationContent);

      await documentationService.createDocumentation({
        templateId: template.id,
        ticketId: 'ANALYTICS-002', 
        title: 'Analytics Test 2',
        content: {}
      } as DocumentationContent);

      const analytics = await documentationService.getDocumentationAnalytics({
        templateId: template.id,
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          end: new Date()
        }
      });

      expect(analytics).toBeDefined();
      expect(analytics.totalDocuments).toBeGreaterThanOrEqual(2);
      expect(analytics.byTemplate).toBeDefined();
      expect(analytics.byTemplate[template.id]).toBeGreaterThanOrEqual(2);
    });

    test('should track documentation usage metrics', async () => {
      const template = await documentationService.createTemplate({
        name: 'Metrics Template',
        description: 'Template for metrics testing',
        type: 'ticket-resolution',
        sections: []
      } as DocumentationTemplate);

      const doc = await documentationService.createDocumentation({
        templateId: template.id,
        ticketId: 'METRICS-001',
        title: 'Metrics Test',
        content: {}
      } as DocumentationContent);

      // Simulate usage tracking
      await documentationService.trackUsage(doc.id, 'view');
      await documentationService.trackUsage(doc.id, 'edit');
      await documentationService.trackUsage(doc.id, 'export');

      const metrics = await documentationService.getUsageMetrics(doc.id);

      expect(metrics).toBeDefined();
      expect(metrics.views).toBeGreaterThanOrEqual(1);
      expect(metrics.edits).toBeGreaterThanOrEqual(1);
      expect(metrics.exports).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid template data', async () => {
      const invalidTemplate = {
        // Missing required fields
        description: 'Invalid template'
      };

      await expect(
        documentationService.createTemplate(invalidTemplate as DocumentationTemplate)
      ).rejects.toThrow('Template name is required');
    });

    test('should handle invalid documentation data', async () => {
      const invalidContent = {
        // Missing required fields
        title: 'Invalid Content'
      };

      await expect(
        documentationService.createDocumentation(invalidContent as DocumentationContent)
      ).rejects.toThrow('Template ID is required');
    });

    test('should handle non-existent documentation update', async () => {
      await expect(
        documentationService.updateDocumentation('non-existent-id', { title: 'Updated' })
      ).rejects.toThrow('Documentation not found');
    });

    test('should handle invalid export format', async () => {
      const template = await documentationService.createTemplate({
        name: 'Export Template',
        description: 'Template for export testing',
        type: 'ticket-resolution',
        sections: []
      } as DocumentationTemplate);

      const doc = await documentationService.createDocumentation({
        templateId: template.id,
        ticketId: 'EXPORT-001',
        title: 'Export Test',
        content: {}
      } as DocumentationContent);

      await expect(
        documentationService.exportDocumentation(doc.id, 'invalid-format' as any)
      ).rejects.toThrow('Unsupported export format');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large content efficiently', async () => {
      const template = await documentationService.createTemplate({
        name: 'Performance Template',
        description: 'Template for performance testing',
        type: 'ticket-resolution',
        sections: []
      } as DocumentationTemplate);

      const largeContent = 'x'.repeat(10000); // Large content string

      const startTime = Date.now();
      
      const doc = await documentationService.createDocumentation({
        templateId: template.id,
        ticketId: 'PERF-001',
        title: 'Performance Test',
        content: {
          'large-field': largeContent
        }
      } as DocumentationContent);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(doc).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle concurrent operations', async () => {
      const template = await documentationService.createTemplate({
        name: 'Concurrent Template',
        description: 'Template for concurrency testing',
        type: 'ticket-resolution',
        sections: []
      } as DocumentationTemplate);

      // Create multiple documents concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        documentationService.createDocumentation({
          templateId: template.id,
          ticketId: `CONCURRENT-${i}`,
          title: `Concurrent Test ${i}`,
          content: {}
        } as DocumentationContent)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.ticketId).toBe(`CONCURRENT-${index}`);
      });
    });
  });
});