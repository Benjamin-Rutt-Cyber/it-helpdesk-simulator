import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface LearningObjectives {
  primaryObjectives: Array<{
    id: string;
    title: string;
    description: string;
    weight: number;
    measurable: boolean;
    timeframe: string;
    successCriteria: string[];
  }>;
  secondaryObjectives: Array<{
    id: string;
    title: string;
    description: string;
    weight: number;
    optional: boolean;
  }>;
  skillAssessment: {
    technicalSkills: Array<{
      skill: string;
      currentLevel: 'novice' | 'intermediate' | 'advanced';
      targetLevel: 'novice' | 'intermediate' | 'advanced';
      assessmentMethod: string;
    }>;
    softSkills: Array<{
      skill: string;
      importance: 'low' | 'medium' | 'high';
      assessmentCriteria: string[];
    }>;
  };
  performanceTargets: {
    timeTarget: number;
    accuracyTarget: number;
    communicationTarget: string;
    procedureComplianceTarget: number;
  };
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    triggerCondition: string;
    reward?: string;
    feedback: string;
  }>;
}

interface LearningObjectivesProps {
  learningObjectives: LearningObjectives;
  className?: string;
  compact?: boolean;
}

export function LearningObjectives({ 
  learningObjectives, 
  className, 
  compact = false 
}: LearningObjectivesProps) {
  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'novice':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'intermediate':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'advanced':
        return 'text-green-700 bg-green-50 border-green-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const renderProgressBar = (current: number, target: number, suffix: string = '%') => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              percentage >= 80 ? 'bg-green-500' : 
              percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 min-w-fit">
          {current}{suffix} / {target}{suffix}
        </span>
      </div>
    );
  };

  if (compact) {
    return (
      <Card className={cn('p-4', className)}>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span>🎯</span>
          Learning Goals
        </h3>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">Primary Objectives:</span>
            <p className="text-sm font-medium">
              {learningObjectives.primaryObjectives.length} key learning goals
            </p>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Time Target:</span>
            <p className="text-sm font-medium">
              {formatDuration(learningObjectives.performanceTargets.timeTarget)}
            </p>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Accuracy Target:</span>
            <p className="text-sm font-medium">
              {learningObjectives.performanceTargets.accuracyTarget}%
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b bg-gray-50 px-6 py-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>🎯</span>
          Learning Objectives
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          Goals, skills, and performance targets for this scenario
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Primary Objectives */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>📋</span>
            Primary Learning Objectives
          </h4>
          
          <div className="space-y-3">
            {learningObjectives.primaryObjectives.map((objective, index) => (
              <Card key={objective.id} className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-blue-900">{objective.title}</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600">
                      Weight: {Math.round(objective.weight * 100)}%
                    </span>
                    {objective.measurable && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                        Measurable
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-blue-800 mb-3">{objective.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Timeframe:</span>
                    <p className="text-blue-800">{objective.timeframe}</p>
                  </div>
                  
                  <div>
                    <span className="text-blue-600 font-medium">Success Criteria:</span>
                    <ul className="text-blue-800 mt-1">
                      {objective.successCriteria.map((criterion, criterionIndex) => (
                        <li key={criterionIndex} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Secondary Objectives */}
        {learningObjectives.secondaryObjectives.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span>📝</span>
              Secondary Objectives (Optional)
            </h4>
            
            <div className="space-y-2">
              {learningObjectives.secondaryObjectives.map((objective) => (
                <Card key={objective.id} className="p-3 bg-gray-50 border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">{objective.title}</h5>
                      <p className="text-sm text-gray-700">{objective.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-xs text-gray-500">
                        Weight: {Math.round(objective.weight * 100)}%
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        Optional
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Skill Assessment */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>🛠️</span>
            Skills Assessment
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technical Skills */}
            <div>
              <h5 className="font-medium mb-3 text-sm">Technical Skills</h5>
              <div className="space-y-3">
                {learningObjectives.skillAssessment.technicalSkills.map((skill, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{skill.skill}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium border',
                          getSkillLevelColor(skill.currentLevel)
                        )}>
                          {skill.currentLevel}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium border',
                          getSkillLevelColor(skill.targetLevel)
                        )}>
                          {skill.targetLevel}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{skill.assessmentMethod}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Soft Skills */}
            <div>
              <h5 className="font-medium mb-3 text-sm">Communication & Soft Skills</h5>
              <div className="space-y-3">
                {learningObjectives.skillAssessment.softSkills.map((skill, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{skill.skill}</span>
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium border',
                        getImportanceColor(skill.importance)
                      )}>
                        {skill.importance} priority
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Assessment Criteria:</span>
                      <ul className="mt-1 space-y-1">
                        {skill.assessmentCriteria.map((criterion, criterionIndex) => (
                          <li key={criterionIndex} className="text-xs text-gray-700 flex items-start gap-1">
                            <span className="text-gray-400 mt-0.5">•</span>
                            <span>{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Targets */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>📊</span>
            Performance Targets
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Time Target</span>
                  <span className="text-sm text-gray-600">
                    {formatDuration(learningObjectives.performanceTargets.timeTarget)}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full w-0 transition-all duration-300" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Complete scenario within target time</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Accuracy Target</span>
                  <span className="text-sm text-gray-600">
                    {learningObjectives.performanceTargets.accuracyTarget}%
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-0 transition-all duration-300" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Achieve minimum accuracy score</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium">Communication Target</span>
                <p className="text-sm text-gray-700 mt-1">
                  {learningObjectives.performanceTargets.communicationTarget}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Procedure Compliance</span>
                  <span className="text-sm text-gray-600">
                    {learningObjectives.performanceTargets.procedureComplianceTarget}%
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full w-0 transition-all duration-300" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Follow established procedures</p>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>🏆</span>
            Progress Milestones
          </h4>
          
          <div className="space-y-3">
            {learningObjectives.milestones.map((milestone, index) => (
              <Card key={milestone.id} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-yellow-900">{milestone.title}</h5>
                      {milestone.reward && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          {milestone.reward}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-yellow-800 mb-2">{milestone.description}</p>
                    
                    <div className="text-xs text-yellow-700 space-y-1">
                      <div>
                        <span className="font-medium">Trigger:</span> {milestone.triggerCondition}
                      </div>
                      <div>
                        <span className="font-medium">Feedback:</span> {milestone.feedback}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="border-t pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-900 mb-2">💡 Success Tips</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Focus on primary objectives first - they carry the most weight</li>
              <li>• Pay attention to communication style and customer needs</li>
              <li>• Document your steps for procedure compliance scoring</li>
              <li>• Ask clarifying questions to demonstrate thorough troubleshooting</li>
              <li>• Watch for milestone triggers to maximize your learning progress</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}