"""
Database models for the Offline Medical AI Assistant

Defines SQLAlchemy models for storing medical data, conversations,
and user interactions locally in SQLite.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional

Base = declarative_base()


class MedicalCondition(Base):
    """Model for storing medical conditions and their information"""
    __tablename__ = "medical_conditions"
    
    id = Column(String, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    severity = Column(String(50))  # mild, moderate, serious, emergency
    symptoms = Column(Text)  # JSON string of symptoms
    causes = Column(Text)  # JSON string of common causes
    treatments = Column(Text)  # JSON string of treatment options
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Conversation(Base):
    """Model for storing AI conversation history"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), nullable=False)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    confidence_score = Column(Float)  # AI confidence in response
    medical_disclaimer_shown = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to session
    session = relationship("UserSession", back_populates="conversations")


class UserSession(Base):
    """Model for storing user sessions"""
    __tablename__ = "user_sessions"
    
    id = Column(String(50), primary_key=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    total_messages = Column(Integer, default=0)
    session_type = Column(String(50))  # general, symptom_check, drug_lookup, etc.
    
    # Relationship to conversations
    conversations = relationship("Conversation", back_populates="session")


class AIResponse(Base):
    """Model for storing AI response metadata and analytics"""
    __tablename__ = "ai_responses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    model_name = Column(String(100))
    temperature = Column(Float)
    tokens_used = Column(Integer)
    response_time_ms = Column(Integer)
    error_occurred = Column(Boolean, default=False)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class DrugInteraction(Base):
    """Model for storing drug interaction data"""
    __tablename__ = "drug_interactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    drug_a = Column(String(200), nullable=False)
    drug_b = Column(String(200), nullable=False)
    interaction_type = Column(String(50))  # major, moderate, minor
    description = Column(Text)
    severity_score = Column(Integer)  # 1-10 scale
    created_at = Column(DateTime, default=datetime.utcnow)


class MedicalTerm(Base):
    """Model for storing medical terminology dictionary"""
    __tablename__ = "medical_terms"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    term = Column(String(200), nullable=False, unique=True)
    definition = Column(Text, nullable=False)
    category = Column(String(100))  # anatomy, symptoms, treatments, etc.
    pronunciation = Column(String(200))
    related_terms = Column(Text)  # JSON string of related terms
    created_at = Column(DateTime, default=datetime.utcnow)


class UserPreference(Base):
    """Model for storing user preferences and settings"""
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    preference_key = Column(String(100), nullable=False, unique=True)
    preference_value = Column(Text)
    data_type = Column(String(20))  # string, integer, boolean, json
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Create database schema SQL for manual setup
def get_create_schema_sql() -> str:
    """Get SQL statements to create the database schema manually"""
    return """
    CREATE TABLE IF NOT EXISTS medical_conditions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        severity TEXT,
        symptoms TEXT,
        causes TEXT,
        treatments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_messages INTEGER DEFAULT 0,
        session_type TEXT
    );

    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        confidence_score REAL,
        medical_disclaimer_shown BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES user_sessions (id)
    );

    CREATE TABLE IF NOT EXISTS ai_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        model_name TEXT,
        temperature REAL,
        tokens_used INTEGER,
        response_time_ms INTEGER,
        error_occurred BOOLEAN DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
    );

    CREATE TABLE IF NOT EXISTS drug_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        drug_a TEXT NOT NULL,
        drug_b TEXT NOT NULL,
        interaction_type TEXT,
        description TEXT,
        severity_score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medical_terms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        term TEXT NOT NULL UNIQUE,
        definition TEXT NOT NULL,
        category TEXT,
        pronunciation TEXT,
        related_terms TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        preference_key TEXT NOT NULL UNIQUE,
        preference_value TEXT,
        data_type TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
    CREATE INDEX IF NOT EXISTS idx_medical_conditions_severity ON medical_conditions(severity);
    CREATE INDEX IF NOT EXISTS idx_drug_interactions_drugs ON drug_interactions(drug_a, drug_b);
    CREATE INDEX IF NOT EXISTS idx_medical_terms_term ON medical_terms(term);
    CREATE INDEX IF NOT EXISTS idx_medical_terms_category ON medical_terms(category);
    """
