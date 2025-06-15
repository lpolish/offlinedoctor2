#!/bin/bash
# Run All Tests in Sequence

set -e

echo "🔬 Running Complete Test Suite..."
echo "================================"

SCRIPT_DIR="$(dirname "$0")"
ROOT_DIR="$SCRIPT_DIR/.."

cd "$ROOT_DIR"

echo "Phase 1: Frontend Tests"
echo "========================"
bash "$SCRIPT_DIR/test-frontend.sh"

echo ""
echo "Phase 2: Backend Tests"
echo "======================"
bash "$SCRIPT_DIR/test-backend.sh"

echo ""
echo "Phase 3: Integration Build Test"
echo "==============================="
echo "⚠️  This will take several minutes and create large build artifacts"
echo "💾 Make sure you have at least 2GB of free disk space"
read -p "Continue with full build test? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    bash "$SCRIPT_DIR/test-build.sh"
else
    echo "⏭️  Skipping full build test"
fi

echo ""
echo "🎉 All automated tests completed!"
echo ""
echo "Manual Tests:"
echo "============="
echo "To test the development server and UI:"
echo "  bash scripts/test-dev.sh"
echo ""
echo "To test API functionality:"
echo "  bash scripts/test-api.sh"
