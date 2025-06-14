# Multi-stage Dockerfile for Offline Medical AI Assistant Backend

# Stage 1: Ollama AI service with medical models
FROM ollama/ollama:latest as ai-base

# Set working directory
WORKDIR /app

# Pre-pull medical AI models (comment out if you want to pull them manually)
# RUN ollama pull llama3.1:8b
# RUN ollama pull mistral:7b

# Stage 2: Python backend
FROM python:3.11-slim as backend

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Create data directories
RUN mkdir -p data logs backups

# Stage 3: Final runtime image
FROM python:3.11-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    sqlite3 \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN useradd --create-home --shell /bin/bash app
USER app
WORKDIR /home/app

# Copy application from backend stage
COPY --from=backend --chown=app:app /app ./backend

# Copy Ollama binary and setup from ai-base stage
COPY --from=ai-base --chown=app:app /usr/bin/ollama /usr/local/bin/ollama

# Install Python dependencies as app user
USER root
RUN pip install --no-cache-dir -r backend/requirements.txt
USER app

# Create necessary directories
RUN mkdir -p data logs backups ollama-data

# Set environment variables
ENV PYTHONPATH=/home/app/backend
ENV OLLAMA_DATA_DIR=/home/app/ollama-data
ENV DATABASE_PATH=/home/app/data/medical_assistant.db
ENV LOG_LEVEL=INFO

# Expose ports
EXPOSE 8000 11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Create supervisor configuration
USER root
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
USER app

# Start services using supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
