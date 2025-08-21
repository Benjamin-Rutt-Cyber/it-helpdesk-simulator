import { EventEmitter } from 'events';
import { TypingCalculator, TypingSimulation, TypingChunk } from './typingCalculator';
import { PersonaState } from '../models/PersonaState';
import { logger } from '../utils/logger';

export interface TypingState {
  sessionId: string;
  isTyping: boolean;
  currentMessage: string;
  simulation: TypingSimulation | null;
  startTime: number;
  currentChunkIndex: number;
  isPaused: boolean;
  wasInterrupted: boolean;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface TypingSettings {
  enabled: boolean;
  speedMultiplier: number; // 0.5 - 2.0
  pauseMultiplier: number; // 0.5 - 2.0
  chunkingEnabled: boolean;
  indicatorsEnabled: boolean;
  accessibilityMode: boolean;
}

export interface TypingEvent {
  type: 'typing_start' | 'typing_stop' | 'typing_pause' | 'typing_resume' | 'chunk_delivered' | 'typing_interrupted';
  sessionId: string;
  data?: any;
  timestamp: number;
}

export class TypingService extends EventEmitter {
  private activeSessions: Map<string, TypingState> = new Map();
  private typingTimers: Map<string, any[]> = new Map();
  private defaultSettings: TypingSettings = {
    enabled: true,
    speedMultiplier: 1.0,
    pauseMultiplier: 1.0,
    chunkingEnabled: true,
    indicatorsEnabled: true,
    accessibilityMode: false
  };

  constructor() {
    super();
    this.setMaxListeners(100); // Support multiple concurrent sessions
  }

  async startTypingSimulation(
    sessionId: string,
    message: string,
    personaState: PersonaState,
    settings: Partial<TypingSettings> = {}
  ): Promise<TypingSimulation> {
    logger.info('Starting typing simulation', { sessionId, messageLength: message.length });

    // Clean up any existing simulation for this session
    await this.stopTypingSimulation(sessionId);

    const effectiveSettings = { ...this.defaultSettings, ...settings };
    
    if (!effectiveSettings.enabled || effectiveSettings.accessibilityMode) {
      // Skip typing simulation, return immediate delivery
      return this.createImmediateSimulation(sessionId, message);
    }

    // Calculate mood modifier based on persona state
    const moodModifier = this.calculateMoodModifier(personaState);
    
    // Get typing simulation
    let simulation = TypingCalculator.calculateTypingSimulation(
      message,
      personaState.personaId,
      moodModifier
    );

    // Apply difficulty adjustment
    const difficultyLevel = this.determineDifficultyLevel(sessionId);
    simulation = TypingCalculator.adjustForDifficulty(simulation, difficultyLevel);

    // Apply user settings
    simulation = this.applySettings(simulation, effectiveSettings);

    // Create typing state
    const typingState: TypingState = {
      sessionId,
      isTyping: false,
      currentMessage: message,
      simulation,
      startTime: Date.now(),
      currentChunkIndex: 0,
      isPaused: false,
      wasInterrupted: false,
      difficultyLevel
    };

    this.activeSessions.set(sessionId, typingState);

    // Start the typing simulation
    await this.executeTypingSimulation(sessionId);

    return simulation;
  }

  async stopTypingSimulation(sessionId: string): Promise<void> {
    logger.info('Stopping typing simulation', { sessionId });

    const typingState = this.activeSessions.get(sessionId);
    if (!typingState) return;

    // Clear all timers for this session
    const timers = this.typingTimers.get(sessionId) || [];
    timers.forEach(timer => clearTimeout(timer));
    this.typingTimers.delete(sessionId);

    // Emit stop event if was typing
    if (typingState.isTyping) {
      this.emitTypingEvent({
        type: 'typing_stop',
        sessionId,
        timestamp: Date.now()
      });
    }

    // Clean up state
    this.activeSessions.delete(sessionId);
  }

  async pauseTypingSimulation(sessionId: string): Promise<boolean> {
    const typingState = this.activeSessions.get(sessionId);
    if (!typingState || !typingState.isTyping) return false;

    typingState.isPaused = true;
    
    this.emitTypingEvent({
      type: 'typing_pause',
      sessionId,
      timestamp: Date.now()
    });

    logger.info('Typing simulation paused', { sessionId });
    return true;
  }

  async resumeTypingSimulation(sessionId: string): Promise<boolean> {
    const typingState = this.activeSessions.get(sessionId);
    if (!typingState || !typingState.isPaused) return false;

    typingState.isPaused = false;
    
    this.emitTypingEvent({
      type: 'typing_resume',
      sessionId,
      timestamp: Date.now()
    });

    // Continue with remaining chunks
    await this.continueTypingSimulation(sessionId);

    logger.info('Typing simulation resumed', { sessionId });
    return true;
  }

  async interruptTypingSimulation(sessionId: string): Promise<boolean> {
    const typingState = this.activeSessions.get(sessionId);
    if (!typingState || !typingState.isTyping) return false;

    typingState.wasInterrupted = true;
    typingState.isTyping = false;

    // Clear remaining timers
    const timers = this.typingTimers.get(sessionId) || [];
    timers.forEach(timer => clearTimeout(timer));
    this.typingTimers.delete(sessionId);

    this.emitTypingEvent({
      type: 'typing_interrupted',
      sessionId,
      timestamp: Date.now()
    });

    logger.info('Typing simulation interrupted', { sessionId });
    return true;
  }

  getTypingState(sessionId: string): TypingState | null {
    return this.activeSessions.get(sessionId) || null;
  }

  isTyping(sessionId: string): boolean {
    const state = this.activeSessions.get(sessionId);
    return state ? state.isTyping && !state.isPaused : false;
  }

  updateSettings(sessionId: string, settings: Partial<TypingSettings>): boolean {
    const typingState = this.activeSessions.get(sessionId);
    if (!typingState) return false;

    // Apply new settings to current simulation if needed
    if (typingState.simulation) {
      typingState.simulation = this.applySettings(typingState.simulation, settings);
    }

    logger.info('Typing settings updated', { sessionId, settings });
    return true;
  }

  // Private methods
  private async executeTypingSimulation(sessionId: string): Promise<void> {
    const typingState = this.activeSessions.get(sessionId);
    if (!typingState || !typingState.simulation) return;

    const { simulation } = typingState;
    const timers: any[] = [];
    
    // Start typing indicator
    typingState.isTyping = true;
    this.emitTypingEvent({
      type: 'typing_start',
      sessionId,
      timestamp: Date.now()
    });

    // Schedule all chunks and pauses
    for (let i = 0; i < simulation.chunks.length; i++) {
      const chunk = simulation.chunks[i];
      
      // Schedule chunk delivery
      const chunkTimer = setTimeout(() => {
        this.deliverChunk(sessionId, chunk, i);
      }, chunk.startTime);
      
      timers.push(chunkTimer);
    }

    // Schedule pauses
    simulation.pausePoints.forEach(pause => {
      const pauseTimer = setTimeout(() => {
        this.handlePause(sessionId, pause.duration, pause.reason);
      }, pause.position * 10); // Convert position to rough timing
      
      timers.push(pauseTimer);
    });

    // Schedule completion
    const completionTimer = setTimeout(() => {
      this.completeTypingSimulation(sessionId);
    }, simulation.totalDuration);
    
    timers.push(completionTimer);

    this.typingTimers.set(sessionId, timers);
  }

  private async continueTypingSimulation(sessionId: string): Promise<void> {
    const typingState = this.activeSessions.get(sessionId);
    if (!typingState || !typingState.simulation) return;

    // Resume from current chunk index
    const remainingChunks = typingState.simulation.chunks.slice(typingState.currentChunkIndex);
    const timers: any[] = [];

    for (let i = 0; i < remainingChunks.length; i++) {
      const chunk = remainingChunks[i];
      const adjustedStartTime = chunk.startTime - (typingState.currentChunkIndex * 100); // Rough adjustment
      
      const chunkTimer = setTimeout(() => {
        this.deliverChunk(sessionId, chunk, typingState.currentChunkIndex + i);
      }, Math.max(0, adjustedStartTime));
      
      timers.push(chunkTimer);
    }

    this.typingTimers.set(sessionId, timers);
  }

