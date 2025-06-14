#!/bin/bash

# Pre-Release Validation Script
echo "🔍 Pre-Release Validation for Offline Medical Assistant"
echo "======================================================"

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
print_info "Starting validation checks..."

# 1. Check if we're in a git repository
echo ""
echo "📁 Git Repository Check"
echo "----------------------"
if [ -d ".git" ]; then
    print_status 0 "Git repository found"
    git status --short
else
    print_status 1 "Git repository not found - run ./setup-git.sh first"
    exit 1
fi

# 2. Check Node.js dependencies
echo ""
echo "📦 Frontend Dependencies"
echo "------------------------"
if [ -f "package.json" ]; then
    print_status 0 "package.json found"
    if [ -d "node_modules" ]; then
        print_status 0 "Node modules installed"
    else
        print_warning "Node modules not found, installing..."
        npm install
        print_status $? "Node modules installation"
    fi
else
    print_status 1 "package.json not found"
    exit 1
fi

# 3. Check Python dependencies
echo ""
echo "🐍 Backend Dependencies"
echo "-----------------------"
if [ -f "backend/requirements.txt" ]; then
    print_status 0 "requirements.txt found"
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_warning "Virtual environment not found, creating..."
        python3 -m venv venv
        print_status $? "Virtual environment creation"
    else
        print_status 0 "Virtual environment found"
    fi
    
    # Activate virtual environment and test imports
    source venv/bin/activate
    if python -c "import fastapi, sqlite3, asyncio" 2>/dev/null; then
        print_status 0 "Python dependencies available"
    else
        print_warning "Python dependencies missing, installing..."
        pip install --upgrade pip > /dev/null 2>&1
        pip install -r requirements.txt > /dev/null 2>&1
        print_status $? "Python dependencies installation"
    fi
    deactivate
    cd ..
else
    print_status 1 "backend/requirements.txt not found"
    exit 1
fi

# 4. Check Rust/Tauri setup
echo ""
echo "🦀 Rust/Tauri Setup"
echo "-------------------"
if [ -f "src-tauri/Cargo.toml" ]; then
    print_status 0 "Cargo.toml found"
    if command -v rustc &> /dev/null; then
        print_status 0 "Rust compiler available"
    else
        print_status 1 "Rust compiler not found - install from https://rustup.rs/"
        exit 1
    fi
    
    if command -v cargo &> /dev/null; then
        print_status 0 "Cargo available"
    else
        print_status 1 "Cargo not found"
        exit 1
    fi
else
    print_status 1 "src-tauri/Cargo.toml not found"
    exit 1
fi

# 5. Test frontend build
echo ""
echo "🏗️  Frontend Build Test"
echo "----------------------"
npm run build > build.log 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "Frontend builds successfully"
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        print_info "Bundle size: $DIST_SIZE"
    fi
else
    print_status 1 "Frontend build failed"
    echo "Build errors:"
    cat build.log
    exit 1
fi

# 6. Test backend startup
echo ""
echo "🔌 Backend Startup Test"
echo "-----------------------"
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
    timeout 10s python -c "
import sys
sys.path.append('.')
from app.main import app
print('Backend imports successfully')
" > ../backend.log 2>&1
    BACKEND_EXIT_CODE=$?
    deactivate
else
    BACKEND_EXIT_CODE=1
    echo "Virtual environment not found" > ../backend.log
fi

if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    print_status 0 "Backend starts successfully"
else
    print_status 1 "Backend startup failed"
    echo "Backend errors:"
    cat ../backend.log
    cd ..
    exit 1
fi
cd ..

# 7. Check medical disclaimer compliance
echo ""
echo "🏥 Medical Disclaimer Check"
echo "---------------------------"
if grep -r "medical.*disclaimer\|educational.*purpose\|consult.*healthcare" src/ backend/ --ignore-case > /dev/null; then
    print_status 0 "Medical disclaimers found"
else
    print_status 1 "Medical disclaimers missing"
    print_warning "Add medical disclaimers to comply with healthcare software standards"
fi

# 8. Check GitHub workflows
echo ""
echo "⚙️  GitHub Workflows Check"
echo "--------------------------"
if [ -f ".github/workflows/build-release.yml" ]; then
    print_status 0 "Build & Release workflow found"
else
    print_status 1 "Build & Release workflow missing"
fi

if [ -f ".github/workflows/ci.yml" ]; then
    print_status 0 "CI workflow found"
else
    print_status 1 "CI workflow missing"
fi

if [ -f ".github/workflows/auto-version.yml" ]; then
    print_status 0 "Auto-version workflow found"
else
    print_status 1 "Auto-version workflow missing"
fi

# 9. Version consistency check
echo ""
echo "🏷️  Version Consistency"
echo "----------------------"
PACKAGE_VERSION=$(grep '"version"' package.json | head -1 | cut -d'"' -f4)
TAURI_VERSION=$(grep '"version"' src-tauri/tauri.conf.json | cut -d'"' -f4)
CARGO_VERSION=$(grep '^version' src-tauri/Cargo.toml | cut -d'"' -f2)

print_info "package.json version: $PACKAGE_VERSION"
print_info "tauri.conf.json version: $TAURI_VERSION"
print_info "Cargo.toml version: $CARGO_VERSION"

if [ "$PACKAGE_VERSION" = "$TAURI_VERSION" ] && [ "$PACKAGE_VERSION" = "$CARGO_VERSION" ]; then
    print_status 0 "All versions are consistent"
else
    print_status 1 "Version mismatch detected"
    print_warning "Run auto-version workflow or manually sync versions"
fi

# 10. Final summary
echo ""
echo "📊 Validation Summary"
echo "===================="
echo ""
print_info "Project is ready for release! 🚀"
echo ""
echo "Next steps:"
echo "1. Setup backend (if not done): ./setup-backend.sh"
echo "2. Commit your changes: git add . && git commit -m 'feat: ready for release'"
echo "3. Push to main: git push origin main"
echo "4. GitHub Actions will automatically:"
echo "   - Version the release"
echo "   - Build cross-platform binaries"
echo "   - Create GitHub release with assets"
echo ""
print_warning "Make sure to push to a GitHub repository with Actions enabled!"

# Cleanup
rm -f build.log backend.log

echo ""
print_info "Validation complete! ✨"
