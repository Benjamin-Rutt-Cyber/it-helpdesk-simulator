# Frontend Architecture

## Component Architecture

### Component Organization

```
apps/web/src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── progress.tsx
│   ├── auth/                  # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthProvider.tsx
│   ├── dashboard/             # Dashboard components
│   │   ├── DashboardLayout.tsx
│   │   ├── ProgressOverview.tsx
│   │   ├── RecentActivity.tsx
│   │   └── QuickActions.tsx
│   ├── chat/                  # Real-time chat components
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── ChatInput.tsx
│   ├── scenarios/             # Scenario management
│   │   ├── ScenarioList.tsx
│   │   ├── ScenarioCard.tsx
│   │   ├── DifficultyBadge.tsx
│   │   └── ProgressLock.tsx
│   ├── tickets/               # Ticket interface
│   │   ├── TicketPanel.tsx
│   │   ├── CustomerInfo.tsx
│   │   ├── VerificationChecklist.tsx
│   │   └── ResolutionForm.tsx
│   ├── knowledge/             # Knowledge base search
│   │   ├── SearchInterface.tsx
│   │   ├── SearchResults.tsx
│   │   ├── CredibilityIndicator.tsx
│   │   └── SearchHistory.tsx
│   ├── performance/           # Performance tracking
│   │   ├── PerformanceSummary.tsx
│   │   ├── SkillBreakdown.tsx
│   │   ├── ProgressChart.tsx
│   │   └── FeedbackDisplay.tsx
│   └── gamification/          # Gamification elements
│       ├── XPProgress.tsx
│       ├── LevelBadge.tsx
│       ├── AchievementCard.tsx
│       └── LeaderboardEntry.tsx
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── useScenario.ts
│   ├── usePerformance.ts
│   └── useLocalStorage.ts
├── stores/                    # Zustand state management
│   ├── authStore.ts
│   ├── chatStore.ts
│   ├── scenarioStore.ts
│   └── performanceStore.ts
├── services/                  # API client services
│   ├── api.ts
│   ├── authService.ts
│   ├── scenarioService.ts
│   ├── chatService.ts
│   └── performanceService.ts
├── utils/                     # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   ├── constants.ts
│   └── helpers.ts
└── app/                       # Next.js App Router pages
    ├── layout.tsx
    ├── page.tsx
    ├── login/
    ├── dashboard/
    ├── scenarios/
    ├── chat/
    └── performance/
```

### Component Template

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ComponentProps {
    className?: string;
    variant?: 'default' | 'minimal' | 'detailed';
    onAction?: (data: any) => void;
}

export function ComponentTemplate({
    className,
    variant = 'default',
    onAction
}: ComponentProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        // Component initialization logic
        initializeComponent();
    }, []);

    const initializeComponent = async () => {
        setIsLoading(true);
        try {
            // Async initialization logic
            const result = await fetchData();
            setData(result);
        } catch (error) {
            console.error('Component initialization error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = (actionData: any) => {
        onAction?.(actionData);
    };

    if (isLoading) {
        return <div className="animate-pulse">Loading...</div>;
    }

    return (
        <Card className={cn('w-full', className)}>
            <CardHeader>
                <CardTitle>Component Title</CardTitle>
                <CardDescription>Component description</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Component content */}
                <Button onClick={handleAction} variant="default">
                    Action Button
                </Button>
            </CardContent>
        </Card>
    );
}
```

## State Management Architecture

### State Structure

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    timezone: string;
  };
  level: number;
  xp: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await authService.refreshToken(token);
          set({ token: response.token });
        } catch (error) {
          get().logout();
        }
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// stores/chatStore.ts
import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ChatState {
  socket: Socket | null;
  sessionId: string | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isTyping: boolean;
  customerPersona: any;
  // Actions
  initializeSocket: (sessionId: string) => void;
  sendMessage: (content: string) => void;
  addMessage: (message: ChatMessage) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
  disconnect: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  sessionId: null,
  messages: [],
  isConnected: false,
  isTyping: false,
  customerPersona: null,

  initializeSocket: (sessionId: string) => {
    const socket = io('/chat', {
      auth: { sessionId },
    });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('message', (message: ChatMessage) => {
      get().addMessage(message);
    });

    socket.on('typing', (isTyping: boolean) => {
      set({ isTyping });
    });

    set({ socket, sessionId });
  },

  sendMessage: (content: string) => {
    const { socket, sessionId } = get();
    if (!socket || !sessionId) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: 'user',
      senderType: 'user',
      content,
      timestamp: new Date(),
    };

    socket.emit('message', message);
    get().addMessage(message);
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setTyping: (isTyping: boolean) => {
    set({ isTyping });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({
      socket: null,
      sessionId: null,
      isConnected: false,
      messages: [],
    });
  },
}));
```

## Routing Architecture

### Route Organization

```
app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Landing page
├── login/
│   └── page.tsx              # Login page
├── register/
│   └── page.tsx              # Registration page
├── dashboard/
│   ├── layout.tsx            # Dashboard layout with navigation
│   ├── page.tsx              # Dashboard home
│   ├── scenarios/
│   │   ├── page.tsx          # Scenario selection
│   │   └── [id]/
│   │       └── page.tsx      # Individual scenario
│   ├── performance/
│   │   ├── page.tsx          # Performance overview
│   │   └── history/
│   │       └── page.tsx      # Performance history
│   └── settings/
│       └── page.tsx          # User settings
├── chat/
│   └── [sessionId]/
│       └── page.tsx          # Chat interface
├── api/                      # API routes
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── refresh/
│   ├── scenarios/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   ├── sessions/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   └── performance/
│       └── route.ts
└── globals.css               # Global styles
```

### Protected Route Pattern

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register');
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/chat');

  // Redirect authenticated users away from auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/chat/:path*', '/login', '/register'],
};
```

## Frontend Services Layer

### API Client Setup

```typescript
// services/api.ts
import { useAuthStore } from '@/stores/authStore';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = useAuthStore.getState().token;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        useAuthStore.getState().logout();
        throw new Error('Authentication required');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // HTTP methods
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
```

### Service Example

```typescript
// services/scenarioService.ts
import { apiClient } from './api';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'starter' | 'intermediate' | 'advanced';
  estimatedTime: number;
  xpReward: number;
  prerequisites: string[];
  isCompleted: boolean;
  isUnlocked: boolean;
}

export interface ScenarioSession {
  id: string;
  scenarioId: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
}

class ScenarioService {
  async getScenarios(difficulty?: string): Promise<Scenario[]> {
    const params = difficulty ? `?difficulty=${difficulty}` : '';
    return apiClient.get<Scenario[]>(`/scenarios${params}`);
  }

  async getScenario(id: string): Promise<Scenario> {
    return apiClient.get<Scenario>(`/scenarios/${id}`);
  }

  async startScenario(scenarioId: string): Promise<ScenarioSession> {
    return apiClient.post<ScenarioSession>(`/scenarios/${scenarioId}/start`);
  }

  async getSession(sessionId: string): Promise<ScenarioSession> {
    return apiClient.get<ScenarioSession>(`/sessions/${sessionId}`);
  }

  async completeSession(
    sessionId: string,
    resolution: {
      resolutionType: 'resolved' | 'escalated';
      documentation: string;
      escalationReason?: string;
    }
  ): Promise<void> {
    return apiClient.post(`/sessions/${sessionId}/resolve`, resolution);
  }

  async getUserProgress(): Promise<{
    completedScenarios: number;
    totalScenarios: number;
    level: number;
    xp: number;
  }> {
    return apiClient.get('/users/me/progress');
  }
}

export const scenarioService = new ScenarioService();
```
