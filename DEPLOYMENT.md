# IT Helpdesk Simulator - Deployment Guide

This guide covers deploying the IT Helpdesk Simulator to staging and production environments using Docker containers.

## 🏗️ Architecture Overview

The application uses a microservices architecture with the following components:

- **Web Frontend**: Next.js application serving the user interface
- **API Backend**: Express.js server with Socket.IO for real-time communication
- **Database**: PostgreSQL for data persistence
- **Cache**: Redis for session management and caching
- **Reverse Proxy**: Nginx for load balancing and SSL termination

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Domain name (for production SSL)
- SSL certificate (for production HTTPS)

## 🧪 Staging Deployment

### 1. Environment Setup

Copy the staging environment template:

```bash
cp .env.staging.example .env.staging
```

Configure your staging environment variables in `.env.staging`:

```env
# Database Configuration
DATABASE_URL=postgresql://staging_user:staging_password@database:5432/it_helpdesk_simulator_staging

# Redis Configuration
REDIS_URL=redis://redis:6379

# OpenAI Configuration
OPENAI_API_KEY=your_staging_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo

# Application Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
SESSION_SECRET=your_staging_session_secret
JWT_SECRET=your_staging_jwt_secret

# Environment
NODE_ENV=staging
```

### 2. Deploy to Staging

Run the staging deployment script:

```bash
./deploy-staging.sh
```

The script will:

1. ✅ Check required files and Docker installation
2. 🏗️ Build application images
3. 🗃️ Start database and Redis services
4. 🔄 Run database migrations
5. 🚀 Start all services
6. 🔍 Perform health checks

### 3. Access Staging Environment

- **Web Application**: http://localhost:3000
- **API Endpoint**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 4. Staging Commands

```bash
# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Stop services
docker-compose -f docker-compose.staging.yml down

# Check service status
docker-compose -f docker-compose.staging.yml ps

# Access database
docker-compose -f docker-compose.staging.yml exec database psql -U staging_user -d it_helpdesk_simulator_staging
```

## 🚀 Production Deployment

### 1. SSL Certificate Setup

Run the SSL setup script:

```bash
./scripts/setup-ssl.sh
```

Choose from:

- **Let's Encrypt** (Free, automated)
- **Commercial Certificate** (Paid, manual)
- **Self-Signed** (Development only)

### 2. Environment Setup

Copy the production environment template:

```bash
cp .env.production.example .env.production
```

Configure your production environment variables in `.env.production`:

```env
# Database Configuration (Use managed service)
DATABASE_URL=postgresql://username:password@your-db-host:5432/database_name

# Redis Configuration (Use managed service)
REDIS_URL=redis://your-redis-host:6379

# OpenAI Configuration
OPENAI_API_KEY=your_production_openai_api_key
OPENAI_MODEL=gpt-4

# Application Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com
SESSION_SECRET=your_secure_session_secret
JWT_SECRET=your_secure_jwt_secret

# Security
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Environment
NODE_ENV=production
```

### 3. Update Configuration

Update `nginx/production.conf` with your domain:

```nginx
server_name your-domain.com www.your-domain.com;
```

### 4. Deploy to Production

Run the production deployment script:

```bash
./deploy-production.sh
```

The script will:

1. ✅ Validate configuration and certificates
2. 🏗️ Build optimized production images
3. 🚀 Deploy with Docker Swarm (if available) or Docker Compose
4. 🔍 Perform comprehensive health checks
5. 🧹 Clean up old images

### 5. Access Production Environment

- **Web Application**: https://your-domain.com
- **Health Check**: https://your-domain.com/nginx-health

## 📊 Monitoring & Maintenance

### Service Management

**Docker Swarm (Recommended for Production):**

```bash
# View services
docker service ls

# View service logs
docker service logs helpdesk-prod_api

# Scale services
docker service scale helpdesk-prod_api=3
docker service scale helpdesk-prod_web=2

# Update service
docker service update --image your-registry/api:latest helpdesk-prod_api
```

**Docker Compose:**

```bash
# View services
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Scale services
docker-compose -f docker-compose.production.yml up -d --scale api=3 --scale web=2
```

### Health Checks

```bash
# Nginx health
curl https://your-domain.com/nginx-health

# API health
curl https://your-domain.com/api/health

# Service status
curl https://your-domain.com/api/status
```

### SSL Certificate Renewal

**Let's Encrypt Auto-Renewal:**

```bash
# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/your-domain.com.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/your-domain.com.key
docker service update --force helpdesk-prod_nginx
```

## 🔧 Troubleshooting

### Common Issues

**1. Services Won't Start**

```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs

# Check resource usage
docker stats

# Restart services
docker-compose -f docker-compose.staging.yml restart
```

**2. Database Connection Issues**

```bash
# Check database health
docker-compose -f docker-compose.staging.yml exec database pg_isready

# Reset database
docker-compose -f docker-compose.staging.yml down -v
docker-compose -f docker-compose.staging.yml up -d
```

**3. SSL Certificate Issues**

```bash
# Verify certificate
openssl x509 -in nginx/ssl/your-domain.com.crt -text -noout

# Check certificate validity
curl -I https://your-domain.com
```

**4. Performance Issues**

```bash
# Monitor resource usage
docker stats

# Scale services
docker service scale helpdesk-prod_api=3

# Check nginx logs
docker service logs helpdesk-prod_nginx
```

### Rollback Procedure

**Docker Swarm:**

```bash
# Rollback to previous version
docker service rollback helpdesk-prod_api
docker service rollback helpdesk-prod_web
```

**Docker Compose:**

```bash
# Stop current deployment
docker-compose -f docker-compose.production.yml down

# Rebuild with previous tag
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

## 🔐 Security Considerations

1. **Environment Variables**: Store sensitive data in secure vaults
2. **Network Security**: Use private networks for service communication
3. **SSL/TLS**: Always use HTTPS in production
4. **Database**: Use managed database services with encryption
5. **Rate Limiting**: Configure appropriate rate limits in Nginx
6. **Monitoring**: Set up comprehensive logging and alerting
7. **Backups**: Implement automated backup strategies
8. **Updates**: Keep all dependencies and base images updated

## 📈 Performance Optimization

1. **Horizontal Scaling**: Scale API and Web services based on load
2. **Database Optimization**: Use connection pooling and read replicas
3. **Caching**: Implement Redis caching for frequently accessed data
4. **CDN**: Use a CDN for static assets
5. **Monitoring**: Set up performance monitoring and alerting

## 🚀 CI/CD Integration

The deployment scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Production
        run: ./deploy-production.sh
```

---

For additional support or questions, please refer to the project documentation or create an issue in the repository.
