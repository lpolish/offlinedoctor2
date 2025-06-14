"""
Database module for the Offline Medical AI Assistant

Provides SQLite database management with SQLAlchemy ORM for local data storage.
All medical data is stored locally to ensure privacy and offline functionality.
"""

import sqlite3
import aiosqlite
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from typing import AsyncGenerator, Optional
import os
import logging

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = "sqlite:///./medical_assistant.db"
DATABASE_PATH = "./medical_assistant.db"

# SQLAlchemy setup
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30
    },
    poolclass=StaticPool,
    echo=False  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class DatabaseManager:
    """
    Manages SQLite database connections and operations for the medical assistant.
    
    Provides both synchronous and asynchronous database operations while
    ensuring data privacy and local storage compliance.
    """
    
    def __init__(self):
        self.database_path = DATABASE_PATH
        self.is_initialized = False
        
    async def initialize(self) -> None:
        """Initialize the database and create tables"""
        try:
            # Create database directory if it doesn't exist
            os.makedirs(os.path.dirname(self.database_path), exist_ok=True)
            
            # Create tables
            from .models import Base
            Base.metadata.create_all(bind=engine)
            
            # Initialize with default data
            await self._initialize_default_data()
            
            self.is_initialized = True
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise
    
    async def _initialize_default_data(self) -> None:
        """Initialize database with default medical data"""
        try:
            async with aiosqlite.connect(self.database_path) as db:
                # Check if we need to seed data
                cursor = await db.execute("SELECT COUNT(*) FROM medical_conditions")
                count = await cursor.fetchone()
                
                if count[0] == 0:
                    # Insert sample medical conditions
                    await self._seed_medical_data(db)
                    
        except Exception as e:
            logger.warning(f"Could not initialize default data: {e}")
    
    async def _seed_medical_data(self, db: aiosqlite.Connection) -> None:
        """Seed the database with basic medical data"""
        # Sample medical conditions
        conditions = [
            ("common_cold", "Common Cold", "Viral infection of the upper respiratory tract", "mild"),
            ("influenza", "Influenza", "Viral infection affecting the respiratory system", "moderate"),
            ("hypertension", "High Blood Pressure", "Condition where blood pressure is consistently elevated", "serious"),
            ("diabetes_t2", "Type 2 Diabetes", "Metabolic disorder characterized by high blood sugar", "serious"),
            ("headache_tension", "Tension Headache", "Most common type of headache", "mild"),
        ]
        
        for condition_id, name, description, severity in conditions:
            await db.execute(
                "INSERT OR IGNORE INTO medical_conditions (id, name, description, severity) VALUES (?, ?, ?, ?)",
                (condition_id, name, description, severity)
            )
        
        await db.commit()
        logger.info("Default medical data seeded successfully")
    
    def get_session(self) -> Session:
        """Get a synchronous database session"""
        return SessionLocal()
    
    async def get_async_session(self) -> AsyncGenerator[aiosqlite.Connection, None]:
        """Get an asynchronous database connection"""
        async with aiosqlite.connect(self.database_path) as db:
            # Enable foreign keys
            await db.execute("PRAGMA foreign_keys = ON")
            yield db
    
    async def execute_query(self, query: str, params: tuple = ()) -> list:
        """Execute a query and return results"""
        try:
            async with aiosqlite.connect(self.database_path) as db:
                cursor = await db.execute(query, params)
                return await cursor.fetchall()
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise
    
    async def execute_update(self, query: str, params: tuple = ()) -> int:
        """Execute an update/insert/delete query"""
        try:
            async with aiosqlite.connect(self.database_path) as db:
                cursor = await db.execute(query, params)
                await db.commit()
                return cursor.rowcount
        except Exception as e:
            logger.error(f"Update execution failed: {e}")
            raise
    
    async def close(self) -> None:
        """Close database connections"""
        # Close any remaining connections
        engine.dispose()
        logger.info("Database connections closed")
    
    def backup_database(self, backup_path: str) -> bool:
        """Create a backup of the database"""
        try:
            import shutil
            shutil.copy2(self.database_path, backup_path)
            logger.info(f"Database backed up to {backup_path}")
            return True
        except Exception as e:
            logger.error(f"Database backup failed: {e}")
            return False
    
    async def get_database_stats(self) -> dict:
        """Get database statistics"""
        try:
            stats = {}
            async with aiosqlite.connect(self.database_path) as db:
                # Get table counts
                tables = ["conversations", "medical_conditions", "user_sessions", "ai_responses"]
                for table in tables:
                    try:
                        cursor = await db.execute(f"SELECT COUNT(*) FROM {table}")
                        count = await cursor.fetchone()
                        stats[table] = count[0] if count else 0
                    except:
                        stats[table] = 0
                
                # Get database size
                try:
                    stats["database_size"] = os.path.getsize(self.database_path)
                except:
                    stats["database_size"] = 0
                    
            return stats
        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")
            return {}


# Dependency for FastAPI
async def get_database() -> DatabaseManager:
    """Dependency to get database manager instance"""
    return DatabaseManager()
