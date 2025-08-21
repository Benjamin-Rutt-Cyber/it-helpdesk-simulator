import { logger } from '../utils/logger';
import { verificationService, VerificationStatus } from './verificationService';
import { verificationTracker } from './verificationTracker';
import { securityGuardian } from './securityGuardian';

export interface VerificationGate {
  ticketId: string;
  userId: string;
  requiredActions: string[];
  verificationSessionId?: string;
  status: 'open' | 'blocked' | 'bypassed' | 'completed';
  blockingReasons: string[];
  bypassReason?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TicketAction {
  id: string;
  type: 'resolve' | 'escalate' | 'close' | 'modify' | 'access';
  ticketId: string;
  userId: string;
  data?: any;
  verificationRequired: boolean;
}

class VerificationIntegrationService {
  private verificationGates: Map<string, VerificationGate> = new Map();
  private pendingActions: Map<string, TicketAction> = new Map();

  async createVerificationGate(
    ticketId: string,
    userId: string,
    requestedActions: string[]
  ): Promise<VerificationGate> {
    const gateId = `gate_${ticketId}_${userId}`;
    
    // Check if gate already exists
    const existingGate = this.verificationGates.get(gateId);
    if (existingGate && existingGate.status !== 'completed') {
      // Update existing gate with new actions
      existingGate.requiredActions = [...new Set([...existingGate.requiredActions, ...requestedActions])];
      this.verificationGates.set(gateId, existingGate);
      return existingGate;
    }

    // Get current verification status
    const verificationStatus = await verificationService.getVerificationStatus(ticketId);
    
    // Evaluate access requirements
    const accessDecision = await securityGuardian.evaluateAccess(
      ticketId,
      userId,
      requestedActions,
      {
        customerName: verificationStatus.customerName.status === 'verified',
        username: verificationStatus.username.status === 'verified',
        assetTag: verificationStatus.assetTag.status === 'verified',
        department: verificationStatus.department.status === 'verified',
        contactInfo: verificationStatus.contactInfo.status === 'verified',
      }
    );

    const gate: VerificationGate = {
      ticketId,
      userId,
      requiredActions: requestedActions,
      status: accessDecision.allowed ? 'open' : 'blocked',
      blockingReasons: accessDecision.blockedActions,
      createdAt: new Date(),
    };

    // Start verification session if needed
    if (!accessDecision.allowed) {
      gate.verificationSessionId = await verificationTracker.startVerificationSession(ticketId, userId);
    }

    this.verificationGates.set(gateId, gate);

    logger.info('Verification gate created', {
      gateId,
      ticketId,
      userId,
      status: gate.status,
      requestedActions,
      blockingReasons: gate.blockingReasons,
    });

    return gate;
  }

  async executeTicketAction(action: TicketAction): Promise<{
    success: boolean;
    blocked: boolean;
    reason?: string;
    verificationGate?: VerificationGate;
  }> {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    action.id = actionId;

    logger.info('Executing ticket action', {
      actionId,
      type: action.type,
      ticketId: action.ticketId,
      userId: action.userId,
    });

    // Check if action requires verification
    const requiresVerification = await this.actionRequiresVerification(action);
    
    if (!requiresVerification) {
      // Execute action directly
      return await this.performAction(action);
    }

    // Create or get verification gate
    const gate = await this.createVerificationGate(
      action.ticketId,
      action.userId,
      [action.type]
    );

    if (gate.status === 'blocked') {
      // Store pending action
      this.pendingActions.set(actionId, action);
      
      return {
        success: false,
        blocked: true,
        reason: 'Customer verification required before this action can be completed',
        verificationGate: gate,
      };
    }

    // Verification gate is open, execute action
    return await this.performAction(action);
  }

  async updateVerificationProgress(
    ticketId: string,
    userId: string,
    verificationData: Partial<VerificationStatus>
  ): Promise<void> {
    // Update verification service
    await verificationService.updateVerificationStatus(ticketId, verificationData);
    
    // Check if any gates can be opened
    const gateId = `gate_${ticketId}_${userId}`;
    const gate = this.verificationGates.get(gateId);
    
    if (!gate || gate.status !== 'blocked') {
      return;
    }

    // Re-evaluate access
    const verificationStatus = await verificationService.getVerificationStatus(ticketId);
    const accessDecision = await securityGuardian.evaluateAccess(
      ticketId,
      userId,
      gate.requiredActions,
      {
        customerName: verificationStatus.customerName.status === 'verified',
        username: verificationStatus.username.status === 'verified',
        assetTag: verificationStatus.assetTag.status === 'verified',
        department: verificationStatus.department.status === 'verified',
        contactInfo: verificationStatus.contactInfo.status === 'verified',
      }
    );

    if (accessDecision.allowed) {
      gate.status = 'open';
      gate.completedAt = new Date();
      
      if (gate.verificationSessionId) {
        await verificationTracker.completeVerificationSession(
          gate.verificationSessionId,
          'completed'
        );
      }

      this.verificationGates.set(gateId, gate);

      // Execute any pending actions
      await this.executePendingActions(ticketId, userId);

      logger.info('Verification gate opened', {
        gateId,
        ticketId,
        userId,
        completedAt: gate.completedAt,
      });
    }
  }

  async bypassVerificationGate(
    ticketId: string,
    userId: string,
    bypassReason: string,
    bypassType: string = 'emergency_override'
  ): Promise<{
    success: boolean;
    reason: string;
    conditions: string[];
  }> {
    const gateId = `gate_${ticketId}_${userId}`;
    const gate = this.verificationGates.get(gateId);
    
    if (!gate) {
      return {
        success: false,
        reason: 'Verification gate not found',
        conditions: [],
      };
    }

    // Request bypass from security guardian
    const bypassResult = await securityGuardian.requestBypass(
      ticketId,
      userId,
      'customer-identity-verification', // Primary policy
      bypassReason,
      bypassType
    );

    if (bypassResult.approved) {
      gate.status = 'bypassed';
      gate.bypassReason = bypassReason;
      gate.completedAt = new Date();
      
      if (gate.verificationSessionId) {
        await verificationTracker.completeVerificationSession(
          gate.verificationSessionId,
          'bypassed',
          bypassReason
        );
      }

      this.verificationGates.set(gateId, gate);

      // Execute pending actions
      await this.executePendingActions(ticketId, userId);

      logger.warn('Verification gate bypassed', {
        gateId,
        ticketId,
        userId,
        bypassReason,
        bypassType,
        conditions: bypassResult.conditions,
      });
    }

    return bypassResult;
  }

  async getVerificationGateStatus(
    ticketId: string,
    userId: string
  ): Promise<{
    gate?: VerificationGate;
    verificationStatus: VerificationStatus;
    blockedActions: string[];
    pendingActions: TicketAction[];
  }> {
    const gateId = `gate_${ticketId}_${userId}`;
    const gate = this.verificationGates.get(gateId);
    const verificationStatus = await verificationService.getVerificationStatus(ticketId);
    
    // Get pending actions for this ticket/user
    const pendingActions = Array.from(this.pendingActions.values())
      .filter(action => action.ticketId === ticketId && action.userId === userId);

    let blockedActions: string[] = [];
    
    if (gate && gate.status === 'blocked') {
      blockedActions = gate.requiredActions;
    }

    return {
      gate,
      verificationStatus,
      blockedActions,
      pendingActions,
    };
  }

  private async actionRequiresVerification(action: TicketAction): Promise<boolean> {
    // Define which actions require verification
    const verificationRequiredActions = ['resolve', 'escalate', 'close', 'modify', 'access'];
    
    if (!verificationRequiredActions.includes(action.type)) {
      return false;
    }

    // Check if ticket already has completed verification
    const verificationStatus = await verificationService.getVerificationStatus(action.ticketId);
    
    // Basic verification requirements (can be customized per action type)
    const criticalFieldsVerified = 
      verificationStatus.customerName.status === 'verified' &&
      verificationStatus.username.status === 'verified';

    return !criticalFieldsVerified;
  }

  private async performAction(action: TicketAction): Promise<{
    success: boolean;
    blocked: boolean;
    reason?: string;
  }> {
    try {
      // This is where the actual ticket action would be performed
      // For now, we'll simulate the action execution
      
      logger.info('Performing ticket action', {
        actionId: action.id,
        type: action.type,
        ticketId: action.ticketId,
        userId: action.userId,
      });

      // Simulate action execution based on type
      switch (action.type) {
        case 'resolve':
          // Would integrate with ticket system to mark as resolved
          break;
        case 'escalate':
          // Would escalate to next tier
          break;
        case 'close':
          // Would close the ticket
          break;
        case 'modify':
          // Would modify ticket or customer data
          break;
        case 'access':
          // Would grant system access
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      return {
        success: true,
        blocked: false,
        reason: 'Action executed successfully',
      };
    } catch (error) {
      logger.error('Action execution failed', {
        actionId: action.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        blocked: false,
        reason: error instanceof Error ? error.message : 'Action failed',
      };
    }
  }

  private async executePendingActions(ticketId: string, userId: string): Promise<void> {
    const pendingActions = Array.from(this.pendingActions.entries())
      .filter(([, action]) => action.ticketId === ticketId && action.userId === userId);

    for (const [actionId, action] of pendingActions) {
      const result = await this.performAction(action);
      
      if (result.success) {
        this.pendingActions.delete(actionId);
        logger.info('Pending action executed', {
          actionId,
          type: action.type,
          ticketId,
          userId,
        });
      } else {
        logger.error('Pending action execution failed', {
          actionId,
          type: action.type,
          reason: result.reason,
        });
      }
    }
  }

  async getVerificationInsights(userId: string): Promise<{
    totalGatesCreated: number;
    gatesBlocked: number;
    gatesBypassed: number;
    averageResolutionTime: number;
    recentActivity: any[];
  }> {
    const userGates = Array.from(this.verificationGates.values())
      .filter(gate => gate.userId === userId);

    const totalGates = userGates.length;
    const blockedGates = userGates.filter(g => g.status === 'blocked').length;
    const bypassedGates = userGates.filter(g => g.status === 'bypassed').length;
    
    const completedGates = userGates.filter(g => g.completedAt);
    const totalResolutionTime = completedGates.reduce((sum, gate) => {
      if (gate.completedAt) {
        return sum + (gate.completedAt.getTime() - gate.createdAt.getTime());
      }
      return sum;
    }, 0);

    const averageResolutionTime = completedGates.length > 0 
      ? totalResolutionTime / completedGates.length 
      : 0;

    const recentActivity = userGates
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(gate => ({
        ticketId: gate.ticketId,
        status: gate.status,
        createdAt: gate.createdAt,
        completedAt: gate.completedAt,
        actions: gate.requiredActions,
      }));

    return {
      totalGatesCreated: totalGates,
      gatesBlocked: blockedGates,
      gatesBypassed: bypassedGates,
      averageResolutionTime,
      recentActivity,
    };
  }
}

export const verificationIntegration = new VerificationIntegrationService();
export default verificationIntegration;