'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RootCauseData {
  primaryCause: string;
  contributingFactors: string[];
  rootCauseCategory: 'technical' | 'process' | 'human' | 'environmental' | 'vendor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impactArea: string[];
  preventionMeasures: string[];
  recommendations: string[];
  analysisMethod: 'five-whys' | 'fishbone' | 'timeline' | 'rca-tree' | 'other';
  analysisDate: Date;
  analyst: string;
  reviewStatus: 'draft' | 'reviewed' | 'approved';
}

interface AnalysisFramework {
  id: string;
  name: string;
  description: string;
  steps: string[];
  questions: string[];
}

interface RootCauseAnalysisProps {
  initialData?: RootCauseData;
  onChange: (data: RootCauseData) => void;
  readOnly?: boolean;
  ticketId?: string;
}

const analysisFrameworks: AnalysisFramework[] = [
  {
    id: 'five-whys',
    name: '5 Whys Analysis',
    description: 'Ask "why" five times to drill down to the root cause',
    steps: [
      'Identify the problem',
      'Ask why the problem occurred',
      'Ask why again for each answer',
      'Continue until you reach the root cause',
      'Develop preventive measures'
    ],
    questions: [
      'Why did this problem occur?',
      'Why did that happen?',
      'Why was that the case?',
      'Why did that condition exist?',
      'Why was that process in place?'
    ]
  },
  {
    id: 'fishbone',
    name: 'Fishbone Diagram',
    description: 'Categorize potential causes into major groups',
    steps: [
      'Define the problem statement',
      'Identify major cause categories',
      'Brainstorm potential causes in each category',
      'Analyze and validate causes',
      'Identify the most likely root causes'
    ],
    questions: [
      'What people factors contributed?',
      'What process issues were involved?',
      'What equipment problems occurred?',
      'What environmental factors played a role?',
      'What material issues contributed?'
    ]
  },
  {
    id: 'timeline',
    name: 'Timeline Analysis',
    description: 'Analyze the sequence of events leading to the problem',
    steps: [
      'Create a timeline of events',
      'Identify decision points',
      'Analyze each event for contributing factors',
      'Look for patterns or trends',
      'Identify the root cause event'
    ],
    questions: [
      'What happened first?',
      'What triggered this event?',
      'What decisions were made at this point?',
      'What could have prevented this?',
      'What warning signs were missed?'
    ]
  },
  {
    id: 'rca-tree',
    name: 'Root Cause Analysis Tree',
    description: 'Create a hierarchical tree of causes and effects',
    steps: [
      'Start with the problem at the top',
      'Identify immediate causes',
      'Find causes for each immediate cause',
      'Continue until root causes are found',
      'Validate the causal relationships'
    ],
    questions: [
      'What directly caused this?',
      'What caused that condition?',
      'Are there multiple contributing causes?',
      'What is the fundamental reason?',
      'Can we trace this further back?'
    ]
  }
];

const rootCauseCategories = [
  { value: 'technical', label: 'Technical Failure', description: 'Hardware, software, or system failures' },
  { value: 'process', label: 'Process Issue', description: 'Inadequate procedures or process failures' },
  { value: 'human', label: 'Human Error', description: 'User mistakes or training issues' },
  { value: 'environmental', label: 'Environmental Factor', description: 'External conditions or circumstances' },
  { value: 'vendor', label: 'Vendor/Third-party', description: 'Issues with external providers' }
];

const impactAreas = [
  'Customer Service',
  'Data Integrity',
  'Security',
  'Performance',
  'Availability',
  'Compliance',
  'Cost',
  'Reputation',
  'Productivity',
  'Quality'
];

