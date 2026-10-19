/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Admin Orders Management API Handler
 */

import { dbGetOrders, dbUpdateOrderStatus } from '../../lib/supabase.js';

export async function handleAdminGetOrders(req, res) {
  try {
    const orders = await dbGetOrders();
    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve orders' });
  }
}

export async function handleAdminUpdateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const updated = await dbUpdateOrderStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`,
      data: updated
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to update order' });
  }
}
