import { logger } from '../utils/logger';

interface ProfessionalTerminology {
  competency: string;
  professionalTerm: string;
  industryContext: string;
  employerRelevance: string;
  careerProgression: string;
}

interface CareerDevelopmentLanguage {
  skillLevel: 'entry' | 'intermediate' | 'advanced' | 'expert';
  competencyArea: string;
  professionalDescription: string;
  industryStandards: string[];
  marketValue: string;
  advancementPath: string;
}

interface EmployerSuitablePresentation {
  executiveSummary: string;
  coreCompetencies: string[];
  professionalAchievements: string[];
  industryAlignment: string;
  readinessAssessment: string;
  recommendedPositions: string[];
}

interface ProfessionalFeedbackLanguage {
  observation: string;
  assessment: string;
  recommendation: string;
  industryContext: string;
  careerImplication: string;
}

class ProfessionalLanguageEngine {
  private competencyTerminology = {
    technical: {
      accuracy: {
        professional: 'Technical Problem Resolution Accuracy',
        industry: 'Systematic troubleshooting methodology with verified solution effectiveness',
        employer: 'Demonstrates ability to diagnose and resolve technical issues accurately',
        career: 'Foundation for technical leadership and specialized IT roles'
      },
      efficiency: {
        professional: 'Solution Implementation Efficiency',
        industry: 'Optimized resource utilization and time-to-resolution performance',
        employer: 'Shows capability to manage technical workload effectively',
        career: 'Critical for productivity expectations in professional environments'
      },
      knowledge: {
        professional: 'Technical Knowledge Application',
        industry: 'Knowledge base utilization and information synthesis capability',
        employer: 'Indicates capacity for independent technical problem-solving',
        career: 'Prerequisite for advancement to senior technical positions'
      },
      innovation: {
        professional: 'Technical Innovation and Process Improvement',
        industry: 'Creative problem-solving and continuous improvement mindset',
        employer: 'Demonstrates potential for process optimization and innovation',
        career: 'Differentiator for leadership and specialized technical roles'
      }
    },
    communication: {
      clarity: {
        professional: 'Professional Communication Effectiveness',
        industry: 'Clear, concise technical communication to diverse audiences',
        employer: 'Essential for customer-facing roles and team collaboration',
        career: 'Foundation for client relationship management and leadership'
      },
      empathy: {
        professional: 'Customer Relationship Management',
        industry: 'Emotional intelligence and customer experience optimization',
        employer: 'Critical for customer satisfaction and retention',
        career: 'Key competency for customer success and management roles'
      },
      responsiveness: {
        professional: 'Stakeholder Engagement and Responsiveness',
        industry: 'Timely communication and proactive customer interaction',
        employer: 'Demonstrates professional reliability and customer focus',
        career: 'Essential for customer-centric and service delivery roles'
      },
      documentation: {
        professional: 'Professional Documentation and Record-Keeping',
        industry: 'Knowledge management and compliance documentation standards',
        employer: 'Ensures knowledge transfer and regulatory compliance',
        career: 'Required for audit, compliance, and knowledge management roles'
      }
    },
    procedural: {
      compliance: {
        professional: 'Process Adherence and Quality Assurance',
        industry: 'Systematic process following and quality standard maintenance',
        employer: 'Ensures consistent service delivery and risk management',
        career: 'Foundation for quality assurance and process management roles'
      },
      security: {
        professional: 'Information Security and Risk Management',
        industry: 'Security protocol compliance and risk mitigation practices',
        employer: 'Critical for organizational security and compliance',
        career: 'Pathway to cybersecurity and risk management specializations'
      },
      escalation: {
        professional: 'Issue Escalation and Decision Making',
        industry: 'Professional judgment and appropriate escalation protocols',
        employer: 'Demonstrates sound professional judgment and accountability',
        career: 'Essential for supervisory and management responsibilities'
      }
    },
    customerService: {
      satisfaction: {
        professional: 'Customer Satisfaction and Experience Management',
        industry: 'Customer experience optimization and satisfaction delivery',
        employer: 'Directly impacts business outcomes and customer retention',
        career: 'Critical for customer success and business development roles'
      },
      relationship: {
        professional: 'Stakeholder Relationship Development',
        industry: 'Long-term relationship building and trust establishment',
        employer: 'Creates business value through relationship capital',
        career: 'Foundation for account management and business development'
      },
      professionalism: {
        professional: 'Professional Service Delivery Standards',
        industry: 'Consistent professional behavior and service excellence',
        employer: 'Represents organizational brand and professional standards',
        career: 'Required for client-facing and leadership positions'
      }
    },
    problemSolving: {
      approach: {
        professional: 'Analytical Problem-Solving Methodology',
        industry: 'Structured analytical thinking and solution development',
        employer: 'Demonstrates capability for complex problem resolution',
        career: 'Essential for consulting, analysis, and strategic roles'
      },
      creativity: {
        professional: 'Innovation and Creative Solution Development',
        industry: 'Creative thinking and alternative solution generation',
        employer: 'Indicates potential for innovation and process improvement',
        career: 'Differentiator for innovation and strategic development roles'
      },
      thoroughness: {
        professional: 'Comprehensive Analysis and Solution Validation',
        industry: 'Detailed investigation and solution verification practices',
        employer: 'Ensures solution quality and risk mitigation',
        career: 'Required for audit, analysis, and quality assurance roles'
      }
    }
  };

  private industryStandardFrameworks = {
    itil: {
      name: 'ITIL (Information Technology Infrastructure Library)',
      relevance: 'Global standard for IT service management',
      competencies: ['incident management', 'problem management', 'change management', 'service desk operations']
    },
    cobit: {
      name: 'COBIT (Control Objectives for Information and Related Technologies)',
      relevance: 'Framework for IT governance and management',
      competencies: ['IT governance', 'risk management', 'compliance management']
    },
    iso20000: {
      name: 'ISO/IEC 20000 IT Service Management',
      relevance: 'International standard for IT service management systems',
      competencies: ['service management', 'process improvement', 'quality assurance']
    },
    customerService: {
      name: 'Customer Service Excellence Standards',
      relevance: 'Industry benchmarks for customer service quality',
      competencies: ['customer satisfaction', 'service delivery', 'relationship management']
    }
  };

  private careerProgressionFramework = {
    entryLevel: {
      titles: ['IT Support Technician', 'Help Desk Analyst', 'Technical Support Representative'],
      requirements: ['Basic technical competency', 'Professional communication skills', 'Customer service orientation'],
      salaryRange: '$35,000 - $45,000',
      advancement: 'Focus on developing technical accuracy and customer service excellence'
    },
    intermediate: {
      titles: ['Senior IT Support Specialist', 'Technical Analyst', 'Systems Support Analyst'],
      requirements: ['Advanced technical skills', 'Process optimization capability', 'Mentoring abilities'],
      salaryRange: '$45,000 - $65,000',
      advancement: 'Build leadership skills and specialized technical expertise'
    },
    advanced: {
      titles: ['IT Support Team Lead', 'Technical Consultant', 'Systems Administrator'],
      requirements: ['Technical expertise', 'Leadership capability', 'Strategic thinking'],
      salaryRange: '$65,000 - $85,000',
      advancement: 'Develop management skills and strategic technology expertise'
    },
    expert: {
      titles: ['IT Manager', 'Technical Architect', 'Principal Consultant'],
      requirements: ['Strategic leadership', 'Technical mastery', 'Business acumen'],
      salaryRange: '$85,000 - $120,000+',
      advancement: 'Focus on executive leadership and strategic technology direction'
    }
  };

  /**
   * Convert technical feedback into professional language
   */
  async convertToProfessionalLanguage(feedbackData: any, context: any): Promise<ProfessionalFeedbackLanguage[]> {
    try {
      logger.info('Converting feedback to professional language');

      const professionalFeedback: ProfessionalFeedbackLanguage[] = [];

      // Process each competency area
      Object.entries(feedbackData.dimensions || {}).forEach(([dimension, dimensionData]: [string, any]) => {
        if (typeof dimensionData === 'object' && dimensionData !== null) {
          Object.entries(dimensionData).forEach(([competency, score]: [string, any]) => {
            const competencyScore = typeof score === 'number' ? score : score?.value || 0;
            const professionalFeedback_item = this.generateProfessionalFeedback(dimension, competency, competencyScore);
            professionalFeedback.push(professionalFeedback_item);
          });
        }
      });

      return professionalFeedback;
    } catch (error) {
      logger.error('Error converting to professional language:', error);
      throw new Error('Failed to convert to professional language');
    }
  }

  /**
   * Generate career development terminology
   */
  async generateCareerDevelopmentLanguage(performanceData: any): Promise<CareerDevelopmentLanguage[]> {
    try {
      const careerLanguage: CareerDevelopmentLanguage[] = [];
      const dimensions = performanceData.dimensions || {};

      Object.entries(dimensions).forEach(([dimension, dimensionData]: [string, any]) => {
        const overallScore = this.calculateDimensionOverallScore(dimensionData);
        const skillLevel = this.determineSkillLevel(overallScore);

        careerLanguage.push({
          skillLevel,
          competencyArea: this.getCompetencyAreaName(dimension),
          professionalDescription: this.generateProfessionalDescription(dimension, overallScore),
          industryStandards: this.getRelevantIndustryStandards(dimension),
          marketValue: this.assessMarketValue(dimension, overallScore),
          advancementPath: this.generateAdvancementPath(dimension, skillLevel)
        });
      });

      return careerLanguage;
    } catch (error) {
      logger.error('Error generating career development language:', error);
      throw new Error('Failed to generate career development language');
    }
  }

  /**
   * Create employer-suitable feedback presentation
   */
  async createEmployerSuitablePresentation(performanceData: any, achievements: any[], context: any): Promise<EmployerSuitablePresentation> {
    try {
      const overallScore = performanceData.overall || 0;

      const presentation: EmployerSuitablePresentation = {
        executiveSummary: this.generateExecutiveSummary(performanceData),
        coreCompetencies: this.identifyCoreCompetencies(performanceData),
        professionalAchievements: this.formatProfessionalAchievements(achievements),
        industryAlignment: this.assessIndustryAlignment(performanceData),
        readinessAssessment: this.generateReadinessAssessment(overallScore),
        recommendedPositions: this.recommendPositions(performanceData)
      };

      return presentation;
    } catch (error) {
      logger.error('Error creating employer-suitable presentation:', error);
      throw new Error('Failed to create employer-suitable presentation');
    }
  }

  /**
   * Generate industry-standard feedback formats
   */
  async generateIndustryStandardFormat(performanceData: any): Promise<any> {
    try {
      return {
        competencyAssessment: this.generateCompetencyAssessment(performanceData),
        professionalSummary: this.generateProfessionalSummary(performanceData),
        skillValidation: this.generateSkillValidation(performanceData),
        developmentPlan: this.generateDevelopmentPlan(performanceData),
        certificationReadiness: this.assessCertificationReadiness(performanceData)
      };
    } catch (error) {
      logger.error('Error generating industry standard format:', error);
      throw new Error('Failed to generate industry standard format');
    }
  }

  /**
   * Create professional growth communication
   */
  async createProfessionalGrowthCommunication(performanceData: any, progressHistory: any[]): Promise<any> {
    try {
      return {
        performanceNarrative: this.generatePerformanceNarrative(performanceData),
        growthTrajectory: this.analyzeGrowthTrajectory(progressHistory),
        professionalReadiness: this.assessProfessionalReadiness(performanceData),
        careerPathGuidance: this.generateCareerPathGuidance(performanceData),
        stakeholderCommunication: this.generateStakeholderCommunication(performanceData)
      };
    } catch (error) {
      logger.error('Error creating professional growth communication:', error);
      throw new Error('Failed to create professional growth communication');
    }
  }

  // Private helper methods

  private generateProfessionalFeedback(dimension: string, competency: string, score: number): ProfessionalFeedbackLanguage {
    const terminology = this.competencyTerminology[dimension as keyof typeof this.competencyTerminology];
    const competencyInfo = terminology?.[competency as keyof typeof terminology];

    if (!competencyInfo) {
      return this.generateGenericProfessionalFeedback(dimension, competency, score);
    }

    let observation: string;
    let assessment: string;
    let recommendation: string;

    if (score >= 85) {
      observation = `Demonstrates exceptional proficiency in ${competencyInfo.professional.toLowerCase()}`;
      assessment = `Performance exceeds industry benchmarks and aligns with senior professional standards`;
      recommendation = `Continue leveraging this strength while exploring advanced applications and leadership opportunities`;
    } else if (score >= 75) {
      observation = `Shows strong competency in ${competencyInfo.professional.toLowerCase()}`;
      assessment = `Performance meets professional standards with potential for optimization`;
      recommendation = `Focus on consistency and advanced technique development to achieve excellence level`;
    } else if (score >= 65) {
      observation = `Displays developing capability in ${competencyInfo.professional.toLowerCase()}`;
      assessment = `Performance approaches professional standards but requires continued development`;
      recommendation = `Implement focused training and practice to reach professional competency benchmarks`;
    } else {
      observation = `Shows foundational understanding of ${competencyInfo.professional.toLowerCase()}`;
      assessment = `Performance below professional standards requiring intensive development`;
      recommendation = `Prioritize comprehensive training and mentorship to build professional-level competency`;
    }

    return {
      observation,
      assessment,
      recommendation,
      industryContext: competencyInfo.industry,
      careerImplication: competencyInfo.career
    };
  }

  private generateGenericProfessionalFeedback(dimension: string, competency: string, score: number): ProfessionalFeedbackLanguage {
    return {
      observation: `Demonstrates ${score >= 75 ? 'proficient' : 'developing'} capability in ${competency}`,
      assessment: `Performance ${score >= 75 ? 'meets' : 'approaches'} professional standards`,
      recommendation: score >= 75 ? 'Continue building on this competency' : 'Focus on developing this area',
      industryContext: `${competency} is recognized as important for professional IT support roles`,
      careerImplication: `This competency contributes to overall professional readiness and career advancement`
    };
  }

  private calculateDimensionOverallScore(dimensionData: any): number {
    if (typeof dimensionData === 'number') {
      return dimensionData;
    }

    if (typeof dimensionData === 'object' && dimensionData !== null) {
      const scores = Object.values(dimensionData).filter(val => typeof val === 'number') as number[];
      return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    }

    return 0;
  }

  private determineSkillLevel(score: number): 'entry' | 'intermediate' | 'advanced' | 'expert' {
    if (score >= 90) return 'expert';
    if (score >= 80) return 'advanced';
    if (score >= 70) return 'intermediate';
    return 'entry';
  }

  private getCompetencyAreaName(dimension: string): string {
    const names = {
      technical: 'Technical Problem Resolution',
      communication: 'Professional Communication',
      procedural: 'Process Management and Compliance',
      customerService: 'Customer Experience Management',
      problemSolving: 'Analytical Problem-Solving'
    };

    return names[dimension as keyof typeof names] || dimension;
  }

  private generateProfessionalDescription(dimension: string, score: number): string {
    const level = this.determineSkillLevel(score);
    const competencyArea = this.getCompetencyAreaName(dimension);

    const descriptions = {
      expert: `Demonstrates mastery-level expertise in ${competencyArea} with capability to lead, mentor, and drive innovation`,
      advanced: `Shows advanced proficiency in ${competencyArea} with ability to handle complex challenges independently`,
      intermediate: `Displays solid competency in ${competencyArea} suitable for standard professional responsibilities`,
      entry: `Shows developing capability in ${competencyArea} with potential for professional growth`
    };

    return descriptions[level];
  }

  private getRelevantIndustryStandards(dimension: string): string[] {
    const standardMap = {
      technical: ['ITIL Incident Management', 'CompTIA A+ Technical Standards', 'ISO/IEC 20000 Service Management'],
      communication: ['Customer Service Excellence Standards', 'Professional Communication Frameworks', 'ITIL Service Desk Standards'],
      procedural: ['ITIL Process Management', 'ISO/IEC 20000 Quality Management', 'COBIT Governance Framework'],
      customerService: ['Customer Experience Management Standards', 'Service Excellence Frameworks', 'Customer Satisfaction Metrics'],
      problemSolving: ['Root Cause Analysis Methodologies', 'Systematic Problem-Solving Frameworks', 'Continuous Improvement Standards']
    };

    return standardMap[dimension as keyof typeof standardMap] || ['Industry Best Practices'];
  }

  private assessMarketValue(dimension: string, score: number): string {
    const level = this.determineSkillLevel(score);
    const competencyArea = this.getCompetencyAreaName(dimension);

    const valueAssessments = {
      expert: `${competencyArea} expertise at this level commands premium compensation and leadership opportunities`,
      advanced: `Advanced ${competencyArea} skills provide competitive advantage in the job market`,
      intermediate: `Solid ${competencyArea} competency meets standard market expectations`,
      entry: `Developing ${competencyArea} skills provide foundation for entry-level opportunities`
    };

    return valueAssessments[level];
  }

  private generateAdvancementPath(dimension: string, skillLevel: 'entry' | 'intermediate' | 'advanced' | 'expert'): string {
    const pathMap = {
      technical: {
        entry: 'Build technical accuracy and knowledge application → Intermediate Technical Specialist',
        intermediate: 'Develop advanced troubleshooting and innovation → Senior Technical Analyst',
        advanced: 'Master technical leadership and architecture → Technical Lead/Architect',
        expert: 'Drive technical strategy and innovation → CTO/Technical Director'
      },
      communication: {
        entry: 'Improve clarity and customer service → Customer Success Representative',
        intermediate: 'Develop advanced relationship management → Account Manager',
        advanced: 'Master stakeholder communication → Business Relationship Manager',
        expert: 'Lead organizational communication strategy → Chief Customer Officer'
      },
      procedural: {
        entry: 'Master process compliance → Process Specialist',
        intermediate: 'Develop quality management expertise → Quality Assurance Manager',
        advanced: 'Lead process optimization initiatives → Process Improvement Director',
        expert: 'Drive organizational excellence → Chief Operating Officer'
      }
    };

    const dimensionPaths = pathMap[dimension as keyof typeof pathMap];
    return dimensionPaths?.[skillLevel] || 'Continue developing skills for career advancement';
  }

  private generateExecutiveSummary(performanceData: any): string {
    const overallScore = performanceData.overall || 0;
    const dimensions = performanceData.dimensions || {};

    // Identify top competencies
    const topCompetencies = Object.entries(dimensions)
      .map(([dim, score]: [string, any]) => ({
        dimension: dim,
        score: typeof score === 'number' ? score : this.calculateDimensionOverallScore(score)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    let summary = '';

    if (overallScore >= 85) {
      summary = 'Exceptional IT support professional demonstrating mastery-level competency across multiple dimensions. ';
    } else if (overallScore >= 75) {
      summary = 'Competent IT support professional with solid skills meeting industry standards. ';
    } else if (overallScore >= 65) {
      summary = 'Developing IT support professional showing meaningful progress toward competency. ';
    } else {
      summary = 'Entry-level IT support candidate with foundational skills and growth potential. ';
    }

    if (topCompetencies.length > 0) {
      const topCompetencyNames = topCompetencies.map(tc => this.getCompetencyAreaName(tc.dimension));
      summary += `Particular strengths in ${topCompetencyNames.slice(0, 2).join(' and ')}. `;
    }

    summary += `Performance assessment based on industry-standard competency frameworks and professional benchmarks.`;

    return summary;
  }

  private identifyCoreCompetencies(performanceData: any): string[] {
    const dimensions = performanceData.dimensions || {};
    const competencies: string[] = [];

    Object.entries(dimensions).forEach(([dimension, dimensionData]: [string, any]) => {
      const score = typeof dimensionData === 'number' ? dimensionData : this.calculateDimensionOverallScore(dimensionData);
      
      if (score >= 75) {
        const competencyName = this.getCompetencyAreaName(dimension);
        const proficiencyLevel = this.determineSkillLevel(score);
        competencies.push(`${competencyName} (${proficiencyLevel} level)`);
      }
    });

    // Add specific sub-competencies for high performers
    if (typeof dimensions.technical === 'object') {
      if (dimensions.technical.accuracy >= 85) {
        competencies.push('Advanced Technical Troubleshooting');
      }
      if (dimensions.technical.innovation >= 80) {
        competencies.push('Technical Innovation and Process Improvement');
      }
    }

    if (typeof dimensions.communication === 'object') {
      if (dimensions.communication.clarity >= 85) {
        competencies.push('Professional Communication Excellence');
      }
      if (dimensions.communication.empathy >= 80) {
        competencies.push('Customer Relationship Management');
      }
    }

    return competencies;
  }

  private formatProfessionalAchievements(achievements: any[]): string[] {
    return achievements.map(achievement => {
      const level = achievement.level.charAt(0).toUpperCase() + achievement.level.slice(1);
      return `${achievement.title} - ${achievement.description} (${level} Level Achievement)`;
    });
  }

  private assessIndustryAlignment(performanceData: any): string {
    const overallScore = performanceData.overall || 0;

    if (overallScore >= 85) {
      return 'Performance exceeds industry benchmarks and aligns with senior professional standards. Ready for advanced roles and leadership opportunities.';
    } else if (overallScore >= 75) {
      return 'Performance meets industry standards and professional expectations. Suitable for standard IT support roles with growth potential.';
    } else if (overallScore >= 65) {
      return 'Performance approaches industry standards. Suitable for entry-level roles with continued professional development.';
    } else {
      return 'Performance below industry standards. Requires focused development before professional role readiness.';
    }
  }

  private generateReadinessAssessment(score: number): string {
    const skillLevel = this.determineSkillLevel(score);
    const careerInfo = this.careerProgressionFramework[skillLevel];

    return `Professional readiness for ${careerInfo.titles.join(', ')} positions. ${careerInfo.advancement}. Estimated market value: ${careerInfo.salaryRange}.`;
  }

  private recommendPositions(performanceData: any): string[] {
    const overallScore = performanceData.overall || 0;
    const skillLevel = this.determineSkillLevel(overallScore);
    
    const positions = [...this.careerProgressionFramework[skillLevel].titles];

    // Add specialized recommendations based on strengths
    const dimensions = performanceData.dimensions || {};
    
    if (dimensions.technical?.innovation >= 85) {
      positions.push('Technical Innovation Specialist', 'Process Improvement Analyst');
    }
    
    if (dimensions.communication?.clarity >= 85) {
      positions.push('Customer Success Manager', 'Technical Communication Specialist');
    }
    
    if (dimensions.procedural?.compliance >= 90) {
      positions.push('Quality Assurance Specialist', 'Compliance Analyst');
    }

    return [...new Set(positions)]; // Remove duplicates
  }

  private generateCompetencyAssessment(performanceData: any): any {
    const dimensions = performanceData.dimensions || {};
    
    return Object.entries(dimensions).map(([dimension, dimensionData]) => ({
      competencyArea: this.getCompetencyAreaName(dimension),
      proficiencyLevel: this.determineSkillLevel(this.calculateDimensionOverallScore(dimensionData)),
      industryAlignment: this.getRelevantIndustryStandards(dimension),
      professionalValue: this.assessMarketValue(dimension, this.calculateDimensionOverallScore(dimensionData))
    }));
  }

  private generateProfessionalSummary(performanceData: any): string {
    const overallScore = performanceData.overall || 0;
    const competencyCount = Object.keys(performanceData.dimensions || {}).length;
    
    return `Professional competency assessment across ${competencyCount} core areas demonstrates ${overallScore >= 75 ? 'professional-level' : 'developing'} capability suitable for ${overallScore >= 85 ? 'advanced' : overallScore >= 75 ? 'standard' : 'entry-level'} IT support positions. Assessment based on industry-standard frameworks and professional benchmarks.`;
  }

  private generateSkillValidation(performanceData: any): any {
    const validations = [];
    const dimensions = performanceData.dimensions || {};

    Object.entries(dimensions).forEach(([dimension, dimensionData]) => {
      const score = this.calculateDimensionOverallScore(dimensionData);
      validations.push({
        skill: this.getCompetencyAreaName(dimension),
        validated: score >= 70,
        proficiencyLevel: this.determineSkillLevel(score),
        industryStandard: score >= 75 ? 'Meets' : 'Approaching',
        marketReady: score >= 70
      });
    });

    return validations;
  }

  private generateDevelopmentPlan(performanceData: any): any {
    const dimensions = performanceData.dimensions || {};
    const developmentAreas = [];

    Object.entries(dimensions).forEach(([dimension, dimensionData]) => {
      const score = this.calculateDimensionOverallScore(dimensionData);
      if (score < 80) {
        developmentAreas.push({
          competencyArea: this.getCompetencyAreaName(dimension),
          currentLevel: this.determineSkillLevel(score),
          targetLevel: score < 70 ? 'intermediate' : 'advanced',
          developmentPriority: score < 60 ? 'high' : score < 75 ? 'medium' : 'low',
          recommendedActions: this.generateDevelopmentActions(dimension, score)
        });
      }
    });

    return developmentAreas;
  }

  private generateDevelopmentActions(dimension: string, score: number): string[] {
    const actionMap = {
      technical: [
        'Complete advanced troubleshooting training',
        'Practice complex technical scenarios',
        'Pursue technical certifications',
        'Develop specialized technical expertise'
      ],
      communication: [
        'Enhance professional communication skills',
        'Practice customer interaction scenarios',
        'Develop presentation and documentation skills',
        'Build emotional intelligence capabilities'
      ],
      procedural: [
        'Master industry-standard processes',
        'Develop quality management skills',
        'Practice compliance procedures',
        'Learn process improvement methodologies'
      ]
    };

    return actionMap[dimension as keyof typeof actionMap] || ['Focus on skill development in this area'];
  }

  private assessCertificationReadiness(performanceData: any): any {
    const dimensions = performanceData.dimensions || {};
    const certificationAssessments = [];

    Object.entries(dimensions).forEach(([dimension, dimensionData]) => {
      const score = this.calculateDimensionOverallScore(dimensionData);
      
      let certifications: string[] = [];
      let readiness: string = '';

      if (dimension === 'technical') {
        certifications = ['CompTIA A+', 'CompTIA Network+', 'Microsoft Certified: Azure Fundamentals'];
        readiness = score >= 80 ? 'Ready' : score >= 70 ? 'Nearly Ready' : 'Needs Preparation';
      } else if (dimension === 'procedural') {
        certifications = ['ITIL Foundation', 'ISO/IEC 20000 Foundation'];
        readiness = score >= 85 ? 'Ready' : score >= 75 ? 'Nearly Ready' : 'Needs Preparation';
      } else if (dimension === 'communication' || dimension === 'customerService') {
        certifications = ['Customer Service Excellence', 'Professional Communication'];
        readiness = score >= 80 ? 'Ready' : score >= 70 ? 'Nearly Ready' : 'Needs Preparation';
      }

      if (certifications.length > 0) {
        certificationAssessments.push({
          competencyArea: this.getCompetencyAreaName(dimension),
          recommendedCertifications: certifications,
          readinessLevel: readiness,
          preparationTime: readiness === 'Ready' ? '1-2 months' : readiness === 'Nearly Ready' ? '2-4 months' : '4-6 months'
        });
      }
    });

    return certificationAssessments;
  }

  private generatePerformanceNarrative(performanceData: any): string {
    const overallScore = performanceData.overall || 0;
    const dimensions = performanceData.dimensions || {};

    let narrative = `This professional assessment evaluates competency across ${Object.keys(dimensions).length} core areas of IT support excellence. `;

    if (overallScore >= 85) {
      narrative += 'Performance demonstrates exceptional professional capability exceeding industry benchmarks. ';
    } else if (overallScore >= 75) {
      narrative += 'Performance shows solid professional competency meeting industry standards. ';
    } else {
      narrative += 'Performance indicates developing professional capability with clear growth trajectory. ';
    }

    // Add dimension-specific insights
    const strongAreas = Object.entries(dimensions)
      .filter(([_, score]: [string, any]) => this.calculateDimensionOverallScore(score) >= 80)
      .map(([dim, _]) => this.getCompetencyAreaName(dim));

    if (strongAreas.length > 0) {
      narrative += `Particular excellence demonstrated in ${strongAreas.join(', ')}. `;
    }

    narrative += 'Assessment methodology aligns with industry-standard competency frameworks and professional benchmarks.';

    return narrative;
  }

  private analyzeGrowthTrajectory(progressHistory: any[]): string {
    if (progressHistory.length < 2) {
      return 'Insufficient historical data to establish growth trajectory';
    }

    const firstScore = progressHistory[0].overall || 0;
    const lastScore = progressHistory[progressHistory.length - 1].overall || 0;
    const improvement = lastScore - firstScore;
    const improvementPercent = (improvement / firstScore) * 100;

    if (improvementPercent >= 20) {
      return `Exceptional growth trajectory with ${Math.round(improvementPercent)}% improvement demonstrating strong professional development potential`;
    } else if (improvementPercent >= 10) {
      return `Positive growth trajectory with ${Math.round(improvementPercent)}% improvement showing consistent professional development`;
    } else if (improvementPercent >= 0) {
      return `Stable performance with ${Math.round(improvementPercent)}% improvement indicating professional consistency`;
    } else {
      return `Performance variation of ${Math.round(Math.abs(improvementPercent))}% suggests need for consistency focus`;
    }
  }

  private assessProfessionalReadiness(performanceData: any): string {
    const overallScore = performanceData.overall || 0;
    const skillLevel = this.determineSkillLevel(overallScore);
    const careerInfo = this.careerProgressionFramework[skillLevel];

    return `Professional readiness assessment indicates suitability for ${careerInfo.titles.join(' or ')} positions. Market positioning aligns with ${careerInfo.salaryRange} compensation range. ${careerInfo.advancement}`;
  }

  private generateCareerPathGuidance(performanceData: any): string {
    const dimensions = performanceData.dimensions || {};
    const overallScore = performanceData.overall || 0;

    // Identify strongest dimension for specialization guidance
    const strongestDimension = Object.entries(dimensions)
      .map(([dim, score]: [string, any]) => ({
        dimension: dim,
        score: this.calculateDimensionOverallScore(score)
      }))
      .sort((a, b) => b.score - a.score)[0];

    let guidance = '';

    if (overallScore >= 85) {
      guidance = 'Career pathway indicates readiness for leadership and specialized roles. ';
    } else if (overallScore >= 75) {
      guidance = 'Career trajectory shows potential for advancement to senior positions. ';
    } else {
      guidance = 'Career development path focuses on building foundational competencies. ';
    }

    if (strongestDimension && strongestDimension.score >= 80) {
      const specializationPath = this.generateAdvancementPath(strongestDimension.dimension, this.determineSkillLevel(strongestDimension.score));
      guidance += `Consider specialization path: ${specializationPath}`;
    }

    return guidance;
  }

  private generateStakeholderCommunication(performanceData: any): string {
    const overallScore = performanceData.overall || 0;

    if (overallScore >= 85) {
      return 'This individual demonstrates exceptional professional competency suitable for client-facing roles, leadership positions, and complex project responsibilities. Performance exceeds industry benchmarks and indicates strong potential for career advancement.';
    } else if (overallScore >= 75) {
      return 'This individual shows solid professional competency suitable for standard IT support roles with growth potential. Performance meets industry standards and employer expectations for professional service delivery.';
    } else if (overallScore >= 65) {
      return 'This individual demonstrates developing professional competency suitable for entry-level positions with mentorship and continued development. Shows commitment to professional growth and skill building.';
    } else {
      return 'This individual shows foundational understanding with potential for professional development. Requires focused training and mentorship to reach professional competency levels suitable for employment.';
    }
  }
}

export const professionalLanguageEngine = new ProfessionalLanguageEngine();