import { Router } from 'express';
import { ResearchTracker } from '../services/researchTracker';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();
const researchTracker = new ResearchTracker();

/**
 * Track a click on a search result
 * POST /api/research/track-click
 */
router.post('/track-click', async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      searchId,
      resultId,
      resultPosition,
      clickSequence,
      timeSinceSearch,
      pageUrl,
      credibilityScore,
      sourceType,
      relevanceScore,
    } = req.body;

    // Validate required fields
    if (!userId || !searchId || !resultId || resultPosition === undefined) {
      throw new ValidationError('Missing required fields: userId, searchId, resultId, resultPosition');
    }

    const clickEvent = await researchTracker.trackClick({
      userId,
      sessionId,
      searchId,
      resultId,
      resultPosition,
      clickSequence,
      timeSinceSearch,
      pageUrl,
      credibilityScore,
      sourceType,
      relevanceScore,
    });

    res.status(201).json({
      success: true,
      data: clickEvent,
    });
  } catch (error) {
    logger.error('Failed to track click', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Start tracking a page visit
 * POST /api/research/track-visit-start
 */
router.post('/track-visit-start', async (req, res) => {
  try {
    const { userId, sessionId, clickEventId, pageUrl } = req.body;

    if (!userId || !clickEventId || !pageUrl) {
      throw new ValidationError('Missing required fields: userId, clickEventId, pageUrl');
    }

    const pageVisit = await researchTracker.startPageVisit({
      userId,
      sessionId,
      clickEventId,
      pageUrl,
    });

    res.status(201).json({
      success: true,
      data: pageVisit,
    });
  } catch (error) {
    logger.error('Failed to start page visit tracking', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * End tracking a page visit
 * POST /api/research/track-visit-end
 */
router.post('/track-visit-end', async (req, res) => {
  try {
    const { userId, sessionId, visitId, exitType, finalScrollDepth } = req.body;

    if (!userId || !exitType) {
      throw new ValidationError('Missing required fields: userId, exitType');
    }

    const pageVisit = await researchTracker.endPageVisit({
      userId,
      sessionId,
      visitId,
      exitType,
      finalScrollDepth: finalScrollDepth || 0,
    });

    res.status(200).json({
      success: true,
      data: pageVisit,
    });
  } catch (error) {
    logger.error('Failed to end page visit tracking', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Track an interaction event
 * POST /api/research/track-interaction
 */
router.post('/track-interaction', async (req, res) => {
  try {
    const { userId, sessionId, visitId, interaction } = req.body;

    if (!userId || !interaction || !interaction.type) {
      throw new ValidationError('Missing required fields: userId, interaction.type');
    }

    await researchTracker.trackInteraction({
      userId,
      sessionId,
      visitId,
      interaction,
    });

    res.status(200).json({
      success: true,
      message: 'Interaction tracked successfully',
    });
  } catch (error) {
    logger.error('Failed to track interaction', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get click analytics for a user
 * GET /api/research/analytics/clicks/:userId
 */
router.get('/analytics/clicks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    let timeframe;
    if (start && end) {
      timeframe = {
        start: new Date(start as string),
        end: new Date(end as string),
      };
    }

    const analytics = await researchTracker.getClickAnalytics(userId, timeframe);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Failed to get click analytics', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get page visit analytics for a user
 * GET /api/research/analytics/visits/:userId
 */
router.get('/analytics/visits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    let timeframe;
    if (start && end) {
      timeframe = {
        start: new Date(start as string),
        end: new Date(end as string),
      };
    }

    const analytics = await researchTracker.getPageVisitAnalytics(userId, timeframe);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Failed to get page visit analytics', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Track a search query
 * POST /api/research/track-search
 */
router.post('/track-search', async (req, res) => {
  try {
    const { userId, sessionId, query, resultCount, parentQueryId } = req.body;

    if (!userId || !query) {
      throw new ValidationError('Missing required fields: userId, query');
    }

    const searchQuery = await researchTracker.trackSearchQuery({
      userId,
      sessionId,
      query,
      resultCount: resultCount || 0,
      parentQueryId,
    });

    res.status(201).json({
      success: true,
      data: searchQuery,
    });
  } catch (error) {
    logger.error('Failed to track search query', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Track a query refinement
 * POST /api/research/track-refinement
 */
router.post('/track-refinement', async (req, res) => {
  try {
    const { userId, sessionId, originalQueryId, refinedQueryId, timeBetweenQueries } = req.body;

    if (!userId || !originalQueryId || !refinedQueryId) {
      throw new ValidationError('Missing required fields: userId, originalQueryId, refinedQueryId');
    }

    const queryRefinement = await researchTracker.trackQueryRefinement({
      userId,
      sessionId,
      originalQueryId,
      refinedQueryId,
      timeBetweenQueries: timeBetweenQueries || 0,
    });

    res.status(201).json({
      success: true,
      data: queryRefinement,
    });
  } catch (error) {
    logger.error('Failed to track query refinement', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get search analytics for a user
 * GET /api/research/analytics/search/:userId
 */
router.get('/analytics/search/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    let timeframe;
    if (start && end) {
      timeframe = {
        start: new Date(start as string),
        end: new Date(end as string),
      };
    }

    const searchAnalytics = await researchTracker.getSearchAnalytics(userId, timeframe);

    res.status(200).json({
      success: true,
      data: searchAnalytics,
    });
  } catch (error) {
    logger.error('Failed to get search analytics', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get search patterns for a user
 * GET /api/research/search-patterns/:userId
 */
router.get('/search-patterns/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const searchPatterns = await researchTracker.getSearchPatterns(
      userId, 
      limit ? parseInt(limit as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: searchPatterns,
    });
  } catch (error) {
    logger.error('Failed to get search patterns', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get click patterns for a user
 * GET /api/research/patterns/:userId
 */
router.get('/patterns/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const patterns = await researchTracker.getClickPatterns(
      userId, 
      limit ? parseInt(limit as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: patterns,
    });
  } catch (error) {
    logger.error('Failed to get click patterns', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Track a source selection
 * POST /api/research/track-source-selection
 */
router.post('/track-source-selection', async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      searchId,
      resultId,
      sourceMetadata,
      credibilityScore,
      relevanceScore,
      timeToSelect,
      positionInResults,
      allResultsInSearch,
    } = req.body;

    if (!userId || !searchId || !resultId || !sourceMetadata) {
      throw new ValidationError('Missing required fields: userId, searchId, resultId, sourceMetadata');
    }

    const sourceSelection = await researchTracker.trackSourceSelection({
      userId,
      sessionId,
      searchId,
      resultId,
      sourceMetadata,
      credibilityScore: credibilityScore || 50,
      relevanceScore: relevanceScore || 50,
      timeToSelect: timeToSelect || 0,
      positionInResults: positionInResults || 1,
      allResultsInSearch,
    });

    res.status(201).json({
      success: true,
      data: sourceSelection,
    });
  } catch (error) {
    logger.error('Failed to track source selection', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Assess source quality
 * POST /api/research/assess-source-quality
 */
router.post('/assess-source-quality', async (req, res) => {
  try {
    const {
      sourceId,
      userId,
      sessionId,
      assessmentType,
      behavioralIndicators,
      sourceMetadata,
    } = req.body;

    if (!sourceId || !userId || !assessmentType || !behavioralIndicators) {
      throw new ValidationError('Missing required fields: sourceId, userId, assessmentType, behavioralIndicators');
    }

    const qualityAssessment = await researchTracker.assessSourceQuality({
      sourceId,
      userId,
      sessionId,
      assessmentType,
      behavioralIndicators,
      sourceMetadata,
    });

    res.status(201).json({
      success: true,
      data: qualityAssessment,
    });
  } catch (error) {
    logger.error('Failed to assess source quality', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get source selection analytics for a user
 * GET /api/research/analytics/source-selection/:userId
 */
router.get('/analytics/source-selection/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    let timeframe;
    if (start && end) {
      timeframe = {
        start: new Date(start as string),
        end: new Date(end as string),
      };
    }

    const sourceSelectionAnalytics = await researchTracker.getSourceSelectionAnalytics(userId, timeframe);

    res.status(200).json({
      success: true,
      data: sourceSelectionAnalytics,
    });
  } catch (error) {
    logger.error('Failed to get source selection analytics', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get source selection patterns for a user
 * GET /api/research/source-selection-patterns/:userId
 */
router.get('/source-selection-patterns/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const sourceSelectionPatterns = await researchTracker.getSourceSelectionPatterns(
      userId, 
      limit ? parseInt(limit as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: sourceSelectionPatterns,
    });
  } catch (error) {
    logger.error('Failed to get source selection patterns', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get comprehensive research behavior analytics
 * GET /api/research/analytics/:userId
 */
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    let timeframe;
    if (start && end) {
      timeframe = {
        start: new Date(start as string),
        end: new Date(end as string),
      };
    }

    // Get all analytics types
    const [
      clickAnalytics, 
      visitAnalytics, 
      clickPatterns, 
      searchAnalytics, 
      searchPatterns,
      sourceSelectionAnalytics,
      sourceSelectionPatterns
    ] = await Promise.all([
      researchTracker.getClickAnalytics(userId, timeframe),
      researchTracker.getPageVisitAnalytics(userId, timeframe),
      researchTracker.getClickPatterns(userId, 5),
      researchTracker.getSearchAnalytics(userId, timeframe),
      researchTracker.getSearchPatterns(userId, 5),
      researchTracker.getSourceSelectionAnalytics(userId, timeframe),
      researchTracker.getSourceSelectionPatterns(userId, 5),
    ]);

    const comprehensiveAnalytics = {
      clicks: clickAnalytics,
      visits: visitAnalytics,
      patterns: clickPatterns,
      search: searchAnalytics,
      searchPatterns: searchPatterns,
      sourceSelection: sourceSelectionAnalytics,
      sourceSelectionPatterns: sourceSelectionPatterns,
      summary: {
        researchEfficiency: calculateResearchEfficiency(clickAnalytics, visitAnalytics),
        qualityScore: calculateQualityScore(clickAnalytics),
        behaviorScore: calculateBehaviorScore(clickAnalytics, visitAnalytics),
        searchEffectiveness: calculateSearchEffectiveness(searchAnalytics),
        sourceSelectionQuality: calculateSourceSelectionQuality(sourceSelectionAnalytics),
      },
    };

    res.status(200).json({
      success: true,
      data: comprehensiveAnalytics,
    });
  } catch (error) {
    logger.error('Failed to get comprehensive analytics', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper functions for calculating research metrics

function calculateResearchEfficiency(clickAnalytics: any, visitAnalytics: any): number {
  if (!clickAnalytics || !visitAnalytics) return 0;

  // Factors that indicate efficiency:
  // - Lower average click position (finding relevant results quickly)
  // - Higher click-through rate (engaging with results)
  // - Reasonable time per visit (not too short, not too long)
  // - Good scroll depth (actually reading content)

  const positionScore = Math.max(0, 1 - (clickAnalytics.averageClickPosition - 1) / 10); // Normalize to 0-1
  const ctrScore = Math.min(clickAnalytics.clickThroughRate, 1);
  const durationScore = Math.min(visitAnalytics.averageDuration / 60000, 1); // Normalize to 1 minute
  const scrollScore = visitAnalytics.averageScrollDepth / 100;

  return Math.round(((positionScore + ctrScore + durationScore + scrollScore) / 4) * 100);
}

function calculateQualityScore(clickAnalytics: any): number {
  if (!clickAnalytics) return 0;

  // Quality based on:
  // - Preference for high credibility sources
  // - Lower back button usage
  // - Less search refinement needed

  const credibilityScore = (clickAnalytics.credibilityDistribution?.high || 0) * 1 + 
                          (clickAnalytics.credibilityDistribution?.medium || 0) * 0.7 + 
                          (clickAnalytics.credibilityDistribution?.low || 0) * 0.3;

  const backButtonScore = Math.max(0, 1 - clickAnalytics.backButtonRate);
  const refinementScore = Math.max(0, 1 - clickAnalytics.refinementRate);

  return Math.round(((credibilityScore + backButtonScore + refinementScore) / 3) * 100);
}

function calculateBehaviorScore(clickAnalytics: any, visitAnalytics: any): number {
  if (!clickAnalytics || !visitAnalytics) return 0;

  // Behavior score based on:
  // - Content engagement (scroll depth, time)
  // - Systematic approach (not just clicking random results)
  // - Content effectiveness

  const engagementScore = (visitAnalytics.averageScrollDepth / 100 + 
                          Math.min(visitAnalytics.averageDuration / 60000, 1)) / 2;

  const systematicScore = 1 - (clickAnalytics.clickDepthAnalysis?.beyondFirstPage || 0); // Prefer first page results
  const effectivenessScore = visitAnalytics.contentEffectiveness || 0;

  return Math.round(((engagementScore + systematicScore + effectivenessScore) / 3) * 100);
}

function calculateSearchEffectiveness(searchAnalytics: any): number {
  if (!searchAnalytics || searchAnalytics.totalQueries === 0) return 0;

  // Search effectiveness based on:
  // - Low refinement rate (finding good results quickly)
  // - Appropriate query complexity
  // - Good keyword effectiveness
  // - Effective search strategy

  const refinementScore = Math.max(0, 1 - searchAnalytics.refinementRate); // Lower is better
  
  const complexityScore = (searchAnalytics.queryComplexityDistribution?.moderate || 0) * 1 +
                         (searchAnalytics.queryComplexityDistribution?.simple || 0) * 0.7 +
                         (searchAnalytics.queryComplexityDistribution?.complex || 0) * 0.8;

  const strategyScore = (searchAnalytics.searchStrategyDistribution?.systematic || 0) * 1 +
                       (searchAnalytics.searchStrategyDistribution?.iterative || 0) * 0.9 +
                       (searchAnalytics.searchStrategyDistribution?.broad_to_specific || 0) * 0.8;

  const keywordScore = searchAnalytics.keywordEffectiveness ? 
    Object.values(searchAnalytics.keywordEffectiveness)
      .map((k: any) => k.successRate)
      .reduce((sum: number, rate: number) => sum + rate, 0) / 
    Object.keys(searchAnalytics.keywordEffectiveness).length : 0;

  return Math.round(((refinementScore + complexityScore + strategyScore + keywordScore) / 4) * 100);
}

function calculateSourceSelectionQuality(sourceSelectionAnalytics: any): number {
  if (!sourceSelectionAnalytics || sourceSelectionAnalytics.totalSelections === 0) return 0;

  // Source selection quality based on:
  // - High average credibility score
  // - Good quality assessment accuracy
  // - Low position bias (not always clicking first results)
  // - Low penalties

  const credibilityScore = sourceSelectionAnalytics.averageCredibilityScore / 100; // Normalize to 0-1
  
  const accuracyScore = Math.max(0, sourceSelectionAnalytics.qualityAssessmentAccuracy.overallAccuracy);

  // Position bias penalty - preferring top 3 too much is bad
  const positionBiasScore = Math.max(0, 1 - Math.max(0, sourceSelectionAnalytics.positionAnalysis.topThreeSelectionRate - 0.6));

  // Penalty score - fewer penalties is better
  const penaltyScore = Math.max(0, 1 - (sourceSelectionAnalytics.penaltyAnalysis.averagePenaltyPerSelection / 10));

  // Source type diversity - using various source types is good
  const diversityScore = Math.min(Object.keys(sourceSelectionAnalytics.sourceTypeDistribution).length / 5, 1);

  return Math.round(((credibilityScore + accuracyScore + positionBiasScore + penaltyScore + diversityScore) / 5) * 100);
}

/**
 * Start research session
 * POST /api/research/start-session
 */
router.post('/start-session', async (req, res) => {
  try {
    const { userId, sessionId, sessionGoal } = req.body;

    if (!userId) {
      throw new ValidationError('Missing required field: userId');
    }

    const researchSession = await researchTracker.startResearchSession({
      userId,
      sessionId,
      sessionGoal,
    });

    res.status(201).json({
      success: true,
      data: researchSession,
    });
  } catch (error) {
    logger.error('Failed to start research session', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * End research session
 * POST /api/research/end-session
 */
router.post('/end-session', async (req, res) => {
  try {
    const { userId, sessionId, researchSessionId, solutionFound, solutionQuality } = req.body;

    if (!userId || solutionFound === undefined || solutionQuality === undefined) {
      throw new ValidationError('Missing required fields: userId, solutionFound, solutionQuality');
    }

    const researchSession = await researchTracker.endResearchSession({
      userId,
      sessionId,
      researchSessionId,
      solutionFound,
      solutionQuality,
    });

    res.status(200).json({
      success: true,
      data: researchSession,
    });
  } catch (error) {
    logger.error('Failed to end research session', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Track source consultation
 * POST /api/research/track-consultation
 */
router.post('/track-consultation', async (req, res) => {
  try {
    const { userId, sessionId, sourceId, sourceUrl, sourceType, consultationReason } = req.body;

    if (!userId || !sourceId || !sourceUrl || !sourceType || !consultationReason) {
      throw new ValidationError('Missing required fields: userId, sourceId, sourceUrl, sourceType, consultationReason');
    }

    const consultation = await researchTracker.trackSourceConsultation({
      userId,
      sessionId,
      sourceId,
      sourceUrl,
      sourceType,
      consultationReason,
    });

    res.status(201).json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    logger.error('Failed to track source consultation', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * End source consultation
 * POST /api/research/end-consultation
 */
router.post('/end-consultation', async (req, res) => {
  try {
    const {
      userId,
      consultationId,
      consultationDepth,
      informationExtracted,
      relevanceToGoal,
      contributionToSolution,
      exitReason,
    } = req.body;

    if (!userId || !consultationId || !consultationDepth || informationExtracted === undefined || 
        relevanceToGoal === undefined || contributionToSolution === undefined || !exitReason) {
      throw new ValidationError('Missing required fields: userId, consultationId, consultationDepth, informationExtracted, relevanceToGoal, contributionToSolution, exitReason');
    }

    const consultation = await researchTracker.endSourceConsultation({
      userId,
      consultationId,
      consultationDepth,
      informationExtracted,
      relevanceToGoal,
      contributionToSolution,
      exitReason,
    });

    res.status(200).json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    logger.error('Failed to end source consultation', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get research efficiency metrics
 * GET /api/research/efficiency/:userId
 */
router.get('/efficiency/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    let timeframe;
    if (start && end) {
      timeframe = {
        start: new Date(start as string),
        end: new Date(end as string),
      };
    }

    const metrics = await researchTracker.getResearchEfficiencyMetrics(userId, timeframe);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get research efficiency metrics', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get research speed optimization
 * GET /api/research/speed-optimization/:userId
 */
router.get('/speed-optimization/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const optimization = await researchTracker.getResearchSpeedOptimization(userId);

    res.json({
      success: true,
      data: optimization,
    });
  } catch (error) {
    logger.error('Failed to get research speed optimization', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Task 5: Behavioral Analytics Engine endpoints
router.get('/behavioral-patterns/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    let timeframe;
    if (startDate && endDate) {
      timeframe = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }
    
    const analysis = await researchTracker.analyzeBehavioralPatterns(userId, timeframe);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Error analyzing behavioral patterns:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze behavioral patterns' 
    });
  }
});

router.get('/common-mistakes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    let timeframe;
    if (startDate && endDate) {
      timeframe = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }
    
    const mistakes = await researchTracker.identifyCommonMistakes(userId, timeframe);
    res.json({
      success: true,
      data: mistakes
    });
  } catch (error) {
    logger.error('Error identifying common mistakes:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to identify common mistakes' 
    });
  }
});

router.get('/benchmarks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'peer' } = req.query;
    
    const benchmarkType = type as 'peer' | 'expert' | 'historical';
    const comparison = await researchTracker.compareWithBenchmarks(userId, benchmarkType);
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    logger.error('Error comparing with benchmarks:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare with benchmarks' 
    });
  }
});

export default router;