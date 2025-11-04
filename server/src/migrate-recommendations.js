import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConnection } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../migrations/create_recommendations_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running recommendations migration...');
    
    const conn = await getConnection();
    await conn.query(sql);
    
    console.log('✅ Recommendations tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
