import { Pool } from 'pg';
import { config } from './index';

// Create PostgreSQL connection pool
// Prefer individual DB_* parameters if DB_PASSWORD is explicitly set (allows overriding DATABASE_URL)
// Otherwise use DATABASE_URL if provided
const useConnectionString = config.database.url && !process.env.DB_PASSWORD;
export const pool = new Pool(
  useConnectionString
    ? {
        connectionString: config.database.url,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Query helper with error handling
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (config.nodeEnv === 'development') {
      console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
    }
    
    return { rows: result.rows, rowCount: result.rowCount || 0 };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;

