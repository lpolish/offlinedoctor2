#!/bin/bash
# Test Frontend Build and TypeScript Compilation

set -e

echo "🔍 Testing Frontend Build..."
echo "================================"

# Change to project root
cd "$(dirname "$0")/.."

echo "📦 Installing dependencies..."
npm install

echo "🔧 Running TypeScript compilation check..."
npx tsc --noEmit

echo "🎨 Running ESLint..."
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    npx eslint src --ext .ts,.tsx --max-warnings 0
else
    echo "⚠️  ESLint config not found, skipping linting"
fi

echo "🏗️  Building frontend..."
npm run build

echo "📊 Checking bundle size..."
if [ -d "dist" ]; then
    echo "Bundle contents:"
    ls -la dist/
    echo ""
    echo "Asset sizes:"
    du -h dist/assets/* 2>/dev/null || echo "No assets found"
fi

echo "✅ Frontend tests completed successfully!"
