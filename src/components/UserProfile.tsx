import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Settings, Heart, Copy, CreditCard as Edit3, Camera, Sparkles, Crown, Plus, Instagram, Twitter, Linkedin, Github, Youtube, Globe, Music } from 'lucide-react';

interface UserProfileProps {
  user: any;
  onBack: () => void;
  onShowUpload?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack, onShowUpload }) => {
  const baseUrl = 'http://localhost:4000';
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>({
    name: user?.name || '',
    email: user?.email || '',
    userId: user?.userId || '',
    avatar: user?.avatar || '',
    tagline: user?.tagline || '',
    instagram: user?.instagram || '',
    twitter: user?.twitter || '',
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    youtube: user?.youtube || '',
    tiktok: user?.tiktok || '',
    website: user?.website || ''
  });
  const [stats, setStats] = useState({ prompts: 0, followers: 0, following: 0, totalLikes: 0 });
  const [prompts, setPrompts] = useState<Array<any>>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${baseUrl}/api/users/me/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg?.message || 'Failed to load profile');
        }
        const data = await res.json();
        const avatar = data?.user?.profilePhoto
          ? (String(data.user.profilePhoto).startsWith('/') ? `${baseUrl}${data.user.profilePhoto}` : data.user.profilePhoto)
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data?.user?.name || 'U')}`;
        setProfileData({
          name: data.user.name,
          email: data.user.email,
          userId: data.user.userId,
          avatar,
          tagline: data.user.tagline || '',
          instagram: data.user.instagram || '',
          twitter: data.user.twitter || '',
          linkedin: data.user.linkedin || '',
          github: data.user.github || '',
          youtube: data.user.youtube || '',
          tiktok: data.user.tiktok || '',
          website: data.user.website || ''
        });
        setStats({
          prompts: data.stats.promptsCount,
          followers: data.stats.followers,
          following: data.stats.following,
          totalLikes: data.stats.totalLikes
        });
        const mapped = (data.prompts || []).map((p: any) => {
          const img = p.imageUrl
            ? (String(p.imageUrl).startsWith('http') ? p.imageUrl : `${baseUrl}${p.imageUrl}`)
            : `https://picsum.photos/seed/${p.id}/600/400`;
          return {
            id: p.id,
            title: p.title,
            prompt: p.content,
            result: img,
            likes: p.likeCount,
            uses: p.commentCount,
            category: p.category
          };
        });
        setPrompts(mapped);
      } catch (e: any) {
        setError(e?.message || 'Something went wrong');
      }
    };
    load();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setError(null);
    setSaving(true);
    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const form = new FormData();
        if (profileData.userId) form.append('userId', profileData.userId);
        if (profileData.tagline) form.append('tagline', profileData.tagline);
        if (profileData.instagram) form.append('instagram', profileData.instagram);
        if (profileData.twitter) form.append('twitter', profileData.twitter);
        if (profileData.linkedin) form.append('linkedin', profileData.linkedin);
        if (profileData.github) form.append('github', profileData.github);
        if (profileData.youtube) form.append('youtube', profileData.youtube);
        if (profileData.tiktok) form.append('tiktok', profileData.tiktok);
        if (profileData.website) form.append('website', profileData.website);
        if (newPhoto) form.append('profilePhoto', newPhoto);
        const res = await fetch(`${baseUrl}/api/users/me`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg?.message || 'Failed to update profile');
        }
        const u = await res.json();
        const avatar = u?.profilePhoto
          ? (String(u.profilePhoto).startsWith('/') ? `${baseUrl}${u.profilePhoto}` : u.profilePhoto)
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.name || 'U')}`;
        setProfileData((prev: any) => ({ ...prev, userId: u.userId, avatar }));
        setIsEditing(false);
        setNewPhoto(null);
      } catch (e: any) {
        setError(e?.message || 'Something went wrong');
      } finally {
        setSaving(false);
      }
    };
    run();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfileData((prev: any) => ({ ...prev, avatar: e.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePrompt = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${baseUrl}/api/prompts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.message || 'Failed to delete');
      }
      setPrompts(prev => prev.filter(p => p.id !== id));
      setStats(prev => ({ ...prev, prompts: Math.max(0, (prev.prompts || 1) - 1) }));
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        value={profileData.userId}
                        onChange={(e) => handleInputChange('userId', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline 🎯</label>
                      <input
                        type="text"
                        value={profileData.tagline}
                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                        placeholder="AI Artist | Creative Director | Prompt Engineer"
                        maxLength={200}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
                      />
                      <p className="text-xs text-gray-500 mt-1">{profileData.tagline?.length || 0}/200</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
                        disabled
                      />
                    </div>
                    
                    {/* Social Media Section */}
                    <div className="pt-4 border-t-2 border-gray-100">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <span>Social Media Links</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Instagram className="w-5 h-5 text-pink-600 flex-shrink-0" />
                          <input
                            type="text"
                            value={profileData.instagram}
                            onChange={(e) => handleInputChange('instagram', e.target.value)}
                            placeholder="instagram.com/yourhandle"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Twitter className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <input
                            type="text"
                            value={profileData.twitter}
                            onChange={(e) => handleInputChange('twitter', e.target.value)}
                            placeholder="twitter.com/yourhandle"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Linkedin className="w-5 h-5 text-blue-700 flex-shrink-0" />
                          <input
                            type="text"
                            value={profileData.linkedin}
                            onChange={(e) => handleInputChange('linkedin', e.target.value)}
                            placeholder="linkedin.com/in/yourprofile"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-700 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Github className="w-5 h-5 text-gray-800 flex-shrink-0" />
                          <input
                            type="text"
                            value={profileData.github}
                            onChange={(e) => handleInputChange('github', e.target.value)}
                            placeholder="github.com/yourhandle"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-gray-600 focus:ring-2 focus:ring-gray-100 transition-all text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Youtube className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <input
                            type="text"
                            value={profileData.youtube}
                            onChange={(e) => handleInputChange('youtube', e.target.value)}
                            placeholder="youtube.com/@yourchannel"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Music className="w-5 h-5 text-gray-900 flex-shrink-0" />
                          <input
                            type="text"
                            value={profileData.tiktok}
                            onChange={(e) => handleInputChange('tiktok', e.target.value)}
                            placeholder="tiktok.com/@yourhandle"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-all text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Globe className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          <input
                            type="text"
                            value={profileData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="yourwebsite.com"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{profileData.name}</h2>
                      <p className="text-gray-600 text-lg leading-relaxed mb-1">@{profileData.userId}</p>
                      {profileData.tagline && (
                        <p className="text-purple-600 font-medium text-base mb-3">
                          ✨ {profileData.tagline}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Mail className="w-5 h-5" />
                        <span>{profileData.email}</span>
                      </div>
                      
                      {/* Social Media Display */}
                      {(profileData.instagram || profileData.twitter || profileData.linkedin || profileData.github || profileData.youtube || profileData.tiktok || profileData.website) && (
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Connect with me:</h4>
                          <div className="flex flex-wrap gap-3">
                            {profileData.instagram && (
                              <a href={profileData.instagram.startsWith('http') ? profileData.instagram : `https://${profileData.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:scale-110 transition-transform shadow-md">
                                <Instagram className="w-5 h-5" />
                              </a>
                            )}
                            {profileData.twitter && (
                              <a href={profileData.twitter.startsWith('http') ? profileData.twitter : `https://${profileData.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-500 text-white rounded-lg hover:scale-110 transition-transform shadow-md">
                                <Twitter className="w-5 h-5" />
                              </a>
                            )}
                            {profileData.linkedin && (
                              <a href={profileData.linkedin.startsWith('http') ? profileData.linkedin : `https://${profileData.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-700 text-white rounded-lg hover:scale-110 transition-transform shadow-md">
                                <Linkedin className="w-5 h-5" />
                              </a>
                            )}
                            {profileData.github && (
                              <a href={profileData.github.startsWith('http') ? profileData.github : `https://${profileData.github}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 text-white rounded-lg hover:scale-110 transition-transform shadow-md">
                                <Github className="w-5 h-5" />
                              </a>
                            )}
                            {profileData.youtube && (
                              <a href={profileData.youtube.startsWith('http') ? profileData.youtube : `https://${profileData.youtube}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-red-600 text-white rounded-lg hover:scale-110 transition-transform shadow-md">
                                <Youtube className="w-5 h-5" />
                              </a>
                            )}
                            {profileData.tiktok && (
                              <a href={profileData.tiktok.startsWith('http') ? profileData.tiktok : `https://${profileData.tiktok}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-900 text-white rounded-lg hover:scale-110 transition-transform shadow-md">
                                <Music className="w-5 h-5" />
                              </a>
                            )}
                            {profileData.website && (
                              <a href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-purple-600 text-white rounded-lg hover:scale-110 transition-transform shadow-md">
                                <Globe className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
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
                    <div className="text-2xl font-bold text-purple-600">{stats.prompts}</div>
                    <div className="text-sm text-gray-500">Prompts</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-pink-600">{stats.followers.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{stats.following}</div>
                    <div className="text-sm text-gray-500">Following</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{stats.totalLikes.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Total Likes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Prompts */}
        <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <span>My Prompts</span>
              <span className="text-lg font-normal text-gray-500">({prompts.length})</span>
            </h2>
            {onShowUpload && (
              <button
                onClick={onShowUpload}
                className="group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Upload Prompt</span>
              </button>
            )}
          </div>
          
          {prompts.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Prompts Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start your creative journey by uploading your first AI prompt! Share your ideas and inspire the community.
              </p>
            </div>
          ) : (
            /* Prompts Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map((prompt) => (
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
                    <button onClick={() => handleDeletePrompt(prompt.id)} className="px-3 py-1 rounded-lg border hover:bg-red-50 text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;