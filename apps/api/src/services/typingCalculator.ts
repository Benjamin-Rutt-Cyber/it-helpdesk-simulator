// import { CustomerPersona } from '../config/personas';

export interface TypingCharacteristics {
  baseWPM: number; // Words per minute
  minWPM: number;
  maxWPM: number;
  pauseFrequency: number; // 0-1 (how often to pause)
  pauseMultiplier: number; // How long pauses are
  backtrackChance: number; // 0-1 (chance to backtrack/correct)
  burstTyping: boolean; // Types in bursts vs steady
  thinkingPauseMultiplier: number; // Extra pause for complex content
}

export interface MessageComplexity {
  wordCount: number;
  technicalTerms: number;
  emotionalIntensity: number; // 0-1
  questionCount: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface TypingSimulation {
  totalDuration: number; // milliseconds
  chunks: TypingChunk[];
  pausePoints: PausePoint[];
  backtrackEvents: BacktrackEvent[];
}

export interface TypingChunk {
  text: string;
  startTime: number;
  duration: number;
  wpm: number;
}

export interface PausePoint {
  position: number; // Character position
  duration: number; // milliseconds
  reason: 'thinking' | 'natural' | 'correction' | 'emotional';
}

export interface BacktrackEvent {
  position: number;
  charactersDeleted: number;
  correctionText: string;
  duration: number;
}

export class TypingCalculator {
  private static readonly PERSONA_TYPING_CHARACTERISTICS: Record<string, TypingCharacteristics> = {
    office_worker: {
      baseWPM: 52,
      minWPM: 45,
      maxWPM: 60,
      pauseFrequency: 0.3,
      pauseMultiplier: 1.0,
      backtrackChance: 0.1,
      burstTyping: false,
      thinkingPauseMultiplier: 1.2
    },
    frustrated_user: {
      baseWPM: 30,
      minWPM: 25,
      maxWPM: 35,
      pauseFrequency: 0.6,
      pauseMultiplier: 1.8,
      backtrackChance: 0.25,
      burstTyping: true,
      thinkingPauseMultiplier: 2.0
    },
    patient_retiree: {
      baseWPM: 25,
      minWPM: 20,
      maxWPM: 30,
      pauseFrequency: 0.8,
      pauseMultiplier: 2.5,
      backtrackChance: 0.05,
      burstTyping: false,
      thinkingPauseMultiplier: 3.0
    },
    new_employee: {
      baseWPM: 40,
      minWPM: 35,
      maxWPM: 45,
      pauseFrequency: 0.5,
      pauseMultiplier: 1.5,
      backtrackChance: 0.2,
      burstTyping: true,
      thinkingPauseMultiplier: 2.2
    },
    executive: {
      baseWPM: 58,
      minWPM: 50,
      maxWPM: 65,
      pauseFrequency: 0.2,
      pauseMultiplier: 0.8,
      backtrackChance: 0.05,
      burstTyping: false,
      thinkingPauseMultiplier: 0.9
    }
  };

  static analyzeMessageComplexity(message: string): MessageComplexity {
    const words = message.trim().split(/\s+/);
    const wordCount = words.length;
    
    // Count technical terms
    const technicalPatterns = [
      /\b(server|database|network|wifi|password|install|software|hardware|system|error|bug|crash|update|configure|settings)\b/gi,
      /\b(IP|DNS|HTTP|SSL|CPU|RAM|USB|PDF|URL|API|OS)\b/g,
      /\b(\w+\.(com|org|net|exe|dll|zip))\b/gi
    ];
    
    let technicalTerms = 0;
    technicalPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      technicalTerms += matches ? matches.length : 0;
    });

