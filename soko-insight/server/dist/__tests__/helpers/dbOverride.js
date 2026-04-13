"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overrideDatabaseForTests = overrideDatabaseForTests;
exports.testQuery = testQuery;
const setup_1 = require("../setup");
/**
 * Override the database query function to use test database
 * This should be called at the start of each test file
 */
function overrideDatabaseForTests() {
    // We'll need to mock the query function from config/database
    // This is a workaround since we can't easily override module exports
    // We'll handle this in individual test files by mocking the module
}
/**
 * Get a query function that uses the test database pool
 */
async function testQuery(text, params) {
    const pool = (0, setup_1.getTestPool)();
    const result = await pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount || 0 };
}
//# sourceMappingURL=dbOverride.js.map