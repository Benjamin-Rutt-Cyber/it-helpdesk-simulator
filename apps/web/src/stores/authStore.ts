import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  level: number;
  xp: number;
  timezone: string;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (_user: User) => void;
  setLoading: (_isLoading: boolean) => void;
  setError: (_error: string | null) => void;
  logout: () => void;
  clearError: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error, isLoading: false }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);