"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
exports.query = query;
exports.transaction = transaction;
const pg_1 = require("pg");
const index_1 = require("./index");
// Create PostgreSQL connection pool
// Prefer individual DB_* parameters if DB_PASSWORD is explicitly set (allows overriding DATABASE_URL)
// Otherwise use DATABASE_URL if provided
const useConnectionString = index_1.config.database.url && !process.env.DB_PASSWORD;
exports.pool = new pg_1.Pool(useConnectionString
    ? {
        connectionString: index_1.config.database.url,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    }
    : {
        host: index_1.config.database.host,
        port: index_1.config.database.port,
        database: index_1.config.database.name,
        user: index_1.config.database.user,
        password: index_1.config.database.password,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
// Test database connection
async function testConnection() {
    try {
        const client = await exports.pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
// Query helper with error handling
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        if (index_1.config.nodeEnv === 'development') {
            console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
        }
        return { rows: result.rows, rowCount: result.rowCount || 0 };
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
// Transaction helper
async function transaction(callback) {
    const client = await exports.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
exports.default = exports.pool;
//# sourceMappingURL=database.js.map