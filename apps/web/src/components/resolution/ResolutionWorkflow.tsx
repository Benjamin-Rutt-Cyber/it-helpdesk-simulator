import React, { useState, useCallback, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  FileText, 
  TestTube, 
  Settings, 
  Star,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Info,
  Zap
} from 'lucide-react';

export interface ResolutionStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  type: 'verification' | 'testing' | 'documentation' | 'communication' | 'quality_check';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  attachments?: string[];
  qualityScore?: number; // 1-5 rating
  estimatedTime?: number; // minutes
  actualTime?: number; // minutes
}

export interface QualityGate {
  id: string;
  name: string;
  description: string;
  criteria: QualityCriterion[];
  required: boolean;
  status: 'pending' | 'passed' | 'failed';
  score?: number; // 1-5 rating
  feedback?: string;
}

export interface QualityCriterion {
  id: string;
  description: string;
  type: 'boolean' | 'rating' | 'text';
  required: boolean;
  value?: any;
  weight: number; // for scoring
}

export interface ResolutionWorkflowProps {
  ticketId: string;
  resolutionSteps: ResolutionStep[];
  qualityGates: QualityGate[];
  onStepUpdate: (stepId: string, updates: Partial<ResolutionStep>) => void;
  onQualityGateUpdate: (gateId: string, updates: Partial<QualityGate>) => void;
  onComplete: () => void;
  isReadOnly?: boolean;
  className?: string;
}

const DEFAULT_RESOLUTION_STEPS: ResolutionStep[] = [
  {
    id: 'problem_analysis',
    title: 'Problem Analysis',
    description: 'Analyze and document the root cause of the issue',
    required: true,
    type: 'verification',
    status: 'pending',
    estimatedTime: 15
  },
  {
    id: 'solution_implementation',
    title: 'Solution Implementation', 
    description: 'Implement the chosen solution',
    required: true,
    type: 'verification',
    status: 'pending',
    estimatedTime: 30
  },
  {
    id: 'solution_testing',
    title: 'Solution Testing',
    description: 'Test the solution to ensure it resolves the issue',
    required: true,
    type: 'testing',
    status: 'pending',
    estimatedTime: 10
  },
  {
    id: 'customer_verification',
    title: 'Customer Verification',
    description: 'Confirm with customer that the issue is resolved',
    required: true,
    type: 'communication',
    status: 'pending',
    estimatedTime: 5
  },
  {
    id: 'documentation',
    title: 'Resolution Documentation',
    description: 'Document the solution and steps taken',
    required: true,
    type: 'documentation',
    status: 'pending',
    estimatedTime: 10
  },
  {
    id: 'follow_up_planning',
    title: 'Follow-up Planning',
    description: 'Plan any necessary follow-up actions',
    required: false,
    type: 'communication',
    status: 'pending',
    estimatedTime: 5
  }
];

const DEFAULT_QUALITY_GATES: QualityGate[] = [
  {
    id: 'solution_quality',
    name: 'Solution Quality',
    description: 'Evaluate the quality and appropriateness of the solution',
    required: true,
    status: 'pending',
    criteria: [
      {
        id: 'addresses_root_cause',
        description: 'Solution addresses the root cause of the problem',
        type: 'boolean',
        required: true,
        weight: 3
      },
      {
        id: 'implementation_quality',
        description: 'Rate the quality of implementation (1-5)',
        type: 'rating',
        required: true,
        weight: 2
      },
      {
        id: 'future_prevention',
        description: 'Solution prevents similar issues in the future',
        type: 'boolean',
        required: false,
        weight: 1
      }
    ]
  },
  {
    id: 'customer_satisfaction',
    name: 'Customer Satisfaction',
    description: 'Ensure customer is satisfied with the resolution',
    required: true,
    status: 'pending',
    criteria: [
      {
        id: 'issue_resolved',
        description: 'Customer confirms the issue is fully resolved',
        type: 'boolean',
        required: true,
        weight: 3
      },
      {
        id: 'satisfaction_rating',
        description: 'Customer satisfaction rating (1-5)',
        type: 'rating',
        required: true,
        weight: 2
      },
      {
        id: 'additional_needs',
        description: 'Any additional needs or concerns addressed',
        type: 'text',
        required: false,
        weight: 1
      }
    ]
  },
  {
    id: 'documentation_quality',
    name: 'Documentation Quality',
    description: 'Verify documentation is complete and accurate',
    required: true,
    status: 'pending',
    criteria: [
      {
        id: 'steps_documented',
        description: 'All resolution steps are clearly documented',
        type: 'boolean',
        required: true,
        weight: 2
      },
      {
        id: 'reproducible',
        description: 'Documentation allows others to reproduce the solution',
        type: 'boolean',
        required: true,
        weight: 2
      },
      {
        id: 'knowledge_base_ready',
        description: 'Documentation is suitable for knowledge base',
        type: 'boolean',
        required: false,
        weight: 1
      }
    ]
  }
];

export const ResolutionWorkflow: React.FC<ResolutionWorkflowProps> = ({
  ticketId,
  resolutionSteps = DEFAULT_RESOLUTION_STEPS,
  qualityGates = DEFAULT_QUALITY_GATES,
  onStepUpdate,
  onQualityGateUpdate,
  onComplete,
  isReadOnly = false,
  className = ''
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [expandedGates, setExpandedGates] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<string>('');

  // Calculate overall progress
  const completedSteps = resolutionSteps.filter(step => step.status === 'completed').length;
  const totalRequiredSteps = resolutionSteps.filter(step => step.required).length;
  const completionPercentage = Math.round((completedSteps / resolutionSteps.length) * 100);
  
  const passedGates = qualityGates.filter(gate => gate.status === 'passed').length;
  const qualityScore = qualityGates.reduce((acc, gate) => acc + (gate.score || 0), 0) / qualityGates.length;

  const isWorkflowComplete = resolutionSteps.filter(step => step.required).every(step => step.status === 'completed') &&
                             qualityGates.filter(gate => gate.required).every(gate => gate.status === 'passed');

  useEffect(() => {
    // Auto-expand the first pending step
    const firstPendingStep = resolutionSteps.find(step => step.status === 'pending');
    if (firstPendingStep && !currentStep) {
      setCurrentStep(firstPendingStep.id);
      setExpandedSteps(new Set([firstPendingStep.id]));
    }
  }, [resolutionSteps, currentStep]);

  const handleStepStatusChange = useCallback((stepId: string, status: ResolutionStep['status']) => {
    const updates: Partial<ResolutionStep> = { 
      status,
      completedAt: status === 'completed' ? new Date() : undefined,
      completedBy: status === 'completed' ? 'Current User' : undefined // Would come from auth
    };
    
    onStepUpdate(stepId, updates);

    // Auto-expand next step if current step is completed
    if (status === 'completed') {
      const currentIndex = resolutionSteps.findIndex(step => step.id === stepId);
      const nextStep = resolutionSteps[currentIndex + 1];
      if (nextStep && nextStep.status === 'pending') {
        setCurrentStep(nextStep.id);
        setExpandedSteps(prev => new Set([...prev, nextStep.id]));
      }
    }
  }, [resolutionSteps, onStepUpdate]);

  const handleStepNotesChange = useCallback((stepId: string, notes: string) => {
    onStepUpdate(stepId, { notes });
  }, [onStepUpdate]);

  const handleQualityGateEvaluation = useCallback((gateId: string, criterionId: string, value: any) => {
    const gate = qualityGates.find(g => g.id === gateId);
    if (!gate) return;

    const updatedCriteria = gate.criteria.map(criterion =>
      criterion.id === criterionId ? { ...criterion, value } : criterion
    );

    // Calculate gate score based on criteria
    const totalWeight = updatedCriteria.reduce((acc, c) => acc + c.weight, 0);
    const weightedScore = updatedCriteria.reduce((acc, c) => {
      if (c.type === 'boolean' && c.value === true) return acc + (5 * c.weight);
      if (c.type === 'rating' && typeof c.value === 'number') return acc + (c.value * c.weight);
      return acc;
    }, 0);
    
    const score = Math.round((weightedScore / (totalWeight * 5)) * 5);
    const status = score >= 3 ? 'passed' : 'failed';

    onQualityGateUpdate(gateId, {
      criteria: updatedCriteria,
      score,
      status
    });
  }, [qualityGates, onQualityGateUpdate]);

  const toggleStepExpanded = useCallback((stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  }, []);

  const toggleGateExpanded = useCallback((gateId: string) => {
    setExpandedGates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gateId)) {
        newSet.delete(gateId);
      } else {
        newSet.add(gateId);
      }
      return newSet;
    });
  }, []);

  const getStepIcon = (type: ResolutionStep['type']) => {
    switch (type) {
      case 'verification': return <CheckCircle size={18} />;
      case 'testing': return <TestTube size={18} />;
      case 'documentation': return <FileText size={18} />;
      case 'communication': return <User size={18} />;
      case 'quality_check': return <Star size={18} />;
      default: return <Settings size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'passed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'skipped': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className={`resolution-workflow ${className}`}>
      {/* Header */}
      <div className="workflow-header">
        <div className="header-title">
          <Zap size={24} className="text-blue-600" />
          <h2>Resolution Workflow</h2>
        </div>
        <div className="ticket-info">
          <span className="ticket-id">Ticket #{ticketId}</span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="progress-overview">
        <div className="progress-stats">
          <div className="stat-card">
            <div className="stat-value">{completionPercentage}%</div>
            <div className="stat-label">Complete</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completedSteps}/{resolutionSteps.length}</div>
            <div className="stat-label">Steps</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{passedGates}/{qualityGates.length}</div>
            <div className="stat-label">Quality Gates</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{qualityScore ? qualityScore.toFixed(1) : 'N/A'}</div>
            <div className="stat-label">Quality Score</div>
          </div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Resolution Steps */}
      <div className="workflow-section">
        <h3 className="section-title">Resolution Steps</h3>
        
        <div className="steps-container">
          {resolutionSteps.map((step, index) => {
            const isExpanded = expandedSteps.has(step.id);
            const isActive = currentStep === step.id;
            
            return (
              <div
                key={step.id}
                className={`resolution-step ${step.status} ${isActive ? 'active' : ''}`}
              >
                {/* Step Header */}
                <div 
                  className="step-header"
                  onClick={() => !isReadOnly && toggleStepExpanded(step.id)}
                >
                  <div className="step-info">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-icon">
                      {getStepIcon(step.type)}
                    </div>
                    <div className="step-details">
                      <div className="step-title">
                        {step.title}
                        {step.required && <span className="required-indicator">*</span>}
                      </div>
                      <div className="step-description">{step.description}</div>
                    </div>
                  </div>

                  <div className="step-status">
                    <span className={`status-badge ${getStatusColor(step.status)}`}>
                      {step.status === 'completed' && <CheckCircle size={14} />}
                      {step.status === 'in_progress' && <Clock size={14} />}
                      {step.status === 'pending' && <AlertCircle size={14} />}
                      {step.status.replace('_', ' ')}
                    </span>
                    
                    {step.estimatedTime && (
                      <span className="time-estimate">
                        ~{step.estimatedTime}min
                      </span>
                    )}
                    
                    <div className="expand-icon">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                </div>

                {/* Step Content */}
                {isExpanded && (
                  <div className="step-content">
                    {/* Status Actions */}
                    {!isReadOnly && (
                      <div className="step-actions">
                        <label>Status:</label>
                        <div className="status-buttons">
                          {['pending', 'in_progress', 'completed', 'skipped'].map(status => (
                            <button
                              key={status}
                              onClick={() => handleStepStatusChange(step.id, status as ResolutionStep['status'])}
                              className={`status-btn ${step.status === status ? 'active' : ''}`}
                              disabled={status === 'skipped' && step.required}
                            >
                              {status.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="step-notes">
                      <label htmlFor={`${step.id}-notes`}>Notes:</label>
                      <textarea
                        id={`${step.id}-notes`}
                        value={step.notes || ''}
                        onChange={(e) => handleStepNotesChange(step.id, e.target.value)}
                        placeholder="Add notes about this step..."
                        className="notes-input"
                        readOnly={isReadOnly}
                      />
                    </div>

                    {/* Completion Info */}
                    {step.status === 'completed' && step.completedAt && (
                      <div className="completion-info">
                        <div className="completion-detail">
                          <span className="label">Completed:</span>
                          <span className="value">{step.completedAt.toLocaleString()}</span>
                        </div>
                        {step.completedBy && (
                          <div className="completion-detail">
                            <span className="label">By:</span>
                            <span className="value">{step.completedBy}</span>
                          </div>
                        )}
                        {step.actualTime && (
                          <div className="completion-detail">
                            <span className="label">Time taken:</span>
                            <span className="value">{step.actualTime} minutes</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quality Gates */}
      <div className="workflow-section">
        <h3 className="section-title">Quality Gates</h3>
        
        <div className="gates-container">
          {qualityGates.map(gate => {
            const isExpanded = expandedGates.has(gate.id);
            
            return (
              <div
                key={gate.id}
                className={`quality-gate ${gate.status}`}
              >
                {/* Gate Header */}
                <div 
                  className="gate-header"
                  onClick={() => !isReadOnly && toggleGateExpanded(gate.id)}
                >
                  <div className="gate-info">
                    <div className="gate-title">
                      {gate.name}
                      {gate.required && <span className="required-indicator">*</span>}
                    </div>
                    <div className="gate-description">{gate.description}</div>
                  </div>

                  <div className="gate-status">
                    <span className={`status-badge ${getStatusColor(gate.status)}`}>
                      {gate.status === 'passed' && <CheckCircle size={14} />}
                      {gate.status === 'failed' && <AlertCircle size={14} />}
                      {gate.status}
                    </span>
                    
                    {gate.score && (
                      <span className="quality-score">
                        <Star size={14} />
                        {gate.score.toFixed(1)}/5
                      </span>
                    )}
                    
                    <div className="expand-icon">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                </div>

                {/* Gate Content */}
                {isExpanded && (
                  <div className="gate-content">
                    <div className="criteria-list">
                      {gate.criteria.map(criterion => (
                        <div key={criterion.id} className="criterion">
                          <div className="criterion-header">
                            <span className="criterion-title">
                              {criterion.description}
                              {criterion.required && <span className="required-indicator">*</span>}
                            </span>
                            <span className="criterion-weight">Weight: {criterion.weight}</span>
                          </div>
                          
                          <div className="criterion-input">
                            {criterion.type === 'boolean' && (
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={criterion.value === true}
                                  onChange={(e) => handleQualityGateEvaluation(gate.id, criterion.id, e.target.checked)}
                                  disabled={isReadOnly}
                                />
                                <span className="checkmark"></span>
                                Yes
                              </label>
                            )}
                            
                            {criterion.type === 'rating' && (
                              <div className="rating-input">
                                {[1, 2, 3, 4, 5].map(rating => (
                                  <button
                                    key={rating}
                                    onClick={() => handleQualityGateEvaluation(gate.id, criterion.id, rating)}
                                    className={`rating-btn ${(criterion.value || 0) >= rating ? 'active' : ''}`}
                                    disabled={isReadOnly}
                                  >
                                    <Star size={16} />
                                  </button>
                                ))}
                                <span className="rating-value">
                                  {criterion.value || 0}/5
                                </span>
                              </div>
                            )}
                            
                            {criterion.type === 'text' && (
                              <textarea
                                value={criterion.value || ''}
                                onChange={(e) => handleQualityGateEvaluation(gate.id, criterion.id, e.target.value)}
                                placeholder="Enter details..."
                                className="text-input"
                                readOnly={isReadOnly}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {gate.feedback && (
                      <div className="gate-feedback">
                        <label>Feedback:</label>
                        <p className="feedback-text">{gate.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Actions */}
      {isWorkflowComplete && !isReadOnly && (
        <div className="completion-section">
          <div className="completion-message">
            <CheckCircle size={24} className="text-green-600" />
            <div className="completion-text">
              <h4>Workflow Complete!</h4>
              <p>All required steps and quality gates have been completed successfully.</p>
            </div>
          </div>
          
          <button
            onClick={onComplete}
            className="complete-workflow-btn"
          >
            <ArrowRight size={16} />
            Complete Resolution
          </button>
        </div>
      )}

      {/* Workflow Summary */}
      <div className="workflow-summary">
        <div className="summary-section">
          <h4>Workflow Summary</h4>
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-label">Total Steps:</span>
              <span className="stat-value">{resolutionSteps.length}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Required Steps:</span>
              <span className="stat-value">{totalRequiredSteps}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Estimated Time:</span>
              <span className="stat-value">
                {resolutionSteps.reduce((acc, step) => acc + (step.estimatedTime || 0), 0)} min
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Quality Score:</span>
              <span className="stat-value">
                {qualityScore ? `${qualityScore.toFixed(1)}/5` : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolutionWorkflow;