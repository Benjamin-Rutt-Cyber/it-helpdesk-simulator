# Database Setup Guide

## PostgreSQL Installation

### Option 1: Local Installation

#### macOS (using Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows

1. Download PostgreSQL 15 from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the postgres user

### Option 2: Docker Setup (Recommended for Development)

Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: it_helpdesk_simulator
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start the database:

```bash
docker-compose up -d postgres
```

## Database Configuration

1. Copy the environment template:

```bash
cp .env.template .env
```

2. Update the DATABASE_URL in your `.env` file:

### For Local Installation:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/it_helpdesk_simulator"
```

### For Docker Setup:

```env
DATABASE_URL="postgresql://admin:password@localhost:5432/it_helpdesk_simulator"
```

## Testing Database Connection

1. Start the API server:

```bash
npm run dev
```

2. Check the database health:

```bash
curl http://localhost:3001/health/database
```

You should see a response indicating the database configuration status.

## Next Steps

In future stories, we will:

- Set up Prisma schema and migrations
- Create the actual database tables
- Implement proper connection pooling
- Add database connection testing
