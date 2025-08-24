import { logger } from '../utils/logger';

interface TrendData {
  timestamp: Date;
  value: number;
  category?: string;
  metadata?: any;
}

interface TrendAnalysisResult {
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  direction: number; // Slope of the trend line
  confidence: number; // 0-100, confidence in the trend analysis
  rate: number; // Rate of change per time period
  forecast: Array<{
    timestamp: Date;
    predictedValue: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;
  insights: string[];
  breakpoints: Array<{
    timestamp: Date;
    type: 'improvement' | 'regression' | 'milestone';
    description: string;
  }>;
}

interface SeasonalityResult {
  hasSeasonality: boolean;
  cycles: Array<{
    period: string; // 'daily', 'weekly', 'monthly'
    strength: number; // 0-1
    pattern: number[];
  }>;
}

interface AnomalyResult {
  anomalies: Array<{
    timestamp: Date;
    value: number;
    expectedValue: number;
    deviation: number;
    type: 'spike' | 'drop' | 'outlier';
    severity: 'low' | 'medium' | 'high';
  }>;
  totalAnomalies: number;
  anomalyRate: number;
}

class TrendAnalyzer {
  /**
   * Analyze performance trends for a user
   */
  async analyzeTrends(userId: string, performanceData: any): Promise<TrendAnalysisResult> {
    try {
      logger.info(`Analyzing trends for user ${userId}`);

      const timeSeriesData = this.extractTimeSeriesData(performanceData);
      
      if (timeSeriesData.length < 3) {
        logger.warn(`Insufficient data for trend analysis: ${timeSeriesData.length} points`);
        return this.createInsufficientDataResult();
      }

      const trend = this.calculateTrend(timeSeriesData);
      const forecast = this.generateForecast(timeSeriesData, 7); // 7 days forecast
      const insights = this.generateTrendInsights(timeSeriesData, trend);
      const breakpoints = this.identifyBreakpoints(timeSeriesData);

      const result: TrendAnalysisResult = {
        trend: this.classifyTrend(trend.direction, trend.volatility),
        direction: trend.direction,
        confidence: trend.confidence,
        rate: trend.rate,
        forecast,
        insights,
        breakpoints
      };

      logger.info(`Trend analysis completed for user ${userId}: ${result.trend}`);
      return result;

    } catch (error) {
      logger.error('Error analyzing trends:', error);
      throw new Error('Failed to analyze trends');
    }
  }

  /**
   * Analyze seasonality patterns in performance data
   */
  async analyzeSeasonality(userId: string, performanceData: any): Promise<SeasonalityResult> {
    try {
      const timeSeriesData = this.extractTimeSeriesData(performanceData);
      
      if (timeSeriesData.length < 14) {
        return { hasSeasonality: false, cycles: [] };
      }

      const cycles = [];

      // Daily pattern analysis
      const dailyPattern = this.analyzeDailyPattern(timeSeriesData);
      if (dailyPattern.strength > 0.3) {
        cycles.push({
          period: 'daily',
          strength: dailyPattern.strength,
          pattern: dailyPattern.pattern
        });
      }

      // Weekly pattern analysis
      const weeklyPattern = this.analyzeWeeklyPattern(timeSeriesData);
      if (weeklyPattern.strength > 0.3) {
        cycles.push({
          period: 'weekly',
          strength: weeklyPattern.strength,
          pattern: weeklyPattern.pattern
        });
      }

      return {
        hasSeasonality: cycles.length > 0,
        cycles
      };

    } catch (error) {
      logger.error('Error analyzing seasonality:', error);
      throw new Error('Failed to analyze seasonality');
    }
  }

  /**
   * Detect anomalies in performance data
   */
  async detectAnomalies(userId: string, performanceData: any): Promise<AnomalyResult> {
    try {
      const timeSeriesData = this.extractTimeSeriesData(performanceData);
      
      if (timeSeriesData.length < 5) {
        return { anomalies: [], totalAnomalies: 0, anomalyRate: 0 };
      }

      const anomalies = this.identifyAnomalies(timeSeriesData);
      
      return {
        anomalies,
        totalAnomalies: anomalies.length,
        anomalyRate: anomalies.length / timeSeriesData.length
      };

    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      throw new Error('Failed to detect anomalies');
    }
  }

  /**
   * Compare trends across multiple dimensions
   */
  async compareTrends(userId: string, performanceData: any, dimensions: string[]): Promise<any> {
    try {
      const trendComparisons: any = {};

      for (const dimension of dimensions) {
        const dimensionData = this.extractDimensionData(performanceData, dimension);
        if (dimensionData.length >= 3) {
          trendComparisons[dimension] = await this.analyzeTrends(userId, { [dimension]: dimensionData });
        }
      }

      // Identify correlations between dimensions
      const correlations = this.calculateCorrelations(performanceData, dimensions);

      return {
        dimensionTrends: trendComparisons,
        correlations,
        insights: this.generateCorrelationInsights(correlations)
      };

    } catch (error) {
      logger.error('Error comparing trends:', error);
      throw new Error('Failed to compare trends');
    }
  }

