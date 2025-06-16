import { useState, useRef, useEffect } from 'react';
import transformersService from '../../services/transformers.service';
import { debugOllamaConnection } from '../../utils/debug';

interface ConversationItem {
  query: string;
  response?: string;
  timestamp: string;
  isLoading?: boolean;
  metadata?: {
    model: string;
    duration?: number;
  };
}

export default function ChatPage() {
  const [inputMessage, setInputMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [isAIConnected, setIsAIConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Set up connection monitoring
  useEffect(() => {
    const unsubscribe = transformersService.onConnectionChange((connected: boolean) => {
      console.log(`🔗 AI connection status changed: ${connected ? 'Connected' : 'Disconnected'}`);
      setIsAIConnected(connected);
      if (connected) {
        setConnectionError(null);
      }
    });

    // Initial connection check with better error handling
    const performInitialCheck = async () => {
      try {
        console.log('🔍 Performing initial AI health check...');
        const connected = await transformersService.healthCheck();
        setIsAIConnected(connected);
        if (!connected) {
          setConnectionError('AI models are initializing. Please wait...');
        } else {
          console.log('✅ Initial health check successful');
        }
      } catch (error) {
        console.error('❌ Initial health check failed:', error);
        setIsAIConnected(false);
        setConnectionError(`Initial connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    performInitialCheck();

    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !isAIConnected) return;

    const message = inputMessage.trim();
    const timestamp = new Date().toISOString();
    
    const newUserMessage: ConversationItem = {
      query: message,
      timestamp,
      isLoading: true,
    };
    
    setConversation(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);
    setConnectionError(null);

    try {
      console.log('🤖 Sending message to AI:', message);
      const startTime = Date.now();
      const result = await transformersService.generateMedicalResponse(message);
      const duration = Date.now() - startTime;
      
      console.log('✅ Received response from AI:', {
        model: result.metadata.model,
        duration: duration + 'ms',
        responseLength: result.response.length
      });
      
      setConversation(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { 
                ...item, 
                response: result.response, 
                isLoading: false,
                metadata: {
                  model: result.metadata.model,
                  duration
                }
              }
            : item
        )
      );
    } catch (error) {
      console.error('❌ Error generating response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      let detailedError = `Sorry, I encountered an error: ${errorMessage}`;
      
      // Provide more specific guidance based on error type
      if (errorMessage.includes('timeout')) {
        detailedError += '\n\n🕐 The request timed out. Ollama might be busy or slow to respond.';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        detailedError += '\n\n🌐 Network connection issue. Please check if Ollama is running on localhost:11434.';
      } else if (errorMessage.includes('Model') && errorMessage.includes('not available')) {
        detailedError += '\n\n🤖 The AI model is not available. Try running: ollama pull tinyllama:latest';
      } else {
        detailedError += '\n\n💡 Please check if Ollama is running and the model is available.';
      }
      
      setConversation(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { 
                ...item, 
                response: detailedError,
                isLoading: false 
              }
            : item
        )
      );
      
      setConnectionError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const suggestedQuestions = [
    "I've been experiencing headaches lately. What could be causing them?",
    "Can you explain what hypertension is?",
    "What are some general tips for staying healthy?",
    "What should I do if I have a fever?"
  ];

  const handleDebugConnection = async () => {
    setDebugInfo(['🔍 Running connection diagnostics...']);
    setShowDebugPanel(true);
    
    try {
      const result = await debugOllamaConnection();
      setDebugInfo(result.details);
    } catch (error) {
      setDebugInfo(['❌ Debug failed:', error instanceof Error ? error.message : 'Unknown error']);
    }
  };

  const handleTestModel = async () => {
    setDebugInfo(prev => [...prev, '', '🧪 Testing model...']);
    
    try {
      // Test the model with a simple query
      const testResult = await transformersService.generateMedicalResponse("Hello, how are you?");
      setDebugInfo(prev => [...prev, 
        `✅ Model test successful (${testResult.metadata.duration}ms)`, 
        `Model: ${testResult.metadata.model}`,
        `Response: ${testResult.response.substring(0, 100)}...`
      ]);
    } catch (error) {
      setDebugInfo(prev => [...prev, `❌ Model test error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const handleStartOllama = async () => {
    setConnectionError('Attempting to reconnect to AI...');
    
    try {
      // Try to trigger health check
      console.log('🔄 Manual retry: checking AI health...');
      const isHealthy = await transformersService.healthCheck();
      
      if (isHealthy) {
        setConnectionError(null);
        console.log('✅ Manual retry successful');
      } else {
        setConnectionError('AI models are initializing. Please wait...');
        console.error('❌ Manual retry failed');
      }
    } catch (error) {
      const errorMsg = `Connection retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setConnectionError(errorMsg);
      console.error('❌ Manual retry error:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Enhanced Header with Status */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🏥</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Medical AI Assistant</h1>
              <div className="flex items-center space-x-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  isAIConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="text-gray-600">
                  {isAIConnected ? 'AI Ready' : 'AI Disconnected'}
                </span>
                {isAIConnected && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-xs">
                      {transformersService.getModelInfo().name}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-xs">
                      Browser-based AI
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {!isAIConnected && (
            <div className="flex space-x-2">
              <button
                onClick={handleStartOllama}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Initialize AI
              </button>
              <button
                onClick={handleDebugConnection}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
              >
                Debug
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {conversation.length === 0 ? (
          <div className="text-center py-12 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-6 mx-auto">
              <span className="text-2xl text-white">💬</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ask me anything about health</h2>
            <p className="text-gray-600 mb-8">
              I'm here to provide general medical information and guidance. Ask about symptoms, 
              conditions, or general health questions.
            </p>
            
            {isAIConnected ? (
              <div className="grid grid-cols-1 gap-3 max-w-xl mx-auto">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm text-gray-700">{question}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 max-w-md mx-auto">
                <div className="text-orange-800 mb-4">
                  <h3 className="font-semibold mb-2">🤖 AI Initializing</h3>
                  <p className="text-sm">The AI models are loading. This may take a few minutes on first use.</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleStartOllama}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Initialize AI Models
                  </button>
                  <p className="text-xs text-orange-700 text-center">
                    AI models are downloading and initializing in your browser
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {conversation.map((message, index) => (
              <div key={index} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-2xl">
                    <div className="bg-blue-600 text-white rounded-lg rounded-br-sm px-4 py-3">
                      <p className="text-sm leading-relaxed">{message.query}</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="max-w-2xl">
                    <div className="bg-white border border-gray-200 rounded-lg rounded-bl-sm px-4 py-3 shadow-sm">
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      ) : message.response ? (
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                            {message.response}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    {message.metadata && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                        <span>via {message.metadata.model}</span>
                        {message.metadata.duration && (
                          <>
                            <span>•</span>
                            <span>{(message.metadata.duration / 1000).toFixed(1)}s</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  isAIConnected 
                    ? "Ask about symptoms, conditions, or health concerns..." 
                    : "Ollama is required to send messages"
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!isAIConnected || isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading || !isAIConnected}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Send'
              )}
            </button>
          </div>
          
          {connectionError && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm">{connectionError}</span>
            </div>
          )}
          
          {showDebugPanel && (
            <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Connection Debug Info</h3>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1 text-xs font-mono text-gray-600 max-h-40 overflow-y-auto">
                {debugInfo.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
              {isAIConnected && (
                <button
                  onClick={handleTestModel}
                  className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Test Model
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
