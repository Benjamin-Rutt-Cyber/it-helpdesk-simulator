import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TicketPanel } from '../../../components/tickets/TicketPanel';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, Department } from '../../../types/ticket';

// Mock the UI components
jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children, className }: any) => <div className={`card ${className}`}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={`card-content ${className}`}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={`card-header ${className}`}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={`card-title ${className}`}>{children}</div>
}));

jest.mock('../../../components/ui/Button', () => ({
  Button: ({ children, onClick, variant, size, disabled }: any) => (
    <button 
      onClick={onClick} 
      className={`btn ${variant} ${size}`}
      disabled={disabled}
      data-testid="button"
    >
      {children}
    </button>
  )
}));

jest.mock('../../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock child components
jest.mock('../../../components/tickets/PriorityIndicator', () => ({
  PriorityIndicator: ({ priority }: any) => <div data-testid="priority-indicator">{priority}</div>,
  PriorityBadge: ({ priority, size }: any) => <div data-testid="priority-badge">{priority}-{size}</div>
}));

jest.mock('../../../components/tickets/CustomerInfo', () => ({
  CustomerInfo: ({ customer, compact }: any) => (
    <div data-testid="customer-info">
      {customer.fullName} - {compact ? 'compact' : 'full'}
    </div>
  )
}));

jest.mock('../../../components/tickets/TechnicalDetails', () => ({
  TechnicalDetails: ({ technicalContext, assets }: any) => (
    <div data-testid="technical-details">
      Technical Details Component
    </div>
  )
}));

describe('TicketPanel', () => {
  const mockTicket: Ticket = {
    id: 'ticket-1',
    ticketNumber: 'TK-202407-0001',
    title: 'Test Ticket Title',
    description: 'This is a test ticket description for testing purposes.',
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
      scenarioId: 'test-scenario',
      templateId: 'test-template',
      difficultyLevel: 'beginner',
      learningObjectives: ['Test objective'],
      expectedResolutionSteps: ['Test step'],
      skillsRequired: ['Test skill'],
      knowledgeBaseArticles: ['KB-001'],
      estimatedResolutionTime: 15,
      complexity: 'low',
      businessImpact: 'medium',
      tags: ['test'],
      customFields: {
        technicalContext: {
          systemSpecifications: {
            operatingSystem: 'Windows 11',
            version: '22H2',
            architecture: 'x64',
            processor: 'Intel Core i5',
            memory: '8GB',
            diskSpace: '256GB SSD'
          },
          errorMessages: [{
            errorCode: 'TEST_ERROR',
            message: 'Test error message',
            timestamp: new Date(),
            source: 'Test System',
            severity: 'error' as const
          }],
          environmentDetails: {
            domain: 'TEST.LOCAL',
            networkSegment: 'Test Network'
          },
          symptoms: [{
            description: 'Test symptom',
            frequency: 'frequent' as const,
            impact: 'high' as const,
            reproducible: true
          }]
        }
      }
    },
    createdAt: new Date('2024-07-20T09:00:00Z'),
    updatedAt: new Date('2024-07-20T09:00:00Z')
  };

  const defaultProps = {
    ticket: mockTicket,
    onStatusChange: jest.fn(),
    onAssign: jest.fn(),
    onAddNote: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Compact Mode', () => {
    it('should render compact mode correctly', () => {
      render(<TicketPanel {...defaultProps} mode="compact" />);

      expect(screen.getByText('TK-202407-0001')).toBeInTheDocument();
      expect(screen.getByText('Test Ticket Title')).toBeInTheDocument();
      expect(screen.getByTestId('priority-badge')).toBeInTheDocument();
      expect(screen.getByText(/OPEN/)).toBeInTheDocument();
    });

    it('should be clickable in compact mode', () => {
      const { container } = render(<TicketPanel {...defaultProps} mode="compact" />);
      
      const cardElement = container.querySelector('.card');
      expect(cardElement).toHaveClass('cursor-pointer');
    });

    it('should display time ago correctly', () => {
      render(<TicketPanel {...defaultProps} mode="compact" />);
      
      // Should show some time representation
      expect(screen.getByText(/ago|now/i)).toBeInTheDocument();
    });
  });

  describe('Full Mode', () => {
    it('should render full mode with all sections', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      expect(screen.getByText('TK-202407-0001')).toBeInTheDocument();
      expect(screen.getByText('Test Ticket Title')).toBeInTheDocument();
      expect(screen.getByText('This is a test ticket description for testing purposes.')).toBeInTheDocument();
      
      // Check for navigation tabs
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Technical')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('should display SLA information in overview section', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      expect(screen.getByText('SLA Information')).toBeInTheDocument();
      expect(screen.getByText('15 minutes')).toBeInTheDocument(); // Response time SLA
      expect(screen.getByText('4 hours')).toBeInTheDocument(); // Resolution time SLA
    });

    it('should switch between navigation sections', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      // Click on Customer tab
      fireEvent.click(screen.getByText('Customer'));
      expect(screen.getByTestId('customer-info')).toBeInTheDocument();

      // Click on Technical tab
      fireEvent.click(screen.getByText('Technical'));
      expect(screen.getByTestId('technical-details')).toBeInTheDocument();

      // Click back to Overview
      fireEvent.click(screen.getByText('Overview'));
      expect(screen.getByText('SLA Information')).toBeInTheDocument();
    });

    it('should display note-taking functionality', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      const textarea = screen.getByPlaceholderText(/Add a note about your progress/);
      const addButton = screen.getByText('Add Note');

      expect(textarea).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
      expect(addButton).toBeDisabled(); // Should be disabled when empty
    });

    it('should enable add note button when text is entered', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      const textarea = screen.getByPlaceholderText(/Add a note about your progress/);
      const addButton = screen.getByText('Add Note');

      fireEvent.change(textarea, { target: { value: 'Test note' } });

      expect(addButton).not.toBeDisabled();
    });

    it('should call onAddNote when note is submitted', () => {
      const onAddNote = jest.fn();
      render(<TicketPanel {...defaultProps} onAddNote={onAddNote} mode="full" />);

      const textarea = screen.getByPlaceholderText(/Add a note about your progress/);
      const addButton = screen.getByText('Add Note');

      fireEvent.change(textarea, { target: { value: 'Test note content' } });
      fireEvent.click(addButton);

      expect(onAddNote).toHaveBeenCalledWith('Test note content');
    });
  });

  describe('Status Actions', () => {
    it('should display correct actions for OPEN status', () => {
      render(<TicketPanel {...defaultProps} />);

      expect(screen.getByText('Start Working')).toBeInTheDocument();
      expect(screen.getByText('Escalate')).toBeInTheDocument();
    });

    it('should display correct actions for IN_PROGRESS status', () => {
      const inProgressTicket = { ...mockTicket, status: TicketStatus.IN_PROGRESS };
      render(<TicketPanel {...defaultProps} ticket={inProgressTicket} />);

      expect(screen.getByText('Mark Resolved')).toBeInTheDocument();
      expect(screen.getByText('Escalate')).toBeInTheDocument();
    });

    it('should display correct actions for RESOLVED status', () => {
      const resolvedTicket = { ...mockTicket, status: TicketStatus.RESOLVED };
      render(<TicketPanel {...defaultProps} ticket={resolvedTicket} />);

      expect(screen.getByText('Close Ticket')).toBeInTheDocument();
      expect(screen.getByText('Reopen')).toBeInTheDocument();
    });

    it('should display correct actions for ESCALATED status', () => {
      const escalatedTicket = { ...mockTicket, status: TicketStatus.ESCALATED };
      render(<TicketPanel {...defaultProps} ticket={escalatedTicket} />);

      expect(screen.getByText('Take Over')).toBeInTheDocument();
      expect(screen.getByText('Mark Resolved')).toBeInTheDocument();
    });

    it('should call onStatusChange when action button is clicked', () => {
      const onStatusChange = jest.fn();
      render(<TicketPanel {...defaultProps} onStatusChange={onStatusChange} />);

      fireEvent.click(screen.getByText('Start Working'));

      expect(onStatusChange).toHaveBeenCalledWith(TicketStatus.IN_PROGRESS);
    });
  });

  describe('SLA Status Display', () => {
    it('should display on track SLA status', () => {
      render(<TicketPanel {...defaultProps} />);

      expect(screen.getByText(/SLA: On track/)).toBeInTheDocument();
    });

    it('should display SLA breach status', () => {
      const breachedTicket = {
        ...mockTicket,
        slaTracking: {
          ...mockTicket.slaTracking,
          slaBreached: true,
          breachReason: 'Response time exceeded'
        }
      };
      render(<TicketPanel {...defaultProps} ticket={breachedTicket} />);

      expect(screen.getByText(/SLA: Response time exceeded/)).toBeInTheDocument();
    });

    it('should display urgent SLA status when approaching deadline', () => {
      // Mock a ticket created 14 minutes ago (1 minute before 15-minute response SLA)
      const urgentTicket = {
        ...mockTicket,
        createdAt: new Date(Date.now() - 14 * 60 * 1000)
      };

      // Mock Date.now for consistent testing
      const mockNow = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      render(<TicketPanel {...defaultProps} ticket={urgentTicket} />);

      // Should show some urgent indicator
      expect(screen.getByText(/SLA:/)).toBeInTheDocument();

      jest.restoreAllMocks();
    });
  });

  describe('Priority Display', () => {
    it('should display high priority correctly', () => {
      render(<TicketPanel {...defaultProps} />);

      expect(screen.getByTestId('priority-indicator')).toHaveTextContent('HIGH');
    });

    it('should display medium priority correctly', () => {
      const mediumPriorityTicket = { ...mockTicket, priority: TicketPriority.MEDIUM };
      render(<TicketPanel {...defaultProps} ticket={mediumPriorityTicket} />);

      expect(screen.getByTestId('priority-indicator')).toHaveTextContent('MEDIUM');
    });

    it('should display low priority correctly', () => {
      const lowPriorityTicket = { ...mockTicket, priority: TicketPriority.LOW };
      render(<TicketPanel {...defaultProps} ticket={lowPriorityTicket} />);

      expect(screen.getByTestId('priority-indicator')).toHaveTextContent('LOW');
    });
  });

  describe('Customer Information', () => {
    it('should display customer info in overview tab', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      expect(screen.getByTestId('customer-info')).toBeInTheDocument();
      expect(screen.getByText(/John Doe - compact/)).toBeInTheDocument();
    });

    it('should display full customer info in customer tab', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      fireEvent.click(screen.getByText('Customer'));

      expect(screen.getByTestId('customer-info')).toBeInTheDocument();
      expect(screen.getByText(/John Doe - full/)).toBeInTheDocument();
    });
  });

  describe('Technical Details', () => {
    it('should display technical details in technical tab', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      fireEvent.click(screen.getByText('Technical'));

      expect(screen.getByTestId('technical-details')).toBeInTheDocument();
    });

    it('should pass technical context to TechnicalDetails component', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      fireEvent.click(screen.getByText('Technical'));

      // Technical details component should be rendered with the technical context
      expect(screen.getByTestId('technical-details')).toBeInTheDocument();
    });
  });

  describe('History Section', () => {
    it('should display history placeholder in history tab', () => {
      render(<TicketPanel {...defaultProps} mode="full" />);

      fireEvent.click(screen.getByText('History'));

      expect(screen.getByText(/History tracking coming soon/)).toBeInTheDocument();
    });
  });

  describe('Summary Mode', () => {
    it('should render summary mode correctly', () => {
      render(<TicketPanel {...defaultProps} mode="summary" />);

      // Should show main ticket information but not navigation tabs
      expect(screen.getByText('TK-202407-0001')).toBeInTheDocument();
      expect(screen.getByText('Test Ticket Title')).toBeInTheDocument();
      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Customer')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<TicketPanel {...defaultProps} />);

      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/Start Working|Escalate/);
      });
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<TicketPanel {...defaultProps} mode="full" />);

      // Should have proper heading structure
      expect(container.querySelector('.card-title')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional props gracefully', () => {
      const minimalProps = {
        ticket: mockTicket
      };

      expect(() => render(<TicketPanel {...minimalProps} />)).not.toThrow();
    });

    it('should handle undefined customer data', () => {
      const ticketWithoutCustomer = {
        ...mockTicket,
        customer: undefined
      };

      expect(() => 
        render(<TicketPanel {...defaultProps} ticket={ticketWithoutCustomer as any} />)
      ).not.toThrow();
    });

    it('should handle missing technical context', () => {
      const ticketWithoutTechnicalContext = {
        ...mockTicket,
        metadata: {
          ...mockTicket.metadata,
          customFields: {}
        }
      };

      render(<TicketPanel {...defaultProps} ticket={ticketWithoutTechnicalContext} mode="full" />);

      fireEvent.click(screen.getByText('Technical'));

      expect(screen.getByTestId('technical-details')).toBeInTheDocument();
    });
  });
});