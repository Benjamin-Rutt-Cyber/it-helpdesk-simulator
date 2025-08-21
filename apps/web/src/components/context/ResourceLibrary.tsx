import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ResourceLibrary {
  scenarioResources: Array<{
    id: string;
    title: string;
    type: 'documentation' | 'procedure' | 'troubleshooting' | 'reference' | 'tool';
    url?: string;
    content?: string;
    relevance: number;
    complexity: 'basic' | 'intermediate' | 'advanced';
    estimatedReadTime: number;
    lastUpdated: Date;
  }>;
  quickReferences: Array<{
    title: string;
    summary: string;
    keyPoints: string[];
    commonCommands?: string[];
    shortcuts?: string[];
  }>;
  troubleshootingFlows: Array<{
    id: string;
    title: string;
    description: string;
    steps: Array<{
      stepNumber: number;
      instruction: string;
      expectedResult: string;
      troubleshooting?: string[];
      nextSteps: string[];
    }>;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTime: number;
  }>;
  toolAccess: Array<{
    toolName: string;
    purpose: string;
    accessMethod: string;
    authRequired: boolean;
    availability: 'always' | 'business_hours' | 'on_request';
    documentation: string;
  }>;
}

interface ResourceLibraryProps {
  resourceLibrary: ResourceLibrary;
  className?: string;
  onResourceView?: (resourceId: string) => void;
  onToolAccess?: (toolName: string) => void;
}

