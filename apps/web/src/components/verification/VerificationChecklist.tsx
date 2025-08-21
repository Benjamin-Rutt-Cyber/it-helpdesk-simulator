import React, { useState, useCallback, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  User, 
  Shield, 
  Phone, 
  Building, 
  Hash,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

export interface VerificationField {
  id: string;
  name: string;
  label: string;
  required: boolean;
  type: 'text' | 'select' | 'phone' | 'email';
  status: 'pending' | 'in_progress' | 'verified' | 'failed';
  value?: string;
  options?: string[];
  verificationMethod?: string;
  verifiedAt?: Date;
  attempts?: number;
  maxAttempts?: number;
}

export interface VerificationRequirements {
  customerName: VerificationField;
  username: VerificationField;
  assetTag: VerificationField;
  department: VerificationField;
  contactInfo: VerificationField;
}

export interface VerificationChecklistProps {
  ticketId: string;
  requirements: VerificationRequirements;
  onFieldUpdate: (fieldId: string, updates: Partial<VerificationField>) => void;
  onVerificationComplete?: (isComplete: boolean) => void;
  onStartVerification?: (fieldId: string) => void;
  isBlocked?: boolean;
  className?: string;
}

export interface VerificationProgress {
  totalFields: number;
  completedFields: number;
  failedFields: number;
  inProgressFields: number;
  completionPercentage: number;
  isComplete: boolean;
}

const VERIFICATION_METHODS = [
  { id: 'direct', name: 'Direct Question', description: 'Ask customer directly' },
  { id: 'knowledge', name: 'Knowledge-Based', description: 'Ask about account details' },
  { id: 'callback', name: 'Callback', description: 'Verify through official contact' },
  { id: 'email', name: 'Email Verification', description: 'Verify via email' },
  { id: 'manager', name: 'Manager Approval', description: 'Supervisor authorization' }
];

export const VerificationChecklist: React.FC<VerificationChecklistProps> = ({
  ticketId,
  requirements,
  onFieldUpdate,
  onVerificationComplete,
  onStartVerification,
  isBlocked = true,
  className = ''
}) => {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [showGuidance, setShowGuidance] = useState<Set<string>>(new Set());
  const [verificationStartTime] = useState(new Date());

  // Calculate verification progress
  const calculateProgress = useCallback((): VerificationProgress => {
    const fields = Object.values(requirements);
    const totalFields = fields.length;
    const completedFields = fields.filter(f => f.status === 'verified').length;
    const failedFields = fields.filter(f => f.status === 'failed').length;
    const inProgressFields = fields.filter(f => f.status === 'in_progress').length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);
    const isComplete = completedFields === totalFields;

    return {
      totalFields,
      completedFields,
      failedFields,
      inProgressFields,
      completionPercentage,
      isComplete
    };
  }, [requirements]);

  const progress = calculateProgress();

  // Notify parent of completion status changes
  useEffect(() => {
    if (onVerificationComplete) {
      onVerificationComplete(progress.isComplete);
    }
  }, [progress.isComplete, onVerificationComplete]);

  const handleFieldValueChange = useCallback((fieldId: string, value: string) => {
    onFieldUpdate(fieldId, { value });
  }, [onFieldUpdate]);

  const handleStartVerification = useCallback((fieldId: string) => {
    onFieldUpdate(fieldId, { 
      status: 'in_progress',
      attempts: (requirements[fieldId as keyof VerificationRequirements]?.attempts || 0) + 1
    });
    
    if (onStartVerification) {
      onStartVerification(fieldId);
    }
  }, [requirements, onFieldUpdate, onStartVerification]);

  const handleVerificationSuccess = useCallback((fieldId: string, method: string) => {
    onFieldUpdate(fieldId, {
      status: 'verified',
      verificationMethod: method,
      verifiedAt: new Date()
    });
  }, [onFieldUpdate]);

  const handleVerificationFailed = useCallback((fieldId: string) => {
    onFieldUpdate(fieldId, { 
      status: 'failed',
      attempts: (requirements[fieldId as keyof VerificationRequirements]?.attempts || 0) + 1
    });
  }, [requirements, onFieldUpdate]);

  const toggleFieldExpanded = useCallback((fieldId: string) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  }, []);

  const toggleGuidance = useCallback((fieldId: string) => {
    setShowGuidance(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  }, []);

  const getStatusIcon = (status: VerificationField['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'failed':
        return <XCircle size={20} className="text-red-500" />;
      case 'in_progress':
        return <Clock size={20} className="text-blue-500 animate-pulse" />;
      case 'pending':
      default:
        return <AlertCircle size={20} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: VerificationField['status']) => {
    switch (status) {
      case 'verified': return 'border-green-500 bg-green-50';
      case 'failed': return 'border-red-500 bg-red-50';
      case 'in_progress': return 'border-blue-500 bg-blue-50';
      case 'pending': return 'border-gray-300 bg-gray-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getFieldIcon = (fieldId: string) => {
    switch (fieldId) {
      case 'customerName': return <User size={18} />;
      case 'username': return <Hash size={18} />;
      case 'assetTag': return <Shield size={18} />;
      case 'department': return <Building size={18} />;
      case 'contactInfo': return <Phone size={18} />;
      default: return <AlertCircle size={18} />;
    }
  };

  const getVerificationGuidance = (fieldId: string): { questions: string[]; tips: string[] } => {
    switch (fieldId) {
      case 'customerName':
        return {
          questions: [
            "Can you please confirm your full name as it appears in our system?",
            "What name do you go by professionally?",
            "Could you spell your last name for me?"
          ],
          tips: [
            "Match the name exactly as it appears in the directory",
            "Be aware of preferred names vs. legal names",
            "Note any discrepancies for further verification"
          ]
        };
      case 'username':
        return {
          questions: [
            "What's your network username or login ID?",
            "What username do you use to log into your computer?",
            "Can you confirm your email address prefix?"
          ],
          tips: [
            "Username should match company format",
            "Verify against Active Directory if possible",
            "Be aware of recent name changes"
          ]
        };
      case 'assetTag':
        return {
          questions: [
            "Can you provide the asset tag number on your computer?",
            "What's the service tag or serial number on your device?",
            "Is there a property tag or barcode on your equipment?"
          ],
          tips: [
            "Asset tags are usually on stickers",
            "May be located on side, back, or bottom of device",
            "Accept alternative identifiers if asset tag missing"
          ]
        };
      case 'department':
        return {
          questions: [
            "Which department do you work in?",
            "Who is your direct supervisor?",
            "What team or division are you part of?"
          ],
          tips: [
            "Verify department exists in organizational chart",
            "Cross-check with supervisor information",
            "Be aware of recent organizational changes"
          ]
        };
      case 'contactInfo':
        return {
          questions: [
            "Can you confirm your phone number?",
            "What's the best number to reach you at?",
            "Is your contact information up to date in our system?"
          ],
          tips: [
            "Verify against company directory",
            "Offer callback verification if uncertain",
            "Update contact info if needed"
          ]
        };
      default:
        return { questions: [], tips: [] };
    }
  };

  return (
    <div className={`verification-checklist ${className}`}>
      {/* Header */}
      <div className="verification-header">
        <div className="header-content">
          <div className="header-title">
            <Shield size={24} className="text-blue-600" />
            <h2>Customer Identity Verification</h2>
          </div>
          <div className="ticket-info">
            <span className="ticket-id">Ticket #{ticketId}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="verification-progress">
          <div className="progress-header">
            <span className="progress-label">Verification Progress</span>
            <span className="progress-percentage">{progress.completionPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress.completionPercentage}%` }}
            />
          </div>
          <div className="progress-stats">
            <span className="stat-item verified">
              <CheckCircle size={14} />
              {progress.completedFields} verified
            </span>
            <span className="stat-item in-progress">
              <Clock size={14} />
              {progress.inProgressFields} in progress
            </span>
            <span className="stat-item failed">
              <XCircle size={14} />
              {progress.failedFields} failed
            </span>
          </div>
        </div>

        {/* Blocking Message */}
        {isBlocked && !progress.isComplete && (
          <div className="blocking-message">
            <AlertCircle size={16} className="text-amber-500" />
            <span>
              Resolution actions are blocked until customer identity verification is complete.
            </span>
          </div>
        )}

        {/* Completion Message */}
        {progress.isComplete && (
          <div className="completion-message">
            <CheckCircle size={16} className="text-green-500" />
            <span>
              Customer identity verification completed successfully. You may proceed with ticket resolution.
            </span>
          </div>
        )}
      </div>

      {/* Verification Fields */}
      <div className="verification-fields">
        {Object.entries(requirements).map(([fieldId, field]) => {
          const isExpanded = expandedFields.has(fieldId);
          const showFieldGuidance = showGuidance.has(fieldId);
          const guidance = getVerificationGuidance(fieldId);

          return (
            <div
              key={fieldId}
              className={`verification-field ${getStatusColor(field.status)}`}
            >
              {/* Field Header */}
              <div 
                className="field-header"
                onClick={() => toggleFieldExpanded(fieldId)}
              >
                <div className="field-info">
                  <div className="field-icon">
                    {getFieldIcon(fieldId)}
                  </div>
                  <div className="field-details">
                    <div className="field-name">
                      {field.label}
                      {field.required && <span className="required-indicator">*</span>}
                    </div>
                    <div className="field-status">
                      {getStatusIcon(field.status)}
                      <span className={`status-text ${field.status}`}>
                        {field.status.charAt(0).toUpperCase() + field.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="field-actions">
                  {field.attempts && field.attempts > 0 && (
                    <span className="attempt-count">
                      Attempt {field.attempts}{field.maxAttempts && `/${field.maxAttempts}`}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGuidance(fieldId);
                    }}
                    className="guidance-button"
                    title="Show verification guidance"
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {/* Field Details (Expanded) */}
              {isExpanded && (
                <div className="field-details-expanded">
                  {/* Current Value */}
                  <div className="field-input">
                    <label htmlFor={`${fieldId}-input`}>Current Value:</label>
                    <input
                      id={`${fieldId}-input`}
                      type={field.type === 'phone' ? 'tel' : 'text'}
                      value={field.value || ''}
                      onChange={(e) => handleFieldValueChange(fieldId, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="verification-input"
                    />
                  </div>

                  {/* Verification Method */}
                  <div className="verification-method">
                    <label>Verification Method:</label>
                    <select
                      value={field.verificationMethod || ''}
                      onChange={(e) => onFieldUpdate(fieldId, { verificationMethod: e.target.value })}
                      className="method-select"
                    >
                      <option value="">Select method...</option>
                      {VERIFICATION_METHODS.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} - {method.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Verification Actions */}
                  <div className="verification-actions">
                    {field.status === 'pending' && (
                      <button
                        onClick={() => handleStartVerification(fieldId)}
                        className="action-button start-verification"
                      >
                        <Clock size={16} />
                        Start Verification
                      </button>
                    )}

                    {field.status === 'in_progress' && (
                      <div className="in-progress-actions">
                        <button
                          onClick={() => handleVerificationSuccess(fieldId, field.verificationMethod || 'direct')}
                          className="action-button verify-success"
                          disabled={!field.value || !field.verificationMethod}
                        >
                          <CheckCircle size={16} />
                          Mark Verified
                        </button>
                        <button
                          onClick={() => handleVerificationFailed(fieldId)}
                          className="action-button verify-failed"
                        >
                          <XCircle size={16} />
                          Mark Failed
                        </button>
                      </div>
                    )}

                    {field.status === 'failed' && (
                      <button
                        onClick={() => handleStartVerification(fieldId)}
                        className="action-button retry-verification"
                        disabled={field.attempts && field.maxAttempts && field.attempts >= field.maxAttempts}
                      >
                        <Clock size={16} />
                        Retry Verification
                      </button>
                    )}

                    {field.status === 'verified' && field.verifiedAt && (
                      <div className="verified-info">
                        <span className="verified-timestamp">
                          Verified at: {field.verifiedAt.toLocaleTimeString()}
                        </span>
                        <span className="verified-method">
                          Method: {VERIFICATION_METHODS.find(m => m.id === field.verificationMethod)?.name || 'Unknown'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Verification Guidance */}
                  {showFieldGuidance && (
                    <div className="verification-guidance">
                      <h4>Verification Guidance</h4>
                      
                      <div className="guidance-section">
                        <h5>Suggested Questions:</h5>
                        <ul className="guidance-list">
                          {guidance.questions.map((question, index) => (
                            <li key={index} className="guidance-item">
                              "{question}"
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="guidance-section">
                        <h5>Verification Tips:</h5>
                        <ul className="guidance-list">
                          {guidance.tips.map((tip, index) => (
                            <li key={index} className="guidance-item">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Verification Summary */}
      <div className="verification-summary">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Time Elapsed:</span>
            <span className="stat-value">
              {Math.round((Date.now() - verificationStartTime.getTime()) / 1000 / 60)} min
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Fields Remaining:</span>
            <span className="stat-value">
              {progress.totalFields - progress.completedFields}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Success Rate:</span>
            <span className="stat-value">
              {progress.totalFields > 0 ? Math.round((progress.completedFields / progress.totalFields) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="summary-actions">
          <button
            onClick={() => setExpandedFields(new Set(Object.keys(requirements)))}
            className="summary-action expand-all"
          >
            Expand All Fields
          </button>
          <button
            onClick={() => setExpandedFields(new Set())}
            className="summary-action collapse-all"
          >
            Collapse All Fields
          </button>
          <button
            onClick={() => setShowGuidance(new Set(Object.keys(requirements)))}
            className="summary-action show-all-guidance"
          >
            Show All Guidance
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationChecklist;