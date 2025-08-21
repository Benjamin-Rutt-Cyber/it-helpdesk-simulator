import React, { useState, useCallback, useEffect } from 'react';
import { 
  ArrowUp, 
  AlertCircle, 
  Clock, 
  User, 
  FileText, 
  Shield, 
  Settings, 
  HardDrive,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

export interface EscalationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiredFields: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface EscalationRequest {
  id: string;
  ticketId: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  justification: string;
  technicalDetails: string;
  attemptedSolutions: string[];
  requiredPermissions?: string;
  businessImpact: string;
  deadline?: Date;
  escalationTarget: string;
  customerNotified: boolean;
  attachments: string[];
  createdAt: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface EscalationFormProps {
  ticketId: string;
  onSubmit: (request: Partial<EscalationRequest>) => void;
  onCancel: () => void;
  initialData?: Partial<EscalationRequest>;
  className?: string;
}

const ESCALATION_CATEGORIES: EscalationCategory[] = [
  {
    id: 'technical_complexity',
    name: 'Technical Complexity',
    description: 'Issue requires specialized knowledge or advanced troubleshooting',
    icon: <Settings size={20} />,
    requiredFields: ['technicalDetails', 'attemptedSolutions', 'businessImpact'],
    priority: 'medium'
  },
  {
    id: 'permissions',
    name: 'Permissions Required',
    description: 'Resolution requires elevated privileges or admin access',
    icon: <Shield size={20} />,
    requiredFields: ['requiredPermissions', 'justification', 'businessImpact'],
    priority: 'high'
  },
  {
    id: 'hardware_failure',
    name: 'Hardware Failure',
    description: 'Physical hardware replacement or repair needed',
    icon: <HardDrive size={20} />,
    requiredFields: ['technicalDetails', 'businessImpact', 'deadline'],
    priority: 'high'
  },
  {
    id: 'policy_exception',
    name: 'Policy Exception',
    description: 'Request requires exception to company policies',
    icon: <AlertCircle size={20} />,
    requiredFields: ['justification', 'businessImpact', 'escalationTarget'],
    priority: 'critical'
  },
  {
    id: 'resource_intensive',
    name: 'Resource Intensive',
    description: 'Solution requires significant time or system resources',
    icon: <Clock size={20} />,
    requiredFields: ['technicalDetails', 'businessImpact', 'deadline'],
    priority: 'medium'
  }
];

const ESCALATION_TARGETS = [
  { id: 'l2_support', name: 'Level 2 Support', description: 'Advanced technical support team' },
  { id: 'system_admin', name: 'System Administrator', description: 'Infrastructure and permissions' },
  { id: 'security_team', name: 'Security Team', description: 'Security-related issues' },
  { id: 'management', name: 'IT Management', description: 'Policy exceptions and approvals' },
  { id: 'vendor_support', name: 'Vendor Support', description: 'Third-party vendor assistance' }
];

export const EscalationForm: React.FC<EscalationFormProps> = ({
  ticketId,
  onSubmit,
  onCancel,
  initialData,
  className = ''
}) => {
  const [formData, setFormData] = useState<Partial<EscalationRequest>>({
    ticketId,
    category: '',
    priority: 'medium',
    justification: '',
    technicalDetails: '',
    attemptedSolutions: [],
    businessImpact: '',
    escalationTarget: '',
    customerNotified: false,
    attachments: [],
    status: 'draft',
    ...initialData
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAttemptedSolution, setNewAttemptedSolution] = useState('');

  const selectedCategory = ESCALATION_CATEGORIES.find(cat => cat.id === formData.category);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.category) {
      errors.category = 'Escalation category is required';
    }

    if (!formData.justification?.trim()) {
      errors.justification = 'Justification is required';
    } else if (formData.justification.length < 50) {
      errors.justification = 'Justification must be at least 50 characters';
    }

    if (!formData.businessImpact?.trim()) {
      errors.businessImpact = 'Business impact description is required';
    }

    if (!formData.escalationTarget) {
      errors.escalationTarget = 'Escalation target must be selected';
    }

    if (selectedCategory) {
      selectedCategory.requiredFields.forEach(field => {
        if (field === 'attemptedSolutions' && (!formData.attemptedSolutions || formData.attemptedSolutions.length === 0)) {
          errors.attemptedSolutions = 'At least one attempted solution is required';
        } else if (field !== 'attemptedSolutions' && !formData[field as keyof EscalationRequest]) {
          errors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required for this category`;
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, selectedCategory]);

  const handleInputChange = useCallback((field: keyof EscalationRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleCategoryChange = useCallback((categoryId: string) => {
    const category = ESCALATION_CATEGORIES.find(cat => cat.id === categoryId);
    setFormData(prev => ({
      ...prev,
      category: categoryId,
      priority: category?.priority || 'medium'
    }));
  }, []);

  const addAttemptedSolution = useCallback(() => {
    if (newAttemptedSolution.trim()) {
      setFormData(prev => ({
        ...prev,
        attemptedSolutions: [...(prev.attemptedSolutions || []), newAttemptedSolution.trim()]
      }));
      setNewAttemptedSolution('');
    }
  }, [newAttemptedSolution]);

  const removeAttemptedSolution = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      attemptedSolutions: prev.attemptedSolutions?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        createdAt: new Date(),
        status: 'submitted'
      });
    } catch (error) {
      console.error('Error submitting escalation:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`escalation-form ${className}`}>
      {/* Header */}
      <div className="form-header">
        <div className="header-title">
          <ArrowUp size={24} className="text-blue-600" />
          <h2>Escalation Request</h2>
        </div>
        <div className="ticket-info">
          <span className="ticket-id">Ticket #{ticketId}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="escalation-form-content">
        {/* Category Selection */}
        <div className="form-section">
          <h3>Escalation Category</h3>
          <div className="category-grid">
            {ESCALATION_CATEGORIES.map(category => (
              <div
                key={category.id}
                className={`category-card ${formData.category === category.id ? 'selected' : ''}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                <div className="category-header">
                  <div className="category-icon">
                    {category.icon}
                  </div>
                  <div className="category-info">
                    <h4>{category.name}</h4>
                    <span className={`priority-badge ${getPriorityColor(category.priority)}`}>
                      {category.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="category-description">{category.description}</p>
              </div>
            ))}
          </div>
          {validationErrors.category && (
            <div className="validation-error">
              <AlertCircle size={16} />
              {validationErrors.category}
            </div>
          )}
        </div>

        {/* Priority (Auto-set based on category, but editable) */}
        {formData.category && (
          <div className="form-section">
            <h3>Priority Level</h3>
            <div className="priority-selector">
              {['low', 'medium', 'high', 'critical'].map(priority => (
                <label key={priority} className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={formData.priority === priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  />
                  <span className={`priority-label ${getPriorityColor(priority)}`}>
                    {priority.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Escalation Target */}
        <div className="form-section">
          <h3>Escalation Target</h3>
          <select
            value={formData.escalationTarget || ''}
            onChange={(e) => handleInputChange('escalationTarget', e.target.value)}
            className="form-select"
          >
            <option value="">Select escalation target...</option>
            {ESCALATION_TARGETS.map(target => (
              <option key={target.id} value={target.id}>
                {target.name} - {target.description}
              </option>
            ))}
          </select>
          {validationErrors.escalationTarget && (
            <div className="validation-error">
              <AlertCircle size={16} />
              {validationErrors.escalationTarget}
            </div>
          )}
        </div>

        {/* Justification */}
        <div className="form-section">
          <h3>Justification <span className="required">*</span></h3>
          <textarea
            value={formData.justification || ''}
            onChange={(e) => handleInputChange('justification', e.target.value)}
            placeholder="Provide a detailed justification for this escalation. Explain why you cannot resolve this issue at your level and what specific assistance you need."
            className="form-textarea"
            rows={4}
          />
          <div className="character-count">
            {(formData.justification || '').length}/50 minimum
          </div>
          {validationErrors.justification && (
            <div className="validation-error">
              <AlertCircle size={16} />
              {validationErrors.justification}
            </div>
          )}
        </div>

        {/* Technical Details (if required) */}
        {selectedCategory?.requiredFields.includes('technicalDetails') && (
          <div className="form-section">
            <h3>Technical Details <span className="required">*</span></h3>
            <textarea
              value={formData.technicalDetails || ''}
              onChange={(e) => handleInputChange('technicalDetails', e.target.value)}
              placeholder="Provide technical details including error messages, system configurations, and relevant technical information."
              className="form-textarea"
              rows={4}
            />
            {validationErrors.technicalDetails && (
              <div className="validation-error">
                <AlertCircle size={16} />
                {validationErrors.technicalDetails}
              </div>
            )}
          </div>
        )}

        {/* Attempted Solutions */}
        {selectedCategory?.requiredFields.includes('attemptedSolutions') && (
          <div className="form-section">
            <h3>Attempted Solutions <span className="required">*</span></h3>
            <div className="attempted-solutions">
              <div className="solution-input">
                <input
                  type="text"
                  value={newAttemptedSolution}
                  onChange={(e) => setNewAttemptedSolution(e.target.value)}
                  placeholder="Describe a solution you tried..."
                  className="form-input"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttemptedSolution())}
                />
                <button
                  type="button"
                  onClick={addAttemptedSolution}
                  className="add-solution-btn"
                  disabled={!newAttemptedSolution.trim()}
                >
                  Add
                </button>
              </div>
              
              {formData.attemptedSolutions && formData.attemptedSolutions.length > 0 && (
                <div className="solutions-list">
                  {formData.attemptedSolutions.map((solution, index) => (
                    <div key={index} className="solution-item">
                      <span className="solution-text">{solution}</span>
                      <button
                        type="button"
                        onClick={() => removeAttemptedSolution(index)}
                        className="remove-solution-btn"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {validationErrors.attemptedSolutions && (
              <div className="validation-error">
                <AlertCircle size={16} />
                {validationErrors.attemptedSolutions}
              </div>
            )}
          </div>
        )}

        {/* Required Permissions (if applicable) */}
        {selectedCategory?.requiredFields.includes('requiredPermissions') && (
          <div className="form-section">
            <h3>Required Permissions <span className="required">*</span></h3>
            <textarea
              value={formData.requiredPermissions || ''}
              onChange={(e) => handleInputChange('requiredPermissions', e.target.value)}
              placeholder="Specify what permissions or access levels are needed to resolve this issue."
              className="form-textarea"
              rows={3}
            />
            {validationErrors.requiredPermissions && (
              <div className="validation-error">
                <AlertCircle size={16} />
                {validationErrors.requiredPermissions}
              </div>
            )}
          </div>
        )}

        {/* Business Impact */}
        <div className="form-section">
          <h3>Business Impact <span className="required">*</span></h3>
          <textarea
            value={formData.businessImpact || ''}
            onChange={(e) => handleInputChange('businessImpact', e.target.value)}
            placeholder="Describe how this issue affects business operations, productivity, or user workflow."
            className="form-textarea"
            rows={3}
          />
          {validationErrors.businessImpact && (
            <div className="validation-error">
              <AlertCircle size={16} />
              {validationErrors.businessImpact}
            </div>
          )}
        </div>

        {/* Deadline (if required) */}
        {selectedCategory?.requiredFields.includes('deadline') && (
          <div className="form-section">
            <h3>Resolution Deadline</h3>
            <input
              type="datetime-local"
              value={formData.deadline ? formData.deadline.toISOString().slice(0, 16) : ''}
              onChange={(e) => handleInputChange('deadline', e.target.value ? new Date(e.target.value) : undefined)}
              className="form-input"
            />
            {validationErrors.deadline && (
              <div className="validation-error">
                <AlertCircle size={16} />
                {validationErrors.deadline}
              </div>
            )}
          </div>
        )}

        {/* Customer Notification */}
        <div className="form-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.customerNotified || false}
              onChange={(e) => handleInputChange('customerNotified', e.target.checked)}
            />
            <span className="checkmark"></span>
            Customer has been notified of escalation
          </label>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || Object.keys(validationErrors).length > 0}
          >
            {isSubmitting ? (
              <>
                <Clock size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ArrowUp size={16} />
                Submit Escalation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EscalationForm;