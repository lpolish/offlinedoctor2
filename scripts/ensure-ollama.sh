#!/bin/bash

# Ensure Ollama Script
# Quick check and startup for Ollama before running the dev server

set -e

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Running setup..."
    bash install-ollama.sh --auto --quiet
    exit $?
fi

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
    exit 0
fi

# Start Ollama if not running
echo "🚀 Starting Ollama service..."

# Try systemd first
if command -v systemctl &> /dev/null && systemctl is-enabled ollama &> /dev/null 2>&1; then
    sudo systemctl start ollama
    echo "✅ Ollama started via systemctl"
else
    # Start manually
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    echo "✅ Ollama started manually"
fi

# Wait for service to be ready
echo "⏳ Waiting for Ollama to be ready..."
for i in {1..15}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama is ready!"
        exit 0
    fi
    sleep 1
done

echo "❌ Ollama failed to start within 15 seconds"
echo "Check logs: tail /tmp/ollama.log"
exit 1
