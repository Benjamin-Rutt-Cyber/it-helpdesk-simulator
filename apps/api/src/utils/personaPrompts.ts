import { CustomerPersona } from '../config/personas';
import { PersonaState } from '../models/PersonaState';
import { PersonaMemory } from '../models/PersonaMemory';

export interface PersonaPromptContext {
  persona: CustomerPersona;
  state: PersonaState;
  memory: PersonaMemory;
  conversationPhase: string;
  ticketContext: TicketContext;
  userMessage: string;
  previousMessages: string[];
}

export interface TicketContext {
  type: string;
  description: string;
  priority: string;
  category: string;
  businessImpact: string;
  timeConstraints?: string;
}

export class PersonaPromptGenerator {
  static generateSystemPrompt(context: PersonaPromptContext): string {
    let prompt = this.buildBasePersonaPrompt(context.persona);
    prompt += this.addEmotionalStateContext(context.state);
    prompt += this.addMemoryContext(context.memory);
    prompt += this.addTicketContext(context.ticketContext);
    prompt += this.addConversationContext(context);
    prompt += this.addBehavioralGuidelines(context.persona, context.state);
    prompt += this.addResponseStyleGuidelines(context.persona);
    
    return prompt;
  }

  private static buildBasePersonaPrompt(persona: CustomerPersona): string {
    let prompt = `You are ${persona.name}, a ${persona.title}. ${persona.background}\n\n`;
    
    prompt += `**Your Role and Personality:**\n`;
    prompt += `- Age range: ${persona.age_range}\n`;
    prompt += `- Role: ${persona.role} at a ${persona.company_type}\n`;
    prompt += `- Technical level: ${persona.personality.technicalLevel.level}\n`;
    prompt += `- Communication style: ${persona.personality.communication.style}, ${persona.personality.communication.pace} pace\n`;
    prompt += `- Patience level: ${persona.personality.patience}\n`;
    prompt += `- Confidence level: ${persona.personality.confidence}\n`;
    prompt += `- Formality: ${persona.personality.formality}\n\n`;

    // Add technical knowledge context
    prompt += `**Your Technical Knowledge:**\n`;
    prompt += `- Areas you're familiar with: ${persona.personality.technicalLevel.areas.join(', ')}\n`;
    prompt += `- Terms you prefer: ${persona.personality.technicalLevel.vocabulary.preferred.join(', ')}\n`;
    prompt += `- Terms that confuse you: ${persona.personality.technicalLevel.vocabulary.confused_by.join(', ')}\n`;
    prompt += `- Terms you're comfortable with: ${persona.personality.technicalLevel.vocabulary.comfortable_with.join(', ')}\n\n`;

    return prompt;
  }

  private static addEmotionalStateContext(state: PersonaState): string {
    let prompt = `**Your Current Emotional State:**\n`;
    prompt += `- Current mood: ${state.currentMood}\n`;
    prompt += `- Satisfaction level: ${state.satisfactionLevel}/10\n`;
    prompt += `- Frustration level: ${state.frustrationLevel}/10\n`;
    prompt += `- Trust level: ${state.trustLevel}/10\n`;
    prompt += `- Engagement level: ${state.engagementLevel}/10\n`;
    prompt += `- Time in session: ${Math.round(state.timeInSession / 60)} minutes\n`;
    prompt += `- Conversation phase: ${state.conversationPhase}\n\n`;

    // Add recent mood changes if any
    if (state.moodHistory.length > 0) {
      const recentMood = state.moodHistory[state.moodHistory.length - 1];
      prompt += `- Recent mood change: ${recentMood.previousMood} → ${recentMood.newMood} due to "${recentMood.trigger}"\n\n`;
    }

    return prompt;
  }

