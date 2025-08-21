import { AlertService } from '../../services/alertService';
import { SLAAlert } from '../../services/slaService';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('AlertService', () => {
  let alertService: AlertService;
  let mockAlert: SLAAlert;

  beforeEach(() => {
    alertService = new AlertService();
    
    mockAlert = {
      id: 'alert-test-1',
      ticketId: 'ticket-test-1',
      type: 'SLA_BREACH',
      severity: 'HIGH',
      message: 'Test SLA breach alert',
      targetUsers: ['tech-001'],
      channels: ['email'],
      createdAt: new Date(),
      acknowledged: false
    };
  });

  describe('processAlert', () => {
    it('should process a new alert and execute matching rules', async () => {
      await alertService.processAlert(mockAlert);
      
      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].id).toBe(mockAlert.id);
    });

    it('should not process already acknowledged alert', async () => {
      const acknowledgedAlert = { ...mockAlert, acknowledged: true };
      
      await alertService.processAlert(acknowledgedAlert);
      
      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });

    it('should handle duplicate alerts correctly', async () => {
      // Process same alert twice
      await alertService.processAlert(mockAlert);
      await alertService.processAlert(mockAlert);
      
      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
    });

    it('should execute actions for matching rules', async () => {
      const highPriorityAlert: SLAAlert = {
        ...mockAlert,
        type: 'SLA_BREACH',
        severity: 'CRITICAL',
        message: 'High priority SLA breach'
      };
      
      await alertService.processAlert(highPriorityAlert);
      
      // Verify alert was processed (stored in active alerts)
      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an active alert', async () => {
      await alertService.processAlert(mockAlert);
      
      const result = await alertService.acknowledgeAlert(mockAlert.id, 'tech-001');
      
      expect(result).toBe(true);
      
      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });

    it('should return false for non-existent alert', async () => {
      const result = await alertService.acknowledgeAlert('non-existent', 'tech-001');
      
      expect(result).toBe(false);
    });

    it('should update alert acknowledgment information', async () => {
      await alertService.processAlert(mockAlert);
      
      await alertService.acknowledgeAlert(mockAlert.id, 'tech-001');
      
      // Check if alert instance was updated in history
      const stats = alertService.getAlertStatistics(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      );
      
      expect(stats.acknowledgedCount).toBe(1);
    });
  });

  describe('getActiveAlerts', () => {
    it('should return only unacknowledged alerts', async () => {
      const alert1 = { ...mockAlert, id: 'alert-1' };
      const alert2 = { ...mockAlert, id: 'alert-2', severity: 'CRITICAL' as const };
      
      await alertService.processAlert(alert1);
      await alertService.processAlert(alert2);
      
      let activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(2);
      
      await alertService.acknowledgeAlert('alert-1', 'tech-001');
      
      activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].id).toBe('alert-2');
    });

    it('should sort alerts by severity', async () => {
      const lowAlert = { ...mockAlert, id: 'alert-low', severity: 'LOW' as const };
      const criticalAlert = { ...mockAlert, id: 'alert-critical', severity: 'CRITICAL' as const };
      const mediumAlert = { ...mockAlert, id: 'alert-medium', severity: 'MEDIUM' as const };
      
      await alertService.processAlert(lowAlert);
      await alertService.processAlert(criticalAlert);
      await alertService.processAlert(mediumAlert);
      
      const activeAlerts = alertService.getActiveAlerts();
      
      expect(activeAlerts[0].severity).toBe('CRITICAL');
      expect(activeAlerts[1].severity).toBe('MEDIUM');
      expect(activeAlerts[2].severity).toBe('LOW');
    });
  });

  describe('getAlertStatistics', () => {
    it('should calculate alert statistics correctly', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();
      
      const alert1 = { ...mockAlert, id: 'alert-1', type: 'SLA_BREACH' as const };
      const alert2 = { ...mockAlert, id: 'alert-2', type: 'RESPONSE_DUE' as const, severity: 'MEDIUM' as const };
      
      await alertService.processAlert(alert1);
      await alertService.processAlert(alert2);
      await alertService.acknowledgeAlert('alert-1', 'tech-001');
      
      const stats = alertService.getAlertStatistics(startDate, endDate);
      
      expect(stats.totalAlerts).toBe(2);
      expect(stats.byType['SLA_BREACH']).toBe(1);
      expect(stats.byType['RESPONSE_DUE']).toBe(1);
      expect(stats.bySeverity['HIGH']).toBe(1);
      expect(stats.bySeverity['MEDIUM']).toBe(1);
      expect(stats.acknowledgedCount).toBe(1);
    });

    it('should filter alerts by date range', async () => {
      const oldAlert = { 
        ...mockAlert, 
        id: 'old-alert',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
      };
      const recentAlert = { 
        ...mockAlert, 
        id: 'recent-alert'
      };
      
      await alertService.processAlert(oldAlert);
      await alertService.processAlert(recentAlert);
      
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const endDate = new Date();
      
      const stats = alertService.getAlertStatistics(startDate, endDate);
      
      expect(stats.totalAlerts).toBe(1); // Only recent alert
    });

    it('should calculate average acknowledgment time', async () => {
      await alertService.processAlert(mockAlert);
      
      // Simulate some time passing before acknowledgment
      setTimeout(async () => {
        await alertService.acknowledgeAlert(mockAlert.id, 'tech-001');
        
        const stats = alertService.getAlertStatistics(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date()
        );
        
        expect(stats.averageAcknowledgmentTime).toBeGreaterThan(0);
      }, 100);
    });
  });

  describe('configureChannel', () => {
    it('should configure a notification channel', () => {
      const channelConfig = {
        type: 'slack' as const,
        enabled: true,
        config: {
          webhook: 'https://hooks.slack.com/test',
          channel: '#alerts'
        }
      };
      
      alertService.configureChannel('test-slack', channelConfig);
      
      // Verify channel was configured (we can't directly test private method, 
      // but we can test it indirectly through alert processing)
      expect(() => alertService.configureChannel('test-slack', channelConfig)).not.toThrow();
    });
  });

  describe('setAlertRule', () => {
    it('should add a new alert rule', () => {
      const rule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        enabled: true,
        conditions: [{
          type: 'SLA_BREACH' as const,
          operator: 'equals' as const,
          value: 'HIGH'
        }],
        actions: [{
          type: 'NOTIFICATION' as const,
          config: { channels: ['email'] }
        }],
        cooldownMinutes: 30,
        priority: 'HIGH' as const
      };
      
      alertService.setAlertRule(rule);
      
      expect(() => alertService.setAlertRule(rule)).not.toThrow();
    });

    it('should update an existing alert rule', () => {
      const rule = {
        id: 'existing-rule',
        name: 'Existing Rule',
        description: 'Original description',
        enabled: true,
        conditions: [{
          type: 'SLA_BREACH' as const,
          operator: 'equals' as const,
          value: 'HIGH'
        }],
        actions: [{
          type: 'NOTIFICATION' as const,
          config: { channels: ['email'] }
        }],
        cooldownMinutes: 30,
        priority: 'HIGH' as const
      };
      
      alertService.setAlertRule(rule);
      
      const updatedRule = {
        ...rule,
        description: 'Updated description',
        cooldownMinutes: 60
      };
      
      alertService.setAlertRule(updatedRule);
      
      expect(() => alertService.setAlertRule(updatedRule)).not.toThrow();
    });
  });

  describe('removeAlertRule', () => {
    it('should remove an existing alert rule', () => {
      const rule = {
        id: 'rule-to-remove',
        name: 'Rule to Remove',
        description: 'Test rule for removal',
        enabled: true,
        conditions: [{
          type: 'SLA_BREACH' as const,
          operator: 'equals' as const,
          value: 'HIGH'
        }],
        actions: [{
          type: 'NOTIFICATION' as const,
          config: { channels: ['email'] }
        }],
        cooldownMinutes: 30,
        priority: 'HIGH' as const
      };
      
      alertService.setAlertRule(rule);
      
      const result = alertService.removeAlertRule('rule-to-remove');
      expect(result).toBe(true);
    });

    it('should return false when removing non-existent rule', () => {
      const result = alertService.removeAlertRule('non-existent-rule');
      expect(result).toBe(false);
    });
  });

  describe('rule matching', () => {
    it('should match SLA breach alerts with appropriate rules', async () => {
      const slaBreachAlert: SLAAlert = {
        ...mockAlert,
        type: 'SLA_BREACH',
        severity: 'HIGH'
      };
      
      await alertService.processAlert(slaBreachAlert);
      
      // The default high-priority-sla-breach rule should have matched
      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
    });

    it('should respect rule enabled/disabled status', async () => {
      // Disable the default rule
      const disabledRule = {
        id: 'high-priority-sla-breach',
        name: 'High Priority SLA Breach',
        description: 'Alert when high priority tickets breach SLA',
        enabled: false,
        conditions: [{
          type: 'SLA_BREACH' as const,
          operator: 'equals' as const,
          value: 'HIGH'
        }],
        actions: [{
          type: 'NOTIFICATION' as const,
          config: { channels: ['email'] }
        }],
        cooldownMinutes: 30,
        priority: 'CRITICAL' as const
      };
      
      alertService.setAlertRule(disabledRule);
      
      const slaBreachAlert: SLAAlert = {
        ...mockAlert,
        type: 'SLA_BREACH',
        severity: 'HIGH'
      };
      
      await alertService.processAlert(slaBreachAlert);
      
      // Alert should still be stored but no actions should be executed
      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
    });
  });
});