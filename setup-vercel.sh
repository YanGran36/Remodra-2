#!/bin/bash

echo "🚀 Get-Remodra Vercel Setup Script"
echo "==================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Vercel configuration found"

# Check if git repository is ready
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please ensure this is a git repository."
    exit 1
fi

echo "✅ Git repository ready"

# Check if we have the necessary files
echo "📋 Checking required files..."

if [ -f "setup-neon-database.sql" ]; then
    echo "✅ Database schema ready"
else
    echo "❌ setup-neon-database.sql not found"
fi

if [ -f "vercel.json" ]; then
    echo "✅ Vercel configuration ready"
else
    echo "❌ vercel.json not found"
fi

if [ -f "package.json" ]; then
    echo "✅ Package.json ready"
else
    echo "❌ package.json not found"
fi

echo ""
echo "🎯 Ready for Vercel deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com and sign up/login"
echo "2. Click 'New Project'"
echo "3. Import repository: YanGran36/Remodra-2"
echo "4. Project name: get-remodra"
echo "5. Add environment variables:"
echo "   - DATABASE_URL=postgresql://user:password@host/database"
echo "   - NODE_ENV=production"
echo "   - SESSION_SECRET=your-super-secret-session-key"
echo "   - FRONTEND_URL=https://get-remodra.vercel.app"
echo "6. Click 'Deploy'"
echo ""
echo "📖 See VERCEL-SETUP-GUIDE.md for detailed instructions"
echo ""
echo "🎉 Your Get-Remodra SaaS will be live at: https://get-remodra.vercel.app" 