-- Create followers table to track who follows whom
CREATE TABLE IF NOT EXISTS followers (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- user who is following
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- user being followed
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- user cannot follow themselves
);

-- Create indexes for followers
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

-- Create user interactions table to track user behavior
CREATE TABLE IF NOT EXISTS user_interactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  prompt_id INTEGER REFERENCES prompts(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL, -- 'like', 'view', 'copy'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, prompt_id, interaction_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_prompt_id ON user_interactions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);

-- Create recommendation cache table (optional, for performance)
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  prompt_id INTEGER REFERENCES prompts(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  reason VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_cache_user_id ON recommendation_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_score ON recommendation_cache(score DESC);
