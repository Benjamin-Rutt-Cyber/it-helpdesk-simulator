import { cn } from '@/lib/utils';

export type SourceType = 
  | 'official-documentation'
  | 'vendor-documentation' 
  | 'knowledge-base'
  | 'community-forum'
  | 'technical-blog'
  | 'social-media'
  | 'personal-blog'
  | 'suspicious-website'
  | 'outdated-resource';

interface SourceTypeBadgeProps {
  type: SourceType;
  domain?: string;
  name?: string;
  className?: string;
  showDescription?: boolean;
  compact?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export function SourceTypeBadge({
  type,
  domain,
  name,
  className,
  showDescription = false,
  compact = false,
  interactive = false,
  onClick
}: SourceTypeBadgeProps) {

  const getSourceTypeConfig = (type: SourceType) => {
    const configs = {
      'official-documentation': {
        label: 'Official Docs',
        description: 'Official documentation from verified sources',
        icon: '📋',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        darkColor: 'bg-blue-500 text-white',
        ariaLabel: 'Official documentation source'
      },
      'vendor-documentation': {
        label: 'Vendor Docs',
        description: 'Documentation from software/hardware vendors',
        icon: '🏢',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        darkColor: 'bg-purple-500 text-white',
        ariaLabel: 'Vendor documentation source'
      },
      'knowledge-base': {
        label: 'Knowledge Base',
        description: 'Curated knowledge base articles',
        icon: '📚',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        darkColor: 'bg-indigo-500 text-white',
        ariaLabel: 'Knowledge base source'
      },
      'community-forum': {
        label: 'Community Forum',
        description: 'Community-moderated discussion forums',
        icon: '💬',
        color: 'bg-green-100 text-green-800 border-green-200',
        darkColor: 'bg-green-500 text-white',
        ariaLabel: 'Community forum source'
      },
      'technical-blog': {
        label: 'Tech Blog',
        description: 'Technical blogs and articles',
        icon: '📝',
        color: 'bg-teal-100 text-teal-800 border-teal-200',
        darkColor: 'bg-teal-500 text-white',
        ariaLabel: 'Technical blog source'
      },
      'social-media': {
        label: 'Social Media',
        description: 'Social media posts and discussions',
        icon: '📱',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        darkColor: 'bg-orange-500 text-white',
        ariaLabel: 'Social media source'
      },
      'personal-blog': {
        label: 'Personal Blog',
        description: 'Individual personal blogs',
        icon: '👤',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        darkColor: 'bg-yellow-500 text-white',
        ariaLabel: 'Personal blog source'
      },
      'suspicious-website': {
        label: 'Suspicious Site',
        description: 'Potentially unreliable or malicious website',
        icon: '🚨',
        color: 'bg-red-100 text-red-800 border-red-200',
        darkColor: 'bg-red-500 text-white',
        ariaLabel: 'Suspicious website source - use caution'
      },
      'outdated-resource': {
        label: 'Outdated',
        description: 'Potentially outdated information',
        icon: '⏰',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        darkColor: 'bg-gray-500 text-white',
        ariaLabel: 'Outdated resource source'
      }
    };

    return configs[type];
  };

  const config = getSourceTypeConfig(type);

  const renderCompactBadge = () => (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border',
        config.color,
        interactive && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={config.ariaLabel}
      title={showDescription ? config.description : undefined}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      <span role="img" aria-hidden="true" className="text-xs">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );

  const renderFullBadge = () => (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        config.color,
        interactive && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={config.ariaLabel}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <span role="img" aria-hidden="true" className="text-2xl">
          {config.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm">
            {config.label}
          </h3>
          {domain && (
            <span className="text-xs opacity-75 font-mono">
              {domain}
            </span>
          )}
        </div>
        
        {showDescription && (
          <p className="text-xs opacity-80 mb-1">
            {config.description}
          </p>
        )}
        
        {name && (
          <p className="text-xs font-medium">
            {name}
          </p>
        )}
      </div>

      {/* Verification Status */}
      <div className="flex-shrink-0">
        {getVerificationStatus(type)}
      </div>
    </div>
  );

  return compact ? renderCompactBadge() : renderFullBadge();
}

function getVerificationStatus(type: SourceType) {
  const verificationConfigs = {
    'official-documentation': {
      icon: '✓',
      color: 'text-green-600',
      label: 'Verified'
    },
    'vendor-documentation': {
      icon: '✓',
      color: 'text-blue-600',
      label: 'Vendor Verified'
    },
    'knowledge-base': {
      icon: '✓',
      color: 'text-indigo-600',
      label: 'Curated'
    },
    'community-forum': {
      icon: '◐',
      color: 'text-yellow-600',
      label: 'Community Moderated'
    },
    'technical-blog': {
      icon: '◐',
      color: 'text-teal-600',
      label: 'Expert Author'
    },
    'social-media': {
      icon: '○',
      color: 'text-orange-600',
      label: 'Unmoderated'
    },
    'personal-blog': {
      icon: '○',
      color: 'text-yellow-600',
      label: 'Individual'
    },
    'suspicious-website': {
      icon: '⚠',
      color: 'text-red-600',
      label: 'Unverified'
    },
    'outdated-resource': {
      icon: '⏸',
      color: 'text-gray-600',
      label: 'Outdated'
    }
  };

  const config = verificationConfigs[type];

  return (
    <div className="text-center">
      <div className={cn('text-lg', config.color)} aria-hidden="true">
        {config.icon}
      </div>
      <div className={cn('text-xs font-medium', config.color)}>
        {config.label}
      </div>
    </div>
  );
}