'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  User,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  RefreshCw,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

export interface CustomerFeedback {
  issueResolved: boolean;
  satisfactionRating: number; // 1-5
  experienceRating: number; // 1-5
  resolutionSpeed: 'too_slow' | 'appropriate' | 'very_fast';
  communicationQuality: 'poor' | 'fair' | 'good' | 'excellent';
  technicalCompetence: 'poor' | 'fair' | 'good' | 'excellent';
  additionalComments: string;
  recommendService: boolean;
  followUpNeeded: boolean;
  followUpReason?: string;
}

export interface ConfirmationAttempt {
  id: string;
  timestamp: Date;
  method: 'chat' | 'email' | 'phone' | 'in_person';
  status: 'sent' | 'delivered' | 'responded' | 'failed';
  response?: CustomerFeedback;
  notes: string;
  duration?: number; // in seconds for calls
}

interface CustomerConfirmationProps {
  ticketId: string;
  customerInfo: {
    name: string;
    email?: string;
    phone?: string;
    preferredContact: 'email' | 'phone' | 'chat';
  };
  resolutionSummary: {
    issue: string;
    solution: string;
    stepsPerformed: string[];
    timeToResolve: number;
  };
  onConfirmationComplete: (feedback: CustomerFeedback) => void;
  onFollowUpRequired: (reason: string) => void;
  simulatedCustomer?: boolean;
}

const SATISFACTION_LABELS = {
  1: { label: 'Very Dissatisfied', color: 'text-red-600', emoji: '😞' },
  2: { label: 'Dissatisfied', color: 'text-orange-600', emoji: '😐' },
  3: { label: 'Neutral', color: 'text-yellow-600', emoji: '😑' },
  4: { label: 'Satisfied', color: 'text-green-600', emoji: '😊' },
  5: { label: 'Very Satisfied', color: 'text-green-700', emoji: '😍' }
};

const CONTACT_METHODS = [
  { 
    id: 'chat', 
    label: 'Live Chat', 
    icon: MessageCircle, 
    description: 'Real-time chat conversation',
    estimatedTime: '2-5 minutes'
  },
  { 
    id: 'phone', 
    label: 'Phone Call', 
    icon: Phone, 
    description: 'Direct phone conversation',
    estimatedTime: '3-7 minutes'
  },
  { 
    id: 'email', 
    label: 'Email', 
    icon: Mail, 
    description: 'Email follow-up',
    estimatedTime: '1 hour response time'
  }
];

export const CustomerConfirmation: React.FC<CustomerConfirmationProps> = ({
  ticketId,
  customerInfo,
  resolutionSummary,
  onConfirmationComplete,
  onFollowUpRequired,
  simulatedCustomer = true
}) => {
  const [confirmationStage, setConfirmationStage] = useState<'prepare' | 'contact' | 'feedback' | 'complete'>('prepare');
  const [selectedMethod, setSelectedMethod] = useState<string>(customerInfo.preferredContact);
  const [attempts, setAttempts] = useState<ConfirmationAttempt[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<Partial<CustomerFeedback>>({
    issueResolved: true,
    satisfactionRating: 4,
    experienceRating: 4,
    resolutionSpeed: 'appropriate',
    communicationQuality: 'good',
    technicalCompetence: 'good',
    additionalComments: '',
    recommendService: true,
    followUpNeeded: false
  });
  const [isContacting, setIsContacting] = useState(false);
  const [contactDuration, setContactDuration] = useState(0);

  // Simulate contact duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isContacting) {
      interval = setInterval(() => {
        setContactDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isContacting]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startContact = useCallback(async (method: string) => {
    setIsContacting(true);
    setContactDuration(0);
    setConfirmationStage('contact');

    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newAttempt: ConfirmationAttempt = {
      id: attemptId,
      timestamp: new Date(),
      method: method as ConfirmationAttempt['method'],
      status: 'sent',
      notes: `Initiated ${method} contact with customer`
    };

    setAttempts(prev => [...prev, newAttempt]);

    // Simulate contact process
    if (simulatedCustomer) {
      setTimeout(() => {
        setAttempts(prev => prev.map(attempt => 
          attempt.id === attemptId 
            ? { ...attempt, status: 'delivered' }
            : attempt
        ));
      }, 2000);

      setTimeout(() => {
        setAttempts(prev => prev.map(attempt => 
          attempt.id === attemptId 
            ? { ...attempt, status: 'responded', duration: contactDuration }
            : attempt
        ));
        setIsContacting(false);
        setConfirmationStage('feedback');
      }, 5000 + Math.random() * 10000); // 5-15 seconds
    }
  }, [contactDuration, simulatedCustomer]);

  const simulateCustomerResponse = useCallback(() => {
    // Simulate realistic customer feedback based on resolution quality
    const satisfaction = Math.random() > 0.2 ? (Math.random() > 0.5 ? 4 : 5) : 3;
    const experience = satisfaction === 5 ? 5 : (satisfaction === 4 ? 4 : 3);
    
    const responses = {
      positive: [
        "Thank you so much! The issue is completely resolved and I'm very happy with the service.",
        "Great job! Everything is working perfectly now. I appreciate your help.",
        "Excellent service! The problem is fixed and you explained everything clearly."
      ],
      neutral: [
        "The issue seems to be resolved. It took a bit longer than expected but it's working now.",
        "Everything appears to be working. The solution was more complex than I thought.",
        "The problem is fixed. Thank you for your patience in explaining the steps."
      ],
      negative: [
        "The issue is resolved but I'm not entirely satisfied with how long it took.",
        "It's working now but I had to explain the problem multiple times.",
        "The solution works but I'm concerned it might happen again."
      ]
    };

    const responseType = satisfaction >= 4 ? 'positive' : satisfaction >= 3 ? 'neutral' : 'negative';
    const comments = responses[responseType];
    
    return {
      issueResolved: Math.random() > 0.1, // 90% resolved
      satisfactionRating: satisfaction,
      experienceRating: experience,
      resolutionSpeed: Math.random() > 0.7 ? 'too_slow' : 'appropriate',
      communicationQuality: satisfaction >= 4 ? 'excellent' : satisfaction >= 3 ? 'good' : 'fair',
      technicalCompetence: satisfaction >= 4 ? 'excellent' : satisfaction >= 3 ? 'good' : 'fair',
      additionalComments: comments[Math.floor(Math.random() * comments.length)],
      recommendService: satisfaction >= 4,
      followUpNeeded: Math.random() > 0.85, // 15% need follow-up
      followUpReason: Math.random() > 0.85 ? 'Want to make sure issue doesn\'t recur' : undefined
    };
  }, []);

  const handleSimulatedFeedback = useCallback(() => {
    const simulatedResponse = simulateCustomerResponse();
    setCurrentFeedback(simulatedResponse);
    setConfirmationStage('feedback');
  }, [simulateCustomerResponse]);

  const handleFeedbackSubmit = useCallback(() => {
    const completeFeedback = currentFeedback as CustomerFeedback;
    
    if (completeFeedback.followUpNeeded && completeFeedback.followUpReason) {
      onFollowUpRequired(completeFeedback.followUpReason);
    }
    
    onConfirmationComplete(completeFeedback);
    setConfirmationStage('complete');
  }, [currentFeedback, onConfirmationComplete, onFollowUpRequired]);

  const updateFeedback = useCallback((field: keyof CustomerFeedback, value: any) => {
    setCurrentFeedback(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="customer-confirmation max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="confirmation-header mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Customer Confirmation</h2>
            <p className="text-gray-600">Ticket #{ticketId} - {customerInfo.name}</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="progress-steps flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          {[
            { key: 'prepare', label: 'Prepare', icon: CheckSquare },
            { key: 'contact', label: 'Contact', icon: MessageCircle },
            { key: 'feedback', label: 'Feedback', icon: Star },
            { key: 'complete', label: 'Complete', icon: CheckCircle }
          ].map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                confirmationStage === step.key ? 'bg-blue-100 text-blue-800' :
                ['prepare', 'contact', 'feedback', 'complete'].indexOf(confirmationStage) > index
                  ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
              }`}>
                <step.icon className="w-4 h-4" />
                <span className="font-medium">{step.label}</span>
              </div>
              {index < 3 && <div className="w-8 h-px bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Stage Content */}
      <div className="stage-content">
        {confirmationStage === 'prepare' && (
          <div className="space-y-6">
            {/* Resolution Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resolution Summary</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Issue Addressed:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{resolutionSummary.issue}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Solution Applied:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{resolutionSummary.solution}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Steps Performed:</h4>
                  <ul className="space-y-2">
                    {resolutionSummary.stepsPerformed.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <span className="text-sm text-gray-600">Time to Resolve:</span>
                    <p className="font-medium">{Math.floor(resolutionSummary.timeToResolve / 60)} minutes</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Customer:</span>
                    <p className="font-medium">{customerInfo.name}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Method Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Select Contact Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {CONTACT_METHODS.map(method => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <method.icon className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">{method.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {method.estimatedTime}
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Contact Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Customer Contact Information:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Preferred:</span>
                    <span className="ml-2 capitalize">{customerInfo.preferredContact}</span>
                  </div>
                  {customerInfo.email && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2">{customerInfo.email}</span>
                    </div>
                  )}
                  {customerInfo.phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2">{customerInfo.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => startContact(selectedMethod)}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedMethod}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Contact Customer
                </Button>
                
                {simulatedCustomer && (
                  <Button
                    onClick={handleSimulatedFeedback}
                    variant="outline"
                    className="text-gray-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Simulate Response
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {confirmationStage === 'contact' && (
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Contacting Customer
                </h3>
                <p className="text-gray-600 mb-4">
                  Reaching out to {customerInfo.name} via {selectedMethod}...
                </p>
                
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {formatDuration(contactDuration)}
                </div>
                <div className="text-sm text-gray-500">
                  Contact duration
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setIsContacting(false);
                    setConfirmationStage('prepare');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel Contact
                </Button>
              </div>
            </div>
          </Card>
        )}

        {confirmationStage === 'feedback' && (
          <div className="space-y-6">
            {/* Customer Response */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Feedback</h3>
              
              {/* Issue Resolution Confirmation */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Is the issue completely resolved?</h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="issueResolved"
                      checked={currentFeedback.issueResolved === true}
                      onChange={() => updateFeedback('issueResolved', true)}
                    />
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Yes, completely resolved</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="issueResolved"
                      checked={currentFeedback.issueResolved === false}
                      onChange={() => updateFeedback('issueResolved', false)}
                    />
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span>No, still having issues</span>
                  </label>
                </div>
              </div>

              {/* Satisfaction Rating */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Overall Satisfaction Rating</h4>
                <div className="flex items-center gap-4 mb-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => updateFeedback('satisfactionRating', rating)}
                      className={`p-3 rounded-lg border transition-all ${
                        currentFeedback.satisfactionRating === rating
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">
                          {SATISFACTION_LABELS[rating as keyof typeof SATISFACTION_LABELS].emoji}
                        </div>
                        <div className="text-xs font-medium">
                          {rating}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className={`text-sm font-medium ${
                  SATISFACTION_LABELS[currentFeedback.satisfactionRating as keyof typeof SATISFACTION_LABELS]?.color
                }`}>
                  {SATISFACTION_LABELS[currentFeedback.satisfactionRating as keyof typeof SATISFACTION_LABELS]?.label}
                </p>
              </div>

              {/* Experience Rating */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Support Experience Rating</h4>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => updateFeedback('experienceRating', rating)}
                      className={`p-2 rounded ${
                        (currentFeedback.experienceRating || 0) >= rating
                          ? 'bg-yellow-400 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {currentFeedback.experienceRating}/5 stars
                </p>
              </div>

              {/* Specific Areas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Resolution Speed</label>
                  <select
                    value={currentFeedback.resolutionSpeed || 'appropriate'}
                    onChange={(e) => updateFeedback('resolutionSpeed', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="too_slow">Too Slow</option>
                    <option value="appropriate">Appropriate</option>
                    <option value="very_fast">Very Fast</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Communication Quality</label>
                  <select
                    value={currentFeedback.communicationQuality || 'good'}
                    onChange={(e) => updateFeedback('communicationQuality', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Technical Competence</label>
                  <select
                    value={currentFeedback.technicalCompetence || 'good'}
                    onChange={(e) => updateFeedback('technicalCompetence', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>
              </div>

              {/* Additional Comments */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Additional Comments</label>
                <textarea
                  value={currentFeedback.additionalComments || ''}
                  onChange={(e) => updateFeedback('additionalComments', e.target.value)}
                  className="w-full p-3 border rounded-md h-20 resize-vertical"
                  placeholder="Any additional feedback or suggestions..."
                />
              </div>

              {/* Recommendation */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Would you recommend our support service?</h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="recommendService"
                      checked={currentFeedback.recommendService === true}
                      onChange={() => updateFeedback('recommendService', true)}
                    />
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    <span>Yes, I would recommend</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="recommendService"
                      checked={currentFeedback.recommendService === false}
                      onChange={() => updateFeedback('recommendService', false)}
                    />
                    <ThumbsDown className="w-5 h-5 text-red-600" />
                    <span>No, I would not recommend</span>
                  </label>
                </div>
              </div>

              {/* Follow-up */}
              <div className="mb-6">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={currentFeedback.followUpNeeded || false}
                    onChange={(e) => updateFeedback('followUpNeeded', e.target.checked)}
                  />
                  <span className="font-medium">Follow-up required</span>
                </label>
                
                {currentFeedback.followUpNeeded && (
                  <input
                    type="text"
                    value={currentFeedback.followUpReason || ''}
                    onChange={(e) => updateFeedback('followUpReason', e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Reason for follow-up..."
                  />
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleFeedbackSubmit}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Feedback
                </Button>
                
                <Button
                  onClick={() => setConfirmationStage('prepare')}
                  variant="outline"
                >
                  Back
                </Button>
              </div>
            </Card>
          </div>
        )}

        {confirmationStage === 'complete' && (
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Customer Confirmation Complete
                </h3>
                <p className="text-gray-600 mb-6">
                  Thank you for confirming the resolution with {customerInfo.name}
                </p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {currentFeedback.satisfactionRating}/5
                    </div>
                    <div className="text-sm text-gray-600">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {currentFeedback.issueResolved ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-gray-600">Issue Resolved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {currentFeedback.recommendService ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-gray-600">Would Recommend</div>
                  </div>
                </div>

                {currentFeedback.followUpNeeded && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Follow-up Required</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      {currentFeedback.followUpReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomerConfirmation;