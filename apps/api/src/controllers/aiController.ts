import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import aiService from '../services/aiService';
import conversationManager from '../services/conversationManager';
import personaManager from '../services/personaManager';
import responseGenerator from '../services/responseGenerator';
import aiErrorHandler from '../middleware/aiErrorHandler';
import aiMetricsTracker from '../middleware/aiMetrics';
import { PersonaTraits, TicketContext, ScenarioContext, AIPromptBuilder } from '../utils/aiPrompts';

export interface AIGenerateRequest {
  conversationId: string;
  userMessage: string;
  persona?: PersonaTraits;
  ticket?: TicketContext;
  scenario?: ScenarioContext;
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    useCache?: boolean;
  };
}

export interface AIResponse {
  content: string;
  conversationId: string;
  tokensUsed: number;
  model: string;
  responseTime: number;
  qualityScore?: number;
  consistency?: {
    score: number;
    violations: any[];
  };
  source: 'ai' | 'fallback';
}

class AIController {
  async generateResponse(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    let conversationId = '';

    try {
      const {
        conversationId: reqConversationId,
        userMessage,
        persona,
        ticket,
        scenario,
        options = {}
      }: AIGenerateRequest = req.body;

      conversationId = reqConversationId;

      // Validate required fields
      if (!conversationId || !userMessage) {
        res.status(400).json({
          error: 'conversationId and userMessage are required'
        });
        return;
      }

      logger.info(`Generating AI response for conversation ${conversationId}`, {
        messageLength: userMessage.length,
        hasPersona: !!persona,
        hasTicket: !!ticket,
        hasScenario: !!scenario
      });

      let response: AIResponse;

      try {
        // Use the advanced response generator if persona/ticket/scenario are provided
        if (persona && ticket && scenario) {
          const generationRequest = {
            conversationId,
            userMessage,
            persona,
            ticket,
            scenario,
            options
          };

          const aiResponse = await responseGenerator.generateCustomerResponse(generationRequest);
          
          // Validate consistency
          const consistencyCheck = await personaManager.validateResponseConsistency(
            conversationId,
            aiResponse.content,
            userMessage
          );

          // Update conversation context
          await conversationManager.updateContext(
            conversationId,
            userMessage,
            aiResponse.content
          );

          response = {
            content: aiResponse.content,
            conversationId: aiResponse.conversationId,
            tokensUsed: aiResponse.tokensUsed,
            model: aiResponse.model,
            responseTime: aiResponse.responseTime,
            consistency: {
              score: consistencyCheck.updatedScore,
              violations: consistencyCheck.violations
            },
            source: 'ai'
          };

        } else {
          // Use basic AI service for simple responses
          const context = await conversationManager.getContext(conversationId) || 
                         await conversationManager.initializeContext(conversationId);

          const aiResponse = await aiService.generateResponse(context, userMessage, options);
          
          // Update context
          await conversationManager.updateContext(
            conversationId,
            userMessage,
            aiResponse.content
          );

          response = {
            content: aiResponse.content,
            conversationId: aiResponse.conversationId,
            tokensUsed: aiResponse.tokensUsed,
            model: aiResponse.model,
            responseTime: aiResponse.responseTime,
            source: 'ai'
          };
        }

        // Track metrics
        await aiMetricsTracker.trackAIRequest(
          conversationId,
          response.tokensUsed,
          response.responseTime,
          response.model,
          response.consistency?.score,
          false
        );

        res.json(response);

      } catch (error) {
        logger.error(`AI generation failed for conversation ${conversationId}:`, error);

        // Use fallback response
        const fallbackResponse = await aiErrorHandler.handleAIError(
          error as any,
          conversationId,
          persona,
          userMessage
        );

        // Track error metrics
        await aiMetricsTracker.trackAIRequest(
          conversationId,
          0,
          Date.now() - startTime,
          'fallback',
          undefined,
          true
        );

        response = {
          content: fallbackResponse.content,
          conversationId,
          tokensUsed: 0,
          model: 'fallback',
          responseTime: Date.now() - startTime,
          source: 'fallback'
        };

        res.json(response);
      }

    } catch (error) {
      logger.error('AI controller error:', error);
      res.status(500).json({
        error: 'Internal server error',
        conversationId
      });
    }
  }

