import { logger } from '../utils/logger';

interface JobRole {
  id: string;
  title: string;
  level: 'entry' | 'intermediate' | 'senior' | 'expert';
  category: 'support' | 'analyst' | 'specialist' | 'management';
  requirements: {
    technical: CompetencyRequirement;
    communication: CompetencyRequirement;
    customerService: CompetencyRequirement;
    problemSolving: CompetencyRequirement;
    processCompliance: CompetencyRequirement;
    learningAgility: CompetencyRequirement;
  };
  preferredQualifications: string[];
  industryDemand: 'low' | 'moderate' | 'high' | 'very_high';
  salaryRange: {
    min: number;
    max: number;
    currency: string;
    region: string;
  };
  growthPotential: 'limited' | 'moderate' | 'high' | 'excellent';
}

interface CompetencyRequirement {
  minimum: number;
  preferred: number;
  weight: number; // 0-1, importance in overall assessment
  criticalSkills: string[];
}

interface ReadinessAssessment {
  jobRole: JobRole;
  overallReadiness: number; // 0-100
  readinessLevel: 'not_ready' | 'developing' | 'ready' | 'well_qualified' | 'overqualified';
  competencyAnalysis: {
    [key: string]: {
      currentScore: number;
      requiredScore: number;
      preferredScore: number;
      gap: number;
      status: 'exceeds' | 'meets_preferred' | 'meets_minimum' | 'below_minimum';
      priority: 'high' | 'medium' | 'low';
    };
  };
  strengthAreas: string[];
  developmentAreas: string[];
  recommendations: ReadinessRecommendation[];
  timeToReadiness: {
    minimum: string;
    realistic: string;
    accelerated: string;
  };
  certificationEligibility: CertificationEligibility[];
}

interface ReadinessRecommendation {
  type: 'skill_development' | 'certification' | 'experience' | 'portfolio';
  priority: 'immediate' | 'short_term' | 'long_term';
  title: string;
  description: string;
  actionItems: string[];
  resources: string[];
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
}

interface CertificationEligibility {
  certificationId: string;
  name: string;
  provider: string;
  eligible: boolean;
  requirements: Array<{
    requirement: string;
    met: boolean;
    gap?: string;
  }>;
  relevanceToRole: 'essential' | 'highly_relevant' | 'relevant' | 'nice_to_have';
  estimatedPreparationTime: string;
}

interface CareerProgression {
  currentLevel: 'entry' | 'intermediate' | 'senior' | 'expert';
  nextLevel: 'intermediate' | 'senior' | 'expert' | 'leadership';
  progressionPath: Array<{
    role: string;
    timeframe: string;
    requirements: string[];
    preparationSteps: string[];
  }>;
  alternativePaths: Array<{
    specialization: string;
    description: string;
    requirements: string[];
    marketDemand: string;
  }>;
}

interface MarketAnalysis {
  jobAvailability: 'limited' | 'moderate' | 'good' | 'excellent';
  competitionLevel: 'low' | 'moderate' | 'high' | 'very_high';
  averageSalary: {
    amount: number;
    currency: string;
    region: string;
  };
  growthProjection: 'declining' | 'stable' | 'growing' | 'rapidly_growing';
  keyEmployers: string[];
  emergingSkills: string[];
  industryTrends: string[];
}

class JobReadinessAssessor {
  private jobRoles: Map<string, JobRole> = new Map();
  private marketData: Map<string, MarketAnalysis> = new Map();

  constructor() {
    this.initializeJobRoles();
    this.initializeMarketData();
  }

  /**
   * Assess user readiness for specific job roles
   */
  async assessJobReadiness(
    userScores: Record<string, number>,
    targetRoles: string[],
    userProfile?: {
      experienceLevel: string;
      currentRole?: string;
      yearsExperience?: number;
      certifications?: string[];
      location?: string;
    }
  ): Promise<ReadinessAssessment[]> {
    try {
      logger.info(`Assessing job readiness for roles: ${targetRoles.join(', ')}`);

      const assessments: ReadinessAssessment[] = [];

      for (const roleId of targetRoles) {
        const jobRole = this.jobRoles.get(roleId);
        if (!jobRole) {
          logger.warn(`Job role ${roleId} not found`);
          continue;
        }

        const assessment = await this.assessSingleRole(userScores, jobRole, userProfile);
        assessments.push(assessment);
      }

      return assessments.sort((a, b) => b.overallReadiness - a.overallReadiness);
    } catch (error) {
      logger.error('Error assessing job readiness:', error);
      throw new Error('Failed to assess job readiness');
    }
  }

