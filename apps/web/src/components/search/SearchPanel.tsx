import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Clock, BookOpen, ExternalLink, ArrowLeft } from 'lucide-react';
import { useSearchIntegration } from '../../hooks/useSearchIntegration';
import { SearchResult, SearchFilter, TicketContext } from '../../types/search';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ticketContext?: TicketContext;
  onResultReference?: (result: SearchResult) => void;
  className?: string;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
  ticketContext,
  onResultReference,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<SearchFilter>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    searchResults,
    isLoading,
    error,
    performSearch,
    clearResults,
    getSearchSuggestions,
    trackSearchEvent
  } = useSearchIntegration({
    ticketContext,
    persistSession: true
  });

  // Auto-focus search input when panel opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Generate contextual search suggestions when panel opens
  useEffect(() => {
    if (isOpen && ticketContext && !searchQuery) {
      const suggestions = getSearchSuggestions(ticketContext);
      if (suggestions.length > 0) {
        setSearchQuery(suggestions[0]);
      }
    }
  }, [isOpen, ticketContext, getSearchSuggestions, searchQuery]);

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;

    // Add to search history
    setSearchHistory(prev => {
      const updated = [query, ...prev.filter(q => q !== query)].slice(0, 10);
      return updated;
    });

    // Perform search with context and filters
    await performSearch(query, selectedFilters);
    
    // Track search event
    trackSearchEvent('search_performed', {
      query,
      filters: selectedFilters,
      hasTicketContext: !!ticketContext
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    trackSearchEvent('result_clicked', {
      resultId: result.id,
      position: result.position,
      credibilityScore: result.credibilityScore
    });

    if (onResultReference) {
      onResultReference(result);
    }
  };

  const handleHistoryItemClick = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const toggleFilter = (filterType: keyof SearchFilter, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? undefined : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={`search-panel ${className}`}>
      {/* Search Panel Header */}
      <div className="search-panel-header">
        <div className="search-header-content">
          <div className="search-title">
            <BookOpen className="search-icon" />
            <span>Knowledge Base Search</span>
            {ticketContext && (
              <span className="context-indicator">
                • Contextual results for ticket #{ticketContext.ticketId}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="close-button"
            aria-label="Close search panel"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <Search className="search-input-icon" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={ticketContext 
                ? `Search for solutions related to "${ticketContext.issueType}"...`
                : "Search knowledge base..."
              }
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="clear-search-button"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="search-actions">
            <button
              onClick={() => handleSearch()}
              disabled={!searchQuery.trim() || isLoading}
              className="search-button"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`filter-button ${showFilters ? 'active' : ''}`}
              aria-label="Toggle search filters"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Search Filters */}
        {showFilters && (
          <div className="search-filters">
            <div className="filter-group">
              <label className="filter-label">Source Type</label>
              <div className="filter-options">
                {['official', 'community', 'documentation', 'forum'].map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('sourceType', type)}
                    className={`filter-option ${selectedFilters.sourceType === type ? 'active' : ''}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Credibility</label>
              <div className="filter-options">
                {['high', 'medium', 'all'].map(level => (
                  <button
                    key={level}
                    onClick={() => toggleFilter('credibility', level)}
                    className={`filter-option ${selectedFilters.credibility === level ? 'active' : ''}`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <div className="filter-options">
                {['week', 'month', 'year', 'all'].map(range => (
                  <button
                    key={range}
                    onClick={() => toggleFilter('dateRange', range)}
                    className={`filter-option ${selectedFilters.dateRange === range ? 'active' : ''}`}
                  >
                    Past {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && !searchQuery && (
          <div className="search-history">
            <div className="search-history-header">
              <Clock size={14} />
              <span>Recent Searches</span>
            </div>
            <div className="search-history-items">
              {searchHistory.slice(0, 5).map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryItemClick(query)}
                  className="search-history-item"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="search-results-container">
        {error && (
          <div className="search-error">
            <p>Search error: {error}</p>
            <button onClick={() => handleSearch()} className="retry-button">
              Retry Search
            </button>
          </div>
        )}

        {isLoading && (
          <div className="search-loading">
            <div className="loading-spinner" />
            <p>Searching knowledge base...</p>
          </div>
        )}

        {searchResults && searchResults.length > 0 && !isLoading && (
          <div className="search-results">
            <div className="results-header">
              <span className="results-count">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </span>
              {ticketContext && (
                <span className="context-note">
                  Results prioritized for your current ticket
                </span>
              )}
            </div>

            <div className="results-list">
              {searchResults.map((result, index) => (
                <div 
                  key={result.id}
                  className={`search-result-item ${result.credibilityLevel}`}
                  onClick={() => handleResultClick(result)}
                >
                  {/* Credibility Indicator */}
                  <div className={`credibility-indicator ${result.credibilityLevel}`}>
                    <div className="credibility-badge">
                      {result.credibilityLevel === 'high' && '🟢'}
                      {result.credibilityLevel === 'medium' && '🟡'}
                      {result.credibilityLevel === 'low' && '🔴'}
                    </div>
                  </div>

                  {/* Result Content */}
                  <div className="result-content">
                    <h3 className="result-title">{result.title}</h3>
                    <p className="result-snippet">{result.snippet}</p>
                    
                    <div className="result-metadata">
                      <span className="result-source">{result.source}</span>
                      <span className="result-date">{result.date}</span>
                      <span className="result-type">{result.sourceType}</span>
                      {result.relevanceToTicket && (
                        <span className="relevance-score">
                          {Math.round(result.relevanceToTicket * 100)}% relevant
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Result Actions */}
                  <div className="result-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResultClick(result);
                      }}
                      className="reference-button"
                      title="Reference in ticket notes"
                    >
                      <BookOpen size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(result.url, '_blank');
                      }}
                      className="open-button"
                      title="Open in new tab"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchResults && searchResults.length === 0 && !isLoading && searchQuery && (
          <div className="no-results">
            <BookOpen size={48} className="no-results-icon" />
            <h3>No results found</h3>
            <p>Try different keywords or check your search filters</p>
            <div className="no-results-suggestions">
              <p>Suggestions:</p>
              <ul>
                <li>Use more general terms</li>
                <li>Check spelling and try synonyms</li>
                <li>Remove some search filters</li>
                <li>Try searching for error codes or symptoms</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="search-panel-footer">
        <div className="footer-content">
          <div className="search-tips">
            <strong>Search tips:</strong> Use specific error messages, product names, or technical terms for best results
          </div>
          
          {ticketContext && (
            <div className="context-actions">
              <button
                onClick={() => {
                  const contextQuery = `${ticketContext.issueType} ${ticketContext.customerEnvironment}`.trim();
                  setSearchQuery(contextQuery);
                  handleSearch(contextQuery);
                }}
                className="context-search-button"
              >
                Search ticket context
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;