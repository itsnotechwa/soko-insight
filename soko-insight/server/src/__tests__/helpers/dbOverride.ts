import { getTestPool } from '../setup';

/**
 * Override the database query function to use test database
 * This should be called at the start of each test file
 */
export function overrideDatabaseForTests(): void {
  // We'll need to mock the query function from config/database
  // This is a workaround since we can't easily override module exports
  // We'll handle this in individual test files by mocking the module
}

/**
 * Get a query function that uses the test database pool
 */
export async function testQuery<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getTestPool();
  const result = await pool.query(text, params);
  return { rows: result.rows, rowCount: result.rowCount || 0 };
}


