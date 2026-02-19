import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, signInWithGithub } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  startInSignup?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, startInSignup = false }) => {
  const { signUp, signIn } = useAuth();
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
        // Sign up with Supabase
        const { error: signUpError } = await signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.userId
        );

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        // Show verification message
        setVerificationSent(true);
        setError(null);
      } else {
        // Sign in with Supabase
        const { error: signInError } = await signIn(
          formData.email,
          formData.password
        );

        if (signInError) {
          // Check for email verification error
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Please verify your email address before signing in. Check your inbox for the verification link.');
          }
          throw new Error(signInError.message);
        }
        
        // Success - close modal
        setIsLoading(false);
        setError(null);
        
        // Brief delay to show success state
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        throw new Error(error.message);
      }
      // Redirect happens automatically
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await signInWithGithub();
      if (error) {
        throw new Error(error.message);
      }
      // Redirect happens automatically
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with GitHub');
      setIsLoading(false);
    }
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

          {/* Social Login Options */}
          {!verificationSent && (
            <>
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">or continue with</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {/* Google Sign In */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>

                  {/* GitHub Sign In */}
                  <button
                    type="button"
                    onClick={handleGithubSignIn}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Github className="w-5 h-5 mr-2" />
                    GitHub
                  </button>
                </div>
              </div>
            </>
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