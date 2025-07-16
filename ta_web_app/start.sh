#!/bin/bash

# TA Timetable Analyzer - Quick Start Script

echo "🚀 Starting TA Timetable Analyzer Web Application"
echo "================================================="

# Check if we're in the correct directory
if [ ! -f "README.md" ]; then
    echo "❌ Error: Please run this script from the ta_web_app directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is required but not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup backend if venv doesn't exist
if [ ! -d "backend/venv" ]; then
    echo "🔧 Setting up backend environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Backend setup complete"
fi

# Setup frontend if node_modules doesn't exist
if [ ! -d "frontend/node_modules" ]; then
    echo "🔧 Setting up frontend environment..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend setup complete"
fi

# Create uploads directory if it doesn't exist
mkdir -p backend/uploads

echo "🎯 Starting services..."

# Start backend in background
echo "🔄 Starting backend server..."
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🔄 Starting frontend development server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Application started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:5000"
echo ""
echo "📋 To stop the application:"
echo "   Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📚 Usage:"
echo "   1. Upload your CSV files (student classes, SEN data, timetable)"
echo "   2. Configure SEN weightings as needed"
echo "   3. Run the analysis to generate reports"
echo "   4. View results in the dashboard"

# Wait for user to stop
wait