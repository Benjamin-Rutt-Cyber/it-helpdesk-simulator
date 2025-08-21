import { openAIService } from '../config/openai';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

export interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
  responseTime: number;
  conversationId: string;
}

export interface ConversationContext {
  conversationId: string;
  scenarioId?: string;
  personaId?: string;
  messageHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  contextData: {
    ticketInfo?: any;
    customerProfile?: any;
    previousInteractions?: any;
  };
}

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  useCache?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

class AIService {
  private openAI: OpenAI;
  private requestQueue: Map<string, Promise<AIResponse>> = new Map();
  private responseCache: Map<string, AIResponse> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor() {
    this.openAI = openAIService.getClient();
    logger.info('AIService initialized');
  }

  async generateResponse(
    context: ConversationContext,
    userMessage: string,
    options: AIGenerationOptions = {}
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const config = openAIService.getConfig();
    
    const {
      temperature = config.temperature,
      maxTokens = config.maxTokens,
      model = config.defaultModel,
      useCache = true,
      priority = 'normal'
    } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey(context, userMessage, { temperature, maxTokens, model });
    
    // Check cache first
    if (useCache && this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey)!;
      logger.info(`Cache hit for conversation ${context.conversationId}`);
      return {
        ...cached,
        responseTime: Date.now() - startTime
      };
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      logger.info(`Request already in progress for conversation ${context.conversationId}`);
      return await this.requestQueue.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = this.executeAIRequest(context, userMessage, {
      temperature,
      maxTokens,
      model,
      priority
    }, startTime);

    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful response
      if (useCache) {
        this.responseCache.set(cacheKey, result);
        // Clean up cache after TTL
        setTimeout(() => {
          this.responseCache.delete(cacheKey);
        }, this.CACHE_TTL);
      }
      
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async executeAIRequest(
    context: ConversationContext,
    userMessage: string,
    options: Required<Omit<AIGenerationOptions, 'useCache'>>,
    startTime: number
  ): Promise<AIResponse> {
    try {
      // Build messages array with context
      const messages = this.buildMessageArray(context, userMessage);
      
      logger.info(`Generating AI response for conversation ${context.conversationId} with model ${options.model}`);

      const completion = await this.openAI.chat.completions.create({
        model: options.model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        stream: false
      });

      const response: AIResponse = {
        content: completion.choices[0]?.message?.content || '',
        tokensUsed: completion.usage?.total_tokens || 0,
        model: completion.model,
        responseTime: Date.now() - startTime,
        conversationId: context.conversationId
      };

      logger.info(`AI response generated for conversation ${context.conversationId}`, {
        tokensUsed: response.tokensUsed,
        responseTime: response.responseTime,
        model: response.model
      });

      return response;

    } catch (error) {
      logger.error(`AI request failed for conversation ${context.conversationId}:`, error);
      
      // Try fallback model if primary model fails
      if (options.model !== openAIService.getConfig().fallbackModel) {
        logger.info(`Retrying with fallback model for conversation ${context.conversationId}`);
        return this.executeAIRequest(
          context,
          userMessage,
          { ...options, model: openAIService.getConfig().fallbackModel },
          startTime
        );
      }
      
      throw new Error(`AI service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildMessageArray(
    context: ConversationContext,
    userMessage: string
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Add system message for persona and context
    const systemPrompt = this.buildSystemPrompt(context);
    messages.push({
      role: 'system',
      content: systemPrompt
    });

    // Add relevant message history (last 10 messages to manage token usage)
    const recentHistory = context.messageHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  private buildSystemPrompt(context: ConversationContext): string {
    let prompt = 'You are a customer contacting IT support for help with a technical issue. ';
    
    // Add persona-specific context if available
    if (context.contextData.customerProfile) {
      const profile = context.contextData.customerProfile;
      prompt += `Your personality traits: ${JSON.stringify(profile)}. `;
    }

    // Add ticket context if available
    if (context.contextData.ticketInfo) {
      const ticket = context.contextData.ticketInfo;
      prompt += `Your issue: ${ticket.description || 'Technical problem requiring support'}. `;
      prompt += `Ticket priority: ${ticket.priority || 'medium'}. `;
    }

    prompt += 'Respond naturally as a customer would, staying in character throughout the conversation. ';
    prompt += 'Ask relevant follow-up questions, provide requested information, and react appropriately to solutions offered.';

    return prompt;
  }

  private generateCacheKey(
    context: ConversationContext,
    message: string,
    options: { temperature: number; maxTokens: number; model: string }
  ): string {
    const contextHash = [
      context.scenarioId,
      context.personaId,
      JSON.stringify(context.contextData),
      context.messageHistory.slice(-5).map(m => m.content).join('|'), // Last 5 messages for context
      message,
      options.temperature,
      options.maxTokens,
      options.model
    ].join('::');
    
    return Buffer.from(contextHash).toString('base64').slice(0, 64);
  }

  // Utility methods
  async healthCheck(): Promise<boolean> {
    try {
      return await openAIService.testConnection();
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return false;
    }
  }

  getMetrics() {
    return {
      cacheSize: this.responseCache.size,
      queueSize: this.requestQueue.size,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate calculation
    // In production, this would track actual hits vs misses
    return this.responseCache.size > 0 ? 0.85 : 0; // Placeholder
  }

  clearCache(): void {
    this.responseCache.clear();
    logger.info('AI response cache cleared');
  }
}

export const aiService = new AIService();
export default aiService;