import { query } from '../config/database';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  category: 'stock' | 'sales' | 'trend' | 'competitor' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  sentEmail: boolean;
  sentSms: boolean;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  category: 'stock' | 'sales' | 'trend' | 'competitor' | 'system';
  title: string;
  message: string;
}

function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    category: row.category,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    sentEmail: row.sent_email,
    sentSms: row.sent_sms,
    createdAt: row.created_at,
  };
}

export class NotificationModel {
  // Find notification by ID
  static async findById(id: string, userId?: string): Promise<Notification | null> {
    let sql = 'SELECT * FROM notifications WHERE id = $1';
    const params: any[] = [id];
    
    if (userId) {
      sql += ' AND user_id = $2';
      params.push(userId);
    }
    
    const { rows } = await query(sql, params);
    return rows.length > 0 ? rowToNotification(rows[0]) : null;
  }
  
  // Find all notifications for a user
  static async findByUserId(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      isRead?: boolean;
      category?: string;
      type?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      isRead,
      category,
      type,
      sortOrder = 'desc',
    } = options;
    
    const offset = (page - 1) * limit;
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (isRead !== undefined) {
      conditions.push(`is_read = $${paramIndex}`);
      params.push(isRead);
      paramIndex++;
    }
    
    if (category) {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    
    if (type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Get notifications
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT * FROM notifications 
       WHERE ${whereClause}
       ORDER BY created_at ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    return {
      notifications: rows.map(rowToNotification),
      total,
    };
  }
  
  // Create notification
  static async create(input: CreateNotificationInput): Promise<Notification> {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, type, category, title, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.userId,
        input.type,
        input.category,
        input.title,
        input.message,
      ]
    );
    
    return rowToNotification(rows[0]);
  }
  
  // Mark notification as read
  static async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const { rows } = await query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    
    return rows.length > 0 ? rowToNotification(rows[0]) : null;
  }
  
  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<number> {
    const { rowCount } = await query(
      `UPDATE notifications SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    
    return rowCount;
  }
  
  // Mark email as sent
  static async markEmailSent(id: string): Promise<void> {
    await query(
      `UPDATE notifications SET sent_email = true WHERE id = $1`,
      [id]
    );
  }
  
  // Mark SMS as sent
  static async markSmsSent(id: string): Promise<void> {
    await query(
      `UPDATE notifications SET sent_sms = true WHERE id = $1`,
      [id]
    );
  }
  
  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    const { rows } = await query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    
    return parseInt(rows[0].count, 10);
  }
  
  // Delete notification
  static async delete(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  }
  
  // Delete old notifications (cleanup)
  static async deleteOld(olderThanDays: number = 90): Promise<number> {
    const { rowCount } = await query(
      `DELETE FROM notifications 
       WHERE created_at < NOW() - INTERVAL '${olderThanDays} days' 
       AND is_read = true`,
      []
    );
    return rowCount;
  }
}






