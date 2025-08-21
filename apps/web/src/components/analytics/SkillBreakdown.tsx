import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SkillAssessment {
  technicalSkills: {
    troubleshooting: number;
    systemKnowledge: number;
    toolProficiency: number;
    documentation: number;
    securityAwareness: number;
  };
  communicationSkills: {
    customerEmpathy: number;
    clarity: number;
    professionalism: number;
    activeListening: number;
    conflictResolution: number;
  };
  proceduralSkills: {
    workflowAdherence: number;
    timeManagement: number;
    escalationJudgment: number;
    qualityAssurance: number;
    continuousLearning: number;
  };
}

interface SkillBreakdownProps {
  userId: string;
  sessionId?: string;
  skillTrends?: {
    technical: number[];
    communication: number[];
    procedural: number[];
  };
  className?: string;
  showTrends?: boolean;
}

export function SkillBreakdown({
  userId,
  sessionId,
  skillTrends,
  className,
  showTrends = true
}: SkillBreakdownProps) {
  const [skillAssessment, setSkillAssessment] = useState<SkillAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'radar' | 'bars' | 'list'>('radar');

  useEffect(() => {
    loadSkillAssessment();
  }, [userId, sessionId]);

  const loadSkillAssessment = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (sessionId) {
        response = await fetch(`/api/analytics/session/${sessionId}/skills?userId=${userId}`);
      } else {
        // Get latest overall skill assessment (mock endpoint)
        response = await fetch(`/api/analytics/user/${userId}/skills`);
      }

      if (!response.ok) {
        throw new Error('Failed to load skill assessment');
      }

      const result = await response.json();
      setSkillAssessment(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSkillColor = (score: number): string => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 55) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSkillTextColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 55) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSkillLevel = (score: number): string => {
    if (score >= 85) return 'Expert';
    if (score >= 70) return 'Advanced';
    if (score >= 55) return 'Intermediate';
    return 'Beginner';
  };

  const skillCategories = [
    {
      title: 'Technical Skills',
      icon: '⚙️',
      skills: skillAssessment?.technicalSkills || {},
      color: 'border-blue-200 bg-blue-50',
      description: 'Core technical competencies for IT support'
    },
    {
      title: 'Communication Skills',
      icon: '💬',
      skills: skillAssessment?.communicationSkills || {},
      color: 'border-green-200 bg-green-50',
      description: 'Customer interaction and communication abilities'
    },
    {
      title: 'Procedural Skills',
      icon: '📋',
      skills: skillAssessment?.proceduralSkills || {},
      color: 'border-purple-200 bg-purple-50',
      description: 'Process adherence and workflow management'
    }
  ];

  const skillDisplayNames = {
    // Technical Skills
    troubleshooting: 'Problem Solving',
    systemKnowledge: 'System Knowledge',
    toolProficiency: 'Tool Proficiency',
    documentation: 'Documentation',
    securityAwareness: 'Security Awareness',
    
    // Communication Skills
    customerEmpathy: 'Customer Empathy',
    clarity: 'Communication Clarity',
    professionalism: 'Professionalism',
    activeListening: 'Active Listening',
    conflictResolution: 'Conflict Resolution',
    
    // Procedural Skills
    workflowAdherence: 'Workflow Adherence',
    timeManagement: 'Time Management',
    escalationJudgment: 'Escalation Judgment',
    qualityAssurance: 'Quality Assurance',
    continuousLearning: 'Continuous Learning'
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j}>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
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
          <h3 className="text-lg font-semibold">Failed to Load Skills</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadSkillAssessment} variant="outline">
          Try Again
        </Button>
      </Card>
    );
  }

  if (!skillAssessment) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Skill Assessment</h3>
          <p className="text-gray-600">
            {sessionId ? 'Session-specific skill performance' : 'Overall skill performance summary'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'radar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('radar')}
          >
            Radar
          </Button>
          <Button
            variant={viewMode === 'bars' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('bars')}
          >
            Bars
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Skills Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {skillCategories.map((category) => {
          const categorySkills = Object.values(category.skills);
          const averageScore = categorySkills.length > 0 
            ? Math.round(categorySkills.reduce((sum, score) => sum + score, 0) / categorySkills.length)
            : 0;

          return (
            <Card key={category.title} className={cn('p-4', category.color)}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{category.title}</h4>
                  <p className="text-xs text-gray-600">{category.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className={cn('text-2xl font-bold', getSkillTextColor(averageScore))}>
                    {averageScore}
                  </div>
                  <div className="text-xs text-gray-600">
                    {getSkillLevel(averageScore)}
                  </div>
                </div>
                
                {showTrends && skillTrends && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Trend</div>
                    <div className="w-16 h-8 bg-white rounded border">
                      {/* Mini trend visualization would go here */}
                      <div className="text-xs text-green-600 text-center leading-8">
                        +5.2%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Detailed Skills View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {skillCategories.map((category) => (
            <Card key={category.title} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{category.icon}</span>
                <h4 className="font-semibold text-gray-900">{category.title}</h4>
              </div>
              
              <div className="space-y-4">
                {Object.entries(category.skills).map(([skillKey, score]) => (
                  <div key={skillKey}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {skillDisplayNames[skillKey as keyof typeof skillDisplayNames] || skillKey}
                      </span>
                      <span className={cn('text-sm font-bold', getSkillTextColor(score))}>
                        {score}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn('h-2 rounded-full transition-all duration-300', getSkillColor(score))}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {getSkillLevel(score)}
                      </span>
                      {showTrends && (
                        <span className="text-xs text-green-600">
                          +2.1 from last session
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Radar Chart View */}
      {viewMode === 'radar' && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Skill Radar Chart</h4>
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>Radar chart visualization would be implemented here</p>
              <p className="text-sm">Using a charting library like Chart.js or D3</p>
            </div>
          </div>
        </Card>
      )}

      {/* Bar Chart View */}
      {viewMode === 'bars' && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Skill Comparison</h4>
          <div className="space-y-6">
            {skillCategories.map((category) => (
              <div key={category.title}>
                <h5 className="font-medium mb-3 flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.title}
                </h5>
                
                <div className="space-y-3">
                  {Object.entries(category.skills).map(([skillKey, score]) => (
                    <div key={skillKey} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-gray-700">
                        {skillDisplayNames[skillKey as keyof typeof skillDisplayNames] || skillKey}
                      </div>
                      
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={cn('h-3 rounded-full transition-all duration-500', getSkillColor(score))}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      
                      <div className="w-12 text-right">
                        <span className={cn('text-sm font-bold', getSkillTextColor(score))}>
                          {score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Skill Development Recommendations */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <span>💡</span>
          Skill Development Recommendations
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-blue-900 mb-2">Strengths to Leverage</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              {Object.entries({
                ...skillAssessment.technicalSkills,
                ...skillAssessment.communicationSkills,
                ...skillAssessment.proceduralSkills
              })
                .filter(([_, score]) => score >= 85)
                .slice(0, 3)
                .map(([skill, score]) => (
                  <li key={skill} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    {skillDisplayNames[skill as keyof typeof skillDisplayNames] || skill} ({score})
                  </li>
                ))}
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-blue-900 mb-2">Areas for Improvement</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              {Object.entries({
                ...skillAssessment.technicalSkills,
                ...skillAssessment.communicationSkills,
                ...skillAssessment.proceduralSkills
              })
                .filter(([_, score]) => score < 70)
                .slice(0, 3)
                .map(([skill, score]) => (
                  <li key={skill} className="flex items-center gap-2">
                    <span className="text-orange-600">→</span>
                    {skillDisplayNames[skill as keyof typeof skillDisplayNames] || skill} ({score})
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}