  private deliverChunk(sessionId: string, chunk: TypingChunk, chunkIndex: number): void {
    const typingState = this.activeSessions.get(sessionId);
    if (!typingState || typingState.isPaused || typingState.wasInterrupted) return;

    typingState.currentChunkIndex = chunkIndex;

    this.emitTypingEvent({
      type: 'chunk_delivered',
      sessionId,
      data: {
        chunk,
        chunkIndex,
        isLast: chunkIndex === (typingState.simulation?.chunks.length || 0) - 1
      },
      timestamp: Date.now()
    });

    logger.debug('Chunk delivered', { sessionId, chunkIndex, text: chunk.text });
  }

  private handlePause(sessionId: string, duration: number, reason: string): void {
    const typingState = this.activeSessions.get(sessionId);
    if (!typingState || typingState.isPaused || typingState.wasInterrupted) return;

    // Just log the pause - the timing is already built into the simulation
    logger.debug('Typing pause', { sessionId, duration, reason });
  }

  private completeTypingSimulation(sessionId: string): void {
    const typingState = this.activeSessions.get(sessionId);
    if (!typingState) return;

    typingState.isTyping = false;

    this.emitTypingEvent({
      type: 'typing_stop',
      sessionId,
      timestamp: Date.now()
    });

    logger.info('Typing simulation completed', { 
      sessionId, 
      duration: Date.now() - typingState.startTime 
    });

    // Clean up after a short delay
    setTimeout(() => {
      this.activeSessions.delete(sessionId);
      this.typingTimers.delete(sessionId);
    }, 1000);
  }

  private calculateMoodModifier(personaState: PersonaState): number {
    // Convert mood to typing speed modifier
    const moodFactors = {
      angry: 1.3,      // Faster, more aggressive typing
      frustrated: 1.1,  // Slightly faster
      impatient: 1.2,   // Faster
      concerned: 0.9,   // Slightly slower
      neutral: 1.0,     // Normal speed
      calm: 0.95,       // Slightly slower
      pleased: 1.05,    // Slightly faster
      grateful: 0.9     // More thoughtful, slower
    };

    const baseMoodModifier = moodFactors[personaState.currentMood as keyof typeof moodFactors] || 1.0;
    
    // Adjust based on frustration level
    const frustrationModifier = 1 + (personaState.frustrationLevel - 5) * 0.05;
    
    // Adjust based on technical confidence
    const confidenceModifier = 0.8 + (personaState.technicalConfidence / 10) * 0.4;
    
    return baseMoodModifier * frustrationModifier * confidenceModifier;
  }

  private determineDifficultyLevel(_sessionId: string): 'beginner' | 'intermediate' | 'advanced' {
    // This could be based on user settings, performance history, etc.
    // For now, default to intermediate
    return 'intermediate';
  }

  private applySettings(simulation: TypingSimulation, settings: Partial<TypingSettings>): TypingSimulation {
    if (!settings.speedMultiplier && !settings.pauseMultiplier) {
      return simulation;
    }

    const speedMultiplier = settings.speedMultiplier || 1.0;
    const pauseMultiplier = settings.pauseMultiplier || 1.0;

    return {
      ...simulation,
      totalDuration: simulation.totalDuration / speedMultiplier,
      chunks: simulation.chunks.map(chunk => ({
        ...chunk,
        duration: chunk.duration / speedMultiplier,
        wpm: chunk.wpm * speedMultiplier
      })),
      pausePoints: simulation.pausePoints.map(pause => ({
        ...pause,
        duration: pause.duration * pauseMultiplier
      }))
    };
  }

  private createImmediateSimulation(sessionId: string, message: string): TypingSimulation {
    return {
      totalDuration: 0,
      chunks: [{
        text: message,
        startTime: 0,
        duration: 0,
        wpm: 999
      }],
      pausePoints: [],
      backtrackEvents: []
    };
  }

  private emitTypingEvent(event: TypingEvent): void {
    this.emit('typing_event', event);
    logger.debug('Typing event emitted', event);
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    logger.info('Cleaning up typing service');
    
    // Stop all active simulations
    const sessionIds = Array.from(this.activeSessions.keys());
    for (const sessionId of sessionIds) {
      await this.stopTypingSimulation(sessionId);
    }

    this.removeAllListeners();
  }
}

export const typingService = new TypingService();
export default typingService;