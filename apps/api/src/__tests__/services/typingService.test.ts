import { TypingService, TypingEvent } from '../../services/typingService';
import { PersonaStateManager } from '../../models/PersonaState';
import { CUSTOMER_PERSONAS } from '../../config/personas';

describe('TypingService', () => {
  let typingService: TypingService;
  let mockPersonaState: any;

  beforeEach(() => {
    typingService = new TypingService();
    mockPersonaState = PersonaStateManager.createInitialState(
      'test-session',
      CUSTOMER_PERSONAS.office_worker
    );
  });

  afterEach(async () => {
    await typingService.cleanup();
  });

  describe('startTypingSimulation', () => {
    it('should start typing simulation successfully', async () => {
      const sessionId = 'test-session-1';
      const message = 'Hello, I need help with my computer.';
      
      const simulation = await typingService.startTypingSimulation(
        sessionId,
        message,
        mockPersonaState
      );

      expect(simulation).toBeDefined();
      expect(simulation.totalDuration).toBeGreaterThan(0);
      expect(simulation.chunks.length).toBeGreaterThan(0);
      
      const typingState = typingService.getTypingState(sessionId);
      expect(typingState).toBeDefined();
      expect(typingState!.sessionId).toBe(sessionId);
    });

    it('should handle accessibility mode correctly', async () => {
      const sessionId = 'test-session-accessibility';
      const message = 'Test message for accessibility mode.';
      
      const simulation = await typingService.startTypingSimulation(
        sessionId,
        message,
        mockPersonaState,
        { accessibilityMode: true }
      );

      expect(simulation.totalDuration).toBe(0);
      expect(simulation.chunks[0].wpm).toBe(999);
    });

    it('should apply custom settings correctly', async () => {
      const sessionId = 'test-session-custom';
      const message = 'Test message with custom settings.';
      
      const simulation = await typingService.startTypingSimulation(
        sessionId,
        message,
        mockPersonaState,
        { speedMultiplier: 2.0 }
      );

      expect(simulation.totalDuration).toBeGreaterThan(0);
      
      const typingState = typingService.getTypingState(sessionId);
      expect(typingState).toBeDefined();
    });

    it('should emit typing events', (done) => {
      const sessionId = 'test-session-events';
      const message = 'Test message for events.';
      
      const events: TypingEvent[] = [];
      
      typingService.on('typing_event', (event: TypingEvent) => {
        events.push(event);
        
        if (event.type === 'typing_start') {
          expect(event.sessionId).toBe(sessionId);
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        }
      });

      typingService.startTypingSimulation(sessionId, message, mockPersonaState);
    });
  });

  describe('stopTypingSimulation', () => {
    it('should stop active typing simulation', async () => {
      const sessionId = 'test-session-stop';
      const message = 'Test message to stop.';
      
      await typingService.startTypingSimulation(sessionId, message, mockPersonaState);
      
      const stateBefore = typingService.getTypingState(sessionId);
      expect(stateBefore).toBeDefined();
      
      await typingService.stopTypingSimulation(sessionId);
      
      const stateAfter = typingService.getTypingState(sessionId);
      expect(stateAfter).toBeNull();
    });

    it('should handle stopping non-existent session gracefully', async () => {
      await expect(typingService.stopTypingSimulation('non-existent-session'))
        .resolves.not.toThrow();
    });
  });

  describe('pauseTypingSimulation', () => {
    it('should pause active typing simulation', async () => {
      const sessionId = 'test-session-pause';
      const message = 'Test message to pause.';
      
      await typingService.startTypingSimulation(sessionId, message, mockPersonaState);
      
      const pauseResult = await typingService.pauseTypingSimulation(sessionId);
      expect(pauseResult).toBe(true);
      
      const typingState = typingService.getTypingState(sessionId);
      expect(typingState!.isPaused).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      const pauseResult = await typingService.pauseTypingSimulation('non-existent');
      expect(pauseResult).toBe(false);
    });
  });

  describe('resumeTypingSimulation', () => {
    it('should resume paused typing simulation', async () => {
      const sessionId = 'test-session-resume';
      const message = 'Test message to resume.';
      
      await typingService.startTypingSimulation(sessionId, message, mockPersonaState);
      await typingService.pauseTypingSimulation(sessionId);
      
      const resumeResult = await typingService.resumeTypingSimulation(sessionId);
      expect(resumeResult).toBe(true);
      
      const typingState = typingService.getTypingState(sessionId);
      expect(typingState!.isPaused).toBe(false);
    });

    it('should return false for non-paused session', async () => {
      const sessionId = 'test-session-not-paused';
      const message = 'Test message.';
      
      await typingService.startTypingSimulation(sessionId, message, mockPersonaState);
      
      const resumeResult = await typingService.resumeTypingSimulation(sessionId);
      expect(resumeResult).toBe(false);
    });
  });

  describe('interruptTypingSimulation', () => {
    it('should interrupt active typing simulation', async () => {
      const sessionId = 'test-session-interrupt';
      const message = 'Test message to interrupt.';
      
      await typingService.startTypingSimulation(sessionId, message, mockPersonaState);
      
      const interruptResult = await typingService.interruptTypingSimulation(sessionId);
      expect(interruptResult).toBe(true);
      
      const typingState = typingService.getTypingState(sessionId);
      expect(typingState!.wasInterrupted).toBe(true);
      expect(typingState!.isTyping).toBe(false);
    });

    it('should return false for non-typing session', async () => {
      const interruptResult = await typingService.interruptTypingSimulation('non-existent');
      expect(interruptResult).toBe(false);
    });
  });

  describe('isTyping', () => {
    it('should correctly report typing status', async () => {
      const sessionId = 'test-session-status';
      const message = 'Test message for status.';
      
      expect(typingService.isTyping(sessionId)).toBe(false);
      
      await typingService.startTypingSimulation(sessionId, message, mockPersonaState);
      expect(typingService.isTyping(sessionId)).toBe(true);
      
      await typingService.pauseTypingSimulation(sessionId);
      expect(typingService.isTyping(sessionId)).toBe(false);
      
      await typingService.resumeTypingSimulation(sessionId);
      expect(typingService.isTyping(sessionId)).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should update settings for active session', async () => {
      const sessionId = 'test-session-settings';
      const message = 'Test message for settings.';
      
      await typingService.startTypingSimulation(sessionId, message, mockPersonaState);
      
      const updateResult = typingService.updateSettings(sessionId, {
        speedMultiplier: 1.5,
        pauseMultiplier: 0.8
      });
      
      expect(updateResult).toBe(true);
    });

    it('should return false for non-existent session', () => {
      const updateResult = typingService.updateSettings('non-existent', {
        speedMultiplier: 1.5
      });
      
      expect(updateResult).toBe(false);
    });
  });

  describe('mood modifier calculation', () => {
    it('should adjust typing speed based on persona mood', async () => {
      const sessionId1 = 'test-angry-mood';
      const sessionId2 = 'test-calm-mood';
      const message = 'Same message for both sessions.';
      
      const angryState = {
        ...mockPersonaState,
        currentMood: 'angry',
        frustrationLevel: 8
      };
      
      const calmState = {
        ...mockPersonaState,
        currentMood: 'calm',
        frustrationLevel: 2
      };
      
      const angrySimulation = await typingService.startTypingSimulation(
        sessionId1, 
        message, 
        angryState
      );
      
      const calmSimulation = await typingService.startTypingSimulation(
        sessionId2, 
        message, 
        calmState
      );
      
      // Angry typing should be faster (shorter duration)
      expect(angrySimulation.totalDuration).toBeLessThan(calmSimulation.totalDuration);
    });
  });

  describe('performance and cleanup', () => {
    it('should handle multiple concurrent sessions', async () => {
      const sessionIds = ['session-1', 'session-2', 'session-3'];
      const message = 'Concurrent test message.';
      
      const simulations = await Promise.all(
        sessionIds.map(sessionId => 
          typingService.startTypingSimulation(sessionId, message, mockPersonaState)
        )
      );
      
      expect(simulations).toHaveLength(3);
      
      sessionIds.forEach(sessionId => {
        expect(typingService.getTypingState(sessionId)).toBeDefined();
      });
      
      // Clean up all sessions
      await Promise.all(
        sessionIds.map(sessionId => typingService.stopTypingSimulation(sessionId))
      );
      
      sessionIds.forEach(sessionId => {
        expect(typingService.getTypingState(sessionId)).toBeNull();
      });
    });

    it('should clean up properly on service shutdown', async () => {
      const sessionIds = ['cleanup-1', 'cleanup-2'];
      const message = 'Cleanup test message.';
      
      await Promise.all(
        sessionIds.map(sessionId => 
          typingService.startTypingSimulation(sessionId, message, mockPersonaState)
        )
      );
      
      await typingService.cleanup();
      
      sessionIds.forEach(sessionId => {
        expect(typingService.getTypingState(sessionId)).toBeNull();
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid persona state gracefully', async () => {
      const sessionId = 'test-invalid-persona';
      const message = 'Test with invalid persona.';
      const invalidState = {
        ...mockPersonaState,
        personaId: 'invalid_persona'
      };
      
      await expect(
        typingService.startTypingSimulation(sessionId, message, invalidState)
      ).resolves.not.toThrow();
    });

    it('should handle empty messages', async () => {
      const sessionId = 'test-empty-message';
      const message = '';
      
      const simulation = await typingService.startTypingSimulation(
        sessionId, 
        message, 
        mockPersonaState
      );
      
      expect(simulation).toBeDefined();
    });

    it('should emit events even during errors', (done) => {
      const sessionId = 'test-error-events';
      const message = 'Test error handling.';
      
      typingService.on('typing_event', (event: TypingEvent) => {
        if (event.type === 'typing_start') {
          expect(event.sessionId).toBe(sessionId);
          done();
        }
      });

      typingService.startTypingSimulation(sessionId, message, mockPersonaState);
    });
  });
});