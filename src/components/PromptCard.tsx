import React, { useState } from 'react';
import { Heart, Copy, Users, Check, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
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
      email?: string;
      avatar: string;
      username: string;
      verified: boolean;
    };
    likes: number;
    liked?: boolean;
    uses: number;
  };
  onViewCreator: (creator: any) => void;
  index: number;
  isMobile?: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onViewCreator, index, isMobile = false }) => {
  const [isLiked, setIsLiked] = useState(!!prompt.liked);
  const [likesCount, setLikesCount] = useState<number>(prompt.likes || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copyScale, setCopyScale] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showRipple, setShowRipple] = useState(false);

  // Update like state when prompt prop changes (fixes navigation issue)
  React.useEffect(() => {
    setIsLiked(!!prompt.liked);
    setLikesCount(prompt.likes || 0);
  }, [prompt.liked, prompt.likes]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.prompt);
    setIsCopied(true);
    setShowCelebration(true);
    setShowRipple(true);
    setCopyScale(1.3);
    
    toast.success('Prompt copied to clipboard!', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    
    // Reset copy animation
    setTimeout(() => {
      setCopyScale(1);
    }, 300);
    
    // Reset ripple
    setTimeout(() => {
      setShowRipple(false);
    }, 600);
    
    // Reset copied state and celebration
    setTimeout(() => {
      setIsCopied(false);
      setShowCelebration(false);
    }, 3000);
  };

  const handleLike = async (e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent event bubbling and default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isLiking) return;
    const token = localStorage.getItem('token');
    // Optimistic update
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));

    if (!token) return;
    setIsLiking(true);
    try {
      const res = await fetch(`http://localhost:4000/api/prompts/${prompt.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (typeof data.liked === 'boolean') setIsLiked(data.liked);
      if (typeof data.likeCount === 'number') setLikesCount(data.likeCount);
    } catch {
      // Revert on failure
      setIsLiked((prev) => !prev);
      setLikesCount((c) => c + (next ? -1 : 1));
    } finally {
      setIsLiking(false);
    }
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
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden group cursor-pointer transform hover:scale-[1.02] mb-2 animate-fade-in-up"
        style={{animationDelay: `${index * 0.05}s`}}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-t-xl">
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
            <span className="bg-white/80 backdrop-blur-xl text-gray-800 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md border border-white/30 ring-1 ring-black/5">
              {prompt.category}
            </span>
          </div>
          
          {/* Celebration Animation */}
          {showCelebration && (
            <>
              {/* Confetti Animation */}
              <div className="confetti">
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
                <div className="confetti-piece"></div>
              </div>
            </>
          )}
          
          {isCopied && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-bounce shadow-lg">
              Copied!
            </div>
          )}
        </div>
        
        {/* Content below image */}
        <div className="p-2">
          {/* Creator info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <img
                src={prompt.creator.avatar}
                alt={prompt.creator.name}
                className="w-5 h-5 rounded-full object-cover"
                onClick={() => onViewCreator(prompt.creator)}
              />
              <span className="text-gray-700 text-xs font-medium truncate max-w-[120px]">@{prompt.creator.username}</span>
              {prompt.creator.verified && (
                <span className="text-blue-500 text-xs">✓</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => handleLike(e)}
                onTouchEnd={(e) => handleLike(e)}
                disabled={isLiking}
                className={`p-1.5 rounded-full transition-all duration-300 touch-manipulation ${
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
          <h3 className="text-xs font-semibold text-gray-900 mb-1.5 line-clamp-2">{prompt.title}</h3>

          {/* Prompt text with copy button */}
          <div className="relative bg-gray-50 rounded-lg p-2 mb-2">
            {showRipple && (
              <div className="absolute inset-0 rounded-lg bg-purple-400/30 animate-ping pointer-events-none"></div>
            )}
            <p className="text-[10px] text-gray-700 line-clamp-2 pr-7 break-words">
              <span className="font-medium text-purple-600">Prompt:</span> {prompt.prompt}
            </p>
            <button
              onClick={handleCopy}
              className={`absolute top-1.5 right-1.5 p-1 rounded-lg transition-all duration-300 overflow-hidden ${
                isCopied
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600 shadow-sm'
              }`}
              style={{ transform: `scale(${copyScale})` }}
            >
              {showRipple && (
                <div className="absolute inset-0 bg-purple-400 rounded-lg animate-ping opacity-75"></div>
              )}
              {isCopied ? (
                <Check className="w-3 h-3 animate-bounce relative z-10" />
              ) : (
                <Copy className="w-3 h-3 relative z-10" />
              )}
            </button>
          </div>
          
          {/* AI Model Selector */}
          <div className="mb-2">
            <AIModelSelector 
              onModelSelect={handleModelSelect}
              selectedModel={selectedModel}
              prompt={prompt.prompt}
              isLiked={isLiked}
            />
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-0.5">
                <Heart className={`w-3 h-3 ${isLiked ? 'text-red-500' : ''}`} />
                <span>{likesCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-0.5">
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
          <span className="bg-white/80 backdrop-blur-xl text-xs font-bold px-4 py-2 rounded-full text-gray-800 shadow-lg border border-white/30 ring-1 ring-black/5">
            {prompt.category}
          </span>
        </div>
        
        {/* Celebration Animation */}
        {showCelebration && (
          <>
            {/* Confetti Animation */}
            <div className="confetti">
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
              <div className="confetti-piece"></div>
            </div>
          </>
        )}

        <div className={`absolute top-4 right-4 transform transition-all duration-500 ${isHovered ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-2'}`}>
          <button
            onClick={(e) => handleLike(e)}
            onTouchEnd={(e) => handleLike(e)}
            disabled={isLiking}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 touch-manipulation ${
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
      <div className="p-4 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={prompt.creator.avatar}
            alt={prompt.creator.name}
            className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-3 hover:ring-purple-500 transition-all duration-300 hover:scale-110"
            onClick={() => onViewCreator(prompt.creator)}
          />
          <div className="flex-1">
            <p 
              className="font-bold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer text-sm"
              onClick={() => onViewCreator(prompt.creator)}
            >
              {prompt.creator.name}
              {prompt.creator.verified && (
                <span className="ml-2 text-blue-500 text-base">✓</span>
              )}
            </p>
            <p className="text-xs text-gray-500 font-medium">{prompt.creator.username}</p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{prompt.title}</h3>
        
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-3 mb-3 relative border border-gray-100 hover:border-purple-200 transition-all duration-300">
          {showRipple && (
            <>
              <div className="absolute inset-0 rounded-xl bg-purple-400/30 animate-ping pointer-events-none"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
            </>
          )}
          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed font-medium">
            <strong className="text-purple-600">Prompt:</strong> {prompt.prompt}
          </p>
          <button
            onClick={handleCopy}
            className={`absolute top-3 right-3 p-2.5 rounded-xl transition-all duration-300 overflow-hidden ${
              isCopied
                ? 'bg-green-500/90 backdrop-blur-xl text-white shadow-lg scale-110 border border-green-400/30'
                : 'bg-white/70 backdrop-blur-xl text-gray-600 hover:bg-white/90 hover:text-purple-600 shadow-md border border-white/40 ring-1 ring-black/5'
            }`} 
            style={{ 
              transform: `scale(${copyScale})` 
            }}
          >
            {showRipple && (
              <div className="absolute inset-0 bg-purple-400 rounded-xl animate-ping opacity-75"></div>
            )}
            {isCopied ? (
              <Check className="w-4 h-4 animate-bounce relative z-10" />
            ) : (
              <Copy className="w-4 h-4 relative z-10" />
            )}
          </button>
          {isCopied && (
            <div className="absolute -top-7 right-2 bg-green-500/90 backdrop-blur-xl text-white text-xs px-2 py-1 rounded-lg animate-bounce shadow-lg border border-green-400/40 ring-1 ring-white/20">
              ✨ Copied!
            </div>
          )}
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

        {/* Instagram-style like bar */}
        <div className="flex items-center justify-between text-sm text-gray-600 font-medium">
          <div className="flex items-center space-x-4">
            <button 
              onClick={(e) => handleLike(e)} 
              onTouchEnd={(e) => handleLike(e)}
              disabled={isLiking}
              className={`flex items-center space-x-2 hover:text-red-500 transition-colors cursor-pointer touch-manipulation ${isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`w-4 h-4 hover:scale-110 transition-transform ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount.toLocaleString()}</span>
            </button>
            </div>
            <div className="flex items-center space-x-2 hover:text-blue-500 transition-colors cursor-pointer">
              <Users className="w-4 h-4 hover:scale-110 transition-transform" />
              <span>{prompt.uses.toLocaleString()} uses</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;