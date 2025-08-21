'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface TimeEntry {
  id: string;
  phase: 'investigation' | 'analysis' | 'implementation' | 'testing' | 'documentation' | 'communication';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  description: string;
  category: 'manual' | 'automatic' | 'inferred';
}

interface TimeSession {
  id: string;
  ticketId: string;
  sessionStart: Date;
  sessionEnd?: Date;
  totalDuration: number;
  entries: TimeEntry[];
  breaks: Array<{
    startTime: Date;
    endTime?: Date;
    duration?: number;
    reason?: string;
  }>;
  status: 'active' | 'paused' | 'completed';
  efficiency: number;
}

interface ResolutionMetrics {
  totalResolutionTime: number;
  phaseBreakdown: Record<string, number>;
  efficiency: number;
  interruptions: number;
  pauseTime: number;
  activeWorkTime: number;
  recommendations: string[];
}

interface TimeTrackingProps {
  ticketId: string;
  onTimeUpdate?: (metrics: ResolutionMetrics) => void;
  readOnly?: boolean;
  initialSession?: TimeSession;
}

const phaseOptions = [
  { value: 'investigation', label: 'Investigation', color: 'bg-blue-500', description: 'Initial problem analysis and information gathering' },
  { value: 'analysis', label: 'Analysis', color: 'bg-purple-500', description: 'Deep dive analysis and root cause identification' },
  { value: 'implementation', label: 'Implementation', color: 'bg-green-500', description: 'Applying solution and making changes' },
  { value: 'testing', label: 'Testing', color: 'bg-orange-500', description: 'Testing solution and verifying results' },
  { value: 'documentation', label: 'Documentation', color: 'bg-gray-500', description: 'Recording solution steps and outcomes' },
  { value: 'communication', label: 'Communication', color: 'bg-pink-500', description: 'Customer communication and coordination' }
];

