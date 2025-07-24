#!/bin/bash

# Remodra Startup Script - Fixed Version
echo "🚀 Starting Remodra..."

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create one with DATABASE_URL=sqlite://./dev.db"
    exit 1
fi

# Check if database exists
if [ ! -f "dev.db" ]; then
    echo "⚠️  Warning: dev.db not found. Creating database..."
    npm run db:setup 2>/dev/null || echo "Database setup failed, continuing anyway..."
fi

# Start backend
echo "🔧 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5005/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:5005"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd client
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "⚠️  Frontend might be running on a different port, checking..."
    if curl -s http://localhost:3001 > /dev/null; then
        echo "✅ Frontend is running on http://localhost:3001"
    else
        echo "❌ Frontend failed to start"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        exit 1
    fi
fi

echo ""
echo "🎉 Remodra is now running!"
echo "📱 Frontend: http://localhost:3000 (or 3001)"
echo "🔧 Backend:  http://localhost:5005"
echo "📊 Health:   http://localhost:5005/health"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to stop
wait 