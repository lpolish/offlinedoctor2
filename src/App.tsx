import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";

// Import components
import Layout from './components/Layout/Layout';
import HomePage from './components/Pages/HomePage';
import ChatPage from './components/Pages/ChatPage';
import HistoryPage from './components/Pages/HistoryPage';
import SettingsPage from './components/Pages/SettingsPage';

// Import context provider
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
