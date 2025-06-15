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
      // Convert session history to conversation format
      const newConversation: ConversationItem[] = [];
      state.sessionHistory.forEach((item) => {
        // For now, we'll show responses only since we don't have the original queries
        // In a real implementation, you'd want to store the queries as well
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
    
    // Add user message to conversation
    const newUserMessage: ConversationItem = {
      query: message,
      timestamp,
      isLoading: true,
    };
    
    setConversation(prev => [...prev, newUserMessage]);
    setInputMessage('');

    try {
      const response = await submitQuery(message);
      
      // Update the conversation with the response
      setConversation(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { ...item, response: response?.response || 'No response received', isLoading: false }
            : item
        )
      );
    } catch (error) {
      // Handle error case
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Medical Consultation</h2>
            {state.currentSession ? (
              <p className="text-sm text-gray-600">
                Session: {state.currentSession.session_id.slice(0, 8)}... • {conversation.length} messages
              </p>
            ) : (
              <p className="text-sm text-gray-600">No active session</p>
            )}
          </div>
          <button
            onClick={handleNewSession}
            disabled={state.isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            New Session
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Medical Conversation</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask about symptoms, medical conditions, drug interactions, or general health questions. 
              All conversations are processed locally and privately.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
              <button
                onClick={() => setInputMessage("I've been experiencing headaches lately. What could be causing them?")}
                className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-sm border border-gray-200 transition-colors"
              >
                💊 Ask about symptoms
              </button>
              <button
                onClick={() => setInputMessage("Can you explain what hypertension is?")}
                className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-sm border border-gray-200 transition-colors"
              >
                📚 Medical terminology
              </button>
              <button
                onClick={() => setInputMessage("What are drug interactions I should be aware of?")}
                className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-sm border border-gray-200 transition-colors"
              >
                ⚠️ Drug interactions
              </button>
              <button
                onClick={() => setInputMessage("What are some general tips for staying healthy?")}
                className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-sm border border-gray-200 transition-colors"
              >
                🏃 Health advice
              </button>
            </div>
          </div>
        ) : (
          <>
            {conversation.map((message, index) => (
              <div key={index} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-3xl">
                    <div className="bg-blue-600 text-white rounded-lg px-4 py-3">
                      <p className="whitespace-pre-wrap">{message.query}</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                {message.isLoading ? (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-3xl">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🏥</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                ) : message.response && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl">
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <div className="flex items-start space-x-2">
                          <span className="text-lg">🏥</span>
                          <div className="flex-1">
                            <p className="whitespace-pre-wrap">{message.response}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Medical AI • {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Describe your symptoms, ask about conditions, or any medical questions..."
            disabled={state.isLoading || !state.isBackendConnected}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || state.isLoading || !state.isBackendConnected}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {state.isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {!state.isBackendConnected && (
          <div className="mt-2 text-sm text-red-600">
            ⚠️ Backend service is not connected. Please start the backend server.
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-500">
          💡 Tip: Be specific about your symptoms, duration, and any relevant medical history for better assistance.
        </div>
      </form>
    </div>
  );
}
