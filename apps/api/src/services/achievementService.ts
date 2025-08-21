export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  criteria: AchievementCriteria;
  rarity: AchievementRarity;
  professionalValue: ProfessionalValue;
  portfolioDescription: string;
  resumeBulletPoint: string;
}

export interface UserAchievement {
  achievementId: string;
  userId: string;
  earnedAt: Date;
  tier: AchievementTier;
  progress: AchievementProgress;
  evidence: AchievementEvidence[];
  celebrationShown: boolean;
}

export enum AchievementCategory {
  TECHNICAL_SKILLS = 'technical_skills',
  CUSTOMER_SERVICE = 'customer_service',
  PROFESSIONAL_BEHAVIOR = 'professional_behavior',
  LEADERSHIP = 'leadership',
  LEARNING = 'learning'
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface AchievementCriteria {
  type: 'count' | 'percentage' | 'streak' | 'quality' | 'speed' | 'composite';
  requirements: {
    bronze: CriteriaRequirement;
    silver: CriteriaRequirement;
    gold: CriteriaRequirement;
    platinum?: CriteriaRequirement;
  };
}

export interface CriteriaRequirement {
  threshold: number;
  timeframe?: string; // e.g., '30d', '7d', 'lifetime'
  conditions?: Record<string, any>;
  sustainedPeriod?: string; // For streak-based achievements
}

export interface AchievementProgress {
  currentValue: number;
  targetValue: number;
  percentage: number;
  streakCount?: number;
  bestValue?: number;
  recentActivity: ProgressActivity[];
}

export interface ProgressActivity {
  date: Date;
  value: number;
  context: string;
  ticketId?: string;
}

export interface AchievementEvidence {
  type: 'ticket' | 'performance_metric' | 'customer_feedback' | 'peer_review';
  reference: string;
  value: number;
  date: Date;
  description: string;
}

export interface ProfessionalValue {
  skillsDisplayed: string[];
  competencyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  careerRelevance: 'entry' | 'mid' | 'senior' | 'leadership';
  industryValue: number; // 1-10 scale
  certificationsSupported: string[];
}

export class AchievementService {
  private static readonly ACHIEVEMENT_DEFINITIONS: Achievement[] = [
    // Technical Skills Achievements
    {
      id: 'troubleshooting_master',
      category: AchievementCategory.TECHNICAL_SKILLS,
      name: 'Troubleshooting Master',
      description: 'Demonstrates exceptional technical problem-solving abilities',
      tier: AchievementTier.BRONZE,
      icon: 'wrench',
      criteria: {
        type: 'percentage',
        requirements: {
          bronze: { threshold: 85, timeframe: '30d', conditions: { firstContactResolution: true } },
          silver: { threshold: 90, timeframe: '60d', conditions: { firstContactResolution: true } },
          gold: { threshold: 95, timeframe: '90d', conditions: { firstContactResolution: true } },
          platinum: { threshold: 98, timeframe: '120d', conditions: { firstContactResolution: true } }
        }
      },
      rarity: AchievementRarity.UNCOMMON,
      professionalValue: {
        skillsDisplayed: ['Technical Problem Solving', 'Root Cause Analysis', 'Diagnostic Skills'],
        competencyLevel: 'advanced',
        careerRelevance: 'mid',
        industryValue: 9,
        certificationsSupported: ['CompTIA A+', 'ITIL Foundation']
      },
      portfolioDescription: 'Consistently resolves technical issues on first contact with 95%+ success rate',
      resumeBulletPoint: '• Achieved 95%+ first-contact resolution rate, demonstrating advanced troubleshooting expertise'
    },
    {
      id: 'network_specialist',
      category: AchievementCategory.TECHNICAL_SKILLS,
      name: 'Network Specialist',
      description: 'Demonstrates expertise in network troubleshooting and connectivity issues',
      tier: AchievementTier.BRONZE,
      icon: 'network',
      criteria: {
        type: 'count',
        requirements: {
          bronze: { threshold: 25, timeframe: '60d', conditions: { category: 'network' } },
          silver: { threshold: 50, timeframe: '120d', conditions: { category: 'network', rating: 4.0 } },
          gold: { threshold: 100, timeframe: '180d', conditions: { category: 'network', rating: 4.5 } }
        }
      },
      rarity: AchievementRarity.RARE,
      professionalValue: {
        skillsDisplayed: ['Network Troubleshooting', 'TCP/IP', 'Network Security', 'Infrastructure'],
        competencyLevel: 'advanced',
        careerRelevance: 'mid',
        industryValue: 8,
        certificationsSupported: ['CompTIA Network+', 'CCNA']
      },
      portfolioDescription: 'Specialized in network connectivity issues with consistent high-quality resolutions',
      resumeBulletPoint: '• Network troubleshooting specialist with 100+ successfully resolved connectivity issues'
    },
    {
      id: 'security_guardian',
      category: AchievementCategory.TECHNICAL_SKILLS,
      name: 'Security Guardian',
      description: 'Consistently implements and promotes security best practices',
      tier: AchievementTier.BRONZE,
      icon: 'shield',
      criteria: {
        type: 'composite',
        requirements: {
          bronze: { threshold: 20, conditions: { securityIssues: 10, securityEducation: 10 } },
          silver: { threshold: 50, conditions: { securityIssues: 25, securityEducation: 25 } },
          gold: { threshold: 100, conditions: { securityIssues: 50, securityEducation: 50 } }
        }
      },
      rarity: AchievementRarity.EPIC,
      professionalValue: {
        skillsDisplayed: ['Security Best Practices', 'Risk Assessment', 'Security Education', 'Compliance'],
        competencyLevel: 'expert',
        careerRelevance: 'senior',
        industryValue: 10,
        certificationsSupported: ['CompTIA Security+', 'CISSP']
      },
      portfolioDescription: 'Champions security best practices and educates users on security awareness',
      resumeBulletPoint: '• Security advocate with 100+ security incidents resolved and extensive user education'
    },

    // Customer Service Achievements
    {
      id: 'customer_champion',
      category: AchievementCategory.CUSTOMER_SERVICE,
      name: 'Customer Champion',
      description: 'Consistently delivers outstanding customer satisfaction',
      tier: AchievementTier.BRONZE,
      icon: 'heart',
      criteria: {
        type: 'percentage',
        requirements: {
          bronze: { threshold: 95, timeframe: '30d', conditions: { minTickets: 20 } },
          silver: { threshold: 97, timeframe: '60d', conditions: { minTickets: 50 } },
          gold: { threshold: 98, timeframe: '90d', conditions: { minTickets: 100 } }
        }
      },
      rarity: AchievementRarity.COMMON,
      professionalValue: {
        skillsDisplayed: ['Customer Service', 'Communication', 'Empathy', 'Problem Resolution'],
        competencyLevel: 'advanced',
        careerRelevance: 'mid',
        industryValue: 8,
        certificationsSupported: ['HDI Customer Service', 'ITIL Service Management']
      },
      portfolioDescription: 'Maintains exceptional customer satisfaction ratings through professional service delivery',
      resumeBulletPoint: '• Achieved 98% customer satisfaction rating across 100+ customer interactions'
    },
    {
      id: 'communication_expert',
      category: AchievementCategory.CUSTOMER_SERVICE,
      name: 'Communication Expert',
      description: 'Demonstrates exceptional communication skills with customers',
      tier: AchievementTier.BRONZE,
      icon: 'message-circle',
      criteria: {
        type: 'quality',
        requirements: {
          bronze: { threshold: 4.5, timeframe: '30d', conditions: { communicationRating: true } },
          silver: { threshold: 4.7, timeframe: '60d', conditions: { communicationRating: true } },
          gold: { threshold: 4.9, timeframe: '90d', conditions: { communicationRating: true } }
        }
      },
      rarity: AchievementRarity.UNCOMMON,
      professionalValue: {
        skillsDisplayed: ['Professional Communication', 'Active Listening', 'Technical Translation', 'Clarity'],
        competencyLevel: 'advanced',
        careerRelevance: 'mid',
        industryValue: 9,
        certificationsSupported: ['Business Communication', 'Customer Service Excellence']
      },
      portfolioDescription: 'Excels in clear, professional communication with both technical and non-technical audiences',
      resumeBulletPoint: '• Recognized for exceptional communication skills with 4.9/5.0 customer communication ratings'
    },

    // Professional Behavior Achievements
    {
      id: 'process_professional',
      category: AchievementCategory.PROFESSIONAL_BEHAVIOR,
      name: 'Process Professional',
      description: 'Consistently follows and improves established processes',
      tier: AchievementTier.BRONZE,
      icon: 'clipboard-check',
      criteria: {
        type: 'percentage',
        requirements: {
          bronze: { threshold: 95, timeframe: '30d', conditions: { processAdherence: true } },
          silver: { threshold: 98, timeframe: '60d', conditions: { processAdherence: true } },
          gold: { threshold: 99, timeframe: '90d', conditions: { processAdherence: true } }
        }
      },
      rarity: AchievementRarity.COMMON,
      professionalValue: {
        skillsDisplayed: ['Process Management', 'Quality Assurance', 'Attention to Detail', 'Reliability'],
        competencyLevel: 'intermediate',
        careerRelevance: 'mid',
        industryValue: 7,
        certificationsSupported: ['ITIL Foundation', 'Six Sigma']
      },
      portfolioDescription: 'Demonstrates exceptional process adherence and continuous improvement mindset',
      resumeBulletPoint: '• Maintained 99% process compliance while contributing to process improvement initiatives'
    },
    {
      id: 'learning_leader',
      category: AchievementCategory.PROFESSIONAL_BEHAVIOR,
      name: 'Learning Leader',
      description: 'Demonstrates continuous learning and skill development',
      tier: AchievementTier.BRONZE,
      icon: 'graduation-cap',
      criteria: {
        type: 'count',
        requirements: {
          bronze: { threshold: 10, timeframe: '60d', conditions: { skillDemonstrations: true } },
          silver: { threshold: 25, timeframe: '120d', conditions: { skillDemonstrations: true } },
          gold: { threshold: 50, timeframe: '180d', conditions: { skillDemonstrations: true } }
        }
      },
      rarity: AchievementRarity.UNCOMMON,
      professionalValue: {
        skillsDisplayed: ['Continuous Learning', 'Skill Development', 'Adaptability', 'Growth Mindset'],
        competencyLevel: 'advanced',
        careerRelevance: 'mid',
        industryValue: 8,
        certificationsSupported: ['Professional Development', 'Lifelong Learning']
      },
      portfolioDescription: 'Actively pursues skill development and demonstrates new competencies regularly',
      resumeBulletPoint: '• Continuous learner with 50+ skill demonstrations showing professional growth'
    },

    // Leadership Achievements
    {
      id: 'mentor_master',
      category: AchievementCategory.LEADERSHIP,
      name: 'Mentor Master',
      description: 'Helps others succeed and shares knowledge effectively',
      tier: AchievementTier.BRONZE,
      icon: 'users',
      criteria: {
        type: 'composite',
        requirements: {
          bronze: { threshold: 15, conditions: { mentoring: 10, knowledgeSharing: 5 } },
          silver: { threshold: 40, conditions: { mentoring: 25, knowledgeSharing: 15 } },
          gold: { threshold: 75, conditions: { mentoring: 50, knowledgeSharing: 25 } }
        }
      },
      rarity: AchievementRarity.RARE,
      professionalValue: {
        skillsDisplayed: ['Leadership', 'Mentoring', 'Knowledge Transfer', 'Team Development'],
        competencyLevel: 'expert',
        careerRelevance: 'leadership',
        industryValue: 9,
        certificationsSupported: ['Leadership Development', 'Coaching Certification']
      },
      portfolioDescription: 'Proven leader in mentoring team members and facilitating knowledge transfer',
      resumeBulletPoint: '• Mentored 25+ team members and contributed 50+ knowledge-sharing sessions'
    },

    // Learning Achievements
    {
      id: 'innovation_pioneer',
      category: AchievementCategory.LEARNING,
      name: 'Innovation Pioneer',
      description: 'Introduces new solutions and improves existing processes',
      tier: AchievementTier.BRONZE,
      icon: 'lightbulb',
      criteria: {
        type: 'count',
        requirements: {
          bronze: { threshold: 3, conditions: { innovations: true, impact: 'positive' } },
          silver: { threshold: 8, conditions: { innovations: true, impact: 'significant' } },
          gold: { threshold: 15, conditions: { innovations: true, impact: 'transformative' } }
        }
      },
      rarity: AchievementRarity.LEGENDARY,
      professionalValue: {
        skillsDisplayed: ['Innovation', 'Problem Solving', 'Process Improvement', 'Creative Thinking'],
        competencyLevel: 'expert',
        careerRelevance: 'leadership',
        industryValue: 10,
        certificationsSupported: ['Innovation Management', 'Process Improvement']
      },
      portfolioDescription: 'Drives innovation and process improvement with measurable positive impact',
      resumeBulletPoint: '• Innovation leader with 15+ process improvements delivering measurable business value'
    }
  ];

