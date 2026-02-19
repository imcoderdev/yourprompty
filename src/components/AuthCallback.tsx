// ============================================================================
// Auth Callback Handler - OAuth Redirect Handler
// ============================================================================
// This component handles OAuth redirects from Google/GitHub after authentication.
// Place this in your routing system to handle /auth/callback routes.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';

interface AuthCallbackProps {
  onComplete?: () => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onComplete }) => {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    console.log('Auth callback mounted');
    console.log('URL:', window.location.href);
    
    // Check for error in query params first (OAuth state errors)
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const errorCode = urlParams.get('error_code');
    
    if (errorParam) {
      console.error('OAuth error detected:', { error: errorParam, code: errorCode });
      
      if (errorCode === 'bad_oauth_state') {
        setError('OAuth state verification failed. Please try signing in again.');
      } else {
        setError(errorDescription || errorParam || 'OAuth authentication failed');
      }
      setStatus('error');
      return;
    }
    
    // Listen for auth state changes - this is the reliable way to detect PKCE completion
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth callback received event:', event, !!session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ Authentication successful!', session.user.email);
        setStatus('success');
        
        // Redirect after showing success
        setTimeout(() => {
          // Clean up URL
          window.history.replaceState({}, document.title, '/');
          if (onComplete) {
            onComplete();
          } else {
            window.location.href = '/';
          }
        }, 800);
      }
    });

    // Also check if we already have a session (in case event already fired)
    const checkExistingSession = async () => {
      // Give Supabase time to process the code from URL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Checking existing session:', !!session);
      
      if (session) {
        console.log('✅ Session already exists!', session.user.email);
        setStatus('success');
        
        setTimeout(() => {
          window.history.replaceState({}, document.title, '/');
          if (onComplete) {
            onComplete();
          } else {
            window.location.href = '/';
          }
        }, 800);
      }
    };
    
    checkExistingSession();
    
    // Timeout fallback - if nothing happens in 10 seconds, show error
    const timeout = setTimeout(() => {
      if (status === 'processing') {
        console.error('Auth callback timeout');
        setError('Sign in is taking too long. Please try again.');
        setStatus('error');
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [onComplete, status]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <Loader className="w-12 h-12 text-purple-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In...</h2>
          <p className="text-gray-600">Please wait while we set up your account</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600">Redirecting you to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-red-100 rounded-full">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign In Failed</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 whitespace-pre-line text-left">{error}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">Troubleshooting Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Make sure cookies and local storage are enabled in your browser</li>
            <li>• Don't clear browser data during the sign-in process</li>
            <li>• Complete the sign-in within 5 minutes</li>
            <li>• Try using a different browser or incognito mode if the issue persists</li>
          </ul>
        </div>
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
        >
          Try Again - Go to Home
        </button>
      </div>
    </div>
  );
};

export default AuthCallback;
