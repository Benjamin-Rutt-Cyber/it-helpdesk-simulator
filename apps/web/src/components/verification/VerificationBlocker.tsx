import React, { useCallback, useState } from 'react';
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  HelpCircle,
  Eye,
  EyeOff,
  Unlock,
  AlertOctagon,
  Info,
} from 'lucide-react';

interface VerificationBlockerProps {
  isBlocked: boolean;
  verificationStatus: {
    customerName: boolean;
    username: boolean;
    assetTag: boolean;
    department: boolean;
    contactInfo: boolean;
  };
  blockedActions: string[];
  onStartVerification: () => void;
  onEmergencyOverride?: () => void;
  emergencyOverrideAvailable?: boolean;
  showDetails?: boolean;
  compactMode?: boolean;
  ticketId?: string;
}

interface BlockingRule {
  id: string;
  name: string;
  description: string;
  requiredFields: Array<keyof VerificationBlockerProps['verificationStatus']>;
  severity: 'critical' | 'high' | 'medium';
  bypassable: boolean;
}

interface BlockedAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  reason: string;
}

export const VerificationBlocker: React.FC<VerificationBlockerProps> = ({
  isBlocked,
  verificationStatus,
  blockedActions,
  onStartVerification,
  onEmergencyOverride,
  emergencyOverrideAvailable = false,
  showDetails = true,
  compactMode = false,
  ticketId,
}) => {
  const [showBlockingDetails, setShowBlockingDetails] = useState(false);
  const [confirmingOverride, setConfirmingOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const blockingRules: BlockingRule[] = [
    {
      id: 'customer-identity',
      name: 'Customer Identity Verification',
      description: 'Customer name and username must be verified before any support actions',
      requiredFields: ['customerName', 'username'],
      severity: 'critical',
      bypassable: false,
    },
    {
      id: 'asset-verification',
      name: 'Asset Verification',
      description: 'Asset tag must be verified for hardware-related support',
      requiredFields: ['assetTag'],
      severity: 'high',
      bypassable: true,
    },
    {
      id: 'contact-verification',
      name: 'Contact Information',
      description: 'Contact information should be verified for account changes',
      requiredFields: ['contactInfo'],
      severity: 'medium',
      bypassable: true,
    },
    {
      id: 'department-verification',
      name: 'Department Authorization',
      description: 'Department must be verified for policy-related requests',
      requiredFields: ['department'],
      severity: 'medium',
      bypassable: true,
    },
  ];

  const getBlockedActionsList = useCallback((): BlockedAction[] => {
    const actionMap: Record<string, BlockedAction> = {
      'resolve': {
        id: 'resolve',
        name: 'Resolve Ticket',
        description: 'Mark ticket as resolved',
        icon: <CheckCircle className="w-4 h-4" />,
        reason: 'Customer identity not verified',
      },
      'escalate': {
        id: 'escalate',
        name: 'Escalate Ticket',
        description: 'Escalate to higher support level',
        icon: <ArrowRight className="w-4 h-4" />,
        reason: 'Verification required before escalation',
      },
      'close': {
        id: 'close',
        name: 'Close Ticket',
        description: 'Close the support ticket',
        icon: <XCircle className="w-4 h-4" />,
        reason: 'Cannot close unverified ticket',
      },
      'modify': {
        id: 'modify',
        name: 'Modify Account',
        description: 'Make changes to customer account',
        icon: <Lock className="w-4 h-4" />,
        reason: 'Account changes require full verification',
      },
      'access': {
        id: 'access',
        name: 'Access Systems',
        description: 'Access customer systems or data',
        icon: <Eye className="w-4 h-4" />,
        reason: 'System access requires identity verification',
      },
    };

    return blockedActions.map(action => 
      actionMap[action] || {
        id: action,
        name: action.charAt(0).toUpperCase() + action.slice(1),
        description: `Perform ${action} action`,
        icon: <Lock className="w-4 h-4" />,
        reason: 'Verification required',
      }
    );
  }, [blockedActions]);

  const getActiveBlockingRules = useCallback(() => {
    return blockingRules.filter(rule => {
      return rule.requiredFields.some(field => !verificationStatus[field]);
    });
  }, [verificationStatus]);

  const getVerificationProgress = useCallback(() => {
    const total = Object.keys(verificationStatus).length;
    const verified = Object.values(verificationStatus).filter(Boolean).length;
    return { verified, total, percentage: Math.round((verified / total) * 100) };
  }, [verificationStatus]);

  const handleEmergencyOverride = useCallback(() => {
    if (!emergencyOverrideAvailable || !onEmergencyOverride) return;
    
    if (!confirmingOverride) {
      setConfirmingOverride(true);
      return;
    }
    
    if (!overrideReason.trim()) {
      alert('Please provide a reason for the emergency override');
      return;
    }
    
    onEmergencyOverride();
    setConfirmingOverride(false);
    setOverrideReason('');
  }, [emergencyOverrideAvailable, onEmergencyOverride, confirmingOverride, overrideReason]);

  if (!isBlocked) {
    return null;
  }

  const progress = getVerificationProgress();
  const activeRules = getActiveBlockingRules();
  const blockedActionsList = getBlockedActionsList();

  if (compactMode) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">
            Verification Required ({progress.verified}/{progress.total} complete)
          </span>
          <button
            onClick={onStartVerification}
            className="ml-auto text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
          >
            Complete Verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-red-300 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-100 rounded-full">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-800">
            Security Verification Required
          </h3>
          <p className="text-sm text-red-600">
            Customer identity verification must be completed before proceeding
          </p>
        </div>
      </div>

      {/* Verification Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Verification Progress
          </span>
          <span className="text-sm text-gray-600">
            {progress.verified}/{progress.total} completed ({progress.percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progress.percentage === 100
                ? 'bg-green-500'
                : progress.percentage >= 60
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Blocked Actions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertOctagon className="w-5 h-5 text-red-600" />
          <h4 className="font-medium text-gray-900">Blocked Actions</h4>
        </div>
        <div className="grid gap-2">
          {blockedActionsList.map(action => (
            <div
              key={action.id}
              className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
            >
              <div className="text-red-600">
                {action.icon}
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-red-800">{action.name}</h5>
                <p className="text-xs text-red-600">{action.reason}</p>
              </div>
              <Lock className="w-4 h-4 text-red-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Active Blocking Rules */}
      {showDetails && (
        <div className="mb-6">
          <button
            onClick={() => setShowBlockingDetails(!showBlockingDetails)}
            className="flex items-center gap-2 mb-3 text-gray-700 hover:text-gray-900"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium">Blocking Rules Details</span>
            {showBlockingDetails ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          
          {showBlockingDetails && (
            <div className="space-y-3">
              {activeRules.map(rule => (
                <div
                  key={rule.id}
                  className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 px-2 py-1 rounded text-xs font-medium ${
                      rule.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      rule.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rule.severity}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{rule.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">Required fields:</span>
                        {rule.requiredFields.map(field => (
                          <span
                            key={field}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              verificationStatus[field]
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {field}
                            {verificationStatus[field] ? (
                              <CheckCircle className="w-3 h-3 inline ml-1" />
                            ) : (
                              <XCircle className="w-3 h-3 inline ml-1" />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onStartVerification}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Shield className="w-5 h-5" />
          Complete Customer Verification
        </button>
        
        {emergencyOverrideAvailable && (
          <div className="flex-shrink-0">
            {!confirmingOverride ? (
              <button
                onClick={handleEmergencyOverride}
                className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Emergency Override
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Override reason required..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEmergencyOverride}
                    disabled={!overrideReason.trim()}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Unlock className="w-4 h-4" />
                    Override
                  </button>
                  <button
                    onClick={() => {
                      setConfirmingOverride(false);
                      setOverrideReason('');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Information Footer */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Security Policy Enforcement</p>
            <p>
              This blocking mechanism enforces our security policy requiring customer 
              verification before sensitive support actions. {ticketId && `Ticket: ${ticketId}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationBlocker;