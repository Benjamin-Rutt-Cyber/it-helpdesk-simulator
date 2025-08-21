# Technical Assumptions

## Repository Structure

**Monorepo:** Single repository using Turborepo for efficient development workflow with clear separation between frontend and backend services while maintaining shared utilities and types.

## Service Architecture

**Modular Monolith:** Single deployable application with clear internal boundaries between authentication, simulation engine, scenario management, and analytics services. This approach supports rapid development while providing foundation for future microservices extraction.

## Testing Requirements

**Comprehensive Testing Strategy:** Unit testing for business logic, integration testing for API endpoints and database operations, end-to-end testing for critical user flows, and performance testing for real-time chat functionality.
