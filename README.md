# IT Helpdesk Simulator

A comprehensive platform for learning IT support skills through realistic customer simulations powered by AI.

## 🏗️ Architecture

This project uses a **Turborepo monorepo** structure with:

- **Frontend**: Next.js 14+ with TypeScript and Tailwind CSS
- **Backend**: Express.js API with TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Build System**: Turborepo for optimized builds and caching

## 📁 Project Structure

```
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── api/                 # Express.js backend API
├── packages/                # Shared packages and utilities
├── docs/                    # Project documentation
│   ├── architecture/        # Architecture documentation
│   ├── prd/                # Product requirements
│   └── stories/            # Development stories
└── .bmad-core/             # Build and development tools
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20.11+ LTS
- npm 10.2+
- PostgreSQL 15+ (or Docker)

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd IT
npm install
```

2. **Set up environment variables:**

```bash
cp .env.template .env
# Edit .env with your configuration
```

3. **Set up database:**

```bash
# Option 1: Docker (Recommended)
docker-compose up -d postgres

# Option 2: Local PostgreSQL
# See DATABASE_SETUP.md for detailed instructions
```

4. **Start development servers:**

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
cd apps/web && npm run dev    # Frontend on http://localhost:3000
cd apps/api && npm run dev    # Backend on http://localhost:3001
```

## 🛠️ Development Workflow

### Available Scripts

```bash
# Development
npm run dev          # Start all development servers
npm run build        # Build all applications
npm run test         # Run all tests
npm run lint         # Lint all code
npm run format       # Format code with Prettier

# Individual app commands
cd apps/web
npm run dev          # Next.js development server
npm run build        # Build frontend
npm run test         # Run frontend tests

cd apps/api
npm run dev          # Express.js development server
npm run build        # Build backend
npm run test         # Run backend tests
```

### Code Quality

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **TypeScript** for type safety

Pre-commit hooks automatically:

- Lint and fix code issues
- Format code with Prettier
- Run type checking

## 🗄️ Database Setup

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database configuration instructions.

Quick setup with Docker:

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Update .env with:
DATABASE_URL="postgresql://admin:password@localhost:5432/it_helpdesk_simulator"
```

## 📊 Health Checks

The API provides health check endpoints:

```bash
# Overall system health
curl http://localhost:3001/health

# Database health specifically
curl http://localhost:3001/health/database
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Frontend tests
cd apps/web && npm run test

# Backend tests
cd apps/api && npm run test
```

## 🏭 Technology Stack

| Category           | Technology   | Version    | Purpose                         |
| ------------------ | ------------ | ---------- | ------------------------------- |
| Frontend Framework | Next.js      | 14.2+      | React-based fullstack framework |
| Frontend Language  | TypeScript   | 5.3+       | Type-safe development           |
| UI Framework       | Tailwind CSS | 3.3+       | Utility-first CSS               |
| UI Components      | shadcn/ui    | 0.8+       | Professional component system   |
| Backend Framework  | Express.js   | 4.18+      | Web application framework       |
| Backend Language   | Node.js      | 20.11+ LTS | JavaScript runtime              |
| Database           | PostgreSQL   | 15+        | Relational database             |
| Build Tool         | Turborepo    | 1.10+      | Monorepo build orchestration    |
| Package Manager    | npm          | 10.2+      | Dependency management           |

## 📝 Development Standards

### File Organization

- Use TypeScript for all new code
- Follow the established directory structure
- Place shared utilities in `packages/`
- Keep components small and focused

### Code Style

- Use Prettier for formatting (automatically applied)
- Follow ESLint rules (automatically checked)
- Use meaningful variable and function names
- Add TypeScript types for all functions

### Git Workflow

- Pre-commit hooks ensure code quality
- Commit messages should be descriptive
- Use feature branches for development

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process using port 3000/3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

#### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check DATABASE_URL in .env file
3. Verify database credentials
4. Check firewall settings

#### Node Version Issues

```bash
# Check Node version
node --version  # Should be 20.11+

# Use nvm to manage Node versions
nvm install 20.11
nvm use 20.11
```

#### Build Failures

```bash
# Clear all node_modules and reinstall
npm run clean
rm -rf node_modules
npm install
```

#### TypeScript Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Restart TypeScript server in your IDE
```

## 📚 Next Steps

1. **Development**: Start with the stories in `docs/stories/`
2. **Architecture**: Review `docs/architecture/` for system design
3. **Product Requirements**: See `docs/prd/` for feature specifications

## 🤝 Contributing

1. Follow the established coding standards
2. Write tests for new functionality
3. Update documentation as needed
4. Ensure all checks pass before committing

## 📄 License

[Add your license information here]
