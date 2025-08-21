import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import templateGuidanceService, { 
  TemplateGuidance, 
  GuidanceRequest, 
  ContextualGuidance 
} from '../../services/templateGuidanceService';

describe('TemplateGuidanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Template Guidance Retrieval', () => {
    test('should get comprehensive guidance for ticket resolution template', async () => {
      const guidance = await templateGuidanceService.getTemplateGuidance('ticket-resolution');

      expect(guidance).toBeDefined();
      expect(guidance?.templateId).toBe('ticket-resolution');
      expect(guidance?.templateName).toBe('Ticket Resolution Documentation');
      expect(guidance?.description).toContain('Comprehensive template');
      expect(guidance?.sections).toBeInstanceOf(Array);
      expect(guidance?.sections.length).toBeGreaterThan(0);
      expect(guidance?.bestPractices).toBeInstanceOf(Array);
      expect(guidance?.examples).toBeInstanceOf(Array);
      expect(guidance?.commonMistakes).toBeInstanceOf(Array);
      expect(guidance?.tips).toBeInstanceOf(Array);
      expect(guidance?.version).toBeDefined();
      expect(guidance?.lastUpdated).toBeInstanceOf(Date);
    });

    test('should return null for non-existent template', async () => {
      const guidance = await templateGuidanceService.getTemplateGuidance('non-existent-template');
      expect(guidance).toBeNull();
    });

    test('should have required sections for ticket resolution template', async () => {
      const guidance = await templateGuidanceService.getTemplateGuidance('ticket-resolution');

      expect(guidance).toBeDefined();
      const sectionIds = guidance!.sections.map(s => s.sectionId);
      
      expect(sectionIds).toContain('problem-summary');
      expect(sectionIds).toContain('issue-description');
      expect(sectionIds).toContain('troubleshooting-steps');
      expect(sectionIds).toContain('root-cause');
      expect(sectionIds).toContain('solution-steps');

      // Check section details
      const problemSummary = guidance!.sections.find(s => s.sectionId === 'problem-summary');
      expect(problemSummary).toBeDefined();
      expect(problemSummary!.required).toBe(true);
      expect(problemSummary!.minLength).toBe(20);
      expect(problemSummary!.examples.length).toBeGreaterThan(0);
    });
  });

  describe('Contextual Guidance', () => {
    test('should provide contextual guidance for beginner user', async () => {
      const request: GuidanceRequest = {
        templateId: 'ticket-resolution',
        userLevel: 'beginner',
        context: 'writing'
      };

      const contextualGuidance = await templateGuidanceService.getContextualGuidance(request);

      expect(contextualGuidance).toBeDefined();
      expect(contextualGuidance.relevantSections).toBeInstanceOf(Array);
      expect(contextualGuidance.applicableTips).toBeInstanceOf(Array);
      expect(contextualGuidance.suggestedExamples).toBeInstanceOf(Array);
      expect(contextualGuidance.warnings).toBeInstanceOf(Array);
      expect(contextualGuidance.nextSteps).toBeInstanceOf(Array);

      // Should include basic examples for beginners
      const basicExamples = contextualGuidance.suggestedExamples.filter(e => e.complexity === 'basic');
      expect(basicExamples.length).toBeGreaterThanOrEqual(0);
    });

    test('should provide section-specific guidance', async () => {
      const request: GuidanceRequest = {
        templateId: 'ticket-resolution',
        sectionId: 'problem-summary',
        userLevel: 'intermediate',
        context: 'writing'
      };

      const contextualGuidance = await templateGuidanceService.getContextualGuidance(request);

      expect(contextualGuidance.relevantSections).toHaveLength(1);
      expect(contextualGuidance.relevantSections[0].sectionId).toBe('problem-summary');

      // Tips should be relevant to problem-summary section
      const relevantTips = contextualGuidance.applicableTips.filter(tip => 
        tip.context.includes('problem-summary') || tip.context.includes('all')
      );
      expect(relevantTips.length).toBeGreaterThan(0);
    });

    test('should filter tips by context', async () => {
      const writingRequest: GuidanceRequest = {
        templateId: 'ticket-resolution',
        userLevel: 'intermediate',
        context: 'writing'
      };

      const reviewingRequest: GuidanceRequest = {
        templateId: 'ticket-resolution',
        userLevel: 'intermediate',
        context: 'reviewing'
      };

      const writingGuidance = await templateGuidanceService.getContextualGuidance(writingRequest);
      const reviewingGuidance = await templateGuidanceService.getContextualGuidance(reviewingRequest);

      // Should have different tips based on context
      const writingTipIds = writingGuidance.applicableTips.map(t => t.id);
      const reviewingTipIds = reviewingGuidance.applicableTips.map(t => t.id);

      // There should be some overlap (always applicable tips) but also differences
      expect(writingTipIds).not.toEqual(reviewingTipIds);
    });

    test('should provide appropriate examples for user level', async () => {
      const beginnerRequest: GuidanceRequest = {
        templateId: 'ticket-resolution',
        userLevel: 'beginner'
      };

      const advancedRequest: GuidanceRequest = {
        templateId: 'ticket-resolution',
        userLevel: 'advanced'
      };

      const beginnerGuidance = await templateGuidanceService.getContextualGuidance(beginnerRequest);
      const advancedGuidance = await templateGuidanceService.getContextualGuidance(advancedRequest);

      // Advanced users should see more complex examples
      expect(advancedGuidance.suggestedExamples.length).toBeGreaterThanOrEqual(beginnerGuidance.suggestedExamples.length);

      const advancedExamples = advancedGuidance.suggestedExamples.filter(e => e.complexity === 'advanced');
      const beginnerAdvancedExamples = beginnerGuidance.suggestedExamples.filter(e => e.complexity === 'advanced');
      
      expect(advancedExamples.length).toBeGreaterThanOrEqual(beginnerAdvancedExamples.length);
    });
  });

  describe('Section-Specific Guidance', () => {
    test('should get guidance for specific section', async () => {
      const sectionGuidance = await templateGuidanceService.getSectionGuidance('ticket-resolution', 'problem-summary');

      expect(sectionGuidance).toBeDefined();
      expect(sectionGuidance!.sectionId).toBe('problem-summary');
      expect(sectionGuidance!.title).toBe('Problem Summary');
      expect(sectionGuidance!.description).toBeDefined();
      expect(sectionGuidance!.purpose).toBeDefined();
      expect(sectionGuidance!.required).toBe(true);
      expect(sectionGuidance!.examples).toBeInstanceOf(Array);
      expect(sectionGuidance!.examples.length).toBeGreaterThan(0);
      expect(sectionGuidance!.validationRules).toBeInstanceOf(Array);
    });

    test('should return null for non-existent section', async () => {
      const sectionGuidance = await templateGuidanceService.getSectionGuidance('ticket-resolution', 'non-existent-section');
      expect(sectionGuidance).toBeNull();
    });

    test('should include validation rules for sections', async () => {
      const sectionGuidance = await templateGuidanceService.getSectionGuidance('ticket-resolution', 'problem-summary');

      expect(sectionGuidance).toBeDefined();
      expect(sectionGuidance!.validationRules.length).toBeGreaterThan(0);

      const lengthRule = sectionGuidance!.validationRules.find(r => r.rule === 'min-length');
      expect(lengthRule).toBeDefined();
      expect(lengthRule!.severity).toBe('error');
      expect(lengthRule!.message).toContain('brief');
    });
  });

  describe('Examples and Scenarios', () => {
    test('should get examples for specific scenario', async () => {
      const examples = await templateGuidanceService.getExamplesForScenario('ticket-resolution', 'network', 'basic');

      expect(examples).toBeInstanceOf(Array);
      expect(examples.length).toBeGreaterThan(0);

      const networkExample = examples.find(e => e.scenario.toLowerCase().includes('network'));
      expect(networkExample).toBeDefined();
      expect(networkExample!.complexity).toBe('basic');
      expect(networkExample!.fullExample).toBeDefined();
      expect(Object.keys(networkExample!.fullExample).length).toBeGreaterThan(0);
    });

    test('should filter examples by complexity', async () => {
      const basicExamples = await templateGuidanceService.getExamplesForScenario('ticket-resolution', 'network', 'basic');
      const intermediateExamples = await templateGuidanceService.getExamplesForScenario('ticket-resolution', 'network', 'intermediate');

      // Should have different or same number based on available examples
      expect(basicExamples).toBeInstanceOf(Array);
      expect(intermediateExamples).toBeInstanceOf(Array);

      // Intermediate examples should include complex scenarios
      if (intermediateExamples.length > 0) {
        const complexExample = intermediateExamples.find(e => e.complexity === 'intermediate');
        expect(complexExample).toBeDefined();
      }
    });

    test('should include learning points in examples', async () => {
      const examples = await templateGuidanceService.getExamplesForScenario('ticket-resolution', 'network');

      if (examples.length > 0) {
        const example = examples[0];
        expect(example.learningPoints).toBeInstanceOf(Array);
        expect(example.learningPoints.length).toBeGreaterThan(0);
        
        example.learningPoints.forEach(point => {
          expect(typeof point).toBe('string');
          expect(point.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Best Practices', () => {
    test('should get all best practices for template', async () => {
      const bestPractices = await templateGuidanceService.getBestPractices('ticket-resolution');

      expect(bestPractices).toBeInstanceOf(Array);
      expect(bestPractices.length).toBeGreaterThan(0);

      const structurePractice = bestPractices.find(bp => bp.category === 'structure');
      expect(structurePractice).toBeDefined();
      expect(structurePractice!.title).toBeDefined();
      expect(structurePractice!.description).toBeDefined();
      expect(structurePractice!.importance).toBeDefined();
      expect(structurePractice!.example).toBeDefined();
    });

    test('should filter best practices by category', async () => {
      const contentPractices = await templateGuidanceService.getBestPractices('ticket-resolution', 'content');
      const languagePractices = await templateGuidanceService.getBestPractices('ticket-resolution', 'language');

      expect(contentPractices).toBeInstanceOf(Array);
      expect(languagePractices).toBeInstanceOf(Array);

      // All returned practices should match the requested category
      contentPractices.forEach(practice => {
        expect(practice.category).toBe('content');
      });

      languagePractices.forEach(practice => {
        expect(practice.category).toBe('language');
      });
    });

    test('should include importance levels in best practices', async () => {
      const bestPractices = await templateGuidanceService.getBestPractices('ticket-resolution');

      const criticalPractices = bestPractices.filter(bp => bp.importance === 'critical');
      const importantPractices = bestPractices.filter(bp => bp.importance === 'important');
      const recommendedPractices = bestPractices.filter(bp => bp.importance === 'recommended');

      expect(criticalPractices.length).toBeGreaterThan(0);
      expect(importantPractices.length).toBeGreaterThanOrEqual(0);
      expect(recommendedPractices.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Common Mistakes', () => {
    test('should get common mistakes for template', async () => {
      const mistakes = await templateGuidanceService.getCommonMistakes('ticket-resolution');

      expect(mistakes).toBeInstanceOf(Array);
      expect(mistakes.length).toBeGreaterThan(0);

      const mistake = mistakes[0];
      expect(mistake.title).toBeDefined();
      expect(mistake.description).toBeDefined();
      expect(mistake.wrongExample).toBeDefined();
      expect(mistake.correctExample).toBeDefined();
      expect(mistake.prevention).toBeDefined();
      expect(mistake.frequency).toBeDefined();
      expect(mistake.impact).toBeDefined();
    });

    test('should filter mistakes by section', async () => {
      const problemSummaryMistakes = await templateGuidanceService.getCommonMistakes('ticket-resolution', 'problem-summary');
      const allMistakes = await templateGuidanceService.getCommonMistakes('ticket-resolution');

      expect(problemSummaryMistakes).toBeInstanceOf(Array);
      expect(allMistakes).toBeInstanceOf(Array);
      expect(problemSummaryMistakes.length).toBeLessThanOrEqual(allMistakes.length);

      // All returned mistakes should be for the specified section or 'all'
      problemSummaryMistakes.forEach(mistake => {
        expect(['problem-summary', 'all']).toContain(mistake.section);
      });
    });

    test('should sort mistakes by frequency and impact', async () => {
      const mistakes = await templateGuidanceService.getCommonMistakes('ticket-resolution');

      if (mistakes.length > 1) {
        // First mistake should be high frequency or high impact
        const firstMistake = mistakes[0];
        expect(['common', 'high']).toContain(firstMistake.frequency || firstMistake.impact);
      }
    });
  });

  describe('Writing Tips', () => {
    test('should get writing tips for specific timing', async () => {
      const beforeWritingTips = await templateGuidanceService.getWritingTips('ticket-resolution', 'before-writing');
      const whileWritingTips = await templateGuidanceService.getWritingTips('ticket-resolution', 'while-writing');

      expect(beforeWritingTips).toBeInstanceOf(Array);
      expect(whileWritingTips).toBeInstanceOf(Array);

      // Tips should match requested timing or be 'always' applicable
      beforeWritingTips.forEach(tip => {
        expect(['before-writing', 'always']).toContain(tip.timing);
      });

      whileWritingTips.forEach(tip => {
        expect(['while-writing', 'always']).toContain(tip.timing);
      });
    });

    test('should sort tips by priority', async () => {
      const tips = await templateGuidanceService.getWritingTips('ticket-resolution', 'while-writing');

      if (tips.length > 1) {
        // First tip should be high priority
        expect(tips[0].priority).toBe('high');
        
        // Verify sorting order
        for (let i = 1; i < tips.length; i++) {
          const currentPriority = tips[i].priority;
          const previousPriority = tips[i - 1].priority;
          
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          expect(priorityOrder[previousPriority]).toBeGreaterThanOrEqual(priorityOrder[currentPriority]);
        }
      }
    });

    test('should include different tip types', async () => {
      const tips = await templateGuidanceService.getWritingTips('ticket-resolution');

      const tipTypes = [...new Set(tips.map(t => t.type))];
      expect(tipTypes.length).toBeGreaterThan(0);
      
      // Should have variety of tip types
      const expectedTypes = ['quick-tip', 'pro-tip', 'warning', 'best-practice'];
      const hasVariety = tipTypes.some(type => expectedTypes.includes(type));
      expect(hasVariety).toBe(true);
    });
  });

  describe('Improvement Suggestions', () => {
    test('should generate improvement suggestions based on content', async () => {
      const mockContent = {
        'problem-summary': 'Short', // Too short
        // Missing required sections
      };

      const suggestions = await templateGuidanceService.generateImprovementSuggestions('ticket-resolution', mockContent);

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);

      // Should have high priority suggestions for missing required content
      const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
      expect(highPrioritySuggestions.length).toBeGreaterThan(0);

      // Should suggest expanding short content
      const lengthSuggestion = suggestions.find(s => s.content.includes('more detail') || s.content.includes('expand'));
      expect(lengthSuggestion).toBeDefined();
    });

    test('should suggest format improvements', async () => {
      const mockContent = {
        'problem-summary': 'User has network issues and cannot access shared drives',
        'troubleshooting-steps': 'Checked network, tested connectivity, verified permissions', // Should be list format
        'solution-steps': 'Restarted service and verified operation' // Should be list format
      };

      const suggestions = await templateGuidanceService.generateImprovementSuggestions('ticket-resolution', mockContent);

      const formatSuggestions = suggestions.filter(s => 
        s.content.includes('list') || s.content.includes('format')
      );
      expect(formatSuggestions.length).toBeGreaterThan(0);
    });

    test('should provide actionable suggestions', async () => {
      const mockContent = {
        'problem-summary': 'User problem with computer',
        'issue-description': 'Computer not working',
        'root-cause': 'Issue with system'
      };

      const suggestions = await templateGuidanceService.generateImprovementSuggestions('ticket-resolution', mockContent);

      suggestions.forEach(suggestion => {
        expect(suggestion.content).toBeDefined();
        expect(suggestion.content.length).toBeGreaterThan(0);
        expect(suggestion.context).toBeInstanceOf(Array);
        expect(suggestion.context.length).toBeGreaterThan(0);
        expect(suggestion.timing).toBeDefined();
        expect(suggestion.priority).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent template gracefully', async () => {
      const request: GuidanceRequest = {
        templateId: 'non-existent-template',
        userLevel: 'beginner'
      };

      await expect(
        templateGuidanceService.getContextualGuidance(request)
      ).rejects.toThrow('Template non-existent-template not found');
    });

    test('should handle empty content for improvement suggestions', async () => {
      const suggestions = await templateGuidanceService.generateImprovementSuggestions('ticket-resolution', {});

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should suggest adding required content
      const requiredSuggestions = suggestions.filter(s => 
        s.title.includes('Required') || s.content.includes('required')
      );
      expect(requiredSuggestions.length).toBeGreaterThan(0);
    });

    test('should return empty arrays for non-existent template methods', async () => {
      const bestPractices = await templateGuidanceService.getBestPractices('non-existent-template');
      const mistakes = await templateGuidanceService.getCommonMistakes('non-existent-template');
      const tips = await templateGuidanceService.getWritingTips('non-existent-template');
      const examples = await templateGuidanceService.getExamplesForScenario('non-existent-template', 'scenario');

      expect(bestPractices).toEqual([]);
      expect(mistakes).toEqual([]);
      expect(tips).toEqual([]);
      expect(examples).toEqual([]);
    });
  });

  describe('Performance and Caching', () => {
    test('should retrieve guidance efficiently', async () => {
      const startTime = Date.now();
      
      const guidance = await templateGuidanceService.getTemplateGuidance('ticket-resolution');
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(guidance).toBeDefined();
      expect(duration).toBeLessThan(100); // Should be very fast (cached/in-memory)
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        templateGuidanceService.getTemplateGuidance('ticket-resolution')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result!.templateId).toBe('ticket-resolution');
      });
    });
  });

  describe('Template Validation', () => {
    test('should validate template structure', async () => {
      const guidance = await templateGuidanceService.getTemplateGuidance('ticket-resolution');

      expect(guidance).toBeDefined();
      
      // Validate template structure
      expect(guidance!.templateId).toBeDefined();
      expect(guidance!.templateName).toBeDefined();
      expect(guidance!.description).toBeDefined();
      expect(guidance!.sections).toBeInstanceOf(Array);
      expect(guidance!.bestPractices).toBeInstanceOf(Array);
      expect(guidance!.examples).toBeInstanceOf(Array);
      expect(guidance!.commonMistakes).toBeInstanceOf(Array);
      expect(guidance!.tips).toBeInstanceOf(Array);
      expect(guidance!.version).toBeDefined();
      expect(guidance!.lastUpdated).toBeInstanceOf(Date);

      // Validate section structure
      guidance!.sections.forEach(section => {
        expect(section.sectionId).toBeDefined();
        expect(section.title).toBeDefined();
        expect(section.description).toBeDefined();
        expect(section.purpose).toBeDefined();
        expect(typeof section.required).toBe('boolean');
        expect(section.placeholder).toBeDefined();
        expect(section.examples).toBeInstanceOf(Array);
        expect(section.validationRules).toBeInstanceOf(Array);
        expect(section.relatedSections).toBeInstanceOf(Array);
      });
    });
  });
});