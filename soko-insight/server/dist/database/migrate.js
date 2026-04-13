"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function runMigrations() {
    console.log('🚀 Starting database migrations...\n');
    try {
        // Create migrations tracking table if it doesn't exist
        await database_1.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Get list of migration files
        const migrationsDir = path_1.default.join(__dirname, '../../database/migrations');
        if (!fs_1.default.existsSync(migrationsDir)) {
            fs_1.default.mkdirSync(migrationsDir, { recursive: true });
        }
        const migrationFiles = fs_1.default.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        // Get already executed migrations
        const { rows: executedMigrations } = await database_1.pool.query('SELECT name FROM migrations');
        const executedNames = new Set(executedMigrations.map(m => m.name));
        // Run pending migrations
        for (const file of migrationFiles) {
            if (!executedNames.has(file)) {
                console.log(`📄 Running migration: ${file}`);
                const sql = fs_1.default.readFileSync(path_1.default.join(migrationsDir, file), 'utf-8');
                await database_1.pool.query(sql);
                await database_1.pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                console.log(`✅ Completed: ${file}\n`);
            }
        }
        console.log('🎉 All migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
    finally {
        await database_1.pool.end();
    }
}
runMigrations();
//# sourceMappingURL=migrate.js.map