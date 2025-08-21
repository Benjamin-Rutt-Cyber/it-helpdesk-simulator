import { logger } from '../utils/logger';

export interface ClickEvent {
  id: string;
  userId: string;
  sessionId?: string;
  searchId: string;
  resultId: string;
  resultPosition: number;
  timestamp: Date;
  clickSequence: number;
  timeSinceSearch: number; // ms since search started
  timeToClick: number; // ms from seeing result to clicking
  pageUrl: string;
  credibilityScore: number;
  sourceType: string;
  relevanceScore: number;
}

export interface PageVisit {
  id: string;
  userId: string;
  sessionId?: string;
  clickEventId: string;
  pageUrl: string;
  entryTime: Date;
  exitTime?: Date;
  duration?: number; // milliseconds
  scrollDepth: number; // percentage
  interactionEvents: InteractionEvent[];
  exitType: 'back' | 'close' | 'new_search' | 'timeout' | 'unknown';
  contentEffectiveness?: number; // 0-1 based on time vs quality
}

export interface InteractionEvent {
  type: 'scroll' | 'click' | 'hover' | 'focus' | 'copy' | 'search_refinement';
  timestamp: Date;
  data: any;
  elementId?: string;
  coordinates?: { x: number; y: number };
}

export interface SearchQuery {
  id: string;
  userId: string;
  sessionId?: string;
  query: string;
  keywords: string[];
  timestamp: Date;
  resultCount: number;
  refinementLevel: number; // 0 for original, 1+ for refinements
  parentQueryId?: string; // For tracking refinements
  queryLength: number;
  queryComplexity: 'simple' | 'moderate' | 'complex';
  queryType: 'broad' | 'specific' | 'technical' | 'troubleshooting';
  intentAnalysis: {
    primaryIntent: 'informational' | 'navigational' | 'transactional' | 'investigational';
    confidence: number;
  };
}

export interface QueryRefinement {
  id: string;
  userId: string;
  sessionId?: string;
  originalQueryId: string;
  refinedQueryId: string;
  refinementType: 'add_keywords' | 'remove_keywords' | 'replace_keywords' | 'rephrase' | 'specify' | 'broaden';
  keywordsAdded: string[];
  keywordsRemoved: string[];
  keywordsChanged: Array<{ from: string; to: string }>;
  timeBetweenQueries: number; // milliseconds
  improvementScore: number; // 0-1, based on result quality improvement
  timestamp: Date;
}

export interface SearchPattern {
  userId: string;
  sessionId?: string;
  searchSequence: SearchQuery[];
  totalSearches: number;
  totalRefinements: number;
  averageRefinementTime: number;
  searchStrategy: 'systematic' | 'random' | 'iterative' | 'broad_to_specific' | 'specific_to_broad';
  keywordEvolution: KeywordEvolution;
  effectivenessScore: number; // 0-1 based on successful results
  searchComplexityProgression: 'increasing' | 'decreasing' | 'stable' | 'mixed';
  terminologyUsage: 'technical' | 'common' | 'mixed';
}

export interface KeywordEvolution {
  initialKeywords: string[];
  finalKeywords: string[];
  keywordAdditions: string[];
  keywordRemovals: string[];
  keywordReplacements: Array<{ from: string; to: string }>;
  keywordEffectiveness: Record<string, {
    usageCount: number;
    successRate: number; // Based on clicks on results containing this keyword
    avgPosition: number; // Average position of clicked results with this keyword
  }>;
}

export interface SearchAnalytics {
  totalQueries: number;
  averageQueryLength: number;
  refinementRate: number;
  queryComplexityDistribution: Record<string, number>;
  queryTypeDistribution: Record<string, number>;
  intentDistribution: Record<string, number>;
  keywordEffectiveness: Record<string, {
    frequency: number;
    successRate: number;
    avgResultPosition: number;
  }>;
  searchStrategyDistribution: Record<string, number>;
  averageRefinementTime: number;
  terminologyEvolution: {
    technicalTermIncrease: number;
    specificityIncrease: number;
    vocabularyExpansion: number;
  };
}

export interface SourceSelection {
  id: string;
  userId: string;
  sessionId?: string;
  searchId: string;
  resultId: string;
  sourceMetadata: {
    url: string;
    title: string;
    domain: string;
    sourceType: 'official' | 'documentation' | 'forum' | 'blog' | 'news' | 'wiki' | 'tutorial' | 'video' | 'unknown';
    authorityLevel: 'high' | 'medium' | 'low' | 'unknown';
    publicationDate?: Date;
    lastUpdated?: Date;
  };
  credibilityScore: number;
  relevanceScore: number;
  qualityScore: number;
  selectionReason: 'top_result' | 'credible_source' | 'relevant_content' | 'familiar_site' | 'comprehensive' | 'recent' | 'random';
  timeToSelect: number; // milliseconds from result display to click
  positionInResults: number;
  competitorAnalysis: {
    betterOptionsAvailable: boolean;
    higherCredibilityIgnored: number; // count of higher credibility sources in same results
    moreRelevantIgnored: number; // count of more relevant sources ignored
  };
  timestamp: Date;
}

export interface SourceQualityAssessment {
  sourceId: string;
  userId: string;
  sessionId?: string;
  assessmentType: 'automatic' | 'manual' | 'behavioral';
  qualityMetrics: {
    credibilityScore: number; // 0-100
    relevanceScore: number; // 0-100
    accuracyScore: number; // 0-100 (based on fact-checking if available)
    completenessScore: number; // 0-100
    recencyScore: number; // 0-100 (based on content age)
    authorityScore: number; // 0-100 (based on source authority)
  };
  penaltyFactors: {
    lowCredibility: number;
    irrelevantContent: number;
    outdatedInformation: number;
    biasedContent: number;
    unverifiedClaims: number;
  };
  behavioralIndicators: {
    timeSpentReading: number;
    scrollDepth: number;
    copyActions: number;
    returnVisits: number;
    shareActions: number;
  };
  overallScore: number; // Calculated from all factors
  timestamp: Date;
}

export interface SourceSelectionPattern {
  userId: string;
  sessionId?: string;
  searchId: string;
  selectionSequence: SourceSelection[];
  patterns: {
    credibilityPreference: {
      averageCredibilityScore: number;
      highCredibilityRate: number; // % selections above 80
      mediumCredibilityRate: number; // % selections 60-80
      lowCredibilityRate: number; // % selections below 60
    };
    sourceTypePreference: Record<string, {
      selectionCount: number;
      successRate: number;
      averageTimeSpent: number;
    }>;
    positionBias: {
      topThreeRate: number; // % selections from top 3 results
      averagePosition: number;
      positionDistribution: Record<string, number>;
    };
    qualityDiscernment: {
      correctHighQualitySelections: number;
      missedHighQualityOpportunities: number;
      incorrectLowQualitySelections: number;
      discernmentScore: number; // 0-1 based on quality of selections
    };
  };
  improvementOpportunities: {
    credibilityAwareness: boolean;
    sourceTypeEducation: boolean;
    positionBiasReduction: boolean;
    qualityAssessmentSkills: boolean;
  };
}

export interface SourceSelectionAnalytics {
  totalSelections: number;
  averageCredibilityScore: number;
  averageRelevanceScore: number;
  averageQualityScore: number;
  sourceTypeDistribution: Record<string, {
    count: number;
    percentage: number;
    averageQuality: number;
  }>;
  credibilityDistribution: {
    high: number; // >80
    medium: number; // 60-80
    low: number; // <60
  };
  positionAnalysis: {
    averagePosition: number;
    topThreeSelectionRate: number;
    positionDistribution: Record<number, number>;
  };
  qualityAssessmentAccuracy: {
    correctHighQualitySelections: number;
    missedOpportunities: number;
    poorQualitySelections: number;
    overallAccuracy: number;
  };
  penaltyAnalysis: {
    totalPenalties: number;
    penaltyTypes: Record<string, number>;
    averagePenaltyPerSelection: number;
  };
  improvementMetrics: {
    credibilityTrend: 'improving' | 'declining' | 'stable';
    qualityTrend: 'improving' | 'declining' | 'stable';
    diversificationTrend: 'improving' | 'declining' | 'stable';
    learningVelocity: number; // Rate of improvement over time
  };
}

export interface ResearchSession {
  id: string;
  userId: string;
  sessionId?: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number; // milliseconds
  sessionGoal?: string; // What the user was trying to accomplish
  solutionFound: boolean;
  solutionQuality: number; // 0-100 based on source quality and completeness
  researchPhases: ResearchPhase[];
  efficiency: ResearchEfficiencyMetrics;
  completed: boolean;
}

export interface ResearchPhase {
  id: string;
  sessionId: string;
  phaseType: 'exploration' | 'focused_search' | 'validation' | 'synthesis' | 'conclusion';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  searchQueries: string[];
  sourcesConsulted: string[];
  sourceSelections: string[];
  qualityScore: number;
  effectiveness: number; // How well this phase contributed to the solution
}

export interface ResearchEfficiencyMetrics {
  sessionId: string;
  userId: string;
  timeToSolution: number; // milliseconds from start to solution
  timeToFirstQualitySource: number; // milliseconds to first high-quality source
  searchToClickRatio: number; // searches / clicks (lower is better)
  sourceConsultationCount: number;
  uniqueSourcesCount: number;
  redundantSourcesCount: number;
  sourceQualityDistribution: {
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
  };
  pathEfficiency: {
    directPath: boolean; // Found solution without many detours
    searchRefinements: number;
    backtrackingInstances: number; // Times user went back to previous sources
    optimalPathDeviation: number; // How far from optimal path (0-1)
  };
  researchStrategy: {
    strategyType: 'systematic' | 'exploratory' | 'random' | 'focused' | 'hybrid';
    consistencyScore: number; // How consistent the strategy was
    adaptability: number; // How well strategy adapted based on results
  };
  speedMetrics: {
    averageSearchTime: number; // Time between searches
    averageDecisionTime: number; // Time to select a source
    averageReadingTime: number; // Time spent on each source
    taskCompletionSpeed: 'fast' | 'normal' | 'slow';
  };
  qualityVsSpeed: {
    qualityTradeoffScore: number; // How well balanced quality vs speed
    rushingIndicators: number; // Signs of rushing (quick decisions, low engagement)
    overthinkingIndicators: number; // Signs of overthinking (too much time on decisions)
  };
  overallEfficiencyScore: number; // 0-100 composite score
}

export interface SourceConsultation {
  id: string;
  userId: string;
  sessionId?: string;
  sourceId: string;
  sourceUrl: string;
  sourceType: string;
  consultationStartTime: Date;
  consultationEndTime?: Date;
  consultationDuration?: number;
  consultationDepth: 'surface' | 'moderate' | 'deep';
  informationExtracted: boolean;
  relevanceToGoal: number; // 0-100
  contributionToSolution: number; // 0-100
  consultationReason: 'initial_search' | 'follow_up' | 'verification' | 'comparison' | 'alternative_perspective';
  exitReason: 'found_answer' | 'not_relevant' | 'insufficient_detail' | 'moved_to_better_source' | 'completed_task';
}

export interface ResearchPathAnalysis {
  sessionId: string;
  userId: string;
  pathSteps: PathStep[];
  pathEfficiencyScore: number;
  optimalPath: OptimalPathSuggestion;
  inefficiencies: PathInefficiency[];
  learningOpportunities: string[];
}

export interface PathStep {
  stepNumber: number;
  timestamp: Date;
  action: 'search' | 'click' | 'read' | 'refine' | 'validate' | 'synthesize';
  details: {
    query?: string;
    sourceUrl?: string;
    timeSpent?: number;
    outcome: 'productive' | 'neutral' | 'wasteful';
  };
  efficiencyRating: number; // 0-100
}

export interface OptimalPathSuggestion {
  estimatedOptimalSteps: number;
  actualSteps: number;
  efficiencyGap: number;
  suggestedImprovements: string[];
  alternativeStrategy: string;
}

export interface PathInefficiency {
  type: 'redundant_search' | 'low_quality_source' | 'excessive_refinement' | 'backtracking' | 'poor_source_selection';
  description: string;
  timeWasted: number; // milliseconds
  improvement: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ResearchSpeedOptimization {
  userId: string;
  currentPerformance: {
    averageTimeToSolution: number;
    averageSourcesConsulted: number;
    averageSearchRefinements: number;
  };
  benchmarks: {
    expertLevel: ResearchSpeedBenchmark;
    peerAverage: ResearchSpeedBenchmark;
    personalBest: ResearchSpeedBenchmark;
  };
  optimizationRecommendations: SpeedOptimizationRecommendation[];
  practiceExercises: string[];
}

export interface ResearchSpeedBenchmark {
  timeToSolution: number;
  sourcesConsulted: number;
  searchRefinements: number;
  qualityMaintained: number; // Quality score maintained at this speed
}

export interface SpeedOptimizationRecommendation {
  area: 'search_strategy' | 'source_selection' | 'reading_efficiency' | 'decision_making' | 'tool_usage';
  currentScore: number;
  targetScore: number;
  timeImpact: number; // Estimated time savings in milliseconds
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ClickPattern {
  userId: string;
  sessionId?: string;
  searchId: string;
  totalClicks: number;
  clickSequence: ClickEvent[];
  averageTimeToClick: number;
  clickDepthPattern: number[]; // positions of clicks
  credibilityPreference: 'high' | 'medium' | 'low' | 'mixed';
  sourceTypePreference: string[];
  backButtonUsage: number;
  refinementCount: number;
}

export interface ClickAnalytics {
  clickThroughRate: number;
  averageClickPosition: number;
  credibilityDistribution: Record<string, number>;
  sourceTypeDistribution: Record<string, number>;
  timeToClickDistribution: {
    fast: number; // < 3 seconds
    medium: number; // 3-10 seconds
    slow: number; // > 10 seconds
  };
  clickDepthAnalysis: {
    firstPageOnly: number;
    beyondFirstPage: number;
    averageDepth: number;
  };
  backButtonRate: number;
  refinementRate: number;
}

export interface BehavioralPattern {
  id: string;
  userId: string;
  patternType: 'search_strategy' | 'source_selection' | 'navigation' | 'engagement' | 'efficiency' | 'quality_assessment';
  patternName: string;
  description: string;
  frequency: number; // How often this pattern occurs (0-1)
  effectiveness: number; // How effective this pattern is (0-100)
  confidence: number; // Confidence in pattern detection (0-1)
  examples: PatternExample[];
  identifiedAt: Date;
  lastSeen: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PatternExample {
  sessionId: string;
  timestamp: Date;
  context: string;
  metrics: Record<string, number>;
}

export interface CommonMistake {
  id: string;
  mistakeType: 'poor_source_selection' | 'excessive_refinement' | 'position_bias' | 'insufficient_verification' | 'time_wasting' | 'scope_creep';
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number; // How often user makes this mistake
  impact: {
    timeWasted: number; // milliseconds
    qualityReduction: number; // 0-100
    efficiencyLoss: number; // 0-100
  };
  detectionCriteria: {
    triggers: string[];
    thresholds: Record<string, number>;
  };
  recommendations: string[];
  examples: MistakeExample[];
  firstDetected: Date;
  lastOccurrence: Date;
  trend: 'improving' | 'worsening' | 'stable';
}

export interface MistakeExample {
  sessionId: string;
  timestamp: Date;
  description: string;
  metrics: Record<string, number>;
  alternativeSuggestion: string;
}

export interface EffectiveStrategy {
  id: string;
  strategyType: 'search_refinement' | 'source_evaluation' | 'information_synthesis' | 'verification' | 'time_management';
  name: string;
  description: string;
  effectiveness: number; // 0-100
  applicability: string[]; // Contexts where this strategy works well
  requirements: {
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    timeInvestment: number; // milliseconds
    complexityLevel: 'low' | 'medium' | 'high';
  };
  metrics: {
    averageTimeToSolution: number;
    successRate: number;
    qualityScore: number;
    userSatisfaction: number;
  };
  implementation: {
    steps: string[];
    tips: string[];
    commonPitfalls: string[];
  };
  usageFrequency: number;
  lastUsed: Date;
}

export interface BehavioralTrend {
  userId: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  trendType: 'improvement' | 'decline' | 'plateau' | 'fluctuation';
  metrics: {
    searchEfficiency: TrendMetric;
    sourceQuality: TrendMetric;
    timeManagement: TrendMetric;
    strategicThinking: TrendMetric;
    learningVelocity: TrendMetric;
  };
  significantEvents: SignificantEvent[];
  predictions: TrendPrediction[];
  recommendations: string[];
}

export interface TrendMetric {
  startValue: number;
  endValue: number;
  changePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number; // 0-1, how much the metric fluctuates
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
}

export interface SignificantEvent {
  timestamp: Date;
  eventType: 'breakthrough' | 'regression' | 'plateau_break' | 'learning_spike';
  description: string;
  impact: number; // -100 to 100
  relatedMetrics: string[];
}

export interface TrendPrediction {
  metric: string;
  predictedValue: number;
  timeframe: number; // days ahead
  confidence: number; // 0-1
  factors: string[];
}

export interface PatternComparison {
  userId: string;
  comparisonType: 'peer_average' | 'expert_benchmark' | 'personal_best' | 'industry_standard';
  metrics: {
    searchStrategy: ComparisonMetric;
    sourceSelection: ComparisonMetric;
    efficiencyMetrics: ComparisonMetric;
    qualityAssessment: ComparisonMetric;
    learningRate: ComparisonMetric;
  };
  overallRanking: {
    percentile: number;
    category: 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';
    strengthAreas: string[];
    improvementAreas: string[];
  };
  benchmarkData: {
    sampleSize: number;
    lastUpdated: Date;
    dataSource: string;
  };
}

export interface ComparisonMetric {
  userScore: number;
  benchmarkScore: number;
  percentilRank: number;
  gap: number; // positive means above benchmark
  trend: 'improving' | 'declining' | 'stable';
  actionableInsights: string[];
}

export interface BehavioralAnalyticsEngine {
  userId: string;
  analysisDate: Date;
  patterns: BehavioralPattern[];
  mistakes: CommonMistake[];
  strategies: EffectiveStrategy[];
  trends: BehavioralTrend;
  comparisons: PatternComparison;
  insights: {
    keyFindings: string[];
    recommendations: string[];
    learningOpportunities: string[];
    riskFactors: string[];
  };
  confidence: {
    overall: number;
    dataQuality: number;
    sampleSize: number;
    timespan: number; // days of data analyzed
  };
}

export class ResearchTracker {
  private clickEvents: Map<string, ClickEvent[]> = new Map();
  private pageVisits: Map<string, PageVisit[]> = new Map();
  private activeVisits: Map<string, PageVisit> = new Map(); // sessionId -> active visit
  private clickPatterns: Map<string, ClickPattern[]> = new Map();
  private searchQueries: Map<string, SearchQuery[]> = new Map(); // userId -> queries
  private queryRefinements: Map<string, QueryRefinement[]> = new Map(); // userId -> refinements
  private searchPatterns: Map<string, SearchPattern[]> = new Map(); // userId -> patterns
  private sourceSelections: Map<string, SourceSelection[]> = new Map(); // userId -> selections
  private sourceQualityAssessments: Map<string, SourceQualityAssessment[]> = new Map(); // userId -> assessments
  private sourceSelectionPatterns: Map<string, SourceSelectionPattern[]> = new Map(); // userId -> selection patterns
  private researchSessions: Map<string, ResearchSession[]> = new Map(); // userId -> sessions
  private activeResearchSessions: Map<string, ResearchSession> = new Map(); // sessionId -> active session
  private sourceConsultations: Map<string, SourceConsultation[]> = new Map(); // userId -> consultations
  private researchPathAnalyses: Map<string, ResearchPathAnalysis[]> = new Map(); // userId -> path analyses
  private researchSpeedOptimizations: Map<string, ResearchSpeedOptimization> = new Map(); // userId -> optimization data
  private behavioralPatterns: Map<string, BehavioralPattern[]> = new Map(); // userId -> patterns
  private commonMistakes: Map<string, CommonMistake[]> = new Map(); // userId -> mistakes
  private effectiveStrategies: Map<string, EffectiveStrategy[]> = new Map(); // userId -> strategies
  private behavioralTrends: Map<string, BehavioralTrend[]> = new Map(); // userId -> trends
  private patternComparisons: Map<string, PatternComparison[]> = new Map(); // userId -> comparisons
  private behavioralAnalytics: Map<string, BehavioralAnalyticsEngine> = new Map(); // userId -> analytics

  /**
   * Track a click event on a search result
   */
  async trackClick(data: {
    userId: string;
    sessionId?: string;
    searchId: string;
    resultId: string;
    resultPosition: number;
    clickSequence: number;
    timeSinceSearch: number;
    pageUrl: string;
    credibilityScore: number;
    sourceType: string;
    relevanceScore: number;
  }): Promise<ClickEvent> {
    try {
      // Validate required fields
      if (!data.userId || !data.searchId || !data.resultId) {
        throw new Error('Missing required fields: userId, searchId, resultId');
      }
      const clickEvent: ClickEvent = {
        id: `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        timeToClick: Date.now() % 10000, // Mock time to click
        ...data,
      };

      // Store click event
      const userClicks = this.clickEvents.get(data.userId) || [];
      userClicks.push(clickEvent);
      this.clickEvents.set(data.userId, userClicks);

      // Update click pattern for this search
      await this.updateClickPattern(clickEvent);

      logger.info('Click tracked', { 
        userId: data.userId, 
        resultId: data.resultId,
        position: data.resultPosition,
        credibilityScore: data.credibilityScore 
      });

      return clickEvent;
    } catch (error) {
      logger.error('Failed to track click', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * Start tracking a page visit
   */
  async startPageVisit(data: {
    userId: string;
    sessionId?: string;
    clickEventId: string;
    pageUrl: string;
  }): Promise<PageVisit> {
    try {
      const pageVisit: PageVisit = {
        id: `visit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entryTime: new Date(),
        scrollDepth: 0,
        interactionEvents: [],
        exitType: 'unknown',
        ...data,
      };

      // Store page visit
      const userVisits = this.pageVisits.get(data.userId) || [];
      userVisits.push(pageVisit);
      this.pageVisits.set(data.userId, userVisits);

      // Track as active visit
      if (data.sessionId) {
        this.activeVisits.set(data.sessionId, pageVisit);
      }

      logger.info('Page visit started', { 
        userId: data.userId, 
        pageUrl: data.pageUrl 
      });

      return pageVisit;
    } catch (error) {
      logger.error('Failed to start page visit tracking', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * End tracking a page visit
   */
  async endPageVisit(data: {
    userId: string;
    sessionId?: string;
    visitId?: string;
    exitType: PageVisit['exitType'];
    finalScrollDepth: number;
  }): Promise<PageVisit | null> {
    try {
      let visit: PageVisit | undefined;

      if (data.visitId) {
        // Find visit by ID
        const userVisits = this.pageVisits.get(data.userId) || [];
        visit = userVisits.find(v => v.id === data.visitId);
      } else if (data.sessionId) {
        // Find active visit by session
        visit = this.activeVisits.get(data.sessionId);
      }

      if (!visit) {
        logger.warn('Page visit not found for ending', { userId: data.userId, visitId: data.visitId });
        return null;
      }

      // Update visit end data
      visit.exitTime = new Date();
      visit.duration = visit.exitTime.getTime() - visit.entryTime.getTime();
      visit.exitType = data.exitType;
      visit.scrollDepth = Math.max(visit.scrollDepth, data.finalScrollDepth);
      
      // Calculate content effectiveness
      visit.contentEffectiveness = this.calculateContentEffectiveness(visit);

      // Remove from active visits
      if (data.sessionId) {
        this.activeVisits.delete(data.sessionId);
      }

      logger.info('Page visit ended', { 
        userId: data.userId, 
        visitId: visit.id,
        duration: visit.duration,
        exitType: data.exitType,
        effectiveness: visit.contentEffectiveness
      });

      return visit;
    } catch (error) {
      logger.error('Failed to end page visit tracking', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * Track an interaction event within a page visit
   */
  async trackInteraction(data: {
    userId: string;
    sessionId?: string;
    visitId?: string;
    interaction: Omit<InteractionEvent, 'timestamp'>;
  }): Promise<void> {
    try {
      const interaction: InteractionEvent = {
        ...data.interaction,
        timestamp: new Date(),
      };

      let visit: PageVisit | undefined;

      if (data.visitId) {
        const userVisits = this.pageVisits.get(data.userId) || [];
        visit = userVisits.find(v => v.id === data.visitId);
      } else if (data.sessionId) {
        visit = this.activeVisits.get(data.sessionId);
      }

      if (visit) {
        visit.interactionEvents.push(interaction);
        
        // Update scroll depth if it's a scroll event
        if (interaction.type === 'scroll' && interaction.data?.scrollDepth) {
          visit.scrollDepth = Math.max(visit.scrollDepth, interaction.data.scrollDepth);
        }
      }

      logger.debug('Interaction tracked', { 
        userId: data.userId, 
        type: interaction.type,
        visitId: visit?.id 
      });
    } catch (error) {
      logger.error('Failed to track interaction', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * Get click analytics for a user
   */
  async getClickAnalytics(userId: string, timeframe?: { start: Date; end: Date }): Promise<ClickAnalytics> {
    try {
      const userClicks = this.clickEvents.get(userId) || [];
      
      // Filter by timeframe if provided
      const filteredClicks = timeframe 
        ? userClicks.filter(c => c.timestamp >= timeframe.start && c.timestamp <= timeframe.end)
        : userClicks;

      if (filteredClicks.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Calculate analytics
      const totalSearches = new Set(filteredClicks.map(c => c.searchId)).size;
      const clickThroughRate = filteredClicks.length / totalSearches;

      const averageClickPosition = filteredClicks.reduce((sum, c) => sum + c.resultPosition, 0) / filteredClicks.length;

      const credibilityDistribution = this.calculateDistribution(
        filteredClicks.map(c => this.getCredibilityLevel(c.credibilityScore))
      );

      const sourceTypeDistribution = this.calculateDistribution(
        filteredClicks.map(c => c.sourceType)
      );

      const timeToClickDistribution = {
        fast: filteredClicks.filter(c => c.timeToClick < 3000).length / filteredClicks.length,
        medium: filteredClicks.filter(c => c.timeToClick >= 3000 && c.timeToClick <= 10000).length / filteredClicks.length,
        slow: filteredClicks.filter(c => c.timeToClick > 10000).length / filteredClicks.length,
      };

      const firstPageClicks = filteredClicks.filter(c => c.resultPosition <= 10).length;
      const beyondFirstPageClicks = filteredClicks.filter(c => c.resultPosition > 10).length;
      
      const clickDepthAnalysis = {
        firstPageOnly: firstPageClicks / filteredClicks.length,
        beyondFirstPage: beyondFirstPageClicks / filteredClicks.length,
        averageDepth: averageClickPosition,
      };

      // Mock some additional metrics
      const backButtonRate = 0.25; // 25% of clicks result in back button
      const refinementRate = 0.40; // 40% of searches are refined

      return {
        clickThroughRate,
        averageClickPosition,
        credibilityDistribution,
        sourceTypeDistribution,
        timeToClickDistribution,
        clickDepthAnalysis,
        backButtonRate,
        refinementRate,
      };
    } catch (error) {
      logger.error('Failed to get click analytics', { userId, error });
      throw error;
    }
  }

  /**
   * Get click patterns for a user's searches
   */
  async getClickPatterns(userId: string, limit: number = 10): Promise<ClickPattern[]> {
    try {
      const userPatterns = this.clickPatterns.get(userId) || [];
      return userPatterns
        .sort((a, b) => b.clickSequence[0]?.timestamp.getTime() - a.clickSequence[0]?.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get click patterns', { userId, error });
      return [];
    }
  }

  /**
   * Get page visit analytics
   */
  async getPageVisitAnalytics(userId: string, timeframe?: { start: Date; end: Date }): Promise<any> {
    try {
      const userVisits = this.pageVisits.get(userId) || [];
      
      const filteredVisits = timeframe 
        ? userVisits.filter(v => v.entryTime >= timeframe.start && v.entryTime <= timeframe.end)
        : userVisits;

      if (filteredVisits.length === 0) {
        return {
          totalVisits: 0,
          averageDuration: 0,
          averageScrollDepth: 0,
          exitTypeDistribution: {},
          contentEffectiveness: 0,
        };
      }

      const completedVisits = filteredVisits.filter(v => v.duration !== undefined);
      
      const totalVisits = filteredVisits.length;
      const averageDuration = completedVisits.length > 0 
        ? completedVisits.reduce((sum, v) => sum + (v.duration || 0), 0) / completedVisits.length
        : 0;
      
      const averageScrollDepth = filteredVisits.reduce((sum, v) => sum + v.scrollDepth, 0) / totalVisits;
      
      const exitTypeDistribution = this.calculateDistribution(
        completedVisits.map(v => v.exitType)
      );

      const contentEffectiveness = filteredVisits
        .filter(v => v.contentEffectiveness !== undefined)
        .reduce((sum, v) => sum + (v.contentEffectiveness || 0), 0) / filteredVisits.length;

      return {
        totalVisits,
        averageDuration,
        averageScrollDepth,
        exitTypeDistribution,
        contentEffectiveness,
      };
    } catch (error) {
      logger.error('Failed to get page visit analytics', { userId, error });
      throw error;
    }
  }

  /**
   * Track a search query
   */
  async trackSearchQuery(data: {
    userId: string;
    sessionId?: string;
    query: string;
    resultCount: number;
    parentQueryId?: string;
  }): Promise<SearchQuery> {
    try {
      if (!data.userId || !data.query) {
        throw new Error('Missing required fields: userId, query');
      }

      const keywords = this.extractKeywords(data.query);
      const queryComplexity = this.analyzeQueryComplexity(data.query, keywords);
      const queryType = this.classifyQueryType(data.query, keywords);
      const intentAnalysis = this.analyzeQueryIntent(data.query, keywords);

      const searchQuery: SearchQuery = {
        id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        keywords,
        queryLength: data.query.length,
        queryComplexity,
        queryType,
        intentAnalysis,
        refinementLevel: data.parentQueryId ? this.calculateRefinementLevel(data.userId, data.parentQueryId) : 0,
        ...data,
      };

      const userQueries = this.searchQueries.get(data.userId) || [];
      userQueries.push(searchQuery);
      this.searchQueries.set(data.userId, userQueries);

      await this.updateSearchPattern(searchQuery);

      logger.info('Search query tracked', { 
        userId: data.userId, 
        query: data.query,
        queryType: queryType,
        complexity: queryComplexity
      });

      return searchQuery;
    } catch (error) {
      logger.error('Failed to track search query', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * Track a query refinement
   */
  async trackQueryRefinement(data: {
    userId: string;
    sessionId?: string;
    originalQueryId: string;
    refinedQueryId: string;
    timeBetweenQueries: number;
  }): Promise<QueryRefinement> {
    try {
      const userQueries = this.searchQueries.get(data.userId) || [];
      const originalQuery = userQueries.find(q => q.id === data.originalQueryId);
      const refinedQuery = userQueries.find(q => q.id === data.refinedQueryId);

      if (!originalQuery || !refinedQuery) {
        throw new Error('Original or refined query not found');
      }

      const refinementAnalysis = this.analyzeQueryRefinement(originalQuery, refinedQuery);

      const queryRefinement: QueryRefinement = {
        id: `refinement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        refinementType: refinementAnalysis.type,
        keywordsAdded: refinementAnalysis.keywordsAdded,
        keywordsRemoved: refinementAnalysis.keywordsRemoved,
        keywordsChanged: refinementAnalysis.keywordsChanged,
        improvementScore: this.calculateImprovementScore(originalQuery, refinedQuery),
        ...data,
      };

      const userRefinements = this.queryRefinements.get(data.userId) || [];
      userRefinements.push(queryRefinement);
      this.queryRefinements.set(data.userId, userRefinements);

      logger.info('Query refinement tracked', { 
        userId: data.userId, 
        refinementType: refinementAnalysis.type,
        improvementScore: queryRefinement.improvementScore
      });

      return queryRefinement;
    } catch (error) {
      logger.error('Failed to track query refinement', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * Get search analytics for a user
   */
  async getSearchAnalytics(userId: string, timeframe?: { start: Date; end: Date }): Promise<SearchAnalytics> {
    try {
      const userQueries = this.searchQueries.get(userId) || [];
      const userRefinements = this.queryRefinements.get(userId) || [];

      const filteredQueries = timeframe 
        ? userQueries.filter(q => q.timestamp >= timeframe.start && q.timestamp <= timeframe.end)
        : userQueries;

      const filteredRefinements = timeframe 
        ? userRefinements.filter(r => r.timestamp >= timeframe.start && r.timestamp <= timeframe.end)
        : userRefinements;

      if (filteredQueries.length === 0) {
        return this.getEmptySearchAnalytics();
      }

      const totalQueries = filteredQueries.length;
      const averageQueryLength = filteredQueries.reduce((sum, q) => sum + q.queryLength, 0) / totalQueries;
      const refinementRate = filteredRefinements.length / totalQueries;

      const queryComplexityDistribution = this.calculateDistribution(
        filteredQueries.map(q => q.queryComplexity)
      );

      const queryTypeDistribution = this.calculateDistribution(
        filteredQueries.map(q => q.queryType)
      );

      const intentDistribution = this.calculateDistribution(
        filteredQueries.map(q => q.intentAnalysis.primaryIntent)
      );

      const keywordEffectiveness = this.calculateKeywordEffectiveness(filteredQueries, userId);

      const searchPatterns = this.searchPatterns.get(userId) || [];
      const searchStrategyDistribution = this.calculateDistribution(
        searchPatterns.map(p => p.searchStrategy)
      );

      const averageRefinementTime = filteredRefinements.length > 0
        ? filteredRefinements.reduce((sum, r) => sum + r.timeBetweenQueries, 0) / filteredRefinements.length
        : 0;

      const terminologyEvolution = this.analyzeTerminologyEvolution(filteredQueries);

      return {
        totalQueries,
        averageQueryLength,
        refinementRate,
        queryComplexityDistribution,
        queryTypeDistribution,
        intentDistribution,
        keywordEffectiveness,
        searchStrategyDistribution,
        averageRefinementTime,
        terminologyEvolution,
      };
    } catch (error) {
      logger.error('Failed to get search analytics', { userId, error });
      throw error;
    }
  }

  /**
   * Get search patterns for a user
   */
  async getSearchPatterns(userId: string, limit: number = 10): Promise<SearchPattern[]> {
    try {
      const userPatterns = this.searchPatterns.get(userId) || [];
      return userPatterns
        .sort((a, b) => b.searchSequence[0]?.timestamp.getTime() - a.searchSequence[0]?.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get search patterns', { userId, error });
      return [];
    }
  }

  /**
   * Track a source selection
   */
  async trackSourceSelection(data: {
    userId: string;
    sessionId?: string;
    searchId: string;
    resultId: string;
    sourceMetadata: SourceSelection['sourceMetadata'];
    credibilityScore: number;
    relevanceScore: number;
    timeToSelect: number;
    positionInResults: number;
    allResultsInSearch?: Array<{
      id: string;
      credibilityScore: number;
      relevanceScore: number;
      position: number;
    }>;
  }): Promise<SourceSelection> {
    try {
      if (!data.userId || !data.searchId || !data.resultId) {
        throw new Error('Missing required fields: userId, searchId, resultId');
      }

      // Calculate quality score based on credibility and relevance
      const qualityScore = this.calculateQualityScore(data.credibilityScore, data.relevanceScore, data.sourceMetadata);

      // Analyze competitor results to determine if better options were available
      const competitorAnalysis = this.analyzeCompetitorResults(data, data.allResultsInSearch || []);

      // Determine selection reason based on timing, position, and source properties
      const selectionReason = this.determineSelectionReason(data);

      const sourceSelection: SourceSelection = {
        id: `selection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        qualityScore,
        selectionReason,
        competitorAnalysis,
        ...data,
      };

      // Store source selection
      const userSelections = this.sourceSelections.get(data.userId) || [];
      userSelections.push(sourceSelection);
      this.sourceSelections.set(data.userId, userSelections);

      // Update source selection pattern
      await this.updateSourceSelectionPattern(sourceSelection);

      logger.info('Source selection tracked', {
        userId: data.userId,
        sourceType: data.sourceMetadata.sourceType,
        credibilityScore: data.credibilityScore,
        qualityScore,
        selectionReason,
      });

      return sourceSelection;
    } catch (error) {
      logger.error('Failed to track source selection', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * Assess source quality based on behavioral indicators
   */
  async assessSourceQuality(data: {
    sourceId: string;
    userId: string;
    sessionId?: string;
    assessmentType: 'automatic' | 'manual' | 'behavioral';
    behavioralIndicators: SourceQualityAssessment['behavioralIndicators'];
    sourceMetadata?: {
      credibilityScore: number;
      relevanceScore: number;
      sourceType: string;
      authorityLevel: string;
      publicationDate?: Date;
    };
  }): Promise<SourceQualityAssessment> {
    try {
      if (!data.sourceId || !data.userId) {
        throw new Error('Missing required fields: sourceId, userId');
      }

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(data);

      // Calculate penalty factors
      const penaltyFactors = this.calculatePenaltyFactors(data);

      // Calculate overall score
      const overallScore = this.calculateOverallQualityScore(qualityMetrics, penaltyFactors, data.behavioralIndicators);

      const qualityAssessment: SourceQualityAssessment = {
        sourceId: data.sourceId,
        userId: data.userId,
        sessionId: data.sessionId,
        assessmentType: data.assessmentType,
        qualityMetrics,
        penaltyFactors,
        behavioralIndicators: data.behavioralIndicators,
        overallScore,
        timestamp: new Date(),
      };

      // Store quality assessment
      const userAssessments = this.sourceQualityAssessments.get(data.userId) || [];
      userAssessments.push(qualityAssessment);
      this.sourceQualityAssessments.set(data.userId, userAssessments);

      logger.info('Source quality assessed', {
        userId: data.userId,
        sourceId: data.sourceId,
        overallScore,
        assessmentType: data.assessmentType,
      });

      return qualityAssessment;
    } catch (error) {
      logger.error('Failed to assess source quality', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * Get source selection analytics for a user
   */
  async getSourceSelectionAnalytics(userId: string, timeframe?: { start: Date; end: Date }): Promise<SourceSelectionAnalytics> {
    try {
      const userSelections = this.sourceSelections.get(userId) || [];
      const userAssessments = this.sourceQualityAssessments.get(userId) || [];

      const filteredSelections = timeframe 
        ? userSelections.filter(s => s.timestamp >= timeframe.start && s.timestamp <= timeframe.end)
        : userSelections;

      const filteredAssessments = timeframe 
        ? userAssessments.filter(a => a.timestamp >= timeframe.start && a.timestamp <= timeframe.end)
        : userAssessments;

      if (filteredSelections.length === 0) {
        return this.getEmptySourceSelectionAnalytics();
      }

      const analytics = this.calculateSourceSelectionAnalytics(filteredSelections, filteredAssessments);

      return analytics;
    } catch (error) {
      logger.error('Failed to get source selection analytics', { userId, error });
      throw error;
    }
  }

  /**
   * Get source selection patterns for a user
   */
  async getSourceSelectionPatterns(userId: string, limit: number = 10): Promise<SourceSelectionPattern[]> {
    try {
      const userPatterns = this.sourceSelectionPatterns.get(userId) || [];
      return userPatterns
        .sort((a, b) => b.selectionSequence[0]?.timestamp.getTime() - a.selectionSequence[0]?.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get source selection patterns', { userId, error });
      return [];
    }
  }

  // Private helper methods

  private calculateQualityScore(credibilityScore: number, relevanceScore: number, sourceMetadata: SourceSelection['sourceMetadata']): number {
    // Base score from credibility and relevance
    let qualityScore = (credibilityScore * 0.6) + (relevanceScore * 0.4);

    // Adjust based on source type
    const sourceTypeBonus = {
      'official': 10,
      'documentation': 8,
      'news': 5,
      'wiki': 3,
      'tutorial': 2,
      'forum': 0,
      'blog': -2,
      'video': -1,
      'unknown': -5,
    };

    qualityScore += sourceTypeBonus[sourceMetadata.sourceType] || 0;

    // Adjust based on authority level
    const authorityBonus = {
      'high': 5,
      'medium': 2,
      'low': -3,
      'unknown': -2,
    };

    qualityScore += authorityBonus[sourceMetadata.authorityLevel] || 0;

    // Recency bonus if recently updated
    if (sourceMetadata.lastUpdated) {
      const daysSinceUpdate = (Date.now() - sourceMetadata.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) qualityScore += 3;
      else if (daysSinceUpdate < 90) qualityScore += 1;
      else if (daysSinceUpdate > 365) qualityScore -= 2;
    }

    return Math.max(0, Math.min(100, qualityScore));
  }

  private analyzeCompetitorResults(selection: any, allResults: Array<{ id: string; credibilityScore: number; relevanceScore: number; position: number }>): SourceSelection['competitorAnalysis'] {
    if (allResults.length === 0) {
      return {
        betterOptionsAvailable: false,
        higherCredibilityIgnored: 0,
        moreRelevantIgnored: 0,
      };
    }

    const higherCredibilityIgnored = allResults.filter(result => 
      result.position < selection.positionInResults && 
      result.credibilityScore > selection.credibilityScore
    ).length;

    const moreRelevantIgnored = allResults.filter(result => 
      result.position < selection.positionInResults && 
      result.relevanceScore > selection.relevanceScore
    ).length;

    const betterOptionsAvailable = higherCredibilityIgnored > 0 || moreRelevantIgnored > 0;

    return {
      betterOptionsAvailable,
      higherCredibilityIgnored,
      moreRelevantIgnored,
    };
  }

  private determineSelectionReason(data: any): SourceSelection['selectionReason'] {
    // Quick selection (< 3 seconds) and first position = top_result
    if (data.timeToSelect < 3000 && data.positionInResults === 1) {
      return 'top_result';
    }

    // High credibility score = credible_source
    if (data.credibilityScore >= 80) {
      return 'credible_source';
    }

    // High relevance score = relevant_content
    if (data.relevanceScore >= 85) {
      return 'relevant_content';
    }

    // Known domain patterns = familiar_site
    const familiarDomains = ['microsoft.com', 'apple.com', 'google.com', 'stackoverflow.com', 'github.com'];
    if (familiarDomains.some(domain => data.sourceMetadata.domain.includes(domain))) {
      return 'familiar_site';
    }

    // Long content or documentation = comprehensive
    if (data.sourceMetadata.sourceType === 'documentation' || data.sourceMetadata.sourceType === 'tutorial') {
      return 'comprehensive';
    }

    // Recent publication = recent
    if (data.sourceMetadata.lastUpdated && 
        (Date.now() - data.sourceMetadata.lastUpdated.getTime()) < (1000 * 60 * 60 * 24 * 7)) {
      return 'recent';
    }

    return 'random';
  }

  private calculateQualityMetrics(data: any): SourceQualityAssessment['qualityMetrics'] {
    const metadata = data.sourceMetadata || {};

    return {
      credibilityScore: metadata.credibilityScore || 50,
      relevanceScore: metadata.relevanceScore || 50,
      accuracyScore: this.estimateAccuracyScore(metadata),
      completenessScore: this.estimateCompletenessScore(data.behavioralIndicators),
      recencyScore: this.calculateRecencyScore(metadata.publicationDate),
      authorityScore: this.calculateAuthorityScore(metadata.authorityLevel, metadata.sourceType),
    };
  }

  private calculatePenaltyFactors(data: any): SourceQualityAssessment['penaltyFactors'] {
    const metadata = data.sourceMetadata || {};
    const behavioral = data.behavioralIndicators;

    return {
      lowCredibility: metadata.credibilityScore < 60 ? (60 - metadata.credibilityScore) / 10 : 0,
      irrelevantContent: metadata.relevanceScore < 50 ? (50 - metadata.relevanceScore) / 10 : 0,
      outdatedInformation: this.calculateOutdatedPenalty(metadata.publicationDate),
      biasedContent: this.estimateBiasPenalty(metadata.sourceType, behavioral),
      unverifiedClaims: this.estimateUnverifiedClaimsPenalty(metadata.sourceType),
    };
  }

  private calculateOverallQualityScore(
    qualityMetrics: SourceQualityAssessment['qualityMetrics'],
    penaltyFactors: SourceQualityAssessment['penaltyFactors'],
    behavioralIndicators: SourceQualityAssessment['behavioralIndicators']
  ): number {
    // Weighted average of quality metrics
    const baseScore = (
      qualityMetrics.credibilityScore * 0.25 +
      qualityMetrics.relevanceScore * 0.20 +
      qualityMetrics.accuracyScore * 0.20 +
      qualityMetrics.completenessScore * 0.15 +
      qualityMetrics.recencyScore * 0.10 +
      qualityMetrics.authorityScore * 0.10
    );

    // Apply penalties
    const totalPenalty = Object.values(penaltyFactors).reduce((sum, penalty) => sum + penalty, 0);

    // Behavioral bonus
    const engagementBonus = this.calculateEngagementBonus(behavioralIndicators);

    const finalScore = baseScore - totalPenalty + engagementBonus;

    return Math.max(0, Math.min(100, finalScore));
  }

  private estimateAccuracyScore(metadata: any): number {
    // Base accuracy estimation on source type and authority
    let score = 50;

    if (metadata.sourceType === 'official') score += 30;
    else if (metadata.sourceType === 'documentation') score += 25;
    else if (metadata.sourceType === 'news') score += 15;
    else if (metadata.sourceType === 'wiki') score += 10;
    else if (metadata.sourceType === 'forum') score -= 10;
    else if (metadata.sourceType === 'blog') score -= 15;

    if (metadata.authorityLevel === 'high') score += 15;
    else if (metadata.authorityLevel === 'medium') score += 5;
    else if (metadata.authorityLevel === 'low') score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private estimateCompletenessScore(behavioral: SourceQualityAssessment['behavioralIndicators']): number {
    // Estimate completeness based on user behavior
    let score = 50;

    // Time spent reading indicates completeness
    if (behavioral.timeSpentReading > 120000) score += 20; // 2+ minutes
    else if (behavioral.timeSpentReading > 60000) score += 10; // 1+ minute
    else if (behavioral.timeSpentReading < 15000) score -= 20; // < 15 seconds

    // Scroll depth indicates content length/completeness
    if (behavioral.scrollDepth > 80) score += 15;
    else if (behavioral.scrollDepth > 50) score += 10;
    else if (behavioral.scrollDepth < 25) score -= 15;

    // Copy actions indicate useful content
    score += Math.min(behavioral.copyActions * 5, 15);

    return Math.max(0, Math.min(100, score));
  }

  private calculateRecencyScore(publicationDate?: Date): number {
    if (!publicationDate) return 30; // Unknown date gets neutral score

    const daysSincePublication = (Date.now() - publicationDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSincePublication < 30) return 90;        // Very recent
    else if (daysSincePublication < 90) return 80;   // Recent
    else if (daysSincePublication < 180) return 70;  // Fairly recent
    else if (daysSincePublication < 365) return 60;  // Within a year
    else if (daysSincePublication < 730) return 40;  // 1-2 years old
    else if (daysSincePublication < 1825) return 20; // 2-5 years old
    else return 10; // Very old
  }

  private calculateAuthorityScore(authorityLevel: string, sourceType: string): number {
    let score = 50;

    // Authority level impact
    if (authorityLevel === 'high') score += 25;
    else if (authorityLevel === 'medium') score += 10;
    else if (authorityLevel === 'low') score -= 15;

    // Source type authority
    if (sourceType === 'official') score += 20;
    else if (sourceType === 'documentation') score += 15;
    else if (sourceType === 'news') score += 5;
    else if (sourceType === 'forum') score -= 5;
    else if (sourceType === 'blog') score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateOutdatedPenalty(publicationDate?: Date): number {
    if (!publicationDate) return 2; // Unknown date gets small penalty

    const daysSincePublication = (Date.now() - publicationDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSincePublication > 1825) return 15; // 5+ years old
    else if (daysSincePublication > 1095) return 10; // 3+ years old
    else if (daysSincePublication > 730) return 5;   // 2+ years old
    else return 0; // Recent enough
  }

  private estimateBiasPenalty(sourceType: string, behavioral: any): number {
    // Estimate bias based on source type and reading behavior
    let penalty = 0;

    if (sourceType === 'blog') penalty += 3;
    else if (sourceType === 'forum') penalty += 2;

    // Quick reading might indicate biased/click-bait content
    if (behavioral.timeSpentReading < 30000 && behavioral.scrollDepth < 50) {
      penalty += 2;
    }

    return penalty;
  }

  private estimateUnverifiedClaimsPenalty(sourceType: string): number {
    // Penalty based on likelihood of unverified claims
    if (sourceType === 'forum') return 4;
    else if (sourceType === 'blog') return 3;
    else if (sourceType === 'video') return 2;
    else if (sourceType === 'wiki') return 1;
    else return 0; // Official, documentation, news are generally verified
  }

  private calculateEngagementBonus(behavioral: SourceQualityAssessment['behavioralIndicators']): number {
    let bonus = 0;

    // Good engagement indicates quality content
    if (behavioral.timeSpentReading > 180000) bonus += 5; // 3+ minutes
    else if (behavioral.timeSpentReading > 120000) bonus += 3; // 2+ minutes

    if (behavioral.scrollDepth > 75) bonus += 3;
    bonus += Math.min(behavioral.copyActions * 2, 5);
    bonus += Math.min(behavioral.returnVisits * 3, 10);
    bonus += Math.min(behavioral.shareActions * 5, 10);

    return bonus;
  }

  private async updateSourceSelectionPattern(sourceSelection: SourceSelection): Promise<void> {
    const userPatterns = this.sourceSelectionPatterns.get(sourceSelection.userId) || [];
    
    let currentSearchPattern = userPatterns.find(p => p.searchId === sourceSelection.searchId);
    
    if (!currentSearchPattern) {
      currentSearchPattern = {
        userId: sourceSelection.userId,
        sessionId: sourceSelection.sessionId,
        searchId: sourceSelection.searchId,
        selectionSequence: [],
        patterns: {
          credibilityPreference: {
            averageCredibilityScore: 0,
            highCredibilityRate: 0,
            mediumCredibilityRate: 0,
            lowCredibilityRate: 0,
          },
          sourceTypePreference: {},
          positionBias: {
            topThreeRate: 0,
            averagePosition: 0,
            positionDistribution: {},
          },
          qualityDiscernment: {
            correctHighQualitySelections: 0,
            missedHighQualityOpportunities: 0,
            incorrectLowQualitySelections: 0,
            discernmentScore: 0,
          },
        },
        improvementOpportunities: {
          credibilityAwareness: false,
          sourceTypeEducation: false,
          positionBiasReduction: false,
          qualityAssessmentSkills: false,
        },
      };
      userPatterns.push(currentSearchPattern);
    }

    currentSearchPattern.selectionSequence.push(sourceSelection);
    this.updatePatternMetrics(currentSearchPattern);
    this.identifyImprovementOpportunities(currentSearchPattern);

    this.sourceSelectionPatterns.set(sourceSelection.userId, userPatterns);
  }

  private updatePatternMetrics(pattern: SourceSelectionPattern): void {
    const selections = pattern.selectionSequence;
    
    // Update credibility preference
    const credibilityScores = selections.map(s => s.credibilityScore);
    pattern.patterns.credibilityPreference.averageCredibilityScore = 
      credibilityScores.reduce((sum, score) => sum + score, 0) / credibilityScores.length;
    
    pattern.patterns.credibilityPreference.highCredibilityRate = 
      selections.filter(s => s.credibilityScore > 80).length / selections.length;
    
    pattern.patterns.credibilityPreference.mediumCredibilityRate = 
      selections.filter(s => s.credibilityScore >= 60 && s.credibilityScore <= 80).length / selections.length;
    
    pattern.patterns.credibilityPreference.lowCredibilityRate = 
      selections.filter(s => s.credibilityScore < 60).length / selections.length;

    // Update source type preference
    selections.forEach(selection => {
      const sourceType = selection.sourceMetadata.sourceType;
      if (!pattern.patterns.sourceTypePreference[sourceType]) {
        pattern.patterns.sourceTypePreference[sourceType] = {
          selectionCount: 0,
          successRate: 0,
          averageTimeSpent: 0,
        };
      }
      pattern.patterns.sourceTypePreference[sourceType].selectionCount++;
    });

    // Update position bias
    const positions = selections.map(s => s.positionInResults);
    pattern.patterns.positionBias.averagePosition = 
      positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    
    pattern.patterns.positionBias.topThreeRate = 
      selections.filter(s => s.positionInResults <= 3).length / selections.length;

    // Update quality discernment
    const highQualitySelections = selections.filter(s => s.qualityScore > 75).length;
    const lowQualitySelections = selections.filter(s => s.qualityScore < 40).length;
    const missedOpportunities = selections.filter(s => s.competitorAnalysis.betterOptionsAvailable).length;

    pattern.patterns.qualityDiscernment.correctHighQualitySelections = highQualitySelections;
    pattern.patterns.qualityDiscernment.incorrectLowQualitySelections = lowQualitySelections;
    pattern.patterns.qualityDiscernment.missedHighQualityOpportunities = missedOpportunities;
    
    pattern.patterns.qualityDiscernment.discernmentScore = 
      (highQualitySelections - lowQualitySelections - missedOpportunities) / selections.length;
  }

  private identifyImprovementOpportunities(pattern: SourceSelectionPattern): void {
    // Credibility awareness
    pattern.improvementOpportunities.credibilityAwareness = 
      pattern.patterns.credibilityPreference.lowCredibilityRate > 0.3;

    // Source type education
    const sourceTypeCount = Object.keys(pattern.patterns.sourceTypePreference).length;
    pattern.improvementOpportunities.sourceTypeEducation = sourceTypeCount < 3;

    // Position bias reduction
    pattern.improvementOpportunities.positionBiasReduction = 
      pattern.patterns.positionBias.topThreeRate > 0.8;

    // Quality assessment skills
    pattern.improvementOpportunities.qualityAssessmentSkills = 
      pattern.patterns.qualityDiscernment.discernmentScore < 0.2;
  }

  private calculateSourceSelectionAnalytics(
    selections: SourceSelection[], 
    assessments: SourceQualityAssessment[]
  ): SourceSelectionAnalytics {
    const totalSelections = selections.length;
    
    const averageCredibilityScore = selections.reduce((sum, s) => sum + s.credibilityScore, 0) / totalSelections;
    const averageRelevanceScore = selections.reduce((sum, s) => sum + s.relevanceScore, 0) / totalSelections;
    const averageQualityScore = selections.reduce((sum, s) => sum + s.qualityScore, 0) / totalSelections;

    // Source type distribution
    const sourceTypeDistribution: Record<string, { count: number; percentage: number; averageQuality: number }> = {};
    selections.forEach(selection => {
      const sourceType = selection.sourceMetadata.sourceType;
      if (!sourceTypeDistribution[sourceType]) {
        sourceTypeDistribution[sourceType] = { count: 0, percentage: 0, averageQuality: 0 };
      }
      sourceTypeDistribution[sourceType].count++;
    });

    Object.keys(sourceTypeDistribution).forEach(sourceType => {
      const typeSelections = selections.filter(s => s.sourceMetadata.sourceType === sourceType);
      sourceTypeDistribution[sourceType].percentage = typeSelections.length / totalSelections;
      sourceTypeDistribution[sourceType].averageQuality = 
        typeSelections.reduce((sum, s) => sum + s.qualityScore, 0) / typeSelections.length;
    });

    // Credibility distribution
    const credibilityDistribution = {
      high: selections.filter(s => s.credibilityScore > 80).length / totalSelections,
      medium: selections.filter(s => s.credibilityScore >= 60 && s.credibilityScore <= 80).length / totalSelections,
      low: selections.filter(s => s.credibilityScore < 60).length / totalSelections,
    };

    // Position analysis
    const positions = selections.map(s => s.positionInResults);
    const positionAnalysis = {
      averagePosition: positions.reduce((sum, pos) => sum + pos, 0) / positions.length,
      topThreeSelectionRate: selections.filter(s => s.positionInResults <= 3).length / totalSelections,
      positionDistribution: this.calculateDistribution(positions.map(p => p.toString())),
    };

    // Quality assessment accuracy
    const highQualitySelections = selections.filter(s => s.qualityScore > 75).length;
    const poorQualitySelections = selections.filter(s => s.qualityScore < 40).length;
    const missedOpportunities = selections.filter(s => s.competitorAnalysis.betterOptionsAvailable).length;

    const qualityAssessmentAccuracy = {
      correctHighQualitySelections: highQualitySelections,
      missedOpportunities,
      poorQualitySelections,
      overallAccuracy: (highQualitySelections - poorQualitySelections - missedOpportunities) / totalSelections,
    };

    // Penalty analysis
    const totalPenalties = assessments.reduce((sum, a) => sum + Object.values(a.penaltyFactors).reduce((pSum, p) => pSum + p, 0), 0);
    const penaltyTypes: Record<string, number> = {};
    assessments.forEach(assessment => {
      Object.entries(assessment.penaltyFactors).forEach(([type, value]) => {
        penaltyTypes[type] = (penaltyTypes[type] || 0) + value;
      });
    });

    const penaltyAnalysis = {
      totalPenalties,
      penaltyTypes,
      averagePenaltyPerSelection: totalPenalties / totalSelections,
    };

    // Improvement metrics (simplified for now)
    const improvementMetrics = {
      credibilityTrend: 'stable' as const,
      qualityTrend: 'stable' as const,
      diversificationTrend: 'stable' as const,
      learningVelocity: 0.5,
    };

    return {
      totalSelections,
      averageCredibilityScore,
      averageRelevanceScore,
      averageQualityScore,
      sourceTypeDistribution,
      credibilityDistribution,
      positionAnalysis,
      qualityAssessmentAccuracy,
      penaltyAnalysis,
      improvementMetrics,
    };
  }

  private getEmptySourceSelectionAnalytics(): SourceSelectionAnalytics {
    return {
      totalSelections: 0,
      averageCredibilityScore: 0,
      averageRelevanceScore: 0,
      averageQualityScore: 0,
      sourceTypeDistribution: {},
      credibilityDistribution: { high: 0, medium: 0, low: 0 },
      positionAnalysis: {
        averagePosition: 0,
        topThreeSelectionRate: 0,
        positionDistribution: {},
      },
      qualityAssessmentAccuracy: {
        correctHighQualitySelections: 0,
        missedOpportunities: 0,
        poorQualitySelections: 0,
        overallAccuracy: 0,
      },
      penaltyAnalysis: {
        totalPenalties: 0,
        penaltyTypes: {},
        averagePenaltyPerSelection: 0,
      },
      improvementMetrics: {
        credibilityTrend: 'stable',
        qualityTrend: 'stable',
        diversificationTrend: 'stable',
        learningVelocity: 0,
      },
    };
  }

  private extractKeywords(query: string): string[] {
    return query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'but', 'for', 'how', 'what', 'where', 'when', 'why'].includes(word));
  }

  private analyzeQueryComplexity(query: string, keywords: string[]): 'simple' | 'moderate' | 'complex' {
    const technicalTerms = keywords.filter(k => k.length > 6 || /[A-Z]/.test(k));
    const operators = (query.match(/["()]/g) || []).length;
    const complexity = keywords.length + technicalTerms.length + operators;

    if (complexity <= 3) return 'simple';
    if (complexity <= 6) return 'moderate';
    return 'complex';
  }

  private classifyQueryType(query: string, keywords: string[]): 'broad' | 'specific' | 'technical' | 'troubleshooting' {
    const lowerQuery = query.toLowerCase();
    const troubleshootingKeywords = ['error', 'fix', 'problem', 'issue', 'trouble', 'broken', 'not working'];
    const technicalKeywords = ['api', 'config', 'database', 'server', 'function', 'class', 'method'];

    if (troubleshootingKeywords.some(k => lowerQuery.includes(k))) return 'troubleshooting';
    if (technicalKeywords.some(k => lowerQuery.includes(k))) return 'technical';
    if (keywords.length <= 2) return 'broad';
    return 'specific';
  }

  private analyzeQueryIntent(query: string, keywords: string[]): {
    primaryIntent: 'informational' | 'navigational' | 'transactional' | 'investigational';
    confidence: number;
  } {
    const lowerQuery = query.toLowerCase();
    const informationalWords = ['what', 'how', 'why', 'when', 'where', 'explain', 'define'];
    const navigationalWords = ['site:', 'login', 'dashboard', 'homepage'];
    const transactionalWords = ['buy', 'download', 'install', 'purchase', 'order'];
    const investigationalWords = ['compare', 'vs', 'versus', 'difference', 'best', 'review'];

    const scores = {
      informational: informationalWords.filter(w => lowerQuery.includes(w)).length,
      navigational: navigationalWords.filter(w => lowerQuery.includes(w)).length,
      transactional: transactionalWords.filter(w => lowerQuery.includes(w)).length,
      investigational: investigationalWords.filter(w => lowerQuery.includes(w)).length,
    };

    const maxScore = Math.max(...Object.values(scores));
    const primaryIntent = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as any || 'informational';
    const confidence = maxScore > 0 ? Math.min(maxScore / keywords.length, 1) : 0.3;

    return { primaryIntent, confidence };
  }

  private calculateRefinementLevel(userId: string, parentQueryId: string): number {
    const userQueries = this.searchQueries.get(userId) || [];
    const parentQuery = userQueries.find(q => q.id === parentQueryId);
    return parentQuery ? parentQuery.refinementLevel + 1 : 0;
  }

  private analyzeQueryRefinement(originalQuery: SearchQuery, refinedQuery: SearchQuery): {
    type: QueryRefinement['refinementType'];
    keywordsAdded: string[];
    keywordsRemoved: string[];
    keywordsChanged: Array<{ from: string; to: string }>;
  } {
    const originalKeywords = new Set(originalQuery.keywords);
    const refinedKeywords = new Set(refinedQuery.keywords);

    const keywordsAdded = refinedQuery.keywords.filter(k => !originalKeywords.has(k));
    const keywordsRemoved = originalQuery.keywords.filter(k => !refinedKeywords.has(k));
    
    let type: QueryRefinement['refinementType'] = 'rephrase';
    if (keywordsAdded.length > 0 && keywordsRemoved.length === 0) type = 'add_keywords';
    else if (keywordsAdded.length === 0 && keywordsRemoved.length > 0) type = 'remove_keywords';
    else if (keywordsAdded.length > 0 && keywordsRemoved.length > 0) type = 'replace_keywords';
    else if (refinedQuery.queryComplexity === 'complex' && originalQuery.queryComplexity !== 'complex') type = 'specify';
    else if (originalQuery.queryComplexity === 'complex' && refinedQuery.queryComplexity !== 'complex') type = 'broaden';

    return {
      type,
      keywordsAdded,
      keywordsRemoved,
      keywordsChanged: [], // Could be enhanced with fuzzy matching
    };
  }

  private calculateImprovementScore(originalQuery: SearchQuery, refinedQuery: SearchQuery): number {
    let score = 0.5; // Base score
    
    // Result count improvement
    if (refinedQuery.resultCount > originalQuery.resultCount) score += 0.2;
    if (refinedQuery.resultCount > 0 && originalQuery.resultCount === 0) score += 0.3;
    
    // Complexity appropriateness
    if (refinedQuery.queryComplexity === 'moderate') score += 0.1;
    if (originalQuery.queryComplexity === 'simple' && refinedQuery.queryComplexity === 'moderate') score += 0.1;
    
    return Math.min(score, 1);
  }

  private async updateSearchPattern(searchQuery: SearchQuery): Promise<void> {
    const userPatterns = this.searchPatterns.get(searchQuery.userId) || [];
    
    let currentSessionPattern = userPatterns.find(p => p.sessionId === searchQuery.sessionId);
    
    if (!currentSessionPattern) {
      currentSessionPattern = {
        userId: searchQuery.userId,
        sessionId: searchQuery.sessionId,
        searchSequence: [],
        totalSearches: 0,
        totalRefinements: 0,
        averageRefinementTime: 0,
        searchStrategy: 'systematic',
        keywordEvolution: {
          initialKeywords: searchQuery.keywords,
          finalKeywords: searchQuery.keywords,
          keywordAdditions: [],
          keywordRemovals: [],
          keywordReplacements: [],
          keywordEffectiveness: {},
        },
        effectivenessScore: 0,
        searchComplexityProgression: 'stable',
        terminologyUsage: 'common',
      };
      userPatterns.push(currentSessionPattern);
    }

    currentSessionPattern.searchSequence.push(searchQuery);
    currentSessionPattern.totalSearches++;
    
    if (searchQuery.refinementLevel > 0) {
      currentSessionPattern.totalRefinements++;
    }

    currentSessionPattern.keywordEvolution.finalKeywords = searchQuery.keywords;
    currentSessionPattern.searchStrategy = this.determineSearchStrategy(currentSessionPattern.searchSequence);
    currentSessionPattern.searchComplexityProgression = this.analyzeComplexityProgression(currentSessionPattern.searchSequence);
    currentSessionPattern.terminologyUsage = this.analyzeTerminologyUsage(currentSessionPattern.searchSequence);

    this.searchPatterns.set(searchQuery.userId, userPatterns);
  }

  private calculateKeywordEffectiveness(queries: SearchQuery[], userId: string): Record<string, {
    frequency: number;
    successRate: number;
    avgResultPosition: number;
  }> {
    const keywordStats: Record<string, {
      frequency: number;
      successCount: number;
      totalResultPositions: number;
      positionCount: number;
    }> = {};

    const userClicks = this.clickEvents.get(userId) || [];

    queries.forEach(query => {
      query.keywords.forEach(keyword => {
        if (!keywordStats[keyword]) {
          keywordStats[keyword] = {
            frequency: 0,
            successCount: 0,
            totalResultPositions: 0,
            positionCount: 0,
          };
        }
        
        keywordStats[keyword].frequency++;
        
        const queryClicks = userClicks.filter(c => c.searchId === query.id);
        if (queryClicks.length > 0) {
          keywordStats[keyword].successCount++;
          queryClicks.forEach(click => {
            keywordStats[keyword].totalResultPositions += click.resultPosition;
            keywordStats[keyword].positionCount++;
          });
        }
      });
    });

    const effectiveness: Record<string, {
      frequency: number;
      successRate: number;
      avgResultPosition: number;
    }> = {};

    Object.entries(keywordStats).forEach(([keyword, stats]) => {
      effectiveness[keyword] = {
        frequency: stats.frequency,
        successRate: stats.successCount / stats.frequency,
        avgResultPosition: stats.positionCount > 0 
          ? stats.totalResultPositions / stats.positionCount 
          : 0,
      };
    });

    return effectiveness;
  }

  private analyzeTerminologyEvolution(queries: SearchQuery[]): {
    technicalTermIncrease: number;
    specificityIncrease: number;
    vocabularyExpansion: number;
  } {
    if (queries.length < 2) {
      return { technicalTermIncrease: 0, specificityIncrease: 0, vocabularyExpansion: 0 };
    }

    const firstHalf = queries.slice(0, Math.ceil(queries.length / 2));
    const secondHalf = queries.slice(Math.ceil(queries.length / 2));

    const firstTechnicalTerms = firstHalf.filter(q => q.queryType === 'technical').length;
    const secondTechnicalTerms = secondHalf.filter(q => q.queryType === 'technical').length;

    const firstComplexQueries = firstHalf.filter(q => q.queryComplexity === 'complex').length;
    const secondComplexQueries = secondHalf.filter(q => q.queryComplexity === 'complex').length;

    const firstVocab = new Set(firstHalf.flatMap(q => q.keywords));
    const secondVocab = new Set(secondHalf.flatMap(q => q.keywords));

    return {
      technicalTermIncrease: (secondTechnicalTerms / secondHalf.length) - (firstTechnicalTerms / firstHalf.length),
      specificityIncrease: (secondComplexQueries / secondHalf.length) - (firstComplexQueries / firstHalf.length),
      vocabularyExpansion: (secondVocab.size - firstVocab.size) / firstVocab.size,
    };
  }

  private determineSearchStrategy(searchSequence: SearchQuery[]): SearchPattern['searchStrategy'] {
    if (searchSequence.length < 2) return 'systematic';

    const complexityProgression = searchSequence.map(q => q.queryComplexity);
    const isIncreasing = this.isIncreasingComplexity(complexityProgression);
    const isDecreasing = this.isDecreasingComplexity(complexityProgression);

    if (isIncreasing) return 'broad_to_specific';
    if (isDecreasing) return 'specific_to_broad';

    const refinementRatio = searchSequence.filter(q => q.refinementLevel > 0).length / searchSequence.length;
    if (refinementRatio > 0.6) return 'iterative';

    const hasSystematicProgression = this.hasSystematicProgression(searchSequence);
    if (hasSystematicProgression) return 'systematic';

    return 'random';
  }

  private analyzeComplexityProgression(searchSequence: SearchQuery[]): SearchPattern['searchComplexityProgression'] {
    if (searchSequence.length < 2) return 'stable';

    const complexities = searchSequence.map(q => {
      switch (q.queryComplexity) {
        case 'simple': return 1;
        case 'moderate': return 2;
        case 'complex': return 3;
        default: return 2;
      }
    });

    const isIncreasing = this.isIncreasingComplexity(complexities);
    const isDecreasing = this.isDecreasingComplexity(complexities);

    if (isIncreasing) return 'increasing';
    if (isDecreasing) return 'decreasing';
    
    const variance = this.calculateVariance(complexities);
    return variance > 0.5 ? 'mixed' : 'stable';
  }

  private analyzeTerminologyUsage(searchSequence: SearchQuery[]): SearchPattern['terminologyUsage'] {
    const technicalQueries = searchSequence.filter(q => q.queryType === 'technical').length;
    const ratio = technicalQueries / searchSequence.length;

    if (ratio > 0.7) return 'technical';
    if (ratio < 0.3) return 'common';
    return 'mixed';
  }

  private isIncreasingComplexity(complexities: any[]): boolean {
    let increasing = 0;
    for (let i = 1; i < complexities.length; i++) {
      if (complexities[i] > complexities[i-1]) increasing++;
    }
    return increasing > complexities.length * 0.6;
  }

  private isDecreasingComplexity(complexities: any[]): boolean {
    let decreasing = 0;
    for (let i = 1; i < complexities.length; i++) {
      if (complexities[i] < complexities[i-1]) decreasing++;
    }
    return decreasing > complexities.length * 0.6;
  }

  private hasSystematicProgression(searchSequence: SearchQuery[]): boolean {
    const keywords = searchSequence.map(q => q.keywords);
    let systematicCount = 0;
    
    for (let i = 1; i < keywords.length; i++) {
      const overlap = keywords[i-1].filter(k => keywords[i].includes(k)).length;
      if (overlap > 0) systematicCount++;
    }
    
    return systematicCount > searchSequence.length * 0.5;
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length;
  }

  private getEmptySearchAnalytics(): SearchAnalytics {
    return {
      totalQueries: 0,
      averageQueryLength: 0,
      refinementRate: 0,
      queryComplexityDistribution: {},
      queryTypeDistribution: {},
      intentDistribution: {},
      keywordEffectiveness: {},
      searchStrategyDistribution: {},
      averageRefinementTime: 0,
      terminologyEvolution: {
        technicalTermIncrease: 0,
        specificityIncrease: 0,
        vocabularyExpansion: 0,
      },
    };
  }

  private async updateClickPattern(clickEvent: ClickEvent): Promise<void> {
    const userPatterns = this.clickPatterns.get(clickEvent.userId) || [];
    
    // Find existing pattern for this search
    let pattern = userPatterns.find(p => p.searchId === clickEvent.searchId);
    
    if (!pattern) {
      // Create new pattern
      pattern = {
        userId: clickEvent.userId,
        sessionId: clickEvent.sessionId,
        searchId: clickEvent.searchId,
        totalClicks: 0,
        clickSequence: [],
        averageTimeToClick: 0,
        clickDepthPattern: [],
        credibilityPreference: 'mixed',
        sourceTypePreference: [],
        backButtonUsage: 0,
        refinementCount: 0,
      };
      userPatterns.push(pattern);
    }

    // Update pattern with new click
    pattern.totalClicks++;
    pattern.clickSequence.push(clickEvent);
    pattern.clickDepthPattern.push(clickEvent.resultPosition);
    
    // Recalculate averages
    pattern.averageTimeToClick = pattern.clickSequence.reduce((sum, c) => sum + c.timeToClick, 0) / pattern.totalClicks;
    
    // Update preferences
    pattern.credibilityPreference = this.determineCredibilityPreference(pattern.clickSequence);
    pattern.sourceTypePreference = this.determineSourceTypePreference(pattern.clickSequence);

    this.clickPatterns.set(clickEvent.userId, userPatterns);
  }

  private calculateContentEffectiveness(visit: PageVisit): number {
    if (!visit.duration || visit.duration <= 0) return 0;

    // Base effectiveness on time spent and interaction quality
    const durationScore = Math.min(visit.duration / 60000, 1); // Normalize to 1 minute max
    const scrollScore = visit.scrollDepth / 100; // Already a percentage
    const interactionScore = Math.min(visit.interactionEvents.length / 10, 1); // Normalize to 10 interactions

    return (durationScore + scrollScore + interactionScore) / 3;
  }

  private getCredibilityLevel(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  private calculateDistribution<T extends string>(items: T[]): Record<T, number> {
    const distribution = {} as Record<T, number>;
    const total = items.length;

    items.forEach(item => {
      distribution[item] = (distribution[item] || 0) + 1;
    });

    // Convert to percentages
    Object.keys(distribution).forEach(key => {
      distribution[key as T] = distribution[key as T] / total;
    });

    return distribution;
  }

  private determineCredibilityPreference(clicks: ClickEvent[]): 'high' | 'medium' | 'low' | 'mixed' {
    const levels = clicks.map(c => this.getCredibilityLevel(c.credibilityScore));
    const distribution = this.calculateDistribution(levels);

    if (distribution.high > 0.7) return 'high';
    if (distribution.medium > 0.7) return 'medium';
    if (distribution.low > 0.7) return 'low';
    return 'mixed';
  }

  private determineSourceTypePreference(clicks: ClickEvent[]): string[] {
    const distribution = this.calculateDistribution(clicks.map(c => c.sourceType));
    
    return Object.entries(distribution)
      .filter(([_, percentage]) => percentage > 0.2) // 20% threshold
      .sort(([_, a], [__, b]) => b - a)
      .map(([type, _]) => type)
      .slice(0, 3); // Top 3 preferences
  }

  /**
   * Start a research session
   */
  async startResearchSession(data: {
    userId: string;
    sessionId?: string;
    sessionGoal?: string;
  }): Promise<ResearchSession> {
    try {
      if (!data.userId) {
        throw new Error('Missing required field: userId');
      }

      const researchSession: ResearchSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: data.userId,
        sessionId: data.sessionId,
        startTime: new Date(),
        sessionGoal: data.sessionGoal,
        solutionFound: false,
        solutionQuality: 0,
        researchPhases: [],
        efficiency: {
          sessionId: data.sessionId || '',
          userId: data.userId,
          timeToSolution: 0,
          timeToFirstQualitySource: 0,
          searchToClickRatio: 0,
          sourceConsultationCount: 0,
          uniqueSourcesCount: 0,
          redundantSourcesCount: 0,
          sourceQualityDistribution: {
            highQuality: 0,
            mediumQuality: 0,
            lowQuality: 0,
          },
          pathEfficiency: {
            directPath: false,
            searchRefinements: 0,
            backtrackingInstances: 0,
            optimalPathDeviation: 0,
          },
          researchStrategy: {
            strategyType: 'systematic',
            consistencyScore: 0,
            adaptability: 0,
          },
          speedMetrics: {
            averageSearchTime: 0,
            averageDecisionTime: 0,
            averageReadingTime: 0,
            taskCompletionSpeed: 'normal',
          },
          qualityVsSpeed: {
            qualityTradeoffScore: 0,
            rushingIndicators: 0,
            overthinkingIndicators: 0,
          },
          overallEfficiencyScore: 0,
        },
        completed: false,
      };

      const userSessions = this.researchSessions.get(data.userId) || [];
      userSessions.push(researchSession);
      this.researchSessions.set(data.userId, userSessions);

      if (data.sessionId) {
        this.activeResearchSessions.set(data.sessionId, researchSession);
      }

      logger.info('Research session started', {
        userId: data.userId,
        sessionId: researchSession.id,
        goal: data.sessionGoal,
      });

      return researchSession;
    } catch (error) {
      logger.error('Failed to start research session', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * End a research session
   */
  async endResearchSession(data: {
    userId: string;
    sessionId?: string;
    researchSessionId?: string;
    solutionFound: boolean;
    solutionQuality: number;
  }): Promise<ResearchSession | null> {
    try {
      let session: ResearchSession | undefined;

      if (data.researchSessionId) {
        const userSessions = this.researchSessions.get(data.userId) || [];
        session = userSessions.find(s => s.id === data.researchSessionId);
      } else if (data.sessionId) {
        session = this.activeResearchSessions.get(data.sessionId);
      }

      if (!session) {
        logger.warn('Research session not found for ending', { userId: data.userId, sessionId: data.sessionId });
        return null;
      }

      session.endTime = new Date();
      session.totalDuration = session.endTime.getTime() - session.startTime.getTime();
      session.solutionFound = data.solutionFound;
      session.solutionQuality = data.solutionQuality;
      session.completed = true;

      // Calculate efficiency metrics
      await this.calculateResearchEfficiencyMetrics(session);

      // Create path analysis
      await this.createResearchPathAnalysis(session);

      // Remove from active sessions
      if (data.sessionId) {
        this.activeResearchSessions.delete(data.sessionId);
      }

      logger.info('Research session ended', {
        userId: data.userId,
        sessionId: session.id,
        duration: session.totalDuration,
        solutionFound: data.solutionFound,
        efficiency: session.efficiency.overallEfficiencyScore,
      });

      return session;
    } catch (error) {
      logger.error('Failed to end research session', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * Track a source consultation
   */
  async trackSourceConsultation(data: {
    userId: string;
    sessionId?: string;
    sourceId: string;
    sourceUrl: string;
    sourceType: string;
    consultationReason: SourceConsultation['consultationReason'];
  }): Promise<SourceConsultation> {
    try {
      const consultation: SourceConsultation = {
        id: `consultation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        consultationStartTime: new Date(),
        consultationDepth: 'surface',
        informationExtracted: false,
        relevanceToGoal: 50,
        contributionToSolution: 0,
        exitReason: 'not_relevant',
        ...data,
      };

      const userConsultations = this.sourceConsultations.get(data.userId) || [];
      userConsultations.push(consultation);
      this.sourceConsultations.set(data.userId, userConsultations);

      logger.info('Source consultation started', {
        userId: data.userId,
        sourceId: data.sourceId,
        reason: data.consultationReason,
      });

      return consultation;
    } catch (error) {
      logger.error('Failed to track source consultation', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * End a source consultation
   */
  async endSourceConsultation(data: {
    userId: string;
    consultationId: string;
    consultationDepth: SourceConsultation['consultationDepth'];
    informationExtracted: boolean;
    relevanceToGoal: number;
    contributionToSolution: number;
    exitReason: SourceConsultation['exitReason'];
  }): Promise<SourceConsultation | null> {
    try {
      const userConsultations = this.sourceConsultations.get(data.userId) || [];
      const consultation = userConsultations.find(c => c.id === data.consultationId);

      if (!consultation) {
        logger.warn('Source consultation not found for ending', { userId: data.userId, consultationId: data.consultationId });
        return null;
      }

      consultation.consultationEndTime = new Date();
      consultation.consultationDuration = consultation.consultationEndTime.getTime() - consultation.consultationStartTime.getTime();
      consultation.consultationDepth = data.consultationDepth;
      consultation.informationExtracted = data.informationExtracted;
      consultation.relevanceToGoal = data.relevanceToGoal;
      consultation.contributionToSolution = data.contributionToSolution;
      consultation.exitReason = data.exitReason;

      logger.info('Source consultation ended', {
        userId: data.userId,
        consultationId: data.consultationId,
        duration: consultation.consultationDuration,
        depth: data.consultationDepth,
        informationExtracted: data.informationExtracted,
      });

      return consultation;
    } catch (error) {
      logger.error('Failed to end source consultation', { userId: data.userId, error });
      throw error;
    }
  }

  /**
   * Get research efficiency metrics for a user
   */
  async getResearchEfficiencyMetrics(userId: string, timeframe?: { start: Date; end: Date }): Promise<ResearchEfficiencyMetrics[]> {
    try {
      const userSessions = this.researchSessions.get(userId) || [];
      
      const filteredSessions = timeframe 
        ? userSessions.filter(s => s.startTime >= timeframe.start && s.startTime <= timeframe.end)
        : userSessions;

      return filteredSessions.map(session => session.efficiency).filter(metrics => metrics.overallEfficiencyScore >= 0);
    } catch (error) {
      logger.error('Failed to get research efficiency metrics', { userId, error });
      return [];
    }
  }

  /**
   * Get research speed optimization data for a user
   */
  async getResearchSpeedOptimization(userId: string): Promise<ResearchSpeedOptimization | null> {
    try {
      const optimization = this.researchSpeedOptimizations.get(userId);
      
      if (!optimization) {
        // Generate optimization data based on current performance
        return await this.generateSpeedOptimization(userId);
      }

      return optimization;
    } catch (error) {
      logger.error('Failed to get research speed optimization', { userId, error });
      return null;
    }
  }

  /**
   * Calculate research efficiency metrics for a session
   */
  private async calculateResearchEfficiencyMetrics(session: ResearchSession): Promise<void> {
    try {
      const userQueries = this.searchQueries.get(session.userId) || [];
      const userClicks = this.clickEvents.get(session.userId) || [];
      const userSelections = this.sourceSelections.get(session.userId) || [];
      const userConsultations = this.sourceConsultations.get(session.userId) || [];

      // Filter data for this session
      const sessionQueries = userQueries.filter(q => q.sessionId === session.sessionId);
      const sessionClicks = userClicks.filter(c => c.sessionId === session.sessionId);
      const sessionSelections = userSelections.filter(s => s.sessionId === session.sessionId);
      const sessionConsultations = userConsultations.filter(c => c.sessionId === session.sessionId);

      // Time to solution
      session.efficiency.timeToSolution = session.totalDuration || 0;

      // Time to first quality source
      const firstQualitySource = sessionSelections.find(s => s.qualityScore >= 75);
      if (firstQualitySource) {
        session.efficiency.timeToFirstQualitySource = firstQualitySource.timestamp.getTime() - session.startTime.getTime();
      }

      // Search to click ratio
      session.efficiency.searchToClickRatio = sessionQueries.length > 0 ? sessionClicks.length / sessionQueries.length : 0;

      // Source consultation metrics
      session.efficiency.sourceConsultationCount = sessionConsultations.length;
      const uniqueSources = new Set(sessionConsultations.map(c => c.sourceId));
      session.efficiency.uniqueSourcesCount = uniqueSources.size;
      session.efficiency.redundantSourcesCount = sessionConsultations.length - uniqueSources.size;

      // Source quality distribution
      const highQuality = sessionSelections.filter(s => s.qualityScore >= 75).length;
      const mediumQuality = sessionSelections.filter(s => s.qualityScore >= 50 && s.qualityScore < 75).length;
      const lowQuality = sessionSelections.filter(s => s.qualityScore < 50).length;
      const totalSelections = sessionSelections.length;

      if (totalSelections > 0) {
        session.efficiency.sourceQualityDistribution = {
          highQuality: highQuality / totalSelections,
          mediumQuality: mediumQuality / totalSelections,
          lowQuality: lowQuality / totalSelections,
        };
      }

      // Path efficiency
      const refinements = this.queryRefinements.get(session.userId)?.filter(r => r.sessionId === session.sessionId) || [];
      session.efficiency.pathEfficiency.searchRefinements = refinements.length;
      session.efficiency.pathEfficiency.directPath = refinements.length <= 1 && sessionSelections.length <= 3;
      session.efficiency.pathEfficiency.optimalPathDeviation = this.calculateOptimalPathDeviation(session, sessionQueries, sessionSelections);

      // Research strategy
      session.efficiency.researchStrategy = this.analyzeResearchStrategy(sessionQueries, sessionSelections);

      // Speed metrics
      session.efficiency.speedMetrics = this.calculateSpeedMetrics(sessionQueries, sessionClicks, sessionConsultations);

      // Quality vs speed balance
      session.efficiency.qualityVsSpeed = this.analyzeQualityVsSpeed(session, sessionSelections, sessionConsultations);

      // Overall efficiency score
      session.efficiency.overallEfficiencyScore = this.calculateOverallEfficiencyScore(session.efficiency);

    } catch (error) {
      logger.error('Failed to calculate research efficiency metrics', { sessionId: session.id, error });
    }
  }

  /**
   * Create research path analysis for a session
   */
  private async createResearchPathAnalysis(session: ResearchSession): Promise<void> {
    try {
      const userQueries = this.searchQueries.get(session.userId) || [];
      const userClicks = this.clickEvents.get(session.userId) || [];
      const userSelections = this.sourceSelections.get(session.userId) || [];
      const userConsultations = this.sourceConsultations.get(session.userId) || [];

      // Filter data for this session
      const sessionQueries = userQueries.filter(q => q.sessionId === session.sessionId);
      const sessionClicks = userClicks.filter(c => c.sessionId === session.sessionId);
      const sessionSelections = userSelections.filter(s => s.sessionId === session.sessionId);
      const sessionConsultations = userConsultations.filter(c => c.sessionId === session.sessionId);

      // Create path steps
      const pathSteps: PathStep[] = [];
      let stepNumber = 1;

      // Add search steps
      sessionQueries.forEach(query => {
        pathSteps.push({
          stepNumber: stepNumber++,
          timestamp: query.timestamp,
          action: 'search',
          details: {
            query: query.query,
            outcome: 'productive', // Simplified for now
          },
          efficiencyRating: this.calculateStepEfficiencyRating('search', query),
        });
      });

      // Add click steps
      sessionClicks.forEach(click => {
        pathSteps.push({
          stepNumber: stepNumber++,
          timestamp: click.timestamp,
          action: 'click',
          details: {
            sourceUrl: click.pageUrl,
            outcome: this.determineClickOutcome(click),
          },
          efficiencyRating: this.calculateStepEfficiencyRating('click', click),
        });
      });

      // Sort steps by timestamp
      pathSteps.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Renumber steps
      pathSteps.forEach((step, index) => {
        step.stepNumber = index + 1;
      });

      // Calculate path efficiency
      const pathEfficiencyScore = this.calculatePathEfficiencyScore(pathSteps);

      // Generate optimal path suggestion
      const optimalPath = this.generateOptimalPathSuggestion(pathSteps, session);

      // Identify inefficiencies
      const inefficiencies = this.identifyPathInefficiencies(pathSteps, sessionSelections);

      // Generate learning opportunities
      const learningOpportunities = this.generateLearningOpportunities(inefficiencies, session.efficiency);

      const pathAnalysis: ResearchPathAnalysis = {
        sessionId: session.id,
        userId: session.userId,
        pathSteps,
        pathEfficiencyScore,
        optimalPath,
        inefficiencies,
        learningOpportunities,
      };

      const userAnalyses = this.researchPathAnalyses.get(session.userId) || [];
      userAnalyses.push(pathAnalysis);
      this.researchPathAnalyses.set(session.userId, userAnalyses);

      logger.info('Research path analysis created', {
        userId: session.userId,
        sessionId: session.id,
        pathSteps: pathSteps.length,
        efficiencyScore: pathEfficiencyScore,
        inefficiencies: inefficiencies.length,
      });

    } catch (error) {
      logger.error('Failed to create research path analysis', { sessionId: session.id, error });
    }
  }

  /**
   * Generate behavioral analytics for a user
   */
  async generateBehavioralAnalytics(userId: string, timeframe?: { start: Date; end: Date }): Promise<BehavioralAnalyticsEngine> {
    try {
      const analysisDate = new Date();
      
      // Identify behavioral patterns
      const patterns = await this.identifyBehavioralPatterns(userId, timeframe);
      
      // Detect common mistakes
      const mistakes = await this.detectCommonMistakes(userId, timeframe);
      
      // Recognize effective strategies
      const strategies = await this.recognizeEffectiveStrategies(userId, timeframe);
      
      // Analyze behavioral trends
      const trends = await this.analyzeBehavioralTrends(userId, timeframe);
      
      // Generate pattern comparisons
      const comparisons = await this.generatePatternComparisons(userId);
      
      // Generate insights
      const insights = this.generateBehavioralInsights(patterns, mistakes, strategies, trends, comparisons);
      
      // Calculate confidence metrics
      const confidence = this.calculateAnalysisConfidence(userId, timeframe);
      
      const analytics: BehavioralAnalyticsEngine = {
        userId,
        analysisDate,
        patterns,
        mistakes,
        strategies,
        trends,
        comparisons,
        insights,
        confidence,
      };
      
      this.behavioralAnalytics.set(userId, analytics);
      
      logger.info('Behavioral analytics generated', {
        userId,
        patternsFound: patterns.length,
        mistakesDetected: mistakes.length,
        strategiesIdentified: strategies.length,
        overallConfidence: confidence.overall,
      });
      
      return analytics;
    } catch (error) {
      logger.error('Failed to generate behavioral analytics', { userId, error });
      throw error;
    }
  }

  /**
   * Get behavioral analytics for a user
   */
  async getBehavioralAnalytics(userId: string): Promise<BehavioralAnalyticsEngine | null> {
    try {
      const existing = this.behavioralAnalytics.get(userId);
      if (existing) {
        // Check if analysis is recent (within 24 hours)
        const hoursSinceAnalysis = (Date.now() - existing.analysisDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceAnalysis < 24) {
          return existing;
        }
      }
      
      // Generate new analysis
      return await this.generateBehavioralAnalytics(userId);
    } catch (error) {
      logger.error('Failed to get behavioral analytics', { userId, error });
      return null;
    }
  }

  /**
   * Identify behavioral patterns for a user
   */
  private async identifyBehavioralPatterns(userId: string, timeframe?: { start: Date; end: Date }): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];
    
    // Get user data
    const userSessions = this.researchSessions.get(userId) || [];
    const userQueries = this.searchQueries.get(userId) || [];
    const userSelections = this.sourceSelections.get(userId) || [];
    const userClicks = this.clickEvents.get(userId) || [];
    
    // Filter by timeframe
    const filteredSessions = timeframe 
      ? userSessions.filter(s => s.startTime >= timeframe.start && s.startTime <= timeframe.end)
      : userSessions;
    
    const filteredQueries = timeframe 
      ? userQueries.filter(q => q.timestamp >= timeframe.start && q.timestamp <= timeframe.end)
      : userQueries;
    
    const filteredSelections = timeframe 
      ? userSelections.filter(s => s.timestamp >= timeframe.start && s.timestamp <= timeframe.end)
      : userSelections;
    
    const filteredClicks = timeframe 
      ? userClicks.filter(c => c.timestamp >= timeframe.start && c.timestamp <= timeframe.end)
      : userClicks;
    
    // Pattern: Systematic search strategy
    const systematicPattern = this.identifySystematicSearchPattern(filteredQueries, filteredSessions);
    if (systematicPattern) patterns.push(systematicPattern);
    
    // Pattern: Quality-first source selection
    const qualityPattern = this.identifyQualitySourceSelectionPattern(filteredSelections);
    if (qualityPattern) patterns.push(qualityPattern);
    
    // Pattern: Efficient navigation
    const navigationPattern = this.identifyEfficientNavigationPattern(filteredClicks, filteredSessions);
    if (navigationPattern) patterns.push(navigationPattern);
    
    // Pattern: Deep engagement
    const engagementPattern = this.identifyDeepEngagementPattern(filteredSessions);
    if (engagementPattern) patterns.push(engagementPattern);
    
    // Pattern: Time efficiency
    const efficiencyPattern = this.identifyTimeEfficiencyPattern(filteredSessions);
    if (efficiencyPattern) patterns.push(efficiencyPattern);
    
    // Update stored patterns
    this.behavioralPatterns.set(userId, patterns);
    
    return patterns;
  }

  /**
   * Detect common mistakes for a user
   */
  private async detectCommonMistakes(userId: string, timeframe?: { start: Date; end: Date }): Promise<CommonMistake[]> {
    const mistakes: CommonMistake[] = [];
    
    // Get user data
    const userSessions = this.researchSessions.get(userId) || [];
    const userQueries = this.searchQueries.get(userId) || [];
    const userSelections = this.sourceSelections.get(userId) || [];
    const userRefinements = this.queryRefinements.get(userId) || [];
    
    // Filter by timeframe
    const filteredSessions = timeframe 
      ? userSessions.filter(s => s.startTime >= timeframe.start && s.startTime <= timeframe.end)
      : userSessions;
    
    const filteredQueries = timeframe 
      ? userQueries.filter(q => q.timestamp >= timeframe.start && q.timestamp <= timeframe.end)
      : userQueries;
    
    const filteredSelections = timeframe 
      ? userSelections.filter(s => s.timestamp >= timeframe.start && s.timestamp <= timeframe.end)
      : userSelections;
    
    const filteredRefinements = timeframe 
      ? userRefinements.filter(r => r.timestamp >= timeframe.start && r.timestamp <= timeframe.end)
      : userRefinements;
    
    // Mistake: Poor source selection
    const poorSourceMistake = this.detectPoorSourceSelectionMistake(filteredSelections);
    if (poorSourceMistake) mistakes.push(poorSourceMistake);
    
    // Mistake: Excessive refinement
    const excessiveRefinementMistake = this.detectExcessiveRefinementMistake(filteredRefinements, filteredQueries);
    if (excessiveRefinementMistake) mistakes.push(excessiveRefinementMistake);
    
    // Mistake: Position bias
    const positionBiasMistake = this.detectPositionBiasMistake(filteredSelections);
    if (positionBiasMistake) mistakes.push(positionBiasMistake);
    
    // Mistake: Insufficient verification
    const verificationMistake = this.detectInsufficientVerificationMistake(filteredSessions, filteredSelections);
    if (verificationMistake) mistakes.push(verificationMistake);
    
    // Mistake: Time wasting
    const timeWastingMistake = this.detectTimeWastingMistake(filteredSessions);
    if (timeWastingMistake) mistakes.push(timeWastingMistake);
    
    // Update stored mistakes
    this.commonMistakes.set(userId, mistakes);
    
    return mistakes;
  }

  /**
   * Recognize effective strategies for a user
   */
  private async recognizeEffectiveStrategies(userId: string, timeframe?: { start: Date; end: Date }): Promise<EffectiveStrategy[]> {
    const strategies: EffectiveStrategy[] = [];
    
    // Get user data
    const userSessions = this.researchSessions.get(userId) || [];
    const userQueries = this.searchQueries.get(userId) || [];
    const userSelections = this.sourceSelections.get(userId) || [];
    
    // Filter by timeframe
    const filteredSessions = timeframe 
      ? userSessions.filter(s => s.startTime >= timeframe.start && s.startTime <= timeframe.end)
      : userSessions;
    
    const filteredQueries = timeframe 
      ? userQueries.filter(q => q.timestamp >= timeframe.start && q.timestamp <= timeframe.end)
      : userQueries;
    
    const filteredSelections = timeframe 
      ? userSelections.filter(s => s.timestamp >= timeframe.start && s.timestamp <= timeframe.end)
      : userSelections;
    
    // Strategy: Effective search refinement
    const refinementStrategy = this.recognizeSearchRefinementStrategy(filteredQueries, filteredSessions);
    if (refinementStrategy) strategies.push(refinementStrategy);
    
    // Strategy: Quality source evaluation
    const evaluationStrategy = this.recognizeSourceEvaluationStrategy(filteredSelections, filteredSessions);
    if (evaluationStrategy) strategies.push(evaluationStrategy);
    
    // Strategy: Efficient time management
    const timeManagementStrategy = this.recognizeTimeManagementStrategy(filteredSessions);
    if (timeManagementStrategy) strategies.push(timeManagementStrategy);
    
    // Strategy: Effective verification
    const verificationStrategy = this.recognizeVerificationStrategy(filteredSessions, filteredSelections);
    if (verificationStrategy) strategies.push(verificationStrategy);
    
    // Update stored strategies
    this.effectiveStrategies.set(userId, strategies);
    
    return strategies;
  }

  /**
   * Analyze behavioral trends for a user
   */
  private async analyzeBehavioralTrends(userId: string, timeframe?: { start: Date; end: Date }): Promise<BehavioralTrend> {
    const defaultTimeframe = {
      start: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // 30 days ago
      end: new Date(),
    };
    
    const analysisTimeframe = timeframe || defaultTimeframe;
    
    // Get user data over time
    const userSessions = this.researchSessions.get(userId) || [];
    const userQueries = this.searchQueries.get(userId) || [];
    const userSelections = this.sourceSelections.get(userId) || [];
    
    // Filter by timeframe
    const filteredSessions = userSessions.filter(s => 
      s.startTime >= analysisTimeframe.start && s.startTime <= analysisTimeframe.end
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    const filteredQueries = userQueries.filter(q => 
      q.timestamp >= analysisTimeframe.start && q.timestamp <= analysisTimeframe.end
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const filteredSelections = userSelections.filter(s => 
      s.timestamp >= analysisTimeframe.start && s.timestamp <= analysisTimeframe.end
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Calculate trend metrics
    const searchEfficiency = this.calculateSearchEfficiencyTrend(filteredQueries, filteredSessions);
    const sourceQuality = this.calculateSourceQualityTrend(filteredSelections);
    const timeManagement = this.calculateTimeManagementTrend(filteredSessions);
    const strategicThinking = this.calculateStrategicThinkingTrend(filteredQueries, filteredSessions);
    const learningVelocity = this.calculateLearningVelocityTrend(filteredSessions);
    
    // Identify significant events
    const significantEvents = this.identifySignificantEvents(filteredSessions, analysisTimeframe);
    
    // Generate predictions
    const predictions = this.generateTrendPredictions([searchEfficiency, sourceQuality, timeManagement, strategicThinking, learningVelocity]);
    
    // Determine overall trend type
    const trendType = this.determineTrendType([searchEfficiency, sourceQuality, timeManagement, strategicThinking, learningVelocity]);
    
    // Generate recommendations
    const recommendations = this.generateTrendRecommendations(trendType, [searchEfficiency, sourceQuality, timeManagement, strategicThinking, learningVelocity]);
    
    const behavioralTrend: BehavioralTrend = {
      userId,
      timeframe: analysisTimeframe,
      trendType,
      metrics: {
        searchEfficiency,
        sourceQuality,
        timeManagement,
        strategicThinking,
        learningVelocity,
      },
      significantEvents,
      predictions,
      recommendations,
    };
    
    // Update stored trends
    const userTrends = this.behavioralTrends.get(userId) || [];
    userTrends.push(behavioralTrend);
    this.behavioralTrends.set(userId, userTrends);
    
    return behavioralTrend;
  }

  /**
   * Generate pattern comparisons for a user
   */
  private async generatePatternComparisons(userId: string): Promise<PatternComparison> {
    // Get user's current performance metrics
    const userSessions = this.researchSessions.get(userId) || [];
    const userQueries = this.searchQueries.get(userId) || [];
    const userSelections = this.sourceSelections.get(userId) || [];
    
    const completedSessions = userSessions.filter(s => s.completed);
    
    if (completedSessions.length === 0) {
      return this.getDefaultPatternComparison(userId);
    }
    
    // Calculate user scores
    const userScores = this.calculateUserScores(completedSessions, userQueries, userSelections);
    
    // Get benchmark data (simplified - in real implementation would come from database)
    const benchmarkData = this.getBenchmarkData();
    
    // Generate comparison metrics
    const searchStrategy = this.generateComparisonMetric(userScores.searchStrategy, benchmarkData.searchStrategy);
    const sourceSelection = this.generateComparisonMetric(userScores.sourceSelection, benchmarkData.sourceSelection);
    const efficiencyMetrics = this.generateComparisonMetric(userScores.efficiency, benchmarkData.efficiency);
    const qualityAssessment = this.generateComparisonMetric(userScores.qualityAssessment, benchmarkData.qualityAssessment);
    const learningRate = this.generateComparisonMetric(userScores.learningRate, benchmarkData.learningRate);
    
    // Calculate overall ranking
    const overallScore = (searchStrategy.userScore + sourceSelection.userScore + efficiencyMetrics.userScore + qualityAssessment.userScore + learningRate.userScore) / 5;
    const percentile = this.calculatePercentile(overallScore, benchmarkData.overallScores);
    const category = this.determineSkillCategory(percentile);
    const strengthAreas = this.identifyStrengthAreas([searchStrategy, sourceSelection, efficiencyMetrics, qualityAssessment, learningRate]);
    const improvementAreas = this.identifyImprovementAreas([searchStrategy, sourceSelection, efficiencyMetrics, qualityAssessment, learningRate]);
    
    const comparison: PatternComparison = {
      userId,
      comparisonType: 'peer_average',
      metrics: {
        searchStrategy,
        sourceSelection,
        efficiencyMetrics,
        qualityAssessment,
        learningRate,
      },
      overallRanking: {
        percentile,
        category,
        strengthAreas,
        improvementAreas,
      },
      benchmarkData: {
        sampleSize: benchmarkData.sampleSize,
        lastUpdated: new Date(),
        dataSource: 'peer_data',
      },
    };
    
    // Update stored comparisons
    const userComparisons = this.patternComparisons.get(userId) || [];
    userComparisons.push(comparison);
    this.patternComparisons.set(userId, userComparisons);
    
    return comparison;
  }

  /**
   * Generate speed optimization recommendations for a user
   */
  private async generateSpeedOptimization(userId: string): Promise<ResearchSpeedOptimization> {
    try {
      const userSessions = this.researchSessions.get(userId) || [];
      const completedSessions = userSessions.filter(s => s.completed);

      if (completedSessions.length === 0) {
        return this.getDefaultSpeedOptimization(userId);
      }

      // Calculate current performance
      const currentPerformance = {
        averageTimeToSolution: completedSessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0) / completedSessions.length,
        averageSourcesConsulted: completedSessions.reduce((sum, s) => sum + s.efficiency.sourceConsultationCount, 0) / completedSessions.length,
        averageSearchRefinements: completedSessions.reduce((sum, s) => sum + s.efficiency.pathEfficiency.searchRefinements, 0) / completedSessions.length,
      };

      // Generate benchmarks (simplified)
      const benchmarks = {
        expertLevel: {
          timeToSolution: currentPerformance.averageTimeToSolution * 0.6,
          sourcesConsulted: Math.max(currentPerformance.averageSourcesConsulted * 0.7, 3),
          searchRefinements: Math.max(currentPerformance.averageSearchRefinements * 0.5, 1),
          qualityMaintained: 85,
        },
        peerAverage: {
          timeToSolution: currentPerformance.averageTimeToSolution * 0.8,
          sourcesConsulted: currentPerformance.averageSourcesConsulted * 0.85,
          searchRefinements: currentPerformance.averageSearchRefinements * 0.75,
          qualityMaintained: 75,
        },
        personalBest: this.calculatePersonalBest(completedSessions),
      };

      // Generate optimization recommendations
      const optimizationRecommendations = this.generateOptimizationRecommendations(currentPerformance, benchmarks);

      // Generate practice exercises
      const practiceExercises = this.generatePracticeExercises(optimizationRecommendations);

      const speedOptimization: ResearchSpeedOptimization = {
        userId,
        currentPerformance,
        benchmarks,
        optimizationRecommendations,
        practiceExercises,
      };

      this.researchSpeedOptimizations.set(userId, speedOptimization);

      return speedOptimization;
    } catch (error) {
      logger.error('Failed to generate speed optimization', { userId, error });
      return this.getDefaultSpeedOptimization(userId);
    }
  }

  // Helper methods for efficiency calculations

  private calculateOptimalPathDeviation(session: ResearchSession, queries: SearchQuery[], selections: SourceSelection[]): number {
    // Simplified calculation: deviation based on unnecessary steps
    const optimalSteps = Math.max(queries.length * 0.6, 3); // Assume 60% of searches are optimal
    const actualSteps = queries.length + selections.length;
    return Math.max(0, (actualSteps - optimalSteps) / actualSteps);
  }

  private analyzeResearchStrategy(queries: SearchQuery[], selections: SourceSelection[]): ResearchEfficiencyMetrics['researchStrategy'] {
    const strategyType = queries.length > 5 ? 'exploratory' : queries.length > 2 ? 'systematic' : 'focused';
    const consistencyScore = this.calculateConsistencyScore(queries);
    const adaptability = this.calculateAdaptabilityScore(queries, selections);

    return {
      strategyType,
      consistencyScore,
      adaptability,
    };
  }

  private calculateSpeedMetrics(queries: SearchQuery[], clicks: ClickEvent[], consultations: SourceConsultation[]): ResearchEfficiencyMetrics['speedMetrics'] {
    const averageSearchTime = queries.length > 1 
      ? queries.slice(1).reduce((sum, q, i) => sum + (q.timestamp.getTime() - queries[i].timestamp.getTime()), 0) / (queries.length - 1)
      : 0;

    const averageDecisionTime = clicks.reduce((sum, c) => sum + c.timeToClick, 0) / clicks.length || 0;
    
    const averageReadingTime = consultations.reduce((sum, c) => sum + (c.consultationDuration || 0), 0) / consultations.length || 0;

    const taskCompletionSpeed = averageSearchTime < 30000 ? 'fast' : averageSearchTime > 120000 ? 'slow' : 'normal';

    return {
      averageSearchTime,
      averageDecisionTime,
      averageReadingTime,
      taskCompletionSpeed,
    };
  }

  private analyzeQualityVsSpeed(session: ResearchSession, selections: SourceSelection[], consultations: SourceConsultation[]): ResearchEfficiencyMetrics['qualityVsSpeed'] {
    const qualityScore = selections.reduce((sum, s) => sum + s.qualityScore, 0) / selections.length || 0;
    const speedScore = (session.totalDuration || 0) < 300000 ? 100 : Math.max(0, 100 - ((session.totalDuration || 0) - 300000) / 10000);
    
    const qualityTradeoffScore = (qualityScore + speedScore) / 2;
    
    const rushingIndicators = consultations.filter(c => (c.consultationDuration || 0) < 30000).length;
    const overthinkingIndicators = consultations.filter(c => (c.consultationDuration || 0) > 300000).length;

    return {
      qualityTradeoffScore,
      rushingIndicators,
      overthinkingIndicators,
    };
  }

  private calculateOverallEfficiencyScore(efficiency: ResearchEfficiencyMetrics): number {
    const timeScore = Math.max(0, 100 - (efficiency.timeToSolution / 60000)); // Penalty for time over 1 minute
    const qualityScore = (efficiency.sourceQualityDistribution.highQuality * 100) + (efficiency.sourceQualityDistribution.mediumQuality * 60);
    const pathScore = Math.max(0, 100 - (efficiency.pathEfficiency.optimalPathDeviation * 100));
    const strategyScore = efficiency.researchStrategy.consistencyScore * 100;
    const speedScore = efficiency.speedMetrics.taskCompletionSpeed === 'fast' ? 100 : efficiency.speedMetrics.taskCompletionSpeed === 'normal' ? 75 : 50;
    
    return Math.round((timeScore * 0.25 + qualityScore * 0.3 + pathScore * 0.2 + strategyScore * 0.15 + speedScore * 0.1));
  }

  private calculateStepEfficiencyRating(action: string, data: any): number {
    // Simplified efficiency rating based on action type and data
    if (action === 'search') {
      return data.resultCount > 0 ? 80 : 30;
    } else if (action === 'click') {
      return data.credibilityScore > 70 ? 90 : data.credibilityScore > 50 ? 70 : 40;
    }
    return 50;
  }

  private determineClickOutcome(click: ClickEvent): 'productive' | 'neutral' | 'wasteful' {
    if (click.credibilityScore > 70 && click.relevanceScore > 70) return 'productive';
    if (click.credibilityScore < 40 || click.relevanceScore < 40) return 'wasteful';
    return 'neutral';
  }

  private calculatePathEfficiencyScore(pathSteps: PathStep[]): number {
    const averageEfficiency = pathSteps.reduce((sum, step) => sum + step.efficiencyRating, 0) / pathSteps.length;
    return Math.round(averageEfficiency);
  }

  private generateOptimalPathSuggestion(pathSteps: PathStep[], session: ResearchSession): OptimalPathSuggestion {
    const estimatedOptimalSteps = Math.max(Math.ceil(pathSteps.length * 0.6), 3);
    const actualSteps = pathSteps.length;
    const efficiencyGap = actualSteps - estimatedOptimalSteps;

    const suggestedImprovements = [
      'Focus on high-quality sources first',
      'Refine search terms more systematically',
      'Avoid redundant source consultations',
    ];

    const alternativeStrategy = session.efficiency.researchStrategy.strategyType === 'exploratory' 
      ? 'Try a more focused approach with specific search terms'
      : 'Consider broader exploration before narrowing down';

    return {
      estimatedOptimalSteps,
      actualSteps,
      efficiencyGap,
      suggestedImprovements,
      alternativeStrategy,
    };
  }

  private identifyPathInefficiencies(pathSteps: PathStep[], selections: SourceSelection[]): PathInefficiency[] {
    const inefficiencies: PathInefficiency[] = [];

    // Identify redundant searches
    const searchSteps = pathSteps.filter(step => step.action === 'search');
    const redundantSearches = searchSteps.filter((step, index) => 
      searchSteps.slice(0, index).some(prevStep => 
        prevStep.details.query && step.details.query && 
        this.calculateQuerySimilarity(prevStep.details.query, step.details.query) > 0.8
      )
    );

    redundantSearches.forEach(step => {
      inefficiencies.push({
        type: 'redundant_search',
        description: `Similar search performed multiple times: "${step.details.query}"`,
        timeWasted: 30000, // Estimated 30 seconds
        improvement: 'Use more varied search terms to explore different angles',
        severity: 'medium',
      });
    });

    // Identify low-quality source selections
    const lowQualitySelections = selections.filter(s => s.qualityScore < 40);
    lowQualitySelections.forEach(selection => {
      inefficiencies.push({
        type: 'low_quality_source',
        description: `Selected low-quality source: ${selection.sourceMetadata.domain}`,
        timeWasted: 60000, // Estimated 1 minute
        improvement: 'Pay more attention to source credibility indicators',
        severity: 'high',
      });
    });

    return inefficiencies;
  }

  private generateLearningOpportunities(inefficiencies: PathInefficiency[], efficiency: ResearchEfficiencyMetrics): string[] {
    const opportunities: string[] = [];

    if (inefficiencies.some(i => i.type === 'redundant_search')) {
      opportunities.push('Practice developing more diverse search queries');
    }

    if (inefficiencies.some(i => i.type === 'low_quality_source')) {
      opportunities.push('Learn to better evaluate source credibility');
    }

    if (efficiency.pathEfficiency.searchRefinements > 5) {
      opportunities.push('Work on formulating more effective initial search queries');
    }

    if (efficiency.qualityVsSpeed.rushingIndicators > 2) {
      opportunities.push('Take more time to thoroughly evaluate sources');
    }

    return opportunities;
  }

  private calculateConsistencyScore(queries: SearchQuery[]): number {
    if (queries.length < 2) return 1;
    
    // Calculate consistency based on query type and complexity progression
    let consistentSteps = 0;
    for (let i = 1; i < queries.length; i++) {
      if (queries[i].queryType === queries[i-1].queryType) consistentSteps++;
    }
    
    return consistentSteps / (queries.length - 1);
  }

  private calculateAdaptabilityScore(queries: SearchQuery[], selections: SourceSelection[]): number {
    // Simplified: check if user adapted based on previous results
    let adaptations = 0;
    for (let i = 1; i < queries.length; i++) {
      if (queries[i].queryComplexity !== queries[i-1].queryComplexity) {
        adaptations++;
      }
    }
    
    return Math.min(adaptations / Math.max(queries.length - 1, 1), 1);
  }

  private calculatePersonalBest(sessions: ResearchSession[]): ResearchSpeedBenchmark {
    const bestSession = sessions.reduce((best, current) => 
      current.efficiency.overallEfficiencyScore > best.efficiency.overallEfficiencyScore ? current : best
    );

    return {
      timeToSolution: bestSession.totalDuration || 0,
      sourcesConsulted: bestSession.efficiency.sourceConsultationCount,
      searchRefinements: bestSession.efficiency.pathEfficiency.searchRefinements,
      qualityMaintained: bestSession.solutionQuality,
    };
  }

  private generateOptimizationRecommendations(currentPerformance: any, benchmarks: any): SpeedOptimizationRecommendation[] {
    const recommendations: SpeedOptimizationRecommendation[] = [];

    if (currentPerformance.averageTimeToSolution > benchmarks.peerAverage.timeToSolution) {
      recommendations.push({
        area: 'search_strategy',
        currentScore: 60,
        targetScore: 80,
        timeImpact: currentPerformance.averageTimeToSolution - benchmarks.peerAverage.timeToSolution,
        recommendation: 'Focus on more specific initial search queries to reduce iteration time',
        priority: 'high',
      });
    }

    if (currentPerformance.averageSourcesConsulted > benchmarks.peerAverage.sourcesConsulted) {
      recommendations.push({
        area: 'source_selection',
        currentScore: 65,
        targetScore: 85,
        timeImpact: 60000, // Estimated time savings
        recommendation: 'Improve source quality assessment to reduce redundant consultations',
        priority: 'medium',
      });
    }

    return recommendations;
  }

  private generatePracticeExercises(recommendations: SpeedOptimizationRecommendation[]): string[] {
    const exercises: string[] = [];

    if (recommendations.some(r => r.area === 'search_strategy')) {
      exercises.push('Practice writing specific search queries before starting research');
      exercises.push('Exercise: Transform broad questions into specific search terms');
    }

    if (recommendations.some(r => r.area === 'source_selection')) {
      exercises.push('Practice rapid source credibility assessment');
      exercises.push('Exercise: Compare high vs low quality sources side-by-side');
    }

    return exercises;
  }

  private getDefaultSpeedOptimization(userId: string): ResearchSpeedOptimization {
    return {
      userId,
      currentPerformance: {
        averageTimeToSolution: 300000, // 5 minutes
        averageSourcesConsulted: 5,
        averageSearchRefinements: 3,
      },
      benchmarks: {
        expertLevel: {
          timeToSolution: 180000, // 3 minutes
          sourcesConsulted: 3,
          searchRefinements: 1,
          qualityMaintained: 85,
        },
        peerAverage: {
          timeToSolution: 240000, // 4 minutes
          sourcesConsulted: 4,
          searchRefinements: 2,
          qualityMaintained: 75,
        },
        personalBest: {
          timeToSolution: 300000,
          sourcesConsulted: 5,
          searchRefinements: 3,
          qualityMaintained: 70,
        },
      },
      optimizationRecommendations: [
        {
          area: 'search_strategy',
          currentScore: 50,
          targetScore: 75,
          timeImpact: 60000,
          recommendation: 'Start building a systematic approach to research',
          priority: 'high',
        },
      ],
      practiceExercises: [
        'Practice formulating specific search queries',
        'Learn to quickly assess source credibility',
      ],
    };
  }

  private calculateQuerySimilarity(query1: string, query2: string): number {
    const words1 = new Set(query1.toLowerCase().split(/\s+/));
    const words2 = new Set(query2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private getEmptyAnalytics(): ClickAnalytics {
    return {
      clickThroughRate: 0,
      averageClickPosition: 0,
      credibilityDistribution: {},
      sourceTypeDistribution: {},
      timeToClickDistribution: { fast: 0, medium: 0, slow: 0 },
      clickDepthAnalysis: { firstPageOnly: 0, beyondFirstPage: 0, averageDepth: 0 },
      backButtonRate: 0,
      refinementRate: 0,
    };
  }

  // Task 5: Behavioral Analytics Engine Implementation
  async analyzeBehavioralPatterns(userId: string, timeframe?: { start: Date; end: Date }): Promise<{
    patterns: BehavioralPattern[];
    insights: string[];
    recommendations: string[];
  }> {
    try {
      logger.info(`Analyzing behavioral patterns for user ${userId}`);

      const effectiveStrategies = await this.recognizeEffectiveStrategies(userId, timeframe);
      const commonMistakes = await this.identifyCommonMistakes(userId, timeframe);
      const trends = await this.analyzeBehavioralTrends(userId, timeframe);

      const patterns: BehavioralPattern[] = [
        ...effectiveStrategies.map(strategy => ({
          id: `effective-${strategy.id}`,
          type: 'effective_behavior',
          pattern: strategy.name,
          frequency: strategy.usageFrequency,
          effectiveness: strategy.effectiveness,
          context: strategy.applicability,
          evidence: strategy.implementation.steps,
          recommendations: strategy.implementation.tips
        } as BehavioralPattern)),
        ...commonMistakes.map(mistake => ({
          id: `mistake-${mistake.id}`,
          type: 'common_mistake',
          pattern: mistake.name,
          frequency: mistake.frequency,
          effectiveness: 100 - mistake.severity,
          context: mistake.context,
          evidence: [mistake.description],
          recommendations: [mistake.alternativeSuggestion]
        } as BehavioralPattern))
      ];

      const insights = [
        `User shows ${trends.trendType} trend in research efficiency`,
        `Primary search strategy: ${this.identifyPrimaryStrategy(userId)}`,
        `Source quality preference: ${this.getSourceQualityPreference(userId)}`,
        `Average research session efficiency: ${this.calculateOverallEfficiency(userId)}%`
      ];

      const recommendations = [
        ...effectiveStrategies.slice(0, 3).map(s => `Continue using: ${s.name}`),
        ...commonMistakes.slice(0, 2).map(m => `Improve: ${m.alternativeSuggestion}`),
        ...trends.recommendations.slice(0, 2)
      ];

      return { patterns, insights, recommendations };
    } catch (error) {
      logger.error('Error analyzing behavioral patterns:', error);
      throw error;
    }
  }

  async identifyCommonMistakes(userId: string, timeframe?: { start: Date; end: Date }): Promise<CommonMistake[]> {
    try {
      const mistakes: CommonMistake[] = [];
      const userQueries = this.searchQueries.get(userId) || [];
      const userSelections = this.sourceSelections.get(userId) || [];
      const userClicks = this.clickEvents.get(userId) || [];

      // Filter by timeframe if provided
      const relevantQueries = timeframe 
        ? userQueries.filter(q => q.timestamp >= timeframe.start && q.timestamp <= timeframe.end)
        : userQueries;

      // Mistake 1: Too broad initial searches
      const broadQueries = relevantQueries.filter(q => q.queryType === 'broad' && q.queryLength < 3);
      if (broadQueries.length > relevantQueries.length * 0.3) {
        mistakes.push({
          id: 'broad-initial-search',
          name: 'Overly Broad Initial Searches',
          description: 'Starting with searches that are too general, requiring multiple refinements',
          frequency: broadQueries.length,
          severity: 60,
          context: ['initial_search', 'problem_identification'],
          impact: 'Increases time to solution and reduces search efficiency',
          metrics: {
            avgRefinements: this.calculateAverageRefinements(broadQueries),
            timeWasted: this.calculateTimeWasted(broadQueries)
          },
          alternativeSuggestion: 'Start with more specific search terms related to your specific problem'
        });
      }

      // Mistake 2: Clicking on low-credibility sources
      const lowCredibilityClicks = userClicks.filter(c => c.credibilityScore < 0.4);
      if (lowCredibilityClicks.length > userClicks.length * 0.2) {
        mistakes.push({
          id: 'low-credibility-selection',
          name: 'Selecting Low-Credibility Sources',
          description: 'Frequently clicking on questionable or unreliable information sources',
          frequency: lowCredibilityClicks.length,
          severity: 80,
          context: ['source_evaluation', 'information_quality'],
          impact: 'Risk of following incorrect solutions and wasting time on unreliable information',
          metrics: {
            avgCredibilityScore: lowCredibilityClicks.reduce((sum, c) => sum + c.credibilityScore, 0) / lowCredibilityClicks.length,
            successRate: this.calculateSuccessRate(lowCredibilityClicks)
          },
          alternativeSuggestion: 'Focus on official documentation and verified community sources first'
        });
      }

      // Mistake 3: Not refining unsuccessful searches
      const unsuccessfulQueries = relevantQueries.filter(q => {
        const clicksForQuery = userClicks.filter(c => c.searchId === q.id);
        return clicksForQuery.length === 0 || clicksForQuery.every(c => c.credibilityScore < 0.6);
      });
      const refinedUnsuccessful = unsuccessfulQueries.filter(q => q.refinementLevel > 0);
      
      if (refinedUnsuccessful.length < unsuccessfulQueries.length * 0.5) {
        mistakes.push({
          id: 'no-search-refinement',
          name: 'Insufficient Search Refinement',
          description: 'Giving up on searches without trying alternative keywords or approaches',
          frequency: unsuccessfulQueries.length - refinedUnsuccessful.length,
          severity: 70,
          context: ['search_strategy', 'persistence'],
          impact: 'Missing potentially helpful information due to inadequate search exploration',
          metrics: {
            refinementRate: refinedUnsuccessful.length / unsuccessfulQueries.length,
            averageAttempts: this.calculateAverageAttempts(unsuccessfulQueries)
          },
          alternativeSuggestion: 'Try different keywords, synonyms, or more specific terms when initial searches fail'
        });
      }

      return mistakes;
    } catch (error) {
      logger.error('Error identifying common mistakes:', error);
      return [];
    }
  }

  private async recognizeEffectiveStrategies(userId: string, timeframe?: { start: Date; end: Date }): Promise<EffectiveStrategy[]> {
    try {
      const strategies: EffectiveStrategy[] = [];
      const userQueries = this.searchQueries.get(userId) || [];
      const userSelections = this.sourceSelections.get(userId) || [];
      const userClicks = this.clickEvents.get(userId) || [];

      // Filter by timeframe if provided
      const relevantQueries = timeframe 
        ? userQueries.filter(q => q.timestamp >= timeframe.start && q.timestamp <= timeframe.end)
        : userQueries;

      // Strategy 1: Systematic Search Refinement
      const refinedQueries = relevantQueries.filter(q => q.refinementLevel > 0);
      const successfulRefinements = refinedQueries.filter(q => {
        const clicks = userClicks.filter(c => c.searchId === q.id);
        return clicks.some(c => c.credibilityScore > 0.7);
      });

      if (successfulRefinements.length > 0) {
        strategies.push({
          id: 'systematic-refinement',
          strategyType: 'search_refinement',
          name: 'Systematic Search Refinement',
          description: 'Methodically refining search queries to improve result quality',
          effectiveness: (successfulRefinements.length / refinedQueries.length) * 100,
          applicability: ['complex_problems', 'technical_research', 'troubleshooting'],
          requirements: {
            skillLevel: 'intermediate',
            timeInvestment: 120000, // 2 minutes average
            complexityLevel: 'medium'
          },
          metrics: {
            averageTimeToSolution: this.calculateAverageTimeToSolution(successfulRefinements),
            successRate: successfulRefinements.length / refinedQueries.length,
            qualityScore: this.calculateSearchQualityScore(successfulRefinements),
            userSatisfaction: 0.85
          },
          implementation: {
            steps: [
              'Start with specific keywords related to your problem',
              'If results are insufficient, try synonyms or alternative terms',
              'Use boolean operators (AND, OR, NOT) for complex queries',
              'Refine based on initial result quality'
            ],
            tips: [
              'Keep track of which keywords work best',
              'Use quotes for exact phrases',
              'Try both technical and common language terms'
            ],
            commonPitfalls: [
              'Giving up too early without trying alternatives',
              'Making queries too complex initially'
            ]
          },
          usageFrequency: refinedQueries.length,
          lastUsed: refinedQueries[refinedQueries.length - 1]?.timestamp || new Date()
        });
      }

      // Strategy 2: High-Credibility Source Prioritization
      const highCredibilityClicks = userClicks.filter(c => c.credibilityScore > 0.8);
      if (highCredibilityClicks.length > userClicks.length * 0.6) {
        strategies.push({
          id: 'credibility-prioritization',
          strategyType: 'source_evaluation',
          name: 'High-Credibility Source Prioritization',
          description: 'Consistently selecting official documentation and verified sources',
          effectiveness: 90,
          applicability: ['all_contexts', 'critical_decisions', 'learning'],
          requirements: {
            skillLevel: 'beginner',
            timeInvestment: 30000, // 30 seconds to evaluate
            complexityLevel: 'low'
          },
          metrics: {
            averageTimeToSolution: this.calculateAverageTimeToSolution(userQueries),
            successRate: highCredibilityClicks.length / userClicks.length,
            qualityScore: 0.9,
            userSatisfaction: 0.95
          },
          implementation: {
            steps: [
              'Look for official documentation first',
              'Check source credibility indicators',
              'Prefer verified community sources over anonymous posts',
              'Cross-reference information from multiple credible sources'
            ],
            tips: [
              'Green indicators usually mean official sources',
              'Recent publication dates are generally better',
              'Well-known domains often have better information'
            ],
            commonPitfalls: [
              'Ignoring credibility warnings',
              'Choosing convenience over accuracy'
            ]
          },
          usageFrequency: highCredibilityClicks.length,
          lastUsed: highCredibilityClicks[highCredibilityClicks.length - 1]?.timestamp || new Date()
        });
      }

      return strategies;
    } catch (error) {
      logger.error('Error recognizing effective strategies:', error);
      return [];
    }
  }

  private async analyzeBehavioralTrends(userId: string, timeframe?: { start: Date; end: Date }): Promise<BehavioralTrend> {
    try {
      const defaultTimeframe = timeframe || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      };

      const userQueries = this.searchQueries.get(userId) || [];
      const userClicks = this.clickEvents.get(userId) || [];
      const userSelections = this.sourceSelections.get(userId) || [];

      // Calculate trend metrics
      const searchEfficiency = this.calculateTrendMetric('searchEfficiency', userId, defaultTimeframe);
      const sourceQuality = this.calculateTrendMetric('sourceQuality', userId, defaultTimeframe);
      const timeManagement = this.calculateTrendMetric('timeManagement', userId, defaultTimeframe);
      const strategicThinking = this.calculateTrendMetric('strategicThinking', userId, defaultTimeframe);
      const learningVelocity = this.calculateTrendMetric('learningVelocity', userId, defaultTimeframe);

      // Determine overall trend
      const allTrends = [searchEfficiency.direction, sourceQuality.direction, timeManagement.direction, strategicThinking.direction, learningVelocity.direction];
      const improvingCount = allTrends.filter(d => d === 'improving').length;
      const decliningCount = allTrends.filter(d => d === 'declining').length;

      let trendType: 'improvement' | 'decline' | 'plateau' | 'fluctuation';
      if (improvingCount >= 3) trendType = 'improvement';
      else if (decliningCount >= 3) trendType = 'decline';
      else if (allTrends.every(d => d === 'stable')) trendType = 'plateau';
      else trendType = 'fluctuation';

      return {
        userId,
        timeframe: defaultTimeframe,
        trendType,
        metrics: {
          searchEfficiency,
          sourceQuality,
          timeManagement,
          strategicThinking,
          learningVelocity
        },
        significantEvents: this.identifySignificantEvents(userId, defaultTimeframe),
        predictions: this.generateTrendPredictions(userId, trendType),
        recommendations: this.generateTrendRecommendations(trendType, {
          searchEfficiency,
          sourceQuality,
          timeManagement,
          strategicThinking,
          learningVelocity
        })
      };
    } catch (error) {
      logger.error('Error analyzing behavioral trends:', error);
      throw error;
    }
  }

  async compareWithBenchmarks(userId: string, benchmarkType: 'peer' | 'expert' | 'historical' = 'peer'): Promise<{
    userScore: number;
    benchmarkScore: number;
    comparison: 'above' | 'below' | 'at' | 'significantly_above' | 'significantly_below';
    percentile: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    try {
      logger.info(`Comparing user ${userId} with ${benchmarkType} benchmarks`);

      const userMetrics = await this.getResearchEfficiencyMetrics(userId);
      const userScore = this.calculateOverallScore(userMetrics);

      let benchmarkScore: number;
      let percentile: number;

      switch (benchmarkType) {
        case 'expert':
          benchmarkScore = 85; // Expert benchmark
          percentile = this.calculatePercentileVsExperts(userScore);
          break;
        case 'historical':
          benchmarkScore = await this.getHistoricalBenchmark(userId);
          percentile = this.calculateHistoricalPercentile(userId, userScore);
          break;
        case 'peer':
        default:
          benchmarkScore = 65; // Peer average
          percentile = this.calculatePeerPercentile(userScore);
          break;
      }

      const scoreDifference = userScore - benchmarkScore;
      let comparison: 'above' | 'below' | 'at' | 'significantly_above' | 'significantly_below';

      if (Math.abs(scoreDifference) < 5) comparison = 'at';
      else if (scoreDifference > 15) comparison = 'significantly_above';
      else if (scoreDifference < -15) comparison = 'significantly_below';
      else if (scoreDifference > 0) comparison = 'above';
      else comparison = 'below';

      const strengths = this.identifyStrengths(userMetrics, benchmarkScore);
      const weaknesses = this.identifyWeaknesses(userMetrics, benchmarkScore);
      const recommendations = this.generateBenchmarkRecommendations(comparison, strengths, weaknesses);

      return {
        userScore,
        benchmarkScore,
        comparison,
        percentile,
        strengths,
        weaknesses,
        recommendations
      };
    } catch (error) {
      logger.error('Error comparing with benchmarks:', error);
      throw error;
    }
  }

  // Helper methods for behavioral analytics
  private identifyPrimaryStrategy(userId: string): string {
    const patterns = this.searchPatterns.get(userId) || [];
    const strategies = patterns.map(p => p.searchStrategy);
    const strategyCounts = strategies.reduce((acc, strategy) => {
      acc[strategy] = (acc[strategy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(strategyCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
  }

  private getSourceQualityPreference(userId: string): string {
    const clicks = this.clickEvents.get(userId) || [];
    const avgCredibility = clicks.reduce((sum, c) => sum + c.credibilityScore, 0) / clicks.length;
    
    if (avgCredibility > 0.8) return 'high quality sources';
    if (avgCredibility > 0.6) return 'moderate quality sources';
    return 'mixed quality sources';
  }

  private calculateOverallEfficiency(userId: string): number {
    const sessions = this.researchSessions.get(userId) || [];
    if (sessions.length === 0) return 0;
    
    const avgTimeToSolution = sessions.reduce((sum, session) => sum + session.timeToSolution, 0) / sessions.length;
    // Convert time to efficiency score (lower time = higher efficiency)
    const timeEfficiencyScore = Math.max(0, 100 - (avgTimeToSolution / 600000 * 100)); // 10 min max
    return Math.round(timeEfficiencyScore);
  }

  private calculateAverageRefinements(queries: SearchQuery[]): number {
    return queries.reduce((sum, q) => sum + q.refinementLevel, 0) / queries.length;
  }

  private calculateTimeWasted(queries: SearchQuery[]): number {
    // Estimate time wasted on overly broad queries
    return queries.filter(q => q.queryType === 'broad').length * 60000; // 1 min per broad query
  }

  private calculateSuccessRate(clicks: ClickEvent[]): number {
    // Success rate based on credibility and relevance
    const successfulClicks = clicks.filter(c => c.credibilityScore > 0.7 && c.relevanceScore > 0.7);
    return successfulClicks.length / clicks.length;
  }

  private calculateAverageAttempts(queries: SearchQuery[]): number {
    const queryGroups = new Map<string, SearchQuery[]>();
    
    queries.forEach(query => {
      const rootId = query.parentQueryId || query.id;
      if (!queryGroups.has(rootId)) queryGroups.set(rootId, []);
      queryGroups.get(rootId)!.push(query);
    });

    const totalAttempts = Array.from(queryGroups.values())
      .reduce((sum, group) => sum + group.length, 0);
    
    return totalAttempts / queryGroups.size;
  }

  private calculateAverageTimeToSolution(queries: SearchQuery[]): number {
    // Simplified calculation - would need more sophisticated tracking in real implementation
    return queries.length > 0 ? 180000 : 0; // 3 minutes average
  }

  private calculateSearchQualityScore(queries: SearchQuery[]): number {
    // Based on query complexity and success rate
    const complexQueries = queries.filter(q => q.queryComplexity !== 'simple').length;
    return (complexQueries / queries.length) * 0.8 + 0.2;
  }

  private calculateSourceQualityScoreFromMetrics(metrics: ResearchEfficiencyMetrics): number {
    const total = metrics.sourceQualityDistribution.highQuality + 
                 metrics.sourceQualityDistribution.mediumQuality + 
                 metrics.sourceQualityDistribution.lowQuality;
    
    if (total === 0) return 50; // Default score
    
    return (
      (metrics.sourceQualityDistribution.highQuality / total) * 100 +
      (metrics.sourceQualityDistribution.mediumQuality / total) * 70 +
      (metrics.sourceQualityDistribution.lowQuality / total) * 30
    );
  }

  private calculateSearchEfficiencyScoreFromMetrics(metrics: ResearchEfficiencyMetrics): number {
    // Based on path efficiency and search patterns
    const pathScore = (1 - metrics.pathEfficiency.optimalPathDeviation) * 100;
    const refinementScore = Math.max(0, 100 - (metrics.pathEfficiency.searchRefinements * 10));
    const backtrackScore = Math.max(0, 100 - (metrics.pathEfficiency.backtrackingInstances * 15));
    
    return (pathScore + refinementScore + backtrackScore) / 3;
  }

  private calculateTrendMetric(metricType: string, userId: string, timeframe: { start: Date; end: Date }): TrendMetric {
    // Simplified implementation - would calculate actual trends over time
    const currentValue = Math.random() * 100;
    const previousValue = currentValue + (Math.random() - 0.5) * 20;
    const change = currentValue - previousValue;
    
    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(change) < 5) direction = 'stable';
    else if (change > 0) direction = 'improving';
    else direction = 'declining';

    return {
      currentValue,
      previousValue,
      change,
      changePercentage: (change / previousValue) * 100,
      direction,
      confidence: 0.8,
      dataPoints: Math.floor((timeframe.end.getTime() - timeframe.start.getTime()) / (24 * 60 * 60 * 1000))
    };
  }

  private identifySignificantEvents(userId: string, timeframe: { start: Date; end: Date }): SignificantEvent[] {
    return [
      {
        date: new Date(timeframe.start.getTime() + 7 * 24 * 60 * 60 * 1000),
        type: 'improvement',
        description: 'Noticeable improvement in source quality selection',
        impact: 'positive',
        metrics: { sourceQualityIncrease: 15 }
      }
    ];
  }

  private generateTrendPredictions(userId: string, trendType: string): TrendPrediction[] {
    return [
      {
        timeframe: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        predictedMetric: 'searchEfficiency',
        predictedValue: trendType === 'improvement' ? 75 : 60,
        confidence: 0.7,
        factors: ['Current learning velocity', 'Historical improvement patterns'],
        assumptions: ['Continued active usage', 'No major changes in difficulty level']
      }
    ];
  }

  private generateTrendRecommendations(trendType: string, metrics: any): string[] {
    const recommendations = [];
    
    if (trendType === 'decline') {
      recommendations.push('Review recent search strategies for effectiveness');
      recommendations.push('Focus on using more credible sources');
    } else if (trendType === 'plateau') {
      recommendations.push('Try more advanced search techniques');
      recommendations.push('Challenge yourself with more complex scenarios');
    } else {
      recommendations.push('Continue current effective strategies');
      recommendations.push('Consider mentoring others to reinforce learning');
    }
    
    return recommendations;
  }

  private calculateOverallScore(metrics: ResearchEfficiencyMetrics): number {
    // Weighted combination of various metrics
    const weights = {
      timeToSolution: 0.3,
      sourceQuality: 0.25,
      searchEfficiency: 0.25,
      strategicThinking: 0.2
    };

    return (
      (metrics.timeToSolution / 300000 * 100) * weights.timeToSolution + // Normalize to 5 min max
      this.calculateSourceQualityScoreFromMetrics(metrics) * weights.sourceQuality +
      this.calculateSearchEfficiencyScoreFromMetrics(metrics) * weights.searchEfficiency +
      (metrics.sourceConsultationCount > 0 ? 70 : 50) * weights.strategicThinking
    );
  }

  private calculatePercentileVsExperts(userScore: number): number {
    // Expert scores typically range 80-95
    return Math.max(0, Math.min(100, (userScore - 60) * 2));
  }

  private async getHistoricalBenchmark(userId: string): Promise<number> {
    // Get user's historical average based on time efficiency
    const sessions = this.researchSessions.get(userId) || [];
    if (sessions.length === 0) return 50;
    
    const avgTimeToSolution = sessions.reduce((sum, s) => sum + s.timeToSolution, 0) / sessions.length;
    // Convert to score (5 minutes = 100%, 10 minutes = 50%)
    return Math.max(0, 100 - (avgTimeToSolution / 300000 * 50));
  }

  private calculateHistoricalPercentile(userId: string, currentScore: number): number {
    // Compare with user's own historical performance
    const sessions = this.researchSessions.get(userId) || [];
    const scores = sessions.map(s => Math.max(0, 100 - (s.timeToSolution / 300000 * 50)));
    const betterScores = scores.filter(s => s < currentScore).length;
    
    return scores.length > 0 ? (betterScores / scores.length) * 100 : 50;
  }

  private calculatePeerPercentile(userScore: number): number {
    // Simplified peer percentile calculation
    return Math.max(0, Math.min(100, (userScore - 30) * 1.5));
  }

  private identifyStrengths(metrics: ResearchEfficiencyMetrics, benchmarkScore: number): string[] {
    const strengths = [];
    
    const sourceQualityScore = this.calculateSourceQualityScoreFromMetrics(metrics);
    const searchEfficiencyScore = this.calculateSearchEfficiencyScoreFromMetrics(metrics);
    
    if (sourceQualityScore > benchmarkScore * 1.1) {
      strengths.push('Excellent source quality selection');
    }
    if (metrics.timeToSolution < 300000) { // Less than 5 minutes
      strengths.push('Efficient problem-solving speed');
    }
    if (searchEfficiencyScore > 70) {
      strengths.push('Effective search strategies');
    }
    
    return strengths;
  }

  private identifyWeaknesses(metrics: ResearchEfficiencyMetrics, benchmarkScore: number): string[] {
    const weaknesses = [];
    
    const sourceQualityScore = this.calculateSourceQualityScoreFromMetrics(metrics);
    
    if (sourceQualityScore < benchmarkScore * 0.8) {
      weaknesses.push('Source quality evaluation needs improvement');
    }
    if (metrics.timeToSolution > 600000) { // More than 10 minutes
      weaknesses.push('Research efficiency could be improved');
    }
    if (metrics.sourceConsultationCount > 8) {
      weaknesses.push('May be consulting too many sources without focus');
    }
    
    return weaknesses;
  }

  private generateBenchmarkRecommendations(comparison: string, strengths: string[], weaknesses: string[]): string[] {
    const recommendations = [];
    
    if (comparison.includes('below')) {
      recommendations.push('Focus on improving identified weakness areas');
      recommendations.push('Practice with guided scenarios to build skills');
    }
    
    if (weaknesses.includes('Source quality evaluation needs improvement')) {
      recommendations.push('Spend more time evaluating source credibility before clicking');
    }
    
    if (weaknesses.includes('Research efficiency could be improved')) {
      recommendations.push('Try starting with more specific search terms');
    }
    
    if (comparison.includes('above')) {
      recommendations.push('Consider taking on more challenging scenarios');
      recommendations.push('Share your effective strategies with peers');
    }
    
    return recommendations;
  }
}