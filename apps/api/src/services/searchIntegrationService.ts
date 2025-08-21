import { logger } from '../utils/logger';

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
}

export interface SearchFilter {
  sourceType?: string;
  credibility?: 'high' | 'medium' | 'low' | 'all';
  dateRange?: 'week' | 'month' | 'year' | 'all';
  tags?: string[];
  language?: string;
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
  contextExtracted?: ContextExtraction | null;
  isActive: boolean;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: SearchFilter;
}

export class SearchIntegrationService {
  private searchSessions: Map<string, SearchSession> = new Map();
  private searchCache: Map<string, { results: SearchResult[]; timestamp: Date }> = new Map();
  private contextCache: Map<string, ContextExtraction> = new Map();

  // Mock knowledge base content for demonstration
  private readonly mockKnowledgeBase: SearchResult[] = [
    {
      id: 'kb-001',
      title: 'Windows 10 Printer Connection Issues - Complete Troubleshooting Guide',
      snippet: 'Step-by-step guide to resolve printer connection problems in Windows 10. Covers driver issues, network connectivity, and common error codes.',
      url: 'https://docs.microsoft.com/printer-troubleshooting',
      source: 'Microsoft Documentation',
      sourceType: 'official',
      credibilityLevel: 'high',
      credibilityScore: 0.95,
      date: '2024-01-15',
      position: 1,
      relevanceScore: 0.9,
      tags: ['windows', 'printer', 'troubleshooting', 'drivers']
    },
    {
      id: 'kb-002',
      title: 'Common VPN Connection Errors and Solutions',
      snippet: 'Resolve VPN connectivity issues including authentication failures, timeout errors, and network configuration problems.',
      url: 'https://support.company.com/vpn-troubleshooting',
      source: 'Company Support',
      sourceType: 'official',
      credibilityLevel: 'high',
      credibilityScore: 0.9,
      date: '2024-01-10',
      position: 2,
      relevanceScore: 0.85,
      tags: ['vpn', 'connectivity', 'authentication', 'network']
    },
    {
      id: 'kb-003',
      title: 'Email Client Configuration for Exchange Server',
      snippet: 'Configure Outlook and other email clients to connect to Exchange Server. Includes IMAP, POP3, and ActiveSync settings.',
      url: 'https://docs.exchange.com/client-config',
      source: 'Exchange Documentation',
      sourceType: 'official',
      credibilityLevel: 'high',
      credibilityScore: 0.92,
      date: '2024-01-08',
      position: 3,
      relevanceScore: 0.8,
      tags: ['email', 'exchange', 'outlook', 'configuration']
    },
    {
      id: 'kb-004',
      title: 'How to Fix "Access Denied" Errors in Windows',
      snippet: 'Community discussion on resolving Windows access denied errors. Multiple solutions and user experiences shared.',
      url: 'https://reddit.com/r/techsupport/access-denied-fix',
      source: 'Reddit TechSupport',
      sourceType: 'community',
      credibilityLevel: 'medium',
      credibilityScore: 0.7,
      date: '2024-01-12',
      position: 4,
      relevanceScore: 0.75,
      tags: ['windows', 'permissions', 'access-denied', 'troubleshooting']
    },
    {
      id: 'kb-005',
      title: 'Network Drive Mapping Issues - Quick Fixes',
      snippet: 'Blog post covering common network drive mapping problems and solutions. Includes PowerShell scripts and registry fixes.',
      url: 'https://techblog.example.com/network-drive-fixes',
      source: 'Tech Blog',
      sourceType: 'blog',
      credibilityLevel: 'medium',
      credibilityScore: 0.65,
      date: '2024-01-05',
      position: 5,
      relevanceScore: 0.7,
      tags: ['network', 'drive-mapping', 'powershell', 'registry']
    },
    {
      id: 'kb-006',
      title: 'Outdated WiFi Driver Fix - Works Sometimes',
      snippet: 'User forum post about fixing WiFi issues. Solution may not work for all cases and information seems outdated.',
      url: 'https://unknown-forum.com/wifi-fix',
      source: 'Unknown Forum',
      sourceType: 'forum',
      credibilityLevel: 'low',
      credibilityScore: 0.3,
      date: '2022-06-15',
      position: 6,
      relevanceScore: 0.4,
      tags: ['wifi', 'drivers', 'outdated']
    }
  ];

