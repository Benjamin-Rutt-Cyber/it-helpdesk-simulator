import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface CustomerContext {
  customerId: string;
  name: string;
  department: string;
  role: string;
  technicalSkillLevel: 'novice' | 'intermediate' | 'advanced';
  communicationStyle: {
    formality: 'casual' | 'professional' | 'very_formal';
    responseLength: 'brief' | 'detailed' | 'verbose';
    emotionalState: 'calm' | 'stressed' | 'frustrated' | 'urgent';
    helpfulness: number;
    patience: number;
  };
  contactInfo: {
    email: string;
    phone?: string;
    location: string;
    timezone: string;
    preferredContactMethod: 'email' | 'phone' | 'chat' | 'in_person';
  };
  workSchedule: {
    availability: string;
    timeConstraints: string[];
    urgentDeadlines: string[];
  };
  relationshipHistory: {
    previousInteractions: number;
    satisfactionRating: number;
    escalationHistory: number;
    resolutionSuccess: number;
    commonIssues: string[];
  };
  departmentContext: {
    businessFunction: string;
    criticalSystems: string[];
    operationalImpact: string;
    departmentSize: number;
  };
}

interface CustomerProfileProps {
  customerContext: CustomerContext;
  className?: string;
  compact?: boolean;
}

export function CustomerProfile({ 
  customerContext, 
  className, 
  compact = false 
}: CustomerProfileProps) {
  const getSkillLevelColor = () => {
    switch (customerContext.technicalSkillLevel) {
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

  const getEmotionalStateIcon = () => {
    switch (customerContext.communicationStyle.emotionalState) {
      case 'calm': return '😌';
      case 'stressed': return '😰';
      case 'frustrated': return '😤';
      case 'urgent': return '⚡';
      default: return '😐';
    }
  };

  const getContactMethodIcon = () => {
    switch (customerContext.contactInfo.preferredContactMethod) {
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'chat': return '💬';
      case 'in_person': return '👥';
      default: return '📧';
    }
  };

  const renderRating = (value: number, max: number = 10) => {
    const percentage = (value / max) * 100;
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={cn(
              'h-2 rounded-full',
              percentage >= 70 ? 'bg-green-500' : 
              percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600">
          {value}/{max}
        </span>
      </div>
    );
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="text-yellow-400">☆</span>);
      } else {
        stars.push(<span key={i} className="text-gray-300">☆</span>);
      }
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-gray-600 ml-1">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  if (compact) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{customerContext.name}</h3>
            <p className="text-sm text-gray-600">
              {customerContext.role} • {customerContext.department}
            </p>
          </div>
          <div className={cn(
            'px-2 py-1 rounded-md border text-xs font-medium',
            getSkillLevelColor()
          )}>
            {customerContext.technicalSkillLevel.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Emotional State:</span>
            <div className="flex items-center gap-1 mt-1">
              <span>{getEmotionalStateIcon()}</span>
              <span className="capitalize">{customerContext.communicationStyle.emotionalState}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Preferred Contact:</span>
            <div className="flex items-center gap-1 mt-1">
              <span>{getContactMethodIcon()}</span>
              <span className="capitalize">{customerContext.contactInfo.preferredContactMethod}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b bg-gray-50 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {customerContext.name}
            </h3>
            <p className="text-gray-600">
              {customerContext.role} • {customerContext.department}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ID: {customerContext.customerId}
            </p>
          </div>
          
          <div className={cn(
            'px-3 py-1 rounded-md border text-sm font-medium',
            getSkillLevelColor()
          )}>
            {customerContext.technicalSkillLevel.toUpperCase()} USER
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Communication Style */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>💬</span>
            Communication Profile
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Current State:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg">{getEmotionalStateIcon()}</span>
                  <span className="capitalize font-medium">
                    {customerContext.communicationStyle.emotionalState}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Formality Level:</span>
                <p className="font-medium capitalize mt-1">
                  {customerContext.communicationStyle.formality.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Response Style:</span>
                <p className="font-medium capitalize mt-1">
                  {customerContext.communicationStyle.responseLength}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Helpfulness:</span>
                {renderRating(customerContext.communicationStyle.helpfulness)}
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Patience Level:</span>
                {renderRating(customerContext.communicationStyle.patience)}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>📞</span>
            Contact Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>📧</span>
                <span className="text-sm">{customerContext.contactInfo.email}</span>
              </div>
              
              {customerContext.contactInfo.phone && (
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span className="text-sm">{customerContext.contactInfo.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span className="text-sm">{customerContext.contactInfo.location}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500">Preferred Method:</span>
                <div className="flex items-center gap-1 mt-1">
                  <span>{getContactMethodIcon()}</span>
                  <span className="text-sm capitalize">
                    {customerContext.contactInfo.preferredContactMethod}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-xs text-gray-500">Timezone:</span>
                <p className="text-sm mt-1">{customerContext.contactInfo.timezone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Work Schedule & Availability */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>⏰</span>
            Availability & Schedule
          </h4>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">General Availability:</span>
              <p className="font-medium mt-1">{customerContext.workSchedule.availability}</p>
            </div>
            
            {customerContext.workSchedule.timeConstraints.length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Current Constraints:</span>
                <ul className="mt-1 space-y-1">
                  {customerContext.workSchedule.timeConstraints.map((constraint, index) => (
                    <li key={index} className="text-sm text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                      ⚠️ {constraint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {customerContext.workSchedule.urgentDeadlines.length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Urgent Deadlines:</span>
                <ul className="mt-1 space-y-1">
                  {customerContext.workSchedule.urgentDeadlines.map((deadline, index) => (
                    <li key={index} className="text-sm text-red-700 bg-red-50 px-2 py-1 rounded">
                      🚨 {deadline}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Relationship History */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>📊</span>
            Support History
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Previous Interactions:</span>
                <p className="font-medium mt-1">{customerContext.relationshipHistory.previousInteractions}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Satisfaction Rating:</span>
                <div className="mt-1">
                  {renderStarRating(customerContext.relationshipHistory.satisfactionRating)}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Resolution Success:</span>
                <p className="font-medium mt-1">{customerContext.relationshipHistory.resolutionSuccess}%</p>
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Common Issues:</span>
              <div className="mt-1 space-y-1">
                {customerContext.relationshipHistory.commonIssues.map((issue, index) => (
                  <span 
                    key={index}
                    className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Department Context */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>🏢</span>
            Department Context
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Business Function:</span>
                <p className="text-sm mt-1">{customerContext.departmentContext.businessFunction}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Operational Impact:</span>
                <p className="text-sm mt-1">{customerContext.departmentContext.operationalImpact}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Department Size:</span>
                <p className="text-sm mt-1">{customerContext.departmentContext.departmentSize} employees</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Critical Systems:</span>
                <div className="mt-1 space-y-1">
                  {customerContext.departmentContext.criticalSystems.map((system, index) => (
                    <span 
                      key={index}
                      className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded mr-1"
                    >
                      {system}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Tips */}
        <div className="border-t pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-900 mb-2">💡 Communication Tips</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              {customerContext.communicationStyle.emotionalState === 'frustrated' && (
                <li>• Acknowledge their frustration and provide reassurance</li>
              )}
              {customerContext.communicationStyle.emotionalState === 'urgent' && (
                <li>• Communicate quickly and provide regular status updates</li>
              )}
              {customerContext.technicalSkillLevel === 'novice' && (
                <li>• Use simple, non-technical language and explain steps clearly</li>
              )}
              {customerContext.technicalSkillLevel === 'advanced' && (
                <li>• Can discuss technical details and provide advanced troubleshooting</li>
              )}
              {customerContext.communicationStyle.patience < 5 && (
                <li>• Keep explanations concise and move efficiently through solutions</li>
              )}
              <li>• Preferred contact method: {customerContext.contactInfo.preferredContactMethod}</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}