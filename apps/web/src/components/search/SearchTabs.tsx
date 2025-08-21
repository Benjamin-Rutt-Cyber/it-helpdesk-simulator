import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, X, Search, RotateCw, BookOpen, Clock } from 'lucide-react';
import { SearchTab, SearchResult, SearchFilter, TicketContext } from '../../types/search';
import { useSearchIntegration } from '../../hooks/useSearchIntegration';

interface SearchTabsProps {
  ticketContext?: TicketContext;
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

interface TabState {
  query: string;
  filters: SearchFilter;
  isLoading: boolean;
  results: SearchResult[];
  error: string | null;
}

export const SearchTabs: React.FC<SearchTabsProps> = ({
  ticketContext,
  onResultSelect,
  className = ''
}) => {
  const [tabs, setTabs] = useState<SearchTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabStates, setTabStates] = useState<Map<string, TabState>>(new Map());
  const tabInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const nextTabId = useRef(1);

  const { performSearch, trackSearchEvent, getSearchHistory } = useSearchIntegration({
    ticketContext,
    persistSession: true
  });

  // Create initial tab on mount
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    }
  }, []);

  // Focus active tab input when tab changes
  useEffect(() => {
    if (activeTabId) {
      const inputRef = tabInputRefs.current.get(activeTabId);
      if (inputRef) {
        inputRef.focus();
      }
    }
  }, [activeTabId]);

  const createNewTab = useCallback((initialQuery: string = '', label?: string) => {
    const tabId = `tab-${nextTabId.current++}`;
    const newTab: SearchTab = {
      id: tabId,
      label: label || `Search ${nextTabId.current - 1}`,
      query: initialQuery,
      filters: {},
      isActive: true,
      createdAt: new Date(),
      ticketContext
    };

    const initialState: TabState = {
      query: initialQuery,
      filters: {},
      isLoading: false,
      results: [],
      error: null
    };

    setTabs(prev => {
      const updated = prev.map(tab => ({ ...tab, isActive: false }));
      return [...updated, newTab];
    });

    setTabStates(prev => new Map(prev).set(tabId, initialState));
    setActiveTabId(tabId);

    trackSearchEvent('tab_created', {
      tabId,
      hasInitialQuery: !!initialQuery,
      hasTicketContext: !!ticketContext
    });

    return tabId;
  }, [ticketContext, trackSearchEvent]);

  const closeTab = useCallback((tabId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (tabs.length === 1) {
      // Don't close the last tab, just clear it
      setTabStates(prev => {
        const updated = new Map(prev);
        const currentState = updated.get(tabId);
        if (currentState) {
          updated.set(tabId, {
            ...currentState,
            query: '',
            results: [],
            error: null
          });
        }
        return updated;
      });
      return;
    }

    setTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      // If we're closing the active tab, activate the next available tab
      if (activeTabId === tabId && filtered.length > 0) {
        const currentIndex = prev.findIndex(tab => tab.id === tabId);
        const nextIndex = Math.min(currentIndex, filtered.length - 1);
        const nextTab = filtered[nextIndex];
        setActiveTabId(nextTab.id);
      }
      return filtered;
    });

    setTabStates(prev => {
      const updated = new Map(prev);
      updated.delete(tabId);
      return updated;
    });

    tabInputRefs.current.delete(tabId);

    trackSearchEvent('tab_closed', {
      tabId,
      remainingTabs: tabs.length - 1
    });
  }, [tabs, activeTabId, trackSearchEvent]);

  const switchToTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
    setActiveTabId(tabId);

    trackSearchEvent('tab_switched', { tabId });
  }, [trackSearchEvent]);

  const updateTabQuery = useCallback((tabId: string, query: string) => {
    setTabStates(prev => {
      const updated = new Map(prev);
      const currentState = updated.get(tabId);
      if (currentState) {
        updated.set(tabId, { ...currentState, query });
      }
      return updated;
    });

    // Update tab label based on query
    setTabs(prev => prev.map(tab => {
      if (tab.id === tabId) {
        return {
          ...tab,
          query,
          label: query ? query.slice(0, 20) + (query.length > 20 ? '...' : '') : `Search ${tab.id.split('-')[1]}`
        };
      }
      return tab;
    }));
  }, []);

  const updateTabFilters = useCallback((tabId: string, filters: SearchFilter) => {
    setTabStates(prev => {
      const updated = new Map(prev);
      const currentState = updated.get(tabId);
      if (currentState) {
        updated.set(tabId, { ...currentState, filters });
      }
      return updated;
    });

    setTabs(prev => prev.map(tab => {
      if (tab.id === tabId) {
        return { ...tab, filters };
      }
      return tab;
    }));
  }, []);

  const performTabSearch = useCallback(async (tabId: string) => {
    const tabState = tabStates.get(tabId);
    if (!tabState || !tabState.query.trim()) return;

    try {
      setTabStates(prev => {
        const updated = new Map(prev);
        updated.set(tabId, { ...tabState, isLoading: true, error: null });
        return updated;
      });

      const results = await performSearch(tabState.query, tabState.filters);

      setTabStates(prev => {
        const updated = new Map(prev);
        updated.set(tabId, {
          ...tabState,
          isLoading: false,
          results,
          error: null
        });
        return updated;
      });

      // Update tab with results
      setTabs(prev => prev.map(tab => {
        if (tab.id === tabId) {
          return { ...tab, results };
        }
        return tab;
      }));

      trackSearchEvent('tab_search_performed', {
        tabId,
        query: tabState.query,
        resultCount: results.length,
        hasFilters: Object.keys(tabState.filters).length > 0
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      
      setTabStates(prev => {
        const updated = new Map(prev);
        updated.set(tabId, {
          ...tabState,
          isLoading: false,
          error: errorMessage
        });
        return updated;
      });
    }
  }, [tabStates, performSearch, trackSearchEvent]);

  const handleTabKeyPress = useCallback((tabId: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      performTabSearch(tabId);
    } else if (event.key === 'Escape') {
      const inputRef = tabInputRefs.current.get(tabId);
      if (inputRef) {
        inputRef.blur();
      }
    }
  }, [performTabSearch]);

  const handleResultClick = useCallback((result: SearchResult, tabId: string) => {
    trackSearchEvent('tab_result_clicked', {
      tabId,
      resultId: result.id,
      position: result.position,
      credibilityLevel: result.credibilityLevel
    });

    if (onResultSelect) {
      onResultSelect(result);
    }
  }, [onResultSelect, trackSearchEvent]);

  const duplicateTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    const tabState = tabStates.get(tabId);
    
    if (tab && tabState) {
      const newTabId = createNewTab(tabState.query, `${tab.label} (Copy)`);
      
      // Copy filters to new tab
      if (Object.keys(tabState.filters).length > 0) {
        updateTabFilters(newTabId, tabState.filters);
      }

      trackSearchEvent('tab_duplicated', {
        originalTabId: tabId,
        newTabId
      });
    }
  }, [tabs, tabStates, createNewTab, updateTabFilters, trackSearchEvent]);

  const getActiveTabState = useCallback(() => {
    if (!activeTabId) return null;
    return tabStates.get(activeTabId) || null;
  }, [activeTabId, tabStates]);

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const activeTabState = getActiveTabState();

  return (
    <div className={`search-tabs ${className}`}>
      {/* Tab Headers */}
      <div className="tab-headers">
        <div className="tab-list">
          {tabs.map(tab => {
            const tabState = tabStates.get(tab.id);
            const isActive = tab.id === activeTabId;
            
            return (
              <div
                key={tab.id}
                className={`tab-header ${isActive ? 'active' : ''} ${tabState?.isLoading ? 'loading' : ''}`}
                onClick={() => switchToTab(tab.id)}
              >
                <div className="tab-content">
                  <div className="tab-icon">
                    {tabState?.isLoading ? (
                      <RotateCw size={14} className="spinning" />
                    ) : (
                      <Search size={14} />
                    )}
                  </div>
                  
                  <span className="tab-label" title={tab.query || tab.label}>
                    {tab.label}
                  </span>

                  {tabState && tabState.results.length > 0 && (
                    <span className="result-count">
                      ({tabState.results.length})
                    </span>
                  )}
                </div>

                {/* Tab Actions */}
                <div className="tab-actions">
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => closeTab(tab.id, e)}
                      className="close-tab-button"
                      title="Close tab"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* New Tab Button */}
        <button
          onClick={() => createNewTab()}
          className="new-tab-button"
          title="New search tab"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab && activeTabState && (
        <div className="tab-content-area">
          {/* Search Input for Active Tab */}
          <div className="tab-search-input">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                ref={(ref) => {
                  if (ref) {
                    tabInputRefs.current.set(activeTab.id, ref);
                  }
                }}
                type="text"
                value={activeTabState.query}
                onChange={(e) => updateTabQuery(activeTab.id, e.target.value)}
                onKeyPress={(e) => handleTabKeyPress(activeTab.id, e)}
                placeholder={ticketContext 
                  ? `Search for solutions related to "${ticketContext.issueType}"...`
                  : "Search knowledge base..."
                }
                className="tab-search-field"
              />
              {activeTabState.query && (
                <button
                  onClick={() => updateTabQuery(activeTab.id, '')}
                  className="clear-search-button"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="search-actions">
              <button
                onClick={() => performTabSearch(activeTab.id)}
                disabled={!activeTabState.query.trim() || activeTabState.isLoading}
                className="search-button"
              >
                {activeTabState.isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Tab Context Menu */}
          <div className="tab-context-actions">
            <button
              onClick={() => duplicateTab(activeTab.id)}
              className="context-action"
              title="Duplicate this tab"
            >
              <BookOpen size={14} />
              Duplicate Tab
            </button>
            
            {ticketContext && (
              <div className="context-indicator">
                <span className="context-label">
                  Contextual results for ticket #{ticketContext.ticketId}
                </span>
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="tab-search-results">
            {activeTabState.error && (
              <div className="search-error">
                <p>Error: {activeTabState.error}</p>
                <button 
                  onClick={() => performTabSearch(activeTab.id)}
                  className="retry-button"
                >
                  Retry Search
                </button>
              </div>
            )}

            {activeTabState.isLoading && (
              <div className="search-loading">
                <div className="loading-spinner" />
                <p>Searching...</p>
              </div>
            )}

            {activeTabState.results.length > 0 && !activeTabState.isLoading && (
              <div className="results-list">
                <div className="results-header">
                  <span className="results-count">
                    {activeTabState.results.length} result{activeTabState.results.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {activeTabState.results.map(result => (
                  <div
                    key={result.id}
                    className={`search-result-item ${result.credibilityLevel}`}
                    onClick={() => handleResultClick(result, activeTab.id)}
                  >
                    {/* Credibility Indicator */}
                    <div className={`credibility-indicator ${result.credibilityLevel}`}>
                      {result.credibilityLevel === 'high' && '🟢'}
                      {result.credibilityLevel === 'medium' && '🟡'}
                      {result.credibilityLevel === 'low' && '🔴'}
                    </div>

                    {/* Result Content */}
                    <div className="result-content">
                      <h4 className="result-title">{result.title}</h4>
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
                  </div>
                ))}
              </div>
            )}

            {activeTabState.results.length === 0 && !activeTabState.isLoading && activeTabState.query && (
              <div className="no-results">
                <Search size={48} className="no-results-icon" />
                <h3>No results found in this tab</h3>
                <p>Try different keywords or create a new tab for a different search</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Access Help */}
      <div className="tab-shortcuts-help">
        <div className="shortcuts">
          <kbd>Ctrl+T</kbd> New tab
          <kbd>Ctrl+W</kbd> Close tab  
          <kbd>Ctrl+Tab</kbd> Next tab
          <kbd>Enter</kbd> Search in active tab
        </div>
      </div>
    </div>
  );
};

export default SearchTabs;