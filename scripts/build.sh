#!/bin/bash

# Build script for cross-platform distribution
set -e

echo "🏗️  Building Offline Medical AI Assistant for distribution"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf backend/dist/
rm -rf src-tauri/target/release/

# Build frontend
echo "📦 Building frontend..."
npm run build

# Build Tauri app for current platform
echo "🦀 Building Tauri application..."
npm run tauri build

echo ""
echo "✅ Build complete!"
echo ""
echo "Distribution files:"
echo "- Frontend build: dist/"
echo "- Tauri app: src-tauri/target/release/"
echo ""
echo "For backend deployment, use Docker:"
echo "- docker-compose -f docker/docker-compose.yml build"
