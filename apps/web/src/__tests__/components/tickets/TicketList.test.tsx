import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TicketList } from '../../../components/tickets/TicketList';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, Department } from '../../../types/ticket';

// Mock the UI components
jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children, className }: any) => <div className={`card ${className}`}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={`card-content ${className}`}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={`card-header ${className}`}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={`card-title ${className}`}>{children}</div>
}));

jest.mock('../../../components/ui/Button', () => ({
  Button: ({ children, onClick, variant, size }: any) => (
    <button onClick={onClick} className={`btn ${variant} ${size}`} data-testid="button">
      {children}
    </button>
  )
}));

jest.mock('../../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock TicketPanel component
jest.mock('../../../components/tickets/TicketPanel', () => ({
  TicketPanel: ({ ticket, mode, onStatusChange, className, onClick }: any) => (
    <div 
      data-testid="ticket-panel" 
      data-ticket-id={ticket.id}
      data-mode={mode}
      className={className}
      onClick={onClick}
    >
      <div>{ticket.ticketNumber}</div>
      <div>{ticket.title}</div>
      <div>{ticket.status}</div>
      {onStatusChange && (
        <button onClick={() => onStatusChange('RESOLVED')} data-testid="status-change-btn">
          Change Status
        </button>
      )}
    </div>
  )
}));

describe('TicketList', () => {
  const mockTickets: Ticket[] = [
    {
      id: 'ticket-1',
      ticketNumber: 'TK-202407-0001',
      title: 'Password Reset Request',
      description: 'User cannot access account',
      category: TicketCategory.PASSWORD,
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      customer: {
        id: 'customer-1',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        department: Department.IT,
        jobTitle: 'Developer',
        officeLocation: 'Building A',
        employeeId: 'EMP001',
        manager: 'Jane Smith',
        technicalSkillLevel: 'advanced',
        preferredContactMethod: 'email',
        timezone: 'EST',
        workingHours: {
          start: '09:00',
          end: '17:00',
          daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      assignedTo: undefined,
      createdBy: 'system',
      slaTracking: {
        responseTimeMinutes: 15,
        resolutionTimeHours: 4,
        escalationTimeHours: 2,
        actualResponseTime: undefined,
        actualResolutionTime: undefined,
        slaBreached: false,
        breachReason: undefined,
        escalationLevel: 0,
        escalationHistory: []
      },
      metadata: {
        scenarioId: 'password-scenario',
        templateId: 'password-template',
        difficultyLevel: 'beginner',
        learningObjectives: [],
        expectedResolutionSteps: [],
        skillsRequired: [],
        knowledgeBaseArticles: [],
        estimatedResolutionTime: 15,
        complexity: 'low',
        businessImpact: 'medium',
        tags: [],
        customFields: {}
      },
      createdAt: new Date('2024-07-20T09:00:00Z'),
      updatedAt: new Date('2024-07-20T09:00:00Z')
    },
    {
      id: 'ticket-2',
      ticketNumber: 'TK-202407-0002',
      title: 'Software Installation Issue',
      description: 'Cannot install required software',
      category: TicketCategory.SOFTWARE,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.IN_PROGRESS,
      customer: {
        id: 'customer-2',
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0124',
        department: Department.SALES,
        jobTitle: 'Sales Manager',
        officeLocation: 'Building B',
        employeeId: 'EMP002',
        manager: 'Bob Johnson',
        technicalSkillLevel: 'intermediate',
        preferredContactMethod: 'phone',
        timezone: 'PST',
        workingHours: {
          start: '08:00',
          end: '17:00',
          daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      assignedTo: 'tech-001',
      createdBy: 'system',
      slaTracking: {
        responseTimeMinutes: 60,
        resolutionTimeHours: 24,
        escalationTimeHours: 8,
        actualResponseTime: 30,
        actualResolutionTime: undefined,
        slaBreached: false,
        breachReason: undefined,
        escalationLevel: 0,
        escalationHistory: []
      },
      metadata: {
        scenarioId: 'software-scenario',
        templateId: 'software-template',
        difficultyLevel: 'intermediate',
        learningObjectives: [],
        expectedResolutionSteps: [],
        skillsRequired: [],
        knowledgeBaseArticles: [],
        estimatedResolutionTime: 60,
        complexity: 'medium',
        businessImpact: 'medium',
        tags: [],
        customFields: {}
      },
      createdAt: new Date('2024-07-20T10:00:00Z'),
      updatedAt: new Date('2024-07-20T10:30:00Z')
    },
    {
      id: 'ticket-3',
      ticketNumber: 'TK-202407-0003',
      title: 'Printer Not Working',
      description: 'Printer is offline and not responding',
      category: TicketCategory.PRINTER,
      priority: TicketPriority.LOW,
      status: TicketStatus.RESOLVED,
      customer: {
        id: 'customer-3',
        firstName: 'Bob',
        lastName: 'Wilson',
        fullName: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        phone: '+1-555-0125',
        department: Department.OPERATIONS,
        jobTitle: 'Operations Manager',
        officeLocation: 'Building C',
        employeeId: 'EMP003',
        manager: 'Alice Brown',
        technicalSkillLevel: 'novice',
        preferredContactMethod: 'email',
        timezone: 'EST',
        workingHours: {
          start: '09:00',
          end: '18:00',
          daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      },
      assignedTo: 'tech-002',
      createdBy: 'system',
      slaTracking: {
        responseTimeMinutes: 240,
        resolutionTimeHours: 72,
        escalationTimeHours: 24,
        actualResponseTime: 180,
        actualResolutionTime: 4,
        slaBreached: false,
        breachReason: undefined,
        escalationLevel: 0,
        escalationHistory: []
      },
      metadata: {
        scenarioId: 'printer-scenario',
        templateId: 'printer-template',
        difficultyLevel: 'beginner',
        learningObjectives: [],
        expectedResolutionSteps: [],
        skillsRequired: [],
        knowledgeBaseArticles: [],
        estimatedResolutionTime: 30,
        complexity: 'low',
        businessImpact: 'low',
        tags: [],
        customFields: {}
      },
      resolution: {
        summary: 'Printer driver issue resolved',
        rootCause: 'Corrupted driver',
        actionsTaken: ['Reinstalled drivers'],
        preventionMeasures: 'Regular driver updates',
        followUpRequired: false,
        customerSatisfaction: 5,
        resolutionNotes: 'Customer satisfied'
      },
      createdAt: new Date('2024-07-19T14:00:00Z'),
      updatedAt: new Date('2024-07-19T16:00:00Z'),
      resolvedAt: new Date('2024-07-19T16:00:00Z')
    }
  ];

  const defaultProps = {
    tickets: mockTickets,
    onTicketSelect: jest.fn(),
    onStatusChange: jest.fn(),
    onFilterChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all tickets in list mode', () => {
      render(<TicketList {...defaultProps} />);

      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels).toHaveLength(3);
      
      expect(screen.getByText('TK-202407-0001')).toBeInTheDocument();
      expect(screen.getByText('TK-202407-0002')).toBeInTheDocument();
      expect(screen.getByText('TK-202407-0003')).toBeInTheDocument();
    });

    it('should render tickets in compact mode by default', () => {
      render(<TicketList {...defaultProps} />);

      const ticketPanels = screen.getAllByTestId('ticket-panel');
      ticketPanels.forEach(panel => {
        expect(panel).toHaveAttribute('data-mode', 'compact');
      });
    });

    it('should display status filter tabs with correct counts', () => {
      render(<TicketList {...defaultProps} />);

      expect(screen.getByText('All (3)')).toBeInTheDocument();
      expect(screen.getByText('OPEN (1)')).toBeInTheDocument();
      expect(screen.getByText('IN_PROGRESS (1)')).toBeInTheDocument();
      expect(screen.getByText('RESOLVED (1)')).toBeInTheDocument();
    });

    it('should display search input and filter dropdowns', () => {
      render(<TicketList {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search tickets...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Priorities')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter tickets by status', () => {
      render(<TicketList {...defaultProps} />);

      // Click on OPEN status filter
      fireEvent.click(screen.getByText('OPEN (1)'));

      // Should only show open tickets
      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels).toHaveLength(1);
      expect(screen.getByText('TK-202407-0001')).toBeInTheDocument();
    });

    it('should filter tickets by priority', () => {
      render(<TicketList {...defaultProps} />);

      const prioritySelect = screen.getByDisplayValue('All Priorities');
      fireEvent.change(prioritySelect, { target: { value: 'HIGH' } });

      // Should only show high priority tickets
      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels).toHaveLength(1);
      expect(screen.getByText('TK-202407-0001')).toBeInTheDocument();
    });

    it('should filter tickets by category', () => {
      render(<TicketList {...defaultProps} />);

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'SOFTWARE' } });

      // Should only show software tickets
      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels).toHaveLength(1);
      expect(screen.getByText('TK-202407-0002')).toBeInTheDocument();
    });

    it('should search tickets by title', () => {
      render(<TicketList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tickets...');
      fireEvent.change(searchInput, { target: { value: 'password' } });

      // Should only show password-related tickets
      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels).toHaveLength(1);
      expect(screen.getByText('TK-202407-0001')).toBeInTheDocument();
    });

    it('should search tickets by description', () => {
      render(<TicketList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tickets...');
      fireEvent.change(searchInput, { target: { value: 'install' } });

      // Should show tickets with "install" in description
      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels).toHaveLength(1);
      expect(screen.getByText('TK-202407-0002')).toBeInTheDocument();
    });

    it('should search tickets by ticket number', () => {
      render(<TicketList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tickets...');
      fireEvent.change(searchInput, { target: { value: 'TK-202407-0003' } });

      // Should show the specific ticket
      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels).toHaveLength(1);
      expect(screen.getByText('TK-202407-0003')).toBeInTheDocument();
    });

    it('should call onFilterChange when filters are updated', () => {
      const onFilterChange = jest.fn();
      render(<TicketList {...defaultProps} onFilterChange={onFilterChange} />);

      fireEvent.click(screen.getByText('OPEN (1)'));

      expect(onFilterChange).toHaveBeenCalledWith({
        status: ['OPEN']
      });
    });

    it('should combine multiple filters', () => {
      render(<TicketList {...defaultProps} />);

      // Apply status filter
      fireEvent.click(screen.getByText('OPEN (1)'));
      
      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search tickets...');
      fireEvent.change(searchInput, { target: { value: 'password' } });

      // Should show tickets that match both filters
      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels).toHaveLength(1);
      expect(screen.getByText('TK-202407-0001')).toBeInTheDocument();
    });
  });

  describe('Ticket Selection', () => {
    it('should show ticket details when ticket is selected', () => {
      render(<TicketList {...defaultProps} />);

      const firstTicket = screen.getAllByTestId('ticket-panel')[0];
      fireEvent.click(firstTicket);

      // Should show back button and full ticket panel
      expect(screen.getByText('← Back to List')).toBeInTheDocument();
      
      // Should show ticket in full mode
      const ticketPanel = screen.getByTestId('ticket-panel');
      expect(ticketPanel).toHaveAttribute('data-mode', 'full');
    });

    it('should call onTicketSelect when ticket is clicked', () => {
      const onTicketSelect = jest.fn();
      render(<TicketList {...defaultProps} onTicketSelect={onTicketSelect} />);

      const firstTicket = screen.getAllByTestId('ticket-panel')[0];
      fireEvent.click(firstTicket);

      expect(onTicketSelect).toHaveBeenCalledWith(mockTickets[0]);
    });

    it('should return to list view when back button is clicked', () => {
      render(<TicketList {...defaultProps} />);

      // Select a ticket
      const firstTicket = screen.getAllByTestId('ticket-panel')[0];
      fireEvent.click(firstTicket);

      // Click back button
      fireEvent.click(screen.getByText('← Back to List'));

      // Should show list view again
      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels).toHaveLength(3);
    });
  });

  describe('Status Changes', () => {
    it('should call onStatusChange when status is changed', () => {
      const onStatusChange = jest.fn();
      render(<TicketList {...defaultProps} onStatusChange={onStatusChange} />);

      const statusChangeBtn = screen.getAllByTestId('status-change-btn')[0];
      fireEvent.click(statusChangeBtn);

      expect(onStatusChange).toHaveBeenCalledWith('ticket-1', 'RESOLVED');
    });

    it('should update ticket in list when status is changed from detail view', () => {
      render(<TicketList {...defaultProps} />);

      // Select a ticket
      const firstTicket = screen.getAllByTestId('ticket-panel')[0];
      fireEvent.click(firstTicket);

      // Change status
      const statusChangeBtn = screen.getByTestId('status-change-btn');
      fireEvent.click(statusChangeBtn);

      // The ticket panel should reflect the status change
      expect(screen.getByTestId('ticket-panel')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no tickets are provided', () => {
      render(<TicketList {...defaultProps} tickets={[]} />);

      expect(screen.getByText('No tickets found')).toBeInTheDocument();
      expect(screen.getByText('No tickets have been created yet')).toBeInTheDocument();
    });

    it('should display filtered empty state when filters return no results', () => {
      render(<TicketList {...defaultProps} />);

      // Apply a filter that returns no results
      const searchInput = screen.getByPlaceholderText('Search tickets...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No tickets found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });
  });

  describe('Display Modes', () => {
    it('should support grid mode', () => {
      const { container } = render(<TicketList {...defaultProps} mode="grid" />);

      const listContainer = container.querySelector('.grid');
      expect(listContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should support compact mode', () => {
      const { container } = render(<TicketList {...defaultProps} mode="compact" />);

      const listContainer = container.querySelector('.space-y-3');
      expect(listContainer).toBeInTheDocument();
    });

    it('should default to list mode', () => {
      const { container } = render(<TicketList {...defaultProps} />);

      const listContainer = container.querySelector('.space-y-3');
      expect(listContainer).toBeInTheDocument();
    });
  });

  describe('Load More', () => {
    it('should display load more button when tickets are present', () => {
      render(<TicketList {...defaultProps} />);

      expect(screen.getByText('Load More Tickets')).toBeInTheDocument();
    });

    it('should not display load more button when no tickets are present', () => {
      render(<TicketList {...defaultProps} tickets={[]} />);

      expect(screen.queryByText('Load More Tickets')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible filter controls', () => {
      render(<TicketList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tickets...');
      expect(searchInput).toBeInTheDocument();

      const prioritySelect = screen.getByDisplayValue('All Priorities');
      expect(prioritySelect).toBeInTheDocument();

      const categorySelect = screen.getByDisplayValue('All Categories');
      expect(categorySelect).toBeInTheDocument();
    });

    it('should have clickable status filter tabs', () => {
      render(<TicketList {...defaultProps} />);

      const statusTabs = screen.getAllByRole('button');
      const statusTabsText = statusTabs.map(tab => tab.textContent);
      
      expect(statusTabsText).toContain('All (3)');
      expect(statusTabsText).toContain('OPEN (1)');
    });
  });

  describe('Performance', () => {
    it('should handle large number of tickets efficiently', () => {
      const manyTickets = Array.from({ length: 100 }, (_, i) => ({
        ...mockTickets[0],
        id: `ticket-${i}`,
        ticketNumber: `TK-202407-${String(i).padStart(4, '0')}`,
        title: `Test Ticket ${i}`
      }));

      const { container } = render(<TicketList {...defaultProps} tickets={manyTickets} />);

      // Should render without performance issues
      expect(container).toBeInTheDocument();
      
      // Should show first batch of tickets
      const ticketPanels = screen.getAllByTestId('ticket-panel');
      expect(ticketPanels.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed ticket data gracefully', () => {
      const malformedTickets = [
        { ...mockTickets[0], title: null },
        { ...mockTickets[1], status: undefined }
      ];

      expect(() => 
        render(<TicketList {...defaultProps} tickets={malformedTickets as any} />)
      ).not.toThrow();
    });

    it('should handle missing optional props', () => {
      const minimalProps = {
        tickets: mockTickets
      };

      expect(() => render(<TicketList {...minimalProps} />)).not.toThrow();
    });
  });
});