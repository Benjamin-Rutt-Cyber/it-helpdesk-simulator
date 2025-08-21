import React, { useState, useCallback } from 'react';
import { 
  Star, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  User, 
  TrendingUp,
  Target,
  Award,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  MessageCircle
} from 'lucide-react';

export interface QualityMetrics {
  technicalAccuracy: number; // 1-5
  completeness: number; // 1-5
  efficiency: number; // 1-5
  customerSatisfaction: number; // 1-5
  documentation: number; // 1-5
  adherenceToProcess: number; // 1-5
  timeToResolution: number; // minutes
  firstCallResolution: boolean;
  escalationRequired: boolean;
  followUpNeeded: boolean;
}

export interface QualityAssessment {
  id: string;
  ticketId: string;
  assessorId: string;
  assessorName: string;
  metrics: QualityMetrics;
  overallScore: number; // 1-5 calculated from metrics
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
  feedback: string;
  createdAt: Date;
  status: 'draft' | 'submitted' | 'approved' | 'requires_revision';
}

export interface QualityStandards {
  category: string;
  standards: {
    excellent: { min: number; description: string };
    good: { min: number; description: string };
    satisfactory: { min: number; description: string };
    needsImprovement: { min: number; description: string };
  };
}

export interface QualityAssuranceProps {
  ticketId: string;
  assessment?: QualityAssessment;
  onAssessmentUpdate: (assessment: Partial<QualityAssessment>) => void;
  onSubmit: (assessment: QualityAssessment) => void;
  isReadOnly?: boolean;
  showBenchmarks?: boolean;
  className?: string;
}

const QUALITY_STANDARDS: QualityStandards[] = [
  {
    category: 'Technical Accuracy',
    standards: {
      excellent: { min: 4.5, description: 'Solution perfectly addresses root cause with no technical issues' },
      good: { min: 3.5, description: 'Solution addresses the problem with minor technical considerations' },
      satisfactory: { min: 2.5, description: 'Solution works but may have some technical gaps' },
      needsImprovement: { min: 1, description: 'Solution has significant technical issues or doesn\'t address root cause' }
    }
  },
  {
    category: 'Completeness',
    standards: {
      excellent: { min: 4.5, description: 'All aspects thoroughly addressed, nothing left incomplete' },
      good: { min: 3.5, description: 'Most aspects covered with minor gaps' },
      satisfactory: { min: 2.5, description: 'Key aspects covered but some details missing' },
      needsImprovement: { min: 1, description: 'Significant gaps in coverage or incomplete resolution' }
    }
  },
  {
    category: 'Customer Satisfaction',
    standards: {
      excellent: { min: 4.5, description: 'Customer extremely satisfied, would highly recommend' },
      good: { min: 3.5, description: 'Customer satisfied with resolution and service' },
      satisfactory: { min: 2.5, description: 'Customer needs met but some concerns remain' },
      needsImprovement: { min: 1, description: 'Customer dissatisfied or has major concerns' }
    }
  }
];

const METRIC_DEFINITIONS = {
  technicalAccuracy: 'How accurately does the solution address the technical root cause?',
  completeness: 'How complete is the resolution across all aspects of the issue?',
  efficiency: 'How efficiently was the issue resolved in terms of time and resources?',
  customerSatisfaction: 'How satisfied is the customer with the resolution and service?',
  documentation: 'How well documented is the resolution for future reference?',
  adherenceToProcess: 'How well were standard processes and procedures followed?'
};

export const QualityAssurance: React.FC<QualityAssuranceProps> = ({
  ticketId,
  assessment,
  onAssessmentUpdate,
  onSubmit,
  isReadOnly = false,
  showBenchmarks = true,
  className = ''
}) => {
  const [currentAssessment, setCurrentAssessment] = useState<Partial<QualityAssessment>>(
    assessment || {
      ticketId,
      metrics: {
        technicalAccuracy: 0,
        completeness: 0,
        efficiency: 0,
        customerSatisfaction: 0,
        documentation: 0,
        adherenceToProcess: 0,
        timeToResolution: 0,
        firstCallResolution: false,
        escalationRequired: false,
        followUpNeeded: false
      },
      strengths: [],
      improvementAreas: [],
      recommendations: [],
      feedback: '',
      status: 'draft'
    }
  );

  const [activeTab, setActiveTab] = useState<'metrics' | 'feedback' | 'summary'>('metrics');

  const calculateOverallScore = useCallback((metrics: QualityMetrics): number => {
    const ratingMetrics = [
      metrics.technicalAccuracy,
      metrics.completeness,
      metrics.efficiency,
      metrics.customerSatisfaction,
      metrics.documentation,
      metrics.adherenceToProcess
    ];
    
    const average = ratingMetrics.reduce((sum, score) => sum + score, 0) / ratingMetrics.length;
    
    // Apply bonuses/penalties for boolean metrics
    let adjustedScore = average;
    if (metrics.firstCallResolution) adjustedScore += 0.2;
    if (metrics.escalationRequired) adjustedScore -= 0.1;
    if (metrics.followUpNeeded) adjustedScore -= 0.1;
    
    return Math.min(5, Math.max(1, adjustedScore));
  }, []);

  const handleMetricChange = useCallback((metric: keyof QualityMetrics, value: any) => {
    const updatedMetrics = {
      ...currentAssessment.metrics!,
      [metric]: value
    };
    
    const updatedAssessment = {
      ...currentAssessment,
      metrics: updatedMetrics,
      overallScore: calculateOverallScore(updatedMetrics)
    };
    
    setCurrentAssessment(updatedAssessment);
    onAssessmentUpdate(updatedAssessment);
  }, [currentAssessment, calculateOverallScore, onAssessmentUpdate]);

  const handleArrayFieldChange = useCallback((field: 'strengths' | 'improvementAreas' | 'recommendations', index: number, value: string) => {
    const currentArray = currentAssessment[field] || [];
    const updatedArray = [...currentArray];
    updatedArray[index] = value;
    
    const updatedAssessment = {
      ...currentAssessment,
      [field]: updatedArray
    };
    
    setCurrentAssessment(updatedAssessment);
    onAssessmentUpdate(updatedAssessment);
  }, [currentAssessment, onAssessmentUpdate]);

  const addArrayItem = useCallback((field: 'strengths' | 'improvementAreas' | 'recommendations') => {
    const currentArray = currentAssessment[field] || [];
    const updatedAssessment = {
      ...currentAssessment,
      [field]: [...currentArray, '']
    };
    
    setCurrentAssessment(updatedAssessment);
    onAssessmentUpdate(updatedAssessment);
  }, [currentAssessment, onAssessmentUpdate]);

  const removeArrayItem = useCallback((field: 'strengths' | 'improvementAreas' | 'recommendations', index: number) => {
    const currentArray = currentAssessment[field] || [];
    const updatedArray = currentArray.filter((_, i) => i !== index);
    
    const updatedAssessment = {
      ...currentAssessment,
      [field]: updatedArray
    };
    
    setCurrentAssessment(updatedAssessment);
    onAssessmentUpdate(updatedAssessment);
  }, [currentAssessment, onAssessmentUpdate]);

  const getScoreColor = (score: number): string => {
    if (score >= 4.5) return 'text-green-600 bg-green-100';
    if (score >= 3.5) return 'text-blue-600 bg-blue-100';
    if (score >= 2.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Satisfactory';
    return 'Needs Improvement';
  };

  const renderRatingInput = (
    metric: keyof QualityMetrics,
    label: string,
    value: number,
    definition: string
  ) => (
    <div className="metric-row">
      <div className="metric-info">
        <label className="metric-label">{label}</label>
        <p className="metric-definition">{definition}</p>
      </div>
      
      <div className="metric-rating">
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              onClick={() => !isReadOnly && handleMetricChange(metric, rating)}
              className={`star-btn ${value >= rating ? 'active' : ''}`}
              disabled={isReadOnly}
              title={`${rating} star${rating !== 1 ? 's' : ''}`}
            >
              <Star size={20} fill={value >= rating ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        <span className="rating-value">{value}/5</span>
        <span className={`rating-label ${getScoreColor(value)}`}>
          {getScoreLabel(value)}
        </span>
      </div>
    </div>
  );

  const renderBooleanInput = (
    metric: keyof QualityMetrics,
    label: string,
    value: boolean,
    positiveLabel: string,
    negativeLabel: string
  ) => (
    <div className="boolean-metric">
      <label className="metric-label">{label}</label>
      <div className="boolean-options">
        <button
          onClick={() => !isReadOnly && handleMetricChange(metric, true)}
          className={`boolean-btn positive ${value ? 'active' : ''}`}
          disabled={isReadOnly}
        >
          <ThumbsUp size={16} />
          {positiveLabel}
        </button>
        <button
          onClick={() => !isReadOnly && handleMetricChange(metric, false)}
          className={`boolean-btn negative ${!value ? 'active' : ''}`}
          disabled={isReadOnly}
        >
          <ThumbsDown size={16} />
          {negativeLabel}
        </button>
      </div>
    </div>
  );

  const renderArrayField = (
    field: 'strengths' | 'improvementAreas' | 'recommendations',
    title: string,
    placeholder: string,
    icon: React.ReactNode
  ) => {
    const items = currentAssessment[field] || [];
    
    return (
      <div className="array-field">
        <div className="field-header">
          {icon}
          <h4>{title}</h4>
          {!isReadOnly && (
            <button
              onClick={() => addArrayItem(field)}
              className="add-item-btn"
            >
              + Add {title.slice(0, -1)}
            </button>
          )}
        </div>
        
        <div className="array-items">
          {items.length === 0 ? (
            <div className="empty-array">
              <p>No {title.toLowerCase()} added yet.</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="array-item">
                <textarea
                  value={item}
                  onChange={(e) => handleArrayFieldChange(field, index, e.target.value)}
                  placeholder={placeholder}
                  className="array-input"
                  readOnly={isReadOnly}
                />
                {!isReadOnly && (
                  <button
                    onClick={() => removeArrayItem(field, index)}
                    className="remove-item-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`quality-assurance ${className}`}>
      {/* Header */}
      <div className="qa-header">
        <div className="header-title">
          <Award size={24} className="text-blue-600" />
          <h2>Quality Assurance</h2>
        </div>
        <div className="ticket-info">
          <span className="ticket-id">Ticket #{ticketId}</span>
          {currentAssessment.overallScore && (
            <div className="overall-score">
              <Star size={16} />
              <span className="score-value">{currentAssessment.overallScore.toFixed(1)}/5</span>
              <span className={`score-label ${getScoreColor(currentAssessment.overallScore)}`}>
                {getScoreLabel(currentAssessment.overallScore)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="qa-tabs">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
        >
          <BarChart3 size={16} />
          Metrics
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
        >
          <MessageCircle size={16} />
          Feedback
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
        >
          <Target size={16} />
          Summary
        </button>
      </div>

      {/* Content */}
      <div className="qa-content">
        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="metrics-section">
            <h3>Quality Metrics</h3>
            
            {/* Rating Metrics */}
            <div className="rating-metrics">
              {renderRatingInput(
                'technicalAccuracy',
                'Technical Accuracy',
                currentAssessment.metrics?.technicalAccuracy || 0,
                METRIC_DEFINITIONS.technicalAccuracy
              )}
              
              {renderRatingInput(
                'completeness',
                'Completeness',
                currentAssessment.metrics?.completeness || 0,
                METRIC_DEFINITIONS.completeness
              )}
              
              {renderRatingInput(
                'efficiency',
                'Efficiency',
                currentAssessment.metrics?.efficiency || 0,
                METRIC_DEFINITIONS.efficiency
              )}
              
              {renderRatingInput(
                'customerSatisfaction',
                'Customer Satisfaction',
                currentAssessment.metrics?.customerSatisfaction || 0,
                METRIC_DEFINITIONS.customerSatisfaction
              )}
              
              {renderRatingInput(
                'documentation',
                'Documentation Quality',
                currentAssessment.metrics?.documentation || 0,
                METRIC_DEFINITIONS.documentation
              )}
              
              {renderRatingInput(
                'adherenceToProcess',
                'Process Adherence',
                currentAssessment.metrics?.adherenceToProcess || 0,
                METRIC_DEFINITIONS.adherenceToProcess
              )}
            </div>

            {/* Boolean Metrics */}
            <div className="boolean-metrics">
              <h4>Resolution Characteristics</h4>
              
              {renderBooleanInput(
                'firstCallResolution',
                'First Call Resolution',
                currentAssessment.metrics?.firstCallResolution || false,
                'Resolved on first contact',
                'Required multiple contacts'
              )}
              
              {renderBooleanInput(
                'escalationRequired',
                'Escalation Required',
                currentAssessment.metrics?.escalationRequired || false,
                'Required escalation',
                'No escalation needed'
              )}
              
              {renderBooleanInput(
                'followUpNeeded',
                'Follow-up Needed',
                currentAssessment.metrics?.followUpNeeded || false,
                'Follow-up required',
                'No follow-up needed'
              )}
            </div>

            {/* Time Metric */}
            <div className="time-metric">
              <label className="metric-label">Time to Resolution (minutes)</label>
              <input
                type="number"
                value={currentAssessment.metrics?.timeToResolution || 0}
                onChange={(e) => handleMetricChange('timeToResolution', parseInt(e.target.value) || 0)}
                className="time-input"
                min="0"
                readOnly={isReadOnly}
              />
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="feedback-section">
            {renderArrayField(
              'strengths',
              'Strengths',
              'Describe what was done well...',
              <TrendingUp size={20} className="text-green-600" />
            )}
            
            {renderArrayField(
              'improvementAreas',
              'Areas for Improvement',
              'Describe what could be improved...',
              <AlertTriangle size={20} className="text-yellow-600" />
            )}
            
            {renderArrayField(
              'recommendations',
              'Recommendations',
              'Provide specific recommendations...',
              <Target size={20} className="text-blue-600" />
            )}

            {/* General Feedback */}
            <div className="general-feedback">
              <div className="field-header">
                <MessageCircle size={20} className="text-purple-600" />
                <h4>General Feedback</h4>
              </div>
              <textarea
                value={currentAssessment.feedback || ''}
                onChange={(e) => {
                  const updated = { ...currentAssessment, feedback: e.target.value };
                  setCurrentAssessment(updated);
                  onAssessmentUpdate(updated);
                }}
                placeholder="Provide detailed feedback on the overall resolution quality..."
                className="feedback-textarea"
                rows={6}
                readOnly={isReadOnly}
              />
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="summary-section">
            <div className="score-summary">
              <div className="overall-score-display">
                <div className="score-circle">
                  <span className="score-number">
                    {currentAssessment.overallScore?.toFixed(1) || '0.0'}
                  </span>
                  <span className="score-max">/5</span>
                </div>
                <div className="score-info">
                  <h3>Overall Quality Score</h3>
                  <p className={`score-category ${getScoreColor(currentAssessment.overallScore || 0)}`}>
                    {getScoreLabel(currentAssessment.overallScore || 0)}
                  </p>
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="metric-breakdown">
                <h4>Metric Breakdown</h4>
                <div className="breakdown-grid">
                  {Object.entries(METRIC_DEFINITIONS).map(([key, definition]) => {
                    const value = currentAssessment.metrics?.[key as keyof QualityMetrics] as number || 0;
                    return (
                      <div key={key} className="breakdown-item">
                        <div className="breakdown-header">
                          <span className="breakdown-label">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className={`breakdown-score ${getScoreColor(value)}`}>
                            {value}/5
                          </span>
                        </div>
                        <div className="breakdown-bar">
                          <div 
                            className="breakdown-fill"
                            style={{ width: `${(value / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quality Standards Reference */}
            {showBenchmarks && (
              <div className="quality-standards">
                <h4>Quality Standards Reference</h4>
                <div className="standards-grid">
                  {QUALITY_STANDARDS.map(standard => (
                    <div key={standard.category} className="standard-card">
                      <h5>{standard.category}</h5>
                      <div className="standard-levels">
                        {Object.entries(standard.standards).map(([level, data]) => (
                          <div key={level} className={`standard-level ${level}`}>
                            <div className="level-header">
                              <span className="level-name">{level.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                              <span className="level-score">{data.min}+ stars</span>
                            </div>
                            <p className="level-description">{data.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isReadOnly && (
        <div className="qa-actions">
          <div className="action-buttons">
            <button
              onClick={() => {
                const updated = { ...currentAssessment, status: 'draft' as const };
                setCurrentAssessment(updated);
                onAssessmentUpdate(updated);
              }}
              className="btn-secondary"
              disabled={currentAssessment.status === 'draft'}
            >
              <FileText size={16} />
              Save as Draft
            </button>
            
            <button
              onClick={() => {
                const finalAssessment: QualityAssessment = {
                  id: currentAssessment.id || `qa-${Date.now()}`,
                  ticketId,
                  assessorId: 'current-user', // Would come from auth
                  assessorName: 'Current User', // Would come from auth
                  metrics: currentAssessment.metrics!,
                  overallScore: currentAssessment.overallScore || 0,
                  strengths: currentAssessment.strengths || [],
                  improvementAreas: currentAssessment.improvementAreas || [],
                  recommendations: currentAssessment.recommendations || [],
                  feedback: currentAssessment.feedback || '',
                  createdAt: new Date(),
                  status: 'submitted'
                };
                onSubmit(finalAssessment);
              }}
              className="btn-primary"
              disabled={!currentAssessment.overallScore || currentAssessment.overallScore === 0}
            >
              <CheckCircle size={16} />
              Submit Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityAssurance;