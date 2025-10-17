import React, { useState } from 'react';
import { ArrowLeft, User, Mail, MapPin, Calendar, Link, Settings, Upload, Heart, Copy, CreditCard as Edit3, Camera, Sparkles, Crown, Star } from 'lucide-react';

interface UserProfileProps {
  user: any;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john@example.com',
    bio: user?.bio || 'AI enthusiast and creative prompt designer. Love exploring the boundaries of artificial intelligence.',
    location: user?.location || 'San Francisco, CA',
    website: user?.website || 'johndoe.com',
    avatar: user?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200'
  });

  const [userStats] = useState({
    prompts: 24,
    followers: 1250,
    following: 340,
    totalLikes: 5600,
    totalUses: 12400,
    joinDate: 'March 2024'
  });

  const [userPrompts] = useState([
    {
      id: 1,
      title: "Cyberpunk Neon City",
      prompt: "Futuristic cyberpunk cityscape at night with neon lights, flying cars, and holographic advertisements",
      result: "https://images.pexels.com/photos/2159065/pexels-photo-2159065.jpeg?auto=compress&cs=tinysrgb&w=400",
      likes: 892,
      uses: 2100,
      category: "Digital Art"
    },
    {
      id: 2,
      title: "Mystical Forest",
      prompt: "Enchanted forest with glowing mushrooms, fairy lights, and magical creatures in ethereal lighting",
      result: "https://images.pexels.com/photos/1438248/pexels-photo-1438248.jpeg?auto=compress&cs=tinysrgb&w=400",
      likes: 654,
      uses: 1800,
      category: "Fantasy"
    },
    {
      id: 3,
      title: "Modern Architecture",
      prompt: "Minimalist concrete building with large glass windows and geometric shapes in natural lighting",
      result: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400",
      likes: 1203,
      uses: 3200,
      category: "Architecture"
    }
  ]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Saving profile:', profileData);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600">You need to be logged in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <button
            onClick={onBack}
            className="p-3 hover:bg-white/80 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-3 hover:bg-white/80 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm"
          >
            {isEditing ? <Settings className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          {/* Cover */}
          <div className="h-40 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 relative">
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Profile Content */}
          <div className="relative px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-20 mb-6">
              <div className="relative inline-block">
                <img
                  src={profileData.avatar}
                  alt={profileData.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                />
                {isEditing && (
                  <label className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {user.verified && (
                <div className="absolute bottom-2 left-24 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
                      />
                    </div>
                    <button
                      onClick={handleSave}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{profileData.name}</h2>
                      <p className="text-gray-600 text-lg leading-relaxed">{profileData.bio}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Mail className="w-5 h-5" />
                        <span>{profileData.email}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <MapPin className="w-5 h-5" />
                        <span>{profileData.location}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <span>Joined {userStats.joinDate}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Link className="w-5 h-5" />
                        <span className="text-purple-600 hover:underline cursor-pointer">{profileData.website}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <Crown className="w-6 h-6 text-purple-600" />
                  <span>Your Stats</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{userStats.prompts}</div>
                    <div className="text-sm text-gray-500">Prompts</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-pink-600">{userStats.followers.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{userStats.following}</div>
                    <div className="text-sm text-gray-500">Following</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{userStats.totalLikes.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Total Likes</div>
                  </div>
                </div>
                <div className="mt-4 text-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                  <div className="text-2xl font-bold text-purple-700">{userStats.totalUses.toLocaleString()}</div>
                  <div className="text-sm text-purple-600 font-medium">Total Uses</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Prompts */}
        <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span>My Prompts</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer hover:scale-105"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={prompt.result}
                    alt={prompt.title}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-gray-800">
                      {prompt.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{prompt.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {prompt.prompt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{prompt.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Copy className="w-3 h-3" />
                        <span>{prompt.uses}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;