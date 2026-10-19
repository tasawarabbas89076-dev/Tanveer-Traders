/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Admin Products Management API Handler
 */

import { dbGetProducts, dbCreateProduct, dbUpdateProduct, dbDeleteProduct } from '../../lib/supabase.js';
import { validateProductInput } from '../../lib/validation.js';

export async function handleAdminGetProducts(req, res) {
  try {
    const products = await dbGetProducts(false); // include inactive
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    console.error('Error fetching admin products:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve products' });
  }
}

export async function handleAdminCreateProduct(req, res) {
  try {
    const validation = validateProductInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const created = await dbCreateProduct(validation.data);
    return res.status(201).json({
      success: true,
      message: 'Product variant created successfully',
      data: created
    });
  } catch (err) {
    console.error('Error creating product:', err);
    return res.status(500).json({ success: false, error: 'Failed to create product variant' });
  }
}

export async function handleAdminUpdateProduct(req, res) {
  try {
    const { id } = req.params;
    const validation = validateProductInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const updated = await dbUpdateProduct(id, validation.data);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product variant not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Product variant updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating product:', err);
    return res.status(500).json({ success: false, error: 'Failed to update product variant' });
  }
}

export async function handleAdminDeleteProduct(req, res) {
  try {
    const { id } = req.params;
    const result = await dbDeleteProduct(id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Product variant not found' });
    }

    return res.status(200).json({
      success: true,
      message: result.deactivated ? 'Product variant was referenced by orders and was safely deactivated.' : 'Product variant deleted successfully.',
      result
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete product variant' });
  }
}
