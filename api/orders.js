/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Orders API Handler for Tanveer Traders
 */

import { dbCreateOrder, dbGetProducts, dbGetSettings } from '../lib/supabase.js';
import { validateOrderInput } from '../lib/validation.js';

// Simple in-memory rate limiting map for abuse protection
const orderRateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 15;

  const userRecord = orderRateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > userRecord.resetTime) {
    userRecord.count = 1;
    userRecord.resetTime = now + windowMs;
  } else {
    userRecord.count += 1;
  }

  orderRateLimitMap.set(ip, userRecord);
  return userRecord.count <= maxRequests;
}

export async function handleCreateOrder(req, res) {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a few minutes before submitting another order enquiry.'
      });
    }

    // Fetch authoritative active products to validate submitted prices/items
    const availableProducts = await dbGetProducts(true);
    const validation = validateOrderInput(req.body, availableProducts);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // Save order record to database
    const savedOrder = await dbCreateOrder(validation.data);
    const settings = await dbGetSettings();

    // Construct authoritative WhatsApp message format
    const lines = [
      `*TANVEER TRADERS - ORDER ENQUIRY*`,
      `*Location:* ${settings.location}`,
      ``,
      `*Customer Details:*`,
      `• Name: ${validation.data.customer_name}`,
      `• Phone: ${validation.data.display_phone || validation.data.customer_phone}`,
      `• City: ${validation.data.city}`,
      validation.data.delivery_address ? `• Delivery Address: ${validation.data.delivery_address}` : null,
      `• Order Type: ${validation.data.order_type.toUpperCase()}`,
      ``,
      `*Order Items:*`
    ].filter(Boolean);

    for (const item of validation.data.items) {
      if (item.price_type === 'quote_required' || item.unit_price_snapshot === null) {
        lines.push(`• ${item.product_name_snapshot} (${item.packaging_snapshot}) × ${item.quantity} [Rate on Request]`);
      } else {
        lines.push(`• ${item.product_name_snapshot} (${item.packaging_snapshot}) × ${item.quantity} @ PKR ${item.unit_price_snapshot.toLocaleString()} = PKR ${item.line_total.toLocaleString()}`);
      }
    }

    lines.push(``);

    if (validation.data.has_quote_required || validation.data.subtotal === null) {
      lines.push(`*Estimated Items Subtotal:* Rates to be confirmed`);
    } else {
      lines.push(`*Estimated Items Subtotal:* PKR ${validation.data.subtotal.toLocaleString()}`);
    }

    lines.push(`*Delivery Charges:* To be confirmed by Tanveer Traders`);
    lines.push(`*Final Total:* Subject to stock & mandi rates confirmation`);

    if (validation.data.order_notes) {
      lines.push(``);
      lines.push(`*Customer Notes:* ${validation.data.order_notes}`);
    }

    lines.push(``);
    lines.push(`_Please confirm product availability, today's current rate, and delivery details._`);

    const rawMessage = lines.join('\n');
    const waPhone = settings.whatsapp_international || '923271639095';
    const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(rawMessage)}`;

    return res.status(201).json({
      success: true,
      message: 'Order enquiry created successfully.',
      order: savedOrder,
      whatsappUrl,
      whatsappText: rawMessage
    });
  } catch (err) {
    console.error('Error handling order submission:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your order enquiry.'
    });
  }
}
