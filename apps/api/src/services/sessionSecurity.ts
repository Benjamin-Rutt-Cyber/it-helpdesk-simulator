import { EventEmitter } from 'events';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { SessionContext } from './sessionManager';
import { logger } from '../utils/logger';
import { createClient, RedisClientType } from 'redis';

const scryptAsync = promisify(scrypt);

export interface SecurityConfig {
  encryptionEnabled: boolean;
  encryptionAlgorithm: string;
  keyDerivationRounds: number;
  dataRetentionDays: number;
  auditLogRetentionDays: number;
  piiAnonymizationEnabled: boolean;
  accessControlEnabled: boolean;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  algorithm: string;
  keyId: string;
}

export interface AccessAuditLog {
  id: string;
  sessionId: string;
  userId: string;
  action: 'read' | 'write' | 'delete' | 'recover' | 'export';
  resource: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  retentionPeriod: number;
  encryptionRequired: boolean;
  auditRequired: boolean;
}

export interface PIIAnonymizationRule {
  field: string;
  pattern: RegExp;
  replacement: string;
  preserveFormat: boolean;
}

export interface SessionDataAccess {
  sessionId: string;
  userId: string;
  requestedBy: string;
  accessReason: string;
  approvedBy?: string;
  accessGranted: boolean;
  accessTime?: number;
  dataReturned?: boolean;
}

export class SessionSecurity extends EventEmitter {
  private redisClient: RedisClientType;
  private encryptionKeys: Map<string, Buffer> = new Map();
  private auditLogs: AccessAuditLog[] = [];
  private securityConfig: SecurityConfig;

  // Default security configuration
  private readonly DEFAULT_CONFIG: SecurityConfig = {
    encryptionEnabled: true,
    encryptionAlgorithm: 'aes-256-gcm',
    keyDerivationRounds: 100000,
    dataRetentionDays: 90,
    auditLogRetentionDays: 365,
    piiAnonymizationEnabled: true,
    accessControlEnabled: true,
  };

  // PII patterns for anonymization
  private readonly PII_RULES: PIIAnonymizationRule[] = [
    {
      field: 'email',
      pattern: /[\w.-]+@[\w.-]+\.\w+/gi,
      replacement: '[EMAIL_ANONYMIZED]',
      preserveFormat: false,
    },
    {
      field: 'phone',
      pattern: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/gi,
      replacement: '[PHONE_ANONYMIZED]',
      preserveFormat: false,
    },
    {
      field: 'ssn',
      pattern: /\b\d{3}-?\d{2}-?\d{4}\b/gi,
      replacement: '[SSN_ANONYMIZED]',
      preserveFormat: false,
    },
    {
      field: 'ipv4',
      pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/gi,
      replacement: '[IP_ANONYMIZED]',
      preserveFormat: false,
    },
    {
      field: 'name',
      pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/gi,
      replacement: '[NAME_ANONYMIZED]',
      preserveFormat: false,
    },
  ];

  // Data classification rules
  private readonly DATA_CLASSIFICATIONS: Map<string, DataClassification> = new Map([
    ['session_context', {
      level: 'confidential',
      categories: ['session_data', 'user_interaction'],
      retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
      encryptionRequired: true,
      auditRequired: true,
    }],
    ['chat_messages', {
      level: 'confidential',
      categories: ['communication', 'pii'],
      retentionPeriod: 180 * 24 * 60 * 60 * 1000, // 180 days
      encryptionRequired: true,
      auditRequired: true,
    }],
    ['performance_metrics', {
      level: 'internal',
      categories: ['analytics', 'performance'],
      retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      encryptionRequired: false,
      auditRequired: false,
    }],
    ['recovery_snapshots', {
      level: 'restricted',
      categories: ['session_data', 'recovery', 'pii'],
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      encryptionRequired: true,
      auditRequired: true,
    }],
  ]);

  constructor(config?: Partial<SecurityConfig>) {
    super();
    this.securityConfig = { ...this.DEFAULT_CONFIG, ...config };
    this.redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.initializeEncryptionKeys();
    this.setupAuditCleanup();
  }

  async initialize(): Promise<void> {
    try {
      await this.redisClient.ping();
      await this.loadAuditLogs();
      logger.info('Session security service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize session security service', { error });
      throw error;
    }
  }

