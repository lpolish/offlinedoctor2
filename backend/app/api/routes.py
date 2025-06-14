"""
API Routes for the Offline Medical AI Assistant

Defines REST API endpoints for medical queries, AI interactions,
and system management functionality.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Request/Response Models
class MedicalQueryRequest(BaseModel):
    """Request model for medical queries"""
    query: str = Field(..., description="The medical question or symptom description")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    query_type: str = Field("general", description="Type of query: general, symptoms, drug_interaction, medical_term")
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "I have a headache and feel tired",
                "session_id": "12345",
                "query_type": "symptoms"
            }
        }


class MedicalQueryResponse(BaseModel):
    """Response model for medical queries"""
    response: str
    confidence: float
    session_id: str
    conversation_id: Optional[int]
    query_type: str
    timestamp: str
    emergency_detected: Optional[bool] = False
    medical_guidance: Optional[Dict[str, Any]] = None
    related_conditions: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "Headaches can have various causes...",
                "confidence": 0.8,
                "session_id": "12345",
                "conversation_id": 1,
                "query_type": "symptoms",
                "timestamp": "2025-06-13T22:00:00",
                "emergency_detected": False
            }
        }


class SessionCreateResponse(BaseModel):
    """Response model for session creation"""
    session_id: str
    session_type: str
    created_at: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "12345-67890",
                "session_type": "symptoms",
                "created_at": "2025-06-13T22:00:00"
            }
        }


class AIModelInfo(BaseModel):
    """AI model information response"""
    available: bool
    models: List[str]
    default_model: str
    medical_model: str
    ollama_url: str


class SystemStatus(BaseModel):
    """System status response"""
    status: str
    database: str
    ai_service: str
    timestamp: str


# Initialize routers
medical_router = APIRouter()
ai_router = APIRouter()
system_router = APIRouter()


# Medical endpoints
@medical_router.post("/session", response_model=SessionCreateResponse)
async def create_medical_session(
    session_type: str = "general",
    request: Request = None
):
    """
    Create a new medical consultation session
    
    **MEDICAL DISCLAIMER**: This service provides educational information only.
    Always consult healthcare professionals for medical advice.
    """
    try:
        medical_service = request.app.state.medical_service
        session_id = await medical_service.create_session(session_type)
        
        return SessionCreateResponse(
            session_id=session_id,
            session_type=session_type,
            created_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create session")


@medical_router.post("/query", response_model=MedicalQueryResponse)
async def process_medical_query(
    query_request: MedicalQueryRequest,
    request: Request = None
):
    """
    Process a medical query using AI and medical knowledge base
    
    **IMPORTANT MEDICAL DISCLAIMER**: 
    This service provides educational information only and should not be used
    for medical diagnosis or treatment decisions. Always consult with qualified
    healthcare professionals for medical advice.
    
    **Emergency Situations**: 
    If you are experiencing a medical emergency, call your local emergency
    services immediately. Do not rely on this service for emergency care.
    """
    try:
        medical_service = request.app.state.medical_service
        
        # Create session if not provided
        session_id = query_request.session_id
        if not session_id:
            session_id = await medical_service.create_session(query_request.query_type)
        
        # Process the query
        result = await medical_service.process_medical_query(
            session_id=session_id,
            query=query_request.query,
            query_type=query_request.query_type
        )
        
        return MedicalQueryResponse(**result)
        
    except Exception as e:
        logger.error(f"Failed to process medical query: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to process medical query. Please try again or consult a healthcare professional."
        )


@medical_router.get("/session/{session_id}/history")
async def get_session_history(
    session_id: str,
    request: Request = None
):
    """
    Get conversation history for a medical session
    
    Returns the complete conversation history including all queries and responses
    for the specified session.
    """
    try:
        medical_service = request.app.state.medical_service
        history = await medical_service.get_session_history(session_id)
        
        if "error" in history:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session history: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session history")


@medical_router.get("/conditions/search")
async def search_medical_conditions(
    q: str = None,
    severity: str = None,
    limit: int = 10,
    request: Request = None
):
    """
    Search medical conditions in the knowledge base
    
    Allows searching for medical conditions by name, symptoms, or description.
    Results are for educational purposes only.
    """
    try:
        if not q:
            raise HTTPException(status_code=400, detail="Search query 'q' is required")
        
        db_manager = request.app.state.db_manager
        
        # Build query based on parameters
        query = "SELECT id, name, description, severity FROM medical_conditions WHERE "
        params = []
        conditions = []
        
        # Search in name and description
        conditions.append("(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)")
        search_term = f"%{q.lower()}%"
        params.extend([search_term, search_term])
        
        # Filter by severity if provided
        if severity:
            conditions.append("severity = ?")
            params.append(severity)
        
        query += " AND ".join(conditions)
        query += f" LIMIT {min(limit, 50)}"  # Cap at 50 results
        
        rows = await db_manager.execute_query(query, tuple(params))
        
        results = []
        for row in rows:
            results.append({
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "severity": row[3]
            })
        
        return {
            "results": results,
            "total": len(results),
            "query": q,
            "disclaimer": "This information is for educational purposes only. Consult healthcare professionals for medical advice."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to search conditions: {e}")
        raise HTTPException(status_code=500, detail="Failed to search medical conditions")


# AI endpoints
@ai_router.get("/models", response_model=AIModelInfo)
async def get_ai_models(request: Request = None):
    """
    Get information about available AI models
    
    Returns details about the AI models available for medical consultations,
    including which models are currently loaded and ready for use.
    """
    try:
        ai_service = request.app.state.ai_service
        model_info = await ai_service.get_model_info()
        
        return AIModelInfo(**model_info)
        
    except Exception as e:
        logger.error(f"Failed to get model info: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve AI model information")


@ai_router.post("/general")
async def general_ai_query(
    query: str,
    session_id: Optional[str] = None,
    request: Request = None
):
    """
    Process a general (non-medical) AI query
    
    For general questions that don't require medical expertise.
    Medical questions should use the /medical/query endpoint instead.
    """
    try:
        ai_service = request.app.state.ai_service
        
        if not ai_service.is_ready():
            raise HTTPException(status_code=503, detail="AI service is not available")
        
        # Simple context - could be enhanced with session storage
        context = []
        
        result = await ai_service.generate_general_response(query, context)
        
        return {
            "response": result["response"],
            "confidence": result.get("confidence", 0.0),
            "model": result.get("model", "unknown"),
            "timestamp": result.get("timestamp", datetime.now().isoformat())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process general query: {e}")
        raise HTTPException(status_code=500, detail="Failed to process AI query")


# System endpoints
@system_router.get("/health", response_model=SystemStatus)
async def system_health(request: Request = None):
    """
    Get system health status
    
    Returns the current status of all system components including
    database connectivity and AI service availability.
    """
    try:
        # Check database
        db_status = "connected"
        try:
            db_manager = request.app.state.db_manager
            await db_manager.execute_query("SELECT 1", ())
        except:
            db_status = "disconnected"
        
        # Check AI service
        ai_status = "ready"
        try:
            ai_service = request.app.state.ai_service
            if not ai_service.is_ready():
                ai_status = "not_ready"
        except:
            ai_status = "error"
        
        return SystemStatus(
            status="healthy" if db_status == "connected" and ai_status == "ready" else "degraded",
            database=db_status,
            ai_service=ai_status,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Health check failed")


@system_router.get("/stats")
async def system_stats(request: Request = None):
    """
    Get system statistics
    
    Returns usage statistics and system metrics for monitoring purposes.
    """
    try:
        db_manager = request.app.state.db_manager
        stats = await db_manager.get_database_stats()
        
        return {
            "database_stats": stats,
            "timestamp": datetime.now().isoformat(),
            "disclaimer": "All data is stored locally for privacy protection"
        }
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve system statistics")


@system_router.post("/backup")
async def create_backup(
    backup_name: Optional[str] = None,
    request: Request = None
):
    """
    Create a backup of the local database
    
    Creates a backup file of the medical assistant database for data protection.
    All backups are stored locally to maintain privacy.
    """
    try:
        db_manager = request.app.state.db_manager
        
        if not backup_name:
            backup_name = f"medical_assistant_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        
        success = db_manager.backup_database(f"./backups/{backup_name}")
        
        if success:
            return {
                "success": True,
                "backup_name": backup_name,
                "created_at": datetime.now().isoformat(),
                "message": "Backup created successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Backup creation failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backup creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create backup")


# Medical disclaimer is handled in responses, not middleware
# Middleware is added at the app level in main.py
