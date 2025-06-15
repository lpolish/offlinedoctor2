use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaConfig {
    pub host: String,
    pub port: u16,
    pub model: String,
}

impl Default for OllamaConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 11434,
            model: "tinyllama:latest".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub stream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub message: ChatMessage,
    pub done: bool,
}

pub struct OllamaManager {
    config: OllamaConfig,
    process: Arc<Mutex<Option<std::process::Child>>>,
    client: reqwest::Client,
}

impl OllamaManager {
    pub fn new(config: OllamaConfig) -> Self {
        Self {
            config,
            process: Arc::new(Mutex::new(None)),
            client: reqwest::Client::new(),
        }
    }

    /// Start embedded Ollama server
    pub async fn start_embedded(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        let mut process_guard = self.process.lock().await;

        if process_guard.is_some() {
            return Ok(()); // Already running
        }

        // Get the path to the bundled Ollama binary
        let ollama_path = self.get_bundled_ollama_path(app_handle)?;

        // Create a temporary directory for Ollama's data
        let data_dir = self.get_ollama_data_dir(app_handle)?;
        std::fs::create_dir_all(&data_dir)?;

        println!("Starting embedded Ollama from: {:?}", ollama_path);
        println!("Data directory: {:?}", data_dir);

        // Start Ollama serve command
        let child = Command::new(&ollama_path)
            .arg("serve")
            .env(
                "OLLAMA_HOST",
                format!("{}:{}", self.config.host, self.config.port),
            )
            .env(
                "OLLAMA_MODELS",
                data_dir.join("models").to_string_lossy().as_ref(),
            )
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;

        *process_guard = Some(child);

        // Wait a bit for the server to start
        sleep(Duration::from_secs(3)).await;

        // Verify the server is running
        self.health_check().await?;

        println!("Embedded Ollama server started successfully");
        Ok(())
    }

    /// Stop embedded Ollama server
    pub async fn stop_embedded(&self) -> Result<()> {
        let mut process_guard = self.process.lock().await;

        if let Some(mut child) = process_guard.take() {
            child.kill()?;
            child.wait()?;
            println!("Embedded Ollama server stopped");
        }

        Ok(())
    }

    /// Check if Ollama is running (embedded or external)
    pub async fn health_check(&self) -> Result<bool> {
        let url = format!("http://{}:{}/api/tags", self.config.host, self.config.port);

        match self.client.get(&url).send().await {
            Ok(response) => Ok(response.status().is_success()),
            Err(_) => Ok(false),
        }
    }

    /// Ensure a model is available
    pub async fn ensure_model(&self, model: &str) -> Result<()> {
        // Check if model exists
        let models = self.list_models().await?;

        if models.iter().any(|m| m.contains(model)) {
            return Ok(());
        }

        // Try to pull the model
        println!("Pulling model: {}", model);
        self.pull_model(model).await?;

        Ok(())
    }

    /// List available models
    pub async fn list_models(&self) -> Result<Vec<String>> {
        let url = format!("http://{}:{}/api/tags", self.config.host, self.config.port);

        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            return Err(anyhow!("Failed to list models: {}", response.status()));
        }

        let json: serde_json::Value = response.json().await?;
        let models = json["models"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|m| m["name"].as_str().map(|s| s.to_string()))
            .collect();

        Ok(models)
    }

    /// Pull a model
    pub async fn pull_model(&self, model: &str) -> Result<()> {
        let url = format!("http://{}:{}/api/pull", self.config.host, self.config.port);

        let request = serde_json::json!({
            "name": model
        });

        let response = self.client.post(&url).json(&request).send().await?;

        if !response.status().is_success() {
            return Err(anyhow!("Failed to pull model: {}", response.status()));
        }

        println!("Model {} pulled successfully", model);
        Ok(())
    }

    /// Send a chat message
    pub async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String> {
        let url = format!("http://{}:{}/api/chat", self.config.host, self.config.port);

        let request = ChatRequest {
            model: self.config.model.clone(),
            messages,
            stream: false,
        };

        let response = self.client.post(&url).json(&request).send().await?;

        if !response.status().is_success() {
            return Err(anyhow!("Chat request failed: {}", response.status()));
        }

        let chat_response: ChatResponse = response.json().await?;
        Ok(chat_response.message.content)
    }

    /// Get the path to the bundled Ollama binary
    fn get_bundled_ollama_path(&self, app_handle: &tauri::AppHandle) -> Result<PathBuf> {
        let resource_dir = app_handle.path().resource_dir()?;

        // Platform-specific binary name
        let binary_name = if cfg!(target_os = "windows") {
            "ollama.exe"
        } else {
            "ollama"
        };

        let ollama_path = resource_dir.join("binaries").join(binary_name);

        if !ollama_path.exists() {
            // Fallback to system Ollama
            return Ok(PathBuf::from("ollama"));
        }

        Ok(ollama_path)
    }

    /// Get Ollama data directory
    fn get_ollama_data_dir(&self, app_handle: &tauri::AppHandle) -> Result<PathBuf> {
        let app_data_dir = app_handle.path().app_data_dir()?;
        Ok(app_data_dir.join("ollama"))
    }
}

// Auto-cleanup on drop
impl Drop for OllamaManager {
    fn drop(&mut self) {
        if let Ok(mut process_guard) = self.process.try_lock() {
            if let Some(mut child) = process_guard.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}
