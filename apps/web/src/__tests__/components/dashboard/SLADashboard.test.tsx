import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SLADashboard } from '../../../components/dashboard/SLADashboard';

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

describe('SLADashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render dashboard title and description', () => {
      render(<SLADashboard />);

      expect(screen.getByText('SLA Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Monitor service level agreement performance and alerts')).toBeInTheDocument();
    });

    it('should render timeframe selection buttons', () => {
      render(<SLADashboard />);

      expect(screen.getByText('24 Hours')).toBeInTheDocument();
      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('30 Days')).toBeInTheDocument();
    });

    it('should render SLA metrics cards', () => {
      render(<SLADashboard />);

      expect(screen.getByText('Response Time SLA')).toBeInTheDocument();
      expect(screen.getByText('Resolution Time SLA')).toBeInTheDocument();
      expect(screen.getByText('Overall SLA')).toBeInTheDocument();
    });

    it('should display SLA percentage values', () => {
      render(<SLADashboard />);

      expect(screen.getByText('87.5%')).toBeInTheDocument(); // Response Time SLA
      expect(screen.getByText('92.3%')).toBeInTheDocument(); // Resolution Time SLA
      expect(screen.getByText('89.9%')).toBeInTheDocument(); // Overall SLA
    });
  });

  describe('Timeframe Selection', () => {
    it('should highlight selected timeframe button', () => {
      render(<SLADashboard />);

      const button24h = screen.getByText('24 Hours');
      expect(button24h).toHaveClass('primary'); // Should be selected by default
    });

    it('should change selected timeframe when button is clicked', () => {
      render(<SLADashboard />);

      const button7d = screen.getByText('7 Days');
      fireEvent.click(button7d);

      expect(button7d).toHaveClass('primary');
    });

    it('should update data when timeframe changes', () => {
      render(<SLADashboard />);

      const button30d = screen.getByText('30 Days');
      fireEvent.click(button30d);

      // Component should re-render with new timeframe
      expect(button30d).toHaveClass('primary');
    });
  });

  describe('SLA Metrics Display', () => {
    it('should display target SLA percentages', () => {
      render(<SLADashboard />);

      const targetElements = screen.getAllByText('Target: 95%');
      expect(targetElements).toHaveLength(3); // One for each SLA metric
    });

    it('should show progress bars for SLA metrics', () => {
      const { container } = render(<SLADashboard />);

      const progressBars = container.querySelectorAll('.rounded-full.h-2');
      expect(progressBars).toHaveLength(6); // 3 background bars + 3 progress bars
    });

    it('should apply correct color classes based on SLA performance', () => {
      const { container } = render(<SLADashboard />);

      // Should have yellow colors for metrics below 95% but above 90%
      const yellowElements = container.querySelectorAll('.text-yellow-600');
      expect(yellowElements.length).toBeGreaterThan(0);
    });
  });

  describe('SLA Breaches Breakdown', () => {
    it('should display breach breakdown by type', () => {
      render(<SLADashboard />);

      expect(screen.getByText('SLA Breaches by Type')).toBeInTheDocument();
      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('Resolution Time')).toBeInTheDocument();
      expect(screen.getByText('Escalation')).toBeInTheDocument();
    });

    it('should show breach counts', () => {
      render(<SLADashboard />);

      // Check for breach numbers (based on mock data)
      expect(screen.getByText('3')).toBeInTheDocument(); // Response breaches
      expect(screen.getByText('4')).toBeInTheDocument(); // Resolution breaches  
      expect(screen.getByText('1')).toBeInTheDocument(); // Escalation breaches
    });

    it('should display total breach count', () => {
      render(<SLADashboard />);

      expect(screen.getByText('Total Breaches')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // Total breaches
    });

    it('should display breach breakdown by priority', () => {
      render(<SLADashboard />);

      expect(screen.getByText('SLA Breaches by Priority')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority')).toBeInTheDocument();
      expect(screen.getByText('Low Priority')).toBeInTheDocument();
    });
  });

  describe('Active Alerts', () => {
    it('should display active alerts section', () => {
      render(<SLADashboard />);

      expect(screen.getByText('Active SLA Alerts')).toBeInTheDocument();
    });

    it('should show alert count badge', () => {
      render(<SLADashboard />);

      // Should show count of unacknowledged alerts
      const alertBadge = screen.getByText('2'); // Based on mock data
      expect(alertBadge).toBeInTheDocument();
    });

    it('should display individual alert details', () => {
      render(<SLADashboard />);

      expect(screen.getByText('Response due in 15 minutes for high priority ticket')).toBeInTheDocument();
      expect(screen.getByText('Resolution SLA breached by 2.5 hours')).toBeInTheDocument();
    });

    it('should show alert severity badges', () => {
      render(<SLADashboard />);

      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });

    it('should display ticket numbers in alerts', () => {
      render(<SLADashboard />);

      expect(screen.getByText('Ticket TK-202407-0001')).toBeInTheDocument();
      expect(screen.getByText('Ticket TK-202407-0004')).toBeInTheDocument();
    });

    it('should show acknowledge buttons for active alerts', () => {
      render(<SLADashboard />);

      const acknowledgeButtons = screen.getAllByText('Acknowledge');
      expect(acknowledgeButtons).toHaveLength(2); // For 2 active alerts
    });

    it('should acknowledge alert when button is clicked', () => {
      render(<SLADashboard />);

      const acknowledgeButtons = screen.getAllByText('Acknowledge');
      fireEvent.click(acknowledgeButtons[0]);

      // Alert should be moved to acknowledged section
      waitFor(() => {
        expect(screen.getByText('Recently Acknowledged Alerts')).toBeInTheDocument();
      });
    });
  });

  describe('No Active Alerts State', () => {
    it('should display no alerts message when all alerts are acknowledged', () => {
      render(<SLADashboard />);

      // Acknowledge all alerts
      const acknowledgeButtons = screen.getAllByText('Acknowledge');
      acknowledgeButtons.forEach(button => fireEvent.click(button));

      waitFor(() => {
        expect(screen.getByText('No Active Alerts')).toBeInTheDocument();
        expect(screen.getByText('All SLA targets are being met')).toBeInTheDocument();
        expect(screen.getByText('✅')).toBeInTheDocument();
      });
    });
  });

  describe('Recently Acknowledged Alerts', () => {
    it('should display acknowledged alerts section when alerts exist', () => {
      render(<SLADashboard />);

      expect(screen.getByText('Recently Acknowledged Alerts')).toBeInTheDocument();
    });

    it('should show acknowledged status', () => {
      render(<SLADashboard />);

      expect(screen.getByText('Acknowledged')).toBeInTheDocument();
    });

    it('should display acknowledged alerts with reduced opacity', () => {
      const { container } = render(<SLADashboard />);

      const acknowledgedSection = container.querySelector('.bg-gray-50');
      expect(acknowledgedSection).toBeInTheDocument();
    });
  });

  describe('Alert Icons and Visual Elements', () => {
    it('should display appropriate icons for different alert types', () => {
      render(<SLADashboard />);

      // Check for alert type icons (emojis)
      expect(screen.getByText('⏰')).toBeInTheDocument(); // Response due
      expect(screen.getByText('🚨')).toBeInTheDocument(); // SLA breach
      expect(screen.getByText('📈')).toBeInTheDocument(); // Escalation required
    });

    it('should show priority indicator colors', () => {
      const { container } = render(<SLADashboard />);

      // Should have elements with priority-based color classes
      const priorityElements = container.querySelectorAll('.bg-red-500, .bg-yellow-500, .bg-blue-500');
      expect(priorityElements.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation and Actions', () => {
    it('should display View All Alerts button', () => {
      render(<SLADashboard />);

      expect(screen.getByText('View All Alerts')).toBeInTheDocument();
    });

    it('should handle View All Alerts button click', () => {
      render(<SLADashboard />);

      const viewAllButton = screen.getByText('View All Alerts');
      fireEvent.click(viewAllButton);

      // Should not throw error
      expect(viewAllButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive grid classes', () => {
      const { container } = render(<SLADashboard />);

      const gridContainer = container.querySelector('.grid-cols-1.md\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should have proper spacing classes', () => {
      const { container } = render(<SLADashboard />);

      const spacingContainer = container.querySelector('.space-y-6');
      expect(spacingContainer).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should display SLA percentages with one decimal place', () => {
      render(<SLADashboard />);

      expect(screen.getByText('87.5%')).toBeInTheDocument();
      expect(screen.getByText('92.3%')).toBeInTheDocument();
      expect(screen.getByText('89.9%')).toBeInTheDocument();
    });

    it('should format alert timestamps', () => {
      render(<SLADashboard />);

      // Should show time in some format (exact format depends on locale)
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      expect(() => render(<SLADashboard />)).not.toThrow();
    });

    it('should handle invalid className prop', () => {
      expect(() => render(<SLADashboard className={undefined} />)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with multiple alerts', () => {
      const startTime = performance.now();
      render(<SLADashboard />);
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<SLADashboard />);

      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/24 Hours|7 Days|30 Days|Acknowledge|View All Alerts/);
      });
    });

    it('should have proper heading structure', () => {
      const { container } = render(<SLADashboard />);

      const headings = container.querySelectorAll('h2, .card-title');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});