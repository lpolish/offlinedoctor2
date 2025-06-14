#!/bin/bash

# Start backend development server
set -e

echo "🚀 Starting Offline Medical AI Assistant Backend"

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Error: Virtual environment not found. Please run ./scripts/setup-dev.sh first"
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running. Starting Ollama..."
    ollama serve &
    OLLAMA_PID=$!
    
    # Wait for Ollama to be ready
    echo "Waiting for Ollama to be ready..."
    timeout=30
    counter=0
    while ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
        sleep 1
        counter=$((counter + 1))
        if [ $counter -ge $timeout ]; then
            echo "Timeout waiting for Ollama to start"
            kill $OLLAMA_PID 2>/dev/null || true
            exit 1
        fi
    done
    echo "✅ Ollama is ready!"
fi

# Start the FastAPI backend
echo "🔧 Starting FastAPI backend..."
cd backend
source venv/bin/activate

# Set environment variables
export PYTHONPATH="$(pwd)"
export DATABASE_PATH="$(pwd)/data/medical_assistant.db"

# Start the server with hot reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --log-level info
