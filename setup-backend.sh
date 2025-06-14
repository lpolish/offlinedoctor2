#!/bin/bash

# Backend Setup Script for Offline Medical Assistant
echo "🔧 Setting up Python backend for Offline Medical Assistant..."

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

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_status $? "Virtual environment creation"
else
    print_status 0 "Virtual environment already exists"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
print_info "Upgrading pip..."
pip install --upgrade pip

# Install requirements
print_info "Installing Python dependencies..."
pip install -r requirements.txt
print_status $? "Python dependencies installation"

# Test backend imports
print_info "Testing backend imports..."
python -c "
import sys
sys.path.append('.')
from app.main import app
print('✅ Backend imports successfully')
" 2>/dev/null
print_status $? "Backend import test"

print_info "Backend setup complete!"
echo ""
echo "To run the backend:"
echo "1. cd backend"
echo "2. source venv/bin/activate"
echo "3. python run.py"

cd ..