  private static addMemoryContext(memory: PersonaMemory): string {
    if (memory.totalInteractions === 0) {
      return `**This is your first interaction with IT support.**\n\n`;
    }

    let prompt = `**Your History with IT Support:**\n`;
    prompt += `- Total previous interactions: ${memory.totalInteractions}\n`;
    prompt += `- Relationship trust level: ${memory.relationshipData.trustLevel}/10\n`;
    prompt += `- Preferred communication style: ${memory.relationshipData.communicationStyle}\n`;

    // Add recent session context if available
    if (memory.sessionHistory.length > 0) {
      const lastSession = memory.sessionHistory[memory.sessionHistory.length - 1];
      prompt += `- Last interaction: ${lastSession.issueType} (${lastSession.issueResolved ? 'resolved' : 'unresolved'})\n`;
      
      if (lastSession.learningAchievements.length > 0) {
        prompt += `- You learned: ${lastSession.learningAchievements.join(', ')}\n`;
      }
    }

    // Add ongoing issues
    if (memory.continuityMarkers.ongoingIssues.length > 0) {
      const ongoing = memory.continuityMarkers.ongoingIssues[0];
      prompt += `- Ongoing issue: ${ongoing.description} (${ongoing.status})\n`;
    }

    // Add relationship context
    if (memory.relationshipData.remembersNames) {
      prompt += `- You remember and appreciate when support staff use your name\n`;
    }

    prompt += '\n';
    return prompt;
  }

  private static addTicketContext(ticket: TicketContext): string {
    let prompt = `**Your Current Issue:**\n`;
    prompt += `- Problem type: ${ticket.type}\n`;
    prompt += `- Description: ${ticket.description}\n`;
    prompt += `- Priority for you: ${ticket.priority}\n`;
    prompt += `- Category: ${ticket.category}\n`;
    
    if (ticket.businessImpact !== 'none') {
      prompt += `- Business impact: ${ticket.businessImpact}\n`;
    }
    
    if (ticket.timeConstraints) {
      prompt += `- Time constraints: ${ticket.timeConstraints}\n`;
    }
    
    prompt += '\n';
    return prompt;
  }

  private static addConversationContext(context: PersonaPromptContext): string {
    let prompt = `**Conversation Context:**\n`;
    prompt += `- This is interaction #${context.state.interactionCount + 1} in this session\n`;
    prompt += `- Current phase: ${context.conversationPhase}\n`;
    
    if (context.previousMessages.length > 0) {
      prompt += `- Recent conversation flow:\n`;
      context.previousMessages.slice(-3).forEach((msg, index) => {
        const role = index % 2 === 0 ? 'Support' : 'You';
        prompt += `  ${role}: ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}\n`;
      });
    }
    
    prompt += '\n';
    return prompt;
  }

  private static addBehavioralGuidelines(persona: CustomerPersona, state: PersonaState): string {
    let prompt = `**How You Should Behave:**\n`;

    // Personality-specific behaviors
    switch (persona.id) {
      case 'office_worker':
        prompt += `- Be professional and direct, but not rushed\n`;
        prompt += `- Ask practical questions about impact on your work\n`;
        prompt += `- Show appreciation for efficient solutions\n`;
        break;
      
      case 'frustrated_user':
        prompt += `- Express frustration but not personal attacks\n`;
        prompt += `- Be impatient and want immediate fixes\n`;
        prompt += `- May interrupt or repeat the problem\n`;
        prompt += `- Can be calmed with empathy and quick action\n`;
        break;
      
      case 'patient_retiree':
        prompt += `- Be polite and courteous throughout\n`;
        prompt += `- Ask for step-by-step instructions\n`;
        prompt += `- Express gratitude for patience and help\n`;
        prompt += `- Take time to understand before proceeding\n`;
        break;
      
      case 'new_employee':
        prompt += `- Be somewhat uncertain but eager to learn\n`;
        prompt += `- Ask questions to understand company systems\n`;
        prompt += `- Show appreciation for guidance and training\n`;
        prompt += `- Follow instructions carefully\n`;
        break;
      
      case 'executive':
        prompt += `- Be direct and focused on business impact\n`;
        prompt += `- Express urgency and time sensitivity\n`;
        prompt += `- May delegate or ask for escalation\n`;
        prompt += `- Appreciate efficiency over detailed explanations\n`;
        break;
    }

    // State-dependent behaviors
    if (state.frustrationLevel > 6) {
      prompt += `- You're quite frustrated, so express this appropriately\n`;
      prompt += `- Be more impatient than usual\n`;
      prompt += `- May mention wanting to escalate if things don't improve\n`;
    }

    if (state.trustLevel < 4) {
      prompt += `- You're somewhat skeptical of proposed solutions\n`;
      prompt += `- Ask for confirmation or alternative approaches\n`;
    }

    if (state.satisfactionLevel > 7) {
      prompt += `- Express appreciation for the good service\n`;
      prompt += `- Be more cooperative and patient\n`;
    }

    prompt += '\n';
    return prompt;
  }

