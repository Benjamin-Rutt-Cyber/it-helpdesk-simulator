import { PerformanceHistory, CompetencyEvidence } from './historyManager';
import { SkillEvidence, EvidenceArtifact } from './evidenceManager';
import { ProfessionalPortfolio } from './portfolioBuilder';

export interface EmployerProfile {
  id: string;
  companyName: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  contactPerson: {
    name: string;
    title: string;
    email: string;
    phone?: string;
  };
  verificationLevel: 'basic' | 'verified' | 'premium';
  preferences: {
    skillCategories: string[];
    experienceLevels: string[];
    certificationRequirements: string[];
    communicationPreferences: string[];
  };
  metadata: {
    registeredAt: Date;
    lastLogin: Date;
    verificationDocuments: string[];
    companyLogo?: string;
    website?: string;
  };
}

export interface CandidateApplication {
  id: string;
  candidateId: string;
  employerId: string;
  position: {
    title: string;
    department: string;
    level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    requirements: SkillRequirement[];
  };
  submission: {
    portfolio: ProfessionalPortfolio;
    coverLetter?: string;
    customMessage?: string;
    selectedEvidence: string[];
    consentGiven: boolean;
  };
  status: 'submitted' | 'under_review' | 'interviewed' | 'verified' | 'hired' | 'rejected';
  timeline: ApplicationTimeline[];
  verification: VerificationProcess;
  communication: CommunicationHistory[];
  metadata: {
    submittedAt: Date;
    lastUpdated: Date;
    viewCount: number;
    rating?: number;
    notes?: string[];
  };
}

export interface SkillRequirement {
  competency: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mandatory: boolean;
  weight: number;
  description?: string;
  certificationRequired?: boolean;
}

export interface ApplicationTimeline {
  id: string;
  event: 'submitted' | 'reviewed' | 'interviewed' | 'verified' | 'decision_made';
  timestamp: Date;
  actor: string;
  details: string;
  attachments?: string[];
}

export interface VerificationProcess {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  competencies: CompetencyVerification[];
  overallScore: number;
  verifiedBy: string;
  verificationDate?: Date;
  verificationReport: VerificationReport;
  appeals?: VerificationAppeal[];
}

export interface CompetencyVerification {
  competency: string;
  claimedLevel: string;
  verifiedLevel: string;
  evidence: SkillEvidence[];
  verificationMethod: 'document_review' | 'practical_test' | 'interview' | 'reference_check';
  score: number;
  feedback: string;
  verified: boolean;
}

export interface VerificationReport {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  overallAssessment: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'inadequate';
  hiringRecommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'not_recommend' | 'strongly_not_recommend';
}

export interface VerificationAppeal {
  id: string;
  competency: string;
  reason: string;
  additionalEvidence: EvidenceArtifact[];
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewDate?: Date;
  outcome?: string;
}

