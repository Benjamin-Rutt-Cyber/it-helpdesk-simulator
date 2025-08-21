# Components

## Authentication Service

**Responsibility:** Handles user authentication, session management, and security protocols

**Key Interfaces:**

- `POST /auth/login` - User authentication with email/password
- `POST /auth/register` - New user registration with email verification
- `POST /auth/logout` - Session termination and cleanup
- `POST /auth/refresh` - JWT token refresh
- `POST /auth/reset-password` - Password reset flow

**Dependencies:** NextAuth.js, Supabase Auth, Redis session store

**Technology Stack:** NextAuth.js 4.24+ with Supabase adapter, Redis for session storage, bcrypt for password hashing

## AI Conversation Engine

**Responsibility:** Manages AI-powered customer simulation with persona consistency and conversation context

**Key Interfaces:**

- `generateResponse(message, context, persona)` - Generate AI customer response
- `maintainPersona(sessionId, persona)` - Ensure persona consistency
- `updateConversationContext(sessionId, message)` - Update conversation state
- `handleVerificationRequest(sessionId, verificationType)` - Process verification attempts

**Dependencies:** OpenAI API, Conversation Context Manager, Persona Configuration

**Technology Stack:** OpenAI GPT-4 API, custom conversation management, Redis for conversation state

## Real-time Chat Service

**Responsibility:** Handles WebSocket connections, message delivery, and real-time communication

**Key Interfaces:**

- `establishConnection(userId, sessionId)` - Initialize WebSocket connection
- `sendMessage(sessionId, message)` - Deliver messages to connected clients
- `broadcastTypingIndicator(sessionId, isTyping)` - Manage typing indicators
- `handleDisconnection(connectionId)` - Clean up disconnected sessions

**Dependencies:** Socket.IO, Session Management, Message Queue

**Technology Stack:** Socket.IO 4.7+ with Redis adapter, message queuing for reliability

## Scenario Management Service

**Responsibility:** Loads, manages, and tracks user progress through learning scenarios

**Key Interfaces:**

- `loadScenario(scenarioId)` - Load scenario configuration
- `checkPrerequisites(userId, scenarioId)` - Validate scenario access
- `trackProgress(userId, scenarioId, progress)` - Update completion status
- `generateTicket(scenarioId, userId)` - Create scenario-specific ticket

**Dependencies:** Scenario Repository, User Progress Tracking, Ticket Generator

**Technology Stack:** PostgreSQL for scenario storage, JSON schema validation, caching layer

## Performance Analytics Engine

**Responsibility:** Calculates performance metrics, generates feedback, and tracks user improvement

**Key Interfaces:**

- `calculatePerformanceScore(sessionId, criteria)` - Compute multi-dimensional scores
- `generateFeedback(sessionId, performance)` - Create detailed feedback
- `trackImprovement(userId, timeframe)` - Analyze performance trends
- `generateReport(userId, format)` - Export performance data

**Dependencies:** Performance Calculator, Feedback Generator, Analytics Database

**Technology Stack:** PostgreSQL for metrics storage, analytics queries, report generation

## Gamification Engine

**Responsibility:** Manages XP, levels, achievements, and progress tracking

**Key Interfaces:**

- `awardXP(userId, amount, reason)` - Award experience points
- `checkLevelUp(userId)` - Process level advancement
- `unlockAchievement(userId, achievementId)` - Grant achievements
- `updateProgress(userId, activityType, value)` - Track progress metrics

**Dependencies:** User Progress Repository, Achievement Definitions, Level Calculator

**Technology Stack:** PostgreSQL for progress data, Redis for real-time updates, event system