  // Private helper methods

  private extractTimeSeriesData(performanceData: any): TrendData[] {
    const timeSeriesData: TrendData[] = [];

    // Extract from sessions data
    if (performanceData.sessions && Array.isArray(performanceData.sessions)) {
      performanceData.sessions.forEach((session: any) => {
        if (session.createdAt && session.performance?.overallScore) {
          timeSeriesData.push({
            timestamp: new Date(session.createdAt),
            value: session.performance.overallScore,
            category: 'performance',
            metadata: { sessionId: session.id }
          });
        }
      });
    }

    // Sort by timestamp
    return timeSeriesData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private extractDimensionData(performanceData: any, dimension: string): TrendData[] {
    const timeSeriesData: TrendData[] = [];

    if (performanceData.sessions && Array.isArray(performanceData.sessions)) {
      performanceData.sessions.forEach((session: any) => {
        const value = session.performance?.[dimension];
        if (session.createdAt && value !== undefined) {
          timeSeriesData.push({
            timestamp: new Date(session.createdAt),
            value,
            category: dimension,
            metadata: { sessionId: session.id }
          });
        }
      });
    }

    return timeSeriesData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculateTrend(data: TrendData[]): { direction: number; confidence: number; rate: number; volatility: number } {
    if (data.length < 2) {
      return { direction: 0, confidence: 0, rate: 0, volatility: 0 };
    }

    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.value);

    // Calculate linear regression
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);

    const rSquared = 1 - (ssResidual / ssTotal);
    const confidence = Math.max(0, Math.min(100, rSquared * 100));

    // Calculate rate of change per day
    const timeSpan = (data[data.length - 1].timestamp.getTime() - data[0].timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const rate = slope * (timeSpan / n);

    // Calculate volatility
    const volatility = this.calculateVolatility(y);

    return {
      direction: slope,
      confidence,
      rate,
      volatility
    };
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / mean; // Coefficient of variation
  }

  private classifyTrend(direction: number, volatility: number): 'improving' | 'declining' | 'stable' | 'volatile' {
    if (volatility > 0.3) return 'volatile';
    if (direction > 0.5) return 'improving';
    if (direction < -0.5) return 'declining';
    return 'stable';
  }

  private generateForecast(data: TrendData[], days: number): TrendAnalysisResult['forecast'] {
    if (data.length < 3) return [];

    const trend = this.calculateTrend(data);
    const lastValue = data[data.length - 1].value;
    const lastTimestamp = data[data.length - 1].timestamp;

    const forecast: TrendAnalysisResult['forecast'] = [];

    for (let i = 1; i <= days; i++) {
      const futureTimestamp = new Date(lastTimestamp.getTime() + i * 24 * 60 * 60 * 1000);
      const predictedValue = lastValue + (trend.direction * i);
      
      // Calculate confidence interval based on trend confidence and volatility
      const baseConfidence = Math.max(5, 20 - (trend.confidence / 5));
      const margin = baseConfidence * Math.sqrt(i); // Uncertainty increases with time

      forecast.push({
        timestamp: futureTimestamp,
        predictedValue: Math.max(0, Math.min(100, predictedValue)),
        confidenceInterval: {
          lower: Math.max(0, predictedValue - margin),
          upper: Math.min(100, predictedValue + margin)
        }
      });
    }

    return forecast;
  }

  private generateTrendInsights(data: TrendData[], trend: any): string[] {
    const insights: string[] = [];

    if (trend.confidence < 30) {
      insights.push('Performance data shows high variability, making trend prediction less reliable');
    }

    if (trend.direction > 1) {
      insights.push(`Strong improvement trend detected with ${trend.rate.toFixed(1)} point average daily gain`);
    } else if (trend.direction > 0.2) {
      insights.push(`Moderate improvement trend with steady upward trajectory`);
    } else if (trend.direction < -1) {
      insights.push(`Declining trend detected requiring immediate attention`);
    } else if (trend.direction < -0.2) {
      insights.push(`Slight downward trend that should be monitored closely`);
    } else {
      insights.push(`Performance remains stable with minimal variation`);
    }

    // Analyze recent performance
    if (data.length >= 5) {
      const recent = data.slice(-5);
      const earlier = data.slice(-10, -5);
      
      if (recent.length > 0 && earlier.length > 0) {
        const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, d) => sum + d.value, 0) / earlier.length;
        
        const recentChange = recentAvg - earlierAvg;
        if (recentChange > 5) {
          insights.push('Recent performance shows significant improvement acceleration');
        } else if (recentChange < -5) {
          insights.push('Recent performance shows concerning decline that needs attention');
        }
      }
    }

    return insights;
  }

  private identifyBreakpoints(data: TrendData[]): TrendAnalysisResult['breakpoints'] {
    if (data.length < 5) return [];

    const breakpoints: TrendAnalysisResult['breakpoints'] = [];
    const windowSize = Math.max(3, Math.floor(data.length / 5));

    for (let i = windowSize; i < data.length - windowSize; i++) {
      const before = data.slice(i - windowSize, i);
      const after = data.slice(i, i + windowSize);

      const beforeAvg = before.reduce((sum, d) => sum + d.value, 0) / before.length;
      const afterAvg = after.reduce((sum, d) => sum + d.value, 0) / after.length;

      const change = afterAvg - beforeAvg;
      
      if (Math.abs(change) > 10) {
        breakpoints.push({
          timestamp: data[i].timestamp,
          type: change > 0 ? 'improvement' : 'regression',
          description: `${Math.abs(change).toFixed(1)} point ${change > 0 ? 'improvement' : 'decline'} detected`
        });
      }
    }

    return breakpoints;
  }

  private analyzeDailyPattern(data: TrendData[]): { strength: number; pattern: number[] } {
    const hourlyData: number[][] = new Array(24).fill(0).map(() => []);

    data.forEach(d => {
      const hour = d.timestamp.getHours();
      hourlyData[hour].push(d.value);
    });

    const hourlyAverages = hourlyData.map(hourData => 
      hourData.length > 0 ? hourData.reduce((a, b) => a + b, 0) / hourData.length : 0
    );

    const overallAverage = hourlyAverages.reduce((a, b) => a + b, 0) / 24;
    const variance = hourlyAverages.reduce((sum, avg) => sum + Math.pow(avg - overallAverage, 2), 0) / 24;
    const strength = Math.sqrt(variance) / overallAverage;

    return {
      strength: Math.min(1, strength),
      pattern: hourlyAverages
    };
  }

  private analyzeWeeklyPattern(data: TrendData[]): { strength: number; pattern: number[] } {
    const dailyData: number[][] = new Array(7).fill(0).map(() => []);

    data.forEach(d => {
      const day = d.timestamp.getDay();
      dailyData[day].push(d.value);
    });

    const dailyAverages = dailyData.map(dayData => 
      dayData.length > 0 ? dayData.reduce((a, b) => a + b, 0) / dayData.length : 0
    );

    const overallAverage = dailyAverages.reduce((a, b) => a + b, 0) / 7;
    const variance = dailyAverages.reduce((sum, avg) => sum + Math.pow(avg - overallAverage, 2), 0) / 7;
    const strength = Math.sqrt(variance) / overallAverage;

    return {
      strength: Math.min(1, strength),
      pattern: dailyAverages
    };
  }

  private identifyAnomalies(data: TrendData[]): AnomalyResult['anomalies'] {
    if (data.length < 5) return [];

    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    const anomalies: AnomalyResult['anomalies'] = [];

    data.forEach(d => {
      const deviation = Math.abs(d.value - mean);
      const zScore = deviation / stdDev;

      if (zScore > 2) {
        let type: 'spike' | 'drop' | 'outlier' = 'outlier';
        let severity: 'low' | 'medium' | 'high' = 'low';

        if (d.value > mean + 2 * stdDev) {
          type = 'spike';
        } else if (d.value < mean - 2 * stdDev) {
          type = 'drop';
        }

        if (zScore > 3) severity = 'high';
        else if (zScore > 2.5) severity = 'medium';

        anomalies.push({
          timestamp: d.timestamp,
          value: d.value,
          expectedValue: mean,
          deviation,
          type,
          severity
        });
      }
    });

    return anomalies;
  }

  private calculateCorrelations(performanceData: any, dimensions: string[]): any {
    const correlations: any = {};

    for (let i = 0; i < dimensions.length; i++) {
      for (let j = i + 1; j < dimensions.length; j++) {
        const dim1 = dimensions[i];
        const dim2 = dimensions[j];
        
        const data1 = this.extractDimensionData(performanceData, dim1);
        const data2 = this.extractDimensionData(performanceData, dim2);
        
        const correlation = this.calculatePearsonCorrelation(
          data1.map(d => d.value),
          data2.map(d => d.value)
        );

        correlations[`${dim1}_${dim2}`] = {
          correlation,
          strength: this.interpretCorrelationStrength(correlation),
          dimensions: [dim1, dim2]
        };
      }
    }

    return correlations;
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private interpretCorrelationStrength(correlation: number): string {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return 'very strong';
    if (abs >= 0.6) return 'strong';
    if (abs >= 0.4) return 'moderate';
    if (abs >= 0.2) return 'weak';
    return 'very weak';
  }

  private generateCorrelationInsights(correlations: any): string[] {
    const insights: string[] = [];

    Object.values(correlations).forEach((corr: any) => {
      if (Math.abs(corr.correlation) >= 0.6) {
        const relationship = corr.correlation > 0 ? 'positive' : 'negative';
        insights.push(`${corr.strength} ${relationship} correlation detected between ${corr.dimensions[0]} and ${corr.dimensions[1]}`);
      }
    });

    return insights;
  }

  private createInsufficientDataResult(): TrendAnalysisResult {
    return {
      trend: 'stable',
      direction: 0,
      confidence: 0,
      rate: 0,
      forecast: [],
      insights: ['Insufficient data for reliable trend analysis. Continue tracking performance to enable trend insights.'],
      breakpoints: []
    };
  }
}

export const trendAnalyzer = new TrendAnalyzer();