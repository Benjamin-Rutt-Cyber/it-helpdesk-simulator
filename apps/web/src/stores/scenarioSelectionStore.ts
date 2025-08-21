import { create } from 'zustand';
import { ScenarioCardData } from '@/components/scenarios/ScenarioCard';

interface ScenarioProgress {
  userId: string;
  scenarioId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  completionDate?: Date;
  score?: number;
  attempts: number;
  timeSpent: number;
  lastAttemptDate?: Date;
  prerequisitesMet: boolean;
  unlockedDate?: Date;
}

interface ScenarioRecommendation {
  scenarioId: string;
  scenario: any;
  relevanceScore: number;
  difficultyScore: number;
  engagementScore: number;
  learningScore: number;
  compositeScore: number;
  reasoning: string[];
  estimatedCompletionTime: number;
  expectedDifficulty: 'easy' | 'appropriate' | 'challenging';
  learningObjectives: string[];
  prerequisites: {
    met: boolean;
    missing: string[];
  };
}

interface ProgressSummary {
  userId: string;
  totalScenarios: number;
  completedScenarios: number;
  inProgressScenarios: number;
  availableScenarios: number;
  lockedScenarios: number;
  completionRate: number;
  averageScore: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  categoryProgress: Record<string, {
    total: number;
    completed: number;
    averageScore: number;
  }>;
  difficultyProgress: Record<'starter' | 'intermediate' | 'advanced', {
    total: number;
    completed: number;
    averageScore: number;
  }>;
}

interface ScenarioSelectionState {
  // Data
  scenarios: ScenarioCardData[];
  recommendations: ScenarioRecommendation[];
  userProgress: ProgressSummary | null;
  selectedScenario: ScenarioCardData | null;
  previewScenario: any | null;

  // UI State
  loading: boolean;
  loadingProgress: boolean;
  loadingRecommendations: boolean;
  loadingPreview: boolean;
  error: string | null;
  isPreviewOpen: boolean;

  // Filter State
  filters: {
    status: 'all' | 'available' | 'in_progress' | 'completed' | 'locked';
    difficulty: 'all' | 'starter' | 'intermediate' | 'advanced';
    category: string;
    search: string;
    sortBy: 'title' | 'difficulty' | 'time' | 'xp' | 'status';
  };

  // Actions
  setScenarios: (scenarios: ScenarioCardData[]) => void;
  setRecommendations: (recommendations: ScenarioRecommendation[]) => void;
  setUserProgress: (progress: ProgressSummary) => void;
  setSelectedScenario: (scenario: ScenarioCardData | null) => void;
  setPreviewScenario: (scenario: any | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (loading: boolean) => void;
  setLoadingRecommendations: (loading: boolean) => void;
  setLoadingPreview: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsPreviewOpen: (isOpen: boolean) => void;
  setFilters: (filters: Partial<ScenarioSelectionState['filters']>) => void;
  clearFilters: () => void;

  // API Actions
  fetchScenarios: () => Promise<void>;
  fetchUserProgress: (userId: string) => Promise<void>;
  fetchRecommendations: (userId: string) => Promise<void>;
  fetchScenarioPreview: (scenarioId: string) => Promise<void>;
  startScenario: (scenarioId: string) => Promise<void>;
  updateScenarioProgress: (scenarioId: string, progress: Partial<ScenarioProgress>) => void;

  // Computed
  getFilteredScenarios: () => ScenarioCardData[];
  getScenarioById: (scenarioId: string) => ScenarioCardData | undefined;
  getProgressByCategory: () => Record<string, { completed: number; total: number; percentage: number }>;
  getProgressByDifficulty: () => Record<string, { completed: number; total: number; percentage: number }>;
}

const defaultFilters = {
  status: 'all' as const,
  difficulty: 'all' as const,
  category: 'all',
  search: '',
  sortBy: 'status' as const,
};

export const useScenarioSelectionStore = create<ScenarioSelectionState>((set, get) => ({
  // Initial State
  scenarios: [],
  recommendations: [],
  userProgress: null,
  selectedScenario: null,
  previewScenario: null,
  loading: false,
  loadingProgress: false,
  loadingRecommendations: false,
  loadingPreview: false,
  error: null,
  isPreviewOpen: false,
  filters: defaultFilters,

  // Basic Setters
  setScenarios: (scenarios) => set({ scenarios }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setUserProgress: (userProgress) => set({ userProgress }),
  setSelectedScenario: (selectedScenario) => set({ selectedScenario }),
  setPreviewScenario: (previewScenario) => set({ previewScenario }),
  setLoading: (loading) => set({ loading }),
  setLoadingProgress: (loadingProgress) => set({ loadingProgress }),
  setLoadingRecommendations: (loadingRecommendations) => set({ loadingRecommendations }),
  setLoadingPreview: (loadingPreview) => set({ loadingPreview }),
  setError: (error) => set({ error }),
  setIsPreviewOpen: (isPreviewOpen) => set({ isPreviewOpen }),

  // Filter Management
  setFilters: (newFilters) => 
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters } 
    })),
  
  clearFilters: () => set({ filters: defaultFilters }),

  // API Actions
  fetchScenarios: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/scenarios');
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      
      const data = await response.json();
      const scenarios: ScenarioCardData[] = data.data.map((scenario: any) => ({
        id: scenario.id,
        title: scenario.title,
        description: scenario.description,
        difficulty: scenario.difficulty,
        estimatedTime: scenario.estimatedTime,
        xpReward: scenario.xpReward,
        status: 'available', // Will be updated by progress fetch
        category: scenario.ticketTemplate?.category || 'General',
        tags: scenario.tags || [],
        prerequisitesMet: true, // Will be updated by progress fetch
      }));
      
      set({ scenarios, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
    }
  },

  fetchUserProgress: async (userId: string) => {
    set({ loadingProgress: true, error: null });
    try {
      const response = await fetch(`/api/scenarios/progress?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user progress');
      
      const data = await response.json();
      const userProgress: ProgressSummary = data.data;
      
      // Update scenario statuses based on progress
      const scenarios = get().scenarios.map(scenario => {
        // This would need to be enhanced with actual progress data
        return scenario;
      });
      
      set({ userProgress, scenarios, loadingProgress: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loadingProgress: false 
      });
    }
  },

  fetchRecommendations: async (userId: string) => {
    set({ loadingRecommendations: true, error: null });
    try {
      const response = await fetch(`/api/scenarios/recommendations?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      const recommendations: ScenarioRecommendation[] = data.data;
      
      set({ recommendations, loadingRecommendations: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loadingRecommendations: false 
      });
    }
  },

  fetchScenarioPreview: async (scenarioId: string) => {
    set({ loadingPreview: true, error: null });
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/preview`);
      if (!response.ok) throw new Error('Failed to fetch scenario preview');
      
      const data = await response.json();
      const previewScenario = data.data;
      
      set({ previewScenario, loadingPreview: false, isPreviewOpen: true });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loadingPreview: false 
      });
    }
  },

  startScenario: async (scenarioId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to start scenario');
      
      const data = await response.json();
      
      // Update scenario status to in_progress
      const scenarios = get().scenarios.map(scenario => 
        scenario.id === scenarioId 
          ? { ...scenario, status: 'in_progress' as const }
          : scenario
      );
      
      set({ scenarios, loading: false, isPreviewOpen: false });
      
      // Navigate to scenario (this would be handled by the component)
      return data.data;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
      throw error;
    }
  },

  updateScenarioProgress: (scenarioId: string, progress: Partial<ScenarioProgress>) => {
    const scenarios = get().scenarios.map(scenario => 
      scenario.id === scenarioId 
        ? { 
            ...scenario, 
            status: progress.status || scenario.status,
            score: progress.score || scenario.score,
            attempts: progress.attempts || scenario.attempts,
            completionDate: progress.completionDate || scenario.completionDate,
          }
        : scenario
    );
    
    set({ scenarios });
  },

  // Computed Values
  getFilteredScenarios: () => {
    const { scenarios, filters } = get();
    
    return scenarios.filter(scenario => {
      // Status filter
      if (filters.status !== 'all' && scenario.status !== filters.status) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty !== 'all' && scenario.difficulty !== filters.difficulty) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && scenario.category !== filters.category) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        return (
          scenario.title.toLowerCase().includes(query) ||
          scenario.description.toLowerCase().includes(query) ||
          scenario.category.toLowerCase().includes(query) ||
          scenario.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      return true;
    }).sort((a, b) => {
      // Sort logic
      switch (filters.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'difficulty':
          const diffOrder = { starter: 1, intermediate: 2, advanced: 3 };
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        case 'time':
          return a.estimatedTime - b.estimatedTime;
        case 'xp':
          return b.xpReward - a.xpReward;
        case 'status':
          const statusOrder = { available: 1, in_progress: 2, completed: 3, locked: 4 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });
  },

  getScenarioById: (scenarioId: string) => {
    return get().scenarios.find(scenario => scenario.id === scenarioId);
  },

  getProgressByCategory: () => {
    const { scenarios } = get();
    const categories: Record<string, { completed: number; total: number; percentage: number }> = {};
    
    scenarios.forEach(scenario => {
      const category = scenario.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { completed: 0, total: 0, percentage: 0 };
      }
      
      categories[category].total++;
      if (scenario.status === 'completed') {
        categories[category].completed++;
      }
    });
    
    // Calculate percentages
    Object.keys(categories).forEach(category => {
      const { completed, total } = categories[category];
      categories[category].percentage = total > 0 ? (completed / total) * 100 : 0;
    });
    
    return categories;
  },

  getProgressByDifficulty: () => {
    const { scenarios } = get();
    const difficulties: Record<string, { completed: number; total: number; percentage: number }> = {
      starter: { completed: 0, total: 0, percentage: 0 },
      intermediate: { completed: 0, total: 0, percentage: 0 },
      advanced: { completed: 0, total: 0, percentage: 0 },
    };
    
    scenarios.forEach(scenario => {
      const difficulty = scenario.difficulty;
      difficulties[difficulty].total++;
      if (scenario.status === 'completed') {
        difficulties[difficulty].completed++;
      }
    });
    
    // Calculate percentages
    Object.keys(difficulties).forEach(difficulty => {
      const { completed, total } = difficulties[difficulty];
      difficulties[difficulty].percentage = total > 0 ? (completed / total) * 100 : 0;
    });
    
    return difficulties;
  },
}));