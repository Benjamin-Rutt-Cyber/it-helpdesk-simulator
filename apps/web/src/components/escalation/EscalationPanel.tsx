import React, { useState, useCallback, useEffect } from 'react';
import { 
  ArrowUp, 
  Plus, 
  BookOpen, 
  AlertTriangle, 
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import EscalationForm from './EscalationForm';
import EscalationStatus from './EscalationStatus';
import EscalationGuidelines from './EscalationGuidelines';

export interface EscalationPanelProps {
  ticketId: string;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

interface EscalationRequest {
  id: string;
  ticketId: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'in_progress' | 'resolved';
  justification: string;
  escalationTarget: string;
  createdAt: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  comments?: Array<{
    id: string;
    author: string;
    message: string;
    timestamp: Date;
    type: 'system' | 'user' | 'escalation_team';
  }>;
}

type ViewMode = 'list' | 'create' | 'edit' | 'guidelines';
type StatusFilter = 'all' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'in_progress' | 'resolved';

export const EscalationPanel: React.FC<EscalationPanelProps> = ({
  ticketId,
  isVisible,
  onClose,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [escalations, setEscalations] = useState<EscalationRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingEscalation, setEditingEscalation] = useState<EscalationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch escalations for the ticket
  const fetchEscalations = useCallback(async () => {
    if (!ticketId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Mock data
      const mockEscalations: EscalationRequest[] = [
        {
          id: 'ESC-001',
          ticketId,
          category: 'technical_complexity',
          priority: 'high',
          status: 'in_progress',
          justification: 'This issue requires advanced database troubleshooting skills that exceed my current knowledge level. The customer is experiencing intermittent connection drops to the SQL server.',
          escalationTarget: 'l2_support',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          assignedTo: 'John Smith (L2)',
          comments: [
            {
              id: 'comment-1',
              author: 'System',
              message: 'Escalation submitted to Level 2 Support',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              type: 'system'
            },
            {
              id: 'comment-2',
              author: 'John Smith',
              message: 'Reviewing the issue. Will investigate database connection logs.',
              timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
              type: 'escalation_team'
            }
          ]
        },
        {
          id: 'ESC-002',
          ticketId,
          category: 'permissions',
          priority: 'medium',
          status: 'draft',
          justification: 'Customer needs access to the financial reporting system which requires manager approval and elevated permissions that I cannot grant.',
          escalationTarget: 'system_admin',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          comments: []
        }
      ];
      
      setEscalations(mockEscalations);
    } catch (err) {
      setError('Failed to load escalations');
      console.error('Error fetching escalations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (isVisible) {
      fetchEscalations();
    }
  }, [isVisible, fetchEscalations]);

  const handleCreateEscalation = useCallback(async (escalationData: any) => {
    try {
      setIsLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newEscalation: EscalationRequest = {
        id: `ESC-${Date.now()}`,
        ticketId,
        ...escalationData,
        createdAt: new Date(),
        comments: []
      };
      
      setEscalations(prev => [newEscalation, ...prev]);
      setViewMode('list');
      
      // Auto-submit if not draft
      if (escalationData.status === 'submitted') {
        // Handle submission logic
      }
    } catch (err) {
      setError('Failed to create escalation');
      console.error('Error creating escalation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  const handleStatusUpdate = useCallback(async (escalationId: string, status: string) => {
    try {
      setIsLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEscalations(prev => prev.map(esc => 
        esc.id === escalationId 
          ? { ...esc, status: status as EscalationRequest['status'], updatedAt: new Date() }
          : esc
      ));
    } catch (err) {
      setError('Failed to update escalation status');
      console.error('Error updating status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddComment = useCallback(async (escalationId: string, comment: string) => {
    try {
      setIsLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newComment = {
        id: `comment-${Date.now()}`,
        author: 'Current User', // Would come from auth context
        message: comment,
        timestamp: new Date(),
        type: 'user' as const
      };
      
      setEscalations(prev => prev.map(esc => 
        esc.id === escalationId 
          ? { 
              ...esc, 
              comments: [...(esc.comments || []), newComment],
              updatedAt: new Date()
            }
          : esc
      ));
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditEscalation = useCallback((escalationId: string) => {
    const escalation = escalations.find(esc => esc.id === escalationId);
    if (escalation && escalation.status === 'draft') {
      setEditingEscalation(escalation);
      setViewMode('edit');
    }
  }, [escalations]);

  const filteredEscalations = escalations.filter(escalation => 
    statusFilter === 'all' || escalation.status === statusFilter
  );

  const getStatusCount = (status: StatusFilter): number => {
    if (status === 'all') return escalations.length;
    return escalations.filter(esc => esc.status === status).length;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`escalation-panel ${className}`}>
      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <ArrowUp size={24} className="text-blue-600" />
          <h2>Escalation Management</h2>
          <span className="ticket-id">Ticket #{ticketId}</span>
        </div>
        
        <div className="header-actions">
          {viewMode === 'list' && (
            <>
              <button
                onClick={() => setViewMode('guidelines')}
                className="header-action guidelines-btn"
                title="View Guidelines"
              >
                <BookOpen size={16} />
                Guidelines
              </button>
              
              <button
                onClick={() => setViewMode('create')}
                className="header-action create-btn"
                title="Create Escalation"
              >
                <Plus size={16} />
                New Escalation
              </button>
              
              <button
                onClick={fetchEscalations}
                className="header-action refresh-btn"
                disabled={isLoading}
                title="Refresh"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </>
          )}
          
          <button
            onClick={onClose}
            className="header-action close-btn"
            title="Close Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="panel-content">
        {viewMode === 'create' && (
          <EscalationForm
            ticketId={ticketId}
            onSubmit={handleCreateEscalation}
            onCancel={() => setViewMode('list')}
          />
        )}

        {viewMode === 'edit' && editingEscalation && (
          <EscalationForm
            ticketId={ticketId}
            initialData={editingEscalation}
            onSubmit={handleCreateEscalation}
            onCancel={() => {
              setEditingEscalation(null);
              setViewMode('list');
            }}
          />
        )}

        {viewMode === 'guidelines' && (
          <div>
            <div className="view-header">
              <button
                onClick={() => setViewMode('list')}
                className="back-btn"
              >
                ← Back to Escalations
              </button>
            </div>
            <EscalationGuidelines />
          </div>
        )}

        {viewMode === 'list' && (
          <div className="escalations-list">
            {/* Filters */}
            <div className="filters-section">
              <div className="filter-group">
                <Filter size={16} />
                <span className="filter-label">Status:</span>
                <div className="status-filters">
                  {(['all', 'draft', 'submitted', 'in_progress', 'resolved'] as StatusFilter[]).map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`status-filter ${statusFilter === status ? 'active' : ''}`}
                    >
                      {status === 'all' ? 'All' : status.replace('_', ' ')}
                      <span className="count">({getStatusCount(status)})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Escalations */}
            <div className="escalations-container">
              {isLoading && filteredEscalations.length === 0 && (
                <div className="loading-state">
                  <RefreshCw size={24} className="animate-spin" />
                  <span>Loading escalations...</span>
                </div>
              )}

              {!isLoading && filteredEscalations.length === 0 && (
                <div className="empty-state">
                  <ArrowUp size={48} className="empty-icon" />
                  <h3>No Escalations</h3>
                  <p>
                    {statusFilter === 'all' 
                      ? 'No escalations have been created for this ticket yet.'
                      : `No escalations with status "${statusFilter.replace('_', ' ')}" found.`
                    }
                  </p>
                  <button
                    onClick={() => setViewMode('create')}
                    className="create-escalation-btn"
                  >
                    <Plus size={16} />
                    Create First Escalation
                  </button>
                </div>
              )}

              {filteredEscalations.map(escalation => (
                <EscalationStatus
                  key={escalation.id}
                  escalation={escalation}
                  onStatusUpdate={handleStatusUpdate}
                  onAddComment={handleAddComment}
                  onEdit={handleEditEscalation}
                  showActions={true}
                  className="escalation-item"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <RefreshCw size={24} className="animate-spin" />
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationPanel;