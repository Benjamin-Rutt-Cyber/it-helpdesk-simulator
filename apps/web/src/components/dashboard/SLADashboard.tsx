import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Mock data - in real app would come from API
interface SLAMetrics {
  responseTimeSLA: number;
  resolutionTimeSLA: number;
  overallSLA: number;
  breaches: {
    total: number;
    byType: Record<'response' | 'resolution' | 'escalation', number>;
    byPriority: Record<string, number>;
  };
}

interface SLAAlert {
  id: string;
  ticketId: string;
  type: 'RESPONSE_DUE' | 'RESOLUTION_DUE' | 'SLA_BREACH' | 'ESCALATION_REQUIRED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  createdAt: Date;
  acknowledged: boolean;
}

interface SLADashboardProps {
  className?: string;
}

export function SLADashboard({ className }: SLADashboardProps) {
  const [metrics, setMetrics] = useState<SLAMetrics>({
    responseTimeSLA: 87.5,
    resolutionTimeSLA: 92.3,
    overallSLA: 89.9,
    breaches: {
      total: 8,
      byType: { response: 3, resolution: 4, escalation: 1 },
      byPriority: { HIGH: 2, MEDIUM: 4, LOW: 2 }
    }
  });

  const [alerts, setAlerts] = useState<SLAAlert[]>([
    {
      id: 'alert-1',
      ticketId: 'TK-202407-0001',
      type: 'RESPONSE_DUE',
      severity: 'HIGH',
      message: 'Response due in 15 minutes for high priority ticket',
      createdAt: new Date(),
      acknowledged: false
    },
    {
      id: 'alert-2',
      ticketId: 'TK-202407-0004',
      type: 'SLA_BREACH',
      severity: 'CRITICAL',
      message: 'Resolution SLA breached by 2.5 hours',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      acknowledged: false
    },
    {
      id: 'alert-3',
      ticketId: 'TK-202407-0007',
      type: 'ESCALATION_REQUIRED',
      severity: 'MEDIUM',
      message: 'Ticket requires escalation - threshold exceeded',
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      acknowledged: true
    }
  ]);

  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  const getSLAColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 90) return 'text-yellow-600';
    if (percentage >= 80) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSLABgColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-green-100';
    if (percentage >= 90) return 'bg-yellow-100';
    if (percentage >= 80) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getSeverityColor = (severity: SLAAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getAlertIcon = (type: SLAAlert['type']) => {
    switch (type) {
      case 'RESPONSE_DUE': return '⏰';
      case 'RESOLUTION_DUE': return '⏱️';
      case 'SLA_BREACH': return '🚨';
      case 'ESCALATION_REQUIRED': return '📈';
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SLA Dashboard</h2>
          <p className="text-gray-600">Monitor service level agreement performance and alerts</p>
        </div>
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period as any)}
            >
              {period === '24h' ? '24 Hours' : period === '7d' ? '7 Days' : '30 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* SLA Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Response Time SLA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className={cn('text-3xl font-bold', getSLAColor(metrics.responseTimeSLA))}>
                {metrics.responseTimeSLA.toFixed(1)}%
              </span>
              <div className={cn('px-2 py-1 rounded text-xs font-medium', getSLABgColor(metrics.responseTimeSLA))}>
                Target: 95%
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all',
                  metrics.responseTimeSLA >= 95 ? 'bg-green-500' :
                  metrics.responseTimeSLA >= 90 ? 'bg-yellow-500' :
                  metrics.responseTimeSLA >= 80 ? 'bg-orange-500' : 'bg-red-500'
                )}
                style={{ width: `${metrics.responseTimeSLA}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Resolution Time SLA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className={cn('text-3xl font-bold', getSLAColor(metrics.resolutionTimeSLA))}>
                {metrics.resolutionTimeSLA.toFixed(1)}%
              </span>
              <div className={cn('px-2 py-1 rounded text-xs font-medium', getSLABgColor(metrics.resolutionTimeSLA))}>
                Target: 95%
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all',
                  metrics.resolutionTimeSLA >= 95 ? 'bg-green-500' :
                  metrics.resolutionTimeSLA >= 90 ? 'bg-yellow-500' :
                  metrics.resolutionTimeSLA >= 80 ? 'bg-orange-500' : 'bg-red-500'
                )}
                style={{ width: `${metrics.resolutionTimeSLA}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overall SLA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className={cn('text-3xl font-bold', getSLAColor(metrics.overallSLA))}>
                {metrics.overallSLA.toFixed(1)}%
              </span>
              <div className={cn('px-2 py-1 rounded text-xs font-medium', getSLABgColor(metrics.overallSLA))}>
                Target: 95%
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all',
                  metrics.overallSLA >= 95 ? 'bg-green-500' :
                  metrics.overallSLA >= 90 ? 'bg-yellow-500' :
                  metrics.overallSLA >= 80 ? 'bg-orange-500' : 'bg-red-500'
                )}
                style={{ width: `${metrics.overallSLA}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Breaches Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SLA Breaches by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="font-medium">{metrics.breaches.byType.response}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Resolution Time</span>
                <span className="font-medium">{metrics.breaches.byType.resolution}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Escalation</span>
                <span className="font-medium">{metrics.breaches.byType.escalation}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between font-medium">
                  <span>Total Breaches</span>
                  <span className="text-red-600">{metrics.breaches.total}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA Breaches by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">High Priority</span>
                </div>
                <span className="font-medium">{metrics.breaches.byPriority.HIGH}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Medium Priority</span>
                </div>
                <span className="font-medium">{metrics.breaches.byPriority.MEDIUM}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Low Priority</span>
                </div>
                <span className="font-medium">{metrics.breaches.byPriority.LOW}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>Active SLA Alerts</span>
              {activeAlerts.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {activeAlerts.length}
                </span>
              )}
            </CardTitle>
            <Button variant="outline" size="sm">
              View All Alerts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-lg font-medium text-gray-900">No Active Alerts</p>
              <p className="text-gray-500">All SLA targets are being met</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        getSeverityColor(alert.severity)
                      )}>
                        {alert.severity}
                      </span>
                      <span className="text-sm text-gray-500">
                        Ticket {alert.ticketId}
                      </span>
                      <span className="text-sm text-gray-500">
                        {alert.createdAt.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{alert.message}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Acknowledged Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {acknowledgedAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl opacity-50">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border opacity-75',
                        getSeverityColor(alert.severity)
                      )}>
                        {alert.severity}
                      </span>
                      <span className="text-sm text-gray-500">
                        Ticket {alert.ticketId}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-green-600">Acknowledged</span>
                    </div>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}