import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}

export default App;
