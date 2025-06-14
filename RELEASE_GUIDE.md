# 🚀 Automated Release Setup Guide

## Overview
This project is configured with comprehensive GitHub Actions workflows that automatically handle:

- **CI/CD Pipeline**: Linting, testing, and validation on every push/PR
- **Automatic Versioning**: Semantic versioning based on commit messages
- **Cross-Platform Builds**: Windows, macOS, and Linux binaries
- **Automated Releases**: GitHub releases with generated changelogs

## 📦 GitHub Workflows

### 1. Continuous Integration (`ci.yml`)
**Triggers**: Push/PR to main, develop branches
**Actions**:
- Frontend and backend linting
- Python/Rust security audits
- Medical disclaimer compliance checks
- Bundle size analysis (max 10MB)
- Cross-platform compatibility tests

### 2. Auto Version & Changelog (`auto-version.yml`)
**Triggers**: Push to main branch
**Actions**:
- Analyzes commit messages for version bumps
- Generates semantic versions (major.minor.patch)
- Updates `package.json`, `Cargo.toml`, `tauri.conf.json`
- Creates git tags
- Generates changelogs from commit history

**Commit Message Conventions**:
```bash
feat: new feature → minor version bump
fix: bug fix → patch version bump  
BREAKING CHANGE: → major version bump
docs: documentation → patch version bump
```

### 3. Build & Release (`build-release.yml`)
**Triggers**: Push to main, tags starting with 'v'
**Actions**:
- Builds for Windows (.msi), macOS (.dmg/.app), Linux (.AppImage/.deb)
- Creates GitHub releases with detailed release notes
- Attaches all platform binaries
- Includes medical disclaimers and installation instructions

## 🔧 Setup Instructions

### 1. Initialize Repository
```bash
# Run the setup script
./setup-git.sh

# Or manually:
git init
git add .
git commit -m "feat: initial release"
git tag v1.0.0
```

### 2. GitHub Repository Setup
```bash
# Create repository on GitHub, then:
git remote add origin https://github.com/yourusername/offline-medical-assistant.git
git branch -M main
git push -u origin main
git push origin --tags
```

### 3. Configure GitHub Secrets (if needed)
- No additional secrets required for basic functionality
- `GITHUB_TOKEN` is automatically provided by GitHub Actions

## 📋 Release Process

### Automatic Releases (Recommended)
1. Make changes and commit with conventional commit messages:
   ```bash
   git commit -m "feat: add new medical consultation feature"
   git commit -m "fix: resolve database connection issue"
   ```

2. Push to main branch:
   ```bash
   git push origin main
   ```

3. Workflows automatically:
   - Analyze commits for version type
   - Update version numbers
   - Create git tag
   - Build cross-platform binaries
   - Create GitHub release with changelog

### Manual Releases
1. Create and push a tag:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

2. GitHub Actions will automatically build and release

## 🏗️ Build Targets

### Windows
- `.msi` installer package
- Includes all dependencies

### macOS  
- `.dmg` for Intel Macs
- `.app.tar.gz` for Apple Silicon (M1/M2)
- Code-signed (if certificates provided)

### Linux
- `.AppImage` (portable)
- `.deb` package (Debian/Ubuntu)

## 🔍 Quality Checks

Each build includes:
- ✅ TypeScript compilation
- ✅ Python linting (black, flake8, mypy)
- ✅ Rust linting (rustfmt, clippy)
- ✅ Security audits (npm audit, cargo audit)
- ✅ Medical disclaimer compliance
- ✅ Bundle size validation
- ✅ Cross-platform compatibility

## 📝 Release Notes Template

Releases automatically include:
- **Privacy disclaimer** for medical data
- **Installation instructions** per platform
- **Ollama setup requirements**
- **Platform-specific download links**
- **Auto-generated changelog** from commits

## 🚨 Important Notes

### Medical Compliance
- All releases include medical disclaimers
- CI checks enforce disclaimer presence
- Educational use only statements included

### Privacy Features
- No telemetry or external API calls
- Local data storage only
- Offline-first architecture enforced

### Version Management
- Semantic versioning (semver) enforced
- Automatic dependency updates
- Changelog generation from commits

## 🛠️ Troubleshooting

### Build Failures
- Check CI logs in GitHub Actions tab
- Ensure all dependencies are in requirements.txt
- Verify TypeScript types are correct

### Version Issues
- Use `[skip-version]` in commit message to skip auto-versioning
- Manually create tags if needed: `git tag v1.2.3`

### Platform-Specific Issues
- macOS: May need Apple Developer certificates for signing
- Windows: Ensure .NET Framework requirements are met
- Linux: AppImage should work on most distributions

## 📞 Support

For issues with the build process:
1. Check GitHub Actions logs
2. Review commit message conventions
3. Ensure all medical disclaimers are present
4. Verify bundle size limits (< 10MB)

The automated release system is designed to handle everything from development to distribution with minimal manual intervention while maintaining medical software standards and privacy requirements.
