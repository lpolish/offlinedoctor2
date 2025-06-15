import { useApp } from '../../context/AppContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'chat' | 'history' | 'settings') => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { state, createSession } = useApp();

  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'history', label: 'History', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleNewSession = async () => {
    await createSession();
    onNavigate('chat');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleNewSession}
          disabled={state.isLoading || !state.isBackendConnected}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + New Medical Consultation
        </button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id as any)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <div className="space-y-1">
          <div>🔒 Privacy Protected</div>
          <div>📱 Offline Mode</div>
          {state.currentSession && (
            <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
              <div>Active Session</div>
              <div className="text-gray-500">
                {state.currentSession.session_type} • {state.sessionHistory.length} messages
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
