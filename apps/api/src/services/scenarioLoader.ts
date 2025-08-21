import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { ScenarioValidator } from './scenarioValidator';
import { ScenarioDefinition, ScenarioFile, ValidationResult } from '../models/ScenarioSchema';
import { logger } from '../utils/logger';
import { createClient } from 'redis';
import chokidar from 'chokidar';

export class ScenarioLoader {
  private validator: ScenarioValidator;
  private cache: Map<string, ScenarioFile> = new Map();
  private redisClient: ReturnType<typeof createClient> | null = null;
  private fileWatcher: chokidar.FSWatcher | null = null;
  private scenariosPath: string;
  
  constructor(scenariosPath: string = './scenarios') {
    this.validator = new ScenarioValidator();
    this.scenariosPath = path.resolve(scenariosPath);
    this.initializeRedis();
  }
  
  /**
   * Initialize Redis client for caching
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });
      
      await this.redisClient.connect();
      logger.info('Redis client connected for scenario caching');
    } catch (error) {
      logger.warn('Failed to connect to Redis, using memory cache only', { error });
      this.redisClient = null;
    }
  }
  
  /**
   * Load all scenarios from the scenarios directory
   */
  async loadAllScenarios(): Promise<{
    scenarios: ScenarioDefinition['scenario'][];
    errors: ValidationResult[];
  }> {
    try {
      const scenarioFiles = await this.discoverScenarioFiles();
      const loadResults = await Promise.all(
        scenarioFiles.map(filePath => this.loadScenarioFile(filePath))
      );
      
      const scenarios: ScenarioDefinition['scenario'][] = [];
      const errors: ValidationResult[] = [];
      
      for (const result of loadResults) {
        if (result.scenario) {
          scenarios.push(result.scenario);
        }
        if (!result.validation.isValid) {
          errors.push(result.validation);
        }
      }
      
      // Validate dependencies across all scenarios
      const dependencyValidation = this.validator.validateDependencies(scenarios);
      if (!dependencyValidation.isValid) {
        errors.push(dependencyValidation);
      }
      
      logger.info('Scenario loading completed', {
        totalFiles: scenarioFiles.length,
        validScenarios: scenarios.length,
        errors: errors.length,
      });
      
      // Cache scenarios in Redis
      await this.cacheScenarios(scenarios);
      
      return { scenarios, errors };
    } catch (error) {
      logger.error('Error loading scenarios', { error });
      throw error;
    }
  }
  
  /**
   * Load a single scenario file
   */
  async loadScenarioFile(filePath: string): Promise<{
    scenario: ScenarioDefinition['scenario'] | null;
    validation: ValidationResult;
  }> {
    try {
      // Check cache first
      const cacheKey = `scenario:${filePath}`;
      const cachedScenario = await this.getCachedScenario(cacheKey);
      
      if (cachedScenario) {
        const currentChecksum = await this.validator.calculateFileChecksum(filePath);
        if (currentChecksum === cachedScenario.checksum) {
          return {
            scenario: cachedScenario.scenario,
            validation: { isValid: true, errors: [], warnings: [] },
          };
        }
      }
      
      // Load and validate file
      const validation = await this.validator.validateScenarioFile(filePath);
      
      if (!validation.isValid) {
        return { scenario: null, validation };
      }
      
      // Parse scenario data
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const fileExtension = path.extname(filePath).toLowerCase();
      
      let scenarioData: any;
      if (fileExtension === '.json') {
        scenarioData = JSON.parse(fileContent);
      } else {
        scenarioData = yaml.load(fileContent);
      }
      
      const scenario = scenarioData.scenario;
      
      // Create scenario file record
      const scenarioFile: ScenarioFile = {
        filePath,
        fileName: path.basename(filePath),
        lastModified: new Date().toISOString(),
        checksum: await this.validator.calculateFileChecksum(filePath),
        format: fileExtension === '.json' ? 'json' : 'yaml',
        scenario,
      };
      
      // Cache the scenario
      this.cache.set(filePath, scenarioFile);
      await this.setCachedScenario(cacheKey, scenarioFile);
      
      return { scenario, validation };
    } catch (error) {
      logger.error('Error loading scenario file', { filePath, error });
      return {
        scenario: null,
        validation: {
          isValid: false,
          errors: [`Load error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          filePath,
        },
      };
    }
  }
  
  /**
   * Discover all scenario files in the scenarios directory
   */
  async discoverScenarioFiles(): Promise<string[]> {
    const scenarioFiles: string[] = [];
    
    try {
      await fs.access(this.scenariosPath);
    } catch (error) {
      logger.warn('Scenarios directory does not exist, creating it', { path: this.scenariosPath });
      await fs.mkdir(this.scenariosPath, { recursive: true });
      return [];
    }
    
    const discoverInDirectory = async (dirPath: string): Promise<void> => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await discoverInDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.json', '.yml', '.yaml'].includes(ext)) {
            scenarioFiles.push(fullPath);
          }
        }
      }
    };
    
    await discoverInDirectory(this.scenariosPath);
    
    logger.info('Discovered scenario files', {
      count: scenarioFiles.length,
      files: scenarioFiles.map(f => path.relative(this.scenariosPath, f)),
    });
    
    return scenarioFiles;
  }
  
  /**
   * Enable hot reloading for development
   */
  enableHotReloading(callback?: (filePath: string) => void): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
    
    this.fileWatcher = chokidar.watch(this.scenariosPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });
    
    this.fileWatcher
      .on('add', (filePath) => {
        logger.info('New scenario file detected', { filePath });
        this.invalidateCache(filePath);
        callback?.(filePath);
      })
      .on('change', (filePath) => {
        logger.info('Scenario file changed', { filePath });
        this.invalidateCache(filePath);
        callback?.(filePath);
      })
      .on('unlink', (filePath) => {
        logger.info('Scenario file removed', { filePath });
        this.invalidateCache(filePath);
        callback?.(filePath);
      });
    
    logger.info('Hot reloading enabled for scenarios', { path: this.scenariosPath });
  }
  
  /**
   * Disable hot reloading
   */
  disableHotReloading(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
      logger.info('Hot reloading disabled');
    }
  }
  
  /**
   * Get scenarios by difficulty with caching
   */
  async getScenariosByDifficulty(difficulty: 'starter' | 'intermediate' | 'advanced'): Promise<ScenarioDefinition['scenario'][]> {
    const cacheKey = `scenarios:difficulty:${difficulty}`;
    
    // Try cache first
    const cached = await this.getCachedScenarios(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Load all scenarios and filter
    const { scenarios } = await this.loadAllScenarios();
    const filtered = scenarios.filter(s => s.difficulty === difficulty);
    
    // Cache the result
    await this.setCachedScenarios(cacheKey, filtered, 300); // 5 minute TTL
    
    return filtered;
  }
  
  /**
   * Import scenarios from external source
   */
  async importScenarios(scenariosData: any[], targetDirectory?: string): Promise<{
    imported: number;
    errors: ValidationResult[];
  }> {
    const errors: ValidationResult[] = [];
    let imported = 0;
    const targetDir = targetDirectory || this.scenariosPath;
    
    for (const scenarioData of scenariosData) {
      try {
        const validation = this.validator.validateScenario({ scenario: scenarioData });
        
        if (!validation.isValid) {
          errors.push(validation);
          continue;
        }
        
        // Generate filename based on scenario title
        const filename = `${scenarioData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.yml`;
        const filePath = path.join(targetDir, scenarioData.difficulty, filename);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Write scenario file
        const yamlContent = yaml.dump({ scenario: scenarioData }, {
          indent: 2,
          lineWidth: 100,
          noRefs: true,
        });
        
        await fs.writeFile(filePath, yamlContent, 'utf-8');
        imported++;
        
        logger.info('Imported scenario', {
          title: scenarioData.title,
          difficulty: scenarioData.difficulty,
          filePath,
        });
      } catch (error) {
        errors.push({
          isValid: false,
          errors: [`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
        });
      }
    }
    
    // Reload scenarios after import
    await this.loadAllScenarios();
    
    return { imported, errors };
  }
  
  /**
   * Cache management methods
   */
  private async getCachedScenario(key: string): Promise<ScenarioFile | null> {
    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
      } catch (error) {
        logger.warn('Redis cache read error', { key, error });
      }
    }
    return null;
  }
  
  private async setCachedScenario(key: string, scenario: ScenarioFile, ttl: number = 3600): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttl, JSON.stringify(scenario));
      } catch (error) {
        logger.warn('Redis cache write error', { key, error });
      }
    }
  }
  
  private async getCachedScenarios(key: string): Promise<ScenarioDefinition['scenario'][] | null> {
    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
      } catch (error) {
        logger.warn('Redis cache read error', { key, error });
      }
    }
    return null;
  }
  
  private async setCachedScenarios(key: string, scenarios: ScenarioDefinition['scenario'][], ttl: number = 3600): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttl, JSON.stringify(scenarios));
      } catch (error) {
        logger.warn('Redis cache write error', { key, error });
      }
    }
  }
  
  private async cacheScenarios(scenarios: ScenarioDefinition['scenario'][]): Promise<void> {
    await this.setCachedScenarios('scenarios:all', scenarios);
    
    // Cache by difficulty
    const byDifficulty = scenarios.reduce((acc, scenario) => {
      if (!acc[scenario.difficulty]) acc[scenario.difficulty] = [];
      acc[scenario.difficulty].push(scenario);
      return acc;
    }, {} as Record<string, ScenarioDefinition['scenario'][]>);
    
    for (const [difficulty, difficultyScenarios] of Object.entries(byDifficulty)) {
      await this.setCachedScenarios(`scenarios:difficulty:${difficulty}`, difficultyScenarios);
    }
  }
  
  private invalidateCache(filePath: string): void {
    this.cache.delete(filePath);
    // Note: Redis cache invalidation would require more sophisticated key tracking
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.disableHotReloading();
    
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
    
    this.cache.clear();
  }
}