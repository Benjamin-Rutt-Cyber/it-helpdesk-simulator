import { 
  ContentItem, 
  CredibilityAssessment, 
  CredibilityLevel, 
  SourceType,
  defaultCredibilityIndicators
} from '../models/ContentItem';

interface CredibilityRule {
  name: string;
  weight: number;
  evaluate: (content: ContentItem) => {
    score: number;
    indicators: Array<{ type: 'positive' | 'negative' | 'neutral'; message: string; weight: number }>;
    warnings: string[];
  };
}

export class CredibilityService {
  private rules: CredibilityRule[] = [];

  constructor() {
    this.initializeRules();
  }

  async assessCredibility(content: ContentItem): Promise<CredibilityAssessment> {
    const assessmentResults = this.rules.map(rule => ({
      rule: rule.name,
      weight: rule.weight,
      ...rule.evaluate(content)
    }));

    // Calculate weighted score
    let totalScore = 0;
    let totalWeight = 0;
    const allIndicators: Array<{ type: 'positive' | 'negative' | 'neutral'; message: string; weight: number }> = [];
    const allWarnings: string[] = [];

    assessmentResults.forEach(result => {
      totalScore += result.score * result.weight;
      totalWeight += result.weight;
      allIndicators.push(...result.indicators);
      allWarnings.push(...result.warnings);
    });

    const finalScore = Math.max(0, Math.min(100, totalWeight > 0 ? totalScore / totalWeight : 0));
    const credibilityLevel = this.determineCredibilityLevel(finalScore);

    // Add source-based indicators and warnings
    const sourceInfo = defaultCredibilityIndicators[content.source.type];
    const sourceIndicators = sourceInfo.indicators.map(indicator => ({
      type: 'positive' as const,
      message: indicator,
      weight: 5
    }));
    
    allIndicators.push(...sourceIndicators);
    allWarnings.push(...sourceInfo.warnings);

    return {
      contentId: content.id,
      level: credibilityLevel,
      score: Math.round(finalScore),
      indicators: allIndicators,
      warnings: Array.from(new Set(allWarnings)), // Remove duplicates
      recommendations: this.generateRecommendations(content, finalScore, allWarnings),
      assessedAt: new Date(),
      assessedBy: 'CredibilityService',
      methodology: 'Automated multi-factor assessment'
    };
  }

  async batchAssessCredibility(contents: ContentItem[]): Promise<CredibilityAssessment[]> {
    return Promise.all(contents.map(content => this.assessCredibility(content)));
  }

  async getCredibilityExplanation(level: CredibilityLevel): Promise<string> {
    const explanations = {
      official: 'Official sources are authoritative documents from verified organizations, government agencies, or software vendors. They represent the most reliable and up-to-date information available.',
      community: 'Community sources include peer-reviewed forums, professional networks, and collaborative platforms. While generally reliable, information should be cross-referenced with official sources.',
      questionable: 'Questionable sources may contain outdated, biased, or unverified information. Use caution and verify information through multiple reliable sources before implementation.',
      unknown: 'Unknown sources have not been properly evaluated for credibility. Additional verification is strongly recommended before trusting the information.'
    };

    return explanations[level];
  }

