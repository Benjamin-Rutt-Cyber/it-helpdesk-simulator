import { aiService, AIResponse, ConversationContext, AIGenerationOptions } from './aiService';
import { AIPromptBuilder, PersonaTraits, TicketContext, ScenarioContext } from '../utils/aiPrompts';
import { logger } from '../utils/logger';

export interface ResponseQuality {
  score: number; // 0-100
  characterConsistency: number;
  appropriateness: number;
  naturalness: number;
  technicalAccuracy: number;
  issues: string[];
}

export interface GenerationRequest {
  conversationId: string;
  userMessage: string;
  persona: PersonaTraits;
  ticket: TicketContext;
  scenario: ScenarioContext;
  options?: AIGenerationOptions;
}

class ResponseGenerator {
  private readonly MIN_QUALITY_SCORE = 70;
  private readonly MAX_REGENERATION_ATTEMPTS = 3;

  async generateCustomerResponse(request: GenerationRequest): Promise<AIResponse> {
    logger.info(`Generating customer response for conversation ${request.conversationId}`);

    let attempts = 0;
    let bestResponse: AIResponse | null = null;
    let bestQuality: ResponseQuality | null = null;

    while (attempts < this.MAX_REGENERATION_ATTEMPTS) {
      attempts++;
      
      try {
        // Build enhanced context with persona and scenario
        const enhancedContext = await this.buildEnhancedContext(
          request.conversationId,
          request.persona,
          request.ticket,
          request.scenario
        );

        // Generate response with variation
        const response = await aiService.generateResponse(
          enhancedContext,
          request.userMessage,
          this.adjustOptionsForAttempt(request.options, attempts)
        );

        // Validate response quality
        const quality = await this.validateResponseQuality(
          response,
          request.persona,
          request.userMessage
        );

        logger.info(`Response attempt ${attempts} quality score: ${quality.score}`, {
          conversationId: request.conversationId,
          issues: quality.issues
        });

        // If quality is good enough, use this response
        if (quality.score >= this.MIN_QUALITY_SCORE) {
          return this.finalizeResponse(response, quality);
        }

        // Keep track of best response in case all attempts fail
        if (!bestResponse || quality.score > bestQuality!.score) {
          bestResponse = response;
          bestQuality = quality;
        }

      } catch (error) {
        logger.error(`Response generation attempt ${attempts} failed:`, error);
        
        if (attempts === this.MAX_REGENERATION_ATTEMPTS) {
          throw error;
        }
      }
    }

    // If all attempts failed to meet quality threshold, use best response
    logger.warn(`All attempts failed to meet quality threshold for conversation ${request.conversationId}. Using best response with score ${bestQuality!.score}`);
    return this.finalizeResponse(bestResponse!, bestQuality!);
  }

  private async buildEnhancedContext(
    conversationId: string,
    persona: PersonaTraits,
    ticket: TicketContext,
    scenario: ScenarioContext
  ): Promise<ConversationContext> {
    // Get existing context or create new one
    const conversationManager = (await import('./conversationManager')).default;
    let context = await conversationManager.getContext(conversationId);

    if (!context) {
      context = await conversationManager.initializeContext(
        conversationId,
        scenario.id,
        persona.name,
        {
          persona,
          ticketInfo: ticket,
          scenarioInfo: scenario
        }
      );
    }

    // Enhance context with current persona and scenario data
    context.contextData = {
      ...context.contextData,
      persona,
      ticketInfo: ticket,
      scenarioInfo: scenario
    };

    return context;
  }

  private adjustOptionsForAttempt(
    baseOptions: AIGenerationOptions = {},
    attempt: number
  ): AIGenerationOptions {
    // Increase temperature for variation in subsequent attempts
    const baseTemperature = baseOptions.temperature || 0.7;
    const adjustedTemperature = Math.min(1.0, baseTemperature + (attempt - 1) * 0.1);

    return {
      ...baseOptions,
      temperature: adjustedTemperature,
      // Use more tokens for later attempts to allow for more detailed responses
      maxTokens: (baseOptions.maxTokens || 1000) + (attempt - 1) * 200
    };
  }

  private async validateResponseQuality(
    response: AIResponse,
    persona: PersonaTraits,
    userMessage: string
  ): Promise<ResponseQuality> {
    const content = response.content.toLowerCase();
    const issues: string[] = [];

    // Character consistency check
    const characterConsistency = this.checkCharacterConsistency(content, persona, issues);

    // Appropriateness check
    const appropriateness = this.checkResponseAppropriateness(content, userMessage, issues);

    // Naturalness check
    const naturalness = this.checkResponseNaturalness(content, issues);

    // Technical accuracy check
    const technicalAccuracy = this.checkTechnicalAccuracy(content, persona, issues);

    // Calculate overall score
    const score = Math.round(
      (characterConsistency + appropriateness + naturalness + technicalAccuracy) / 4
    );

    return {
      score,
      characterConsistency,
      appropriateness,
      naturalness,
      technicalAccuracy,
      issues
    };
  }

  private checkCharacterConsistency(
    content: string,
    persona: PersonaTraits,
    issues: string[]
  ): number {
    let score = 100;

    // Check for AI/system references
    const aiReferences = [
      'as an ai', 'i am an ai', 'artificial intelligence', 'language model',
      'i cannot', 'i\'m not able to', 'as a system', 'i don\'t have access'
    ];

    for (const ref of aiReferences) {
      if (content.includes(ref)) {
        score -= 30;
        issues.push(`Breaking character: contains AI reference "${ref}"`);
      }
    }

    // Check technical level appropriateness
    if (persona.techLevel === 'beginner') {
      const complexTerms = ['api', 'debugging', 'tcp/ip', 'dns', 'ssl', 'encryption'];
      for (const term of complexTerms) {
        if (content.includes(term)) {
          score -= 10;
          issues.push(`Technical level mismatch: beginner using term "${term}"`);
        }
      }
    }

    // Check communication style
    if (persona.communicationStyle === 'formal') {
      const casualPhrases = ['yeah', 'ok', 'gonna', 'wanna', 'kinda'];
      for (const phrase of casualPhrases) {
        if (content.includes(phrase)) {
          score -= 5;
          issues.push(`Communication style mismatch: formal persona using casual language`);
        }
      }
    }

    return Math.max(0, score);
  }

  private checkResponseAppropriateness(
    content: string,
    userMessage: string,
    issues: string[]
  ): number {
    let score = 100;

    // Check if response is relevant to user message
    if (content.length < 10) {
      score -= 40;
      issues.push('Response too short');
    }

    // Check for inappropriate content
    const inappropriatePatterns = [
      'i can help you with that',
      'how can i assist',
      'thank you for contacting',
      'is there anything else'
    ];

    for (const pattern of inappropriatePatterns) {
      if (content.includes(pattern)) {
        score -= 20;
        issues.push(`Customer using support agent language: "${pattern}"`);
      }
    }

    return Math.max(0, score);
  }

  private checkResponseNaturalness(content: string, issues: string[]): number {
    let score = 100;

    // Check for overly robotic responses
    if (content.split('.').length > 5 && content.length < 200) {
      score -= 15;
      issues.push('Response structure too rigid');
    }

    // Check for natural conversation flow
    const naturalIndicators = ['um', 'well', 'actually', 'i think', 'maybe', 'probably'];
    const hasNaturalFlow = naturalIndicators.some(indicator => content.includes(indicator));
    
    if (!hasNaturalFlow && content.length > 50) {
      score -= 10;
      issues.push('Response lacks natural conversational elements');
    }

    // Check for repetitive patterns
    const words = content.split(' ');
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    
    if (repetitionRatio < 0.7) {
      score -= 15;
      issues.push('Response contains too much repetition');
    }

    return Math.max(0, score);
  }

  private checkTechnicalAccuracy(
    content: string,
    persona: PersonaTraits,
    issues: string[]
  ): number {
    let score = 100;

    // For advanced users, check for technical depth
    if (persona.techLevel === 'advanced') {
      const technicalDepthIndicators = [
        'log', 'error', 'configuration', 'settings', 'driver', 'update'
      ];
      
      const hasTechnicalDepth = technicalDepthIndicators.some(
        indicator => content.includes(indicator)
      );
      
      if (!hasTechnicalDepth && content.length > 100) {
        score -= 10;
        issues.push('Advanced user response lacks technical depth');
      }
    }

    // Check for technical impossibilities
    const impossibleClaims = [
      'deleted the internet',
      'broke the server',
      'hacked the system'
    ];

    for (const claim of impossibleClaims) {
      if (content.includes(claim)) {
        score -= 25;
        issues.push(`Technically impossible claim: "${claim}"`);
      }
    }

    return Math.max(0, score);
  }

  private finalizeResponse(response: AIResponse, quality: ResponseQuality): AIResponse {
    // Add quality metadata to response
    return {
      ...response,
      // Add quality score as metadata that can be logged/tracked
      content: response.content // Keep original content
    };
  }

  async generateWithPersonaVariation(
    conversationId: string,
    userMessage: string,
    persona: PersonaTraits,
    variations: number = 3
  ): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];
    
    for (let i = 0; i < variations; i++) {
      try {
        // Create slight persona variations for each attempt
        const variedPersona = this.createPersonaVariation(persona, i);
        
        // Build context with varied persona
        const context = await this.buildEnhancedContext(
          conversationId,
          variedPersona,
          {} as TicketContext, // Would be provided in real usage
          {} as ScenarioContext // Would be provided in real usage
        );

        const response = await aiService.generateResponse(
          context,
          userMessage,
          {
            temperature: 0.8 + (i * 0.1),
            maxTokens: 1000
          }
        );

        responses.push(response);
      } catch (error) {
        logger.error(`Variation ${i} generation failed:`, error);
      }
    }

    return responses;
  }

  private createPersonaVariation(persona: PersonaTraits, variation: number): PersonaTraits {
    // Create slight variations in emotional state or communication patterns
    const variations = { ...persona };
    
    switch (variation) {
      case 1:
        // Slightly more emotional
        if (variations.emotionalState === 'calm') variations.emotionalState = 'confused';
        break;
      case 2:
        // Slightly different patience level
        if (variations.patience === 'medium') variations.patience = 'low';
        break;
      default:
        // Use original persona
        break;
    }

    return variations;
  }

  // Performance metrics
  getGenerationMetrics() {
    return {
      averageQualityScore: this.calculateAverageQuality(),
      regenerationRate: this.calculateRegenerationRate(),
      commonIssues: this.getCommonQualityIssues()
    };
  }

  private calculateAverageQuality(): number {
    // In production, this would track actual quality scores
    return 82; // Placeholder
  }

  private calculateRegenerationRate(): number {
    // In production, this would track regeneration frequency
    return 0.15; // Placeholder: 15% of responses require regeneration
  }

  private getCommonQualityIssues(): string[] {
    // In production, this would track actual issues
    return [
      'Character consistency',
      'Technical level appropriateness',
      'Response naturalness'
    ];
  }
}

export const responseGenerator = new ResponseGenerator();
export default responseGenerator;