// ============================================================================
// YourPrompty - TypeScript Database Types
// ============================================================================
// These types match the Supabase schema defined in supabase-schema.sql
// Generated for type-safe database queries with Supabase client
// ============================================================================

// ============================================================================
// DATABASE TABLES
// ============================================================================

export interface Profile {
  id: string; // UUID from auth.users
  email: string;
  name: string;
  user_id: string; // Username/handle
  profile_photo: string | null;
  tagline: string | null;
  
  // Social media links
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  github: string | null;
  youtube: string | null;
  tiktok: string | null;
  website: string | null;
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Prompt {
  id: number;
  user_id: string; // UUID reference to profiles
  author_email: string; // Denormalized for queries
  
  // Content
  title: string;
  content: string;
  category: string;
  
  // Image storage
  image_url: string | null;
  image_path: string | null; // Supabase Storage path
  
  // Engagement metrics
  like_count: number;
  comment_count: number;
  view_count: number;
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface PromptLike {
  id: number;
  prompt_id: number;
  user_id: string; // UUID reference to profiles
  user_email: string; // Denormalized
  created_at: string; // ISO timestamp
}

export interface PromptComment {
  id: number;
  prompt_id: number;
  user_id: string; // UUID reference to profiles
  user_email: string; // Denormalized
  content: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Follower {
  id: number;
  follower_id: string; // UUID reference to profiles
  followee_id: string; // UUID reference to profiles
  follower_email: string; // Denormalized
  followee_email: string; // Denormalized
  created_at: string; // ISO timestamp
}

export interface UserInteraction {
  id: number;
  user_id: string; // UUID reference to profiles
  user_email: string; // Denormalized
  prompt_id: number;
  interaction_type: 'view' | 'like' | 'copy' | 'comment';
  created_at: string; // ISO timestamp
}

export interface RecommendationCache {
  id: number;
  user_id: string; // UUID reference to profiles
  user_email: string; // Denormalized
  prompt_id: number;
  score: number; // 0.00 to 100.00
  reason: string | null;
  updated_at: string; // ISO timestamp
}

// ============================================================================
// JOINED/ENRICHED TYPES (For frontend display)
// ============================================================================

export interface PromptWithAuthor extends Prompt {
  author: {
    name: string;
    email: string;
    user_id: string;
    profile_photo: string | null;
    verified?: boolean;
  };
  liked?: boolean; // Whether current user liked this prompt
}

export interface CommentWithAuthor extends PromptComment {
  author: {
    name: string;
    user_id: string;
    profile_photo: string | null;
  };
}

export interface ProfileWithStats extends Profile {
  stats: {
    prompts_count: number;
    followers_count: number;
    following_count: number;
    total_likes: number;
  };
}

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

export interface CreatePromptInput {
  title: string;
  content: string;
  category: string;
  image?: File; // For upload
}

export interface UpdateProfileInput {
  name?: string;
  user_id?: string;
  profile_photo?: string | File;
  tagline?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export interface CreateCommentInput {
  prompt_id: number;
  content: string;
}

// ============================================================================
// QUERY FILTER TYPES
// ============================================================================

export interface PromptFilters {
  category?: string;
  search?: string;
  userId?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'like_count' | 'comment_count';
  orderDirection?: 'asc' | 'desc';
}

export interface UserSearchFilters {
  query: string;
  limit?: number;
}

// ============================================================================
// ALLOWED VALUES (Enums)
// ============================================================================

export const PROMPT_CATEGORIES = [
  'Photography',
  'Casual',
  'Character',
  'Product Review',
  'Landscape',
  'Digital Art',
  'Abstract',
  'Food',
  'Fashion',
  'Architecture',
  'Coding',
  'UI/UX',
  'Web Design',
  'Logo Design',
  'Branding',
  'Marketing',
  'Social Media',
  'Video',
  'Music',
  'Writing',
  'General'
] as const;

export type PromptCategory = typeof PROMPT_CATEGORIES[number];

export const INTERACTION_TYPES = ['view', 'like', 'copy', 'comment'] as const;
export type InteractionType = typeof INTERACTION_TYPES[number];

// ============================================================================
// SUPABASE CLIENT RESPONSE TYPES
// ============================================================================

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// ============================================================================
// REALTIME SUBSCRIPTION TYPES
// ============================================================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T> {
  eventType: RealtimeEvent;
  new: T;
  old: T;
  table: string;
  schema: string;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthUser {
  id: string; // UUID
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  userId: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface StorageUploadOptions {
  bucket: 'prompt-images';
  path: string; // e.g., 'user-id/filename.jpg'
  file: File;
  contentType?: string;
}

export interface StoragePublicUrl {
  publicUrl: string;
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

// Helper to extract the image URL from Supabase Storage
export function getImageUrl(bucket: string, path: string | null): string | null {
  if (!path) return null;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// Helper to generate avatar URL fallback
export function getAvatarUrl(profile: Pick<Profile, 'name' | 'profile_photo'>): string {
  if (profile.profile_photo) {
    return profile.profile_photo;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`;
}

// Helper to format timestamps
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
}

// Type guard to check if error is SupabaseError
export function isSupabaseError(error: unknown): error is SupabaseError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// ============================================================================
// TYPE EXPORTS FOR SUPABASE CLIENT
// ============================================================================

// This type will be used with Supabase client for type inference
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      prompts: {
        Row: Prompt;
        Insert: Omit<Prompt, 'id' | 'like_count' | 'comment_count' | 'view_count' | 'created_at' | 'updated_at'> & { like_count?: number; comment_count?: number; view_count?: number; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Prompt, 'id'>>;
        Relationships: [];
      };
      prompt_likes: {
        Row: PromptLike;
        Insert: Omit<PromptLike, 'id' | 'created_at'> & { created_at?: string };
        Update: Partial<PromptLike>;
        Relationships: [];
      };
      prompt_comments: {
        Row: PromptComment;
        Insert: Omit<PromptComment, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Pick<PromptComment, 'content'>>;
        Relationships: [];
      };
      followers: {
        Row: Follower;
        Insert: Omit<Follower, 'id' | 'created_at'> & { created_at?: string };
        Update: Partial<Follower>;
        Relationships: [];
      };
      user_interactions: {
        Row: UserInteraction;
        Insert: Omit<UserInteraction, 'id' | 'created_at'> & { created_at?: string };
        Update: Partial<UserInteraction>;
        Relationships: [];
      };
      recommendation_cache: {
        Row: RecommendationCache;
        Insert: Omit<RecommendationCache, 'id' | 'updated_at'> & { updated_at?: string };
        Update: Partial<Pick<RecommendationCache, 'score' | 'reason'>>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
