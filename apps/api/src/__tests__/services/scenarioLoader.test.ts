import { ScenarioLoader } from '../../services/scenarioLoader';
import { ScenarioValidator } from '../../services/scenarioValidator';
import fs from 'fs/promises';
import path from 'path';
import { beforeEach, afterEach, describe, test, expect, jest } from '@jest/globals';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
  })),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('ScenarioLoader', () => {
  let scenarioLoader: ScenarioLoader;
  const testScenariosPath = './test-scenarios';

  beforeEach(() => {
    scenarioLoader = new ScenarioLoader(testScenariosPath);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await scenarioLoader.cleanup();
  });

  describe('discoverScenarioFiles', () => {
    test('should discover YAML and JSON scenario files', async () => {
      // Mock directory structure
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir
        .mockResolvedValueOnce([
          { name: 'starter', isDirectory: () => true, isFile: () => false } as any,
          { name: 'intermediate', isDirectory: () => true, isFile: () => false } as any,
        ])
        .mockResolvedValueOnce([
          { name: 'scenario1.yml', isDirectory: () => false, isFile: () => true } as any,
          { name: 'scenario2.json', isDirectory: () => false, isFile: () => true } as any,
          { name: 'readme.txt', isDirectory: () => false, isFile: () => true } as any,
        ])
        .mockResolvedValueOnce([
          { name: 'scenario3.yaml', isDirectory: () => false, isFile: () => true } as any,
        ]);

      const files = await scenarioLoader.discoverScenarioFiles();

      expect(files).toHaveLength(3);
      expect(files).toContain(path.join(testScenariosPath, 'starter', 'scenario1.yml'));
      expect(files).toContain(path.join(testScenariosPath, 'starter', 'scenario2.json'));
      expect(files).toContain(path.join(testScenariosPath, 'intermediate', 'scenario3.yaml'));
      expect(files).not.toContain(path.join(testScenariosPath, 'starter', 'readme.txt'));
    });

    test('should create scenarios directory if it does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('Directory does not exist'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      const files = await scenarioLoader.discoverScenarioFiles();

      expect(mockFs.mkdir).toHaveBeenCalledWith(testScenariosPath, { recursive: true });
      expect(files).toHaveLength(0);
    });
  });

  describe('loadScenarioFile', () => {
    test('should load and validate a YAML scenario file', async () => {
      const mockScenarioContent = `
scenario:
  id: "test-scenario-id"
  title: "Test Scenario"
  description: "A test scenario for unit testing"
  version: "1.0.0"
  difficulty: "starter"
  estimatedTime: 30
  xpReward: 50
  prerequisites: []
  tags: ["test"]
  ticketTemplate:
    priority: "medium"
    category: "Test"
    title: "Test Ticket"
    description: "Test ticket description"
    customerInfo:
      name: "Test User"
      department: "Test Dept"
      role: "Tester"
      contactInfo:
        email: "test@example.com"
      assetTag: "TEST-001"
    technicalContext:
      systemSpecs:
        os: "Test OS"
        hardware: "Test Hardware"
        software: []
      errorMessages: []
      environment: {}
      symptoms: []
  customerPersona:
    name: "Test Persona"
    personalityTraits:
      patience: 5
      technicalKnowledge: 5
      communicationStyle: "professional"
      helpfulness: 5
    technicalLevel: "novice"
    communicationStyle:
      responseLength: "detailed"
      formality: "professional"
      emotionalState: "calm"
    behaviorPatterns:
      followsInstructions: true
      providesDetails: true
      asksClarifyingQuestions: false
      becomesImpatient: false
  knowledgeBaseEntries:
    - title: "Test KB Entry"
      content: "Test knowledge base content"
      credibility: 0.9
      relevance: 0.8
      category: "Test"
      tags: ["test"]
  assessmentCriteria:
    technical:
      diagnosticAccuracy: 80
      solutionEffectiveness: 85
      troubleshootingMethodology: 75
    communication:
      clarity: 85
      empathy: 80
      professionalism: 90
    procedure:
      followsProtocol: 95
      documentation: 85
      timeManagement: 75
    timeManagement:
      responseTime: 80
      resolutionTime: 85
      efficiency: 75
  successCriteria:
    - description: "Test success criterion"
      weight: 1.0
      validation: "manual"
      condition: "Test condition"
  metadata:
    author: "Test Author"
    createdAt: "2025-01-15T10:00:00Z"
    updatedAt: "2025-01-15T10:00:00Z"
    reviewStatus: "approved"
      `;

      mockFs.readFile.mockResolvedValue(mockScenarioContent);

      const result = await scenarioLoader.loadScenarioFile('./test-scenario.yml');

      expect(result.scenario).toBeDefined();
      expect(result.scenario?.id).toBe('test-scenario-id');
      expect(result.scenario?.title).toBe('Test Scenario');
      expect(result.validation.isValid).toBe(true);
    });

    test('should handle invalid scenario file', async () => {
      const invalidContent = `
scenario:
  id: "invalid-scenario"
  title: ""
  # Missing required fields
      `;

      mockFs.readFile.mockResolvedValue(invalidContent);

      const result = await scenarioLoader.loadScenarioFile('./invalid-scenario.yml');

      expect(result.scenario).toBeNull();
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });

    test('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await scenarioLoader.loadScenarioFile('./nonexistent.yml');

      expect(result.scenario).toBeNull();
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toContain('Load error: File not found');
    });
  });

  describe('loadAllScenarios', () => {
    test('should load multiple scenario files', async () => {
      const mockScenario1 = createMockScenarioContent('scenario-1', 'Scenario 1');
      const mockScenario2 = createMockScenarioContent('scenario-2', 'Scenario 2');

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        { name: 'scenario1.yml', isDirectory: () => false, isFile: () => true } as any,
        { name: 'scenario2.yml', isDirectory: () => false, isFile: () => true } as any,
      ]);

      mockFs.readFile
        .mockResolvedValueOnce(mockScenario1)
        .mockResolvedValueOnce(mockScenario2);

      const result = await scenarioLoader.loadAllScenarios();

      expect(result.scenarios).toHaveLength(2);
      expect(result.scenarios[0].id).toBe('scenario-1');
      expect(result.scenarios[1].id).toBe('scenario-2');
      expect(result.errors).toHaveLength(0);
    });

    test('should handle mixed valid and invalid scenarios', async () => {
      const validScenario = createMockScenarioContent('valid-scenario', 'Valid Scenario');
      const invalidScenario = 'invalid yaml content [';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        { name: 'valid.yml', isDirectory: () => false, isFile: () => true } as any,
        { name: 'invalid.yml', isDirectory: () => false, isFile: () => true } as any,
      ]);

      mockFs.readFile
        .mockResolvedValueOnce(validScenario)
        .mockResolvedValueOnce(invalidScenario);

      const result = await scenarioLoader.loadAllScenarios();

      expect(result.scenarios).toHaveLength(1);
      expect(result.scenarios[0].id).toBe('valid-scenario');
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getScenariosByDifficulty', () => {
    test('should filter scenarios by difficulty', async () => {
      const starterScenario = createMockScenarioContent('starter-1', 'Starter Scenario', 'starter');
      const intermediateScenario = createMockScenarioContent('intermediate-1', 'Intermediate Scenario', 'intermediate');

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        { name: 'starter.yml', isDirectory: () => false, isFile: () => true } as any,
        { name: 'intermediate.yml', isDirectory: () => false, isFile: () => true } as any,
      ]);

      mockFs.readFile
        .mockResolvedValueOnce(starterScenario)
        .mockResolvedValueOnce(intermediateScenario);

      const starterScenarios = await scenarioLoader.getScenariosByDifficulty('starter');

      expect(starterScenarios).toHaveLength(1);
      expect(starterScenarios[0].difficulty).toBe('starter');
    });
  });

  describe('importScenarios', () => {
    test('should import scenarios and create files', async () => {
      const mockScenarioData = {
        id: 'import-test',
        title: 'Imported Scenario',
        description: 'A scenario imported via API',
        version: '1.0.0',
        difficulty: 'starter',
        estimatedTime: 30,
        xpReward: 50,
        prerequisites: [],
        tags: ['imported'],
        // Include other required fields for validation
        ticketTemplate: createMockTicketTemplate(),
        customerPersona: createMockCustomerPersona(),
        knowledgeBaseEntries: [createMockKnowledgeBaseEntry()],
        assessmentCriteria: createMockAssessmentCriteria(),
        successCriteria: [createMockSuccessCriterion()],
        metadata: createMockMetadata(),
      };

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      const result = await scenarioLoader.importScenarios([mockScenarioData]);

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should handle import validation errors', async () => {
      const invalidScenarioData = {
        id: 'invalid',
        title: '', // Invalid empty title
        // Missing required fields
      };

      const result = await scenarioLoader.importScenarios([invalidScenarioData]);

      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

// Helper functions for creating mock data
function createMockScenarioContent(id: string, title: string, difficulty: string = 'starter'): string {
  return `
scenario:
  id: "${id}"
  title: "${title}"
  description: "Mock scenario description for testing"
  version: "1.0.0"
  difficulty: "${difficulty}"
  estimatedTime: 30
  xpReward: 50
  prerequisites: []
  tags: ["test"]
  ticketTemplate:
    priority: "medium"
    category: "Test"
    title: "Mock Ticket"
    description: "Mock ticket description"
    customerInfo:
      name: "Mock User"
      department: "Test Dept"
      role: "Tester"
      contactInfo:
        email: "mock@example.com"
      assetTag: "MOCK-001"
    technicalContext:
      systemSpecs:
        os: "Mock OS"
        hardware: "Mock Hardware"
        software: []
      errorMessages: []
      environment: {}
      symptoms: []
  customerPersona:
    name: "Mock Persona"
    personalityTraits:
      patience: 5
      technicalKnowledge: 5
      communicationStyle: "professional"
      helpfulness: 5
    technicalLevel: "novice"
    communicationStyle:
      responseLength: "detailed"
      formality: "professional"
      emotionalState: "calm"
    behaviorPatterns:
      followsInstructions: true
      providesDetails: true
      asksClarifyingQuestions: false
      becomesImpatient: false
  knowledgeBaseEntries:
    - title: "Mock KB Entry"
      content: "Mock knowledge base content"
      credibility: 0.9
      relevance: 0.8
      category: "Test"
      tags: ["test"]
  assessmentCriteria:
    technical:
      diagnosticAccuracy: 80
      solutionEffectiveness: 85
      troubleshootingMethodology: 75
    communication:
      clarity: 85
      empathy: 80
      professionalism: 90
    procedure:
      followsProtocol: 95
      documentation: 85
      timeManagement: 75
    timeManagement:
      responseTime: 80
      resolutionTime: 85
      efficiency: 75
  successCriteria:
    - description: "Mock success criterion"
      weight: 1.0
      validation: "manual"
      condition: "Mock condition"
  metadata:
    author: "Mock Author"
    createdAt: "2025-01-15T10:00:00Z"
    updatedAt: "2025-01-15T10:00:00Z"
    reviewStatus: "approved"
  `;
}

function createMockTicketTemplate() {
  return {
    priority: 'medium' as const,
    category: 'Test',
    title: 'Mock Ticket',
    description: 'Mock ticket description',
    customerInfo: {
      name: 'Mock User',
      department: 'Test Dept',
      role: 'Tester',
      contactInfo: {
        email: 'mock@example.com',
      },
      assetTag: 'MOCK-001',
    },
    technicalContext: {
      systemSpecs: {
        os: 'Mock OS',
        hardware: 'Mock Hardware',
        software: [],
      },
      errorMessages: [],
      environment: {},
      symptoms: [],
    },
  };
}

function createMockCustomerPersona() {
  return {
    name: 'Mock Persona',
    personalityTraits: {
      patience: 5,
      technicalKnowledge: 5,
      communicationStyle: 'professional' as const,
      helpfulness: 5,
    },
    technicalLevel: 'novice' as const,
    communicationStyle: {
      responseLength: 'detailed' as const,
      formality: 'professional' as const,
      emotionalState: 'calm' as const,
    },
    behaviorPatterns: {
      followsInstructions: true,
      providesDetails: true,
      asksClarifyingQuestions: false,
      becomesImpatient: false,
    },
  };
}

function createMockKnowledgeBaseEntry() {
  return {
    title: 'Mock KB Entry',
    content: 'Mock knowledge base content',
    credibility: 0.9,
    relevance: 0.8,
    category: 'Test',
    tags: ['test'],
  };
}

function createMockAssessmentCriteria() {
  return {
    technical: {
      diagnosticAccuracy: 80,
      solutionEffectiveness: 85,
      troubleshootingMethodology: 75,
    },
    communication: {
      clarity: 85,
      empathy: 80,
      professionalism: 90,
    },
    procedure: {
      followsProtocol: 95,
      documentation: 85,
      timeManagement: 75,
    },
    timeManagement: {
      responseTime: 80,
      resolutionTime: 85,
      efficiency: 75,
    },
  };
}

function createMockSuccessCriterion() {
  return {
    description: 'Mock success criterion',
    weight: 1.0,
    validation: 'manual' as const,
    condition: 'Mock condition',
  };
}

function createMockMetadata() {
  return {
    author: 'Mock Author',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    reviewStatus: 'approved' as const,
  };
}