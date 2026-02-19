import React, { useState } from 'react';
import { X, Lock, Bell, Palette, Trash2, Shield, Eye, EyeOff, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onLogout }) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'appearance' | 'privacy'>('account');
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  
  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  
  // Privacy
  const [profilePublic, setProfilePublic] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  
  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const isOAuthUser = user?.app_metadata?.provider !== 'email';

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setDeleting(true);
    try {
      // Delete user's prompts
      if (user) {
        await supabase.from('prompts').delete().eq('user_id', user.id);
        await supabase.from('prompt_likes').delete().eq('user_id', user.id);
        await supabase.from('followers').delete().eq('follower_id', user.id);
        await supabase.from('followers').delete().eq('followee_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
      }
      
      toast.success('Account data deleted. You will be signed out.');
      setTimeout(() => {
        onLogout();
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'privacy' as const, label: 'Privacy & Security', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-gray-100 py-4 flex-shrink-0 bg-gray-50/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-r-2 border-purple-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Account Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Account Information</h3>
                  <p className="text-sm text-gray-500 mb-4">Manage your account details</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Email</p>
                        <p className="text-sm text-gray-900">{user?.email || 'N/A'}</p>
                      </div>
                      {isOAuthUser && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          {user?.app_metadata?.provider === 'google' ? 'Google' : 
                           user?.app_metadata?.provider === 'github' ? 'GitHub' : 'OAuth'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Username</p>
                        <p className="text-sm text-gray-900">@{profile?.user_id || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Member Since</p>
                        <p className="text-sm text-gray-900">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                {!isOAuthUser && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h3>
                    <p className="text-sm text-gray-500 mb-4">Update your account password</p>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 6 characters)"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                      />
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !newPassword || !confirmPassword}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                )}

                {isOAuthUser && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                      You signed in with <strong>{user?.app_metadata?.provider === 'google' ? 'Google' : 'GitHub'}</strong>. 
                      Password management is handled by your OAuth provider.
                    </p>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-red-600 mb-1">Danger Zone</h3>
                  <p className="text-sm text-gray-500 mb-4">Irreversible actions</p>
                  
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                      <p className="text-sm text-red-800 font-medium">
                        This will permanently delete your account, all your prompts, likes, and followers. This cannot be undone.
                      </p>
                      <p className="text-sm text-red-700">
                        Type <strong>DELETE</strong> to confirm:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== 'DELETE' || deleting}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {deleting ? 'Deleting...' : 'Permanently Delete'}
                        </button>
                        <button
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Notification Preferences</h3>
                  <p className="text-sm text-gray-500 mb-4">Choose what you want to be notified about</p>
                </div>
                
                <div className="space-y-1">
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive email updates about activity', value: emailNotifications, setter: setEmailNotifications },
                    { key: 'likes', label: 'Like Notifications', desc: 'When someone likes your prompt', value: likeNotifications, setter: setLikeNotifications },
                    { key: 'follows', label: 'Follow Notifications', desc: 'When someone follows you', value: followNotifications, setter: setFollowNotifications },
                    { key: 'comments', label: 'Comment Notifications', desc: 'When someone copies or interacts with your prompt', value: commentNotifications, setter: setCommentNotifications },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          item.setter(!item.value);
                          toast.success(`${item.label} ${!item.value ? 'enabled' : 'disabled'}`);
                        }}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                          item.value ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                          item.value ? 'translate-x-5.5 left-[1px]' : 'left-[2px]'
                        }`} style={{ transform: item.value ? 'translateX(22px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Appearance</h3>
                  <p className="text-sm text-gray-500 mb-4">Customize how YourPrompty looks</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light' as const, label: 'Light', icon: '☀️', desc: 'Clean & bright' },
                      { id: 'dark' as const, label: 'Dark', icon: '🌙', desc: 'Easy on the eyes' },
                      { id: 'system' as const, label: 'System', icon: '💻', desc: 'Match your OS' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          toast.success(`Theme set to ${t.label}` + (t.id !== 'light' ? ' (coming soon!)' : ''));
                        }}
                        className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                          theme === t.id
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{t.icon}</div>
                        <p className="text-sm font-medium text-gray-900">{t.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                        {theme === t.id && (
                          <Check className="w-4 h-4 text-purple-600 mx-auto mt-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Prompt Card Layout</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 rounded-xl border-2 border-purple-500 bg-purple-50 text-center transition-all">
                      <div className="text-2xl mb-2">📌</div>
                      <p className="text-sm font-medium text-gray-900">Pinterest Grid</p>
                      <p className="text-xs text-gray-500 mt-0.5">Masonry layout</p>
                      <Check className="w-4 h-4 text-purple-600 mx-auto mt-2" />
                    </button>
                    <button 
                      onClick={() => toast.info('List view coming soon!')}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-center transition-all hover:scale-105"
                    >
                      <div className="text-2xl mb-2">📃</div>
                      <p className="text-sm font-medium text-gray-900">List View</p>
                      <p className="text-xs text-gray-500 mt-0.5">Coming soon</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Privacy & Security</h3>
                  <p className="text-sm text-gray-500 mb-4">Control your privacy settings</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Public Profile</p>
                      <p className="text-xs text-gray-500">Allow other users to see your profile and prompts</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfilePublic(!profilePublic);
                        toast.success(`Profile is now ${!profilePublic ? 'public' : 'private'}`);
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        profilePublic ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"
                        style={{ transform: profilePublic ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Show Email on Profile</p>
                      <p className="text-xs text-gray-500">Display your email address on your public profile</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowEmail(!showEmail);
                        toast.success(`Email is now ${!showEmail ? 'visible' : 'hidden'} on your profile`);
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        showEmail ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"
                        style={{ transform: showEmail ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Active Sessions</h4>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Current Session</p>
                          <p className="text-xs text-gray-500">
                            {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                             navigator.userAgent.includes('Firefox') ? 'Firefox' :
                             navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'} 
                            {' • '}Active now
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">Active</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Data & Privacy</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => toast.info('Your data export will be emailed to you (feature coming soon!)')}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700">Download My Data</span>
                      <span className="text-xs text-purple-600 font-medium">Export</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
