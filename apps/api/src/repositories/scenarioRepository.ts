import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  xpReward: number;
  ticketTemplate: any;
  customerPersona: any;
  knowledgeBaseEntries: any;
  assessmentCriteria: any;
  prerequisites: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioCreateData {
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  xpReward: number;
  ticketTemplate: any;
  customerPersona: any;
  knowledgeBaseEntries: any;
  assessmentCriteria: any;
  prerequisites: string[];
  isActive: boolean;
}

export class ScenarioRepository {
  async findAll(): Promise<Scenario[]> {
    const scenarios = await prisma.scenario.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    
    return scenarios.map(this.mapPrismaScenarioToScenario);
  }

  async findByDifficulty(difficulty: string): Promise<Scenario[]> {
    const scenarios = await prisma.scenario.findMany({
      where: { 
        difficulty,
        isActive: true 
      },
      orderBy: { createdAt: 'asc' },
    });
    
    return scenarios.map(this.mapPrismaScenarioToScenario);
  }

  async findById(id: string): Promise<Scenario | null> {
    const scenario = await prisma.scenario.findUnique({
      where: { id },
    });
    
    return scenario ? this.mapPrismaScenarioToScenario(scenario) : null;
  }

  async findByPrerequisites(completedScenarios: string[]): Promise<Scenario[]> {
    const scenarios = await prisma.scenario.findMany({
      where: {
        isActive: true,
      },
      orderBy: { difficulty: 'asc' },
    });
    
    // Filter scenarios with prerequisites check in JavaScript
    const filtered = scenarios.filter(scenario => {
      const prerequisites = JSON.parse(scenario.prerequisites || '[]');
      return prerequisites.length === 0 || prerequisites.some((prereq: string) => completedScenarios.includes(prereq));
    });
    
    return filtered.map(this.mapPrismaScenarioToScenario);
  }

  async create(scenarioData: ScenarioCreateData): Promise<Scenario> {
    const scenario = await prisma.scenario.create({
      data: {
        title: scenarioData.title,
        description: scenarioData.description,
        difficulty: scenarioData.difficulty,
        estimatedTime: scenarioData.estimatedTime,
        xpReward: scenarioData.xpReward,
        ticketTemplate: scenarioData.ticketTemplate,
        customerPersona: scenarioData.customerPersona,
        knowledgeBaseEntries: scenarioData.knowledgeBaseEntries,
        assessmentCriteria: scenarioData.assessmentCriteria,
        prerequisites: JSON.stringify(scenarioData.prerequisites),
        isActive: scenarioData.isActive,
      },
    });
    
    return this.mapPrismaScenarioToScenario(scenario);
  }

  async update(id: string, scenarioData: Partial<Scenario>): Promise<Scenario> {
    const scenario = await prisma.scenario.update({
      where: { id },
      data: {
        ...(scenarioData.title && { title: scenarioData.title }),
        ...(scenarioData.description && { description: scenarioData.description }),
        ...(scenarioData.difficulty && { difficulty: scenarioData.difficulty }),
        ...(scenarioData.estimatedTime && { estimatedTime: scenarioData.estimatedTime }),
        ...(scenarioData.xpReward && { xpReward: scenarioData.xpReward }),
        ...(scenarioData.ticketTemplate && { ticketTemplate: scenarioData.ticketTemplate }),
        ...(scenarioData.customerPersona && { customerPersona: scenarioData.customerPersona }),
        ...(scenarioData.knowledgeBaseEntries && { knowledgeBaseEntries: scenarioData.knowledgeBaseEntries }),
        ...(scenarioData.assessmentCriteria && { assessmentCriteria: scenarioData.assessmentCriteria }),
        ...(scenarioData.prerequisites && { prerequisites: scenarioData.prerequisites }),
        ...(scenarioData.isActive !== undefined && { isActive: scenarioData.isActive }),
      },
    });
    
    return this.mapPrismaScenarioToScenario(scenario);
  }

  async delete(id: string): Promise<void> {
    await prisma.scenario.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async count(): Promise<number> {
    return await prisma.scenario.count({
      where: { isActive: true },
    });
  }

  private mapPrismaScenarioToScenario(prismaScenario: any): Scenario {
    return {
      id: prismaScenario.id,
      title: prismaScenario.title,
      description: prismaScenario.description,
      difficulty: prismaScenario.difficulty,
      estimatedTime: prismaScenario.estimatedTime,
      xpReward: prismaScenario.xpReward,
      ticketTemplate: prismaScenario.ticketTemplate,
      customerPersona: prismaScenario.customerPersona,
      knowledgeBaseEntries: prismaScenario.knowledgeBaseEntries,
      assessmentCriteria: prismaScenario.assessmentCriteria,
      prerequisites: prismaScenario.prerequisites,
      isActive: prismaScenario.isActive,
      createdAt: prismaScenario.createdAt,
      updatedAt: prismaScenario.updatedAt,
    };
  }
}

export const scenarioRepository = new ScenarioRepository();