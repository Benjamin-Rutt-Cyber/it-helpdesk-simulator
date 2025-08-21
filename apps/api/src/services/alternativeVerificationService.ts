import { logger } from '../utils/logger';

export interface AlternativeVerificationMethod {
  id: string;
  name: string;
  type: 'manager_approval' | 'callback_verification' | 'email_verification' | 'badge_verification' | 'emergency_override';
  description: string;
  requirements: string[];
  securityLevel: 'high' | 'medium' | 'low';
  processingTime: number; // in minutes
  availableWhen: string[];
  steps: VerificationStep[];
}

export interface VerificationStep {
  id: string;
  description: string;
  action: 'contact_manager' | 'send_email' | 'make_callback' | 'verify_badge' | 'document_override';
  requiredData: string[];
  verification: string;
}

export interface AlternativeVerificationRequest {
  id: string;
  ticketId: string;
  userId: string;
  methodId: string;
  reason: string;
  status: 'pending' | 'in_progress' | 'approved' | 'denied' | 'expired';
  requestedAt: Date;
  completedAt?: Date;
  approver?: string;
  evidence?: string[];
  notes?: string;
}

class AlternativeVerificationService {
  private methods: Map<string, AlternativeVerificationMethod> = new Map();
  private requests: Map<string, AlternativeVerificationRequest> = new Map();

  constructor() {
    this.initializeMethods();
  }

  private initializeMethods(): void {
    const methods: AlternativeVerificationMethod[] = [
      {
        id: 'manager_approval',
        name: 'Manager Approval',
        type: 'manager_approval',
        description: 'Verify customer identity through their direct supervisor or manager',
        requirements: ['manager_contact_info', 'customer_department', 'business_justification'],
        securityLevel: 'high',
        processingTime: 15,
        availableWhen: ['incomplete_customer_info', 'customer_unavailable', 'system_issues'],
        steps: [
          {
            id: 'contact_manager',
            description: 'Contact the customer\'s manager for verification',
            action: 'contact_manager',
            requiredData: ['manager_name', 'manager_phone', 'manager_email'],
            verification: 'Manager confirms customer identity and request authenticity',
          },
          {
            id: 'document_approval',
            description: 'Document manager approval and verification details',
            action: 'document_override',
            requiredData: ['manager_name', 'approval_time', 'verification_method'],
            verification: 'Manager approval documented in ticket system',
          },
        ],
      },
      {
        id: 'callback_verification',
        name: 'Callback Verification',
        type: 'callback_verification',
        description: 'Call customer back on official company number to verify identity',
        requirements: ['official_phone_number', 'customer_extension', 'department_verification'],
        securityLevel: 'high',
        processingTime: 10,
        availableWhen: ['phone_verification_needed', 'identity_doubts', 'security_protocol'],
        steps: [
          {
            id: 'lookup_number',
            description: 'Look up official company phone number for customer',
            action: 'verify_badge',
            requiredData: ['customer_name', 'department', 'employee_directory'],
            verification: 'Phone number verified against company directory',
          },
          {
            id: 'make_callback',
            description: 'Call customer back on verified number',
            action: 'make_callback',
            requiredData: ['official_phone', 'extension', 'callback_script'],
            verification: 'Customer answers callback and confirms original request',
          },
        ],
      },
      {
        id: 'email_verification',
        name: 'Email Verification',
        type: 'email_verification',
        description: 'Send verification link to customer\'s official email address',
        requirements: ['official_email_address', 'email_verification_system', 'secure_link'],
        securityLevel: 'medium',
        processingTime: 20,
        availableWhen: ['phone_unavailable', 'customer_preference', 'documentation_needed'],
        steps: [
          {
            id: 'verify_email',
            description: 'Verify customer\'s official email address',
            action: 'verify_badge',
            requiredData: ['customer_email', 'domain_verification', 'employee_directory'],
            verification: 'Email address verified against company directory',
          },
          {
            id: 'send_verification',
            description: 'Send secure verification link to customer',
            action: 'send_email',
            requiredData: ['verification_link', 'ticket_reference', 'security_token'],
            verification: 'Customer clicks verification link and confirms identity',
          },
        ],
      },
      {
        id: 'badge_verification',
        name: 'Physical Badge Verification',
        type: 'badge_verification',
        description: 'Verify customer identity through physical security badge or ID',
        requirements: ['badge_reader_access', 'security_personnel', 'physical_presence'],
        securityLevel: 'high',
        processingTime: 5,
        availableWhen: ['in_person_support', 'high_security_request', 'badge_system_available'],
        steps: [
          {
            id: 'badge_scan',
            description: 'Scan customer\'s security badge or employee ID',
            action: 'verify_badge',
            requiredData: ['badge_number', 'photo_id', 'access_level'],
            verification: 'Badge information matches customer claim and photo ID',
          },
          {
            id: 'access_verification',
            description: 'Verify badge access level matches request requirements',
            action: 'verify_badge',
            requiredData: ['access_permissions', 'department_clearance', 'request_scope'],
            verification: 'Customer has appropriate access level for requested support',
          },
        ],
      },
      {
        id: 'emergency_override',
        name: 'Emergency Override',
        type: 'emergency_override',
        description: 'Emergency bypass of verification for critical business situations',
        requirements: ['emergency_justification', 'supervisor_approval', 'post_verification_review'],
        securityLevel: 'low',
        processingTime: 2,
        availableWhen: ['business_critical', 'system_outage', 'executive_emergency'],
        steps: [
          {
            id: 'emergency_justification',
            description: 'Document emergency situation and business impact',
            action: 'document_override',
            requiredData: ['emergency_reason', 'business_impact', 'urgency_level'],
            verification: 'Emergency situation documented and justified',
          },
          {
            id: 'supervisor_approval',
            description: 'Get immediate supervisor approval for emergency override',
            action: 'contact_manager',
            requiredData: ['supervisor_name', 'approval_method', 'override_reason'],
            verification: 'Supervisor provides explicit approval for emergency override',
          },
          {
            id: 'post_review_scheduled',
            description: 'Schedule post-incident review of emergency override',
            action: 'document_override',
            requiredData: ['review_date', 'reviewer_assigned', 'audit_requirements'],
            verification: 'Post-incident review scheduled for compliance audit',
          },
        ],
      },
    ];

    methods.forEach(method => {
      this.methods.set(method.id, method);
    });

    logger.info('Alternative verification methods initialized', {
      methodCount: methods.length,
      methods: methods.map(m => ({ id: m.id, name: m.name, securityLevel: m.securityLevel })),
    });
  }

