#!/bin/bash

echo "🚀 Get-Remodra Deployment Script"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    print_error "vercel.json not found. Please run this script from the project root."
    exit 1
fi

print_success "Project structure verified"

# Check if git repository is ready
if [ ! -d ".git" ]; then
    print_error "Git repository not found."
    exit 1
fi

print_success "Git repository ready"

# Check if we have the necessary files
print_info "Checking required files..."

if [ -f "setup-neon-database.sql" ]; then
    print_success "Database schema ready"
else
    print_error "setup-neon-database.sql not found"
    exit 1
fi

if [ -f "vercel.json" ]; then
    print_success "Vercel configuration ready"
else
    print_error "vercel.json not found"
    exit 1
fi

if [ -f "client/package.json" ]; then
    print_success "Client package.json found"
else
    print_error "client/package.json not found"
    exit 1
fi

if [ -f "server/index.ts" ]; then
    print_success "Server entry point found"
else
    print_error "server/index.ts not found"
    exit 1
fi

echo ""
print_success "All required files are present!"
echo ""

# Build the client
print_info "Building client application..."
cd client
npm run build
if [ $? -eq 0 ]; then
    print_success "Client built successfully"
else
    print_error "Client build failed"
    exit 1
fi
cd ..

echo ""
print_success "🎉 Get-Remodra is ready for deployment!"
echo ""

print_info "Next steps:"
echo ""
echo "1. 🌐 Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Click 'New Project'"
echo "   - Import: YanGran36/Remodra-2"
echo "   - Project name: getremodra"
echo "   - Click 'Deploy'"
echo ""
echo "2. 🗄️ Set up Neon Database:"
echo "   - Go to https://neon.tech"
echo "   - Create project: get-remodra-db"
echo "   - Copy connection string"
echo "   - Run setup-neon-database.sql in SQL Editor"
echo ""
echo "3. ⚙️ Configure Environment Variables:"
echo "   - DATABASE_URL=your-neon-connection-string"
echo "   - NODE_ENV=production"
echo "   - SESSION_SECRET=get-remodra-super-secret-session-key-2024"
echo "   - FRONTEND_URL=https://getremodra.vercel.app"
echo ""
echo "4. 🚀 Redeploy:"
echo "   - Go to Deployments tab"
echo "   - Click 'Redeploy'"
echo "   - Wait for build to complete"
echo ""
echo "5. 🎯 Test Deployment:"
echo "   - Visit: https://getremodra.vercel.app"
echo "   - Login: test@remodra.com / test123"
echo ""

print_success "Deployment script completed successfully!" 