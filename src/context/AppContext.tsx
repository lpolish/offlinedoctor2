/**
 * Simple context for direct Ollama integration
 */

import { createContext, useContext, ReactNode } from 'react';

// Since we're bypassing the complex Tauri backend and going directly to Ollama,
// this context is now minimal and the ChatPage handles everything directly
interface AppContextType {
  // No complex state needed for direct Ollama integration
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
  const contextValue: AppContextType = {
    // Empty for now since ChatPage handles everything directly
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;
