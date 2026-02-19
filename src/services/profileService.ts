// ============================================================================
// Profile Service - Supabase Profile Operations
// ============================================================================
// Handles user profile CRUD operations using Supabase.
// ============================================================================

import { supabase } from '../lib/supabase';
import type { Profile } from '../types/supabase-types';

// ============================================================================
// GET USER PROFILE WITH STATS
// ============================================================================

export interface UserProfileWithStats {
  profile: Profile;
  stats: {
    promptsCount: number;
    followers: number;
    following: number;
    totalLikes: number;
  };
  prompts: any[];
}

export async function getUserProfileWithStats(): Promise<{
  data: UserProfileWithStats | null;
  error: any;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    console.log('getUserProfileWithStats: Fetching for user:', user.id);

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { data: null, error: profileError };
    }

    console.log('getUserProfileWithStats: Profile found:', profile?.name);

    // Fetch user's prompts
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (promptsError) {
      console.error('Error fetching user prompts:', promptsError);
    }
    console.log('getUserProfileWithStats: Prompts found:', prompts?.length || 0, promptsError ? `(error: ${promptsError.message})` : '');

    // Count followers
    const { count: followersCount, error: followersError } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('followee_id', user.id);

    if (followersError) {
      console.error('Error fetching followers:', followersError);
    }

    // Count following
    const { count: followingCount, error: followingError } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    if (followingError) {
      console.error('Error fetching following:', followingError);
    }

    // Calculate total likes across all prompts
    const totalLikes = (prompts || []).reduce((sum, p) => sum + (p.like_count || 0), 0);

    const stats = {
      promptsCount: prompts?.length || 0,
      followers: followersCount || 0,
      following: followingCount || 0,
      totalLikes
    };
    
    console.log('getUserProfileWithStats: Stats:', stats);

    return {
      data: {
        profile,
        stats,
        prompts: prompts || []
      },
      error: null
    };
  } catch (err) {
    console.error('Error in getUserProfileWithStats:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// UPDATE PROFILE
// ============================================================================

export interface UpdateProfileInput {
  name?: string;
  user_id?: string;
  tagline?: string;
  profile_photo?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export async function updateProfile(updates: UpdateProfileInput): Promise<{
  data: Profile | null;
  error: any;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    // Check if user_id is being changed and if it's available
    if (updates.user_id) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', updates.user_id)
        .neq('id', user.id)
        .single();

      if (existing) {
        return { data: null, error: { message: 'This username is already taken' } };
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }

    console.log('✅ Profile updated successfully');
    return { data, error: null };
  } catch (err) {
    console.error('Error in updateProfile:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// GET PUBLIC PROFILE (for viewing other users)
// ============================================================================

export async function getPublicProfile(userId: string): Promise<{
  data: UserProfileWithStats | null;
  error: any;
}> {
  try {
    // Fetch profile by user_id (username)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      return { data: null, error: profileError };
    }

    // Fetch user's prompts
    const { data: prompts } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    // Count followers
    const { count: followersCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('followee_id', profile.id);

    // Count following
    const { count: followingCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id);

    const totalLikes = (prompts || []).reduce((sum, p) => sum + (p.like_count || 0), 0);

    return {
      data: {
        profile,
        stats: {
          promptsCount: prompts?.length || 0,
          followers: followersCount || 0,
          following: followingCount || 0,
          totalLikes
        },
        prompts: prompts || []
      },
      error: null
    };
  } catch (err) {
    console.error('Error in getPublicProfile:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// FOLLOW / UNFOLLOW USER
// ============================================================================

export async function toggleFollow(targetUserId: string): Promise<{
  following: boolean;
  error: any;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      return { following: false, error: { message: 'Not authenticated' } };
    }

    // Get target profile
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', targetUserId)
      .single();

    if (!targetProfile) {
      return { following: false, error: { message: 'User not found' } };
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followee_id', targetUserId)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('id', existingFollow.id);

      if (error) {
        return { following: true, error };
      }

      return { following: false, error: null };
    } else {
      // Follow
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          followee_id: targetUserId,
          follower_email: user.email!,
          followee_email: targetProfile.email
        });

      if (error) {
        return { following: false, error };
      }

      return { following: true, error: null };
    }
  } catch (err) {
    console.error('Error in toggleFollow:', err);
    return { following: false, error: err };
  }
}

// ============================================================================
// CHECK IF FOLLOWING
// ============================================================================

export async function isFollowing(targetUserId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) return false;

    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followee_id', targetUserId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// ============================================================================
// GET PUBLIC PROFILE BY EMAIL
// ============================================================================

export async function getPublicProfileByEmail(email: string): Promise<{
  data: UserProfileWithStats | null;
  error: any;
}> {
  try {
    // Fetch profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError) {
      return { data: null, error: profileError };
    }

    // Fetch user's prompts
    const { data: prompts } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    // Count followers
    const { count: followersCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('followee_id', profile.id);

    // Count following
    const { count: followingCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id);

    const totalLikes = (prompts || []).reduce((sum, p) => sum + (p.like_count || 0), 0);

    return {
      data: {
        profile,
        stats: {
          promptsCount: prompts?.length || 0,
          followers: followersCount || 0,
          following: followingCount || 0,
          totalLikes
        },
        prompts: prompts || []
      },
      error: null
    };
  } catch (err) {
    console.error('Error in getPublicProfileByEmail:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// SEARCH PROFILES
// ============================================================================

export async function searchProfiles(query: string, limit: number = 10): Promise<{
  data: any[];
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, user_id, profile_photo')
      .or(`name.ilike.%${query}%,user_id.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in searchProfiles:', err);
    return { data: [], error: err };
  }
}
