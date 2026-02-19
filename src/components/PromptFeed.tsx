import React, { useState } from 'react';
import PromptCard from './PromptCard';
import CategoryFilter from './CategoryFilter';

interface PromptFeedProps {
  onViewCreator: (creator: any) => void;
  items?: Array<any>;
  highlightPromptId?: number | null;
  onPromptVisible?: () => void;
}

const PromptFeed: React.FC<PromptFeedProps> = ({ onViewCreator, items, highlightPromptId, onPromptVisible }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clear highlight after 3 seconds
  React.useEffect(() => {
    if (highlightPromptId && onPromptVisible) {
      const timer = setTimeout(() => {
        onPromptVisible();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightPromptId, onPromptVisible]);

  // Use only database items
  const prompts = items || [];

  const filtered = React.useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return prompts;
    const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-');
    const sel = norm(selectedCategory);
    return prompts.filter(p => norm(String(p.category || '')) === sel);
  }, [prompts, selectedCategory]);

  // Show loading state if items is null (still fetching)
  if (items === null) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading amazing prompts...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Play with Prompt's
          </h2>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Discover the most popular prompts from our creative community
          </p>
        </div>

        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No prompts yet</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              {selectedCategory === 'all' 
                ? "Be the first to share an amazing prompt with the community! Upload your creative prompts and inspire others."
                : `No prompts found in the "${selectedCategory}" category. Try selecting a different category or be the first to upload one!`
              }
            </p>
          </div>
        ) : (
          <div className={`mt-16 ${
            isMobile 
              ? 'grid grid-cols-2 gap-2 px-2' 
              : 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6'
          }`}>
            {filtered.map((prompt, index) => (
              <div 
                key={prompt.id}
                id={`prompt-${prompt.id}`}
                className={`${highlightPromptId === prompt.id ? 'ring-4 ring-purple-500 ring-opacity-50 rounded-2xl animate-pulse' : ''}`}
              >
                <PromptCard
                  prompt={prompt}
                  onViewCreator={onViewCreator}
                  index={index}
                  isMobile={isMobile}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PromptFeed;