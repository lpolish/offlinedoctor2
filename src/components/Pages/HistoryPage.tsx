import { useApp } from '../../context/AppContext';

export default function HistoryPage() {
  const { state } = useApp();

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Medical Consultation History</h1>
          <p className="text-gray-600">
            Review your past medical consultations and conversations. All data is stored locally and privately.
          </p>
        </div>

        {state.currentSession && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">Current Session</h2>
              <div className="text-sm text-blue-800">
                <p>Session ID: {state.currentSession.session_id}</p>
                <p>Type: {state.currentSession.session_type}</p>
                <p>Started: {formatTimestamp(state.currentSession.created_at)}</p>
                <p>Messages: {state.sessionHistory.length}</p>
              </div>
            </div>
          </div>
        )}

        {state.sessionHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Consultation History</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Start a medical consultation to begin building your private consultation history.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  Session History ({state.sessionHistory.length} messages)
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {state.sessionHistory.map((message, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">{index + 1}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">Medical Response</h4>
                              <p className="text-sm text-gray-700 leading-relaxed">{message.response}</p>
                            </div>
                            
                            {message.emergency_detected && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <span className="text-red-600">🚨</span>
                                  <div>
                                    <p className="font-medium text-red-800 text-sm">Emergency Detected</p>
                                    <p className="text-xs text-red-700">
                                      {message.medical_guidance?.emergency_action || 'Seek immediate medical attention.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {message.medical_guidance?.recommendations && (
                              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="font-medium text-blue-800 text-sm mb-2">Recommendations:</p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                  {message.medical_guidance.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start space-x-2">
                                      <span>•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Type: {message.query_type}</span>
                              {message.confidence && (
                                <span>Confidence: {(message.confidence * 100).toFixed(1)}%</span>
                              )}
                              <span>Session: {message.session_id.slice(0, 8)}...</span>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</p>
                            <p className="text-xs text-gray-400">{formatDuration(message.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {state.sessionHistory.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{state.sessionHistory.length}</div>
              <div className="text-sm text-gray-600">Total Consultations</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {state.sessionHistory.filter(m => m.emergency_detected).length}
              </div>
              <div className="text-sm text-gray-600">Emergency Detections</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(state.sessionHistory.map(m => m.query_type)).size}
              </div>
              <div className="text-sm text-gray-600">Query Types Used</div>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">🔒 Privacy Protected</h3>
          <p className="text-sm text-green-800">
            All your medical consultation data is stored locally on your device and never sent to external servers. 
            Your privacy and medical information remain completely secure.
          </p>
        </div>
      </div>
    </div>
  );
}
