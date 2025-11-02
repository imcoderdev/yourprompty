import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hddxbgpnspyeflkvsdry.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZHhiZ3Buc3B5ZWZsa3ZzZHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTg3MTksImV4cCI6MjA3NzU5NDcxOX0.ifAswv6_k5S5Sw7M1LW_Y9zOkAdvIABGr09IdN--zkU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
