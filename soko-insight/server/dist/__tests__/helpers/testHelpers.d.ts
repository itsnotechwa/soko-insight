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
export declare function createTestUser(overrides?: Partial<TestUser>): Promise<TestUser>;
/**
 * Create multiple test users
 */
export declare function createTestUsers(count: number, sellerType?: 'small_trader' | 'ecommerce' | 'wholesaler'): Promise<TestUser[]>;
/**
 * Get authorization header for a test user
 */
export declare function getAuthHeader(token: string): {
    Authorization: string;
};
/**
 * Wait for a specified number of milliseconds
 */
export declare function wait(ms: number): Promise<void>;
/**
 * Execute a raw SQL query in test database
 */
export declare function executeTestQuery<T = any>(text: string, params?: any[]): Promise<{
    rows: T[];
    rowCount: number;
}>;
/**
 * Check if a table exists in the test database
 */
export declare function tableExists(tableName: string): Promise<boolean>;
/**
 * Get row count from a table
 */
export declare function getTableRowCount(tableName: string): Promise<number>;
//# sourceMappingURL=testHelpers.d.ts.map