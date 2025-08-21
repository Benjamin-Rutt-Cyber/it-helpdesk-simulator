#!/bin/bash

# IT Helpdesk Simulator - Staging Deployment Script
# This script deploys the application to staging environment

set -e  # Exit on any error

echo "🚀 Starting IT Helpdesk Simulator Staging Deployment"
echo "=================================================="

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
if [ ! -f ".env.staging" ]; then
    print_error ".env.staging file not found!"
    print_warning "Please copy .env.staging template and configure with your staging values"
    exit 1
fi

if [ ! -f "docker-compose.staging.yml" ]; then
    print_error "docker-compose.staging.yml not found!"
    exit 1
fi

print_success "Required files found"

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

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.staging.yml down || true
print_success "Existing containers stopped"

# Pull latest images and rebuild
print_status "Building application images..."
docker-compose -f docker-compose.staging.yml build --no-cache
print_success "Application images built"

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.staging.yml up -d database redis
sleep 10  # Wait for database to be ready

# Wait for database to be healthy
print_status "Waiting for database to be ready..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose -f docker-compose.staging.yml exec database pg_isready -U staging_user -d it_helpdesk_simulator_staging > /dev/null 2>&1; then
        break
    fi
    sleep 1
    counter=$((counter + 1))
done

if [ $counter -eq $timeout ]; then
    print_error "Database failed to start within $timeout seconds"
    exit 1
fi
print_success "Database is ready"

# Run Prisma migrations
print_status "Running Prisma migrations..."
docker-compose -f docker-compose.staging.yml run --rm api npm run db:migrate || {
    print_warning "Migration failed, but continuing deployment..."
}

# Start all services
print_status "Starting all services..."
docker-compose -f docker-compose.staging.yml up -d
print_success "All services started"

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check API health
print_status "Checking API health..."
for i in {1..30}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "API is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "API health check failed"
        docker-compose -f docker-compose.staging.yml logs api
        exit 1
    fi
    sleep 2
done

# Check Web health
print_status "Checking Web application health..."
for i in {1..30}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Web application is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Web application health check failed"
        docker-compose -f docker-compose.staging.yml logs web
        exit 1
    fi
    sleep 2
done

# Display deployment information
echo ""
echo "🎉 STAGING DEPLOYMENT SUCCESSFUL!"
echo "================================="
echo ""
echo "Services are running at:"
echo "📱 Web Application: http://localhost:3000"
echo "🔧 API Endpoint:    http://localhost:3001"
echo "📊 API Health:      http://localhost:3001/health"
echo "🔍 API Status:      http://localhost:3001/api/status"
echo ""
echo "Useful commands:"
echo "📋 View logs:       docker-compose -f docker-compose.staging.yml logs -f"
echo "🔧 Stop services:   docker-compose -f docker-compose.staging.yml down"
echo "📊 Service status:  docker-compose -f docker-compose.staging.yml ps"
echo ""
print_success "Deployment completed successfully!"