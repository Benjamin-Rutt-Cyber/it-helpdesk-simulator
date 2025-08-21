import { PersonaService } from '../../services/personaService';
import { PersonaStateManager } from '../../models/PersonaState';
import { PersonaMemoryManager } from '../../models/PersonaMemory';
import { CUSTOMER_PERSONAS } from '../../config/personas';
import { createClient } from 'redis';

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn()
}));

const mockRedisClient = {
  connect: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  quit: jest.fn(),
  on: jest.fn()
};

(createClient as jest.Mock).mockReturnValue(mockRedisClient);

describe('PersonaService', () => {
  let personaService: PersonaService;
  const mockConversationContext = {
    ticketType: 'email_connectivity',
    ticketCategory: 'network',
    learningObjectives: ['troubleshooting', 'communication'],
    expectedDuration: 900,
    complexity: 'moderate' as const,
    businessContext: {
      department: 'sales',
      priority: 'medium' as const,
      businessImpact: 'moderate' as const,
      affectedUsers: 1,
      deadlineConstraints: false,
      escalationPath: ['supervisor', 'manager']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.setEx.mockResolvedValue('OK');
    personaService = new PersonaService();
  });

  describe('startPersonaSession', () => {
    it('should create a new persona session with appropriate persona', async () => {
      const sessionId = 'test-session-123';
      const userId = 'user-456';

      const session = await personaService.startPersonaSession(
        sessionId,
        userId,
        mockConversationContext
      );

      expect(session).toMatchObject({
        sessionId,
        userId,
        isActive: true,
        conversationContext: mockConversationContext
      });

      expect(session.personaId).toBeOneOf(Object.keys(CUSTOMER_PERSONAS));
      expect(session.state.sessionId).toBe(sessionId);
      expect(session.memory.userId).toBe(userId);
    });

    it('should select office worker persona for network issues', async () => {
      const session = await personaService.startPersonaSession(
        'session-1',
        'user-1',
        {
          ...mockConversationContext,
          ticketType: 'network_connectivity',
          ticketCategory: 'network'
        }
      );

      // Office worker is a good match for network connectivity issues
      expect(session.personaId).toBeOneOf(['office_worker', 'new_employee', 'frustrated_user']);
    });

    it('should apply contextual modifications for high priority tickets', async () => {
      const highPriorityContext = {
        ...mockConversationContext,
        businessContext: {
          ...mockConversationContext.businessContext,
          priority: 'critical' as const,
          businessImpact: 'severe' as const
        }
      };

      const session = await personaService.startPersonaSession(
        'session-critical',
        'user-1',
        highPriorityContext
      );

      expect(session.state.contextualFactors.urgency).toBe('critical');
      expect(session.state.contextualFactors.businessImpact).toBe('severe');
      expect(session.state.frustrationLevel).toBeGreaterThan(3);
    });
  });

  describe('processInteraction', () => {
    let testSession: any;

    beforeEach(async () => {
      testSession = await personaService.startPersonaSession(
        'interaction-test',
        'user-1',
        mockConversationContext
      );
      
      // Mock the session retrieval
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testSession));
    });

    it('should process user interaction and update persona state', async () => {
      const userMessage = 'Thank you for your help, that worked perfectly!';

      const result = await personaService.processInteraction(
        testSession.sessionId,
        userMessage
      );

      expect(result.response).toContain('glad');
      expect(result.stateUpdate.interactionCount).toBe(testSession.state.interactionCount + 1);
      expect(result.stateUpdate.satisfactionLevel).toBeGreaterThan(testSession.state.satisfactionLevel);
      expect(result.learningMoments).toContainEqual(
        expect.objectContaining({
          type: 'skill_demonstrated',
          area: 'customer_satisfaction'
        })
      );
    });

    it('should handle negative interactions appropriately', async () => {
      const userMessage = 'This is taking too long and not working!';

      const result = await personaService.processInteraction(
        testSession.sessionId,
        userMessage
      );

      expect(result.stateUpdate.frustrationLevel).toBeGreaterThan(testSession.state.frustrationLevel);
      expect(result.stateUpdate.currentMood).toBeOneOf(['frustrated', 'impatient', 'angry']);
      expect(result.insights.escalationRisk).toBeGreaterThan(5);
    });

    it('should detect learning moments from user responses', async () => {
      const userMessage = 'I understand now, let me try those steps you mentioned';

      const result = await personaService.processInteraction(
        testSession.sessionId,
        userMessage
      );

      expect(result.learningMoments).toContainEqual(
        expect.objectContaining({
          type: 'concept_learned',
          impact: 'medium'
        })
      );
    });

    it('should update persona memory with interaction data', async () => {
      const userMessage = 'Great explanation, I learned something new today';

      await personaService.processInteraction(
        testSession.sessionId,
        userMessage
      );

      // Verify memory update calls were made
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringContaining('persona_session'),
        expect.any(Number),
        expect.any(String)
      );
    });
  });

  describe('endPersonaSession', () => {
    let testSession: any;

    beforeEach(async () => {
      testSession = await personaService.startPersonaSession(
        'end-test',
        'user-1',
        mockConversationContext
      );
      
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testSession));
    });

    it('should end session with resolution and generate analytics', async () => {
      const analytics = await personaService.endPersonaSession(
        testSession.sessionId,
        true // resolved
      );

      expect(analytics).toMatchObject({
        sessionId: testSession.sessionId,
        personaId: testSession.personaId,
        overallPerformance: expect.any(Number),
        learningEffectiveness: expect.any(Number),
        engagementLevel: expect.any(Number),
        satisfactionTrend: expect.any(Number)
      });

      expect(analytics.skillDevelopment).toBeInstanceOf(Array);
      expect(analytics.behaviorPatterns).toBeInstanceOf(Array);
      expect(analytics.recommendations).toBeInstanceOf(Array);
    });

    it('should handle unresolved sessions appropriately', async () => {
      const analytics = await personaService.endPersonaSession(
        testSession.sessionId,
        false // unresolved
      );

      expect(analytics.overallPerformance).toBeLessThan(70);
      expect(analytics.recommendations).toContain(
        expect.stringContaining('empathy')
      );
    });
  });

  describe('persona memory integration', () => {
    it('should create and manage persona memory across sessions', async () => {
      const userId = 'memory-test-user';
      
      // First session
      const session1 = await personaService.startPersonaSession(
        'memory-session-1',
        userId,
        mockConversationContext
      );

      expect(session1.memory.totalInteractions).toBe(0);

      // Process some interactions
      mockRedisClient.get.mockResolvedValue(JSON.stringify(session1));
      await personaService.processInteraction(session1.sessionId, 'Hello, I need help');
      await personaService.processInteraction(session1.sessionId, 'Thank you for your help');

      // End first session
      await personaService.endPersonaSession(session1.sessionId, true);

      // Start second session with same user and persona
      const existingMemory = {
        ...PersonaMemoryManager.createInitialMemory(session1.personaId, userId),
        totalInteractions: 1,
        relationshipData: {
          ...PersonaMemoryManager.createInitialMemory(session1.personaId, userId).relationshipData,
          trustLevel: 7,
          comfortLevel: 6
        }
      };

      mockRedisClient.get.mockImplementation((key) => {
        if (key.includes('persona_memory')) {
          return Promise.resolve(JSON.stringify(existingMemory));
        }
        return Promise.resolve(null);
      });

      const session2 = await personaService.startPersonaSession(
        'memory-session-2',
        userId,
        mockConversationContext
      );

      expect(session2.memory.totalInteractions).toBe(1);
      expect(session2.memory.relationshipData.trustLevel).toBe(7);
      expect(session2.state.trustLevel).toBeGreaterThan(session1.state.trustLevel);
    });
  });

  describe('persona state management', () => {
    it('should track mood changes throughout conversation', async () => {
      const initialState = PersonaStateManager.createInitialState(
        'mood-test',
        CUSTOMER_PERSONAS.frustrated_user
      );

      expect(initialState.currentMood).toBe('frustrated');
      expect(initialState.frustrationLevel).toBeGreaterThan(5);

      // Positive interaction should improve mood
      const improvedState = PersonaStateManager.updateMood(
        initialState,
        'pleased',
        'quick_resolution',
        'positive',
        'Test context'
      );

      expect(improvedState.currentMood).toBe('pleased');
      expect(improvedState.satisfactionLevel).toBeGreaterThan(initialState.satisfactionLevel);
      expect(improvedState.frustrationLevel).toBeLessThan(initialState.frustrationLevel);
    });

    it('should handle escalation scenarios', async () => {
      const state = PersonaStateManager.createInitialState(
        'escalation-test',
        CUSTOMER_PERSONAS.executive
      );

      const escalatedState = PersonaStateManager.requestEscalation(
        state,
        'Issue not resolved in timely manner'
      );

      expect(escalatedState.escalationRequested).toBe(true);
      expect(escalatedState.conversationPhase).toBe('escalation');
      expect(escalatedState.frustrationLevel).toBeGreaterThan(state.frustrationLevel);
    });
  });

  describe('persona analytics', () => {
    it('should generate meaningful analytics for learning assessment', async () => {
      const session = await personaService.startPersonaSession(
        'analytics-test',
        'user-1',
        {
          ...mockConversationContext,
          learningObjectives: ['empathy', 'problem_solving', 'communication']
        }
      );

      // Simulate successful interaction
      session.state.satisfactionLevel = 8;
      session.state.engagementLevel = 9;
      session.state.interactionCount = 5;

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));

      const analytics = await personaService.getPersonaAnalytics(session.sessionId);

      expect(analytics).toMatchObject({
        sessionId: session.sessionId,
        personaId: session.personaId,
        overallPerformance: expect.any(Number),
        learningEffectiveness: expect.any(Number)
      });

      expect(analytics!.overallPerformance).toBeGreaterThan(70);
      expect(analytics!.skillDevelopment).toContainEqual(
        expect.objectContaining({
          skill: 'empathy',
          progress: expect.any(Number)
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle missing session gracefully', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await expect(
        personaService.processInteraction('non-existent-session', 'test message')
      ).rejects.toThrow('Persona session non-existent-session not found');
    });

    it('should handle Redis connection errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));

      const session = await personaService.getPersonaSession('test-session');
      expect(session).toBeNull();
    });
  });

  describe('cultural sensitivity and bias prevention', () => {
    it('should provide diverse personas without stereotypes', () => {
      const personas = Object.values(CUSTOMER_PERSONAS);
      
      // Check that personas have diverse backgrounds
      const roles = personas.map(p => p.role);
      expect(new Set(roles).size).toBeGreaterThan(3);

      // Check that cultural considerations are present
      personas.forEach(persona => {
        expect(persona.cultural_considerations).toBeInstanceOf(Array);
        expect(persona.cultural_considerations.length).toBeGreaterThan(0);
      });

      // Ensure no discriminatory characteristics
      personas.forEach(persona => {
        expect(persona.background).not.toMatch(/race|gender|religion/i);
        expect(persona.name).toBeDefined();
        expect(persona.title).toBeDefined();
      });
    });

    it('should focus on professional and behavioral traits', () => {
      const personas = Object.values(CUSTOMER_PERSONAS);
      
      personas.forEach(persona => {
        // Check for professional focus
        expect(persona.role).toBeDefined();
        expect(persona.company_type).toBeDefined();
        expect(persona.typical_issues).toBeInstanceOf(Array);
        
        // Check for behavioral traits
        expect(persona.personality.communication).toBeDefined();
        expect(persona.personality.technicalLevel).toBeDefined();
        expect(persona.behavioral_patterns).toBeDefined();
      });
    });
  });
});

// Helper function for test assertions
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}