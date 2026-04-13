import { Pool } from 'pg';
import { getTestPool } from '../setup';
import { UserModel } from '../../models/User';
import { SalesChannelModel } from '../../models/SalesChannel';
import { generateToken } from '../../middleware/auth';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  businessName: string;
  phone?: string;
  sellerType: 'small_trader' | 'ecommerce' | 'wholesaler';
  token?: string;
}

/**
 * Create a test user in the database
 */
export async function createTestUser(overrides?: Partial<TestUser>): Promise<TestUser> {
  const defaultUser: Partial<TestUser> = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123456',
    businessName: 'Test Business',
    phone: '+254712345678',
    sellerType: 'small_trader',
    ...overrides,
  };

  const user = await UserModel.create({
    email: defaultUser.email!,
    password: defaultUser.password!,
    businessName: defaultUser.businessName!,
    phone: defaultUser.phone,
    sellerType: defaultUser.sellerType!,
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    businessName: user.businessName,
    sellerType: user.sellerType,
    subscriptionTier: user.subscriptionTier,
  });

  return {
    id: user.id,
    email: user.email,
    password: defaultUser.password!,
    businessName: user.businessName,
    phone: user.phone || undefined,
    sellerType: user.sellerType,
    token,
  };
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number, sellerType?: 'small_trader' | 'ecommerce' | 'wholesaler'): Promise<TestUser[]> {
  const users: TestUser[] = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      email: `test${Date.now()}-${i}@example.com`,
      sellerType: sellerType || 'small_trader',
    });
    users.push(user);
  }
  return users;
}

/**
 * Get authorization header for a test user
 */
export function getAuthHeader(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a raw SQL query in test database
 */
export async function executeTestQuery<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getTestPool();
  const result = await pool.query(text, params);
  return { rows: result.rows, rowCount: result.rowCount || 0 };
}

/**
 * Check if a table exists in the test database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const pool = getTestPool();
  const { rows } = await pool.query(
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
    [tableName]
  );
  return rows[0].exists;
}

/**
 * Get row count from a table
 */
export async function getTableRowCount(tableName: string): Promise<number> {
  const pool = getTestPool();
  const { rows } = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(rows[0].count, 10);
}


