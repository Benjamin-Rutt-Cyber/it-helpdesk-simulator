import { ScenarioSchema, ValidationResult, ScenarioDefinition } from '../models/ScenarioSchema';
import { logger } from '../utils/logger';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class ScenarioValidator {
  
  /**
   * Validate a scenario object against the schema
   */
  validateScenario(scenarioData: any): ValidationResult {
    try {
      const result = ScenarioSchema.safeParse(scenarioData);
      
      if (result.success) {
        const warnings = this.performQualityChecks(result.data.scenario);
        return {
          isValid: true,
          errors: [],
          warnings,
        };
      } else {
        const errors = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        
        logger.warn('Scenario validation failed', {
          errors,
          scenarioId: scenarioData?.scenario?.id,
        });
        
        return {
          isValid: false,
          errors,
          warnings: [],
        };
      }
    } catch (error) {
      logger.error('Error during scenario validation', { error });
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
    }
  }
  
  /**
   * Validate a scenario file (JSON or YAML)
   */
  async validateScenarioFile(filePath: string): Promise<ValidationResult> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const fileExtension = path.extname(filePath).toLowerCase();
      
      let scenarioData: any;
      
      if (fileExtension === '.json') {
        scenarioData = JSON.parse(fileContent);
      } else if (fileExtension === '.yml' || fileExtension === '.yaml') {
        scenarioData = yaml.load(fileContent);
      } else {
        return {
          isValid: false,
          errors: [`Unsupported file format: ${fileExtension}. Only .json, .yml, and .yaml are supported.`],
          warnings: [],
          filePath,
        };
      }
      
      const result = this.validateScenario(scenarioData);
      result.filePath = filePath;
      
      return result;
    } catch (error) {
      logger.error('Error reading or parsing scenario file', { filePath, error });
      return {
        isValid: false,
        errors: [`File error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        filePath,
      };
    }
  }
  
  /**
   * Validate multiple scenario files
   */
  async validateScenarioFiles(filePaths: string[]): Promise<ValidationResult[]> {
    const results = await Promise.all(
      filePaths.map(filePath => this.validateScenarioFile(filePath))
    );
    
    logger.info('Bulk scenario validation completed', {
      totalFiles: filePaths.length,
      validFiles: results.filter(r => r.isValid).length,
      invalidFiles: results.filter(r => !r.isValid).length,
    });
    
    return results;
  }
  
  /**
   * Perform quality checks and return warnings
   */
  private performQualityChecks(scenario: ScenarioDefinition['scenario']): string[] {
    const warnings: string[] = [];
    
    // Check description length
    if (scenario.description.length < 50) {
      warnings.push('Scenario description is quite short - consider adding more detail');
    }
    
    // Check knowledge base entries
    if (scenario.knowledgeBaseEntries.length === 0) {
      warnings.push('No knowledge base entries provided - users may struggle to find relevant information');
    }
    
    // Check credibility scores
    const lowCredibilityEntries = scenario.knowledgeBaseEntries.filter(entry => entry.credibility < 0.3);
    if (lowCredibilityEntries.length > scenario.knowledgeBaseEntries.length * 0.5) {
      warnings.push('More than 50% of knowledge base entries have low credibility - consider improving content quality');
    }
    
    // Check technical context
    if (scenario.ticketTemplate.technicalContext.errorMessages.length === 0) {
      warnings.push('No error messages provided - this may make troubleshooting too difficult');
    }
    
    // Check assessment criteria balance
    const criteria = scenario.assessmentCriteria;
    const totalCriteria = Object.keys(criteria.technical).length + 
                         Object.keys(criteria.communication).length + 
                         Object.keys(criteria.procedure).length + 
                         Object.keys(criteria.timeManagement).length;
    
    if (totalCriteria < 8) {
      warnings.push('Limited assessment criteria - consider adding more evaluation dimensions');
    }
    
    // Check success criteria weights
    const totalWeight = scenario.successCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      warnings.push(`Success criteria weights sum to ${totalWeight.toFixed(2)} instead of 1.0`);
    }
    
    // Check difficulty vs complexity alignment
    const complexityIndicators = {
      errorMessages: scenario.ticketTemplate.technicalContext.errorMessages.length,
      knowledgeEntries: scenario.knowledgeBaseEntries.length,
      prerequisites: Array.isArray(scenario.prerequisites) ? scenario.prerequisites.length : 0,
      estimatedTime: scenario.estimatedTime,
    };
    
    if (scenario.difficulty === 'starter' && complexityIndicators.estimatedTime > 60) {
      warnings.push('Starter scenarios typically should take less than 60 minutes');
    }
    
    if (scenario.difficulty === 'advanced' && complexityIndicators.prerequisites.length === 0) {
      warnings.push('Advanced scenarios typically should have prerequisites');
    }
    
    return warnings;
  }
  
  /**
   * Calculate file checksum for version control
   */
  async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      const fileContent = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileContent).digest('hex');
    } catch (error) {
      logger.error('Error calculating file checksum', { filePath, error });
      throw error;
    }
  }
  
  /**
   * Validate scenario dependencies (prerequisites)
   */
  validateDependencies(scenarios: ScenarioDefinition['scenario'][]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const scenarioIds = new Set(scenarios.map(s => s.id));
    
    for (const scenario of scenarios) {
      // Check if all prerequisites exist
      for (const prerequisiteId of scenario.prerequisites) {
        if (!scenarioIds.has(prerequisiteId)) {
          errors.push(`Scenario "${scenario.title}" references non-existent prerequisite: ${prerequisiteId}`);
        }
      }
      
      // Check for circular dependencies
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      
      if (this.hasCyclicDependency(scenario.id, scenarios, visited, recursionStack)) {
        errors.push(`Circular dependency detected involving scenario: ${scenario.title}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  /**
   * Check for circular dependencies using DFS
   */
  private hasCyclicDependency(
    scenarioId: string,
    scenarios: ScenarioDefinition['scenario'][],
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(scenarioId);
    recursionStack.add(scenarioId);
    
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return false;
    
    for (const prerequisiteId of scenario.prerequisites) {
      if (!visited.has(prerequisiteId)) {
        if (this.hasCyclicDependency(prerequisiteId, scenarios, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(prerequisiteId)) {
        return true;
      }
    }
    
    recursionStack.delete(scenarioId);
    return false;
  }
}