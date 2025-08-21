import { PerformanceHistory, CompetencyEvidence } from './historyManager';

export interface SkillEvidence {
  id: string;
  userId: string;
  competency: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidence: {
    scenario: string;
    description: string;
    actions: string[];
    outcome: string;
    metrics: PerformanceMetrics;
    artifacts: EvidenceArtifact[];
    validation: ValidationData;
  };
  documentation: {
    title: string;
    summary: string;
    learningObjectives: string[];
    competenciesDemonstrated: string[];
    reflectiveAnalysis: string;
  };
  verification: {
    status: 'draft' | 'submitted' | 'verified' | 'rejected';
    verifiedBy?: string;
    verifiedAt?: Date;
    verifierComments?: string;
    verificationMethod: 'peer_review' | 'supervisor' | 'automated' | 'certification_body';
  };
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
    submittedAt?: Date;
    verifiedAt?: Date;
  };
  metadata: {
    tags: string[];
    category: string;
    difficulty: 'basic' | 'intermediate' | 'advanced' | 'expert';
    industryStandards: string[];
    certificationRelevance: string[];
  };
}

export interface EvidenceArtifact {
  id: string;
  type: 'screenshot' | 'document' | 'video' | 'audio' | 'code' | 'report' | 'certificate';
  fileName: string;
  filePath: string;
  fileSize: number;
  description: string;
  uploadedAt: Date;
  metadata: {
    duration?: number; // for video/audio
    resolution?: string; // for images/video
    language?: string; // for documents
    format: string;
  };
}

export interface ValidationData {
  method: 'automated' | 'peer_review' | 'supervisor' | 'external_validator';
  validator?: {
    id: string;
    name: string;
    role: string;
    organization?: string;
    credentials: string[];
  };
  validationCriteria: ValidationCriterion[];
  score: number; // 0-100
  feedback: string;
  recommendations: string[];
  validatedAt: Date;
}

export interface ValidationCriterion {
  criterion: string;
  weight: number;
  score: number;
  comments: string;
  evidence: string[];
}

export interface CompetencyFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  competencies: CompetencyDefinition[];
  assessmentCriteria: AssessmentCriterion[];
  proficiencyLevels: ProficiencyLevel[];
}

export interface CompetencyDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  behaviorIndicators: string[];
  knowledgeRequirements: string[];
  skillRequirements: string[];
  proficiencyLevels: ProficiencyLevel[];
}

export interface AssessmentCriterion {
  id: string;
  competencyId: string;
  criterion: string;
  description: string;
  weight: number;
  measurableOutcomes: string[];
  evidenceRequirements: string[];
}

export interface ProficiencyLevel {
  level: number;
  name: string;
  description: string;
  behaviorDescriptors: string[];
  evidenceRequirements: string[];
  assessmentMethods: string[];
}

export interface EvidencePortfolio {
  userId: string;
  title: string;
  description: string;
  competencyFramework: string;
  evidenceItems: SkillEvidence[];
  compilationMetadata: {
    compiledAt: Date;
    totalEvidence: number;
    competenciesCovered: string[];
    proficiencyDistribution: { [level: string]: number };
    completionPercentage: number;
  };
  presentation: {
    template: string;
    customization: any;
    accessibility: {
      altText: boolean;
      highContrast: boolean;
      screenReaderOptimized: boolean;
    };
  };
}

export interface PerformanceMetrics {
  accuracy: number;
  efficiency: number;
  quality: number;
  innovation: number;
  collaboration: number;
  customerSatisfaction?: number;
  timeToCompletion: number;
  errorRate: number;
  improvementSuggestions: string[];
}

export class EvidenceManager {
  private skillEvidence: Map<string, SkillEvidence[]> = new Map();
  private competencyFrameworks: Map<string, CompetencyFramework> = new Map();
  private evidencePortfolios: Map<string, EvidencePortfolio[]> = new Map();

  constructor() {
    this.initializeFrameworks();
  }

  async createSkillEvidence(
    userId: string,
    evidenceData: Omit<SkillEvidence, 'id' | 'userId' | 'timestamps' | 'verification'>
  ): Promise<SkillEvidence> {
    const evidence: SkillEvidence = {
      ...evidenceData,
      id: this.generateEvidenceId(),
      userId,
      verification: {
        status: 'draft',
        verificationMethod: 'automated'
      },
      timestamps: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const userEvidence = this.skillEvidence.get(userId) || [];
    userEvidence.push(evidence);
    this.skillEvidence.set(userId, userEvidence);

    return evidence;
  }

  async updateSkillEvidence(
    userId: string,
    evidenceId: string,
    updates: Partial<SkillEvidence>
  ): Promise<SkillEvidence> {
    const userEvidence = this.skillEvidence.get(userId) || [];
    const evidenceIndex = userEvidence.findIndex(e => e.id === evidenceId);

    if (evidenceIndex === -1) {
      throw new Error('Evidence not found');
    }

    const updatedEvidence = {
      ...userEvidence[evidenceIndex],
      ...updates,
      timestamps: {
        ...userEvidence[evidenceIndex].timestamps,
        updatedAt: new Date()
      }
    };

    userEvidence[evidenceIndex] = updatedEvidence;
    this.skillEvidence.set(userId, userEvidence);

    return updatedEvidence;
  }

  async submitEvidenceForVerification(
    userId: string,
    evidenceId: string
  ): Promise<SkillEvidence> {
    const evidence = await this.updateSkillEvidence(userId, evidenceId, {
      verification: {
        status: 'submitted',
        verificationMethod: 'peer_review'
      },
      timestamps: {
        submittedAt: new Date()
      } as any
    });

    await this.initiateVerificationProcess(evidence);

    return evidence;
  }

  async verifyEvidence(
    evidenceId: string,
    validationData: ValidationData,
    verifierId: string
  ): Promise<SkillEvidence> {
    const evidence = this.findEvidenceById(evidenceId);
    
    if (!evidence) {
      throw new Error('Evidence not found');
    }

    const updatedEvidence = await this.updateSkillEvidence(
      evidence.userId,
      evidenceId,
      {
        evidence: {
          ...evidence.evidence,
          validation: validationData
        },
        verification: {
          ...evidence.verification,
          status: validationData.score >= 70 ? 'verified' : 'rejected',
          verifiedBy: verifierId,
          verifiedAt: new Date(),
          verifierComments: validationData.feedback
        }
      }
    );

    return updatedEvidence;
  }

  async getSkillEvidence(
    userId: string,
    filters?: {
      competency?: string;
      skillLevel?: string;
      verificationStatus?: string;
      category?: string;
    }
  ): Promise<SkillEvidence[]> {
    let evidence = this.skillEvidence.get(userId) || [];

    if (filters) {
      evidence = evidence.filter(e => {
        if (filters.competency && e.competency !== filters.competency) return false;
        if (filters.skillLevel && e.skillLevel !== filters.skillLevel) return false;
        if (filters.verificationStatus && e.verification.status !== filters.verificationStatus) return false;
        if (filters.category && e.metadata.category !== filters.category) return false;
        return true;
      });
    }

    return evidence;
  }

  async generateCompetencyReport(
    userId: string,
    competency: string
  ): Promise<CompetencyReport> {
    const evidence = await this.getSkillEvidence(userId, { competency });
    const framework = this.getCompetencyFramework('default');
    const competencyDef = framework?.competencies.find(c => c.name === competency);

    if (!competencyDef) {
      throw new Error('Competency not found in framework');
    }

    const verifiedEvidence = evidence.filter(e => e.verification.status === 'verified');
    const proficiencyDistribution = this.calculateProficiencyDistribution(evidence);
    const skillProgression = this.analyzeSkillProgression(evidence);

    return {
      competency,
      definition: competencyDef,
      evidenceCount: evidence.length,
      verifiedEvidenceCount: verifiedEvidence.length,
      proficiencyDistribution,
      skillProgression,
      strengths: this.identifyStrengths(evidence),
      developmentAreas: this.identifyDevelopmentAreas(evidence, competencyDef),
      recommendations: this.generateRecommendations(evidence, competencyDef),
      completionPercentage: this.calculateCompetencyCompletion(evidence, competencyDef),
      generatedAt: new Date()
    };
  }

  async compileEvidencePortfolio(
    userId: string,
    portfolioData: Omit<EvidencePortfolio, 'userId' | 'evidenceItems' | 'compilationMetadata'>
  ): Promise<EvidencePortfolio> {
    const allEvidence = await this.getSkillEvidence(userId);
    const verifiedEvidence = allEvidence.filter(e => e.verification.status === 'verified');

    const competenciesCovered = [...new Set(verifiedEvidence.map(e => e.competency))];
    const proficiencyDistribution = this.calculateProficiencyDistribution(verifiedEvidence);
    const completionPercentage = this.calculatePortfolioCompletion(verifiedEvidence, portfolioData.competencyFramework);

    const portfolio: EvidencePortfolio = {
      ...portfolioData,
      userId,
      evidenceItems: verifiedEvidence,
      compilationMetadata: {
        compiledAt: new Date(),
        totalEvidence: verifiedEvidence.length,
        competenciesCovered,
        proficiencyDistribution,
        completionPercentage
      }
    };

    const userPortfolios = this.evidencePortfolios.get(userId) || [];
    userPortfolios.push(portfolio);
    this.evidencePortfolios.set(userId, userPortfolios);

    return portfolio;
  }

  async addEvidenceArtifact(
    userId: string,
    evidenceId: string,
    artifact: Omit<EvidenceArtifact, 'id' | 'uploadedAt'>
  ): Promise<EvidenceArtifact> {
    const evidence = this.findEvidenceById(evidenceId);
    
    if (!evidence || evidence.userId !== userId) {
      throw new Error('Evidence not found or access denied');
    }

    const newArtifact: EvidenceArtifact = {
      ...artifact,
      id: this.generateArtifactId(),
      uploadedAt: new Date()
    };

    evidence.evidence.artifacts.push(newArtifact);
    await this.updateSkillEvidence(userId, evidenceId, evidence);

    return newArtifact;
  }

  async validateEvidenceArtifact(
    artifactId: string,
    validationType: 'authenticity' | 'relevance' | 'quality'
  ): Promise<ValidationResult> {
    const artifact = this.findArtifactById(artifactId);
    
    if (!artifact) {
      throw new Error('Artifact not found');
    }

    const validationResult = await this.performArtifactValidation(artifact, validationType);
    
    return validationResult;
  }

  getCompetencyFramework(frameworkId: string): CompetencyFramework | undefined {
    return this.competencyFrameworks.get(frameworkId);
  }

  async getEvidenceAnalytics(userId: string): Promise<EvidenceAnalytics> {
    const evidence = await this.getSkillEvidence(userId);
    
    return {
      totalEvidence: evidence.length,
      verifiedEvidence: evidence.filter(e => e.verification.status === 'verified').length,
      pendingVerification: evidence.filter(e => e.verification.status === 'submitted').length,
      drafts: evidence.filter(e => e.verification.status === 'draft').length,
      competenciesCovered: [...new Set(evidence.map(e => e.competency))].length,
      averageValidationScore: this.calculateAverageValidationScore(evidence),
      proficiencyDistribution: this.calculateProficiencyDistribution(evidence),
      monthlyProgress: this.calculateMonthlyProgress(evidence),
      topCompetencies: this.identifyTopCompetencies(evidence),
      improvementTrends: this.analyzeImprovementTrends(evidence)
    };
  }

  private async initiateVerificationProcess(evidence: SkillEvidence): Promise<void> {
  }

  private findEvidenceById(evidenceId: string): SkillEvidence | undefined {
    for (const userEvidence of this.skillEvidence.values()) {
      const evidence = userEvidence.find(e => e.id === evidenceId);
      if (evidence) return evidence;
    }
    return undefined;
  }

  private findArtifactById(artifactId: string): EvidenceArtifact | undefined {
    for (const userEvidence of this.skillEvidence.values()) {
      for (const evidence of userEvidence) {
        const artifact = evidence.evidence.artifacts.find(a => a.id === artifactId);
        if (artifact) return artifact;
      }
    }
    return undefined;
  }

  private calculateProficiencyDistribution(evidence: SkillEvidence[]): { [level: string]: number } {
    const distribution: { [level: string]: number } = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0
    };

    evidence.forEach(e => {
      distribution[e.skillLevel]++;
    });

    return distribution;
  }

  private analyzeSkillProgression(evidence: SkillEvidence[]): SkillProgression {
    const sortedEvidence = evidence.sort((a, b) => 
      a.timestamps.createdAt.getTime() - b.timestamps.createdAt.getTime()
    );

    return {
      timeline: sortedEvidence.map(e => ({
        date: e.timestamps.createdAt,
        level: e.skillLevel,
        score: e.evidence.validation?.score || 0
      })),
      progression: this.calculateProgressionTrend(sortedEvidence),
      milestones: this.identifyMilestones(sortedEvidence)
    };
  }

  private identifyStrengths(evidence: SkillEvidence[]): string[] {
    const strengths: string[] = [];
    
    const highScoreEvidence = evidence.filter(e => 
      e.evidence.validation && e.evidence.validation.score >= 85
    );

    highScoreEvidence.forEach(e => {
      e.documentation.competenciesDemonstrated.forEach(comp => {
        if (!strengths.includes(comp)) {
          strengths.push(comp);
        }
      });
    });

    return strengths.slice(0, 5);
  }

  private identifyDevelopmentAreas(
    evidence: SkillEvidence[],
    competencyDef: CompetencyDefinition
  ): string[] {
    const demonstratedCompetencies = new Set(
      evidence.flatMap(e => e.documentation.competenciesDemonstrated)
    );

    const allRequiredCompetencies = new Set([
      ...competencyDef.behaviorIndicators,
      ...competencyDef.knowledgeRequirements,
      ...competencyDef.skillRequirements
    ]);

    const developmentAreas: string[] = [];
    allRequiredCompetencies.forEach(comp => {
      if (!demonstratedCompetencies.has(comp)) {
        developmentAreas.push(comp);
      }
    });

    return developmentAreas.slice(0, 5);
  }