export function ResourceLibrary({ 
  resourceLibrary, 
  className,
  onResourceView,
  onToolAccess
}: ResourceLibraryProps) {
  const [activeTab, setActiveTab] = useState<'resources' | 'references' | 'flows' | 'tools'>('resources');
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'documentation': return '📚';
      case 'procedure': return '📋';
      case 'troubleshooting': return '🔧';
      case 'reference': return '📖';
      case 'tool': return '🛠️';
      default: return '📄';
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'documentation': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'procedure': return 'bg-green-50 text-green-700 border-green-200';
      case 'troubleshooting': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'reference': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'tool': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'always': return 'bg-green-100 text-green-800';
      case 'business_hours': return 'bg-yellow-100 text-yellow-800';
      case 'on_request': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const toggleFlow = (flowId: string) => {
    const newExpanded = new Set(expandedFlows);
    if (newExpanded.has(flowId)) {
      newExpanded.delete(flowId);
    } else {
      newExpanded.add(flowId);
    }
    setExpandedFlows(newExpanded);
  };

  const filterResources = (resources: any[]) => {
    if (!searchQuery) return resources;
    const query = searchQuery.toLowerCase();
    return resources.filter(resource => 
      resource.title?.toLowerCase().includes(query) ||
      resource.description?.toLowerCase().includes(query) ||
      resource.summary?.toLowerCase().includes(query)
    );
  };

  const tabs = [
    { id: 'resources', label: 'Documentation', icon: '📚', count: resourceLibrary.scenarioResources.length },
    { id: 'references', label: 'Quick Reference', icon: '⚡', count: resourceLibrary.quickReferences.length },
    { id: 'flows', label: 'Troubleshooting', icon: '🔄', count: resourceLibrary.troubleshootingFlows.length },
    { id: 'tools', label: 'Tools', icon: '🛠️', count: resourceLibrary.toolAccess.length },
  ];

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📖</span>
              Resource Library
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Documentation, tools, and references for this scenario
            </p>
          </div>

          {/* Search */}
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Documentation Resources */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            {filterResources(resourceLibrary.scenarioResources).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No documentation resources found</p>
              </div>
            ) : (
              filterResources(resourceLibrary.scenarioResources).map((resource) => (
                <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getResourceTypeIcon(resource.type)}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{resource.title}</h4>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={cn(
                            'px-2 py-1 rounded-md border text-xs font-medium',
                            getResourceTypeColor(resource.type)
                          )}>
                            {resource.type}
                          </span>
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            getComplexityColor(resource.complexity)
                          )}>
                            {resource.complexity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDuration(resource.estimatedReadTime)} read
                          </span>
                          <span className="text-xs text-gray-500">
                            Updated {formatTimeAgo(resource.lastUpdated)}
                          </span>
                        </div>
                        {resource.content && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {resource.content.slice(0, 150)}...
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Relevance</div>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${resource.relevance * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {Math.round(resource.relevance * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => onResourceView?.(resource.id)}
                        className="ml-3"
                      >
                        {resource.url ? 'Open' : 'View'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Quick References */}
        {activeTab === 'references' && (
          <div className="space-y-4">
            {filterResources(resourceLibrary.quickReferences).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No quick references found</p>
              </div>
            ) : (
              filterResources(resourceLibrary.quickReferences).map((reference, index) => (
                <Card key={index} className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span>⚡</span>
                    {reference.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{reference.summary}</p>
                  
                  <div className="space-y-3">
                    {/* Key Points */}
                    <div>
                      <h5 className="font-medium text-sm mb-2">Key Points</h5>
                      <ul className="space-y-1">
                        {reference.keyPoints.map((point, pointIndex) => (
                          <li key={pointIndex} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Common Commands */}
                    {reference.commonCommands && reference.commonCommands.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Common Commands</h5>
                        <div className="space-y-1">
                          {reference.commonCommands.map((command, cmdIndex) => (
                            <code key={cmdIndex} className="block bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {command}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shortcuts */}
                    {reference.shortcuts && reference.shortcuts.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Shortcuts</h5>
                        <div className="flex flex-wrap gap-2">
                          {reference.shortcuts.map((shortcut, shortcutIndex) => (
                            <span key={shortcutIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                              {shortcut}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Troubleshooting Flows */}
        {activeTab === 'flows' && (
          <div className="space-y-4">
            {filterResources(resourceLibrary.troubleshootingFlows).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No troubleshooting flows found</p>
              </div>
            ) : (
              filterResources(resourceLibrary.troubleshootingFlows).map((flow) => (
                <Card key={flow.id} className="overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          <span>🔄</span>
                          {flow.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{flow.description}</p>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            getComplexityColor(flow.complexity)
                          )}>
                            {flow.complexity}
                          </span>
                          <span className="text-xs text-gray-500">
                            ~{formatDuration(flow.estimatedTime)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {flow.steps.length} steps
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFlow(flow.id)}
                      >
                        {expandedFlows.has(flow.id) ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </div>

                  {expandedFlows.has(flow.id) && (
                    <div className="p-4">
                      <div className="space-y-4">
                        {flow.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                                {step.stepNumber}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h5 className="font-medium text-sm mb-1">Instruction</h5>
                              <p className="text-sm text-gray-700 mb-2">{step.instruction}</p>
                              
                              <h5 className="font-medium text-sm mb-1">Expected Result</h5>
                              <p className="text-sm text-gray-600 mb-2">{step.expectedResult}</p>
                              
                              {step.troubleshooting && step.troubleshooting.length > 0 && (
                                <div className="mb-2">
                                  <h5 className="font-medium text-sm mb-1">If this doesn't work:</h5>
                                  <ul className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                                    {step.troubleshooting.map((trouble, troubleIndex) => (
                                      <li key={troubleIndex} className="flex items-start gap-1">
                                        <span>•</span>
                                        <span>{trouble}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div>
                                <h5 className="font-medium text-sm mb-1">Next Steps</h5>
                                <ul className="text-sm text-green-700">
                                  {step.nextSteps.map((nextStep, nextIndex) => (
                                    <li key={nextIndex} className="flex items-start gap-1">
                                      <span>→</span>
                                      <span>{nextStep}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Tools */}
        {activeTab === 'tools' && (
          <div className="space-y-4">
            {filterResources(resourceLibrary.toolAccess).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No tools available</p>
              </div>
            ) : (
              filterResources(resourceLibrary.toolAccess).map((tool, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">🛠️</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{tool.toolName}</h4>
                        <p className="text-sm text-gray-600 mb-2">{tool.purpose}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Access:</span>
                              <span className="ml-1">{tool.accessMethod}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Auth:</span>
                              <span className={cn(
                                'ml-1',
                                tool.authRequired ? 'text-orange-600' : 'text-green-600'
                              )}>
                                {tool.authRequired ? 'Required' : 'Not Required'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Availability:</span>
                              <span className={cn(
                                'ml-1 px-2 py-0.5 rounded text-xs font-medium',
                                getAvailabilityColor(tool.availability)
                              )}>
                                {tool.availability.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500">{tool.documentation}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => onToolAccess?.(tool.toolName)}
                      disabled={tool.availability === 'on_request'}
                    >
                      {tool.availability === 'on_request' ? 'Request Access' : 'Launch Tool'}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  );
}