import request from 'supertest';
import express from 'express';
import aiController from '../../controllers/aiController';
import aiService from '../../services/aiService';
import conversationManager from '../../services/conversationManager';
import personaManager from '../../services/personaManager';
import responseGenerator from '../../services/responseGenerator';
import aiErrorHandler from '../../middleware/aiErrorHandler';
import aiMetricsTracker from '../../middleware/aiMetrics';

// Mock all dependencies
jest.mock('../../services/aiService');
jest.mock('../../services/conversationManager');
jest.mock('../../services/personaManager');
jest.mock('../../services/responseGenerator');
jest.mock('../../middleware/aiErrorHandler');
jest.mock('../../middleware/aiMetrics');

const mockAiService = aiService as jest.Mocked<typeof aiService>;
const mockConversationManager = conversationManager as jest.Mocked<typeof conversationManager>;
const mockPersonaManager = personaManager as jest.Mocked<typeof personaManager>;
const mockResponseGenerator = responseGenerator as jest.Mocked<typeof responseGenerator>;
const mockAiErrorHandler = aiErrorHandler as jest.Mocked<typeof aiErrorHandler>;
const mockAiMetricsTracker = aiMetricsTracker as jest.Mocked<typeof aiMetricsTracker>;

// Create test app
const app = express();
app.use(express.json());

// Add routes
app.post('/ai/generate-response', aiController.generateResponse);
app.get('/ai/conversation/:conversationId/context', aiController.getConversationContext);
app.post('/ai/conversation/:conversationId/context', aiController.updateConversationContext);
app.get('/ai/metrics/:conversationId?', aiController.getMetrics);
app.get('/ai/persona/:conversationId/analytics', aiController.getPersonaAnalytics);
app.get('/ai/health', aiController.healthCheck);
app.post('/ai/generate-variations', aiController.generateVariations);
app.get('/ai/cost-analysis/:conversationId', aiController.getCostAnalysis);
app.delete('/ai/conversation/:conversationId', aiController.deleteConversation);
app.get('/ai/presets', aiController.getPresetPersonas);

