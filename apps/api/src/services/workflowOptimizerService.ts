import { logger } from '../utils/logger';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  estimatedTime: number; // in milliseconds
  prerequisites: string[];
  outputs: string[];
  isOptional: boolean;
  category: 'search' | 'analysis' | 'documentation' | 'communication' | 'resolution';
}

export interface WorkflowPattern {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggerConditions: TriggerCondition[];
  expectedDuration: number;
  successRate: number;
  usageCount: number;
  lastUsed: Date;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
  value: any;
}

export interface WorkflowExecution {
  id: string;
  patternId: string;
  ticketId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  currentStep: string;
  completedSteps: string[];
  skippedSteps: string[];
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  performance: WorkflowPerformance;
}

export interface WorkflowPerformance {
  totalTime: number;
  searchTime: number;
  analysisTime: number;
  documentationTime: number;
  communicationTime: number;
  efficiencyScore: number; // 0-1
  qualityScore: number; // 0-1
  userSatisfactionScore?: number; // 0-1
}

export interface OptimizationSuggestion {
  id: string;
  type: 'step_reorder' | 'step_skip' | 'parallel_execution' | 'tool_suggestion' | 'template_use';
  title: string;
  description: string;
  expectedBenefit: string;
  estimatedTimeSavings: number;
  confidenceLevel: number; // 0-1
  applicablePatterns: string[];
  implementation: OptimizationImplementation;
}

export interface OptimizationImplementation {
  automatic: boolean;
  instructions: string[];
  requiredActions: string[];
  validation: string[];
}

export interface WorkflowAnalytics {
  totalExecutions: number;
  averageDuration: number;
  successRate: number;
  mostUsedPatterns: { patternId: string; count: number; name: string }[];
  performanceTrends: { date: string; avgEfficiency: number; avgQuality: number }[];
  bottlenecks: { stepId: string; averageTime: number; frequency: number }[];
  optimizationImpact: { suggestionId: string; adoptionRate: number; timeSaved: number }[];
}

export class WorkflowOptimizerService {
  private workflowPatterns: Map<string, WorkflowPattern> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private completedExecutions: WorkflowExecution[] = [];
  private optimizationSuggestions: Map<string, OptimizationSuggestion> = new Map();
  private performanceHistory: WorkflowPerformance[] = [];

  constructor() {
    this.initializeDefaultPatterns();
    this.initializeOptimizationSuggestions();
  }

