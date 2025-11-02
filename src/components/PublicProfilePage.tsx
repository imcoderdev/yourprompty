import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users, Heart, Copy, Calendar, MapPin } from 'lucide-react';

interface PublicProfilePageProps {
  email: string;
  onBack: () => void;
}

const PublicProfilePage: React.FC<PublicProfilePageProps> = ({ email, onBack }) => {
  const baseUrl = 'http://localhost:4000';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    user: { email: string; name: string };
    stats: { followers: number; following: number; totalLikes: number; promptsCount: number };
    prompts: Array<{ id: number; title: string; content: string; category: string; imageUrl: string | null; likeCount: number; commentCount: number; createdAt: string }>;
  } | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isSelf, setIsSelf] = useState<boolean>(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        // Get current user for self-check
        const token = localStorage.getItem('token');
        let currentEmail: string | null = null;
        if (token) {
          try {
            const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (meRes.ok) {
              const me = await meRes.json();
              currentEmail = me?.email || null;
            }
          } catch {}
        }
        setIsSelf(!!currentEmail && currentEmail === email);

        const res = await fetch(`${baseUrl}/api/users/${encodeURIComponent(email)}/profile`);
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg?.message || 'Failed to load profile');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [email]);

  const handleFollowToggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please sign in to follow users');
      return;
    }
    try {
      setError(null);
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${baseUrl}/api/users/${encodeURIComponent(email)}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.message || 'Action failed');
      }
      setIsFollowing(!isFollowing);
      // Optimistically update counters
      setProfile((prev) => prev ? ({
        ...prev,
        stats: { 
          ...prev.stats, 
          followers: prev.stats.followers + (isFollowing ? -1 : 1) 
        }
      }) : prev);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    }
  };

  const avatarUrl = useMemo(() => {
    const p = profile?.user;
    if (p?.profilePhoto) {
      const url = String(p.profilePhoto);
      return url.startsWith('http') ? url : `${baseUrl}${url}`;
    }
    const name = p?.name || 'U';
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  }, [profile?.user?.name, profile?.user?.profilePhoto]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="animate-pulse text-gray-500">Loading profile…</div>
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="text-red-600 font-semibold mb-2">{error || 'Profile not found'}</div>
          <button onClick={onBack} className="px-4 py-2 rounded-lg border">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
          <div />
        </div>

        <div className="bg-white rounded-2xl shadow border p-6 mb-8">
          <div className="flex items-start gap-6">
            <img src={avatarUrl} alt={profile.user.name} className="w-24 h-24 rounded-full border" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{profile.user.name}</h2>
              <div className="text-gray-600 text-sm">{profile.user.email}</div>
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{profile.stats.promptsCount}</div>
                  <div className="text-xs text-gray-500">Prompts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{profile.stats.followers}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{profile.stats.following}</div>
                  <div className="text-xs text-gray-500">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{profile.stats.totalLikes}</div>
                  <div className="text-xs text-gray-500">Total Likes</div>
                </div>
              </div>
            </div>
            {!isSelf && (
              <button onClick={handleFollowToggle} className={`px-4 py-2 rounded-xl ${isFollowing ? 'bg-gray-200 text-gray-900' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'} shadow`}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4">Prompts</h3>
        {profile.prompts.length === 0 ? (
          <div className="text-gray-500">No prompts yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.prompts.map((p) => {
              const img = p.imageUrl
                ? (String(p.imageUrl).startsWith('http') ? p.imageUrl : `${baseUrl}${p.imageUrl}`)
                : null;
              return (
              <div key={p.id} className="bg-white rounded-xl shadow overflow-hidden">
                {img ? (
                  <img src={img} alt={p.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-100" />
                )}
                <div className="p-4">
                  <div className="text-sm text-purple-600 font-medium">{p.category}</div>
                  <div className="font-semibold text-gray-900">{p.title}</div>
                  <div className="text-xs text-gray-600 line-clamp-2 mt-1">{p.content}</div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Heart className="w-3 h-3" />
                      <span>{p.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Copy className="w-3 h-3" />
                      <span>{p.commentCount}</span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default PublicProfilePage;
