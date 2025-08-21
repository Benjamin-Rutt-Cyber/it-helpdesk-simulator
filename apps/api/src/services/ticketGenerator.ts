import { 
  Ticket,
  TicketTemplate,
  TicketCategory,
  TicketPriority,
  Department,
  CustomerInfo,
  AssetInfo,
  TechnicalContext,
} from '../models/Ticket';
import { CreateTicketData } from '../repositories/ticketRepository';
import { ticketRepository } from '../repositories/ticketRepository';
import { logger } from '../utils/logger';

export interface TicketGenerationOptions {
  templateId?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  customerId?: string;
  assetIds?: string[];
  includeVariations?: boolean;
  complexityScale?: number; // 1-10 scale for content complexity
  realisticDetails?: boolean; // Enable realistic technical details
}

export class TicketGenerator {
  private templates: TicketTemplate[] = [];
  private customerProfiles: CustomerInfo[] = [];
  private assetProfiles: AssetInfo[] = [];

  constructor() {
    this.initializeTemplates();
    this.initializeCustomerProfiles();
    this.initializeAssetProfiles();
  }

  async generateTicket(options: TicketGenerationOptions = {}): Promise<CreateTicketData> {
    try {
      logger.info('Generating ticket with options', options);

      // Select template
      const template = await this.selectTemplate(options);
      
      // Generate ticket data
      const ticketData = await this.generateFromTemplate(template, options);
      
      logger.info('Ticket generated successfully', { 
        templateId: template.id, 
        category: ticketData.category,
        priority: ticketData.priority 
      });

      return ticketData;
    } catch (error) {
      logger.error('Failed to generate ticket', { options, error });
      throw error;
    }
  }

  async generateMultipleTickets(
    count: number, 
    options: TicketGenerationOptions = {}
  ): Promise<CreateTicketData[]> {
    try {
      const tickets: CreateTicketData[] = [];
      
      for (let i = 0; i < count; i++) {
        // Vary complexity across tickets if not specified
        const complexityScale = options.complexityScale || 
          Math.floor(Math.random() * 10) + 1; // Random 1-10
        
        const ticket = await this.generateTicket({
          ...options,
          includeVariations: true,
          complexityScale,
          realisticDetails: options.realisticDetails || Math.random() > 0.7,
        });
        tickets.push(ticket);
      }

      logger.info('Multiple tickets generated', { count, options });
      return tickets;
    } catch (error) {
      logger.error('Failed to generate multiple tickets', { count, options, error });
      throw error;
    }
  }

  async generateTicketsWithProgression(
    count: number,
    options: TicketGenerationOptions = {}
  ): Promise<CreateTicketData[]> {
    try {
      const tickets: CreateTicketData[] = [];
      
      for (let i = 0; i < count; i++) {
        // Progressive complexity scaling (starts easy, gets harder)
        const progressRatio = i / Math.max(count - 1, 1);
        const complexityScale = Math.floor(3 + (progressRatio * 7)); // 3 to 10
        
        const ticket = await this.generateTicket({
          ...options,
          includeVariations: true,
          complexityScale,
          realisticDetails: complexityScale > 6,
        });
        tickets.push(ticket);
      }

      logger.info('Progressive tickets generated', { count, options });
      return tickets;
    } catch (error) {
      logger.error('Failed to generate progressive tickets', { count, options, error });
      throw error;
    }
  }

  private async selectTemplate(options: TicketGenerationOptions): Promise<TicketTemplate> {
    let availableTemplates = this.templates;

    // Filter by category if specified
    if (options.category) {
      availableTemplates = availableTemplates.filter(t => t.category === options.category);
    }

    // Filter by priority if specified
    if (options.priority) {
      availableTemplates = availableTemplates.filter(t => t.priority === options.priority);
    }

    // Filter by difficulty level if specified
    if (options.difficultyLevel) {
      availableTemplates = availableTemplates.filter(t => t.difficultyLevel === options.difficultyLevel);
    }

    // If specific template ID is provided, use it
    if (options.templateId) {
      const template = await ticketRepository.getTemplateById(options.templateId);
      if (template) {
        return template;
      }
    }

    // Fallback to available templates
    if (availableTemplates.length === 0) {
      availableTemplates = this.templates;
    }

    // Select random template
    const randomIndex = Math.floor(Math.random() * availableTemplates.length);
    return availableTemplates[randomIndex];
  }

