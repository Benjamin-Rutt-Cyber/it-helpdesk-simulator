import OpenAI from 'openai';
import { logger } from '../utils/logger';

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  maxRetries: number;
  timeout: number;
  defaultModel: string;
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
}

class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor() {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      organization: process.env.OPENAI_ORGANIZATION,
      maxRetries: 3,
      timeout: 30000,
      defaultModel: 'gpt-4',
      fallbackModel: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7
    };

    if (!this.config.apiKey) {
      logger.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organization,
      maxRetries: this.config.maxRetries,
      timeout: this.config.timeout
    });

    logger.info('OpenAI service initialized successfully');
  }

  getClient(): OpenAI {
    return this.client;
  }

  getConfig(): OpenAIConfig {
    return { ...this.config };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.fallbackModel,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
      
      logger.info('OpenAI connection test successful');
      return true;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

export const openAIService = new OpenAIService();
export default openAIService;