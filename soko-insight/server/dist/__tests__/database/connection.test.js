"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../setup");
const testHelpers_1 = require("../helpers/testHelpers");
describe('Database Connection', () => {
    it('should connect to test database', async () => {
        const pool = (0, setup_1.getTestPool)();
        const result = await pool.query('SELECT NOW() as current_time');
        expect(result.rows).toBeDefined();
        expect(result.rows[0].current_time).toBeDefined();
    });
    it('should have users table', async () => {
        const exists = await (0, testHelpers_1.tableExists)('users');
        expect(exists).toBe(true);
    });
    it('should have sales_channels table', async () => {
        const exists = await (0, testHelpers_1.tableExists)('sales_channels');
        expect(exists).toBe(true);
    });
    it('should have products table', async () => {
        const exists = await (0, testHelpers_1.tableExists)('products');
        expect(exists).toBe(true);
    });
    it('should have sales_data table', async () => {
        const exists = await (0, testHelpers_1.tableExists)('sales_data');
        expect(exists).toBe(true);
    });
    it('should start with empty tables', async () => {
        const userCount = await (0, testHelpers_1.getTableRowCount)('users');
        const channelCount = await (0, testHelpers_1.getTableRowCount)('sales_channels');
        const productCount = await (0, testHelpers_1.getTableRowCount)('products');
        const salesCount = await (0, testHelpers_1.getTableRowCount)('sales_data');
        expect(userCount).toBe(0);
        expect(channelCount).toBe(0);
        expect(productCount).toBe(0);
        expect(salesCount).toBe(0);
    });
});
//# sourceMappingURL=connection.test.js.map