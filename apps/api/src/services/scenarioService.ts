import { ScenarioRepository } from '../repositories/scenarioRepository';
import { SessionRepository } from '../repositories/sessionRepository';
import { UserRepository } from '../repositories/userRepository';
import { ScenarioLoader } from './scenarioLoader';
import { ScenarioValidator } from './scenarioValidator';
import { ScenarioVersioning } from './scenarioVersioning';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ScenarioDefinition } from '../models/ScenarioSchema';

export class ScenarioService {
  private scenarioRepository: ScenarioRepository;
  private sessionRepository: SessionRepository;
  private userRepository: UserRepository;
  private scenarioLoader: ScenarioLoader;
  private scenarioValidator: ScenarioValidator;
  private scenarioVersioning: ScenarioVersioning;

  constructor() {
    this.scenarioRepository = new ScenarioRepository();
    this.sessionRepository = new SessionRepository();
    this.userRepository = new UserRepository();
    this.scenarioLoader = new ScenarioLoader();
    this.scenarioValidator = new ScenarioValidator();
    this.scenarioVersioning = new ScenarioVersioning();
  }

  async getAllScenarios() {
    try {
      // Try loading from files first for the latest scenarios
      const { scenarios: fileScenarios, errors } = await this.scenarioLoader.loadAllScenarios();
      
      if (errors.length > 0) {
        logger.warn('Some scenario files had validation errors', { errors });
      }
      
      // Fall back to database scenarios if file loading fails completely
      if (fileScenarios.length === 0) {
        const dbScenarios = await this.scenarioRepository.findAll();
        return dbScenarios;
      }
      
      return fileScenarios;
    } catch (error) {
      logger.error('Error retrieving all scenarios', { error });
      // Fall back to database
      try {
        return await this.scenarioRepository.findAll();
      } catch (dbError) {
        logger.error('Database fallback also failed', { dbError });
        throw error;
      }
    }
  }

  async getScenarioById(id: string) {
    try {
      const scenario = await this.scenarioRepository.findById(id);
      return scenario;
    } catch (error) {
      logger.error('Error retrieving scenario by ID', { id, error });
      throw error;
    }
  }

  async getScenariosByDifficulty(difficulty: 'starter' | 'intermediate' | 'advanced') {
    try {
      // Try dynamic loading first
      const fileScenarios = await this.scenarioLoader.getScenariosByDifficulty(difficulty);
      
      if (fileScenarios.length > 0) {
        return fileScenarios;
      }
      
      // Fall back to database
      const scenarios = await this.scenarioRepository.findByDifficulty(difficulty);
      return scenarios;
    } catch (error) {
      logger.error('Error retrieving scenarios by difficulty', { difficulty, error });
      throw error;
    }
  }

  async startScenario(scenarioId: string, userId: string) {
    try {
      // Check if scenario exists
      const scenario = await this.scenarioRepository.findById(scenarioId);
      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${scenarioId} not found`);
      }

      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      // Check if user already has an active session for this scenario
      const activeSession = await this.sessionRepository.findActiveSessionByUserAndScenario(userId, scenarioId);
      if (activeSession) {
        throw new ValidationError('User already has an active session for this scenario');
      }

      // Create new session
      const session = await this.sessionRepository.create({
        userId,
        scenarioId,
      });

      logger.info('Scenario started', {
        scenarioId,
        sessionId: session.id,
        userId,
      });

      return session;
    } catch (error) {
      logger.error('Error starting scenario', { scenarioId, userId, error });
      throw error;
    }
  }

  async getUserScenarioProgress(userId: string) {
    try {
      // Get user's completed scenarios
      const completedSessions = await this.sessionRepository.findCompletedSessionsByUser(userId);
      const completedScenarios = completedSessions.length;

      // Get total number of scenarios
      const totalScenarios = await this.scenarioRepository.count();

      // Calculate progress statistics
      const progress = {
        userId,
        completedScenarios,
        totalScenarios,
        completionRate: totalScenarios > 0 ? (completedScenarios / totalScenarios) * 100 : 0,
        recentCompletions: completedSessions.slice(0, 5), // Last 5 completed
      };

      return progress;
    } catch (error) {
      logger.error('Error retrieving user scenario progress', { userId, error });
      throw error;
    }
  }

  // New methods for enhanced scenario management

  async validateScenarioFile(filePath: string) {
    try {
      const result = await this.scenarioValidator.validateScenarioFile(filePath);
      logger.info('Scenario file validation completed', { filePath, isValid: result.isValid });
      return result;
    } catch (error) {
      logger.error('Error validating scenario file', { filePath, error });
      throw error;
    }
  }

  async importScenarios(scenariosData: any[], targetDirectory?: string) {
    try {
      const result = await this.scenarioLoader.importScenarios(scenariosData, targetDirectory);
      logger.info('Scenario import completed', { 
        imported: result.imported, 
        errors: result.errors.length 
      });
      return result;
    } catch (error) {
      logger.error('Error importing scenarios', { error });
      throw error;
    }
  }

  async createScenarioVersion(scenario: ScenarioDefinition['scenario'], author: string, changeDescription: string) {
    try {
      const version = await this.scenarioVersioning.createVersion(scenario, author, changeDescription);
      logger.info('Created new scenario version', {
        scenarioId: scenario.id,
        version: version.version,
        author,
      });
      return version;
    } catch (error) {
      logger.error('Error creating scenario version', { scenarioId: scenario.id, error });
      throw error;
    }
  }

  async getScenarioVersionHistory(scenarioId: string) {
    try {
      const history = await this.scenarioVersioning.getVersionHistory(scenarioId);
      return history;
    } catch (error) {
      logger.error('Error retrieving scenario version history', { scenarioId, error });
      throw error;
    }
  }

  async rollbackScenario(scenarioId: string, targetVersion: string, author: string, reason: string) {
    try {
      const rollbackVersion = await this.scenarioVersioning.rollbackToVersion(
        scenarioId, 
        targetVersion, 
        author, 
        reason
      );
      logger.info('Scenario rollback completed', {
        scenarioId,
        targetVersion,
        newVersion: rollbackVersion.version,
      });
      return rollbackVersion;
    } catch (error) {
      logger.error('Error rolling back scenario', { scenarioId, targetVersion, error });
      throw error;
    }
  }

  async compareScenarioVersions(scenarioId: string, version1: string, version2: string) {
    try {
      const comparison = await this.scenarioVersioning.compareVersions(scenarioId, version1, version2);
      return comparison;
    } catch (error) {
      logger.error('Error comparing scenario versions', { scenarioId, version1, version2, error });
      throw error;
    }
  }

  async getScenarioStatistics(scenarioId: string) {
    try {
      const stats = await this.scenarioVersioning.getVersionStatistics(scenarioId);
      return stats;
    } catch (error) {
      logger.error('Error retrieving scenario statistics', { scenarioId, error });
      throw error;
    }
  }

  async enableHotReloading() {
    try {
      this.scenarioLoader.enableHotReloading((filePath) => {
        logger.info('Scenario file changed, invalidating cache', { filePath });
      });
      logger.info('Hot reloading enabled for scenarios');
    } catch (error) {
      logger.error('Error enabling hot reloading', { error });
      throw error;
    }
  }

  async disableHotReloading() {
    try {
      this.scenarioLoader.disableHotReloading();
      logger.info('Hot reloading disabled for scenarios');
    } catch (error) {
      logger.error('Error disabling hot reloading', { error });
      throw error;
    }
  }

  async cleanup() {
    try {
      await this.scenarioLoader.cleanup();
      logger.info('Scenario service cleanup completed');
    } catch (error) {
      logger.error('Error during scenario service cleanup', { error });
      throw error;
    }
  }
}