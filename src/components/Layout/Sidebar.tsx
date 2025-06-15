import { useApp } from '../../context/AppContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'chat' | 'history' | 'settings') => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ currentPage, onNavigate, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { state, createSession } = useApp();

  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠', description: 'Dashboard & Overview' },
    { id: 'chat', label: 'Chat', icon: '💬', description: 'Medical Consultation' },
    { id: 'history', label: 'History', icon: '📋', description: 'Past Consultations' },
    { id: 'settings', label: 'Settings', icon: '⚙️', description: 'App Configuration' },
  ];

  const handleNewSession = async () => {
    await createSession();
    onNavigate('chat');
  };

  return (
    <>
      {/* Mobile overlay */}
      {collapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onToggleCollapse}
        />
      )}
      
      <aside className={`
        ${collapsed ? 'w-64' : 'w-64'} 
        lg:w-64 
        bg-gradient-to-b from-gray-900 to-gray-800 
        text-white 
        flex flex-col 
        shadow-strong 
        border-r border-gray-700
        fixed lg:relative
        h-screen
        z-30
        transition-transform duration-300 ease-in-out
        ${collapsed ? 'transform translate-x-0' : 'transform -translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-medical-500 to-medical-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🏥</span>
              </div>
              <span className="font-semibold text-sm">Medical AI</span>
            </div>
            
            <button
              onClick={onToggleCollapse}
              className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={handleNewSession}
            disabled={state.isLoading || !state.isBackendConnected}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-soft disabled:shadow-none flex items-center justify-center space-x-2"
          >
            <span className="text-lg">💬</span>
            <span>New Medical Consultation</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id as any)}
                  className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs ${
                      currentPage === item.id ? 'text-primary-100' : 'text-gray-400 group-hover:text-gray-300'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                  {currentPage === item.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-4">
          {state.currentSession && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-success-400">Active Session</span>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-gray-300">{state.currentSession.session_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span className="text-gray-300">{state.sessionHistory.length}</span>
                </div>
                <div className="mt-2 font-mono text-2xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                  {state.currentSession.session_id.slice(0, 16)}...
                </div>
              </div>
            </div>
          )}
          
          <div className="text-2xs text-gray-400 space-y-2">
            <div className="flex items-center space-x-2 text-success-400">
              <span className="w-1.5 h-1.5 bg-success-400 rounded-full"></span>
              <span>Privacy Protected</span>
            </div>
            <div className="flex items-center space-x-2 text-medical-400">
              <span className="w-1.5 h-1.5 bg-medical-400 rounded-full"></span>
              <span>Offline Mode</span>
            </div>
            <div className="flex items-center space-x-2 text-primary-400">
              <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
              <span>Local Processing</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