export interface CommunicationHistory {
  id: string;
  type: 'message' | 'interview_request' | 'document_request' | 'status_update' | 'feedback';
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: Date;
  attachments?: string[];
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface EmployerDashboard {
  applications: {
    total: number;
    pending: number;
    underReview: number;
    verified: number;
    hired: number;
  };
  candidates: {
    topCandidates: CandidateRanking[];
    skillMatches: SkillMatchAnalysis[];
    diversityMetrics: DiversityMetrics;
  };
  analytics: {
    hiringTrends: HiringTrend[];
    timeToHire: number;
    verificationAccuracy: number;
    candidateQuality: QualityMetrics;
  };
  recommendations: {
    candidateRecommendations: CandidateRecommendation[];
    processImprovements: ProcessRecommendation[];
  };
}

export interface CandidateRanking {
  candidateId: string;
  name: string;
  overallScore: number;
  skillMatch: number;
  experienceLevel: string;
  verificationStatus: string;
  highlights: string[];
  concerns: string[];
}

export interface SkillMatchAnalysis {
  competency: string;
  required: boolean;
  candidatesWithSkill: number;
  averageLevel: string;
  topCandidates: string[];
  skillGap: number;
}

export interface DiversityMetrics {
  genderDistribution: Record<string, number>;
  experienceDistribution: Record<string, number>;
  educationDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
}

export interface HiringTrend {
  period: string;
  applications: number;
  hires: number;
  averageTimeToHire: number;
  topSkills: string[];
}

export interface QualityMetrics {
  averageScore: number;
  verificationPassRate: number;
  skillVerificationAccuracy: number;
  candidateSatisfaction: number;
}

export interface CandidateRecommendation {
  candidateId: string;
  reason: string;
  confidence: number;
  matchScore: number;
  predictedSuccess: number;
}

export interface ProcessRecommendation {
  category: 'hiring_process' | 'skill_requirements' | 'verification_methods' | 'communication';
  recommendation: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface EmployerNotification {
  id: string;
  type: 'new_application' | 'verification_complete' | 'interview_scheduled' | 'candidate_update' | 'system_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  relatedEntity?: {
    type: 'application' | 'candidate' | 'verification';
    id: string;
  };
}

export class EmployerIntegration {
  private employerProfiles: Map<string, EmployerProfile> = new Map();
  private applications: Map<string, CandidateApplication> = new Map();
  private verificationProcesses: Map<string, VerificationProcess> = new Map();
  private communications: Map<string, CommunicationHistory[]> = new Map();

  async registerEmployer(employerData: Partial<EmployerProfile>): Promise<EmployerProfile> {
    const employer: EmployerProfile = {
      id: this.generateId(),
      companyName: employerData.companyName || '',
      companySize: employerData.companySize || 'small',
      industry: employerData.industry || '',
      contactPerson: employerData.contactPerson || {
        name: '',
        title: '',
        email: ''
      },
      verificationLevel: 'basic',
      preferences: employerData.preferences || {
        skillCategories: [],
        experienceLevels: [],
        certificationRequirements: [],
        communicationPreferences: []
      },
      metadata: {
        registeredAt: new Date(),
        lastLogin: new Date(),
        verificationDocuments: [],
        companyLogo: employerData.metadata?.companyLogo,
        website: employerData.metadata?.website
      }
    };

    this.employerProfiles.set(employer.id, employer);
    await this.sendWelcomeMessage(employer);
    return employer;
  }

  async submitApplication(
    candidateId: string,
    employerId: string,
    applicationData: {
      position: CandidateApplication['position'];
      portfolio: ProfessionalPortfolio;
      coverLetter?: string;
      customMessage?: string;
      selectedEvidence: string[];
    }
  ): Promise<CandidateApplication> {
    const application: CandidateApplication = {
      id: this.generateId(),
      candidateId,
      employerId,
      position: applicationData.position,
      submission: {
        portfolio: applicationData.portfolio,
        coverLetter: applicationData.coverLetter,
        customMessage: applicationData.customMessage,
        selectedEvidence: applicationData.selectedEvidence,
        consentGiven: true
      },
      status: 'submitted',
      timeline: [{
        id: this.generateId(),
        event: 'submitted',
        timestamp: new Date(),
        actor: candidateId,
        details: 'Application submitted'
      }],
      verification: await this.initiateVerification(candidateId, applicationData.portfolio),
      communication: [],
      metadata: {
        submittedAt: new Date(),
        lastUpdated: new Date(),
        viewCount: 0
      }
    };

    this.applications.set(application.id, application);
    await this.notifyEmployer(employerId, 'new_application', application);
    return application;
  }

  async reviewApplication(applicationId: string, reviewerId: string): Promise<void> {
    const application = this.applications.get(applicationId);
    if (!application) throw new Error('Application not found');

    application.status = 'under_review';
    application.timeline.push({
      id: this.generateId(),
      event: 'reviewed',
      timestamp: new Date(),
      actor: reviewerId,
      details: 'Application review started'
    });
    application.metadata.lastUpdated = new Date();
    application.metadata.viewCount++;

    await this.analyzeSkillMatch(application);
    await this.notifyCandidate(application.candidateId, 'under_review', application);
  }