describe('AIController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /ai/generate-response', () => {
    const validRequest = {
      conversationId: 'conv-123',
      userMessage: 'Hello, I need help with my computer',
      persona: {
        name: 'Sarah Mitchell',
        techLevel: 'beginner',
        communicationStyle: 'casual',
        patience: 'low',
        emotionalState: 'frustrated'
      },
      ticket: {
        id: 'ticket-123',
        title: 'Computer Issues',
        description: 'Computer won\'t start',
        priority: 'high',
        category: 'hardware'
      },
      scenario: {
        id: 'scenario-123',
        type: 'hardware',
        complexity: 'simple',
        expectedResolutionTime: 300,
        learningObjectives: ['Hardware troubleshooting']
      }
    };

    it('should generate AI response successfully with full context', async () => {
      const mockAiResponse = {
        content: 'Hi! I understand you\'re having computer trouble. That sounds really frustrating!',
        conversationId: 'conv-123',
        tokensUsed: 45,
        model: 'gpt-4',
        responseTime: 1200
      };

      const mockConsistencyCheck = {
        isConsistent: true,
        violations: [],
        updatedScore: 95
      };

      mockResponseGenerator.generateCustomerResponse.mockResolvedValue(mockAiResponse);
      mockPersonaManager.validateResponseConsistency.mockResolvedValue(mockConsistencyCheck);
      mockConversationManager.updateContext.mockResolvedValue({} as any);
      mockAiMetricsTracker.trackAIRequest.mockResolvedValue();

      const response = await request(app)
        .post('/ai/generate-response')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual({
        content: mockAiResponse.content,
        conversationId: 'conv-123',
        tokensUsed: 45,
        model: 'gpt-4',
        responseTime: 1200,
        consistency: {
          score: 95,
          violations: []
        },
        source: 'ai'
      });

      expect(mockResponseGenerator.generateCustomerResponse).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        userMessage: 'Hello, I need help with my computer',
        persona: validRequest.persona,
        ticket: validRequest.ticket,
        scenario: validRequest.scenario,
        options: {}
      });

      expect(mockPersonaManager.validateResponseConsistency).toHaveBeenCalledWith(
        'conv-123',
        mockAiResponse.content,
        'Hello, I need help with my computer'
      );

      expect(mockConversationManager.updateContext).toHaveBeenCalledWith(
        'conv-123',
        'Hello, I need help with my computer',
        mockAiResponse.content
      );

      expect(mockAiMetricsTracker.trackAIRequest).toHaveBeenCalledWith(
        'conv-123',
        45,
        1200,
        'gpt-4',
        95,
        false
      );
    });

    it('should use basic AI service for simple requests', async () => {
      const simpleRequest = {
        conversationId: 'conv-123',
        userMessage: 'Hello'
      };

      const mockContext = {
        conversationId: 'conv-123',
        messageHistory: [],
        contextData: {}
      };

      const mockAiResponse = {
        content: 'Hello! How can I help you?',
        conversationId: 'conv-123',
        tokensUsed: 25,
        model: 'gpt-4',
        responseTime: 800
      };

      mockConversationManager.getContext.mockResolvedValue(mockContext);
      mockAiService.generateResponse.mockResolvedValue(mockAiResponse);
      mockConversationManager.updateContext.mockResolvedValue({} as any);
      mockAiMetricsTracker.trackAIRequest.mockResolvedValue();

      const response = await request(app)
        .post('/ai/generate-response')
        .send(simpleRequest)
        .expect(200);

      expect(response.body).toEqual({
        content: 'Hello! How can I help you?',
        conversationId: 'conv-123',
        tokensUsed: 25,
        model: 'gpt-4',
        responseTime: 800,
        source: 'ai'
      });

      expect(mockAiService.generateResponse).toHaveBeenCalledWith(
        mockContext,
        'Hello',
        {}
      );
    });

    it('should use fallback response on AI failure', async () => {
      const mockError = new Error('OpenAI API error');
      const mockFallbackResponse = {
        content: 'I\'m sorry, I\'m having some technical difficulties right now.',
        source: 'fallback',
        reliability: 'medium'
      };

      mockResponseGenerator.generateCustomerResponse.mockRejectedValue(mockError);
      mockAiErrorHandler.handleAIError.mockResolvedValue(mockFallbackResponse);
      mockAiMetricsTracker.trackAIRequest.mockResolvedValue();

      const response = await request(app)
        .post('/ai/generate-response')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual({
        content: mockFallbackResponse.content,
        conversationId: 'conv-123',
        tokensUsed: 0,
        model: 'fallback',
        responseTime: expect.any(Number),
        source: 'fallback'
      });

      expect(mockAiErrorHandler.handleAIError).toHaveBeenCalledWith(
        mockError,
        'conv-123',
        validRequest.persona,
        'Hello, I need help with my computer'
      );

      expect(mockAiMetricsTracker.trackAIRequest).toHaveBeenCalledWith(
        'conv-123',
        0,
        expect.any(Number),
        'fallback',
        undefined,
        true
      );
    });

    it('should return 400 for invalid request', async () => {
      const invalidRequest = {
        userMessage: 'Hello'
        // Missing conversationId
      };

      const response = await request(app)
        .post('/ai/generate-response')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toEqual({
        error: 'conversationId and userMessage are required'
      });
    });
  });

  describe('GET /ai/conversation/:conversationId/context', () => {
    it('should return conversation context', async () => {
      const mockContext = {
        conversationId: 'conv-123',
        scenarioId: 'scenario-1',
        personaId: 'persona-1',
        messageHistory: [
          { role: 'user', content: 'Hello', timestamp: new Date() }
        ],
        contextData: { ticketInfo: { id: 'ticket-1' } }
      };

      mockConversationManager.getContext.mockResolvedValue(mockContext);

      const response = await request(app)
        .get('/ai/conversation/conv-123/context')
        .expect(200);

      expect(response.body).toEqual({
        conversationId: 'conv-123',
        scenarioId: 'scenario-1',
        personaId: 'persona-1',
        messageCount: 1,
        contextData: { ticketInfo: { id: 'ticket-1' } }
      });
    });

    it('should return 404 for non-existent conversation', async () => {
      mockConversationManager.getContext.mockResolvedValue(null);

      const response = await request(app)
        .get('/ai/conversation/conv-999/context')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Conversation not found'
      });
    });
  });

  describe('GET /ai/health', () => {
    it('should return healthy status when all services are working', async () => {
      mockAiService.healthCheck.mockResolvedValue(true);
      mockAiErrorHandler.healthCheck.mockResolvedValue({
        status: 'healthy',
        details: {
          circuitBreakerOpen: false,
          recentFailures: 0
        }
      });

      const response = await request(app)
        .get('/ai/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        services: {
          aiService: true,
          errorHandler: {
            status: 'healthy',
            details: {
              circuitBreakerOpen: false,
              recentFailures: 0
            }
          },
          metrics: 'unavailable'
        },
        timestamp: expect.any(String)
      });
    });

    it('should return unhealthy status when services are failing', async () => {
      mockAiService.healthCheck.mockResolvedValue(false);
      mockAiErrorHandler.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        details: {
          circuitBreakerOpen: true,
          recentFailures: 5
        }
      });

      const response = await request(app)
        .get('/ai/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
    });
  });

  describe('POST /ai/generate-variations', () => {
    it('should generate response variations', async () => {
      const request_body = {
        conversationId: 'conv-123',
        userMessage: 'Help me',
        persona: {
          name: 'John Doe',
          techLevel: 'intermediate',
          communicationStyle: 'formal',
          patience: 'medium',
          emotionalState: 'calm'
        },
        variations: 3
      };

      const mockVariations = [
        {
          content: 'Variation 1: I need assistance with my technical issue.',
          conversationId: 'conv-123',
          tokensUsed: 30,
          model: 'gpt-4',
          responseTime: 1000
        },
        {
          content: 'Variation 2: Could you please help me resolve my problem?',
          conversationId: 'conv-123',
          tokensUsed: 32,
          model: 'gpt-4',
          responseTime: 1100
        },
        {
          content: 'Variation 3: I would appreciate your assistance with this matter.',
          conversationId: 'conv-123',
          tokensUsed: 35,
          model: 'gpt-4',
          responseTime: 1200
        }
      ];

      mockResponseGenerator.generateWithPersonaVariation.mockResolvedValue(mockVariations);

      const response = await request(app)
        .post('/ai/generate-variations')
        .send(request_body)
        .expect(200);

      expect(response.body).toEqual({
        conversationId: 'conv-123',
        variations: mockVariations,
        count: 3
      });

      expect(mockResponseGenerator.generateWithPersonaVariation).toHaveBeenCalledWith(
        'conv-123',
        'Help me',
        request_body.persona,
        3
      );
    });
  });

  describe('GET /ai/cost-analysis/:conversationId', () => {
    it('should return cost analysis and recommendations', async () => {
      const mockCostThresholds = {
        exceeded: false,
        currentCost: 0.15,
        threshold: 1.0,
        recommendation: 'Cost within normal range'
      };

      const mockRecommendations = [
        'Consider using GPT-3.5-turbo for simple responses',
        'Implement more aggressive caching'
      ];

      mockAiMetricsTracker.checkCostThresholds.mockResolvedValue(mockCostThresholds);
      mockAiMetricsTracker.getOptimizationRecommendations.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .get('/ai/cost-analysis/conv-123')
        .expect(200);

      expect(response.body).toEqual({
        conversationId: 'conv-123',
        cost: mockCostThresholds,
        recommendations: mockRecommendations
      });
    });
  });

  describe('DELETE /ai/conversation/:conversationId', () => {
    it('should delete conversation successfully', async () => {
      mockConversationManager.deleteContext.mockResolvedValue(true);

      const response = await request(app)
        .delete('/ai/conversation/conv-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Conversation conv-123 deleted successfully'
      });

      expect(mockConversationManager.deleteContext).toHaveBeenCalledWith('conv-123');
    });
  });
});