    // Analyze emotional intensity
    const emotionalPatterns = [
      /\b(frustrated|angry|confused|urgent|critical|broken|failed|won't work|help|please)\b/gi,
      /[!]{2,}|[?]{2,}/g,
      /\b(ASAP|immediately|now|quickly)\b/gi
    ];
    
    let emotionalIndicators = 0;
    emotionalPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      emotionalIndicators += matches ? matches.length : 0;
    });
    
    const emotionalIntensity = Math.min(1, emotionalIndicators / wordCount * 10);

    // Count questions
    const questionCount = (message.match(/\?/g) || []).length;

    // Determine overall complexity
    let complexity: MessageComplexity['complexity'] = 'simple';
    if (technicalTerms > 2 || wordCount > 50 || emotionalIntensity > 0.3) {
      complexity = 'moderate';
    }
    if (technicalTerms > 5 || wordCount > 100 || emotionalIntensity > 0.6) {
      complexity = 'complex';
    }

    return {
      wordCount,
      technicalTerms,
      emotionalIntensity,
      questionCount,
      complexity
    };
  }

  static calculateTypingSimulation(
    message: string,
    personaId: string,
    moodModifier: number = 1.0,
    customSettings?: Partial<TypingCharacteristics>
  ): TypingSimulation {
    const characteristics = {
      ...this.PERSONA_TYPING_CHARACTERISTICS[personaId],
      ...customSettings
    };
    
    const complexity = this.analyzeMessageComplexity(message);
    
    // Adjust WPM based on mood and complexity
    let adjustedWPM = characteristics.baseWPM * moodModifier;
    
    // Complex messages slow down typing
    if (complexity.complexity === 'complex') {
      adjustedWPM *= 0.8;
    } else if (complexity.complexity === 'moderate') {
      adjustedWPM *= 0.9;
    }
    
    // Emotional intensity affects typing speed
    if (complexity.emotionalIntensity > 0.5) {
      // High emotion either speeds up (anger) or slows down (confusion)
      adjustedWPM *= personaId === 'frustrated_user' ? 1.2 : 0.85;
    }
    
    // Clamp to persona min/max
    adjustedWPM = Math.max(characteristics.minWPM, 
                          Math.min(characteristics.maxWPM, adjustedWPM));

    return this.simulateTypingPattern(message, characteristics, adjustedWPM, complexity);
  }

  private static simulateTypingPattern(
    message: string,
    characteristics: TypingCharacteristics,
    wpm: number,
    complexity: MessageComplexity
  ): TypingSimulation {
    const chunks: TypingChunk[] = [];
    const pausePoints: PausePoint[] = [];
    const backtrackEvents: BacktrackEvent[] = [];
    
    const msPerCharacter = (60 * 1000) / (wpm * 5); // Assuming 5 chars per word average
    let currentTime = 0;
    let currentPosition = 0;
    
    // Add initial thinking pause for complex messages
    if (complexity.complexity !== 'simple') {
      const thinkingPause = 1000 * characteristics.thinkingPauseMultiplier;
      pausePoints.push({
        position: 0,
        duration: thinkingPause,
        reason: 'thinking'
      });
      currentTime += thinkingPause;
    }

    // Process message in chunks (words or phrases)
    const words = message.split(/(\s+)/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Skip empty words
      if (!word.trim()) {
        currentPosition += word.length;
        continue;
      }
      
      // Calculate typing time for this word
      const wordDuration = word.length * msPerCharacter;
      
      // Add natural variation
      const variation = 0.8 + Math.random() * 0.4; // 80%-120%
      const adjustedDuration = wordDuration * variation;
      
      chunks.push({
        text: word,
        startTime: currentTime,
        duration: adjustedDuration,
        wpm: (word.length / 5) / (adjustedDuration / 60000) // Calculate actual WPM for this chunk
      });
      
      currentTime += adjustedDuration;
      currentPosition += word.length;
      
      // Add pauses based on characteristics
      if (Math.random() < characteristics.pauseFrequency) {
        const pauseDuration = this.calculatePauseDuration(characteristics, complexity, word);
        pausePoints.push({
          position: currentPosition,
          duration: pauseDuration,
          reason: this.determinePauseReason(word, complexity)
        });
        currentTime += pauseDuration;
      }
      
      // Add backtrack events
      if (Math.random() < characteristics.backtrackChance) {
        const backtrackEvent = this.generateBacktrackEvent(currentPosition, word);
        backtrackEvents.push(backtrackEvent);
        currentTime += backtrackEvent.duration;
      }
    }

    return {
      totalDuration: currentTime,
      chunks,
      pausePoints,
      backtrackEvents
    };
  }

  private static calculatePauseDuration(
    characteristics: TypingCharacteristics,
    complexity: MessageComplexity,
    word: string
  ): number {
    let basePause = 500; // Base pause of 500ms
    
    // Adjust based on characteristics
    basePause *= characteristics.pauseMultiplier;
    
    // Longer pauses for technical terms
    if (/\b(server|database|network|password|configure)\b/i.test(word)) {
      basePause *= 1.5;
    }
    
    // Emotional words get shorter pauses (more urgent)
    if (/\b(urgent|help|broken|error)\b/i.test(word)) {
      basePause *= 0.7;
    }
    
    // Add randomization
    const randomFactor = 0.5 + Math.random(); // 50%-150%
    
    return Math.round(basePause * randomFactor);
  }

  private static determinePauseReason(
    word: string,
    complexity: MessageComplexity
  ): PausePoint['reason'] {
    if (/\b(server|database|network|configure)\b/i.test(word)) {
      return 'thinking';
    }
    if (/\b(urgent|frustrated|angry)\b/i.test(word)) {
      return 'emotional';
    }
    if (complexity.technicalTerms > 3) {
      return 'thinking';
    }
    return 'natural';
  }

  private static generateBacktrackEvent(position: number, word: string): BacktrackEvent {
    const charactersToDelete = 1 + Math.floor(Math.random() * Math.min(3, word.length));
    const correctionText = word.slice(-charactersToDelete);
    
    return {
      position: position - charactersToDelete,
      charactersDeleted: charactersToDelete,
      correctionText,
      duration: 200 + Math.random() * 300 // 200-500ms to backtrack and retype
    };
  }

  static adjustForDifficulty(
    simulation: TypingSimulation,
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  ): TypingSimulation {
    const speedMultipliers = {
      beginner: 0.7,    // Slower for practice
      intermediate: 1.0, // Normal speed
      advanced: 1.3     // Faster for experienced users
    };
    
    const multiplier = speedMultipliers[difficultyLevel];
    
    return {
      ...simulation,
      totalDuration: simulation.totalDuration / multiplier,
      chunks: simulation.chunks.map(chunk => ({
        ...chunk,
        duration: chunk.duration / multiplier,
        wpm: chunk.wpm * multiplier
      })),
      pausePoints: simulation.pausePoints.map(pause => ({
        ...pause,
        duration: pause.duration / multiplier
      }))
    };
  }

  static getPersonaTypingSpeed(personaId: string): { min: number; max: number; avg: number } {
    const characteristics = this.PERSONA_TYPING_CHARACTERISTICS[personaId];
    if (!characteristics) {
      return { min: 30, max: 50, avg: 40 };
    }
    
    return {
      min: characteristics.minWPM,
      max: characteristics.maxWPM,
      avg: characteristics.baseWPM
    };
  }
}

export default TypingCalculator;