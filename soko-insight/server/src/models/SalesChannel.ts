import { query } from '../config/database';

export interface SalesChannel {
  id: string;
  userId: string;
  channelName: string;
  channelType: 'online' | 'offline' | 'mpesa';
  platform: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSalesChannelInput {
  userId: string;
  channelName: string;
  channelType: 'online' | 'offline' | 'mpesa';
  platform?: string;
  description?: string;
}

export interface UpdateSalesChannelInput {
  channelName?: string;
  channelType?: 'online' | 'offline' | 'mpesa';
  platform?: string;
  description?: string;
  isActive?: boolean;
}

function rowToSalesChannel(row: any): SalesChannel {
  return {
    id: row.id,
    userId: row.user_id,
    channelName: row.channel_name,
    channelType: row.channel_type,
    platform: row.platform,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SalesChannelModel {
  // Find channel by ID
  static async findById(id: string, userId?: string): Promise<SalesChannel | null> {
    let sql = 'SELECT * FROM sales_channels WHERE id = $1';
    const params: any[] = [id];
    
    if (userId) {
      sql += ' AND user_id = $2';
      params.push(userId);
    }
    
    const { rows } = await query(sql, params);
    return rows.length > 0 ? rowToSalesChannel(rows[0]) : null;
  }
  
  // Find all channels for a user
  static async findByUserId(userId: string, includeInactive: boolean = false): Promise<SalesChannel[]> {
    let sql = 'SELECT * FROM sales_channels WHERE user_id = $1';
    
    if (!includeInactive) {
      sql += ' AND is_active = true';
    }
    
    sql += ' ORDER BY created_at ASC';
    
    const { rows } = await query(sql, [userId]);
    return rows.map(rowToSalesChannel);
  }
  
  // Create channel
  static async create(input: CreateSalesChannelInput): Promise<SalesChannel> {
    const { rows } = await query(
      `INSERT INTO sales_channels (user_id, channel_name, channel_type, platform, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.userId,
        input.channelName,
        input.channelType,
        input.platform || null,
        input.description || null,
      ]
    );
    
    return rowToSalesChannel(rows[0]);
  }
  
  // Update channel
  static async update(id: string, userId: string, input: UpdateSalesChannelInput): Promise<SalesChannel | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    const fieldMap: Record<string, string> = {
      channelName: 'channel_name',
      channelType: 'channel_type',
      platform: 'platform',
      description: 'description',
      isActive: 'is_active',
    };
    
    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (input[key as keyof UpdateSalesChannelInput] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        values.push(input[key as keyof UpdateSalesChannelInput]);
      }
    }
    
    if (updates.length === 0) {
      return this.findById(id, userId);
    }
    
    values.push(id, userId);
    
    const { rows } = await query(
      `UPDATE sales_channels SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );
    
    return rows.length > 0 ? rowToSalesChannel(rows[0]) : null;
  }
  
  // Delete channel (soft delete)
  static async delete(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await query(
      'UPDATE sales_channels SET is_active = false WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  }
  
  // Count channels by user
  static async countByUser(userId: string): Promise<number> {
    const { rows } = await query(
      'SELECT COUNT(*) as count FROM sales_channels WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    return parseInt(rows[0].count, 10);
  }
  
  // Create default channels for new user
  static async createDefaults(userId: string, sellerType: string): Promise<SalesChannel[]> {
    const defaults: CreateSalesChannelInput[] = [];
    
    switch (sellerType) {
      case 'small_trader':
        defaults.push({
          userId,
          channelName: 'My Shop',
          channelType: 'offline',
          platform: 'shop',
        });
        break;
        
      case 'ecommerce':
        defaults.push(
          {
            userId,
            channelName: 'Jumia',
            channelType: 'online',
            platform: 'jumia',
          },
          {
            userId,
            channelName: 'Offline Sales',
            channelType: 'offline',
            platform: 'shop',
          }
        );
        break;
        
      case 'wholesaler':
        defaults.push(
          {
            userId,
            channelName: 'Warehouse',
            channelType: 'offline',
            platform: 'warehouse',
          },
          {
            userId,
            channelName: 'M-Pesa',
            channelType: 'mpesa',
            platform: 'mpesa',
          }
        );
        break;
    }
    
    const channels: SalesChannel[] = [];
    for (const input of defaults) {
      const channel = await this.create(input);
      channels.push(channel);
    }
    
    return channels;
  }
}

