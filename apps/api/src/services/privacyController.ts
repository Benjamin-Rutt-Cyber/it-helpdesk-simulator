import { ProfessionalPortfolio, PerformanceHistory } from './portfolioBuilder';

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'limited';
  performanceSharing: {
    scores: boolean;
    rankings: boolean;
    comparisons: boolean;
    history: boolean;
  };
  contactInformation: {
    email: boolean;
    phone: boolean;
    address: boolean;
  };
  employerAccess: {
    fullProfile: boolean;
    performanceData: boolean;
    skillEvidence: boolean;
    recommendations: boolean;
  };
  dataRetention: {
    automaticDeletion: boolean;
    retentionPeriod: number; // in days
    archiveAfter: number; // in days
  };
  consentManagement: {
    explicitConsent: boolean;
    granularConsent: boolean;
    consentHistory: ConsentRecord[];
  };
}

export interface ConsentRecord {
  id: string;
  type: 'data_sharing' | 'employer_access' | 'export' | 'analytics';
  description: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  scope: string[];
  recipient?: string;
  purpose: string;
}

export interface DataSharingRequest {
  id: string;
  requesterId: string;
  requesterType: 'employer' | 'certification_body' | 'academic' | 'partner';
  requesterName: string;
  dataRequested: string[];
  purpose: string;
  duration: number; // in days
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt?: Date;
}

export interface PrivacyAuditLog {
  id: string;
  userId: string;
  action: 'access' | 'share' | 'export' | 'update' | 'delete';
  dataType: string;
  recipient?: string;
  purpose?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'denied' | 'error';
  reason?: string;
}

export interface AnonymizationOptions {
  removePersonalIdentifiers: boolean;
  hashSensitiveData: boolean;
  generalizeLocationData: boolean;
  removeTimestamps: boolean;
  aggregateMetrics: boolean;
  replacementStrategy: 'random' | 'generic' | 'statistical';
}

export interface DataMinimizationProfile {
  purpose: string;
  dataTypes: string[];
  minimumDataRequired: string[];
  optionalData: string[];
  retentionPeriod: number;
  accessLevel: 'full' | 'summary' | 'anonymous';
}

export class PrivacyController {
  private privacySettings: Map<string, PrivacySettings> = new Map();
  private auditLogs: PrivacyAuditLog[] = [];
  private sharingRequests: Map<string, DataSharingRequest[]> = new Map();
  private consentRecords: Map<string, ConsentRecord[]> = new Map();

  constructor() {
    this.initializeDefaultSettings();
  }

  async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    const currentSettings = this.getPrivacySettings(userId);
    const updatedSettings = { ...currentSettings, ...settings };
    
    this.privacySettings.set(userId, updatedSettings);
    
    await this.logPrivacyAction(userId, 'update', 'privacy_settings', {
      action: 'update',
      dataType: 'privacy_settings',
      result: 'success'
    });

