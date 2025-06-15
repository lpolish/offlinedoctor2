#!/bin/bash
# Test Full Tauri Application Build

set -e

echo "🚀 Testing Full Tauri Application..."
echo "================================"

# Change to project root
cd "$(dirname "$0")/.."

echo "📦 Installing frontend dependencies..."
npm install

echo "🔧 Building frontend..."
npm run build

echo "🦀 Building Tauri application..."
echo "This will create platform-specific bundles..."

# Build for current platform
npm run tauri build

echo "📊 Checking build artifacts..."
if [ -d "src-tauri/target/release/bundle" ]; then
    echo "Build artifacts:"
    find src-tauri/target/release/bundle -type f -name "*offline-medical-assistant*" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.exe" -o -name "*.dmg" | head -10
    
    echo ""
    echo "Bundle sizes:"
    find src-tauri/target/release/bundle -type f \( -name "*offline-medical-assistant*" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.exe" -o -name "*.dmg" \) -exec ls -lh {} \; | head -10
fi

echo "✅ Full application build completed successfully!"
