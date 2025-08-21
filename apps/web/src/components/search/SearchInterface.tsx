import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { SearchBox } from './SearchBox';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';
import { SearchHistory } from './SearchHistory';
import { useResearchTracking } from '@/hooks/useResearchTracking';
import { cn } from '@/lib/utils';

interface SearchResponse {
  query: string;
  results: any[];
  totalResults: number;
  searchTime: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  suggestions?: string[];
  relatedQueries?: string[];
  filters: {
    appliedFilters: any;
    availableFilters: any;
  };
}

interface SearchInterfaceProps {
  userId?: string;
  sessionId?: string;
  className?: string;
  initialQuery?: string;
  contextualKeywords?: string[];
  onResultClick?: (resultId: string, position: number) => void;
  compact?: boolean;
}

export function SearchInterface({
  userId,
  sessionId,
  className,
  initialQuery = '',
  contextualKeywords = [],
  onResultClick,
  compact = false
}: SearchInterfaceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchStartTime, setSearchStartTime] = useState<number>(0);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  
  // Initialize research tracking
  const {
    trackSearchStart,
    trackSearchQuery,
    trackResultClick,
    trackPageVisitStart,
    trackPageVisitEnd,
    trackInteraction,
    trackSourceSelection,
  } = useResearchTracking(userId, sessionId);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = useCallback(async (
    searchQuery: string, 
    page: number = 1, 
    filters: any = {}
  ) => {
    if (!searchQuery.trim()) {
      setSearchResponse(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchStartTime(Date.now());
      
      // Generate unique search ID and track search start
      const searchId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSearchId(searchId);
      trackSearchStart(searchId);

      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        limit: '10',
        ...(userId && { userId }),
        ...(sessionId && { sessionId }),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : value.toString()
          ])
        )
      });

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      setSearchResponse(result.data);
      setCurrentPage(page);

      // Track the search query with results count
      if (userId && result.data) {
        try {
          await trackSearchQuery(
            searchQuery, 
            result.data.totalResults || 0,
            // Include parent query ID for refinements
            currentSearchId && searchQuery !== query ? currentSearchId : undefined
          );
        } catch (trackingError) {
          console.warn('Failed to track search query:', trackingError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId, query, currentSearchId, trackSearchQuery]);

  const handleSearch = (searchQuery: string) => {
    // Track search refinement if this is not the first search
    if (currentSearchId && query && query !== searchQuery) {
      trackInteraction({
        type: 'search_refinement',
        data: {
          originalQuery: query,
          newQuery: searchQuery,
          refinementType: 'query_modification',
        },
      });
    }
    
    setQuery(searchQuery);
    setCurrentPage(1);
    performSearch(searchQuery, 1, activeFilters);
  };

  const handleFilterChange = (newFilters: any) => {
    // Track filter refinement
    if (currentSearchId && Object.keys(activeFilters).length > 0) {
      trackInteraction({
        type: 'search_refinement',
        data: {
          originalFilters: activeFilters,
          newFilters: newFilters,
          refinementType: 'filter_modification',
        },
      });
    }
    
    setActiveFilters(newFilters);
    if (query) {
      performSearch(query, 1, newFilters);
    }
  };

  const handlePageChange = (page: number) => {
    if (query) {
      performSearch(query, page, activeFilters);
    }
  };

  const handleResultClick = async (resultId: string, position: number) => {
    // Find the clicked result to get its properties
    const clickedResult = searchResponse?.results.find(r => r.id === resultId);
    
    if (userId && currentSearchId && clickedResult) {
      try {
        const clickStartTime = Date.now();

        // Track the click with comprehensive data
        const clickEvent = await trackResultClick({
          resultId,
          resultPosition: position,
          pageUrl: clickedResult.url,
          credibilityScore: clickedResult.credibility?.score || 0,
          sourceType: clickedResult.source?.type || 'unknown',
          relevanceScore: clickedResult.relevanceScore || 0,
        });

        // Track source selection with detailed metadata
        if (clickedResult.source) {
          const sourceMetadata = {
            url: clickedResult.url,
            title: clickedResult.title || 'Unknown Title',
            domain: new URL(clickedResult.url).hostname,
            sourceType: clickedResult.source.type || 'unknown',
            authorityLevel: clickedResult.source.authority || 'unknown',
            publicationDate: clickedResult.source.publishedDate ? new Date(clickedResult.source.publishedDate) : undefined,
            lastUpdated: clickedResult.source.lastUpdated ? new Date(clickedResult.source.lastUpdated) : undefined,
          } as const;

          // Gather all results for competitor analysis
          const allResultsInSearch = searchResponse?.results.map((result, index) => ({
            id: result.id,
            credibilityScore: result.credibility?.score || 0,
            relevanceScore: result.relevanceScore || 0,
            position: index + 1,
          }));

          await trackSourceSelection(
            sourceMetadata,
            clickedResult.credibility?.score || 0,
            clickedResult.relevanceScore || 0,
            Date.now() - clickStartTime, // Time to select
            position,
            allResultsInSearch
          );
        }

        // If the result opens in a new page, start tracking page visit
        if (clickEvent && clickedResult.url.startsWith('http')) {
          await trackPageVisitStart(clickEvent.id, clickedResult.url);
        }
      } catch (error) {
        console.warn('Failed to track result click or source selection:', error);
      }
    }

    onResultClick?.(resultId, position);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResponse(null);
    setActiveFilters({});
    setCurrentPage(1);
    setError(null);
  };

  if (compact) {
    return (
      <div className={cn('w-full max-w-2xl', className)}>
        <SearchBox
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          placeholder="Search knowledge base..."
          suggestions={searchResponse?.suggestions}
          loading={loading}
          compact={true}
        />
        
        {searchResponse && (
          <div className="mt-4">
            <SearchResults
              results={searchResponse.results}
              totalResults={searchResponse.totalResults}
              searchTime={searchResponse.searchTime}
              pagination={searchResponse.pagination}
              onPageChange={handlePageChange}
              onResultClick={handleResultClick}
              loading={loading}
              compact={true}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Knowledge Base Search</h2>
            <p className="text-gray-600">
              Search through curated IT support resources and documentation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Search History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-md transition-colors',
                showFilters 
                  ? 'text-blue-700 bg-blue-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
              title="Search Filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 21v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>

            {(query || Object.keys(activeFilters).length > 0) && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Clear Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Contextual Keywords */}
        {contextualKeywords.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Related to your current issue:</p>
            <div className="flex flex-wrap gap-2">
              {contextualKeywords.map((keyword, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(keyword)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Box */}
      <div className="mb-6">
        <SearchBox
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          placeholder="Search for solutions, documentation, and guides..."
          suggestions={searchResponse?.suggestions}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Filters */}
          {showFilters && (
            <SearchFilters
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              availableFilters={searchResponse?.filters.availableFilters}
            />
          )}

          {/* Search History */}
          {showHistory && userId && (
            <SearchHistory
              userId={userId}
              onHistoryItemClick={handleSearch}
            />
          )}

          {/* Related Queries */}
          {searchResponse?.relatedQueries && searchResponse.relatedQueries.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>🔗</span>
                Related Searches
              </h3>
              <div className="space-y-2">
                {searchResponse.relatedQueries.map((relatedQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(relatedQuery)}
                    className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {relatedQuery}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {error && (
            <Card className="p-6 mb-6 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 text-red-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Search Error</span>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </Card>
          )}

          {searchResponse ? (
            <SearchResults
              results={searchResponse.results}
              totalResults={searchResponse.totalResults}
              searchTime={searchResponse.searchTime}
              pagination={searchResponse.pagination}
              onPageChange={handlePageChange}
              onResultClick={handleResultClick}
              loading={loading}
              query={query}
            />
          ) : !loading && query && (
            <Card className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Results Found</h3>
              <p className="text-gray-500">
                Try adjusting your search terms or removing filters
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}