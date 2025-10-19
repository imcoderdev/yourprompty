import React, { useState } from 'react';
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

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'create-profile' | 'user-profile'>('home');
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAIExplorer, setShowAIExplorer] = useState(false);

  const handleViewCreator = (creator: any) => {
    setSelectedCreator(creator);
    setCurrentView('profile');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedCreator(null);
  };

  const handleCreateProfile = () => {
    setCurrentView('create-profile');
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  const handleShowAIExplorer = () => {
    setShowAIExplorer(true);
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
      />
      
      {currentView === 'home' ? (
        <>
          <Hero onCreateProfile={handleCreateProfile} onShowAIExplorer={handleShowAIExplorer} />
          <PromptFeed onViewCreator={handleViewCreator} />
        </>
      ) : currentView === 'profile' ? (
        <CreatorProfile creator={selectedCreator} onBack={handleBackToHome} />
      ) : currentView === 'create-profile' ? (
        <CreateProfile onBack={handleBackToHome} />
      ) : (
        <UserProfile user={user} onBack={handleBackToHome} />
      )}
      
      <Footer />
      <Chatbot />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />
      {showAIExplorer && (
        <AIModelExplorer onClose={() => setShowAIExplorer(false)} />
      )}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

export default App;