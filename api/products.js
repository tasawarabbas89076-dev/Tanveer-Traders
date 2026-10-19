/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Public Products API Handler
 */

import { dbGetProducts, dbGetProductById } from '../lib/supabase.js';

export async function handleGetProducts(req, res) {
  try {
    const products = await dbGetProducts(true);
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve products'
    });
  }
}

export async function handleGetProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await dbGetProductById(id);
    if (!product || !product.is_active) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or inactive'
      });
    }
    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Error fetching product by id:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve product details'
    });
  }
}
