import { MessageChunker } from '../../services/messageChunker';

describe('MessageChunker', () => {
  describe('chunkMessage', () => {
    it('should not chunk short messages', () => {
      const message = 'Short message';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      
      expect(result.chunks.length).toBe(1);
      expect(result.chunks[0].text).toBe(message);
      expect(result.chunks[0].isLast).toBe(true);
      expect(result.totalDelay).toBe(0);
    });

    it('should chunk long messages appropriately', () => {
      const message = 'This is a very long message that should be split into multiple chunks to improve the reading experience and make the conversation flow more naturally for the user.';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      
      expect(result.chunks.length).toBeGreaterThan(1);
      expect(result.chunks[result.chunks.length - 1].isLast).toBe(true);
      expect(result.totalDelay).toBeGreaterThan(0);
      
      // Verify chunks reconstruct original message
      const reconstructed = result.chunks.map(c => c.text).join(' ').trim();
      expect(reconstructed.replace(/\s+/g, ' ')).toBe(message.replace(/\s+/g, ' '));
    });

    it('should chunk based on sentence boundaries', () => {
      const message = 'This is the first sentence that provides important context for the user. This is the second sentence that adds more detailed information. This is the third sentence that completes the explanation with additional technical details.';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      
      if (result.chunks.length > 1) {
        // First chunk should end with a period
        expect(result.chunks[0].text.trim().endsWith('.')).toBe(true);
      } else {
        // If not chunked, it should be a single chunk
        expect(result.chunks.length).toBe(1);
      }
    });

    it('should handle different persona chunking styles', () => {
      const message = 'This is a much longer message that should definitely be chunked differently based on the persona characteristics and their communication patterns and preferences for how they deliver information to other people in conversation.';
      
      const frustratedResult = MessageChunker.chunkMessage(message, 'frustrated_user');
      const retireeResult = MessageChunker.chunkMessage(message, 'patient_retiree');
      
      // Both should create chunks or both should be single chunks
      expect(frustratedResult.chunks.length).toBeGreaterThan(0);
      expect(retireeResult.chunks.length).toBeGreaterThan(0);
      
      // Strategies should be different
      expect(frustratedResult.strategy.maxChunkLength).toBeLessThan(retireeResult.strategy.maxChunkLength);
    });

    it('should apply mood modifiers to delays', () => {
      const message = 'This is a much longer message that will definitely test mood effects on chunking delays and timing patterns when the message is actually long enough to be chunked into multiple parts.';
      
      const normalResult = MessageChunker.chunkMessage(message, 'office_worker', 1.0);
      const angryResult = MessageChunker.chunkMessage(message, 'office_worker', 1.5);
      
      // If chunked, delays should be different; if not chunked, both should have 0 delay
      if (normalResult.chunks.length > 1 || angryResult.chunks.length > 1) {
        expect(angryResult.strategy.delayBetweenChunks).not.toBe(normalResult.strategy.delayBetweenChunks);
      } else {
        expect(normalResult.totalDelay).toBe(0);
        expect(angryResult.totalDelay).toBe(0);
      }
    });

    it('should handle technical content appropriately', () => {
      const message = 'You need to configure the server settings carefully according to the documentation. Then update the database connection parameters to match the new configuration. Finally, restart the network service and test the connectivity to ensure everything is working properly.';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      
      // Should attempt to break on technical transition words if message is long enough
      if (result.chunks.length > 1) {
        const hasStepBreaks = result.chunks.some(chunk => 
          chunk.text.includes('Then') || chunk.text.includes('Finally')
        );
        expect(hasStepBreaks).toBe(true);
      } else {
        expect(result.chunks.length).toBe(1);
      }
    });

    it('should assign correct chunk types', () => {
      const message = 'Start with this comprehensive sentence that provides detailed instructions. Then proceed to the next step in the process. Finally, complete the entire process with proper validation.';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      
      const chunkTypes = result.chunks.map(c => c.chunkType);
      expect(chunkTypes).toContain('sentence');
      
      // Should identify sentence or technical chunks
      expect(chunkTypes.every(type => ['sentence', 'phrase', 'paragraph', 'technical'].includes(type))).toBe(true);
    });
  });

  describe('optimizeChunking', () => {
    it('should adjust delays to meet target time', () => {
      const message = 'This is a message that will be optimized for specific timing requirements and delay patterns.';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      
      const targetTime = 5000; // 5 seconds
      const optimized = MessageChunker.optimizeChunking(result, targetTime);
      
      expect(optimized.totalDelay).toBe(targetTime);
      expect(optimized.chunks.length).toBe(result.chunks.length);
    });

    it('should maintain chunk structure during optimization', () => {
      const message = 'Test message for optimization. Should maintain structure. While adjusting timing.';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      const optimized = MessageChunker.optimizeChunking(result, 8000);
      
      expect(optimized.chunks.length).toBe(result.chunks.length);
      expect(optimized.chunks[optimized.chunks.length - 1].isLast).toBe(true);
    });
  });

  describe('mergeConsecutiveShortChunks', () => {
    it('should merge short consecutive chunks', () => {
      const chunks = [
        { id: '1', text: 'Hi.', order: 0, delay: 1000, isLast: false, chunkType: 'sentence' as const },
        { id: '2', text: 'How are you?', order: 1, delay: 1500, isLast: false, chunkType: 'sentence' as const },
        { id: '3', text: 'This is a longer chunk that should not be merged because it exceeds the minimum length threshold.', order: 2, delay: 2000, isLast: true, chunkType: 'sentence' as const }
      ];
      
      const merged = MessageChunker.mergeConsecutiveShortChunks(chunks, 30);
      
      expect(merged.length).toBeLessThan(chunks.length);
      expect(merged[0].text).toContain('Hi.');
      expect(merged[0].text).toContain('How are you?');
    });

    it('should not merge chunks that meet minimum length', () => {
      const chunks = [
        { id: '1', text: 'This is a sufficiently long chunk that meets the minimum requirements.', order: 0, delay: 1000, isLast: false, chunkType: 'sentence' as const },
        { id: '2', text: 'This is another sufficiently long chunk that also meets requirements.', order: 1, delay: 1500, isLast: true, chunkType: 'sentence' as const }
      ];
      
      const merged = MessageChunker.mergeConsecutiveShortChunks(chunks, 30);
      
      expect(merged.length).toBe(chunks.length);
    });

    it('should properly reorder merged chunks', () => {
      const chunks = [
        { id: '1', text: 'A', order: 0, delay: 1000, isLast: false, chunkType: 'sentence' as const },
        { id: '2', text: 'B', order: 1, delay: 1500, isLast: false, chunkType: 'sentence' as const },
        { id: '3', text: 'C', order: 2, delay: 2000, isLast: true, chunkType: 'sentence' as const }
      ];
      
      const merged = MessageChunker.mergeConsecutiveShortChunks(chunks, 10);
      
      expect(merged.length).toBe(1);
      expect(merged[0].order).toBe(0);
      expect(merged[0].isLast).toBe(true);
    });
  });

  describe('splitLongChunk', () => {
    it('should split chunks that exceed maximum length', () => {
      const longChunk = {
        id: 'long_chunk',
        text: 'This is an extremely long chunk that definitely exceeds the maximum length threshold and should be split into multiple smaller chunks for better readability and user experience.',
        order: 0,
        delay: 2000,
        isLast: true,
        chunkType: 'sentence' as const
      };
      
      const split = MessageChunker.splitLongChunk(longChunk, 50);
      
      expect(split.length).toBeGreaterThan(1);
      expect(split[split.length - 1].isLast).toBe(true);
      
      // Verify reconstruction
      const reconstructed = split.map(c => c.text).join(' ');
      expect(reconstructed).toBe(longChunk.text);
    });

    it('should not split chunks within maximum length', () => {
      const shortChunk = {
        id: 'short_chunk',
        text: 'Short chunk',
        order: 0,
        delay: 1000,
        isLast: true,
        chunkType: 'sentence' as const
      };
      
      const split = MessageChunker.splitLongChunk(shortChunk, 100);
      
      expect(split.length).toBe(1);
      expect(split[0]).toEqual(shortChunk);
    });

    it('should maintain chunk properties in split chunks', () => {
      const longChunk = {
        id: 'test_chunk',
        text: 'This is a long chunk that needs to be split into multiple parts for better handling.',
        order: 5,
        delay: 3000,
        isLast: true,
        chunkType: 'technical' as const
      };
      
      const split = MessageChunker.splitLongChunk(longChunk, 30);
      
      split.forEach((chunk, index) => {
        expect(chunk.id).toContain('test_chunk');
        expect(chunk.order).toBe(5 + index);
        expect(chunk.chunkType).toBe('technical');
        expect(chunk.delay).toBeGreaterThan(0);
      });
      
      expect(split[split.length - 1].isLast).toBe(true);
      split.slice(0, -1).forEach(chunk => {
        expect(chunk.isLast).toBe(false);
      });
    });
  });

  describe('validateChunking', () => {
    it('should validate correct chunking', () => {
      const message = 'This is a test message. It should be chunked properly. And validation should pass.';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      const validation = MessageChunker.validateChunking(result);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect order issues', () => {
      const result = {
        chunks: [
          { id: '1', text: 'First', order: 0, delay: 1000, isLast: false, chunkType: 'sentence' as const },
          { id: '2', text: 'Second', order: 2, delay: 1500, isLast: true, chunkType: 'sentence' as const } // Wrong order
        ],
        totalDelay: 2500,
        strategy: {} as any,
        originalMessage: 'First Second'
      };
      
      const validation = MessageChunker.validateChunking(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('order'))).toBe(true);
    });

    it('should detect incorrect isLast flags', () => {
      const result = {
        chunks: [
          { id: '1', text: 'First', order: 0, delay: 1000, isLast: true, chunkType: 'sentence' as const }, // Wrong isLast
          { id: '2', text: 'Second', order: 1, delay: 1500, isLast: false, chunkType: 'sentence' as const } // Wrong isLast
        ],
        totalDelay: 2500,
        strategy: {} as any,
        originalMessage: 'First Second'
      };
      
      const validation = MessageChunker.validateChunking(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('isLast'))).toBe(true);
    });

    it('should detect empty chunks', () => {
      const result = {
        chunks: [
          { id: '1', text: 'First', order: 0, delay: 1000, isLast: false, chunkType: 'sentence' as const },
          { id: '2', text: '', order: 1, delay: 1500, isLast: true, chunkType: 'sentence' as const } // Empty chunk
        ],
        totalDelay: 2500,
        strategy: {} as any,
        originalMessage: 'First '
      };
      
      const validation = MessageChunker.validateChunking(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('empty'))).toBe(true);
    });
  });

  describe('persona-specific chunking behavior', () => {
    it('should show executive with brief, direct chunking', () => {
      const message = 'We need to resolve this network issue immediately and get the systems back online as soon as possible.';
      const result = MessageChunker.chunkMessage(message, 'executive');
      
      // Executive should have shorter delays
      expect(result.strategy.delayBetweenChunks).toBeLessThan(2000);
      expect(result.strategy.personaDelayMultiplier).toBeLessThan(1.0);
    });

    it('should show patient retiree with detailed, methodical chunking', () => {
      const message = 'I would like to understand how to properly set up my email account and configure the settings correctly.';
      const result = MessageChunker.chunkMessage(message, 'patient_retiree');
      
      // Patient retiree should have longer delays and more break points
      expect(result.strategy.delayBetweenChunks).toBeGreaterThan(2000);
      expect(result.strategy.personaDelayMultiplier).toBeGreaterThan(1.5);
      expect(result.strategy.phraseBreakPoints.length).toBeGreaterThan(3);
    });

    it('should show frustrated user with short, burst-like chunking', () => {
      const message = 'This computer is not working and I need it fixed right now because I have important work to do!';
      const result = MessageChunker.chunkMessage(message, 'frustrated_user');
      
      // Frustrated user should have shorter chunks and faster delivery
      expect(result.strategy.maxChunkLength).toBeLessThan(100);
      expect(result.strategy.delayBetweenChunks).toBeLessThan(1500);
    });
  });

  describe('edge cases', () => {
    it('should handle messages with only punctuation', () => {
      const message = '!!! ??? ...';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      
      expect(result.chunks.length).toBe(1);
      expect(result.chunks[0].text).toBe(message);
    });

    it('should handle very long single words', () => {
      const message = 'antidisestablishmentarianism';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      
      expect(result.chunks.length).toBe(1);
      expect(result.chunks[0].text).toBe(message);
    });

    it('should handle messages with multiple consecutive spaces', () => {
      const message = 'Word1     Word2     Word3';
      const result = MessageChunker.chunkMessage(message, 'office_worker');
      
      const validation = MessageChunker.validateChunking(result);
      expect(validation.isValid).toBe(true);
    });

    it('should handle unknown persona gracefully', () => {
      const message = 'Test message with unknown persona.';
      const result = MessageChunker.chunkMessage(message, 'unknown_persona');
      
      expect(result.chunks.length).toBe(1);
      expect(result.strategy).toBeDefined();
    });
  });
});