  private initializeDefaultPatterns(): void {
    const defaultPatterns: WorkflowPattern[] = [
      {
        id: 'standard-ticket-resolution',
        name: 'Standard Ticket Resolution',
        description: 'Standard workflow for resolving IT support tickets',
        steps: [
          {
            id: 'initial-assessment',
            name: 'Initial Assessment',
            description: 'Read and understand the ticket details',
            estimatedTime: 120000, // 2 minutes
            prerequisites: [],
            outputs: ['issue-understanding', 'priority-assessment'],
            isOptional: false,
            category: 'analysis'
          },
          {
            id: 'context-extraction',
            name: 'Context Extraction',
            description: 'Extract key information and context from ticket',
            estimatedTime: 90000, // 1.5 minutes
            prerequisites: ['initial-assessment'],
            outputs: ['extracted-context', 'search-keywords'],
            isOptional: false,
            category: 'analysis'
          },
          {
            id: 'knowledge-search',
            name: 'Knowledge Base Search',
            description: 'Search for relevant solutions and documentation',
            estimatedTime: 300000, // 5 minutes
            prerequisites: ['context-extraction'],
            outputs: ['search-results', 'potential-solutions'],
            isOptional: false,
            category: 'search'
          },
          {
            id: 'solution-analysis',
            name: 'Solution Analysis',
            description: 'Analyze and evaluate found solutions',
            estimatedTime: 240000, // 4 minutes
            prerequisites: ['knowledge-search'],
            outputs: ['validated-solution', 'implementation-plan'],
            isOptional: false,
            category: 'analysis'
          },
          {
            id: 'customer-communication',
            name: 'Customer Communication',
            description: 'Communicate with customer about solution',
            estimatedTime: 180000, // 3 minutes
            prerequisites: ['solution-analysis'],
            outputs: ['customer-response', 'solution-acceptance'],
            isOptional: false,
            category: 'communication'
          },
          {
            id: 'documentation',
            name: 'Documentation',
            description: 'Document the solution and resolution process',
            estimatedTime: 150000, // 2.5 minutes
            prerequisites: ['customer-communication'],
            outputs: ['resolution-notes', 'knowledge-article'],
            isOptional: true,
            category: 'documentation'
          },
          {
            id: 'ticket-closure',
            name: 'Ticket Closure',
            description: 'Close the ticket and follow up if needed',
            estimatedTime: 60000, // 1 minute
            prerequisites: ['customer-communication'],
            outputs: ['closed-ticket', 'follow-up-scheduled'],
            isOptional: false,
            category: 'resolution'
          }
        ],
        triggerConditions: [
          { field: 'issueType', operator: 'contains', value: 'general' }
        ],
        expectedDuration: 1140000, // 19 minutes
        successRate: 0.85,
        usageCount: 0,
        lastUsed: new Date()
      },
      {
        id: 'complex-technical-issue',
        name: 'Complex Technical Issue',
        description: 'Workflow for complex technical problems requiring deep research',
        steps: [
          {
            id: 'detailed-assessment',
            name: 'Detailed Technical Assessment',
            description: 'Thorough analysis of technical details',
            estimatedTime: 300000, // 5 minutes
            prerequisites: [],
            outputs: ['technical-analysis', 'system-impact'],
            isOptional: false,
            category: 'analysis'
          },
          {
            id: 'research-planning',
            name: 'Research Planning',
            description: 'Plan comprehensive research strategy',
            estimatedTime: 180000, // 3 minutes
            prerequisites: ['detailed-assessment'],
            outputs: ['research-plan', 'search-strategy'],
            isOptional: false,
            category: 'analysis'
          },
          {
            id: 'comprehensive-search',
            name: 'Comprehensive Search',
            description: 'Multi-source research and documentation review',
            estimatedTime: 600000, // 10 minutes
            prerequisites: ['research-planning'],
            outputs: ['comprehensive-results', 'expert-sources'],
            isOptional: false,
            category: 'search'
          },
          {
            id: 'solution-testing',
            name: 'Solution Testing',
            description: 'Test and validate potential solutions',
            estimatedTime: 900000, // 15 minutes
            prerequisites: ['comprehensive-search'],
            outputs: ['tested-solution', 'validation-results'],
            isOptional: true,
            category: 'analysis'
          },
          {
            id: 'expert-consultation',
            name: 'Expert Consultation',
            description: 'Consult with subject matter experts',
            estimatedTime: 1200000, // 20 minutes
            prerequisites: ['comprehensive-search'],
            outputs: ['expert-opinion', 'specialized-solution'],
            isOptional: true,
            category: 'communication'
          },
          {
            id: 'detailed-documentation',
            name: 'Detailed Documentation',
            description: 'Create comprehensive documentation',
            estimatedTime: 420000, // 7 minutes
            prerequisites: ['solution-testing', 'expert-consultation'],
            outputs: ['technical-documentation', 'procedure-guide'],
            isOptional: false,
            category: 'documentation'
          }
        ],
        triggerConditions: [
          { field: 'priority', operator: 'equals', value: 'high' },
          { field: 'complexity', operator: 'greater_than', value: 7 }
        ],
        expectedDuration: 3600000, // 60 minutes
        successRate: 0.75,
        usageCount: 0,
        lastUsed: new Date()
      }
    ];

    defaultPatterns.forEach(pattern => {
      this.workflowPatterns.set(pattern.id, pattern);
    });

    logger.info('Workflow patterns initialized', {
      patternCount: this.workflowPatterns.size
    });
  }

