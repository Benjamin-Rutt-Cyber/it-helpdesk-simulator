import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Settings,
  Layout,
  Eye,
  EyeOff,
  Palette,
  Monitor,
  Smartphone,
  Grid3X3,
  List,
  BarChart3,
  PieChart,
  LineChart,
  X,
  Save,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';
import { DashboardCustomization } from '../../types/dashboard';

interface CustomizationPanelProps {
  customization: DashboardCustomization;
  onCustomizationChange: (customization: DashboardCustomization) => void;
  onClose: () => void;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  customization,
  onCustomizationChange,
  onClose
}) => {
  const [localCustomization, setLocalCustomization] = useState<DashboardCustomization>(customization);
  const [hasChanges, setHasChanges] = useState(false);

  const updateCustomization = (updates: Partial<DashboardCustomization>) => {
    const newCustomization = { ...localCustomization, ...updates };
    setLocalCustomization(newCustomization);
    setHasChanges(true);
  };

  const updateWidgets = (widget: keyof DashboardCustomization['widgets'], visible: boolean) => {
    updateCustomization({
      widgets: {
        ...localCustomization.widgets,
        [widget]: visible
      }
    });
  };

  const updateChartTypes = (chart: keyof DashboardCustomization['chartTypes'], type: any) => {
    updateCustomization({
      chartTypes: {
        ...localCustomization.chartTypes,
        [chart]: type
      }
    });
  };

  const handleSave = async () => {
    try {
      onCustomizationChange(localCustomization);
      // Mock API call to save customization
      await fetch('/api/dashboard/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localCustomization)
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save customization:', error);
    }
  };

  const handleReset = () => {
    const defaultCustomization: DashboardCustomization = {
      layout: 'standard',
      widgets: {
        overview: true,
        progress: true,
        achievements: true,
        insights: true,
        goals: true
      },
      theme: 'professional',
      chartTypes: {
        progress: 'bar',
        skills: 'radar',
        achievements: 'grid'
      }
    };
    setLocalCustomization(defaultCustomization);
    setHasChanges(true);
  };

  const exportCustomization = () => {
    const dataStr = JSON.stringify(localCustomization, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-customization.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCustomization = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setLocalCustomization(imported);
          setHasChanges(true);
        } catch (error) {
          console.error('Failed to import customization:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Dashboard Customization
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Layout Options */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Layout className="h-4 w-4 mr-2" />
            Layout Style
          </h3>
          <div className="space-y-2">
            {[
              { id: 'standard', label: 'Standard', description: 'Balanced layout with all sections' },
              { id: 'compact', label: 'Compact', description: 'Dense layout for smaller screens' },
              { id: 'detailed', label: 'Detailed', description: 'Expanded layout with extra information' }
            ].map((layout) => (
              <div
                key={layout.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  localCustomization.layout === layout.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateCustomization({ layout: layout.id as any })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{layout.label}</p>
                    <p className="text-xs text-gray-500">{layout.description}</p>
                  </div>
                  {localCustomization.layout === layout.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget Visibility */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Widget Visibility
          </h3>
          <div className="space-y-2">
            {Object.entries(localCustomization.widgets).map(([widget, visible]) => (
              <div key={widget} className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium text-gray-700 capitalize">
                  {widget.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateWidgets(widget as any, !visible)}
                  className={visible ? 'text-green-600' : 'text-gray-400'}
                >
                  {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Theme
          </h3>
          <div className="space-y-2">
            {[
              { id: 'professional', label: 'Professional', color: 'bg-blue-500' },
              { id: 'modern', label: 'Modern', color: 'bg-purple-500' },
              { id: 'minimal', label: 'Minimal', color: 'bg-gray-500' }
            ].map((theme) => (
              <div
                key={theme.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  localCustomization.theme === theme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateCustomization({ theme: theme.id as any })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${theme.color} mr-3`} />
                    <span className="font-medium text-gray-900">{theme.label}</span>
                  </div>
                  {localCustomization.theme === theme.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Types */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Chart Types
          </h3>
          <div className="space-y-4">
            {/* Progress Charts */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Progress Visualization</p>
              <div className="flex space-x-2">
                {[
                  { id: 'bar', icon: BarChart3, label: 'Bar' },
                  { id: 'line', icon: LineChart, label: 'Line' },
                  { id: 'circular', icon: PieChart, label: 'Circular' }
                ].map(({ id, icon: Icon, label }) => (
                  <Button
                    key={id}
                    variant={localCustomization.chartTypes.progress === id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateChartTypes('progress', id)}
                    className="flex flex-col items-center p-2 h-auto"
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Skills Charts */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Skills Assessment</p>
              <div className="flex space-x-2">
                {[
                  { id: 'radar', icon: PieChart, label: 'Radar' },
                  { id: 'bar', icon: BarChart3, label: 'Bar' },
                  { id: 'horizontal', icon: List, label: 'Horizontal' }
                ].map(({ id, icon: Icon, label }) => (
                  <Button
                    key={id}
                    variant={localCustomization.chartTypes.skills === id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateChartTypes('skills', id)}
                    className="flex flex-col items-center p-2 h-auto"
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Achievement Layout */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Achievement Layout</p>
              <div className="flex space-x-2">
                {[
                  { id: 'grid', icon: Grid3X3, label: 'Grid' },
                  { id: 'list', icon: List, label: 'List' },
                  { id: 'timeline', icon: LineChart, label: 'Timeline' }
                ].map(({ id, icon: Icon, label }) => (
                  <Button
                    key={id}
                    variant={localCustomization.chartTypes.achievements === id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateChartTypes('achievements', id)}
                    className="flex flex-col items-center p-2 h-auto"
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Device Optimization */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Monitor className="h-4 w-4 mr-2" />
            Device Optimization
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="flex items-center justify-center">
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </Button>
            <Button variant="outline" size="sm" className="flex items-center justify-center">
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Preview how your dashboard will look on different devices
          </p>
        </div>

        {/* Export/Import */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Backup & Restore</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCustomization}
              className="w-full flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importCustomization}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 flex items-center justify-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center justify-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Changes Indicator */}
        {hasChanges && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              Unsaved changes
            </Badge>
          </div>
        )}

        {/* Preview Note */}
        <div className="text-center text-xs text-gray-500 pt-2 border-t">
          Changes are applied immediately for preview.
          <br />
          Click "Save Changes" to persist your customization.
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomizationPanel;