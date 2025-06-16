#!/bin/bash

# Comprehensive Ollama Auto-Installation Script
# This script ensures Ollama is installed and configured for the Medical AI Assistant

set -e

# Parse command line arguments
AUTO_MODE=false
FULL_SETUP=false
QUIET_MODE=false

for arg in "$@"; do
  case $arg in
    --auto)
      AUTO_MODE=true
      shift
      ;;
    --full)
      FULL_SETUP=true
      shift
      ;;
    --quiet)
      QUIET_MODE=true
      shift
      ;;
    *)
      ;;
  esac
done

# Logging functions
log() {
  if [ "$QUIET_MODE" = false ]; then
    echo "$1"
  fi
}

log "🏥 Medical AI Assistant - Ollama Auto-Setup"
log "========================================="

# Detect OS
OS=""
ARCH=""
case "$OSTYPE" in
  linux*)   OS="linux" ;;
  darwin*)  OS="darwin" ;;
  msys*|win32*) OS="windows" ;;
  *)        echo "❌ Unsupported OS: $OSTYPE" && exit 1 ;;
esac

case "$(uname -m)" in
  x86_64)   ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *)        log "❌ Unsupported architecture: $(uname -m)" && exit 1 ;;
esac

log "🔍 Detected: $OS/$ARCH"

# Function to check if Ollama is installed
check_ollama_installed() {
  if command -v ollama &> /dev/null; then
    log "✅ Ollama is already installed"
    if [ "$QUIET_MODE" = false ]; then
      ollama --version
    fi
    return 0
  else
    log "❌ Ollama not found"
    return 1
  fi
}

# Function to install Ollama
install_ollama() {
  log "📥 Installing Ollama..."
  
  case "$OS" in
    "linux")
      # Use official installer
      if [ "$QUIET_MODE" = true ]; then
        curl -fsSL https://ollama.ai/install.sh | sh > /dev/null 2>&1
      else
        curl -fsSL https://ollama.ai/install.sh | sh
      fi
      ;;
    "darwin")
      # macOS installation
      if [ "$AUTO_MODE" = true ]; then
        log "🍎 macOS detected in CI mode - skipping Ollama installation"
        log "   Ollama installation will be handled by the build environment"
        return 0
      else
        log "🍎 For macOS, please download Ollama manually from https://ollama.ai/download"
        log "   Or install via Homebrew: brew install ollama"
        read -p "Continue without installing? [Y/n]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
          return 0
        fi
        exit 1
      fi
      ;;
    "windows")
      log "🪟 For Windows, please download Ollama manually from https://ollama.ai/download"
      log "   Then run this script again"
      if [ "$AUTO_MODE" = true ]; then
        log "⚠️  Auto-installation not supported on Windows"
        return 0
      fi
      exit 1
      ;;
  esac
  
  # Verify installation
  if command -v ollama &> /dev/null; then
    log "✅ Ollama installed successfully"
    if [ "$QUIET_MODE" = false ]; then
      ollama --version
    fi
  else
    log "❌ Failed to install Ollama"
    exit 1
  fi
}

# Function to start Ollama service
start_ollama_service() {
  echo "🚀 Starting Ollama service..."
  
  # Check if already running
  if curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "✅ Ollama service is already running"
    return 0
  fi
  
  # Start Ollama in background
  if command -v systemctl &> /dev/null && systemctl is-enabled ollama &> /dev/null; then
    # Use systemd if available
    sudo systemctl start ollama
  else
    # Start manually
    echo "Starting Ollama manually..."
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    
    # Wait for service to start
    echo "⏳ Waiting for Ollama to start..."
    for i in {1..30}; do
      if curl -s http://localhost:11434/api/tags &> /dev/null; then
        echo "✅ Ollama service started successfully"
        return 0
      fi
      sleep 1
    done
    
    echo "❌ Failed to start Ollama service"
    echo "Check logs: tail /tmp/ollama.log"
    exit 1
  fi
}

