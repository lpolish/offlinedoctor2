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

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-medical-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-medical-700 to-medical-500 bg-clip-text text-transparent mb-3">
            Medical History
          </h1>
          <p className="text-medical-600 leading-relaxed">
            Review your past consultations and medical insights. All data is stored locally on your device.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-medical-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-medical-100 rounded-lg">
                <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-medical-600">Total Consultations</p>
                <p className="text-2xl font-bold text-medical-900">{state.sessionHistory.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-medical-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-medical-600">Current Session</p>
                <p className="text-2xl font-bold text-medical-900">
                  {state.currentSession ? 'Active' : 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-medical-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-medical-600">Last Consultation</p>
                <p className="text-lg font-semibold text-medical-900">
                  {state.sessionHistory.length > 0 
                    ? formatDuration(state.sessionHistory[state.sessionHistory.length - 1].timestamp)
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Session History */}
        {state.sessionHistory.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-medical-900 mb-4">Recent Consultations</h2>
            {state.sessionHistory.slice().reverse().map((item, index) => (
              <div key={`${item.session_id}-${index}`} className="bg-white rounded-xl shadow-sm border border-medical-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-medical-100 rounded-lg">
                        <svg className="w-5 h-5 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-medical-600">
                          Session: {item.session_id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-medical-500">
                          {formatTimestamp(item.timestamp)} • {formatDuration(item.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-medical-100 text-medical-700 rounded-full text-xs font-medium capitalize">
                        {item.query_type}
                      </span>
                      {item.confidence && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {Math.round(item.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Medical Response */}
                  <div className="bg-medical-50 rounded-lg p-4 mb-4">
                    <p className="text-medical-800 leading-relaxed text-sm">
                      {item.response}
                    </p>
                  </div>

                  {/* Medical Guidance */}
                  {item.medical_guidance && (
                    <div className={`rounded-lg p-4 mb-4 border ${getSeverityColor(item.medical_guidance.severity)}`}>
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-sm">
                          Medical Guidance
                          {item.medical_guidance.severity && (
                            <span className="ml-2 capitalize">({item.medical_guidance.severity} Priority)</span>
                          )}
                        </span>
                      </div>
                      {item.medical_guidance.recommendations && (
                        <ul className="list-disc list-inside text-sm space-y-1 ml-7">
                          {item.medical_guidance.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      )}
                      {item.medical_guidance.emergency_action && (
                        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                          <p className="text-sm font-medium text-red-800">
                            ⚠️ Emergency Action: {item.medical_guidance.emergency_action}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Emergency Detection */}
                  {item.emergency_detected && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.350 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="font-medium text-red-800 text-sm">Emergency condition detected in this consultation</span>
                      </div>
                    </div>
                  )}

                  {/* Related Conditions */}
                  {item.related_conditions && item.related_conditions.length > 0 && (
                    <div className="border-t border-medical-200 pt-4">
                      <p className="text-sm font-medium text-medical-700 mb-2">Related Conditions:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.related_conditions.map((condition, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                            {condition.name} ({Math.round(condition.similarity * 100)}% match)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm border border-medical-200 p-8">
              <svg className="w-16 h-16 text-medical-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-semibold text-medical-900 mb-2">No Medical History</h3>
              <p className="text-medical-600 mb-6">
                You haven't had any medical consultations yet. Start a conversation in the Chat section to build your medical history.
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition-colors cursor-pointer">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Start First Consultation
              </div>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-12 bg-success-50 border border-success-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-success-100 rounded-lg">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-success-900 mb-3 text-lg">Privacy Protected</h3>
              <div className="text-success-800 space-y-2 leading-relaxed">
                <p>
                  All your medical consultation data is stored <strong>locally on your device</strong> and never sent to external servers.
                </p>
                <p>
                  Your privacy and medical information remain completely secure with end-to-end local processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
