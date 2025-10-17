import React from 'react';
import { Sparkles, Users, Copy, ArrowRight, Star, Zap, Bot } from 'lucide-react';

interface HeroProps {
  onCreateProfile: () => void;
  onShowAIExplorer: () => void;
}

const Hero: React.FC<HeroProps> = ({ onCreateProfile, onShowAIExplorer }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className={`relative overflow-hidden ${isMobile ? 'py-12 px-4' : 'py-24 px-4'}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-300/20 via-transparent to-transparent animate-pulse-slow"></div>
      
      {/* Floating Elements */}
      {!isMobile && (
        <>
          <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        </>
      )}
      
      <div className="relative max-w-5xl mx-auto text-center">
        <div className={`inline-flex items-center space-x-2 bg-white/60 backdrop-blur-md rounded-full ${isMobile ? 'px-4 py-2 mb-8' : 'px-6 py-3 mb-12'} animate-bounce-slow border border-white/20 shadow-lg`}>
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700`}>✨ Discover Amazing AI Prompts</span>
          <Star className="w-4 h-4 text-yellow-500 animate-spin-slow" />
        </div>
        
        <h1 className={`${isMobile ? 'text-4xl' : 'text-6xl sm:text-7xl lg:text-8xl'} font-bold text-gray-900 ${isMobile ? 'mb-6' : 'mb-8'} animate-fade-in-up leading-tight`}>
          Create, Share, and
          <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
            Inspire Together
          </span>
        </h1>
        
        <p className={`${isMobile ? 'text-lg mb-10' : 'text-2xl mb-16'} text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up`} style={{animationDelay: '0.3s'}}>
          Join thousands of creators sharing their best AI prompts. Find inspiration, 
          copy what works, and build your creative community.
        </p>
        
        <div className={`flex flex-col ${isMobile ? 'space-y-4' : 'sm:flex-row'} items-center justify-center ${isMobile ? '' : 'space-y-6 sm:space-y-0 sm:space-x-8'} animate-fade-in-up`} style={{animationDelay: '0.6s'}}>
          <button 
            onClick={onCreateProfile}
            className={`group ${isMobile ? 'px-8 py-4 text-base w-full max-w-xs' : 'px-10 py-5 text-lg'} bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white rounded-full font-bold hover:shadow-2xl hover:scale-110 transition-all duration-500 flex items-center justify-center space-x-3 glow animate-pulse-glow`}
          >
            <span>Start Creating</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          </button>
          
          <button 
            onClick={onShowAIExplorer}
            className={`${isMobile ? 'px-8 py-4 text-base w-full max-w-xs' : 'px-10 py-5 text-lg'} border-2 border-gray-300 text-gray-700 rounded-full font-bold hover:bg-white hover:border-purple-300 hover:text-purple-600 hover:scale-110 hover:shadow-xl transition-all duration-500 flex items-center justify-center space-x-3 backdrop-blur-sm bg-white/50`}>
            <span>Explore AI Models</span>
            <Bot className="w-5 h-5" />
          </button>
        </div>
        
        <div className={`flex items-center justify-center ${isMobile ? 'space-x-6 mt-12 text-sm' : 'space-x-12 mt-20 text-base'} text-gray-600 animate-fade-in-up`} style={{animationDelay: '0.9s'}}>
          <div className="flex items-center space-x-3 hover:scale-110 transition-transform duration-300 cursor-pointer">
            <Users className="w-4 h-4" />
            <span className={`font-semibold ${isMobile ? 'text-xs' : ''}`}>10K+ Creators</span>
          </div>
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <div className="flex items-center space-x-3 hover:scale-110 transition-transform duration-300 cursor-pointer">
            <Copy className="w-4 h-4" />
            <span className={`font-semibold ${isMobile ? 'text-xs' : ''}`}>50K+ Prompts</span>
          </div>
          {!isMobile && (
            <>
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="flex items-center space-x-3 hover:scale-110 transition-transform duration-300 cursor-pointer">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">1M+ Uses</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;