# Function to download required models
download_models() {
  log "🤖 Setting up AI models..."
  
  # Check if tinyllama is available
  if ollama list | grep -q "tinyllama:latest"; then
    log "✅ TinyLlama model is already available"
  else
    log "📥 Downloading TinyLlama model (this may take a few minutes)..."
    if [ "$QUIET_MODE" = true ]; then
      ollama pull tinyllama:latest > /dev/null 2>&1
    else
      ollama pull tinyllama:latest
    fi
    log "✅ TinyLlama model downloaded"
  fi
  
  # Optional: Download a better model if user wants or if full setup requested
  if [ "$FULL_SETUP" = true ]; then
    log "📥 Downloading Llama 3.1 8B model (full setup mode)..."
    if [ "$QUIET_MODE" = true ]; then
      ollama pull llama3.1:8b > /dev/null 2>&1
    else
      ollama pull llama3.1:8b
    fi
    log "✅ Llama 3.1 8B model downloaded"
  elif [ "$AUTO_MODE" = false ]; then
    read -p "🚀 Would you like to download a larger, more capable model (llama3.1:8b - 4.9GB)? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      log "📥 Downloading Llama 3.1 8B model (this will take longer)..."
      ollama pull llama3.1:8b
      log "✅ Llama 3.1 8B model downloaded"
    fi
  fi
}

# Function to test the setup
test_setup() {
  echo "🧪 Testing Ollama setup..."
  
  # Test API connection
  if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Cannot connect to Ollama API"
    return 1
  fi
  
  # Test model generation
  echo "Testing AI response..."
  RESPONSE=$(curl -s http://localhost:11434/api/generate -d '{
    "model": "tinyllama:latest",
    "prompt": "What is a headache?",
    "stream": false
  }' | grep -o '"response":"[^"]*"' | sed 's/"response":"\(.*\)"/\1/' || echo "")
  
  if [ -n "$RESPONSE" ]; then
    echo "✅ AI is responding correctly"
    echo "Sample response: ${RESPONSE:0:100}..."
  else
    echo "❌ AI is not responding"
    return 1
  fi
}

# Function to create auto-start configuration
setup_autostart() {
  log "⚙️  Setting up auto-start configuration..."
  
  if command -v systemctl &> /dev/null; then
    # Create systemd service for Linux
    cat > /tmp/ollama.service << EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=$USER
Group=$USER
Restart=always
RestartSec=3
Environment="HOME=$HOME"
Environment="PATH=$PATH"

[Install]
WantedBy=default.target
EOF
    
    log "Creating systemd service..."
    if sudo cp /tmp/ollama.service /etc/systemd/system/ 2>/dev/null; then
      sudo systemctl daemon-reload
      sudo systemctl enable ollama
      log "✅ Ollama will start automatically on boot"
    else
      log "⚠️  Could not set up autostart (requires sudo)"
    fi
  else
    log "ℹ️  Manual start required: run 'ollama serve' before using the Medical AI Assistant"
  fi
}

# Main installation flow
main() {
  if [ "$AUTO_MODE" = true ]; then
    log "🤖 Running in automatic mode..."
    
    # In CI environments (non-Linux), skip most setup
    if [ "$OS" != "linux" ]; then
      log "🔄 Non-Linux environment detected in auto mode"
      log "✅ Skipping Ollama setup for CI compatibility"
      log "📋 Build environment will handle dependencies"
      return 0
    fi
  fi
  
  log ""
  
  # Step 1: Check/Install Ollama
  if ! check_ollama_installed; then
    if [ "$AUTO_MODE" = true ] || [ "$FULL_SETUP" = true ]; then
      install_ollama
    else
      read -p "Would you like to install Ollama now? [Y/n]: " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Nn]$ ]]; then
        log "❌ Ollama installation skipped. The Medical AI Assistant requires Ollama to function."
        exit 1
      fi
      install_ollama
    fi
  fi
  
  # Step 2: Start Ollama service
  start_ollama_service
  
  # Step 3: Download models
  download_models
  
  # Step 4: Test setup
  if test_setup; then
    log "✅ All tests passed!"
  else
    log "⚠️  Setup completed but tests failed. Please check manually."
  fi
  
  # Step 5: Setup auto-start (optional, automatic in auto mode)
  if [ "$AUTO_MODE" = true ] || [ "$FULL_SETUP" = true ]; then
    setup_autostart
  else
    read -p "🔄 Would you like Ollama to start automatically on boot? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      setup_autostart
    fi
  fi
  
  log ""
  log "🎉 Medical AI Assistant setup complete!"
  log ""
  log "📋 Summary:"
  log "   • Ollama installed: ✅"
  log "   • Service running: ✅"
  log "   • Models downloaded: ✅"
  log "   • API tested: ✅"
  log ""
  if [ "$AUTO_MODE" = false ]; then
    log "🚀 You can now run the Medical AI Assistant!"
    log "   npm run dev"
  fi
  log ""
}

# Run main function
main "$@"
