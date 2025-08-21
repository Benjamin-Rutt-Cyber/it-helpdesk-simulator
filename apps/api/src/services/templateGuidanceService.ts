/**
 * Template Guidance Service
 * Provides contextual help, examples, and best practices for documentation templates
 */

export interface TemplateGuidance {
  templateId: string;
  templateName: string;
  description: string;
  sections: GuidanceSection[];
  bestPractices: BestPractice[];
  examples: TemplateExample[];
  commonMistakes: CommonMistake[];
  tips: GuidanceTip[];
  version: string;
  lastUpdated: Date;
}

export interface GuidanceSection {
  sectionId: string;
  title: string;
  description: string;
  purpose: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  format?: 'text' | 'list' | 'structured' | 'numeric';
  placeholder: string;
  examples: string[];
  validationRules: ValidationRule[];
  relatedSections: string[];
}

export interface BestPractice {
  id: string;
  category: 'structure' | 'content' | 'language' | 'formatting' | 'process';
  title: string;
  description: string;
  importance: 'critical' | 'important' | 'recommended';
  example: string;
  antiExample?: string;
  applicableSections: string[];
}

export interface TemplateExample {
  id: string;
  title: string;
  scenario: string;
  industry?: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  fullExample: Record<string, string>;
  highlights: ExampleHighlight[];
  learningPoints: string[];
}

export interface CommonMistake {
  id: string;
  title: string;
  description: string;
  section: string;
  frequency: 'common' | 'occasional' | 'rare';
  impact: 'high' | 'medium' | 'low';
  wrongExample: string;
  correctExample: string;
  prevention: string;
}

export interface GuidanceTip {
  id: string;
  type: 'quick-tip' | 'pro-tip' | 'warning' | 'best-practice';
  title: string;
  content: string;
  context: string[];
  timing: 'before-writing' | 'while-writing' | 'after-writing' | 'always';
  priority: 'high' | 'medium' | 'low';
}

export interface ValidationRule {
  rule: string;
  description: string;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
}

export interface ExampleHighlight {
  section: string;
  text: string;
  explanation: string;
  why: string;
}

export interface GuidanceRequest {
  templateId: string;
  sectionId?: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  context?: 'writing' | 'reviewing' | 'improving';
  specificNeed?: 'examples' | 'best-practices' | 'common-mistakes' | 'tips';
}

export interface ContextualGuidance {
  relevantSections: GuidanceSection[];
  applicableTips: GuidanceTip[];
  suggestedExamples: TemplateExample[];
  warnings: CommonMistake[];
  nextSteps: string[];
}

class TemplateGuidanceService {
  private templates: Map<string, TemplateGuidance> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Get comprehensive guidance for a template
   */
  async getTemplateGuidance(templateId: string): Promise<TemplateGuidance | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get contextual guidance based on current context
   */
  async getContextualGuidance(request: GuidanceRequest): Promise<ContextualGuidance> {
    const template = this.templates.get(request.templateId);
    if (!template) {
      throw new Error(`Template ${request.templateId} not found`);
    }

    const relevantSections = request.sectionId 
      ? template.sections.filter(s => s.sectionId === request.sectionId)
      : template.sections;

    const applicableTips = this.filterTipsByContext(template.tips, request);
    const suggestedExamples = this.filterExamplesByLevel(template.examples, request.userLevel);
    const warnings = this.getRelevantMistakes(template.commonMistakes, request.sectionId);
    const nextSteps = this.generateNextSteps(template, request);

    return {
      relevantSections,
      applicableTips,
      suggestedExamples,
      warnings,
      nextSteps
    };
  }

  /**
   * Get section-specific guidance
   */
  async getSectionGuidance(templateId: string, sectionId: string): Promise<GuidanceSection | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    return template.sections.find(s => s.sectionId === sectionId) || null;
  }

  /**
   * Get examples for specific scenario
   */
  async getExamplesForScenario(
    templateId: string, 
    scenario: string, 
    complexity: TemplateExample['complexity'] = 'basic'
  ): Promise<TemplateExample[]> {
    const template = this.templates.get(templateId);
    if (!template) return [];

    return template.examples.filter(example => 
      example.scenario.toLowerCase().includes(scenario.toLowerCase()) &&
      (complexity === 'basic' || example.complexity === complexity)
    );
  }

  /**
   * Get best practices for specific category
   */
  async getBestPractices(
    templateId: string, 
    category?: BestPractice['category']
  ): Promise<BestPractice[]> {
    const template = this.templates.get(templateId);
    if (!template) return [];

    return template.bestPractices.filter(practice => 
      !category || practice.category === category
    );
  }

  /**
   * Get common mistakes to avoid
   */
  async getCommonMistakes(
    templateId: string, 
    sectionId?: string
  ): Promise<CommonMistake[]> {
    const template = this.templates.get(templateId);
    if (!template) return [];

    return template.commonMistakes.filter(mistake => 
      !sectionId || mistake.section === sectionId
    );
  }

  /**
   * Get real-time writing tips
   */
  async getWritingTips(
    templateId: string, 
    timing: GuidanceTip['timing'] = 'while-writing'
  ): Promise<GuidanceTip[]> {
    const template = this.templates.get(templateId);
    if (!template) return [];

    return template.tips.filter(tip => 
      tip.timing === timing || tip.timing === 'always'
    ).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate improvement suggestions based on content analysis
   */
  async generateImprovementSuggestions(
    templateId: string,
    content: Record<string, string>
  ): Promise<GuidanceTip[]> {
    const template = this.templates.get(templateId);
    if (!template) return [];

    const suggestions: GuidanceTip[] = [];

    // Analyze content and generate specific suggestions
    template.sections.forEach(section => {
      const sectionContent = content[section.sectionId] || '';
      
      // Check length requirements
      if (section.minLength && sectionContent.length < section.minLength) {
        suggestions.push({
          id: `suggestion_length_${section.sectionId}`,
          type: 'warning',
          title: `Expand ${section.title}`,
          content: `The ${section.title} section needs more detail. Current: ${sectionContent.length} characters, minimum: ${section.minLength}`,
          context: [section.sectionId],
          timing: 'while-writing',
          priority: 'high'
        });
      }

      // Check for empty required sections
      if (section.required && !sectionContent.trim()) {
        suggestions.push({
          id: `suggestion_required_${section.sectionId}`,
          type: 'warning',
          title: `Complete Required Section: ${section.title}`,
          content: `${section.title} is required. ${section.description}`,
          context: [section.sectionId],
          timing: 'while-writing',
          priority: 'high'
        });
      }

      // Check format compliance
      if (section.format === 'list' && sectionContent && !sectionContent.includes('\n') && !sectionContent.includes('•')) {
        suggestions.push({
          id: `suggestion_format_${section.sectionId}`,
          type: 'pro-tip',
          title: `Format as List: ${section.title}`,
          content: 'Consider formatting this content as a numbered or bulleted list for better readability',
          context: [section.sectionId],
          timing: 'while-writing',
          priority: 'medium'
        });
      }
    });

    return suggestions;
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates(): void {
    // Ticket Resolution Documentation Template
    const ticketResolutionTemplate: TemplateGuidance = {
      templateId: 'ticket-resolution',
      templateName: 'Ticket Resolution Documentation',
      description: 'Comprehensive template for documenting IT support ticket resolutions',
      sections: [
        {
          sectionId: 'problem-summary',
          title: 'Problem Summary',
          description: 'Brief, clear description of the issue',
          purpose: 'Quickly communicate what went wrong for future reference',
          required: true,
          minLength: 20,
          maxLength: 200,
          format: 'text',
          placeholder: 'User unable to access shared network drive resulting in inability to complete daily tasks',
          examples: [
            'User unable to access shared network drive resulting in inability to complete daily tasks',
            'Email client crashes when attempting to send attachments larger than 10MB',
            'Network printer offline preventing department from printing reports'
          ],
          validationRules: [
            {
              rule: 'min-length',
              description: 'Must be at least 20 characters',
              severity: 'error',
              message: 'Problem summary too brief - provide more detail'
            }
          ],
          relatedSections: ['issue-description', 'customer-impact']
        },
        {
          sectionId: 'issue-description',
          title: 'Issue Description',
          description: 'Detailed explanation of the problem including symptoms and context',
          purpose: 'Provide comprehensive understanding of the issue for thorough troubleshooting',
          required: true,
          minLength: 50,
          format: 'text',
          placeholder: 'User reports that when attempting to map the G: drive using \\\\server\\shared, they receive "Network path not found" error. Issue started this morning around 9 AM.',
          examples: [
            'User reports that when attempting to map the G: drive using \\\\server\\shared, they receive "Network path not found" error. Issue started this morning around 9 AM. User confirmed they can access other network resources normally.',
            'Customer\'s Outlook application crashes immediately when trying to attach files larger than 10MB. Error message displays "Outlook has stopped working" with no additional details. Issue affects all file types and began after yesterday\'s Windows update.'
          ],
          validationRules: [
            {
              rule: 'detail-level',
              description: 'Should include specific error messages and timing',
              severity: 'warning',
              message: 'Consider adding specific error messages and when the issue started'
            }
          ],
          relatedSections: ['problem-summary', 'troubleshooting-steps']
        },
        {
          sectionId: 'troubleshooting-steps',
          title: 'Troubleshooting Steps',
          description: 'Step-by-step documentation of diagnostic procedures performed',
          purpose: 'Document the investigative process for learning and future reference',
          required: true,
          format: 'list',
          placeholder: '1. Verified network connectivity with ping test\n2. Checked DNS resolution\n3. Tested alternative access methods',
          examples: [
            '1. Verified user credentials and account status\n2. Tested network connectivity with ping to server\n3. Checked DNS resolution for server name\n4. Attempted manual IP connection\n5. Verified server share permissions',
            '1. Reproduced error with test attachment\n2. Checked Outlook version and updates\n3. Tested in safe mode\n4. Reviewed Windows event logs\n5. Tested with different file types and sizes'
          ],
          validationRules: [
            {
              rule: 'step-format',
              description: 'Should be formatted as numbered steps',
              severity: 'suggestion',
              message: 'Format as numbered list for clarity'
            }
          ],
          relatedSections: ['issue-description', 'root-cause']
        },
        {
          sectionId: 'root-cause',
          title: 'Root Cause Analysis',
          description: 'Identification of the underlying cause of the problem',
          purpose: 'Understand why the issue occurred to prevent recurrence',
          required: true,
          minLength: 30,
          format: 'text',
          placeholder: 'Network authentication service was experiencing intermittent timeouts due to high server load during backup operations',
          examples: [
            'Network authentication service was experiencing intermittent timeouts due to high server load during backup operations scheduled at 8:30 AM daily',
            'Recent Windows update changed Outlook attachment handling, introducing file size limitation bug that affects files over 10MB when using specific compression formats'
          ],
          validationRules: [
            {
              rule: 'specificity',
              description: 'Should identify specific technical cause',
              severity: 'warning',
              message: 'Provide specific technical root cause rather than general statement'
            }
          ],
          relatedSections: ['troubleshooting-steps', 'solution-steps']
        },
        {
          sectionId: 'solution-steps',
          title: 'Solution Implementation',
          description: 'Detailed steps taken to resolve the issue',
          purpose: 'Document the resolution process for replication and learning',
          required: true,
          format: 'list',
          placeholder: '1. Restarted authentication service\n2. Verified connectivity restored\n3. Tested user access',
          examples: [
            '1. Coordinated with server team to temporarily pause backup operations\n2. Restarted network authentication service\n3. Verified service startup and normal operation\n4. Tested user connection to shared drive\n5. Confirmed successful mapping and file access',
            '1. Downloaded and installed latest Outlook update from Microsoft\n2. Restarted Outlook application\n3. Tested attachment functionality with various file sizes\n4. Verified fix resolves issue for files up to 25MB\n5. Documented workaround for larger files if needed'
          ],
          validationRules: [
            {
              rule: 'actionable-steps',
              description: 'Steps should be specific and actionable',
              severity: 'error',
              message: 'Provide specific, actionable resolution steps'
            }
          ],
          relatedSections: ['root-cause', 'verification-testing']
        },
        {
          sectionId: 'verification-testing',
          title: 'Verification Testing',
          description: 'Tests performed to confirm the solution works',
          purpose: 'Ensure the resolution actually fixes the problem',
          required: false,
          format: 'text',
          placeholder: 'Verified user can successfully map G: drive and access files. Confirmed normal operation for 30 minutes.',
          examples: [
            'Verified user can successfully map G: drive and access files. Confirmed normal operation for 30 minutes with no errors. Tested file creation, modification, and deletion.',
            'Tested attachment of 15MB file successfully. Verified various file types (PDF, DOCX, ZIP) all attach without errors. Confirmed emails send successfully with large attachments.'
          ],
          validationRules: [],
          relatedSections: ['solution-steps', 'customer-confirmation']
        }
      ],
      bestPractices: [
        {
          id: 'bp-1',
          category: 'structure',
          title: 'Follow Problem-Solution Flow',
          description: 'Organize documentation in logical sequence: Problem → Investigation → Root Cause → Solution → Verification',
          importance: 'critical',
          example: 'Start with problem summary, then detailed investigation, identify root cause, implement solution, and verify success',
          applicableSections: ['all']
        },
        {
          id: 'bp-2',
          category: 'content',
          title: 'Use Specific Technical Details',
          description: 'Include specific error messages, server names, IP addresses, and exact procedures',
          importance: 'important',
          example: 'Instead of "checked the server", write "pinged SERVER01.domain.com (192.168.1.50) - responded normally"',
          antiExample: 'The server was down so I fixed it',
          applicableSections: ['troubleshooting-steps', 'solution-steps']
        },
        {
          id: 'bp-3',
          category: 'language',
          title: 'Write for Future Reference',
          description: 'Write as if someone else will need to understand and replicate your work',
          importance: 'important',
          example: 'Document each step clearly with enough detail for another technician to follow',
          applicableSections: ['all']
        }
      ],
      examples: [
        {
          id: 'example-1',
          title: 'Network Drive Access Issue',
          scenario: 'User cannot access shared network drive',
          complexity: 'intermediate',
          fullExample: {
            'problem-summary': 'User unable to access shared network drive resulting in inability to complete daily tasks',
            'issue-description': 'User reports that when attempting to map the G: drive using \\\\SERVER01\\shared, they receive "Network path not found" error. Issue started this morning around 9 AM. User confirmed they can access other network resources normally.',
            'troubleshooting-steps': '1. Verified user credentials and account status in Active Directory\n2. Tested network connectivity with ping to SERVER01 (192.168.1.50) - successful\n3. Checked DNS resolution for SERVER01.domain.com - resolved correctly\n4. Attempted manual IP connection to \\\\192.168.1.50\\shared - failed\n5. Verified server share permissions - user has correct access\n6. Checked server event logs - found authentication service errors',
            'root-cause': 'Network authentication service was experiencing intermittent timeouts due to high server load during backup operations scheduled at 8:30 AM daily',
            'solution-steps': '1. Coordinated with server team to temporarily pause backup operations\n2. Restarted network authentication service on SERVER01\n3. Verified service startup and normal operation in Event Viewer\n4. Tested user connection to shared drive\n5. Confirmed successful mapping and file access',
            'verification-testing': 'Verified user can successfully map G: drive and access files. Confirmed normal operation for 30 minutes with no errors. Tested file creation, modification, and deletion operations.'
          },
          highlights: [
            {
              section: 'troubleshooting-steps',
              text: 'Tested network connectivity with ping to SERVER01 (192.168.1.50) - successful',
              explanation: 'Includes specific server name and IP address',
              why: 'Provides technical details that help with replication and understanding'
            }
          ],
          learningPoints: [
            'Always include specific server names and IP addresses',
            'Document the timing of issues for pattern recognition',
            'Verify solutions work before closing tickets'
          ]
        }
      ],
      commonMistakes: [
        {
          id: 'mistake-1',
          title: 'Vague Problem Description',
          description: 'Using generic descriptions that don\'t provide actionable information',
          section: 'problem-summary',
          frequency: 'common',
          impact: 'high',
          wrongExample: 'User has computer problems',
          correctExample: 'User unable to access shared network drive resulting in inability to complete daily tasks',
          prevention: 'Always include specific symptoms and business impact'
        },
        {
          id: 'mistake-2',
          title: 'Missing Technical Details',
          description: 'Failing to include specific error messages, server names, or technical specifications',
          section: 'troubleshooting-steps',
          frequency: 'common',
          impact: 'medium',
          wrongExample: 'Checked the server and it was working',
          correctExample: 'Pinged SERVER01.domain.com (192.168.1.50) - received 4 replies, average response time 2ms',
          prevention: 'Document exact commands, error messages, and results'
        }
      ],
      tips: [
        {
          id: 'tip-1',
          type: 'quick-tip',
          title: 'Start with the Impact',
          content: 'Begin your problem summary by describing how the issue affects the user\'s work',
          context: ['problem-summary'],
          timing: 'before-writing',
          priority: 'high'
        },
        {
          id: 'tip-2',
          type: 'pro-tip',
          title: 'Copy-Paste Error Messages',
          content: 'Always copy exact error messages rather than paraphrasing them',
          context: ['issue-description', 'troubleshooting-steps'],
          timing: 'while-writing',
          priority: 'high'
        },
        {
          id: 'tip-3',
          type: 'best-practice',
          title: 'Document Your Thought Process',
          content: 'Explain why you chose specific troubleshooting steps to help others learn',
          context: ['troubleshooting-steps'],
          timing: 'while-writing',
          priority: 'medium'
        }
      ],
      version: '1.0',
      lastUpdated: new Date()
    };

    this.templates.set('ticket-resolution', ticketResolutionTemplate);
  }

  /**
   * Filter tips by context and user needs
   */
  private filterTipsByContext(tips: GuidanceTip[], request: GuidanceRequest): GuidanceTip[] {
    return tips.filter(tip => {
      if (request.context && tip.timing !== request.context && tip.timing !== 'always') {
        return false;
      }
      if (request.sectionId && !tip.context.includes(request.sectionId)) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Filter examples by user level
   */
  private filterExamplesByLevel(examples: TemplateExample[], userLevel: string): TemplateExample[] {
    const levelOrder = { basic: 1, intermediate: 2, advanced: 3 };
    const userLevelNum = levelOrder[userLevel as keyof typeof levelOrder] || 1;

    return examples.filter(example => {
      const exampleLevelNum = levelOrder[example.complexity];
      return exampleLevelNum <= userLevelNum + 1; // Show current level and one above
    });
  }

  /**
   * Get relevant mistakes for section
   */
  private getRelevantMistakes(mistakes: CommonMistake[], sectionId?: string): CommonMistake[] {
    return mistakes.filter(mistake => 
      !sectionId || mistake.section === sectionId || mistake.section === 'all'
    ).sort((a, b) => {
      const frequencyOrder = { common: 3, occasional: 2, rare: 1 };
      const impactOrder = { high: 3, medium: 2, low: 1 };
      
      const aScore = frequencyOrder[a.frequency] + impactOrder[a.impact];
      const bScore = frequencyOrder[b.frequency] + impactOrder[b.impact];
      
      return bScore - aScore;
    });
  }

  /**
   * Generate next steps based on context
   */
  private generateNextSteps(template: TemplateGuidance, request: GuidanceRequest): string[] {
    const steps: string[] = [];

    if (request.context === 'writing') {
      steps.push('Review the section requirements and examples');
      steps.push('Draft your content following the provided format');
      steps.push('Use specific technical details and avoid generic language');
    } else if (request.context === 'reviewing') {
      steps.push('Check completeness against required sections');
      steps.push('Verify technical accuracy and specificity');
      steps.push('Ensure professional language and clear structure');
    } else if (request.context === 'improving') {
      steps.push('Review common mistakes for your sections');
      steps.push('Apply best practices to enhance quality');
      steps.push('Add missing details identified in quality assessment');
    }

    return steps;
  }
}

export const templateGuidanceService = new TemplateGuidanceService();
export default templateGuidanceService;