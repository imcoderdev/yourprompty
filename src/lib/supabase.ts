// ============================================================================
// Supabase Client - Typed & Configured
// ============================================================================
// This is the main Supabase client instance used throughout the application.
// It includes type definitions for database tables and handles authentication.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
}

// Verify localStorage is available (required for PKCE OAuth flow)
try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, 'test');
  window.localStorage.removeItem(testKey);
  console.log('✅ localStorage is available - OAuth will work');
} catch (e) {
  console.error('❌ localStorage is NOT available - OAuth will fail!');
  console.error('Please enable cookies and storage in your browser settings');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper to get the current user session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
}

// Helper to get the current user
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

// Helper to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session;
}

// Storage bucket URL helper
export function getStorageUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export default supabase;
