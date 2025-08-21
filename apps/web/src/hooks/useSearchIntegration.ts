import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  SearchResult, 
  SearchFilter, 
  TicketContext, 
  SearchSession,
  ContextExtraction,
  SearchEventType 
} from '../types/search';

interface UseSearchIntegrationOptions {
  ticketContext?: TicketContext;
  persistSession?: boolean;
  enableContextAnalysis?: boolean;
  sessionId?: string;
}

interface SearchIntegrationState {
  searchResults: SearchResult[];
  isLoading: boolean;
  error: string | null;
  searchSession: SearchSession | null;
  contextualSuggestions: string[];
}

export const useSearchIntegration = (options: UseSearchIntegrationOptions = {}) => {
  const [state, setState] = useState<SearchIntegrationState>({
    searchResults: [],
    isLoading: false,
    error: null,
    searchSession: null,
    contextualSuggestions: []
  });

  const sessionRef = useRef<string>(options.sessionId || generateSessionId());
  const searchHistoryRef = useRef<string[]>([]);
  const eventTrackingRef = useRef<any[]>([]);

  // Initialize search session
  useEffect(() => {
    if (options.persistSession) {
      initializeSearchSession();
    }
  }, [options.persistSession, options.ticketContext]);

  const generateSessionId = () => {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const initializeSearchSession = async () => {
    try {
      const session: SearchSession = {
        sessionId: sessionRef.current,
        ticketId: options.ticketContext?.ticketId,
        startTime: new Date(),
        searchHistory: [],
        resultsViewed: [],
        contextExtracted: options.enableContextAnalysis && options.ticketContext 
          ? await extractTicketContext(options.ticketContext)
          : null,
        isActive: true
      };

      setState(prev => ({ ...prev, searchSession: session }));
    } catch (error) {
      console.error('Failed to initialize search session:', error);
    }
  };

  // Core search functionality
  const performSearch = useCallback(async (
    query: string, 
    filters: SearchFilter = {},
    contextOverride?: TicketContext
  ): Promise<SearchResult[]> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const searchContext = contextOverride || options.ticketContext;
      const requestBody = {
        query: query.trim(),
        filters,
        ticketContext: searchContext,
        sessionId: sessionRef.current,
        enableContextualRanking: !!searchContext
      };

      const response = await fetch('/api/v1/search/integrated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      const results: SearchResult[] = data.results || [];

      // Add search to history
      searchHistoryRef.current = [query, ...searchHistoryRef.current.slice(0, 9)];

      // Update search session
      if (state.searchSession) {
        const updatedSession = {
          ...state.searchSession,
          searchHistory: [...state.searchSession.searchHistory, {
            query,
            timestamp: new Date(),
            resultCount: results.length,
            filters
          }]
        };
        
        setState(prev => ({ 
          ...prev, 
          searchResults: results, 
          searchSession: updatedSession,
          isLoading: false 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          searchResults: results, 
          isLoading: false 
        }));
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [options.ticketContext, state.searchSession]);

  // Contextual search with ticket context
  const performContextualSearch = useCallback(async (
    query: string,
    ticketContext: TicketContext,
    searchConfig?: any
  ): Promise<SearchResult[]> => {
    try {
      const response = await fetch('/api/v1/search/contextual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ticketContext,
          sessionId: sessionRef.current,
          config: searchConfig
        })
      });

      if (!response.ok) {
        throw new Error('Contextual search failed');
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Contextual search error:', error);
      return [];
    }
  }, []);

  // Extract key information from ticket context
  const extractTicketContext = useCallback(async (ticketContext: TicketContext): Promise<ContextExtraction> => {
    try {
      const response = await fetch('/api/v1/search/extract-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketContext })
      });

      if (!response.ok) {
        throw new Error('Context extraction failed');
      }

      const extraction = await response.json();
      return extraction;
    } catch (error) {
      console.error('Context extraction error:', error);
      return {
        keywords: [],
        entities: [],
        sentiment: 'neutral',
        urgency: 'medium',
        technicalLevel: 'intermediate',
        suggestedQueries: []
      };
    }
  }, []);

  // Prioritize search results based on ticket context
  const prioritizeResults = useCallback(async (
    results: SearchResult[],
    ticketContext: TicketContext
  ): Promise<SearchResult[]> => {
    try {
      const response = await fetch('/api/v1/search/prioritize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results,
          ticketContext,
          sessionId: sessionRef.current
        })
      });

      if (!response.ok) {
        throw new Error('Result prioritization failed');
      }

      const data = await response.json();
      return data.prioritizedResults || results;
    } catch (error) {
      console.error('Result prioritization error:', error);
      return results;
    }
  }, []);

  // Generate search suggestions based on ticket context
  const getSearchSuggestions = useCallback((ticketContext?: TicketContext): string[] => {
    if (!ticketContext) return [];

    const suggestions = [];
    
    // Basic issue-based suggestions
    if (ticketContext.issueType) {
      suggestions.push(ticketContext.issueType);
      suggestions.push(`${ticketContext.issueType} troubleshooting`);
      suggestions.push(`how to fix ${ticketContext.issueType}`);
    }

    // Environment-specific suggestions
    if (ticketContext.customerEnvironment) {
      suggestions.push(`${ticketContext.issueType} ${ticketContext.customerEnvironment}`);
    }

    // Error code suggestions
    if (ticketContext.errorCode) {
      suggestions.push(ticketContext.errorCode);
      suggestions.push(`error ${ticketContext.errorCode} solution`);
    }

    // Tag-based suggestions
    if (ticketContext.tags && ticketContext.tags.length > 0) {
      ticketContext.tags.forEach(tag => {
        suggestions.push(`${tag} ${ticketContext.issueType}`);
      });
    }

    return [...new Set(suggestions)].slice(0, 10);
  }, []);

  const generateSearchSuggestions = useCallback((ticketContext: TicketContext): string[] => {
    return getSearchSuggestions(ticketContext);
  }, [getSearchSuggestions]);

  // Track search-related events for analytics
  const trackSearchEvent = useCallback((eventType: SearchEventType, data: any) => {
    const event = {
      type: eventType,
      timestamp: new Date(),
      sessionId: sessionRef.current,
      ticketId: options.ticketContext?.ticketId,
      data
    };

    eventTrackingRef.current.push(event);

    // Send to analytics endpoint
    fetch('/api/v1/research/track-search-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    }).catch(error => {
      console.warn('Failed to track search event:', error);
    });
  }, [options.ticketContext]);

  // Clear search results
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchResults: [],
      error: null
    }));
  }, []);

  // Get search history
  const getSearchHistory = useCallback(() => {
    return searchHistoryRef.current;
  }, []);

  // Save search result reference
  const saveResultReference = useCallback(async (result: SearchResult, notes?: string) => {
    try {
      const reference = {
        resultId: result.id,
        ticketId: options.ticketContext?.ticketId,
        sessionId: sessionRef.current,
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        credibilityLevel: result.credibilityLevel,
        notes,
        savedAt: new Date()
      };

      const response = await fetch('/api/v1/search/save-reference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reference)
      });

      if (!response.ok) {
        throw new Error('Failed to save reference');
      }

      trackSearchEvent('result_referenced', {
        resultId: result.id,
        hasNotes: !!notes
      });

      return await response.json();
    } catch (error) {
      console.error('Error saving result reference:', error);
      throw error;
    }
  }, [options.ticketContext, trackSearchEvent]);

  // Get saved references for current ticket
  const getSavedReferences = useCallback(async () => {
    if (!options.ticketContext?.ticketId) return [];

    try {
      const response = await fetch(
        `/api/v1/search/references/${options.ticketContext.ticketId}?sessionId=${sessionRef.current}`
      );

      if (!response.ok) {
        throw new Error('Failed to get saved references');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting saved references:', error);
      return [];
    }
  }, [options.ticketContext]);

  // End search session
  const endSearchSession = useCallback(async () => {
    if (!state.searchSession) return;

    try {
      const sessionSummary = {
        ...state.searchSession,
        endTime: new Date(),
        totalSearches: state.searchSession.searchHistory.length,
        totalResults: state.searchResults.length,
        events: eventTrackingRef.current,
        isActive: false
      };

      const response = await fetch('/api/v1/search/end-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionSummary)
      });

      if (!response.ok) {
        console.warn('Failed to end search session properly');
      }

      setState(prev => ({ ...prev, searchSession: null }));
    } catch (error) {
      console.error('Error ending search session:', error);
    }
  }, [state.searchSession, state.searchResults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (options.persistSession) {
        endSearchSession();
      }
    };
  }, [endSearchSession, options.persistSession]);

  return {
    // State
    searchResults: state.searchResults,
    isLoading: state.isLoading,
    error: state.error,
    searchSession: state.searchSession,
    
    // Search functions
    performSearch,
    performContextualSearch,
    clearResults,
    
    // Context functions
    extractTicketContext,
    prioritizeResults,
    getSearchSuggestions: generateSearchSuggestions,
    
    // Utility functions
    trackSearchEvent,
    getSearchHistory,
    saveResultReference,
    getSavedReferences,
    endSearchSession
  };
};