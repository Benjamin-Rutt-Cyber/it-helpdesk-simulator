import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Shield, 
  Lock, 
  Unlock,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';

export interface VerificationStatusData {
  totalFields: number;
  verifiedFields: number;
  failedFields: number;
  inProgressFields: number;
  pendingFields: number;
  completionPercentage: number;
  isComplete: boolean;
  isBlocked: boolean;
  timeElapsed: number; // in seconds
  averageTimePerField?: number;
  verificationScore?: number; // 0-100 quality score
}

export interface VerificationStatusProps {
  status: VerificationStatusData;
  ticketId: string;
  showDetailed?: boolean;
  size?: 'compact' | 'normal' | 'expanded';
  onStatusClick?: () => void;
  className?: string;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  status,
  ticketId,
  showDetailed = true,
  size = 'normal',
  onStatusClick,
  className = ''
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getOverallStatus = (): 'verified' | 'failed' | 'in_progress' | 'blocked' | 'pending' => {
    if (status.isComplete) return 'verified';
    if (status.isBlocked && status.inProgressFields === 0) return 'blocked';
    if (status.failedFields > 0 && status.inProgressFields === 0) return 'failed';
    if (status.inProgressFields > 0) return 'in_progress';
    return 'pending';
  };

  const getStatusIcon = (statusType: string, size: number = 20) => {
    switch (statusType) {
      case 'verified':
        return <CheckCircle size={size} className="text-green-500" />;
      case 'failed':
        return <XCircle size={size} className="text-red-500" />;
      case 'in_progress':
        return <Clock size={size} className="text-blue-500 animate-pulse" />;
      case 'blocked':
        return <Lock size={size} className="text-amber-500" />;
      case 'pending':
      default:
        return <AlertCircle size={size} className="text-gray-400" />;
    }
  };

