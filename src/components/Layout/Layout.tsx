import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Header from './Header';
import Sidebar from './Sidebar';
import HomePage from '../Pages/HomePage';
import ChatPage from '../Pages/ChatPage';
import HistoryPage from '../Pages/HistoryPage';
import SettingsPage from '../Pages/SettingsPage';

type Page = 'home' | 'chat' | 'history' | 'settings';

export default function Layout() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { state } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'chat':
        return <ChatPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <main className="flex-1 overflow-hidden bg-gray-50">
          <div className="h-full animate-fade-in">
            {renderPage()}
          </div>
        </main>
        
        {/* Enhanced Status Bar */}
        <div className="h-8 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs flex items-center justify-between px-6 border-t border-gray-700">
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-2">
              <span className="text-medical-400">🏥</span>
              <span className="font-medium">Offline Medical Assistant</span>
            </span>
            
            <div className="flex items-center space-x-1">
              <span className={`status-dot ${state.isBackendConnected ? 'bg-success-400' : 'bg-danger-400'}`}></span>
              <span className={state.isBackendConnected ? 'text-success-400' : 'text-danger-400'}>
                {state.isBackendConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-gray-300">
            {state.systemHealth && (
              <span className="flex items-center space-x-1">
                <span>AI:</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  state.systemHealth.ai_service === 'healthy' 
                    ? 'bg-success-500/20 text-success-400' 
                    : 'bg-warning-500/20 text-warning-400'
                }`}>
                  {state.systemHealth.ai_service}
                </span>
              </span>
            )}
            
            {state.currentSession && (
              <span className="flex items-center space-x-1">
                <span>Session:</span>
                <span className="font-mono text-xs bg-gray-700 px-2 py-0.5 rounded">
                  {state.currentSession.session_id.slice(0, 8)}...
                </span>
              </span>
            )}
            
            <span className="text-2xs text-gray-400">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
