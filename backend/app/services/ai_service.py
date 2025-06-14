"""
AI Service for the Offline Medical AI Assistant

Handles integration with Ollama for local AI model inference.
Provides medical-focused AI capabilities with appropriate safeguards.
"""

import httpx
import asyncio
import logging
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import os

logger = logging.getLogger(__name__)


class AIService:
    """
    Service for managing AI interactions with Ollama.
    
    Provides medical-focused AI capabilities while ensuring privacy
    and implementing appropriate safeguards for medical content.
    """
    
    def __init__(self, ollama_url: str = "http://127.0.0.1:11434"):
        self.ollama_url = ollama_url
        self.default_model = "llama3.1:8b"  # Medical-focused model
        self.medical_model = "llama3.1:8b"  # Specialized medical model if available
        self.is_available = False
        self.supported_models = []
        
        # Medical AI settings
        self.medical_temperature = 0.2  # Lower temperature for medical advice
        self.general_temperature = 0.7  # Higher for general conversation
        self.max_tokens = 2048
        
        # Medical disclaimer template
        self.medical_disclaimer = (
            "**IMPORTANT MEDICAL DISCLAIMER:** This response is for informational purposes only "
            "and should not be considered as professional medical advice, diagnosis, or treatment. "
            "Always consult with a qualified healthcare provider for medical concerns.\n\n"
        )
    
    async def initialize(self) -> bool:
        """Initialize the AI service and check Ollama availability"""
        try:
            await self._check_ollama_status()
            await self._load_available_models()
            await self._ensure_medical_model()
            
            self.is_available = True
            logger.info("AI service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"AI service initialization failed: {e}")
            self.is_available = False
            return False
    
    async def _check_ollama_status(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.ollama_url}/api/tags")
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama not accessible: {e}")
            return False
    
    async def _load_available_models(self) -> List[str]:
        """Get list of available models from Ollama"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.ollama_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    self.supported_models = [model["name"] for model in data.get("models", [])]
                    logger.info(f"Available models: {self.supported_models}")
                    return self.supported_models
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            
        return []
    
    async def _ensure_medical_model(self) -> bool:
        """Ensure a suitable medical model is available"""
        preferred_models = [
            "llama3.1:8b",
            "llama3:8b", 
            "mistral:7b",
            "codellama:7b"
        ]
        
        for model in preferred_models:
            if model in self.supported_models:
                self.default_model = model
                self.medical_model = model
                logger.info(f"Using model: {model}")
                return True
        
        # If no preferred model found, try to pull one
        if self.supported_models:
            self.default_model = self.supported_models[0]
            self.medical_model = self.supported_models[0]
            logger.info(f"Using available model: {self.default_model}")
            return True
        
        # Try to pull a default model
        logger.warning("No suitable models found, attempting to pull llama3.1:8b")
        return await self._pull_model("llama3.1:8b")
    
    async def _pull_model(self, model_name: str) -> bool:
        """Pull a model from Ollama repository"""
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/pull",
                    json={"name": model_name}
                )
                if response.status_code == 200:
                    logger.info(f"Successfully pulled model: {model_name}")
                    self.supported_models.append(model_name)
                    return True
        except Exception as e:
            logger.error(f"Failed to pull model {model_name}: {e}")
        
        return False
    
    def is_ready(self) -> bool:
        """Check if AI service is ready for requests"""
        return self.is_available and len(self.supported_models) > 0
    
    async def generate_medical_response(
        self,
        prompt: str,
        context: List[Dict[str, str]] = None,
        include_disclaimer: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a medical-focused AI response with appropriate safeguards
        
        Args:
            prompt: User's medical question or concern
            context: Previous conversation context
            include_disclaimer: Whether to include medical disclaimer
            
        Returns:
            Dict containing response, confidence, and metadata
        """
        if not self.is_ready():
            return self._get_fallback_response("AI service is not available")
        
        try:
            # Prepare medical prompt with safety guidelines
            medical_prompt = self._prepare_medical_prompt(prompt, context)
            
            # Generate response with medical-appropriate settings
            start_time = datetime.now()
            response = await self._generate_response(
                medical_prompt,
                temperature=self.medical_temperature,
                model=self.medical_model
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Process and validate response
            processed_response = self._process_medical_response(response, include_disclaimer)
            
            return {
                "response": processed_response,
                "confidence": self._calculate_confidence(response),
                "model": self.medical_model,
                "temperature": self.medical_temperature,
                "response_time_ms": int(response_time),
                "disclaimer_included": include_disclaimer,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Medical response generation failed: {e}")
            return self._get_fallback_response(f"Error generating response: {str(e)}")
    
    async def generate_general_response(
        self,
        prompt: str,
        context: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Generate a general AI response for non-medical queries"""
        if not self.is_ready():
            return self._get_fallback_response("AI service is not available")
        
        try:
            # Prepare general prompt
            general_prompt = self._prepare_general_prompt(prompt, context)
            
            start_time = datetime.now()
            response = await self._generate_response(
                general_prompt,
                temperature=self.general_temperature,
                model=self.default_model
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                "response": response.get("response", ""),
                "confidence": self._calculate_confidence(response),
                "model": self.default_model,
                "temperature": self.general_temperature,
                "response_time_ms": int(response_time),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"General response generation failed: {e}")
            return self._get_fallback_response(f"Error generating response: {str(e)}")
    
    async def _generate_response(
        self,
        prompt: str,
        temperature: float = 0.7,
        model: str = None
    ) -> Dict[str, Any]:
        """Generate response using Ollama API"""
        model = model or self.default_model
        
        payload = {
            "model": model,
            "prompt": prompt,
            "options": {
                "temperature": temperature,
                "num_predict": self.max_tokens,
            },
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.ollama_url}/api/generate",
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Ollama API error: {response.status_code} - {response.text}")
    
    def _prepare_medical_prompt(self, prompt: str, context: List[Dict[str, str]] = None) -> str:
        """Prepare medical prompt with safety guidelines and context"""
        system_prompt = """You are a medical AI assistant designed to provide helpful, accurate, and safe medical information. Always follow these guidelines:

1. Provide informational content only, never diagnose or prescribe
2. Always encourage users to consult healthcare professionals for serious concerns
3. Be conservative and err on the side of caution
4. Acknowledge limitations and uncertainties
5. Focus on general health education and guidance
6. Flag emergency situations and direct to immediate medical care

Remember: You are providing educational information, not medical diagnosis or treatment."""
        
        # Add conversation context if provided
        context_str = ""
        if context:
            context_str = "\n\nPrevious conversation:\n"
            for msg in context[-3:]:  # Last 3 messages for context
                context_str += f"User: {msg.get('user', '')}\nAssistant: {msg.get('assistant', '')}\n"
        
        return f"{system_prompt}{context_str}\n\nUser question: {prompt}\n\nResponse:"
    
    def _prepare_general_prompt(self, prompt: str, context: List[Dict[str, str]] = None) -> str:
        """Prepare general prompt for non-medical queries"""
        system_prompt = """You are a helpful AI assistant. Provide accurate, helpful, and informative responses. If the question relates to medical topics, remind the user that you provide general information only and they should consult healthcare professionals for medical advice."""
        
        context_str = ""
        if context:
            context_str = "\n\nPrevious conversation:\n"
            for msg in context[-3:]:
                context_str += f"User: {msg.get('user', '')}\nAssistant: {msg.get('assistant', '')}\n"
        
        return f"{system_prompt}{context_str}\n\nUser: {prompt}\n\nAssistant:"
    
    def _process_medical_response(self, response: Dict[str, Any], include_disclaimer: bool) -> str:
        """Process and validate medical response"""
        content = response.get("response", "")
        
        # Add medical disclaimer if requested
        if include_disclaimer and content:
            content = self.medical_disclaimer + content
        
        # Validate response doesn't contain inappropriate medical advice
        if self._contains_inappropriate_medical_advice(content):
            logger.warning("Response contained inappropriate medical advice, using fallback")
            return (
                f"{self.medical_disclaimer}I understand you're seeking medical information. "
                "For your safety, I recommend discussing your specific concerns with a "
                "qualified healthcare provider who can provide personalized medical advice."
            )
        
        return content
    
    def _contains_inappropriate_medical_advice(self, content: str) -> bool:
        """Check if response contains inappropriate medical advice"""
        inappropriate_phrases = [
            "you definitely have",
            "you are diagnosed with",
            "take this medication",
            "stop taking your medication",
            "you don't need to see a doctor",
            "this is definitely",
        ]
        
        content_lower = content.lower()
        return any(phrase in content_lower for phrase in inappropriate_phrases)
    
    def _calculate_confidence(self, response: Dict[str, Any]) -> float:
        """Calculate confidence score for AI response"""
        # Simple confidence calculation based on response length and coherence
        content = response.get("response", "")
        
        if not content:
            return 0.0
        
        # Base confidence on response characteristics
        confidence = 0.5  # Base confidence
        
        # Longer responses tend to be more confident
        if len(content) > 100:
            confidence += 0.2
        
        # Responses with medical disclaimers are more reliable
        if "disclaimer" in content.lower() or "consult" in content.lower():
            confidence += 0.2
        
        # Cap at 0.9 for medical responses (never 100% certain)
        return min(confidence, 0.9)
    
    def _get_fallback_response(self, error_msg: str) -> Dict[str, Any]:
        """Generate fallback response when AI is unavailable"""
        return {
            "response": (
                f"{self.medical_disclaimer}"
                "I'm currently unable to process your request. "
                "For medical concerns, please consult with a healthcare professional. "
                "You can also try again later when the AI service is available."
            ),
            "confidence": 0.0,
            "model": "fallback",
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about available models"""
        return {
            "available": self.is_available,
            "models": self.supported_models,
            "default_model": self.default_model,
            "medical_model": self.medical_model,
            "ollama_url": self.ollama_url
        }
    
    async def cleanup(self) -> None:
        """Cleanup AI service resources"""
        logger.info("AI service cleanup completed")
