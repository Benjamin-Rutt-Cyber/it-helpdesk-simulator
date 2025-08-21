import personaManager from '../../services/personaManager';
import { PersonaTraits } from '../../utils/aiPrompts';
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

describe('PersonaManager', () => {
  const mockPersona: PersonaTraits = {
    name: 'Sarah Mitchell',
    techLevel: 'beginner',
    communicationStyle: 'casual',
    patience: 'low',
    emotionalState: 'frustrated',
    background: 'Marketing coordinator'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializePersona', () => {
    it('should create new persona memory', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await personaManager.initializePersona('conv-123', mockPersona);

      expect(result).toEqual({
        conversationId: 'conv-123',
        personaId: 'Sarah Mitchell',
        traits: mockPersona,
        behaviorHistory: expect.arrayContaining([
          expect.objectContaining({
            action: 'persona_initialized',
            context: 'conversation_start',
            emotionalState: 'frustrated'
          })
        ]),
        consistencyScore: 100,
        lastUpdated: expect.any(Date)
      });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'persona:conv-123:memory',
        expect.any(Number),
        expect.any(String)
      );
    });
  });

  describe('validateResponseConsistency', () => {
    beforeEach(() => {
      const mockMemory = {
        conversationId: 'conv-123',
        personaId: 'Sarah Mitchell',
        traits: mockPersona,
        behaviorHistory: [],
        consistencyScore: 100,
        lastUpdated: new Date()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockMemory));
      mockRedisClient.setEx.mockResolvedValue('OK');
    });

    it('should validate consistent beginner response', async () => {
      const response = "I'm not sure what you mean by API. Could you explain that in simpler terms?";
      
      const result = await personaManager.validateResponseConsistency(
        'conv-123',
        response,
        'Check your API configuration'
      );

      expect(result.isConsistent).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.updatedScore).toBe(100);
    });

    it('should detect technical level violations for beginner', async () => {
      const response = "Let me check the TCP/IP configuration and DNS settings in the firewall.";
      
      const result = await personaManager.validateResponseConsistency(
        'conv-123',
        response,
        'Network issue'
      );

      expect(result.isConsistent).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'trait_mismatch',
          severity: 'high',
          description: expect.stringContaining('Beginner persona using too many technical terms')
        })
      );
      expect(result.updatedScore).toBeLessThan(100);
    });

    it('should detect communication style violations', async () => {
      const casualPersona = { ...mockPersona, communicationStyle: 'formal' as const };
      const mockMemory = {
        conversationId: 'conv-123',
        personaId: 'Sarah Mitchell',
        traits: casualPersona,
        behaviorHistory: [],
        consistencyScore: 100,
        lastUpdated: new Date()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockMemory));

      const response = "Yeah, ok, gonna try that now. Thanks!";
      
      const result = await personaManager.validateResponseConsistency(
        'conv-123',
        response,
        'Try restarting'
      );

      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'trait_mismatch',
          severity: 'medium',
          description: expect.stringContaining('Formal persona using too much casual language')
        })
      );
    });

    it('should detect emotional state violations', async () => {
      const calmPersona = { ...mockPersona, emotionalState: 'calm' as const };
      const mockMemory = {
        conversationId: 'conv-123',
        personaId: 'Sarah Mitchell',
        traits: calmPersona,
        behaviorHistory: [],
        consistencyScore: 100,
        lastUpdated: new Date()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockMemory));

      const response = "This is ridiculous! I'm so angry about this terrible system!";
      
      const result = await personaManager.validateResponseConsistency(
        'conv-123',
        response,
        'Please wait'
      );

      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'emotional_shift',
          severity: 'high',
          description: expect.stringContaining('Unexpected emotional transition from calm to angry')
        })
      );
    });

    it('should handle missing persona memory gracefully', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await personaManager.validateResponseConsistency(
        'conv-999',
        'Test response',
        'Test context'
      );

      expect(result.isConsistent).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.updatedScore).toBe(100);
    });
  });

  describe('getPersonaAnalytics', () => {
    it('should return analytics for existing persona', async () => {
      const mockMemory = {
        conversationId: 'conv-123',
        personaId: 'Sarah Mitchell',
        traits: mockPersona,
        behaviorHistory: [
          {
            timestamp: new Date(),
            action: 'response_generated',
            context: 'greeting',
            emotionalState: 'frustrated',
            responsePattern: 'questioning'
          },
          {
            timestamp: new Date(),
            action: 'response_generated',
            context: 'help_request',
            emotionalState: 'frustrated',
            responsePattern: 'cooperative'
          }
        ],
        consistencyScore: 85,
        lastUpdated: new Date()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockMemory));

      const result = await personaManager.getPersonaAnalytics('conv-123');

      expect(result).toEqual({
        averageConsistencyScore: 85,
        violationFrequency: {
          questioning: 1,
          cooperative: 1
        },
        behaviorTrends: ['questioning', 'cooperative'],
        recommendations: expect.any(Array)
      });
    });

    it('should return empty analytics for non-existent persona', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await personaManager.getPersonaAnalytics('conv-999');

      expect(result).toEqual({
        averageConsistencyScore: 0,
        violationFrequency: {},
        behaviorTrends: [],
        recommendations: []
      });
    });
  });

  describe('getPersonaMemory', () => {
    it('should retrieve and parse persona memory', async () => {
      const mockMemory = {
        conversationId: 'conv-123',
        personaId: 'Sarah Mitchell',
        traits: mockPersona,
        behaviorHistory: [
          {
            timestamp: '2023-01-01T12:00:00.000Z',
            action: 'persona_initialized',
            context: 'conversation_start',
            emotionalState: 'frustrated',
            responsePattern: 'informative'
          }
        ],
        consistencyScore: 100,
        lastUpdated: '2023-01-01T12:00:00.000Z'
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockMemory));

      const result = await personaManager.getPersonaMemory('conv-123');

      expect(result).toEqual({
        ...mockMemory,
        lastUpdated: new Date('2023-01-01T12:00:00.000Z'),
        behaviorHistory: [
          {
            ...mockMemory.behaviorHistory[0],
            timestamp: new Date('2023-01-01T12:00:00.000Z')
          }
        ]
      });
    });

    it('should return null for non-existent memory', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await personaManager.getPersonaMemory('conv-999');

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await personaManager.getPersonaMemory('conv-123');

      expect(result).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should close Redis connection', async () => {
      mockRedisClient.quit.mockResolvedValue('OK');

      await personaManager.cleanup();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });
});