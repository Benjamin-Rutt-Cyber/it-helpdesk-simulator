import { SLAAlert } from './slaService';
import { logger } from '../utils/logger';

export interface NotificationChannel {
  type: 'email' | 'sms' | 'slack' | 'teams' | 'webhook';
  enabled: boolean;
  config: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldownMinutes: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AlertCondition {
  type: 'SLA_BREACH' | 'RESPONSE_OVERDUE' | 'RESOLUTION_OVERDUE' | 'ESCALATION_REQUIRED' | 'VOLUME_SPIKE';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number;
  field?: string;
}

export interface AlertAction {
  type: 'NOTIFICATION' | 'AUTO_ASSIGN' | 'AUTO_ESCALATE' | 'CREATE_TICKET';
  config: Record<string, any>;
  delay?: number; // seconds
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  alertId: string;
  ticketId?: string;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export class AlertService {
  private activeAlerts: Map<string, SLAAlert> = new Map();
  private alertHistory: AlertInstance[] = [];
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();

  constructor() {
    this.initializeDefaultChannels();
    this.initializeDefaultRules();
  }

  private initializeDefaultChannels() {
    // Email notification channel
    this.notificationChannels.set('email', {
      type: 'email',
      enabled: true,
      config: {
        smtpHost: process.env.SMTP_HOST || 'localhost',
        smtpPort: process.env.SMTP_PORT || 587,
        from: process.env.ALERT_EMAIL_FROM || 'alerts@company.com',
        templates: {
          sla_breach: 'SLA Breach Alert',
          response_due: 'Response Time Alert',
          resolution_due: 'Resolution Time Alert'
        }
      }
    });

    // Slack notification channel
    this.notificationChannels.set('slack', {
      type: 'slack',
      enabled: false,
      config: {
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#it-alerts',
        username: 'IT Support Bot'
      }
    });

    // SMS notification channel
    this.notificationChannels.set('sms', {
      type: 'sms',
      enabled: false,
      config: {
        provider: 'twilio',
        apiKey: process.env.SMS_API_KEY,
        from: process.env.SMS_FROM_NUMBER
      }
    });
  }

  private initializeDefaultRules() {
    // High priority SLA breach rule
    this.alertRules.set('high-priority-sla-breach', {
      id: 'high-priority-sla-breach',
      name: 'High Priority SLA Breach',
      description: 'Alert when high priority tickets breach SLA',
      enabled: true,
      conditions: [
        {
          type: 'SLA_BREACH',
          operator: 'equals',
          value: 'HIGH',
          field: 'priority'
        }
      ],
      actions: [
        {
          type: 'NOTIFICATION',
          config: {
            channels: ['email', 'sms'],
            recipients: ['team-lead', 'manager'],
            template: 'sla_breach_critical'
          }
        },
        {
          type: 'AUTO_ESCALATE',
          config: {
            escalateTo: 'senior-tech',
            reason: 'High priority SLA breach - auto-escalating'
          },
          delay: 300 // 5 minutes
        }
      ],
      cooldownMinutes: 30,
      priority: 'CRITICAL'
    });

    // Response time warning rule
    this.alertRules.set('response-time-warning', {
      id: 'response-time-warning',
      name: 'Response Time Warning',
      description: 'Warning when response time is approaching SLA',
      enabled: true,
      conditions: [
        {
          type: 'RESPONSE_OVERDUE',
          operator: 'greater_than',
          value: 0.75 // 75% of SLA time
        }
      ],
      actions: [
        {
          type: 'NOTIFICATION',
          config: {
            channels: ['email'],
            recipients: ['assigned-tech'],
            template: 'response_warning'
          }
        }
      ],
      cooldownMinutes: 15,
      priority: 'MEDIUM'
    });

    // Volume spike detection
    this.alertRules.set('volume-spike', {
      id: 'volume-spike',
      name: 'Ticket Volume Spike',
      description: 'Alert when ticket volume exceeds normal levels',
      enabled: true,
      conditions: [
        {
          type: 'VOLUME_SPIKE',
          operator: 'greater_than',
          value: 150 // 150% of normal volume
        }
      ],
      actions: [
        {
          type: 'NOTIFICATION',
          config: {
            channels: ['email', 'slack'],
            recipients: ['team-lead', 'manager'],
            template: 'volume_spike'
          }
        }
      ],
      cooldownMinutes: 60,
      priority: 'HIGH'
    });
  }

  /**
   * Process an SLA alert and trigger appropriate actions
   */
  async processAlert(alert: SLAAlert): Promise<void> {
    try {
      // Check if alert already exists and is not acknowledged
      const existingAlert = this.activeAlerts.get(alert.id);
      if (existingAlert && !existingAlert.acknowledged) {
        logger.debug(`Alert ${alert.id} already active and unacknowledged`);
        return;
      }

      // Store the alert
      this.activeAlerts.set(alert.id, alert);

      // Find matching rules
      const matchingRules = this.findMatchingRules(alert);

      // Execute actions for each matching rule
      for (const rule of matchingRules) {
        if (!rule.enabled) continue;

        // Check cooldown
        if (this.isInCooldown(rule.id, alert.ticketId)) {
          logger.debug(`Rule ${rule.id} is in cooldown for ticket ${alert.ticketId}`);
          continue;
        }

        // Execute rule actions
        await this.executeRuleActions(rule, alert);

        // Record alert instance
        this.recordAlertInstance(rule.id, alert);
      }

      logger.info(`Processed alert ${alert.id} for ticket ${alert.ticketId}`);
    } catch (error) {
      logger.error(`Error processing alert ${alert.id}:`, error);
    }
  }

  /**
   * Find alert rules that match the given alert
   */
  private findMatchingRules(alert: SLAAlert): AlertRule[] {
    const matchingRules: AlertRule[] = [];

    for (const rule of this.alertRules.values()) {
      if (this.ruleMatches(rule, alert)) {
        matchingRules.push(rule);
      }
    }

    return matchingRules;
  }

  /**
   * Check if an alert matches a rule's conditions
   */
  private ruleMatches(rule: AlertRule, alert: SLAAlert): boolean {
    return rule.conditions.every(condition => {
      switch (condition.type) {
        case 'SLA_BREACH':
          return alert.type === 'SLA_BREACH' && this.evaluateCondition(condition, alert.severity);
        case 'RESPONSE_OVERDUE':
          return alert.type === 'RESPONSE_DUE' || alert.type === 'SLA_BREACH';
        case 'RESOLUTION_OVERDUE':
          return alert.type === 'RESOLUTION_DUE' || alert.type === 'SLA_BREACH';
        case 'ESCALATION_REQUIRED':
          return alert.type === 'ESCALATION_REQUIRED';
        default:
          return false;
      }
    });
  }

  /**
   * Evaluate a condition against a value
   */
  private evaluateCondition(condition: AlertCondition, value: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      default:
        return false;
    }
  }

