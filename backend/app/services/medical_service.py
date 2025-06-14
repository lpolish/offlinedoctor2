"""
Medical Service for the Offline Medical AI Assistant

Provides medical-specific functionality including symptom checking,
drug interaction lookup, and medical terminology services.
"""

import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import uuid

from ..database.database import DatabaseManager
from .ai_service import AIService

logger = logging.getLogger(__name__)


class MedicalService:
    """
    Service for medical-specific functionality.
    
    Integrates AI capabilities with medical knowledge base to provide
    symptom checking, drug interactions, and medical information lookup.
    """
    
    def __init__(self, db_manager: DatabaseManager, ai_service: AIService):
        self.db_manager = db_manager
        self.ai_service = ai_service
        
        # Medical severity levels
        self.severity_levels = {
            "emergency": {
                "level": 4,
                "description": "Requires immediate emergency care",
                "action": "Call emergency services immediately"
            },
            "serious": {
                "level": 3,
                "description": "Requires prompt medical attention",
                "action": "Contact your healthcare provider today"
            },
            "moderate": {
                "level": 2,
                "description": "Should be evaluated by a healthcare provider",
                "action": "Schedule an appointment with your healthcare provider"
            },
            "mild": {
                "level": 1,
                "description": "Generally not serious but may benefit from medical advice",
                "action": "Consider consulting your healthcare provider if symptoms persist"
            }
        }
        
        # Emergency keywords that should trigger immediate care recommendations
        self.emergency_keywords = [
            "chest pain", "difficulty breathing", "severe headache", "stroke",
            "heart attack", "seizure", "unconscious", "severe bleeding",
            "poisoning", "overdose", "severe allergic reaction", "anaphylaxis"
        ]
    
    async def create_session(self, session_type: str = "general") -> str:
        """Create a new user session"""
        session_id = str(uuid.uuid4())
        
        try:
            await self.db_manager.execute_update(
                "INSERT INTO user_sessions (id, session_type) VALUES (?, ?)",
                (session_id, session_type)
            )
            logger.info(f"Created new session: {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise
    
    async def process_medical_query(
        self,
        session_id: str,
        query: str,
        query_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Process a medical query using AI and knowledge base
        
        Args:
            session_id: User session ID
            query: Medical question or symptoms
            query_type: Type of query (symptoms, drug_interaction, general)
            
        Returns:
            Dict containing AI response, medical guidance, and metadata
        """
        try:
            # Check for emergency keywords first
            emergency_detected = self._detect_emergency(query)
            
            if emergency_detected:
                return await self._handle_emergency_query(session_id, query)
            
            # Get conversation context
            context = await self._get_conversation_context(session_id)
            
            # Process based on query type
            if query_type == "symptoms":
                return await self._process_symptom_query(session_id, query, context)
            elif query_type == "drug_interaction":
                return await self._process_drug_interaction_query(session_id, query, context)
            elif query_type == "medical_term":
                return await self._process_medical_term_query(session_id, query, context)
            else:
                return await self._process_general_medical_query(session_id, query, context)
                
        except Exception as e:
            logger.error(f"Error processing medical query: {e}")
            return self._get_error_response(str(e))
    
    async def _process_symptom_query(
        self,
        session_id: str,
        query: str,
        context: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Process symptom-related queries"""
        
        # Enhanced prompt for symptom analysis
        symptom_prompt = f"""
        The user is describing symptoms. Please analyze them and provide:
        1. Possible common causes (educational information only)
        2. General recommendations for care
        3. When to seek medical attention
        4. Important red flags to watch for
        
        Remember: This is educational information only, not a diagnosis.
        
        User's symptoms: {query}
        """
        
        # Get AI response
        ai_response = await self.ai_service.generate_medical_response(
            symptom_prompt,
            context=context,
            include_disclaimer=True
        )
        
        # Check against knowledge base
        related_conditions = await self._find_related_conditions(query)
        
        # Store conversation
        conversation_id = await self._store_conversation(
            session_id, query, ai_response["response"], ai_response.get("confidence", 0.0)
        )
        
        # Update session activity
        await self._update_session_activity(session_id)
        
        return {
            "response": ai_response["response"],
            "confidence": ai_response.get("confidence", 0.0),
            "related_conditions": related_conditions,
            "query_type": "symptoms",
            "session_id": session_id,
            "conversation_id": conversation_id,
            "medical_guidance": self._get_symptom_guidance(),
            "timestamp": datetime.now().isoformat()
        }
    
    async def _process_drug_interaction_query(
        self,
        session_id: str,
        query: str,
        context: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Process drug interaction queries"""
        
        # Extract potential drug names from query
        potential_drugs = self._extract_drug_names(query)
        
        # Check database for known interactions
        interactions = []
        if len(potential_drugs) >= 2:
            interactions = await self._check_drug_interactions(potential_drugs)
        
        # Enhanced prompt for drug information
        drug_prompt = f"""
        The user is asking about medications or drug interactions. Please provide:
        1. General information about the mentioned medications (if any)
        2. Important safety considerations
        3. The importance of consulting healthcare providers about medications
        4. Never provide specific dosing or prescribing advice
        
        User's question: {query}
        """
        
        ai_response = await self.ai_service.generate_medical_response(
            drug_prompt,
            context=context,
            include_disclaimer=True
        )
        
        # Store conversation
        conversation_id = await self._store_conversation(
            session_id, query, ai_response["response"], ai_response.get("confidence", 0.0)
        )
        
        await self._update_session_activity(session_id)
        
        return {
            "response": ai_response["response"],
            "confidence": ai_response.get("confidence", 0.0),
            "potential_drugs": potential_drugs,
            "known_interactions": interactions,
            "query_type": "drug_interaction",
            "session_id": session_id,
            "conversation_id": conversation_id,
            "drug_safety_guidance": self._get_drug_safety_guidance(),
            "timestamp": datetime.now().isoformat()
        }
    
    async def _process_medical_term_query(
        self,
        session_id: str,
        query: str,
        context: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Process medical terminology queries"""
        
        # Search medical terms database
        term_definitions = await self._search_medical_terms(query)
        
        # AI prompt for medical terminology
        term_prompt = f"""
        The user is asking about medical terminology. Please provide:
        1. Clear, simple explanations of medical terms
        2. Pronunciation help if relevant
        3. Context for when these terms are used
        4. Related terms that might be helpful
        
        User's question: {query}
        """
        
        ai_response = await self.ai_service.generate_medical_response(
            term_prompt,
            context=context,
            include_disclaimer=False  # Terms don't need medical disclaimer
        )
        
        # Store conversation
        conversation_id = await self._store_conversation(
            session_id, query, ai_response["response"], ai_response.get("confidence", 0.0)
        )
        
        await self._update_session_activity(session_id)
        
        return {
            "response": ai_response["response"],
            "confidence": ai_response.get("confidence", 0.0),
            "term_definitions": term_definitions,
            "query_type": "medical_term",
            "session_id": session_id,
            "conversation_id": conversation_id,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _process_general_medical_query(
        self,
        session_id: str,
        query: str,
        context: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Process general medical queries"""
        
        ai_response = await self.ai_service.generate_medical_response(
            query,
            context=context,
            include_disclaimer=True
        )
        
        # Store conversation
        conversation_id = await self._store_conversation(
            session_id, query, ai_response["response"], ai_response.get("confidence", 0.0)
        )
        
        await self._update_session_activity(session_id)
        
        return {
            "response": ai_response["response"],
            "confidence": ai_response.get("confidence", 0.0),
            "query_type": "general",
            "session_id": session_id,
            "conversation_id": conversation_id,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _handle_emergency_query(self, session_id: str, query: str) -> Dict[str, Any]:
        """Handle queries that may indicate emergency situations"""
        
        emergency_response = """
        **EMERGENCY ALERT**
        
        Based on your description, this may be a medical emergency that requires immediate attention.
        
        **IMMEDIATE ACTION REQUIRED:**
        - Call emergency services (911 in US, your local emergency number elsewhere) NOW
        - Do not delay seeking immediate medical care
        - If possible, have someone drive you to the nearest emergency room
        - Do not rely on this app for emergency medical situations
        
        **This is not a substitute for emergency medical care.**
        
        Emergency symptoms require immediate professional medical evaluation and treatment.
        """
        
        # Store the emergency conversation
        conversation_id = await self._store_conversation(
            session_id, query, emergency_response, 1.0
        )
        
        await self._update_session_activity(session_id)
        
        return {
            "response": emergency_response,
            "confidence": 1.0,
            "emergency_detected": True,
            "query_type": "emergency",
            "session_id": session_id,
            "conversation_id": conversation_id,
            "immediate_action": "CALL_EMERGENCY_SERVICES",
            "timestamp": datetime.now().isoformat()
        }
    
    def _detect_emergency(self, query: str) -> bool:
        """Detect if query contains emergency keywords"""
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in self.emergency_keywords)
    
    async def _get_conversation_context(self, session_id: str) -> List[Dict[str, str]]:
        """Get recent conversation context for session"""
        try:
            rows = await self.db_manager.execute_query(
                "SELECT user_message, ai_response FROM conversations WHERE session_id = ? ORDER BY created_at DESC LIMIT 5",
                (session_id,)
            )
            
            context = []
            for row in reversed(rows):  # Reverse to get chronological order
                context.append({
                    "user": row[0],
                    "assistant": row[1]
                })
            
            return context
            
        except Exception as e:
            logger.error(f"Failed to get conversation context: {e}")
            return []
    
    async def _store_conversation(
        self,
        session_id: str,
        user_message: str,
        ai_response: str,
        confidence: float
    ) -> int:
        """Store conversation in database"""
        try:
            rows = await self.db_manager.execute_query(
                "INSERT INTO conversations (session_id, user_message, ai_response, confidence_score) VALUES (?, ?, ?, ?) RETURNING id",
                (session_id, user_message, ai_response, confidence)
            )
            
            if rows:
                return rows[0][0]
            return 0
            
        except Exception as e:
            logger.error(f"Failed to store conversation: {e}")
            return 0
    
    async def _update_session_activity(self, session_id: str) -> None:
        """Update session activity timestamp and message count"""
        try:
            await self.db_manager.execute_update(
                "UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP, total_messages = total_messages + 1 WHERE id = ?",
                (session_id,)
            )
        except Exception as e:
            logger.error(f"Failed to update session activity: {e}")
    
    async def _find_related_conditions(self, symptoms: str) -> List[Dict[str, Any]]:
        """Find medical conditions related to symptoms"""
        try:
            # Simple keyword matching in symptoms and descriptions
            keywords = symptoms.lower().split()
            conditions = []
            
            for keyword in keywords[:3]:  # Limit to first 3 keywords
                rows = await self.db_manager.execute_query(
                    "SELECT id, name, description, severity FROM medical_conditions WHERE LOWER(symptoms) LIKE ? OR LOWER(description) LIKE ? LIMIT 3",
                    (f"%{keyword}%", f"%{keyword}%")
                )
                
                for row in rows:
                    conditions.append({
                        "id": row[0],
                        "name": row[1],
                        "description": row[2],
                        "severity": row[3]
                    })
            
            # Remove duplicates
            seen = set()
            unique_conditions = []
            for condition in conditions:
                if condition["id"] not in seen:
                    seen.add(condition["id"])
                    unique_conditions.append(condition)
            
            return unique_conditions[:5]  # Return top 5
            
        except Exception as e:
            logger.error(f"Failed to find related conditions: {e}")
            return []
    
    def _extract_drug_names(self, query: str) -> List[str]:
        """Extract potential drug names from query"""
        # This is a simplified implementation
        # In a real application, you'd use a medical NLP library or drug database
        
        common_drugs = [
            "aspirin", "ibuprofen", "acetaminophen", "tylenol", "advil",
            "metformin", "lisinopril", "amlodipine", "simvastatin", "omeprazole",
            "levothyroxine", "albuterol", "metoprolol", "hydrochlorothiazide"
        ]
        
        query_lower = query.lower()
        found_drugs = []
        
        for drug in common_drugs:
            if drug in query_lower:
                found_drugs.append(drug)
        
        return found_drugs
    
    async def _check_drug_interactions(self, drugs: List[str]) -> List[Dict[str, Any]]:
        """Check for known drug interactions"""
        try:
            interactions = []
            for i, drug_a in enumerate(drugs):
                for drug_b in drugs[i+1:]:
                    rows = await self.db_manager.execute_query(
                        "SELECT drug_a, drug_b, interaction_type, description, severity_score FROM drug_interactions WHERE (drug_a = ? AND drug_b = ?) OR (drug_a = ? AND drug_b = ?)",
                        (drug_a, drug_b, drug_b, drug_a)
                    )
                    
                    for row in rows:
                        interactions.append({
                            "drug_a": row[0],
                            "drug_b": row[1],
                            "interaction_type": row[2],
                            "description": row[3],
                            "severity_score": row[4]
                        })
            
            return interactions
            
        except Exception as e:
            logger.error(f"Failed to check drug interactions: {e}")
            return []
    
    async def _search_medical_terms(self, query: str) -> List[Dict[str, Any]]:
        """Search for medical terms and definitions"""
        try:
            keywords = query.lower().split()
            terms = []
            
            for keyword in keywords:
                rows = await self.db_manager.execute_query(
                    "SELECT term, definition, category, pronunciation FROM medical_terms WHERE LOWER(term) LIKE ? LIMIT 5",
                    (f"%{keyword}%",)
                )
                
                for row in rows:
                    terms.append({
                        "term": row[0],
                        "definition": row[1],
                        "category": row[2],
                        "pronunciation": row[3]
                    })
            
            return terms
            
        except Exception as e:
            logger.error(f"Failed to search medical terms: {e}")
            return []
    
    def _get_symptom_guidance(self) -> Dict[str, Any]:
        """Get general symptom assessment guidance"""
        return {
            "when_to_seek_immediate_care": [
                "Severe chest pain or pressure",
                "Difficulty breathing or shortness of breath",
                "Signs of stroke (sudden weakness, speech problems)",
                "Severe allergic reactions",
                "High fever with severe symptoms",
                "Severe bleeding or injuries"
            ],
            "when_to_contact_provider": [
                "Symptoms that worsen or don't improve",
                "New symptoms that concern you",
                "Fever that persists or is very high",
                "Pain that interferes with daily activities"
            ],
            "general_care_tips": [
                "Rest and stay hydrated",
                "Monitor symptoms and track changes",
                "Follow any medication instructions carefully",
                "Seek medical advice if uncertain"
            ]
        }
    
    def _get_drug_safety_guidance(self) -> Dict[str, Any]:
        """Get drug safety guidance"""
        return {
            "important_reminders": [
                "Always consult your healthcare provider before starting, stopping, or changing medications",
                "Inform all healthcare providers about all medications you take",
                "Read medication labels and follow instructions carefully",
                "Be aware of potential side effects and interactions",
                "Store medications safely and securely"
            ],
            "when_to_contact_provider": [
                "Before combining medications",
                "If you experience side effects",
                "Before taking over-the-counter medications with prescriptions",
                "If you have questions about your medications"
            ]
        }
    
    def _get_error_response(self, error_msg: str) -> Dict[str, Any]:
        """Generate error response"""
        return {
            "response": (
                "I'm sorry, I encountered an issue processing your request. "
                "For medical concerns, please consult with a healthcare professional. "
                "You can also try rephrasing your question and asking again."
            ),
            "confidence": 0.0,
            "error": error_msg,
            "query_type": "error",
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_session_history(self, session_id: str) -> Dict[str, Any]:
        """Get conversation history for a session"""
        try:
            conversations = await self.db_manager.execute_query(
                "SELECT user_message, ai_response, confidence_score, created_at FROM conversations WHERE session_id = ? ORDER BY created_at",
                (session_id,)
            )
            
            session_info = await self.db_manager.execute_query(
                "SELECT started_at, total_messages, session_type FROM user_sessions WHERE id = ?",
                (session_id,)
            )
            
            history = []
            for conv in conversations:
                history.append({
                    "user_message": conv[0],
                    "ai_response": conv[1],
                    "confidence": conv[2],
                    "timestamp": conv[3]
                })
            
            return {
                "session_id": session_id,
                "session_info": session_info[0] if session_info else None,
                "conversations": history,
                "total_conversations": len(history)
            }
            
        except Exception as e:
            logger.error(f"Failed to get session history: {e}")
            return {"error": str(e)}