  private initializeRules(): void {
    this.rules = [
      {
        name: 'Source Type Assessment',
        weight: 25,
        evaluate: (content) => {
          const sourceInfo = defaultCredibilityIndicators[content.source.type];
          return {
            score: sourceInfo.score,
            indicators: sourceInfo.indicators.map(indicator => ({
              type: 'positive' as const,
              message: indicator,
              weight: 5
            })),
            warnings: sourceInfo.warnings
          };
        }
      },

      {
        name: 'Content Freshness',
        weight: 15,
        evaluate: (content) => {
          const publishDate = content.metadata.publishDate || content.system.createdAt;
          const lastModified = content.metadata.lastModified || content.system.updatedAt;
          const now = new Date();
          
          const daysSincePublished = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysSinceModified = Math.floor((now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24));

          let score = 100;
          const indicators = [];
          const warnings = [];

          // Penalize very old content
          if (daysSincePublished > 1825) { // 5 years
            score -= 40;
            warnings.push('Content is more than 5 years old and may be outdated');
          } else if (daysSincePublished > 730) { // 2 years
            score -= 20;
            warnings.push('Content is more than 2 years old - verify current relevance');
          } else if (daysSincePublished > 365) { // 1 year
            score -= 10;
            indicators.push({ type: 'neutral' as const, message: 'Content is over 1 year old', weight: 2 });
          } else {
            indicators.push({ type: 'positive' as const, message: 'Recently published content', weight: 3 });
          }

          // Bonus for recent updates
          if (daysSinceModified < 90) {
            score += 10;
            indicators.push({ type: 'positive' as const, message: 'Recently updated', weight: 3 });
          }

          return { score: Math.max(0, score), indicators, warnings };
        }
      },

      {
        name: 'Author Credibility',
        weight: 15,
        evaluate: (content) => {
          const indicators = [];
          const warnings = [];
          let score = 50; // Default neutral score

          if (content.metadata.author) {
            if (content.metadata.author.includes('Microsoft') || 
                content.metadata.author.includes('Corporation') ||
                content.metadata.author.includes('Official')) {
              score += 30;
              indicators.push({ type: 'positive' as const, message: 'Authoritative author', weight: 4 });
            } else if (content.metadata.author.includes('Community') ||
                      content.metadata.author.includes('Contributors')) {
              score += 15;
              indicators.push({ type: 'positive' as const, message: 'Community-verified author', weight: 3 });
            } else if (content.metadata.author.includes('Anonymous') ||
                      content.metadata.author === 'Unknown') {
              score -= 20;
              warnings.push('Anonymous or unknown author');
            } else {
              indicators.push({ type: 'neutral' as const, message: 'Individual author', weight: 2 });
            }
          } else {
            score -= 10;
            warnings.push('No author information provided');
          }

          return { score, indicators, warnings };
        }
      },

      {
        name: 'Content Quality Indicators',
        weight: 20,
        evaluate: (content) => {
          const indicators = [];
          const warnings = [];
          let score = 50;

          // Check content length and structure
          const wordCount = content.metadata.wordCount || content.content.split(/\s+/).length;
          if (wordCount > 500) {
            score += 15;
            indicators.push({ type: 'positive' as const, message: 'Comprehensive content', weight: 3 });
          } else if (wordCount < 100) {
            score -= 15;
            warnings.push('Very brief content - may lack detail');
          }

          // Check for structured content
          if (content.content.includes('##') || content.content.includes('###')) {
            score += 10;
            indicators.push({ type: 'positive' as const, message: 'Well-structured content', weight: 2 });
          }

          // Check for references or citations
          if (content.content.includes('http') || content.content.includes('reference') || 
              content.content.includes('source')) {
            score += 10;
            indicators.push({ type: 'positive' as const, message: 'Contains references', weight: 3 });
          }

          // Check for step-by-step instructions
          if (content.content.includes('1.') || content.content.includes('Step ')) {
            score += 10;
            indicators.push({ type: 'positive' as const, message: 'Clear instructions provided', weight: 3 });
          }

          return { score, indicators, warnings };
        }
      },

      {
        name: 'Red Herring Detection',
        weight: 30,
        evaluate: (content) => {
          const indicators = [];
          const warnings = [];
          let score = 100;

          if (content.educational.isRedHerring) {
            score = 10; // Very low score for red herrings
            warnings.push('This content contains intentionally misleading information');
            
            switch (content.educational.redHerringType) {
              case 'outdated':
                warnings.push('Contains outdated information that may no longer be applicable');
                break;
              case 'incorrect':
                warnings.push('Contains incorrect or dangerous advice');
                break;
              case 'misleading':
                warnings.push('Information is technically correct but misleading in context');
                break;
              case 'irrelevant':
                warnings.push('Information is not relevant to the current problem');
                break;
              case 'overly-complex':
                warnings.push('Unnecessarily complex solution when simpler alternatives exist');
                break;
            }
          } else {
            indicators.push({ type: 'positive' as const, message: 'Verified accurate information', weight: 5 });
          }

          return { score, indicators, warnings };
        }
      },

      {
        name: 'Domain Reputation',
        weight: 10,
        evaluate: (content) => {
          const indicators = [];
          const warnings = [];
          let score = 50;

          const domain = content.source.domain.toLowerCase();
          
          // Trusted domains
          const trustedDomains = [
            'microsoft.com', 'docs.microsoft.com', 'support.microsoft.com',
            'apple.com', 'support.apple.com',
            'google.com', 'support.google.com',
            'stackoverflow.com', 'serverfault.com', 'superuser.com',
            'technet.microsoft.com', 'github.com'
          ];

          // Questionable domains
          const questionableDomains = [
            'suspicious-speedtips.net', 'hackthissite.com', 'downloadnow.com',
            'freeware-download.com', 'softpedia.com'
          ];

          if (trustedDomains.some(trusted => domain.includes(trusted))) {
            score += 30;
            indicators.push({ type: 'positive' as const, message: 'Trusted domain', weight: 4 });
          } else if (questionableDomains.some(questionable => domain.includes(questionable))) {
            score -= 30;
            warnings.push('Domain has questionable reputation');
          } else if (domain.includes('.archive.') || domain.includes('oldtech')) {
            score -= 15;
            warnings.push('Archive or legacy domain - content may be outdated');
          }

          return { score, indicators, warnings };
        }
      },

      {
        name: 'URL Structure Analysis',
        weight: 5,
        evaluate: (content) => {
          const indicators = [];
          const warnings = [];
          let score = 50;

          const url = content.url.toLowerCase();

          // Good URL indicators
          if (url.includes('/docs/') || url.includes('/documentation/')) {
            score += 20;
            indicators.push({ type: 'positive' as const, message: 'Documentation URL structure', weight: 2 });
          }

          if (url.includes('/support/') || url.includes('/help/')) {
            score += 15;
            indicators.push({ type: 'positive' as const, message: 'Official support URL', weight: 2 });
          }

          // Suspicious URL indicators
          if (url.includes('download') && url.includes('free')) {
            score -= 20;
            warnings.push('URL suggests potentially suspicious download content');
          }

          if (url.match(/\d{4,}/)) { // Long numbers in URL
            score -= 10;
            warnings.push('URL contains unusual number sequences');
          }

          return { score, indicators, warnings };
        }
      }
    ];
  }