  private initializeOptimizationSuggestions(): void {
    const suggestions: OptimizationSuggestion[] = [
      {
        id: 'parallel-search-analysis',
        type: 'parallel_execution',
        title: 'Parallel Search and Analysis',
        description: 'Run initial analysis while conducting knowledge base search',
        expectedBenefit: 'Reduce overall workflow time by 15-20%',
        estimatedTimeSavings: 120000, // 2 minutes
        confidenceLevel: 0.85,
        applicablePatterns: ['standard-ticket-resolution'],
        implementation: {
          automatic: true,
          instructions: [
            'Start initial analysis immediately after context extraction',
            'Begin knowledge search in parallel with analysis',
            'Synchronize results when both complete'
          ],
          requiredActions: [
            'Enable parallel execution in workflow engine',
            'Update timing calculations'
          ],
          validation: [
            'Verify analysis quality remains high',
            'Monitor for resource conflicts',
            'Check user experience impact'
          ]
        }
      },
      {
        id: 'smart-template-suggestion',
        type: 'template_use',
        title: 'Smart Template Suggestions',
        description: 'Automatically suggest templates based on issue type',
        expectedBenefit: 'Improve documentation consistency and speed',
        estimatedTimeSavings: 90000, // 1.5 minutes
        confidenceLevel: 0.9,
        applicablePatterns: ['standard-ticket-resolution', 'complex-technical-issue'],
        implementation: {
          automatic: true,
          instructions: [
            'Analyze issue type and context',
            'Match with appropriate templates',
            'Pre-populate common fields'
          ],
          requiredActions: [
            'Build template matching engine',
            'Create template library',
            'Implement auto-suggestion UI'
          ],
          validation: [
            'Verify template relevance accuracy',
            'Check user acceptance rates',
            'Monitor documentation quality'
          ]
        }
      },
      {
        id: 'skip-redundant-searches',
        type: 'step_skip',
        title: 'Skip Redundant Searches',
        description: 'Skip additional searches when high-confidence solutions are found',
        expectedBenefit: 'Reduce search time for obvious issues',
        estimatedTimeSavings: 180000, // 3 minutes
        confidenceLevel: 0.75,
        applicablePatterns: ['standard-ticket-resolution'],
        implementation: {
          automatic: false,
          instructions: [
            'Check solution confidence score',
            'Evaluate search result quality',
            'Offer to skip additional searches'
          ],
          requiredActions: [
            'Implement confidence scoring',
            'Add skip confirmation UI',
            'Update workflow logic'
          ],
          validation: [
            'Monitor solution accuracy when skipping',
            'Track user satisfaction',
            'Measure time savings vs. quality trade-off'
          ]
        }
      }
    ];

    suggestions.forEach(suggestion => {
      this.optimizationSuggestions.set(suggestion.id, suggestion);
    });

    logger.info('Optimization suggestions initialized', {
      suggestionCount: this.optimizationSuggestions.size
    });
  }

  // Pattern Management
  async getRecommendedPattern(ticketContext: any): Promise<WorkflowPattern | null> {
    try {
      const patterns = Array.from(this.workflowPatterns.values());
      
      // Score patterns based on how well they match the context
      const scoredPatterns = patterns.map(pattern => ({
        pattern,
        score: this.calculatePatternScore(pattern, ticketContext)
      }));

      // Sort by score and return the best match
      scoredPatterns.sort((a, b) => b.score - a.score);
      
      const bestPattern = scoredPatterns[0];
      if (bestPattern && bestPattern.score > 0.3) { // Minimum confidence threshold
        logger.info('Pattern recommended', {
          patternId: bestPattern.pattern.id,
          score: bestPattern.score,
          ticketId: ticketContext.ticketId
        });
        
        return bestPattern.pattern;
      }

      logger.info('No suitable pattern found', { ticketId: ticketContext.ticketId });
      return null;

    } catch (error) {
      logger.error('Error getting recommended pattern:', error);
      throw error;
    }
  }

  private calculatePatternScore(pattern: WorkflowPattern, context: any): number {
    let score = 0;

    // Check trigger conditions
    for (const condition of pattern.triggerConditions) {
      const contextValue = context[condition.field];
      if (this.evaluateCondition(contextValue, condition)) {
        score += 0.4; // Base score for matching condition
      }
    }

    // Factor in success rate
    score += pattern.successRate * 0.3;

    // Factor in usage frequency (popular patterns get slight boost)
    const usageBoost = Math.min(pattern.usageCount / 100, 0.2);
    score += usageBoost;

    // Penalize very old patterns
    const daysSinceUsed = (Date.now() - pattern.lastUsed.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceUsed > 30) {
      score -= 0.1;
    }

    return Math.min(score, 1);
  }

