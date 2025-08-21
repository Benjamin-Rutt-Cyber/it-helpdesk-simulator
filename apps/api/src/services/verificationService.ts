import { logger } from '../utils/logger';

export interface VerificationAttempt {
  id: string;
  ticketId: string;
  userId: string;
  fieldType: 'customerName' | 'username' | 'assetTag' | 'department' | 'contactInfo';
  attemptedValue: string;
  method: 'direct' | 'knowledge' | 'callback' | 'email' | 'manager';
  status: 'pending' | 'in_progress' | 'verified' | 'failed' | 'bypassed';
  timestamp: Date;
  duration?: number; // in milliseconds
  notes?: string;
  customerResponse?: string;
  verifierNotes?: string;
}

export interface VerificationSession {
  id: string;
  ticketId: string;
  userId: string;
  customerPersona?: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  totalAttempts: number;
  successfulVerifications: number;
  failedVerifications: number;
  bypassedVerifications: number;
  attempts: VerificationAttempt[];
  requiredFields: string[];
  completedFields: string[];
  isBlocked: boolean;
  overallScore?: number; // 0-100
  efficiency?: number; // 0-100
  securityCompliance?: number; // 0-100
}

export interface VerificationRequirement {
  fieldType: string;
  required: boolean;
  allowBypass: boolean;
  maxAttempts: number;
  timeoutMinutes: number;
  alternativeMethods: string[];
}

export interface VerificationConfig {
  requirements: VerificationRequirement[];
  blockingEnabled: boolean;
  maxSessionTime: number; // in minutes
  allowEmergencyBypass: boolean;
  requireManagerApproval: boolean;
  trackingEnabled: boolean;
}

export interface VerificationAnalytics {
  totalSessions: number;
  completedSessions: number;
  averageCompletionTime: number;
  successRateByField: Record<string, number>;
  methodEffectiveness: Record<string, number>;
  personaSuccessRates: Record<string, number>;
  commonFailureReasons: string[];
  performanceTrends: {
    date: string;
    completionRate: number;
    averageTime: number;
  }[];
}

export class VerificationService {
  private sessions: Map<string, VerificationSession> = new Map();
  private completedSessions: VerificationSession[] = [];
  private config: VerificationConfig;

  constructor() {
    this.config = this.getDefaultConfig();
    this.startCleanupTimer();
  }

  private getDefaultConfig(): VerificationConfig {
    return {
      requirements: [
        {
          fieldType: 'customerName',
          required: true,
          allowBypass: false,
          maxAttempts: 3,
          timeoutMinutes: 10,
          alternativeMethods: ['callback', 'manager']
        },
        {
          fieldType: 'username',
          required: true,
          allowBypass: false,
          maxAttempts: 3,
          timeoutMinutes: 10,
          alternativeMethods: ['knowledge', 'callback']
        },
        {
          fieldType: 'assetTag',
          required: true,
          allowBypass: true,
          maxAttempts: 5,
          timeoutMinutes: 15,
          alternativeMethods: ['manager', 'email']
        },
        {
          fieldType: 'department',
          required: true,
          allowBypass: false,
          maxAttempts: 2,
          timeoutMinutes: 5,
          alternativeMethods: ['knowledge']
        },
        {
          fieldType: 'contactInfo',
          required: true,
          allowBypass: false,
          maxAttempts: 3,
          timeoutMinutes: 10,
          alternativeMethods: ['callback', 'email']
        }
      ],
      blockingEnabled: true,
      maxSessionTime: 30,
      allowEmergencyBypass: true,
      requireManagerApproval: true,
      trackingEnabled: true
    };
  }

  // Session Management
  async startVerificationSession(
    ticketId: string, 
    userId: string, 
    customerPersona?: string
  ): Promise<VerificationSession> {
    try {
      const sessionId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: VerificationSession = {
        id: sessionId,
        ticketId,
        userId,
        customerPersona,
        startTime: new Date(),
        status: 'active',
        totalAttempts: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        bypassedVerifications: 0,
        attempts: [],
        requiredFields: this.config.requirements.map(r => r.fieldType),
        completedFields: [],
        isBlocked: this.config.blockingEnabled
      };

      this.sessions.set(sessionId, session);

      logger.info('Verification session started', {
        sessionId,
        ticketId,
        userId,
        customerPersona
      });

      return session;

    } catch (error) {
      logger.error('Error starting verification session:', error);
      throw error;
    }
  }

  async getVerificationSession(sessionId: string): Promise<VerificationSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async endVerificationSession(sessionId: string): Promise<VerificationSession | null> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        logger.warn('Session not found for ending:', { sessionId });
        return null;
      }

      session.endTime = new Date();
      session.status = session.completedFields.length === session.requiredFields.length 
        ? 'completed' 
        : 'failed';

      // Calculate performance scores
      this.calculateSessionScores(session);

      // Move to completed sessions
      this.completedSessions.push({ ...session });
      this.sessions.delete(sessionId);

      logger.info('Verification session ended', {
        sessionId,
        status: session.status,
        completedFields: session.completedFields.length,
        totalAttempts: session.totalAttempts,
        duration: session.endTime.getTime() - session.startTime.getTime()
      });

      return session;

    } catch (error) {
      logger.error('Error ending verification session:', error);
      throw error;
    }
  }

  // Verification Attempts
  async startVerificationAttempt(
    sessionId: string,
    fieldType: string,
    method: string,
    attemptedValue: string
  ): Promise<VerificationAttempt> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Verification session not found: ${sessionId}`);
      }

      const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const attempt: VerificationAttempt = {
        id: attemptId,
        ticketId: session.ticketId,
        userId: session.userId,
        fieldType: fieldType as any,
        attemptedValue,
        method: method as any,
        status: 'in_progress',
        timestamp: new Date()
      };

      session.attempts.push(attempt);
      session.totalAttempts++;

      logger.info('Verification attempt started', {
        sessionId,
        attemptId,
        fieldType,
        method
      });

      return attempt;

    } catch (error) {
      logger.error('Error starting verification attempt:', error);
      throw error;
    }
  }

  async completeVerificationAttempt(
    sessionId: string,
    attemptId: string,
    success: boolean,
    duration: number,
    notes?: string,
    customerResponse?: string
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Verification session not found: ${sessionId}`);
      }

      const attempt = session.attempts.find(a => a.id === attemptId);
      if (!attempt) {
        throw new Error(`Verification attempt not found: ${attemptId}`);
      }

      attempt.status = success ? 'verified' : 'failed';
      attempt.duration = duration;
      attempt.notes = notes;
      attempt.customerResponse = customerResponse;

      // Update session counters
      if (success) {
        session.successfulVerifications++;
        if (!session.completedFields.includes(attempt.fieldType)) {
          session.completedFields.push(attempt.fieldType);
        }
      } else {
        session.failedVerifications++;
      }

      // Check if verification is complete
      if (session.completedFields.length === session.requiredFields.length) {
        session.isBlocked = false;
      }

      logger.info('Verification attempt completed', {
        sessionId,
        attemptId,
        success,
        fieldType: attempt.fieldType,
        completedFields: session.completedFields.length,
        totalRequired: session.requiredFields.length
      });

    } catch (error) {
      logger.error('Error completing verification attempt:', error);
      throw error;
    }
  }

  // Verification Status
  async isVerificationComplete(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    return session.completedFields.length === session.requiredFields.length;
  }

  async isTicketBlocked(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return true; // Block by default if no session

    return session.isBlocked && !await this.isVerificationComplete(sessionId);
  }

  async getVerificationProgress(sessionId: string): Promise<{
    totalFields: number;
    completedFields: number;
    pendingFields: number;
    failedAttempts: number;
    completionPercentage: number;
  } | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const totalFields = session.requiredFields.length;
    const completedFields = session.completedFields.length;
    const pendingFields = totalFields - completedFields;
    const failedAttempts = session.failedVerifications;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return {
      totalFields,
      completedFields,
      pendingFields,
      failedAttempts,
      completionPercentage
    };
  }

  // Bypass and Alternative Methods
  async requestVerificationBypass(
    sessionId: string,
    fieldType: string,
    reason: string,
    approverUserId?: string
  ): Promise<{ approved: boolean; reason?: string }> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Verification session not found: ${sessionId}`);
      }

      const requirement = this.config.requirements.find(r => r.fieldType === fieldType);
      if (!requirement || !requirement.allowBypass) {
        return { approved: false, reason: 'Bypass not allowed for this field' };
      }

      // In a real implementation, this would involve approval workflow
      const approved = this.evaluateBypassRequest(reason, approverUserId);

      if (approved) {
        const bypassAttempt: VerificationAttempt = {
          id: `bypass_${Date.now()}`,
          ticketId: session.ticketId,
          userId: session.userId,
          fieldType: fieldType as any,
          attemptedValue: 'BYPASSED',
          method: 'manager',
          status: 'bypassed',
          timestamp: new Date(),
          notes: `Bypass approved: ${reason}`,
          verifierNotes: approverUserId ? `Approved by user: ${approverUserId}` : 'Auto-approved'
        };

        session.attempts.push(bypassAttempt);
        session.bypassedVerifications++;
        
        if (!session.completedFields.includes(fieldType)) {
          session.completedFields.push(fieldType);
        }

        // Check if verification is now complete
        if (session.completedFields.length === session.requiredFields.length) {
          session.isBlocked = false;
        }

        logger.info('Verification bypass approved', {
          sessionId,
          fieldType,
          reason,
          approverUserId
        });
      }

      return { approved };

    } catch (error) {
      logger.error('Error processing verification bypass:', error);
      throw error;
    }
  }

  private evaluateBypassRequest(reason: string, approverUserId?: string): boolean {
    // Simple bypass evaluation logic
    // In real implementation, this would involve more sophisticated approval process
    
    const emergencyKeywords = ['emergency', 'urgent', 'critical', 'outage', 'down'];
    const hasEmergencyReason = emergencyKeywords.some(keyword => 
      reason.toLowerCase().includes(keyword)
    );

    // Auto-approve if emergency and emergency bypass is allowed
    if (hasEmergencyReason && this.config.allowEmergencyBypass) {
      return true;
    }

    // Approve if manager approval is provided and required
    if (approverUserId && this.config.requireManagerApproval) {
      return true;
    }

    return false;
  }

  // AI Customer Response Integration
  async simulateCustomerVerificationResponse(
    sessionId: string,
    fieldType: string,
    persona: string,
    question: string
  ): Promise<{
    response: string;
    providedInfo: boolean;
    hesitation: boolean;
    additionalContext?: string;
  }> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Verification session not found: ${sessionId}`);
      }

      // Generate persona-appropriate response
      const response = this.generatePersonaResponse(persona, fieldType, question);

      logger.debug('AI customer response generated', {
        sessionId,
        fieldType,
        persona,
        providedInfo: response.providedInfo
      });

      return response;

    } catch (error) {
      logger.error('Error generating customer response:', error);
      throw error;
    }
  }

  private generatePersonaResponse(
    persona: string, 
    fieldType: string, 
    _question: string
  ): {
    response: string;
    providedInfo: boolean;
    hesitation: boolean;
    additionalContext?: string;
  } {
    const responses: Record<string, Record<string, any>> = {
      'office-worker': {
        customerName: {
          response: "Yes, my name is Sarah Johnson. That's J-O-H-N-S-O-N.",
          providedInfo: true,
          hesitation: false
        },
        username: {
          response: "My username is sjohnson. I use it to log into my computer every morning.",
          providedInfo: true,
          hesitation: false
        },
        assetTag: {
          response: "Let me check... I see a sticker that says 'PC-2019-0456'.",
          providedInfo: true,
          hesitation: false
        },
        department: {
          response: "I work in Marketing. My manager is Jennifer Smith.",
          providedInfo: true,
          hesitation: false
        },
        contactInfo: {
          response: "My desk phone is extension 3421, or you can reach me at (555) 123-4567.",
          providedInfo: true,
          hesitation: false
        }
      },
      'frustrated-user': {
        customerName: {
          response: "Look, I've already told someone my name is Mike Davis. Can we please just fix this?",
          providedInfo: true,
          hesitation: true,
          additionalContext: "Customer shows frustration but provides information"
        },
        username: {
          response: "It's mdavis, okay? I just want to get back to work.",
          providedInfo: true,
          hesitation: true
        },
        assetTag: {
          response: "I don't know, there's a bunch of numbers... PC-something? This is ridiculous.",
          providedInfo: false,
          hesitation: true,
          additionalContext: "Customer resistant to looking for asset tag"
        }
      },
      'executive': {
        customerName: {
          response: "This is Robert Chen, Vice President of Operations. Surely you can skip this verification?",
          providedInfo: true,
          hesitation: false,
          additionalContext: "Executive attempting to bypass verification"
        },
        username: {
          response: "I don't have time for this. My assistant handles my IT issues. Can't you just fix it?",
          providedInfo: false,
          hesitation: false,
          additionalContext: "Executive resistant to providing verification"
        }
      }
    };

    const personaResponses = responses[persona.toLowerCase()] || responses['office-worker'];
    const fieldResponse = personaResponses[fieldType] || {
      response: "I'm not sure about that information.",
      providedInfo: false,
      hesitation: true
    };

    return fieldResponse;
  }

  // Performance Scoring
  private calculateSessionScores(session: VerificationSession): void {
    if (!session.endTime) return;

    const duration = session.endTime.getTime() - session.startTime.getTime();
    const completionRate = session.completedFields.length / session.requiredFields.length;
    
    // Overall score (0-100)
    session.overallScore = Math.round(completionRate * 100);

    // Efficiency score based on time and attempts
    const expectedTime = session.requiredFields.length * 2 * 60 * 1000; // 2 minutes per field
    const timeEfficiency = Math.max(0, Math.min(1, expectedTime / duration));
    const attemptEfficiency = Math.max(0, Math.min(1, session.requiredFields.length / session.totalAttempts));
    session.efficiency = Math.round((timeEfficiency * 0.6 + attemptEfficiency * 0.4) * 100);

    // Security compliance score
    const bypassPenalty = session.bypassedVerifications * 0.1;
    const failurePenalty = session.failedVerifications * 0.05;
    session.securityCompliance = Math.round(Math.max(0, (1 - bypassPenalty - failurePenalty) * 100));
  }

  // Analytics
  async getVerificationAnalytics(dateRange?: { start: Date; end: Date }): Promise<VerificationAnalytics> {
    try {
      let sessions = this.completedSessions;

      if (dateRange) {
        sessions = sessions.filter(s => 
          s.startTime >= dateRange.start && s.startTime <= dateRange.end
        );
      }

      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      
      const totalDuration = sessions.reduce((sum, s) => 
        sum + (s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0), 0
      );
      const averageCompletionTime = totalSessions > 0 ? totalDuration / totalSessions : 0;

      // Success rate by field
      const fieldStats = new Map<string, { attempts: number; successes: number }>();
      sessions.forEach(session => {
        session.attempts.forEach(attempt => {
          const stats = fieldStats.get(attempt.fieldType) || { attempts: 0, successes: 0 };
          stats.attempts++;
          if (attempt.status === 'verified') stats.successes++;
          fieldStats.set(attempt.fieldType, stats);
        });
      });

      const successRateByField: Record<string, number> = {};
      fieldStats.forEach((stats, field) => {
        successRateByField[field] = stats.attempts > 0 ? stats.successes / stats.attempts : 0;
      });

      // Method effectiveness
      const methodStats = new Map<string, { attempts: number; successes: number }>();
      sessions.forEach(session => {
        session.attempts.forEach(attempt => {
          const stats = methodStats.get(attempt.method) || { attempts: 0, successes: 0 };
          stats.attempts++;
          if (attempt.status === 'verified') stats.successes++;
          methodStats.set(attempt.method, stats);
        });
      });

      const methodEffectiveness: Record<string, number> = {};
      methodStats.forEach((stats, method) => {
        methodEffectiveness[method] = stats.attempts > 0 ? stats.successes / stats.attempts : 0;
      });

      // Persona success rates
      const personaStats = new Map<string, { total: number; completed: number }>();
      sessions.forEach(session => {
        if (session.customerPersona) {
          const stats = personaStats.get(session.customerPersona) || { total: 0, completed: 0 };
          stats.total++;
          if (session.status === 'completed') stats.completed++;
          personaStats.set(session.customerPersona, stats);
        }
      });

      const personaSuccessRates: Record<string, number> = {};
      personaStats.forEach((stats, persona) => {
        personaSuccessRates[persona] = stats.total > 0 ? stats.completed / stats.total : 0;
      });

      return {
        totalSessions,
        completedSessions,
        averageCompletionTime: Math.round(averageCompletionTime / 1000), // Convert to seconds
        successRateByField,
        methodEffectiveness,
        personaSuccessRates,
        commonFailureReasons: [], // Would analyze failure notes in real implementation
        performanceTrends: [] // Would generate trends in real implementation
      };

    } catch (error) {
      logger.error('Error generating verification analytics:', error);
      throw error;
    }
  }

  // Cleanup and Maintenance
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const maxAge = this.config.maxSessionTime * 60 * 1000; // Convert to milliseconds

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.startTime.getTime() > maxAge) {
        session.status = 'abandoned';
        session.endTime = new Date();
        this.completedSessions.push({ ...session });
        this.sessions.delete(sessionId);

        logger.info('Expired verification session cleaned up', { sessionId });
      }
    }
  }

  async getServiceStatus(): Promise<{
    activeSessions: number;
    completedSessions: number;
    averageSessionTime: number;
    blockingEnabled: boolean;
    isHealthy: boolean;
  }> {
    const averageSessionTime = this.completedSessions.length > 0
      ? this.completedSessions.reduce((sum, s) => {
          const duration = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0;
          return sum + duration;
        }, 0) / this.completedSessions.length
      : 0;

    return {
      activeSessions: this.sessions.size,
      completedSessions: this.completedSessions.length,
      averageSessionTime: Math.round(averageSessionTime / 1000), // Convert to seconds
      blockingEnabled: this.config.blockingEnabled,
      isHealthy: true
    };
  }
}