import postgres from 'postgres';

const {
  DATABASE_HOST = 'db.qpzjevczjpwrrxswxkpa.supabase.co',
  DATABASE_PORT = 5432,
  DATABASE_USER = 'postgres',
  DATABASE_PASSWORD = '',
  DATABASE_NAME = 'yourprompty'
} = process.env;

const {
  DATABASE_URL,
  SUPABASE_USE_SSL = 'true'
} = process.env;

const USE_SSL = SUPABASE_USE_SSL === 'true' || SUPABASE_USE_SSL === '1';

const sql = DATABASE_URL
  ? postgres(DATABASE_URL, { ssl: USE_SSL ? 'require' : undefined })
  : postgres({
      host: DATABASE_HOST,
      port: Number(DATABASE_PORT || 5432),
      username: DATABASE_USER,
      password: DATABASE_PASSWORD,
      database: DATABASE_NAME,
      ssl: USE_SSL ? 'require' : undefined
    });

export async function initDb() {
  // Create tables if not exist (Postgres)
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      email VARCHAR(255) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      user_id VARCHAR(30) NOT NULL UNIQUE,
      profile_photo TEXT NULL,
      password_hash VARCHAR(255) NOT NULL,
      prompt_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  // Safe migrations for existing tables (ignore if they already exist)
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id VARCHAR(30)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_id VARCHAR(255) UNIQUE`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_users_user_id ON users (user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users (supabase_id)`;


  await sql`
    CREATE TABLE IF NOT EXISTS prompts (
      id BIGSERIAL PRIMARY KEY,
      author_email VARCHAR(255) NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'General',
      image_url TEXT NULL,
      image_public_id TEXT NULL,
      like_count INTEGER NOT NULL DEFAULT 0,
      comment_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT fk_prompts_author_email FOREIGN KEY (author_email)
        REFERENCES users(email) ON DELETE CASCADE
    );
  `;

  // Safe alter for new column when migrating existing DB
  await sql`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS image_public_id TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS prompt_likes (
      id BIGSERIAL PRIMARY KEY,
      prompt_id BIGINT NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT uq_prompt_like UNIQUE (prompt_id, user_email),
      CONSTRAINT fk_likes_prompt_id FOREIGN KEY (prompt_id)
        REFERENCES prompts(id) ON DELETE CASCADE,
      CONSTRAINT fk_likes_user_email FOREIGN KEY (user_email)
        REFERENCES users(email) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS prompt_comments (
      id BIGSERIAL PRIMARY KEY,
      prompt_id BIGINT NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT fk_comments_prompt_id FOREIGN KEY (prompt_id)
        REFERENCES prompts(id) ON DELETE CASCADE,
      CONSTRAINT fk_comments_user_email FOREIGN KEY (user_email)
        REFERENCES users(email) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS followers (
      follower_email VARCHAR(255) NOT NULL,
      followee_email VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT uq_follow UNIQUE (follower_email, followee_email),
      CONSTRAINT fk_follower FOREIGN KEY (follower_email) REFERENCES users(email) ON DELETE CASCADE,
      CONSTRAINT fk_followee FOREIGN KEY (followee_email) REFERENCES users(email) ON DELETE CASCADE
    );
  `;

  // Create user_interactions table for tracking behavior
  await sql`
    CREATE TABLE IF NOT EXISTS user_interactions (
      id BIGSERIAL PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      prompt_id BIGINT NOT NULL,
      interaction_type VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT uq_interaction UNIQUE (user_email, prompt_id, interaction_type),
      CONSTRAINT fk_interaction_user FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
      CONSTRAINT fk_interaction_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions (user_email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_interactions_prompt ON user_interactions (prompt_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions (interaction_type)`;

  // Create recommendation_cache table
  await sql`
    CREATE TABLE IF NOT EXISTS recommendation_cache (
      id BIGSERIAL PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      prompt_id BIGINT NOT NULL,
      score NUMERIC(5,2) NOT NULL,
      reason VARCHAR(100),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT uq_recommendation UNIQUE (user_email, prompt_id),
      CONSTRAINT fk_rec_user FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
      CONSTRAINT fk_rec_prompt FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_recommendation_cache_user ON recommendation_cache (user_email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_recommendation_cache_score ON recommendation_cache (score DESC)`;
}

export async function getConnection() {
  // Wrap to mimic { query, release } API using postgres client
  return {
    query: async (text, params) => {
      const rows = await sql.unsafe(text, params);
      return { rows };
    },
    release: () => {}
  };
}

