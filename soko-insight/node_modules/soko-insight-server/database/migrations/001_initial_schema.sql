-- SokoInsight Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Create initial database tables for the platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    seller_type VARCHAR(50) NOT NULL CHECK (seller_type IN ('small_trader', 'ecommerce', 'wholesaler')),
    subscription_tier VARCHAR(50) DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'growth', 'pro')),
    language_preference VARCHAR(10) DEFAULT 'en' CHECK (language_preference IN ('en', 'sw')),
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_seller_type ON users(seller_type);

-- ============================================
-- SALES CHANNELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_name VARCHAR(255) NOT NULL,
    channel_type VARCHAR(50) NOT NULL CHECK (channel_type IN ('online', 'offline', 'mpesa')),
    platform VARCHAR(100), -- e.g., 'jumia', 'kilimall', 'shop', 'market'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_channels_user ON sales_channels(user_id);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT FALSE, -- System-wide categories vs user-created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_user ON categories(user_id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    cost_price DECIMAL(12, 2) DEFAULT 0,
    selling_price DECIMAL(12, 2) NOT NULL,
    current_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    unit VARCHAR(50) DEFAULT 'piece', -- piece, kg, litre, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);

-- ============================================
-- SALES DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES sales_channels(id) ON DELETE SET NULL,
    sale_date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    cost_amount DECIMAL(12, 2) DEFAULT 0,
    profit_amount DECIMAL(12, 2) DEFAULT 0,
    entry_method VARCHAR(50) DEFAULT 'manual' CHECK (entry_method IN ('manual', 'csv', 'mpesa', 'api', 'quick_entry')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_data_user ON sales_data(user_id);
CREATE INDEX idx_sales_data_product ON sales_data(product_id);
CREATE INDEX idx_sales_data_channel ON sales_data(channel_id);
CREATE INDEX idx_sales_data_date ON sales_data(sale_date);
CREATE INDEX idx_sales_data_user_date ON sales_data(user_id, sale_date);

-- ============================================
-- COMPETITORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(100),
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitors_user ON competitors(user_id);

-- ============================================
-- COMPETITOR PRICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitor_prices_product ON competitor_prices(product_id);
CREATE INDEX idx_competitor_prices_competitor ON competitor_prices(competitor_id);

-- ============================================
-- FORECASTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    predicted_demand INTEGER NOT NULL,
    confidence DECIMAL(5, 2), -- 0.00 to 1.00
    model_used VARCHAR(50) DEFAULT 'prophet',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forecasts_product ON forecasts(product_id);
CREATE INDEX idx_forecasts_date ON forecasts(forecast_date);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'alert', 'success')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('stock', 'sales', 'trend', 'competitor', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_email BOOLEAN DEFAULT FALSE,
    sent_sms BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================
-- UPLOAD HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS upload_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    records_imported INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_upload_history_user ON upload_history(user_id);

-- ============================================
-- REFRESH TOKENS TABLE (for JWT refresh)
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_channels_updated_at BEFORE UPDATE ON sales_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_data_updated_at BEFORE UPDATE ON sales_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT SYSTEM CATEGORIES
-- ============================================
INSERT INTO categories (id, name, is_system) VALUES
    (uuid_generate_v4(), 'Electronics', TRUE),
    (uuid_generate_v4(), 'Clothing & Fashion', TRUE),
    (uuid_generate_v4(), 'Food & Beverages', TRUE),
    (uuid_generate_v4(), 'Health & Beauty', TRUE),
    (uuid_generate_v4(), 'Home & Garden', TRUE),
    (uuid_generate_v4(), 'Sports & Outdoors', TRUE),
    (uuid_generate_v4(), 'Books & Stationery', TRUE),
    (uuid_generate_v4(), 'Automotive', TRUE),
    (uuid_generate_v4(), 'Baby & Kids', TRUE),
    (uuid_generate_v4(), 'Other', TRUE)
ON CONFLICT DO NOTHING;

