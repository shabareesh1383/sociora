#!/bin/bash
# Sociora MVP - Complete Setup & Run Guide

echo "🚀 Starting Sociora MVP Setup..."

# Check if MongoDB is running
echo "⏳ Checking MongoDB connection..."
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB first."
    echo "Download from: https://www.mongodb.com/try/download/community"
    exit 1
fi

# Start MongoDB in background if not running
if ! mongo admin --eval "db.adminCommand('ping')" 2>/dev/null; then
    echo "🔧 Starting MongoDB..."
    mongod --dbpath ./data --logpath ./mongo.log &
    sleep 2
fi

echo "✅ MongoDB is ready"

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd backend
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
fi

echo "✅ Backend setup complete"

# Setup frontend
echo ""
echo "🔧 Setting up frontend..."
cd ../frontend
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
fi

echo "✅ Frontend setup complete"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Setup Complete! Ready to run."
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📌 TO START THE APPLICATION:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd frontend && npm run dev"
echo ""
echo "🌐 Then open: http://localhost:5173"
echo ""
echo "📝 Test Credentials:"
echo "   Email: test@example.com"
echo "   Password: test123"
echo ""
