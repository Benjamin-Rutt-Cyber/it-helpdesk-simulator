/**
 * XP Transparency Panel - Detailed explanation of XP calculations and performance
 */

import React, { useState, useEffect } from 'react';

interface TransparencyReport {
  id: string;
  userId: string;
  activityId: string;
  timestamp: Date;
  calculationBreakdown: any;
  performanceExplanation: any;
  bonusExplanation: any;
  comparativeAnalysis: any;
  improvementSuggestions: any[];
  fairnessMetrics: any;
}

interface XPTransparencyPanelProps {
  reportId: string;
  reportData?: TransparencyReport;
  onClose?: () => void;
  compact?: boolean;
}

export const XPTransparencyPanel: React.FC<XPTransparencyPanelProps> = ({
  reportId,
  reportData,
  onClose,
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState<'calculation' | 'performance' | 'bonuses' | 'comparison' | 'improvement'>('calculation');
  const [report, setReport] = useState<TransparencyReport | null>(reportData || null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(!reportData);

  useEffect(() => {
    if (!reportData && reportId) {
      fetchTransparencyReport();
    }
  }, [reportId, reportData]);

  const fetchTransparencyReport = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual API
      const response = await fetch(`/api/transparency/reports/${reportId}`);
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch transparency report:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStepExpansion = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const renderCalculationTab = () => {
    if (!report?.calculationBreakdown) return null;

    return (
      <div className="calculation-breakdown">
        <div className="breakdown-summary">
          <h3>Calculation Summary</h3>
          <div className="formula">
            <span className="formula-text">{report.calculationBreakdown.formulaUsed}</span>
          </div>
          <div className="final-result">
            <span className="result-label">Total XP Earned:</span>
            <span className="result-value">{report.calculationBreakdown.outputValue}</span>
          </div>
        </div>

        <div className="calculation-steps">
          <h4>Detailed Steps</h4>
          {report.calculationBreakdown.steps.map((step: any, index: number) => (
            <div 
              key={step.stepNumber} 
              className={`calculation-step ${expandedSteps.has(step.stepNumber) ? 'expanded' : ''}`}
            >
              <div 
                className="step-header"
                onClick={() => toggleStepExpansion(step.stepNumber)}
              >
                <div className="step-number">{step.stepNumber}</div>
                <div className="step-info">
                  <div className="step-description">{step.description}</div>
                  <div className="step-calculation">{step.calculation}</div>
                </div>
                <div className="step-result">{step.output}</div>
                <div className="expand-icon">
                  {expandedSteps.has(step.stepNumber) ? '▼' : '▶'}
                </div>
              </div>
              
              {expandedSteps.has(step.stepNumber) && (
                <div className="step-details">
                  <div className="step-reasoning">
                    <strong>Why this step:</strong> {step.reasoning}
                  </div>
                  <div className="step-inputs">
                    <strong>Input values:</strong>
                    <ul>
                      {Object.entries(step.input).map(([key, value]) => (
                        <li key={key}>
                          <span className="input-key">{key}:</span>
                          <span className="input-value">{String(value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="confidence-indicator">
          <div className="confidence-label">Calculation Confidence:</div>
          <div className="confidence-bar">
            <div 
              className="confidence-fill"
              style={{ width: `${(report.calculationBreakdown.confidence || 0.95) * 100}%` }}
            />
          </div>
          <div className="confidence-text">
            {Math.round((report.calculationBreakdown.confidence || 0.95) * 100)}% confident
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    if (!report?.performanceExplanation) return null;

    return (
      <div className="performance-explanation">
        <div className="performance-overview">
          <div className="overall-score">
            <div className="score-value">{report.performanceExplanation.overallScore}%</div>
            <div className="score-tier">{report.performanceExplanation.tier}</div>
            <div className="score-interpretation">
              {report.performanceExplanation.scoreInterpretation}
            </div>
          </div>
        </div>

        <div className="metrics-breakdown">
          <h4>Performance Metrics Breakdown</h4>
          {report.performanceExplanation.breakdown.map((metric: any, index: number) => (
            <div key={index} className="metric-item">
              <div className="metric-header">
                <div className="metric-name">{metric.metric}</div>
                <div className="metric-scores">
                  <span className="raw-score">{metric.rawScore}</span>
                  <span className="weight">×{metric.weight.toFixed(2)}</span>
                  <span className="weighted-score">= {metric.weightedScore.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="metric-details">
                <div className="metric-bar">
                  <div 
                    className="metric-fill"
                    style={{ width: `${metric.rawScore}%` }}
                  />
                  <div className="metric-contribution">
                    {metric.contribution.toFixed(1)}% of total
                  </div>
                </div>
                
                <div className="metric-interpretation">
                  {metric.interpretation}
                </div>
                
                <div className="benchmark-comparison">
                  <span className="benchmark-text">
                    {metric.benchmarkComparison.description}
                  </span>
                  <span className="percentile">
                    {metric.benchmarkComparison.percentile}th percentile
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="weighting-rationale">
          <h4>Why These Weights?</h4>
          <div className="rationale-content">
            <div className="configuration-used">
              <strong>Configuration:</strong> {report.performanceExplanation.weightingRationale.configurationUsed}
            </div>
            <div className="weight-reasons">
              <strong>Reasons:</strong>
              <ul>
                {report.performanceExplanation.weightingRationale.reasonsForWeights.map((reason: string, index: number) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
            {report.performanceExplanation.weightingRationale.contextualAdjustments.length > 0 && (
              <div className="contextual-adjustments">
                <strong>Contextual Adjustments:</strong>
                <ul>
                  {report.performanceExplanation.weightingRationale.contextualAdjustments.map((adjustment: string, index: number) => (
                    <li key={index}>{adjustment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBonusesTab = () => {
    if (!report?.bonusExplanation) return null;

    return (
      <div className="bonus-explanation">
        <div className="bonus-summary">
          <h3>Bonus XP Summary</h3>
          <div className="total-bonus">
            <span className="bonus-amount">+{report.bonusExplanation.totalBonus}</span>
            <span className="bonus-label">Bonus XP</span>
          </div>
        </div>

        {report.bonusExplanation.individualBonuses.length > 0 && (
          <div className="earned-bonuses">
            <h4>Bonuses Earned</h4>
            {report.bonusExplanation.individualBonuses.map((bonus: any, index: number) => (
              <div key={index} className={`bonus-item earned ${bonus.rarity}`}>
                <div className="bonus-header">
                  <div className="bonus-name">{bonus.bonusName}</div>
                  <div className="bonus-points">+{bonus.points} XP</div>
                  <div className={`rarity-badge ${bonus.rarity}`}>
                    {bonus.rarity}
                  </div>
                </div>
                <div className="bonus-reason">{bonus.whyEarned}</div>
                <div className="bonus-criteria">
                  <strong>Criteria met:</strong>
                  <ul>
                    {bonus.criteria.map((criterion: string, idx: number) => (
                      <li key={idx} className="criterion-met">✓ {criterion}</li>
                    ))}
                  </ul>
                </div>
                <div className="bonus-impact">{bonus.impact}</div>
              </div>
            ))}
          </div>
        )}

        {report.bonusExplanation.missedOpportunities.length > 0 && (
          <div className="missed-opportunities">
            <h4>Missed Opportunities</h4>
            <div className="missed-intro">
              You could have earned additional XP with these bonuses:
            </div>
            {report.bonusExplanation.missedOpportunities.map((missed: any, index: number) => (
              <div key={index} className={`bonus-item missed ${missed.difficulty}`}>
                <div className="bonus-header">
                  <div className="bonus-name">{missed.bonusName}</div>
                  <div className="bonus-points">+{missed.points} XP</div>
                  <div className={`difficulty-badge ${missed.difficulty}`}>
                    {missed.difficulty}
                  </div>
                </div>
                <div className="what-was-missing">
                  <strong>What was missing:</strong> {missed.whatWasMissing}
                </div>
                <div className="how-to-earn">
                  <strong>How to earn next time:</strong> {missed.howToEarn}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bonus-criteria-reference">
          <h4>Bonus Criteria Reference</h4>
          {report.bonusExplanation.eligibilityCriteria.map((criteria: any, index: number) => (
            <div key={index} className="criteria-item">
              <div className="criteria-name">{criteria.bonusName}</div>
              <div className="criteria-requirements">
                <strong>Requirements:</strong>
                <ul>
                  {criteria.requirements.map((req: string, idx: number) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
              <div className="criteria-tips">
                <strong>Tips:</strong>
                <ul>
                  {criteria.tips.map((tip: string, idx: number) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparisonTab = () => {
    if (!report?.comparativeAnalysis) return null;

    const comparison = report.comparativeAnalysis;

    return (
      <div className="comparative-analysis">
        <div className="comparison-overview">
          <h3>Performance Comparison</h3>
          <div className="comparison-stats">
            <div className="stat-item">
              <div className="stat-label">Your Performance</div>
              <div className="stat-value">{comparison.userPerformance}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Average Performance</div>
              <div className="stat-value">{comparison.averagePerformance}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Your Percentile</div>
              <div className="stat-value">{comparison.percentile}th</div>
            </div>
          </div>
        </div>

        <div className="performance-visualization">
          <div className="comparison-bar">
            <div className="bar-container">
              <div 
                className="your-performance-bar"
                style={{ width: `${comparison.userPerformance}%` }}
              />
              <div 
                className="average-marker"
                style={{ left: `${comparison.averagePerformance}%` }}
              >
                <div className="marker-line" />
                <div className="marker-label">Avg</div>
              </div>
            </div>
            <div className="bar-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="historical-trend">
          <h4>Your Progress Trend</h4>
          <div className="trend-info">
            <div className="trend-direction">
              <span className={`trend-indicator ${comparison.historicalTrend.direction}`}>
                {comparison.historicalTrend.direction === 'improving' ? '📈' : 
                 comparison.historicalTrend.direction === 'declining' ? '📉' : '➡️'}
              </span>
              <span className="trend-text">
                {comparison.historicalTrend.direction} at {comparison.historicalTrend.rate}% per {comparison.historicalTrend.period}
              </span>
            </div>
            <div className="projected-performance">
              <strong>Projected next performance:</strong> {comparison.historicalTrend.projectedPerformance}%
            </div>
          </div>

          {comparison.historicalTrend.milestones.length > 0 && (
            <div className="milestones">
              <h5>Recent Milestones</h5>
              {comparison.historicalTrend.milestones.map((milestone: any, index: number) => (
                <div key={index} className="milestone-item">
                  <div className="milestone-date">
                    {new Date(milestone.date).toLocaleDateString()}
                  </div>
                  <div className="milestone-achievement">{milestone.achievement}</div>
                  <div className="milestone-score">{milestone.score}%</div>
                  <div className="milestone-significance">{milestone.significance}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="peer-comparison">
          <h4>Peer Comparison</h4>
          <div className="peer-stats">
            <div className="peer-stat">
              <div className="peer-label">Same Level Users</div>
              <div className="peer-value">{comparison.peerComparison.sameLevel}%</div>
              <div className="peer-comparison-indicator">
                {comparison.userPerformance > comparison.peerComparison.sameLevel ? '↑' : 
                 comparison.userPerformance < comparison.peerComparison.sameLevel ? '↓' : '='}
              </div>
            </div>
            <div className="peer-stat">
              <div className="peer-label">Same Difficulty</div>
              <div className="peer-value">{comparison.peerComparison.sameDifficulty}%</div>
              <div className="peer-comparison-indicator">
                {comparison.userPerformance > comparison.peerComparison.sameDifficulty ? '↑' : 
                 comparison.userPerformance < comparison.peerComparison.sameDifficulty ? '↓' : '='}
              </div>
            </div>
            <div className="peer-stat">
              <div className="peer-label">Same Activity</div>
              <div className="peer-value">{comparison.peerComparison.sameActivity}%</div>
              <div className="peer-comparison-indicator">
                {comparison.userPerformance > comparison.peerComparison.sameActivity ? '↑' : 
                 comparison.userPerformance < comparison.peerComparison.sameActivity ? '↓' : '='}
              </div>
            </div>
          </div>

          <div className="peer-insights">
            <h5>Insights</h5>
            <ul>
              {comparison.peerComparison.insights.map((insight: string, index: number) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderImprovementTab = () => {
    if (!report?.improvementSuggestions) return null;

    return (
      <div className="improvement-suggestions">
        <div className="suggestions-header">
          <h3>Personalized Improvement Plan</h3>
          <div className="suggestions-intro">
            Based on your performance, here are specific recommendations to help you improve:
          </div>
        </div>

        <div className="suggestions-list">
          {report.improvementSuggestions.map((suggestion: any, index: number) => (
            <div key={index} className={`suggestion-item priority-${suggestion.priority}`}>
              <div className="suggestion-header">
                <div className="suggestion-title">{suggestion.suggestion}</div>
                <div className="suggestion-metadata">
                  <span className={`priority-badge ${suggestion.priority}`}>
                    {suggestion.priority} priority
                  </span>
                  <span className="expected-impact">
                    +{suggestion.expectedImpact} points
                  </span>
                  <span className="time-to-implement">
                    {suggestion.timeToImplement}
                  </span>
                </div>
              </div>

              <div className="suggestion-rationale">
                <strong>Why this helps:</strong> {suggestion.rationale}
              </div>

              <div className="suggestion-examples">
                <strong>How to do it:</strong>
                <ul>
                  {suggestion.examples.map((example: string, idx: number) => (
                    <li key={idx}>{example}</li>
                  ))}
                </ul>
              </div>

              {suggestion.resources.length > 0 && (
                <div className="suggestion-resources">
                  <strong>Resources:</strong>
                  <div className="resources-list">
                    {suggestion.resources.map((resource: any, idx: number) => (
                      <div key={idx} className={`resource-item ${resource.type}`}>
                        <div className="resource-info">
                          <div className="resource-title">{resource.title}</div>
                          <div className="resource-description">{resource.description}</div>
                        </div>
                        <div className="resource-metadata">
                          <span className="resource-type">{resource.type}</span>
                          <span className="resource-time">{resource.estimatedTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="transparency-panel loading">
        <div className="loading-spinner" />
        <div className="loading-text">Loading transparency report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="transparency-panel error">
        <div className="error-message">Failed to load transparency report</div>
      </div>
    );
  }

  return (
    <div className={`transparency-panel ${compact ? 'compact' : ''}`}>
      {onClose && (
        <div className="panel-header">
          <h2>XP & Performance Transparency</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
      )}

      <div className="panel-tabs">
        <button 
          className={`tab-button ${activeTab === 'calculation' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculation')}
        >
          Calculation
        </button>
        <button 
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button 
          className={`tab-button ${activeTab === 'bonuses' ? 'active' : ''}`}
          onClick={() => setActiveTab('bonuses')}
        >
          Bonuses
        </button>
        <button 
          className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Comparison
        </button>
        <button 
          className={`tab-button ${activeTab === 'improvement' ? 'active' : ''}`}
          onClick={() => setActiveTab('improvement')}
        >
          Improvement
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'calculation' && renderCalculationTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'bonuses' && renderBonusesTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
        {activeTab === 'improvement' && renderImprovementTab()}
      </div>

      <style jsx>{`
        .transparency-panel {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          max-width: 900px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .transparency-panel.compact {
          max-width: 600px;
          max-height: 60vh;
        }

        .transparency-panel.loading,
        .transparency-panel.error {
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .panel-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab-button {
          flex: 1;
          padding: 12px 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
        }

        .tab-button:hover {
          color: #374151;
          background: #f3f4f6;
        }

        .tab-button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: white;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        /* Calculation Tab Styles */
        .breakdown-summary {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .breakdown-summary h3 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .formula {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .formula-text {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
          color: #374151;
        }

        .final-result {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-top: 1px solid #e5e7eb;
        }

        .result-label {
          font-weight: 600;
          color: #374151;
        }

        .result-value {
          font-size: 24px;
          font-weight: bold;
          color: #059669;
        }

        .calculation-steps h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .calculation-step {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .calculation-step.expanded {
          border-color: #3b82f6;
        }

        .step-header {
          display: flex;
          align-items: center;
          padding: 16px;
          cursor: pointer;
          background: #fafbfc;
          transition: background-color 0.2s ease;
        }

        .step-header:hover {
          background: #f3f4f6;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 16px;
          flex-shrink: 0;
        }

        .step-info {
          flex: 1;
          min-width: 0;
        }

        .step-description {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .step-calculation {
          font-family: 'Monaco', 'Menlo', monospace;
          color: #6b7280;
          font-size: 14px;
        }

        .step-result {
          font-weight: bold;
          color: #059669;
          margin-right: 16px;
        }

        .expand-icon {
          color: #6b7280;
          font-size: 12px;
        }

        .step-details {
          padding: 0 16px 16px 64px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }

        .step-reasoning {
          margin-bottom: 12px;
          color: #374151;
          line-height: 1.5;
        }

        .step-inputs ul {
          margin: 8px 0 0 0;
          padding-left: 0;
          list-style: none;
        }

        .step-inputs li {
          padding: 4px 0;
          display: flex;
          justify-content: space-between;
        }

        .input-key {
          color: #6b7280;
        }

        .input-value {
          font-weight: 500;
          color: #1f2937;
        }

        .confidence-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
          padding: 16px;
          background: #f0f9ff;
          border-radius: 8px;
        }

        .confidence-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        /* Performance Tab Styles */
        .performance-overview {
          text-align: center;
          margin-bottom: 32px;
        }

        .overall-score {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          padding: 24px;
        }

        .score-value {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .score-tier {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
          opacity: 0.9;
        }

        .score-interpretation {
          font-size: 14px;
          opacity: 0.8;
          line-height: 1.4;
        }

        .metrics-breakdown h4 {
          margin: 0 0 20px 0;
          color: #1f2937;
        }

        .metric-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #fafbfc;
        }

        .metric-name {
          font-weight: 600;
          color: #1f2937;
          text-transform: capitalize;
        }

        .metric-scores {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
        }

        .raw-score {
          color: #374151;
          font-weight: bold;
        }

        .weight {
          color: #6b7280;
        }

        .weighted-score {
          color: #059669;
          font-weight: bold;
        }

        .metric-details {
          padding: 16px;
        }

        .metric-bar {
          position: relative;
          height: 24px;
          background: #f3f4f6;
          border-radius: 12px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
        }

        .metric-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          border-radius: 12px;
          transition: width 0.3s ease;
        }

        .metric-contribution {
          position: absolute;
          right: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }

        .metric-interpretation {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .benchmark-comparison {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .benchmark-text {
          color: #374151;
        }

        .percentile {
          color: #3b82f6;
          font-weight: 600;
        }

        /* Bonus Tab Styles */
        .bonus-summary {
          text-align: center;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .bonus-summary h3 {
          margin: 0 0 16px 0;
          opacity: 0.9;
        }

        .total-bonus {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .bonus-amount {
          font-size: 48px;
          font-weight: bold;
        }

        .bonus-label {
          font-size: 18px;
          opacity: 0.9;
        }

        .earned-bonuses h4,
        .missed-opportunities h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .bonus-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .bonus-item.earned {
          border-left: 4px solid #10b981;
        }

        .bonus-item.missed {
          border-left: 4px solid #f59e0b;
          opacity: 0.8;
        }

        .bonus-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #fafbfc;
        }

        .bonus-name {
          flex: 1;
          font-weight: 600;
          color: #1f2937;
        }

        .bonus-points {
          font-weight: bold;
          color: #059669;
        }

        .rarity-badge,
        .difficulty-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .rarity-badge.common { background: #f3f4f6; color: #6b7280; }
        .rarity-badge.uncommon { background: #dbeafe; color: #3b82f6; }
        .rarity-badge.rare { background: #ecfdf5; color: #059669; }
        .rarity-badge.legendary { background: #fef3c7; color: #d97706; }

        .difficulty-badge.easy { background: #dcfce7; color: #16a34a; }
        .difficulty-badge.medium { background: #fef3c7; color: #ca8a04; }
        .difficulty-badge.hard { background: #fee2e2; color: #dc2626; }

        .bonus-reason,
        .what-was-missing,
        .how-to-earn {
          padding: 8px 16px;
          color: #374151;
          line-height: 1.5;
        }

        .bonus-criteria {
          padding: 8px 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }

        .bonus-criteria ul {
          margin: 8px 0 0 0;
          padding-left: 0;
          list-style: none;
        }

        .criterion-met {
          color: #059669;
          padding: 2px 0;
        }

        /* Improvement Tab Styles */
        .suggestions-header {
          margin-bottom: 24px;
        }

        .suggestions-header h3 {
          margin: 0 0 12px 0;
          color: #1f2937;
        }

        .suggestions-intro {
          color: #6b7280;
          line-height: 1.5;
        }

        .suggestion-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .suggestion-item.priority-high {
          border-left: 4px solid #dc2626;
        }

        .suggestion-item.priority-medium {
          border-left: 4px solid #f59e0b;
        }

        .suggestion-item.priority-low {
          border-left: 4px solid #10b981;
        }

        .suggestion-header {
          padding: 16px;
          background: #fafbfc;
        }

        .suggestion-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .suggestion-metadata {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-badge.high { background: #fee2e2; color: #dc2626; }
        .priority-badge.medium { background: #fef3c7; color: #d97706; }
        .priority-badge.low { background: #dcfce7; color: #16a34a; }

        .expected-impact,
        .time-to-implement {
          font-size: 13px;
          color: #6b7280;
        }

        .suggestion-rationale,
        .suggestion-examples {
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
        }

        .suggestion-examples ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }

        .suggestion-examples li {
          margin-bottom: 4px;
          color: #374151;
        }

        .suggestion-resources {
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }

        .resources-list {
          margin-top: 8px;
        }

        .resource-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .resource-title {
          font-weight: 500;
          color: #1f2937;
        }

        .resource-description {
          font-size: 13px;
          color: #6b7280;
        }

        .resource-metadata {
          display: flex;
          gap: 8px;
        }

        .resource-type,
        .resource-time {
          font-size: 11px;
          color: #6b7280;
          background: white;
          padding: 2px 6px;
          border-radius: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .transparency-panel {
            max-width: 100vw;
            max-height: 100vh;
            border-radius: 0;
          }

          .panel-content {
            padding: 16px;
          }

          .step-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .step-info {
            order: 1;
          }

          .step-result {
            order: 2;
            margin-right: 0;
          }

          .suggestion-metadata {
            flex-direction: column;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
};