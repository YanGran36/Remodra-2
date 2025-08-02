#!/bin/bash

echo "🚀 Get-Remodra Deployment Script"
echo "================================"

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

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    print_error "vercel.json not found. Please run this script from the project root."
    exit 1
fi

print_success "Project structure verified"

# Check if git repository is ready
if [ ! -d ".git" ]; then
    print_error "Git repository not found. Please ensure this is a git repository."
    exit 1
fi

print_success "Git repository ready"

# Check if we have the necessary files
print_status "Checking required files..."

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
print_status "All required files are present!"
echo ""

# Build the client
print_status "Building client application..."
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

print_status "Next steps:"
echo "1. Create Neon database at https://neon.tech"
echo "   - Project name: get-remodra-db"
echo "   - Copy the connection string"
echo ""
echo "2. Set up Vercel environment variables:"
echo "   - DATABASE_URL=your-neon-connection-string"
echo "   - NODE_ENV=production"
echo "   - SESSION_SECRET=get-remodra-super-secret-session-key-2024"
echo "   - FRONTEND_URL=https://getremodra.vercel.app"
echo ""
echo "3. Run the database schema in Neon SQL Editor:"
echo "   - Copy content from setup-neon-database.sql"
echo ""
echo "4. Deploy to Vercel:"
echo "   - Go to your getremodra project in Vercel"
echo "   - Trigger a new deployment"
echo ""
echo "5. Test the deployment:"
echo "   - Visit https://getremodra.vercel.app"
echo "   - Login with: test@remodra.com / test123"
echo ""

print_success "Deployment script completed successfully!" 