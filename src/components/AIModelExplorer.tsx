import React, { useState } from 'react';
import { Brain, Sparkles, Zap, Bot, Star, ExternalLink, ArrowRight, Crown, Flame, Cpu, Globe } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  color: string;
  category: string;
  rating: number;
  users: string;
  features: string[];
  pricing: string;
  popular?: boolean;
  new?: boolean;
}

interface AIModelExplorerProps {
  onClose: () => void;
}

const AIModelExplorer: React.FC<AIModelExplorerProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const aiModels: AIModel[] = [
    {
      id: 'claude-sonnet',
      name: 'Claude Sonnet 4',
      provider: 'Anthropic',
      description: 'Most intelligent model for complex reasoning, analysis, and creative tasks',
      icon: <Brain className="w-6 h-6" />,
      url: 'https://claude.ai',
      color: 'from-orange-500 to-red-500',
      category: 'text',
      rating: 4.9,
      users: '10M+',
      features: ['Advanced Reasoning', 'Code Generation', 'Analysis', 'Creative Writing'],
      pricing: '$20/month',
      popular: true
    },
    {
      id: 'nano-banana',
      name: 'Nano Banana',
      provider: 'Banana AI',
      description: 'Ultra-fast lightweight model optimized for speed and efficiency',
      icon: <Zap className="w-6 h-6" />,
      url: 'https://banana.dev',
      color: 'from-yellow-500 to-orange-500',
      category: 'text',
      rating: 4.6,
      users: '2M+',
      features: ['Lightning Fast', 'Cost Effective', 'API First', 'Scalable'],
      pricing: '$0.001/1K tokens',
      new: true
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      description: 'Advanced multimodal AI model with vision and reasoning capabilities',
      icon: <Sparkles className="w-6 h-6" />,
      url: 'https://chat.openai.com',
      color: 'from-green-500 to-emerald-500',
      category: 'multimodal',
      rating: 4.8,
      users: '100M+',
      features: ['Vision', 'Code', 'Math', 'Multimodal'],
      pricing: '$20/month',
      popular: true
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      description: 'Google\'s most capable AI model with advanced reasoning',
      icon: <Star className="w-6 h-6" />,
      url: 'https://gemini.google.com',
      color: 'from-blue-500 to-purple-500',
      category: 'multimodal',
      rating: 4.7,
      users: '50M+',
      features: ['Multimodal', 'Long Context', 'Code', 'Research'],
      pricing: 'Free + Pro',
      popular: true
    },
    {
      id: 'llama-3-1',
      name: 'Llama 3.1 405B',
      provider: 'Meta',
      description: 'Open-source large language model with exceptional performance',
      icon: <Bot className="w-6 h-6" />,
      url: 'https://llama.meta.com',
      color: 'from-purple-500 to-pink-500',
      category: 'text',
      rating: 4.5,
      users: '15M+',
      features: ['Open Source', 'Self-Hosted', 'Commercial Use', 'Fine-tuning'],
      pricing: 'Free'
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      provider: 'Midjourney Inc',
      description: 'Leading AI image generation with artistic and photorealistic styles',
      icon: <Crown className="w-6 h-6" />,
      url: 'https://midjourney.com',
      color: 'from-pink-500 to-rose-500',
      category: 'image',
      rating: 4.9,
      users: '20M+',
      features: ['Artistic Style', 'High Quality', 'Style Control', 'Community'],
      pricing: '$10/month',
      popular: true
    },
    {
      id: 'dall-e-3',
      name: 'DALL-E 3',
      provider: 'OpenAI',
      description: 'Advanced AI image generator with precise prompt following',
      icon: <Sparkles className="w-6 h-6" />,
      url: 'https://openai.com/dall-e-3',
      color: 'from-green-500 to-teal-500',
      category: 'image',
      rating: 4.7,
      users: '30M+',
      features: ['Prompt Accuracy', 'Safety', 'Integration', 'High Resolution'],
      pricing: '$20/month'
    },
    {
      id: 'stable-diffusion',
      name: 'Stable Diffusion XL',
      provider: 'Stability AI',
      description: 'Open-source image generation model with customization options',
      icon: <Flame className="w-6 h-6" />,
      url: 'https://stability.ai',
      color: 'from-red-500 to-orange-500',
      category: 'image',
      rating: 4.4,
      users: '25M+',
      features: ['Open Source', 'Customizable', 'Local Install', 'Fine-tuning'],
      pricing: 'Free + Cloud'
    },
    {
      id: 'cohere-command',
      name: 'Command R+',
      provider: 'Cohere',
      description: 'Enterprise-grade AI with advanced reasoning and generation',
      icon: <Cpu className="w-6 h-6" />,
      url: 'https://cohere.com',
      color: 'from-indigo-500 to-blue-500',
      category: 'text',
      rating: 4.6,
      users: '5M+',
      features: ['Enterprise', 'RAG', 'Multilingual', 'Tool Use'],
      pricing: 'Custom'
    },
    {
      id: 'perplexity-pro',
      name: 'Perplexity Pro',
      provider: 'Perplexity',
      description: 'AI-powered search and reasoning with real-time information',
      icon: <Globe className="w-6 h-6" />,
      url: 'https://perplexity.ai',
      color: 'from-teal-500 to-cyan-500',
      category: 'search',
      rating: 4.8,
      users: '10M+',
      features: ['Real-time Search', 'Citations', 'Research', 'Pro Models'],
      pricing: '$20/month'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Models', icon: '🤖' },
    { id: 'text', name: 'Text & Code', icon: '📝' },
    { id: 'image', name: 'Image Generation', icon: '🎨' },
    { id: 'multimodal', name: 'Multimodal', icon: '🔄' },
    { id: 'search', name: 'Search & Research', icon: '🔍' }
  ];

  const filteredModels = aiModels.filter(model => {
    const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleModelClick = (model: AIModel) => {
    window.open(model.url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-none md:rounded-3xl shadow-2xl w-full max-w-6xl h-screen md:h-[90vh] overflow-hidden animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 md:p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 flex items-center space-x-2 md:space-x-3">
                <Bot className="w-6 h-6 md:w-8 md:h-8 animate-bounce flex-shrink-0" />
                <span className="truncate">AI Model Explorer</span>
              </h2>
              <p className="text-white/80 text-xs md:text-base hidden md:block">Discover and explore the best AI models for your projects</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 md:p-3 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ml-2"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-80 bg-gray-50 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 overflow-y-auto">
            {/* Search */}
            <div className="mb-4 md:mb-6">
              <input
                type="text"
                placeholder="Search AI models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-sm md:text-base"
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Categories</h3>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 md:space-x-3 text-sm md:text-base ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <span className="text-base md:text-lg">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {filteredModels.map((model, index) => (
                <div
                  key={model.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer transform hover:scale-[1.02] animate-fade-in-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                  onClick={() => handleModelClick(model)}
                >
                  {/* Model Header */}
                  <div className={`bg-gradient-to-r ${model.color} p-4 md:p-6 text-white relative`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          {model.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1 md:mb-2 flex-wrap">
                            <h3 className="text-lg md:text-2xl font-bold truncate">{model.name}</h3>
                            {model.popular && (
                              <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                                🔥 Popular
                              </span>
                            )}
                            {model.new && (
                              <span className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-bold">
                                ✨ New
                              </span>
                            )}
                          </div>
                          <p className="text-white/80 font-medium text-sm md:text-base truncate">{model.provider}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Model Content */}
                  <div className="p-4 md:p-6">
                    <p className="text-gray-600 mb-3 md:mb-4 leading-relaxed text-sm md:text-base">{model.description}</p>
                    
                    {/* Stats */}
                    <div className="flex items-center space-x-3 md:space-x-6 mb-3 md:mb-4 flex-wrap gap-y-2">
                      <div className="flex items-center space-x-1">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(model.rating) ? 'fill-current' : ''}`} />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{model.rating}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">{model.users}</span> users
                      </div>
                      <div className="text-sm font-medium text-purple-600">
                        {model.pricing}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                      {model.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Try Button */}
                    <button className="w-full py-2.5 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 text-sm md:text-base">
                      <span>Try {model.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredModels.length === 0 && (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No models found</h3>
                <p className="text-gray-600">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModelExplorer;