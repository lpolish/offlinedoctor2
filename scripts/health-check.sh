#!/bin/bash
# Quick Health Check - Fast validation of basic setup

set -e

echo "⚡ Quick Health Check..."
echo "================================"

# Change to project root
cd "$(dirname "$0")/.."

echo "🔍 Checking project structure..."
required_files=(
    "package.json"
    "src-tauri/Cargo.toml"
    "src-tauri/tauri.conf.json"
    "src/main.tsx"
    "src/context/AppContext.tsx"
    "src/services/api-tauri.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done

echo ""
echo "🔧 Checking dependencies..."
if [ -f "package.json" ]; then
    echo "  Frontend dependencies:"
    node -e "
        const pkg = require('./package.json');
        const deps = {...pkg.dependencies, ...pkg.devDependencies};
        console.log('    React:', deps.react || 'missing');
        console.log('    Tauri API:', deps['@tauri-apps/api'] || 'missing');
        console.log('    TypeScript:', deps.typescript || 'missing');
        console.log('    Vite:', deps.vite || 'missing');
    " 2>/dev/null || echo "  ⚠️  Could not read package.json"
fi

if [ -f "src-tauri/Cargo.toml" ]; then
    echo "  Backend dependencies:"
    echo "    Tauri: $(grep 'tauri.*=' src-tauri/Cargo.toml | head -1 | cut -d'=' -f2 | tr -d ' "' || echo 'missing')"
    echo "    Tokio: $(grep 'tokio.*=' src-tauri/Cargo.toml | head -1 | cut -d'=' -f2 | tr -d ' "' || echo 'missing')"
    echo "    SQLx: $(grep 'sqlx.*=' src-tauri/Cargo.toml | head -1 | cut -d'=' -f2 | tr -d ' "' || echo 'missing')"
fi

echo ""
echo "🛠️  Checking tools..."
tools=(
    "node:$(node --version 2>/dev/null || echo 'not found')"
    "npm:$(npm --version 2>/dev/null || echo 'not found')"
    "cargo:$(cargo --version 2>/dev/null | cut -d' ' -f2 || echo 'not found')"
    "rustc:$(rustc --version 2>/dev/null | cut -d' ' -f2 || echo 'not found')"
)

for tool in "${tools[@]}"; do
    name=$(echo "$tool" | cut -d':' -f1)
    version=$(echo "$tool" | cut -d':' -f2)
    if [ "$version" != "not found" ]; then
        echo "  ✅ $name: $version"
    else
        echo "  ❌ $name: not found"
    fi
done

echo ""
echo "📦 Quick dependency check..."
if command -v npm >/dev/null 2>&1; then
    if [ ! -d "node_modules" ]; then
        echo "  ⚠️  node_modules not found - run 'npm install'"
    else
        echo "  ✅ node_modules exists"
    fi
else
    echo "  ❌ npm not available"
fi

if command -v cargo >/dev/null 2>&1; then
    cd src-tauri
    if cargo check --quiet 2>/dev/null; then
        echo "  ✅ Rust dependencies resolved"
    else
        echo "  ⚠️  Rust dependency issues detected"
    fi
    cd ..
else
    echo "  ❌ cargo not available"
fi

echo ""
echo "🎯 Recommendations:"
if [ ! -d "node_modules" ]; then
    echo "  → Run: npm install"
fi
echo "  → Run full tests: bash scripts/test-all.sh"
echo "  → Start development: bash scripts/test-dev.sh"

echo ""
echo "✅ Health check completed!"
