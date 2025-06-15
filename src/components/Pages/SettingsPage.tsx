import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function SettingsPage() {
  const { state, updateSettings, checkSystemHealth, reconnectBackend } = useApp();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await reconnectBackend();
      await checkSystemHealth();
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Configure your medical assistant preferences and system settings.
          </p>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">System Status</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Backend Connection</span>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${state.isBackendConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`text-sm ${state.isBackendConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {state.isBackendConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              {state.systemHealth && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Database</span>
                    <span className={`text-sm ${state.systemHealth.database === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {state.systemHealth.database}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">AI Service</span>
                    <span className={`text-sm ${state.systemHealth.ai_service === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {state.systemHealth.ai_service}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Last Health Check</span>
                    <span className="text-sm text-gray-600">
                      {new Date(state.systemHealth.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={checkSystemHealth}
                disabled={state.isLoading}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>

        {/* Application Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Application Settings</h2>
          </div>
          <div className="p-4 space-y-6">
            {/* Auto Create Session */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-create Sessions</label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically create a new session when submitting queries without an active session
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.settings.autoCreateSession}
                  onChange={(e) => handleSettingChange('autoCreateSession', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Show Medical Disclaimer */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Show Medical Disclaimers</label>
                <p className="text-xs text-gray-500 mt-1">
                  Display medical disclaimers and warnings in the interface
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.settings.showMedicalDisclaimer}
                  onChange={(e) => handleSettingChange('showMedicalDisclaimer', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Preferred Query Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Query Type
              </label>
              <select
                value={state.settings.preferredQueryType}
                onChange={(e) => handleSettingChange('preferredQueryType', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">General Medical</option>
                <option value="symptoms">Symptoms Analysis</option>
                <option value="drug_interaction">Drug Interactions</option>
                <option value="medical_term">Medical Terminology</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Default type for medical queries when not specified
              </p>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">AI Configuration</h2>
          </div>
          <div className="p-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">🤖 Ollama Integration</h3>
              <p className="text-sm text-yellow-700">
                This application uses Ollama for local AI processing. Make sure Ollama is installed and running 
                with a medical-capable model for best results.
              </p>
              <div className="mt-3 text-sm text-yellow-700">
                <p><strong>Recommended models:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>llama2:7b - General purpose medical assistance</li>
                  <li>llama2:13b - Enhanced medical knowledge</li>
                  <li>medalpaca - Specialized medical model</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Privacy & Security</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-green-600">🔒</span>
                <div>
                  <h4 className="font-medium text-gray-900">Local Processing Only</h4>
                  <p className="text-sm text-gray-600">All medical data is processed locally on your device</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-green-600">🏠</span>
                <div>
                  <h4 className="font-medium text-gray-900">Offline Operation</h4>
                  <p className="text-sm text-gray-600">No internet connection required for medical consultations</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-green-600">🗄️</span>
                <div>
                  <h4 className="font-medium text-gray-900">Local Database</h4>
                  <p className="text-sm text-gray-600">All conversation history stored in local SQLite database</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-green-600">🚫</span>
                <div>
                  <h4 className="font-medium text-gray-900">No Telemetry</h4>
                  <p className="text-sm text-gray-600">No usage data or personal information is sent to external servers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">About</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>Application:</strong> Offline Medical Assistant v1.0.0</p>
              <p><strong>Framework:</strong> Tauri + React + TypeScript</p>
              <p><strong>Backend:</strong> Tauri Rust + SQLite</p>
              <p><strong>AI Engine:</strong> Ollama (Local)</p>
              <p><strong>Privacy:</strong> HIPAA-Conscious Design</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
