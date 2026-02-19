import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, Copy, Instagram, Twitter, Linkedin, Github, Youtube, Globe, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { getPublicProfileByEmail, toggleFollow, isFollowing as checkIsFollowing } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';

interface PublicProfilePageProps {
  email: string;
  onBack: () => void;
}

const PublicProfilePage: React.FC<PublicProfilePageProps> = ({ email, onBack }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    user: { 
      id: string;
      name: string; 
      userId?: string;
      profilePhoto?: string;
      tagline?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      github?: string;
      youtube?: string;
      tiktok?: string;
      website?: string;
    };
    stats: { followers: number; following: number; totalLikes: number; promptsCount: number };
    prompts: Array<{ id: number; title: string; content: string; category: string; imageUrl: string | null; likeCount: number; commentCount: number; createdAt: string }>;
  } | null>(null);
  const [isFollowingState, setIsFollowingState] = useState<boolean>(false);
  const [isSelf, setIsSelf] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Self-check using auth context
        setIsSelf(!!user && user.email === email);

        // Fetch profile from Supabase
        const { data, error: profileError } = await getPublicProfileByEmail(email);
        
        if (profileError || !data) {
          throw new Error(profileError?.message || 'Failed to load profile');
        }

        const p = data.profile;
        setProfile({
          user: {
            id: p.id,
            name: p.name,
            userId: p.user_id,
            profilePhoto: p.profile_photo,
            tagline: p.tagline,
            instagram: p.instagram,
            twitter: p.twitter,
            linkedin: p.linkedin,
            github: p.github,
            youtube: p.youtube,
            tiktok: p.tiktok,
            website: p.website
          },
          stats: data.stats,
          prompts: (data.prompts || []).map((pr: any) => ({
            id: pr.id,
            title: pr.title,
            content: pr.content,
            category: pr.category || 'General',
            imageUrl: pr.image_url || null,
            likeCount: pr.like_count || 0,
            commentCount: pr.comment_count || 0,
            createdAt: pr.created_at
          }))
        });

        // Check if current user is following this profile
        if (user && p.id !== user.id) {
          const following = await checkIsFollowing(p.id);
          setIsFollowingState(following);
        }
      } catch (err: any) {
        setError(err?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [email, user]);

  const handleFollowToggle = async () => {
    if (!user) {
      setError('Please sign in to follow users');
      return;
    }
    if (!profile?.user?.id) return;
    
    try {
      setError(null);
      const { following, error: followError } = await toggleFollow(profile.user.id);
      
      if (followError) {
        throw new Error(followError?.message || 'Action failed');
      }
      
      setIsFollowingState(following);
      // Optimistically update counters
      setProfile((prev) => prev ? ({
        ...prev,
        stats: { 
          ...prev.stats, 
          followers: prev.stats.followers + (isFollowingState ? -1 : 1) 
        }
      }) : prev);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    }
  };

  const handleCopyPrompt = async (promptId: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(promptId);
      toast.success('✨ Prompt copied to clipboard!', {
        position: "bottom-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy prompt', {
        position: "bottom-center",
        autoClose: 2000,
      });
    }
  };

  const avatarUrl = useMemo(() => {
    const p = profile?.user;
    if (p?.profilePhoto) {
      const url = String(p.profilePhoto);
      return url.startsWith('http') ? url : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p?.name || 'U')}`;
    }
    const name = p?.name || 'U';
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  }, [profile?.user?.name, profile?.user?.profilePhoto]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile not found</h2>
          <div className="text-red-600 font-semibold mb-6">{error || 'This profile doesn\'t exist'}</div>
          <button onClick={onBack} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack} 
            className="p-3 rounded-full hover:bg-white/60 backdrop-blur-sm transition-all hover:scale-110 group"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 group-hover:text-purple-600 transition-colors" />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Creator Profile
          </h1>
          <div className="w-11" />
        </div>

        {/* Profile Hero Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-purple-100 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-30 -z-0"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-20 -z-0"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
            {/* Avatar with gradient border */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-full blur-lg group-hover:blur-xl transition-all animate-pulse"></div>
              <img 
                src={avatarUrl} 
                alt={profile.user.name} 
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-2xl"
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  {profile.user.name}
                </h2>
                {profile.user.userId && (
                  <p className="text-gray-600 text-lg mb-3">@{profile.user.userId}</p>
                )}
                
                {profile.user.tagline && (
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 mb-4 border border-purple-200">
                    <p className="text-gray-800 text-lg font-medium italic">"{profile.user.tagline}"</p>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg hover:scale-105 transition-transform cursor-default">
                  <div className="text-3xl font-bold">{profile.stats.promptsCount}</div>
                  <div className="text-purple-100 text-sm font-medium">Prompts</div>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg hover:scale-105 transition-transform cursor-default">
                  <div className="text-3xl font-bold">{profile.stats.followers}</div>
                  <div className="text-pink-100 text-sm font-medium">Followers</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg hover:scale-105 transition-transform cursor-default">
                  <div className="text-3xl font-bold">{profile.stats.following}</div>
                  <div className="text-blue-100 text-sm font-medium">Following</div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg hover:scale-105 transition-transform cursor-default">
                  <div className="text-3xl font-bold">{profile.stats.totalLikes}</div>
                  <div className="text-red-100 text-sm font-medium">Total Likes</div>
                </div>
              </div>

              {/* Social Media Links */}
              {(profile.user.instagram || profile.user.twitter || profile.user.linkedin || profile.user.github || profile.user.youtube || profile.user.website) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="text-lg">🔗</span> Connect With Me
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.user.instagram && (
                      <a
                        href={profile.user.instagram.startsWith('http') ? profile.user.instagram : `https://instagram.com/${profile.user.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-white rounded-2xl hover:scale-110 hover:rotate-3 transition-all shadow-lg hover:shadow-2xl"
                        title="Instagram"
                      >
                        <Instagram className="w-6 h-6" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Instagram
                        </span>
                      </a>
                    )}
                    {profile.user.twitter && (
                      <a
                        href={profile.user.twitter.startsWith('http') ? profile.user.twitter : `https://twitter.com/${profile.user.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative p-4 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl hover:scale-110 hover:rotate-3 transition-all shadow-lg hover:shadow-2xl"
                        title="Twitter"
                      >
                        <Twitter className="w-6 h-6" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Twitter
                        </span>
                      </a>
                    )}
                    {profile.user.linkedin && (
                      <a
                        href={profile.user.linkedin.startsWith('http') ? profile.user.linkedin : `https://linkedin.com/in/${profile.user.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative p-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl hover:scale-110 hover:rotate-3 transition-all shadow-lg hover:shadow-2xl"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-6 h-6" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          LinkedIn
                        </span>
                      </a>
                    )}
                    {profile.user.github && (
                      <a
                        href={profile.user.github.startsWith('http') ? profile.user.github : `https://github.com/${profile.user.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative p-4 bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-2xl hover:scale-110 hover:rotate-3 transition-all shadow-lg hover:shadow-2xl"
                        title="GitHub"
                      >
                        <Github className="w-6 h-6" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          GitHub
                        </span>
                      </a>
                    )}
                    {profile.user.youtube && (
                      <a
                        href={profile.user.youtube.startsWith('http') ? profile.user.youtube : `https://youtube.com/@${profile.user.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative p-4 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl hover:scale-110 hover:rotate-3 transition-all shadow-lg hover:shadow-2xl"
                        title="YouTube"
                      >
                        <Youtube className="w-6 h-6" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          YouTube
                        </span>
                      </a>
                    )}
                    {profile.user.website && (
                      <a
                        href={profile.user.website.startsWith('http') ? profile.user.website : `https://${profile.user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative p-4 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl hover:scale-110 hover:rotate-3 transition-all shadow-lg hover:shadow-2xl"
                        title="Website"
                      >
                        <Globe className="w-6 h-6" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Website
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Follow Button */}
            {!isSelf && (
              <button 
                onClick={handleFollowToggle} 
                className={`px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
                  isFollowingState 
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {isFollowingState ? '✓ Following' : '+ Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Prompts Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <span>✨</span> Creative Prompts
            </h3>
            <div className="text-gray-500 text-sm font-medium bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              {profile.prompts.length} {profile.prompts.length === 1 ? 'prompt' : 'prompts'}
            </div>
          </div>
          
          {profile.prompts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-16 text-center border border-purple-100">
              <div className="text-7xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No prompts yet</h3>
              <p className="text-gray-600">This creator hasn't shared any prompts yet. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {profile.prompts.map((p) => {
                const img = p.imageUrl
                  ? (String(p.imageUrl).startsWith('http') ? p.imageUrl : null)
                  : null;
                const isCopied = copiedId === p.id;
                return (
                  <div 
                    key={p.id} 
                    className="group bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all border border-purple-100 hover:scale-105 hover:-rotate-1"
                  >
                    {img ? (
                      <div className="relative overflow-hidden">
                        <img 
                          src={img} 
                          alt={p.title} 
                          className="w-full h-48 md:h-56 object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ) : (
                      <div className="w-full h-48 md:h-56 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
                        <span className="text-5xl md:text-6xl">💡</span>
                      </div>
                    )}
                    <div className="p-4 md:p-6">
                      <div className="inline-block px-2.5 md:px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] md:text-xs font-bold rounded-full mb-2 md:mb-3 shadow-sm">
                        {p.category}
                      </div>
                      <h4 className="font-bold text-base md:text-xl mb-2 md:mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-gray-600 text-xs md:text-sm line-clamp-3 mb-3 md:mb-4 leading-relaxed">
                        {p.content}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-red-500 font-medium">
                            <Heart className="w-4 h-4 fill-current" />
                            <span>{p.likeCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                            <span className="text-sm">💬</span>
                            <span>{p.commentCount}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyPrompt(p.id, p.content)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 shadow-md ${
                            isCopied 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                          }`}
                          title="Copy prompt"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span className="text-xs">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span className="text-xs hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfilePage;
