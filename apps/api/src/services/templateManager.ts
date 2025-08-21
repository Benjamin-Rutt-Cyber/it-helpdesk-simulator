import { logger } from '../utils/logger';
import { DocumentationTemplate, TemplateSection, TemplateField } from './documentationService';

export interface TemplateCustomization {
  id: string;
  userId: string;
  templateId: string;
  customFields: TemplateField[];
  sectionOrder: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateUsageStats {
  templateId: string;
  usageCount: number;
  averageQualityScore: number;
  averageCompletionTime: number;
  userFeedbackRating: number;
  lastUsed: Date;
}

export class TemplateManager {
  private static instance: TemplateManager;
  private templates: Map<string, DocumentationTemplate> = new Map();
  private customizations: Map<string, TemplateCustomization> = new Map();

  public static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: DocumentationTemplate[] = [
      {
        id: 'general-template',
        name: 'General Support Template',
        description: 'Comprehensive template for all types of support tickets',
        category: 'general',
        isDefault: true,
        sections: [
          {
            id: 'problem-summary',
            name: 'Problem Summary',
            description: 'Overview of the issue and its impact',
            required: true,
            fields: [
              {
                id: 'issue-description',
                name: 'Issue Description',
                type: 'textarea',
                required: true,
                placeholder: 'Provide a clear, concise description of the issue...',
                validation: { minLength: 10, maxLength: 500 }
              },
              {
                id: 'customer-impact',
                name: 'Customer Impact',
                type: 'textarea',
                required: true,
                placeholder: 'Describe how this issue affected the customer...',
                validation: { minLength: 10, maxLength: 300 }
              },
              {
                id: 'urgency-level',
                name: 'Urgency Level',
                type: 'select',
                required: true,
                options: ['low', 'medium', 'high', 'critical']
              }
            ]
          },
          {
            id: 'troubleshooting-process',
            name: 'Troubleshooting Process',
            description: 'Detailed steps taken to diagnose and resolve the issue',
            required: true,
            fields: [
              {
                id: 'initial-assessment',
                name: 'Initial Assessment',
                type: 'textarea',
                required: false,
                placeholder: 'What was checked first when analyzing the issue...'
              },
              {
                id: 'diagnostic-steps',
                name: 'Diagnostic Steps',
                type: 'array',
                required: false,
                placeholder: 'Enter diagnostic step...'
              },
              {
                id: 'test-results',
                name: 'Test Results',
                type: 'textarea',
                required: false,
                placeholder: 'Results of diagnostic tests performed...'
              },
              {
                id: 'solution-identification',
                name: 'Solution Identification',
                type: 'textarea',
                required: false,
                placeholder: 'How the solution was identified and chosen...'
              }
            ]
          },
          {
            id: 'root-cause-analysis',
            name: 'Root Cause Analysis',
            description: 'Analysis of the underlying cause and prevention measures',
            required: true,
            fields: [
              {
                id: 'primary-cause',
                name: 'Primary Cause',
                type: 'textarea',
                required: true,
                placeholder: 'The main root cause of the issue...',
                validation: { minLength: 10 }
              },
              {
                id: 'contributing-factors',
                name: 'Contributing Factors',
                type: 'array',
                required: false,
                placeholder: 'Enter contributing factor...'
              },
              {
                id: 'prevention',
                name: 'Prevention',
                type: 'textarea',
                required: false,
                placeholder: 'How to prevent this issue from occurring again...'
              }
            ]
          },
          {
            id: 'solution-implementation',
            name: 'Solution Implementation',
            description: 'Steps taken to implement and verify the solution',
            required: true,
            fields: [
              {
                id: 'solution-steps',
                name: 'Solution Steps',
                type: 'array',
                required: true,
                placeholder: 'Enter solution step...'
              },
              {
                id: 'verification-testing',
                name: 'Verification Testing',
                type: 'textarea',
                required: false,
                placeholder: 'How the solution was tested and verified...'
              },
              {
                id: 'customer-confirmation',
                name: 'Customer Confirmation',
                type: 'textarea',
                required: false,
                placeholder: 'Customer acceptance and confirmation of the solution...'
              }
            ]
          },
          {
            id: 'resolution-details',
            name: 'Resolution Details',
            description: 'Additional details about the resolution process',
            required: false,
            fields: [
              {
                id: 'resolution-time',
                name: 'Resolution Time (minutes)',
                type: 'number',
                required: false
              },
              {
                id: 'resources-used',
                name: 'Resources Used',
                type: 'array',
                required: false,
                placeholder: 'Enter resource used...'
              },
              {
                id: 'knowledge-gained',
                name: 'Knowledge Gained',
                type: 'textarea',
                required: false,
                placeholder: 'What was learned from this resolution...'
              },
              {
                id: 'followup-actions',
                name: 'Follow-up Actions',
                type: 'array',
                required: false,
                placeholder: 'Enter follow-up action...'
              }
            ]
          }
        ]
      },
      {
        id: 'hardware-template',
        name: 'Hardware Issue Template',
        description: 'Specialized template for hardware-related support tickets',
        category: 'hardware',
        isDefault: false,
        sections: [
          {
            id: 'hardware-details',
            name: 'Hardware Details',
            description: 'Specific information about the hardware involved',
            required: true,
            fields: [
              {
                id: 'device-type',
                name: 'Device Type',
                type: 'select',
                required: true,
                options: ['Desktop', 'Laptop', 'Printer', 'Monitor', 'Server', 'Network Device', 'Mobile Device', 'Other']
              },
              {
                id: 'manufacturer-model',
                name: 'Manufacturer & Model',
                type: 'text',
                required: true,
                placeholder: 'e.g., Dell OptiPlex 7090'
              },
              {
                id: 'serial-number',
                name: 'Serial Number',
                type: 'text',
                required: false,
                placeholder: 'Device serial number if available'
              },
              {
                id: 'hardware-symptoms',
                name: 'Hardware Symptoms',
                type: 'textarea',
                required: true,
                placeholder: 'Describe the specific hardware symptoms observed...',
                validation: { minLength: 20 }
              }
            ]
          }
        ]
      },
      {
        id: 'software-template',
        name: 'Software Issue Template',
        description: 'Specialized template for software-related support tickets',
        category: 'software',
        isDefault: false,
        sections: [
          {
            id: 'software-details',
            name: 'Software Details',
            description: 'Specific information about the software involved',
            required: true,
            fields: [
              {
                id: 'application-name',
                name: 'Application Name',
                type: 'text',
                required: true,
                placeholder: 'e.g., Microsoft Office 365'
              },
              {
                id: 'application-version',
                name: 'Application Version',
                type: 'text',
                required: false,
                placeholder: 'Software version number'
              },
              {
                id: 'operating-system',
                name: 'Operating System',
                type: 'select',
                required: true,
                options: ['Windows 10', 'Windows 11', 'macOS', 'Linux', 'iOS', 'Android', 'Other']
              },
              {
                id: 'error-messages',
                name: 'Error Messages',
                type: 'textarea',
                required: false,
                placeholder: 'Any error messages or codes displayed...'
              },
              {
                id: 'reproduction-steps',
                name: 'Steps to Reproduce',
                type: 'array',
                required: false,
                placeholder: 'Enter step to reproduce the issue...'
              }
            ]
          }
        ]
      },
      {
        id: 'network-template',
        name: 'Network Issue Template',
        description: 'Specialized template for network-related support tickets',
        category: 'network',
        isDefault: false,
        sections: [
          {
            id: 'network-details',
            name: 'Network Details',
            description: 'Specific information about the network issue',
            required: true,
            fields: [
              {
                id: 'connection-type',
                name: 'Connection Type',
                type: 'select',
                required: true,
                options: ['Wired Ethernet', 'Wi-Fi', 'VPN', 'Mobile Data', 'Other']
              },
              {
                id: 'network-symptoms',
                name: 'Network Symptoms',
                type: 'select',
                required: true,
                options: ['No Connection', 'Slow Speed', 'Intermittent Connection', 'Cannot Access Specific Sites', 'Authentication Issues', 'Other']
              },
              {
                id: 'affected-services',
                name: 'Affected Services',
                type: 'array',
                required: false,
                placeholder: 'Enter affected service (e.g., Email, Web browsing, File sharing)...'
              },
              {
                id: 'network-tests',
                name: 'Network Tests Performed',
                type: 'array',
                required: false,
                placeholder: 'Enter network test performed (e.g., ping test, speed test)...'
              }
            ]
          }
        ]
      },
      {
        id: 'security-template',
        name: 'Security Issue Template',
        description: 'Specialized template for security-related support tickets',
        category: 'security',
        isDefault: false,
        sections: [
          {
            id: 'security-details',
            name: 'Security Details',
            description: 'Specific information about the security issue',
            required: true,
            fields: [
              {
                id: 'security-incident-type',
                name: 'Security Incident Type',
                type: 'select',
                required: true,
                options: ['Malware Detection', 'Phishing Attempt', 'Data Breach', 'Unauthorized Access', 'Password Compromise', 'Suspicious Activity', 'Other']
              },
              {
                id: 'severity-level',
                name: 'Severity Level',
                type: 'select',
                required: true,
                options: ['Low', 'Medium', 'High', 'Critical']
              },
              {
                id: 'affected-systems',
                name: 'Affected Systems',
                type: 'array',
                required: true,
                placeholder: 'Enter affected system or resource...'
              },
              {
                id: 'security-measures-taken',
                name: 'Immediate Security Measures Taken',
                type: 'array',
                required: true,
                placeholder: 'Enter security measure taken...'
              },
              {
                id: 'data-exposure-risk',
                name: 'Data Exposure Risk Assessment',
                type: 'textarea',
                required: true,
                placeholder: 'Assess the risk of data exposure or compromise...',
                validation: { minLength: 20 }
              }
            ]
          }
        ]
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    logger.info('Initialized default documentation templates', {
      templateCount: defaultTemplates.length,
      categories: [...new Set(defaultTemplates.map(t => t.category))]
    });
  }

  async getTemplate(id: string): Promise<DocumentationTemplate | null> {
    try {
      const template = this.templates.get(id);
      if (!template) {
        logger.warn('Template not found', { templateId: id });
        return null;
      }
      return template;
    } catch (error) {
      logger.error('Failed to get template', { error, templateId: id });
      throw error;
    }
  }

  async getAllTemplates(): Promise<DocumentationTemplate[]> {
    try {
      return Array.from(this.templates.values());
    } catch (error) {
      logger.error('Failed to get all templates', { error });
      throw error;
    }
  }

  async getTemplatesByCategory(category: string): Promise<DocumentationTemplate[]> {
    try {
      return Array.from(this.templates.values()).filter(template => template.category === category);
    } catch (error) {
      logger.error('Failed to get templates by category', { error, category });
      throw error;
    }
  }

  async getDefaultTemplate(): Promise<DocumentationTemplate> {
    try {
      const defaultTemplate = Array.from(this.templates.values()).find(template => template.isDefault);
      if (!defaultTemplate) {
        throw new Error('No default template found');
      }
      return defaultTemplate;
    } catch (error) {
      logger.error('Failed to get default template', { error });
      throw error;
    }
  }

  async createCustomTemplate(
    baseTemplateId: string,
    name: string,
    description: string,
    customizations: Partial<DocumentationTemplate>
  ): Promise<string> {
    try {
      const baseTemplate = await this.getTemplate(baseTemplateId);
      if (!baseTemplate) {
        throw new Error(`Base template not found: ${baseTemplateId}`);
      }

      const customTemplateId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const customTemplate: DocumentationTemplate = {
        ...baseTemplate,
        ...customizations,
        id: customTemplateId,
        name,
        description,
        isDefault: false
      };

      this.templates.set(customTemplateId, customTemplate);

      logger.info('Created custom template', {
        customTemplateId,
        baseTemplateId,
        name
      });

      return customTemplateId;
    } catch (error) {
      logger.error('Failed to create custom template', { error, baseTemplateId, name });
      throw error;
    }
  }

  async updateTemplate(id: string, updates: Partial<DocumentationTemplate>): Promise<void> {
    try {
      const existingTemplate = this.templates.get(id);
      if (!existingTemplate) {
        throw new Error(`Template not found: ${id}`);
      }

      const updatedTemplate = { ...existingTemplate, ...updates };
      this.templates.set(id, updatedTemplate);

      logger.info('Updated template', {
        templateId: id,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      logger.error('Failed to update template', { error, templateId: id });
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const template = this.templates.get(id);
      if (!template) {
        throw new Error(`Template not found: ${id}`);
      }

      if (template.isDefault) {
        throw new Error('Cannot delete default template');
      }

      this.templates.delete(id);

      logger.info('Deleted template', { templateId: id });
    } catch (error) {
      logger.error('Failed to delete template', { error, templateId: id });
      throw error;
    }
  }

  async validateTemplateField(field: TemplateField, value: any): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Required field validation
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        return { isValid: false, error: `${field.name} is required` };
      }

      // Type validation
      switch (field.type) {
        case 'text':
          if (value && typeof value !== 'string') {
            return { isValid: false, error: `${field.name} must be text` };
          }
          break;
        case 'textarea':
          if (value && typeof value !== 'string') {
            return { isValid: false, error: `${field.name} must be text` };
          }
          break;
        case 'number':
          if (value && (isNaN(value) || typeof value !== 'number')) {
            return { isValid: false, error: `${field.name} must be a number` };
          }
          break;
        case 'select':
          if (value && field.options && !field.options.includes(value)) {
            return { isValid: false, error: `${field.name} must be one of: ${field.options.join(', ')}` };
          }
          break;
        case 'array':
          if (value && !Array.isArray(value)) {
            return { isValid: false, error: `${field.name} must be an array` };
          }
          break;
      }

      // Custom validation rules
      if (field.validation && value && typeof value === 'string') {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          return { isValid: false, error: `${field.name} must be at least ${field.validation.minLength} characters` };
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          return { isValid: false, error: `${field.name} must be no more than ${field.validation.maxLength} characters` };
        }
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            return { isValid: false, error: `${field.name} format is invalid` };
          }
        }
      }

      return { isValid: true };
    } catch (error) {
      logger.error('Failed to validate template field', { error, fieldId: field.id });
      return { isValid: false, error: 'Validation error occurred' };
    }
  }

  async getTemplateUsageStats(templateId: string): Promise<TemplateUsageStats | null> {
    try {
      // In a real implementation, this would query the database for usage statistics
      // For now, return mock data
      return {
        templateId,
        usageCount: 42,
        averageQualityScore: 85.5,
        averageCompletionTime: 25.3,
        userFeedbackRating: 4.2,
        lastUsed: new Date()
      };
    } catch (error) {
      logger.error('Failed to get template usage stats', { error, templateId });
      throw error;
    }
  }

  async getRecommendedTemplate(ticketType?: string, userPreferences?: any): Promise<DocumentationTemplate> {
    try {
      // Simple recommendation logic - in a real system this would be more sophisticated
      if (ticketType) {
        const categoryTemplates = await this.getTemplatesByCategory(ticketType.toLowerCase());
        if (categoryTemplates.length > 0) {
          return categoryTemplates[0];
        }
      }

      // Fall back to default template
      return await this.getDefaultTemplate();
    } catch (error) {
      logger.error('Failed to get recommended template', { error, ticketType });
      throw error;
    }
  }

  async exportTemplate(id: string): Promise<string> {
    try {
      const template = await this.getTemplate(id);
      if (!template) {
        throw new Error(`Template not found: ${id}`);
      }

      return JSON.stringify(template, null, 2);
    } catch (error) {
      logger.error('Failed to export template', { error, templateId: id });
      throw error;
    }
  }

  async importTemplate(templateData: string): Promise<string> {
    try {
      const template: DocumentationTemplate = JSON.parse(templateData);
      
      // Validate template structure
      if (!template.id || !template.name || !template.sections) {
        throw new Error('Invalid template structure');
      }

      // Generate new ID to avoid conflicts
      const newId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      template.id = newId;
      template.isDefault = false;

      this.templates.set(newId, template);

      logger.info('Imported template', {
        templateId: newId,
        name: template.name
      });

      return newId;
    } catch (error) {
      logger.error('Failed to import template', { error });
      throw error;
    }
  }
}