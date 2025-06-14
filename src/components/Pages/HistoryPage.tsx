import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MessageCircle, 
  AlertTriangle, 
  Search,
  Filter,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HistoryEntry {
  id: string;
  session_id: string;
  timestamp: string;
  query_type: string;
  user_message: string;
  ai_response: string;
  confidence: number;
  emergency_detected?: boolean;
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);

  // Mock history data - in real app this would come from the backend
  const [history] = useState<HistoryEntry[]>([
    {
      id: '1',
      session_id: 'session-1',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      query_type: 'symptoms',
      user_message: 'I have a headache and feel dizzy',
      ai_response: 'Based on your symptoms of headache and dizziness, these could be related to various conditions...',
      confidence: 0.85,
      emergency_detected: false
    },
    {
      id: '2',
      session_id: 'session-2',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      query_type: 'general',
      user_message: 'What are the benefits of drinking water?',
      ai_response: 'Drinking adequate water has numerous health benefits including proper hydration...',
      confidence: 0.92,
      emergency_detected: false
    }
  ]);

  useEffect(() => {
    let filtered = history;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.ai_response.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.query_type === filterType);
    }

    setFilteredHistory(filtered);
  }, [searchTerm, filterType, history]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getQueryTypeColor = (type: string) => {
    switch (type) {
      case 'symptoms':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'emergency':
        return 'bg-emergency-100 text-emergency-700 border-emergency-200';
      case 'drug_interaction':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'medical_term':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const continueConversation = (sessionId: string) => {
    // In a real app, you'd load the session and navigate to chat
    navigate(`/chat?session=${sessionId}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversation History</h1>
          <p className="text-gray-600">Review your past medical consultations</p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700 transition-colors"
        >
          New Consultation
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-medical-500"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="symptoms">Symptoms</option>
              <option value="drug_interaction">Drug Interactions</option>
              <option value="medical_term">Medical Terms</option>
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {searchTerm || filterType !== 'all' ? (
                <>
                  <p>No conversations match your search criteria</p>
                  <p className="text-sm">Try adjusting your search or filter settings</p>
                </>
              ) : (
                <>
                  <p>No conversation history yet</p>
                  <p className="text-sm">Your past medical consultations will appear here</p>
                </>
              )}
            </div>
          </div>
        ) : (
          filteredHistory.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getQueryTypeColor(entry.query_type)}`}>
                      {entry.query_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {formatDate(entry.timestamp)}
                    </div>
                    
                    {entry.emergency_detected && (
                      <div className="flex items-center gap-1 text-emergency-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">Emergency Detected</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Your Question:</p>
                      <p className="text-gray-700">{entry.user_message}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">AI Response:</p>
                      <p className="text-gray-700 line-clamp-3">
                        {entry.ai_response.length > 200 
                          ? `${entry.ai_response.substring(0, 200)}...` 
                          : entry.ai_response
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Confidence: {Math.round(entry.confidence * 100)}%
                    </div>
                    
                    <button
                      onClick={() => continueConversation(entry.session_id)}
                      className="flex items-center gap-2 text-medical-600 hover:text-medical-700 text-sm font-medium"
                    >
                      Continue Conversation
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Privacy Protection</h4>
            <p className="text-sm text-blue-700">
              All conversation history is stored locally on your device. No data is sent to external servers, 
              ensuring complete privacy for your medical consultations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
