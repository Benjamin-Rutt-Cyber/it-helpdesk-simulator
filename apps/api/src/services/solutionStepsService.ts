import { logger } from '../utils/logger';

export interface SolutionStep {
  id: string;
  stepNumber: number;
  description: string;
  action: string;
  expectedResult: string;
  actualResult?: string;
  verified: boolean;
  timestamp: Date;
  duration?: number; // in seconds
  createdBy: string;
  ticketId: string;
}

export interface StepSequence {
  id: string;
  ticketId: string;
  steps: SolutionStep[];
  totalDuration: number;
  verifiedStepsCount: number;
  completionRate: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface StepValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number;
}

export interface StepAnalytics {
  ticketId: string;
  totalSteps: number;
  verifiedSteps: number;
  averageStepDuration: number;
  totalExecutionTime: number;
  efficiencyScore: number;
  qualityScore: number;
  commonPatterns: string[];
  improvementSuggestions: string[];
}

export class SolutionStepsService {
  private static instance: SolutionStepsService;
  private stepSequences: Map<string, StepSequence> = new Map();

  public static getInstance(): SolutionStepsService {
    if (!SolutionStepsService.instance) {
      SolutionStepsService.instance = new SolutionStepsService();
    }
    return SolutionStepsService.instance;
  }