  async getConversationContext(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({ error: 'conversationId is required' });
        return;
      }

      const context = await conversationManager.getContext(conversationId);
      
      if (!context) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      res.json({
        conversationId: context.conversationId,
        scenarioId: context.scenarioId,
        personaId: context.personaId,
        messageCount: context.messageHistory.length,
        contextData: context.contextData
      });

    } catch (error) {
      logger.error('Failed to get conversation context:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateConversationContext(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { scenarioId, personaId, contextData } = req.body;

      if (!conversationId) {
        res.status(400).json({ error: 'conversationId is required' });
        return;
      }

      let context = await conversationManager.getContext(conversationId);
      
      if (!context) {
        context = await conversationManager.initializeContext(
          conversationId,
          scenarioId,
          personaId,
          contextData
        );
      } else {
        if (scenarioId) context.scenarioId = scenarioId;
        if (personaId) context.personaId = personaId;
        if (contextData) context.contextData = { ...context.contextData, ...contextData };
        
        await conversationManager.saveContext(context);
      }

      res.json({ success: true, context });

    } catch (error) {
      logger.error('Failed to update conversation context:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { timeframe = '24h' } = req.query;

      if (conversationId) {
        // Get specific conversation metrics
        const metrics = await aiMetricsTracker.getConversationMetrics(conversationId);
        
        if (!metrics) {
          res.status(404).json({ error: 'Metrics not found for conversation' });
          return;
        }

        res.json(metrics);
      } else {
        // Get aggregated metrics
        const aggregatedMetrics = await aiMetricsTracker.getAggregatedMetrics(timeframe as any);
        res.json(aggregatedMetrics);
      }

    } catch (error) {
      logger.error('Failed to get AI metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPersonaAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({ error: 'conversationId is required' });
        return;
      }

      const analytics = await personaManager.getPersonaAnalytics(conversationId);
      res.json(analytics);

    } catch (error) {
      logger.error('Failed to get persona analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const [
        aiServiceHealth,
        errorHandlerHealth
      ] = await Promise.all([
        aiService.healthCheck(),
        aiErrorHandler.healthCheck()
      ]);

      const overallHealth = aiServiceHealth && errorHandlerHealth.status !== 'unhealthy';

      res.status(overallHealth ? 200 : 503).json({
        status: overallHealth ? 'healthy' : 'unhealthy',
        services: {
          aiService: aiServiceHealth,
          errorHandler: errorHandlerHealth,
          metrics: aiMetricsTracker.getGenerationMetrics ? 'available' : 'unavailable'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  async generateVariations(req: Request, res: Response): Promise<void> {
    try {
      const {
        conversationId,
        userMessage,
        persona,
        variations = 3
      } = req.body;

      if (!conversationId || !userMessage || !persona) {
        res.status(400).json({
          error: 'conversationId, userMessage, and persona are required'
        });
        return;
      }

      const responses = await responseGenerator.generateWithPersonaVariation(
        conversationId,
        userMessage,
        persona,
        variations
      );

      res.json({
        conversationId,
        variations: responses,
        count: responses.length
      });

    } catch (error) {
      logger.error('Failed to generate response variations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCostAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({ error: 'conversationId is required' });
        return;
      }

      const costThresholds = await aiMetricsTracker.checkCostThresholds(conversationId);
      const optimizationRecommendations = await aiMetricsTracker.getOptimizationRecommendations(conversationId);

      res.json({
        conversationId,
        cost: costThresholds,
        recommendations: optimizationRecommendations
      });

    } catch (error) {
      logger.error('Failed to get cost analysis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({ error: 'conversationId is required' });
        return;
      }

      await conversationManager.deleteContext(conversationId);
      
      res.json({ 
        success: true, 
        message: `Conversation ${conversationId} deleted successfully` 
      });

    } catch (error) {
      logger.error('Failed to delete conversation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPresetPersonas(req: Request, res: Response): Promise<void> {
    try {
      const presetPersonas = AIPromptBuilder.getPresetPersonas();
      const scenarioTemplates = AIPromptBuilder.getScenarioTemplates();

      res.json({
        personas: presetPersonas,
        scenarios: scenarioTemplates
      });

    } catch (error) {
      logger.error('Failed to get preset personas:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const aiController = new AIController();
export default aiController;