import { EventEmitter } from 'events';
import { SessionRepository } from '../repositories/sessionRepository';
import { sessionSecurity } from './sessionSecurity';
import { logger } from '../utils/logger';
import { createClient, RedisClientType } from 'redis';
import { PrismaClient } from '@prisma/client';

export interface CleanupPolicy {
  dataType: string;
  retentionPeriodDays: number;
  archiveEnabled: boolean;
  anonymizeBeforeArchive: boolean;
  deleteAfterArchive: boolean;
  compressionEnabled: boolean;
}

export interface CleanupJob {
  id: string;
  type: 'archive' | 'delete' | 'anonymize' | 'compress';
  status: 'pending' | 'running' | 'completed' | 'failed';
  dataType: string;
  startTime?: number;
  endTime?: number;
  recordsProcessed: number;
  recordsAffected: number;
  errors: string[];
  metadata: Record<string, any>;
}

export interface ArchiveRecord {
  id: string;
  originalId: string;
  dataType: string;
  data: any;
  archivedAt: number;
  originalTimestamp: number;
  anonymized: boolean;
  compressed: boolean;
  retentionExpiry: number;
}

export interface CleanupMetrics {
  totalSessionsProcessed: number;
  totalSessionsArchived: number;
  totalSessionsDeleted: number;
  totalDataSize: number;
  totalCompressionSavings: number;
  averageProcessingTime: number;
  lastCleanupRun: number;
  errorCount: number;
}

export interface RetentionReport {
  dataType: string;
  totalRecords: number;
  activeRecords: number;
  archivedRecords: number;
  expiredRecords: number;
  retentionCompliance: number; // Percentage
  recommendedActions: string[];
}

export class SessionCleanup extends EventEmitter {
  private sessionRepository: SessionRepository;
  private redisClient: RedisClientType;
  private prismaClient: PrismaClient;
  private cleanupJobs: Map<string, CleanupJob> = new Map();
  private isRunning: boolean = false;

  // Default cleanup policies
  private readonly DEFAULT_POLICIES: CleanupPolicy[] = [
    {
      dataType: 'session_context',
      retentionPeriodDays: 90,
      archiveEnabled: true,
      anonymizeBeforeArchive: true,
      deleteAfterArchive: false,
      compressionEnabled: true,
    },
    {
      dataType: 'chat_messages',
      retentionPeriodDays: 180,
      archiveEnabled: true,
      anonymizeBeforeArchive: true,
      deleteAfterArchive: false,
      compressionEnabled: true,
    },
    {
      dataType: 'performance_metrics',
      retentionPeriodDays: 365,
      archiveEnabled: true,
      anonymizeBeforeArchive: false,
      deleteAfterArchive: false,
      compressionEnabled: true,
    },
    {
      dataType: 'recovery_snapshots',
      retentionPeriodDays: 7,
      archiveEnabled: false,
      anonymizeBeforeArchive: false,
      deleteAfterArchive: true,
      compressionEnabled: false,
    },
    {
      dataType: 'audit_logs',
      retentionPeriodDays: 2555, // ~7 years for compliance
      archiveEnabled: true,
      anonymizeBeforeArchive: false,
      deleteAfterArchive: false,
      compressionEnabled: true,
    },
  ];

  private cleanupPolicies: Map<string, CleanupPolicy> = new Map();
  private cleanupMetrics: CleanupMetrics = {
    totalSessionsProcessed: 0,
    totalSessionsArchived: 0,
    totalSessionsDeleted: 0,
    totalDataSize: 0,
    totalCompressionSavings: 0,
    averageProcessingTime: 0,
    lastCleanupRun: 0,
    errorCount: 0,
  };

  constructor() {
    super();
    this.sessionRepository = new SessionRepository();
    this.redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    this.prismaClient = new PrismaClient();

    // Initialize default policies
    this.DEFAULT_POLICIES.forEach(policy => {
      this.cleanupPolicies.set(policy.dataType, policy);
    });

    this.setupScheduledCleanup();
  }

