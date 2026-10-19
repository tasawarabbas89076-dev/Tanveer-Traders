/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Server and Client Data Validation for Tanveer Traders
 */

export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Phone number is required.' };
  }
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Pakistani numbers: 03XXXXXXXXX (11 digits), or +923XXXXXXXXX, 923XXXXXXXXX
  const pkRegex = /^(?:(?:\+?92)|0)?(3\d{9})$/;
  if (!pkRegex.test(cleaned)) {
    return {
      valid: false,
      message: 'Please provide a valid Pakistani mobile number (e.g., 03271639095 or 03XXXXXXXXX).'
    };
  }
  // Extract standard 10 digit subscriber number
  const match = cleaned.match(pkRegex);
  const normalized = match ? '92' + match[1] : cleaned;
  return { valid: true, normalized, original: phone.trim() };
}

export function validateOrderInput(data, availableProducts = []) {
  const errors = [];

  const customerName = sanitizeString(data.customer_name);
  if (!customerName || customerName.length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }

  const phoneValidation = validatePhone(data.customer_phone);
  if (!phoneValidation.valid) {
    errors.push(phoneValidation.message);
  }

  const city = sanitizeString(data.city);
  if (!city || city.length < 2) {
    errors.push('City is required.');
  }

  const orderType = data.order_type === 'wholesale' ? 'wholesale' : 'retail';

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one product variant must be selected.');
  }

  const validatedItems = [];
  let calculatedSubtotal = 0;
  let hasQuoteRequired = false;

  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Invalid quantity for item ${item.product_name || item.product_id || ''}.`);
        continue;
      }

      // Check against authoritative products if provided
      let matchedProduct = null;
      if (availableProducts && availableProducts.length > 0) {
        matchedProduct = availableProducts.find(p => String(p.id) === String(item.product_id));
      }

      const productName = matchedProduct ? matchedProduct.name : sanitizeString(item.product_name || 'Product');
      const packaging = matchedProduct ? matchedProduct.packaging : sanitizeString(item.packaging || 'Standard');
      const priceType = matchedProduct ? matchedProduct.price_type : (item.price_type || 'retail');
      const unitPrice = matchedProduct && matchedProduct.price !== null ? Number(matchedProduct.price) : (item.unit_price ? Number(item.unit_price) : null);

      if (priceType === 'quote_required' || unitPrice === null) {
        hasQuoteRequired = true;
        validatedItems.push({
          product_id: item.product_id,
          product_name_snapshot: productName,
          packaging_snapshot: packaging,
          quantity: qty,
          unit_price_snapshot: null,
          line_total: null,
          price_type: 'quote_required'
        });
      } else {
        const lineTotal = Math.round((unitPrice * qty) * 100) / 100;
        calculatedSubtotal += lineTotal;
        validatedItems.push({
          product_id: item.product_id,
          product_name_snapshot: productName,
          packaging_snapshot: packaging,
          quantity: qty,
          unit_price_snapshot: unitPrice,
          line_total: lineTotal,
          price_type: priceType
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      customer_name: customerName,
      customer_phone: phoneValidation.normalized || data.customer_phone,
      display_phone: data.customer_phone,
      city,
      delivery_address: sanitizeString(data.delivery_address || ''),
      order_notes: sanitizeString(data.order_notes || ''),
      order_type: orderType,
      items: validatedItems,
      subtotal: hasQuoteRequired ? null : calculatedSubtotal,
      has_quote_required: hasQuoteRequired
    }
  };
}

export function validateProductInput(data) {
  const errors = [];

  const name = sanitizeString(data.name);
  if (!name || name.length < 2) {
    errors.push('Product name is required.');
  }

  const category = data.category;
  if (category !== 'Rice' && category !== 'Sugar') {
    errors.push('Category must be either Rice or Sugar.');
  }

  const packaging = sanitizeString(data.packaging);
  if (!packaging) {
    errors.push('Packaging specification is required (e.g., 50 kg bag, 5 kg pack).');
  }

  const unit = sanitizeString(data.unit || 'kg');

  const priceType = data.price_type;
  if (!['retail', 'wholesale', 'quote_required'].includes(priceType)) {
    errors.push('Price type must be retail, wholesale, or quote_required.');
  }

  let price = null;
  if (priceType !== 'quote_required') {
    if (data.price === undefined || data.price === null || data.price === '') {
      errors.push('Price is required when price type is retail or wholesale.');
    } else {
      const num = Number(data.price);
      if (isNaN(num) || num < 0) {
        errors.push('Price must be a positive number.');
      } else {
        price = Math.round(num * 100) / 100;
      }
    }
  }

  const minQty = parseInt(data.minimum_quantity, 10);
  if (isNaN(minQty) || minQty < 1) {
    errors.push('Minimum quantity must be at least 1.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      name,
      category,
      description: sanitizeString(data.description || ''),
      packaging,
      unit,
      price,
      price_type: priceType,
      image_url: sanitizeString(data.image_url || ''),
      is_active: data.is_active !== false,
      minimum_quantity: isNaN(minQty) ? 1 : minQty
    }
  };
}

export function validateSettingsInput(data) {
  const errors = [];

  const businessName = sanitizeString(data.business_name);
  if (!businessName) errors.push('Business name is required.');

  const whatsapp = sanitizeString(data.whatsapp_number);
  if (!whatsapp) errors.push('WhatsApp number is required.');

  const location = sanitizeString(data.location);
  if (!location) errors.push('Location is required.');

  const currency = sanitizeString(data.currency || 'PKR');
  const samplePriceNotice = sanitizeString(data.sample_price_notice || 'Sample price — confirm current rate.');

  // Clean international format for WhatsApp URL
  const intlNumber = whatsapp.replace(/[^0-9]/g, '');

  return {
    valid: errors.length === 0,
    errors,
    data: {
      business_name: businessName,
      whatsapp_number: whatsapp,
      whatsapp_international: intlNumber.startsWith('0') ? '92' + intlNumber.substring(1) : (intlNumber.startsWith('92') ? intlNumber : '92' + intlNumber),
      location,
      currency,
      sample_price_notice: samplePriceNotice
    }
  };
}
