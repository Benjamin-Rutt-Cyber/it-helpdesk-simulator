import { useState } from 'react';
import { cn } from '@/lib/utils';

interface QualityMetricsProps {
  publishDate?: Date;
  lastModified?: Date;
  author?: string;
  wordCount?: number;
  readingTime?: number;
  peerRating?: number;
  successRate?: number;
  viewCount?: number;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export function QualityMetrics({
  publishDate,
  lastModified,
  author,
  wordCount,
  readingTime,
  peerRating,
  successRate,
  viewCount,
  verificationStatus = 'unverified',
  className,
  compact = false,
  showDetails = false
}: QualityMetricsProps) {
  const [expanded, setExpanded] = useState(showDetails);

  const calculateFreshnessScore = (): { score: number; label: string; color: string } => {
    if (!publishDate && !lastModified) {
      return { score: 0, label: 'Unknown', color: 'text-gray-500' };
    }

    const relevantDate = lastModified || publishDate!;
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - relevantDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince <= 30) {
      return { score: 100, label: 'Very Fresh', color: 'text-green-600' };
    } else if (daysSince <= 90) {
      return { score: 80, label: 'Fresh', color: 'text-green-500' };
    } else if (daysSince <= 365) {
      return { score: 60, label: 'Recent', color: 'text-yellow-600' };
    } else if (daysSince <= 730) {
      return { score: 40, label: 'Aging', color: 'text-orange-600' };
    } else {
      return { score: 20, label: 'Outdated', color: 'text-red-600' };
    }
  };

  const freshnessInfo = calculateFreshnessScore();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const getVerificationConfig = (status: string) => {
    const configs = {
      verified: {
        icon: '✅',
        label: 'Verified',
        color: 'text-green-600 bg-green-50 border-green-200'
      },
      pending: {
        icon: '⏳',
        label: 'Pending Review',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      },
      unverified: {
        icon: '❓',
        label: 'Unverified',
        color: 'text-gray-600 bg-gray-50 border-gray-200'
      }
    };

    return configs[status] || configs.unverified;
  };

  const verificationConfig = getVerificationConfig(verificationStatus);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 text-xs text-gray-600', className)}>
        {/* Freshness */}
        <div className="flex items-center gap-1">
          <span className={freshnessInfo.color}>●</span>
          <span>{freshnessInfo.label}</span>
        </div>

        {/* Peer Rating */}
        {peerRating !== undefined && (
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>{peerRating.toFixed(1)}</span>
          </div>
        )}

        {/* Verification */}
        <div className="flex items-center gap-1">
          <span>{verificationConfig.icon}</span>
          <span>{verificationConfig.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Quality Metrics</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide details' : 'Show details'}
        >
          {expanded ? 'Less' : 'More'} Details
        </button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Content Freshness */}
        <div className="text-center p-3 rounded-lg border bg-gray-50">
          <div className={cn('text-2xl font-bold', freshnessInfo.color)}>
            {freshnessInfo.score}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Freshness Score
          </div>
          <div className={cn('text-xs font-medium mt-1', freshnessInfo.color)}>
            {freshnessInfo.label}
          </div>
        </div>

        {/* Peer Rating */}
        {peerRating !== undefined && (
          <div className="text-center p-3 rounded-lg border bg-gray-50">
            <div className="text-2xl font-bold text-yellow-600">
              {peerRating.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Peer Rating
            </div>
            <div className="text-xs text-yellow-600 mt-1">
              {'⭐'.repeat(Math.round(peerRating))}
            </div>
          </div>
        )}

        {/* Success Rate */}
        {successRate !== undefined && (
          <div className="text-center p-3 rounded-lg border bg-gray-50">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(successRate)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Success Rate
            </div>
            <div className="text-xs text-green-600 mt-1">
              Solution Effectiveness
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className={cn(
          'text-center p-3 rounded-lg border',
          verificationConfig.color
        )}>
          <div className="text-2xl">
            {verificationConfig.icon}
          </div>
          <div className="text-xs mt-1">
            Verification
          </div>
          <div className="text-xs font-medium mt-1">
            {verificationConfig.label}
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      {expanded && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Detailed Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Publication Information */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Publication Info</h5>
              {publishDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Published:</span>
                  <span title={formatDate(publishDate)}>
                    {formatTimeAgo(publishDate)}
                  </span>
                </div>
              )}
              {lastModified && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span title={formatDate(lastModified)}>
                    {formatTimeAgo(lastModified)}
                  </span>
                </div>
              )}
              {author && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Author:</span>
                  <span className="font-medium">{author}</span>
                </div>
              )}
            </div>

            {/* Content Metrics */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Content Metrics</h5>
              {wordCount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Word Count:</span>
                  <span>{wordCount.toLocaleString()}</span>
                </div>
              )}
              {readingTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reading Time:</span>
                  <span>{readingTime} min</span>
                </div>
              )}
              {viewCount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Views:</span>
                  <span>{viewCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quality Indicators */}
          <div className="mt-4">
            <h5 className="font-medium text-gray-700 mb-2">Quality Indicators</h5>
            <div className="flex flex-wrap gap-2">
              {freshnessInfo.score >= 80 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Recently Updated
                </span>
              )}
              {peerRating && peerRating >= 4 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  Highly Rated
                </span>
              )}
              {successRate && successRate >= 80 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  Proven Effective
                </span>
              )}
              {verificationStatus === 'verified' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Expert Verified
                </span>
              )}
              {wordCount && wordCount >= 500 && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  Comprehensive
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}