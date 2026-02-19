// ============================================================================
// Storage Service - Supabase Storage Operations
// ============================================================================
// Handles image uploads to Supabase Storage for prompts and profile photos.
// ============================================================================

import { supabase } from '../lib/supabase';

const PROMPT_IMAGES_BUCKET = 'prompt-images';
const PROFILE_PHOTOS_BUCKET = 'profile-photos';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============================================================================
// UPLOAD PROMPT IMAGE (Using direct REST API)
// ============================================================================

export async function uploadPromptImage(file: File, userId: string, accessToken: string): Promise<{
  url: string | null;
  path: string | null;
  error: any;
}> {
  console.log('🔵 uploadPromptImage called with file:', file.name, file.type, file.size);
  
  try {
    if (!userId || !accessToken) {
      return { url: null, path: null, error: { message: 'You must be signed in to upload images' } };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { url: null, path: null, error: { message: 'Only JPEG, PNG, GIF, and WebP images are allowed' } };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: null, path: null, error: { message: 'Image must be less than 10MB' } };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${userId}/${timestamp}-${randomId}.${fileExt}`;

    // Use direct REST API upload
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${PROMPT_IMAGES_BUCKET}/${fileName}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': file.type,
        'x-upsert': 'false'
      },
      body: file
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      return { url: null, path: null, error: { message: `Upload failed: ${response.status} - ${errorText}` } };
    }

    // Build public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${PROMPT_IMAGES_BUCKET}/${fileName}`;

    return {
      url: publicUrl,
      path: fileName,
      error: null
    };
  } catch (err: any) {
    console.error('Error in uploadPromptImage:', err);
    return { url: null, path: null, error: { message: err.message || 'Failed to upload image' } };
  }
}

// ============================================================================
// UPLOAD PROFILE PHOTO
// ============================================================================

export async function uploadProfilePhoto(file: File): Promise<{
  url: string | null;
  path: string | null;
  error: any;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      return { url: null, path: null, error: { message: 'You must be signed in to upload photos' } };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { url: null, path: null, error: { message: 'Only JPEG, PNG, and WebP images are allowed' } };
    }

    // Validate file size (5MB max for profile photos)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: null, path: null, error: { message: 'Profile photo must be less than 5MB' } };
    }

    // Generate filename (one per user, will be overwritten)
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/avatar.${fileExt}`;

    console.log('Uploading profile photo to Supabase Storage:', fileName);

    // Upload to Supabase Storage (upsert to replace existing)
    const { data, error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace existing avatar
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { url: null, path: null, error };
    }

    // Get public URL with cache busting
    const { data: { publicUrl } } = supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .getPublicUrl(data.path);

    // Add cache buster to force reload
    const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

    console.log('✅ Profile photo uploaded successfully:', urlWithCacheBuster);

    return {
      url: urlWithCacheBuster,
      path: data.path,
      error: null
    };
  } catch (err) {
    console.error('Error in uploadProfilePhoto:', err);
    return { url: null, path: null, error: err };
  }
}

// ============================================================================
// DELETE IMAGE
// ============================================================================

export async function deleteImage(bucket: string, path: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      return { error };
    }

    console.log('✅ Image deleted successfully:', path);
    return { error: null };
  } catch (err) {
    console.error('Error in deleteImage:', err);
    return { error: err };
  }
}

// ============================================================================
// GET IMAGE URL
// ============================================================================

export function getImageUrl(bucket: string, path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return publicUrl;
}

// ============================================================================
// HELPER: Create buckets if they don't exist (for admin use)
// ============================================================================
// NOTE: Buckets should be created in Supabase Dashboard, not programmatically
// This is just for reference. In Dashboard, create:
// 1. 'prompt-images' bucket (public)
// 2. 'profile-photos' bucket (public)
//
// Storage Policies to add in Dashboard:
//
// For prompt-images bucket:
// - SELECT: Allow all (public read)
// - INSERT: Allow authenticated users (auth.role() = 'authenticated')
// - UPDATE: Allow owner (auth.uid()::text = (storage.foldername(name))[1])
// - DELETE: Allow owner (auth.uid()::text = (storage.foldername(name))[1])
//
// For profile-photos bucket:
// - SELECT: Allow all (public read)
// - INSERT: Allow authenticated users
// - UPDATE: Allow owner
// - DELETE: Allow owner
