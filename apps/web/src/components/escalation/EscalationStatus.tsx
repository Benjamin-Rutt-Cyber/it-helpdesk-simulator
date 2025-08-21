import React, { useState, useCallback } from 'react';
import { 
  ArrowUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  FileText, 
  MessageSquare,
  Eye,
  Edit
} from 'lucide-react';

export interface EscalationStatusProps {
  escalation: {
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
  };
  onStatusUpdate?: (escalationId: string, status: string) => void;
  onAddComment?: (escalationId: string, comment: string) => void;
  onViewDetails?: (escalationId: string) => void;
  onEdit?: (escalationId: string) => void;
  showActions?: boolean;
  className?: string;
}

const STATUS_CONFIGS = {
  draft: {
    icon: <FileText size={16} />,
    color: 'text-gray-600 bg-gray-100',
    label: 'Draft'
  },
  submitted: {
    icon: <ArrowUp size={16} />,
    color: 'text-blue-600 bg-blue-100',
    label: 'Submitted'
  },
  approved: {
    icon: <CheckCircle size={16} />,
    color: 'text-green-600 bg-green-100',
    label: 'Approved'
  },
  rejected: {
    icon: <XCircle size={16} />,
    color: 'text-red-600 bg-red-100',
    label: 'Rejected'
  },
  in_progress: {
    icon: <Clock size={16} className="animate-pulse" />,
    color: 'text-yellow-600 bg-yellow-100',
    label: 'In Progress'
  },
  resolved: {
    icon: <CheckCircle size={16} />,
    color: 'text-green-600 bg-green-100',
    label: 'Resolved'
  }
};

const PRIORITY_CONFIGS = {
  low: { color: 'text-green-600 bg-green-100', label: 'Low' },
  medium: { color: 'text-yellow-600 bg-yellow-100', label: 'Medium' },
  high: { color: 'text-orange-600 bg-orange-100', label: 'High' },
  critical: { color: 'text-red-600 bg-red-100', label: 'Critical' }
};

const CATEGORY_LABELS = {
  technical_complexity: 'Technical Complexity',
  permissions: 'Permissions Required',
  hardware_failure: 'Hardware Failure',
  policy_exception: 'Policy Exception',
  resource_intensive: 'Resource Intensive'
};

const ESCALATION_TARGET_LABELS = {
  l2_support: 'Level 2 Support',
  system_admin: 'System Administrator',
  security_team: 'Security Team',
  management: 'IT Management',
  vendor_support: 'Vendor Support'
};

export const EscalationStatus: React.FC<EscalationStatusProps> = ({
  escalation,
  onStatusUpdate,
  onAddComment,
  onViewDetails,
  onEdit,
  showActions = true,
  className = ''
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const statusConfig = STATUS_CONFIGS[escalation.status];
  const priorityConfig = PRIORITY_CONFIGS[escalation.priority];

  const formatTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !onAddComment) return;

    setIsAddingComment(true);
    try {
      await onAddComment(escalation.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  }, [escalation.id, newComment, onAddComment]);

  const handleStatusUpdate = useCallback((newStatus: string) => {
    if (onStatusUpdate) {
      onStatusUpdate(escalation.id, newStatus);
    }
  }, [escalation.id, onStatusUpdate]);

  const getNextValidStatuses = (): string[] => {
    switch (escalation.status) {
      case 'draft':
        return ['submitted'];
      case 'submitted':
        return ['approved', 'rejected'];
      case 'approved':
        return ['in_progress'];
      case 'in_progress':
        return ['resolved'];
      case 'rejected':
        return ['submitted'];
      default:
        return [];
    }
  };

  return (
    <div className={`escalation-status ${className}`}>
      {/* Header */}
      <div className="escalation-header">
        <div className="escalation-info">
          <div className="escalation-title">
            <h3>Escalation #{escalation.id}</h3>
            <span className="ticket-reference">Ticket #{escalation.ticketId}</span>
          </div>
          
          <div className="escalation-badges">
            <span className={`status-badge ${statusConfig.color}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
            <span className={`priority-badge ${priorityConfig.color}`}>
              {priorityConfig.label} Priority
            </span>
          </div>
        </div>

        {showActions && (
          <div className="escalation-actions">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(escalation.id)}
                className="action-btn view-details"
                title="View Details"
              >
                <Eye size={16} />
              </button>
            )}
            
            {onEdit && escalation.status === 'draft' && (
              <button
                onClick={() => onEdit(escalation.id)}
                className="action-btn edit"
                title="Edit Escalation"
              >
                <Edit size={16} />
              </button>
            )}
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="action-btn comments"
              title="Toggle Comments"
            >
              <MessageSquare size={16} />
              {escalation.comments && escalation.comments.length > 0 && (
                <span className="comment-count">{escalation.comments.length}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="escalation-details">
        <div className="detail-row">
          <span className="detail-label">Category:</span>
          <span className="detail-value">
            {CATEGORY_LABELS[escalation.category as keyof typeof CATEGORY_LABELS] || escalation.category}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Target:</span>
          <span className="detail-value">
            {ESCALATION_TARGET_LABELS[escalation.escalationTarget as keyof typeof ESCALATION_TARGET_LABELS] || escalation.escalationTarget}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Created:</span>
          <span className="detail-value">{formatTimeAgo(escalation.createdAt)}</span>
        </div>
        
        {escalation.assignedTo && (
          <div className="detail-row">
            <span className="detail-label">Assigned to:</span>
            <span className="detail-value assigned-user">
              <User size={14} />
              {escalation.assignedTo}
            </span>
          </div>
        )}
        
        {escalation.resolvedAt && (
          <div className="detail-row">
            <span className="detail-label">Resolved:</span>
            <span className="detail-value">{formatTimeAgo(escalation.resolvedAt)}</span>
          </div>
        )}
      </div>

      {/* Justification Preview */}
      <div className="justification-preview">
        <span className="justification-label">Justification:</span>
        <p className="justification-text">
          {escalation.justification.length > 150 
            ? `${escalation.justification.substring(0, 150)}...`
            : escalation.justification
          }
        </p>
      </div>

      {/* Status Actions */}
      {showActions && getNextValidStatuses().length > 0 && (
        <div className="status-actions">
          <span className="status-actions-label">Update Status:</span>
          <div className="status-buttons">
            {getNextValidStatuses().map(status => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                className={`status-action-btn ${status}`}
              >
                {STATUS_CONFIGS[status as keyof typeof STATUS_CONFIGS].icon}
                {STATUS_CONFIGS[status as keyof typeof STATUS_CONFIGS].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          <div className="comments-header">
            <h4>Comments</h4>
            <span className="comment-count">
              {escalation.comments?.length || 0} comment{(escalation.comments?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Comments List */}
          <div className="comments-list">
            {escalation.comments && escalation.comments.length > 0 ? (
              escalation.comments.map(comment => (
                <div key={comment.id} className={`comment comment-${comment.type}`}>
                  <div className="comment-header">
                    <span className="comment-author">
                      <User size={14} />
                      {comment.author}
                    </span>
                    <span className="comment-time">{formatTimeAgo(comment.timestamp)}</span>
                  </div>
                  <div className="comment-content">
                    {comment.message}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-comments">
                <MessageSquare size={24} className="no-comments-icon" />
                <span>No comments yet</span>
              </div>
            )}
          </div>

          {/* Add Comment */}
          {onAddComment && (
            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
                rows={3}
              />
              <div className="comment-actions">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className="add-comment-btn"
                >
                  {isAddingComment ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={16} />
                      Add Comment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Timeline */}
      <div className="escalation-timeline">
        <div className="timeline-item completed">
          <div className="timeline-icon">
            <FileText size={12} />
          </div>
          <div className="timeline-content">
            <span className="timeline-title">Created</span>
            <span className="timeline-time">{formatTimeAgo(escalation.createdAt)}</span>
          </div>
        </div>

        {escalation.status !== 'draft' && (
          <div className="timeline-item completed">
            <div className="timeline-icon">
              <ArrowUp size={12} />
            </div>
            <div className="timeline-content">
              <span className="timeline-title">Submitted</span>
              <span className="timeline-time">{escalation.updatedAt ? formatTimeAgo(escalation.updatedAt) : 'Recently'}</span>
            </div>
          </div>
        )}

        {['approved', 'in_progress', 'resolved'].includes(escalation.status) && (
          <div className="timeline-item completed">
            <div className="timeline-icon">
              <CheckCircle size={12} />
            </div>
            <div className="timeline-content">
              <span className="timeline-title">Approved</span>
              <span className="timeline-time">Recently</span>
            </div>
          </div>
        )}

        {['in_progress', 'resolved'].includes(escalation.status) && (
          <div className="timeline-item completed">
            <div className="timeline-icon">
              <Clock size={12} />
            </div>
            <div className="timeline-content">
              <span className="timeline-title">In Progress</span>
              <span className="timeline-time">Recently</span>
            </div>
          </div>
        )}

        {escalation.status === 'resolved' && (
          <div className="timeline-item completed">
            <div className="timeline-icon">
              <CheckCircle size={12} />
            </div>
            <div className="timeline-content">
              <span className="timeline-title">Resolved</span>
              <span className="timeline-time">{escalation.resolvedAt ? formatTimeAgo(escalation.resolvedAt) : 'Recently'}</span>
            </div>
          </div>
        )}

        {escalation.status === 'rejected' && (
          <div className="timeline-item rejected">
            <div className="timeline-icon">
              <XCircle size={12} />
            </div>
            <div className="timeline-content">
              <span className="timeline-title">Rejected</span>
              <span className="timeline-time">Recently</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscalationStatus;