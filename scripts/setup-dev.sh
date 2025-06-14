#!/bin/bash

# Development setup script for Offline Medical AI Assistant
# This script sets up the development environment

set -e

echo "🏥 Setting up Offline Medical AI Assistant Development Environment"
echo "================================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
if command -v npm &> /dev/null; then
    npm install
else
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Set up Python virtual environment for backend
echo "🐍 Setting up Python backend environment..."
if [ ! -d "backend/venv" ]; then
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment and install dependencies
echo "📚 Installing Python dependencies..."
cd backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Check if Ollama is installed
echo "🤖 Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama is not installed. Please install it from https://ollama.ai"
    echo "   After installation, run: ollama pull llama3.1:8b"
else
    echo "✅ Ollama is installed"
    
    # Check if medical model is available
    if ! ollama list | grep -q "llama3.1:8b"; then
        echo "📥 Pulling medical AI model (this may take a while)..."
        ollama pull llama3.1:8b
    else
        echo "✅ Medical AI model is available"
    fi
fi

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p backend/data
mkdir -p backend/logs
mkdir -p backend/backups
mkdir -p docs

# Initialize database
echo "🗃️  Initializing database..."
cd backend
source venv/bin/activate
python -c "
import sys
sys.path.append('.')
from app.database.models import get_create_schema_sql
import sqlite3

# Create database with schema
conn = sqlite3.connect('data/medical_assistant.db')
schema_sql = get_create_schema_sql()
conn.executescript(schema_sql)
conn.close()
print('Database initialized successfully')
"
cd ..

# Make scripts executable
echo "🔧 Setting up scripts..."
chmod +x scripts/*.sh
chmod +x docker/entrypoint.sh

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend: ./scripts/start-backend.sh"
echo "2. Start the frontend: npm run tauri dev"
echo "3. Open http://localhost:1420 in your browser"
echo ""
echo "For Docker deployment:"
echo "1. Build: docker-compose -f docker/docker-compose.yml build"
echo "2. Run: docker-compose -f docker/docker-compose.yml up"
echo ""
echo "📖 Check the README.md for more detailed instructions"
