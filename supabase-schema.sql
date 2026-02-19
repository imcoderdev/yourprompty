-- ============================================================================
-- YourPrompty - Supabase Database Schema
-- ============================================================================
-- Run this script in the Supabase SQL Editor to create all necessary tables
-- with Row Level Security (RLS) policies for your serverless architecture.
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================
-- This table stores additional user profile information beyond what Supabase Auth provides
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  user_id VARCHAR(30) UNIQUE NOT NULL, -- Username/handle
  profile_photo TEXT,
  tagline TEXT,
  
  -- Social media links
  instagram VARCHAR(100),
  twitter VARCHAR(100),
  linkedin VARCHAR(100),
  github VARCHAR(100),
  youtube VARCHAR(100),
  tiktok VARCHAR(100),
  website VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles (public read)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- PROMPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prompts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_email VARCHAR(255) NOT NULL, -- Denormalized for easy queries
  
  -- Content
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'General',
  
  -- Image storage (Supabase Storage path)
  image_url TEXT,
  image_path TEXT, -- Storage path e.g., 'prompt-images/abc123.jpg'
  
  -- Engagement metrics
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for prompts
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_author_email ON public.prompts(author_email);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_like_count ON public.prompts(like_count DESC);

-- Full-text search index for title and content
CREATE INDEX IF NOT EXISTS idx_prompts_search ON public.prompts 
  USING GIN (to_tsvector('english', title || ' ' || content));

-- Trigger for updated_at
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for prompts
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Everyone can view prompts
CREATE POLICY "Prompts are viewable by everyone"
  ON public.prompts FOR SELECT
  USING (true);

-- Authenticated users can create prompts
CREATE POLICY "Authenticated users can create prompts"
  ON public.prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own prompts
CREATE POLICY "Users can update their own prompts"
  ON public.prompts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own prompts
CREATE POLICY "Users can delete their own prompts"
  ON public.prompts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROMPT_LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prompt_likes (
  id BIGSERIAL PRIMARY KEY,
  prompt_id BIGINT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL, -- Denormalized
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate likes
  CONSTRAINT uq_prompt_like UNIQUE (prompt_id, user_id)
);

-- Create indexes for likes
CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON public.prompt_likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_user_id ON public.prompt_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_created_at ON public.prompt_likes(created_at DESC);

-- RLS Policies for likes
ALTER TABLE public.prompt_likes ENABLE ROW LEVEL SECURITY;

-- Everyone can view likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.prompt_likes FOR SELECT
  USING (true);

-- Authenticated users can like prompts
CREATE POLICY "Authenticated users can like prompts"
  ON public.prompt_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete) their own likes
