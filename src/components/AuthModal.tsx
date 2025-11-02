import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react';
import { supabase } from '../config/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
  startInSignup?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, startInSignup = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', userId: '', email: '', password: '', confirmPassword: '' });
      setError(null);
      setIsLogin(true);
      setShowPassword(false);
      setVerificationSent(false);
    }
  }, [isOpen]);

  // When opening, honor startInSignup to switch to Sign Up mode
  useEffect(() => {
    if (isOpen) {
      setIsLogin(!startInSignup);
    }
  }, [isOpen, startInSignup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      if (!isLogin) {
        // Sign up with Supabase for email verification
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              userId: formData.userId
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData?.user?.identities?.length === 0) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }

        // Also create user in your backend
        const baseUrl = 'http://localhost:4000';
        const res = await fetch(`${baseUrl}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            userId: formData.userId,
            email: formData.email,
            password: formData.password,
            supabaseId: signUpData.user?.id
          })
        });

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg?.message || 'Failed to create account');
        }

        // Show verification message
        setVerificationSent(true);
        setError(null);
      } else {
        // Sign in - check Supabase verification
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (signInError) throw signInError;

        if (!signInData.user?.email_confirmed_at) {
          throw new Error('Please verify your email address before signing in. Check your inbox for the verification link.');
        }

        // Sign in with your backend
        const baseUrl = 'http://localhost:4000';
        const res = await fetch(`${baseUrl}/api/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg?.message || 'Authentication failed');
        }

        const data = await res.json();
        if (data?.token) {
          localStorage.setItem('token', data.token);
        }
        
        // Show a brief success state before redirecting
        setIsLoading(false);
        setError(null);
        
        // Wait to show success, then close and trigger login
        setTimeout(() => {
          if (data?.user) {
            onLogin(data.user);
          }
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header with animated gradient */}
        <div className={`p-5 text-white relative transition-all duration-500 flex-shrink-0 ${
          isLogin 
            ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700' 
            : 'bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-all duration-200 hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-1 transition-all duration-300">
              {isLogin ? 'Welcome Back!' : 'Join yourPrompty'}
            </h2>
            <p className="text-sm text-white/90 transition-all duration-300">
              {isLogin ? 'Sign in to continue your journey' : 'Create your account and get started'}
            </p>
          </div>
        </div>

        {/* Form with scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          {verificationSent ? (
            <div className="text-center py-8 animate-fade-in-up">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Your Email</h3>
              <p className="text-gray-600 mb-4">
                We've sent a verification link to <strong>{formData.email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please check your inbox and click the verification link to activate your account.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The verification link will expire in 24 hours. 
                  If you don't see the email, check your spam folder.
                </p>
              </div>
              <button
                onClick={() => {
                  setVerificationSent(false);
                  setIsLogin(true);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
          /* Sign In Form - For EXISTING users */
          isLogin ? (
            <form key="signin-form" onSubmit={handleSubmit} className="space-y-3 animate-slide-in">
              <div className="group transform transition-all duration-300 hover:scale-[1.01]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-hover:text-blue-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 hover:border-gray-300"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="group transform transition-all duration-300 hover:scale-[1.01]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-hover:text-blue-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 hover:border-gray-300"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-all duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg animate-shake">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          ) : (
            /* Sign Up Form - For NEW users */
            <form key="signup-form" onSubmit={handleSubmit} className="space-y-3 animate-slide-in">
              <div className="group transform transition-all duration-300 hover:scale-[1.01]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-hover:text-purple-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-300 hover:border-gray-300"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="group transform transition-all duration-300 hover:scale-[1.01]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-hover:text-purple-500" />
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-300 hover:border-gray-300"
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>

              <div className="group transform transition-all duration-300 hover:scale-[1.01]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-hover:text-purple-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-300 hover:border-gray-300"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="group transform transition-all duration-300 hover:scale-[1.01]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-hover:text-purple-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-300 hover:border-gray-300"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-all duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="group transform transition-all duration-300 hover:scale-[1.01]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-hover:text-purple-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-300 hover:border-gray-300"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg animate-shake">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          )
          )}

          {/* Toggle between Sign In and Sign Up */}
          {!verificationSent && (
          <div className="mt-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ name: '', userId: '', email: '', password: '', confirmPassword: '' });
                  setError(null);
                  setShowPassword(false);
                }}
                className="ml-2 text-purple-600 font-semibold hover:text-purple-700 hover:underline transition-all duration-200 transform hover:scale-105 inline-block"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;