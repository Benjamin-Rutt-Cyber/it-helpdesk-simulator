import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { PersonaTraits } from '../utils/aiPrompts';

export interface AIError extends Error {
  code?: string;
  status?: number;
  retryable?: boolean;
  context?: {
    conversationId?: string;
    persona?: PersonaTraits;
    userMessage?: string;
  };
}

export interface FallbackResponse {
  content: string;
  source: 'fallback' | 'template' | 'cached';
  reliability: 'low' | 'medium' | 'high';
}

class AIErrorHandler {
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 5000]; // Exponential backoff
  private fallbackResponses: Map<string, FallbackResponse[]> = new Map();

  constructor() {
    this.initializeFallbackResponses();
  }

  private initializeFallbackResponses(): void {
    // Generic fallback responses by persona type
    this.fallbackResponses.set('beginner', [
      {
        content: "I'm sorry, I'm having trouble explaining my issue right now. Could you give me a moment?",
        source: 'template',
        reliability: 'medium'
      },
      {
        content: "Something seems to be not working on my end. Can you help me figure out what's going on?",
        source: 'template',
        reliability: 'medium'
      },
      {
        content: "I'm not sure what just happened. Could you repeat that last part?",
        source: 'template',
        reliability: 'medium'
      }
    ]);

    this.fallbackResponses.set('intermediate', [
      {
        content: "I seem to be experiencing some connectivity issues. Let me try to reconnect and get back to you.",
        source: 'template',
        reliability: 'medium'
      },
      {
        content: "There appears to be a temporary issue on my side. Could you please wait a moment while I resolve this?",
        source: 'template',
        reliability: 'medium'
      },
      {
        content: "I'm having some technical difficulties right now. Can we continue in a few minutes?",
        source: 'template',
        reliability: 'medium'
      }
    ]);

    this.fallbackResponses.set('advanced', [
      {
        content: "I'm experiencing some service disruption that's affecting my ability to communicate properly. Please bear with me.",
        source: 'template',
        reliability: 'medium'
      },
      {
        content: "There seems to be a system issue causing communication delays. I'll try to reconnect and continue troubleshooting.",
        source: 'template',
        reliability: 'medium'
      },
      {
        content: "I'm encountering some unexpected latency issues. Let me reset my connection and we can proceed.",
        source: 'template',
        reliability: 'medium'
      }
    ]);

    // Emotion-specific responses
    this.fallbackResponses.set('frustrated', [
      {
        content: "This is exactly what I was worried about! Now even our conversation isn't working properly.",
        source: 'template',
        reliability: 'high'
      },
      {
        content: "Great, now I'm having issues talking to you too. This day just keeps getting worse.",
        source: 'template',
        reliability: 'high'
      }
    ]);

    this.fallbackResponses.set('angry', [
      {
        content: "Seriously? Now even the support system isn't working? This is unbelievable!",
        source: 'template',
        reliability: 'high'
      },
      {
        content: "I can't believe this - even trying to get help is broken. What kind of system is this?",
        source: 'template',
        reliability: 'high'
      }
    ]);
  }

  async handleAIError(
    error: AIError,
    conversationId: string,
    persona?: PersonaTraits,
    userMessage?: string
  ): Promise<FallbackResponse> {
    logger.error('AI service error occurred:', {
      error: error.message,
      code: error.code,
      conversationId,
      persona: persona?.name,
      userMessage: userMessage?.substring(0, 100)
    });

    // Determine error type and appropriate response
    const errorType = this.classifyError(error);
    const fallbackResponse = await this.selectFallbackResponse(errorType, persona);

    // Log fallback usage
    logger.info('Using fallback response for AI error:', {
      conversationId,
      errorType,
      fallbackSource: fallbackResponse.source,
      reliability: fallbackResponse.reliability
    });

    return fallbackResponse;
  }

  private classifyError(error: AIError): string {
    if (error.code === 'rate_limit_exceeded') {
      return 'rate_limit';
    }
    
    if (error.code === 'insufficient_quota') {
      return 'quota_exceeded';
    }
    
    if (error.message?.includes('timeout')) {
      return 'timeout';
    }
    
    if (error.message?.includes('network') || error.message?.includes('connection')) {
      return 'network';
    }
    
    if (error.code === 'model_overloaded') {
      return 'overload';
    }
    
    return 'unknown';
  }

  private async selectFallbackResponse(
    errorType: string,
    persona?: PersonaTraits
  ): Promise<FallbackResponse> {
    let responses: FallbackResponse[] = [];

    // First, try persona-specific responses
    if (persona) {
      // Check for emotion-specific responses first
      const emotionResponses = this.fallbackResponses.get(persona.emotionalState);
      if (emotionResponses) {
        responses = [...emotionResponses];
      }

      // Add tech level responses
      const techResponses = this.fallbackResponses.get(persona.techLevel);
      if (techResponses) {
        responses = [...responses, ...techResponses];
      }
    }

    // Fallback to generic responses if needed
    if (responses.length === 0) {
      responses = this.fallbackResponses.get('intermediate') || [];
    }

    // Select a random response to avoid repetition
    if (responses.length > 0) {
      const randomIndex = Math.floor(Math.random() * responses.length);
      return responses[randomIndex];
    }

    // Ultimate fallback
    return {
      content: "I'm sorry, I'm having some technical difficulties right now. Could you please try again in a moment?",
      source: 'fallback',
      reliability: 'low'
    };
  }

  async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts - 1) {
          break; // Don't delay after the last attempt
        }

        // Check if error is retryable
        if (!this.isRetryableError(error as AIError)) {
          throw error;
        }

        const delay = this.RETRY_DELAYS[attempt] || 5000;
        logger.info(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
        
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: AIError): boolean {
    const retryableCodes = [
      'rate_limit_exceeded',
      'model_overloaded',
      'service_unavailable',
      'timeout'
    ];

    return retryableCodes.includes(error.code || '') ||
           error.message?.includes('timeout') ||
           error.message?.includes('overloaded') ||
           error.retryable === true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Express middleware for handling AI errors
  middleware() {
    return (error: AIError, req: Request, res: Response, next: NextFunction) => {
      if (error.name === 'AIError' || error.code?.startsWith('ai_')) {
        logger.error('AI service error in request:', {
          path: req.path,
          method: req.method,
          error: error.message,
          conversationId: req.body?.conversationId
        });

        res.status(error.status || 500).json({
          error: {
            message: 'AI service temporarily unavailable',
            type: 'ai_service_error',
            conversationId: req.body?.conversationId,
            fallbackAvailable: true
          }
        });
      } else {
        next(error);
      }
    };
  }

  // Circuit breaker pattern for AI service calls
  private circuitBreaker = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    timeout: 60000, // 1 minute
    threshold: 5
  };

  async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.circuitBreaker.isOpen) {
      const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      
      if (timeSinceFailure < this.circuitBreaker.timeout) {
        throw new Error('AI service circuit breaker is open - service temporarily unavailable');
      } else {
        // Try to close the circuit
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failureCount = 0;
      }
    }

    try {
      const result = await operation();
      
      // Success - reset failure count
      this.circuitBreaker.failureCount = 0;
      return result;
      
    } catch (error) {
      this.circuitBreaker.failureCount++;
      this.circuitBreaker.lastFailureTime = Date.now();

      // Check if we should open the circuit
      if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
        this.circuitBreaker.isOpen = true;
        logger.warn('AI service circuit breaker opened due to repeated failures');
      }

      throw error;
    }
  }

  // Health check for AI service
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      circuitBreakerOpen: boolean;
      recentFailures: number;
      lastFailureTime?: Date;
    };
  }> {
    const details = {
      circuitBreakerOpen: this.circuitBreaker.isOpen,
      recentFailures: this.circuitBreaker.failureCount,
      lastFailureTime: this.circuitBreaker.lastFailureTime 
        ? new Date(this.circuitBreaker.lastFailureTime) 
        : undefined
    };

    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (this.circuitBreaker.isOpen) {
      status = 'unhealthy';
    } else if (this.circuitBreaker.failureCount > 2) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return { status, details };
  }

  // Add custom fallback responses
  addFallbackResponses(category: string, responses: FallbackResponse[]): void {
    this.fallbackResponses.set(category, responses);
    logger.info(`Added ${responses.length} fallback responses for category: ${category}`);
  }

  // Get metrics about fallback usage
  getErrorMetrics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    fallbackUsage: Record<string, number>;
    circuitBreakerTrips: number;
  } {
    // In production, these would be tracked in real-time
    return {
      totalErrors: 0, // Placeholder
      errorsByType: {},
      fallbackUsage: {},
      circuitBreakerTrips: 0
    };
  }
}

export const aiErrorHandler = new AIErrorHandler();
export default aiErrorHandler;