import { useState, useRef, useEffect } from 'react';
import ollamaService from '../../services/ollama.service';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Set up connection monitoring
  useEffect(() => {
    const unsubscribe = ollamaService.onConnectionChange((connected) => {
      setIsAIConnected(connected);
      if (connected) {
        setConnectionError(null);
      }
    });

    // Initial connection check
    ollamaService.healthCheck().then(connected => {
      setIsAIConnected(connected);
      if (!connected) {
        setConnectionError('Cannot connect to Ollama. Please ensure it is running.');
      }
    });

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
      const startTime = Date.now();
      const result = await ollamaService.generateMedicalResponse(message);
      const duration = Date.now() - startTime;
      
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
      console.error('Error generating response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setConversation(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { 
                ...item, 
                response: `Sorry, I encountered an error: ${errorMessage}\n\nPlease check if Ollama is running and the model is available.`,
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

  const handleInstallOllama = () => {
    // For development, provide multiple options
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      alert('For development setup:\n\n1. Run: npm run setup\n2. Or manually: bash install-ollama.sh\n3. Then restart the dev server');
    } else {
      // For production builds, direct to download
      window.open('https://ollama.ai/download', '_blank');
    }
  };

  const handleStartOllama = async () => {
    setConnectionError('Attempting to start Ollama...');
    
    // Try to trigger health check which includes auto-recovery
    const isHealthy = await ollamaService.healthCheck();
    
    if (!isHealthy) {
      setConnectionError('Could not start Ollama automatically. Please run: ollama serve');
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
                {ollamaService.getConfig().model && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-xs">
                      {ollamaService.getConfig().model}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {!isAIConnected && (
            <button
              onClick={handleInstallOllama}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Install Ollama
            </button>
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
                  <h3 className="font-semibold mb-2">🤖 AI Service Required</h3>
                  <p className="text-sm">To use the Medical AI Assistant, you need Ollama installed and running.</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleInstallOllama}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Install Ollama
                  </button>
                  <button
                    onClick={handleStartOllama}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Try to Start Ollama
                  </button>
                  <p className="text-xs text-orange-700 text-center">
                    Or run manually: <code className="bg-orange-100 px-1 rounded">ollama serve</code>
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
        </form>
      </div>
    </div>
  );
}
