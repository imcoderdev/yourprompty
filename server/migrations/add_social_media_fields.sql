-- Add social media and tagline fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tagline VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_instagram ON users(instagram);
CREATE INDEX IF NOT EXISTS idx_users_twitter ON users(twitter);
