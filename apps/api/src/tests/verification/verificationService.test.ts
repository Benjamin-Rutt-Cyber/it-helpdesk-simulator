import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { verificationService } from '../../services/verificationService';
import { aiCustomerService } from '../../services/aiCustomerService';

// Mock the AI customer service
jest.mock('../../services/aiCustomerService');

describe('VerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startVerificationProcess', () => {
    it('should initialize verification status for a new ticket', async () => {
      const ticketId = 'test-ticket-1';
      const userId = 'test-user-1';

      const result = await verificationService.startVerificationProcess(ticketId, userId);

      expect(result.ticketId).toBe(ticketId);
      expect(result.userId).toBe(userId);
      expect(result.customerName.status).toBe('pending');
      expect(result.username.status).toBe('pending');
      expect(result.assetTag.status).toBe('pending');
      expect(result.department.status).toBe('pending');
      expect(result.contactInfo.status).toBe('pending');
      expect(result.overallProgress).toBe(0);
    });

    it('should return existing verification status if already started', async () => {
      const ticketId = 'test-ticket-2';
      const userId = 'test-user-1';

      // Start verification twice
      const result1 = await verificationService.startVerificationProcess(ticketId, userId);
      const result2 = await verificationService.startVerificationProcess(ticketId, userId);

      expect(result1.ticketId).toBe(result2.ticketId);
      expect(result1.startedAt).toBe(result2.startedAt);
    });
  });

  describe('attemptVerification', () => {
    beforeEach(async () => {
      await verificationService.startVerificationProcess('test-ticket-3', 'test-user-1');
    });

    it('should successfully verify customer name', async () => {
      const mockResponse = {
        response: 'My name is John Smith',
        providedInformation: { customerName: 'John Smith' },
        cooperationLevel: 'high' as const,
        hesitation: false,
        questions: [],
        emotionalState: 'calm' as const,
        nextActions: [],
        scenarioTriggers: [],
      };

      (aiCustomerService.generateVerificationResponse as jest.Mock).mockResolvedValue(mockResponse);

      const result = await verificationService.attemptVerification(
        'test-ticket-3',
        'test-user-1',
        'customerName',
        'direct',
        { question: 'Can you please provide your full name?' },
        'office_worker'
      );

      expect(result.success).toBe(true);
      expect(result.fieldStatus).toBe('verified');
      expect(result.providedValue).toBe('John Smith');
      expect(result.customerResponse).toBe('My name is John Smith');
    });

    it('should handle failed verification attempt', async () => {
      const mockResponse = {
        response: 'I don\'t want to provide that information',
        providedInformation: {},
        cooperationLevel: 'low' as const,
        hesitation: true,
        questions: ['Why do you need this?'],
        emotionalState: 'frustrated' as const,
        nextActions: ['may_request_supervisor'],
        scenarioTriggers: ['low_cooperation'],
      };

      (aiCustomerService.generateVerificationResponse as jest.Mock).mockResolvedValue(mockResponse);

      const result = await verificationService.attemptVerification(
        'test-ticket-3',
        'test-user-1',
        'username',
        'direct',
        { question: 'What is your username?' },
        'frustrated_user'
      );

      expect(result.success).toBe(false);
      expect(result.fieldStatus).toBe('failed');
      expect(result.customerResponse).toBe('I don\'t want to provide that information');
      expect(result.nextActions).toContain('may_request_supervisor');
    });

    it('should handle multiple verification attempts', async () => {
      const mockResponse1 = {
        response: 'I\'m not sure about my asset tag',
        providedInformation: {},
        cooperationLevel: 'medium' as const,
        hesitation: true,
        questions: ['Where do I find this?'],
        emotionalState: 'confused' as const,
        nextActions: ['needs_guidance'],
        scenarioTriggers: [],
      };

      const mockResponse2 = {
        response: 'Oh, I found it! It\'s IT-LAP-1234',
        providedInformation: { assetTag: 'IT-LAP-1234' },
        cooperationLevel: 'high' as const,
        hesitation: false,
        questions: [],
        emotionalState: 'cooperative' as const,
        nextActions: ['continue_verification'],
        scenarioTriggers: [],
      };

      (aiCustomerService.generateVerificationResponse as jest.Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // First attempt fails
      const result1 = await verificationService.attemptVerification(
        'test-ticket-3',
        'test-user-1',
        'assetTag',
        'direct',
        { question: 'What is your asset tag?' },
        'new_employee'
      );

      expect(result1.success).toBe(false);
      expect(result1.fieldStatus).toBe('failed');

      // Second attempt succeeds
      const result2 = await verificationService.attemptVerification(
        'test-ticket-3',
        'test-user-1',
        'assetTag',
        'direct',
        { question: 'Please check the sticker on your device for the asset tag.' },
        'new_employee'
      );

      expect(result2.success).toBe(true);
      expect(result2.fieldStatus).toBe('verified');
      expect(result2.providedValue).toBe('IT-LAP-1234');
    });
  });

  describe('getVerificationStatus', () => {
    it('should return current verification status', async () => {
      const ticketId = 'test-ticket-4';
      const userId = 'test-user-1';

      await verificationService.startVerificationProcess(ticketId, userId);
      
      // Mock successful verification
      const mockResponse = {
        response: 'My name is Jane Doe',
        providedInformation: { customerName: 'Jane Doe' },
        cooperationLevel: 'high' as const,
        hesitation: false,
        questions: [],
        emotionalState: 'calm' as const,
        nextActions: [],
        scenarioTriggers: [],
      };

      (aiCustomerService.generateVerificationResponse as jest.Mock).mockResolvedValue(mockResponse);

      await verificationService.attemptVerification(
        ticketId,
        userId,
        'customerName',
        'direct',
        { question: 'Can you provide your name?' },
        'office_worker'
      );

      const status = await verificationService.getVerificationStatus(ticketId);

      expect(status.customerName.status).toBe('verified');
      expect(status.customerName.verifiedValue).toBe('Jane Doe');
      expect(status.overallProgress).toBe(20); // 1 out of 5 fields verified
    });

    it('should calculate correct overall progress', async () => {
      const ticketId = 'test-ticket-5';
      const userId = 'test-user-1';

      await verificationService.startVerificationProcess(ticketId, userId);

      // Mock multiple successful verifications
      const mockResponse = {
        response: 'Here is the information',
        providedInformation: { customerName: 'Test User', username: 'test.user' },
        cooperationLevel: 'high' as const,
        hesitation: false,
        questions: [],
        emotionalState: 'calm' as const,
        nextActions: [],
        scenarioTriggers: [],
      };

      (aiCustomerService.generateVerificationResponse as jest.Mock).mockResolvedValue(mockResponse);

      // Verify two fields
      await verificationService.attemptVerification(ticketId, userId, 'customerName', 'direct', { question: 'Name?' }, 'office_worker');
      await verificationService.attemptVerification(ticketId, userId, 'username', 'direct', { question: 'Username?' }, 'office_worker');

      const status = await verificationService.getVerificationStatus(ticketId);

      expect(status.overallProgress).toBe(40); // 2 out of 5 fields verified
      expect(status.completionTime).toBeUndefined(); // Not fully complete
    });
  });

  describe('markVerificationComplete', () => {
    it('should mark verification as complete when all critical fields are verified', async () => {
      const ticketId = 'test-ticket-6';
      const userId = 'test-user-1';

      await verificationService.startVerificationProcess(ticketId, userId);

      // Mock successful verifications for critical fields
      const mockResponse = {
        response: 'Here is my information',
        providedInformation: { customerName: 'John Doe', username: 'john.doe' },
        cooperationLevel: 'high' as const,
        hesitation: false,
        questions: [],
        emotionalState: 'calm' as const,
        nextActions: [],
        scenarioTriggers: [],
      };

      (aiCustomerService.generateVerificationResponse as jest.Mock).mockResolvedValue(mockResponse);

      await verificationService.attemptVerification(ticketId, userId, 'customerName', 'direct', { question: 'Name?' }, 'office_worker');
      await verificationService.attemptVerification(ticketId, userId, 'username', 'direct', { question: 'Username?' }, 'office_worker');

      const result = await verificationService.markVerificationComplete(ticketId, userId);

      expect(result.success).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.completionTime).toBeDefined();
    });

    it('should fail to complete verification if critical fields are missing', async () => {
      const ticketId = 'test-ticket-7';
      const userId = 'test-user-1';

      await verificationService.startVerificationProcess(ticketId, userId);

      // Only verify one critical field
      const mockResponse = {
        response: 'My name is John Doe',
        providedInformation: { customerName: 'John Doe' },
        cooperationLevel: 'high' as const,
        hesitation: false,
        questions: [],
        emotionalState: 'calm' as const,
        nextActions: [],
        scenarioTriggers: [],
      };

      (aiCustomerService.generateVerificationResponse as jest.Mock).mockResolvedValue(mockResponse);

      await verificationService.attemptVerification(ticketId, userId, 'customerName', 'direct', { question: 'Name?' }, 'office_worker');

      const result = await verificationService.markVerificationComplete(ticketId, userId);

      expect(result.success).toBe(false);
      expect(result.isComplete).toBe(false);
      expect(result.missingRequiredFields).toContain('username');
    });
  });

  describe('getVerificationHistory', () => {
    it('should return verification history for a ticket', async () => {
      const ticketId = 'test-ticket-8';
      const userId = 'test-user-1';

      await verificationService.startVerificationProcess(ticketId, userId);

      const mockResponse = {
        response: 'My name is Test User',
        providedInformation: { customerName: 'Test User' },
        cooperationLevel: 'high' as const,
        hesitation: false,
        questions: [],
        emotionalState: 'calm' as const,
        nextActions: [],
        scenarioTriggers: [],
      };

      (aiCustomerService.generateVerificationResponse as jest.Mock).mockResolvedValue(mockResponse);

      await verificationService.attemptVerification(ticketId, userId, 'customerName', 'direct', { question: 'Name?' }, 'office_worker');

      const history = await verificationService.getVerificationHistory(ticketId);

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].fieldType).toBe('customerName');
      expect(history[0].status).toBe('verified');
    });
  });

  describe('error handling', () => {
    it('should handle AI service errors gracefully', async () => {
      const ticketId = 'test-ticket-9';
      const userId = 'test-user-1';

      await verificationService.startVerificationProcess(ticketId, userId);

      (aiCustomerService.generateVerificationResponse as jest.Mock).mockRejectedValue(
        new Error('AI service unavailable')
      );

      await expect(
        verificationService.attemptVerification(
          ticketId,
          userId,
          'customerName',
          'direct',
          { question: 'Name?' },
          'office_worker'
        )
      ).rejects.toThrow('AI service unavailable');
    });

    it('should handle invalid field types', async () => {
      const ticketId = 'test-ticket-10';
      const userId = 'test-user-1';

      await verificationService.startVerificationProcess(ticketId, userId);

      await expect(
        verificationService.attemptVerification(
          ticketId,
          userId,
          'invalidField' as any,
          'direct',
          { question: 'Invalid?' },
          'office_worker'
        )
      ).rejects.toThrow();
    });
  });
});