  private static addResponseStyleGuidelines(persona: CustomerPersona): string {
    let prompt = `**Response Style Guidelines:**\n`;
    
    // Communication style
    switch (persona.personality.communication.style) {
      case 'direct':
        prompt += `- Be straightforward and to the point\n`;
        break;
      case 'detailed':
        prompt += `- Provide context and background information\n`;
        break;
      case 'casual':
        prompt += `- Use informal language and relaxed tone\n`;
        break;
      case 'formal':
        prompt += `- Use proper grammar and professional language\n`;
        break;
      case 'questioning':
        prompt += `- Ask clarifying questions to understand better\n`;
        break;
    }

    // Verbosity
    switch (persona.personality.communication.verbosity) {
      case 'brief':
        prompt += `- Keep responses short and concise\n`;
        break;
      case 'moderate':
        prompt += `- Provide adequate detail without being excessive\n`;
        break;
      case 'verbose':
        prompt += `- Provide detailed explanations and context\n`;
        break;
    }

    // Interruption tendency
    if (persona.personality.communication.interruption === 'frequently') {
      prompt += `- You may interrupt with questions or concerns\n`;
    }

    // Technical vocabulary guidelines
    prompt += `\n**Language to Use:**\n`;
    prompt += `- Preferred terms: ${persona.personality.technicalLevel.vocabulary.preferred.join(', ')}\n`;
    prompt += `- Avoid using: ${persona.personality.technicalLevel.vocabulary.avoided.join(', ')}\n`;
    
    if (persona.personality.technicalLevel.vocabulary.confused_by.length > 0) {
      prompt += `- Express confusion if these terms are used: ${persona.personality.technicalLevel.vocabulary.confused_by.join(', ')}\n`;
    }

    prompt += `\n**Important Reminders:**\n`;
    prompt += `- Stay completely in character as ${persona.name}\n`;
    prompt += `- Never break character or mention being an AI\n`;
    prompt += `- Respond naturally as this person would in real life\n`;
    prompt += `- React appropriately to the support agent's responses\n`;
    prompt += `- Show realistic emotional responses to progress or setbacks\n`;

    return prompt;
  }

  // Specialized prompt generators for different conversation phases
  static generateGreetingPrompt(context: PersonaPromptContext): string {
    const basePrompt = this.generateSystemPrompt(context);
    
    let greetingAddition = `\n**Greeting Phase Instructions:**\n`;
    
    if (context.memory.totalInteractions === 0) {
      greetingAddition += `- This is your first contact with IT support\n`;
      greetingAddition += `- Introduce yourself and your problem clearly\n`;
    } else {
      const greeting = context.memory.continuityMarkers.lastGreeting;
      if (greeting) {
        greetingAddition += `- Reference previous interactions appropriately\n`;
      }
    }

    // Add persona-specific greeting style
    const greetings = context.persona.behavioral_patterns.greeting_style;
    if (greetings.length > 0) {
      greetingAddition += `- Typical greeting styles you use: ${greetings.join(', ')}\n`;
    }

    greetingAddition += `- State your problem in your characteristic way\n`;
    greetingAddition += `- Show your typical initial emotional state\n`;

    return basePrompt + greetingAddition;
  }

  static generateProblemDescriptionPrompt(context: PersonaPromptContext): string {
    const basePrompt = this.generateSystemPrompt(context);
    
    let problemAddition = `\n**Problem Description Phase Instructions:**\n`;
    problemAddition += `- Describe the problem in your characteristic style: ${context.persona.behavioral_patterns.problem_description}\n`;
    problemAddition += `- Provide details appropriate to your technical level\n`;
    problemAddition += `- Show emotions appropriate to the problem's impact on you\n`;
    
    if (context.state.frustrationLevel > 5) {
      problemAddition += `- Express your frustration with the situation\n`;
    }

    return basePrompt + problemAddition;
  }

  static generateTroubleshootingPrompt(context: PersonaPromptContext): string {
    const basePrompt = this.generateSystemPrompt(context);
    
    let troubleshootingAddition = `\n**Troubleshooting Phase Instructions:**\n`;
    troubleshootingAddition += `- Follow instructions according to your technical level\n`;
    troubleshootingAddition += `- Ask for clarification if instructions are too complex\n`;
    troubleshootingAddition += `- Provide feedback on what you see or experience\n`;
    troubleshootingAddition += `- Show appropriate patience based on your personality\n`;
    
    if (context.persona.personality.technicalLevel.level === 'novice') {
      troubleshootingAddition += `- Ask for step-by-step guidance\n`;
      troubleshootingAddition += `- Express concerns about making mistakes\n`;
    }

    return basePrompt + troubleshootingAddition;
  }

  static generateEscalationPrompt(context: PersonaPromptContext): string {
    const basePrompt = this.generateSystemPrompt(context);
    
    let escalationAddition = `\n**Escalation Phase Instructions:**\n`;
    escalationAddition += `- Express your desire for escalation clearly\n`;
    escalationAddition += `- Explain why the current approach isn't working for you\n`;
    escalationAddition += `- Show appropriate level of frustration or urgency\n`;
    escalationAddition += `- Reference your specific needs or constraints\n`;

    if (context.persona.escalation_likelihood > 0.6) {
      escalationAddition += `- You tend to escalate more readily than others\n`;
    }

    return basePrompt + escalationAddition;
  }

  static generateResolutionPrompt(context: PersonaPromptContext): string {
    const basePrompt = this.generateSystemPrompt(context);
    
    let resolutionAddition = `\n**Resolution Phase Instructions:**\n`;
    resolutionAddition += `- Express appropriate gratitude for the resolution\n`;
    resolutionAddition += `- Confirm that the solution works for you\n`;
    resolutionAddition += `- Ask any follow-up questions you might have\n`;
    resolutionAddition += `- Show improved mood and satisfaction\n`;

    // Add persona-specific resolution preferences
    context.persona.resolution_preferences.forEach(pref => {
      resolutionAddition += `- You appreciate: ${pref}\n`;
    });

    return basePrompt + resolutionAddition;
  }
}

// Utility functions for prompt enhancement
export const PersonaPromptUtils = {
  formatTechnicalTerms: (terms: string[]): string => {
    return terms.map(term => `"${term}"`).join(', ');
  },

  generateMoodDescription: (mood: string, intensity: number): string => {
    const intensityWords = ['slightly', 'moderately', 'quite', 'very', 'extremely'];
    const intensityLevel = Math.min(4, Math.floor(intensity / 2));
    return `${intensityWords[intensityLevel]} ${mood}`;
  },

  buildContextualModifiers: (contextFactors: any): string[] => {
    const modifiers: string[] = [];
    
    if (contextFactors.timeOfDay === 'evening') {
      modifiers.push('tired from a long day');
    }
    
    if (contextFactors.hasDeadline) {
      modifiers.push('under time pressure');
    }
    
    if (contextFactors.workingFromHome) {
      modifiers.push('working remotely');
    }

    return modifiers;
  }
};

export default PersonaPromptGenerator;