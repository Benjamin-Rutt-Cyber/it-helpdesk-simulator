#!/bin/bash

# IT Helpdesk Simulator - SSL Certificate Setup Script
# This script helps set up SSL certificates for production deployment

set -e

echo "🔒 IT Helpdesk Simulator SSL Certificate Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Create SSL directory
print_status "Creating SSL directory..."
mkdir -p nginx/ssl
print_success "SSL directory created"

echo ""
echo "📋 SSL Certificate Setup Options:"
echo "================================="
echo ""
echo "1. 🆓 Let's Encrypt (Recommended for production)"
echo "2. 🏢 Commercial Certificate (e.g., DigiCert, Comodo)"
echo "3. 🧪 Self-Signed Certificate (Development/Testing only)"
echo ""

read -p "Choose an option (1-3): " choice

case $choice in
    1)
        echo ""
        print_status "Setting up Let's Encrypt certificate..."
        echo ""
        echo "📝 Manual Let's Encrypt Setup Instructions:"
        echo "==========================================="
        echo ""
        echo "1. Install Certbot:"
        echo "   Ubuntu/Debian: sudo apt-get install certbot"
        echo "   CentOS/RHEL:   sudo yum install certbot"
        echo "   macOS:         brew install certbot"
        echo ""
        echo "2. Generate certificate (replace your-domain.com):"
        echo "   sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com"
        echo ""
        echo "3. Copy certificates to project:"
        echo "   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/your-domain.com.crt"
        echo "   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/your-domain.com.key"
        echo "   sudo chown \$USER:group nginx/ssl/*"
        echo ""
        echo "4. Set up auto-renewal:"
        echo "   sudo crontab -e"
        echo "   Add: 0 12 * * * /usr/bin/certbot renew --quiet"
        echo ""
        print_warning "Remember to replace 'your-domain.com' with your actual domain!"
        ;;
    2)
        echo ""
        print_status "Setting up commercial certificate..."
        echo ""
        echo "📝 Commercial Certificate Setup Instructions:"
        echo "============================================="
        echo ""
        echo "1. Purchase SSL certificate from a trusted CA"
        echo "2. Generate CSR (Certificate Signing Request):"
        echo "   openssl req -new -newkey rsa:2048 -nodes -keyout nginx/ssl/your-domain.com.key -out your-domain.com.csr"
        echo ""
        echo "3. Submit CSR to your certificate authority"
        echo "4. Download the issued certificate and intermediate certificates"
        echo "5. Combine certificates:"
        echo "   cat your-domain.com.crt intermediate.crt > nginx/ssl/your-domain.com.crt"
        echo ""
        echo "6. Ensure proper file permissions:"
        echo "   chmod 600 nginx/ssl/your-domain.com.key"
        echo "   chmod 644 nginx/ssl/your-domain.com.crt"
        ;;
    3)
        echo ""
        print_status "Generating self-signed certificate..."
        
        read -p "Enter your domain name (or localhost): " domain
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/your-domain.com.key \
            -out nginx/ssl/your-domain.com.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=$domain"
        
        print_success "Self-signed certificate generated"
        print_warning "Self-signed certificates should only be used for development/testing!"
        print_warning "Browsers will show security warnings for self-signed certificates."
        ;;
    *)
        print_error "Invalid option selected"
        exit 1
        ;;
esac

echo ""
echo "🔍 Next Steps:"
echo "============="
echo ""
echo "1. Verify certificate files exist:"
echo "   ls -la nginx/ssl/"
echo ""
echo "2. Update nginx/production.conf with your actual domain name"
echo "3. Update .env.production with your domain configuration"
echo "4. Run production deployment:"
echo "   ./deploy-production.sh"
echo ""
print_success "SSL setup instructions completed!"