export default function RootCauseAnalysis({
  initialData,
  onChange,
  readOnly = false,
  ticketId
}: RootCauseAnalysisProps) {
  const [data, setData] = useState<RootCauseData>(initialData || {
    primaryCause: '',
    contributingFactors: [],
    rootCauseCategory: 'technical',
    severity: 'medium',
    impactArea: [],
    preventionMeasures: [],
    recommendations: [],
    analysisMethod: 'five-whys',
    analysisDate: new Date(),
    analyst: '',
    reviewStatus: 'draft'
  });

  const [selectedFramework, setSelectedFramework] = useState<AnalysisFramework>(
    analysisFrameworks.find(f => f.id === data.analysisMethod) || analysisFrameworks[0]
  );
  const [showFrameworkGuide, setShowFrameworkGuide] = useState(false);
  const [analysisWorkspace, setAnalysisWorkspace] = useState<Record<string, string>>({});

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  useEffect(() => {
    const framework = analysisFrameworks.find(f => f.id === data.analysisMethod);
    if (framework) {
      setSelectedFramework(framework);
    }
  }, [data.analysisMethod]);

  const updateData = (field: keyof RootCauseData, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addArrayItem = (field: keyof RootCauseData, value: string) => {
    if (!value.trim()) return;
    
    setData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }));
  };

  const removeArrayItem = (field: keyof RootCauseData, index: number) => {
    setData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: keyof RootCauseData, index: number, value: string) => {
    setData(prev => {
      const newArray = [...(prev[field] as string[])];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const toggleImpactArea = (area: string) => {
    setData(prev => ({
      ...prev,
      impactArea: prev.impactArea.includes(area)
        ? prev.impactArea.filter(a => a !== area)
        : [...prev.impactArea, area]
    }));
  };

  const generateAnalysisReport = () => {
    const report = `
# Root Cause Analysis Report
**Ticket ID:** ${ticketId || 'N/A'}
**Date:** ${data.analysisDate.toLocaleDateString()}
**Analyst:** ${data.analyst || 'Not specified'}
**Method:** ${selectedFramework.name}

## Problem Summary
**Primary Cause:** ${data.primaryCause}
**Category:** ${rootCauseCategories.find(c => c.value === data.rootCauseCategory)?.label}
**Severity:** ${data.severity.toUpperCase()}

## Contributing Factors
${data.contributingFactors.map((factor, index) => `${index + 1}. ${factor}`).join('\n')}

## Impact Areas
${data.impactArea.join(', ')}

## Prevention Measures
${data.preventionMeasures.map((measure, index) => `${index + 1}. ${measure}`).join('\n')}

## Recommendations
${data.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}
    `.trim();

    return report;
  };

  const copyAnalysisReport = () => {
    const report = generateAnalysisReport();
    navigator.clipboard.writeText(report).then(() => {
      // Could show a toast notification here
      console.log('Analysis report copied to clipboard');
    });
  };

  if (readOnly) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Root Cause Analysis</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                data.reviewStatus === 'approved' ? 'bg-green-100 text-green-800' :
                data.reviewStatus === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {data.reviewStatus.toUpperCase()}
              </span>
              <Button onClick={copyAnalysisReport} variant="outline" size="sm">
                Copy Report
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Analysis Method:</span>
                <p className="text-sm text-gray-600">{selectedFramework.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Category:</span>
                <p className="text-sm text-gray-600">
                  {rootCauseCategories.find(c => c.value === data.rootCauseCategory)?.label}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Severity:</span>
                <p className={`text-sm font-medium ${
                  data.severity === 'critical' ? 'text-red-600' :
                  data.severity === 'high' ? 'text-orange-600' :
                  data.severity === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {data.severity.toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Analyst:</span>
                <p className="text-sm text-gray-600">{data.analyst || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Primary Cause:</span>
              <p className="text-sm text-gray-600 mt-1">{data.primaryCause || 'Not specified'}</p>
            </div>

            {data.contributingFactors.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Contributing Factors:</span>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  {data.contributingFactors.map((factor, index) => (
                    <li key={index}>• {factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.impactArea.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Impact Areas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.impactArea.map((area) => (
                    <span key={area} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.preventionMeasures.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Prevention Measures:</span>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  {data.preventionMeasures.map((measure, index) => (
                    <li key={index}>• {measure}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.recommendations.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Recommendations:</span>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  {data.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
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
            <h3 className="text-lg font-semibold">Root Cause Analysis</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowFrameworkGuide(!showFrameworkGuide)}
                variant="outline"
                size="sm"
              >
                {showFrameworkGuide ? 'Hide Guide' : 'Show Guide'}
              </Button>
              <Button onClick={copyAnalysisReport} variant="outline" size="sm">
                Copy Report
              </Button>
            </div>
          </div>

          {/* Analysis Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Analysis Method</label>
            <select
              value={data.analysisMethod}
              onChange={(e) => updateData('analysisMethod', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {analysisFrameworks.map((framework) => (
                <option key={framework.id} value={framework.id}>
                  {framework.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">{selectedFramework.description}</p>
          </div>

          {/* Framework Guide */}
          {showFrameworkGuide && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <div className="p-4">
                <h4 className="font-medium text-blue-900 mb-2">{selectedFramework.name} Guide</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Steps:</h5>
                    <ol className="text-xs text-blue-700 space-y-1">
                      {selectedFramework.steps.map((step, index) => (
                        <li key={index}>{index + 1}. {step}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Key Questions:</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {selectedFramework.questions.map((question, index) => (
                        <li key={index}>• {question}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Analysis Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Analysis Workspace</label>
              <textarea
                value={analysisWorkspace.notes || ''}
                onChange={(e) => setAnalysisWorkspace(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border rounded-md h-32 resize-vertical text-sm"
                placeholder="Use this space to work through your analysis, jot down thoughts, trace cause-effect relationships..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Metadata</label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Category</label>
                    <select
                      value={data.rootCauseCategory}
                      onChange={(e) => updateData('rootCauseCategory', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      {rootCauseCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Severity</label>
                    <select
                      value={data.severity}
                      onChange={(e) => updateData('severity', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Analyst</label>
                  <input
                    type="text"
                    value={data.analyst}
                    onChange={(e) => updateData('analyst', e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Review Status</label>
                  <select
                    value={data.reviewStatus}
                    onChange={(e) => updateData('reviewStatus', e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Cause */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Primary Cause *</label>
            <textarea
              value={data.primaryCause}
              onChange={(e) => updateData('primaryCause', e.target.value)}
              className="w-full p-3 border rounded-md h-20 resize-vertical"
              placeholder="The fundamental root cause of the issue..."
            />
          </div>

          {/* Contributing Factors */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Contributing Factors</label>
            <div className="space-y-2">
              {data.contributingFactors.map((factor, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={factor}
                    onChange={(e) => updateArrayItem('contributingFactors', index, e.target.value)}
                    className="flex-1 p-2 border rounded-md"
                    placeholder="Contributing factor..."
                  />
                  <Button
                    onClick={() => removeArrayItem('contributingFactors', index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add contributing factor..."
                  className="flex-1 p-2 border rounded-md"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('contributingFactors', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addArrayItem('contributingFactors', input.value);
                    input.value = '';
                  }}
                  variant="outline"
                  size="sm"
                >
                  Add Factor
                </Button>
              </div>
            </div>
          </div>

          {/* Impact Areas */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Impact Areas</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {impactAreas.map((area) => (
                <label key={area} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.impactArea.includes(area)}
                    onChange={() => toggleImpactArea(area)}
                    className="form-checkbox"
                  />
                  <span className="text-sm">{area}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Prevention Measures */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Prevention Measures</label>
            <div className="space-y-2">
              {data.preventionMeasures.map((measure, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={measure}
                    onChange={(e) => updateArrayItem('preventionMeasures', index, e.target.value)}
                    className="flex-1 p-2 border rounded-md"
                    placeholder="Prevention measure..."
                  />
                  <Button
                    onClick={() => removeArrayItem('preventionMeasures', index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add prevention measure..."
                  className="flex-1 p-2 border rounded-md"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('preventionMeasures', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addArrayItem('preventionMeasures', input.value);
                    input.value = '';
                  }}
                  variant="outline"
                  size="sm"
                >
                  Add Measure
                </Button>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Recommendations</label>
            <div className="space-y-2">
              {data.recommendations.map((rec, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={rec}
                    onChange={(e) => updateArrayItem('recommendations', index, e.target.value)}
                    className="flex-1 p-2 border rounded-md"
                    placeholder="Recommendation..."
                  />
                  <Button
                    onClick={() => removeArrayItem('recommendations', index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add recommendation..."
                  className="flex-1 p-2 border rounded-md"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('recommendations', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addArrayItem('recommendations', input.value);
                    input.value = '';
                  }}
                  variant="outline"
                  size="sm"
                >
                  Add Recommendation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}