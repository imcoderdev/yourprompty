import React, { useState } from 'react';
import { Heart, Copy, Users, Check, ExternalLink } from 'lucide-react';
import AIModelSelector from './AIModelSelector';

interface PromptCardProps {
  prompt: {
    id: number;
    title: string;
    prompt: string;
    result: string;
    category: string;
    creator: {
      name: string;
      avatar: string;
      username: string;
      verified: boolean;
    };
    likes: number;
    uses: number;
  };
  onViewCreator: (creator: any) => void;
  index: number;
  isMobile?: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onViewCreator, index, isMobile = false }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [copyScale, setCopyScale] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.prompt);
    setIsCopied(true);
    setCopyScale(1.2);
    
    // Reset copy animation
    setTimeout(() => {
      setCopyScale(1);
    }, 200);
    
    // Reset copied state
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleModelSelect = (model: any) => {
    setSelectedModel(model.id);
  };

  // Dynamic height for Pinterest-style layout
  const heights = [320, 400, 360, 440, 380, 420];
  const imageHeight = isMobile ? 200 + (index % 3) * 50 : heights[index % heights.length];
  
  if (isMobile) {
    return (
      <div
        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden group cursor-pointer transform hover:scale-[1.02] mb-2 animate-fade-in-up"
        style={{animationDelay: `${index * 0.05}s`}}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-t-2xl">
          <img
            src={prompt.result}
            alt={prompt.title}
            className={`w-full object-cover transition-all duration-700 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ height: `${imageHeight}px` }}
            onLoad={() => setImageLoaded(true)}
          />
          
          {!imageLoaded && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"
              style={{ height: `${imageHeight}px` }}
            ></div>
          )}
          
          {/* Category badge on image */}
          <div className="absolute top-2 left-2">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
              {prompt.category}
            </span>
          </div>
          
          {isCopied && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
              Copied!
            </div>
          )}
        </div>
        
        {/* Content below image */}
        <div className="p-3">
          {/* Creator info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <img
                src={prompt.creator.avatar}
                alt={prompt.creator.name}
                className="w-6 h-6 rounded-full object-cover"
                onClick={() => onViewCreator(prompt.creator)}
              />
              <span className="text-gray-700 text-sm font-medium">{prompt.creator.username}</span>
              {prompt.creator.verified && (
                <span className="text-blue-500 text-sm">✓</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLike}
                className={`p-1.5 rounded-full transition-all duration-300 ${
                  isLiked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{prompt.title}</h3>

          {/* Prompt text with copy button */}
          <div className="relative bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-700 line-clamp-3 pr-8 break-words">
              <span className="font-medium text-purple-600">Prompt:</span> {prompt.prompt}
            </p>
            <button
              onClick={handleCopy}
              className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-300 ${
                isCopied
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600 shadow-sm'
              }`}
              style={{ transform: `scale(${copyScale})` }}
            >
              {isCopied ? (
                <Check className="w-3 h-3 animate-bounce" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          
          {/* AI Model Selector */}
          <div className="mb-3">
            <AIModelSelector 
              onModelSelect={handleModelSelect}
              selectedModel={selectedModel}
              prompt={prompt.prompt}
              isLiked={isLiked}
            />
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{prompt.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Copy className="w-3 h-3" />
                <span>{prompt.uses.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-700 overflow-hidden group cursor-pointer transform hover:scale-[1.03] mb-6 break-inside-avoid animate-fade-in-up"
      style={{animationDelay: `${index * 0.1}s`}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-t-3xl">
        {/* Main Image */}
        <img
          src={prompt.result}
          alt={prompt.title}
          className={`w-full object-cover transition-all duration-1000 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ height: `${imageHeight}px` }}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"
            style={{ height: `${imageHeight}px` }}
          ></div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        
        <div className="absolute top-4 left-4 transform transition-all duration-300 group-hover:scale-110">
          <span className="bg-white/95 backdrop-blur-md text-xs font-bold px-4 py-2 rounded-full text-gray-800 shadow-lg border border-white/20">
            {prompt.category}
          </span>
        </div>

        <div className={`absolute top-4 right-4 transform transition-all duration-500 ${isHovered ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-2'}`}>
          <button
            onClick={handleLike}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 ${
              isLiked 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-white/95 text-gray-600 hover:bg-white hover:text-red-500 shadow-lg'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current animate-bounce' : ''}`} />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex items-center space-x-4 mb-5">
          <img
            src={prompt.creator.avatar}
            alt={prompt.creator.name}
            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-3 hover:ring-purple-500 transition-all duration-300 hover:scale-110"
            onClick={() => onViewCreator(prompt.creator)}
          />
          <div className="flex-1">
            <p 
              className="font-bold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer text-base"
              onClick={() => onViewCreator(prompt.creator)}
            >
              {prompt.creator.name}
              {prompt.creator.verified && (
                <span className="ml-2 text-blue-500 text-lg">✓</span>
              )}
            </p>
            <p className="text-sm text-gray-500 font-medium">{prompt.creator.username}</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">{prompt.title}</h3>
        
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-5 mb-5 relative border border-gray-100 hover:border-purple-200 transition-all duration-300">
          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed font-medium">
            <strong className="text-purple-600">Prompt:</strong> {prompt.prompt}
          </p>
          <button
            onClick={handleCopy}
            className={`absolute top-3 right-3 p-2.5 rounded-xl transition-all duration-300 ${
              isCopied
                ? 'bg-green-500 text-white shadow-lg scale-110'
                : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600 shadow-md border border-gray-200'
            }`} 
            style={{ 
              transform: `scale(${copyScale})` 
            }}
          >
            {isCopied ? (
              <Check className="w-4 h-4 animate-bounce" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {isCopied && (
            <div className="absolute -top-8 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded animate-bounce">
              Copied!
            </div>
          )}
        </div>

        {/* AI Model Selector */}
        <div className="mb-5">
          <AIModelSelector 
            onModelSelect={handleModelSelect}
            selectedModel={selectedModel}
            prompt={prompt.prompt}
            isLiked={isLiked}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 font-medium">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 hover:text-red-500 transition-colors cursor-pointer">
              <Heart className="w-4 h-4 hover:scale-110 transition-transform" />
              <span>{prompt.likes.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 hover:text-blue-500 transition-colors cursor-pointer">
              <Users className="w-4 h-4 hover:scale-110 transition-transform" />
              <span>{prompt.uses.toLocaleString()} uses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;