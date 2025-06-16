/**
 * Transformers.js Service for Offline Medical Assistant
 * Provides truly offline AI capabilities using browser-based models
 */

import { pipeline, env, Pipeline } from '@xenova/transformers';

// Configure Transformers.js for better performance
env.allowRemoteModels = true; // Allow downloading models
env.allowLocalModels = true;
env.useBrowserCache = true; // Cache models in browser storage
env.cacheDir = '/models'; // Set cache directory

interface MedicalResponse {
  response: string;
  confidence: number;
  metadata: {
    model: string;
    duration: number;
    tokenCount: number;
  };
  timestamp: string;
  emergency_detected?: boolean;
  medical_guidance?: {
    severity?: string;
    recommendations?: string[];
    emergency_action?: string;
  };
}

interface ModelConfig {
  name: string;
  task: string;
  maxLength: number;
  temperature: number;
  topP: number;
  doSample: boolean;
}

export class TransformersService {
  private generator: Pipeline | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private connectionListeners: Array<(connected: boolean) => void> = [];

  private readonly modelConfigs: Record<string, ModelConfig> = {
    'microsoft/DialoGPT-medium': {
      name: 'microsoft/DialoGPT-medium',
      task: 'text-generation',
      maxLength: 512,
      temperature: 0.7,
      topP: 0.9,
      doSample: true
    },
    'distilgpt2': {
      name: 'distilgpt2',
      task: 'text-generation',
      maxLength: 256,
      temperature: 0.8,
      topP: 0.9,
      doSample: true
    },
    'Xenova/LaMini-Flan-T5-248M': {
      name: 'Xenova/LaMini-Flan-T5-248M',
      task: 'text2text-generation',
      maxLength: 512,
      temperature: 0.7,
      topP: 0.9,
      doSample: true
    }
  };

  private currentModel: string = 'distilgpt2'; // Start with smaller, faster model

  constructor() {
    console.log('🤖 Initializing Transformers.js service...');
    this.initialize();
  }

  /**
   * Initialize the AI models
   */
  private async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('📥 Loading AI models... This may take a few minutes on first run.');
      
      // Initialize the main text generation model
      const modelConfig = this.modelConfigs[this.currentModel];
      console.log(`🔄 Loading model: ${this.currentModel}`);
      
      this.generator = await pipeline(modelConfig.task as any, this.currentModel, {
        revision: 'main',
        quantized: true, // Use quantized models for better performance
      });

      this.isInitialized = true;
      console.log('✅ AI models loaded successfully!');
      this.notifyConnectionChange(true);
      
    } catch (error) {
      console.error('❌ Failed to initialize AI models:', error);
      this.isInitialized = false;
      this.notifyConnectionChange(false);
      
      // Try fallback model
      if (this.currentModel !== 'distilgpt2') {
        console.log('🔄 Trying fallback model...');
        this.currentModel = 'distilgpt2';
        this.initializationPromise = null;
        return this.initialize();
      }
      
      throw error;
    }
  }

  /**
   * Add connection status listener
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    
    // Immediately call with current status
    callback(this.isInitialized);
    
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
    this.connectionListeners.forEach(callback => callback(connected));
  }

  /**
   * Check if the service is ready
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.isInitialized;
  }

  /**
   * Generate medical response using the AI model
   */
  async generateMedicalResponse(userMessage: string): Promise<MedicalResponse> {
    const startTime = Date.now();
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.generator) {
      throw new Error('AI model not initialized');
    }

    try {
      // Prepare the medical context prompt
      const medicalPrompt = this.createMedicalPrompt(userMessage);
      
      // Generate response
      const modelConfig = this.modelConfigs[this.currentModel];
      let result: any;

      if (modelConfig.task === 'text2text-generation') {
        // For T5-based models
        result = await this.generator(medicalPrompt, {
          max_new_tokens: modelConfig.maxLength,
          temperature: modelConfig.temperature,
          top_p: modelConfig.topP,
          do_sample: modelConfig.doSample,
        });
      } else {
        // For GPT-based models
        result = await this.generator(medicalPrompt, {
          max_length: modelConfig.maxLength,
          temperature: modelConfig.temperature,
          top_p: modelConfig.topP,
          do_sample: modelConfig.doSample,
          pad_token_id: 50256, // GPT-2 pad token
        });
      }

      let responseText = '';
      if (Array.isArray(result)) {
        responseText = result[0]?.generated_text || result[0]?.text || '';
      } else {
        responseText = result.generated_text || result.text || '';
      }

      // Clean up the response
      responseText = this.cleanMedicalResponse(responseText, medicalPrompt);
      
      // Detect emergency situations
      const emergencyDetected = await this.detectEmergency(userMessage);
      
      const duration = Date.now() - startTime;
      const tokenCount = responseText.split(' ').length;

      return {
        response: responseText,
        confidence: 0.85, // Static confidence for now
        metadata: {
          model: this.currentModel,
          duration,
          tokenCount,
        },
        timestamp: new Date().toISOString(),
        emergency_detected: emergencyDetected,
        medical_guidance: emergencyDetected ? {
          severity: 'high',
          recommendations: ['Seek immediate medical attention', 'Call emergency services if symptoms are severe'],
          emergency_action: 'Contact emergency services immediately'
        } : undefined,
      };

    } catch (error) {
      console.error('❌ Error generating medical response:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a medical-focused prompt
   */
  private createMedicalPrompt(userMessage: string): string {
    const systemPrompt = `You are a helpful medical information assistant. Provide informative and accurate medical information while emphasizing that this is for educational purposes only and not a substitute for professional medical advice.

Important guidelines:
- Always recommend consulting healthcare professionals for serious concerns
- Be empathetic and supportive
- Provide clear, understandable explanations
- Include relevant medical context when appropriate
- Mention when to seek immediate medical attention

User question: ${userMessage}

Medical assistant response:`;

    return systemPrompt;
  }

  /**
   * Clean and format the AI response
   */
  private cleanMedicalResponse(response: string, prompt: string): string {
    // Remove the prompt from the response if it's included
    let cleanResponse = response.replace(prompt, '').trim();
    
    // Remove common artifacts
    cleanResponse = cleanResponse.replace(/^(Medical assistant response:|Response:|Assistant:)/i, '').trim();
    
    // Ensure the response is helpful and complete
    if (cleanResponse.length < 20) {
      cleanResponse = "I'd be happy to help with your medical question. However, I recommend consulting with a healthcare professional for personalized medical advice. Could you provide more specific details about your concern?";
    }

    // Add medical disclaimer if not present
    if (!cleanResponse.toLowerCase().includes('medical professional') && 
        !cleanResponse.toLowerCase().includes('healthcare provider') &&
        !cleanResponse.toLowerCase().includes('doctor')) {
      cleanResponse += "\n\nPlease note: This information is for educational purposes only and should not replace professional medical advice. Always consult with a healthcare provider for medical concerns.";
    }

    return cleanResponse;
  }

  /**
   * Detect emergency situations in user messages
   */
  private async detectEmergency(message: string): Promise<boolean> {
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'stroke', 'bleeding', 'unconscious',
      'difficulty breathing', 'severe pain', 'overdose', 'poisoning',
      'allergic reaction', 'anaphylaxis', 'suicide', 'emergency'
    ];

    const lowercaseMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowercaseMessage.includes(keyword));
  }

  /**
   * Get current model information
   */
  getModelInfo(): { name: string; status: string; initialized: boolean } {
    return {
      name: this.currentModel,
      status: this.isInitialized ? 'Ready' : 'Initializing',
      initialized: this.isInitialized,
    };
  }

  /**
   * Switch to a different model
   */
  async switchModel(modelName: string): Promise<void> {
    if (!this.modelConfigs[modelName]) {
      throw new Error(`Model ${modelName} not supported`);
    }

    console.log(`🔄 Switching to model: ${modelName}`);
    this.currentModel = modelName;
    this.isInitialized = false;
    this.generator = null;
    this.initializationPromise = null;
    
    await this.initialize();
  }
}

// Create and export singleton instance
const transformersService = new TransformersService();
export default transformersService;
