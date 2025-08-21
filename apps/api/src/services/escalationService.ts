import { logger } from '../utils/logger';

export interface EscalationRequest {
  id: string;
  ticketId: string;
  category: 'technical_complexity' | 'permissions' | 'hardware_failure' | 'policy_exception' | 'resource_intensive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  justification: string;
  technicalDetails?: string;
  attemptedSolutions: string[];
  requiredPermissions?: string;
  businessImpact: string;
  deadline?: Date;
  escalationTarget: 'l2_support' | 'system_admin' | 'security_team' | 'management' | 'vendor_support';
  customerNotified: boolean;
  attachments: string[];
  createdAt: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'in_progress' | 'resolved';
  assignedTo?: string;
  comments: EscalationComment[];
  performanceMetrics: {
    timeToEscalate: number; // minutes from ticket creation
    escalationDuration?: number; // minutes from escalation to resolution
    customerSatisfaction?: number; // 1-5 rating
    resolutionQuality?: number; // 1-5 rating
  };
}

export interface EscalationComment {
  id: string;
  escalationId: string;
  author: string;
  authorRole: 'technician' | 'l2_support' | 'admin' | 'manager';
  message: string;
  timestamp: Date;
  type: 'system' | 'user' | 'escalation_team';
  attachments?: string[];
}

export interface EscalationCriteria {
  category: string;
  requiredFields: string[];
  approvalRequired: boolean;
  timeLimit?: number; // minutes
  businessImpactThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface EscalationTarget {
  id: string;
  name: string;
  description: string;
  availability: {
    hours: string;
    timezone: string;
    responseTime: number; // minutes
  };
  specialties: string[];
  escalationCriteria: EscalationCriteria[];
}

class EscalationService {
  private escalations: Map<string, EscalationRequest> = new Map();
  private targets: Map<string, EscalationTarget> = new Map();

  constructor() {
    this.initializeTargets();
  }

  private initializeTargets(): void {
    const targets: EscalationTarget[] = [
      {
        id: 'l2_support',
        name: 'Level 2 Support',
        description: 'Advanced technical support team',
        availability: {
          hours: '24/7',
          timezone: 'EST',
          responseTime: 30
        },
        specialties: [
          'Complex software troubleshooting',
          'Network connectivity issues',
          'Advanced system diagnostics',
          'Multi-system integration problems'
        ],
        escalationCriteria: [
          {
            category: 'technical_complexity',
            requiredFields: ['technicalDetails', 'attemptedSolutions', 'businessImpact'],
            approvalRequired: false,
            timeLimit: 120,
            businessImpactThreshold: 'medium'
          }
        ]
      },
      {
        id: 'system_admin',
        name: 'System Administrator',
        description: 'Infrastructure and server administration',
        availability: {
          hours: '6:00 AM - 6:00 PM EST',
          timezone: 'EST',
          responseTime: 15
        },
        specialties: [
          'Server administration',
          'Active Directory management',
          'Network infrastructure',
          'Security permissions'
        ],
        escalationCriteria: [
          {
            category: 'permissions',
            requiredFields: ['requiredPermissions', 'justification', 'businessImpact'],
            approvalRequired: true,
            businessImpactThreshold: 'high'
          }
        ]
      },
      {
        id: 'security_team',
        name: 'Security Team',
        description: 'Information security and compliance',
        availability: {
          hours: '24/7',
          timezone: 'EST',
          responseTime: 10
        },
        specialties: [
          'Security incidents',
          'Access control',
          'Malware remediation',
          'Compliance issues'
        ],
        escalationCriteria: [
          {
            category: 'policy_exception',
            requiredFields: ['justification', 'businessImpact', 'escalationTarget'],
            approvalRequired: true,
            businessImpactThreshold: 'critical'
          }
        ]
      },
      {
        id: 'management',
        name: 'IT Management',
        description: 'Management approval and policy decisions',
        availability: {
          hours: '8:00 AM - 5:00 PM EST',
          timezone: 'EST',
          responseTime: 60
        },
        specialties: [
          'Policy exceptions',
          'Budget approvals',
          'Resource allocation',
          'Vendor negotiations'
        ],
        escalationCriteria: [
          {
            category: 'resource_intensive',
            requiredFields: ['technicalDetails', 'businessImpact', 'deadline'],
            approvalRequired: true,
            businessImpactThreshold: 'high'
          }
        ]
      },
      {
        id: 'vendor_support',
        name: 'Vendor Support',
        description: 'Third-party vendor assistance',
        availability: {
          hours: 'Varies by vendor',
          timezone: 'Multiple',
          responseTime: 240
        },
        specialties: [
          'Third-party software issues',
          'Hardware warranty claims',
          'Vendor-specific troubleshooting',
          'Software licensing'
        ],
        escalationCriteria: [
          {
            category: 'hardware_failure',
            requiredFields: ['technicalDetails', 'businessImpact', 'deadline'],
            approvalRequired: false,
            businessImpactThreshold: 'medium'
          }
        ]
      }
    ];

    targets.forEach(target => {
      this.targets.set(target.id, target);
    });
  }

