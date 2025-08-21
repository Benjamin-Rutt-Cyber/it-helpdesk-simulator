import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface TechnicalEnvironment {
  systemSpecs: {
    operatingSystem: {
      name: string;
      version: string;
      architecture: string;
      buildNumber?: string;
      lastUpdate?: Date;
    };
    hardware: {
      manufacturer: string;
      model: string;
      processor: string;
      memory: string;
      storage: string;
      graphics?: string;
      age: number;
    };
    network: {
      connectionType: 'wired' | 'wireless' | 'hybrid';
      networkName: string;
      domain: string;
      ipAddress: string;
      dnsServers: string[];
      proxySettings?: string;
    };
  };
  softwareEnvironment: {
    installedApplications: Array<{
      name: string;
      version: string;
      vendor: string;
      installDate: Date;
      licenseType: string;
      critical: boolean;
    }>;
    recentChanges: Array<{
      timestamp: Date;
      changeType: 'install' | 'update' | 'uninstall' | 'configuration';
      component: string;
      details: string;
      performedBy: string;
    }>;
    securitySoftware: {
      antivirus: { name: string; version: string; lastScan: Date; };
      firewall: { enabled: boolean; profile: string; };
      encryption: { enabled: boolean; type: string; };
    };
  };
  infraContext: {
    serverDependencies: string[];
    sharedResources: string[];
    criticalServices: string[];
    maintenanceWindows: Array<{
      service: string;
      nextWindow: Date;
      impact: string;
    }>;
    knownLimitations: string[];
  };
  troubleshootingConstraints: {
    remoteAccess: boolean;
    adminRights: boolean;
    downTimeAllowed: boolean;
    backupRequired: boolean;
    changeApprovalNeeded: boolean;
    testingLimitations: string[];
  };
}

interface TechnicalEnvironmentProps {
  technicalEnvironment: TechnicalEnvironment;
  className?: string;
  compact?: boolean;
}

export function TechnicalEnvironment({ 
  technicalEnvironment, 
  className, 
  compact = false 
}: TechnicalEnvironmentProps) {
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

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'wired': return '🔌';
      case 'wireless': return '📶';
      case 'hybrid': return '🔌📶';
      default: return '🌐';
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'install': return '📦';
      case 'update': return '🔄';
      case 'uninstall': return '🗑️';
      case 'configuration': return '⚙️';
      default: return '📝';
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'install': return 'bg-green-50 text-green-700 border-green-200';
      case 'update': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'uninstall': return 'bg-red-50 text-red-700 border-red-200';
      case 'configuration': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (compact) {
    return (
      <Card className={cn('p-4', className)}>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span>💻</span>
          System Overview
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Operating System:</span>
            <p className="font-medium">
              {technicalEnvironment.systemSpecs.operatingSystem.name} {technicalEnvironment.systemSpecs.operatingSystem.version}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Hardware:</span>
            <p className="font-medium">
              {technicalEnvironment.systemSpecs.hardware.manufacturer} {technicalEnvironment.systemSpecs.hardware.model}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Network:</span>
            <div className="flex items-center gap-1">
              <span>{getConnectionIcon(technicalEnvironment.systemSpecs.network.connectionType)}</span>
              <span className="font-medium capitalize">
                {technicalEnvironment.systemSpecs.network.connectionType}
              </span>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Admin Rights:</span>
            <span className={cn(
              'font-medium',
              technicalEnvironment.troubleshootingConstraints.adminRights ? 'text-green-600' : 'text-red-600'
            )}>
              {technicalEnvironment.troubleshootingConstraints.adminRights ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b bg-gray-50 px-6 py-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>💻</span>
          Technical Environment
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          System specifications and infrastructure context
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* System Specifications */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>🖥️</span>
            System Specifications
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Operating System */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h5 className="font-medium mb-3 flex items-center gap-2">
                <span>🖱️</span>
                Operating System
              </h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium">{technicalEnvironment.systemSpecs.operatingSystem.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Version:</span>
                  <p className="font-medium">{technicalEnvironment.systemSpecs.operatingSystem.version}</p>
                </div>
                <div>
                  <span className="text-gray-600">Architecture:</span>
                  <p className="font-medium">{technicalEnvironment.systemSpecs.operatingSystem.architecture}</p>
                </div>
                {technicalEnvironment.systemSpecs.operatingSystem.buildNumber && (
                  <div>
                    <span className="text-gray-600">Build:</span>
                    <p className="font-medium font-mono text-xs">
                      {technicalEnvironment.systemSpecs.operatingSystem.buildNumber}
                    </p>
                  </div>
                )}
                {technicalEnvironment.systemSpecs.operatingSystem.lastUpdate && (
                  <div>
                    <span className="text-gray-600">Last Update:</span>
                    <p className="font-medium">
                      {formatTimeAgo(technicalEnvironment.systemSpecs.operatingSystem.lastUpdate)}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Hardware */}
            <Card className="p-4 bg-green-50 border-green-200">
              <h5 className="font-medium mb-3 flex items-center gap-2">
                <span>🔧</span>
                Hardware
              </h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">System:</span>
                  <p className="font-medium">
                    {technicalEnvironment.systemSpecs.hardware.manufacturer} {technicalEnvironment.systemSpecs.hardware.model}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Processor:</span>
                  <p className="font-medium">{technicalEnvironment.systemSpecs.hardware.processor}</p>
                </div>
                <div>
                  <span className="text-gray-600">Memory:</span>
                  <p className="font-medium">{technicalEnvironment.systemSpecs.hardware.memory}</p>
                </div>
                <div>
                  <span className="text-gray-600">Storage:</span>
                  <p className="font-medium">{technicalEnvironment.systemSpecs.hardware.storage}</p>
                </div>
                {technicalEnvironment.systemSpecs.hardware.graphics && (
                  <div>
                    <span className="text-gray-600">Graphics:</span>
                    <p className="font-medium">{technicalEnvironment.systemSpecs.hardware.graphics}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Age:</span>
                  <p className="font-medium">{technicalEnvironment.systemSpecs.hardware.age.toFixed(1)} years</p>
                </div>
              </div>
            </Card>

            {/* Network */}
            <Card className="p-4 bg-purple-50 border-purple-200">
              <h5 className="font-medium mb-3 flex items-center gap-2">
                <span>🌐</span>
                Network
              </h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Connection:</span>
                  <div className="flex items-center gap-1">
                    <span>{getConnectionIcon(technicalEnvironment.systemSpecs.network.connectionType)}</span>
                    <span className="font-medium capitalize">
                      {technicalEnvironment.systemSpecs.network.connectionType}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Network:</span>
                  <p className="font-medium">{technicalEnvironment.systemSpecs.network.networkName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Domain:</span>
                  <p className="font-medium font-mono text-xs">{technicalEnvironment.systemSpecs.network.domain}</p>
                </div>
                <div>
                  <span className="text-gray-600">IP Address:</span>
                  <p className="font-medium font-mono text-xs">{technicalEnvironment.systemSpecs.network.ipAddress}</p>
                </div>
                <div>
                  <span className="text-gray-600">DNS Servers:</span>
                  <div className="space-y-1">
                    {technicalEnvironment.systemSpecs.network.dnsServers.map((dns, index) => (
                      <p key={index} className="font-medium font-mono text-xs">{dns}</p>
                    ))}
                  </div>
                </div>
                {technicalEnvironment.systemSpecs.network.proxySettings && (
                  <div>
                    <span className="text-gray-600">Proxy:</span>
                    <p className="font-medium font-mono text-xs">
                      {technicalEnvironment.systemSpecs.network.proxySettings}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Software Environment */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>📦</span>
            Software Environment
          </h4>
          
          {/* Security Software */}
          <div className="mb-4">
            <h5 className="font-medium mb-2 text-sm">Security Software</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">🛡️ Antivirus</span>
                  <span className="text-xs text-green-600">Active</span>
                </div>
                <p className="text-sm">{technicalEnvironment.softwareEnvironment.securitySoftware.antivirus.name}</p>
                <p className="text-xs text-gray-600">
                  Last scan: {formatTimeAgo(technicalEnvironment.softwareEnvironment.securitySoftware.antivirus.lastScan)}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">🔥 Firewall</span>
                  <span className={cn(
                    'text-xs',
                    technicalEnvironment.softwareEnvironment.securitySoftware.firewall.enabled 
                      ? 'text-green-600' : 'text-red-600'
                  )}>
                    {technicalEnvironment.softwareEnvironment.securitySoftware.firewall.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-sm">{technicalEnvironment.softwareEnvironment.securitySoftware.firewall.profile}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">🔒 Encryption</span>
                  <span className={cn(
                    'text-xs',
                    technicalEnvironment.softwareEnvironment.securitySoftware.encryption.enabled 
                      ? 'text-green-600' : 'text-red-600'
                  )}>
                    {technicalEnvironment.softwareEnvironment.securitySoftware.encryption.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-sm">{technicalEnvironment.softwareEnvironment.securitySoftware.encryption.type}</p>
              </div>
            </div>
          </div>

          {/* Installed Applications */}
          <div className="mb-4">
            <h5 className="font-medium mb-2 text-sm">Key Installed Applications</h5>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {technicalEnvironment.softwareEnvironment.installedApplications.map((app, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{app.name}</span>
                      {app.critical && (
                        <span className="bg-red-100 text-red-700 text-xs px-1 rounded">Critical</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {app.vendor} • v{app.version} • {app.licenseType}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(app.installDate)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Changes */}
          {technicalEnvironment.softwareEnvironment.recentChanges.length > 0 && (
            <div>
              <h5 className="font-medium mb-2 text-sm">Recent Changes</h5>
              <div className="space-y-2">
                {technicalEnvironment.softwareEnvironment.recentChanges.map((change, index) => (
                  <div key={index} className={cn(
                    'p-3 rounded-md border',
                    getChangeTypeColor(change.changeType)
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getChangeTypeIcon(change.changeType)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm capitalize">{change.changeType}</span>
                            <span className="text-sm">{change.component}</span>
                          </div>
                          <p className="text-xs mt-1">{change.details}</p>
                          <p className="text-xs text-gray-600 mt-1">By: {change.performedBy}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(change.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Infrastructure Context */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>🏗️</span>
            Infrastructure Context
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2 text-sm">Dependencies</h5>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-600">Server Dependencies:</span>
                  <div className="mt-1 space-y-1">
                    {technicalEnvironment.infraContext.serverDependencies.map((server, index) => (
                      <span key={index} className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                        {server}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-xs text-gray-600">Critical Services:</span>
                  <div className="mt-1 space-y-1">
                    {technicalEnvironment.infraContext.criticalServices.map((service, index) => (
                      <span key={index} className="inline-block text-xs bg-red-100 text-red-800 px-2 py-1 rounded mr-1">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium mb-2 text-sm">Shared Resources</h5>
              <div className="space-y-1">
                {technicalEnvironment.infraContext.sharedResources.map((resource, index) => (
                  <div key={index} className="text-xs font-mono bg-gray-100 p-2 rounded">
                    {resource}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Maintenance Windows */}
          {technicalEnvironment.infraContext.maintenanceWindows.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium mb-2 text-sm">Upcoming Maintenance</h5>
              <div className="space-y-2">
                {technicalEnvironment.infraContext.maintenanceWindows.map((window, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{window.service}</span>
                      <span className="text-xs text-gray-600">
                        {formatTimeAgo(window.nextWindow)}
                      </span>
                    </div>
                    <p className="text-xs text-yellow-800">{window.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Known Limitations */}
          {technicalEnvironment.infraContext.knownLimitations.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium mb-2 text-sm">Known Limitations</h5>
              <ul className="space-y-1">
                {technicalEnvironment.infraContext.knownLimitations.map((limitation, index) => (
                  <li key={index} className="text-sm text-orange-800 bg-orange-50 px-2 py-1 rounded">
                    ⚠️ {limitation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Troubleshooting Constraints */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>🚧</span>
            Troubleshooting Constraints
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'remoteAccess', label: 'Remote Access', icon: '🔗' },
              { key: 'adminRights', label: 'Admin Rights', icon: '👑' },
              { key: 'downTimeAllowed', label: 'Downtime Allowed', icon: '⏸️' },
              { key: 'backupRequired', label: 'Backup Required', icon: '💾' },
              { key: 'changeApprovalNeeded', label: 'Change Approval', icon: '✅' },
            ].map(({ key, label, icon }) => (
              <div key={key} className="text-center">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2',
                  (technicalEnvironment.troubleshootingConstraints as any)[key]
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                )}>
                  <span className="text-lg">{icon}</span>
                </div>
                <p className="text-sm font-medium">{label}</p>
                <p className={cn(
                  'text-xs',
                  (technicalEnvironment.troubleshootingConstraints as any)[key]
                    ? 'text-green-600'
                    : 'text-red-600'
                )}>
                  {(technicalEnvironment.troubleshootingConstraints as any)[key] ? 'Available' : 'Not Available'}
                </p>
              </div>
            ))}
          </div>

          {/* Testing Limitations */}
          {technicalEnvironment.troubleshootingConstraints.testingLimitations.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium mb-2 text-sm">Testing Limitations</h5>
              <ul className="space-y-1">
                {technicalEnvironment.troubleshootingConstraints.testingLimitations.map((limitation, index) => (
                  <li key={index} className="text-sm text-red-800 bg-red-50 px-2 py-1 rounded">
                    🚫 {limitation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}