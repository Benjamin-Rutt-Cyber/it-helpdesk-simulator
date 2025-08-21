# Tech Stack

## Technology Stack Table

| Category                | Technology             | Version    | Purpose                            | Rationale                                                                         |
| ----------------------- | ---------------------- | ---------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| Frontend Language       | TypeScript             | 5.3+       | Type-safe frontend development     | Ensures code quality and developer productivity for complex state management      |
| Frontend Framework      | Next.js                | 14.2+      | React-based fullstack framework    | Optimal performance with App Router, built-in API routes, and Vercel optimization |
| UI Component Library    | shadcn/ui              | 0.8+       | Professional component system      | Provides consistent, accessible components with professional styling              |
| State Management        | Zustand                | 4.4+       | Lightweight state management       | Perfect for real-time chat state and user progress tracking                       |
| Backend Language        | Node.js                | 20.11+ LTS | JavaScript runtime                 | Enables shared types and utilities between frontend and backend                   |
| Backend Framework       | Express.js             | 4.18+      | Web application framework          | Mature, well-documented solution for API and WebSocket management                 |
| API Style               | REST + WebSocket       | -          | Hybrid communication               | REST for standard operations, WebSocket for real-time chat                        |
| Database                | PostgreSQL             | 15+        | Relational database                | Supports complex queries for analytics and ACID compliance for user data          |
| Cache                   | Redis                  | 7.0+       | In-memory caching                  | Essential for session management and real-time chat performance                   |
| File Storage            | AWS S3                 | -          | Object storage                     | Scenario assets, user uploads, and static content                                 |
| Authentication          | NextAuth.js            | 4.24+      | Authentication framework           | Comprehensive auth solution with session management                               |
| AI Service              | OpenAI API             | GPT-4      | Customer simulation                | Most capable language model for realistic conversation simulation                 |
| Frontend Testing        | Jest + Testing Library | 29.7+      | Unit and integration testing       | Industry standard for React component testing                                     |
| Backend Testing         | Jest + Supertest       | 29.7+      | API testing                        | Comprehensive testing for Express.js APIs                                         |
| E2E Testing             | Playwright             | 1.40+      | End-to-end testing                 | Reliable testing for complex user flows with real-time features                   |
| Build Tool              | Turborepo              | 1.10+      | Monorepo build orchestration       | Optimized builds with intelligent caching                                         |
| Bundler                 | Webpack                | 5.89+      | Module bundling                    | Built into Next.js with custom optimizations                                      |
| Real-time Communication | Socket.IO              | 4.7+       | WebSocket management               | Reliable real-time communication with fallback support                            |
| CI/CD                   | GitHub Actions         | -          | Automated deployment               | Integrated with Vercel and supports comprehensive testing                         |
| Monitoring              | DataDog                | -          | Application performance monitoring | Comprehensive observability for real-time and AI services                         |
| Logging                 | Winston                | 3.11+      | Structured logging                 | Professional logging with multiple transport options                              |
| CSS Framework           | Tailwind CSS           | 3.3+       | Utility-first CSS                  | Rapid development with consistent professional styling                            |
