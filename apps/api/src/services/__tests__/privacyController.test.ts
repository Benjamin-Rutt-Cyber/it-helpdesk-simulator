import { PrivacyController, PrivacySettings, ConsentRecord, DataSharingRequest } from '../privacyController';

describe('PrivacyController', () => {
  let privacyController: PrivacyController;
  
  const mockUserId = 'user123';
  const defaultPrivacySettings: PrivacySettings = {
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
      archiveAfter: 365
    },
    consentManagement: {
      explicitConsent: true,
      granularConsent: true,
      consentHistory: []
    }
  };

  beforeEach(() => {
    privacyController = new PrivacyController();
  });

  describe('initializeUserPrivacy', () => {
    it('should initialize user privacy settings with defaults', async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);

      const settings = await privacyController.getUserPrivacySettings(mockUserId);
      expect(settings).toEqual(expect.objectContaining({
        profileVisibility: 'private',
        performanceSharing: expect.objectContaining({
          scores: false,
          rankings: false
        }),
        consentManagement: expect.objectContaining({
          explicitConsent: true,
          granularConsent: true
        })
      }));
    });

    it('should create consent history entry on initialization', async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);

      const settings = await privacyController.getUserPrivacySettings(mockUserId);
      expect(settings.consentManagement.consentHistory).toHaveLength(1);
      expect(settings.consentManagement.consentHistory[0]).toEqual(expect.objectContaining({
        type: 'data_sharing',
        granted: true,
        purpose: 'Account creation and service provision'
      }));
    });

    it('should handle custom retention period', async () => {
      const customSettings = {
        ...defaultPrivacySettings,
        dataRetention: {
          automaticDeletion: true,
          retentionPeriod: 730, // 2 years
          archiveAfter: 365
        }
      };

      await privacyController.initializeUserPrivacy(mockUserId, customSettings);

      const settings = await privacyController.getUserPrivacySettings(mockUserId);
      expect(settings.dataRetention.retentionPeriod).toBe(730);
      expect(settings.dataRetention.automaticDeletion).toBe(true);
    });
  });

  describe('updatePrivacySettings', () => {
    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);
    });

    it('should update privacy settings successfully', async () => {
      const updates = {
        profileVisibility: 'public' as const,
        performanceSharing: {
          scores: true,
          rankings: true,
          comparisons: false,
          history: true
        }
      };

      const updatedSettings = await privacyController.updatePrivacySettings(mockUserId, updates);

      expect(updatedSettings.profileVisibility).toBe('public');
      expect(updatedSettings.performanceSharing.scores).toBe(true);
      expect(updatedSettings.performanceSharing.rankings).toBe(true);
      expect(updatedSettings.performanceSharing.comparisons).toBe(false);
    });

    it('should create consent record when enabling data sharing', async () => {
      const updates = {
        employerAccess: {
          fullProfile: true,
          performanceData: true,
          skillEvidence: true,
          recommendations: true
        }
      };

      await privacyController.updatePrivacySettings(mockUserId, updates);

      const settings = await privacyController.getUserPrivacySettings(mockUserId);
      const consentRecords = settings.consentManagement.consentHistory;
      
      expect(consentRecords.length).toBeGreaterThan(1);
      const latestConsent = consentRecords[consentRecords.length - 1];
      expect(latestConsent.type).toBe('employer_access');
      expect(latestConsent.granted).toBe(true);
    });

    it('should create revocation record when disabling data sharing', async () => {
      // First enable sharing
      await privacyController.updatePrivacySettings(mockUserId, {
        performanceSharing: { scores: true, rankings: true, comparisons: true, history: true }
      });

      // Then disable it
      await privacyController.updatePrivacySettings(mockUserId, {
        performanceSharing: { scores: false, rankings: false, comparisons: false, history: false }
      });

      const settings = await privacyController.getUserPrivacySettings(mockUserId);
      const consentRecords = settings.consentManagement.consentHistory;
      
      const revocationRecord = consentRecords.find(record => 
        record.granted === false && record.revokedAt
      );
      expect(revocationRecord).toBeDefined();
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        contactInformation: {
          email: true
        }
      };

      const updatedSettings = await privacyController.updatePrivacySettings(mockUserId, partialUpdate);

      expect(updatedSettings.contactInformation.email).toBe(true);
      expect(updatedSettings.contactInformation.phone).toBe(false); // Should remain unchanged
      expect(updatedSettings.profileVisibility).toBe('private'); // Should remain unchanged
    });

    it('should validate privacy settings before updating', async () => {
      const invalidUpdate = {
        dataRetention: {
          retentionPeriod: -30 // Invalid negative value
        }
      };

      await expect(privacyController.updatePrivacySettings(mockUserId, invalidUpdate as any))
        .rejects.toThrow('Invalid retention period');
    });
  });

  describe('checkExportPermissions', () => {
    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);
    });

    it('should allow personal export regardless of settings', async () => {
      const hasPermission = await privacyController.checkExportPermissions(mockUserId, 'personal');
      expect(hasPermission).toBe(true);
    });

    it('should deny employer export when employer access is disabled', async () => {
      const hasPermission = await privacyController.checkExportPermissions(mockUserId, 'employer');
      expect(hasPermission).toBe(false);
    });

    it('should allow employer export when employer access is enabled', async () => {
      await privacyController.updatePrivacySettings(mockUserId, {
        employerAccess: {
          fullProfile: true,
          performanceData: true,
          skillEvidence: true,
          recommendations: true
        }
      });

      const hasPermission = await privacyController.checkExportPermissions(mockUserId, 'employer');
      expect(hasPermission).toBe(true);
    });

    it('should handle certification body export permissions', async () => {
      await privacyController.updatePrivacySettings(mockUserId, {
        profileVisibility: 'limited'
      });

      const hasPermission = await privacyController.checkExportPermissions(mockUserId, 'certification');
      expect(hasPermission).toBe(true); // Limited visibility allows certification access
    });

    it('should handle academic export permissions', async () => {
      await privacyController.updatePrivacySettings(mockUserId, {
        profileVisibility: 'public'
      });

      const hasPermission = await privacyController.checkExportPermissions(mockUserId, 'academic');
      expect(hasPermission).toBe(true);
    });
  });

  describe('checkEmployerSharingPermissions', () => {
    const employerId = 'employer123';

    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);
    });

    it('should deny sharing when employer access is disabled', async () => {
      const hasPermission = await privacyController.checkEmployerSharingPermissions(mockUserId, employerId);
      expect(hasPermission).toBe(false);
    });

    it('should allow sharing when employer access is enabled', async () => {
      await privacyController.updatePrivacySettings(mockUserId, {
        employerAccess: {
          fullProfile: true,
          performanceData: true,
          skillEvidence: true,
          recommendations: true
        }
      });

      const hasPermission = await privacyController.checkEmployerSharingPermissions(mockUserId, employerId);
      expect(hasPermission).toBe(true);
    });

    it('should check specific employer permissions', async () => {
      // Grant specific employer permission
      await privacyController.grantEmployerAccess(mockUserId, employerId, {
        fullProfile: true,
        performanceData: false,
        skillEvidence: true,
        recommendations: false
      });

      const hasPermission = await privacyController.checkEmployerSharingPermissions(mockUserId, employerId);
      expect(hasPermission).toBe(true);
    });

    it('should deny sharing for non-authorized employers', async () => {
      // Grant access to one employer
      await privacyController.grantEmployerAccess(mockUserId, 'employer456', {
        fullProfile: true,
        performanceData: true,
        skillEvidence: true,
        recommendations: true
      });

      // Check access for different employer
      const hasPermission = await privacyController.checkEmployerSharingPermissions(mockUserId, employerId);
      expect(hasPermission).toBe(false);
    });
  });

  describe('requestDataSharing', () => {
    const requesterId = 'requester123';
    const requesterName = 'TechCorp Inc.';

    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);
    });

    it('should create data sharing request', async () => {
      const requestData = {
        requesterType: 'employer' as const,
        requesterName,
        dataTypes: ['performance_data', 'skill_evidence'],
        purpose: 'Job application review',
        accessDuration: 30
      };

      const request = await privacyController.requestDataSharing(
        mockUserId,
        requesterId,
        requestData
      );

      expect(request).toEqual(expect.objectContaining({
        id: expect.any(String),
        requesterId,
        requesterType: 'employer',
        requesterName,
        dataTypes: ['performance_data', 'skill_evidence'],
        purpose: 'Job application review',
        status: 'pending'
      }));
      expect(request.requestedAt).toBeInstanceOf(Date);
    });

    it('should handle duplicate requests', async () => {
      const requestData = {
        requesterType: 'employer' as const,
        requesterName,
        dataTypes: ['performance_data'],
        purpose: 'Initial review',
        accessDuration: 30
      };

      await privacyController.requestDataSharing(mockUserId, requesterId, requestData);

      // Request again with same data
      await expect(privacyController.requestDataSharing(mockUserId, requesterId, requestData))
        .rejects.toThrow('Duplicate request from same requester');
    });

    it('should validate request data', async () => {
      const invalidRequestData = {
        requesterType: 'invalid' as any,
        requesterName: '',
        dataTypes: [],
        purpose: '',
        accessDuration: -1
      };

      await expect(privacyController.requestDataSharing(mockUserId, requesterId, invalidRequestData))
        .rejects.toThrow('Invalid sharing request data');
    });
  });

  describe('respondToDataSharingRequest', () => {
    let requestId: string;

    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);

      const request = await privacyController.requestDataSharing(
        mockUserId,
        'requester123',
        {
          requesterType: 'employer',
          requesterName: 'TechCorp',
          dataTypes: ['performance_data'],
          purpose: 'Job review',
          accessDuration: 30
        }
      );
      requestId = request.id;
    });

    it('should approve data sharing request', async () => {
      const response = await privacyController.respondToDataSharingRequest(
        requestId,
        true,
        'Approved for job application review'
      );

      expect(response.status).toBe('approved');
      expect(response.userResponse).toBe('Approved for job application review');
      expect(response.respondedAt).toBeInstanceOf(Date);
    });

    it('should reject data sharing request', async () => {
      const response = await privacyController.respondToDataSharingRequest(
        requestId,
        false,
        'Not comfortable sharing this information'
      );

      expect(response.status).toBe('rejected');
      expect(response.userResponse).toBe('Not comfortable sharing this information');
    });

    it('should create consent record when approving', async () => {
      await privacyController.respondToDataSharingRequest(requestId, true, 'Approved');

      const settings = await privacyController.getUserPrivacySettings(mockUserId);
      const consentRecords = settings.consentManagement.consentHistory;
      
      const sharingConsent = consentRecords.find(record => 
        record.type === 'data_sharing' && record.granted === true
      );
      expect(sharingConsent).toBeDefined();
      expect(sharingConsent?.recipient).toBe('requester123');
    });

    it('should handle non-existent request', async () => {
      await expect(privacyController.respondToDataSharingRequest(
        'nonexistent',
        true,
        'Approved'
      )).rejects.toThrow('Data sharing request not found');
    });

    it('should prevent duplicate responses', async () => {
      await privacyController.respondToDataSharingRequest(requestId, true, 'Approved');

      await expect(privacyController.respondToDataSharingRequest(
        requestId,
        false,
        'Changed mind'
      )).rejects.toThrow('Request already responded to');
    });
  });

  describe('grantEmployerAccess', () => {
    const employerId = 'employer123';

    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);
    });

    it('should grant specific employer access', async () => {
      const accessLevel = {
        fullProfile: true,
        performanceData: true,
        skillEvidence: false,
        recommendations: true
      };

      await privacyController.grantEmployerAccess(mockUserId, employerId, accessLevel);

      const hasAccess = await privacyController.checkEmployerSharingPermissions(mockUserId, employerId);
      expect(hasAccess).toBe(true);
    });

    it('should create consent record for employer access', async () => {
      const accessLevel = {
        fullProfile: true,
        performanceData: true,
        skillEvidence: true,
        recommendations: true
      };

      await privacyController.grantEmployerAccess(mockUserId, employerId, accessLevel);

      const settings = await privacyController.getUserPrivacySettings(mockUserId);
      const consentRecords = settings.consentManagement.consentHistory;
      
      const employerConsent = consentRecords.find(record => 
        record.type === 'employer_access' && record.recipient === employerId
      );
      expect(employerConsent).toBeDefined();
      expect(employerConsent?.granted).toBe(true);
    });

    it('should handle time-limited access', async () => {
      const accessLevel = {
        fullProfile: true,
        performanceData: true,
        skillEvidence: true,
        recommendations: true
      };

      await privacyController.grantEmployerAccess(
        mockUserId, 
        employerId, 
        accessLevel, 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      );

      const hasAccess = await privacyController.checkEmployerSharingPermissions(mockUserId, employerId);
      expect(hasAccess).toBe(true);
    });
  });

  describe('revokeEmployerAccess', () => {
    const employerId = 'employer123';

    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);
      
      await privacyController.grantEmployerAccess(mockUserId, employerId, {
        fullProfile: true,
        performanceData: true,
        skillEvidence: true,
        recommendations: true
      });
    });

    it('should revoke employer access', async () => {
      await privacyController.revokeEmployerAccess(mockUserId, employerId);

      const hasAccess = await privacyController.checkEmployerSharingPermissions(mockUserId, employerId);
      expect(hasAccess).toBe(false);
    });

    it('should create revocation record', async () => {
      await privacyController.revokeEmployerAccess(mockUserId, employerId);

      const settings = await privacyController.getUserPrivacySettings(mockUserId);
      const consentRecords = settings.consentManagement.consentHistory;
      
      const revocationRecord = consentRecords.find(record => 
        record.type === 'employer_access' && 
        record.recipient === employerId && 
        record.granted === false
      );
      expect(revocationRecord).toBeDefined();
      expect(revocationRecord?.revokedAt).toBeInstanceOf(Date);
    });

    it('should handle revoking non-existent access', async () => {
      await expect(privacyController.revokeEmployerAccess(mockUserId, 'nonexistent_employer'))
        .rejects.toThrow('No active access found for this employer');
    });
  });

  describe('getDataAccessLog', () => {
    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);

      // Create some access log entries
      await privacyController.logDataAccess(mockUserId, {
        action: 'export',
        format: 'pdf',
        recipient: 'employer123',
        timestamp: new Date()
      });

      await privacyController.logDataAccess(mockUserId, {
        action: 'share_employer',
        recipient: 'employer456',
        timestamp: new Date()
      });
    });

    it('should return data access log', async () => {
      const log = await privacyController.getDataAccessLog(mockUserId);

      expect(log).toHaveLength(2);
      expect(log[0]).toEqual(expect.objectContaining({
        action: expect.any(String),
        timestamp: expect.any(Date)
      }));
    });

    it('should filter log by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const log = await privacyController.getDataAccessLog(mockUserId, {
        startDate: yesterday,
        endDate: tomorrow
      });

      expect(log.length).toBeGreaterThan(0);
      log.forEach(entry => {
        expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(entry.timestamp.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      });
    });

    it('should filter log by action type', async () => {
      const log = await privacyController.getDataAccessLog(mockUserId, {
        actionType: 'export'
      });

      expect(log.length).toBe(1);
      expect(log[0].action).toBe('export');
    });

    it('should limit results', async () => {
      const log = await privacyController.getDataAccessLog(mockUserId, {
        limit: 1
      });

      expect(log).toHaveLength(1);
    });
  });

  describe('getUserPrivacySettings', () => {
    it('should return user privacy settings', async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);

      const settings = await privacyController.getUserPrivacySettings(mockUserId);

      expect(settings).toEqual(expect.objectContaining({
        profileVisibility: 'private',
        performanceSharing: expect.any(Object),
        contactInformation: expect.any(Object),
        employerAccess: expect.any(Object),
        dataRetention: expect.any(Object),
        consentManagement: expect.any(Object)
      }));
    });

    it('should handle non-existent user', async () => {
      await expect(privacyController.getUserPrivacySettings('nonexistent'))
        .rejects.toThrow('User privacy settings not found');
    });
  });

  describe('exportUserData', () => {
    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);
      
      await privacyController.logDataAccess(mockUserId, {
        action: 'export',
        format: 'pdf',
        recipient: 'employer123',
        timestamp: new Date()
      });
    });

    it('should export all user privacy data', async () => {
      const exportData = await privacyController.exportUserData(mockUserId);

      expect(exportData).toEqual(expect.objectContaining({
        userId: mockUserId,
        privacySettings: expect.any(Object),
        consentHistory: expect.any(Array),
        dataAccessLog: expect.any(Array),
        sharingRequests: expect.any(Array),
        employerAccess: expect.any(Array),
        exportedAt: expect.any(Date)
      }));
    });

    it('should include all consent records', async () => {
      const exportData = await privacyController.exportUserData(mockUserId);

      expect(exportData.consentHistory.length).toBeGreaterThan(0);
      expect(exportData.consentHistory[0]).toEqual(expect.objectContaining({
        type: expect.any(String),
        granted: expect.any(Boolean),
        grantedAt: expect.any(Date)
      }));
    });
  });

  describe('deleteUserData', () => {
    beforeEach(async () => {
      await privacyController.initializeUserPrivacy(mockUserId, defaultPrivacySettings);
    });

    it('should delete all user privacy data', async () => {
      await privacyController.deleteUserData(mockUserId);

      await expect(privacyController.getUserPrivacySettings(mockUserId))
        .rejects.toThrow('User privacy settings not found');
    });

    it('should handle deletion of non-existent user', async () => {
      await expect(privacyController.deleteUserData('nonexistent'))
        .rejects.toThrow('User not found');
    });
  });
});