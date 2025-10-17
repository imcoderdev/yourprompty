import React, { useState } from 'react';
import { ExternalLink, Sparkles, Zap, Brain, Bot, Star } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  color: string;
  popular?: boolean;
}

interface AIModelSelectorProps {
  onModelSelect: (model: AIModel) => void;
  selectedModel?: string;
  prompt?: string;
  isLiked?: boolean;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({ onModelSelect, selectedModel, prompt, isLiked }) => {
  const [isOpen, setIsOpen] = useState(false);

  const aiModels: AIModel[] = [
    {
      id: 'claude-sonnet',
      name: 'Claude Sonnet',
      provider: 'Anthropic',
      description: 'Most intelligent model for complex tasks',
      icon: <Brain className="w-5 h-5" />,
      url: 'https://claude.ai',
      color: 'from-orange-500 to-red-500',
      popular: true
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      description: 'Advanced multimodal AI model',
      icon: <Sparkles className="w-5 h-5" />,
      url: 'https://chat.openai.com',
      color: 'from-green-500 to-emerald-500',
      popular: true
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      description: 'Google\'s most capable AI model',
      icon: <Star className="w-5 h-5" />,
      url: 'https://gemini.google.com',
      color: 'from-blue-500 to-purple-500',
      popular: true
    },
    {
      id: 'llama-3-1',
      name: 'Llama 3.1',
      provider: 'Meta',
      description: 'Open-source large language model',
      icon: <Bot className="w-5 h-5" />,
      url: 'https://llama.meta.com',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'cohere-command',
      name: 'Command R+',
      provider: 'Cohere',
      description: 'Advanced reasoning and generation',
      icon: <Brain className="w-5 h-5" />,
      url: 'https://cohere.com',
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'anthropic-haiku',
      name: 'Claude Haiku',
      provider: 'Anthropic',
      description: 'Fast and cost-effective model',
      icon: <Sparkles className="w-5 h-5" />,
      url: 'https://claude.ai',
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 'mistral-large',
      name: 'Mistral Large',
      provider: 'Mistral AI',
      description: 'European AI excellence',
      icon: <Zap className="w-5 h-5" />,
      url: 'https://mistral.ai',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      id: 'perplexity-pro',
      name: 'Perplexity Pro',
      provider: 'Perplexity',
      description: 'AI-powered search and reasoning',
      icon: <Brain className="w-5 h-5" />,
      url: 'https://perplexity.ai',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      id: 'replicate-flux',
      name: 'Flux Pro',
      provider: 'Replicate',
      description: 'High-quality image generation',
      icon: <Star className="w-5 h-5" />,
      url: 'https://replicate.com',
      color: 'from-violet-500 to-purple-500'
    }
  ];

  const handleModelClick = (model: AIModel) => {
    onModelSelect(model);
    setIsOpen(false);
    
    // If user has liked the prompt, open model with prompt pre-filled
    if (isLiked && prompt) {
      let modelUrl = model.url;
      
      // Add prompt as URL parameter for different models
      if (model.id === 'claude-sonnet' || model.id === 'anthropic-haiku') {
        modelUrl = `${model.url}?prompt=${encodeURIComponent(prompt)}`;
      } else if (model.id === 'gpt-4o') {
        modelUrl = `${model.url}?q=${encodeURIComponent(prompt)}`;
      } else if (model.id === 'gemini-pro') {
        modelUrl = `${model.url}?q=${encodeURIComponent(prompt)}`;
      } else if (model.id === 'perplexity-pro') {
        modelUrl = `${model.url}?q=${encodeURIComponent(prompt)}`;
      } else {
        // For other models, just open the URL
        modelUrl = model.url;
      }
      
      window.open(modelUrl, '_blank');
    } else {
      // Just open the model's page
      window.open(model.url, '_blank');
    }
  };

  const selectedModelData = aiModels.find(m => m.id === selectedModel);

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-3 px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm w-full relative ${
          isLiked 
            ? 'border-purple-400 bg-purple-50 hover:border-purple-500' 
            : 'border-gray-200 hover:border-purple-300'
        }`}
      >
        {selectedModelData ? (
          <>
            <div className={`w-8 h-8 bg-gradient-to-r ${selectedModelData.color} rounded-lg flex items-center justify-center text-white`}>
              {selectedModelData.icon}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">{selectedModelData.name}</div>
              <div className="text-xs text-gray-500">{selectedModelData.provider}</div>
              {isLiked && <div className="text-xs text-purple-600 font-medium">Ready to try! ✨</div>}
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Select AI Model</div>
              <div className="text-xs text-gray-500">
                {isLiked ? 'Choose AI to try this prompt' : 'Choose your preferred AI'}
              </div>
              {isLiked && <div className="text-xs text-purple-600 font-medium">Prompt ready! 🚀</div>}
            </div>
          </>
        )}
        <ExternalLink className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Modal-style Dropdown */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-hidden">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-fade-in-up flex flex-col">
              {/* Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center space-x-2 text-base sm:text-lg">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span>{isLiked ? 'Try with AI Model' : 'Choose AI Model'}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {isLiked ? 'Select a model to try this prompt directly' : 'Select a model to explore'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/80 rounded-full transition-all duration-300 hover:scale-110"
                  >
                    <span className="text-xl text-gray-500">×</span>
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 ai-model-scroll" style={{maxHeight: 'calc(85vh - 120px)'}}>
                {aiModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelClick(model)}
                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 transition-all duration-200 flex items-center space-x-3 sm:space-x-4 group border-b border-gray-50 last:border-b-0 ${
                      isLiked ? 'hover:bg-purple-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${model.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0`}>
                      {model.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{model.name}</span>
                        {model.popular && (
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 font-medium">{model.provider}</div>
                      <div className="text-xs text-gray-600 mt-1 leading-relaxed hidden sm:block">{model.description}</div>
                    </div>
                    <ExternalLink className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 flex-shrink-0 ${isLiked ? 'text-purple-500 group-hover:text-purple-700' : 'text-gray-400 group-hover:text-purple-600'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIModelSelector;