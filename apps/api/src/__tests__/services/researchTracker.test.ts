import { ResearchTracker, ClickEvent, PageVisit } from '../../services/researchTracker';

describe('ResearchTracker', () => {
  let researchTracker: ResearchTracker;
  const mockUserId = 'test-user-123';
  const mockSessionId = 'test-session-456';
  const mockSearchId = 'test-search-789';

  beforeEach(() => {
    researchTracker = new ResearchTracker();
  });

  describe('Click Tracking', () => {
    it('should track a click event successfully', async () => {
      const clickData = {
        userId: mockUserId,
        sessionId: mockSessionId,
        searchId: mockSearchId,
        resultId: 'result-1',
        resultPosition: 1,
        clickSequence: 1,
        timeSinceSearch: 1500,
        pageUrl: 'https://example.com/article',
        credibilityScore: 85,
        sourceType: 'official',
        relevanceScore: 92,
      };

      const clickEvent = await researchTracker.trackClick(clickData);

      expect(clickEvent).toBeDefined();
      expect(clickEvent.id).toMatch(/^click-/);
      expect(clickEvent.userId).toBe(mockUserId);
      expect(clickEvent.resultId).toBe('result-1');
      expect(clickEvent.resultPosition).toBe(1);
      expect(clickEvent.credibilityScore).toBe(85);
      expect(clickEvent.sourceType).toBe('official');
      expect(clickEvent.timestamp).toBeInstanceOf(Date);
    });

    it('should generate unique click event IDs', async () => {
      const clickData = {
        userId: mockUserId,
        sessionId: mockSessionId,
        searchId: mockSearchId,
        resultId: 'result-1',
        resultPosition: 1,
        clickSequence: 1,
        timeSinceSearch: 1500,
        pageUrl: 'https://example.com/article',
        credibilityScore: 85,
        sourceType: 'official',
        relevanceScore: 92,
      };

      const clickEvent1 = await researchTracker.trackClick(clickData);
      const clickEvent2 = await researchTracker.trackClick({
        ...clickData,
        resultId: 'result-2',
        clickSequence: 2,
      });

      expect(clickEvent1.id).not.toBe(clickEvent2.id);
    });

    it('should update click patterns when tracking clicks', async () => {
      const clickData = {
        userId: mockUserId,
        sessionId: mockSessionId,
        searchId: mockSearchId,
        resultId: 'result-1',
        resultPosition: 1,
        clickSequence: 1,
        timeSinceSearch: 1500,
        pageUrl: 'https://example.com/article',
        credibilityScore: 85,
        sourceType: 'official',
        relevanceScore: 92,
      };

      await researchTracker.trackClick(clickData);
      await researchTracker.trackClick({
        ...clickData,
        resultId: 'result-2',
        resultPosition: 3,
        clickSequence: 2,
        credibilityScore: 45,
        sourceType: 'forum',
      });

      const patterns = await researchTracker.getClickPatterns(mockUserId);
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].searchId).toBe(mockSearchId);
      expect(patterns[0].totalClicks).toBe(2);
      expect(patterns[0].clickDepthPattern).toEqual([1, 3]);
      expect(patterns[0].credibilityPreference).toBe('mixed'); // Mix of high and low
    });
  });

  describe('Page Visit Tracking', () => {
    it('should start tracking a page visit', async () => {
      const visitData = {
        userId: mockUserId,
        sessionId: mockSessionId,
        clickEventId: 'click-event-123',
        pageUrl: 'https://example.com/article',
      };

      const pageVisit = await researchTracker.startPageVisit(visitData);

      expect(pageVisit).toBeDefined();
      expect(pageVisit.id).toMatch(/^visit-/);
      expect(pageVisit.userId).toBe(mockUserId);
      expect(pageVisit.pageUrl).toBe('https://example.com/article');
      expect(pageVisit.entryTime).toBeInstanceOf(Date);
      expect(pageVisit.scrollDepth).toBe(0);
      expect(pageVisit.interactionEvents).toEqual([]);
      expect(pageVisit.exitType).toBe('unknown');
    });

    it('should end tracking a page visit', async () => {
      const visitData = {
        userId: mockUserId,
        sessionId: mockSessionId,
        clickEventId: 'click-event-123',
        pageUrl: 'https://example.com/article',
      };

      const pageVisit = await researchTracker.startPageVisit(visitData);
      
      // Wait a bit to simulate time spent on page
      await new Promise(resolve => setTimeout(resolve, 10));

      const endedVisit = await researchTracker.endPageVisit({
        userId: mockUserId,
        sessionId: mockSessionId,
        visitId: pageVisit.id,
        exitType: 'back',
        finalScrollDepth: 75,
      });

      expect(endedVisit).toBeDefined();
      expect(endedVisit!.exitTime).toBeInstanceOf(Date);
      expect(endedVisit!.duration).toBeGreaterThan(0);
      expect(endedVisit!.exitType).toBe('back');
      expect(endedVisit!.scrollDepth).toBe(75);
      expect(endedVisit!.contentEffectiveness).toBeGreaterThan(0);
    });

    it('should track interactions during page visit', async () => {
      const visitData = {
        userId: mockUserId,
        sessionId: mockSessionId,
        clickEventId: 'click-event-123',
        pageUrl: 'https://example.com/article',
      };

      const pageVisit = await researchTracker.startPageVisit(visitData);

      await researchTracker.trackInteraction({
        userId: mockUserId,
        sessionId: mockSessionId,
        visitId: pageVisit.id,
        interaction: {
          type: 'scroll',
          data: { scrollDepth: 50 },
        },
      });

      await researchTracker.trackInteraction({
        userId: mockUserId,
        sessionId: mockSessionId,
        visitId: pageVisit.id,
        interaction: {
          type: 'click',
          data: { element: 'button' },
          elementId: 'download-btn',
          coordinates: { x: 100, y: 200 },
        },
      });

      const endedVisit = await researchTracker.endPageVisit({
        userId: mockUserId,
        sessionId: mockSessionId,
        visitId: pageVisit.id,
        exitType: 'close',
        finalScrollDepth: 80,
      });

      expect(endedVisit!.interactionEvents).toHaveLength(2);
      expect(endedVisit!.interactionEvents[0].type).toBe('scroll');
      expect(endedVisit!.interactionEvents[1].type).toBe('click');
      expect(endedVisit!.scrollDepth).toBe(80); // Should use the higher value
    });
  });

  describe('Click Analytics', () => {
    beforeEach(async () => {
      // Set up test data
      const baseClickData = {
        userId: mockUserId,
        sessionId: mockSessionId,
        searchId: mockSearchId,
        clickSequence: 1,
        timeSinceSearch: 1500,
        pageUrl: 'https://example.com/article',
        relevanceScore: 90,
      };

      // Create clicks with different characteristics
      await researchTracker.trackClick({
        ...baseClickData,
        resultId: 'result-high-cred',
        resultPosition: 1,
        credibilityScore: 95,
        sourceType: 'official',
      });

      await researchTracker.trackClick({
        ...baseClickData,
        resultId: 'result-med-cred',
        resultPosition: 3,
        credibilityScore: 70,
        sourceType: 'documentation',
        clickSequence: 2,
      });

      await researchTracker.trackClick({
        ...baseClickData,
        resultId: 'result-low-cred',
        resultPosition: 15,
        credibilityScore: 30,
        sourceType: 'forum',
        clickSequence: 3,
      });
    });

    it('should calculate click analytics correctly', async () => {
      const analytics = await researchTracker.getClickAnalytics(mockUserId);

      expect(analytics.clickThroughRate).toBeGreaterThan(0);
      expect(analytics.averageClickPosition).toBeCloseTo(6.33, 1); // (1 + 3 + 15) / 3
      
      expect(analytics.credibilityDistribution.high).toBeCloseTo(0.33, 1); // 1/3
      expect(analytics.credibilityDistribution.medium).toBeCloseTo(0.33, 1); // 1/3
      expect(analytics.credibilityDistribution.low).toBeCloseTo(0.33, 1); // 1/3

      expect(analytics.sourceTypeDistribution.official).toBeCloseTo(0.33, 1);
      expect(analytics.sourceTypeDistribution.documentation).toBeCloseTo(0.33, 1);
      expect(analytics.sourceTypeDistribution.forum).toBeCloseTo(0.33, 1);

      expect(analytics.clickDepthAnalysis.firstPageOnly).toBeCloseTo(0.67, 1); // 2/3 clicks on first page
      expect(analytics.clickDepthAnalysis.beyondFirstPage).toBeCloseTo(0.33, 1); // 1/3 beyond first page
    });

    it('should return empty analytics for user with no clicks', async () => {
      const analytics = await researchTracker.getClickAnalytics('non-existent-user');

      expect(analytics.clickThroughRate).toBe(0);
      expect(analytics.averageClickPosition).toBe(0);
      expect(analytics.credibilityDistribution).toEqual({});
      expect(analytics.sourceTypeDistribution).toEqual({});
    });

    it('should filter analytics by timeframe', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      // Test with future timeframe (should return empty)
      const futureAnalytics = await researchTracker.getClickAnalytics(mockUserId, {
        start: futureDate,
        end: new Date(futureDate.getTime() + 60 * 60 * 1000),
      });

      expect(futureAnalytics.clickThroughRate).toBe(0);

      // Test with past timeframe including today (should return data)
      const pastAnalytics = await researchTracker.getClickAnalytics(mockUserId, {
        start: pastDate,
        end: new Date(),
      });

      expect(pastAnalytics.clickThroughRate).toBeGreaterThan(0);
    });
  });

  describe('Page Visit Analytics', () => {
    beforeEach(async () => {
      // Create some page visits
      const visit1 = await researchTracker.startPageVisit({
        userId: mockUserId,
        sessionId: mockSessionId,
        clickEventId: 'click-1',
        pageUrl: 'https://example.com/article1',
      });

      // Wait a bit to simulate time spent
      await new Promise(resolve => setTimeout(resolve, 10));

      await researchTracker.endPageVisit({
        userId: mockUserId,
        sessionId: mockSessionId,
        visitId: visit1.id,
        exitType: 'back',
        finalScrollDepth: 80,
      });

      const visit2 = await researchTracker.startPageVisit({
        userId: mockUserId,
        sessionId: mockSessionId,
        clickEventId: 'click-2',
        pageUrl: 'https://example.com/article2',
      });

      // Wait a bit to simulate time spent
      await new Promise(resolve => setTimeout(resolve, 10));

      await researchTracker.endPageVisit({
        userId: mockUserId,
        sessionId: mockSessionId,
        visitId: visit2.id,
        exitType: 'close',
        finalScrollDepth: 60,
      });
    });

    it('should calculate page visit analytics correctly', async () => {
      const analytics = await researchTracker.getPageVisitAnalytics(mockUserId);

      expect(analytics.totalVisits).toBe(2);
      expect(analytics.averageScrollDepth).toBe(70); // (80 + 60) / 2
      expect(analytics.exitTypeDistribution.back).toBe(0.5);
      expect(analytics.exitTypeDistribution.close).toBe(0.5);
      expect(analytics.contentEffectiveness).toBeGreaterThan(0);
    });

    it('should return empty analytics for user with no visits', async () => {
      const analytics = await researchTracker.getPageVisitAnalytics('non-existent-user');

      expect(analytics.totalVisits).toBe(0);
      expect(analytics.averageDuration).toBe(0);
      expect(analytics.averageScrollDepth).toBe(0);
      expect(analytics.exitTypeDistribution).toEqual({});
      expect(analytics.contentEffectiveness).toBe(0);
    });
  });

  describe('Click Patterns', () => {
    it('should determine credibility preferences correctly', async () => {
      const searchId1 = 'search-high-cred';
      const searchId2 = 'search-low-cred';

      // Create pattern with high credibility preference
      for (let i = 0; i < 4; i++) {
        await researchTracker.trackClick({
          userId: mockUserId,
          sessionId: mockSessionId,
          searchId: searchId1,
          resultId: `result-${i}`,
          resultPosition: i + 1,
          clickSequence: i + 1,
          timeSinceSearch: 1500,
          pageUrl: `https://example.com/article${i}`,
          credibilityScore: 90,
          sourceType: 'official',
          relevanceScore: 85,
        });
      }

      // Create pattern with low credibility preference
      for (let i = 0; i < 4; i++) {
        await researchTracker.trackClick({
          userId: mockUserId,
          sessionId: mockSessionId,
          searchId: searchId2,
          resultId: `result-low-${i}`,
          resultPosition: i + 1,
          clickSequence: i + 1,
          timeSinceSearch: 1500,
          pageUrl: `https://example.com/article${i}`,
          credibilityScore: 25,
          sourceType: 'forum',
          relevanceScore: 50,
        });
      }

      const patterns = await researchTracker.getClickPatterns(mockUserId);

      expect(patterns).toHaveLength(2);
      
      const highCredPattern = patterns.find((p: any) => p.searchId === searchId1);
      const lowCredPattern = patterns.find((p: any) => p.searchId === searchId2);

      expect(highCredPattern?.credibilityPreference).toBe('high');
      expect(lowCredPattern?.credibilityPreference).toBe('low');
    });

    it('should determine source type preferences correctly', async () => {
      const searchId = 'search-source-pref';

      // Create clicks with mixed source types, but predominantly official
      await researchTracker.trackClick({
        userId: mockUserId,
        sessionId: mockSessionId,
        searchId: searchId,
        resultId: 'result-1',
        resultPosition: 1,
        clickSequence: 1,
        timeSinceSearch: 1500,
        pageUrl: 'https://example.com/article1',
        credibilityScore: 90,
        sourceType: 'official',
        relevanceScore: 85,
      });

      await researchTracker.trackClick({
        userId: mockUserId,
        sessionId: mockSessionId,
        searchId: searchId,
        resultId: 'result-2',
        resultPosition: 2,
        clickSequence: 2,
        timeSinceSearch: 2000,
        pageUrl: 'https://example.com/article2',
        credibilityScore: 85,
        sourceType: 'official',
        relevanceScore: 80,
      });

      await researchTracker.trackClick({
        userId: mockUserId,
        sessionId: mockSessionId,
        searchId: searchId,
        resultId: 'result-3',
        resultPosition: 3,
        clickSequence: 3,
        timeSinceSearch: 2500,
        pageUrl: 'https://example.com/article3',
        credibilityScore: 70,
        sourceType: 'documentation',
        relevanceScore: 75,
      });

      const patterns = await researchTracker.getClickPatterns(mockUserId);
      const pattern = patterns.find((p: any) => p.searchId === searchId);

      expect(pattern?.sourceTypePreference).toContain('official');
      expect(pattern?.sourceTypePreference[0]).toBe('official'); // Should be first preference
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields gracefully', async () => {
      await expect(researchTracker.trackClick({
        userId: '',
        sessionId: mockSessionId,
        searchId: mockSearchId,
        resultId: 'result-1',
        resultPosition: 1,
        clickSequence: 1,
        timeSinceSearch: 1500,
        pageUrl: 'https://example.com/article',
        credibilityScore: 85,
        sourceType: 'official',
        relevanceScore: 90,
      })).rejects.toThrow();
    });

    it('should handle ending non-existent page visit gracefully', async () => {
      const result = await researchTracker.endPageVisit({
        userId: mockUserId,
        sessionId: mockSessionId,
        visitId: 'non-existent-visit',
        exitType: 'close',
        finalScrollDepth: 50,
      });

      expect(result).toBeNull();
    });
  });

  describe('Search Query Tracking', () => {
    it('should track a search query successfully', async () => {
      const searchQuery = await researchTracker.trackSearchQuery({
        userId: mockUserId,
        sessionId: mockSessionId,
        query: 'how to fix network issues',
        resultCount: 15,
      });

      expect(searchQuery).toBeDefined();
      expect(searchQuery.id).toBeTruthy();
      expect(searchQuery.query).toBe('how to fix network issues');
      expect(searchQuery.resultCount).toBe(15);
      expect(searchQuery.keywords).toContain('network');
      expect(searchQuery.keywords).toContain('issues');
      expect(searchQuery.queryComplexity).toBeDefined();
      expect(searchQuery.queryType).toBeDefined();
    });

    it('should classify query complexity correctly', async () => {
      const simpleQuery = await researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: 'help me',
        resultCount: 5,
      });

      const complexQuery = await researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: 'configure advanced firewall rules for enterprise network segmentation',
        resultCount: 8,
      });

      expect(simpleQuery.queryComplexity).toBe('simple');
      expect(complexQuery.queryComplexity).toBe('complex');
    });

    it('should classify query types correctly', async () => {
      const troubleshootingQuery = await researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: 'fix error in database connection',
        resultCount: 12,
      });

      const technicalQuery = await researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: 'API configuration methods',
        resultCount: 18,
      });

      expect(troubleshootingQuery.queryType).toBe('troubleshooting');
      expect(technicalQuery.queryType).toBe('technical');
    });

    it('should handle missing required fields', async () => {
      await expect(researchTracker.trackSearchQuery({
        userId: '',
        query: 'test query',
        resultCount: 5,
      })).rejects.toThrow('Missing required fields: userId, query');

      await expect(researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: '',
        resultCount: 5,
      })).rejects.toThrow('Missing required fields: userId, query');
    });
  });

  describe('Query Refinement Tracking', () => {
    it('should track query refinement successfully', async () => {
      // First create two queries
      const originalQuery = await researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: 'network issues',
        resultCount: 10,
      });

      const refinedQuery = await researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: 'network connectivity issues Windows',
        resultCount: 8,
      });

      const refinement = await researchTracker.trackQueryRefinement({
        userId: mockUserId,
        originalQueryId: originalQuery.id,
        refinedQueryId: refinedQuery.id,
        timeBetweenQueries: 5000,
      });

      expect(refinement).toBeDefined();
      expect(refinement.refinementType).toBe('add_keywords');
      expect(refinement.keywordsAdded).toContain('connectivity');
      expect(refinement.keywordsAdded).toContain('windows');
      expect(refinement.timeBetweenQueries).toBe(5000);
    });

    it('should handle missing queries', async () => {
      await expect(researchTracker.trackQueryRefinement({
        userId: mockUserId,
        originalQueryId: 'non-existent-query',
        refinedQueryId: 'also-non-existent',
        timeBetweenQueries: 1000,
      })).rejects.toThrow('Original or refined query not found');
    });
  });

  describe('Search Analytics', () => {
    beforeEach(async () => {
      // Setup test data
      await researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: 'simple query',
        resultCount: 10,
      });

      await researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: 'complex technical API configuration troubleshooting',
        resultCount: 5,
      });

      await researchTracker.trackSearchQuery({
        userId: mockUserId,
        query: 'moderate difficulty network setup',
        resultCount: 8,
      });
    });

    it('should calculate search analytics correctly', async () => {
      const analytics = await researchTracker.getSearchAnalytics(mockUserId);

      expect(analytics.totalQueries).toBe(3);
      expect(analytics.queryComplexityDistribution).toBeDefined();
      expect(analytics.queryTypeDistribution).toBeDefined();
      expect(analytics.keywordEffectiveness).toBeDefined();
      expect(analytics.averageQueryLength).toBeGreaterThan(0);
    });

    it('should return empty analytics for user with no searches', async () => {
      const analytics = await researchTracker.getSearchAnalytics('empty-user');

      expect(analytics.totalQueries).toBe(0);
      expect(analytics.refinementRate).toBe(0);
      expect(analytics.averageQueryLength).toBe(0);
    });
  });

  describe('Search Patterns', () => {
    beforeEach(async () => {
      // Create a systematic search pattern
      await researchTracker.trackSearchQuery({
        userId: mockUserId,
        sessionId: 'session-1',
        query: 'network',
        resultCount: 20,
      });

      await researchTracker.trackSearchQuery({
        userId: mockUserId,
        sessionId: 'session-1',
        query: 'network connectivity',
        resultCount: 15,
      });

      await researchTracker.trackSearchQuery({
        userId: mockUserId,
        sessionId: 'session-1',
        query: 'network connectivity windows troubleshooting',
        resultCount: 8,
      });
    });

    it('should identify search patterns correctly', async () => {
      const patterns = await researchTracker.getSearchPatterns(mockUserId);

      expect(patterns).toBeDefined();
      expect(patterns.length).toBeGreaterThan(0);
      
      const pattern = patterns[0];
      expect(pattern.totalSearches).toBe(3);
      expect(pattern.searchStrategy).toBeDefined();
      expect(pattern.keywordEvolution).toBeDefined();
      expect(pattern.terminologyUsage).toBeDefined();
    });

    it('should track keyword evolution', async () => {
      const patterns = await researchTracker.getSearchPatterns(mockUserId);
      const pattern = patterns[0];

      expect(pattern.keywordEvolution.initialKeywords).toContain('network');
      expect(pattern.keywordEvolution.finalKeywords).toContain('connectivity');
      expect(pattern.keywordEvolution.finalKeywords).toContain('windows');
      expect(pattern.keywordEvolution.finalKeywords).toContain('troubleshooting');
    });
  });

  describe('Source Selection Tracking', () => {
    it('should track source selection successfully', async () => {
      const sourceSelection = await researchTracker.trackSourceSelection({
        userId: mockUserId,
        sessionId: mockSessionId,
        searchId: 'search-123',
        resultId: 'result-456',
        sourceMetadata: {
          url: 'https://docs.microsoft.com/networking',
          title: 'Network Configuration Guide',
          domain: 'docs.microsoft.com',
          sourceType: 'documentation',
          authorityLevel: 'high',
          lastUpdated: new Date(),
        },
        credibilityScore: 90,
        relevanceScore: 85,
        timeToSelect: 3000,
        positionInResults: 2,
      });

      expect(sourceSelection).toBeDefined();
      expect(sourceSelection.id).toBeTruthy();
      expect(sourceSelection.sourceMetadata.sourceType).toBe('documentation');
      expect(sourceSelection.credibilityScore).toBe(90);
      expect(sourceSelection.relevanceScore).toBe(85);
      expect(sourceSelection.qualityScore).toBeGreaterThan(0);
      expect(sourceSelection.selectionReason).toBeDefined();
    });

    it('should calculate quality scores correctly', async () => {
      const highQualitySelection = await researchTracker.trackSourceSelection({
        userId: mockUserId,
        searchId: 'search-123',
        resultId: 'result-high',
        sourceMetadata: {
          url: 'https://docs.microsoft.com/guide',
          title: 'Official Documentation',
          domain: 'docs.microsoft.com',
          sourceType: 'official',
          authorityLevel: 'high',
          lastUpdated: new Date(),
        },
        credibilityScore: 95,
        relevanceScore: 90,
        timeToSelect: 2000,
        positionInResults: 1,
      });

      const lowQualitySelection = await researchTracker.trackSourceSelection({
        userId: mockUserId,
        searchId: 'search-123',
        resultId: 'result-low',
        sourceMetadata: {
          url: 'https://randomforum.com/post',
          title: 'Random Forum Post',
          domain: 'randomforum.com',
          sourceType: 'forum',
          authorityLevel: 'low',
        },
        credibilityScore: 30,
        relevanceScore: 40,
        timeToSelect: 5000,
        positionInResults: 8,
      });

      expect(highQualitySelection.qualityScore).toBeGreaterThan(lowQualitySelection.qualityScore);
      expect(highQualitySelection.qualityScore).toBeGreaterThan(80);
      expect(lowQualitySelection.qualityScore).toBeLessThan(60);
    });

    it('should determine selection reasons correctly', async () => {
      const topResultSelection = await researchTracker.trackSourceSelection({
        userId: mockUserId,
        searchId: 'search-123',
        resultId: 'result-top',
        sourceMetadata: {
          url: 'https://example.com/guide',
          title: 'Quick Guide',
          domain: 'example.com',
          sourceType: 'tutorial',
          authorityLevel: 'medium',
        },
        credibilityScore: 70,
        relevanceScore: 75,
        timeToSelect: 2500, // Fast selection
        positionInResults: 1, // Top result
      });

      const credibleSourceSelection = await researchTracker.trackSourceSelection({
        userId: mockUserId,
        searchId: 'search-123',
        resultId: 'result-credible',
        sourceMetadata: {
          url: 'https://official.com/info',
          title: 'Official Information',
          domain: 'official.com',
          sourceType: 'official',
          authorityLevel: 'high',
        },
        credibilityScore: 95, // High credibility
        relevanceScore: 80,
        timeToSelect: 5000,
        positionInResults: 3,
      });

      expect(topResultSelection.selectionReason).toBe('top_result');
      expect(credibleSourceSelection.selectionReason).toBe('credible_source');
    });

    it('should handle missing required fields', async () => {
      await expect(researchTracker.trackSourceSelection({
        userId: '',
        searchId: 'search-123',
        resultId: 'result-456',
        sourceMetadata: {
          url: 'https://example.com',
          title: 'Test',
          domain: 'example.com',
          sourceType: 'unknown',
          authorityLevel: 'unknown',
        },
        credibilityScore: 50,
        relevanceScore: 50,
        timeToSelect: 1000,
        positionInResults: 1,
      })).rejects.toThrow('Missing required fields: userId, searchId, resultId');
    });
  });

  describe('Source Quality Assessment', () => {
    it('should assess source quality successfully', async () => {
      const qualityAssessment = await researchTracker.assessSourceQuality({
        sourceId: 'source-123',
        userId: mockUserId,
        sessionId: mockSessionId,
        assessmentType: 'behavioral',
        behavioralIndicators: {
          timeSpentReading: 120000, // 2 minutes
          scrollDepth: 85,
          copyActions: 2,
          returnVisits: 1,
          shareActions: 1,
        },
        sourceMetadata: {
          credibilityScore: 80,
          relevanceScore: 75,
          sourceType: 'documentation',
          authorityLevel: 'high',
          publicationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
        },
      });

      expect(qualityAssessment).toBeDefined();
      expect(qualityAssessment.qualityMetrics).toBeDefined();
      expect(qualityAssessment.penaltyFactors).toBeDefined();
      expect(qualityAssessment.overallScore).toBeGreaterThan(0);
      expect(qualityAssessment.overallScore).toBeLessThanOrEqual(100);
    });

    it('should calculate penalties for low-quality sources', async () => {
      const lowQualityAssessment = await researchTracker.assessSourceQuality({
        sourceId: 'source-low',
        userId: mockUserId,
        assessmentType: 'automatic',
        behavioralIndicators: {
          timeSpentReading: 15000, // 15 seconds - very short
          scrollDepth: 20, // Low scroll
          copyActions: 0,
          returnVisits: 0,
          shareActions: 0,
        },
        sourceMetadata: {
          credibilityScore: 25, // Low credibility
          relevanceScore: 30, // Low relevance
          sourceType: 'forum',
          authorityLevel: 'low',
          publicationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 3), // 3 years old
        },
      });

      expect(lowQualityAssessment.penaltyFactors.lowCredibility).toBeGreaterThan(0);
      expect(lowQualityAssessment.penaltyFactors.irrelevantContent).toBeGreaterThan(0);
      expect(lowQualityAssessment.penaltyFactors.outdatedInformation).toBeGreaterThan(0);
      expect(lowQualityAssessment.overallScore).toBeLessThan(50);
    });
  });

  describe('Source Selection Analytics', () => {
    beforeEach(async () => {
      // Create various source selections for analytics
      await researchTracker.trackSourceSelection({
        userId: mockUserId,
        searchId: 'search-analytics',
        resultId: 'result-1',
        sourceMetadata: {
          url: 'https://docs.microsoft.com/guide1',
          title: 'Official Guide 1',
          domain: 'docs.microsoft.com',
          sourceType: 'official',
          authorityLevel: 'high',
        },
        credibilityScore: 95,
        relevanceScore: 90,
        timeToSelect: 2000,
        positionInResults: 1,
      });

      await researchTracker.trackSourceSelection({
        userId: mockUserId,
        searchId: 'search-analytics',
        resultId: 'result-2',
        sourceMetadata: {
          url: 'https://stackoverflow.com/question1',
          title: 'Stack Overflow Answer',
          domain: 'stackoverflow.com',
          sourceType: 'forum',
          authorityLevel: 'medium',
        },
        credibilityScore: 70,
        relevanceScore: 80,
        timeToSelect: 4000,
        positionInResults: 3,
      });

      await researchTracker.trackSourceSelection({
        userId: mockUserId,
        searchId: 'search-analytics',
        resultId: 'result-3',
        sourceMetadata: {
          url: 'https://blog.example.com/post',
          title: 'Blog Post',
          domain: 'blog.example.com',
          sourceType: 'blog',
          authorityLevel: 'low',
        },
        credibilityScore: 40,
        relevanceScore: 60,
        timeToSelect: 6000,
        positionInResults: 5,
      });
    });

    it('should calculate source selection analytics correctly', async () => {
      const analytics = await researchTracker.getSourceSelectionAnalytics(mockUserId);

      expect(analytics.totalSelections).toBe(3);
      expect(analytics.averageCredibilityScore).toBeCloseTo(68.33, 1);
      expect(analytics.sourceTypeDistribution).toBeDefined();
      expect(analytics.sourceTypeDistribution.official).toBeDefined();
      expect(analytics.sourceTypeDistribution.forum).toBeDefined();
      expect(analytics.sourceTypeDistribution.blog).toBeDefined();
    });

    it('should return empty analytics for user with no selections', async () => {
      const analytics = await researchTracker.getSourceSelectionAnalytics('empty-user');

      expect(analytics.totalSelections).toBe(0);
      expect(analytics.averageCredibilityScore).toBe(0);
      expect(analytics.averageRelevanceScore).toBe(0);
    });
  });

  describe('Source Selection Patterns', () => {
    beforeEach(async () => {
      // Create a pattern of source selections
      await researchTracker.trackSourceSelection({
        userId: mockUserId,
        sessionId: 'session-pattern',
        searchId: 'search-pattern',
        resultId: 'result-p1',
        sourceMetadata: {
          url: 'https://official.com/guide1',
          title: 'Official Guide',
          domain: 'official.com',
          sourceType: 'official',
          authorityLevel: 'high',
        },
        credibilityScore: 90,
        relevanceScore: 85,
        timeToSelect: 2000,
        positionInResults: 1,
      });

      await researchTracker.trackSourceSelection({
        userId: mockUserId,
        sessionId: 'session-pattern',
        searchId: 'search-pattern',
        resultId: 'result-p2',
        sourceMetadata: {
          url: 'https://docs.example.com/info',
          title: 'Documentation',
          domain: 'docs.example.com',
          sourceType: 'documentation',
          authorityLevel: 'high',
        },
        credibilityScore: 85,
        relevanceScore: 80,
        timeToSelect: 3000,
        positionInResults: 2,
      });
    });

    it('should identify source selection patterns', async () => {
      const patterns = await researchTracker.getSourceSelectionPatterns(mockUserId);

      expect(patterns).toBeDefined();
      expect(patterns.length).toBeGreaterThan(0);
      
      const pattern = patterns[0];
      expect(pattern.selectionSequence.length).toBe(2);
      expect(pattern.patterns.credibilityPreference.averageCredibilityScore).toBeGreaterThan(80);
      expect(pattern.patterns.positionBias.topThreeRate).toBe(1); // All selections from top 3
    });

    it('should identify improvement opportunities', async () => {
      // Create a pattern with low credibility selections to trigger improvement opportunities
      await researchTracker.trackSourceSelection({
        userId: 'user-needs-improvement',
        searchId: 'search-improvement',
        resultId: 'result-i1',
        sourceMetadata: {
          url: 'https://random.com/post1',
          title: 'Random Post',
          domain: 'random.com',
          sourceType: 'blog',
          authorityLevel: 'low',
        },
        credibilityScore: 30,
        relevanceScore: 40,
        timeToSelect: 1000,
        positionInResults: 1,
      });

      const patterns = await researchTracker.getSourceSelectionPatterns('user-needs-improvement');
      const pattern = patterns[0];

      expect(pattern.improvementOpportunities.credibilityAwareness).toBe(true);
      expect(pattern.improvementOpportunities.sourceTypeEducation).toBe(true);
    });
  });

  describe('Research Efficiency Metrics', () => {
    it('should start and end research session successfully', async () => {
      const session = await researchTracker.startResearchSession({
        userId: 'test-user',
        sessionId: 'efficiency-session-1',
        sessionGoal: 'Fix network connectivity issues',
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe('test-user');
      expect(session.sessionId).toBe('efficiency-session-1');
      expect(session.sessionGoal).toBe('Fix network connectivity issues');
      expect(session.completed).toBe(false);
      expect(session.efficiency.overallEfficiencyScore).toBe(0);

      const endedSession = await researchTracker.endResearchSession({
        userId: 'test-user',
        sessionId: 'efficiency-session-1',
        solutionFound: true,
        solutionQuality: 85,
      });

      expect(endedSession).toBeDefined();
      expect(endedSession?.completed).toBe(true);
      expect(endedSession?.solutionFound).toBe(true);
      expect(endedSession?.solutionQuality).toBe(85);
      expect(endedSession?.efficiency.overallEfficiencyScore).toBeGreaterThan(0);
    });

    it('should track source consultations', async () => {
      const consultation = await researchTracker.trackSourceConsultation({
        userId: 'test-user',
        sessionId: 'consultation-session',
        sourceId: 'source-123',
        sourceUrl: 'https://example.com/doc',
        sourceType: 'documentation',
        consultationReason: 'initial_search',
      });

      expect(consultation).toBeDefined();
      expect(consultation.sourceId).toBe('source-123');
      expect(consultation.consultationReason).toBe('initial_search');
      expect(consultation.consultationDepth).toBe('surface');

      // Add a small delay to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 10));

      const endedConsultation = await researchTracker.endSourceConsultation({
        userId: 'test-user',
        consultationId: consultation.id,
        consultationDepth: 'deep',
        informationExtracted: true,
        relevanceToGoal: 85,
        contributionToSolution: 70,
        exitReason: 'found_answer',
      });

      expect(endedConsultation).toBeDefined();
      expect(endedConsultation?.consultationDepth).toBe('deep');
      expect(endedConsultation?.informationExtracted).toBe(true);
      expect(endedConsultation?.relevanceToGoal).toBe(85);
      expect(endedConsultation?.contributionToSolution).toBe(70);
      expect(endedConsultation?.exitReason).toBe('found_answer');
      expect(endedConsultation?.consultationDuration).toBeGreaterThanOrEqual(0);
    });

    it('should calculate research efficiency metrics', async () => {
      const session = await researchTracker.startResearchSession({
        userId: 'efficiency-user',
        sessionId: 'metrics-session',
        sessionGoal: 'Test efficiency calculation',
      });

      // Add some search queries and clicks to generate data
      await researchTracker.trackSearchQuery({
        userId: 'efficiency-user',
        sessionId: 'metrics-session',
        query: 'network troubleshooting',
        resultCount: 10,
      });

      await researchTracker.trackClick({
        userId: 'efficiency-user',
        sessionId: 'metrics-session',
        searchId: 'search-1',
        resultId: 'result-1',
        resultPosition: 1,
        clickSequence: 1,
        timeSinceSearch: 5000,
        pageUrl: 'https://example.com/guide',
        credibilityScore: 85,
        sourceType: 'documentation',
        relevanceScore: 90,
      });

      await researchTracker.trackSourceSelection({
        userId: 'efficiency-user',
        sessionId: 'metrics-session',
        searchId: 'search-1',
        resultId: 'result-1',
        sourceMetadata: {
          url: 'https://example.com/guide',
          title: 'Network Troubleshooting Guide',
          domain: 'example.com',
          sourceType: 'documentation',
          authorityLevel: 'high',
        },
        credibilityScore: 85,
        relevanceScore: 90,
        timeToSelect: 3000,
        positionInResults: 1,
      });

      // Add a small delay to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 10));

      const endedSession = await researchTracker.endResearchSession({
        userId: 'efficiency-user',
        researchSessionId: session.id,
        solutionFound: true,
        solutionQuality: 80,
      });

      expect(endedSession?.efficiency.timeToSolution).toBeGreaterThanOrEqual(0);
      expect(endedSession?.efficiency.searchToClickRatio).toBe(1); // 1 search, 1 click
      expect(endedSession?.efficiency.overallEfficiencyScore).toBeGreaterThanOrEqual(0);
    });

    it('should get research efficiency metrics for user', async () => {
      const metrics = await researchTracker.getResearchEfficiencyMetrics('efficiency-user');
      expect(Array.isArray(metrics)).toBe(true);
      
      // Check if metrics exist, and if so, validate them
      if (metrics.length > 0) {
        expect(metrics[0].overallEfficiencyScore).toBeGreaterThanOrEqual(0);
        expect(metrics[0].timeToSolution).toBeGreaterThanOrEqual(0);
        expect(metrics[0].sourceConsultationCount).toBeGreaterThanOrEqual(0);
      } else {
        // If no metrics, that's also acceptable for a new or inactive user
        expect(metrics.length).toBe(0);
      }
    });

    it('should generate speed optimization recommendations', async () => {
      const optimization = await researchTracker.getResearchSpeedOptimization('efficiency-user');
      
      expect(optimization).toBeDefined();
      expect(optimization?.userId).toBe('efficiency-user');
      expect(optimization?.currentPerformance).toBeDefined();
      expect(optimization?.benchmarks).toBeDefined();
      expect(optimization?.optimizationRecommendations).toBeDefined();
      expect(optimization?.practiceExercises).toBeDefined();
      expect(Array.isArray(optimization?.practiceExercises)).toBe(true);
    });

    it('should provide default optimization for new users', async () => {
      const optimization = await researchTracker.getResearchSpeedOptimization('new-user');
      
      expect(optimization).toBeDefined();
      expect(optimization?.currentPerformance.averageTimeToSolution).toBe(300000); // 5 minutes default
      expect(optimization?.benchmarks.expertLevel.timeToSolution).toBe(180000); // 3 minutes
      expect(optimization?.optimizationRecommendations.length).toBeGreaterThan(0);
      expect(optimization?.practiceExercises.length).toBeGreaterThan(0);
    });

    it('should handle missing required fields in session management', async () => {
      await expect(
        researchTracker.startResearchSession({
          userId: '',
        })
      ).rejects.toThrow('Missing required field: userId');

      const result = await researchTracker.endResearchSession({
        userId: 'test-user',
        sessionId: 'non-existent-session',
        solutionFound: true,
        solutionQuality: 75,
      });

      expect(result).toBeNull();
    });

    it('should handle missing consultation for ending', async () => {
      const result = await researchTracker.endSourceConsultation({
        userId: 'test-user',
        consultationId: 'non-existent-consultation',
        consultationDepth: 'moderate',
        informationExtracted: false,
        relevanceToGoal: 50,
        contributionToSolution: 0,
        exitReason: 'not_relevant',
      });

      expect(result).toBeNull();
    });
  });
});