  /**
   * Get recommended job roles based on user competencies
   */
  async getRecommendedRoles(
    userScores: Record<string, number>,
    preferences?: {
      level?: string;
      category?: string;
      salaryRange?: {min: number; max: number};
      location?: string;
    }
  ): Promise<Array<{role: JobRole; fitScore: number; reasoning: string[]}>> {
    try {
      logger.info('Getting recommended job roles based on user competencies');

      const recommendations: Array<{role: JobRole; fitScore: number; reasoning: string[]}> = [];

      for (const role of this.jobRoles.values()) {
        // Apply preference filters
        if (preferences?.level && role.level !== preferences.level) continue;
        if (preferences?.category && role.category !== preferences.category) continue;
        
        const fitScore = this.calculateRoleFitScore(userScores, role);
        const reasoning = this.generateFitReasoning(userScores, role, fitScore);

        if (fitScore >= 0.6) { // Only recommend roles with 60%+ fit
          recommendations.push({ role, fitScore, reasoning });
        }
      }

      return recommendations
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      logger.error('Error getting recommended roles:', error);
      throw new Error('Failed to get role recommendations');
    }
  }

  /**
   * Generate career progression roadmap
   */
  async generateCareerProgression(
    userScores: Record<string, number>,
    currentRole: string,
    careerGoals: string[]
  ): Promise<CareerProgression> {
    try {
      logger.info(`Generating career progression from ${currentRole} toward ${careerGoals.join(', ')}`);

      const currentLevel = this.determineCurrentLevel(userScores);
      const nextLevel = this.getNextLevel(currentLevel);

      const progressionPath = await this.createProgressionPath(currentRole, careerGoals, userScores);
      const alternativePaths = await this.identifyAlternativePaths(userScores, currentLevel);

      return {
        currentLevel,
        nextLevel,
        progressionPath,
        alternativePaths
      };
    } catch (error) {
      logger.error('Error generating career progression:', error);
      throw new Error('Failed to generate career progression');
    }
  }

  /**
   * Analyze job market for specific roles
   */
  async analyzeJobMarket(
    roleIds: string[],
    location: string = 'global'
  ): Promise<Record<string, MarketAnalysis>> {
    try {
      logger.info(`Analyzing job market for roles: ${roleIds.join(', ')} in ${location}`);

      const analysis: Record<string, MarketAnalysis> = {};

      for (const roleId of roleIds) {
        const marketData = this.marketData.get(roleId);
        if (marketData) {
          analysis[roleId] = marketData;
        }
      }

      return analysis;
    } catch (error) {
      logger.error('Error analyzing job market:', error);
      throw new Error('Failed to analyze job market');
    }
  }

  /**
   * Get certification recommendations for target roles
   */
  async getCertificationRecommendations(
    userScores: Record<string, number>,
    targetRoles: string[],
    userCertifications: string[] = []
  ): Promise<Array<{
    certification: CertificationEligibility;
    relevantRoles: string[];
    priorityScore: number;
  }>> {
    try {
      logger.info('Getting certification recommendations');

      const recommendations: Array<{
        certification: CertificationEligibility;
        relevantRoles: string[];
        priorityScore: number;
      }> = [];

      const availableCertifications = this.getAvailableCertifications();

      for (const cert of availableCertifications) {
        if (userCertifications.includes(cert.certificationId)) continue;

        const eligibility = this.assessCertificationEligibility(cert, userScores);
        const relevantRoles = targetRoles.filter(roleId => 
          this.isCertificationRelevantToRole(cert.certificationId, roleId)
        );

        if (relevantRoles.length > 0 && eligibility.eligible) {
          const priorityScore = this.calculateCertificationPriority(cert, relevantRoles, userScores);
          recommendations.push({
            certification: eligibility,
            relevantRoles,
            priorityScore
          });
        }
      }

      return recommendations
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 8);
    } catch (error) {
      logger.error('Error getting certification recommendations:', error);
      throw new Error('Failed to get certification recommendations');
    }
  }

  // Private helper methods

  private initializeJobRoles(): void {
    const roles: JobRole[] = [
      {
        id: 'help-desk-technician',
        title: 'Help Desk Technician',
        level: 'entry',
        category: 'support',
        requirements: {
          technical: { minimum: 60, preferred: 70, weight: 0.3, criticalSkills: ['basic troubleshooting', 'hardware knowledge'] },
          communication: { minimum: 70, preferred: 80, weight: 0.25, criticalSkills: ['clear communication', 'active listening'] },
          customerService: { minimum: 75, preferred: 85, weight: 0.25, criticalSkills: ['patience', 'empathy'] },
          problemSolving: { minimum: 60, preferred: 70, weight: 0.1, criticalSkills: ['logical thinking'] },
          processCompliance: { minimum: 70, preferred: 80, weight: 0.05, criticalSkills: ['following procedures'] },
          learningAgility: { minimum: 65, preferred: 75, weight: 0.05, criticalSkills: ['adaptability'] }
        },
        preferredQualifications: ['CompTIA A+', 'Customer Service Certification'],
        industryDemand: 'high',
        salaryRange: { min: 35000, max: 45000, currency: 'USD', region: 'US' },
        growthPotential: 'moderate'
      },
      {
        id: 'it-support-specialist',
        title: 'IT Support Specialist',
        level: 'intermediate',
        category: 'support',
        requirements: {
          technical: { minimum: 75, preferred: 85, weight: 0.35, criticalSkills: ['advanced troubleshooting', 'network basics', 'system administration'] },
          communication: { minimum: 75, preferred: 85, weight: 0.2, criticalSkills: ['technical writing', 'user training'] },
          customerService: { minimum: 70, preferred: 80, weight: 0.2, criticalSkills: ['professional service', 'escalation management'] },
          problemSolving: { minimum: 75, preferred: 85, weight: 0.15, criticalSkills: ['analytical thinking', 'root cause analysis'] },
          processCompliance: { minimum: 75, preferred: 85, weight: 0.05, criticalSkills: ['ITIL basics'] },
          learningAgility: { minimum: 70, preferred: 80, weight: 0.05, criticalSkills: ['continuous learning'] }
        },
        preferredQualifications: ['CompTIA Network+', 'Microsoft certifications', 'ITIL Foundation'],
        industryDemand: 'very_high',
        salaryRange: { min: 45000, max: 65000, currency: 'USD', region: 'US' },
        growthPotential: 'high'
      },
      {
        id: 'systems-analyst',
        title: 'Systems Analyst',
        level: 'intermediate',
        category: 'analyst',
        requirements: {
          technical: { minimum: 80, preferred: 90, weight: 0.4, criticalSkills: ['system analysis', 'business requirements', 'technical documentation'] },
          communication: { minimum: 80, preferred: 90, weight: 0.25, criticalSkills: ['stakeholder communication', 'presentation skills'] },
          customerService: { minimum: 70, preferred: 80, weight: 0.1, criticalSkills: ['internal customer service'] },
          problemSolving: { minimum: 85, preferred: 95, weight: 0.2, criticalSkills: ['complex problem solving', 'business analysis'] },
          processCompliance: { minimum: 75, preferred: 85, weight: 0.03, criticalSkills: ['project management'] },
          learningAgility: { minimum: 80, preferred: 90, weight: 0.02, criticalSkills: ['technology adaptation'] }
        },
        preferredQualifications: ['Business Analysis certification', 'Project Management certification', 'Systems analysis training'],
        industryDemand: 'high',
        salaryRange: { min: 60000, max: 85000, currency: 'USD', region: 'US' },
        growthPotential: 'excellent'
      },
      {
        id: 'technical-specialist',
        title: 'Technical Specialist',
        level: 'advanced',
        category: 'specialist',
        requirements: {
          technical: { minimum: 85, preferred: 95, weight: 0.45, criticalSkills: ['expert troubleshooting', 'specialized technologies', 'mentoring'] },
          communication: { minimum: 75, preferred: 85, weight: 0.2, criticalSkills: ['technical leadership', 'knowledge transfer'] },
          customerService: { minimum: 70, preferred: 80, weight: 0.1, criticalSkills: ['escalation handling'] },
          problemSolving: { minimum: 85, preferred: 95, weight: 0.2, criticalSkills: ['complex system analysis', 'innovation'] },
          processCompliance: { minimum: 75, preferred: 85, weight: 0.03, criticalSkills: ['best practices'] },
          learningAgility: { minimum: 80, preferred: 90, weight: 0.02, criticalSkills: ['emerging technologies'] }
        },
        preferredQualifications: ['Advanced technical certifications', 'Specialization training', 'Leadership experience'],
        industryDemand: 'moderate',
        salaryRange: { min: 70000, max: 95000, currency: 'USD', region: 'US' },
        growthPotential: 'high'
      },
      {
        id: 'senior-support-engineer',
        title: 'Senior Support Engineer',
        level: 'senior',
        category: 'support',
        requirements: {
          technical: { minimum: 85, preferred: 95, weight: 0.35, criticalSkills: ['enterprise systems', 'architecture knowledge', 'automation'] },
          communication: { minimum: 80, preferred: 90, weight: 0.25, criticalSkills: ['executive communication', 'team leadership'] },
          customerService: { minimum: 75, preferred: 85, weight: 0.15, criticalSkills: ['strategic relationship management'] },
          problemSolving: { minimum: 85, preferred: 95, weight: 0.2, criticalSkills: ['strategic thinking', 'system optimization'] },
          processCompliance: { minimum: 80, preferred: 90, weight: 0.03, criticalSkills: ['process improvement'] },
          learningAgility: { minimum: 80, preferred: 90, weight: 0.02, criticalSkills: ['strategic technology adoption'] }
        },
        preferredQualifications: ['Senior-level certifications', 'Management training', 'Enterprise experience'],
        industryDemand: 'moderate',
        salaryRange: { min: 85000, max: 120000, currency: 'USD', region: 'US' },
        growthPotential: 'excellent'
      }
    ];

    roles.forEach(role => {
      this.jobRoles.set(role.id, role);
    });
  }

  private initializeMarketData(): void {
    const marketData: Array<{roleId: string; data: MarketAnalysis}> = [
      {
        roleId: 'help-desk-technician',
        data: {
          jobAvailability: 'excellent',
          competitionLevel: 'moderate',
          averageSalary: { amount: 40000, currency: 'USD', region: 'US' },
          growthProjection: 'stable',
          keyEmployers: ['MSPs', 'Corporations', 'Healthcare', 'Education'],
          emergingSkills: ['Remote support tools', 'Cloud basics', 'Mobile device management'],
          industryTrends: ['Increased remote work', 'Cloud migration', 'AI-assisted support']
        }
      },
      {
        roleId: 'it-support-specialist',
        data: {
          jobAvailability: 'excellent',
          competitionLevel: 'moderate',
          averageSalary: { amount: 55000, currency: 'USD', region: 'US' },
          growthProjection: 'growing',
          keyEmployers: ['Technology companies', 'Financial services', 'Healthcare', 'Government'],
          emergingSkills: ['Cloud platforms', 'Cybersecurity basics', 'DevOps tools'],
          industryTrends: ['Digital transformation', 'Hybrid infrastructure', 'Security focus']
        }
      },
      {
        roleId: 'systems-analyst',
        data: {
          jobAvailability: 'good',
          competitionLevel: 'high',
          averageSalary: { amount: 72500, currency: 'USD', region: 'US' },
          growthProjection: 'rapidly_growing',
          keyEmployers: ['Consulting firms', 'Technology companies', 'Financial services', 'Government'],
          emergingSkills: ['Data analytics', 'Business intelligence', 'Agile methodologies'],
          industryTrends: ['Digital transformation', 'Data-driven decisions', 'Process automation']
        }
      },
      {
        roleId: 'technical-specialist',
        data: {
          jobAvailability: 'moderate',
          competitionLevel: 'high',
          averageSalary: { amount: 82500, currency: 'USD', region: 'US' },
          growthProjection: 'growing',
          keyEmployers: ['Technology vendors', 'Large enterprises', 'Consulting firms'],
          emergingSkills: ['AI/ML technologies', 'Advanced automation', 'Cloud architecture'],
          industryTrends: ['Specialization demand', 'Emerging technologies', 'Expert consulting']
        }
      },
      {
        roleId: 'senior-support-engineer',
        data: {
          jobAvailability: 'moderate',
          competitionLevel: 'very_high',
          averageSalary: { amount: 102500, currency: 'USD', region: 'US' },
          growthProjection: 'growing',
          keyEmployers: ['Fortune 500', 'Technology leaders', 'Cloud providers'],
          emergingSkills: ['Strategic planning', 'Enterprise architecture', 'Digital leadership'],
          industryTrends: ['Leadership premium', 'Strategic roles', 'Cross-functional expertise']
        }
      }
    ];

    marketData.forEach(item => {
      this.marketData.set(item.roleId, item.data);
    });
  }

  private async assessSingleRole(
    userScores: Record<string, number>,
    jobRole: JobRole,
    userProfile?: any
  ): Promise<ReadinessAssessment> {
    const competencyAnalysis: ReadinessAssessment['competencyAnalysis'] = {};
    let weightedScore = 0;
    let totalWeight = 0;

    // Analyze each competency
    for (const [competency, requirement] of Object.entries(jobRole.requirements)) {
      const userScore = userScores[competency] || 0;
      const gap = Math.max(0, requirement.minimum - userScore);
      
      let status: 'exceeds' | 'meets_preferred' | 'meets_minimum' | 'below_minimum';
      if (userScore >= requirement.preferred) status = 'meets_preferred';
      else if (userScore >= requirement.minimum) status = 'meets_minimum';
      else status = 'below_minimum';

      if (userScore > requirement.preferred + 5) status = 'exceeds';

      const priority = gap > 15 ? 'high' : gap > 8 ? 'medium' : 'low';

      competencyAnalysis[competency] = {
        currentScore: userScore,
        requiredScore: requirement.minimum,
        preferredScore: requirement.preferred,
        gap,
        status,
        priority
      };

      // Calculate weighted contribution to overall readiness
      const competencyReadiness = Math.min(100, (userScore / requirement.minimum) * 100);
      weightedScore += competencyReadiness * requirement.weight;
      totalWeight += requirement.weight;
    }

    const overallReadiness = Math.round(weightedScore / totalWeight);
    const readinessLevel = this.determineReadinessLevel(overallReadiness);

    const strengthAreas = this.identifyStrengthAreas(competencyAnalysis);
    const developmentAreas = this.identifyDevelopmentAreas(competencyAnalysis);
    const recommendations = this.generateReadinessRecommendations(competencyAnalysis, jobRole);
    const timeToReadiness = this.estimateTimeToReadiness(competencyAnalysis, readinessLevel);
    const certificationEligibility = this.assessCertificationEligibilities(userScores, jobRole);

    return {
      jobRole,
      overallReadiness,
      readinessLevel,
      competencyAnalysis,
      strengthAreas,
      developmentAreas,
      recommendations,
      timeToReadiness,
      certificationEligibility
    };
  }

  private calculateRoleFitScore(userScores: Record<string, number>, role: JobRole): number {
    let fitScore = 0;
    let totalWeight = 0;

    for (const [competency, requirement] of Object.entries(role.requirements)) {
      const userScore = userScores[competency] || 0;
      const competencyFit = Math.min(1, userScore / requirement.preferred);
      
      fitScore += competencyFit * requirement.weight;
      totalWeight += requirement.weight;
    }

    return fitScore / totalWeight;
  }

  private generateFitReasoning(userScores: Record<string, number>, role: JobRole, fitScore: number): string[] {
    const reasoning: string[] = [];

    // Overall fit assessment
    if (fitScore >= 0.8) {
      reasoning.push('Excellent overall fit for this role');
    } else if (fitScore >= 0.6) {
      reasoning.push('Good fit with some development opportunities');
    } else {
      reasoning.push('Potential fit with focused skill development');
    }

    // Identify strongest areas
    const strengths = Object.entries(role.requirements)
      .filter(([competency, requirement]) => {
        const userScore = userScores[competency] || 0;
        return userScore >= requirement.preferred;
      })
      .map(([competency]) => competency);

    if (strengths.length > 0) {
      reasoning.push(`Strong in: ${strengths.join(', ')}`);
    }

    // Identify development areas
    const gaps = Object.entries(role.requirements)
      .filter(([competency, requirement]) => {
        const userScore = userScores[competency] || 0;
        return userScore < requirement.minimum;
      })
      .map(([competency]) => competency);

    if (gaps.length > 0) {
      reasoning.push(`Development needed in: ${gaps.join(', ')}`);
    }

    return reasoning;
  }

  private determineCurrentLevel(userScores: Record<string, number>): 'entry' | 'intermediate' | 'senior' | 'expert' {
    const avgScore = Object.values(userScores).reduce((a, b) => a + b, 0) / Object.values(userScores).length;
    
    if (avgScore >= 90) return 'expert';
    if (avgScore >= 80) return 'senior';
    if (avgScore >= 70) return 'intermediate';
    return 'entry';
  }

  private getNextLevel(currentLevel: 'entry' | 'intermediate' | 'senior' | 'expert'): 'intermediate' | 'senior' | 'expert' | 'leadership' {
    const progression = {
      'entry': 'intermediate' as const,
      'intermediate': 'senior' as const,
      'senior': 'expert' as const,
      'expert': 'leadership' as const
    };
    return progression[currentLevel];
  }

  private async createProgressionPath(
    currentRole: string,
    careerGoals: string[],
    userScores: Record<string, number>
  ): Promise<CareerProgression['progressionPath']> {
    // Simplified progression path generation
    const currentLevel = this.determineCurrentLevel(userScores);
    const path: CareerProgression['progressionPath'] = [];

    if (currentLevel === 'entry') {
      path.push({
        role: 'IT Support Specialist',
        timeframe: '1-2 years',
        requirements: ['Technical skills 75+', 'Experience with enterprise systems'],
        preparationSteps: ['Gain CompTIA certifications', 'Build troubleshooting expertise', 'Develop communication skills']
      });
    }

    if (currentLevel === 'entry' || currentLevel === 'intermediate') {
      path.push({
        role: 'Senior Support Engineer',
        timeframe: '3-5 years',
        requirements: ['Technical skills 85+', 'Leadership experience', 'Strategic thinking'],
        preparationSteps: ['Develop advanced technical skills', 'Gain team leadership experience', 'Build strategic perspective']
      });
    }

    return path;
  }

  private async identifyAlternativePaths(
    userScores: Record<string, number>,
    currentLevel: string
  ): Promise<CareerProgression['alternativePaths']> {
    const alternatives: CareerProgression['alternativePaths'] = [];

    // Identify user's strongest competency
    const strongestCompetency = Object.entries(userScores)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    if (strongestCompetency === 'technicalCompetency') {
      alternatives.push({
        specialization: 'Technical Specialist',
        description: 'Deep technical expertise in specific technologies',
        requirements: ['Advanced technical certifications', 'Specialized knowledge'],
        marketDemand: 'High in specialized areas'
      });
    }

    if (strongestCompetency === 'problemSolving') {
      alternatives.push({
        specialization: 'Systems Analyst',
        description: 'Business and systems analysis role',
        requirements: ['Business analysis skills', 'Process improvement expertise'],
        marketDemand: 'Very high, growing field'
      });
    }

    return alternatives;
  }

  private determineReadinessLevel(overallReadiness: number): 'not_ready' | 'developing' | 'ready' | 'well_qualified' | 'overqualified' {
    if (overallReadiness >= 120) return 'overqualified';
    if (overallReadiness >= 100) return 'well_qualified';
    if (overallReadiness >= 85) return 'ready';
    if (overallReadiness >= 65) return 'developing';
    return 'not_ready';
  }

  private identifyStrengthAreas(competencyAnalysis: ReadinessAssessment['competencyAnalysis']): string[] {
    return Object.entries(competencyAnalysis)
      .filter(([_, analysis]) => analysis.status === 'exceeds' || analysis.status === 'meets_preferred')
      .map(([competency, _]) => competency);
  }

  private identifyDevelopmentAreas(competencyAnalysis: ReadinessAssessment['competencyAnalysis']): string[] {
    return Object.entries(competencyAnalysis)
      .filter(([_, analysis]) => analysis.status === 'below_minimum')
      .sort(([_, a], [__, b]) => b.gap - a.gap)
      .map(([competency, _]) => competency);
  }

  private generateReadinessRecommendations(
    competencyAnalysis: ReadinessAssessment['competencyAnalysis'],
    jobRole: JobRole
  ): ReadinessRecommendation[] {
    const recommendations: ReadinessRecommendation[] = [];

    // High priority gaps
    const highPriorityGaps = Object.entries(competencyAnalysis)
      .filter(([_, analysis]) => analysis.priority === 'high')
      .sort(([_, a], [__, b]) => b.gap - a.gap);

    if (highPriorityGaps.length > 0) {
      const [competency, analysis] = highPriorityGaps[0];
      recommendations.push({
        type: 'skill_development',
        priority: 'immediate',
        title: `Develop ${competency} Skills`,
        description: `Critical gap of ${analysis.gap} points needs immediate attention`,
        actionItems: this.getCompetencyDevelopmentActions(competency),
        resources: this.getCompetencyResources(competency),
        timeframe: '1-3 months',
        impact: 'high'
      });
    }

    // Certification recommendations
    if (jobRole.preferredQualifications.length > 0) {
      recommendations.push({
        type: 'certification',
        priority: 'short_term',
        title: 'Pursue Relevant Certifications',
        description: 'Industry certifications will strengthen your candidacy',
        actionItems: jobRole.preferredQualifications.map(cert => `Study for ${cert}`),
        resources: ['Certification study guides', 'Practice exams', 'Training courses'],
        timeframe: '3-6 months',
        impact: 'high'
      });
    }

    // Experience building
    recommendations.push({
      type: 'experience',
      priority: 'long_term',
      title: 'Build Practical Experience',
      description: 'Gain hands-on experience in role-relevant activities',
      actionItems: [
        'Volunteer for relevant projects',
        'Seek stretch assignments',
        'Build a portfolio of work examples'
      ],
      resources: ['Internal projects', 'Volunteer opportunities', 'Side projects'],
      timeframe: '6-12 months',
      impact: 'medium'
    });

    return recommendations;
  }

  private estimateTimeToReadiness(
    competencyAnalysis: ReadinessAssessment['competencyAnalysis'],
    readinessLevel: string
  ): ReadinessAssessment['timeToReadiness'] {
    if (readinessLevel === 'ready' || readinessLevel === 'well_qualified') {
      return {
        minimum: 'Already ready',
        realistic: 'Already ready',
        accelerated: 'Already ready'
      };
    }

    const totalGap = Object.values(competencyAnalysis)
      .reduce((sum, analysis) => sum + Math.max(0, analysis.gap), 0);

    const avgGap = totalGap / Object.keys(competencyAnalysis).length;

    if (avgGap <= 5) {
      return {
        minimum: '2-4 weeks',
        realistic: '1-2 months',
        accelerated: '2-3 weeks'
      };
    } else if (avgGap <= 10) {
      return {
        minimum: '1-2 months',
        realistic: '3-4 months',
        accelerated: '4-6 weeks'
      };
    } else if (avgGap <= 15) {
      return {
        minimum: '3-4 months',
        realistic: '6-8 months',
        accelerated: '2-3 months'
      };
    } else {
      return {
        minimum: '6-8 months',
        realistic: '8-12 months',
        accelerated: '4-6 months'
      };
    }
  }

  private assessCertificationEligibilities(
    userScores: Record<string, number>,
    jobRole: JobRole
  ): CertificationEligibility[] {
    // Mock certification eligibility assessment
    return jobRole.preferredQualifications.map(certName => ({
      certificationId: certName.toLowerCase().replace(/\s+/g, '-'),
      name: certName,
      provider: 'Industry Standard',
      eligible: true, // Simplified - always eligible
      requirements: [
        { requirement: 'Minimum experience', met: true },
        { requirement: 'Basic competency', met: Object.values(userScores).every(score => score >= 60) }
      ],
      relevanceToRole: 'highly_relevant' as const,
      estimatedPreparationTime: '2-3 months'
    }));
  }

  private getAvailableCertifications(): Array<{certificationId: string; name: string}> {
    return [
      { certificationId: 'comptia-a-plus', name: 'CompTIA A+' },
      { certificationId: 'comptia-network-plus', name: 'CompTIA Network+' },
      { certificationId: 'itil-foundation', name: 'ITIL Foundation' },
      { certificationId: 'microsoft-fundamentals', name: 'Microsoft Fundamentals' },
      { certificationId: 'cisco-ccna', name: 'Cisco CCNA' }
    ];
  }

  private assessCertificationEligibility(
    cert: {certificationId: string; name: string},
    userScores: Record<string, number>
  ): CertificationEligibility {
    const avgScore = Object.values(userScores).reduce((a, b) => a + b, 0) / Object.values(userScores).length;
    
    return {
      certificationId: cert.certificationId,
      name: cert.name,
      provider: 'Industry Standard',
      eligible: avgScore >= 60,
      requirements: [
        { requirement: 'Basic competency (60+ average)', met: avgScore >= 60 },
        { requirement: 'Technical foundation', met: userScores.technicalCompetency >= 55 }
      ],
      relevanceToRole: 'highly_relevant',
      estimatedPreparationTime: '2-4 months'
    };
  }

  private isCertificationRelevantToRole(certificationId: string, roleId: string): boolean {
    // Simplified relevance mapping
    const relevanceMap: Record<string, string[]> = {
      'comptia-a-plus': ['help-desk-technician', 'it-support-specialist'],
      'comptia-network-plus': ['it-support-specialist', 'technical-specialist'],
      'itil-foundation': ['it-support-specialist', 'senior-support-engineer'],
      'microsoft-fundamentals': ['help-desk-technician', 'it-support-specialist'],
      'cisco-ccna': ['technical-specialist', 'senior-support-engineer']
    };

    return relevanceMap[certificationId]?.includes(roleId) || false;
  }

  private calculateCertificationPriority(
    cert: {certificationId: string; name: string},
    relevantRoles: string[],
    userScores: Record<string, number>
  ): number {
    let priority = 0;
    
    // Base priority from number of relevant roles
    priority += relevantRoles.length * 20;
    
    // Boost for foundational certifications
    if (cert.certificationId.includes('foundation') || cert.certificationId.includes('fundamentals')) {
      priority += 15;
    }
    
    // Boost based on user readiness
    const avgScore = Object.values(userScores).reduce((a, b) => a + b, 0) / Object.values(userScores).length;
    if (avgScore >= 70) priority += 10;
    
    return priority;
  }

  private getCompetencyDevelopmentActions(competency: string): string[] {
    const actions: Record<string, string[]> = {
      technicalCompetency: [
        'Complete hands-on technical training',
        'Practice troubleshooting scenarios',
        'Study system administration basics'
      ],
      communication: [
        'Practice clear, concise explanations',
        'Develop active listening skills',
        'Improve technical writing'
      ],
      customerService: [
        'Study customer service best practices',
        'Practice empathy and patience',
        'Learn conflict resolution techniques'
      ],
      problemSolving: [
        'Practice analytical thinking exercises',
        'Study problem-solving methodologies',
        'Work on complex scenarios'
      ],
      processCompliance: [
        'Learn ITIL framework basics',
        'Study organizational procedures',
        'Practice documentation standards'
      ],
      learningAgility: [
        'Develop growth mindset',
        'Practice rapid skill acquisition',
        'Embrace new technologies'
      ]
    };

    return actions[competency] || ['Focus on targeted skill development', 'Seek mentorship and guidance', 'Practice consistently'];
  }

  private getCompetencyResources(competency: string): string[] {
    const resources: Record<string, string[]> = {
      technicalCompetency: ['Technical documentation', 'Online courses', 'Hands-on labs'],
      communication: ['Communication workshops', 'Presentation training', 'Writing courses'],
      customerService: ['Customer service training', 'Soft skills workshops', 'Role-playing exercises'],
      problemSolving: ['Logic puzzles', 'Case studies', 'Critical thinking courses'],
      processCompliance: ['ITIL training', 'Process documentation', 'Quality frameworks'],
      learningAgility: ['Learning techniques courses', 'Adaptability training', 'Change management']
    };

    return resources[competency] || ['Professional development resources', 'Online learning platforms', 'Industry publications'];
  }
}

export const jobReadinessAssessor = new JobReadinessAssessor();