  private generateRecommendations(
    evidence: SkillEvidence[],
    competencyDef: CompetencyDefinition
  ): string[] {
    const recommendations: string[] = [];
    
    const lowScoreEvidence = evidence.filter(e => 
      e.evidence.validation && e.evidence.validation.score < 70
    );

    if (lowScoreEvidence.length > 0) {
      recommendations.push('Focus on improving evidence quality and documentation');
    }

    const developmentAreas = this.identifyDevelopmentAreas(evidence, competencyDef);
    if (developmentAreas.length > 0) {
      recommendations.push(`Develop skills in: ${developmentAreas.slice(0, 3).join(', ')}`);
    }

    if (evidence.length < 3) {
      recommendations.push('Collect more evidence to demonstrate competency consistency');
    }

    return recommendations;
  }

  private calculateCompetencyCompletion(
    evidence: SkillEvidence[],
    competencyDef: CompetencyDefinition
  ): number {
    const totalRequirements = competencyDef.behaviorIndicators.length + 
                             competencyDef.knowledgeRequirements.length + 
                             competencyDef.skillRequirements.length;

    const demonstratedCompetencies = new Set(
      evidence.flatMap(e => e.documentation.competenciesDemonstrated)
    );

    return Math.round((demonstratedCompetencies.size / totalRequirements) * 100);
  }

  private calculatePortfolioCompletion(
    evidence: SkillEvidence[],
    frameworkId: string
  ): number {
    const framework = this.getCompetencyFramework(frameworkId);
    if (!framework) return 0;

    const totalCompetencies = framework.competencies.length;
    const coveredCompetencies = new Set(evidence.map(e => e.competency)).size;

    return Math.round((coveredCompetencies / totalCompetencies) * 100);
  }

  private async performArtifactValidation(
    artifact: EvidenceArtifact,
    validationType: string
  ): Promise<ValidationResult> {
    return {
      valid: true,
      score: 85,
      feedback: 'Artifact validated successfully',
      validatedAt: new Date()
    };
  }

  private calculateAverageValidationScore(evidence: SkillEvidence[]): number {
    const validatedEvidence = evidence.filter(e => e.evidence.validation);
    if (validatedEvidence.length === 0) return 0;

    const totalScore = validatedEvidence.reduce((sum, e) => sum + e.evidence.validation.score, 0);
    return Math.round(totalScore / validatedEvidence.length);
  }

  private calculateMonthlyProgress(evidence: SkillEvidence[]): MonthlyProgress[] {
    const monthlyData: { [month: string]: number } = {};
    
    evidence.forEach(e => {
      const month = e.timestamps.createdAt.toISOString().slice(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      evidenceCount: count
    }));
  }

  private identifyTopCompetencies(evidence: SkillEvidence[]): TopCompetency[] {
    const competencyCount: { [competency: string]: number } = {};
    const competencyScores: { [competency: string]: number[] } = {};

    evidence.forEach(e => {
      competencyCount[e.competency] = (competencyCount[e.competency] || 0) + 1;
      if (e.evidence.validation) {
        competencyScores[e.competency] = competencyScores[e.competency] || [];
        competencyScores[e.competency].push(e.evidence.validation.score);
      }
    });

    return Object.entries(competencyCount)
      .map(([competency, count]) => ({
        competency,
        evidenceCount: count,
        averageScore: competencyScores[competency] ? 
          Math.round(competencyScores[competency].reduce((a, b) => a + b) / competencyScores[competency].length) : 0
      }))
      .sort((a, b) => b.evidenceCount - a.evidenceCount)
      .slice(0, 5);
  }

  private analyzeImprovementTrends(evidence: SkillEvidence[]): ImprovementTrend[] {
    return [];
  }

  private calculateProgressionTrend(evidence: SkillEvidence[]): string {
    if (evidence.length < 2) return 'insufficient_data';
    
    const firstEvidence = evidence[0];
    const lastEvidence = evidence[evidence.length - 1];
    
    const levelMap = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const firstLevel = levelMap[firstEvidence.skillLevel];
    const lastLevel = levelMap[lastEvidence.skillLevel];
    
    if (lastLevel > firstLevel) return 'improving';
    if (lastLevel < firstLevel) return 'declining';
    return 'stable';
  }

  private identifyMilestones(evidence: SkillEvidence[]): Milestone[] {
    const milestones: Milestone[] = [];
    
    const levelChanges = this.detectLevelChanges(evidence);
    levelChanges.forEach(change => {
      milestones.push({
        type: 'level_advancement',
        date: change.date,
        description: `Advanced from ${change.from} to ${change.to}`,
        significance: 'high'
      });
    });

    return milestones;
  }

  private detectLevelChanges(evidence: SkillEvidence[]): LevelChange[] {
    const changes: LevelChange[] = [];
    const levelMap = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

    for (let i = 1; i < evidence.length; i++) {
      const currentLevel = levelMap[evidence[i].skillLevel];
      const previousLevel = levelMap[evidence[i-1].skillLevel];
      
      if (currentLevel > previousLevel) {
        changes.push({
          date: evidence[i].timestamps.createdAt,
          from: evidence[i-1].skillLevel,
          to: evidence[i].skillLevel
        });
      }
    }

    return changes;
  }

  private initializeFrameworks(): void {
    const defaultFramework: CompetencyFramework = {
      id: 'default',
      name: 'IT Professional Competency Framework',
      version: '1.0',
      description: 'Comprehensive framework for IT professional competencies',
      competencies: [
        {
          id: 'technical_skills',
          name: 'Technical Skills',
          description: 'Technical proficiency and expertise',
          category: 'Technical',
          behaviorIndicators: ['Applies technical knowledge effectively', 'Solves complex technical problems'],
          knowledgeRequirements: ['Current technology knowledge', 'Best practices understanding'],
          skillRequirements: ['Programming', 'System administration', 'Troubleshooting'],
          proficiencyLevels: [
            { level: 1, name: 'Beginner', description: 'Basic technical skills', behaviorDescriptors: [], evidenceRequirements: [], assessmentMethods: [] },
            { level: 2, name: 'Intermediate', description: 'Moderate technical competency', behaviorDescriptors: [], evidenceRequirements: [], assessmentMethods: [] },
            { level: 3, name: 'Advanced', description: 'High technical proficiency', behaviorDescriptors: [], evidenceRequirements: [], assessmentMethods: [] },
            { level: 4, name: 'Expert', description: 'Expert-level technical mastery', behaviorDescriptors: [], evidenceRequirements: [], assessmentMethods: [] }
          ]
        }
      ],
      assessmentCriteria: [],
      proficiencyLevels: []
    };

    this.competencyFrameworks.set('default', defaultFramework);
  }

  private generateEvidenceId(): string {
    return `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateArtifactId(): string {
    return `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Additional interfaces for the evidence system
interface CompetencyReport {
  competency: string;
  definition: CompetencyDefinition;
  evidenceCount: number;
  verifiedEvidenceCount: number;
  proficiencyDistribution: { [level: string]: number };
  skillProgression: SkillProgression;
  strengths: string[];
  developmentAreas: string[];
  recommendations: string[];
  completionPercentage: number;
  generatedAt: Date;
}

interface SkillProgression {
  timeline: Array<{
    date: Date;
    level: string;
    score: number;
  }>;
  progression: string;
  milestones: Milestone[];
}

interface Milestone {
  type: string;
  date: Date;
  description: string;
  significance: 'low' | 'medium' | 'high';
}

interface LevelChange {
  date: Date;
  from: string;
  to: string;
}

interface ValidationResult {
  valid: boolean;
  score: number;
  feedback: string;
  validatedAt: Date;
}

interface EvidenceAnalytics {
  totalEvidence: number;
  verifiedEvidence: number;
  pendingVerification: number;
  drafts: number;
  competenciesCovered: number;
  averageValidationScore: number;
  proficiencyDistribution: { [level: string]: number };
  monthlyProgress: MonthlyProgress[];
  topCompetencies: TopCompetency[];
  improvementTrends: ImprovementTrend[];
}

interface MonthlyProgress {
  month: string;
  evidenceCount: number;
}

interface TopCompetency {
  competency: string;
  evidenceCount: number;
  averageScore: number;
}

interface ImprovementTrend {
  competency: string;
  trend: 'improving' | 'stable' | 'declining';
  changeRate: number;
}

export { 
  EvidenceManager, 
  SkillEvidence, 
  EvidenceArtifact, 
  ValidationData, 
  CompetencyFramework,
  EvidencePortfolio,
  CompetencyReport,
  EvidenceAnalytics
};