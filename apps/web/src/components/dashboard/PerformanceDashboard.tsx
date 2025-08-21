import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Mock performance data - in real app would come from API
interface PerformanceData {
  overview: {
    totalTickets: number;
    resolvedTickets: number;
    averageResponseTime: number; // minutes
    averageResolutionTime: number; // hours
    customerSatisfaction: number;
    slaCompliance: number;
  };
  trends: {
    volumeTrend: { period: string; count: number }[];
    responseTimeTrend: { period: string; avgTime: number }[];
    resolutionTimeTrend: { period: string; avgTime: number }[];
    satisfactionTrend: { period: string; score: number }[];
  };
  teamMetrics: {
    techId: string;
    name: string;
    ticketsHandled: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
    slaCompliance: number;
    workloadStatus: 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOADED';
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    avgResolutionTime: number;
    satisfactionScore: number;
  }[];
}

interface PerformanceDashboardProps {
  className?: string;
}

export function PerformanceDashboard({ className }: PerformanceDashboardProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'response' | 'resolution' | 'satisfaction'>('volume');

  const performanceData: PerformanceData = {
    overview: {
      totalTickets: 147,
      resolvedTickets: 132,
      averageResponseTime: 23.5,
      averageResolutionTime: 4.2,
      customerSatisfaction: 4.3,
      slaCompliance: 89.7
    },
    trends: {
      volumeTrend: [
        { period: 'Week 1', count: 35 },
        { period: 'Week 2', count: 42 },
        { period: 'Week 3', count: 38 },
        { period: 'Week 4', count: 32 }
      ],
      responseTimeTrend: [
        { period: 'Week 1', avgTime: 28.2 },
        { period: 'Week 2', avgTime: 24.1 },
        { period: 'Week 3', avgTime: 21.8 },
        { period: 'Week 4', avgTime: 23.5 }
      ],
      resolutionTimeTrend: [
        { period: 'Week 1', avgTime: 5.1 },
        { period: 'Week 2', avgTime: 4.8 },
        { period: 'Week 3', avgTime: 3.9 },
        { period: 'Week 4', avgTime: 4.2 }
      ],
      satisfactionTrend: [
        { period: 'Week 1', score: 4.1 },
        { period: 'Week 2', score: 4.2 },
        { period: 'Week 3', score: 4.4 },
        { period: 'Week 4', score: 4.3 }
      ]
    },
    teamMetrics: [
      {
        techId: 'tech-001',
        name: 'Alice Johnson',
        ticketsHandled: 42,
        avgResolutionTime: 3.8,
        customerSatisfaction: 4.5,
        slaCompliance: 94.2,
        workloadStatus: 'NORMAL'
      },
      {
        techId: 'tech-002',
        name: 'Bob Smith',
        ticketsHandled: 38,
        avgResolutionTime: 4.1,
        customerSatisfaction: 4.2,
        slaCompliance: 91.5,
        workloadStatus: 'HIGH'
      },
      {
        techId: 'tech-003',
        name: 'Carol Davis',
        ticketsHandled: 35,
        avgResolutionTime: 4.6,
        customerSatisfaction: 4.1,
        slaCompliance: 87.3,
        workloadStatus: 'NORMAL'
      },
      {
        techId: 'tech-004',
        name: 'David Wilson',
        ticketsHandled: 32,
        avgResolutionTime: 4.0,
        customerSatisfaction: 4.4,
        slaCompliance: 89.1,
        workloadStatus: 'LOW'
      }
    ],
    categoryBreakdown: [
      { category: 'Password Reset', count: 45, avgResolutionTime: 0.5, satisfactionScore: 4.6 },
      { category: 'Software Issues', count: 38, avgResolutionTime: 6.2, satisfactionScore: 4.1 },
      { category: 'Hardware Problems', count: 32, avgResolutionTime: 8.1, satisfactionScore: 4.0 },
      { category: 'Network Issues', count: 20, avgResolutionTime: 5.8, satisfactionScore: 4.2 },
      { category: 'Printer Issues', count: 12, avgResolutionTime: 2.3, satisfactionScore: 4.5 }
    ]
  };

  const getWorkloadColor = (status: string) => {
    switch (status) {
      case 'LOW': return 'bg-blue-100 text-blue-800';
      case 'NORMAL': return 'bg-green-100 text-green-800';
      case 'HIGH': return 'bg-yellow-100 text-yellow-800';
      case 'OVERLOADED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (value: number, type: 'sla' | 'satisfaction') => {
    if (type === 'sla') {
      if (value >= 95) return 'text-green-600';
      if (value >= 90) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 4.5) return 'text-green-600';
      if (value >= 4.0) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getCurrentTrendData = () => {
    switch (selectedMetric) {
      case 'volume': return performanceData.trends.volumeTrend;
      case 'response': return performanceData.trends.responseTimeTrend;
      case 'resolution': return performanceData.trends.resolutionTimeTrend;
      case 'satisfaction': return performanceData.trends.satisfactionTrend;
      default: return performanceData.trends.volumeTrend;
    }
  };

  const getTrendValue = (item: any) => {
    switch (selectedMetric) {
      case 'volume': return item.count;
      case 'response': return `${item.avgTime} min`;
      case 'resolution': return `${item.avgTime} hrs`;
      case 'satisfaction': return item.score.toFixed(1);
      default: return item.count;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Track team performance and identify improvement opportunities</p>
        </div>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period as any)}
            >
              {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{performanceData.overview.totalTickets}</div>
            <div className="text-sm text-gray-600">Total Tickets</div>
            <div className="text-xs text-green-600 mt-1">+12% vs last period</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{performanceData.overview.resolvedTickets}</div>
            <div className="text-sm text-gray-600">Resolved</div>
            <div className="text-xs text-green-600 mt-1">
              {((performanceData.overview.resolvedTickets / performanceData.overview.totalTickets) * 100).toFixed(1)}% rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{performanceData.overview.averageResponseTime}</div>
            <div className="text-sm text-gray-600">Avg Response (min)</div>
            <div className="text-xs text-green-600 mt-1">-8% improvement</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{performanceData.overview.averageResolutionTime}</div>
            <div className="text-sm text-gray-600">Avg Resolution (hrs)</div>
            <div className="text-xs text-green-600 mt-1">-15% improvement</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{performanceData.overview.customerSatisfaction}</div>
            <div className="text-sm text-gray-600">Satisfaction</div>
            <div className="text-xs text-yellow-600 mt-1">4.3/5.0 rating</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{performanceData.overview.slaCompliance}%</div>
            <div className="text-sm text-gray-600">SLA Compliance</div>
            <div className="text-xs text-yellow-600 mt-1">Target: 95%</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Trends</CardTitle>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'volume', label: 'Volume' },
                { id: 'response', label: 'Response' },
                { id: 'resolution', label: 'Resolution' },
                { id: 'satisfaction', label: 'Satisfaction' }
              ].map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric.id as any)}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                    selectedMetric === metric.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getCurrentTrendData().map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.period}</span>
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{getTrendValue(item)}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${selectedMetric === 'satisfaction' 
                          ? (item.score / 5) * 100 
                          : selectedMetric === 'volume' 
                            ? (item.count / 50) * 100 
                            : (item.avgTime / 10) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Technician</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Tickets Handled</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Avg Resolution</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Satisfaction</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">SLA Compliance</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Workload</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.teamMetrics.map((tech) => (
                  <tr key={tech.techId} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{tech.name}</div>
                      <div className="text-sm text-gray-500">{tech.techId}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{tech.ticketsHandled}</td>
                    <td className="py-3 px-4 text-right">{tech.avgResolutionTime} hrs</td>
                    <td className={cn('py-3 px-4 text-right font-medium', getPerformanceColor(tech.customerSatisfaction, 'satisfaction'))}>
                      {tech.customerSatisfaction.toFixed(1)}
                    </td>
                    <td className={cn('py-3 px-4 text-right font-medium', getPerformanceColor(tech.slaCompliance, 'sla'))}>
                      {tech.slaCompliance.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getWorkloadColor(tech.workloadStatus))}>
                        {tech.workloadStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{category.category}</div>
                  <div className="text-sm text-gray-600">{category.count} tickets</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{category.avgResolutionTime} hrs</div>
                  <div className="text-sm text-gray-600">avg resolution</div>
                </div>
                <div className="text-right ml-6">
                  <div className={cn('font-medium', getPerformanceColor(category.satisfactionScore, 'satisfaction'))}>
                    {category.satisfactionScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">satisfaction</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-600 text-xl">✅</div>
              <div>
                <div className="font-medium text-green-800">Strong Performance</div>
                <div className="text-sm text-green-700">
                  Password reset tickets are being resolved 40% faster than last month with high customer satisfaction.
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-600 text-xl">⚠️</div>
              <div>
                <div className="font-medium text-yellow-800">Improvement Opportunity</div>
                <div className="text-sm text-yellow-700">
                  SLA compliance is below target (89.7% vs 95%). Focus on response time improvements for high-priority tickets.
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-600 text-xl">💡</div>
              <div>
                <div className="font-medium text-blue-800">Recommendation</div>
                <div className="text-sm text-blue-700">
                  Consider cross-training team members on hardware troubleshooting to balance workload and reduce resolution times.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}