  const getStatusColor = (statusType: string): string => {
    switch (statusType) {
      case 'verified': return 'bg-green-100 border-green-300 text-green-800';
      case 'failed': return 'bg-red-100 border-red-300 text-red-800';
      case 'in_progress': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'blocked': return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'pending': return 'bg-gray-100 border-gray-300 text-gray-600';
      default: return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getStatusMessage = (): string => {
    const overallStatus = getOverallStatus();
    switch (overallStatus) {
      case 'verified':
        return 'Customer identity fully verified';
      case 'failed':
        return `${status.failedFields} verification${status.failedFields > 1 ? 's' : ''} failed`;
      case 'in_progress':
        return `${status.inProgressFields} verification${status.inProgressFields > 1 ? 's' : ''} in progress`;
      case 'blocked':
        return 'Resolution blocked - verification required';
      case 'pending':
      default:
        return `${status.pendingFields} verification${status.pendingFields > 1 ? 's' : ''} pending`;
    }
  };

  const getProgressGradient = (): string => {
    if (status.isComplete) return 'from-green-400 to-green-600';
    if (status.failedFields > 0) return 'from-red-400 to-red-600';
    if (status.inProgressFields > 0) return 'from-blue-400 to-blue-600';
    return 'from-gray-400 to-gray-600';
  };

  const overallStatus = getOverallStatus();

  if (size === 'compact') {
    return (
      <div 
        className={`verification-status compact ${getStatusColor(overallStatus)} ${className}`}
        onClick={onStatusClick}
        style={{ cursor: onStatusClick ? 'pointer' : 'default' }}
      >
        <div className="status-compact-content">
          {getStatusIcon(overallStatus, 16)}
          <span className="status-percentage">{status.completionPercentage}%</span>
          <div className="status-mini-progress">
            <div 
              className={`mini-progress-fill bg-gradient-to-r ${getProgressGradient()}`}
              style={{ width: `${status.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`verification-status ${size} ${className}`}
      onClick={onStatusClick}
      style={{ cursor: onStatusClick ? 'pointer' : 'default' }}
    >
      {/* Status Header */}
      <div className="status-header">
        <div className="status-title">
          <Shield size={20} className="text-blue-600" />
          <h3>Verification Status</h3>
          {status.isBlocked && <Lock size={16} className="text-amber-500" />}
        </div>
        <div className="ticket-reference">
          Ticket #{ticketId}
        </div>
      </div>

      {/* Main Status Display */}
      <div className={`status-main ${getStatusColor(overallStatus)}`}>
        <div className="status-icon-large">
          {getStatusIcon(overallStatus, 32)}
        </div>
        <div className="status-info">
          <div className="status-message">
            {getStatusMessage()}
          </div>
          <div className="status-progress-text">
            {status.verifiedFields}/{status.totalFields} fields verified
          </div>
        </div>
        <div className="status-percentage-large">
          {status.completionPercentage}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="status-progress-bar">
        <div className="progress-track">
          <div 
            className={`progress-fill bg-gradient-to-r ${getProgressGradient()}`}
            style={{ width: `${status.completionPercentage}%` }}
          />
        </div>
        <div className="progress-segments">
          {Array.from({ length: status.totalFields }, (_, index) => {
            let segmentStatus = 'pending';
            if (index < status.verifiedFields) segmentStatus = 'verified';
            else if (index < status.verifiedFields + status.inProgressFields) segmentStatus = 'in_progress';
            else if (index < status.verifiedFields + status.inProgressFields + status.failedFields) segmentStatus = 'failed';
            
            return (
              <div
                key={index}
                className={`progress-segment ${segmentStatus}`}
                title={`Field ${index + 1}: ${segmentStatus}`}
              />
            );
          })}
        </div>
      </div>

      {/* Detailed Status (if enabled) */}
      {showDetailed && (
        <div className="status-details">
          <div className="detail-grid">
            <div className="detail-item verified">
              <CheckCircle size={16} />
              <span className="detail-label">Verified</span>
              <span className="detail-value">{status.verifiedFields}</span>
            </div>
            <div className="detail-item in-progress">
              <Clock size={16} />
              <span className="detail-label">In Progress</span>
              <span className="detail-value">{status.inProgressFields}</span>
            </div>
            <div className="detail-item failed">
              <XCircle size={16} />
              <span className="detail-label">Failed</span>
              <span className="detail-value">{status.failedFields}</span>
            </div>
            <div className="detail-item pending">
              <AlertCircle size={16} />
              <span className="detail-label">Pending</span>
              <span className="detail-value">{status.pendingFields}</span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="performance-metrics">
            <div className="metric-item">
              <Clock size={14} />
              <span className="metric-label">Time Elapsed</span>
              <span className="metric-value">{formatTime(status.timeElapsed)}</span>
            </div>
            
            {status.averageTimePerField && (
              <div className="metric-item">
                <TrendingUp size={14} />
                <span className="metric-label">Avg Time/Field</span>
                <span className="metric-value">{formatTime(Math.round(status.averageTimePerField))}</span>
              </div>
            )}
            
            {status.verificationScore && (
              <div className="metric-item">
                <Award size={14} />
                <span className="metric-label">Quality Score</span>
                <span className="metric-value">{status.verificationScore}/100</span>
              </div>
            )}
          </div>

          {/* Security Status Indicator */}
          <div className="security-status">
            <div className="security-indicator">
              {status.isComplete ? (
                <>
                  <Unlock size={16} className="text-green-500" />
                  <span className="security-text verified">
                    Security requirements satisfied - Resolution enabled
                  </span>
                </>
              ) : (
                <>
                  <Lock size={16} className="text-amber-500" />
                  <span className="security-text blocked">
                    Security verification required - Resolution blocked
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Actions */}
      {size === 'expanded' && (
        <div className="status-actions">
          <div className="action-buttons">
            <button 
              className="action-button primary"
              disabled={status.isComplete}
            >
              <Target size={16} />
              Continue Verification
            </button>
            
            {status.failedFields > 0 && (
              <button className="action-button secondary">
                <XCircle size={16} />
                Review Failed ({status.failedFields})
              </button>
            )}
            
            <button className="action-button tertiary">
              <Shield size={16} />
              View Details
            </button>
          </div>

          {/* Quick Tips */}
          <div className="status-tips">
            {!status.isComplete && status.inProgressFields === 0 && (
              <div className="tip">
                <AlertCircle size={14} />
                <span>Click on verification fields to start the verification process</span>
              </div>
            )}
            
            {status.failedFields > 0 && (
              <div className="tip warning">
                <XCircle size={14} />
                <span>Some verifications failed. Review and retry, or use alternative methods</span>
              </div>
            )}
            
            {status.isComplete && (
              <div className="tip success">
                <CheckCircle size={14} />
                <span>All verifications complete. You may now proceed with ticket resolution</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-time Updates Indicator */}
      {status.inProgressFields > 0 && (
        <div className="realtime-indicator">
          <div className="pulse-dot" />
          <span>Live verification in progress...</span>
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;