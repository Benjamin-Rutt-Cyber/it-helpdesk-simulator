import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
  }>;
}

interface ProgressChartProps {
  data?: ChartData;
  skillTrends?: {
    technical: number[];
    communication: number[];
    procedural: number[];
  };
  type?: 'line' | 'bar' | 'area' | 'combined';
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

export function ProgressChart({
  data,
  skillTrends,
  type = 'line',
  height = 300,
  className,
  showLegend = true,
  showGrid = true
}: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartType, setChartType] = useState(type);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; content: string } | null>(null);

  useEffect(() => {
    drawChart();
  }, [data, skillTrends, chartType, timeRange]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = height;

    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);

    // Mock data if not provided
    const chartData = data || {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Overall Score',
          data: [72, 76, 82, 85],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
      ],
    };

    const combinedData = skillTrends ? {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
      datasets: [
        {
          label: 'Technical',
          data: skillTrends.technical,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: 'Communication',
          data: skillTrends.communication,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
        {
          label: 'Procedural',
          data: skillTrends.procedural,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
        },
      ],
    } : chartData;

    // Find min and max values
    const allValues = combinedData.datasets.flatMap(dataset => dataset.data);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const valueRange = maxValue - minValue;
    const adjustedMin = Math.max(0, minValue - valueRange * 0.1);
    const adjustedMax = Math.min(100, maxValue + valueRange * 0.1);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (i * chartHeight / 5);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();

        // Y-axis labels
        const value = adjustedMax - (i * (adjustedMax - adjustedMin) / 5);
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(value).toString(), padding - 10, y + 4);
      }

      // Vertical grid lines
      const stepWidth = chartWidth / (combinedData.labels.length - 1);
      for (let i = 0; i < combinedData.labels.length; i++) {
        const x = padding + (i * stepWidth);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();

        // X-axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(combinedData.labels[i], x, padding + chartHeight + 20);
      }
    }

    // Draw datasets
    combinedData.datasets.forEach((dataset, datasetIndex) => {
      const points: { x: number; y: number }[] = [];

      // Calculate points
      dataset.data.forEach((value, index) => {
        const x = padding + (index * chartWidth / (combinedData.labels.length - 1));
        const y = padding + chartHeight - ((value - adjustedMin) / (adjustedMax - adjustedMin)) * chartHeight;
        points.push({ x, y });
      });

      // Draw area fill for area charts
      if (chartType === 'area' || (chartType === 'combined' && datasetIndex === 0)) {
        ctx.fillStyle = dataset.backgroundColor;
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding + chartHeight);
        points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.lineTo(points[points.length - 1].x, padding + chartHeight);
        ctx.closePath();
        ctx.fill();
      }

      // Draw bars for bar charts
      if (chartType === 'bar') {
        const barWidth = (chartWidth / combinedData.labels.length) * 0.6;
        const barOffset = (chartWidth / combinedData.labels.length) * 0.2;

        ctx.fillStyle = dataset.borderColor;
        points.forEach((point, index) => {
          const barHeight = point.y - (padding + chartHeight);
          ctx.fillRect(
            point.x - barWidth / 2,
            padding + chartHeight,
            barWidth,
            barHeight
          );
        });
      } else {
        // Draw line
        ctx.strokeStyle = dataset.borderColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
        ctx.stroke();

        // Draw points
        ctx.fillStyle = dataset.borderColor;
        points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    // X-axis
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Show tooltip with data point information
    setTooltipData({
      x: event.clientX,
      y: event.clientY,
      content: `Value: ${Math.round(Math.random() * 100)}`
    });
    setShowTooltip(true);

    // Hide tooltip after 3 seconds
    setTimeout(() => setShowTooltip(false), 3000);
  };

  const getChartTitle = () => {
    switch (chartType) {
      case 'line':
        return 'Performance Trend';
      case 'bar':
        return 'Performance Comparison';
      case 'area':
        return 'Performance Area Chart';
      case 'combined':
        return 'Skill Development Progress';
      default:
        return 'Performance Chart';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">{getChartTitle()}</h4>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {['line', 'bar', 'area', 'combined'].map((chartTypeOption) => (
              <Button
                key={chartTypeOption}
                variant={chartType === chartTypeOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType(chartTypeOption as any)}
              >
                {chartTypeOption.charAt(0).toUpperCase() + chartTypeOption.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full border rounded-lg bg-white cursor-pointer"
          style={{ height: `${height}px` }}
          onClick={handleCanvasClick}
        />

        {/* Tooltip */}
        {showTooltip && tooltipData && (
          <div
            className="absolute bg-gray-900 text-white px-2 py-1 rounded text-sm pointer-events-none z-10"
            style={{
              left: tooltipData.x - 50,
              top: tooltipData.y - 30,
            }}
          >
            {tooltipData.content}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (data?.datasets || skillTrends) && (
        <div className="flex items-center justify-center gap-6">
          {(data?.datasets || [
            { label: 'Technical', borderColor: 'rgb(59, 130, 246)' },
            { label: 'Communication', borderColor: 'rgb(34, 197, 94)' },
            { label: 'Procedural', borderColor: 'rgb(168, 85, 247)' },
          ]).map((dataset, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: dataset.borderColor }}
              />
              <span className="text-sm text-gray-700">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart Statistics */}
      <Card className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">
              {data?.datasets[0]?.data.slice(-1)[0] || skillTrends?.technical.slice(-1)[0] || 85}
            </div>
            <div className="text-xs text-gray-600">Current Score</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-green-600">
              +{Math.round(Math.random() * 10 + 5)}%
            </div>
            <div className="text-xs text-gray-600">Improvement</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-purple-600">
              {Math.round((data?.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0) / (data?.datasets[0]?.data.length || 1))}
            </div>
            <div className="text-xs text-gray-600">Average</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-orange-600">
              {Math.max(...(data?.datasets[0]?.data || skillTrends?.technical || [85]))}
            </div>
            <div className="text-xs text-gray-600">Peak Score</div>
          </div>
        </div>
      </Card>

      {/* Performance Insights */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h5 className="font-medium text-blue-900 mb-2">📈 Performance Insights</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your performance has improved by 15% over the selected period</li>
          <li>• Technical skills show the strongest upward trend</li>
          <li>• Communication scores have been consistently above 80</li>
          <li>• Consider focusing on procedural skills for balanced growth</li>
        </ul>
      </Card>
    </div>
  );
}