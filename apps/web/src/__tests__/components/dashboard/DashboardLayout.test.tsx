import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';
import { useDashboardStore } from '../../../stores/dashboardStore';
import { useAuthStore } from '../../../stores/authStore';

// Mock the stores
jest.mock('../../../stores/dashboardStore');
jest.mock('../../../stores/authStore');
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

const mockUseDashboardStore = useDashboardStore as jest.MockedFunction<typeof useDashboardStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('DashboardLayout', () => {
  const mockSetSidebarCollapsed = jest.fn();
  const mockToggleSidebar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockStore = {
      sidebarCollapsed: false,
      setSidebarCollapsed: mockSetSidebarCollapsed,
      toggleSidebar: mockToggleSidebar,
      userProgress: null,
      recentActivity: [],
      isLoading: false,
      isLoadingProgress: false,
      isLoadingActivity: false,
      error: null,
      welcomeModalOpen: false,
      setUserProgress: jest.fn(),
      setRecentActivity: jest.fn(),
      setLoading: jest.fn(),
      setProgressLoading: jest.fn(),
      setActivityLoading: jest.fn(),
      setError: jest.fn(),
      setWelcomeModalOpen: jest.fn(),
      clearError: jest.fn(),
      reset: jest.fn(),
      initializeDashboard: jest.fn(),
      fetchUserProgress: jest.fn(),
      fetchRecentActivity: jest.fn(),
    };

    mockUseDashboardStore.mockReturnValue(mockStore as any);
    (mockUseDashboardStore as any).getState = jest.fn(() => mockStore);

    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        level: 1,
        xp: 0,
        lastLoginAt: new Date(),
      },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
    } as any);
  });

  it('renders dashboard layout with sidebar and header', () => {
    render(
      <DashboardLayout>
        <div data-testid="dashboard-content">Test Content</div>
      </DashboardLayout>
    );

    // Check for navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tickets')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Check for content
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();

    // Check for user info
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Level 1 • 0 XP')).toBeInTheDocument();
  });

  it('displays mobile menu button on mobile screens', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const mobileMenuButton = screen.getByLabelText('Toggle menu');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('toggles sidebar when mobile menu button is clicked', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const mobileMenuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(mobileMenuButton);

    expect(mockToggleSidebar).toHaveBeenCalled();
  });

  it('applies correct responsive classes', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const mainContent = container.querySelector('main');
    expect(mainContent).toHaveClass('px-4', 'py-6', 'sm:px-6', 'lg:px-8');
  });
});