  async initialize(): Promise<void> {
    try {
      await this.redisClient.ping();
      await this.loadMetrics();
      await this.resumePendingJobs();
      logger.info('Session cleanup service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize session cleanup service', { error });
      throw error;
    }
  }

  async runCleanup(dataTypes?: string[]): Promise<CleanupJob[]> {
    if (this.isRunning) {
      throw new Error('Cleanup already in progress');
    }

    try {
      this.isRunning = true;
      const startTime = Date.now();
      const jobs: CleanupJob[] = [];
      
      const typesToClean = dataTypes || Array.from(this.cleanupPolicies.keys());

      logger.info('Starting cleanup process', { dataTypes: typesToClean });

      for (const dataType of typesToClean) {
        const policy = this.cleanupPolicies.get(dataType);
        if (!policy) {
          logger.warn('No cleanup policy found for data type', { dataType });
          continue;
        }

        try {
          const job = await this.processDataType(dataType, policy);
          jobs.push(job);
        } catch (error) {
          logger.error('Failed to process data type during cleanup', { dataType, error });
          this.cleanupMetrics.errorCount++;
        }
      }

      // Update metrics
      this.cleanupMetrics.lastCleanupRun = Date.now();
      this.cleanupMetrics.averageProcessingTime = Date.now() - startTime;
      await this.saveMetrics();

      logger.info('Cleanup process completed', { 
        jobsCompleted: jobs.length,
        duration: Date.now() - startTime 
      });

      return jobs;
    } finally {
      this.isRunning = false;
    }
  }

  async archiveSession(sessionId: string, anonymize: boolean = true): Promise<ArchiveRecord[]> {
    try {
      logger.info('Archiving session', { sessionId, anonymize });
      
      const archived: ArchiveRecord[] = [];
      const timestamp = Date.now();

      // Archive session context
      const sessionData = await this.getSessionData(sessionId);
      if (sessionData) {
        let dataToArchive = sessionData;
        
        if (anonymize) {
          dataToArchive = await sessionSecurity.anonymizeSessionData(sessionData);
        }

        const archiveRecord = await this.createArchiveRecord(
          sessionId,
          'session_context',
          dataToArchive,
          timestamp,
          anonymize
        );
        
        archived.push(archiveRecord);
      }

      // Archive chat messages
      const messages = await this.sessionRepository.findMessagesBySession(sessionId);
      if (messages.length > 0) {
        let messagesToArchive = messages;
        
        if (anonymize) {
          messagesToArchive = messages.map(msg => ({
            ...msg,
            content: this.anonymizeText(msg.content),
            metadata: this.anonymizeObject(msg.metadata),
          }));
        }

        const messageArchive = await this.createArchiveRecord(
          sessionId,
          'chat_messages',
          messagesToArchive,
          timestamp,
          anonymize
        );
        
        archived.push(messageArchive);
      }

      // Archive performance data
      const performanceData = await this.getPerformanceData(sessionId);
      if (performanceData) {
        const performanceArchive = await this.createArchiveRecord(
          sessionId,
          'performance_metrics',
          performanceData,
          timestamp,
          false // Don't anonymize performance metrics
        );
        
        archived.push(performanceArchive);
      }

      this.cleanupMetrics.totalSessionsArchived++;
      
      logger.info('Session archived successfully', { 
        sessionId, 
        recordsArchived: archived.length 
      });

      return archived;
    } catch (error) {
      logger.error('Failed to archive session', { sessionId, error });
      throw error;
    }
  }

