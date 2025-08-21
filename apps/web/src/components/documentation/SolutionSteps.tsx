'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SolutionStep {
  id: string;
  stepNumber: number;
  description: string;
  action: string;
  expectedResult: string;
  actualResult?: string;
  verified: boolean;
  timestamp: Date;
  duration?: number; // in seconds
}

interface SolutionStepsProps {
  initialSteps?: SolutionStep[];
  onChange: (steps: SolutionStep[]) => void;
  readOnly?: boolean;
}

export default function SolutionSteps({ initialSteps = [], onChange, readOnly = false }: SolutionStepsProps) {
  const [steps, setSteps] = useState<SolutionStep[]>(initialSteps);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null);

  useEffect(() => {
    onChange(steps);
  }, [steps, onChange]);

  const generateStepId = (): string => {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addStep = (): void => {
    const newStep: SolutionStep = {
      id: generateStepId(),
      stepNumber: steps.length + 1,
      description: '',
      action: '',
      expectedResult: '',
      verified: false,
      timestamp: new Date()
    };

    setSteps(prev => [...prev, newStep]);
  };

  const updateStep = (stepId: string, field: keyof SolutionStep, value: any): void => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ));
  };

  const removeStep = (stepId: string): void => {
    const updatedSteps = steps.filter(step => step.id !== stepId);
    // Renumber remaining steps
    const renumberedSteps = updatedSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }));
    setSteps(renumberedSteps);
  };

  const moveStep = (stepId: string, direction: 'up' | 'down'): void => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const newSteps = [...steps];
    [newSteps[stepIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[stepIndex]];
    
    // Renumber steps
    const renumberedSteps = newSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }));
    
    setSteps(renumberedSteps);
  };

  const startStepTimer = (stepId: string): void => {
    setCurrentStepId(stepId);
    setStepStartTime(new Date());
  };

  const stopStepTimer = (stepId: string): void => {
    if (currentStepId === stepId && stepStartTime) {
      const duration = Math.floor((new Date().getTime() - stepStartTime.getTime()) / 1000);
      updateStep(stepId, 'duration', duration);
      setCurrentStepId(null);
      setStepStartTime(null);
    }
  };

  const verifyStep = (stepId: string, verified: boolean): void => {
    updateStep(stepId, 'verified', verified);
    if (verified && currentStepId === stepId) {
      stopStepTimer(stepId);
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Not tracked';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStepStatus = (step: SolutionStep): { color: string; text: string } => {
    if (currentStepId === step.id) {
      return { color: 'text-blue-600', text: 'In Progress' };
    }
    if (step.verified) {
      return { color: 'text-green-600', text: 'Verified' };
    }
    if (step.description && step.action) {
      return { color: 'text-orange-600', text: 'Pending Verification' };
    }
    return { color: 'text-gray-500', text: 'Draft' };
  };

  const getTotalDuration = (): number => {
    return steps.reduce((total, step) => total + (step.duration || 0), 0);
  };

  const getVerifiedStepsCount = (): number => {
    return steps.filter(step => step.verified).length;
  };

  if (readOnly) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Solution Steps</h3>
            <div className="text-sm text-gray-600">
              {getVerifiedStepsCount()}/{steps.length} steps verified
            </div>
          </div>
          <div className="space-y-4">
            {steps.map((step) => {
              const status = getStepStatus(step);
              return (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-600">Step {step.stepNumber}</span>
                      <span className={`text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Duration: {formatDuration(step.duration)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Description:</span>
                      <p className="text-sm text-gray-600">{step.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Action:</span>
                      <p className="text-sm text-gray-600">{step.action || 'No action specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Expected Result:</span>
                      <p className="text-sm text-gray-600">{step.expectedResult || 'No expected result specified'}</p>
                    </div>
                    {step.actualResult && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Actual Result:</span>
                        <p className="text-sm text-gray-600">{step.actualResult}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {steps.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Resolution Time:</span> {formatDuration(getTotalDuration())}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Solution Steps</h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {getVerifiedStepsCount()}/{steps.length} steps verified
            </div>
            <Button onClick={addStep} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Add Step
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const isInProgress = currentStepId === step.id;
            
            return (
              <div key={step.id} className="border rounded-lg p-4 relative">
                {/* Step Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-600">Step {step.stepNumber}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${status.color} bg-opacity-10`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500">
                      Duration: {formatDuration(step.duration)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0}
                        variant="outline"
                        size="sm"
                        className="p-1"
                      >
                        ↑
                      </Button>
                      <Button
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === steps.length - 1}
                        variant="outline"
                        size="sm"
                        className="p-1"
                      >
                        ↓
                      </Button>
                      <Button
                        onClick={() => removeStep(step.id)}
                        variant="outline"
                        size="sm"
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={step.description}
                      onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm h-16 resize-vertical"
                      placeholder="Describe what this step involves..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Action</label>
                    <textarea
                      value={step.action}
                      onChange={(e) => updateStep(step.id, 'action', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm h-16 resize-vertical"
                      placeholder="Specific action taken or command executed..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Expected Result</label>
                    <textarea
                      value={step.expectedResult}
                      onChange={(e) => updateStep(step.id, 'expectedResult', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm h-12 resize-vertical"
                      placeholder="What should happen when this action is performed..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Actual Result</label>
                    <textarea
                      value={step.actualResult || ''}
                      onChange={(e) => updateStep(step.id, 'actualResult', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm h-12 resize-vertical"
                      placeholder="What actually happened (fill after executing the step)..."
                    />
                  </div>
                </div>

                {/* Step Actions */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {!isInProgress && !step.verified && (
                      <Button
                        onClick={() => startStepTimer(step.id)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Start Step
                      </Button>
                    )}
                    {isInProgress && (
                      <Button
                        onClick={() => stopStepTimer(step.id)}
                        size="sm"
                        variant="outline"
                        className="text-orange-600 hover:text-orange-700"
                      >
                        Stop Timer
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => verifyStep(step.id, !step.verified)}
                      size="sm"
                      className={step.verified 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-gray-400 hover:bg-gray-500"
                      }
                    >
                      {step.verified ? "✓ Verified" : "Mark as Verified"}
                    </Button>
                  </div>
                </div>

                {/* In Progress Indicator */}
                {isInProgress && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {steps.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No solution steps added yet.</p>
            <Button onClick={addStep} className="bg-blue-600 hover:bg-blue-700">
              Add First Step
            </Button>
          </div>
        )}

        {steps.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Steps:</span> {steps.length}
              </div>
              <div>
                <span className="font-medium">Verified Steps:</span> {getVerifiedStepsCount()}
              </div>
              <div>
                <span className="font-medium">Total Time:</span> {formatDuration(getTotalDuration())}
              </div>
              <div>
                <span className="font-medium">Average per Step:</span>{' '}
                {formatDuration(steps.length > 0 ? Math.floor(getTotalDuration() / steps.length) : 0)}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}