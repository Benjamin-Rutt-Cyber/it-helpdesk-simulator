import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { ScenarioDefinition } from '../models/ScenarioSchema';
import { logger } from '../utils/logger';
import semver from 'semver';

export interface ScenarioVersion {
  id: string;
  scenarioId: string;
  version: string;
  content: ScenarioDefinition['scenario'];
  timestamp: string;
  author: string;
  changeDescription: string;
  checksum: string;
}

export interface VersionHistory {
  scenarioId: string;
  versions: ScenarioVersion[];
  currentVersion: string;
}

export class ScenarioVersioning {
  private versionsPath: string;
  
  constructor(versionsPath: string = './scenario-versions') {
    this.versionsPath = path.resolve(versionsPath);
    this.ensureVersionsDirectory();
  }
  
  /**
   * Ensure versions directory exists
   */
  private async ensureVersionsDirectory(): Promise<void> {
    try {
      await fs.access(this.versionsPath);
    } catch (error) {
      await fs.mkdir(this.versionsPath, { recursive: true });
      logger.info('Created scenario versions directory', { path: this.versionsPath });
    }
  }
  
  /**
   * Create a new version of a scenario
   */
  async createVersion(
    scenario: ScenarioDefinition['scenario'],
    author: string,
    changeDescription: string
  ): Promise<ScenarioVersion> {
    await this.ensureVersionsDirectory();
    
    // Get current version history
    const history = await this.getVersionHistory(scenario.id);
    
    // Determine next version number
    const nextVersion = this.calculateNextVersion(
      history.currentVersion,
      changeDescription
    );
    
    // Create version object
    const version: ScenarioVersion = {
      id: `${scenario.id}-${nextVersion}`,
      scenarioId: scenario.id,
      version: nextVersion,
      content: {
        ...scenario,
        version: nextVersion,
        metadata: {
          ...scenario.metadata,
          updatedAt: new Date().toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
      author,
      changeDescription,
      checksum: await this.calculateContentChecksum(scenario),
    };
    
    // Save version to file
    await this.saveVersionFile(version);
    
    // Update version history
    history.versions.push(version);
    history.currentVersion = nextVersion;
    await this.saveVersionHistory(history);
    
    logger.info('Created new scenario version', {
      scenarioId: scenario.id,
      version: nextVersion,
      author,
      changeDescription,
    });
    
    return version;
  }
  
  /**
   * Get version history for a scenario
   */
  async getVersionHistory(scenarioId: string): Promise<VersionHistory> {
    const historyPath = path.join(this.versionsPath, `${scenarioId}-history.json`);
    
    try {
      const historyContent = await fs.readFile(historyPath, 'utf-8');
      return JSON.parse(historyContent);
    } catch (error) {
      // Return empty history if file doesn't exist
      return {
        scenarioId,
        versions: [],
        currentVersion: '1.0.0',
      };
    }
  }
  
  /**
   * Get a specific version of a scenario
   */
  async getVersion(scenarioId: string, version: string): Promise<ScenarioVersion | null> {
    const versionPath = path.join(this.versionsPath, `${scenarioId}-${version}.yml`);
    
    try {
      const versionContent = await fs.readFile(versionPath, 'utf-8');
      const versionData = yaml.load(versionContent) as any;
      return versionData.version;
    } catch (error) {
      logger.warn('Version file not found', { scenarioId, version, error });
      return null;
    }
  }
  
  /**
   * Rollback scenario to a previous version
   */
  async rollbackToVersion(
    scenarioId: string,
    targetVersion: string,
    author: string,
    reason: string
  ): Promise<ScenarioVersion> {
    const targetVersionData = await this.getVersion(scenarioId, targetVersion);
    
    if (!targetVersionData) {
      throw new Error(`Version ${targetVersion} not found for scenario ${scenarioId}`);
    }
    
    // Create a new version based on the target version
    const rollbackScenario = {
      ...targetVersionData.content,
      metadata: {
        ...targetVersionData.content.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    
    const rollbackVersion = await this.createVersion(
      rollbackScenario,
      author,
      `Rollback to version ${targetVersion}: ${reason}`
    );
    
    logger.info('Rolled back scenario to previous version', {
      scenarioId,
      targetVersion,
      newVersion: rollbackVersion.version,
      author,
      reason,
    });
    
    return rollbackVersion;
  }
  
  /**
   * Compare two versions of a scenario
   */
  async compareVersions(
    scenarioId: string,
    version1: string,
    version2: string
  ): Promise<{
    version1: ScenarioVersion;
    version2: ScenarioVersion;
    differences: VersionDifference[];
  }> {
    const v1 = await this.getVersion(scenarioId, version1);
    const v2 = await this.getVersion(scenarioId, version2);
    
    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }
    
    const differences = this.calculateDifferences(v1.content, v2.content);
    
    return {
      version1: v1,
      version2: v2,
      differences,
    };
  }
  
  /**
   * Get version statistics
   */
  async getVersionStatistics(scenarioId: string): Promise<{
    totalVersions: number;
    firstVersion: string;
    latestVersion: string;
    totalAuthors: number;
    versionFrequency: Record<string, number>;
  }> {
    const history = await this.getVersionHistory(scenarioId);
    
    if (history.versions.length === 0) {
      return {
        totalVersions: 0,
        firstVersion: '1.0.0',
        latestVersion: '1.0.0',
        totalAuthors: 0,
        versionFrequency: {},
      };
    }
    
    const authors = new Set(history.versions.map(v => v.author));
    const versionsByMonth = history.versions.reduce((acc, version) => {
      const month = version.timestamp.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalVersions: history.versions.length,
      firstVersion: history.versions[0]?.version || '1.0.0',
      latestVersion: history.currentVersion,
      totalAuthors: authors.size,
      versionFrequency: versionsByMonth,
    };
  }
  
  /**
   * Clean up old versions (keep only specified number of versions)
   */
  async cleanupOldVersions(scenarioId: string, keepVersions: number = 10): Promise<number> {
    const history = await this.getVersionHistory(scenarioId);
    
    if (history.versions.length <= keepVersions) {
      return 0; // Nothing to clean up
    }
    
    // Sort versions by timestamp and keep the latest ones
    const sortedVersions = history.versions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const versionsToKeep = sortedVersions.slice(0, keepVersions);
    const versionsToDelete = sortedVersions.slice(keepVersions);
    
    // Delete old version files
    for (const version of versionsToDelete) {
      const versionPath = path.join(this.versionsPath, `${scenarioId}-${version.version}.yml`);
      try {
        await fs.unlink(versionPath);
      } catch (error) {
        logger.warn('Failed to delete version file', { versionPath, error });
      }
    }
    
    // Update history
    history.versions = versionsToKeep;
    await this.saveVersionHistory(history);
    
    logger.info('Cleaned up old scenario versions', {
      scenarioId,
      deletedVersions: versionsToDelete.length,
      keptVersions: versionsToKeep.length,
    });
    
    return versionsToDelete.length;
  }
  
  /**
   * Calculate next version number based on change type
   */
  private calculateNextVersion(currentVersion: string, changeDescription: string): string {
    if (!semver.valid(currentVersion)) {
      return '1.0.0';
    }
    
    const description = changeDescription.toLowerCase();
    
    // Determine version increment type based on change description
    if (description.includes('breaking') || description.includes('major')) {
      return semver.inc(currentVersion, 'major') || '1.0.0';
    } else if (description.includes('feature') || description.includes('minor')) {
      return semver.inc(currentVersion, 'minor') || '1.0.0';
    } else {
      return semver.inc(currentVersion, 'patch') || '1.0.0';
    }
  }
  
  /**
   * Calculate content checksum for change detection
   */
  private async calculateContentChecksum(scenario: ScenarioDefinition['scenario']): Promise<string> {
    const crypto = await import('crypto');
    const content = JSON.stringify(scenario, Object.keys(scenario).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Save version file
   */
  private async saveVersionFile(version: ScenarioVersion): Promise<void> {
    const versionPath = path.join(this.versionsPath, `${version.scenarioId}-${version.version}.yml`);
    const yamlContent = yaml.dump({ version }, {
      indent: 2,
      lineWidth: 100,
      noRefs: true,
    });
    
    await fs.writeFile(versionPath, yamlContent, 'utf-8');
  }
  
  /**
   * Save version history
   */
  private async saveVersionHistory(history: VersionHistory): Promise<void> {
    const historyPath = path.join(this.versionsPath, `${history.scenarioId}-history.json`);
    const historyContent = JSON.stringify(history, null, 2);
    
    await fs.writeFile(historyPath, historyContent, 'utf-8');
  }
  
  /**
   * Calculate differences between two scenario versions
   */
  private calculateDifferences(
    content1: ScenarioDefinition['scenario'],
    content2: ScenarioDefinition['scenario']
  ): VersionDifference[] {
    const differences: VersionDifference[] = [];
    
    // Compare basic properties
    const basicFields = ['title', 'description', 'difficulty', 'estimatedTime', 'xpReward'];
    for (const field of basicFields) {
      if (content1[field as keyof typeof content1] !== content2[field as keyof typeof content2]) {
        differences.push({
          type: 'modified',
          path: field,
          oldValue: content1[field as keyof typeof content1],
          newValue: content2[field as keyof typeof content2],
        });
      }
    }
    
    // Compare arrays (prerequisites, tags)
    if (JSON.stringify(content1.prerequisites) !== JSON.stringify(content2.prerequisites)) {
      differences.push({
        type: 'modified',
        path: 'prerequisites',
        oldValue: content1.prerequisites,
        newValue: content2.prerequisites,
      });
    }
    
    if (JSON.stringify(content1.tags) !== JSON.stringify(content2.tags)) {
      differences.push({
        type: 'modified',
        path: 'tags',
        oldValue: content1.tags,
        newValue: content2.tags,
      });
    }
    
    // Compare complex objects (would need deeper comparison for production)
    const complexFields = ['ticketTemplate', 'customerPersona', 'assessmentCriteria'];
    for (const field of complexFields) {
      const field1 = JSON.stringify(content1[field as keyof typeof content1]);
      const field2 = JSON.stringify(content2[field as keyof typeof content2]);
      if (field1 !== field2) {
        differences.push({
          type: 'modified',
          path: field,
          oldValue: `[Complex object - ${field1.length} chars]`,
          newValue: `[Complex object - ${field2.length} chars]`,
        });
      }
    }
    
    return differences;
  }
}

export interface VersionDifference {
  type: 'added' | 'removed' | 'modified';
  path: string;
  oldValue?: any;
  newValue?: any;
}