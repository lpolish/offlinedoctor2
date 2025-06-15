import { useApp } from '../../context/AppContext';

export default function Header() {
  const { state } = useApp();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            🏥 Offline Medical Assistant
          </h1>
          {state.currentSession && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Session: {state.currentSession.session_id.slice(0, 8)}...
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {state.isLoading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
              Processing...
            </div>
          )}
          
          {state.error && (
            <div className="text-red-600 text-sm max-w-md truncate">
              ⚠️ {state.error}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
