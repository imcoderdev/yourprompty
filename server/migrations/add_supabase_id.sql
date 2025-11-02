-- Add supabase_id column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'supabase_id'
    ) THEN
        ALTER TABLE users ADD COLUMN supabase_id VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);