  async createEscalation(escalationData: Partial<EscalationRequest>): Promise<EscalationRequest> {
    try {
      const escalationId = this.generateEscalationId();
      
      const escalation: EscalationRequest = {
        id: escalationId,
        ticketId: escalationData.ticketId!,
        category: escalationData.category!,
        priority: escalationData.priority || 'medium',
        justification: escalationData.justification!,
        technicalDetails: escalationData.technicalDetails,
        attemptedSolutions: escalationData.attemptedSolutions || [],
        requiredPermissions: escalationData.requiredPermissions,
        businessImpact: escalationData.businessImpact!,
        deadline: escalationData.deadline,
        escalationTarget: escalationData.escalationTarget!,
        customerNotified: escalationData.customerNotified || false,
        attachments: escalationData.attachments || [],
        createdAt: new Date(),
        status: 'draft',
        comments: [],
        performanceMetrics: {
          timeToEscalate: 0 // Will be calculated when submitted
        }
      };

      // Validate escalation against target criteria
      const validationResult = await this.validateEscalation(escalation);
      if (!validationResult.isValid) {
        throw new Error(`Escalation validation failed: ${validationResult.errors.join(', ')}`);
      }

      this.escalations.set(escalationId, escalation);
      
      logger.info('Escalation created', {
        escalationId,
        ticketId: escalation.ticketId,
        category: escalation.category,
        target: escalation.escalationTarget
      });

      return escalation;
    } catch (error) {
      logger.error('Error creating escalation', { error, escalationData });
      throw error;
    }
  }

