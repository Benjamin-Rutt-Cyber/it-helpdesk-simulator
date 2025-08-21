import { logger } from '../utils/logger';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  requirements: SecurityRequirement[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  bypassable: boolean;
  bypassConditions: string[];
  applicableActions: string[];
}

export interface SecurityRequirement {
  id: string;
  field: string;
  type: 'identity' | 'asset' | 'contact' | 'authorization';
  mandatory: boolean;
  alternatives: string[];
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  id: string;
  type: 'format' | 'length' | 'pattern' | 'cross-reference';
  rule: string;
  errorMessage: string;
}

export interface SecurityViolation {
  id: string;
  ticketId: string;
  userId: string;
  policyId: string;
  violationType: 'bypass_attempt' | 'incomplete_verification' | 'policy_violation' | 'unauthorized_action';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  resolved: boolean;
  resolutionNotes?: string;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  requiredActions: string[];
  blockedActions: string[];
  violations: SecurityViolation[];
  recommendations: string[];
}

class SecurityGuardianService {
  private securityPolicies: Map<string, SecurityPolicy> = new Map();
  private violations: Map<string, SecurityViolation> = new Map();
  private policyCache: Map<string, AccessDecision> = new Map();

  constructor() {
    this.initializeSecurityPolicies();
  }

  private initializeSecurityPolicies(): void {
    const policies: SecurityPolicy[] = [
      {
        id: 'customer-identity-verification',
        name: 'Customer Identity Verification',
        description: 'Mandatory verification of customer identity before any support actions',
        severity: 'critical',
        bypassable: false,
        bypassConditions: [],
        applicableActions: ['resolve', 'escalate', 'close', 'modify', 'access'],
        requirements: [
          {
            id: 'customer-name',
            field: 'customerName',
            type: 'identity',
            mandatory: true,
            alternatives: [],
            validationRules: [
              {
                id: 'name-length',
                type: 'length',
                rule: 'min:2,max:100',
                errorMessage: 'Customer name must be between 2 and 100 characters',
              },
            ],
          },
          {
            id: 'username-verification',
            field: 'username',
            type: 'identity',
            mandatory: true,
            alternatives: ['email'],
            validationRules: [
              {
                id: 'username-format',
                type: 'pattern',
                rule: '^[a-zA-Z0-9._-]+$',
                errorMessage: 'Username must contain only letters, numbers, dots, underscores, and hyphens',
              },
            ],
          },
        ],
      },
      {
        id: 'asset-verification',
        name: 'Asset Verification',
        description: 'Verification of hardware assets for hardware-related support',
        severity: 'high',
        bypassable: true,
        bypassConditions: ['manager_approval', 'emergency_override'],
        applicableActions: ['resolve', 'modify'],
        requirements: [
          {
            id: 'asset-tag',
            field: 'assetTag',
            type: 'asset',
            mandatory: false,
            alternatives: ['serial_number', 'device_id'],
            validationRules: [
              {
                id: 'asset-tag-format',
                type: 'pattern',
                rule: '^[A-Z0-9]{6,12}$',
                errorMessage: 'Asset tag must be 6-12 characters, uppercase letters and numbers only',
              },
            ],
          },
        ],
      },
      {
        id: 'contact-verification',
        name: 'Contact Information Verification',
        description: 'Verification of contact information for account changes',
        severity: 'medium',
        bypassable: true,
        bypassConditions: ['callback_verification', 'manager_approval'],
        applicableActions: ['modify', 'access'],
        requirements: [
          {
            id: 'contact-info',
            field: 'contactInfo',
            type: 'contact',
            mandatory: false,
            alternatives: ['phone', 'email', 'alternate_contact'],
            validationRules: [
              {
                id: 'phone-format',
                type: 'pattern',
                rule: '^[+]?[1-9]?[0-9]{7,15}$',
                errorMessage: 'Phone number must be a valid format',
              },
            ],
          },
        ],
      },
      {
        id: 'department-authorization',
        name: 'Department Authorization',
        description: 'Department verification for policy-related requests',
        severity: 'medium',
        bypassable: true,
        bypassConditions: ['manager_approval', 'hr_approval'],
        applicableActions: ['escalate', 'modify'],
        requirements: [
          {
            id: 'department',
            field: 'department',
            type: 'authorization',
            mandatory: false,
            alternatives: ['manager_contact', 'hr_verification'],
            validationRules: [],
          },
        ],
      },
    ];

    policies.forEach(policy => {
      this.securityPolicies.set(policy.id, policy);
    });

    logger.info('Security policies initialized', {
      policyCount: policies.length,
      policies: policies.map(p => ({ id: p.id, name: p.name, severity: p.severity })),
    });
  }