  private async generateFromTemplate(
    template: TicketTemplate, 
    options: TicketGenerationOptions
  ): Promise<CreateTicketData> {
    const complexityScale = options.complexityScale || 5;
    const includeRealistic = options.realisticDetails || false;
    
    // Generate title with complexity scaling
    const title = this.generateTitle(template, options.includeVariations, complexityScale);
    
    // Generate description with complexity and realistic details
    const description = this.generateDescription(
      template, 
      options.includeVariations, 
      complexityScale,
      includeRealistic
    );
    
    // Select or generate customer
    const customerId = options.customerId || this.generateCustomerId();
    
    // Select or generate assets
    const assetIds = options.assetIds || this.generateAssetIds(template);
    
    // Generate metadata with complexity considerations
    const metadata = this.generateMetadata(template, complexityScale, includeRealistic);

    return {
      title,
      description,
      category: template.category,
      priority: template.priority,
      customerId,
      assetIds,
      templateId: template.id,
      metadata,
    };
  }

  private generateTitle(
    template: TicketTemplate, 
    includeVariations: boolean = false,
    complexityScale: number = 5
  ): string {
    const titleTemplates = template.titleTemplates;
    let selectedTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];

    if (includeVariations && template.variationRules.allowTitleVariation) {
      selectedTitle = this.applyTitleVariations(selectedTitle, complexityScale);
    }

