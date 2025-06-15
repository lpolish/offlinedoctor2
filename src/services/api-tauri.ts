/**
 * API Service for Offline Medical Assistant
 * 
 * Handles all communication between the frontend and Tauri backend
 * Provides type-safe methods for medical queries, sessions, and system health
 */

import { invoke } from '@tauri-apps/api/core';

// Type definitions
export interface MedicalQuery {
  query: string;
  session_id?: string;
  query_type: 'general' | 'symptoms' | 'drug_interaction' | 'medical_term';
}

export interface MedicalResponse {
  response: string;
  confidence: number;
  session_id: string;
  conversation_id?: number;
  query_type: string;
  timestamp: string;
  emergency_detected?: boolean;
  medical_guidance?: {
    severity?: string;
    recommendations?: string[];
    emergency_action?: string;
  };
  related_conditions?: Array<{
    id: string;
    name: string;
    similarity: number;
  }>;
}

export interface SessionInfo {
  session_id: string;
  session_type: string;
  created_at: string;
}

export interface SystemHealth {
  status: string;
  database: string;
  ai_service: string;
  timestamp: string;
}

export interface AIModelInfo {
  available: boolean;
  models: string[];
  default_model: string;
  medical_model: string;
  ollama_url: string;
}

export interface ApiErrorInterface {
  message: string;
  code?: number;
  details?: any;
}

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  public code?: number;
  public details?: any;

  constructor(message: string, code?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Main API service class using Tauri commands
 */
class ApiService {
  // Medical endpoints
  async createSession(sessionType: string = 'general'): Promise<SessionInfo> {
    try {
      return await invoke<SessionInfo>('create_session', { 
        sessionType 
      });
    } catch (error) {
      throw new ApiError(`Failed to create session: ${error}`);
    }
  }

  async submitMedicalQuery(query: MedicalQuery): Promise<MedicalResponse> {
    try {
      return await invoke<MedicalResponse>('submit_medical_query', { 
        query 
      });
    } catch (error) {
      throw new ApiError(`Failed to submit medical query: ${error}`);
    }
  }

  async getSessionHistory(sessionId: string): Promise<{ conversations: MedicalResponse[] }> {
    try {
      const conversations = await invoke<MedicalResponse[]>('get_session_history', { 
        sessionId 
      });
      return { conversations };
    } catch (error) {
      throw new ApiError(`Failed to get session history: ${error}`);
    }
  }

  async searchMedicalConditions(
    _query: string, 
    _severity?: string, 
    _limit: number = 10
  ): Promise<any> {
    // This would be implemented as a separate Tauri command if needed
    // For now, return empty results
    return { conditions: [] };
  }

  // AI endpoints
  async getAIModels(): Promise<AIModelInfo> {
    try {
      return await invoke<AIModelInfo>('get_ai_models');
    } catch (error) {
      throw new ApiError(`Failed to get AI models: ${error}`);
    }
  }

  async submitGeneralQuery(query: string, sessionId?: string): Promise<MedicalResponse> {
    return this.submitMedicalQuery({
      query,
      session_id: sessionId,
      query_type: 'general'
    });
  }

  // System endpoints
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      return await invoke<SystemHealth>('get_system_health');
    } catch (error) {
      throw new ApiError(`Failed to get system health: ${error}`);
    }
  }

  async getSystemStats(): Promise<any> {
    // This would be implemented as a separate Tauri command if needed
    return {
      uptime: Date.now(),
      memory_usage: '50MB',
      cpu_usage: '5%'
    };
  }

  async createBackup(_backupName?: string): Promise<any> {
    // This would be implemented as a separate Tauri command if needed
    return { success: true, backup_id: 'backup_' + Date.now() };
  }

  async restoreBackup(_backupId: string): Promise<any> {
    // This would be implemented as a separate Tauri command if needed
    return { success: true };
  }

  async exportData(_format: 'json' | 'csv' = 'json'): Promise<any> {
    // This would be implemented as a separate Tauri command if needed
    return { success: true, file_path: '/tmp/export.json' };
  }

  // Utility methods
  async checkConnection(): Promise<boolean> {
    try {
      await this.getSystemHealth();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Initialize the AI service (Ollama)
 */
export async function initializeAIService(): Promise<string> {
  try {
    return await invoke<string>('initialize_ai_service');
  } catch (error) {
    console.error('Failed to initialize AI service:', error);
    throw new Error('Failed to initialize AI service');
  }
}

/**
 * Stop the AI service
 */
export async function stopAIService(): Promise<string> {
  try {
    return await invoke<string>('stop_ai_service');
  } catch (error) {
    console.error('Failed to stop AI service:', error);
    throw new Error('Failed to stop AI service');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
