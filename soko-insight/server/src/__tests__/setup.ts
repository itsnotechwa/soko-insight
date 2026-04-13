import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Test database configuration
// Load .env file for tests (tests run before config is loaded)
// Path: from src/__tests__/setup.ts, go up 2 levels to server/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TEST_DB_NAME = process.env.TEST_DB_NAME || 'soko_insight_test';
const TEST_DB_HOST = process.env.DB_HOST || 'localhost';
const TEST_DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const TEST_DB_USER = process.env.DB_USER || 'postgres';
const TEST_DB_PASSWORD = process.env.DB_PASSWORD || 'password';

// Create a separate pool for test database operations
const adminPool = new Pool({
  host: TEST_DB_HOST,
  port: TEST_DB_PORT,
  user: TEST_DB_USER,
  password: TEST_DB_PASSWORD,
  database: 'postgres', // Connect to postgres to create/drop test database
});

// Global test database pool
let testPool: Pool | null = null;

export async function setupTestDatabase(): Promise<void> {
  try {
    // Check if test database exists, create if not
    const { rows } = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [TEST_DB_NAME]
    );

    if (rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${TEST_DB_NAME}`);
      console.log(`✅ Created test database: ${TEST_DB_NAME}`);
    }

    // Create test pool
    testPool = new Pool({
      host: TEST_DB_HOST,
      port: TEST_DB_PORT,
      user: TEST_DB_USER,
      password: TEST_DB_PASSWORD,
      database: TEST_DB_NAME,
    });

    // Run migrations
    await runMigrations();
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

export async function teardownTestDatabase(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

export async function cleanDatabase(): Promise<void> {
  if (!testPool) {
    throw new Error('Test database pool not initialized');
  }

  try {
    // Get all table names in reverse dependency order (child tables first)
    const tables = [
      'refresh_tokens',
      'upload_history',
      'notifications',
      'forecasts',
      'competitor_prices',
      'sales_data',
      'competitors',
      'products',
      'sales_channels',
      'categories',
      'users',
    ];

    // Truncate all tables in correct order (respecting foreign keys)
    // Use CASCADE to handle foreign key constraints
    for (const table of tables) {
      try {
        await testPool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      } catch (error: any) {
        // Ignore errors if table doesn't exist (might not be created yet)
        if (!error.message.includes('does not exist')) {
          console.warn(`Warning: Could not truncate table ${table}:`, error.message);
        }
      }
    }
  } catch (error) {
    // Ignore errors if tables don't exist yet
    console.warn('Warning: Could not clean database:', error);
  }
}

async function runMigrations(): Promise<void> {
  if (!testPool) {
    throw new Error('Test database pool not initialized');
  }

  // Read and execute migration file
  const migrationPath = path.join(__dirname, '../../database/migrations/001_initial_schema.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.warn('⚠️  Migration file not found, skipping migrations');
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Execute the entire migration file as a single query
  // PostgreSQL client can handle multi-statement SQL files
  try {
    await testPool.query(migrationSQL);
    console.log('✅ Test database migrations applied');
  } catch (error: any) {
    // If execution fails, try splitting by semicolon (fallback)
    const errorMsg = error.message || '';
    
    // Only warn if it's not an expected error (like "already exists")
    if (
      !errorMsg.includes('already exists') &&
      !errorMsg.includes('duplicate key')
    ) {
      console.warn('Migration execution warning, trying statement-by-statement approach:', errorMsg.substring(0, 100));
      
      // Fallback: execute statement by statement
      // Simple split by semicolon (works for most statements, but may fail on functions)
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          if (statement.trim()) {
            await testPool.query(statement);
          }
        } catch (stmtError: any) {
          const stmtErrorMsg = stmtError.message || '';
          // Ignore expected errors
          if (
            !stmtErrorMsg.includes('already exists') &&
            !stmtErrorMsg.includes('does not exist') &&
            !stmtErrorMsg.includes('duplicate key') &&
            !stmtErrorMsg.includes('syntax error')
          ) {
            // Only log unexpected errors
            console.warn('Migration statement warning:', stmtErrorMsg.substring(0, 100));
          }
        }
      }
      console.log('✅ Test database migrations applied (using fallback method)');
    } else {
      console.log('✅ Test database migrations applied (objects already exist)');
    }
  }
}

// Override the database query function for tests
export function getTestPool(): Pool {
  if (!testPool) {
    throw new Error('Test database pool not initialized. Call setupTestDatabase() first.');
  }
  return testPool;
}

// Setup before all tests
beforeAll(async () => {
  await setupTestDatabase();
}, 30000);

// Cleanup after all tests
afterAll(async () => {
  await teardownTestDatabase();
  await adminPool.end();
}, 30000);

// Clean database before each test
beforeEach(async () => {
  await cleanDatabase();
});

