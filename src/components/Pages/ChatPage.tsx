import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Send, Bot, User, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  confidence?: number;
  emergency_detected?: boolean;
  medical_guidance?: any;
}

const ChatPage: React.FC = () => {
  const { state, submitQuery } = useApp();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [queryType, setQueryType] = useState<string>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: `Welcome to your Offline Medical Assistant! I'm here to provide educational medical information and guidance.

**Important Medical Disclaimer:** This service is for informational purposes only and should not be considered as professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.

**Emergency Situations:** If you're experiencing a medical emergency, call your local emergency services immediately.

How can I help you today?`,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: message.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Submit query to backend
    try {
      const response = await submitQuery(userMessage.text, queryType);
      
      if (response) {
        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          text: response.response,
          sender: 'ai',
          timestamp: response.timestamp,
          confidence: response.confidence,
          emergency_detected: response.emergency_detected,
          medical_guidance: response.medical_guidance
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      // Error handling is managed by the context
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: 'I apologize, but I encountered an issue processing your request. Please ensure the backend service is running and try again. For urgent medical concerns, please contact a healthcare professional.',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Connection Status */}
      <div className={`p-2 text-sm flex items-center gap-2 ${
        state.isBackendConnected 
          ? 'bg-health-50 text-health-700 border-health-200' 
          : 'bg-emergency-50 text-emergency-700 border-emergency-200'
      } border rounded-lg mb-4`}>
        {state.isBackendConnected ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Connected to local AI service</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Disconnected - Please ensure the backend service is running</span>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Medical AI Consultation</h2>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-600">Ask questions about symptoms, conditions, or general health</p>
            
            {/* Query Type Selector */}
            <select
              value={queryType}
              onChange={(e) => setQueryType(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-medical-500"
            >
              <option value="general">General</option>
              <option value="symptoms">Symptoms</option>
              <option value="drug_interaction">Drug Interaction</option>
              <option value="medical_term">Medical Term</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-medical-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center gap-2 mb-2">
                  {msg.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span className="text-xs opacity-75">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                  {msg.confidence && (
                    <span className="text-xs opacity-75">
                      Confidence: {Math.round(msg.confidence * 100)}%
                    </span>
                  )}
                </div>

                {/* Emergency Warning */}
                {msg.emergency_detected && (
                  <div className="mb-3 p-2 bg-emergency-100 border border-emergency-300 rounded flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-emergency-600" />
                    <span className="text-sm text-emergency-800 font-medium">
                      Emergency keywords detected - Seek immediate medical care!
                    </span>
                  </div>
                )}

                {/* Message Text */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.text}
                </div>

                {/* Medical Guidance */}
                {msg.medical_guidance && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium text-blue-900 mb-2">Medical Guidance:</h4>
                    {msg.medical_guidance.severity && (
                      <p className="text-sm text-blue-800 mb-1">
                        Severity: <span className="font-medium">{msg.medical_guidance.severity}</span>
                      </p>
                    )}
                    {msg.medical_guidance.recommendations && (
                      <ul className="text-sm text-blue-800 list-disc list-inside">
                        {msg.medical_guidance.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {state.isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          {/* Error display */}
          {state.error && (
            <div className="mb-3 p-3 bg-emergency-50 border border-emergency-200 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emergency-600" />
              <span className="text-sm text-emergency-800">{state.error}</span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your symptoms or ask a medical question..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent resize-none"
              rows={2}
              disabled={state.isLoading || !state.isBackendConnected}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || state.isLoading || !state.isBackendConnected}
              className="px-4 py-2 bg-medical-500 text-white rounded-lg hover:bg-medical-600 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
