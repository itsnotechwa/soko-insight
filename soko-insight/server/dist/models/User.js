"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
exports.toPublicUser = toPublicUser;
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pricing_1 = require("../config/pricing");
// Convert database row to User object
function rowToUser(row) {
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
function toPublicUser(user) {
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
class UserModel {
    // Find user by ID
    static async findById(id) {
        const { rows } = await (0, database_1.query)('SELECT * FROM users WHERE id = $1', [id]);
        return rows.length > 0 ? rowToUser(rows[0]) : null;
    }
    // Find user by email
    static async findByEmail(email) {
        const { rows } = await (0, database_1.query)('SELECT * FROM users WHERE email = $1', [email]);
        return rows.length > 0 ? rowToUser(rows[0]) : null;
    }
    // Create new user
    static async create(input) {
        const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
        const subscriptionTier = (0, pricing_1.getDefaultSubscriptionTier)(input.sellerType);
        const { rows } = await (0, database_1.query)(`INSERT INTO users (email, password_hash, business_name, phone, seller_type, subscription_tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [input.email, passwordHash, input.businessName, input.phone || null, input.sellerType, subscriptionTier]);
        return rowToUser(rows[0]);
    }
    // Update user
    static async update(id, input) {
        const updates = [];
        const values = [];
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
        const { rows } = await (0, database_1.query)(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        return rows.length > 0 ? rowToUser(rows[0]) : null;
    }
    // Update password
    static async updatePassword(id, newPassword) {
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        const { rowCount } = await (0, database_1.query)('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
        return rowCount > 0;
    }
    // Verify password
    static async verifyPassword(user, password) {
        return bcryptjs_1.default.compare(password, user.passwordHash);
    }
    // Update last login
    static async updateLastLogin(id) {
        await (0, database_1.query)('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    }
    // Deactivate user
    static async deactivate(id) {
        const { rowCount } = await (0, database_1.query)('UPDATE users SET is_active = false WHERE id = $1', [id]);
        return rowCount > 0;
    }
    // Get user count by seller type
    static async countBySellerType() {
        const { rows } = await (0, database_1.query)(`SELECT seller_type, COUNT(*) as count 
       FROM users 
       WHERE is_active = true 
       GROUP BY seller_type`);
        const counts = {
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
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map