"""
Basic tests for the Offline Medical AI Assistant Backend
"""

import pytest
import sys
import os

# Add the backend directory to Python path for testing
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_python_version():
    """Test that we're running a supported Python version."""
    assert sys.version_info >= (3, 8), "Python 3.8+ is required"


def test_backend_structure():
    """Test that the backend directory structure is correct."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Check for essential files
    assert os.path.exists(os.path.join(backend_dir, "run.py")), "run.py should exist"
    assert os.path.exists(os.path.join(backend_dir, "app")), "app directory should exist"
    
    # Check for app structure
    app_dir = os.path.join(backend_dir, "app")
    assert os.path.exists(os.path.join(app_dir, "__init__.py")), "app/__init__.py should exist"


def test_import_uvicorn():
    """Test that uvicorn can be imported."""
    try:
        import uvicorn
        assert uvicorn is not None
    except ImportError:
        pytest.skip("uvicorn not installed")


def test_requirements_file():
    """Test that requirements.txt exists and is not empty."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    requirements_path = os.path.join(backend_dir, "requirements.txt")
    
    assert os.path.exists(requirements_path), "requirements.txt should exist"
    
    # Check that it's not empty
    with open(requirements_path, 'r') as f:
        content = f.read().strip()
        assert len(content) > 0, "requirements.txt should not be empty"
        
        # Check for essential dependencies
        assert 'fastapi' in content.lower(), "FastAPI should be in requirements"
        assert 'uvicorn' in content.lower(), "Uvicorn should be in requirements"


@pytest.mark.asyncio
async def test_basic_async():
    """Test that async functionality works."""
    import asyncio
    await asyncio.sleep(0.001)  # Basic async test
    assert True


if __name__ == "__main__":
    pytest.main([__file__])
