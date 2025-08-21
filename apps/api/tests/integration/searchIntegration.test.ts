import request from 'supertest';
import { describe, test, expect, beforeEach, afterEach } from '@jest/jest';
import app from '../../src/app';
import { SearchIntegrationService } from '../../src/services/searchIntegrationService';

describe('Search Integration API', () => {
  let searchService: SearchIntegrationService;

  beforeEach(() => {
    searchService = new SearchIntegrationService();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('POST /api/v1/search/integrated', () => {
    test('should perform integrated search successfully', async () => {
      const requestBody = {
        query: 'printer connection issues',
        filters: {
          credibility: 'high',
          sourceType: 'official'
        },
        ticketContext: {
          ticketId: 'TICKET-123',
          issueType: 'printer connection problems',
          customerEnvironment: 'Windows 10'
        }
      };

      const response = await request(app)
        .post('/api/v1/search/integrated')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.totalCount).toBeGreaterThanOrEqual(0);
      expect(response.body.hasTicketContext).toBe(true);
    });

    test('should fail with missing query', async () => {
      const response = await request(app)
        .post('/api/v1/search/integrated')
        .send({
          filters: {},
          ticketContext: {}
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Query is required');
    });

    test('should handle empty query gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/search/integrated')
        .send({
          query: '',
          filters: {},
          ticketContext: {
            ticketId: 'TICKET-123',
            issueType: 'general inquiry'
          }
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/search/contextual', () => {
    test('should perform contextual search with ticket context', async () => {
      const requestBody = {
        query: 'email configuration',
        ticketContext: {
          ticketId: 'TICKET-456',
          issueType: 'email setup problems',
          customerEnvironment: 'Outlook 2019',
          errorCode: 'SMTP-500'
        },
        config: {
          minRelevanceThreshold: 0.3,
          maxResults: 10
        }
      };

      const response = await request(app)
        .post('/api/v1/search/contextual')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();
      expect(response.body.contextScore).toBeGreaterThanOrEqual(0);
      expect(response.body.ticketId).toBe('TICKET-456');
    });

    test('should fail without ticket context', async () => {
      const response = await request(app)
        .post('/api/v1/search/contextual')
        .send({
          query: 'email issues'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Ticket context with ticketId is required');
    });
  });

  describe('POST /api/v1/search/extract-context', () => {
    test('should extract context from ticket information', async () => {
      const ticketContext = {
        ticketId: 'TICKET-789',
        issueType: 'VPN connection failure',
        description: 'User unable to connect to corporate VPN from Windows 10 machine',
        customerEnvironment: 'Windows 10 Enterprise',
        priority: 'high',
        errorCode: 'VPN-ERROR-809'
      };

      const response = await request(app)
        .post('/api/v1/search/extract-context')
        .send({ ticketContext })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.keywords).toBeDefined();
      expect(Array.isArray(response.body.keywords)).toBe(true);
      expect(response.body.entities).toBeDefined();
      expect(response.body.urgency).toBeDefined();
      expect(response.body.technicalLevel).toBeDefined();
      expect(response.body.suggestedQueries).toBeDefined();
    });

    test('should fail without ticket context', async () => {
      const response = await request(app)
        .post('/api/v1/search/extract-context')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/search/prioritize', () => {
    test('should prioritize search results based on ticket context', async () => {
      const mockResults = [
        {
          id: 'result-1',
          title: 'VPN Troubleshooting Guide',
          snippet: 'Complete guide for fixing VPN connection issues',
          url: 'https://docs.company.com/vpn-troubleshooting',
          source: 'Company Documentation',
          sourceType: 'official',
          credibilityLevel: 'high',
          credibilityScore: 0.95,
          date: '2024-01-15',
          position: 1,
          relevanceScore: 0.8
        },
        {
          id: 'result-2',
          title: 'Windows Network Issues',
          snippet: 'General network troubleshooting for Windows',
          url: 'https://support.microsoft.com/network',
          source: 'Microsoft Support',
          sourceType: 'official',
          credibilityLevel: 'high',
          credibilityScore: 0.9,
          date: '2024-01-10',
          position: 2,
          relevanceScore: 0.6
        }
      ];

      const response = await request(app)
        .post('/api/v1/search/prioritize')
        .send({
          results: mockResults,
          ticketContext: {
            ticketId: 'TICKET-789',
            issueType: 'VPN connection failure',
            customerEnvironment: 'Windows 10'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.prioritizedResults).toBeDefined();
      expect(Array.isArray(response.body.prioritizedResults)).toBe(true);
      expect(response.body.prioritizedResults.length).toBe(2);
      
      // Check that results have relevanceToTicket scores
      response.body.prioritizedResults.forEach((result: any) => {
        expect(result.relevanceToTicket).toBeDefined();
        expect(typeof result.relevanceToTicket).toBe('number');
      });
    });
  });

  describe('Session Management', () => {
    test('should start search session', async () => {
      const response = await request(app)
        .post('/api/v1/search/start-session')
        .send({ ticketId: 'TICKET-123' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.session).toBeDefined();
      expect(response.body.session.sessionId).toBeDefined();
      expect(response.body.session.ticketId).toBe('TICKET-123');
    });

    test('should get search session', async () => {
      // First create a session
      const createResponse = await request(app)
        .post('/api/v1/search/start-session')
        .send({ ticketId: 'TICKET-456' });

      const sessionId = createResponse.body.session.sessionId;

      // Then retrieve it
      const getResponse = await request(app)
        .get(`/api/v1/search/session/${sessionId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.session).toBeDefined();
      expect(getResponse.body.session.sessionId).toBe(sessionId);
    });

    test('should end search session', async () => {
      // Create session
      const createResponse = await request(app)
        .post('/api/v1/search/start-session')
        .send({ ticketId: 'TICKET-789' });

      const sessionId = createResponse.body.session.sessionId;

      // End session
      const endResponse = await request(app)
        .post('/api/v1/search/end-session')
        .send({ sessionId })
        .expect(200);

      expect(endResponse.body.success).toBe(true);
      expect(endResponse.body.session).toBeDefined();
      expect(endResponse.body.summary).toBeDefined();
      expect(endResponse.body.summary.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reference Management', () => {
    test('should save search result reference', async () => {
      const response = await request(app)
        .post('/api/v1/search/save-reference')
        .send({
          resultId: 'result-123',
          ticketId: 'TICKET-456',
          title: 'Test Reference',
          url: 'https://example.com/reference',
          snippet: 'This is a test reference snippet',
          credibilityLevel: 'high',
          notes: 'Additional notes about this reference'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.reference).toBeDefined();
      expect(response.body.reference.id).toBeDefined();
      expect(response.body.reference.resultId).toBe('result-123');
    });

    test('should fail to save reference without required fields', async () => {
      const response = await request(app)
        .post('/api/v1/search/save-reference')
        .send({
          title: 'Test Reference'
          // Missing resultId and ticketId
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('should get saved references for ticket', async () => {
      const response = await request(app)
        .get('/api/v1/search/references/TICKET-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.references).toBeDefined();
      expect(Array.isArray(response.body.references)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Tracking', () => {
    test('should track search events', async () => {
      const response = await request(app)
        .post('/api/v1/search/track-event')
        .send({
          type: 'search_performed',
          sessionId: 'session-123',
          ticketId: 'TICKET-456',
          data: {
            query: 'test query',
            resultCount: 5,
            duration: 1500
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tracked).toBe(true);
      expect(response.body.eventType).toBe('search_performed');
    });

    test('should fail to track event without type', async () => {
      const response = await request(app)
        .post('/api/v1/search/track-event')
        .send({
          sessionId: 'session-123',
          data: {}
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Metrics and Performance', () => {
    test('should get search metrics', async () => {
      const response = await request(app)
        .get('/api/v1/search/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.timestamp).toBeDefined();
      expect(response.body.metrics.uptime).toBeDefined();
    });

    test('should clear search cache', async () => {
      const response = await request(app)
        .post('/api/v1/search/clear-cache')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cleared');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/search/integrated')
        .send('invalid json')
        .expect(400);

      // The exact response will depend on your error handling middleware
      expect(response.body.success).toBeFalsy();
    });

    test('should handle missing endpoints gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/search/nonexistent-endpoint')
        .expect(404);
    });
  });
});