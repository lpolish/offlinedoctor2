#!/bin/bash

# Build Script for Offline Medical Assistant (Tauri)
echo "🏗️ Building Offline Medical Assistant..."

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
print_info "Starting build process..."

# 1. Install frontend dependencies
echo ""
echo "📦 Installing Frontend Dependencies"
echo "===================================="
npm install
print_status $? "Frontend dependencies installation"

# 2. Build frontend
echo ""
echo "🌐 Building Frontend"
echo "===================="
npm run build
print_status $? "Frontend build"

# 3. Build Tauri application
echo ""
echo "🦀 Building Tauri Application"
echo "=============================="
print_info "Building for current platform..."
npm run tauri build
BUILD_STATUS=$?
print_status $BUILD_STATUS "Tauri application build"

if [ $BUILD_STATUS -eq 0 ]; then
    echo ""
    print_info "Build completed successfully! 🎉"
    echo ""
    echo "Build artifacts can be found in:"
    echo "  - Frontend: dist/"
    echo "  - Tauri: src-tauri/target/release/"
    echo ""
    
    # Check if bundle was created
    if [ -d "src-tauri/target/release/bundle" ]; then
        print_info "Platform-specific bundles created:"
        ls -la src-tauri/target/release/bundle/
    fi
else
    echo ""
    print_warning "Build failed. Check the errors above."
    exit 1
fi

echo ""
print_info "Build script completed! ✨"
