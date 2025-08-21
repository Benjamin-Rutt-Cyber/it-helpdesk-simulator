import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface AvailableFilters {
  sourceTypes: FilterOption[];
  categories: FilterOption[];
  credibilityLevels: FilterOption[];
  dateRanges: FilterOption[];
}

interface SearchFiltersProps {
  activeFilters: any;
  onFilterChange: (filters: any) => void;
  availableFilters?: AvailableFilters;
  className?: string;
}

export function SearchFilters({
  activeFilters,
  onFilterChange,
  availableFilters,
  className
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState(activeFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sourceTypes']));

  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleFilterChange = (filterType: string, value: any, isMultiple: boolean = false) => {
    const newFilters = { ...localFilters };

    if (isMultiple) {
      if (!newFilters[filterType]) {
        newFilters[filterType] = [];
      }

      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter((v: any) => v !== value);
      } else {
        newFilters[filterType] = [...newFilters[filterType], value];
      }

      if (newFilters[filterType].length === 0) {
        delete newFilters[filterType];
      }
    } else {
      if (newFilters[filterType] === value) {
        delete newFilters[filterType];
      } else {
        newFilters[filterType] = value;
      }
    }

    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  const clearFilter = (filterType: string) => {
    const newFilters = { ...localFilters };
    delete newFilters[filterType];
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const getFilterCount = (): number => {
    return Object.keys(localFilters).length;
  };

  // Default filters if not provided
  const filters: AvailableFilters = availableFilters || {
    sourceTypes: [
      { value: 'official', label: 'Official Documentation', count: 245 },
      { value: 'documentation', label: 'Documentation', count: 189 },
      { value: 'forum', label: 'Community Forums', count: 156 },
      { value: 'blog', label: 'Technical Blogs', count: 123 },
      { value: 'wiki', label: 'Wiki Articles', count: 98 },
      { value: 'vendor', label: 'Vendor Resources', count: 67 },
    ],
    categories: [
      { value: 'Network & Connectivity', label: 'Network & Connectivity', count: 234 },
      { value: 'Email & Communication', label: 'Email & Communication', count: 198 },
      { value: 'Hardware & Devices', label: 'Hardware & Devices', count: 167 },
      { value: 'Software & Applications', label: 'Software & Applications', count: 289 },
      { value: 'Security & Access', label: 'Security & Access', count: 145 },
      { value: 'Database & Storage', label: 'Database & Storage', count: 89 },
    ],
    credibilityLevels: [
      { value: '90', label: 'Highly Credible (90+)', count: 234 },
      { value: '70', label: 'Credible (70+)', count: 456 },
      { value: '50', label: 'Moderately Credible (50+)', count: 789 },
    ],
    dateRanges: [
      { value: '1d', label: 'Last 24 hours', count: 45 },
      { value: '1w', label: 'Last week', count: 189 },
      { value: '1m', label: 'Last month', count: 456 },
      { value: '1y', label: 'Last year', count: 987 },
    ],
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 21v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Search Filters
            {getFilterCount() > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {getFilterCount()}
              </span>
            )}
          </h3>

          {getFilterCount() > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Filters */}
        {getFilterCount() > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(localFilters).map(([filterType, value]) => (
                <div key={filterType} className="flex flex-wrap gap-1">
                  {Array.isArray(value) ? (
                    value.map((v: string) => (
                      <span
                        key={v}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        {v}
                        <button
                          onClick={() => handleFilterChange(filterType, v, true)}
                          className="hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {value}
                      <button
                        onClick={() => clearFilter(filterType)}
                        className="hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Type Filter */}
        <div>
          <button
            onClick={() => toggleSection('sourceTypes')}
            className="w-full flex items-center justify-between text-left font-medium text-gray-700 hover:text-gray-900"
          >
            <span>Source Type</span>
            <svg
              className={cn('w-4 h-4 transition-transform', expandedSections.has('sourceTypes') ? 'rotate-180' : '')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has('sourceTypes') && (
            <div className="mt-2 space-y-2">
              {filters.sourceTypes.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={localFilters.sourceType?.includes(option.value) || false}
                    onChange={() => handleFilterChange('sourceType', option.value, true)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">{option.label}</span>
                  <span className="text-gray-500">({option.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div>
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between text-left font-medium text-gray-700 hover:text-gray-900"
          >
            <span>Category</span>
            <svg
              className={cn('w-4 h-4 transition-transform', expandedSections.has('categories') ? 'rotate-180' : '')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has('categories') && (
            <div className="mt-2 space-y-2">
              {filters.categories.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={localFilters.resultType?.includes(option.value) || false}
                    onChange={() => handleFilterChange('resultType', option.value, true)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">{option.label}</span>
                  <span className="text-gray-500">({option.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Credibility Filter */}
        <div>
          <button
            onClick={() => toggleSection('credibility')}
            className="w-full flex items-center justify-between text-left font-medium text-gray-700 hover:text-gray-900"
          >
            <span>Credibility Level</span>
            <svg
              className={cn('w-4 h-4 transition-transform', expandedSections.has('credibility') ? 'rotate-180' : '')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has('credibility') && (
            <div className="mt-2 space-y-2">
              {filters.credibilityLevels.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="credibilityLevel"
                    checked={localFilters.credibilityLevel?.toString() === option.value}
                    onChange={() => handleFilterChange('credibilityLevel', parseInt(option.value))}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">{option.label}</span>
                  <span className="text-gray-500">({option.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div>
          <button
            onClick={() => toggleSection('dateRange')}
            className="w-full flex items-center justify-between text-left font-medium text-gray-700 hover:text-gray-900"
          >
            <span>Publication Date</span>
            <svg
              className={cn('w-4 h-4 transition-transform', expandedSections.has('dateRange') ? 'rotate-180' : '')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has('dateRange') && (
            <div className="mt-2 space-y-3">
              {filters.dateRanges.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="dateRange"
                    checked={localFilters.dateRange === option.value}
                    onChange={() => {
                      const now = new Date();
                      let startDate: Date;
                      
                      switch (option.value) {
                        case '1d':
                          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                          break;
                        case '1w':
                          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                          break;
                        case '1m':
                          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                          break;
                        case '1y':
                          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                          break;
                        default:
                          return;
                      }
                      
                      handleFilterChange('dateRange', {
                        start: startDate.toISOString(),
                        end: now.toISOString()
                      });
                    }}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">{option.label}</span>
                  <span className="text-gray-500">({option.count})</span>
                </label>
              ))}

              {/* Custom Date Range */}
              <div className="pt-2 border-t">
                <span className="text-sm font-medium text-gray-700">Custom Range</span>
                <div className="mt-2 space-y-2">
                  <input
                    type="date"
                    placeholder="Start date"
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    onChange={(e) => {
                      if (e.target.value) {
                        const currentRange = localFilters.dateRange || {};
                        handleFilterChange('dateRange', {
                          ...currentRange,
                          start: new Date(e.target.value).toISOString()
                        });
                      }
                    }}
                  />
                  <input
                    type="date"
                    placeholder="End date"
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    onChange={(e) => {
                      if (e.target.value) {
                        const currentRange = localFilters.dateRange || {};
                        handleFilterChange('dateRange', {
                          ...currentRange,
                          end: new Date(e.target.value).toISOString()
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Summary */}
        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500 text-center">
            {getFilterCount() === 0 
              ? 'No filters applied'
              : `${getFilterCount()} filter${getFilterCount() !== 1 ? 's' : ''} applied`
            }
          </div>
        </div>
      </div>
    </Card>
  );
}