#!/bin/bash

# Entrypoint script for Offline Medical AI Assistant Backend
set -e

echo "Starting Offline Medical AI Assistant Backend..."

# Create necessary directories
mkdir -p /home/app/data /home/app/logs /home/app/backups /home/app/ollama-data

# Initialize database if it doesn't exist
if [ ! -f "/home/app/data/medical_assistant.db" ]; then
    echo "Initializing database..."
    cd /home/app/backend
    python -c "
from app.database.database import DatabaseManager
import asyncio

async def init_db():
    db = DatabaseManager()
    await db.initialize()
    print('Database initialized successfully')

asyncio.run(init_db())
"
fi

# Start Ollama in background
echo "Starting Ollama service..."
OLLAMA_DATA_DIR=/home/app/ollama-data ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama to be ready..."
timeout=60
counter=0
while ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "Timeout waiting for Ollama to start"
        exit 1
    fi
done

echo "Ollama is ready!"

# Pull medical AI model if not already present
echo "Checking for AI models..."
if ! ollama list | grep -q "llama3.1:8b"; then
    echo "Pulling medical AI model (this may take a while)..."
    ollama pull llama3.1:8b || echo "Warning: Could not pull llama3.1:8b model"
fi

# Start FastAPI backend
echo "Starting FastAPI backend..."
cd /home/app/backend
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info
