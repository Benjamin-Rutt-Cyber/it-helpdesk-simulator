import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '@/types/ticket';
import { TicketPanel } from './TicketPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TicketListProps {
  tickets: Ticket[];
  onTicketSelect?: (ticket: Ticket) => void;
  onStatusChange?: (ticketId: string, status: TicketStatus) => void;
  onFilterChange?: (filters: TicketFilters) => void;
  className?: string;
  mode?: 'list' | 'grid' | 'compact';
}

interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  search?: string;
}

export function TicketList({ 
  tickets, 
  onTicketSelect, 
  onStatusChange,
  onFilterChange,
  className,
  mode = 'list'
}: TicketListProps) {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const updateFilters = (newFilters: Partial<TicketFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(ticket.status)) {
      return false;
    }
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(ticket.priority)) {
      return false;
    }
    if (filters.category && filters.category.length > 0 && !filters.category.includes(ticket.category)) {
      return false;
    }
    if (filters.search && !ticket.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !ticket.description.toLowerCase().includes(filters.search.toLowerCase()) &&
        !ticket.ticketNumber.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getStatusCounts = () => {
    return {
      [TicketStatus.OPEN]: tickets.filter(t => t.status === TicketStatus.OPEN).length,
      [TicketStatus.IN_PROGRESS]: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
      [TicketStatus.RESOLVED]: tickets.filter(t => t.status === TicketStatus.RESOLVED).length,
      [TicketStatus.ESCALATED]: tickets.filter(t => t.status === TicketStatus.ESCALATED).length,
      [TicketStatus.CLOSED]: tickets.filter(t => t.status === TicketStatus.CLOSED).length,
    };
  };

  const statusCounts = getStatusCounts();

  if (selectedTicket) {
    return (
      <div className={className}>
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedTicket(null)}
          >
            ← Back to List
          </Button>
        </div>
        <TicketPanel 
          ticket={selectedTicket}
          onStatusChange={(status) => {
            onStatusChange?.(selectedTicket.id, status);
            // Update the ticket in the list
            const updatedTicket = { ...selectedTicket, status };
            setSelectedTicket(updatedTicket);
          }}
          mode="full"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters and Stats */}
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => updateFilters({ status: undefined })}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              !filters.status ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            All ({tickets.length})
          </button>
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => updateFilters({ status: [status as TicketStatus] })}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                filters.status?.includes(status as TicketStatus)
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {status.replace('_', ' ')} ({count})
            </button>
          ))}
        </div>

        {/* Search and Additional Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={filters.priority?.[0] || ''}
              onChange={(e) => updateFilters({ 
                priority: e.target.value ? [e.target.value as TicketPriority] : undefined 
              })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Priorities</option>
              <option value={TicketPriority.HIGH}>High</option>
              <option value={TicketPriority.MEDIUM}>Medium</option>
              <option value={TicketPriority.LOW}>Low</option>
            </select>
            <select
              value={filters.category?.[0] || ''}
              onChange={(e) => updateFilters({ 
                category: e.target.value ? [e.target.value as TicketCategory] : undefined 
              })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Categories</option>
              {Object.values(TicketCategory).map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Display */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium text-gray-900">No tickets found</p>
              <p className="text-gray-500">
                {filters.search || filters.status || filters.priority || filters.category
                  ? 'Try adjusting your filters'
                  : 'No tickets have been created yet'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          mode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        )}>
          {filteredTickets.map((ticket) => (
            <div 
              key={ticket.id}
              onClick={() => {
                setSelectedTicket(ticket);
                onTicketSelect?.(ticket);
              }}
            >
              <TicketPanel
                ticket={ticket}
                mode="compact"
                className="cursor-pointer hover:shadow-md transition-shadow"
                onStatusChange={(status) => onStatusChange?.(ticket.id, status)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Load More / Pagination (placeholder) */}
      {filteredTickets.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline">
            Load More Tickets
          </Button>
        </div>
      )}
    </div>
  );
}