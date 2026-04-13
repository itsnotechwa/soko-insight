"use strict";
/**
 * Database Seed Script
 * Populates the database with test data for development and testing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const pricing_1 = require("../config/pricing");
async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');
    try {
        // Test database connection
        const connected = await (0, database_1.testConnection)();
        if (!connected) {
            throw new Error('Failed to connect to database');
        }
        // Get category IDs (system categories should already exist)
        const categoryResult = await (0, database_1.query)('SELECT id, name FROM categories WHERE is_system = true');
        const categories = categoryResult.rows;
        const categoryMap = {};
        categories.forEach((cat) => {
            categoryMap[cat.name] = cat.id;
        });
        console.log('📦 Found system categories:', Object.keys(categoryMap).length);
        // Create test users (one for each seller type)
        const testUsers = [
            {
                email: 'smalltrader@test.com',
                password: 'password123',
                businessName: 'Mwangi\'s Mini Shop',
                phone: '+254712345678',
                sellerType: 'small_trader',
            },
            {
                email: 'ecommerce@test.com',
                password: 'password123',
                businessName: 'Kenya E-Store',
                phone: '+254723456789',
                sellerType: 'ecommerce',
            },
            {
                email: 'wholesaler@test.com',
                password: 'password123',
                businessName: 'Bulk Traders Ltd',
                phone: '+254734567890',
                sellerType: 'wholesaler',
            },
        ];
        const seedData = [];
        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await (0, database_1.query)('SELECT id FROM users WHERE email = $1', [userData.email]);
            let userId;
            if (existingUser.rows.length > 0) {
                userId = existingUser.rows[0].id;
                console.log(`✓ User already exists: ${userData.email}`);
            }
            else {
                // Create user
                const passwordHash = await bcryptjs_1.default.hash(userData.password, 10);
                const userResult = await (0, database_1.query)(`INSERT INTO users (id, email, password_hash, business_name, phone, seller_type, subscription_tier, is_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`, [
                    (0, uuid_1.v4)(),
                    userData.email,
                    passwordHash,
                    userData.businessName,
                    userData.phone,
                    userData.sellerType,
                    (0, pricing_1.getDefaultSubscriptionTier)(userData.sellerType),
                    true,
                ]);
                userId = userResult.rows[0].id;
                console.log(`✓ Created user: ${userData.email} (${userData.sellerType})`);
            }
            // Create sales channels based on seller type
            const channelIds = [];
            if (userData.sellerType === 'small_trader') {
                // Small trader - offline channels
                const channels = [
                    { name: 'Main Shop', type: 'offline', platform: 'Shop' },
                    { name: 'Market Stall', type: 'offline', platform: 'Market' },
                ];
                for (const channel of channels) {
                    const channelResult = await (0, database_1.query)(`INSERT INTO sales_channels (id, user_id, channel_name, channel_type, platform)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING
             RETURNING id`, [(0, uuid_1.v4)(), userId, channel.name, channel.type, channel.platform]);
                    if (channelResult.rows.length > 0) {
                        channelIds.push(channelResult.rows[0].id);
                    }
                }
            }
            else if (userData.sellerType === 'ecommerce') {
                // E-commerce seller - online platforms
                const channels = [
                    { name: 'Jumia Store', type: 'online', platform: 'Jumia' },
                    { name: 'Kilimall Shop', type: 'online', platform: 'Kilimall' },
                    { name: 'Website', type: 'online', platform: 'Website' },
                ];
                for (const channel of channels) {
                    const channelResult = await (0, database_1.query)(`INSERT INTO sales_channels (id, user_id, channel_name, channel_type, platform)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING
             RETURNING id`, [(0, uuid_1.v4)(), userId, channel.name, channel.type, channel.platform]);
                    if (channelResult.rows.length > 0) {
                        channelIds.push(channelResult.rows[0].id);
                    }
                }
            }
            else {
                // Wholesaler - mixed channels
                const channels = [
                    { name: 'Wholesale Outlet', type: 'offline', platform: 'Warehouse' },
                    { name: 'Online Portal', type: 'online', platform: 'B2B Portal' },
                ];
                for (const channel of channels) {
                    const channelResult = await (0, database_1.query)(`INSERT INTO sales_channels (id, user_id, channel_name, channel_type, platform)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING
             RETURNING id`, [(0, uuid_1.v4)(), userId, channel.name, channel.type, channel.platform]);
                    if (channelResult.rows.length > 0) {
                        channelIds.push(channelResult.rows[0].id);
                    }
                }
            }
            // Get existing channels if they already exist
            if (channelIds.length === 0) {
                const existingChannels = await (0, database_1.query)('SELECT id FROM sales_channels WHERE user_id = $1', [userId]);
                channelIds.push(...existingChannels.rows.map((r) => r.id));
            }
            // Create products
            const productIds = [];
            const products = [
                {
                    name: 'Samsung Galaxy A14',
                    sku: 'SM-A14-001',
                    category: 'Electronics',
                    costPrice: 15000,
                    sellingPrice: 22000,
                    stock: 25,
                    reorderLevel: 10,
                },
                {
                    name: 'Nike Running Shoes',
                    sku: 'NIKE-RS-001',
                    category: 'Sports & Outdoors',
                    costPrice: 3500,
                    sellingPrice: 5500,
                    stock: 15,
                    reorderLevel: 5,
                },
                {
                    name: 'Cooking Oil (2L)',
                    sku: 'OIL-2L-001',
                    category: 'Food & Beverages',
                    costPrice: 250,
                    sellingPrice: 350,
                    stock: 100,
                    reorderLevel: 30,
                },
                {
                    name: 'Men\'s T-Shirt',
                    sku: 'TSHIRT-M-001',
                    category: 'Clothing & Fashion',
                    costPrice: 800,
                    sellingPrice: 1500,
                    stock: 50,
                    reorderLevel: 20,
                },
                {
                    name: 'Laptop Backpack',
                    sku: 'BAG-LAP-001',
                    category: 'Electronics',
                    costPrice: 1200,
                    sellingPrice: 2500,
                    stock: 30,
                    reorderLevel: 10,
                },
                {
                    name: 'Face Cream',
                    sku: 'BEAUTY-FC-001',
                    category: 'Health & Beauty',
                    costPrice: 500,
                    sellingPrice: 900,
                    stock: 40,
                    reorderLevel: 15,
                },
                {
                    name: 'Rice (5kg)',
                    sku: 'RICE-5KG-001',
                    category: 'Food & Beverages',
                    costPrice: 600,
                    sellingPrice: 850,
                    stock: 80,
                    reorderLevel: 25,
                },
                {
                    name: 'Wireless Mouse',
                    sku: 'MOUSE-WL-001',
                    category: 'Electronics',
                    costPrice: 800,
                    sellingPrice: 1500,
                    stock: 35,
                    reorderLevel: 12,
                },
            ];
            for (const product of products) {
                const categoryId = categoryMap[product.category] || null;
                const productResult = await (0, database_1.query)(`INSERT INTO products (id, user_id, category_id, name, sku, cost_price, selling_price, current_stock, reorder_level)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT DO NOTHING
           RETURNING id`, [
                    (0, uuid_1.v4)(),
                    userId,
                    categoryId,
                    product.name,
                    product.sku,
                    product.costPrice,
                    product.sellingPrice,
                    product.stock,
                    product.reorderLevel,
                ]);
                if (productResult.rows.length > 0) {
                    productIds.push(productResult.rows[0].id);
                }
            }
            // Get existing products if they already exist
            if (productIds.length === 0) {
                const existingProducts = await (0, database_1.query)('SELECT id FROM products WHERE user_id = $1 LIMIT 8', [userId]);
                productIds.push(...existingProducts.rows.map((r) => r.id));
            }
            // Create sales data for the last 90 days
            const today = new Date();
            const salesData = [];
            for (let i = 0; i < 90; i++) {
                const saleDate = new Date(today);
                saleDate.setDate(saleDate.getDate() - i);
                // Skip weekends for some randomness (50% chance)
                if (saleDate.getDay() === 0 || saleDate.getDay() === 6) {
                    if (Math.random() > 0.5)
                        continue;
                }
                // Generate 1-5 sales per day
                const salesCount = Math.floor(Math.random() * 5) + 1;
                for (let j = 0; j < salesCount; j++) {
                    const productId = productIds[Math.floor(Math.random() * productIds.length)];
                    const channelId = channelIds[Math.floor(Math.random() * channelIds.length)];
                    // Get product details
                    const productResult = await (0, database_1.query)('SELECT selling_price, cost_price FROM products WHERE id = $1', [productId]);
                    if (productResult.rows.length === 0)
                        continue;
                    const product = productResult.rows[0];
                    const quantity = Math.floor(Math.random() * 5) + 1;
                    const unitPrice = parseFloat(product.selling_price);
                    const totalAmount = unitPrice * quantity;
                    const costAmount = parseFloat(product.cost_price) * quantity;
                    const profitAmount = totalAmount - costAmount;
                    salesData.push({
                        id: (0, uuid_1.v4)(),
                        userId,
                        productId,
                        channelId,
                        saleDate: saleDate.toISOString().split('T')[0],
                        quantity,
                        unitPrice,
                        totalAmount,
                        costAmount,
                        profitAmount,
                        entryMethod: i < 30 ? 'manual' : 'csv', // Recent sales are manual, older ones from CSV
                    });
                }
            }
            // Insert sales data in batches
            if (salesData.length > 0) {
                const batchSize = 50;
                let insertedCount = 0;
                for (let i = 0; i < salesData.length; i += batchSize) {
                    const batch = salesData.slice(i, i + batchSize);
                    // Insert each sale individually to avoid SQL injection and complexity
                    for (const sale of batch) {
                        try {
                            await (0, database_1.query)(`INSERT INTO sales_data (id, user_id, product_id, channel_id, sale_date, quantity, unit_price, total_amount, cost_amount, profit_amount, entry_method)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT DO NOTHING`, [
                                sale.id,
                                sale.userId,
                                sale.productId,
                                sale.channelId,
                                sale.saleDate,
                                sale.quantity,
                                sale.unitPrice,
                                sale.totalAmount,
                                sale.costAmount,
                                sale.profitAmount,
                                sale.entryMethod,
                            ]);
                            insertedCount++;
                        }
                        catch (error) {
                            // Skip duplicates or errors
                            console.error('Error inserting sale:', error);
                        }
                    }
                }
                console.log(`  ✓ Created ${insertedCount} sales records`);
            }
            // Create competitors (for e-commerce seller)
            const competitorIds = [];
            if (userData.sellerType === 'ecommerce') {
                const competitors = [
                    { name: 'Tech Hub Kenya', platform: 'Jumia', website: 'https://jumia.co.ke/tech-hub' },
                    { name: 'Best Prices Online', platform: 'Kilimall', website: 'https://kilimall.co.ke/best-prices' },
                    { name: 'Gadget World', platform: 'Jumia', website: 'https://jumia.co.ke/gadget-world' },
                ];
                for (const competitor of competitors) {
                    const competitorResult = await (0, database_1.query)(`INSERT INTO competitors (id, user_id, name, platform, website)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING
             RETURNING id`, [(0, uuid_1.v4)(), userId, competitor.name, competitor.platform, competitor.website]);
                    if (competitorResult.rows.length > 0) {
                        competitorIds.push(competitorResult.rows[0].id);
                    }
                }
                // Create competitor prices for some products
                if (competitorIds.length > 0 && productIds.length > 0) {
                    const pricesToAdd = Math.min(5, productIds.length);
                    for (let i = 0; i < pricesToAdd; i++) {
                        const productId = productIds[i];
                        const competitorId = competitorIds[Math.floor(Math.random() * competitorIds.length)];
                        // Get product selling price
                        const productResult = await (0, database_1.query)('SELECT selling_price FROM products WHERE id = $1', [productId]);
                        if (productResult.rows.length > 0) {
                            const basePrice = parseFloat(productResult.rows[0].selling_price);
                            // Competitor price is 80-120% of our price
                            const competitorPrice = basePrice * (0.8 + Math.random() * 0.4);
                            await (0, database_1.query)(`INSERT INTO competitor_prices (id, product_id, competitor_id, price)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`, [(0, uuid_1.v4)(), productId, competitorId, competitorPrice]);
                        }
                    }
                    console.log(`  ✓ Created competitor price records`);
                }
            }
            seedData.push({
                userId,
                categoryIds: categoryMap,
                productIds,
                channelIds,
                competitorIds,
            });
            console.log(`\n✅ Completed seeding for ${userData.businessName}`);
        }
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 Test Accounts:');
        console.log('  1. Small Trader:');
        console.log('     Email: smalltrader@test.com');
        console.log('     Password: password123');
        console.log('\n  2. E-commerce Seller:');
        console.log('     Email: ecommerce@test.com');
        console.log('     Password: password123');
        console.log('\n  3. Wholesaler:');
        console.log('     Email: wholesaler@test.com');
        console.log('     Password: password123');
        console.log('\n✨ You can now log in and test the application!');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
    finally {
        await database_1.pool.end();
    }
}
// Run the seed script
seedDatabase()
    .then(() => {
    process.exit(0);
})
    .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map