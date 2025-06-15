use crate::ollama_manager::{ChatMessage, OllamaManager};
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicalQuery {
    pub query: String,
    pub query_type: String,
    pub session_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicalResponse {
    pub response: String,
    pub confidence: f64,
    pub emergency_detected: bool,
    pub medical_guidance: Option<MedicalGuidance>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicalGuidance {
    pub severity: Option<String>,
    pub recommendations: Vec<String>,
    pub emergency_action: Option<String>,
    pub follow_up: Option<String>,
}

pub struct MedicalAI {
    ollama: OllamaManager,
}

impl MedicalAI {
    pub fn new(ollama: OllamaManager) -> Self {
        Self { ollama }
    }

    pub async fn process_medical_query(&self, query: &MedicalQuery) -> Result<MedicalResponse> {
        // Create a medical-focused system prompt
        let system_prompt = self.get_medical_system_prompt();

        // Prepare the conversation
        let messages = vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt,
            },
            ChatMessage {
                role: "user".to_string(),
                content: format!(
                    "Query Type: {}\nPatient Query: {}",
                    query.query_type, query.query
                ),
            },
        ];

        // Get response from Ollama
        let ai_response = self.ollama.chat(messages).await?;

        // Parse and analyze the response
        let medical_response = self
            .analyze_medical_response(&ai_response, &query.query)
            .await?;

        Ok(medical_response)
    }

    fn get_medical_system_prompt(&self) -> String {
        r#"You are a medical AI assistant designed to provide educational health information. Follow these guidelines:

IMPORTANT DISCLAIMERS:
- You provide educational information only, not professional medical advice
- Always recommend consulting healthcare professionals for serious concerns
- Never diagnose conditions or prescribe treatments
- Emphasize emergency services for urgent situations

RESPONSE FORMAT:
Provide clear, informative responses about health topics while maintaining appropriate medical disclaimers.

EMERGENCY DETECTION:
If the user describes symptoms that could indicate a medical emergency (severe chest pain, difficulty breathing, severe allergic reactions, etc.), clearly state that they should seek immediate medical attention.

MEDICAL GUIDANCE:
- Provide general health information
- Suggest when to see a healthcare provider
- Offer basic wellness recommendations
- Explain common medical terms

Remember: You are an educational tool, not a replacement for professional medical care."#.to_string()
    }

    async fn analyze_medical_response(
        &self,
        ai_response: &str,
        original_query: &str,
    ) -> Result<MedicalResponse> {
        // Simple keyword-based emergency detection
        let emergency_keywords = [
            "chest pain",
            "difficulty breathing",
            "severe pain",
            "unconscious",
            "bleeding heavily",
            "severe allergic reaction",
            "heart attack",
            "stroke",
            "severe burn",
            "choking",
            "overdose",
        ];

        let query_lower = original_query.to_lowercase();
        let emergency_detected = emergency_keywords
            .iter()
            .any(|keyword| query_lower.contains(keyword));

        // Extract recommendations (simple implementation)
        let recommendations = self.extract_recommendations(ai_response);

        // Determine confidence (placeholder logic)
        let confidence = if ai_response.len() > 100 { 0.8 } else { 0.6 };

        let medical_guidance = if !recommendations.is_empty() || emergency_detected {
            Some(MedicalGuidance {
                severity: if emergency_detected {
                    Some("high".to_string())
                } else {
                    Some("moderate".to_string())
                },
                recommendations,
                emergency_action: if emergency_detected {
                    Some("Seek immediate medical attention or call emergency services.".to_string())
                } else {
                    None
                },
                follow_up: Some(
                    "Consider consulting with a healthcare professional for personalized advice."
                        .to_string(),
                ),
            })
        } else {
            None
        };

        Ok(MedicalResponse {
            response: ai_response.to_string(),
            confidence,
            emergency_detected,
            medical_guidance,
        })
    }

    fn extract_recommendations(&self, response: &str) -> Vec<String> {
        // Simple extraction of recommendations (can be improved with better NLP)
        let mut recommendations = Vec::new();

        let lines: Vec<&str> = response.lines().collect();
        for line in lines {
            let line = line.trim();
            if line.starts_with("- ") || line.starts_with("• ") || line.contains("recommend") {
                recommendations.push(line.to_string());
            }
        }

        // Add some default recommendations based on content
        if response.to_lowercase().contains("symptoms") {
            recommendations.push("Monitor symptoms and their progression".to_string());
        }

        if response.to_lowercase().contains("pain") {
            recommendations
                .push("Keep a symptom diary including pain levels and triggers".to_string());
        }

        recommendations
    }

    pub async fn health_check(&self) -> Result<bool> {
        self.ollama.health_check().await
    }

    pub async fn ensure_model_ready(&self) -> Result<()> {
        self.ollama.ensure_model("tinyllama:latest").await
    }
}
