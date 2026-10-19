-- ============================================================
-- Tanveer Traders - Row Level Security (RLS) Policies
-- Strict access control for Supabase PostgreSQL
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 1. PRODUCTS POLICIES
-- ------------------------------------------------------------
-- Public visitors can only view active products
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products"
ON products
FOR SELECT
TO public
USING (is_active = true);

-- Authenticated administrators have full CRUD permissions
DROP POLICY IF EXISTS "Authenticated admins can manage products" ON products;
CREATE POLICY "Authenticated admins can manage products"
ON products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. STORE SETTINGS POLICIES
-- ------------------------------------------------------------
-- Public can read store settings (business name, WhatsApp number, disclaimer)
DROP POLICY IF EXISTS "Public can view store settings" ON store_settings;
CREATE POLICY "Public can view store settings"
ON store_settings
FOR SELECT
TO public
USING (true);

-- Authenticated admins can update store settings
DROP POLICY IF EXISTS "Authenticated admins can update store settings" ON store_settings;
CREATE POLICY "Authenticated admins can update store settings"
ON store_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------
-- 3. ORDERS POLICIES
-- ------------------------------------------------------------
-- Anonymous visitors can submit new order enquiries only
-- They cannot read existing customer orders
DROP POLICY IF EXISTS "Anyone can submit an order enquiry" ON orders;
CREATE POLICY "Anyone can submit an order enquiry"
ON orders
FOR INSERT
TO public
WITH CHECK (true);

-- Only authenticated admins can read, update, or delete orders
DROP POLICY IF EXISTS "Authenticated admins can manage orders" ON orders;
CREATE POLICY "Authenticated admins can manage orders"
ON orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------
-- 4. ORDER ITEMS POLICIES
-- ------------------------------------------------------------
-- Public can insert items during order creation
DROP POLICY IF EXISTS "Anyone can submit order items" ON order_items;
CREATE POLICY "Anyone can submit order items"
ON order_items
FOR INSERT
TO public
WITH CHECK (true);

-- Authenticated admins can view and manage order items
DROP POLICY IF EXISTS "Authenticated admins can manage order items" ON order_items;
CREATE POLICY "Authenticated admins can manage order items"
ON order_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
