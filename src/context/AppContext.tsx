/**
 * Medical Assistant Context
 * 
 * Provides global state management for the medical assistant application
 * Handles session management, system health monitoring, and error handling
 */

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiService, MedicalResponse, SystemHealth, SessionInfo, ApiError } from '../services/api';

// State interface
interface AppState {
  // Session management
  currentSession: SessionInfo | null;
  sessionHistory: MedicalResponse[];
  
  // System status
  systemHealth: SystemHealth | null;
  isBackendConnected: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Settings
  settings: {
    autoCreateSession: boolean;
    showMedicalDisclaimer: boolean;
    preferredQueryType: string;
  };
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION'; payload: SessionInfo | null }
  | { type: 'ADD_TO_HISTORY'; payload: MedicalResponse }
  | { type: 'SET_HISTORY'; payload: MedicalResponse[] }
  | { type: 'SET_SYSTEM_HEALTH'; payload: SystemHealth }
  | { type: 'SET_BACKEND_CONNECTION'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  currentSession: null,
  sessionHistory: [],
  systemHealth: null,
  isBackendConnected: false,
  isLoading: false,
  error: null,
  settings: {
    autoCreateSession: true,
    showMedicalDisclaimer: true,
    preferredQueryType: 'general'
  }
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_SESSION':
      return { 
        ...state, 
        currentSession: action.payload,
        sessionHistory: action.payload ? state.sessionHistory : []
      };
    
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        sessionHistory: [...state.sessionHistory, action.payload]
      };
    
    case 'SET_HISTORY':
      return { ...state, sessionHistory: action.payload };
    
    case 'SET_SYSTEM_HEALTH':
      return { 
        ...state, 
        systemHealth: action.payload,
        isBackendConnected: action.payload.status === 'healthy'
      };
    
    case 'SET_BACKEND_CONNECTION':
      return { ...state, isBackendConnected: action.payload };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    
    case 'RESET_STATE':
      return { ...initialState, settings: state.settings };
    
    default:
      return state;
  }
}

// Context interface
interface AppContextType {
  state: AppState;
  
  // Session actions
  createSession: (sessionType?: string) => Promise<void>;
  submitQuery: (query: string, queryType?: string) => Promise<MedicalResponse | null>;
  getSessionHistory: (sessionId: string) => Promise<void>;
  
  // System actions
  checkSystemHealth: () => Promise<void>;
  reconnectBackend: () => Promise<boolean>;
  
  // UI actions
  setError: (error: string | null) => void;
  clearError: () => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Custom hook to use the context
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Session management
  const createSession = async (sessionType: string = 'general') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const session = await apiService.createSession(sessionType);
      dispatch({ type: 'SET_SESSION', payload: session });
      
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to create session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const submitQuery = async (
    query: string, 
    queryType: string = 'general'
  ): Promise<MedicalResponse | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Create session if none exists and auto-create is enabled
      if (!state.currentSession && state.settings.autoCreateSession) {
        await createSession(queryType);
      }

      const response = await apiService.submitMedicalQuery({
        query,
        session_id: state.currentSession?.session_id,
        query_type: queryType as any
      });

      // Update session if response includes new session_id
      if (response.session_id && (!state.currentSession || state.currentSession.session_id !== response.session_id)) {
        dispatch({ type: 'SET_SESSION', payload: {
          session_id: response.session_id,
          session_type: queryType,
          created_at: response.timestamp
        }});
      }

      dispatch({ type: 'ADD_TO_HISTORY', payload: response });
      return response;

    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to submit query';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getSessionHistory = async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const history = await apiService.getSessionHistory(sessionId);
      dispatch({ type: 'SET_HISTORY', payload: history.conversations || [] });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load session history';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // System management
  const checkSystemHealth = async () => {
    try {
      const health = await apiService.getSystemHealth();
      dispatch({ type: 'SET_SYSTEM_HEALTH', payload: health });
    } catch (error) {
      dispatch({ type: 'SET_BACKEND_CONNECTION', payload: false });
    }
  };

  const reconnectBackend = async (): Promise<boolean> => {
    const connected = await apiService.checkConnection();
    dispatch({ type: 'SET_BACKEND_CONNECTION', payload: connected });
    
    if (connected) {
      await checkSystemHealth();
    }
    
    return connected;
  };

  // UI management
  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const updateSettings = (settings: Partial<AppState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  // Initialize system health check on mount
  useEffect(() => {
    checkSystemHealth();
    
    // Set up periodic health checks
    const healthCheckInterval = setInterval(checkSystemHealth, 30000); // Every 30 seconds
    
    return () => clearInterval(healthCheckInterval);
  }, []);

  const contextValue: AppContextType = {
    state,
    createSession,
    submitQuery,
    getSessionHistory,
    checkSystemHealth,
    reconnectBackend,
    setError,
    clearError,
    updateSettings
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;
