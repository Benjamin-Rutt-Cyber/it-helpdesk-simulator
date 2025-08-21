import { logger } from '../utils/logger';

export interface CustomerPersona {
  id: string;
  name: string;
  type: 'office_worker' | 'frustrated_user' | 'patient_retiree' | 'new_employee' | 'executive';
  description: string;
  verificationBehavior: {
    cooperationLevel: 'high' | 'medium' | 'low';
    hesitationPatterns: string[];
    informationProvisionStyle: 'immediate' | 'reluctant' | 'confused' | 'demanding' | 'helpful';
    resistanceScenarios: string[];
  };
  communicationStyle: {
    tone: string;
    vocabulary: string;
    responsePatterns: string[];
    commonPhrases: string[];
  };
  securityAwareness: 'high' | 'medium' | 'low';
  verificationKnowledge: {
    understandsRequirements: boolean;
    hasInformationReadily: boolean;
    questionsProcess: boolean;
  };
}

export interface VerificationScenario {
  id: string;
  name: string;
  description: string;
  triggerConditions: string[];
  customerResponse: {
    initialReaction: string;
    informationProvision: 'immediate' | 'after_explanation' | 'reluctant' | 'partial' | 'refuses';
    questionsAsked: string[];
    finalCompliance: boolean;
  };
  learningObjectives: string[];
}

export interface CustomerVerificationResponse {
  response: string;
  providedInformation: { [key: string]: string | null };
  cooperationLevel: 'high' | 'medium' | 'low';
  hesitation: boolean;
  questions: string[];
  emotionalState: 'calm' | 'frustrated' | 'confused' | 'impatient' | 'cooperative';
  nextActions: string[];
  scenarioTriggers: string[];
}

class AICustomerService {
  private customerPersonas: Map<string, CustomerPersona> = new Map();
  private verificationScenarios: Map<string, VerificationScenario> = new Map();
  private activeScenarios: Map<string, string> = new Map(); // ticketId -> scenarioId

  constructor() {
    this.initializePersonas();
    this.initializeScenarios();
  }

  private initializePersonas(): void {
    const personas: CustomerPersona[] = [
      {
        id: 'office_worker',
        name: 'Professional Office Worker',
        type: 'office_worker',
        description: 'Experienced, professional, cooperative, and understands security requirements',
        verificationBehavior: {
          cooperationLevel: 'high',
          hesitationPatterns: ['Asks for clarification on process', 'Confirms information before providing'],
          informationProvisionStyle: 'immediate',
          resistanceScenarios: [],
        },
        communicationStyle: {
          tone: 'Professional and courteous',
          vocabulary: 'Business-appropriate',
          responsePatterns: ['Acknowledges request immediately', 'Provides information systematically'],
          commonPhrases: ['Of course', 'Let me check my records', 'I understand the security requirement'],
        },
        securityAwareness: 'high',
        verificationKnowledge: {
          understandsRequirements: true,
          hasInformationReadily: true,
          questionsProcess: false,
        },
      },
      {
        id: 'frustrated_user',
        name: 'Frustrated User',
        type: 'frustrated_user',
        description: 'Impatient, stressed, initially resistant but eventually complies',
        verificationBehavior: {
          cooperationLevel: 'medium',
          hesitationPatterns: ['Questions why verification is needed', 'Expresses frustration with process'],
          informationProvisionStyle: 'reluctant',
          resistanceScenarios: ['Initial pushback', 'Demands supervisor', 'Questions authority'],
        },
        communicationStyle: {
          tone: 'Impatient and stressed',
          vocabulary: 'Direct, sometimes curt',
          responsePatterns: ['Expresses frustration first', 'Eventually provides information'],
          commonPhrases: ['Why do I need to do this?', 'This is ridiculous', 'Fine, whatever'],
        },
        securityAwareness: 'low',
        verificationKnowledge: {
          understandsRequirements: false,
          hasInformationReadily: false,
          questionsProcess: true,
        },
      },
      {
        id: 'patient_retiree',
        name: 'Patient Retiree',
        type: 'patient_retiree',
        description: 'Elderly, patient, cooperative but sometimes confused about technology',
        verificationBehavior: {
          cooperationLevel: 'high',
          hesitationPatterns: ['Asks for clarification', 'Confirms understanding', 'Takes time to find information'],
          informationProvisionStyle: 'helpful',
          resistanceScenarios: [],
        },
        communicationStyle: {
          tone: 'Polite and thoughtful',
          vocabulary: 'Formal, sometimes outdated terms',
          responsePatterns: ['Thanks for patience', 'Asks clarifying questions', 'Provides detailed context'],
          commonPhrases: ['Thank you for your patience', 'Let me see if I understand', 'Could you explain that again?'],
        },
        securityAwareness: 'medium',
        verificationKnowledge: {
          understandsRequirements: true,
          hasInformationReadily: false,
          questionsProcess: true,
        },
      },
      {
        id: 'new_employee',
        name: 'New Employee',
        type: 'new_employee',
        description: 'Recently hired, uncertain, eager to comply but lacks information',
        verificationBehavior: {
          cooperationLevel: 'high',
          hesitationPatterns: ['Admits uncertainty', 'Asks for help finding information', 'Volunteers to get manager'],
          informationProvisionStyle: 'confused',
          resistanceScenarios: [],
        },
        communicationStyle: {
          tone: 'Uncertain but eager to help',
          vocabulary: 'Informal, sometimes asks for definitions',
          responsePatterns: ['Admits when unsure', 'Asks for guidance', 'Volunteers alternatives'],
          commonPhrases: ['I\'m not sure', 'Should I ask my manager?', 'I\'m still learning the systems'],
        },
        securityAwareness: 'medium',
        verificationKnowledge: {
          understandsRequirements: true,
          hasInformationReadily: false,
          questionsProcess: true,
        },
      },
      {
        id: 'executive',
        name: 'Executive',
        type: 'executive',
        description: 'High-level executive, impatient, may demand bypass or expedited service',
        verificationBehavior: {
          cooperationLevel: 'low',
          hesitationPatterns: ['Questions authority', 'Demands expedited process', 'References position'],
          informationProvisionStyle: 'demanding',
          resistanceScenarios: ['Demands bypass', 'References authority', 'Threatens escalation'],
        },
        communicationStyle: {
          tone: 'Authoritative and impatient',
          vocabulary: 'Corporate, sometimes condescending',
          responsePatterns: ['References position first', 'Demands quick resolution', 'May provide information grudgingly'],
          commonPhrases: ['Do you know who I am?', 'This is urgent', 'I don\'t have time for this'],
        },
        securityAwareness: 'medium',
        verificationKnowledge: {
          understandsRequirements: true,
          hasInformationReadily: true,
          questionsProcess: true,
        },
      },
    ];

    personas.forEach(persona => {
      this.customerPersonas.set(persona.id, persona);
    });

    logger.info('Customer personas initialized', {
      personaCount: personas.length,
      personas: personas.map(p => ({ id: p.id, name: p.name, type: p.type })),
    });
  }

  private initializeScenarios(): void {
    const scenarios: VerificationScenario[] = [
      {
        id: 'compliant_verification',
        name: 'Compliant Customer',
        description: 'Customer readily provides all required verification information',
        triggerConditions: ['high_cooperation', 'security_aware'],
        customerResponse: {
          initialReaction: 'Understands and agrees to verification requirements',
          informationProvision: 'immediate',
          questionsAsked: [],
          finalCompliance: true,
        },
        learningObjectives: [
          'Practice efficient verification with cooperative customers',
          'Learn to maintain security standards even with compliant customers',
          'Understand the importance of thorough verification regardless of cooperation',
        ],
      },
      {
        id: 'hesitant_but_compliant',
        name: 'Hesitant but Compliant',
        description: 'Customer initially hesitates but provides information after explanation',
        triggerConditions: ['medium_cooperation', 'security_conscious'],
        customerResponse: {
          initialReaction: 'Questions why verification is necessary',
          informationProvision: 'after_explanation',
          questionsAsked: ['Why do you need this information?', 'Is this really necessary?'],
          finalCompliance: true,
        },
        learningObjectives: [
          'Practice explaining verification importance to customers',
          'Learn to handle customer concerns about verification',
          'Develop patience with security-conscious customers',
        ],
      },
      {
        id: 'confused_customer',
        name: 'Confused Customer',
        description: 'Customer is unclear about verification requirements and needs guidance',
        triggerConditions: ['low_security_awareness', 'high_cooperation'],
        customerResponse: {
          initialReaction: 'Confused about what information is needed',
          informationProvision: 'partial',
          questionsAsked: ['What exactly do you need?', 'Where do I find this information?'],
          finalCompliance: true,
        },
        learningObjectives: [
          'Practice clear communication of verification requirements',
          'Learn to guide customers through verification process',
          'Develop skills in customer education about security',
        ],
      },
      {
        id: 'resistant_customer',
        name: 'Resistant Customer',
        description: 'Customer resists verification, may refuse to provide information',
        triggerConditions: ['low_cooperation', 'impatient'],
        customerResponse: {
          initialReaction: 'Refuses verification, demands immediate service',
          informationProvision: 'reluctant',
          questionsAsked: ['Why can\'t you just help me?', 'This is wasting my time!'],
          finalCompliance: false,
        },
        learningObjectives: [
          'Practice handling difficult customers while maintaining security',
          'Learn de-escalation techniques during verification',
          'Understand when to escalate verification issues',
        ],
      },
      {
        id: 'incomplete_information',
        name: 'Incomplete Information',
        description: 'Customer cannot provide all required verification details',
        triggerConditions: ['new_user', 'incomplete_records'],
        customerResponse: {
          initialReaction: 'Willing to help but lacks some information',
          informationProvision: 'partial',
          questionsAsked: ['I don\'t have that information', 'Can we use something else?'],
          finalCompliance: true,
        },
        learningObjectives: [
          'Learn to handle incomplete verification scenarios',
          'Practice using alternative verification methods',
          'Understand escalation procedures for incomplete verification',
        ],
      },
      {
        id: 'authority_figure',
        name: 'Authority Figure',
        description: 'High-ranking customer who may demand bypass of verification',
        triggerConditions: ['executive_persona', 'urgent_request'],
        customerResponse: {
          initialReaction: 'References authority, demands expedited service',
          informationProvision: 'reluctant',
          questionsAsked: ['Do you know who I am?', 'Can\'t you make an exception?'],
          finalCompliance: false,
        },
        learningObjectives: [
          'Practice maintaining security standards with authority figures',
          'Learn to handle pressure for verification bypass',
          'Understand proper escalation procedures for VIP customers',
        ],
      },
    ];

    scenarios.forEach(scenario => {
      this.verificationScenarios.set(scenario.id, scenario);
    });

    logger.info('Verification scenarios initialized', {
      scenarioCount: scenarios.length,
      scenarios: scenarios.map(s => ({ id: s.id, name: s.name })),
    });
  }

  async generateVerificationResponse(
    ticketId: string,
    personaId: string,
    verificationRequest: {
      fieldType: string;
      question: string;
      context?: string;
    }
  ): Promise<CustomerVerificationResponse> {
    const persona = this.customerPersonas.get(personaId);
    if (!persona) {
      throw new Error(`Customer persona not found: ${personaId}`);
    }

    // Determine appropriate scenario
    const scenarioId = this.selectVerificationScenario(persona, verificationRequest);
    const scenario = this.verificationScenarios.get(scenarioId);
    
    if (scenario) {
      this.activeScenarios.set(ticketId, scenarioId);
    }

    // Generate response based on persona and scenario
    const response = this.generatePersonaVerificationResponse(
      persona,
      scenario,
      verificationRequest
    );

    logger.info('Verification response generated', {
      ticketId,
      personaId,
      scenarioId,
      fieldType: verificationRequest.fieldType,
      cooperationLevel: response.cooperationLevel,
      providedInfo: Object.keys(response.providedInformation).length > 0,
    });

    return response;
  }

  private selectVerificationScenario(
    persona: CustomerPersona,
    verificationRequest: { fieldType: string; question: string; context?: string }
  ): string {
    // Determine scenario based on persona characteristics and request context
    const triggers = [];
    
    // Add persona-based triggers
    if (persona.verificationBehavior.cooperationLevel === 'high') {
      triggers.push('high_cooperation');
    } else if (persona.verificationBehavior.cooperationLevel === 'medium') {
      triggers.push('medium_cooperation');
    } else {
      triggers.push('low_cooperation');
    }

    if (persona.securityAwareness === 'high') {
      triggers.push('security_aware');
    } else if (persona.securityAwareness === 'medium') {
      triggers.push('security_conscious');
    } else {
      triggers.push('low_security_awareness');
    }

    if (persona.type === 'executive') {
      triggers.push('executive_persona');
    }

    if (persona.type === 'new_employee') {
      triggers.push('new_user');
    }

    if (persona.verificationBehavior.informationProvisionStyle === 'demanding') {
      triggers.push('impatient');
    }

    // Find matching scenario
    const scenarios = Array.from(this.verificationScenarios.values());
    
    for (const scenario of scenarios) {
      const matchingTriggers = scenario.triggerConditions.filter(trigger => 
        triggers.includes(trigger)
      );
      
      if (matchingTriggers.length >= 1) {
        return scenario.id;
      }
    }

    // Default scenario
    return 'compliant_verification';
  }

  private generatePersonaVerificationResponse(
    persona: CustomerPersona,
    scenario: VerificationScenario | undefined,
    verificationRequest: { fieldType: string; question: string; context?: string }
  ): CustomerVerificationResponse {
    const providedInformation: { [key: string]: string | null } = {};
    let response = '';
    let cooperationLevel = persona.verificationBehavior.cooperationLevel;
    let hesitation = false;
    let questions: string[] = [];
    let emotionalState: CustomerVerificationResponse['emotionalState'] = 'calm';
    let nextActions: string[] = [];
    let scenarioTriggers: string[] = [];

    // Generate response based on field type and persona
    switch (verificationRequest.fieldType) {
      case 'customerName':
        response = this.generateNameVerificationResponse(persona, scenario);
        if (persona.verificationBehavior.informationProvisionStyle === 'immediate' || 
            persona.verificationBehavior.informationProvisionStyle === 'helpful') {
          providedInformation.customerName = this.generateMockCustomerName(persona);
        }
        break;
        
      case 'username':
        response = this.generateUsernameVerificationResponse(persona, scenario);
        if (persona.verificationBehavior.informationProvisionStyle === 'immediate' || 
            persona.verificationBehavior.informationProvisionStyle === 'helpful') {
          providedInformation.username = this.generateMockUsername(persona);
        }
        break;
        
      case 'assetTag':
        response = this.generateAssetTagVerificationResponse(persona, scenario);
        if (persona.verificationBehavior.informationProvisionStyle === 'immediate') {
          providedInformation.assetTag = this.generateMockAssetTag();
        } else if (persona.type === 'new_employee') {
          providedInformation.assetTag = null; // New employee might not know
        }
        break;
        
      case 'department':
        response = this.generateDepartmentVerificationResponse(persona, scenario);
        if (persona.verificationBehavior.informationProvisionStyle !== 'refuses') {
          providedInformation.department = this.generateMockDepartment(persona);
        }
        break;
        
      case 'contactInfo':
        response = this.generateContactInfoVerificationResponse(persona, scenario);
        if (persona.verificationBehavior.informationProvisionStyle === 'immediate' || 
            persona.verificationBehavior.informationProvisionStyle === 'helpful') {
          providedInformation.contactInfo = this.generateMockContactInfo();
        }
        break;
        
      default:
        response = this.generateGenericVerificationResponse(persona);
    }

    // Apply scenario modifications
    if (scenario) {
      if (scenario.customerResponse.informationProvision === 'reluctant') {
        cooperationLevel = 'low';
        hesitation = true;
        emotionalState = 'frustrated';
      } else if (scenario.customerResponse.informationProvision === 'after_explanation') {
        hesitation = true;
        questions = scenario.customerResponse.questionsAsked;
      } else if (scenario.customerResponse.informationProvision === 'partial') {
        // Remove some provided information
        Object.keys(providedInformation).forEach(key => {
          if (Math.random() < 0.3) { // 30% chance to not provide each piece of info
            providedInformation[key] = null;
          }
        });
      }
      
      scenarioTriggers = scenario.triggerConditions;
    }

    // Add persona-specific questions and hesitation
    if (persona.verificationBehavior.hesitationPatterns.length > 0 && Math.random() < 0.4) {
      hesitation = true;
      const randomHesitation = persona.verificationBehavior.hesitationPatterns[
        Math.floor(Math.random() * persona.verificationBehavior.hesitationPatterns.length)
      ];
      questions.push(randomHesitation);
    }

    // Determine next actions
    if (cooperationLevel === 'low') {
      nextActions.push('may_request_supervisor', 'possible_escalation_needed');
    } else if (hesitation) {
      nextActions.push('needs_reassurance', 'explain_security_importance');
    } else {
      nextActions.push('continue_verification', 'proceed_with_support');
    }

    return {
      response,
      providedInformation,
      cooperationLevel,
      hesitation,
      questions,
      emotionalState,
      nextActions,
      scenarioTriggers,
    };
  }

  private generateNameVerificationResponse(persona: CustomerPersona, scenario?: VerificationScenario): string {
    if (persona.type === 'office_worker') {
      return "Of course! My name is Sarah Johnson. I understand you need to verify my identity for security purposes.";
    } else if (persona.type === 'frustrated_user') {
      return "Why do you need my name? You called ME! Fine, it's Mike Rodriguez. Can we hurry this up?";
    } else if (persona.type === 'patient_retiree') {
      return "Certainly, dear. My full name is Margaret Elizabeth Thompson. Should I spell that for you?";
    } else if (persona.type === 'new_employee') {
      return "Sure! I'm Jennifer Kim. I just started here last week, so I'm still getting used to all the procedures.";
    } else if (persona.type === 'executive') {
      return "This is David Harrison, VP of Operations. I assume you have my information already. Can we expedite this?";
    }
    
    return "Yes, my name is John Smith.";
  }

  private generateUsernameVerificationResponse(persona: CustomerPersona, scenario?: VerificationScenario): string {
    if (persona.type === 'office_worker') {
      return "My username is sarah.johnson - that's s-a-r-a-h dot j-o-h-n-s-o-n.";
    } else if (persona.type === 'frustrated_user') {
      return "It's mrodriguez. M-R-O-D-R-I-G-U-E-Z. Look, I really need this fixed today.";
    } else if (persona.type === 'patient_retiree') {
      return "Let me see... I believe it's m.thompson. Or is it margaret.thompson? I always get confused with these computer things.";
    } else if (persona.type === 'new_employee') {
      return "I think it's jennifer.kim, but I'm not 100% sure. They set it up for me during orientation. Should I check my email signature?";
    } else if (persona.type === 'executive') {
      return "dharrison. D-H-A-R-R-I-S-O-N. Now can we please move on? I have a board meeting in ten minutes.";
    }
    
    return "My username is jsmith.";
  }

  private generateAssetTagVerificationResponse(persona: CustomerPersona, scenario?: VerificationScenario): string {
    if (persona.type === 'office_worker') {
      return "Let me check the sticker on my laptop... it says IT-LAP-4521. Does that match your records?";
    } else if (persona.type === 'frustrated_user') {
      return "Asset tag? You mean that little sticker? It's... uh... IT-LAP-3892 I think. This is taking forever.";
    } else if (persona.type === 'patient_retiree') {
      return "Oh my, let me put on my reading glasses. The little sticker says... IT-LAP-2145. Is that what you need?";
    } else if (persona.type === 'new_employee') {
      return "Asset tag? I'm not sure what that is. Is it on my computer somewhere? I'm still learning where everything is.";
    } else if (persona.type === 'executive') {
      return "I don't have time to look for asset tags. Can't your system look this up? Fine... IT-LAP-9001.";
    }
    
    return "The asset tag is IT-LAP-1234.";
  }

  private generateDepartmentVerificationResponse(persona: CustomerPersona, scenario?: VerificationScenario): string {
    if (persona.type === 'office_worker') {
      return "I work in Marketing, specifically in the Digital Campaigns team under Susan Miller.";
    } else if (persona.type === 'frustrated_user') {
      return "Sales department. The West Coast division. Look, is all this really necessary?";
    } else if (persona.type === 'patient_retiree') {
      return "I'm in Human Resources, in the Benefits administration section. I've been there for 32 years now.";
    } else if (persona.type === 'new_employee') {
      return "I'm in... let me think... Engineering? The software development team. I'm still learning the org structure.";
    } else if (persona.type === 'executive') {
      return "I'm the VP of Operations. I oversee multiple departments including IT, which should be helping me, not interrogating me.";
    }
    
    return "I work in the IT department.";
  }

  private generateContactInfoVerificationResponse(persona: CustomerPersona, scenario?: VerificationScenario): string {
    if (persona.type === 'office_worker') {
      return "My work number is 555-0123, extension 4567. My email is sarah.johnson@company.com.";
    } else if (persona.type === 'frustrated_user') {
      return "Phone is 555-0199. Email is mrodriguez@company.com. Are we done with the twenty questions now?";
    } else if (persona.type === 'patient_retiree') {
      return "My extension is 2345, and my email is... oh dear, it's so long... margaret.thompson@company.com.";
    } else if (persona.type === 'new_employee') {
      return "I think my extension is 5678? And my email should be jennifer.kim@company.com. They just set it up.";
    } else if (persona.type === 'executive') {
      return "You should have my direct line: 555-0100. Executive assistant is at extension 1001 if you need to verify anything.";
    }
    
    return "My phone is 555-0123 and email is jsmith@company.com.";
  }

  private generateGenericVerificationResponse(persona: CustomerPersona): string {
    const commonPhrases = persona.communicationStyle.commonPhrases;
    const randomPhrase = commonPhrases[Math.floor(Math.random() * commonPhrases.length)];
    
    return `${randomPhrase} What specific information do you need from me?`;
  }

  private generateMockCustomerName(persona: CustomerPersona): string {
    const names = {
      'office_worker': 'Sarah Johnson',
      'frustrated_user': 'Mike Rodriguez',
      'patient_retiree': 'Margaret Thompson',
      'new_employee': 'Jennifer Kim',
      'executive': 'David Harrison',
    };
    
    return names[persona.type] || 'John Smith';
  }

  private generateMockUsername(persona: CustomerPersona): string {
    const usernames = {
      'office_worker': 'sarah.johnson',
      'frustrated_user': 'mrodriguez',
      'patient_retiree': 'm.thompson',
      'new_employee': 'jennifer.kim',
      'executive': 'dharrison',
    };
    
    return usernames[persona.type] || 'jsmith';
  }

  private generateMockAssetTag(): string {
    return `IT-LAP-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  private generateMockDepartment(persona: CustomerPersona): string {
    const departments = {
      'office_worker': 'Marketing',
      'frustrated_user': 'Sales',
      'patient_retiree': 'Human Resources',
      'new_employee': 'Engineering',
      'executive': 'Operations',
    };
    
    return departments[persona.type] || 'IT';
  }

  private generateMockContactInfo(): string {
    const extension = Math.floor(Math.random() * 9000) + 1000;
    return `555-0123 ext. ${extension}`;
  }

  async getPersonas(): Promise<CustomerPersona[]> {
    return Array.from(this.customerPersonas.values());
  }

  async getPersona(personaId: string): Promise<CustomerPersona | undefined> {
    return this.customerPersonas.get(personaId);
  }

  async getScenarios(): Promise<VerificationScenario[]> {
    return Array.from(this.verificationScenarios.values());
  }

  async getActiveScenario(ticketId: string): Promise<VerificationScenario | undefined> {
    const scenarioId = this.activeScenarios.get(ticketId);
    return scenarioId ? this.verificationScenarios.get(scenarioId) : undefined;
  }

  async getVerificationInsights(ticketId?: string): Promise<{
    totalInteractions: number;
    scenarioDistribution: Array<{ scenario: string; count: number }>;
    cooperationLevels: Array<{ level: string; percentage: number }>;
    commonQuestions: string[];
    learningOpportunities: string[];
  }> {
    // This would typically pull from a database of interactions
    // For now, return mock insights
    return {
      totalInteractions: 25,
      scenarioDistribution: [
        { scenario: 'compliant_verification', count: 12 },
        { scenario: 'hesitant_but_compliant', count: 8 },
        { scenario: 'confused_customer', count: 3 },
        { scenario: 'resistant_customer', count: 2 },
      ],
      cooperationLevels: [
        { level: 'high', percentage: 60 },
        { level: 'medium', percentage: 32 },
        { level: 'low', percentage: 8 },
      ],
      commonQuestions: [
        'Why do you need this information?',
        'Is this really necessary?',
        'Can\'t you just help me?',
      ],
      learningOpportunities: [
        'Practice explaining security importance to resistant customers',
        'Develop skills in guiding confused customers through verification',
        'Learn to handle authority figures while maintaining security standards',
      ],
    };
  }
}

export const aiCustomerService = new AICustomerService();
export default aiCustomerService;