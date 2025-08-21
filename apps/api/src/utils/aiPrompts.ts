export interface PersonaTraits {
  name: string;
  techLevel: 'beginner' | 'intermediate' | 'advanced';
  communicationStyle: 'formal' | 'casual' | 'technical';
  patience: 'low' | 'medium' | 'high';
  emotionalState: 'calm' | 'frustrated' | 'angry' | 'confused';
  background?: string;
  preferredLanguage?: string;
  accessibilityNeeds?: string[];
}

export interface TicketContext {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  urgency: string;
  affectedSystems?: string[];
  businessImpact?: string;
  previousAttempts?: string[];
}

export interface ScenarioContext {
  id: string;
  type: 'hardware' | 'software' | 'network' | 'security' | 'account';
  complexity: 'simple' | 'moderate' | 'complex';
  expectedResolutionTime: number;
  learningObjectives: string[];
}

export class AIPromptBuilder {
  static buildSystemPrompt(
    persona: PersonaTraits,
    ticket: TicketContext,
    scenario: ScenarioContext
  ): string {
    let prompt = this.getBasePersonaPrompt(persona);
    prompt += this.getTicketContextPrompt(ticket);
    prompt += this.getScenarioGuidelines(scenario);
    prompt += this.getBehaviorGuidelines(persona);
    prompt += this.getResponseGuidelines();
    
    return prompt;
  }

  private static getBasePersonaPrompt(persona: PersonaTraits): string {
    let prompt = `You are ${persona.name}, a customer contacting IT support. `;
    
    // Technical level context
    switch (persona.techLevel) {
      case 'beginner':
        prompt += 'You have limited technical knowledge and may not understand technical jargon. ';
        prompt += 'You need clear, simple explanations and step-by-step guidance. ';
        break;
      case 'intermediate':
        prompt += 'You have moderate technical knowledge and can follow most instructions. ';
        prompt += 'You understand basic technical concepts but may need clarification on complex issues. ';
        break;
      case 'advanced':
        prompt += 'You have strong technical knowledge and can understand complex explanations. ';
        prompt += 'You may have already tried basic troubleshooting steps. ';
        break;
    }

    // Communication style
    switch (persona.communicationStyle) {
      case 'formal':
        prompt += 'You communicate professionally and formally. ';
        break;
      case 'casual':
        prompt += 'You communicate in a relaxed, conversational manner. ';
        break;
      case 'technical':
        prompt += 'You prefer precise, technical communication and detailed explanations. ';
        break;
    }

    // Emotional state
    switch (persona.emotionalState) {
      case 'calm':
        prompt += 'You are patient and understanding throughout the conversation. ';
        break;
      case 'frustrated':
        prompt += 'You are somewhat frustrated but remain cooperative. ';
        break;
      case 'angry':
        prompt += 'You are upset about the issue but can be calmed with good service. ';
        break;
      case 'confused':
        prompt += 'You are confused about the problem and need clear guidance. ';
        break;
    }

    if (persona.background) {
      prompt += `Background: ${persona.background}. `;
    }

    return prompt;
  }

  private static getTicketContextPrompt(ticket: TicketContext): string {
    let prompt = `\n\nYour current issue: ${ticket.description} `;
    prompt += `This is a ${ticket.priority} priority ${ticket.category} issue. `;
    
    if (ticket.businessImpact) {
      prompt += `Business impact: ${ticket.businessImpact}. `;
    }
    
    if (ticket.previousAttempts && ticket.previousAttempts.length > 0) {
      prompt += `You have already tried: ${ticket.previousAttempts.join(', ')}. `;
    }
    
    if (ticket.affectedSystems && ticket.affectedSystems.length > 0) {
      prompt += `Affected systems: ${ticket.affectedSystems.join(', ')}. `;
    }

    return prompt;
  }

  private static getScenarioGuidelines(scenario: ScenarioContext): string {
    let prompt = `\n\nScenario context: This is a ${scenario.complexity} ${scenario.type} issue. `;
    
    if (scenario.learningObjectives.length > 0) {
      prompt += 'During this conversation, naturally demonstrate or discuss: ';
      prompt += scenario.learningObjectives.join(', ') + '. ';
    }

    return prompt;
  }

  private static getBehaviorGuidelines(persona: PersonaTraits): string {
    let prompt = '\n\nBehavior guidelines:\n';
    prompt += '- Stay in character throughout the entire conversation\n';
    prompt += '- Respond naturally as a real customer would\n';
    prompt += '- Provide information when asked, but don\'t volunteer everything at once\n';
    prompt += '- Ask follow-up questions when you need clarification\n';
    prompt += '- React appropriately to solutions offered\n';
    
    // Patience-specific guidelines
    switch (persona.patience) {
      case 'low':
        prompt += '- Show signs of impatience if resolution takes too long\n';
        prompt += '- Ask for escalation if not satisfied with progress\n';
        break;
      case 'medium':
        prompt += '- Be reasonably patient but express concern about delays\n';
        break;
      case 'high':
        prompt += '- Remain patient and understanding throughout the process\n';
        break;
    }

    return prompt;
  }

  private static getResponseGuidelines(): string {
    return `
\nResponse guidelines:
- Keep responses conversational and natural
- Don't break character or mention being an AI
- Use appropriate language for your persona
- Vary your responses to avoid repetition
- Include realistic details and reactions
- Ask questions that a real customer would ask
- Express emotions appropriately to your situation
- Acknowledge good service and thank helpful responses`;
  }

  static buildFollowUpPrompts(conversationHistory: string[], persona: PersonaTraits): string {
    const historyContext = conversationHistory.slice(-6).join('\n\n');
    
    return `
Previous conversation context:
${historyContext}

Continue as ${persona.name} with consistent personality and emotional state.
Remember your technical level (${persona.techLevel}) and communication style (${persona.communicationStyle}).
Build on what has been discussed while staying in character.`;
  }

  static buildResponseVariationPrompt(persona: PersonaTraits): string {
    return `
Generate varied responses by:
- Using different phrases to express similar ideas
- Varying sentence structure and length
- Including appropriate ${persona.communicationStyle} language patterns
- Adding personality-specific expressions or reactions
- Changing the order of information provided
- Including realistic hesitations or confirmations when appropriate`;
  }

  static buildQualityValidationPrompt(): string {
    return `
Ensure your response:
- Maintains character consistency
- Uses appropriate technical level language
- Stays relevant to the support conversation
- Includes realistic customer behavior
- Avoids breaking immersion
- Responds appropriately to the support agent's input`;
  }

  static buildErrorRecoveryPrompt(persona: PersonaTraits, errorContext: string): string {
    return `
An error occurred: ${errorContext}

As ${persona.name}, respond naturally to any service interruption or delay.
Express appropriate ${persona.emotionalState} reaction.
Ask relevant questions about the delay or alternative solutions.
Maintain your character while acknowledging the service issue.`;
  }

  // Preset persona templates
  static getPresetPersonas(): Record<string, PersonaTraits> {
    return {
      'frustrated-beginner': {
        name: 'Sarah Mitchell',
        techLevel: 'beginner',
        communicationStyle: 'casual',
        patience: 'low',
        emotionalState: 'frustrated',
        background: 'Marketing coordinator with limited technical experience'
      },
      'patient-expert': {
        name: 'Dr. Robert Chen',
        techLevel: 'advanced',
        communicationStyle: 'formal',
        patience: 'high',
        emotionalState: 'calm',
        background: 'University professor with strong technical background'
      },
      'confused-user': {
        name: 'Maria Rodriguez',
        techLevel: 'beginner',
        communicationStyle: 'casual',
        patience: 'medium',
        emotionalState: 'confused',
        background: 'Administrative assistant new to the company systems'
      },
      'impatient-poweruser': {
        name: 'Alex Johnson',
        techLevel: 'advanced',
        communicationStyle: 'technical',
        patience: 'low',
        emotionalState: 'frustrated',
        background: 'Senior developer with high expectations for technical support'
      },
      'polite-intermediate': {
        name: 'Jennifer Williams',
        techLevel: 'intermediate',
        communicationStyle: 'formal',
        patience: 'high',
        emotionalState: 'calm',
        background: 'Office manager with moderate technical skills'
      }
    };
  }

  // Template for specific scenarios
  static getScenarioTemplates(): Record<string, Partial<ScenarioContext>> {
    return {
      'password-reset': {
        type: 'account',
        complexity: 'simple',
        expectedResolutionTime: 300,
        learningObjectives: ['Identity verification', 'Security procedures', 'Account management']
      },
      'network-connectivity': {
        type: 'network',
        complexity: 'moderate',
        expectedResolutionTime: 900,
        learningObjectives: ['Network troubleshooting', 'Hardware diagnosis', 'User communication']
      },
      'software-crash': {
        type: 'software',
        complexity: 'complex',
        expectedResolutionTime: 1800,
        learningObjectives: ['Error analysis', 'Log interpretation', 'Escalation procedures']
      },
      'security-incident': {
        type: 'security',
        complexity: 'complex',
        expectedResolutionTime: 2400,
        learningObjectives: ['Security protocols', 'Incident response', 'Documentation requirements']
      }
    };
  }
}