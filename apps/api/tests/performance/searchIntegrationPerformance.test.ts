import { describe, test, expect, beforeEach } from '@jest/jest';
import { SearchIntegrationService, TicketContext } from '../../src/services/searchIntegrationService';
import { WorkflowOptimizerService } from '../../src/services/workflowOptimizerService';
import { SessionManagerService } from '../../src/services/sessionManagerService';

describe('Search Integration Performance Tests', () => {
  let searchService: SearchIntegrationService;
  let workflowService: WorkflowOptimizerService;
  let sessionService: SessionManagerService;

  beforeEach(() => {
    searchService = new SearchIntegrationService();
    workflowService = new WorkflowOptimizerService();
    sessionService = new SessionManagerService();
  });

  describe('Search Performance', () => {
    test('basic search should complete within 200ms', async () => {
      const startTime = Date.now();
      
      await searchService.performIntegratedSearch('test query', {});
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200);
    });

    test('contextual search should complete within 500ms', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'PERF-TEST-001',
        issueType: 'performance test issue',
        description: 'This is a test for performance measurement',
        customerEnvironment: 'Windows 10',
        priority: 'medium'
      };

      const startTime = Date.now();
      
      await searchService.performContextualSearch(
        'performance test query',
        ticketContext,
        { maxResults: 10 }
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    test('context extraction should complete within 100ms', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'PERF-TEST-002',
        issueType: 'complex technical issue with multiple components',
        description: 'User experiencing intermittent network connectivity issues when connecting to Exchange Server via Outlook client on Windows 10 Enterprise with error code 0x80072746',
        customerEnvironment: 'Windows 10 Enterprise, Outlook 2019, Exchange Server 2019',
        errorCode: '0x80072746',
        tags: ['network', 'outlook', 'exchange', 'connectivity'],
        priority: 'high'
      };

      const startTime = Date.now();
      
      await searchService.extractTicketContext(ticketContext);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    test('result prioritization should complete within 50ms', async () => {
      // Create mock results array
      const mockResults = Array.from({ length: 50 }, (_, index) => ({
        id: `result-${index}`,
        title: `Test Result ${index}`,
        snippet: `This is test result number ${index} with some relevant content`,
        url: `https://example.com/result-${index}`,
        source: `Source ${index % 5}`,
        sourceType: 'official' as const,
        credibilityLevel: 'high' as const,
        credibilityScore: 0.8 + (index % 2) * 0.1,
        date: '2024-01-01',
        position: index + 1,
        relevanceScore: 0.5 + (index % 5) * 0.1,
        tags: [`tag${index % 3}`, `category${index % 4}`]
      }));

      const ticketContext: TicketContext = {
        ticketId: 'PERF-TEST-003',
        issueType: 'test prioritization performance',
        customerEnvironment: 'test environment'
      };

      const startTime = Date.now();
      
      await searchService.prioritizeResults(mockResults, ticketContext);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Workflow Performance', () => {
    test('pattern recommendation should complete within 100ms', async () => {
      const ticketContext = {
        ticketId: 'WORKFLOW-PERF-001',
        issueType: 'standard printer issue',
        priority: 'medium',
        customerEnvironment: 'Windows 10'
      };

      const startTime = Date.now();
      
      await workflowService.getRecommendedPattern(ticketContext);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    test('workflow execution startup should complete within 50ms', async () => {
      const startTime = Date.now();
      
      await workflowService.startWorkflowExecution(
        'standard-ticket-resolution',
        'WORKFLOW-PERF-002',
        'user-123'
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50);
    });

    test('optimization suggestions should complete within 200ms', async () => {
      // Create mock execution history
      const mockExecutions = Array.from({ length: 20 }, (_, index) => ({
        id: `exec-${index}`,
        patternId: 'standard-ticket-resolution',
        ticketId: `TICKET-${index}`,
        userId: 'user-123',
        startTime: new Date(Date.now() - index * 60000),
        endTime: new Date(Date.now() - index * 60000 + 600000),
        currentStep: 'completed',
        completedSteps: ['step1', 'step2', 'step3'],
        skippedSteps: [],
        duration: 600000,
        status: 'completed' as const,
        performance: {
          totalTime: 600000,
          searchTime: 180000,
          analysisTime: 240000,
          documentationTime: 120000,
          communicationTime: 60000,
          efficiencyScore: 0.85,
          qualityScore: 0.9
        }
      }));

      const startTime = Date.now();
      
      await workflowService.getOptimizationSuggestions(mockExecutions);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200);
    });

    test('workflow analytics should complete within 300ms', async () => {
      const startTime = Date.now();
      
      await workflowService.getWorkflowAnalytics();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(300);
    });
  });

  describe('Session Management Performance', () => {
    test('session creation should complete within 50ms', async () => {
      const startTime = Date.now();
      
      await sessionService.createSession('user-123', 'TICKET-SESSION-001');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50);
    });

    test('session retrieval should complete within 10ms', async () => {
      // First create a session
      const session = await sessionService.createSession('user-123', 'TICKET-SESSION-002');
      
      const startTime = Date.now();
      
      await sessionService.getSession(session.id);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10);
    });

    test('tab operations should complete within 20ms', async () => {
      const session = await sessionService.createSession('user-123', 'TICKET-SESSION-003');
      
      const startTime = Date.now();
      
      await sessionService.addTab(session.id, {
        name: 'Test Tab',
        query: 'test query',
        filters: {},
        results: [],
        scrollPosition: 0,
        isActive: true,
        isPinned: false
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(20);
    });

    test('backup creation should complete within 100ms', async () => {
      const session = await sessionService.createSession('user-123', 'TICKET-SESSION-004');
      
      // Add some tabs to make the session more substantial
      for (let i = 0; i < 5; i++) {
        await sessionService.addTab(session.id, {
          name: `Tab ${i}`,
          query: `query ${i}`,
          filters: {},
          results: Array.from({ length: 10 }, (_, j) => ({ id: `result-${j}` })),
          scrollPosition: 0,
          isActive: i === 0,
          isPinned: false
        });
      }
      
      const startTime = Date.now();
      
      await sessionService.createBackup(session.id, 'manual');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('search service should not leak memory with repeated searches', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many searches
      for (let i = 0; i < 100; i++) {
        await searchService.performIntegratedSearch(`test query ${i}`, {});
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('session service should handle many concurrent sessions', async () => {
      const startTime = Date.now();
      
      // Create multiple sessions concurrently
      const sessionPromises = Array.from({ length: 50 }, (_, i) =>
        sessionService.createSession(`user-${i}`, `TICKET-CONCURRENT-${i}`)
      );
      
      const sessions = await Promise.all(sessionPromises);
      
      const duration = Date.now() - startTime;
      
      expect(sessions.length).toBe(50);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
      
      // All sessions should be unique
      const sessionIds = sessions.map(s => s.id);
      const uniqueIds = new Set(sessionIds);
      expect(uniqueIds.size).toBe(50);
    });

    test('workflow service should handle concurrent pattern recommendations', async () => {
      const contexts = Array.from({ length: 20 }, (_, i) => ({
        ticketId: `TICKET-CONCURRENT-${i}`,
        issueType: i % 2 === 0 ? 'printer issues' : 'network problems',
        priority: i % 3 === 0 ? 'high' : 'medium',
        customerEnvironment: 'Windows 10'
      }));

      const startTime = Date.now();
      
      const recommendations = await Promise.all(
        contexts.map(context => workflowService.getRecommendedPattern(context))
      );
      
      const duration = Date.now() - startTime;
      
      expect(recommendations.length).toBe(20);
      expect(duration).toBeLessThan(300);
      
      // Should have some valid recommendations
      const validRecommendations = recommendations.filter(r => r !== null);
      expect(validRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Performance', () => {
    test('cached searches should be significantly faster than first search', async () => {
      const query = 'cache performance test';
      const filters = {};
      
      // First search (cold)
      const startTime1 = Date.now();
      await searchService.performIntegratedSearch(query, filters);
      const duration1 = Date.now() - startTime1;
      
      // Second search (cached)
      const startTime2 = Date.now();
      await searchService.performIntegratedSearch(query, filters);
      const duration2 = Date.now() - startTime2;
      
      // Cached search should be at least 50% faster
      expect(duration2).toBeLessThan(duration1 * 0.5);
      expect(duration2).toBeLessThan(50); // And should be very fast
    });

    test('context extraction caching should improve performance', async () => {
      const ticketContext: TicketContext = {
        ticketId: 'CACHE-TEST-001',
        issueType: 'caching performance test',
        description: 'Testing context extraction caching',
        customerEnvironment: 'Windows 10'
      };

      // First extraction (cold)
      const startTime1 = Date.now();
      await searchService.extractTicketContext(ticketContext);
      const duration1 = Date.now() - startTime1;
      
      // Second extraction (cached)
      const startTime2 = Date.now();
      await searchService.extractTicketContext(ticketContext);
      const duration2 = Date.now() - startTime2;
      
      // Cached extraction should be significantly faster
      expect(duration2).toBeLessThan(duration1 * 0.3);
      expect(duration2).toBeLessThan(10);
    });
  });

  describe('Scalability Tests', () => {
    test('search service should handle large result sets efficiently', async () => {
      // This would typically involve a larger mock dataset
      // For now, we'll test with the existing mock data
      const startTime = Date.now();
      
      const results = await searchService.performIntegratedSearch('*', {}); // Search all
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(300);
      expect(Array.isArray(results)).toBe(true);
    });

    test('workflow service should handle complex analytics calculations', async () => {
      // Create a more complex scenario with multiple executions
      const executions = Array.from({ length: 100 }, (_, i) => ({
        id: `exec-${i}`,
        patternId: i % 2 === 0 ? 'standard-ticket-resolution' : 'complex-technical-issue',
        ticketId: `TICKET-${i}`,
        userId: `user-${i % 10}`,
        startTime: new Date(Date.now() - i * 3600000),
        endTime: new Date(Date.now() - i * 3600000 + 600000 + i * 10000),
        currentStep: 'completed',
        completedSteps: ['step1', 'step2', 'step3'],
        skippedSteps: i % 10 === 0 ? ['optional-step'] : [],
        duration: 600000 + i * 10000,
        status: 'completed' as const,
        performance: {
          totalTime: 600000 + i * 10000,
          searchTime: 180000 + i * 3000,
          analysisTime: 240000 + i * 4000,
          documentationTime: 120000 + i * 2000,
          communicationTime: 60000 + i * 1000,
          efficiencyScore: 0.5 + (Math.random() * 0.5),
          qualityScore: 0.6 + (Math.random() * 0.4)
        }
      }));

      const startTime = Date.now();
      
      const suggestions = await workflowService.getOptimizationSuggestions(executions);
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(400);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('session service should handle bulk operations efficiently', async () => {
      const session = await sessionService.createSession('user-bulk-test', 'TICKET-BULK-001');
      
      const startTime = Date.now();
      
      // Add many tabs in bulk
      const tabPromises = Array.from({ length: 20 }, (_, i) =>
        sessionService.addTab(session.id, {
          name: `Bulk Tab ${i}`,
          query: `bulk query ${i}`,
          filters: { sourceType: i % 2 === 0 ? 'official' : 'community' },
          results: Array.from({ length: 5 }, (_, j) => ({ id: `bulk-result-${i}-${j}` })),
          scrollPosition: i * 100,
          isActive: i === 0,
          isPinned: i % 5 === 0
        })
      );
      
      await Promise.all(tabPromises);
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Error Recovery Performance', () => {
    test('service recovery after errors should be fast', async () => {
      // Simulate some failed operations
      try {
        await searchService.performIntegratedSearch('', {}); // Invalid query
      } catch (error) {
        // Expected to fail
      }

      // Recovery should be immediate
      const startTime = Date.now();
      
      const results = await searchService.performIntegratedSearch('valid query', {});
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(200);
      expect(Array.isArray(results)).toBe(true);
    });

    test('session recovery should be efficient', async () => {
      const session = await sessionService.createSession('user-recovery', 'TICKET-RECOVERY-001');
      
      // Create backup
      await sessionService.createBackup(session.id, 'manual');
      
      // Simulate recovery
      const startTime = Date.now();
      
      const recoveredSession = await sessionService.recoverSession(session.id);
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100);
      expect(recoveredSession.id).toBe(session.id);
    });
  });
});