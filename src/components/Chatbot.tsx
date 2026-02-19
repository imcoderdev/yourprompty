import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Heart, Star, Loader } from 'lucide-react';
import { sendMessage } from '../services/chatService';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

interface ChatbotProps {
  user?: any;
  onTriggerAction?: (action: string, data?: any) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ user, onTriggerAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{id: number, text: string, sender: 'user' | 'bot', timestamp: number}>>([
    { id: 1, text: "Hey there! 👋 I'm Prompty, your creative assistant!", sender: 'bot', timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [botMood, setBotMood] = useState('happy');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const randomGreetings = [
    "Hiya! 👋",
    "Hey beautiful! ✨",
    "What's up, creator? 🎨",
    "Ready to create magic? 🪄",
    "Let's make art! 🎭",
    "Feeling creative today? 💡",
    "Time to inspire! 🌟"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        const greetings = randomGreetings;
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        // Randomly show a greeting message
        if (Math.random() < 0.3) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: randomGreeting,
            sender: 'bot',
            timestamp: Date.now()
          }]);
        }
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user' as const,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setRateLimitError(null);

    try {
      const { data, error } = await sendMessage({
        message: inputValue,
        context: 'Browsing home feed',
        conversationId: conversationId
      });

      if (error) {
        throw new Error(error.message || 'Failed to get response');
      }

      setIsTyping(false);

      // Store conversation ID
      if (data?.conversationId) {
        setConversationId(data.conversationId);
      }

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: data?.message || "I'm here to help! What would you like to know?",
        sender: 'bot' as const,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMessage]);
      setBotMood(Math.random() > 0.5 ? 'excited' : 'happy');

      // Handle actions
      if (data?.actions && data.actions.length > 0 && onTriggerAction) {
        data.actions.forEach((action: any) => {
          onTriggerAction(action.type, action);
        });
      }

    } catch (error: any) {
      setIsTyping(false);
      
      // Handle rate limit error
      if (error.message?.includes('Too many')) {
        setRateLimitError('Slow down there! 😅 Let\'s chat a bit slower.');
      }

      const errorMessage = {
        id: Date.now() + 1,
        text: error.message || "Oops! Something went wrong. Let's try that again! 😊",
        sender: 'bot' as const,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getBotEmoji = () => {
    switch (botMood) {
      case 'excited': return '🤩';
      case 'thinking': return '🤔';
      case 'creative': return '🎨';
      default: return '😊';
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-16 h-16 rounded-full shadow-2xl transition-all duration-500 transform hover:scale-110 ${
            isOpen 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 rotate-180' 
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-pulse-glow hover:rotate-12'
          }`}
        >
          {isOpen ? (
            <X className="w-8 h-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          ) : (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-2xl animate-bounce">{getBotEmoji()}</div>
            </div>
          )}
          
          {/* Floating notification dots */}
          {!isOpen && (
            <>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></div>
            </>
          )}
        </button>

        {/* Floating helper text */}
        {!isOpen && (
          <div className="absolute bottom-20 right-0 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 shadow-xl border border-white/20 animate-bounce-slow">
            <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
              Need help? Chat with me! 💬
            </p>
            <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/95"></div>
          </div>
        )}
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 z-40 animate-fade-in-up overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-float">
                  <span className="text-2xl">{getBotEmoji()}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg">Prompty</h3>
                <p className="text-sm text-white/80">Your Creative Assistant</p>
              </div>
              <div className="flex-1"></div>
              <div className="flex space-x-1">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <Heart className="w-4 h-4 animate-pulse" />
                <Star className="w-4 h-4 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 h-80 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50/50 to-white/50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl shadow-md transition-all duration-300 hover:scale-105 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-100'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getBotEmoji()}</span>
                      <span className="text-xs text-gray-500 font-medium">Prompty</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-md border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getBotEmoji()}</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-md">
            {rateLimitError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                {rateLimitError}
              </div>
            )}
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... 💭"
                maxLength={500}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-lg hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {inputValue.length}/500 characters
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;