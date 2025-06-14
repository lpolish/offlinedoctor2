#!/bin/bash

# Setup Git Repository for Offline Medical Assistant
echo "🔧 Setting up Git repository for Offline Medical Assistant..."

# Initialize git repository if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Set up git configuration if not set
if [ -z "$(git config user.name)" ]; then
    echo "👤 Setting up git user configuration..."
    git config user.name "Offline Medical AI Team"
    git config user.email "team@offlinemedical.ai"
    echo "✅ Git user configuration set"
fi

# Add all files to git
echo "📁 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "feat: initial setup of offline medical AI assistant

- Complete React + Tauri frontend setup
- FastAPI backend with Ollama integration  
- SQLite database for local storage
- Privacy-first architecture
- Cross-platform desktop application
- GitHub Actions for CI/CD and automated releases
- Medical disclaimers and compliance checks"

echo "🏷️  Creating initial tag..."
git tag -a "v1.0.0" -m "Initial release v1.0.0

Complete offline medical AI assistant with:
- Privacy-focused local data storage
- Ollama AI integration for medical guidance
- Cross-platform desktop application
- Automated build and release pipeline"

echo "✅ Git repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a GitHub repository"
echo "2. Add it as origin: git remote add origin <your-repo-url>"
echo "3. Push to GitHub: git push -u origin main"
echo "4. Push tags: git push origin --tags"
echo ""
echo "🚀 The GitHub Actions workflows will automatically:"
echo "   - Run CI checks on every push/PR"
echo "   - Auto-version and create releases on main branch"
echo "   - Build cross-platform binaries for releases"
