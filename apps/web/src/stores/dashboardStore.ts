import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProgress {
  level: number;
  xp: number;
  completedScenarios: number;
  totalScenarios: number;
  streakDays: number;
  lastLoginAt: Date | null;
}

export interface Activity {
  id: string;
  type: 'completed' | 'started' | 'failed';
  description: string;
  createdAt: Date;
  xpEarned?: number;
}

export interface DashboardState {
  // User progress data
  userProgress: UserProgress | null;
  recentActivity: Activity[];
  
  // Loading states
  isLoading: boolean;
  isLoadingProgress: boolean;
  isLoadingActivity: boolean;
  
  // Error states
  error: string | null;
  
  // UI state
  sidebarCollapsed: boolean;
  welcomeModalOpen: boolean;
  
  // Actions
  setUserProgress: (_userProgress: UserProgress) => void;
  setRecentActivity: (_recentActivity: Activity[]) => void;
  setLoading: (_isLoading: boolean) => void;
  setProgressLoading: (_isLoadingProgress: boolean) => void;
  setActivityLoading: (_isLoadingActivity: boolean) => void;
  setError: (_error: string | null) => void;
  setSidebarCollapsed: (_sidebarCollapsed: boolean) => void;
  setWelcomeModalOpen: (_welcomeModalOpen: boolean) => void;
  toggleSidebar: () => void;
  clearError: () => void;
  reset: () => void;
  
  // Async actions
  initializeDashboard: () => Promise<void>;
  fetchUserProgress: () => Promise<void>;
  fetchRecentActivity: () => Promise<void>;
}

const initialState = {
  userProgress: null,
  recentActivity: [],
  isLoading: false,
  isLoadingProgress: false,
  isLoadingActivity: false,
  error: null,
  sidebarCollapsed: false,
  welcomeModalOpen: false,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setUserProgress: (userProgress) => set({ userProgress }),
      
      setRecentActivity: (recentActivity) => set({ recentActivity }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setProgressLoading: (isLoadingProgress) => set({ isLoadingProgress }),
      
      setActivityLoading: (isLoadingActivity) => set({ isLoadingActivity }),
      
      setError: (error) => set({ error, isLoading: false, isLoadingProgress: false, isLoadingActivity: false }),
      
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      
      setWelcomeModalOpen: (welcomeModalOpen) => set({ welcomeModalOpen }),
      
      toggleSidebar: () => {
        const { sidebarCollapsed } = get();
        set({ sidebarCollapsed: !sidebarCollapsed });
      },
      
      clearError: () => set({ error: null }),
      
      reset: () => set(initialState),
      
      // Async actions
      initializeDashboard: async () => {
        const { fetchUserProgress, fetchRecentActivity } = get();
        set({ isLoading: true });
        
        try {
          await Promise.all([
            fetchUserProgress(),
            fetchRecentActivity()
          ]);
        } catch (err) {
          console.error('Failed to initialize dashboard:', err);
          set({ error: 'Failed to load dashboard data' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      fetchUserProgress: async () => {
        set({ isLoadingProgress: true });
        
        try {
          // Fetch user progress from API
          const response = await fetch('/api/users/me/progress', {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch user progress');
          }
          
          const data = await response.json();
          
          const userProgress: UserProgress = {
            level: data.level || 1,
            xp: data.xp || 0,
            completedScenarios: data.completedScenarios || 0,
            totalScenarios: data.totalScenarios || 50,
            streakDays: data.streakDays || 0,
            lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : new Date()
          };
          
          set({ userProgress });
        } catch (err) {
          console.error('Failed to fetch user progress:', err);
          // Fallback to mock data for development
          const mockProgress: UserProgress = {
            level: 1,
            xp: 0,
            completedScenarios: 0,
            totalScenarios: 50,
            streakDays: 0,
            lastLoginAt: new Date()
          };
          set({ userProgress: mockProgress });
        } finally {
          set({ isLoadingProgress: false });
        }
      },
      
      fetchRecentActivity: async () => {
        set({ isLoadingActivity: true });
        
        try {
          // Fetch recent activity from API
          const response = await fetch('/api/users/me/activity', {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch recent activity');
          }
          
          const data = await response.json();
          
          const recentActivity: Activity[] = data.map((item: any) => ({
            id: item.id,
            type: item.type,
            description: item.description,
            createdAt: new Date(item.createdAt),
            xpEarned: item.xpEarned
          }));
          
          set({ recentActivity });
        } catch (err) {
          console.error('Failed to fetch recent activity:', err);
          // Fallback to empty array for development
          set({ recentActivity: [] });
        } finally {
          set({ isLoadingActivity: false });
        }
      },
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        welcomeModalOpen: state.welcomeModalOpen,
      }),
    }
  )
);