  async createStepSequence(ticketId: string, userId: string): Promise<string> {
    try {
      const sequenceId = `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const stepSequence: StepSequence = {
        id: sequenceId,
        ticketId,
        steps: [],
        totalDuration: 0,
        verifiedStepsCount: 0,
        completionRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId
      };

      this.stepSequences.set(sequenceId, stepSequence);

      logger.info('Created step sequence', {
        sequenceId,
        ticketId,
        userId
      });

      return sequenceId;
    } catch (error) {
      logger.error('Failed to create step sequence', { error, ticketId, userId });
      throw error;
    }
  }

  async addStep(sequenceId: string, stepData: Omit<SolutionStep, 'id' | 'timestamp' | 'stepNumber'>): Promise<string> {
    try {
      const sequence = this.stepSequences.get(sequenceId);
      if (!sequence) {
        throw new Error(`Step sequence not found: ${sequenceId}`);
      }

      const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stepNumber = sequence.steps.length + 1;

      const newStep: SolutionStep = {
        ...stepData,
        id: stepId,
        stepNumber,
        timestamp: new Date()
      };

      sequence.steps.push(newStep);
      sequence.updatedAt = new Date();
      await this.updateSequenceMetrics(sequenceId);

      logger.info('Added step to sequence', {
        sequenceId,
        stepId,
        stepNumber,
        ticketId: sequence.ticketId
      });

      return stepId;
    } catch (error) {
      logger.error('Failed to add step', { error, sequenceId });
      throw error;
    }
  }

  async updateStep(sequenceId: string, stepId: string, updates: Partial<SolutionStep>): Promise<void> {
    try {
      const sequence = this.stepSequences.get(sequenceId);
      if (!sequence) {
        throw new Error(`Step sequence not found: ${sequenceId}`);
      }

      const stepIndex = sequence.steps.findIndex(step => step.id === stepId);
      if (stepIndex === -1) {
        throw new Error(`Step not found: ${stepId}`);
      }

      sequence.steps[stepIndex] = {
        ...sequence.steps[stepIndex],
        ...updates
      };

      sequence.updatedAt = new Date();
      await this.updateSequenceMetrics(sequenceId);

      logger.info('Updated step', {
        sequenceId,
        stepId,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      logger.error('Failed to update step', { error, sequenceId, stepId });
      throw error;
    }
  }

  async removeStep(sequenceId: string, stepId: string): Promise<void> {
    try {
      const sequence = this.stepSequences.get(sequenceId);
      if (!sequence) {
        throw new Error(`Step sequence not found: ${sequenceId}`);
      }

      const stepIndex = sequence.steps.findIndex(step => step.id === stepId);
      if (stepIndex === -1) {
        throw new Error(`Step not found: ${stepId}`);
      }

      sequence.steps.splice(stepIndex, 1);

      // Renumber remaining steps
      sequence.steps.forEach((step, index) => {
        step.stepNumber = index + 1;
      });

      sequence.updatedAt = new Date();
      await this.updateSequenceMetrics(sequenceId);

      logger.info('Removed step from sequence', {
        sequenceId,
        stepId,
        remainingSteps: sequence.steps.length
      });
    } catch (error) {
      logger.error('Failed to remove step', { error, sequenceId, stepId });
      throw error;
    }
  }

  async reorderSteps(sequenceId: string, stepIds: string[]): Promise<void> {
    try {
      const sequence = this.stepSequences.get(sequenceId);
      if (!sequence) {
        throw new Error(`Step sequence not found: ${sequenceId}`);
      }

      const reorderedSteps: SolutionStep[] = [];
      
      stepIds.forEach((stepId, index) => {
        const step = sequence.steps.find(s => s.id === stepId);
        if (step) {
          reorderedSteps.push({
            ...step,
            stepNumber: index + 1
          });
        }
      });

      if (reorderedSteps.length !== sequence.steps.length) {
        throw new Error('Invalid step reordering - missing steps');
      }

      sequence.steps = reorderedSteps;
      sequence.updatedAt = new Date();

      logger.info('Reordered steps', {
        sequenceId,
        newOrder: stepIds
      });
    } catch (error) {
      logger.error('Failed to reorder steps', { error, sequenceId });
      throw error;
    }
  }

  async verifyStep(sequenceId: string, stepId: string, verified: boolean, actualResult?: string): Promise<void> {
    try {
      const updates: Partial<SolutionStep> = { verified };
      if (actualResult) {
        updates.actualResult = actualResult;
      }

      await this.updateStep(sequenceId, stepId, updates);

      logger.info('Verified step', {
        sequenceId,
        stepId,
        verified,
        hasActualResult: !!actualResult
      });
    } catch (error) {
      logger.error('Failed to verify step', { error, sequenceId, stepId });
      throw error;
    }
  }

  async startStepTimer(sequenceId: string, stepId: string): Promise<void> {
    try {
      // In a real implementation, this would track the start time
      // For now, we'll just log the event
      logger.info('Started step timer', {
        sequenceId,
        stepId,
        startTime: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to start step timer', { error, sequenceId, stepId });
      throw error;
    }
  }

  async stopStepTimer(sequenceId: string, stepId: string, duration: number): Promise<void> {
    try {
      await this.updateStep(sequenceId, stepId, { duration });

      logger.info('Stopped step timer', {
        sequenceId,
        stepId,
        duration,
        formattedDuration: this.formatDuration(duration)
      });
    } catch (error) {
      logger.error('Failed to stop step timer', { error, sequenceId, stepId });
      throw error;
    }
  }

  async getStepSequence(sequenceId: string): Promise<StepSequence | null> {
    try {
      const sequence = this.stepSequences.get(sequenceId);
      return sequence || null;
    } catch (error) {
      logger.error('Failed to get step sequence', { error, sequenceId });
      throw error;
    }
  }

  async getStepSequenceByTicket(ticketId: string): Promise<StepSequence | null> {
    try {
      for (const sequence of this.stepSequences.values()) {
        if (sequence.ticketId === ticketId) {
          return sequence;
        }
      }
      return null;
    } catch (error) {
      logger.error('Failed to get step sequence by ticket', { error, ticketId });
      throw error;
    }
  }

  async validateStepSequence(sequenceId: string): Promise<StepValidation> {
    try {
      const sequence = this.stepSequences.get(sequenceId);
      if (!sequence) {
        throw new Error(`Step sequence not found: ${sequenceId}`);
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (sequence.steps.length === 0) {
        errors.push('At least one solution step is required');
      }

      // Step-by-step validation
      sequence.steps.forEach((step, index) => {
        if (!step.description.trim()) {
          errors.push(`Step ${index + 1}: Description is required`);
        }
        if (!step.action.trim()) {
          errors.push(`Step ${index + 1}: Action is required`);
        }
        if (!step.expectedResult.trim()) {
          warnings.push(`Step ${index + 1}: Expected result not specified`);
        }
        if (!step.verified) {
          warnings.push(`Step ${index + 1}: Not yet verified`);
        }
        if (!step.duration) {
          warnings.push(`Step ${index + 1}: Duration not tracked`);
        }
      });

      // Sequence validation
      const stepNumbers = sequence.steps.map(s => s.stepNumber).sort((a, b) => a - b);
      for (let i = 0; i < stepNumbers.length; i++) {
        if (stepNumbers[i] !== i + 1) {
          errors.push('Step numbering is not sequential');
          break;
        }
      }

      // Quality checks
      const verifiedSteps = sequence.steps.filter(s => s.verified).length;
      const completeness = sequence.steps.length > 0 ? (verifiedSteps / sequence.steps.length) * 100 : 0;

      if (completeness < 50) {
        warnings.push('Less than 50% of steps are verified');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        completeness
      };
    } catch (error) {
      logger.error('Failed to validate step sequence', { error, sequenceId });
      throw error;
    }
  }

  async getStepAnalytics(sequenceId: string): Promise<StepAnalytics> {
    try {
      const sequence = this.stepSequences.get(sequenceId);
      if (!sequence) {
        throw new Error(`Step sequence not found: ${sequenceId}`);
      }

      const totalSteps = sequence.steps.length;
      const verifiedSteps = sequence.steps.filter(s => s.verified).length;
      const stepsWithDuration = sequence.steps.filter(s => s.duration && s.duration > 0);
      const totalExecutionTime = sequence.steps.reduce((sum, step) => sum + (step.duration || 0), 0);
      
      const averageStepDuration = stepsWithDuration.length > 0 
        ? totalExecutionTime / stepsWithDuration.length 
        : 0;

      // Calculate efficiency score (0-100)
      const completionRate = totalSteps > 0 ? (verifiedSteps / totalSteps) * 100 : 0;
      const timeEfficiency = this.calculateTimeEfficiency(sequence.steps);
      const efficiencyScore = (completionRate * 0.6) + (timeEfficiency * 0.4);

      // Calculate quality score (0-100)
      const qualityScore = this.calculateQualityScore(sequence.steps);

      // Identify common patterns
      const commonPatterns = this.identifyCommonPatterns(sequence.steps);

      // Generate improvement suggestions
      const improvementSuggestions = this.generateImprovementSuggestions(sequence.steps);

      return {
        ticketId: sequence.ticketId,
        totalSteps,
        verifiedSteps,
        averageStepDuration,
        totalExecutionTime,
        efficiencyScore,
        qualityScore,
        commonPatterns,
        improvementSuggestions
      };
    } catch (error) {
      logger.error('Failed to get step analytics', { error, sequenceId });
      throw error;
    }
  }

  private async updateSequenceMetrics(sequenceId: string): Promise<void> {
    const sequence = this.stepSequences.get(sequenceId);
    if (!sequence) return;

    const verifiedStepsCount = sequence.steps.filter(s => s.verified).length;
    const totalDuration = sequence.steps.reduce((sum, step) => sum + (step.duration || 0), 0);
    const completionRate = sequence.steps.length > 0 ? (verifiedStepsCount / sequence.steps.length) * 100 : 0;

    sequence.verifiedStepsCount = verifiedStepsCount;
    sequence.totalDuration = totalDuration;
    sequence.completionRate = completionRate;
  }

  private calculateTimeEfficiency(steps: SolutionStep[]): number {
    // Simple efficiency calculation based on average step duration
    // In a real system, this would compare against benchmarks
    const stepsWithDuration = steps.filter(s => s.duration && s.duration > 0);
    if (stepsWithDuration.length === 0) return 50; // Neutral score if no timing data

    const averageDuration = stepsWithDuration.reduce((sum, step) => sum + (step.duration || 0), 0) / stepsWithDuration.length;
    
    // Assume 5 minutes (300 seconds) per step is baseline efficient
    const baselineEfficient = 300;
    if (averageDuration <= baselineEfficient) return 100;
    if (averageDuration <= baselineEfficient * 2) return 75;
    if (averageDuration <= baselineEfficient * 3) return 50;
    return 25;
  }

  private calculateQualityScore(steps: SolutionStep[]): number {
    if (steps.length === 0) return 0;

    let score = 0;
    let maxScore = 0;

    steps.forEach(step => {
      maxScore += 100;

      // Description quality (25 points)
      if (step.description.trim()) {
        score += 25;
        if (step.description.length >= 20) score += 10; // Detailed description
      }

      // Action quality (25 points)
      if (step.action.trim()) {
        score += 25;
        if (step.action.length >= 20) score += 10; // Detailed action
      }

      // Expected result (20 points)
      if (step.expectedResult.trim()) {
        score += 20;
      }

      // Actual result (20 points)
      if (step.actualResult && step.actualResult.trim()) {
        score += 20;
      }

      // Verification (10 points)
      if (step.verified) {
        score += 10;
      }
    });

    return Math.round((score / maxScore) * 100);
  }

  private identifyCommonPatterns(steps: SolutionStep[]): string[] {
    const patterns: string[] = [];

    // Check for systematic approach
    if (steps.some(s => s.description.toLowerCase().includes('diagnos'))) {
      patterns.push('Diagnostic approach');
    }

    // Check for testing verification
    if (steps.some(s => s.description.toLowerCase().includes('test'))) {
      patterns.push('Testing validation');
    }

    // Check for customer communication
    if (steps.some(s => s.description.toLowerCase().includes('customer') || s.description.toLowerCase().includes('user'))) {
      patterns.push('Customer communication');
    }

    // Check for documentation
    if (steps.some(s => s.description.toLowerCase().includes('document') || s.description.toLowerCase().includes('record'))) {
      patterns.push('Documentation practice');
    }

    return patterns;
  }

  private generateImprovementSuggestions(steps: SolutionStep[]): string[] {
    const suggestions: string[] = [];

    const unverifiedSteps = steps.filter(s => !s.verified);
    if (unverifiedSteps.length > 0) {
      suggestions.push(`Verify ${unverifiedSteps.length} remaining step(s) to complete the documentation`);
    }

    const stepsWithoutResults = steps.filter(s => !s.actualResult || !s.actualResult.trim());
    if (stepsWithoutResults.length > 0) {
      suggestions.push('Add actual results to better document what happened during execution');
    }

    const stepsWithoutDuration = steps.filter(s => !s.duration);
    if (stepsWithoutDuration.length > 0) {
      suggestions.push('Track step duration to improve time management and efficiency analysis');
    }

    const briefDescriptions = steps.filter(s => s.description.length < 20);
    if (briefDescriptions.length > 0) {
      suggestions.push('Add more detailed descriptions to improve learning value and knowledge sharing');
    }

    if (steps.length < 3) {
      suggestions.push('Consider breaking down complex actions into more detailed steps for better documentation');
    }

    return suggestions;
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  async exportStepSequence(sequenceId: string, format: 'json' | 'csv' | 'markdown'): Promise<string> {
    try {
      const sequence = this.stepSequences.get(sequenceId);
      if (!sequence) {
        throw new Error(`Step sequence not found: ${sequenceId}`);
      }

      switch (format) {
        case 'json':
          return JSON.stringify(sequence, null, 2);
        case 'csv':
          return this.exportToCSV(sequence);
        case 'markdown':
          return this.exportToMarkdown(sequence);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Failed to export step sequence', { error, sequenceId, format });
      throw error;
    }
  }

  private exportToCSV(sequence: StepSequence): string {
    const headers = ['Step Number', 'Description', 'Action', 'Expected Result', 'Actual Result', 'Verified', 'Duration (seconds)', 'Timestamp'];
    const rows = sequence.steps.map(step => [
      step.stepNumber,
      `"${step.description.replace(/"/g, '""')}"`,
      `"${step.action.replace(/"/g, '""')}"`,
      `"${step.expectedResult.replace(/"/g, '""')}"`,
      `"${(step.actualResult || '').replace(/"/g, '""')}"`,
      step.verified,
      step.duration || 0,
      step.timestamp.toISOString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private exportToMarkdown(sequence: StepSequence): string {
    return `# Solution Steps for Ticket ${sequence.ticketId}

## Overview
- **Total Steps:** ${sequence.steps.length}
- **Verified Steps:** ${sequence.verifiedStepsCount}
- **Total Duration:** ${this.formatDuration(sequence.totalDuration)}
- **Completion Rate:** ${sequence.completionRate.toFixed(1)}%

## Step Details

${sequence.steps.map(step => `
### Step ${step.stepNumber}${step.verified ? ' ✓' : ''}

**Description:** ${step.description}

**Action:** ${step.action}

**Expected Result:** ${step.expectedResult}

${step.actualResult ? `**Actual Result:** ${step.actualResult}` : ''}

**Duration:** ${step.duration ? this.formatDuration(step.duration) : 'Not tracked'}

**Timestamp:** ${step.timestamp.toISOString()}

---
`).join('')}

*Generated on ${new Date().toISOString()}*`;
  }
}