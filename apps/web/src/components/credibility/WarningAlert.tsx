import { useState } from 'react';
import { cn } from '@/lib/utils';

export type WarningType = 
  | 'outdated'
  | 'unverified'
  | 'conflicting'
  | 'suspicious'
  | 'incomplete'
  | 'dangerous'
  | 'bias'
  | 'malicious';

export type WarningSeverity = 'low' | 'medium' | 'high' | 'critical';

interface WarningAlertProps {
  type: WarningType;
  severity: WarningSeverity;
  title?: string;
  message: string;
  details?: string[];
  recommendations?: string[];
  dismissible?: boolean;
  requireAcknowledgment?: boolean;
  onDismiss?: () => void;
  onAcknowledge?: () => void;
  className?: string;
  compact?: boolean;
}

export function WarningAlert({
  type,
  severity,
  title,
  message,
  details = [],
  recommendations = [],
  dismissible = false,
  requireAcknowledgment = false,
  onDismiss,
  onAcknowledge,
  className,
  compact = false
}: WarningAlertProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (dismissed) return null;

  const getWarningConfig = (type: WarningType, severity: WarningSeverity) => {
    const severityConfigs = {
      low: {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600'
      },
      medium: {
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600'
      },
      high: {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      },
      critical: {
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        textColor: 'text-red-900',
        iconColor: 'text-red-700'
      }
    };

    const typeConfigs = {
      outdated: {
        icon: '⏰',
        defaultTitle: 'Outdated Information',
        ariaLabel: 'Warning: This content may be outdated'
      },
      unverified: {
        icon: '❓',
        defaultTitle: 'Unverified Source',
        ariaLabel: 'Warning: This source is unverified'
      },
      conflicting: {
        icon: '⚖️',
        defaultTitle: 'Conflicting Information',
        ariaLabel: 'Warning: This information conflicts with other sources'
      },
      suspicious: {
        icon: '🚨',
        defaultTitle: 'Suspicious Content',
        ariaLabel: 'Warning: This content appears suspicious'
      },
      incomplete: {
        icon: '📝',
        defaultTitle: 'Incomplete Information',
        ariaLabel: 'Warning: This information may be incomplete'
      },
      dangerous: {
        icon: '⚠️',
        defaultTitle: 'Potentially Dangerous',
        ariaLabel: 'Critical warning: This content may be harmful'
      },
      bias: {
        icon: '🎭',
        defaultTitle: 'Potential Bias',
        ariaLabel: 'Warning: This content may contain bias'
      },
      malicious: {
        icon: '🛡️',
        defaultTitle: 'Malicious Content',
        ariaLabel: 'Critical warning: This content may be malicious'
      }
    };

    return {
      ...severityConfigs[severity],
      ...typeConfigs[type]
    };
  };

  const config = getWarningConfig(type, severity);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded border text-sm',
        config.bgColor,
        config.borderColor,
        config.textColor,
        className
      )}>
        <span 
          role="img" 
          aria-label={config.ariaLabel}
          className={config.iconColor}
        >
          {config.icon}
        </span>
        <span className="flex-1 font-medium">
          {title || config.defaultTitle}
        </span>
        <span className="text-xs opacity-75 uppercase font-semibold">
          {severity}
        </span>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn('hover:opacity-75 transition-opacity', config.iconColor)}
            aria-label="Dismiss warning"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'rounded-lg border shadow-sm',
        config.bgColor,
        config.borderColor,
        severity === 'critical' && 'shadow-lg',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn('flex-shrink-0 text-2xl', config.iconColor)}>
          <span role="img" aria-label={config.ariaLabel}>
            {config.icon}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={cn('font-semibold text-lg', config.textColor)}>
                {title || config.defaultTitle}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide',
                  severity === 'critical' ? 'bg-red-200 text-red-900' :
                  severity === 'high' ? 'bg-red-100 text-red-800' :
                  severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                )}>
                  {severity} Risk
                </span>
              </div>
            </div>

            {dismissible && (
              <button
                onClick={handleDismiss}
                className={cn(
                  'p-1 rounded hover:bg-gray-100 transition-colors',
                  config.textColor
                )}
                aria-label="Dismiss warning"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <p className={cn('mt-2 text-sm', config.textColor)}>
            {message}
          </p>

          {/* Details */}
          {details.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={cn(
                  'text-sm font-medium hover:underline transition-colors',
                  config.textColor
                )}
                aria-expanded={showDetails}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>

              {showDetails && (
                <ul className={cn('mt-2 space-y-1 text-sm', config.textColor)}>
                  {details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-3">
              <h4 className={cn('text-sm font-medium mb-1', config.textColor)}>
                Recommendations:
              </h4>
              <ul className={cn('space-y-1 text-sm', config.textColor)}>
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg className="w-3 h-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Acknowledgment Required */}
      {requireAcknowledgment && !acknowledged && (
        <div className={cn(
          'border-t px-4 py-3 flex items-center justify-between',
          config.borderColor
        )}>
          <span className={cn('text-sm font-medium', config.textColor)}>
            Please acknowledge that you understand this warning
          </span>
          <button
            onClick={handleAcknowledge}
            className={cn(
              'px-4 py-2 rounded font-medium text-sm transition-colors',
              severity === 'critical' 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
            )}
          >
            I Understand
          </button>
        </div>
      )}

      {/* Educational Context */}
      {acknowledged && (
        <div className={cn(
          'border-t px-4 py-3',
          config.borderColor
        )}>
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-700 font-medium">
              Warning acknowledged. Continue with caution.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}