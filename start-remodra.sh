#!/bin/bash

# Remodra SaaS Platform Startup Script
# This script starts both backend and frontend servers with proper error handling

set -e  # Exit on any error

echo "🚀 Starting Remodra SaaS Platform..."

# Kill any existing processes
echo "🔄 Killing existing processes..."
pkill -f "tsx server/index.ts" 2>/dev/null
pkill -f "vite --port 3000" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Check if ports are free
echo "🔍 Checking port availability..."
if lsof -Pi :5005 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 5005 is still in use. Killing process..."
    lsof -ti:5005 | xargs kill -9
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 3000 is still in use. Killing process..."
    lsof -ti:3000 | xargs kill -9
fi

sleep 2

# Start backend
echo "🔧 Starting backend server..."
cd "$(dirname "$0")"
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5005/health >/dev/null 2>&1; then
        echo "✅ Backend is running on http://localhost:5005"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Start frontend
echo "🎨 Starting frontend server..."
cd client
npx vite --port 3000 > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend is running on http://localhost:3000"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend failed to start"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Final verification
echo "🔍 Final verification..."
if curl -s http://localhost:5005/health | grep -q "ok" && curl -s http://localhost:3000 | grep -q "DOCTYPE"; then
    echo ""
    echo "🎉 Remodra SaaS Platform is running successfully!"
    echo ""
    echo "📊 Backend:  http://localhost:5005"
    echo "🎨 Frontend: http://localhost:3000"
    echo "🔐 Login:    http://localhost:3000/login"
    echo ""
    echo "💡 To stop the servers, run: pkill -f 'tsx\|vite'"
    echo ""
else
    echo "❌ Verification failed"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi 