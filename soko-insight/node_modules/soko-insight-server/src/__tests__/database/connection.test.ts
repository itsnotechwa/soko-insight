import { getTestPool, setupTestDatabase } from '../setup';
import { tableExists, getTableRowCount } from '../helpers/testHelpers';

describe('Database Connection', () => {
  it('should connect to test database', async () => {
    const pool = getTestPool();
    const result = await pool.query('SELECT NOW() as current_time');
    
    expect(result.rows).toBeDefined();
    expect(result.rows[0].current_time).toBeDefined();
  });

  it('should have users table', async () => {
    const exists = await tableExists('users');
    expect(exists).toBe(true);
  });

  it('should have sales_channels table', async () => {
    const exists = await tableExists('sales_channels');
    expect(exists).toBe(true);
  });

  it('should have products table', async () => {
    const exists = await tableExists('products');
    expect(exists).toBe(true);
  });

  it('should have sales_data table', async () => {
    const exists = await tableExists('sales_data');
    expect(exists).toBe(true);
  });

  it('should start with empty tables', async () => {
    const userCount = await getTableRowCount('users');
    const channelCount = await getTableRowCount('sales_channels');
    const productCount = await getTableRowCount('products');
    const salesCount = await getTableRowCount('sales_data');

    expect(userCount).toBe(0);
    expect(channelCount).toBe(0);
    expect(productCount).toBe(0);
    expect(salesCount).toBe(0);
  });
});