    return selectedTitle;
  }

  private generateDescription(
    template: TicketTemplate, 
    includeVariations: boolean = false,
    complexityScale: number = 5,
    includeRealistic: boolean = false
  ): string {
    const descriptionTemplates = template.descriptionTemplates;
    let selectedDescription = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];

    if (includeVariations && template.variationRules.allowDescriptionVariation) {
      selectedDescription = this.applyDescriptionVariations(selectedDescription, complexityScale);
    }

    if (includeRealistic) {
      selectedDescription = this.addRealisticDetails(selectedDescription, template, complexityScale);
    }

    return selectedDescription;
  }

  private generateCustomerId(): string {
    // Select random customer profile
    const customerProfile = this.customerProfiles[Math.floor(Math.random() * this.customerProfiles.length)];
    return customerProfile.id;
  }

  private generateAssetIds(template: TicketTemplate): string[] {
    const assetCount = Math.floor(Math.random() * 3) + 1; // 1-3 assets
    const selectedAssets: string[] = [];

    for (let i = 0; i < assetCount; i++) {
      const asset = this.assetProfiles[Math.floor(Math.random() * this.assetProfiles.length)];
      if (!selectedAssets.includes(asset.assetTag)) {
        selectedAssets.push(asset.assetTag);
      }
    }

    return selectedAssets;
  }

  private generateMetadata(
    template: TicketTemplate, 
    complexityScale: number = 5,
    includeRealistic: boolean = false
  ): any {
    const baseMetadata: any = {
      templateId: template.id,
      difficultyLevel: template.difficultyLevel,
      learningObjectives: [...template.learningObjectives],
      expectedResolutionSteps: [...template.expectedResolutionSteps],
      knowledgeBaseArticles: [...template.knowledgeBaseArticles],
      skillsRequired: [...template.skillsRequired],
      estimatedResolutionTime: this.scaleResolutionTime(template.estimatedResolutionTime, complexityScale),
      complexity: template.complexity,
      businessImpact: template.businessImpact,
      complexityScale,
    };

    if (includeRealistic && template.technicalContextTemplates.length > 0) {
      const techContext = template.technicalContextTemplates[
        Math.floor(Math.random() * template.technicalContextTemplates.length)
      ];
      if (techContext.systemSpecifications && techContext.errorMessages && techContext.environmentDetails && techContext.symptoms) {
        baseMetadata.technicalContext = this.enhanceTechnicalContext(techContext as TechnicalContext, complexityScale);
      }
    }

    return baseMetadata;
  }

  private applyTitleVariations(title: string, complexityScale: number = 5): string {
    const basicVariations = [
      { pattern: /unable to/gi, replacements: ['cannot', 'can\'t', 'having trouble'] },
      { pattern: /problem/gi, replacements: ['issue', 'trouble', 'difficulty'] },
      { pattern: /computer/gi, replacements: ['laptop', 'PC', 'workstation', 'machine'] },
      { pattern: /error/gi, replacements: ['problem', 'issue', 'failure'] },
    ];

    const complexVariations = [
      { pattern: /slow/gi, replacements: ['sluggish', 'unresponsive', 'performing poorly', 'degraded performance'] },
      { pattern: /connection/gi, replacements: ['connectivity', 'network link', 'communication pathway'] },
      { pattern: /crash/gi, replacements: ['failure', 'unexpected termination', 'system fault', 'application exception'] },
    ];

    let variatedTitle = title;
    const variations = complexityScale > 6 ? [...basicVariations, ...complexVariations] : basicVariations;
    
    variations.forEach(variation => {
      const threshold = complexityScale > 7 ? 0.3 : 0.5; // More variations for higher complexity
      if (variation.pattern.test(variatedTitle) && Math.random() > threshold) {
        const replacement = variation.replacements[Math.floor(Math.random() * variation.replacements.length)];
        variatedTitle = variatedTitle.replace(variation.pattern, replacement);
      }
    });

    return variatedTitle;
  }

  private applyDescriptionVariations(description: string, complexityScale: number = 5): string {
    const timeVariations = ['yesterday', 'this morning', 'a few hours ago', 'earlier today', 'since last week'];
    const urgencyVariations = ['urgent', 'ASAP', 'as soon as possible', 'immediately', 'critical priority'];
    const contextVariations = [
      'affecting multiple users',
      'blocking critical business operations',
      'impacting client deliverables',
      'causing productivity issues',
      'preventing normal workflow'
    ];
    
    let variatedDescription = description;
    
    // Add time context (more likely for higher complexity)
    const timeThreshold = complexityScale > 6 ? 0.5 : 0.7;
    if (Math.random() > timeThreshold) {
      const timeContext = timeVariations[Math.floor(Math.random() * timeVariations.length)];
      variatedDescription = `This started ${timeContext}. ${variatedDescription}`;
    }
    
    // Add urgency context
    const urgencyThreshold = complexityScale > 7 ? 0.6 : 0.8;
    if (Math.random() > urgencyThreshold) {
      const urgency = urgencyVariations[Math.floor(Math.random() * urgencyVariations.length)];
      variatedDescription += ` Please help ${urgency}!`;
    }

    // Add business context for higher complexity
    if (complexityScale > 6 && Math.random() > 0.7) {
      const context = contextVariations[Math.floor(Math.random() * contextVariations.length)];
      variatedDescription += ` This is ${context}.`;
    }

    return variatedDescription;
  }

  private scaleResolutionTime(baseTime: number, complexityScale: number): number {
    // Scale resolution time based on complexity (1-10 scale)
    // Clamp complexity scale to reasonable bounds
    const clampedScale = Math.max(1, Math.min(10, complexityScale));
    const scaleFactor = 1 + ((clampedScale - 5) * 0.2); // 0.2 to 1.8 multiplier
    const scaledTime = Math.round(baseTime * scaleFactor);
    
    // Ensure minimum resolution time of 5 minutes
    return Math.max(5, scaledTime);
  }

  private addRealisticDetails(
    description: string, 
    template: TicketTemplate, 
    complexityScale: number
  ): string {
    const realisticDetails = [];

    // Add error codes for technical issues
    if (template.category !== TicketCategory.PASSWORD && complexityScale > 5) {
      const errorCodes = [
        'Error 0x80004005',
        'Event ID 1000',
        'Code 1603',
        'BSOD 0x0000007E',
        'HTTP 500 Error'
      ];
      if (Math.random() > 0.6) {
        const errorCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
        realisticDetails.push(`Error details: ${errorCode}`);
      }
    }

    // Add system specifications for hardware/software issues
    if (complexityScale > 6 && Math.random() > 0.7) {
      realisticDetails.push('System: Windows 11 Pro, 16GB RAM, Core i7-12700');
    }

    // Add troubleshooting attempts
    if (complexityScale > 4 && Math.random() > 0.5) {
      const attempts = [
        'Already tried restarting',
        'Cleared browser cache',
        'Ran Windows Update',
        'Checked with colleagues',
        'Disabled antivirus temporarily'
      ];
      const attempt = attempts[Math.floor(Math.random() * attempts.length)];
      realisticDetails.push(`Note: ${attempt} - no improvement.`);
    }

    if (realisticDetails.length > 0) {
      return `${description}\n\n${realisticDetails.join('\n')}`;
    }

    return description;
  }

  private enhanceTechnicalContext(
    context: TechnicalContext, 
    complexityScale: number
  ): TechnicalContext {
    const enhanced = { ...context };

    // Add more error messages for higher complexity
    if (complexityScale > 7 && enhanced.errorMessages.length > 0) {
      const additionalErrors = [
        {
          errorCode: 'SYS_RESOURCE_LOW',
          message: 'System resources running low',
          timestamp: new Date(),
          source: 'System Monitor',
          severity: 'warning' as const
        },
        {
          errorCode: 'NET_TIMEOUT',
          message: 'Network operation timed out',
          timestamp: new Date(),
          source: 'Network Stack',
          severity: 'error' as const
        }
      ];
      
      if (Math.random() > 0.6) {
        enhanced.errorMessages.push(
          additionalErrors[Math.floor(Math.random() * additionalErrors.length)]
        );
      }
    }

    // Add more symptoms for complex issues
    if (complexityScale > 6) {
      const additionalSymptoms = [
        {
          description: 'Performance degradation observed across multiple applications',
          frequency: 'intermittent' as const,
          impact: 'medium' as const,
          reproducible: false
        },
        {
          description: 'System becomes unresponsive during peak usage',
          frequency: 'frequent' as const,
          impact: 'high' as const,
          reproducible: true
        }
      ];

      if (Math.random() > 0.7) {
        enhanced.symptoms.push(
          additionalSymptoms[Math.floor(Math.random() * additionalSymptoms.length)]
        );
      }
    }

    return enhanced;
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'password-reset-basic',
        name: 'Password Reset - Basic',
        category: TicketCategory.PASSWORD,
        priority: TicketPriority.MEDIUM,
        difficultyLevel: 'beginner',
        titleTemplates: [
          'Cannot log into my account',
          'Password not working',
          'Locked out of my computer',
          'Need password reset',
          'Login credentials not accepted',
          'Account access issues',
        ],
        descriptionTemplates: [
          'I tried logging in with my usual password but it says invalid credentials. I need to reset my password to access my work files.',
          'My password isn\'t working and I\'m locked out. Can you help me reset it? I have an important presentation today.',
          'I\'ve been trying to log in for the past hour but keep getting authentication errors. This is blocking my work.',
          'Changed my password last week but now I can\'t remember it. Need access urgently for client meeting.',
        ],
        customerProfiles: [],
        assetTemplates: [],
        technicalContextTemplates: [
          {
            systemSpecifications: {
              operatingSystem: 'Windows 11',
              version: '22H2',
              architecture: 'x64',
              processor: 'Intel Core i5',
              memory: '8GB',
              diskSpace: '256GB SSD',
            },
            errorMessages: [{
              errorCode: 'AUTH_FAILED',
              message: 'The username or password is incorrect',
              timestamp: new Date(),
              source: 'Windows Login',
              severity: 'error',
            }],
            environmentDetails: {
              domain: 'COMPANY.LOCAL',
              networkSegment: 'Office LAN',
              dhcpEnabled: true,
            },
            symptoms: [{
              description: 'Login dialog repeatedly appears after entering credentials',
              frequency: 'constant',
              impact: 'high',
              reproducible: true,
            }],
          },
        ],
        learningObjectives: [
          'Verify customer identity using security questions',
          'Guide customer through password reset process',
          'Explain password requirements and best practices',
          'Document resolution for future reference',
        ],
        expectedResolutionSteps: [
          'Verify customer identity',
          'Reset password in Active Directory',
          'Provide temporary password',
          'Guide customer through first login',
          'Ensure customer can change password',
          'Verify successful authentication',
        ],
        skillsRequired: ['Active Directory', 'Customer Service', 'Security Procedures'],
        knowledgeBaseArticles: ['KB-001: Password Reset Procedure', 'KB-002: Security Verification'],
        estimatedResolutionTime: 15,
        complexity: 'low',
        businessImpact: 'medium',
        variationRules: {
          allowTitleVariation: true,
          allowDescriptionVariation: true,
          allowCustomerVariation: true,
          allowAssetVariation: false,
          allowTechnicalVariation: true,
          maxVariations: 4,
        },
        usageCount: 0,
        successRate: 95,
        averageResolutionTime: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        isActive: true,
        tags: ['password', 'authentication', 'beginner'],
      },
      {
        id: 'email-not-working',
        name: 'Email Connection Issues',
        category: TicketCategory.EMAIL,
        priority: TicketPriority.HIGH,
        difficultyLevel: 'intermediate',
        titleTemplates: [
          'Email not receiving messages',
          'Outlook connection issues',
          'Cannot send emails',
          'Email sync problems',
          'Outlook keeps disconnecting',
          'Mail server connection timeout',
        ],
        descriptionTemplates: [
          'My Outlook stopped working this morning. I\'m not receiving any new emails and can\'t send messages. This is affecting my work with clients.',
          'Email has been down for 2 hours. I can see old emails but nothing new is coming in. Very urgent as I\'m expecting important client communications.',
          'Outlook keeps showing "Working Offline" and won\'t connect to the server. Tried restarting multiple times.',
          'Getting "Cannot connect to server" errors when trying to send emails. Receiving seems to work intermittently.',
        ],
        customerProfiles: [],
        assetTemplates: [],
        technicalContextTemplates: [
          {
            systemSpecifications: {
              operatingSystem: 'Windows 11',
              version: '22H2',
              architecture: 'x64',
              processor: 'Intel Core i7',
              memory: '16GB',
              diskSpace: '512GB SSD',
            },
            errorMessages: [{
              errorCode: '0x800CCC0E',
              message: 'Your server has unexpectedly terminated the connection',
              timestamp: new Date(),
              source: 'Microsoft Outlook',
              severity: 'error',
            }],
            environmentDetails: {
              domain: 'COMPANY.LOCAL',
              networkSegment: 'Office LAN',
              dhcpEnabled: true,
              proxySettings: 'Auto-detect',
            },
            symptoms: [{
              description: 'Outlook shows "Working Offline" status',
              frequency: 'constant',
              impact: 'high',
              reproducible: true,
            }],
          },
        ],
        learningObjectives: [
          'Diagnose email connectivity issues',
          'Check Exchange server status',
          'Troubleshoot Outlook configuration',
          'Test email flow',
          'Analyze network connectivity problems',
        ],
        expectedResolutionSteps: [
          'Check server connectivity',
          'Verify Exchange mailbox status',
          'Test email configuration',
          'Check network connectivity',
          'Rebuild Outlook profile if needed',
          'Confirm email flow restoration',
        ],
        skillsRequired: ['Exchange Server', 'Outlook', 'Network Troubleshooting'],
        knowledgeBaseArticles: ['KB-010: Email Troubleshooting', 'KB-011: Outlook Profile Rebuild'],
        estimatedResolutionTime: 30,
        complexity: 'medium',
        businessImpact: 'high',
        variationRules: {
          allowTitleVariation: true,
          allowDescriptionVariation: true,
          allowCustomerVariation: true,
          allowAssetVariation: true,
          allowTechnicalVariation: true,
          maxVariations: 5,
        },
        usageCount: 0,
        successRate: 88,
        averageResolutionTime: 28,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        isActive: true,
        tags: ['email', 'outlook', 'intermediate', 'connectivity'],
      },
      {
        id: 'printer-not-working',
        name: 'Printer Connection Problems',
        category: TicketCategory.PRINTER,
        priority: TicketPriority.LOW,
        difficultyLevel: 'beginner',
        titleTemplates: [
          'Printer won\'t print',
          'Cannot connect to printer',
          'Print jobs stuck in queue',
          'Printer offline error',
          'Nothing happens when I try to print',
        ],
        descriptionTemplates: [
          'The printer on my floor isn\'t working. When I try to print, nothing comes out and it shows as offline.',
          'I\'ve been trying to print important documents for the past 30 minutes but the printer queue shows jobs are stuck.',
          'Printer was working fine yesterday but today it says "offline" even though it\'s turned on.',
        ],
        customerProfiles: [],
        assetTemplates: [],
        technicalContextTemplates: [
          {
            systemSpecifications: {
              operatingSystem: 'Windows 11',
              version: '22H2',
              architecture: 'x64',
              processor: 'Intel Core i5',
              memory: '8GB',
              diskSpace: '256GB SSD',
            },
            errorMessages: [{
              errorCode: 'PRINTER_OFFLINE',
              message: 'The printer is offline. Check the printer connection.',
              timestamp: new Date(),
              source: 'Windows Print Spooler',
              severity: 'warning',
            }],
            environmentDetails: {
              networkSegment: 'Office LAN',
              dhcpEnabled: true,
            },
            symptoms: [{
              description: 'Print jobs appear in queue but don\'t print',
              frequency: 'constant',
              impact: 'medium',
              reproducible: true,
            }],
          },
        ],
        learningObjectives: [
          'Diagnose printer connectivity issues',
          'Clear print queue problems',
          'Check network printer configuration',
          'Test print functionality',
        ],
        expectedResolutionSteps: [
          'Check printer power and connections',
          'Clear print queue',
          'Restart print spooler service',
          'Test network connectivity to printer',
          'Reinstall printer drivers if needed',
          'Verify successful printing',
        ],
        skillsRequired: ['Desktop Support', 'Network Troubleshooting', 'Print Services'],
        knowledgeBaseArticles: ['KB-020: Printer Troubleshooting', 'KB-021: Print Queue Management'],
        estimatedResolutionTime: 20,
        complexity: 'low',
        businessImpact: 'low',
        variationRules: {
          allowTitleVariation: true,
          allowDescriptionVariation: true,
          allowCustomerVariation: true,
          allowAssetVariation: true,
          allowTechnicalVariation: true,
          maxVariations: 3,
        },
        usageCount: 0,
        successRate: 92,
        averageResolutionTime: 18,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        isActive: true,
        tags: ['printer', 'hardware', 'beginner'],
      },
      {
        id: 'software-crash',
        name: 'Application Crashes',
        category: TicketCategory.SOFTWARE,
        priority: TicketPriority.MEDIUM,
        difficultyLevel: 'intermediate',
        titleTemplates: [
          'Excel keeps crashing',
          'Application won\'t start',
          'Software freezing repeatedly',
          'Program stops responding',
          'Application error on startup',
        ],
        descriptionTemplates: [
          'Excel crashes every time I try to open a large spreadsheet. I get an error message and it closes.',
          'The accounting software won\'t start up. I get an error about missing files.',
          'My design software keeps freezing when I try to save files. This is really slowing down my work.',
        ],
        customerProfiles: [],
        assetTemplates: [],
        technicalContextTemplates: [
          {
            systemSpecifications: {
              operatingSystem: 'Windows 11',
              version: '22H2',
              architecture: 'x64',
              processor: 'Intel Core i7',
              memory: '16GB',
              diskSpace: '512GB SSD',
            },
            errorMessages: [{
              errorCode: '0xC0000005',
              message: 'Access violation reading location 0x00000000',
              timestamp: new Date(),
              source: 'Microsoft Excel',
              severity: 'critical',
              stackTrace: 'EXCEL.EXE+0x12345',
            }],
            environmentDetails: {
              domain: 'COMPANY.LOCAL',
              antivirusStatus: 'Windows Defender - Active',
              lastUpdates: new Date(),
            },
            symptoms: [{
              description: 'Application crashes when opening files larger than 10MB',
              frequency: 'frequent',
              impact: 'high',
              reproducible: true,
              reproducibilitySteps: [
                'Open Excel',
                'Click File > Open',
                'Select large spreadsheet',
                'Application crashes immediately',
              ],
            }],
          },
        ],
        learningObjectives: [
          'Diagnose application crash issues',
          'Check system resource availability',
          'Analyze error logs and crash dumps',
          'Repair or reinstall problematic software',
        ],
        expectedResolutionSteps: [
          'Reproduce the crash',
          'Check system resources (RAM, disk space)',
          'Review Windows Event Logs',
          'Run application in safe mode',
          'Repair Office installation',
          'Test with different files',
        ],
        skillsRequired: ['Software Troubleshooting', 'Windows Administration', 'Application Support'],
        knowledgeBaseArticles: ['KB-030: Office Troubleshooting', 'KB-031: Application Crashes'],
        estimatedResolutionTime: 45,
        complexity: 'medium',
        businessImpact: 'medium',
        variationRules: {
          allowTitleVariation: true,
          allowDescriptionVariation: true,
          allowCustomerVariation: true,
          allowAssetVariation: true,
          allowTechnicalVariation: true,
          maxVariations: 4,
        },
        usageCount: 0,
        successRate: 85,
        averageResolutionTime: 42,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        isActive: true,
        tags: ['software', 'crashes', 'intermediate'],
      },
      {
        id: 'network-slow',
        name: 'Slow Network Performance',
        category: TicketCategory.NETWORK,
        priority: TicketPriority.MEDIUM,
        difficultyLevel: 'advanced',
        titleTemplates: [
          'Internet is very slow',
          'Network performance issues',
          'Websites taking forever to load',
          'File transfers timing out',
          'Network connection sluggish',
        ],
        descriptionTemplates: [
          'The internet has been extremely slow all morning. Websites take minutes to load and file downloads keep timing out.',
          'Network performance in our department is terrible today. Everyone is complaining about slow speeds.',
          'I can\'t access cloud files properly because the connection is so slow. This is impacting our project deadlines.',
        ],
        customerProfiles: [],
        assetTemplates: [],
        technicalContextTemplates: [
          {
            systemSpecifications: {
              operatingSystem: 'Windows 11',
              version: '22H2',
              architecture: 'x64',
              processor: 'Intel Core i7',
              memory: '16GB',
              diskSpace: '1TB SSD',
              networkConfiguration: 'Intel Ethernet I219-V',
            },
            errorMessages: [],
            environmentDetails: {
              networkSegment: 'Floor 3 VLAN',
              dhcpEnabled: true,
              proxySettings: 'Corporate Proxy',
              firewallStatus: 'Windows Defender Firewall - Enabled',
            },
            symptoms: [{
              description: 'Download speeds significantly below normal',
              frequency: 'constant',
              impact: 'high',
              reproducible: true,
              workarounds: 'Using mobile hotspot for urgent tasks',
            }],
          },
        ],
        learningObjectives: [
          'Diagnose network performance issues',
          'Use network diagnostic tools',
          'Identify bandwidth bottlenecks',
          'Escalate to network team when appropriate',
        ],
        expectedResolutionSteps: [
          'Test network speed from user workstation',
          'Check for local network congestion',
          'Review switch port statistics',
          'Test from different network segments',
          'Escalate to network infrastructure team',
          'Monitor resolution progress',
        ],
        skillsRequired: ['Network Troubleshooting', 'Network Monitoring', 'Infrastructure Support'],
        knowledgeBaseArticles: ['KB-040: Network Performance', 'KB-041: Bandwidth Analysis'],
        estimatedResolutionTime: 60,
        complexity: 'high',
        businessImpact: 'high',
        variationRules: {
          allowTitleVariation: true,
          allowDescriptionVariation: true,
          allowCustomerVariation: true,
          allowAssetVariation: true,
          allowTechnicalVariation: true,
          maxVariations: 3,
        },
        usageCount: 0,
        successRate: 78,
        averageResolutionTime: 65,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        isActive: true,
        tags: ['network', 'performance', 'advanced'],
      },
    ];
  }

  private initializeCustomerProfiles(): void {
    this.customerProfiles = [
      {
        id: 'customer-001',
        firstName: 'Sarah',
        lastName: 'Johnson',
        fullName: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        phone: '+1-555-0123',
        department: Department.SALES,
        jobTitle: 'Sales Manager',
        officeLocation: 'Building A, Floor 3',
        employeeId: 'EMP001234',
        manager: 'Mike Davis',
        technicalSkillLevel: 'intermediate',
        preferredContactMethod: 'email',
        timezone: 'EST',
        workingHours: {
          start: '08:00',
          end: '17:00',
          daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      },
      {
        id: 'customer-002',
        firstName: 'David',
        lastName: 'Chen',
        fullName: 'David Chen',
        email: 'david.chen@company.com',
        phone: '+1-555-0124',
        department: Department.ENGINEERING,
        jobTitle: 'Software Engineer',
        officeLocation: 'Building B, Floor 2',
        employeeId: 'EMP001235',
        manager: 'Lisa Wang',
        technicalSkillLevel: 'advanced',
        preferredContactMethod: 'email',
        timezone: 'PST',
        workingHours: {
          start: '09:00',
          end: '18:00',
          daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      },
    ];
  }

  private initializeAssetProfiles(): void {
    this.assetProfiles = [
      {
        assetTag: 'LAP-001234',
        assetType: 'laptop',
        manufacturer: 'Dell',
        model: 'Latitude 7420',
        serialNumber: 'DL7420-12345',
        operatingSystem: 'Windows 11',
        osVersion: '22H2',
        specifications: {
          cpu: 'Intel Core i7-1185G7',
          ram: '16GB DDR4',
          storage: '512GB SSD',
          graphics: 'Intel Iris Xe',
        },
        installedSoftware: [
          { name: 'Microsoft Office 365', version: '16.0.15601' },
          { name: 'Google Chrome', version: '118.0.5993.88' },
          { name: 'Zoom', version: '5.15.2' },
        ],
      },
      {
        assetTag: 'DSK-002345',
        assetType: 'desktop',
        manufacturer: 'HP',
        model: 'EliteDesk 800 G9',
        serialNumber: 'HP800-23456',
        operatingSystem: 'Windows 11',
        osVersion: '22H2',
        specifications: {
          cpu: 'Intel Core i5-12500',
          ram: '8GB DDR4',
          storage: '256GB SSD',
          graphics: 'Intel UHD 770',
        },
        installedSoftware: [
          { name: 'Microsoft Office 365', version: '16.0.15601' },
          { name: 'Mozilla Firefox', version: '119.0' },
          { name: 'Adobe Acrobat', version: '23.006.20380' },
        ],
      },
    ];
  }
}

export const ticketGenerator = new TicketGenerator();
export default ticketGenerator;