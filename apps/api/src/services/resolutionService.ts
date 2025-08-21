import { logger } from '../utils/logger';

export interface ResolutionStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  type: 'verification' | 'testing' | 'documentation' | 'communication' | 'quality_check';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  attachments?: string[];
  qualityScore?: number;
  estimatedTime?: number;
  actualTime?: number;
}

export interface QualityCriterion {
  id: string;
  description: string;
  type: 'boolean' | 'rating' | 'text';
  required: boolean;
  value?: any;
  weight: number;
}

export interface QualityGate {
  id: string;
  name: string;
  description: string;
  criteria: QualityCriterion[];
  required: boolean;
  status: 'pending' | 'passed' | 'failed';
  score?: number;
  feedback?: string;
  evaluatedAt?: Date;
  evaluatedBy?: string;
}

export interface ResolutionWorkflow {
  id: string;
  ticketId: string;
  steps: ResolutionStep[];
  qualityGates: QualityGate[];
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  totalEstimatedTime: number;
  totalActualTime: number;
  overallQualityScore: number;
  createdBy: string;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
}

export interface QualityMetrics {
  technicalAccuracy: number;
  completeness: number;
  efficiency: number;
  customerSatisfaction: number;
  documentation: number;
  adherenceToProcess: number;
  timeToResolution: number;
  firstCallResolution: boolean;
  escalationRequired: boolean;
  followUpNeeded: boolean;
}

export interface QualityAssessment {
  id: string;
  ticketId: string;
  workflowId?: string;
  assessorId: string;
  assessorName: string;
  metrics: QualityMetrics;
  overallScore: number;
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
  feedback: string;
  createdAt: Date;
  status: 'draft' | 'submitted' | 'approved' | 'requires_revision';
}

export interface ResolutionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<ResolutionStep, 'id' | 'status' | 'completedAt' | 'completedBy'>[];
  qualityGates: Omit<QualityGate, 'id' | 'status' | 'score' | 'evaluatedAt' | 'evaluatedBy'>[];
  estimatedTotalTime: number;
}

class ResolutionService {
  private workflows: Map<string, ResolutionWorkflow> = new Map();
  private assessments: Map<string, QualityAssessment> = new Map();
  private templates: Map<string, ResolutionTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const templates: ResolutionTemplate[] = [
      {
        id: 'standard_resolution',
        name: 'Standard Resolution Workflow',
        description: 'Standard workflow for most ticket resolutions',
        category: 'general',
        steps: [
          {
            title: 'Problem Analysis',
            description: 'Analyze and document the root cause of the issue',
            required: true,
            type: 'verification',
            estimatedTime: 15
          },
          {
            title: 'Solution Implementation',
            description: 'Implement the chosen solution',
            required: true,
            type: 'verification',
            estimatedTime: 30
          },
          {
            title: 'Solution Testing',
            description: 'Test the solution to ensure it resolves the issue',
            required: true,
            type: 'testing',
            estimatedTime: 10
          },
          {
            title: 'Customer Verification',
            description: 'Confirm with customer that the issue is resolved',
            required: true,
            type: 'communication',
            estimatedTime: 5
          },
          {
            title: 'Resolution Documentation',
            description: 'Document the solution and steps taken',
            required: true,
            type: 'documentation',
            estimatedTime: 10
          },
          {
            title: 'Follow-up Planning',
            description: 'Plan any necessary follow-up actions',
            required: false,
            type: 'communication',
            estimatedTime: 5
          }
        ],
        qualityGates: [
          {
            name: 'Solution Quality',
            description: 'Evaluate the quality and appropriateness of the solution',
            required: true,
            criteria: [
              {
                id: 'addresses_root_cause',
                description: 'Solution addresses the root cause of the problem',
                type: 'boolean',
                required: true,
                weight: 3
              },
              {
                id: 'implementation_quality',
                description: 'Rate the quality of implementation (1-5)',
                type: 'rating',
                required: true,
                weight: 2
              },
              {
                id: 'future_prevention',
                description: 'Solution prevents similar issues in the future',
                type: 'boolean',
                required: false,
                weight: 1
              }
            ]
          },
          {
            name: 'Customer Satisfaction',
            description: 'Ensure customer is satisfied with the resolution',
            required: true,
            criteria: [
              {
                id: 'issue_resolved',
                description: 'Customer confirms the issue is fully resolved',
                type: 'boolean',
                required: true,
                weight: 3
              },
              {
                id: 'satisfaction_rating',
                description: 'Customer satisfaction rating (1-5)',
                type: 'rating',
                required: true,
                weight: 2
              },
              {
                id: 'additional_needs',
                description: 'Any additional needs or concerns addressed',
                type: 'text',
                required: false,
                weight: 1
              }
            ]
          }
        ],
        estimatedTotalTime: 75
      },
      {
        id: 'hardware_resolution',
        name: 'Hardware Issue Resolution',
        description: 'Specialized workflow for hardware-related issues',
        category: 'hardware',
        steps: [
          {
            title: 'Hardware Diagnosis',
            description: 'Diagnose the hardware issue and identify faulty components',
            required: true,
            type: 'verification',
            estimatedTime: 20
          },
          {
            title: 'Hardware Testing',
            description: 'Test hardware components to confirm diagnosis',
            required: true,
            type: 'testing',
            estimatedTime: 25
          },
          {
            title: 'Hardware Replacement/Repair',
            description: 'Replace or repair faulty hardware components',
            required: true,
            type: 'verification',
            estimatedTime: 45
          },
          {
            title: 'System Verification',
            description: 'Verify system functionality after hardware changes',
            required: true,
            type: 'testing',
            estimatedTime: 15
          },
          {
            title: 'Customer Verification',
            description: 'Confirm with customer that hardware is working properly',
            required: true,
            type: 'communication',
            estimatedTime: 10
          },
          {
            title: 'Hardware Documentation',
            description: 'Document hardware changes and warranty information',
            required: true,
            type: 'documentation',
            estimatedTime: 10
          }
        ],
        qualityGates: [
          {
            name: 'Hardware Quality',
            description: 'Verify hardware repair/replacement quality',
            required: true,
            criteria: [
              {
                id: 'hardware_functional',
                description: 'Hardware is fully functional after repair/replacement',
                type: 'boolean',
                required: true,
                weight: 3
              },
              {
                id: 'warranty_preserved',
                description: 'Hardware warranty status is properly maintained',
                type: 'boolean',
                required: true,
                weight: 2
              },
              {
                id: 'performance_rating',
                description: 'Rate hardware performance after repair (1-5)',
                type: 'rating',
                required: true,
                weight: 2
              }
            ]
          }
        ],
        estimatedTotalTime: 125
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async createWorkflow(ticketId: string, templateId?: string, createdBy?: string): Promise<ResolutionWorkflow> {
    try {
      const workflowId = this.generateWorkflowId();
      const template = templateId ? this.templates.get(templateId) : this.templates.get('standard_resolution');
      
      if (!template) {
        throw new Error('Template not found');
      }

      const steps: ResolutionStep[] = template.steps.map((stepTemplate, index) => ({
        ...stepTemplate,
        id: `step-${index + 1}`,
        status: 'pending'
      }));

      const qualityGates: QualityGate[] = template.qualityGates.map((gateTemplate, index) => ({
        ...gateTemplate,
        id: `gate-${index + 1}`,
        status: 'pending'
      }));

      const workflow: ResolutionWorkflow = {
        id: workflowId,
        ticketId,
        steps,
        qualityGates,
        status: 'not_started',
        totalEstimatedTime: template.estimatedTotalTime,
        totalActualTime: 0,
        overallQualityScore: 0,
        createdBy: createdBy || 'unknown'
      };

      this.workflows.set(workflowId, workflow);

      logger.info('Resolution workflow created', {
        workflowId,
        ticketId,
        templateId,
        stepsCount: steps.length,
        qualityGatesCount: qualityGates.length
      });

      return workflow;
    } catch (error) {
      logger.error('Error creating resolution workflow', { error, ticketId, templateId });
      throw error;
    }
  }

  async updateWorkflowStep(
    workflowId: string, 
    stepId: string, 
    updates: Partial<ResolutionStep>
  ): Promise<ResolutionWorkflow> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const stepIndex = workflow.steps.findIndex(step => step.id === stepId);
      if (stepIndex === -1) {
        throw new Error('Step not found');
      }

      // Update the step
      workflow.steps[stepIndex] = {
        ...workflow.steps[stepIndex],
        ...updates
      };

      // Update workflow status and timing
      const completedSteps = workflow.steps.filter(step => step.status === 'completed');
      const requiredSteps = workflow.steps.filter(step => step.required);
      const completedRequiredSteps = requiredSteps.filter(step => step.status === 'completed');

      if (completedRequiredSteps.length === requiredSteps.length) {
        workflow.status = 'completed';
        workflow.completedAt = new Date();
      } else if (completedSteps.length > 0 && workflow.status === 'not_started') {
        workflow.status = 'in_progress';
        workflow.startedAt = new Date();
      }

      // Calculate total actual time
      workflow.totalActualTime = workflow.steps.reduce((total, step) => {
        return total + (step.actualTime || 0);
      }, 0);

      workflow.lastModifiedAt = new Date();

      logger.info('Workflow step updated', {
        workflowId,
        stepId,
        newStatus: updates.status,
        workflowStatus: workflow.status
      });

      return workflow;
    } catch (error) {
      logger.error('Error updating workflow step', { error, workflowId, stepId, updates });
      throw error;
    }
  }

