#!/bin/bash

# IT Helpdesk Simulator - Production Deployment Script
# This script deploys the application to production environment

set -e  # Exit on any error

echo "🚀 Starting IT Helpdesk Simulator Production Deployment"
echo "====================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
print_status "Checking required files..."
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_warning "Please copy .env.production template and configure with your production values"
    exit 1
fi

if [ ! -f "docker-compose.production.yml" ]; then
    print_error "docker-compose.production.yml not found!"
    exit 1
fi

if [ ! -f "nginx/production.conf" ]; then
    print_error "nginx/production.conf not found!"
    exit 1
fi

print_success "Required files found"

# Check for SSL certificates
print_status "Checking SSL certificates..."
if [ ! -d "nginx/ssl" ] || [ ! -f "nginx/ssl/your-domain.com.crt" ] || [ ! -f "nginx/ssl/your-domain.com.key" ]; then
    print_warning "SSL certificates not found in nginx/ssl/"
    print_warning "Please ensure you have:"
    print_warning "  - nginx/ssl/your-domain.com.crt"
    print_warning "  - nginx/ssl/your-domain.com.key"
    print_warning "Continuing without SSL (HTTPS will not work)"
fi

# Check if Docker is running
print_status "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Check if Docker Compose is available
print_status "Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose not found. Please install Docker Compose."
    exit 1
fi
print_success "Docker Compose is available"

# Check if we're in Docker Swarm mode for production scaling
print_status "Checking Docker Swarm mode..."
if ! docker info | grep -q "Swarm: active"; then
    print_warning "Docker Swarm is not active. Production scaling will be limited."
    print_warning "To enable Docker Swarm: docker swarm init"
    USE_SWARM=false
else
    print_success "Docker Swarm is active"
    USE_SWARM=true
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down || true
print_success "Existing containers stopped"

# Pull latest images and rebuild
print_status "Building application images..."
docker-compose -f docker-compose.production.yml build --no-cache
print_success "Application images built"

# Start services
if [ "$USE_SWARM" = true ]; then
    print_status "Deploying to Docker Swarm..."
    docker stack deploy -c docker-compose.production.yml helpdesk-prod
    print_success "Services deployed to Docker Swarm"
    
    # Wait for services to be running
    print_status "Waiting for services to be ready..."
    sleep 60
    
    # Check service status
    print_status "Checking service status..."
    docker service ls --filter label=com.docker.stack.namespace=helpdesk-prod
else
    print_status "Starting services with Docker Compose..."
    docker-compose -f docker-compose.production.yml up -d
    print_success "Services started"
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 45
fi

# Health checks
print_status "Performing health checks..."

# Check Nginx health
print_status "Checking Nginx health..."
for i in {1..30}; do
    if curl -f http://localhost:80/nginx-health > /dev/null 2>&1; then
        print_success "Nginx is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Nginx health check failed"
        if [ "$USE_SWARM" = true ]; then
            docker service logs helpdesk-prod_nginx
        else
            docker-compose -f docker-compose.production.yml logs nginx
        fi
        exit 1
    fi
    sleep 2
done

# Check if HTTPS is available (if SSL certificates exist)
if [ -f "nginx/ssl/your-domain.com.crt" ]; then
    print_status "Checking HTTPS health..."
    for i in {1..30}; do
        if curl -f -k https://localhost:443/nginx-health > /dev/null 2>&1; then
            print_success "HTTPS is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "HTTPS health check failed (this is expected if SSL is not properly configured)"
        fi
        sleep 2
    done
fi

# Display deployment information
echo ""
echo "🎉 PRODUCTION DEPLOYMENT SUCCESSFUL!"
echo "===================================="
echo ""
echo "Services are running at:"
if [ "$USE_SWARM" = true ]; then
    echo "🏢 Deployment Mode:  Docker Swarm"
    echo "📊 Service Status:   docker service ls"
    echo "📋 Service Logs:     docker service logs helpdesk-prod_<service>"
    echo "🔧 Scale Services:   docker service scale helpdesk-prod_api=3"
else
    echo "🏢 Deployment Mode:  Docker Compose"
    echo "📊 Service Status:   docker-compose -f docker-compose.production.yml ps"
    echo "📋 Service Logs:     docker-compose -f docker-compose.production.yml logs -f"
fi

echo ""
echo "🌐 Web Application: http://localhost (or your domain)"
if [ -f "nginx/ssl/your-domain.com.crt" ]; then
    echo "🔒 HTTPS:           https://localhost (or your domain)"
fi
echo "🔍 Health Check:    http://localhost/nginx-health"
echo ""

echo "⚠️  IMPORTANT PRODUCTION NOTES:"
echo "================================"
echo "1. 🗃️  Database: Use managed database service (AWS RDS, Google Cloud SQL)"
echo "2. 🔄 Redis: Use managed Redis service (AWS ElastiCache, Redis Cloud)"
echo "3. 🔒 SSL/TLS: Configure proper SSL certificates for your domain"
echo "4. 🌐 DNS: Point your domain to this server"
echo "5. 🔐 Secrets: Ensure all secrets in .env.production are secure"
echo "6. 📊 Monitoring: Set up monitoring and alerting"
echo "7. 💾 Backups: Configure automated backups"
echo "8. 🔄 Updates: Plan for zero-downtime deployments"
echo ""

print_success "Production deployment completed successfully!"

# Cleanup old images to save space
print_status "Cleaning up old Docker images..."
docker image prune -f
print_success "Cleanup completed"