  async encryptSessionData(data: any, dataType: string): Promise<EncryptedData> {
    try {
      if (!this.securityConfig.encryptionEnabled) {
        return {
          data: JSON.stringify(data),
          iv: '',
          salt: '',
          algorithm: 'none',
          keyId: 'none',
        };
      }

      const classification = this.DATA_CLASSIFICATIONS.get(dataType);
      if (!classification?.encryptionRequired) {
        return {
          data: JSON.stringify(data),
          iv: '',
          salt: '',
          algorithm: 'none',
          keyId: 'none',
        };
      }

      // Generate encryption parameters
      const salt = randomBytes(32);
      const iv = randomBytes(16);
      const keyId = `key_${Date.now()}`;

      // Derive encryption key
      const key = await this.deriveKey(process.env.ENCRYPTION_MASTER_KEY || 'default_key', salt);
      this.encryptionKeys.set(keyId, key);

      // Encrypt data
      const cipher = createCipheriv(this.securityConfig.encryptionAlgorithm, key, iv);
      const jsonData = JSON.stringify(data);
      let encrypted = cipher.update(jsonData, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag for GCM mode
      const authTag = (cipher as any).getAuthTag?.()?.toString('hex') || '';

      const result: EncryptedData = {
        data: encrypted + (authTag ? ':' + authTag : ''),
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: this.securityConfig.encryptionAlgorithm,
        keyId,
      };

      logger.debug('Data encrypted successfully', { dataType, keyId });
      return result;
    } catch (error) {
      logger.error('Failed to encrypt session data', { dataType, error });
      throw error;
    }
  }

  async decryptSessionData(encryptedData: EncryptedData): Promise<any> {
    try {
      if (encryptedData.algorithm === 'none') {
        return JSON.parse(encryptedData.data);
      }

      // Get encryption key
      let key = this.encryptionKeys.get(encryptedData.keyId);
      if (!key) {
        // Derive key if not in memory
        const salt = Buffer.from(encryptedData.salt, 'hex');
        key = await this.deriveKey(process.env.ENCRYPTION_MASTER_KEY || 'default_key', salt);
        this.encryptionKeys.set(encryptedData.keyId, key);
      }

      // Prepare decryption
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = createDecipheriv(encryptedData.algorithm, key, iv);

      // Handle authentication tag for GCM mode
      let ciphertext = encryptedData.data;
      if (encryptedData.algorithm.includes('gcm') && ciphertext.includes(':')) {
        const [data, authTag] = ciphertext.split(':');
        ciphertext = data;
        (decipher as any).setAuthTag?.(Buffer.from(authTag, 'hex'));
      }

      // Decrypt data
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logger.debug('Data decrypted successfully', { keyId: encryptedData.keyId });
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Failed to decrypt session data', { keyId: encryptedData.keyId, error });
      throw error;
    }
  }

  async anonymizeSessionData(sessionContext: SessionContext): Promise<SessionContext> {
    try {
      if (!this.securityConfig.piiAnonymizationEnabled) {
        return sessionContext;
      }

      const anonymized = JSON.parse(JSON.stringify(sessionContext)); // Deep clone

      // Anonymize customer info
      if (anonymized.customerInfo) {
        anonymized.customerInfo.name = this.anonymizeField(anonymized.customerInfo.name || '', 'name');
        anonymized.customerInfo.contactInfo = this.anonymizeField(anonymized.customerInfo.contactInfo || '', 'email');
        anonymized.customerInfo.issueDescription = this.anonymizePII(anonymized.customerInfo.issueDescription);
      }

      // Anonymize notes
      if (anonymized.notes) {
        anonymized.notes = anonymized.notes.map(note => this.anonymizePII(note));
      }

      // Anonymize metadata
      if (anonymized.metadata) {
        anonymized.metadata = this.anonymizeObject(anonymized.metadata);
      }

      logger.debug('Session data anonymized successfully', { sessionId: sessionContext.sessionId });
      return anonymized;
    } catch (error) {
      logger.error('Failed to anonymize session data', { sessionId: sessionContext.sessionId, error });
      throw error;
    }
  }

  async auditDataAccess(audit: Omit<AccessAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditLog: AccessAuditLog = {
        id: this.generateAuditId(),
        timestamp: Date.now(),
        ...audit,
      };

      // Store audit log
      this.auditLogs.push(auditLog);
      await this.persistAuditLog(auditLog);

      // Emit audit event
      this.emit('data_access_audited', auditLog);

      logger.info('Data access audited', {
        sessionId: audit.sessionId,
        userId: audit.userId,
        action: audit.action,
        resource: audit.resource,
      });
    } catch (error) {
      logger.error('Failed to audit data access', { audit, error });
      throw error;
    }
  }

