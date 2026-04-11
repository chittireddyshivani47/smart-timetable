#!/bin/bash
echo "🚀 Setting up Smart Timetable Generator..."
echo ""

echo "📦 Installing backend dependencies..."
cd backend && npm install
echo ""

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
echo ""

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Make sure MongoDB is running"
echo "  2. In one terminal:  cd backend && npm run dev"
echo "  3. In another:       cd frontend && npm start"
echo "  4. Optional seed:    cd backend && npm run seed"
echo ""
echo "🌐 App will be at: http://localhost:3000"
echo "🔑 Demo login: admin@college.edu / admin123 (after seeding)"
