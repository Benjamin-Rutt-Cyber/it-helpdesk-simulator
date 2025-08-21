import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface DetailedFeedback {
  strengths: Array<{
    area: string;
    score: number;
    description: string;
    examples: string[];
  }>;
  improvementAreas: Array<{
    area: string;
    score: number;
    description: string;
    recommendations: string[];
    resources: Array<{
      title: string;
      type: string;
      url?: string;
    }>;
  }>;
  actionableSteps: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    timeframe: string;
  }>;
  nextScenarios: Array<{
    scenarioId: string;
    title: string;
    reason: string;
    expectedBenefit: string;
  }>;
}

interface FeedbackPanelProps {
  userId: string;
  sessionId?: string;
  className?: string;
}

export function FeedbackPanel({ userId, sessionId, className }: FeedbackPanelProps) {
  const [feedback, setFeedback] = useState<DetailedFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['strengths']));

  useEffect(() => {
    loadFeedback();
  }, [userId, sessionId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (sessionId) {
        response = await fetch(`/api/analytics/session/${sessionId}/feedback?userId=${userId}`);
      } else {
        // Mock endpoint for overall feedback
        response = await fetch(`/api/analytics/user/${userId}/feedback`);
      }

      if (!response.ok) {
        throw new Error('Failed to load feedback');
      }

      const result = await response.json();
      setFeedback(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold">Failed to Load Feedback</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadFeedback} variant="outline">
          Try Again
        </Button>
      </Card>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">Performance Feedback</h3>
        <p className="text-gray-600">
          {sessionId ? 'Session-specific feedback and recommendations' : 'Overall performance insights and guidance'}
        </p>
      </div>

      {/* Strengths Section */}
      <Card className="overflow-hidden">
        <div 
          className="bg-green-50 border-b border-green-200 px-6 py-4 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => toggleSection('strengths')}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-green-900 flex items-center gap-2">
              <span>🌟</span>
              Your Strengths ({feedback.strengths.length})
            </h4>
            <svg 
              className={cn('w-5 h-5 text-green-700 transition-transform', 
                expandedSections.has('strengths') ? 'rotate-180' : ''
              )}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {expandedSections.has('strengths') && (
          <div className="p-6">
            <div className="space-y-4">
              {feedback.strengths.map((strength, index) => (
                <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="font-medium text-green-900">{strength.area}</h5>
                    <span className={cn('text-lg font-bold', getScoreColor(strength.score))}>
                      {strength.score}
                    </span>
                  </div>
                  
                  <p className="text-sm text-green-800 mb-3">{strength.description}</p>
                  
                  <div>
                    <h6 className="text-xs font-medium text-green-900 mb-2">Examples of Excellence:</h6>
                    <ul className="text-xs text-green-700 space-y-1">
                      {strength.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Improvement Areas Section */}
      <Card className="overflow-hidden">
        <div 
          className="bg-orange-50 border-b border-orange-200 px-6 py-4 cursor-pointer hover:bg-orange-100 transition-colors"
          onClick={() => toggleSection('improvements')}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-orange-900 flex items-center gap-2">
              <span>🎯</span>
              Areas for Improvement ({feedback.improvementAreas.length})
            </h4>
            <svg 
              className={cn('w-5 h-5 text-orange-700 transition-transform', 
                expandedSections.has('improvements') ? 'rotate-180' : ''
              )}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {expandedSections.has('improvements') && (
          <div className="p-6">
            <div className="space-y-6">
              {feedback.improvementAreas.map((area, index) => (
                <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="font-medium text-orange-900">{area.area}</h5>
                    <span className={cn('text-lg font-bold', getScoreColor(area.score))}>
                      {area.score}
                    </span>
                  </div>
                  
                  <p className="text-sm text-orange-800 mb-4">{area.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="text-xs font-medium text-orange-900 mb-2">Recommendations:</h6>
                      <ul className="text-xs text-orange-700 space-y-1">
                        {area.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-0.5">→</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h6 className="text-xs font-medium text-orange-900 mb-2">Learning Resources:</h6>
                      <div className="space-y-1">
                        {area.resources.map((resource, resIndex) => (
                          <div key={resIndex} className="text-xs">
                            <span className="text-orange-600 font-medium">{resource.type}:</span>
                            <span className="text-orange-700 ml-1">{resource.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Action Steps Section */}
      <Card className="overflow-hidden">
        <div 
          className="bg-blue-50 border-b border-blue-200 px-6 py-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => toggleSection('actions')}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <span>🚀</span>
              Action Steps ({feedback.actionableSteps.length})
            </h4>
            <svg 
              className={cn('w-5 h-5 text-blue-700 transition-transform', 
                expandedSections.has('actions') ? 'rotate-180' : ''
              )}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {expandedSections.has('actions') && (
          <div className="p-6">
            <div className="space-y-4">
              {feedback.actionableSteps.map((step, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={cn('px-2 py-1 rounded-md border text-xs font-medium flex items-center gap-1', 
                      getPriorityColor(step.priority))}>
                      <span>{getPriorityIcon(step.priority)}</span>
                      {step.priority.toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-2">{step.action}</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Expected Impact:</span>
                          <p className="text-green-700 font-medium">{step.expectedImpact}</p>
                        </div>
                        
                        <div>
                          <span className="text-gray-600">Timeframe:</span>
                          <p className="text-blue-700 font-medium">{step.timeframe}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Recommended Scenarios Section */}
      <Card className="overflow-hidden">
        <div 
          className="bg-purple-50 border-b border-purple-200 px-6 py-4 cursor-pointer hover:bg-purple-100 transition-colors"
          onClick={() => toggleSection('scenarios')}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <span>🎮</span>
              Recommended Next Scenarios ({feedback.nextScenarios.length})
            </h4>
            <svg 
              className={cn('w-5 h-5 text-purple-700 transition-transform', 
                expandedSections.has('scenarios') ? 'rotate-180' : ''
              )}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {expandedSections.has('scenarios') && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedback.nextScenarios.map((scenario, index) => (
                <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50 hover:shadow-md transition-shadow">
                  <h5 className="font-medium text-purple-900 mb-2">{scenario.title}</h5>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-purple-700 font-medium">Why recommended:</span>
                      <p className="text-purple-800">{scenario.reason}</p>
                    </div>
                    
                    <div>
                      <span className="text-purple-700 font-medium">Expected benefit:</span>
                      <p className="text-purple-800">{scenario.expectedBenefit}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        // Navigate to scenario
                        window.location.href = `/scenarios/${scenario.scenarioId}`;
                      }}
                    >
                      Start Scenario
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
          <span>💡</span>
          Key Takeaways
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600 mb-1">
              {feedback.strengths.length}
            </div>
            <div className="text-blue-800">Strong Areas</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600 mb-1">
              {feedback.improvementAreas.length}
            </div>
            <div className="text-blue-800">Growth Opportunities</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 mb-1">
              {feedback.actionableSteps.filter(step => step.priority === 'high').length}
            </div>
            <div className="text-blue-800">Priority Actions</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            Focus on your high-priority action steps for maximum improvement impact
          </p>
        </div>
      </Card>
    </div>
  );
}