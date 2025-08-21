import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import qualityValidatorService, { 
  DocumentationContent, 
  DocumentationQuality, 
  ValidationResult 
} from '../../services/qualityValidator';

describe('QualityValidatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Documentation Quality Validation', () => {
    test('should validate complete, high-quality documentation', async () => {
      const goodContent: DocumentationContent = {
        problemSummary: 'User unable to access shared network drive resulting in inability to complete daily tasks',
        issueDescription: 'User reports that when attempting to map the G: drive using \\\\server\\shared, they receive "Network path not found" error. Issue started this morning around 9 AM. User confirmed they can access other network resources normally.',
        customerImpact: 'Unable to access project files needed for daily work, blocking task completion',
        urgencyLevel: 'high',
        troubleshootingSteps: [
          'Verified user credentials and account status',
          'Tested network connectivity with ping to server',
          'Checked DNS resolution for server name',
          'Attempted manual IP connection',
          'Verified server share permissions'
        ],
        diagnosticResults: 'Network connectivity confirmed, DNS resolving correctly, authentication service showing errors',
        rootCause: 'Network authentication service was experiencing intermittent timeouts due to high server load during backup operations scheduled at 8:30 AM daily',
        contributingFactors: 'Daily backup operations causing high server load',
        preventionMeasures: 'Schedule backup operations during off-peak hours, implement load balancing',
        solutionSteps: [
          'Coordinated with server team to temporarily pause backup operations',
          'Restarted network authentication service',
          'Verified service startup and normal operation',
          'Tested user connection to shared drive',
          'Confirmed successful mapping and file access'
        ],
        verificationTesting: 'Verified user can successfully map G: drive and access files. Confirmed normal operation for 30 minutes with no errors.',
        customerConfirmation: 'Customer confirmed full access restored and normal operation',
        resolutionTime: 45,
        resourcesUsed: ['Knowledge base article KB-001', 'Server team consultation'],
        knowledgeGained: 'Backup operations can impact authentication services',
        followupActions: ['Monitor authentication service during future backups', 'Schedule backup time review']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(goodContent);

      expect(quality).toBeDefined();
      expect(quality.passed).toBe(true);
      expect(quality.overallScore).toBeGreaterThanOrEqual(85);
      expect(quality.completenessScore).toBeGreaterThanOrEqual(90);
      expect(quality.clarityScore).toBeGreaterThanOrEqual(80);
      expect(quality.usefulnessScore).toBeGreaterThanOrEqual(85);
      expect(quality.professionalScore).toBeGreaterThanOrEqual(85);
      expect(quality.validationResults).toBeInstanceOf(Array);
      expect(quality.suggestions).toBeInstanceOf(Array);
      expect(quality.timestamp).toBeInstanceOf(Date);
    });

    test('should identify issues in poor quality documentation', async () => {
      const poorContent: DocumentationContent = {
        problemSummary: 'Broken', // Too short
        issueDescription: 'User sad', // Too short and vague
        troubleshootingSteps: [], // Empty
        rootCause: '', // Empty
        solutionSteps: [] // Empty
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(poorContent);

      expect(quality).toBeDefined();
      expect(quality.passed).toBe(false);
      expect(quality.overallScore).toBeLessThan(70);
      expect(quality.completenessScore).toBeLessThan(50);
      
      const errors = quality.validationResults.filter(r => r.severity === 'error' && !r.passed);
      expect(errors.length).toBeGreaterThan(0);
      
      const errorMessages = errors.map(e => e.rule);
      expect(errorMessages).toContain('Required field: Root Cause Analysis');
      expect(errorMessages).toContain('Required field: Solution Steps');
    });

    test('should provide specific improvement suggestions', async () => {
      const mediocreContent: DocumentationContent = {
        problemSummary: 'The system was broken and users complained',
        issueDescription: 'Something went wrong with the server and it was not working properly for users',
        troubleshootingSteps: ['Checked stuff', 'Fixed it'],
        rootCause: 'Server issue',
        solutionSteps: ['Restarted server']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(mediocreContent);

      expect(quality.suggestions.length).toBeGreaterThan(0);
      
      const suggestionTitles = quality.suggestions.map(s => s.title);
      expect(suggestionTitles.some(title => title.includes('specific') || title.includes('detail'))).toBe(true);
      
      const highPrioritySuggestions = quality.suggestions.filter(s => s.priority === 'high');
      expect(highPrioritySuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Completeness Validation', () => {
    test('should check for required fields', async () => {
      const incompleteContent: DocumentationContent = {
        problemSummary: 'User cannot access network resources',
        // Missing required fields
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(incompleteContent);

      const completenessResults = quality.validationResults.filter(r => r.category === 'completeness');
      expect(completenessResults.length).toBeGreaterThan(0);

      const requiredFieldErrors = completenessResults.filter(r => 
        r.rule.includes('Required field') && !r.passed
      );
      expect(requiredFieldErrors.length).toBeGreaterThan(0);
    });

    test('should check minimum content length', async () => {
      const shortContent: DocumentationContent = {
        problemSummary: 'Short', // Under minimum length
        issueDescription: 'Also short', // Under minimum length
        rootCause: 'Brief', // Under minimum length
        troubleshootingSteps: ['Step 1'],
        solutionSteps: ['Fixed it']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(shortContent);

      const lengthResults = quality.validationResults.filter(r => 
        r.rule.includes('Minimum content length') && !r.passed
      );
      expect(lengthResults.length).toBeGreaterThan(0);
    });
  });

  describe('Clarity Validation', () => {
    test('should detect excessive passive voice', async () => {
      const passiveContent: DocumentationContent = {
        problemSummary: 'The server was accessed by the user and was found to be broken',
        issueDescription: 'The network was tested and was determined to be functioning, but the server was discovered to be unresponsive',
        rootCause: 'The service was stopped and was not being monitored',
        troubleshootingSteps: ['Network was tested', 'Server was checked'],
        solutionSteps: ['Service was restarted', 'Monitoring was enabled']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(passiveContent);

      const passiveVoiceResults = quality.validationResults.filter(r => 
        r.rule.includes('passive voice')
      );
      expect(passiveVoiceResults.length).toBeGreaterThan(0);
    });

    test('should check sentence length for readability', async () => {
      const longSentenceContent: DocumentationContent = {
        problemSummary: 'The user who works in the accounting department and has been with the company for five years reported that they were unable to access the shared network drive that contains all the important financial documents and spreadsheets that are needed for daily operations',
        issueDescription: 'When the user attempts to map the network drive using the standard procedure that has been in place for several months, they encounter an error message that indicates the network path cannot be found',
        rootCause: 'Investigation revealed that the network authentication service was experiencing intermittent timeouts due to high server load',
        troubleshootingSteps: ['Checked network'],
        solutionSteps: ['Fixed issue']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(longSentenceContent);

      const sentenceLengthResults = quality.validationResults.filter(r => 
        r.rule.includes('sentence length')
      );
      expect(sentenceLengthResults.length).toBeGreaterThan(0);
    });
  });

  describe('Professional Standards Validation', () => {
    test('should detect casual language', async () => {
      const casualContent: DocumentationContent = {
        problemSummary: 'User kinda had issues with the network thing',
        issueDescription: 'Yeah, so the user was like having problems and stuff',
        rootCause: 'The server was sorta broken or whatever',
        troubleshootingSteps: ['Checked stuff', 'Fixed things'],
        solutionSteps: ['Did some things', 'Made it work']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(casualContent);

      const professionalResults = quality.validationResults.filter(r => 
        r.category === 'professional' && r.rule.includes('Professional language')
      );
      expect(professionalResults.length).toBeGreaterThan(0);
      expect(professionalResults[0].passed).toBe(false);
    });

    test('should check for proper capitalization', async () => {
      const poorCapitalizationContent: DocumentationContent = {
        problemSummary: 'user cannot access network. server appears down.',
        issueDescription: 'the network connection fails. error messages appear.',
        rootCause: 'authentication service stopped working. no alerts were sent.',
        troubleshootingSteps: ['checked network', 'tested connection'],
        solutionSteps: ['restarted service', 'verified operation']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(poorCapitalizationContent);

      const capitalizationResults = quality.validationResults.filter(r => 
        r.rule.includes('capitalization')
      );
      expect(capitalizationResults.length).toBeGreaterThan(0);
    });

    test('should check for customer impact documentation', async () => {
      const noImpactContent: DocumentationContent = {
        problemSummary: 'Network issue occurred on the server',
        issueDescription: 'Server was not responding to network requests',
        rootCause: 'Authentication service failure',
        troubleshootingSteps: ['Checked server', 'Tested network'],
        solutionSteps: ['Restarted service', 'Verified operation']
        // Missing customerImpact field
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(noImpactContent);

      const impactResults = quality.validationResults.filter(r => 
        r.rule.includes('Customer impact')
      );
      expect(impactResults.length).toBeGreaterThan(0);
      expect(impactResults[0].passed).toBe(false);
    });
  });

  describe('Content Quality Validation', () => {
    test('should detect generic phrases', async () => {
      const genericContent: DocumentationContent = {
        problemSummary: 'The system was broken and it worked after we fixed the issue',
        issueDescription: 'User had problems with the system and we did some troubleshooting',
        rootCause: 'It was broken due to system issues',
        troubleshootingSteps: ['Checked everything', 'Fixed the problem'],
        solutionSteps: ['Resolved the issue', 'Made it work']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(genericContent);

      const specificityResults = quality.validationResults.filter(r => 
        r.rule.includes('Specific, actionable content')
      );
      expect(specificityResults.length).toBeGreaterThan(0);
    });

    test('should recognize measurable outcomes', async () => {
      const measurableContent: DocumentationContent = {
        problemSummary: 'User unable to access network drive',
        issueDescription: 'Network response time increased to 5000ms',
        rootCause: 'High server load during backup operations',
        troubleshootingSteps: ['Measured response time', 'Checked server load'],
        solutionSteps: ['Optimized backup schedule', 'Reduced server load by 40%'],
        verificationTesting: 'Response time reduced to 200ms, 99% success rate over 30 minutes'
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(measurableContent);

      const measurableResults = quality.validationResults.filter(r => 
        r.rule.includes('Measurable verification results')
      );
      expect(measurableResults.length).toBeGreaterThan(0);
      expect(measurableResults[0].passed).toBe(true);
    });
  });

  describe('Score Calculation', () => {
    test('should calculate weighted overall score correctly', async () => {
      const testContent: DocumentationContent = {
        problemSummary: 'User unable to access shared network drive resulting in inability to complete daily tasks',
        issueDescription: 'Detailed description of the network access issue with specific error messages and timing information',
        rootCause: 'Network authentication service experiencing timeouts due to server load',
        troubleshootingSteps: ['Step 1', 'Step 2', 'Step 3'],
        solutionSteps: ['Solution step 1', 'Solution step 2']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(testContent);

      // Overall score should be weighted average of component scores
      const expectedScore = Math.round(
        quality.completenessScore * 0.3 +
        quality.clarityScore * 0.25 +
        quality.usefulnessScore * 0.2 +
        quality.professionalScore * 0.25
      );

      expect(quality.overallScore).toBe(expectedScore);
    });

    test('should calculate category scores based on validation results', async () => {
      const testContent: DocumentationContent = {
        problemSummary: 'Test summary that meets basic requirements',
        troubleshootingSteps: ['Basic troubleshooting step'],
        solutionSteps: ['Basic solution step']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(testContent);

      expect(quality.completenessScore).toBeGreaterThanOrEqual(0);
      expect(quality.completenessScore).toBeLessThanOrEqual(100);
      expect(quality.clarityScore).toBeGreaterThanOrEqual(0);
      expect(quality.clarityScore).toBeLessThanOrEqual(100);
      expect(quality.usefulnessScore).toBeGreaterThanOrEqual(0);
      expect(quality.usefulnessScore).toBeLessThanOrEqual(100);
      expect(quality.professionalScore).toBeGreaterThanOrEqual(0);
      expect(quality.professionalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Improvement Suggestions', () => {
    test('should prioritize critical errors', async () => {
      const criticalErrorContent: DocumentationContent = {
        problemSummary: 'Issue', // Too short - critical error
        // Missing required fields - critical errors
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(criticalErrorContent);

      const highPrioritySuggestions = quality.suggestions.filter(s => s.priority === 'high');
      expect(highPrioritySuggestions.length).toBeGreaterThan(0);

      const criticalSuggestions = quality.suggestions.filter(s => s.title.includes('Critical'));
      expect(criticalSuggestions.length).toBeGreaterThan(0);
    });

    test('should provide actionable improvement steps', async () => {
      const improvableContent: DocumentationContent = {
        problemSummary: 'User has computer problems that need fixing',
        issueDescription: 'The computer is not working right and needs help',
        rootCause: 'Something is wrong',
        troubleshootingSteps: ['Looked at computer'],
        solutionSteps: ['Fixed it']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(improvableContent);

      expect(quality.suggestions.length).toBeGreaterThan(0);
      
      quality.suggestions.forEach(suggestion => {
        expect(suggestion.actionRequired).toBeDefined();
        expect(suggestion.actionRequired.length).toBeGreaterThan(0);
        expect(suggestion.description).toBeDefined();
        expect(suggestion.description.length).toBeGreaterThan(0);
      });
    });

    test('should include examples for improvement', async () => {
      const needsExamplesContent: DocumentationContent = {
        problemSummary: 'Problem Summary', // Matches rule that has examples
        troubleshootingSteps: ['Generic step'],
        solutionSteps: ['Generic solution']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(needsExamplesContent);

      const suggestionsWithExamples = quality.suggestions.filter(s => s.example);
      expect(suggestionsWithExamples.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Summary', () => {
    test('should generate comprehensive validation summary', async () => {
      const testContent: DocumentationContent = {
        problemSummary: 'User unable to access network drive',
        issueDescription: 'Network drive mapping fails with error',
        rootCause: 'Authentication service timeout',
        troubleshootingSteps: ['Checked network', 'Tested auth'],
        solutionSteps: ['Restarted service', 'Verified access']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(testContent);
      const summary = await qualityValidatorService.getValidationSummary(quality);

      expect(summary).toBeDefined();
      expect(summary).toContain('Quality Assessment:');
      expect(summary).toContain(quality.passed ? 'PASSED' : 'NEEDS IMPROVEMENT');
      expect(summary).toContain(`${quality.overallScore}/100`);
      expect(summary).toContain('Completeness:');
      expect(summary).toContain('Clarity:');
      expect(summary).toContain('Usefulness:');
      expect(summary).toContain('Professional:');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty content', async () => {
      const emptyContent: DocumentationContent = {};

      const quality = await qualityValidatorService.validateDocumentationQuality(emptyContent);

      expect(quality).toBeDefined();
      expect(quality.passed).toBe(false);
      expect(quality.overallScore).toBeLessThan(70);
      expect(quality.validationResults.length).toBeGreaterThan(0);
    });

    test('should handle content with only whitespace', async () => {
      const whitespaceContent: DocumentationContent = {
        problemSummary: '   ',
        issueDescription: '\t\n  ',
        rootCause: '    \n\t  '
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(whitespaceContent);

      expect(quality.passed).toBe(false);
      
      const emptyFieldErrors = quality.validationResults.filter(r => 
        !r.passed && r.rule.includes('Required field')
      );
      expect(emptyFieldErrors.length).toBeGreaterThan(0);
    });

    test('should handle extremely long content', async () => {
      const longContent = 'x'.repeat(50000);
      
      const extremeContent: DocumentationContent = {
        problemSummary: longContent,
        issueDescription: longContent,
        rootCause: longContent,
        troubleshootingSteps: [longContent],
        solutionSteps: [longContent]
      };

      const startTime = Date.now();
      const quality = await qualityValidatorService.validateDocumentationQuality(extremeContent);
      const endTime = Date.now();

      expect(quality).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle special characters and unicode', async () => {
      const unicodeContent: DocumentationContent = {
        problemSummary: 'User unable to access résumé folder with UTF-8 characters: ñáéíóú',
        issueDescription: 'File paths containing unicode characters (™, ©, ®) causing access issues',
        rootCause: 'Character encoding mismatch in file system paths',
        troubleshootingSteps: ['Tested ASCII paths ✓', 'Tested Unicode paths ✗'],
        solutionSteps: ['Updated file system encoding', 'Verified unicode support']
      };

      const quality = await qualityValidatorService.validateDocumentationQuality(unicodeContent);

      expect(quality).toBeDefined();
      expect(quality.validationResults).toBeInstanceOf(Array);
    });
  });
});