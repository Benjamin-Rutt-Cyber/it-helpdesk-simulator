import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Target,
  Plus,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Star,
  Zap,
  Trophy,
  BookOpen,
  Award,
  Users,
  Edit,
  Trash2,
  Play,
  Pause,
  MoreHorizontal,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { GoalData, Goal } from '../../types/dashboard';

interface GoalTrackerProps {
  goalData: GoalData;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ goalData }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'recommendations'>('active');
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'xp' as Goal['category'],
    targetValue: '',
    targetDate: '',
    priority: 'medium' as Goal['priority']
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'at_risk':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-gray-600" />;
      default:
        return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'xp':
        return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'level':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'skill':
        return <BookOpen className="h-4 w-4 text-green-600" />;
      case 'achievement':
        return <Award className="h-4 w-4 text-purple-600" />;
      case 'professional':
        return <Users className="h-4 w-4 text-indigo-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'challenging':
        return 'bg-red-100 text-red-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'easy':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateGoal = () => {
    // Mock goal creation
    console.log('Creating goal:', newGoal);
    setShowCreateGoal(false);
    setNewGoal({
      title: '',
      description: '',
      category: 'xp',
      targetValue: '',
      targetDate: '',
      priority: 'medium'
    });
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goal Tracking</h2>
          <p className="text-gray-600">
            Set and track your professional development goals
          </p>
        </div>
        <Button
          onClick={() => setShowCreateGoal(true)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Goal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {goalData.progress.totalActiveGoals}
            </p>
            <p className="text-sm text-gray-600">Active Goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {goalData.progress.onTrackGoals}
            </p>
            <p className="text-sm text-gray-600">On Track</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {goalData.progress.atRiskGoals}
            </p>
            <p className="text-sm text-gray-600">At Risk</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {goalData.progress.completedThisMonth}
            </p>
            <p className="text-sm text-gray-600">Completed This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'active', label: 'Active Goals', icon: Target },
          { id: 'completed', label: 'Completed', icon: CheckCircle },
          { id: 'recommendations', label: 'Recommendations', icon: Lightbulb }
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

      {/* Tab Content */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {goalData.activeGoals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Goals</h3>
                <p className="text-gray-600 mb-4">
                  Set your first goal to start tracking your professional development progress.
                </p>
                <Button onClick={() => setShowCreateGoal(true)} className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            goalData.activeGoals.map((goal, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      {getCategoryIcon(goal.category)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                        <p className="text-gray-600 text-sm">{goal.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority} priority
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {goal.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`border rounded-lg p-2 ${getStatusColor(goal.status)}`}>
                        {getStatusIcon(goal.status)}
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {goal.currentValue} / {goal.targetValue} 
                        ({Math.round((goal.currentValue / goal.targetValue) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          goal.status === 'on_track' ? 'bg-green-500' :
                          goal.status === 'at_risk' ? 'bg-yellow-500' :
                          goal.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-800 mb-2">Milestones</h4>
                      <div className="space-y-2">
                        {goal.milestones.map((milestone, milestoneIndex) => (
                          <div key={milestoneIndex} className="flex items-center text-sm">
                            {milestone.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2" />
                            )}
                            <span className={milestone.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                              {milestone.title}
                            </span>
                            {milestone.completed && milestone.completedDate && (
                              <span className="text-xs text-gray-500 ml-2">
                                ({milestone.completedDate.toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {goal.targetDate.toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {getDaysUntilDue(goal.targetDate)} days remaining
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t flex space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center text-red-600 hover:text-red-700">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="space-y-4">
          {goalData.completedGoals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Goals Yet</h3>
                <p className="text-gray-600">
                  Complete your first goal to see your achievements here.
                </p>
              </CardContent>
            </Card>
          ) : (
            goalData.completedGoals.map((goal, index) => (
              <Card key={index} className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                        <p className="text-gray-600 text-sm">{goal.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {goal.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>Completed</p>
                      <p className="font-medium">{goal.targetDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-orange-600" />
                Recommended Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {goalData.recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{recommendation.title}</h3>
                      <p className="text-gray-600 mt-1">{recommendation.description}</p>
                    </div>
                    <Badge className={getDifficultyColor(recommendation.difficulty)}>
                      {recommendation.difficulty}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-lg font-bold text-orange-600">
                        {recommendation.suggestedTargetValue}
                      </p>
                      <p className="text-xs text-gray-600">Target Value</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-lg font-bold text-blue-600">
                        {recommendation.suggestedTimeframe}
                      </p>
                      <p className="text-xs text-gray-600">Timeframe</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <p className="text-sm font-medium text-purple-600">
                        {recommendation.professionalImpact}
                      </p>
                      <p className="text-xs text-gray-600">Professional Impact</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="capitalize">
                      {recommendation.type}
                    </Badge>
                    <Button size="sm" className="flex items-center">
                      Create Goal
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Goal Modal (simplified) */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter goal title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your goal"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as Goal['category'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="xp">XP</option>
                    <option value="level">Level</option>
                    <option value="skill">Skill</option>
                    <option value="achievement">Achievement</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as Goal['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleCreateGoal} className="flex-1">
                  Create Goal
                </Button>
                <Button variant="outline" onClick={() => setShowCreateGoal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GoalTracker;