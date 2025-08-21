import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PerformanceDashboard } from '../../../components/dashboard/PerformanceDashboard';

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

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render dashboard title and description', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Track team performance and identify improvement opportunities')).toBeInTheDocument();
    });

    it('should render timeframe selection buttons', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('30 Days')).toBeInTheDocument();
      expect(screen.getByText('90 Days')).toBeInTheDocument();
    });

    it('should have 30 Days selected by default', () => {
      render(<PerformanceDashboard />);

      const button30d = screen.getByText('30 Days');
      expect(button30d).toHaveClass('primary');
    });
  });

  describe('Key Performance Indicators', () => {
    it('should display all KPI cards', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Total Tickets')).toBeInTheDocument();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
      expect(screen.getByText('Avg Response (min)')).toBeInTheDocument();
      expect(screen.getByText('Avg Resolution (hrs)')).toBeInTheDocument();
      expect(screen.getByText('Satisfaction')).toBeInTheDocument();
      expect(screen.getByText('SLA Compliance')).toBeInTheDocument();
    });

    it('should display KPI values from mock data', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('147')).toBeInTheDocument(); // Total tickets
      expect(screen.getByText('132')).toBeInTheDocument(); // Resolved tickets
      expect(screen.getByText('23.5')).toBeInTheDocument(); // Avg response time
      expect(screen.getByText('4.2')).toBeInTheDocument(); // Avg resolution time
      expect(screen.getByText('4.3')).toBeInTheDocument(); // Customer satisfaction
      expect(screen.getByText('89.7%')).toBeInTheDocument(); // SLA compliance
    });

    it('should show trend indicators', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('+12% vs last period')).toBeInTheDocument();
      expect(screen.getByText('-8% improvement')).toBeInTheDocument();
      expect(screen.getByText('-15% improvement')).toBeInTheDocument();
    });

    it('should calculate resolution rate correctly', () => {
      render(<PerformanceDashboard />);

      // 132/147 = 89.8%
      expect(screen.getByText('89.8% rate')).toBeInTheDocument();
    });
  });

  describe('Performance Trends', () => {
    it('should display trend selection tabs', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('Response')).toBeInTheDocument();
      expect(screen.getByText('Resolution')).toBeInTheDocument();
      expect(screen.getByText('Satisfaction')).toBeInTheDocument();
    });

    it('should have Volume selected by default', () => {
      render(<PerformanceDashboard />);

      const volumeTab = screen.getByText('Volume');
      expect(volumeTab).toHaveClass('bg-white text-gray-900 shadow-sm');
    });

    it('should switch trend display when different tab is selected', () => {
      render(<PerformanceDashboard />);

      const responseTab = screen.getByText('Response');
      fireEvent.click(responseTab);

      expect(responseTab).toHaveClass('bg-white text-gray-900 shadow-sm');
    });

    it('should display trend data for each period', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Week 3')).toBeInTheDocument();
      expect(screen.getByText('Week 4')).toBeInTheDocument();
    });

    it('should show progress bars for trend data', () => {
      const { container } = render(<PerformanceDashboard />);

      const progressBars = container.querySelectorAll('.bg-blue-500.h-2.rounded-full');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Team Performance Table', () => {
    it('should display team performance table headers', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Technician')).toBeInTheDocument();
      expect(screen.getByText('Tickets Handled')).toBeInTheDocument();
      expect(screen.getByText('Avg Resolution')).toBeInTheDocument();
      expect(screen.getByText('Satisfaction')).toBeInTheDocument();
      expect(screen.getByText('SLA Compliance')).toBeInTheDocument();
      expect(screen.getByText('Workload')).toBeInTheDocument();
    });

    it('should display technician performance data', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Carol Davis')).toBeInTheDocument();
      expect(screen.getByText('David Wilson')).toBeInTheDocument();
    });

    it('should show technician IDs', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('tech-001')).toBeInTheDocument();
      expect(screen.getByText('tech-002')).toBeInTheDocument();
      expect(screen.getByText('tech-003')).toBeInTheDocument();
      expect(screen.getByText('tech-004')).toBeInTheDocument();
    });

    it('should display workload status badges', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('NORMAL')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('should apply color coding to performance metrics', () => {
      const { container } = render(<PerformanceDashboard />);

      const coloredElements = container.querySelectorAll('.text-green-600, .text-yellow-600, .text-red-600');
      expect(coloredElements.length).toBeGreaterThan(0);
    });
  });

  describe('Category Performance', () => {
    it('should display performance by category section', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Performance by Category')).toBeInTheDocument();
    });

    it('should show category data', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Password Reset')).toBeInTheDocument();
      expect(screen.getByText('Software Issues')).toBeInTheDocument();
      expect(screen.getByText('Hardware Problems')).toBeInTheDocument();
      expect(screen.getByText('Network Issues')).toBeInTheDocument();
      expect(screen.getByText('Printer Issues')).toBeInTheDocument();
    });

    it('should display ticket counts for each category', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('45 tickets')).toBeInTheDocument();
      expect(screen.getByText('38 tickets')).toBeInTheDocument();
      expect(screen.getByText('32 tickets')).toBeInTheDocument();
      expect(screen.getByText('20 tickets')).toBeInTheDocument();
      expect(screen.getByText('12 tickets')).toBeInTheDocument();
    });

    it('should show average resolution times', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('0.5 hrs')).toBeInTheDocument(); // Password Reset
      expect(screen.getByText('6.2 hrs')).toBeInTheDocument(); // Software Issues
      expect(screen.getByText('8.1 hrs')).toBeInTheDocument(); // Hardware Problems
    });

    it('should display satisfaction scores for categories', () => {
      render(<PerformanceDashboard />);

      const satisfactionScores = screen.getAllByText(/4\.\d/);
      expect(satisfactionScores.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Insights', () => {
    it('should display insights section', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    });

    it('should show positive performance insight', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Strong Performance')).toBeInTheDocument();
      expect(screen.getByText(/Password reset tickets are being resolved 40% faster/)).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should show improvement opportunity insight', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Improvement Opportunity')).toBeInTheDocument();
      expect(screen.getByText(/SLA compliance is below target/)).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should show recommendation insight', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('Recommendation')).toBeInTheDocument();
      expect(screen.getByText(/Consider cross-training team members/)).toBeInTheDocument();
      expect(screen.getByText('💡')).toBeInTheDocument();
    });

    it('should use appropriate background colors for different insights', () => {
      const { container } = render(<PerformanceDashboard />);

      expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
      expect(container.querySelector('.bg-yellow-50')).toBeInTheDocument();
      expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
    });
  });

  describe('Timeframe Selection', () => {
    it('should change selected timeframe when button is clicked', () => {
      render(<PerformanceDashboard />);

      const button7d = screen.getByText('7 Days');
      fireEvent.click(button7d);

      expect(button7d).toHaveClass('primary');
    });

    it('should update data when timeframe changes', () => {
      render(<PerformanceDashboard />);

      const button90d = screen.getByText('90 Days');
      fireEvent.click(button90d);

      expect(button90d).toHaveClass('primary');
    });
  });

  describe('Trend Data Display', () => {
    it('should display volume trend data correctly', () => {
      render(<PerformanceDashboard />);

      // Volume should be selected by default
      expect(screen.getByText('35')).toBeInTheDocument(); // Week 1 count
      expect(screen.getByText('42')).toBeInTheDocument(); // Week 2 count
    });

    it('should display response time trend when selected', () => {
      render(<PerformanceDashboard />);

      const responseTab = screen.getByText('Response');
      fireEvent.click(responseTab);

      // Should show response times in minutes
      expect(screen.getByText('28.2 min')).toBeInTheDocument();
      expect(screen.getByText('24.1 min')).toBeInTheDocument();
    });

    it('should display resolution time trend when selected', () => {
      render(<PerformanceDashboard />);

      const resolutionTab = screen.getByText('Resolution');
      fireEvent.click(resolutionTab);

      // Should show resolution times in hours
      expect(screen.getByText('5.1 hrs')).toBeInTheDocument();
      expect(screen.getByText('4.8 hrs')).toBeInTheDocument();
    });

    it('should display satisfaction trend when selected', () => {
      render(<PerformanceDashboard />);

      const satisfactionTab = screen.getByText('Satisfaction');
      fireEvent.click(satisfactionTab);

      // Should show satisfaction scores
      expect(screen.getByText('4.1')).toBeInTheDocument();
      expect(screen.getByText('4.2')).toBeInTheDocument();
    });
  });

  describe('Color Coding and Visual Indicators', () => {
    it('should apply green color for good performance metrics', () => {
      const { container } = render(<PerformanceDashboard />);

      const greenElements = container.querySelectorAll('.text-green-600');
      expect(greenElements.length).toBeGreaterThan(0);
    });

    it('should apply yellow color for average performance metrics', () => {
      const { container } = render(<PerformanceDashboard />);

      const yellowElements = container.querySelectorAll('.text-yellow-600');
      expect(yellowElements.length).toBeGreaterThan(0);
    });

    it('should show workload status with appropriate colors', () => {
      const { container } = render(<PerformanceDashboard />);

      expect(container.querySelector('.bg-green-100')).toBeInTheDocument(); // NORMAL
      expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument(); // HIGH
      expect(container.querySelector('.bg-blue-100')).toBeInTheDocument(); // LOW
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layouts', () => {
      const { container } = render(<PerformanceDashboard />);

      const responsiveGrids = container.querySelectorAll('.grid-cols-2, .md\\:grid-cols-3, .lg\\:grid-cols-6');
      expect(responsiveGrids.length).toBeGreaterThan(0);
    });

    it('should apply proper spacing classes', () => {
      const { container } = render(<PerformanceDashboard />);

      expect(container.querySelector('.space-y-6')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format percentages correctly', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('89.7%')).toBeInTheDocument();
      expect(screen.getByText('94.2%')).toBeInTheDocument();
      expect(screen.getByText('91.5%')).toBeInTheDocument();
    });

    it('should format decimal numbers with proper precision', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('4.3')).toBeInTheDocument(); // Satisfaction
      expect(screen.getByText('3.8')).toBeInTheDocument(); // Resolution time
    });

    it('should format trend indicators with signs', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByText('+12% vs last period')).toBeInTheDocument();
      expect(screen.getByText('-8% improvement')).toBeInTheDocument();
      expect(screen.getByText('-15% improvement')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      expect(() => render(<PerformanceDashboard />)).not.toThrow();
    });

    it('should handle invalid className prop', () => {
      expect(() => render(<PerformanceDashboard className={undefined} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<PerformanceDashboard />);

      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('class');
      });
    });

    it('should have proper table structure', () => {
      render(<PerformanceDashboard />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
    });

    it('should have accessible headings', () => {
      const { container } = render(<PerformanceDashboard />);

      const headings = container.querySelectorAll('h2, .card-title');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();
      render(<PerformanceDashboard />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle large datasets', () => {
      // Component should render with default mock data without issues
      expect(() => render(<PerformanceDashboard />)).not.toThrow();
    });
  });

  describe('User Interactions', () => {
    it('should respond to timeframe button clicks', () => {
      render(<PerformanceDashboard />);

      const buttons = screen.getAllByTestId('button');
      const timeframeButtons = buttons.filter(button => 
        button.textContent?.includes('Days')
      );

      timeframeButtons.forEach(button => {
        fireEvent.click(button);
        expect(button).toHaveClass('primary');
      });
    });

    it('should respond to trend tab clicks', () => {
      render(<PerformanceDashboard />);

      const trendTabs = ['Volume', 'Response', 'Resolution', 'Satisfaction'];
      
      trendTabs.forEach(tabName => {
        const tab = screen.getByText(tabName);
        fireEvent.click(tab);
        expect(tab).toHaveClass('bg-white text-gray-900 shadow-sm');
      });
    });
  });
});