import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Hero from './components/Hero';
import PromptFeed from './components/PromptFeed';
import CreatorProfile from './components/CreatorProfile';
import CreateProfile from './components/CreateProfile';
import UserProfile from './components/UserProfile';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import AuthModal from './components/AuthModal';
import AIModelExplorer from './components/AIModelExplorer';
import UploadPromptModal from './components/UploadPromptModal';
import UploadPromptPage from './components/UploadPromptPage';
import PublicProfilePage from './components/PublicProfilePage';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'create-profile' | 'user-profile' | 'upload' | 'public-profile'>('home');
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAIExplorer, setShowAIExplorer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [authStartInSignup, setAuthStartInSignup] = useState(false);
  const [feedItems, setFeedItems] = useState<any[] | null>(null);
  const [highlightPromptId, setHighlightPromptId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const baseUrl = 'http://localhost:4000';
    fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Session invalid');
        const data = await res.json();
        const avatar = data?.profilePhoto
          ? (String(data.profilePhoto).startsWith('/') ? `${baseUrl}${data.profilePhoto}` : data.profilePhoto)
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data?.name || 'U')}`;
        setUser({ ...data, avatar });
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
  }, []);

  // Load prompts from backend
  const loadPrompts = () => {
    const baseUrl = 'http://localhost:4000';
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch(`${baseUrl}/api/prompts`, { headers })
      .then(res => {
        console.log('Prompts API response status:', res.status);
        return res.json();
      })
      .then((rows) => {
        console.log('Prompts data received:', rows);
        const mapped = (rows || []).map((p: any, idx: number) => ({
          id: p.id,
          title: p.title,
          prompt: p.content,
          result: p.imageUrl || `https://picsum.photos/seed/${p.id}/800/600`,
          category: p.category || 'General',
          creator: {
            name: p.author?.name || p.author_name || 'Creator',
            email: p.author?.email || p.author_email,
            avatar: p.author?.profilePhoto
              ? (String(p.author.profilePhoto).startsWith('http') ? p.author.profilePhoto : `${window.location.origin}${p.author.profilePhoto}`)
              : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.author?.name || 'U')}`,
            username: `@${(p.author?.name || 'user').toLowerCase().replace(/\s+/g,'')}`,
            verified: false,
          },
          likes: Number(p.likeCount ?? 0),
          uses: Number(p.commentCount ?? 0),
          liked: !!p.liked,
        }));
        setFeedItems(mapped);
      })
      .catch((error) => {
        console.error('Error loading prompts:', error);
        setFeedItems([]);
      });
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

  const handleLogin = (userData: any) => {
    const baseUrl = 'http://localhost:4000';
    const avatar = userData?.profilePhoto
      ? (String(userData.profilePhoto).startsWith('/') ? `${baseUrl}${userData.profilePhoto}` : userData.profilePhoto)
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData?.name || 'U')}`;
    setUser({ ...userData, avatar });
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('home');
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
      <Header 
        onBackToHome={handleBackToHome} 
        showBackButton={currentView === 'profile'} 
        user={user}
        onShowAuth={handleShowAuth}
        onShowProfile={() => setCurrentView('user-profile')}
        onShowAIExplorer={handleShowAIExplorer}
        onShowUpload={handleShowUploadPage}
        onLogout={handleLogout}
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
          {!user && (
            <Hero onCreateProfile={handleCreateProfile} onShowAIExplorer={handleShowAIExplorer} />
          )}
          {user && (
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
        <UserProfile user={user} onBack={handleBackToHome} onShowUpload={handleShowUploadPage} />
      )}
      
      <Footer 
        onNavigateHome={handleBackToHome}
        onShowAuth={handleShowAuth}
        onShowUpload={handleShowUploadPage}
        onShowAIExplorer={handleShowAIExplorer}
      />
      <Chatbot 
        user={user}
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
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={handleLogin} startInSignup={authStartInSignup} />
      <UploadPromptModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onCreated={() => { setShowUploadModal(false); loadPrompts(); }}
      />
      {showAIExplorer && (
        <AIModelExplorer onClose={() => setShowAIExplorer(false)} />
      )}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

export default App;