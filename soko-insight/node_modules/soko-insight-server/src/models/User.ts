import { query } from '../config/database';
import bcrypt from 'bcryptjs';
import { getDefaultSubscriptionTier, SubscriptionTier } from '../config/pricing';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  businessName: string;
  phone: string | null;
  sellerType: 'small_trader' | 'ecommerce' | 'wholesaler';
  subscriptionTier: SubscriptionTier;
  languagePreference: 'en' | 'sw';
  emailNotifications: boolean;
  smsNotifications: boolean;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  businessName: string;
  phone?: string;
  sellerType: 'small_trader' | 'ecommerce' | 'wholesaler';
}

export interface UpdateUserInput {
  businessName?: string;
  phone?: string;
  languagePreference?: 'en' | 'sw';
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  subscriptionTier?: SubscriptionTier;
}

export interface UserPublic {
  id: string;
  email: string;
  businessName: string;
  phone: string | null;
  sellerType: string;
  subscriptionTier: string;
  languagePreference: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  createdAt: Date;
}

// Convert database row to User object
function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    businessName: row.business_name,
    phone: row.phone,
    sellerType: row.seller_type,
    subscriptionTier: row.subscription_tier,
    languagePreference: row.language_preference,
    emailNotifications: row.email_notifications,
    smsNotifications: row.sms_notifications,
    isActive: row.is_active,
    isVerified: row.is_verified,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert User to public-safe object (no password)
export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    businessName: user.businessName,
    phone: user.phone,
    sellerType: user.sellerType,
    subscriptionTier: user.subscriptionTier,
    languagePreference: user.languagePreference,
    emailNotifications: user.emailNotifications,
    smsNotifications: user.smsNotifications,
    createdAt: user.createdAt,
  };
}

export class UserModel {
  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows.length > 0 ? rowToUser(rows[0]) : null;
  }
  
  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows.length > 0 ? rowToUser(rows[0]) : null;
  }
  
  // Create new user
  static async create(input: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const subscriptionTier = getDefaultSubscriptionTier(input.sellerType);
    
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, business_name, phone, seller_type, subscription_tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [input.email, passwordHash, input.businessName, input.phone || null, input.sellerType, subscriptionTier]
    );
    
    return rowToUser(rows[0]);
  }
  
  // Update user
  static async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (input.businessName !== undefined) {
      updates.push(`business_name = $${paramIndex++}`);
      values.push(input.businessName);
    }
    if (input.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(input.phone);
    }
    if (input.languagePreference !== undefined) {
      updates.push(`language_preference = $${paramIndex++}`);
      values.push(input.languagePreference);
    }
    if (input.emailNotifications !== undefined) {
      updates.push(`email_notifications = $${paramIndex++}`);
      values.push(input.emailNotifications);
    }
    if (input.smsNotifications !== undefined) {
      updates.push(`sms_notifications = $${paramIndex++}`);
      values.push(input.smsNotifications);
    }
    if (input.subscriptionTier !== undefined) {
      updates.push(`subscription_tier = $${paramIndex++}`);
      values.push(input.subscriptionTier);
    }
    
    if (updates.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    
    const { rows } = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return rows.length > 0 ? rowToUser(rows[0]) : null;
  }
  
  // Update password
  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    const { rowCount } = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );
    
    return rowCount > 0;
  }
  
  // Verify password
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
  
  // Update last login
  static async updateLastLogin(id: string): Promise<void> {
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }
  
  // Deactivate user
  static async deactivate(id: string): Promise<boolean> {
    const { rowCount } = await query(
      'UPDATE users SET is_active = false WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  }
  
  // Get user count by seller type
  static async countBySellerType(): Promise<Record<string, number>> {
    const { rows } = await query(
      `SELECT seller_type, COUNT(*) as count 
       FROM users 
       WHERE is_active = true 
       GROUP BY seller_type`
    );
    
    const counts: Record<string, number> = {
      small_trader: 0,
      ecommerce: 0,
      wholesaler: 0,
    };
    
    rows.forEach((row) => {
      counts[row.seller_type] = Number(row.count);
    });
    
    return counts;
  }
}

