'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Star,
  BookOpen,
  Target,
  Clock,
  Users,
  MessageSquare,
  Award,
  Brain,
  ArrowRight
} from 'lucide-react';

export interface EscalationFeedback {
  id: string;
  escalationId: string;
  ticketId: string;
  userId: string;
  decision: 'appropriate' | 'unnecessary' | 'delayed' | 'incomplete';
  reasoning: string;
  learningPoints: string[];
  recommendations: string[];
  skillsAssessed: {
    problemAnalysis: number; // 1-5
    documentation: number;
    communication: number;
    decisionMaking: number;
    technicalKnowledge: number;
  };
  improvementAreas: string[];
  strengths: string[];
  nextSteps: string[];
  feedbackDate: Date;
  reviewedBy: string;
  escalationOutcome?: 'resolved' | 'returned' | 'further_escalated';
  resolutionLearnings?: string;
}

export interface LearningMetrics {
  totalEscalations: number;
  appropriateRate: number;
  averageDecisionTime: number;
  skillTrends: Record<string, number[]>;
  commonMistakes: string[];
  improvementProgress: number;
  competencyLevel: 'novice' | 'developing' | 'proficient' | 'expert';
}

interface EscalationFeedbackProps {
  escalationId: string;
  ticketId: string;
  escalationData: any;
  onFeedbackSubmit: (feedback: EscalationFeedback) => void;
  onClose: () => void;
  previousFeedback?: EscalationFeedback[];
  learningMetrics?: LearningMetrics;
}

const DECISION_TYPES = {
  appropriate: {
    label: 'Appropriate Escalation',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    description: 'Escalation was necessary and properly justified'
  },
  unnecessary: {
    label: 'Unnecessary Escalation',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    description: 'Issue could have been resolved at current level'
  },
  delayed: {
    label: 'Delayed Escalation',
    color: 'bg-orange-100 text-orange-800',
    icon: <Clock className="w-5 h-5 text-orange-600" />,
    description: 'Escalation should have happened earlier'
  },
  incomplete: {
    label: 'Incomplete Escalation',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    description: 'Missing information or insufficient documentation'
  }
};

const SKILL_AREAS = [
  { key: 'problemAnalysis', label: 'Problem Analysis', description: 'Ability to analyze and understand issues' },
  { key: 'documentation', label: 'Documentation', description: 'Quality of escalation documentation' },
  { key: 'communication', label: 'Communication', description: 'Clarity and professionalism in communication' },
  { key: 'decisionMaking', label: 'Decision Making', description: 'Timing and appropriateness of escalation decision' },
  { key: 'technicalKnowledge', label: 'Technical Knowledge', description: 'Understanding of technical aspects' }
];

export const EscalationFeedback: React.FC<EscalationFeedbackProps> = ({
  escalationId,
  ticketId,
  escalationData,
  onFeedbackSubmit,
  onClose,
  previousFeedback = [],
  learningMetrics
}) => {
  const [feedback, setFeedback] = useState<Partial<EscalationFeedback>>({
    escalationId,
    ticketId,
    userId: 'current-user', // Would come from auth
    decision: 'appropriate',
    reasoning: '',
    learningPoints: [],
    recommendations: [],
    skillsAssessed: {
      problemAnalysis: 3,
      documentation: 3,
      communication: 3,
      decisionMaking: 3,
      technicalKnowledge: 3
    },
    improvementAreas: [],
    strengths: [],
    nextSteps: [],
    reviewedBy: 'supervisor' // Would be determined by role
  });

  const [activeTab, setActiveTab] = useState<'feedback' | 'learning' | 'metrics'>('feedback');
  const [newLearningPoint, setNewLearningPoint] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [newImprovementArea, setNewImprovementArea] = useState('');
  const [newNextStep, setNewNextStep] = useState('');

  const handleDecisionChange = useCallback((decision: EscalationFeedback['decision']) => {
    setFeedback(prev => ({ ...prev, decision }));
  }, []);

  const handleSkillRating = useCallback((skill: string, rating: number) => {
    setFeedback(prev => ({
      ...prev,
      skillsAssessed: {
        ...prev.skillsAssessed!,
        [skill]: rating
      }
    }));
  }, []);

  const addListItem = useCallback((field: string, value: string, setter: (value: string) => void) => {
    if (!value.trim()) return;
    
    setFeedback(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[] || []), value.trim()]
    }));
    setter('');
  }, []);

  const removeListItem = useCallback((field: string, index: number) => {
    setFeedback(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    const completeFeedback: EscalationFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      feedbackDate: new Date(),
      ...feedback as EscalationFeedback
    };

    onFeedbackSubmit(completeFeedback);
  }, [feedback, onFeedbackSubmit]);

  const getCompetencyColor = (level: string) => {
    switch (level) {
      case 'expert': return 'text-purple-600';
      case 'proficient': return 'text-green-600';
      case 'developing': return 'text-yellow-600';
      case 'novice': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSkillTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  return (
    <div className="escalation-feedback max-w-4xl mx-auto">
      {/* Header */}
      <div className="feedback-header mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Escalation Learning Feedback</h2>
            <p className="text-gray-600">
              Ticket #{ticketId} - Escalation #{escalationId}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-4 border-b">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === 'feedback'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Feedback
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === 'learning'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Brain className="w-4 h-4 inline mr-2" />
            Learning Points
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === 'metrics'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Progress Metrics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Escalation Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Escalation Summary</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">Category:</span>
                  <p className="font-medium">{escalationData?.category || 'Technical Complexity'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Priority:</span>
                  <p className="font-medium capitalize">{escalationData?.priority || 'Medium'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Target:</span>
                  <p className="font-medium">{escalationData?.escalationTarget || 'L2 Support'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <p className="font-medium capitalize">{escalationData?.status || 'Submitted'}</p>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Justification:</span>
                <p className="mt-1 text-gray-800">{escalationData?.justification || 'No justification provided'}</p>
              </div>
            </Card>

            {/* Decision Assessment */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Decision Assessment</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {Object.entries(DECISION_TYPES).map(([key, type]) => (
                  <div
                    key={key}
                    onClick={() => handleDecisionChange(key as EscalationFeedback['decision'])}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      feedback.decision === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {type.icon}
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Detailed Reasoning <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={feedback.reasoning || ''}
                  onChange={(e) => setFeedback(prev => ({ ...prev, reasoning: e.target.value }))}
                  className="w-full p-3 border rounded-md h-24 resize-vertical"
                  placeholder="Provide detailed reasoning for your assessment..."
                />
              </div>
            </Card>

            {/* Skills Assessment */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Skills Assessment</h3>
              <div className="space-y-4">
                {SKILL_AREAS.map(skill => (
                  <div key={skill.key} className="skill-assessment">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{skill.label}</span>
                        <p className="text-sm text-gray-600">{skill.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Rating:</span>
                        <span className="font-medium">
                          {feedback.skillsAssessed?.[skill.key as keyof typeof feedback.skillsAssessed] || 3}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => handleSkillRating(skill.key, rating)}
                          className={`p-2 rounded ${
                            (feedback.skillsAssessed?.[skill.key as keyof typeof feedback.skillsAssessed] || 3) >= rating
                              ? 'bg-yellow-400 text-white'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="space-y-6">
            {/* Learning Points */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Key Learning Points</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLearningPoint}
                    onChange={(e) => setNewLearningPoint(e.target.value)}
                    placeholder="Add a learning point..."
                    className="flex-1 p-2 border rounded-md"
                    onKeyPress={(e) => e.key === 'Enter' && addListItem('learningPoints', newLearningPoint, setNewLearningPoint)}
                  />
                  <Button
                    onClick={() => addListItem('learningPoints', newLearningPoint, setNewLearningPoint)}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(feedback.learningPoints || []).map((point, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="flex-1">{point}</span>
                      <button
                        onClick={() => removeListItem('learningPoints', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Strengths */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Demonstrated Strengths</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    placeholder="Add a strength..."
                    className="flex-1 p-2 border rounded-md"
                    onKeyPress={(e) => e.key === 'Enter' && addListItem('strengths', newStrength, setNewStrength)}
                  />
                  <Button
                    onClick={() => addListItem('strengths', newStrength, setNewStrength)}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(feedback.strengths || []).map((strength, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <Award className="w-4 h-4 text-green-600" />
                      <span className="flex-1">{strength}</span>
                      <button
                        onClick={() => removeListItem('strengths', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Improvement Areas */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Areas for Improvement</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImprovementArea}
                    onChange={(e) => setNewImprovementArea(e.target.value)}
                    placeholder="Add an improvement area..."
                    className="flex-1 p-2 border rounded-md"
                    onKeyPress={(e) => e.key === 'Enter' && addListItem('improvementAreas', newImprovementArea, setNewImprovementArea)}
                  />
                  <Button
                    onClick={() => addListItem('improvementAreas', newImprovementArea, setNewImprovementArea)}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(feedback.improvementAreas || []).map((area, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                      <Target className="w-4 h-4 text-orange-600" />
                      <span className="flex-1">{area}</span>
                      <button
                        onClick={() => removeListItem('improvementAreas', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recommended Next Steps</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNextStep}
                    onChange={(e) => setNewNextStep(e.target.value)}
                    placeholder="Add a next step..."
                    className="flex-1 p-2 border rounded-md"
                    onKeyPress={(e) => e.key === 'Enter' && addListItem('nextSteps', newNextStep, setNewNextStep)}
                  />
                  <Button
                    onClick={() => addListItem('nextSteps', newNextStep, setNewNextStep)}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(feedback.nextSteps || []).map((step, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                      <ArrowRight className="w-4 h-4 text-purple-600" />
                      <span className="flex-1">{step}</span>
                      <button
                        onClick={() => removeListItem('nextSteps', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'metrics' && learningMetrics && (
          <div className="space-y-6">
            {/* Overall Progress */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Learning Progress Overview</h3>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{learningMetrics.totalEscalations}</div>
                  <div className="text-sm text-gray-600">Total Escalations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{(learningMetrics.appropriateRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Appropriate Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{learningMetrics.averageDecisionTime}min</div>
                  <div className="text-sm text-gray-600">Avg Decision Time</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCompetencyColor(learningMetrics.competencyLevel)}`}>
                    {learningMetrics.competencyLevel.charAt(0).toUpperCase() + learningMetrics.competencyLevel.slice(1)}
                  </div>
                  <div className="text-sm text-gray-600">Competency Level</div>
                </div>
              </div>

              <div className="progress-bar mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Improvement</span>
                  <span className="text-sm text-gray-600">{learningMetrics.improvementProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${learningMetrics.improvementProgress}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Skill Trends */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Skill Development Trends</h3>
              <div className="space-y-4">
                {SKILL_AREAS.map(skill => {
                  const trends = learningMetrics.skillTrends[skill.key] || [];
                  const current = trends[trends.length - 1] || 3;
                  const previous = trends[trends.length - 2] || current;
                  
                  return (
                    <div key={skill.key} className="skill-trend">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{skill.label}</span>
                        <div className="flex items-center gap-2">
                          {getSkillTrendIcon(current, previous)}
                          <span className="font-medium">{current.toFixed(1)}/5</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(current / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Common Mistakes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Learning Opportunities</h3>
              <div className="space-y-3">
                {learningMetrics.commonMistakes.map((mistake, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Common Pattern #{index + 1}</p>
                      <p className="text-sm text-yellow-700">{mistake}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Submit Feedback */}
      <div className="feedback-actions mt-8 p-6 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">Submit Learning Feedback</h4>
            <p className="text-sm text-gray-600">
              This feedback will be used to improve escalation decision-making skills
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!feedback.reasoning?.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              Submit Feedback
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscalationFeedback;