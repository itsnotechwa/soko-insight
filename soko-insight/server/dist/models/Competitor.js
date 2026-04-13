"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitorPriceModel = exports.CompetitorModel = void 0;
const database_1 = require("../config/database");
function rowToCompetitor(row) {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        platform: row.platform,
        website: row.website,
        notes: row.notes,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function rowToCompetitorPrice(row) {
    return {
        id: row.id,
        productId: row.product_id,
        competitorId: row.competitor_id,
        price: parseFloat(row.price),
        recordedAt: row.recorded_at,
    };
}
class CompetitorModel {
    // Find competitor by ID
    static async findById(id, userId) {
        let sql = 'SELECT * FROM competitors WHERE id = $1';
        const params = [id];
        if (userId) {
            sql += ' AND user_id = $2';
            params.push(userId);
        }
        const { rows } = await (0, database_1.query)(sql, params);
        return rows.length > 0 ? rowToCompetitor(rows[0]) : null;
    }
    // Find all competitors for a user
    static async findByUserId(userId, options = {}) {
        const { page = 1, limit = 20, search, platform, isActive, } = options;
        const offset = (page - 1) * limit;
        const conditions = ['user_id = $1'];
        const params = [userId];
        let paramIndex = 2;
        if (search) {
            conditions.push(`(name ILIKE $${paramIndex} OR platform ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (platform) {
            conditions.push(`platform = $${paramIndex}`);
            params.push(platform);
            paramIndex++;
        }
        if (isActive !== undefined) {
            conditions.push(`is_active = $${paramIndex}`);
            params.push(isActive);
            paramIndex++;
        }
        const whereClause = conditions.join(' AND ');
        // Get total count
        const countResult = await (0, database_1.query)(`SELECT COUNT(*) as total FROM competitors WHERE ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].total, 10);
        // Get competitors
        params.push(limit, offset);
        const { rows } = await (0, database_1.query)(`SELECT * FROM competitors 
       WHERE ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
        return {
            competitors: rows.map(rowToCompetitor),
            total,
        };
    }
    // Create competitor
    static async create(input) {
        const { rows } = await (0, database_1.query)(`INSERT INTO competitors (user_id, name, platform, website, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [
            input.userId,
            input.name,
            input.platform || null,
            input.website || null,
            input.notes || null,
        ]);
        return rowToCompetitor(rows[0]);
    }
    // Update competitor
    static async update(id, userId, input) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        const fieldMap = {
            name: 'name',
            platform: 'platform',
            website: 'website',
            notes: 'notes',
            isActive: 'is_active',
        };
        for (const [key, dbField] of Object.entries(fieldMap)) {
            if (input[key] !== undefined) {
                updates.push(`${dbField} = $${paramIndex++}`);
                values.push(input[key]);
            }
        }
        if (updates.length === 0) {
            return this.findById(id, userId);
        }
        values.push(id, userId);
        const { rows } = await (0, database_1.query)(`UPDATE competitors SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`, values);
        return rows.length > 0 ? rowToCompetitor(rows[0]) : null;
    }
    // Delete competitor
    static async delete(id, userId) {
        const { rowCount } = await (0, database_1.query)('DELETE FROM competitors WHERE id = $1 AND user_id = $2', [id, userId]);
        return rowCount > 0;
    }
}
exports.CompetitorModel = CompetitorModel;
class CompetitorPriceModel {
    // Add price record
    static async create(input) {
        const { rows } = await (0, database_1.query)(`INSERT INTO competitor_prices (product_id, competitor_id, price)
       VALUES ($1, $2, $3)
       RETURNING *`, [input.productId, input.competitorId, input.price]);
        return rowToCompetitorPrice(rows[0]);
    }
    // Get latest prices for a product
    static async getLatestPrices(productId) {
        const { rows } = await (0, database_1.query)(`SELECT cp.*, c.name as competitor_name, c.platform
       FROM competitor_prices cp
       INNER JOIN competitors c ON cp.competitor_id = c.id
       WHERE cp.product_id = $1
       AND cp.recorded_at = (
         SELECT MAX(recorded_at)
         FROM competitor_prices
         WHERE product_id = cp.product_id AND competitor_id = cp.competitor_id
       )
       ORDER BY cp.price ASC`, [productId]);
        return rows.map(row => ({
            ...rowToCompetitorPrice(row),
            competitorName: row.competitor_name,
            platform: row.platform,
        }));
    }
    // Get price history for a product-competitor pair
    static async getPriceHistory(productId, competitorId, days = 30) {
        const { rows } = await (0, database_1.query)(`SELECT * FROM competitor_prices
       WHERE product_id = $1 AND competitor_id = $2
       AND recorded_at >= NOW() - INTERVAL '${days} days'
       ORDER BY recorded_at DESC`, [productId, competitorId]);
        return rows.map(rowToCompetitorPrice);
    }
    // Get price comparison for a product
    static async getPriceComparison(productId, userPrice) {
        const latestPrices = await this.getLatestPrices(productId);
        if (latestPrices.length === 0) {
            return {
                yourPrice: userPrice,
                competitors: [],
                averageCompetitorPrice: 0,
                minPrice: userPrice,
                maxPrice: userPrice,
                pricePosition: 'average',
            };
        }
        const competitorPrices = latestPrices.map(cp => ({
            competitorId: cp.competitorId,
            competitorName: cp.competitorName,
            platform: cp.platform,
            price: cp.price,
            difference: cp.price - userPrice,
            differencePercent: ((cp.price - userPrice) / userPrice) * 100,
        }));
        const prices = competitorPrices.map(cp => cp.price);
        const allPrices = [userPrice, ...prices];
        const averageCompetitorPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        // Determine price position
        let pricePosition = 'middle';
        if (userPrice === minPrice && userPrice !== maxPrice) {
            pricePosition = 'lowest';
        }
        else if (userPrice === maxPrice && userPrice !== minPrice) {
            pricePosition = 'highest';
        }
        else if (Math.abs(userPrice - averageCompetitorPrice) / averageCompetitorPrice < 0.1) {
            pricePosition = 'average';
        }
        return {
            yourPrice: userPrice,
            competitors: competitorPrices,
            averageCompetitorPrice,
            minPrice,
            maxPrice,
            pricePosition,
        };
    }
}
exports.CompetitorPriceModel = CompetitorPriceModel;
//# sourceMappingURL=Competitor.js.map