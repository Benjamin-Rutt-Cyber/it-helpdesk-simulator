'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface DocumentationQuality {
  overallScore: number;
  clarityScore: number;
  completenessScore: number;
  usefulnessScore: number;
  professionalScore: number;
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

interface QualityValidatorProps {
  content: DocumentationContent;
  onQualityChange: (quality: DocumentationQuality) => void;
  autoValidate?: boolean;
  showDetailedResults?: boolean;
  readOnly?: boolean;
}

export default function QualityValidator({
  content,
  onQualityChange,
  autoValidate = true,
  showDetailedResults = false,
  readOnly = false
}: QualityValidatorProps) {
  const [quality, setQuality] = useState<DocumentationQuality | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(showDetailedResults);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (autoValidate && content) {
      validateQuality();
    }
  }, [content, autoValidate]);

  const validateQuality = async () => {
    setIsValidating(true);
    
    try {
      // Simulate API call to quality validation service
      const validatedQuality = await performQualityValidation(content);
      setQuality(validatedQuality);
      onQualityChange(validatedQuality);
    } catch (error) {
      console.error('Quality validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const performQualityValidation = async (content: DocumentationContent): Promise<DocumentationQuality> => {
    // Simulate quality validation logic
    const validationResults = await runValidationChecks(content);
    const suggestions = generateImprovementSuggestions(content, validationResults);
    const scores = calculateQualityScores(validationResults, content);

    return {
      ...scores,
      validationResults,
      suggestions,
      passed: scores.overallScore >= 70,
      timestamp: new Date()
    };
  };

  const runValidationChecks = async (content: DocumentationContent): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];

    // Completeness checks
    const requiredFields = [
      { key: 'problemSummary', name: 'Problem Summary', critical: true },
      { key: 'issueDescription', name: 'Issue Description', critical: true },
      { key: 'troubleshootingSteps', name: 'Troubleshooting Steps', critical: true },
      { key: 'rootCause', name: 'Root Cause Analysis', critical: true },
      { key: 'solutionSteps', name: 'Solution Steps', critical: true }
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

    // Content length checks
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

    // Clarity checks
    const textFields = ['problemSummary', 'issueDescription', 'rootCause'] as const;
    
    textFields.forEach(field => {
      const text = content[field] as string;
      if (!text) return;

      // Check for clear language
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

    // Professional standards checks
    const allText = [content.problemSummary, content.issueDescription, content.rootCause]
      .filter(Boolean).join(' ');

    if (allText) {
      const casualWords = ['kinda', 'sorta', 'yeah', 'ok', 'hmm', 'ugh', 'duh'];
      const casualFound = casualWords.filter(word => 
        allText.toLowerCase().includes(word.toLowerCase())
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
    }

    return results;
  };

  const generateImprovementSuggestions = (
    content: DocumentationContent, 
    validationResults: ValidationResult[]
  ): QualityImprovement[] => {
    const suggestions: QualityImprovement[] = [];
    const errors = validationResults.filter(r => r.severity === 'error' && !r.passed);
    const warnings = validationResults.filter(r => r.severity === 'warning' && !r.passed);

    // High priority suggestions for errors
    errors.forEach(error => {
      suggestions.push({
        id: `improvement_${error.id}`,
        type: mapCategoryToImprovementType(error.category),
        title: `Critical: ${error.rule}`,
        description: error.description,
        priority: 'high',
        actionRequired: error.suggestion || `Fix ${error.rule.toLowerCase()}`,
        example: getExampleForRule(error.rule)
      });
    });

    // Medium priority suggestions for warnings
    warnings.slice(0, 3).forEach(warning => {
      suggestions.push({
        id: `improvement_${warning.id}`,
        type: mapCategoryToImprovementType(warning.category),
        title: warning.rule,
        description: warning.description,
        priority: 'medium',
        actionRequired: warning.suggestion || `Improve ${warning.rule.toLowerCase()}`,
        example: getExampleForRule(warning.rule)
      });
    });

    return suggestions;
  };

  const calculateQualityScores = (
    validationResults: ValidationResult[], 
    content: DocumentationContent
  ) => {
    const categoryScores = {
      completeness: calculateCategoryScore(validationResults, 'completeness'),
      clarity: calculateCategoryScore(validationResults, 'clarity'),
      structure: calculateCategoryScore(validationResults, 'structure'),
      professional: calculateCategoryScore(validationResults, 'professional'),
      content: calculateCategoryScore(validationResults, 'content')
    };

    const completenessScore = categoryScores.completeness;
    const clarityScore = categoryScores.clarity;
    const usefulnessScore = Math.round((categoryScores.content + categoryScores.structure) / 2);
    const professionalScore = categoryScores.professional;

    const overallScore = Math.round(
      completenessScore * 0.3 +
      clarityScore * 0.25 +
      usefulnessScore * 0.2 +
      professionalScore * 0.25
    );

    return {
      overallScore,
      clarityScore,
      completenessScore,
      usefulnessScore,
      professionalScore
    };
  };

  const calculateCategoryScore = (
    validationResults: ValidationResult[], 
    category: ValidationResult['category']
  ): number => {
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
  };

  const mapCategoryToImprovementType = (category: ValidationResult['category']): QualityImprovement['type'] => {
    switch (category) {
      case 'completeness': return 'missing-content';
      case 'clarity': return 'unclear-language';
      case 'structure': return 'poor-structure';
      case 'professional': return 'unprofessional';
      case 'content': return 'incomplete-detail';
      default: return 'missing-content';
    }
  };

  const getExampleForRule = (rule: string): string | undefined => {
    const examples: Record<string, string> = {
      'Problem Summary': 'User unable to access shared network drive resulting in inability to complete daily tasks',
      'Root Cause Analysis': 'Network authentication service was experiencing intermittent timeouts due to high server load',
      'Solution Steps': '1. Restarted authentication service 2. Verified connectivity 3. Tested user access',
      'Professional language': 'Replace "The thing was broken" with "The network service was experiencing connectivity issues"'
    };
    return examples[rule];
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (severity: ValidationResult['severity']): string => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'suggestion': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: QualityImprovement['priority']): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredResults = quality?.validationResults.filter(result => 
    selectedCategory === 'all' || result.category === selectedCategory
  ) || [];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'completeness', label: 'Completeness' },
    { value: 'clarity', label: 'Clarity' },
    { value: 'structure', label: 'Structure' },
    { value: 'professional', label: 'Professional' },
    { value: 'content', label: 'Content' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Documentation Quality Assessment</h3>
            <div className="flex gap-2">
              {!readOnly && (
                <Button
                  onClick={validateQuality}
                  disabled={isValidating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isValidating ? 'Validating...' : 'Validate Quality'}
                </Button>
              )}
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="outline"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
          </div>

          {quality && (
            <>
              {/* Overall Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Quality Score</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    quality.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {quality.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className={`h-4 rounded-full transition-all duration-300 ${
                      quality.overallScore >= 70 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${quality.overallScore}%` }}
                  ></div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {quality.overallScore}/100
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className={`text-xl font-bold px-2 py-1 rounded ${getScoreColor(quality.completenessScore)}`}>
                    {quality.completenessScore}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Completeness</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold px-2 py-1 rounded ${getScoreColor(quality.clarityScore)}`}>
                    {quality.clarityScore}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Clarity</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold px-2 py-1 rounded ${getScoreColor(quality.usefulnessScore)}`}>
                    {quality.usefulnessScore}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Usefulness</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold px-2 py-1 rounded ${getScoreColor(quality.professionalScore)}`}>
                    {quality.professionalScore}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Professional</div>
                </div>
              </div>

              {/* Top Improvements */}
              {quality.suggestions.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Top Improvement Suggestions</h4>
                  <div className="space-y-2">
                    {quality.suggestions.slice(0, 3).map((suggestion) => (
                      <div key={suggestion.id} className="border rounded p-3">
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-sm">{suggestion.title}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                        <p className="text-sm font-medium">Action: {suggestion.actionRequired}</p>
                        {suggestion.example && (
                          <p className="text-sm text-gray-500 mt-1">Example: {suggestion.example}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Results */}
              {showDetails && (
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Detailed Validation Results</h4>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border rounded px-3 py-1 text-sm"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {filteredResults.map((result) => (
                      <div key={result.id} className="border rounded p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{result.rule}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(result.severity)}`}>
                              {result.severity.toUpperCase()}
                            </span>
                            <span className={`w-3 h-3 rounded-full ${result.passed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          </div>
                          <span className="text-xs text-gray-500 capitalize">{result.category}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium">Current:</span> {result.value || 'Not provided'}
                          </div>
                          <div>
                            <span className="font-medium">Expected:</span> {result.expectedValue || 'As required'}
                          </div>
                        </div>
                        {result.suggestion && (
                          <p className="text-sm text-blue-600 mt-2">💡 {result.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!quality && !isValidating && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">Quality assessment not performed yet.</p>
              <Button onClick={validateQuality} className="bg-blue-600 hover:bg-blue-700">
                Run Quality Assessment
              </Button>
            </div>
          )}

          {isValidating && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Analyzing documentation quality...</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}