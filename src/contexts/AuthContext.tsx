// ============================================================================
// Auth Context - Supabase Authentication State Management
// ============================================================================
// Provides authentication state and methods throughout the application.
// Wraps Supabase Auth with React Context for easy access in components.
// ============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/supabase-types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, userId: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database, create if doesn't exist (for OAuth users)
  const fetchProfile = async (authUser: User): Promise<Profile | null> => {
    try {
      console.log('Fetching profile for user:', authUser.id, authUser.email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.log('Profile fetch error:', error.code, error.message);
        
        // If profile doesn't exist, create one (for OAuth users where trigger may not have run)
        if (error.code === 'PGRST116') { // "No rows found" error
          console.log('No profile found, creating one for OAuth user...');
          
          const userName = authUser.user_metadata?.name || 
                          authUser.user_metadata?.full_name || 
                          authUser.email?.split('@')[0] || 
                          'User';
          
          const userId = authUser.user_metadata?.userId ||
                        authUser.email?.split('@')[0]?.toLowerCase() ||
                        authUser.id.substring(0, 8);
          
          const newProfile = {
            id: authUser.id,
            email: authUser.email || '',
            name: userName,
            user_id: userId,
            profile_photo: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating profile:', createError);
            // Return a minimal profile from user data so UI still works
            return newProfile as Profile;
          }
          
          console.log('✅ Profile created successfully:', createdProfile);
          return createdProfile;
        }
        
        console.error('Error fetching profile:', error);
        return null;
      }

      console.log('✅ Profile fetched:', data?.name, data?.email);
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session check:', !!session);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user).then(setProfile);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setProfile(profile);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up new user
  const signUp = async (
    email: string,
    password: string,
    name: string,
    userId: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            userId
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) return { error };

      // Check if email already exists
      if (data.user?.identities?.length === 0) {
        return {
          error: {
            message: 'An account with this email already exists. Please sign in instead.',
            name: 'AuthError',
            status: 400
          } as AuthError
        };
      }

      return { error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      return {
        error: {
          message: err instanceof Error ? err.message : 'An error occurred during sign up',
          name: 'AuthError',
          status: 500
        } as AuthError
      };
    }
  };

  // Sign in existing user
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { error };

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return {
        error: {
          message: err instanceof Error ? err.message : 'An error occurred during sign in',
          name: 'AuthError',
          status: 500
        } as AuthError
      };
    }
  };

  // Sign out
  const signOut = async () => {
    console.log('SignOut: Starting...');
    
    // Clear state IMMEDIATELY for instant UI feedback
    // Don't wait for supabase call which might hang
    setUser(null);
    setProfile(null);
    setSession(null);
    
    // Fire-and-forget the supabase signOut (don't await it)
    try {
      supabase.auth.signOut({ scope: 'local' }).then(() => {
        console.log('SignOut: Supabase local session cleared');
      }).catch((err) => {
        console.error('SignOut: Supabase error (non-blocking):', err);
      });
    } catch (err) {
      console.error('Sign out error:', err);
    }
    
    console.log('SignOut: State cleared, user logged out');
  };

  // Manually refresh profile (useful after profile updates)
  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchProfile(user);
      setProfile(profile);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to require authentication (redirects to login if not authenticated)
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsAuthenticated(!!user);
    }
  }, [user, loading]);

  return { isAuthenticated, loading };
}
