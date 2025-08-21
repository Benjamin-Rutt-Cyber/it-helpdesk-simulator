import { useCallback, useEffect, useRef } from 'react';

interface ClickTrackingData {
  userId: string;
  sessionId?: string;
  searchId: string;
  resultId: string;
  resultPosition: number;
  clickSequence: number;
  timeSinceSearch: number;
  pageUrl: string;
  credibilityScore: number;
  sourceType: string;
  relevanceScore: number;
}

interface PageVisitData {
  userId: string;
  sessionId?: string;
  clickEventId: string;
  pageUrl: string;
}

interface InteractionData {
  userId: string;
  sessionId?: string;
  visitId?: string;
  interaction: {
    type: 'scroll' | 'click' | 'hover' | 'focus' | 'copy' | 'search_refinement';
    data: any;
    elementId?: string;
    coordinates?: { x: number; y: number };
  };
}

interface SearchQueryData {
  userId: string;
  sessionId?: string;
  query: string;
  resultCount: number;
  parentQueryId?: string;
}

interface QueryRefinementData {
  userId: string;
  sessionId?: string;
  originalQueryId: string;
  refinedQueryId: string;
  timeBetweenQueries: number;
}

interface SourceSelectionData {
  userId: string;
  sessionId?: string;
  searchId: string;
  resultId: string;
  sourceMetadata: {
    url: string;
    title: string;
    domain: string;
    sourceType: 'official' | 'documentation' | 'forum' | 'blog' | 'news' | 'wiki' | 'tutorial' | 'video' | 'unknown';
    authorityLevel: 'high' | 'medium' | 'low' | 'unknown';
    publicationDate?: Date;
    lastUpdated?: Date;
  };
  credibilityScore: number;
  relevanceScore: number;
  timeToSelect: number;
  positionInResults: number;
  allResultsInSearch?: Array<{
    id: string;
    credibilityScore: number;
    relevanceScore: number;
    position: number;
  }>;
}

interface SourceQualityAssessmentData {
  sourceId: string;
  userId: string;
  sessionId?: string;
  assessmentType: 'automatic' | 'manual' | 'behavioral';
  behavioralIndicators: {
    timeSpentReading: number;
    scrollDepth: number;
    copyActions: number;
    returnVisits: number;
    shareActions: number;
  };
  sourceMetadata?: {
    credibilityScore: number;
    relevanceScore: number;
    sourceType: string;
    authorityLevel: string;
    publicationDate?: Date;
  };
}

