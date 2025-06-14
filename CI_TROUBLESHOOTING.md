# CI/CD Workflow Troubleshooting Guide

This document provides solutions for common CI/CD workflow issues in the Offline Medical AI Assistant project.

## Common Issues and Solutions

### 1. Python/pytest Issues

**Error**: `No module named pytest` or `No tests found, skipping...`

**Solutions Applied**:
- ✅ Added proper `requirements.txt` with all necessary dependencies
- ✅ Added fallback installation of pytest if not found
- ✅ Created basic test suite in `backend/tests/`
- ✅ Added pytest configuration in `pytest.ini`
- ✅ Added cross-platform compatibility for Windows/Unix

**Manual Fix**:
```bash
cd backend
pip install -r requirements.txt
python -m pytest
```

### 2. Windows Path Issues

**Error**: `C:\hostedtoolcache\windows\Python\3.11.9\x64\python.exe: No module named pytest`

**Solutions Applied**:
- ✅ Added separate Windows and Unix steps in workflows
- ✅ Used PowerShell for Windows-specific commands
- ✅ Added proper shell specifications
- ✅ Added pip caching for faster builds

### 3. Frontend Build Failures

**Error**: `npm run build` fails

**Solutions Applied**:
- ✅ Added fallback from `npm ci` to `npm install`
- ✅ Added error diagnostics and environment info
- ✅ Added build output validation
- ✅ Added proper error messages and debugging info

### 4. Missing Dependencies

**Error**: Various import errors

**Solutions Applied**:
- ✅ Created comprehensive `requirements.txt`
- ✅ Added dependency validation steps
- ✅ Added pip caching for performance
- ✅ Added fallback dependency installation

### 5. Rust/Cargo Issues

**Solutions Applied**:
- ✅ Added Rust version checking
- ✅ Added cargo-audit installation with error handling
- ✅ Added proper error reporting for clippy/fmt issues
- ✅ Added Rust dependency caching

## Workflow Optimizations

### Performance Improvements
- 📈 Added pip dependency caching
- 📈 Added npm dependency caching  
- 📈 Added Rust dependency caching
- 📈 Optimized dependency installation order

### Error Handling
- 🛡️ Graceful handling of missing test files
- 🛡️ Fallback installations for missing tools
- 🛡️ Cross-platform compatibility
- 🛡️ Detailed error diagnostics

### Reliability
- 🔒 Multiple fallback strategies
- 🔒 Environment validation
- 🔒 Build artifact verification
- 🔒 Comprehensive logging

## Workflow Files Modified

1. **`.github/workflows/ci.yml`**
   - Added environment info step
   - Improved Python dependency handling
   - Enhanced error reporting
   - Added cross-platform shell handling

2. **`.github/workflows/build-release.yml`**
   - Added Windows/Unix separate steps
   - Improved frontend build validation
   - Enhanced Python testing logic
   - Added build artifact verification

3. **`.github/workflows/auto-version.yml`**
   - Added fallback for semantic-release installation
   - Improved error handling

## New Files Created

1. **`backend/requirements.txt`** - Comprehensive Python dependencies
2. **`backend/tests/test_basic.py`** - Basic test suite
3. **`backend/tests/__init__.py`** - Test package initialization
4. **`backend/pytest.ini`** - Pytest configuration

## Testing the Fixes

### Local Testing
```bash
# Test Python backend
cd backend
pip install -r requirements.txt
python -m pytest

# Test frontend
npm ci
npm run build

# Test Rust
cd src-tauri
cargo test
cargo clippy
cargo fmt --check
```

### CI/CD Testing
1. Push changes to a feature branch
2. Create a pull request to trigger CI
3. Check all workflow steps pass
4. Merge when green

## Monitoring and Maintenance

### Regular Tasks
- 📅 Update dependencies monthly
- 📅 Review security audit results
- 📅 Monitor build times and optimize
- 📅 Update test coverage

### Key Metrics to Watch
- ⏱️ Build duration
- 💾 Cache hit rates
- 🚫 Failure rates
- 🔍 Test coverage

## Emergency Procedures

If builds are completely failing:

1. **Check Status Pages**
   - GitHub Actions status
   - npm registry status
   - PyPI status

2. **Quick Fixes**
   ```bash
   # Skip problematic steps temporarily
   git commit -m "fix: temporary skip of failing step [skip-version]"
   ```

3. **Rollback Strategy**
   - Revert to last known good workflow
   - Disable problematic features temporarily
   - Use manual release process if needed

## Contact and Support

For workflow issues:
1. Check this troubleshooting guide
2. Review workflow logs in GitHub Actions
3. Check recent commits for breaking changes
4. Create an issue with full error logs