  /**
   * Check if a rule is in cooldown for a specific ticket
   */
  private isInCooldown(ruleId: string, ticketId: string): boolean {
    const cooldownKey = `${ruleId}-${ticketId}`;
    const lastTriggered = this.alertHistory
      .filter(instance => instance.ruleId === ruleId && instance.ticketId === ticketId)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())[0];

    if (!lastTriggered) return false;

    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - lastTriggered.triggeredAt.getTime();

    return timeSinceLastTrigger < cooldownMs;
  }

  /**
   * Execute actions for a rule
   */
  private async executeRuleActions(rule: AlertRule, alert: SLAAlert): Promise<void> {
    for (const action of rule.actions) {
      try {
        if (action.delay) {
          // Schedule action for later execution
          setTimeout(() => this.executeAction(action, alert), action.delay * 1000);
        } else {
          await this.executeAction(action, alert);
        }
      } catch (error) {
        logger.error(`Error executing action ${action.type} for rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Execute a specific action
   */
  private async executeAction(action: AlertAction, alert: SLAAlert): Promise<void> {
    switch (action.type) {
      case 'NOTIFICATION':
        await this.sendNotification(action.config, alert);
        break;
      case 'AUTO_ASSIGN':
        await this.autoAssignTicket(action.config, alert);
        break;
      case 'AUTO_ESCALATE':
        await this.autoEscalateTicket(action.config, alert);
        break;
      case 'CREATE_TICKET':
        await this.createFollowUpTicket(action.config, alert);
        break;
      default:
        logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send notification through configured channels
   */
  private async sendNotification(config: any, alert: SLAAlert): Promise<void> {
    const { channels, recipients, template } = config;

    for (const channelName of channels) {
      const channel = this.notificationChannels.get(channelName);
      if (!channel || !channel.enabled) {
        continue;
      }

      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmail(channel, alert, recipients, template);
            break;
          case 'slack':
            await this.sendSlack(channel, alert, template);
            break;
          case 'sms':
            await this.sendSMS(channel, alert, recipients);
            break;
          default:
            logger.warn(`Unsupported notification channel: ${channel.type}`);
        }
      } catch (error) {
        logger.error(`Error sending ${channel.type} notification:`, error);
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(channel: NotificationChannel, alert: SLAAlert, recipients: string[], template?: string): Promise<void> {
    logger.info(`Sending email notification for alert ${alert.id} to ${recipients.join(', ')}`);
    // In a real implementation, this would integrate with an email service
    // For now, we'll just log the notification
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(channel: NotificationChannel, alert: SLAAlert, template?: string): Promise<void> {
    logger.info(`Sending Slack notification for alert ${alert.id}`);
    // In a real implementation, this would post to Slack webhook
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(channel: NotificationChannel, alert: SLAAlert, recipients: string[]): Promise<void> {
    logger.info(`Sending SMS notification for alert ${alert.id} to ${recipients.join(', ')}`);
    // In a real implementation, this would integrate with SMS service like Twilio
  }

  /**
   * Auto-assign ticket to available technician
   */
  private async autoAssignTicket(config: any, alert: SLAAlert): Promise<void> {
    logger.info(`Auto-assigning ticket ${alert.ticketId} based on alert ${alert.id}`);
    // Implementation would integrate with ticket assignment logic
  }

  /**
   * Auto-escalate ticket
   */
  private async autoEscalateTicket(config: any, alert: SLAAlert): Promise<void> {
    logger.info(`Auto-escalating ticket ${alert.ticketId} based on alert ${alert.id}`);
    // Implementation would integrate with escalation logic
  }

  /**
   * Create follow-up ticket
   */
  private async createFollowUpTicket(config: any, alert: SLAAlert): Promise<void> {
    logger.info(`Creating follow-up ticket for alert ${alert.id}`);
    // Implementation would create a new ticket
  }

  /**
   * Record an alert instance
   */
  private recordAlertInstance(ruleId: string, alert: SLAAlert): void {
    const instance: AlertInstance = {
      id: `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId,
      alertId: alert.id,
      ticketId: alert.ticketId,
      triggeredAt: new Date(),
      acknowledged: false,
      resolved: false,
      metadata: {
        alertType: alert.type,
        severity: alert.severity,
        message: alert.message
      }
    };

    this.alertHistory.push(instance);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    // Update corresponding alert instances
    this.alertHistory
      .filter(instance => instance.alertId === alertId)
      .forEach(instance => {
        instance.acknowledged = true;
        instance.acknowledgedBy = userId;
        instance.acknowledgedAt = new Date();
      });

    logger.info(`Alert ${alertId} acknowledged by ${userId}`);
    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SLAAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(startDate: Date, endDate: Date): {
    totalAlerts: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    acknowledgedCount: number;
    averageAcknowledgmentTime: number;
  } {
    const filteredInstances = this.alertHistory.filter(
      instance => instance.triggeredAt >= startDate && instance.triggeredAt <= endDate
    );

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let acknowledgedCount = 0;
    let totalAcknowledgmentTime = 0;

    filteredInstances.forEach(instance => {
      const alertType = instance.metadata.alertType;
      const severity = instance.metadata.severity;

      byType[alertType] = (byType[alertType] || 0) + 1;
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;

      if (instance.acknowledged && instance.acknowledgedAt) {
        acknowledgedCount++;
        const ackTime = instance.acknowledgedAt.getTime() - instance.triggeredAt.getTime();
        totalAcknowledgmentTime += ackTime;
      }
    });

    return {
      totalAlerts: filteredInstances.length,
      byType,
      bySeverity,
      acknowledgedCount,
      averageAcknowledgmentTime: acknowledgedCount > 0 ? totalAcknowledgmentTime / acknowledgedCount / 1000 / 60 : 0 // minutes
    };
  }

  /**
   * Configure notification channel
   */
  configureChannel(name: string, config: NotificationChannel): void {
    this.notificationChannels.set(name, config);
    logger.info(`Configured notification channel: ${name}`);
  }

  /**
   * Add or update alert rule
   */
  setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info(`Set alert rule: ${rule.id}`);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      logger.info(`Removed alert rule: ${ruleId}`);
    }
    return removed;
  }
}

export const alertService = new AlertService();