import { useState } from 'react';
import { cn } from '@/lib/utils';
import { EducationalTooltip } from './EducationalTooltip';

export type CredibilityLevel = 'official' | 'community' | 'questionable' | 'unknown';

interface CredibilityIndicatorProps {
  level: CredibilityLevel;
  score: number;
  indicators?: string[];
  warnings?: string[];
  className?: string;
  showTooltip?: boolean;
  showScore?: boolean;
  compact?: boolean;
  interactive?: boolean;
  onEducationClick?: () => void;
}

export function CredibilityIndicator({
  level,
  score,
  indicators = [],
  warnings = [],
  className,
  showTooltip = true,
  showScore = false,
  compact = false,
  interactive = false,
  onEducationClick
}: CredibilityIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getCredibilityConfig = (level: CredibilityLevel) => {
    const configs = {
      official: {
        color: 'bg-green-500',
        borderColor: 'border-green-500',
        textColor: 'text-green-800',
        bgColor: 'bg-green-50',
        label: 'Official',
        description: 'Verified official documentation',
        icon: '🏛️',
        ariaLabel: 'High credibility - Official source'
      },
      community: {
        color: 'bg-yellow-500',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-800',
        bgColor: 'bg-yellow-50',
        label: 'Community',
        description: 'Community-verified content',
        icon: '👥',
        ariaLabel: 'Medium credibility - Community source'
      },
      questionable: {
        color: 'bg-red-500',
        borderColor: 'border-red-500',
        textColor: 'text-red-800',
        bgColor: 'bg-red-50',
        label: 'Questionable',
        description: 'Use with caution',
        icon: '⚠️',
        ariaLabel: 'Low credibility - Questionable source'
      },
      unknown: {
        color: 'bg-gray-500',
        borderColor: 'border-gray-500',
        textColor: 'text-gray-800',
        bgColor: 'bg-gray-50',
        label: 'Unknown',
        description: 'Unverified source',
        icon: '❓',
        ariaLabel: 'Unknown credibility - Unverified source'
      }
    };

    return configs[level];
  };

  const config = getCredibilityConfig(level);

  const renderCompactIndicator = () => (
    <div 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border',
        config.textColor,
        config.bgColor,
        config.borderColor,
        interactive && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={interactive ? () => setShowDetails(!showDetails) : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={config.ariaLabel}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setShowDetails(!showDetails);
        }
      } : undefined}
    >
      <span role="img" aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
      {showScore && (
        <span className="ml-1 font-bold">{score}</span>
      )}
    </div>
  );

  const renderFullIndicator = () => (
    <div className={cn('space-y-2', className)}>
      {/* Main Indicator */}
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}>
        <div className="flex items-center gap-2">
          <span role="img" aria-label={config.ariaLabel} className="text-lg">
            {config.icon}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('font-semibold', config.textColor)}>
                {config.label} Credibility
              </span>
              {showScore && (
                <span className={cn('text-sm font-mono', config.textColor)}>
                  ({score}/100)
                </span>
              )}
            </div>
            <p className={cn('text-sm', config.textColor.replace('800', '600'))}>
              {config.description}
            </p>
          </div>
        </div>

        {/* Credibility Bar */}
        <div className="flex-shrink-0 w-20">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all duration-300', config.color)}
              style={{ width: `${Math.max(score, 5)}%` }}
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Credibility score: ${score} out of 100`}
            />
          </div>
        </div>

        {/* Education Button */}
        {onEducationClick && (
          <button
            onClick={onEducationClick}
            className={cn(
              'p-1 rounded hover:bg-gray-100 transition-colors',
              config.textColor
            )}
            aria-label="Learn about credibility assessment"
            title="Learn more about this credibility level"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Quality Indicators */}
      {indicators.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700">Quality Indicators:</h4>
          <ul className="space-y-1">
            {indicators.map((indicator, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-green-700">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-red-700">Warnings:</h4>
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-red-700">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Educational Context */}
      {showTooltip && (
        <EducationalTooltip
          level={level}
          score={score}
          onLearnMore={onEducationClick}
        />
      )}
    </div>
  );

  return compact ? renderCompactIndicator() : renderFullIndicator();
}