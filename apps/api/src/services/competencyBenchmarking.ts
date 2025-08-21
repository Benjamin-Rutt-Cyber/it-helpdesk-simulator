import { logger } from '../utils/logger';

interface CompetencyBenchmark {
  competencyId: string;
  name: string;
  category: 'technical' | 'communication' | 'customer_service' | 'problem_solving' | 'professional' | 'leadership';
  description: string;
  subCompetencies: SubCompetency[];
  benchmarkLevels: {
    novice: BenchmarkLevel;
    competent: BenchmarkLevel;
    proficient: BenchmarkLevel;
    expert: BenchmarkLevel;
    master: BenchmarkLevel;
  };
  industryStandards: {
    minimum: number;
    average: number;
    excellence: number;
    topPercentile: number;
  };
  assessmentCriteria: AssessmentCriterion[];
}

interface SubCompetency {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1, contribution to overall competency
  measurementType: 'behavioral' | 'knowledge' | 'skill' | 'output';
  keyIndicators: string[];
}

interface BenchmarkLevel {
  score: number;
  title: string;
  description: string;
  characteristics: string[];
  behavioralIndicators: string[];
  typicalExamples: string[];
  developmentPath: string[];
}

interface AssessmentCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  scoreRange: {min: number; max: number};
  rubric: {
    [key: number]: string; // Score -> description mapping
  };
}

interface CompetencyAnalysis {
  competencyId: string;
  competencyName: string;
  currentScore: number;
  targetScore: number;
  currentLevel: 'novice' | 'competent' | 'proficient' | 'expert' | 'master';
  targetLevel: 'competent' | 'proficient' | 'expert' | 'master' | 'industry_leader';
  subCompetencyBreakdown: Array<{
    subCompetencyId: string;
    name: string;
    currentScore: number;
    weight: number;
    contribution: number;
    status: 'strength' | 'adequate' | 'needs_improvement' | 'critical_gap';
    recommendations: string[];
  }>;
  industryComparison: {
    percentile: number;
    vsMinimum: number;
    vsAverage: number;
    vsExcellence: number;
    ranking: string;
  };
  developmentGaps: CompetencyGap[];
  strengthAreas: string[];
  priorityActions: PriorityAction[];
}

interface CompetencyGap {
  subCompetencyId: string;
  gapSize: number;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  developmentEffort: 'minimal' | 'moderate' | 'significant' | 'extensive';
  timeToClose: string;
  recommendedApproaches: string[];
}

interface PriorityAction {
  actionType: 'training' | 'practice' | 'mentoring' | 'project_assignment' | 'certification';
  priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  title: string;
  description: string;
  expectedImpact: number; // Points improvement expected
  timeCommitment: string;
  resources: string[];
  successMetrics: string[];
}

interface CompetencyRoadmap {
  userId: string;
  currentProfile: {
    overallLevel: string;
    competencyScores: Record<string, number>;
    strengths: string[];
    developmentAreas: string[];
  };
  targetProfile: {
    desiredLevel: string;
    targetScores: Record<string, number>;
    careerAlignment: string[];
    timeframe: string;
  };
  developmentPlan: {
    phases: RoadmapPhase[];
    milestones: Milestone[];
    totalDuration: string;
    effortDistribution: Record<string, number>;
  };
  trackingMetrics: {
    progressIndicators: string[];
    assessmentSchedule: string[];
    reviewPoints: string[];
  };
}

interface RoadmapPhase {
  phaseNumber: number;
  name: string;
  duration: string;
  objectives: string[];
  targetCompetencies: string[];
  activities: Activity[];
  successCriteria: string[];
  prerequisites: string[];
}

interface Activity {
  id: string;
  name: string;
  type: 'learning' | 'practice' | 'assessment' | 'project' | 'mentoring';
  description: string;
  duration: string;
  effort: 'low' | 'medium' | 'high';
  deliverables: string[];
  competencyContribution: Record<string, number>;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  competencyTargets: Record<string, number>;
  assessmentMethod: string;
  rewards: string[];
  consequences: string[];
}

class CompetencyBenchmarking {
  private competencyBenchmarks: Map<string, CompetencyBenchmark> = new Map();
  private userCompetencyProfiles: Map<string, Record<string, number>> = new Map();

  constructor() {
    this.initializeCompetencyBenchmarks();
  }

