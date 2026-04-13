"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestUser = createTestUser;
exports.createTestUsers = createTestUsers;
exports.getAuthHeader = getAuthHeader;
exports.wait = wait;
exports.executeTestQuery = executeTestQuery;
exports.tableExists = tableExists;
exports.getTableRowCount = getTableRowCount;
const setup_1 = require("../setup");
const User_1 = require("../../models/User");
const auth_1 = require("../../middleware/auth");
/**
 * Create a test user in the database
 */
async function createTestUser(overrides) {
    const defaultUser = {
        email: `test${Date.now()}@example.com`,
        password: 'Test123456',
        businessName: 'Test Business',
        phone: '+254712345678',
        sellerType: 'small_trader',
        ...overrides,
    };
    const user = await User_1.UserModel.create({
        email: defaultUser.email,
        password: defaultUser.password,
        businessName: defaultUser.businessName,
        phone: defaultUser.phone,
        sellerType: defaultUser.sellerType,
    });
    const token = (0, auth_1.generateToken)({
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        sellerType: user.sellerType,
        subscriptionTier: user.subscriptionTier,
    });
    return {
        id: user.id,
        email: user.email,
        password: defaultUser.password,
        businessName: user.businessName,
        phone: user.phone || undefined,
        sellerType: user.sellerType,
        token,
    };
}
/**
 * Create multiple test users
 */
async function createTestUsers(count, sellerType) {
    const users = [];
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
function getAuthHeader(token) {
    return {
        Authorization: `Bearer ${token}`,
    };
}
/**
 * Wait for a specified number of milliseconds
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Execute a raw SQL query in test database
 */
async function executeTestQuery(text, params) {
    const pool = (0, setup_1.getTestPool)();
    const result = await pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount || 0 };
}
/**
 * Check if a table exists in the test database
 */
async function tableExists(tableName) {
    const pool = (0, setup_1.getTestPool)();
    const { rows } = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)", [tableName]);
    return rows[0].exists;
}
/**
 * Get row count from a table
 */
async function getTableRowCount(tableName) {
    const pool = (0, setup_1.getTestPool)();
    const { rows } = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(rows[0].count, 10);
}
//# sourceMappingURL=testHelpers.js.map