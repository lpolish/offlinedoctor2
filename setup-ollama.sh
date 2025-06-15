#!/bin/bash

# Setup script for bundling Ollama with the Offline Medical Assistant
# This script downloads and prepares the necessary binaries and models

set -e

PROJECT_ROOT="$(dirname "$0")"
TAURI_DIR="$PROJECT_ROOT/src-tauri"
BINARIES_DIR="$TAURI_DIR/binaries"
MODELS_DIR="$TAURI_DIR/models"

echo "🏥 Setting up Offline Medical Assistant with embedded Ollama..."

# Create directories
mkdir -p "$BINARIES_DIR"
mkdir -p "$MODELS_DIR"

# Function to download Ollama binary for different platforms
download_ollama() {
    local platform=$1
    local arch=$2
    local filename=$3
    
    echo "📥 Downloading Ollama for $platform ($arch)..."
    
    case $platform in
        "linux")
            curl -L "https://ollama.ai/download/ollama-linux-${arch}" -o "$BINARIES_DIR/$filename"
            ;;
        "darwin")
            curl -L "https://ollama.ai/download/ollama-darwin" -o "$BINARIES_DIR/$filename"
            ;;
        "windows")
            curl -L "https://ollama.ai/download/ollama-windows-${arch}.exe" -o "$BINARIES_DIR/$filename"
            ;;
    esac
    
    chmod +x "$BINARIES_DIR/$filename"
    echo "✅ Downloaded $filename"
}

# Download Ollama binaries for different platforms
echo "📦 Downloading Ollama binaries..."

# For development on current platform
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    download_ollama "linux" "amd64" "ollama-linux-amd64"
    cp "$BINARIES_DIR/ollama-linux-amd64" "$BINARIES_DIR/ollama"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    download_ollama "darwin" "" "ollama-darwin"
    cp "$BINARIES_DIR/ollama-darwin" "$BINARIES_DIR/ollama"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    download_ollama "windows" "amd64" "ollama.exe"
fi

# For cross-platform distribution (uncomment as needed)
# download_ollama "linux" "amd64" "ollama-linux-amd64"
# download_ollama "darwin" "" "ollama-darwin"
# download_ollama "windows" "amd64" "ollama.exe"

echo "🤖 Setting up medical AI models..."

# Check if Ollama is already running locally
if pgrep -x "ollama" > /dev/null; then
    echo "✅ Local Ollama is running, will use existing models"
    
    # Copy existing models if available
    if [ -d "$HOME/.ollama/models" ]; then
        echo "📂 Copying existing Ollama models..."
        cp -r "$HOME/.ollama/models"/* "$MODELS_DIR/" 2>/dev/null || true
    fi
    
    # Download TinyLlama if not present
    if ! ollama list | grep -q "tinyllama"; then
        echo "📥 Downloading TinyLlama model..."
        ollama pull tinyllama:latest
    fi
    
    # Copy the model to our bundle
    echo "📦 Preparing model for bundling..."
    if [ -d "$HOME/.ollama/models/blobs" ]; then
        mkdir -p "$MODELS_DIR/blobs"
        cp -r "$HOME/.ollama/models/blobs"/* "$MODELS_DIR/blobs/" 2>/dev/null || true
    fi
    
    if [ -d "$HOME/.ollama/models/manifests" ]; then
        mkdir -p "$MODELS_DIR/manifests"
        cp -r "$HOME/.ollama/models/manifests"/* "$MODELS_DIR/manifests/" 2>/dev/null || true
    fi
else
    echo "⚠️  Local Ollama not running. Models will be downloaded on first run."
    
    # Create a model download script for first run
    cat > "$MODELS_DIR/download_models.sh" << 'EOF'
#!/bin/bash
echo "🤖 Downloading medical AI models..."
./ollama pull tinyllama:latest
echo "✅ Models downloaded successfully"
EOF
    chmod +x "$MODELS_DIR/download_models.sh"
fi

echo "🔧 Updating Tauri configuration..."

# Update tauri.conf.json to include our binaries and models
python3 << 'EOF'
import json
import os

tauri_conf_path = "src-tauri/tauri.conf.json"

try:
    with open(tauri_conf_path, 'r') as f:
        config = json.load(f)
    
    # Ensure bundle section exists
    if 'bundle' not in config:
        config['bundle'] = {}
    
    # Add external binaries
    config['bundle']['externalBin'] = [
        "binaries/ollama-linux-amd64",
        "binaries/ollama-darwin", 
        "binaries/ollama.exe"
    ]
    
    # Add resources
    config['bundle']['resources'] = [
        "models/*"
    ]
    
    # Write back
    with open(tauri_conf_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✅ Updated tauri.conf.json")
    
except Exception as e:
    print(f"⚠️  Could not update tauri.conf.json: {e}")
    print("Please manually add the binaries and models to your tauri.conf.json")
EOF

echo "📋 Creating development instructions..."

cat > "$PROJECT_ROOT/OLLAMA_SETUP.md" << 'EOF'
# Ollama Integration Setup

## Development

For development, make sure Ollama is running locally:

```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve

# Pull a medical-friendly model
ollama pull tinyllama:latest
```

## Production Build

The setup script has prepared the necessary binaries and models for bundling.

### Building the Application

```bash
# Build for current platform
npm run tauri build

# The resulting binary will include Ollama and can run offline
```

### Bundle Size Considerations

- TinyLlama: ~637MB (recommended for general use)
- Llama2:7B: ~3.8GB (better medical knowledge)
- Llama3.1:8B: ~4.9GB (best medical responses)

Choose the model based on your target file size and system requirements.

## Model Management

The application will:
1. Try to start embedded Ollama on startup
2. Fall back to external Ollama if available
3. Provide basic responses if no AI is available

Users can switch models through the Settings page.
EOF

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Test development: npm run tauri dev"
echo "2. Build for production: npm run tauri build"
echo "3. Check OLLAMA_SETUP.md for detailed instructions"
echo ""
echo "📊 Bundle size estimates:"
echo "   - With TinyLlama: ~700MB"
echo "   - With Llama2:7B: ~4GB"
echo "   - With Llama3.1:8B: ~5GB"
echo ""

# Calculate actual sizes if models exist
if [ -d "$MODELS_DIR" ]; then
    echo "📁 Current bundle size:"
    du -sh "$BINARIES_DIR" 2>/dev/null && echo "   Binaries: $(du -sh "$BINARIES_DIR" | cut -f1)"
    du -sh "$MODELS_DIR" 2>/dev/null && echo "   Models: $(du -sh "$MODELS_DIR" | cut -f1)"
fi
