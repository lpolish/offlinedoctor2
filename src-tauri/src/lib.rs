mod medical_ai;
mod ollama_manager;

use medical_ai::MedicalAI;
use ollama_manager::{OllamaConfig, OllamaManager};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex;
use tauri::{Manager, State};
use tokio::sync::Mutex as AsyncMutex;
use uuid::Uuid;

// Data structures for medical assistance
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MedicalQuery {
    pub query: String,
    pub session_id: Option<String>,
    pub query_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MedicalResponse {
    pub response: String,
    pub confidence: f64,
    pub session_id: String,
    pub conversation_id: Option<u32>,
    pub query_type: String,
    pub timestamp: String,
    pub emergency_detected: Option<bool>,
    pub medical_guidance: Option<MedicalGuidance>,
    pub related_conditions: Option<Vec<RelatedCondition>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MedicalGuidance {
    pub severity: Option<String>,
    pub recommendations: Option<Vec<String>>,
    pub emergency_action: Option<String>,
    pub follow_up: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RelatedCondition {
    pub id: String,
    pub name: String,
    pub similarity: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionInfo {
    pub session_id: String,
    pub session_type: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemHealth {
    pub status: String,
    pub database: String,
    pub ai_service: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AIModelInfo {
    pub available: bool,
    pub models: Vec<String>,
    pub default_model: String,
    pub medical_model: String,
    pub ollama_url: String,
}

// Application State
#[derive(Default)]
pub struct AppState {
    pub sessions: Mutex<HashMap<String, SessionInfo>>,
    pub conversations: Mutex<Vec<MedicalResponse>>,
    pub medical_ai: Arc<AsyncMutex<Option<MedicalAI>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
            conversations: Mutex::new(Vec::new()),
            medical_ai: Arc::new(AsyncMutex::new(None)),
        }
    }
}

// Tauri Commands
#[tauri::command]
async fn create_session(
    session_type: Option<String>,
    state: State<'_, AppState>,
) -> Result<SessionInfo, String> {
    let session_id = Uuid::new_v4().to_string();
    let session_info = SessionInfo {
        session_id: session_id.clone(),
        session_type: session_type.unwrap_or_else(|| "general".to_string()),
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    let mut sessions = state.sessions.lock().unwrap();
    sessions.insert(session_id.clone(), session_info.clone());

    Ok(session_info)
}

#[tauri::command]
async fn submit_medical_query(
    query: MedicalQuery,
    state: State<'_, AppState>,
) -> Result<MedicalResponse, String> {
    let session_id = query
        .session_id
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    // Get the medical AI instance
    let medical_ai_guard = state.medical_ai.lock().await;

    if let Some(ref medical_ai) = *medical_ai_guard {
        // Create a medical query for our AI
        let ai_query = medical_ai::MedicalQuery {
            query: query.query.clone(),
            query_type: query.query_type.clone(),
            session_id: session_id.clone(),
        };

        // Process the query with our AI
        match medical_ai.process_medical_query(&ai_query).await {
            Ok(ai_response) => {
                let medical_response = MedicalResponse {
                    response: ai_response.response,
                    confidence: ai_response.confidence,
                    session_id: session_id.clone(),
                    conversation_id: Some(1),
                    query_type: query.query_type.clone(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    emergency_detected: Some(ai_response.emergency_detected),
                    medical_guidance: ai_response.medical_guidance.map(|g| MedicalGuidance {
                        severity: g.severity,
                        recommendations: Some(g.recommendations),
                        emergency_action: g.emergency_action,
                        follow_up: g.follow_up,
                    }),
                    related_conditions: None,
                };

                // Store the conversation
                drop(medical_ai_guard); // Release the lock before acquiring another
                let mut conversations = state.conversations.lock().unwrap();
                conversations.push(medical_response.clone());

                Ok(medical_response)
            }
            Err(e) => {
                eprintln!("AI processing error: {}", e);
                // Fallback to basic response
                let fallback_response = generate_fallback_response(&query.query, &query.query_type);

                let medical_response = MedicalResponse {
                    response: fallback_response,
                    confidence: 0.5,
                    session_id: session_id.clone(),
                    conversation_id: Some(1),
                    query_type: query.query_type.clone(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    emergency_detected: Some(false),
                    medical_guidance: Some(MedicalGuidance {
                        severity: Some("low".to_string()),
                        recommendations: Some(vec!["Please consult with a healthcare professional for proper medical advice.".to_string()]),
                        emergency_action: None,
                        follow_up: Some("Consider scheduling an appointment with your doctor.".to_string()),
                    }),
                    related_conditions: None,
                };

                drop(medical_ai_guard);
                let mut conversations = state.conversations.lock().unwrap();
                conversations.push(medical_response.clone());

                Ok(medical_response)
            }
        }
    } else {
        // AI not initialized, use fallback
        let fallback_response = generate_fallback_response(&query.query, &query.query_type);

        let medical_response = MedicalResponse {
            response: fallback_response,
            confidence: 0.3,
            session_id: session_id.clone(),
            conversation_id: Some(1),
            query_type: query.query_type.clone(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            emergency_detected: Some(false),
            medical_guidance: Some(MedicalGuidance {
                severity: Some("low".to_string()),
                recommendations: Some(vec![
                    "AI service is not available. Please consult with a healthcare professional."
                        .to_string(),
                ]),
                emergency_action: None,
                follow_up: None,
            }),
            related_conditions: None,
        };

        let mut conversations = state.conversations.lock().unwrap();
        conversations.push(medical_response.clone());

        Ok(medical_response)
    }
}

#[tauri::command]
async fn get_system_health(state: State<'_, AppState>) -> Result<SystemHealth, String> {
    // Check AI service status
    let medical_ai_guard = state.medical_ai.lock().await;
    let ai_status = if let Some(ref medical_ai) = *medical_ai_guard {
        match medical_ai.health_check().await {
            Ok(true) => "healthy",
            Ok(false) => "disconnected",
            Err(_) => "error",
        }
    } else {
        "not_initialized"
    };

    Ok(SystemHealth {
        status: "healthy".to_string(),
        database: "healthy".to_string(),
        ai_service: ai_status.to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_session_history(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<MedicalResponse>, String> {
    let conversations = state.conversations.lock().unwrap();
    let session_conversations: Vec<MedicalResponse> = conversations
        .iter()
        .filter(|conv| conv.session_id == session_id)
        .cloned()
        .collect();

    Ok(session_conversations)
}

#[tauri::command]
async fn initialize_ai_service(app_handle: tauri::AppHandle) -> Result<String, String> {
    start_ai_service_internal(app_handle).await
}

async fn start_ai_service_internal(app_handle: tauri::AppHandle) -> Result<String, String> {
    let state = app_handle.state::<AppState>();
    let mut medical_ai_guard = state.medical_ai.lock().await;

    if medical_ai_guard.is_some() {
        return Ok("AI service already initialized".to_string());
    }

    // Create Ollama manager with default config
    let config = OllamaConfig::default();
    let ollama_manager = OllamaManager::new(config);

    // Try to start embedded Ollama first
    match ollama_manager.start_embedded(&app_handle).await {
        Ok(_) => {
            println!("Embedded Ollama started successfully");
        }
        Err(e) => {
            println!("Failed to start embedded Ollama, trying external: {}", e);
            // Try to connect to external Ollama
            match ollama_manager.health_check().await {
                Ok(true) => {
                    println!("Connected to external Ollama");
                }
                Ok(false) | Err(_) => {
                    return Err("No Ollama instance available (embedded or external)".to_string());
                }
            }
        }
    }

    // Ensure the model is ready
    match ollama_manager.ensure_model("tinyllama:latest").await {
        Ok(_) => {
            println!("Model ready: tinyllama:latest");
        }
        Err(e) => {
            println!("Warning: Could not ensure model availability: {}", e);
            // Continue anyway, might work with existing models
        }
    }

    // Create medical AI instance
    let medical_ai = MedicalAI::new(ollama_manager);
    *medical_ai_guard = Some(medical_ai);

    Ok("AI service initialized successfully".to_string())
}

#[tauri::command]
async fn stop_ai_service(state: State<'_, AppState>) -> Result<String, String> {
    let mut medical_ai_guard = state.medical_ai.lock().await;
    *medical_ai_guard = None;
    Ok("AI service stopped".to_string())
}

#[tauri::command]
async fn get_ai_models(state: State<'_, AppState>) -> Result<AIModelInfo, String> {
    let medical_ai_guard = state.medical_ai.lock().await;

    if let Some(ref medical_ai) = *medical_ai_guard {
        let available = medical_ai.health_check().await.unwrap_or(false);
        Ok(AIModelInfo {
            available,
            models: vec!["tinyllama:latest".to_string(), "llama2:latest".to_string()],
            default_model: "tinyllama:latest".to_string(),
            medical_model: "tinyllama:latest".to_string(),
            ollama_url: "http://127.0.0.1:11434".to_string(),
        })
    } else {
        Ok(AIModelInfo {
            available: false,
            models: vec![],
            default_model: "".to_string(),
            medical_model: "".to_string(),
            ollama_url: "http://127.0.0.1:11434".to_string(),
        })
    }
}

// Helper functions
#[allow(dead_code)]
async fn generate_medical_response(query: &str, query_type: &str) -> Result<String, String> {
    // Try to connect to Ollama first
    if let Ok(response) = call_ollama_api(query).await {
        return Ok(response);
    }

    // Fallback to simulated responses if Ollama is not available
    match query_type {
        "symptoms" => Ok(generate_symptom_response(query)),
        "drug_interaction" => Ok(generate_drug_interaction_response(query)),
        "medical_term" => Ok(generate_medical_term_response(query)),
        _ => Ok(generate_general_response(query)),
    }
}

#[allow(dead_code)]
async fn call_ollama_api(query: &str) -> Result<String, String> {
    let client = reqwest::Client::new();
    let ollama_url = "http://localhost:11434/api/generate";

    let payload = serde_json::json!({
        "model": "llama2:7b",
        "prompt": format!("You are a medical AI assistant. Please provide helpful medical information for the following query. Always include appropriate disclaimers about seeking professional medical advice when necessary.\n\nQuery: {}", query),
        "stream": false
    });

    match client.post(ollama_url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(json) => {
                        if let Some(response_text) = json.get("response").and_then(|v| v.as_str()) {
                            Ok(response_text.to_string())
                        } else {
                            Err("Invalid response format from Ollama".to_string())
                        }
                    }
                    Err(_) => Err("Failed to parse Ollama response".to_string()),
                }
            } else {
                Err("Ollama API request failed".to_string())
            }
        }
        Err(_) => Err("Failed to connect to Ollama".to_string()),
    }
}

#[allow(dead_code)]
async fn check_ollama_connection() -> bool {
    let client = reqwest::Client::new();
    match client.get("http://localhost:11434/api/tags").send().await {
        Ok(response) => response.status().is_success(),
        Err(_) => false,
    }
}

fn generate_symptom_response(query: &str) -> String {
    format!(
        "Based on your symptoms: '{}', here are some general considerations:\n\n\
        1. Monitor your symptoms and note any changes\n\
        2. Stay hydrated and get adequate rest\n\
        3. Consider over-the-counter medications if appropriate\n\n\
        ⚠️ **Medical Disclaimer**: This is educational information only. \
        If symptoms persist, worsen, or you have concerns, please consult with a healthcare professional. \
        For emergencies, contact emergency services immediately.",
        query
    )
}

fn generate_drug_interaction_response(query: &str) -> String {
    format!(
        "Regarding drug interactions for: '{}'\n\n\
        General drug interaction considerations:\n\
        1. Always inform your healthcare providers about all medications you're taking\n\
        2. Check with your pharmacist about potential interactions\n\
        3. Read medication labels and patient information leaflets\n\
        4. Never stop or start medications without professional guidance\n\n\
        ⚠️ **Important**: This information is not a substitute for professional medical advice. \
        Always consult with your doctor or pharmacist about specific drug interactions.",
        query
    )
}

fn generate_medical_term_response(query: &str) -> String {
    format!(
        "Medical term explanation for: '{}'\n\n\
        This appears to be a request for medical terminology information. \
        For accurate and detailed medical definitions, I recommend:\n\n\
        1. Consulting reputable medical dictionaries\n\
        2. Speaking with your healthcare provider\n\
        3. Checking with medical professionals for context-specific meanings\n\n\
        ⚠️ **Note**: Medical terminology can be complex and context-dependent. \
        Always verify information with qualified medical professionals.",
        query
    )
}

fn generate_general_response(query: &str) -> String {
    format!(
        "Thank you for your medical query: '{}'\n\n\
        I'm here to provide general medical information and guidance. However, please remember:\n\n\
        1. This is educational information only\n\
        2. Every individual's medical situation is unique\n\
        3. Professional medical advice is always recommended\n\
        4. For urgent medical concerns, contact healthcare services immediately\n\n\
        ⚠️ **Medical Disclaimer**: This application provides educational information only and \
        is not intended to replace professional medical advice, diagnosis, or treatment. \
        Always seek advice from qualified healthcare providers.",
        query
    )
}

#[allow(dead_code)]
fn detect_emergency(query: &str) -> Option<bool> {
    let emergency_keywords = [
        "chest pain",
        "heart attack",
        "stroke",
        "seizure",
        "unconscious",
        "bleeding heavily",
        "can't breathe",
        "severe pain",
        "emergency",
    ];

    let query_lower = query.to_lowercase();
    for keyword in &emergency_keywords {
        if query_lower.contains(keyword) {
            return Some(true);
        }
    }
    None
}

#[allow(dead_code)]
fn generate_medical_guidance(query: &str, query_type: &str) -> Option<MedicalGuidance> {
    if detect_emergency(query).unwrap_or(false) {
        return Some(MedicalGuidance {
            severity: Some("high".to_string()),
            recommendations: Some(vec![
                "Seek immediate medical attention".to_string(),
                "Contact emergency services if severe".to_string(),
                "Do not delay professional medical care".to_string(),
            ]),
            emergency_action: Some("Contact emergency services immediately".to_string()),
            follow_up: Some("Follow emergency protocols".to_string()),
        });
    }

    match query_type {
        "symptoms" => Some(MedicalGuidance {
            severity: Some("moderate".to_string()),
            recommendations: Some(vec![
                "Monitor symptoms closely".to_string(),
                "Consult healthcare provider if symptoms persist".to_string(),
                "Keep a symptom diary".to_string(),
            ]),
            emergency_action: None,
            follow_up: Some("Schedule follow-up if symptoms worsen".to_string()),
        }),
        _ => Some(MedicalGuidance {
            severity: Some("low".to_string()),
            recommendations: Some(vec![
                "Consult with healthcare professionals for personalized advice".to_string(),
                "Verify information with reliable medical sources".to_string(),
            ]),
            emergency_action: None,
            follow_up: Some("Regular medical checkups recommended".to_string()),
        }),
    }
}

fn generate_fallback_response(query: &str, query_type: &str) -> String {
    match query_type {
        "symptoms" => generate_symptom_response(query),
        "drug_interaction" => generate_drug_interaction_response(query),
        "medical_term" => generate_medical_term_response(query),
        _ => generate_general_response(query),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            create_session,
            submit_medical_query,
            get_system_health,
            get_session_history,
            initialize_ai_service,
            stop_ai_service,
            get_ai_models
        ])
        .setup(|app| {
            // Initialize AI service on startup
            let app_handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                if let Err(e) = start_ai_service_internal(app_handle).await {
                    eprintln!("Failed to initialize AI service on startup: {}", e);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
