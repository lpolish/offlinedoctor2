import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Heart, 
  Database, 
  Brain,
  AlertTriangle,
  CheckCircle,
  Info,
  Stethoscope,
  Lock,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { state, createSession } = useApp();

  const startConsultation = async () => {
    // Pre-create a session for better UX
    await createSession('symptoms');
    navigate('/chat');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-health-500" />;
      case 'connecting':
      case 'degraded':
        return <Activity className="h-5 w-5 text-warning-500 animate-pulse" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-emergency-500" />;
    }
  };

  const getStatusText = (service: string, status: string) => {
    if (service === 'database') {
      return status === 'connected' ? 'Local Database Connected' : 'Database Connecting...';
    }
    if (service === 'ai') {
      return status === 'ready' ? 'AI Service Ready' : 'AI Service Starting...';
    }
    return 'Privacy Protected';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="flex justify-center">
          <div className="bg-medical-100 p-4 rounded-full">
            <Stethoscope className="h-16 w-16 text-medical-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900">
          Offline Medical Assistant
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Get instant medical guidance with complete privacy. Your health data stays on your device, 
          powered by local AI for confidential medical consultations.
        </p>
        
        <button
          onClick={startConsultation}
          disabled={!state.isBackendConnected}
          className="inline-flex items-center gap-3 bg-medical-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          Start Medical Consultation
        </button>
      </div>

      {/* Medical Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Medical Disclaimer</h3>
            <p className="text-yellow-700 leading-relaxed">
              This application provides educational information only and is not intended to replace 
              professional medical advice, diagnosis, or treatment. Always seek the advice of your 
              physician or other qualified health provider with any questions you may have regarding 
              a medical condition. In case of emergency, call your local emergency services immediately.
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Database className="h-6 w-6 text-gray-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Local Database</span>
                {getStatusIcon(state.systemHealth?.database || 'connecting')}
              </div>
              <span className="text-sm text-gray-600">
                {getStatusText('database', state.systemHealth?.database || 'connecting')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Brain className="h-6 w-6 text-gray-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">AI Service</span>
                {getStatusIcon(state.systemHealth?.ai_service || 'connecting')}
              </div>
              <span className="text-sm text-gray-600">
                {getStatusText('ai', state.systemHealth?.ai_service || 'connecting')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Lock className="h-6 w-6 text-gray-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Privacy</span>
                <CheckCircle className="h-5 w-5 text-health-500" />
              </div>
              <span className="text-sm text-gray-600">All data stays local</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <MessageCircle className="h-6 w-6 text-medical-500" />
            <h3 className="font-semibold text-gray-900">AI Consultation</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Chat with our medical AI for symptom assessment, general health questions, 
            and medical information lookup.
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="text-medical-600 text-sm font-medium hover:text-medical-700 transition-colors"
          >
            Start Chat →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-6 w-6 text-health-500" />
            <h3 className="font-semibold text-gray-900">Symptom Checker</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Describe your symptoms and get AI-powered guidance on potential causes 
            and when to seek medical care.
          </p>
          <button
            onClick={() => {
              createSession('symptoms');
              navigate('/chat');
            }}
            className="text-medical-600 text-sm font-medium hover:text-medical-700 transition-colors"
          >
            Check Symptoms →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Info className="h-6 w-6 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Medical Information</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Access a comprehensive database of medical conditions, treatments, 
            and drug interactions.
          </p>
          <button
            onClick={() => {
              createSession('medical_term');
              navigate('/chat');
            }}
            className="text-medical-600 text-sm font-medium hover:text-medical-700 transition-colors"
          >
            Search Terms →
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No recent consultations</p>
          <p className="text-sm">Start your first medical consultation to see activity here</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
