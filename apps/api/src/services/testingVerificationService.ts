import { logger } from '../utils/logger';

export interface TestCase {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  ticketId: string;
  testCases: TestCase[];
  overallStatus: 'not-started' | 'in-progress' | 'passed' | 'failed' | 'partial';
  passRate: number;
  totalDuration: number;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
  userId: string;
}

export interface TestExecution {
  id: string;
  testCaseId: string;
  testSuiteId: string;
  executedBy: string;
  startTime: Date;
  endTime?: Date;
  status: TestCase['status'];
  actualResult?: string;
  evidence?: string;
  notes?: string;
  environment?: string;
}

export interface TestMetrics {
  testSuiteId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  blockedTests: number;
  pendingTests: number;
  passRate: number;
  averageExecutionTime: number;
  testCoverage: number;
  riskAssessment: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
}

export interface TestTemplate {
  id: string;
  name: string;
  description: string;
  testType: TestCase['testType'];
  templateSteps: string[];
  expectedResultTemplate: string;
  prerequisites: string[];
  category: string;
  estimatedDuration: number; // in minutes
}

export class TestingVerificationService {
  private static instance: TestingVerificationService;
  private testSuites: Map<string, TestSuite> = new Map();
  private testExecutions: Map<string, TestExecution> = new Map();
  private testTemplates: Map<string, TestTemplate> = new Map();

  public static getInstance(): TestingVerificationService {
    if (!TestingVerificationService.instance) {
      TestingVerificationService.instance = new TestingVerificationService();
    }
    return TestingVerificationService.instance;
  }

  constructor() {
    this.initializeTestTemplates();
  }

  private initializeTestTemplates(): void {
    const defaultTemplates: TestTemplate[] = [
      {
        id: 'functional-basic',
        name: 'Basic Functional Test',
        description: 'Verify that a specific function works as expected',
        testType: 'functional',
        templateSteps: [
          'Navigate to the relevant system/application',
          'Locate the feature to be tested',
          'Execute the function with valid inputs',
          'Observe and record the results'
        ],
        expectedResultTemplate: 'The function should execute successfully and produce the expected output',
        prerequisites: ['System is accessible', 'User has appropriate permissions'],
        category: 'basic',
        estimatedDuration: 5
      },
      {
        id: 'integration-api',
        name: 'API Integration Test',
        description: 'Test integration between different system components via API',
        testType: 'integration',
        templateSteps: [
          'Set up test environment with all required components',
          'Configure API endpoints and authentication',
          'Send test request to the API',
          'Verify response format and data',
          'Check integration with downstream systems'
        ],
        expectedResultTemplate: 'API should respond correctly and data should flow properly between systems',
        prerequisites: ['Test environment is configured', 'API credentials are valid', 'All components are running'],
        category: 'technical',
        estimatedDuration: 15
      },
      {
        id: 'regression-workflow',
        name: 'Workflow Regression Test',
        description: 'Verify that existing workflows still function after changes',
        testType: 'regression',
        templateSteps: [
          'Identify the workflow to be tested',
          'Execute the complete workflow from start to finish',
          'Compare results with previous baseline',
          'Verify all intermediate steps function correctly',
          'Check that no new issues have been introduced'
        ],
        expectedResultTemplate: 'Workflow should complete successfully without any degradation from previous functionality',
        prerequisites: ['Baseline results are available', 'Test data is prepared'],
        category: 'workflow',
        estimatedDuration: 20
      },
      {
        id: 'user-acceptance-feedback',
        name: 'User Acceptance Feedback Test',
        description: 'Verify that the solution meets user requirements and expectations',
        testType: 'user-acceptance',
        templateSteps: [
          'Present the solution to the end user',
          'Guide user through the functionality',
          'Observe user interaction and behavior',
          'Collect user feedback and satisfaction rating',
          'Document any usability issues or suggestions'
        ],
        expectedResultTemplate: 'User should be able to complete their tasks efficiently and express satisfaction with the solution',
        prerequisites: ['End user is available', 'Solution is in testable state'],
        category: 'user-experience',
        estimatedDuration: 30
      },
      {
        id: 'performance-load',
        name: 'Performance Load Test',
        description: 'Verify system performance under expected load conditions',
        testType: 'performance',
        templateSteps: [
          'Set up performance monitoring tools',
          'Define load test scenarios and parameters',
          'Execute load test with monitoring active',
          'Measure response times and resource utilization',
          'Analyze results against performance criteria'
        ],
        expectedResultTemplate: 'System should maintain acceptable performance levels under the specified load',
        prerequisites: ['Performance monitoring tools are configured', 'Load test environment is prepared'],
        category: 'performance',
        estimatedDuration: 45
      }
    ];

    defaultTemplates.forEach(template => {
      this.testTemplates.set(template.id, template);
    });

    logger.info('Initialized testing verification templates', {
      templateCount: defaultTemplates.length
    });
  }

  async createTestSuite(
    name: string,
    description: string,
    ticketId: string,
    createdBy: string,
    userId: string
  ): Promise<string> {
    try {
      const suiteId = `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const testSuite: TestSuite = {
        id: suiteId,
        name,
        description,
        ticketId,
        testCases: [],
        overallStatus: 'not-started',
        passRate: 0,
        totalDuration: 0,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId
      };

      this.testSuites.set(suiteId, testSuite);

      logger.info('Created test suite', {
        suiteId,
        name,
        ticketId,
        createdBy,
        userId
      });

      return suiteId;
    } catch (error) {
      logger.error('Failed to create test suite', { error, name, ticketId, createdBy });
      throw error;
    }
  }

  async addTestCase(
    suiteId: string,
    testCaseData: Omit<TestCase, 'id' | 'testNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const testSuite = this.testSuites.get(suiteId);
      if (!testSuite) {
        throw new Error(`Test suite not found: ${suiteId}`);
      }

      const testCaseId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const testNumber = testSuite.testCases.length + 1;

      const testCase: TestCase = {
        ...testCaseData,
        id: testCaseId,
        testNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      testSuite.testCases.push(testCase);
      testSuite.updatedAt = new Date();
      await this.updateSuiteMetrics(suiteId);

      logger.info('Added test case to suite', {
        suiteId,
        testCaseId,
        testNumber,
        testType: testCase.testType
      });

      return testCaseId;
    } catch (error) {
      logger.error('Failed to add test case', { error, suiteId });
      throw error;
    }
  }

  async updateTestCase(
    suiteId: string,
    testCaseId: string,
    updates: Partial<TestCase>
  ): Promise<void> {
    try {
      const testSuite = this.testSuites.get(suiteId);
      if (!testSuite) {
        throw new Error(`Test suite not found: ${suiteId}`);
      }

      const testCaseIndex = testSuite.testCases.findIndex(tc => tc.id === testCaseId);
      if (testCaseIndex === -1) {
        throw new Error(`Test case not found: ${testCaseId}`);
      }

      testSuite.testCases[testCaseIndex] = {
        ...testSuite.testCases[testCaseIndex],
        ...updates,
        updatedAt: new Date()
      };

      testSuite.updatedAt = new Date();
      await this.updateSuiteMetrics(suiteId);

      logger.info('Updated test case', {
        suiteId,
        testCaseId,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      logger.error('Failed to update test case', { error, suiteId, testCaseId });
      throw error;
    }
  }

  async removeTestCase(suiteId: string, testCaseId: string): Promise<void> {
    try {
      const testSuite = this.testSuites.get(suiteId);
      if (!testSuite) {
        throw new Error(`Test suite not found: ${suiteId}`);
      }

      const testCaseIndex = testSuite.testCases.findIndex(tc => tc.id === testCaseId);
      if (testCaseIndex === -1) {
        throw new Error(`Test case not found: ${testCaseId}`);
      }

      testSuite.testCases.splice(testCaseIndex, 1);

      // Renumber remaining test cases
      testSuite.testCases.forEach((tc, index) => {
        tc.testNumber = index + 1;
      });

      testSuite.updatedAt = new Date();
      await this.updateSuiteMetrics(suiteId);

      logger.info('Removed test case from suite', {
        suiteId,
        testCaseId,
        remainingTests: testSuite.testCases.length
      });
    } catch (error) {
      logger.error('Failed to remove test case', { error, suiteId, testCaseId });
      throw error;
    }
  }

  async startTestExecution(
    suiteId: string,
    testCaseId: string,
    executedBy: string,
    environment?: string
  ): Promise<string> {
    try {
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const execution: TestExecution = {
        id: executionId,
        testCaseId,
        testSuiteId: suiteId,
        executedBy,
        startTime: new Date(),
        status: 'running',
        environment
      };

      this.testExecutions.set(executionId, execution);

      // Update test case status
      await this.updateTestCase(suiteId, testCaseId, {
        status: 'running',
        executedBy,
        executedAt: new Date()
      });

      logger.info('Started test execution', {
        executionId,
        suiteId,
        testCaseId,
        executedBy
      });

      return executionId;
    } catch (error) {
      logger.error('Failed to start test execution', { error, suiteId, testCaseId });
      throw error;
    }
  }

  async completeTestExecution(
    executionId: string,
    status: 'passed' | 'failed' | 'blocked',
    actualResult?: string,
    evidence?: string,
    notes?: string
  ): Promise<void> {
    try {
      const execution = this.testExecutions.get(executionId);
      if (!execution) {
        throw new Error(`Test execution not found: ${executionId}`);
      }

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - execution.startTime.getTime()) / 1000);

      // Update execution record
      execution.endTime = endTime;
      execution.status = status;
      execution.actualResult = actualResult;
      execution.evidence = evidence;
      execution.notes = notes;

      // Update test case
      await this.updateTestCase(execution.testSuiteId, execution.testCaseId, {
        status,
        actualResult,
        evidence,
        duration
      });

      logger.info('Completed test execution', {
        executionId,
        status,
        duration,
        testCaseId: execution.testCaseId
      });
    } catch (error) {
      logger.error('Failed to complete test execution', { error, executionId });
      throw error;
    }
  }

  async getTestSuite(suiteId: string): Promise<TestSuite | null> {
    try {
      const suite = this.testSuites.get(suiteId);
      return suite || null;
    } catch (error) {
      logger.error('Failed to get test suite', { error, suiteId });
      throw error;
    }
  }

  async getTestSuiteByTicket(ticketId: string): Promise<TestSuite | null> {
    try {
      for (const suite of this.testSuites.values()) {
        if (suite.ticketId === ticketId) {
          return suite;
        }
      }
      return null;
    } catch (error) {
      logger.error('Failed to get test suite by ticket', { error, ticketId });
      throw error;
    }
  }

  async getTestMetrics(suiteId: string): Promise<TestMetrics> {
    try {
      const testSuite = this.testSuites.get(suiteId);
      if (!testSuite) {
        throw new Error(`Test suite not found: ${suiteId}`);
      }

      const totalTests = testSuite.testCases.length;
      const passedTests = testSuite.testCases.filter(tc => tc.status === 'passed').length;
      const failedTests = testSuite.testCases.filter(tc => tc.status === 'failed').length;
      const blockedTests = testSuite.testCases.filter(tc => tc.status === 'blocked').length;
      const pendingTests = testSuite.testCases.filter(tc => tc.status === 'pending').length;

      const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      
      const executedTests = testSuite.testCases.filter(tc => tc.duration && tc.duration > 0);
      const averageExecutionTime = executedTests.length > 0 
        ? executedTests.reduce((sum, tc) => sum + (tc.duration || 0), 0) / executedTests.length
        : 0;

      // Simple test coverage calculation (based on test types)
      const testTypes = new Set(testSuite.testCases.map(tc => tc.testType));
      const testCoverage = (testTypes.size / 5) * 100; // 5 total test types

      // Risk assessment based on pass rate and failed tests
      let riskAssessment: TestMetrics['riskAssessment'] = 'low';
      if (failedTests > 0 || blockedTests > 0) {
        if (passRate < 70) riskAssessment = 'critical';
        else if (passRate < 85) riskAssessment = 'high';
        else riskAssessment = 'medium';
      }

      // Generate recommended actions
      const recommendedActions: string[] = [];
      if (pendingTests > 0) {
        recommendedActions.push(`Execute ${pendingTests} pending test(s)`);
      }
      if (failedTests > 0) {
        recommendedActions.push(`Investigate and fix ${failedTests} failed test(s)`);
      }
      if (blockedTests > 0) {
        recommendedActions.push(`Resolve blockers for ${blockedTests} blocked test(s)`);
      }
      if (passRate < 100 && passRate > 0) {
        recommendedActions.push('Review test results and address any issues before deployment');
      }
      if (testCoverage < 80) {
        recommendedActions.push('Consider adding more test types to improve coverage');
      }

      return {
        testSuiteId: suiteId,
        totalTests,
        passedTests,
        failedTests,
        blockedTests,
        pendingTests,
        passRate,
        averageExecutionTime,
        testCoverage,
        riskAssessment,
        recommendedActions
      };
    } catch (error) {
      logger.error('Failed to get test metrics', { error, suiteId });
      throw error;
    }
  }

  async getTestTemplates(): Promise<TestTemplate[]> {
    try {
      return Array.from(this.testTemplates.values());
    } catch (error) {
      logger.error('Failed to get test templates', { error });
      throw error;
    }
  }

  async getTestTemplate(templateId: string): Promise<TestTemplate | null> {
    try {
      return this.testTemplates.get(templateId) || null;
    } catch (error) {
      logger.error('Failed to get test template', { error, templateId });
      throw error;
    }
  }

  async createTestCaseFromTemplate(
    suiteId: string,
    templateId: string,
    customization?: Partial<TestCase>
  ): Promise<string> {
    try {
      const template = this.testTemplates.get(templateId);
      if (!template) {
        throw new Error(`Test template not found: ${templateId}`);
      }

      const testCaseData: Omit<TestCase, 'id' | 'testNumber' | 'createdAt' | 'updatedAt'> = {
        description: template.description,
        testType: template.testType,
        procedure: [...template.templateSteps],
        expectedResult: template.expectedResultTemplate,
        status: 'pending',
        priority: 'medium',
        prerequisites: [...template.prerequisites],
        ...customization
      };

      return await this.addTestCase(suiteId, testCaseData);
    } catch (error) {
      logger.error('Failed to create test case from template', { error, suiteId, templateId });
      throw error;
    }
  }

  private async updateSuiteMetrics(suiteId: string): Promise<void> {
    const testSuite = this.testSuites.get(suiteId);
    if (!testSuite) return;

    const totalTests = testSuite.testCases.length;
    const passedTests = testSuite.testCases.filter(tc => tc.status === 'passed').length;
    const failedTests = testSuite.testCases.filter(tc => tc.status === 'failed').length;
    const runningTests = testSuite.testCases.filter(tc => tc.status === 'running').length;
    const completedTests = passedTests + failedTests;

    // Calculate overall status
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

    // Calculate pass rate and total duration
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const totalDuration = testSuite.testCases.reduce((sum, tc) => sum + (tc.duration || 0), 0);
    
    // Check if all tests are completed
    const isCompleted = completedTests === totalTests && totalTests > 0;

    testSuite.overallStatus = overallStatus;
    testSuite.passRate = passRate;
    testSuite.totalDuration = totalDuration;
    if (isCompleted && !testSuite.completedAt) {
      testSuite.completedAt = new Date();
    }
  }

  async exportTestSuite(suiteId: string, format: 'json' | 'csv' | 'html'): Promise<string> {
    try {
      const testSuite = this.testSuites.get(suiteId);
      if (!testSuite) {
        throw new Error(`Test suite not found: ${suiteId}`);
      }

      switch (format) {
        case 'json':
          return JSON.stringify(testSuite, null, 2);
        case 'csv':
          return this.exportToCSV(testSuite);
        case 'html':
          return this.exportToHTML(testSuite);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Failed to export test suite', { error, suiteId, format });
      throw error;
    }
  }

  private exportToCSV(testSuite: TestSuite): string {
    const headers = [
      'Test Number', 'Description', 'Type', 'Priority', 'Status', 
      'Expected Result', 'Actual Result', 'Duration (seconds)', 
      'Executed By', 'Executed At'
    ];
    
    const rows = testSuite.testCases.map(tc => [
      tc.testNumber,
      `"${tc.description.replace(/"/g, '""')}"`,
      tc.testType,
      tc.priority,
      tc.status,
      `"${tc.expectedResult.replace(/"/g, '""')}"`,
      `"${(tc.actualResult || '').replace(/"/g, '""')}"`,
      tc.duration || 0,
      tc.executedBy || '',
      tc.executedAt?.toISOString() || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private exportToHTML(testSuite: TestSuite): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Test Suite Report: ${testSuite.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .metrics { display: flex; gap: 20px; margin-bottom: 20px; }
        .metric { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .test-case { border: 1px solid #ddd; margin-bottom: 10px; padding: 15px; border-radius: 5px; }
        .passed { border-color: #28a745; background: #f8fff8; }
        .failed { border-color: #dc3545; background: #fff8f8; }
        .blocked { border-color: #ffc107; background: #fffcf5; }
        .pending { border-color: #6c757d; background: #f8f9fa; }
        .running { border-color: #007bff; background: #f8fcff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Suite Report: ${testSuite.name}</h1>
        <p><strong>Description:</strong> ${testSuite.description}</p>
        <p><strong>Overall Status:</strong> ${testSuite.overallStatus.toUpperCase()}</p>
        <p><strong>Created:</strong> ${testSuite.createdAt.toLocaleDateString()} by ${testSuite.createdBy}</p>
        ${testSuite.completedAt ? `<p><strong>Completed:</strong> ${testSuite.completedAt.toLocaleDateString()}</p>` : ''}
    </div>
    
    <div class="metrics">
        <div class="metric">
            <h3>${testSuite.testCases.length}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric">
            <h3>${testSuite.testCases.filter(tc => tc.status === 'passed').length}</h3>
            <p>Passed</p>
        </div>
        <div class="metric">
            <h3>${testSuite.testCases.filter(tc => tc.status === 'failed').length}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${testSuite.passRate.toFixed(1)}%</h3>
            <p>Pass Rate</p>
        </div>
    </div>
    
    <h2>Test Cases</h2>
    ${testSuite.testCases.map(tc => `
        <div class="test-case ${tc.status}">
            <h3>Test ${tc.testNumber}: ${tc.description}</h3>
            <p><strong>Type:</strong> ${tc.testType} | <strong>Priority:</strong> ${tc.priority} | <strong>Status:</strong> ${tc.status.toUpperCase()}</p>
            <p><strong>Expected Result:</strong> ${tc.expectedResult}</p>
            ${tc.actualResult ? `<p><strong>Actual Result:</strong> ${tc.actualResult}</p>` : ''}
            ${tc.duration ? `<p><strong>Duration:</strong> ${Math.floor(tc.duration / 60)}m ${tc.duration % 60}s</p>` : ''}
            ${tc.executedBy ? `<p><strong>Executed by:</strong> ${tc.executedBy} ${tc.executedAt ? `on ${tc.executedAt.toLocaleDateString()}` : ''}</p>` : ''}
        </div>
    `).join('')}
    
    <div style="margin-top: 20px; font-size: 12px; color: #666;">
        Report generated on ${new Date().toISOString()}
    </div>
</body>
</html>`;
  }

  async deleteTestSuite(suiteId: string): Promise<void> {
    try {
      const testSuite = this.testSuites.get(suiteId);
      if (!testSuite) {
        throw new Error(`Test suite not found: ${suiteId}`);
      }

      // Remove related test executions
      for (const [execId, execution] of this.testExecutions.entries()) {
        if (execution.testSuiteId === suiteId) {
          this.testExecutions.delete(execId);
        }
      }

      this.testSuites.delete(suiteId);

      logger.info('Deleted test suite', {
        suiteId,
        testCaseCount: testSuite.testCases.length
      });
    } catch (error) {
      logger.error('Failed to delete test suite', { error, suiteId });
      throw error;
    }
  }
}