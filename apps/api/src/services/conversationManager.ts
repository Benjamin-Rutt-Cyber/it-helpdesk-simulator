import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { ConversationContext } from './aiService';

export interface ConversationSummary {
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  issueStatus: 'open' | 'in_progress' | 'resolved';
  lastActivity: Date;
}

export interface ContextWindow {
  maxMessages: number;
  maxTokens: number;
  compressionThreshold: number;
}

class ConversationManager {
  private redis: RedisClientType;
  private readonly CONTEXT_TTL = 86400; // 24 hours
  private readonly MAX_CONTEXT_SIZE = 4000; // tokens
  private readonly DEFAULT_WINDOW: ContextWindow = {
    maxMessages: 20,
    maxTokens: 3000,
    compressionThreshold: 15
  };

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis for conversation management');
    });

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      await this.redis.connect();
      logger.info('ConversationManager Redis client connected');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async getContext(conversationId: string): Promise<ConversationContext | null> {
    try {
      const contextKey = this.getContextKey(conversationId);
      const contextData = await this.redis.get(contextKey);
      
      if (!contextData) {
        logger.info(`No context found for conversation ${conversationId}`);
        return null;
      }

      const context = JSON.parse(contextData) as ConversationContext;
      
      // Convert timestamp strings back to Date objects
      context.messageHistory.forEach(msg => {
        msg.timestamp = new Date(msg.timestamp);
      });

      logger.info(`Retrieved context for conversation ${conversationId} with ${context.messageHistory.length} messages`);
      return context;
      
    } catch (error) {
      logger.error(`Failed to get context for conversation ${conversationId}:`, error);
      return null;
    }
  }

  async saveContext(context: ConversationContext): Promise<boolean> {
    try {
      const contextKey = this.getContextKey(context.conversationId);
      
      // Optimize context before saving
      const optimizedContext = await this.optimizeContext(context);
      
      await this.redis.setEx(
        contextKey,
        this.CONTEXT_TTL,
        JSON.stringify(optimizedContext)
      );

      logger.info(`Saved context for conversation ${context.conversationId}`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to save context for conversation ${context.conversationId}:`, error);
      return false;
    }
  }

  async updateContext(
    conversationId: string,
    userMessage: string,
    aiResponse: string
  ): Promise<ConversationContext> {
    let context = await this.getContext(conversationId);
    
    if (!context) {
      // Create new context
      context = {
        conversationId,
        messageHistory: [],
        contextData: {}
      };
    }

    // Add new messages
    const timestamp = new Date();
    
    context.messageHistory.push({
      role: 'user',
      content: userMessage,
      timestamp
    });

    context.messageHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp
    });

    // Save updated context
    await this.saveContext(context);
    
    return context;
  }

  async initializeContext(
    conversationId: string,
    scenarioId?: string,
    personaId?: string,
    contextData: any = {}
  ): Promise<ConversationContext> {
    const context: ConversationContext = {
      conversationId,
      scenarioId,
      personaId,
      messageHistory: [],
      contextData
    };

    // Add initial system message if we have persona/scenario info
    if (scenarioId || personaId) {
      const systemMessage = this.buildInitialSystemMessage(scenarioId, personaId, contextData);
      context.messageHistory.push({
        role: 'system',
        content: systemMessage,
        timestamp: new Date()
      });
    }

    await this.saveContext(context);
    logger.info(`Initialized new context for conversation ${conversationId}`);
    
    return context;
  }

  private async optimizeContext(context: ConversationContext): Promise<ConversationContext> {
    const window = this.DEFAULT_WINDOW;
    let optimizedContext = { ...context };

    // If we have too many messages, compress older ones
    if (context.messageHistory.length > window.compressionThreshold) {
      optimizedContext = await this.compressMessageHistory(optimizedContext, window);
    }

    // Ensure we don't exceed token limits
    optimizedContext = this.truncateForTokenLimit(optimizedContext, window.maxTokens);

    return optimizedContext;
  }

  private async compressMessageHistory(
    context: ConversationContext,
    window: ContextWindow
  ): Promise<ConversationContext> {
    const messages = context.messageHistory;
    
    if (messages.length <= window.maxMessages) {
      return context;
    }

    // Keep recent messages + system messages
    const systemMessages = messages.filter(m => m.role === 'system');
    const recentMessages = messages.slice(-window.maxMessages);
    
    // For middle messages, create a summary
    const middleMessages = messages.slice(
      systemMessages.length,
      messages.length - window.maxMessages
    );

    if (middleMessages.length > 0) {
      const summary = this.createMessageSummary(middleMessages);
      const summaryMessage = {
        role: 'system' as const,
        content: `Previous conversation summary: ${summary}`,
        timestamp: middleMessages[0].timestamp
      };

      return {
        ...context,
        messageHistory: [
          ...systemMessages,
          summaryMessage,
          ...recentMessages.filter(m => m.role !== 'system')
        ]
      };
    }

    return {
      ...context,
      messageHistory: [...systemMessages, ...recentMessages]
    };
  }

  private truncateForTokenLimit(
    context: ConversationContext,
    maxTokens: number
  ): ConversationContext {
    // Simplified token counting (roughly 4 characters per token)
    let totalTokens = 0;
    const truncatedMessages = [];

    // Start from the end (most recent) and work backwards
    for (let i = context.messageHistory.length - 1; i >= 0; i--) {
      const message = context.messageHistory[i];
      const messageTokens = Math.ceil(message.content.length / 4);
      
      if (totalTokens + messageTokens > maxTokens && truncatedMessages.length > 0) {
        break;
      }

      totalTokens += messageTokens;
      truncatedMessages.unshift(message);
    }

    return {
      ...context,
      messageHistory: truncatedMessages
    };
  }

  private createMessageSummary(messages: any[]): string {
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;
    
    return `${userMessages} user messages and ${assistantMessages} assistant responses discussing technical support issues`;
  }

  private buildInitialSystemMessage(
    scenarioId?: string,
    personaId?: string,
    contextData: any = {}
  ): string {
    let message = 'Starting new customer support conversation. ';
    
    if (scenarioId) {
      message += `Scenario: ${scenarioId}. `;
    }
    
    if (personaId) {
      message += `Customer persona: ${personaId}. `;
    }
    
    if (contextData.ticketInfo) {
      message += `Initial issue: ${contextData.ticketInfo.description}`;
    }

    return message;
  }

  private getContextKey(conversationId: string): string {
    return `conversation:${conversationId}:context`;
  }

  async deleteContext(conversationId: string): Promise<boolean> {
    try {
      const contextKey = this.getContextKey(conversationId);
      await this.redis.del(contextKey);
      logger.info(`Deleted context for conversation ${conversationId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete context for conversation ${conversationId}:`, error);
      return false;
    }
  }

  async getConversationSummary(conversationId: string): Promise<ConversationSummary | null> {
    const context = await this.getContext(conversationId);
    
    if (!context || context.messageHistory.length === 0) {
      return null;
    }

    // Analyze conversation for summary
    const messages = context.messageHistory;
    const lastMessage = messages[messages.length - 1];
    
    return {
      keyPoints: this.extractKeyPoints(messages),
      sentiment: this.analyzeSentiment(messages),
      issueStatus: this.determineIssueStatus(messages),
      lastActivity: lastMessage.timestamp
    };
  }

  private extractKeyPoints(messages: any[]): string[] {
    // Simplified key point extraction
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content);
    
    return userMessages
      .filter(content => content.length > 10)
      .slice(0, 5)
      .map(content => content.substring(0, 100) + (content.length > 100 ? '...' : ''));
  }

  private analyzeSentiment(messages: any[]): 'positive' | 'neutral' | 'negative' {
    // Simplified sentiment analysis
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop()?.content.toLowerCase() || '';
    
    if (lastUserMessage.includes('thank') || lastUserMessage.includes('great') || lastUserMessage.includes('work')) {
      return 'positive';
    }
    
    if (lastUserMessage.includes('frustrated') || lastUserMessage.includes('angry') || lastUserMessage.includes('not working')) {
      return 'negative';
    }
    
    return 'neutral';
  }

  private determineIssueStatus(messages: any[]): 'open' | 'in_progress' | 'resolved' {
    const lastAssistantMessage = messages
      .filter(m => m.role === 'assistant')
      .pop()?.content.toLowerCase() || '';
    
    if (lastAssistantMessage.includes('resolved') || lastAssistantMessage.includes('fixed')) {
      return 'resolved';
    }
    
    if (messages.length > 2) {
      return 'in_progress';
    }
    
    return 'open';
  }

  async getActiveConversations(): Promise<string[]> {
    try {
      const keys = await this.redis.keys('conversation:*:context');
      return keys.map(key => key.split(':')[1]);
    } catch (error) {
      logger.error('Failed to get active conversations:', error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('ConversationManager Redis connection closed');
    } catch (error) {
      logger.error('Error closing ConversationManager Redis connection:', error);
    }
  }
}

export const conversationManager = new ConversationManager();
export default conversationManager;