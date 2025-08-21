import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface DocumentationData {
  id?: string;
  ticketId: string;
  problemSummary: {
    issueDescription: string;
    customerImpact: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  troubleshootingProcess: {
    initialAssessment: string;
    diagnosticSteps: string[];
    testResults: string;
    solutionIdentification: string;
  };
  rootCauseAnalysis: {
    primaryCause: string;
    contributingFactors: string[];
    prevention: string;
  };
  solutionImplementation: {
    solutionSteps: string[];
    verificationTesting: string;
    customerConfirmation: string;
  };
  resolutionDetails: {
    resolutionTime: number;
    resourcesUsed: string[];
    knowledgeGained: string;
    followupActions: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
  qualityScore?: number;
  isPublished?: boolean;
}

export interface DocumentationTemplate {
  id: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  category: 'hardware' | 'software' | 'network' | 'security' | 'general';
  isDefault: boolean;
}

export interface TemplateSection {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  required: boolean;
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'array' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
}

export class DocumentationService {
  private static instance: DocumentationService;

  public static getInstance(): DocumentationService {
    if (!DocumentationService.instance) {
      DocumentationService.instance = new DocumentationService();
    }
    return DocumentationService.instance;
  }

  async createDocumentation(data: DocumentationData): Promise<string> {
    try {
      // Validate the documentation first
      const validation = await this.validateDocumentation(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(data);

      // Save to database (simulated for now)
      const documentationId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info(`Creating documentation for ticket ${data.ticketId}`, {
        documentationId,
        qualityScore,
        userId: data.userId
      });

      // In a real implementation, this would save to the database
      // await prisma.documentation.create({ data: { ...data, id: documentationId, qualityScore } });

      return documentationId;
    } catch (error) {
      logger.error('Failed to create documentation', { error, ticketId: data.ticketId });
      throw error;
    }
  }

  async updateDocumentation(id: string, data: Partial<DocumentationData>): Promise<void> {
    try {
      // Validate the updated documentation
      const currentDoc = await this.getDocumentation(id);
      const updatedDoc = { ...currentDoc, ...data };
      
      const validation = await this.validateDocumentation(updatedDoc);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Calculate new quality score
      const qualityScore = this.calculateQualityScore(updatedDoc);

      logger.info(`Updating documentation ${id}`, {
        qualityScore,
        sections: Object.keys(data)
      });

      // In a real implementation, this would update the database
      // await prisma.documentation.update({ where: { id }, data: { ...data, qualityScore, updatedAt: new Date() } });

    } catch (error) {
      logger.error('Failed to update documentation', { error, documentationId: id });
      throw error;
    }
  }

  async getDocumentation(id: string): Promise<DocumentationData> {
    try {
      // In a real implementation, this would fetch from the database
      // const doc = await prisma.documentation.findUnique({ where: { id } });
      
      // For now, return a mock document
      return {
        id,
        ticketId: 'ticket_123',
        userId: 'user_123',
        problemSummary: {
          issueDescription: '',
          customerImpact: '',
          urgencyLevel: 'medium'
        },
        troubleshootingProcess: {
          initialAssessment: '',
          diagnosticSteps: [],
          testResults: '',
          solutionIdentification: ''
        },
        rootCauseAnalysis: {
          primaryCause: '',
          contributingFactors: [],
          prevention: ''
        },
        solutionImplementation: {
          solutionSteps: [],
          verificationTesting: '',
          customerConfirmation: ''
        },
        resolutionDetails: {
          resolutionTime: 0,
          resourcesUsed: [],
          knowledgeGained: '',
          followupActions: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to get documentation', { error, documentationId: id });
      throw error;
    }
  }

  async getDocumentationByTicket(ticketId: string): Promise<DocumentationData | null> {
    try {
      // In a real implementation, this would fetch from the database
      // const doc = await prisma.documentation.findFirst({ where: { ticketId } });
      
      logger.info(`Fetching documentation for ticket ${ticketId}`);
      return null; // Mock implementation
    } catch (error) {
      logger.error('Failed to get documentation by ticket', { error, ticketId });
      throw error;
    }
  }

  async validateDocumentation(data: DocumentationData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!data.problemSummary.issueDescription?.trim()) {
      errors.push('Issue description is required');
    }
    if (!data.problemSummary.customerImpact?.trim()) {
      errors.push('Customer impact is required');
    }
    if (!data.rootCauseAnalysis.primaryCause?.trim()) {
      errors.push('Primary cause is required');
    }
    if (!data.solutionImplementation.solutionSteps?.length) {
      errors.push('At least one solution step is required');
    }

    // Quality checks (warnings)
    if (data.problemSummary.issueDescription && data.problemSummary.issueDescription.length < 20) {
      warnings.push('Issue description is very brief - consider adding more detail');
    }
    if (!data.troubleshootingProcess.diagnosticSteps?.length) {
      warnings.push('No diagnostic steps documented - this may reduce learning value');
    }
    if (!data.rootCauseAnalysis.prevention?.trim()) {
      warnings.push('No prevention measures documented');
    }
    if (data.resolutionDetails.resolutionTime === 0) {
      warnings.push('Resolution time not recorded');
    }

    const qualityScore = this.calculateQualityScore(data);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore
    };
  }

  calculateQualityScore(data: DocumentationData): number {
    let score = 0;
    let maxScore = 100;

    // Required fields (40 points)
    if (data.problemSummary.issueDescription?.trim()) score += 10;
    if (data.problemSummary.customerImpact?.trim()) score += 10;
    if (data.rootCauseAnalysis.primaryCause?.trim()) score += 10;
    if (data.solutionImplementation.solutionSteps?.length > 0) score += 10;

    // Comprehensive documentation (30 points)
    if (data.troubleshootingProcess.diagnosticSteps?.length > 0) score += 10;
    if (data.rootCauseAnalysis.contributingFactors?.length > 0) score += 5;
    if (data.rootCauseAnalysis.prevention?.trim()) score += 10;
    if (data.solutionImplementation.verificationTesting?.trim()) score += 5;

    // Professional quality (20 points)
    if (data.problemSummary.issueDescription && data.problemSummary.issueDescription.length >= 50) score += 5;
    if (data.troubleshootingProcess.initialAssessment?.trim()) score += 5;
    if (data.resolutionDetails.knowledgeGained?.trim()) score += 5;
    if (data.resolutionDetails.resourcesUsed?.length > 0) score += 5;

    // Completeness bonus (10 points)
    if (data.solutionImplementation.customerConfirmation?.trim()) score += 5;
    if (data.resolutionDetails.followupActions?.length > 0) score += 5;

    return Math.round((score / maxScore) * 100);
  }

  async getTemplates(): Promise<DocumentationTemplate[]> {
    // Return default templates
    return [
      {
        id: 'default-hardware',
        name: 'Hardware Issue Template',
        description: 'Template for hardware-related support tickets',
        category: 'hardware',
        isDefault: true,
        sections: [
          {
            id: 'problem-summary',
            name: 'Problem Summary',
            description: 'Overview of the hardware issue',
            required: true,
            fields: [
              {
                id: 'issue-description',
                name: 'Issue Description',
                type: 'textarea',
                required: true,
                placeholder: 'Describe the hardware issue in detail...',
                validation: { minLength: 10 }
              },
              {
                id: 'customer-impact',
                name: 'Customer Impact',
                type: 'textarea',
                required: true,
                placeholder: 'How does this hardware issue affect the customer?'
              },
              {
                id: 'urgency-level',
                name: 'Urgency Level',
                type: 'select',
                required: true,
                options: ['low', 'medium', 'high', 'critical']
              }
            ]
          }
        ]
      },
      {
        id: 'default-software',
        name: 'Software Issue Template',
        description: 'Template for software-related support tickets',
        category: 'software',
        isDefault: true,
        sections: []
      },
      {
        id: 'default-network',
        name: 'Network Issue Template',
        description: 'Template for network-related support tickets',
        category: 'network',
        isDefault: false,
        sections: []
      }
    ];
  }

  async exportDocumentation(id: string, format: 'markdown' | 'html' | 'pdf'): Promise<string> {
    try {
      const doc = await this.getDocumentation(id);
      
      switch (format) {
        case 'markdown':
          return this.exportToMarkdown(doc);
        case 'html':
          return this.exportToHTML(doc);
        case 'pdf':
          return this.exportToPDF(doc);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Failed to export documentation', { error, documentationId: id, format });
      throw error;
    }
  }

  private exportToMarkdown(doc: DocumentationData): string {
    return `# Ticket Resolution Documentation

## Problem Summary

**Issue Description:** ${doc.problemSummary.issueDescription}

**Customer Impact:** ${doc.problemSummary.customerImpact}

**Urgency Level:** ${doc.problemSummary.urgencyLevel}

## Troubleshooting Process

**Initial Assessment:** ${doc.troubleshootingProcess.initialAssessment}

**Diagnostic Steps:**
${doc.troubleshootingProcess.diagnosticSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Test Results:** ${doc.troubleshootingProcess.testResults}

**Solution Identification:** ${doc.troubleshootingProcess.solutionIdentification}

## Root Cause Analysis

**Primary Cause:** ${doc.rootCauseAnalysis.primaryCause}

**Contributing Factors:**
${doc.rootCauseAnalysis.contributingFactors.map(factor => `- ${factor}`).join('\n')}

**Prevention:** ${doc.rootCauseAnalysis.prevention}

## Solution Implementation

**Solution Steps:**
${doc.solutionImplementation.solutionSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Verification Testing:** ${doc.solutionImplementation.verificationTesting}

**Customer Confirmation:** ${doc.solutionImplementation.customerConfirmation}

## Resolution Details

**Resolution Time:** ${doc.resolutionDetails.resolutionTime} minutes

**Resources Used:**
${doc.resolutionDetails.resourcesUsed.map(resource => `- ${resource}`).join('\n')}

**Knowledge Gained:** ${doc.resolutionDetails.knowledgeGained}

**Follow-up Actions:**
${doc.resolutionDetails.followupActions.map(action => `- ${action}`).join('\n')}

---
*Documentation created: ${doc.createdAt?.toISOString()}*
*Last updated: ${doc.updatedAt?.toISOString()}*`;
  }

  private exportToHTML(doc: DocumentationData): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Ticket Resolution Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1, h2 { color: #333; }
        .section { margin-bottom: 30px; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; }
        ol, ul { margin-left: 20px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; }
    </style>
</head>
<body>
    <h1>Ticket Resolution Documentation</h1>
    
    <div class="section">
        <h2>Problem Summary</h2>
        <div class="field">
            <div class="field-label">Issue Description:</div>
            <p>${doc.problemSummary.issueDescription}</p>
        </div>
        <div class="field">
            <div class="field-label">Customer Impact:</div>
            <p>${doc.problemSummary.customerImpact}</p>
        </div>
        <div class="field">
            <div class="field-label">Urgency Level:</div>
            <p>${doc.problemSummary.urgencyLevel}</p>
        </div>
    </div>

    <div class="section">
        <h2>Troubleshooting Process</h2>
        <div class="field">
            <div class="field-label">Initial Assessment:</div>
            <p>${doc.troubleshootingProcess.initialAssessment}</p>
        </div>
        <div class="field">
            <div class="field-label">Diagnostic Steps:</div>
            <ol>
                ${doc.troubleshootingProcess.diagnosticSteps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
        <div class="field">
            <div class="field-label">Test Results:</div>
            <p>${doc.troubleshootingProcess.testResults}</p>
        </div>
        <div class="field">
            <div class="field-label">Solution Identification:</div>
            <p>${doc.troubleshootingProcess.solutionIdentification}</p>
        </div>
    </div>

    <div class="section">
        <h2>Root Cause Analysis</h2>
        <div class="field">
            <div class="field-label">Primary Cause:</div>
            <p>${doc.rootCauseAnalysis.primaryCause}</p>
        </div>
        <div class="field">
            <div class="field-label">Contributing Factors:</div>
            <ul>
                ${doc.rootCauseAnalysis.contributingFactors.map(factor => `<li>${factor}</li>`).join('')}
            </ul>
        </div>
        <div class="field">
            <div class="field-label">Prevention:</div>
            <p>${doc.rootCauseAnalysis.prevention}</p>
        </div>
    </div>

    <div class="section">
        <h2>Solution Implementation</h2>
        <div class="field">
            <div class="field-label">Solution Steps:</div>
            <ol>
                ${doc.solutionImplementation.solutionSteps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
        <div class="field">
            <div class="field-label">Verification Testing:</div>
            <p>${doc.solutionImplementation.verificationTesting}</p>
        </div>
        <div class="field">
            <div class="field-label">Customer Confirmation:</div>
            <p>${doc.solutionImplementation.customerConfirmation}</p>
        </div>
    </div>

    <div class="section">
        <h2>Resolution Details</h2>
        <div class="field">
            <div class="field-label">Resolution Time:</div>
            <p>${doc.resolutionDetails.resolutionTime} minutes</p>
        </div>
        <div class="field">
            <div class="field-label">Resources Used:</div>
            <ul>
                ${doc.resolutionDetails.resourcesUsed.map(resource => `<li>${resource}</li>`).join('')}
            </ul>
        </div>
        <div class="field">
            <div class="field-label">Knowledge Gained:</div>
            <p>${doc.resolutionDetails.knowledgeGained}</p>
        </div>
        <div class="field">
            <div class="field-label">Follow-up Actions:</div>
            <ul>
                ${doc.resolutionDetails.followupActions.map(action => `<li>${action}</li>`).join('')}
            </ul>
        </div>
    </div>

    <div class="footer">
        <p>Documentation created: ${doc.createdAt?.toISOString()}</p>
        <p>Last updated: ${doc.updatedAt?.toISOString()}</p>
    </div>
</body>
</html>`;
  }

  private exportToPDF(doc: DocumentationData): string {
    // In a real implementation, this would generate a PDF using a library like puppeteer or jsPDF
    // For now, return the HTML that could be converted to PDF
    return this.exportToHTML(doc);
  }

  async publishToKnowledgeBase(id: string): Promise<void> {
    try {
      const doc = await this.getDocumentation(id);
      const validation = await this.validateDocumentation(doc);
      
      if (!validation.isValid) {
        throw new Error('Documentation must be valid before publishing to knowledge base');
      }

      if (validation.qualityScore < 70) {
        throw new Error('Documentation quality score must be at least 70 to publish to knowledge base');
      }

      logger.info(`Publishing documentation ${id} to knowledge base`, {
        qualityScore: validation.qualityScore,
        ticketId: doc.ticketId
      });

      // In a real implementation, this would publish to the knowledge base
      // await this.knowledgeBaseService.publish(doc);

    } catch (error) {
      logger.error('Failed to publish documentation to knowledge base', { error, documentationId: id });
      throw error;
    }
  }
}