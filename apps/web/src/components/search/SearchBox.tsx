import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  text: string;
  type: 'query' | 'correction' | 'completion';
  frequency: number;
  context?: string;
}

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  loading?: boolean;
  compact?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBox({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  suggestions = [],
  loading = false,
  compact = false,
  className,
  autoFocus = false
}: SearchBoxProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [fetchedSuggestions, setFetchedSuggestions] = useState<SearchSuggestion[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setFetchedSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=8`);
      if (response.ok) {
        const result = await response.json();
        setFetchedSuggestions(result.data || []);
      }
    } catch (error) {
      console.warn('Failed to fetch suggestions:', error);
      setFetchedSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (value) {
      const timer = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
      setDebounceTimer(timer);
    } else {
      setFetchedSuggestions([]);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [value, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setActiveSuggestionIndex(-1);
    
    if (newValue.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allSuggestions = [...(suggestions || []), ...fetchedSuggestions.map(s => s.text)];
    
    if (!showSuggestions || allSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          const selectedSuggestion = allSuggestions[activeSuggestionIndex];
          onChange(selectedSuggestion);
          onSearch(selectedSuggestion);
        } else {
          handleSearch();
        }
        setShowSuggestions(false);
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSearch = () => {
    if (value.trim()) {
      onSearch(value.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (value.length > 0 && (suggestions?.length || fetchedSuggestions.length)) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const clearInput = () => {
    onChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const allSuggestions = [...(suggestions || []), ...fetchedSuggestions.map(s => s.text)]
    .filter((suggestion, index, arr) => arr.indexOf(suggestion) === index) // Remove duplicates
    .slice(0, 8);

  return (
    <div className={cn('relative w-full', className)}>
      <div className={cn(
        'relative flex items-center',
        compact ? 'max-w-md' : 'max-w-2xl mx-auto'
      )}>
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={cn(
              'w-full border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
              compact ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-lg',
              value ? 'pr-10' : 'pr-4'
            )}
            disabled={loading}
          />

          {/* Clear Button */}
          {value && (
            <button
              onClick={clearInput}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={!value.trim() || loading}
          className={cn(
            'rounded-l-none border-l-0',
            compact ? 'px-4 py-2' : 'px-6 py-3'
          )}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && allSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={cn(
            'absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-64 overflow-y-auto',
            compact ? 'mt-1' : 'mt-2'
          )}
        >
          {allSuggestions.map((suggestion, index) => {
            const suggestionData = fetchedSuggestions.find(s => s.text === suggestion);
            
            return (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between',
                  activeSuggestionIndex === index && 'bg-blue-50 text-blue-700',
                  compact ? 'py-2 text-sm' : 'py-3'
                )}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>{suggestion}</span>
                </div>
                
                {suggestionData && suggestionData.type === 'correction' && (
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                    Did you mean?
                  </span>
                )}
                
                {suggestionData && suggestionData.frequency > 50 && (
                  <span className="text-xs text-green-600">
                    Popular
                  </span>
                )}
              </button>
            );
          })}

          {/* Search Tips */}
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>↑↓ to navigate • Enter to select • Esc to close</span>
              <span>{allSuggestions.length} suggestions</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Tips for Empty State */}
      {!compact && !value && (
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Try searching for common IT issues like "email not working" or "password reset"</p>
          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={() => handleSuggestionClick('email configuration')}
              className="text-blue-600 hover:underline"
            >
              email configuration
            </button>
            <button
              onClick={() => handleSuggestionClick('network troubleshooting')}
              className="text-blue-600 hover:underline"
            >
              network troubleshooting
            </button>
            <button
              onClick={() => handleSuggestionClick('printer setup')}
              className="text-blue-600 hover:underline"
            >
              printer setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}