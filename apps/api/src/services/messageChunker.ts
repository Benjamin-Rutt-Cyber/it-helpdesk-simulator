import { TypingCalculator, MessageComplexity } from './typingCalculator';

export interface MessageChunk {
  id: string;
  text: string;
  order: number;
  delay: number; // milliseconds to wait before sending this chunk
  isLast: boolean;
  chunkType: 'sentence' | 'phrase' | 'paragraph' | 'technical';
}

export interface ChunkingStrategy {
  maxChunkLength: number;
  minChunkLength: number;
  sentenceBreakPoints: string[];
  phraseBreakPoints: string[];
  technicalBreakPoints: string[];
  delayBetweenChunks: number;
  personaDelayMultiplier: number;
}

export interface ChunkingResult {
  chunks: MessageChunk[];
  totalDelay: number;
  strategy: ChunkingStrategy;
  originalMessage: string;
}

export class MessageChunker {
  private static readonly PERSONA_CHUNKING_STRATEGIES: Record<string, ChunkingStrategy> = {
    office_worker: {
      maxChunkLength: 120,
      minChunkLength: 40,
      sentenceBreakPoints: ['.', '!', '?'],
      phraseBreakPoints: [',', ';', ':', ' - ', ' and ', ' but ', ' or '],
      technicalBreakPoints: [' then ', ' next ', ' after ', ' before '],
      delayBetweenChunks: 1500,
      personaDelayMultiplier: 1.0
    },
    frustrated_user: {
      maxChunkLength: 60,
      minChunkLength: 20,
      sentenceBreakPoints: ['.', '!', '?'],
      phraseBreakPoints: [',', ' and ', ' but '],
      technicalBreakPoints: [],
      delayBetweenChunks: 800,
      personaDelayMultiplier: 0.7
    },
    patient_retiree: {
      maxChunkLength: 150,
      minChunkLength: 60,
      sentenceBreakPoints: ['.', '!', '?'],
      phraseBreakPoints: [',', ';', ':', ' and ', ' but ', ' or ', ' so '],
      technicalBreakPoints: [' then ', ' next ', ' after ', ' first ', ' second '],
      delayBetweenChunks: 3000,
      personaDelayMultiplier: 2.0
    },
    new_employee: {
      maxChunkLength: 80,
      minChunkLength: 30,
      sentenceBreakPoints: ['.', '!', '?'],
      phraseBreakPoints: [',', ' and ', ' but ', ' or '],
      technicalBreakPoints: [' then ', ' next ', ' after '],
      delayBetweenChunks: 2000,
      personaDelayMultiplier: 1.5
    },
    executive: {
      maxChunkLength: 100,
      minChunkLength: 50,
      sentenceBreakPoints: ['.', '!', '?'],
      phraseBreakPoints: [';', ':'],
      technicalBreakPoints: [' then ', ' next '],
      delayBetweenChunks: 1000,
      personaDelayMultiplier: 0.8
    }
  };

  static chunkMessage(
    message: string,
    personaId: string,
    moodModifier: number = 1.0,
    customStrategy?: Partial<ChunkingStrategy>
  ): ChunkingResult {
    // Get strategy for persona
    const baseStrategy = this.PERSONA_CHUNKING_STRATEGIES[personaId] || 
                        this.PERSONA_CHUNKING_STRATEGIES.office_worker;
    
    const strategy: ChunkingStrategy = {
      ...baseStrategy,
      ...customStrategy,
      delayBetweenChunks: Math.round(baseStrategy.delayBetweenChunks * moodModifier)
    };

    // If message is short enough, don't chunk
    if (message.length <= strategy.maxChunkLength) {
      return {
        chunks: [{
          id: '1',
          text: message,
          order: 0,
          delay: 0,
          isLast: true,
          chunkType: 'sentence'
        }],
        totalDelay: 0,
        strategy,
        originalMessage: message
      };
    }

    const chunks = this.performChunking(message, strategy);
    const totalDelay = chunks.reduce((sum, chunk) => sum + chunk.delay, 0);

    return {
      chunks,
      totalDelay,
      strategy,
      originalMessage: message
    };
  }

  private static performChunking(message: string, strategy: ChunkingStrategy): MessageChunk[] {
    const chunks: MessageChunk[] = [];
    let remainingText = message.trim();
    let chunkIndex = 0;

    while (remainingText.length > 0) {
      const chunk = this.extractNextChunk(remainingText, strategy);
      
      chunks.push({
        id: `chunk_${chunkIndex + 1}`,
        text: chunk.text,
        order: chunkIndex,
        delay: chunkIndex === 0 ? 0 : this.calculateChunkDelay(chunk, strategy, chunkIndex),
        isLast: chunk.remainingText.length === 0,
        chunkType: chunk.type
      });

      remainingText = chunk.remainingText;
      chunkIndex++;

      // Safety break to prevent infinite loops
      if (chunkIndex > 20) {
        chunks[chunks.length - 1].text += remainingText;
        chunks[chunks.length - 1].isLast = true;
        break;
      }
    }

    return chunks;
  }

  private static extractNextChunk(
    text: string, 
    strategy: ChunkingStrategy
  ): { text: string; remainingText: string; type: MessageChunk['chunkType'] } {
    
    // Try to find sentence breaks first
    for (const breakPoint of strategy.sentenceBreakPoints) {
      const index = text.indexOf(breakPoint);
      if (index > strategy.minChunkLength && index <= strategy.maxChunkLength) {
        return {
          text: text.substring(0, index + breakPoint.length).trim(),
          remainingText: text.substring(index + breakPoint.length).trim(),
          type: 'sentence'
        };
      }
    }

    // Try technical break points for instructional content
    for (const breakPoint of strategy.technicalBreakPoints) {
      const index = text.indexOf(breakPoint);
      if (index > strategy.minChunkLength && index <= strategy.maxChunkLength) {
        return {
          text: text.substring(0, index).trim(),
          remainingText: text.substring(index).trim(),
          type: 'technical'
        };
      }
    }

    // Try phrase break points
    for (const breakPoint of strategy.phraseBreakPoints) {
      const index = text.indexOf(breakPoint);
      if (index > strategy.minChunkLength && index <= strategy.maxChunkLength) {
        return {
          text: text.substring(0, index + breakPoint.length).trim(),
          remainingText: text.substring(index + breakPoint.length).trim(),
          type: 'phrase'
        };
      }
    }

    // Fall back to word boundaries near max length
    if (text.length > strategy.maxChunkLength) {
      const maxIndex = strategy.maxChunkLength;
      let lastSpaceIndex = text.lastIndexOf(' ', maxIndex);
      
      if (lastSpaceIndex > strategy.minChunkLength) {
        return {
          text: text.substring(0, lastSpaceIndex).trim(),
          remainingText: text.substring(lastSpaceIndex).trim(),
          type: 'phrase'
        };
      }
    }

    // Return remaining text if it's all that's left
    return {
      text: text.trim(),
      remainingText: '',
      type: 'paragraph'
    };
  }

  private static calculateChunkDelay(
    chunk: { text: string; type: MessageChunk['chunkType'] },
    strategy: ChunkingStrategy,
    chunkIndex: number
  ): number {
    let baseDelay = strategy.delayBetweenChunks;
    
    // Adjust delay based on chunk type
    const typeMultipliers = {
      sentence: 1.0,
      phrase: 0.7,
      paragraph: 1.3,
      technical: 1.5
    };
    
    baseDelay *= typeMultipliers[chunk.type];
    
    // Adjust based on chunk complexity
    const complexity = TypingCalculator.analyzeMessageComplexity(chunk.text);
    if (complexity.complexity === 'complex') {
      baseDelay *= 1.4;
    } else if (complexity.complexity === 'moderate') {
      baseDelay *= 1.2;
    }
    
    // Add some randomization for naturalness
    const randomFactor = 0.8 + Math.random() * 0.4; // 80%-120%
    baseDelay *= randomFactor;
    
    // Apply persona delay multiplier
    baseDelay *= strategy.personaDelayMultiplier;
    
    return Math.round(baseDelay);
  }

  static optimizeChunking(result: ChunkingResult, targetTotalTime?: number): ChunkingResult {
    if (!targetTotalTime) return result;
    
    const currentTotalTime = result.totalDelay;
    const ratio = targetTotalTime / currentTotalTime;
    
    // Adjust all delays proportionally
    const optimizedChunks = result.chunks.map(chunk => ({
      ...chunk,
      delay: Math.round(chunk.delay * ratio)
    }));
    
    return {
      ...result,
      chunks: optimizedChunks,
      totalDelay: targetTotalTime
    };
  }

  static mergeConsecutiveShortChunks(chunks: MessageChunk[], minLength: number = 30): MessageChunk[] {
    const mergedChunks: MessageChunk[] = [];
    let i = 0;
    
    while (i < chunks.length) {
      let currentChunk = chunks[i];
      
      // Look ahead for short chunks to merge
      while (i + 1 < chunks.length && 
             currentChunk.text.length < minLength && 
             chunks[i + 1].text.length < minLength) {
        const nextChunk = chunks[i + 1];
        currentChunk = {
          ...currentChunk,
          text: currentChunk.text + ' ' + nextChunk.text,
          delay: currentChunk.delay + nextChunk.delay,
          isLast: nextChunk.isLast
        };
        i++;
      }
      
      mergedChunks.push(currentChunk);
      i++;
    }
    
    // Reorder the merged chunks
    return mergedChunks.map((chunk, index) => ({
      ...chunk,
      id: `merged_chunk_${index + 1}`,
      order: index,
      isLast: index === mergedChunks.length - 1
    }));
  }

  static splitLongChunk(chunk: MessageChunk, maxLength: number): MessageChunk[] {
    if (chunk.text.length <= maxLength) {
      return [chunk];
    }

    const words = chunk.text.split(' ');
    const subChunks: MessageChunk[] = [];
    let currentText = '';
    let subChunkIndex = 0;

    for (const word of words) {
      if (currentText.length + word.length + 1 > maxLength && currentText.length > 0) {
        // Create a sub-chunk
        subChunks.push({
          id: `${chunk.id}_${subChunkIndex + 1}`,
          text: currentText.trim(),
          order: chunk.order + subChunkIndex,
          delay: subChunkIndex === 0 ? chunk.delay : 800, // 800ms delay for continuation
          isLast: false,
          chunkType: chunk.chunkType
        });
        
        currentText = word;
        subChunkIndex++;
      } else {
        currentText += (currentText.length > 0 ? ' ' : '') + word;
      }
    }

    // Add the final sub-chunk
    if (currentText.length > 0) {
      subChunks.push({
        id: `${chunk.id}_${subChunkIndex + 1}`,
        text: currentText.trim(),
        order: chunk.order + subChunkIndex,
        delay: subChunkIndex === 0 ? chunk.delay : 800,
        isLast: chunk.isLast,
        chunkType: chunk.chunkType
      });
    }

    return subChunks;
  }

  static validateChunking(result: ChunkingResult): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if chunks reconstruct original message
    const reconstructed = result.chunks.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
    const original = result.originalMessage.replace(/\s+/g, ' ').trim();
    
    if (reconstructed !== original) {
      issues.push('Chunks do not reconstruct original message correctly');
    }
    
    // Check chunk order
    for (let i = 0; i < result.chunks.length; i++) {
      if (result.chunks[i].order !== i) {
        issues.push(`Chunk order mismatch at index ${i}`);
      }
    }
    
    // Check last chunk flag
    const lastChunks = result.chunks.filter(c => c.isLast);
    if (lastChunks.length !== 1 || !result.chunks[result.chunks.length - 1].isLast) {
      issues.push('Incorrect isLast flag assignment');
    }
    
    // Check for empty chunks
    const emptyChunks = result.chunks.filter(c => !c.text.trim());
    if (emptyChunks.length > 0) {
      issues.push(`Found ${emptyChunks.length} empty chunks`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

export default MessageChunker;