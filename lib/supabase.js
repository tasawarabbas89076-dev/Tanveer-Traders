/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Supabase Data Client with resilient fallback storage
 * Location: Khushab, Punjab, Pakistan
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_KEY && 
  SUPABASE_URL.startsWith('http') && 
  !SUPABASE_URL.includes('your-project-id')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    })
  : null;

// ============================================================
// Fallback In-Memory / File Store for seamless local preview
// ============================================================
const sampleProducts = [
  {
    id: 'prod-rice-01',
    name: 'Basmati Rice (Retail Pack)',
    category: 'Rice',
    description: 'Aromatic long-grain Basmati rice packaged for household and retail grocery use.',
    packaging: '5 kg pack',
    unit: 'pack',
    price: 1750.00,
    price_type: 'retail',
    image_url: '/assets/images/product-basmati-rice.jpg',
    is_active: true,
    minimum_quantity: 1,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'prod-rice-02',
    name: 'Basmati Rice (Wholesale Bag)',
    category: 'Rice',
    description: 'Long-grain Basmati rice in bulk packaging suitable for shopkeepers, catering, and wholesale buyers.',
    packaging: '50 kg bag',
    unit: 'bag',
    price: 16500.00,
    price_type: 'wholesale',
    image_url: '/assets/images/product-basmati-rice.jpg',
    is_active: true,
    minimum_quantity: 1,
    created_at: new Date('2026-01-02T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00Z').toISOString()
  },
  {
    id: 'prod-rice-03',
    name: 'Non-Basmati Rice (Retail Pack)',
    category: 'Rice',
    description: 'Standard quality non-Basmati rice suitable for everyday cooking and commercial kitchens.',
    packaging: '10 kg pack',
    unit: 'pack',
    price: 2100.00,
    price_type: 'retail',
    image_url: '/assets/images/product-basmati-rice.jpg',
    is_active: true,
    minimum_quantity: 1,
    created_at: new Date('2026-01-03T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-03T00:00:00Z').toISOString()
  },
  {
    id: 'prod-rice-04',
    name: 'Non-Basmati Rice (Wholesale Bag)',
    category: 'Rice',
    description: 'Commercial grade non-Basmati rice in heavy-duty bulk bags for wholesale and commercial orders.',
    packaging: '50 kg bag',
    unit: 'bag',
    price: 9800.00,
    price_type: 'wholesale',
    image_url: '/assets/images/product-basmati-rice.jpg',
    is_active: true,
    minimum_quantity: 1,
    created_at: new Date('2026-01-04T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-04T00:00:00Z').toISOString()
  },
  {
    id: 'prod-sugar-01',
    name: 'Refined White Sugar (Retail Pack)',
    category: 'Sugar',
    description: 'Clean, pure granulated white sugar in sealed retail packaging for household consumption.',
    packaging: '5 kg pack',
    unit: 'pack',
    price: 750.00,
    price_type: 'retail',
    image_url: '/assets/images/product-refined-sugar.jpg',
    is_active: true,
    minimum_quantity: 1,
    created_at: new Date('2026-01-05T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-05T00:00:00Z').toISOString()
  },
  {
    id: 'prod-sugar-02',
    name: 'Refined White Sugar (Wholesale Bag)',
    category: 'Sugar',
    description: 'Commercial bulk white granulated sugar bag for confectioneries, retailers, and wholesalers.',
    packaging: '50 kg bag',
    unit: 'bag',
    price: 7100.00,
    price_type: 'wholesale',
    image_url: '/assets/images/product-refined-sugar.jpg',
    is_active: true,
    minimum_quantity: 1,
    created_at: new Date('2026-01-06T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-06T00:00:00Z').toISOString()
  },
  {
    id: 'prod-sugar-03',
    name: 'Commercial Sugar (Bulk Order)',
    category: 'Sugar',
    description: 'High-volume wholesale sugar supply for bulk buyers, bakeries, and industrial food producers. Rates updated daily based on mandi rates.',
    packaging: 'Custom Bulk (Tonnes)',
    unit: 'tonne',
    price: null,
    price_type: 'quote_required',
    image_url: '/assets/images/product-refined-sugar.jpg',
    is_active: true,
    minimum_quantity: 1,
    created_at: new Date('2026-01-07T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-07T00:00:00Z').toISOString()
  }
];

let localProducts = [...sampleProducts];
let localOrders = [];
let localSettings = {
  id: 'default',
  business_name: 'Tanveer Traders',
  whatsapp_number: '03271639095',
  whatsapp_international: '923271639095',
  location: 'Khushab, Punjab, Pakistan',
  currency: 'PKR',
  sample_price_notice: 'Sample price — confirm current rate.',
  updated_at: new Date().toISOString()
};

// ============================================================
// Unified Database Operations (Supabase or Local Fallback)
// ============================================================

export async function dbGetProducts(onlyActive = true) {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: true });
      if (onlyActive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data) return data;
      console.warn('Supabase query error in dbGetProducts:', error?.message);
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local memory:', err.message);
    }
  }

  // Local fallback
  return onlyActive ? localProducts.filter(p => p.is_active) : [...localProducts];
}

export async function dbGetProductById(id) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase fetch product failed:', err.message);
    }
  }

  return localProducts.find(p => String(p.id) === String(id)) || null;
}

export async function dbCreateProduct(productData) {
  const newProduct = {
    id: isSupabaseConfigured ? undefined : `prod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    ...productData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('products').insert([productData]).select().single();
      if (!error && data) return data;
      throw new Error(error?.message || 'Failed to insert product into Supabase');
    } catch (err) {
      console.warn('Supabase insert failed, saving to local store:', err.message);
    }
  }

  localProducts.push(newProduct);
  return newProduct;
}

export async function dbUpdateProduct(id, updates) {
  const updatePayload = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('products').update(updatePayload).eq('id', id).select().single();
      if (!error && data) return data;
      throw new Error(error?.message || 'Failed to update product in Supabase');
    } catch (err) {
      console.warn('Supabase update failed, updating local store:', err.message);
    }
  }

  const index = localProducts.findIndex(p => String(p.id) === String(id));
  if (index === -1) return null;
  localProducts[index] = { ...localProducts[index], ...updatePayload };
  return localProducts[index];
}

export async function dbDeleteProduct(id) {
  // Check if used in local orders
  const isUsed = localOrders.some(o => 
    o.items_json && o.items_json.some(item => String(item.product_id) === String(id))
  );

  if (isSupabaseConfigured) {
    try {
      // If referenced, deactivate instead of deleting to avoid foreign key failure
      if (isUsed) {
        const { data } = await supabase.from('products').update({ is_active: false }).eq('id', id).select().single();
        return { deactivated: true, data };
      }
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) return { deleted: true };
    } catch (err) {
      console.warn('Supabase delete failed, operating on local store:', err.message);
    }
  }

  const index = localProducts.findIndex(p => String(p.id) === String(id));
  if (index === -1) return null;

  if (isUsed) {
    localProducts[index].is_active = false;
    return { deactivated: true, data: localProducts[index] };
  } else {
    localProducts.splice(index, 1);
    return { deleted: true };
  }
}

export async function dbCreateOrder(orderData) {
  const orderId = isSupabaseConfigured ? undefined : `ord-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const record = {
    id: orderId,
    customer_name: orderData.customer_name,
    customer_phone: orderData.customer_phone,
    city: orderData.city,
    delivery_address: orderData.delivery_address || null,
    order_notes: orderData.order_notes || null,
    order_type: orderData.order_type,
    items_json: orderData.items,
    subtotal: orderData.subtotal,
    status: 'New enquiry',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('orders').insert([{
        customer_name: record.customer_name,
        customer_phone: record.customer_phone,
        city: record.city,
        delivery_address: record.delivery_address,
        order_notes: record.order_notes,
        order_type: record.order_type,
        items_json: record.items_json,
        subtotal: record.subtotal,
        status: record.status
      }]).select().single();

      if (!error && data) {
        // Also insert normalized order_items if supported
        if (Array.isArray(orderData.items) && orderData.items.length > 0) {
          const itemsPayload = orderData.items.map(item => ({
            order_id: data.id,
            product_id: item.product_id && item.product_id.length > 20 ? item.product_id : null,
            product_name_snapshot: item.product_name_snapshot,
            packaging_snapshot: item.packaging_snapshot,
            quantity: item.quantity,
            unit_price_snapshot: item.unit_price_snapshot,
            line_total: item.line_total
          }));
          await supabase.from('order_items').insert(itemsPayload);
        }
        return data;
      }
    } catch (err) {
      console.warn('Supabase create order failed, saving locally:', err.message);
    }
  }

  localOrders.unshift(record);
  return record;
}

export async function dbGetOrders() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase get orders failed:', err.message);
    }
  }

  return [...localOrders];
}

export async function dbUpdateOrderStatus(id, status) {
  const allowed = ['New enquiry', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'];
  if (!allowed.includes(status)) {
    throw new Error('Invalid order status');
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase update order status failed:', err.message);
    }
  }

  const order = localOrders.find(o => String(o.id) === String(id));
  if (!order) return null;
  order.status = status;
  order.updated_at = new Date().toISOString();
  return order;
}

export async function dbGetSettings() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('store_settings').select('*').eq('id', 'default').single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase get settings failed:', err.message);
    }
  }

  return { ...localSettings };
}

export async function dbUpdateSettings(settingsData) {
  const updatePayload = {
    ...settingsData,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .upsert({ id: 'default', ...updatePayload })
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase update settings failed:', err.message);
    }
  }

  localSettings = { ...localSettings, ...updatePayload };
  return localSettings;
}