CREATE POLICY "Users can unlike prompts"
  ON public.prompt_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROMPT_COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prompt_comments (
  id BIGSERIAL PRIMARY KEY,
  prompt_id BIGINT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL, -- Denormalized
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_prompt_comments_prompt_id ON public.prompt_comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_user_id ON public.prompt_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_created_at ON public.prompt_comments(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_prompt_comments_updated_at
  BEFORE UPDATE ON public.prompt_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for comments
ALTER TABLE public.prompt_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.prompt_comments FOR SELECT
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.prompt_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.prompt_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.prompt_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FOLLOWERS TABLE (Social following system)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.followers (
  id BIGSERIAL PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  follower_email VARCHAR(255) NOT NULL, -- Denormalized
  followee_email VARCHAR(255) NOT NULL, -- Denormalized
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate follows and self-following
  CONSTRAINT uq_follow UNIQUE (follower_id, followee_id),
  CONSTRAINT chk_no_self_follow CHECK (follower_id != followee_id)
);

-- Create indexes for followers
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_followee_id ON public.followers(followee_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON public.followers(created_at DESC);

-- RLS Policies for followers
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Everyone can view follow relationships
CREATE POLICY "Follow relationships are viewable by everyone"
  ON public.followers FOR SELECT
  USING (true);

-- Authenticated users can follow others
CREATE POLICY "Authenticated users can follow others"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete)
CREATE POLICY "Users can unfollow"
  ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================================================
-- USER_INTERACTIONS TABLE (For recommendation engine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL, -- Denormalized
  prompt_id BIGINT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL, -- 'view', 'like', 'copy', 'comment'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Allow multiple interactions of same type (e.g., multiple views)
  CONSTRAINT uq_interaction UNIQUE (user_id, prompt_id, interaction_type, created_at)
);

-- Create indexes for interactions
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_prompt_id ON public.user_interactions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON public.user_interactions(created_at DESC);

-- RLS Policies for interactions
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own interactions
CREATE POLICY "Users can view their own interactions"
  ON public.user_interactions FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can track their interactions
CREATE POLICY "Authenticated users can track interactions"
  ON public.user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RECOMMENDATION_CACHE TABLE (Precomputed recommendations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.recommendation_cache (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL, -- Denormalized
  prompt_id BIGINT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL, -- 0.00 to 100.00
  reason VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT uq_recommendation UNIQUE (user_id, prompt_id)
);

-- Create indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_user_id ON public.recommendation_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_score ON public.recommendation_cache(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_updated_at ON public.recommendation_cache(updated_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_recommendation_cache_updated_at
  BEFORE UPDATE ON public.recommendation_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for recommendations
ALTER TABLE public.recommendation_cache ENABLE ROW LEVEL SECURITY;

-- Users can only view their own recommendations
CREATE POLICY "Users can view their own recommendations"
  ON public.recommendation_cache FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'userId', LOWER(SPLIT_PART(NEW.email, '@', 1)))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user when auth.users gets a new row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to increment like count when a like is added
CREATE OR REPLACE FUNCTION increment_prompt_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.prompts
  SET like_count = like_count + 1
  WHERE id = NEW.prompt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call increment_prompt_like_count
CREATE TRIGGER on_prompt_liked
  AFTER INSERT ON public.prompt_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_prompt_like_count();

-- Function to decrement like count when a like is removed
CREATE OR REPLACE FUNCTION decrement_prompt_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.prompts
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = OLD.prompt_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call decrement_prompt_like_count
CREATE TRIGGER on_prompt_unliked
  AFTER DELETE ON public.prompt_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_prompt_like_count();

-- Function to increment comment count when a comment is added
CREATE OR REPLACE FUNCTION increment_prompt_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.prompts
  SET comment_count = comment_count + 1
  WHERE id = NEW.prompt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call increment_prompt_comment_count
CREATE TRIGGER on_prompt_commented
  AFTER INSERT ON public.prompt_comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_prompt_comment_count();

-- Function to decrement comment count when a comment is deleted
CREATE OR REPLACE FUNCTION decrement_prompt_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.prompts
  SET comment_count = GREATEST(comment_count - 1, 0)
  WHERE id = OLD.prompt_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call decrement_prompt_comment_count
CREATE TRIGGER on_prompt_comment_deleted
  AFTER DELETE ON public.prompt_comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_prompt_comment_count();

-- ============================================================================
-- STORAGE BUCKET POLICIES (Run this in Supabase Dashboard > Storage)
-- ============================================================================
-- Already created: 'prompt-images' bucket (public)

-- Allow authenticated users to upload images
-- CREATE POLICY "Authenticated users can upload prompt images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'prompt-images' AND auth.role() = 'authenticated');

-- Allow anyone to view images (public bucket)
-- CREATE POLICY "Anyone can view prompt images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'prompt-images');

-- Allow users to update their own images
-- CREATE POLICY "Users can update their own images"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'prompt-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own images
-- CREATE POLICY "Users can delete their own images"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'prompt-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- HELPFUL QUERIES FOR TESTING
-- ============================================================================

-- View all profiles
-- SELECT * FROM public.profiles;

-- View all prompts with author info
-- SELECT p.*, pr.name, pr.user_id, pr.profile_photo
-- FROM public.prompts p
-- JOIN public.profiles pr ON p.user_id = pr.id
-- ORDER BY p.created_at DESC;

-- Get like count for a prompt
-- SELECT p.id, p.title, COUNT(pl.id) as like_count
-- FROM public.prompts p
-- LEFT JOIN public.prompt_likes pl ON p.id = pl.prompt_id
-- GROUP BY p.id;

-- Get followers count for a user
-- SELECT pr.name, 
--   (SELECT COUNT(*) FROM followers WHERE followee_id = pr.id) as followers,
--   (SELECT COUNT(*) FROM followers WHERE follower_id = pr.id) as following
-- FROM public.profiles pr;

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================
-- Next Steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Configure Storage policies in Supabase Dashboard
-- 3. Update your frontend to use the TypeScript types (see supabase-types.ts)
-- 4. Replace API calls with Supabase client queries
-- ============================================================================