  /**
   * Analyze user competencies against benchmarks
   */
  async analyzeCompetencies(
    userId: string,
    competencyScores: Record<string, number>,
    targetLevel: string = 'proficient'
  ): Promise<CompetencyAnalysis[]> {
    try {
      logger.info(`Analyzing competencies for user ${userId} targeting ${targetLevel} level`);

      const analyses: CompetencyAnalysis[] = [];

      for (const [competencyId, currentScore] of Object.entries(competencyScores)) {
        const benchmark = this.competencyBenchmarks.get(competencyId);
        if (!benchmark) {
          logger.warn(`Benchmark not found for competency: ${competencyId}`);
          continue;
        }

        const analysis = await this.analyzeSingleCompetency(
          competencyId,
          currentScore,
          benchmark,
          targetLevel as keyof CompetencyBenchmark['benchmarkLevels']
        );
        analyses.push(analysis);
      }

      // Store user profile for future reference
      this.userCompetencyProfiles.set(userId, competencyScores);

      return analyses.sort((a, b) => {
        // Sort by priority: critical gaps first, then by development potential
        const aPriority = a.developmentGaps.filter(g => g.impactLevel === 'critical').length;
        const bPriority = b.developmentGaps.filter(g => g.impactLevel === 'critical').length;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        
        // Then by potential for improvement
        const aGap = a.targetScore - a.currentScore;
        const bGap = b.targetScore - b.currentScore;
        return bGap - aGap;
      });
    } catch (error) {
      logger.error('Error analyzing competencies:', error);
      throw new Error('Failed to analyze competencies');
    }
  }

  /**
   * Generate comprehensive competency development roadmap
   */
  async generateCompetencyRoadmap(
    userId: string,
    currentScores: Record<string, number>,
    targetScores: Record<string, number>,
    timeframe: string = '12 months'
  ): Promise<CompetencyRoadmap> {
    try {
      logger.info(`Generating competency roadmap for user ${userId} over ${timeframe}`);

      const currentProfile = this.buildCurrentProfile(currentScores);
      const targetProfile = this.buildTargetProfile(targetScores, timeframe);
      const developmentPlan = await this.createDevelopmentPlan(currentScores, targetScores, timeframe);
      const trackingMetrics = this.defineTrackingMetrics(Object.keys(currentScores));

      return {
        userId,
        currentProfile,
        targetProfile,
        developmentPlan,
        trackingMetrics
      };
    } catch (error) {
      logger.error('Error generating competency roadmap:', error);
      throw new Error('Failed to generate competency roadmap');
    }
  }

  /**
   * Compare competencies across multiple users (anonymized)
   */
  async compareCompetenciesAcrossPeers(
    competencyScores: Record<string, number>,
    peerGroup: string = 'all'
  ): Promise<Record<string, {
    userScore: number;
    peerAverage: number;
    peerMedian: number;
    percentile: number;
    ranking: string;
    gapAnalysis: string;
    improvementPotential: string;
  }>> {
    try {
      logger.info(`Comparing competencies across peer group: ${peerGroup}`);

      const comparison: Record<string, any> = {};

      for (const [competencyId, userScore] of Object.entries(competencyScores)) {
        const peerData = this.getPeerCompetencyData(competencyId, peerGroup);
        const percentile = this.calculatePercentile(userScore, peerData);
        const ranking = this.getPerformanceRanking(percentile);

        comparison[competencyId] = {
          userScore,
          peerAverage: peerData.average,
          peerMedian: peerData.median,
          percentile,
          ranking,
          gapAnalysis: this.generateGapAnalysis(userScore, peerData),
          improvementPotential: this.assessImprovementPotential(userScore, peerData)
        };
      }

      return comparison;
    } catch (error) {
      logger.error('Error comparing competencies across peers:', error);
      throw new Error('Failed to compare competencies across peers');
    }
  }

  /**
   * Get competency-specific development recommendations
   */
  async getCompetencyDevelopmentRecommendations(
    competencyId: string,
    currentScore: number,
    targetScore: number,
    userContext?: {
      learningStyle: string;
      availableTime: string;
      budget: string;
      experienceLevel: string;
    }
  ): Promise<{
    quickWins: PriorityAction[];
    structuredLearning: PriorityAction[];
    practicalApplication: PriorityAction[];
    longTermDevelopment: PriorityAction[];
    resourcesNeeded: string[];
    estimatedTimeframe: string;
  }> {
    try {
      logger.info(`Getting development recommendations for ${competencyId}: ${currentScore} -> ${targetScore}`);

      const benchmark = this.competencyBenchmarks.get(competencyId);
      if (!benchmark) {
        throw new Error(`Competency benchmark not found: ${competencyId}`);
      }

      const gap = targetScore - currentScore;
      const recommendations = {
        quickWins: this.identifyQuickWins(competencyId, gap, userContext),
        structuredLearning: this.recommendStructuredLearning(competencyId, gap, userContext),
        practicalApplication: this.suggestPracticalApplication(competencyId, gap, userContext),
        longTermDevelopment: this.planLongTermDevelopment(competencyId, gap, userContext),
        resourcesNeeded: this.identifyResourceNeeds(competencyId, gap),
        estimatedTimeframe: this.estimateTimeframe(gap, userContext?.availableTime)
      };

      return recommendations;
    } catch (error) {
      logger.error('Error getting competency development recommendations:', error);
      throw new Error('Failed to get development recommendations');
    }
  }

  // Private helper methods

  private initializeCompetencyBenchmarks(): void {
    const benchmarks: CompetencyBenchmark[] = [
      {
        competencyId: 'technicalCompetency',
        name: 'Technical Competency',
        category: 'technical',
        description: 'Ability to effectively use technical knowledge and skills to solve problems',
        subCompetencies: [
          {
            id: 'troubleshooting',
            name: 'Troubleshooting',
            description: 'Systematic problem diagnosis and resolution',
            weight: 0.3,
            measurementType: 'skill',
            keyIndicators: ['Root cause identification', 'Solution effectiveness', 'Time to resolution']
          },
          {
            id: 'technical_knowledge',
            name: 'Technical Knowledge',
            description: 'Depth and breadth of technical understanding',
            weight: 0.25,
            measurementType: 'knowledge',
            keyIndicators: ['Knowledge accuracy', 'Knowledge application', 'Learning new technologies']
          },
          {
            id: 'tool_proficiency',
            name: 'Tool Proficiency',
            description: 'Effective use of technical tools and systems',
            weight: 0.2,
            measurementType: 'skill',
            keyIndicators: ['Tool mastery', 'Efficiency of use', 'Advanced features utilization']
          },
          {
            id: 'documentation',
            name: 'Technical Documentation',
            description: 'Clear and accurate technical documentation',
            weight: 0.15,
            measurementType: 'output',
            keyIndicators: ['Documentation quality', 'Completeness', 'Usability']
          },
          {
            id: 'innovation',
            name: 'Technical Innovation',
            description: 'Creative technical solutions and improvements',
            weight: 0.1,
            measurementType: 'behavioral',
            keyIndicators: ['Creative solutions', 'Process improvements', 'Knowledge sharing']
          }
        ],
        benchmarkLevels: {
          novice: {
            score: 40,
            title: 'Novice',
            description: 'Basic technical understanding with guided assistance',
            characteristics: ['Requires significant guidance', 'Basic knowledge application', 'Learning fundamentals'],
            behavioralIndicators: ['Asks many clarifying questions', 'Follows established procedures', 'Seeks help frequently'],
            typicalExamples: ['Resolves simple issues with guidance', 'Uses basic features of tools', 'Documents with templates'],
            developmentPath: ['Foundation courses', 'Mentored practice', 'Basic certifications']
          },
          competent: {
            score: 60,
            title: 'Competent',
            description: 'Reliable technical performance in routine situations',
            characteristics: ['Independent on routine tasks', 'Good fundamental knowledge', 'Consistent quality'],
            behavioralIndicators: ['Works independently on known problems', 'Follows best practices', 'Documents adequately'],
            typicalExamples: ['Resolves standard issues efficiently', 'Uses tools effectively', 'Creates clear documentation'],
            developmentPath: ['Advanced training', 'Varied practice', 'Intermediate certifications']
          },
          proficient: {
            score: 75,
            title: 'Proficient',
            description: 'Strong technical skills with situational adaptation',
            characteristics: ['Adapts to new situations', 'Deep understanding', 'High quality output'],
            behavioralIndicators: ['Handles complex problems', 'Mentors others', 'Improves processes'],
            typicalExamples: ['Resolves complex issues independently', 'Masters advanced features', 'Creates comprehensive documentation'],
            developmentPath: ['Specialization training', 'Leadership development', 'Expert certifications']
          },
          expert: {
            score: 90,
            title: 'Expert',
            description: 'Exceptional technical expertise and innovation',
            characteristics: ['Recognized expertise', 'Innovative solutions', 'Thought leadership'],
            behavioralIndicators: ['Solves unprecedented problems', 'Teaches and mentors', 'Drives innovation'],
            typicalExamples: ['Develops new solutions', 'Leads technical initiatives', 'Creates standards'],
            developmentPath: ['Advanced specialization', 'Research projects', 'Industry leadership']
          },
          master: {
            score: 95,
            title: 'Master',
            description: 'Industry-leading technical mastery and influence',
            characteristics: ['Industry recognition', 'Transformative innovation', 'Strategic impact'],
            behavioralIndicators: ['Shapes industry practices', 'Publishes thought leadership', 'Influences standards'],
            typicalExamples: ['Develops breakthrough technologies', 'Leads industry initiatives', 'Sets global standards'],
            developmentPath: ['Industry engagement', 'Research leadership', 'Global influence']
          }
        },
        industryStandards: {
          minimum: 60,
          average: 74,
          excellence: 85,
          topPercentile: 92
        },
        assessmentCriteria: [
          {
            id: 'problem_solving_accuracy',
            name: 'Problem Solving Accuracy',
            description: 'Correctness of technical solutions',
            weight: 0.3,
            scoreRange: {min: 0, max: 100},
            rubric: {
              90: 'Consistently accurate solutions with innovative approaches',
              75: 'Generally accurate solutions with good methodology',
              60: 'Adequate solutions with standard approaches',
              40: 'Solutions work but may have inefficiencies',
              20: 'Solutions partially address problems'
            }
          },
          {
            id: 'efficiency',
            name: 'Technical Efficiency',
            description: 'Speed and resource optimization in technical work',
            weight: 0.25,
            scoreRange: {min: 0, max: 100},
            rubric: {
              90: 'Exceptionally efficient with optimized approaches',
              75: 'Good efficiency with effective methods',
              60: 'Adequate efficiency for routine tasks',
              40: 'Slower than average but completes tasks',
              20: 'Inefficient approach requiring improvement'
            }
          }
        ]
      },
      {
        competencyId: 'communicationSkills',
        name: 'Communication Skills',
        category: 'communication',
        description: 'Ability to effectively exchange information and ideas',
        subCompetencies: [
          {
            id: 'verbal_communication',
            name: 'Verbal Communication',
            description: 'Clear and effective spoken communication',
            weight: 0.3,
            measurementType: 'behavioral',
            keyIndicators: ['Clarity of speech', 'Active listening', 'Appropriate tone']
          },
          {
            id: 'written_communication',
            name: 'Written Communication',
            description: 'Clear and professional written communication',
            weight: 0.25,
            measurementType: 'output',
            keyIndicators: ['Writing clarity', 'Professional tone', 'Appropriate format']
          },
          {
            id: 'presentation_skills',
            name: 'Presentation Skills',
            description: 'Effective presentation and training abilities',
            weight: 0.2,
            measurementType: 'behavioral',
            keyIndicators: ['Presentation clarity', 'Audience engagement', 'Visual aids use']
          },
          {
            id: 'cross_cultural',
            name: 'Cross-Cultural Communication',
            description: 'Effective communication across cultural differences',
            weight: 0.15,
            measurementType: 'behavioral',
            keyIndicators: ['Cultural sensitivity', 'Adaptation to audience', 'Inclusive language']
          },
          {
            id: 'conflict_resolution',
            name: 'Conflict Resolution',
            description: 'Managing and resolving communication conflicts',
            weight: 0.1,
            measurementType: 'behavioral',
            keyIndicators: ['De-escalation skills', 'Finding common ground', 'Win-win solutions']
          }
        ],
        benchmarkLevels: {
          novice: {
            score: 45,
            title: 'Developing Communicator',
            description: 'Basic communication skills with room for improvement',
            characteristics: ['Clear but basic communication', 'Limited adaptation', 'Follows templates'],
            behavioralIndicators: ['Uses simple language', 'Sticks to scripts', 'Asks for communication help'],
            typicalExamples: ['Reads from prepared materials', 'Basic email communication', 'Simple presentations'],
            developmentPath: ['Communication workshops', 'Public speaking practice', 'Writing courses']
          },
          competent: {
            score: 65,
            title: 'Effective Communicator',
            description: 'Reliable communication across most situations',
            characteristics: ['Clear and professional', 'Good adaptation', 'Appropriate tone'],
            behavioralIndicators: ['Communicates confidently', 'Adapts to audience', 'Uses appropriate channels'],
            typicalExamples: ['Delivers clear explanations', 'Writes professional emails', 'Handles routine presentations'],
            developmentPath: ['Advanced communication skills', 'Leadership communication', 'Specialized training']
          },
          proficient: {
            score: 80,
            title: 'Skilled Communicator',
            description: 'Strong communication with situational mastery',
            characteristics: ['Persuasive and engaging', 'Excellent adaptation', 'Builds rapport'],
            behavioralIndicators: ['Influences through communication', 'Builds strong relationships', 'Handles difficult conversations'],
            typicalExamples: ['Leads effective meetings', 'Creates compelling presentations', 'Resolves conflicts'],
            developmentPath: ['Executive communication', 'Advanced presentation skills', 'Coaching others']
          },
          expert: {
            score: 90,
            title: 'Master Communicator',
            description: 'Exceptional communication and influence',
            characteristics: ['Inspirational speaker', 'Thought leader', 'Communication coach'],
            behavioralIndicators: ['Inspires and motivates', 'Shapes opinions', 'Mentors communication skills'],
            typicalExamples: ['Keynote presentations', 'Published thought leadership', 'Communication training'],
            developmentPath: ['Thought leadership', 'Industry speaking', 'Communication expertise']
          },
          master: {
            score: 95,
            title: 'Communication Leader',
            description: 'Industry-recognized communication excellence',
            characteristics: ['Global influence', 'Communication innovation', 'Standard setting'],
            behavioralIndicators: ['Shapes communication practices', 'Industry recognition', 'Global platform'],
            typicalExamples: ['International speaking', 'Communication standards', 'Media appearances'],
            developmentPath: ['Global leadership', 'Industry influence', 'Communication research']
          }
        },
        industryStandards: {
          minimum: 65,
          average: 76,
          excellence: 87,
          topPercentile: 93
        },
        assessmentCriteria: [
          {
            id: 'clarity',
            name: 'Communication Clarity',
            description: 'Clearness and understandability of communication',
            weight: 0.4,
            scoreRange: {min: 0, max: 100},
            rubric: {
              90: 'Exceptionally clear with perfect understanding',
              75: 'Very clear with good comprehension',
              60: 'Generally clear with minor confusion',
              40: 'Somewhat unclear requiring clarification',
              20: 'Unclear causing frequent misunderstanding'
            }
          }
        ]
      }
    ];

    benchmarks.forEach(benchmark => {
      this.competencyBenchmarks.set(benchmark.competencyId, benchmark);
    });
  }

  private async analyzeSingleCompetency(
    competencyId: string,
    currentScore: number,
    benchmark: CompetencyBenchmark,
    targetLevel: keyof CompetencyBenchmark['benchmarkLevels']
  ): Promise<CompetencyAnalysis> {
    const targetScore = benchmark.benchmarkLevels[targetLevel].score;
    const currentLevel = this.determineCurrentLevel(currentScore, benchmark);
    
    const subCompetencyBreakdown = this.analyzeSubCompetencies(currentScore, benchmark);
    const industryComparison = this.compareToIndustryStandards(currentScore, benchmark);
    const developmentGaps = this.identifyDevelopmentGaps(currentScore, targetScore, benchmark);
    const strengthAreas = this.identifyStrengthAreas(subCompetencyBreakdown);
    const priorityActions = this.generatePriorityActions(competencyId, developmentGaps);

    return {
      competencyId,
      competencyName: benchmark.name,
      currentScore,
      targetScore,
      currentLevel,
      targetLevel,
      subCompetencyBreakdown,
      industryComparison,
      developmentGaps,
      strengthAreas,
      priorityActions
    };
  }

  private determineCurrentLevel(score: number, benchmark: CompetencyBenchmark): 'novice' | 'competent' | 'proficient' | 'expert' | 'master' {
    const levels = benchmark.benchmarkLevels;
    
    if (score >= levels.master.score) return 'master';
    if (score >= levels.expert.score) return 'expert';
    if (score >= levels.proficient.score) return 'proficient';
    if (score >= levels.competent.score) return 'competent';
    return 'novice';
  }

  private analyzeSubCompetencies(currentScore: number, benchmark: CompetencyBenchmark): CompetencyAnalysis['subCompetencyBreakdown'] {
    return benchmark.subCompetencies.map(subComp => {
      const contribution = currentScore * subComp.weight;
      let status: 'strength' | 'adequate' | 'needs_improvement' | 'critical_gap';
      
      if (contribution >= benchmark.industryStandards.excellence * subComp.weight) status = 'strength';
      else if (contribution >= benchmark.industryStandards.average * subComp.weight) status = 'adequate';
      else if (contribution >= benchmark.industryStandards.minimum * subComp.weight) status = 'needs_improvement';
      else status = 'critical_gap';

      return {
        subCompetencyId: subComp.id,
        name: subComp.name,
        currentScore: Math.round(contribution / subComp.weight),
        weight: subComp.weight,
        contribution,
        status,
        recommendations: this.generateSubCompetencyRecommendations(subComp.id, status)
      };
    });
  }

  private compareToIndustryStandards(score: number, benchmark: CompetencyBenchmark): CompetencyAnalysis['industryComparison'] {
    const standards = benchmark.industryStandards;
    const percentile = this.calculateIndustryPercentile(score, standards);
    
    return {
      percentile,
      vsMinimum: score - standards.minimum,
      vsAverage: score - standards.average,
      vsExcellence: score - standards.excellence,
      ranking: this.getPerformanceRanking(percentile)
    };
  }

  private identifyDevelopmentGaps(currentScore: number, targetScore: number, benchmark: CompetencyBenchmark): CompetencyGap[] {
    const gaps: CompetencyGap[] = [];
    const overallGap = targetScore - currentScore;

    if (overallGap <= 0) return gaps;

    benchmark.subCompetencies.forEach(subComp => {
      const subCompGap = (overallGap * subComp.weight);
      if (subCompGap > 2) { // Only include significant gaps
        gaps.push({
          subCompetencyId: subComp.id,
          gapSize: subCompGap,
          impactLevel: this.assessGapImpact(subCompGap, subComp.weight),
          developmentEffort: this.assessDevelopmentEffort(subCompGap),
          timeToClose: this.estimateGapClosureTime(subCompGap),
          recommendedApproaches: this.getGapClosureApproaches(subComp.id, subCompGap)
        });
      }
    });

    return gaps.sort((a, b) => b.gapSize - a.gapSize);
  }

  private identifyStrengthAreas(subCompetencyBreakdown: CompetencyAnalysis['subCompetencyBreakdown']): string[] {
    return subCompetencyBreakdown
      .filter(subComp => subComp.status === 'strength')
      .map(subComp => subComp.name);
  }

  private generatePriorityActions(competencyId: string, gaps: CompetencyGap[]): PriorityAction[] {
    const actions: PriorityAction[] = [];

    // Immediate actions for critical gaps
    gaps.filter(gap => gap.impactLevel === 'critical').forEach(gap => {
      actions.push({
        actionType: 'training',
        priority: 'immediate',
        title: `Address Critical Gap in ${gap.subCompetencyId}`,
        description: `Critical development need with ${gap.gapSize.toFixed(1)} point gap`,
        expectedImpact: gap.gapSize,
        timeCommitment: '2-4 hours/week',
        resources: ['Training courses', 'Mentoring', 'Practice exercises'],
        successMetrics: ['Score improvement', 'Performance demonstration', 'Peer feedback']
      });
    });

    // Short-term actions for high impact gaps
    gaps.filter(gap => gap.impactLevel === 'high').forEach(gap => {
      actions.push({
        actionType: 'practice',
        priority: 'short_term',
        title: `Develop ${gap.subCompetencyId} Skills`,
        description: `Focused development with ${gap.gapSize.toFixed(1)} point improvement potential`,
        expectedImpact: gap.gapSize,
        timeCommitment: '1-2 hours/week',
        resources: ['Practice opportunities', 'Feedback sessions', 'Skill exercises'],
        successMetrics: ['Skill demonstration', 'Quality improvement', 'Consistency']
      });
    });

    return actions.sort((a, b) => {
      const priorityOrder = { immediate: 4, short_term: 3, medium_term: 2, long_term: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private buildCurrentProfile(scores: Record<string, number>): CompetencyRoadmap['currentProfile'] {
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    
    return {
      overallLevel: this.determineOverallLevel(avgScore),
      competencyScores: scores,
      strengths: this.identifyTopCompetencies(scores, 3),
      developmentAreas: this.identifyBottomCompetencies(scores, 3)
    };
  }

  private buildTargetProfile(targetScores: Record<string, number>, timeframe: string): CompetencyRoadmap['targetProfile'] {
    const avgTarget = Object.values(targetScores).reduce((a, b) => a + b, 0) / Object.values(targetScores).length;
    
    return {
      desiredLevel: this.determineOverallLevel(avgTarget),
      targetScores,
      careerAlignment: ['Professional advancement', 'Industry recognition', 'Leadership opportunities'],
      timeframe
    };
  }

  private async createDevelopmentPlan(
    currentScores: Record<string, number>,
    targetScores: Record<string, number>,
    timeframe: string
  ): Promise<CompetencyRoadmap['developmentPlan']> {
    const phases = this.createDevelopmentPhases(currentScores, targetScores, timeframe);
    const milestones = this.createDevelopmentMilestones(targetScores, timeframe);
    const effortDistribution = this.calculateEffortDistribution(currentScores, targetScores);

    return {
      phases,
      milestones,
      totalDuration: timeframe,
      effortDistribution
    };
  }

  private defineTrackingMetrics(competencies: string[]): CompetencyRoadmap['trackingMetrics'] {
    return {
      progressIndicators: competencies.map(comp => `${comp} score improvement`),
      assessmentSchedule: ['Monthly self-assessment', 'Quarterly peer review', 'Bi-annual formal evaluation'],
      reviewPoints: ['3-month checkpoint', '6-month review', '9-month assessment', 'Annual evaluation']
    };
  }

  // Additional helper methods with simplified implementations

  private getPeerCompetencyData(competencyId: string, peerGroup: string): {average: number; median: number; scores: number[]} {
    // Mock peer data - in real implementation, this would query actual peer data
    const baseAverage = 74;
    const variation = 8;
    
    return {
      average: baseAverage + (Math.random() - 0.5) * variation,
      median: baseAverage + (Math.random() - 0.5) * variation * 0.8,
      scores: Array.from({length: 100}, () => baseAverage + (Math.random() - 0.5) * variation * 2)
    };
  }

  private calculatePercentile(score: number, peerData: {scores: number[]}): number {
    const sortedScores = peerData.scores.sort((a, b) => a - b);
    const position = sortedScores.filter(s => s < score).length;
    return Math.round((position / sortedScores.length) * 100);
  }

  private getPerformanceRanking(percentile: number): string {
    if (percentile >= 95) return 'Exceptional';
    if (percentile >= 85) return 'Excellent';
    if (percentile >= 75) return 'Above Average';
    if (percentile >= 50) return 'Average';
    if (percentile >= 25) return 'Below Average';
    return 'Needs Improvement';
  }

  private generateGapAnalysis(userScore: number, peerData: {average: number}): string {
    const gap = userScore - peerData.average;
    if (gap > 10) return `Significantly above peer average (+${gap.toFixed(1)} points)`;
    if (gap > 5) return `Above peer average (+${gap.toFixed(1)} points)`;
    if (gap > -5) return `Near peer average (${gap.toFixed(1)} points)`;
    if (gap > -10) return `Below peer average (${gap.toFixed(1)} points)`;
    return `Significantly below peer average (${gap.toFixed(1)} points)`;
  }

  private assessImprovementPotential(userScore: number, peerData: {average: number; scores: number[]}): string {
    const maxScore = Math.max(...peerData.scores);
    const potential = maxScore - userScore;
    
    if (potential > 20) return 'High improvement potential';
    if (potential > 10) return 'Moderate improvement potential';
    if (potential > 5) return 'Some improvement potential';
    return 'Limited improvement potential';
  }

  // Simplified implementations for remaining helper methods
  private identifyQuickWins(competencyId: string, gap: number, userContext?: any): PriorityAction[] {
    return [{
      actionType: 'training',
      priority: 'immediate',
      title: 'Quick Skill Boost',
      description: 'Immediate actions for rapid improvement',
      expectedImpact: Math.min(gap * 0.3, 10),
      timeCommitment: '1-2 hours',
      resources: ['Online tutorials', 'Quick reference guides'],
      successMetrics: ['Immediate skill demonstration']
    }];
  }

  private recommendStructuredLearning(competencyId: string, gap: number, userContext?: any): PriorityAction[] {
    return [{
      actionType: 'training',
      priority: 'short_term',
      title: 'Structured Learning Program',
      description: 'Comprehensive skill development program',
      expectedImpact: Math.min(gap * 0.6, 20),
      timeCommitment: '3-5 hours/week',
      resources: ['Training courses', 'Certification programs'],
      successMetrics: ['Course completion', 'Skill assessment']
    }];
  }

  private suggestPracticalApplication(competencyId: string, gap: number, userContext?: any): PriorityAction[] {
    return [{
      actionType: 'practice',
      priority: 'medium_term',
      title: 'Hands-on Practice',
      description: 'Real-world application opportunities',
      expectedImpact: Math.min(gap * 0.4, 15),
      timeCommitment: '2-3 hours/week',
      resources: ['Practice projects', 'Mentored activities'],
      successMetrics: ['Project completion', 'Quality improvement']
    }];
  }

  private planLongTermDevelopment(competencyId: string, gap: number, userContext?: any): PriorityAction[] {
    return [{
      actionType: 'project_assignment',
      priority: 'long_term',
      title: 'Long-term Development',
      description: 'Sustained development over time',
      expectedImpact: gap,
      timeCommitment: '1-2 hours/week',
      resources: ['Advanced training', 'Leadership opportunities'],
      successMetrics: ['Long-term improvement', 'Leadership demonstration']
    }];
  }

  private identifyResourceNeeds(competencyId: string, gap: number): string[] {
    return ['Training budget', 'Time allocation', 'Mentoring support', 'Practice opportunities'];
  }

  private estimateTimeframe(gap: number, availableTime?: string): string {
    if (gap <= 5) return '1-2 months';
    if (gap <= 10) return '3-4 months';
    if (gap <= 15) return '6-8 months';
    return '8-12 months';
  }

  private generateSubCompetencyRecommendations(subCompetencyId: string, status: string): string[] {
    const recommendations: Record<string, string[]> = {
      strength: ['Leverage this strength', 'Mentor others', 'Take on challenging projects'],
      adequate: ['Maintain current level', 'Seek growth opportunities', 'Build on foundation'],
      needs_improvement: ['Focus development effort', 'Seek additional training', 'Practice regularly'],
      critical_gap: ['Immediate attention needed', 'Intensive development program', 'Seek expert guidance']
    };
    
    return recommendations[status] || ['Continue development'];
  }

  private calculateIndustryPercentile(score: number, standards: CompetencyBenchmark['industryStandards']): number {
    // Simplified percentile calculation
    if (score >= standards.topPercentile) return 95;
    if (score >= standards.excellence) return 85;
    if (score >= standards.average) return 60;
    if (score >= standards.minimum) return 30;
    return 15;
  }

  private assessGapImpact(gapSize: number, weight: number): 'low' | 'medium' | 'high' | 'critical' {
    const weightedGap = gapSize * weight;
    if (weightedGap > 10) return 'critical';
    if (weightedGap > 6) return 'high';
    if (weightedGap > 3) return 'medium';
    return 'low';
  }

  private assessDevelopmentEffort(gapSize: number): 'minimal' | 'moderate' | 'significant' | 'extensive' {
    if (gapSize > 15) return 'extensive';
    if (gapSize > 10) return 'significant';
    if (gapSize > 5) return 'moderate';
    return 'minimal';
  }

  private estimateGapClosureTime(gapSize: number): string {
    if (gapSize > 15) return '6-12 months';
    if (gapSize > 10) return '3-6 months';
    if (gapSize > 5) return '1-3 months';
    return '2-4 weeks';
  }

  private getGapClosureApproaches(subCompetencyId: string, gapSize: number): string[] {
    return ['Targeted training', 'Mentoring support', 'Practice opportunities', 'Feedback sessions'];
  }

  private determineOverallLevel(avgScore: number): string {
    if (avgScore >= 90) return 'Expert';
    if (avgScore >= 80) return 'Proficient';
    if (avgScore >= 70) return 'Competent';
    if (avgScore >= 60) return 'Developing';
    return 'Novice';
  }

  private identifyTopCompetencies(scores: Record<string, number>, count: number): string[] {
    return Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([name]) => name);
  }

  private identifyBottomCompetencies(scores: Record<string, number>, count: number): string[] {
    return Object.entries(scores)
      .sort(([,a], [,b]) => a - b)
      .slice(0, count)
      .map(([name]) => name);
  }

  private createDevelopmentPhases(currentScores: Record<string, number>, targetScores: Record<string, number>, timeframe: string): RoadmapPhase[] {
    return [
      {
        phaseNumber: 1,
        name: 'Foundation Building',
        duration: '3 months',
        objectives: ['Address critical gaps', 'Build fundamental skills'],
        targetCompetencies: Object.keys(currentScores),
        activities: [{
          id: 'foundation-training',
          name: 'Foundation Training',
          type: 'learning',
          description: 'Core competency development',
          duration: '2 months',
          effort: 'medium',
          deliverables: ['Training completion', 'Skills assessment'],
          competencyContribution: Object.fromEntries(Object.keys(currentScores).map(k => [k, 5]))
        }],
        successCriteria: ['10% improvement in all competencies'],
        prerequisites: ['Commitment to development', 'Time allocation']
      }
    ];
  }

  private createDevelopmentMilestones(targetScores: Record<string, number>, timeframe: string): Milestone[] {
    return [{
      id: 'mid-point-assessment',
      name: 'Mid-Point Assessment',
      description: 'Evaluate progress at halfway point',
      targetDate: '6 months',
      competencyTargets: Object.fromEntries(Object.entries(targetScores).map(([k, v]) => [k, v * 0.7])),
      assessmentMethod: 'Comprehensive evaluation',
      rewards: ['Recognition', 'Advancement opportunity'],
      consequences: ['Additional support', 'Plan adjustment']
    }];
  }

  private calculateEffortDistribution(currentScores: Record<string, number>, targetScores: Record<string, number>): Record<string, number> {
    const distribution: Record<string, number> = {};
    const totalGap = Object.entries(targetScores).reduce((sum, [key, target]) => 
      sum + Math.max(0, target - (currentScores[key] || 0)), 0);

    Object.entries(targetScores).forEach(([key, target]) => {
      const gap = Math.max(0, target - (currentScores[key] || 0));
      distribution[key] = totalGap > 0 ? gap / totalGap : 0;
    });

    return distribution;
  }
}

export const competencyBenchmarking = new CompetencyBenchmarking();