#!/bin/bash
# Test Rust Backend Compilation and Functionality

set -e

echo "🦀 Testing Rust Backend..."
echo "================================"

# Change to src-tauri directory
cd "$(dirname "$0")/../src-tauri"

echo "📦 Checking Rust toolchain..."
rustc --version
cargo --version

echo "🔍 Running cargo check..."
cargo check

echo "🧪 Running cargo clippy (linting)..."
cargo clippy -- -D warnings

echo "🔧 Running cargo fmt (formatting check)..."
cargo fmt -- --check

echo "🏗️  Running cargo build..."
cargo build

echo "📊 Checking binary size..."
if [ -f "target/debug/offline-medical-assistant" ]; then
    echo "Debug binary size:"
    ls -lh target/debug/offline-medical-assistant
fi

echo "🧪 Running unit tests..."
cargo test

echo "✅ Backend tests completed successfully!"
