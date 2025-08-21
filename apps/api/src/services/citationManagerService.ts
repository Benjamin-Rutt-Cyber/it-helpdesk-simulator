import { logger } from '../utils/logger';

export interface Reference {
  id: string;
  resultId: string;
  ticketId?: string;
  sessionId?: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  sourceType: 'official' | 'community' | 'documentation' | 'forum' | 'blog';
  credibilityLevel: 'high' | 'medium' | 'low';
  notes: string;
  tags: string[];
  citationFormat: string;
  citationStyle: string;
  savedAt: Date;
  updatedAt?: Date;
  userId?: string;
  isPublic: boolean;
  category?: string;
  relevanceScore?: number;
}

export interface CitationFormat {
  id: string;
  name: string;
  description: string;
  template: string;
  fields: string[];
}

export interface ReferenceFilter {
  ticketId?: string;
  sessionId?: string;
  userId?: string;
  tags?: string[];
  credibilityLevel?: 'high' | 'medium' | 'low';
  sourceType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  category?: string;
  isPublic?: boolean;
}

export interface ReferenceExport {
  format: 'json' | 'csv' | 'txt' | 'markdown';
  references: Reference[];
  metadata: {
    exportedAt: Date;
    totalCount: number;
    filters?: ReferenceFilter;
  };
}

export interface CitationStats {
  totalReferences: number;
  referencesThisWeek: number;
  referencesThisMonth: number;
  topSources: { source: string; count: number }[];
  topTags: { tag: string; count: number }[];
  credibilityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  sourceTypeDistribution: Record<string, number>;
}

export class CitationManagerService {
  private references: Map<string, Reference> = new Map();
  private citationFormats: Map<string, CitationFormat> = new Map();
  private userCollections: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeDefaultFormats();
  }

  private initializeDefaultFormats(): void {
    const defaultFormats: CitationFormat[] = [
      {
        id: 'apa',
        name: 'APA Style',
        description: 'American Psychological Association format',
        template: '{source}. ({year}). {title}. Retrieved from {url}',
        fields: ['source', 'year', 'title', 'url']
      },
      {
        id: 'mla',
        name: 'MLA Style',
        description: 'Modern Language Association format',
        template: '"{title}." {source}, {date}, {url}.',
        fields: ['title', 'source', 'date', 'url']
      },
      {
        id: 'chicago',
        name: 'Chicago Style',
        description: 'Chicago Manual of Style format',
        template: '{source}. "{title}." Accessed {accessDate}. {url}.',
        fields: ['source', 'title', 'accessDate', 'url']
      },
      {
        id: 'ieee',
        name: 'IEEE Style',
        description: 'Institute of Electrical and Electronics Engineers format',
        template: '{source}, "{title}," [Online]. Available: {url}. [Accessed: {accessDate}].',
        fields: ['source', 'title', 'url', 'accessDate']
      },
      {
        id: 'harvard',
        name: 'Harvard Style',
        description: 'Harvard referencing system',
        template: '{source} {year}, {title}, viewed {accessDate}, <{url}>.',
        fields: ['source', 'year', 'title', 'accessDate', 'url']
      },
      {
        id: 'simple',
        name: 'Simple Reference',
        description: 'Basic title, source, and URL format',
        template: '{title} - {source} ({url})',
        fields: ['title', 'source', 'url']
      }
    ];

    defaultFormats.forEach(format => {
      this.citationFormats.set(format.id, format);
    });

    logger.info('Citation formats initialized', {
      formatCount: this.citationFormats.size
    });
  }

  // Reference Management
  async saveReference(referenceData: Omit<Reference, 'id' | 'savedAt'>): Promise<Reference> {
    try {
      const reference: Reference = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date(),
        ...referenceData
      };

      this.references.set(reference.id, reference);

      logger.info('Reference saved', {
        referenceId: reference.id,
        ticketId: reference.ticketId,
        title: reference.title,
        source: reference.source
      });

      return reference;

    } catch (error) {
      logger.error('Error saving reference:', error);
      throw error;
    }
  }

  async updateReference(referenceId: string, updates: Partial<Reference>): Promise<Reference | null> {
    try {
      const existing = this.references.get(referenceId);
      if (!existing) {
        logger.warn('Reference not found for update', { referenceId });
        return null;
      }

      const updated: Reference = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };

      this.references.set(referenceId, updated);

      logger.info('Reference updated', {
        referenceId,
        updatedFields: Object.keys(updates)
      });

      return updated;

    } catch (error) {
      logger.error('Error updating reference:', error);
      throw error;
    }
  }

  async deleteReference(referenceId: string): Promise<boolean> {
    try {
      const deleted = this.references.delete(referenceId);
      
      if (deleted) {
        logger.info('Reference deleted', { referenceId });
      } else {
        logger.warn('Reference not found for deletion', { referenceId });
      }

      return deleted;

    } catch (error) {
      logger.error('Error deleting reference:', error);
      throw error;
    }
  }

  async getReference(referenceId: string): Promise<Reference | null> {
    return this.references.get(referenceId) || null;
  }

  async getReferences(filter: ReferenceFilter = {}): Promise<Reference[]> {
    try {
      let references = Array.from(this.references.values());

      // Apply filters
      if (filter.ticketId) {
        references = references.filter(ref => ref.ticketId === filter.ticketId);
      }

      if (filter.sessionId) {
        references = references.filter(ref => ref.sessionId === filter.sessionId);
      }

      if (filter.userId) {
        references = references.filter(ref => ref.userId === filter.userId);
      }

      if (filter.credibilityLevel) {
        references = references.filter(ref => ref.credibilityLevel === filter.credibilityLevel);
      }

      if (filter.sourceType) {
        references = references.filter(ref => ref.sourceType === filter.sourceType);
      }

      if (filter.tags && filter.tags.length > 0) {
        references = references.filter(ref => 
          filter.tags!.some(tag => ref.tags.includes(tag))
        );
      }

      if (filter.category) {
        references = references.filter(ref => ref.category === filter.category);
      }

      if (filter.isPublic !== undefined) {
        references = references.filter(ref => ref.isPublic === filter.isPublic);
      }

      if (filter.dateRange) {
        references = references.filter(ref => 
          ref.savedAt >= filter.dateRange!.start && 
          ref.savedAt <= filter.dateRange!.end
        );
      }

      // Sort by relevance score (if available) then by saved date
      references.sort((a, b) => {
        if (a.relevanceScore && b.relevanceScore) {
          const scoreDiff = b.relevanceScore - a.relevanceScore;
          if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
        }
        return b.savedAt.getTime() - a.savedAt.getTime();
      });

      logger.debug('References retrieved', {
        totalFound: references.length,
        filters: Object.keys(filter)
      });

      return references;

    } catch (error) {
      logger.error('Error getting references:', error);
      throw error;
    }
  }

  // Citation Generation
  async generateCitation(referenceId: string, formatId: string = 'apa'): Promise<string> {
    try {
      const reference = this.references.get(referenceId);
      if (!reference) {
        throw new Error(`Reference not found: ${referenceId}`);
      }

      const format = this.citationFormats.get(formatId);
      if (!format) {
        throw new Error(`Citation format not found: ${formatId}`);
      }

      const citation = this.formatCitation(reference, format);

      logger.debug('Citation generated', {
        referenceId,
        formatId,
        citation
      });

      return citation;

    } catch (error) {
      logger.error('Error generating citation:', error);
      throw error;
    }
  }

  private formatCitation(reference: Reference, format: CitationFormat): string {
    let citation = format.template;
    const now = new Date();

    // Extract data from reference
    const citationData: Record<string, string> = {
      title: reference.title,
      source: reference.source,
      url: reference.url,
      year: new Date(reference.savedAt).getFullYear().toString(),
      date: new Date(reference.savedAt).toLocaleDateString(),
      accessDate: now.toLocaleDateString()
    };

    // Replace template placeholders
    format.fields.forEach(field => {
      const value = citationData[field] || '';
      citation = citation.replace(new RegExp(`\\{${field}\\}`, 'g'), value);
    });

    return citation;
  }

  async getCitationFormats(): Promise<CitationFormat[]> {
    return Array.from(this.citationFormats.values());
  }

  async addCitationFormat(format: CitationFormat): Promise<void> {
    this.citationFormats.set(format.id, format);
    logger.info('Citation format added', { formatId: format.id, name: format.name });
  }

  // Export and Import
  async exportReferences(filter: ReferenceFilter = {}, format: 'json' | 'csv' | 'txt' | 'markdown' = 'json'): Promise<ReferenceExport> {
    try {
      const references = await this.getReferences(filter);
      
      const exportData: ReferenceExport = {
        format,
        references,
        metadata: {
          exportedAt: new Date(),
          totalCount: references.length,
          filters: filter
        }
      };

      logger.info('References exported', {
        format,
        count: references.length,
        filterKeys: Object.keys(filter)
      });

      return exportData;

    } catch (error) {
      logger.error('Error exporting references:', error);
      throw error;
    }
  }

  async importReferences(importData: ReferenceExport): Promise<{ imported: number; skipped: number }> {
    try {
      let imported = 0;
      let skipped = 0;

      for (const referenceData of importData.references) {
        try {
          // Check if reference already exists
          if (this.references.has(referenceData.id)) {
            skipped++;
            continue;
          }

          // Save the reference
          this.references.set(referenceData.id, referenceData);
          imported++;

        } catch (error) {
          logger.warn('Failed to import reference', { 
            referenceId: referenceData.id, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          skipped++;
        }
      }

      logger.info('References imported', { imported, skipped, total: importData.references.length });

      return { imported, skipped };

    } catch (error) {
      logger.error('Error importing references:', error);
      throw error;
    }
  }

  // Collections and Organization
  async createCollection(userId: string, name: string, referenceIds: string[]): Promise<string> {
    const collectionId = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userCollectionKey = `${userId}_${collectionId}`;
    
    this.userCollections.set(userCollectionKey, new Set(referenceIds));

    logger.info('Collection created', {
      collectionId,
      userId,
      name,
      referenceCount: referenceIds.length
    });

    return collectionId;
  }

  async getCollection(userId: string, collectionId: string): Promise<Reference[]> {
    const userCollectionKey = `${userId}_${collectionId}`;
    const referenceIds = this.userCollections.get(userCollectionKey);
    
    if (!referenceIds) {
      return [];
    }

    const references = Array.from(referenceIds)
      .map(id => this.references.get(id))
      .filter((ref): ref is Reference => ref !== undefined);

    return references;
  }

  // Analytics and Statistics
  async getCitationStats(filter: ReferenceFilter = {}): Promise<CitationStats> {
    try {
      const references = await this.getReferences(filter);
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Count references by time period
      const referencesThisWeek = references.filter(ref => ref.savedAt >= oneWeekAgo).length;
      const referencesThisMonth = references.filter(ref => ref.savedAt >= oneMonthAgo).length;

      // Top sources
      const sourceCount = new Map<string, number>();
      references.forEach(ref => {
        sourceCount.set(ref.source, (sourceCount.get(ref.source) || 0) + 1);
      });
      const topSources = Array.from(sourceCount.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top tags
      const tagCount = new Map<string, number>();
      references.forEach(ref => {
        ref.tags.forEach(tag => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        });
      });
      const topTags = Array.from(tagCount.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      // Credibility distribution
      const credibilityDistribution = {
        high: references.filter(ref => ref.credibilityLevel === 'high').length,
        medium: references.filter(ref => ref.credibilityLevel === 'medium').length,
        low: references.filter(ref => ref.credibilityLevel === 'low').length
      };

      // Source type distribution
      const sourceTypeDistribution: Record<string, number> = {};
      references.forEach(ref => {
        sourceTypeDistribution[ref.sourceType] = (sourceTypeDistribution[ref.sourceType] || 0) + 1;
      });

      const stats: CitationStats = {
        totalReferences: references.length,
        referencesThisWeek,
        referencesThisMonth,
        topSources,
        topTags,
        credibilityDistribution,
        sourceTypeDistribution
      };

      logger.debug('Citation stats generated', {
        totalReferences: stats.totalReferences,
        referencesThisWeek: stats.referencesThisWeek,
        topSourcesCount: stats.topSources.length
      });

      return stats;

    } catch (error) {
      logger.error('Error generating citation stats:', error);
      throw error;
    }
  }

  // Search and Discovery
  async searchReferences(query: string, filter: ReferenceFilter = {}): Promise<Reference[]> {
    try {
      const references = await this.getReferences(filter);
      const queryLower = query.toLowerCase();

      const searchResults = references.filter(ref => {
        const searchableText = [
          ref.title,
          ref.snippet,
          ref.source,
          ref.notes,
          ...ref.tags
        ].join(' ').toLowerCase();

        return searchableText.includes(queryLower);
      });

      // Sort by relevance (simple text matching score)
      searchResults.sort((a, b) => {
        const aScore = this.calculateSearchScore(query, a);
        const bScore = this.calculateSearchScore(query, b);
        return bScore - aScore;
      });

      logger.debug('Reference search completed', {
        query,
        resultsFound: searchResults.length,
        totalSearched: references.length
      });

      return searchResults;

    } catch (error) {
      logger.error('Error searching references:', error);
      throw error;
    }
  }

  private calculateSearchScore(query: string, reference: Reference): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    let score = 0;

    queryWords.forEach(word => {
      // Title matches are worth more
      if (reference.title.toLowerCase().includes(word)) score += 3;
      // Tag matches are also valuable
      if (reference.tags.some(tag => tag.toLowerCase().includes(word))) score += 2;
      // Source matches
      if (reference.source.toLowerCase().includes(word)) score += 1;
      // Snippet matches
      if (reference.snippet.toLowerCase().includes(word)) score += 1;
      // Notes matches
      if (reference.notes.toLowerCase().includes(word)) score += 1;
    });

    return score;
  }

  // Cleanup and Maintenance
  async cleanupExpiredReferences(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const [id, reference] of this.references.entries()) {
        if (reference.savedAt < cutoffDate && !reference.isPublic) {
          this.references.delete(id);
          deletedCount++;
        }
      }

      logger.info('Reference cleanup completed', {
        deletedCount,
        retentionDays,
        cutoffDate
      });

      return deletedCount;

    } catch (error) {
      logger.error('Error during reference cleanup:', error);
      throw error;
    }
  }

  // Public methods for service health
  async getServiceStatus(): Promise<{
    referencesCount: number;
    formatsCount: number;
    collectionsCount: number;
    isHealthy: boolean;
  }> {
    return {
      referencesCount: this.references.size,
      formatsCount: this.citationFormats.size,
      collectionsCount: this.userCollections.size,
      isHealthy: true
    };
  }
}