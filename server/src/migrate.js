import { getConnection } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('Running database migrations...');
  
  try {
    const conn = await getConnection();
    try {
      // Run add_supabase_id migration
      const migrationPath1 = path.join(__dirname, '../migrations/add_supabase_id.sql');
      const sql1 = fs.readFileSync(migrationPath1, 'utf8');
      await conn.query(sql1);
      console.log('✅ Migration 1 (add_supabase_id) completed!');
      
      // Run add_social_media_fields migration
      const migrationPath2 = path.join(__dirname, '../migrations/add_social_media_fields.sql');
      const sql2 = fs.readFileSync(migrationPath2, 'utf8');
      await conn.query(sql2);
      console.log('✅ Migration 2 (add_social_media_fields) completed!');
      
      console.log('🎉 All migrations completed successfully!');
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
  
  process.exit(0);
}

runMigration();
