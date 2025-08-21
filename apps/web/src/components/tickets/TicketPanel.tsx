import { Ticket, TicketStatus } from '@/types/ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityIndicator, PriorityBadge } from './PriorityIndicator';
import { CustomerInfo } from './CustomerInfo';
import { TechnicalDetails } from './TechnicalDetails';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TicketPanelProps {
  ticket: Ticket;
  onStatusChange?: (status: TicketStatus) => void;
  onAssign?: (userId: string) => void;
  onAddNote?: (note: string) => void;
  className?: string;
  mode?: 'full' | 'summary' | 'compact';
}

export function TicketPanel({ 
  ticket, 
  onStatusChange, 
  onAssign, 
  onAddNote,
  className,
  mode = 'full'
}: TicketPanelProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'customer' | 'technical' | 'history'>('overview');
  const [newNote, setNewNote] = useState('');

  const statusConfig = {
    [TicketStatus.OPEN]: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: '🆕'
    },
    [TicketStatus.IN_PROGRESS]: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      icon: '⚠️'
    },
    [TicketStatus.RESOLVED]: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: '✅'
    },
    [TicketStatus.ESCALATED]: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: '🚨'
    },
    [TicketStatus.CLOSED]: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: '🔒'
    },
  };

  const getStatusActions = () => {
    switch (ticket.status) {
      case TicketStatus.OPEN:
        return [
          { label: 'Start Working', status: TicketStatus.IN_PROGRESS, variant: 'primary' as const },
          { label: 'Escalate', status: TicketStatus.ESCALATED, variant: 'outline' as const },
        ];
      case TicketStatus.IN_PROGRESS:
        return [
          { label: 'Mark Resolved', status: TicketStatus.RESOLVED, variant: 'primary' as const },
          { label: 'Escalate', status: TicketStatus.ESCALATED, variant: 'outline' as const },
        ];
      case TicketStatus.RESOLVED:
        return [
          { label: 'Close Ticket', status: TicketStatus.CLOSED, variant: 'primary' as const },
          { label: 'Reopen', status: TicketStatus.IN_PROGRESS, variant: 'outline' as const },
        ];
      case TicketStatus.ESCALATED:
        return [
          { label: 'Take Over', status: TicketStatus.IN_PROGRESS, variant: 'primary' as const },
          { label: 'Mark Resolved', status: TicketStatus.RESOLVED, variant: 'secondary' as const },
        ];
      default:
        return [];
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getSLAStatus = () => {
    const { slaTracking } = ticket;
    if (slaTracking.slaBreached) {
      return {
        status: 'breached',
        message: slaTracking.breachReason || 'SLA breached',
        color: 'text-red-600'
      };
    }

    const now = new Date();
    const timeSinceCreated = now.getTime() - ticket.createdAt.getTime();
    const hoursElapsed = timeSinceCreated / (1000 * 60 * 60);

    if (ticket.status === TicketStatus.OPEN) {
      const responseTimeLeft = slaTracking.responseTimeMinutes - (timeSinceCreated / (1000 * 60));
      if (responseTimeLeft <= 0) {
        return { status: 'overdue', message: 'Response overdue', color: 'text-red-600' };
      } else if (responseTimeLeft <= 30) {
        return { status: 'urgent', message: `Response due in ${Math.round(responseTimeLeft)}m`, color: 'text-yellow-600' };
      }
    }

    if (ticket.status === TicketStatus.IN_PROGRESS) {
      const resolutionTimeLeft = slaTracking.resolutionTimeHours - hoursElapsed;
      if (resolutionTimeLeft <= 0) {
        return { status: 'overdue', message: 'Resolution overdue', color: 'text-red-600' };
      } else if (resolutionTimeLeft <= 2) {
        return { status: 'urgent', message: `Resolution due in ${Math.round(resolutionTimeLeft)}h`, color: 'text-yellow-600' };
      }
    }

    return { status: 'on_track', message: 'On track', color: 'text-green-600' };
  };

  if (mode === 'compact') {
    return (
      <Card className={cn('cursor-pointer hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-500">{ticket.ticketNumber}</span>
                <PriorityBadge priority={ticket.priority} size="sm" />
              </div>
              <h3 className="font-medium text-gray-900 truncate">{ticket.title}</h3>
            </div>
            <div className="flex items-center space-x-3">
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                statusConfig[ticket.status].bg,
                statusConfig[ticket.status].text,
                statusConfig[ticket.status].border
              )}>
                {statusConfig[ticket.status].icon} {ticket.status.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500">{formatTimeAgo(ticket.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const slaStatus = getSLAStatus();
  const statusActions = getStatusActions();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Ticket Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-mono text-lg text-gray-600">{ticket.ticketNumber}</span>
                <PriorityIndicator priority={ticket.priority} />
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                  statusConfig[ticket.status].bg,
                  statusConfig[ticket.status].text,
                  statusConfig[ticket.status].border
                )}>
                  {statusConfig[ticket.status].icon} {ticket.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <CardTitle className="text-xl">{ticket.title}</CardTitle>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>Created {formatTimeAgo(ticket.createdAt)}</span>
                <span>•</span>
                <span className={slaStatus.color}>SLA: {slaStatus.message}</span>
                <span>•</span>
                <span>Category: {ticket.category}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              {statusActions.map((action) => (
                <Button
                  key={action.status}
                  variant={action.variant}
                  size="sm"
                  onClick={() => onStatusChange?.(action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </CardContent>
      </Card>

      {mode === 'full' && (
        <>
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'customer', label: 'Customer' },
              { id: 'technical', label: 'Technical' },
              { id: 'history', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activeSection === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {activeSection === 'overview' && (
              <>
                <div className="lg:col-span-2 space-y-6">
                  {/* SLA Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>SLA Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Response Time SLA</label>
                          <p className="text-sm">{ticket.slaTracking.responseTimeMinutes} minutes</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Resolution Time SLA</label>
                          <p className="text-sm">{ticket.slaTracking.resolutionTimeHours} hours</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Actual Response Time</label>
                          <p className="text-sm">
                            {ticket.slaTracking.actualResponseTime 
                              ? `${ticket.slaTracking.actualResponseTime} minutes`
                              : 'Pending'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <p className={cn('text-sm font-medium', slaStatus.color)}>
                            {slaStatus.message}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Note</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a note about your progress, findings, or next steps..."
                          className="w-full p-3 border border-gray-300 rounded-md resize-none"
                          rows={4}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            disabled={!newNote.trim()}
                            onClick={() => {
                              if (newNote.trim()) {
                                onAddNote?.(newNote);
                                setNewNote('');
                              }
                            }}
                          >
                            Add Note
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <CustomerInfo customer={ticket.customer} />
                </div>
              </>
            )}

            {activeSection === 'customer' && (
              <div className="lg:col-span-3">
                <CustomerInfo customer={ticket.customer} compact={false} />
              </div>
            )}

            {activeSection === 'technical' && (
              <div className="lg:col-span-3">
                <TechnicalDetails 
                  technicalContext={ticket.metadata.customFields?.technicalContext}
                  assets={ticket.metadata.customFields?.assets}
                />
              </div>
            )}

            {activeSection === 'history' && (
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      History tracking coming soon...
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}