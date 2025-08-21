import { benchmarkEngine } from '../benchmarkEngine';
import { industryStandardsService } from '../industryStandardsService';
import { peerComparator } from '../peerComparator';
import { jobReadinessAssessor } from '../jobReadinessAssessor';
import { competencyBenchmarking } from '../competencyBenchmarking';
import { contextualComparator } from '../contextualComparator';
import { actionableInsights } from '../actionableInsights';

describe('Comprehensive Benchmarking System', () => {
  const mockUserPerformance = {
    technicalCompetency: 75,
    customerService: 82,
    communicationSkills: 78,
    problemSolving: 71,
    processCompliance: 85,
    learningAgility: 73
  };

  const mockUserProfile = {
    experienceLevel: 'intermediate',
    role: 'support',
    timeInRole: 18,
    region: 'north_america',
    industry: 'technology'
  };

  const mockContextualData = {
    scenarioContext: {
      difficulty: 65,
      complexity: 60,
      novelty: 45,
      timePressure: 55,
      resourceConstraints: 30,
      domainSpecialization: 50,
      prerequisiteKnowledge: 60,
      ambiguity: 40
    },
    environmentalContext: {
      toolAvailability: 85,
      documentationQuality: 75,
      supportAvailability: 70,
      systemStability: 90,
      networkConditions: 95,
      workspaceSetup: 80
    },
    userContext: {
      experienceLevel: 65,
      domainFamiliarity: 70,
      currentWorkload: 60,
      energyLevel: 80,
      learningCurvePosition: 55,
      confidenceLevel: 70
    },
    temporalContext: {
      timeOfDay: 45,
      dayOfWeek: 60,
      seasonality: 50,
      deadlinePressure: 40,
      interruptionFrequency: 25
    }
  };

  describe('Benchmark Engine Core Functionality', () => {
    it('should generate comprehensive benchmarks', async () => {
      const benchmarks = await benchmarkEngine.generateBenchmarks(
        'test-user-1',
        mockUserPerformance,
        mockUserProfile
      );

      expect(benchmarks).toHaveProperty('overallPerformance');
      expect(benchmarks).toHaveProperty('dimensionBenchmarks');
      expect(benchmarks).toHaveProperty('peerComparison');
      expect(benchmarks).toHaveProperty('industryStandards');
      expect(benchmarks).toHaveProperty('recommendations');
      expect(benchmarks).toHaveProperty('insights');

      expect(benchmarks.overallPerformance.percentile).toBeGreaterThanOrEqual(0);
      expect(benchmarks.overallPerformance.percentile).toBeLessThanOrEqual(100);
      expect(Array.isArray(benchmarks.dimensionBenchmarks)).toBe(true);
      expect(Array.isArray(benchmarks.recommendations)).toBe(true);
      expect(Array.isArray(benchmarks.insights)).toBe(true);
    });

    it('should provide dimension-specific rankings', async () => {
      const ranking = await benchmarkEngine.getDimensionRanking('technicalCompetency', 75);

      expect(ranking).toHaveProperty('dimension');
      expect(ranking).toHaveProperty('score');
      expect(ranking).toHaveProperty('percentile');
      expect(ranking).toHaveProperty('ranking');
      expect(ranking).toHaveProperty('gap');
      expect(ranking).toHaveProperty('benchmarkAverage');
      expect(ranking).toHaveProperty('topPerformer');

      expect(ranking.dimension).toBe('technicalCompetency');
      expect(ranking.score).toBe(75);
      expect(typeof ranking.percentile).toBe('number');
      expect(typeof ranking.ranking).toBe('string');
    });

    it('should compare to specific peer groups', async () => {
      const peerCriteria = {
        experienceLevel: 'intermediate',
        role: 'support'
      };

      const comparison = await benchmarkEngine.compareToPeerGroup(
        'test-user-1',
        mockUserPerformance,
        peerCriteria
      );

      expect(comparison).toHaveProperty('peerGroup');
      expect(comparison).toHaveProperty('memberCount');
      expect(comparison).toHaveProperty('comparison');
      expect(comparison).toHaveProperty('overallRanking');

      expect(comparison.peerGroup).toEqual(peerCriteria);
      expect(typeof comparison.memberCount).toBe('number');
      expect(typeof comparison.overallRanking).toBe('number');
    });

    it('should handle invalid inputs gracefully', async () => {
      await expect(benchmarkEngine.generateBenchmarks(
        '',
        {},
        undefined
      )).rejects.toThrow();

      await expect(benchmarkEngine.getDimensionRanking(
        'nonexistent_dimension',
        75
      )).rejects.toThrow();
    });
  });

  describe('Industry Standards Service', () => {
    it('should get applicable standards', async () => {
      const standards = await industryStandardsService.getApplicableStandards(
        'support',
        'intermediate',
        'technology'
      );

      expect(Array.isArray(standards)).toBe(true);
      standards.forEach(standard => {
        expect(standard).toHaveProperty('id');
        expect(standard).toHaveProperty('name');
        expect(standard).toHaveProperty('category');
        expect(standard).toHaveProperty('level');
        expect(standard).toHaveProperty('threshold');
        expect(standard).toHaveProperty('requirements');
        expect(standard.applicability.roles).toContain('support');
        expect(standard.applicability.experienceLevels).toContain('intermediate');
      });
    });

    it('should assess against industry standards', async () => {
      const assessments = await industryStandardsService.assessAgainstStandards(
        mockUserPerformance,
        'support',
        'intermediate'
      );

      expect(Array.isArray(assessments)).toBe(true);
      assessments.forEach(assessment => {
        expect(assessment).toHaveProperty('standardId');
        expect(assessment).toHaveProperty('standardName');
        expect(assessment).toHaveProperty('userQualifies');
        expect(assessment).toHaveProperty('currentLevel');
        expect(assessment).toHaveProperty('competencyGaps');
        expect(assessment).toHaveProperty('recommendations');
        expect(assessment).toHaveProperty('timeToReadiness');

        expect(typeof assessment.userQualifies).toBe('boolean');
        expect(Array.isArray(assessment.competencyGaps)).toBe(true);
        expect(Array.isArray(assessment.recommendations)).toBe(true);
      });
    });

    it('should calculate industry percentiles', async () => {
      const result = await industryStandardsService.calculateIndustryPercentile(
        'technicalCompetency',
        75,
        'intermediate'
      );

      expect(result).toHaveProperty('percentile');
      expect(result).toHaveProperty('ranking');
      expect(result).toHaveProperty('comparison');

      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
      expect(typeof result.ranking).toBe('string');
      expect(typeof result.comparison).toBe('string');
    });

    it('should get benchmark data', async () => {
      const benchmarks = await industryStandardsService.getBenchmarkData(
        ['technicalCompetency', 'customerService'],
        'intermediate'
      );

      expect(typeof benchmarks).toBe('object');
      Object.entries(benchmarks).forEach(([competency, benchmark]) => {
        expect(['technicalCompetency', 'customerService']).toContain(competency);
        expect(benchmark).toHaveProperty('dimension');
        expect(benchmark).toHaveProperty('intermediate');
        expect(benchmark.intermediate).toHaveProperty('min');
        expect(benchmark.intermediate).toHaveProperty('average');
        expect(benchmark.intermediate).toHaveProperty('excellent');
      });
    });
  });

  describe('Peer Comparison Service', () => {
    it('should compare to relevant peers', async () => {
      const userProfile = {
        experienceLevel: 'intermediate',
        role: 'support',
        industry: 'technology',
        region: 'north_america'
      };

      const comparisons = await peerComparator.compareToRelevantPeers(
        'test-user-1',
        mockUserPerformance,
        userProfile
      );

      expect(Array.isArray(comparisons)).toBe(true);
      expect(comparisons.length).toBeGreaterThan(0);

      comparisons.forEach(comparison => {
        expect(comparison).toHaveProperty('userPerformance');
        expect(comparison).toHaveProperty('peerGroup');
        expect(comparison).toHaveProperty('rankings');
        expect(comparison).toHaveProperty('insights');
        expect(comparison).toHaveProperty('anonymousHighlights');

        expect(comparison.peerGroup).toHaveProperty('id');
        expect(comparison.peerGroup).toHaveProperty('name');
        expect(comparison.peerGroup).toHaveProperty('memberCount');

        expect(comparison.rankings).toHaveProperty('overall');
        expect(comparison.rankings).toHaveProperty('byDimension');

        expect(comparison.insights).toHaveProperty('strengths');
        expect(comparison.insights).toHaveProperty('opportunities');
        expect(comparison.insights).toHaveProperty('positionSummary');
      });
    });

    it('should provide anonymous peer insights', async () => {
      const insights = await peerComparator.getAnonymousPeerInsights(
        'technicalCompetency',
        75,
        'intermediate-support'
      );

      expect(insights).toHaveProperty('topPerformersProfile');
      expect(insights).toHaveProperty('improvementExamples');
      expect(insights).toHaveProperty('benchmarkInsights');

      expect(insights.topPerformersProfile).toHaveProperty('averageScore');
      expect(insights.topPerformersProfile).toHaveProperty('scoreRange');
      expect(insights.topPerformersProfile).toHaveProperty('commonTraits');
      expect(insights.topPerformersProfile).toHaveProperty('successFactors');

      expect(Array.isArray(insights.improvementExamples)).toBe(true);
      expect(Array.isArray(insights.benchmarkInsights)).toBe(true);
    });

    it('should analyze peer trends', async () => {
      const historicalData = [
        { date: new Date('2024-01-01'), performance: mockUserPerformance },
        { date: new Date('2024-02-01'), performance: { ...mockUserPerformance, technicalCompetency: 78 } },
        { date: new Date('2024-03-01'), performance: { ...mockUserPerformance, technicalCompetency: 80 } }
      ];

      const trends = await peerComparator.analyzePeerTrends(
        'test-user-1',
        historicalData,
        'intermediate-support'
      );

      expect(Array.isArray(trends)).toBe(true);
      trends.forEach(trend => {
        expect(trend).toHaveProperty('dimension');
        expect(trend).toHaveProperty('userTrend');
        expect(trend).toHaveProperty('peerTrend');
        expect(trend).toHaveProperty('relativePosition');

        expect(trend.userTrend).toHaveProperty('direction');
        expect(trend.userTrend).toHaveProperty('rate');
        expect(trend.userTrend).toHaveProperty('confidence');

        expect(['improving', 'declining', 'stable']).toContain(trend.userTrend.direction);
      });
    });

    it('should find mentorship matches', async () => {
      const userProfile = {
        experienceLevel: 'intermediate',
        strengths: ['customerService'],
        growthAreas: ['technicalCompetency', 'problemSolving']
      };

      const preferences = {
        mentorExperienceLevel: ['advanced', 'expert'],
        focusAreas: ['technicalCompetency'],
        matchingCriteria: ['expertise', 'availability']
      };

      const matches = await peerComparator.findMentorshipMatches(
        'test-user-1',
        userProfile,
        preferences
      );

      expect(Array.isArray(matches)).toBe(true);
      matches.forEach(match => {
        expect(match).toHaveProperty('anonymizedId');
        expect(match).toHaveProperty('experienceLevel');
        expect(match).toHaveProperty('strengths');
        expect(match).toHaveProperty('mentorshipAreas');
        expect(match).toHaveProperty('compatibilityScore');
        expect(match).toHaveProperty('matchReasons');

        expect(preferences.mentorExperienceLevel).toContain(match.experienceLevel);
        expect(match.compatibilityScore).toBeGreaterThanOrEqual(0);
        expect(match.compatibilityScore).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Job Readiness Assessor', () => {
    it('should assess job readiness', async () => {
      const targetRoles = ['it-support-specialist', 'technical-specialist'];
      const userProfile = {
        experienceLevel: 'intermediate',
        currentRole: 'help-desk-technician',
        yearsExperience: 2,
        certifications: ['CompTIA A+'],
        location: 'US'
      };

      const assessments = await jobReadinessAssessor.assessJobReadiness(
        mockUserPerformance,
        targetRoles,
        userProfile
      );

      expect(Array.isArray(assessments)).toBe(true);
      expect(assessments.length).toBeGreaterThan(0);

      assessments.forEach(assessment => {
        expect(assessment).toHaveProperty('jobRole');
        expect(assessment).toHaveProperty('overallReadiness');
        expect(assessment).toHaveProperty('readinessLevel');
        expect(assessment).toHaveProperty('competencyAnalysis');
        expect(assessment).toHaveProperty('strengthAreas');
        expect(assessment).toHaveProperty('developmentAreas');
        expect(assessment).toHaveProperty('recommendations');
        expect(assessment).toHaveProperty('timeToReadiness');
        expect(assessment).toHaveProperty('certificationEligibility');

        expect(assessment.overallReadiness).toBeGreaterThanOrEqual(0);
        expect(assessment.overallReadiness).toBeLessThanOrEqual(100);
        expect(['not_ready', 'developing', 'ready', 'well_qualified', 'overqualified']).toContain(assessment.readinessLevel);
        expect(Array.isArray(assessment.strengthAreas)).toBe(true);
        expect(Array.isArray(assessment.developmentAreas)).toBe(true);
        expect(Array.isArray(assessment.recommendations)).toBe(true);
      });
    });

    it('should recommend suitable roles', async () => {
      const preferences = {
        level: 'intermediate',
        category: 'support',
        salaryRange: { min: 50000, max: 80000 }
      };

      const recommendations = await jobReadinessAssessor.getRecommendedRoles(
        mockUserPerformance,
        preferences
      );

      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('role');
        expect(rec).toHaveProperty('fitScore');
        expect(rec).toHaveProperty('reasoning');

        expect(rec.role).toHaveProperty('id');
        expect(rec.role).toHaveProperty('title');
        expect(rec.role).toHaveProperty('level');
        expect(rec.role).toHaveProperty('category');

        expect(rec.fitScore).toBeGreaterThanOrEqual(0);
        expect(rec.fitScore).toBeLessThanOrEqual(1);
        expect(Array.isArray(rec.reasoning)).toBe(true);
      });
    });

    it('should generate career progression', async () => {
      const careerGoals = ['senior-support-engineer', 'technical-lead'];

      const progression = await jobReadinessAssessor.generateCareerProgression(
        mockUserPerformance,
        'it-support-specialist',
        careerGoals
      );

      expect(progression).toHaveProperty('currentLevel');
      expect(progression).toHaveProperty('nextLevel');
      expect(progression).toHaveProperty('progressionPath');
      expect(progression).toHaveProperty('alternativePaths');

      expect(['entry', 'intermediate', 'senior', 'expert']).toContain(progression.currentLevel);
      expect(Array.isArray(progression.progressionPath)).toBe(true);
      expect(Array.isArray(progression.alternativePaths)).toBe(true);
    });

    it('should analyze job market', async () => {
      const roleIds = ['it-support-specialist', 'technical-specialist'];
      const location = 'US';

      const analysis = await jobReadinessAssessor.analyzeJobMarket(roleIds, location);

      expect(typeof analysis).toBe('object');
      roleIds.forEach(roleId => {
        if (analysis[roleId]) {
          expect(analysis[roleId]).toHaveProperty('jobAvailability');
          expect(analysis[roleId]).toHaveProperty('competitionLevel');
          expect(analysis[roleId]).toHaveProperty('averageSalary');
          expect(analysis[roleId]).toHaveProperty('growthProjection');
          expect(analysis[roleId]).toHaveProperty('keyEmployers');
          expect(analysis[roleId]).toHaveProperty('emergingSkills');

          expect(['limited', 'moderate', 'good', 'excellent']).toContain(analysis[roleId].jobAvailability);
          expect(['low', 'moderate', 'high', 'very_high']).toContain(analysis[roleId].competitionLevel);
          expect(['declining', 'stable', 'growing', 'rapidly_growing']).toContain(analysis[roleId].growthProjection);
        }
      });
    });

    it('should recommend certifications', async () => {
      const targetRoles = ['it-support-specialist'];
      const userCertifications = ['CompTIA A+'];

      const recommendations = await jobReadinessAssessor.getCertificationRecommendations(
        mockUserPerformance,
        targetRoles,
        userCertifications
      );

      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('certification');
        expect(rec).toHaveProperty('relevantRoles');
        expect(rec).toHaveProperty('priorityScore');

        expect(rec.certification).toHaveProperty('certificationId');
        expect(rec.certification).toHaveProperty('name');
        expect(rec.certification).toHaveProperty('eligible');
        expect(rec.certification).toHaveProperty('requirements');

        expect(Array.isArray(rec.relevantRoles)).toBe(true);
        expect(typeof rec.priorityScore).toBe('number');
      });
    });
  });

  describe('Competency Benchmarking Service', () => {
    it('should analyze competencies', async () => {
      const analyses = await competencyBenchmarking.analyzeCompetencies(
        'test-user-1',
        mockUserPerformance,
        'proficient'
      );

      expect(Array.isArray(analyses)).toBe(true);
      analyses.forEach(analysis => {
        expect(analysis).toHaveProperty('competencyId');
        expect(analysis).toHaveProperty('competencyName');
        expect(analysis).toHaveProperty('currentScore');
        expect(analysis).toHaveProperty('targetScore');
        expect(analysis).toHaveProperty('currentLevel');
        expect(analysis).toHaveProperty('targetLevel');
        expect(analysis).toHaveProperty('subCompetencyBreakdown');
        expect(analysis).toHaveProperty('industryComparison');
        expect(analysis).toHaveProperty('developmentGaps');
        expect(analysis).toHaveProperty('strengthAreas');
        expect(analysis).toHaveProperty('priorityActions');

        expect(['novice', 'competent', 'proficient', 'expert', 'master']).toContain(analysis.currentLevel);
        expect(Array.isArray(analysis.subCompetencyBreakdown)).toBe(true);
        expect(Array.isArray(analysis.developmentGaps)).toBe(true);
        expect(Array.isArray(analysis.strengthAreas)).toBe(true);
        expect(Array.isArray(analysis.priorityActions)).toBe(true);
      });
    });

    it('should generate competency roadmap', async () => {
      const targetScores = {
        technicalCompetency: 85,
        customerService: 90,
        communicationSkills: 85
      };

      const roadmap = await competencyBenchmarking.generateCompetencyRoadmap(
        'test-user-1',
        mockUserPerformance,
        targetScores,
        '12 months'
      );

      expect(roadmap).toHaveProperty('userId');
      expect(roadmap).toHaveProperty('currentProfile');
      expect(roadmap).toHaveProperty('targetProfile');
      expect(roadmap).toHaveProperty('developmentPlan');
      expect(roadmap).toHaveProperty('trackingMetrics');

      expect(roadmap.currentProfile).toHaveProperty('overallLevel');
      expect(roadmap.currentProfile).toHaveProperty('competencyScores');
      expect(roadmap.currentProfile).toHaveProperty('strengths');
      expect(roadmap.currentProfile).toHaveProperty('developmentAreas');

      expect(roadmap.developmentPlan).toHaveProperty('phases');
      expect(roadmap.developmentPlan).toHaveProperty('milestones');
      expect(roadmap.developmentPlan).toHaveProperty('totalDuration');

      expect(Array.isArray(roadmap.developmentPlan.phases)).toBe(true);
      expect(Array.isArray(roadmap.developmentPlan.milestones)).toBe(true);
    });

    it('should compare competencies across peers', async () => {
      const comparison = await competencyBenchmarking.compareCompetenciesAcrossPeers(
        mockUserPerformance,
        'intermediate_support'
      );

      expect(typeof comparison).toBe('object');
      Object.entries(comparison).forEach(([competency, compData]) => {
        expect(compData).toHaveProperty('userScore');
        expect(compData).toHaveProperty('peerAverage');
        expect(compData).toHaveProperty('peerMedian');
        expect(compData).toHaveProperty('percentile');
        expect(compData).toHaveProperty('ranking');
        expect(compData).toHaveProperty('gapAnalysis');
        expect(compData).toHaveProperty('improvementPotential');

        expect(typeof compData.userScore).toBe('number');
        expect(typeof compData.peerAverage).toBe('number');
        expect(typeof compData.percentile).toBe('number');
        expect(typeof compData.ranking).toBe('string');
      });
    });

    it('should provide development recommendations', async () => {
      const userContext = {
        learningStyle: 'visual',
        availableTime: 'moderate',
        budget: 'medium',
        experienceLevel: 'intermediate'
      };

      const recommendations = await competencyBenchmarking.getCompetencyDevelopmentRecommendations(
        'technicalCompetency',
        75,
        85,
        userContext
      );

      expect(recommendations).toHaveProperty('quickWins');
      expect(recommendations).toHaveProperty('structuredLearning');
      expect(recommendations).toHaveProperty('practicalApplication');
      expect(recommendations).toHaveProperty('longTermDevelopment');
      expect(recommendations).toHaveProperty('resourcesNeeded');
      expect(recommendations).toHaveProperty('estimatedTimeframe');

      expect(Array.isArray(recommendations.quickWins)).toBe(true);
      expect(Array.isArray(recommendations.structuredLearning)).toBe(true);
      expect(Array.isArray(recommendations.practicalApplication)).toBe(true);
      expect(Array.isArray(recommendations.longTermDevelopment)).toBe(true);
      expect(Array.isArray(recommendations.resourcesNeeded)).toBe(true);
      expect(typeof recommendations.estimatedTimeframe).toBe('string');
    });
  });

  describe('Contextual Comparator Service', () => {
    it('should perform fair comparison', async () => {
      const result = await contextualComparator.performFairComparison(
        'test-user-1',
        75,
        'standard_support_scenario',
        mockContextualData
      );

      expect(result).toHaveProperty('originalComparison');
      expect(result).toHaveProperty('contextualComparison');
      expect(result).toHaveProperty('contextAnalysis');
      expect(result).toHaveProperty('recommendedActions');
      expect(result).toHaveProperty('comparisonReliability');

      expect(result.originalComparison).toHaveProperty('userScore');
      expect(result.originalComparison).toHaveProperty('benchmarkScore');
      expect(result.originalComparison).toHaveProperty('rawPercentile');

      expect(result.contextualComparison).toHaveProperty('adjustedUserScore');
      expect(result.contextualComparison).toHaveProperty('adjustedBenchmarkScore');
      expect(result.contextualComparison).toHaveProperty('contextualPercentile');
      expect(result.contextualComparison).toHaveProperty('fairnessAdjustment');

      expect(result.contextAnalysis).toHaveProperty('advantageousFactors');
      expect(result.contextAnalysis).toHaveProperty('disadvantageousFactors');
      expect(result.contextAnalysis).toHaveProperty('overallContextBias');

      expect(Array.isArray(result.recommendedActions)).toBe(true);
      expect(typeof result.comparisonReliability.score).toBe('number');
    });

    it('should analyze contextual patterns', async () => {
      const performanceHistory = [
        { score: 70, context: mockContextualData, timestamp: new Date('2024-01-01') },
        { score: 75, context: mockContextualData, timestamp: new Date('2024-02-01') },
        { score: 80, context: mockContextualData, timestamp: new Date('2024-03-01') }
      ];

      const analysis = await contextualComparator.analyzeContextualPatterns(
        'test-user-1',
        performanceHistory
      );

      expect(analysis).toHaveProperty('patterns');
      expect(analysis).toHaveProperty('optimalContexts');
      expect(analysis).toHaveProperty('challengingContexts');
      expect(analysis).toHaveProperty('contextualRecommendations');

      expect(Array.isArray(analysis.patterns)).toBe(true);
      expect(Array.isArray(analysis.optimalContexts)).toBe(true);
      expect(Array.isArray(analysis.challengingContexts)).toBe(true);
      expect(Array.isArray(analysis.contextualRecommendations)).toBe(true);
    });

    it('should calculate difficulty-adjusted scores', async () => {
      const result = await contextualComparator.calculateDifficultyAdjustedScore(
        75,
        80,
        65,
        { environmentalContext: { toolAvailability: 60 } }
      );

      expect(result).toHaveProperty('adjustedScore');
      expect(result).toHaveProperty('difficultyMultiplier');
      expect(result).toHaveProperty('experienceBonus');
      expect(result).toHaveProperty('contextualModifiers');
      expect(result).toHaveProperty('normalizedScore');

      expect(typeof result.adjustedScore).toBe('number');
      expect(typeof result.difficultyMultiplier).toBe('number');
      expect(typeof result.experienceBonus).toBe('number');
      expect(Array.isArray(result.contextualModifiers)).toBe(true);
      expect(result.normalizedScore).toBeGreaterThanOrEqual(0);
      expect(result.normalizedScore).toBeLessThanOrEqual(100);
    });

    it('should generate contextual insights', async () => {
      const mockComparisonResults = [{
        originalComparison: { userScore: 75, benchmarkScore: 70, rawPercentile: 60 },
        contextualComparison: { adjustedUserScore: 78, adjustedBenchmarkScore: 70, contextualPercentile: 65, fairnessAdjustment: 3 },
        contextAnalysis: { advantageousFactors: [], disadvantageousFactors: [], neutralFactors: [], overallContextBias: 'neutral' as const },
        recommendedActions: [],
        comparisonReliability: { score: 80, factors: [], limitations: [], recommendations: [] }
      }];

      const insights = await contextualComparator.generateContextualInsights(
        mockComparisonResults,
        'test-user-1'
      );

      expect(Array.isArray(insights)).toBe(true);
      insights.forEach(insight => {
        expect(insight).toHaveProperty('insightType');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('evidence');
        expect(insight).toHaveProperty('confidence');
        expect(insight).toHaveProperty('actionability');
        expect(insight).toHaveProperty('impactPotential');

        expect(['performance_pattern', 'context_impact', 'improvement_opportunity', 'bias_detection']).toContain(insight.insightType);
        expect(['immediate', 'short_term', 'long_term', 'strategic']).toContain(insight.actionability);
        expect(['low', 'medium', 'high', 'transformative']).toContain(insight.impactPotential);
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Actionable Insights Service', () => {
    const mockInsightData = {
      userId: 'test-user-1',
      performanceScores: mockUserPerformance,
      benchmarkResults: {},
      peerComparisons: [],
      competencyAnalysis: [],
      jobReadinessAssessment: [],
      userProfile: {
        experienceLevel: 'intermediate',
        careerGoals: ['senior-support-engineer'],
        learningStyle: 'visual',
        availableTime: 'moderate',
        currentRole: 'support-specialist'
      }
    };

    it('should generate actionable insights', async () => {
      const insights = await actionableInsights.generateActionableInsights(mockInsightData);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      insights.forEach(insight => {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('priority');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('evidence');
        expect(insight).toHaveProperty('recommendations');
        expect(insight).toHaveProperty('expectedOutcomes');
        expect(insight).toHaveProperty('timeframe');
        expect(insight).toHaveProperty('resources');
        expect(insight).toHaveProperty('successMetrics');
        expect(insight).toHaveProperty('dependencies');
        expect(insight).toHaveProperty('riskFactors');
        expect(insight).toHaveProperty('personalization');

        expect(['performance_gap', 'strength_leverage', 'career_advancement', 'skill_development', 'context_optimization', 'peer_learning']).toContain(insight.type);
        expect(['critical', 'high', 'medium', 'low']).toContain(insight.priority);
        expect(Array.isArray(insight.evidence)).toBe(true);
        expect(Array.isArray(insight.recommendations)).toBe(true);
        expect(Array.isArray(insight.expectedOutcomes)).toBe(true);
        expect(Array.isArray(insight.resources)).toBe(true);
        expect(Array.isArray(insight.successMetrics)).toBe(true);
        expect(Array.isArray(insight.dependencies)).toBe(true);
        expect(Array.isArray(insight.riskFactors)).toBe(true);

        expect(insight.timeframe).toHaveProperty('immediate');
        expect(insight.timeframe).toHaveProperty('shortTerm');
        expect(insight.timeframe).toHaveProperty('longTerm');
      });
    });

    it('should generate targeted recommendations', async () => {
      const targetGoal = 'senior-support-engineer';
      const timeframe = '12 months';

      const recommendations = await actionableInsights.generateTargetedRecommendations(
        'test-user-1',
        targetGoal,
        mockUserPerformance,
        timeframe
      );

      expect(recommendations).toHaveProperty('goalAnalysis');
      expect(recommendations).toHaveProperty('strategicPlan');
      expect(recommendations).toHaveProperty('trackingPlan');

      expect(recommendations.goalAnalysis).toHaveProperty('feasibility');
      expect(recommendations.goalAnalysis).toHaveProperty('timeToAchieve');
      expect(recommendations.goalAnalysis).toHaveProperty('keyRequirements');
      expect(recommendations.goalAnalysis).toHaveProperty('successProbability');

      expect(['high', 'medium', 'low']).toContain(recommendations.goalAnalysis.feasibility);
      expect(Array.isArray(recommendations.goalAnalysis.keyRequirements)).toBe(true);
      expect(typeof recommendations.goalAnalysis.successProbability).toBe('number');

      expect(recommendations.strategicPlan).toHaveProperty('phases');
      expect(recommendations.strategicPlan).toHaveProperty('totalDuration');
      expect(recommendations.strategicPlan).toHaveProperty('resourceRequirements');

      expect(recommendations.trackingPlan).toHaveProperty('kpis');
      expect(recommendations.trackingPlan).toHaveProperty('reviewSchedule');
      expect(recommendations.trackingPlan).toHaveProperty('adjustmentTriggers');
    });

    it('should generate team insights', async () => {
      const teamData = [
        {
          userId: 'team-member-1',
          performanceScores: mockUserPerformance,
          role: 'support-specialist',
          experienceLevel: 'intermediate'
        },
        {
          userId: 'team-member-2',
          performanceScores: { ...mockUserPerformance, technicalCompetency: 85 },
          role: 'senior-support',
          experienceLevel: 'advanced'
        }
      ];

      const teamGoals = ['improve-technical-skills', 'enhance-collaboration'];

      const teamInsights = await actionableInsights.generateTeamInsights(teamData, teamGoals);

      expect(teamInsights).toHaveProperty('teamOverview');
      expect(teamInsights).toHaveProperty('individualInsights');
      expect(teamInsights).toHaveProperty('teamRecommendations');
      expect(teamInsights).toHaveProperty('successMetrics');

      expect(teamInsights.teamOverview).toHaveProperty('averagePerformance');
      expect(teamInsights.teamOverview).toHaveProperty('performanceDistribution');
      expect(teamInsights.teamOverview).toHaveProperty('strengthAreas');
      expect(teamInsights.teamOverview).toHaveProperty('improvementAreas');

      expect(Array.isArray(teamInsights.individualInsights)).toBe(true);
      expect(teamInsights.individualInsights.length).toBe(teamData.length);

      teamInsights.individualInsights.forEach(insight => {
        expect(insight).toHaveProperty('userId');
        expect(insight).toHaveProperty('role');
        expect(insight).toHaveProperty('strengths');
        expect(insight).toHaveProperty('developmentAreas');
        expect(insight).toHaveProperty('teamContribution');
        expect(insight).toHaveProperty('recommendations');

        expect(Array.isArray(insight.strengths)).toBe(true);
        expect(Array.isArray(insight.developmentAreas)).toBe(true);
        expect(Array.isArray(insight.teamContribution)).toBe(true);
        expect(Array.isArray(insight.recommendations)).toBe(true);
      });

      expect(teamInsights.teamRecommendations).toHaveProperty('skillGapClosing');
      expect(teamInsights.teamRecommendations).toHaveProperty('strengthLeverage');
      expect(teamInsights.teamRecommendations).toHaveProperty('collaborationImprovement');
      expect(teamInsights.teamRecommendations).toHaveProperty('teamDevelopment');

      expect(Array.isArray(teamInsights.successMetrics)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should integrate all benchmarking services for comprehensive analysis', async () => {
      // Test full benchmarking pipeline
      const userId = 'integration-test-user';
      
      // Step 1: Generate benchmark results
      const benchmarks = await benchmarkEngine.generateBenchmarks(
        userId,
        mockUserPerformance,
        mockUserProfile
      );
      
      // Step 2: Get peer comparisons
      const peerComparisons = await peerComparator.compareToRelevantPeers(
        userId,
        mockUserPerformance,
        mockUserProfile
      );
      
      // Step 3: Assess job readiness
      const jobReadiness = await jobReadinessAssessor.assessJobReadiness(
        mockUserPerformance,
        ['it-support-specialist'],
        mockUserProfile
      );
      
      // Step 4: Analyze competencies
      const competencyAnalysis = await competencyBenchmarking.analyzeCompetencies(
        userId,
        mockUserPerformance,
        'proficient'
      );
      
      // Step 5: Perform contextual comparison
      const contextualComparison = await contextualComparator.performFairComparison(
        userId,
        mockUserPerformance.technicalCompetency,
        'standard_support_scenario',
        mockContextualData
      );
      
      // Step 6: Generate actionable insights
      const insightData = {
        userId,
        performanceScores: mockUserPerformance,
        benchmarkResults: benchmarks,
        peerComparisons,
        competencyAnalysis,
        jobReadinessAssessment: jobReadiness,
        userProfile: {
          experienceLevel: 'intermediate',
          careerGoals: ['senior-support-engineer'],
          learningStyle: 'visual',
          availableTime: 'moderate',
          currentRole: 'support-specialist'
        }
      };
      
      const insights = await actionableInsights.generateActionableInsights(insightData);

      // Verify integration results
      expect(benchmarks).toBeDefined();
      expect(peerComparisons).toBeDefined();
      expect(jobReadiness).toBeDefined();
      expect(competencyAnalysis).toBeDefined();
      expect(contextualComparison).toBeDefined();
      expect(insights).toBeDefined();

      expect(benchmarks.overallPerformance.percentile).toBeGreaterThanOrEqual(0);
      expect(peerComparisons.length).toBeGreaterThan(0);
      expect(jobReadiness.length).toBeGreaterThan(0);
      expect(competencyAnalysis.length).toBeGreaterThan(0);
      expect(contextualComparison.comparisonReliability.score).toBeGreaterThan(0);
      expect(insights.length).toBeGreaterThan(0);

      // Verify data consistency across services
      const overallAverage = Object.values(mockUserPerformance).reduce((a, b) => a + b, 0) / Object.values(mockUserPerformance).length;
      expect(benchmarks.overallPerformance.percentile).toBeGreaterThan(0);
      
      // Verify actionable insights reference other analysis results
      const hasPerformanceGapInsights = insights.some(insight => insight.type === 'performance_gap');
      const hasStrengthLeverageInsights = insights.some(insight => insight.type === 'strength_leverage');
      const hasCareerAdvancementInsights = insights.some(insight => insight.type === 'career_advancement');
      
      expect(hasPerformanceGapInsights || hasStrengthLeverageInsights || hasCareerAdvancementInsights).toBe(true);
    }, 30000); // Extended timeout for integration test

    it('should handle error cases gracefully across all services', async () => {
      // Test error handling for invalid inputs
      const invalidPerformance = {};
      const invalidProfile = {};

      // Benchmark engine should handle invalid inputs
      await expect(benchmarkEngine.generateBenchmarks(
        '',
        invalidPerformance,
        invalidProfile
      )).rejects.toThrow();

      // Industry standards service should handle invalid inputs
      await expect(industryStandardsService.assessAgainstStandards(
        invalidPerformance,
        '',
        ''
      )).rejects.toThrow();

      // Peer comparator should handle invalid inputs
      await expect(peerComparator.compareToRelevantPeers(
        '',
        invalidPerformance,
        invalidProfile
      )).rejects.toThrow();

      // Job readiness assessor should handle invalid inputs
      await expect(jobReadinessAssessor.assessJobReadiness(
        invalidPerformance,
        [],
        invalidProfile
      )).rejects.toThrow();

      // Competency benchmarking should handle invalid inputs
      await expect(competencyBenchmarking.analyzeCompetencies(
        '',
        invalidPerformance,
        'invalid_level' as any
      )).rejects.toThrow();

      // Contextual comparator should handle invalid inputs
      await expect(contextualComparator.performFairComparison(
        '',
        NaN,
        'nonexistent_benchmark',
        {} as any
      )).rejects.toThrow();
    });

    it('should maintain performance within acceptable limits', async () => {
      const startTime = Date.now();

      // Execute core benchmarking operations
      await Promise.all([
        benchmarkEngine.generateBenchmarks('perf-test-user', mockUserPerformance, mockUserProfile),
        industryStandardsService.assessAgainstStandards(mockUserPerformance, 'support', 'intermediate'),
        peerComparator.compareToRelevantPeers('perf-test-user', mockUserPerformance, mockUserProfile),
        competencyBenchmarking.analyzeCompetencies('perf-test-user', mockUserPerformance, 'proficient')
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within 10 seconds
      expect(executionTime).toBeLessThan(10000);
    }, 15000);
  });

  describe('Data Validation and Quality', () => {
    it('should validate input ranges and types', () => {
      // Test score validation
      Object.values(mockUserPerformance).forEach(score => {
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      // Test profile validation
      expect(typeof mockUserProfile.experienceLevel).toBe('string');
      expect(typeof mockUserProfile.role).toBe('string');
      expect(typeof mockUserProfile.timeInRole).toBe('number');
      expect(mockUserProfile.timeInRole).toBeGreaterThan(0);
    });

    it('should ensure consistency in output formats', async () => {
      const benchmarks = await benchmarkEngine.generateBenchmarks(
        'format-test-user',
        mockUserPerformance,
        mockUserProfile
      );

      // Verify consistent percentage formats
      expect(benchmarks.overallPerformance.percentile).toBeGreaterThanOrEqual(0);
      expect(benchmarks.overallPerformance.percentile).toBeLessThanOrEqual(100);
      expect(Number.isInteger(benchmarks.overallPerformance.percentile)).toBe(true);

      // Verify consistent dimension data
      benchmarks.dimensionBenchmarks.forEach(dimension => {
        expect(typeof dimension.dimension).toBe('string');
        expect(typeof dimension.userScore).toBe('number');
        expect(typeof dimension.percentile).toBe('number');
        expect(typeof dimension.ranking).toBe('string');
        expect(dimension.percentile).toBeGreaterThanOrEqual(0);
        expect(dimension.percentile).toBeLessThanOrEqual(100);
      });
    });

    it('should handle edge cases appropriately', async () => {
      // Test with perfect scores
      const perfectScores = Object.fromEntries(
        Object.keys(mockUserPerformance).map(key => [key, 100])
      );

      const perfectBenchmarks = await benchmarkEngine.generateBenchmarks(
        'perfect-user',
        perfectScores,
        mockUserProfile
      );

      expect(perfectBenchmarks.overallPerformance.percentile).toBeGreaterThanOrEqual(90);

      // Test with minimum scores
      const minimumScores = Object.fromEntries(
        Object.keys(mockUserPerformance).map(key => [key, 0])
      );

      const minimumBenchmarks = await benchmarkEngine.generateBenchmarks(
        'minimum-user',
        minimumScores,
        mockUserProfile
      );

      expect(minimumBenchmarks.overallPerformance.percentile).toBeLessThanOrEqual(10);
    });
  });
});

describe('Benchmarking System Stress Tests', () => {
  it('should handle large datasets efficiently', async () => {
    const largeUserList = Array.from({ length: 50 }, (_, i) => ({
      userId: `stress-test-user-${i}`,
      performanceScores: mockUserPerformance,
      role: 'support',
      experienceLevel: 'intermediate'
    }));

    const startTime = Date.now();

    const results = await Promise.all(
      largeUserList.map(user => 
        benchmarkEngine.generateBenchmarks(
          user.userId,
          user.performanceScores,
          { experienceLevel: user.experienceLevel, role: user.role, timeInRole: 12, region: 'global' }
        )
      )
    );

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    expect(results.length).toBe(50);
    expect(executionTime).toBeLessThan(15000); // Should complete within 15 seconds
    
    results.forEach(result => {
      expect(result).toHaveProperty('overallPerformance');
      expect(result).toHaveProperty('dimensionBenchmarks');
    });
  }, 20000);

  it('should maintain consistency under concurrent load', async () => {
    const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
      benchmarkEngine.generateBenchmarks(
        `concurrent-user-${i}`,
        mockUserPerformance,
        mockUserProfile
      )
    );

    const results = await Promise.all(concurrentRequests);

    expect(results.length).toBe(10);
    
    // All results should have similar structure and reasonable values
    results.forEach(result => {
      expect(result.overallPerformance.percentile).toBeGreaterThanOrEqual(0);
      expect(result.overallPerformance.percentile).toBeLessThanOrEqual(100);
      expect(result.dimensionBenchmarks.length).toBeGreaterThan(0);
    });

    // Results should be consistent (within reasonable variance)
    const percentiles = results.map(r => r.overallPerformance.percentile);
    const avgPercentile = percentiles.reduce((a, b) => a + b, 0) / percentiles.length;
    const variance = percentiles.reduce((sum, p) => sum + Math.pow(p - avgPercentile, 2), 0) / percentiles.length;
    const standardDeviation = Math.sqrt(variance);

    // Standard deviation should be reasonable (less than 10 points)
    expect(standardDeviation).toBeLessThan(10);
  });
});