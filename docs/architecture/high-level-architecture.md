# High Level Architecture

## Technical Summary

The IT Helpdesk Simulator employs a modern fullstack architecture built on a Jamstack + Real-time Services foundation using Next.js 14+ with App Router for the frontend and Express.js with Socket.IO for real-time backend services. The system integrates OpenAI's API for AI-powered customer simulation while maintaining conversation context and performance tracking in PostgreSQL with Redis caching.

The architecture supports 10,000+ concurrent users through horizontal scaling on Vercel/AWS with managed database services from Supabase. Security is implemented through NextAuth.js with SOC 2 compliance, while the gamification system tracks detailed performance metrics across five key competency areas. The monorepo structure using Turborepo enables efficient development while maintaining clear separation between frontend presentation, backend services, shared utilities, and AI simulation logic.

## Platform and Infrastructure Choice

**Platform:** Vercel + Supabase + AWS (Hybrid Cloud)

**Key Services:**

- **Vercel:** Frontend hosting, serverless functions, edge optimization
- **Supabase:** Managed PostgreSQL, real-time subscriptions, authentication
- **AWS:** Redis ElastiCache, S3 storage, CloudFront CDN
- **OpenAI:** GPT-4 API for customer simulation
- **Socket.IO:** Real-time chat infrastructure

**Deployment Host and Regions:** Multi-region deployment with primary in Sydney (Australia), secondary in Singapore (Asia-Pacific), and US East (global reach)

**Rationale:** This hybrid approach provides optimal performance for Australian users while maintaining global scalability. Vercel offers excellent Next.js optimization, Supabase provides managed PostgreSQL with real-time capabilities, and AWS fills gaps for caching and content delivery.
