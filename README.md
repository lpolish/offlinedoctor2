# Offline Doctor 2 - Medical AI Assistant

A privacy-focused, offline medical AI assistant built with Tauri, React, and Python. This application provides medical consultation and assistance while ensuring complete data privacy by running entirely offline.

## 🚀 Features

- **Offline Operation**: Complete medical AI assistance without internet dependency
- **Privacy First**: All data remains on your local machine
- **Medical Chat Interface**: Interactive consultation with AI medical assistant
- **Medical History**: Track and review past consultations
- **Cross-Platform**: Desktop application for Windows, macOS, and Linux
- **Modern UI**: Clean, responsive interface built with React and TailwindCSS

## 🏗️ Architecture

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Python FastAPI for medical AI processing
- **Desktop**: Tauri framework for cross-platform desktop app
- **Database**: SQLite for local data storage
- **Containerization**: Docker support for easy deployment

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Rust** (latest stable)
- **Docker** (optional, for containerized deployment)

## 🛠️ Installation

### Quick Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd offlinedoctor2

# Run setup script
chmod +x setup-backend.sh
./setup-backend.sh
```

### Manual Setup

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Set up Python backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Install Tauri CLI:**
```bash
npm install -g @tauri-apps/cli
```

## 🚀 Development

### Start Development Server

```bash
# Terminal 1: Start backend
./scripts/start-backend.sh

# Terminal 2: Start frontend
npm run dev

# Terminal 3: Start Tauri (optional for desktop app)
npm run tauri dev
```

### Build for Production

```bash
# Build the application
./scripts/build.sh

# Or build Tauri app
npm run tauri build
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
cd docker
docker-compose up --build
```

## 📁 Project Structure

```
offlinedoctor2/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/             # Application pages
│   └── services/          # API services
├── src-tauri/             # Tauri desktop app
├── backend/               # Python FastAPI backend
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── database/     # Database models
│   │   └── services/     # Business logic
├── docker/                # Docker configuration
├── scripts/               # Build and setup scripts
└── docs/                  # Documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=sqlite:///./medical_assistant.db
AI_MODEL_PATH=./models/medical_model
LOG_LEVEL=INFO
```

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd backend
python -m pytest
```

## 📚 Usage

1. **Start the Application**: Launch using the development commands above
2. **Medical Consultation**: Use the chat interface to ask medical questions
3. **View History**: Access past consultations in the History section
4. **Settings**: Configure AI model parameters and preferences

## 🔒 Privacy & Security

- **No Internet Required**: All processing happens locally
- **Data Encryption**: Local database is encrypted
- **No Telemetry**: No data is sent to external servers
- **HIPAA Considerations**: Designed with medical data privacy in mind

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
