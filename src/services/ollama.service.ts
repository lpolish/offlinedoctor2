/**
 * Professional Ollama Integration Service
 * Handles connection, error recovery, model management, and best practices
 */

interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
  retries: number;
  healthCheckInterval: number;
}

interface OllamaError {
  error: string;
  code?: string;
}

export class OllamaService {
  private config: OllamaConfig;
  private isConnected: boolean = false;
  private healthCheckTimer?: NodeJS.Timeout;
  private connectionListeners: Array<(connected: boolean) => void> = [];

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:11434',
      model: 'tinyllama:latest',
      timeout: 30000, // 30 seconds
      retries: 3,
      healthCheckInterval: 30000, // 30 seconds
      ...config
    };

    // Initialize connection status
    this.startHealthCheck();
    
    // Handle tab visibility changes to pause/resume health checks
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseHealthCheck();
        } else {
          this.resumeHealthCheck();
        }
      });
    }
  }

  /**
   * Pause health checking (e.g., when tab is hidden)
   */
  private pauseHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Resume health checking
   */
  private resumeHealthCheck() {
    if (!this.healthCheckTimer) {
      this.startHealthCheck();
    }
  }

  /**
   * Add connection status listener
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of connection status change
   */
  private notifyConnectionChange(connected: boolean) {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      this.connectionListeners.forEach(callback => callback(connected));
    }
  }

  /**
   * Attempt to auto-recover Ollama service
   */
  async attemptAutoRecovery(): Promise<boolean> {
    try {
      // First, try to start Ollama service
      const response = await fetch(`${this.config.baseUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        this.notifyConnectionChange(true);
        return true;
      }

      // If service is not responding, attempt to start it
      // This would typically be done through a system call or API
      console.warn('Ollama service not responding. Manual restart may be required.');
      return false;
    } catch (error) {
      console.error('Auto-recovery failed:', error);
      return false;
    }
  }

  /**
   * Check if Ollama service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: controller.signal,
        method: 'GET'
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const isHealthy = Array.isArray(data.models);
        this.notifyConnectionChange(isHealthy);
        return isHealthy;
      }
      
      // Service responded but not healthy, attempt recovery
      const recovered = await this.attemptAutoRecovery();
      this.notifyConnectionChange(recovered);
      return recovered;
    } catch (error) {
      // If this is the first failed health check, try auto-recovery
      if (this.isConnected) {
        const recovered = await this.attemptAutoRecovery();
        this.notifyConnectionChange(recovered);
        return recovered;
      }
      
      this.notifyConnectionChange(false);
      return false;
    }
  }

  /**
   * Start periodic health checking
   */
  private startHealthCheck() {
    // Initial health check
    this.healthCheck();

    // Periodic health checks
    this.healthCheckTimer = setInterval(() => {
      this.healthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health checking
   */
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    const response = await this.makeRequest('/api/tags');
    return response.models?.map((model: any) => model.name) || [];
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.includes(modelName);
    } catch {
      return false;
    }
  }

  /**
   * Generate text using Ollama
   */
  async generate(prompt: string, options: {
    model?: string;
    system?: string;
    temperature?: number;
    context?: number[];
  } = {}): Promise<string> {
    const model = options.model || this.config.model;
    
    // Check if model is available
    if (!await this.isModelAvailable(model)) {
      throw new Error(`Model '${model}' is not available. Please install it first: ollama pull ${model}`);
    }

    const payload = {
      model,
      prompt: prompt,
      ...(options.system && { system: options.system }),
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        ...(options.context && { context: options.context })
      }
    };

    const response = await this.makeRequest('/api/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response.response || '';
  }

  /**
   * Generate medical response with proper context
   */
  async generateMedicalResponse(query: string, options: {
    temperature?: number;
    context?: number[];
  } = {}): Promise<{
    response: string;
    context?: number[];
    metadata: {
      model: string;
      totalDuration?: number;
      evalCount?: number;
    };
  }> {
    const systemPrompt = `You are a medical AI assistant providing educational health information. 

Guidelines:
- Provide educational information, not professional medical advice
- Recommend consulting healthcare professionals for serious concerns
- Never diagnose conditions or prescribe treatments
- For emergencies (chest pain, difficulty breathing, severe allergic reactions), clearly state to seek immediate medical attention
- Provide general health information and wellness recommendations
- Explain medical terms clearly
- You are an educational tool, not a replacement for professional medical care

Answer the user's question directly and helpfully.`;

    const response = await this.makeRequest('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: this.config.model,
        prompt: query,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          ...(options.context && { context: options.context })
        }
      })
    });

    return {
      response: response.response || '',
      context: response.context,
      metadata: {
        model: this.config.model,
        totalDuration: response.total_duration,
        evalCount: response.eval_count
      }
    };
  }

  /**
   * Make HTTP request with retries and error handling
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    let lastError: Error = new Error('No attempts made');

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: OllamaError = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Ollama API error (${response.status}): ${errorData.error}`);
        }

        const data = await response.json();
        this.notifyConnectionChange(true);
        return data;

      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.config.timeout}ms`);
        }

        // If this is the last attempt, or it's not a network error, throw immediately
        if (attempt === this.config.retries || !this.isRetryableError(error as Error)) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }

    this.notifyConnectionChange(false);
    throw new Error(`Failed after ${this.config.retries} attempts: ${lastError.message}`);
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'fetch',
      'network',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET'
    ];
    
    return retryableErrors.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get service configuration
   */
  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OllamaConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopHealthCheck();
    this.connectionListeners = [];
  }
}

// Create singleton instance
export const ollamaService = new OllamaService();

// Export for use in React components
export default ollamaService;
