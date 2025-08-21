import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ScenarioPreviewData {
  id: string;
  title: string;
  description: string;
  difficulty: 'starter' | 'intermediate' | 'advanced';
  estimatedTime: number;
  xpReward: number;
  category: string;
  tags: string[];
  learningObjectives: string[];
  prerequisites: {
    met: boolean;
    missing: string[];
    completed: string[];
  };
  ticketTemplate: {
    priority: string;
    title: string;
    description: string;
    customerInfo: {
      name: string;
      department: string;
      role: string;
    };
  };
  assessmentCriteria: {
    technical: Record<string, number>;
    communication: Record<string, number>;
    procedure: Record<string, number>;
    timeManagement: Record<string, number>;
  };
  successCriteria: Array<{
    description: string;
    weight: number;
  }>;
  knowledgeBaseEntries: Array<{
    title: string;
    category: string;
  }>;
}

interface ScenarioPreviewProps {
  scenario: ScenarioPreviewData | null;
  isOpen: boolean;
  onClose: () => void;
  onStart: (scenarioId: string) => void;
  loading?: boolean;
}

export function ScenarioPreview({
  scenario,
  isOpen,
  onClose,
  onStart,
  loading = false
}: ScenarioPreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'objectives' | 'assessment'>('overview');

  if (!isOpen || !scenario) return null;

  const getDifficultyColor = () => {
    switch (scenario.difficulty) {
      case 'starter':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} minutes` : ''}`;
  };

  const isLocked = !scenario.prerequisites.met;
  const canStart = scenario.prerequisites.met;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading scenario details...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {scenario.title}
                    </h2>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium border',
                      getDifficultyColor()
                    )}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {scenario.description}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>⏱️</span>
                      <span>{formatTime(scenario.estimatedTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🏆</span>
                      <span>{scenario.xpReward} XP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📁</span>
                      <span>{scenario.category}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Close preview"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Prerequisites Warning */}
              {isLocked && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">🔒</span>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Prerequisites Required
                      </p>
                      <p className="text-sm text-yellow-700">
                        Complete {scenario.prerequisites.missing.length} more scenario(s) to unlock this scenario.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b">
              <nav className="flex">
                {[
                  { id: 'overview', label: 'Overview', icon: '📋' },
                  { id: 'objectives', label: 'Learning Objectives', icon: '🎯' },
                  { id: 'assessment', label: 'Assessment', icon: '📊' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Scenario Context */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Scenario Context</h3>
                    <Card className="p-4">
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Customer:</span>{' '}
                          {scenario.ticketTemplate.customerInfo.name} ({scenario.ticketTemplate.customerInfo.role})
                        </div>
                        <div>
                          <span className="font-medium">Department:</span>{' '}
                          {scenario.ticketTemplate.customerInfo.department}
                        </div>
                        <div>
                          <span className="font-medium">Issue:</span>{' '}
                          {scenario.ticketTemplate.title}
                        </div>
                        <div>
                          <span className="font-medium">Priority:</span>{' '}
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            scenario.ticketTemplate.priority === 'high' 
                              ? 'bg-red-100 text-red-800'
                              : scenario.ticketTemplate.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          )}>
                            {scenario.ticketTemplate.priority}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Knowledge Base Resources */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Available Resources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {scenario.knowledgeBaseEntries.map((entry, index) => (
                        <Card key={index} className="p-3">
                          <div className="font-medium text-sm">{entry.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{entry.category}</div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {scenario.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Skills & Topics</h3>
                      <div className="flex flex-wrap gap-2">
                        {scenario.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'objectives' && (
                <div className="space-y-6">
                  {/* Learning Objectives */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">What You'll Learn</h3>
                    <ul className="space-y-3">
                      {scenario.learningObjectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-blue-500 mt-1">✓</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Success Criteria */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Success Criteria</h3>
                    <div className="space-y-3">
                      {scenario.successCriteria.map((criterion, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex items-start justify-between">
                            <span className="flex-1">{criterion.description}</span>
                            <span className="text-sm text-gray-500 ml-3">
                              {Math.round(criterion.weight * 100)}% weight
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {(scenario.prerequisites.completed.length > 0 || scenario.prerequisites.missing.length > 0) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Prerequisites</h3>
                      <div className="space-y-2">
                        {scenario.prerequisites.completed.map(prereq => (
                          <div key={prereq} className="flex items-center gap-2 text-green-600">
                            <span>✅</span>
                            <span className="text-sm">Completed: {prereq}</span>
                          </div>
                        ))}
                        {scenario.prerequisites.missing.map(prereq => (
                          <div key={prereq} className="flex items-center gap-2 text-red-600">
                            <span>❌</span>
                            <span className="text-sm">Required: {prereq}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'assessment' && (
                <div className="space-y-6">
                  {/* Assessment Categories */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Assessment Areas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(scenario.assessmentCriteria).map(([category, criteria]) => (
                        <Card key={category} className="p-4">
                          <h4 className="font-semibold mb-3 capitalize">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(criteria).map(([skill, weight]) => (
                              <div key={skill} className="flex justify-between text-sm">
                                <span className="capitalize">
                                  {skill.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-gray-500">{weight}%</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Assessment Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Assessment Process</h3>
                    <Card className="p-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>Your performance will be evaluated across multiple dimensions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>Both automated and manual assessments may be used</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>Detailed feedback will be provided upon completion</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>You can retry scenarios to improve your score</span>
                        </li>
                      </ul>
                    </Card>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {canStart ? (
                    "Ready to start this scenario"
                  ) : (
                    `Complete ${scenario.prerequisites.missing.length} prerequisite(s) to unlock`
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                  
                  <Button
                    onClick={() => onStart(scenario.id)}
                    disabled={!canStart}
                    className={cn({
                      'opacity-50 cursor-not-allowed': !canStart
                    })}
                  >
                    {!canStart && '🔒 '}
                    Start Scenario
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}