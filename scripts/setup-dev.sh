#!/bin/bash

# Development Setup Script for Offline Medical Assistant (Tauri)
echo "🔧 Setting up development environment for Offline Medical Assistant..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
print_info "Starting development environment setup..."

# 1. Check Node.js
echo ""
echo "📦 Node.js Setup"
echo "================"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js found: $NODE_VERSION"
else
    print_status 1 "Node.js not found - please install Node.js v18 or higher"
    exit 1
fi

# 2. Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm found: $NPM_VERSION"
else
    print_status 1 "npm not found"
    exit 1
fi

# 3. Install frontend dependencies
echo ""
echo "📦 Installing Frontend Dependencies"
echo "===================================="
npm install
print_status $? "Frontend dependencies installation"

# 4. Check Rust
echo ""
echo "🦀 Rust Setup"
echo "============="
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    print_status 0 "Rust found: $RUST_VERSION"
else
    print_status 1 "Rust not found"
    print_warning "Please install Rust from: https://rustup.rs/"
    exit 1
fi

# 5. Check Cargo
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version)
    print_status 0 "Cargo found: $CARGO_VERSION"
else
    print_status 1 "Cargo not found"
    exit 1
fi

# 6. Install Tauri CLI
echo ""
echo "🔨 Tauri CLI Setup"
echo "=================="
if npm list -g @tauri-apps/cli &> /dev/null; then
    print_status 0 "Tauri CLI already installed"
else
    print_info "Installing Tauri CLI globally..."
    npm install -g @tauri-apps/cli
    print_status $? "Tauri CLI installation"
fi

# 7. Check for Ollama (optional)
echo ""
echo "🤖 Ollama Setup (Optional)"
echo "=========================="
if command -v ollama &> /dev/null; then
    print_status 0 "Ollama found - AI responses will use local models"
    print_info "Make sure Ollama is running: ollama serve"
    print_info "Install a medical model: ollama pull llama2:7b"
else
    print_warning "Ollama not found - application will use fallback responses"
    print_info "To install Ollama: https://ollama.ai/"
fi

# 8. Create .env file if it doesn't exist
echo ""
echo "⚙️  Environment Configuration"
echo "============================="
if [ ! -f ".env" ]; then
    print_info "Creating .env file..."
    cat > .env << EOL
# Offline Medical Assistant Environment Variables

# Application Mode
NODE_ENV=development

# Ollama Configuration (optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2:7b

# Development Settings
LOG_LEVEL=info
EOL
    print_status 0 ".env file created"
else
    print_status 0 ".env file already exists"
fi

echo ""
echo "🎉 Development Environment Ready!"
echo "================================"
echo ""
echo "To start development:"
echo "  npm run tauri dev    # Start Tauri app in development mode"
echo "  npm run dev          # Start frontend only (web browser)"
echo ""
echo "To build for production:"
echo "  ./scripts/build.sh   # Build complete application"
echo ""
echo "Optional Ollama setup:"
echo "  1. Install Ollama: https://ollama.ai/"
echo "  2. Start Ollama: ollama serve"
echo "  3. Install model: ollama pull llama2:7b"
echo ""
print_info "Setup complete! Happy coding! ✨"