  async submitEscalation(escalationId: string): Promise<EscalationRequest> {
    try {
      const escalation = this.escalations.get(escalationId);
      if (!escalation) {
        throw new Error('Escalation not found');
      }

      if (escalation.status !== 'draft') {
        throw new Error('Only draft escalations can be submitted');
      }

      // Final validation before submission
      const validationResult = await this.validateEscalation(escalation);
      if (!validationResult.isValid) {
        throw new Error(`Escalation validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Update escalation status and metrics
      escalation.status = 'submitted';
      escalation.updatedAt = new Date();
      escalation.performanceMetrics.timeToEscalate = this.calculateTimeToEscalate(escalation);

      // Add system comment
      await this.addComment(escalationId, {
        author: 'System',
        authorRole: 'technician',
        message: `Escalation submitted to ${this.getTargetName(escalation.escalationTarget)}`,
        type: 'system'
      });

      // Notify escalation target
      await this.notifyEscalationTarget(escalation);

      logger.info('Escalation submitted', {
        escalationId,
        ticketId: escalation.ticketId,
        target: escalation.escalationTarget,
        timeToEscalate: escalation.performanceMetrics.timeToEscalate
      });

      return escalation;
    } catch (error) {
      logger.error('Error submitting escalation', { error, escalationId });
      throw error;
    }
  }

  async updateEscalationStatus(
    escalationId: string, 
    status: EscalationRequest['status'],
    assignedTo?: string
  ): Promise<EscalationRequest> {
    try {
      const escalation = this.escalations.get(escalationId);
      if (!escalation) {
        throw new Error('Escalation not found');
      }

      const previousStatus = escalation.status;
      escalation.status = status;
      escalation.updatedAt = new Date();

      if (assignedTo) {
        escalation.assignedTo = assignedTo;
      }

      if (status === 'resolved') {
        escalation.resolvedAt = new Date();
        escalation.performanceMetrics.escalationDuration = this.calculateEscalationDuration(escalation);
      }

      // Add system comment for status change
      await this.addComment(escalationId, {
        author: 'System',
        authorRole: 'technician',
        message: `Status changed from ${previousStatus} to ${status}${assignedTo ? ` (assigned to ${assignedTo})` : ''}`,
        type: 'system'
      });

      logger.info('Escalation status updated', {
        escalationId,
        previousStatus,
        newStatus: status,
        assignedTo
      });

      return escalation;
    } catch (error) {
      logger.error('Error updating escalation status', { error, escalationId, status });
      throw error;
    }
  }

  async addComment(
    escalationId: string, 
    commentData: Omit<EscalationComment, 'id' | 'escalationId' | 'timestamp'>
  ): Promise<EscalationComment> {
    try {
      const escalation = this.escalations.get(escalationId);
      if (!escalation) {
        throw new Error('Escalation not found');
      }

      const comment: EscalationComment = {
        id: this.generateCommentId(),
        escalationId,
        timestamp: new Date(),
        ...commentData
      };

      escalation.comments.push(comment);
      escalation.updatedAt = new Date();

      logger.info('Comment added to escalation', {
        escalationId,
        commentId: comment.id,
        author: comment.author
      });

      return comment;
    } catch (error) {
      logger.error('Error adding comment', { error, escalationId, commentData });
      throw error;
    }
  }

  async getEscalation(escalationId: string): Promise<EscalationRequest | null> {
    return this.escalations.get(escalationId) || null;
  }

  async getEscalationsByTicket(ticketId: string): Promise<EscalationRequest[]> {
    return Array.from(this.escalations.values())
      .filter(escalation => escalation.ticketId === ticketId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getEscalationsByStatus(status: EscalationRequest['status']): Promise<EscalationRequest[]> {
    return Array.from(this.escalations.values())
      .filter(escalation => escalation.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async validateEscalation(escalation: EscalationRequest): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check required fields
    if (!escalation.category) errors.push('Category is required');
    if (!escalation.justification || escalation.justification.length < 50) {
      errors.push('Justification must be at least 50 characters');
    }
    if (!escalation.businessImpact) errors.push('Business impact is required');
    if (!escalation.escalationTarget) errors.push('Escalation target is required');

    // Check target-specific requirements
    const target = this.targets.get(escalation.escalationTarget);
    if (!target) {
      errors.push('Invalid escalation target');
    } else {
      const criteria = target.escalationCriteria.find(c => c.category === escalation.category);
      if (criteria) {
        criteria.requiredFields.forEach(field => {
          if (field === 'attemptedSolutions' && (!escalation.attemptedSolutions || escalation.attemptedSolutions.length === 0)) {
            errors.push('At least one attempted solution is required');
          } else if (field !== 'attemptedSolutions' && !escalation[field as keyof EscalationRequest]) {
            errors.push(`${field} is required for this category`);
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getEscalationTargets(): EscalationTarget[] {
    return Array.from(this.targets.values());
  }

  getEscalationGuidelines(): {
    categories: Array<{
      id: string;
      name: string;
      description: string;
      requiredFields: string[];
      priority: string;
    }>;
    targets: EscalationTarget[];
  } {
    const categories = [
      {
        id: 'technical_complexity',
        name: 'Technical Complexity',
        description: 'Issue requires specialized knowledge or advanced troubleshooting',
        requiredFields: ['technicalDetails', 'attemptedSolutions', 'businessImpact'],
        priority: 'medium'
      },
      {
        id: 'permissions',
        name: 'Permissions Required',
        description: 'Resolution requires elevated privileges or admin access',
        requiredFields: ['requiredPermissions', 'justification', 'businessImpact'],
        priority: 'high'
      },
      {
        id: 'hardware_failure',
        name: 'Hardware Failure',
        description: 'Physical hardware replacement or repair needed',
        requiredFields: ['technicalDetails', 'businessImpact', 'deadline'],
        priority: 'high'
      },
      {
        id: 'policy_exception',
        name: 'Policy Exception',
        description: 'Request requires exception to company policies',
        requiredFields: ['justification', 'businessImpact', 'escalationTarget'],
        priority: 'critical'
      },
      {
        id: 'resource_intensive',
        name: 'Resource Intensive',
        description: 'Solution requires significant time or system resources',
        requiredFields: ['technicalDetails', 'businessImpact', 'deadline'],
        priority: 'medium'
      }
    ];

    return {
      categories,
      targets: this.getEscalationTargets()
    };
  }

  async getEscalationMetrics(): Promise<{
    totalEscalations: number;
    escalationsByStatus: Record<string, number>;
    escalationsByCategory: Record<string, number>;
    averageTimeToEscalate: number;
    averageEscalationDuration: number;
    escalationRate: number; // percentage of tickets escalated
  }> {
    const escalations = Array.from(this.escalations.values());
    
    const escalationsByStatus = escalations.reduce((acc, escalation) => {
      acc[escalation.status] = (acc[escalation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const escalationsByCategory = escalations.reduce((acc, escalation) => {
      acc[escalation.category] = (acc[escalation.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timeToEscalateValues = escalations
      .map(e => e.performanceMetrics.timeToEscalate)
      .filter(t => t > 0);
    
    const escalationDurationValues = escalations
      .map(e => e.performanceMetrics.escalationDuration)
      .filter(d => d !== undefined) as number[];

    return {
      totalEscalations: escalations.length,
      escalationsByStatus,
      escalationsByCategory,
      averageTimeToEscalate: timeToEscalateValues.length > 0 
        ? timeToEscalateValues.reduce((a, b) => a + b, 0) / timeToEscalateValues.length 
        : 0,
      averageEscalationDuration: escalationDurationValues.length > 0
        ? escalationDurationValues.reduce((a, b) => a + b, 0) / escalationDurationValues.length
        : 0,
      escalationRate: 0 // Would need ticket count to calculate
    };
  }

  private generateEscalationId(): string {
    return `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCommentId(): string {
    return `CMT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateTimeToEscalate(escalation: EscalationRequest): number {
    // This would typically calculate time from ticket creation to escalation
    // For now, using creation to submission time
    const submissionTime = escalation.updatedAt || new Date();
    return Math.round((submissionTime.getTime() - escalation.createdAt.getTime()) / (1000 * 60));
  }

  private calculateEscalationDuration(escalation: EscalationRequest): number {
    if (!escalation.resolvedAt) return 0;
    
    const startTime = escalation.updatedAt || escalation.createdAt;
    return Math.round((escalation.resolvedAt.getTime() - startTime.getTime()) / (1000 * 60));
  }

  private getTargetName(targetId: string): string {
    const target = this.targets.get(targetId);
    return target ? target.name : targetId;
  }

  private async notifyEscalationTarget(escalation: EscalationRequest): Promise<void> {
    // This would send notifications to the escalation target
    // Implementation would depend on notification system (email, Slack, etc.)
    logger.info('Notification sent to escalation target', {
      escalationId: escalation.id,
      target: escalation.escalationTarget
    });
  }
}

export const escalationService = new EscalationService();