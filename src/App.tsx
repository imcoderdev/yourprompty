import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './contexts/AuthContext';
import { getAvatarUrl } from './types/supabase-types';
import { getPrompts } from './services/promptService';
import Header from './components/Header';
import Hero from './components/Hero';
import PromptFeed from './components/PromptFeed';
import CreatorProfile from './components/CreatorProfile';
import CreateProfile from './components/CreateProfile';
import UserProfile from './components/UserProfile';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import AuthModal from './components/AuthModal';
import AuthCallback from './components/AuthCallback';
import AIModelExplorer from './components/AIModelExplorer';
import UploadPromptModal from './components/UploadPromptModal';
import UploadPromptPage from './components/UploadPromptPage';
import PublicProfilePage from './components/PublicProfilePage';
import SettingsModal from './components/SettingsModal';

function App() {
  const { user, profile, signOut, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'create-profile' | 'user-profile' | 'upload' | 'public-profile' | 'auth-callback'>('home');
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAIExplorer, setShowAIExplorer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [authStartInSignup, setAuthStartInSignup] = useState(false);
  const [feedItems, setFeedItems] = useState<any[] | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [highlightPromptId, setHighlightPromptId] = useState<number | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('App: Auth state -', { 
      loading, 
      hasUser: !!user, 
      hasProfile: !!profile,
      userEmail: user?.email,
      profileName: profile?.name 
    });
  }, [loading, user, profile]);

  // Check if we're on the auth callback route
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthError = urlParams.has('error') || urlParams.has('error_code');
    const hasAuthCallback = window.location.pathname === '/auth/callback' || 
                           window.location.hash.includes('access_token') || 
                           window.location.hash.includes('error');
    
    if (hasAuthCallback || hasAuthError) {
      setCurrentView('auth-callback');
    }
  }, []);

  // Convert profile to user object format for existing components
  // Fall back to user data if profile isn't loaded yet (shows logged-in state faster)
  const currentUser = profile ? {
    email: profile.email,
    name: profile.name,
    userId: profile.user_id,
    avatar: getAvatarUrl(profile),
    profilePhoto: profile.profile_photo,
    tagline: profile.tagline,
    instagram: profile.instagram,
    twitter: profile.twitter,
    linkedin: profile.linkedin,
    github: profile.github,
    youtube: profile.youtube,
    tiktok: profile.tiktok,
    website: profile.website
  } : user ? {
    // Fallback: use auth user data when profile isn't loaded yet
    email: user.email || '',
    name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    userId: user.email?.split('@')[0]?.toLowerCase() || '',
    avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email || 'U')}`,
    profilePhoto: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    tagline: null,
    instagram: null,
    twitter: null,
    linkedin: null,
    github: null,
    youtube: null,
    tiktok: null,
    website: null
  } : null;

  // Load prompts from Supabase
  const loadPrompts = async () => {
    try {
      console.log('🚀 App: Loading prompts...');
      const { data, error } = await getPrompts({ 
        orderBy: 'created_at', 
        orderDirection: 'desc' 
      });
      
      console.log('📊 App: getPrompts returned:', { 
        dataCount: data?.length || 0, 
        error: error?.message || null 
      });
      
      if (error) {
        console.error('❌ App: Error loading prompts:', error);
        setFeedItems([]);
        return;
      }

      // Map to the format expected by PromptCard
      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        prompt: p.content,
        result: p.image_url || `https://picsum.photos/seed/${p.id}/800/600`,
        category: p.category || 'General',
        creator: {
          name: p.author?.name || 'Creator',
          email: p.author?.email || '',
          avatar: p.author?.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.author?.name || 'U')}`,
          username: `@${(p.author?.user_id || 'user').toLowerCase()}`,
          verified: false,
        },
        likes: p.like_count || 0,
        uses: p.comment_count || 0,
        liked: p.liked || false,
      }));
      
      console.log('✅ App: Mapped prompts:', mapped.length, 'items');
      setFeedItems(mapped);
    } catch (error) {
      console.error('💥 App: Exception loading prompts:', error);
      setFeedItems([]);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleViewCreator = (creator: any) => {
    setSelectedCreator(creator);
    setCurrentView('public-profile');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedCreator(null);
  };

  const handleCreateProfile = () => {
    setAuthStartInSignup(true);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    console.log('handleLogout: Starting sign out...');
    signOut(); // Don't await - signOut clears state immediately
    setCurrentView('home');
    console.log('handleLogout: Done, navigated to home');
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  const handleShowAIExplorer = () => {
    setShowAIExplorer(true);
  };

  const handleShowUploadPage = () => {
    setCurrentView('upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Handle OAuth callback */}
      {currentView === 'auth-callback' ? (
        <AuthCallback onComplete={() => setCurrentView('home')} />
      ) : (
        <>
          <Header 
            onBackToHome={handleBackToHome} 
            showBackButton={currentView === 'profile'} 
            user={currentUser}
            onShowAuth={handleShowAuth}
            onShowProfile={() => setCurrentView('user-profile')}
            onShowAIExplorer={handleShowAIExplorer}
            onShowUpload={handleShowUploadPage}
            onLogout={handleLogout}
            onShowSettings={() => setShowSettings(true)}
            onViewCreator={handleViewCreator}
            onViewPrompt={(promptId) => {
              // Navigate to home and highlight the prompt
              setHighlightPromptId(promptId);
              setCurrentView('home');
              setTimeout(() => {
                const promptElement = document.getElementById(`prompt-${promptId}`);
                if (promptElement) {
                  promptElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);
            }}
          />
      
      {currentView === 'home' ? (
        <>
          {!currentUser && (
            <Hero onCreateProfile={handleCreateProfile} onShowAIExplorer={handleShowAIExplorer} />
          )}
          {currentUser && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <div className="flex justify-end">
                <button
                  onClick={handleShowUploadPage}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow hover:shadow-lg"
                >
                  Upload Prompt
                </button>
              </div>
            </div>
          )}
          <PromptFeed 
            onViewCreator={handleViewCreator} 
            items={feedItems ?? undefined}
            highlightPromptId={highlightPromptId}
            onPromptVisible={() => setHighlightPromptId(null)}
          />
        </>
      ) : currentView === 'profile' ? (
        <CreatorProfile creator={selectedCreator} onBack={handleBackToHome} />
      ) : currentView === 'create-profile' ? (
        <CreateProfile onBack={handleBackToHome} />
      ) : currentView === 'upload' ? (
        <UploadPromptPage 
          onCancel={handleBackToHome}
          onCreated={() => { setCurrentView('home'); loadPrompts(); }}
        />
      ) : currentView === 'public-profile' ? (
        <PublicProfilePage email={selectedCreator?.email} onBack={handleBackToHome} />
      ) : (
        <UserProfile user={currentUser} onBack={handleBackToHome} onShowUpload={handleShowUploadPage} />
      )}
      
      <Footer 
        onNavigateHome={handleBackToHome}
        onShowAuth={handleShowAuth}
        onShowUpload={handleShowUploadPage}
        onShowAIExplorer={handleShowAIExplorer}
      />
      <Chatbot 
        user={currentUser}
        onTriggerAction={(actionType, actionData) => {
          console.log('Chatbot action:', actionType, actionData);
          // Handle different action types
          switch(actionType) {
            case 'OPEN_UPLOAD':
              handleShowUploadPage();
              break;
            case 'SHOW_AUTH':
              setAuthStartInSignup(actionData?.mode === 'signup');
              handleShowAuth();
              break;
            case 'FILTER_CATEGORY':
              // Category filter will be handled by the feed
              handleBackToHome();
              break;
            default:
              break;
          }
        }}
      />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        startInSignup={authStartInSignup} 
      />
      <UploadPromptModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onCreated={() => { setShowUploadModal(false); loadPrompts(); }}
      />
      {showAIExplorer && (
        <AIModelExplorer onClose={() => setShowAIExplorer(false)} />
      )}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
      />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </>
      )}
    </div>
  );
}

export default App;