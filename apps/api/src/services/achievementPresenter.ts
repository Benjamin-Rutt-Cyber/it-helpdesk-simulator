import { 
  Achievement, 
  UserAchievement, 
  AchievementTier, 
  AchievementCategory,
  AchievementService 
} from './achievementService';

export interface PresentationFormat {
  format: 'card' | 'list' | 'portfolio' | 'resume' | 'certificate';
  includeEvidence: boolean;
  includeProgress: boolean;
  professionalStyle: boolean;
}

export interface PortfolioPresentation {
  achievements: FormattedAchievement[];
  summary: PortfolioSummary;
  professionalNarrative: string;
  recommendedForResume: string[];
  skillsMatrix: SkillsMatrix;
}

export interface FormattedAchievement {
  achievement: Achievement;
  userAchievement: UserAchievement;
  presentation: AchievementPresentation;
  portfolioWeight: number;
  recommendedUse: RecommendedUse;
}

export interface AchievementPresentation {
  title: string;
  subtitle: string;
  description: string;
  highlight: string;
  keyMetrics: KeyMetric[];
  professionalContext: string;
  evidenceSummary: string;
}

export interface KeyMetric {
  label: string;
  value: string;
  context: string;
  importance: 'high' | 'medium' | 'low';
}

export interface RecommendedUse {
  resume: boolean;
  linkedIn: boolean;
  interview: boolean;
  portfolio: boolean;
  networking: boolean;
  reasons: string[];
}

export interface PortfolioSummary {
  totalAchievements: number;
  topTier: AchievementTier;
  categoriesRepresented: number;
  professionalValue: number;
  standoutAchievements: string[];
  careerHighlights: string[];
}

export interface SkillsMatrix {
  technicalSkills: SkillCategory;
  customerService: SkillCategory;
  professionalBehavior: SkillCategory;
  leadership: SkillCategory;
  learning: SkillCategory;
}

export interface SkillCategory {
  skills: string[];
  proficiencyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  evidenceCount: number;
  achievements: string[];
  certificationAlignment: string[];
}

export class AchievementPresenter {
  /**
   * Format achievements for portfolio presentation
   */
  static async formatForPortfolio(
    userAchievements: UserAchievement[],
    format: PresentationFormat
  ): Promise<PortfolioPresentation> {
    const formattedAchievements = await this.formatAchievements(userAchievements, format);
    const summary = this.generatePortfolioSummary(formattedAchievements);
    const professionalNarrative = this.generateProfessionalNarrative(formattedAchievements);
    const recommendedForResume = this.getResumeRecommendations(formattedAchievements);
    const skillsMatrix = this.generateSkillsMatrix(formattedAchievements);

    return {
      achievements: formattedAchievements,
      summary,
      professionalNarrative,
      recommendedForResume,
      skillsMatrix
    };
  }

  /**
   * Format individual achievements
   */
  private static async formatAchievements(
    userAchievements: UserAchievement[],
    format: PresentationFormat
  ): Promise<FormattedAchievement[]> {
    const portfolioAchievements = AchievementService.getPortfolioAchievements(userAchievements);

    return portfolioAchievements.map(({ achievement, userAchievement, portfolioWeight }) => {
      const presentation = this.createAchievementPresentation(achievement, userAchievement, format);
      const recommendedUse = this.determineRecommendedUse(achievement, userAchievement);

      return {
        achievement,
        userAchievement,
        presentation,
        portfolioWeight,
        recommendedUse
      };
    });
  }

  /**
   * Create presentation for single achievement
   */
  private static createAchievementPresentation(
    achievement: Achievement,
    userAchievement: UserAchievement,
    format: PresentationFormat
  ): AchievementPresentation {
    const title = `${achievement.name} (${this.formatTier(userAchievement.tier)})`;
    const subtitle = this.getCategoryDisplayName(achievement.category);
    
    const description = format.professionalStyle 
      ? achievement.portfolioDescription 
      : achievement.description;

    const highlight = this.generateHighlight(achievement, userAchievement);
    const keyMetrics = this.extractKeyMetrics(achievement, userAchievement);
    const professionalContext = this.generateProfessionalContext(achievement, userAchievement);
    const evidenceSummary = format.includeEvidence 
      ? this.summarizeEvidence(userAchievement.evidence)
      : '';

    return {
      title,
      subtitle,
      description,
      highlight,
      keyMetrics,
      professionalContext,
      evidenceSummary
    };
  }

  /**
   * Generate achievement highlight
   */
  private static generateHighlight(achievement: Achievement, userAchievement: UserAchievement): string {
    const tierDescriptions = {
      bronze: 'Demonstrated competency',
      silver: 'Consistent excellence',
      gold: 'Outstanding performance',
      platinum: 'Exceptional mastery'
    };

    const impact = achievement.professionalValue.industryValue >= 8 ? 'high-impact' : 'valuable';
    
    return `${tierDescriptions[userAchievement.tier]} in ${impact} ${achievement.category.replace('_', ' ')} skills`;
  }

  /**
   * Extract key metrics from achievement
   */
  private static extractKeyMetrics(achievement: Achievement, userAchievement: UserAchievement): KeyMetric[] {
    const metrics: KeyMetric[] = [];

    // Professional value metric
    metrics.push({
      label: 'Industry Value',
      value: `${achievement.professionalValue.industryValue}/10`,
      context: 'Professional relevance rating',
      importance: 'high'
    });

    // Competency level
    metrics.push({
      label: 'Competency Level',
      value: this.capitalizeFirst(achievement.professionalValue.competencyLevel),
      context: 'Demonstrated skill level',
      importance: 'high'
    });

    // Evidence count
    if (userAchievement.evidence.length > 0) {
      metrics.push({
        label: 'Evidence Items',
        value: userAchievement.evidence.length.toString(),
        context: 'Supporting performance evidence',
        importance: 'medium'
      });
    }

    // Tier achievement
    metrics.push({
      label: 'Achievement Tier',
      value: this.formatTier(userAchievement.tier),
      context: 'Performance level achieved',
      importance: 'high'
    });

    // Career relevance
    metrics.push({
      label: 'Career Level',
      value: this.capitalizeFirst(achievement.professionalValue.careerRelevance),
      context: 'Applicable career level',
      importance: 'medium'
    });

    return metrics;
  }

  /**
   * Generate professional context
   */
  private static generateProfessionalContext(achievement: Achievement, userAchievement: UserAchievement): string {
    const skills = achievement.professionalValue.skillsDisplayed.slice(0, 3).join(', ');
    const earnedDate = userAchievement.earnedAt.toLocaleDateString();
    
    let context = `This ${userAchievement.tier} tier achievement demonstrates proficiency in ${skills}. `;
    context += `Earned on ${earnedDate}, it represents ${achievement.professionalValue.competencyLevel} level competency `;
    context += `relevant for ${achievement.professionalValue.careerRelevance} level positions. `;
    
    if (achievement.professionalValue.certificationsSupported.length > 0) {
      context += `Supports professional certifications including ${achievement.professionalValue.certificationsSupported.join(', ')}.`;
    }

    return context;
  }

  /**
   * Summarize evidence
   */
  private static summarizeEvidence(evidence: any[]): string {
    if (evidence.length === 0) return 'No evidence recorded';

    const evidenceTypes = evidence.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summaryParts = Object.entries(evidenceTypes).map(([type, count]) => 
      `${count} ${type.replace('_', ' ')} item${count > 1 ? 's' : ''}`
    );

    return `Evidence includes ${summaryParts.join(', ')}`;
  }

  /**
   * Determine recommended use cases
   */
  private static determineRecommendedUse(achievement: Achievement, userAchievement: UserAchievement): RecommendedUse {
    const professionalValue = achievement.professionalValue.industryValue;
    const tier = userAchievement.tier;
    const category = achievement.category;

    // High-value achievements are recommended for all uses
    const highValue = professionalValue >= 8;
    const topTier = tier === 'gold' || tier === 'platinum';

    const resume = highValue || topTier;
    const linkedIn = professionalValue >= 7;
    const interview = highValue && (category === 'technical_skills' || category === 'leadership');
    const portfolio = true; // All achievements can go in portfolio
    const networking = professionalValue >= 6;

    const reasons: string[] = [];
    if (highValue) reasons.push('High industry value');
    if (topTier) reasons.push('Top tier achievement');
    if (category === 'leadership') reasons.push('Leadership competency');
    if (achievement.rarity === 'rare' || achievement.rarity === 'epic') reasons.push('Rare achievement');

    return {
      resume,
      linkedIn,
      interview,
      portfolio,
      networking,
      reasons
    };
  }

  /**
   * Generate portfolio summary
   */
  private static generatePortfolioSummary(formattedAchievements: FormattedAchievement[]): PortfolioSummary {
    const totalAchievements = formattedAchievements.length;
    
    // Find highest tier
    const tierValues = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
    const topTier = formattedAchievements.reduce((highest, fa) => {
      const currentValue = tierValues[fa.userAchievement.tier];
      const highestValue = tierValues[highest];
      return currentValue > highestValue ? fa.userAchievement.tier : highest;
    }, 'bronze' as AchievementTier);

    // Count categories
    const categories = new Set(formattedAchievements.map(fa => fa.achievement.category));
    const categoriesRepresented = categories.size;

    // Calculate professional value
    const professionalValue = Math.round(
      formattedAchievements.reduce((sum, fa) => sum + fa.portfolioWeight, 0) / 
      formattedAchievements.length
    );

    // Identify standout achievements
    const standoutAchievements = formattedAchievements
      .filter(fa => fa.portfolioWeight >= 15 || fa.achievement.rarity === 'epic' || fa.achievement.rarity === 'legendary')
      .map(fa => fa.achievement.name)
      .slice(0, 3);

    // Generate career highlights
    const careerHighlights = this.generateCareerHighlights(formattedAchievements);

    return {
      totalAchievements,
      topTier,
      categoriesRepresented,
      professionalValue,
      standoutAchievements,
      careerHighlights
    };
  }

  /**
   * Generate career highlights
   */
  private static generateCareerHighlights(formattedAchievements: FormattedAchievement[]): string[] {
    const highlights: string[] = [];

    // Technical expertise
    const technicalAchievements = formattedAchievements.filter(
      fa => fa.achievement.category === AchievementCategory.TECHNICAL_SKILLS
    );
    if (technicalAchievements.length > 0) {
      highlights.push(`Technical expertise with ${technicalAchievements.length} technical achievement${technicalAchievements.length > 1 ? 's' : ''}`);
    }

    // Customer service excellence
    const customerAchievements = formattedAchievements.filter(
      fa => fa.achievement.category === AchievementCategory.CUSTOMER_SERVICE
    );
    if (customerAchievements.length > 0) {
      highlights.push(`Customer service excellence with proven satisfaction delivery`);
    }

    // Leadership potential
    const leadershipAchievements = formattedAchievements.filter(
      fa => fa.achievement.category === AchievementCategory.LEADERSHIP
    );
    if (leadershipAchievements.length > 0) {
      highlights.push(`Leadership capabilities demonstrated through mentoring and knowledge sharing`);
    }

    // Continuous learning
    const learningAchievements = formattedAchievements.filter(
      fa => fa.achievement.category === AchievementCategory.LEARNING
    );
    if (learningAchievements.length > 0) {
      highlights.push(`Commitment to continuous learning and professional development`);
    }

    return highlights.slice(0, 4);
  }

  /**
   * Generate professional narrative
   */
  private static generateProfessionalNarrative(formattedAchievements: FormattedAchievement[]): string {
    if (formattedAchievements.length === 0) {
      return 'Professional achievement portfolio is being developed through ongoing performance and skill demonstration.';
    }

    const topAchievements = formattedAchievements.slice(0, 3);
    const categories = new Set(formattedAchievements.map(fa => fa.achievement.category));

    let narrative = 'My professional development in IT support is demonstrated through ';
    narrative += `${formattedAchievements.length} earned achievement${formattedAchievements.length > 1 ? 's' : ''} `;
    narrative += `spanning ${categories.size} competency area${categories.size > 1 ? 's' : ''}. `;

    narrative += 'Key accomplishments include ';
    narrative += topAchievements.map(fa => 
      `${fa.achievement.name} (${this.formatTier(fa.userAchievement.tier)})`
    ).join(', ');
    narrative += '. ';

    narrative += 'These achievements demonstrate my commitment to professional excellence, ';
    narrative += 'continuous learning, and delivering high-quality IT support services. ';
    narrative += 'Each achievement is backed by measurable performance metrics and represents ';
    narrative += 'real-world competency that directly applies to professional IT support roles.';

    return narrative;
  }

  /**
   * Get resume recommendations
   */
  private static getResumeRecommendations(formattedAchievements: FormattedAchievement[]): string[] {
    return formattedAchievements
      .filter(fa => fa.recommendedUse.resume)
      .map(fa => fa.achievement.resumeBulletPoint)
      .slice(0, 5);
  }

  /**
   * Generate skills matrix
   */
  private static generateSkillsMatrix(formattedAchievements: FormattedAchievement[]): SkillsMatrix {
    const categorizeByType = (category: AchievementCategory) => {
      const categoryAchievements = formattedAchievements.filter(
        fa => fa.achievement.category === category
      );

      const skills = Array.from(new Set(
        categoryAchievements.flatMap(fa => fa.achievement.professionalValue.skillsDisplayed)
      ));

      const proficiencyLevels = categoryAchievements.map(
        fa => fa.achievement.professionalValue.competencyLevel
      );
      
      const highestProficiency = this.getHighestProficiency(proficiencyLevels);

      const certifications = Array.from(new Set(
        categoryAchievements.flatMap(fa => fa.achievement.professionalValue.certificationsSupported)
      ));

      return {
        skills,
        proficiencyLevel: highestProficiency,
        evidenceCount: categoryAchievements.reduce((sum, fa) => sum + fa.userAchievement.evidence.length, 0),
        achievements: categoryAchievements.map(fa => fa.achievement.name),
        certificationAlignment: certifications
      };
    };

    return {
      technicalSkills: categorizeByType(AchievementCategory.TECHNICAL_SKILLS),
      customerService: categorizeByType(AchievementCategory.CUSTOMER_SERVICE),
      professionalBehavior: categorizeByType(AchievementCategory.PROFESSIONAL_BEHAVIOR),
      leadership: categorizeByType(AchievementCategory.LEADERSHIP),
      learning: categorizeByType(AchievementCategory.LEARNING)
    };
  }

  /**
   * Get highest proficiency level
   */
  private static getHighestProficiency(levels: string[]): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    const hierarchy = { basic: 1, intermediate: 2, advanced: 3, expert: 4 };
    
    const highest = levels.reduce((max, level) => {
      const value = hierarchy[level as keyof typeof hierarchy] || 0;
      const maxValue = hierarchy[max as keyof typeof hierarchy] || 0;
      return value > maxValue ? level : max;
    }, 'basic');

    return highest as 'basic' | 'intermediate' | 'advanced' | 'expert';
  }

  /**
   * Utility functions
   */
  private static formatTier(tier: AchievementTier): string {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private static getCategoryDisplayName(category: AchievementCategory): string {
    const names = {
      technical_skills: 'Technical Skills',
      customer_service: 'Customer Service',
      professional_behavior: 'Professional Behavior',
      leadership: 'Leadership',
      learning: 'Learning & Innovation'
    };
    return names[category] || category;
  }

  /**
   * Export achievements in various formats
   */
  static async exportAchievements(
    userAchievements: UserAchievement[],
    format: 'resume' | 'linkedin' | 'portfolio' | 'certificate'
  ): Promise<string> {
    const portfolioPresentation = await this.formatForPortfolio(userAchievements, {
      format: 'portfolio',
      includeEvidence: format === 'portfolio',
      includeProgress: false,
      professionalStyle: true
    });

    switch (format) {
      case 'resume':
        return this.generateResumeFormat(portfolioPresentation);
      case 'linkedin':
        return this.generateLinkedInFormat(portfolioPresentation);
      case 'portfolio':
        return this.generatePortfolioFormat(portfolioPresentation);
      case 'certificate':
        return this.generateCertificateFormat(portfolioPresentation);
      default:
        return JSON.stringify(portfolioPresentation, null, 2);
    }
  }

  /**
   * Generate resume format
   */
  private static generateResumeFormat(presentation: PortfolioPresentation): string {
    let resume = '## Professional Achievements\n\n';
    resume += presentation.recommendedForResume.join('\n') + '\n\n';
    
    resume += '## Core Competencies\n\n';
    Object.entries(presentation.skillsMatrix).forEach(([category, skills]) => {
      if (skills.skills.length > 0) {
        resume += `**${category.replace(/([A-Z])/g, ' $1').trim()}:** `;
        resume += skills.skills.join(', ') + '\n';
      }
    });

    return resume;
  }

  /**
   * Generate LinkedIn format
   */
  private static generateLinkedInFormat(presentation: PortfolioPresentation): string {
    let post = '🏆 Professional Achievement Update\n\n';
    post += `I'm proud to share my recent accomplishments in IT support, earning ${presentation.summary.totalAchievements} professional achievements `;
    post += `across ${presentation.summary.categoriesRepresented} competency areas.\n\n`;
    
    post += '🎯 Key Highlights:\n';
    presentation.summary.standoutAchievements.forEach(achievement => {
      post += `• ${achievement}\n`;
    });

    post += '\n#ITSupport #ProfessionalDevelopment #Achievement #TechSkills #CustomerService';

    return post;
  }

  /**
   * Generate portfolio format
   */
  private static generatePortfolioFormat(presentation: PortfolioPresentation): string {
    let portfolio = '# Professional Achievement Portfolio\n\n';
    portfolio += `${presentation.professionalNarrative}\n\n`;
    
    portfolio += '## Achievement Summary\n\n';
    portfolio += `- **Total Achievements:** ${presentation.summary.totalAchievements}\n`;
    portfolio += `- **Highest Tier:** ${this.formatTier(presentation.summary.topTier)}\n`;
    portfolio += `- **Categories Mastered:** ${presentation.summary.categoriesRepresented}\n`;
    portfolio += `- **Professional Value Score:** ${presentation.summary.professionalValue}/100\n\n`;

    portfolio += '## Featured Achievements\n\n';
    presentation.achievements.slice(0, 5).forEach(fa => {
      portfolio += `### ${fa.presentation.title}\n`;
      portfolio += `${fa.presentation.description}\n\n`;
      portfolio += `**Professional Context:** ${fa.presentation.professionalContext}\n\n`;
    });

    return portfolio;
  }

  /**
   * Generate certificate format
   */
  private static generateCertificateFormat(presentation: PortfolioPresentation): string {
    const topAchievement = presentation.achievements[0];
    if (!topAchievement) return 'No achievements to certify';

    let certificate = '📜 CERTIFICATE OF ACHIEVEMENT\n\n';
    certificate += '═══════════════════════════════════════\n\n';
    certificate += `This certifies that the recipient has earned the\n\n`;
    certificate += `${topAchievement.presentation.title.toUpperCase()}\n\n`;
    certificate += `${topAchievement.presentation.description}\n\n`;
    certificate += `Date: ${topAchievement.userAchievement.earnedAt.toLocaleDateString()}\n`;
    certificate += `Professional Value: ${topAchievement.achievement.professionalValue.industryValue}/10\n\n`;
    certificate += `This achievement demonstrates ${topAchievement.achievement.professionalValue.competencyLevel} `;
    certificate += `level competency in ${topAchievement.achievement.professionalValue.skillsDisplayed.join(', ')}\n\n`;
    certificate += '═══════════════════════════════════════';

    return certificate;
  }
}