  private determineCredibilityLevel(score: number): CredibilityLevel {
    if (score >= 80) return 'official';
    if (score >= 60) return 'community';
    if (score >= 30) return 'questionable';
    return 'questionable';
  }

  private generateRecommendations(content: ContentItem, score: number, warnings: string[]): string[] {
    const recommendations = [];

    if (score < 50) {
      recommendations.push('Verify this information with multiple reliable sources before implementation');
      recommendations.push('Look for more recent and authoritative sources on this topic');
    }

    if (score < 30) {
      recommendations.push('Exercise extreme caution - this source may contain harmful information');
      recommendations.push('Consult official documentation or trusted IT professionals');
    }

    if (warnings.some(w => w.includes('outdated'))) {
      recommendations.push('Check for updated versions of this information');
      recommendations.push('Verify current applicability before following these instructions');
    }

    if (content.educational.isRedHerring) {
      recommendations.push('This content is flagged as educational material - not for production use');
      recommendations.push('Use this content to practice information evaluation skills');
    }

    if (content.source.type === 'community-forum') {
      recommendations.push('Cross-reference community solutions with official documentation');
      recommendations.push('Test solutions in a safe environment before production implementation');
    }

    if (score >= 80) {
      recommendations.push('This is a highly reliable source suitable for production use');
      recommendations.push('Bookmark this resource for future reference');
    }

    return recommendations;
  }

  async getCredibilityStats(): Promise<{
    totalAssessments: number;
    averageScore: number;
    distributionByLevel: Record<CredibilityLevel, number>;
    commonWarnings: Array<{ warning: string; count: number }>;
  }> {
    // This would normally query a database
    // For now, return mock statistics
    return {
      totalAssessments: 1247,
      averageScore: 67.3,
      distributionByLevel: {
        official: 23,
        community: 45,
        questionable: 28,
        unknown: 4
      },
      commonWarnings: [
        { warning: 'Content is more than 2 years old', count: 156 },
        { warning: 'Anonymous or unknown author', count: 89 },
        { warning: 'May require verification', count: 234 },
        { warning: 'Contains outdated information', count: 67 }
      ]
    };
  }
}