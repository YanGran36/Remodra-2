#!/bin/bash

# Production Deployment Script for Remodra SaaS

echo "🚀 Starting Remodra SaaS Deployment..."

# Check if running in production mode
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to production"
    echo "Set NODE_ENV=production before running this script"
    exit 1
fi

# Check for required environment variables
required_vars=("DATABASE_URL" "SESSION_SECRET" "FRONTEND_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var environment variable is required"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:push

# Start the application
echo "🚀 Starting Remodra SaaS..."
npm start 