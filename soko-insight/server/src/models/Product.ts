import { query } from '../config/database';

export interface Product {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  userId: string;
  categoryId?: string;
  name: string;
  sku?: string;
  description?: string;
  costPrice?: number;
  sellingPrice: number;
  currentStock?: number;
  reorderLevel?: number;
  unit?: string;
}

export interface UpdateProductInput {
  categoryId?: string;
  name?: string;
  sku?: string;
  description?: string;
  costPrice?: number;
  sellingPrice?: number;
  currentStock?: number;
  reorderLevel?: number;
  unit?: string;
  isActive?: boolean;
}

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    name: row.name,
    sku: row.sku,
    description: row.description,
    costPrice: parseFloat(row.cost_price) || 0,
    sellingPrice: parseFloat(row.selling_price),
    currentStock: row.current_stock,
    reorderLevel: row.reorder_level,
    unit: row.unit,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProductModel {
  // Find product by ID
  static async findById(id: string, userId?: string): Promise<Product | null> {
    let sql = 'SELECT * FROM products WHERE id = $1';
    const params: any[] = [id];
    
    if (userId) {
      sql += ' AND user_id = $2';
      params.push(userId);
    }
    
    const { rows } = await query(sql, params);
    return rows.length > 0 ? rowToProduct(rows[0]) : null;
  }
  
  // Find all products for a user
  static async findByUserId(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ products: Product[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      isActive,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;
    
    const offset = (page - 1) * limit;
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (categoryId) {
      conditions.push(`category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }
    
    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    const allowedSortFields = ['name', 'selling_price', 'current_stock', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM products WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Get products
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT * FROM products 
       WHERE ${whereClause}
       ORDER BY ${sortField} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    return {
      products: rows.map(rowToProduct),
      total,
    };
  }
  
  // Create product
  static async create(input: CreateProductInput): Promise<Product> {
    const { rows } = await query(
      `INSERT INTO products (
        user_id, category_id, name, sku, description, 
        cost_price, selling_price, current_stock, reorder_level, unit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        input.userId,
        input.categoryId || null,
        input.name,
        input.sku || null,
        input.description || null,
        input.costPrice || 0,
        input.sellingPrice,
        input.currentStock || 0,
        input.reorderLevel || 10,
        input.unit || 'piece',
      ]
    );
    
    return rowToProduct(rows[0]);
  }
  
  // Update product
  static async update(id: string, userId: string, input: UpdateProductInput): Promise<Product | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    const fieldMap: Record<string, string> = {
      categoryId: 'category_id',
      name: 'name',
      sku: 'sku',
      description: 'description',
      costPrice: 'cost_price',
      sellingPrice: 'selling_price',
      currentStock: 'current_stock',
      reorderLevel: 'reorder_level',
      unit: 'unit',
      isActive: 'is_active',
    };
    
    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (input[key as keyof UpdateProductInput] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        values.push(input[key as keyof UpdateProductInput]);
      }
    }
    
    if (updates.length === 0) {
      return this.findById(id, userId);
    }
    
    values.push(id, userId);
    
    const { rows } = await query(
      `UPDATE products SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );
    
    return rows.length > 0 ? rowToProduct(rows[0]) : null;
  }
  
  // Delete product (soft delete)
  static async delete(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await query(
      'UPDATE products SET is_active = false WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  }
  
  // Update stock
  static async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<Product | null> {
    let sql: string;
    
    switch (operation) {
      case 'add':
        sql = 'UPDATE products SET current_stock = current_stock + $1 WHERE id = $2 RETURNING *';
        break;
      case 'subtract':
        sql = 'UPDATE products SET current_stock = GREATEST(0, current_stock - $1) WHERE id = $2 RETURNING *';
        break;
      case 'set':
        sql = 'UPDATE products SET current_stock = $1 WHERE id = $2 RETURNING *';
        break;
    }
    
    const { rows } = await query(sql, [quantity, id]);
    return rows.length > 0 ? rowToProduct(rows[0]) : null;
  }
  
  // Get low stock products
  static async getLowStock(userId: string): Promise<Product[]> {
    const { rows } = await query(
      `SELECT * FROM products 
       WHERE user_id = $1 AND is_active = true AND current_stock <= reorder_level
       ORDER BY current_stock ASC`,
      [userId]
    );
    
    return rows.map(rowToProduct);
  }
  
  // Count products by user
  static async countByUser(userId: string): Promise<number> {
    const { rows } = await query(
      'SELECT COUNT(*) as count FROM products WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    return parseInt(rows[0].count, 10);
  }
}

