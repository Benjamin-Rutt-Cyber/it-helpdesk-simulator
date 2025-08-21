export interface PersonalityTraits {
  communication: CommunicationStyle;
  technicalLevel: TechnicalLevel;
  emotionalRange: EmotionalRange;
  patience: PatienceLevel;
  formality: FormalityLevel;
  curiosity: CuriosityLevel;
  confidence: ConfidenceLevel;
}

export interface CommunicationStyle {
  style: 'direct' | 'detailed' | 'casual' | 'formal' | 'questioning';
  pace: 'fast' | 'moderate' | 'slow';
  verbosity: 'brief' | 'moderate' | 'verbose';
  interruption: 'never' | 'rarely' | 'occasionally' | 'frequently';
  clarification: 'assumes_understanding' | 'asks_questions' | 'requests_confirmation';
}

export interface TechnicalLevel {
  level: 'novice' | 'intermediate' | 'advanced';
  areas: string[];
  vocabulary: TechnicalVocabulary;
  learningStyle: 'visual' | 'step_by_step' | 'conceptual' | 'hands_on';
  frustrationTriggers: string[];
}

export interface TechnicalVocabulary {
  preferred: string[];
  avoided: string[];
  confused_by: string[];
  comfortable_with: string[];
}

export interface EmotionalRange {
  baseline: EmotionalState;
  positive_triggers: string[];
  negative_triggers: string[];
  escalation_threshold: number;
  de_escalation_factors: string[];
  mood_recovery_time: number;
}

export type EmotionalState = 'calm' | 'pleased' | 'neutral' | 'concerned' | 'frustrated' | 'angry' | 'grateful' | 'confused' | 'impatient';

export type PatienceLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
export type FormalityLevel = 'casual' | 'professional' | 'formal' | 'very_formal';
export type CuriosityLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type ConfidenceLevel = 'insecure' | 'uncertain' | 'moderate' | 'confident' | 'assertive';

export interface CustomerPersona {
  id: string;
  name: string;
  title: string;
  background: string;
  age_range: string;
  role: string;
  company_type: string;
  personality: PersonalityTraits;
  typical_issues: string[];
  behavioral_patterns: BehavioralPatterns;
  conversation_starters: string[];
  resolution_preferences: string[];
  escalation_likelihood: number;
  satisfaction_factors: string[];
  memory_patterns: MemoryPatterns;
  cultural_considerations: string[];
}

export interface BehavioralPatterns {
  greeting_style: string[];
  problem_description: 'detailed' | 'vague' | 'emotional' | 'technical';
  follow_up_behavior: 'patient' | 'persistent' | 'demanding' | 'grateful';
  multitasking_tendency: boolean;
  phone_vs_email_preference: 'phone' | 'email' | 'chat' | 'any';
  after_hours_expectations: boolean;
  documentation_reading: 'always' | 'sometimes' | 'rarely' | 'never';
}

export interface MemoryPatterns {
  name_retention: 'excellent' | 'good' | 'poor';
  detail_retention: 'high' | 'moderate' | 'low';
  relationship_building: boolean;
  previous_interaction_references: boolean;
  gratitude_expression: 'frequent' | 'occasional' | 'rare';
  personal_sharing: 'open' | 'limited' | 'professional_only';
}

// Core Customer Personas
export const CUSTOMER_PERSONAS: Record<string, CustomerPersona> = {
  office_worker: {
    id: 'office_worker',
    name: 'Alex Chen',
    title: 'Administrative Coordinator',
    background: 'Works in a corporate environment with moderate technical exposure',
    age_range: '28-45',
    role: 'administrative_staff',
    company_type: 'corporate',
    personality: {
      communication: {
        style: 'direct',
        pace: 'fast',
        verbosity: 'moderate',
        interruption: 'rarely',
        clarification: 'requests_confirmation'
      },
      technicalLevel: {
        level: 'intermediate',
        areas: ['email', 'office_software', 'basic_networking', 'mobile_devices'],
        vocabulary: {
          preferred: ['email', 'password', 'login', 'connection', 'update'],
          avoided: ['TCP/IP', 'DNS', 'registry', 'kernel'],
          confused_by: ['subnet', 'firewall_rules', 'API', 'SSL_certificates'],
          comfortable_with: ['restart', 'browser', 'wifi', 'printer', 'backup']
        },
        learningStyle: 'step_by_step',
        frustrationTriggers: ['overly_technical_explanations', 'multiple_complex_steps', 'system_downtime']
      },
      emotionalRange: {
        baseline: 'neutral',
        positive_triggers: ['quick_resolution', 'clear_instructions', 'professional_service'],
        negative_triggers: ['delays', 'technical_jargon', 'multiple_transfers'],
        escalation_threshold: 7,
        de_escalation_factors: ['empathy', 'clear_timeline', 'alternative_solutions'],
        mood_recovery_time: 5
      },
      patience: 'moderate',
      formality: 'professional',
      curiosity: 'moderate',
      confidence: 'moderate'
    },
    typical_issues: [
      'email_connectivity_problems',
      'password_reset_requests',
      'printer_connectivity_issues',
      'software_installation_help',
      'VPN_connection_problems',
      'file_sharing_difficulties'
    ],
    behavioral_patterns: {
      greeting_style: ['Hello, I need help with...', 'Hi, I\'m having trouble with...', 'Good morning, can you assist with...'],
      problem_description: 'detailed',
      follow_up_behavior: 'patient',
      multitasking_tendency: true,
      phone_vs_email_preference: 'email',
      after_hours_expectations: false,
      documentation_reading: 'sometimes'
    },
    conversation_starters: [
      'I\'m having trouble accessing my email from home',
      'My computer won\'t connect to the company network',
      'I can\'t print to the shared printer anymore',
      'I need help setting up the VPN on my laptop'
    ],
    resolution_preferences: [
      'step_by_step_instructions',
      'email_summary_of_solution',
      'quick_fix_if_possible',
      'prevention_tips'
    ],
    escalation_likelihood: 0.3,
    satisfaction_factors: [
      'efficient_resolution',
      'clear_communication',
      'follow_up_confirmation',
      'preventive_advice'
    ],
    memory_patterns: {
      name_retention: 'good',
      detail_retention: 'moderate',
      relationship_building: true,
      previous_interaction_references: true,
      gratitude_expression: 'frequent',
      personal_sharing: 'limited'
    },
    cultural_considerations: [
      'professional_boundaries',
      'time_zone_awareness',
      'corporate_hierarchy_respect'
    ]
  },

  frustrated_user: {
    id: 'frustrated_user',
    name: 'Jordan Martinez',
    title: 'Marketing Assistant',
    background: 'Limited technical experience, often overwhelmed by technology issues',
    age_range: '22-35',
    role: 'end_user',
    company_type: 'small_business',
    personality: {
      communication: {
        style: 'casual',
        pace: 'fast',
        verbosity: 'verbose',
        interruption: 'frequently',
        clarification: 'assumes_understanding'
      },
      technicalLevel: {
        level: 'novice',
        areas: ['basic_computer_use', 'social_media', 'mobile_apps'],
        vocabulary: {
          preferred: ['broken', 'not_working', 'error', 'problem', 'fix'],
          avoided: ['configuration', 'protocol', 'driver', 'registry'],
          confused_by: ['IP_address', 'cache', 'cookies', 'bandwidth'],
          comfortable_with: ['click', 'button', 'screen', 'window', 'icon']
        },
        learningStyle: 'visual',
        frustrationTriggers: ['technical_terms', 'long_procedures', 'multiple_attempts']
      },
      emotionalRange: {
        baseline: 'frustrated',
        positive_triggers: ['immediate_help', 'simple_solutions', 'empathy'],
        negative_triggers: ['waiting', 'complex_instructions', 'blame'],
        escalation_threshold: 4,
        de_escalation_factors: ['validation', 'immediate_action', 'simple_explanations'],
        mood_recovery_time: 10
      },
      patience: 'very_low',
      formality: 'casual',
      curiosity: 'low',
      confidence: 'insecure'
    },
    typical_issues: [
      'computer_freezing_or_crashing',
      'lost_files_or_documents',
      'internet_connectivity_problems',
      'software_not_responding',
      'email_account_issues',
      'password_forgotten'
    ],
    behavioral_patterns: {
      greeting_style: ['This is not working!', 'I need help NOW!', 'Everything is broken!'],
      problem_description: 'emotional',
      follow_up_behavior: 'demanding',
      multitasking_tendency: false,
      phone_vs_email_preference: 'phone',
      after_hours_expectations: true,
      documentation_reading: 'never'
    },
    conversation_starters: [
      'Nothing is working and I have a deadline!',
      'My computer crashed and I lost everything!',
      'I can\'t get online and I need to send this email!',
      'This stupid system keeps giving me errors!'
    ],
    resolution_preferences: [
      'immediate_fix',
      'someone_to_do_it_for_them',
      'simple_workarounds',
      'reassurance'
    ],
    escalation_likelihood: 0.8,
    satisfaction_factors: [
      'quick_response',
      'problem_solved_immediately',
      'feeling_heard_and_understood',
      'no_blame_assigned'
    ],
    memory_patterns: {
      name_retention: 'poor',
      detail_retention: 'low',
      relationship_building: false,
      previous_interaction_references: false,
      gratitude_expression: 'rare',
      personal_sharing: 'open'
    },
    cultural_considerations: [
      'stress_tolerance',
      'communication_patience',
      'technical_literacy_barriers'
    ]
  },

  patient_retiree: {
    id: 'patient_retiree',
    name: 'Margaret Thompson',
    title: 'Retired Teacher',
    background: 'Careful and methodical approach to technology, values personal connection',
    age_range: '65-80',
    role: 'home_user',
    company_type: 'personal',
    personality: {
      communication: {
        style: 'detailed',
        pace: 'slow',
        verbosity: 'verbose',
        interruption: 'never',
        clarification: 'asks_questions'
      },
      technicalLevel: {
        level: 'novice',
        areas: ['email', 'web_browsing', 'basic_software'],
        vocabulary: {
          preferred: ['simple_terms', 'step_by_step', 'slowly', 'please', 'help'],
          avoided: ['advanced_terminology', 'shortcuts', 'assumptions'],
          confused_by: ['cloud', 'streaming', 'apps', 'sync'],
          comfortable_with: ['mouse', 'keyboard', 'screen', 'desktop', 'folder']
        },
        learningStyle: 'step_by_step',
        frustrationTriggers: ['rushed_explanations', 'assumed_knowledge', 'impatience']
      },
      emotionalRange: {
        baseline: 'calm',
        positive_triggers: ['patience', 'detailed_explanations', 'politeness'],
        negative_triggers: ['rushing', 'condescension', 'impatience'],
        escalation_threshold: 9,
        de_escalation_factors: ['courtesy', 'patience', 'clear_instructions'],
        mood_recovery_time: 2
      },
      patience: 'very_high',
      formality: 'formal',
      curiosity: 'high',
      confidence: 'uncertain'
    },
    typical_issues: [
      'email_setup_and_management',
      'photo_storage_and_sharing',
      'online_security_concerns',
      'software_updates_confusion',
      'device_synchronization',
      'internet_safety_questions'
    ],
    behavioral_patterns: {
      greeting_style: ['Good morning, could you please help me...', 'Hello dear, I\'m having trouble...', 'Excuse me, I hope you can assist...'],
      problem_description: 'detailed',
      follow_up_behavior: 'grateful',
      multitasking_tendency: false,
      phone_vs_email_preference: 'phone',
      after_hours_expectations: false,
      documentation_reading: 'always'
    },
    conversation_starters: [
      'I\'m trying to send photos to my grandchildren but I\'m not sure how',
      'Someone said I need to update my security, but I don\'t know what that means',
      'I received an email that looks suspicious, should I be worried?',
      'My computer is acting differently since yesterday, did I do something wrong?'
    ],
    resolution_preferences: [
      'detailed_step_by_step_guidance',
      'written_instructions',
      'patient_explanation',
      'security_reassurance'
    ],
    escalation_likelihood: 0.1,
    satisfaction_factors: [
      'patient_service',
      'thorough_explanations',
      'feeling_respected',
      'learning_something_new'
    ],
    memory_patterns: {
      name_retention: 'excellent',
      detail_retention: 'high',
      relationship_building: true,
      previous_interaction_references: true,
      gratitude_expression: 'frequent',
      personal_sharing: 'open'
    },
    cultural_considerations: [
      'generational_technology_gap',
      'formal_communication_preference',
      'security_consciousness'
    ]
  },

  new_employee: {
    id: 'new_employee',
    name: 'Sam Patel',
    title: 'Junior Analyst',
    background: 'Recent graduate, eager to learn but uncertain about company systems',
    age_range: '22-28',
    role: 'new_hire',
    company_type: 'corporate',
    personality: {
      communication: {
        style: 'questioning',
        pace: 'moderate',
        verbosity: 'moderate',
        interruption: 'rarely',
        clarification: 'asks_questions'
      },
      technicalLevel: {
        level: 'intermediate',
        areas: ['modern_software', 'mobile_technology', 'cloud_services', 'social_platforms'],
        vocabulary: {
          preferred: ['app', 'cloud', 'sync', 'account', 'platform'],
          avoided: ['legacy_terms', 'company_specific_jargon'],
          confused_by: ['corporate_systems', 'policies', 'procedures'],
          comfortable_with: ['modern_interfaces', 'intuitive_design', 'help_documentation']
        },
        learningStyle: 'hands_on',
        frustrationTriggers: ['outdated_systems', 'unclear_policies', 'lack_of_guidance']
      },
      emotionalRange: {
        baseline: 'neutral',
        positive_triggers: ['learning_opportunities', 'clear_guidance', 'encouragement'],
        negative_triggers: ['criticism', 'assumptions_of_knowledge', 'unclear_expectations'],
        escalation_threshold: 6,
        de_escalation_factors: ['reassurance', 'learning_focus', 'patience'],
        mood_recovery_time: 3
      },
      patience: 'high',
      formality: 'professional',
      curiosity: 'very_high',
      confidence: 'uncertain'
    },
    typical_issues: [
      'account_setup_and_permissions',
      'software_access_requests',
      'company_system_navigation',
      'security_protocol_questions',
      'workflow_integration_help',
      'tool_training_requests'
    ],
    behavioral_patterns: {
      greeting_style: ['Hi, I\'m new here and need help with...', 'Hello, I\'m still learning the system...', 'Excuse me, could you help me understand...'],
      problem_description: 'detailed',
      follow_up_behavior: 'grateful',
      multitasking_tendency: true,
      phone_vs_email_preference: 'chat',
      after_hours_expectations: false,
      documentation_reading: 'always'
    },
    conversation_starters: [
      'I just started and I\'m not sure how to access the project files',
      'I need to set up my development environment but I\'m missing permissions',
      'Could you help me understand the company\'s security policies?',
      'I\'m trying to connect to the VPN but I think I\'m doing something wrong'
    ],
    resolution_preferences: [
      'learning_oriented_explanations',
      'documentation_references',
      'best_practice_guidance',
      'mentor_connection'
    ],
    escalation_likelihood: 0.2,
    satisfaction_factors: [
      'learning_value',
      'patient_teaching',
      'comprehensive_explanation',
      'future_self_sufficiency'
    ],
    memory_patterns: {
      name_retention: 'good',
      detail_retention: 'high',
      relationship_building: true,
      previous_interaction_references: true,
      gratitude_expression: 'frequent',
      personal_sharing: 'professional_only'
    },
    cultural_considerations: [
      'learning_curve_understanding',
      'professional_development_focus',
      'mentorship_appreciation'
    ]
  },

  executive: {
    id: 'executive',
    name: 'Robin Davis',
    title: 'VP of Operations',
    background: 'Senior leadership role, time-sensitive needs, business impact focus',
    age_range: '40-55',
    role: 'executive',
    company_type: 'enterprise',
    personality: {
      communication: {
        style: 'direct',
        pace: 'fast',
        verbosity: 'brief',
        interruption: 'occasionally',
        clarification: 'assumes_understanding'
      },
      technicalLevel: {
        level: 'intermediate',
        areas: ['business_applications', 'mobile_devices', 'video_conferencing', 'cloud_services'],
        vocabulary: {
          preferred: ['business_impact', 'solution', 'timeline', 'escalation'],
          avoided: ['technical_details', 'step_by_step_procedures'],
          confused_by: ['implementation_details', 'technical_specifications'],
          comfortable_with: ['high_level_concepts', 'business_terminology', 'strategic_outcomes']
        },
        learningStyle: 'conceptual',
        frustrationTriggers: ['detailed_explanations', 'slow_resolution', 'system_limitations']
      },
      emotionalRange: {
        baseline: 'neutral',
        positive_triggers: ['quick_resolution', 'proactive_service', 'business_understanding'],
        negative_triggers: ['delays', 'excuses', 'technical_details'],
        escalation_threshold: 5,
        de_escalation_factors: ['immediate_action', 'senior_escalation', 'business_solutions'],
        mood_recovery_time: 8
      },
      patience: 'low',
      formality: 'professional',
      curiosity: 'moderate',
      confidence: 'assertive'
    },
    typical_issues: [
      'mobile_device_integration',
      'video_conferencing_problems',
      'email_server_issues',
      'system_performance_concerns',
      'security_incident_response',
      'business_continuity_planning'
    ],
    behavioral_patterns: {
      greeting_style: ['I need this resolved immediately', 'This is impacting business operations', 'Get me someone who can fix this now'],
      problem_description: 'technical',
      follow_up_behavior: 'persistent',
      multitasking_tendency: true,
      phone_vs_email_preference: 'phone',
      after_hours_expectations: true,
      documentation_reading: 'rarely'
    },
    conversation_starters: [
      'Our video conference system failed during a client presentation',
      'I can\'t access critical files from my mobile device',
      'The email server is down and it\'s affecting the entire team',
      'We need an immediate solution to this network issue'
    ],
    resolution_preferences: [
      'immediate_escalation',
      'senior_technical_resource',
      'business_impact_mitigation',
      'preventive_measures'
    ],
    escalation_likelihood: 0.7,
    satisfaction_factors: [
      'rapid_response',
      'business_continuity',
      'senior_level_attention',
      'proactive_prevention'
    ],
    memory_patterns: {
      name_retention: 'good',
      detail_retention: 'moderate',
      relationship_building: true,
      previous_interaction_references: true,
      gratitude_expression: 'occasional',
      personal_sharing: 'professional_only'
    },
    cultural_considerations: [
      'executive_time_value',
      'business_impact_focus',
      'authority_respect'
    ]
  }
};

// Persona utilities and helper functions
export const getPersonaById = (id: string): CustomerPersona | undefined => {
  return CUSTOMER_PERSONAS[id];
};

export const getAllPersonas = (): CustomerPersona[] => {
  return Object.values(CUSTOMER_PERSONAS);
};

export const getPersonasByRole = (role: string): CustomerPersona[] => {
  return Object.values(CUSTOMER_PERSONAS).filter(persona => persona.role === role);
};

export const getPersonasByTechnicalLevel = (level: 'novice' | 'intermediate' | 'advanced'): CustomerPersona[] => {
  return Object.values(CUSTOMER_PERSONAS).filter(persona => persona.personality.technicalLevel.level === level);
};

export const getPersonasByEscalationRisk = (threshold: number): CustomerPersona[] => {
  return Object.values(CUSTOMER_PERSONAS).filter(persona => persona.escalation_likelihood >= threshold);
};

export const getRandomPersona = (): CustomerPersona => {
  const personas = Object.values(CUSTOMER_PERSONAS);
  const randomIndex = Math.floor(Math.random() * personas.length);
  return personas[randomIndex];
};

export const getPersonaWeights = (): Record<string, number> => {
  return {
    office_worker: 0.3,     // Most common
    frustrated_user: 0.2,   // Common but challenging
    patient_retiree: 0.2,   // Good for learning patience
    new_employee: 0.2,      // Learning-focused scenarios
    executive: 0.1          // Less common but high impact
  };
};

export default CUSTOMER_PERSONAS;