  async deleteSession(sessionId: string, reason: string = 'Retention policy'): Promise<boolean> {
    try {
      logger.info('Deleting session', { sessionId, reason });

      // Delete from Redis
      const redisKeys = await this.redisClient.keys(`*:${sessionId}*`);
      if (redisKeys.length > 0) {
        await this.redisClient.del(...redisKeys);
      }

      // Delete from database
      await this.prismaClient.chatMessage.deleteMany({
        where: { sessionId },
      });

      await this.prismaClient.performanceMetric.deleteMany({
        where: { sessionId },
      });

      await this.prismaClient.userSession.delete({
        where: { id: sessionId },
      });

      // Audit the deletion
      await sessionSecurity.auditDataAccess({
        sessionId,
        userId: 'system',
        action: 'delete',
        resource: 'session_cleanup',
        metadata: {
          reason,
          deletedRedisKeys: redisKeys.length,
        },
      });

      this.cleanupMetrics.totalSessionsDeleted++;

      logger.info('Session deleted successfully', { sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to delete session', { sessionId, error });
      throw error;
    }
  }

  async getRetentionReport(dataType?: string): Promise<RetentionReport[]> {
    try {
      const reports: RetentionReport[] = [];
      const now = Date.now();
      
      const typesToReport = dataType ? [dataType] : Array.from(this.cleanupPolicies.keys());

      for (const type of typesToReport) {
        const policy = this.cleanupPolicies.get(type);
        if (!policy) continue;

        const retentionPeriod = policy.retentionPeriodDays * 24 * 60 * 60 * 1000;
        const expirationTime = now - retentionPeriod;

        let totalRecords = 0;
        let activeRecords = 0;
        let archivedRecords = 0;
        let expiredRecords = 0;

        switch (type) {
          case 'session_context':
            totalRecords = await this.prismaClient.userSession.count();
            activeRecords = await this.prismaClient.userSession.count({
              where: {
                createdAt: {
                  gte: new Date(expirationTime),
                },
              },
            });
            break;

          case 'chat_messages':
            totalRecords = await this.prismaClient.chatMessage.count();
            activeRecords = await this.prismaClient.chatMessage.count({
              where: {
                timestamp: {
                  gte: new Date(expirationTime),
                },
              },
            });
            break;

          case 'performance_metrics':
            totalRecords = await this.prismaClient.performanceMetric.count();
            activeRecords = await this.prismaClient.performanceMetric.count({
              where: {
                createdAt: {
                  gte: new Date(expirationTime),
                },
              },
            });
            break;
        }

        // Get archived records count
        archivedRecords = await this.getArchivedRecordsCount(type);
        expiredRecords = totalRecords - activeRecords;

        const retentionCompliance = totalRecords > 0 ? (activeRecords / totalRecords) * 100 : 100;
        
        const recommendedActions: string[] = [];
        if (expiredRecords > 0) {
          if (policy.archiveEnabled) {
            recommendedActions.push(`Archive ${expiredRecords} expired records`);
          }
          if (policy.deleteAfterArchive) {
            recommendedActions.push(`Delete ${expiredRecords} expired records after archival`);
          }
        }
        
        if (retentionCompliance < 95) {
          recommendedActions.push('Review retention policy compliance');
        }

        reports.push({
          dataType: type,
          totalRecords,
          activeRecords,
          archivedRecords,
          expiredRecords,
          retentionCompliance,
          recommendedActions,
        });
      }

      return reports;
    } catch (error) {
      logger.error('Failed to generate retention report', { dataType, error });
      throw error;
    }
  }

  async getCleanupMetrics(): Promise<CleanupMetrics> {
    return { ...this.cleanupMetrics };
  }

  async updateCleanupPolicy(dataType: string, policy: Partial<CleanupPolicy>): Promise<void> {
    try {
      const existingPolicy = this.cleanupPolicies.get(dataType);
      if (!existingPolicy) {
        throw new Error(`No cleanup policy found for data type: ${dataType}`);
      }

      const updatedPolicy = { ...existingPolicy, ...policy };
      this.cleanupPolicies.set(dataType, updatedPolicy);

      await this.savePolicies();

      logger.info('Cleanup policy updated', { dataType, policy });
    } catch (error) {
      logger.error('Failed to update cleanup policy', { dataType, policy, error });
      throw error;
    }
  }

  async getActiveJobs(): Promise<CleanupJob[]> {
    return Array.from(this.cleanupJobs.values())
      .filter(job => job.status === 'running' || job.status === 'pending');
  }

  async getJobStatus(jobId: string): Promise<CleanupJob | null> {
    return this.cleanupJobs.get(jobId) || null;
  }

  // Private helper methods

  private async processDataType(dataType: string, policy: CleanupPolicy): Promise<CleanupJob> {
    const job: CleanupJob = {
      id: this.generateJobId(),
      type: policy.archiveEnabled ? 'archive' : 'delete',
      status: 'pending',
      dataType,
      startTime: Date.now(),
      recordsProcessed: 0,
      recordsAffected: 0,
      errors: [],
      metadata: {
        policy: { ...policy },
      },
    };

    this.cleanupJobs.set(job.id, job);

    try {
      job.status = 'running';
      
      const retentionPeriod = policy.retentionPeriodDays * 24 * 60 * 60 * 1000;
      const expirationTime = Date.now() - retentionPeriod;

      // Get expired records
      const expiredRecords = await this.getExpiredRecords(dataType, expirationTime);
      job.recordsProcessed = expiredRecords.length;

      // Process each record
      for (const record of expiredRecords) {
        try {
          if (policy.archiveEnabled) {
            await this.archiveSession(
              record.sessionId, 
              policy.anonymizeBeforeArchive
            );
          }

          if (policy.deleteAfterArchive || !policy.archiveEnabled) {
            await this.deleteSession(
              record.sessionId, 
              'Cleanup policy enforcement'
            );
          }

          job.recordsAffected++;
        } catch (error) {
          job.errors.push(`Failed to process record ${record.sessionId}: ${error.message}`);
          logger.error('Failed to process record during cleanup', { 
            recordId: record.sessionId, 
            dataType, 
            error 
          });
        }
      }

      job.status = 'completed';
      job.endTime = Date.now();

      logger.info('Cleanup job completed', {
        jobId: job.id,
        dataType,
        recordsProcessed: job.recordsProcessed,
        recordsAffected: job.recordsAffected,
        errors: job.errors.length,
      });

    } catch (error) {
      job.status = 'failed';
      job.endTime = Date.now();
      job.errors.push(`Job failed: ${error.message}`);
      
      logger.error('Cleanup job failed', { jobId: job.id, dataType, error });
    }

    this.cleanupJobs.set(job.id, job);
    return job;
  }

  private async getExpiredRecords(
    dataType: string, 
    expirationTime: number
  ): Promise<{ sessionId: string; timestamp: number }[]> {
    switch (dataType) {
      case 'session_context': {
        const sessions = await this.prismaClient.userSession.findMany({
          where: {
            createdAt: {
              lt: new Date(expirationTime),
            },
          },
          select: {
            id: true,
            createdAt: true,
          },
        });
        return sessions.map(s => ({
          sessionId: s.id,
          timestamp: s.createdAt.getTime(),
        }));
      }

      case 'recovery_snapshots': {
        // Get expired snapshots from Redis
        const keys = await this.redisClient.keys('recovery:*');
        const expired: { sessionId: string; timestamp: number }[] = [];
        
        for (const key of keys) {
          const data = await this.redisClient.get(key);
          if (data) {
            try {
              const snapshot = JSON.parse(data);
              if (snapshot.timestamp < expirationTime) {
                expired.push({
                  sessionId: snapshot.sessionId,
                  timestamp: snapshot.timestamp,
                });
              }
            } catch (parseError) {
              // Ignore invalid snapshots
            }
          }
        }
        
        return expired;
      }

      default:
        return [];
    }
  }

  private async createArchiveRecord(
    originalId: string,
    dataType: string,
    data: any,
    timestamp: number,
    anonymized: boolean
  ): Promise<ArchiveRecord> {
    const policy = this.cleanupPolicies.get(dataType);
    const retentionExpiry = timestamp + (policy?.retentionPeriodDays || 365) * 24 * 60 * 60 * 1000;

    let processedData = data;
    let compressed = false;

    // Compress data if enabled
    if (policy?.compressionEnabled) {
      processedData = this.compressData(data);
      compressed = true;
    }

    const archiveRecord: ArchiveRecord = {
      id: this.generateArchiveId(),
      originalId,
      dataType,
      data: processedData,
      archivedAt: timestamp,
      originalTimestamp: data.timestamp || data.createdAt || timestamp,
      anonymized,
      compressed,
      retentionExpiry,
    };

    // Store archive record
    await this.storeArchiveRecord(archiveRecord);

    return archiveRecord;
  }

  private compressData(data: any): string {
    // Simple compression - in production, use proper compression libraries
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString).toString('base64');
  }

  private decompressData(compressedData: string): any {
    const jsonString = Buffer.from(compressedData, 'base64').toString('utf8');
    return JSON.parse(jsonString);
  }

  private anonymizeText(text: string): string {
    // Use session security service for anonymization
    return text.replace(/[\w.-]+@[\w.-]+\.\w+/gi, '[EMAIL_ANONYMIZED]')
               .replace(/\+?1[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/gi, '[PHONE_ANONYMIZED]')
               .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/gi, '[NAME_ANONYMIZED]');
  }

  private anonymizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.anonymizeText(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.anonymizeObject(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.anonymizeObject(value);
      }
      return result;
    }
    
    return obj;
  }

