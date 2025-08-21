import request from 'supertest';
import { createClient } from 'redis';
import app from '../../app';
import { PersonaTraits, TicketContext, ScenarioContext } from '../../utils/aiPrompts';

// Mock OpenAI for integration tests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Hello! I\'m having trouble with my computer. It won\'t start when I press the power button. This is really frustrating because I have important work to do!'
            }
          }],
          usage: {
            total_tokens: 35
          },
          model: 'gpt-4'
        })
      }
    }
  }));
});

// Mock Redis for integration tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn()
  }))
}));

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.REDIS_URL = 'redis://localhost:6379';

describe('AI Integration Tests', () => {
  const testPersona: PersonaTraits = {
    name: 'Sarah Mitchell',
    techLevel: 'beginner',
    communicationStyle: 'casual',
    patience: 'low',
    emotionalState: 'frustrated',
    background: 'Marketing coordinator with limited technical experience'
  };

  const testTicket: TicketContext = {
    id: 'ticket-123',
    title: 'Computer Won\'t Start',
    description: 'Desktop computer does not power on when pressing power button',
    priority: 'high',
    category: 'hardware',
    urgency: 'urgent',
    affectedSystems: ['workstation'],
    businessImpact: 'Cannot access work files or applications'
  };

  const testScenario: ScenarioContext = {
    id: 'scenario-hardware-basic',
    type: 'hardware',
    complexity: 'simple',
    expectedResolutionTime: 900,
    learningObjectives: [
      'Basic hardware troubleshooting',
      'Power supply diagnosis',
      'Customer communication skills'
    ]
  };

  describe('End-to-End AI Conversation Flow', () => {
    it('should complete a full conversation cycle', async () => {
      const conversationId = 'integration-test-conv-1';

      // Step 1: Initialize conversation with context
      const initResponse = await request(app)
        .post(`/api/v1/ai/conversation/${conversationId}/context`)
        .send({
          scenarioId: testScenario.id,
          personaId: testPersona.name,
          contextData: {
            persona: testPersona,
            ticketInfo: testTicket,
            scenarioInfo: testScenario
          }
        });

      expect(initResponse.status).toBe(200);
      expect(initResponse.body.success).toBe(true);

      // Step 2: Generate first AI response
      const firstResponse = await request(app)
        .post('/api/v1/ai/generate-response')
        .send({
          conversationId,
          userMessage: 'Hello, I see you\'re having trouble with your computer. Can you tell me what happens when you try to turn it on?',
          persona: testPersona,
          ticket: testTicket,
          scenario: testScenario,
          options: {
            temperature: 0.8,
            maxTokens: 500
          }
        });

      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body).toMatchObject({
        conversationId,
        content: expect.any(String),
        tokensUsed: expect.any(Number),
        model: expect.any(String),
        source: 'ai',
        consistency: expect.objectContaining({
          score: expect.any(Number),
          violations: expect.any(Array)
        })
      });

      // Verify the response reflects the persona
      expect(firstResponse.body.content).toContain('computer');
      expect(firstResponse.body.content.length).toBeGreaterThan(20);

      // Step 3: Generate follow-up response
      const followUpResponse = await request(app)
        .post('/api/v1/ai/generate-response')
        .send({
          conversationId,
          userMessage: 'Let\'s try checking if the power cable is properly connected. Can you look at the back of your computer?',
          persona: testPersona,
          ticket: testTicket,
          scenario: testScenario
        });

      expect(followUpResponse.status).toBe(200);
      expect(followUpResponse.body.conversationId).toBe(conversationId);

      // Step 4: Check conversation context
      const contextResponse = await request(app)
        .get(`/api/v1/ai/conversation/${conversationId}/context`);

      expect(contextResponse.status).toBe(200);
      expect(contextResponse.body).toMatchObject({
        conversationId,
        scenarioId: testScenario.id,
        personaId: testPersona.name,
        messageCount: expect.any(Number)
      });

      // Step 5: Get persona analytics
      const analyticsResponse = await request(app)
        .get(`/api/v1/ai/persona/${conversationId}/analytics`);

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body).toMatchObject({
        averageConsistencyScore: expect.any(Number),
        violationFrequency: expect.any(Object),
        behaviorTrends: expect.any(Array),
        recommendations: expect.any(Array)
      });

      // Step 6: Get metrics
      const metricsResponse = await request(app)
        .get(`/api/v1/ai/metrics/${conversationId}`);

      expect(metricsResponse.status).toBe(200);

      // Step 7: Get cost analysis
      const costResponse = await request(app)
        .get(`/api/v1/ai/cost-analysis/${conversationId}`);

      expect(costResponse.status).toBe(200);
      expect(costResponse.body).toMatchObject({
        conversationId,
        cost: expect.objectContaining({
          currentCost: expect.any(Number),
          threshold: expect.any(Number),
          exceeded: expect.any(Boolean),
          recommendation: expect.any(String)
        }),
        recommendations: expect.any(Array)
      });

      // Step 8: Clean up - delete conversation
      const deleteResponse = await request(app)
        .delete(`/api/v1/ai/conversation/${conversationId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Response Variation Testing', () => {
    it('should generate multiple varied responses', async () => {
      const variationResponse = await request(app)
        .post('/api/v1/ai/generate-variations')
        .send({
          conversationId: 'variation-test-conv',
          userMessage: 'Can you help me troubleshoot this issue?',
          persona: testPersona,
          variations: 3
        });

      expect(variationResponse.status).toBe(200);
      expect(variationResponse.body).toMatchObject({
        conversationId: 'variation-test-conv',
        variations: expect.any(Array),
        count: 3
      });

      expect(variationResponse.body.variations).toHaveLength(3);
      
      // Each variation should be different
      const contents = variationResponse.body.variations.map((v: any) => v.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(3); // All should be unique
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle AI service failures gracefully', async () => {
      // Mock OpenAI to throw an error
      const OpenAI = require('openai');
      const mockClient = new OpenAI();
      mockClient.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));

      const errorResponse = await request(app)
        .post('/api/v1/ai/generate-response')
        .send({
          conversationId: 'error-test-conv',
          userMessage: 'This should trigger an error',
          persona: testPersona,
          ticket: testTicket,
          scenario: testScenario
        });

      expect(errorResponse.status).toBe(200); // Should still return 200 with fallback
      expect(errorResponse.body).toMatchObject({
        conversationId: 'error-test-conv',
        content: expect.any(String),
        source: 'fallback',
        model: 'fallback'
      });

      // Fallback content should be appropriate for the persona
      expect(errorResponse.body.content).toContain('difficulty');
    });
  });

  describe('Performance and Metrics Integration', () => {
    it('should track metrics throughout conversation lifecycle', async () => {
      const perfConversationId = 'perf-test-conv';

      // Generate multiple responses to accumulate metrics
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/ai/generate-response')
          .send({
            conversationId: perfConversationId,
            userMessage: `Test message ${i + 1}`,
            persona: testPersona,
            ticket: testTicket,
            scenario: testScenario
          });
      }

      // Check aggregated metrics
      const aggregatedMetrics = await request(app)
        .get('/api/v1/ai/metrics?timeframe=1h');

      expect(aggregatedMetrics.status).toBe(200);
      expect(aggregatedMetrics.body).toMatchObject({
        totalRequests: expect.any(Number),
        totalTokensUsed: expect.any(Number),
        totalCost: expect.any(Number),
        averageResponseTime: expect.any(Number),
        errorRate: expect.any(Number),
        averageQualityScore: expect.any(Number),
        modelDistribution: expect.any(Object),
        costByModel: expect.any(Object)
      });

      // Check conversation-specific metrics
      const conversationMetrics = await request(app)
        .get(`/api/v1/ai/metrics/${perfConversationId}`);

      expect(conversationMetrics.status).toBe(200);
    });
  });

  describe('Persona Consistency Integration', () => {
    it('should maintain persona consistency across multiple interactions', async () => {
      const consistencyConvId = 'consistency-test-conv';

      // Test with beginner persona - should avoid technical terms
      const beginnerPersona: PersonaTraits = {
        ...testPersona,
        techLevel: 'beginner'
      };

      const response1 = await request(app)
        .post('/api/v1/ai/generate-response')
        .send({
          conversationId: consistencyConvId,
          userMessage: 'We need to check your TCP/IP configuration and DNS settings.',
          persona: beginnerPersona,
          ticket: testTicket,
          scenario: testScenario
        });

      expect(response1.status).toBe(200);
      
      // Beginner should not use technical terms
      const content1 = response1.body.content.toLowerCase();
      expect(content1).not.toContain('tcp/ip');
      expect(content1).not.toContain('dns');

      // Test with advanced persona - should handle technical terms
      const advancedPersona: PersonaTraits = {
        ...testPersona,
        techLevel: 'advanced',
        communicationStyle: 'technical'
      };

      const response2 = await request(app)
        .post('/api/v1/ai/generate-response')
        .send({
          conversationId: consistencyConvId + '-advanced',
          userMessage: 'We need to check your network configuration.',
          persona: advancedPersona,
          ticket: testTicket,
          scenario: testScenario
        });

      expect(response2.status).toBe(200);
      
      // Advanced user might use more technical language or ask detailed questions
      const content2 = response2.body.content;
      expect(content2.length).toBeGreaterThan(10);
    });
  });

  describe('Health Check Integration', () => {
    it('should provide comprehensive health status', async () => {
      const healthResponse = await request(app)
        .get('/api/v1/ai/health');

      expect(healthResponse.status).toBeOneOf([200, 503]); // Either healthy or unhealthy
      expect(healthResponse.body).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
        services: expect.objectContaining({
          aiService: expect.any(Boolean),
          errorHandler: expect.any(Object),
          metrics: expect.any(String)
        }),
        timestamp: expect.any(String)
      });
    });
  });

  describe('Preset Data Integration', () => {
    it('should provide preset personas and scenarios', async () => {
      const presetsResponse = await request(app)
        .get('/api/v1/ai/presets');

      expect(presetsResponse.status).toBe(200);
      expect(presetsResponse.body).toMatchObject({
        personas: expect.any(Object),
        scenarios: expect.any(Object)
      });

      // Verify some expected presets exist
      expect(presetsResponse.body.personas).toHaveProperty('frustrated-beginner');
      expect(presetsResponse.body.personas).toHaveProperty('patient-expert');
      expect(presetsResponse.body.scenarios).toHaveProperty('password-reset');
      expect(presetsResponse.body.scenarios).toHaveProperty('network-connectivity');
    });
  });
});