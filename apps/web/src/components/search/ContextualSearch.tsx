import React, { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useSearchIntegration } from '../../hooks/useSearchIntegration';
import { SearchResult, TicketContext, ContextualSearchOptions } from '../../types/search';

interface ContextualSearchProps {
  ticketContext: TicketContext;
  onResultSelect?: (result: SearchResult) => void;
  options?: ContextualSearchOptions;
  className?: string;
}

interface ContextualSearchState {
  isAnalyzing: boolean;
  contextualResults: SearchResult[];
  prioritizedResults: SearchResult[];
  contextScore: number;
  searchSuggestions: string[];
}

export const ContextualSearch: React.FC<ContextualSearchProps> = ({
  ticketContext,
  onResultSelect,
  options = {},
  className = ''
}) => {
  const [state, setState] = useState<ContextualSearchState>({
    isAnalyzing: true,
    contextualResults: [],
    prioritizedResults: [],
    contextScore: 0,
    searchSuggestions: []
  });

  const {
    performContextualSearch,
    extractTicketContext,
    prioritizeResults,
    generateSearchSuggestions,
    trackSearchEvent
  } = useSearchIntegration({
    ticketContext,
    enableContextAnalysis: true
  });

  // Context-aware search configuration
  const searchConfig = useMemo(() => ({
    maxResults: options.maxResults || 10,
    includeRelatedTopics: options.includeRelatedTopics !== false,
    prioritizeRecent: options.prioritizeRecent !== false,
    minRelevanceThreshold: options.minRelevanceThreshold || 0.3,
    enableSemanticSearch: options.enableSemanticSearch !== false
  }), [options]);

  // Extract and analyze ticket context on mount
  useEffect(() => {
    const analyzeTicketContext = async () => {
      try {
        setState(prev => ({ ...prev, isAnalyzing: true }));

        // Extract key information from ticket context
        const contextExtraction = await extractTicketContext(ticketContext);
        
        // Generate contextual search suggestions
        const suggestions = generateSearchSuggestions(ticketContext);
        
        // Perform initial contextual searches
        const contextualSearchPromises = suggestions.slice(0, 3).map(query =>
          performContextualSearch(query, ticketContext, searchConfig)
        );

        const searchResults = await Promise.all(contextualSearchPromises);
        const allResults = searchResults.flat();

        // Prioritize results based on ticket context
        const prioritized = await prioritizeResults(allResults, ticketContext);

        // Calculate overall context matching score
        const contextScore = calculateContextScore(prioritized, ticketContext);

        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          contextualResults: allResults,
          prioritizedResults: prioritized.slice(0, searchConfig.maxResults),
          contextScore,
          searchSuggestions: suggestions
        }));

        // Track contextual search event
        trackSearchEvent('contextual_search_performed', {
          ticketId: ticketContext.ticketId,
          extractedKeywords: contextExtraction.keywords,
          resultCount: prioritized.length,
          contextScore
        });

      } catch (error) {
        console.error('Error analyzing ticket context:', error);
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          contextualResults: [],
          prioritizedResults: [],
          contextScore: 0
        }));
      }
    };

    if (ticketContext) {
      analyzeTicketContext();
    }
  }, [ticketContext, performContextualSearch, extractTicketContext, prioritizeResults, generateSearchSuggestions, trackSearchEvent, searchConfig]);

  const calculateContextScore = (results: SearchResult[], context: TicketContext): number => {
    if (!results.length) return 0;

    const relevanceScores = results.map(result => result.relevanceToTicket || 0);
    const averageRelevance = relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length;
    
    // Factor in result quality and variety
    const qualityBonus = results.filter(r => r.credibilityLevel === 'high').length / results.length * 0.2;
    const varietyBonus = new Set(results.map(r => r.sourceType)).size / 4 * 0.1; // Normalize to 4 possible types
    
    return Math.min(100, Math.round((averageRelevance * 100) + (qualityBonus * 100) + (varietyBonus * 100)));
  };

  const handleResultClick = (result: SearchResult) => {
    trackSearchEvent('contextual_result_clicked', {
      resultId: result.id,
      relevanceScore: result.relevanceToTicket,
      credibilityLevel: result.credibilityLevel,
      contextScore: state.contextScore
    });

    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const getContextIndicator = (score: number) => {
    if (score >= 80) return { icon: CheckCircle, color: 'success', text: 'Excellent match' };
    if (score >= 60) return { icon: TrendingUp, color: 'good', text: 'Good match' };
    if (score >= 40) return { icon: Info, color: 'moderate', text: 'Moderate match' };
    return { icon: AlertCircle, color: 'low', text: 'Limited matches' };
  };

  const contextIndicator = getContextIndicator(state.contextScore);
  const ContextIcon = contextIndicator.icon;

  return (
    <div className={`contextual-search ${className}`}>
      {/* Context Analysis Header */}
      <div className="contextual-search-header">
        <div className="context-info">
          <Target className="context-icon" size={20} />
          <div className="context-details">
            <h3 className="context-title">Contextual Results</h3>
            <p className="context-description">
              Results prioritized for ticket #{ticketContext.ticketId} - {ticketContext.issueType}
            </p>
          </div>
        </div>

        <div className={`context-score ${contextIndicator.color}`}>
          <ContextIcon size={16} />
          <span className="score-value">{state.contextScore}%</span>
          <span className="score-label">{contextIndicator.text}</span>
        </div>
      </div>

      {/* Ticket Context Summary */}
      <div className="ticket-context-summary">
        <div className="context-item">
          <strong>Issue:</strong> {ticketContext.issueType}
        </div>
        {ticketContext.customerEnvironment && (
          <div className="context-item">
            <strong>Environment:</strong> {ticketContext.customerEnvironment}
          </div>
        )}
        {ticketContext.priority && (
          <div className="context-item">
            <strong>Priority:</strong> {ticketContext.priority}
          </div>
        )}
        {ticketContext.tags && ticketContext.tags.length > 0 && (
          <div className="context-item">
            <strong>Tags:</strong> {ticketContext.tags.join(', ')}
          </div>
        )}
      </div>

      {/* Loading State */}
      {state.isAnalyzing && (
        <div className="contextual-loading">
          <div className="loading-spinner" />
          <div className="loading-text">
            <p>Analyzing ticket context...</p>
            <p className="loading-subtext">Finding the most relevant solutions</p>
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {!state.isAnalyzing && state.searchSuggestions.length > 0 && (
        <div className="context-suggestions">
          <h4 className="suggestions-title">Suggested Searches</h4>
          <div className="suggestions-list">
            {state.searchSuggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  trackSearchEvent('suggestion_clicked', { suggestion, position: index });
                  // This would trigger a new search with the suggestion
                }}
                className="suggestion-item"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contextual Results */}
      {!state.isAnalyzing && state.prioritizedResults.length > 0 && (
        <div className="contextual-results">
          <div className="results-header">
            <h4 className="results-title">
              Most Relevant Results ({state.prioritizedResults.length})
            </h4>
            <div className="results-info">
              Results are ranked by relevance to your specific issue
            </div>
          </div>

          <div className="results-list">
            {state.prioritizedResults.map((result, index) => (
              <div
                key={result.id}
                className={`contextual-result-item ${result.credibilityLevel}`}
                onClick={() => handleResultClick(result)}
              >
                {/* Relevance Score */}
                <div className="relevance-indicator">
                  <div 
                    className="relevance-bar"
                    style={{ width: `${(result.relevanceToTicket || 0) * 100}%` }}
                  />
                  <span className="relevance-score">
                    {Math.round((result.relevanceToTicket || 0) * 100)}%
                  </span>
                </div>

                {/* Result Content */}
                <div className="result-content">
                  <div className="result-header">
                    <h5 className="result-title">{result.title}</h5>
                    <div className={`credibility-badge ${result.credibilityLevel}`}>
                      {result.credibilityLevel}
                    </div>
                  </div>

                  <p className="result-snippet">{result.snippet}</p>

                  {/* Context Highlights */}
                  {result.contextMatches && result.contextMatches.length > 0 && (
                    <div className="context-matches">
                      <span className="matches-label">Matches:</span>
                      {result.contextMatches.map((match, idx) => (
                        <span key={idx} className="context-match">
                          {match}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Result Metadata */}
                  <div className="result-metadata">
                    <span className="result-source">{result.source}</span>
                    <span className="result-type">{result.sourceType}</span>
                    <span className="result-date">{result.date}</span>
                  </div>
                </div>

                {/* Priority Indicator */}
                <div className="priority-indicator">
                  <div className={`priority-badge priority-${index + 1}`}>
                    #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {!state.isAnalyzing && state.prioritizedResults.length === 0 && (
        <div className="no-contextual-results">
          <AlertCircle size={48} className="no-results-icon" />
          <h4>No contextual results found</h4>
          <p>
            We couldn't find specific results for your ticket context. 
            Try using the general search or different keywords.
          </p>
          
          <div className="no-results-actions">
            <button
              onClick={() => {
                // This would open the general search panel
                trackSearchEvent('fallback_search_requested', {
                  ticketId: ticketContext.ticketId
                });
              }}
              className="fallback-search-button"
            >
              Try General Search
            </button>
          </div>
        </div>
      )}

      {/* Context Tips */}
      <div className="context-tips">
        <h5 className="tips-title">💡 Context Search Tips</h5>
        <ul className="tips-list">
          <li>Results are automatically prioritized based on your ticket details</li>
          <li>Higher relevance scores indicate better matches for your specific issue</li>
          <li>Green badges indicate highly credible official sources</li>
          <li>Use suggested searches for related topics and solutions</li>
        </ul>
      </div>
    </div>
  );
};

export default ContextualSearch;