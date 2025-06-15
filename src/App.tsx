import { AppProvider } from './context/AppContext';
import ChatPage from './components/Pages/ChatPage';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="h-screen bg-gray-50">
        <ChatPage />
      </div>
    </AppProvider>
  );
}

export default App;