  private evaluateCondition(value: any, condition: TriggerCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return typeof value === 'string' && value.toLowerCase().includes(condition.value.toLowerCase());
      case 'greater_than':
        return typeof value === 'number' && value > condition.value;
      case 'less_than':
        return typeof value === 'number' && value < condition.value;
      case 'regex':
        return typeof value === 'string' && new RegExp(condition.value).test(value);
      default:
        return false;
    }
  }

  // Execution Management
  async startWorkflowExecution(
    patternId: string,
    ticketId: string,
    userId: string
  ): Promise<WorkflowExecution> {
    try {
      const pattern = this.workflowPatterns.get(patternId);
      if (!pattern) {
        throw new Error(`Workflow pattern not found: ${patternId}`);
      }

      const execution: WorkflowExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternId,
        ticketId,
        userId,
        startTime: new Date(),
        currentStep: pattern.steps[0].id,
        completedSteps: [],
        skippedSteps: [],
        status: 'running',
        performance: {
          totalTime: 0,
          searchTime: 0,
          analysisTime: 0,
          documentationTime: 0,
          communicationTime: 0,
          efficiencyScore: 0,
          qualityScore: 0
        }
      };

      this.activeExecutions.set(execution.id, execution);

      // Update pattern usage
      pattern.usageCount++;
      pattern.lastUsed = new Date();

      logger.info('Workflow execution started', {
        executionId: execution.id,
        patternId,
        ticketId,
        userId
      });

      return execution;

    } catch (error) {
      logger.error('Error starting workflow execution:', error);
      throw error;
    }
  }

  async completeWorkflowStep(
    executionId: string,
    stepId: string,
    duration: number,
    quality?: number
  ): Promise<void> {
    try {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        throw new Error(`Workflow execution not found: ${executionId}`);
      }

      const pattern = this.workflowPatterns.get(execution.patternId);
      if (!pattern) {
        throw new Error(`Workflow pattern not found: ${execution.patternId}`);
      }

      const step = pattern.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error(`Workflow step not found: ${stepId}`);
      }

      // Update execution
      execution.completedSteps.push(stepId);
      execution.performance.totalTime += duration;

      // Update category-specific time
      switch (step.category) {
        case 'search':
          execution.performance.searchTime += duration;
          break;
        case 'analysis':
          execution.performance.analysisTime += duration;
          break;
        case 'documentation':
          execution.performance.documentationTime += duration;
          break;
        case 'communication':
          execution.performance.communicationTime += duration;
          break;
      }

      // Find next step
      const currentStepIndex = pattern.steps.findIndex(s => s.id === stepId);
      const nextStep = pattern.steps[currentStepIndex + 1];

      if (nextStep) {
        execution.currentStep = nextStep.id;
      } else {
        // Workflow complete
        execution.status = 'completed';
        execution.endTime = new Date();
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        
        // Calculate final performance scores
        this.calculatePerformanceScores(execution, pattern);
        
        // Move to completed executions
        this.completedExecutions.push(execution);
        this.activeExecutions.delete(executionId);
        
        // Update pattern success rate
        this.updatePatternSuccessRate(pattern.id, true);
      }

      logger.info('Workflow step completed', {
        executionId,
        stepId,
        duration,
        quality,
        nextStep: nextStep?.id
      });

    } catch (error) {
      logger.error('Error completing workflow step:', error);
      throw error;
    }
  }

  async skipWorkflowStep(executionId: string, stepId: string, reason: string): Promise<void> {
    try {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        throw new Error(`Workflow execution not found: ${executionId}`);
      }

      execution.skippedSteps.push(stepId);

      logger.info('Workflow step skipped', {
        executionId,
        stepId,
        reason
      });

    } catch (error) {
      logger.error('Error skipping workflow step:', error);
      throw error;
    }
  }

  private calculatePerformanceScores(execution: WorkflowExecution, pattern: WorkflowPattern): void {
    // Efficiency score based on time vs expected
    const expectedTime = pattern.expectedDuration;
    const actualTime = execution.performance.totalTime;
    execution.performance.efficiencyScore = Math.max(0, Math.min(1, expectedTime / actualTime));

    // Quality score would be based on solution effectiveness, customer satisfaction, etc.
    // For now, use a placeholder calculation
    const completionRate = execution.completedSteps.length / pattern.steps.filter(s => !s.isOptional).length;
    execution.performance.qualityScore = completionRate;
  }

  private updatePatternSuccessRate(patternId: string, success: boolean): void {
    const pattern = this.workflowPatterns.get(patternId);
    if (pattern) {
      // Simple weighted average with more weight on recent executions
      const weight = 0.1;
      pattern.successRate = success 
        ? pattern.successRate + (1 - pattern.successRate) * weight
        : pattern.successRate * (1 - weight);
    }
  }

  // Optimization
  async getOptimizationSuggestions(
    executionHistory: WorkflowExecution[],
    patternId?: string
  ): Promise<OptimizationSuggestion[]> {
    try {
      let suggestions = Array.from(this.optimizationSuggestions.values());

      // Filter by pattern if specified
      if (patternId) {
        suggestions = suggestions.filter(s => 
          s.applicablePatterns.includes(patternId) || 
          s.applicablePatterns.length === 0
        );
      }

      // Score suggestions based on execution history
      const scoredSuggestions = suggestions.map(suggestion => ({
        suggestion,
        score: this.calculateOptimizationScore(suggestion, executionHistory)
      }));

      // Sort by potential impact
      scoredSuggestions.sort((a, b) => b.score - a.score);

      logger.info('Optimization suggestions generated', {
        totalSuggestions: suggestions.length,
        patternId,
        historySize: executionHistory.length
      });

      return scoredSuggestions.map(s => s.suggestion);

    } catch (error) {
      logger.error('Error getting optimization suggestions:', error);
      throw error;
    }
  }

  private calculateOptimizationScore(
    suggestion: OptimizationSuggestion,
    history: WorkflowExecution[]
  ): number {
    let score = suggestion.confidenceLevel * 0.4;
    
    // Factor in potential time savings
    const avgExecutionTime = history.reduce((sum, exec) => sum + (exec.duration || 0), 0) / history.length;
    if (avgExecutionTime > 0) {
      const timeSavingsRatio = suggestion.estimatedTimeSavings / avgExecutionTime;
      score += Math.min(timeSavingsRatio, 0.5) * 0.6;
    }

    return score;
  }

  // Analytics
  async getWorkflowAnalytics(dateRange?: { start: Date; end: Date }): Promise<WorkflowAnalytics> {
    try {
      let executions = this.completedExecutions;

      // Filter by date range if provided
      if (dateRange) {
        executions = executions.filter(exec => 
          exec.startTime >= dateRange.start && exec.startTime <= dateRange.end
        );
      }

      const analytics: WorkflowAnalytics = {
        totalExecutions: executions.length,
        averageDuration: executions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / executions.length,
        successRate: executions.filter(exec => exec.status === 'completed').length / executions.length,
        mostUsedPatterns: this.getMostUsedPatterns(executions),
        performanceTrends: this.getPerformanceTrends(executions),
        bottlenecks: this.getBottlenecks(executions),
        optimizationImpact: this.getOptimizationImpact(executions)
      };

      logger.info('Workflow analytics generated', {
        totalExecutions: analytics.totalExecutions,
        dateRange: dateRange ? `${dateRange.start.toISOString()} to ${dateRange.end.toISOString()}` : 'all time'
      });

      return analytics;

    } catch (error) {
      logger.error('Error generating workflow analytics:', error);
      throw error;
    }
  }

  private getMostUsedPatterns(executions: WorkflowExecution[]): { patternId: string; count: number; name: string }[] {
    const patternCounts = new Map<string, number>();
    
    executions.forEach(exec => {
      patternCounts.set(exec.patternId, (patternCounts.get(exec.patternId) || 0) + 1);
    });

    return Array.from(patternCounts.entries())
      .map(([patternId, count]) => ({
        patternId,
        count,
        name: this.workflowPatterns.get(patternId)?.name || 'Unknown'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getPerformanceTrends(executions: WorkflowExecution[]): { date: string; avgEfficiency: number; avgQuality: number }[] {
    // Group by date and calculate averages
    const dateGroups = new Map<string, WorkflowExecution[]>();
    
    executions.forEach(exec => {
      const date = exec.startTime.toISOString().split('T')[0];
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push(exec);
    });

    return Array.from(dateGroups.entries())
      .map(([date, executions]) => ({
        date,
        avgEfficiency: executions.reduce((sum, exec) => sum + exec.performance.efficiencyScore, 0) / executions.length,
        avgQuality: executions.reduce((sum, exec) => sum + exec.performance.qualityScore, 0) / executions.length
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getBottlenecks(executions: WorkflowExecution[]): { stepId: string; averageTime: number; frequency: number }[] {
    // This is a simplified implementation
    // In reality, we'd need more detailed step timing data
    return [];
  }

  private getOptimizationImpact(executions: WorkflowExecution[]): { suggestionId: string; adoptionRate: number; timeSaved: number }[] {
    // This would track which optimizations have been implemented and their impact
    // For now, return empty array
    return [];
  }

  // Service Management
  async getServiceStatus(): Promise<{
    activeExecutions: number;
    completedExecutions: number;
    availablePatterns: number;
    optimizationSuggestions: number;
    isHealthy: boolean;
  }> {
    return {
      activeExecutions: this.activeExecutions.size,
      completedExecutions: this.completedExecutions.length,
      availablePatterns: this.workflowPatterns.size,
      optimizationSuggestions: this.optimizationSuggestions.size,
      isHealthy: true
    };
  }

  async cleanup(): Promise<void> {
    // Clean up old completed executions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.completedExecutions = this.completedExecutions.filter(
      exec => exec.startTime >= thirtyDaysAgo
    );

    // Clean up stale active executions
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    for (const [id, execution] of this.activeExecutions.entries()) {
      if (execution.startTime < oneDayAgo) {
        execution.status = 'failed';
        this.completedExecutions.push(execution);
        this.activeExecutions.delete(id);
      }
    }

    logger.info('Workflow optimizer cleanup completed');
  }
}