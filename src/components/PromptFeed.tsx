import React, { useState } from 'react';
import PromptCard from './PromptCard';
import CategoryFilter from './CategoryFilter';

interface PromptFeedProps {
  onViewCreator: (creator: any) => void;
}

const PromptFeed: React.FC<PromptFeedProps> = ({ onViewCreator }) => {
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

  const prompts = [
    {
      id: 1,
      title: "Golden Hour Mountain Vista",
      prompt: "A breathtaking mountain landscape at golden hour, misty clouds rolling over snow-capped peaks, warm amber lighting casting long shadows, cinematic photography style, ultra detailed, 8k resolution, professional nature photography",
      result: "https://images.pexels.com/photos/1254736/pexels-photo-1254736.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Photography",
      creator: {
        name: "Sarah Chen",
        avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100",
        username: "@sarahcreates",
        verified: true
      },
      likes: 1420,
      uses: 3200
    },
    {
      id: 2,
      title: "Neon Cyberpunk Cityscape",
      prompt: "Futuristic cyberpunk city skyline at night, vibrant neon lights reflecting on rain-soaked streets, flying cars zooming between towering skyscrapers with holographic advertisements, detailed futuristic architecture, moody atmospheric lighting",
      result: "https://images.pexels.com/photos/2159065/pexels-photo-2159065.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Digital Art",
      creator: {
        name: "Marcus Rivera",
        avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100",
        username: "@marcusart",
        verified: true
      },
      likes: 2340,
      uses: 4100
    },
    {
      id: 3,
      title: "Clean Product Photography",
      prompt: "Professional product photography on clean white background, soft studio lighting creating subtle shadows, minimalist composition with high contrast, commercial advertising style, sharp focus, premium quality",
      result: "https://images.pexels.com/photos/341523/pexels-photo-341523.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Product Review",
      creator: {
        name: "Elena Bright",
        avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100",
        username: "@elenaphoto",
        verified: false
      },
      likes: 890,
      uses: 2300
    },
    {
      id: 4,
      title: "Mystical Warrior Princess",
      prompt: "Beautiful fantasy warrior princess with flowing auburn hair, wearing ornate silver armor with intricate Celtic designs, standing in an enchanted forest with ethereal lighting filtering through ancient trees, digital painting style, highly detailed",
      result: "https://images.pexels.com/photos/1172207/pexels-photo-1172207.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Character",
      creator: {
        name: "Alex Thompson",
        avatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=100",
        username: "@alexdraws",
        verified: true
      },
      likes: 1670,
      uses: 3800
    },
    {
      id: 5,
      title: "Liquid Metal Dreams",
      prompt: "Abstract flowing liquid metal textures with iridescent rainbow colors, smooth organic shapes blending together, futuristic digital art style with smooth gradients and metallic reflections, high resolution, mesmerizing composition",
      result: "https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Abstract",
      creator: {
        name: "Maya Singh",
        avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100",
        username: "@mayaabstract",
        verified: true
      },
      likes: 1890,
      uses: 4200
    },
    {
      id: 6,
      title: "Scandinavian Living Room",
      prompt: "Cozy Scandinavian living room with natural lighting streaming through large windows, light wooden furniture, comfortable neutral textiles, green plants, minimalist decor, warm earth tones, hygge atmosphere, interior design photography",
      result: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Architecture",
      creator: {
        name: "David Park",
        avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100",
        username: "@davidinteriors",
        verified: false
      },
      likes: 1340,
      uses: 2800
    },
    {
      id: 7,
      title: "Casual Street Style",
      prompt: "Relaxed street style photography, young person walking down a sunny city street, casual outfit with denim jacket and sneakers, natural candid pose, urban background with colorful murals, golden hour lighting, lifestyle photography",
      result: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Casual",
      creator: {
        name: "Jamie Wilson",
        avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100",
        username: "@jamiestreet",
        verified: false
      },
      likes: 980,
      uses: 2100
    },
    {
      id: 8,
      title: "Gourmet Food Styling",
      prompt: "Professional food photography of a gourmet burger with fresh ingredients, artisanal bun, melted cheese, crispy bacon, on rustic wooden table, natural lighting, shallow depth of field, restaurant quality presentation, food styling",
      result: "https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Food",
      creator: {
        name: "Chef Maria",
        avatar: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100",
        username: "@chefmaria",
        verified: true
      },
      likes: 2150,
      uses: 3800
    },
    {
      id: 9,
      title: "Fashion Editorial Look",
      prompt: "High fashion editorial photography, model wearing elegant designer dress, dramatic lighting with strong shadows, minimalist studio background, professional fashion photography, haute couture styling, artistic composition",
      result: "https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Fashion",
      creator: {
        name: "Isabella Rose",
        avatar: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100",
        username: "@isabellarose",
        verified: false
      },
      likes: 1340,
      uses: 2800
    }
  ];

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

        {/* Mobile Pinterest-style Grid */}
        <div className={`mt-16 ${
          isMobile 
            ? 'grid grid-cols-2 gap-2 px-2' 
            : 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6'
        }`}>
          {prompts.map((prompt, index) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onViewCreator={onViewCreator}
              index={index}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromptFeed;