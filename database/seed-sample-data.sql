-- ============================================================
-- Tanveer Traders - Seed Sample Data
-- Rice and Sugar catalog variants with sample placeholder prices
-- ============================================================

-- Clear existing data safely
TRUNCATE TABLE order_items, orders, products, store_settings CASCADE;

-- Insert default store settings
INSERT INTO store_settings (
    id,
    business_name,
    whatsapp_number,
    whatsapp_international,
    location,
    currency,
    sample_price_notice
) VALUES (
    'default',
    'Tanveer Traders',
    '03271639095',
    '923271639095',
    'Khushab, Punjab, Pakistan',
    'PKR',
    'Sample price — confirm current rate.'
) ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    whatsapp_number = EXCLUDED.whatsapp_number,
    whatsapp_international = EXCLUDED.whatsapp_international,
    location = EXCLUDED.location;

-- Insert Rice variants
INSERT INTO products (
    name,
    category,
    description,
    packaging,
    unit,
    price,
    price_type,
    image_url,
    is_active,
    minimum_quantity
) VALUES
-- 1. Basmati Rice - Retail Pack
(
    'Basmati Rice (Retail Pack)',
    'Rice',
    'Aromatic long-grain Basmati rice packaged for household and retail grocery use.',
    '5 kg pack',
    'pack',
    1750.00,
    'retail',
    '/assets/images/product-basmati-rice.jpg',
    true,
    1
),
-- 2. Basmati Rice - Wholesale Bag
(
    'Basmati Rice (Wholesale Bag)',
    'Rice',
    'Long-grain Basmati rice in bulk packaging suitable for shopkeepers, catering, and wholesale buyers.',
    '50 kg bag',
    'bag',
    16500.00,
    'wholesale',
    '/assets/images/product-basmati-rice.jpg',
    true,
    1
),
-- 3. Non-Basmati Rice - Retail Pack
(
    'Non-Basmati Rice (Retail Pack)',
    'Rice',
    'Standard quality non-Basmati rice suitable for everyday cooking and commercial kitchens.',
    '10 kg pack',
    'pack',
    2100.00,
    'retail',
    '/assets/images/product-basmati-rice.jpg',
    true,
    1
),
-- 4. Non-Basmati Rice - Bulk Wholesale Bag
(
    'Non-Basmati Rice (Wholesale Bag)',
    'Rice',
    'Commercial grade non-Basmati rice in heavy-duty bulk bags for wholesale and commercial orders.',
    '50 kg bag',
    'bag',
    9800.00,
    'wholesale',
    '/assets/images/product-basmati-rice.jpg',
    true,
    1
),
-- 5. Refined White Sugar - Small Retail Pack
(
    'Refined White Sugar (Retail Pack)',
    'Sugar',
    'Clean, pure granulated white sugar in sealed retail packaging for household consumption.',
    '5 kg pack',
    'pack',
    750.00,
    'retail',
    '/assets/images/product-refined-sugar.jpg',
    true,
    1
),
-- 6. Refined White Sugar - Wholesale Bag
(
    'Refined White Sugar (Wholesale Bag)',
    'Sugar',
    'Commercial bulk white granulated sugar bag for confectioneries, retailers, and wholesalers.',
    '50 kg bag',
    'bag',
    7100.00,
    'wholesale',
    '/assets/images/product-refined-sugar.jpg',
    true,
    1
),
-- 7. Commercial Sugar - High-Volume Bulk
(
    'Commercial Sugar (Bulk Order)',
    'Sugar',
    'High-volume wholesale sugar supply for bulk buyers, bakeries, and industrial food producers. Rates updated daily based on mandi rates.',
    'Custom Bulk (Tonnes)',
    'tonne',
    NULL,
    'quote_required',
    '/assets/images/product-refined-sugar.jpg',
    true,
    1
);
