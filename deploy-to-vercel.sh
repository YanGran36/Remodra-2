#!/bin/bash

echo "🚀 Remodra Deployment to Vercel + Neon Database"
echo "================================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Configuration files found"

# Build the client
echo "📦 Building client..."
cd client
npm run build
cd ..

echo "✅ Client built successfully"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up Neon database at https://neon.tech"
echo "2. Add DATABASE_URL to Vercel environment variables"
echo "3. Add SESSION_SECRET to Vercel environment variables"
echo "4. Add FRONTEND_URL to Vercel environment variables"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions" 