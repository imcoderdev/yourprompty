import sql from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function addSocialColumns() {
  console.log('Adding social media columns...');
  
  const db = sql(process.env.DATABASE_URL);
  
  try {
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS tagline VARCHAR(200)`;
    console.log('✅ Added tagline column');
    
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram VARCHAR(100)`;
    console.log('✅ Added instagram column');
    
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR(100)`;
    console.log('✅ Added twitter column');
    
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(100)`;
    console.log('✅ Added linkedin column');
    
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS github VARCHAR(100)`;
    console.log('✅ Added github column');
    
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube VARCHAR(100)`;
    console.log('✅ Added youtube column');
    
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok VARCHAR(100)`;
    console.log('✅ Added tiktok column');
    
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255)`;
    console.log('✅ Added website column');
    
    console.log('🎉 All social media columns added successfully!');
    
    await db.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await db.end();
    process.exit(1);
  }
  
  process.exit(0);
}

addSocialColumns();
