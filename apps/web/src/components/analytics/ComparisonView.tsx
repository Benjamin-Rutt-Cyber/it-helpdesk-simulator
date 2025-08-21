import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';

interface ComparisonData {
  historicalComparison: {
    previousAttempts: any[];
    improvementTrend: number;
    bestScore: any;
    averageScore: any;
  };
  peerComparison: {
    percentile: number;
    averagePeerScore: any;
    topPerformerScore: any;
    skillRanking: { [skillName: string]: number };
  };
}

interface ComparisonViewProps {
  userId: string;
  scenarioId?: string;
  className?: string;
}

export function ComparisonView({ userId, scenarioId, className }: ComparisonViewProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('historical');

  useEffect(() => {
    loadComparisonData();
  }, [userId, scenarioId]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = scenarioId 
        ? `/api/analytics/user/${userId}/comparison?scenarioId=${scenarioId}`
        : `/api/analytics/user/${userId}/comparison`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load comparison data');
      }

      const result = await response.json();
      setComparisonData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return 'text-green-600';
    if (percentile >= 75) return 'text-blue-600';
    if (percentile >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentileDescription = (percentile: number): string => {
    if (percentile >= 90) return 'Top 10% performer';
    if (percentile >= 75) return 'Above average performer';
    if (percentile >= 50) return 'Average performer';
    if (percentile >= 25) return 'Below average performer';
    return 'Needs improvement';
  };

  const getTrendIcon = (trend: number): string => {
    if (trend > 0) return '📈';
    if (trend < 0) return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold">Failed to Load Comparison</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadComparisonData} variant="outline">
          Try Again
        </Button>
      </Card>
    );
  }

  if (!comparisonData) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">Performance Comparison</h3>
        <p className="text-gray-600">
          Compare your performance with historical data and peer benchmarks
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="historical">Historical</TabsTrigger>
          <TabsTrigger value="peer">Peer Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="historical" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Improvement Trend */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span>📊</span>
                Performance Trend
              </h4>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {getTrendIcon(comparisonData.historicalComparison.improvementTrend)}
                  {comparisonData.historicalComparison.improvementTrend.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">
                  {comparisonData.historicalComparison.improvementTrend > 0 ? 'Improvement' : 'Change'} over time
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Best Score:</span>
                  <span className="font-semibold text-green-600">
                    {comparisonData.historicalComparison.bestScore.overallScore}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Score:</span>
                  <span className="font-semibold text-blue-600">
                    {comparisonData.historicalComparison.averageScore.overallScore}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Attempts:</span>
                  <span className="font-semibold">
                    {comparisonData.historicalComparison.previousAttempts.length}
                  </span>
                </div>
              </div>
            </Card>

            {/* Historical Performance */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span>📈</span>
                Score History
              </h4>
              
              <div className="space-y-3">
                {comparisonData.historicalComparison.previousAttempts.slice(-5).map((attempt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium">Attempt {index + 1}</p>
                      <p className="text-xs text-gray-500">
                        {attempt.completionTime} min • {attempt.technicalAccuracy}% accuracy
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {attempt.overallScore}
                      </div>
                      <div className="text-xs text-gray-500">
                        Overall Score
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Skill Improvement Breakdown */}
            <Card className="p-6 lg:col-span-2">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span>🎯</span>
                Skill Development Over Time
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Technical Accuracy', current: 85, previous: 72, color: 'blue' },
                  { name: 'Customer Satisfaction', current: 88, previous: 80, color: 'green' },
                  { name: 'Procedure Compliance', current: 82, previous: 78, color: 'purple' }
                ].map((skill) => {
                  const improvement = skill.current - skill.previous;
                  return (
                    <div key={skill.name} className="text-center">
                      <h5 className="font-medium text-sm mb-2">{skill.name}</h5>
                      <div className="mb-2">
                        <span className={`text-2xl font-bold text-${skill.color}-600`}>
                          {skill.current}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({improvement > 0 ? '+' : ''}{improvement})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-${skill.color}-500 h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${skill.current}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="peer" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Percentile Ranking */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span>🏆</span>
                Your Ranking
              </h4>
              
              <div className="text-center mb-4">
                <div className={cn('text-4xl font-bold mb-2', getPercentileColor(comparisonData.peerComparison.percentile))}>
                  {comparisonData.peerComparison.percentile}th
                </div>
                <p className="text-sm text-gray-600 mb-2">Percentile</p>
                <p className="text-xs text-gray-500">
                  {getPercentileDescription(comparisonData.peerComparison.percentile)}
                </p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${comparisonData.peerComparison.percentile}%` }}
                />
              </div>

              <p className="text-xs text-center text-gray-500">
                You performed better than {comparisonData.peerComparison.percentile}% of users
              </p>
            </Card>

            {/* Score Comparison */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span>📊</span>
                Score Comparison
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Score</span>
                  <span className="text-lg font-bold text-blue-600">85</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Peer Average</span>
                  <span className="text-lg font-bold text-gray-600">
                    {comparisonData.peerComparison.averagePeerScore.overallScore}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Top Performer</span>
                  <span className="text-lg font-bold text-green-600">
                    {comparisonData.peerComparison.topPerformerScore.overallScore}
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gap to Top</span>
                    <span className="text-sm text-orange-600">
                      -{comparisonData.peerComparison.topPerformerScore.overallScore - 85} points
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Skill Rankings */}
            <Card className="p-6 lg:col-span-2">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span>🎯</span>
                Skill-Specific Rankings
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(comparisonData.peerComparison.skillRanking).map(([skill, percentile]) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{skill}</span>
                      <span className={cn('text-sm font-bold', getPercentileColor(percentile))}>
                        {percentile}th percentile
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn('h-2 rounded-full transition-all duration-300',
                          percentile >= 90 ? 'bg-green-500' :
                          percentile >= 75 ? 'bg-blue-500' :
                          percentile >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${percentile}%` }}
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Better than {percentile}% of users in {skill}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Insights and Recommendations */}
            <Card className="p-6 lg:col-span-2 bg-green-50 border-green-200">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-900">
                <span>💡</span>
                Competitive Insights
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-green-900 mb-2">Your Strengths</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Above average in communication skills</li>
                    <li>• Strong procedure compliance</li>
                    <li>• Consistent performance improvement</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-green-900 mb-2">Growth Opportunities</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Focus on technical troubleshooting speed</li>
                    <li>• Practice complex scenarios to reach top 10%</li>
                    <li>• Join study groups for peer learning</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}