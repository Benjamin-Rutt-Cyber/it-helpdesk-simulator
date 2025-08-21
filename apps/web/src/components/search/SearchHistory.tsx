import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  clickThroughRate: number;
  filters?: any;
  sessionId?: string;
}

interface SearchHistoryProps {
  userId: string;
  onHistoryItemClick: (query: string) => void;
  className?: string;
  compact?: boolean;
  limit?: number;
}

export function SearchHistory({
  userId,
  onHistoryItemClick,
  className,
  compact = false,
  limit = 10
}: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchSearchHistory();
  }, [userId]);

  const fetchSearchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/search/history?userId=${userId}&limit=${showAll ? 50 : limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search history');
      }

      const result = await response.json();
      setHistory(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search history');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const response = await fetch(`/api/v1/search/history`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setHistory([]);
      }
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  };

  const deleteHistoryItem = async (historyId: string) => {
    try {
      const response = await fetch(`/api/v1/search/history/${historyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== historyId));
      }
    } catch (error) {
      console.warn('Failed to delete history item:', error);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getResultsColor = (count: number): string => {
    if (count === 0) return 'text-red-600';
    if (count < 5) return 'text-orange-600';
    if (count < 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCTRColor = (ctr: number): string => {
    if (ctr < 0.1) return 'text-red-600 bg-red-50';
    if (ctr < 0.3) return 'text-orange-600 bg-orange-50';
    if (ctr < 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-4 border-red-200 bg-red-50', className)}>
        <div className="flex items-center gap-2 text-red-800 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-sm">Failed to load history</span>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSearchHistory}
          className="mt-2"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Search History
            {history.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {history.length}
              </span>
            )}
          </h3>

          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-700 mb-1">No Search History</h4>
            <p className="text-gray-500 text-sm">
              Your recent searches will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, showAll ? history.length : limit).map((item) => (
              <div
                key={item.id}
                className="group p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onHistoryItemClick(item.query)}
                      className="text-left w-full group-hover:text-blue-600 transition-colors"
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {item.query}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{formatTimeAgo(item.timestamp)}</span>
                        <span className={getResultsColor(item.resultCount)}>
                          {item.resultCount} results
                        </span>
                        {!compact && (
                          <span className={cn('px-2 py-1 rounded text-xs', getCTRColor(item.clickThroughRate))}>
                            {Math.round(item.clickThroughRate * 100)}% CTR
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Applied Filters */}
                    {item.filters && Object.keys(item.filters).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(item.filters).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {key}: {Array.isArray(value) ? value.join(', ') : value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all ml-2"
                    title="Remove from history"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Show More/Less Button */}
            {history.length > limit && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs"
                >
                  {showAll ? 'Show Less' : `Show All (${history.length})`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {history.length > 0 && !compact && (
          <div className="pt-4 border-t mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const popularQuery = history.reduce((prev, current) => 
                    (current.resultCount > prev.resultCount) ? current : prev
                  );
                  onHistoryItemClick(popularQuery.query);
                }}
                className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                🔄 Repeat most successful search
              </button>
              
              <button
                onClick={() => {
                  const recentQuery = history[0];
                  if (recentQuery) onHistoryItemClick(recentQuery.query);
                }}
                className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                ⏱️ Repeat last search
              </button>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {history.length > 0 && !compact && (
          <div className="pt-4 border-t mt-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {history.length}
                </div>
                <div className="text-xs text-gray-500">Total Searches</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round((history.reduce((sum, item) => sum + item.clickThroughRate, 0) / history.length) * 100)}%
                </div>
                <div className="text-xs text-gray-500">Avg CTR</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}