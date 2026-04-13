import { query } from '../config/database';

export interface SalesData {
  id: string;
  userId: string;
  productId: string | null;
  channelId: string | null;
  saleDate: Date;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  costAmount: number;
  profitAmount: number;
  entryMethod: 'manual' | 'csv' | 'mpesa' | 'api' | 'quick_entry';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSalesDataInput {
  userId: string;
  productId?: string;
  channelId?: string;
  saleDate: Date;
  quantity: number;
  unitPrice: number;
  costAmount?: number;
  entryMethod?: 'manual' | 'csv' | 'mpesa' | 'api' | 'quick_entry';
  notes?: string;
}

export interface SalesDataWithDetails extends SalesData {
  productName?: string;
  channelName?: string;
}

function rowToSalesData(row: any): SalesData {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    channelId: row.channel_id,
    saleDate: row.sale_date,
    quantity: row.quantity,
    unitPrice: parseFloat(row.unit_price),
    totalAmount: parseFloat(row.total_amount),
    costAmount: parseFloat(row.cost_amount) || 0,
    profitAmount: parseFloat(row.profit_amount) || 0,
    entryMethod: row.entry_method,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToSalesDataWithDetails(row: any): SalesDataWithDetails {
  return {
    ...rowToSalesData(row),
    productName: row.product_name,
    channelName: row.channel_name,
  };
}

export class SalesDataModel {
  // Find by ID
  static async findById(id: string, userId?: string): Promise<SalesData | null> {
    let sql = 'SELECT * FROM sales_data WHERE id = $1';
    const params: any[] = [id];
    
    if (userId) {
      sql += ' AND user_id = $2';
      params.push(userId);
    }
    
    const { rows } = await query(sql, params);
    return rows.length > 0 ? rowToSalesData(rows[0]) : null;
  }
  
  // Find sales data for a user with pagination and filters
  static async findByUserId(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      productId?: string;
      channelId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ sales: SalesDataWithDetails[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      productId,
      channelId,
      sortBy = 'sale_date',
      sortOrder = 'desc',
    } = options;
    
    const offset = (page - 1) * limit;
    const conditions: string[] = ['sd.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (startDate) {
      conditions.push(`sd.sale_date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      conditions.push(`sd.sale_date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }
    
    if (productId) {
      conditions.push(`sd.product_id = $${paramIndex}`);
      params.push(productId);
      paramIndex++;
    }
    
    if (channelId) {
      conditions.push(`sd.channel_id = $${paramIndex}`);
      params.push(channelId);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    const allowedSortFields = ['sale_date', 'total_amount', 'quantity', 'created_at'];
    const sortField = allowedSortFields.includes(sortBy) ? `sd.${sortBy}` : 'sd.sale_date';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM sales_data sd WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Get sales with product and channel names
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT sd.*, p.name as product_name, sc.channel_name
       FROM sales_data sd
       LEFT JOIN products p ON sd.product_id = p.id
       LEFT JOIN sales_channels sc ON sd.channel_id = sc.id
       WHERE ${whereClause}
       ORDER BY ${sortField} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    return {
      sales: rows.map(rowToSalesDataWithDetails),
      total,
    };
  }
  
  // Create sales record
  static async create(input: CreateSalesDataInput): Promise<SalesData> {
    const totalAmount = input.quantity * input.unitPrice;
    const costAmount = input.costAmount || 0;
    const profitAmount = totalAmount - costAmount;
    
    const { rows } = await query(
      `INSERT INTO sales_data (
        user_id, product_id, channel_id, sale_date, quantity,
        unit_price, total_amount, cost_amount, profit_amount, entry_method, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        input.userId,
        input.productId || null,
        input.channelId || null,
        input.saleDate,
        input.quantity,
        input.unitPrice,
        totalAmount,
        costAmount,
        profitAmount,
        input.entryMethod || 'manual',
        input.notes || null,
      ]
    );
    
    return rowToSalesData(rows[0]);
  }
  
  // Bulk create (for CSV imports)
  static async bulkCreate(records: CreateSalesDataInput[]): Promise<{ created: number; failed: number }> {
    let created = 0;
    let failed = 0;
    
    for (const record of records) {
      try {
        await this.create(record);
        created++;
      } catch (error) {
        console.error('Failed to create sales record:', error);
        failed++;
      }
    }
    
    return { created, failed };
  }
  
  // Delete sales record
  static async delete(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await query(
      'DELETE FROM sales_data WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  }
  
  // Get sales summary for a user
  static async getSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    totalQuantity: number;
  }> {
    let sql = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(profit_amount), 0) as total_profit,
        COUNT(*) as total_orders,
        COALESCE(SUM(quantity), 0) as total_quantity
      FROM sales_data
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (startDate) {
      sql += ` AND sale_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND sale_date <= $${paramIndex}`;
      params.push(endDate);
    }
    
    const { rows } = await query(sql, params);
    
    return {
      totalRevenue: parseFloat(rows[0].total_revenue),
      totalProfit: parseFloat(rows[0].total_profit),
      totalOrders: parseInt(rows[0].total_orders, 10),
      totalQuantity: parseInt(rows[0].total_quantity, 10),
    };
  }
  
  // Get daily sales for charts
  static async getDailySales(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: string; revenue: number; orders: number }[]> {
    const { rows } = await query(
      `SELECT 
        sale_date::text as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
       FROM sales_data
       WHERE user_id = $1 AND sale_date >= $2 AND sale_date <= $3
       GROUP BY sale_date
       ORDER BY sale_date ASC`,
      [userId, startDate, endDate]
    );
    
    return rows.map(row => ({
      date: row.date,
      revenue: parseFloat(row.revenue),
      orders: parseInt(row.orders, 10),
    }));
  }
  
  // Get top products by revenue
  static async getTopProducts(
    userId: string,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ productId: string; productName: string; revenue: number; quantity: number }[]> {
    let sql = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        SUM(sd.total_amount) as revenue,
        SUM(sd.quantity) as quantity
      FROM sales_data sd
      JOIN products p ON sd.product_id = p.id
      WHERE sd.user_id = $1 AND sd.product_id IS NOT NULL
    `;
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (startDate) {
      sql += ` AND sd.sale_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND sd.sale_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    sql += ` GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT $${paramIndex}`;
    params.push(limit);
    
    const { rows } = await query(sql, params);
    
    return rows.map(row => ({
      productId: row.product_id,
      productName: row.product_name,
      revenue: parseFloat(row.revenue),
      quantity: parseInt(row.quantity, 10),
    }));
  }
  
  // Get sales by channel
  static async getSalesByChannel(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ channelId: string; channelName: string; revenue: number; orders: number }[]> {
    let sql = `
      SELECT 
        sc.id as channel_id,
        sc.channel_name,
        SUM(sd.total_amount) as revenue,
        COUNT(*) as orders
      FROM sales_data sd
      JOIN sales_channels sc ON sd.channel_id = sc.id
      WHERE sd.user_id = $1 AND sd.channel_id IS NOT NULL
    `;
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (startDate) {
      sql += ` AND sd.sale_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND sd.sale_date <= $${paramIndex}`;
      params.push(endDate);
    }
    
    sql += ' GROUP BY sc.id, sc.channel_name ORDER BY revenue DESC';
    
    const { rows } = await query(sql, params);
    
    return rows.map(row => ({
      channelId: row.channel_id,
      channelName: row.channel_name,
      revenue: parseFloat(row.revenue),
      orders: parseInt(row.orders, 10),
    }));
  }
}

