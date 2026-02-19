// ============================================================================
// Auth Service - Authentication Helper Functions
// ============================================================================
// Centralized authentication utilities for Supabase Auth operations.
// ============================================================================

import { supabase } from '../lib/supabase';
import type { SignUpData, SignInData } from '../types/supabase-types';

// ============================================================================
// SIGN UP
// ============================================================================

export async function signUpWithEmail(data: SignUpData) {
  const { email, password, name, userId } = data;

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
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

  if (authError) {
    return { user: null, error: authError };
  }

  // Check if email already registered
  if (authData.user?.identities?.length === 0) {
    return {
      user: null,
      error: {
        message: 'An account with this email already exists. Please sign in instead.',
        name: 'DuplicateEmail'
      }
    };
  }

  return { user: authData.user, error: null };
}

// ============================================================================
// SIGN IN
// ============================================================================

export async function signInWithEmail(data: SignInData) {
  const { email, password } = data;

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { user: null, session: null, error };
  }

  return { user: authData.user, session: authData.session, error: null };
}

// ============================================================================
// SIGN OUT
// ============================================================================

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error);
    return { error };
  }

  return { error: null };
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }

  return { session, error: null };
}

export async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error('Refresh session error:', error);
    return { session: null, error };
  }

  return { session, error: null };
}

// ============================================================================
// USER INFO
// ============================================================================

export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Get session error:', error);
    return { user: null, error };
  }

  return { user: session?.user || null, error: null };
}

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email
  });

  if (error) {
    console.error('Resend verification error:', error);
    return { error };
  }

  return { error: null };
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) {
    console.error('Password reset error:', error);
    return { error };
  }

  return { error: null };
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.error('Update password error:', error);
    return { error };
  }

  return { error: null };
}

// ============================================================================
// SOCIAL AUTH (Optional - for future use)
// ============================================================================

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    console.error('Google sign in error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    console.error('GitHub sign in error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}
