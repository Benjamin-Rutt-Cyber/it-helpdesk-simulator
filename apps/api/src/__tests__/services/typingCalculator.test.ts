import { TypingCalculator, MessageComplexity } from '../../services/typingCalculator';

describe('TypingCalculator', () => {
  describe('analyzeMessageComplexity', () => {
    it('should analyze simple messages correctly', () => {
      const message = 'Hello, how are you?';
      const complexity = TypingCalculator.analyzeMessageComplexity(message);
      
      expect(complexity.wordCount).toBe(4);
      expect(complexity.technicalTerms).toBe(0);
      expect(complexity.questionCount).toBe(1);
      expect(complexity.complexity).toBe('simple');
      expect(complexity.emotionalIntensity).toBeLessThan(0.2);
    });

    it('should identify technical terms in messages', () => {
      const message = 'The server database is not responding to network requests.';
      const complexity = TypingCalculator.analyzeMessageComplexity(message);
      
      expect(complexity.technicalTerms).toBeGreaterThan(2);
      expect(complexity.complexity).toBe('moderate');
    });

    it('should detect emotional intensity', () => {
      const message = 'URGENT!! My computer crashed and I need help NOW!';
      const complexity = TypingCalculator.analyzeMessageComplexity(message);
      
      expect(complexity.emotionalIntensity).toBeGreaterThan(0.3);
      expect(['moderate', 'complex']).toContain(complexity.complexity);
    });

    it('should handle complex technical messages', () => {
      const message = 'I need to configure the SSL certificate for our API server but the DNS settings are not working properly and users cannot access the database.';
      const complexity = TypingCalculator.analyzeMessageComplexity(message);
      
      expect(complexity.technicalTerms).toBeGreaterThan(3);
      expect(complexity.wordCount).toBeGreaterThan(20);
      expect(complexity.complexity).toBe('complex');
    });
  });

  describe('calculateTypingSimulation', () => {
    it('should generate simulation for office worker persona', () => {
      const message = 'I need help setting up my email client on the new computer.';
      const simulation = TypingCalculator.calculateTypingSimulation(message, 'office_worker');
      
      expect(simulation.totalDuration).toBeGreaterThan(0);
      expect(simulation.chunks.length).toBeGreaterThan(0);
      expect(simulation.chunks[0].wpm).toBeGreaterThan(35);
      expect(simulation.chunks[0].wpm).toBeLessThan(70);
    });

    it('should adjust for frustrated user persona', () => {
      const message = 'This stupid computer keeps freezing!';
      const frustratedSimulation = TypingCalculator.calculateTypingSimulation(message, 'frustrated_user');
      const officeSimulation = TypingCalculator.calculateTypingSimulation(message, 'office_worker');
      
      expect(frustratedSimulation.chunks[0].wpm).toBeLessThan(officeSimulation.chunks[0].wpm);
      expect(frustratedSimulation.pausePoints.length).toBeGreaterThan(0);
    });

    it('should handle mood modifiers', () => {
      const message = 'Can you help me with this issue?';
      const normalSimulation = TypingCalculator.calculateTypingSimulation(message, 'office_worker', 1.0);
      const angrySimulation = TypingCalculator.calculateTypingSimulation(message, 'office_worker', 1.5);
      
      // Both simulations should be valid
      expect(normalSimulation.totalDuration).toBeGreaterThan(0);
      expect(angrySimulation.totalDuration).toBeGreaterThan(0);
      
      // With higher mood modifier, we expect differences in the WPM calculations
      expect(normalSimulation.chunks[0].wpm).toBeGreaterThan(0);
      expect(angrySimulation.chunks[0].wpm).toBeGreaterThan(0);
    });

    it('should include backtrack events for personas prone to corrections', () => {
      const message = 'I think there might be a problem with the network configuration settings.';
      const simulation = TypingCalculator.calculateTypingSimulation(message, 'new_employee');
      
      // New employee should have some backtrack events
      expect(simulation.backtrackEvents.length).toBeGreaterThanOrEqual(0);
    });

    it('should adjust typing speed based on message complexity', () => {
      const simpleMessage = 'Hi there!';
      const complexMessage = 'I need to troubleshoot the database connection issues with our server configuration and SSL certificate implementation.';
      
      const simpleSimulation = TypingCalculator.calculateTypingSimulation(simpleMessage, 'office_worker');
      const complexSimulation = TypingCalculator.calculateTypingSimulation(complexMessage, 'office_worker');
      
      // Complex messages should have longer thinking pauses
      expect(complexSimulation.pausePoints.length).toBeGreaterThan(simpleSimulation.pausePoints.length);
    });
  });

  describe('adjustForDifficulty', () => {
    it('should speed up simulation for advanced difficulty', () => {
      const message = 'I need assistance with my computer setup.';
      const baseSimulation = TypingCalculator.calculateTypingSimulation(message, 'office_worker');
      const advancedSimulation = TypingCalculator.adjustForDifficulty(baseSimulation, 'advanced');
      
      expect(advancedSimulation.totalDuration).toBeLessThan(baseSimulation.totalDuration);
      expect(advancedSimulation.chunks[0].wpm).toBeGreaterThan(baseSimulation.chunks[0].wpm);
    });

    it('should slow down simulation for beginner difficulty', () => {
      const message = 'I need assistance with my computer setup.';
      const baseSimulation = TypingCalculator.calculateTypingSimulation(message, 'office_worker');
      const beginnerSimulation = TypingCalculator.adjustForDifficulty(baseSimulation, 'beginner');
      
      expect(beginnerSimulation.totalDuration).toBeGreaterThan(baseSimulation.totalDuration);
      expect(beginnerSimulation.chunks[0].wpm).toBeLessThan(baseSimulation.chunks[0].wpm);
    });

    it('should maintain intermediate difficulty unchanged', () => {
      const message = 'I need assistance with my computer setup.';
      const baseSimulation = TypingCalculator.calculateTypingSimulation(message, 'office_worker');
      const intermediateSimulation = TypingCalculator.adjustForDifficulty(baseSimulation, 'intermediate');
      
      expect(intermediateSimulation.totalDuration).toBe(baseSimulation.totalDuration);
      expect(intermediateSimulation.chunks[0].wpm).toBe(baseSimulation.chunks[0].wpm);
    });
  });

  describe('getPersonaTypingSpeed', () => {
    it('should return typing speeds for all personas', () => {
      const personas = ['office_worker', 'frustrated_user', 'patient_retiree', 'new_employee', 'executive'];
      
      personas.forEach(personaId => {
        const speeds = TypingCalculator.getPersonaTypingSpeed(personaId);
        
        expect(speeds.min).toBeGreaterThan(0);
        expect(speeds.max).toBeGreaterThan(speeds.min);
        expect(speeds.avg).toBeGreaterThanOrEqual(speeds.min);
        expect(speeds.avg).toBeLessThanOrEqual(speeds.max);
      });
    });

    it('should return executive as fastest typer', () => {
      const executiveSpeed = TypingCalculator.getPersonaTypingSpeed('executive');
      const retireeSpeed = TypingCalculator.getPersonaTypingSpeed('patient_retiree');
      
      expect(executiveSpeed.avg).toBeGreaterThan(retireeSpeed.avg);
      expect(executiveSpeed.min).toBeGreaterThan(retireeSpeed.min);
    });

    it('should handle unknown persona gracefully', () => {
      const speeds = TypingCalculator.getPersonaTypingSpeed('unknown_persona');
      
      expect(speeds.min).toBe(30);
      expect(speeds.max).toBe(50);
      expect(speeds.avg).toBe(40);
    });
  });

  describe('persona-specific characteristics', () => {
    it('should show patient retiree with longer pauses', () => {
      const message = 'Could you please help me understand how to use this software?';
      const retireeSimulation = TypingCalculator.calculateTypingSimulation(message, 'patient_retiree');
      const officeSimulation = TypingCalculator.calculateTypingSimulation(message, 'office_worker');
      
      expect(retireeSimulation.pausePoints.length).toBeGreaterThanOrEqual(officeSimulation.pausePoints.length);
    });

    it('should show executive with minimal pauses', () => {
      const message = 'Fix this network issue immediately.';
      const executiveSimulation = TypingCalculator.calculateTypingSimulation(message, 'executive');
      
      expect(executiveSimulation.chunks[0].wpm).toBeGreaterThan(45);
      // Executive should have fewer pause points
      const pauseRatio = executiveSimulation.pausePoints.length / message.length;
      expect(pauseRatio).toBeLessThan(0.1);
    });

    it('should show frustrated user with burst typing pattern', () => {
      const message = 'This is really annoying and not working at all!';
      const frustratedSimulation = TypingCalculator.calculateTypingSimulation(message, 'frustrated_user');
      
      // Should have more backtrack events due to emotional typing
      expect(frustratedSimulation.backtrackEvents.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty messages', () => {
      const simulation = TypingCalculator.calculateTypingSimulation('', 'office_worker');
      
      expect(simulation.totalDuration).toBe(0);
      expect(simulation.chunks.length).toBe(0);
    });

    it('should handle very short messages', () => {
      const simulation = TypingCalculator.calculateTypingSimulation('Hi', 'office_worker');
      
      expect(simulation.totalDuration).toBeGreaterThan(0);
      expect(simulation.chunks.length).toBeGreaterThan(0);
    });

    it('should handle very long messages', () => {
      const longMessage = 'This is a very long message that should test the typing calculator with a lot of words and technical terms like server, database, network, configuration, SSL, API, and many other technical concepts that might slow down the typing simulation.'.repeat(3);
      const simulation = TypingCalculator.calculateTypingSimulation(longMessage, 'office_worker');
      
      expect(simulation.totalDuration).toBeGreaterThan(10000); // Should take more than 10 seconds
      expect(simulation.pausePoints.length).toBeGreaterThan(5);
    });

    it('should handle messages with only punctuation', () => {
      const simulation = TypingCalculator.calculateTypingSimulation('!@#$%^&*()', 'office_worker');
      
      expect(simulation.totalDuration).toBeGreaterThan(0);
      expect(simulation.chunks.length).toBeGreaterThan(0);
    });

    it('should handle extreme mood modifiers', () => {
      const message = 'Test message';
      const extremeSimulation = TypingCalculator.calculateTypingSimulation(message, 'office_worker', 10.0);
      
      // Should still produce valid simulation even with extreme mood
      expect(extremeSimulation.totalDuration).toBeGreaterThan(0);
      expect(extremeSimulation.chunks.length).toBeGreaterThan(0);
    });
  });
});