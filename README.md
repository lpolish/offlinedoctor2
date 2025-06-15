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

```bash
# Run frontend tests
npm test

# Run Rust tests
cd src-tauri
cargo test
```

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
