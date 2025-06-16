# Offline Doctor 2 - Medical AI Assistant

A privacy-focused, offline medical AI assistant built with Tauri and React. This application provides medical consultation and assistance while ensuring complete data privacy by running entirely offline as a self-contained desktop application.

## 🚀 Features

- **Offline Operation**: Complete medical AI assistance without internet dependency
- **Privacy First**: All data remains on your local machine
- **Medical Chat Interface**: Interactive consultation with AI medical assistant
- **Medical History**: Track and review past consultations
- **Cross-Platform**: Desktop application for Windows, macOS, and Linux
- **Modern UI**: Clean, responsive interface built with React and TailwindCSS
- **Ollama Integration**: Enhanced AI responses when Ollama is available
- **Self-Contained**: No separate backend services required

## 🏗️ Architecture

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Integrated Tauri Rust commands
- **Desktop**: Tauri framework for cross-platform desktop app
- **Database**: SQLite for local data storage (managed by Tauri)
- **AI Integration**: Ollama support with intelligent fallbacks

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **Ollama** (optional, for enhanced AI responses)

## 🛠️ Installation

### Quick Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd offlinedoctor2

# Run setup script
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

### Manual Setup

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Install Tauri CLI:**
```bash
npm install -g @tauri-apps/cli
```

3. **Install Rust** (if not already installed):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 🚀 Development

### Quick Start

```bash
# Quick health check
npm test

# Start development server
npm run tauri dev
```

### Developer Guide

For comprehensive development instructions, run:
```bash
npm run guide
```

This displays the complete developer testing guide with all available commands and workflows.

### Available Testing Scripts

| Script | Command | Duration | Description |
|--------|---------|----------|-------------|
| **Health Check** | `npm test` | ~30s | Quick verification of project setup |
| **Frontend Tests** | `npm run test:frontend` | ~1-2m | TypeScript, build, and bundle tests |
| **Backend Tests** | `npm run test:backend` | ~1-2m | Rust compilation, linting, and tests |
| **Development Server** | `npm run test:dev` | Manual | Start app for manual testing |
| **API Testing** | `npm run test:api` | Manual | Test backend API endpoints |
| **Full Build** | `npm run test:build` | ~5-10m | Complete Tauri app build (2GB+) |
| **All Tests** | `npm run test:all` | Interactive | Run complete test suite |
| **Developer Guide** | `npm run guide` | - | Show comprehensive testing guide |

### Development Workflow

1. **Daily Development:**
   ```bash
   npm test                    # Quick health check
   # Make your changes
   npm run test:frontend       # Test frontend changes
   npm run test:backend        # Test backend changes (if Rust)
   npm run test:dev           # Manual testing
   ```

2. **Before Commits:**
   ```bash
   npm run test:all           # Run all automated tests
   npm run test:dev          # Manual verification
   ```

3. **Release Preparation:**
   ```bash
   npm run test:all          # Full test suite
   npm run test:build        # Build verification
   ```

### Manual Testing Checklist

When running development server (`npm run test:dev`):

- **HomePage**: Welcome message, navigation, status indicators
- **ChatPage**: Submit queries, view responses, emergency detection
- **HistoryPage**: View past conversations, search functionality
- **SettingsPage**: AI service management, model selection, health checks

### Start Development Server

```bash
# Start Tauri development server (includes frontend hot reload)
npm run tauri dev
```

### Build for Production

```bash
# Build the application
./scripts/build.sh

# Or build Tauri app directly
npm run tauri build

# Or use test script for verification
npm run test:build
```

## 🤖 Ollama Integration (Optional)

For enhanced AI responses, install Ollama:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a medical-focused model
ollama pull llama2:7b

# Start Ollama service
ollama serve
```

The application will automatically detect and use Ollama when available, falling back to built-in responses otherwise.

## 📁 Project Structure

```
offlinedoctor2/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/             # Application pages
│   └── services/          # API services (Tauri commands)
├── src-tauri/             # Tauri desktop app
│   ├── src/               # Rust backend logic
│   └── Cargo.toml         # Rust dependencies
├── scripts/               # Build and setup scripts
└── docs/                  # Documentation
```

## 🔧 Configuration

The application is self-configuring and stores all data locally. Settings can be adjusted through the UI.

## 🧪 Testing

### Quick Testing Commands

```bash
# Health check (recommended first step)
npm test

# Test frontend only
npm run test:frontend

# Test backend only  
npm run test:backend

# Manual testing with dev server
npm run test:dev

# Complete test suite
npm run test:all
```

### Automated Testing

The project includes comprehensive automated testing:

- **TypeScript Compilation**: Ensures all frontend code compiles correctly
- **Rust Compilation**: Verifies backend builds without errors
- **Linting**: Code quality checks for both frontend and backend
- **Build Verification**: Confirms production builds work
- **Bundle Analysis**: Checks asset sizes and dependencies

### Manual Testing

Use the development server to test:
- UI responsiveness and navigation
- AI query processing and responses
- Settings and configuration
- Data persistence and history

For detailed testing instructions, run: `npm run guide`

## 📚 Usage

1. **Start the Application**: Launch using the development commands above
2. **Medical Consultation**: Use the chat interface to ask medical questions
3. **View History**: Access past consultations in the History section
4. **Settings**: Configure AI model parameters and preferences

## 🔒 Privacy & Security

- **No Internet Required**: All processing happens locally
- **Local Data Storage**: SQLite database managed by Tauri
- **No Telemetry**: No data is sent to external servers
- **HIPAA Considerations**: Designed with medical data privacy in mind
- **Offline AI**: Optional Ollama integration for enhanced responses while maintaining privacy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Medical Disclaimer

This application is for educational and informational purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with questions about medical conditions.

## 🔗 Links

- [Documentation](./docs/)
- [Changelog](./CHANGELOG.md)
- [Release Guide](./RELEASE_GUIDE.md)

## 🆘 Support

For questions and support, please open an issue in the GitHub repository.

---

**Built with ❤️ for healthcare accessibility and privacy**
# Updated Sun 15 Jun 2025 07:28:01 PM PDT