  private async getSessionData(sessionId: string): Promise<any> {
    try {
      const sessionData = await this.redisClient.get(`session:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error('Failed to get session data for archival', { sessionId, error });
      return null;
    }
  }

  private async getPerformanceData(sessionId: string): Promise<any> {
    try {
      const performanceData = await this.redisClient.get(`analytics:${sessionId}`);
      return performanceData ? JSON.parse(performanceData) : null;
    } catch (error) {
      logger.error('Failed to get performance data for archival', { sessionId, error });
      return null;
    }
  }

  private async storeArchiveRecord(record: ArchiveRecord): Promise<void> {
    const key = `archive:${record.dataType}:${record.id}`;
    await this.redisClient.setex(
      key,
      Math.floor((record.retentionExpiry - Date.now()) / 1000),
      JSON.stringify(record)
    );
  }

  private async getArchivedRecordsCount(dataType: string): Promise<number> {
    const keys = await this.redisClient.keys(`archive:${dataType}:*`);
    return keys.length;
  }

  private generateJobId(): string {
    return `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateArchiveId(): string {
    return `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadMetrics(): Promise<void> {
    try {
      const metricsData = await this.redisClient.get('cleanup_metrics');
      if (metricsData) {
        this.cleanupMetrics = { ...this.cleanupMetrics, ...JSON.parse(metricsData) };
      }
    } catch (error) {
      logger.error('Failed to load cleanup metrics', { error });
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await this.redisClient.setex(
        'cleanup_metrics',
        24 * 3600, // 24 hours
        JSON.stringify(this.cleanupMetrics)
      );
    } catch (error) {
      logger.error('Failed to save cleanup metrics', { error });
    }
  }

  private async savePolicies(): Promise<void> {
    try {
      const policiesArray = Array.from(this.cleanupPolicies.entries());
      await this.redisClient.setex(
        'cleanup_policies',
        30 * 24 * 3600, // 30 days
        JSON.stringify(policiesArray)
      );
    } catch (error) {
      logger.error('Failed to save cleanup policies', { error });
    }
  }

  private async resumePendingJobs(): Promise<void> {
    // In a production system, this would restore pending jobs from persistent storage
    logger.info('Checking for pending cleanup jobs');
  }

  private setupScheduledCleanup(): void {
    // Run cleanup daily at 2 AM
    const scheduleCleanup = () => {
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setHours(2, 0, 0, 0);
      
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      const timeUntilRun = nextRun.getTime() - now.getTime();
      
      setTimeout(() => {
        this.runCleanup().catch(error => {
          logger.error('Scheduled cleanup failed', { error });
        });
        
        // Schedule next cleanup
        scheduleCleanup();
      }, timeUntilRun);
    };

    scheduleCleanup();
    logger.info('Scheduled cleanup configured for daily execution at 2 AM');
  }

  async cleanup(): Promise<void> {
    try {
      this.isRunning = false;
      this.cleanupJobs.clear();
      await this.redisClient.quit();
      await this.prismaClient.$disconnect();
      
      logger.info('Session cleanup service cleaned up successfully');
    } catch (error) {
      logger.error('Failed to cleanup session cleanup service', { error });
    }
  }
}

export const sessionCleanup = new SessionCleanup();
export default sessionCleanup;