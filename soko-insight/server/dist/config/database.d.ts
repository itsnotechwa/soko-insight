import { Pool } from 'pg';
export declare const pool: Pool;
export declare function testConnection(): Promise<boolean>;
export declare function query<T = any>(text: string, params?: any[]): Promise<{
    rows: T[];
    rowCount: number;
}>;
export declare function transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
export default pool;
//# sourceMappingURL=database.d.ts.map