  /**
   * Get all available achievements
   */
  static getAllAchievements(): Achievement[] {
    return this.ACHIEVEMENT_DEFINITIONS;
  }

  /**
   * Get achievements by category
   */
  static getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.ACHIEVEMENT_DEFINITIONS.filter(achievement => achievement.category === category);
  }

  /**
   * Get achievement by ID
   */
  static getAchievementById(id: string): Achievement | undefined {
    return this.ACHIEVEMENT_DEFINITIONS.find(achievement => achievement.id === id);
  }

  /**
   * Check if user qualifies for achievement at specific tier
   */
  static checkAchievementEligibility(
    achievementId: string,
    userMetrics: Record<string, any>,
    tier: AchievementTier
  ): { eligible: boolean; progress: number; missing: string[] } {
    const achievement = this.getAchievementById(achievementId);
    if (!achievement) {
      return { eligible: false, progress: 0, missing: ['Achievement not found'] };
    }

    const requirement = achievement.criteria.requirements[tier];
    if (!requirement) {
      return { eligible: false, progress: 0, missing: ['Tier not available'] };
    }

    return this.evaluateCriteria(achievement.criteria.type, requirement, userMetrics);
  }

  /**
   * Evaluate achievement criteria
   */
  private static evaluateCriteria(
    type: string,
    requirement: CriteriaRequirement,
    userMetrics: Record<string, any>
  ): { eligible: boolean; progress: number; missing: string[] } {
    const missing: string[] = [];
    let progress = 0;

    switch (type) {
      case 'count':
        const currentCount = userMetrics.count || 0;
        progress = Math.min((currentCount / requirement.threshold) * 100, 100);
        if (currentCount < requirement.threshold) {
          missing.push(`Need ${requirement.threshold - currentCount} more occurrences`);
        }
        break;

      case 'percentage':
        const currentPercentage = userMetrics.percentage || 0;
        progress = Math.min((currentPercentage / requirement.threshold) * 100, 100);
        if (currentPercentage < requirement.threshold) {
          missing.push(`Need ${requirement.threshold - currentPercentage}% improvement`);
        }
        break;

      case 'quality':
        const currentQuality = userMetrics.rating || 0;
        progress = Math.min((currentQuality / requirement.threshold) * 100, 100);
        if (currentQuality < requirement.threshold) {
          missing.push(`Need ${requirement.threshold - currentQuality} rating improvement`);
        }
        break;

      case 'streak':
        const currentStreak = userMetrics.streak || 0;
        progress = Math.min((currentStreak / requirement.threshold) * 100, 100);
        if (currentStreak < requirement.threshold) {
          missing.push(`Need ${requirement.threshold - currentStreak} consecutive days`);
        }
        break;

      case 'composite':
        const conditions = requirement.conditions || {};
        let totalProgress = 0;
        let totalConditions = 0;

        for (const [key, targetValue] of Object.entries(conditions)) {
          const currentValue = userMetrics[key] || 0;
          const conditionProgress = Math.min((currentValue / targetValue) * 100, 100);
          totalProgress += conditionProgress;
          totalConditions++;

          if (currentValue < targetValue) {
            missing.push(`Need ${targetValue - currentValue} more ${key}`);
          }
        }

        progress = totalConditions > 0 ? totalProgress / totalConditions : 0;
        break;

      default:
        missing.push('Unknown criteria type');
    }

    return {
      eligible: missing.length === 0,
      progress: Math.round(progress),
      missing
    };
  }

  /**
   * Get user's earned achievements
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    // This would integrate with database in real implementation
    // For now, return mock data structure
    return [];
  }

  /**
   * Award achievement to user
   */
  static async awardAchievement(
    userId: string,
    achievementId: string,
    tier: AchievementTier,
    evidence: AchievementEvidence[]
  ): Promise<UserAchievement> {
    const userAchievement: UserAchievement = {
      achievementId,
      userId,
      earnedAt: new Date(),
      tier,
      progress: {
        currentValue: 100,
        targetValue: 100,
        percentage: 100,
        recentActivity: []
      },
      evidence,
      celebrationShown: false
    };

    // In real implementation, save to database
    console.log(`Achievement awarded: ${achievementId} (${tier}) to user ${userId}`);

    return userAchievement;
  }

  /**
   * Get achievement progress for user
   */
  static async getAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<AchievementProgress | null> {
    // This would calculate real progress in actual implementation
    return null;
  }

  /**
   * Get achievements suitable for portfolio/resume
   */
  static getPortfolioAchievements(userAchievements: UserAchievement[]): {
    achievement: Achievement;
    userAchievement: UserAchievement;
    portfolioWeight: number;
  }[] {
    return userAchievements
      .map(userAchievement => {
        const achievement = this.getAchievementById(userAchievement.achievementId);
        if (!achievement) return null;

        // Calculate portfolio weight based on rarity, tier, and professional value
        let portfolioWeight = achievement.professionalValue.industryValue;
        
        // Tier multiplier
        switch (userAchievement.tier) {
          case AchievementTier.PLATINUM:
            portfolioWeight *= 2.0;
            break;
          case AchievementTier.GOLD:
            portfolioWeight *= 1.5;
            break;
          case AchievementTier.SILVER:
            portfolioWeight *= 1.2;
            break;
          default:
            portfolioWeight *= 1.0;
        }

        // Rarity multiplier
        switch (achievement.rarity) {
          case AchievementRarity.LEGENDARY:
            portfolioWeight *= 2.0;
            break;
          case AchievementRarity.EPIC:
            portfolioWeight *= 1.5;
            break;
          case AchievementRarity.RARE:
            portfolioWeight *= 1.3;
            break;
          case AchievementRarity.UNCOMMON:
            portfolioWeight *= 1.1;
            break;
          default:
            portfolioWeight *= 1.0;
        }

        return { achievement, userAchievement, portfolioWeight };
      })
      .filter(item => item !== null)
      .sort((a, b) => b!.portfolioWeight - a!.portfolioWeight);
  }

  /**
   * Generate achievement summary for resume
   */
  static generateResumeSummary(userAchievements: UserAchievement[]): string[] {
    const portfolioAchievements = this.getPortfolioAchievements(userAchievements);
    
    return portfolioAchievements
      .slice(0, 5) // Top 5 achievements
      .map(item => item!.achievement.resumeBulletPoint);
  }

  /**
   * Get achievement categories summary
   */
  static getAchievementCategoriesSummary(): {
    category: AchievementCategory;
    name: string;
    description: string;
    achievementCount: number;
    professionalRelevance: string;
  }[] {
    const categories = Object.values(AchievementCategory);
    
    return categories.map(category => {
      const achievements = this.getAchievementsByCategory(category);
      
      const categoryInfo = {
        [AchievementCategory.TECHNICAL_SKILLS]: {
          name: 'Technical Skills',
          description: 'Achievements recognizing technical expertise and problem-solving abilities',
          professionalRelevance: 'Demonstrates technical competency and troubleshooting expertise'
        },
        [AchievementCategory.CUSTOMER_SERVICE]: {
          name: 'Customer Service',
          description: 'Achievements recognizing excellence in customer interaction and satisfaction',
          professionalRelevance: 'Shows customer focus and communication skills'
        },
        [AchievementCategory.PROFESSIONAL_BEHAVIOR]: {
          name: 'Professional Behavior',
          description: 'Achievements recognizing professional conduct and work quality',
          professionalRelevance: 'Indicates reliability and professional standards'
        },
        [AchievementCategory.LEADERSHIP]: {
          name: 'Leadership',
          description: 'Achievements recognizing leadership and mentoring capabilities',
          professionalRelevance: 'Demonstrates leadership potential and team contribution'
        },
        [AchievementCategory.LEARNING]: {
          name: 'Learning & Innovation',
          description: 'Achievements recognizing continuous learning and innovation',
          professionalRelevance: 'Shows adaptability and growth mindset'
        }
      };

      return {
        category,
        name: categoryInfo[category].name,
        description: categoryInfo[category].description,
        achievementCount: achievements.length,
        professionalRelevance: categoryInfo[category].professionalRelevance
      };
    });
  }
}