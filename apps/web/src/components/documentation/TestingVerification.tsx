'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface TestCase {
  id: string;
  testNumber: number;
  description: string;
  testType: 'functional' | 'integration' | 'regression' | 'user-acceptance' | 'performance';
  procedure: string[];
  expectedResult: string;
  actualResult?: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'blocked';
  evidence?: string;
  executedBy?: string;
  executedAt?: Date;
  duration?: number; // in seconds
  priority: 'low' | 'medium' | 'high' | 'critical';
  prerequisites?: string[];
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  overallStatus: 'not-started' | 'in-progress' | 'passed' | 'failed' | 'partial';
  passRate: number;
  totalDuration: number;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

interface TestingVerificationProps {
  initialTestSuite?: TestSuite;
  onChange: (testSuite: TestSuite) => void;
  readOnly?: boolean;
  ticketId?: string;
}

const testTypes = [
  { value: 'functional', label: 'Functional Test', description: 'Verify specific functionality works as expected' },
  { value: 'integration', label: 'Integration Test', description: 'Test interaction between different components' },
  { value: 'regression', label: 'Regression Test', description: 'Ensure existing functionality still works' },
  { value: 'user-acceptance', label: 'User Acceptance Test', description: 'Verify solution meets user requirements' },
  { value: 'performance', label: 'Performance Test', description: 'Test system performance and response times' }
];

const testTemplates = {
  functional: {
    description: 'Verify [feature/function] works correctly',
    procedure: [
      'Navigate to [location/feature]',
      'Perform [specific action]',
      'Observe the result'
    ],
    expectedResult: 'The [feature/function] should work as expected'
  },
  integration: {
    description: 'Test integration between [component A] and [component B]',
    procedure: [
      'Set up test environment with both components',
      'Trigger interaction between components',
      'Verify data flow and communication'
    ],
    expectedResult: 'Components should integrate seamlessly'
  },
  regression: {
    description: 'Ensure [existing functionality] still works after changes',
    procedure: [
      'Identify previously working functionality',
      'Execute standard test procedures',
      'Compare results with baseline'
    ],
    expectedResult: 'All existing functionality remains intact'
  },
  'user-acceptance': {
    description: 'Verify solution meets user requirements',
    procedure: [
      'Present solution to end user',
      'Guide user through testing process',
      'Gather user feedback'
    ],
    expectedResult: 'User confirms solution meets their needs'
  },
  performance: {
    description: 'Verify system performance meets requirements',
    procedure: [
      'Set up performance monitoring',
      'Execute performance test scenarios',
      'Measure response times and resource usage'
    ],
    expectedResult: 'System performance meets defined criteria'
  }
};

export default function TestingVerification({
  initialTestSuite,
  onChange,
  readOnly = false,
  ticketId
}: TestingVerificationProps) {
  const [testSuite, setTestSuite] = useState<TestSuite>(initialTestSuite || {
    id: `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Suite for Ticket ${ticketId || 'Unknown'}`,
    description: '',
    testCases: [],
    overallStatus: 'not-started',
    passRate: 0,
    totalDuration: 0,
    createdBy: '',
    createdAt: new Date()
  });

  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [showTemplateHelper, setShowTemplateHelper] = useState(false);

  useEffect(() => {
    const updatedSuite = calculateTestSuiteMetrics(testSuite);
    if (updatedSuite !== testSuite) {
      setTestSuite(updatedSuite);
    }
    onChange(updatedSuite);
  }, [testSuite.testCases, onChange]);

  const calculateTestSuiteMetrics = (suite: TestSuite): TestSuite => {
    const totalTests = suite.testCases.length;
    const passedTests = suite.testCases.filter(tc => tc.status === 'passed').length;
    const failedTests = suite.testCases.filter(tc => tc.status === 'failed').length;
    const runningTests = suite.testCases.filter(tc => tc.status === 'running').length;
    const completedTests = passedTests + failedTests;
    
    let overallStatus: TestSuite['overallStatus'] = 'not-started';
    if (runningTests > 0) {
      overallStatus = 'in-progress';
    } else if (completedTests === 0) {
      overallStatus = 'not-started';
    } else if (failedTests > 0) {
      overallStatus = passedTests > 0 ? 'partial' : 'failed';
    } else if (passedTests === totalTests && totalTests > 0) {
      overallStatus = 'passed';
    } else if (completedTests < totalTests) {
      overallStatus = 'in-progress';
    }

    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const totalDuration = suite.testCases.reduce((sum, tc) => sum + (tc.duration || 0), 0);
    const isCompleted = completedTests === totalTests && totalTests > 0;

    return {
      ...suite,
      overallStatus,
      passRate,
      totalDuration,
      completedAt: isCompleted && !suite.completedAt ? new Date() : suite.completedAt
    };
  };

  const generateTestId = (): string => {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addTestCase = (testType?: TestCase['testType']): void => {
    const template = testType ? testTemplates[testType] : testTemplates.functional;
    
    const newTestCase: TestCase = {
      id: generateTestId(),
      testNumber: testSuite.testCases.length + 1,
      description: template.description,
      testType: testType || 'functional',
      procedure: [...template.procedure],
      expectedResult: template.expectedResult,
      status: 'pending',
      priority: 'medium',
      prerequisites: []
    };

    setTestSuite(prev => ({
      ...prev,
      testCases: [...prev.testCases, newTestCase]
    }));
  };

  const updateTestCase = (testId: string, field: keyof TestCase, value: any): void => {
    setTestSuite(prev => ({
      ...prev,
      testCases: prev.testCases.map(tc => 
        tc.id === testId ? { ...tc, [field]: value } : tc
      )
    }));
  };

  const removeTestCase = (testId: string): void => {
    setTestSuite(prev => {
      const updatedTestCases = prev.testCases
        .filter(tc => tc.id !== testId)
        .map((tc, index) => ({ ...tc, testNumber: index + 1 }));
      
      return {
        ...prev,
        testCases: updatedTestCases
      };
    });
  };

  const startTest = (testId: string): void => {
    updateTestCase(testId, 'status', 'running');
    updateTestCase(testId, 'executedBy', testSuite.createdBy || 'Current User');
    updateTestCase(testId, 'executedAt', new Date());
    setCurrentTestId(testId);
    setTestStartTime(new Date());
  };

  const completeTest = (testId: string, status: 'passed' | 'failed' | 'blocked', actualResult?: string, evidence?: string): void => {
    if (currentTestId === testId && testStartTime) {
      const duration = Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000);
      updateTestCase(testId, 'duration', duration);
    }
    
    updateTestCase(testId, 'status', status);
    if (actualResult) updateTestCase(testId, 'actualResult', actualResult);
    if (evidence) updateTestCase(testId, 'evidence', evidence);
    
    setCurrentTestId(null);
    setTestStartTime(null);
  };

  const addProcedureStep = (testId: string, step: string): void => {
    if (!step.trim()) return;
    
    const testCase = testSuite.testCases.find(tc => tc.id === testId);
    if (testCase) {
      updateTestCase(testId, 'procedure', [...testCase.procedure, step.trim()]);
    }
  };

  const removeProcedureStep = (testId: string, stepIndex: number): void => {
    const testCase = testSuite.testCases.find(tc => tc.id === testId);
    if (testCase) {
      const updatedProcedure = testCase.procedure.filter((_, index) => index !== stepIndex);
      updateTestCase(testId, 'procedure', updatedProcedure);
    }
  };

  const updateProcedureStep = (testId: string, stepIndex: number, step: string): void => {
    const testCase = testSuite.testCases.find(tc => tc.id === testId);
    if (testCase) {
      const updatedProcedure = [...testCase.procedure];
      updatedProcedure[stepIndex] = step;
      updateTestCase(testId, 'procedure', updatedProcedure);
    }
  };

  const getStatusColor = (status: TestCase['status']): string => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'blocked': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Not tracked';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const generateTestReport = (): string => {
    const report = `# Testing Verification Report

## Test Suite Summary
**Name:** ${testSuite.name}
**Description:** ${testSuite.description}
**Overall Status:** ${testSuite.overallStatus.toUpperCase()}
**Pass Rate:** ${testSuite.passRate.toFixed(1)}%
**Total Duration:** ${formatDuration(testSuite.totalDuration)}
**Created:** ${testSuite.createdAt.toLocaleDateString()}
${testSuite.completedAt ? `**Completed:** ${testSuite.completedAt.toLocaleDateString()}` : ''}

## Test Results Summary
- **Total Tests:** ${testSuite.testCases.length}
- **Passed:** ${testSuite.testCases.filter(tc => tc.status === 'passed').length}
- **Failed:** ${testSuite.testCases.filter(tc => tc.status === 'failed').length}
- **Blocked:** ${testSuite.testCases.filter(tc => tc.status === 'blocked').length}
- **Pending:** ${testSuite.testCases.filter(tc => tc.status === 'pending').length}

## Test Case Details

${testSuite.testCases.map(tc => `
### Test ${tc.testNumber}: ${tc.description}
**Type:** ${testTypes.find(t => t.value === tc.testType)?.label}
**Priority:** ${tc.priority.toUpperCase()}
**Status:** ${tc.status.toUpperCase()}
${tc.duration ? `**Duration:** ${formatDuration(tc.duration)}` : ''}

**Test Procedure:**
${tc.procedure.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Expected Result:** ${tc.expectedResult}
${tc.actualResult ? `**Actual Result:** ${tc.actualResult}` : ''}
${tc.evidence ? `**Evidence:** ${tc.evidence}` : ''}

---`).join('')}

*Generated on ${new Date().toISOString()}*`;

    return report;
  };

  if (readOnly) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Testing Verification</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                testSuite.overallStatus === 'passed' ? 'bg-green-100 text-green-800' :
                testSuite.overallStatus === 'failed' ? 'bg-red-100 text-red-800' :
                testSuite.overallStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                testSuite.overallStatus === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {testSuite.overallStatus.toUpperCase()}
              </span>
              <Button
                onClick={() => navigator.clipboard.writeText(generateTestReport())}
                variant="outline"
                size="sm"
              >
                Copy Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testSuite.testCases.length}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {testSuite.testCases.filter(tc => tc.status === 'passed').length}
              </div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {testSuite.testCases.filter(tc => tc.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{testSuite.passRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Pass Rate</div>
            </div>
          </div>

          <div className="space-y-4">
            {testSuite.testCases.map((testCase) => (
              <div key={testCase.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Test {testCase.testNumber}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(testCase.status)}`}>
                      {testCase.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {testTypes.find(t => t.value === testCase.testType)?.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDuration(testCase.duration)}
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-2">{testCase.description}</div>
                {testCase.actualResult && (
                  <div className="text-sm">
                    <span className="font-medium">Result:</span> {testCase.actualResult}
                  </div>
                )}
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
            <h3 className="text-lg font-semibold">Testing Verification</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowTemplateHelper(!showTemplateHelper)}
                variant="outline"
                size="sm"
              >
                {showTemplateHelper ? 'Hide Templates' : 'Show Templates'}
              </Button>
              <Button
                onClick={() => addTestCase()}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Add Test Case
              </Button>
            </div>
          </div>

          {/* Test Suite Metadata */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Suite Name</label>
                <input
                  type="text"
                  value={testSuite.name}
                  onChange={(e) => setTestSuite(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter test suite name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Created By</label>
                <input
                  type="text"
                  value={testSuite.createdBy}
                  onChange={(e) => setTestSuite(prev => ({ ...prev, createdBy: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Your name"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={testSuite.description}
                onChange={(e) => setTestSuite(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border rounded-md h-20 resize-vertical"
                placeholder="Describe the purpose and scope of this test suite..."
              />
            </div>
          </div>

          {/* Template Helper */}
          {showTemplateHelper && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <div className="p-4">
                <h4 className="font-medium text-blue-900 mb-3">Test Case Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {testTypes.map((type) => (
                    <div key={type.value} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-gray-600">{type.description}</div>
                      </div>
                      <Button
                        onClick={() => addTestCase(type.value as TestCase['testType'])}
                        variant="outline"
                        size="sm"
                        className="text-blue-600"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Test Suite Summary */}
          {testSuite.testCases.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{testSuite.testCases.length}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {testSuite.testCases.filter(tc => tc.status === 'passed').length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">
                  {testSuite.testCases.filter(tc => tc.status === 'failed').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-600">{testSuite.passRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Pass Rate</div>
              </div>
            </div>
          )}

          {/* Test Cases */}
          <div className="space-y-4">
            {testSuite.testCases.map((testCase) => {
              const isRunning = currentTestId === testCase.id;
              
              return (
                <div key={testCase.id} className="border rounded-lg p-4 relative">
                  {/* Test Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Test {testCase.testNumber}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(testCase.status)}`}>
                        {testCase.status.toUpperCase()}
                      </span>
                      <select
                        value={testCase.testType}
                        onChange={(e) => updateTestCase(testCase.id, 'testType', e.target.value)}
                        className="text-xs border rounded px-1 py-0.5"
                      >
                        {testTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={testCase.priority}
                        onChange={(e) => updateTestCase(testCase.id, 'priority', e.target.value)}
                        className="text-xs border rounded px-1 py-0.5"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatDuration(testCase.duration)}
                      </span>
                      <Button
                        onClick={() => removeTestCase(testCase.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* Test Description */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Test Description</label>
                    <input
                      type="text"
                      value={testCase.description}
                      onChange={(e) => updateTestCase(testCase.id, 'description', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Describe what this test verifies..."
                    />
                  </div>

                  {/* Test Procedure */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Test Procedure</label>
                    <div className="space-y-2">
                      {testCase.procedure.map((step, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-sm text-gray-500 pt-2">{index + 1}.</span>
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => updateProcedureStep(testCase.id, index, e.target.value)}
                            className="flex-1 p-2 border rounded-md text-sm"
                          />
                          <Button
                            onClick={() => removeProcedureStep(testCase.id, index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <span className="text-sm text-gray-500 pt-2">{testCase.procedure.length + 1}.</span>
                        <input
                          type="text"
                          placeholder="Add test step..."
                          className="flex-1 p-2 border rounded-md text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addProcedureStep(testCase.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addProcedureStep(testCase.id, input.value);
                            input.value = '';
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expected Result */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Expected Result</label>
                    <textarea
                      value={testCase.expectedResult}
                      onChange={(e) => updateTestCase(testCase.id, 'expectedResult', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm h-16 resize-vertical"
                      placeholder="What should happen when this test is executed..."
                    />
                  </div>

                  {/* Actual Result (shown when test is executed) */}
                  {(testCase.status !== 'pending') && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Actual Result</label>
                      <textarea
                        value={testCase.actualResult || ''}
                        onChange={(e) => updateTestCase(testCase.id, 'actualResult', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm h-16 resize-vertical"
                        placeholder="What actually happened during test execution..."
                      />
                    </div>
                  )}

                  {/* Evidence Field */}
                  {(testCase.status !== 'pending') && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Evidence/Notes</label>
                      <textarea
                        value={testCase.evidence || ''}
                        onChange={(e) => updateTestCase(testCase.id, 'evidence', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm h-12 resize-vertical"
                        placeholder="Screenshots, logs, or other evidence..."
                      />
                    </div>
                  )}

                  {/* Test Actions */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      {testCase.status === 'pending' && (
                        <Button
                          onClick={() => startTest(testCase.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Test
                        </Button>
                      )}
                      {isRunning && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => completeTest(testCase.id, 'passed', testCase.actualResult, testCase.evidence)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Pass
                          </Button>
                          <Button
                            onClick={() => completeTest(testCase.id, 'failed', testCase.actualResult, testCase.evidence)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Fail
                          </Button>
                          <Button
                            onClick={() => completeTest(testCase.id, 'blocked', testCase.actualResult, testCase.evidence)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Block
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      {testCase.executedBy && `Executed by: ${testCase.executedBy}`}
                      {testCase.executedAt && ` on ${testCase.executedAt.toLocaleDateString()}`}
                    </div>
                  </div>

                  {/* Running Indicator */}
                  {isRunning && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {testSuite.testCases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No test cases added yet.</p>
              <Button onClick={() => addTestCase()} className="bg-blue-600 hover:bg-blue-700">
                Add First Test Case
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}