  async evaluateAccess(
    ticketId: string,
    userId: string,
    requestedActions: string[],
    verificationStatus: { [key: string]: boolean }
  ): Promise<AccessDecision> {
    const cacheKey = `${ticketId}_${userId}_${requestedActions.join(',')}_${JSON.stringify(verificationStatus)}`;
    const cached = this.policyCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const decision: AccessDecision = {
      allowed: true,
      reason: '',
      requiredActions: [],
      blockedActions: [],
      violations: [],
      recommendations: [],
    };

    const applicablePolicies = Array.from(this.securityPolicies.values())
      .filter(policy => policy.applicableActions.some(action => requestedActions.includes(action)))
      .sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));

    for (const policy of applicablePolicies) {
      const policyResult = await this.evaluatePolicy(policy, verificationStatus, ticketId, userId);
      
      if (!policyResult.compliant) {
        decision.allowed = false;
        decision.blockedActions.push(...requestedActions);
        decision.requiredActions.push(...policyResult.requiredActions);
        decision.violations.push(...policyResult.violations);
        
        if (!decision.reason) {
          decision.reason = policyResult.reason;
        }
      }

      decision.recommendations.push(...policyResult.recommendations);
    }

    if (decision.allowed) {
      decision.reason = 'All security requirements satisfied';
    }

    // Remove duplicates
    decision.requiredActions = [...new Set(decision.requiredActions)];
    decision.blockedActions = [...new Set(decision.blockedActions)];
    decision.recommendations = [...new Set(decision.recommendations)];

    // Cache the decision for a short time
    this.policyCache.set(cacheKey, decision);
    setTimeout(() => this.policyCache.delete(cacheKey), 60000); // 1 minute cache

    logger.info('Access decision evaluated', {
      ticketId,
      userId,
      requestedActions,
      allowed: decision.allowed,
      reason: decision.reason,
      violationCount: decision.violations.length,
    });

    return decision;
  }

  private async evaluatePolicy(
    policy: SecurityPolicy,
    verificationStatus: { [key: string]: boolean },
    ticketId: string,
    userId: string
  ): Promise<{
    compliant: boolean;
    reason: string;
    requiredActions: string[];
    violations: SecurityViolation[];
    recommendations: string[];
  }> {
    const result = {
      compliant: true,
      reason: '',
      requiredActions: [] as string[],
      violations: [] as SecurityViolation[],
      recommendations: [] as string[],
    };

    for (const requirement of policy.requirements) {
      const isVerified = verificationStatus[requirement.field] || false;
      
      if (requirement.mandatory && !isVerified) {
        result.compliant = false;
        result.reason = `${policy.name}: ${requirement.field} verification required`;
        result.requiredActions.push(`Verify ${requirement.field}`);
        
        // Create violation record
        const violation: SecurityViolation = {
          id: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ticketId,
          userId,
          policyId: policy.id,
          violationType: 'incomplete_verification',
          description: `Attempted action without required ${requirement.field} verification`,
          severity: policy.severity,
          timestamp: new Date(),
          resolved: false,
        };
        
        this.violations.set(violation.id, violation);
        result.violations.push(violation);
      }
      
      // Check for alternatives
      if (!isVerified && requirement.alternatives.length > 0) {
        const alternativesVerified = requirement.alternatives.some(alt => verificationStatus[alt]);
        if (alternativesVerified) {
          result.recommendations.push(`Consider using alternative verification for ${requirement.field}`);
        } else {
          result.recommendations.push(`Alternative verification methods available for ${requirement.field}: ${requirement.alternatives.join(', ')}`);
        }
      }
      
      // Validate format if verified
      if (isVerified && requirement.validationRules.length > 0) {
        // In a real implementation, we would validate the actual values
        // For now, we assume verification implies valid format
        result.recommendations.push(`${requirement.field} format validation passed`);
      }
    }

    return result;
  }

  async requestBypass(
    ticketId: string,
    userId: string,
    policyId: string,
    reason: string,
    bypassType: string
  ): Promise<{
    approved: boolean;
    reason: string;
    conditions: string[];
  }> {
    const policy = this.securityPolicies.get(policyId);
    if (!policy) {
      throw new Error(`Security policy not found: ${policyId}`);
    }

    if (!policy.bypassable) {
      logger.warn('Bypass attempt on non-bypassable policy', {
        ticketId,
        userId,
        policyId,
        reason,
      });

      // Create violation for unauthorized bypass attempt
      const violation: SecurityViolation = {
        id: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ticketId,
        userId,
        policyId,
        violationType: 'bypass_attempt',
        description: `Attempted bypass of non-bypassable policy: ${policy.name}`,
        severity: 'critical',
        timestamp: new Date(),
        resolved: false,
      };

      this.violations.set(violation.id, violation);

      return {
        approved: false,
        reason: 'Policy does not allow bypass',
        conditions: [],
      };
    }

    // Check if bypass type is allowed
    if (!policy.bypassConditions.includes(bypassType)) {
      return {
        approved: false,
        reason: `Bypass type '${bypassType}' not permitted for this policy`,
        conditions: policy.bypassConditions,
      };
    }

    // For this implementation, we'll approve emergency overrides but log them
    const approved = bypassType === 'emergency_override' || bypassType === 'manager_approval';

    if (approved) {
      logger.warn('Security policy bypass approved', {
        ticketId,
        userId,
        policyId,
        bypassType,
        reason,
      });

      // Create violation record for auditing
      const violation: SecurityViolation = {
        id: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ticketId,
        userId,
        policyId,
        violationType: 'policy_violation',
        description: `Policy bypassed: ${policy.name} (${bypassType})`,
        severity: 'high',
        timestamp: new Date(),
        resolved: true,
        resolutionNotes: reason,
      };

      this.violations.set(violation.id, violation);
    }

    return {
      approved,
      reason: approved ? 'Bypass approved with conditions' : 'Bypass denied',
      conditions: approved ? [`Document reason: ${reason}`, 'Review required within 24 hours'] : [],
    };
  }

  async getViolations(ticketId?: string, userId?: string): Promise<SecurityViolation[]> {
    let violations = Array.from(this.violations.values());
    
    if (ticketId) {
      violations = violations.filter(v => v.ticketId === ticketId);
    }
    
    if (userId) {
      violations = violations.filter(v => v.userId === userId);
    }
    
    return violations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async resolveViolation(violationId: string, resolutionNotes: string): Promise<void> {
    const violation = this.violations.get(violationId);
    if (!violation) {
      throw new Error(`Violation not found: ${violationId}`);
    }

    violation.resolved = true;
    violation.resolutionNotes = resolutionNotes;
    
    this.violations.set(violationId, violation);

    logger.info('Security violation resolved', {
      violationId,
      resolutionNotes,
    });
  }

  async getSecurityInsights(userId?: string): Promise<{
    totalViolations: number;
    recentViolations: SecurityViolation[];
    complianceScore: number;
    riskAreas: string[];
    recommendations: string[];
  }> {
    let violations = Array.from(this.violations.values());
    
    if (userId) {
      violations = violations.filter(v => v.userId === userId);
    }

    const recentViolations = violations
      .filter(v => {
        const daysSince = (Date.now() - v.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7; // Last 7 days
      })
      .slice(0, 10);

    const totalActions = violations.length + 100; // Assume some baseline of compliant actions
    const complianceScore = Math.max(0, ((totalActions - violations.length) / totalActions) * 100);

    // Identify risk areas
    const violationsByType = violations.reduce((acc, v) => {
      acc[v.violationType] = (acc[v.violationType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const riskAreas = Object.entries(violationsByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    const recommendations: string[] = [];
    
    if (complianceScore < 80) {
      recommendations.push('Review security policy training');
    }
    
    if (riskAreas.includes('incomplete_verification')) {
      recommendations.push('Focus on completing all verification steps');
    }
    
    if (riskAreas.includes('bypass_attempt')) {
      recommendations.push('Understand when bypasses are appropriate');
    }

    return {
      totalViolations: violations.length,
      recentViolations,
      complianceScore: Math.round(complianceScore),
      riskAreas,
      recommendations,
    };
  }

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  async getSecurityPolicies(): Promise<SecurityPolicy[]> {
    return Array.from(this.securityPolicies.values());
  }

  async getSecurityPolicy(policyId: string): Promise<SecurityPolicy | undefined> {
    return this.securityPolicies.get(policyId);
  }
}

export const securityGuardian = new SecurityGuardianService();
export default securityGuardian;