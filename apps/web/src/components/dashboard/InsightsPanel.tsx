import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Users,
  Target,
  BookOpen,
  Award,
  Activity,
  Clock,
  Zap,
  Brain,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ExternalLink
} from 'lucide-react';
import { InsightData } from '../../types/dashboard';

interface InsightsPanelProps {
  insightData: InsightData;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insightData }) => {
  const [activeTab, setActiveTab] = useState<'strengths' | 'improvements' | 'recommendations' | 'analysis'>('strengths');
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high':
        return 'bg-purple-100 text-purple-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'skill':
        return <Brain className="h-5 w-5 text-blue-600" />;
      case 'goal':
        return <Target className="h-5 w-5 text-green-600" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-yellow-600" />;
      case 'learning':
        return <BookOpen className="h-5 w-5 text-purple-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-orange-600" />;
    }
  };

  const handleRecommendationFeedback = (recommendationId: string, helpful: boolean) => {
    // Mock feedback submission
    console.log(`Feedback for ${recommendationId}: ${helpful ? 'helpful' : 'not helpful'}`);
    setFeedbackGiven(prev => new Set(prev).add(recommendationId));
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-purple-600';
    if (percentile >= 75) return 'text-green-600';
    if (percentile >= 50) return 'text-blue-600';
    if (percentile >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Performance Insights</h2>
        <p className="text-gray-600">
          AI-powered analysis of your professional development progress
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'strengths', label: 'Strengths', icon: Star },
          { id: 'improvements', label: 'Improvements', icon: TrendingUp },
          { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          { id: 'analysis', label: 'Analysis', icon: Activity }
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(id as any)}
            className="flex items-center flex-1"
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Performance Trend */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-3">
                {getTrendIcon(insightData.performanceTrend.direction)}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Overall Trend</h3>
              <p className="text-lg font-bold capitalize mb-1">
                {insightData.performanceTrend.direction}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                {insightData.performanceTrend.magnitude}% change
              </p>
              <Badge variant="secondary" className="text-xs">
                {insightData.performanceTrend.timeframe}
              </Badge>
            </div>

            {/* Percentile Ranking */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-3">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Team Ranking</h3>
              <p className={`text-2xl font-bold mb-1 ${getPercentileColor(insightData.comparison.percentile)}`}>
                {insightData.comparison.percentile}th
              </p>
              <p className="text-sm text-gray-600 mb-2">percentile</p>
              <p className="text-xs text-green-600 font-medium">
                {insightData.comparison.averageComparison}
              </p>
            </div>

            {/* Prediction */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-3">
                <Eye className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Prediction</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {insightData.performanceTrend.prediction}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'strengths' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-600" />
                Your Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {insightData.strengths.map((strength, index) => (
                <div key={index} className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{strength.area}</h3>
                      <p className="text-gray-600 mt-1">{strength.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {strength.score}/100
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Strength
                      </Badge>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Supporting Evidence:</h4>
                    <div className="space-y-1">
                      {strength.evidence.map((evidence, evidenceIndex) => (
                        <div key={evidenceIndex} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {evidence}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Professional Impact */}
                  <div className="p-3 bg-white rounded border border-green-200">
                    <h4 className="font-medium text-gray-800 mb-1">Professional Impact:</h4>
                    <p className="text-sm text-gray-600">{strength.professionalImpact}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'improvements' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {insightData.improvements.map((improvement, index) => (
                <div key={index} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{improvement.area}</h3>
                      <div className="flex items-center mt-1">
                        <Badge className={`mr-2 ${getPriorityColor(improvement.priority)}`}>
                          {improvement.priority} priority
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {improvement.estimatedTimeframe}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Current → Target</div>
                      <div className="font-bold text-orange-600">
                        {improvement.currentScore} → {improvement.targetScore}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress to Target</span>
                      <span className="font-medium">
                        {Math.round((improvement.currentScore / improvement.targetScore) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${(improvement.currentScore / improvement.targetScore) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Items */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Recommended Actions:</h4>
                    <div className="space-y-2">
                      {improvement.actionItems.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-start">
                          <ArrowRight className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-purple-600" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {insightData.recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start">
                      {getRecommendationIcon(recommendation.type)}
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {recommendation.title}
                        </h3>
                        <p className="text-gray-600 mt-1">{recommendation.description}</p>
                      </div>
                    </div>
                    <Badge className={`${getEffortColor(recommendation.effort)} capitalize`}>
                      {recommendation.effort} effort
                    </Badge>
                  </div>

                  {/* Benefit and Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-white rounded border border-purple-200">
                      <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                        <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                        Expected Benefit
                      </h4>
                      <p className="text-sm text-gray-600">{recommendation.benefit}</p>
                    </div>
                    <div className="p-3 bg-white rounded border border-purple-200">
                      <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                        <Clock className="h-4 w-4 text-blue-500 mr-1" />
                        Timeline
                      </h4>
                      <p className="text-sm text-gray-600">{recommendation.timeline}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {recommendation.actionUrl && (
                        <Button size="sm" className="flex items-center">
                          Take Action
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Learn More
                      </Button>
                    </div>

                    {/* Feedback */}
                    {!feedbackGiven.has(`rec_${index}`) ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Helpful?</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecommendationFeedback(`rec_${index}`, true)}
                          className="p-1 h-auto"
                        >
                          <ThumbsUp className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecommendationFeedback(`rec_${index}`, false)}
                          className="p-1 h-auto"
                        >
                          <ThumbsDown className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Thank you for feedback!
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-4">
          {/* Detailed Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                Detailed Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Factors */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Key Performance Factors</h3>
                <div className="space-y-2">
                  {insightData.performanceTrend.keyFactors.map((factor, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths vs Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-green-600">
                    Top Strength Areas
                  </h3>
                  <div className="space-y-2">
                    {insightData.comparison.strengthAreas.map((area, index) => (
                      <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                        <span className="text-sm font-medium text-green-800">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-orange-600">
                    Focus Areas
                  </h3>
                  <div className="space-y-2">
                    {insightData.comparison.improvementAreas.map((area, index) => (
                      <div key={index} className="p-2 bg-orange-50 rounded border border-orange-200">
                        <span className="text-sm font-medium text-orange-800">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Prediction */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  AI Performance Prediction
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {insightData.performanceTrend.prediction}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;