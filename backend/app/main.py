"""
Offline Medical AI Assistant Backend

This FastAPI application provides the backend services for the offline medical AI assistant.
It integrates with Ollama for AI processing and SQLite for local data storage.

IMPORTANT MEDICAL DISCLAIMER:
This application is for informational and educational purposes only.
It is not intended to replace professional medical advice, diagnosis, or treatment.
Always seek the advice of your physician or other qualified health provider.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from typing import Dict, Any

from .database.database import DatabaseManager
from .services.ai_service import AIService
from .services.medical_service import MedicalService
from .api.routes import medical_router, ai_router, system_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("Starting Offline Medical AI Assistant Backend...")
    
    # Initialize database
    db_manager = DatabaseManager()
    await db_manager.initialize()
    
    # Initialize AI service
    ai_service = AIService()
    await ai_service.initialize()
    
    # Store services in app state
    app.state.db_manager = db_manager
    app.state.ai_service = ai_service
    app.state.medical_service = MedicalService(db_manager, ai_service)
    
    print("Backend initialization complete!")
    
    yield
    
    # Shutdown
    print("Shutting down backend...")
    await ai_service.cleanup()
    await db_manager.close()


app = FastAPI(
    title="Offline Medical AI Assistant",
    description="""
    An offline-first medical AI assistant that provides medical information and guidance.
    
    **IMPORTANT MEDICAL DISCLAIMER:**
    This application is for informational and educational purposes only.
    It is not intended to replace professional medical advice, diagnosis, or treatment.
    Always seek the advice of your physician or other qualified health provider
    with any questions you may have regarding a medical condition.
    """,
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for Tauri app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["tauri://localhost", "http://localhost:1420", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(system_router, prefix="/api/system", tags=["system"])
app.include_router(medical_router, prefix="/api/medical", tags=["medical"])
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])


@app.get("/")
async def root():
    """Root endpoint with medical disclaimer"""
    return {
        "message": "Offline Medical AI Assistant Backend",
        "version": "1.0.0",
        "disclaimer": (
            "This application is for informational purposes only. "
            "It is not intended to replace professional medical advice. "
            "Always consult with a qualified healthcare provider."
        )
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        db_status = "connected" if app.state.db_manager else "disconnected"
        
        # Check AI service
        ai_status = "ready" if app.state.ai_service and app.state.ai_service.is_ready() else "not_ready"
        
        return {
            "status": "healthy",
            "database": db_status,
            "ai_service": ai_status,
            "timestamp": os.environ.get("TIMESTAMP", "unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