  async updateQualityGate(
    workflowId: string,
    gateId: string,
    updates: Partial<QualityGate>
  ): Promise<ResolutionWorkflow> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const gateIndex = workflow.qualityGates.findIndex(gate => gate.id === gateId);
      if (gateIndex === -1) {
        throw new Error('Quality gate not found');
      }

      // Update the quality gate
      workflow.qualityGates[gateIndex] = {
        ...workflow.qualityGates[gateIndex],
        ...updates,
        evaluatedAt: new Date()
      };

      // Calculate overall quality score
      const evaluatedGates = workflow.qualityGates.filter(gate => gate.score !== undefined);
      if (evaluatedGates.length > 0) {
        workflow.overallQualityScore = evaluatedGates.reduce((sum, gate) => sum + (gate.score || 0), 0) / evaluatedGates.length;
      }

      workflow.lastModifiedAt = new Date();

      logger.info('Quality gate updated', {
        workflowId,
        gateId,
        newStatus: updates.status,
        score: updates.score,
        overallScore: workflow.overallQualityScore
      });

      return workflow;
    } catch (error) {
      logger.error('Error updating quality gate', { error, workflowId, gateId, updates });
      throw error;
    }
  }

  async getWorkflow(workflowId: string): Promise<ResolutionWorkflow | null> {
    return this.workflows.get(workflowId) || null;
  }

  async getWorkflowByTicket(ticketId: string): Promise<ResolutionWorkflow | null> {
    const workflows = Array.from(this.workflows.values());
    return workflows.find(workflow => workflow.ticketId === ticketId) || null;
  }

  async createQualityAssessment(assessmentData: Partial<QualityAssessment>): Promise<QualityAssessment> {
    try {
      const assessmentId = this.generateAssessmentId();
      
      const assessment: QualityAssessment = {
        id: assessmentId,
        ticketId: assessmentData.ticketId!,
        workflowId: assessmentData.workflowId,
        assessorId: assessmentData.assessorId!,
        assessorName: assessmentData.assessorName!,
        metrics: assessmentData.metrics!,
        overallScore: this.calculateOverallScore(assessmentData.metrics!),
        strengths: assessmentData.strengths || [],
        improvementAreas: assessmentData.improvementAreas || [],
        recommendations: assessmentData.recommendations || [],
        feedback: assessmentData.feedback || '',
        createdAt: new Date(),
        status: assessmentData.status || 'draft'
      };

      this.assessments.set(assessmentId, assessment);

      logger.info('Quality assessment created', {
        assessmentId,
        ticketId: assessment.ticketId,
        overallScore: assessment.overallScore,
        assessorId: assessment.assessorId
      });

      return assessment;
    } catch (error) {
      logger.error('Error creating quality assessment', { error, assessmentData });
      throw error;
    }
  }

  async updateQualityAssessment(
    assessmentId: string,
    updates: Partial<QualityAssessment>
  ): Promise<QualityAssessment> {
    try {
      const assessment = this.assessments.get(assessmentId);
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      const updatedAssessment = {
        ...assessment,
        ...updates
      };

      // Recalculate overall score if metrics were updated
      if (updates.metrics) {
        updatedAssessment.overallScore = this.calculateOverallScore(updates.metrics);
      }

      this.assessments.set(assessmentId, updatedAssessment);

      logger.info('Quality assessment updated', {
        assessmentId,
        newStatus: updates.status,
        overallScore: updatedAssessment.overallScore
      });

      return updatedAssessment;
    } catch (error) {
      logger.error('Error updating quality assessment', { error, assessmentId, updates });
      throw error;
    }
  }

  async getQualityAssessment(assessmentId: string): Promise<QualityAssessment | null> {
    return this.assessments.get(assessmentId) || null;
  }

  async getQualityAssessmentsByTicket(ticketId: string): Promise<QualityAssessment[]> {
    return Array.from(this.assessments.values())
      .filter(assessment => assessment.ticketId === ticketId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getResolutionTemplates(): Promise<ResolutionTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getResolutionMetrics(): Promise<{
    averageResolutionTime: number;
    averageQualityScore: number;
    completionRate: number;
    workflowsByStatus: Record<string, number>;
    qualityDistribution: Record<string, number>;
  }> {
    const workflows = Array.from(this.workflows.values());
    const assessments = Array.from(this.assessments.values());

    const completedWorkflows = workflows.filter(w => w.status === 'completed');
    const averageResolutionTime = completedWorkflows.length > 0
      ? completedWorkflows.reduce((sum, w) => sum + w.totalActualTime, 0) / completedWorkflows.length
      : 0;

    const averageQualityScore = assessments.length > 0
      ? assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length
      : 0;

    const completionRate = workflows.length > 0
      ? (completedWorkflows.length / workflows.length) * 100
      : 0;

    const workflowsByStatus = workflows.reduce((acc, workflow) => {
      acc[workflow.status] = (acc[workflow.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const qualityDistribution = assessments.reduce((acc, assessment) => {
      const range = this.getQualityRange(assessment.overallScore);
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      averageResolutionTime,
      averageQualityScore,
      completionRate,
      workflowsByStatus,
      qualityDistribution
    };
  }

  private calculateOverallScore(metrics: QualityMetrics): number {
    const ratingMetrics = [
      metrics.technicalAccuracy,
      metrics.completeness,
      metrics.efficiency,
      metrics.customerSatisfaction,
      metrics.documentation,
      metrics.adherenceToProcess
    ];
    
    const average = ratingMetrics.reduce((sum, score) => sum + score, 0) / ratingMetrics.length;
    
    // Apply bonuses/penalties for boolean metrics
    let adjustedScore = average;
    if (metrics.firstCallResolution) adjustedScore += 0.2;
    if (metrics.escalationRequired) adjustedScore -= 0.1;
    if (metrics.followUpNeeded) adjustedScore -= 0.1;
    
    return Math.min(5, Math.max(1, Math.round(adjustedScore * 100) / 100));
  }

  private getQualityRange(score: number): string {
    if (score >= 4.5) return 'excellent';
    if (score >= 3.5) return 'good';
    if (score >= 2.5) return 'satisfactory';
    return 'needs_improvement';
  }

  private generateWorkflowId(): string {
    return `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAssessmentId(): string {
    return `QA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const resolutionService = new ResolutionService();