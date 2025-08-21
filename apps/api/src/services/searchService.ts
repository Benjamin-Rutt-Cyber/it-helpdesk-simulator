import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ContentService } from './contentService';
import { ContentQuery } from '../models/ContentItem';

export interface SearchQuery {
  query: string;
  filters?: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    sourceType?: string[];
    credibilityLevel?: number;
    resultType?: string[];
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: 'relevance' | 'date' | 'credibility' | 'popularity';
    order: 'asc' | 'desc';
  };
}

export interface SearchResult {
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
    score: number; // 0-100
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

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number; // milliseconds
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
    availableFilters: {
      sourceTypes: string[];
      categories: string[];
      dateRanges: Array<{ label: string; value: string }>;
    };
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'correction' | 'completion';
  frequency: number;
  context?: string;
}

export interface SearchHistory {
  id: string;
  userId: string;
  sessionId?: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  clickedResults: string[];
  searchTime: number;
  refinements: number;
}

export class SearchService {
  private searchIndex: Map<string, SearchResult> = new Map();
  private suggestionIndex: Map<string, SearchSuggestion[]> = new Map();
  private searchHistory: Map<string, SearchHistory[]> = new Map();
  private contentService: ContentService;

  constructor() {
    this.contentService = new ContentService();
    this.initializeSearchIndex();
    this.initializeSuggestions();
  }

  /**
   * Perform a search query
   */
  async search(searchQuery: SearchQuery, userId?: string, sessionId?: string): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Performing search', { query: searchQuery.query, userId, sessionId });

      // Validate search query
      this.validateSearchQuery(searchQuery);

      // Process search query
      const processedQuery = this.preprocessQuery(searchQuery.query);
      
      // Get search results
      const allResults = await this.executeSearch(processedQuery, searchQuery.filters);
      
      // Apply sorting
      const sortedResults = this.sortResults(allResults, searchQuery.sort);
      
      // Apply pagination
      const { paginatedResults, pagination } = this.paginateResults(
        sortedResults, 
        searchQuery.pagination
      );

      // Generate suggestions and related queries
      const suggestions = await this.generateSuggestions(searchQuery.query);
      const relatedQueries = await this.generateRelatedQueries(searchQuery.query);

      // Track search in history
      if (userId) {
        await this.trackSearch(userId, sessionId, searchQuery, paginatedResults.length, Date.now() - startTime);
      }

      const searchTime = Date.now() - startTime;

      const response: SearchResponse = {
        query: searchQuery.query,
        results: paginatedResults,
        totalResults: sortedResults.length,
        searchTime,
        pagination,
        suggestions,
        relatedQueries,
        filters: {
          appliedFilters: searchQuery.filters || {},
          availableFilters: this.getAvailableFilters(),
        },
      };

      logger.info('Search completed', { 
        query: searchQuery.query, 
        resultCount: paginatedResults.length,
        searchTime 
      });

      return response;
    } catch (error) {
      logger.error('Search failed', { query: searchQuery.query, error });
      throw error;
    }
  }

  /**
   * Get search suggestions for auto-complete
   */
  async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const queryLower = query.toLowerCase();
      const suggestions: SearchSuggestion[] = [];

      // Get prefix matches from suggestion index
      for (const [key, suggestionList] of this.suggestionIndex) {
        if (key.startsWith(queryLower)) {
          suggestions.push(...suggestionList);
        }
      }

      // Sort by frequency and relevance
      suggestions.sort((a, b) => b.frequency - a.frequency);

      return suggestions.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get suggestions', { query, error });
      return [];
    }
  }

  /**
   * Get user search history
   */
  async getSearchHistory(userId: string, limit: number = 50): Promise<SearchHistory[]> {
    try {
      const userHistory = this.searchHistory.get(userId) || [];
      return userHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get search history', { userId, error });
      return [];
    }
  }

  /**
   * Clear user search history
   */
  async clearSearchHistory(userId: string): Promise<void> {
    try {
      this.searchHistory.delete(userId);
      logger.info('Search history cleared', { userId });
    } catch (error) {
      logger.error('Failed to clear search history', { userId, error });
      throw error;
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(timeframe: 'hour' | 'day' | 'week' | 'month'): Promise<any> {
    try {
      // Mock analytics data
      return {
        totalSearches: 1247,
        uniqueUsers: 89,
        averageSearchTime: 142, // milliseconds
        topQueries: [
          { query: 'email not working', count: 45 },
          { query: 'password reset', count: 38 },
          { query: 'printer offline', count: 32 },
          { query: 'VPN connection', count: 28 },
          { query: 'software installation', count: 24 },
        ],
        searchSuccessRate: 0.87,
        averageResultsPerQuery: 12.3,
        clickThroughRate: 0.65,
      };
    } catch (error) {
      logger.error('Failed to get search analytics', { timeframe, error });
      throw error;
    }
  }

  // Private helper methods

  private validateSearchQuery(query: SearchQuery): void {
    if (!query.query || query.query.trim().length === 0) {
      throw new ValidationError('Search query cannot be empty');
    }

    if (query.query.length > 500) {
      throw new ValidationError('Search query too long (max 500 characters)');
    }
  }

  private preprocessQuery(query: string): string {
    // Clean and normalize query
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s"']/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private async executeSearch(query: string, filters?: SearchQuery['filters']): Promise<SearchResult[]> {
    // Use ContentService for comprehensive search
    const contentQuery: ContentQuery = {
      query,
      filters: {
        category: this.mapFiltersToContentFilters(filters?.resultType),
        credibilityLevel: this.mapCredibilityScore(filters?.credibilityLevel),
        sourceType: this.mapSourceTypes(filters?.sourceType),
        dateRange: filters?.dateRange,
      },
      sortBy: 'relevance',
      page: 1,
      limit: 100, // Get more results for post-processing
      includeRedHerrings: true,
    };

    const contentResults = await this.contentService.searchContent(contentQuery);
    
    // Convert ContentItem results to SearchResult format
    const searchResults: SearchResult[] = contentResults.items.map(item => ({
      id: item.id,
      title: item.title,
      snippet: item.snippet || item.content.substring(0, 300) + '...',
      url: item.url,
      source: {
        domain: item.source.domain,
        type: this.mapSourceTypeToLegacy(item.source.type),
        name: item.source.name,
      },
      credibility: {
        score: item.credibility.score,
        level: this.mapCredibilityLevel(item.credibility.level),
        indicators: item.credibility.indicators,
        warnings: item.credibility.warnings,
      },
      metadata: {
        publishDate: item.metadata.publishDate,
        lastModified: item.metadata.lastModified,
        author: item.metadata.author,
        category: item.category,
        tags: item.tags,
        language: item.metadata.language,
        wordCount: item.metadata.wordCount || item.content.split(/\s+/).length,
      },
      relevanceScore: (item as any)._relevanceScore || 50,
      highlighted: {
        title: item.title, // Would include highlighting in real implementation
        snippet: item.snippet || item.content.substring(0, 300),
      },
    }));

    // Also search through legacy indexed content for backward compatibility
    const legacyResults: SearchResult[] = [];
    const queryTerms = query.split(' ').filter(term => term.length > 1);

    for (const [id, result] of this.searchIndex) {
      const relevanceScore = this.calculateRelevanceScore(result, queryTerms);
      
      if (relevanceScore > 0) {
        if (this.passesFilters(result, filters)) {
          const highlightedResult = this.highlightSearchTerms(result, queryTerms);
          legacyResults.push({
            ...highlightedResult,
            relevanceScore,
          });
        }
      }
    }

    // Combine and deduplicate results
    const allResults = [...searchResults, ...legacyResults];
    const uniqueResults = allResults.filter((result, index, arr) => 
      arr.findIndex(r => r.id === result.id) === index
    );

    return uniqueResults;
  }

  private calculateRelevanceScore(result: SearchResult, queryTerms: string[]): number {
    let score = 0;
    const titleWeight = 3;
    const snippetWeight = 1;
    const tagWeight = 2;

    const title = result.title.toLowerCase();
    const snippet = result.snippet.toLowerCase();
    const tags = result.metadata.tags.join(' ').toLowerCase();

    for (const term of queryTerms) {
      // Title matches
      if (title.includes(term)) {
        score += titleWeight * (title === term ? 2 : 1);
      }

      // Content matches
      if (snippet.includes(term)) {
        score += snippetWeight;
      }

      // Tag matches
      if (tags.includes(term)) {
        score += tagWeight;
      }
    }

    // Boost credible sources
    score *= (result.credibility.score / 100);

    return score;
  }

  private passesFilters(result: SearchResult, filters?: SearchQuery['filters']): boolean {
    if (!filters) return true;

    // Date range filter
    if (filters.dateRange && result.metadata.publishDate) {
      const publishDate = result.metadata.publishDate;
      if (publishDate < filters.dateRange.start || publishDate > filters.dateRange.end) {
        return false;
      }
    }

    // Source type filter
    if (filters.sourceType && filters.sourceType.length > 0) {
      if (!filters.sourceType.includes(result.source.type)) {
        return false;
      }
    }

    // Credibility level filter
    if (filters.credibilityLevel !== undefined) {
      if (result.credibility.score < filters.credibilityLevel) {
        return false;
      }
    }

    // Result type filter
    if (filters.resultType && filters.resultType.length > 0) {
      if (!filters.resultType.includes(result.metadata.category)) {
        return false;
      }
    }

    return true;
  }

  private sortResults(results: SearchResult[], sort?: SearchQuery['sort']): SearchResult[] {
    if (!sort) {
      // Default sort by relevance
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return results.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sort.field) {
        case 'relevance':
          valueA = a.relevanceScore;
          valueB = b.relevanceScore;
          break;
        case 'date':
          valueA = a.metadata.publishDate?.getTime() || 0;
          valueB = b.metadata.publishDate?.getTime() || 0;
          break;
        case 'credibility':
          valueA = a.credibility.score;
          valueB = b.credibility.score;
          break;
        case 'popularity':
          valueA = a.metadata.wordCount; // Using word count as popularity proxy
          valueB = b.metadata.wordCount;
          break;
        default:
          valueA = a.relevanceScore;
          valueB = b.relevanceScore;
      }

      if (sort.order === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  }

  private paginateResults(results: SearchResult[], pagination?: SearchQuery['pagination']) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedResults = results.slice(startIndex, endIndex);
    const totalPages = Math.ceil(results.length / limit);

    return {
      paginatedResults,
      pagination: {
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  private highlightSearchTerms(result: SearchResult, queryTerms: string[]): SearchResult {
    const highlightedResult = { ...result };

    // Highlight title
    let highlightedTitle = result.title;
    let highlightedSnippet = result.snippet;

    for (const term of queryTerms) {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedTitle = highlightedTitle.replace(regex, '<mark>$1</mark>');
      highlightedSnippet = highlightedSnippet.replace(regex, '<mark>$1</mark>');
    }

    highlightedResult.highlighted = {
      title: highlightedTitle,
      snippet: highlightedSnippet,
    };

    return highlightedResult;
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    // Generate query suggestions based on common patterns
    const suggestions = [
      `${query} tutorial`,
      `${query} troubleshooting`,
      `${query} fix`,
      `${query} error`,
      `how to ${query}`,
    ];

    return suggestions.slice(0, 5);
  }

  private async generateRelatedQueries(query: string): Promise<string[]> {
    // Mock related queries
    const relatedQueries = [
      'email configuration',
      'network troubleshooting',
      'printer setup',
      'password recovery',
      'software installation',
    ];

    return relatedQueries.slice(0, 3);
  }

  private async trackSearch(
    userId: string,
    sessionId: string | undefined,
    query: SearchQuery,
    resultCount: number,
    searchTime: number
  ): Promise<void> {
    const historyEntry: SearchHistory = {
      id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionId,
      query: query.query,
      timestamp: new Date(),
      resultCount,
      clickedResults: [],
      searchTime,
      refinements: 0,
    };

    const userHistory = this.searchHistory.get(userId) || [];
    userHistory.push(historyEntry);
    
    // Keep only last 100 searches per user
    if (userHistory.length > 100) {
      userHistory.shift();
    }
    
    this.searchHistory.set(userId, userHistory);
  }

  private getAvailableFilters() {
    return {
      sourceTypes: ['official', 'documentation', 'forum', 'blog', 'wiki', 'vendor'],
      categories: [
        'Network & Connectivity',
        'Email & Communication',
        'Hardware & Devices',
        'Software & Applications',
        'Security & Access',
        'Database & Storage',
        'General IT Support',
      ],
      dateRanges: [
        { label: 'Last 24 hours', value: '1d' },
        { label: 'Last week', value: '1w' },
        { label: 'Last month', value: '1m' },
        { label: 'Last year', value: '1y' },
      ],
    };
  }

  private initializeSearchIndex(): void {
    // Initialize with mock knowledge base content
    const mockResults: SearchResult[] = [
      {
        id: 'kb-001',
        title: 'How to Configure Email in Outlook 2019',
        snippet: 'Step-by-step guide to setting up email accounts in Microsoft Outlook 2019. Includes IMAP, POP3, and Exchange server configurations.',
        url: 'https://docs.microsoft.com/outlook/email-setup',
        source: {
          domain: 'docs.microsoft.com',
          type: 'official',
          name: 'Microsoft Documentation',
        },
        credibility: {
          score: 95,
          level: 'high',
          indicators: ['Official Microsoft documentation', 'Regularly updated', 'Verified content'],
        },
        metadata: {
          publishDate: new Date('2023-01-15'),
          lastModified: new Date('2023-12-01'),
          author: 'Microsoft Support Team',
          category: 'Email & Communication',
          tags: ['outlook', 'email', 'configuration', 'setup'],
          language: 'en',
          wordCount: 1250,
        },
        relevanceScore: 0,
      },
      {
        id: 'kb-002',
        title: 'Troubleshooting Network Connectivity Issues',
        snippet: 'Common solutions for network connectivity problems including DNS issues, IP configuration, and firewall settings.',
        url: 'https://support.company.com/network-troubleshooting',
        source: {
          domain: 'support.company.com',
          type: 'documentation',
          name: 'Company IT Support',
        },
        credibility: {
          score: 88,
          level: 'high',
          indicators: ['Internal documentation', 'IT team verified'],
        },
        metadata: {
          publishDate: new Date('2023-03-10'),
          lastModified: new Date('2023-11-15'),
          author: 'IT Support Team',
          category: 'Network & Connectivity',
          tags: ['network', 'connectivity', 'troubleshooting', 'dns'],
          language: 'en',
          wordCount: 980,
        },
        relevanceScore: 0,
      },
      // Add more mock results...
    ];

    mockResults.forEach(result => {
      this.searchIndex.set(result.id, result);
    });
  }

  private initializeSuggestions(): void {
    // Initialize with common IT support queries
    const commonQueries = [
      'email not working',
      'password reset',
      'printer offline',
      'VPN connection',
      'software installation',
      'network connectivity',
      'outlook configuration',
      'wifi issues',
      'computer slow',
      'file sharing',
    ];

    commonQueries.forEach(query => {
      const suggestion: SearchSuggestion = {
        text: query,
        type: 'query',
        frequency: Math.floor(Math.random() * 100) + 10,
      };

      const key = query.substring(0, 3);
      const existing = this.suggestionIndex.get(key) || [];
      existing.push(suggestion);
      this.suggestionIndex.set(key, existing);
    });
  }

  // Helper methods for mapping between old and new content systems
  private mapFiltersToContentFilters(resultTypes?: string[]): any {
    if (!resultTypes || resultTypes.length === 0) return undefined;
    
    const mappings: Record<string, string> = {
      'Network & Connectivity': 'network-connectivity',
      'Email & Communication': 'network-connectivity',
      'Hardware & Devices': 'hardware-support',
      'Software & Applications': 'software-support',
      'Security & Access': 'security-compliance',
      'Database & Storage': 'software-support',
    };

    const mapped = resultTypes.map(type => mappings[type] || 'general-troubleshooting');
    return mapped[0]; // Return first mapping for simplicity
  }

  private mapCredibilityScore(score?: number): any {
    if (score === undefined) return undefined;
    
    if (score >= 90) return 'official';
    if (score >= 70) return 'community';
    return 'questionable';
  }

  private mapSourceTypes(sourceTypes?: string[]): any {
    if (!sourceTypes || sourceTypes.length === 0) return undefined;
    
    const mappings: Record<string, string> = {
      'official': 'official-documentation',
      'documentation': 'vendor-documentation',
      'forum': 'community-forum',
      'blog': 'technical-blog',
      'wiki': 'knowledge-base',
      'vendor': 'vendor-documentation',
    };

    const mapped = sourceTypes.map(type => mappings[type] || type);
    return mapped[0]; // Return first mapping for simplicity
  }

  private mapSourceTypeToLegacy(sourceType: string): 'official' | 'documentation' | 'forum' | 'blog' | 'wiki' | 'vendor' {
    const mappings: Record<string, 'official' | 'documentation' | 'forum' | 'blog' | 'wiki' | 'vendor'> = {
      'official-documentation': 'official',
      'vendor-documentation': 'vendor',
      'knowledge-base': 'documentation',
      'community-forum': 'forum',
      'technical-blog': 'blog',
      'social-media': 'forum',
      'personal-blog': 'blog',
      'suspicious-website': 'forum',
      'outdated-resource': 'documentation',
    };

    return mappings[sourceType] || 'documentation';
  }

  private mapCredibilityLevel(level: string): 'high' | 'medium' | 'low' | 'unknown' {
    const mappings: Record<string, 'high' | 'medium' | 'low' | 'unknown'> = {
      'official': 'high',
      'community': 'medium',
      'questionable': 'low',
      'unknown': 'unknown',
    };

    return mappings[level] || 'unknown';
  }
}