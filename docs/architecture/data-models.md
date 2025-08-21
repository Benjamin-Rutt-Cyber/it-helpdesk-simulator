# Data Models

## User Model

**Purpose:** Represents system users with authentication, progress tracking, and performance history

**Key Attributes:**

- `id`: UUID - Primary identifier
- `email`: String - Authentication and communication
- `passwordHash`: String - Secure password storage
- `profile`: Object - Name, preferences, and settings
- `level`: Integer - Current gamification level
- `xp`: Integer - Total experience points earned
- `createdAt`: DateTime - Account creation timestamp
- `lastLoginAt`: DateTime - Last authentication time

**TypeScript Interface:**

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  profile: {
    firstName: string;
    lastName: string;
    timezone: string;
    preferences: UserPreferences;
  };
  level: number;
  xp: number;
  createdAt: Date;
  lastLoginAt: Date;
  // Navigation properties
  sessions: UserSession[];
  achievements: UserAchievement[];
  performanceMetrics: PerformanceMetric[];
}
```

**Relationships:**

- One-to-many with UserSession (chat sessions)
- One-to-many with UserAchievement (earned achievements)
- One-to-many with PerformanceMetric (performance history)

## Scenario Model

**Purpose:** Defines learning scenarios with complete context, personas, and assessment criteria

**Key Attributes:**

- `id`: UUID - Primary identifier
- `title`: String - Scenario display name
- `description`: String - Scenario overview
- `difficulty`: Enum - Starter, Intermediate, Advanced
- `estimatedTime`: Integer - Expected completion time in minutes
- `xpReward`: Integer - XP points for completion
- `ticketTemplate`: Object - Ticket structure and content
- `customerPersona`: Object - AI persona definition
- `knowledgeBaseEntries`: Array - Curated search results
- `assessmentCriteria`: Object - Scoring rubric

**TypeScript Interface:**

```typescript
interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'starter' | 'intermediate' | 'advanced';
  estimatedTime: number;
  xpReward: number;
  ticketTemplate: {
    priority: 'low' | 'medium' | 'high';
    category: string;
    description: string;
    customerInfo: CustomerInfo;
    technicalContext: TechnicalContext;
  };
  customerPersona: {
    name: string;
    personality: PersonalityTraits;
    technicalLevel: 'novice' | 'intermediate' | 'advanced';
    communicationStyle: CommunicationStyle;
  };
  knowledgeBaseEntries: KnowledgeBaseEntry[];
  assessmentCriteria: AssessmentCriteria;
  prerequisites: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**

- One-to-many with UserSession (scenario instances)
- Many-to-many with prerequisite scenarios

## UserSession Model

**Purpose:** Tracks individual user interactions with scenarios including chat history and performance data

**Key Attributes:**

- `id`: UUID - Primary identifier
- `userId`: UUID - Associated user
- `scenarioId`: UUID - Associated scenario
- `status`: Enum - Active, Completed, Abandoned
- `startedAt`: DateTime - Session start time
- `completedAt`: DateTime - Session completion time
- `chatHistory`: Array - Complete conversation log
- `performanceData`: Object - Real-time performance metrics
- `verificationStatus`: Object - Identity verification progress
- `resolutionData`: Object - Final resolution and documentation

**TypeScript Interface:**

```typescript
interface UserSession {
  id: string;
  userId: string;
  scenarioId: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  chatHistory: ChatMessage[];
  performanceData: {
    responseTime: number[];
    verificationScore: number;
    communicationScore: number;
    technicalScore: number;
    researchScore: number;
  };
  verificationStatus: {
    nameVerified: boolean;
    usernameVerified: boolean;
    assetTagVerified: boolean;
  };
  resolutionData?: {
    resolutionType: 'resolved' | 'escalated';
    documentation: string;
    customerSatisfaction: number;
  };
}
```

**Relationships:**

- Many-to-one with User
- Many-to-one with Scenario
- One-to-many with ChatMessage