export default function TimeTracking({
  ticketId,
  onTimeUpdate,
  readOnly = false,
  initialSession
}: TimeTrackingProps) {
  const [session, setSession] = useState<TimeSession | null>(initialSession || null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedPhase, setSelectedPhase] = useState<TimeEntry['phase']>('investigation');
  const [phaseDescription, setPhaseDescription] = useState('');
  const [breakReason, setBreakReason] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Update current time every second when session is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (session?.status === 'active' && !readOnly) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [session?.status, readOnly]);

  // Auto-detect phase changes (simplified logic)
  useEffect(() => {
    if (session && session.status === 'active') {
      const currentEntry = getCurrentEntry();
      if (currentEntry && currentEntry.duration && currentEntry.duration > 1800) { // 30 minutes
        // Suggest phase change after 30 minutes
        console.log('Consider changing phase - current phase has been active for 30+ minutes');
      }
    }
  }, [currentTime, session]);

  const getCurrentEntry = (): TimeEntry | null => {
    if (!session) return null;
    return session.entries.find(e => !e.endTime) || null;
  };

  const getCurrentDuration = (): number => {
    const currentEntry = getCurrentEntry();
    if (!currentEntry) return 0;
    return Math.floor((currentTime.getTime() - currentEntry.startTime.getTime()) / 1000);
  };

  const getTotalSessionDuration = (): number => {
    if (!session) return 0;
    if (session.status === 'completed') return session.totalDuration;
    return Math.floor((currentTime.getTime() - session.sessionStart.getTime()) / 1000);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startSession = async (): Promise<void> => {
    try {
      // In a real app, this would call the API
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newSession: TimeSession = {
        id: sessionId,
        ticketId,
        sessionStart: new Date(),
        totalDuration: 0,
        entries: [{
          id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          phase: 'investigation',
          startTime: new Date(),
          description: 'Session started - initial investigation phase',
          category: 'automatic'
        }],
        breaks: [],
        status: 'active',
        efficiency: 100
      };

      setSession(newSession);
      setIsTimerRunning(true);
      console.log('Started time tracking session for ticket:', ticketId);
    } catch (error) {
      console.error('Failed to start time tracking session:', error);
    }
  };

  const endSession = async (): Promise<void> => {
    if (!session) return;

    try {
      const currentEntry = getCurrentEntry();
      if (currentEntry) {
        currentEntry.endTime = new Date();
        currentEntry.duration = Math.floor((currentEntry.endTime.getTime() - currentEntry.startTime.getTime()) / 1000);
      }

      const updatedSession = {
        ...session,
        sessionEnd: new Date(),
        totalDuration: getTotalSessionDuration(),
        status: 'completed' as const,
        entries: session.entries.map(entry => 
          entry.id === currentEntry?.id 
            ? { ...entry, endTime: currentEntry.endTime, duration: currentEntry.duration }
            : entry
        )
      };

      setSession(updatedSession);
      setIsTimerRunning(false);

      // Calculate and send metrics
      const metrics = calculateMetrics(updatedSession);
      onTimeUpdate?.(metrics);

      console.log('Ended time tracking session');
    } catch (error) {
      console.error('Failed to end time tracking session:', error);
    }
  };

  const pauseSession = async (): Promise<void> => {
    if (!session) return;

    try {
      const currentEntry = getCurrentEntry();
      if (currentEntry) {
        currentEntry.endTime = new Date();
        currentEntry.duration = Math.floor((currentEntry.endTime.getTime() - currentEntry.startTime.getTime()) / 1000);
      }

      const updatedSession = {
        ...session,
        status: 'paused' as const,
        breaks: [
          ...session.breaks,
          {
            startTime: new Date(),
            reason: breakReason || 'Break'
          }
        ]
      };

      setSession(updatedSession);
      setIsTimerRunning(false);
      setBreakReason('');
      console.log('Paused time tracking session');
    } catch (error) {
      console.error('Failed to pause time tracking session:', error);
    }
  };

  const resumeSession = async (): Promise<void> => {
    if (!session) return;

    try {
      const activeBreak = session.breaks.find(b => !b.endTime);
      if (activeBreak) {
        activeBreak.endTime = new Date();
        activeBreak.duration = Math.floor((activeBreak.endTime.getTime() - activeBreak.startTime.getTime()) / 1000);
      }

      const newEntry: TimeEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phase: selectedPhase,
        startTime: new Date(),
        description: phaseDescription || `Resumed session - continuing ${selectedPhase} phase`,
        category: 'manual'
      };

      const updatedSession = {
        ...session,
        status: 'active' as const,
        entries: [...session.entries, newEntry]
      };

      setSession(updatedSession);
      setIsTimerRunning(true);
      setPhaseDescription('');
      console.log('Resumed time tracking session');
    } catch (error) {
      console.error('Failed to resume time tracking session:', error);
    }
  };

  const changePhase = async (newPhase: TimeEntry['phase']): Promise<void> => {
    if (!session || session.status !== 'active') return;

    try {
      const currentEntry = getCurrentEntry();
      if (currentEntry) {
        currentEntry.endTime = new Date();
        currentEntry.duration = Math.floor((currentEntry.endTime.getTime() - currentEntry.startTime.getTime()) / 1000);
      }

      const newEntry: TimeEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phase: newPhase,
        startTime: new Date(),
        description: phaseDescription || `Switched to ${newPhase} phase`,
        category: 'manual'
      };

      const updatedSession = {
        ...session,
        entries: [...session.entries, newEntry]
      };

      setSession(updatedSession);
      setSelectedPhase(newPhase);
      setPhaseDescription('');
      console.log('Changed phase to:', newPhase);
    } catch (error) {
      console.error('Failed to change phase:', error);
    }
  };

  const calculateMetrics = (sessionData: TimeSession): ResolutionMetrics => {
    const phaseBreakdown: Record<string, number> = {};
    sessionData.entries.forEach(entry => {
      if (entry.duration) {
        phaseBreakdown[entry.phase] = (phaseBreakdown[entry.phase] || 0) + entry.duration;
      }
    });

    const totalBreakTime = sessionData.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
    const activeWorkTime = sessionData.totalDuration - totalBreakTime;
    const efficiency = sessionData.totalDuration > 0 ? (activeWorkTime / sessionData.totalDuration) * 100 : 0;

    const recommendations: string[] = [];
    if (efficiency < 70) {
      recommendations.push('Consider reducing break time or interruptions to improve efficiency');
    }
    if (phaseBreakdown.investigation > sessionData.totalDuration * 0.4) {
      recommendations.push('Investigation phase took longer than typical - consider structured approach');
    }
    if (!phaseBreakdown.documentation || phaseBreakdown.documentation < 300) {
      recommendations.push('Ensure adequate time is allocated for documentation');
    }

    return {
      totalResolutionTime: sessionData.totalDuration,
      phaseBreakdown,
      efficiency,
      interruptions: sessionData.breaks.length,
      pauseTime: totalBreakTime,
      activeWorkTime,
      recommendations
    };
  };

  const getPhaseColor = (phase: string): string => {
    return phaseOptions.find(p => p.value === phase)?.color || 'bg-gray-500';
  };

  const getPhaseStats = (): Record<string, number> => {
    const stats: Record<string, number> = {};
    
    session?.entries.forEach(entry => {
      const duration = entry.duration || (entry.endTime ? 
        Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000) : 
        getCurrentDuration());
      
      stats[entry.phase] = (stats[entry.phase] || 0) + duration;
    });

    return stats;
  };

  if (readOnly && session) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Time Tracking Summary</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowMetrics(!showMetrics)}
                variant="outline"
                size="sm"
              >
                {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatDuration(session.totalDuration)}</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{session.entries.length}</div>
              <div className="text-sm text-gray-600">Phases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{session.breaks.length}</div>
              <div className="text-sm text-gray-600">Breaks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{session.efficiency.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Efficiency</div>
            </div>
          </div>

          {showMetrics && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Phase Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(getPhaseStats()).map(([phase, duration]) => (
                    <div key={phase} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getPhaseColor(phase)}`}></div>
                      <span className="capitalize font-medium">{phase}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getPhaseColor(phase)}`}
                          style={{ width: `${(duration / session.totalDuration) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 min-w-12">{formatDuration(duration)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Timeline</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {session.entries.map((entry, index) => (
                    <div key={entry.id} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">{index + 1}.</span>
                      <div className={`w-2 h-2 rounded-full ${getPhaseColor(entry.phase)}`}></div>
                      <span className="capitalize">{entry.phase}</span>
                      <span className="text-gray-600">({formatDuration(entry.duration || 0)})</span>
                      <span className="text-gray-500 flex-1 truncate">{entry.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Time Tracking</h3>
            <div className="flex items-center gap-2">
              {session && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    session.status === 'active' ? 'bg-green-500 animate-pulse' :
                    session.status === 'paused' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm capitalize">{session.status}</span>
                </div>
              )}
            </div>
          </div>

          {!session ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="text-6xl mb-2">⏱️</div>
                <h4 className="text-lg font-medium mb-2">Start Time Tracking</h4>
                <p className="text-gray-600 mb-6">
                  Track time spent on different phases of ticket resolution to improve performance and documentation.
                </p>
              </div>
              <Button onClick={startSession} className="bg-blue-600 hover:bg-blue-700">
                Start Tracking
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Session Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatDuration(getTotalSessionDuration())}</div>
                  <div className="text-sm text-gray-600">Total Session</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatDuration(getCurrentDuration())}</div>
                  <div className="text-sm text-gray-600">Current Phase</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{session.breaks.length}</div>
                  <div className="text-sm text-gray-600">Breaks Taken</div>
                </div>
              </div>

              {/* Current Phase Display */}
              {session.status === 'active' && (
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getPhaseColor(getCurrentEntry()?.phase || 'investigation')}`}></div>
                    <span className="font-medium capitalize">
                      {getCurrentEntry()?.phase || 'Investigation'} Phase
                    </span>
                    <span className="text-sm text-gray-600">
                      - {formatDuration(getCurrentDuration())}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{getCurrentEntry()?.description}</p>
                </div>
              )}

              {/* Phase Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Change Phase</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {phaseOptions.map((phase) => (
                      <Button
                        key={phase.value}
                        onClick={() => changePhase(phase.value as TimeEntry['phase'])}
                        variant={getCurrentEntry()?.phase === phase.value ? "default" : "outline"}
                        size="sm"
                        disabled={session.status !== 'active'}
                        className="flex items-center gap-2"
                      >
                        <div className={`w-2 h-2 rounded-full ${phase.color}`}></div>
                        {phase.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phase Description (Optional)</label>
                  <input
                    type="text"
                    value={phaseDescription}
                    onChange={(e) => setPhaseDescription(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Describe what you're working on..."
                    disabled={session.status !== 'active'}
                  />
                </div>

                {/* Session Controls */}
                <div className="flex gap-2">
                  {session.status === 'active' && (
                    <>
                      <Button
                        onClick={pauseSession}
                        variant="outline"
                        size="sm"
                        className="text-yellow-600"
                      >
                        Pause
                      </Button>
                      <Button
                        onClick={endSession}
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                      >
                        End Session
                      </Button>
                    </>
                  )}
                  
                  {session.status === 'paused' && (
                    <>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={breakReason}
                          onChange={(e) => setBreakReason(e.target.value)}
                          className="w-full p-2 border rounded-md text-sm"
                          placeholder="Break reason (optional)..."
                        />
                      </div>
                      <Button
                        onClick={resumeSession}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Resume
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Phase Progress */}
              <div>
                <h4 className="font-medium mb-3">Phase Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(getPhaseStats()).map(([phase, duration]) => (
                    <div key={phase} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getPhaseColor(phase)}`}></div>
                      <span className="capitalize font-medium min-w-24">{phase}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getPhaseColor(phase)}`}
                          style={{ width: `${Math.min((duration / Math.max(getTotalSessionDuration(), 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 min-w-16">{formatDuration(duration)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Timeline */}
              {session.entries.length > 1 && (
                <div>
                  <h4 className="font-medium mb-3">Session Timeline</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {session.entries.map((entry, index) => (
                      <div key={entry.id} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500 min-w-6">{index + 1}.</span>
                        <div className={`w-2 h-2 rounded-full ${getPhaseColor(entry.phase)}`}></div>
                        <span className="capitalize min-w-20">{entry.phase}</span>
                        <span className="text-gray-600 min-w-16">({formatDuration(entry.duration || getCurrentDuration())})</span>
                        <span className="text-gray-500 flex-1 truncate">{entry.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}