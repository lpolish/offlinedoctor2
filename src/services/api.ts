/**
 * API Service for Offline Medical Assistant
 * 
 * Handles all communication between the frontend and backend API
 * Provides type-safe methods for medical queries, sessions, and system health
 */

// API Base URL - will be configurable
const API_BASE_URL = 'http://127.0.0.1:8000/api';

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
  detail: string;
  status_code?: number;
}

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  status_code: number;

  constructor(message: string, status_code: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status_code = status_code;
  }
}

/**
 * HTTP client with error handling and timeout
 */
class HttpClient {
  private timeout = 30000; // 30 seconds

  async request<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new ApiError(errorData.detail || `HTTP ${response.status}`, response.status);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        throw new ApiError('Request timeout - please check your connection', 408);
      }
      
      throw new ApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(url: string, data: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

/**
 * Main API service class
 */
class ApiService {
  private http = new HttpClient();

  // Medical endpoints
  async createSession(sessionType: string = 'general'): Promise<SessionInfo> {
    return this.http.post<SessionInfo>(`${API_BASE_URL}/medical/session`, {
      session_type: sessionType
    });
  }

  async submitMedicalQuery(query: MedicalQuery): Promise<MedicalResponse> {
    return this.http.post<MedicalResponse>(`${API_BASE_URL}/medical/query`, query);
  }

  async getSessionHistory(sessionId: string): Promise<any> {
    return this.http.get(`${API_BASE_URL}/medical/session/${sessionId}/history`);
  }

  async searchMedicalConditions(
    query: string, 
    severity?: string, 
    limit: number = 10
  ): Promise<any> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    if (severity) params.append('severity', severity);
    
    return this.http.get(`${API_BASE_URL}/medical/conditions/search?${params}`);
  }

  // AI endpoints
  async getAIModels(): Promise<AIModelInfo> {
    return this.http.get<AIModelInfo>(`${API_BASE_URL}/ai/models`);
  }

  async submitGeneralQuery(query: string, sessionId?: string): Promise<any> {
    return this.http.post(`${API_BASE_URL}/ai/general`, {
      query,
      session_id: sessionId
    });
  }

  // System endpoints
  async getSystemHealth(): Promise<SystemHealth> {
    return this.http.get<SystemHealth>(`${API_BASE_URL}/system/health`);
  }

  async getSystemStats(): Promise<any> {
    return this.http.get(`${API_BASE_URL}/system/stats`);
  }

  async createBackup(backupName?: string): Promise<any> {
    return this.http.post(`${API_BASE_URL}/system/backup`, {
      backup_name: backupName
    });
  }

  // Health check with retry logic
  async checkConnection(retries: number = 3): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.getSystemHealth();
        return true;
      } catch (error) {
        if (i === retries - 1) return false;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return false;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
