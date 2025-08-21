import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WelcomeDashboard } from '../../../components/dashboard/WelcomeDashboard';
import { useAuthStore } from '../../../stores/authStore';
import { useDashboardStore } from '../../../stores/dashboardStore';

// Mock the stores
jest.mock('../../../stores/authStore');
jest.mock('../../../stores/dashboardStore');
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseDashboardStore = useDashboardStore as jest.MockedFunction<typeof useDashboardStore>;

describe('WelcomeDashboard', () => {
  beforeEach(() => {
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

    mockUseDashboardStore.mockReturnValue({
      userProgress: {
        level: 1,
        xp: 0,
        completedScenarios: 0,
        totalScenarios: 50,
        streakDays: 0,
        lastLoginAt: new Date(),
      },
      sidebarCollapsed: false,
      setSidebarCollapsed: jest.fn(),
      toggleSidebar: jest.fn(),
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
    } as any);
  });

  it('renders welcome message for new user', () => {
    render(<WelcomeDashboard />);

    expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    expect(screen.getByText(/Ready to start your IT support journey/)).toBeInTheDocument();
    expect(screen.getByText('Start Your First Scenario')).toBeInTheDocument();
  });

  it('renders welcome message for user without first name', () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        level: 1,
        xp: 0,
        lastLoginAt: new Date(),
      },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
    } as any);

    render(<WelcomeDashboard />);

    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });

  it('shows getting started steps for new users', () => {
    render(<WelcomeDashboard />);

    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Complete Your First Scenario')).toBeInTheDocument();
    expect(screen.getByText('Track Your Progress')).toBeInTheDocument();
    expect(screen.getByText('Build Your Resume')).toBeInTheDocument();
  });

  it('shows different content for returning users', () => {
    mockUseDashboardStore.mockReturnValue({
      ...mockUseDashboardStore(),
      userProgress: {
        level: 2,
        xp: 150,
        completedScenarios: 3,
        totalScenarios: 50,
        streakDays: 5,
        lastLoginAt: new Date(),
      },
    } as any);

    render(<WelcomeDashboard />);

    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    expect(screen.getByText('Continue Learning')).toBeInTheDocument();
    expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();
  });

  it('opens tutorial modal when View Tutorial is clicked', () => {
    render(<WelcomeDashboard />);

    const tutorialButton = screen.getByText('View Tutorial');
    fireEvent.click(tutorialButton);

    expect(screen.getByText('Platform Tutorial')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Earning XP')).toBeInTheDocument();
  });

  it('closes tutorial modal when Got It button is clicked', () => {
    render(<WelcomeDashboard />);

    // Open modal
    const tutorialButton = screen.getByText('View Tutorial');
    fireEvent.click(tutorialButton);

    // Close modal
    const gotItButton = screen.getByText('Got It!');
    fireEvent.click(gotItButton);

    expect(screen.queryByText('Platform Tutorial')).not.toBeInTheDocument();
  });

  it('closes tutorial modal when X button is clicked', () => {
    render(<WelcomeDashboard />);

    // Open modal
    const tutorialButton = screen.getByText('View Tutorial');
    fireEvent.click(tutorialButton);

    // Close modal with X button
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Platform Tutorial')).not.toBeInTheDocument();
  });

  it('has correct links for navigation', () => {
    render(<WelcomeDashboard />);

    const startButton = screen.getByText('Start Your First Scenario').closest('a');
    expect(startButton).toHaveAttribute('href', '/dashboard/tickets');
  });
});