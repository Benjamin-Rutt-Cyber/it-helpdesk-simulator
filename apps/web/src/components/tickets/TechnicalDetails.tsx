import { TechnicalContext, AssetInfo } from '@/types/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TechnicalDetailsProps {
  technicalContext?: TechnicalContext;
  assets?: AssetInfo[];
  className?: string;
}

export function TechnicalDetails({ technicalContext, assets, className }: TechnicalDetailsProps) {
  const [activeTab, setActiveTab] = useState<'system' | 'errors' | 'symptoms' | 'assets'>('system');

  if (!technicalContext && (!assets || assets.length === 0)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            No technical information available
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: 'system', label: 'System Info', count: technicalContext ? 1 : 0 },
    { id: 'errors', label: 'Error Messages', count: technicalContext?.errorMessages?.length || 0 },
    { id: 'symptoms', label: 'Symptoms', count: technicalContext?.symptoms?.length || 0 },
    { id: 'assets', label: 'Assets', count: assets?.length || 0 },
  ].filter(tab => tab.count > 0);

  const severityColors = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    critical: 'bg-red-100 text-red-800 border-red-300'
  };

  const impactColors = {
    low: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    high: 'bg-red-50 text-red-700 border-red-200',
    critical: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Technical Details</CardTitle>
        {tabs.length > 1 && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* System Specifications */}
        {activeTab === 'system' && technicalContext?.systemSpecifications && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">System Specifications</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Operating System</label>
                <p className="text-sm text-gray-900">{technicalContext.systemSpecifications.operatingSystem}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Version</label>
                <p className="text-sm text-gray-900">{technicalContext.systemSpecifications.version}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Architecture</label>
                <p className="text-sm text-gray-900">{technicalContext.systemSpecifications.architecture}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Processor</label>
                <p className="text-sm text-gray-900">{technicalContext.systemSpecifications.processor}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Memory</label>
                <p className="text-sm text-gray-900">{technicalContext.systemSpecifications.memory}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Disk Space</label>
                <p className="text-sm text-gray-900">{technicalContext.systemSpecifications.diskSpace}</p>
              </div>
            </div>

            {technicalContext.environmentDetails && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Environment Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  {technicalContext.environmentDetails.domain && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Domain</label>
                      <p className="text-sm text-gray-900">{technicalContext.environmentDetails.domain}</p>
                    </div>
                  )}
                  {technicalContext.environmentDetails.networkSegment && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Network Segment</label>
                      <p className="text-sm text-gray-900">{technicalContext.environmentDetails.networkSegment}</p>
                    </div>
                  )}
                  {technicalContext.environmentDetails.firewallStatus && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Firewall Status</label>
                      <p className="text-sm text-gray-900">{technicalContext.environmentDetails.firewallStatus}</p>
                    </div>
                  )}
                  {technicalContext.environmentDetails.antivirusStatus && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Antivirus Status</label>
                      <p className="text-sm text-gray-900">{technicalContext.environmentDetails.antivirusStatus}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Messages */}
        {activeTab === 'errors' && technicalContext?.errorMessages && (
          <div className="space-y-3">
            {technicalContext.errorMessages.map((error, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        severityColors[error.severity]
                      )}>
                        {error.severity.toUpperCase()}
                      </span>
                      {error.errorCode && (
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {error.errorCode}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{error.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Source: {error.source}</span>
                      <span>Time: {error.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {error.stackTrace && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      View Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                      {error.stackTrace}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Symptoms */}
        {activeTab === 'symptoms' && technicalContext?.symptoms && (
          <div className="space-y-3">
            {technicalContext.symptoms.map((symptom, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        impactColors[symptom.impact]
                      )}>
                        {symptom.impact.toUpperCase()} IMPACT
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {symptom.frequency.toUpperCase()}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded',
                        symptom.reproducible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {symptom.reproducible ? 'Reproducible' : 'Not Reproducible'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{symptom.description}</p>
                    {symptom.workarounds && (
                      <div className="mt-2">
                        <label className="text-xs font-medium text-gray-500">Workarounds:</label>
                        <p className="text-sm text-gray-700">{symptom.workarounds}</p>
                      </div>
                    )}
                    {symptom.reproducibilitySteps && symptom.reproducibilitySteps.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          Reproduction Steps
                        </summary>
                        <ol className="mt-2 text-sm text-gray-700 list-decimal list-inside space-y-1">
                          {symptom.reproducibilitySteps.map((step, stepIndex) => (
                            <li key={stepIndex}>{step}</li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assets */}
        {activeTab === 'assets' && assets && assets.length > 0 && (
          <div className="space-y-4">
            {assets.map((asset, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{asset.manufacturer} {asset.model}</h4>
                    <p className="text-sm text-gray-500">Asset Tag: {asset.assetTag}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {asset.assetType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {asset.operatingSystem && (
                    <div>
                      <label className="font-medium text-gray-500">OS:</label>
                      <span className="ml-2">{asset.operatingSystem} {asset.osVersion}</span>
                    </div>
                  )}
                  {asset.serialNumber && (
                    <div>
                      <label className="font-medium text-gray-500">Serial:</label>
                      <span className="ml-2 font-mono">{asset.serialNumber}</span>
                    </div>
                  )}
                  {asset.location && (
                    <div>
                      <label className="font-medium text-gray-500">Location:</label>
                      <span className="ml-2">{asset.location}</span>
                    </div>
                  )}
                  {asset.assignedUser && (
                    <div>
                      <label className="font-medium text-gray-500">Assigned To:</label>
                      <span className="ml-2">{asset.assignedUser}</span>
                    </div>
                  )}
                </div>

                {asset.specifications && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      View Specifications
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(asset.specifications).map(([key, value]) => (
                        <div key={key}>
                          <label className="font-medium text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </label>
                          <span className="ml-2">{value}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {asset.installedSoftware && asset.installedSoftware.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      Installed Software ({asset.installedSoftware.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {asset.installedSoftware.map((software, swIndex) => (
                        <div key={swIndex} className="flex justify-between text-sm">
                          <span>{software.name}</span>
                          <span className="text-gray-500">{software.version}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}