  async checkDataAccess(
    sessionId: string,
    requestedBy: string,
    action: AccessAuditLog['action'],
    resource: string
  ): Promise<boolean> {
    try {
      if (!this.securityConfig.accessControlEnabled) {
        return true;
      }

      // Check if user has permission to access this session
      const hasAccess = await this.validateUserAccess(sessionId, requestedBy, action);

      // Log access attempt
      await this.auditDataAccess({
        sessionId,
        userId: requestedBy,
        action,
        resource,
        metadata: {
          accessGranted: hasAccess,
          accessCheck: true,
        },
      });

      return hasAccess;
    } catch (error) {
      logger.error('Failed to check data access', { sessionId, requestedBy, action, resource, error });
      return false;
    }
  }

  async getAuditTrail(sessionId: string, limit: number = 100): Promise<AccessAuditLog[]> {
    try {
      const sessionAudits = this.auditLogs
        .filter(log => log.sessionId === sessionId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      logger.debug('Retrieved audit trail', { sessionId, count: sessionAudits.length });
      return sessionAudits;
    } catch (error) {
      logger.error('Failed to get audit trail', { sessionId, error });
      return [];
    }
  }

  async getUserDataRequest(userId: string): Promise<{
    sessions: string[];
    dataTypes: string[];
    totalRecords: number;
    retentionStatus: Record<string, { expires: number; encrypted: boolean }>;
  }> {
    try {
      // Get all sessions for user
      const userAudits = this.auditLogs.filter(log => log.userId === userId);
      const sessionIds = [...new Set(userAudits.map(log => log.sessionId))];

      // Get data retention status
      const retentionStatus: Record<string, { expires: number; encrypted: boolean }> = {};
      
      for (const [dataType, classification] of this.DATA_CLASSIFICATIONS.entries()) {
        retentionStatus[dataType] = {
          expires: Date.now() + classification.retentionPeriod,
          encrypted: classification.encryptionRequired,
        };
      }

      return {
        sessions: sessionIds,
        dataTypes: Array.from(this.DATA_CLASSIFICATIONS.keys()),
        totalRecords: userAudits.length,
        retentionStatus,
      };
    } catch (error) {
      logger.error('Failed to get user data request', { userId, error });
      throw error;
    }
  }

  async deleteUserData(userId: string, _dataTypes?: string[]): Promise<{
    deletedSessions: string[];
    deletedRecords: number;
    errors: string[];
  }> {
    try {
      const result = {
        deletedSessions: [] as string[],
        deletedRecords: 0,
        errors: [] as string[],
      };

      // Get user sessions
      const userAudits = this.auditLogs.filter(log => log.userId === userId);
      const sessionIds = [...new Set(userAudits.map(log => log.sessionId))];

      // Delete session data
      for (const sessionId of sessionIds) {
        try {
          // Delete from Redis
          const keys = await this.redisClient.keys(`*:${sessionId}*`);
          if (keys.length > 0) {
            await this.redisClient.del(...keys);
          }

          result.deletedSessions.push(sessionId);
          result.deletedRecords += keys.length;

          // Audit deletion
          await this.auditDataAccess({
            sessionId,
            userId,
            action: 'delete',
            resource: 'user_data_deletion',
            metadata: {
              deletionReason: 'user_request',
              deletedKeys: keys.length,
            },
          });
        } catch (error) {
          result.errors.push(`Failed to delete session ${sessionId}: ${error.message}`);
        }
      }

      logger.info('User data deletion completed', {
        userId,
        deletedSessions: result.deletedSessions.length,
        deletedRecords: result.deletedRecords,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to delete user data', { userId, error });
      throw error;
    }
  }

  async cleanupExpiredData(): Promise<{
    cleanedSessions: number;
    cleanedAuditLogs: number;
    errors: string[];
  }> {
    try {
      const now = Date.now();
      const result = {
        cleanedSessions: 0,
        cleanedAuditLogs: 0,
        errors: [] as string[],
      };

      // Clean up expired session data
      for (const [dataType, classification] of this.DATA_CLASSIFICATIONS.entries()) {
        try {
          const expirationTime = now - classification.retentionPeriod;
          const pattern = `${dataType}:*`;
          const keys = await this.redisClient.keys(pattern);

          for (const key of keys) {
            const data = await this.redisClient.get(key);
            if (data) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.timestamp && parsed.timestamp < expirationTime) {
                  await this.redisClient.del(key);
                  result.cleanedSessions++;
                }
              } catch (parseError) {
                // Handle non-JSON data or missing timestamp
                result.errors.push(`Failed to parse data for cleanup: ${key}`);
              }
            }
          }
        } catch (error) {
          result.errors.push(`Failed to cleanup ${dataType}: ${error.message}`);
        }
      }

      // Clean up expired audit logs
      const auditExpiration = now - (this.securityConfig.auditLogRetentionDays * 24 * 60 * 60 * 1000);
      const expiredAudits = this.auditLogs.filter(log => log.timestamp < auditExpiration);
      
      this.auditLogs = this.auditLogs.filter(log => log.timestamp >= auditExpiration);
      result.cleanedAuditLogs = expiredAudits.length;

      logger.info('Data cleanup completed', result);
      return result;
    } catch (error) {
      logger.error('Failed to cleanup expired data', { error });
      throw error;
    }
  }

