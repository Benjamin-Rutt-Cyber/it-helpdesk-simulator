import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Command, ArrowUp, ArrowDown, Enter, Mic, Clock, Zap } from 'lucide-react';
import { useSearchIntegration } from '../../hooks/useSearchIntegration';
import { SearchResult, TicketContext, QuickAccessShortcut } from '../../types/search';

interface QuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect?: (result: SearchResult) => void;
  ticketContext?: TicketContext;
  className?: string;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  isOpen,
  onClose,
  onResultSelect,
  ticketContext,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [commandMode, setCommandMode] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const {
    searchResults,
    isLoading,
    performSearch,
    getSearchHistory,
    trackSearchEvent
  } = useSearchIntegration({
    ticketContext,
    persistSession: true
  });

  // Keyboard shortcuts configuration
  const shortcuts: QuickAccessShortcut[] = [
    { key: 'k', modifiers: ['ctrl'], action: 'open_search', description: 'Open quick search' },
    { key: 'k', modifiers: ['meta'], action: 'open_search', description: 'Open quick search' },
    { key: '/', modifiers: [], action: 'focus_search', description: 'Focus search input' },
    { key: 'Escape', modifiers: [], action: 'clear_search', description: 'Close search or clear input' },
    { key: 'ArrowDown', modifiers: [], action: 'next_result', description: 'Navigate to next result' },
    { key: 'ArrowUp', modifiers: [], action: 'prev_result', description: 'Navigate to previous result' },
    { key: 'Enter', modifiers: [], action: 'open_search', description: 'Select result or search' }
  ];

  // Initialize component state
  useEffect(() => {
    if (isOpen) {
      // Focus input when opened
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // Load recent searches
      const history = getSearchHistory();
      setRecentSearches(history.slice(0, 5));
      
      // Generate contextual suggestions
      if (ticketContext && !query) {
        const contextSuggestions = generateContextualSuggestions(ticketContext);
        setSuggestions(contextSuggestions);
      }
    } else {
      // Reset state when closed
      setQuery('');
      setSelectedIndex(0);
      setSuggestions([]);
      setCommandMode(false);
    }
  }, [isOpen, ticketContext, getSearchHistory]);

  // Handle query changes and generate suggestions
  useEffect(() => {
    if (query.length > 2 && !commandMode) {
      generateSearchSuggestions(query);
    } else if (query.startsWith('>')) {
      setCommandMode(true);
      generateCommandSuggestions(query.slice(1));
    } else {
      setSuggestions([]);
      setCommandMode(false);
    }
  }, [query]);

  // Auto-search with debouncing
  useEffect(() => {
    if (query.length > 2 && !commandMode) {
      const debounceTimer = setTimeout(() => {
        performSearch(query, {});
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [query, commandMode, performSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const totalItems = commandMode 
      ? suggestions.length 
      : suggestions.length + searchResults.length + recentSearches.length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;

      case 'Enter':
        event.preventDefault();
        handleItemSelect(selectedIndex);
        break;

      case 'Escape':
        if (query) {
          setQuery('');
          setSelectedIndex(0);
        } else {
          onClose();
        }
        break;

      case 'Tab':
        if (suggestions.length > 0) {
          event.preventDefault();
          const selectedSuggestion = suggestions[Math.min(selectedIndex, suggestions.length - 1)];
          setQuery(selectedSuggestion);
          setSelectedIndex(0);
        }
        break;
    }
  }, [selectedIndex, suggestions, searchResults, recentSearches, query, onClose]);

  // Voice search support
  const startVoiceSearch = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        trackSearchEvent('voice_search_started', { ticketId: ticketContext?.ticketId });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        
        trackSearchEvent('voice_search_completed', { 
          query: transcript,
          confidence: event.results[0][0].confidence,
          ticketId: ticketContext?.ticketId 
        });
      };

      recognition.onerror = () => {
        setIsListening(false);
        trackSearchEvent('voice_search_error', { ticketId: ticketContext?.ticketId });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  }, [trackSearchEvent, ticketContext]);

  const generateContextualSuggestions = (context: TicketContext): string[] => {
    const suggestions = [];
    
    if (context.issueType) {
      suggestions.push(context.issueType);
      suggestions.push(`${context.issueType} troubleshooting`);
      suggestions.push(`how to fix ${context.issueType}`);
    }

    if (context.errorCode) {
      suggestions.push(context.errorCode);
      suggestions.push(`error ${context.errorCode} solution`);
    }

    if (context.customerEnvironment) {
      suggestions.push(`${context.issueType} ${context.customerEnvironment}`);
    }

    return suggestions.slice(0, 5);
  };

  const generateSearchSuggestions = async (query: string) => {
    // Simulate API call for search suggestions
    const mockSuggestions = [
      `${query} troubleshooting`,
      `${query} error fix`,
      `${query} configuration`,
      `${query} installation guide`,
      `${query} best practices`
    ];
    
    setSuggestions(mockSuggestions);
  };

  const generateCommandSuggestions = (commandQuery: string) => {
    const commands = [
      'clear cache',
      'search history',
      'open settings',
      'refresh results',
      'export results',
      'toggle filters'
    ];

    const filtered = commands.filter(cmd => 
      cmd.toLowerCase().includes(commandQuery.toLowerCase())
    );

    setSuggestions(filtered);
  };

  const handleItemSelect = useCallback((index: number) => {
    if (commandMode) {
      // Handle command execution
      if (index < suggestions.length) {
        const command = suggestions[index];
        executeCommand(command);
      }
    } else {
      // Handle search item selection
      let currentIndex = index;
      
      // Check if it's a suggestion
      if (currentIndex < suggestions.length) {
        const suggestion = suggestions[currentIndex];
        setQuery(suggestion);
        performSearch(suggestion, {});
        return;
      }
      currentIndex -= suggestions.length;
      
      // Check if it's a search result
      if (currentIndex < searchResults.length) {
        const result = searchResults[currentIndex];
        handleResultSelect(result);
        return;
      }
      currentIndex -= searchResults.length;
      
      // Check if it's a recent search
      if (currentIndex < recentSearches.length) {
        const recentSearch = recentSearches[currentIndex];
        setQuery(recentSearch);
        performSearch(recentSearch, {});
        return;
      }
    }
  }, [commandMode, suggestions, searchResults, recentSearches, performSearch]);

  const handleResultSelect = useCallback((result: SearchResult) => {
    trackSearchEvent('quick_search_result_selected', {
      resultId: result.id,
      query,
      credibilityLevel: result.credibilityLevel
    });

    if (onResultSelect) {
      onResultSelect(result);
    }

    onClose();
  }, [query, onResultSelect, onClose, trackSearchEvent]);

  const executeCommand = useCallback((command: string) => {
    trackSearchEvent('command_executed', { command });

    switch (command) {
      case 'clear cache':
        // Clear search cache
        console.log('Clearing search cache...');
        break;
      case 'search history':
        // Show search history
        console.log('Showing search history...');
        break;
      case 'refresh results':
        if (query) {
          performSearch(query, {});
        }
        break;
      default:
        console.log(`Executing command: ${command}`);
    }

    onClose();
  }, [query, performSearch, onClose, trackSearchEvent]);

  const getItemAtIndex = useCallback((index: number) => {
    let currentIndex = index;
    
    if (commandMode) {
      return suggestions[index] || null;
    }

    // Suggestions
    if (currentIndex < suggestions.length) {
      return { type: 'suggestion', item: suggestions[currentIndex] };
    }
    currentIndex -= suggestions.length;
    
    // Results
    if (currentIndex < searchResults.length) {
      return { type: 'result', item: searchResults[currentIndex] };
    }
    currentIndex -= searchResults.length;
    
    // Recent searches
    if (currentIndex < recentSearches.length) {
      return { type: 'recent', item: recentSearches[currentIndex] };
    }
    
    return null;
  }, [commandMode, suggestions, searchResults, recentSearches]);

  if (!isOpen) return null;

  return (
    <div className={`quick-search-overlay ${className}`}>
      <div className="quick-search-modal">
        {/* Search Header */}
        <div className="search-header">
          <div className="search-input-container">
            <div className="search-icon-wrapper">
              {commandMode ? (
                <Command className="search-icon command-icon" size={20} />
              ) : (
                <Search className="search-icon" size={20} />
              )}
            </div>
            
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={commandMode 
                ? "Type a command..." 
                : ticketContext 
                  ? `Search for solutions related to "${ticketContext.issueType}"...`
                  : "Search or type '>' for commands..."
              }
              className="quick-search-input"
              autoComplete="off"
            />

            {/* Voice Search Button */}
            {!commandMode && (
              <button
                onClick={startVoiceSearch}
                disabled={isListening}
                className={`voice-search-button ${isListening ? 'listening' : ''}`}
                title="Voice search"
              >
                <Mic size={16} />
              </button>
            )}
          </div>

          {/* Context Indicator */}
          {ticketContext && !commandMode && (
            <div className="context-indicator">
              <span className="context-text">
                Contextual search for ticket #{ticketContext.ticketId}
              </span>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="search-results-container">
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>Searching...</span>
            </div>
          )}

          {!isLoading && (
            <div className="results-list">
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="result-section">
                  <div className="section-header">
                    <Zap size={14} />
                    <span>{commandMode ? 'Commands' : 'Suggestions'}</span>
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`suggestion-${index}`}
                      ref={el => suggestionRefs.current[index] = el}
                      className={`result-item suggestion ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleItemSelect(index)}
                    >
                      <div className="item-icon">
                        {commandMode ? <Command size={16} /> : <Search size={16} />}
                      </div>
                      <span className="item-text">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {!commandMode && searchResults.length > 0 && (
                <div className="result-section">
                  <div className="section-header">
                    <Search size={14} />
                    <span>Results ({searchResults.length})</span>
                  </div>
                  {searchResults.slice(0, 5).map((result, index) => {
                    const globalIndex = suggestions.length + index;
                    return (
                      <div
                        key={`result-${result.id}`}
                        className={`result-item search-result ${globalIndex === selectedIndex ? 'selected' : ''}`}
                        onClick={() => handleResultSelect(result)}
                      >
                        <div className={`credibility-indicator ${result.credibilityLevel}`}>
                          {result.credibilityLevel === 'high' && '🟢'}
                          {result.credibilityLevel === 'medium' && '🟡'}
                          {result.credibilityLevel === 'low' && '🔴'}
                        </div>
                        <div className="result-content">
                          <div className="result-title">{result.title}</div>
                          <div className="result-meta">
                            <span className="result-source">{result.source}</span>
                            <span className="result-type">{result.sourceType}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recent Searches */}
              {!commandMode && recentSearches.length > 0 && !query && (
                <div className="result-section">
                  <div className="section-header">
                    <Clock size={14} />
                    <span>Recent Searches</span>
                  </div>
                  {recentSearches.map((search, index) => {
                    const globalIndex = suggestions.length + searchResults.length + index;
                    return (
                      <div
                        key={`recent-${index}`}
                        className={`result-item recent-search ${globalIndex === selectedIndex ? 'selected' : ''}`}
                        onClick={() => {
                          setQuery(search);
                          performSearch(search, {});
                        }}
                      >
                        <div className="item-icon">
                          <Clock size={16} />
                        </div>
                        <span className="item-text">{search}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No Results */}
              {!isLoading && !commandMode && query && suggestions.length === 0 && searchResults.length === 0 && (
                <div className="no-results">
                  <Search size={48} className="no-results-icon" />
                  <h3>No results found</h3>
                  <p>Try different keywords or check your spelling</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="search-footer">
          <div className="shortcuts">
            <div className="shortcut">
              <ArrowUp size={12} />
              <ArrowDown size={12} />
              <span>Navigate</span>
            </div>
            <div className="shortcut">
              <div className="key-indicator">↵</div>
              <span>Select</span>
            </div>
            <div className="shortcut">
              <div className="key-indicator">Esc</div>
              <span>Close</span>
            </div>
            <div className="shortcut">
              <div className="key-indicator">Tab</div>
              <span>Autocomplete</span>
            </div>
          </div>

          {!commandMode && (
            <div className="tips">
              <span>💡 Type '>' for commands, use voice search, or try contextual suggestions</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickSearch;