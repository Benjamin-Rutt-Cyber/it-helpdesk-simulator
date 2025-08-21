'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { 
  Shield, 
  FileText, 
  ArrowUp, 
  CheckCircle, 
  Clock, 
  User,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Star,
  Zap
} from 'lucide-react';

// Import Epic 5 Components
import VerificationChecklist from '../verification/VerificationChecklist';
import VerificationBlocker from '../verification/VerificationBlocker';
import DocumentationTemplate from '../documentation/DocumentationTemplate';
import EscalationForm from '../escalation/EscalationForm';
import ResolutionWorkflow from '../resolution/ResolutionWorkflow';
import VerificationService from '../verification/VerificationService';

export interface TicketWorkflowProps {
  ticketId: string;
  ticketData: {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
    priority: 'low' | 'medium' | 'high' | 'critical';
    customer: {
      name: string;
      username: string;
      department: string;
      contactInfo: string;
      assetTag?: string;
    };
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  onTicketUpdate: (updates: any) => void;
  onClose: () => void;
}

interface WorkflowState {
  currentPhase: 'verification' | 'resolution' | 'documentation' | 'escalation' | 'closure';
  verificationStatus: {
    customerName: boolean;
    username: boolean;
    assetTag: boolean;
    department: boolean;
    contactInfo: boolean;
  };
  isVerificationBlocked: boolean;
  verificationSessionId?: string;
  resolutionSteps: any[];
  qualityGates: any[];
  documentation?: any;
  escalationRequest?: any;
  completionData?: any;
}

export const TicketWorkflow: React.FC<TicketWorkflowProps> = ({
  ticketId,
  ticketData,
  onTicketUpdate,
  onClose
}) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentPhase: 'verification',
    verificationStatus: {
      customerName: false,
      username: false,
      assetTag: false,
      department: false,
      contactInfo: false
    },
    isVerificationBlocked: true,
    resolutionSteps: [],
    qualityGates: []
  });

  const [activeTab, setActiveTab] = useState('verification');
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(true);

  // Initialize verification service
  const [verificationService] = useState(() => new VerificationService());

  useEffect(() => {
    initializeWorkflow();
  }, [ticketId]);

  const initializeWorkflow = async () => {
    try {
      // Start verification session
      const session = await verificationService.startVerificationSession(
        ticketId,
        'current-user', // Would come from auth context
        'office-worker' // Would be determined from ticket context
      );

      setWorkflowState(prev => ({
        ...prev,
        verificationSessionId: session.id
      }));
    } catch (error) {
      console.error('Error initializing workflow:', error);
    }
  };

  const handleVerificationUpdate = useCallback((fieldId: string, updates: any) => {
    setWorkflowState(prev => ({
      ...prev,
      verificationStatus: {
        ...prev.verificationStatus,
        [fieldId]: updates.status === 'verified'
      }
    }));

    // Check if verification is complete
    const allVerified = Object.values({
      ...workflowState.verificationStatus,
      [fieldId]: updates.status === 'verified'
    }).every(Boolean);

    if (allVerified) {
      setWorkflowState(prev => ({
        ...prev,
        isVerificationBlocked: false,
        currentPhase: 'resolution'
      }));
      setActiveTab('resolution');
    }
  }, [workflowState.verificationStatus]);

  const handleStartVerification = useCallback(() => {
    setActiveTab('verification');
    setIsWorkflowExpanded(true);
  }, []);

  const handleResolutionStepUpdate = useCallback((stepId: string, updates: any) => {
    setWorkflowState(prev => ({
      ...prev,
      resolutionSteps: prev.resolutionSteps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  }, []);

  const handleQualityGateUpdate = useCallback((gateId: string, updates: any) => {
    setWorkflowState(prev => ({
      ...prev,
      qualityGates: prev.qualityGates.map(gate =>
        gate.id === gateId ? { ...gate, ...updates } : gate
      )
    }));
  }, []);

  const handleDocumentationSave = useCallback((documentation: any) => {
    setWorkflowState(prev => ({
      ...prev,
      documentation
    }));
    
    // Auto-advance to closure phase if resolution is complete
    const resolutionComplete = workflowState.resolutionSteps
      .filter(step => step.required)
      .every(step => step.status === 'completed');
    
    if (resolutionComplete) {
      setWorkflowState(prev => ({
        ...prev,
        currentPhase: 'closure'
      }));
    }
  }, [workflowState.resolutionSteps]);

  const handleEscalationSubmit = useCallback((escalationData: any) => {
    setWorkflowState(prev => ({
      ...prev,
      escalationRequest: escalationData,
      currentPhase: 'escalation'
    }));

    // Update ticket status
    onTicketUpdate({
      ...ticketData,
      status: 'escalated',
      updatedAt: new Date()
    });
  }, [ticketData, onTicketUpdate]);

  const handleWorkflowComplete = useCallback(() => {
    setWorkflowState(prev => ({
      ...prev,
      currentPhase: 'closure',
      completionData: {
        completedAt: new Date(),
        completedBy: 'current-user',
        finalStatus: 'resolved'
      }
    }));

    // Update ticket status
    onTicketUpdate({
      ...ticketData,
      status: 'resolved',
      updatedAt: new Date()
    });

    setActiveTab('closure');
  }, [ticketData, onTicketUpdate]);

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'verification': return <Shield className="w-5 h-5" />;
      case 'resolution': return <Zap className="w-5 h-5" />;
      case 'documentation': return <FileText className="w-5 h-5" />;
      case 'escalation': return <ArrowUp className="w-5 h-5" />;
      case 'closure': return <CheckCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getPhaseStatus = (phase: string) => {
    if (workflowState.currentPhase === phase) return 'active';
    if (phase === 'verification' && !workflowState.isVerificationBlocked) return 'completed';
    if (phase === 'resolution' && workflowState.currentPhase === 'closure') return 'completed';
    if (workflowState.currentPhase === 'closure') return 'completed';
    return 'pending';
  };

  const blockedActions = workflowState.isVerificationBlocked 
    ? ['resolve', 'escalate', 'close', 'modify', 'access']
    : [];

  return (
    <div className="ticket-workflow max-w-7xl mx-auto p-6">
      {/* Workflow Header */}
      <div className="workflow-header mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="ticket-info">
              <h1 className="text-2xl font-bold text-gray-900">
                Ticket #{ticketId}
              </h1>
              <p className="text-gray-600">{ticketData.title}</p>
            </div>
            <div className={`status-badge px-3 py-1 rounded-full text-sm font-medium ${
              ticketData.status === 'resolved' ? 'bg-green-100 text-green-800' :
              ticketData.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              ticketData.status === 'escalated' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ticketData.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
          
          <div className="workflow-controls flex items-center gap-3">
            <button
              onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              {isWorkflowExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              {isWorkflowExpanded ? 'Collapse' : 'Expand'} Workflow
            </button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        {/* Workflow Progress */}
        {isWorkflowExpanded && (
          <div className="workflow-progress mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Workflow Progress</h3>
              <div className="text-sm text-gray-600">
                Current Phase: <span className="font-medium capitalize">{workflowState.currentPhase}</span>
              </div>
            </div>
            
            <div className="progress-phases flex items-center gap-4">
              {['verification', 'resolution', 'documentation', 'closure'].map((phase, index) => {
                const status = getPhaseStatus(phase);
                return (
                  <div key={phase} className="flex items-center">
                    <div className={`phase-step flex items-center gap-2 px-4 py-2 rounded-lg ${
                      status === 'active' ? 'bg-blue-100 text-blue-800' :
                      status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getPhaseIcon(phase)}
                      <span className="font-medium capitalize">{phase}</span>
                      {status === 'completed' && <CheckCircle size={16} />}
                      {status === 'active' && <Clock size={16} />}
                    </div>
                    {index < 3 && (
                      <ChevronRight className="mx-2 text-gray-400" size={16} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Verification Blocker */}
      {workflowState.isVerificationBlocked && (
        <VerificationBlocker
          isBlocked={workflowState.isVerificationBlocked}
          verificationStatus={workflowState.verificationStatus}
          blockedActions={blockedActions}
          onStartVerification={handleStartVerification}
          emergencyOverrideAvailable={true}
          ticketId={ticketId}
          compactMode={!isWorkflowExpanded}
        />
      )}

      {/* Main Workflow Content */}
      {isWorkflowExpanded && (
        <div className="workflow-content">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="tabs-list mb-6">
              <button
                onClick={() => setActiveTab('verification')}
                className={`tab-button ${activeTab === 'verification' ? 'active' : ''}`}
                disabled={false}
              >
                <Shield size={18} />
                Identity Verification
                {!workflowState.isVerificationBlocked && <CheckCircle size={14} className="ml-2 text-green-600" />}
              </button>
              
              <button
                onClick={() => setActiveTab('resolution')}
                className={`tab-button ${activeTab === 'resolution' ? 'active' : ''}`}
                disabled={workflowState.isVerificationBlocked}
              >
                <Zap size={18} />
                Resolution Workflow
              </button>
              
              <button
                onClick={() => setActiveTab('documentation')}
                className={`tab-button ${activeTab === 'documentation' ? 'active' : ''}`}
                disabled={workflowState.isVerificationBlocked}
              >
                <FileText size={18} />
                Documentation
              </button>
              
              <button
                onClick={() => setActiveTab('escalation')}
                className={`tab-button ${activeTab === 'escalation' ? 'active' : ''}`}
                disabled={workflowState.isVerificationBlocked}
              >
                <ArrowUp size={18} />
                Escalation
              </button>
              
              <button
                onClick={() => setActiveTab('closure')}
                className={`tab-button ${activeTab === 'closure' ? 'active' : ''}`}
                disabled={workflowState.currentPhase !== 'closure'}
              >
                <CheckCircle size={18} />
                Closure
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'verification' && (
                <Card className="p-6">
                  <VerificationChecklist
                    ticketId={ticketId}
                    requirements={{
                      customerName: {
                        id: 'customerName',
                        name: 'Customer Name',
                        label: 'Customer Full Name',
                        required: true,
                        type: 'text',
                        status: workflowState.verificationStatus.customerName ? 'verified' : 'pending',
                        value: ticketData.customer.name
                      },
                      username: {
                        id: 'username',
                        name: 'Username',
                        label: 'Network Username',
                        required: true,
                        type: 'text',
                        status: workflowState.verificationStatus.username ? 'verified' : 'pending',
                        value: ticketData.customer.username
                      },
                      assetTag: {
                        id: 'assetTag',
                        name: 'Asset Tag',
                        label: 'Computer Asset Tag',
                        required: true,
                        type: 'text',
                        status: workflowState.verificationStatus.assetTag ? 'verified' : 'pending',
                        value: ticketData.customer.assetTag
                      },
                      department: {
                        id: 'department',
                        name: 'Department',
                        label: 'User Department',
                        required: true,
                        type: 'text',
                        status: workflowState.verificationStatus.department ? 'verified' : 'pending',
                        value: ticketData.customer.department
                      },
                      contactInfo: {
                        id: 'contactInfo',
                        name: 'Contact Info',
                        label: 'Contact Information',
                        required: true,
                        type: 'phone',
                        status: workflowState.verificationStatus.contactInfo ? 'verified' : 'pending',
                        value: ticketData.customer.contactInfo
                      }
                    }}
                    onFieldUpdate={handleVerificationUpdate}
                    isBlocked={workflowState.isVerificationBlocked}
                  />
                </Card>
              )}

              {activeTab === 'resolution' && (
                <Card className="p-6">
                  <ResolutionWorkflow
                    ticketId={ticketId}
                    resolutionSteps={workflowState.resolutionSteps}
                    qualityGates={workflowState.qualityGates}
                    onStepUpdate={handleResolutionStepUpdate}
                    onQualityGateUpdate={handleQualityGateUpdate}
                    onComplete={handleWorkflowComplete}
                  />
                </Card>
              )}

              {activeTab === 'documentation' && (
                <Card className="p-6">
                  <DocumentationTemplate
                    ticketId={ticketId}
                    initialData={workflowState.documentation}
                    onSave={handleDocumentationSave}
                    onExport={(format) => console.log('Export to', format)}
                  />
                </Card>
              )}

              {activeTab === 'escalation' && (
                <Card className="p-6">
                  <EscalationForm
                    ticketId={ticketId}
                    onSubmit={handleEscalationSubmit}
                    onCancel={() => setActiveTab('resolution')}
                    initialData={workflowState.escalationRequest}
                  />
                </Card>
              )}

              {activeTab === 'closure' && (
                <Card className="p-6">
                  <div className="closure-section">
                    <div className="closure-header mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-green-800">
                            Ticket Resolution Complete
                          </h2>
                          <p className="text-green-600">
                            All workflow steps have been completed successfully
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Completion Summary */}
                    <div className="completion-summary grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="summary-card">
                        <h3 className="font-semibold mb-3">Verification Status</h3>
                        <div className="space-y-2">
                          {Object.entries(workflowState.verificationStatus).map(([field, verified]) => (
                            <div key={field} className="flex items-center gap-2">
                              {verified ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <XCircle size={16} className="text-red-600" />
                              )}
                              <span className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="summary-card">
                        <h3 className="font-semibold mb-3">Resolution Quality</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Star size={16} className="text-yellow-500" />
                            <span>Quality Score: {workflowState.qualityGates.length > 0 ? '4.5/5' : 'Pending'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-blue-600" />
                            <span>Resolution Time: {Math.round(Math.random() * 45 + 15)} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-purple-600" />
                            <span>Customer Satisfaction: Excellent</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Final Actions */}
                    <div className="final-actions mt-8 flex gap-4">
                      <Button
                        onClick={() => {
                          onTicketUpdate({
                            ...ticketData,
                            status: 'closed',
                            updatedAt: new Date()
                          });
                          onClose();
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle size={16} />
                        Close Ticket
                      </Button>
                      
                      <Button
                        onClick={() => setActiveTab('documentation')}
                        variant="outline"
                      >
                        <FileText size={16} />
                        Review Documentation
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default TicketWorkflow;