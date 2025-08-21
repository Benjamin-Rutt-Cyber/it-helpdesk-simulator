export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  sourceType: 'official' | 'community' | 'documentation' | 'forum' | 'blog';
  credibilityLevel: 'high' | 'medium' | 'low';
  credibilityScore: number; // 0-1
  date: string;
  position: number;
  relevanceScore: number; // 0-1
  relevanceToTicket?: number; // 0-1, specific to current ticket context
  contextMatches?: string[]; // Highlighted matches from ticket context
  tags?: string[];
  metadata?: {
    author?: string;
    views?: number;
    votes?: number;
    lastUpdated?: string;
    language?: string;
  };
}

export interface SearchFilter {
  sourceType?: string;
  credibility?: 'high' | 'medium' | 'low' | 'all';
  dateRange?: 'week' | 'month' | 'year' | 'all';
  tags?: string[];
  language?: string;
}

export interface TicketContext {
  ticketId: string;
  issueType: string;
  description?: string;
  customerEnvironment?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  tags?: string[];
  errorCode?: string;
  affectedSystems?: string[];
  customerId?: string;
  assignedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContextExtraction {
  keywords: string[];
  entities: {
    type: 'product' | 'error' | 'system' | 'process';
    value: string;
    confidence: number;
  }[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  technicalLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  suggestedQueries: string[];
}

export interface SearchSession {
  sessionId: string;
  ticketId?: string;
  startTime: Date;
  endTime?: Date;
  searchHistory: SearchHistoryItem[];
  resultsViewed: string[]; // Result IDs
  contextExtracted?: ContextExtraction | null;
  totalSearches?: number;
  totalResults?: number;
  isActive: boolean;
  events?: SearchEvent[];
}

export interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: SearchFilter;
}

export interface SearchEvent {
  type: SearchEventType;
  timestamp: Date;
  sessionId: string;
  ticketId?: string;
  data: any;
}

export type SearchEventType = 
  | 'search_performed'
  | 'contextual_search_performed'
  | 'result_clicked'
  | 'contextual_result_clicked'
  | 'result_referenced'
  | 'suggestion_clicked'
  | 'filter_applied'
  | 'search_refined'
  | 'session_started'
  | 'session_ended'
  | 'fallback_search_requested';

export interface ContextualSearchOptions {
  maxResults?: number;
  includeRelatedTopics?: boolean;
  prioritizeRecent?: boolean;
  minRelevanceThreshold?: number;
  enableSemanticSearch?: boolean;
}

export interface SavedReference {
  id: string;
  resultId: string;
  ticketId: string;
  sessionId: string;
  title: string;
  url: string;
  snippet: string;
  credibilityLevel: 'high' | 'medium' | 'low';
  notes?: string;
  savedAt: Date;
  tags?: string[];
}

export interface SearchIntegrationConfig {
  enableContextualSearch: boolean;
  enableSearchHistory: boolean;
  enableResultCaching: boolean;
  maxHistoryItems: number;
  defaultFilters: SearchFilter;
  searchTimeout: number; // milliseconds
}

export interface SearchTab {
  id: string;
  label: string;
  query?: string;
  filters?: SearchFilter;
  results?: SearchResult[];
  isActive: boolean;
  createdAt: Date;
  ticketContext?: TicketContext;
}

export interface QuickAccessShortcut {
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: 'open_search' | 'focus_search' | 'clear_search' | 'next_result' | 'prev_result';
  description: string;
}

export interface CitationFormat {
  format: 'apa' | 'mla' | 'chicago' | 'ieee' | 'custom';
  template: string;
  includeAccessDate: boolean;
  includeCredibilityNote: boolean;
}

// API Response Types
export interface SearchApiResponse {
  success: boolean;
  results: SearchResult[];
  totalCount: number;
  searchTime: number; // milliseconds
  suggestions?: string[];
  filters?: {
    sourceTypes: string[];
    credibilityLevels: string[];
    dateRanges: string[];
  };
}

export interface ContextualSearchResponse extends SearchApiResponse {
  contextScore: number;
  prioritizedResults: SearchResult[];
  contextMatches: {
    [resultId: string]: string[];
  };
  suggestedRefinements: string[];
}

export interface SearchMetrics {
  totalSearches: number;
  averageResultsPerSearch: number;
  clickThroughRate: number;
  averageTimeToClick: number; // milliseconds
  mostPopularQueries: string[];
  commonFilters: SearchFilter;
  contextualSearchUsage: number;
  resultReferenceRate: number;
}