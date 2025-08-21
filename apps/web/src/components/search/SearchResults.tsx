import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: {
    domain: string;
    type: 'official' | 'documentation' | 'forum' | 'blog' | 'wiki' | 'vendor';
    name: string;
  };
  credibility: {
    score: number;
    level: 'high' | 'medium' | 'low' | 'unknown';
    indicators: string[];
    warnings?: string[];
  };
  metadata: {
    publishDate?: Date;
    lastModified?: Date;
    author?: string;
    category: string;
    tags: string[];
    language: string;
    wordCount: number;
  };
  relevanceScore: number;
  highlighted?: {
    title?: string;
    snippet?: string;
  };
}

interface SearchResultsProps {
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  onPageChange: (page: number) => void;
  onResultClick: (resultId: string, position: number) => void;
  loading?: boolean;
  query?: string;
  compact?: boolean;
  className?: string;
}

export function SearchResults({
  results,
  totalResults,
  searchTime,
  pagination,
  onPageChange,
  onResultClick,
  loading = false,
  query = '',
  compact = false,
  className
}: SearchResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleResultExpansion = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const getCredibilityColor = (level: string): string => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'unknown': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSourceTypeIcon = (type: string): string => {
    switch (type) {
      case 'official': return '🏛️';
      case 'documentation': return '📚';
      case 'forum': return '💬';
      case 'blog': return '📝';
      case 'wiki': return '📖';
      case 'vendor': return '🏢';
      default: return '📄';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const handleResultClick = (result: SearchResult, position: number) => {
    onResultClick(result.id, position);
    
    // In a real implementation, this would open the result
    // For demo purposes, we'll show an alert
    if (result.url.startsWith('http')) {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } else {
      alert(`Opening: ${result.title}\nURL: ${result.url}`);
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="p-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Results Found</h3>
        <p className="text-gray-500 mb-4">
          We couldn't find any results for "{query}". Try different keywords or check your spelling.
        </p>
        <div className="text-sm text-gray-500">
          <p className="mb-2">Search tips:</p>
          <ul className="text-left max-w-md mx-auto space-y-1">
            <li>• Use specific keywords related to your issue</li>
            <li>• Try alternative terms or synonyms</li>
            <li>• Remove filters to see more results</li>
            <li>• Check for typos in your search query</li>
          </ul>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          About {totalResults.toLocaleString()} results ({searchTime}ms)
        </div>
        
        {!compact && (
          <div className="flex items-center gap-4">
            <span>Sort by:</span>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="credibility">Credibility</option>
            </select>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={result.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              {/* Result Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getSourceTypeIcon(result.source.type)}</span>
                    <span className="text-sm text-gray-600">{result.source.domain}</span>
                    <span className={cn('px-2 py-1 rounded text-xs font-medium border', getCredibilityColor(result.credibility.level))}>
                      {result.credibility.level} credibility
                    </span>
                  </div>

                  <h3 
                    className="text-xl font-medium text-blue-600 hover:text-blue-800 cursor-pointer line-clamp-2"
                    onClick={() => handleResultClick(result, index)}
                    dangerouslySetInnerHTML={{ 
                      __html: result.highlighted?.title || result.title 
                    }}
                  />
                </div>

                {!compact && (
                  <div className="text-right text-sm text-gray-500">
                    <div>Score: {Math.round(result.relevanceScore)}</div>
                    {result.metadata.publishDate && (
                      <div>{formatTimeAgo(result.metadata.publishDate)}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Result Snippet */}
              <p 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: result.highlighted?.snippet || result.snippet 
                }}
              />

              {/* Result URL */}
              <div className="text-sm text-green-700">
                {result.url}
              </div>

              {/* Result Metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Category: {result.metadata.category}</span>
                  {result.metadata.author && (
                    <span>By: {result.metadata.author}</span>
                  )}
                  <span>{result.metadata.wordCount} words</span>
                </div>

                {!compact && (
                  <button
                    onClick={() => toggleResultExpansion(result.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {expandedResults.has(result.id) ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Expanded Content */}
              {!compact && expandedResults.has(result.id) && (
                <div className="border-t pt-4 space-y-3">
                  {/* Tags */}
                  {result.metadata.tags.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Tags: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.metadata.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Credibility Indicators */}
                  {result.credibility.indicators.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Quality Indicators: </span>
                      <ul className="mt-1 space-y-1">
                        {result.credibility.indicators.map((indicator, indicatorIndex) => (
                          <li key={indicatorIndex} className="text-sm text-green-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.credibility.warnings && result.credibility.warnings.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-red-700">Warnings: </span>
                      <ul className="mt-1 space-y-1">
                        {result.credibility.warnings.map((warning, warningIndex) => (
                          <li key={warningIndex} className="text-sm text-red-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Additional Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Source:</span>
                      <p className="text-gray-600">{result.source.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Language:</span>
                      <p className="text-gray-600">{result.metadata.language.toUpperCase()}</p>
                    </div>
                    {result.metadata.lastModified && (
                      <div>
                        <span className="font-medium text-gray-700">Updated:</span>
                        <p className="text-gray-600">{formatTimeAgo(result.metadata.lastModified)}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Credibility:</span>
                      <p className="text-gray-600">{result.credibility.score}/100</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevious}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
              let pageNumber;
              if (pagination.totalPages <= 7) {
                pageNumber = i + 1;
              } else if (pagination.currentPage <= 4) {
                pageNumber = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 3) {
                pageNumber = pagination.totalPages - 6 + i;
              } else {
                pageNumber = pagination.currentPage - 3 + i;
              }

              return (
                <Button
                  key={i}
                  variant={pageNumber === pagination.currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  className="w-10"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
          >
            Next
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500">
        Showing {((pagination.currentPage - 1) * 10) + 1} - {Math.min(pagination.currentPage * 10, totalResults)} of {totalResults} results
      </div>
    </div>
  );
}