import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { securityGuardian } from '../../services/securityGuardian';

describe('SecurityGuardian', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateAccess', () => {
    it('should allow access when all critical requirements are met', async () => {
      const verificationStatus = {
        customerName: true,
        username: true,
        assetTag: false,
        department: false,
        contactInfo: false,
      };

      const decision = await securityGuardian.evaluateAccess(
        'test-ticket-1',
        'test-user-1',
        ['resolve'],
        verificationStatus
      );

      expect(decision.allowed).toBe(true);
      expect(decision.reason).toBe('All security requirements satisfied');
      expect(decision.blockedActions).toHaveLength(0);
      expect(decision.violations).toHaveLength(0);
    });

    it('should block access when critical requirements are not met', async () => {
      const verificationStatus = {
        customerName: false,
        username: false,
        assetTag: false,
        department: false,
        contactInfo: false,
      };

      const decision = await securityGuardian.evaluateAccess(
        'test-ticket-2',
        'test-user-1',
        ['resolve', 'escalate'],
        verificationStatus
      );

      expect(decision.allowed).toBe(false);
      expect(decision.blockedActions).toContain('resolve');
      expect(decision.blockedActions).toContain('escalate');
      expect(decision.requiredActions).toContain('Verify customerName');
      expect(decision.requiredActions).toContain('Verify username');
      expect(decision.violations).toHaveLength(1);
      expect(decision.violations[0].violationType).toBe('incomplete_verification');
    });

    it('should allow partial access when some requirements are met', async () => {
      const verificationStatus = {
        customerName: true,
        username: false,
        assetTag: false,
        department: false,
        contactInfo: false,
      };

      const decision = await securityGuardian.evaluateAccess(
        'test-ticket-3',
        'test-user-1',
        ['resolve'],
        verificationStatus
      );

      expect(decision.allowed).toBe(false);
      expect(decision.requiredActions).toContain('Verify username');
      expect(decision.violations[0].description).toContain('username verification');
    });

    it('should provide recommendations for alternative verification', async () => {
      const verificationStatus = {
        customerName: true,
        username: true,
        assetTag: false,
        department: false,
        contactInfo: false,
      };

      const decision = await securityGuardian.evaluateAccess(
        'test-ticket-4',
        'test-user-1',
        ['modify'],
        verificationStatus
      );

      expect(decision.recommendations).toContain(
        'Alternative verification methods available for assetTag: serial_number, device_id'
      );
    });

    it('should cache access decisions for performance', async () => {
      const verificationStatus = {
        customerName: true,
        username: true,
        assetTag: false,
        department: false,
        contactInfo: false,
      };

      // First call
      const decision1 = await securityGuardian.evaluateAccess(
        'test-ticket-5',
        'test-user-1',
        ['resolve'],
        verificationStatus
      );

      // Second call with same parameters should be cached
      const decision2 = await securityGuardian.evaluateAccess(
        'test-ticket-5',
        'test-user-1',
        ['resolve'],
        verificationStatus
      );

      expect(decision1).toEqual(decision2);
    });
  });

  describe('requestBypass', () => {
    it('should deny bypass for non-bypassable policy', async () => {
      const result = await securityGuardian.requestBypass(
        'test-ticket-6',
        'test-user-1',
        'customer-identity-verification',
        'Emergency situation',
        'unauthorized_bypass'
      );

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('Policy does not allow bypass');
      expect(result.conditions).toHaveLength(0);

      // Should create a violation record
      const violations = await securityGuardian.getViolations('test-ticket-6');
      expect(violations).toHaveLength(1);
      expect(violations[0].violationType).toBe('bypass_attempt');
    });

    it('should approve emergency override with proper documentation', async () => {
      const result = await securityGuardian.requestBypass(
        'test-ticket-7',
        'test-user-1',
        'asset-verification',
        'System outage preventing normal verification',
        'emergency_override'
      );

      expect(result.approved).toBe(true);
      expect(result.reason).toBe('Bypass approved with conditions');
      expect(result.conditions).toContain('Document reason: System outage preventing normal verification');
      expect(result.conditions).toContain('Review required within 24 hours');

      // Should create an audit violation record
      const violations = await securityGuardian.getViolations('test-ticket-7');
      expect(violations).toHaveLength(1);
      expect(violations[0].violationType).toBe('policy_violation');
      expect(violations[0].resolved).toBe(true);
    });

    it('should deny bypass for invalid bypass type', async () => {
      const result = await securityGuardian.requestBypass(
        'test-ticket-8',
        'test-user-1',
        'contact-verification',
        'Just because',
        'invalid_bypass_type'
      );

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('Bypass type \'invalid_bypass_type\' not permitted for this policy');
      expect(result.conditions.length).toBeGreaterThan(0);
    });

    it('should approve manager approval bypass', async () => {
      const result = await securityGuardian.requestBypass(
        'test-ticket-9',
        'test-user-1',
        'department-authorization',
        'Manager confirmed customer identity',
        'manager_approval'
      );

      expect(result.approved).toBe(true);
      expect(result.conditions).toContain('Document reason: Manager confirmed customer identity');
    });
  });

  describe('getViolations', () => {
    beforeEach(async () => {
      // Create some test violations
      await securityGuardian.evaluateAccess(
        'violation-ticket-1',
        'violation-user-1',
        ['resolve'],
        { customerName: false, username: false, assetTag: false, department: false, contactInfo: false }
      );
      
      await securityGuardian.requestBypass(
        'violation-ticket-2',
        'violation-user-2',
        'customer-identity-verification',
        'Invalid bypass attempt',
        'unauthorized'
      );
    });

    it('should return all violations when no filters applied', async () => {
      const violations = await securityGuardian.getViolations();
      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations[0].timestamp).toBeDefined();
    });

    it('should filter violations by ticket ID', async () => {
      const violations = await securityGuardian.getViolations('violation-ticket-1');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.every(v => v.ticketId === 'violation-ticket-1')).toBe(true);
    });

    it('should filter violations by user ID', async () => {
      const violations = await securityGuardian.getViolations(undefined, 'violation-user-1');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.every(v => v.userId === 'violation-user-1')).toBe(true);
    });

    it('should filter violations by both ticket and user ID', async () => {
      const violations = await securityGuardian.getViolations('violation-ticket-1', 'violation-user-1');
      expect(violations.every(v => v.ticketId === 'violation-ticket-1' && v.userId === 'violation-user-1')).toBe(true);
    });
  });

  describe('resolveViolation', () => {
    it('should resolve an existing violation', async () => {
      // Create a violation first
      await securityGuardian.evaluateAccess(
        'resolve-ticket-1',
        'resolve-user-1',
        ['resolve'],
        { customerName: false, username: false, assetTag: false, department: false, contactInfo: false }
      );

      const violations = await securityGuardian.getViolations('resolve-ticket-1');
      expect(violations.length).toBeGreaterThan(0);
      
      const violationId = violations[0].id;
      await securityGuardian.resolveViolation(violationId, 'Customer verification completed after training');

      const resolvedViolations = await securityGuardian.getViolations('resolve-ticket-1');
      const resolvedViolation = resolvedViolations.find(v => v.id === violationId);
      
      expect(resolvedViolation?.resolved).toBe(true);
      expect(resolvedViolation?.resolutionNotes).toBe('Customer verification completed after training');
    });

    it('should throw error for non-existent violation', async () => {
      await expect(
        securityGuardian.resolveViolation('non-existent-id', 'Resolution notes')
      ).rejects.toThrow('Violation not found: non-existent-id');
    });
  });

  describe('getSecurityInsights', () => {
    beforeEach(async () => {
      // Create test data for insights
      await securityGuardian.evaluateAccess(
        'insights-ticket-1',
        'insights-user-1',
        ['resolve'],
        { customerName: false, username: false, assetTag: false, department: false, contactInfo: false }
      );
      
      await securityGuardian.requestBypass(
        'insights-ticket-2',
        'insights-user-1',
        'customer-identity-verification',
        'Test bypass',
        'unauthorized'
      );
    });

    it('should provide security insights for all users', async () => {
      const insights = await securityGuardian.getSecurityInsights();

      expect(insights.totalViolations).toBeGreaterThanOrEqual(0);
      expect(insights.complianceScore).toBeGreaterThanOrEqual(0);
      expect(insights.complianceScore).toBeLessThanOrEqual(100);
      expect(insights.recentViolations).toBeDefined();
      expect(insights.riskAreas).toBeDefined();
      expect(insights.recommendations).toBeDefined();
    });

    it('should filter insights by user ID', async () => {
      const insights = await securityGuardian.getSecurityInsights('insights-user-1');
      
      expect(insights.totalViolations).toBeGreaterThanOrEqual(2);
      expect(insights.recentViolations.every(v => v.userId === 'insights-user-1')).toBe(true);
    });

    it('should provide appropriate recommendations based on violations', async () => {
      const insights = await securityGuardian.getSecurityInsights('insights-user-1');
      
      if (insights.complianceScore < 80) {
        expect(insights.recommendations).toContain('Review security policy training');
      }
      
      if (insights.riskAreas.includes('incomplete_verification')) {
        expect(insights.recommendations).toContain('Focus on completing all verification steps');
      }
    });

    it('should calculate compliance score correctly', async () => {
      const insights = await securityGuardian.getSecurityInsights('insights-user-1');
      
      // With violations created, compliance score should be less than 100
      expect(insights.complianceScore).toBeLessThan(100);
    });
  });

  describe('getSecurityPolicies', () => {
    it('should return all security policies', async () => {
      const policies = await securityGuardian.getSecurityPolicies();
      
      expect(policies.length).toBeGreaterThan(0);
      expect(policies.some(p => p.id === 'customer-identity-verification')).toBe(true);
      expect(policies.some(p => p.id === 'asset-verification')).toBe(true);
      expect(policies.some(p => p.id === 'contact-verification')).toBe(true);
      expect(policies.some(p => p.id === 'department-authorization')).toBe(true);
    });

    it('should return policies with correct structure', async () => {
      const policies = await securityGuardian.getSecurityPolicies();
      const policy = policies[0];
      
      expect(policy.id).toBeDefined();
      expect(policy.name).toBeDefined();
      expect(policy.description).toBeDefined();
      expect(policy.requirements).toBeDefined();
      expect(policy.severity).toBeDefined();
      expect(typeof policy.bypassable).toBe('boolean');
      expect(Array.isArray(policy.bypassConditions)).toBe(true);
      expect(Array.isArray(policy.applicableActions)).toBe(true);
    });
  });

  describe('getSecurityPolicy', () => {
    it('should return specific security policy', async () => {
      const policy = await securityGuardian.getSecurityPolicy('customer-identity-verification');
      
      expect(policy).toBeDefined();
      expect(policy?.id).toBe('customer-identity-verification');
      expect(policy?.name).toBe('Customer Identity Verification');
      expect(policy?.severity).toBe('critical');
      expect(policy?.bypassable).toBe(false);
    });

    it('should return undefined for non-existent policy', async () => {
      const policy = await securityGuardian.getSecurityPolicy('non-existent-policy');
      expect(policy).toBeUndefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex multi-action access evaluation', async () => {
      const verificationStatus = {
        customerName: true,
        username: false,
        assetTag: true,
        department: false,
        contactInfo: true,
      };

      const decision = await securityGuardian.evaluateAccess(
        'integration-ticket-1',
        'integration-user-1',
        ['resolve', 'escalate', 'modify', 'close'],
        verificationStatus
      );

      expect(decision.allowed).toBe(false);
      expect(decision.blockedActions.length).toBeGreaterThan(0);
      expect(decision.requiredActions).toContain('Verify username');
    });

    it('should handle progressive verification completion', async () => {
      let verificationStatus = {
        customerName: false,
        username: false,
        assetTag: false,
        department: false,
        contactInfo: false,
      };

      // Initially blocked
      let decision = await securityGuardian.evaluateAccess(
        'progressive-ticket-1',
        'progressive-user-1',
        ['resolve'],
        verificationStatus
      );
      expect(decision.allowed).toBe(false);

      // After partial verification
      verificationStatus.customerName = true;
      decision = await securityGuardian.evaluateAccess(
        'progressive-ticket-1',
        'progressive-user-1',
        ['resolve'],
        verificationStatus
      );
      expect(decision.allowed).toBe(false);

      // After completing critical fields
      verificationStatus.username = true;
      decision = await securityGuardian.evaluateAccess(
        'progressive-ticket-1',
        'progressive-user-1',
        ['resolve'],
        verificationStatus
      );
      expect(decision.allowed).toBe(true);
    });
  });
});