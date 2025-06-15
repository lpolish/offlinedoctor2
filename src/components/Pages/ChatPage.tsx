import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

interface ConversationItem {
  query: string;
  response?: string;
  timestamp: string;
  isLoading?: boolean;
}

export default function ChatPage() {
  const [inputMessage, setInputMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { state, submitQuery, createSession } = useApp();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Sync with session history from context
  useEffect(() => {
    if (state.sessionHistory.length > 0) {
      const newConversation: ConversationItem[] = [];
      state.sessionHistory.forEach((item) => {
        newConversation.push({
          query: `[Previous query for response at ${item.timestamp}]`,
          response: item.response,
          timestamp: item.timestamp,
        });
      });
      setConversation(newConversation);
    }
  }, [state.sessionHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || state.isLoading) return;

    const message = inputMessage.trim();
    const timestamp = new Date().toISOString();
    
    const newUserMessage: ConversationItem = {
      query: message,
      timestamp,
      isLoading: true,
    };
    
    setConversation(prev => [...prev, newUserMessage]);
    setInputMessage('');

    try {
      const response = await submitQuery(message);
      
      setConversation(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { ...item, response: response?.response || 'No response received', isLoading: false }
            : item
        )
      );
    } catch (error) {
      setConversation(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { ...item, response: 'Sorry, there was an error processing your request.', isLoading: false }
            : item
        )
      );
    }
  };

  const handleNewSession = async () => {
    await createSession();
    setConversation([]);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const suggestedQuestions = [
    {
      text: "I've been experiencing headaches lately. What could be causing them?",
      icon: '💊',
      category: 'Symptoms'
    },
    {
      text: "Can you explain what hypertension is?",
      icon: '📚',
      category: 'Medical Terms'
    },
    {
      text: "What are drug interactions I should be aware of?",
      icon: '⚠️',
      category: 'Drug Interactions'
    },
    {
      text: "What are some general tips for staying healthy?",
      icon: '🏃',
      category: 'Health Advice'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Enhanced Chat Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 px-6 py-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-medical-500 to-medical-600 rounded-xl flex items-center justify-center shadow-soft">
              <span className="text-white text-xl">💬</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Medical Consultation</h2>
              {state.currentSession ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                  <span>Session: {state.currentSession.session_id.slice(0, 8)}...</span>
                  <span>•</span>
                  <span>{conversation.length} messages</span>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No active session</p>
              )}
            </div>
          </div>
          <button
            onClick={handleNewSession}
            disabled={state.isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <span>🆕</span>
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
        {conversation.length === 0 ? (
          <div className="text-center py-12 max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-medical-500 to-medical-600 rounded-2xl flex items-center justify-center shadow-strong mb-6 mx-auto">
              <span className="text-3xl text-white">💬</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Start a Medical Conversation</h3>
            <p className="text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
              Ask about symptoms, medical conditions, drug interactions, or general health questions. 
              All conversations are processed locally and privately.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question.text)}
                  className="card card-hover text-left group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                      <span className="text-white">{question.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-primary-600 mb-1">{question.category}</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{question.text}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {conversation.map((message, index) => (
              <div key={index} className="space-y-4 animate-slide-up">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-3xl">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl rounded-br-lg px-6 py-4 shadow-soft">
                      <p className="whitespace-pre-wrap leading-relaxed">{message.query}</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-right flex items-center justify-end space-x-2">
                      <span>You</span>
                      <span>•</span>
                      <span>{formatTimestamp(message.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                {message.isLoading ? (
                  <div className="flex justify-start">
                    <div className="card max-w-3xl border-medical-200 bg-medical-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-600 rounded-xl flex items-center justify-center shadow-soft">
                          <span className="text-white text-lg">🏥</span>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-medical-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-medical-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-medical-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-medical-700 font-medium">Analyzing your request...</span>
                      </div>
                    </div>
                  </div>
                ) : message.response && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl">
                      <div className="card border-medical-200 bg-medical-50">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-600 rounded-xl flex items-center justify-center shadow-soft flex-shrink-0">
                            <span className="text-white text-lg">🏥</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-medical-800 mb-2">Medical AI Assistant</div>
                            <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{message.response}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 flex items-center space-x-2">
                        <span>AI Response</span>
                        <span>•</span>
                        <span>{formatTimestamp(message.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="border-t border-gray-200 bg-white p-6 shadow-soft">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Describe your symptoms, ask about conditions, or any medical questions..."
                disabled={state.isLoading || !state.isBackendConnected}
                className="input-field pr-12 py-4 text-base"
              />
              <button
                type="button"
                onClick={() => setInputMessage('')}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors ${
                  inputMessage ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || state.isLoading || !state.isBackendConnected}
              className="btn-primary px-8 py-4 text-base flex items-center space-x-2"
            >
              {state.isLoading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </button>
          </div>
          
          {!state.isBackendConnected && (
            <div className="mt-4 flex items-center space-x-2 text-danger-600 bg-danger-50 px-4 py-3 rounded-lg border border-danger-200">
              <span className="text-danger-500">⚠️</span>
              <span className="text-sm font-medium">Backend service is not connected. Please start the backend server.</span>
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <span>💡</span>
              <span>Tip: Be specific about your symptoms, duration, and any relevant medical history for better assistance.</span>
            </span>
            <span className="text-2xs text-gray-400">
              Press Enter to send
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
