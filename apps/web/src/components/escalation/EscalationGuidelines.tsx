import React, { useState } from 'react';
import { 
  Info, 
  ArrowUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Settings, 
  HardDrive,
  AlertCircle,
  User,
  BookOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export interface EscalationGuidelinesProps {
  className?: string;
}

interface GuidelineSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: {
    description: string;
    criteria: string[];
    process: string[];
    examples: string[];
    warnings?: string[];
  };
}

const ESCALATION_GUIDELINES: GuidelineSection[] = [
  {
    id: 'when_to_escalate',
    title: 'When to Escalate',
    icon: <AlertTriangle size={20} />,
    content: {
      description: 'Understanding when escalation is necessary is crucial for efficient issue resolution.',
      criteria: [
        'Issue exceeds your technical knowledge or skill level',
        'Resolution requires permissions or access you do not have',
        'Problem affects critical business operations or multiple users',
        'Customer requests escalation to higher authority',
        'Issue requires specialized tools or resources',
        'Resolution time would exceed SLA requirements',
        'Hardware replacement or physical intervention needed'
      ],
      process: [
        'Attempt initial troubleshooting within your capability',
        'Document all attempted solutions and their outcomes',
        'Gather comprehensive information about the issue',
        'Assess business impact and urgency',
        'Determine appropriate escalation target',
        'Prepare detailed handoff documentation'
      ],
      examples: [
        'Server outage affecting entire department',
        'Security incident requiring immediate attention',
        'Software requiring admin privileges for installation',
        'Hardware failure needing replacement parts'
      ]
    }
  },
  {
    id: 'escalation_categories',
    title: 'Escalation Categories',
    icon: <Settings size={20} />,
    content: {
      description: 'Different types of issues require different escalation approaches and targets.',
      criteria: [
        'Technical Complexity: Advanced troubleshooting or specialized knowledge',
        'Permissions: Administrative rights or elevated access required',
        'Hardware Issues: Physical replacement or repair needed',
        'Policy Exceptions: Requests requiring management approval',
        'Resource Intensive: Solutions requiring significant time or resources'
      ],
      process: [
        'Identify the primary category for your issue',
        'Select appropriate escalation target based on category',
        'Provide category-specific information and documentation',
        'Follow category-specific escalation procedures'
      ],
      examples: [
        'Technical: Database corruption requiring DBA expertise',
        'Permissions: User needs access to restricted financial system',
        'Hardware: Laptop screen replacement needed',
        'Policy: Request for non-standard software installation'
      ]
    }
  },
  {
    id: 'escalation_targets',
    title: 'Escalation Targets',
    icon: <User size={20} />,
    content: {
      description: 'Choose the right escalation target based on the nature of the issue.',
      criteria: [
        'Level 2 Support: Advanced technical issues within IT scope',
        'System Administrator: Infrastructure, servers, and network issues',
        'Security Team: Security incidents and access control',
        'IT Management: Policy exceptions and resource approvals',
        'Vendor Support: Third-party software or hardware issues'
      ],
      process: [
        'Analyze the root cause of the issue',
        'Determine which team has the expertise to resolve it',
        'Consider organizational hierarchy and approval requirements',
        'Select the most appropriate escalation target'
      ],
      examples: [
        'L2 Support: Complex software troubleshooting',
        'Sys Admin: Email server configuration issues',
        'Security: Suspected malware infection',
        'Management: Budget approval for emergency hardware'
      ]
    }
  },
  {
    id: 'documentation_requirements',
    title: 'Documentation Requirements',
    icon: <BookOpen size={20} />,
    content: {
      description: 'Proper documentation ensures smooth handoff and knowledge transfer.',
      criteria: [
        'Complete problem description with symptoms',
        'Detailed list of attempted solutions and outcomes',
        'Customer information and verification status',
        'Business impact assessment',
        'Urgency and deadline requirements',
        'Technical specifications and error messages'
      ],
      process: [
        'Gather all relevant information before escalating',
        'Document troubleshooting steps in chronological order',
        'Include screenshots or error logs where applicable',
        'Verify customer identity and authorization',
        'Assess and document business impact',
        'Set clear expectations with customer about escalation'
      ],
      examples: [
        'Error message screenshots with timestamps',
        'Step-by-step reproduction instructions',
        'System configuration details',
        'Customer verification checklist completion'
      ]
    }
  },
  {
    id: 'communication_protocols',
    title: 'Communication Protocols',
    icon: <AlertCircle size={20} />,
    content: {
      description: 'Effective communication during escalation maintains customer satisfaction and team coordination.',
      criteria: [
        'Inform customer about escalation process and timeline',
        'Provide clear handoff summary to escalation team',
        'Set realistic expectations for resolution time',
        'Maintain professional communication throughout',
        'Follow up on escalation progress when appropriate'
      ],
      process: [
        'Notify customer before initiating escalation',
        'Explain reason for escalation and next steps',
        'Provide escalation team with complete context',
        'Confirm escalation acceptance and timeline',
        'Update customer on escalation status',
        'Remain available for additional context if needed'
      ],
      examples: [
        'Customer notification: "I need to escalate this to our infrastructure team"',
        'Handoff summary: "Attempted X, Y, Z solutions with these results"',
        'Timeline communication: "L2 team will respond within 2 hours"'
      ],
      warnings: [
        'Never escalate without informing the customer',
        'Do not promise specific resolution times from other teams',
        'Avoid technical jargon when explaining to customers'
      ]
    }
  },
  {
    id: 'quality_standards',
    title: 'Quality Standards',
    icon: <CheckCircle size={20} />,
    content: {
      description: 'Maintain high quality standards throughout the escalation process.',
      criteria: [
        'Complete all required fields in escalation form',
        'Verify information accuracy before submission',
        'Ensure customer identity verification is complete',
        'Provide sufficient detail for immediate action',
        'Follow company escalation procedures exactly',
        'Maintain confidentiality and security protocols'
      ],
      process: [
        'Review escalation form for completeness',
        'Validate all technical information provided',
        'Confirm customer authorization for escalation',
        'Double-check escalation target selection',
        'Submit escalation through proper channels',
        'Monitor escalation status and respond promptly'
      ],
      examples: [
        'Complete verification checklist before escalating',
        'Include all error codes and system information',
        'Verify business impact assessment accuracy',
        'Confirm customer consent for data sharing'
      ],
      warnings: [
        'Incomplete escalations will be rejected',
        'Inaccurate information delays resolution',
        'Unauthorized escalations violate security policy'
      ]
    }
  }
];

export const EscalationGuidelines: React.FC<EscalationGuidelinesProps> = ({
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['when_to_escalate']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const expandAllSections = () => {
    setExpandedSections(new Set(ESCALATION_GUIDELINES.map(g => g.id)));
  };

  const collapseAllSections = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className={`escalation-guidelines ${className}`}>
      {/* Header */}
      <div className="guidelines-header">
        <div className="header-title">
          <ArrowUp size={24} className="text-blue-600" />
          <h2>Escalation Guidelines</h2>
        </div>
        <div className="header-actions">
          <button
            onClick={expandAllSections}
            className="header-action expand-all"
          >
            Expand All
          </button>
          <button
            onClick={collapseAllSections}
            className="header-action collapse-all"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="guidelines-overview">
        <div className="overview-content">
          <Info size={20} className="overview-icon" />
          <div className="overview-text">
            <p>
              Proper escalation ensures issues are resolved efficiently while maintaining customer satisfaction. 
              Follow these guidelines to escalate tickets professionally and effectively.
            </p>
          </div>
        </div>
      </div>

      {/* Guidelines Sections */}
      <div className="guidelines-sections">
        {ESCALATION_GUIDELINES.map(section => {
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <div key={section.id} className="guideline-section">
              {/* Section Header */}
              <div 
                className="section-header"
                onClick={() => toggleSection(section.id)}
              >
                <div className="section-title">
                  <div className="section-icon">
                    {section.icon}
                  </div>
                  <h3>{section.title}</h3>
                </div>
                <div className="section-toggle">
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="section-content">
                  {/* Description */}
                  <div className="content-description">
                    <p>{section.content.description}</p>
                  </div>

                  {/* Criteria */}
                  <div className="content-subsection">
                    <h4>Key Points:</h4>
                    <ul className="criteria-list">
                      {section.content.criteria.map((criterion, index) => (
                        <li key={index} className="criterion-item">
                          <CheckCircle size={16} className="criterion-icon" />
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Process */}
                  <div className="content-subsection">
                    <h4>Process Steps:</h4>
                    <ol className="process-list">
                      {section.content.process.map((step, index) => (
                        <li key={index} className="process-step">
                          <span className="step-number">{index + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Examples */}
                  <div className="content-subsection">
                    <h4>Examples:</h4>
                    <div className="examples-list">
                      {section.content.examples.map((example, index) => (
                        <div key={index} className="example-item">
                          <Info size={14} className="example-icon" />
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warnings */}
                  {section.content.warnings && (
                    <div className="content-subsection warnings">
                      <h4>Important Warnings:</h4>
                      <div className="warnings-list">
                        {section.content.warnings.map((warning, index) => (
                          <div key={index} className="warning-item">
                            <AlertTriangle size={14} className="warning-icon text-red-500" />
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Reference */}
      <div className="quick-reference">
        <h3>Quick Reference</h3>
        <div className="reference-grid">
          <div className="reference-card">
            <Shield size={24} className="reference-icon text-blue-600" />
            <h4>Before Escalating</h4>
            <ul>
              <li>Complete customer verification</li>
              <li>Document attempted solutions</li>
              <li>Assess business impact</li>
              <li>Gather technical details</li>
            </ul>
          </div>
          
          <div className="reference-card">
            <ArrowUp size={24} className="reference-icon text-green-600" />
            <h4>During Escalation</h4>
            <ul>
              <li>Choose correct category and target</li>
              <li>Provide complete information</li>
              <li>Set customer expectations</li>
              <li>Maintain communication</li>
            </ul>
          </div>
          
          <div className="reference-card">
            <Clock size={24} className="reference-icon text-orange-600" />
            <h4>After Escalation</h4>
            <ul>
              <li>Monitor escalation progress</li>
              <li>Update customer on status</li>
              <li>Provide additional context if needed</li>
              <li>Learn from resolution</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Emergency Escalation */}
      <div className="emergency-escalation">
        <div className="emergency-header">
          <AlertTriangle size={20} className="text-red-600" />
          <h3>Emergency Escalation</h3>
        </div>
        <div className="emergency-content">
          <p>
            For critical issues affecting business operations or security, use immediate escalation procedures:
          </p>
          <ul className="emergency-steps">
            <li>Contact escalation target directly via phone or chat</li>
            <li>Submit formal escalation within 15 minutes</li>
            <li>Notify customer of emergency escalation status</li>
            <li>Remain available for immediate consultation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EscalationGuidelines;