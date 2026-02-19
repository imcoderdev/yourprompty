-- ============================================================================
-- FIX RLS POLICIES - Allow Public Read Access to Prompts
-- ============================================================================
-- Run this in your Supabase SQL Editor to allow logged-out users to view prompts
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Prompts are viewable by everyone" ON public.prompts;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.prompt_likes;

-- Recreate policies with public read access
-- ============================================================================
-- PROMPTS - Allow everyone (including anonymous) to read
-- ============================================================================
CREATE POLICY "Prompts are viewable by everyone"
  ON public.prompts FOR SELECT
  USING (true);

-- ============================================================================
-- PROFILES - Allow everyone to read profiles
-- ============================================================================
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- ============================================================================
-- LIKES - Allow everyone to see like counts
-- ============================================================================
CREATE POLICY "Likes are viewable by everyone"
  ON public.prompt_likes FOR SELECT
  USING (true);

-- Verify RLS is enabled but allows public reads
-- Run these to check:
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('prompts', 'profiles', 'prompt_likes');
