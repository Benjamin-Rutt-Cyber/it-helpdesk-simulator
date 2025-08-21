/**
 * Quality Validation Service
 * Provides comprehensive quality assessment for documentation
 */

export interface DocumentationQuality {
  overallScore: number; // 0-100
  clarityScore: number; // 0-100
  completenessScore: number; // 0-100
  usefulnessScore: number; // 0-100
  professionalScore: number; // 0-100
  validationResults: ValidationResult[];
  suggestions: QualityImprovement[];
  passed: boolean;
  timestamp: Date;
}

export interface ValidationResult {
  id: string;
  category: 'completeness' | 'clarity' | 'structure' | 'professional' | 'content';
  rule: string;
  description: string;
  severity: 'error' | 'warning' | 'suggestion';
  passed: boolean;
  value?: string;
  expectedValue?: string;
  suggestion?: string;
}

export interface QualityImprovement {
  id: string;
  type: 'missing-content' | 'unclear-language' | 'poor-structure' | 'unprofessional' | 'incomplete-detail';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: string;
  example?: string;
}

export interface DocumentationContent {
  problemSummary?: string;
  issueDescription?: string;
  customerImpact?: string;
  urgencyLevel?: string;
  troubleshootingSteps?: string[];
  diagnosticResults?: string;
  rootCause?: string;
  contributingFactors?: string;
  preventionMeasures?: string;
  solutionSteps?: string[];
  verificationTesting?: string;
  customerConfirmation?: string;
  resolutionTime?: number;
  resourcesUsed?: string[];
  knowledgeGained?: string;
  followupActions?: string[];
}

class QualityValidatorService {
  private readonly MINIMUM_PASSING_SCORE = 70;
  private readonly WEIGHTS = {
    completeness: 0.3,
    clarity: 0.25,
    usefulness: 0.2,
    professional: 0.25
  };

  /**
   * Validate documentation quality comprehensively
   */
  async validateDocumentationQuality(content: DocumentationContent): Promise<DocumentationQuality> {
    const validationResults: ValidationResult[] = [];
    const suggestions: QualityImprovement[] = [];

    // Run all validation checks
    validationResults.push(...this.validateCompleteness(content));
    validationResults.push(...this.validateClarity(content));
    validationResults.push(...this.validateStructure(content));
    validationResults.push(...this.validateProfessionalStandards(content));
    validationResults.push(...this.validateContentQuality(content));

    // Generate improvement suggestions
    suggestions.push(...this.generateImprovementSuggestions(content, validationResults));

    // Calculate scores
    const scores = this.calculateQualityScores(validationResults, content);

    return {
      ...scores,
      validationResults,
      suggestions,
      passed: scores.overallScore >= this.MINIMUM_PASSING_SCORE,
      timestamp: new Date()
    };
  }

  /**
   * Validate completeness of required fields
   */
  private validateCompleteness(content: DocumentationContent): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Required field checks
    const requiredFields = [
      { key: 'problemSummary', name: 'Problem Summary', critical: true },
      { key: 'issueDescription', name: 'Issue Description', critical: true },
      { key: 'troubleshootingSteps', name: 'Troubleshooting Steps', critical: true },
      { key: 'rootCause', name: 'Root Cause Analysis', critical: true },
      { key: 'solutionSteps', name: 'Solution Steps', critical: true },
      { key: 'verificationTesting', name: 'Verification Testing', critical: false },
      { key: 'customerConfirmation', name: 'Customer Confirmation', critical: false }
    ];

    requiredFields.forEach(field => {
      const value = content[field.key as keyof DocumentationContent];
      const isEmpty = !value || 
        (typeof value === 'string' && value.trim().length === 0) ||
        (Array.isArray(value) && value.length === 0);

      results.push({
        id: `completeness_${field.key}`,
        category: 'completeness',
        rule: `Required field: ${field.name}`,
        description: `${field.name} must be provided`,
        severity: field.critical ? 'error' : 'warning',
        passed: !isEmpty,
        value: typeof value === 'string' ? value : Array.isArray(value) ? `${value.length} items` : 'Not provided',
        expectedValue: 'Non-empty content',
        suggestion: isEmpty ? `Please provide detailed ${field.name.toLowerCase()}` : undefined
      });
    });

    // Minimum content length checks
    const contentLengthChecks = [
      { key: 'problemSummary', minLength: 20, name: 'Problem Summary' },
      { key: 'issueDescription', minLength: 50, name: 'Issue Description' },
      { key: 'rootCause', minLength: 30, name: 'Root Cause Analysis' }
    ];

    contentLengthChecks.forEach(check => {
      const value = content[check.key as keyof DocumentationContent] as string;
      const length = value?.trim().length || 0;
      const passed = length >= check.minLength;

      results.push({
        id: `length_${check.key}`,
        category: 'completeness',
        rule: `Minimum content length: ${check.name}`,
        description: `${check.name} should have at least ${check.minLength} characters`,
        severity: 'warning',
        passed,
        value: `${length} characters`,
        expectedValue: `At least ${check.minLength} characters`,
        suggestion: !passed ? `Please expand the ${check.name.toLowerCase()} with more detailed information` : undefined
      });
    });

    return results;
  }

  /**
   * Validate clarity and readability
   */
  private validateClarity(content: DocumentationContent): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check for clear language patterns
    const textFields = ['problemSummary', 'issueDescription', 'rootCause'] as const;
    
    textFields.forEach(field => {
      const text = content[field] as string;
      if (!text) return;

      // Check for passive voice (simplified)
      const passiveVoicePattern = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
      const passiveMatches = text.match(passiveVoicePattern) || [];
      const passiveRatio = passiveMatches.length / text.split(' ').length;

      results.push({
        id: `clarity_passive_${field}`,
        category: 'clarity',
        rule: 'Minimize passive voice',
        description: 'Use active voice for clearer communication',
        severity: 'suggestion',
        passed: passiveRatio < 0.1,
        value: `${(passiveRatio * 100).toFixed(1)}% passive voice`,
        expectedValue: 'Less than 10% passive voice',
        suggestion: passiveRatio >= 0.1 ? 'Consider rewriting sentences to use active voice' : undefined
      });

      // Check for technical jargon without explanation
      const jargonWords = ['API', 'DNS', 'TCP', 'SSL', 'VPN', 'DHCP', 'NAT', 'VLAN'];
      const jargonFound = jargonWords.filter(word => text.includes(word));
      
      if (jargonFound.length > 0) {
        results.push({
          id: `clarity_jargon_${field}`,
          category: 'clarity',
          rule: 'Explain technical terms',
          description: 'Technical jargon should be explained for clarity',
          severity: 'suggestion',
          passed: false,
          value: `Found: ${jargonFound.join(', ')}`,
          expectedValue: 'Technical terms with explanations',
          suggestion: 'Consider briefly explaining technical terms for better understanding'
        });
      }

      // Check sentence length
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
      
      results.push({
        id: `clarity_sentence_length_${field}`,
        category: 'clarity',
        rule: 'Appropriate sentence length',
        description: 'Sentences should be concise and readable',
        severity: 'suggestion',
        passed: avgSentenceLength <= 20,
        value: `${avgSentenceLength.toFixed(1)} words per sentence`,
        expectedValue: 'Under 20 words per sentence',
        suggestion: avgSentenceLength > 20 ? 'Consider breaking down long sentences for better readability' : undefined
      });
    });

    return results;
  }

  /**
   * Validate document structure and organization
   */
  private validateStructure(content: DocumentationContent): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check for logical flow
    const hasLogicalFlow = content.problemSummary && content.troubleshootingSteps && content.solutionSteps;
    results.push({
      id: 'structure_logical_flow',
      category: 'structure',
      rule: 'Logical documentation flow',
      description: 'Documentation should follow problem → troubleshooting → solution flow',
      severity: 'error',
      passed: !!hasLogicalFlow,
      value: hasLogicalFlow ? 'Complete flow' : 'Missing flow elements',
      expectedValue: 'Problem → Troubleshooting → Solution',
      suggestion: !hasLogicalFlow ? 'Ensure documentation follows logical problem-solving sequence' : undefined
    });

    // Check troubleshooting steps structure
    if (content.troubleshootingSteps && Array.isArray(content.troubleshootingSteps)) {
      const hasNumberedSteps = content.troubleshootingSteps.length >= 2;
      results.push({
        id: 'structure_troubleshooting_steps',
        category: 'structure',
        rule: 'Adequate troubleshooting documentation',
        description: 'At least 2 troubleshooting steps should be documented',
        severity: 'warning',
        passed: hasNumberedSteps,
        value: `${content.troubleshootingSteps.length} steps`,
        expectedValue: 'At least 2 steps',
        suggestion: !hasNumberedSteps ? 'Document each troubleshooting step taken' : undefined
      });
    }

    // Check solution steps structure
    if (content.solutionSteps && Array.isArray(content.solutionSteps)) {
      const hasDetailedSteps = content.solutionSteps.length >= 1 && 
        content.solutionSteps.every(step => typeof step === 'string' && step.length >= 10);
      
      results.push({
        id: 'structure_solution_steps',
        category: 'structure',
        rule: 'Detailed solution steps',
        description: 'Solution steps should be detailed and actionable',
        severity: 'error',
        passed: hasDetailedSteps,
        value: `${content.solutionSteps.length} detailed steps`,
        expectedValue: 'At least 1 detailed step',
        suggestion: !hasDetailedSteps ? 'Provide specific, actionable solution steps' : undefined
      });
    }

    return results;
  }

  /**
   * Validate professional standards
   */
  private validateProfessionalStandards(content: DocumentationContent): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check for professional language
    const textContent = [
      content.problemSummary,
      content.issueDescription,
      content.rootCause
    ].filter(Boolean).join(' ');

    if (textContent) {
      // Check for casual language
      const casualWords = ['kinda', 'sorta', 'yeah', 'ok', 'hmm', 'ugh', 'duh'];
      const casualFound = casualWords.filter(word => 
        textContent.toLowerCase().includes(word.toLowerCase())
      );

      results.push({
        id: 'professional_language',
        category: 'professional',
        rule: 'Professional language',
        description: 'Use professional, technical language',
        severity: 'warning',
        passed: casualFound.length === 0,
        value: casualFound.length > 0 ? `Found: ${casualFound.join(', ')}` : 'Professional language used',
        expectedValue: 'No casual language',
        suggestion: casualFound.length > 0 ? 'Replace casual language with professional terminology' : undefined
      });

      // Check for proper capitalization
      const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const properCapitalization = sentences.every(sentence => {
        const trimmed = sentence.trim();
        return trimmed.length === 0 || /^[A-Z]/.test(trimmed);
      });

      results.push({
        id: 'professional_capitalization',
        category: 'professional',
        rule: 'Proper capitalization',
        description: 'Sentences should start with capital letters',
        severity: 'warning',
        passed: properCapitalization,
        value: properCapitalization ? 'Proper capitalization' : 'Capitalization issues found',
        expectedValue: 'All sentences properly capitalized',
        suggestion: !properCapitalization ? 'Ensure all sentences start with capital letters' : undefined
      });
    }

    // Check for customer impact documentation
    const hasCustomerImpact = content.customerImpact && content.customerImpact.trim().length > 0;
    results.push({
      id: 'professional_customer_impact',
      category: 'professional',
      rule: 'Customer impact documentation',
      description: 'Document how the issue affected the customer',
      severity: 'warning',
      passed: hasCustomerImpact,
      value: hasCustomerImpact ? 'Customer impact documented' : 'Customer impact not documented',
      expectedValue: 'Clear customer impact statement',
      suggestion: !hasCustomerImpact ? 'Describe how this issue affected the customer' : undefined
    });

    return results;
  }

  /**
   * Validate content quality and usefulness
   */
  private validateContentQuality(content: DocumentationContent): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check for specific vs generic content
    const genericPhrases = [
      'the system', 'it worked', 'fixed the issue', 'resolved the problem',
      'did some troubleshooting', 'checked everything', 'it was broken'
    ];

    const textContent = [
      content.problemSummary,
      content.troubleshootingSteps?.join(' '),
      content.solutionSteps?.join(' ')
    ].filter(Boolean).join(' ').toLowerCase();

    const genericFound = genericPhrases.filter(phrase => textContent.includes(phrase));

    results.push({
      id: 'content_specificity',
      category: 'content',
      rule: 'Specific, actionable content',
      description: 'Use specific details rather than generic descriptions',
      severity: 'suggestion',
      passed: genericFound.length <= 1,
      value: genericFound.length > 1 ? `Generic phrases found: ${genericFound.length}` : 'Specific content',
      expectedValue: 'Specific, detailed descriptions',
      suggestion: genericFound.length > 1 ? 'Replace generic descriptions with specific details' : undefined
    });

    // Check for measurable outcomes
    const hasMeasurableOutcome = content.verificationTesting && 
      (content.verificationTesting.includes('%') || 
       content.verificationTesting.includes('seconds') ||
       content.verificationTesting.includes('minutes') ||
       /\d+/.test(content.verificationTesting));

    results.push({
      id: 'content_measurable_outcomes',
      category: 'content',
      rule: 'Measurable verification results',
      description: 'Include quantifiable results where possible',
      severity: 'suggestion',
      passed: hasMeasurableOutcome || !content.verificationTesting,
      value: hasMeasurableOutcome ? 'Measurable outcomes included' : 'No measurable outcomes',
      expectedValue: 'Quantified results when applicable',
      suggestion: content.verificationTesting && !hasMeasurableOutcome ? 
        'Include specific metrics or measurements in verification results' : undefined
    });

    return results;
  }

  /**
   * Generate improvement suggestions based on validation results
   */
  private generateImprovementSuggestions(
    content: DocumentationContent, 
    validationResults: ValidationResult[]
  ): QualityImprovement[] {
    const suggestions: QualityImprovement[] = [];
    const errors = validationResults.filter(r => r.severity === 'error' && !r.passed);
    const warnings = validationResults.filter(r => r.severity === 'warning' && !r.passed);

    // High priority suggestions for errors
    errors.forEach(error => {
      suggestions.push({
        id: `improvement_${error.id}`,
        type: this.mapCategoryToImprovementType(error.category),
        title: `Critical: ${error.rule}`,
        description: error.description,
        priority: 'high',
        actionRequired: error.suggestion || `Fix ${error.rule.toLowerCase()}`,
        example: this.getExampleForRule(error.rule)
      });
    });

    // Medium priority suggestions for warnings
    warnings.slice(0, 3).forEach(warning => {
      suggestions.push({
        id: `improvement_${warning.id}`,
        type: this.mapCategoryToImprovementType(warning.category),
        title: warning.rule,
        description: warning.description,
        priority: 'medium',
        actionRequired: warning.suggestion || `Improve ${warning.rule.toLowerCase()}`,
        example: this.getExampleForRule(warning.rule)
      });
    });

    // General improvement suggestions
    if (!content.preventionMeasures) {
      suggestions.push({
        id: 'improvement_prevention',
        type: 'missing-content',
        title: 'Add Prevention Measures',
        description: 'Document how to prevent this issue from recurring',
        priority: 'medium',
        actionRequired: 'Add a section describing preventive measures',
        example: 'Regular system updates, monitoring procedures, user training'
      });
    }

    return suggestions;
  }

  /**
   * Calculate quality scores based on validation results
   */
  private calculateQualityScores(
    validationResults: ValidationResult[], 
    content: DocumentationContent
  ): Omit<DocumentationQuality, 'validationResults' | 'suggestions' | 'passed' | 'timestamp'> {
    const categoryScores = {
      completeness: this.calculateCategoryScore(validationResults, 'completeness'),
      clarity: this.calculateCategoryScore(validationResults, 'clarity'),
      structure: this.calculateCategoryScore(validationResults, 'structure'),
      professional: this.calculateCategoryScore(validationResults, 'professional'),
      content: this.calculateCategoryScore(validationResults, 'content')
    };

    const completenessScore = categoryScores.completeness;
    const clarityScore = categoryScores.clarity;
    const usefulnessScore = (categoryScores.content + categoryScores.structure) / 2;
    const professionalScore = categoryScores.professional;

    const overallScore = Math.round(
      completenessScore * this.WEIGHTS.completeness +
      clarityScore * this.WEIGHTS.clarity +
      usefulnessScore * this.WEIGHTS.usefulness +
      professionalScore * this.WEIGHTS.professional
    );

    return {
      overallScore,
      clarityScore,
      completenessScore,
      usefulnessScore,
      professionalScore
    };
  }

  /**
   * Calculate score for a specific category
   */
  private calculateCategoryScore(
    validationResults: ValidationResult[], 
    category: ValidationResult['category']
  ): number {
    const categoryResults = validationResults.filter(r => r.category === category);
    if (categoryResults.length === 0) return 100;

    const totalWeight = categoryResults.reduce((sum, result) => {
      return sum + (result.severity === 'error' ? 3 : result.severity === 'warning' ? 2 : 1);
    }, 0);

    const passedWeight = categoryResults
      .filter(r => r.passed)
      .reduce((sum, result) => {
        return sum + (result.severity === 'error' ? 3 : result.severity === 'warning' ? 2 : 1);
      }, 0);

    return Math.round((passedWeight / totalWeight) * 100);
  }

  /**
   * Map validation category to improvement type
   */
  private mapCategoryToImprovementType(category: ValidationResult['category']): QualityImprovement['type'] {
    switch (category) {
      case 'completeness': return 'missing-content';
      case 'clarity': return 'unclear-language';
      case 'structure': return 'poor-structure';
      case 'professional': return 'unprofessional';
      case 'content': return 'incomplete-detail';
      default: return 'missing-content';
    }
  }

  /**
   * Get example for specific validation rule
   */
  private getExampleForRule(rule: string): string | undefined {
    const examples: Record<string, string> = {
      'Problem Summary': 'User unable to access shared network drive resulting in inability to complete daily tasks',
      'Root Cause Analysis': 'Network authentication service was experiencing intermittent timeouts due to high server load',
      'Solution Steps': '1. Restarted authentication service 2. Verified connectivity 3. Tested user access',
      'Professional language': 'Replace "The thing was broken" with "The network service was experiencing connectivity issues"',
      'Specific, actionable content': 'Instead of "fixed the issue", write "Restarted the DNS service and verified connectivity"'
    };

    return examples[rule];
  }

  /**
   * Get quality validation summary
   */
  async getValidationSummary(quality: DocumentationQuality): Promise<string> {
    const status = quality.passed ? 'PASSED' : 'NEEDS IMPROVEMENT';
    const errors = quality.validationResults.filter(r => r.severity === 'error' && !r.passed).length;
    const warnings = quality.validationResults.filter(r => r.severity === 'warning' && !r.passed).length;

    return `Quality Assessment: ${status} (${quality.overallScore}/100)
    
Scores:
- Completeness: ${quality.completenessScore}/100
- Clarity: ${quality.clarityScore}/100  
- Usefulness: ${quality.usefulnessScore}/100
- Professional: ${quality.professionalScore}/100

Issues Found: ${errors} errors, ${warnings} warnings
Top Improvements: ${quality.suggestions.slice(0, 3).map(s => s.title).join(', ')}`;
  }
}

export const qualityValidatorService = new QualityValidatorService();
export default qualityValidatorService;