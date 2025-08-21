'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import TimeTracking from './TimeTracking';

interface DocumentationTemplateProps {
  ticketId: string;
  initialData?: DocumentationData;
  onSave: (data: DocumentationData) => void;
  onExport?: (format: 'markdown' | 'html' | 'pdf') => void;
  enableTimeTracking?: boolean;
  onTimeUpdate?: (metrics: any) => void;
}

interface DocumentationData {
  problemSummary: {
    issueDescription: string;
    customerImpact: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  troubleshootingProcess: {
    initialAssessment: string;
    diagnosticSteps: string[];
    testResults: string;
    solutionIdentification: string;
  };
  rootCauseAnalysis: {
    primaryCause: string;
    contributingFactors: string[];
    prevention: string;
  };
  solutionImplementation: {
    solutionSteps: string[];
    verificationTesting: string;
    customerConfirmation: string;
  };
  resolutionDetails: {
    resolutionTime: number;
    resourcesUsed: string[];
    knowledgeGained: string;
    followupActions: string[];
  };
}

const initialTemplate: DocumentationData = {
  problemSummary: {
    issueDescription: '',
    customerImpact: '',
    urgencyLevel: 'medium'
  },
  troubleshootingProcess: {
    initialAssessment: '',
    diagnosticSteps: [],
    testResults: '',
    solutionIdentification: ''
  },
  rootCauseAnalysis: {
    primaryCause: '',
    contributingFactors: [],
    prevention: ''
  },
  solutionImplementation: {
    solutionSteps: [],
    verificationTesting: '',
    customerConfirmation: ''
  },
  resolutionDetails: {
    resolutionTime: 0,
    resourcesUsed: [],
    knowledgeGained: '',
    followupActions: []
  }
};

export default function DocumentationTemplate({
  ticketId,
  initialData,
  onSave,
  onExport,
  enableTimeTracking = true,
  onTimeUpdate
}: DocumentationTemplateProps) {
  const [documentation, setDocumentation] = useState<DocumentationData>(
    initialData || initialTemplate
  );
  const [isValid, setIsValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    validateDocumentation();
  }, [documentation]);

  const validateDocumentation = () => {
    const errors: string[] = [];
    
    if (!documentation.problemSummary.issueDescription.trim()) {
      errors.push('Issue description is required');
    }
    if (!documentation.problemSummary.customerImpact.trim()) {
      errors.push('Customer impact is required');
    }
    if (!documentation.rootCauseAnalysis.primaryCause.trim()) {
      errors.push('Primary cause is required');
    }
    if (documentation.solutionImplementation.solutionSteps.length === 0) {
      errors.push('At least one solution step is required');
    }

    setValidationErrors(errors);
    setIsValid(errors.length === 0);
  };

  const updateProblemSummary = (field: keyof DocumentationData['problemSummary'], value: any) => {
    setDocumentation(prev => ({
      ...prev,
      problemSummary: {
        ...prev.problemSummary,
        [field]: value
      }
    }));
  };

  const updateTroubleshootingProcess = (field: keyof DocumentationData['troubleshootingProcess'], value: any) => {
    setDocumentation(prev => ({
      ...prev,
      troubleshootingProcess: {
        ...prev.troubleshootingProcess,
        [field]: value
      }
    }));
  };

  const updateRootCauseAnalysis = (field: keyof DocumentationData['rootCauseAnalysis'], value: any) => {
    setDocumentation(prev => ({
      ...prev,
      rootCauseAnalysis: {
        ...prev.rootCauseAnalysis,
        [field]: value
      }
    }));
  };

  const updateSolutionImplementation = (field: keyof DocumentationData['solutionImplementation'], value: any) => {
    setDocumentation(prev => ({
      ...prev,
      solutionImplementation: {
        ...prev.solutionImplementation,
        [field]: value
      }
    }));
  };

  const updateResolutionDetails = (field: keyof DocumentationData['resolutionDetails'], value: any) => {
    setDocumentation(prev => ({
      ...prev,
      resolutionDetails: {
        ...prev.resolutionDetails,
        [field]: value
      }
    }));
  };

  const addArrayItem = (section: keyof DocumentationData, field: string, value: string) => {
    if (!value.trim()) return;
    
    setDocumentation(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section][field] as string[]), value.trim()]
      }
    }));
  };

  const removeArrayItem = (section: keyof DocumentationData, field: string, index: number) => {
    setDocumentation(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section][field] as string[]).filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = () => {
    if (isValid) {
      onSave(documentation);
    }
  };

  const handleExport = (format: 'markdown' | 'html' | 'pdf') => {
    if (onExport && isValid) {
      onExport(format);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Time Tracking Integration */}
      {enableTimeTracking && (
        <TimeTracking
          ticketId={ticketId}
          onTimeUpdate={onTimeUpdate}
        />
      )}
      
      <div className="documentation-content max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ticket Resolution Documentation</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Documentation
          </Button>
          {onExport && (
            <div className="flex gap-1">
              <Button
                onClick={() => handleExport('markdown')}
                disabled={!isValid}
                variant="outline"
                size="sm"
              >
                Export MD
              </Button>
              <Button
                onClick={() => handleExport('html')}
                disabled={!isValid}
                variant="outline"
                size="sm"
              >
                Export HTML
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                disabled={!isValid}
                variant="outline"
                size="sm"
              >
                Export PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <h3 className="text-red-800 font-medium mb-2">Validation Errors:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Problem Summary Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Problem Summary</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Issue Description *</label>
              <textarea
                value={documentation.problemSummary.issueDescription}
                onChange={(e) => updateProblemSummary('issueDescription', e.target.value)}
                className="w-full p-3 border rounded-md h-24 resize-vertical"
                placeholder="Provide a clear, concise description of the issue..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Customer Impact *</label>
              <textarea
                value={documentation.problemSummary.customerImpact}
                onChange={(e) => updateProblemSummary('customerImpact', e.target.value)}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="Describe how this issue affected the customer..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Urgency Level</label>
              <select
                value={documentation.problemSummary.urgencyLevel}
                onChange={(e) => updateProblemSummary('urgencyLevel', e.target.value)}
                className="p-2 border rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Troubleshooting Process Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Process</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Initial Assessment</label>
              <textarea
                value={documentation.troubleshootingProcess.initialAssessment}
                onChange={(e) => updateTroubleshootingProcess('initialAssessment', e.target.value)}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="What was checked first when analyzing the issue..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Diagnostic Steps</label>
              <div className="space-y-2">
                {documentation.troubleshootingProcess.diagnosticSteps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-sm text-gray-500 pt-2">{index + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...documentation.troubleshootingProcess.diagnosticSteps];
                        newSteps[index] = e.target.value;
                        updateTroubleshootingProcess('diagnosticSteps', newSteps);
                      }}
                      className="flex-1 p-2 border rounded-md"
                    />
                    <Button
                      onClick={() => removeArrayItem('troubleshootingProcess', 'diagnosticSteps', index)}
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
                    placeholder="Enter diagnostic step..."
                    className="flex-1 p-2 border rounded-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('troubleshootingProcess', 'diagnosticSteps', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addArrayItem('troubleshootingProcess', 'diagnosticSteps', input.value);
                      input.value = '';
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Add Step
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Test Results</label>
              <textarea
                value={documentation.troubleshootingProcess.testResults}
                onChange={(e) => updateTroubleshootingProcess('testResults', e.target.value)}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="Results of diagnostic tests performed..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Solution Identification</label>
              <textarea
                value={documentation.troubleshootingProcess.solutionIdentification}
                onChange={(e) => updateTroubleshootingProcess('solutionIdentification', e.target.value)}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="How the solution was identified and chosen..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Root Cause Analysis Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Root Cause Analysis</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Primary Cause *</label>
              <textarea
                value={documentation.rootCauseAnalysis.primaryCause}
                onChange={(e) => updateRootCauseAnalysis('primaryCause', e.target.value)}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="The main root cause of the issue..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contributing Factors</label>
              <div className="space-y-2">
                {documentation.rootCauseAnalysis.contributingFactors.map((factor, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={factor}
                      onChange={(e) => {
                        const newFactors = [...documentation.rootCauseAnalysis.contributingFactors];
                        newFactors[index] = e.target.value;
                        updateRootCauseAnalysis('contributingFactors', newFactors);
                      }}
                      className="flex-1 p-2 border rounded-md"
                    />
                    <Button
                      onClick={() => removeArrayItem('rootCauseAnalysis', 'contributingFactors', index)}
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
                    placeholder="Enter contributing factor..."
                    className="flex-1 p-2 border rounded-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('rootCauseAnalysis', 'contributingFactors', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addArrayItem('rootCauseAnalysis', 'contributingFactors', input.value);
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
            <div>
              <label className="block text-sm font-medium mb-2">Prevention</label>
              <textarea
                value={documentation.rootCauseAnalysis.prevention}
                onChange={(e) => updateRootCauseAnalysis('prevention', e.target.value)}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="How to prevent this issue from occurring again..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Solution Implementation Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Solution Implementation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Solution Steps *</label>
              <div className="space-y-2">
                {documentation.solutionImplementation.solutionSteps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-sm text-gray-500 pt-2">{index + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...documentation.solutionImplementation.solutionSteps];
                        newSteps[index] = e.target.value;
                        updateSolutionImplementation('solutionSteps', newSteps);
                      }}
                      className="flex-1 p-2 border rounded-md"
                    />
                    <Button
                      onClick={() => removeArrayItem('solutionImplementation', 'solutionSteps', index)}
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
                    placeholder="Enter solution step..."
                    className="flex-1 p-2 border rounded-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('solutionImplementation', 'solutionSteps', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addArrayItem('solutionImplementation', 'solutionSteps', input.value);
                      input.value = '';
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Add Step
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Verification Testing</label>
              <textarea
                value={documentation.solutionImplementation.verificationTesting}
                onChange={(e) => updateSolutionImplementation('verificationTesting', e.target.value)}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="How the solution was tested and verified..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Customer Confirmation</label>
              <textarea
                value={documentation.solutionImplementation.customerConfirmation}
                onChange={(e) => updateSolutionImplementation('customerConfirmation', e.target.value)}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="Customer acceptance and confirmation of the solution..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Resolution Details Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Resolution Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Resolution Time (minutes)</label>
              <input
                type="number"
                value={documentation.resolutionDetails.resolutionTime}
                onChange={(e) => updateResolutionDetails('resolutionTime', parseInt(e.target.value) || 0)}
                className="w-32 p-2 border rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Resources Used</label>
              <div className="space-y-2">
                {documentation.resolutionDetails.resourcesUsed.map((resource, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={resource}
                      onChange={(e) => {
                        const newResources = [...documentation.resolutionDetails.resourcesUsed];
                        newResources[index] = e.target.value;
                        updateResolutionDetails('resourcesUsed', newResources);
                      }}
                      className="flex-1 p-2 border rounded-md"
                    />
                    <Button
                      onClick={() => removeArrayItem('resolutionDetails', 'resourcesUsed', index)}
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
                    placeholder="Enter resource used..."
                    className="flex-1 p-2 border rounded-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('resolutionDetails', 'resourcesUsed', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addArrayItem('resolutionDetails', 'resourcesUsed', input.value);
                      input.value = '';
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Add Resource
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Knowledge Gained</label>
              <textarea
                value={documentation.resolutionDetails.knowledgeGained}
                onChange={(e) => updateResolutionDetails('knowledgeGained', e.target.value)}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="What was learned from this resolution..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Follow-up Actions</label>
              <div className="space-y-2">
                {documentation.resolutionDetails.followupActions.map((action, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => {
                        const newActions = [...documentation.resolutionDetails.followupActions];
                        newActions[index] = e.target.value;
                        updateResolutionDetails('followupActions', newActions);
                      }}
                      className="flex-1 p-2 border rounded-md"
                    />
                    <Button
                      onClick={() => removeArrayItem('resolutionDetails', 'followupActions', index)}
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
                    placeholder="Enter follow-up action..."
                    className="flex-1 p-2 border rounded-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('resolutionDetails', 'followupActions', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addArrayItem('resolutionDetails', 'followupActions', input.value);
                      input.value = '';
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Add Action
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}