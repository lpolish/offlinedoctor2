import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { state } = useApp();

  return (
    <header className="bg-white shadow-soft border-b border-gray-200 relative z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-600 rounded-xl flex items-center justify-center shadow-soft">
              <span className="text-white text-xl">🏥</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Offline Medical Assistant
              </h1>
              {state.currentSession && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                  Session: {state.currentSession.session_id.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {state.isLoading && (
            <div className="flex items-center text-primary-600 bg-primary-50 px-3 py-2 rounded-lg border border-primary-200">
              <div className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full mr-2"></div>
              <span className="text-sm font-medium">Processing...</span>
            </div>
          )}
          
          {state.error && (
            <div className="flex items-center text-danger-600 bg-danger-50 px-3 py-2 rounded-lg border border-danger-200 max-w-sm">
              <span className="text-danger-500 mr-2">⚠️</span>
              <span className="text-sm font-medium truncate">{state.error}</span>
            </div>
          )}

          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              state.isBackendConnected 
                ? 'bg-success-500 shadow-lg shadow-success-500/30' 
                : 'bg-danger-500 shadow-lg shadow-danger-500/30'
            }`}></div>
            <span className={`text-sm font-medium ${
              state.isBackendConnected ? 'text-success-700' : 'text-danger-700'
            }`}>
              {state.isBackendConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