    return updatedSettings;
  }

  getPrivacySettings(userId: string): PrivacySettings {
    return this.privacySettings.get(userId) || this.getDefaultPrivacySettings();
  }

  async applyPrivacyFilters(
    userId: string,
    data: ProfessionalPortfolio | PerformanceHistory,
    recipient: string,
    purpose: string
  ): Promise<any> {
    const settings = this.getPrivacySettings(userId);
    const hasConsent = await this.checkConsent(userId, recipient, purpose);

    if (!hasConsent) {
      await this.logPrivacyAction(userId, 'access', 'portfolio_data', {
        action: 'access',
        dataType: 'portfolio_data',
        recipient,
        purpose,
        result: 'denied',
        reason: 'No valid consent'
      });
      throw new Error('Access denied: No valid consent for data sharing');
    }

    let filteredData = { ...data };

    if (!settings.contactInformation.email) {
      filteredData = this.removeContactInfo(filteredData, 'email');
    }

    if (!settings.contactInformation.phone) {
      filteredData = this.removeContactInfo(filteredData, 'phone');
    }

    if (!settings.contactInformation.address) {
      filteredData = this.removeContactInfo(filteredData, 'address');
    }

    if (!settings.performanceSharing.scores) {
      filteredData = this.removePerformanceData(filteredData, 'scores');
    }

    if (!settings.performanceSharing.rankings) {
      filteredData = this.removePerformanceData(filteredData, 'rankings');
    }

    if (!settings.performanceSharing.comparisons) {
      filteredData = this.removePerformanceData(filteredData, 'comparisons');
    }

    if (!settings.performanceSharing.history) {
      filteredData = this.removePerformanceData(filteredData, 'history');
    }

    await this.logPrivacyAction(userId, 'access', 'portfolio_data', {
      action: 'access',
      dataType: 'portfolio_data',
      recipient,
      purpose,
      result: 'success'
    });

    return filteredData;
  }

  async anonymizeData(
    userId: string,
    data: any,
    options: AnonymizationOptions
  ): Promise<any> {
    let anonymized = { ...data };

    if (options.removePersonalIdentifiers) {
      anonymized = this.removePersonalIdentifiers(anonymized);
    }

    if (options.hashSensitiveData) {
      anonymized = this.hashSensitiveData(anonymized);
    }

    if (options.generalizeLocationData) {
      anonymized = this.generalizeLocationData(anonymized);
    }

    if (options.removeTimestamps) {
      anonymized = this.removeTimestamps(anonymized);
    }

    if (options.aggregateMetrics) {
      anonymized = this.aggregateMetrics(anonymized);
    }

    await this.logPrivacyAction(userId, 'access', 'anonymized_data', {
      action: 'access',
      dataType: 'anonymized_data',
      result: 'success'
    });

    return anonymized;
  }

  async requestDataSharing(
    userId: string,
    request: Omit<DataSharingRequest, 'id' | 'status' | 'requestedAt'>
  ): Promise<DataSharingRequest> {
    const sharingRequest: DataSharingRequest = {
      ...request,
      id: this.generateRequestId(),
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + request.duration * 24 * 60 * 60 * 1000)
    };

    const userRequests = this.sharingRequests.get(userId) || [];
    userRequests.push(sharingRequest);
    this.sharingRequests.set(userId, userRequests);

    await this.logPrivacyAction(userId, 'share', 'data_sharing_request', {
      action: 'share',
      dataType: 'data_sharing_request',
      recipient: request.requesterName,
      purpose: request.purpose,
      result: 'success'
    });

    return sharingRequest;
  }

  async respondToDataSharingRequest(
    userId: string,
    requestId: string,
    approved: boolean,
    consent?: ConsentRecord
  ): Promise<DataSharingRequest> {
    const userRequests = this.sharingRequests.get(userId) || [];
    const request = userRequests.find(r => r.id === requestId);

    if (!request) {
      throw new Error('Data sharing request not found');
    }

    request.status = approved ? 'approved' : 'denied';
    request.respondedAt = new Date();

    if (approved && consent) {
      await this.grantConsent(userId, consent);
    }

    await this.logPrivacyAction(userId, 'share', 'data_sharing_response', {
      action: 'share',
      dataType: 'data_sharing_response',
      recipient: request.requesterName,
      purpose: request.purpose,
      result: approved ? 'success' : 'denied'
    });

    return request;
  }

  async grantConsent(userId: string, consent: ConsentRecord): Promise<ConsentRecord> {
    const userConsents = this.consentRecords.get(userId) || [];
    
    consent.grantedAt = new Date();
    consent.granted = true;
    
    userConsents.push(consent);
    this.consentRecords.set(userId, userConsents);

    await this.logPrivacyAction(userId, 'update', 'consent_record', {
      action: 'update',
      dataType: 'consent_record',
      recipient: consent.recipient,
      purpose: consent.purpose,
      result: 'success'
    });

    return consent;
  }

  async revokeConsent(userId: string, consentId: string): Promise<ConsentRecord> {
    const userConsents = this.consentRecords.get(userId) || [];
    const consent = userConsents.find(c => c.id === consentId);

    if (!consent) {
      throw new Error('Consent record not found');
    }

    consent.granted = false;
    consent.revokedAt = new Date();

    await this.logPrivacyAction(userId, 'update', 'consent_revocation', {
      action: 'update',
      dataType: 'consent_revocation',
      recipient: consent.recipient,
      purpose: consent.purpose,
      result: 'success'
    });

    return consent;
  }

  async checkConsent(
    userId: string,
    recipient: string,
    purpose: string
  ): Promise<boolean> {
    const userConsents = this.consentRecords.get(userId) || [];
    
    const validConsent = userConsents.find(c => 
      c.granted && 
      !c.revokedAt &&
      (c.recipient === recipient || c.recipient === '*') &&
      c.scope.includes(purpose)
    );

    return !!validConsent;
  }

  async getDataSharingRequests(userId: string): Promise<DataSharingRequest[]> {
    return this.sharingRequests.get(userId) || [];
  }

  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    return this.consentRecords.get(userId) || [];
  }

  async getPrivacyAuditLog(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<PrivacyAuditLog[]> {
    const userLogs = this.auditLogs.filter(log => log.userId === userId);
    
    if (limit || offset) {
      const start = offset || 0;
      const end = limit ? start + limit : undefined;
      return userLogs.slice(start, end);
    }

    return userLogs;
  }

  async applyDataMinimization(
    data: any,
    profile: DataMinimizationProfile
  ): Promise<any> {
    const minimized: any = {};

    for (const requiredField of profile.minimumDataRequired) {
      if (data[requiredField] !== undefined) {
        minimized[requiredField] = data[requiredField];
      }
    }

    if (profile.accessLevel === 'full') {
      for (const optionalField of profile.optionalData) {
        if (data[optionalField] !== undefined) {
          minimized[optionalField] = data[optionalField];
        }
      }
    } else if (profile.accessLevel === 'summary') {
      minimized.summary = this.generateDataSummary(data, profile.optionalData);
    }

    return minimized;
  }

  private async logPrivacyAction(
    userId: string,
    action: PrivacyAuditLog['action'],
    dataType: string,
    details: Partial<PrivacyAuditLog>
  ): Promise<void> {
    const logEntry: PrivacyAuditLog = {
      id: this.generateLogId(),
      userId,
      action,
      dataType,
      timestamp: new Date(),
      result: 'success',
      ...details
    };

    this.auditLogs.push(logEntry);
  }

  private removeContactInfo(data: any, type: 'email' | 'phone' | 'address'): any {
    if (data.header && data.header.contact) {
      const updatedData = { ...data };
      updatedData.header = { ...data.header };
      updatedData.header.contact = { ...data.header.contact };
      
      switch (type) {
        case 'email':
          updatedData.header.contact.email = '[REDACTED]';
          break;
        case 'phone':
          updatedData.header.contact.phone = '[REDACTED]';
          break;
        case 'address':
          updatedData.header.contact.address = '[REDACTED]';
          break;
      }
      
      return updatedData;
    }
    return data;
  }

  private removePerformanceData(data: any, type: string): any {
    const updatedData = { ...data };
    
    if (type === 'scores' && updatedData.performanceMetrics) {
      delete updatedData.performanceMetrics.scores;
    }
    
    if (type === 'rankings' && updatedData.performanceMetrics) {
      delete updatedData.performanceMetrics.rankings;
    }
    
    if (type === 'comparisons' && updatedData.performanceMetrics) {
      delete updatedData.performanceMetrics.comparisons;
    }
    
    if (type === 'history' && updatedData.scenarios) {
      delete updatedData.scenarios;
    }
    
    return updatedData;
  }

  private removePersonalIdentifiers(data: any): any {
    const anonymized = { ...data };
    
    if (anonymized.header) {
      anonymized.header = {
        ...anonymized.header,
        name: 'Anonymous Professional',
        contact: {
          email: 'anonymous@example.com',
          phone: '+1-XXX-XXX-XXXX',
          address: 'Location Withheld'
        }
      };
    }
    
    return anonymized;
  }

  private hashSensitiveData(data: any): any {
    return data;
  }

  private generalizeLocationData(data: any): any {
    return data;
  }

  private removeTimestamps(data: any): any {
    const removeTimestampsRecursive = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeTimestampsRecursive);
      } else if (obj && typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (!key.toLowerCase().includes('time') && 
              !key.toLowerCase().includes('date') &&
              !key.toLowerCase().includes('at')) {
            cleaned[key] = removeTimestampsRecursive(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    return removeTimestampsRecursive(data);
  }

  private aggregateMetrics(data: any): any {
    if (data.performanceMetrics) {
      const aggregated = { ...data };
      aggregated.performanceMetrics = {
        averageScore: data.performanceMetrics.averageScore || 0,
        totalScenarios: data.performanceMetrics.totalScenarios || 0,
        skillLevel: data.performanceMetrics.skillLevel || 'Not specified'
      };
      return aggregated;
    }
    return data;
  }

  private generateDataSummary(data: any, fields: string[]): any {
    const summary: any = {};
    
    for (const field of fields) {
      if (data[field] !== undefined) {
        if (Array.isArray(data[field])) {
          summary[`${field}_count`] = data[field].length;
        } else if (typeof data[field] === 'number') {
          summary[`${field}_value`] = data[field];
        } else {
          summary[`${field}_available`] = true;
        }
      }
    }
    
    return summary;
  }

  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      profileVisibility: 'private',
      performanceSharing: {
        scores: false,
        rankings: false,
        comparisons: false,
        history: false
      },
      contactInformation: {
        email: false,
        phone: false,
        address: false
      },
      employerAccess: {
        fullProfile: false,
        performanceData: false,
        skillEvidence: false,
        recommendations: false
      },
      dataRetention: {
        automaticDeletion: false,
        retentionPeriod: 365,
        archiveAfter: 180
      },
      consentManagement: {
        explicitConsent: true,
        granularConsent: true,
        consentHistory: []
      }
    };
  }

  private initializeDefaultSettings(): void {
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { PrivacyController };