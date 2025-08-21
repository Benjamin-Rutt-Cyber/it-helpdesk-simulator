'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle,
  XCircle,
  Clock,
  Star,
  FileText,
  Award,
  Target,
  TrendingUp,
  BookOpen,
  Users,
  Shield,
  Zap,
  AlertTriangle,
  Info,
  Download,
  Share,
  Archive,
  Eye,
  CheckSquare
} from 'lucide-react';

export interface ClosureChecklist {
  verificationCompleted: boolean;
  resolutionDocumented: boolean;
  qualityAssured: boolean;
  customerConfirmed: boolean;
  timeTracked: boolean;
  knowledgeBaseUpdated: boolean;
  followUpScheduled: boolean;
  performanceEvaluated: boolean;
}

export interface PerformanceMetrics {
  resolutionTime: number; // minutes
  firstContactResolution: boolean;
  customerSatisfaction: number; // 1-5
  qualityScore: number; // 1-5
  escalationRequired: boolean;
  knowledgeGained: string[];
  skillsUsed: string[];
  improvementAreas: string[];
  achievements: string[];
}

export interface ClosureSummary {
  ticketId: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resolution: {
    method: string;
    steps: string[];
    timeToResolve: number;
  };
  verification: {
    customerName: boolean;
    username: boolean;
    assetTag: boolean;
    department: boolean;
    contactInfo: boolean;
  };
  documentation: {
    problemSummary: string;
    solutionSteps: string[];
    rootCause: string;
    prevention: string;
  };
  customerFeedback: {
    satisfied: boolean;
    rating: number;
    comments: string;
    recommendService: boolean;
  };
  performance: PerformanceMetrics;
  learningOutcomes: {
    skillsPracticed: string[];
    competenciesGained: string[];
    learningPoints: string[];
    nextSteps: string[];
  };
}

interface TicketClosureProps {
  ticketId: string;
  closureSummary: ClosureSummary;
  onClose: (portfolioData: any) => void;
  onExportPortfolio: (format: 'pdf' | 'json' | 'md') => void;
  onShareAchievement: (achievement: string) => void;
}

const COMPETENCY_LEVELS = {
  'customer-service': { label: 'Customer Service', icon: Users, color: 'text-blue-600' },
  'technical-problem-solving': { label: 'Technical Problem Solving', icon: Zap, color: 'text-green-600' },
  'documentation': { label: 'Documentation', icon: FileText, color: 'text-purple-600' },
  'security-awareness': { label: 'Security Awareness', icon: Shield, color: 'text-red-600' },
  'time-management': { label: 'Time Management', icon: Clock, color: 'text-orange-600' },
  'quality-assurance': { label: 'Quality Assurance', icon: CheckSquare, color: 'text-indigo-600' }
};

export const TicketClosure: React.FC<TicketClosureProps> = ({
  ticketId,
  closureSummary,
  onClose,
  onExportPortfolio,
  onShareAchievement
}) => {
  const [closureChecklist, setClosureChecklist] = useState<ClosureChecklist>({
    verificationCompleted: true,
    resolutionDocumented: true,
    qualityAssured: true,
    customerConfirmed: true,
    timeTracked: true,
    knowledgeBaseUpdated: false,
    followUpScheduled: false,
    performanceEvaluated: false
  });
  
  const [activeTab, setActiveTab] = useState<'summary' | 'performance' | 'learning' | 'portfolio'>('summary');
  const [knowledgeBaseEntry, setKnowledgeBaseEntry] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [portfolioNotes, setPortfolioNotes] = useState('');
  const [isClosingTicket, setIsClosingTicket] = useState(false);

  const checklistItems = [
    { key: 'verificationCompleted', label: 'Customer Identity Verified', icon: Shield },
    { key: 'resolutionDocumented', label: 'Resolution Documented', icon: FileText },
    { key: 'qualityAssured', label: 'Quality Standards Met', icon: CheckSquare },
    { key: 'customerConfirmed', label: 'Customer Confirmation Received', icon: Users },
    { key: 'timeTracked', label: 'Time Properly Tracked', icon: Clock },
    { key: 'knowledgeBaseUpdated', label: 'Knowledge Base Updated', icon: BookOpen },
    { key: 'followUpScheduled', label: 'Follow-up Scheduled (if needed)', icon: Target },
    { key: 'performanceEvaluated', label: 'Performance Self-Evaluated', icon: TrendingUp }
  ];

  const updateChecklist = useCallback((item: keyof ClosureChecklist, value: boolean) => {
    setClosureChecklist(prev => ({ ...prev, [item]: value }));
  }, []);

  const getCompletionRate = useCallback((): number => {
    const completed = Object.values(closureChecklist).filter(Boolean).length;
    const total = Object.values(closureChecklist).length;
    return Math.round((completed / total) * 100);
  }, [closureChecklist]);

  const isReadyToClose = useCallback((): boolean => {
    const required = ['verificationCompleted', 'resolutionDocumented', 'qualityAssured', 'customerConfirmed'];
    return required.every(key => closureChecklist[key as keyof ClosureChecklist]);
  }, [closureChecklist]);

  const calculatePerformanceScore = useCallback((): number => {
    const { performance } = closureSummary;
    let score = 0;
    
    // Time efficiency (0-25 points)
    if (performance.resolutionTime <= 30) score += 25;
    else if (performance.resolutionTime <= 60) score += 20;
    else if (performance.resolutionTime <= 120) score += 15;
    else score += 10;
    
    // First contact resolution (0-20 points)
    if (performance.firstContactResolution) score += 20;
    
    // Customer satisfaction (0-25 points)
    score += (performance.customerSatisfaction / 5) * 25;
    
    // Quality score (0-20 points)
    score += (performance.qualityScore / 5) * 20;
    
    // No escalation bonus (0-10 points)
    if (!performance.escalationRequired) score += 10;
    
    return Math.round(score);
  }, [closureSummary]);

  const getPerformanceGrade = useCallback((score: number): { grade: string; color: string } => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-700' };
    if (score >= 85) return { grade: 'A', color: 'text-green-600' };
    if (score >= 80) return { grade: 'B+', color: 'text-blue-600' };
    if (score >= 75) return { grade: 'B', color: 'text-blue-500' };
    if (score >= 70) return { grade: 'C+', color: 'text-yellow-600' };
    if (score >= 65) return { grade: 'C', color: 'text-yellow-500' };
    return { grade: 'D', color: 'text-red-600' };
  }, []);

  const handleTicketClose = useCallback(async () => {
    if (!isReadyToClose()) return;
    
    setIsClosingTicket(true);
    
    // Create portfolio data
    const portfolioData = {
      ticketId,
      closureDate: new Date(),
      summary: closureSummary,
      performanceScore: calculatePerformanceScore(),
      competenciesDemonstrated: closureSummary.learningOutcomes.competenciesGained,
      portfolioNotes,
      achievements: closureSummary.performance.achievements
    };
    
    // Simulate processing time
    setTimeout(() => {
      onClose(portfolioData);
      setIsClosingTicket(false);
    }, 2000);
  }, [isReadyToClose, ticketId, closureSummary, calculatePerformanceScore, portfolioNotes, onClose]);

  const performanceScore = calculatePerformanceScore();
  const performanceGrade = getPerformanceGrade(performanceScore);

  return (
    <div className="ticket-closure max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="closure-header mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket Closure</h1>
            <p className="text-gray-600">#{ticketId} - {closureSummary.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">Completion Rate</div>
              <div className="text-lg font-bold text-blue-600">{getCompletionRate()}%</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Archive className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionRate()}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b">
          {[
            { key: 'summary', label: 'Summary', icon: Eye },
            { key: 'performance', label: 'Performance', icon: TrendingUp },
            { key: 'learning', label: 'Learning', icon: BookOpen },
            { key: 'portfolio', label: 'Portfolio', icon: Award }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 font-medium rounded-t-lg ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content mb-8">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Closure Checklist */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Closure Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {checklistItems.map(item => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      closureChecklist[item.key as keyof ClosureChecklist]
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={closureChecklist[item.key as keyof ClosureChecklist]}
                        onChange={(e) => updateChecklist(item.key as keyof ClosureChecklist, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                    <item.icon className={`w-5 h-5 ${
                      closureChecklist[item.key as keyof ClosureChecklist]
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      closureChecklist[item.key as keyof ClosureChecklist]
                        ? 'text-green-800'
                        : 'text-gray-700'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Resolution Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resolution Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor(closureSummary.resolution.timeToResolve / 60)}min
                  </div>
                  <div className="text-sm text-gray-600">Resolution Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {closureSummary.customerFeedback.rating}/5
                  </div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {closureSummary.performance.qualityScore}/5
                  </div>
                  <div className="text-sm text-gray-600">Quality Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    closureSummary.performance.firstContactResolution ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {closureSummary.performance.firstContactResolution ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-gray-600">First Contact</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Problem Summary</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {closureSummary.documentation.problemSummary}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Solution Applied</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {closureSummary.resolution.method}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Customer Feedback</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= closureSummary.customerFeedback.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({closureSummary.customerFeedback.rating}/5)
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      {closureSummary.customerFeedback.comments}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Knowledge Base Update */}
            {!closureChecklist.knowledgeBaseUpdated && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Knowledge Base Contribution</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Knowledge Base Entry (Optional)
                    </label>
                    <textarea
                      value={knowledgeBaseEntry}
                      onChange={(e) => setKnowledgeBaseEntry(e.target.value)}
                      className="w-full p-3 border rounded-md h-24 resize-vertical"
                      placeholder="Describe the solution for future reference..."
                    />
                  </div>
                  <Button
                    onClick={() => updateChecklist('knowledgeBaseUpdated', true)}
                    variant="outline"
                    size="sm"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Update Knowledge Base
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Assessment</h3>
              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${performanceGrade.color}`}>
                    {performanceGrade.grade}
                  </div>
                  <div className="text-sm text-gray-600">Overall Grade</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">{performanceScore}</div>
                  <div className="text-sm text-gray-600">Score (out of 100)</div>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${performanceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Performance Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {closureSummary.performance.resolutionTime <= 30 ? '25' :
                     closureSummary.performance.resolutionTime <= 60 ? '20' :
                     closureSummary.performance.resolutionTime <= 120 ? '15' : '10'}/25
                  </div>
                  <div className="text-xs text-gray-600">Time Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {closureSummary.performance.firstContactResolution ? '20' : '0'}/20
                  </div>
                  <div className="text-xs text-gray-600">First Contact</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round((closureSummary.performance.customerSatisfaction / 5) * 25)}/25
                  </div>
                  <div className="text-xs text-gray-600">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {Math.round((closureSummary.performance.qualityScore / 5) * 20)}/20
                  </div>
                  <div className="text-xs text-gray-600">Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {!closureSummary.performance.escalationRequired ? '10' : '0'}/10
                  </div>
                  <div className="text-xs text-gray-600">No Escalation</div>
                </div>
              </div>
            </Card>

            {/* Skills Assessment */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Skills Demonstrated</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {closureSummary.performance.skillsUsed.map(skill => {
                  const competency = COMPETENCY_LEVELS[skill as keyof typeof COMPETENCY_LEVELS];
                  if (!competency) return null;
                  
                  return (
                    <div key={skill} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <competency.icon className={`w-5 h-5 ${competency.color}`} />
                      <span className="font-medium">{competency.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Achievements */}
            {closureSummary.performance.achievements.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Achievements Unlocked</h3>
                <div className="space-y-3">
                  {closureSummary.performance.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">{achievement}</span>
                      </div>
                      <Button
                        onClick={() => onShareAchievement(achievement)}
                        size="sm"
                        variant="outline"
                        className="text-yellow-600 border-yellow-300"
                      >
                        <Share className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="space-y-6">
            {/* Learning Outcomes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Learning Outcomes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-green-700">Skills Practiced</h4>
                  <div className="space-y-2">
                    {closureSummary.learningOutcomes.skillsPracticed.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-blue-700">Competencies Gained</h4>
                  <div className="space-y-2">
                    {closureSummary.learningOutcomes.competenciesGained.map((competency, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{competency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Key Learning Points */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Key Learning Points</h3>
              <div className="space-y-3">
                {closureSummary.learningOutcomes.learningPoints.map((point, index) => (
                  <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-gray-700">{point}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Improvement Areas */}
            {closureSummary.performance.improvementAreas.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Areas for Improvement</h3>
                <div className="space-y-3">
                  {closureSummary.performance.improvementAreas.map((area, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <Target className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-800">Improvement Opportunity</p>
                        <p className="text-sm text-orange-700">{area}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Next Steps */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recommended Next Steps</h3>
              <div className="space-y-3">
                {closureSummary.learningOutcomes.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Portfolio Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Professional Portfolio Entry</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${performanceGrade.color}`}>
                      {performanceGrade.grade}
                    </div>
                    <div className="text-sm text-gray-600">Performance Grade</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.floor(closureSummary.resolution.timeToResolve / 60)}min
                    </div>
                    <div className="text-sm text-gray-600">Resolution Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {closureSummary.learningOutcomes.competenciesGained.length}
                    </div>
                    <div className="text-sm text-gray-600">Skills Gained</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Portfolio Notes (Optional)
                  </label>
                  <textarea
                    value={portfolioNotes}
                    onChange={(e) => setPortfolioNotes(e.target.value)}
                    className="w-full p-3 border rounded-md h-24 resize-vertical"
                    placeholder="Add personal notes about this experience for your portfolio..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => onExportPortfolio('pdf')}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button
                    onClick={() => onExportPortfolio('json')}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  <Button
                    onClick={() => onExportPortfolio('md')}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Markdown
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Closure Actions */}
      <div className="closure-actions">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Close Ticket?</h3>
              <p className="text-sm text-gray-600">
                {isReadyToClose() 
                  ? 'All required closure steps have been completed.'
                  : 'Please complete all required closure steps before closing the ticket.'
                }
              </p>
              
              {!isReadyToClose() && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Missing required steps: {
                        ['verificationCompleted', 'resolutionDocumented', 'qualityAssured', 'customerConfirmed']
                          .filter(key => !closureChecklist[key as keyof ClosureChecklist])
                          .join(', ')
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleTicketClose}
                disabled={!isReadyToClose() || isClosingTicket}
                className="bg-green-600 hover:bg-green-700"
              >
                {isClosingTicket ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Closing...
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 mr-2" />
                    Close Ticket
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TicketClosure;