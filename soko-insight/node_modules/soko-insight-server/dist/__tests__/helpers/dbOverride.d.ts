/**
 * Override the database query function to use test database
 * This should be called at the start of each test file
 */
export declare function overrideDatabaseForTests(): void;
/**
 * Get a query function that uses the test database pool
 */
export declare function testQuery<T = any>(text: string, params?: any[]): Promise<{
    rows: T[];
    rowCount: number;
}>;
//# sourceMappingURL=dbOverride.d.ts.map