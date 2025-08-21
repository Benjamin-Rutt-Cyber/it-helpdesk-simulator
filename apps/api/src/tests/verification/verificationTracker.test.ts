import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { verificationTracker } from '../../services/verificationTracker';

describe('VerificationTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startVerificationSession', () => {
    it('should create a new verification session', async () => {
      const ticketId = 'test-ticket-1';
      const userId = 'test-user-1';

      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      expect(sessionId).toMatch(/^ver_\d+_[a-z0-9]+$/);
      
      const session = await verificationTracker.getVerificationSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.ticketId).toBe(ticketId);
      expect(session?.userId).toBe(userId);
      expect(session?.verificationAttempts).toBe(0);
      expect(session?.completionStatus).toBe('partial');
    });
  });

  describe('recordVerificationAttempt', () => {
    it('should record successful verification attempt', async () => {
      const ticketId = 'test-ticket-2';
      const userId = 'test-user-1';
      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      await verificationTracker.recordVerificationAttempt(
        sessionId,
        'direct',
        true,
        'customerName',
        { providedValue: 'John Doe' }
      );

      const session = await verificationTracker.getVerificationSession(sessionId);
      expect(session?.verificationAttempts).toBe(1);
      expect(session?.successfulVerifications).toBe(1);
      expect(session?.failedVerifications).toBe(0);
      expect(session?.verificationMethods).toContain('direct');
      expect(session?.verificationQuality).toBe('excellent');
    });

    it('should record failed verification attempt', async () => {
      const ticketId = 'test-ticket-3';
      const userId = 'test-user-1';
      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      await verificationTracker.recordVerificationAttempt(
        sessionId,
        'direct',
        false,
        'username'
      );

      const session = await verificationTracker.getVerificationSession(sessionId);
      expect(session?.verificationAttempts).toBe(1);
      expect(session?.successfulVerifications).toBe(0);
      expect(session?.failedVerifications).toBe(1);
      expect(session?.verificationQuality).toBe('poor');
    });

    it('should update verification quality based on success rate', async () => {
      const ticketId = 'test-ticket-4';
      const userId = 'test-user-1';
      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      // Record mixed success/failure attempts
      await verificationTracker.recordVerificationAttempt(sessionId, 'direct', true, 'customerName');
      await verificationTracker.recordVerificationAttempt(sessionId, 'direct', true, 'username');
      await verificationTracker.recordVerificationAttempt(sessionId, 'direct', false, 'assetTag');

      const session = await verificationTracker.getVerificationSession(sessionId);
      expect(session?.verificationQuality).toBe('adequate'); // 2/3 = 67% success rate
    });
  });

  describe('updateCustomerCooperation', () => {
    it('should update customer cooperation level', async () => {
      const ticketId = 'test-ticket-5';
      const userId = 'test-user-1';
      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      await verificationTracker.updateCustomerCooperation(
        sessionId,
        'low',
        'Customer refused to provide information'
      );

      const session = await verificationTracker.getVerificationSession(sessionId);
      expect(session?.customerCooperationLevel).toBe('low');
      expect(session?.learningObjectivesAchieved).toContain(
        'Successfully handled uncooperative customer during verification'
      );
    });

    it('should add appropriate learning objectives for high cooperation', async () => {
      const ticketId = 'test-ticket-6';
      const userId = 'test-user-1';
      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      await verificationTracker.updateCustomerCooperation(sessionId, 'high');

      const session = await verificationTracker.getVerificationSession(sessionId);
      expect(session?.learningObjectivesAchieved).toContain(
        'Effectively leveraged cooperative customer for efficient verification'
      );
    });
  });

  describe('completeVerificationSession', () => {
    it('should complete session with success status', async () => {
      const ticketId = 'test-ticket-7';
      const userId = 'test-user-1';
      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      // Add some successful attempts
      await verificationTracker.recordVerificationAttempt(sessionId, 'direct', true, 'customerName');
      await verificationTracker.recordVerificationAttempt(sessionId, 'direct', true, 'username');

      const completedSession = await verificationTracker.completeVerificationSession(
        sessionId,
        'completed'
      );

      expect(completedSession.completionStatus).toBe('completed');
      expect(completedSession.endTime).toBeDefined();
      expect(completedSession.totalDuration).toBeGreaterThan(0);
      expect(completedSession.securityCompliance).toBe(true);
      expect(completedSession.learningObjectivesAchieved).toContain(
        'Successfully completed full customer verification process'
      );
    });

    it('should handle bypassed verification with reason', async () => {
      const ticketId = 'test-ticket-8';
      const userId = 'test-user-1';
      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      const completedSession = await verificationTracker.completeVerificationSession(
        sessionId,
        'bypassed',
        'Emergency override required'
      );

      expect(completedSession.completionStatus).toBe('bypassed');
      expect(completedSession.bypassReason).toBe('Emergency override required');
      expect(completedSession.securityCompliance).toBe(false);
    });

    it('should mark as non-compliant for failed verification', async () => {
      const ticketId = 'test-ticket-9';
      const userId = 'test-user-1';
      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      const completedSession = await verificationTracker.completeVerificationSession(
        sessionId,
        'failed'
      );

      expect(completedSession.securityCompliance).toBe(false);
    });

    it('should mark as non-compliant for partial verification with insufficient successes', async () => {
      const ticketId = 'test-ticket-10';
      const userId = 'test-user-1';
      const sessionId = await verificationTracker.startVerificationSession(ticketId, userId);

      // Only one successful verification
      await verificationTracker.recordVerificationAttempt(sessionId, 'direct', true, 'customerName');

      const completedSession = await verificationTracker.completeVerificationSession(
        sessionId,
        'partial'
      );

      expect(completedSession.securityCompliance).toBe(false);
    });
  });

  describe('getUserPerformance', () => {
    it('should calculate user performance metrics', async () => {
      const userId = 'test-user-2';
      
      // Create multiple completed sessions for the user
      const session1Id = await verificationTracker.startVerificationSession('ticket-1', userId);
      await verificationTracker.recordVerificationAttempt(session1Id, 'direct', true, 'customerName');
      await verificationTracker.recordVerificationAttempt(session1Id, 'direct', true, 'username');
      await verificationTracker.completeVerificationSession(session1Id, 'completed');

      const session2Id = await verificationTracker.startVerificationSession('ticket-2', userId);
      await verificationTracker.recordVerificationAttempt(session2Id, 'direct', true, 'customerName');
      await verificationTracker.recordVerificationAttempt(session2Id, 'direct', false, 'username');
      await verificationTracker.completeVerificationSession(session2Id, 'failed');

      // Allow some time for completion
      await new Promise(resolve => setTimeout(resolve, 10));

      const performance = await verificationTracker.getUserPerformance(userId);

      expect(performance).toBeDefined();
      expect(performance?.userId).toBe(userId);
      expect(performance?.totalVerifications).toBe(2);
      expect(performance?.successRate).toBe(0.5); // 1 completed, 1 failed
      expect(performance?.averageVerificationTime).toBeGreaterThan(0);
    });

    it('should return null for user with no sessions', async () => {
      const performance = await verificationTracker.getUserPerformance('nonexistent-user');
      expect(performance).toBeNull();
    });

    it('should provide improvement recommendations', async () => {
      const userId = 'test-user-3';
      
      // Create a session with poor performance
      const sessionId = await verificationTracker.startVerificationSession('ticket-3', userId);
      
      // Simulate slow verification (would need to mock timing in real scenario)
      await verificationTracker.recordVerificationAttempt(sessionId, 'direct', false, 'customerName');
      await verificationTracker.recordVerificationAttempt(sessionId, 'direct', false, 'username');
      
      const completedSession = await verificationTracker.completeVerificationSession(sessionId, 'failed');
      // Manually set high duration for testing
      completedSession.totalDuration = 600000; // 10 minutes

      const performance = await verificationTracker.getUserPerformance(userId);

      expect(performance?.improvementAreas).toContain('Verification success rate');
      expect(performance?.recommendedTraining).toContain('Customer communication skills');
    });
  });

  describe('getVerificationAnalytics', () => {
    it('should calculate analytics across all sessions', async () => {
      // Create multiple sessions for analytics
      const user1Session = await verificationTracker.startVerificationSession('analytics-ticket-1', 'analytics-user-1');
      await verificationTracker.recordVerificationAttempt(user1Session, 'direct', true, 'customerName');
      await verificationTracker.updateCustomerCooperation(user1Session, 'high');
      await verificationTracker.completeVerificationSession(user1Session, 'completed');

      const user2Session = await verificationTracker.startVerificationSession('analytics-ticket-2', 'analytics-user-2');
      await verificationTracker.recordVerificationAttempt(user2Session, 'callback', false, 'username');
      await verificationTracker.updateCustomerCooperation(user2Session, 'low');
      await verificationTracker.completeVerificationSession(user2Session, 'failed');

      const analytics = await verificationTracker.getVerificationAnalytics();

      expect(analytics.totalVerifications).toBeGreaterThanOrEqual(2);
      expect(analytics.successRate).toBeGreaterThanOrEqual(0);
      expect(analytics.successRate).toBeLessThanOrEqual(1);
      expect(analytics.complianceScore).toBeGreaterThanOrEqual(0);
      expect(analytics.complianceScore).toBeLessThanOrEqual(100);
      
      expect(analytics.verificationMethodEffectiveness).toBeDefined();
      expect(analytics.customerCooperationTrends).toBeDefined();
      expect(analytics.commonFailureReasons).toBeDefined();
    });

    it('should handle time range filtering', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const analytics = await verificationTracker.getVerificationAnalytics({
        start: yesterday,
        end: now
      });

      expect(analytics).toBeDefined();
      expect(typeof analytics.totalVerifications).toBe('number');
    });
  });

  describe('getVerificationInsights', () => {
    it('should provide user-specific insights', async () => {
      const userId = 'insights-user-1';
      
      const sessionId = await verificationTracker.startVerificationSession('insights-ticket-1', userId);
      await verificationTracker.recordVerificationAttempt(sessionId, 'direct', true, 'customerName');
      await verificationTracker.completeVerificationSession(sessionId, 'completed');

      const insights = await verificationTracker.getVerificationInsights(userId);

      expect(insights.recentPerformance).toBeDefined();
      expect(insights.improvementSuggestions).toBeDefined();
      expect(insights.learningProgress).toBeDefined();
      expect(Array.isArray(insights.improvementSuggestions)).toBe(true);
      expect(Array.isArray(insights.learningProgress)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid session ID', async () => {
      await expect(
        verificationTracker.recordVerificationAttempt('invalid-session-id', 'direct', true)
      ).rejects.toThrow('Verification session not found');
    });

    it('should handle completion of non-existent session', async () => {
      await expect(
        verificationTracker.completeVerificationSession('invalid-session-id', 'completed')
      ).rejects.toThrow('Verification session not found');
    });

    it('should handle cooperation update for non-existent session', async () => {
      await expect(
        verificationTracker.updateCustomerCooperation('invalid-session-id', 'high')
      ).rejects.toThrow('Verification session not found');
    });
  });
});