  // Task 1: Integrate Search into Ticket Workflow
  async performIntegratedSearch(
    query: string,
    filters: SearchFilter = {},
    ticketContext?: TicketContext,
    sessionId?: string
  ): Promise<SearchResult[]> {
    try {
      logger.info(`Performing integrated search: "${query}"`, { 
        ticketId: ticketContext?.ticketId,
        sessionId,
        filters 
      });

      // Check cache first
      const cacheKey = `${query}_${JSON.stringify(filters)}_${ticketContext?.ticketId || 'no-context'}`;
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp.getTime() < 300000) { // 5 minute cache
        logger.debug('Returning cached search results');
        return cached.results;
      }

      // Filter knowledge base based on query and filters
      let results = this.filterKnowledgeBase(query, filters);

      // Apply contextual ranking if ticket context is provided
      if (ticketContext) {
        results = await this.applyContextualRanking(results, ticketContext);
      }

      // Update search session if provided
      if (sessionId) {
        await this.updateSearchSession(sessionId, query, results.length, filters);
      }

      // Cache results
      this.searchCache.set(cacheKey, {
        results,
        timestamp: new Date()
      });

      logger.info(`Search completed: ${results.length} results found`);
      return results;

    } catch (error) {
      logger.error('Error in integrated search:', error);
      throw error;
    }
  }

  // Task 2: Implement Contextual Search
  async performContextualSearch(
    query: string,
    ticketContext: TicketContext,
    config: any = {}
  ): Promise<SearchResult[]> {
    try {
      logger.info(`Performing contextual search for ticket ${ticketContext.ticketId}`, {
        query,
        issueType: ticketContext.issueType
      });

      // Extract context if not already cached
      const contextExtraction = await this.extractTicketContext(ticketContext);

      // Enhance query with context
      const enhancedQuery = this.enhanceQueryWithContext(query, contextExtraction, ticketContext);

      // Perform search with enhanced query
      let results = this.filterKnowledgeBase(enhancedQuery, {});

      // Apply contextual scoring and filtering
      results = this.applyContextualScoring(results, ticketContext, contextExtraction);

      // Filter by relevance threshold
      const minThreshold = config.minRelevanceThreshold || 0.3;
      results = results.filter(r => (r.relevanceToTicket || 0) >= minThreshold);

      // Limit results
      const maxResults = config.maxResults || 10;
      results = results.slice(0, maxResults);

      logger.info(`Contextual search completed: ${results.length} contextual results`);
      return results;

    } catch (error) {
      logger.error('Error in contextual search:', error);
      throw error;
    }
  }

  // Task 2: Extract ticket context for search enhancement
  async extractTicketContext(ticketContext: TicketContext): Promise<ContextExtraction> {
    try {
      // Check cache first
      const cacheKey = `context_${ticketContext.ticketId}`;
      const cached = this.contextCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      logger.info(`Extracting context for ticket ${ticketContext.ticketId}`);

      // Extract keywords from issue type and description
      const keywords = this.extractKeywords(ticketContext);

      // Identify entities (products, systems, error codes)
      const entities = this.extractEntities(ticketContext);

      // Determine sentiment and urgency
      const sentiment = this.analyzeSentiment(ticketContext);
      const urgency = this.determineUrgency(ticketContext);

      // Assess technical level
      const technicalLevel = this.assessTechnicalLevel(ticketContext);

      // Generate suggested queries
      const suggestedQueries = this.generateSuggestedQueries(ticketContext, keywords);

      const extraction: ContextExtraction = {
        keywords,
        entities,
        sentiment,
        urgency,
        technicalLevel,
        suggestedQueries
      };

      // Cache the extraction
      this.contextCache.set(cacheKey, extraction);

      logger.info(`Context extraction completed for ticket ${ticketContext.ticketId}`, {
        keywordCount: keywords.length,
        entityCount: entities.length,
        urgency,
        technicalLevel
      });

      return extraction;

    } catch (error) {
      logger.error('Error extracting ticket context:', error);
      throw error;
    }
  }

  // Task 2: Prioritize search results based on ticket context
  async prioritizeResults(results: SearchResult[], ticketContext: TicketContext): Promise<SearchResult[]> {
    try {
      logger.info(`Prioritizing ${results.length} results for ticket ${ticketContext.ticketId}`);

      const contextExtraction = await this.extractTicketContext(ticketContext);
      const prioritized = results.map(result => {
        const contextScore = this.calculateContextRelevance(result, ticketContext, contextExtraction);
        return {
          ...result,
          relevanceToTicket: contextScore,
          contextMatches: this.findContextMatches(result, contextExtraction)
        };
      });

      // Sort by context relevance, then by original relevance, then by credibility
      prioritized.sort((a, b) => {
        const contextDiff = (b.relevanceToTicket || 0) - (a.relevanceToTicket || 0);
        if (Math.abs(contextDiff) > 0.1) return contextDiff;
        
        const relevanceDiff = b.relevanceScore - a.relevanceScore;
        if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
        
        return b.credibilityScore - a.credibilityScore;
      });

      logger.info(`Results prioritized. Top result relevance: ${prioritized[0]?.relevanceToTicket || 0}`);
      return prioritized;

    } catch (error) {
      logger.error('Error prioritizing results:', error);
      return results;
    }
  }

  // Task 3: Search session management
  async startSearchSession(ticketId?: string): Promise<SearchSession> {
    const sessionId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: SearchSession = {
      sessionId,
      ticketId,
      startTime: new Date(),
      searchHistory: [],
      isActive: true
    };

    this.searchSessions.set(sessionId, session);
    
    logger.info(`Search session started: ${sessionId}`, { ticketId });
    return session;
  }

  async updateSearchSession(
    sessionId: string,
    query: string,
    resultCount: number,
    filters?: SearchFilter
  ): Promise<void> {
    const session = this.searchSessions.get(sessionId);
    if (!session) return;

    session.searchHistory.push({
      query,
      timestamp: new Date(),
      resultCount,
      filters
    });

    logger.debug(`Search session updated: ${sessionId}`, { query, resultCount });
  }

  async endSearchSession(sessionId: string): Promise<SearchSession | null> {
    const session = this.searchSessions.get(sessionId);
    if (!session) return null;

    session.endTime = new Date();
    session.isActive = false;

    logger.info(`Search session ended: ${sessionId}`, {
      duration: session.endTime.getTime() - session.startTime.getTime(),
      searchCount: session.searchHistory.length
    });

    return session;
  }

  // Helper methods for filtering and scoring
  private filterKnowledgeBase(query: string, filters: SearchFilter): SearchResult[] {
    let results = [...this.mockKnowledgeBase];

    // Text search
    if (query.trim()) {
      const queryWords = query.toLowerCase().split(/\s+/);
      results = results.filter(item => {
        const searchText = `${item.title} ${item.snippet} ${item.tags?.join(' ') || ''}`.toLowerCase();
        return queryWords.some(word => searchText.includes(word));
      });

      // Update relevance scores based on query match
      results = results.map(item => {
        const titleMatch = this.calculateTextMatch(query, item.title);
        const snippetMatch = this.calculateTextMatch(query, item.snippet);
        const tagMatch = item.tags ? this.calculateTextMatch(query, item.tags.join(' ')) : 0;
        
        const relevanceScore = (titleMatch * 0.5) + (snippetMatch * 0.3) + (tagMatch * 0.2);
        
        return {
          ...item,
          relevanceScore: Math.max(item.relevanceScore, relevanceScore)
        };
      });
    }

    // Apply filters
    if (filters.sourceType && filters.sourceType !== 'all') {
      results = results.filter(item => item.sourceType === filters.sourceType);
    }

    if (filters.credibility && filters.credibility !== 'all') {
      results = results.filter(item => item.credibilityLevel === filters.credibility);
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const cutoffDate = this.getDateCutoff(filters.dateRange);
      results = results.filter(item => new Date(item.date) >= cutoffDate);
    }

    // Sort by relevance and credibility
    results.sort((a, b) => {
      const relevanceDiff = b.relevanceScore - a.relevanceScore;
      if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
      return b.credibilityScore - a.credibilityScore;
    });

    // Update positions
    results.forEach((result, index) => {
      result.position = index + 1;
    });

    return results;
  }

  private async applyContextualRanking(results: SearchResult[], ticketContext: TicketContext): Promise<SearchResult[]> {
    const contextExtraction = await this.extractTicketContext(ticketContext);
    
    return results.map(result => {
      const contextRelevance = this.calculateContextRelevance(result, ticketContext, contextExtraction);
      const contextMatches = this.findContextMatches(result, contextExtraction);
      
      return {
        ...result,
        relevanceToTicket: contextRelevance,
        contextMatches,
        // Boost relevance score based on context
        relevanceScore: Math.min(1, result.relevanceScore + (contextRelevance * 0.3))
      };
    });
  }

  private applyContextualScoring(
    results: SearchResult[],
    ticketContext: TicketContext,
    contextExtraction: ContextExtraction
  ): SearchResult[] {
    return results.map(result => {
      const contextScore = this.calculateContextRelevance(result, ticketContext, contextExtraction);
      const contextMatches = this.findContextMatches(result, contextExtraction);
      
      return {
        ...result,
        relevanceToTicket: contextScore,
        contextMatches
      };
    });
  }

  private extractKeywords(ticketContext: TicketContext): string[] {
    const keywords = new Set<string>();
    
    // Extract from issue type
    if (ticketContext.issueType) {
      ticketContext.issueType.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) keywords.add(word);
      });
    }

    // Extract from description
    if (ticketContext.description) {
      ticketContext.description.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 3) keywords.add(word);
      });
    }

    // Add environment keywords
    if (ticketContext.customerEnvironment) {
      ticketContext.customerEnvironment.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) keywords.add(word);
      });
    }

    // Add tags
    if (ticketContext.tags) {
      ticketContext.tags.forEach(tag => keywords.add(tag.toLowerCase()));
    }

    // Add error code if present
    if (ticketContext.errorCode) {
      keywords.add(ticketContext.errorCode.toLowerCase());
    }

    return Array.from(keywords).slice(0, 20); // Limit to top 20 keywords
  }

  private extractEntities(ticketContext: TicketContext): ContextExtraction['entities'] {
    const entities: ContextExtraction['entities'] = [];

    // Common product entities
    const productPatterns = [
      { pattern: /windows\s*(\d+|10|11|xp|7|8)/i, type: 'product' as const },
      { pattern: /office\s*(\d+|365|2019|2021)/i, type: 'product' as const },
      { pattern: /outlook/i, type: 'product' as const },
      { pattern: /exchange/i, type: 'product' as const },
      { pattern: /sharepoint/i, type: 'product' as const },
      { pattern: /teams/i, type: 'product' as const }
    ];

    // System entities
    const systemPatterns = [
      { pattern: /server/i, type: 'system' as const },
      { pattern: /database/i, type: 'system' as const },
      { pattern: /network/i, type: 'system' as const },
      { pattern: /printer/i, type: 'system' as const },
      { pattern: /vpn/i, type: 'system' as const }
    ];

    // Error patterns
    const errorPatterns = [
      { pattern: /error\s*(\d+)/i, type: 'error' as const },
      { pattern: /0x[0-9a-f]+/i, type: 'error' as const }
    ];

    const text = `${ticketContext.issueType || ''} ${ticketContext.description || ''}`;

    [...productPatterns, ...systemPatterns, ...errorPatterns].forEach(({ pattern, type }) => {
      const matches = text.match(pattern);
      if (matches) {
        entities.push({
          type,
          value: matches[0],
          confidence: 0.8
        });
      }
    });

    return entities;
  }

  private analyzeSentiment(ticketContext: TicketContext): 'positive' | 'negative' | 'neutral' {
    const text = `${ticketContext.issueType || ''} ${ticketContext.description || ''}`.toLowerCase();
    
    const negativeWords = ['error', 'fail', 'broken', 'issue', 'problem', 'unable', 'cannot', 'not working'];
    const positiveWords = ['working', 'success', 'resolved', 'fixed', 'good'];
    
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  private determineUrgency(ticketContext: TicketContext): ContextExtraction['urgency'] {
    if (ticketContext.priority === 'critical') return 'critical';
    if (ticketContext.priority === 'high') return 'high';
    if (ticketContext.priority === 'low') return 'low';
    
    // Analyze text for urgency indicators
    const text = `${ticketContext.issueType || ''} ${ticketContext.description || ''}`.toLowerCase();
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'down', 'outage'];
    
    if (urgentWords.some(word => text.includes(word))) {
      return 'high';
    }
    
    return 'medium';
  }

  private assessTechnicalLevel(ticketContext: TicketContext): ContextExtraction['technicalLevel'] {
    const text = `${ticketContext.issueType || ''} ${ticketContext.description || ''}`.toLowerCase();
    
    const expertTerms = ['registry', 'powershell', 'cmd', 'api', 'sql', 'ldap'];
    const intermediateTerms = ['configuration', 'settings', 'driver', 'service'];
    const basicTerms = ['password', 'login', 'email', 'print'];
    
    if (expertTerms.some(term => text.includes(term))) return 'expert';
    if (intermediateTerms.some(term => text.includes(term))) return 'advanced';
    if (basicTerms.some(term => text.includes(term))) return 'basic';
    
    return 'intermediate';
  }

  private generateSuggestedQueries(ticketContext: TicketContext, keywords: string[]): string[] {
    const suggestions = [];
    
    // Basic issue query
    suggestions.push(ticketContext.issueType);
    
    // Issue + environment
    if (ticketContext.customerEnvironment) {
      suggestions.push(`${ticketContext.issueType} ${ticketContext.customerEnvironment}`);
    }
    
    // Issue + troubleshooting
    suggestions.push(`${ticketContext.issueType} troubleshooting`);
    suggestions.push(`how to fix ${ticketContext.issueType}`);
    
    // Error code queries
    if (ticketContext.errorCode) {
      suggestions.push(ticketContext.errorCode);
      suggestions.push(`error ${ticketContext.errorCode} fix`);
    }
    
    // Keyword combinations
    if (keywords.length >= 2) {
      suggestions.push(keywords.slice(0, 3).join(' '));
    }
    
    return [...new Set(suggestions)].slice(0, 10);
  }

  private enhanceQueryWithContext(
    query: string, 
    contextExtraction: ContextExtraction, 
    ticketContext: TicketContext
  ): string {
    const enhancedTerms = [query];
    
    // Add top keywords
    enhancedTerms.push(...contextExtraction.keywords.slice(0, 3));
    
    // Add environment context
    if (ticketContext.customerEnvironment) {
      enhancedTerms.push(ticketContext.customerEnvironment);
    }
    
    // Add error code
    if (ticketContext.errorCode) {
      enhancedTerms.push(ticketContext.errorCode);
    }
    
    return enhancedTerms.join(' ');
  }

  private calculateContextRelevance(
    result: SearchResult,
    ticketContext: TicketContext,
    contextExtraction: ContextExtraction
  ): number {
    let relevance = 0;
    
    const resultText = `${result.title} ${result.snippet} ${result.tags?.join(' ') || ''}`.toLowerCase();
    
    // Keyword matching
    const keywordMatches = contextExtraction.keywords.filter(keyword =>
      resultText.includes(keyword.toLowerCase())
    ).length;
    relevance += (keywordMatches / contextExtraction.keywords.length) * 0.4;
    
    // Entity matching
    const entityMatches = contextExtraction.entities.filter(entity =>
      resultText.includes(entity.value.toLowerCase())
    ).length;
    relevance += (entityMatches / Math.max(contextExtraction.entities.length, 1)) * 0.3;
    
    // Issue type matching
    if (resultText.includes(ticketContext.issueType.toLowerCase())) {
      relevance += 0.2;
    }
    
    // Environment matching
    if (ticketContext.customerEnvironment && 
        resultText.includes(ticketContext.customerEnvironment.toLowerCase())) {
      relevance += 0.1;
    }
    
    return Math.min(1, relevance);
  }

  private findContextMatches(result: SearchResult, contextExtraction: ContextExtraction): string[] {
    const matches: string[] = [];
    const resultText = `${result.title} ${result.snippet}`.toLowerCase();
    
    // Find keyword matches
    contextExtraction.keywords.forEach(keyword => {
      if (resultText.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    });
    
    // Find entity matches
    contextExtraction.entities.forEach(entity => {
      if (resultText.includes(entity.value.toLowerCase())) {
        matches.push(entity.value);
      }
    });
    
    return [...new Set(matches)];
  }

  private calculateTextMatch(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    
    const matches = queryWords.filter(word => textLower.includes(word)).length;
    return matches / queryWords.length;
  }

  private getDateCutoff(dateRange: string): Date {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0); // Return epoch for 'all'
    }
  }

  // Public methods for external access
  async getSearchSession(sessionId: string): Promise<SearchSession | null> {
    return this.searchSessions.get(sessionId) || null;
  }

  async clearSearchCache(): Promise<void> {
    this.searchCache.clear();
    this.contextCache.clear();
    logger.info('Search cache cleared');
  }

  async getSearchMetrics(): Promise<any> {
    return {
      activeSessions: this.searchSessions.size,
      cacheSize: this.searchCache.size,
      contextCacheSize: this.contextCache.size
    };
  }
}