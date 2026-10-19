-- ============================================================
-- Tanveer Traders - Database Schema (PostgreSQL / Supabase)
-- Rice & Sugar Wholesale and Retail Management System
-- Location: Khushab, Punjab, Pakistan
-- ============================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Rice', 'Sugar')),
    description TEXT,
    packaging VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'kg',
    price NUMERIC(12, 2) NULL,
    price_type VARCHAR(30) NOT NULL DEFAULT 'retail' CHECK (price_type IN ('retail', 'wholesale', 'quote_required')),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    minimum_quantity INTEGER NOT NULL DEFAULT 1 CHECK (minimum_quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for public catalog queries
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- 2. Orders Table (Enquiries submitted via web before or alongside WhatsApp)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    delivery_address TEXT,
    order_notes TEXT,
    order_type VARCHAR(30) NOT NULL DEFAULT 'retail' CHECK (order_type IN ('retail', 'wholesale')),
    items_json JSONB NOT NULL,
    subtotal NUMERIC(12, 2) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'New enquiry' CHECK (status IN ('New enquiry', 'Contacted', 'Confirmed', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 3. Normalized Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    packaging_snapshot VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(12, 2) NULL,
    line_total NUMERIC(12, 2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 4. Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    business_name VARCHAR(255) NOT NULL DEFAULT 'Tanveer Traders',
    whatsapp_number VARCHAR(50) NOT NULL DEFAULT '03271639095',
    whatsapp_international VARCHAR(50) NOT NULL DEFAULT '923271639095',
    location VARCHAR(255) NOT NULL DEFAULT 'Khushab, Punjab, Pakistan',
    currency VARCHAR(20) NOT NULL DEFAULT 'PKR',
    sample_price_notice TEXT NOT NULL DEFAULT 'Sample price — confirm current rate.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_settings_updated_at ON store_settings;
CREATE TRIGGER trigger_settings_updated_at
BEFORE UPDATE ON store_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