export function useResearchTracking(userId?: string, sessionId?: string) {
  const searchStartTime = useRef<number | null>(null);
  const clickCounter = useRef<number>(0);
  const currentSearchId = useRef<string | null>(null);
  const activeVisitId = useRef<string | null>(null);
  const scrollDepth = useRef<number>(0);
  const lastQueryId = useRef<string | null>(null);
  const queryStartTime = useRef<number | null>(null);

  // Track search start
  const trackSearchStart = useCallback((searchId: string) => {
    searchStartTime.current = Date.now();
    clickCounter.current = 0;
    currentSearchId.current = searchId;
  }, []);

  // Track result click
  const trackResultClick = useCallback(async (data: Omit<ClickTrackingData, 'userId' | 'sessionId' | 'clickSequence' | 'timeSinceSearch'>) => {
    if (!userId || !searchStartTime.current || !currentSearchId.current) {
      console.warn('Cannot track click: missing required data');
      return null;
    }

    clickCounter.current++;
    const timeSinceSearch = Date.now() - searchStartTime.current;

    const clickData: ClickTrackingData = {
      ...data,
      userId,
      sessionId,
      searchId: currentSearchId.current,
      clickSequence: clickCounter.current,
      timeSinceSearch,
    };

    try {
      const response = await fetch('/api/research/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clickData),
      });

      if (!response.ok) {
        throw new Error('Failed to track click');
      }

      const result = await response.json();
      console.log('Click tracked successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to track click:', error);
      return null;
    }
  }, [userId, sessionId]);

  // Track page visit start
  const trackPageVisitStart = useCallback(async (clickEventId: string, pageUrl: string) => {
    if (!userId) {
      console.warn('Cannot track page visit: missing userId');
      return null;
    }

    const visitData: PageVisitData = {
      userId,
      sessionId,
      clickEventId,
      pageUrl,
    };

    try {
      const response = await fetch('/api/research/track-visit-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData),
      });

      if (!response.ok) {
        throw new Error('Failed to track page visit start');
      }

      const result = await response.json();
      activeVisitId.current = result.id;
      scrollDepth.current = 0;
      console.log('Page visit started:', result);
      return result;
    } catch (error) {
      console.error('Failed to track page visit start:', error);
      return null;
    }
  }, [userId, sessionId]);

  // Track page visit end
  const trackPageVisitEnd = useCallback(async (exitType: 'back' | 'close' | 'new_search' | 'timeout' | 'unknown') => {
    if (!userId || !activeVisitId.current) {
      console.warn('Cannot track page visit end: missing required data');
      return null;
    }

    try {
      const response = await fetch('/api/research/track-visit-end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          visitId: activeVisitId.current,
          exitType,
          finalScrollDepth: scrollDepth.current,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track page visit end');
      }

      const result = await response.json();
      activeVisitId.current = null;
      console.log('Page visit ended:', result);
      return result;
    } catch (error) {
      console.error('Failed to track page visit end:', error);
      return null;
    }
  }, [userId, sessionId]);

  // Track interaction
  const trackInteraction = useCallback(async (interaction: InteractionData['interaction']) => {
    if (!userId) {
      console.warn('Cannot track interaction: missing userId');
      return;
    }

    const interactionData: InteractionData = {
      userId,
      sessionId,
      visitId: activeVisitId.current || undefined,
      interaction,
    };

    try {
      await fetch('/api/research/track-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData),
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }, [userId, sessionId]);

  // Track search query
  const trackSearchQuery = useCallback(async (query: string, resultCount: number, parentQueryId?: string) => {
    if (!userId) {
      console.warn('Cannot track search query: missing userId');
      return null;
    }

    const queryData: SearchQueryData = {
      userId,
      sessionId,
      query,
      resultCount,
      parentQueryId,
    };

    try {
      const response = await fetch('/api/research/track-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryData),
      });

      if (!response.ok) {
        throw new Error('Failed to track search query');
      }

      const result = await response.json();
      
      // Track refinement if this is not the first query
      if (lastQueryId.current && queryStartTime.current) {
        const timeBetweenQueries = Date.now() - queryStartTime.current;
        await trackQueryRefinement(lastQueryId.current, result.data.id, timeBetweenQueries);
      }

      lastQueryId.current = result.data.id;
      queryStartTime.current = Date.now();
      
      console.log('Search query tracked successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to track search query:', error);
      return null;
    }
  }, [userId, sessionId]);

  // Track query refinement
  const trackQueryRefinement = useCallback(async (originalQueryId: string, refinedQueryId: string, timeBetweenQueries: number) => {
    if (!userId) {
      console.warn('Cannot track query refinement: missing userId');
      return null;
    }

    const refinementData: QueryRefinementData = {
      userId,
      sessionId,
      originalQueryId,
      refinedQueryId,
      timeBetweenQueries,
    };

    try {
      const response = await fetch('/api/research/track-refinement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refinementData),
      });

      if (!response.ok) {
        throw new Error('Failed to track query refinement');
      }

      const result = await response.json();
      console.log('Query refinement tracked successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to track query refinement:', error);
      return null;
    }
  }, [userId, sessionId]);

  // Track source selection
  const trackSourceSelection = useCallback(async (
    sourceMetadata: SourceSelectionData['sourceMetadata'],
    credibilityScore: number,
    relevanceScore: number,
    timeToSelect: number,
    positionInResults: number,
    allResultsInSearch?: SourceSelectionData['allResultsInSearch']
  ) => {
    if (!userId || !currentSearchId.current) {
      console.warn('Cannot track source selection: missing userId or searchId');
      return null;
    }

    const selectionData: Omit<SourceSelectionData, 'userId' | 'sessionId'> = {
      searchId: currentSearchId.current,
      resultId: `result-${sourceMetadata.url}`,
      sourceMetadata,
      credibilityScore,
      relevanceScore,
      timeToSelect,
      positionInResults,
      allResultsInSearch,
    };

    try {
      const response = await fetch('/api/research/track-source-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          ...selectionData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track source selection');
      }

      const result = await response.json();
      console.log('Source selection tracked successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to track source selection:', error);
      return null;
    }
  }, [userId, sessionId]);

  // Assess source quality
  const assessSourceQuality = useCallback(async (
    sourceId: string,
    assessmentType: 'automatic' | 'manual' | 'behavioral',
    behavioralIndicators: SourceQualityAssessmentData['behavioralIndicators'],
    sourceMetadata?: SourceQualityAssessmentData['sourceMetadata']
  ) => {
    if (!userId) {
      console.warn('Cannot assess source quality: missing userId');
      return null;
    }

    const assessmentData: Omit<SourceQualityAssessmentData, 'userId' | 'sessionId'> = {
      sourceId,
      assessmentType,
      behavioralIndicators,
      sourceMetadata,
    };

    try {
      const response = await fetch('/api/research/assess-source-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          ...assessmentData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assess source quality');
      }

      const result = await response.json();
      console.log('Source quality assessed successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to assess source quality:', error);
      return null;
    }
  }, [userId, sessionId]);

  // Scroll tracking effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.pageYOffset;
      const newScrollDepth = Math.round((currentScroll / scrollHeight) * 100);
      
      if (newScrollDepth > scrollDepth.current) {
        scrollDepth.current = newScrollDepth;
        
        // Track significant scroll milestones
        if (newScrollDepth % 25 === 0 && newScrollDepth > 0) {
          trackInteraction({
            type: 'scroll',
            data: { scrollDepth: newScrollDepth },
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackInteraction]);

  // Mouse movement and click tracking
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      trackInteraction({
        type: 'click',
        data: { 
          tagName: target.tagName,
          className: target.className,
          innerText: target.innerText?.substring(0, 100),
        },
        elementId: target.id || undefined,
        coordinates: { x: event.clientX, y: event.clientY },
      });
    };

    const handleCopy = () => {
      trackInteraction({
        type: 'copy',
        data: { timestamp: Date.now() },
      });
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('copy', handleCopy);
    };
  }, [trackInteraction]);

  // Page unload tracking
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeVisitId.current) {
        // Use sendBeacon for reliable tracking on page unload
        navigator.sendBeacon('/api/research/track-visit-end', JSON.stringify({
          userId,
          sessionId,
          visitId: activeVisitId.current,
          exitType: 'close',
          finalScrollDepth: scrollDepth.current,
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userId, sessionId]);

  // Get analytics
  const getClickAnalytics = useCallback(async (timeframe?: { start: Date; end: Date }) => {
    if (!userId) {
      console.warn('Cannot get analytics: missing userId');
      return null;
    }

    try {
      const params = new URLSearchParams();
      if (timeframe) {
        params.append('start', timeframe.start.toISOString());
        params.append('end', timeframe.end.toISOString());
      }

      const response = await fetch(`/api/research/analytics/clicks/${userId}?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get click analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get click analytics:', error);
      return null;
    }
  }, [userId]);

  const getPageVisitAnalytics = useCallback(async (timeframe?: { start: Date; end: Date }) => {
    if (!userId) {
      console.warn('Cannot get analytics: missing userId');
      return null;
    }

    try {
      const params = new URLSearchParams();
      if (timeframe) {
        params.append('start', timeframe.start.toISOString());
        params.append('end', timeframe.end.toISOString());
      }

      const response = await fetch(`/api/research/analytics/visits/${userId}?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get page visit analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get page visit analytics:', error);
      return null;
    }
  }, [userId]);

  const getSearchAnalytics = useCallback(async (timeframe?: { start: Date; end: Date }) => {
    if (!userId) {
      console.warn('Cannot get search analytics: missing userId');
      return null;
    }

    try {
      const params = new URLSearchParams();
      if (timeframe) {
        params.append('start', timeframe.start.toISOString());
        params.append('end', timeframe.end.toISOString());
      }

      const response = await fetch(`/api/research/analytics/search/${userId}?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get search analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get search analytics:', error);
      return null;
    }
  }, [userId]);

  const getSearchPatterns = useCallback(async (limit: number = 10) => {
    if (!userId) {
      console.warn('Cannot get search patterns: missing userId');
      return null;
    }

    try {
      const response = await fetch(`/api/research/search-patterns/${userId}?limit=${limit}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get search patterns');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get search patterns:', error);
      return null;
    }
  }, [userId]);

  const getComprehensiveAnalytics = useCallback(async (timeframe?: { start: Date; end: Date }) => {
    if (!userId) {
      console.warn('Cannot get comprehensive analytics: missing userId');
      return null;
    }

    try {
      const params = new URLSearchParams();
      if (timeframe) {
        params.append('start', timeframe.start.toISOString());
        params.append('end', timeframe.end.toISOString());
      }

      const response = await fetch(`/api/research/analytics/${userId}?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get comprehensive analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get comprehensive analytics:', error);
      return null;
    }
  }, [userId]);

  const getSourceSelectionAnalytics = useCallback(async (timeframe?: { start: Date; end: Date }) => {
    if (!userId) {
      console.warn('Cannot get source selection analytics: missing userId');
      return null;
    }

    try {
      const params = new URLSearchParams();
      if (timeframe) {
        params.append('start', timeframe.start.toISOString());
        params.append('end', timeframe.end.toISOString());
      }

      const response = await fetch(`/api/research/analytics/source-selection/${userId}?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get source selection analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get source selection analytics:', error);
      return null;
    }
  }, [userId]);

  const getSourceSelectionPatterns = useCallback(async (limit: number = 10) => {
    if (!userId) {
      console.warn('Cannot get source selection patterns: missing userId');
      return null;
    }

    try {
      const response = await fetch(`/api/research/source-selection-patterns/${userId}?limit=${limit}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get source selection patterns');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get source selection patterns:', error);
      return null;
    }
  }, [userId]);

  // Start research session
  const startResearchSession = useCallback(async (sessionGoal?: string) => {
    if (!userId) {
      console.warn('Cannot start research session: missing userId');
      return null;
    }

    try {
      const response = await fetch('/api/research/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          sessionGoal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start research session');
      }

      const result = await response.json();
      console.log('Research session started:', result);
      return result;
    } catch (error) {
      console.error('Failed to start research session:', error);
      return null;
    }
  }, [userId, sessionId]);

  // End research session
  const endResearchSession = useCallback(async (
    researchSessionId: string,
    solutionFound: boolean,
    solutionQuality: number
  ) => {
    if (!userId) {
      console.warn('Cannot end research session: missing userId');
      return null;
    }

    try {
      const response = await fetch('/api/research/end-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          researchSessionId,
          solutionFound,
          solutionQuality,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end research session');
      }

      const result = await response.json();
      console.log('Research session ended:', result);
      return result;
    } catch (error) {
      console.error('Failed to end research session:', error);
      return null;
    }
  }, [userId, sessionId]);

  // Track source consultation
  const trackSourceConsultation = useCallback(async (
    sourceId: string,
    sourceUrl: string,
    sourceType: string,
    consultationReason: 'initial_search' | 'follow_up' | 'verification' | 'comparison' | 'alternative_perspective'
  ) => {
    if (!userId) {
      console.warn('Cannot track source consultation: missing userId');
      return null;
    }

    try {
      const response = await fetch('/api/research/track-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          sourceId,
          sourceUrl,
          sourceType,
          consultationReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track source consultation');
      }

      const result = await response.json();
      console.log('Source consultation tracked:', result);
      return result;
    } catch (error) {
      console.error('Failed to track source consultation:', error);
      return null;
    }
  }, [userId, sessionId]);

  // End source consultation
  const endSourceConsultation = useCallback(async (
    consultationId: string,
    consultationDepth: 'surface' | 'moderate' | 'deep',
    informationExtracted: boolean,
    relevanceToGoal: number,
    contributionToSolution: number,
    exitReason: 'found_answer' | 'not_relevant' | 'insufficient_detail' | 'moved_to_better_source' | 'completed_task'
  ) => {
    if (!userId) {
      console.warn('Cannot end source consultation: missing userId');
      return null;
    }

    try {
      const response = await fetch('/api/research/end-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          consultationId,
          consultationDepth,
          informationExtracted,
          relevanceToGoal,
          contributionToSolution,
          exitReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end source consultation');
      }

      const result = await response.json();
      console.log('Source consultation ended:', result);
      return result;
    } catch (error) {
      console.error('Failed to end source consultation:', error);
      return null;
    }
  }, [userId]);

  // Get research efficiency metrics
  const getResearchEfficiencyMetrics = useCallback(async (timeframe?: { start: Date; end: Date }) => {
    if (!userId) {
      console.warn('Cannot get research efficiency metrics: missing userId');
      return null;
    }

    try {
      const params = new URLSearchParams();
      if (timeframe) {
        params.append('start', timeframe.start.toISOString());
        params.append('end', timeframe.end.toISOString());
      }

      const response = await fetch(`/api/research/efficiency/${userId}?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get research efficiency metrics');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get research efficiency metrics:', error);
      return null;
    }
  }, [userId]);

  // Get research speed optimization
  const getResearchSpeedOptimization = useCallback(async () => {
    if (!userId) {
      console.warn('Cannot get research speed optimization: missing userId');
      return null;
    }

    try {
      const response = await fetch(`/api/research/speed-optimization/${userId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get research speed optimization');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get research speed optimization:', error);
      return null;
    }
  }, [userId]);

  return {
    // Search tracking
    trackSearchStart,
    trackSearchQuery,
    
    // Click tracking
    trackResultClick,
    
    // Page visit tracking
    trackPageVisitStart,
    trackPageVisitEnd,
    
    // Interaction tracking
    trackInteraction,

    // Source selection tracking
    trackSourceSelection,
    assessSourceQuality,

    // Research session tracking
    startResearchSession,
    endResearchSession,
    trackSourceConsultation,
    endSourceConsultation,
    
    // Analytics
    getClickAnalytics,
    getPageVisitAnalytics,
    getSearchAnalytics,
    getSearchPatterns,
    getSourceSelectionAnalytics,
    getSourceSelectionPatterns,
    getComprehensiveAnalytics,
    getResearchEfficiencyMetrics,
    getResearchSpeedOptimization,
    
    // State
    currentSearchId: currentSearchId.current,
    activeVisitId: activeVisitId.current,
    lastQueryId: lastQueryId.current,
  };
}