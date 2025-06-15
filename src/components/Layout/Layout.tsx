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
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
        
        {/* Status Bar */}
        <div className="h-6 bg-gray-800 text-white text-xs flex items-center justify-between px-4">
          <span>Offline Medical Assistant</span>
          <div className="flex items-center space-x-4">
            <span className={`flex items-center ${state.isBackendConnected ? 'text-green-400' : 'text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full mr-1 ${state.isBackendConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              {state.isBackendConnected ? 'Connected' : 'Disconnected'}
            </span>
            {state.systemHealth && (
              <span>AI: {state.systemHealth.ai_service}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
