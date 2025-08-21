import aiService, { AIService, ConversationContext } from '../../services/aiService';
import { openAIService } from '../../config/openai';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('../../config/openai');
jest.mock('openai');

const mockOpenAI = openAIService as jest.Mocked<typeof openAIService>;
const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
} as jest.Mocked<OpenAI>;

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAI.getClient.mockReturnValue(mockOpenAIClient);
    mockOpenAI.getConfig.mockReturnValue({
      apiKey: 'test-key',
      maxRetries: 3,
      timeout: 30000,
      defaultModel: 'gpt-4',
      fallbackModel: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7
    });
  });

  const mockContext: ConversationContext = {
    conversationId: 'test-123',
    scenarioId: 'scenario-1',
    personaId: 'persona-1',
    messageHistory: [
      {
        role: 'user',
        content: 'Hello, I need help',
        timestamp: new Date()
      }
    ],
    contextData: {
      ticketInfo: {
        id: 'ticket-1',
        description: 'Computer not working'
      }
    }
  };

  describe('generateResponse', () => {
    it('should generate AI response successfully', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: 'Hello! I can help you with your computer issue. What specific problem are you experiencing?'
          }
        }],
        usage: {
          total_tokens: 45
        },
        model: 'gpt-4'
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockCompletion as any);

      const result = await aiService.generateResponse(
        mockContext,
        'My computer won\'t start',
        { temperature: 0.8, maxTokens: 500 }
      );

      expect(result).toEqual({
        content: 'Hello! I can help you with your computer issue. What specific problem are you experiencing?',
        tokensUsed: 45,
        model: 'gpt-4',
        responseTime: expect.any(Number),
        conversationId: 'test-123'
      });

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('customer contacting IT support')
          }),
          expect.objectContaining({
            role: 'user',
            content: 'Hello, I need help'
          }),
          expect.objectContaining({
            role: 'user',
            content: 'My computer won\'t start'
          })
        ]),
        max_tokens: 500,
        temperature: 0.8,
        stream: false
      });
    });

    it('should use fallback model on primary model failure', async () => {
      const primaryError = new Error('Model overloaded');
      const fallbackCompletion = {
        choices: [{
          message: {
            content: 'I understand you\'re having computer issues. Let me help you troubleshoot.'
          }
        }],
        usage: {
          total_tokens: 32
        },
        model: 'gpt-3.5-turbo'
      };

      mockOpenAIClient.chat.completions.create
        .mockRejectedValueOnce(primaryError)
        .mockResolvedValueOnce(fallbackCompletion as any);

      const result = await aiService.generateResponse(
        mockContext,
        'Computer problems',
        { model: 'gpt-4' }
      );

      expect(result.model).toBe('gpt-3.5-turbo');
      expect(result.content).toBe('I understand you\'re having computer issues. Let me help you troubleshoot.');
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    it('should use cache for duplicate requests', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: 'Cached response'
          }
        }],
        usage: {
          total_tokens: 25
        },
        model: 'gpt-4'
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockCompletion as any);

      // First request
      const result1 = await aiService.generateResponse(
        mockContext,
        'Same message',
        { useCache: true }
      );

      // Second request (should use cache)
      const result2 = await aiService.generateResponse(
        mockContext,
        'Same message',
        { useCache: true }
      );

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(result1.content).toBe(result2.content);
      expect(result2.responseTime).toBeLessThan(result1.responseTime);
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('OpenAI API error');
      mockOpenAIClient.chat.completions.create.mockRejectedValue(apiError);

      await expect(
        aiService.generateResponse(mockContext, 'Test message')
      ).rejects.toThrow('AI service unavailable');

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledTimes(2); // Primary + fallback
    });

    it('should build proper system prompt with context', async () => {
      const contextWithPersona = {
        ...mockContext,
        contextData: {
          customerProfile: {
            name: 'John Doe',
            techLevel: 'beginner'
          },
          ticketInfo: {
            description: 'Email not working',
            priority: 'high'
          }
        }
      };

      const mockCompletion = {
        choices: [{ message: { content: 'Test response' } }],
        usage: { total_tokens: 20 },
        model: 'gpt-4'
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockCompletion as any);

      await aiService.generateResponse(contextWithPersona, 'Help me');

      const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
      const systemMessage = callArgs.messages.find(m => m.role === 'system');
      
      expect(systemMessage?.content).toContain('customer contacting IT support');
      expect(systemMessage?.content).toContain('Email not working');
      expect(systemMessage?.content).toContain('high');
    });
  });

  describe('healthCheck', () => {
    it('should return true when OpenAI service is healthy', async () => {
      mockOpenAI.testConnection.mockResolvedValue(true);

      const result = await aiService.healthCheck();

      expect(result).toBe(true);
      expect(mockOpenAI.testConnection).toHaveBeenCalled();
    });

    it('should return false when OpenAI service is unhealthy', async () => {
      mockOpenAI.testConnection.mockRejectedValue(new Error('Connection failed'));

      const result = await aiService.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics object', () => {
      const metrics = aiService.getMetrics();

      expect(metrics).toEqual({
        cacheSize: expect.any(Number),
        queueSize: expect.any(Number),
        cacheHitRate: expect.any(Number)
      });
    });
  });

  describe('clearCache', () => {
    it('should clear response cache', () => {
      aiService.clearCache();
      const metrics = aiService.getMetrics();
      expect(metrics.cacheSize).toBe(0);
    });
  });
});