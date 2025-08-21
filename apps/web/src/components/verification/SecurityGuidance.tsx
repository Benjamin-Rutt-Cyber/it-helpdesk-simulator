import React, { useState, useCallback } from 'react';
import {
  Shield,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Target,
  Users,
  Lock,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  Clock,
  Award,
} from 'lucide-react';

interface SecurityGuidanceProps {
  context?: 'verification' | 'general' | 'training';
  currentStep?: string;
  showTips?: boolean;
  onTipApplied?: (tipId: string) => void;
  verificationStatus?: {
    customerName: boolean;
    username: boolean;
    assetTag: boolean;
    department: boolean;
    contactInfo: boolean;
  };
}

interface GuidanceTip {
  id: string;
  title: string;
  content: string;
  category: 'verification' | 'communication' | 'security' | 'documentation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  applicableSteps: string[];
  example?: string;
}

interface GuidanceSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  tips: GuidanceTip[];
  expanded: boolean;
}

export const SecurityGuidance: React.FC<SecurityGuidanceProps> = ({
  context = 'verification',
  currentStep,
  showTips = true,
  onTipApplied,
  verificationStatus,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['why-verification']));
  const [selectedTip, setSelectedTip] = useState<string | null>(null);
  const [showAllTips, setShowAllTips] = useState(false);

  const guidanceSections: GuidanceSection[] = [
    {
      id: 'why-verification',
      title: 'Why Verification Matters',
      icon: <Shield className="w-5 h-5" />,
      content: 'Customer identity verification is a critical security control that protects both the organization and customers from unauthorized access, social engineering attacks, and data breaches.',
      expanded: true,
      tips: [
        {
          id: 'security-importance',
          title: 'Security Foundation',
          content: 'Verification prevents 85% of social engineering attacks by confirming customer identity.',
          category: 'security',
          difficulty: 'beginner',
          applicableSteps: ['customerName', 'username'],
          example: 'Always verify at least 2 pieces of information before proceeding with support.'
        },
        {
          id: 'legal-compliance',
          title: 'Legal Requirements',
          content: 'Many regulations (SOX, HIPAA, PCI-DSS) require proper identity verification.',
          category: 'security',
          difficulty: 'intermediate',
          applicableSteps: ['all'],
          example: 'Document verification attempts for compliance auditing.'
        }
      ]
    },
    {
      id: 'verification-best-practices',
      title: 'Verification Best Practices',
      icon: <Target className="w-5 h-5" />,
      content: 'Professional techniques for effective and efficient customer verification that maintain security while preserving customer experience.',
      expanded: false,
      tips: [
        {
          id: 'multiple-sources',
          title: 'Use Multiple Sources',
          content: 'Verify information from at least 2-3 independent sources for higher confidence.',
          category: 'verification',
          difficulty: 'intermediate',
          applicableSteps: ['customerName', 'username', 'assetTag'],
          example: 'Verify name from ticket, username from system, and asset tag from inventory.'
        },
        {
          id: 'natural-conversation',
          title: 'Natural Integration',
          content: 'Integrate verification questions naturally into the conversation flow.',
          category: 'communication',
          difficulty: 'advanced',
          applicableSteps: ['all'],
          example: 'Instead of "What is your username?", try "Let me verify I have the correct account - what username are you using to log in?"'
        }
      ]
    },
    {
      id: 'difficult-situations',
      title: 'Handling Difficult Situations',
      icon: <AlertTriangle className="w-5 h-5" />,
      content: 'Strategies for managing resistant, confused, or uncooperative customers during the verification process.',
      expanded: false,
      tips: [
        {
          id: 'resistant-customer',
          title: 'Resistant Customers',
          content: 'Explain the security benefits and offer alternative verification methods.',
          category: 'communication',
          difficulty: 'advanced',
          applicableSteps: ['all'],
          example: 'I understand this seems like extra steps, but this verification protects your account from unauthorized changes. Would you prefer to verify through email instead?'
        },
        {
          id: 'incomplete-information',
          title: 'Incomplete Information',
          content: 'When customers cannot provide all required information, use alternative methods.',
          category: 'verification',
          difficulty: 'intermediate',
          applicableSteps: ['contactInfo', 'department'],
          example: 'If they don\'t know their asset tag, verify through manager contact or department head.'
        }
      ]
    },
    {
      id: 'alternative-methods',
      title: 'Alternative Verification',
      icon: <Users className="w-5 h-5" />,
      content: 'When standard verification isn\'t possible, these alternative methods maintain security while providing flexibility.',
      expanded: false,
      tips: [
        {
          id: 'callback-verification',
          title: 'Callback Method',
          content: 'Call back on official contact number to verify identity independently.',
          category: 'verification',
          difficulty: 'intermediate',
          applicableSteps: ['contactInfo'],
          example: 'I\'ll need to call you back on your official work number to verify this request.'
        },
        {
          id: 'manager-approval',
          title: 'Manager Verification',
          content: 'Get verification from customer\'s direct supervisor when direct verification fails.',
          category: 'verification',
          difficulty: 'advanced',
          applicableSteps: ['department'],
          example: 'Let me contact your manager to verify this request is authorized.'
        }
      ]
    },
    {
      id: 'documentation',
      title: 'Proper Documentation',
      icon: <BookOpen className="w-5 h-5" />,
      content: 'Document verification attempts and results for security auditing and process improvement.',
      expanded: false,
      tips: [
        {
          id: 'verification-logging',
          title: 'Complete Records',
          content: 'Log all verification attempts, methods used, and final results.',
          category: 'documentation',
          difficulty: 'beginner',
          applicableSteps: ['all'],
          example: 'Customer verified via username and asset tag. Attempted phone verification - number not current.'
        },
        {
          id: 'escalation-notes',
          title: 'Escalation Details',
          content: 'When escalating, include detailed verification status and attempts made.',
          category: 'documentation',
          difficulty: 'intermediate',
          applicableSteps: ['all'],
          example: 'Escalating: Customer provided name and username but unable to verify asset tag or contact info. Suggested callback verification.'
        }
      ]
    }
  ];

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const getContextualTips = useCallback(() => {
    if (!currentStep || !showTips) return [];
    
    const allTips = guidanceSections.flatMap(section => section.tips);
    return allTips.filter(tip => 
      tip.applicableSteps.includes(currentStep) || tip.applicableSteps.includes('all')
    );
  }, [currentStep, showTips]);

  const getProgressInsights = useCallback(() => {
    if (!verificationStatus) return null;
    
    const verified = Object.values(verificationStatus).filter(Boolean).length;
    const total = Object.keys(verificationStatus).length;
    const percentage = Math.round((verified / total) * 100);
    
    if (percentage === 100) {
      return {
        type: 'success' as const,
        message: 'Excellent! All verification requirements completed.',
        icon: <Award className="w-4 h-4" />
      };
    } else if (percentage >= 60) {
      return {
        type: 'warning' as const,
        message: `Good progress! ${verified}/${total} requirements verified.`,
        icon: <Star className="w-4 h-4" />
      };
    } else {
      return {
        type: 'info' as const,
        message: `Getting started: ${verified}/${total} requirements verified.`,
        icon: <Clock className="w-4 h-4" />
      };
    }
  }, [verificationStatus]);

  const contextualTips = getContextualTips();
  const progressInsights = getProgressInsights();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Security Guidance</h3>
      </div>

      {/* Progress Insights */}
      {progressInsights && (
        <div className={`mb-6 p-4 rounded-lg border ${
          progressInsights.type === 'success' ? 'bg-green-50 border-green-200' :
          progressInsights.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {progressInsights.icon}
            <span className="text-sm font-medium text-gray-700">
              {progressInsights.message}
            </span>
          </div>
        </div>
      )}

      {/* Contextual Tips */}
      {contextualTips.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-gray-900">Tips for Current Step</h4>
          </div>
          <div className="space-y-3">
            {contextualTips.slice(0, showAllTips ? contextualTips.length : 2).map(tip => (
              <div
                key={tip.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTip === tip.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => {
                  setSelectedTip(selectedTip === tip.id ? null : tip.id);
                  if (onTipApplied) onTipApplied(tip.id);
                }}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-1 px-2 py-1 rounded text-xs font-medium ${
                    tip.category === 'verification' ? 'bg-blue-100 text-blue-800' :
                    tip.category === 'communication' ? 'bg-green-100 text-green-800' :
                    tip.category === 'security' ? 'bg-red-100 text-red-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {tip.category}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{tip.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{tip.content}</p>
                    {selectedTip === tip.id && tip.example && (
                      <div className="mt-2 p-2 bg-white rounded border-l-4 border-blue-400">
                        <p className="text-sm text-gray-700 font-medium">Example:</p>
                        <p className="text-sm text-gray-600 mt-1">{tip.example}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {contextualTips.length > 2 && (
              <button
                onClick={() => setShowAllTips(!showAllTips)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                {showAllTips ? 'Show less' : `Show ${contextualTips.length - 2} more tips`}
                {showAllTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guidance Sections */}
      <div className="space-y-4">
        {guidanceSections.map(section => (
          <div key={section.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {section.icon}
                <h4 className="font-medium text-gray-900">{section.title}</h4>
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.has(section.id) && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">{section.content}</p>
                
                {section.tips.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Key Tips
                    </h5>
                    {section.tips.map(tip => (
                      <div key={tip.id} className="pl-6 border-l-2 border-gray-100">
                        <div className="flex items-start gap-2">
                          <div className={`mt-1 px-2 py-1 rounded text-xs font-medium ${
                            tip.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            tip.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tip.difficulty}
                          </div>
                          <div className="flex-1">
                            <h6 className="text-sm font-medium text-gray-900">{tip.title}</h6>
                            <p className="text-xs text-gray-600 mt-1">{tip.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <ExternalLink className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-blue-900">Additional Resources</h4>
        </div>
        <div className="space-y-1 text-sm text-blue-800">
          <p>• Security Policy Handbook (internal)</p>
          <p>• Customer Verification Training Module</p>
          <p>• Escalation Procedures Guide</p>
          <p>• Compliance Requirements Reference</p>
        </div>
      </div>
    </div>
  );
};

export default SecurityGuidance;