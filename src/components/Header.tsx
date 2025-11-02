import React from 'react';
import { Search, User, Menu, ArrowLeft, Bell, Settings, LogOut, UserPlus, Bot, X } from 'lucide-react';

interface HeaderProps {
  onBackToHome: () => void;
  showBackButton: boolean;
  user?: any;
  onShowAuth: () => void;
  onShowProfile: () => void;
  onShowAIExplorer: () => void;
  onShowUpload?: () => void;
  onLogout?: () => void;
  onViewCreator?: (creator: any) => void;
  onViewPrompt?: (promptId: number) => void;
}

const Header: React.FC<HeaderProps> = ({ onBackToHome, showBackButton, user, onShowAuth, onShowProfile, onShowAIExplorer, onShowUpload, onLogout, onViewCreator, onViewPrompt }) => {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showMainMenu, setShowMainMenu] = React.useState(false);
  const [notifications, setNotifications] = React.useState(3);
  const [isMobile, setIsMobile] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any>({ prompts: [], users: [] });
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchType, setSearchType] = React.useState<'all' | 'prompts' | 'users'>('all');

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const baseUrl = 'http://localhost:4000';
      const token = localStorage.getItem('token');
      
      // Search prompts
      const promptsRes = await fetch(`${baseUrl}/api/prompts?search=${encodeURIComponent(query)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const promptsData = await promptsRes.json();
      
      // Search users
      const usersRes = await fetch(`${baseUrl}/api/users/search?q=${encodeURIComponent(query)}`);
      const usersData = await usersRes.json();

      setSearchResults({
        prompts: Array.isArray(promptsData) ? promptsData : [],
        users: usersData.users || []
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ prompts: [], users: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePromptClick = (prompt: any) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (onViewPrompt) {
      onViewPrompt(prompt.id);
    }
    onBackToHome();
  };

  const handleUserClick = (user: any) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (onViewCreator) {
      onViewCreator(user);
    }
  };

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm ${
      isMobile ? 'px-4' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between ${isMobile ? 'h-16' : 'h-18'}`}>
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={onBackToHome}
                className={`${isMobile ? 'p-2' : 'p-3'} hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110 group`}
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              </button>
            )}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={onBackToHome}>
              <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 animate-pulse-glow`}>
                <span className={`text-white font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>Y</span>
              </div>
              <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
                yourPrompty
              </h1>
            </div>
          </div>

          {!isMobile && (
            <div className="flex-1 max-w-lg mx-8 relative">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors duration-300 z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                  placeholder="Search prompts and users..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50 animate-fade-in-up">
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-2 p-3 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-xl">
                    <button
                      onClick={() => setSearchType('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        searchType === 'all'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSearchType('prompts')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        searchType === 'prompts'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Prompts ({searchResults.prompts.length})
                    </button>
                    <button
                      onClick={() => setSearchType('users')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        searchType === 'users'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Users ({searchResults.users.length})
                    </button>
                  </div>

                  {isSearching ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2 text-sm">Searching...</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {/* Prompts Results */}
                      {(searchType === 'all' || searchType === 'prompts') && searchResults.prompts.length > 0 && (
                        <div className="mb-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Prompts</h3>
                          {searchResults.prompts.slice(0, searchType === 'prompts' ? 10 : 3).map((prompt: any) => (
                            <button
                              key={prompt.id}
                              onClick={() => handlePromptClick(prompt)}
                              className="w-full px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left flex items-center gap-3"
                            >
                              <img
                                src={prompt.imageUrl || `https://picsum.photos/seed/${prompt.id}/600/400`}
                                alt={prompt.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{prompt.title}</p>
                                <p className="text-xs text-gray-500 truncate">{prompt.content}</p>
                              </div>
                              <span className="text-xs text-gray-400">{prompt.category}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Users Results */}
                      {(searchType === 'all' || searchType === 'users') && searchResults.users.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Users</h3>
                          {searchResults.users.slice(0, searchType === 'users' ? 10 : 3).map((user: any) => (
                            <button
                              key={user.email}
                              onClick={() => handleUserClick(user)}
                              className="w-full px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left flex items-center gap-3"
                            >
                              <img
                                src={user.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                <p className="text-xs text-gray-500">@{user.userId}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No Results */}
                      {searchResults.prompts.length === 0 && searchResults.users.length === 0 && !isSearching && (
                        <div className="p-8 text-center">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No results found for "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
            {/* Mobile Search Icon */}
            {isMobile && (
              <button className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Notifications */}
            <button className={`relative ${isMobile ? 'p-2' : 'p-3'} hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110 group`}>
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />
              {notifications > 0 && (
                <div className={`absolute -top-1 -right-1 ${isMobile ? 'w-4 h-4 text-xs' : 'w-5 h-5'} bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse`}>
                  {notifications}
                </div>
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-105 group`}
              >
                <div className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} bg-gradient-to-r from-purple-400 to-pink-400 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  {user ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
                  )}
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className={`absolute right-0 top-full mt-2 ${isMobile ? 'w-56' : 'w-64'} bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 py-2 animate-fade-in-up`}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Welcome!</p>
                        <p className="text-sm text-gray-500">Ready to create?</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    {user ? (
                      <>
                        <button 
                          onClick={() => {
                            onShowProfile();
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                        >
                          <User className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors duration-200" />
                          <span className="text-gray-700 group-hover:text-gray-900">My Profile</span>
                        </button>
                        <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group">
                          <Settings className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors duration-200" />
                          <span className="text-gray-700 group-hover:text-gray-900">Settings</span>
                        </button>
                        <div className="border-t border-gray-100 my-2"></div>
                        <button 
                          onClick={() => { onLogout?.(); setShowProfileMenu(false); }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group">
                          <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors duration-200" />
                          <span className="text-gray-700 group-hover:text-gray-900">Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          onShowAuth();
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 group"
                      >
                        <UserPlus className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors duration-200" />
                        <span className="text-gray-700 group-hover:text-gray-900">Sign In / Sign Up</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Main Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowMainMenu(!showMainMenu)}
                className={`${isMobile ? 'p-2' : 'p-3'} hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110 group`}
              >
                <Menu className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />
              </button>

              {/* Main Menu Dropdown */}
              {showMainMenu && (
                <div className={`absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 py-2 animate-fade-in-up`}>
                  <button 
                    onClick={onShowAIExplorer}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 text-gray-700 hover:text-gray-900 flex items-center space-x-3"
                  >
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span>Explore AI Models</span>
                  </button>
                  <button 
                    onClick={() => { onShowUpload?.(); setShowMainMenu(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 text-gray-700 hover:text-gray-900"
                  >
                    Upload Prompt
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 text-gray-700 hover:text-gray-900">
                    Browse Prompts
                  </button>
                  <div className="border-t border-gray-100 my-2"></div>
                  <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 text-gray-700 hover:text-gray-900">
                    Help & Support
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 text-gray-700 hover:text-gray-900">
                    About
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showProfileMenu || showMainMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowProfileMenu(false);
            setShowMainMenu(false);
          }}
        ></div>
      )}
    </header>
  );
};

export default Header;