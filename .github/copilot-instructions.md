# Copilot Instructions for Offline Medical AI Assistant

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an offline-first medical AI assistant application built with:
- **Frontend**: React + TypeScript with Tauri for cross-platform desktop
- **Backend**: FastAPI (Python) with Ollama AI integration
- **Database**: SQLite for local storage
- **AI Models**: Local Ollama with medical-focused language models

## Key Principles
- **Privacy First**: All data stays local, no external API calls for medical data
- **Professional Medical Standards**: Always include appropriate disclaimers
- **Accessibility**: WCAG 2.1 AA compliant interfaces
- **Performance**: Sub-2GB RAM usage, <5s model loading
- **Cross-platform**: Windows, macOS, Linux support

## Code Guidelines
- Use TypeScript with strict type checking
- Follow React best practices and hooks patterns
- Implement comprehensive error handling
- Include medical disclaimers in all AI-related features
- Use semantic HTML and ARIA labels for accessibility
- Prefer functional components with TypeScript interfaces

## Medical AI Guidelines
- Always include disclaimers that this is for guidance only
- Use lower temperature settings for medical advice (0.1-0.3)
- Implement proper context management for conversations
- Include confidence scores for AI responses
- Provide fallback responses when AI is unavailable

## Architecture Patterns
- Use dependency injection for backend services
- Implement repository pattern for data access
- Use command/query separation for AI interactions
- Apply clean architecture principles
- Follow SOLID principles for maintainable code