  async getAvailableMethods(
    ticketId: string,
    reason: string,
    context?: string[]
  ): Promise<AlternativeVerificationMethod[]> {
    const availableMethods = Array.from(this.methods.values()).filter(method => {
      // Check if method is applicable for the given reason/context
      if (context) {
        return method.availableWhen.some(condition => context.includes(condition));
      }
      return true;
    });

    // Sort by security level (high first) and processing time
    return availableMethods.sort((a, b) => {
      const securityWeight = { high: 3, medium: 2, low: 1 };
      const aWeight = securityWeight[a.securityLevel];
      const bWeight = securityWeight[b.securityLevel];
      
      if (aWeight !== bWeight) {
        return bWeight - aWeight; // Higher security first
      }
      
      return a.processingTime - b.processingTime; // Faster processing first
    });
  }

  async requestAlternativeVerification(
    ticketId: string,
    userId: string,
    methodId: string,
    reason: string,
    requiredData?: { [key: string]: string }
  ): Promise<string> {
    const method = this.methods.get(methodId);
    if (!method) {
      throw new Error(`Alternative verification method not found: ${methodId}`);
    }

    // Check if all requirements are met
    for (const requirement of method.requirements) {
      if (!requiredData || !requiredData[requirement]) {
        throw new Error(`Required data missing for ${method.name}: ${requirement}`);
      }
    }

    const requestId = `alt_ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: AlternativeVerificationRequest = {
      id: requestId,
      ticketId,
      userId,
      methodId,
      reason,
      status: 'pending',
      requestedAt: new Date(),
      evidence: requiredData ? Object.values(requiredData) : [],
    };

    this.requests.set(requestId, request);

    // Simulate processing based on method type
    if (method.type === 'emergency_override') {
      // Emergency overrides need immediate supervisor contact
      await this.processEmergencyOverride(requestId);
    } else {
      // Other methods go through standard processing
      await this.processStandardVerification(requestId);
    }

    logger.info('Alternative verification requested', {
      requestId,
      ticketId,
      userId,
      methodId,
      method: method.name,
      reason,
    });

    return requestId;
  }

  private async processEmergencyOverride(requestId: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) return;

    // Simulate emergency override processing
    setTimeout(() => {
      request.status = 'in_progress';
      request.notes = 'Emergency override initiated, supervisor approval pending';
      this.requests.set(requestId, request);
      
      // Simulate supervisor approval
      setTimeout(() => {
        request.status = 'approved';
        request.completedAt = new Date();
        request.approver = 'Emergency Supervisor';
        request.notes += '; Emergency override approved';
        this.requests.set(requestId, request);
      }, 30000); // 30 seconds for emergency approval
    }, 5000); // 5 seconds initial processing
  }

  private async processStandardVerification(requestId: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) return;
    
    const method = this.methods.get(request.methodId);
    if (!method) return;

    // Simulate standard verification processing
    setTimeout(() => {
      request.status = 'in_progress';
      request.notes = `Processing ${method.name} verification`;
      this.requests.set(requestId, request);
      
      // Simulate completion
      setTimeout(() => {
        const approved = Math.random() > 0.2; // 80% approval rate
        request.status = approved ? 'approved' : 'denied';
        request.completedAt = new Date();
        request.approver = approved ? 'Verification System' : 'Security Review';
        request.notes += approved ? '; Verification completed successfully' : '; Verification failed requirements';
        this.requests.set(requestId, request);
      }, method.processingTime * 60000); // Convert minutes to milliseconds
    }, 10000); // 10 seconds initial processing
  }

  async getRequestStatus(requestId: string): Promise<AlternativeVerificationRequest | undefined> {
    return this.requests.get(requestId);
  }

  async getTicketRequests(ticketId: string): Promise<AlternativeVerificationRequest[]> {
    return Array.from(this.requests.values())
      .filter(request => request.ticketId === ticketId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async approveRequest(
    requestId: string,
    approverId: string,
    notes?: string
  ): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Alternative verification request not found: ${requestId}`);
    }

    if (request.status !== 'in_progress' && request.status !== 'pending') {
      throw new Error(`Request cannot be approved in current status: ${request.status}`);
    }

    request.status = 'approved';
    request.completedAt = new Date();
    request.approver = approverId;
    if (notes) {
      request.notes = (request.notes || '') + '; ' + notes;
    }

    this.requests.set(requestId, request);

    logger.info('Alternative verification request approved', {
      requestId,
      approverId,
      ticketId: request.ticketId,
      methodId: request.methodId,
    });
  }

  async denyRequest(
    requestId: string,
    reviewerId: string,
    reason: string
  ): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Alternative verification request not found: ${requestId}`);
    }

    if (request.status !== 'in_progress' && request.status !== 'pending') {
      throw new Error(`Request cannot be denied in current status: ${request.status}`);
    }

    request.status = 'denied';
    request.completedAt = new Date();
    request.approver = reviewerId;
    request.notes = (request.notes || '') + `; Denied: ${reason}`;

    this.requests.set(requestId, request);

    logger.info('Alternative verification request denied', {
      requestId,
      reviewerId,
      reason,
      ticketId: request.ticketId,
      methodId: request.methodId,
    });
  }

  async getVerificationGuidance(methodId: string): Promise<{
    method: AlternativeVerificationMethod;
    stepByStepGuidance: Array<{
      step: string;
      description: string;
      tips: string[];
      commonIssues: string[];
    }>;
    securityConsiderations: string[];
    complianceNotes: string[];
  }> {
    const method = this.methods.get(methodId);
    if (!method) {
      throw new Error(`Verification method not found: ${methodId}`);
    }

    const stepByStepGuidance = method.steps.map(step => ({
      step: step.description,
      description: step.verification,
      tips: this.getStepTips(step.action),
      commonIssues: this.getCommonIssues(step.action),
    }));

    const securityConsiderations = this.getSecurityConsiderations(method.type);
    const complianceNotes = this.getComplianceNotes(method.type);

    return {
      method,
      stepByStepGuidance,
      securityConsiderations,
      complianceNotes,
    };
  }

  private getStepTips(action: string): string[] {
    const tips = {
      'contact_manager': [
        'Verify manager contact information through company directory',
        'Explain the security verification process clearly',
        'Document all communication with manager',
      ],
      'make_callback': [
        'Use only official company phone numbers',
        'Follow callback verification script',
        'Document callback results thoroughly',
      ],
      'send_email': [
        'Verify email domain matches company domain',
        'Use secure verification links with expiration',
        'Include clear instructions for customer',
      ],
      'verify_badge': [
        'Check badge photo against additional ID if available',
        'Verify badge hasn\'t been reported lost or stolen',
        'Ensure badge access level matches request scope',
      ],
      'document_override': [
        'Include detailed justification for override',
        'Document all approvers and approval timestamps',
        'Schedule follow-up review as required',
      ],
    };

    return tips[action] || ['Follow standard verification procedures'];
  }

  private getCommonIssues(action: string): string[] {
    const issues = {
      'contact_manager': [
        'Manager unavailable or unresponsive',
        'Manager doesn\'t recognize the customer',
        'Unclear chain of command',
      ],
      'make_callback': [
        'Phone number not in company directory',
        'Customer doesn\'t answer callback',
        'Phone system issues',
      ],
      'send_email': [
        'Email bounces or rejected',
        'Customer doesn\'t check email regularly',
        'Verification link expires before use',
      ],
      'verify_badge': [
        'Badge damaged or unreadable',
        'Badge reported lost or stolen',
        'Badge access level insufficient',
      ],
      'document_override': [
        'Incomplete documentation',
        'Insufficient justification',
        'Missing approver signatures',
      ],
    };

    return issues[action] || ['General verification issues'];
  }

  private getSecurityConsiderations(methodType: string): string[] {
    const considerations = {
      'manager_approval': [
        'Verify manager identity before accepting approval',
        'Ensure manager has authority to approve for customer',
        'Document approval trail for audit purposes',
      ],
      'callback_verification': [
        'Only use verified company phone numbers',
        'Confirm customer identity through multiple questions',
        'Be alert to potential social engineering attempts',
      ],
      'email_verification': [
        'Verify email domain authenticity',
        'Use time-limited verification links',
        'Monitor for email spoofing attempts',
      ],
      'badge_verification': [
        'Check badge against lost/stolen database',
        'Verify photo ID matches badge holder',
        'Ensure badge hasn\'t been tampered with',
      ],
      'emergency_override': [
        'Document emergency thoroughly',
        'Require supervisor approval',
        'Schedule mandatory post-incident review',
        'Monitor for override abuse',
      ],
    };

    return considerations[methodType] || ['Follow general security practices'];
  }

  private getComplianceNotes(methodType: string): string[] {
    const notes = {
      'manager_approval': [
        'Manager approval must be documented for audit compliance',
        'Approval chain must match organizational hierarchy',
      ],
      'callback_verification': [
        'Callback attempts must be logged with timestamps',
        'Phone verification meets regulatory requirements',
      ],
      'email_verification': [
        'Email verification provides audit trail',
        'Secure links comply with data protection standards',
      ],
      'badge_verification': [
        'Physical verification provides highest assurance',
        'Badge systems must be integrated with HR records',
      ],
      'emergency_override': [
        'Emergency overrides require post-incident review',
        'Override documentation must justify business need',
        'Compliance team must review all emergency actions',
      ],
    };

    return notes[methodType] || ['Document all verification activities'];
  }

  async getAlternativeVerificationInsights(): Promise<{
    totalRequests: number;
    approvalRate: number;
    averageProcessingTime: number;
    mostUsedMethods: Array<{ method: string; count: number }>;
    securityImpact: string;
  }> {
    const requests = Array.from(this.requests.values());
    const completedRequests = requests.filter(r => r.completedAt);
    
    const totalProcessingTime = completedRequests.reduce((sum, request) => {
      if (request.completedAt) {
        return sum + (request.completedAt.getTime() - request.requestedAt.getTime());
      }
      return sum;
    }, 0);

    const approvedRequests = requests.filter(r => r.status === 'approved');
    const methodCounts = requests.reduce((acc, request) => {
      acc[request.methodId] = (acc[request.methodId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalRequests: requests.length,
      approvalRate: requests.length > 0 ? (approvedRequests.length / requests.length) * 100 : 0,
      averageProcessingTime: completedRequests.length > 0 ? totalProcessingTime / completedRequests.length : 0,
      mostUsedMethods: Object.entries(methodCounts)
        .map(([method, count]) => ({ method, count }))
        .sort((a, b) => b.count - a.count),
      securityImpact: this.calculateSecurityImpact(requests),
    };
  }

  private calculateSecurityImpact(requests: AlternativeVerificationRequest[]): string {
    const emergencyOverrides = requests.filter(r => r.methodId === 'emergency_override').length;
    const totalRequests = requests.length;
    
    if (totalRequests === 0) return 'No impact';
    
    const overridePercentage = (emergencyOverrides / totalRequests) * 100;
    
    if (overridePercentage > 20) {
      return 'High risk - excessive emergency overrides';
    } else if (overridePercentage > 10) {
      return 'Medium risk - monitor override usage';
    } else {
      return 'Low risk - appropriate alternative method usage';
    }
  }
}

export const alternativeVerificationService = new AlternativeVerificationService();
export default alternativeVerificationService;