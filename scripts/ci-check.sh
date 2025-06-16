#!/bin/bash

# Local CI Check Script
# Runs the same checks as GitHub CI to ensure everything passes

set -e  # Exit on first error

echo "🔍 Running Local CI Checks..."
echo "================================"

# Check Node.js version
echo "📦 Environment Info:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Rust version: $(rustc --version 2>/dev/null || echo 'Rust not installed')"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci || npm install
echo "✅ Dependencies installed"
echo ""

# Frontend build check
echo "🔨 Testing frontend build..."
npm run build
echo "✅ Frontend build successful"
echo ""

# TypeScript check
echo "🔍 Checking TypeScript compilation..."
npx tsc --noEmit
echo "✅ TypeScript compilation successful"
echo ""

# Bundle size check
echo "📦 Checking bundle size..."
BUNDLE_SIZE=$(du -s dist/ | cut -f1)
MAX_SIZE=10240  # 10MB in KB
if [ "$BUNDLE_SIZE" -gt "$MAX_SIZE" ]; then
    echo "❌ Bundle size ($BUNDLE_SIZE KB) exceeds limit ($MAX_SIZE KB)"
    exit 1
else
    echo "✅ Bundle size ($BUNDLE_SIZE KB) within limits"
fi
echo ""

# Rust checks
echo "🦀 Running Rust checks..."
cd src-tauri

echo "  📝 Checking Rust formatting..."
cargo fmt --check
echo "  ✅ Rust formatting OK"

echo "  🔍 Running Clippy..."
cargo clippy -- -D warnings
echo "  ✅ Clippy checks passed"

echo "  🔧 Running cargo check..."
cargo check
echo "  ✅ Cargo check passed"

echo "  🧪 Running Rust tests..."
cargo test
echo "  ✅ Rust tests passed"

cd ..
echo ""

# Security audit
echo "🔒 Running security audits..."
echo "  NPM audit..."
npm audit --audit-level=high
echo "  ✅ NPM audit passed"

echo "  Cargo audit..."
cd src-tauri
if ! command -v cargo-audit &> /dev/null; then
    echo "  Installing cargo-audit..."
    cargo install cargo-audit --quiet
fi
cargo audit
echo "  ✅ Cargo audit passed"
cd ..
echo ""

# Medical disclaimer check
echo "🏥 Checking medical disclaimer compliance..."
if grep -r "medical.*disclaimer\|educational.*purpose\|consult.*healthcare" src/ src-tauri/ --ignore-case --quiet; then
    echo "✅ Medical disclaimers found"
else
    echo "❌ Medical disclaimers missing - required for medical AI application"
    exit 1
fi
echo ""

# Tauri build test (optional, can be time-consuming)
if [ "$1" = "--full" ]; then
    echo "🚀 Testing Tauri build (this may take several minutes)..."
    npm run build:tauri
    echo "✅ Tauri build successful"
    echo ""
fi

echo "🎉 All CI checks passed!"
echo "Ready for GitHub Actions! 🚀"
