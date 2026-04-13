import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...\n');
  
  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Get already executed migrations
    const { rows: executedMigrations } = await pool.query(
      'SELECT name FROM migrations'
    );
    const executedNames = new Set(executedMigrations.map(m => m.name));
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedNames.has(file)) {
        console.log(`📄 Running migration: ${file}`);
        
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        
        console.log(`✅ Completed: ${file}\n`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

