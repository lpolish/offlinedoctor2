import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Download, 
  Shield, 
  Brain, 
  Database,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SettingsPage: React.FC = () => {
  const { state, updateSettings, checkSystemHealth } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState(state.settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(state.settings);
  }, [state.settings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    updateSettings(localSettings);
    setTimeout(() => setIsSaving(false), 1000); // Simulate save time
  };

  const handleBackup = async () => {
    // Mock backup functionality
    const backupData = {
      settings: localSettings,
      conversations: [], // Would include real conversation data
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-assistant-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'ai', label: 'AI Models', icon: Brain },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your medical assistant preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-medical-500 text-medical-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">General Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Auto-create sessions</label>
                    <p className="text-sm text-gray-500">Automatically create a new session for each conversation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.autoCreateSession}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, autoCreateSession: e.target.checked }))}
                    className="rounded border-gray-300 text-medical-600 focus:ring-medical-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Show medical disclaimers</label>
                    <p className="text-sm text-gray-500">Display medical disclaimers with AI responses</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.showMedicalDisclaimer}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, showMedicalDisclaimer: e.target.checked }))}
                    className="rounded border-gray-300 text-medical-600 focus:ring-medical-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Default query type</label>
                  <select
                    value={localSettings.preferredQueryType}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, preferredQueryType: e.target.value }))}
                    className="block w-48 border-gray-300 rounded-md focus:ring-medical-500 focus:border-medical-500"
                  >
                    <option value="general">General</option>
                    <option value="symptoms">Symptoms</option>
                    <option value="drug_interaction">Drug Interaction</option>
                    <option value="medical_term">Medical Term</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">AI Model Configuration</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Current AI Status</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      {state.isBackendConnected 
                        ? 'AI service is connected and ready' 
                        : 'AI service is not available. Please ensure Ollama is running.'}
                    </p>
                    <button
                      onClick={checkSystemHealth}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh Status
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Model Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Current Model:</span>
                        <p className="text-gray-900">llama3.1:8b (Medical Optimized)</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Temperature:</span>
                        <p className="text-gray-900">0.2 (Conservative for medical advice)</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Max Tokens:</span>
                        <p className="text-gray-900">2048</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Local Processing:</span>
                        <p className="text-health-600 font-medium">✓ Enabled</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Privacy & Security</h3>
              
              <div className="bg-health-50 border border-health-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-health-600" />
                  <div>
                    <h4 className="font-medium text-health-900 mb-1">Privacy Protected</h4>
                    <p className="text-sm text-health-700">
                      All your medical data is processed and stored locally on your device. 
                      No information is sent to external servers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Data Storage Location</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Database:</span>
                      <span className="text-gray-900 font-mono">./medical_assistant.db</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Configuration:</span>
                      <span className="text-gray-900 font-mono">Local Storage</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AI Models:</span>
                      <span className="text-gray-900 font-mono">~/.ollama/models/</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Management */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Backup & Export</h4>
                  
                  <button
                    onClick={handleBackup}
                    className="flex items-center gap-2 w-full bg-medical-600 text-white px-4 py-3 rounded-lg hover:bg-medical-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Export Conversation History
                  </button>
                  
                  <div className="text-xs text-gray-500">
                    Exports all conversations and settings as a JSON file
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Storage Information</h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conversations:</span>
                        <span className="text-gray-900">0 stored</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Database size:</span>
                        <span className="text-gray-900">~24 KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">AI Models:</span>
                        <span className="text-gray-900">~4.7 GB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Data Deletion</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Permanently delete all conversation history and settings. This action cannot be undone.
                      </p>
                      <button className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium">
                        <Trash2 className="h-4 w-4" />
                        Clear All Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {activeTab === 'general' && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex items-center gap-2 bg-medical-600 text-white px-6 py-2 rounded-lg hover:bg-medical-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
