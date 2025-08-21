import { describe, test, expect, beforeEach, jest } from '@jest/jest';
import { SearchIntegrationService, TicketContext } from '../../src/services/searchIntegrationService';

describe('SearchIntegrationService', () => {
  let service: SearchIntegrationService;

  beforeEach(() => {
    service = new SearchIntegrationService();
  });

  describe('performIntegratedSearch', () => {
    test('should perform basic search without context', async () => {
      const results = await service.performIntegratedSearch('printer issues', {});
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
      
      // Check result structure
      if (results.length > 0) {
        const result = results[0];
        expect(result.id).toBeDefined();
        expect(result.title).toBeDefined();
        expect(result.snippet).toBeDefined();
        expect(result.url).toBeDefined();
        expect(result.source).toBeDefined();
        expect(result.credibilityLevel).toMatch(/^(high|medium|low)$/);
      }
    });

    test('should perform contextual search with ticket context', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'TICKET-123',
        issueType: 'printer connection issues',
        description: 'User cannot print to network printer',
        customerEnvironment: 'Windows 10',
        priority: 'medium'
      };

      const results = await service.performIntegratedSearch(
        'printer troubleshooting',
        {},
        ticketContext
      );

      expect(Array.isArray(results)).toBe(true);
      
      // Results should have relevanceToTicket when context is provided
      if (results.length > 0) {
        results.forEach(result => {
          expect(result.relevanceToTicket).toBeDefined();
          expect(typeof result.relevanceToTicket).toBe('number');
          expect(result.relevanceToTicket).toBeGreaterThanOrEqual(0);
          expect(result.relevanceToTicket).toBeLessThanOrEqual(1);
        });
      }
    });

    test('should apply filters correctly', async () => {
      const filters = {
        credibility: 'high' as const,
        sourceType: 'official'
      };

      const results = await service.performIntegratedSearch(
        'network issues',
        filters
      );

      // All results should match the filter criteria
      results.forEach(result => {
        expect(result.credibilityLevel).toBe('high');
        expect(result.sourceType).toBe('official');
      });
    });

    test('should handle empty query', async () => {
      const results = await service.performIntegratedSearch('', {});
      expect(Array.isArray(results)).toBe(true);
      // Should return empty or limited results for empty query
    });
  });

  describe('performContextualSearch', () => {
    test('should perform contextual search with enhanced query', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'TICKET-456',
        issueType: 'VPN connection failure',
        description: 'Cannot connect to corporate VPN',
        customerEnvironment: 'Windows 10',
        errorCode: 'VPN-809'
      };

      const results = await service.performContextualSearch(
        'vpn issues',
        ticketContext,
        { minRelevanceThreshold: 0.3 }
      );

      expect(Array.isArray(results)).toBe(true);
      
      // All results should meet the minimum relevance threshold
      results.forEach(result => {
        expect(result.relevanceToTicket).toBeGreaterThanOrEqual(0.3);
      });
    });

    test('should limit results based on config', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'TICKET-789',
        issueType: 'email configuration',
        customerEnvironment: 'Outlook 2019'
      };

      const results = await service.performContextualSearch(
        'email setup',
        ticketContext,
        { maxResults: 3 }
      );

      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('extractTicketContext', () => {
    test('should extract keywords from ticket context', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'TICKET-123',
        issueType: 'printer connection problems',
        description: 'HP LaserJet printer not responding on network',
        customerEnvironment: 'Windows 10 Enterprise',
        tags: ['printer', 'network', 'hardware']
      };

      const extraction = await service.extractTicketContext(ticketContext);

      expect(extraction.keywords).toBeDefined();
      expect(Array.isArray(extraction.keywords)).toBe(true);
      expect(extraction.keywords.length).toBeGreaterThan(0);
      
      // Should contain relevant keywords
      expect(extraction.keywords).toContain('printer');
      expect(extraction.keywords).toContain('network');
    });

    test('should identify entities in ticket context', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'TICKET-456',
        issueType: 'Windows 10 update error',
        description: 'Error 0x80070005 during Windows update installation',
        errorCode: '0x80070005'
      };

      const extraction = await service.extractTicketContext(ticketContext);

      expect(extraction.entities).toBeDefined();
      expect(Array.isArray(extraction.entities)).toBe(true);
      
      // Should identify Windows as a product entity
      const productEntities = extraction.entities.filter(e => e.type === 'product');
      expect(productEntities.length).toBeGreaterThan(0);
      
      // Should identify error code as error entity
      const errorEntities = extraction.entities.filter(e => e.type === 'error');
      expect(errorEntities.length).toBeGreaterThan(0);
    });

    test('should determine urgency correctly', async () => {
      const urgentContext: TicketContext = {
        ticketId: 'TICKET-789',
        issueType: 'server outage',
        priority: 'critical',
        description: 'Production server is down, urgent fix needed'
      };

      const extraction = await service.extractTicketContext(urgentContext);
      expect(extraction.urgency).toBe('critical');
    });

    test('should assess technical level', async () => {
      const technicalContext: TicketContext = {
        ticketId: 'TICKET-101',
        issueType: 'PowerShell script error',
        description: 'Registry modification script failing with LDAP authentication error'
      };

      const extraction = await service.extractTicketContext(technicalContext);
      expect(extraction.technicalLevel).toBe('expert');
    });

    test('should generate suggested queries', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'TICKET-202',
        issueType: 'email synchronization issue',
        customerEnvironment: 'Exchange Online'
      };

      const extraction = await service.extractTicketContext(ticketContext);
      
      expect(extraction.suggestedQueries).toBeDefined();
      expect(Array.isArray(extraction.suggestedQueries)).toBe(true);
      expect(extraction.suggestedQueries.length).toBeGreaterThan(0);
      
      // Should contain relevant query suggestions
      expect(extraction.suggestedQueries.some(q => 
        q.toLowerCase().includes('email')
      )).toBe(true);
    });
  });

  describe('prioritizeResults', () => {
    test('should prioritize results based on context relevance', async () => {
      const mockResults = [
        {
          id: 'result-1',
          title: 'General Windows Troubleshooting',
          snippet: 'Basic Windows troubleshooting steps',
          url: 'https://example.com/windows',
          source: 'Microsoft Docs',
          sourceType: 'official' as const,
          credibilityLevel: 'high' as const,
          credibilityScore: 0.9,
          date: '2024-01-01',
          position: 1,
          relevanceScore: 0.5,
          tags: ['windows', 'troubleshooting']
        },
        {
          id: 'result-2',
          title: 'VPN Connection Issues in Windows 10',
          snippet: 'Specific VPN troubleshooting for Windows 10',
          url: 'https://example.com/vpn-win10',
          source: 'Tech Support',
          sourceType: 'official' as const,
          credibilityLevel: 'high' as const,
          credibilityScore: 0.85,
          date: '2024-01-01',
          position: 2,
          relevanceScore: 0.7,
          tags: ['vpn', 'windows10', 'connection']
        }
      ];

      const ticketContext: TicketContext = {
        ticketId: 'TICKET-303',
        issueType: 'VPN connection failure',
        customerEnvironment: 'Windows 10'
      };

      const prioritized = await service.prioritizeResults(mockResults, ticketContext);

      expect(prioritized.length).toBe(2);
      
      // Results should be sorted by relevance to ticket
      expect(prioritized[0].relevanceToTicket).toBeGreaterThanOrEqual(
        prioritized[1].relevanceToTicket || 0
      );
      
      // VPN-specific result should be prioritized higher
      expect(prioritized[0].id).toBe('result-2');
    });

    test('should add context matches to results', async () => {
      const mockResults = [
        {
          id: 'result-1',
          title: 'Email Configuration Guide',
          snippet: 'How to configure Outlook for Exchange',
          url: 'https://example.com/email',
          source: 'Microsoft',
          sourceType: 'official' as const,
          credibilityLevel: 'high' as const,
          credibilityScore: 0.9,
          date: '2024-01-01',
          position: 1,
          relevanceScore: 0.8,
          tags: ['email', 'outlook', 'exchange']
        }
      ];

      const ticketContext: TicketContext = {
        ticketId: 'TICKET-404',
        issueType: 'Outlook email setup',
        customerEnvironment: 'Exchange Online'
      };

      const prioritized = await service.prioritizeResults(mockResults, ticketContext);

      expect(prioritized[0].contextMatches).toBeDefined();
      expect(Array.isArray(prioritized[0].contextMatches)).toBe(true);
      expect(prioritized[0].contextMatches?.length).toBeGreaterThan(0);
    });
  });

  describe('Session Management', () => {
    test('should start and manage search session', async () => {
      const session = await service.startSearchSession('TICKET-505');
      
      expect(session.sessionId).toBeDefined();
      expect(session.ticketId).toBe('TICKET-505');
      expect(session.isActive).toBe(true);
      expect(session.searchHistory).toEqual([]);
    });

    test('should end search session', async () => {
      const session = await service.startSearchSession('TICKET-606');
      
      // Wait a bit to ensure duration calculation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const endedSession = await service.endSearchSession(session.sessionId);
      
      expect(endedSession).not.toBeNull();
      expect(endedSession?.isActive).toBe(false);
      expect(endedSession?.endTime).toBeDefined();
      expect(endedSession?.duration).toBeGreaterThan(0);
    });

    test('should return null when ending non-existent session', async () => {
      const result = await service.endSearchSession('non-existent-session');
      expect(result).toBeNull();
    });

    test('should get existing session', async () => {
      const session = await service.startSearchSession('TICKET-707');
      const retrievedSession = await service.getSearchSession(session.sessionId);
      
      expect(retrievedSession).not.toBeNull();
      expect(retrievedSession?.sessionId).toBe(session.sessionId);
    });
  });

  describe('Cache Management', () => {
    test('should clear search cache', async () => {
      // Perform a search to populate cache
      await service.performIntegratedSearch('test query', {});
      
      // Clear cache should not throw
      await expect(service.clearSearchCache()).resolves.not.toThrow();
    });

    test('should return search metrics', async () => {
      const metrics = await service.getSearchMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.activeSessions).toBe('number');
      expect(typeof metrics.cacheSize).toBe('number');
      expect(typeof metrics.contextCacheSize).toBe('number');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid ticket context gracefully', async () => {
      const invalidContext = {} as TicketContext;
      
      // Should not throw, but return meaningful results
      await expect(service.extractTicketContext(invalidContext)).resolves.toBeDefined();
    });

    test('should handle empty search results', async () => {
      // Search for something that won't match
      const results = await service.performIntegratedSearch('xyzabc123nonexistent', {});
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should handle prioritization with empty results', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'TICKET-808',
        issueType: 'test issue'
      };

      const prioritized = await service.prioritizeResults([], ticketContext);
      expect(prioritized).toEqual([]);
    });
  });

  describe('Performance', () => {
    test('should complete search within reasonable time', async () => {
      const startTime = Date.now();
      
      await service.performIntegratedSearch('performance test query', {});
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should cache search results', async () => {
      const query = 'cache test query';
      const filters = {};
      
      // First search
      const startTime1 = Date.now();
      await service.performIntegratedSearch(query, filters);
      const duration1 = Date.now() - startTime1;
      
      // Second identical search (should be cached)
      const startTime2 = Date.now();
      await service.performIntegratedSearch(query, filters);
      const duration2 = Date.now() - startTime2;
      
      // Second search should be significantly faster due to caching
      expect(duration2).toBeLessThan(duration1);
    });
  });
});