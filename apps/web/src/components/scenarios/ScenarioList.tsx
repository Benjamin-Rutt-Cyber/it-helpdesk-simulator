import { useState, useMemo, useCallback } from 'react';
import { ScenarioCard, ScenarioCardData, ScenarioCardSkeleton } from './ScenarioCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface ScenarioListProps {
  scenarios: ScenarioCardData[];
  onScenarioSelect: (scenarioId: string) => void;
  onScenarioPreview: (scenarioId: string) => void;
  loading?: boolean;
  className?: string;
  showFilters?: boolean;
  showRecommendations?: boolean;
  recommendations?: ScenarioCardData[];
}

type FilterOption = 'all' | 'available' | 'in_progress' | 'completed' | 'locked';
type SortOption = 'title' | 'difficulty' | 'time' | 'xp' | 'status';
type DifficultyFilter = 'all' | 'starter' | 'intermediate' | 'advanced';

export function ScenarioList({
  scenarios,
  onScenarioSelect,
  onScenarioPreview,
  loading = false,
  className,
  showFilters = true,
  showRecommendations = true,
  recommendations = []
}: ScenarioListProps) {
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecommendationsFirst, setShowRecommendationsFirst] = useState(true);

  // Extract unique categories from scenarios
  const categories = useMemo(() => {
    const cats = scenarios.map(s => s.category).filter(Boolean);
    return ['all', ...Array.from(new Set(cats))];
  }, [scenarios]);

  // Filter and sort scenarios
  const filteredAndSortedScenarios = useMemo(() => {
    let filtered = scenarios.filter(scenario => {
      // Status filter
      if (statusFilter !== 'all' && scenario.status !== statusFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && scenario.difficulty !== difficultyFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && scenario.category !== categoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          scenario.title.toLowerCase().includes(query) ||
          scenario.description.toLowerCase().includes(query) ||
          scenario.category.toLowerCase().includes(query) ||
          scenario.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });

    // Sort scenarios
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'difficulty':
          const diffOrder = { starter: 1, intermediate: 2, advanced: 3 };
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        case 'time':
          return a.estimatedTime - b.estimatedTime;
        case 'xp':
          return b.xpReward - a.xpReward;
        case 'status':
          const statusOrder = { available: 1, in_progress: 2, completed: 3, locked: 4 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return filtered;
  }, [scenarios, statusFilter, difficultyFilter, categoryFilter, searchQuery, sortBy]);

  // Combine recommendations and scenarios
  const displayScenarios = useMemo(() => {
    if (!showRecommendations || !showRecommendationsFirst || recommendations.length === 0) {
      return filteredAndSortedScenarios;
    }

    // Filter out recommended scenarios from main list to avoid duplicates
    const recommendedIds = new Set(recommendations.map(r => r.id));
    const nonRecommended = filteredAndSortedScenarios.filter(s => !recommendedIds.has(s.id));

    return [...recommendations, ...nonRecommended];
  }, [filteredAndSortedScenarios, recommendations, showRecommendations, showRecommendationsFirst]);

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
    setDifficultyFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
    setSortBy('status');
  }, []);

  const getStatusFilterCount = useCallback((status: FilterOption) => {
    if (status === 'all') return scenarios.length;
    return scenarios.filter(s => s.status === status).length;
  }, [scenarios]);

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {showFilters && (
          <Card className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
                ))}
              </div>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <ScenarioCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters */}
      {showFilters && (
        <Card className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search scenarios"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filters */}
            <div className="flex gap-1">
              {(['all', 'available', 'in_progress', 'completed', 'locked'] as FilterOption[]).map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="text-xs"
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                  <span className="ml-1 opacity-70">
                    ({getStatusFilterCount(status)})
                  </span>
                </Button>
              ))}
            </div>

            {/* Difficulty Filters */}
            <div className="border-l pl-2 flex gap-1">
              {(['all', 'starter', 'intermediate', 'advanced'] as DifficultyFilter[]).map(difficulty => (
                <Button
                  key={difficulty}
                  variant={difficultyFilter === difficulty ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficultyFilter(difficulty)}
                  className="text-xs"
                >
                  {difficulty === 'all' ? 'All Levels' : difficulty}
                </Button>
              ))}
            </div>

            {/* Category Filter */}
            {categories.length > 1 && (
              <div className="border-l pl-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1 text-xs border rounded-md focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by category"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sort and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-gray-600">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="status">Status</option>
                <option value="title">Title</option>
                <option value="difficulty">Difficulty</option>
                <option value="time">Time</option>
                <option value="xp">XP Reward</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {showRecommendations && recommendations.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecommendationsFirst(!showRecommendationsFirst)}
                  className="text-xs"
                >
                  {showRecommendationsFirst ? '✨ Recommended' : 'Show Recommended'}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {displayScenarios.length} of {scenarios.length} scenarios
          {searchQuery && (
            <span className="ml-1">
              for "{searchQuery}"
            </span>
          )}
        </div>
        
        {showRecommendations && recommendations.length > 0 && showRecommendationsFirst && (
          <div className="text-sm text-blue-600 font-medium">
            ✨ {recommendations.length} recommended for you
          </div>
        )}
      </div>

      {/* Scenario Grid */}
      {displayScenarios.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium mb-2">No scenarios found</h3>
            <p className="text-sm">
              {searchQuery 
                ? `No scenarios match "${searchQuery}". Try different search terms or clear filters.`
                : 'No scenarios match your current filters. Try adjusting your filter criteria.'
              }
            </p>
            {(searchQuery || statusFilter !== 'all' || difficultyFilter !== 'all' || categoryFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="mt-4"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayScenarios.map((scenario, index) => (
            <div key={scenario.id} className="relative">
              {/* Recommendation Badge */}
              {showRecommendationsFirst && index < recommendations.length && (
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                    ✨ Recommended
                  </span>
                </div>
              )}
              
              <ScenarioCard
                scenario={scenario}
                onSelect={onScenarioSelect}
                onPreview={onScenarioPreview}
                className={cn({
                  'ring-2 ring-blue-200': showRecommendationsFirst && index < recommendations.length
                })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}