import { ScenarioRepository } from '../repositories/scenarioRepository';
import { SessionRepository } from '../repositories/sessionRepository';
import { UserRepository } from '../repositories/userRepository';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface TicketContext {
  ticketId: string;
  scenarioId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: string;
  expectedResolution: string;
  contextTimeline: {
    issueStarted: Date;
    firstReported: Date;
    escalationHistory: Array<{
      timestamp: Date;
      fromLevel: string;
      toLevel: string;
      reason: string;
    }>;
    previousAttempts: Array<{
      timestamp: Date;
      action: string;
      result: string;
      technician: string;
    }>;
  };
  estimatedTime: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
}

export interface CustomerContext {
  customerId: string;
  name: string;
  department: string;
  role: string;
  technicalSkillLevel: 'novice' | 'intermediate' | 'advanced';
  communicationStyle: {
    formality: 'casual' | 'professional' | 'very_formal';
    responseLength: 'brief' | 'detailed' | 'verbose';
    emotionalState: 'calm' | 'stressed' | 'frustrated' | 'urgent';
    helpfulness: number; // 1-10 scale
    patience: number; // 1-10 scale
  };
  contactInfo: {
    email: string;
    phone?: string;
    location: string;
    timezone: string;
    preferredContactMethod: 'email' | 'phone' | 'chat' | 'in_person';
  };
  workSchedule: {
    availability: string;
    timeConstraints: string[];
    urgentDeadlines: string[];
  };
  relationshipHistory: {
    previousInteractions: number;
    satisfactionRating: number; // 1-5 scale
    escalationHistory: number;
    resolutionSuccess: number; // percentage
    commonIssues: string[];
  };
  departmentContext: {
    businessFunction: string;
    criticalSystems: string[];
    operationalImpact: string;
    departmentSize: number;
  };
}

export interface TechnicalEnvironment {
  systemSpecs: {
    operatingSystem: {
      name: string;
      version: string;
      architecture: string;
      buildNumber?: string;
      lastUpdate?: Date;
    };
    hardware: {
      manufacturer: string;
      model: string;
      processor: string;
      memory: string;
      storage: string;
      graphics?: string;
      age: number; // years
    };
    network: {
      connectionType: 'wired' | 'wireless' | 'hybrid';
      networkName: string;
      domain: string;
      ipAddress: string;
      dnsServers: string[];
      proxySettings?: string;
    };
  };
  softwareEnvironment: {
    installedApplications: Array<{
      name: string;
      version: string;
      vendor: string;
      installDate: Date;
      licenseType: string;
      critical: boolean;
    }>;
    recentChanges: Array<{
      timestamp: Date;
      changeType: 'install' | 'update' | 'uninstall' | 'configuration';
      component: string;
      details: string;
      performedBy: string;
    }>;
    securitySoftware: {
      antivirus: { name: string; version: string; lastScan: Date; };
      firewall: { enabled: boolean; profile: string; };
      encryption: { enabled: boolean; type: string; };
    };
  };
  infraContext: {
    serverDependencies: string[];
    sharedResources: string[];
    criticalServices: string[];
    maintenanceWindows: Array<{
      service: string;
      nextWindow: Date;
      impact: string;
    }>;
    knownLimitations: string[];
  };
  troubleshootingConstraints: {
    remoteAccess: boolean;
    adminRights: boolean;
    downTimeAllowed: boolean;
    backupRequired: boolean;
    changeApprovalNeeded: boolean;
    testingLimitations: string[];
  };
}

export interface IssueHistory {
  relatedTickets: Array<{
    ticketId: string;
    title: string;
    status: string;
    resolution: string;
    resolutionTime: number; // minutes
    similarity: number; // 0-1 scale
    dateCreated: Date;
    dateResolved?: Date;
  }>;
  knownIssues: Array<{
    issueId: string;
    title: string;
    description: string;
    workaround?: string;
    permanentFix?: string;
    affectedSystems: string[];
    frequency: 'rare' | 'occasional' | 'frequent' | 'ongoing';
    lastOccurrence: Date;
  }>;
  patternAnalysis: {
    recurringPatterns: string[];
    seasonalTrends: string[];
    timeBasedPatterns: string[];
    userBehaviorPatterns: string[];
  };
  escalationHistory: Array<{
    ticketId: string;
    escalationReason: string;
    escalationLevel: string;
    outcome: string;
    lessonsLearned: string[];
  }>;
}

export interface ResourceLibrary {
  scenarioResources: Array<{
    id: string;
    title: string;
    type: 'documentation' | 'procedure' | 'troubleshooting' | 'reference' | 'tool';
    url?: string;
    content?: string;
    relevance: number; // 0-1 scale
    complexity: 'basic' | 'intermediate' | 'advanced';
    estimatedReadTime: number; // minutes
    lastUpdated: Date;
  }>;
  quickReferences: Array<{
    title: string;
    summary: string;
    keyPoints: string[];
    commonCommands?: string[];
    shortcuts?: string[];
  }>;
  troubleshootingFlows: Array<{
    id: string;
    title: string;
    description: string;
    steps: Array<{
      stepNumber: number;
      instruction: string;
      expectedResult: string;
      troubleshooting?: string[];
      nextSteps: string[];
    }>;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTime: number;
  }>;
  toolAccess: Array<{
    toolName: string;
    purpose: string;
    accessMethod: string;
    authRequired: boolean;
    availability: 'always' | 'business_hours' | 'on_request';
    documentation: string;
  }>;
}

export interface LearningObjectives {
  primaryObjectives: Array<{
    id: string;
    title: string;
    description: string;
    weight: number; // 0-1 scale
    measurable: boolean;
    timeframe: string;
    successCriteria: string[];
  }>;
  secondaryObjectives: Array<{
    id: string;
    title: string;
    description: string;
    weight: number;
    optional: boolean;
  }>;
  skillAssessment: {
    technicalSkills: Array<{
      skill: string;
      currentLevel: 'novice' | 'intermediate' | 'advanced';
      targetLevel: 'novice' | 'intermediate' | 'advanced';
      assessmentMethod: string;
    }>;
    softSkills: Array<{
      skill: string;
      importance: 'low' | 'medium' | 'high';
      assessmentCriteria: string[];
    }>;
  };
  performanceTargets: {
    timeTarget: number; // minutes
    accuracyTarget: number; // percentage
    communicationTarget: string;
    procedureComplianceTarget: number; // percentage
  };
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    triggerCondition: string;
    reward?: string;
    feedback: string;
  }>;
}

export interface ComprehensiveContext {
  ticket: TicketContext;
  customer: CustomerContext;
  technical: TechnicalEnvironment;
  history: IssueHistory;
  resources: ResourceLibrary;
  objectives: LearningObjectives;
  sessionInfo: {
    sessionId: string;
    startTime: Date;
    estimatedDuration: number;
    difficulty: 'starter' | 'intermediate' | 'advanced';
    scenarioVersion: string;
  };
}

export class ContextService {
  private scenarioRepository: ScenarioRepository;
  private sessionRepository: SessionRepository;
  private userRepository: UserRepository;

