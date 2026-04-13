# Test Data Guide

This document describes the test data that will be created when you run the seed script.

## Running the Seed Script

To populate your database with test data, run:

```bash
cd server
npm run db:seed
```

## Test Accounts

The seed script creates three test user accounts, one for each seller type:

### 1. Small Trader
- **Email:** `smalltrader@test.com`
- **Password:** `password123`
- **Business Name:** Mwangi's Mini Shop
- **Type:** Small Trader

**Features:**
- 2 offline sales channels (Main Shop, Market Stall)
- 8 products across various categories
- 90 days of sales history
- Realistic daily sales patterns

### 2. E-commerce Seller
- **Email:** `ecommerce@test.com`
- **Password:** `password123`
- **Business Name:** Kenya E-Store
- **Type:** E-commerce Seller

**Features:**
- 3 online sales channels (Jumia Store, Kilimall Shop, Website)
- 8 products
- 90 days of sales history
- 3 competitors with price tracking
- Competitor price data for testing price comparison

### 3. Wholesaler
- **Email:** `wholesaler@test.com`
- **Password:** `password123`
- **Business Name:** Bulk Traders Ltd
- **Type:** Wholesaler

**Features:**
- 2 mixed channels (Wholesale Outlet, Online Portal)
- 8 products with higher stock levels
- 90 days of sales history

## Test Products

Each user gets 8 products across different categories:

1. **Samsung Galaxy A14** (Electronics)
   - SKU: SM-A14-001
   - Cost: KES 15,000
   - Selling Price: KES 22,000
   - Stock: 25 units
   - Reorder Level: 10

2. **Nike Running Shoes** (Sports & Outdoors)
   - SKU: NIKE-RS-001
   - Cost: KES 3,500
   - Selling Price: KES 5,500
   - Stock: 15 units
   - Reorder Level: 5

3. **Cooking Oil (2L)** (Food & Beverages)
   - SKU: OIL-2L-001
   - Cost: KES 250
   - Selling Price: KES 350
   - Stock: 100 units
   - Reorder Level: 30

4. **Men's T-Shirt** (Clothing & Fashion)
   - SKU: TSHIRT-M-001
   - Cost: KES 800
   - Selling Price: KES 1,500
   - Stock: 50 units
   - Reorder Level: 20

5. **Laptop Backpack** (Electronics)
   - SKU: BAG-LAP-001
   - Cost: KES 1,200
   - Selling Price: KES 2,500
   - Stock: 30 units
   - Reorder Level: 10

6. **Face Cream** (Health & Beauty)
   - SKU: BEAUTY-FC-001
   - Cost: KES 500
   - Selling Price: KES 900
   - Stock: 40 units
   - Reorder Level: 15

7. **Rice (5kg)** (Food & Beverages)
   - SKU: RICE-5KG-001
   - Cost: KES 600
   - Selling Price: KES 850
   - Stock: 80 units
   - Reorder Level: 25

8. **Wireless Mouse** (Electronics)
   - SKU: MOUSE-WL-001
   - Cost: KES 800
   - Selling Price: KES 1,500
   - Stock: 35 units
   - Reorder Level: 12

## Sales Data

Each user has:
- **90 days** of historical sales data
- **1-5 sales per day** (randomly distributed)
- Sales distributed across all products and channels
- Realistic pricing and profit calculations
- Mix of manual and CSV entry methods (recent = manual, older = CSV)

## Competitors (E-commerce Seller Only)

The e-commerce seller account has 3 competitors:

1. **Tech Hub Kenya** (Jumia)
2. **Best Prices Online** (Kilimall)
3. **Gadget World** (Jumia)

Competitor prices are set for the first 5 products, with prices ranging from 80-120% of your selling price.

## Testing Features

With this test data, you can test:

- ✅ Dashboard with real analytics
- ✅ Product management
- ✅ Sales history and trends
- ✅ Channel performance comparison
- ✅ Analytics and reporting
- ✅ Competitor price tracking (e-commerce account)
- ✅ Price comparison features
- ✅ Demand forecasting (with 90 days of data)
- ✅ Inventory optimization
- ✅ Low stock alerts
- ✅ Recommendations engine

## Notes

- The seed script uses `ON CONFLICT DO NOTHING` to avoid duplicates if run multiple times
- All passwords are hashed using bcrypt
- Sales data includes realistic variations in quantities and dates
- Product prices are in Kenyan Shillings (KES)
- The script will show progress as it creates data

## Resetting Test Data

To reset and re-seed the database:

1. Clear existing data (optional, the seed script handles duplicates):
   ```sql
   -- WARNING: This will delete all data!
   TRUNCATE TABLE sales_data, competitor_prices, competitors, products, sales_channels, users CASCADE;
   ```

2. Run the seed script again:
   ```bash
   npm run db:seed
   ```

