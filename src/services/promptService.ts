// ============================================================================
// Prompt Service - Supabase Database Operations
// ============================================================================
// Handles all prompt-related database operations using Supabase client.
// Replaces backend API calls with direct Supabase queries.
// ============================================================================

import { supabase } from '../lib/supabase';
import type { PromptWithAuthor, PromptFilters, CreatePromptInput } from '../types/supabase-types';

// ============================================================================
// FETCH PROMPTS
// ============================================================================

export async function getPrompts(filters?: PromptFilters) {
  try {
    console.log('🔍 getPrompts called with filters:', filters);
    
    let query = supabase
      .from('prompts')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          user_id,
          email,
          profile_photo
        )
      `);

    // Apply filters
    if (filters?.category && filters.category !== 'all') {
      query = query.ilike('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    // Ordering
    const orderBy = filters?.orderBy || 'created_at';
    const orderDirection = filters?.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    console.log('📦 Prompts query result:', { 
      dataCount: data?.length || 0, 
      error: error?.message || null,
      data: data 
    });

    if (error) {
      console.error('❌ Error fetching prompts:', error);
      return { data: null, error };
    }

    // Check if current user liked each prompt
    const { data: { session } } = await supabase.auth.getSession();
    let likedPromptIds: number[] = [];

    if (session?.user) {
      const { data: likes } = await supabase
        .from('prompt_likes')
        .select('prompt_id')
        .eq('user_id', session.user.id);
      
      likedPromptIds = likes?.map(l => l.prompt_id) || [];
    }

    // Format data for frontend
    const prompts: PromptWithAuthor[] = (data || []).map((p: any) => ({
      ...p,
      author: {
        name: p.profiles?.name || 'Unknown',
        email: p.profiles?.email || '',
        user_id: p.profiles?.user_id || '',
        profile_photo: p.profiles?.profile_photo || null,
        verified: false
      },
      liked: likedPromptIds.includes(p.id)
    }));

    return { data: prompts, error: null };
  } catch (err) {
    console.error('Error in getPrompts:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// GET SINGLE PROMPT
// ============================================================================

export async function getPromptById(id: number) {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          user_id,
          email,
          profile_photo
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      return { data: null, error };
    }

    // Check if current user liked this prompt
    const { data: { session: likeSession } } = await supabase.auth.getSession();
    let liked = false;

    if (likeSession?.user) {
      const { data: like } = await supabase
        .from('prompt_likes')
        .select('id')
        .eq('prompt_id', id)
        .eq('user_id', likeSession.user.id)
        .single();
      
      liked = !!like;
    }

    const prompt: PromptWithAuthor = {
      ...data,
      author: {
        name: data.profiles?.name || 'Unknown',
        email: data.profiles?.email || '',
        user_id: data.profiles?.user_id || '',
        profile_photo: data.profiles?.profile_photo || null,
        verified: false
      },
      liked
    };

    return { data: prompt, error: null };
  } catch (err) {
    console.error('Error in getPromptById:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// CREATE PROMPT
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function createPrompt(input: CreatePromptInput & { imageUrl?: string; imagePath?: string; userId?: string; userEmail?: string; accessToken?: string }) {
  try {
    const userId = input.userId;
    const userEmail = input.userEmail;
    const accessToken = input.accessToken;
    
    if (!userId || !accessToken) {
      return { data: null, error: { message: 'You must be signed in to create a prompt' } };
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        author_email: userEmail,
        title: input.title,
        content: input.content,
        category: input.category,
        image_url: input.imageUrl || null,
        image_path: input.imagePath || null
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create prompt:', response.status, errorText);
      return { data: null, error: { message: `Failed to create prompt: ${errorText}` } };
    }

    const data = await response.json();
    
    return { data: data[0] || data, error: null };
  } catch (err: any) {
    console.error('Error in createPrompt:', err);
    return { data: null, error: { message: err.message } };
  }
}

// ============================================================================
// LIKE / UNLIKE PROMPT
// ============================================================================

export async function toggleLike(promptId: number) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      return { data: null, error: { message: 'You must be signed in to like prompts' } };
    }

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('prompt_likes')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking like:', checkError);
      return { data: null, error: checkError };
    }

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('prompt_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error unliking prompt:', deleteError);
        return { data: null, error: deleteError };
      }

      // Get updated like count
      const { data: prompt } = await supabase
        .from('prompts')
        .select('like_count')
        .eq('id', promptId)
        .single();

      return { 
        data: { 
          liked: false, 
          likeCount: prompt?.like_count || 0 
        }, 
        error: null 
      };
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('prompt_likes')
        .insert({
          prompt_id: promptId,
          user_id: user.id,
          user_email: user.email!
        });

      if (insertError) {
        console.error('Error liking prompt:', insertError);
        return { data: null, error: insertError };
      }

      // Get updated like count
      const { data: prompt } = await supabase
        .from('prompts')
        .select('like_count')
        .eq('id', promptId)
        .single();

      return { 
        data: { 
          liked: true, 
          likeCount: prompt?.like_count || 0 
        }, 
        error: null 
      };
    }
  } catch (err) {
    console.error('Error in toggleLike:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// UPDATE PROMPT
// ============================================================================

export async function updatePrompt(id: number, updates: Partial<CreatePromptInput>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      return { data: null, error: { message: 'You must be signed in to update prompts' } };
    }

    const { data, error } = await supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the prompt
      .select()
      .single();

    if (error) {
      console.error('Error updating prompt:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Error in updatePrompt:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// DELETE PROMPT
// ============================================================================

export async function deletePrompt(id: number) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      return { data: null, error: { message: 'You must be signed in to delete prompts' } };
    }

    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user owns the prompt

    if (error) {
      console.error('Error deleting prompt:', error);
      return { data: null, error };
    }

    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('Error in deletePrompt:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// TRACK INTERACTION (for recommendation engine)
// ============================================================================

export async function trackInteraction(promptId: number, type: 'view' | 'like' | 'copy' | 'comment') {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) return; // Silent fail for anonymous users

    await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        user_email: user.email!,
        prompt_id: promptId,
        interaction_type: type
      });

  } catch (err) {
    // Silent fail - don't block user experience
    console.debug('Interaction tracking failed:', err);
  }
}

// ============================================================================
// GET USER'S PROMPTS
// ============================================================================

export async function getUserPrompts(userId: string) {
  return getPrompts({ userId, orderBy: 'created_at', orderDirection: 'desc' });
}

// ============================================================================
// SEARCH PROMPTS
// ============================================================================

export async function searchPrompts(query: string, limit: number = 20) {
  return getPrompts({ search: query, limit });
}
