#!/bin/bash
# Test Development Server and Basic Functionality

set -e

echo "🖥️  Testing Development Server..."
echo "================================"

# Change to project root
cd "$(dirname "$0")/.."

echo "📦 Installing dependencies..."
npm install

echo "🚀 Starting development server..."
echo "This will start both frontend (Vite) and backend (Tauri) in development mode"
echo "The application should open automatically"
echo ""
echo "💡 To test manually:"
echo "  1. Check if the application window opens"
echo "  2. Navigate through different pages (Home, Chat, History, Settings)"
echo "  3. Test AI service start/stop in Settings"
echo "  4. Check system health status"
echo "  5. Try submitting a medical query in Chat"
echo ""
echo "🛑 Press Ctrl+C to stop the development server"
echo ""

# Start dev server (this will block until stopped)
npm run tauri dev
