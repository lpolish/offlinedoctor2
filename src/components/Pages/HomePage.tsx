import { useApp } from '../../context/AppContext';

interface HomePageProps {
  onNavigate: (page: 'home' | 'chat' | 'history' | 'settings') => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { state, createSession, checkSystemHealth } = useApp();

  const handleStartChat = async () => {
    await createSession();
    onNavigate('chat');
  };

  const quickActions = [
    {
      title: 'General Medical Query',
      description: 'Ask about symptoms, conditions, or general health questions',
      icon: '🩺',
      action: () => handleStartChat(),
    },
    {
      title: 'View Chat History',
      description: 'Review past medical consultations and conversations',
      icon: '📋',
      action: () => onNavigate('history'),
    },
    {
      title: 'System Settings',
      description: 'Configure AI models and application preferences',
      icon: '⚙️',
      action: () => onNavigate('settings'),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Offline Medical Assistant
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get medical guidance and information in complete privacy. All processing happens locally on your device.
          </p>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <span className={`w-3 h-3 rounded-full ${state.isBackendConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <div>
                <div className="font-medium">Backend Service</div>
                <div className="text-sm text-gray-500">
                  {state.isBackendConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
            
            {state.systemHealth && (
              <>
                <div className="flex items-center space-x-3">
                  <span className={`w-3 h-3 rounded-full ${state.systemHealth.database === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <div>
                    <div className="font-medium">Database</div>
                    <div className="text-sm text-gray-500">{state.systemHealth.database}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`w-3 h-3 rounded-full ${state.systemHealth.ai_service === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <div>
                    <div className="font-medium">AI Service</div>
                    <div className="text-sm text-gray-500">{state.systemHealth.ai_service}</div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {!state.isBackendConnected && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600">⚠️</span>
                <div>
                  <h3 className="font-medium text-yellow-800">Backend Not Connected</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    The medical assistant service is not available. Please restart the application if the problem persists.
                  </p>
                  <button
                    onClick={checkSystemHealth}
                    className="mt-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={!state.isBackendConnected && action.title.includes('Medical')}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-3xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">⚠️ Important Medical Disclaimer</h3>
          <p className="text-sm text-blue-800">
            This application is for educational and informational purposes only. It is not intended to replace 
            professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health 
            providers with questions about medical conditions. In case of medical emergency, contact emergency services immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