  // Private helper methods

  private async deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(masterKey, salt, 32)) as Buffer;
  }

  private initializeEncryptionKeys(): void {
    // Initialize with a default key - in production, this should be loaded securely
    const defaultSalt = Buffer.from('default_salt_for_demo', 'utf8');
    this.deriveKey(process.env.ENCRYPTION_MASTER_KEY || 'default_key', defaultSalt)
      .then(key => {
        this.encryptionKeys.set('default', key);
      })
      .catch(error => {
        logger.error('Failed to initialize default encryption key', { error });
      });
  }

  private anonymizeField(value: string, fieldType: string): string {
    const rule = this.PII_RULES.find(r => r.field === fieldType);
    if (!rule) return value;

    return value.replace(rule.pattern, rule.replacement);
  }

  private anonymizePII(text: string): string {
    let result = text;
    
    for (const rule of this.PII_RULES) {
      result = result.replace(rule.pattern, rule.replacement);
    }
    
    return result;
  }

  private anonymizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? this.anonymizePII(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.anonymizeObject(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.anonymizeObject(value);
    }
    
    return result;
  }

  private async validateUserAccess(
    sessionId: string,
    userId: string,
    _action: AccessAuditLog['action']
  ): Promise<boolean> {
    // Simple access control - in production, this would integrate with a proper RBAC system
    
    // Users can always access their own sessions
    const sessionAudits = this.auditLogs.filter(log => log.sessionId === sessionId);
    const sessionUserId = sessionAudits.find(log => log.action === 'read')?.userId;
    
    if (sessionUserId === userId) {
      return true;
    }

    // Admin users can access any session
    if (process.env.ADMIN_USER_IDS?.split(',').includes(userId)) {
      return true;
    }

    // Default deny
    return false;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private async persistAuditLog(auditLog: AccessAuditLog): Promise<void> {
    try {
      await this.redisClient.lpush(
        'audit_logs',
        JSON.stringify(auditLog)
      );
      
      // Keep only the last 10000 audit logs in Redis
      await this.redisClient.ltrim('audit_logs', 0, 9999);
    } catch (error) {
      logger.error('Failed to persist audit log', { auditId: auditLog.id, error });
    }
  }

  private async loadAuditLogs(): Promise<void> {
    try {
      const logs = await this.redisClient.lrange('audit_logs', 0, -1);
      this.auditLogs = logs.map(log => JSON.parse(log)).reverse(); // Reverse to get chronological order
      
      logger.info('Audit logs loaded', { count: this.auditLogs.length });
    } catch (error) {
      logger.error('Failed to load audit logs', { error });
      this.auditLogs = [];
    }
  }

  private setupAuditCleanup(): void {
    // Clean up expired data every 24 hours
    setInterval(() => {
      this.cleanupExpiredData().catch(error => {
        logger.error('Scheduled data cleanup failed', { error });
      });
    }, 24 * 60 * 60 * 1000);
  }

  async cleanup(): Promise<void> {
    try {
      // Clear encryption keys from memory
      this.encryptionKeys.clear();
      
      // Close Redis connection
      await this.redisClient.quit();
      
      logger.info('Session security service cleaned up successfully');
    } catch (error) {
      logger.error('Failed to cleanup session security service', { error });
    }
  }
}

export const sessionSecurity = new SessionSecurity();
export default sessionSecurity;