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
      color: 'from-medical-500 to-medical-600',
      action: () => handleStartChat(),
    },
    {
      title: 'View Chat History',
      description: 'Review past medical consultations and conversations',
      icon: '📋',
      color: 'from-primary-500 to-primary-600',
      action: () => onNavigate('history'),
    },
    {
      title: 'System Settings',
      description: 'Configure AI models and application preferences',
      icon: '⚙️',
      color: 'from-gray-500 to-gray-600',
      action: () => onNavigate('settings'),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-medical-500 to-medical-600 rounded-2xl shadow-strong mb-6">
            <span className="text-3xl text-white">🏥</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Welcome to Your
            <span className="bg-gradient-to-r from-medical-600 to-primary-600 bg-clip-text text-transparent block">
              Offline Medical Assistant
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get medical guidance and information in complete privacy. All processing happens locally on your device with advanced AI models.
          </p>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Connection Status */}
          <div className={`card transition-all duration-300 ${state.isBackendConnected ? 'border-success-200 bg-success-50' : 'border-danger-200 bg-danger-50'}`}>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-soft ${
                state.isBackendConnected 
                  ? 'bg-gradient-to-br from-success-500 to-success-600' 
                  : 'bg-gradient-to-br from-danger-500 to-danger-600'
              }`}>
                <span className="text-white text-xl">
                  {state.isBackendConnected ? '🟢' : '🔴'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Backend Service</h3>
                <p className={`text-sm ${
                  state.isBackendConnected ? 'text-success-700' : 'text-danger-700'
                }`}>
                  {state.isBackendConnected ? 'Connected & Ready' : 'Disconnected'}
                </p>
              </div>
            </div>
          </div>

          {/* Database Status */}
          {state.systemHealth && (
            <div className={`card transition-all duration-300 ${
              state.systemHealth.database === 'healthy' 
                ? 'border-success-200 bg-success-50' 
                : 'border-warning-200 bg-warning-50'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-soft ${
                  state.systemHealth.database === 'healthy'
                    ? 'bg-gradient-to-br from-success-500 to-success-600'
                    : 'bg-gradient-to-br from-warning-500 to-warning-600'
                }`}>
                  <span className="text-white text-xl">🗄️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Database</h3>
                  <p className={`text-sm capitalize ${
                    state.systemHealth.database === 'healthy' ? 'text-success-700' : 'text-warning-700'
                  }`}>
                    {state.systemHealth.database}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Service Status */}
          {state.systemHealth && (
            <div className={`card transition-all duration-300 ${
              state.systemHealth.ai_service === 'healthy' 
                ? 'border-success-200 bg-success-50' 
                : 'border-warning-200 bg-warning-50'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-soft ${
                  state.systemHealth.ai_service === 'healthy'
                    ? 'bg-gradient-to-br from-success-500 to-success-600'
                    : 'bg-gradient-to-br from-warning-500 to-warning-600'
                }`}>
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">AI Service</h3>
                  <p className={`text-sm capitalize ${
                    state.systemHealth.ai_service === 'healthy' ? 'text-success-700' : 'text-warning-700'
                  }`}>
                    {state.systemHealth.ai_service}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Connection Error Alert */}
        {!state.isBackendConnected && (
          <div className="card border-warning-200 bg-warning-50 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-soft flex-shrink-0">
                <span className="text-white text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-warning-800 mb-2">Backend Service Unavailable</h3>
                <p className="text-sm text-warning-700 mb-4">
                  The medical assistant service is not available. Please restart the application if the problem persists.
                </p>
                <button
                  onClick={checkSystemHealth}
                  className="bg-warning-600 hover:bg-warning-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-soft"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={!state.isBackendConnected && action.title.includes('Medical')}
                className="card card-hover group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-soft text-left"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center shadow-soft mb-4 group-hover:scale-105 transition-transform duration-200`}>
                  <span className="text-2xl text-white">{action.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">{action.title}</h3>
                <p className="text-gray-600 leading-relaxed">{action.description}</p>
                <div className="mt-4 flex items-center text-primary-600 group-hover:text-primary-700 transition-colors">
                  <span className="text-sm font-medium">Get Started</span>
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="card border-primary-200 bg-primary-50">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft flex-shrink-0">
              <span className="text-white text-xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900 mb-3 text-lg">Important Medical Disclaimer</h3>
              <div className="text-primary-800 space-y-2 leading-relaxed">
                <p>
                  This application is for <strong>educational and informational purposes only</strong>. It is not intended to replace 
                  professional medical advice, diagnosis, or treatment.
                </p>
                <p>
                  Always seek the advice of qualified health providers with questions about medical conditions. 
                  In case of medical emergency, <strong>contact emergency services immediately</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