  async initiateVerification(candidateId: string, portfolio: ProfessionalPortfolio): Promise<VerificationProcess> {
    const verification: VerificationProcess = {
      id: this.generateId(),
      status: 'pending',
      competencies: await this.extractCompetenciesForVerification(portfolio),
      overallScore: 0,
      verifiedBy: '',
      verificationReport: {
        summary: '',
        strengths: [],
        concerns: [],
        recommendations: [],
        overallAssessment: 'satisfactory',
        hiringRecommendation: 'neutral'
      },
      appeals: []
    };

    this.verificationProcesses.set(verification.id, verification);
    return verification;
  }

  async performVerification(
    verificationId: string,
    verifierId: string,
    verificationData: {
      competencyResults: CompetencyVerification[];
      overallAssessment: VerificationReport['overallAssessment'];
      recommendation: VerificationReport['hiringRecommendation'];
      comments: string;
    }
  ): Promise<VerificationProcess> {
    const verification = this.verificationProcesses.get(verificationId);
    if (!verification) throw new Error('Verification process not found');

    verification.status = 'completed';
    verification.competencies = verificationData.competencyResults;
    verification.overallScore = this.calculateOverallScore(verificationData.competencyResults);
    verification.verifiedBy = verifierId;
    verification.verificationDate = new Date();
    verification.verificationReport = {
      summary: verificationData.comments,
      strengths: this.extractStrengths(verificationData.competencyResults),
      concerns: this.extractConcerns(verificationData.competencyResults),
      recommendations: this.generateRecommendations(verificationData.competencyResults),
      overallAssessment: verificationData.overallAssessment,
      hiringRecommendation: verificationData.recommendation
    };

    await this.notifyApplicationUpdate(verificationId, 'verification_complete');
    return verification;
  }

  async getEmployerDashboard(employerId: string): Promise<EmployerDashboard> {
    const employerApplications = Array.from(this.applications.values())
      .filter(app => app.employerId === employerId);

    const applications = {
      total: employerApplications.length,
      pending: employerApplications.filter(app => app.status === 'submitted').length,
      underReview: employerApplications.filter(app => app.status === 'under_review').length,
      verified: employerApplications.filter(app => app.status === 'verified').length,
      hired: employerApplications.filter(app => app.status === 'hired').length
    };

    const topCandidates = await this.rankCandidates(employerApplications);
    const skillMatches = await this.analyzeSkillMatches(employerApplications);
    const analytics = await this.generateAnalytics(employerApplications);

    return {
      applications,
      candidates: {
        topCandidates,
        skillMatches,
        diversityMetrics: await this.calculateDiversityMetrics(employerApplications)
      },
      analytics,
      recommendations: {
        candidateRecommendations: await this.generateCandidateRecommendations(employerApplications),
        processImprovements: await this.generateProcessRecommendations(employerId)
      }
    };
  }

  async sendMessage(
    from: string,
    to: string,
    type: CommunicationHistory['type'],
    content: {
      subject?: string;
      message: string;
      priority?: CommunicationHistory['priority'];
      attachments?: string[];
    }
  ): Promise<CommunicationHistory> {
    const message: CommunicationHistory = {
      id: this.generateId(),
      type,
      from,
      to,
      subject: content.subject,
      content: content.message,
      timestamp: new Date(),
      attachments: content.attachments,
      read: false,
      priority: content.priority || 'medium'
    };

    const communications = this.communications.get(to) || [];
    communications.push(message);
    this.communications.set(to, communications);

    await this.sendNotification(to, message);
    return message;
  }

  async getCommunicationHistory(userId: string, limit: number = 50): Promise<CommunicationHistory[]> {
    const communications = this.communications.get(userId) || [];
    return communications
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async scheduleInterview(
    applicationId: string,
    schedulerId: string,
    interviewData: {
      type: 'phone' | 'video' | 'in_person';
      datetime: Date;
      duration: number;
      location?: string;
      interviewers: string[];
      agenda: string[];
    }
  ): Promise<void> {
    const application = this.applications.get(applicationId);
    if (!application) throw new Error('Application not found');

    application.timeline.push({
      id: this.generateId(),
      event: 'interviewed',
      timestamp: new Date(),
      actor: schedulerId,
      details: `Interview scheduled for ${interviewData.datetime.toISOString()}`
    });

    await this.sendMessage(
      schedulerId,
      application.candidateId,
      'interview_request',
      {
        subject: 'Interview Invitation',
        message: `You have been invited for an interview on ${interviewData.datetime.toLocaleDateString()}`,
        priority: 'high'
      }
    );
  }

  async submitAppeal(
    verificationId: string,
    competency: string,
    appealData: {
      reason: string;
      additionalEvidence: EvidenceArtifact[];
    }
  ): Promise<VerificationAppeal> {
    const verification = this.verificationProcesses.get(verificationId);
    if (!verification) throw new Error('Verification process not found');

    const appeal: VerificationAppeal = {
      id: this.generateId(),
      competency,
      reason: appealData.reason,
      additionalEvidence: appealData.additionalEvidence,
      status: 'pending'
    };

    verification.appeals = verification.appeals || [];
    verification.appeals.push(appeal);

    await this.notifyVerificationTeam(verificationId, appeal);
    return appeal;
  }

  async generateVerificationReport(verificationId: string): Promise<VerificationReport> {
    const verification = this.verificationProcesses.get(verificationId);
    if (!verification) throw new Error('Verification process not found');

    return verification.verificationReport;
  }

  async getEmployerNotifications(employerId: string, limit: number = 20): Promise<EmployerNotification[]> {
    return this.generateNotificationsForEmployer(employerId)
      .slice(0, limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async extractCompetenciesForVerification(portfolio: ProfessionalPortfolio): Promise<CompetencyVerification[]> {
    const competencies: CompetencyVerification[] = [];
    
    for (const competency of portfolio.competencies.technical) {
      competencies.push({
        competency: competency.competency,
        claimedLevel: competency.level,
        verifiedLevel: '',
        evidence: [],
        verificationMethod: 'document_review',
        score: 0,
        feedback: '',
        verified: false
      });
    }

    return competencies;
  }

  private calculateOverallScore(competencies: CompetencyVerification[]): number {
    if (competencies.length === 0) return 0;
    const totalScore = competencies.reduce((sum, comp) => sum + comp.score, 0);
    return Math.round((totalScore / competencies.length) * 100) / 100;
  }

  private extractStrengths(competencies: CompetencyVerification[]): string[] {
    return competencies
      .filter(comp => comp.score >= 80)
      .map(comp => `Strong ${comp.competency} skills demonstrated`)
      .slice(0, 5);
  }

  private extractConcerns(competencies: CompetencyVerification[]): string[] {
    return competencies
      .filter(comp => comp.score < 60)
      .map(comp => `${comp.competency} skills need improvement`)
      .slice(0, 3);
  }

  private generateRecommendations(competencies: CompetencyVerification[]): string[] {
    const recommendations: string[] = [];
    const lowScoreCompetencies = competencies.filter(comp => comp.score < 70);
    
    if (lowScoreCompetencies.length > 0) {
      recommendations.push('Consider additional training in identified skill gaps');
    }
    
    if (competencies.some(comp => comp.score >= 90)) {
      recommendations.push('Leverage strong competencies in role assignment');
    }

    return recommendations;
  }

  private async rankCandidates(applications: CandidateApplication[]): Promise<CandidateRanking[]> {
    return applications
      .map(app => ({
        candidateId: app.candidateId,
        name: app.submission.portfolio.header.name,
        overallScore: app.verification.overallScore,
        skillMatch: this.calculateSkillMatch(app),
        experienceLevel: this.determineExperienceLevel(app.submission.portfolio),
        verificationStatus: app.verification.status,
        highlights: app.verification.verificationReport.strengths,
        concerns: app.verification.verificationReport.concerns
      }))
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10);
  }

  private async analyzeSkillMatches(applications: CandidateApplication[]): Promise<SkillMatchAnalysis[]> {
    const skillMap = new Map<string, { candidates: string[], levels: string[] }>();
    
    applications.forEach(app => {
      app.submission.portfolio.competencies.technical.forEach(comp => {
        if (!skillMap.has(comp.competency)) {
          skillMap.set(comp.competency, { candidates: [], levels: [] });
        }
        const skill = skillMap.get(comp.competency)!;
        skill.candidates.push(app.candidateId);
        skill.levels.push(comp.level);
      });
    });

    return Array.from(skillMap.entries()).map(([competency, data]) => ({
      competency,
      required: true,
      candidatesWithSkill: data.candidates.length,
      averageLevel: this.calculateAverageLevel(data.levels),
      topCandidates: data.candidates.slice(0, 3),
      skillGap: this.calculateSkillGap(data.levels)
    }));
  }

  private async calculateDiversityMetrics(applications: CandidateApplication[]): Promise<DiversityMetrics> {
    return {
      genderDistribution: { 'Male': 40, 'Female': 35, 'Other': 25 },
      experienceDistribution: { 'Entry': 20, 'Mid': 45, 'Senior': 30, 'Lead': 5 },
      educationDistribution: { 'Bachelor': 50, 'Master': 35, 'PhD': 10, 'Other': 5 },
      geographicDistribution: { 'Local': 60, 'Regional': 25, 'National': 15 }
    };
  }

  private async generateAnalytics(applications: CandidateApplication[]): Promise<EmployerDashboard['analytics']> {
    return {
      hiringTrends: [{
        period: 'Q1 2024',
        applications: applications.length,
        hires: applications.filter(app => app.status === 'hired').length,
        averageTimeToHire: 15,
        topSkills: ['JavaScript', 'Customer Service', 'Problem Solving']
      }],
      timeToHire: 15,
      verificationAccuracy: 0.92,
      candidateQuality: {
        averageScore: 75.5,
        verificationPassRate: 0.85,
        skillVerificationAccuracy: 0.88,
        candidateSatisfaction: 4.2
      }
    };
  }

  private async generateCandidateRecommendations(applications: CandidateApplication[]): Promise<CandidateRecommendation[]> {
    return applications
      .filter(app => app.verification.overallScore >= 80)
      .map(app => ({
        candidateId: app.candidateId,
        reason: 'High skill match and verification score',
        confidence: 0.85,
        matchScore: this.calculateSkillMatch(app),
        predictedSuccess: this.calculatePredictedSuccess(app)
      }))
      .slice(0, 5);
  }

  private async generateProcessRecommendations(employerId: string): Promise<ProcessRecommendation[]> {
    return [
      {
        category: 'hiring_process',
        recommendation: 'Implement structured interview process',
        impact: 'high',
        effort: 'medium'
      },
      {
        category: 'skill_requirements',
        recommendation: 'Update skill requirements based on market trends',
        impact: 'medium',
        effort: 'low'
      }
    ];
  }

  private calculateSkillMatch(application: CandidateApplication): number {
    const requiredSkills = application.position.requirements;
    const candidateSkills = application.submission.portfolio.competencies.technical;
    
    let matchScore = 0;
    let totalWeight = 0;

    requiredSkills.forEach(req => {
      const candidateSkill = candidateSkills.find(skill => skill.competency === req.competency);
      if (candidateSkill) {
        const levelMatch = this.compareLevels(candidateSkill.level, req.level);
        matchScore += levelMatch * req.weight;
      }
      totalWeight += req.weight;
    });

    return totalWeight > 0 ? (matchScore / totalWeight) * 100 : 0;
  }

  private determineExperienceLevel(portfolio: ProfessionalPortfolio): string {
    const totalExperience = portfolio.performanceMetrics?.totalExperience || 0;
    if (totalExperience < 2) return 'Entry';
    if (totalExperience < 5) return 'Mid';
    if (totalExperience < 10) return 'Senior';
    return 'Lead';
  }

  private calculateAverageLevel(levels: string[]): string {
    const levelValues = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const avgValue = levels.reduce((sum, level) => sum + (levelValues[level as keyof typeof levelValues] || 0), 0) / levels.length;
    
    if (avgValue <= 1.5) return 'beginner';
    if (avgValue <= 2.5) return 'intermediate';
    if (avgValue <= 3.5) return 'advanced';
    return 'expert';
  }

  private calculateSkillGap(levels: string[]): number {
    const requiredLevel = 3; // Advanced
    const actualLevels = levels.map(level => ({ 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 }[level] || 0));
    const avgLevel = actualLevels.reduce((sum, level) => sum + level, 0) / actualLevels.length;
    return Math.max(0, requiredLevel - avgLevel);
  }

  private calculatePredictedSuccess(application: CandidateApplication): number {
    const baseScore = application.verification.overallScore;
    const skillMatch = this.calculateSkillMatch(application);
    const experienceBonus = this.getExperienceBonus(application.submission.portfolio);
    
    return Math.min(100, baseScore * 0.4 + skillMatch * 0.4 + experienceBonus * 0.2);
  }

  private getExperienceBonus(portfolio: ProfessionalPortfolio): number {
    const achievements = portfolio.achievements?.length || 0;
    const certifications = portfolio.certifications?.length || 0;
    return Math.min(20, achievements * 2 + certifications * 3);
  }

  private compareLevels(candidateLevel: string, requiredLevel: string): number {
    const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const candidateScore = levels[candidateLevel as keyof typeof levels] || 0;
    const requiredScore = levels[requiredLevel as keyof typeof levels] || 0;
    
    if (candidateScore >= requiredScore) return 1;
    return candidateScore / requiredScore;
  }

  private async sendWelcomeMessage(employer: EmployerProfile): Promise<void> {
    console.log(`Welcome message sent to ${employer.contactPerson.email}`);
  }

  private async notifyEmployer(employerId: string, type: string, application: CandidateApplication): Promise<void> {
    console.log(`Notification sent to employer ${employerId}: ${type}`);
  }

  private async notifyCandidate(candidateId: string, status: string, application: CandidateApplication): Promise<void> {
    console.log(`Notification sent to candidate ${candidateId}: ${status}`);
  }

  private async notifyApplicationUpdate(verificationId: string, event: string): Promise<void> {
    console.log(`Application update notification: ${event} for verification ${verificationId}`);
  }

  private async notifyVerificationTeam(verificationId: string, appeal: VerificationAppeal): Promise<void> {
    console.log(`Verification team notified of appeal: ${appeal.id}`);
  }

  private async sendNotification(userId: string, message: CommunicationHistory): Promise<void> {
    console.log(`Notification sent to ${userId}: ${message.subject || message.type}`);
  }

  private generateNotificationsForEmployer(employerId: string): EmployerNotification[] {
    return [
      {
        id: this.generateId(),
        type: 'new_application',
        title: 'New Application Received',
        message: 'A new candidate has applied for your position',
        priority: 'medium',
        timestamp: new Date(),
        read: false,
        actionRequired: true,
        relatedEntity: { type: 'application', id: 'app123' }
      }
    ];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export { 
  EmployerIntegration,
  EmployerProfile,
  CandidateApplication,
  VerificationProcess,
  EmployerDashboard,
  CommunicationHistory,
  EmployerNotification
};