#!/bin/bash

# Pre-Release Validation Script for Offline Medical Assistant (Tauri)
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
    print_status 1 "Git repository not found"
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

# 3. Check Rust/Tauri setup
echo ""
echo "🦀 Rust/Tauri Setup"
echo "-------------------"
if [ -f "src-tauri/Cargo.toml" ]; then
    print_status 0 "Cargo.toml found"
    if command -v rustc &> /dev/null; then
        RUST_VERSION=$(rustc --version)
        print_status 0 "Rust compiler available: $RUST_VERSION"
    else
        print_status 1 "Rust compiler not found - install from https://rustup.rs/"
        exit 1
    fi
    
    if command -v cargo &> /dev/null; then
        CARGO_VERSION=$(cargo --version)
        print_status 0 "Cargo available: $CARGO_VERSION"
    else
        print_status 1 "Cargo not found"
        exit 1
    fi
else
    print_status 1 "src-tauri/Cargo.toml not found"
    exit 1
fi

# 4. Check Tauri configuration
echo ""
echo "🔧 Tauri Configuration"
echo "----------------------"
if [ -f "src-tauri/tauri.conf.json" ]; then
    print_status 0 "tauri.conf.json found"
    
    # Check if app identifier is set
    APP_ID=$(grep '"identifier"' src-tauri/tauri.conf.json | cut -d'"' -f4)
    if [ "$APP_ID" != "com.tauri.dev" ]; then
        print_status 0 "App identifier configured: $APP_ID"
    else
        print_warning "App identifier still using default - consider updating"
    fi
else
    print_status 1 "src-tauri/tauri.conf.json not found"
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
        
        # Check bundle size (warn if > 10MB)
        DIST_SIZE_MB=$(du -sm dist | cut -f1)
        if [ $DIST_SIZE_MB -gt 10 ]; then
            print_warning "Bundle size is large (${DIST_SIZE_MB}MB) - consider optimization"
        fi
    fi
else
    print_status 1 "Frontend build failed"
    echo "Build errors:"
    cat build.log
    exit 1
fi

# 6. Test Tauri compilation (without full build)
echo ""
echo "🦀 Tauri Compilation Test"
echo "-------------------------"
cd src-tauri
cargo check > ../tauri.log 2>&1
TAURI_EXIT_CODE=$?
cd ..

if [ $TAURI_EXIT_CODE -eq 0 ]; then
    print_status 0 "Tauri code compiles successfully"
else
    print_status 1 "Tauri compilation failed"
    echo "Tauri errors:"
    cat tauri.log
    exit 1
fi

# 7. Check medical disclaimer compliance
echo ""
echo "🏥 Medical Disclaimer Check"
echo "---------------------------"
if grep -r "medical.*disclaimer\|educational.*purpose\|consult.*healthcare" src/ src-tauri/ --ignore-case > /dev/null; then
    print_status 0 "Medical disclaimers found"
else
    print_status 1 "Medical disclaimers missing"
    print_warning "Add medical disclaimers to comply with healthcare software standards"
fi

# 8. Check for sensitive data exposure
echo ""
echo "🔒 Security Check"
echo "----------------"
SENSITIVE_FILES=0

# Check for exposed API keys or secrets
if grep -r "api[_-]key\|secret\|password\|token" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "placeholder\|example\|demo" > /dev/null; then
    print_warning "Potential API keys or secrets found in source code"
    SENSITIVE_FILES=$((SENSITIVE_FILES + 1))
fi

# Check for hardcoded URLs
if grep -r "http://\|https://" src/ --include="*.ts" --include="*.tsx" | grep -v "localhost\|127.0.0.1\|example.com" > /dev/null; then
    print_warning "Hardcoded URLs found - ensure they're appropriate for production"
fi

if [ $SENSITIVE_FILES -eq 0 ]; then
    print_status 0 "No obvious security issues found"
fi

# 9. Check GitHub workflows
echo ""
echo "⚙️  GitHub Workflows Check"
echo "--------------------------"
if [ -f ".github/workflows/build-release.yml" ]; then
    print_status 0 "Build & Release workflow found"
else
    print_warning "Build & Release workflow missing"
fi

if [ -f ".github/workflows/ci.yml" ]; then
    print_status 0 "CI workflow found"
else
    print_warning "CI workflow missing"
fi

# 10. Version consistency check
echo ""
echo "🏷️  Version Consistency"
echo "----------------------"
PACKAGE_VERSION=$(grep '"version"' package.json | head -1 | cut -d'"' -f4)
if [ -f "src-tauri/tauri.conf.json" ]; then
    TAURI_VERSION=$(grep '"version"' src-tauri/tauri.conf.json | cut -d'"' -f4)
else
    TAURI_VERSION="not found"
fi
CARGO_VERSION=$(grep '^version' src-tauri/Cargo.toml | cut -d'"' -f2)

print_info "package.json version: $PACKAGE_VERSION"
print_info "tauri.conf.json version: $TAURI_VERSION"
print_info "Cargo.toml version: $CARGO_VERSION"

if [ "$PACKAGE_VERSION" = "$TAURI_VERSION" ] && [ "$PACKAGE_VERSION" = "$CARGO_VERSION" ]; then
    print_status 0 "All versions are consistent"
else
    print_warning "Version mismatch detected - sync versions before release"
fi

# 11. Ollama integration check
echo ""
echo "🤖 Ollama Integration"
echo "--------------------"
if command -v ollama &> /dev/null; then
    print_status 0 "Ollama available for enhanced AI responses"
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_status 0 "Ollama service is running"
        
        # Check for available models
        MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | wc -l)
        if [ $MODELS -gt 0 ]; then
            print_status 0 "Ollama models available: $MODELS"
        else
            print_warning "No Ollama models installed - consider: ollama pull llama2:7b"
        fi
    else
        print_warning "Ollama not running - start with: ollama serve"
    fi
else
    print_info "Ollama not installed - app will use fallback responses"
fi

# 12. Final summary
echo ""
echo "📊 Validation Summary"
echo "===================="
echo ""
print_info "Project validation completed! 🚀"
echo ""
echo "Architecture: Tauri (Rust + React + TypeScript)"
echo "AI Backend: Integrated Tauri commands with Ollama fallback"
echo "Frontend: React with TailwindCSS"
echo "Privacy: Fully offline capable"
echo ""
echo "Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'feat: ready for release'"
echo "2. Push to main: git push origin main"
echo "3. GitHub Actions will automatically:"
echo "   - Build cross-platform binaries"
echo "   - Create GitHub release with assets"
echo ""
echo "Development commands:"
echo "  npm run tauri dev    # Start development server"
echo "  ./scripts/build.sh   # Build for production"
echo ""
print_warning "Make sure to push to a GitHub repository with Actions enabled!"

# Cleanup
rm -f build.log tauri.log

echo ""
print_info "Validation complete! ✨"