  constructor() {
    this.scenarioRepository = new ScenarioRepository();
    this.sessionRepository = new SessionRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Get comprehensive context for a scenario session
   */
  async getSessionContext(sessionId: string, userId: string): Promise<ComprehensiveContext> {
    try {
      // Get session information
      const session = await this.sessionRepository.findById(sessionId);
      if (!session) {
        throw new NotFoundError(`Session with ID ${sessionId} not found`);
      }

      if (session.userId !== userId) {
        throw new ValidationError('User not authorized to access this session');
      }

      // Get scenario information
      const scenario = await this.scenarioRepository.findById(session.scenarioId);
      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${session.scenarioId} not found`);
      }

      // Build comprehensive context
      const context: ComprehensiveContext = {
        ticket: this.buildTicketContext(scenario, session),
        customer: this.buildCustomerContext(scenario),
        technical: this.buildTechnicalEnvironment(scenario),
        history: this.buildIssueHistory(scenario),
        resources: this.buildResourceLibrary(scenario),
        objectives: this.buildLearningObjectives(scenario),
        sessionInfo: {
          sessionId: session.id,
          startTime: session.startTime,
          estimatedDuration: scenario.estimatedTime,
          difficulty: scenario.difficulty,
          scenarioVersion: scenario.version || '1.0.0',
        },
      };

      logger.info('Generated comprehensive context for session', {
        sessionId,
        userId,
        scenarioId: scenario.id,
        contextSize: this.calculateContextSize(context),
      });

      return context;
    } catch (error) {
      logger.error('Error generating session context', { sessionId, userId, error });
      throw error;
    }
  }

  /**
   * Get ticket context by scenario ID (for preview)
   */
  async getTicketContext(scenarioId: string): Promise<TicketContext> {
    try {
      const scenario = await this.scenarioRepository.findById(scenarioId);
      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${scenarioId} not found`);
      }

      return this.buildTicketContext(scenario, null);
    } catch (error) {
      logger.error('Error getting ticket context', { scenarioId, error });
      throw error;
    }
  }

  /**
   * Get customer context by scenario ID
   */
  async getCustomerContext(scenarioId: string): Promise<CustomerContext> {
    try {
      const scenario = await this.scenarioRepository.findById(scenarioId);
      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${scenarioId} not found`);
      }

      return this.buildCustomerContext(scenario);
    } catch (error) {
      logger.error('Error getting customer context', { scenarioId, error });
      throw error;
    }
  }

  /**
   * Get technical environment context
   */
  async getTechnicalEnvironment(scenarioId: string): Promise<TechnicalEnvironment> {
    try {
      const scenario = await this.scenarioRepository.findById(scenarioId);
      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${scenarioId} not found`);
      }

      return this.buildTechnicalEnvironment(scenario);
    } catch (error) {
      logger.error('Error getting technical environment', { scenarioId, error });
      throw error;
    }
  }

  /**
   * Get learning objectives for scenario
   */
  async getLearningObjectives(scenarioId: string): Promise<LearningObjectives> {
    try {
      const scenario = await this.scenarioRepository.findById(scenarioId);
      if (!scenario) {
        throw new NotFoundError(`Scenario with ID ${scenarioId} not found`);
      }

      return this.buildLearningObjectives(scenario);
    } catch (error) {
      logger.error('Error getting learning objectives', { scenarioId, error });
      throw error;
    }
  }

  /**
   * Build ticket context from scenario data
   */
  private buildTicketContext(scenario: any, session: any): TicketContext {
    const ticketTemplate = scenario.ticketTemplate || {};
    const now = new Date();
    const issueStarted = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000)); // Within last 24 hours

    return {
      ticketId: session ? `TKT-${session.id.slice(-8).toUpperCase()}` : `TKT-${scenario.id.slice(-8).toUpperCase()}`,
      scenarioId: scenario.id,
      title: ticketTemplate.title || scenario.title,
      description: ticketTemplate.description || scenario.description,
      priority: ticketTemplate.priority || 'medium',
      category: ticketTemplate.category || 'General',
      urgencyLevel: this.mapPriorityToUrgency(ticketTemplate.priority),
      businessImpact: this.generateBusinessImpact(ticketTemplate),
      expectedResolution: this.generateExpectedResolution(scenario),
      contextTimeline: {
        issueStarted,
        firstReported: new Date(issueStarted.getTime() + (Math.random() * 4 * 60 * 60 * 1000)), // 0-4 hours later
        escalationHistory: [],
        previousAttempts: this.generatePreviousAttempts(scenario.difficulty),
      },
      estimatedTime: scenario.estimatedTime,
      complexity: this.mapDifficultyToComplexity(scenario.difficulty),
    };
  }

  /**
   * Build customer context from scenario data
   */
  private buildCustomerContext(scenario: any): CustomerContext {
    const customerInfo = scenario.ticketTemplate?.customerInfo || {};
    const customerPersona = scenario.customerPersona || {};

    return {
      customerId: `CUST-${customerInfo.name?.replace(/\s+/g, '').slice(0, 8).toUpperCase() || 'USER001'}`,
      name: customerInfo.name || 'John Doe',
      department: customerInfo.department || 'General',
      role: customerInfo.role || 'User',
      technicalSkillLevel: customerPersona.technicalLevel || 'intermediate',
      communicationStyle: {
        formality: customerPersona.communicationStyle?.formality || 'professional',
        responseLength: customerPersona.communicationStyle?.responseLength || 'detailed',
        emotionalState: customerPersona.communicationStyle?.emotionalState || 'calm',
        helpfulness: customerPersona.personalityTraits?.helpfulness || 7,
        patience: customerPersona.personalityTraits?.patience || 6,
      },
      contactInfo: {
        email: customerInfo.contactInfo?.email || 'user@company.com',
        phone: customerInfo.contactInfo?.phone,
        location: customerInfo.contactInfo?.location || 'Office Building',
        timezone: 'UTC-5',
        preferredContactMethod: 'chat',
      },
      workSchedule: {
        availability: 'Business hours (9 AM - 5 PM)',
        timeConstraints: ['Has meetings 2-3 PM'],
        urgentDeadlines: ['Project deadline Friday'],
      },
      relationshipHistory: {
        previousInteractions: Math.floor(Math.random() * 10),
        satisfactionRating: 3.5 + Math.random() * 1.5, // 3.5-5.0
        escalationHistory: Math.floor(Math.random() * 3),
        resolutionSuccess: 75 + Math.random() * 20, // 75-95%
        commonIssues: this.generateCommonIssues(customerInfo.department),
      },
      departmentContext: this.generateDepartmentContext(customerInfo.department || 'General'),
    };
  }

  /**
   * Build technical environment from scenario data
   */
  private buildTechnicalEnvironment(scenario: any): TechnicalEnvironment {
    const technicalContext = scenario.ticketTemplate?.technicalContext || {};
    const systemSpecs = technicalContext.systemSpecs || {};

    return {
      systemSpecs: {
        operatingSystem: {
          name: systemSpecs.os || 'Windows 11',
          version: '22H2',
          architecture: 'x64',
          buildNumber: '22621.1555',
          lastUpdate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
        hardware: {
          manufacturer: 'Dell',
          model: 'OptiPlex 7090',
          processor: 'Intel Core i7-11700',
          memory: '16 GB DDR4',
          storage: '512 GB SSD',
          graphics: 'Intel UHD Graphics 750',
          age: 1 + Math.random() * 3, // 1-4 years
        },
        network: {
          connectionType: 'wired',
          networkName: 'CORP-NETWORK',
          domain: 'COMPANY.LOCAL',
          ipAddress: `192.168.1.${100 + Math.floor(Math.random() * 100)}`,
          dnsServers: ['192.168.1.10', '192.168.1.11'],
          proxySettings: 'proxy.company.com:8080',
        },
      },
      softwareEnvironment: {
        installedApplications: this.generateInstalledApplications(technicalContext.software || []),
        recentChanges: this.generateRecentChanges(),
        securitySoftware: {
          antivirus: {
            name: 'Windows Defender',
            version: '1.395.1482.0',
            lastScan: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last week
          },
          firewall: { enabled: true, profile: 'Domain' },
          encryption: { enabled: true, type: 'BitLocker' },
        },
      },
      infraContext: {
        serverDependencies: ['DC01.company.local', 'FS01.company.local', 'MAIL01.company.local'],
        sharedResources: ['\\\\fileserver\\shared', '\\\\fileserver\\department'],
        criticalServices: ['Active Directory', 'Exchange', 'SQL Server'],
        maintenanceWindows: [
          {
            service: 'Exchange Server',
            nextWindow: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
            impact: 'Email may be temporarily unavailable',
          },
        ],
        knownLimitations: ['No admin rights on local machine', 'Software installation requires approval'],
      },
      troubleshootingConstraints: {
        remoteAccess: true,
        adminRights: false,
        downTimeAllowed: false,
        backupRequired: true,
        changeApprovalNeeded: true,
        testingLimitations: ['Cannot restart production services', 'No access to server console'],
      },
    };
  }

  /**
   * Build issue history context
   */
  private buildIssueHistory(scenario: any): IssueHistory {
    return {
      relatedTickets: this.generateRelatedTickets(scenario),
      knownIssues: this.generateKnownIssues(scenario),
      patternAnalysis: {
        recurringPatterns: ['Tends to occur after Windows updates', 'More frequent on Mondays'],
        seasonalTrends: ['Increased frequency during Q4'],
        timeBasedPatterns: ['Most common between 9-11 AM'],
        userBehaviorPatterns: ['Often follows software installation attempts'],
      },
      escalationHistory: [],
    };
  }

  /**
   * Build resource library
   */
  private buildResourceLibrary(scenario: any): ResourceLibrary {
    return {
      scenarioResources: this.generateScenarioResources(scenario),
      quickReferences: this.generateQuickReferences(scenario),
      troubleshootingFlows: this.generateTroubleshootingFlows(scenario),
      toolAccess: this.generateToolAccess(),
    };
  }

  /**
   * Build learning objectives
   */
  private buildLearningObjectives(scenario: any): LearningObjectives {
    const successCriteria = scenario.successCriteria || [];
    const assessmentCriteria = scenario.assessmentCriteria || {};

    return {
      primaryObjectives: successCriteria.slice(0, 3).map((criterion: any, index: number) => ({
        id: `obj-${index + 1}`,
        title: criterion.description || `Objective ${index + 1}`,
        description: criterion.description || 'Complete the assigned task',
        weight: criterion.weight || 0.33,
        measurable: true,
        timeframe: 'End of scenario',
        successCriteria: [criterion.condition || 'Task completed successfully'],
      })),
      secondaryObjectives: successCriteria.slice(3).map((criterion: any, index: number) => ({
        id: `sec-obj-${index + 1}`,
        title: criterion.description || `Secondary Objective ${index + 1}`,
        description: criterion.description || 'Additional learning goal',
        weight: criterion.weight || 0.1,
        optional: true,
      })),
      skillAssessment: {
        technicalSkills: this.generateTechnicalSkills(assessmentCriteria.technical),
        softSkills: this.generateSoftSkills(assessmentCriteria.communication),
      },
      performanceTargets: {
        timeTarget: scenario.estimatedTime || 30,
        accuracyTarget: 80,
        communicationTarget: 'Professional and empathetic',
        procedureComplianceTarget: 90,
      },
      milestones: this.generateMilestones(scenario),
    };
  }

  // Helper methods for generating various context components
  private mapPriorityToUrgency(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (priority) {
      case 'high': return 'critical';
      case 'medium': return 'high';
      case 'low': return 'medium';
      default: return 'medium';
    }
  }

  private mapDifficultyToComplexity(difficulty: string): 'simple' | 'moderate' | 'complex' | 'expert' {
    switch (difficulty) {
      case 'starter': return 'simple';
      case 'intermediate': return 'moderate';
      case 'advanced': return 'complex';
      default: return 'moderate';
    }
  }

  private generateBusinessImpact(ticketTemplate: any): string {
    const category = ticketTemplate.category || 'General';
    const priority = ticketTemplate.priority || 'medium';

    const impacts = {
      high: ['Critical business function affected', 'Multiple users unable to work', 'Revenue impact potential'],
      medium: ['Department productivity reduced', 'Workaround available but inefficient', 'Customer service delays'],
      low: ['Individual user affected', 'Minimal business impact', 'Quality of life improvement'],
    };

    const impactList = impacts[priority as keyof typeof impacts] || impacts.medium;
    return impactList[Math.floor(Math.random() * impactList.length)];
  }

  private generateExpectedResolution(scenario: any): string {
    const resolutions = [
      'Restore full functionality',
      'Implement permanent solution',
      'Provide stable workaround',
      'Complete user training',
      'Escalate to specialist team',
    ];
    return resolutions[Math.floor(Math.random() * resolutions.length)];
  }

  private generatePreviousAttempts(difficulty: string): Array<{ timestamp: Date; action: string; result: string; technician: string; }> {
    if (difficulty === 'starter') return [];

    const attempts = [
      { action: 'Basic restart procedure', result: 'Temporary improvement', technician: 'Level 1 Support' },
      { action: 'Updated drivers', result: 'No change observed', technician: 'Level 1 Support' },
      { action: 'Reset user profile', result: 'Issue persists', technician: 'Level 2 Support' },
    ];

    const numAttempts = difficulty === 'advanced' ? 2 + Math.floor(Math.random() * 2) : 1;
    return attempts.slice(0, numAttempts).map(attempt => ({
      ...attempt,
      timestamp: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000), // Last 48 hours
    }));
  }

  private generateCommonIssues(department: string): string[] {
    const issuesByDept = {
      IT: ['Network configuration', 'Server maintenance', 'Software deployment'],
      Finance: ['Excel performance', 'Database access', 'Printer issues'],
      HR: ['Email problems', 'Document access', 'Video conferencing'],
      Marketing: ['File sharing', 'Design software', 'Presentation tools'],
      Sales: ['CRM access', 'Mobile device sync', 'VPN connectivity'],
    };

    return issuesByDept[department as keyof typeof issuesByDept] || ['General computer issues', 'Software problems', 'Network connectivity'];
  }

  private generateDepartmentContext(department: string): any {
    const contexts = {
      IT: {
        businessFunction: 'Technology infrastructure and support',
        criticalSystems: ['Active Directory', 'Network Infrastructure', 'Security Systems'],
        operationalImpact: 'High - affects all other departments',
        departmentSize: 5 + Math.floor(Math.random() * 15),
      },
      Finance: {
        businessFunction: 'Financial management and reporting',
        criticalSystems: ['ERP System', 'Banking Software', 'Reporting Tools'],
        operationalImpact: 'High - affects financial operations',
        departmentSize: 8 + Math.floor(Math.random() * 12),
      },
      HR: {
        businessFunction: 'Human resources and employee management',
        criticalSystems: ['HRIS', 'Payroll System', 'Benefits Portal'],
        operationalImpact: 'Medium - affects employee services',
        departmentSize: 3 + Math.floor(Math.random() * 8),
      },
    };

    return contexts[department as keyof typeof contexts] || {
      businessFunction: 'General business operations',
      criticalSystems: ['Email', 'File Sharing', 'Internet Access'],
      operationalImpact: 'Medium - affects productivity',
      departmentSize: 5 + Math.floor(Math.random() * 10),
    };
  }

  private generateInstalledApplications(software: string[]): any[] {
    const baseApps = [
      { name: 'Microsoft Office 365', version: '16.0.15928.20216', vendor: 'Microsoft', critical: true },
      { name: 'Google Chrome', version: '114.0.5735.110', vendor: 'Google', critical: false },
      { name: 'Adobe Acrobat Reader', version: '23.003.20201', vendor: 'Adobe', critical: false },
    ];

    return [...baseApps, ...software.map(app => ({
      name: app,
      version: '1.0.0',
      vendor: 'Unknown',
      installDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      licenseType: 'Commercial',
      critical: false,
    }))];
  }

  private generateRecentChanges(): any[] {
    const changes = [
      {
        changeType: 'update' as const,
        component: 'Windows Security Update',
        details: 'KB5028166 installed',
        performedBy: 'System',
      },
      {
        changeType: 'install' as const,
        component: 'Microsoft Teams',
        details: 'New installation for collaboration',
        performedBy: 'IT Admin',
      },
    ];

    return changes.map(change => ({
      ...change,
      timestamp: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Last 2 weeks
    }));
  }

  private generateRelatedTickets(scenario: any): any[] {
    // This would query for actual related tickets in a real implementation
    return [];
  }

  private generateKnownIssues(scenario: any): any[] {
    // This would query for known issues related to the scenario
    return [];
  }

  private generateScenarioResources(scenario: any): any[] {
    const knowledgeBase = scenario.knowledgeBaseEntries || [];
    return knowledgeBase.map((entry: any, index: number) => ({
      id: `res-${index + 1}`,
      title: entry.title,
      type: 'documentation' as const,
      content: entry.content,
      relevance: entry.relevance || 0.8,
      complexity: 'intermediate' as const,
      estimatedReadTime: Math.ceil(entry.content?.length / 200) || 5, // ~200 words per minute
      lastUpdated: new Date(),
    }));
  }

  private generateQuickReferences(scenario: any): any[] {
    return [
      {
        title: 'Common Commands',
        summary: 'Frequently used troubleshooting commands',
        keyPoints: ['Check system status', 'Restart services', 'Clear cache'],
        commonCommands: ['ipconfig /all', 'ping google.com', 'sfc /scannow'],
      },
    ];
  }

  private generateTroubleshootingFlows(scenario: any): any[] {
    return [
      {
        id: 'flow-1',
        title: 'Basic Troubleshooting Flow',
        description: 'Standard first-level troubleshooting steps',
        steps: [
          {
            stepNumber: 1,
            instruction: 'Gather initial information from user',
            expectedResult: 'Clear understanding of the problem',
            nextSteps: ['Proceed to step 2'],
          },
          {
            stepNumber: 2,
            instruction: 'Reproduce the issue if possible',
            expectedResult: 'Issue reproduced or ruled out',
            nextSteps: ['If reproduced, proceed to step 3', 'If not reproduced, gather more info'],
          },
        ],
        complexity: 'simple' as const,
        estimatedTime: 15,
      },
    ];
  }

  private generateToolAccess(): any[] {
    return [
      {
        toolName: 'Remote Desktop',
        purpose: 'Access user workstation remotely',
        accessMethod: 'Windows Remote Desktop Connection',
        authRequired: true,
        availability: 'business_hours' as const,
        documentation: 'See IT procedures manual section 4.2',
      },
      {
        toolName: 'Event Viewer',
        purpose: 'Check system logs and errors',
        accessMethod: 'Local application on user machine',
        authRequired: false,
        availability: 'always' as const,
        documentation: 'Built-in Windows tool',
      },
    ];
  }

  private generateTechnicalSkills(technicalCriteria: any): any[] {
    const skills = [
      'Problem diagnosis',
      'System troubleshooting',
      'Communication protocols',
      'Documentation practices',
    ];

    return skills.map(skill => ({
      skill,
      currentLevel: 'intermediate' as const,
      targetLevel: 'advanced' as const,
      assessmentMethod: 'Scenario performance evaluation',
    }));
  }

  private generateSoftSkills(communicationCriteria: any): any[] {
    return [
      {
        skill: 'Customer empathy',
        importance: 'high' as const,
        assessmentCriteria: ['Shows understanding of user frustration', 'Uses appropriate language'],
      },
      {
        skill: 'Clear communication',
        importance: 'high' as const,
        assessmentCriteria: ['Explains technical concepts simply', 'Asks clarifying questions'],
      },
    ];
  }

  private generateMilestones(scenario: any): any[] {
    return [
      {
        id: 'milestone-1',
        title: 'Initial Assessment Complete',
        description: 'Successfully gathered all necessary information',
        triggerCondition: 'User provides complete problem description',
        feedback: 'Great job gathering comprehensive information!',
      },
      {
        id: 'milestone-2',
        title: 'Solution Identified',
        description: 'Identified the root cause and solution approach',
        triggerCondition: 'Correct diagnosis made',
        feedback: 'Excellent diagnostic skills demonstrated!',
      },
    ];
  }

  private calculateContextSize(context: ComprehensiveContext): number {
    return JSON.stringify(context).length;
  }
}