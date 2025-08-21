'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

interface TemplateGuidanceProps {
  templateId: string;
  currentSection?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  context?: 'writing' | 'reviewing' | 'improving';
  onSectionSelect?: (sectionId: string) => void;
  showCompactView?: boolean;
}

export default function TemplateGuidance({
  templateId,
  currentSection,
  userLevel = 'intermediate',
  context = 'writing',
  onSectionSelect,
  showCompactView = false
}: TemplateGuidanceProps) {
  const [guidance, setGuidance] = useState<TemplateGuidance | null>(null);
  const [selectedTab, setSelectedTab] = useState<'sections' | 'examples' | 'tips' | 'mistakes'>('sections');
  const [selectedSection, setSelectedSection] = useState<string>(currentSection || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGuidance();
  }, [templateId]);

  useEffect(() => {
    if (currentSection) {
      setSelectedSection(currentSection);
    }
  }, [currentSection]);

  const loadGuidance = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to template guidance service
      const templateGuidance = await fetchTemplateGuidance(templateId);
      setGuidance(templateGuidance);
    } catch (error) {
      console.error('Failed to load template guidance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplateGuidance = async (templateId: string): Promise<TemplateGuidance> => {
    // Mock data for ticket resolution template
    return {
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
          sectionId: 'troubleshooting-steps',
          title: 'Troubleshooting Steps',
          description: 'Step-by-step documentation of diagnostic procedures performed',
          purpose: 'Document the investigative process for learning and future reference',
          required: true,
          format: 'list',
          placeholder: '1. Verified network connectivity with ping test\n2. Checked DNS resolution\n3. Tested alternative access methods',
          examples: [
            '1. Verified user credentials and account status\n2. Tested network connectivity with ping to server\n3. Checked DNS resolution for server name\n4. Attempted manual IP connection\n5. Verified server share permissions'
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
            'Recent Windows update changed Outlook attachment handling, introducing file size limitation bug'
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
            'troubleshooting-steps': '1. Verified user credentials and account status in Active Directory\n2. Tested network connectivity with ping to SERVER01 (192.168.1.50) - successful\n3. Checked DNS resolution for SERVER01.domain.com - resolved correctly',
            'root-cause': 'Network authentication service was experiencing intermittent timeouts due to high server load during backup operations scheduled at 8:30 AM daily'
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
        }
      ],
      version: '1.0',
      lastUpdated: new Date()
    };
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
    if (onSectionSelect) {
      onSectionSelect(sectionId);
    }
  };

  const getRelevantTips = () => {
    if (!guidance) return [];
    
    return guidance.tips.filter(tip => {
      if (selectedSection && !tip.context.includes(selectedSection) && !tip.context.includes('all')) {
        return false;
      }
      if (context && tip.timing !== context && tip.timing !== 'always') {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getRelevantExamples = () => {
    if (!guidance) return [];
    
    const levelOrder = { basic: 1, intermediate: 2, advanced: 3 };
    const userLevelNum = levelOrder[userLevel];
    
    return guidance.examples.filter(example => {
      const exampleLevelNum = levelOrder[example.complexity];
      return exampleLevelNum <= userLevelNum + (showAdvanced ? 1 : 0);
    });
  };

  const getRelevantMistakes = () => {
    if (!guidance) return [];
    
    return guidance.commonMistakes.filter(mistake => 
      !selectedSection || mistake.section === selectedSection || mistake.section === 'all'
    ).sort((a, b) => {
      const frequencyOrder = { common: 3, occasional: 2, rare: 1 };
      const impactOrder = { high: 3, medium: 2, low: 1 };
      
      const aScore = frequencyOrder[a.frequency] + impactOrder[a.impact];
      const bScore = frequencyOrder[b.frequency] + impactOrder[b.impact];
      
      return bScore - aScore;
    });
  };

  const getTipTypeColor = (type: GuidanceTip['type']): string => {
    switch (type) {
      case 'quick-tip': return 'text-blue-600 bg-blue-100';
      case 'pro-tip': return 'text-purple-600 bg-purple-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'best-practice': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImportanceColor = (importance: BestPractice['importance']): string => {
    switch (importance) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'important': return 'text-orange-600 bg-orange-100';
      case 'recommended': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: CommonMistake['impact']): string => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading template guidance...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!guidance) {
    return (
      <Card>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Template guidance not available for: {templateId}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (showCompactView) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-blue-900">📖 Template Guidance</h4>
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              size="sm"
              className="text-blue-600"
            >
              {showAdvanced ? 'Basic' : 'Advanced'}
            </Button>
          </div>
          
          {selectedSection && (
            <div className="mb-3">
              <div className="text-sm font-medium text-blue-800 mb-1">
                Current Section: {guidance.sections.find(s => s.sectionId === selectedSection)?.title}
              </div>
              <div className="text-xs text-blue-600">
                {guidance.sections.find(s => s.sectionId === selectedSection)?.description}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {getRelevantTips().slice(0, 2).map((tip) => (
              <div key={tip.id} className="bg-white rounded p-2 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTipTypeColor(tip.type)}`}>
                    {tip.type.replace('-', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">{tip.title}</span>
                </div>
                <p className="text-xs text-gray-600">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">{guidance.templateName}</h3>
              <p className="text-sm text-gray-600">{guidance.description}</p>
            </div>
            <div className="flex gap-2">
              <select
                value={userLevel}
                onChange={(e) => setUserLevel && setUserLevel(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6 border-b">
            {[
              { key: 'sections', label: 'Sections', icon: '📝' },
              { key: 'examples', label: 'Examples', icon: '💡' },
              { key: 'tips', label: 'Tips', icon: '💡' },
              { key: 'mistakes', label: 'Common Mistakes', icon: '⚠️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {selectedTab === 'sections' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guidance.sections.map((section) => (
                  <div
                    key={section.sectionId}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedSection === section.sectionId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSectionSelect(section.sectionId)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{section.title}</h4>
                      {section.required && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                    <p className="text-xs text-gray-500 mb-3">{section.purpose}</p>
                    
                    {section.examples.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Example:</div>
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {section.examples[0]}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'examples' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Template Examples</h4>
                <Button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  variant="outline"
                  size="sm"
                >
                  {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                </Button>
              </div>

              {getRelevantExamples().map((example) => (
                <div key={example.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-medium">{example.title}</h5>
                      <p className="text-sm text-gray-600">{example.scenario}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      example.complexity === 'basic' ? 'bg-green-100 text-green-800' :
                      example.complexity === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {example.complexity.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(example.fullExample).map(([sectionId, content]) => {
                      const section = guidance.sections.find(s => s.sectionId === sectionId);
                      return (
                        <div key={sectionId} className="bg-gray-50 rounded p-3">
                          <div className="font-medium text-sm mb-1">
                            {section?.title || sectionId}
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-line">
                            {content}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {example.learningPoints.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Key Learning Points:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {example.learningPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'tips' && (
            <div className="space-y-4">
              {getRelevantTips().map((tip) => (
                <div key={tip.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTipTypeColor(tip.type)}`}>
                        {tip.type.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className="font-medium">{tip.title}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tip.priority === 'high' ? 'bg-red-100 text-red-800' :
                      tip.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {tip.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{tip.content}</p>
                  {tip.context.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Applies to: {tip.context.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'mistakes' && (
            <div className="space-y-4">
              {getRelevantMistakes().map((mistake) => (
                <div key={mistake.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-medium">{mistake.title}</h5>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(mistake.impact)}`}>
                        {mistake.impact.toUpperCase()} IMPACT
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        mistake.frequency === 'common' ? 'bg-red-100 text-red-800' :
                        mistake.frequency === 'occasional' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {mistake.frequency.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{mistake.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="text-sm font-medium text-red-800 mb-1">❌ Wrong Example:</div>
                      <div className="text-sm text-red-700">{mistake.wrongExample}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="text-sm font-medium text-green-800 mb-1">✅ Correct Example:</div>
                      <div className="text-sm text-green-700">{mistake.correctExample}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-medium text-blue-800 mb-1">Prevention:</div>
                    <div className="text-sm text-blue-700">{mistake.prevention}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}